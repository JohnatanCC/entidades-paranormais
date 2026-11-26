// Os efeitos do Asa do terror, no mundo (ponha `grupo` na cena uma vez):
//   a bola de luz da carga (entre as mandíbulas: um núcleo e cubos que giram e fecham nele);
//   a bomba: o tiro voa reto até o ponto, gruda (o núcleo com seis espinhos), pisca vermelho cada vez mais rápido, com o
//     círculo no chão mostrando até onde a explosão pega, e explode (os estilhaços e o anel que abre);
//   o teletransporte: os cubos que sobem de onde ele se desfaz (e de onde surge) e o anel no chão.
// Leve: todos os cubos são uma malha só e todos os anéis outra (InstancedMesh, estoque fixo, somando luz); só desenham
// com algo vivo. Quem controla lê o que aconteceu no quadro (grudou, bipe, explodiu) para o som e o dano.
import * as THREE from 'three'
import { aplicarBrilho } from '../../../render/brilho'
import { BOMBA } from './numeros'

const N_ORBE = 7, N_BOMBAS = 6, POR_BOMBA = 7, N_PARTES = 64, N_ANEIS = N_BOMBAS + 6
const I_BOMBA = N_ORBE, I_PARTE = I_BOMBA + N_BOMBAS * POR_BOMBA
export const AZUL = new THREE.Color('#6fd0ff'), BRANCO = new THREE.Color('#f2fdff'), VERMELHO = new THREE.Color('#ff3a2a')
const EIXOS = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]].map(([x, y, z]) => new THREE.Vector3(x, y, z))

interface Bomba { estado: 'livre' | 'voa' | 'presa'; p: THREE.Vector3; alvo: THREE.Vector3; t: number; pisca: number; rastro: number }
interface Parte { p: THREE.Vector3; v: THREE.Vector3; t: number; vida: number; tam: number; peso: number }
interface Anel { p: THREE.Vector3; t: number; dur: number; r0: number; r1: number; cor: THREE.Color }
export interface EfeitosAsaTerror {
  grupo: THREE.Group; cubos: THREE.InstancedMesh; aneis: THREE.InstancedMesh
  orbe: { p: THREE.Vector3; k: number }; t: number
  bombas: Bomba[]; partes: Parte[]; prox: number; soltos: Anel[]
  /** o que aconteceu neste quadro: onde uma bomba grudou, piscou (o bipe) e explodiu */
  grudou: THREE.Vector3[]; bipe: THREE.Vector3[]; explodiu: THREE.Vector3[]
}

const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _g = new THREE.Quaternion(), _s = new THREE.Vector3(), _o = new THREE.Vector3(), _e = new THREE.Euler(), _c = new THREE.Color()
const ZERO = new THREE.Matrix4().makeScale(0, 0, 0), FRENTE = new THREE.Vector3(0, 0, 1)

export function novosEfeitos(): EfeitosAsaTerror {
  const grupo = new THREE.Group(); grupo.name = 'efeitos-asa-terror'
  const cubos = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), aplicarBrilho(new THREE.MeshBasicMaterial()), I_PARTE + N_PARTES)
  const aneis = new THREE.InstancedMesh(new THREE.RingGeometry(0.93, 1, 48).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }), N_ANEIS)
  for (const m of [cubos, aneis]) {
    m.frustumCulled = false
    for (let i = 0; i < m.count; i++) { m.setMatrixAt(i, ZERO); m.setColorAt(i, i % 3 === 0 ? BRANCO : AZUL) }
    grupo.add(m)
  }
  aneis.renderOrder = 6
  return {
    grupo, cubos, aneis, orbe: { p: new THREE.Vector3(), k: 0 }, t: 0,
    bombas: Array.from({ length: N_BOMBAS }, (): Bomba => ({ estado: 'livre', p: new THREE.Vector3(), alvo: new THREE.Vector3(), t: 0, pisca: 0, rastro: 0 })),
    partes: Array.from({ length: N_PARTES }, (): Parte => ({ p: new THREE.Vector3(), v: new THREE.Vector3(), t: 99, vida: 1, tam: 0, peso: 0 })), prox: 0,
    soltos: Array.from({ length: N_ANEIS - N_BOMBAS }, (): Anel => ({ p: new THREE.Vector3(), t: 99, dur: 1, r0: 0, r1: 0, cor: new THREE.Color() })),
    grudou: [], bipe: [], explodiu: [],
  }
}

/** A bola de luz da carga, a cada quadro: onde (a boca) e o quanto (0 = nenhuma). */
export function orbe(E: EfeitosAsaTerror, onde: THREE.Vector3, k: number) { E.orbe.p.copy(onde); E.orbe.k = k }

