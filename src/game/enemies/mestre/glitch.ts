// O tiro no Mestre (18/nov, a pedido): a bala passa por ele (é sombra) e não o para, mas ele "falha" como uma imagem com
// defeito: por um instante o corpo pula de lado aos trancos, estica e encolhe na largura e some por um quadro, com um
// chiado de estalos. Só mexe no que a animação refaz (o quadril e a escala do root), e devolve tudo no fim.
import * as THREE from 'three'
import { estalos, ruido, type Som } from '../../../audio/sintese'
import { somEm } from '../sons'
import type { Mestre } from './modelo'
import { GLITCH } from './numeros'

interface Falha { t: number; troca: number; dx: number; dz: number; larg: number; some: boolean }
const falhas = new WeakMap<Mestre, Falha>()

/** O chiado: estalos agudos bem juntos e um ruído curto, como um sinal que corta. */
function chiado(s: Som, t: number, d: AudioNode) {
  estalos(s, { t, n: 9, i0: 0.012, i1: 0.03, f: 3200, q: 3, gain: 0.12, dest: d })
  ruido(s, { t, dur: 0.12, f: 5200, q: 1.2, gain: 0.05, dest: d })
  return 0.3
}

const _p = new THREE.Vector3()
/** A bala passou por ele: começa (ou estica) a falha. */
export function glitchar(m: Mestre) {
  const F = falhas.get(m)
  if (F) { F.t = Math.max(F.t, GLITCH.dura * 0.6); return }
  falhas.set(m, { t: GLITCH.dura, troca: 0, dx: 0, dz: 0, larg: 1, some: false })
  somEm(m.peito.getWorldPosition(_p), chiado, 3)
}

/** Antes de animar: tira o tranco do quadro anterior (a animação refaz o resto). */
export function antesDoGlitch(m: Mestre) {
  const F = falhas.get(m)
  if (F) { m.quadril.position.x -= F.dx; m.quadril.position.z -= F.dz }
}

/** Depois de animar: o tranco deste quadro (troca algumas vezes por segundo, aos saltos, sem suavizar). */
export function passoGlitch(m: Mestre, dt: number) {
  const F = falhas.get(m)
  if (!F) return
  F.t -= dt; F.troca -= dt
  if (F.t <= 0) { m.root.scale.set(1, 1, 1); m.root.visible = true; falhas.delete(m); return }
  if (F.troca <= 0) {
    F.troca = 1 / GLITCH.trocas
    const k = F.t / GLITCH.dura // começa forte e vai acalmando
    F.dx = (Math.random() * 2 - 1) * GLITCH.pulo * k; F.dz = (Math.random() * 2 - 1) * GLITCH.pulo * 0.4 * k
    F.larg = 1 + (Math.random() * 2 - 1) * GLITCH.estica * k
    F.some = Math.random() < GLITCH.some
  }
  m.quadril.position.x += F.dx; m.quadril.position.z += F.dz
  m.root.scale.set(F.larg, 1, 2 - F.larg)
  m.root.visible = !F.some
}
