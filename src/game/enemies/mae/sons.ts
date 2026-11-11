// Os sons da Mãe (portados do laboratório): a voz, aqui, e o corpo e o Luto (ruidos.ts); aqui também o quando de cada
// um. A voz sai da boca dela; os passos e o Luto, do chão onde ela está (audio/espaco.ts). Cada som varia um pouco a
// cada vez:
//   patrulhando, ela cantarola a cantiga (melodia original em lá menor: boca fechada, abrindo nas notas longas; a voz
//     escorrega para a nota, às vezes quebra, cai e fica rouca no fim da frase; nas pausas, puxa o ar pelo nariz);
//   caçando, respira rasgado (puxa num assobio rouco e solta gemendo, a garganta molhada) e guincha de tempos em tempos;
//   cada golpe e cada estado tem a voz dele, no momento do movimento: o rosnado do preparo e o grito da garra, o
//     guincho do bote, da carga e da finta, o ar puxado e o guincho do surgir, o grito (o ar puxado, o grito com o peito
//     por baixo e a voz caindo no fim), o ofego da exausta, a atordoada (o golpe, o baque, o lamento e os soluços junto
//     com os trancos do corpo, o ar rouco quando a cabeça estala), o gemido do cambaleio, o choro fraco, o desespero presa;
//   na fase 4, sussurros;
//   o corpo: um passo a cada meia volta do andar (correndo, mais pesados), o pescoço estalando (na parada, de leve; no
//     surgir e no fim da atordoada, forte), os dedos estalando parada, a garra rasgando o ar, os joelhos batendo no chão,
//     os pés derrapando (a carga, o pouso da investida);
//   o Luto: o espirro e o mergulho, as bolhas e o ronco do aviso, o corpo escorrendo no surgir, as lágrimas pingando.
import * as THREE from 'three'
import { moverFonte, novaFonte, soltarFonte, type Fonte } from '../../../audio/espaco'
import { curva, estalos, formantes, grito, mudarVogal, pancada, racha, ruido, som, sussurro, voz, type Formantes, type Som, type Vogal } from '../../../audio/sintese'
import { baque, bolha, dedos, derrapa, escorre, espirro, estaloPescoco, gota, mergulho, passo, rasgo, ronco } from './ruidos'
import type { Mae } from './modelo'
import { ESTADO, GOLPE, LUTO, SOM } from './numeros'

const R = Math.random
const entre = ([a, b]: readonly [number, number]) => a + R() * (b - a)

// ---------- a cantiga: [frequência, duração (s), vogal]; 0 = a pausa (ela puxa o ar) ----------
const CANTIGA: [number, number, Vogal][] = [
  [329.6, 0.75, 'm'], [293.7, 0.45, 'm'], [261.6, 0.75, 'u'], [293.7, 0.45, 'm'], [246.9, 1.6, 'a'], [0, 1.1, 'm'],
  [261.6, 0.75, 'm'], [246.9, 0.45, 'm'], [220, 0.75, 'u'], [207.7, 0.5, 'm'], [220, 2.1, 'o'], [0, 2.4, 'm'],
]
interface Canto { g: GainNode; oscs: OscillatorNode[]; vib: GainNode; rouca: GainNode; fs: Formantes; nos: AudioScheduledSourceNode[]; i: number; prox: number }

/** A voz que cantarola: duas vozes juntas e a sombra dela uma oitava abaixo (atrasada), o tom tremendo sozinho, o
 *  vibrato que cresce nas notas longas, um "wow" de fita lento e o ar passando. Fica ligada; cantar() manda nas notas. */
