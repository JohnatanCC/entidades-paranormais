// Os sons do Devora almas: o Abismo (escolhido em 12/nov, docs/demonios.md). Grave e enorme, gemidos lentos de baleia
// e um rugido fundo (o tamanho dele, a tristeza das almas). A voz sai do corpo dele (../sons.ts; soa cheia até 4 m) e
// cada som toca no momento da animação (ouvirDevora, depois de animarDevora, com o que ela devolveu):
//   fora do chão: respira gemendo de vez em quando; nadando: um ronco embaixo do chão e o gemido lento, sem parar;
//   romper o chão (entrando, saindo, o salto, a investida, a ninhada): a pedra racha, as pedrinhas caem, o baque grave;
//   entrar no chão: ruge curto, a terra engole (o ar, o baque, a pedra) e borbulha; sair: o rugido e o chão rompendo;
//   o ataque da marca: o chão ronca crescendo embaixo (o aviso), ele sai rugindo e a boca fecha num baque pesado;
//     errou: se debate batendo no chão; pegou: mastiga (estalos e um gemido abafado) e cospe (a ânsia e o respingo);
//   a investida: ruge na mira (o aviso), rasga o chão correndo (os espinhos subindo atrás, um baque de pedra atrás do
//     outro) e derrapa freando;
//   a chuva: geme afundando; em cada círculo o chão ronca no aviso e o tentáculo rompe (somEm, no ponto do círculo);
//   a ninhada: a garganta enche, borbulhando e roncando, e cada cria sai num cuspe;
//   atordoado: o baque da queda e o gemido tremendo; rastejando: arrasta a barriga a cada puxada, gemendo;
//   o dano: um grunhido; um tentáculo arrancado: o rugido de dor e o respingo; a barra nova (a fase): o rugido grande;
//   estourar: o rugido caindo, o chão rompendo e o respingo enorme.
import * as THREE from 'three'
import { estalos, pancada, racha, ruido, tom, voz, type Som } from '../../../audio/sintese'
import type { SaidaDevora } from './animacao'
import type { DevoraAlmas, ModoDevora } from './modelo'
import { CHUVA, INVESTIDA, RASTEJO, TEMPO } from './numeros'
import { bolha, respingo, sorteio, vozDe, type Parte, type Tocar } from '../sons'

const R = Math.random
const REF = 6 // m: até onde a voz dele soa cheia (ele é enorme)
const VOLUME = 4 // o volume dele (os outros Sombrios: 2,5): o chefe tem que se impor (13/nov)

/** O chão rompendo (k = o tamanho): a pedra racha, as pedrinhas caem e o baque grave. */
function romper(s: Som, t: number, d: AudioNode, k = 1) {
  racha(s, t, 0.4 * k, d); racha(s, t + 0.06, 0.3 * k, d)
  pancada(s, t, 48, 0.3 * k, d)
  tom(s, { t, f: 42, f2: 28, dur: 0.3, r: 0.5, gain: 0.25 * k, lp: 120, dest: d })
  estalos(s, { t: t + 0.1, n: Math.round(22 * k), i0: 0.02, i1: 0.07, f: 700, q: 3, gain: 0.1 * k, forma: (u) => 1 - u, dest: d })
  ruido(s, { t, dur: 0.5, a: 0.02, r: 0.3, tipo: 'lowpass', f: 900, f2: 200, gain: 0.18 * k, dest: d })
}
/** O rugido fundo, em camadas (dur s; k = a força). */
function rugir(s: Som, t: number, d: AudioNode, dur = 1.4, k = 1) {
  voz(s, { t, dur, a: 0.12, f: 70, f2: 96, f3: 55, glide: dur * 0.25, vogal: 'a', vogal2: 'o', sc: 0.5, grit: 4, fry: 0.35, fryHz: 24, ar: 0.5, camadas: [[1, 0, 1], [0.5, -10, 0.6], [1.5, 12, 0.3]], gain: 0.17 * k, dest: d })
  tom(s, { t, f: 44, f2: 34, dur, a: 0.1, r: 0.4, gain: 0.16 * k, dest: d })
  return dur + 0.3
}
/** O ronco do chão crescendo embaixo (o aviso de que algo vai sair). */
function ronco(s: Som, t: number, d: AudioNode, dur: number, k = 1) {
  ruido(s, { t, dur, a: dur * 0.8, r: 0.15, tipo: 'lowpass', f: 110, f2: 220, gain: 0.32 * k, dest: d })
  tom(s, { t, f: 36, f2: 48, dur, a: dur * 0.8, r: 0.2, gain: 0.14 * k, dest: d })
  estalos(s, { t: t + dur * 0.3, n: 10, i0: 0.08, i1: 0.03, f: 600, q: 3, gain: 0.06 * k, forma: (u) => u, dest: d })
}

