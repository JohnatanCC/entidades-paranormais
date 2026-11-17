// Como o Mestre se mexe (docs/cap2-sombra.md). Ele não anda: levita sobre a fumaça (o corpo sobe e desce devagar, as
// pernas pendem soltas e ficam para trás quando ele avança, o corpo deita para a frente com a velocidade e de lado nas
// curvas). A respiração, a cabeça que vira de uma vez e fica (o tique de ave: o movimento travado), o manto e as partes
// soltas nas molas (com a brisa e o arrasto) e a fumaça, presa ao corpo.
//   o grito (gritar: quando ele avista o agente): o aviso (trava, recolhe o corpo, a cabeça tomba, e ele acende âmbar);
//     o grito (o corpo vai para a frente, o bico abre, o manto e os braços abrem de uma vez e vibram, a tela treme) e,
//     logo no começo, o corvo gigante sai de dentro do manto (a animação devolve de onde: quem controla a cena solta o
//     corvo, corvo.ts); o manto fecha;
//   a corrida (correr: caçando): mais baixo e deitado para a frente, a cabeça erguida olhando a presa, os braços para
//     trás com as garras abertas, as pernas esticadas atrás, o manto meio aberto como asas; sobe e desce mais rápido;
//   a mordida (morder: quando chega perto): o aviso (a cabeça recua, o bico abre, ele acende âmbar), o bote (o corpo e a
//     cabeça vão de uma vez para a frente e o bico fecha: é o instante do dano) e a volta;
//   a luz (cobrir: enquanto a luz forte bate nele): encolhe, vira o rosto, cruza os braços na frente da cabeça, fecha o
//     manto, treme, a fumaça engrossa, e ele recua;
//   saindo do disfarce (disfarce.ts põe `surgindo`): cresce de pequeno até o tamanho dele, com o manto e os braços
//     abertos, que fecham devagar, e a fumaça grossa.
// Quem move o root é quem o controla (para onde ele vai): o root fica no chão, a levitação é do quadril para cima. A
// animação devolve o que o movimento pede: avançar no bote, recuar da luz.
import * as THREE from 'three'
import { avisar } from '../../../render/golpe'
import { tremerDe } from '../../player/tremor'
import { animarMolas } from '../../corpo/molas'
import { passoFumaca } from './fumaca'
import type { Mestre } from './modelo'
import { AR, COBRIR, CORRIDA, CORVO, DISFARCE, GRITO, LEVITA, MORDIDA, PARADO } from './numeros'

const _p = new THREE.Vector3(), _f = new THREE.Vector3(), _q = new THREE.Quaternion()
const cl = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x))
const lerp = (a: number, b: number, k: number) => a + (b - a) * k
const damp = (cur: number, alvo: number, k: number, dt: number) => cur + (alvo - cur) * (1 - Math.exp(-k * dt))
const entre = ([a, b]: number[]) => a + Math.random() * (b - a)
const suave = (x: number) => x * x * (3 - 2 * x)

/** Começa o grito (se não estiver gritando nem mordendo). */
export function gritar(m: Mestre) { if (!m.anim.grito && !m.anim.mordida) m.anim.grito = { t: 0, saiu: false } }
/** Caçando (a corrida) ou não. */
export function correr(m: Mestre, sim: boolean) { m.anim.correndo = sim }
/** Começa a mordida (se não estiver mordendo nem gritando). */
export function morder(m: Mestre) { if (!m.anim.mordida && !m.anim.grito) m.anim.mordida = { t: 0, mordeu: false } }
/** A luz forte bate nele (ou parou de bater): cobre-se e recua. Corta a mordida. */
export function cobrir(m: Mestre, sim: boolean) { m.anim.coberto = sim; if (sim) m.anim.mordida = null }

/** solta: neste quadro o corvo gigante sai daqui (no mundo), no rumo de frente dele; avanca e recua: m/s para a frente
 *  (o bote) e para trás (a luz); mordeu: neste quadro o bico fechou (o instante do dano). */