function comecarCanto(s: Som, dest: AudioNode): Canto {
  const { ctx } = s
  const g = ctx.createGain(); g.gain.value = 0.0001; g.connect(dest)
  const pre = ctx.createGain(); pre.gain.value = 0.55
  const am = ctx.createGain(); am.gain.value = 1
  const fo = ctx.createOscillator(); fo.type = 'square'; fo.frequency.value = 34; const rouca = ctx.createGain(); rouca.gain.value = 0; fo.connect(rouca); rouca.connect(am.gain)
  const sat = ctx.createWaveShaper(); sat.curve = curva(1.4)
  const o1 = ctx.createOscillator(), o2 = ctx.createOscillator(), sub = ctx.createOscillator()
  for (const o of [o1, o2, sub]) o.setPeriodicWave(s.glote)
  o2.detune.value = 9; sub.detune.value = -1200
  const subG = ctx.createGain(); subG.gain.value = 0.16; const subD = ctx.createDelay(0.2); subD.delayTime.value = 0.045
  o1.connect(pre); o2.connect(pre); sub.connect(subG); subG.connect(subD); subD.connect(pre)
  const jn = ctx.createBufferSource(); jn.buffer = s.ruido; jn.loop = true; jn.playbackRate.value = 0.05
  const jl = ctx.createBiquadFilter(); jl.type = 'lowpass'; jl.frequency.value = 7; const jg = ctx.createGain(); jg.gain.value = 60; jn.connect(jl); jl.connect(jg)
  const vo = ctx.createOscillator(), vib = ctx.createGain(); vo.frequency.value = 5.3; vib.gain.value = 0; vo.connect(vib)
  const wow = ctx.createOscillator(), wg = ctx.createGain(); wow.frequency.value = 0.31; wg.gain.value = 1.2; wow.connect(wg)
  for (const o of [o1, o2, sub]) { jg.connect(o.frequency); vib.connect(o.frequency); wg.connect(o.frequency) }
  pre.connect(am); am.connect(sat)
  const fs = formantes(s, sat, g, 'm')
  const ns = ctx.createBufferSource(); ns.buffer = s.ruido; ns.loop = true
  const nf = ctx.createBiquadFilter(); nf.type = 'bandpass'; nf.frequency.value = 1700; nf.Q.value = 0.9; const ng = ctx.createGain(); ng.gain.value = 0.035; ns.connect(nf); nf.connect(ng); ng.connect(g)
  const nos: AudioScheduledSourceNode[] = [o1, o2, sub, jn, vo, wow, ns, fo]; nos.forEach((x) => x.start())
  return { g, oscs: [o1, o2, sub], vib, rouca, fs, nos, i: 0, prox: ctx.currentTime + 0.6 }
}

/** Marca as próximas notas da cantiga (um quarto de segundo adiante). */
function cantar(s: Som, c: Canto, dest: AudioNode) {
  while (c.prox < s.ctx.currentTime + 0.25) {
    const [f, d, v] = CANTIGA[c.i % CANTIGA.length], t = c.prox
    if (f > 0) {
      const ff = f * Math.pow(2, (R() - 0.5) * 0.045) // até ±20 cents fora
      c.oscs.forEach((o) => o.frequency.setTargetAtTime(ff, t, 0.045)) // escorrega para a nota
      mudarVogal(c.fs, v, t, 0.07)
      c.g.gain.setTargetAtTime(0.15, t, 0.07); c.g.gain.setTargetAtTime(0.11, t + d * 0.55, 0.18)
      c.vib.gain.setTargetAtTime(0, t, 0.02); if (d > 1) c.vib.gain.setTargetAtTime(5, t + 0.35, 0.25) // vibrato só depois de firmar a nota longa
      c.rouca.gain.setTargetAtTime(0, t, 0.05)
      if (CANTIGA[(c.i + 1) % CANTIGA.length][0] === 0 && R() < 0.45) { // fim da frase: a voz cai e fica rouca
        c.oscs.forEach((o) => o.frequency.setTargetAtTime(ff * Math.pow(2, -(2 + R() * 2) / 12), t + d * 0.55, 0.22))
        c.rouca.gain.setTargetAtTime(0.55, t + d * 0.5, 0.15); mudarVogal(c.fs, 'm', t + d * 0.6, 0.2)
      } else if (R() < 0.1) c.oscs.forEach((o) => o.frequency.setTargetAtTime(ff * 0.92, t + d * 0.7, 0.03)) // a voz quebra
    } else { // a pausa: cala e puxa o ar pelo nariz
      c.g.gain.setTargetAtTime(0.0001, t, 0.1); c.rouca.gain.setTargetAtTime(0, t, 0.05)
      ruido(s, { t: t + d * 0.45, dur: 0.5, a: 0.25, r: 0.12, f: 650, f2: 1500, q: 1.6, gain: 0.07, dest })
    }
    c.prox += d; c.i++
  }
}

function pararCanto(s: Som, c: Canto) {
  const t = s.ctx.currentTime
  c.g.gain.cancelScheduledValues(t); c.g.gain.setTargetAtTime(0.0001, t, 0.06)
  c.nos.forEach((x) => x.stop(t + 0.6))
}

