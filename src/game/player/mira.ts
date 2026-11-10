// Mirar e o tiro, no corpo: a arma levantada apontando para o alvo (o ponto que a câmera mira, no mundo), o coice e,
// na escopeta, a mão esquerda puxando a bomba depois do tiro. Quem decide o tiro (a cadência) é weapons/tiro.ts.
//   pistola: as duas mãos, os braços quase esticados (a esquerda por baixo, envolvendo a direita);
//   escopeta: a coronha no ombro direito, o peito de lado e a esquerda na bomba (a arma é pesada; o coice empurra o ombro).
// O peito e a cabeça acompanham a altura do alvo. Os números em numeros.ts (MIRA) e em weapons/numeros.ts (TIRO).
import * as THREE from 'three'
import { TIRO } from '../weapons/numeros'
import { armaEm, giroPeloCano, maoEm, POLO_D } from './arma'
import type { Agente } from './modelo'
import { MIRA } from './numeros'

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z)
const POLO_E = V(0.7, -1, -0.2)
const PONTO_E = V(0, -0.05, 0.025) // onde a mão esquerda encosta na direita (na palma)
const CIMA = V(0, 1, 0)
const _t = new THREE.Vector3(), _o = new THREE.Vector3(), _d = new THREE.Vector3(), _p = new THREE.Vector3()
const _x = new THREE.Vector3(), _y = new THREE.Vector3(), _z = new THREE.Vector3(), _yh = new THREE.Vector3(), _zh = new THREE.Vector3(), _xh = new THREE.Vector3()
const _q = new THREE.Quaternion(), _qk = new THREE.Quaternion(), _qm = new THREE.Quaternion(), _m = new THREE.Matrix4()
const cl = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))
const sm = (x: number) => { const k = cl(x, 0, 1); return k * k * (3 - 2 * k) }

/**
 * Depois dos braços e da postura da escopeta: levanta a arma para o alvo (quer = mirando, ou atirando sem mirar).
 * alvo = o ponto no mundo; solto = 1 − o quanto está na cambalhota.
 */
export function posturaDaMira(a: Agente, quer: boolean, alvo: THREE.Vector3 | null, dt: number, solto: number) {
  const A = a.anim.arma, arma = a.arma
  const atira = arma === 'pistola' || arma === 'escopeta'
  A.mira += ((quer && atira && alvo ? 1 : 0) - A.mira) * (1 - Math.exp(-(quer ? MIRA.sobe : MIRA.desce) * dt))
  A.tiroT += dt
  if (!atira) { A.coice = 0; return }
  const N = TIRO[arma]
  A.coice *= Math.exp(-N.volta * dt)
  const k = A.mira * solto
  if (k < 0.001 || !alvo) return

  // o alvo no espaço do agente: a altura dele (o peito e a cabeça acompanham) e o quanto está de lado
  a.root.updateWorldMatrix(true, false)
  a.root.worldToLocal(_t.copy(alvo))
  const alto = Math.atan2(_t.y - 1.45, Math.max(0.3, Math.hypot(_t.x, _t.z)))
  const lado = cl(Math.atan2(_t.x, _t.z), -0.6, 0.6) * 0.5 + (arma === 'escopeta' ? MIRA.escopeta.lado : 0)
  const empurra = arma === 'escopeta' ? 0.09 * A.coice : 0.03 * A.coice // o coice joga o ombro para trás
  a.spine.rotation.x -= alto * 0.25 * k; a.chest.rotation.x -= (alto * 0.25 + empurra) * k
  a.spine.rotation.y += lado * 0.4 * k; a.chest.rotation.y += lado * 0.6 * k // de lado: a cintura e o peito dividem o giro
  a.neck.rotation.x -= alto * 0.2 * k; a.head.rotation.x -= alto * 0.3 * k
  a.neck.rotation.y -= lado * 0.4 * k; a.head.rotation.y -= lado * 0.6 * k
  if (arma === 'escopeta') a.head.rotation.z -= 0.12 * k // o rosto encosta na coronha

  // a arma, no espaço do peito: de onde ela sai (o meio dos ombros, ou a coronha no ombro) e para onde aponta
  a.root.updateMatrixWorld(true)
  a.chest.worldToLocal(_t.copy(alvo))
  if (arma === 'pistola') {
    _o.fromArray(MIRA.ombros)
    _d.subVectors(_t, _o).normalize()
    _p.copy(_o).addScaledVector(_d, MIRA.pistola.alcance) // a empunhadura, com os braços quase esticados para o alvo
    _d.subVectors(_t, _p).normalize()
  } else {
    _o.fromArray(MIRA.escopeta.coronha)
    _d.subVectors(_t, _o).normalize()
    _p.copy(_o).addScaledVector(_d, 0.33) // da coronha até a empunhadura
  }
  // o coice: o cano sobe (em volta do x da arma) e a arma vem para trás
  giroPeloCano(_d, CIMA, _q)
  _q.multiply(_qk.setFromAxisAngle(_x.set(1, 0, 0), -N.coice * A.coice))
  _p.addScaledVector(_d, -N.recua * A.coice)
  armaEm(a, _p, _q, POLO_D, k)

  if (arma === 'pistola') {
    // a mão esquerda por baixo, do lado esquerdo do cabo, envolvendo os dedos da direita; o polegar para a frente
    _x.set(1, 0, 0).applyQuaternion(_q); _y.set(0, 1, 0).applyQuaternion(_q); _z.set(0, 0, 1).applyQuaternion(_q)
    _zh.copy(_x).negate() // a palma virada para a arma
    _yh.copy(_y).multiplyScalar(0.8).addScaledVector(_z, -0.2) // os dedos descem pelo cabo (o y da mão é o contrário)
    _yh.addScaledVector(_zh, -_yh.dot(_zh)).normalize()
    _xh.crossVectors(_yh, _zh)
    _qm.setFromRotationMatrix(_m.makeBasis(_xh, _yh, _zh))
    maoEm(a.arms[1], _o.copy(_p).addScaledVector(_x, 0.04).addScaledVector(_y, -0.035), _qm, PONTO_E, POLO_E, k)
  } else {
    // a escopeta: a esquerda na bomba (maoNaBomba) e, depois do tiro, puxa a bomba e devolve
    A.esquerda = Math.max(A.esquerda, k)
    const B = TIRO.escopeta.bomba, u = (A.tiroT - B.apos) / B.dura
    if (u > 0 && u < 1) A.bomba = Math.max(A.bomba, sm(u < 0.45 ? u / 0.45 : (1 - u) / 0.55))
  }
}
