// Os sons do capítulo 0 (a instalação da C.R.O.S.), sintetizados na hora (audio/sintese.ts), sem arquivos. A cena da
// instalação (cenas/instalacao.ts) é sem música: o som do lugar conta a história (docs/cenas.md, a cena 2).
// Cada um é um Tocar (enemies/sons.ts): toca em t, para d, e devolve quanto dura. Os que duram o plano inteiro recebem
// a duração (s).
import { estalos, pancada, rangido, ruido, tom } from '../../audio/sintese'
import { bolha, type Tocar } from '../../game/enemies/sons'

const R = Math.random

/** O zumbido das lâmpadas fluorescentes (o reator chiando na rede: 120 Hz e o harmônico), entrando e saindo devagar. */
export const zumbido = (dura: number, k = 1): Tocar => (s, t, d) => {
  tom(s, { t, dur: dura, a: 1, r: 1, f: 120, tipo: 'sawtooth', lp: 420, gain: 0.06 * k, dest: d })
  tom(s, { t, dur: dura, a: 1, r: 1, f: 240, gain: 0.025 * k, dest: d })
  ruido(s, { t, dur: dura, a: 1, r: 1, f: 3800, q: 0.7, gain: 0.012 * k, dest: d }) // o chiado fino
  return dura + 1
}
/** Uma lâmpada falhando: dois estalos e o zumbido que corta e volta. */
export const lampadaFalha: Tocar = (s, t, d) => {
  estalos(s, { t, n: 3, i0: 0.06, i1: 0.12, f: 2600, q: 4, gain: 0.2, dest: d })
  tom(s, { t: t + 0.02, dur: 0.18, f: 120, tipo: 'square', lp: 700, gain: 0.05, dest: d })
  return 0.4
}
/** A ventilação: o ar grave e contínuo dos dutos. */
export const ventilacao = (dura: number): Tocar => (s, t, d) => {
  ruido(s, { t, dur: dura, a: 1.4, r: 1.2, tipo: 'lowpass', f: 380, gain: 0.17, dest: d })
  return dura + 1.2
}
/** Os aparelhos dos campos de pesquisa: bipes curtos de tempos em tempos. */
export const bipes = (dura: number): Tocar => (s, t, d) => {
  for (let x = 0.4; x < dura; x += 1.05 + R() * 0.5) tom(s, { t: t + x, dur: 0.05, f: R() < 0.7 ? 1760 : 1320, r: 0.04, gain: 0.08, dest: d })
  return dura
}
/** O ectoplasma borbulhando nos frascos. */
export const borbulhar = (dura: number): Tocar => (s, t, d) => {
  for (let x = 0.2; x < dura; x += 0.18 + R() * 0.45) bolha(s, t + x, d, 0.065, 300 + R() * 400)
  return dura
}
/** A TV do refeitório sem sinal: o chiado. */
export const tvChiado = (dura: number): Tocar => (s, t, d) => {
  ruido(s, { t, dur: dura, a: 0.6, r: 0.6, tipo: 'highpass', f: 2600, gain: 0.07, dest: d })
  ruido(s, { t, dur: dura, a: 0.6, r: 0.6, f: 900, q: 0.5, gain: 0.03, dest: d })
  return dura + 0.6
}
/** O relógio da parede: tique e taque, um por segundo. */
export const relogio = (dura: number): Tocar => (s, t, d) => {
  for (let x = 0.3, i = 0; x < dura; x += 1, i++) estalos(s, { t: t + x, n: 1, i0: 0, i1: 0, f: i % 2 ? 2100 : 2700, q: 9, gain: 0.5, dest: d })
  return dura
}
/** O ronco grave e longe, que cresce no andar de contenção. */
export const ronco = (dura: number): Tocar => (s, t, d) => {
  tom(s, { t, dur: dura, a: dura * 0.6, r: 0.8, f: 41, f2: 36, gain: 0.14, dest: d })
  ruido(s, { t, dur: dura, a: dura * 0.6, r: 0.8, tipo: 'lowpass', f: 140, gain: 0.08, dest: d })
  return dura + 0.8
}
/** A batida do outro lado da porta de contenção: duas pancadas no metal, a segunda mais forte. */
export const batida: Tocar = (s, t, d) => {
  pancada(s, t, 72, 0.32, d); tom(s, { t, dur: 0.25, f: 210, f2: 180, r: 0.6, gain: 0.05, dest: d }) // o metal ressoando
  pancada(s, t + 0.42, 64, 0.48, d); tom(s, { t: t + 0.42, dur: 0.3, f: 196, f2: 170, r: 0.9, gain: 0.07, dest: d })
  return 1.6
}
/** O acorde grave do título: lá, mi e dó juntos, abrindo devagar e se apagando. */
export const acorde: Tocar = (s, t, d) => {
  for (const f of [55, 82.4, 130.8]) tom(s, { t, dur: 0.8, a: 0.05, r: 2.6, f, tipo: 'sawtooth', lp: 380, gain: 0.12, dest: d })
  ruido(s, { t, dur: 0.6, a: 0.05, r: 2, tipo: 'lowpass', f: 260, gain: 0.12, dest: d })
  return 3.4
}

