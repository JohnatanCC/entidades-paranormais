// Os gestos dos atores nas cenas, por cima da pose do corpo (depois de animarAgente): a postura que dura (ler: inclinado
// sobre a mesa, as duas mãos na pasta) e os gestos rápidos (virar uma folha, fechar a pasta, bater o dedo nela). As mãos
// vão até os pontos pelo IK do braço (player/alcancar.ts); o tronco inclina para elas alcançarem. Tudo é conta do tempo
// do gesto (o que a cena diz em atores.ts); só a inclinação e o peso de cada mão andam macios de um quadro para o outro.
import * as THREE from 'three'
import { alcancar } from '../player/alcancar'
import type { PoseMao } from '../player/maos'
import type { Agente } from '../player/modelo'
import type { EstadoAtor } from './atores'
import type { Gesto } from './tipos'

/** Quanto dura cada gesto (s). */
export const GESTOS: Record<Gesto, { dura: number }> = { virar: { dura: 0.9 }, fechar: { dura: 1.2 }, bater: { dura: 1.1 } }
const INCLINA = { ler: 0.42, bater: 0.36 } // rad: o quanto o tronco deita para a mesa
const MAO = 0.07 // m: do pulso ao meio da palma (o IK leva o pulso; quem toca a mesa é a palma)
const PULSO = -0.9 // rad: o quanto o pulso dobra para trás com a mão apoiada

/** O que anda macio entre um quadro e outro, por ator. */
export interface MemGesto { inclina: number; peso: [number, number] }
export const novaMemGesto = (): MemGesto => ({ inclina: 0, peso: [0, 0] })

const sm = (k: number) => { const c = Math.max(0, Math.min(1, k)); return c * c * (3 - 2 * c) }
const damp = (a: number, b: number, k: number, dt: number) => a + (b - a) * (1 - Math.exp(-k * dt))
const _f = new THREE.Vector3(), _l = new THREE.Vector3(), _p = new THREE.Vector3(), _alvo = [new THREE.Vector3(), new THREE.Vector3()]
const POLO = [new THREE.Vector3(-0.9, -1, -0.5), new THREE.Vector3(0.9, -1, -0.5)] // o cotovelo para fora, para baixo e para trás ([0] direito, [1] esquerdo)

/** A pose da mão de quem gesticula agora (para animarAgente), ou nada. */
export function maoDoGesto(e: EstadoAtor): PoseMao | undefined {
  if (e.gesto?.nome === 'bater') return 'apontar'
  return e.gesto || e.postura ? 'aberta' : undefined
}

/** Põe o gesto por cima da pose (depois de animarAgente). salto: pulou no tempo (sem andar macio). */
export function poseDoGesto(a: Agente, e: EstadoAtor, mem: MemGesto, dt: number, salto: boolean) {
  const g = e.gesto, ler = e.postura?.nome === 'ler'
  const P = g?.em ?? e.postura?.em
  // o quanto o tronco inclina e o peso de cada mão (0 = solta, 1 = no ponto)
  let inclina = ler ? INCLINA.ler : 0, peso: [number, number] = ler ? [1, 1] : [0, 0]
  // ([0] a mão direita, [1] a esquerda; as contas são no chão, com o ator olhando para `f` e a esquerda dele em `l`)
  _f.set(Math.sin(e.yaw), 0, Math.cos(e.yaw)); _l.set(Math.cos(e.yaw), 0, -Math.sin(e.yaw))
  const ponto = (i: number, lado: number, frente: number, alto: number) => { if (P) _alvo[i].set(P[0], P[1], P[2]).addScaledVector(_l, lado).addScaledVector(_f, frente - MAO).add(_p.set(0, alto + 0.03, 0)) }
  // lendo: a esquerda na capa aberta (do lado esquerdo dele), a direita na beirada direita das folhas
  ponto(1, 0.17, 0, 0); ponto(0, -0.11, -0.03, 0)
  if (g && P) {
    const u = g.t / GESTOS[g.nome].dura
    if (g.nome === 'virar') {
      // a direita pega a ponta da folha, leva por cima (em arco) para a esquerda e volta
      const s = sm((u - 0.15) / 0.5), volta = sm((u - 0.7) / 0.3)
      ponto(0, -0.11 + 0.23 * s * (1 - volta), -0.03, 0.07 * Math.sin(Math.PI * s) * (1 - volta))
    } else if (g.nome === 'fechar') {
      // a direita vai à capa aberta (à esquerda dele), traz por cima e larga; a esquerda sai; o tronco volta depois
      const vai = sm(u / 0.25), traz = sm((u - 0.25) / 0.45)
      ponto(0, -0.11 + 0.41 * vai - 0.33 * traz, -0.02, 0.1 * Math.sin(Math.PI * traz))
      peso = [1 - sm((u - 0.75) / 0.25), 1 - sm(u / 0.3)]
      inclina = INCLINA.ler * (1 - sm((u - 0.65) / 0.35))
    } else if (g.nome === 'bater') {
      // inclina e bate a ponta do dedo na pasta duas vezes
      const env = sm(u / 0.25) * (1 - sm((u - 0.8) / 0.2)), bate = u > 0.35 && u < 0.8 ? Math.max(0, Math.sin(Math.PI * 4 * (u - 0.35) / 0.45)) : 0
      ponto(0, -0.02, 0.02, 0.04 * bate)
      peso = [env, ler ? 1 : 0]
      inclina = Math.max(inclina, INCLINA.bater * env)
    }
  }
  // macio entre os quadros (pulou no tempo: direto)
  const k = salto ? 1 : 1 - Math.exp(-9 * dt)
  mem.inclina += (inclina - mem.inclina) * k
  for (const i of [0, 1]) mem.peso[i] = salto ? peso[i] : damp(mem.peso[i], peso[i], 9, dt)
  if (mem.inclina < 0.001 && mem.peso[0] < 0.001 && mem.peso[1] < 0.001) return
  // o tronco deita para a mesa; as mãos vão aos pontos (com o peito já no lugar deste quadro)
  a.spine.rotation.x += mem.inclina * 0.65; a.chest.rotation.x += mem.inclina * 0.35
  a.root.updateMatrixWorld(true)
  for (const i of [0, 1]) {
    if (mem.peso[i] < 0.001 || !P) continue
    const b = a.arms[i]
    alcancar(b, b.up.parent!.worldToLocal(_p.copy(_alvo[i])), POLO[i], mem.peso[i])
    b.hd.rotation.x += PULSO * mem.peso[i] // o pulso dobra para trás: a palma deita na mesa (girar a mão no eixo dela descolava a palma do punho)
  }
}
