// Os sons do lugar na Demo · Intro (docs/intro.md), sintetizados na hora (audio/sintese.ts), sem arquivos:
//   o ambiente do submundo (em volta, sem lugar): o vento grave sem parar, roncos distantes de vez em quando e, raro,
//     um gemido longe (as almas) e um sussurro;
//   o tornado (no lugar dele, game/enemies/sons.ts): forma com um estrondo e um sopro subindo, e venta enquanto está de pé.
// A música do chefe ("O devorador de almas") é arquivo: audio/musica.ts.
import * as THREE from 'three'
import { ruido, som, sussurro, tom, voz, type Som } from '../../audio/sintese'
import { sorteio, vozDe } from '../../game/enemies/sons'
import type { Tornado } from './tornado'

/** Os relógios do ambiente (s até o próximo de cada um). */
export interface Ambiente { vento: number; ronco: number; gemido: number; sussurro: number }
export const novoAmbiente = (): Ambiente => ({ vento: 0, ronco: sorteio(3, 6), gemido: sorteio(8, 14), sussurro: sorteio(15, 25) })

function vento(s: Som, t: number, d: AudioNode) { // um pedaço do vento: longo, entra e sai devagar (um cobre o outro)
  const f = sorteio(180, 320)
  ruido(s, { t, dur: 4.2, a: 1.6, r: 1.6, tipo: 'lowpass', f, f2: f * sorteio(0.7, 1.5), q: 0.7, gain: 0.07, dest: d })
  ruido(s, { t: t + 0.5, dur: 3.4, a: 1.4, r: 1.4, f: sorteio(500, 900), q: 3, gain: 0.012, dest: d }) // o assobio
}
function ronco(s: Som, t: number, d: AudioNode) { // longe, a rocha rangendo e caindo no vazio
  tom(s, { t, f: 42, f2: 30, dur: 2.2, a: 0.5, r: 1, gain: 0.08, dest: d })
  ruido(s, { t, dur: 2.2, a: 0.4, r: 1, tipo: 'lowpass', f: 160, gain: 0.1, dest: d })
}
function gemido(s: Som, t: number, d: AudioNode) { // uma alma, bem longe (passa pelo eco)
  voz(s, { t, dur: 2.4, a: 0.8, r: 1, f: sorteio(140, 200), f2: sorteio(100, 130), glide: 1.8, vogal: 'o', vogal2: 'u', grit: 1.2, ar: 0.9, vib: [4, 20], gain: 0.025, dest: d })
}

/** A cada quadro, enquanto a fase está aberta: o vento, os roncos, os gemidos e os sussurros do submundo. */
export function passoAmbiente(A: Ambiente, dt: number) {
  const s = som()
  if (!s) return
  const t = s.ctx.currentTime, d = s.saida
  if ((A.vento -= dt) <= 0) { vento(s, t, d); A.vento = sorteio(2.6, 3.2) }
  if ((A.ronco -= dt) <= 0) { ronco(s, t, d); A.ronco = sorteio(7, 13) }
  if ((A.gemido -= dt) <= 0) { gemido(s, t, s.eco); A.gemido = sorteio(12, 22) }
  if ((A.sussurro -= dt) <= 0) { sussurro(s, t, 1.6, 0.02, s.eco); A.sussurro = sorteio(20, 35) }
}

// ---------- o tornado ----------
const ventos = new WeakMap<Tornado, { forca: number; prox: number }>()
const _p = new THREE.Vector3()

/** Depois de passoTornado: forma com um estrondo; de pé, venta (do lugar dele). */
export function ouvirTornado(o: Tornado, dt: number) {
  let b = ventos.get(o)
  if (!b) { b = { forca: o.forca, prox: 0 }; ventos.set(o, b) }
  const v = o.forca > 0 || b.forca > 0 ? vozDe(o, _p.copy(o.p).setY(o.p.y + 2), 3) : null
  if (v) {
    const { s, d, t } = v
    if (o.quer && b.forca === 0 && o.forca > 0) { // formando: o estrondo e o sopro subindo
      tom(s, { t, f: 50, f2: 32, dur: 0.5, r: 0.6, gain: 0.25, lp: 140, dest: d })
      ruido(s, { t, dur: 1.2, a: 0.1, r: 0.5, f: 200, f2: 1400, q: 0.7, gain: 0.25, dest: d })
    }
    if (o.forca > 0.3 && (b.prox -= dt) <= 0) { // de pé: o vento rodando
      ruido(s, { t, dur: 1.8, a: 0.5, r: 0.7, f: sorteio(300, 500), f2: sorteio(500, 900), q: 1.2, gain: 0.14 * o.forca, dest: d })
      ruido(s, { t, dur: 1.8, a: 0.5, r: 0.7, tipo: 'lowpass', f: 140, gain: 0.12 * o.forca, dest: d })
      b.prox = 1.3
    }
  }
  b.forca = o.forca
}
