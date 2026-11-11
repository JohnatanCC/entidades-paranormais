// A luz "assada" (a etapa 3b da iluminação): quanto de luz de cada lâmpada e de cada janela do mapa chega num ponto
// do cenário, com as paredes e os pisos bloqueando. A malha do mapa guarda isso em cada vértice (editor/wallMesh.ts).
// Não fica gravado no mapa: é calculado das paredes, dos pisos, das janelas e dos objetos de luz ao montar a malha.
//   - as lâmpadas: no Baixo e no Médio o cenário usa essa luz no lugar das lâmpadas de verdade; no Alto, só as lâmpadas
//     que fazem sombra são de verdade, e as outras vêm daqui (assim nenhuma vaza pela parede: render/assada.ts). Para
//     o jogo poder tirar da conta as que são de verdade, cada vértice guarda as duas lâmpadas mais fortes nele com o
//     número de cada uma (idLampada), e o resto somado. O número negativo marca a lâmpada "falhando" (pisca).
//   - as janelas com luar: iluminam o cômodo de verdade (o feixe e a mancha de editor/Luar.tsx são só o desenho);
//     valem em todos os níveis.
// A conta é a mesma da luz pontual do three, para os caminhos ficarem parecidos.
// O que passa e o que bloqueia: parede bloqueia (a janela também); porta e vão deixam passar só pelo buraco deles (a
// parede em cima da porta bloqueia), com a porta aberta ou fechada (ela muda durante o jogo e a malha não é refeita);
// o piso de um andar bloqueia a luz do outro (onde não tem piso, como no pé-direito duplo, passa).
import * as THREE from 'three'
import { FORCA_LUZ, OBJETOS } from './objetos'
import { LEVEL_H, PORTA_GRANDE_H, PORTA_H, type Chunk } from './types'

type V3 = [number, number, number]
type V4 = [number, number, number, number]
interface Fonte { x: number; y: number; z: number; level: number; r: number; g: number; b: number; alcance: number; id: number; dentro?: V3 }

const DECAIMENTO = 1.6 // o mesmo das lâmpadas de verdade (editor/Objetos.tsx)
/** A luz de uma janela com luar: a cor, a força por metro de largura, o alcance e a que altura fica o meio dela (m). */
export const JANELA = { cor: '#a9c2f0', forca: 5, alcance: 8, altura: 1.5 }
const rad = (v: number) => (v * Math.PI) / 180

/** O número de uma lâmpada pela posição dela no mundo (o mesmo aqui e na lâmpada de verdade: editor/Objetos.tsx). */
export const idLampada = (x: number, y: number, z: number) => 1 + ((((Math.round(x * 20) * 73856093) ^ (Math.round(y * 20) * 19349663) ^ (Math.round(z * 20) * 83492791)) >>> 0) % 60000)

/** A luz de um vértice: as duas lâmpadas mais fortes (r, g, b, número), o resto das lâmpadas somado e a das janelas. */
export interface LuzVertice { a: V4; b: V4; resto: V3; janela: V3 }
export const novaLuzVertice = (): LuzVertice => ({ a: [0, 0, 0, 0], b: [0, 0, 0, 0], resto: [0, 0, 0], janela: [0, 0, 0] })

/** Calcula em `out` a luz que chega no ponto p, de normal n. `de` = um ponto um pouco para dentro da face (é dele que
 *  se olha para a fonte: o vértice mesmo fica em cima da linha da parede).
 *  n = null: a amostra de um objeto inteiro (um móvel, o agente), sem direção: metade da luz de cada fonte que o vê. */
export type Assador = (p: V3, n: V3 | null, de: V3, level: number, out: LuzVertice) => void

