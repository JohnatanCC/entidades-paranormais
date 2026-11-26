// O Asa do terror se mexendo. Sempre: o voo. Os dois pares de asas batem (as de baixo atrasadas): descem rápido indo um
// pouco para a frente e sobem devagar com a ponta dobrada; o corpo sobe a cada batida, balança de lado e olha em volta;
// andando, deita para a frente e o pano e os tentáculos ficam para trás. As mandíbulas estalam (como um inseto), o bico
// acompanha. O pano do capuz, os tentáculos e os cubos balançam nas molas, com a brisa.
// Quem o controla pede um golpe (golpear) e o resto segue sozinho:
//   tiro: a carga (as asas abrem para cima e tremem, as mandíbulas escancaram, o corpo vai para trás, o aviso âmbar; a
//     bola de luz cresce entre as mandíbulas: `carga`) → o disparo (`dispara`: o coice, as mandíbulas fecham) → volta;
//   rajada (com 30% da vida): a mesma carga e 3 disparos seguidos;
//   sumir (o teletransporte): se desfaz (encolhe, treme e torce) → `sumiu` (o instante de trocá-lo de lugar) → surge.
//   O tiro que leva (ferir): o tranco e o brilho. Fraco (a vida zerada): desce, as asas caem e batem devagar, as
//   mandíbulas pendem abertas (a hora da captura).
// A bola de luz, a bomba e os cubos do teletransporte são de efeitos.ts. Os números em numeros.ts.
import * as THREE from 'three'
import { avisar, piscar } from '../../../render/golpe'
import { animarMolas } from '../../corpo/molas'
import type { AsaTerror } from './modelo'
import { DANO, FRACO, TELE, TIRO, VOO } from './numeros'

/** O que aconteceu neste quadro: sobe = o quanto o corpo sobe (m, para somar na altura do voo); carga = a bola de luz
 *  entre as mandíbulas (0 = nenhuma); dispara = saiu um tiro; sumiu = o instante de trocá-lo de lugar. */
export interface SaidaAsaTerror { sobe: number; carga: number; dispara: boolean; sumiu: boolean }

const _q = new THREE.Quaternion(), _e = new THREE.Euler(), _vento = new THREE.Vector3(), _frente = new THREE.Vector3()
const cl = (x: number) => Math.max(0, Math.min(1, x))
const suave = (k: number) => { const x = cl(k); return x * x * (3 - 2 * x) }
/** Gira o osso a partir da pose do arquivo (x, y, z em rad). */
function girar(a: AsaTerror, o: THREE.Object3D, x: number, y = 0, z = 0) {
  o.quaternion.copy(a.base.get(o)!).multiply(_q.setFromEuler(_e.set(x, y, z, 'XYZ')))
}
// a batida: desce rápido (40% do tempo) e sobe devagar; +1 = em cima
const bate = (f: number) => (f < 0.4 ? Math.cos((f / 0.4) * Math.PI) : -Math.cos(((f - 0.4) / 0.6) * Math.PI))
// o quanto está na subida (0..1..0): a ponta dobra
const subida = (f: number) => (f < 0.4 ? 0 : Math.sin(((f - 0.4) / 0.6) * Math.PI))

/** Começa um golpe (o anterior é cortado). */
export function golpear(a: AsaTerror, modo: 'tiro' | 'rajada' | 'sumir') { Object.assign(a.anim, { modo, tm: 0, feito: 0 }) }
/** Levou um tiro: o tranco (de `de`, rad no espaço dele) e o brilho. */
export function ferir(a: AsaTerror, de: number) { a.anim.dano = { t: 0, lado: Math.sin(de) }; piscar(a.root) }
/** De onde sai o tiro (entre as mandíbulas), no mundo. */
export function bocaNoMundo(a: AsaTerror, out: THREE.Vector3) { return a.corpo.localToWorld(out.set(...TIRO.boca)) }

