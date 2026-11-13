// Os sons das armas (escolhidos em 12/nov, docs/jogo.md): a pistola de plasma é o **Sino** (um sino abafado e quente,
// com o chiado do frasco; antigo, quase de igreja) e a escopeta de Demantino é o **Ferro que canta** (o estalo seco e o
// ferro amaldiçoado tocando depois, como sinos desafinados, com o sal caindo). Os outros seguem os dois:
//   a pistola superaquecida: o vidro do frasco estalando; esfriou: um sininho descendo (pronta de novo);
//   a escopeta: a bomba é o ferro deslizando e o trinco batendo; a recarga: a bolsa abre, cada bala entra com um toque
//     de ferro, e no fim a bomba; a armadilha: a corrente chacoalha no arremesso, pousa e a íris abre, volta à mão;
//   trocar de arma: o couro e o metal; onde a bala bate: a brasa chiando (pistola) ou o ferro ricocheteando (escopeta);
//   num demônio: o baque molhado da matéria escura.
// O agente está perto da câmera: os sons dele vão direto para a saída (com um pouco do eco); onde a bala bate, o som
// fica no ponto (somEm). Quem toca cada um no momento certo é player/sons.ts (ouvirAgente), pela animação.
import * as THREE from 'three'
import { estalos, pancada, racha, ruido, tom, type Som } from '../../audio/sintese'
import { respingo, somEm, type Parte, type Tocar } from '../enemies/sons'

const R = Math.random

/** Para onde tocar com um pouco do eco do lugar (k = quanto vai para o eco). */
export function comEco(s: Som, d: AudioNode, k: number): AudioNode {
  const g = s.ctx.createGain(), e = s.ctx.createGain(); e.gain.value = k
  g.connect(d); g.connect(e); e.connect(s.eco)
  return g
}
/** Mais alto (k vezes): para as partes pequenas não sumirem perto dos tiros. */
export function ganho(s: Som, d: AudioNode, k: number): AudioNode { const g = s.ctx.createGain(); g.gain.value = k; g.connect(d); return g }
/** O ferro tocando: parciais desafinados que somem devagar (k = a força, f = o quanto mais agudo). */
function ferroToca(s: Som, t: number, d: AudioNode, k = 1, f = 1) {
  for (const [hz, r, g] of [[310, 1.1, 0.03], [787, 0.8, 0.022], [1453, 0.6, 0.014], [2210, 0.4, 0.008]]) tom(s, { t, f: hz * f * (0.98 + R() * 0.04), dur: 0.01, a: 0.002, r, gain: g * k, dest: d })
}

// ---------- a pistola de plasma: o Sino ----------
export const tiroPistola: Tocar = (s, t, d) => {
  const w = comEco(s, d, 0.45), f0 = 600 + R() * 60
  for (const [h, g] of [[1, 0.27], [2.0, 0.135], [2.76, 0.1], [5.4, 0.045]]) tom(s, { t, f: f0 * h, dur: 0.01, a: 0.002, r: 0.45 + 0.2 / h, gain: g, lp: 2200, dest: w })
  ruido(s, { t, dur: 0.06, a: 0.002, r: 0.08, tipo: 'highpass', f: 3200, gain: 0.12, dest: d }) // o chiado do frasco
  pancada(s, t, 170, 0.3, d) // o coice
  return 0.6
}
/** Superaquecida: o vidro do frasco estalando. */
export const superaquece: Tocar = (s, t, d) => {
  d = ganho(s, d, 2.5)
  for (let i = 0; i < 4; i++) {
    const u = t + i * 0.11 + R() * 0.05
    racha(s, u, 0.1, d)
    estalos(s, { t: u + 0.02, n: 3, i0: 0.004, i1: 0.008, f: 4200, q: 6, gain: 0.06, dest: d })
    tom(s, { t: u + 0.02, f: 2800 + R() * 600, dur: 0.01, r: 0.12, gain: 0.02, dest: d })
  }
  ruido(s, { t, dur: 0.5, a: 0.02, r: 0.3, tipo: 'highpass', f: 3500, gain: 0.05, dest: d }) // o chiado do calor
  return 0.7
}
/** Esfriou: um sininho descendo (pronta de novo). */
export const esfriou: Tocar = (s, t, d) => {
  const w = comEco(s, ganho(s, d, 2.5), 0.5);
  [988, 784, 659].forEach((f, i) => tom(s, { t: t + i * 0.09, f, dur: 0.01, a: 0.003, r: 0.5, gain: 0.06, lp: 2600, dest: w }))
  return 0.8
}