// ---------- as vozes curtas ----------
/** Caçando: puxa o ar num assobio rouco e solta com a garganta rasgada (e molhada). */
function respira(s: Som, t: number, d: AudioNode) {
  const dIn = 0.14 + R() * 0.08, dOut = 0.2 + R() * 0.12, t2 = t + dIn + 0.025
  ruido(s, { t, dur: dIn, a: 0.03, r: 0.04, f: 1150, f2: 2300, q: 4, gain: 0.2, dest: d })
  ruido(s, { t, dur: dIn, a: 0.03, r: 0.05, f: 3400, q: 1.2, gain: 0.06, dest: d })
  ruido(s, { t: t2, dur: dOut, a: 0.012, r: 0.12, f: 1300, f2: 650, q: 1.6, gain: 0.26, dest: d })
  voz(s, { t: t2, dur: dOut, f: 62 + R() * 30, f2: 48, vogal: R() < 0.5 ? 'a' : 'o', gain: 0.16, grit: 3.5, fry: 0.7, fryHz: 28 + R() * 14, ar: 0.4, r: 0.1, dest: d })
  if (R() < 0.6) estalos(s, { t: t2 + 0.04, n: 7 + ((R() * 9) | 0), i0: 0.02, i1: 0.032, f: 280 + R() * 220, q: 2.2, gain: 0.14, dest: d })
}
/** O guincho: sobe rasgando, treme e quebra no fim. */
function guincho(s: Som, t: number, d: AudioNode) {
  const f0 = 480 + R() * 120, pico = 880 + R() * 260, dur = 0.45 + R() * 0.35
  voz(s, { t, dur, f: f0, f2: pico, f3: pico * 0.7, glide: 0.12, vogal: 'a', vogal2: 'e', gain: 0.34, grit: 4, vib: [9.5, 28], wob: 0.1, ar: 0.6, r: 0.08,
    camadas: [[1, 0, 1], [1.003, 14, 0.7], [0.5, 0, 0.45], [1.5, -10, 0.25]], dest: d })
  ruido(s, { t, dur: 0.06, a: 0.002, r: 0.06, f: 2600, q: 0.8, gain: 0.32, dest: d }) // o ataque
  voz(s, { t: t + dur, dur: 0.25, f: pico * 0.5, f2: pico * 0.25, vogal: 'o', gain: 0.1, grit: 3, fry: 0.6, fryHz: 40, r: 0.15, dest: d }) // a voz quebra
}
/** O ofego: puxa o ar rasgado e solta gemendo (k > 1: mais lento). */
function ofega(s: Som, t: number, d: AudioNode, k = 1) {
  ruido(s, { t, dur: 0.16 * k, a: 0.03, r: 0.04, f: 1200, f2: 2200, q: 3.5, gain: 0.14, dest: d })
  voz(s, { t: t + 0.19 * k, dur: 0.28 * k, f: 70 + R() * 20, f2: 52, vogal: 'a', gain: 0.13, grit: 3.5, fry: 0.7, fryHz: 30, ar: 0.5, r: 0.12, dest: d })
  if (R() < 0.6) estalos(s, { t: t + 0.22 * k, n: 6 + ((R() * 6) | 0), i0: 0.02, i1: 0.03, f: 300, q: 2.2, gain: 0.1, dest: d })
}
/** Puxa o ar fundo (antes do grito, do guincho). */
const puxaAr = (s: Som, t: number, d: AudioNode, dur: number, gain = 0.1) => ruido(s, { t, dur, a: dur * 0.7, r: 0.05, f: 700, f2: 1900, q: 2.2, gain, dest: d })
/** Um soluço: o ar engasgado e um "u" curto que treme. */
function soluca(s: Som, t: number, d: AudioNode, k = 1) {
  ruido(s, { t, dur: 0.07, a: 0.01, r: 0.04, f: 700, f2: 1300, q: 2.2, gain: 0.1 * k, dest: d })
  voz(s, { t: t + 0.03, dur: 0.24, f: 250 + R() * 70, f2: 190, vogal: 'u', gain: 0.13 * k, grit: 2.5, vib: [8, 25], ar: 0.4, r: 0.1, dest: d })
}
/** O lamento: um choro fundo que treme e quebra no fim. */
function lamento(s: Som, t: number, d: AudioNode, gain = 0.1) {
  const dur = 1.0 + R() * 0.45, f0 = 235 + R() * 35
  voz(s, { t, dur, a: 0.08, r: 0.35, f: f0, f2: f0 * 1.12, f3: f0 * 0.66, glide: dur * 0.25, vogal: 'a', vogal2: 'u', sc: 1.05, gain, grit: 3, vib: [6.5, 9], wob: 0.08, ar: 0.55, dest: d })
  if (R() < 0.65) voz(s, { t: t + dur * 0.6, dur: dur * 0.4, f: f0 * 0.8, f2: f0 * 0.55, vogal: 'u', gain: gain * 0.7, grit: 4, fry: 0.75, fryHz: 28, dest: d })
}
/** O ar rouco que ela solta (depois do estalo, levantando). */
const arRouco = (s: Som, t: number, d: AudioNode) => voz(s, { t, dur: 0.35, f: 70, f2: 52, vogal: 'a', gain: 0.1, grit: 3, fry: 0.6, fryHz: 32, ar: 0.5, dest: d })

