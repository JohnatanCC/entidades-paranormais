// A arma na mão direita do agente: só o modelo e como a mão segura (atirar, a sobrecarga e a armadilha jogada vêm na
// etapa das armas). O modelo é modelos/armas/<nome>.bbmodel; a pasta "empunhadura" dele é o ponto que vai na mão.
// O espaço da mão direita (o do modelo do agente): os dedos para −y, a palma para +z, o polegar para −x.
import * as THREE from 'three'
import { arma3d } from '../../render/objetos3d'
import type { PoseMao } from './maos'
import type { Agente } from './modelo'

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
  if (velha) mao.remove(velha)
  a.arma = nome
  if (!nome) return
  const obj = arma3d(nome), p = PEGA[nome]
  // a empunhadura do modelo vai para a origem do grupo (que fica no ponto da mão)
  obj.updateMatrixWorld(true)
  const pega = obj.getObjectByName('empunhadura')
  if (pega) obj.position.copy(pega.getWorldPosition(new THREE.Vector3())).negate()
  const g = new THREE.Group(); g.name = NOME
  g.position.copy(p.ponto); g.quaternion.copy(p.giro)
  g.add(obj); mao.add(g)
}
