// O que a bala deixa onde bate (a etapa 4b): as faíscas (pedacinhos que brilham, da cor do tiro, pulando para fora da
// superfície e caindo) e a marca queimada na parede ou no chão, que fica um tempo e encolhe até sumir. Num demônio, só
// as faíscas (a matéria dele espirra: weapons/bala.ts chama quem foi acertado).
// Leve: as faíscas são uma malha só e as marcas outra (cópias de um cubo e de um quadrado), num estoque fixo.
import * as THREE from 'three'
import { aplicarBrilho } from '../../render/brilho'
import { IMPACTO } from './numeros'

const N_FAISCAS = 96, N_MARCAS = 48
interface Faisca { p: THREE.Vector3; v: THREE.Vector3; t: number }
interface Marca { p: THREE.Vector3; q: THREE.Quaternion; t: number }
export interface Impactos { grupo: THREE.Group; faiscas: THREE.InstancedMesh; marcas: THREE.InstancedMesh; f: Faisca[]; m: Marca[]; pf: number; pm: number }

const ZERO = new THREE.Matrix4().makeScale(0, 0, 0)
export function novosImpactos(): Impactos {
  const grupo = new THREE.Group(); grupo.name = 'impactos'
  const faiscas = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), aplicarBrilho(new THREE.MeshBasicMaterial()), N_FAISCAS)
  const marcas = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: '#0b0809', polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }), N_MARCAS)
  for (const im of [faiscas, marcas]) { im.frustumCulled = false; im.visible = false; for (let i = 0; i < im.count; i++) im.setMatrixAt(i, ZERO) }
  for (let i = 0; i < N_FAISCAS; i++) faiscas.setColorAt(i, new THREE.Color('#fff'))
  grupo.add(faiscas, marcas)
  return {
    grupo, faiscas, marcas, pf: 0, pm: 0,
    f: Array.from({ length: N_FAISCAS }, () => ({ p: new THREE.Vector3(), v: new THREE.Vector3(), t: 99 })),
    m: Array.from({ length: N_MARCAS }, () => ({ p: new THREE.Vector3(), q: new THREE.Quaternion(), t: 99 })),
  }
}

const _c = new THREE.Color(), _z = new THREE.Vector3(0, 0, 1)
/** Faíscas saindo de p, para o lado de n (a normal da superfície, ou de onde a bala veio), da cor dada. */
export function faiscas(I: Impactos, p: THREE.Vector3, n: THREE.Vector3, cor: string, quantas = IMPACTO.faiscas) {
  _c.set(cor)
  for (let k = 0; k < quantas; k++) {
    const f = I.f[I.pf], i = I.pf; I.pf = (I.pf + 1) % N_FAISCAS
    f.p.copy(p); f.t = 0
    f.v.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).multiplyScalar(1.4).add(n).normalize().multiplyScalar(IMPACTO.vel * (0.5 + Math.random()))
    I.faiscas.setColorAt(i, _c)
  }
  I.faiscas.instanceColor!.needsUpdate = true
}

/** A marca queimada em p, colada na superfície de normal n. */
export function marca(I: Impactos, p: THREE.Vector3, n: THREE.Vector3) {
  const m = I.m[I.pm]; I.pm = (I.pm + 1) % N_MARCAS
  m.p.copy(p).addScaledVector(n, 0.01); m.t = 0
  m.q.setFromUnitVectors(_z, n).multiply(new THREE.Quaternion().setFromAxisAngle(_z, Math.random() * Math.PI))
}

const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3()
/** Um quadro: as faíscas voam e caem; as marcas ficam e, no fim, encolhem. */
export function passoImpactos(I: Impactos, dt: number) {
  let f = false, m = false
  I.f.forEach((x, i) => {
    if (x.t > IMPACTO.vida) return
    x.t += dt; x.v.y -= 9.8 * dt; x.p.addScaledVector(x.v, dt)
    const k = Math.max(0, 1 - x.t / IMPACTO.vida)
    I.faiscas.setMatrixAt(i, k > 0 ? _m.compose(x.p, _q.identity(), _s.setScalar(0.035 * k)) : ZERO)
    f = true
  })
  const M = IMPACTO.marca
  I.m.forEach((x, i) => {
    if (x.t > M.fica) return
    x.t += dt
    const k = Math.min(1, (M.fica - x.t) / 1) // o último segundo: encolhe
    I.marcas.setMatrixAt(i, k > 0 ? _m.compose(x.p, x.q, _s.set(M.tam * k, M.tam * k, 1)) : ZERO)
    m = true
  })
  I.faiscas.visible = f; I.marcas.visible = m
  if (f) I.faiscas.instanceMatrix.needsUpdate = true
  if (m) I.marcas.instanceMatrix.needsUpdate = true
}
