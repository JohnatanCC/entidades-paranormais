// A animação do agente (do laboratório): a passada pela distância percorrida, o tronco que desfaz o giro
// do quadril, os braços balançando opostos às pernas, a barra da jaqueta numa mola e a cambalhota da esquiva; por cima,
// as camadas das armas, dos gestos e a queda (queda.ts, sem violência). Quem move e gira o root é o controle; aqui só os ossos.
import * as THREE from 'three'
import type { Agente } from './modelo'
import { animarArma, maoNaBomba, POSE_DA_ARMA, posturaDaEscopeta } from './arma'
import { animarMolas } from '../corpo/molas'
import { animarMaos, type PoseMao } from './maos'
import { AGENTE, ANDAR, CORRER, PARADO, QUEDA, TRANSICAO } from './numeros'
import { pernaNaCorrida, pernaNaPassada } from './passada'
import { prenderPes } from './pes'
import { posturaDaMira } from './mira'
import { balancoDaArma, gestoParado, pesoParado } from './parado'
import { pesoDaQueda, poseDaQueda } from './queda'
import { doendo, maoNoLado, passoDoDano, poseDoTranco, troncoMachucado } from './dano'
import { animarRosto, type Expressao } from './rosto'
import { poseDaRecarga, voarBalas } from './recarga'
import type { Municao } from '../weapons/municao'

export interface EstadoAnim {
  velocidade: number // m/s no chão
  corrida: number // 0..1, quanto está correndo
  esquiva: number // -1 = não está esquivando; 0..1 = andamento da esquiva
  expressao?: Expressao // força uma expressão (sem: neutra parado, esforço correndo e na cambalhota)
  mao?: PoseMao // força uma pose das mãos (sem: soltas, fechando ao correr, punho na cambalhota)
  mira?: { quer: boolean; alvo: THREE.Vector3 | null } // mirando (ou atirando): a arma levanta para o alvo (no mundo)
  queda?: number // s desde que caiu (sem = em pé)
  ferido?: boolean // machucado (30% da vida ou menos): curvado, mancando, a mão no lado (o tranco de um golpe: dano.ts, tranco)
  mover?: [number, number] // a velocidade no espaço dele (m/s): x para a esquerda, z para a frente; sem = para a frente
  municao?: Municao // a munição (weapons/municao.ts): a recarga da escopeta e o calor da pistola aparecem no corpo e na arma
}

const STAND = 0.42 // a altura do quadril dentro do pivô da cambalhota, antes de acertar os pés no chão
const VOLTA = Math.PI * 2, RAD = Math.PI / 180

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
// os joelhos, as canelas, os pés (e a sola de verdade), os cotovelos e as mãos. Só na cambalhota e na queda (em pé, quem acerta a altura são as solas).
function maisBaixo(a: Agente) {
  let lo = Infinity
  const ver = (o: THREE.Object3D, x: number, y: number, z: number, r: number) => { const v = naRaiz(o, a.root, _p.set(x, y, z)).y - r; if (v < lo) lo = v }
  ver(a.head, 0, 0.1, 0.006, 0.135)
  for (const sx of [-0.15, 0.15]) for (const sy of [-0.2, 0.2]) ver(a.pack, sx, sy, -0.1, 0)
  for (const s of [-1, 1]) ver(a.chest, s * 0.19, 0.205, 0, 0.075)
  ver(a.pelvis, 0, -0.03, 0, 0.12)
  for (const L of a.legs) {
    ver(L.kn, 0, 0, 0, 0.065); ver(L.kn, 0, -0.17, 0, 0.06) // o joelho e o meio da canela (de joelhos, ela deita no chão)
    ver(L.ft, 0, -0.03, -0.07, 0.04); ver(L.ft, 0, -0.03, 0.19, 0.04)
    for (const q of a.sola) ver(L.ft, q.x, q.y, q.z, 0) // o calcanhar e a ponta da bota de verdade
  }
  for (const b of a.arms) { ver(b.fo, 0, 0, 0, 0.05); ver(b.hd, 0, -0.07, 0, 0.05) }
  return lo
}

