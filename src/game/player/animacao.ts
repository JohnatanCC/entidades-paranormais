// A animação do agente (do laboratório): a passada pela distância percorrida, o tronco que desfaz o giro
// do quadril, os braços balançando opostos às pernas, a barra da jaqueta numa mola e a cambalhota da esquiva.
// Sem queda nem morte (o projeto não usa animação de morte). Quem move e gira o root é o controle; aqui só os ossos.
import * as THREE from 'three'
import type { Agente } from './modelo'
import { animarCabelo } from './cabelo'
import { animarMaos, type PoseMao } from './maos'
import { AGENTE } from './numeros'
import { animarRosto, type Expressao } from './rosto'

export interface EstadoAnim {
  velocidade: number // m/s no chão
  corrida: number // 0..1, quanto está correndo
  esquiva: number // -1 = não está esquivando; 0..1 = andamento da esquiva
  expressao?: Expressao // força uma expressão (sem: neutra parado, esforço correndo e na cambalhota)
  mao?: PoseMao // força uma pose das mãos (sem: soltas, fechando ao correr, punho na cambalhota)
}

const STAND = 0.42 // a altura do quadril dentro do pivô da cambalhota, antes de acertar os pés no chão
const VOLTA = Math.PI * 2

const cl = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x))
const sm = (x: number) => { const k = cl(x); return k * k * (3 - 2 * k) }
const lerp = (a: number, b: number, k: number) => a + (b - a) * k
const damp = (cur: number, alvo: number, k: number, dt: number) => cur + (alvo - cur) * (1 - Math.exp(-k * dt))

// um ponto de um osso no espaço do root (sem depender do matrixWorld, que pode estar atrasado)
const _p = new THREE.Vector3()
function naRaiz(o: THREE.Object3D, raiz: THREE.Object3D, v: THREE.Vector3) {
  for (let n: THREE.Object3D | null = o; n && n !== raiz; n = n.parent) { n.updateMatrix(); v.applyMatrix4(n.matrix) }
  return v
}

// O ponto mais baixo do corpo (espaço do root), medido em esferas nos ossos: a cabeça, a mochila, os ombros, o quadril,
// os joelhos, os pés, os cotovelos e as mãos. Só na cambalhota (em pé, quem acerta a altura são as solas).
function maisBaixo(a: Agente) {
  let lo = Infinity
  const ver = (o: THREE.Object3D, x: number, y: number, z: number, r: number) => { const v = naRaiz(o, a.root, _p.set(x, y, z)).y - r; if (v < lo) lo = v }
  ver(a.head, 0, 0.1, 0.006, 0.135)
  for (const sx of [-0.15, 0.15]) for (const sy of [-0.2, 0.2]) ver(a.pack, sx, sy, -0.1, 0)
  for (const s of [-1, 1]) ver(a.chest, s * 0.19, 0.205, 0, 0.075)
  ver(a.pelvis, 0, -0.03, 0, 0.12)
  for (const L of a.legs) { ver(L.kn, 0, 0, 0, 0.065); ver(L.ft, 0, -0.03, -0.07, 0.04); ver(L.ft, 0, -0.03, 0.19, 0.04) }
  for (const b of a.arms) { ver(b.fo, 0, 0, 0, 0.05); ver(b.hd, 0, -0.07, 0, 0.05) }
  return lo
}

