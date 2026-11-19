// A luz "assada" (a etapa 3b da iluminação): quanto de luz de cada lâmpada e de cada janela do mapa chega num ponto
// do cenário, com as paredes e os pisos bloqueando. A malha do mapa guarda isso em cada vértice (editor/wallMesh.ts).
// Não fica gravado no mapa: é calculado das paredes, dos pisos, das janelas e dos objetos de luz ao montar a malha.
//   - as lâmpadas: no Baixo e no Médio o cenário usa essa luz no lugar das lâmpadas de verdade; no Alto, só as lâmpadas
//     que fazem sombra são de verdade, e as outras vêm daqui (assim nenhuma vaza pela parede: render/assada.ts). Para
//     o jogo poder tirar da conta as que são de verdade, cada vértice guarda as duas lâmpadas mais fortes nele com o
//     número de cada uma (idLampada), e o resto somado. O número negativo marca a lâmpada "falhando" (pisca).
//     No cenário (19/nov) as duas mais fortes são escolhidas por face e contadas em cada pixel (LuzFace, `face`); a
//     amostra de um ponto só (LuzVertice) continua valendo para os objetos e os personagens.
//   - as janelas com luar: iluminam o cômodo de verdade (o feixe e a mancha de editor/Luar.tsx são só o desenho);
//     valem em todos os níveis.
//   - a luz indireta (o recurso "Luz indireta", do Ultra): a luz que sobra depois de bater nas coisas. É calculada
//     como a luz dos blocos do Minecraft: cada quadrado de piso com uma lâmpada, uma janela ou o céu por cima começa
//     com um tanto de luz, e ela se espalha de quadrado em quadrado perdendo força, passa pelas portas e pelo vão da
//     escada e para nas paredes. Com ela ligada a luz ambiente geral baixa (INDIRETA.ambiente): o cômodo vizinho de um
//     cômodo aceso fica na penumbra e o que está longe de qualquer luz fica escuro de verdade.
// A conta é a mesma da luz pontual do three, para os caminhos ficarem parecidos.
// O que passa e o que bloqueia: parede bloqueia (a janela também); porta e vão deixam passar só pelo buraco deles (a
// parede em cima da porta bloqueia), com a porta aberta ou fechada (ela muda durante o jogo e a malha não é refeita);
// o piso de um andar bloqueia a luz do outro (onde não tem piso, como no pé-direito duplo, passa).
import * as THREE from 'three'
import { FORCA_LUZ, OBJETOS } from './objetos'
import { LEVEL_H, PORTA_GRANDE_H, PORTA_H, portaAlta, type Chunk, type Prop } from './types'

type V3 = [number, number, number]
type V4 = [number, number, number, number]
interface Fonte { x: number; y: number; z: number; level: number; r: number; g: number; b: number; alcance: number; id: number; dentro?: V3 }

export const DECAIMENTO = 1.6 // o mesmo das lâmpadas de verdade (render/sombras.ts) e da conta em cada pixel (render/assada.ts)
/** A luz de uma janela com luar: a cor, a força por metro de largura, o alcance e a que altura fica o meio dela (m). */
export const JANELA = { cor: '#a9c2f0', forca: 5, alcance: 8, altura: 1.5 }
/** A luz indireta: rebote = quanto da força de uma lâmpada ou janela vira luz no quadrado dela; queda = o que sobra a
 *  cada metro; branco = o quanto a cor da fonte perde ao rebater (a luz que volta das paredes é mais neutra que a
 *  da lâmpada); ceu = a luz dos quadrados a céu aberto (a cor e a força); ambiente = o quanto sobra da luz ambiente
 *  geral das ambientações quando a indireta está ligada. */
export const INDIRETA = { rebote: 0.08, branco: 0.55, queda: 0.74, ceu: '#7f9fe0', forcaCeu: 1.5, ambiente: 0.45 }
const rad = (v: number) => (v * Math.PI) / 180

