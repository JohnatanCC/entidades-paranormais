// A luz das lâmpadas "assada" (a etapa 3b da iluminação): quanto de luz de cada lâmpada do mapa chega num ponto do
// cenário, com as paredes e os pisos bloqueando. A malha do mapa guarda isso em cada vértice (editor/wallMesh.ts) e, nos
// níveis Baixo e Médio, o cenário usa essa cor no lugar das lâmpadas de verdade: a lâmpada não clareia mais o cômodo
// vizinho e o cenário deixa de fazer a conta de todas as lâmpadas em cada pixel. Não fica gravado no mapa: é calculado
// das paredes, dos pisos e dos objetos de luz toda vez que a malha é montada.
// São duas cores por vértice: a das lâmpadas normais e a das que estão "falhando" (o jogo multiplica essa por um
// pisca-pisca só: render/assada.ts). A conta é a mesma da luz pontual do three, para os dois caminhos ficarem parecidos.
// O que passa e o que bloqueia: parede bloqueia (a janela também); porta e vão deixam passar (aberta ou fechada: a
// porta muda durante o jogo e a malha não é refeita); o piso de um andar bloqueia a luz do outro (onde não tem piso,
// como no pé-direito duplo, passa).
import * as THREE from 'three'
import { OBJETOS } from './objetos'
import { LEVEL_H, type Chunk } from './types'

type V3 = [number, number, number]
interface Lampada { x: number; y: number; z: number; level: number; r: number; g: number; b: number; alcance: number; pisca: boolean }

const DECAIMENTO = 1.6 // o mesmo das lâmpadas de verdade (editor/Objetos.tsx)
const rad = (v: number) => (v * Math.PI) / 180

/** Soma em `fixa` e `pisca` (r, g, b) a luz que chega no ponto p, de normal n. `de` = um ponto um pouco para dentro da
 *  face (é dele que se olha para a lâmpada: o vértice mesmo fica em cima da linha da parede). */
export type Assador = (p: V3, n: V3, de: V3, level: number, fixa: V3, pisca: V3) => void

export function assadorDe(chunks: Chunk[]): Assador {
  const paredes = new Set<string>(), pisos = new Set<string>(), portas = new Set<string>(), lampadas: Lampada[] = []
  const e = new THREE.Euler(), v = new THREE.Vector3(), cor = new THREE.Color()
  for (const c of chunks) {
    for (const o of c.openings) if (o.kind === 'porta') for (let i = 0; i < o.width; i++) portas.add(`${o.level}|${o.axis}|${o.axis === 'x' ? o.x + i : o.x}|${o.axis === 'z' ? o.z + i : o.z}`)
    for (const f of c.floors) pisos.add(`${f.level}|${f.x}|${f.z}`)
    for (const p of c.props) {
      const l = OBJETOS[p.type]?.luz, modo = (p.params?.modo as string) ?? 'normal'
      if (!l || modo === 'apagada') continue
      v.set(...l.pos).applyEuler(e.set(rad(p.rot[0]), rad(p.rot[1]), rad(p.rot[2]), 'YXZ'))
      cor.set(l.cor ?? '#e0a050').multiplyScalar(l.forca ?? 6)
      const y = p.pos[1] + v.y
      lampadas.push({ x: p.pos[0] + v.x, y, z: p.pos[2] + v.z, level: Math.max(0, Math.floor((y - 0.05) / LEVEL_H)), r: cor.r, g: cor.g, b: cor.b, alcance: l.alcance ?? 7, pisca: modo === 'falhando' })
    }
  }
  for (const c of chunks) for (const w of c.walls) { const k = `${w.level}|${w.axis}|${w.x}|${w.z}`; if (!portas.has(k)) paredes.add(k) }

  /** Do ponto (x0, z0) até (x1, z1), no andar L: alguma parede no caminho? */
  function tapado(L: number, x0: number, z0: number, x1: number, z1: number) {
    const dx = x1 - x0, dz = z1 - z0
    // cada linha da grade que o caminho cruza: tem um pedaço de parede bem ali?
    for (let i = Math.floor(Math.min(x0, x1)) + 1; i <= Math.floor(Math.max(x0, x1)); i++) if (paredes.has(`${L}|z|${i}|${Math.floor(z0 + ((i - x0) / dx) * dz)}`)) return true
    for (let j = Math.floor(Math.min(z0, z1)) + 1; j <= Math.floor(Math.max(z0, z1)); j++) if (paredes.has(`${L}|x|${Math.floor(x0 + ((j - z0) / dz) * dx)}|${j}`)) return true
    return false
  }

  return (p, n, de, level, fixa, pisca) => {
    for (const l of lampadas) {
      const lx = l.x - p[0], ly = l.y - p[1], lz = l.z - p[2], d2 = lx * lx + ly * ly + lz * lz
      if (d2 >= l.alcance * l.alcance) continue
      const d = Math.sqrt(d2) || 1e-4, nl = (n[0] * lx + n[1] * ly + n[2] * lz) / d
      if (nl <= 0) continue
      // em andares diferentes: o piso no meio bloqueia (em cima do ponto ou embaixo da lâmpada)
      if (l.level !== level) {
        let piso = false
        for (let L = Math.min(l.level, level) + 1; L <= Math.max(l.level, level) && !piso; L++) piso = pisos.has(`${L}|${Math.floor(de[0])}|${Math.floor(de[2])}`) || pisos.has(`${L}|${Math.floor(l.x)}|${Math.floor(l.z)}`)
        if (piso) continue
      }
      if (tapado(level, de[0], de[2], l.x, l.z) || (l.level !== level && tapado(l.level, de[0], de[2], l.x, l.z))) continue
      // a mesma queda da luz pontual do three: 1 / d^decaimento, apagando até o alcance
      const q = d / l.alcance, corte = Math.max(0, 1 - q * q * q * q), k = (nl * corte * corte) / Math.max(d ** DECAIMENTO, 0.01)
      const para = l.pisca ? pisca : fixa
      para[0] += l.r * k; para[1] += l.g * k; para[2] += l.b * k
    }
  }
}
