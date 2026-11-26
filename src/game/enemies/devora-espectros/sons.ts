// Os sons do Devora espectros (o jogo novo, docs/demonios.md): um fantasma, não um demônio. Menor e mais etéreo que o
// Abismo do Devora almas: gemidos com tremor e muito ar, um brilho de vidro por cima (a matéria espectral), o sopro
// gelado. A voz sai do corpo dele (../sons.ts) e cada som toca no momento da animação (ouvirDevoraEspectros, depois de
// animarDevoraEspectros, com o que ela devolveu):
//   flutuando: geme baixo de tempos em tempos (às vezes um sussurro); o brilho de vidro tremendo junto;
//   o bote: no aviso, puxa o ar num chiado que sobe e rosna; na investida, o sopro passando; a boca fecha num estalo;
//   a mordida: o chiado curto e o estalo;
//   o cuspe: a garganta enche (bolhas e o gemido crescendo) e cospe (o sopro e o respingo);
//   o tiro: um guincho que cai, com o vidro rachando.
import * as THREE from 'three'
import { estalos, pancada, ruido, sussurro, tom, voz, type Som } from '../../../audio/sintese'
import type { SaidaEspectros } from './animacao'
import type { DevoraEspectros } from './modelo'
import { BOTE, CUSPE, MORDIDA } from './numeros'
import { bolha, respingo, sorteio, vozDe, type Parte, type Tocar } from '../sons'

const R = Math.random
const REF = 3 // m: até onde a voz dele soa cheia
const VOLUME = 3 // o volume dele (os Sombrios: 2,5; o Devora almas, chefe: 4)

/** O brilho de vidro: tons altos tremendo, bem baixo (a matéria espectral). */
function vidro(s: Som, t: number, d: AudioNode, dur: number, k = 1) {
  for (const f of [1320, 1760, 2210]) tom(s, { t: t + R() * 0.1, f: f * (0.98 + R() * 0.04), f2: f * (0.96 + R() * 0.04), dur, a: dur * 0.3, r: dur * 0.4, gain: 0.012 * k, dest: d })
}
/** O gemido do fantasma: a nota desce devagar, com tremor e ar (dur s; k = a força; f = a altura). */
function gemer(s: Som, t: number, d: AudioNode, dur: number, k = 1, f = 150) {
  voz(s, { t, dur, a: dur * 0.35, r: dur * 0.3, f, f2: f * 1.18, f3: f * 0.78, glide: dur * 0.4, vogal: 'u', vogal2: 'o', sc: 0.75, grit: 1.4, vib: [5.5, 30], wob: 0.12, ar: 1.1, camadas: [[1, 0, 1], [2, 7, 0.25]], gain: 0.06 * k, dest: d })
  vidro(s, t, d, dur, k)
}
/** O estalo da boca fechando: os dentes de gelo. */
function estalo(s: Som, t: number, d: AudioNode, k = 1) {
  pancada(s, t, 180, 0.18 * k, d)
  tom(s, { t, f: 900, f2: 420, dur: 0.05, r: 0.08, gain: 0.08 * k, dest: d })
  estalos(s, { t, n: 5, i0: 0.008, i1: 0.02, f: 2600, q: 4, gain: 0.06 * k, forma: (u) => 1 - u, dest: d })
}
/** O chiado que sobe (puxando o ar, o aviso), com um rosnado por baixo. */
function chiado(s: Som, t: number, d: AudioNode, dur: number, k = 1) {
  ruido(s, { t, dur, a: dur * 0.8, r: 0.06, f: 900, f2: 3200, q: 1.5, gain: 0.16 * k, dest: d })
  voz(s, { t: t + dur * 0.3, dur: dur * 0.7, a: dur * 0.4, f: 120, f2: 150, vogal: 'a', sc: 0.75, grit: 3, fry: 0.4, fryHz: 26, ar: 0.7, gain: 0.07 * k, dest: d })
}

