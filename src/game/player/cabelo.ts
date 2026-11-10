// O cabelo com física simples: cada pasta "mecha_..." do modelo (no Blockbench) é uma mecha presa pela raiz que balança
// como um pêndulo com mola. A gravidade e o tranco da cabeça (andar, correr, virar, a cambalhota) empurram a ponta;
// a mola traz de volta e o amortecimento acalma. Parado e em pé, a mecha fica na pose do modelo.
// Sem colisão: cada mecha tem limites pelo lugar onde nasce, para não entrar na cabeça (as da nuca não vão para a frente,
// as da franja não entram no rosto, as dos lados não entram na orelha). Mecha nova no Blockbench já balança sozinha.
import * as THREE from 'three'
import type { Agente } from './modelo'

export const CABELO = {
  mola: 45, // quão rápido volta (mais = mais duro)
  amortece: 5, // quanto acalma (menos = balança mais)
  tranco: 0.45, // quanto o tranco da cabeça empurra (0 = só a gravidade)
  trancoMax: 30, // m/s²: corta os saltos (teleporte, primeiro quadro)
  solto: 0.9, // rad: o máximo que a mecha abre para fora
  preso: 0.1, // rad: o máximo que ela vai para dentro (para o lado da cabeça)
}

export interface Mecha { g: THREE.Group; base: THREE.Euler; ax: number; az: number; vx: number; vz: number; lim: [number, number, number, number] }
export interface FisicaCabelo { pos: THREE.Vector3 | null; vel: THREE.Vector3 }
export const novaFisicaCabelo = (): FisicaCabelo => ({ pos: null, vel: new THREE.Vector3() })

/** Prepara uma mecha: guarda a pose do modelo e acha os limites pelo lugar da raiz na cabeça (o root já montado). */
export function prepararMecha(g: THREE.Group, cabeca: THREE.Object3D): Mecha {
  const p = cabeca.worldToLocal(g.getWorldPosition(new THREE.Vector3()))
  const { solto: S, preso: P } = CABELO
  // girar em x para o positivo leva a ponta para trás (−z); em z para o positivo, para fora do lado +x
  const lx: [number, number] = p.z < -0.06 ? [-P, S] : p.z > 0.07 ? [-S, P] : [-0.6, 0.6]
  const lz: [number, number] = p.x > 0.11 ? [-P, S] : p.x < -0.11 ? [-S, P] : [-0.4, 0.4]
  return { g, base: g.rotation.clone(), ax: 0, az: 0, vx: 0, vz: 0, lim: [lx[0], lx[1], lz[0], lz[1]] }
}

const _p = new THREE.Vector3(), _v = new THREE.Vector3(), _a = new THREE.Vector3(), _f = new THREE.Vector3(), _l = new THREE.Vector3(), _q = new THREE.Quaternion()
const cl = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x))

export function animarCabelo(a: Agente, dt: number) {
  if (dt <= 0 || !a.mechas.length) return
  const f = a.anim.cabelo
  a.root.updateMatrixWorld(true)
  a.head.getWorldPosition(_p)
  if (!f.pos) { f.pos = _p.clone(); return }
  // o tranco: a aceleração da cabeça no mundo
  _v.copy(_p).sub(f.pos).divideScalar(dt)
  _a.copy(_v).sub(f.vel).divideScalar(dt)
  f.vel.copy(_v); f.pos.copy(_p)
  if (_a.length() > CABELO.trancoMax) _a.setLength(CABELO.trancoMax)
  // a força em cada grama de cabelo: a gravidade menos o tranco (a ponta fica para trás quando a cabeça acelera)
  _f.set(0, -9.8, 0).addScaledVector(_a, -CABELO.tranco)
  const k = CABELO.mola, c = CABELO.amortece
  for (const m of a.mechas) {
    // a força no espaço de quem segura a mecha (a pasta do cabelo): para onde a ponta quer apontar
    m.g.parent!.getWorldQuaternion(_q)
    _l.copy(_f).applyQuaternion(_q.invert())
    const baixo = Math.max(0.5, -_l.y)
    const [x0, x1, z0, z1] = m.lim
    const alvoX = cl(-Math.atan2(_l.z, baixo), x0, x1), alvoZ = cl(Math.atan2(_l.x, baixo), z0, z1)
    m.vx += (k * (alvoX - m.ax) - c * m.vx) * dt; m.ax = cl(m.ax + m.vx * dt, x0, x1)
    m.vz += (k * (alvoZ - m.az) - c * m.vz) * dt; m.az = cl(m.az + m.vz * dt, z0, z1)
    m.g.rotation.set(m.base.x + m.ax, m.base.y, m.base.z + m.az)
  }
}