/** O número de uma lâmpada pela posição dela no mundo (o mesmo aqui e na lâmpada de verdade: editor/Objetos.tsx). */
/** Onde fica a lâmpada de um objeto que acende (m, no mundo), girada com ele. */
const _e = new THREE.Euler(), _v = new THREE.Vector3()
export function lampadaDe(p: Pick<Prop, 'type' | 'pos' | 'rot'>): V3 | null {
  const l = OBJETOS[p.type]?.luz
  if (!l) return null
  _v.set(...l.pos).applyEuler(_e.set(rad(p.rot[0]), rad(p.rot[1]), rad(p.rot[2]), 'YXZ'))
  return [p.pos[0] + _v.x, p.pos[1] + _v.y, p.pos[2] + _v.z]
}

/** O objeto que acende não estoura com a própria luz: na amostra dele, a lâmpada dele conta como se estivesse a pelo
 *  menos PERTO m (a cúpula da luminária de mesa fica a 8 cm da lâmpada e ficaria toda branca). */
const PERTO = 0.4
export function amaciarPropria(out: LuzVertice, ponto: V3, p: Pick<Prop, 'type' | 'pos' | 'rot'>) {
  const l = lampadaDe(p)
  if (!l) return
  const id = idLampada(l[0], l[1], l[2]), d = Math.hypot(l[0] - ponto[0], l[1] - ponto[1], l[2] - ponto[2])
  const f = Math.min(1, Math.max(d ** DECAIMENTO, 0.01) / PERTO ** DECAIMENTO)
  for (const v of [out.a, out.b]) if (Math.abs(v[3]) === id) for (let i = 0; i < 3; i++) v[i] *= f
}

/** Um personagem colado numa lâmpada não estoura (o Victor a 70 cm da luminária de mesa recebia 3 vezes a luz do
 *  Matheus, e a camisa branca ficava chapada): na amostra dele, cada lâmpada sozinha clareia no máximo `max` (o brilho
 *  de uma luminária de teto num corredor fica perto de 1). */
export const LUZ_NO_PERSONAGEM = 1.15
/** O mesmo para um objeto colado numa lâmpada (a pasta ao lado da luminária de mesa): o máximo de uma lâmpada sozinha. */
export const LUZ_NO_OBJETO = 1.1
export function limitarLampadas(out: LuzVertice, max = LUZ_NO_PERSONAGEM) {
  for (const v of [out.a, out.b]) {
    const l = 0.3 * v[0] + 0.59 * v[1] + 0.11 * v[2]
    if (l > max) for (let i = 0; i < 3; i++) v[i] *= max / l
  }
}

export const idLampada = (x: number, y: number, z: number) => 1 + ((((Math.round(x * 20) * 73856093) ^ (Math.round(y * 20) * 19349663) ^ (Math.round(z * 20) * 83492791)) >>> 0) % 60000)

/** A luz de um vértice: as duas lâmpadas mais fortes (r, g, b, número), o resto das lâmpadas somado, a das janelas e
 *  a indireta. */
export interface LuzVertice { a: V4; b: V4; resto: V3; janela: V3; indireta: V3 }
export const novaLuzVertice = (): LuzVertice => ({ a: [0, 0, 0, 0], b: [0, 0, 0, 0], resto: [0, 0, 0], janela: [0, 0, 0], indireta: [0, 0, 0] })

/** Calcula em `out` a luz que chega no ponto p, de normal n. `de` = um ponto um pouco para dentro da face (é dele que
 *  se olha para a fonte: o vértice mesmo fica em cima da linha da parede).
 *  n = null: a amostra de um objeto inteiro (um móvel, o agente), sem direção: metade da luz de cada fonte que o vê. */
export type Assador = ((p: V3, n: V3 | null, de: V3, level: number, out: LuzVertice) => void) & {
  /** A luz de uma face do cenário (os cantos p, a normal n e os pontos `de`, um por canto): ver LuzFace. */
  face: (p: V3[], n: V3, de: V3[], level: number, out: LuzFace) => void
}

/** Uma das duas lâmpadas mais fortes de uma face: onde está, o alcance, a cor × a força com o número dela (negativo =
 *  falhando) e se cada canto da face a vê (1) ou tem parede ou piso no caminho (0). */
