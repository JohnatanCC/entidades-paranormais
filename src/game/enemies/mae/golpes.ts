// Os ataques da Mãe (do laboratório v130): cada golpe tem um tempo, uma dureza (rate) e, a cada quadro, a pose dele e
// o quanto ela avança (m/s, para a frente) e a altura do corpo (a investida sai de baixo do chão). Quem a move no
// mundo (com as paredes) é quem a controla: a inteligência depois, o Ver modelos agora. "perto" = a distância até o
// alvo à frente dela (as garradas e a corrida param quando chegam).
//   garra: ergue o braço (o aviso), corta na diagonal com um passo à frente (o bote); a última garrada fica mais;
//   aproximar: avança aos trancos (arranca, quase para, arranca) até ficar a 1 m;
//   investida: sai de baixo voando baixo, garras na frente, a boca escancarada; pousa derrapando e volta à guarda;
//   carga: agacha tremendo e guincha (o aviso), dispara correndo em linha reta e derrapa.
// E os do Luto (os efeitos em luto.ts, no lugar onde ela está):
//   mergulhar: afunda em pé, curvando, os braços sobem e somem por último;
//   finta: surge até o peito, guincha e afunda de novo;
//   surgir: a apresentação: bolhas; as mãos rompem o Luto tateando o ar, descem e agarram o chão; ela se puxa para fora
//     curvada, a coluna desenrola, a cabeça sobe por último, tomba de lado, o pescoço estala e ela guincha;
//   aviso: ela está embaixo; o chão estufa, borbulha e brilha vermelho onde ela vai sair.
import * as THREE from 'three'
import { anel, bolha, estufar, respingo, type Luto } from './luto'
import { GOLPE, LUTO } from './numeros'
import { misturar, pose0, type Pose } from './pose'

export type NomeGolpe = 'garra_d' | 'garra_e' | 'garra_ultima_d' | 'garra_ultima_e' | 'aproximar' | 'investida' | 'carga'
  | 'mergulhar' | 'finta' | 'surgir' | 'aviso'
/** parou = quando parou de correr (−1 = ainda não); alcance = até onde a investida vai (m); fase = o passo da corrida (no
 *  aviso, o relógio das ondas); feito = os efeitos que já saíram (cada um uma vez); acc = o relógio das bolhas */
export interface Golpe { nome: NomeGolpe; t: number; dur: number; rate: number; parou: number; alcance: number; fase: number; feito: Set<string>; acc: number }
/** Onde ela está (para os efeitos do Luto) e as mãos dela (no mundo). */
export interface Contexto { luto?: Luto; onde: THREE.Vector3; maos: () => THREE.Vector3[] }
const DO_LUTO = { mergulhar: LUTO.mergulhar, finta: LUTO.finta, aviso: LUTO.aviso } as const

const sm = (x: number) => { const k = Math.max(0, Math.min(1, x)); return k * k * (3 - 2 * k) }
const lerp = (a: number, b: number, k: number) => a + (b - a) * k

/** Começa um golpe. */
export function novoGolpe(nome: NomeGolpe): Golpe {
  const G = GOLPE
  const luto = nome === 'mergulhar' || nome === 'finta' || nome === 'aviso' ? DO_LUTO[nome] : null
  const dur = nome.startsWith('garra') ? G.garra.preparo + (nome.includes('ultima') ? G.garra.ultima : G.garra.corte)
    : nome === 'aproximar' ? G.aproximar.dur : nome === 'investida' ? G.investida.dur : nome === 'carga' ? G.carga.prepara + G.carga.corre + G.carga.derrapa
    : nome === 'surgir' ? LUTO.surgir.espera + LUTO.surgir.dur : luto!.dur
  const rate = nome.startsWith('garra') ? G.garra.rate : nome === 'surgir' ? LUTO.surgir.rate : luto ? luto.rate : G[nome as 'aproximar' | 'investida' | 'carga'].rate
  return { nome, t: 0, dur, rate, parou: -1, alcance: 0, fase: 0, feito: new Set(), acc: 0 }
}

