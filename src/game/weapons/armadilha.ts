// A armadilha jogada: voa em arco (a gravidade), gruda no chão ou na parede (virada para fora) e volta para a mão quando
// chamada. É uma cópia do modelo solta no mundo; a da mão some enquanto ela está fora. Mirando com a armadilha, a linha
// do arco mostra por onde ela vai e a marca, onde cai (a mesma conta do voo). A captura (abrir a íris, o raio, puxar a
// poça) vem quando houver fantasma. Os números em numeros.ts (ARREMESSO).
import * as THREE from 'three'
import { arma3d } from '../../render/objetos3d'
import { batidaEm, chaoEm, PASSO, tetoEm, type Mundo } from '../world/colisao'
import type { Agente } from '../player/modelo'
import { ARREMESSO as R, TIRO } from './numeros'

export type EstadoArmadilha = 'mao' | 'voando' | 'presa' | 'voltando'
/** t = s desde que mudou de estado (voando: o tempo de voo; presa: há quanto tempo está presa). */
export interface Armadilha { estado: EstadoArmadilha; pos: THREE.Vector3; vel: THREE.Vector3; t: number; obj: THREE.Object3D | null }
export const novaArmadilha = (): Armadilha => ({ estado: 'mao', pos: new THREE.Vector3(), vel: new THREE.Vector3(), t: 0, obj: null })

const CIMA = new THREE.Vector3(0, 1, 0)
const _n = new THREE.Vector3(), _a = new THREE.Vector3()

/** Um pedaço do voo (dt): a gravidade e a batida. Devolve a normal da superfície onde grudou (ou null: segue voando). */
function voar(m: Mundo, pos: THREE.Vector3, vel: THREE.Vector3, dt: number, normal: THREE.Vector3): boolean {
  const n = Math.max(1, Math.ceil((vel.length() * dt) / R.passo)), h = dt / n
  for (let i = 0; i < n; i++) {
    _a.copy(pos)
    vel.y -= 9.8 * h
    pos.addScaledVector(vel, h)
    // o chão (o térreo, os pisos de cima, as escadas): só os que estão embaixo de onde ela estava (chaoEm aceita um degrau
    // acima dos pés; aqui não, senão ela grudaria no piso de cima passando por baixo dele)
    const chao = chaoEm(m, pos.x, pos.z, _a.y - PASSO)
    if (chao !== null && pos.y <= chao) { pos.y = chao; normal.copy(CIMA); return true }
    // o teto: bate e desce
    const teto = tetoEm(m, pos.x, pos.z, _a.y)
    if (teto !== null && pos.y > teto - 0.05) { pos.y = teto - 0.05; vel.y = -Math.abs(vel.y) * 0.3 }
    // a parede (ou um móvel): gruda nela, virada para fora
    const b = batidaEm(m, pos.x, pos.y, pos.z)
    if (b) { pos.x = _a.x; pos.z = _a.z; normal.set(b.nx, 0, b.nz); return true }
  }
  return false
}

/** Para onde ela vai se sair agora de `de` (no mundo) mirando em `alvo`: a velocidade inicial. */
export function velocidadeDoArremesso(de: THREE.Vector3, alvo: THREE.Vector3, out: THREE.Vector3): THREE.Vector3 {
  return out.subVectors(alvo, de).normalize().multiplyScalar(R.forca).addScaledVector(CIMA, R.sobe)
}

/** O arremesso no corpo: apertou com a armadilha na mão e a mira levantada, começa; devolve true no quadro em que ela
 *  sai da mão (aí quem joga chama lancar). Chame a cada quadro. */
export function gatilhoArmadilha(a: Agente, apertado: boolean, dt: number): boolean {
  const A = a.anim.arma
  if (A.lanca < 0) {
    if (apertado && a.arma === 'armadilha' && !A.fora && A.mira >= TIRO.pronto) A.lanca = 0
    return false
  }
  const antes = A.lanca, solta = R.dura * R.soltaEm
  A.lanca += dt
  if (A.lanca >= R.dura) A.lanca = -1
  return antes < solta && antes + dt >= solta
}

const _s = new THREE.Vector3()
/** De onde a armadilha sai (no mundo): à frente do ombro direito, onde a lanterna está quando sai da mão (ARREMESSO.solta, no espaço do agente). */
export const pontoDeSoltar = (a: Agente, out = _s) => { a.root.updateWorldMatrix(true, false); return a.root.localToWorld(out.fromArray(R.solta)) }

