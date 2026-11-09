// O corrimão automático das escadas, calculado a partir do mapa (não fica gravado: muda sozinho com a escada e as paredes).
//   - nos lados da escada: um corrimão inclinado com balaústres, menos no lado que já tem parede do pé ao topo;
//   - em volta do buraco no piso de cima: um guarda-corpo reto nas bordas que têm piso do lado de fora e não têm parede,
//     menos na ponta do topo (é por onde se sai da escada).
// Sem three aqui: o editor desenha (editor/corrimaoMesh.ts) e o jogo monta a colisão (game/world/colisao.ts) daqui.
import type { Axis, Chunk, Stair } from './types'

/** Um lado de escada com corrimão. c = a linha do corrimão atravessando a escada (do lado c = 0 ou c = largura). */
export interface LadoEscada { st: Stair; c: number }

/** Um guarda-corpo reto numa linha da grade: de (x, z) até len metros no eixo; fora = para que lado fica o piso (±1). */
export interface Beirada { level: number; axis: Axis; x: number; z: number; len: number; fora: 1 | -1 }

export const RECUO = 0.06 // o corrimão fica um pouco para dentro da borda (na escada) ou para o lado do piso (na beirada)

/** As medidas da escada no referencial dela: a = ao longo da subida (do pé), c = atravessando. */
export function medidas(st: Stair) {
  const ns = st.dir === 'norte' || st.dir === 'sul'
  return { ns, comp: ns ? st.d : st.w, larg: ns ? st.w : st.d }
}

/** (a, c) da escada -> (x, z) no mundo. */
export function noMundo(st: Stair, a: number, c: number): [number, number] {
  return st.dir === 'sul' ? [st.x + c, st.z + a] : st.dir === 'norte' ? [st.x + c, st.z + st.d - a]
    : st.dir === 'leste' ? [st.x + a, st.z + c] : [st.x + st.w - a, st.z + c]
}

const chave = (level: number, axis: Axis, x: number, z: number) => `${level}|${axis}|${x}|${z}`

export function corrimaos(chunks: Chunk[]): { lados: LadoEscada[]; beiradas: Beirada[] } {
  const paredes = new Set<string>(), pisos = new Set<string>(), buraco = new Set<string>()
  const escadas: Stair[] = []
  for (const c of chunks) {
    for (const w of c.walls) paredes.add(chave(w.level, w.axis, w.x, w.z))
    for (const f of c.floors) pisos.add(`${f.level}_${f.x}_${f.z}`)
    escadas.push(...c.stairs)
  }
  for (const s of escadas) for (let x = s.x; x < s.x + s.w; x++) for (let z = s.z; z < s.z + s.d; z++) buraco.add(`${s.level + 1}_${x}_${z}`)

  const lados: LadoEscada[] = [], beiradas: Beirada[] = []
  for (const st of escadas) {
    const { ns, larg } = medidas(st)
    // os lados: a linha x = st.x / st.x + st.w (escada norte–sul) ou z = st.z / st.z + st.d (leste–oeste)
    for (const c of [0, larg]) {
      let parede = true
      if (ns) { const x = st.x + c; for (let z = st.z; z < st.z + st.d; z++) if (!paredes.has(chave(st.level, 'z', x, z))) parede = false }
      else { const z = st.z + c; for (let x = st.x; x < st.x + st.w; x++) if (!paredes.has(chave(st.level, 'x', x, z))) parede = false }
      if (!parede) lados.push({ st, c })
    }
    // o buraco de cima: as quatro bordas, menos a do topo
    const L = st.level + 1
    const bordas: { axis: Axis; fixo: number; de: number; ate: number; fora: 1 | -1; topo: boolean }[] = [
      { axis: 'x', fixo: st.z, de: st.x, ate: st.x + st.w, fora: -1, topo: st.dir === 'norte' },
      { axis: 'x', fixo: st.z + st.d, de: st.x, ate: st.x + st.w, fora: 1, topo: st.dir === 'sul' },
      { axis: 'z', fixo: st.x, de: st.z, ate: st.z + st.d, fora: -1, topo: st.dir === 'oeste' },
      { axis: 'z', fixo: st.x + st.w, de: st.z, ate: st.z + st.d, fora: 1, topo: st.dir === 'leste' },
    ]
    for (const b of bordas) {
      if (b.topo) continue
      let ini: number | null = null
      for (let i = b.de; i <= b.ate; i++) {
        // o quadrado do lado de fora desta parte da borda (o piso que precisa de proteção)
        const fx = b.axis === 'x' ? i : b.fora === 1 ? b.fixo : b.fixo - 1
        const fz = b.axis === 'x' ? (b.fora === 1 ? b.fixo : b.fixo - 1) : i
        const precisa = i < b.ate && pisos.has(`${L}_${fx}_${fz}`) && !buraco.has(`${L}_${fx}_${fz}`)
          && !paredes.has(b.axis === 'x' ? chave(L, 'x', i, b.fixo) : chave(L, 'z', b.fixo, i))
        if (precisa && ini === null) ini = i
        if (!precisa && ini !== null) {
          beiradas.push({ level: L, axis: b.axis, x: b.axis === 'x' ? ini : b.fixo, z: b.axis === 'x' ? b.fixo : ini, len: i - ini, fora: b.fora })
          ini = null
        }
      }
    }
  }
  return { lados, beiradas }
}

/** A altura do corrimão da escada no ponto a (acima do pé da escada): ~0,86 m acima da quina dos degraus. */
export function alturaCorrimao(st: Stair, a: number, degraus: number) {
  const { comp } = medidas(st)
  return st.rise / degraus + (a * st.rise) / comp + 0.86
}
