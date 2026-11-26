// A inteligência do Asa do terror (o fantasma capturável do jogo novo, docs/demonios.md): voa sempre longe do agente
// (entre 7 e 12 m), andando de lado, de frente para ele. A cada 6 s carrega e dispara a bomba (com 30% da vida, 3 em
// sequência), que voa até o chão em volta do agente (ou a parede no caminho), gruda, pisca e explode (efeitos.ts; o dano
// é de quem o controla). Depois do tiro, fica parado um pouco. Se o agente chega perto demais, ou às vezes depois de um
// tiro, se teletransporta para um lugar longe dele, com chão e à vista dele: o anel no chão do destino avisa.
// Quem o controla move o root (plano.vel, no chão; a altura do voo é dele) e, no instante `sumiu` da animação, troca de
// lugar (destinoAsaTerror). Os números em numeros.ts (LUTA, TIRO, BOMBA).
import * as THREE from 'three'
import { alcanceCamera, temChao, type Mundo } from '../../world/colisao'
import { ateAlvo, girarPara, sorteado, type Alvo } from '../luta'
import { golpear } from './animacao'
import type { AsaTerror } from './modelo'
import { LUTA, TIRO } from './numeros'

/** O que ele quer neste quadro: a velocidade (m/s, no chão) e, se decidiu sumir agora, para onde vai (o anel avisa). */
export interface PlanoAsaTerror { vel: THREE.Vector3; sumir: THREE.Vector3 | null }

interface Mente { tiro: number; tele: number; pausa: number; lado: number; troca: number; destino: THREE.Vector3 | null }
const mentes = new WeakMap<AsaTerror, Mente>()
const _a = new THREE.Vector3(), _b = new THREE.Vector3()

/** Um lugar para surgir: longe do agente (LUTA.destino), com chão, sem parede no meio e à vista dele. */
function acharDestino(a: AsaTerror, alvo: Alvo, mundo: Mundo, chao: number): THREE.Vector3 | null {
  for (let k = 0; k < 14; k++) {
    const ang = Math.random() * Math.PI * 2, d = sorteado(LUTA.destino)
    const x = alvo.p.x + Math.cos(ang) * d, z = alvo.p.z + Math.sin(ang) * d
    if (!temChao(mundo, x, z, chao)) continue
    _a.set(alvo.p.x, chao + 1.4, alvo.p.z); _b.set(x, chao + LUTA.altura, z)
    if (alcanceCamera(mundo, _a, _b, LUTA.raio) < 0.99) continue // parede no meio (ou dentro dela)
    if (Math.hypot(x - a.root.position.x, z - a.root.position.z) < 3) continue // longe de onde já está
    return new THREE.Vector3(x, chao, z)
  }
  return null
}

/** Caçando (antes de animarAsaTerror): vira para o agente, escolhe para onde voar, o tiro e o teletransporte. vida = 0..1. */
export function pensarAsaTerror(a: AsaTerror, alvo: Alvo, mundo: Mundo, vida: number, chao: number, dt: number, plano: PlanoAsaTerror) {
  let M = mentes.get(a)
  if (!M) { M = { tiro: sorteado([2, TIRO.cada]), tele: sorteado(LUTA.teleCada), pausa: 0, lado: Math.random() < 0.5 ? 1 : -1, troca: sorteado(LUTA.trocaLado), destino: null }; mentes.set(a, M) }
  M.tiro -= dt; M.tele -= dt; M.pausa -= dt; M.troca -= dt
  plano.vel.set(0, 0, 0); plano.sumir = null
  const r = a.root, dist = ateAlvo(r, alvo.p)
  girarPara(r, alvo.p.x, alvo.p.z, LUTA.vira, dt)
  const modo = a.anim.modo
  if (modo !== 'voar') return // carregando, atirando, sumindo ou surgindo: parado
  // acabou um tiro agora: a pausa parado e, às vezes, some depois
  if (M.pausa > 0) return
  // perto demais (ou a vez dele): some para longe
  if (M.tele <= 0 && (dist < LUTA.perto || M.destino)) {
    const d = M.destino ?? acharDestino(a, alvo, mundo, chao)
    M.destino = null
    if (d) { M.tele = sorteado(LUTA.teleCada); destinos.set(a, d); golpear(a, 'sumir'); plano.sumir = d; return }
  }
  // a bomba: a cada TIRO.cada; com pouca vida, três
  if (M.tiro <= 0 && alvo.pode()) {
    golpear(a, vida <= TIRO.vidaRajada ? 'rajada' : 'tiro')
    M.tiro = TIRO.cada
    const n = vida <= TIRO.vidaRajada ? TIRO.rajada : 1
    M.pausa = TIRO.carga + (n - 1) * TIRO.entre + TIRO.recuo + TIRO.pausa
    if (Math.random() < LUTA.teleTiro) { M.destino = acharDestino(a, alvo, mundo, chao); M.tele = Math.min(M.tele, 0) }
    return
  }
  // voa: afasta se perto, chega se longe, e anda de lado
  if (M.troca <= 0) { M.lado = -M.lado; M.troca = sorteado(LUTA.trocaLado) }
  const dx = alvo.p.x - r.position.x, dz = alvo.p.z - r.position.z, l = Math.hypot(dx, dz) || 1
  const ux = dx / l, uz = dz / l
  const vai = dist < LUTA.longe[0] ? -1 : dist > LUTA.longe[1] ? 1 : 0
  plano.vel.set(ux * vai * LUTA.vel - uz * M.lado * LUTA.lado, 0, uz * vai * LUTA.vel + ux * M.lado * LUTA.lado)
}

const destinos = new WeakMap<AsaTerror, THREE.Vector3>()
/** Para onde ele vai no teletransporte em curso (no chão; quem controla põe a altura do voo). */
export function destinoAsaTerror(a: AsaTerror) { return destinos.get(a) ?? null }

/** Onde a bomba gruda: o chão em volta do agente; se uma parede estiver no caminho, nela. de = a boca. */
export function alvoDaBomba(alvo: Alvo, mundo: Mundo, de: THREE.Vector3, out: THREE.Vector3) {
  const ang = Math.random() * Math.PI * 2, d = Math.random() * LUTA.espalha
  out.set(alvo.p.x + Math.cos(ang) * d, alvo.p.y + 0.05, alvo.p.z + Math.sin(ang) * d)
  const k = alcanceCamera(mundo, de, out, 0.05)
  if (k < 1) out.lerpVectors(de, out, Math.max(0, k - 0.02))
  return out
}

/** Esquece o que pensava (ficou fraco, recomeçou): as esperas recomeçam. */
export function acalmarAsaTerror(a: AsaTerror) { mentes.delete(a); destinos.delete(a) }
