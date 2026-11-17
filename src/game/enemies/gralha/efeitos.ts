// O que a Gralha solta quando leva tiro (docs/cap2-sombra.md): as penas que caem a cada tiro e, com a vida zerada, o
// estouro em fumaça com mais penas. Não é animação de morte: o corpo some na hora e o efeito fica no lugar.
// Leve: as penas de todas as Gralhas são uma malha só (InstancedMesh) e as nuvens outra (../nuvens.ts), num estoque
// fixo (nada é criado no meio da luta). Ponha `grupo` na cena uma vez.
import * as THREE from 'three'
import { novasNuvens, type Nuvens } from '../nuvens'
import { PENAS, SOPRO } from './numeros'

const N_PENAS = 60, N_NUVENS = 30
const CORES = ['#271d37', '#33264a', '#1d1528', '#45366a'].map((c) => new THREE.Color(c))

export interface EfeitosGralha {
  grupo: THREE.Group
  penas: THREE.InstancedMesh; pp: Float32Array; pv: Float32Array; pr: Float32Array; pt: Float32Array; pvida: Float32Array; pchao: Float32Array; proxP: number
  nuvens: Nuvens; np: Float32Array; nv: Float32Array; nt: Float32Array; nvida: Float32Array; ntam: Float32Array; proxN: number
}

const rnd = (a: number, b: number) => a + Math.random() * (b - a)

export function novosEfeitosGralha(): EfeitosGralha {
  const grupo = new THREE.Group(); grupo.name = 'efeitos-gralha'
  // a pena: uma lasca comprida e fina
  const penas = new THREE.InstancedMesh(new THREE.BoxGeometry(PENAS.tamanho[0], 0.012, PENAS.tamanho[1]), new THREE.MeshBasicMaterial(), N_PENAS)
  penas.frustumCulled = false
  const zero = new THREE.Matrix4().makeScale(0, 0, 0)
  for (let i = 0; i < N_PENAS; i++) { penas.setMatrixAt(i, zero); penas.setColorAt(i, CORES[i % CORES.length]) }
  const nuvens = novasNuvens(N_NUVENS, SOPRO.cor)
  grupo.add(penas, nuvens.malha)
  return {
    grupo, penas, pp: new Float32Array(N_PENAS * 3), pv: new Float32Array(N_PENAS * 3), pr: new Float32Array(N_PENAS * 3), pt: new Float32Array(N_PENAS).fill(99),
    pvida: new Float32Array(N_PENAS), pchao: new Float32Array(N_PENAS), proxP: 0,
    nuvens, np: new Float32Array(N_NUVENS * 3), nv: new Float32Array(N_NUVENS * 3), nt: new Float32Array(N_NUVENS).fill(99), nvida: new Float32Array(N_NUVENS), ntam: new Float32Array(N_NUVENS), proxN: 0,
  }
}

/** `n` penas saem de `centro` (no mundo), espalhadas com a força `k`, e caem devagar até o chão (na altura `chao`). */
export function soltarPenas(E: EfeitosGralha, centro: THREE.Vector3, n: number, chao = 0, k = 1) {
  for (let j = 0; j < n; j++) {
    const i = E.proxP; E.proxP = (E.proxP + 1) % N_PENAS
    const a = Math.random() * Math.PI * 2, fora = rnd(PENAS.vel[0], PENAS.vel[1]) * k
    E.pp.set([centro.x + rnd(-0.12, 0.12), centro.y + rnd(-0.1, 0.1), centro.z + rnd(-0.12, 0.12)], i * 3)
    E.pv.set([Math.cos(a) * fora, rnd(0.2, 1.4) * k, Math.sin(a) * fora], i * 3)
    E.pr.set([Math.random() * 6, Math.random() * 6, rnd(2, 5) * (Math.random() < 0.5 ? -1 : 1)], i * 3) // o giro, a fase do balanço, o quanto roda
    E.pt[i] = 0; E.pvida[i] = rnd(PENAS.vida[0], PENAS.vida[1]); E.pchao[i] = chao
  }
}

