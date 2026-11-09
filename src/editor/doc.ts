// O documento que o editor muda: o cabeçalho e os blocos (pela chave "cx_cz"). Nunca é alterado no lugar: cada
// mudança gera um documento novo que reaproveita os blocos que não mudaram. É isso que deixa o desfazer barato
// (o histórico guarda documentos inteiros, mas eles dividem quase tudo entre si).
import { chunkKey, chunkOf, emptyChunk, type Axis, type Chunk, type MapMeta, type Wall, type WallSide } from '../maps/types'
import { vazio, type MapBundle } from '../maps/storage'

export interface MapDoc { meta: MapMeta; chunks: Record<string, Chunk> }

export const docDe = (b: MapBundle): MapDoc => ({ meta: b.meta, chunks: Object.fromEntries(b.chunks.map((c) => [chunkKey(c.cx, c.cz), c])) })

export function pacoteDe(d: MapDoc): MapBundle {
  const chunks = Object.values(d.chunks).filter((c) => !vazio(c))
  return { formato: 1, meta: { ...d.meta, chunks: chunks.map((c) => chunkKey(c.cx, c.cz)).sort() }, chunks }
}

/** Um pedaço de parede (1 m) sem as texturas: só onde ele fica. */
export interface Seg { level: number; x: number; z: number; axis: Axis }
export const segKey = (s: Seg) => `${s.level}|${s.axis}|${s.x}|${s.z}`

/** A pintura de uma parede nova; a etapa 3 traz o pincel para mudar cada lado. */
export const LADO_PADRAO: WallSide = { tex: 'reboco-creme' }

export type Arraste = { tipo: 'nada' | 'reta' | 'sala'; segs: Seg[]; w: number; d: number }

/** O que um arraste de (x0, z0) a (x1, z1) desenha: numa linha, uma parede reta; em diagonal, a sala fechada pelas quatro paredes. */
export function segmentosDoArraste(level: number, x0: number, z0: number, x1: number, z1: number): Arraste {
  const ax = Math.min(x0, x1), bx = Math.max(x0, x1), az = Math.min(z0, z1), bz = Math.max(z0, z1)
  const w = bx - ax, d = bz - az, segs: Seg[] = []
  if (!w && !d) return { tipo: 'nada', segs, w, d }
  if (!d) { for (let x = ax; x < bx; x++) segs.push({ level, x, z: az, axis: 'x' }); return { tipo: 'reta', segs, w, d } }
  if (!w) { for (let z = az; z < bz; z++) segs.push({ level, x: ax, z, axis: 'z' }); return { tipo: 'reta', segs, w, d } }
  for (let x = ax; x < bx; x++) segs.push({ level, x, z: az, axis: 'x' }, { level, x, z: bz, axis: 'x' })
  for (let z = az; z < bz; z++) segs.push({ level, x: ax, z, axis: 'z' }, { level, x: bx, z, axis: 'z' })
  return { tipo: 'sala', segs, w, d }
}

function* paredes(doc: MapDoc, level: number) {
  for (const c of Object.values(doc.chunks)) for (const w of c.walls) if (w.level === level) yield w
}

/** As paredes do andar dentro da área arrastada, contando a borda: o que o apagar leva. */
export function paredesNaArea(doc: MapDoc, level: number, x0: number, z0: number, x1: number, z1: number): Seg[] {
  const ax = Math.min(x0, x1), bx = Math.max(x0, x1), az = Math.min(z0, z1), bz = Math.max(z0, z1)
  const out: Seg[] = []
  for (const w of paredes(doc, level)) {
    const dentro = w.axis === 'x' ? w.x >= ax && w.x + 1 <= bx && w.z >= az && w.z <= bz : w.x >= ax && w.x <= bx && w.z >= az && w.z + 1 <= bz
    if (dentro) out.push(w)
  }
  return out
}

/** O pedaço de parede mais perto do ponto (até 0,35 m): apagar com um clique. */
export function paredeMaisPerto(doc: MapDoc, level: number, px: number, pz: number): Seg | undefined {
  let best: Seg | undefined, bd = 0.35
  for (const w of paredes(doc, level)) {
    const d = w.axis === 'x' ? Math.hypot(Math.min(Math.max(px, w.x), w.x + 1) - px, w.z - pz) : Math.hypot(w.x - px, Math.min(Math.max(pz, w.z), w.z + 1) - pz)
    if (d < bd) { bd = d; best = w }
  }
  return best
}

