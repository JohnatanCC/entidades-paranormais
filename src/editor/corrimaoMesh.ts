// Desenha o corrimão automático (maps/corrimao.ts) em duas malhas só, uma por madeira (como as paredes, juntadas):
// o corrimão em madeira clara; os pilares, os balaústres e a travessa de baixo em madeira escura. As mesmas medidas do
// objeto guarda-corpo, para os dois se emendarem sem diferença.
import * as THREE from 'three'
import { corrimaos, alturaCorrimao, medidas, noMundo, RECUO, type Beirada, type LadoEscada } from '../maps/corrimao'
import { GUARDA } from '../maps/objetos'
import { LEVEL_H, type Chunk } from '../maps/types'
import { degrausDe } from './wallMesh'

type V3 = [number, number, number]
interface Buf { p: number[]; n: number[]; i: number[] }

/** Uma face de 4 cantos; a normal sai do produto vetorial, virada para o lado de "rumo". */
function face(b: Buf, c: V3[], rumo: V3) {
  const e1 = [c[1][0] - c[0][0], c[1][1] - c[0][1], c[1][2] - c[0][2]], e2 = [c[2][0] - c[0][0], c[2][1] - c[0][1], c[2][2] - c[0][2]]
  let n: V3 = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]]
  let ordem = [0, 1, 2, 3]
  if (n[0] * rumo[0] + n[1] * rumo[1] + n[2] * rumo[2] < 0) { ordem = [0, 3, 2, 1]; n = [-n[0], -n[1], -n[2]] }
  const l = Math.hypot(n[0], n[1], n[2]) || 1, v0 = b.p.length / 3
  for (const j of ordem) { b.p.push(...c[j]); b.n.push(n[0] / l, n[1] / l, n[2] / l) }
  b.i.push(v0, v0 + 1, v0 + 2, v0, v0 + 2, v0 + 3)
}

/** Um bloco reto (alinhado aos eixos) pelo centro e pelo tamanho. */
function caixa(b: Buf, [x, y, z]: V3, [sx, sy, sz]: V3) {
  const X = [x - sx / 2, x + sx / 2], Y = [y - sy / 2, y + sy / 2], Z = [z - sz / 2, z + sz / 2]
  const P = (i: number, j: number, k: number): V3 => [X[i], Y[j], Z[k]]
  face(b, [P(0, 1, 0), P(1, 1, 0), P(1, 1, 1), P(0, 1, 1)], [0, 1, 0])
  face(b, [P(0, 0, 0), P(1, 0, 0), P(1, 0, 1), P(0, 0, 1)], [0, -1, 0])
  face(b, [P(1, 0, 0), P(1, 1, 0), P(1, 1, 1), P(1, 0, 1)], [1, 0, 0])
  face(b, [P(0, 0, 0), P(0, 1, 0), P(0, 1, 1), P(0, 0, 1)], [-1, 0, 0])
  face(b, [P(0, 0, 1), P(1, 0, 1), P(1, 1, 1), P(0, 1, 1)], [0, 0, 1])
  face(b, [P(0, 0, 0), P(1, 0, 0), P(1, 1, 0), P(0, 1, 0)], [0, 0, -1])
}

/** Uma viga inclinada de p0 a p1 (o corrimão da escada): largura w para o "lado" (horizontal), altura h em pé. */
function viga(b: Buf, p0: V3, p1: V3, lado: V3, w: number, h: number) {
  const C = (p: V3, s: number, u: number): V3 => [p[0] + lado[0] * s * w / 2, p[1] + u * h / 2, p[2] + lado[2] * s * w / 2]
  const d: V3 = [p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]]
  face(b, [C(p0, -1, 1), C(p0, 1, 1), C(p1, 1, 1), C(p1, -1, 1)], [0, 1, 0])
  face(b, [C(p0, -1, -1), C(p0, 1, -1), C(p1, 1, -1), C(p1, -1, -1)], [0, -1, 0])
  face(b, [C(p0, 1, -1), C(p0, 1, 1), C(p1, 1, 1), C(p1, 1, -1)], lado)
  face(b, [C(p0, -1, -1), C(p0, -1, 1), C(p1, -1, 1), C(p1, -1, -1)], [-lado[0], 0, -lado[2]])
  face(b, [C(p0, -1, -1), C(p0, 1, -1), C(p0, 1, 1), C(p0, -1, 1)], [-d[0], 0, -d[2]])
  face(b, [C(p1, -1, -1), C(p1, 1, -1), C(p1, 1, 1), C(p1, -1, 1)], [d[0], 0, d[2]])
}

