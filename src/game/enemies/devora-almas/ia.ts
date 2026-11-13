// A inteligência do Devora almas (docs/demonios.md, "A luta do Devora almas"), o chefe do tutorial, com pouco dano.
// Fora do chão, mergulha. Embaixo dele, nada em volta do agente por uns segundos (de longe, a ~9 m) e escolhe um ataque
// pela barra de vida (a fase):
//   a marca: nada até embaixo do agente e marca o chão (o aviso de 1 s); quem ainda estiver em cima quando ele salta é
//     engolido (20/s por 3 s; mastigando, ele se arrasta até o centro da arena e cospe lá, coberto de gosma: mais
//     lento); errou, fica exposto se debatendo;
//   a investida: nada para longe, vira para o agente e dispara (o aviso: a mira); acerta quem estiver no caminho;
//   a chuva (a partir da 2ª barra): os círculos em volta do agente, o primeiro em cima dele (quem faz os círculos é quem
//     o controla: pedido.chuva); o tentáculo acerta quem estiver no círculo quando rompe o chão;
//   a ninhada (a partir da 2ª barra, frequente): vira para o agente e cospe 2 Assombrados e uma Asa sombria, e sobem
//     do chão perto do agente mais 2 (na 3ª, 4) Assombrados: pedido.doChao.
// Da 2ª barra em diante ele fica mais agressivo (LUTA.agressivo): nada mais rápido e descansa menos entre os ataques.
//   subir (13/nov): nada até uns 7 m na frente do agente, sai do chão e fica fora uns segundos, virado para ele (a
//     janela para atirar: ele passava tempo demais escondido). Depois de qualquer ataque, também fica um pouco fora.
// Depois de alguns ataques seguidos, cansa e rasteja (a janela para atirar). Fica dentro da arena.
// Os números em numeros.ts (LUTA). pensarDevora antes de animarDevora; golpesDoDevora depois, com o que ela devolveu.
import * as THREE from 'three'
import { sorteado, type Alvo } from '../luta'
import { chover, emergir, investir, marcar, mergulhar, ninhada, rastejar, type SaidaDevora } from './animacao'
import type { DevoraAlmas } from './modelo'
import { nadarPara, virarPara } from './nado'
import { CHUVA, ESCALA, LUTA, MARCA } from './numeros'

type Plano = 'rodear' | 'marca' | 'investida' | 'chuva' | 'ninhada' | 'subir'
// virando = já chegou onde o ataque começa e está virando para o agente (nadar e virar no mesmo quadro se anulam)
// fora = s que ainda fica fora do chão (null = não está fora); ficar = quanto ficar fora da próxima vez (o subir: mais)
interface Mente { plano: Plano; t: number; ataques: number; giro: number; acertou: boolean; preso: boolean; virando: boolean; fora: number | null; ficar: number }
const mentes = new WeakMap<DevoraAlmas, Mente>()
/** O que ele pede a quem o controla: os círculos da chuva e os Assombrados que sobem do chão (na 3ª barra). */
export interface PedidoDevora { chuva?: THREE.Vector3[]; doChao?: THREE.Vector3[] }
export interface Arena { p: THREE.Vector3; raio: number }

const mente = (d: DevoraAlmas) => {
  let m = mentes.get(d)
  if (!m) { m = { plano: 'rodear', t: sorteado(LUTA.rodeia), ataques: 0, giro: Math.random() < 0.5 ? -1 : 1, acertou: false, preso: false, virando: false, fora: null, ficar: LUTA.solto }; mentes.set(d, m) }
  return m
}
/** Recomeça devagar (o agente voltou depois de cair): rodeia antes do próximo ataque. */
export function acalmarDevora(d: DevoraAlmas) { const m = mente(d); m.plano = 'rodear'; m.t = 3; m.ataques = 0 }

/** Quanto ele rodeia antes do próximo ataque (s): menos da 2ª barra em diante. */
const descanso = (d: DevoraAlmas) => sorteado(LUTA.rodeia) * (d.anim.fase >= LUTA.agressivo.desde ? LUTA.agressivo.rodeia : 1)

/** Um ataque sorteado pelos pesos da fase (nunca o mesmo duas vezes seguidas, se der). */
function escolher(fase: number, ultimo: Plano): Plano {
  const pesos = Object.entries(LUTA.pesos[fase] ?? LUTA.pesos[1]).filter(([k, p]) => p > 0 && k !== ultimo) as [Plano, number][]
  let s = Math.random() * pesos.reduce((t, [, p]) => t + p, 0)
  for (const [k, p] of pesos) if ((s -= p) <= 0) return k
  return pesos[0]?.[0] ?? 'marca'
}