/** Um quadro do golpe: muda a pose-alvo (que chega com a parada dentro) e diz quanto ela avança e a altura do corpo. */
export function quadroDoGolpe(g: Golpe, P: Pose, parada: Pose, perto: number, dt: number, ctx: Contexto): { avanca: number; y: number } {
  const t = g.t
  if (g.nome === 'mergulhar' || g.nome === 'finta' || g.nome === 'surgir' || g.nome === 'aviso') return doLuto(g, P, parada, dt, ctx)
  if (g.nome.startsWith('garra')) {
    // k: o braço que corta (0 o direito, 1 o esquerdo); s: o lado dele (−1 direito, +1 esquerdo) para o giro do tronco
    const k = g.nome.endsWith('_d') ? 0 : 1, s = k === 0 ? -1 : 1, W = GOLPE.garra.preparo
    const w = sm(t / W), h = sm((t - W) / 0.1), f = sm((t - W - 0.1) / 0.27)
    P.ly = s * 0.5 * w * (1 - h) - s * 0.55 * h * (1 - 0.55 * f)
    P.lean = 0.5 + 0.38 * h - 0.1 * f; P.lz = s * 0.14 * w * (1 - h) - s * 0.08 * h
    P.jaw = 0.15 + 0.7 * h * (1 - f); P.nx = -0.18 * w * (1 - h) + 0.1 * h
    const A = P.a[k]
    A.x = lerp(lerp(A.x, -2.85, w), -0.55, h); A.z = lerp(lerp(A.z, 1.0, w), -0.32, h); A.tw = lerp(0.2, 0.7, w)
    A.el = lerp(lerp(A.el, -1.45, w), -0.06, h); A.wr = lerp(lerp(A.wr, 0.75, w), -0.4, h); A.curl = lerp(0.35, 0.06, w) + 0.45 * f; A.sp = 1
    const B = P.a[1 - k]; B.x = -P.lean - 0.95; B.el = -1.1; B.z = 0.3; B.curl = 0.5
    return { avanca: t > W && t < W + 0.15 && perto > 0.85 ? GOLPE.garra.bote : 0, y: 0 }
  }
  if (g.nome === 'aproximar') {
    const G = GOLPE.aproximar
    if (g.parou < 0 && perto <= G.perto) g.parou = t
    const tranco = Math.floor(t / G.tranco) % 2 ? 0.35 : 1.45 // arranca, quase para, arranca
    P.lean = 0.85; P.hy = -0.1; P.jaw = 0.4
    return { avanca: g.parou < 0 ? G.arranque * tranco : 0, y: 0 }
  }
  if (g.nome === 'investida') {
    const G = GOLPE.investida
    const up = sm(t / G.sobe), fl = Math.min(1, t / G.voo), land = sm((t - 0.55) / 0.18), rec = sm((t - 0.9) / 0.38)
    // o quanto anda: a curva do voo (rápido no começo) vezes o alcance (até perto do alvo)
    if (g.alcance === 0) g.alcance = Math.max(0.3, Math.min(G.alcance, perto - 0.9))
    const adv = (x: number) => 1 - Math.pow(1 - Math.min(1, x / G.voo), 2.4)
    const avanca = dt > 0 ? (g.alcance * (adv(t) - adv(Math.max(0, t - dt)))) / dt : 0
    uma(g, ctx, 'sai', 0, (L, o) => { respingo(L, o.x, o.z, 70, 2.4, 3.6); anel(L, o.x, o.z, 0.3, 1.8, 1.0, 0.8); anel(L, o.x, o.z, 0.2, 1.1, 0.7, 0.6) })
    const I = pose0()
    I.lean = 1.1 - 0.35 * land; I.hy = -0.2 * land; I.nx = -0.6 + 0.45 * land; I.jaw = 0.95 * (1 - land * 0.5); I.hx = -0.1 * (1 - land)
    for (const A of I.a) Object.assign(A, { x: -I.lean - 1.5 + 0.95 * land, z: 0.22 + 0.25 * land, tw: 0.3, el: -0.1 - 0.55 * land, wr: -0.2 + 0.4 * land, curl: 0.08 + 0.5 * land, sp: 1 })
    misturar(I, parada, rec, P)
    return { avanca, y: -G.fundo * (1 - up) + 0.18 * Math.sin(fl * Math.PI) * up }
  }
  // a carga
  const G = GOLPE.carga
  if (t < G.prepara) { // a preparação: agacha, treme e guincha
    const a = sm(t / 0.3), sh = Math.sin(t * 40) * a
    P.hy = -0.26 * a; P.lean = 0.62 + 0.45 * a; P.nx = -0.42 * a + sh * 0.02; P.jaw = 0.25 + 0.6 * a
    for (const A of P.a) Object.assign(A, { x: lerp(A.x, -P.lean + 0.85, a), z: lerp(0.36, 0.55, a), el: lerp(-0.55, -0.35, a), sp: 1 })
    return { avanca: 0, y: 0 }
  }
  const r = t - G.prepara
  if (g.parou < 0 && (r > G.corre || perto < G.perto)) { g.parou = r; g.dur = G.prepara + r + G.derrapa } // chegou: derrapa e acaba
  const corre = g.parou < 0, vel = corre ? G.vel : G.vel * Math.max(0, 1 - (r - g.parou) / G.derrapa)
  g.fase += dt * (corre ? 13 : 4)
  const b = Math.abs(Math.sin(g.fase)), skid = corre ? 0 : sm((r - g.parou) / G.derrapa)
  P.hy = -0.12 + b * 0.07 * (1 - skid) - 0.12 * skid; P.lean = 1.12 - 0.4 * skid; P.nx = -0.55 + 0.4 * skid; P.jaw = 0.85 * (1 - skid); P.lz = Math.sin(g.fase) * 0.06 * (1 - skid)
  P.a.forEach((A, k) => Object.assign(A, { x: -P.lean - 1.35 + Math.sin(g.fase + k * Math.PI) * 0.35 * (1 - skid), z: 0.3, el: -0.2, wr: -0.1, curl: 0.15, sp: 1 }))
  return { avanca: vel, y: 0 }
}

