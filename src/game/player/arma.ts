// A arma na mão direita do agente: só o modelo e como a mão segura (atirar, a sobrecarga e a armadilha jogada vêm na
// etapa das armas). O modelo é modelos/armas/<nome>.bbmodel; a pasta "empunhadura" dele é o ponto que vai na mão.
// O espaço da mão direita (o do modelo do agente): os dedos para −y, a palma para +z, o polegar para −x.
// A armadilha vai pendurada pela alça e balança (animarArma); os números em numeros.ts (ARMADILHA).
import * as THREE from 'three'
import { arma3d } from '../../render/objetos3d'
import type { PoseMao } from './maos'
import type { Agente } from './modelo'
import { ARMADILHA } from './numeros'

export type Arma = 'pistola' | 'escopeta' | 'armadilha'
export const ARMAS: [Arma, string][] = [['pistola', 'Pistola de Demantino'], ['escopeta', 'Escopeta de sal grosso'], ['armadilha', 'Armadilha']]
/** A pose da mão que segura cada uma: a pistola com o indicador fora do gatilho (a escopeta ganha o mesmo no parado dela). */
export const POSE_DA_ARMA: Record<Arma, PoseMao> = { pistola: 'guarda', escopeta: 'segurar', armadilha: 'segurar' }

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z)
// como cada uma fica na mão: onde a empunhadura cai (no espaço da mão) e o giro da arma
//   pistola e escopeta: o cano segue os dedos (−y), o cabo desce para o lado do mínimo (+x), a palma encosta do lado +x da arma
//   armadilha: pendurada pela alça, presa nos dedos
const DE_ARMA = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(V(0, 0, 1), V(-1, 0, 0), V(0, -1, 0)))
const PEGA: Record<Arma, { ponto: THREE.Vector3; giro: THREE.Quaternion }> = {
  pistola: { ponto: V(0.004, -0.06, 0.042), giro: DE_ARMA },
  escopeta: { ponto: V(0.004, -0.06, 0.042), giro: DE_ARMA },
  armadilha: { ponto: V(0, -0.085, 0.03), giro: new THREE.Quaternion() },
}
const NOME = '#arma'
const _inv = new THREE.Quaternion()

/** O giro que a mão precisa ter para a arma ficar com o giro qArma (os dois no mesmo espaço). Os gestos usam. */
export const maoParaArma = (nome: Arma, qArma: THREE.Quaternion, out: THREE.Quaternion) => out.copy(qArma).multiply(_inv.copy(PEGA[nome].giro).invert())

/** Põe a arma na mão direita (null = mão vazia). A animação lê a.arma para a pose (guarda, a mão fechada). */
export function pegarArma(a: Agente, nome: Arma | null) {
  const mao = a.arms[0].hd
  const velha = mao.getObjectByName(NOME)
  if (velha) { mao.remove(velha); (velha.userData.luz as THREE.Material | undefined)?.dispose() }
  a.arma = nome; a.anim.lanterna.solta = true
  if (!nome) return
  const obj = arma3d(nome), p = PEGA[nome]
  // a empunhadura do modelo vai para a origem do grupo (que fica no ponto da mão)
  obj.updateMatrixWorld(true)
  const pega = obj.getObjectByName('empunhadura')
  if (pega) obj.position.copy(pega.getWorldPosition(new THREE.Vector3())).negate()
  const g = new THREE.Group(); g.name = NOME
  g.position.copy(p.ponto); g.quaternion.copy(p.giro)
  // o vidro da armadilha "respira": um material só desta cópia (os outros modelos da armadilha não piscam junto)
  const luz = nome === 'armadilha' ? (obj.getObjectByName('#luz') as THREE.Mesh | undefined) : undefined
  if (luz) { luz.material = (luz.material as THREE.MeshBasicMaterial).clone(); g.userData.luz = luz.material }
  g.add(obj); mao.add(g)
}

// ---------- a armadilha na mão: o pêndulo e o vidro que respira ----------
/** A lanterna pendurada: a ponta (bob) é um peso solto no mundo, preso pela alça; giro e brilho vêm dos gestos (somam). */
export interface AnimLanterna { bob: THREE.Vector3; ant: THREE.Vector3; solta: boolean; t: number; giro: number; brilho: number }
export const novaLanterna = (): AnimLanterna => ({ bob: new THREE.Vector3(), ant: new THREE.Vector3(), solta: true, t: 0, giro: 0, brilho: 0 })

const _piv = new THREE.Vector3(), _dir = new THREE.Vector3(), _vel = new THREE.Vector3(), _qm = new THREE.Quaternion(), _qg = new THREE.Quaternion()
const BAIXO = new THREE.Vector3(0, -1, 0), CIMA = new THREE.Vector3(0, 1, 0)

/** Depois da pose do corpo: a armadilha balança pela alça (a gravidade e o tranco da mão) e o vidro respira. */
export function animarArma(a: Agente, dt: number) {
  const L = a.anim.lanterna
  const g = a.arms[0].hd.getObjectByName(NOME)
  if (!g || a.arma !== 'armadilha' || dt <= 0) { L.giro = L.brilho = 0; return }
  const P = ARMADILHA.pendulo
  a.root.updateMatrixWorld(true)
  g.parent!.localToWorld(_piv.copy(g.position)) // a alça, no mundo
  if (L.solta || L.bob.distanceToSquared(_piv) > 1) { L.bob.copy(_piv).addScaledVector(BAIXO, P.comprimento); L.ant.copy(L.bob); L.solta = false }
  // Verlet: o peso continua no embalo (amortecido) e a gravidade puxa; depois, preso à alça pelo comprimento
  _vel.subVectors(L.bob, L.ant).multiplyScalar(Math.exp(-P.amortece * dt))
  L.ant.copy(L.bob)
  L.bob.add(_vel).addScaledVector(BAIXO, 9.8 * dt * dt)
  _dir.subVectors(L.bob, _piv).normalize()
  // não sobe demais (não entra no antebraço nem bate no rosto)
  if (_dir.angleTo(BAIXO) > P.limite) _dir.lerp(BAIXO, 1 - P.limite / _dir.angleTo(BAIXO)).normalize()
  L.bob.copy(_piv).addScaledVector(_dir, P.comprimento)
  // o grupo da arma aponta o "para baixo" dele para o peso (no espaço da mão) e gira em volta do próprio eixo (o gesto)
  g.parent!.getWorldQuaternion(_qm).invert()
  _dir.applyQuaternion(_qm)
  g.quaternion.setFromUnitVectors(BAIXO, _dir).multiply(_qg.setFromAxisAngle(CIMA, L.giro))
  // o vidro respira devagar (e acende mais quando um gesto pede)
  L.t += dt
  const luz = g.userData.luz as THREE.MeshBasicMaterial | undefined
  if (luz) { const B = ARMADILHA.brilho; luz.color.setScalar(B.minimo + (1 - B.minimo) * (0.5 + 0.5 * Math.sin((L.t / B.volta) * Math.PI * 2)) + L.brilho) }
  L.giro = L.brilho = 0 // os gestos escrevem de novo a cada quadro
}