const _p = new THREE.Vector3(), _d = new THREE.Vector3()
/** O ponto p preso dentro da arena (a `folga` m da beirada). */
function naArena(p: THREE.Vector3, arena: Arena | null, folga = 3) {
  if (!arena) return p
  _d.subVectors(p, arena.p).setY(0)
  const l = _d.length(), max = Math.max(1, arena.raio - folga)
  if (l > max) p.sub(_d.multiplyScalar(1 - max / l))
  return p
}

/** Antes de animarDevora: o que ele faz agora (nadar, escolher e começar um ataque). */
export function pensarDevora(d: DevoraAlmas, alvo: Alvo, arena: Arena | null, dt: number): PedidoDevora {
  const A = d.anim, m = mente(d), r = d.root, pedido: PedidoDevora = {}
  if (A.estourado) return pedido
  if (A.modo === 'engolindo' && arena) { // com o agente dentro: se arrasta até o centro da arena (cospe lá, longe da beirada)
    _d.subVectors(arena.p, r.position).setY(0)
    const l = _d.length()
    if (l > 0.5) r.position.addScaledVector(_d, Math.min(l, LUTA.engolido.leva * dt) / l)
    return pedido
  }
  if (A.modo === 'solto') { // fora do chão: virado para o agente, fica um tempo (a janela para atirar) e mergulha
    if (m.fora === null) { m.fora = m.ficar; m.ficar = LUTA.solto; A.rumo.vel = 0 } // (o embalo do nado não o arrasta fora do chão)
    virarPara(d, alvo.p, dt)
    if ((m.fora -= dt) <= 0) { mergulhar(d); m.fora = null; m.plano = 'rodear'; m.t = descanso(d) }
    return pedido
  }
  m.fora = null
  if (A.modo === 'mira') { virarPara(d, alvo.p, dt); m.acertou = false; return pedido } // na mira, ele acompanha o agente
  if (A.modo !== 'nadando') return pedido
  m.t -= dt
  const fase = A.fase
  if (!alvo.pode() && m.plano !== 'rodear') { m.plano = 'rodear'; m.t = 2 } // caído ou engolido: só nada em volta
  switch (m.plano) {
    case 'rodear': { // em volta do agente, um pouco à frente na roda
      const ang = Math.atan2(r.position.x - alvo.p.x, r.position.z - alvo.p.z) + m.giro * 0.7
      nadarPara(d, naArena(_p.set(alvo.p.x + Math.sin(ang) * LUTA.roda, 0, alvo.p.z + Math.cos(ang) * LUTA.roda), arena), dt)
      if (m.t <= 0 && alvo.pode()) {
        if (++m.ataques > LUTA.cansa) { rastejar(d); m.ataques = 0; m.t = descanso(d); break } // cansou: rasteja
        m.plano = escolher(fase, m.plano); m.t = LUTA.tempoIndo; m.virando = false
      }
      break
    }
    case 'marca': // até embaixo do agente; chegando (ou demorando demais), marca
      if (nadarPara(d, alvo.p, dt, LUTA.marca) < LUTA.chega || m.t <= 0) { marcar(d, false); m.plano = 'rodear'; m.t = descanso(d) }
      break
    case 'investida': { // de longe, do outro lado do agente (pelo meio da arena), virado para ele
      _d.subVectors(arena?.p ?? r.position, alvo.p).setY(0)
      if (_d.lengthSq() < 1) _d.set(Math.sin(r.rotation.y), 0, Math.cos(r.rotation.y))
      const de = naArena(_p.copy(alvo.p).addScaledVector(_d.normalize(), LUTA.investida.longe), arena, 2)
      if (!m.virando) { if (nadarPara(d, de, dt) < LUTA.chega * 2 || m.t <= 0) m.virando = true } // primeiro chega...
      else if (virarPara(d, alvo.p, dt) < 0.06 || m.t <= -2) { investir(d, fase >= 3 ? 2 : 1); m.plano = 'rodear'; m.t = descanso(d) } // ...depois vira e dispara
      break
    }
    case 'chuva': { // os círculos: o primeiro em cima do agente, os outros em volta
      const n = fase >= 3 ? 5 : 3, pontos = [alvo.p.clone().setY(0)]
      for (let i = 1; i < n; i++) { const a = (i / (n - 1)) * Math.PI * 2 + Math.random(), rr = 2.5 + Math.random() * 1.5; pontos.push(naArena(new THREE.Vector3(alvo.p.x + Math.cos(a) * rr, 0, alvo.p.z + Math.sin(a) * rr), arena, 1)) }
      chover(d, n); pedido.chuva = pontos; m.plano = 'rodear'; m.t = descanso(d)
      break
    }
    case 'subir': { // até uns 7 m na frente do agente (do lado de onde ele vem) e sai do chão, para ficar fora
      _d.subVectors(r.position, alvo.p).setY(0)
      if (_d.lengthSq() < 1e-4) _d.set(1, 0, 0)
      const ponto = naArena(_p.copy(alvo.p).addScaledVector(_d.normalize(), LUTA.subir.longe), arena)
      if (!m.virando) { if (nadarPara(d, ponto, dt) < LUTA.chega * 2 || m.t <= 0) m.virando = true } // primeiro chega...
      else if (virarPara(d, alvo.p, dt) < 0.15 || m.t <= -1.5) { emergir(d); m.ficar = sorteado(LUTA.subir.fica); m.plano = 'rodear'; m.t = descanso(d) } // ...depois vira e sobe
      break
    }
    case 'ninhada': // de frente para o agente, cospe; e mais do chão (2 na 2ª barra, 4 na 3ª)
      if (virarPara(d, alvo.p, dt) < 0.1 || m.t <= 0) {
        ninhada(d, 3)
        const n = LUTA.agressivo.doChao[fase] ?? 0
        if (n) pedido.doChao = Array.from({ length: n }, () => { const a = Math.random() * Math.PI * 2, rr = 3 + Math.random() * 2.5; return naArena(new THREE.Vector3(alvo.p.x + Math.cos(a) * rr, 0, alvo.p.z + Math.sin(a) * rr), arena, 1) })
        m.plano = 'rodear'; m.t = descanso(d)
      }
      break
  }
  return pedido
}