/** O grito novo: o grito rasgado, o peito por baixo (grave, áspero) e, no fim, a voz que cai. */
function gritoDaMae(s: Som, t: number, d: AudioNode) {
  const G = ESTADO.grito, dur = G.dur - G.puxa - G.volta * 0.5
  grito(s, t, dur, 520, 880, 0.55, d)
  voz(s, { t, dur, f: 105, f2: 130, f3: 95, glide: 0.3, vogal: 'a', sc: 0.6, gain: 0.22, grit: 6, fry: 0.6, fryHz: 30, dest: d })
  voz(s, { t: t + dur - 0.05, dur: 0.6, f: 250, f2: 130, vogal: 'o', gain: 0.22, grit: 3, vib: [6, 22], r: 0.35, dest: d })
}

// ---------- o que ela lembra ----------
/** fonte = de onde a voz sai, chao = de onde vêm os passos e o Luto (nascem quando o som liga); passoN = o último
 *  passo; estalo = a cabeça estava estalando; os relógios de cada som que se repete. */
export interface SonsMae { fonte: Fonte | null; chao: Fonte | null; canto: Canto | null; passoN: number; estalo: boolean; resp: number; guincho: number; choro: number; sussurro: number; dedos: number; bolha: number; gota: number }
export const novosSonsMae = (): SonsMae => ({ fonte: null, chao: null, canto: null, passoN: -1, estalo: false, resp: 0.3, guincho: 2, choro: 1.5, sussurro: 1, dedos: 3, bolha: 0, gota: 0.5 })

const _boca = new THREE.Vector3(), _pe = new THREE.Vector3()

