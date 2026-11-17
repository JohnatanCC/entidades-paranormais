// Os movimentos da Gralha (docs/cap2-sombra.md), feitos em código em cima das pastas do modelo (modelo.ts):
//   voar: o bater de asas, a descida mais rápida que a subida; a ponta bate mais e vem atrasada; o corpo sobe a cada
//     descida e a cabeça fica quase parada no ar (como a de uma ave); ela deita para a frente quando anda e de lado nas
//     curvas; de vez em quando plana;
//   atacar: sobe um pouco com as asas no alto (o aviso), mergulha com as asas fechadas para trás, o corpo apontado para
//     baixo e o bico aberto, bica (o bico fecha: o instante do dano) e sobe de volta batendo as asas depressa;
//   pousada (pousar): em pé, as asas fechadas, o corpo erguido, as pernas para baixo; a cabeça vira aos trancos;
//   o tiro (ferir): acende, leva o tranco, as asas dão um pulo e caem penas (efeitos.ts); com a vida zerada
//     (estourarGralha), o corpo some e fica o estouro em fumaça com penas. Sem animação de morte.
// Quem move o root é quem a controla (a altura do voo, para onde ela vai: ia.ts).
import * as THREE from 'three'
import { piscar } from '../../../render/golpe'
import { animarMolas } from '../../corpo/molas'
import { estourarEmFumaca, soltarPenas, type EfeitosGralha } from './efeitos'
import type { Gralha } from './modelo'
import { ATAQUE, DANO, PLANAR, POUSADA, VOO } from './numeros'

const cl = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x))
const lerp = (a: number, b: number, k: number) => a + (b - a) * k
const damp = (cur: number, alvo: number, k: number, dt: number) => cur + (alvo - cur) * (1 - Math.exp(-k * dt))
const suave = (k: number) => k * k * (3 - 2 * k)
const sorteio = (ab: readonly number[]) => ab[0] + Math.random() * (ab[1] - ab[0])
/** A asa numa fase da batida (0..1): desce rápido, sobe devagar; devolve de `cima` a `baixo`. */
const batida = (fase: number) => {
  const f = ((fase % 1) + 1) % 1, k = f < VOO.desce ? f / VOO.desce : 1 - (f - VOO.desce) / (1 - VOO.desce)
  return lerp(VOO.cima, VOO.baixo, 0.5 - 0.5 * Math.cos(k * Math.PI))
}

/** Começa o ataque (se não estiver atacando, pousada nem estourada). */
export function atacar(g: Gralha) { if (!g.anim.ataque && !g.anim.pousada && !g.anim.estourada) g.anim.ataque = { t: 0, bicou: false } }
/** Em que parte do ataque ela está: o aviso (sobe), o mergulho, a volta; ou null. */
export function parteDoAtaque(g: Gralha): 'sobe' | 'mergulha' | 'volta' | null {
  const T = g.anim.ataque
  return !T ? null : T.t < ATAQUE.sobe ? 'sobe' : T.t < ATAQUE.sobe + ATAQUE.mergulha ? 'mergulha' : 'volta'
}
/** Pousada (em pé, as asas fechadas) ou voando. */
export function pousar(g: Gralha, sim: boolean) { g.anim.pousada = sim; if (sim) g.anim.ataque = null }

const _c = new THREE.Vector3()
/** Um tiro nela: acende, leva o tranco, caem penas. Corta o ataque. Devolve se a vida zerou (quem controla estoura). */
export function ferir(g: Gralha, E: EfeitosGralha, chao = 0): boolean {
  const A = g.anim
  if (A.estourada) return false
  piscar(g.root) // acende (render/golpe.ts)
  A.dano = { t: 0, lado: Math.random() < 0.5 ? -1 : 1 }; A.ataque = null
  soltarPenas(E, g.corpo.getWorldPosition(_c), DANO.penas, chao)
  return --A.vida <= 0
}
/** A vida zerou: estoura em fumaça, com penas (o corpo some na hora; o efeito fica no lugar). */
export function estourarGralha(g: Gralha, E: EfeitosGralha, chao = 0) {
  if (g.anim.estourada) return
  estourarEmFumaca(E, g.corpo.getWorldPosition(_c), chao)
  g.anim.estourada = true; g.anim.ataque = g.anim.dano = null; g.root.visible = false
}
/** Volta inteira (o Ver modelos, depois de estourar). */
export function refazerGralha(g: Gralha) {
  const A = g.anim
  A.estourada = false; A.vida = DANO.vida; A.ataque = A.dano = null; A.ultimo = null; g.molas.pos = null; g.root.visible = true
}

const _p = new THREE.Vector3(), _f = new THREE.Vector3(), _q = new THREE.Quaternion()

