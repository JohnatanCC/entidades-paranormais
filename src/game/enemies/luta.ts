// O que a inteligência dos Sombrios divide (a luta, docs/demonios.md: "Como lutam"): o alvo (o agente, pelo controle
// que a fase dá: quem ataca fere por ele), andar no mundo (bate nas paredes e nos objetos e não sai da beirada) e virar
// para um ponto sem passar dele. Cada um pensa no ia.ts da pasta dele.
import * as THREE from 'three'
import { empurrar, temChao, type Mundo } from '../world/colisao'

/** O agente, para quem ataca: onde estão os pés, se pode levar golpe (de pé, fora da barriga) e o que fazer com ele. */
export interface Alvo {
  p: THREE.Vector3
  pode: () => boolean
  ferir: (dano: number, de: THREE.Vector3, sempre?: boolean) => boolean
  engolir: () => void
  cuspir: (onde: THREE.Vector3, de: THREE.Vector3) => void
  lentidao: (quanto: number, dura: number) => void
}

export const sorteado = ([a, b]: readonly number[]) => a + Math.random() * (b - a)
export const ateAlvo = (raiz: THREE.Object3D, p: THREE.Vector3) => Math.hypot(p.x - raiz.position.x, p.z - raiz.position.z)

/** O ângulo (rad, −π..π) entre a frente da raiz e a direção até (x, z). */
export function anguloAte(raiz: THREE.Object3D, x: number, z: number) {
  const d = Math.atan2(x - raiz.position.x, z - raiz.position.z) - raiz.rotation.y
  return Math.atan2(Math.sin(d), Math.cos(d))
}

/** Vira a raiz para (x, z), no máximo `vel` rad/s. Devolve o quanto ainda falta (rad). */
export function girarPara(raiz: THREE.Object3D, x: number, z: number, vel: number, dt: number) {
  const d = anguloAte(raiz, x, z), passo = Math.sign(d) * Math.min(Math.abs(d), vel * dt)
  raiz.rotation.y += passo
  return d - passo
}

const _p = { x: 0, z: 0 }
/** Anda `dist` m para a frente da raiz no chão: bate nas paredes e nos objetos (raio r) e para na beirada. */
export function andarNoMundo(raiz: THREE.Object3D, dist: number, mundo: Mundo, r: number) {
  if (Math.abs(dist) < 1e-5) return
  const P = raiz.position, ox = P.x, oz = P.z
  _p.x = ox + Math.sin(raiz.rotation.y) * dist; _p.z = oz + Math.cos(raiz.rotation.y) * dist
  empurrar(mundo, _p, 0, r)
  if (!temChao(mundo, _p.x, _p.z, 0)) { if (temChao(mundo, _p.x, oz, 0)) _p.z = oz; else if (temChao(mundo, ox, _p.z, 0)) _p.x = ox; else { _p.x = ox; _p.z = oz } }
  P.x = _p.x; P.z = _p.z
}

/** Os que andam juntos não se atravessam: cada par mais perto que `min` m se afasta (metade cada um). */
export function separar(raizes: THREE.Object3D[], min: number) {
  for (let i = 0; i < raizes.length; i++) for (let k = i + 1; k < raizes.length; k++) {
    const a = raizes[i].position, b = raizes[k].position, dx = b.x - a.x, dz = b.z - a.z, d = Math.hypot(dx, dz)
    if (d >= min || d < 1e-4) continue
    const f = (min - d) / 2 / d
    a.x -= dx * f; a.z -= dz * f; b.x += dx * f; b.z += dz * f
  }
}