/** Um quadro da voz dela (depois da pose): caca = ela está caçando (respira e guincha em vez de cantarolar). */
export function passoSonsMae(m: Mae, caca: boolean, dt: number) {
  const s = som(), V = m.sons
  if (!s) return
  if (!V.fonte) V.fonte = novaFonte(1.6)
  if (!V.chao) V.chao = novaFonte(2)
  const d = V.fonte!.entrada, p = V.chao!.entrada, t = s.ctx.currentTime, g = m.anim.golpe
  moverFonte(V.fonte!, m.cabeca.localToWorld(_boca.set(0, 0.03, 0.14)))
  moverFonte(V.chao!, m.root.getWorldPosition(_pe).setY(0.05))
  // uma vez por golpe, quando o tempo dele passa do ponto
  const uma = (nome: string, quando: number, f: () => void) => { if (g && g.t >= quando && !g.feito.has(nome)) { g.feito.add(nome); f() } }
  const cada = (k: 'resp' | 'guincho' | 'choro' | 'sussurro' | 'dedos' | 'gota', intervalo: readonly [number, number], f: () => void) => { V[k] -= dt; if (V[k] <= 0) { V[k] = entre(intervalo); f() } }

  // patrulhando, sem golpe e à vista: cantarola; o resto a cala
  const canta = !g && !caca && m.root.visible
  if (canta) { V.canto ??= comecarCanto(s, d); cantar(s, V.canto, d) } else if (V.canto) { pararCanto(s, V.canto); V.canto = null }
  // caçando (e aproximando, correndo na carga): respira rasgado e guincha
  const correndo = g?.nome === 'aproximar' || (g?.nome === 'carga' && g.t > GOLPE.carga.prepara)
  if ((!g && caca) || correndo) cada('resp', correndo ? SOM.respiraCorrendo : SOM.respira, () => respira(s, t, d))
  if (!g && caca) cada('guincho', SOM.guincho, () => guincho(s, t, d))

  // os passos: um a cada meia volta do andar (animacao.ts: passo), em pé e acima do chão
  const n = Math.floor(m.anim.passo / Math.PI)
  if (n !== V.passoN) {
    const emPe = m.pose.cur.hy > -0.3 && m.root.visible && m.root.position.y > -0.05
    if (V.passoN >= 0 && emPe && m.anim.andar > 0.15) passo(s, t, p, Math.hypot(m.anim.vel.x, m.anim.vel.z) > 2.2)
    V.passoN = n
  }
  // parada: o pescoço estala de leve a cada estalo da cabeça; os dedos estalam de vez em quando
  const estala = m.anim.estaloT > 0
  if (estala && !V.estalo) estaloPescoco(s, t, d, 0.6, R() < 0.3)
  V.estalo = estala
  if (!g && m.anim.andar < 0.2) cada('dedos', SOM.dedos, () => dedos(s, t, d))
  // as lágrimas de Luto pingando (de joelhos, chorando)
  const chorando = (g?.nome === 'atordoada' && g.t > 1.5 && g.t < g.dur - ESTADO.atordoada.estala) || g?.nome === 'enfraquecida'
  if (chorando) cada('gota', SOM.gota, () => gota(s, t, d))

  if (g) switch (g.nome) {
    case 'garra_d': case 'garra_e': case 'garra_ultima_d': case 'garra_ultima_e':
      uma('som:preparo', 0, () => { // rosna erguendo o braço; grita no corte
        voz(s, { t, dur: 0.2, f: 150, f2: 230, vogal: 'a', gain: 0.08, grit: 3, fry: 0.5, r: 0.06, dest: d })
        ruido(s, { t, dur: 0.2, a: 0.1, r: 0.04, f: 700, f2: 1300, q: 0.8, gain: 0.07, dest: d })
      })
      uma('som:garra', GOLPE.garra.preparo, () => voz(s, { t, dur: 0.17, f: 360, f2: 560, vogal: 'a', gain: 0.13, grit: 4, r: 0.06, dest: d }))
      uma('som:rasgo', GOLPE.garra.preparo + 0.01, () => rasgo(s, t, d))
      break
    case 'investida': // sai do Luto num espirro, guincha, pousa derrapando
      uma('som:sai', 0, () => { espirro(s, t, p, 0.65, 0.42); pancada(s, t, 66, 0.3, p) })
      uma('som:bote', 0.03, () => guincho(s, t, d))
      uma('som:pousa', 0.58, () => { baque(s, t, p, 0.6); derrapa(s, t, p, 0.4) })
      break
    case 'carga':
      uma('som:guincho', 0.12, () => guincho(s, t, d))
      if (g.parou >= 0) uma('som:derrapa', 0, () => derrapa(s, t, p, GOLPE.carga.derrapa))
      break
    case 'finta':
      uma('som:sai', 0, () => espirro(s, t, p, 0.35, 0.3))
      uma('som:finta', 0.12, () => voz(s, { t, dur: 0.5, f: 720, f2: 1150, f3: 820, vogal: 'e', gain: 0.13, grit: 4, vib: [11, 40], r: 0.1, dest: d }))
      uma('som:volta', 0.78, () => mergulho(s, t, p))
      break
    case 'mergulhar': uma('som:entra', 0.21, () => mergulho(s, t, p)); uma('som:some', 0.62, () => espirro(s, t, p, 0.3, 0.18)); break
    case 'aviso': { // o chão estufa roncando e borbulha cada vez mais (como as bolhas de golpes.ts)
      uma('som:ronco', 0, () => ronco(s, t, p, g.dur))
      const w = Math.max(0, Math.min(1, (g.t - 0.25) / Math.max(0.4, g.dur - 0.35)))
      V.bolha -= dt
      if (V.bolha <= 0) { V.bolha = (0.8 + R() * 0.4) / (2 + 14 * w); bolha(s, t, p, 120 + R() * 260, 0.13) }
      break
    }
    case 'surgir': { // bolhas; o Luto rompe; as mãos tateiam (os dedos) e agarram o chão; o corpo sai escorrendo; a
      // cabeça sobe puxando o ar; o pescoço estala e ela guincha
      const T0 = LUTO.surgir.espera
      if (g.t > T0 - 0.8 && g.t < T0 + 0.4) { V.bolha -= dt; if (V.bolha <= 0) { V.bolha = 0.12 + R() * 0.1; bolha(s, t, p, 120 + R() * 260, 0.12) } }
      uma('som:rompe', T0, () => espirro(s, t, p, 0.4, 0.35))
      uma('som:dedos', T0 + 0.1, () => dedos(s, t, p))
      uma('som:agarra', T0 + 1.25, () => { espirro(s, t, p, 0.25, 0.25); pancada(s, t, 80, 0.25, p) })
      uma('som:escorre', T0 + 2.0, () => escorre(s, t, p))
      uma('som:ar', T0 + 2.4, () => puxaAr(s, t, d, 0.9, 0.09))
      uma('som:estala', T0 + 2.98, () => estaloPescoco(s, t, d, 1, false))
      uma('som:guincho', T0 + 3.28, () => guincho(s, t, d))
      break
    }
    case 'grito': uma('som:ar', 0, () => puxaAr(s, t, d, ESTADO.grito.puxa + 0.04, 0.12)); uma('som:grito', ESTADO.grito.puxa, () => gritoDaMae(s, t, d)); break
    case 'exausta': uma('som:ofego', 0, () => { for (let i = 0; i < 3; i++) ofega(s, t + i * 0.62, d, 1 + i * 0.15) }); break
    case 'atordoada': {
      const E = ESTADO.atordoada
      uma('som:golpe', 0, () => { grito(s, t, 0.45, 600, 820, 0.4, d); voz(s, { t, dur: 0.3, f: 520, f2: 380, vogal: 'e', gain: 0.18, grit: 4, vib: [12, 30], r: 0.08, dest: d }) })
      uma('som:joelhos', 0.6, () => baque(s, t, p))
      uma('som:baque', 0.62, () => voz(s, { t, dur: 0.22, f: 140, f2: 90, vogal: 'o', gain: 0.2, grit: 4, fry: 0.5, r: 0.1, dest: d }))
      // de joelhos, o rosto para o céu: o lamento e os soluços, no tranco de cada um (estados.ts: sin(t·5,2)^8)
      if (g.t < g.dur - E.estala) {
        uma('som:lamento1', 1.7, () => lamento(s, t, d, 0.2)); uma('som:lamento2', 3.4, () => lamento(s, t, d, 0.16))
        const k = Math.floor((g.t * 5.2 - Math.PI / 2) / (2 * Math.PI)), forca = 0.4 + 0.6 * Math.max(0, Math.sin(g.t * 0.9))
        if (g.t > 1.2 && k >= 0 && forca > 0.55) uma('som:soluco' + k, 0, () => soluca(s, t, d, forca))
      }
      uma('som:estalo', g.dur - E.estala, () => estaloPescoco(s, t, d, 1, false))
      uma('som:estala', g.dur - E.estala + 0.05, () => arRouco(s, t, d))
      break
    }
    case 'cambaleio': uma('som:cambaleio', 0, () => voz(s, { t, dur: 0.55, f: 190, f2: 115, vogal: 'o', gain: 0.3, grit: 4, fry: 0.6, fryHz: 32, r: 0.15, dest: d })); break
    case 'enfraquecida': // cai de joelhos, quase apagada: um gemido e o choro fraco
      uma('som:joelhos', 0.3, () => baque(s, t, p, 0.8))
      uma('som:enfraquece', 0.1, () => voz(s, { t, dur: 0.9, f: 260, f2: 160, vogal: 'u', gain: 0.14, grit: 2.5, vib: [6, 20], r: 0.4, dest: d }))
      if (g.t > 1.2) cada('choro', SOM.choroFraco, () => (R() < 0.5 ? soluca(s, t, d, 0.8) : lamento(s, t, d, 0.09)))
      break
    case 'levanta': // sai dos joelhos estalando
      uma('som:levanta', 0.15, () => ofega(s, t, d, 1.3))
      uma('som:estala1', 0.3, () => estaloPescoco(s, t, d, 0.5, false)); uma('som:estala2', 0.75, () => racha(s, t, 0.25, d))
      break
    case 'capturada': // presa: o grito e, por cima, guinchos desesperados
      uma('som:presa', 0, () => grito(s, t, 1.0, 560, 900, 0.45, d))
      if (g.t > 0.6) cada('guincho', SOM.guinchoPresa, () => guincho(s, t, d))
      break
  }
  // a fase 4: sussurros
  if (m.anim.preta > 0.5 && m.root.visible) cada('sussurro', SOM.sussurro, () => sussurro(s, t, 0.8 + R() * 1.2, 0.03, d))
}

/** Cala tudo dela (saiu de cena). */
export function pararSonsMae(m: Mae) {
  const s = som(), V = m.sons
  if (s && V.canto) pararCanto(s, V.canto)
  if (V.fonte) soltarFonte(V.fonte)
  if (V.chao) soltarFonte(V.chao)
  V.canto = null; V.fonte = null; V.chao = null
}
