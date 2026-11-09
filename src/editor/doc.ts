// O documento que o editor muda: o cabeçalho e os blocos (pela chave "cx_cz"). Nunca é alterado no lugar: cada
// mudança gera um documento novo que reaproveita os blocos que não mudaram. É isso que deixa o desfazer barato
// (o histórico guarda documentos inteiros, mas eles dividem quase tudo entre si).
import { chunkKey, chunkOf, emptyChunk, type Axis, type Chunk, type MapMeta, type Opening, type Wall, type WallSide } from '../maps/types'
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

// ---------- pisos ----------

/** Os quadrados de 1 m de uma área arrastada entre dois cantos da grade (um clique = o quadrado sob o mouse). */
export function quadrados(x0: number, z0: number, x1: number, z1: number): [number, number][] {
  const ax = Math.min(x0, x1), bx = Math.max(x0, x1), az = Math.min(z0, z1), bz = Math.max(z0, z1), out: [number, number][] = []
  for (let x = ax; x < bx; x++) for (let z = az; z < bz; z++) out.push([x, z])
  return out
}

/** Põe ou repinta o piso dos quadrados: top = o chão deste andar, bottom = o teto do andar de baixo. */
export function comPiso(doc: MapDoc, level: number, qs: [number, number][], top: string, bottom: string): MapDoc {
  const porBloco = new Map<string, Map<string, [number, number]>>()
  for (const [x, z] of qs) {
    const b = chunkKey(...chunkOf(x, z))
    if (!porBloco.has(b)) porBloco.set(b, new Map())
    porBloco.get(b)!.set(`${x}_${z}`, [x, z])
  }
  // nada muda se todos os quadrados já estão com essas texturas
  const igual = [...porBloco].every(([b, m]) => [...m.values()].every(([x, z]) => doc.chunks[b]?.floors.some((f) => f.level === level && f.x === x && f.z === z && f.top === top && f.bottom === bottom)))
  if (!qs.length || igual) return doc
  return mudarBlocos(doc, porBloco.keys(), (c) => {
    const m = porBloco.get(chunkKey(c.cx, c.cz))!
    const resto = c.floors.filter((f) => !(f.level === level && m.has(`${f.x}_${f.z}`)))
    return { ...c, floors: [...resto, ...[...m.values()].map(([x, z]) => ({ level, x, z, top, bottom }))] }
  })
}

export function semPiso(doc: MapDoc, level: number, qs: [number, number][]): MapDoc {
  const fora = new Set(qs.map(([x, z]) => `${x}_${z}`)), blocos = new Set<string>()
  for (const [k, c] of Object.entries(doc.chunks)) if (c.floors.some((f) => f.level === level && fora.has(`${f.x}_${f.z}`))) blocos.add(k)
  if (!blocos.size) return doc
  return mudarBlocos(doc, blocos, (c) => ({ ...c, floors: c.floors.filter((f) => !(f.level === level && fora.has(`${f.x}_${f.z}`))) }))
}

/** Quantos quadrados da área já têm piso (para a prévia dizer "apagar 12 m²"). */
export function pisoNaArea(doc: MapDoc, level: number, qs: [number, number][]) {
  const dentro = new Set(qs.map(([x, z]) => `${x}_${z}`))
  let n = 0
  for (const c of Object.values(doc.chunks)) for (const f of c.floors) if (f.level === level && dentro.has(`${f.x}_${f.z}`)) n++
  return n
}

// ---------- pintura das paredes ----------

export type Lado = 'a' | 'b'
export interface LadoDe { seg: Seg; lado: Lado }
export const ladoKey = (l: LadoDe) => `${segKey(l.seg)}|${l.lado}`

/** Qual lado da parede o raio do mouse vê: o lado a olha para −z (eixo x) ou −x (eixo z). */
export function ladoVisto(seg: Seg, d: [number, number, number]): Lado {
  const atravessa = seg.axis === 'x' ? d[2] : d[0]
  return atravessa > 0 ? 'a' : 'b' // indo para +z (ou +x), o raio bate no lado que olha para −z (−x)
}

