// O Manto espectral se mexendo. Sempre: parado (respira, os braços longos pendem e balançam, os curtos mexem) ou andando
// (as pernas de ave, o corpo subindo a cada passo, os braços longos indo contra as pernas). Quem o controla pede um golpe
// e o resto segue sozinho:
//   agarrar (perto): o aviso (inclina para trás, abre os braços longos, acende âmbar) → o bote (avança e fecha os braços:
//     o instante do agarrão) → segura 2 s (os braços fechados em volta, o corpo apertando e tremendo) → solta;
//   socos (meia distância): puxa os braços para trás (o aviso) → 4 socos alternados, o antebraço esticando para a frente
//     (cada um pega no meio do soco) → volta;
//   girar (com 30% da vida): ergue os braços de lado e agacha (o aviso) → gira com os braços esticados (quem o controla
//     o leva devagar para o agente; cada volta pega quem estiver no raio; em volta dele, o tornado de luz: tornado.ts) →
//     atordoado (2 s: cai, deita, a cabeça tonta).
//   O tiro (ferir): o tranco e o brilho, por cima de tudo. Fraco (a vida zerada): agacha e amolece (a captura).
// animarMantoEspectral devolve o quanto ele avança (m/s para a frente dele), o quanto gira (rad/s, o root) e o que
// aconteceu neste quadro: agarrou, soco (qual dos 4) e volta (uma volta do giro passou: quem está no raio leva o golpe).
import * as THREE from 'three'
import { avisar, piscar } from '../../../render/golpe'
import { animarMolas } from '../../corpo/molas'
import type { MantoEspectral } from './modelo'
import { passoTornado } from './tornado'
import { AGARRAR, ANDAR, ATORDOADO, DANO, FRACO, GIRO, PARADO, SOCOS } from './numeros'

export type ModoManto = 'pairar' | 'agarrar' | 'socos' | 'girar' | 'atordoado'
export interface SaidaManto { avanca: number; giro: number; agarrou: boolean; segurando: boolean; soco: number | null; volta: boolean }

const _q = new THREE.Quaternion(), _e = new THREE.Euler()
const onda = (t: number, s: number) => Math.sin((t / s) * Math.PI * 2)
const cl = (x: number) => Math.max(0, Math.min(1, x))
const suave = (k: number) => { const x = cl(k); return x * x * (3 - 2 * x) }
/** Gira o osso a partir da pose do arquivo (x, y, z em rad). */
function girar(m: MantoEspectral, o: THREE.Object3D, x: number, y = 0, z = 0) {
  o.quaternion.copy(m.base.get(o)!).multiply(_q.setFromEuler(_e.set(x, y, z, 'XYZ')))
}
/** As fases de um golpe: [nome, duração]; devolve a fase atual e quanto dela já passou (0..1). */
function fase(tm: number, fases: [string, number][]): [string, number] {
  let t = tm
  for (const [n, s] of fases) { if (t < s) return [n, t / s]; t -= s }
  return ['fim', 1]
}

/** Começa um golpe (o anterior é cortado). */
export function golpear(m: MantoEspectral, modo: Exclude<ModoManto, 'pairar'>) { Object.assign(m.anim, { modo, tm: 0, feito: 0, giro: 0 }) }
/** Levou um tiro: o tranco (de `de`, rad no espaço dele) e o brilho. */
export function ferir(m: MantoEspectral, de: number) { m.anim.dano = { t: 0, lado: Math.sin(de) }; piscar(m.root) }

// a pose dos braços longos de cada golpe: [braço x (para a frente, −), braço z (de lado, +fora), antebraço x (dobra),
// estica (o antebraço, vezes)]
type Pose = [number, number, number, number]
const REPOUSO: Pose = [0, 0, 0, 1]

