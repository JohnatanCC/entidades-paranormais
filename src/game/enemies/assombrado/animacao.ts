// Os movimentos do Assombrado (docs/demonios.md), feitos em código em cima das pastas do modelo (modelo.ts):
//   parado: o corpo balança em cima do pé como um joão-bobo (uma mola que de vez em quando leva um empurrão sozinha),
//     respira, os braços pendem e seguem o balanço atrasados, as garras abrem e fecham, os olhos piscam um de cada vez;
//   andando: pulinhos curtos e pesados na perna só: agacha carregando, sobe esticado com o pé apontado para baixo, pousa
//     amassando, e o pouso empurra o balanço; os braços abrem no ar. Ele só anda no ar: o pé nunca escorrega no chão;
//   o ataque (atacar): agacha com os braços erguidos e os olhos acesos (o aviso), salta para a frente e desce as duas
//     garras, pousa e volta;
//   o dano (ferir): o tranco no balanço para longe do golpe, o corpo amassa e os olhos apagam por um instante;
//   estourar: o corpo some e fica o respingo de matéria escura (../estouro.ts). Sem animação de morte;
//   arremessado (cuspido pelo Devora almas): voa em arco, encolhido, dando voltas, e pousa amassando;
//   surgir: sobe do líquido preto (a poça no chão), esticado e de braços erguidos, os olhos acendendo quando a cabeça sai.
// Quem gira o root é quem o controla; o andar ele mesmo faz: animarAssombrado devolve quanto ele avança (m/s, para a
// frente dele), e quem controla move o root. Arremessado, quem move o root é o voo. A perna: o pé no chão embaixo dele,
// o joelho para trás (IK de dois ossos).
import * as THREE from 'three'
import { avisar, piscar } from '../../../render/golpe'
import { animarMolas } from '../../corpo/molas'
import type { Assombrado } from './modelo'
import { ARREMESSO, ATAQUE, BALANCO, DANO, PISCAR, PULO, SURGIR } from './numeros'
import { estourar, type Estouro } from '../estouro'

/** andar: os m/s que quem o controla quer (0 = parar; ele termina o pulo que começou). */
export interface EstadoAssombrado { andar?: number }
/** avanca: m/s para a frente dele neste quadro (mova o root). */
export interface SaidaAssombrado { avanca: number }

const cl = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x))
const lerp = (a: number, b: number, k: number) => a + (b - a) * k
const damp = (cur: number, alvo: number, k: number, dt: number) => cur + (alvo - cur) * (1 - Math.exp(-k * dt))
const suave = (k: number) => k * k * (3 - 2 * k)
const sorteio = (ab: readonly number[]) => ab[0] + Math.random() * (ab[1] - ab[0])
const PI = Math.PI

/** Começa o ataque (se não estiver atacando). */
export function atacar(a: Assombrado) { if (!a.anim.golpe && !a.anim.estourado) { a.anim.golpe = { t: 0 }; a.anim.pulo = -1 } }
/** Um golpe nele, vindo da direção `de` (rad, no espaço dele: 0 = da frente, +π/2 = do lado esquerdo dele). */
export function ferir(a: Assombrado, de: number) {
  if (a.anim.estourado) return
  piscar(a.root) // acende (render/golpe.ts)
  const B = a.anim.balanco
  B.vx -= Math.cos(de) * DANO.tranco; B.vz += Math.sin(de) * DANO.tranco
  a.anim.dano = { t: 0 }
}
/** A vida zerou: estoura (o corpo some; o respingo e a mancha ficam no lugar). chao = a altura do chão embaixo dele. */
export function estourarAssombrado(a: Assombrado, E: Estouro, chao = 0) {
  if (a.anim.estourado) return
  a.root.updateMatrixWorld(true)
  estourar(E, a.corpo.localToWorld(new THREE.Vector3(0, 0.42, 0)), 0.42, chao)
  a.anim.estourado = true; a.anim.golpe = a.anim.dano = null; a.root.visible = false
}
/** Arremessado de `de` (a boca do Devora) até `para` (no chão): voa em arco e pousa. */
export function arremessar(a: Assombrado, de: THREE.Vector3, para: THREE.Vector3) {
  const A = a.anim, dist = de.distanceTo(para)
  A.voo = { de: de.clone(), para: para.clone(), t: 0, dur: cl(dist / ARREMESSO.vel, ARREMESSO.dur[0], ARREMESSO.dur[1]), alto: dist * ARREMESSO.arco }
  A.golpe = null; A.pulo = -1; A.surgir = null
  a.root.position.copy(de); a.molas.pos = null
}
/** Sobe do líquido preto, no lugar onde o root está (no chão, na altura `chao`): a poça aparece, ele rompe a superfície
 *  com um respingo e sobe. */