/** A parede que o raio do mouse acerta primeiro (no plano do meio da parede): clicar na parede, não no chão atrás dela. */
export function paredeNoRaio(doc: MapDoc, level: number, o: [number, number, number], d: [number, number, number], altura: number): Seg | undefined {
  let best: Seg | undefined, bt = Infinity
  const y0 = level * altura
  for (const w of paredes(doc, level)) {
    const [ia, ib] = w.axis === 'x' ? [2, 0] : [0, 2] // o eixo que atravessa a parede e o eixo ao longo dela
    if (Math.abs(d[ia]) < 1e-6) continue
    const t = ((w.axis === 'x' ? w.z : w.x) - o[ia]) / d[ia]
    if (t <= 0 || t >= bt) continue
    const u = o[ib] + t * d[ib], y = o[1] + t * d[1], s = w.axis === 'x' ? w.x : w.z
    if (u >= s && u <= s + 1 && y >= y0 && y <= y0 + altura) { bt = t; best = w }
  }
  return best
}

/** Copia só os blocos que vão mudar. */
function mudarBlocos(doc: MapDoc, chaves: Iterable<string>, f: (c: Chunk) => Chunk): MapDoc {
  const chunks = { ...doc.chunks }
  for (const k of chaves) {
    const [cx, cz] = k.split('_').map(Number)
    chunks[k] = f(chunks[k] ?? emptyChunk(cx, cz))
  }
  return { ...doc, chunks }
}

const blocoDe = (s: Seg) => chunkKey(...chunkOf(s.x, s.z)) // cada coisa pertence ao bloco do quadrado onde começa

/** Põe as paredes que ainda não existem. As que já existem ficam como estão (com a pintura delas). */
export function comParedes(doc: MapDoc, segs: Seg[]): MapDoc {
  const existe = new Set<string>()
  for (const c of Object.values(doc.chunks)) for (const w of c.walls) existe.add(segKey(w))
  const novas = new Map<string, Wall[]>()
  for (const s of segs) {
    const k = segKey(s)
    if (existe.has(k)) continue
    existe.add(k)
    const b = blocoDe(s)
    novas.set(b, [...(novas.get(b) ?? []), { level: s.level, x: s.x, z: s.z, axis: s.axis, a: { ...LADO_PADRAO }, b: { ...LADO_PADRAO } }])
  }
  if (!novas.size) return doc // nada mudou: não entra no histórico
  return mudarBlocos(doc, novas.keys(), (c) => ({ ...c, walls: [...c.walls, ...novas.get(chunkKey(c.cx, c.cz))!] }))
}

/** Tira as paredes, e as portas e janelas que estavam nelas (uma abertura sem parede não faz sentido). */
export function semParedes(doc: MapDoc, segs: Seg[]): MapDoc {
  const fora = new Set(segs.map(segKey))
  const blocos = new Set<string>()
  for (const [k, c] of Object.entries(doc.chunks)) {
    if (c.walls.some((w) => fora.has(segKey(w))) || c.openings.some((o) => cobre(o, fora))) blocos.add(k)
  }
  if (!blocos.size) return doc
  return mudarBlocos(doc, blocos, (c) => ({ ...c, walls: c.walls.filter((w) => !fora.has(segKey(w))), openings: c.openings.filter((o) => !cobre(o, fora)) }))
}

function cobre(o: Chunk['openings'][number], fora: Set<string>) {
  for (let i = 0; i < o.width; i++) {
    if (fora.has(segKey({ level: o.level, axis: o.axis, x: o.axis === 'x' ? o.x + i : o.x, z: o.axis === 'z' ? o.z + i : o.z }))) return true
  }
  return false
}

export const comAndares = (doc: MapDoc, levels: number): MapDoc => ({ ...doc, meta: { ...doc.meta, levels } })

/** O andar tem alguma coisa? (só dá para tirar o último andar se ele estiver vazio) */
export function andarTemCoisa(doc: MapDoc, level: number) {
  return Object.values(doc.chunks).some((c) =>
    [c.walls, c.floors, c.openings, c.stairs, c.props, c.decals, c.points].some((l) => (l as { level: number }[]).some((x) => x.level === level)))
}
