// A arma na mão direita do agente: o modelo e como a mão segura (mirar e atirar: mira.ts; a recarga: recarga.ts). A
// lamparina, que era a armadilha, não é arma: fica na cintura (lamparina.ts). O modelo é modelos/armas/<nome>.bbmodel; a pasta "empunhadura" dele é o ponto que vai na mão.
// O espaço da mão direita (o do modelo do agente): os dedos para −y, a palma para +z, o polegar para −x.
// A escopeta, pesada, vai com as duas mãos (a esquerda na bomba); parado um tempo, ele apoia no ombro (posturaDaEscopeta).
// Os números em numeros.ts (ESCOPETA, PISTOLA).
import * as THREE from 'three'
import { aplicarBrilho } from '../../render/brilho'
import { arma3d } from '../../render/objetos3d'
import { alcancar } from './alcancar'
import type { PoseMao } from './maos'
import type { Agente, Braco } from './modelo'
import { ESCOPETA, PISTOLA } from './numeros'
import { novoClarao } from '../weapons/clarao'
import { MUNICAO, TIRO } from '../weapons/numeros'

export type Arma = 'pistola' | 'escopeta'
export const ARMAS: [Arma, string][] = [['pistola', 'Pistola de plasma'], ['escopeta', 'Escopeta de Demantino']]
/** As que o Q troca: as duas de tiro. */
export const TROCA: Arma[] = ['pistola', 'escopeta']
/** A próxima do Q: da mão vazia, a primeira; depois, uma e outra. */
export const proximaArma = (a: Arma | null): Arma => TROCA[(TROCA.indexOf(a as Arma) + 1) % TROCA.length]
/** A pose da mão que segura cada uma: pistola e escopeta com o indicador fora do gatilho. */
export const POSE_DA_ARMA: Record<Arma, PoseMao> = { pistola: 'guarda', escopeta: 'guarda' }

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z)
// como cada uma fica na mão: onde a empunhadura cai (no espaço da mão) e o giro da arma
//   pistola e escopeta: o cano segue os dedos (−y), o cabo desce para o lado do mínimo (+x), a palma encosta do lado +x da arma
const DE_ARMA = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(V(0, 0, 1), V(-1, 0, 0), V(0, -1, 0)))
const PEGA: Record<Arma, { ponto: THREE.Vector3; giro: THREE.Quaternion }> = {
  pistola: { ponto: V(0.004, -0.06, 0.042), giro: DE_ARMA },
  escopeta: { ponto: V(0.004, -0.06, 0.042), giro: DE_ARMA },
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
  a.arma = nome
  if (!nome) return
  const obj = arma3d(nome), p = PEGA[nome]
  // a empunhadura do modelo vai para a origem do grupo (que fica no ponto da mão)
  obj.updateMatrixWorld(true)
  const pega = obj.getObjectByName('empunhadura')
  if (pega) obj.position.copy(pega.getWorldPosition(new THREE.Vector3())).negate()
  const g = new THREE.Group(); g.name = NOME
  g.position.copy(p.ponto); g.quaternion.copy(p.giro)
  // o frasco da pistola esquenta: um material só desta cópia (os outros modelos não piscam junto)
  const luz = nome === 'pistola' ? (obj.getObjectByName('#luz') as THREE.Mesh | undefined) : undefined
  if (luz) { luz.material = aplicarBrilho((luz.material as THREE.MeshBasicMaterial).clone()); g.userData.luz = luz.material }
  // a bomba da escopeta corre para trás no gesto (e, depois, no tiro): guarda a peça e onde ela fica parada
  const bomba = obj.getObjectByName('bomba')
  if (bomba) { g.userData.bomba = bomba; g.userData.bombaZ = bomba.position.z }
  // a câmara da escopeta: para onde as balas vão na recarga (o marcador no meio do bloco)
  const camara = obj.getObjectByName('camara_sal')
  if (camara) g.userData.camara = camara
  // o clarão do tiro: escondido na pasta "cano" (a pistola e a escopeta)
  const cano = obj.getObjectByName('cano')
  if (cano) { const c = novoClarao(TIRO[nome].cor); c.scale.setScalar(TIRO[nome].tamanho); cano.add(c); g.userData.clarao = c }
  g.add(obj); mao.add(g)
}

/** O grupo da arma na mão direita (o modelo e o que a animação guarda nele), ou undefined de mão vazia. */
export const grupoDaArma = (a: Agente) => a.arms[0].hd.getObjectByName(NOME)

