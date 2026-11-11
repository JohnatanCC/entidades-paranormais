// O corpo e o Luto da Mãe (portados do laboratório; a voz e o quando de cada som estão em sons.ts):
//   os passos descalços na tábua, pesados (ela tem 2,26 m), com a barra do vestido arrastando e o assoalho cedendo de
//     vez em quando; correndo, o assoalho inteiro sente;
//   os estalos do pescoço (em vários tempos) e dos dedos (no ar); a garra rasgando o ar; os joelhos e as mãos batendo
//     no chão; os pés descalços derrapando;
//   o Luto: o espirro (líquido grosso e bolhas), o mergulho, as bolhas, o chão estufando (o ronco), o corpo saindo dele
//     escorrendo, as lágrimas pingando.
import { estalos, pancada, racha, rangido, ruido, tom, voz, type Som } from '../../../audio/sintese'

const R = Math.random

/** Um passo: o pé descalço bate (pesado), a sola estala na tábua, a barra do vestido arrasta; às vezes a tábua range. */
export function passo(s: Som, t: number, d: AudioNode, correndo: boolean) {
  pancada(s, t, correndo ? 95 : 75, correndo ? 0.26 : 0.1, d)
  if (correndo) tom(s, { t, f: 48, f2: 34, dur: 0.12, r: 0.25, gain: 0.22, lp: 120, dest: d }) // o assoalho inteiro sente
  ruido(s, { t, dur: 0.035, tipo: 'lowpass', f: correndo ? 560 : 400, gain: correndo ? 0.2 : 0.1, r: 0.06, dest: d }) // a sola descalça
  ruido(s, { t: t + 0.008, dur: 0.02, f: 2600, q: 2, gain: correndo ? 0.07 : 0.035, dest: d })
  ruido(s, { t, dur: correndo ? 0.22 : 0.42, a: 0.05, r: 0.18, f: 2100, q: 0.7, gain: correndo ? 0.06 : 0.035, dest: d }) // o vestido arrastando
  if (R() < (correndo ? 0.15 : 0.25)) rangido(s, t + 0.02, correndo ? 0.06 : 0.04, d)
}

/** O pescoço estala em vários tempos (k = a força); com ar, ela solta o ar rouco depois. */
export function estaloPescoco(s: Som, t: number, d: AudioNode, k = 1, ar = true) {
  racha(s, t, 0.42 * k, d); racha(s, t + 0.05, 0.3 * k, d)
  estalos(s, { t: t + 0.08, n: 14, i0: 0.008, i1: 0.02, f: 1500, q: 2.5, gain: 0.12 * k, dest: d })
  if (ar) voz(s, { t: t + 0.12, dur: 0.35, f: 70, f2: 52, vogal: 'a', gain: 0.1, grit: 3, fry: 0.6, fryHz: 32, ar: 0.5, dest: d })
}

/** Os dedos compridos estalando no ar. */
export function dedos(s: Som, t: number, d: AudioNode) {
  estalos(s, { t, n: 8 + ((R() * 6) | 0), i0: 0.05, i1: 0.08, f: 2400, q: 4, gain: 0.09, dest: d })
  estalos(s, { t: t + 0.02, n: 6, i0: 0.07, i1: 0.1, f: 900, q: 3, gain: 0.05, dest: d })
}

/** A garra rasgando o ar (e as juntas estalando no golpe). */
export function rasgo(s: Som, t: number, d: AudioNode) {
  ruido(s, { t, dur: 0.11, a: 0.008, r: 0.08, f: 800, f2: 3400, q: 0.9, gain: 0.24, dest: d })
  racha(s, t + 0.015, 0.1, d)
}

/** Os joelhos (ou as mãos) batendo no chão. */
export function baque(s: Som, t: number, d: AudioNode, k = 1) {
  pancada(s, t, 62, 0.4 * k, d); pancada(s, t + 0.04, 90, 0.18 * k, d)
  ruido(s, { t, dur: 0.12, tipo: 'lowpass', f: 900, f2: 300, gain: 0.1 * k, r: 0.1, dest: d }) // o pano amortecendo
}

/** Os pés descalços derrapando no chão (dur s). */
export function derrapa(s: Som, t: number, d: AudioNode, dur: number) {
  ruido(s, { t, dur, a: 0.02, r: dur * 0.5, f: 1200, f2: 380, q: 0.9, gain: 0.16, dest: d })
  estalos(s, { t, n: 10 + ((R() * 8) | 0), i0: dur / 16, i1: dur / 10, f: 700, q: 2, gain: 0.07, dest: d }) // a sola agarrando
}

// ---------- o Luto ----------
/** Uma bolha de líquido grosso (f = o tamanho: mais grave, maior). */
export function bolha(s: Som, t: number, d: AudioNode, f: number, gain: number) {
  tom(s, { t, f, f2: f * 2.6, dur: 0.06, a: 0.004, r: 0.05, gain, dest: d })
  ruido(s, { t, dur: 0.03, f: f * 3, q: 3, gain: gain * 0.35, r: 0.04, dest: d })
}
/** O Luto espirrando (dur s): o líquido grosso e as bolhas estourando nele. */
export function espirro(s: Som, t: number, d: AudioNode, dur: number, gain: number) {
  ruido(s, { t, dur, a: 0.004, r: dur * 0.7, tipo: 'lowpass', f: 1000, f2: 200, gain, dest: d })
  ruido(s, { t, dur: dur * 0.5, a: 0.002, r: 0.12, f: 1900, f2: 550, q: 1.1, gain: gain * 0.45, dest: d })
  for (let i = 0; i < 7; i++) bolha(s, t + 0.03 + R() * dur * 0.9, d, 140 + R() * 360, gain * 0.45)
}
/** Ela afunda no Luto: o espirro e o peso descendo. */
export function mergulho(s: Som, t: number, d: AudioNode) {
  espirro(s, t, d, 0.5, 0.42)
  tom(s, { t, f: 92, f2: 36, dur: 0.38, r: 0.25, gain: 0.35, lp: 220, dest: d })
}
/** O chão estufando (o aviso): um ronco grave que cresce. */
export function ronco(s: Som, t: number, d: AudioNode, dur: number) {
  tom(s, { t, f: 40, f2: 58, dur, a: dur * 0.25, r: 0.4, gain: 0.26, lp: 140, dest: d })
  ruido(s, { t, dur, a: dur * 0.3, r: 0.3, tipo: 'lowpass', f: 180, gain: 0.12, dest: d })
}
/** O corpo saindo do Luto, escorrendo. */
export function escorre(s: Som, t: number, d: AudioNode) {
  ruido(s, { t, dur: 2.4, a: 0.4, r: 0.8, tipo: 'lowpass', f: 650, f2: 380, gain: 0.13, dest: d })
  for (let i = 0; i < 16; i++) bolha(s, t + R() * 2.6, d, 110 + R() * 300, 0.08)
}
/** Uma lágrima de Luto pingando. */
export const gota = (s: Som, t: number, d: AudioNode) => bolha(s, t, d, 380 + R() * 260, 0.035)
