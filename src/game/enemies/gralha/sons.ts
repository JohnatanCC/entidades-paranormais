// Os sons da Gralha (docs/cap2-sombra.md): asas de pena (mais macias que as de couro da Asa sombria), o grasnado rouco
// e o clique do bico. A voz sai do corpo dela (../sons.ts) e cada som toca no momento da animação (ouvirGralha, depois
// de animarGralha):
//   voando: cada batida de asa (planando, nada); de vez em quando um grasnado ou os cliques do bico;
//   caçando (perseguindo o agente): grasna mais vezes, mais agudo e mais nervoso;
//   atacando: um grasnado agudo no aviso, o ar do mergulho e o estalo do bico fechando;
//   o tiro: um guincho curto e as penas arrancadas; estourando, um sopro abafado e o grasnado cortado.
// A assinatura do capítulo 2 é o grasnado, a estática de rádio e o pano batendo (docs/musicas.md).
import * as THREE from 'three'
import { estalos, ruido, tom, voz, type Som } from '../../../audio/sintese'
import { passou, sorteio, vozDe, type Parte, type Tocar } from '../sons'
import type { Gralha } from './modelo'
import { ATAQUE, VOO } from './numeros'

/** Uma batida das asas de pena (k = a força; grave = o tamanho: o corvo gigante bate mais grave). */
export function asaDePena(s: Som, t: number, d: AudioNode, k = 1, grave = 1) {
  ruido(s, { t, dur: 0.09 * grave, a: 0.02, tipo: 'lowpass', f: 700 / grave, f2: 260 / grave, gain: 0.2 * k, r: 0.09 * grave, dest: d })
  ruido(s, { t: t + 0.02, dur: 0.05, f: 2400 / grave, q: 0.8, gain: 0.05 * k, r: 0.05, dest: d }) // as penas roçando
}
/** O grasnado: uma voz rouca e áspera que cai, com o ar junto (aguda = caçando; grave = o tamanho). */
export function grasnado(s: Som, t: number, d: AudioNode, k = 1, aguda = 1, grave = 1) {
  const f = (470 * aguda) / grave
  voz(s, { t, dur: 0.2 * grave, a: 0.015, r: 0.1, f: f * 1.15, f2: f, f3: f * 0.8, glide: 0.06, vogal: 'a', vogal2: 'e', sc: 1.5 / Math.sqrt(grave), grit: 3.2, fry: 0.55, fryHz: 62 / grave, ar: 0.5, wob: 0.12, gain: 0.15 * k, dest: d })
}
const cliques: Tocar = (s, t, d) => { estalos(s, { t, n: 4, i0: 0.05, i1: 0.09, f: 2600, q: 6, gain: 0.32, dest: d }); return 0.3 }
const voando: Tocar = (s, t, d) => { for (let i = 0; i < 4; i++) asaDePena(s, t + i * VOO.periodo, d); return 1.9 }
const grasna: Tocar = (s, t, d) => { grasnado(s, t, d); grasnado(s, t + 0.34, d, 0.85); return 0.7 }
const grasnaCacando: Tocar = (s, t, d) => { for (let i = 0; i < 3; i++) grasnado(s, t + i * 0.24, d, 1, 1.25); return 0.8 }

const avisoDoAtaque: Tocar = (s, t, d) => { grasnado(s, t, d, 1.2, 1.4); return 0.3 }
const mergulho: Tocar = (s, t, d) => { ruido(s, { t, dur: ATAQUE.mergulha, a: ATAQUE.mergulha * 0.7, f: 500, f2: 2600, q: 1, gain: 0.16, r: 0.05, dest: d }); return ATAQUE.mergulha }
const bicada: Tocar = (s, t, d) => {
  tom(s, { t, f: 900, f2: 300, dur: 0.03, r: 0.04, gain: 0.2, dest: d }) // o bico fechando: um estalo seco
  estalos(s, { t, n: 2, i0: 0.012, i1: 0.02, f: 2200, q: 4, gain: 0.3, dest: d })
  return 0.15
}

