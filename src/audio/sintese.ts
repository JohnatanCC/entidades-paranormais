// Os sons do jogo, sintetizados na hora (Web Audio, sem arquivos; portados do laboratório): as peças que todo
// personagem usa. ruido (sopro, pano, impacto, chiado), tom (oscilador com glissando), estalos (um trem deles: osso,
// garganta, madeira), pancada, racha, rangido, a voz (o pulso da garganta, as vogais, a aspereza), o grito e o sussurro.
// O navegador só libera o áudio depois de um clique ou tecla: o contexto nasce na primeira interação (prepararSom) e,
// até lá, som() devolve null e nada toca. A cadeia: tudo entra em `saida` (o volume Geral × Efeitos) → um passa-baixa
// e um corte nos agudos (menos "digital") → um compressor (segura os picos) → os alto-falantes. O eco é um cômodo de
// madeira (o impulso é ruído caindo); quem quer eco manda um pouco do som para `eco`.
import { aoMudarConfig, getSettings } from '../settings/settings'

export type Vogal = 'm' | 'u' | 'o' | 'a' | 'e' | 'i'
export interface Som { ctx: AudioContext; saida: GainNode; eco: ConvolverNode; ruido: AudioBuffer; glote: PeriodicWave }

let S: Som | null = null
const R = Math.random
const NIVEL = 0.55 // o volume dos efeitos no máximo (o compressor e os gritos sobrepostos pedem folga)
const nivel = () => { const c = getSettings(); return NIVEL * (c.volume / 100) * (c.efeitos / 100) }

function criar(): Som | null {
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AC) return null
  const ctx = new AC()
  const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 5; comp.attack.value = 0.003; comp.release.value = 0.2
  const saida = ctx.createGain(); saida.gain.value = nivel()
  const suave = ctx.createBiquadFilter(); suave.type = 'lowpass'; suave.frequency.value = 6500; suave.Q.value = 0.4
  const agudos = ctx.createBiquadFilter(); agudos.type = 'highshelf'; agudos.frequency.value = 2500; agudos.gain.value = -5
  saida.connect(suave); suave.connect(agudos); agudos.connect(comp); comp.connect(ctx.destination)
  // o eco: um cômodo de madeira (1,7 s de ruído caindo)
  const n = Math.floor(ctx.sampleRate * 1.7), ir = ctx.createBuffer(2, n, ctx.sampleRate)
  for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < n; i++) d[i] = (R() * 2 - 1) * Math.pow(1 - i / n, 3.2) }
  const eco = ctx.createConvolver(); eco.buffer = ir
  const molhado = ctx.createGain(); molhado.gain.value = 0.5; eco.connect(molhado); molhado.connect(saida)
  const ruido = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate), nd = ruido.getChannelData(0)
  for (let i = 0; i < nd.length; i++) nd[i] = R() * 2 - 1
  // o pulso da glote: harmônicos caindo devagar, os pares um pouco mais fracos (uma voz cansada)
  const H = 56, re = new Float32Array(H), im = new Float32Array(H)
  for (let k = 1; k < H; k++) im[k] = Math.pow(k, -1.25) * (k % 2 ? 1 : 0.72)
  const glote = ctx.createPeriodicWave(re, im)
  aoMudarConfig(() => saida.gain.setTargetAtTime(nivel(), ctx.currentTime, 0.05))
  return { ctx, saida, eco, ruido, glote }
}

/** Liga o som na primeira interação (o navegador exige) e o retoma se ele for suspenso. Chame uma vez, no começo. */
export function prepararSom() {
  const liga = () => { if (!S) S = criar(); else if (S.ctx.state === 'suspended') void S.ctx.resume() }
  addEventListener('pointerdown', liga); addEventListener('keydown', liga)
}

/** O som, se já estiver tocando (senão null: ninguém toca nada). */
export const som = (): Som | null => (S && S.ctx.state === 'running' ? S : null)

// ---------- as peças (t = quando, no relógio do áudio; dest = para onde vai) ----------
interface Envelope { t: number; dur: number; a?: number; r?: number; gain?: number; dest: AudioNode }

/** Um envelope: sobe em a, segura, cai em r (exponencial, até sumir). */
function vca(s: Som, dest: AudioNode, t0: number, a: number, pico: number, segura: number, r: number) {
  const g = s.ctx.createGain()
  g.gain.setValueAtTime(0.0001, t0); g.gain.linearRampToValueAtTime(pico, t0 + a)
  g.gain.setValueAtTime(pico, t0 + a + segura); g.gain.exponentialRampToValueAtTime(0.0001, t0 + a + segura + r)
  g.connect(dest); return g
}