export interface SaidaMestre { solta: THREE.Vector3 | null; avanca: number; recua: number; mordeu: boolean }
const _solta = new THREE.Vector3()

/** Um quadro. Quem leva o Mestre de um lugar a outro mexe no root antes de chamar. */
export function animarMestre(m: Mestre, dt: number): SaidaMestre {
  const saida: SaidaMestre = { solta: null, avanca: 0, recua: 0, mordeu: false }
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
  // ---------- a mordida: o quanto a cabeça recua (o aviso), o quanto o bote foi e o bico ----------
  const M = A.mordida, D = MORDIDA
  let prepara = 0, bote = 0, bocaMordida = 0
  if (M) {
    M.t += dt
    const t1 = D.prepara, t2 = t1 + D.bote, t3 = t2 + D.volta
    if (M.t < t1) { prepara = suave(M.t / t1); bocaMordida = prepara }
    else if (M.t < t2) { const k = (M.t - t1) / D.bote; prepara = 1 - k; bote = k; bocaMordida = k < 0.7 ? 1 : 0; saida.avanca = D.investe }
    else { bote = 1 - suave(Math.min(1, (M.t - t2) / D.volta)) }
    if (!M.mordeu && M.t >= t2) { M.mordeu = true; saida.mordeu = true } // o bico fechou
    if (M.t >= t3) A.mordida = null
  }
  // ---------- saindo do disfarce: cresce, com o manto aberto fechando ----------
  const S = A.surgindo
  let surge = 0
  if (S) {
    S.t += dt
    const k = Math.min(1, S.t / DISFARCE.revela), sai = 1 - (1 - k) ** 3
    m.root.scale.setScalar(lerp(DISFARCE.de, 1, sai))
    surge = 1 - suave(Math.min(1, S.t / DISFARCE.fecha)); abre = Math.max(abre, surge)
    if (S.t >= DISFARCE.fecha) { A.surgindo = null; m.root.scale.setScalar(1) }
  }
  avisar(m.root, Math.max(recolhe, M && M.t < D.prepara ? prepara : 0)) // os avisos acendem (render/golpe.ts)
  // ---------- a corrida e a luz: entram e saem aos poucos ----------
  const K = CORRIDA, B = COBRIR
  A.cobre = damp(A.cobre, A.coberto ? 1 : 0, A.coberto ? B.entra : B.sai, dt)
  A.corre = damp(A.corre, A.correndo && !G && A.cobre < 0.3 ? 1 : 0, K.entra, dt)
  const corre = A.corre, cobre = A.cobre
  if (A.coberto) saida.recua = B.recua * cobre
  const vibra = grita * Math.sin(A.t * 70) * C.vibra + cobre * Math.sin(A.t * 43) * B.treme
  A.t += dt
  // a velocidade dele (medida), no mundo e no rumo dele
  m.root.getWorldPosition(_p)
  if (A.ultimo) { A.vel.copy(_p).sub(A.ultimo).divideScalar(dt); if (A.vel.lengthSq() > 400) A.vel.set(0, 0, 0) } else A.ultimo = new THREE.Vector3()
  A.ultimo.copy(_p)
  m.root.getWorldQuaternion(_q)
  A.frente = damp(A.frente, A.vel.dot(_f.set(0, 0, 1).applyQuaternion(_q)), 5, dt)
  A.lado = damp(A.lado, A.vel.dot(_f.set(1, 0, 0).applyQuaternion(_q)), 5, dt)
  // a levitação: o corpo acima do chão, subindo e descendo devagar; deita com a velocidade (na corrida, de vez)
  const L = LEVITA
  A.onda += (dt * Math.PI * 2) / lerp(L.periodo, K.periodo, corre)
  const onda = A.onda
  m.quadril.position.y = m.base.quadril + lerp(L.altura, K.altura, corre) + Math.sin(onda) * lerp(L.sobe, K.sobe, corre) - cobre * B.encolhe
  m.quadril.rotation.x = lerp(cl(A.frente * L.inclina, -0.15, L.maxInclina), K.inclina, corre) - cobre * 0.12
  m.quadril.rotation.z = Math.sin((A.t * Math.PI * 2) / P.balanco.periodo) * P.balanco.corpo + cl(-A.lado * L.deita, -0.3, 0.3)
  // as pernas pendem, cada uma balançando no seu tempo, e ficam para trás quando ele avança
  for (const p of m.pernas) {
    const b = Math.sin(onda * 1.3 + (p.s > 0 ? 0 : 1.9)) * L.pernas.balanca, fica = lerp(cl(A.frente * L.pernas.ficam, -0.2, 0.7), K.pernas, corre)
    p.coxa.rotation.x = L.pernas.coxa + b + fica
    p.canela.rotation.x = L.pernas.canela + b * 0.6 + fica * 0.5
    p.tarso.rotation.x = L.pernas.tarso - b * 0.5
    p.pe.rotation.x = L.pernas.pe + b
  }
  // os braços: pendem; no grito abrem para os lados; na corrida vão para trás; na luz cruzam na frente do rosto
  for (const b of m.bracos) {
    const fica = cl(A.frente * L.bracos, -0.1, 0.5), o = Math.sin(onda * 0.9 + (b.s > 0 ? 0.7 : 2.4)) * 0.04
    b.braco.rotation.x = lerp(lerp(fica + o, K.bracos + o, corre) + prepara * 0.3 - bote * 0.4, B.braco, cobre)
    b.antebraco.rotation.x = lerp(lerp(fica * 0.6 + o, K.bracos * 0.4, corre), B.antebraco, cobre)
    b.braco.rotation.z = b.s * (abre * C.bracos - recolhe * 0.15 + corre * K.abre - cobre * B.cruza)
  }
  // o peito: a respiração; recolhe e avança no grito e na mordida; na corrida arqueia de volta; na luz encolhe
  m.peito.rotation.x = Math.sin((A.t * Math.PI * 2) / P.respira.periodo) * P.respira.peito - recolhe * C.recolhe + grita * C.avanca
    - prepara * D.recolhe + bote * D.avanca - corre * K.arqueia + cobre * B.curva + vibra
  m.bico.rotation.x = m.base.bico + grita * C.bico + bocaMordida * D.bico + vibra * 2
  // a cabeça: os tiques; no grito, na mordida, na corrida e na luz ela tem para onde ir
  const T = A.tique
  if (G) { // tomba no aviso e levanta para gritar
    T.espera = Math.max(T.espera, 0.6); T.t = 1
    T.para.set(-grita * C.cabeca + recolhe * 0.15, 0, recolhe * C.cabeca * (1 - grita))
  } else if (M) { // recua e dá o bote para a frente e para baixo
    T.espera = Math.max(T.espera, 0.5); T.t = 1
    T.para.set(prepara * D.cabeca[0] + bote * D.cabeca[1], 0, prepara * 0.12)
  } else if (cobre > 0.02) { // vira o rosto e baixa
    T.espera = Math.max(T.espera, 0.5); T.t = 1
    T.para.set(B.cabeca[0] * cobre, B.cabeca[1] * cobre, 0)
  } else if (corre > 0.02) { // erguida, olhando a presa
    T.espera = Math.max(T.espera, 0.5); T.t = 1
    T.para.set(K.cabeca * corre, 0, 0)
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
  // o manto aberto (o grito, a corrida) ou fechado (a luz): por cima das molas (elas põem o giro de cada tira a cada quadro)
  const manto = abre * C.abre + corre * K.manto + cobre * B.manto + (abre > 0 || cobre > 0.02 ? vibra * 3 : 0)
  if (manto !== 0) for (const a of m.abas) { a.g.rotation.x += a.x * manto; a.g.rotation.z += a.z * manto }
  // a fumaça fica presa ao corpo: o pé da coluna no chão, embaixo do quadril
  m.fumaca.malha.position.y = -m.quadril.position.y
  passoFumaca(m.fumaca, dt, Math.max(cobre, surge))
  return saida
}
