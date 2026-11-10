// Os movimentos da Mãe (do laboratório v130), por cima das molas da pose (pose.ts):
//   parada: curvada, balançando de um lado para o outro, a cabeça tombada procurando, a boca entreaberta tremendo e as
//     garras abertas meio caídas; de vez em quando a cabeça ESTALA de lado, de repente (sem suavizar), e volta;
//   andando: os braços descem e balançam soltos (o cotovelo e a mão atrasados), os ombros giram contra o quadril, a
//     cabeça balança; arrancando ela inclina para trás, freando para a frente, virando o peito e a cabeça vão na frente;
//     as pernas dão passos curtos por baixo da saia e empurram o pano na frente e atrás delas (e a saia arrasta: as molas);
//   passando pela porta (porta: 0..1): ela é maior que a porta (2,26 m contra 2,1): o quadril desce, o tronco curva para
//     a frente, a cabeça levanta para continuar olhando e a mão direita sobe e segura o batente.
//   os ataques (golpes.ts): golpear(m, nome) começa um; enquanto dura, ele manda na pose e diz quanto ela avança.
// Quem move e gira o root é quem a controla (a inteligência, depois; o Ver modelos agora): aqui o andar é medido pelo
// deslocamento do root, e animarMae devolve o quanto o golpe quer que ela avance e a altura do corpo (a investida sai de
// baixo do chão). Os números em numeros.ts (MOV, GOLPE).
import * as THREE from 'three'
import { animarMolas } from '../../corpo/molas'
import type { Mae } from './modelo'
import { ESTADO, LUTO, MOV } from './numeros'
import { animarRostoMae, type ExpressaoMae } from './rosto'
import { novoGolpe, quadroDoGolpe, type NomeGolpe, type SaidaGolpe } from './golpes'
import { estufar, type Luto } from './luto'
import { aplicarPose, misturar, pose0, seguirPose, type Pose } from './pose'

/** porta: quanto ela está passando pela porta (0..1); perto: a distância até o alvo à frente dela (os golpes param ao
 *  chegar); luto: onde saem os efeitos do Luto (as ondas, os respingos, o chão estufando) */
export interface EstadoMae { porta?: number; perto?: number; luto?: Luto; expressao?: ExpressaoMae } // expressao: força uma (o Ver modelos)

const EXPRESSAO_DO_ESTADO: Partial<Record<string, ExpressaoMae>> = { grito: 'grito', exausta: 'exausta', cambaleio: 'dor', enfraquecida: 'choro', capturada: 'terror' }
/** A expressão de cada movimento: vazia procurando; caça quando viu você; fúria no ataque; e a de cada estado. */
function expressaoDe(m: Mae): ExpressaoMae {
  const g = m.anim.golpe
  if (!g) return 'vazia'
  const n = g.nome
  if (n.startsWith('garra') || n === 'investida' || n === 'carga' || n === 'finta') return 'furia'
  if (n === 'aproximar' || n === 'mergulhar' || n === 'aviso' || n === 'levanta') return 'caca'
  // surgir: vazia enquanto sobe de cabeça baixa; o guincho arregalado; depois, a caça
  if (n === 'surgir') { const u = g.t - LUTO.surgir.espera; return u < 2.95 ? 'vazia' : u < 3.8 ? 'grito' : 'caca' }
  // atordoada: o grito, a dor de joelhos e, levantando, a caça de novo
  if (n === 'atordoada') return g.t < 0.45 ? 'grito' : g.t > g.dur - 0.9 ? 'caca' : 'dor'
  return EXPRESSAO_DO_ESTADO[n] ?? 'vazia'
}

const _onde = new THREE.Vector3(), _maos = [new THREE.Vector3(), new THREE.Vector3()], _olhos = [new THREE.Vector3(), new THREE.Vector3()]

/** Começa um ataque (o que estava acontecendo acaba). */
export function golpear(m: Mae, nome: NomeGolpe) { return (m.anim.golpe = novoGolpe(nome)) }

const cl = (x: number, m: number) => Math.max(-m, Math.min(m, x))
const lerp = (a: number, b: number, k: number) => a + (b - a) * k
const damp = (cur: number, alvo: number, k: number, dt: number) => cur + (alvo - cur) * (1 - Math.exp(-k * dt))
const _p = new THREE.Vector3(), _q = new THREE.Quaternion(), _f = new THREE.Vector3()

/** A parada (a guarda do laboratório): curvada, balança, procura com a cabeça tombada. */
function parada(t: number, P: Pose) {
  const br = Math.sin(t * 2.2), sw = Math.sin(t * 0.9)
  P.hy = -0.05 + br * 0.008; P.lean = 0.5 + br * 0.025; P.lz = sw * 0.06; P.hz = -sw * 0.03
  P.nx = 0.06; P.nz = 0.3 + Math.sin(t * 0.6) * 0.12; P.jaw = 0.1 + Math.max(0, Math.sin(t * 3.1)) * 0.06
  P.a.forEach((A, k) => Object.assign(A, {
    x: -P.lean - 0.32 + Math.sin(t * 1.7 + k) * 0.05, z: 0.36, tw: 0.35, el: -0.55, wr: 0.45,
    curl: 0.4 + Math.max(0, Math.sin(t * 7 + k * 2)) * 0.25, sp: 0.85,
  }))
}