export interface OpRuido extends Envelope { f?: number; f2?: number; q?: number; tipo?: BiquadFilterType }
/** Ruído filtrado: sopro, pano, impacto, chiado (f → f2: o filtro desliza). */
export function ruido(s: Som, o: OpRuido) {
  const a = o.a ?? 0.004, r = o.r ?? 0.08
  const src = s.ctx.createBufferSource(); src.buffer = s.ruido; src.loop = true
  const f = s.ctx.createBiquadFilter(); f.type = o.tipo ?? 'bandpass'; f.frequency.setValueAtTime(o.f ?? 1000, o.t); f.Q.value = o.q ?? 1
  if (o.f2) f.frequency.exponentialRampToValueAtTime(o.f2, o.t + o.dur)
  const g = vca(s, o.dest, o.t, a, o.gain ?? 0.2, Math.max(0, o.dur - a), r)
  src.connect(f); f.connect(g); src.start(o.t, R() * 1.5); src.stop(o.t + o.dur + r + 0.05)
}

export interface OpTom extends Envelope { f: number; f2?: number; tipo?: OscillatorType; lp?: number }
/** Um oscilador com glissando (f → f2). */
export function tom(s: Som, o: OpTom) {
  const a = o.a ?? 0.004, r = o.r ?? 0.1
  const osc = s.ctx.createOscillator(); osc.type = o.tipo ?? 'sine'; osc.detune.value = (R() - 0.5) * 10
  osc.frequency.setValueAtTime(o.f, o.t); if (o.f2) osc.frequency.exponentialRampToValueAtTime(o.f2, o.t + o.dur)
  let no: AudioNode = osc
  const lp = o.lp ?? (osc.type !== 'sine' ? 2600 : 0)
  if (lp) { const f = s.ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = lp; osc.connect(f); no = f }
  no.connect(vca(s, o.dest, o.t, a, o.gain ?? 0.2, Math.max(0, o.dur - a), r)); osc.start(o.t); osc.stop(o.t + o.dur + r + 0.05)
}

export interface OpEstalos { t: number; n: number; i0: number; i1: number; f: number; q?: number; gain?: number; r?: number; forma?: (u: number) => number; dest: AudioNode }
/** Um trem de estalos (osso, garganta molhada, madeira): o intervalo vai de i0 a i1; forma = a força ao longo dele. */
export function estalos(s: Som, o: OpEstalos) {
  let t = o.t
  for (let k = 0; k < o.n; k++) {
    const u = k / Math.max(1, o.n - 1)
    ruido(s, { t, dur: 0.002, a: 0.0008, r: o.r ?? 0.018, f: o.f * (1 + (R() - 0.5) * 0.3), q: o.q ?? 6, gain: (o.gain ?? 0.1) * (0.6 + R() * 0.4) * (o.forma ? o.forma(u) : 1), dest: o.dest })
    t += (o.i0 + (o.i1 - o.i0) * u) * (0.75 + R() * 0.5)
  }
}

/** A pancada: um baque grave e curto (o pé, o joelho, o corpo no chão). */
export function pancada(s: Som, t: number, f: number, gain: number, dest: AudioNode) {
  tom(s, { t, f, f2: f * 0.55, dur: 0.09, r: 0.12, gain, lp: 300, dest })
  ruido(s, { t, dur: 0.03, tipo: 'lowpass', f: 600, gain: gain * 0.35, r: 0.05, dest })
}
/** A racha: estalos secos de osso (ou madeira) e um toque grave. */
export function racha(s: Som, t: number, gain: number, dest: AudioNode) {
  estalos(s, { t, n: 6 + ((R() * 6) | 0), i0: 0.012, i1: 0.004, f: 2200, q: 3, gain, dest })
  tom(s, { t, f: 140, f2: 70, dur: 0.03, gain: gain * 0.6, lp: 400, dest })
}
/** O rangido: a madeira cedendo (estalos que crescem e somem). */
export function rangido(s: Som, t: number, gain: number, dest: AudioNode) {
  estalos(s, { t, n: 18 + ((R() * 22) | 0), i0: 0.03 + R() * 0.02, i1: 0.012, f: 350 + R() * 400, q: 9, gain, r: 0.03, forma: (u) => Math.sin(u * Math.PI), dest })
}