/** Um efeito do Luto uma vez só, quando o tempo do golpe passa do ponto. */
function uma(g: Golpe, ctx: Contexto, nome: string, quando: number, f: (L: Luto, o: THREE.Vector3) => void) {
  if (g.t >= quando && !g.feito.has(nome)) { g.feito.add(nome); if (ctx.luto) f(ctx.luto, ctx.onde) }
}

/** Os golpes do Luto: a pose, a altura do corpo (embaixo do chão) e os efeitos. */
function doLuto(g: Golpe, P: Pose, parada: Pose, dt: number, ctx: Contexto): { avanca: number; y: number } {
  const t = g.t, L = ctx.luto, o = ctx.onde
  if (g.nome === 'mergulhar') {
    const a = sm(t / 0.22), d = Math.min(1, Math.max(0, (t - 0.2) / 0.5)), up = sm((t - 0.1) / 0.3), fecha = sm((t - 0.62) / 0.25)
    P.hy = -0.17 * a * (1 - sm(d * 2)); P.lean = 0.62 + 0.3 * a - 0.75 * sm(d * 1.6); P.nx = 0.5 * a; P.jaw = 0.25 * a
    for (const A of P.a) Object.assign(A, { x: lerp(-P.lean - 0.6, -Math.PI - P.lean + 0.15, up), z: lerp(0.55, 0.14, up), tw: 0.2, el: lerp(-0.9, -0.12, up), wr: 0.25, curl: 0.12 + 0.65 * fecha, sp: 1 - 0.7 * fecha })
    uma(g, ctx, 'entra', 0.21, (L, o) => { respingo(L, o.x, o.z, 48, 1.5, 2.6); anel(L, o.x, o.z, 0.2, 1.5, 1.2, 0.7); anel(L, o.x, o.z, 0.1, 0.95, 0.85, 0.55) })
    uma(g, ctx, 'some', 0.62, (L, o) => { anel(L, o.x, o.z, 0.05, 0.7, 1.0, 0.45); respingo(L, o.x, o.z, 12, 0.6, 1.6) })
    return { avanca: 0, y: -LUTO.mergulhar.fundo * d * d } // acelera para baixo
  }
  if (g.nome === 'finta') {
    const up = sm(t / 0.26), dn = sm((t - 0.78) / 0.3)
    P.lean = 0.12; P.nx = -0.25 + 0.08 * Math.sin(t * 9); P.nz = 0.4 * up; P.jaw = 0.9 * up * (1 - dn)
    for (const A of P.a) Object.assign(A, { x: -0.1, z: 0.4, el: -0.3 })
    uma(g, ctx, 'sai', 0, (L, o) => { respingo(L, o.x, o.z, 26, 1.4, 2.6); anel(L, o.x, o.z, 0.2, 1.2, 0.9, 0.6) })
    uma(g, ctx, 'volta', 0.78, (L, o) => { respingo(L, o.x, o.z, 20, 1, 2); anel(L, o.x, o.z, 0.15, 1.0, 0.9, 0.55) })
    return { avanca: 0, y: -2.0 + 1.3 * up - 2.8 * dn }
  }
  if (g.nome === 'aviso') {
    const w = sm((t - 0.25) / Math.max(0.4, g.dur - 0.35))
    if (L) {
      estufar(L, o.x, o.z, t >= g.dur - dt * 1.5 ? 0 : w, t)
      g.acc -= dt * (2 + 16 * w)
      if (g.acc <= 0) { g.acc = 1; const a = Math.random() * 6.283, rr = Math.random() * 0.5; bolha(L, o.x + Math.cos(a) * rr, o.z + Math.sin(a) * rr, 0.7 + w * 0.6) }
      g.fase -= dt
      if (g.fase <= 0) { g.fase = 0.45 - 0.3 * w; anel(L, o.x, o.z, 0.3, 0.9 + 0.4 * w, 0.6, 0.35 + 0.3 * w) }
    }
    return { avanca: 0, y: -LUTO.mergulhar.fundo } // ela está embaixo
  }
  // surgir
  const T0 = LUTO.surgir.espera, u = t - T0
  if (L && t > T0 - 0.8 && t < T0 + 0.4) { g.acc -= dt * 9; if (g.acc <= 0) { g.acc = 1; bolha(L, o.x + (Math.random() - 0.5) * 0.6, o.z + (Math.random() - 0.5) * 0.4, 0.9) } }
  uma(g, ctx, 'rompe', T0, (L, o) => anel(L, o.x, o.z, 0.2, 1.3, 1.4, 0.6))
  uma(g, ctx, 'maos', T0 + 0.05, (L) => { for (const m of ctx.maos()) anel(L, m.x, m.z, 0.05, 0.55, 0.9, 0.5) })
  uma(g, ctx, 'agarra', T0 + 1.25, (L) => { for (const m of ctx.maos()) { anel(L, m.x, m.z, 0.1, 0.8, 1.0, 0.6); respingo(L, m.x, m.z, 10, 0.6, 1.4) } })
  uma(g, ctx, 'corpo', T0 + 2.0, (L, o) => { respingo(L, o.x, o.z, 26, 1.2, 2.2); anel(L, o.x, o.z, 0.2, 1.6, 1.2, 0.6) })
  const e1 = sm((u - 0.75) / 0.85), e2 = sm((u - 1.95) / 1.05), e3 = sm((u - 2.95) / 0.42), e4 = sm((u - 3.28) / 0.18) * (1 - sm((u - 3.75) / 0.35))
  const trem = Math.sin(t * 29) * 0.018 * (1 - e3), sway = Math.sin(t * 1.7) // um tremor fino corre por tudo enquanto sobe
  const S = pose0()
  // o tronco: ereto embaixo (as mãos para cima) → curvada, puxando-se → desenrola → arqueia no guincho
  S.lean = lerp(lerp(lerp(0.2, 1.25, e1), 0.48, e2), 0.22, e4) + trem
  S.hy = -0.12 * e1 * (1 - e2); S.hx = 0.08 * e1 * (1 - e2)
  S.ly = 0.12 * Math.sin(t * 1.3) * (1 - e3); S.lz = 0.06 * sway * (1 - e3) + trem
  // a cabeça: baixa até o fim (atrasada em relação à coluna), sobe devagar, tomba de lado; no guincho, para trás
  S.nx = lerp(lerp(0.35, 0.9, e1), -0.12, e3) - 0.45 * e4; S.nz = lerp(0.1 * sway, 0.42, e3) * (1 - 0.5 * e4) + trem * 2; S.ny = 0.15 * Math.sin(t * 0.9) * (1 - e3)
  S.jaw = 0.08 + 0.1 * e3 + 0.85 * e4
  S.a.forEach((A, k) => {
    const ph = t * 2.2 + k * 1.9, reach = Math.sin(ph) * 0.18, b = t * 2.1 + k * Math.PI
    // para cima, abertas, tateando → descem e agarram o chão à frente → soltas, balançando → abrem para trás no guincho
    const cima = { x: -Math.PI - S.lean + 0.3 + reach, z: 0.28 + 0.08 * Math.sin(ph * 0.7), el: -0.3 - 0.2 * Math.max(0, Math.sin(ph + 1)), wr: 0.25 + 0.3 * Math.sin(ph - 0.8), curl: 0.1 + 0.25 * (0.5 + 0.5 * Math.sin(ph * 1.6)), sp: 1 }
    const agarra = { x: -S.lean - 1.3, z: 0.46, el: -0.65, wr: 0.95, curl: 0.85, sp: 0.6 }
    const solta = { x: -S.lean - 0.35 + Math.sin(b) * 0.22, z: 0.3, el: -0.25 - 0.2 * Math.max(0, Math.sin(b - 0.9)), wr: 0.2 + 0.25 * Math.sin(b - 0.9), curl: 0.35, sp: 0.4 }
    const grito = { x: -S.lean + 0.25, z: 0.62, el: -0.35, wr: 0.7, curl: 0.05, sp: 1 }
    for (const q of ['x', 'z', 'el', 'wr', 'curl', 'sp'] as const) A[q] = lerp(lerp(lerp(cima[q], agarra[q], e1), solta[q], e2), grito[q], e4)
    A.tw = 0.25; A.x += trem; A.curl += Math.sin(t * 23 + k) * 0.06 * (1 - e3) // os dedos se mexem sozinhos
  })
  misturar(S, parada, sm((u - 3.75) / 0.45), P)
  const y = u < 0 ? -LUTO.mergulhar.fundo : -2.45 + 0.85 * sm(u / 0.95) + 1.05 * sm((u - 0.7) / 1.35) + 0.55 * sm((u - 1.9) / 1.15)
  return { avanca: 0, y }
}
