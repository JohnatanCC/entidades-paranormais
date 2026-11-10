// O agente parado: a base (a respiração, o peso passando de uma perna para a outra e, com a pistola, o balanço leve da
// arma) e os gestos que ele faz sozinho depois de um tempo sem se mexer. Cada estado tem os seus gestos (sem arma, com
// a pistola; a armadilha e a escopeta vêm depois). Andar, esquivar ou trocar de arma corta o gesto na hora: a animação
// nunca segura o controle. Os tempos ficam em numeros.ts (PARADO).
import * as THREE from 'three'
import { alcancar } from './alcancar'
import { maoParaArma, type Arma } from './arma'
import type { PoseMao } from './maos'
import type { Agente } from './modelo'
import { PARADO } from './numeros'

export type Gesto = 'olhar' | 'alca' | 'bolsa' | 'mao' | 'frasco' | 'pulso'
const NOMES: Record<Gesto, string> = {
  olhar: 'Olhar em volta', alca: 'Ajustar a alça', bolsa: 'Conferir a bolsa', mao: 'Abrir e fechar a mão',
  frasco: 'Conferir o frasco', pulso: 'Girar o pulso',
}
// os gestos de cada estado (com a armadilha e a escopeta, ainda nenhum)
const DO_ESTADO: Record<Arma | 'nenhuma', Gesto[]> = {
  nenhuma: ['olhar', 'alca', 'bolsa', 'mao'],
  pistola: ['olhar', 'frasco', 'pulso'],
  escopeta: [],
  armadilha: [],
}
/** Os gestos (e os nomes) de quem está com esta arma na mão (null = mão vazia). */
export const gestosDe = (arma: Arma | null): [Gesto, string][] => DO_ESTADO[arma ?? 'nenhuma'].map((g) => [g, NOMES[g]])

/** O que o parado lembra de um quadro para o outro. arma = com que arma o gesto começou (trocou, corta). */
export interface AnimParado { espera: number; gesto: Gesto | null; arma: Arma | null; t: number; k: number; cortado: boolean; ultimo: Gesto | null; peso: number }
const sorteia = () => PARADO.espera[0] + Math.random() * (PARADO.espera[1] - PARADO.espera[0])
export const novoParado = (): AnimParado => ({ espera: sorteia(), gesto: null, arma: null, t: 0, k: 0, cortado: false, ultimo: null, peso: Math.random() * 6 })

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

/** Com a pistola na guarda, a arma nunca fica parada de todo: o braço e o pulso derivam devagar, cada um no seu ritmo. */
export function balancoDaArma(a: Agente, quieto: number) {
  if (a.arma !== 'pistola' || quieto <= 0) return
  const T = a.anim.parado.peso, b = a.arms[0], B = PARADO.balanco
  b.up.rotation.x += B.braco * Math.sin(T * 1.1) * quieto
  b.hd.rotation.x += B.pulso * Math.sin(T * 0.7 + 1) * quieto
  b.hd.rotation.y += B.pulso * Math.sin(T * 0.45 + 2) * quieto
}

