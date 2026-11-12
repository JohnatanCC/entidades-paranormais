// Os movimentos da Asa sombria (docs/demonios.md), feitos em código em cima das pastas do modelo (modelo.ts):
//   voar: o bater de asas, a descida mais rápida que a subida; a ponta vem atrasada e dobra para trás na subida; o corpo
//     sobe a cada descida das asas; ela deita para a frente quando anda e de lado nas curvas; de vez em quando plana;
//   cuspir: para no ar batendo as asas mais curto, as pétalas abrem até a metade e o núcleo cresce e pulsa (o aviso),
//     o corpo se inclina para o alvo; cospe (as pétalas abrem de vez, o corpo recua) e as pétalas fecham;
//   desviar: fecha as asas, rola uma volta inteira e anda de lado; abre as asas de novo;
//   o dano: o tranco no corpo, ela cai um pouco, as asas dão um pulo e a boca treme;
//   estourar: o corpo some e fica o respingo (../estouro.ts), que cai até o chão. Sem animação de morte.
// Quem move o root é quem a controla (a altura do voo, para onde ela vai); a animação devolve o que o movimento pede:
// o quanto ela anda de lado (desviar) e recua (o cuspe), e, no quadro do cuspe, de onde o projétil sai.
import * as THREE from 'three'
import { animarMolas } from '../../corpo/molas'
import { estourar, type Estouro } from '../estouro'
import type { AsaSombria } from './modelo'
import { BALANCO, CUSPIR, DANO, DESVIO, PLANAR, VOO } from './numeros'

/** alvo: para onde ela cospe (no mundo); o corpo se inclina para ele no aviso. */
export interface EstadoAsa { alvo?: THREE.Vector3 }
/** lado: m/s para o lado dela (+x, a esquerda dela); recua: m/s para trás; cospe: neste quadro o projétil sai daqui
 *  (a boca, no mundo), ou null. */
export interface SaidaAsa { lado: number; recua: number; cospe: THREE.Vector3 | null }

const cl = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x))
const lerp = (a: number, b: number, k: number) => a + (b - a) * k
const damp = (cur: number, alvo: number, k: number, dt: number) => cur + (alvo - cur) * (1 - Math.exp(-k * dt))
const suave = (k: number) => k * k * (3 - 2 * k)
const sorteio = (ab: readonly number[]) => ab[0] + Math.random() * (ab[1] - ab[0])
const PI = Math.PI

/** Começa a cuspir (se não estiver cuspindo ou desviando). */
export function cuspir(a: AsaSombria) { if (!a.anim.golpe && !a.anim.estourado) a.anim.golpe = { nome: 'cuspir', t: 0, lado: 0, saiu: false } }
/** Desvia para um lado (+1 a esquerda dela, −1 a direita). Corta o cuspe. */
export function desviar(a: AsaSombria, lado: number) { if (a.anim.golpe?.nome !== 'desviar' && !a.anim.estourado) a.anim.golpe = { nome: 'desviar', t: 0, lado: Math.sign(lado) || 1, saiu: false } }
/** Um golpe nela, vindo da direção `de` (rad, no espaço dela: 0 = da frente, +π/2 = do lado esquerdo dela). */
export function ferir(a: AsaSombria, de: number) {
  if (a.anim.estourado) return
  const B = a.anim.balanco
  B.vx -= Math.cos(de) * DANO.tranco; B.vz += Math.sin(de) * DANO.tranco
  a.anim.dano = { t: 0 }
}
/** A vida zerou: estoura no ar (o corpo some; os cubos caem até o chão, na altura `chao`, e a mancha fica lá). */
export function estourarAsa(a: AsaSombria, E: Estouro, chao = 0) {
  if (a.anim.estourado) return
  a.root.updateMatrixWorld(true)
  estourar(E, a.corpo.localToWorld(new THREE.Vector3(0, 0.05, 0)), 0.32, chao)
  a.anim.estourado = true; a.anim.golpe = a.anim.dano = null; a.root.visible = false
}
/** Volta inteira (o Ver modelos, depois de estourar). */
export function refazerAsa(a: AsaSombria) {
  const A = a.anim
  A.estourado = false; A.golpe = A.dano = null; A.ultimo = null; A.vel.set(0, 0, 0); A.boca = 0
  Object.assign(A.balanco, { x: 0, z: 0, vx: 0, vz: 0 }); a.molas.pos = null; a.root.visible = true
}