/** Um quadro. andar = m/s pedidos (0 parado); fraco = 0..1 (a vida zerada). */
export function animarMantoEspectral(m: MantoEspectral, andar: number, dt: number, fraco = 0): SaidaManto {
  const A = m.anim, out: SaidaManto = { avanca: 0, giro: 0, agarrou: false, segurando: false, soco: null, volta: false }
  A.t += dt; A.tm += dt
  const andando = A.modo === 'pairar' && andar > 0
  A.andar += ((andando ? 1 : 0) - A.andar) * (1 - Math.exp(-5 * dt))
  A.fraco += (fraco - A.fraco) * (1 - Math.exp(-3 * dt))
  if (andando) A.passo += dt / ANDAR.passo
  const k = A.andar, passo = A.passo * Math.PI // cada passo é meia volta

  // ---------- o golpe: a pose dos braços longos (e, e d), o corpo (deita, cai), o avanço e o aviso ----------
  let pe: Pose = REPOUSO, pd: Pose = REPOUSO, deita = 0, cai = 0, aviso = 0, aperta = 0, cabecaZ = 0
  if (A.modo === 'agarrar') {
    const [f, u] = fase(A.tm, [['aviso', AGARRAR.aviso], ['bote', AGARRAR.bote], ['segura', AGARRAR.segura], ['solta', AGARRAR.solta]])
    const aberto: Pose = [-0.7, 0.9, -0.2, 1], fechado: Pose = [-1.25, -0.35, -0.9, 1.15]
    const mix = (a: Pose, b: Pose, t: number): Pose => a.map((v, i) => v + (b[i] - v) * t) as Pose
    if (f === 'aviso') { const t = suave(u); pe = mix(REPOUSO, aberto, t); deita = -0.18 * t; aviso = u }
    else if (f === 'bote') { const t = suave(u); pe = mix(aberto, fechado, t); deita = -0.18 + 0.45 * t; out.avanca = AGARRAR.avanco }
    else if (f === 'segura') { pe = fechado; deita = 0.27; aperta = 0.04 * Math.sin(A.tm * 40); out.segurando = true; cabecaZ = 0.08 * Math.sin(A.tm * 9) }
    else if (f === 'solta') { const t = suave(u); pe = mix(fechado, REPOUSO, t); deita = 0.27 * (1 - t) }
    else A.modo = 'pairar'
    if (A.feito === 0 && A.tm >= AGARRAR.aviso + AGARRAR.bote) { A.feito = 1; out.agarrou = true } // o instante do agarrão, pelo tempo
    pd = [pe[0], -pe[1], pe[2], pe[3]]
  } else if (A.modo === 'socos') {
    const atras: Pose = [-0.55, 0.25, -0.9, 1]
    if (A.tm < SOCOS.aviso) { const t = suave(A.tm / SOCOS.aviso); pe = pd = [atras[0] * t, atras[1] * t, atras[2] * t, 1]; deita = -0.1 * t; aviso = A.tm / SOCOS.aviso }
    else if (A.tm < SOCOS.aviso + SOCOS.n * SOCOS.cada) {
      const t = A.tm - SOCOS.aviso, i = Math.floor(t / SOCOS.cada), u = (t % SOCOS.cada) / SOCOS.cada
      // o soco: estica rápido até o pega e volta; o outro braço fica puxado atrás
      const vai = u < SOCOS.pega ? suave(u / SOCOS.pega) : 1 - suave((u - SOCOS.pega) / (1 - SOCOS.pega))
      const soco: Pose = [atras[0] + (-1.5 - atras[0]) * vai, atras[1] * (1 - vai) - 0.12 * vai, atras[2] * (1 - vai), 1 + (SOCOS.estica - 1) * vai]
      if (i % 2 === 0) { pe = soco; pd = atras } else { pd = soco; pe = atras }
      pd = [pd[0], -pd[1], pd[2], pd[3]]
      deita = 0.12 * vai; out.avanca = SOCOS.avanco
      if (A.feito <= i && u >= SOCOS.pega) { A.feito = i + 1; out.soco = i } // cada soco pega no meio dele (pelo tempo)
    } else if (A.tm < SOCOS.aviso + SOCOS.n * SOCOS.cada + SOCOS.volta) {
      const t = suave((A.tm - SOCOS.aviso - SOCOS.n * SOCOS.cada) / SOCOS.volta)
      pe = [atras[0] * (1 - t), atras[1] * (1 - t), atras[2] * (1 - t), 1]; pd = [pe[0], -pe[1], pe[2], 1]
    } else A.modo = 'pairar'
  } else if (A.modo === 'girar') {
    const aberto: Pose = [-0.15, 1.45, 0, 1.3]
    if (A.tm < GIRO.aviso) { const t = suave(A.tm / GIRO.aviso); pe = [aberto[0] * t, aberto[1] * t, 0, 1 + 0.3 * t]; cai = 0.08 * t; aviso = A.tm / GIRO.aviso }
    else if (A.tm < GIRO.aviso + GIRO.dura) {
      const t = (A.tm - GIRO.aviso) / GIRO.dura, forca = suave(t / 0.15) * (1 - suave((t - 0.85) / 0.15)) // acelera e freia
      pe = aberto; cai = 0.08
      out.giro = GIRO.vel * forca; out.avanca = GIRO.anda * forca
      const antes = A.giro; A.giro += out.giro * dt
      if (Math.floor(A.giro / (Math.PI * 2)) > Math.floor(antes / (Math.PI * 2))) out.volta = true // passou uma volta
    } else { golpear(m, 'atordoado') } // acabou o giro: tonto
    pd = [pe[0], -pe[1], pe[2], pe[3]]
  } else if (A.modo === 'atordoado') {
    const u = A.tm / ATORDOADO.dura, t = suave(u / 0.2) * (1 - suave((u - 0.8) / 0.2))
    cai = ATORDOADO.cai * t; deita = ATORDOADO.deita * t; cabecaZ = ATORDOADO.cabeca * t * Math.sin(A.tm * 4.5)
    pe = [0.25 * t, -0.1 * t, 0.2 * t, 1]; pd = [pe[0], -pe[1], pe[2], 1] // os braços moles
    if (u >= 1) A.modo = 'pairar'
  }
  // fraco: agacha, deita e os braços pendem
  cai += FRACO.cai * A.fraco; deita += FRACO.deita * A.fraco
  if (A.fraco > 0.01 && A.modo === 'pairar') { pe = [0.2 * A.fraco, -0.05, 0.15 * A.fraco, 1]; pd = [pe[0], 0.05, pe[2], 1] }

  // ---------- o corpo: respira, sobe a cada passo, deita (o golpe, o tiro) e cai ----------
  let tranco = 0, lado = 0
  if (A.dano) {
    A.dano.t += dt
    const u = A.dano.t / DANO.dura
    if (u >= 1) A.dano = null
    else { const e = Math.sin(Math.PI * Math.min(1, u * 1.6)) * (1 - u); tranco = -DANO.tranco * e; lado = DANO.tranco * A.dano.lado * e }
  }
  const resp = PARADO.respira * onda(A.t, PARADO.volta)
  m.corpo.scale.set(1 - resp * 0.5 + aperta, 1 + resp - aperta, 1 - resp * 0.5 + aperta)
  girar(m, m.quadril, ANDAR.deita * k + deita + tranco, 0.05 * k * Math.sin(passo), lado)
  m.quadril.position.y = A.quadrilY + ANDAR.sobe * k * Math.abs(Math.sin(passo)) - cai
  girar(m, m.cabeca, 0, 0, cabecaZ)
  // as pernas: uma vai, a outra volta; o joelho dobra quando a perna vem para a frente; caindo, os dois dobram
  for (const [l, s] of [['e', 1], ['d', -1]] as const) {
    const p = m.perna[l], c = Math.sin(passo) * s
    girar(m, p.coxa, -ANDAR.coxa * c * k - cai * 1.6)
    girar(m, p.canela, ANDAR.joelho * Math.max(0, c) * k + cai * 2.4)
    girar(m, p.pe, ANDAR.coxa * c * 0.5 * k - cai * 0.8)
  }
  // os braços longos: a pose do golpe por cima do balanço; o braço inteiro estica (o de cima e o antebraço, cada um a raiz
  // do quanto: o antebraço herda o de cima) e a mão desfaz (a garra não estica)
  for (const [l, s, pose] of [['e', 1, pe], ['d', -1, pd]] as const) {
    const L = m.longo[l], bal = PARADO.bracos * onda(A.t + (s > 0 ? 0 : 0.7), PARADO.balanco)
    const livre = pose === REPOUSO ? 1 : 0.25 // no golpe, o balanço quase some
    girar(m, L.ombro, pose[0] + (bal + ANDAR.bracos * Math.sin(passo) * s * k) * livre, 0, pose[1])
    girar(m, L.antebraco, pose[2] - (0.1 + bal * 0.8) * livre)
    const r = Math.sqrt(pose[3])
    L.ombro.scale.set(1, r, 1); L.antebraco.scale.set(1, r, 1); L.mao.scale.set(1, 1 / pose[3], 1)
    girar(m, L.mao, 0.15 * onda(A.t + 0.3, PARADO.balanco) * livre)
    const C = m.curto[l]
    girar(m, C.braco, PARADO.curtos * onda(A.t * 1.3 + (s > 0 ? 0 : 1.1), 1.7) + (out.segurando ? -0.6 : 0))
    girar(m, C.antebraco, -PARADO.curtos * onda(A.t * 1.3 + 0.4, 1.7))
  }
  avisar(m.root, aviso) // o aviso do golpe acende âmbar (render/golpe.ts)
  passoTornado(m.tornado, out.giro / GIRO.vel, dt) // o tornado de luz, com a força do giro
  animarMolas(m.manto, m.root, dt); animarMolas(m.molas, m.root, dt)
  out.avanca += A.modo === 'pairar' ? andar : 0
  return out
}
