// As paredes viram poucas malhas: uma por textura (como a "casca" do laboratório), em vez de várias peças por
// pedaço de parede. Os cantos se juntam assim, olhando os vizinhos de cada ponta do pedaço:
//   - continua reto do outro lado da ponta: nada a fazer (as faces se encontram);
//   - encontra uma parede de lado (canto em L, T ou cruz): as faces avançam meia espessura e fecham o canto
//     (o que avança para dentro da outra parede fica escondido nela);
//   - ponta solta: uma tampa fecha a ponta.
import * as THREE from 'three'
import { LEVEL_H, type Axis, type Chunk, type Opening, type Wall, type WallSide } from '../maps/types'
import { TOPO } from '../render/materiais' // o corte da parede (topo e a parte de baixo das vergas)

export const ESPESSURA = 0.12 // a espessura da parede (m)
const PORTA_H = 2.1, GRANDE_H = 2.8, JANELA_Y0 = 0.9, JANELA_Y1 = 2.1
const T2 = ESPESSURA / 2

interface Buf { p: number[]; n: number[]; uv: number[]; i: number[] }
type V3 = [number, number, number]

const k = (level: number, axis: Axis, x: number, z: number) => `${level}|${axis}|${x}|${z}`

/** Um retângulo de 4 cantos na ordem da volta; a ordem é corrigida para a face olhar para o lado da normal. */
function quad(b: Buf, c: V3[], n: V3, uv: [number, number][]) {
  const e1 = [c[1][0] - c[0][0], c[1][1] - c[0][1], c[1][2] - c[0][2]], e2 = [c[2][0] - c[0][0], c[2][1] - c[0][1], c[2][2] - c[0][2]]
  const cr = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]]
  const ordem = cr[0] * n[0] + cr[1] * n[1] + cr[2] * n[2] >= 0 ? [0, 1, 2, 3] : [0, 3, 2, 1]
  const v0 = b.p.length / 3
  for (const j of ordem) { b.p.push(...c[j]); b.n.push(...n); b.uv.push(...uv[j]) }
  b.i.push(v0, v0 + 1, v0 + 2, v0, v0 + 2, v0 + 3)
}

/** Os trechos de altura que ficam de pé: a porta tira de baixo, a janela tira do meio. */
function trechos(op?: Opening): [number, number][] {
  if (!op) return [[0, LEVEL_H]]
  if (op.kind === 'porta') return [[op.door === 'grande' ? GRANDE_H : PORTA_H, LEVEL_H]]
  return [[0, JANELA_Y0], [JANELA_Y1, LEVEL_H]]
}