/** O que a arma na mão lembra de um quadro para o outro. t = o relógio (o frasco da pistola tremendo).
 *  escopeta: ombro = quanto está apoiada no ombro (0..1) e parado = há quanto tempo está parado; esquerda = quanto a mão
 *  esquerda vai na bomba e bomba = quanto a bomba corre (0..1): a postura escreve a base, os gestos somam.
 *  o tiro (mira.ts, weapons/tiro.ts): mira = quanto a arma está levantada (0..1); cd = quanto falta para o próximo tiro;
 *  coice = o tranco do último tiro (1 no tiro, passa); tiroT = s desde o último tiro; clarao = s que o clarão ainda fica.
 *  a recarga da escopeta (recarga.ts): recarga = o quanto a pose está valendo (0..1); rt = s desde o começo e rn =
 *  quantas balas entram (os da recarga de agora, ou da última, enquanto a pose some).
 *  a pistola (weapons/municao.ts): calor = 0..1 e travada = a sobrecarga; o frasco acende com o calor e apaga travado. */
export interface AnimArma {
  t: number
  ombro: number; parado: number; esquerda: number; bomba: number
  mira: number; cd: number; coice: number; tiroT: number; clarao: number
  recarga: number; rt: number; rn: number
  calor: number; travada: number
}
export const novaAnimArma = (): AnimArma => ({
  t: 0, ombro: 0, parado: 0, esquerda: 0, bomba: 0,
  mira: 0, cd: 0, coice: 0, tiroT: 9, clarao: 0, recarga: 0, rt: 0, rn: 0, calor: 0, travada: 0,
})

// ---------- levar a arma (e as mãos) até uma pose, no espaço do peito ----------
const _w = new THREE.Vector3(), _x = new THREE.Vector3(), _y = new THREE.Vector3(), _z = new THREE.Vector3()
const _m = new THREE.Matrix4(), _qa = new THREE.Quaternion(), _qh = new THREE.Quaternion(), _qp = new THREE.Quaternion(), _qc = new THREE.Quaternion()

/** O giro de uma arma pelo cano (o z dela) e por para onde vai o "em cima" dela (o y), no espaço do peito. */
export function giroPeloCano(cano: THREE.Vector3, cima: THREE.Vector3, out: THREE.Quaternion): THREE.Quaternion {
  _z.copy(cano).normalize(); _y.copy(cima).addScaledVector(_z, -cima.dot(_z)).normalize(); _x.crossVectors(_y, _z)
  return out.setFromRotationMatrix(_m.makeBasis(_x, _y, _z))
}

/** A mão vai até a pega (no peito) com o giro qMao (no peito); ponto = onde a pega fica no espaço da mão. k = quanto. */
export function maoEm(b: Braco, pega: THREE.Vector3, qMao: THREE.Quaternion, ponto: THREE.Vector3, polo: THREE.Vector3, k: number) {
  if (k <= 0.001) return
  _w.copy(ponto).applyQuaternion(qMao).negate().add(pega) // o pulso
  alcancar(b, _w, polo, k)
  _qp.copy(b.up.quaternion).multiply(b.fo.quaternion).invert()
  b.hd.quaternion.slerp(_qh.copy(qMao).premultiply(_qp), k)
}

/** Leva a arma da mão direita até a pose: a empunhadura em pos e o giro qArma (os dois no peito); k = quanto. */
export function armaEm(a: Agente, pos: THREE.Vector3, qArma: THREE.Quaternion, polo: THREE.Vector3, k: number) {
  if (a.arma) maoEm(a.arms[0], pos, maoParaArma(a.arma, qArma, _qa), PEGA[a.arma].ponto, polo, k)
}

// ---------- a escopeta: as duas mãos (a esquerda na bomba); parado um tempo, no ombro ----------
export const POLO_D = V(-0.6, -1, -0.3) // o cotovelo direito para baixo, para trás e para fora
export const POLO_E = V(0.6, -1, -0.3) // o cotovelo esquerdo (a bomba da escopeta, a lamparina erguida)
const PONTO_E = V(0, -0.05, 0.025) // onde a bomba encosta na mão esquerda (na palma, perto da base dos dedos)
const _pos = new THREE.Vector3(), _cano = new THREE.Vector3(), _cima = new THREE.Vector3(), _qe = new THREE.Quaternion()
const _dedos = new THREE.Vector3(), _xh = new THREE.Vector3(), _yh = new THREE.Vector3(), _zh = new THREE.Vector3()

/**
 * A escopeta no corpo, depois dos braços: a guarda de duas mãos, atravessada na frente do corpo (mais alta correndo,
 * sacudindo com o passo, o peito um pouco para trás com o peso), ou apoiada no ombro (parado um tempo).
 * solto = 1 − o quanto está na cambalhota (a pegada solta para rolar).
 */
