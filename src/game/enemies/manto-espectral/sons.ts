// Os sons do Manto espectral (o jogo novo, docs/demonios.md): da família dos fantasmas espectrais (os gemidos com ar e o
// brilho de vidro do Devora espectros), mas maior e de pano: o manto farfalhando, as garras estalando no chão. A voz sai
// do corpo dele (../sons.ts) e cada som toca no momento da animação (ouvirMantoEspectral, depois de animarMantoEspectral):
//   parado: um gemido baixo de tempos em tempos e o pano; andando: as garras dos pés a cada passo;
//   agarrar: no aviso, o chiado que sobe e o pano abrindo; o agarrão: o golpe de pano e o estalo; segurando: o aperto
//     (o rangido) e um gemido;
//   cada soco: o assobio do braço esticando e o impacto;
//   o giro: no aviso, o pano subindo; girando, o vento rodando (uma lufada por volta);
//   atordoado: o gemido tonto, caindo; o tiro: o guincho e o vidro rachando.
import * as THREE from 'three'
import { estalos, pancada, rangido, ruido, tom, voz, type Som } from '../../../audio/sintese'
import type { SaidaManto } from './animacao'
import type { MantoEspectral } from './modelo'
import { AGARRAR, GIRO, SOCOS } from './numeros'
import { sorteio, vozDe, type Parte, type Tocar } from '../sons'

const R = Math.random
const REF = 3.5 // m: até onde a voz dele soa cheia
const VOLUME = 3

/** O brilho de vidro (a matéria espectral), bem baixo. */
function vidro(s: Som, t: number, d: AudioNode, dur: number, k = 1) {
  for (const f of [1200, 1640, 2150]) tom(s, { t: t + R() * 0.1, f: f * (0.98 + R() * 0.04), f2: f * 0.95, dur, a: dur * 0.3, r: dur * 0.4, gain: 0.01 * k, dest: d })
}
/** O pano farfalhando (k = a força; dur s). */
function pano(s: Som, t: number, d: AudioNode, dur = 0.4, k = 1) {
  ruido(s, { t, dur, a: dur * 0.3, r: dur * 0.4, f: 900, f2: 2200, q: 0.7, gain: 0.12 * k, dest: d })
}
/** O gemido do fantasma: a nota desce devagar, com tremor e ar. */
function gemer(s: Som, t: number, d: AudioNode, dur: number, k = 1, f = 120) {
  voz(s, { t, dur, a: dur * 0.35, r: dur * 0.3, f, f2: f * 1.15, f3: f * 0.75, glide: dur * 0.4, vogal: 'o', vogal2: 'u', sc: 0.8, grit: 1.6, vib: [5, 25], wob: 0.1, ar: 1, camadas: [[1, 0, 1], [0.5, -8, 0.4]], gain: 0.06 * k, dest: d })
  vidro(s, t, d, dur, k)
}