const flutuando: Tocar = (s, t, d) => {
  if (R() < 0.3) { sussurro(s, t, 1.4, 0.02, d); vidro(s, t, d, 1.4, 0.7); return 1.6 }
  gemer(s, t, d, 1.6 + R() * 0.6, 0.8, 135 + R() * 30)
  return 2.4
}
const aviso = (dur: number): Tocar => (s, t, d) => { chiado(s, t, d, dur); return dur + 0.1 }
const investida: Tocar = (s, t, d) => { // o sopro passando, gelado
  ruido(s, { t, dur: BOTE.investe + 0.15, a: 0.05, r: 0.15, f: 600, f2: 1800, q: 0.9, gain: 0.2, dest: d })
  vidro(s, t, d, 0.5, 1.4)
  return 0.6
}
const fecha: Tocar = (s, t, d) => { estalo(s, t, d); return 0.3 }
const garganta: Tocar = (s, t, d) => { // a garganta enche: bolhas e o gemido crescendo
  const dur = CUSPE.infla
  for (let i = 0; i < 7; i++) bolha(s, t + (i / 7) * dur + R() * 0.05, d, 0.05, 220 + i * 25)
  voz(s, { t, dur, a: dur * 0.9, f: 110, f2: 160, vogal: 'o', vogal2: 'a', sc: 0.75, grit: 2, wob: 0.1, ar: 0.6, gain: 0.07, dest: d })
  return dur
}
const cospe: Tocar = (s, t, d) => {
  ruido(s, { t, dur: 0.22, a: 0.01, r: 0.12, f: 1400, f2: 500, q: 0.8, gain: 0.25, dest: d })
  respingo(s, t + 0.04, d, 0.7)
  vidro(s, t, d, 0.6, 1.2)
  return 0.7
}
const dano: Tocar = (s, t, d) => { // o guincho que cai, o vidro rachando
  voz(s, { t, dur: 0.38, a: 0.01, r: 0.12, f: 420, f2: 260, vogal: 'i', vogal2: 'a', sc: 0.75, grit: 3, vib: [9, 40], ar: 0.6, gain: 0.08, dest: d })
  estalos(s, { t, n: 6, i0: 0.01, i1: 0.03, f: 3200, q: 5, gain: 0.05, forma: (u) => 1 - u, dest: d })
  return 0.5
}

/** As partes, para as provas medirem. */
export const PARTES_DEVORA_ESPECTROS: Parte[] = [
  ['flutuando', flutuando], ['gemido', (s, t, d) => { gemer(s, t, d, 2); return 2.3 }], ['aviso do bote', aviso(BOTE.aviso)], ['investida', investida],
  ['aviso da mordida', aviso(MORDIDA.aviso)], ['fecha', fecha], ['garganta', garganta], ['cospe', cospe], ['dano', dano],
]

interface Antes { modo: string; fase: string; dano: object | null; repete: number }
const antes = new WeakMap<DevoraEspectros, Antes>()
const _p = new THREE.Vector3()

/** Depois de animarDevoraEspectros (s = o que ela devolveu): a voz anda com ele e cada som toca quando a animação chega
 *  nele (a fase de cada golpe: o aviso, a investida, o cuspe). */
export function ouvirDevoraEspectros(d: DevoraEspectros, s: SaidaEspectros, dt: number) {
  const A = d.anim, fase = faseDe(d)
  let b = antes.get(d)
  if (!b) { b = { modo: A.modo, fase, dano: A.dano, repete: sorteio(0.5, 3) }; antes.set(d, b) }
  const v = vozDe(d, d.corpo.getWorldPosition(_p), REF, VOLUME)
  if (v) {
    const { s: S, d: D, t } = v
    if (fase !== b.fase || A.modo !== b.modo) {
      if (fase === 'bote:aviso') aviso(BOTE.aviso)(S, t, D)
      else if (fase === 'bote:investe') investida(S, t, D)
      else if (fase === 'morder:aviso') aviso(MORDIDA.aviso)(S, t, D)
      else if (fase === 'cuspir:infla') garganta(S, t, D)
      b.repete = Math.max(b.repete, 1.5) // depois de um golpe, um respiro antes do próximo gemido
    }
    if (s.fechou) fecha(S, t, D)
    if (s.cria) cospe(S, t, D)
    if (A.dano && A.dano !== b.dano) dano(S, t, D)
    if (A.modo === 'pairar' && (b.repete -= dt) <= 0) { b.repete = flutuando(S, t, D) + sorteio(2.5, 5) }
  }
  Object.assign(b, { modo: A.modo, fase, dano: A.dano })
}

/** Em que pedaço do golpe ele está ("bote:aviso", "cuspir:infla"...; "pairar" fora dos golpes). */
function faseDe(d: DevoraEspectros): string {
  const A = d.anim
  const fases: Record<string, [string, number][]> = {
    bote: [['aviso', BOTE.aviso], ['investe', BOTE.investe]], morder: [['aviso', MORDIDA.aviso]], cuspir: [['infla', CUSPE.infla]],
  }
  const lista = fases[A.modo]
  if (!lista) return A.modo
  let t = A.tm
  for (const [n, dur] of lista) { if (t < dur) return `${A.modo}:${n}`; t -= dur }
  return `${A.modo}:resto`
}