export function surgirAssombrado(a: Assombrado, E: Estouro, chao = 0) {
  const p = a.root.getWorldPosition(new THREE.Vector3()).setY(chao)
  estourar(E, p, 0.45, chao, { cubos: 0, olhos: 0 }) // só a poça
  a.anim.surgir = { t: 0, respingo: () => estourar(E, p.clone().setY(chao + 0.15), 0.4, chao, { cubos: 10, olhos: 0, mancha: false }) }
  a.anim.golpe = null; a.anim.pulo = -1; a.anim.voo = null
}
/** Volta inteiro (o Ver modelos, depois de estourar). */
export function refazer(a: Assombrado) {
  const A = a.anim
  A.estourado = false; A.golpe = A.dano = null; A.pulo = -1; A.yaw = null; A.giro = 0; A.voo = A.surgir = null
  Object.assign(A.balanco, { x: 0, z: 0, vx: 0, vz: 0 }); a.molas.pos = null; a.root.visible = true
}

const _v = new THREE.Vector3(), _t = new THREE.Vector3(), _f = new THREE.Vector3()
const _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _qp = new THREE.Quaternion()
const X = new THREE.Vector3(1, 0, 0)

/** Um quadro do Assombrado. */
export function animarAssombrado(a: Assombrado, e: EstadoAssombrado, dt: number): SaidaAssombrado {
  { const G = a.anim.golpe; avisar(a.root, G && !a.anim.estourado && G.t < ATAQUE.aviso ? G.t / ATAQUE.aviso : 0) } // o aviso do ataque acende (render/golpe.ts)
  dt = Math.min(dt, 0.05)
  const A = a.anim
  if (A.estourado) return { avanca: 0 }
  A.t += dt
  // o quanto ele está virando (o balanço deita para dentro da curva)
  a.root.getWorldQuaternion(_q)
  const yaw = Math.atan2(_f.set(0, 0, 1).applyQuaternion(_q).x, _f.z)
  if (A.yaw !== null && dt > 0) { let d = yaw - A.yaw; while (d > PI) d -= 2 * PI; while (d < -PI) d += 2 * PI; A.giro = damp(A.giro, d / dt, 8, dt) }
  A.yaw = yaw

  // ---------- o que ele faz agora: o ataque, o pulo ou parado ----------
  let avanca = 0, y = 0, inclina = 0, amassa = 0, olhos = 1
  const pe = { no: true, y: 0, z: 0, ponta: 0 } // o pé: no chão, ou no ar (sobe y, vai z, a ponta para baixo)
  // os braços parados: pendem e seguem o balanço, atrasados; as garras abrem e fecham devagar
  const B = A.balanco
  const parado = (s: number) => ({
    x: 0.1 * Math.sin(A.t * 0.9 + s) - B.vx * 0.12,
    z: a.base.braco + 0.06 * Math.sin(A.t * 1.3 + (s > 0 ? 0 : 1.7)) + B.vz * 0.08 * s,
    g: 0.15 + 0.12 * Math.max(0, Math.sin(A.t * 2.3 + s * 2)),
  })
  const bracos = a.bracos.map((b) => parado(b.s))

  A.vel = damp(A.vel, e.andar ?? 0, 6, dt)
  const G = A.golpe, V = A.voo
  if (V) { // arremessado: voa em arco, de frente para onde vai, encolhido (as voltas e a perna dobrada: no corpo, abaixo)
    V.t += dt
    const u = Math.min(1, V.t / V.dur)
    a.root.position.lerpVectors(V.de, V.para, u); a.root.position.y += 4 * V.alto * u * (1 - u)
    a.root.rotation.y = Math.atan2(V.para.x - V.de.x, V.para.z - V.de.z)
    amassa = 0.12
    bracos.forEach((b) => { b.x = -0.5; b.z = 0.25; b.g = 0.6 })
    if (u >= 1) { A.voo = null; A.pulo = PULO.carga + PULO.voo; B.vx += 1.5 } // pousou: o pouso do pulo, amassando
  } else if (G) {
    const T = ATAQUE, t1 = T.aviso, t2 = t1 + T.salto, t3 = t2 + T.pouso, t4 = t3 + T.volta, antes = G.t
    G.t += dt
    if (G.t < t1) { // o aviso: agacha, inclina para trás, ergue os braços, abre as garras, os olhos acendem
      const k = suave(G.t / t1)
      y = -T.agacha * k; inclina = -0.22 * k; amassa = 0.1 * k
      olhos = 1 + (T.olhos - 1) * k * (0.85 + 0.15 * Math.sin(G.t * 40))
      // erguidos acima da cabeça e um pouco para trás (fechando a abertura: aberto, o braço só iria para o lado)
      bracos.forEach((b) => { b.x = lerp(b.x, -3.2, k); b.z = lerp(b.z, 0.4, k); b.g = lerp(b.g, -0.7, k) })
    } else if (G.t < t2) { // o salto: para a frente, as garras descendo pela frente (rápidas no fim)
      const k = (G.t - t1) / T.salto, kk = k * k
      avanca = T.avanco / T.salto
      y = T.altura * Math.sin(PI * k) - T.agacha * (1 - k) * (1 - k); inclina = lerp(-0.22, T.inclina, suave(k)); amassa = -0.08 * Math.sin(PI * k)
      olhos = T.olhos
      Object.assign(pe, { no: false, y: Math.max(0, y) * 0.5, z: 0.02, ponta: 0.5 * Math.sin(PI * k) })
      bracos.forEach((b) => { b.x = lerp(-3.2, -0.75, kk); b.z = lerp(0.4, a.base.braco - 0.25, kk); b.g = lerp(-0.7, 0.8, kk) })
    } else if (G.t < t3) { // o pouso: amassa, as garras embaixo
      const k = (G.t - t2) / T.pouso
      if (antes < t2) B.vx += T.tranco // o tranco do pouso
      y = -T.agacha * Math.sin(PI * k); inclina = T.inclina * (1 - 0.2 * k); amassa = 0.14 * Math.sin(PI * k)
      olhos = lerp(T.olhos, 1, k)
      bracos.forEach((b) => { b.x = -0.75 + 0.3 * k; b.z = a.base.braco - 0.25; b.g = 0.8 })
    } else { // volta para a parada
      const k = suave(Math.min(1, (G.t - t3) / T.volta))
      inclina = T.inclina * 0.8 * (1 - k)
      bracos.forEach((b) => { b.x = lerp(-0.45, b.x, k); b.z = lerp(a.base.braco - 0.25, b.z, k); b.g = lerp(0.8, b.g, k) })
    }
    if (G.t >= t4) A.golpe = null
  } else if (!A.surgir) {
    // os pulinhos: começa quando pedem para andar; terminando o pulo, para se ninguém pedir mais
    if (A.pulo < 0 && (e.andar ?? 0) > 0.05) A.pulo = 0
    if (A.pulo >= 0) {
      const P = PULO, antes = A.pulo
      A.pulo += dt / P.periodo
      if (A.pulo >= 1) A.pulo = (e.andar ?? 0) > 0.05 ? A.pulo - 1 : -1
      const u = A.pulo
      if (u >= 0 && u < P.carga) { // carrega: agacha e amassa
        const k = u / P.carga
        y = -P.agacha * suave(k); amassa = 0.08 * k; inclina = -0.05 * k
      } else if (u >= P.carga && u < P.carga + P.voo) { // no ar: avança, estica, o pé aponta para baixo, os braços abrem
        const k = (u - P.carga) / P.voo, s = Math.sin(PI * k)
        avanca = Math.max(A.vel, 0.35) / P.voo
        y = P.altura * s - P.agacha * (1 - k) ** 3; amassa = -0.07 * s; inclina = P.inclina * s
        Object.assign(pe, { no: false, y: Math.max(0, y) * 0.55, z: (k - 0.5) * 0.1, ponta: 0.55 * s })
        bracos.forEach((b) => { b.x -= 0.35 * s; b.z += 0.35 * s })
      } else if (u >= 0) { // pousa: amassa, os braços caem
        const k = (u - P.carga - P.voo) / P.pouso, s = Math.sin(PI * k)
        if (antes < P.carga + P.voo) B.vx += P.pouso_tranco
        y = -P.agacha * 1.1 * s; amassa = 0.12 * Math.sin(PI * Math.min(1, k * 1.4))
        bracos.forEach((b) => { b.x += 0.25 * s; b.z -= 0.15 * s })
      }
    }
  }
  // o dano por cima: amassa, os braços encolhem, os olhos apagam
  if (A.dano) {
    const D = A.dano
    D.t += dt
    const s = Math.sin(PI * Math.min(1, D.t / DANO.dura))
    amassa += DANO.amassa * s
    bracos.forEach((b) => { b.x -= 0.4 * s; b.z += 0.2 * s })
    if (D.t < DANO.olhos) olhos = 0
    if (D.t >= DANO.dura) A.dano = null
  }
  // surgindo do líquido preto: o corpo sobe de baixo do chão, esticado, os braços erguidos; os olhos acendem quando a
  // cabeça sai; no fim assenta amassando
  const S = A.surgir
  if (S) {
    S.t += dt
    const u = Math.min(1, S.t / SURGIR.dura), k = cl((u - 0.15) / 0.6, 0, 1)
    y += u < 0.15 ? -SURGIR.fundo : u < 0.75 ? lerp(-SURGIR.fundo, 0.08, suave(k)) : lerp(0.08, 0, suave((u - 0.75) / 0.25))
    amassa += u < 0.75 ? -0.15 * Math.sin(PI * k) : 0.1 * Math.sin((PI * (u - 0.75)) / 0.25)
    const s = Math.sin(PI * cl((u - 0.1) / 0.75, 0, 1))
    bracos.forEach((b) => { b.x = lerp(b.x, -2.6, s); b.z = lerp(b.z, 0.5, s) })
    olhos = Math.min(olhos, u < 0.45 ? 0 : Math.min(1, (u - 0.45) / 0.15))
    if (y < 0) Object.assign(pe, { no: false, y, z: 0, ponta: 0.3 }) // o pé vem junto, por baixo do chão
    if (S.respingo && u >= SURGIR.rompe) { S.respingo(); S.respingo = null }
    if (u >= 1) A.surgir = null
  }

  // ---------- o joão-bobo: o balanço é uma mola em cima do pé ----------
  const C = BALANCO
  if (A.pulo < 0 && !G && (B.prox -= dt) <= 0) { // parado, de vez em quando um empurrão sozinho
    B.prox = sorteio(C.empurrao)
    const ang = Math.random() * PI * 2
    B.vx += Math.cos(ang) * C.tranco; B.vz += Math.sin(ang) * C.tranco
  }
  const alvoX = C.vaga[0] * Math.sin(A.t * 0.7), alvoZ = C.vaga[1] * Math.sin(A.t * 1.13 + 1) - cl(A.giro * 0.06, -0.25, 0.25)
  B.vx += (C.mola * (alvoX - B.x) - C.amortece * B.vx) * dt; B.x = cl(B.x + B.vx * dt, -C.maximo, C.maximo)
  B.vz += (C.mola * (alvoZ - B.z) - C.amortece * B.vz) * dt; B.z = cl(B.z + B.vz * dt, -C.maximo, C.maximo)

  const resp = 0.012 * Math.sin(A.t * 2.2)
  a.corpo.scale.set(1 + amassa * 0.6, 1 - amassa + resp, 1 + amassa * 0.6)
  if (A.voo) {
    // ---------- arremessado: dá voltas em volta do meio do corpo, a perna dobrada junto ----------
    a.quadril.rotation.set(ARREMESSO.voltas * 2 * PI * Math.min(1, A.voo.t / A.voo.dur), 0, 0)
    a.quadril.position.set(0, a.base.quadril + 0.4, 0).add(_v.set(0, -0.4, 0).applyEuler(a.quadril.rotation))
    a.coxa.rotation.set(1.1, 0, 0); a.canela.rotation.set(-2.3, 0, 0); a.pe.rotation.set(0.6, 0, 0)
  } else {
    // ---------- o corpo: gira em volta do pé no chão (o joão-bobo), sobe e desce, amassa e estica, respira ----------
    a.quadril.rotation.set(B.x + inclina, 0, B.z)
    a.quadril.position.copy(_v.set(0, a.base.quadril + y, 0).applyEuler(a.quadril.rotation))

    // ---------- a perna: o tornozelo no alvo, o joelho para trás (IK de dois ossos), o pé reto no chão ----------
    const L1 = a.base.L1, L2 = a.base.L2, T0 = a.base.tornozelo
    _t.set(T0.x, T0.y + (pe.no ? 0 : pe.y), T0.z + pe.z) // no espaço do root
    _q.setFromEuler(a.quadril.rotation)
    const d = _v.copy(_t).sub(a.quadril.position).applyQuaternion(_q2.copy(_q).invert()).sub(a.base.coxa) // no espaço do quadril, a partir da coxa
    const rz = Math.atan2(d.x, -d.y), h = Math.hypot(d.x, d.y)
    const D = cl(Math.hypot(h, d.z), Math.abs(L1 - L2) + 1e-3, L1 + L2 - 1e-4)
    const al = Math.acos(cl((L1 * L1 + D * D - L2 * L2) / (2 * L1 * D), -1, 1)), be = Math.acos(cl((L1 * L1 + L2 * L2 - D * D) / (2 * L1 * L2), -1, 1))
    a.coxa.rotation.set(Math.atan2(-d.z, h) + al, 0, rz)
    a.canela.rotation.set(-(PI - be), 0, 0)
    // o pé: reto no espaço do root (ou com a ponta para baixo no ar), desfazendo o giro de tudo o que vem antes dele
    _q.multiply(_q2.setFromEuler(a.coxa.rotation)).multiply(_qp.setFromEuler(a.canela.rotation)).invert()
    a.pe.quaternion.copy(_q).multiply(_qp.setFromAxisAngle(X, pe.ponta))
  }

  // ---------- os braços e as garras ----------
  a.bracos.forEach((b, i) => { const v = bracos[i]; b.braco.rotation.set(v.x, 0, b.s * v.z); b.garra.rotation.set(v.g, 0, 0) })

  // ---------- os olhos: piscam um de cada vez, fora de ordem; acesos no aviso, apagados no dano ----------
  a.olhos.forEach((o, i) => {
    const p = A.piscar[i]
    if (p.t >= 0) { p.t += dt; if (p.t > PISCAR.dura) p.t = -1 } else if ((p.prox -= dt) <= 0) { p.t = 0; p.prox = sorteio(PISCAR.intervalo) }
    const fecha = p.t >= 0 && olhos <= 1 ? Math.sin((PI * p.t) / PISCAR.dura) : 0, k = Math.max(olhos, 1e-3)
    o.scale.set(k, k * Math.max(0.06, 1 - fecha), k)
  })

  // ---------- a ponta do capuz e os pingos, com o que o corpo fez ----------
  animarMolas(a.molas, a.root, dt)
  return { avanca }
}
