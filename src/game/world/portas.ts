// As portas no jogo: o agente abre e fecha com a ação "interagir" (E). O mapa diz como cada porta começa (aberta,
// fechada, trancada); o que muda durante o jogo fica aqui, fora do mapa (o mapa não é alterado).
//   - abre sempre para o lado oposto ao do agente (a folha vai para longe dele, não bate nele);
//   - não fecha com o agente parado no vão;
//   - trancada não abre: mostra o motivo (e, por enquanto, o nome da chave; o inventário vem depois).
// A folha gira em PORTA.tempo segundos; a colisão muda na hora (abre: passa; fecha: bate).
import type { Opening } from '../../maps/types'
import { andarDe, type Mundo } from './colisao'

export const PORTA = {
  alcance: 1.4, // até onde o agente alcança a porta (m, do corpo até a linha da porta)
  tempo: 0.45, // quanto a folha leva para abrir ou fechar (s)
  vaoLivre: 0.45, // o agente a menos disso da linha da porta está no vão: não fecha
}

export interface PortaViva {
  aberta: boolean
  lado: 'a' | 'b' // para que lado a folha abre (como Opening.lado)
  ang: number // 0 = fechada, 1 = aberta (a animação)
}
export type PortasVivas = Map<string, PortaViva>

/** O estado inicial de cada porta, como está no mapa. */
export function novasPortas(m: Mundo): PortasVivas {
  const v: PortasVivas = new Map()
  for (const o of m.portas) { const aberta = m.abertas.has(o.id); v.set(o.id, { aberta, lado: o.lado ?? 'b', ang: aberta ? 1 : 0 }) }
  return v
}

/** O ponto da linha da porta mais perto de (x, z) e a distância até ele. */
function maisPerto(o: Opening, x: number, z: number) {
  const qx = o.axis === 'x' ? Math.min(o.x + o.width, Math.max(o.x, x)) : o.x
  const qz = o.axis === 'z' ? Math.min(o.z + o.width, Math.max(o.z, z)) : o.z
  return { qx, qz, d: Math.hypot(x - qx, z - qz) }
}

/** O lado da parede em que o ponto está ('b' = +z na parede em x, +x na parede em z). */
const ladoDe = (o: Opening, x: number, z: number): 'a' | 'b' => (o.axis === 'x' ? (z > o.z ? 'b' : 'a') : (x > o.x ? 'b' : 'a'))

/**
 * A porta que o agente pode usar agora: no andar dele, ao alcance, e na frente (do corpo ou da câmera).
 * Bem perto (no vão), vale de qualquer jeito.
 */
export function portaPerto(m: Mundo, x: number, y: number, z: number, yaws: number[]): Opening | null {
  const andar = andarDe(y)
  let melhor: Opening | null = null, dMelhor = Infinity
  for (const o of m.portas) {
    if (o.level !== andar) continue
    const { qx, qz, d } = maisPerto(o, x, z)
    if (d > PORTA.alcance || d >= dMelhor) continue
    const frente = d < 0.6 || yaws.some((a) => (Math.sin(a) * (qx - x) + Math.cos(a) * (qz - z)) / Math.max(d, 1e-6) > 0.35)
    if (frente) { melhor = o; dMelhor = d }
  }
  return melhor
}

/** O texto da ação para a porta (o que aparece na tela perto dela). */
export function dicaDaPorta(o: Opening, v: PortasVivas) {
  if (o.estado === 'trancada') return 'E · porta trancada'
  return v.get(o.id)?.aberta ? 'E · fechar a porta' : 'E · abrir a porta'
}

/** Usa a porta: abre, fecha ou diz por que não. Devolve a mensagem para a tela (ou null). */
export function usarPorta(m: Mundo, v: PortasVivas, o: Opening, x: number, z: number): string | null {
  const viva = v.get(o.id)
  if (!viva) return null
  if (o.estado === 'trancada') {
    const motivo = o.motivo?.trim() || 'Trancada.'
    return o.chave ? `${motivo} Abre com: ${o.chave}` : motivo
  }
  if (viva.aberta) {
    if (maisPerto(o, x, z).d < PORTA.vaoLivre) return null // parado no vão: não fecha em cima dele
    viva.aberta = false
    m.abertas.delete(o.id)
  } else {
    viva.lado = ladoDe(o, x, z) === 'a' ? 'b' : 'a' // abre para longe do agente
    viva.aberta = true
    m.abertas.add(o.id)
  }
  return null
}

/** Anda a animação das folhas. */
export function animarPortas(v: PortasVivas, dt: number) {
  const passo = dt / PORTA.tempo
  for (const p of v.values()) p.ang = p.aberta ? Math.min(1, p.ang + passo) : Math.max(0, p.ang - passo)
}