/** Pinta lados de parede (a textura e a barra de baixo). */
export function pintarLados(doc: MapDoc, lados: LadoDe[], side: WallSide): MapDoc {
  const alvo = new Map(lados.map((l) => [segKey(l.seg), new Set<Lado>()]))
  for (const l of lados) alvo.get(segKey(l.seg))!.add(l.lado)
  const igual = (s: WallSide) => s.tex === side.tex && (s.base?.tex ?? '') === (side.base?.tex ?? '') && (s.base?.h ?? 0) === (side.base?.h ?? 0)
  const blocos = new Set<string>()
  for (const [k, c] of Object.entries(doc.chunks)) {
    if (c.walls.some((w) => { const ls = alvo.get(segKey(w)); return ls && [...ls].some((l) => !igual(w[l])) })) blocos.add(k)
  }
  if (!blocos.size) return doc
  const copia = (): WallSide => (side.base ? { tex: side.tex, base: { ...side.base } } : { tex: side.tex })
  return mudarBlocos(doc, blocos, (c) => ({
    ...c,
    walls: c.walls.map((w) => {
      const ls = alvo.get(segKey(w))
      return ls ? { ...w, a: ls.has('a') ? copia() : w.a, b: ls.has('b') ? copia() : w.b } : w
    }),
  }))
}

/**
 * A sala do lado clicado: anda pelos quadrados a partir dele sem atravessar parede e junta todos os lados de parede
 * virados para dentro. Se escapar (não é uma sala fechada), devolve só o lado clicado.
 */
export function ladosDaSala(doc: MapDoc, de: LadoDe, limite = 2500): { lados: LadoDe[]; fechada: boolean } {
  const L = de.seg.level, tem = new Set<string>()
  for (const w of paredes(doc, L)) tem.add(segKey(w))
  const p = (axis: Axis, x: number, z: number) => tem.has(segKey({ level: L, axis, x, z }))
  const s = de.seg
  // o quadrado do lado clicado
  const ini: [number, number] = s.axis === 'x' ? [s.x, de.lado === 'b' ? s.z : s.z - 1] : [de.lado === 'b' ? s.x : s.x - 1, s.z]
  const visto = new Set([`${ini[0]}_${ini[1]}`]), fila = [ini]
  while (fila.length) {
    if (visto.size > limite) return { lados: [de], fechada: false }
    const [x, z] = fila.pop()!
    const viz: [number, number, boolean][] = [[x + 1, z, p('z', x + 1, z)], [x - 1, z, p('z', x, z)], [x, z + 1, p('x', x, z + 1)], [x, z - 1, p('x', x, z)]]
    for (const [nx, nz, bloqueado] of viz) { const k = `${nx}_${nz}`; if (!bloqueado && !visto.has(k)) { visto.add(k); fila.push([nx, nz]) } }
  }
  const lados: LadoDe[] = []
  for (const k of visto) {
    const [x, z] = k.split('_').map(Number)
    if (p('x', x, z)) lados.push({ seg: { level: L, axis: 'x', x, z }, lado: 'b' }) // a parede ao norte (−z) do quadrado: o lado b olha para ele
    if (p('x', x, z + 1)) lados.push({ seg: { level: L, axis: 'x', x, z: z + 1 }, lado: 'a' })
    if (p('z', x, z)) lados.push({ seg: { level: L, axis: 'z', x, z }, lado: 'b' })
    if (p('z', x + 1, z)) lados.push({ seg: { level: L, axis: 'z', x: x + 1, z }, lado: 'a' })
  }
  return { lados, fechada: true }
}

// ---------- portas e janelas ----------

/** Os pedaços de parede que uma abertura ocupa (a largura conta a partir de x, z ao longo do eixo). */
export function pedacosDe(o: Pick<Opening, 'level' | 'axis' | 'x' | 'z' | 'width'>): Seg[] {
  return Array.from({ length: o.width }, (_, i) => ({ level: o.level, axis: o.axis, x: o.axis === 'x' ? o.x + i : o.x, z: o.axis === 'z' ? o.z + i : o.z }))
}

export function aberturas(doc: MapDoc): Opening[] {
  return Object.values(doc.chunks).flatMap((c) => c.openings)
}