/** As geometrias das paredes até o andar maxLevel, uma por nome de textura (e TOPO para os cortes). */
export function wallGeometries(chunks: Chunk[], maxLevel: number): Map<string, THREE.BufferGeometry> {
  const tem = new Set<string>(), aberturas = new Map<string, Opening>(), walls: Wall[] = []
  for (const c of chunks) {
    for (const w of c.walls) if (w.level <= maxLevel) { tem.add(k(w.level, w.axis, w.x, w.z)); walls.push(w) }
    for (const o of c.openings) for (let i = 0; i < o.width; i++) aberturas.set(k(o.level, o.axis, o.axis === 'x' ? o.x + i : o.x, o.axis === 'z' ? o.z + i : o.z), o)
  }
  const bufs = new Map<string, Buf>()
  const buf = (tex: string) => { let b = bufs.get(tex); if (!b) bufs.set(tex, (b = { p: [], n: [], uv: [], i: [] })); return b }

  for (const w of walls) {
    const L = w.level, y0 = L * LEVEL_H, ax = w.axis
    // a ponta em (vx, vz): continua reto? encontra parede de lado?
    const ponta = (vx: number, vz: number, inicio: boolean) => {
      const reto = ax === 'x' ? tem.has(k(L, 'x', inicio ? vx - 1 : vx, vz)) : tem.has(k(L, 'z', vx, inicio ? vz - 1 : vz))
      if (reto) return { e: 0, tampa: false }
      const lado = ax === 'x' ? tem.has(k(L, 'z', vx, vz - 1)) || tem.has(k(L, 'z', vx, vz)) : tem.has(k(L, 'x', vx - 1, vz)) || tem.has(k(L, 'x', vx, vz))
      return lado ? { e: T2, tampa: false } : { e: 0, tampa: true }
    }
    const p0 = ponta(w.x, w.z, true), p1 = ax === 'x' ? ponta(w.x + 1, w.z, false) : ponta(w.x, w.z + 1, false)
    const s = ax === 'x' ? w.x : w.z
    const u0 = s - p0.e, u1 = s + 1 + p1.e
    // (u ao longo da parede, deslocamento s para o lado, altura y) -> mundo
    const P = (u: number, d: number, y: number): V3 => (ax === 'x' ? [u, y0 + y, w.z + d] : [w.x + d, y0 + y, u])
    const nLado = (sinal: number): V3 => (ax === 'x' ? [0, 0, sinal] : [sinal, 0, 0])
    const nAo = (sinal: number): V3 => (ax === 'x' ? [sinal, 0, 0] : [0, 0, sinal])

    const lado = (side: WallSide, sinal: number, ya: number, yb: number) => {
      const hb = side.base ? side.base.h : 0, faixas: [number, number, string][] = []
      if (side.base && ya < hb) faixas.push([ya, Math.min(yb, hb), side.base.tex])
      if (yb > Math.max(ya, hb)) faixas.push([Math.max(ya, hb), yb, side.tex])
      const d = sinal * T2
      for (const [fa, fb, tex] of faixas) quad(buf(tex), [P(u0, d, fa), P(u1, d, fa), P(u1, d, fb), P(u0, d, fb)], nLado(sinal), [[u0, fa], [u1, fa], [u1, fb], [u0, fb]])
    }

    for (const [ya, yb] of trechos(aberturas.get(k(L, ax, w.x, w.z)))) {
      lado(w.a, -1, ya, yb)
      lado(w.b, 1, ya, yb)
      quad(buf(TOPO), [P(u0, -T2, yb), P(u1, -T2, yb), P(u1, T2, yb), P(u0, T2, yb)], [0, 1, 0], [[u0, 0], [u1, 0], [u1, 1], [u0, 1]])
      if (ya > 0) quad(buf(TOPO), [P(u0, -T2, ya), P(u1, -T2, ya), P(u1, T2, ya), P(u0, T2, ya)], [0, -1, 0], [[u0, 0], [u1, 0], [u1, 1], [u0, 1]])
      if (p0.tampa) quad(buf(w.a.tex), [P(u0, -T2, ya), P(u0, T2, ya), P(u0, T2, yb), P(u0, -T2, yb)], nAo(-1), [[0, ya], [1, ya], [1, yb], [0, yb]])
      if (p1.tampa) quad(buf(w.a.tex), [P(u1, -T2, ya), P(u1, T2, ya), P(u1, T2, yb), P(u1, -T2, yb)], nAo(1), [[0, ya], [1, ya], [1, yb], [0, yb]])
    }
  }

  return geometrias(bufs)
}

/** Os pisos até o andar maxLevel, juntados por textura: a face de cima (o chão) e a de baixo (o teto do andar de baixo). */
export function floorGeometries(chunks: Chunk[], maxLevel: number): Map<string, THREE.BufferGeometry> {
  const bufs = new Map<string, Buf>()
  const buf = (tex: string) => { let b = bufs.get(tex); if (!b) bufs.set(tex, (b = { p: [], n: [], uv: [], i: [] })); return b }
  for (const c of chunks) for (const f of c.floors) {
    if (f.level > maxLevel) continue
    const y = f.level * LEVEL_H, x0 = f.x, x1 = f.x + 1, z0 = f.z, z1 = f.z + 1
    const uv: [number, number][] = [[x0, z0], [x1, z0], [x1, z1], [x0, z1]]
    quad(buf(f.top), [[x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1]], [0, 1, 0], uv)
    if (f.level > 0) quad(buf(f.bottom), [[x0, y - TETO, z0], [x1, y - TETO, z0], [x1, y - TETO, z1], [x0, y - TETO, z1]], [0, -1, 0], uv)
  }
  return geometrias(bufs)
}
const TETO = 0.02 // o teto fica um tico abaixo do chão de cima, para as duas faces não brigarem

function geometrias(bufs: Map<string, Buf>) {
  const out = new Map<string, THREE.BufferGeometry>()
  for (const [tex, b] of bufs) {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(b.p, 3))
    g.setAttribute('normal', new THREE.Float32BufferAttribute(b.n, 3))
    g.setAttribute('uv', new THREE.Float32BufferAttribute(b.uv, 2))
    g.setIndex(b.i)
    out.set(tex, g)
  }
  return out
}
