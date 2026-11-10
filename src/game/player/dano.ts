// Tomar dano e ficar machucado, no corpo (só a animação; sem sangue nem ferimento, a regra de 10/nov):
//   o tranco: um golpe joga o corpo para longe de onde veio (de frente, para trás; de lado, inclina) e ele volta;
//   machucado (30% da vida ou menos): curvado e inclinado para o lado, respirando pesado, mancando da perna direita
//   (o passo dela é mais curto: animacao.ts) e com a mão esquerda segurando o lado, quando ela está livre.
// Os números em numeros.ts (DANO).
import * as THREE from 'three'
import { alcancar } from './alcancar'
import type { Agente } from './modelo'
import { DANO } from './numeros'

/** t = s desde o último golpe; dir = de onde ele veio (no espaço do agente, rad: 0 = de frente, π/2 = da esquerda
 *  dele); ferido = o quanto o corpo está machucado (0..1, sobe e desce devagar). */
export interface AnimDano { t: number; dir: number; ferido: number }
export const novoDano = (): AnimDano => ({ t: 9, dir: 0, ferido: 0 })

const sm = (x: number) => { const k = Math.max(0, Math.min(1, x)); return k * k * (3 - 2 * k) }
const LADO = new THREE.Vector3(0.17, 0.1, 0.13), POLO = new THREE.Vector3(1, -0.6, -0.6) // a mão esquerda no lado da barriga

/** Um golpe: o tranco começa. dir = de onde veio (no espaço do agente). */
export function tranco(a: Agente, dir: number) { a.anim.dano.t = 0; a.anim.dano.dir = dir }

/** No começo do quadro: o relógio do tranco e o machucado chegando (ou passando). */
export function passoDoDano(a: Agente, ferido: boolean, dt: number) {
  const D = a.anim.dano
  D.t += dt
  D.ferido += ((ferido ? 1 : 0) - D.ferido) * (1 - Math.exp(-(ferido ? DANO.entra : DANO.sai) * dt))
}

/** O tronco machucado (depois dos braços, antes das armas): curvado, inclinado para a esquerda, a respiração pesada. */
export function troncoMachucado(a: Agente, tempo: number) {
  const k = a.anim.dano.ferido
  if (k < 0.001) return
  a.spine.rotation.x += 0.16 * k
  a.chest.rotation.x += (0.06 + 0.025 * Math.sin(tempo * 3.8)) * k // respira mais fundo e mais rápido
  a.chest.rotation.z -= 0.07 * k // para o lado que dói (a esquerda)
  a.head.rotation.x += 0.08 * k
}

/** A mão esquerda segurando o lado (depois das armas): livre = o quanto ela não está ocupada (bomba, mira, apontar). */
export function maoNoLado(a: Agente, livre: number) {
  const k = a.anim.dano.ferido * livre
  if (k > 0.001) alcancar(a.arms[1], LADO, POLO, k)
  return k
}

/** O tranco (por cima de tudo, até da mira): o corpo vai para longe do golpe, os braços abrem, afunda um pouco e volta. */
export function poseDoTranco(a: Agente) {
  const D = a.anim.dano, u = D.t / DANO.tranco
  if (u >= 1) return
  const f = u < 0.15 ? sm(u / 0.15) : 1 - sm((u - 0.15) / 0.85)
  const fx = Math.cos(D.dir) * f, fz = Math.sin(D.dir) * f // de frente / da esquerda dele
  a.spine.rotation.x -= 0.22 * fx; a.chest.rotation.x -= 0.15 * fx // de frente vai para trás; de costas, para a frente
  a.neck.rotation.x -= 0.2 * fx; a.head.rotation.x -= 0.3 * fx
  a.spine.rotation.z += 0.12 * fz; a.chest.rotation.z += 0.12 * fz; a.head.rotation.z += 0.15 * fz // de lado: inclina para o outro
  a.chest.rotation.y += 0.15 * fz
  for (const b of a.arms) b.up.rotation.z += b.s * 0.25 * f
  a.roll.position.y -= 0.04 * f
}

/** O tranco ainda está no começo (o rosto de dor)? */
export const doendo = (a: Agente) => a.anim.dano.t < DANO.tranco * 0.8