/** Um quadro da Gralha. Devolve se neste quadro ela bicou (o bico fechou no fim do mergulho). */
export function animarGralha(g: Gralha, dt: number): boolean {
  dt = Math.min(dt, 0.05)
  const A = g.anim
  if (dt <= 0 || A.estourada) return false
  A.t += dt
  // a velocidade dela (medida): para a frente e para o lado
  g.root.getWorldPosition(_p); g.root.getWorldQuaternion(_q)
  if (A.ultimo) {
    const yaw = Math.atan2(_f.set(0, 0, 1).applyQuaternion(_q).x, _f.z), vx = (_p.x - A.ultimo.x) / dt, vz = (_p.z - A.ultimo.z) / dt
    if (Math.hypot(vx, vz) < 30) {
      A.vel.x = damp(A.vel.x, vx * Math.sin(yaw) + vz * Math.cos(yaw), 6, dt)
      A.vel.z = damp(A.vel.z, vx * Math.cos(yaw) - vz * Math.sin(yaw), 6, dt)
    }
  }
  ;(A.ultimo ??= new THREE.Vector3()).copy(_p)
  // ---------- o ataque: o quanto sobe (o aviso), o quanto as asas fecham (o mergulho) e o bico ----------
  const T = A.ataque, K = ATAQUE
  let sobe = 0, fecha = 0, bico = 0, pressa = 1, bicou = false
  if (T) {
    T.t += dt
    const t1 = K.sobe, t2 = t1 + K.mergulha, t3 = t2 + K.volta
    if (T.t < t1) { sobe = suave(T.t / t1); bico = sobe * 0.5 }
    else if (T.t < t2) { const k = (T.t - t1) / K.mergulha; sobe = 1 - Math.min(1, k * 4); fecha = Math.min(1, k * 5); bico = 1 }
    else { const k = Math.min(1, (T.t - t2) / K.volta); fecha = 1 - suave(Math.min(1, k * 2.5)); sobe = Math.sin(k * Math.PI) * 0.6; pressa = K.pressa }
    if (!T.bicou && T.t >= t2) { T.bicou = true; bicou = true }
    if (T.t >= t3) A.ataque = null
  }
  // ---------- o tiro: o tranco (cai um pouco, tomba de lado, as asas dão um pulo, o bico abre) ----------
  const D = A.dano
  let tranco = 0
  if (D) { D.t += dt; tranco = Math.sin(Math.min(1, D.t / DANO.dura) * Math.PI) * (1 - D.t / DANO.dura); if (D.t >= DANO.dura) A.dano = null }
  // ---------- pousada: entra e sai aos poucos; a cabeça vira aos trancos ----------
  const P = POUSADA
  A.pousa = damp(A.pousa, A.pousada ? 1 : 0, P.entra, dt)
  const pousa = A.pousa, Q = A.tique
  if (A.pousada && (Q.espera -= dt) <= 0) { Q.espera = sorteio(P.tique); Q.y = (Math.random() * 2 - 1) * P.girar; Q.z = (Math.random() * 2 - 1) * P.tombar }
  if (!A.pousada) Q.y = Q.z = 0
  Q.ay = damp(Q.ay, Q.y, 30, dt); Q.az = damp(Q.az, Q.z, 30, dt) // de uma vez, e fica
  fecha = Math.max(fecha, pousa)
  // planar de vez em quando (não no meio do ataque nem pousada)
  if (!T && !A.pousada && !A.planar && (A.proxPlanar -= dt) <= 0) A.planar = { t: 0, dura: sorteio(PLANAR.dura) }
  if (A.planar && ((A.planar.t += dt) >= A.planar.dura || T || A.pousada)) { A.planar = null; A.proxPlanar = sorteio(PLANAR.intervalo) }
  A.bate = damp(A.bate, A.planar || A.pousada ? 0 : 1, 5, dt)
  A.fase = (A.fase + (dt / VOO.periodo) * (0.25 + 0.75 * A.bate) * pressa) % 1
  // as asas: o giro em z levanta a ponta (o sinal troca de um lado para o outro); no mergulho e pousada, fechadas para trás
  const asa = lerp(lerp(PLANAR.asas, batida(A.fase), A.bate) + sobe * K.asasNoAlto + tranco * DANO.asas, lerp(K.asas, P.asas, pousa), fecha)
  const ponta = lerp(lerp(0.05, batida(A.fase - VOO.atraso) * VOO.ponta, A.bate), K.pontas, fecha)
  const varre = lerp(K.varre, P.varre, pousa)
  for (const a of g.asas) {
    a.asa.rotation.z = a.base + a.s * asa; a.ponta.rotation.z = a.basePonta + a.s * ponta
    a.asa.rotation.y = a.baseY + a.s * fecha * varre; a.ponta.rotation.y = a.s * fecha * varre * 0.8
  }
  // o corpo sobe na descida das asas e deita com a velocidade; a cabeça compensa e fica quase parada
  const solta = (1 - fecha) * (1 - pousa)
  const balanco = -Math.sin(A.fase * Math.PI * 2 + 0.6) * VOO.sobe * A.bate * solta
  const voando = cl(A.vel.x * VOO.inclina, -0.15, VOO.maxInclina) * solta + Math.sin(A.fase * Math.PI * 2) * 0.05 * A.bate * solta - sobe * K.empina + (fecha - pousa) * K.inclina
  const inclina = lerp(voando, P.corpo, pousa) + tranco * DANO.empina
  g.corpo.position.y = balanco - tranco * DANO.cai
  g.corpo.rotation.x = inclina
  g.corpo.rotation.z = cl(-A.vel.z * VOO.deita, -0.5, 0.5) * (1 - pousa) + (D ? D.lado : 0) * tranco * DANO.tomba
  g.pescoco.rotation.set(g.base.pescoco - lerp(inclina * VOO.cabeca * (1 - fecha) + fecha * 0.15, P.pescoco, pousa), Q.ay, Q.az)
  g.bico.rotation.x = g.base.bico + Math.max(bico * K.bico, tranco * DANO.bico)
  g.cauda.rotation.x = -Math.sin(A.fase * Math.PI * 2 + 0.6) * 0.12 * A.bate + pousa * P.cauda
  for (const p of g.pernas) p.rotation.x = pousa * P.pernas // para baixo, para ficar em pé
  animarMolas(g.molas, g.root, dt)
  return bicou
}
