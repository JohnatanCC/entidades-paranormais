// O agente parado: a base (a respiração e o peso passando de uma perna para a outra) e os gestos que ele faz sozinho
// depois de um tempo sem se mexer. Andar, esquivar ou trocar de arma corta o gesto na hora: a animação nunca segura o
// controle. Os tempos ficam em numeros.ts (PARADO). Por enquanto, os gestos de mão vazia; os de cada arma vêm depois.
import * as THREE from 'three'
import { alcancar } from './alcancar'
import type { PoseMao } from './maos'
import type { Agente } from './modelo'
import { PARADO } from './numeros'

export type Gesto = 'olhar' | 'alca' | 'bolsa' | 'mao'
export const GESTOS: [Gesto, string][] = [['olhar', 'Olhar em volta'], ['alca', 'Ajustar a alça'], ['bolsa', 'Conferir a bolsa'], ['mao', 'Abrir e fechar a mão']]

/** O que o parado lembra de um quadro para o outro. */
export interface AnimParado { espera: number; gesto: Gesto | null; t: number; k: number; cortado: boolean; ultimo: Gesto | null; peso: number }
const sorteia = () => PARADO.espera[0] + Math.random() * (PARADO.espera[1] - PARADO.espera[0])
export const novoParado = (): AnimParado => ({ espera: sorteia(), gesto: null, t: 0, k: 0, cortado: false, ultimo: null, peso: Math.random() * 6 })

const sm = (x: number) => { const k = Math.max(0, Math.min(1, x)); return k * k * (3 - 2 * k) }
/** Um valor ao longo do tempo, por chaves [tempo, valor], suave entre elas. */
function curva(t: number, chaves: [number, number][]): number {
  if (t <= chaves[0][0]) return chaves[0][1]
  for (let i = 1; i < chaves.length; i++) {
    const [t1, v1] = chaves[i]
    if (t <= t1) { const [t0, v0] = chaves[i - 1]; return v0 + (v1 - v0) * sm((t - t0) / (t1 - t0)) }
  }
  return chaves[chaves.length - 1][1]
}

/** O peso passando de uma perna para a outra (−1..1, já vezes quanto está parado). Avança o tempo. */
export function pesoParado(a: Agente, quieto: number, dt: number): number {
  const p = a.anim.parado
  p.peso += dt
  return Math.sin((p.peso / PARADO.peso.volta) * Math.PI * 2) * quieto
}

// ---------- os gestos: cada um mexe a cabeça e os braços por cima da pose (k = quanto, 0..1) ----------
const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z)
const _alvo = new THREE.Vector3()
type Maos = [PoseMao | undefined, PoseMao | undefined]
interface DefGesto { dur: number; fazer: (a: Agente, t: number, k: number) => Maos }

/** Vira a cabeça (o pescoço leva uma parte, o peito um pouco) e inclina para baixo (x > 0). */
function cabeca(a: Agente, y: number, x: number) {
  a.chest.rotation.y += y * 0.15; a.neck.rotation.y += y * 0.3; a.head.rotation.y += y * 0.55
  a.neck.rotation.x += x * 0.35; a.head.rotation.x += x * 0.65
}
/** Os olhos vão antes da cabeça: olham para onde ela ainda vai virar. */
function olhos(a: Agente, adiante: number) {
  const r = a.anim.rosto
  r.olharAlvo = Math.max(-0.008, Math.min(0.008, adiante * 0.02)); r.olharT = 0.5
}

