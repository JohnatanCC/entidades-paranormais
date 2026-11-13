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

// ---------- desviar dos obstáculos (12/nov) ----------
// Antes de ir até um ponto, ele olha o caminho à frente: livre, vai reto; com uma parede, um objeto, uma pedra ou a
// beirada no caminho, escolhe o primeiro rumo livre para um dos lados (abrindo aos poucos) e fica nesse lado por um
// tempo (não fica indeciso entre os dois). Olha a cada OLHAR.cada s (não a cada quadro: são vários no bando).
const OLHAR = { longe: 1.8, angulos: [0.45, 0.9, 1.35, 1.8, 2.3], cada: 0.2, mantem: 1.2 }
interface Rumo { t: number; lado: number; manter: number; ang: number | null }
const rumos = new WeakMap<THREE.Object3D, Rumo>()
const _o = { x: 0, z: 0 }

/** O caminho de (x, z) na direção `ang` até `dist` m está livre (sem caixa e, se `chao`, com chão)? y = a altura dos pés. */
function livre(m: Mundo, x: number, z: number, ang: number, dist: number, y: number, r: number, chao: boolean) {
  for (const f of [0.35, 0.7, 1]) {
    const px = x + Math.sin(ang) * dist * f, pz = z + Math.cos(ang) * dist * f
    _o.x = px; _o.z = pz
    empurrar(m, _o, y, r)
    if (Math.hypot(_o.x - px, _o.z - pz) > 0.02) return false
    if (chao && !temChao(m, px, pz, y)) return false
  }
  return true
}

/**
 * Para onde ir, indo até (x, z) sem bater: o próprio ponto, se o caminho está livre; senão, um ponto à frente no
 * primeiro rumo livre para o lado. Devolve em `out`. y = a altura dos pés (a Asa, a do corpo dela); chao = precisa de
 * chão embaixo (quem anda; quem voa, não).
 */
export function rumoLivre(raiz: THREE.Object3D, x: number, z: number, m: Mundo, r: number, dt: number, out: { x: number; z: number }, y = raiz.position.y, chao = true) {
  const P = raiz.position, quer = Math.atan2(x - P.x, z - P.z), dist = Math.min(OLHAR.longe, Math.hypot(x - P.x, z - P.z))
  let R = rumos.get(raiz)
  if (!R) { R = { t: 0, lado: Math.random() < 0.5 ? -1 : 1, manter: 0, ang: null }; rumos.set(raiz, R) }
  R.t -= dt; R.manter -= dt
  if (R.t <= 0) {
    R.t = OLHAR.cada
    if (dist < 0.3 || livre(m, P.x, P.z, quer, dist, y, r, chao)) R.ang = null // reto
    else {
      if (R.manter <= 0) { // escolhe o lado mais livre (o primeiro que abre), e fica nele um tempo
        const abre = (lado: number) => OLHAR.angulos.findIndex((a) => livre(m, P.x, P.z, quer + lado * a, OLHAR.longe, y, r, chao))
        const e = abre(-1), d = abre(1)
        R.lado = e < 0 ? 1 : d < 0 ? -1 : e < d ? -1 : d < e ? 1 : R.lado
        R.manter = OLHAR.mantem
      }
      const i = OLHAR.angulos.findIndex((a) => livre(m, P.x, P.z, quer + R!.lado * a, OLHAR.longe, y, r, chao))
      R.ang = quer + R.lado * OLHAR.angulos[i < 0 ? OLHAR.angulos.length - 1 : i]
    }
  }
  if (R.ang === null) { out.x = x; out.z = z } else { out.x = P.x + Math.sin(R.ang) * 2; out.z = P.z + Math.cos(R.ang) * 2 }
  return out
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
