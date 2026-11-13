// Os sons do agente (12/nov): os passos, a cambalhota, o golpe, a queda e o kit, no estilo das armas (weapons/sons.ts:
// o Sino e o Ferro que canta). A voz do Matheus é grave e curta (a do laboratório): puxa o ar, geme, nunca grita.
// ouvirAgente, depois de animarAgente, toca cada som no momento da animação (o Testar, o jogo e o Ver modelos):
//   os passos: cada vez que um pé toca o chão (a passada, animacao.ts), mais fortes correndo; na pedra, o salto estala
//     e o lugar devolve; na madeira, o baque oco e às vezes a tábua range;
//   a cambalhota: o pano e o ar, o esforço curto, o corpo rolando no chão;
//   o golpe: o tranco do pano e um gemido curto; a queda: o gemido caindo, os joelhos e o corpo no chão (sem violência);
//   as armas: o tiro, a bomba, a recarga (a bolsa, cada bala, a bomba no fim), o calor da pistola, a troca, a armadilha.
// O kit não tem animação: quem usa chama somDoKit.
import * as THREE from 'three'
import { pancada, rangido, ruido, som, tom, voz, type Som } from '../../audio/sintese'
import { somEm, type Parte, type Tocar } from '../enemies/sons'
import type { EstadoArmadilha } from '../weapons/armadilha'
import { armadilhaPresa, armadilhaVolta, arremesso, balaEntra, bolsa, bomba, comEco, ganho, esfriou, superaquece, tiroEscopeta, tiroPistola, troca } from '../weapons/sons'
import { TIRO } from '../weapons/numeros'
import type { EstadoAnim } from './animacao'
import type { Arma } from './arma'
import type { Agente } from './modelo'
import { QUEDA } from './numeros'

const R = Math.random
export type Chao = 'pedra' | 'madeira'

/** A voz dele: grave, curta, rouca. */
const fala = (s: Som, t: number, d: AudioNode, dur: number, f: number, f2: number, vogal: 'u' | 'a' | 'e' | 'o', gain: number) =>
  voz(s, { t, dur, f, f2, vogal, gain, grit: 2.2, fry: 0.4, fryHz: 40, ar: 0.35, a: 0.012, r: 0.08, sc: 0.9, dest: d })

// ---------- o corpo ----------
/** Um passo (k = 0 andando, 1 correndo). */
function passo(s: Som, t: number, d: AudioNode, chao: Chao, k: number) {
  if (chao === 'pedra') { // o salto estala e o lugar devolve
    pancada(s, t, 120, 0.14 + 0.12 * k, d)
    ruido(s, { t, dur: 0.022, a: 0.001, r: 0.035, f: 2500 + R() * 700, q: 1.3, gain: 0.09 + 0.06 * k, dest: comEco(s, d, 0.45) })
    ruido(s, { t: t + 0.03, dur: 0.035, a: 0.004, r: 0.05, f: 1400, q: 0.8, gain: 0.025, dest: d })
  } else { // a madeira: o baque oco e, às vezes, a tábua
    pancada(s, t, 95, 0.18 + 0.16 * k, d)
    ruido(s, { t, dur: 0.05, tipo: 'lowpass', f: 1100, gain: 0.06 + 0.04 * k, dest: d })
    if (R() < 0.15) rangido(s, t + 0.02, 0.03, d)
  }
}
const andar: Tocar = (s, t, d) => { for (let i = 0; i < 4; i++) passo(s, t + i * 0.5, d, 'pedra', 0); return 2 }
const correr: Tocar = (s, t, d) => { for (let i = 0; i < 6; i++) passo(s, t + i * 0.3, d, 'pedra', 1); return 1.8 }
const andarMadeira: Tocar = (s, t, d) => { for (let i = 0; i < 4; i++) passo(s, t + i * 0.5, d, 'madeira', 0); return 2 }
/** A cambalhota: o pano e o ar, o esforço, o corpo rolando no chão. */
export const cambalhota: Tocar = (s, t, d) => {
  ruido(s, { t, dur: 0.28, a: 0.03, r: 0.08, f: 500, f2: 1500, q: 0.9, gain: 0.14, dest: d })
  fala(s, t, d, 0.12, 150, 120, 'u', 0.08)
  pancada(s, t + 0.22, 75, 0.35, d)
  ruido(s, { t: t + 0.22, dur: 0.16, tipo: 'lowpass', f: 900, f2: 300, gain: 0.1, r: 0.1, dest: d })
  return 0.6
}
/** Um golpe: o tranco do pano e o gemido curto. */
export const golpe: Tocar = (s, t, d) => {
  ruido(s, { t, dur: 0.3, a: 0.01, r: 0.12, f: 600, f2: 200, q: 0.8, gain: 0.2, dest: d })
  pancada(s, t, 65, 0.3, d)
  fala(s, t + 0.03, d, 0.16, 165, 120, 'e', 0.12)
  return 0.45
}
/** A queda: perde as forças (o gemido caindo), os joelhos no chão, tomba (o corpo). */
export const queda: Tocar = (s, t, d) => {
  fala(s, t + 0.05, d, 0.6, 150, 95, 'a', 0.1)
  pancada(s, t + QUEDA.joelhos[0] + 0.15, 70, 0.4, d) // os joelhos
  ruido(s, { t: t + QUEDA.joelhos[0] + 0.15, dur: 0.12, tipo: 'lowpass', f: 700, gain: 0.08, dest: d })
  pancada(s, t + QUEDA.tomba[1] - 0.15, 55, 0.6, d) // o corpo
  ruido(s, { t: t + QUEDA.tomba[1] - 0.15, dur: 0.25, a: 0.01, r: 0.15, tipo: 'lowpass', f: 800, f2: 250, gain: 0.14, dest: d })
  return QUEDA.tomba[1] + 0.4
}
/** O kit: o fecho abre, o spray e um sininho subindo (o Sino), e ele respira aliviado. */
export const kit: Tocar = (s, t, d) => {
  d = ganho(s, d, 2)
  ruido(s, { t, dur: 0.1, a: 0.01, r: 0.06, f: 1400, q: 0.9, gain: 0.08, dest: d })
  ruido(s, { t: t + 0.1, dur: 0.35, a: 0.005, r: 0.15, tipo: 'highpass', f: 4200, gain: 0.1, dest: d }) // o spray
  const w = comEco(s, d, 0.5);
  [523, 659, 784].forEach((f, i) => tom(s, { t: t + 0.15 + i * 0.08, f, dur: 0.01, a: 0.003, r: 0.5, gain: 0.05, lp: 2600, dest: w }))
  fala(s, t + 0.4, d, 0.4, 120, 95, 'a', 0.06)
  return 1
}
/** Usou um kit: o som (o kit não tem animação). */
export function somDoKit() { const s = som(); if (s) kit(s, s.ctx.currentTime + 0.01, s.saida) }

