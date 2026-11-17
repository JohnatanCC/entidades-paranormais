// Os sons do Mestre (docs/cap2-sombra.md): seco, grave e de pano. A voz sai do peito dele (../sons.ts) e cada som toca
// no momento da animação (ouvirMestre, depois de animarMestre):
//   levitando: a respiração funda e seca; o estalo de osso quando a cabeça vira de uma vez; o manto farfalhando com o
//     vento e mais forte quando ele avança;
//   o grito: no aviso ele puxa o ar (um chiado que sobe, com um ronco por baixo); o grito sônico (um grasnado enorme e
//     rachado, metálico, com um grave que pulsa: nada da voz da Mãe) e o manto abrindo num golpe de pano e penas;
//   o corvo gigante (ouvirCorvo): sai num sopro e um grasnado grave, bate as asas pesadas enquanto voa; explodindo
//     (corvoExplodindo, num ponto: somEm), um baque, o pano rasgando e as três Gralhas grasnando juntas.
// A assinatura do capítulo 2 é o grasnado, a estática de rádio e o pano batendo (docs/musicas.md).
import * as THREE from 'three'
import { estalos, pancada, racha, ruido, tom, voz, type Som } from '../../../audio/sintese'
import { asaDePena, grasnado } from '../gralha/sons'
import { passou, sorteio, vozDe, type Parte, type Tocar } from '../sons'
import type { Corvo } from './corvo'
import type { Mestre } from './modelo'
import { GRITO, PARADO } from './numeros'

const R = Math.random
/** O manto farfalhando: pano pesado e penas roçando (k = a força). */
function farfalhar(s: Som, t: number, d: AudioNode, k = 1) {
  ruido(s, { t, dur: 0.12, a: 0.04, tipo: 'lowpass', f: 900, f2: 380, gain: 0.16 * k, r: 0.14, dest: d })
  ruido(s, { t: t + 0.03, dur: 0.07, a: 0.02, f: 3000 + R() * 1200, q: 0.7, gain: 0.06 * k, r: 0.08, dest: d })
}
const respira: Tocar = (s, t, d) => {
  ruido(s, { t, dur: 1.1, a: 0.5, f: 420, f2: 700, q: 1.2, gain: 0.12, r: 0.4, dest: d }) // puxa
  ruido(s, { t: t + 1.9, dur: 1.2, a: 0.3, f: 520, f2: 260, q: 1, gain: 0.15, r: 0.7, dest: d }) // solta, mais grave
  voz(s, { t: t + 1.95, dur: 0.9, a: 0.3, r: 0.5, f: 62, f2: 54, vogal: 'o', sc: 0.75, grit: 2.5, fry: 0.7, fryHz: 22, gain: 0.08, dest: d }) // o ronco seco
  return 3.6
}
const osso: Tocar = (s, t, d) => { racha(s, t, 0.25, d); estalos(s, { t: t + 0.02, n: 3, i0: 0.02, i1: 0.05, f: 1700, q: 5, gain: 0.16, dest: d }); return 0.25 }
const manto: Tocar = (s, t, d) => { for (let i = 0; i < 4; i++) farfalhar(s, t + i * 0.3, d, 0.6 + R() * 0.6); return 1.4 }
const aviso: Tocar = (s, t, d) => {
  const D = GRITO.aviso
  ruido(s, { t, dur: D, a: D * 0.8, f: 280, f2: 2100, q: 1.4, gain: 0.22, r: 0.04, dest: d }) // puxa o ar
  voz(s, { t, dur: D, a: 0.1, r: 0.05, f: 58, f2: 82, glide: D, vogal: 'o', sc: 0.7, grit: 3, fry: 0.8, fryHz: 26, gain: 0.16, dest: d })
  estalos(s, { t: t + 0.05, n: 7, i0: 0.12, i1: 0.04, f: 1500, q: 5, gain: 0.12, dest: d }) // os ossos travando
  return D
}
const grito: Tocar = (s, t, d) => {
  const D = GRITO.grita
  // o grasnado enorme: três vozes rachadas (uma uma oitava abaixo), metálicas, caindo no fim
  voz(s, { t, dur: D, a: 0.02, r: 0.25, f: 520, f2: 760, f3: 560, glide: 0.09, vogal: 'a', vogal2: 'e', sc: 1.25, grit: 4, fry: 0.6, fryHz: 47, ring: [91, 0.35], ar: 0.6, wob: 0.14, camadas: [[1, 0, 1], [1.51, 14, 0.55], [0.5, -9, 0.8]], gain: 0.25, dest: d })
  // o sônico: um grave que pulsa (o que treme a tela) e o chiado de rádio rasgando por cima
  tom(s, { t, f: 58, f2: 44, dur: D, a: 0.03, r: 0.3, tipo: 'sawtooth', lp: 220, gain: 0.24, dest: d })
  for (let i = 0; i < 9; i++) tom(s, { t: t + i * (D / 9), f: 96, f2: 60, dur: 0.07, r: 0.06, gain: 0.13, lp: 300, dest: d })
  ruido(s, { t, dur: D, a: 0.02, tipo: 'highpass', f: 3400, gain: 0.07, r: 0.2, dest: d })
  return D + 0.3
}
const abre: Tocar = (s, t, d) => {
  ruido(s, { t, dur: 0.14, a: 0.01, tipo: 'lowpass', f: 1500, f2: 240, gain: 0.34, r: 0.3, dest: d }) // o golpe de pano
  pancada(s, t, 70, 0.2, d)
  for (let i = 0; i < 6; i++) farfalhar(s, t + 0.05 + R() * 0.5, d, 1.1) // as penas
  return 0.8
}
const corvoSai: Tocar = (s, t, d) => {
  ruido(s, { t, dur: 0.3, a: 0.04, f: 300, f2: 1900, q: 0.9, gain: 0.26, r: 0.25, dest: d }) // o sopro saindo do manto
  grasnado(s, t + 0.04, d, 1.5, 1, 2.3)
  return 0.7
}
const corvoVoa: Tocar = (s, t, d) => { for (let i = 0; i < 4; i++) asaDePena(s, t + i * 0.3, d, 1.5, 2.2); ruido(s, { t, dur: 1.2, a: 0.2, f: 500, q: 0.6, gain: 0.06, r: 0.2, dest: d }); return 1.4 }
/** O corvo gigante explodindo e soltando as Gralhas, onde explodiu (somEm). */
export const corvoExplodindo: Tocar = (s, t, d) => {
  pancada(s, t, 55, 0.4, d)
  ruido(s, { t, dur: 0.1, a: 0.005, tipo: 'lowpass', f: 2600, f2: 300, gain: 0.4, r: 0.4, dest: d }) // o pano rasgando
  ruido(s, { t: t + 0.03, dur: 0.3, a: 0.02, f: 2800, q: 0.6, gain: 0.09, r: 0.3, dest: d })
  for (let i = 0; i < 3; i++) { grasnado(s, t + 0.08 + i * 0.13 + R() * 0.05, d, 1.1, 1.15 + i * 0.1); asaDePena(s, t + 0.1 + i * 0.11, d, 1.2) } // as três saindo
  return 1
}

