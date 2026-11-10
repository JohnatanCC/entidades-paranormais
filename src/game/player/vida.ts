// A vida do agente (200; o HUD mostra em %), com os 0,9 s invulnerável depois de um golpe e o kit médico (+60).
// Por enquanto só o Testar usa (J toma dano, F usa um kit); os fantasmas e o HUD entram depois. Zerou: a queda.
import { AGENTE, DANO } from './numeros'

export interface Vida { atual: number; invul: number }
export const novaVida = (): Vida => ({ atual: AGENTE.vida, invul: 0 })

/** Um golpe: tira a vida (se não está invulnerável) e devolve true se pegou. */
export function tomarDano(v: Vida, quanto: number): boolean {
  if (v.invul > 0 || v.atual <= 0) return false
  v.atual = Math.max(0, v.atual - quanto); v.invul = AGENTE.invulneravel
  return true
}
export const curar = (v: Vida, quanto: number) => { if (v.atual > 0) v.atual = Math.min(AGENTE.vida, v.atual + quanto) }
export const passoVida = (v: Vida, dt: number) => { v.invul = Math.max(0, v.invul - dt) }
/** Com 30% da vida ou menos (e ainda de pé): o corpo mostra (machucado). */
export const machucado = (v: Vida) => v.atual > 0 && v.atual / AGENTE.vida <= DANO.machucado
export const porcento = (v: Vida) => Math.round((100 * v.atual) / AGENTE.vida)