function parte(E: EfeitosAsaTerror, p: THREE.Vector3, v: THREE.Vector3, vida: number, tam: number, peso: number) {
  const x = E.partes[E.prox]; E.prox = (E.prox + 1) % N_PARTES
  x.p.copy(p); x.v.copy(v); x.t = 0; x.vida = vida; x.tam = tam; x.peso = peso
}
/** Um anel de luz no chão que abre (ou fecha) e some. */
export function anel(E: EfeitosAsaTerror, onde: THREE.Vector3, r0: number, r1: number, dur: number, cor: THREE.Color = AZUL) {
  const a = E.soltos.reduce((x, y) => (y.t / y.dur > x.t / x.dur ? y : x)) // o mais gasto
  a.p.copy(onde); a.t = 0; a.dur = dur; a.r0 = r0; a.r1 = r1; a.cor.copy(cor)
}
/** O corpo se desfazendo (ou surgindo) em cubos: saem de dentro de uma bola (centro, raio) e sobem. */
export function desfazer(E: EfeitosAsaTerror, centro: THREE.Vector3, raio: number, n = 22) {
  const v = new THREE.Vector3()
  for (let i = 0; i < n; i++) {
    _o.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize().multiplyScalar(raio * Math.cbrt(Math.random()))
    v.copy(_o).multiplyScalar(0.8).setY(0.8 + Math.random() * 2)
    parte(E, _o.add(centro), v, 0.45 + Math.random() * 0.5, 0.07 + Math.random() * 0.12, -0.5)
  }
}
/** Dispara uma bomba de `de` (a boca) até `para` (o ponto da superfície onde ela gruda). */
export function dispararBomba(E: EfeitosAsaTerror, de: THREE.Vector3, para: THREE.Vector3) {
  const b = E.bombas.find((x) => x.estado === 'livre') ?? E.bombas.reduce((x, y) => (y.t > x.t ? y : x))
  b.estado = 'voa'; b.p.copy(de); b.alvo.copy(para); b.t = 0; b.pisca = 0; b.rastro = 0
}