/** As partes, para as provas medirem. */
export const PARTES_MESTRE: Parte[] = [['respiração', respira], ['osso (a cabeça vira)', osso], ['manto', manto], ['aviso', aviso], ['grito', grito], ['manto abrindo', abre], ['corvo saindo', corvoSai], ['corvo voando', corvoVoa], ['corvo explodindo', corvoExplodindo]]

interface Antes { ar: number; para: THREE.Vector3; grito: object | null; t: number; manto: number }
const antes = new WeakMap<Mestre, Antes>()
const _p = new THREE.Vector3()

/** Depois de animarMestre: a voz anda com ele e cada som toca quando a animação chega nele. */
export function ouvirMestre(m: Mestre, dt: number) {
  const A = m.anim, G = A.grito, T = A.tique
  let b = antes.get(m)
  if (!b) { b = { ar: 0, para: T.para.clone(), grito: G, t: 0, manto: 0.5 }; antes.set(m, b) }
  const v = vozDe(m, m.peito.getWorldPosition(_p), 3)
  const ar = ((A.t / PARADO.respira.periodo) % 1 + 1) % 1
  if (v) {
    const { s, d, t } = v
    if (!G) {
      if (passou(b.ar, ar, 0)) respira(s, t, d)
      if (!T.para.equals(b.para)) osso(s, t, d) // a cabeça virou de uma vez
    }
    // o manto: mais forte com o vento e quando ele avança
    const forca = Math.min(1.6, A.vento.length() / 3)
    if ((b.manto -= dt * (0.6 + forca)) <= 0) { farfalhar(s, t, d, 0.35 + forca); b.manto = sorteio(0.3, 0.7) }
    if (G && G !== b.grito) aviso(s, t, d)
    if (G && passou(b.t, G.t, GRITO.aviso) && G.t >= GRITO.aviso) { grito(s, t, d); abre(s, t, d) }
  }
  b.ar = ar; b.para.copy(T.para); b.grito = G; b.t = G ? G.t : 0
}

const corvos = new WeakMap<Corvo, { ativo: boolean; fase: number }>()
/** Depois de passoCorvo: o corvo gigante saindo e voando (a explosão é num ponto: corvoExplodindo, com somEm). */
export function ouvirCorvo(C: Corvo) {
  let b = corvos.get(C)
  if (!b) { b = { ativo: false, fase: 0 }; corvos.set(C, b) }
  const A = C.g.anim
  if (C.ativo) {
    const v = vozDe(C, C.g.root.getWorldPosition(_p), 4)
    if (v) {
      if (!b.ativo) corvoSai(v.s, v.t, v.d)
      if (passou(b.fase, A.fase, 0)) asaDePena(v.s, v.t, v.d, 1.5, 2.2)
    }
  }
  b.ativo = C.ativo; b.fase = A.fase
}
