// Como o Mestre se mexe (docs/cap2-sombra.md). Ele não anda: levita sobre a fumaça (o corpo sobe e desce devagar, as
// pernas pendem soltas e ficam para trás quando ele avança, o corpo deita para a frente com a velocidade e de lado nas
// curvas). A respiração, a cabeça que vira de uma vez e fica (o tique de ave: o movimento travado), o manto e as partes
// soltas nas molas (com a brisa e o arrasto) e a fumaça.
//   o grito (gritar: quando ele avista o agente): o aviso (trava, recolhe o corpo, a cabeça tomba, e ele acende âmbar);
//     o grito (o corpo vai para a frente, o bico abre, o manto e os braços abrem de uma vez e vibram, a tela treme) e,
//     logo no começo, o corvo gigante sai de dentro do manto (a animação devolve de onde: quem controla a cena solta o
//     corvo, corvo.ts); o manto fecha. A caçada vem depois.
// Quem move o root é quem o controla (para onde ele vai): o root fica no chão, a levitação é do quadril para cima.
import * as THREE from 'three'
import { avisar } from '../../../render/golpe'
import { tremerDe } from '../../player/tremor'
import { animarMolas } from '../../corpo/molas'
import { passoFumaca } from './fumaca'
import type { Mestre } from './modelo'
import { AR, CORVO, GRITO, LEVITA, PARADO } from './numeros'

const _p = new THREE.Vector3(), _f = new THREE.Vector3(), _q = new THREE.Quaternion()
const cl = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x))
const damp = (cur: number, alvo: number, k: number, dt: number) => cur + (alvo - cur) * (1 - Math.exp(-k * dt))
const entre = ([a, b]: number[]) => a + Math.random() * (b - a)
const suave = (x: number) => x * x * (3 - 2 * x)

/** Começa o grito (se não estiver gritando). */
export function gritar(m: Mestre) { if (!m.anim.grito) m.anim.grito = { t: 0, saiu: false } }

/** solta: neste quadro o corvo gigante sai daqui (no mundo), no rumo de frente dele; senão, null. */
export interface SaidaMestre { solta: THREE.Vector3 | null }
const _solta = new THREE.Vector3()