const dano: Tocar = (s, t, d) => {
  voz(s, { t, dur: 0.12, a: 0.01, r: 0.08, f: 820, f2: 1050, f3: 620, glide: 0.04, vogal: 'e', sc: 1.6, grit: 3, fry: 0.4, fryHz: 70, ar: 0.5, gain: 0.17, dest: d })
  ruido(s, { t, dur: 0.05, a: 0.005, f: 1800, q: 0.8, gain: 0.14, r: 0.08, dest: d }) // as penas arrancadas
  return 0.3
}
const estouro: Tocar = (s, t, d) => {
  ruido(s, { t, dur: 0.1, a: 0.01, tipo: 'lowpass', f: 1400, f2: 220, gain: 0.34, r: 0.45, dest: d }) // o sopro de fumaça
  tom(s, { t, f: 150, f2: 60, dur: 0.08, r: 0.15, gain: 0.2, lp: 300, dest: d })
  voz(s, { t, dur: 0.09, a: 0.005, r: 0.05, f: 700, f2: 380, glide: 0.08, vogal: 'a', sc: 1.5, grit: 3.2, fry: 0.6, fryHz: 60, gain: 0.13, dest: d }) // o grasnado cortado
  for (let i = 0; i < 3; i++) asaDePena(s, t + 0.05 + i * 0.07, d, 0.6)
  return 0.7
}

/** As partes, para as provas medirem. */
export const PARTES_GRALHA: Parte[] = [['voando', voando], ['grasnado', grasna], ['grasnado caçando', grasnaCacando], ['cliques', cliques], ['aviso do ataque', avisoDoAtaque], ['mergulho', mergulho], ['bicada', bicada], ['tiro', dano], ['estouro em fumaça', estouro]]

interface Antes { fase: number; voz: number; ataque: object | null; t: number; bicou: boolean; dano: object | null; estourada: boolean }
const antes = new WeakMap<Gralha, Antes>()
const _p = new THREE.Vector3()

/** Depois de animarGralha: a voz anda com ela e cada som toca quando a animação chega nele. cacando = perseguindo. */
export function ouvirGralha(g: Gralha, dt: number, cacando = false) {
  const A = g.anim
  let b = antes.get(g)
  const T = A.ataque
  if (!b) { b = { fase: A.fase, voz: sorteio(0.3, 2.5), ataque: T, t: 0, bicou: false, dano: A.dano, estourada: A.estourada }; antes.set(g, b) }
  const v = vozDe(g, g.corpo.getWorldPosition(_p))
  if (v && A.estourada && !b.estourada) estouro(v.s, v.t, v.d)
  if (v && !A.estourada) {
    const { s, d, t } = v
    if (A.dano && A.dano !== b.dano) dano(s, t, d)
    if (A.bate > 0.15 && passou(b.fase, A.fase, 0)) asaDePena(s, t, d, A.bate) // a asa começa a descer: a batida
    if (T && T !== b.ataque) { avisoDoAtaque(s, t, d); b.voz = Math.max(b.voz, 1.5) }
    if (T && b.t < ATAQUE.sobe && T.t >= ATAQUE.sobe) mergulho(s, t, d)
    if (T?.bicou && !b.bicou) bicada(s, t, d)
    if (!T && (b.voz -= dt) <= 0) {
      if (cacando) { grasnaCacando(s, t, d); b.voz = sorteio(1.2, 3) }
      else { (Math.random() < (A.pousada ? 0.3 : 0.6) ? grasna : cliques)(s, t, d); b.voz = sorteio(2.5, 6) }
    }
  }
  b.fase = A.fase; b.ataque = T; b.t = T ? T.t : 0; b.bicou = !!T?.bicou; b.dano = A.dano; b.estourada = A.estourada
}
