// O projétil da Asa sombria (docs/demonios.md): uma bola de matéria escura com o brilho vermelho, lenta o bastante para
// esquivar. Um núcleo vermelho (brilha: com o bloom ligado, faz halo) com pedras de matéria girando em volta, e um
// rastro de cubinhos que encolhem. Bate no chão (ou vai longe demais) e estoura pequeno, com uma mancha.
// Leve: todos os projéteis e o rastro são uma malha só (InstancedMesh), num estoque fixo; só desenha com algo vivo.
// Ponha `grupo` na cena uma vez. Acertar o agente: acertar() (a luta); as paredes ainda não seguram a bola.
import * as THREE from 'three'
import { aplicarBrilho } from '../../../render/brilho'
import { estourar, type Estouro } from '../estouro'
import { PROJETIL } from './numeros'

const MAX = 8, N_RASTRO = 64, POR_BOLA = 1 + PROJETIL.pedras
const NUCLEO = new THREE.Color('#ff3a2a'), MATERIA = new THREE.Color('#0c0a10'), RASTRO = new THREE.Color('#16101a')

interface Bola { viva: boolean; p: THREE.Vector3; v: THREE.Vector3; t: number; dist: number; eixos: THREE.Vector3[]; fases: number[]; tams: number[]; rastro: number }
export interface Projeteis {
  grupo: THREE.Group; malha: THREE.InstancedMesh
  bolas: Bola[]
  rastro: { p: THREE.Vector3; t: number }[]; prox: number
  bateu: THREE.Vector3[] // onde as bolas bateram neste quadro (o som do respingo)
}

export function novosProjeteis(): Projeteis {
  const grupo = new THREE.Group(); grupo.name = 'projeteis'
  const malha = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), aplicarBrilho(new THREE.MeshBasicMaterial()), MAX * POR_BOLA + N_RASTRO)
  malha.frustumCulled = false; malha.visible = false
  const zero = new THREE.Matrix4().makeScale(0, 0, 0)
  for (let i = 0; i < malha.count; i++) {
    malha.setMatrixAt(i, zero)
    malha.setColorAt(i, i >= MAX * POR_BOLA ? RASTRO : i % POR_BOLA === 0 ? NUCLEO : MATERIA)
  }
  grupo.add(malha)
  const bolas = Array.from({ length: MAX }, (): Bola => ({
    viva: false, p: new THREE.Vector3(), v: new THREE.Vector3(), t: 0, dist: 0,
    eixos: Array.from({ length: PROJETIL.pedras }, () => new THREE.Vector3()), fases: [], tams: [], rastro: 0,
  }))
  return { grupo, malha, bolas, rastro: Array.from({ length: N_RASTRO }, () => ({ p: new THREE.Vector3(), t: 99 })), prox: 0, bateu: [] }
}

/** Dispara de `de` (a boca) na direção de `para` (no mundo). */
export function disparar(P: Projeteis, de: THREE.Vector3, para: THREE.Vector3) {
  const b = P.bolas.find((x) => !x.viva) ?? P.bolas.reduce((x, y) => (y.dist > x.dist ? y : x)) // sem lugar: a mais velha
  b.viva = true; b.t = 0; b.dist = 0; b.rastro = 0
  b.p.copy(de); b.v.copy(para).sub(de).normalize().multiplyScalar(PROJETIL.vel)
  b.eixos.forEach((e, i) => { e.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize(); b.fases[i] = Math.random() * 6.28; b.tams[i] = PROJETIL.pedra[0] + Math.random() * (PROJETIL.pedra[1] - PROJETIL.pedra[0]) })
}

const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _o = new THREE.Vector3(), _e = new THREE.Euler(), _x = new THREE.Vector3()

/** Um quadro dos projéteis: andam; batendo no chão (a altura `chao`) ou longe demais, estouram pequeno em E. */
export function passoProjeteis(P: Projeteis, dt: number, E: Estouro, chao: number) {
  const C = PROJETIL
  let algo = false
  P.bateu.length = 0
  P.bolas.forEach((b, n) => {
    const i0 = n * POR_BOLA
    if (!b.viva) return
    b.t += dt; b.p.addScaledVector(b.v, dt); b.dist += C.vel * dt
    if (b.p.y <= chao + C.nucleo || b.dist > C.alcance) { // bateu: estoura pequeno (sem olhos), e some
      b.viva = false
      estourar(E, _o.copy(b.p).setY(Math.max(b.p.y, chao + 0.05)), 0.12, chao, { cubos: 9, olhos: 0 })
      P.bateu.push(_o.clone())
      for (let i = 0; i < POR_BOLA; i++) P.malha.setMatrixAt(i0 + i, _m.makeScale(0, 0, 0))
      algo = true
      return
    }
    algo = true
    // o núcleo gira; as pedras dão voltas em volta dele, cada uma no seu plano
    P.malha.setMatrixAt(i0, _m.compose(b.p, _q.setFromEuler(_e.set(b.t * 7, b.t * 5, b.t * 3)), _s.setScalar(C.nucleo)))
    b.eixos.forEach((eixo, i) => {
      _x.set(1, 0, 0); if (Math.abs(eixo.x) > 0.9) _x.set(0, 1, 0)
      _o.crossVectors(eixo, _x).normalize().multiplyScalar(C.raio).applyAxisAngle(eixo, b.fases[i] + b.t * C.gira)
      P.malha.setMatrixAt(i0 + 1 + i, _m.compose(_o.add(b.p), _q.setFromEuler(_e.set(b.t * 9 + i, b.t * 6, i)), _s.setScalar(b.tams[i])))
    })
    // o rastro: um cubinho a cada tanto, onde ela passou
    if ((b.rastro -= dt) <= 0) {
      b.rastro = C.rastro
      const r = P.rastro[P.prox]; P.prox = (P.prox + 1) % P.rastro.length
      r.p.copy(b.p).add(_o.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).multiplyScalar(0.08)); r.t = 0
    }
  })
  const base = MAX * POR_BOLA
  P.rastro.forEach((r, i) => {
    if (r.t > C.rastroVida) return
    r.t += dt; r.p.y -= dt * 0.25 // a matéria pinga um tico
    const k = 1 - Math.min(1, r.t / C.rastroVida)
    P.malha.setMatrixAt(base + i, _m.compose(r.p, _q.identity(), _s.setScalar(k > 0 ? C.rastroTam * k : 0)))
    algo = true
  })
  P.malha.visible = algo
  if (algo) P.malha.instanceMatrix.needsUpdate = true
}

/** Uma bola acertou alguém (uma esfera: o peito do agente, raio r)? Ela estoura pequena ali e some; devolve onde (ou null). */
export function acertar(P: Projeteis, p: THREE.Vector3, r: number, E: Estouro, chao: number): THREE.Vector3 | null {
  for (const [n, b] of P.bolas.entries()) {
    if (!b.viva || b.p.distanceTo(p) > r) continue
    b.viva = false
    estourar(E, b.p, 0.12, chao, { cubos: 9, olhos: 0 })
    for (let i = 0; i < POR_BOLA; i++) P.malha.setMatrixAt(n * POR_BOLA + i, _m.makeScale(0, 0, 0))
    P.malha.instanceMatrix.needsUpdate = true
    P.bateu.push(b.p.clone())
    return b.p.clone()
  }
  return null
}
