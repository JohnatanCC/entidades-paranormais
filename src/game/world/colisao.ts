// A colisão do mapa para o jogo (e para o Testar do editor), montada a partir dos dados do mapa:
//   - paredes: uma caixa por pedaço de 1 m; vão deixa passar, janela não; a porta tem a caixa dela, que some enquanto
//     ela está aberta (o jogo abre e fecha: m.abertas);
//   - móveis: a caixa do tamanho do catálogo, girada (tapete e lâmpada de teto não batem);
//   - o corrimão automático das escadas e o guarda-corpo: batem no corpo, mas a câmera passa (dá para ver através);
//   - o chão: o térreo é chão em toda parte; nos andares de cima só onde tem piso (e não em cima de escada);
//   - escadas: rampas, a altura sobe junto com o andamento na subida.
// Tudo no plano do chão (caixas giradas contra um círculo), com o andar escolhido pela altura dos pés.
import { corrimaos, medidas, noMundo, RECUO } from '../../maps/corrimao'
import { GUARDA, OBJETOS } from '../../maps/objetos'
import { LEVEL_H, type Chunk, type Opening, type Stair } from '../../maps/types'

export interface Caixa {
  x: number; z: number; hx: number; hz: number; yaw: number; level: number; y0: number; y1: number
  porta?: string // a caixa é da folha desta porta: some enquanto ela está aberta
  vazado?: boolean // corrimão e guarda-corpo: a câmera passa
}

export interface Mundo {
  caixas: Caixa[]
  pisos: Set<string> // "level_x_z" dos quadrados com piso (o térreo não precisa)
  escadas: Stair[]
  levels: number
  portas: Opening[] // as portas que abrem e fecham (o vão não entra)
  abertas: Set<string> // os ids das portas abertas agora
}

const ESPESSURA = 0.12
const PASSO = 0.45 // o degrau mais alto que os pés sobem sozinhos (m)

const ehVao = (o?: Opening) => !!o && o.kind === 'porta' && o.door === 'vao'
const ehPorta = (o: Opening) => o.kind === 'porta' && o.door !== 'vao'
const ESPESSURA_CORRIMAO = 0.1

export function montarMundo(chunks: Chunk[], levels: number): Mundo {
  const caixas: Caixa[] = [], pisos = new Set<string>(), escadas: Stair[] = []
  const portas = chunks.flatMap((c) => c.openings).filter(ehPorta)
  const abertas = new Set(portas.filter((o) => (o.estado ?? 'fechada') === 'aberta').map((o) => o.id))
  const aberturas = new Map<string, Opening>()
  for (const c of chunks) for (const o of c.openings) for (let i = 0; i < o.width; i++)
    aberturas.set(`${o.level}|${o.axis}|${o.axis === 'x' ? o.x + i : o.x}|${o.axis === 'z' ? o.z + i : o.z}`, o)
  for (const c of chunks) {
    for (const w of c.walls) {
      const o = aberturas.get(`${w.level}|${w.axis}|${w.x}|${w.z}`)
      if (ehVao(o)) continue
      const y0 = w.level * LEVEL_H, porta = o && ehPorta(o) ? o.id : undefined
      caixas.push(w.axis === 'x'
        ? { x: w.x + 0.5, z: w.z, hx: 0.5 + ESPESSURA / 2, hz: ESPESSURA / 2, yaw: 0, level: w.level, y0, y1: y0 + LEVEL_H, porta }
        : { x: w.x, z: w.z + 0.5, hx: ESPESSURA / 2, hz: 0.5 + ESPESSURA / 2, yaw: 0, level: w.level, y0, y1: y0 + LEVEL_H, porta })
    }
    for (const p of c.props) {
      const def = OBJETOS[p.type]
      if (!def || def.apoio === 'teto' || def.apoio === 'parede' || def.tam[1] < 0.15) continue // o que fica no teto, na parede e o tapete não batem
      caixas.push({ x: p.pos[0], z: p.pos[2], hx: def.tam[0] / 2, hz: def.tam[2] / 2, yaw: (p.rot[1] * Math.PI) / 180, level: p.level, y0: p.pos[1], y1: p.pos[1] + def.tam[1], vazado: def.vazado })
    }
    for (const f of c.floors) pisos.add(`${f.level}_${f.x}_${f.z}`)
    escadas.push(...c.stairs)
  }
  // o buraco da escada: o piso de cima não segura ninguém ali
  for (const s of escadas) for (let x = s.x; x < s.x + s.w; x++) for (let z = s.z; z < s.z + s.d; z++) pisos.delete(`${s.level + 1}_${x}_${z}`)
  // o corrimão automático: nos lados da escada, uma caixa do pé ao topo (não cai pelo lado nem entra pelo lado);
  // em volta do buraco de cima, o guarda-corpo reto
  const { lados, beiradas } = corrimaos(chunks), e = ESPESSURA_CORRIMAO / 2
  for (const { st, c } of lados) {
    const { ns, comp, larg } = medidas(st), [x, z] = noMundo(st, comp / 2, c === 0 ? RECUO : larg - RECUO), y0 = st.level * LEVEL_H
    caixas.push({ x, z, hx: ns ? e : comp / 2, hz: ns ? comp / 2 : e, yaw: 0, level: st.level, y0, y1: y0 + st.rise + GUARDA.altura, vazado: true })
  }
  for (const b of beiradas) {
    const y0 = b.level * LEVEL_H, off = b.fora * RECUO
    caixas.push(b.axis === 'x'
      ? { x: b.x + b.len / 2, z: b.z + off, hx: b.len / 2, hz: e, yaw: 0, level: b.level, y0, y1: y0 + GUARDA.altura, vazado: true }
      : { x: b.x + off, z: b.z + b.len / 2, hx: e, hz: b.len / 2, yaw: 0, level: b.level, y0, y1: y0 + GUARDA.altura, vazado: true })
  }
  return { caixas, pisos, escadas, levels, portas, abertas }
}

