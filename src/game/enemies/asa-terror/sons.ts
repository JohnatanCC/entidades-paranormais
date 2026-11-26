// Os sons do Asa do terror (o jogo novo, docs/demonios.md): da família dos fantasmas espectrais (o gemido com ar e o
// brilho de vidro), mas de inseto: as mandíbulas estalando e as asas grandes batendo. A voz sai do corpo dele
// (../sons.ts) e cada som toca no momento da animação (ouvirAsaTerror, depois de animarAsaTerror):
//   voando: a lufada de cada batida das asas, os estalos das mandíbulas e um gemido de tempos em tempos;
//   o tiro: na carga, o tom que sobe com o chiado; no disparo, o estalo seco e o tom que cai;
//   o teletransporte: sumindo, o brilho que desce e se desfaz; surgindo, o contrário;
//   o tiro que leva: o guincho e o vidro rachando.
// A bomba soa no lugar dela (ouvirEfeitos, depois de passoEfeitos): o baque ao grudar, o bipe de cada piscada e a explosão.
import * as THREE from 'three'
import { estalos, pancada, ruido, tom, voz, type Som } from '../../../audio/sintese'
import type { SaidaAsaTerror } from './animacao'
import type { EfeitosAsaTerror } from './efeitos'
import type { AsaTerror } from './modelo'
import { TELE, TIRO } from './numeros'
import { somEm, sorteio, vozDe, type Parte, type Tocar } from '../sons'

const R = Math.random
const REF = 4 // m: até onde a voz dele soa cheia
const VOLUME = 3

/** O brilho de vidro (a matéria espectral), bem baixo. */
function vidro(s: Som, t: number, d: AudioNode, dur: number, k = 1) {
  for (const f of [1300, 1750, 2300]) tom(s, { t: t + R() * 0.1, f: f * (0.98 + R() * 0.04), f2: f * 0.95, dur, a: dur * 0.3, r: dur * 0.4, gain: 0.01 * k, dest: d })
}
const asa: Tocar = (s, t, d) => { ruido(s, { t, dur: 0.26, a: 0.07, r: 0.14, f: 260, f2: 620, q: 0.7, gain: 0.3, dest: d }); return 0.3 }
const estalo: Tocar = (s, t, d) => { estalos(s, { t, n: 3, i0: 0.015, i1: 0.025, f: 2700, q: 4, gain: 0.5, forma: (u) => 1 - u * 0.5, dest: d }); pancada(s, t, 900, 0.05, d); return 0.2 }
const parado: Tocar = (s, t, d) => {
  const dur = 1.5 + R() * 0.5, f = 170 + R() * 40
  voz(s, { t, dur, a: dur * 0.35, r: dur * 0.3, f, f2: f * 1.2, f3: f * 0.8, glide: dur * 0.4, vogal: 'i', vogal2: 'u', sc: 0.75, grit: 2, vib: [7, 30], wob: 0.1, ar: 1, gain: 0.05, dest: d })
  vidro(s, t, d, dur)
  return dur
}
const carga: Tocar = (s, t, d) => {
  const dur = TIRO.carga
  tom(s, { t, f: 260, f2: 1500, dur, a: dur * 0.7, r: 0.04, gain: 0.1, tipo: 'sawtooth', lp: 2600, dest: d })
  tom(s, { t, f: 520, f2: 3000, dur, a: dur * 0.8, r: 0.04, gain: 0.02, dest: d })
  ruido(s, { t, dur, a: dur * 0.85, r: 0.05, f: 900, f2: 4200, q: 2, gain: 0.1, dest: d })
  estalos(s, { t: t + dur * 0.3, n: 9, i0: 0.1, i1: 0.03, f: 3200, q: 6, gain: 0.04, forma: (u) => u, dest: d })
  return dur
}
const disparo: Tocar = (s, t, d) => {
  pancada(s, t, 110, 0.22, d)
  tom(s, { t, f: 1500, f2: 220, dur: 0.22, a: 0.005, r: 0.12, gain: 0.07, tipo: 'square', lp: 2400, dest: d })
  ruido(s, { t, dur: 0.16, a: 0.005, r: 0.1, f: 2400, f2: 700, q: 1, gain: 0.16, dest: d })
  return 0.3
}
const sumir: Tocar = (s, t, d) => {
  const dur = TELE.some
  tom(s, { t, f: 1900, f2: 240, dur, a: 0.02, r: dur * 0.5, gain: 0.05, dest: d })
  ruido(s, { t, dur, a: dur * 0.2, r: dur * 0.6, f: 3800, f2: 600, q: 2, gain: 0.1, dest: d })
  estalos(s, { t, n: 10, i0: 0.02, i1: 0.07, f: 3600, q: 7, gain: 0.04, forma: (u) => 1 - u, dest: d })
  return dur
}
const surgir: Tocar = (s, t, d) => {
  const dur = TELE.surge
  tom(s, { t, f: 240, f2: 1700, dur, a: dur * 0.6, r: 0.08, gain: 0.05, dest: d })
  ruido(s, { t, dur, a: dur * 0.7, r: 0.08, f: 600, f2: 3600, q: 2, gain: 0.1, dest: d })
  pancada(s, t + dur * 0.85, 140, 0.12, d)
  return dur + 0.1
}
const dano: Tocar = (s, t, d) => {
  voz(s, { t, dur: 0.34, a: 0.01, r: 0.12, f: 520, f2: 300, vogal: 'i', vogal2: 'e', sc: 0.75, grit: 3.5, vib: [11, 50], ar: 0.6, gain: 0.07, dest: d })
  estalos(s, { t, n: 6, i0: 0.01, i1: 0.03, f: 3400, q: 5, gain: 0.05, forma: (u) => 1 - u, dest: d })
  return 0.45
}
// a bomba
const grudar: Tocar = (s, t, d) => { pancada(s, t, 170, 0.18, d); ruido(s, { t, dur: 0.12, a: 0.005, r: 0.08, f: 1800, f2: 500, q: 1.2, gain: 0.14, dest: d }); return 0.25 }
const bipe: Tocar = (s, t, d) => { tom(s, { t, f: 1850, dur: 0.06, a: 0.004, r: 0.03, gain: 0.22, tipo: 'square', lp: 4200, dest: d }); return 0.08 }
const explosao: Tocar = (s, t, d) => {
  pancada(s, t, 62, 0.5, d); pancada(s, t + 0.03, 120, 0.3, d)
  ruido(s, { t, dur: 0.6, a: 0.005, r: 0.45, f: 2600, f2: 220, q: 0.6, gain: 0.3, dest: d })
  tom(s, { t, f: 900, f2: 90, dur: 0.4, a: 0.005, r: 0.3, gain: 0.08, tipo: 'sawtooth', lp: 1800, dest: d })
  estalos(s, { t: t + 0.05, n: 12, i0: 0.01, i1: 0.06, f: 3000, q: 5, gain: 0.06, forma: (u) => 1 - u, dest: d })
  return 0.8
}

