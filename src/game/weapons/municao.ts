// A munição de cada arma (decidida em 12/nov, docs/jogo.md). É o estado do jogo; a animação só lê (a recarga em
// player/recarga.ts, o frasco da pistola em player/arma.ts).
//   escopeta: 4 balas; a recarga leva 1,5 s por bala que falta e cada bala vale assim que entra na câmara. Recarrega
//     sozinha quando a última sai (e com R antes); esquivar, cair, trocar de arma ou um clique novo no gatilho corta a
//     recarga (ficam as balas que já entraram; dá para recomeçar)
//   pistola: nunca acaba, mas esquenta 3% por tiro e não esfria enquanto atira; cheia, trava 5 s (esfriando até 30%)
// Os números em numeros.ts (MUNICAO). A munição da escopeta é infinita por enquanto (a fabricação vem depois).
import type { Arma } from '../player/arma'
import { MUNICAO } from './numeros'

const E = MUNICAO.escopeta, P = MUNICAO.pistola

export interface Municao {
  balas: number // escopeta: as balas no cano
  recarga: number // s desde o começo da recarga (−1 = não está recarregando)
  faltavam: number // quantas balas esta recarga põe (as que faltavam quando começou): a animação puxa só essas
  entraram: number // quantas delas já entraram
  ultimo: number // s desde o último tiro da escopeta
  calor: number // pistola: 0..1
  travada: number // s que a pistola ainda fica travada (0 = livre)
  semAtirar: number // s desde o último tiro da pistola
}
export const novaMunicao = (): Municao => ({ balas: E.balas, recarga: -1, faltavam: 0, entraram: 0, ultimo: 9, calor: 0, travada: 0, semAtirar: 9 })

/** Quanto dura a recarga de n balas (s). */
export const duracaoDaRecarga = (n: number) => E.porBala * n
/** Quando a bala i (0..n−1) de uma recarga de n entra na câmara (s desde o começo): as balas dividem o tempo entre o
 *  cartucho chegar em cima da câmara e o fim (a bomba). */
export const entradaDaBala = (i: number, n: number) => E.inicio + ((i + 1) * (duracaoDaRecarga(n) - E.inicio - E.fim)) / n

/** Pode sair um tiro desta arma agora? (a escopeta recarregando não atira: o clique novo corta a recarga antes) */
export function temTiro(m: Municao, arma: Arma | null): boolean {
  return arma === 'pistola' ? m.travada <= 0 : arma === 'escopeta' ? m.balas > 0 && m.recarga < 0 : false
}

/** Saiu um tiro: a escopeta gasta uma bala; a pistola esquenta e, cheia, trava. */
export function gastar(m: Municao, arma: Arma | null) {
  if (arma === 'escopeta') { m.balas = Math.max(0, m.balas - 1); m.ultimo = 0 }
  else if (arma === 'pistola') {
    m.calor = Math.min(1, m.calor + P.tiro); m.semAtirar = 0
    if (m.calor >= 0.999) { m.calor = 1; m.travada = P.trava }
  }
}

/** Começa a recarga da escopeta (R, atirar vazia, ou sozinha): só se falta bala e não está recarregando. */
export function recarregar(m: Municao): boolean {
  if (m.recarga >= 0 || m.balas >= E.balas) return false
  m.recarga = 0; m.faltavam = E.balas - m.balas; m.entraram = 0
  return true
}

/** A recarga para no meio: ficam as balas que já entraram. */
export const cortarRecarga = (m: Municao) => { m.recarga = -1 }

/**
 * A cada quadro. arma = a da mão; pode = pode recarregar agora (não está esquivando nem caído: senão a recarga é cortada).
 * A pistola esfria mesmo guardada; a escopeta vazia na mão recarrega sozinha; cada bala vale na hora em que entra.
 */
export function passoMunicao(m: Municao, arma: Arma | null, pode: boolean, dt: number) {
  m.ultimo += dt; m.semAtirar += dt
  // travada, esfria de cheia até `volta` no tempo da trava; livre, só esfria depois de uma pausa sem atirar
  if (m.travada > 0) { m.travada = Math.max(0, m.travada - dt); m.calor = P.volta + (1 - P.volta) * (m.travada / P.trava) }
  else if (m.semAtirar > P.pausa) m.calor = Math.max(0, m.calor - (m.semAtirar > P.espera ? P.esfriaRapido : P.esfria) * dt)
  if (arma !== 'escopeta' || !pode) { m.recarga = -1; return }
  if (m.recarga < 0 && m.balas === 0 && m.ultimo >= E.auto) recarregar(m)
  if (m.recarga < 0) return
  m.recarga += dt
  while (m.entraram < m.faltavam && m.recarga >= entradaDaBala(m.entraram, m.faltavam)) { m.balas = Math.min(E.balas, m.balas + 1); m.entraram++ }
  if (m.recarga >= duracaoDaRecarga(m.faltavam)) m.recarga = -1
}

/** O contador simples (o HUD conceito C vem depois): o que mostrar da arma na mão, ou null (sem munição para contar). */
export function textoDaMunicao(m: Municao, arma: Arma | null): string | null {
  if (arma === 'escopeta') return `Escopeta ${m.balas}/${E.balas}${m.recarga >= 0 ? ' · recarregando' : ''}`
  if (arma === 'pistola') return m.travada > 0 ? `Pistola · travada ${Math.ceil(m.travada)} s` : `Pistola · calor ${Math.round(m.calor * 100)}%`
  return null
}
