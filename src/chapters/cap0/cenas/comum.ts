// O que as cenas do capítulo 0 dividem: o tempo de cada fala (para a legenda e o plano durarem o que a voz leva) e a
// conta de quanto um plano precisa durar para cobrir as falas dele. Regra das cenas: ninguém corta, nem toca o alarme,
// nem sai correndo no meio de uma frase (pedido em 18/nov).
import type { Fala } from '../../../game/cenas/tipos'

// s por letra de cada um, com a voz provisória do navegador (o Victor devagar, o Matheus seco), e a pausa a mais em
// cada pontuação; com a dublagem de verdade, a duração vem do arquivo de cada fala
const RITMO: Record<string, number> = { Victor: 0.085, Matheus: 0.072, 'A central': 0.07 }
const PAUSA = 0.32

/** Uma fala em `t` s do plano; a duração sai do texto. pensamento = para si (a legenda em itálico, a boca fechada). */
export const fala = (quem: string, t: number, texto: string, pensamento = false): Fala =>
  ({ t, quem, texto, pensamento, dura: Math.max(1.3, texto.length * (RITMO[quem] ?? 0.075) + (texto.match(/[.?!…,]/g)?.length ?? 0) * PAUSA + 0.3) })

/** Quando a fala acaba (s do plano). */
export const fimDe = (f: Fala) => f.t + f.dura

/** Uma fala logo depois de outra, com um respiro entre as duas. */
export const depois = (antes: Fala, quem: string, texto: string, respiro = 0.5, pensamento = false) => fala(quem, fimDe(antes) + respiro, texto, pensamento)

/** Quanto o plano precisa durar para cobrir as falas dele: o fim da última mais um respiro (e nunca menos que `minimo`). */
export const cobre = (falas: Fala[], respiro = 0.7, minimo = 0) => Math.max(minimo, ...falas.map((f) => fimDe(f) + respiro))
