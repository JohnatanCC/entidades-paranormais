// As orbes de energia espectral (26/nov, docs/jogo.md): a munição da Besta espectral. Cada bala que acerta um inimigo
// solta uma bolinha de luz ali (a pistola, que atira rápido, é quem carrega melhor); ela salta, desce até perto do chão e
// fica boiando. Quando o agente chega perto, ela voa até ele e é absorvida (a munição sobe). Sem ninguém pegar, some
// depois de um tempo (piscando no fim).
// Leve: todas são uma malha só (cópias de um cubo que brilha), num estoque fixo; cheio, a mais velha dá lugar.
// Cada jogador vê e pega as suas (as que as balas dele soltaram): não vão pela rede. Os números em numeros.ts (ORBE).
import * as THREE from 'three'
import { aplicarBrilho } from '../../render/brilho'
import { ORBE } from './numeros'

interface Orbe { viva: boolean; p: THREE.Vector3; v: THREE.Vector3; t: number; chao: number; fase: number; puxada: boolean }
export interface Orbes { grupo: THREE.Group; malha: THREE.InstancedMesh; orbes: Orbe[] }

const ZERO = new THREE.Matrix4().makeScale(0, 0, 0), COR = new THREE.Color(ORBE.cor)
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _e = new THREE.Euler(), _d = new THREE.Vector3()

export function novasOrbes(): Orbes {
  const grupo = new THREE.Group(); grupo.name = 'orbes'
  const malha = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), aplicarBrilho(new THREE.MeshBasicMaterial()), ORBE.max)
  malha.frustumCulled = false; malha.visible = false
  for (let i = 0; i < ORBE.max; i++) { malha.setMatrixAt(i, ZERO); malha.setColorAt(i, COR) }
  grupo.add(malha)
  return { grupo, malha, orbes: Array.from({ length: ORBE.max }, (): Orbe => ({ viva: false, p: new THREE.Vector3(), v: new THREE.Vector3(), t: 0, chao: 0, fase: 0, puxada: false })) }
}

/** Uma bala acertou um inimigo em p: solta uma orbe ali. chao = a altura do chão embaixo dela. */
export function soltarOrbe(O: Orbes, p: THREE.Vector3, chao: number) {
  const o = O.orbes.find((x) => !x.viva) ?? O.orbes.reduce((a, b) => (b.t > a.t ? b : a)) // cheio: a mais velha
  const a = Math.random() * Math.PI * 2
  o.viva = true; o.t = 0; o.chao = chao; o.fase = Math.random() * 6.28; o.puxada = false
  o.p.copy(p); o.v.set(Math.cos(a) * ORBE.salto, ORBE.salto * (1 + Math.random()), Math.sin(a) * ORBE.salto)
}

/** Um quadro. peito = onde o agente as absorve (null: não pode pegar agora). Devolve quanta munição ele absorveu. */
export function passoOrbes(O: Orbes, dt: number, peito: THREE.Vector3 | null): number {
  let algo = false, ganhou = 0
  O.orbes.forEach((o, i) => {
    if (!o.viva) return
    o.t += dt
    const d = peito ? _d.subVectors(peito, o.p).length() : Infinity
    if (d < ORBE.pega) { o.viva = false; ganhou += ORBE.vale; O.malha.setMatrixAt(i, ZERO); algo = true; return }
    if (o.t > ORBE.vida) { o.viva = false; O.malha.setMatrixAt(i, ZERO); algo = true; return }
    if (o.puxada || (d < ORBE.ima && o.t > ORBE.espera)) { // o agente chegou perto: voa até ele, cada vez mais rápido
      o.puxada = true
      o.p.addScaledVector(_d, Math.min(1, ((ORBE.vel + o.t * 2) * dt) / d))
    } else { // salta, desce e fica boiando perto do chão
      o.v.y -= ORBE.peso * dt; o.v.multiplyScalar(Math.exp(-2.5 * dt)); o.p.addScaledVector(o.v, dt)
      const piso = o.chao + ORBE.altura + 0.05 * Math.sin(o.t * 3 + o.fase)
      if (o.p.y < piso) { o.p.y = piso; o.v.y = 0 }
    }
    // pulsa; no fim da vida, pisca
    const fim = ORBE.vida - o.t, pisca = fim < 3 && Math.sin(o.t * 18) < 0 ? 0.35 : 1
    O.malha.setMatrixAt(i, _m.compose(o.p, _q.setFromEuler(_e.set(o.t * 2, o.t * 3 + o.fase, 0)), _s.setScalar(ORBE.tam * (1 + 0.2 * Math.sin(o.t * 6 + o.fase)) * pisca)))
    algo = true
  })
  O.malha.visible = algo || O.orbes.some((o) => o.viva)
  if (algo) O.malha.instanceMatrix.needsUpdate = true
  return ganhou
}
