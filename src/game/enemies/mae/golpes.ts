// Os ataques da Mãe (do laboratório v130): cada golpe tem um tempo, uma dureza (rate) e, a cada quadro, a pose dele e
// o quanto ela avança (m/s, para a frente) e a altura do corpo (a investida sai de baixo do chão). Quem a move no
// mundo (com as paredes) é quem a controla: a inteligência depois, o Ver modelos agora. "perto" = a distância até o
// alvo à frente dela (as garradas e a corrida param quando chegam).
//   garra: ergue o braço (o aviso), corta na diagonal com um passo à frente (o bote); a última garrada fica mais;
//   aproximar: avança aos trancos (arranca, quase para, arranca) até ficar a 1 m;
//   investida: sai de baixo voando baixo, garras na frente, a boca escancarada; pousa derrapando e volta à guarda;
//   carga: agacha tremendo e guincha (o aviso), dispara correndo em linha reta e derrapa.
// O aviso (o chão que estufa e brilha vermelho enquanto ela está embaixo) vem com o Luto.
import { GOLPE } from './numeros'
import { misturar, pose0, type Pose } from './pose'

export type NomeGolpe = 'garra_d' | 'garra_e' | 'garra_ultima_d' | 'garra_ultima_e' | 'aproximar' | 'investida' | 'carga'
/** parou = quando parou de correr (−1 = ainda não); alcance = até onde a investida vai (m); fase = o passo da corrida */
export interface Golpe { nome: NomeGolpe; t: number; dur: number; rate: number; parou: number; alcance: number; fase: number }

const sm = (x: number) => { const k = Math.max(0, Math.min(1, x)); return k * k * (3 - 2 * k) }
const lerp = (a: number, b: number, k: number) => a + (b - a) * k

/** Começa um golpe. */
export function novoGolpe(nome: NomeGolpe): Golpe {
  const G = GOLPE
  const dur = nome.startsWith('garra') ? G.garra.preparo + (nome.includes('ultima') ? G.garra.ultima : G.garra.corte)
    : nome === 'aproximar' ? G.aproximar.dur : nome === 'investida' ? G.investida.dur : G.carga.prepara + G.carga.corre + G.carga.derrapa
  const rate = nome.startsWith('garra') ? G.garra.rate : G[nome as 'aproximar' | 'investida' | 'carga'].rate
  return { nome, t: 0, dur, rate, parou: -1, alcance: 0, fase: 0 }
}

/** Um quadro do golpe: muda a pose-alvo (que chega com a parada dentro) e diz quanto ela avança e a altura do corpo. */
export function quadroDoGolpe(g: Golpe, P: Pose, parada: Pose, perto: number, dt: number): { avanca: number; y: number } {
  const t = g.t
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