export function animarAgente(a: Agente, e: EstadoAnim, dt: number): void {
  dt = cl(dt, 0, 0.05) // um quadro travado não estoura a mola da barra
  const m = a.anim
  const rolando = e.esquiva >= 0
  const sp = rolando ? 0 : Math.max(0, e.velocidade)
  m.tempo = (m.tempo + dt) % (VOLTA / 1.9)
  m.corrida = damp(m.corrida, cl(e.corrida), 6, dt)
  m.amp = damp(m.amp, cl(sp / AGENTE.andar, 0, 1.3), 7, dt) // 1 andando; correndo passa um pouco
  // ---------- a passada: a fase anda com a distância (uma volta = uma passada de cada perna) ----------
  const passada = lerp(1.45, 2.5, m.corrida) // metros por volta
  m.fase = (m.fase + (sp / passada) * VOLTA * dt) % VOLTA
  const amp = m.amp, run = m.corrida, ph = m.fase
  const thA = amp * lerp(0.42, 0.66, run), bend = amp * lerp(0.6, 1.4, run)
  for (const L of a.legs) {
    const p = ph + (L.s > 0 ? Math.PI : 0), sw = Math.sin(p), cs = Math.cos(p)
    const th = -thA * sw - 0.1 * run * amp
    const kn = 0.06 + bend * Math.pow(Math.max(0, cs), 1.4) + 0.12 * run * amp
    const toe = amp * (0.3 * Math.max(0, Math.sin(p + 2.0)) - 0.22 * Math.max(0, Math.sin(p - 0.25)) * (1 - run * 0.5))
    L.th.rotation.set(th, 0, L.s * (0.045 + 0.025 * (1 - Math.min(1, amp))))
    L.kn.rotation.set(kn, 0, 0)
    L.ft.rotation.set(-(th + kn) + toe, 0, -L.s * 0.035)
  }
  const osc = 0.11 * amp * Math.sin(ph) * (0.7 + 0.3 * run) // o quadril gira com a perna que vai à frente
  a.roll.rotation.set(0, 0, 0); a.roll.position.set(0, 0.5, 0)
  a.pelvis.position.set(0, STAND, 0)
  a.pelvis.rotation.set(0.05 * run * amp, rolando ? 0 : osc, 0.045 * amp * Math.cos(ph))
  // o pé de apoio fica no chão: mede as solas e acerta a altura do quadril
  let lo = Infinity
  for (const L of a.legs) for (const q of a.sola) { const y = naRaiz(L.ft, a.root, _p.copy(q)).y; if (y < lo) lo = y }
  a.pelvis.position.y = STAND - lo + 0.03 * run * amp * Math.max(0, Math.sin(2 * ph - 0.4)) // correndo: o voo entre os passos

  // ---------- o tronco: desfaz o giro do quadril; parado, respira ----------
  const breath = Math.sin(m.tempo * 1.9) * 0.012 * (1 - Math.min(1, amp) * 0.5)
  a.spine.rotation.set(0.04 + 0.07 * run * amp, -osc * 0.9, -0.03 * amp * Math.cos(ph))
  a.chest.rotation.set(breath + 0.05 * run * amp, -osc * 0.35, 0)

  // ---------- a cambalhota: encolhe e gira inteiro em volta do meio do corpo ----------
  let tuck = 0
  if (rolando) {
    const u = cl(e.esquiva), r = sm((u - 0.04) / 0.8)
    tuck = sm(u / 0.16) * (1 - sm((u - 0.72) / 0.28))
    a.roll.rotation.x = r * VOLTA; a.roll.position.y = 0.5 + 0.08 * Math.sin(Math.PI * r)
    for (const L of a.legs) {
      L.th.rotation.x = lerp(L.th.rotation.x, -1.85, tuck); L.kn.rotation.x = lerp(L.kn.rotation.x, 2.25, tuck); L.ft.rotation.x = lerp(L.ft.rotation.x, 0.35, tuck)
    }
    a.pelvis.position.y = lerp(a.pelvis.position.y, 0.02, tuck)
    a.spine.rotation.x = lerp(a.spine.rotation.x, 0.6, tuck); a.chest.rotation.x = lerp(a.chest.rotation.x, 0.45, tuck)
  }

  // ---------- a cabeça: olha para a frente (desfaz a inclinação e o giro do tronco); na cambalhota, o queixo no peito ----------
  const k = 1 - tuck
  const hx = 0.06 - (a.pelvis.rotation.x + a.spine.rotation.x + a.chest.rotation.x) // um pouco para baixo, como no laboratório
  const hy = -(a.pelvis.rotation.y + a.spine.rotation.y + a.chest.rotation.y)
  a.neck.rotation.set(hx * 0.35 * k + 0.5 * tuck, hy * 0.4 * k, 0)
  a.head.rotation.set(hx * 0.65 * k, hy * 0.6 * k, 0)

  // ---------- os braços: soltos, balançam opostos às pernas; correndo, o cotovelo dobra ----------
  // com pistola ou escopeta, o direito fica na guarda: o cotovelo dobrado e a arma apontada para o chão na frente
  // (mirar, o coice e a outra mão na escopeta vêm na etapa das armas); a armadilha vai pendurada, o braço balança
  const guarda = a.arma === 'pistola' || a.arma === 'escopeta'
  for (const b of a.arms) {
    let x = -b.s * 0.38 * amp * Math.sin(ph) * (1 + 0.5 * run) + 0.06
    let el = -0.22 - 1.0 * run * amp - 0.1 * amp
    if (guarda && b.s < 0) { x = -0.3 - 0.05 * amp * Math.sin(ph) - 0.25 * run * amp; el = -0.95 - 0.3 * run * amp }
    if (tuck > 0) { x = lerp(x, -0.7, tuck); el = lerp(el, -1.7, tuck) } // agarrado às pernas
    b.up.rotation.set(x, 0, b.s * (0.1 + 0.06 * run), 'XZY')
    b.fo.rotation.set(el, 0, 0)
    b.hd.rotation.set(0.1, -b.s * Math.PI / 2, 0) // a palma virada para dentro (para a coxa, ou de lado no cabo da arma)
  }
  // no laboratório a cabeça e os pés afundavam até 24 cm no chão no meio da cambalhota: o pivô sobe o que faltar
  if (rolando) a.roll.position.y += Math.max(0, -maisBaixo(a))

  // ---------- as mãos e o rosto ----------
  const segura = a.arma ? 'segurar' : undefined // a mão da arma fica fechada nela
  if (e.mao) animarMaos(a, e.mao, 1, dt, m.tempo, segura)
  else animarMaos(a, 'punho', rolando ? 1 : 0.6 * run * Math.min(1, amp), dt, m.tempo, segura)
  animarRosto(a, e.expressao ?? (rolando || run > 0.5 ? 'esforco' : 'neutra'), dt)

  // ---------- a barra da jaqueta: as da frente seguem as coxas, a de trás abre correndo (uma mola) ----------
  for (const pn of a.panels) {
    let tg = pn.s ? Math.min(0.06, a.legs[pn.s < 0 ? 0 : 1].th.rotation.x * 0.8) : 0.08 + 0.28 * run * amp + 0.1 * amp
    if (tuck > 0.3) tg = pn.s ? -0.75 : 0.65
    pn.v += ((tg - pn.sw) * 120 - pn.v * 14) * dt; pn.sw += pn.v * dt; pn.g.rotation.x = pn.sw
  }
  // ---------- o cabelo: as mechas balançam com o movimento da cabeça (depois de tudo posto no lugar) ----------
  animarCabelo(a, dt)
}