// ---------- a escopeta de Demantino: o Ferro que canta ----------
export const tiroEscopeta: Tocar = (s, t, d) => {
  const w = comEco(s, d, 0.6)
  ruido(s, { t, dur: 0.04, a: 0.001, r: 0.06, f: 1800, q: 0.7, gain: 0.95, dest: d }) // o estalo
  pancada(s, t, 70, 1.25, d)
  tom(s, { t, f: 90, f2: 40, dur: 0.22, r: 0.3, gain: 0.65, lp: 200, dest: d })
  ferroToca(s, t + 0.01, w, 1.4)
  ruido(s, { t: t + 0.05, dur: 0.35, a: 0.02, r: 0.2, tipo: 'highpass', f: 5000, gain: 0.04, dest: d }) // o sal caindo
  return 1.2
}
/** A bomba: o ferro desliza para trás, o trinco bate, e volta. */
export const bomba: Tocar = (s, t, d) => {
  ruido(s, { t, dur: 0.1, a: 0.01, r: 0.03, f: 2600, f2: 1800, q: 3, gain: 0.3, dest: d })
  estalos(s, { t: t + 0.1, n: 1, i0: 0.01, i1: 0.01, f: 1700, q: 4, gain: 0.6, dest: d })
  tom(s, { t: t + 0.1, f: 320, f2: 260, dur: 0.03, r: 0.08, gain: 0.22, dest: d })
  ruido(s, { t: t + 0.16, dur: 0.08, a: 0.01, r: 0.03, f: 1900, f2: 2700, q: 3, gain: 0.3, dest: d })
  estalos(s, { t: t + 0.25, n: 1, i0: 0.01, i1: 0.01, f: 2000, q: 4, gain: 0.6, dest: d })
  return 0.35
}
/** A recarga começa: a mão abre a bolsa do cinto (o couro e o fecho). */
export const bolsa: Tocar = (s, t, d) => {
  d = ganho(s, d, 3)
  estalos(s, { t, n: 2, i0: 0.06, i1: 0.06, f: 2600, q: 5, gain: 0.16, dest: d })
  ruido(s, { t: t + 0.12, dur: 0.14, a: 0.02, r: 0.06, f: 1300, q: 0.9, gain: 0.08, dest: d }) // o couro
  return 0.3
}
/** Uma bala entra na câmara: o clique e um toque curto do ferro. */
export const balaEntra: Tocar = (s, t, d) => {
  estalos(s, { t, n: 1, i0: 0.01, i1: 0.01, f: 2400, q: 5, gain: 0.4, dest: d })
  pancada(s, t, 210, 0.12, d)
  ferroToca(s, t + 0.005, d, 0.7, 1.6)
  return 0.5
}

// ---------- a armadilha e a troca ----------
/** O arremesso: a corrente chacoalha e o ar. */
export const arremesso: Tocar = (s, t, d) => {
  d = ganho(s, d, 3)
  estalos(s, { t, n: 9, i0: 0.02, i1: 0.035, f: 2600, q: 7, gain: 0.14, dest: d })
  ruido(s, { t, dur: 0.22, a: 0.03, r: 0.06, f: 500, f2: 1500, q: 1.1, gain: 0.12, dest: d })
  return 0.35
}
/** Ela pousa e a íris abre (no lugar dela). */
export const armadilhaPresa: Tocar = (s, t, d) => {
  pancada(s, t, 130, 0.24, d)
  estalos(s, { t: t + 0.04, n: 8, i0: 0.03, i1: 0.012, f: 2000, q: 6, gain: 0.14, dest: d })
  tom(s, { t: t + 0.2, f: 784, dur: 0.01, r: 0.6, gain: 0.06, lp: 2600, dest: comEco(s, d, 0.5) })
  return 0.9
}
/** Ela volta à mão. */
export const armadilhaVolta: Tocar = (s, t, d) => {
  pancada(s, t, 150, 0.2, d)
  estalos(s, { t, n: 3, i0: 0.015, i1: 0.02, f: 2200, q: 6, gain: 0.12, dest: d })
  return 0.3
}
/** Trocar de arma: o couro e o metal. */
export const troca: Tocar = (s, t, d) => {
  d = ganho(s, d, 3)
  estalos(s, { t, n: 2, i0: 0.05, i1: 0.12, f: 1900, q: 5, gain: 0.18, dest: d })
  ruido(s, { t: t + 0.08, dur: 0.12, a: 0.02, f: 900, f2: 1600, q: 1.2, gain: 0.08, dest: d })
  return 0.3
}

// ---------- onde a bala bate ----------
/** Na parede, no chão: a brasa chiando (pistola) ou o ferro ricocheteando (escopeta). */
const bateBrasa: Tocar = (s, t, d) => { d = ganho(s, d, 2.5); racha(s, t, 0.12, d); ruido(s, { t, dur: 0.16, a: 0.003, r: 0.12, tipo: 'highpass', f: 3800, gain: 0.07, dest: d }); return 0.3 }
const bateFerro: Tocar = (s, t, d) => { d = ganho(s, d, 3); racha(s, t, 0.1, d); ferroToca(s, t, d, 0.6, 2 + R()); return 0.6 }
/** Num demônio: o baque molhado da matéria escura. */
const acerta: Tocar = (s, t, d) => { pancada(s, t, 90, 0.3, d); respingo(s, t, d, 0.5); return 0.4 }

/** Uma bala bateu em p (alvo = num demônio). Os bagos da escopeta chegam juntos: um quadro toca no máximo dois. */
let nesteQuadro = 0, quadro = -1
export function somDaBala(p: THREE.Vector3, arma: 'pistola' | 'escopeta', alvo: boolean, agora: number) {
  if (agora !== quadro) { quadro = agora; nesteQuadro = 0 }
  if (++nesteQuadro > 2) return
  somEm(p, alvo ? acerta : arma === 'pistola' ? bateBrasa : bateFerro, 3, 1)
}

/** As partes, para as provas medirem (provas.sonsArmas). */
export const PARTES_ARMAS: Parte[] = [
  ['Pistola: tiro', tiroPistola], ['Pistola: superaquece', superaquece], ['Pistola: esfriou', esfriou],
  ['Escopeta: tiro', tiroEscopeta], ['Escopeta: bomba', bomba], ['Escopeta: bolsa', bolsa], ['Escopeta: bala entra', balaEntra],
  ['Armadilha: arremesso', arremesso], ['Armadilha: presa', armadilhaPresa], ['Armadilha: volta', armadilhaVolta], ['Troca', troca],
  ['Bala: brasa', bateBrasa], ['Bala: ferro', bateFerro], ['Bala: no demônio', acerta],
]
