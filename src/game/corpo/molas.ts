// Molas: o que pendura e balança num personagem (as mechas do cabelo, os painéis da saia). Cada pasta presa pela raiz
// balança como um pêndulo com mola: a gravidade e o tranco de quem a segura (a cabeça, o quadril: andar, correr, virar,
// cair) empurram a ponta; a mola traz de volta e o amortecimento acalma. Parada, a pasta fica na pose do modelo.
// Sem colisão: cada uma tem limites pelo lugar onde nasce em volta da âncora (a cabeça, o quadril), para não entrar nela:
// abre bastante para fora e quase nada para dentro. Uma pasta nova no Blockbench (com o nome do grupo) já balança.
// Uma corrente (o painel e a ponta dele) funciona sozinha: cada mola faz a conta no espaço de quem a segura.
import * as THREE from 'three'

export interface ConfigMolas {
  mola: number // quão rápido volta (mais = mais duro)
  amortece: number // quanto acalma (menos = balança mais)
  tranco: number // quanto o tranco empurra (0 = só a gravidade)
  trancoMax: number // m/s²: corta os saltos (teleporte, primeiro quadro)
  solto: number // rad: o máximo que abre para fora
  preso: number // rad: o máximo que vai para dentro (para o lado da âncora)
  zona: { tras: number; frente: number; lado: number } // m: a partir de onde, em volta da âncora, a pasta está atrás, na frente, de lado
}

export interface Mola { g: THREE.Object3D; base: THREE.Euler; ax: number; az: number; vx: number; vz: number; lim: [number, number, number, number] }
/** Um conjunto de molas e quem as segura (ref: o osso cujo tranco as empurra). */
export interface Molas { cfg: ConfigMolas; ref: THREE.Object3D; molas: Mola[]; pos: THREE.Vector3 | null; vel: THREE.Vector3 }

/** Prepara as molas (o corpo já montado, na pose do arquivo): guarda a pose e acha os limites pelo lugar de cada uma
 *  em volta da âncora. */
export function prepararMolas(grupos: THREE.Object3D[], ancora: THREE.Object3D, ref: THREE.Object3D, cfg: ConfigMolas): Molas {
  const molas = grupos.map((g): Mola => {
    const p = ancora.worldToLocal(g.getWorldPosition(new THREE.Vector3()))
    const { solto: S, preso: P, zona: Z } = cfg
    // girar em x para o positivo leva a ponta para trás (−z); em z para o positivo, para fora do lado +x
    const lx: [number, number] = p.z < Z.tras ? [-P, S] : p.z > Z.frente ? [-S, P] : [-0.6 * S / 0.9, 0.6 * S / 0.9]
    const lz: [number, number] = p.x > Z.lado ? [-P, S] : p.x < -Z.lado ? [-S, P] : [-0.4 * S / 0.9, 0.4 * S / 0.9]
    return { g, base: g.rotation.clone(), ax: 0, az: 0, vx: 0, vz: 0, lim: [lx[0], lx[1], lz[0], lz[1]] }
  })
  return { cfg, ref, molas, pos: null, vel: new THREE.Vector3() }
}

const _p = new THREE.Vector3(), _v = new THREE.Vector3(), _a = new THREE.Vector3(), _f = new THREE.Vector3(), _l = new THREE.Vector3(), _q = new THREE.Quaternion()
const cl = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x))

/** Um quadro das molas, depois de toda a pose posta no lugar. raiz = o personagem (para atualizar as matrizes). */
export function animarMolas(m: Molas, raiz: THREE.Object3D, dt: number) {
  if (dt <= 0 || !m.molas.length) return
  raiz.updateMatrixWorld(true)
  m.ref.getWorldPosition(_p)
  if (!m.pos) { m.pos = _p.clone(); return }
  // o tranco: a aceleração de quem segura, no mundo
  _v.copy(_p).sub(m.pos).divideScalar(dt)
  _a.copy(_v).sub(m.vel).divideScalar(dt)
  m.vel.copy(_v); m.pos.copy(_p)
  const C = m.cfg
  if (_a.length() > C.trancoMax) _a.setLength(C.trancoMax)
  // a força em cada grama: a gravidade menos o tranco (a ponta fica para trás quando quem segura acelera)
  _f.set(0, -9.8, 0).addScaledVector(_a, -C.tranco)
  for (const s of m.molas) {
    // a força no espaço de quem segura a pasta: para onde a ponta quer apontar
    s.g.parent!.getWorldQuaternion(_q)
    _l.copy(_f).applyQuaternion(_q.invert())
    const baixo = Math.max(0.5, -_l.y)
    const [x0, x1, z0, z1] = s.lim
    const alvoX = cl(-Math.atan2(_l.z, baixo), x0, x1), alvoZ = cl(Math.atan2(_l.x, baixo), z0, z1)
    s.vx += (C.mola * (alvoX - s.ax) - C.amortece * s.vx) * dt; s.ax = cl(s.ax + s.vx * dt, x0, x1)
    s.vz += (C.mola * (alvoZ - s.az) - C.amortece * s.vz) * dt; s.az = cl(s.az + s.vz * dt, z0, z1)
    s.g.rotation.set(s.base.x + s.ax, s.base.y, s.base.z + s.az)
  }
}