// ---------- os gestos: cada um mexe a cabeça e os braços por cima da pose (k = quanto, 0..1) ----------
const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z)
const _alvo = new THREE.Vector3(), _x = new THREE.Vector3(), _y = new THREE.Vector3(), _z = new THREE.Vector3()
const _m = new THREE.Matrix4(), _qArma = new THREE.Quaternion(), _qMao = new THREE.Quaternion(), _qPai = new THREE.Quaternion(), _qGira = new THREE.Quaternion()
const EIXO_CANO = V(0, 0, 1)
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
  // olha devagar para a esquerda, para, e para a direita; os olhos chegam primeiro. Com a pistola, o peito vira mais
  // (a arma acompanha o olhar) e o braço sobe um pouco, pronto
  olhar: {
    dur: 4.6,
    fazer: (a, t, k) => {
      const yaw: [number, number][] = [[0, 0], [0.9, 0.75], [2.1, 0.75], [2.9, -0.65], [3.9, -0.65], [4.6, 0]]
      const y = curva(t, yaw)
      cabeca(a, y * k, curva(t, [[0, 0], [0.9, -0.05], [2.9, 0.06], [4.6, 0]]) * k)
      olhos(a, (curva(t + 0.35, yaw) - y) * k)
      if (a.arma === 'pistola') {
        a.chest.rotation.y += y * 0.2 * k
        a.arms[0].up.rotation.x -= 0.22 * Math.min(1, Math.abs(y) / 0.6) * k
      }
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
  // a pistola sobe na frente do peito, deitada, com o frasco de ectoplasma virado para os olhos; ele gira um pouco
  // conferindo e abaixa de volta para a guarda
  frasco: {
    dur: 3.6,
    fazer: (a, t, k) => {
      const b = curva(t, [[0, 0], [0.8, 1], [2.8, 1], [3.6, 0]]) * k, braco = a.arms[0]
      alcancar(braco, _alvo.set(-0.08, 0.22, 0.26), V(-1, -0.7, -0.2), b)
      // o giro da arma no espaço do peito: o cano para a esquerda e para a frente, o topo (o frasco) para o rosto
      _z.set(0.75, -0.1, 0.65).normalize()
      _y.set(0.1, 0.75, -0.65); _y.addScaledVector(_z, -_y.dot(_z)).normalize()
      _x.crossVectors(_y, _z)
      _qArma.setFromRotationMatrix(_m.makeBasis(_x, _y, _z))
      _qArma.multiply(_qGira.setFromAxisAngle(EIXO_CANO, curva(t, [[0.8, 0], [1.6, 0.35], [2.3, -0.12], [2.8, 0]])))
      // a mão que deixa a arma assim, vista do antebraço (o braço já está no lugar)
      maoParaArma('pistola', _qArma, _qMao)
      _qPai.copy(braco.up.quaternion).multiply(braco.fo.quaternion).invert()
      braco.hd.quaternion.slerp(_qMao.premultiply(_qPai), b)
      cabeca(a, -0.15 * b, 0.4 * b)
      return [undefined, undefined]
    },
  },
  // gira o pulso de um lado para o outro, aliviando o peso da arma, e o antebraço sobe um pouco
  pulso: {
    dur: 2.4,
    fazer: (a, t, k) => {
      const b = a.arms[0]
      b.fo.rotation.x += curva(t, [[0, 0], [0.5, -0.15], [1.9, -0.15], [2.4, 0]]) * k
      b.hd.rotation.y += curva(t, [[0, 0], [0.45, -0.55], [0.9, 0.35], [1.35, -0.45], [1.8, 0.2], [2.4, 0]]) * k
      b.hd.rotation.x += curva(t, [[0, 0], [0.6, 0.25], [1.2, -0.15], [1.8, 0.2], [2.4, 0]]) * k
      return [undefined, undefined]
    },
  },
}

/** Começa um gesto agora (o Ver modelos usa para mostrar sem esperar). */
export function fazerGesto(a: Agente, g: Gesto) {
  const p = a.anim.parado
  p.gesto = g; p.arma = a.arma; p.t = 0; p.k = 1; p.cortado = false
}

/**
 * Os gestos: depois de um tempo parado, sorteia um dos gestos do estado (nunca o mesmo duas vezes seguidas) e faz.
 * parado = está parado de verdade agora. Devolve a pose de cada mão que o gesto pede.
 */
export function gestoParado(a: Agente, parado: boolean, dt: number): Maos {
  const p = a.anim.parado
  if (!parado || (p.gesto && p.arma !== a.arma)) { // mexeu ou trocou de arma: corta o gesto e a espera recomeça
    p.espera = sorteia()
    if (p.gesto) p.cortado = true
  } else if (!p.gesto && (p.espera -= dt) <= 0) {
    const lista = DO_ESTADO[a.arma ?? 'nenhuma'], outros = lista.filter((g) => g !== p.ultimo)
    if (lista.length) fazerGesto(a, (outros.length ? outros : lista)[Math.floor(Math.random() * (outros.length || lista.length))])
    else p.espera = sorteia()
  }
  if (!p.gesto) return [undefined, undefined]
  const def = GESTO[p.gesto]
  // cortado: o gesto para onde está e some rápido; senão anda (o próprio gesto entra e sai suave pelas chaves)
  if (p.cortado) p.k *= Math.exp(-PARADO.sai * dt)
  else p.t += dt
  if (p.t >= def.dur || p.k < 0.02) { p.ultimo = p.gesto; p.gesto = null; p.espera = sorteia(); return [undefined, undefined] }
  return def.fazer(a, p.t, p.k)
}