/** A Gralha estoura em fumaça em `centro` (no mundo): as nuvens abrem para fora e somem; mais penas. */
export function estourarEmFumaca(E: EfeitosGralha, centro: THREE.Vector3, chao = 0) {
  for (let j = 0; j < SOPRO.nuvens; j++) {
    const i = E.proxN; E.proxN = (E.proxN + 1) % N_NUVENS
    const a = Math.random() * Math.PI * 2, b = rnd(-0.6, 0.9), fora = rnd(SOPRO.vel[0], SOPRO.vel[1])
    E.np.set([centro.x, centro.y, centro.z], i * 3)
    E.nv.set([Math.cos(a) * Math.cos(b) * fora, Math.sin(b) * fora + 0.25, Math.sin(a) * Math.cos(b) * fora], i * 3)
    E.nt[i] = 0; E.nvida[i] = rnd(SOPRO.vida[0], SOPRO.vida[1]); E.ntam[i] = rnd(SOPRO.tamanho[0], SOPRO.tamanho[1])
    E.nuvens.giro.array[i] = Math.floor(Math.random() * 4) * (Math.PI / 2)
  }
  E.nuvens.giro.needsUpdate = true
  soltarPenas(E, centro, SOPRO.penas, chao, 1.6)
}

const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _s = new THREE.Vector3(), _p = new THREE.Vector3()

/** Um quadro: as penas caem devagar, balançando, pousam e somem; as nuvens abrem, freiam e somem. */
export function passoEfeitosGralha(E: EfeitosGralha, dt: number) {
  const P = PENAS
  for (let i = 0; i < N_PENAS; i++) {
    if (E.pt[i] > E.pvida[i]) continue
    const k = i * 3, t = (E.pt[i] += dt)
    if (t > E.pvida[i]) { E.penas.setMatrixAt(i, _m.makeScale(0, 0, 0)); continue }
    const noChao = E.pp[k + 1] <= E.pchao[i] + 0.01
    if (!noChao) {
      // o ar segura a pena: ela freia, cai devagar e vai de um lado para o outro
      const f = Math.exp(-P.freia * dt)
      E.pv[k] *= f; E.pv[k + 2] *= f
      E.pv[k + 1] = Math.max(-P.cai, E.pv[k + 1] - P.gravidade * dt)
      const vai = Math.sin(t * P.balanca + E.pr[k + 1]) * P.largura
      E.pp[k] += (E.pv[k] + vai) * dt; E.pp[k + 1] = Math.max(E.pchao[i] + 0.008, E.pp[k + 1] + E.pv[k + 1] * dt); E.pp[k + 2] += (E.pv[k + 2] + vai * 0.6) * dt
      E.pr[k] += E.pr[k + 2] * dt
    }
    const resta = E.pvida[i] - t, s = Math.min(1, resta / P.some)
    _e.set(noChao ? 0 : Math.sin(t * P.balanca + E.pr[k + 1]) * 0.9, E.pr[k], noChao ? 0 : Math.cos(t * P.balanca * 0.7 + E.pr[k + 1]) * 0.6)
    E.penas.setMatrixAt(i, _m.compose(_p.set(E.pp[k], E.pp[k + 1], E.pp[k + 2]), _q.setFromEuler(_e), _s.setScalar(s)))
  }
  E.penas.instanceMatrix.needsUpdate = true
  const S = SOPRO, N = E.nuvens
  for (let i = 0; i < N_NUVENS; i++) {
    if (E.nt[i] > E.nvida[i]) continue
    const k = i * 3, t = (E.nt[i] += dt)
    if (t > E.nvida[i]) { N.malha.setMatrixAt(i, _m.makeScale(0, 0, 0)); N.forca.array[i] = 0; continue }
    const f = Math.exp(-S.freia * dt)
    E.nv[k] *= f; E.nv[k + 1] = E.nv[k + 1] * f + S.sobe * dt; E.nv[k + 2] *= f
    E.np[k] += E.nv[k] * dt; E.np[k + 1] += E.nv[k + 1] * dt; E.np[k + 2] += E.nv[k + 2] * dt
    const vida = t / E.nvida[i], s = E.ntam[i] * (0.5 + vida * S.cresce)
    N.forca.array[i] = S.forca * Math.min(1, t / 0.06) * (1 - vida) ** 1.3
    N.malha.setMatrixAt(i, _m.makeScale(s, s, s).setPosition(E.np[k], E.np[k + 1], E.np[k + 2]))
  }
  N.malha.instanceMatrix.needsUpdate = true; N.forca.needsUpdate = true
}
