// O braço alcança um ponto (IK de dois ossos): o pulso vai até o alvo e o cotovelo aponta para o polo. Serve para os
// gestos (pegar a alça da mochila, bater na bolsa) e, depois, para a outra mão na arma.
// Contas no espaço do pai do braço (o peito): o braço pende para −y da junta, o antebraço dobra para +z (rotation.x < 0).
import * as THREE from 'three'
import type { Braco } from './modelo'

const _d = new THREE.Vector3(), _p = new THREE.Vector3(), _u = new THREE.Vector3(), _f = new THREE.Vector3()
const _x = new THREE.Vector3(), _y = new THREE.Vector3(), _z = new THREE.Vector3()
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion()
const cl = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))

/** Leva o pulso até o alvo (no espaço do peito); k = quanto, de 0 (a pose que já está) a 1 (no alvo). */
export function alcancar(b: Braco, alvo: THREE.Vector3, polo: THREE.Vector3, k: number) {
  if (k <= 0.001) return
  const l1 = b.fo.position.length(), l2 = b.hd.position.length()
  _d.copy(alvo).sub(b.up.position)
  const L = cl(_d.length(), Math.abs(l1 - l2) + 1e-3, l1 + l2 - 1e-3)
  _d.normalize()
  const A = Math.acos(cl((l1 * l1 + L * L - l2 * l2) / (2 * l1 * L), -1, 1)) // o ângulo no ombro
  const B = Math.PI - Math.acos(cl((l1 * l1 + l2 * l2 - L * L) / (2 * l1 * l2), -1, 1)) // quanto o cotovelo dobra
  _p.copy(polo).addScaledVector(_d, -polo.dot(_d)).normalize() // o polo, de lado em relação à linha ombro-alvo
  _u.copy(_d).multiplyScalar(Math.cos(A)).addScaledVector(_p, Math.sin(A)) // para onde vai o braço
  _f.copy(_d).multiplyScalar(L).addScaledVector(_u, -l1).normalize() // e o antebraço, do cotovelo ao alvo
  _y.copy(_u).negate()
  _z.copy(_f).addScaledVector(_u, -_f.dot(_u)).normalize()
  _x.crossVectors(_y, _z)
  _q.setFromRotationMatrix(_m.makeBasis(_x, _y, _z))
  b.up.quaternion.slerp(_q, k)
  b.fo.rotation.x += (-B - b.fo.rotation.x) * k
}