// ---------- a cena 2 (o escritório do Victor) ----------
/** Passos de bota no piso da instalação (um a cada `passo` s). */
export const passos = (dura: number, passo = 0.55): Tocar => (s, t, d) => {
  for (let x = 0.1; x < dura; x += passo * (0.95 + R() * 0.1)) pancada(s, t + x, 120 + R() * 30, 0.1, d)
  return dura
}
/** Bater na porta (dois toques) e a porta abrindo, rangendo. */
export const baterEAbrir: Tocar = (s, t, d) => {
  pancada(s, t, 170, 0.14, d); pancada(s, t + 0.22, 160, 0.14, d)
  estalos(s, { t: t + 0.9, n: 2, i0: 0.05, i1: 0.05, f: 1800, q: 5, gain: 0.12, dest: d }) // a maçaneta
  rangido(s, t + 1.05, 0.06, d)
  return 2
}
/** A cadeira: arrastada e o peso de quem senta (ou levanta). */
export const cadeira: Tocar = (s, t, d) => {
  ruido(s, { t, dur: 0.35, a: 0.05, tipo: 'lowpass', f: 700, gain: 0.08, r: 0.1, dest: d })
  rangido(s, t + 0.4, 0.05, d)
  return 0.9
}
/** A porta fechando atrás dele. */
export const portaFecha: Tocar = (s, t, d) => {
  rangido(s, t, 0.04, d); pancada(s, t + 0.55, 95, 0.25, d)
  estalos(s, { t: t + 0.6, n: 1, i0: 0, i1: 0, f: 1600, q: 5, gain: 0.12, dest: d })
  return 1
}
/** A sirene do alarme: dois tons que se revezam, por `dura` s. k = o volume (menos: a sirene ao longe, abafada). */
export const sirene = (dura: number, k = 1): Tocar => (s, t, d) => {
  const lp = k < 1 ? 900 : 1900
  for (let x = 0; x < dura; x += 0.9) {
    tom(s, { t: t + x, dur: 0.42, a: 0.03, r: 0.05, f: 660, f2: 880, tipo: 'sawtooth', lp, gain: 0.07 * k, dest: d })
    tom(s, { t: t + x + 0.45, dur: 0.42, a: 0.03, r: 0.05, f: 880, f2: 660, tipo: 'sawtooth', lp, gain: 0.07 * k, dest: d })
  }
  return dura + 0.1
}
/** O rádio ligando: o estalo e o chiado por baixo da fala (`dura` s). */
export const radio = (dura: number): Tocar => (s, t, d) => {
  estalos(s, { t, n: 2, i0: 0.03, i1: 0.03, f: 2400, q: 3, gain: 0.2, dest: d })
  ruido(s, { t: t + 0.05, dur: dura, a: 0.05, r: 0.15, f: 2200, q: 0.6, gain: 0.05, dest: d })
  estalos(s, { t: t + dura + 0.05, n: 1, i0: 0, i1: 0, f: 2400, q: 3, gain: 0.15, dest: d })
  return dura + 0.3
}
