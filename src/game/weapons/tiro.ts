// O gatilho: a cadência de cada arma e o que sai no tiro (o coice no corpo, o clarão no cano e, na escopeta, a bomba
// depois). Se ainda há tiro (as balas, a sobrecarga) quem diz é municao.ts: quem chama só aperta quando temTiro. Ainda
// sem bala nem dano (a etapa 4b). Só a pistola e a escopeta atiram; a armadilha é jogada (armadilha.ts). Atirar sem
// estar mirando levanta a arma antes (o tiro sai quando ela chega).
import type { Agente } from '../player/modelo'
import { TIRO } from './numeros'

/** Segurando o gatilho, atira na cadência da arma. Chame a cada quadro (o relógio da cadência anda aqui).
 *  Devolve true no quadro em que saiu um tiro. */
export function gatilho(a: Agente, apertado: boolean, dt: number): boolean {
  const A = a.anim.arma
  A.cd = Math.max(0, A.cd - dt)
  if (!apertado || A.cd > 0 || A.mira < TIRO.pronto || (a.arma !== 'pistola' && a.arma !== 'escopeta')) return false
  const N = TIRO[a.arma]
  A.cd = N.cadencia; A.coice = 1; A.tiroT = 0; A.clarao = N.clarao
  return true
}