/** Um quadro. Quem leva o Mestre de um lugar a outro mexe no root antes de chamar. */
export function animarMestre(m: Mestre, dt: number): SaidaMestre {
  const saida: SaidaMestre = { solta: null }
  if (dt <= 0) return saida
  const A = m.anim, P = PARADO
  // ---------- o grito: o quanto recolhe (o aviso), o quanto grita e o quanto o manto está aberto ----------
  const G = A.grito, C = GRITO
  let recolhe = 0, grita = 0, abre = 0
  if (G) {
    G.t += dt
    const t1 = C.aviso, t2 = t1 + C.grita, t3 = t2 + C.fecha
    if (G.t < t1) recolhe = suave(G.t / t1)
    else if (G.t < t2) {
      const k = (G.t - t1) / C.grita
      grita = 1; abre = Math.min(1, k / 0.08) // abre de uma vez
      if (!G.saiu && G.t - t1 >= C.sai) { // o corvo sai de dentro do manto
        G.saiu = true
        m.root.getWorldPosition(_solta); _solta.y += CORVO.altura
        saida.solta = _solta
      }
      if (G.t - dt < t1) tremerDe(m.root.getWorldPosition(_p), C.tremor.forca, C.tremor.dura)
    } else { const k = Math.min(1, (G.t - t2) / C.fecha); grita = 1 - suave(k); abre = 1 - suave(k) }
    if (G.t >= t3) A.grito = null
  }
  avisar(m.root, recolhe) // o aviso acende (render/golpe.ts)
  const vibra = grita * Math.sin(A.t * 70) * C.vibra
  A.t += dt
  // a velocidade dele (medida), no mundo e no rumo dele
  m.root.getWorldPosition(_p)
  if (A.ultimo) { A.vel.copy(_p).sub(A.ultimo).divideScalar(dt); if (A.vel.lengthSq() > 400) A.vel.set(0, 0, 0) } else A.ultimo = new THREE.Vector3()
  A.ultimo.copy(_p)
  m.root.getWorldQuaternion(_q)
  A.frente = damp(A.frente, A.vel.dot(_f.set(0, 0, 1).applyQuaternion(_q)), 5, dt)
  A.lado = damp(A.lado, A.vel.dot(_f.set(1, 0, 0).applyQuaternion(_q)), 5, dt)
  // a levitação: o corpo acima do chão, subindo e descendo devagar; deita com a velocidade
  const L = LEVITA, onda = (A.t * Math.PI * 2) / L.periodo
  m.quadril.position.y = m.base.quadril + L.altura + Math.sin(onda) * L.sobe
  m.quadril.rotation.x = cl(A.frente * L.inclina, -0.15, L.maxInclina)
  m.quadril.rotation.z = Math.sin((A.t * Math.PI * 2) / P.balanco.periodo) * P.balanco.corpo + cl(-A.lado * L.deita, -0.3, 0.3)
  // as pernas pendem, cada uma balançando no seu tempo, e ficam para trás quando ele avança
  for (const p of m.pernas) {
    const b = Math.sin(onda * 1.3 + (p.s > 0 ? 0 : 1.9)) * L.pernas.balanca, fica = cl(A.frente * L.pernas.ficam, -0.2, 0.7)
    p.coxa.rotation.x = L.pernas.coxa + b + fica
    p.canela.rotation.x = L.pernas.canela + b * 0.6 + fica * 0.5
    p.tarso.rotation.x = L.pernas.tarso - b * 0.5
    p.pe.rotation.x = L.pernas.pe + b
  }
  for (const b of m.bracos) {
    const fica = cl(A.frente * L.bracos, -0.1, 0.5), o = Math.sin(onda * 0.9 + (b.s > 0 ? 0.7 : 2.4)) * 0.04
    b.braco.rotation.x = fica + o; b.antebraco.rotation.x = fica * 0.6 + o
    b.braco.rotation.z = b.s * (abre * C.bracos - recolhe * 0.15) // no grito, abrem para os lados
  }
  // a respiração; no grito, recolhe para trás e depois vai para a frente
  m.peito.rotation.x = Math.sin((A.t * Math.PI * 2) / P.respira.periodo) * P.respira.peito - recolhe * C.recolhe + grita * C.avanca + vibra
  m.bico.rotation.x = m.base.bico + grita * C.bico + vibra * 2
  // a cabeça: espera parada, vira de uma vez para outro lado e fica
  const T = A.tique
  if (G) { // no grito a cabeça não faz tiques: tomba no aviso e levanta para gritar
    T.espera = Math.max(T.espera, 0.6); T.t = 1
    T.para.set(-grita * C.cabeca + recolhe * 0.15, 0, recolhe * C.cabeca * (1 - grita))
  } else if ((T.espera -= dt) <= 0) {
    T.espera = entre(P.tique.espera); T.t = 0
    T.de.copy(T.para)
    T.para.set((Math.random() - 0.3) * P.tique.baixar * 2, (Math.random() * 2 - 1) * P.tique.girar, (Math.random() * 2 - 1) * P.tique.tombar)
  }
  T.t = Math.min(1, T.t + dt / P.tique.vira)
  const k = suave(T.t)
  m.cabeca.rotation.set(T.de.x + (T.para.x - T.de.x) * k, T.de.y + (T.para.y - T.de.y) * k, T.de.z + (T.para.z - T.de.z) * k)
  // o ar no manto: a brisa que gira devagar e vem em rajadas, mais o arrasto de quem avança
  const rumo = A.t * AR.gira + Math.sin(A.t * 0.9) * 0.8, forca = AR.brisa + AR.rajada * Math.pow(Math.max(0, Math.sin(A.t * AR.ritmo)), 3)
  A.vento.set(Math.sin(rumo) * forca, 0, Math.cos(rumo) * forca).addScaledVector(A.vel, -AR.arrasto)
  A.vento.y = 0
  if (A.vento.length() > AR.maximo) A.vento.setLength(AR.maximo)
  animarMolas(m.manto, m.root, dt, A.vento)
  animarMolas(m.soltas, m.root, dt, A.vento)
  // o manto aberto: por cima das molas (elas põem o giro de cada tira a cada quadro)
  if (abre > 0) for (const a of m.abas) { const k = abre * C.abre + vibra * 3; a.g.rotation.x += a.x * k; a.g.rotation.z += a.z * k }
  passoFumaca(m.fumaca, m.root, dt)
  return saida
}