export interface LampadaDaFace { pos: V3; alcance: number; cor: V4; ve: number[] }
/** A luz de uma face do cenário (19/nov). As duas lâmpadas mais fortes são as mesmas nos cantos todos, e a conta delas
 *  (a distância, o ângulo) é feita em cada pixel (render/assada.ts): a poça de luz sai redonda e macia, e não em losango
 *  de vértice a vértice. O que continua por canto: se ele vê cada lâmpada, o resto das lâmpadas somado, as janelas e a
 *  indireta. */
export interface LuzFace { a: LampadaDaFace; b: LampadaDaFace; cantos: { resto: V3; janela: V3; indireta: V3 }[] }
const semLampada = (): LampadaDaFace => ({ pos: [0, 0, 0], alcance: 1, cor: [0, 0, 0, 0], ve: [0, 0, 0, 0] })
export const novaLuzFace = (): LuzFace => ({ a: semLampada(), b: semLampada(), cantos: [0, 1, 2, 3].map(() => ({ resto: [0, 0, 0], janela: [0, 0, 0], indireta: [0, 0, 0] })) })

export function assadorDe(chunks: Chunk[]): Assador {
  const paredes = new Set<string>(), pisos = new Set<string>(), portas = new Map<string, number>(), fontes: Fonte[] = [] // portas: a altura do buraco de cada pedaço
  const cor = new THREE.Color()
  for (const c of chunks) {
    for (const f of c.floors) pisos.add(`${f.level}|${f.x}|${f.z}`)
    for (const o of c.openings) {
      if (o.kind === 'porta') for (let i = 0; i < o.width; i++) portas.set(`${o.level}|${o.axis}|${o.axis === 'x' ? o.x + i : o.x}|${o.axis === 'z' ? o.z + i : o.z}`, portaAlta(o.door) ? PORTA_GRANDE_H : PORTA_H)
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
      cor.set(l.cor ?? FORCA_LUZ.cor).multiplyScalar(l.forca ?? FORCA_LUZ.forca)
      const [x, y, z] = lampadaDe(p)!
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

  // ---------- a luz indireta: a luz de cada quadrado de piso, espalhada de quadrado em quadrado ----------
  const ind = new Map<string, V3>()
  let topo = 0
  for (const k of pisos) { ind.set(k, [0, 0, 0]); topo = Math.max(topo, +k.split('|')[0]) }
  // entre dois quadrados vizinhos do andar L: sem parede no meio? (a porta e o vão deixam passar)
  const livre = (L: number, x: number, z: number, nx: number, nz: number) => !paredes.has(nx !== x ? `${L}|z|${Math.max(x, nx)}|${z}` : `${L}|x|${x}|${Math.max(z, nz)}`)
  // o quadrado de piso embaixo de um ponto (descendo os andares: no pé-direito duplo e no vão da escada é o de baixo)
  const quadradoDe = (L: number, x: number, z: number) => { for (let l = Math.min(L, topo); l >= 0; l--) if (pisos.has(`${l}|${x}|${z}`)) return l; return -1 }
  const aberto = (L: number, x: number, z: number) => { for (let l = L + 1; l <= topo; l++) if (pisos.has(`${l}|${x}|${z}`)) return false; return true }
  const fila: string[] = []
  const semear = (k: string, r: number, g: number, b: number) => { const c = ind.get(k); if (!c) return; c[0] = Math.max(c[0], r); c[1] = Math.max(c[1], g); c[2] = Math.max(c[2], b); fila.push(k) }
  cor.set(INDIRETA.ceu).multiplyScalar(INDIRETA.forcaCeu)
  for (const k of pisos) { const [L, x, z] = k.split('|').map(Number); if (aberto(L, x, z)) semear(k, cor.r, cor.g, cor.b) }
  for (const l of fontes) {
    const x = Math.floor(l.x), z = Math.floor(l.z), L = quadradoDe(l.level, x, z)
    if (L < 0) continue
    // a fonte muito acima do chão (a lâmpada do teto alto do salão) rebate menos nele; e a cor volta mais neutra
    const c = ind.get(`${L}|${x}|${z}`)!, k = INDIRETA.rebote * Math.min(1, 3 / Math.max(l.y - L * LEVEL_H, 0.5)), m = ((l.r + l.g + l.b) / 3) * INDIRETA.branco, q = 1 - INDIRETA.branco
    semear(`${L}|${x}|${z}`, c[0] + (l.r * q + m) * k, c[1] + (l.g * q + m) * k, c[2] + (l.b * q + m) * k)
  }
  const LADOS = [[1, 0], [-1, 0], [0, 1], [0, -1]]
  while (fila.length) {
    const k = fila.pop()!, c = ind.get(k)!, [L, x, z] = k.split('|').map(Number)
    const r = c[0] * INDIRETA.queda, g = c[1] * INDIRETA.queda, b = c[2] * INDIRETA.queda
    if (r + g + b < 0.01) continue
    const passar = (kn: string) => { const v = ind.get(kn); if (v && (r > v[0] + 0.002 || g > v[1] + 0.002 || b > v[2] + 0.002)) semear(kn, r, g, b) }
    for (const [dx, dz] of LADOS) {
      const nx = x + dx, nz = z + dz
      if (!livre(L, x, z, nx, nz)) continue
      if (pisos.has(`${L}|${nx}|${nz}`)) passar(`${L}|${nx}|${nz}`)
      else if (L > 0) { const lb = quadradoDe(L - 1, nx, nz); if (lb >= 0) passar(`${lb}|${nx}|${nz}`) } // a borda de um vão: desce
      // e sobe: o vizinho do andar de cima, se este quadrado está embaixo de um vão (sem piso em cima) e não há parede lá
      if (L < topo && !pisos.has(`${L + 1}|${x}|${z}`) && pisos.has(`${L + 1}|${nx}|${nz}`) && livre(L + 1, x, z, nx, nz)) passar(`${L + 1}|${nx}|${nz}`)
    }
  }
  /** A luz indireta num ponto: a média dos quadrados em volta do canto da grade mais perto dele, só os que não têm
   *  parede no meio (o degradê fica macio dentro do cômodo e não vaza para o vizinho). */
  function indiretaEm(p: V3, de: V3, level: number, out: V3) {
    const bx = Math.floor(de[0]), bz = Math.floor(de[2]), L = quadradoDe(level, bx, bz)
    if (L < 0) { if (aberto(level, bx, bz)) { cor.set(INDIRETA.ceu).multiplyScalar(INDIRETA.forcaCeu); out[0] = cor.r; out[1] = cor.g; out[2] = cor.b } else out.fill(0); return }
    const base = ind.get(`${L}|${bx}|${bz}`)!, gx = Math.round(p[0]), gz = Math.round(p[2])
    let r = base[0], g = base[1], b = base[2], n = 1
    const soma = (x: number, z: number) => { const v = ind.get(`${L}|${x}|${z}`); if (v) { r += v[0]; g += v[1]; b += v[2]; n++ } return !!v }
    // os outros três quadrados em volta do canto: os dois de lado (se não há parede) e o da diagonal (se um dos de lado passou)
    const ox = bx === gx ? gx - 1 : gx, oz = bz === gz ? gz - 1 : gz
    if (Math.abs(bx - gx + 0.5) <= 0.5 && Math.abs(bz - gz + 0.5) <= 0.5) {
      const a = livre(L, bx, bz, ox, bz) && soma(ox, bz), c = livre(L, bx, bz, bx, oz) && soma(bx, oz)
      if ((a && livre(L, ox, bz, ox, oz)) || (c && livre(L, bx, oz, ox, oz))) soma(ox, oz)
    }
    out[0] = r / n; out[1] = g / n; out[2] = b / n
  }

  /** O quanto da fonte chega no ponto p de normal n, sem olhar o que há no caminho (0 = fora do alcance ou de costas):
   *  a mesma queda da luz pontual do three, 1 / d^decaimento, apagando até o alcance. */
  function forca(l: Fonte, p: V3, n: V3 | null) {
    const lx = l.x - p[0], ly = l.y - p[1], lz = l.z - p[2], d2 = lx * lx + ly * ly + lz * lz
    if (d2 >= l.alcance * l.alcance) return 0
    const d = Math.sqrt(d2) || 1e-4, nl = n ? (n[0] * lx + n[1] * ly + n[2] * lz) / d : 0.5
    if (nl <= 0) return 0
    const q = d / l.alcance, corte = Math.max(0, 1 - q * q * q * q)
    return (nl * corte * corte) / Math.max(d ** DECAIMENTO, 0.01)
  }
  /** O ponto `de`, no andar level, vê a fonte? (o lado de dentro da janela, os pisos e as paredes no caminho) */
  function ve(l: Fonte, de: V3, level: number) {
    if (l.dentro && (de[0] - l.x) * l.dentro[0] + (de[2] - l.z) * l.dentro[2] < -0.25) return false // a janela não ilumina para fora
    // em andares diferentes: o piso no meio bloqueia (em cima do ponto ou embaixo da fonte)
    if (l.level !== level) {
      for (let L = Math.min(l.level, level) + 1; L <= Math.max(l.level, level); L++) if (pisos.has(`${L}|${Math.floor(de[0])}|${Math.floor(de[2])}`) || pisos.has(`${L}|${Math.floor(l.x)}|${Math.floor(l.z)}`)) return false
    }
    return !(tapado(level, de[0], de[1], de[2], l.x, l.y, l.z) || (l.level !== level && tapado(l.level, de[0], de[1], de[2], l.x, l.y, l.z)))
  }

  // a face inteira: as duas lâmpadas que mais iluminam os quatro cantos juntos ficam para a conta de cada pixel
  const ks = [0, 0, 0, 0], ka = [0, 0, 0, 0], kb = [0, 0, 0, 0] // o quanto chega em cada canto: da fonte da vez, da lâmpada A, da B
  const face: Assador['face'] = (p, n, de, level, out) => {
    for (let j = 0; j < 4; j++) { const c = out.cantos[j]; c.resto.fill(0); c.janela.fill(0); indiretaEm(p[j], de[j], level, c.indireta) }
    let A: Fonte | null = null, B: Fonte | null = null, fa = 0, fb = 0 // as duas guardadas e a força delas nos quatro cantos
    const somar = (onde: 'resto' | 'janela', l: Fonte, k: number[]) => { for (let j = 0; j < 4; j++) { const c = out.cantos[j][onde]; c[0] += l.r * k[j]; c[1] += l.g * k[j]; c[2] += l.b * k[j] } }
    for (const l of fontes) {
      let total = 0
      for (let j = 0; j < 4; j++) { const k = forca(l, p[j], n); total += ks[j] = k > 0 && ve(l, de[j], level) ? k : 0 }
      if (total <= 0) continue
      if (l.dentro) { somar('janela', l, ks); continue }
      // entra entre as duas mais fortes (a que sair vai para o resto de cada canto), ou vai direto para o resto
      const f = total * (l.r + l.g + l.b)
      if (f > fa) { if (B) somar('resto', B, kb); B = A; fb = fa; for (let j = 0; j < 4; j++) { kb[j] = ka[j]; ka[j] = ks[j] } A = l; fa = f }
      else if (f > fb) { if (B) somar('resto', B, kb); B = l; fb = f; for (let j = 0; j < 4; j++) kb[j] = ks[j] }
      else somar('resto', l, ks)
    }
    const guardar = (x: LampadaDaFace, l: Fonte | null, k: number[]) => {
      if (!l) { x.cor.fill(0); x.ve.fill(0); x.alcance = 1; return }
      x.pos[0] = l.x; x.pos[1] = l.y; x.pos[2] = l.z; x.alcance = l.alcance; x.cor[0] = l.r; x.cor[1] = l.g; x.cor[2] = l.b; x.cor[3] = l.id
      for (let j = 0; j < 4; j++) x.ve[j] = k[j] > 0 ? 1 : 0
    }
    guardar(out.a, A, ka); guardar(out.b, B, kb)
  }

  const vertice: (p: V3, n: V3 | null, de: V3, level: number, out: LuzVertice) => void = (p, n, de, level, out) => {
    out.a.fill(0); out.b.fill(0); out.resto.fill(0); out.janela.fill(0)
    indiretaEm(p, de, level, out.indireta)
    let fa = 0, fb = 0 // a força das duas lâmpadas guardadas
    for (const l of fontes) {
      const k = forca(l, p, n)
      if (k <= 0 || !ve(l, de, level)) continue
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
  return Object.assign(vertice, { face })
}