// ---------- quando cada um toca ----------
interface Visto { fase: number; esquiva: number; queda: number; dano: number; tiroT: number; arma: Arma | null; recarga: number; entraram: number; travada: number; lanca: number; armadilha: EstadoArmadilha }
const vistos = new WeakMap<Agente, Visto>()

/** Depois de animarAgente: toca o que aconteceu neste quadro (e = o mesmo estado da animação; armadilha = o estado
 *  dela, onde = onde ela está; chao = o chão embaixo dele). */
export function ouvirAgente(a: Agente, e: EstadoAnim, chao: Chao, armadilha?: EstadoArmadilha, onde?: THREE.Vector3) {
  const m = a.anim, A = m.arma, M = e.municao, q = e.queda ?? -1
  const agora: Visto = { fase: m.fase, esquiva: e.esquiva, queda: q, dano: m.dano.t, tiroT: A.tiroT, arma: a.arma, recarga: M?.recarga ?? -1, entraram: M?.entraram ?? 0, travada: M?.travada ?? 0, lanca: A.lanca, armadilha: armadilha ?? 'mao' }
  const v = vistos.get(a)
  vistos.set(a, agora)
  const s = som()
  if (!v || !s) return
  const t = s.ctx.currentTime + 0.01, d = s.saida
  // os passos: um pé tocou o chão (a passada cruzou meia volta)
  if (q < 0 && e.esquiva < 0 && e.velocidade > 0.3 && Math.floor(v.fase / Math.PI) !== Math.floor(m.fase / Math.PI)) passo(s, t, d, chao, m.corrida)
  if (v.esquiva < 0 && e.esquiva >= 0) cambalhota(s, t, d)
  if (v.queda < 0 && q >= 0) queda(s, t, d)
  else if (m.dano.t < v.dano && q < 0) golpe(s, t, d)
  // as armas
  if (a.arma !== v.arma) troca(s, t, d)
  else if (A.tiroT < v.tiroT) {
    if (a.arma === 'pistola') tiroPistola(s, t, d)
    else if (a.arma === 'escopeta') { tiroEscopeta(s, t, d); bomba(s, t + TIRO.escopeta.bomba.apos, d) }
  }
  if (M) {
    if (v.recarga < 0 && M.recarga >= 0) bolsa(s, t, d)
    if (M.entraram > v.entraram && M.recarga >= 0) balaEntra(s, t, d)
    if (v.recarga >= 0 && M.recarga < 0 && M.entraram > 0 && M.entraram >= M.faltavam) bomba(s, t, d) // a recarga acabou: a bomba
    if (v.travada <= 0 && M.travada > 0) superaquece(s, t, d)
    else if (v.travada > 0 && M.travada <= 0) esfriou(s, t, d)
  }
  if (v.lanca < 0 && A.lanca >= 0) arremesso(s, t, d)
  if (armadilha && v.armadilha !== armadilha) {
    if (armadilha === 'presa' && onde) somEm(onde, armadilhaPresa, 3) // no lugar dela
    else if (armadilha === 'mao' && v.armadilha === 'voltando') armadilhaVolta(s, t, d)
  }
}

/** As partes, para as provas medirem (provas.sonsArmas). */
export const PARTES_AGENTE: Parte[] = [['Andando (pedra)', andar], ['Correndo (pedra)', correr], ['Andando (madeira)', andarMadeira], ['Cambalhota', cambalhota], ['Golpe', golpe], ['Queda', queda], ['Kit', kit]]