const GESTO: Record<Gesto, DefGesto> = {
  // olha devagar para a esquerda, para, e para a direita; os olhos chegam primeiro
  olhar: {
    dur: 4.6,
    fazer: (a, t, k) => {
      const yaw: [number, number][] = [[0, 0], [0.9, 0.75], [2.1, 0.75], [2.9, -0.65], [3.9, -0.65], [4.6, 0]]
      const y = curva(t, yaw)
      cabeca(a, y * k, curva(t, [[0, 0], [0.9, -0.05], [2.9, 0.06], [4.6, 0]]) * k)
      olhos(a, (curva(t + 0.35, yaw) - y) * k)
      return [undefined, undefined]
    },
  },
  // a mão direita sobe até a alça da mochila, no peito, e dá dois puxões para baixo
  alca: {
    dur: 2.6,
    fazer: (a, t, k) => {
      const b = curva(t, [[0, 0], [0.6, 1], [2.0, 1], [2.6, 0]]) * k
      const puxa = curva(t, [[0.6, 0], [0.85, -0.04], [1.1, 0], [1.35, -0.035], [1.6, 0]])
      alcancar(a.arms[0], _alvo.set(-0.07, 0.36 + puxa, 0.17), V(-0.8, -1, -0.4), b)
      a.arms[0].hd.rotation.x += 0.4 * b
      cabeca(a, -0.2 * b, 0.18 * b)
      return [b > 0.5 ? 'punho' : undefined, undefined]
    },
  },
  // a mão direita desce até a bolsa do cinto e bate duas vezes, conferindo; ele olha
  bolsa: {
    dur: 2.4,
    fazer: (a, t, k) => {
      const b = curva(t, [[0, 0], [0.6, 1], [1.8, 1], [2.4, 0]]) * k
      const bate = curva(t, [[0.6, 0], [0.8, -0.03], [1.0, 0], [1.2, -0.03], [1.4, 0]])
      alcancar(a.arms[0], _alvo.set(-0.13, 0.07 + bate, 0.2), V(-1, -0.6, -0.5), b)
      cabeca(a, -0.2 * b, 0.35 * b)
      return [b > 0.5 ? 'aberta' : undefined, undefined]
    },
  },
  // a mão esquerda sobe na frente da barriga, abre e fecha duas vezes (frio, nervoso); ele olha para ela
  mao: {
    dur: 3.2,
    fazer: (a, t, k) => {
      const b = curva(t, [[0, 0], [0.6, 1], [2.6, 1], [3.2, 0]]) * k
      alcancar(a.arms[1], _alvo.set(0.1, 0.12, 0.28), V(1, -1, -0.3), b)
      cabeca(a, 0.2 * b, 0.3 * b)
      const pose: PoseMao | undefined = b < 0.5 ? undefined : t < 1.1 ? 'aberta' : t < 1.6 ? 'punho' : t < 2.1 ? 'aberta' : 'punho'
      return [undefined, pose]
    },
  },
}

/** Começa um gesto agora (o Ver modelos usa para mostrar sem esperar). */
export function fazerGesto(a: Agente, g: Gesto) {
  const p = a.anim.parado
  p.gesto = g; p.t = 0; p.k = 1; p.cortado = false
}

/**
 * Os gestos: depois de um tempo parado (e de mão vazia), sorteia um (nunca o mesmo duas vezes seguidas) e faz.
 * parado = está parado de verdade agora. Devolve a pose de cada mão que o gesto pede.
 */
export function gestoParado(a: Agente, parado: boolean, dt: number): Maos {
  const p = a.anim.parado
  if (!parado || a.arma !== null) { // mexeu: corta o gesto e a espera recomeça
    p.espera = sorteia()
    if (p.gesto) p.cortado = true
  } else if (!p.gesto && (p.espera -= dt) <= 0) {
    const lista = GESTOS.map(([g]) => g).filter((g) => g !== p.ultimo)
    fazerGesto(a, lista[Math.floor(Math.random() * lista.length)])
  }
  if (!p.gesto) return [undefined, undefined]
  const def = GESTO[p.gesto]
  // cortado: o gesto para onde está e some rápido; senão anda (o próprio gesto entra e sai suave pelas chaves)
  if (p.cortado) p.k *= Math.exp(-PARADO.sai * dt)
  else p.t += dt
  if (p.t >= def.dur || p.k < 0.02) { p.ultimo = p.gesto; p.gesto = null; p.espera = sorteia(); return [undefined, undefined] }
  return def.fazer(a, p.t, p.k)
}