const parado: Tocar = (s, t, d) => { gemer(s, t, d, 1.8 + R() * 0.6, 0.8, 105 + R() * 25); pano(s, t + 0.4, d, 0.6, 0.5); return 2.4 }
const passo: Tocar = (s, t, d) => { estalos(s, { t, n: 3, i0: 0.015, i1: 0.03, f: 2400, q: 4, gain: 0.04, forma: (u) => 1 - u, dest: d }); pano(s, t, d, 0.25, 0.35); return 0.3 }
const avisoAgarrar: Tocar = (s, t, d) => {
  const dur = AGARRAR.aviso
  ruido(s, { t, dur, a: dur * 0.8, r: 0.05, f: 800, f2: 3000, q: 1.5, gain: 0.14, dest: d })
  voz(s, { t: t + dur * 0.3, dur: dur * 0.7, a: dur * 0.4, f: 110, f2: 140, vogal: 'a', sc: 0.8, grit: 3, fry: 0.4, fryHz: 24, ar: 0.6, gain: 0.07, dest: d })
  pano(s, t, d, dur, 0.8)
  return dur
}
const agarrao: Tocar = (s, t, d) => { pano(s, t, d, 0.25, 1.6); pancada(s, t + 0.05, 90, 0.2, d); estalos(s, { t: t + 0.05, n: 6, i0: 0.01, i1: 0.03, f: 1800, q: 3, gain: 0.07, forma: (u) => 1 - u, dest: d }); return 0.4 }
const aperto: Tocar = (s, t, d) => { rangido(s, t, 0.08, d); gemer(s, t + 0.2, d, 1.4, 0.9, 140); return 1.6 }
const soco: Tocar = (s, t, d) => { // no instante do soco: o fim do assobio do braço e o impacto
  ruido(s, { t, dur: 0.1, a: 0.01, r: 0.06, f: 1400, f2: 2600, q: 1, gain: 0.16, dest: d })
  pancada(s, t + 0.03, 120, 0.16, d)
  return SOCOS.cada
}
const avisoGiro: Tocar = (s, t, d) => { pano(s, t, d, GIRO.aviso, 1.2); voz(s, { t, dur: GIRO.aviso, a: GIRO.aviso * 0.8, f: 95, f2: 150, vogal: 'u', vogal2: 'a', sc: 0.8, grit: 2.5, ar: 0.7, gain: 0.07, dest: d }); return GIRO.aviso }
const lufada: Tocar = (s, t, d) => { ruido(s, { t, dur: 0.35, a: 0.12, r: 0.15, f: 400, f2: 1300, q: 0.8, gain: 0.18, dest: d }); pano(s, t, d, 0.3, 0.9); return 0.4 }
const tonto: Tocar = (s, t, d) => { voz(s, { t, dur: 1.6, a: 0.1, r: 0.4, f: 170, f2: 90, glide: 1.4, vogal: 'o', vogal2: 'u', sc: 0.8, grit: 1.8, vib: [3, 60], ar: 0.8, gain: 0.07, dest: d }); vidro(s, t, d, 1.5, 1.2); return 1.9 }
const dano: Tocar = (s, t, d) => {
  voz(s, { t, dur: 0.38, a: 0.01, r: 0.12, f: 380, f2: 230, vogal: 'i', vogal2: 'a', sc: 0.8, grit: 3, vib: [9, 40], ar: 0.6, gain: 0.08, dest: d })
  estalos(s, { t, n: 6, i0: 0.01, i1: 0.03, f: 3200, q: 5, gain: 0.05, forma: (u) => 1 - u, dest: d })
  return 0.5
}

/** As partes, para as provas medirem. */
export const PARTES_MANTO_ESPECTRAL: Parte[] = [
  ['parado', parado], ['passo', passo], ['aviso do agarrar', avisoAgarrar], ['agarrão', agarrao], ['aperto', aperto], ['soco', soco],
  ['aviso do giro', avisoGiro], ['lufada do giro', lufada], ['tonto', tonto], ['dano', dano],
]

interface Antes { modo: string; dano: object | null; repete: number; passo: number; aperto: number }
const antes = new WeakMap<MantoEspectral, Antes>()
const _p = new THREE.Vector3()

/** Depois de animarMantoEspectral (s = o que ela devolveu): a voz anda com ele e cada som toca na hora da animação. */
export function ouvirMantoEspectral(m: MantoEspectral, s: SaidaManto, dt: number) {
  const A = m.anim
  let b = antes.get(m)
  if (!b) { b = { modo: A.modo, dano: A.dano, repete: sorteio(1, 3), passo: Math.floor(A.passo), aperto: 0 }; antes.set(m, b) }
  const v = vozDe(m, m.corpo.getWorldPosition(_p), REF, VOLUME)
  if (v) {
    const { s: S, d: D, t } = v
    if (A.modo !== b.modo) {
      if (A.modo === 'agarrar') avisoAgarrar(S, t, D)
      else if (A.modo === 'girar') avisoGiro(S, t, D)
      else if (A.modo === 'atordoado') tonto(S, t, D)
      b.repete = Math.max(b.repete, 1.5)
    }
    if (s.agarrou) agarrao(S, t, D)
    if (s.segurando && (b.aperto -= dt) <= 0) { aperto(S, t, D); b.aperto = AGARRAR.segura }
    if (!s.segurando) b.aperto = 0
    if (s.soco !== null) soco(S, t, D)
    if (s.volta) lufada(S, t, D)
    if (A.dano && A.dano !== b.dano) dano(S, t, D)
    const p = Math.floor(A.passo)
    if (p !== b.passo && A.andar > 0.5) passo(S, t, D)
    b.passo = p
    if (A.modo === 'pairar' && A.andar < 0.2 && (b.repete -= dt) <= 0) b.repete = parado(S, t, D) + sorteio(3, 6)
  }
  Object.assign(b, { modo: A.modo, dano: A.dano })
}