export function animarAgente(a: Agente, e: EstadoAnim, dt: number): void {
  dt = cl(dt, 0, 0.05) // um quadro travado não estoura a mola da barra
  const m = a.anim
  const rolando = e.esquiva >= 0
  const q = e.queda ?? -1, kq = pesoDaQueda(q) // caindo: as camadas de cima somem e a pose da queda manda
  passoDoDano(a, !!e.ferido && q < 0, dt)
  const fk = a.anim.dano.ferido // machucado: manca da perna direita
  const sp = rolando || q >= 0 ? 0 : Math.max(0, e.velocidade)
  m.tempo = (m.tempo + dt) % (VOLTA / 1.9)
  m.corrida = damp(m.corrida, cl(e.corrida), 6, dt)
  m.amp = damp(m.amp, cl(sp / AGENTE.andar, 0, 1.3), 7, dt) // 1 andando; correndo passa um pouco
  // para onde ele anda, no espaço dele: de frente; mirando, também de lado e de costas
  const mx = e.mover && sp > 0 ? e.mover[0] : 0, mz = e.mover && sp > 0 ? e.mover[1] : sp, mv = Math.hypot(mx, mz)
  const frente = mv > 0.05 ? mz / mv : 1 // 1 = de frente, 0 = de lado, −1 = de costas
  const costas = frente < -0.3 // de costas, a passada roda ao contrário
  // as pernas dão o passo na direção em que ele anda (de lado, até ANDAR.virar; de costas, a direção de trás); o que
  // passa disso, o passo encolhe e o pé preso acompanha abrindo a coxa (pes.ts)
  const rumo = mv > 0.05 ? Math.atan2(mx, mz) : 0, rumoPasso = costas ? Math.atan2(-mx, -mz) : rumo
  m.pernas = damp(m.pernas, cl(rumoPasso, -ANDAR.virar, ANDAR.virar) * (1 - m.corrida), 10, dt)
  const deFrente = Math.max(0.3, Math.cos(rumoPasso - m.pernas))

  // ---------- as transições: inclina ao acelerar e ao frear; deita para dentro da curva ----------
  const T = TRANSICAO, parou = rolando || q >= 0
  const acel = (mz - m.vel) / Math.max(dt, 1e-3); m.vel = mz
  const yaw = a.root.rotation.y, dYaw = Math.atan2(Math.sin(yaw - m.yaw), Math.cos(yaw - m.yaw)); m.yaw = yaw
  const giroVel = Math.abs(dYaw) > 1 ? 0 : dYaw / Math.max(dt, 1e-3) // um salto grande é teletransporte, não curva
  m.inclina = damp(m.inclina, parou ? 0 : cl(acel * T.acelera, -T.inclinaMax, T.inclinaMax), T.suave, dt)
  m.deita = damp(m.deita, parou ? 0 : cl(giroVel * mv * T.curva, -T.curvaMax, T.curvaMax), T.suave, dt)

  // ---------- a passada: a fase anda com a distância (uma volta = um passo de cada perna) ----------
  // as curvas de uma passada de verdade (passada.ts): as do andar e as da corrida, misturadas pelo quanto ele corre
  const esc = lerp(ANDAR.curto, 1, Math.min(1, m.amp)) // devagar, o passo encolhe junto com as curvas (o pé não escorrega)
  const perna = a.perna / ANDAR.perna // perna mais comprida, passo maior
  const passada = lerp(ANDAR.passada * esc * Math.max(0.5, deFrente), CORRER.passada, m.corrida) * perna // metros por volta
  let avanca = (sp / passada) * dt // em voltas
  // parando: a perna no ar termina o passo até tocar o chão (não fica com as pernas abertas)
  if (sp < 0.3 && m.amp > 0.08 && !parou && !costas) {
    const falta = 0.5 - ((m.fase / VOLTA) % 0.5)
    if (falta < 0.48) avanca = Math.max(avanca, Math.min(falta, T.termina * dt))
  }
  m.fase = (m.fase + (costas ? -avanca : avanca) * VOLTA + VOLTA) % VOLTA
  const amp = m.amp, run = m.corrida, ph = m.fase, u = ph / VOLTA // u: 0 = o pé direito tocando o chão
  const anda = sm(amp / 0.35) * esc // o quanto da passada de andar vale agora (parado, nada)
  // parado: o peso passa devagar de uma perna para a outra (w > 0: a esquerda descansa, o quadril desce desse lado)
  const quieto = rolando ? 0 : 1 - cl(amp), w = pesoParado(a, quieto, dt), P = PARADO.peso
  for (const L of a.legs) {
    const solta = Math.max(0, w * L.s) // a perna que descansa dobra o joelho
    const manca = L.s < 0 ? 1 - 0.4 * fk : 1 // a perna que dói dá o passo mais curto e dobra menos
    // a curva da perna (a esquerda meio ciclo depois da direita); o pé segue a canela mais o tornozelo
    const v = u + (L.s > 0 ? 0.5 : 0), W = pernaNaPassada(v), C = pernaNaCorrida(v), k = anda * manca * RAD, kc = manca * RAD
    const thW = -W.quadril * ANDAR.quadril * deFrente * k, knW = W.joelho * ANDAR.joelho * k, peW = thW + knW - W.tornozelo * ANDAR.tornozelo * k // pe: o ângulo do pé com o chão
    const thC = -C.quadril * CORRER.quadril * kc, knC = C.joelho * CORRER.joelho * kc, peC = thC + knC - C.tornozelo * CORRER.tornozelo * kc
    const th = lerp(thW, thC, run) - 0.5 * P.joelho * solta
    const kn = lerp(0.04 + knW, knC, run) + P.joelho * solta
    L.th.rotation.set(th, m.pernas, L.s * (0.045 + 0.025 * (1 - Math.min(1, amp))) + w * P.quadril)
    L.kn.rotation.set(kn, 0, 0)
    L.ft.rotation.set(-(th + kn) + lerp(peW, peC, run), 0, -L.s * 0.035)
  }
  // o quadril: gira levando à frente o lado da perna da frente, cai do lado da perna no ar e vai para o lado do pé de
  // apoio; correndo, o corpo inclina para a frente
  const onda = Math.cos(VOLTA * u), lado = Math.sin(VOLTA * u)
  const giro = lerp(ANDAR.giro * anda, CORRER.giro, run) * onda
  const queda = -lerp(ANDAR.queda * anda, CORRER.queda, run) * lado
  a.roll.rotation.set(0, 0, 0); a.roll.position.set(0, 0.5, 0)
  a.pelvis.position.set(-lerp(ANDAR.lado * anda, CORRER.lado, run) * lado, STAND, 0)
  a.pelvis.rotation.set(0.4 * CORRER.inclina * run + 0.02 * anda + 0.35 * m.inclina, rolando ? 0 : giro, queda - w * P.quadril + 0.06 * fk * amp * lado - 0.3 * m.deita)
  // a altura do quadril (o sobe e desce do passo sai daqui). Andando (e parado), o pé mais baixo dos dois fica no chão.
  // Correndo, a altura é desenhada: parte da de quando o pé tocou, desce um pouco no meio do apoio (a perna é a mola),
  // sobe no voo e chega na de quando o outro pé vai tocar (a perna de trás esticada não serve de medida: o corpo
  // afundaria no fim do apoio). Quem põe a sola no chão no apoio é o pé preso (pes.ts)
  const apoio = lerp(0.6, CORRER.apoio, run), passo = u % 0.5 // passo: o meio ciclo desde que um pé tocou
  const solaDe = (L: (typeof a.legs)[number]) => { let y = Infinity; for (const q of a.sola) y = Math.min(y, naRaiz(L.ft, a.root, _p.copy(q)).y); return y }
  const andandoY = STAND - Math.min(solaDe(a.legs[0]), solaDe(a.legs[1]))
  const vem = a.legs.find((L) => (u + (L.s > 0 ? 0.5 : 0)) % 1 >= 0.5)! // a perna no balanço (a próxima a tocar)
  if (passo < m.passo) m.chao = STAND - solaDe(a.legs.find((L) => L !== vem)!) // um pé acabou de tocar: a altura dele
  m.passo = passo
  const f = cl((passo - apoio) / (0.5 - apoio)) // no voo, de 0 (o pé saiu) a 1 (o outro toca)
  const correndoY = passo < apoio
    ? m.chao - CORRER.desce * Math.sin((Math.PI * passo) / apoio)
    : lerp(m.chao, STAND - solaDe(vem), f) + CORRER.voo * Math.sin(Math.PI * f)
  a.pelvis.position.y = lerp(andandoY, correndoY, sm((run - 0.15) / 0.35))
  // o pé de apoio preso onde tocou o chão (não escorrega); parado, rolando ou caindo, solto
  prenderPes(a, u, apoio, [mx, mz], parou ? 0 : sm(amp / 0.3), dt)

  // ---------- o tronco: desfaz o giro e a queda do quadril (os ombros ficam quase parados); parado, respira mais fundo ----------
  const breath = Math.sin(m.tempo * 1.9) * (0.012 * (1 - Math.min(1, amp) * 0.5) + PARADO.respira * quieto)
  a.spine.rotation.set(0.04 + 0.6 * CORRER.inclina * run + 0.65 * m.inclina, -giro * 0.9, -queda * 0.7 + 1.2 * w * P.quadril - 0.7 * m.deita)
  a.chest.rotation.set(breath, -giro * lerp(0.35, 0.6, run), -queda * 0.15) // correndo, os ombros giram mais contra o quadril

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
  // com pistola ou escopeta, o direito fica na guarda: o cotovelo dobrado e a arma apontada para o chão na frente (a
  // escopeta ainda vai para as duas mãos, posturaDaEscopeta; mirar e o coice vêm na etapa das armas); a armadilha vai
  // pendurada, o braço balança
  const guarda = a.arma === 'pistola' || a.arma === 'escopeta'
  for (const b of a.arms) {
    // o braço vai à frente quando a perna do mesmo lado vai para trás, um pouco atrasado; o cotovelo dobra mais na
    // frente, atrasado mais um pouco (o antebraço vem solto). Andando, soltos; correndo, bombeando com o cotovelo dobrado
    const v = u + (b.s > 0 ? 0.5 : 0)
    const braco = (B: typeof ANDAR.braco, E: typeof ANDAR.cotovelo, tras: number) => {
      const frente = Math.cos(VOLTA * (v - tras - B.atraso)), dobra = 0.5 + 0.5 * Math.cos(VOLTA * (v - tras - B.atraso - E.atraso))
      return [-(frente > 0 ? B.frente : B.tras) * frente * RAD, -(E.base + E.balanco * dobra)]
    }
    const [xW, elW] = braco(ANDAR.braco, ANDAR.cotovelo, 0.55), [xC, elC] = braco(CORRER.braco, CORRER.cotovelo, 0.4)
    let x = lerp(xW * anda, xC, run) + 0.06
    let el = lerp(-0.22 + elW * anda, elC, run)
    if (guarda && b.s < 0) { x = -0.3 - 0.05 * amp * Math.sin(ph) - 0.25 * run * amp; el = -0.95 - 0.3 * run * amp }
    if (tuck > 0) { x = lerp(x, -0.7, tuck); el = lerp(el, -1.7, tuck) } // agarrado às pernas
    b.up.rotation.set(x, 0, b.s * (0.1 + 0.06 * run), 'XZY')
    b.fo.rotation.set(el, 0, 0)
    b.hd.rotation.set(0.1, -b.s * Math.PI / 2, 0) // a palma virada para dentro (para a coxa, ou de lado no cabo da arma)
  }
  // no laboratório a cabeça e os pés afundavam até 24 cm no chão no meio da cambalhota: o pivô sobe o que faltar
  if (rolando) a.roll.position.y += Math.max(0, -maisBaixo(a))

  // ---------- a escopeta com as duas mãos (ou no ombro); parado: o balanço da pistola e os gestos, por cima da pose ----------
  troncoMachucado(a, m.tempo) // machucado: curvado, inclinado para o lado, respirando pesado (as armas vêm por cima)
  // recarregando a escopeta: a arma não levanta para mirar, nem vai ao ombro, nem faz gesto (a recarga manda nos braços)
  const M = e.municao, recarga = M && a.arma === 'escopeta' && M.recarga >= 0 ? { t: M.recarga, n: M.faltavam } : null
  const mirando = !!e.mira?.quer && q < 0 && !recarga, parado = quieto > 0.97 && sp < 0.05 && !mirando && !recarga && q < 0, solto = (1 - tuck) * (1 - kq)
  posturaDaEscopeta(a, { parado, amp, run, ph, solto }, dt)
  posturaDaMira(a, mirando, e.mira?.alvo ?? null, dt, solto)
  balancoDaArma(a, quieto * solto * (1 - a.anim.arma.mira))
  const gesto = gestoParado(a, parado && fk < 0.5, dt) // machucado, ele não fica fazendo gestos
  const maoRecarga = poseDaRecarga(a, recarga, solto, dt)
  maoNaBomba(a) // a mão esquerda na bomba, onde a escopeta estiver agora
  // machucado: a mão esquerda segura o lado, quando está livre (não está na bomba, na pistola mirando, apontando ou jogando)
  const Ar = a.anim.arma, ocupada = Math.max(Ar.esquerda, a.arma === 'pistola' || (a.arma === 'armadilha' && !Ar.fora) ? Ar.mira : 0, Ar.lanca >= 0 ? 1 : 0, Ar.recarga)
  const noLado = maoNoLado(a, (1 - ocupada) * solto)
  poseDoTranco(a) // o tranco de um golpe: por cima de tudo, até da mira

  // ---------- a queda: por cima de tudo; o chão acerta a altura pelo ponto mais baixo do corpo (joelhos, ombro, cabeça) ----------
  if (q >= 0) { poseDaQueda(a, q); a.roll.position.y -= maisBaixo(a) * kq }

  // ---------- as mãos e o rosto ----------
  // a mão da arma fica fechada nela (mirando, o indicador vai para o gatilho); a esquerda fecha na bomba da escopeta
  // ou, mirando a pistola, por cima da direita
  // (a armadilha: fora da mão, a direita fica livre, aberta logo depois de soltar; mirando, a esquerda aponta o alvo)
  const A = a.anim.arma, mirada = A.mira > 0.5 && (a.arma === 'pistola' || a.arma === 'escopeta')
  const direita: PoseMao | undefined = !a.arma ? gesto[0] : a.arma === 'armadilha' && A.fora ? (A.lanca >= 0 ? 'aberta' : gesto[0]) : mirada ? 'segurar' : POSE_DA_ARMA[a.arma]
  const aponta = a.arma === 'armadilha' && !A.fora && A.mira > 0.5 && A.lanca < 0
  const forca: typeof gesto = [direita, maoRecarga ?? (A.esquerda > 0.5 || (mirada && a.arma === 'pistola') ? 'segurar' : aponta ? 'apontar' : gesto[1])]
  if (noLado > 0.5 && !forca[1]) forca[1] = 'aberta' // a mão espalmada no lado
  if (q >= 0) forca[1] = undefined // caído: a mão livre solta (a da arma continua nela)
  if (e.mao) animarMaos(a, e.mao, 1, dt, m.tempo, forca)
  else animarMaos(a, 'punho', rolando ? 1 : 0.6 * run * Math.min(1, amp), dt, m.tempo, forca)
  // caindo: a dor, depois desmaiado (os olhos fecham)
  // (um golpe: dor; machucado: o esforço no rosto)
  animarRosto(a, e.expressao ?? (q >= 0 ? (q < QUEDA.joelhos[1] ? 'dor' : 'desmaio') : doendo(a) ? 'dor' : rolando || run > 0.5 || fk > 0.5 ? 'esforco' : 'neutra'), dt)

  // ---------- a barra da jaqueta: as da frente seguem as coxas, a de trás abre correndo (uma mola) ----------
  for (const pn of a.panels) {
    let tg = pn.s ? Math.min(0.06, a.legs[pn.s < 0 ? 0 : 1].th.rotation.x * 0.8) : 0.08 + 0.28 * run * amp + 0.1 * amp
    if (tuck > 0.3) tg = pn.s ? -0.75 : 0.65
    pn.v += ((tg - pn.sw) * 120 - pn.v * 14) * dt; pn.sw += pn.v * dt; pn.g.rotation.x = pn.sw
  }
  // ---------- o cabelo: as mechas balançam com o movimento da cabeça (depois de tudo posto no lugar) ----------
  if (a.cabelo) animarMolas(a.cabelo, a.root, dt)
  // ---------- a arma (depois do braço no lugar): as balas da recarga voam, o frasco da pistola, a armadilha balança ----------
  voarBalas(a)
  A.calor = e.municao?.calor ?? 0; A.travada = e.municao?.travada ?? 0
  animarArma(a, dt)
}