/** Depois de animarDevora (s = o que ela devolveu): a mordida engole quem está na marca, dentro dele dói, o cuspe e a
 *  investida. A chuva e o rastro de gosma são de quem tem os efeitos (o roteiro). */
export function golpesDoDevora(d: DevoraAlmas, s: SaidaDevora, alvo: Alvo, dt: number) {
  const A = d.anim, m = mente(d), r = d.root
  const dist = Math.hypot(alvo.p.x - r.position.x, alvo.p.z - r.position.z)
  if (s.mordeu) { // lá em cima: quem ainda está na marca vai para dentro
    A.pegou = alvo.pode() && dist < MARCA.raio
    if (A.pegou) { alvo.engolir(); m.preso = true }
  }
  if (m.preso && (A.modo === 'engolindo' || A.modo === 'cuspe')) alvo.ferir(LUTA.engolido.porSegundo * dt, r.position, true) // 20/s, sem a pausa depois do golpe
  if (s.cuspe && m.preso) { // cuspido na frente da boca, coberto de gosma
    m.preso = false
    _p.set(s.cuspe.x + Math.sin(r.rotation.y) * 0.9 * ESCALA, 0, s.cuspe.z + Math.cos(r.rotation.y) * 0.9 * ESCALA)
    alvo.cuspir(_p, r.position); alvo.lentidao(LUTA.engolido.lento, LUTA.engolido.dura)
  }
  // saiu da barriga antes do cuspe (atordoado, estourado): o agente sai junto, na frente dele
  if (m.preso && A.modo !== 'salto' && A.modo !== 'engolindo' && A.modo !== 'cuspe') {
    m.preso = false
    alvo.cuspir(_p.set(r.position.x + Math.sin(r.rotation.y) * 1.2 * ESCALA, 0, r.position.z + Math.cos(r.rotation.y) * 1.2 * ESCALA), r.position)
  }
  if (A.modo === 'investida' && !m.acertou && alvo.pode() && dist < LUTA.investida.acerto) { m.acertou = alvo.ferir(LUTA.investida.dano, r.position) || m.acertou }
}

/** A chuva: o tentáculo que rompeu o chão em p acerta o agente, se ele estiver dentro do círculo. */
export function tentaculoAcerta(p: THREE.Vector3, alvo: Alvo) {
  if (alvo.pode() && Math.hypot(alvo.p.x - p.x, alvo.p.z - p.z) < CHUVA.raio + 0.3) alvo.ferir(LUTA.tentaculo.dano, p)
}