/** Um quadro (chao = a altura do chão embaixo das bombas, para o círculo). */
export function passoEfeitos(E: EfeitosAsaTerror, dt: number, chao = 0) {
  const C = E.cubos, B = BOMBA, v = _s
  E.t += dt; E.grudou.length = 0; E.bipe.length = 0; E.explodiu.length = 0

  // a bola de luz: o núcleo cresce e os cubos fecham nele, girando
  const k = E.orbe.k
  if (k > 0.01) {
    C.setMatrixAt(0, _m.compose(E.orbe.p, _q.setFromEuler(_e.set(E.t * 6, E.t * 4, 0)), _s.setScalar(0.08 + 0.22 * k + 0.02 * Math.sin(E.t * 40))))
    for (let i = 1; i < N_ORBE; i++) {
      const a = E.t * (5 + k * 6) + i * 1.05, r = 0.5 - 0.3 * k
      _o.set(Math.cos(a) * r, Math.sin(a * 1.3 + i) * r * 0.6, Math.sin(a) * r).add(E.orbe.p)
      C.setMatrixAt(i, _m.compose(_o, _q.setFromEuler(_e.set(a, a * 0.7, 0)), _s.setScalar(0.05 + 0.03 * k)))
    }
  } else for (let i = 0; i < N_ORBE; i++) C.setMatrixAt(i, ZERO)

  // as bombas
  E.bombas.forEach((b, n) => {
    const i0 = I_BOMBA + n * POR_BOMBA
    if (b.estado === 'livre') return
    b.t += dt
    let aceso = 0
    if (b.estado === 'voa') {
      const d = _o.copy(b.alvo).sub(b.p).length(), passo = B.vel * dt
      if (d <= passo) { b.p.copy(b.alvo); b.estado = 'presa'; b.t = 0; b.pisca = 0; E.grudou.push(b.p.clone()) }
      else b.p.addScaledVector(_o, passo / d)
      if ((b.rastro -= dt) <= 0) { b.rastro = 0.03; parte(E, b.p, v.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).multiplyScalar(0.4), 0.3, 0.09, 0) }
    }
    if (b.estado === 'presa') {
      const u = Math.min(1, b.t / B.explode), periodo = B.pisca[0] + (B.pisca[1] - B.pisca[0]) * u
      if ((b.pisca -= dt) <= 0) { b.pisca = periodo; E.bipe.push(b.p.clone()) }
      aceso = b.pisca > periodo * 0.45 ? 1 : 0
      if (b.t >= B.explode) { // explode: os estilhaços e os anéis que abrem no chão
        b.estado = 'livre'; E.explodiu.push(b.p.clone())
        for (let i = 0; i < 26; i++) {
          v.set(Math.random() - 0.5, Math.random() - 0.3, Math.random() - 0.5).normalize().multiplyScalar(B.raio * (2 + Math.random() * 2.5))
          parte(E, b.p, v, 0.3 + Math.random() * 0.35, 0.1 + Math.random() * 0.16, 3)
        }
        anel(E, _o.copy(b.p).setY(chao + 0.04), 0.3, B.raio, 0.35, BRANCO); anel(E, _o.copy(b.p).setY(chao + 0.05), 0.1, B.raio * 0.7, 0.5, VERMELHO)
        for (let i = 0; i < POR_BOMBA; i++) C.setMatrixAt(i0 + i, ZERO)
        E.aneis.setMatrixAt(n, ZERO)
        return
      }
    }
    // o núcleo (gira no voo; preso, pulsa) e os seis espinhos (saem quando ela gruda; acesa, esticam)
    const presa = b.estado === 'presa', sai = presa ? Math.min(1, b.t / 0.15) : 0
    _q.setFromEuler(_e.set(presa ? 0.6 : b.t * 9, presa ? 0.6 : b.t * 7, 0))
    C.setMatrixAt(i0, _m.compose(b.p, _q, _s.setScalar(B.tam * (1 + 0.18 * aceso))))
    C.setColorAt(i0, aceso ? VERMELHO : presa ? AZUL : BRANCO)
    EIXOS.forEach((eixo, i) => {
      const len = B.espinho * sai * (1 + 0.3 * aceso)
      _o.copy(eixo).applyQuaternion(_q)
      _g.setFromUnitVectors(FRENTE, _o)
      C.setMatrixAt(i0 + 1 + i, _m.compose(_o.multiplyScalar(B.tam * 0.4 + len / 2).add(b.p), _g, _s.set(0.07, 0.07, len)))
      C.setColorAt(i0 + 1 + i, aceso ? VERMELHO : BRANCO)
    })
    // o círculo no chão: até onde a explosão pega (pisca junto)
    if (presa) {
      E.aneis.setMatrixAt(n, _m.compose(_o.copy(b.p).setY(chao + 0.03), _q.identity(), _s.setScalar(B.raio)))
      E.aneis.setColorAt(n, _c.copy(aceso ? VERMELHO : AZUL).multiplyScalar(aceso ? 0.9 : 0.35))
    }
  })

  // os cubos soltos (o rastro, os estilhaços, o teletransporte)
  E.partes.forEach((x, i) => {
    if (x.t >= x.vida) { if (x.tam) { x.tam = 0; C.setMatrixAt(I_PARTE + i, ZERO) } return }
    x.t += dt; x.v.multiplyScalar(Math.exp(-3 * dt)); x.v.y -= x.peso * dt; x.p.addScaledVector(x.v, dt)
    const u = 1 - x.t / x.vida
    C.setMatrixAt(I_PARTE + i, u > 0 ? _m.compose(x.p, _q.setFromEuler(_e.set(x.t * 6 + i, x.t * 4, i)), _s.setScalar(x.tam * u)) : ZERO)
  })
  // os anéis soltos (a explosão, o teletransporte)
  E.soltos.forEach((a, i) => {
    const j = N_BOMBAS + i
    if (a.t >= a.dur) { if (a.r1 || a.r0) { a.r1 = a.r0 = 0; E.aneis.setMatrixAt(j, ZERO) } return }
    a.t += dt
    const u = Math.min(1, a.t / a.dur), r = a.r0 + (a.r1 - a.r0) * (1 - (1 - u) ** 2)
    E.aneis.setMatrixAt(j, _m.compose(a.p, _q.identity(), _s.setScalar(Math.max(0.01, r))))
    E.aneis.setColorAt(j, _c.copy(a.cor).multiplyScalar(1 - u))
  })
  C.instanceMatrix.needsUpdate = true; E.aneis.instanceMatrix.needsUpdate = true
  if (C.instanceColor) C.instanceColor.needsUpdate = true
  if (E.aneis.instanceColor) E.aneis.instanceColor.needsUpdate = true
}

export function descartarEfeitos(E: EfeitosAsaTerror) {
  for (const m of [E.cubos, E.aneis]) { m.geometry.dispose(); (m.material as THREE.Material).dispose() }
}

/** Tira tudo o que está no ar e no chão (a bola, as bombas, os cubos, os anéis): a horda recomeçou. */
export function limparEfeitos(E: EfeitosAsaTerror) {
  E.orbe.k = 0
  for (const b of E.bombas) b.estado = 'livre'
  for (const x of E.partes) x.t = x.vida
  for (const a of E.soltos) a.t = a.dur
  for (const m of [E.cubos, E.aneis]) { for (let i = 0; i < m.count; i++) m.setMatrixAt(i, ZERO); m.instanceMatrix.needsUpdate = true }
}
