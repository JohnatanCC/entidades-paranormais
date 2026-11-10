// Os estados da Mãe (do laboratório v130), como golpes com tempo (golpes.ts começa e conta o tempo; aqui, a pose):
//   grito: braços abertos, a cabeça para trás, tremendo (chama o tornado);
//   exausta: depois dos ataques, curvada, ofegando, os braços pendurados (a janela para atirar);
//   atordoada: a barra zerada: grita jogando os braços, cai de joelhos e agarra a cabeça, soluçando; o Luto escorre dos
//     olhos; no fim, levanta;
//   cambaleio: muito dano de uma vez: recua dois passos com a mão direita no rosto e a esquerda aberta, torta;
//   enfraquecida: a última barra zerada: de joelhos, quase apagada, balançando, o Luto escorrendo (a hora da armadilha);
//   levanta: a armadilha não veio a tempo: sai dos joelhos estalando, de volta à guarda;
//   capturada: presa nos raios da armadilha, se debate (cada quadro um tranco diferente; a dureza alta faz o resto).
// De joelhos (ajoelha): as canelas deitam no chão e o quadril desce (animacao.ts dobra as pernas assim).
import type { Contexto, Golpe } from './golpes'
import { respingo } from './luto'
import { ESTADO } from './numeros'
import { misturar, type Pose } from './pose'

export type NomeEstado = 'grito' | 'exausta' | 'atordoada' | 'cambaleio' | 'enfraquecida' | 'levanta' | 'capturada'
export const ESTADOS: NomeEstado[] = ['grito', 'exausta', 'atordoada', 'cambaleio', 'enfraquecida', 'levanta', 'capturada']

const sm = (x: number) => { const k = Math.max(0, Math.min(1, x)); return k * k * (3 - 2 * k) }
const lerp = (a: number, b: number, k: number) => a + (b - a) * k

/** O Luto escorrendo dos olhos (k = o quanto: 0..1), uma gota de cada vez. */
function chora(g: Golpe, ctx: Contexto, k: number, dt: number) {
  if (!ctx.luto || k <= 0) return
  g.acc += 14 * k * dt
  while (g.acc > 1) { g.acc -= 1; const o = ctx.olhos()[Math.random() < 0.5 ? 0 : 1]; respingo(ctx.luto, o.x, o.z, 1, 0.08, -0.1, o.y, 0.008) }
}

/** Um quadro do estado: muda a pose-alvo (que chega com a parada dentro); devolve o quanto ela avança (m/s; recuar é
 *  negativo) e o quanto está de joelhos. */
