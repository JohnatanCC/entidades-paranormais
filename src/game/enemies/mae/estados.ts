// Os estados da Mãe (do laboratório v130, refeitos em 10/nov), como golpes com tempo (golpes.ts começa e conta o tempo;
// aqui, a pose):
//   grito (chama o tornado): puxa o ar (endireita, a cabeça para trás, os braços juntos), se joga para a frente olhando
//     você com os braços para trás e grita tremendo: o rosto escurece, os olhos crescem, as ondas saem da boca;
//   exausta: depois dos ataques, curvada, ofegando, os braços pendurados (a janela para atirar);
//   atordoada: a barra zerada: o golpe joga o corpo para trás, ela despenca de joelhos, endireita e arqueia com a cabeça
//     caída para trás (o rosto para o céu, o Luto transbordando dos olhos), os braços pendendo, soluçando; no fim a
//     cabeça estala de volta para a frente e ela levanta;
//   cambaleio: muito dano de uma vez: recua dois passos com a mão direita no rosto e a esquerda aberta, torta;
//   enfraquecida: a última barra zerada: de joelhos, quase apagada, balançando, o Luto escorrendo (a hora da armadilha);
//   levanta: a armadilha não veio a tempo: sai dos joelhos estalando, de volta à guarda;
//   capturada: presa nos raios da armadilha, se debate (cada quadro um tranco diferente; a dureza alta faz o resto).
// De joelhos (ajoelha): as canelas deitam no chão e o quadril desce (animacao.ts dobra as pernas assim).
import type { Contexto, Golpe } from './golpes'
import { respingo } from './luto'
import { ESTADO } from './numeros'
import { AK, misturar, type Pose } from './pose'

export type NomeEstado = 'grito' | 'exausta' | 'atordoada' | 'cambaleio' | 'enfraquecida' | 'levanta' | 'capturada'
export const ESTADOS: NomeEstado[] = ['grito', 'exausta', 'atordoada', 'cambaleio', 'enfraquecida', 'levanta', 'capturada']

const sm = (x: number) => { const k = Math.max(0, Math.min(1, x)); return k * k * (3 - 2 * k) }
const lerp = (a: number, b: number, k: number) => a + (b - a) * k

/** O Luto escorrendo dos olhos (k = o quanto: 0..1), uma gota de cada vez; alto = m/s para cima (com o rosto virado
 *  para o céu, as lágrimas transbordam para cima e escorrem pelos lados). */
function chora(g: Golpe, ctx: Contexto, k: number, dt: number, alto = -0.1) {
  if (!ctx.luto || k <= 0) return
  g.acc += 14 * k * dt
  while (g.acc > 1) { g.acc -= 1; const o = ctx.olhos()[Math.random() < 0.5 ? 0 : 1]; respingo(ctx.luto, o.x, o.z, 1, alto > 0 ? 0.25 : 0.08, alto, o.y, 0.008) }
}

/** Um quadro do estado: muda a pose-alvo (que chega com a parada dentro); devolve o quanto ela avança (m/s; recuar é
 *  negativo) e o quanto está de joelhos. */