/** A abertura que ocupa este pedaço de parede, se houver. */
export function aberturaNo(doc: MapDoc, s: Seg): Opening | undefined {
  const k = segKey(s)
  return aberturas(doc).find((o) => pedacosDe(o).some((p) => segKey(p) === k))
}

/**
 * Onde cabe uma abertura de `width` pedaços começando no pedaço clicado: primeiro para frente no eixo, depois
 * recuando. Precisa de parede em todos os pedaços e nenhuma outra abertura no caminho. Devolve o início ou um motivo.
 */
export function ondeCabe(doc: MapDoc, s: Seg, width: number): { x: number; z: number } | { erro: string } {
  const tem = new Set<string>()
  for (const w of paredes(doc, s.level)) tem.add(segKey(w))
  const ocupado = new Set(aberturas(doc).flatMap((o) => pedacosDe(o).map(segKey)))
  for (let recuo = 0; recuo < width; recuo++) {
    const x = s.axis === 'x' ? s.x - recuo : s.x, z = s.axis === 'z' ? s.z - recuo : s.z
    const ps = pedacosDe({ level: s.level, axis: s.axis, x, z, width })
    if (ps.every((p) => tem.has(segKey(p)) && !ocupado.has(segKey(p)))) return { x, z }
  }
  return { erro: width > 1 ? `Não cabe: precisa de ${width} m de parede reta livre.` : 'Já tem uma porta ou janela aqui.' }
}

/** O lado de dentro de um pedaço de parede: o lado com piso; sem piso dos dois lados (ou nos dois), o lado oposto ao que a câmera vê. */
export function ladoDeDentro(doc: MapDoc, s: Seg, visto: Lado): Lado {
  const piso = (x: number, z: number) => Object.values(doc.chunks).some((c) => c.floors.some((f) => f.level === s.level && f.x === x && f.z === z))
  // o quadrado de cada lado do pedaço (a olha para −z ou −x)
  const qa: [number, number] = s.axis === 'x' ? [s.x, s.z - 1] : [s.x - 1, s.z], qb: [number, number] = [s.x, s.z]
  const a = piso(...qa), b = piso(...qb)
  if (a !== b) return a ? 'a' : 'b'
  return visto === 'a' ? 'b' : 'a'
}

const novoId = (pre: string) => `${pre}-${Math.random().toString(36).slice(2, 7)}`

export function comAbertura(doc: MapDoc, o: Omit<Opening, 'id'>): { doc: MapDoc; id: string } {
  const id = novoId(o.kind === 'janela' ? 'janela' : o.door === 'vao' ? 'vao' : 'porta')
  const b = chunkKey(...chunkOf(o.x, o.z))
  return { doc: mudarBlocos(doc, [b], (c) => ({ ...c, openings: [...c.openings, { ...o, id }] })), id }
}

export function semAbertura(doc: MapDoc, id: string): MapDoc {
  const b = Object.entries(doc.chunks).find(([, c]) => c.openings.some((o) => o.id === id))?.[0]
  if (!b) return doc
  return mudarBlocos(doc, [b], (c) => ({ ...c, openings: c.openings.filter((o) => o.id !== id) }))
}

export function mudarAbertura(doc: MapDoc, id: string, patch: Partial<Opening>): MapDoc {
  const b = Object.entries(doc.chunks).find(([, c]) => c.openings.some((o) => o.id === id))?.[0]
  if (!b) return doc
  const atual = doc.chunks[b].openings.find((o) => o.id === id)!
  if (Object.entries(patch).every(([k, v]) => (atual as unknown as Record<string, unknown>)[k] === v)) return doc
  return mudarBlocos(doc, [b], (c) => ({ ...c, openings: c.openings.map((o) => (o.id === id ? { ...o, ...patch } : o)) }))
}

export const comAndares = (doc: MapDoc, levels: number): MapDoc => ({ ...doc, meta: { ...doc.meta, levels } })

/** O andar tem alguma coisa? (só dá para tirar o último andar se ele estiver vazio) */
export function andarTemCoisa(doc: MapDoc, level: number) {
  return Object.values(doc.chunks).some((c) =>
    [c.walls, c.floors, c.openings, c.stairs, c.props, c.decals, c.points].some((l) => (l as { level: number }[]).some((x) => x.level === level)))
}
