// O formato das cenas (cutscenes, docs/cenas.md): cada cena é um roteiro em dados, uma lista de planos. Um plano diz
// quanto dura, onde a câmera começa e termina e para onde olha, as falas (as legendas), os sons e como entra e sai
// (clareando do preto, escurecendo). O tocador (tocador.ts, TocarCena.tsx) lê o roteiro; nada aqui sabe desenhar.
// Os atores (quem anda, senta, fala) entram com a cena 2.
import type { Tocar } from '../enemies/sons'

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

export interface Plano {
  nome: string // "1.2 · os campos de pesquisa": o que aparece no Ver cenas
  dura: number // s
  camera?: CameraDoPlano // sem ela, o plano é preto (o título, uma pausa)
  clareia?: number // s: começa no preto e clareia
  escurece?: number // s: escurece até o preto no fim
  falas?: Fala[]
  sons?: SomDaCena[]
  titulo?: { t: number; dura: number; texto: string } // um texto grande no meio da tela (o nome do jogo)
}

export interface Cena {
  id: string
  nome: string
  mapa: string // o mapa do capítulo (maps/<mapa>): o cenário (docs/cenas.md: as partes de cena ficam soltas nele)
  planos: Plano[]
}