export function assadorDe(chunks: Chunk[]): Assador {
  const paredes = new Set<string>(), pisos = new Set<string>(), portas = new Map<string, number>(), fontes: Fonte[] = [] // portas: a altura do buraco de cada pedaço
  const e = new THREE.Euler(), v = new THREE.Vector3(), cor = new THREE.Color()
  for (const c of chunks) {
    for (const f of c.floors) pisos.add(`${f.level}|${f.x}|${f.z}`)
    for (const o of c.openings) {
      if (o.kind === 'porta') for (let i = 0; i < o.width; i++) portas.set(`${o.level}|${o.axis}|${o.axis === 'x' ? o.x + i : o.x}|${o.axis === 'z' ? o.z + i : o.z}`, o.door === 'grande' ? PORTA_GRANDE_H : PORTA_H)
      else if (o.light2d !== false) {
        // a janela com luar: uma luz no meio dela, um pouco para dentro, que só ilumina o lado de dentro
        const s = (o.lado ?? 'b') === 'b' ? 1 : -1, m = o.width / 2
        const dentro: V3 = o.axis === 'x' ? [0, 0, s] : [s, 0, 0]
        cor.set(JANELA.cor).multiplyScalar(JANELA.forca * o.width)
        fontes.push({ x: o.axis === 'x' ? o.x + m : o.x + s * 0.3, y: o.level * LEVEL_H + JANELA.altura, z: o.axis === 'z' ? o.z + m : o.z + s * 0.3,
          level: o.level, r: cor.r, g: cor.g, b: cor.b, alcance: JANELA.alcance, id: 0, dentro })
      }
    }
    for (const p of c.props) {
      const l = OBJETOS[p.type]?.luz, modo = (p.params?.modo as string) ?? 'normal'
      if (!l || modo === 'apagada') continue
      v.set(...l.pos).applyEuler(e.set(rad(p.rot[0]), rad(p.rot[1]), rad(p.rot[2]), 'YXZ'))
      cor.set(l.cor ?? FORCA_LUZ.cor).multiplyScalar(l.forca ?? FORCA_LUZ.forca)
      const x = p.pos[0] + v.x, y = p.pos[1] + v.y, z = p.pos[2] + v.z
      fontes.push({ x, y, z, level: Math.max(0, Math.floor((y - 0.05) / LEVEL_H)), r: cor.r, g: cor.g, b: cor.b, alcance: l.alcance ?? FORCA_LUZ.alcance,
        id: idLampada(x, y, z) * (modo === 'falhando' ? -1 : 1) })
    }
  }
  // o buraco da escada: o piso de cima continua no mapa, mas não existe ali (não bloqueia a luz de quem está em cima)
  for (const c of chunks) for (const st of c.stairs) for (let x = st.x; x < st.x + st.w; x++) for (let z = st.z; z < st.z + st.d; z++) pisos.delete(`${st.level + 1}|${x}|${z}`)
  for (const c of chunks) for (const w of c.walls) { const k = `${w.level}|${w.axis}|${w.x}|${w.z}`; if (!portas.has(k)) paredes.add(k) }

  /** Do ponto 0 até o ponto 1, no andar L: alguma parede no caminho? */
  function tapado(L: number, x0: number, y0: number, z0: number, x1: number, y1: number, z1: number) {
    const dx = x1 - x0, dy = y1 - y0, dz = z1 - z0, chao = L * LEVEL_H
    // o pedaço de parede k, cruzado na fração t do caminho: bloqueia se é parede inteira, ou se tem porta e o caminho
    // passa por cima do buraco dela
    const bate = (k: string, t: number) => { if (paredes.has(k)) return true; const h = portas.get(k); return h !== undefined && y0 + t * dy - chao > h }
    // cada linha da grade que o caminho cruza: tem um pedaço de parede bem ali?
    for (let i = Math.floor(Math.min(x0, x1)) + 1; i <= Math.floor(Math.max(x0, x1)); i++) { const t = (i - x0) / dx; if (bate(`${L}|z|${i}|${Math.floor(z0 + t * dz)}`, t)) return true }
    for (let j = Math.floor(Math.min(z0, z1)) + 1; j <= Math.floor(Math.max(z0, z1)); j++) { const t = (j - z0) / dz; if (bate(`${L}|x|${Math.floor(x0 + t * dx)}|${j}`, t)) return true }
    return false
  }

  return (p, n, de, level, out) => {
    out.a.fill(0); out.b.fill(0); out.resto.fill(0); out.janela.fill(0)
    let fa = 0, fb = 0 // a força das duas lâmpadas guardadas
    for (const l of fontes) {
      const lx = l.x - p[0], ly = l.y - p[1], lz = l.z - p[2], d2 = lx * lx + ly * ly + lz * lz
      if (d2 >= l.alcance * l.alcance) continue
      const d = Math.sqrt(d2) || 1e-4, nl = n ? (n[0] * lx + n[1] * ly + n[2] * lz) / d : 0.5
      if (nl <= 0) continue
      if (l.dentro && (de[0] - l.x) * l.dentro[0] + (de[2] - l.z) * l.dentro[2] < -0.25) continue // a janela não ilumina para fora
      // em andares diferentes: o piso no meio bloqueia (em cima do ponto ou embaixo da fonte)
      if (l.level !== level) {
        let piso = false
        for (let L = Math.min(l.level, level) + 1; L <= Math.max(l.level, level) && !piso; L++) piso = pisos.has(`${L}|${Math.floor(de[0])}|${Math.floor(de[2])}`) || pisos.has(`${L}|${Math.floor(l.x)}|${Math.floor(l.z)}`)
        if (piso) continue
      }
      if (tapado(level, de[0], de[1], de[2], l.x, l.y, l.z) || (l.level !== level && tapado(l.level, de[0], de[1], de[2], l.x, l.y, l.z))) continue
      // a mesma queda da luz pontual do three: 1 / d^decaimento, apagando até o alcance
      const q = d / l.alcance, corte = Math.max(0, 1 - q * q * q * q), k = (nl * corte * corte) / Math.max(d ** DECAIMENTO, 0.01)
      const r = l.r * k, g = l.g * k, b = l.b * k, f = r + g + b
      if (l.dentro) { out.janela[0] += r; out.janela[1] += g; out.janela[2] += b; continue }
      // entra entre as duas mais fortes (a que sair vai para o resto), ou vai direto para o resto
      let sai: V4 | null = null
      if (f > fa) { sai = [...out.b]; out.b = [...out.a]; fb = fa; out.a = [r, g, b, l.id]; fa = f }
      else if (f > fb) { sai = [...out.b]; out.b = [r, g, b, l.id]; fb = f }
      else sai = [r, g, b, 0]
      out.resto[0] += sai[0]; out.resto[1] += sai[1]; out.resto[2] += sai[2]
    }
  }
}