export function quadroDoEstado(g: Golpe, P: Pose, parada: Pose, dt: number, ctx: Contexto): { avanca: number; y: number; ajoelha: number } {
  const t = g.t, nome = g.nome as NomeEstado
  if (nome === 'grito') {
    const a = sm(t / 0.3) * (1 - sm((t - g.dur + 0.45) / 0.45)), sh = Math.sin(t * 31) * a
    P.lean = lerp(P.lean, -0.28, a); P.nx = lerp(P.nx, -0.75, a) + sh * 0.03; P.nz = sh * 0.05; P.jaw = lerp(P.jaw, 1.0, a); P.hy = lerp(P.hy, 0.02, a)
    for (const A of P.a) Object.assign(A, { x: lerp(A.x, -2.7, a), z: lerp(A.z, 0.95, a), el: lerp(A.el, -0.45, a), wr: lerp(A.wr, 0.8, a), curl: lerp(0.4, 0.05, a) + sh * 0.05, sp: 1 })
    return { avanca: 0, y: 0, ajoelha: 0 }
  }
  if (nome === 'exausta') {
    const h = Math.sin(t * 5.4)
    P.hy = -0.14; P.lean = 1.0 + h * 0.05; P.lz = 0.05; P.nx = 0.78 + h * 0.04; P.nz = 0.22; P.jaw = 0.5 + 0.12 * Math.max(0, h); P.ly = 0; P.ny = 0
    P.a.forEach((A, k) => Object.assign(A, { x: -P.lean + 0.06 + h * 0.03, z: 0.1, tw: 0, el: -0.06, wr: 0.06, curl: 0.18 + 0.12 * Math.sin(t * 9 + k), sp: 0.2 }))
    return { avanca: 0, y: 0, ajoelha: 0 }
  }
  if (nome === 'atordoada') {
    const reel = sm(t / 0.22) * (1 - sm((t - 0.45) / 0.35)), fall = sm((t - 0.45) / 0.55), up = sm((t - (g.dur - 0.9)) / 0.8), on = fall * (1 - up)
    const sh = Math.sin(t * 23) * on
    const S = misturar(parada, parada, 0)
    S.hy = 0.03 * reel; S.lean = -0.3 * reel + 0.8 * on; S.lz = sh * 0.025 + Math.sin(t * 1.3) * 0.05 * on
    S.nx = -0.6 * reel + 0.62 * on + Math.sin(t * 3.7) * 0.05 * on; S.ny = Math.sin(t * 8.5) * 0.13 * on; S.nz = sh * 0.04
    S.jaw = 0.95 * reel + (0.35 + 0.25 * Math.max(0, Math.sin(t * 2.1))) * on
    // jogados para os lados no grito; depois as mãos agarram a cabeça
    for (const A of S.a) Object.assign(A, { x: lerp(-2.2, -2.45, fall), z: lerp(0.75, 0.2, fall), tw: lerp(0.5, 0.75, fall), el: lerp(-1.0, -2.3, fall), wr: lerp(0.7, 0.55, fall), curl: lerp(0.15, 0.85, fall) + sh * 0.08, sp: lerp(1, 0.4, fall) })
    misturar(S, parada, up, P)
    chora(g, ctx, on, dt)
    return { avanca: 0, y: 0, ajoelha: on }
  }
  if (nome === 'cambaleio') {
    const hit = sm(t / 0.12) * (1 - sm((t - 0.35) / 0.5)), hold = sm((t - 0.3) / 0.4) * (1 - sm((t - 2.55) / 0.4))
    // recua: um tranco e dois passos (a velocidade é a derivada do quanto recuou)
    const recuo = (x: number) => ESTADO.cambaleio.recua * (0.41 * sm(x / 0.18) + 0.59 * sm((x - 0.3) / 1.0))
    const avanca = dt > 0 ? -(recuo(t) - recuo(Math.max(0, t - dt))) / dt : 0
    const st = Math.sin(Math.min(1, Math.max(0, (t - 0.3) / 1.0)) * Math.PI * 2)
    P.hy += -Math.abs(st) * 0.04; P.lean = P.lean * (1 - hit) - 0.35 * hit + 0.3 * hold; P.lz += st * 0.08
    P.nx = -0.55 * hit + 0.45 * hold; P.ny = 0.16 * Math.sin(t * 4) * hold; P.jaw = 0.8 * hit + 0.3 * hold
    // a mão direita cobre o rosto; a esquerda abre torta para equilibrar
    const A = P.a[0], B = P.a[1], fc = Math.min(1, hit + hold), o = Math.min(1, hit + hold * 0.6)
    Object.assign(A, { x: lerp(A.x, -2.3, fc), z: lerp(A.z, -0.05, fc), tw: lerp(A.tw, 0.6, fc), el: lerp(A.el, -2.35, fc), wr: lerp(A.wr, 0.35, fc), curl: lerp(A.curl, 0.7, fc), sp: lerp(A.sp, 0.5, fc) })
    Object.assign(B, { x: lerp(B.x, -1.4, o), z: lerp(B.z, 0.7, o), el: lerp(B.el, -0.9, o), wr: lerp(B.wr, 0.6, o), sp: 1 })
    return { avanca, y: 0, ajoelha: 0 }
  }
  if (nome === 'enfraquecida') {
    const b = Math.sin(t * 1.6)
    P.lean = 0.92 + b * 0.04; P.lz = Math.sin(t * 0.7) * 0.08; P.nx = 0.85; P.nz = 0.25 + Math.sin(t * 0.5) * 0.15; P.jaw = 0.42; P.ly = 0; P.ny = 0
    // os braços longos dela não cabem pendurados de joelhos: os cotovelos dobram e as mãos apoiam no chão, à frente
    P.a.forEach((A, k) => Object.assign(A, { x: -P.lean - 0.3, z: 0.22, tw: 0, el: -0.9, wr: 0.35, curl: 0.12 + 0.08 * Math.sin(t * 3 + k), sp: 0.3 }))
    chora(g, ctx, 0.5, dt)
    return { avanca: 0, y: 0, ajoelha: 1 }
  }
  if (nome === 'levanta') {
    const k = sm(t / 1.1)
    const S = misturar(parada, parada, 0)
    S.lean = 0.92; S.nx = 0.85
    for (const A of S.a) Object.assign(A, { x: -S.lean - 0.3, z: 0.22, tw: 0, el: -0.9, wr: 0.35, curl: 0.15, sp: 0.3 })
    misturar(S, parada, k, P)
    return { avanca: 0, y: 0, ajoelha: 1 - k }
  }
  // capturada: cada quadro um tranco diferente
  const j = () => Math.random() - 0.5
  P.hy = -0.05 + j() * 0.04; P.lean = -0.35 + j() * 0.2; P.nx = -0.8 + j() * 0.3; P.ny = j() * 0.6; P.nz = j() * 0.5; P.jaw = 1.0
  for (const A of P.a) Object.assign(A, { x: -2.4 + j() * 0.6, z: 0.9 + j() * 0.4, tw: 0, el: -0.4 + j() * 0.5, wr: 0.7, curl: Math.random(), sp: 1 })
  return { avanca: 0, y: 0, ajoelha: 0 }
}