/** Um quadro da Mãe. Devolve o que o golpe pede: avanca (m/s para a frente dela) e y (a altura do corpo). */
export function animarMae(m: Mae, e: EstadoMae, dt: number): { avanca: number; y: number } {
  dt = Math.min(dt, 0.05)
  const A = m.anim, porta = e.porta ?? 0
  A.t += dt
  // ---------- o movimento do root (para a frente, de lado, girando), medido no mundo ----------
  m.root.updateWorldMatrix(true, false)
  m.root.getWorldPosition(_p); m.root.getWorldQuaternion(_q)
  const yaw = Math.atan2(_f.set(0, 0, 1).applyQuaternion(_q).x, _f.z)
  let vf = 0, vs = 0, giro = 0
  if (A.ultimo && dt > 0) {
    const vx = (_p.x - A.ultimo.x) / dt, vz = (_p.z - A.ultimo.z) / dt
    let dy = yaw - A.yaw; while (dy > Math.PI) dy -= 2 * Math.PI; while (dy < -Math.PI) dy += 2 * Math.PI
    if (Math.hypot(vx, vz) < 16) { vf = vx * Math.sin(yaw) + vz * Math.cos(yaw); vs = vx * Math.cos(yaw) - vz * Math.sin(yaw); giro = dy / dt }
  }
  ;(A.ultimo ??= new THREE.Vector3()).copy(_p); A.yaw = yaw
  const af = dt > 0 ? (vf - A.vel.x) / dt : 0, as = dt > 0 ? (vs - A.vel.z) / dt : 0
  A.vel.set(damp(A.vel.x, vf, 10, dt), 0, damp(A.vel.z, vs, 10, dt))
  A.giro = damp(A.giro, giro, 8, dt)
  const spd = Math.hypot(vf, vs)
  A.andar = damp(A.andar, Math.min(1, spd / 0.8), 6, dt)
  A.passo += Math.min(spd, 4) * dt * MOV.andar.passo

  // ---------- a pose-alvo: a parada, o andar por cima, a porta por cima ----------
  const T = pose0()
  parada(A.t, T)
  const base = misturar(T, T, 0), golpe = A.golpe // a parada (a investida volta para ela no fim)
  // a inércia: arrancando ela inclina para trás, freando para a frente; virando, o peito e a cabeça vão na frente
  T.lean += cl(-af * 0.011, 0.22); T.lz += cl(as * 0.009 - A.giro * vf * 0.012, 0.18)
  T.ly += cl(A.giro * 0.07, 0.35); T.ny += cl(A.giro * 0.05, 0.3); T.hry += cl(-A.giro * 0.025, 0.12)
  const wk = A.andar, g = A.passo
  if (wk > 0.01 && !golpe) { // (num golpe, quem manda nos braços é ele)
    T.a.forEach((B, k) => {
      const sw = Math.sin(g + k * Math.PI), lag = Math.sin(g + k * Math.PI - 0.9)
      // os braços descem e ficam pendurados (compensando a inclinação), balançando baixo, o cotovelo e a mão atrasados
      B.x = lerp(B.x, -T.lean + 0.06, 0.88 * wk) + sw * 0.2 * wk; B.z = lerp(B.z, 0.15, 0.8 * wk) + 0.04 * wk * (0.5 + 0.5 * sw)
      B.el = lerp(B.el, -0.22, 0.6 * wk) - 0.3 * wk * Math.max(0, lag); B.wr = lerp(B.wr, 0.15, 0.5 * wk) + 0.28 * wk * lag
      B.curl = lerp(B.curl, 0.4, 0.5 * wk) + 0.1 * wk * (0.5 + 0.5 * lag); B.tw = lerp(B.tw, 0, 0.8 * wk)
    })
    T.ly += Math.sin(g) * 0.13 * wk; T.hry -= Math.sin(g) * 0.09 * wk; T.hy -= 0.035 * wk * Math.abs(Math.cos(g))
    T.nz += Math.sin(g) * 0.07 * wk; T.lz += Math.sin(g) * 0.04 * wk
  }
  // passando pela porta: abaixa, curva, a cabeça levanta para olhar e a mão direita segura o batente
  // o golpe: a pose dele por cima e o quanto ela avança
  let saida: SaidaGolpe = { avanca: 0, y: 0 }
  if (golpe) {
    golpe.t += dt
    const maos = () => m.bracos.map((b, i) => b.hd.getWorldPosition(_maos[i]))
    const olhos = () => [-1, 1].map((s, i) => m.cabeca.localToWorld(_olhos[i].set(s * 0.045, 0.15, 0.12)))
    saida = quadroDoGolpe(golpe, T, base, e.perto ?? 9, dt, { luto: e.luto, onde: _onde.copy(_p).setY(0), maos, olhos })
    if (golpe.t >= golpe.dur) A.golpe = null
  }
  if (porta > 0.001 && !golpe) {
    const P = MOV.porta, k = porta
    T.hy -= P.abaixa * k; T.lean += P.curva * k; T.nx -= P.olha * k; T.nz *= 1 - k; T.jaw *= 1 - 0.5 * k
    const D = T.a[0]
    D.x = lerp(D.x, -2.5, k); D.z = lerp(D.z, 0.2, k); D.el = lerp(D.el, -0.35, k); D.wr = lerp(D.wr, 0.3, k); D.curl = lerp(D.curl, 0.7, k); D.tw = lerp(D.tw, 0, k)
  }
  const ajoelha = saida.ajoelha ?? 0 // de joelhos: o quadril desce até as canelas deitarem no chão
  if (ajoelha > 0) T.hy = T.hy + (ESTADO.joelhos.quadril - T.hy) * ajoelha
  const rate = golpe ? golpe.rate : porta > 0.3 ? MOV.porta.rate : wk > 0.3 ? MOV.andar.rate : MOV.parada.rate
  seguirPose(m.pose, T, rate, dt)

  // ---------- o estalo da cabeça (parada): vira de lado de repente e volta ----------
  const E = MOV.estalo
  if (A.estaloT > 0) A.estaloT -= dt
  else if (wk < 0.3 && porta < 0.3 && !golpe && Math.random() < dt * E.chance) A.estaloT = E.dura
  A.estalo = A.estaloT > 0 ? E.giro : damp(A.estalo, 0, E.volta, dt)
  aplicarPose(m, m.pose, A.estalo)
  animarRostoMae(m, e.expressao ?? expressaoDe(m), A.estaloT > 0, dt)

  // ---------- as pernas: dobram para os pés ficarem no chão quando o quadril desce; andando, passos curtos ----------
  const L1 = m.base.coxa, L2 = m.base.canela, h = Math.max(0.3, Math.min(L1 + L2 - 1e-4, L1 + L2 + m.pose.cur.hy))
  const a1 = Math.acos(Math.max(-1, Math.min(1, (L1 * L1 + h * h - L2 * L2) / (2 * L1 * h))))
  const dobra = Math.PI - Math.acos(Math.max(-1, Math.min(1, (L1 * L1 + L2 * L2 - h * h) / (2 * L1 * L2))))
  for (const P of m.pernas) {
    const ph = g + (P.s > 0 ? Math.PI : 0)
    const th = -a1 - MOV.andar.pernas * wk * Math.sin(ph), kn = dobra + MOV.andar.joelho * wk * Math.max(0, Math.cos(ph))
    // de joelhos: a coxa quase em pé, a canela deitada para trás, o pé esticado (em vez de agachar com os pés no chão)
    const j = ajoelha, thJ = th + (-0.12 - th) * j, knJ = kn + (1.62 - kn) * j
    P.coxa.rotation.set(thJ, 0, 0); P.canela.rotation.set(knJ, 0, 0); P.pe.rotation.set(-(thJ + knJ) * (1 - j) + 1.3 * j, 0, 0)
  }
  // ---------- a saia e o cabelo, com o que o corpo fez ----------
  // abaixando, a saia encolhe a partir da cintura (a barra amontoa no chão em vez de afundar) e abre um pouco
  const sk = Math.max(0.3, Math.min(1, (m.base.cintura + m.pose.cur.hy) / m.base.cintura)), abre = 1 + (1 - sk) * 0.55
  for (const g of m.saiaRaiz) g.scale.set(abre, sk, abre)
  animarMolas(m.saia, m.root, dt)
  // as pernas empurram o pano para onde vão, do lado de cada uma: o painel da frente vai para a frente com a coxa que
  // avança (e a parte de baixo, com o joelho e o pé, mais um pouco); o de trás vai para trás com a perna que fica atrás
  const passo = m.pernas.map((P) => P.coxa.rotation.x + a1) // só o passo (a dobra de abaixar, a1, não empurra); < 0 = à frente
  for (const s of m.saia.molas) {
    const ponta = s.g.name.endsWith('_ponta'), painel = ponta ? s.g.parent! : s.g
    const ax = painel.position.x, az = painel.position.z, r = Math.hypot(ax, az) || 1
    let empurra = 0
    m.pernas.forEach((P, i) => {
      const doLado = 0.5 + 0.5 * Math.max(-1, Math.min(1, (ax / r) * P.s * 3))
      empurra += (az > 0 ? Math.min(0, passo[i]) : Math.max(0, passo[i])) * Math.abs(az / r) * doLado
    })
    s.g.rotation.x += empurra * (ponta ? MOV.andar.saiaPonta : MOV.andar.saia)
  }
  animarMolas(m.cabelo, m.root, dt)
  // o aviso acabou (ou foi cortado): o chão volta; embaixo do Luto, ela não desenha
  if (e.luto?.domo.visible && A.golpe?.nome !== 'aviso') estufar(e.luto, 0, 0, 0, 0)
  m.root.visible = saida.y > -2.35
  return saida
}
