// O que a Gralha pensa (docs/cap2-sombra.md): perseguir e atacar. Voa até o alvo (o agente) e fica rodeando por cima
// dele, cada uma no seu lugar da roda, subindo e descendo; de tempos em tempos uma mergulha no alvo, bica e volta para
// a roda. Pousar e olhar vêm depois.
// Quem a controla põe o root onde ela nasce e chama perseguir a cada quadro, antes de animarGralha (que diz se bicou).
import * as THREE from 'three'
import { atacar, parteDoAtaque } from './animacao'
import type { Gralha } from './modelo'
import { ATAQUE, CACA } from './numeros'

export interface Cacadora { g: Gralha; t: number; lugar: number; vel: THREE.Vector3; prox: number }

/** Uma Gralha caçando, saindo de `de` com o empurrão `vel` (m/s); lugar = o ângulo dela na roda em volta do alvo (rad);
 *  ataca = em quantos s dá o primeiro mergulho (cada uma no seu tempo: nunca todas juntas). */
export function novaCacadora(g: Gralha, de: THREE.Vector3, vel: THREE.Vector3, lugar: number, ataca = ATAQUE.espera[0] + Math.random() * 2): Cacadora {
  g.root.position.copy(de); g.anim.ultimo = null; g.molas.pos = null; g.anim.ataque = null
  return { g, t: 0, lugar, vel: vel.clone(), prox: ataca }
}

const _d = new THREE.Vector3()

/** Um quadro da perseguição. alvo = o agente (no mundo, nos pés). */
export function perseguir(c: Cacadora, alvo: THREE.Vector3, dt: number) {
  c.t += dt
  const r = c.g.root, a = c.lugar + c.t * CACA.roda, parte = parteDoAtaque(c.g)
  let vel = CACA.vel, vira = CACA.vira
  if (parte === 'mergulha') { // reto para o peito do alvo, depressa
    _d.set(alvo.x, alvo.y + ATAQUE.altura, alvo.z).sub(r.position); vel = ATAQUE.vel; vira = ATAQUE.vira
  } else {
    // o ponto que ela quer: na roda em volta do alvo, na altura do voo
    _d.set(alvo.x + Math.sin(a) * CACA.raio, alvo.y + CACA.altura + Math.sin(c.t * 1.7 + c.lugar) * CACA.sobe, alvo.z + Math.cos(a) * CACA.raio).sub(r.position)
    // na roda e na hora: ataca (o aviso primeiro; o mergulho vem depois)
    if (!parte && (c.prox -= dt) <= 0 && _d.length() < ATAQUE.perto) { atacar(c.g); c.prox = ATAQUE.espera[0] + Math.random() * (ATAQUE.espera[1] - ATAQUE.espera[0]) }
  }
  const longe = _d.length()
  if (longe > 0.001) _d.multiplyScalar(Math.min(vel, parte === 'mergulha' ? vel : longe * 3) / longe) // perto do ponto, freia
  // a velocidade vira para o rumo aos poucos (não dá meia-volta no ar)
  c.vel.lerp(_d, 1 - Math.exp(-vira * dt))
  r.position.addScaledVector(c.vel, dt)
  if (c.vel.x * c.vel.x + c.vel.z * c.vel.z > 0.04) r.rotation.y = Math.atan2(c.vel.x, c.vel.z)
}