const BAL = 0.035 // a grossura do balaústre
const PILAR = 0.1

/** O corrimão de um lado da escada: pilar no pé e no topo, a viga inclinada e dois balaústres por degrau. */
function ladoDeEscada(clara: Buf, escura: Buf, { st, c }: LadoEscada) {
  const { ns, comp, larg } = medidas(st), n = degrausDe(st.rise), t = comp / n, y0 = st.level * LEVEL_H
  const cc = c === 0 ? RECUO : larg - RECUO
  const P = (a: number, y: number): V3 => { const [x, z] = noMundo(st, a, cc); return [x, y0 + y, z] }
  const lado: V3 = ns ? [1, 0, 0] : [0, 0, 1]
  const yr = (a: number) => alturaCorrimao(st, a, n)
  const a0 = PILAR / 2, a1 = comp - PILAR / 2
  const topoPe = yr(a0) + 0.08, topoCima = yr(a1) + 0.08
  caixa(escura, P(a0, topoPe / 2), [PILAR, topoPe, PILAR])
  caixa(escura, P(a1, (st.rise + topoCima) / 2), [PILAR, topoCima - st.rise, PILAR])
  viga(clara, P(a0, yr(a0)), P(a1, yr(a1)), lado, 0.08, 0.07)
  for (let i = 0; i < n; i++) for (const f of [0.3, 0.75]) {
    const a = (i + f) * t
    if (a < a0 + 0.1 || a > a1 - 0.1) continue
    const base = ((i + 1) * st.rise) / n, topo = yr(a) - 0.035
    caixa(escura, P(a, (base + topo) / 2), [BAL, topo - base, BAL])
  }
}

/** O guarda-corpo reto em volta do buraco de cima (igual ao objeto guarda-corpo, pilar a cada 2 m). */
function beirada(clara: Buf, escura: Buf, { level, axis, x, z, len, fora }: Beirada) {
  const y0 = level * LEVEL_H, off = fora * RECUO
  const Q = (s: number, y: number): V3 => axis === 'x' ? [x + s, y0 + y, z + off] : [x + off, y0 + y, z + s]
  const ao = (comp: number, h: number, g: number): V3 => axis === 'x' ? [comp, h, g] : [g, h, comp]
  const pilares = [0.045, len - 0.045]
  for (let s = 2; s < len - 0.5; s += 2) pilares.push(s)
  for (const s of pilares) caixa(escura, Q(s, GUARDA.altura / 2), [0.09, GUARDA.altura, 0.09])
  caixa(clara, Q(len / 2, GUARDA.corrimao), ao(len, 0.07, 0.11))
  caixa(escura, Q(len / 2, 0.1), ao(len - 0.09, 0.05, 0.07))
  for (let k = 1; k < Math.round(len / GUARDA.passo); k++) {
    const s = k * GUARDA.passo
    if (pilares.some((p) => Math.abs(p - s) < 0.08)) continue
    caixa(escura, Q(s, 0.54), [BAL, 0.83, BAL])
  }
}

/** As malhas do corrimão até o andar maxLevel: { madeira: o corrimão, madeiraE: o resto } (nomes da paleta dos objetos). */
export function corrimaoGeometries(chunks: Chunk[], maxLevel: number): Map<string, THREE.BufferGeometry> {
  const clara: Buf = { p: [], n: [], i: [] }, escura: Buf = { p: [], n: [], i: [] }
  const { lados, beiradas } = corrimaos(chunks)
  for (const l of lados) if (l.st.level <= maxLevel) ladoDeEscada(clara, escura, l)
  for (const b of beiradas) if (b.level <= maxLevel) beirada(clara, escura, b)
  const out = new Map<string, THREE.BufferGeometry>()
  for (const [nome, b] of [['madeira', clara], ['madeiraE', escura]] as [string, Buf][]) {
    if (!b.i.length) continue
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(b.p, 3))
    g.setAttribute('normal', new THREE.Float32BufferAttribute(b.n, 3))
    g.setIndex(b.i)
    out.set(nome, g)
  }
  return out
}
