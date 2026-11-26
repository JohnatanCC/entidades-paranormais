// O Devora espectros se mexendo (o fantasma capturável do jogo novo). Ele sempre flutua; quem o controla pede um golpe e
// o resto segue sozinho, de volta ao flutuar:
//   bote (de longe, de frente para o alvo): o aviso (recua, ergue a cabeça, a boca abre, acende âmbar) → a investida reta
//     de boca aberta → a boca fecha no fim (o instante do dano) → volta;
//   morder (de perto): o aviso curto → a cabeça vai à frente e a boca fecha (o instante do dano) → volta;
//   cuspir (uma Sombra ou uma Asa espectral): infla (recua, estufa, a boca abre devagar) → cospe (o tranco para trás, a
//     boca escancarada: a cria sai da boca) → volta.
//   O dano (ferir): o tranco e o brilho do golpe, por cima de qualquer modo.
// animarDevoraEspectros devolve a altura do root, o quanto ele avança (m/s para a frente dele) e o que aconteceu neste
// quadro: fechou (a boca fechou num golpe: quem estiver no alcance leva o dano) e cria (qual, de onde sai, para que lado).
import * as THREE from 'three'
import { avisar, piscar } from '../../../render/golpe'
import { animarMolas } from '../../corpo/molas'
import type { DevoraEspectros } from './modelo'
import { BOCA, BOTE, CUSPE, DANO, ESCALA, FRACO, MORDIDA, ONDA, PAIRAR } from './numeros'

export type ModoEspectros = 'pairar' | 'bote' | 'morder' | 'cuspir'
export type CriaEspectros = 'sombra' | 'asa'
export interface SaidaEspectros { y: number; avanca: number; fechou: boolean; cria: { tipo: CriaEspectros; de: THREE.Vector3; frente: THREE.Vector3 } | null }

const _q = new THREE.Quaternion(), _x = new THREE.Vector3(1, 0, 0), _v = new THREE.Vector3()
const volta = (t: number, s: number) => Math.sin((t / s) * Math.PI * 2)
const cl = (x: number) => Math.max(0, Math.min(1, x))
const suave = (k: number) => { const x = cl(k); return x * x * (3 - 2 * x) }

/** Começa um golpe (de qualquer modo: o anterior é cortado). */
export function golpe(d: DevoraEspectros, modo: Exclude<ModoEspectros, 'pairar'>, cria: CriaEspectros = 'sombra') {
  Object.assign(d.anim, { modo, tm: 0, feito: false, cria })
}

/** Levou um tiro: o tranco (vindo de `de`, rad no mundo) e o brilho. */
export function ferir(d: DevoraEspectros, de: number) {
  d.anim.dano = { t: 0, lado: Math.sin(de - d.root.rotation.y) }
  piscar(d.root)
}

/** As fases de cada golpe: [nome, duração] na ordem; devolve a fase atual e quanto dela já passou (0..1). */
function fase(tm: number, fases: [string, number][]): [string, number] {
  let t = tm
  for (const [n, s] of fases) { if (t < s) return [n, t / s]; t -= s }
  return ['fim', 1]
}

