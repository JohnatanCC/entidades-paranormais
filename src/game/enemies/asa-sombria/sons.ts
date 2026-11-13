// Os sons da Asa sombria: o Morcego (escolhido em 12/nov, docs/demonios.md). Asas de couro, guinchos e cliques agudos
// (rápido, nervoso, fácil de achar no espaço). A voz sai do corpo dela (../sons.ts) e cada som toca no momento da
// animação (ouvirAsaSombria, depois de animarAsaSombria):
//   voando: cada batida de asa (planando, nada) e, de vez em quando, os cliques de morcego;
//   cuspir: no aviso os cliques aceleram e ela guincha; quando a bola sai, o chiado e o estalo molhado, e a bola indo
//     embora; a bola batendo (no chão, ou longe demais) espirra onde bateu (bolaBatendo, num ponto: somEm);
//   desviar: o ar e um guincho curto; o dano: um guincho agudo; estourar: as asas falham, o guincho cai e ela espirra.
import * as THREE from 'three'
import { estalos, ruido, tom, voz, type Som } from '../../../audio/sintese'
import { passou, respingo, sorteio, vozDe, type Parte, type Tocar } from '../sons'
import type { AsaSombria } from './modelo'
import { CUSPIR, VOO } from './numeros'

/** Uma batida das asas de couro (k = a força: planando, mais fraca). */
function asa(s: Som, t: number, d: AudioNode, k = 1) {
  ruido(s, { t, dur: 0.06, tipo: 'lowpass', f: 520, gain: 0.24 * k, r: 0.06, dest: d })
  ruido(s, { t: t + 0.01, dur: 0.04, f: 1500, q: 1, gain: 0.08 * k, dest: d })
}
const cliques: Tocar = (s, t, d) => { estalos(s, { t, n: 6, i0: 0.028, i1: 0.035, f: 4200, q: 8, gain: 0.1, dest: d }); return 0.2 }
const voando: Tocar = (s, t, d) => {
  for (let i = 0; i < 5; i++) asa(s, t + i * VOO.periodo, d)
  for (let i = 0; i < 3; i++) cliques(s, t + 0.2 + Math.random() * 1.6, d)
  return 2.1
}
const preparo: Tocar = (s, t, d) => {
  estalos(s, { t, n: 14, i0: 0.06, i1: 0.02, f: 3800, q: 8, gain: 0.15, dest: d }) // os cliques aceleram
  voz(s, { t: t + CUSPIR.aviso - 0.3, dur: 0.24, f: 900, f2: 1400, f3: 1100, glide: 0.15, vogal: 'i', sc: 1.8, grit: 2.5, gain: 0.14, dest: d })
  return CUSPIR.aviso
}
const cuspe: Tocar = (s, t, d) => {
  ruido(s, { t, dur: 0.07, tipo: 'highpass', f: 2200, gain: 0.13, dest: d }) // o chiado do cuspe
  tom(s, { t, f: 520, f2: 150, dur: 0.05, gain: 0.11, dest: d }) // o estalo molhado
  ruido(s, { t: t + 0.03, dur: 0.35, a: 0.03, f: 600, f2: 2000, q: 1.5, gain: 0.05, dest: d }) // a bola indo embora
  return 0.4
}
const desvio: Tocar = (s, t, d) => {
  ruido(s, { t, dur: 0.2, a: 0.03, f: 500, f2: 1600, q: 0.9, gain: 0.16, dest: d })
  voz(s, { t: t + 0.03, dur: 0.1, f: 1500, f2: 1800, vogal: 'i', sc: 2, grit: 2, gain: 0.13, dest: d })
  return 0.3
}
const dano: Tocar = (s, t, d) => {
  voz(s, { t, dur: 0.15, f: 1300, f2: 1750, f3: 900, glide: 0.05, vogal: 'i', sc: 2, grit: 2, gain: 0.16, dest: d })
  asa(s, t + 0.02, d)
  return 0.35
}
const estouro: Tocar = (s, t, d) => {
  asa(s, t, d); asa(s, t + 0.12, d) // as asas falham
  voz(s, { t, dur: 0.45, f: 1500, f2: 420, glide: 0.4, vogal: 'i', vogal2: 'e', sc: 1.8, grit: 2.5, gain: 0.08, dest: d })
  respingo(s, t + 0.35, d, 1)
  return 1
}
/** A bola de matéria batendo: um respingo pequeno, onde bateu (somEm). */
export const bolaBatendo: Tocar = (s, t, d) => { respingo(s, t, d, 0.6); return 0.5 }

/** As partes, para as provas medirem. */
export const PARTES_ASA_SOMBRIA: Parte[] = [['voando', voando], ['preparo', preparo], ['cuspe', cuspe], ['desvio', desvio], ['dano', dano], ['estouro', estouro], ['bola batendo', bolaBatendo]]

interface Antes { fase: number; golpe: object | null; saiu: boolean; dano: object | null; estourado: boolean; cliques: number }
const antes = new WeakMap<AsaSombria, Antes>()
const _p = new THREE.Vector3()

/** Depois de animarAsaSombria: a voz anda com ela e cada som toca quando a animação chega nele. */
export function ouvirAsaSombria(a: AsaSombria, dt: number) {
  const A = a.anim, G = A.golpe
  let b = antes.get(a)
  if (!b) { b = { fase: A.fase, golpe: G, saiu: !!G?.saiu, dano: A.dano, estourado: A.estourado, cliques: sorteio(1, 3) }; antes.set(a, b) }
  const v = vozDe(a, a.corpo.getWorldPosition(_p))
  if (v && !A.estourado) {
    const { s, d, t } = v
    if (A.bate > 0.15 && passou(b.fase, A.fase, 0)) asa(s, t, d, A.bate) // a asa começa a descer: a batida
    if (G && G !== b.golpe) (G.nome === 'cuspir' ? preparo : desvio)(s, t, d)
    if (G?.saiu && !b.saiu) cuspe(s, t, d)
    if (A.dano && A.dano !== b.dano) dano(s, t, d)
    if (!G && (b.cliques -= dt) <= 0) { cliques(s, t, d); b.cliques = sorteio(1.5, 3.5) }
  }
  if (v && A.estourado && !b.estourado) estouro(v.s, v.t, v.d)
  Object.assign(b, { fase: A.fase, golpe: G, saiu: !!G?.saiu, dano: A.dano, estourado: A.estourado })
}
