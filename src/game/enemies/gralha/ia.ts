// O que a Gralha pensa (docs/cap2-sombra.md). Por enquanto só perseguir: voa até o alvo (o agente) e fica rodeando por
// cima dele, cada uma no seu lugar da roda, subindo e descendo. O ataque, pousar e olhar vêm depois.
// Quem a controla põe o root onde ela nasce e chama perseguir a cada quadro, antes de animarGralha.
import * as THREE from 'three'
import type { Gralha } from './modelo'
import { CACA } from './numeros'

export interface Cacadora { g: Gralha; t: number; lugar: number; vel: THREE.Vector3 }

/** Uma Gralha caçando, saindo de `de` com o empurrão `vel` (m/s); lugar = o ângulo dela na roda em volta do alvo (rad). */
export function novaCacadora(g: Gralha, de: THREE.Vector3, vel: THREE.Vector3, lugar: number): Cacadora {
  g.root.position.copy(de); g.anim.ultimo = null; g.molas.pos = null
  return { g, t: 0, lugar, vel: vel.clone() }
}

const _d = new THREE.Vector3()

/** Um quadro da perseguição. alvo = o agente (no mundo, nos pés). */
export function perseguir(c: Cacadora, alvo: THREE.Vector3, dt: number) {
  c.t += dt
  const r = c.g.root, a = c.lugar + c.t * CACA.roda
  // o ponto que ela quer: na roda em volta do alvo, na altura do voo
  _d.set(alvo.x + Math.sin(a) * CACA.raio, alvo.y + CACA.altura + Math.sin(c.t * 1.7 + c.lugar) * CACA.sobe, alvo.z + Math.cos(a) * CACA.raio).sub(r.position)
  const longe = _d.length()
  if (longe > 0.001) _d.multiplyScalar((Math.min(CACA.vel, longe * 3)) / longe) // perto do ponto, freia
  // a velocidade vira para o rumo aos poucos (não dá meia-volta no ar)
  c.vel.lerp(_d, 1 - Math.exp(-CACA.vira * dt))
  r.position.addScaledVector(c.vel, dt)
  if (c.vel.x * c.vel.x + c.vel.z * c.vel.z > 0.04) r.rotation.y = Math.atan2(c.vel.x, c.vel.z)
}