// os formantes (F1, F2, F3: a frequência, o Q e o peso) de cada vogal
const VOGAIS: Record<Vogal, [number, number, number][]> = {
  m: [[280, 6, 1], [950, 9, 0.18], [2500, 8, 0.04]], u: [[330, 6, 0.9], [820, 7, 0.32], [2350, 8, 0.08]], o: [[480, 5, 1], [900, 6, 0.45], [2550, 8, 0.12]],
  a: [[760, 4, 1], [1220, 5, 0.6], [2650, 7, 0.28]], e: [[520, 5, 1], [1850, 7, 0.55], [2650, 8, 0.3]], i: [[310, 6, 1], [2250, 8, 0.5], [3000, 9, 0.32]],
}
export type Formantes = { b: BiquadFilterNode; g: GainNode }[] & { sc: number }
/** Os filtros de uma vogal entre src e dest (sc escala: > 1 é garganta pequena, < 1 é garganta enorme). */
export function formantes(s: Som, src: AudioNode, dest: AudioNode, v: Vogal, sc = 1): Formantes {
  const fs = VOGAIS[v].map(([f, q, g]) => {
    const b = s.ctx.createBiquadFilter(); b.type = 'bandpass'; b.frequency.value = f * sc; b.Q.value = q
    const gg = s.ctx.createGain(); gg.gain.value = g * 3; src.connect(b); b.connect(gg); gg.connect(dest)
    return { b, g: gg }
  }) as Formantes
  fs.sc = sc
  return fs
}
/** Troca a vogal (a boca muda de forma em tc s). */
export function mudarVogal(fs: Formantes, v: Vogal, t: number, tc = 0.08) {
  VOGAIS[v].forEach(([f, , g], i) => { fs[i].b.frequency.setTargetAtTime(f * fs.sc, t, tc); fs[i].g.gain.setTargetAtTime(g * 3, t, tc) })
}

/** A curva da saturação (a aspereza da voz). */
export function curva(k: number) { const c = new Float32Array(1024); for (let i = 0; i < 1024; i++) { const x = i / 511.5 - 1; c[i] = Math.tanh(k * x) / Math.tanh(k) } return c }

export interface OpVoz extends Envelope {
  f: number; f2?: number; f3?: number; glide?: number // a nota: f → f2 (em glide s) → f3 (no fim)
  vogal?: Vogal; vogal2?: Vogal; sc?: number // a vogal, a que vem depois, o tamanho da garganta
  grit?: number; camadas?: [number, number, number][] // a aspereza; [múltiplo da nota, desafino (cents), peso] de cada voz junta
  vib?: [number, number]; wob?: number // o vibrato [Hz, cents×]; o quanto a nota treme sozinha
  ring?: [number, number]; fry?: number; fryHz?: number; ar?: number // metálico; a voz rouca (pulsando); o ar junto
}
/** Uma voz curta (garganta, gemido, grito): o pulso da glote com tremor, saturado, pelas vogais. */
export function voz(s: Som, o: OpVoz) {
  const { ctx } = s, t = o.t, dur = o.dur, r = o.r ?? 0.12
  const g = vca(s, o.dest, t, o.a ?? 0.03, o.gain ?? 0.1, dur, r)
  const sat = ctx.createWaveShaper(); sat.curve = curva(o.grit ?? 2)
  const pre = ctx.createGain(); pre.gain.value = 0.6
  const fs = formantes(s, sat, g, o.vogal ?? 'a', o.sc ?? 1)
  if (o.vogal2) mudarVogal(fs, o.vogal2, t + dur * 0.4, dur * 0.3)
  const glide = o.glide ?? dur * 0.4
  for (const [k, det, peso] of o.camadas ?? [[1, 0, 1]]) {
    const osc = ctx.createOscillator(); osc.setPeriodicWave(s.glote); osc.detune.value = det + (R() - 0.5) * 8
    osc.frequency.setValueAtTime(o.f * k, t)
    if (o.f2) osc.frequency.exponentialRampToValueAtTime(o.f2 * k, t + glide)
    if (o.f3) osc.frequency.exponentialRampToValueAtTime(o.f3 * k, t + dur)
    // a voz não fica parada
    for (let j = 1; j < 8; j++) osc.frequency.setTargetAtTime((o.f3 ?? o.f2 ?? o.f) * k * (1 + (R() - 0.5) * (o.wob ?? 0.06)), t + glide + (j * dur) / 9, 0.02)
    const pg = ctx.createGain(); pg.gain.value = peso; osc.connect(pg); pg.connect(pre)
    if (o.vib) { const v = ctx.createOscillator(), vg = ctx.createGain(); v.frequency.value = o.vib[0]; vg.gain.value = o.vib[1] * k; v.connect(vg); vg.connect(osc.frequency); v.start(t); v.stop(t + dur + 0.3) }
    osc.start(t); osc.stop(t + dur + r + 0.05)
  }
  let src: AudioNode = pre
  if (o.ring) { // modulação na voz: soa metálico, nada humano
    const rm = ctx.createGain(); rm.gain.value = 1 - o.ring[1]
    const ro = ctx.createOscillator(); ro.frequency.value = o.ring[0]; const rg = ctx.createGain(); rg.gain.value = o.ring[1]
    ro.connect(rg); rg.connect(rm.gain); pre.connect(rm); src = rm; ro.start(t); ro.stop(t + dur + 0.3)
  }
  if (o.fry) { // a voz rouca: o volume pulsa num quadrado lento
    const am = ctx.createGain(); am.gain.value = 1 - o.fry
    const fo = ctx.createOscillator(); fo.type = 'square'; fo.frequency.value = o.fryHz ?? 36; const fg = ctx.createGain(); fg.gain.value = o.fry
    fo.connect(fg); fg.connect(am.gain); src.connect(am); am.connect(sat); fo.start(t); fo.stop(t + dur + 0.3)
  } else src.connect(sat)
  if (o.ar) ruido(s, { t, dur, a: 0.02, r: 0.08, f: 1600, q: 0.8, gain: (o.gain ?? 0.1) * o.ar, dest: o.dest })
}