/** Um quadro: andar = a velocidade (m/s, para a frente dele); fraco = 0..1 (a vida zerada). */
export function animarAsaTerror(a: AsaTerror, andar: number, dt: number, fraco = 0): SaidaAsaTerror {
  const A = a.anim, out: SaidaAsaTerror = { sobe: 0, carga: 0, dispara: false, sumiu: false }
  A.t += dt; A.tm += dt
  A.fraco += (fraco - A.fraco) * (1 - Math.exp(-3 * dt))
  A.fase = (A.fase + dt / (VOO.batida * (1 + (FRACO.batida - 1) * A.fraco))) % 1
  A.andar += (Math.min(A.modo === 'voar' ? andar : 0, VOO.andarMax) - A.andar) * (1 - Math.exp(-4 * dt))
  A.recuo *= Math.exp(-9 * dt)

  // ---------- o golpe: as asas abertas (abre), as mandíbulas, o corpo para trás (deita), o tremor e o tamanho ----------
  let abre = 0, mandAlvo: number | null = null, deita = 0, treme = 0, aviso = 0, escala = 1, torce = 0
  if (A.modo === 'tiro' || A.modo === 'rajada') {
    const n = A.modo === 'tiro' ? 1 : TIRO.rajada, ultimo = TIRO.carga + (n - 1) * TIRO.entre
    if (A.tm < TIRO.carga) {
      const u = A.tm / TIRO.carga, t = suave(u * 1.4)
      out.carga = u; aviso = u; abre = t; mandAlvo = 1.5 * t; deita = -0.22 * t; treme = u
    } else {
      // cada disparo, no tempo dele (não no quadro: com poucos quadros por segundo não pula nenhum)
      if (A.feito < n && A.tm >= TIRO.carga + A.feito * TIRO.entre) { A.feito++; out.dispara = true; A.recuo = 1 }
      const falta = A.feito < n, t = falta ? 1 : 1 - suave((A.tm - ultimo) / TIRO.recuo)
      out.carga = falta ? 0.55 + (0.45 * ((A.tm - TIRO.carga) % TIRO.entre)) / TIRO.entre : 0
      aviso = falta ? 1 : 0; abre = t; mandAlvo = falta ? 1.3 : -0.3; deita = -0.22 * t; treme = falta ? 0.6 : 0
      if (A.tm >= ultimo + TIRO.recuo) A.modo = 'voar'
    }
  } else if (A.modo === 'sumir') {
    const u = A.tm / TELE.some
    escala = 1 - suave(u); treme = 1; torce = 2.5 * u * u; abre = -0.6 * suave(u) // as asas fecham em volta do corpo
    if (u >= 1) { out.sumiu = true; A.modo = 'surgir'; A.tm = 0; escala = 0 }
  } else if (A.modo === 'surgir') {
    const u = A.tm / TELE.surge
    escala = suave(u) * (1 + 0.18 * Math.sin(u * Math.PI)); torce = -1.2 * (1 - suave(u)); abre = 0.7 * (1 - suave(u))
    if (u >= 1) A.modo = 'voar'
  }
  a.corpo.scale.setScalar(Math.max(0.001, escala))

  // o tiro que ele leva: o tranco para trás e de lado
  let tranco = 0, lado = 0
  if (A.dano) {
    A.dano.t += dt
    const u = A.dano.t / DANO.dura
    if (u >= 1) A.dano = null
    else { const e = Math.sin(Math.PI * Math.min(1, u * 1.6)) * (1 - u); tranco = -DANO.tranco * e; lado = DANO.tranco * A.dano.lado * e }
  }

  // ---------- as asas ----------
  const forca = (1 - 0.75 * Math.abs(abre)) * (1 - 0.35 * A.fraco) // no golpe, quase param (seguram a pose)
  const pose = 0.55 * abre - FRACO.asas * A.fraco + 0.05 * treme * Math.sin(A.t * 47)
  const cima = bate(A.fase), fb = (A.fase + VOO.atraso) % 1, baixo = bate(fb)
  // as mandíbulas: dois estalos seguidos e uma pausa meio abertas; no golpe, a pose dele; fraco, pendem abertas
  const tq = (A.t / VOO.tique) % 1
  let alvo = tq < 0.1 ? 1 : tq < 0.18 ? -0.3 : tq < 0.28 ? 0.8 : tq < 0.36 ? -0.3 : 0.2 + 0.15 * Math.sin(A.t * 1.7)
  if (mandAlvo !== null) alvo = mandAlvo
  else if (A.fraco > 0.3) alvo = 0.9 + 0.1 * Math.sin(A.t * 2.3)
  A.mand += (alvo - A.mand) * (1 - Math.exp(-22 * dt))
  for (const [l, s] of [['e', 1], ['d', -1]] as const) {
    const W = a.asas[l]
    girar(a, W.asa, 0, -s * VOO.varre * Math.sin(A.fase * Math.PI * 2) * forca, s * (VOO.cima * cima * forca + pose))
    girar(a, W.ponta, 0, 0, s * ((VOO.ponta * bate((A.fase + 0.85) % 1) - VOO.dobra * subida(A.fase)) * forca + 0.25 * abre)) // a ponta vem atrás e dobra na subida
    girar(a, W.baixo, 0, -s * VOO.varre * Math.sin(fb * Math.PI * 2) * forca, s * (VOO.baixo * baixo * forca + pose * 0.8))
    girar(a, W.baixoPonta, 0, 0, s * (VOO.ponta * 0.8 * bate((fb + 0.85) % 1) - VOO.dobra * subida(fb)) * forca)
    girar(a, a.mandibulas[l], -0.12 * Math.max(0, A.mand), 0, s * VOO.mandibulas * A.mand)
  }
  girar(a, a.bico, -VOO.bico * Math.max(0, A.mand))
  // o corpo: o tranco da batida, deitado para a frente quando anda, o balanço de lado e o olhar em volta; o golpe por cima
  const calmo = A.modo === 'voar' ? 1 - A.andar / VOO.andarMax : 0
  girar(a, a.corpo, 0.06 * baixo * forca + VOO.inclina * A.andar + deita - 0.3 * A.recuo + tranco + 0.3 * A.fraco,
    VOO.olha * Math.sin(A.t * 0.7) * calmo + torce, VOO.balanco * Math.sin(A.t * 1.1) + lado + 0.035 * treme * Math.sin(A.t * 53))
  avisar(a.root, aviso) // a carga acende âmbar (render/golpe.ts)
  // a brisa (o pano e os tentáculos nunca param) e o ar que fica para trás de quem anda
  a.root.getWorldDirection(_frente)
  _vento.set(Math.sin(A.t * 1.3) + 0.5 * Math.sin(A.t * 3.1), 0, Math.cos(A.t * 0.9) + 0.5 * Math.sin(A.t * 2.3)).multiplyScalar(VOO.brisa)
  _vento.y = -VOO.sopro * cima * forca // as asas descendo empurram o ar para cima do pano (e o contrário)
  _vento.addScaledVector(_frente, -VOO.arrasto * A.andar + 14 * A.recuo) // o coice joga tudo para a frente
  animarMolas(a.molas, a.root, dt, _vento)
  out.sobe = -VOO.sobe * cima * forca - FRACO.cai * A.fraco // sobe quando as asas descem
  return out
}