export function posturaDaEscopeta(a: Agente, e: { parado: boolean; amp: number; run: number; ph: number; solto: number }, dt: number) {
  const A = a.anim.arma
  A.esquerda = 0; A.bomba = 0
  if (a.arma !== 'escopeta') { A.ombro = 0; A.parado = 0; return }
  const E = ESCOPETA, G = E.guarda, O = E.ombro
  A.parado = e.parado ? A.parado + dt : 0
  const quer = A.parado > O.espera ? 1 : 0
  A.ombro += (quer - A.ombro) * (1 - Math.exp(-(quer ? O.vai : O.volta) * dt))
  // a guarda
  _pos.fromArray(G.pega); _pos.y += G.sobe * e.run + G.passo * Math.sin(2 * e.ph) * e.amp
  _cano.fromArray(G.cano); _cano.y += 0.35 * e.run
  armaEm(a, _pos, giroPeloCano(_cano, _cima.set(0, 1, 0), _qe), POLO_D, e.solto)
  // no ombro (por cima da guarda)
  armaEm(a, _pos.fromArray(O.pega), giroPeloCano(_cano.fromArray(O.cano), _cima.fromArray(O.cima), _qe), POLO_D, A.ombro * e.solto)
  a.spine.rotation.x -= E.peso * (1 - A.ombro) * e.solto
  A.esquerda = (1 - A.ombro) * e.solto
}

/** A mão esquerda na bomba da escopeta, onde a arma estiver agora (guarda, gesto ou no meio do caminho), e a bomba
 *  correndo para trás quando um gesto pede. Depois da postura e dos gestos. */
export function maoNaBomba(a: Agente) {
  const A = a.anim.arma, g = grupoDaArma(a)
  const bomba = g?.userData.bomba as THREE.Object3D | undefined
  if (!g || !bomba) return
  bomba.position.z = (g.userData.bombaZ as number) - ESCOPETA.bomba.curso * A.bomba
  const k = Math.min(1, A.esquerda)
  if (k <= 0.001) return
  a.root.updateMatrixWorld(true)
  // a pega: embaixo da bomba, um pouco para trás do meio; e o giro da arma, os dois no espaço do peito
  a.chest.worldToLocal(bomba.localToWorld(_pos.set(0, -0.021, -0.02)))
  a.chest.getWorldQuaternion(_qc).invert()
  g.getWorldQuaternion(_qa).premultiply(_qc)
  _z.set(0, 0, 1).applyQuaternion(_qa); _y.set(0, 1, 0).applyQuaternion(_qa)
  // a mão esquerda: a palma virada para a arma, embaixo da bomba; os dedos atravessam para a frente (para longe do corpo)
  _dedos.crossVectors(_z, _y); if (_dedos.z < 0) _dedos.negate()
  _zh.copy(_y); _yh.copy(_dedos).negate(); _xh.crossVectors(_yh, _zh)
  _qh.setFromRotationMatrix(_m.makeBasis(_xh, _yh, _zh))
  maoEm(a.arms[1], _pos, _qh, PONTO_E, POLO_E, k)
}

// ---------- o clarão e o frasco ----------

/** Depois da pose do corpo: o clarão do tiro e o frasco da pistola (o calor). */
export function animarArma(a: Agente, dt: number) {
  const L = a.anim.arma
  const g = grupoDaArma(a)
  L.t += dt
  // o clarão do tiro: aparece no tiro, girado e de tamanho sorteados, e some logo
  const clarao = g?.userData.clarao as THREE.Mesh | undefined
  if (clarao) {
    if (L.clarao > 0 && !clarao.visible) { clarao.rotation.z = Math.random() * Math.PI; clarao.scale.setScalar(TIRO[a.arma!].tamanho * (0.8 + 0.4 * Math.random())) }
    clarao.visible = L.clarao > 0
  }
  L.clarao = Math.max(0, L.clarao - dt)
  // o frasco da pistola: acende mais com o calor (e treme perto do limite); travado, apaga e volta a acender devagar
  // enquanto esfria (o tempo que falta para destravar)
  const frasco = a.arma === 'pistola' ? (g?.userData.luz as THREE.MeshBasicMaterial | undefined) : undefined
  if (frasco) {
    const F = PISTOLA.frasco, c = L.calor
    frasco.color.setScalar(L.travada > 0
      ? F.apagado + (1 - F.apagado) * (1 - L.travada / MUNICAO.pistola.trava) ** 2 * (0.85 + 0.15 * Math.sin(L.t * 9))
      : 1 + F.acende * c + F.treme * Math.max(0, c - 0.7) / 0.3 * Math.sin(L.t * 37))
  }
}