/** fraco (0..1): a vida zerada, ele afunda e amolece (FRACO, numeros.ts). */
export function animarDevoraEspectros(d: DevoraEspectros, andar: number, dt: number, fraco = 0): SaidaEspectros {
  const A = d.anim, out: SaidaEspectros = { y: 0, avanca: 0, fechou: false, cria: null }
  A.t += dt; A.tm += dt
  A.deita += (andar - A.deita) * (1 - Math.exp(-2 * dt))
  A.fraco += (fraco - A.fraco) * (1 - Math.exp(-2.5 * dt))
  // o que cada golpe faz agora: pitch (rad, + o nariz desce), boca (rad), tenso (os tentáculos: 1 soltos, 0 esticados
  // para trás), estufa (o corpo cresce), aviso (o brilho âmbar, 0..1)
  // o instante do golpe (a boca fecha) pelo tempo do golpe, não pelo quadro: com poucos quadros por segundo a fase curta
  // da abocanhada passaria sem ninguém ver
  const fecha = A.modo === 'bote' ? BOTE.aviso + BOTE.investe * 0.85 : A.modo === 'morder' ? MORDIDA.aviso + MORDIDA.abocanha * 0.8 : -1
  if (fecha >= 0 && !A.feito && A.tm >= fecha) { A.feito = true; out.fechou = true }
  let pitch = 0, boca = BOCA.aberta + BOCA.respira * volta(A.t, BOCA.volta), tenso = 1, estufa = 0, aviso = 0
  if (A.modo === 'bote') {
    const [f, k] = fase(A.tm, [['aviso', BOTE.aviso], ['investe', BOTE.investe], ['volta', BOTE.volta]])
    if (f === 'aviso') { pitch = -BOTE.recua * suave(k); boca = BOTE.boca * suave(k); tenso = 1 - 0.6 * k; aviso = k; out.avanca = -0.6 }
    else if (f === 'investe') { pitch = -BOTE.recua * (1 - k) + 0.15 * k; boca = BOTE.boca * (1 - suave((k - 0.7) / 0.3)); tenso = 0.2; out.avanca = BOTE.distancia / BOTE.investe; }
    else if (f === 'volta') { pitch = 0.15 * (1 - suave(k)); boca = BOCA.aberta * suave(k); tenso = 0.2 + 0.8 * k; out.avanca = -BOTE.distancia / BOTE.volta * 0.35 * (1 - k) }
    else A.modo = 'pairar'
  } else if (A.modo === 'morder') {
    const [f, k] = fase(A.tm, [['aviso', MORDIDA.aviso], ['abocanha', MORDIDA.abocanha], ['volta', MORDIDA.volta]])
    if (f === 'aviso') { pitch = -0.2 * suave(k); boca = MORDIDA.boca * suave(k); aviso = k; out.avanca = -0.8 }
    else if (f === 'abocanha') { pitch = -0.2 + 0.35 * k; boca = MORDIDA.boca * (1 - suave(k)); out.avanca = MORDIDA.avanco / MORDIDA.abocanha; }
    else if (f === 'volta') { pitch = 0.15 * (1 - suave(k)); boca = BOCA.aberta * suave(k); out.avanca = -MORDIDA.avanco / MORDIDA.volta * 0.6 }
    else A.modo = 'pairar'
  } else if (A.modo === 'cuspir') {
    const [f, k] = fase(A.tm, [['infla', CUSPE.infla], ['cospe', CUSPE.cospe], ['volta', CUSPE.volta]])
    if (f === 'infla') { pitch = -0.25 * suave(k); boca = CUSPE.boca * 0.5 * suave(k); estufa = CUSPE.estufa * suave(k); tenso = 1 - 0.4 * k; aviso = 0.6 * k }
    else if (f === 'cospe') {
      pitch = -0.25 + 0.4 * suave(k); boca = CUSPE.boca; estufa = CUSPE.estufa * (1 - k); tenso = 0.4; out.avanca = -CUSPE.recua * (1 - k)
      if (!A.feito) { // a cria sai da boca, para a frente dele
        A.feito = true
        d.root.updateMatrixWorld(true)
        const frente = new THREE.Vector3(Math.sin(d.root.rotation.y), 0, Math.cos(d.root.rotation.y))
        out.cria = { tipo: A.cria, de: d.mandibula.getWorldPosition(new THREE.Vector3()).addScaledVector(frente, 0.5 * ESCALA), frente }
      }
    } else if (f === 'volta') { pitch = 0.15 * (1 - suave(k)); boca = CUSPE.boca + (BOCA.aberta - CUSPE.boca) * suave(k); tenso = 0.4 + 0.6 * k }
    else A.modo = 'pairar'
  }
  // fraco: o nariz cai, a boca fica solta, os tentáculos amolecem
  pitch += FRACO.nariz * A.fraco; boca = Math.max(boca, 0.35 * A.fraco); tenso *= 1 - 0.8 * A.fraco
  // o tiro: o tranco para trás e de lado, por cima de tudo
  let tranco = 0, lado = 0
  if (A.dano) {
    A.dano.t += dt
    const k = A.dano.t / DANO.dura
    if (k >= 1) A.dano = null
    else { const e = Math.sin(Math.PI * Math.min(1, k * 1.6)) * (1 - k); tranco = -DANO.tranco * e; lado = DANO.tranco * A.dano.lado * e; boca = Math.max(boca, 0.5 * e) }
  }
  // os tentáculos ondulam (esticados para trás quando tenso cai: menos onda)
  for (const T of d.tentaculos) T.ossos.forEach((o, k) => {
    const f = (A.t / ONDA.volta) * Math.PI * 2 - T.fase * ONDA.defasa - k * ONDA.porOsso, peso = ONDA.amplo * ONDA.ossos[k] * (1 + 0.4 * A.deita) * (0.25 + 0.75 * tenso)
    o.quaternion.copy(T.base[k]).multiply(_q.setFromAxisAngle(T.a, Math.sin(f) * peso)).multiply(_q.setFromAxisAngle(T.b, Math.cos(f * 0.7) * peso * 0.6))
  })
  d.mandibula.quaternion.copy(d.base.mandibula).multiply(_q.setFromAxisAngle(_x, boca))
  d.corpo.quaternion.copy(d.base.corpo)
    .multiply(_q.setFromAxisAngle(_x, PAIRAR.inclina * volta(A.t + 0.6, PAIRAR.volta) + PAIRAR.deita * A.deita + pitch + tranco))
    .multiply(_q.setFromAxisAngle(_v.set(0, 0, 1), lado))
  d.corpo.scale.setScalar(1 + estufa)
  avisar(d.root, aviso) // o aviso do golpe acende (render/golpe.ts)
  animarMolas(d.molas, d.root, dt)
  out.y = PAIRAR.altura + (FRACO.altura - PAIRAR.altura) * A.fraco + PAIRAR.sobe * (1 - 0.6 * A.fraco) * volta(A.t, PAIRAR.volta)
  return out
}
