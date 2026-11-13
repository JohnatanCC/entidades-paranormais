// A bala de verdade (a etapa 4b, docs/demonios.md): sai do cano para o ponto que a mira cobre (pontoMirado: o primeiro
// demônio, parede ou chão na linha da câmera), voa (um risco que
// brilha, da cor do tiro), bate na parede, num objeto, no chão ou no teto (as faíscas e a marca: impacto.ts) e acerta
// o que tiver na frente: quem pode levar tiro (os demônios) se apresenta numa lista de caixas (Alvejavel: generosas,
// maiores que o corpo, alinhadas com o mundo), e a bala chama quem acertou. A pistola: uma bala; a escopeta: os bagos em leque. Os números em numeros.ts (BALA).
// Leve: todas as balas são uma malha só (cópias de um cubo), num estoque fixo; a procura da parede usa uma grade das
// caixas do mundo (feita uma vez), não o mapa inteiro.
import * as THREE from 'three'
import { aplicarBrilho } from '../../render/brilho'
import { chaoEm, temChao, tetoEm, type Mundo } from '../world/colisao'
import { faiscas, marca, type Impactos } from './impacto'
import { BALA, TIRO } from './numeros'

/** Quem pode levar tiro: uma caixa alinhada com o mundo (o centro e as meias medidas, m) e o que fazer quando a bala
 *  acerta. */
export interface Alvejavel { c: THREE.Vector3; m: THREE.Vector3; acerta: (dano: number, ponto: THREE.Vector3, dir: THREE.Vector3) => void }
/** p está dentro da caixa do alvo? */
export const dentro = (a: Alvejavel, p: THREE.Vector3) => Math.abs(p.x - a.c.x) < a.m.x && Math.abs(p.y - a.c.y) < a.m.y && Math.abs(p.z - a.c.z) < a.m.z
type ArmaDeTiro = 'pistola' | 'escopeta'

const MAX = 48
interface Bala { viva: boolean; p: THREE.Vector3; v: THREE.Vector3; dist: number; arma: ArmaDeTiro }
export interface Balas { grupo: THREE.Group; malha: THREE.InstancedMesh; balas: Bala[] }

const ZERO = new THREE.Matrix4().makeScale(0, 0, 0)
export function novasBalas(): Balas {
  const grupo = new THREE.Group(); grupo.name = 'balas'
  const malha = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), aplicarBrilho(new THREE.MeshBasicMaterial()), MAX)
  malha.frustumCulled = false; malha.visible = false
  for (let i = 0; i < MAX; i++) { malha.setMatrixAt(i, ZERO); malha.setColorAt(i, new THREE.Color('#fff')) }
  grupo.add(malha)
  return { grupo, malha, balas: Array.from({ length: MAX }, () => ({ viva: false, p: new THREE.Vector3(), v: new THREE.Vector3(), dist: 0, arma: 'pistola' as ArmaDeTiro })) }
}

const _d = new THREE.Vector3(), _x = new THREE.Vector3(), _y = new THREE.Vector3(), _c = new THREE.Color()
/** Um tiro: as balas da arma saem de `de` (o cano) para `para` (o ponto mirado); a escopeta abre o leque. A conta começa
 *  `atras` m antes do cano, na mesma linha (no peito): quem está colado no agente também leva o tiro. */
export function atirar(B: Balas, arma: ArmaDeTiro, de: THREE.Vector3, para: THREE.Vector3, atras = 0.8) {
  const N = BALA[arma]
  _d.subVectors(para, de).normalize()
  _x.crossVectors(_d, Math.abs(_d.y) > 0.95 ? _y.set(1, 0, 0) : _y.set(0, 1, 0)).normalize(); _y.crossVectors(_x, _d)
  for (let k = 0; k < N.n; k++) {
    const i = B.balas.findIndex((b) => !b.viva), b = B.balas[i < 0 ? 0 : i]
    const a = Math.random() * Math.PI * 2, r = N.leque * Math.sqrt(Math.random()) // espalhado dentro do cone
    b.v.copy(_d).addScaledVector(_x, Math.cos(a) * r).addScaledVector(_y, Math.sin(a) * r).normalize().multiplyScalar(N.vel)
    b.viva = true; b.dist = 0; b.arma = arma; b.p.copy(de).addScaledVector(_d, -atras)
    B.malha.setColorAt(i < 0 ? 0 : i, _c.set(TIRO[arma].cor))
  }
  B.malha.instanceColor!.needsUpdate = true
}