/** A altura da escada no ponto (x, z), ou null se o ponto não está nela. */
function alturaNaEscada(s: Stair, x: number, z: number): number | null {
  if (x < s.x || x > s.x + s.w || z < s.z || z > s.z + s.d) return null
  const t = s.dir === 'sul' ? (z - s.z) / s.d : s.dir === 'norte' ? (s.z + s.d - z) / s.d : s.dir === 'leste' ? (x - s.x) / s.w : (s.x + s.w - x) / s.w
  return s.level * LEVEL_H + Math.min(1, Math.max(0, t)) * s.rise
}

/**
 * O chão sob os pés: a superfície mais alta que fica no máximo um degrau acima de y (assim sobe escada e degrau,
 * mas não "sobe" no andar de cima atravessando o teto). null = nada embaixo (cai).
 */
export function chaoEm(m: Mundo, x: number, z: number, y: number): number | null {
  let melhor: number | null = null
  const ok = (h: number) => { if (h <= y + PASSO && (melhor === null || h > melhor)) melhor = h }
  ok(0) // o térreo é chão em toda parte
  const fx = Math.floor(x), fz = Math.floor(z)
  for (let L = 1; L < m.levels; L++) if (m.pisos.has(`${L}_${fx}_${fz}`)) ok(L * LEVEL_H)
  for (const s of m.escadas) { const h = alturaNaEscada(s, x, z); if (h !== null) ok(h) }
  return melhor
}

/** O andar dos pés (as paredes e móveis deste andar é que batem). */
export const andarDe = (y: number) => Math.max(0, Math.floor((y + 0.6) / LEVEL_H))

/** Empurra o círculo (x, z, raio r) para fora das caixas do andar que cruzam a altura do corpo. */
export function empurrar(m: Mundo, p: { x: number; z: number }, y: number, r: number) {
  for (let volta = 0; volta < 2; volta++) {
    for (const o of m.caixas) {
      if (y + 1.7 < o.y0 || y + 0.3 > o.y1) continue // a caixa está acima da cabeça ou abaixo dos joelhos
      if (o.porta && m.abertas.has(o.porta)) continue // porta aberta
      const c = Math.cos(o.yaw), s = Math.sin(o.yaw), dx = p.x - o.x, dz = p.z - o.z
      const lx = dx * c - dz * s, lz = dx * s + dz * c
      const qx = Math.min(o.hx, Math.max(-o.hx, lx)), qz = Math.min(o.hz, Math.max(-o.hz, lz)), ex = lx - qx, ez = lz - qz, d = Math.hypot(ex, ez)
      if (d >= r) continue
      let nx: number, nz: number, pen: number
      if (d > 1e-5) { nx = ex / d; nz = ez / d; pen = r - d }
      else { const px = o.hx - Math.abs(lx), pz = o.hz - Math.abs(lz); if (px < pz) { nx = Math.sign(lx) || 1; nz = 0; pen = px + r } else { nx = 0; nz = Math.sign(lz) || 1; pen = pz + r } }
      p.x += (nx * c + nz * s) * pen; p.z += (-nx * s + nz * c) * pen
    }
  }
}

/**
 * O braço da câmera: do ombro (a) até onde ela quer ficar (b), quanto do caminho (0..1) dá para andar antes de bater
 * numa parede ou móvel do andar (com uma folga, para a câmera não encostar).
 */
export function alcanceCamera(m: Mundo, a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }, folga = 0.22): number {
  let k = 1
  const dx = b.x - a.x, dz = b.z - a.z
  for (const o of m.caixas) {
    if (o.vazado || (o.porta && m.abertas.has(o.porta))) continue
    const ym = (a.y + b.y) / 2
    if (ym < o.y0 || ym > o.y1) continue
    const c = Math.cos(o.yaw), s = Math.sin(o.yaw)
    const ox = (a.x - o.x) * c - (a.z - o.z) * s, oz = (a.x - o.x) * s + (a.z - o.z) * c
    const vx = dx * c - dz * s, vz = dx * s + dz * c
    const hx = o.hx + folga, hz = o.hz + folga
    let t0 = 0, t1 = 1
    for (const [O, V, H] of [[ox, vx, hx], [oz, vz, hz]] as [number, number, number][]) {
      if (Math.abs(V) < 1e-9) { if (O < -H || O > H) { t0 = 2; break } continue }
      let ta = (-H - O) / V, tb = (H - O) / V
      if (ta > tb) [ta, tb] = [tb, ta]
      t0 = Math.max(t0, ta); t1 = Math.min(t1, tb)
    }
    if (t0 <= t1 && t0 < k && t1 > 0) k = Math.max(0, t0)
  }
  return k
}

/** Tem piso (teto) logo acima? Para a câmera não subir para o andar de cima. */
export function tetoEm(m: Mundo, x: number, z: number, y: number): number | null {
  const L = andarDe(y) + 1
  if (L >= m.levels) return null
  return m.pisos.has(`${L}_${Math.floor(x)}_${Math.floor(z)}`) ? L * LEVEL_H - 0.02 : null
}