export function quadroDoEstado(g: Golpe, P: Pose, parada: Pose, dt: number, ctx: Contexto): { avanca: number; y: number; ajoelha: number } {
  const t = g.t, nome = g.nome as NomeEstado
  if (nome === 'grito') {
    const E = ESTADO.grito
    // puxa o ar: endireita, a cabeça vai para trás, os ombros sobem, os braços se juntam à frente (a antecipação)
    const puxa = sm(t / E.puxa) * (1 - sm((t - E.puxa) / 0.1))
    // o bote: se joga para a frente olhando você, os braços para trás, a boca escancarada; treme o grito inteiro
    const on = sm((t - E.puxa) / 0.14) * (1 - sm((t - (g.dur - E.volta)) / E.volta))
    const sh = Math.sin(t * 34) * on, tr = Math.sin(t * 13) * on
    g.rate = t > E.puxa && t < E.puxa + 0.2 ? 26 : E.rate // o bote é seco
    if (on > 0.6) { g.fase -= dt; if (g.fase <= 0) { g.fase = E.onda; ctx.onda() } } // as ondas saem da boca
    P.hy = lerp(P.hy, 0.04, puxa) - 0.07 * on
    // inclinada, e cada vez mais, até o fim do grito
    P.lean = lerp(lerp(P.lean, 0.12, puxa), 0.85 + 0.08 * Math.min(1, Math.max(0, t - E.puxa) / 1.1), on) + sh * 0.012
    P.lz = sh * 0.02; P.ly *= 1 - on
    // a cabeça levanta para olhar você (a inclinação do tronco descontada)
    P.nx = lerp(lerp(P.nx, -0.35, puxa), -0.82, on) + sh * 0.03; P.ny = tr * 0.04; P.nz = P.nz * (1 - Math.max(puxa, on)) + sh * 0.04
    P.jaw = lerp(lerp(P.jaw, 0.04, puxa), 1.0, on)
    P.a.forEach((A, k) => {
      const junta = { x: -0.55, z: 0.22, tw: 0.3, el: -0.95, wr: 0.5, curl: 0.75, sp: 0.3, om: 0.22 }
      // para trás, quase deitados (o tronco inclinado já leva o braço para trás: aqui só o que falta até ~80°)
      const tras = { x: 1.4 - P.lean + sh * 0.04, z: 0.42, tw: -0.2, el: -0.12, wr: -0.55 + tr * 0.06, curl: 0.08 + 0.05 * Math.sin(t * 23 + k), sp: 1, om: 0.1 }
      for (const q of AK) A[q] = lerp(lerp(A[q], junta[q], puxa), tras[q], on)
    })
    return { avanca: 0, y: 0, ajoelha: 0 }
  }
  if (nome === 'exausta') {
    const h = Math.sin(t * 5.4)
    P.hy = -0.14; P.lean = 1.0 + h * 0.05; P.lz = 0.05; P.nx = 0.78 + h * 0.04; P.nz = 0.22; P.jaw = 0.5 + 0.12 * Math.max(0, h); P.ly = 0; P.ny = 0
    P.a.forEach((A, k) => Object.assign(A, { x: -P.lean + 0.06 + h * 0.03, z: 0.1, tw: 0, el: -0.06, wr: 0.06, curl: 0.18 + 0.12 * Math.sin(t * 9 + k), sp: 0.2 }))
    return { avanca: 0, y: 0, ajoelha: 0 }
  }
  if (nome === 'atordoada') {
    const E = ESTADO.atordoada
    const tranco = sm(t / 0.1) * (1 - sm((t - 0.28) / 0.25)) // o golpe: o corpo joga para trás, os braços abrem
    const cai = sm((t - 0.25) / 0.4) // os joelhos dobram e ela despenca
    const baque = sm((t - 0.5) / 0.15) * (1 - sm((t - 0.75) / 0.5)) // bate no chão: dobra para a frente por um instante
    const joelhos = sm((t - 0.95) / 0.8) // endireita de joelhos, arqueia, os braços pendem
    const estala = sm((t - (g.dur - E.estala)) / 0.12) // no fim, a cabeça estala de volta para a frente, olhando você
    const sobe = sm((t - (g.dur - E.sobe)) / (E.sobe - 0.1)) // e ela levanta
    const tras = joelhos * (1 - estala) // a cabeça caída para trás, o rosto para o céu
    // os soluços: de tempos em tempos um tranco curto sacode os ombros, o peito e a boca
    const so = Math.pow(Math.max(0, Math.sin(t * 5.2)), 8) * (0.4 + 0.6 * Math.max(0, Math.sin(t * 0.9))) * tras
    // a cabeça estala rápido (a dureza sobe só naquele instante)
    g.rate = estala > 0.02 && estala < 0.98 ? 34 : E.rate
    const S = misturar(parada, parada, 0)
    S.hy = 0.05 * tranco + 0.015 * so
    S.lean = -0.38 * tranco + 0.55 * baque + (-0.26 + Math.sin(t * 0.8) * 0.04) * tras - 0.05 * so
    S.lz = Math.sin(t * 0.6) * 0.07 * joelhos
    S.nx = -0.55 * tranco + 0.75 * baque - 1.4 * tras - 0.1 * so
    S.ny = Math.sin(t * 0.45) * 0.25 * tras; S.nz = Math.sin(t * 0.7 + 1) * 0.18 * tras
    S.jaw = 0.95 * tranco + 0.2 * baque + (0.45 + 0.15 * Math.sin(t * 1.9)) * tras + 0.3 * so
    S.a.forEach((A, k) => {
      // jogados para trás e para os lados no golpe; as mãos batem no chão na queda; depois pendem soltas, quase no chão,
      // os dedos mexendo sozinhos de vez em quando, os ombros subindo a cada soluço
      const mexe = 0.35 * Math.pow(Math.max(0, Math.sin(t * 3.3 + k * 2.1)), 12)
      const golpe = { x: 0.55, z: 1.05, tw: 0.3, el: -0.35, wr: -0.3, curl: 0.05, sp: 1, om: 0.15 }
      const chao = { x: -S.lean - 0.55, z: 0.3, tw: 0, el: -0.3, wr: 0.6, curl: 0.5, sp: 0.6, om: 0 }
      const pende = { x: -S.lean + 0.05, z: 0.16, tw: 0.1, el: -0.12, wr: 0.15, curl: 0.4 + mexe, sp: 0.35, om: -0.05 + 0.14 * so }
      for (const q of AK) A[q] = lerp(lerp(lerp(A[q], golpe[q], tranco), chao[q], baque), pende[q], joelhos)
    })
    misturar(S, parada, sobe, P)
    chora(g, ctx, tras, dt, 0.5)
    return { avanca: 0, y: 0, ajoelha: cai * (1 - sobe) }
  }
  if (nome === 'cambaleio') {
    const hit = sm(t / 0.12) * (1 - sm((t - 0.35) / 0.5)), hold = sm((t - 0.3) / 0.4) * (1 - sm((t - 2.55) / 0.4))
    // recua: um tranco e dois passos (a velocidade é a derivada do quanto recuou)
    const recuo = (x: number) => ESTADO.cambaleio.recua * (0.41 * sm(x / 0.18) + 0.59 * sm((x - 0.3) / 1.0))
    const avanca = dt > 0 ? -(recuo(t) - recuo(Math.max(0, t - dt))) / dt : 0
    const st = Math.sin(Math.min(1, Math.max(0, (t - 0.3) / 1.0)) * Math.PI * 2)
    P.hy += -Math.abs(st) * 0.04; P.lean = P.lean * (1 - hit) - 0.35 * hit + 0.22 * hold; P.lz += st * 0.08
    P.nx = -0.55 * hit + 0.12 * hold; P.ny = 0.16 * Math.sin(t * 4) * hold; P.jaw = 0.8 * hit + 0.3 * hold
    // a mão direita cobre o rosto (a palma nele, os dedos abertos sobre os olhos, cravando de vez em quando); a esquerda
    // abre torta na altura do ombro, para o lado, para equilibrar, e balança (os ângulos foram achados no modelo: a
    // palma a 5 cm do rosto; a esquerda a 60 cm do ombro)
    const A = P.a[0], B = P.a[1], fc = Math.min(1, hit + hold), crava = 0.3 * Math.pow(Math.max(0, Math.sin(t * 2.7)), 10)
    Object.assign(A, { x: lerp(A.x, -1.05, fc), z: lerp(A.z, -0.8, fc), tw: lerp(A.tw, -0.2, fc), el: lerp(A.el, -2.41, fc), wr: lerp(A.wr, 0.23, fc), curl: lerp(A.curl, 0.22 + crava, fc), sp: lerp(A.sp, 0.75, fc) })
    const bal = Math.sin(t * 2.3) * hold
    Object.assign(B, { x: lerp(B.x, -0.88 + 0.12 * bal, fc), z: lerp(B.z, 0.92 + 0.08 * Math.sin(t * 1.7) * hold, fc), tw: lerp(B.tw, 0.8, fc), el: lerp(B.el, -1.61, fc), wr: lerp(B.wr, 0.61 - 0.15 * bal, fc), curl: lerp(B.curl, 0.3 + 0.15 * Math.max(0, bal), fc), sp: 1 })
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