// ---------- a parede: as caixas do mundo numa grade de 2 m (feita uma vez por mundo) ----------
type Caixa = Mundo['caixas'][number]
const grades = new WeakMap<Mundo, Map<string, Caixa[]>>()
const CEL = 2
function gradeDe(m: Mundo) {
  let g = grades.get(m)
  if (g) return g
  g = new Map()
  for (const o of m.caixas) {
    if (o.vazado) continue // o guarda-corpo vazado: a bala passa
    const r = Math.hypot(o.hx, o.hz)
    for (let cx = Math.floor((o.x - r) / CEL); cx <= Math.floor((o.x + r) / CEL); cx++)
      for (let cz = Math.floor((o.z - r) / CEL); cz <= Math.floor((o.z + r) / CEL); cz++) {
        const k = `${cx}_${cz}`, l = g.get(k); if (l) l.push(o); else g.set(k, [o])
      }
  }
  grades.set(m, g)
  return g
}
/** A bala em p bateu numa caixa? Devolve a normal da face mais perto (em n), ou false. */
function naCaixa(m: Mundo, p: THREE.Vector3, n: THREE.Vector3): boolean {
  const l = gradeDe(m).get(`${Math.floor(p.x / CEL)}_${Math.floor(p.z / CEL)}`)
  if (!l) return false
  for (const o of l) {
    if (p.y < o.y0 || p.y > o.y1 || (o.porta && m.abertas.has(o.porta))) continue
    const c = Math.cos(o.yaw), s = Math.sin(o.yaw), dx = p.x - o.x, dz = p.z - o.z
    const lx = dx * c - dz * s, lz = dx * s + dz * c
    if (Math.abs(lx) > o.hx || Math.abs(lz) > o.hz) continue
    // a face mais perto: de lado (x ou z) ou a de cima
    const px = o.hx - Math.abs(lx), pz = o.hz - Math.abs(lz), py = o.y1 - p.y
    if (py < px && py < pz) n.set(0, 1, 0)
    else if (px < pz) n.set(Math.sign(lx) * c, 0, -Math.sign(lx) * s)
    else n.set(Math.sign(lz) * s, 0, Math.sign(lz) * c)
    return true
  }
  return false
}

/** p bateu no mundo (o chão onde tem, o teto, uma caixa)? A normal vai em n (e p vai para a superfície no chão e no teto). */
function bateNoMundo(m: Mundo, p: THREE.Vector3, n: THREE.Vector3): boolean {
  const chao = temChao(m, p.x, p.z, p.y) ? chaoEm(m, p.x, p.z, p.y + 0.3) : null, teto = tetoEm(m, p.x, p.z, p.y - 0.3)
  if (chao !== null && p.y <= chao) { n.set(0, 1, 0); p.y = chao; return true }
  if (teto !== null && p.y >= teto) { n.set(0, -1, 0); p.y = teto; return true }
  return naCaixa(m, p, n)
}

const _r = new THREE.Vector3(), _rn = new THREE.Vector3()
/** O ponto que a mira cobre: andando pela linha (de, na direção dir), o meio do primeiro alvo, a parede ou o chão; nada até o
 *  alcance, o ponto lá longe. A bala vai para lá (do cano), e não para um ponto fixo à frente da câmera. */
export function pontoMirado(m: Mundo, alvos: Alvejavel[], de: THREE.Vector3, dir: THREE.Vector3, out: THREE.Vector3, longe = BALA.alcance): THREE.Vector3 {
  for (let t = 0.5; t < longe; t += 0.25) {
    _r.copy(de).addScaledVector(dir, t)
    const alvo = alvos.find((a) => dentro(a, _r))
    if (alvo) return out.copy(alvo.c) // a mira em cima de um demônio: o tiro vai no meio dele (não na borda)
    if (bateNoMundo(m, _r, _rn)) return out.copy(_r)
  }
  return out.copy(de).addScaledVector(dir, longe)
}

const _p = new THREE.Vector3(), _n = new THREE.Vector3(), _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _z = new THREE.Vector3(0, 0, 1), _dir = new THREE.Vector3()
/** Um quadro: as balas andam em passos curtos; a primeira coisa que encontram (um alvo, uma caixa, o chão, o teto) as para.
 *  aoBater: onde bateu (o som: weapons/sons.ts), e se foi num alvo. */
export function passoBalas(B: Balas, dt: number, m: Mundo, alvos: Alvejavel[], I: Impactos, aoBater?: (p: THREE.Vector3, arma: ArmaDeTiro, alvo: boolean) => void) {
  let algo = false
  B.balas.forEach((b, i) => {
    if (!b.viva) return
    const total = b.v.length() * dt, passos = Math.max(1, Math.ceil(total / BALA.passo))
    _dir.copy(b.v).normalize()
    for (let k = 0; k < passos && b.viva; k++) {
      _p.copy(b.p).addScaledVector(b.v, dt / passos)
      // um alvo (o primeiro que a bala atravessa)
      const alvo = alvos.find((a) => dentro(a, _p))
      if (alvo) { b.viva = false; alvo.acerta(BALA[b.arma].dano, _p.clone(), _dir.clone()); faiscas(I, _p, _n.copy(_dir).negate(), TIRO[b.arma].cor, 3); aoBater?.(_p, b.arma, true); break }
      // o chão (onde tem: no mapa sem chão, o vazio não para a bala), o teto e as caixas (paredes, portas, objetos)
      if (bateNoMundo(m, _p, _n)) { b.viva = false; faiscas(I, _p, _n, TIRO[b.arma].cor); marca(I, _p, _n); aoBater?.(_p, b.arma, false); break }
      b.p.copy(_p); b.dist += total / passos
      if (b.dist > BALA.alcance) b.viva = false
    }
    // o risco: atrás da bala, na direção do voo
    const tam = BALA[b.arma].tam
    B.malha.setMatrixAt(i, b.viva ? _m.compose(_p.copy(b.p).addScaledVector(_dir, -tam / 2), _q.setFromUnitVectors(_z, _dir), _s.set(0.03, 0.03, tam)) : ZERO)
    algo = true
  })
  B.malha.visible = algo
  if (algo) B.malha.instanceMatrix.needsUpdate = true
}