/** Joga a armadilha (de onde, com que velocidade). cena = onde a cópia solta fica (a cena do three). */
export function lancar(m: Armadilha, cena: THREE.Object3D, de: THREE.Vector3, vel: THREE.Vector3) {
  if (!m.obj) m.obj = arma3d('armadilha')
  if (m.obj.parent !== cena) cena.add(m.obj)
  m.obj.visible = true
  m.estado = 'voando'; m.t = 0; m.pos.copy(de); m.vel.copy(vel)
  m.obj.position.copy(de); m.obj.rotation.set(0, Math.random() * 6, 0)
}

/** Presa em algum lugar: chama de volta para a mão. */
export function chamar(m: Armadilha) { if (m.estado === 'presa' || m.estado === 'voando') { m.estado = 'voltando'; m.t = 0 } }

/** Volta na hora (trocou de arma, saiu do Testar): a cópia some. */
export function recolher(m: Armadilha) { m.estado = 'mao'; if (m.obj) { m.obj.visible = false; m.obj.removeFromParent() } }

/** Um quadro da armadilha fora da mão. mao = onde a mão está (no mundo), para a volta. Devolve true quando ela chega. */
export function passoArmadilha(m: Armadilha, mundo: Mundo, mao: THREE.Vector3, dt: number): boolean {
  const o = m.obj
  if (!o || m.estado === 'mao') return false
  m.t += dt
  if (m.estado === 'voando') {
    if (voar(mundo, m.pos, m.vel, dt, _n) || m.t > R.maxVoo) {
      m.estado = 'presa'
      // gruda com a base na superfície: o "em cima" dela aponta para fora
      o.quaternion.setFromUnitVectors(CIMA, m.t > R.maxVoo ? CIMA : _n)
      m.t = 0 // agora conta há quanto tempo está presa
    } else o.rotation.x += dt * 9 // girando no ar
    o.position.copy(m.pos)
  } else if (m.estado === 'voltando') {
    _a.subVectors(mao, m.pos)
    const d = _a.length()
    if (d < R.chega) { recolher(m); return true }
    m.pos.addScaledVector(_a, Math.min(1, (R.volta * dt) / d))
    o.position.copy(m.pos); o.rotation.y += dt * 12
  }
  return false
}

// ---------- a linha do arco e a marca de onde ela cai (mirando) ----------
export interface Arco { linha: THREE.Line; marca: THREE.Mesh }
const _p = new THREE.Vector3(), _v = new THREE.Vector3()

/** A linha (pontilhada, âmbar) e a marca (um anel). Uma chamada de desenho cada, só enquanto mira. */
export function novoArco(): Arco {
  const geo = new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(R.arco.pontos * 3), 3))
  const linha = new THREE.Line(geo, new THREE.LineDashedMaterial({ color: '#e8b765', dashSize: 0.18, gapSize: 0.12, transparent: true, opacity: 0.85 }))
  linha.frustumCulled = false
  const marca = new THREE.Mesh(new THREE.RingGeometry(0.16, 0.22, 16), new THREE.MeshBasicMaterial({ color: '#e8b765', transparent: true, opacity: 0.9, side: THREE.DoubleSide, depthWrite: false }))
  linha.visible = marca.visible = false
  return { linha, marca }
}

/** Tira o arco da cena e libera a memória dele (saiu do Testar). */
export function descartarArco(a: Arco) {
  for (const o of [a.linha, a.marca]) { o.removeFromParent(); o.geometry.dispose(); (o.material as THREE.Material).dispose() }
}

/** Desenha o arco a partir de `de` com a velocidade `vel` (o mesmo voo de verdade); a marca no fim, deitada na superfície. */
export function desenharArco(a: Arco, mundo: Mundo, de: THREE.Vector3, vel: THREE.Vector3) {
  const pos = a.linha.geometry.attributes.position as THREE.BufferAttribute
  _p.copy(de); _v.copy(vel)
  let n = 0, bateu = false
  pos.setXYZ(n++, _p.x, _p.y, _p.z)
  while (n < R.arco.pontos && !bateu) { bateu = voar(mundo, _p, _v, R.arco.dt, _n); pos.setXYZ(n++, _p.x, _p.y, _p.z) }
  pos.needsUpdate = true
  a.linha.geometry.setDrawRange(0, n)
  a.linha.computeLineDistances()
  a.linha.visible = true
  a.marca.visible = bateu
  if (bateu) { a.marca.position.copy(_p).addScaledVector(_n, 0.02); a.marca.quaternion.setFromUnitVectors(_a.set(0, 0, 1), _n) }
}