/** As partes, para as provas medirem. */
export const PARTES_ASA_TERROR: Parte[] = [
  ['asa', asa], ['estalo das mandíbulas', estalo], ['parado', parado], ['carga', carga], ['disparo', disparo], ['sumir', sumir], ['surgir', surgir], ['dano', dano],
  ['bomba grudando', grudar], ['bipe da bomba', bipe], ['explosão', explosao],
]

interface Antes { modo: string; dano: object | null; fase: number; mand: number; repete: number }
const antes = new WeakMap<AsaTerror, Antes>()
const _p = new THREE.Vector3()

/** Depois de animarAsaTerror (s = o que ela devolveu): a voz anda com ele e cada som toca na hora da animação. */
export function ouvirAsaTerror(a: AsaTerror, s: SaidaAsaTerror, dt: number) {
  const A = a.anim
  let b = antes.get(a)
  if (!b) { b = { modo: A.modo, dano: A.dano, fase: A.fase, mand: A.mand, repete: sorteio(1, 3) }; antes.set(a, b) }
  const v = vozDe(a, a.root.getWorldPosition(_p), REF, VOLUME)
  if (v) {
    const { s: S, d: D, t } = v
    if (A.modo !== b.modo) {
      if (A.modo === 'tiro' || A.modo === 'rajada') carga(S, t, D)
      else if (A.modo === 'sumir') sumir(S, t, D)
      else if (A.modo === 'surgir') surgir(S, t, D)
      b.repete = Math.max(b.repete, 2)
    }
    if (s.dispara) disparo(S, t, D)
    if (A.dano && A.dano !== b.dano) dano(S, t, D)
    if (A.modo === 'voar') {
      if (A.fase < b.fase) asa(S, t, D) // a batida recomeçou: as asas descem
      if (b.mand > 0.25 && A.mand <= 0.25 && A.fraco < 0.3) estalo(S, t, D) // as mandíbulas fecharam
      if (A.fraco < 0.3 && (b.repete -= dt) <= 0) b.repete = parado(S, t, D) + sorteio(4, 7)
    }
  }
  Object.assign(b, { modo: A.modo, dano: A.dano, fase: A.fase, mand: A.mand })
}

/** Depois de passoEfeitos: a bomba soa onde está. */
export function ouvirEfeitos(E: EfeitosAsaTerror) {
  for (const p of E.grudou) somEm(p, grudar, 3, VOLUME)
  for (const p of E.bipe) somEm(p, bipe, 3, VOLUME)
  for (const p of E.explodiu) somEm(p, explosao, 5, VOLUME)
}
