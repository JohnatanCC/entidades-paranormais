// A vida do agente (200; o HUD mostra em %), com os 0,9 s invulnerável depois de um golpe e os kits médicos (F, +60).
// Os kits: começa com 3; zerado, nasce 1 a cada 1:30 (docs/jogo.md); numa fase, o roteiro dá mais (a onda limpa).
// Zerou a vida: a queda.
import { AGENTE, DANO, KITS } from './numeros'

export interface Vida { atual: number; invul: number; kits: number; novoKit: number /* s até o próximo kit (com 0) */ }
export const novaVida = (): Vida => ({ atual: AGENTE.vida, invul: 0, kits: KITS.inicio, novoKit: KITS.novo })

/** Um golpe: tira a vida (se não está invulnerável) e devolve true se pegou. */
export function tomarDano(v: Vida, quanto: number): boolean {
  if (v.invul > 0 || v.atual <= 0) return false
  v.atual = Math.max(0, v.atual - quanto); v.invul = AGENTE.invulneravel
  return true
}
/** F: usa um kit (se tem, se está de pé e se falta vida). */
export function usarKit(v: Vida): boolean {
  if (v.kits <= 0 || v.atual <= 0 || v.atual >= AGENTE.vida) return false
  v.kits--; v.atual = Math.min(AGENTE.vida, v.atual + AGENTE.kit)
  if (v.kits === 0) v.novoKit = KITS.novo
  return true
}
/** Ganhou kits (o roteiro: a onda limpa), até o máximo. */
export const ganharKit = (v: Vida, n = 1) => { v.kits = Math.min(KITS.max, v.kits + n) }
export function passoVida(v: Vida, dt: number) {
  v.invul = Math.max(0, v.invul - dt)
  if (v.kits === 0 && (v.novoKit -= dt) <= 0) { v.kits = 1; v.novoKit = KITS.novo } // zerado: nasce um
}
/** Voltou depois de cair: a vida cheia; os kits, pelo menos os do começo. */
export function voltarVida(v: Vida) { v.atual = AGENTE.vida; v.invul = 0; v.kits = Math.max(v.kits, KITS.inicio); v.novoKit = KITS.novo }
/** Com 30% da vida ou menos (e ainda de pé): o corpo mostra (machucado). */
export const machucado = (v: Vida) => v.atual > 0 && v.atual / AGENTE.vida <= DANO.machucado