const nadando: Tocar = (s, t, d) => {
  ruido(s, { t, dur: 2.4, a: 0.6, r: 0.6, tipo: 'lowpass', f: 130, gain: 0.3, dest: d })
  tom(s, { t, f: 38, f2: 33, dur: 2.4, a: 0.6, r: 0.6, gain: 0.14, dest: d })
  if (R() < 0.6) voz(s, { t: t + 0.3, dur: 2, a: 0.5, r: 0.5, f: 48, f2: 64, f3: 40, glide: 0.9, vogal: 'o', vogal2: 'u', sc: 0.45, grit: 1.5, vib: [0.8, 35], wob: 0.15, gain: 0.1, dest: d })
  return 3
}
const respira: Tocar = (s, t, d) => {
  voz(s, { t, dur: 1.3, a: 0.4, r: 0.4, f: 52, f2: 44, vogal: 'o', vogal2: 'u', sc: 0.45, grit: 1.6, ar: 0.8, gain: 0.07, dest: d })
  return 1.6
}
const saiDoChao: Tocar = (s, t, d) => { rugir(s, t, d, 0.9, 0.9); return 1.2 } // (o chão rompendo vem junto: s.rompe)
const mergulho: Tocar = (s, t, d) => { // a terra engole: ruge curto, o ar, o baque, a pedra e as bolhas
  voz(s, { t, dur: 0.6, f: 72, f2: 48, vogal: 'a', vogal2: 'u', sc: 0.5, grit: 3, ar: 0.5, gain: 0.13, dest: d })
  ruido(s, { t, dur: 0.55, a: 0.08, f: 700, f2: 160, q: 0.8, gain: 0.25, dest: d })
  romper(s, t + 0.3, d, 0.8)
  for (let i = 0; i < 8; i++) bolha(s, t + 0.45 + R() * 0.7, d, 0.08, 140)
  return 1.3
}
const marca: Tocar = (s, t, d) => { ronco(s, t, d, TEMPO.marca, 1.4); return TEMPO.marca }
const fecha: Tocar = (s, t, d) => { // a boca fecha lá em cima
  pancada(s, t, 55, 0.4, d); racha(s, t, 0.35, d)
  tom(s, { t, f: 70, f2: 35, dur: 0.2, r: 0.3, gain: 0.25, lp: 150, dest: d })
  return 0.5
}
const debate: Tocar = (s, t, d) => { // errou: se debate batendo no chão
  pancada(s, t, 60, 0.22, d); respingo(s, t, d, 0.7)
  if (R() < 0.5) voz(s, { t, dur: 0.5, f: 75, f2: 58, vogal: 'a', sc: 0.5, grit: 3, ar: 0.4, gain: 0.09, dest: d })
  return 0.6
}
const mastiga: Tocar = (s, t, d) => {
  racha(s, t, 0.25, d); pancada(s, t, 65, 0.15, d)
  voz(s, { t, dur: 0.35, f: 58, f2: 50, vogal: 'm', sc: 0.5, grit: 2, gain: 0.07, dest: d }) // de boca fechada
  return 0.4
}
const cuspe: Tocar = (s, t, d) => {
  voz(s, { t, dur: 0.35, f: 80, f2: 110, vogal: 'a', sc: 0.5, grit: 5, fry: 0.5, fryHz: 26, ar: 0.7, gain: 0.13, dest: d }) // a ânsia
  respingo(s, t + 0.05, d, 1.4)
  return 0.8
}
const investida: Tocar = (s, t, d) => { // rasga o chão correndo, os espinhos subindo atrás
  ruido(s, { t, dur: INVESTIDA.dura, a: 0.05, r: 0.2, tipo: 'lowpass', f: 300, gain: 0.6, dest: d })
  estalos(s, { t, n: 40, i0: 0.025, i1: 0.03, f: 900, q: 3, gain: 0.25, dest: d })
  ruido(s, { t, dur: INVESTIDA.dura, a: 0.05, r: 0.2, f: 1600, q: 0.7, gain: 0.09, dest: d }) // o ar
  for (let u = 0.05; u < INVESTIDA.dura; u += 0.11) { pancada(s, t + u, 52 + R() * 12, 0.28, d); racha(s, t + u + 0.01, 0.16, d) } // os espinhos
  return INVESTIDA.dura
}
const freia: Tocar = (s, t, d) => {
  ruido(s, { t, dur: INVESTIDA.freia, a: 0.02, r: 0.2, tipo: 'lowpass', f: 700, f2: 150, gain: 0.55, dest: d })
  estalos(s, { t, n: 16, i0: 0.03, i1: 0.07, f: 800, q: 3, gain: 0.18, forma: (u) => 1 - u, dest: d })
  return INVESTIDA.freia
}
/** A ninhada: a garganta enche (borbulha e ronca subindo) antes dos cuspes. */
const garganta: Tocar = (s, t, d) => {
  voz(s, { t, dur: 0.9, a: 0.2, f: 46, f2: 78, glide: 0.8, vogal: 'u', vogal2: 'a', sc: 0.45, grit: 3.5, fry: 0.45, fryHz: 18, ar: 0.4, gain: 0.2, dest: d })
  for (let i = 0; i < 10; i++) bolha(s, t + R() * 0.8, d, 0.1, 120 + R() * 90)
  return 1
}
const geme: Tocar = (s, t, d) => {
  voz(s, { t, dur: 1.4, a: 0.3, f: 50, f2: 66, f3: 46, glide: 0.7, vogal: 'o', vogal2: 'u', sc: 0.45, grit: 1.8, vib: [1.2, 40], gain: 0.18, dest: d })
  return 1.6
}
/** A chuva: o chão ronca embaixo de um círculo (o aviso; somEm, no ponto dele). */
export const avisoChuva: Tocar = (s, t, d) => { ronco(s, t, d, CHUVA.aviso, 1.1); return CHUVA.aviso }
/** A chuva: o tentáculo rompe o chão e sobe (somEm, no ponto do círculo). */
export const tentaculo: Tocar = (s, t, d) => {
  romper(s, t, d, 0.7)
  ruido(s, { t, dur: CHUVA.sobe + 0.1, a: 0.02, f: 300, f2: 1400, q: 0.8, gain: 0.12, dest: d })
  return 0.8
}
const cria: Tocar = (s, t, d) => {
  voz(s, { t, dur: 0.3, f: 90, f2: 120, vogal: 'a', sc: 0.55, grit: 5, fry: 0.4, fryHz: 26, ar: 0.6, gain: 0.16, dest: d })
  ruido(s, { t: t + 0.05, dur: 0.06, tipo: 'lowpass', f: 1100, gain: 0.2, dest: d }) // o cuspe
  bolha(s, t + 0.1, d, 0.07, 180)
  return 0.4
}
const atordoado: Tocar = (s, t, d) => {
  pancada(s, t + 0.35, 45, 0.4, d); respingo(s, t + 0.35, d, 1.5) // cai de lado
  voz(s, { t: t + 0.5, dur: 1.8, a: 0.1, f: 66, f2: 44, glide: 1.5, vogal: 'u', vogal2: 'o', sc: 0.5, grit: 2, vib: [3.2, 60], ar: 0.4, gain: 0.12, dest: d })
  for (let i = 0; i < 6; i++) bolha(s, t + 0.7 + R() * 1.5, d, 0.06, 140)
  return 2.3
}
const arrasta: Tocar = (s, t, d) => {
  ruido(s, { t, dur: 0.6, a: 0.15, r: 0.2, tipo: 'lowpass', f: 400, f2: 200, gain: 0.2, dest: d })
  estalos(s, { t: t + 0.1, n: 10, i0: 0.04, i1: 0.05, f: 700, q: 3, gain: 0.06, dest: d })
  if (R() < 0.4) voz(s, { t, dur: 0.9, f: 56, f2: 46, vogal: 'u', sc: 0.5, grit: 2, ar: 0.6, gain: 0.08, dest: d })
  return 0.9
}
const dano: Tocar = (s, t, d) => {
  voz(s, { t, dur: 0.4, f: 85, f2: 62, vogal: 'a', sc: 0.5, grit: 4, fry: 0.4, fryHz: 22, ar: 0.4, gain: 0.13, dest: d })
  return 0.5
}
const arrancado: Tocar = (s, t, d) => { rugir(s, t, d, 0.9, 1.1); respingo(s, t, d, 1.6); return 1.2 }
const estouro: Tocar = (s, t, d) => {
  voz(s, { t, dur: 1.2, f: 90, f2: 40, glide: 1, vogal: 'a', vogal2: 'u', sc: 0.5, grit: 4, fry: 0.5, fryHz: 20, ar: 0.6, camadas: [[1, 0, 1], [0.5, -8, 0.6]], gain: 0.15, dest: d })
  romper(s, t + 0.5, d)
  respingo(s, t + 0.55, d, 2.2)
  return 1.8
}