/** O grito: três vozes ásperas (serra), as vogais de "a", o vibrato nervoso; sobe de f0 a f1 e oscila sem degraus. */
export function grito(s: Som, t: number, dur: number, f0: number, f1: number, gain: number, dest: AudioNode) {
  const { ctx } = s, g = vca(s, dest, t, 0.06, gain, dur, 0.05)
  const mix = ctx.createGain(); mix.gain.value = 0.6
  for (const [f, q] of [[850, 3], [1250, 4], [2700, 5]]) { const b = ctx.createBiquadFilter(); b.type = 'bandpass'; b.frequency.value = f; b.Q.value = q; mix.connect(b); b.connect(g) }
  const vib = ctx.createOscillator(), vg = ctx.createGain(); vib.frequency.value = 8.5; vg.gain.value = 22; vib.connect(vg)
  for (const k of [1, 1.012, 1.5]) {
    const o = ctx.createOscillator(); o.type = 'sawtooth'
    o.frequency.setValueAtTime(f0 * k, t); o.frequency.exponentialRampToValueAtTime(f1 * k, t + 0.35)
    for (let j = 1; j < 10; j++) o.frequency.linearRampToValueAtTime(f1 * k * (1 + (R() - 0.5) * 0.05), t + 0.35 + (j * dur) / 10)
    vg.connect(o.frequency); o.connect(mix); o.start(t); o.stop(t + dur + 0.2)
  }
  vib.start(t); vib.stop(t + dur + 0.2)
  ruido(s, { t, dur, a: 0.05, f: 3200, q: 1, gain: gain * 0.35, r: 0.05, dest })
}

/** O sussurro: o ar passando pelas vogais e pelos "s" (parece uma frase que quase dá para entender). */
export function sussurro(s: Som, t: number, dur: number, gain: number, dest: AudioNode) {
  const src = s.ctx.createBufferSource(); src.buffer = s.ruido; src.loop = true
  const g = s.ctx.createGain(); g.gain.value = 0.0001; g.connect(dest)
  const fs = formantes(s, src, g, 'e', 1.05), V: Vogal[] = ['a', 'e', 'i', 'o', 'u']
  let u = t
  while (u < t + dur) {
    const l = 0.07 + R() * 0.13
    mudarVogal(fs, V[(R() * 5) | 0], u, 0.02); g.gain.setTargetAtTime(gain * 3 * (0.6 + R() * 0.6), u, 0.015); g.gain.setTargetAtTime(0.0001, u + l * 0.8, 0.02)
    if (R() < 0.35) ruido(s, { t: u + l * 0.7, dur: 0.05 + R() * 0.06, a: 0.01, r: 0.03, tipo: 'highpass', f: 4800, gain: gain * 0.7, dest }) // o "s"
    u += l + (R() < 0.25 ? 0.12 + R() * 0.15 : 0.02)
  }
  src.start(t); src.stop(u + 0.2)
}
