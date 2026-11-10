// A queda do agente, sem violência (decidida em 10/nov): perde as forças (a cabeça cai, o tronco curva, os joelhos
// amolecem), cai de joelhos e tomba de lado, um pouco encolhido; o rosto desmaia (olhos fechados) e o peito continua
// respirando: desacordado, não morto. Nada de sangue, ferimento ou membro torcido. A tela escurece e ele volta no
// checkpoint (quem cuida é o jogo: o Testar). Por cima da pose em pé: cada fase puxa os ossos para a dela.
import type { Agente } from './modelo'
import { QUEDA } from './numeros'

const cl = (x: number) => Math.max(0, Math.min(1, x))
const sm = (x: number) => { const k = cl(x); return k * k * (3 - 2 * k) }
const lerp = (a: number, b: number, k: number) => a + (b - a) * k
const fase = (q: number, [de, ate]: number[]) => sm((q - de) / (ate - de))

/** Quanto a queda manda na pose (0 em pé, 1 logo depois de começar). As outras camadas (mira, gestos) somem com ela. */
export const pesoDaQueda = (q: number) => (q < 0 ? 0 : sm(q / 0.12))

/** A pose da queda, q segundos depois de começar (−1 = em pé). Depois dela, o chão acerta a altura (o mais baixo do corpo). */
export function poseDaQueda(a: Agente, q: number) {
  if (q < 0) return
  const kA = sm(q / QUEDA.cede), kB = fase(q, QUEDA.joelhos), kC = fase(q, QUEDA.tomba), L = QUEDA.lado
  // cede: a cabeça pende, o tronco curva para a frente
  a.spine.rotation.x = lerp(a.spine.rotation.x, 0.3 - 0.05 * kC, kA)
  a.chest.rotation.x = lerp(a.chest.rotation.x, 0.12, kA)
  a.neck.rotation.x = lerp(a.neck.rotation.x, 0.35, kA); a.head.rotation.x = lerp(a.head.rotation.x, 0.3, kA)
  a.neck.rotation.y *= 1 - kA; a.head.rotation.y *= 1 - kA
  a.neck.rotation.z = lerp(a.neck.rotation.z, -L * 0.25, kC) // no chão, a cabeça deita no braço de baixo
  // as pernas: amolecem, ajoelham (a canela para trás, no chão, e o pé esticado) e, deitado, encolhem um pouco
  for (const P of a.legs) {
    const thA = lerp(P.th.rotation.x - 0.2, -0.1, kB), knA = lerp(P.kn.rotation.x + 0.45, 1.75, kB), ftA = lerp(P.ft.rotation.x, 1.3, kB)
    P.th.rotation.x = lerp(P.th.rotation.x, lerp(thA, -0.75, kC), kA)
    P.kn.rotation.x = lerp(P.kn.rotation.x, lerp(knA, 1.35, kC), kA)
    P.ft.rotation.x = lerp(P.ft.rotation.x, lerp(ftA, 0.4, kC), kA)
    P.th.rotation.z = lerp(P.th.rotation.z, P.s * 0.04, kA)
  }
  // os braços: soltos, pendendo; deitado, o de baixo estica no chão à frente e o de cima descansa na frente do corpo
  for (const b of a.arms) {
    const baixo = b.s === -L ? 1 : 0 // −L: o lado em que ele cai
    const ux = lerp(lerp(b.up.rotation.x, 0.12, kA), baixo ? -1.25 : -0.55, kC)
    b.up.rotation.set(ux, 0, lerp(b.up.rotation.z, b.s * 0.12, kA), 'XZY')
    b.fo.rotation.x = lerp(lerp(b.fo.rotation.x, -0.25, kA), baixo ? -0.35 : -0.9, kC)
  }
  // a mão da arma não larga, mas dobra o pulso: o cano fica deitado para a frente (pendendo, a escopeta entraria no chão)
  if (a.arma === 'pistola' || a.arma === 'escopeta') a.arms[0].hd.rotation.x = lerp(a.arms[0].hd.rotation.x, -1.3, kA)
  // tomba de lado em volta do meio do corpo (o chão acerta a altura depois)
  a.roll.rotation.z = lerp(a.roll.rotation.z, L * 1.38, kC)
}
