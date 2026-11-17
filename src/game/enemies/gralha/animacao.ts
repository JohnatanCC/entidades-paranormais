// Os movimentos da Gralha (docs/cap2-sombra.md), feitos em código em cima das pastas do modelo (modelo.ts). Por enquanto
// só voar: o bater de asas, a descida mais rápida que a subida; a ponta bate mais e vem atrasada; o corpo sobe a cada
// descida e a cabeça fica quase parada no ar (como a de uma ave); ela deita para a frente quando anda e de lado nas
// curvas; de vez em quando plana. Pousar, olhar e atacar vêm depois.
// Quem move o root é quem a controla (a altura do voo, para onde ela vai).
import * as THREE from 'three'
import { animarMolas } from '../../corpo/molas'
import type { Gralha } from './modelo'
import { PLANAR, VOO } from './numeros'

const cl = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x))
const lerp = (a: number, b: number, k: number) => a + (b - a) * k
const damp = (cur: number, alvo: number, k: number, dt: number) => cur + (alvo - cur) * (1 - Math.exp(-k * dt))
const sorteio = (ab: readonly number[]) => ab[0] + Math.random() * (ab[1] - ab[0])
/** A asa numa fase da batida (0..1): desce rápido, sobe devagar; devolve de `cima` a `baixo`. */
const batida = (fase: number) => {
  const f = ((fase % 1) + 1) % 1, k = f < VOO.desce ? f / VOO.desce : 1 - (f - VOO.desce) / (1 - VOO.desce)
  return lerp(VOO.cima, VOO.baixo, 0.5 - 0.5 * Math.cos(k * Math.PI))
}

const _p = new THREE.Vector3(), _f = new THREE.Vector3(), _q = new THREE.Quaternion()

/** Um quadro da Gralha. */
export function animarGralha(g: Gralha, dt: number) {
  dt = Math.min(dt, 0.05)
  if (dt <= 0) return
  const A = g.anim
  A.t += dt
  // a velocidade dela (medida): para a frente e para o lado
  g.root.getWorldPosition(_p); g.root.getWorldQuaternion(_q)
  if (A.ultimo) {
    const yaw = Math.atan2(_f.set(0, 0, 1).applyQuaternion(_q).x, _f.z), vx = (_p.x - A.ultimo.x) / dt, vz = (_p.z - A.ultimo.z) / dt
    if (Math.hypot(vx, vz) < 30) {
      A.vel.x = damp(A.vel.x, vx * Math.sin(yaw) + vz * Math.cos(yaw), 6, dt)
      A.vel.z = damp(A.vel.z, vx * Math.cos(yaw) - vz * Math.sin(yaw), 6, dt)
    }
  }
  ;(A.ultimo ??= new THREE.Vector3()).copy(_p)
  // planar de vez em quando
  if (!A.planar && (A.proxPlanar -= dt) <= 0) A.planar = { t: 0, dura: sorteio(PLANAR.dura) }
  if (A.planar && (A.planar.t += dt) >= A.planar.dura) { A.planar = null; A.proxPlanar = sorteio(PLANAR.intervalo) }
  A.bate = damp(A.bate, A.planar ? 0 : 1, 5, dt)
  A.fase = (A.fase + (dt / VOO.periodo) * (0.25 + 0.75 * A.bate)) % 1
  // as asas: o giro em z levanta a ponta (o sinal troca de um lado para o outro)
  const asa = lerp(PLANAR.asas, batida(A.fase), A.bate), ponta = lerp(0.05, batida(A.fase - VOO.atraso) * VOO.ponta, A.bate)
  for (const a of g.asas) { a.asa.rotation.z = a.base + a.s * asa; a.ponta.rotation.z = a.basePonta + a.s * ponta }
  // o corpo sobe na descida das asas e deita com a velocidade; a cabeça compensa e fica quase parada
  const sobe = -Math.sin(A.fase * Math.PI * 2 + 0.6) * VOO.sobe * A.bate
  const inclina = cl(A.vel.x * VOO.inclina, -0.15, VOO.maxInclina) + Math.sin(A.fase * Math.PI * 2) * 0.05 * A.bate
  g.corpo.position.y = sobe
  g.corpo.rotation.x = inclina
  g.corpo.rotation.z = cl(-A.vel.z * VOO.deita, -0.5, 0.5)
  g.pescoco.rotation.x = g.base.pescoco - inclina * VOO.cabeca
  g.cauda.rotation.x = -Math.sin(A.fase * Math.PI * 2 + 0.6) * 0.12 * A.bate
  animarMolas(g.molas, g.root, dt)
}
