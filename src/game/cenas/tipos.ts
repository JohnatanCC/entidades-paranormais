// O formato das cenas (cutscenes, docs/cenas.md): cada cena é um roteiro em dados, uma lista de planos. Um plano diz
// quanto dura, onde a câmera começa e termina e para onde olha, as falas (as legendas), os sons e como entra e sai
// (clareando do preto, escurecendo). O tocador (tocador.ts, TocarCena.tsx) lê o roteiro; nada aqui sabe desenhar.
// Os atores (o elenco da cena) são os personagens montados no esqueleto do agente: cada um começa num lugar e, em
// cada plano, pode ser posto em outro (o corte), andar até um ponto, virar, olhar para alguém e mudar a expressão. Quem
// fala mexe a boca enquanto a legenda dele está na tela. O lugar de cada um é sempre uma conta do tempo da cena (atores.ts):
// pular para um plano põe todo mundo onde deve estar.
import type { ComponentType } from 'react'
import type { Tocar } from '../enemies/sons'
import type { ModeloAgente } from '../player/modelo'
import type { Expressao } from '../player/rosto'
import type { Chunk } from '../../maps/types'
import type { Relogio } from './TocarCena'

/** Um ponto no mundo (m). */
export type V3 = [number, number, number]

/** O jeito do movimento: 'suave' acelera e freia; 'entra' acelera; 'sai' freia; 'linear', velocidade igual. */
export type Curva = 'suave' | 'entra' | 'sai' | 'linear'

export interface CameraDoPlano {
  de: V3 // onde a câmera está no começo do plano
  para?: V3 // e no fim (sem ele, parada)
  olha: V3 // para onde olha no começo
  olhaFim?: V3 // e no fim (sem ele, o mesmo ponto)
  lente?: number // o campo de visão (graus, vertical); sem ela, 45
  curva?: Curva // sem ela, 'suave'
  treme?: number // a tremida de mão (1 = a padrão, 0 = parada de tripé)
}

/** Uma legenda: começa em `t` s do plano e fica `dura` s. pensamento = falando para si (a legenda em itálico). */
export interface Fala { t: number; dura: number; quem: string; texto: string; pensamento?: boolean }

/** Um som que toca em `t` s do plano (só quando a cena anda para a frente, tocando). */
export interface SomDaCena { t: number; tocar: Tocar }

/** Um ator no elenco: o modelo e onde está quando a cena começa (vira: para onde fica de frente, em graus; 0 = +z). */
export interface Ator { modelo: ModeloAgente; em: V3; vira: number }

/** A postura do corpo, que vale até mudar: 'ler' = inclinado sobre a mesa, as duas mãos na pasta aberta (em `em`). */
export type Postura = 'ler'
/** Um gesto rápido, por cima da postura (game/cenas/gestos.ts): virar uma folha da pasta, fechar a pasta, bater o dedo nela. */
export type Gesto = 'virar' | 'fechar' | 'bater'

/** O que um ator faz num plano (o que não for dito continua como estava no plano anterior). */
export interface AcaoDoAtor {
  em?: V3 // põe o ator aqui no começo do plano (um corte)
  vira?: number // para onde fica de frente (graus; 0 = +z, 90 = +x): gira no começo do plano, ou ao chegar, se anda
  anda?: { para: V3; de?: number; ate?: number } // anda até o ponto entre os segundos `de` e `ate` do plano (sem: o plano todo)
  corre?: boolean // anda correndo
  olha?: string | V3 | null // a cabeça vira para outro ator (o nome dele) ou para um ponto; null = para a frente
  expressao?: Expressao
  alcanca?: { ponto: V3; t: number } // a mão esquerda vai a um ponto e volta, em `t` s do plano (a maçaneta da porta)
  postura?: { nome: Postura; em: V3 } | null // a postura do corpo (vale até mudar); null = de pé, solto
  gesto?: { nome: Gesto; t: number; em: V3 } // um gesto rápido em `t` s do plano, no ponto `em` (a pasta)
}

/** Uma porta do mapa (o id dela) que abre ou fecha em `t` s do plano. lado: para que lado a folha abre (como no mapa:
 *  'b' = +z na parede em x, +x na parede em z); sem ele, o do mapa. Abra para longe de quem passa. */
export interface PortaDaCena { id: string; t: number; abre: boolean; lado?: 'a' | 'b' }

export interface Plano {
  nome: string // "1.2 · os campos de pesquisa": o que aparece no Ver cenas
  dura: number // s
  camera?: CameraDoPlano // sem ela, o plano é preto (o título, uma pausa)
  clareia?: number // s: começa no preto e clareia
  escurece?: number // s: escurece até o preto no fim
  falas?: Fala[]
  sons?: SomDaCena[]
  titulo?: { t: number; dura: number; texto: string } // um texto grande no meio da tela (o nome do jogo)
  atores?: Record<string, AcaoDoAtor> // o que cada ator do elenco faz neste plano (pelo nome)
  portas?: PortaDaCena[]
  luz?: string // um momento de luz (MOMENTOS em maps/ambientes.ts) que vale enquanto o plano dura (o alarme)
}

/** O que o cenário de uma cena recebe: o relógio, a própria cena (os gestos dos atores) e os blocos do mapa (a luz). */
export interface PropsDoCenario { relogio: Relogio; cena: Cena; chunks: Chunk[] }

export interface Cena {
  id: string
  nome: string
  mapa: string // o mapa do capítulo (maps/<mapa>): o cenário (docs/cenas.md: as partes de cena ficam soltas nele)
  planos: Plano[]
  // o que a cena põe no mapa além dele, dentro do <Canvas>, andando com o relógio dela (o ectoplasma da cena 1)
  cenario?: ComponentType<PropsDoCenario>
  // os atores, pelo nome (o mesmo das falas: quem fala mexe a boca)
  elenco?: Record<string, Ator>
}