/** As partes, para as provas medirem. */
export const PARTES_DEVORA_ALMAS: Parte[] = [
  ['nadando', nadando], ['respira', respira], ['romper', (s, t, d) => { romper(s, t, d); return 0.8 }], ['sai do chão', saiDoChao], ['mergulho', mergulho],
  ['marca', marca], ['rugido', (s, t, d) => rugir(s, t, d)], ['fecha', fecha], ['debate', debate], ['mastiga', mastiga], ['cuspe', cuspe],
  ['investida', investida], ['freia', freia], ['geme', geme], ['garganta', garganta], ['aviso da chuva', avisoChuva], ['tentáculo', tentaculo], ['cria', cria],
  ['atordoado', atordoado], ['arrasta', arrasta], ['dano', dano], ['arrancado', arrancado], ['estouro', estouro],
]

/** O que toca ao entrar em cada modo (os que têm som próprio). */
const AO_ENTRAR: Partial<Record<ModoDevora, Tocar>> = {
  mergulho, emergir: saiDoChao, marca, salto: (s, t, d) => rugir(s, t, d, 0.9), mira: (s, t, d) => rugir(s, t, d, INVESTIDA.mira),
  investida, freia, chuva: geme, ninhada: garganta, atordoado,
}

// o que a animação era no quadro anterior, e quanto falta para os sons que se repetem (nadando, respirando, mastigando,
// se debatendo, arrastando)
/** Os que se repetem enquanto ele está no modo: o som e o intervalo (s, sorteado entre os dois). */
const REPETE: Partial<Record<ModoDevora, [Tocar, number, number]>> = {
  nadando: [nadando, 2.2, 2.6], solto: [respira, 4, 7], exposto: [debate, 0.45, 0.8], engolindo: [mastiga, 0.4, 0.55],
  rastejando: [arrasta, 1 / RASTEJO.puxadas, 1 / RASTEJO.puxadas],
}