const _p = new THREE.Vector3(), _f = new THREE.Vector3(), _q = new THREE.Quaternion(), _b = new THREE.Vector3()

/** Um quadro da Asa sombria. */
export function animarAsaSombria(a: AsaSombria, e: EstadoAsa, dt: number): SaidaAsa {
  dt = Math.min(dt, 0.05)
  const A = a.anim, saida: SaidaAsa = { lado: 0, recua: 0, cospe: null }
  if (A.estourado) return saida
  A.t += dt
  // ---------- a velocidade dela (medida): para a frente e para o lado ----------
  a.root.getWorldPosition(_p); a.root.getWorldQuaternion(_q)
  if (A.ultimo && dt > 0) {
    const yaw = Math.atan2(_f.set(0, 0, 1).applyQuaternion(_q).x, _f.z), vx = (_p.x - A.ultimo.x) / dt, vz = (_p.z - A.ultimo.z) / dt
    if (Math.hypot(vx, vz) < 20) {
      A.vel.x = damp(A.vel.x, vx * Math.sin(yaw) + vz * Math.cos(yaw), 6, dt)
      A.vel.z = damp(A.vel.z, vx * Math.cos(yaw) - vz * Math.sin(yaw), 6, dt)
    }
  }
  ;(A.ultimo ??= new THREE.Vector3()).copy(_p)

  // ---------- planar de vez em quando (não no meio de um golpe) ----------
  const G = A.golpe
  if (!G && !A.planar && (A.proxPlanar -= dt) <= 0) A.planar = { t: 0, dura: sorteio(PLANAR.dura) }
  if (A.planar && ((A.planar.t += dt) >= A.planar.dura || G)) { A.planar = null; A.proxPlanar = sorteio(PLANAR.intervalo) }
  A.bate = damp(A.bate, A.planar ? 0 : 1, 5, dt)

  // ---------- o golpe: cuspir ou desviar ----------
  let periodo = VOO.periodo, amp = 1, boca = 0, nucleo = CUSPIR.nucleo[0], mira = 0, rola = 0, fecha = 0, mordida = false
  if (e.alvo) { // o quanto ela precisa se inclinar para a boca apontar para o alvo (para baixo = positivo)
    a.nucleo.getWorldPosition(_b)
    mira = cl(Math.atan2(_b.y - e.alvo.y, Math.hypot(e.alvo.x - _b.x, e.alvo.z - _b.z)), -CUSPIR.mira, CUSPIR.mira)
  }
  let inclina = 0
  if (G) {
    G.t += dt
    if (G.nome === 'cuspir') {
      const C = CUSPIR, t1 = C.aviso, t2 = t1 + C.cospe, t3 = t2 + C.fecha
      periodo = C.periodo; amp = C.amplitude
      if (G.t < t1) { // o aviso: a boca abre até a metade, o núcleo cresce pulsando, o corpo mira
        const k = G.t / t1
        boca = 0.45 * suave(k); nucleo = lerp(C.nucleo[0], C.nucleo[1], k) * (1 + 0.12 * Math.sin(G.t * 30)); inclina = mira * suave(k) - 0.08 * k
      } else if (G.t < t2) { // o cuspe: a boca abre de vez, o núcleo sai, ela recua
        const k = (G.t - t1) / C.cospe
        if (!G.saiu) { G.saiu = true; mordida = true }
        boca = 1; nucleo = lerp(C.nucleo[1], 0.3, k); inclina = mira - 0.3 * Math.sin(PI * k); saida.recua = C.recua
      } else { // fecha
        const k = Math.min(1, (G.t - t2) / C.fecha)
        boca = 1 - suave(k); nucleo = lerp(0.3, C.nucleo[0], k); inclina = mira * (1 - suave(k))
      }
      if (G.t >= t3) A.golpe = null
    } else { // desviar: fecha as asas, rola uma volta e anda de lado
      const D = DESVIO, k = Math.min(1, G.t / D.dura)
      fecha = k < 0.2 ? suave(k / 0.2) : k > 0.75 ? 1 - suave((k - 0.75) / 0.25) : 1
      rola = -G.lado * 2 * PI * suave(k)
      saida.lado = G.lado * (D.distancia / D.dura) * Math.sin(PI * k) * (PI / 2) // a soma dá a distância
      if (G.t >= D.dura) A.golpe = null
    }
  }

  // ---------- o bater de asas ----------
  A.fase = (A.fase + dt / periodo) % 1
  const V = VOO, f = A.fase, desce = f < V.desce, k = desce ? f / V.desce : (f - V.desce) / (1 - V.desce), s = Math.sin(PI * k)
  const bate = A.bate
  const batida = desce ? lerp(V.cima, V.baixo, suave(k)) : lerp(V.baixo, V.cima, suave(k))
  let asa = lerp(PLANAR.asas, batida * amp + (1 - amp) * 0.15, bate) // planando: abertas um pouco para cima
  let ponta = (desce ? V.ponta * s : -V.ponta * s) * amp * bate // a ponta atrasada: para cima na descida, para baixo na subida
  let dobra = desce ? 0 : V.dobra * s * bate // a ponta dobra para trás na subida
  let varre = a.base.varre - (desce ? V.varre * s : 0) * bate // para a frente na descida
  let y = V.sobe * amp * Math.sin(2 * PI * (f - 0.05)) * bate - PLANAR.afunda * (1 - bate)
  // desviando: as asas fecham junto do corpo (para baixo e para trás), a ponta dobrada
  asa = lerp(asa, -1.15, fecha); varre = lerp(varre, 0.95, fecha); ponta = lerp(ponta, -0.5, fecha); dobra = lerp(dobra, 1.3, fecha)

  // ---------- o dano: cai um pouco, as asas pulam, a boca treme ----------
  if (A.dano) {
    const D = A.dano
    D.t += dt
    const u = Math.min(1, D.t / DANO.dura), sd = Math.sin(PI * u)
    y -= DANO.cai * sd; asa += 0.6 * (1 - u) * sd; boca = Math.max(boca, 0.25 * sd * (0.6 + 0.4 * Math.sin(D.t * 60)))
    if (D.t >= DANO.dura) A.dano = null
  }

  // ---------- o corpo: deita para a frente andando e de lado nas curvas, como uma mola; mira; recua; rola ----------
  const B = A.balanco
  const alvoX = cl(A.vel.x * V.inclina, -V.maxInclina, V.maxInclina), alvoZ = cl(-A.vel.z * V.deita, -0.5, 0.5)
  B.vx += (BALANCO.mola * (alvoX - B.x) - BALANCO.amortece * B.vx) * dt; B.x = cl(B.x + B.vx * dt, -1, 1)
  B.vz += (BALANCO.mola * (alvoZ - B.z) - BALANCO.amortece * B.vz) * dt; B.z = cl(B.z + B.vz * dt, -1, 1)
  if (mordida) B.vx -= 2.5 // o tranco do cuspe joga a cabeça para trás
  a.corpo.position.set(0, y, 0)
  a.corpo.rotation.set(B.x + inclina, 0, B.z + rola)
  for (const w of a.asas) { w.asa.rotation.set(0, w.s * varre, w.s * asa); w.ponta.rotation.set(0, w.s * dobra, w.s * ponta) }

  // ---------- a boca: as pétalas dobram para fora pela ponta; o núcleo cresce ----------
  A.boca = mordida ? boca : damp(A.boca, boca, 18, dt)
  A.nucleo = damp(A.nucleo, nucleo, 14, dt)
  const o = A.boca * CUSPIR.abre, P = a.petalas
  P.cima.rotation.set(-o, 0, 0); P.baixo.rotation.set(o, 0, 0); P.e.rotation.set(0, o, 0); P.d.rotation.set(0, -o, 0)
  a.nucleo.scale.setScalar(Math.max(1e-3, A.nucleo))

  // ---------- os pingos, com o que o corpo fez; de onde sai o projétil ----------
  animarMolas(a.molas, a.root, dt) // (atualiza as matrizes)
  if (mordida) saida.cospe = a.nucleo.localToWorld(new THREE.Vector3(0, 0, 0.2))
  return saida
}