interface Antes { modo: ModoDevora; dano: object | null; estourado: boolean; fase: number; costas: number; repete: number }
const antes = new WeakMap<DevoraAlmas, Antes>()
const _p = new THREE.Vector3()
const costas = (d: DevoraAlmas) => d.anim.costas.filter(Boolean).length

/** Depois de animarDevora (s = o que ela devolveu): a voz anda com ele e cada som toca quando a animação chega nele. */
export function ouvirDevora(d: DevoraAlmas, s: SaidaDevora, dt: number) {
  const A = d.anim
  let b = antes.get(d)
  if (!b) { b = { modo: A.modo, dano: A.dano, estourado: A.estourado, fase: A.fase, costas: costas(d), repete: sorteio(0.5, 2) }; antes.set(d, b) }
  const v = vozDe(d, d.corpo.getWorldPosition(_p), REF, VOLUME)
  if (v) {
    const { s: S, d: D, t } = v
    if (A.estourado && !b.estourado) estouro(S, t, D)
    else if (!A.estourado) {
      if (A.modo !== b.modo) { AO_ENTRAR[A.modo]?.(S, t, D); b.repete = 0.3 }
      if (s.rompe) romper(S, t, D, A.modo === 'chuva' || A.modo === 'mergulho' ? 0.7 : 1)
      if (s.mordeu) fecha(S, t, D)
      if (s.cuspe) cuspe(S, t, D)
      if (s.cria) cria(S, t, D)
      if (A.dano && A.dano !== b.dano) dano(S, t, D)
      if (costas(d) < b.costas) arrancado(S, t, D)
      if (A.fase > b.fase) rugir(S, t, D, 1.6, 1.15) // a barra nova
      const r = REPETE[A.modo]
      if (r && (b.repete -= dt) <= 0) { r[0](S, t, D); b.repete = sorteio(r[1], r[2]) }
    }
  }
  Object.assign(b, { modo: A.modo, dano: A.dano, estourado: A.estourado, fase: A.fase, costas: costas(d) })
}
