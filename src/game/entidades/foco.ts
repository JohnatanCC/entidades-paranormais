// O foco (docs/teste-online.md): com mais de um jogador, cada fantasma escolhe quem atacar pela ameaça de cada um, a
// proximidade mais o dano que ele levou de cada um (que esvazia com o tempo: quem para de bater perde o foco aos
// poucos). Só troca de alvo quando o outro passa com folga e depois de um tempo mínimo no atual (não fica virando de um
// lado para o outro). Quem não pode levar golpe (caído) não é alvo. Pesa a cada FOCO.cada s, não a cada quadro.
// Com um jogador só, o alvo é sempre ele: o jogo de sempre não muda.
import type * as THREE from 'three'
import { FOCO } from './numeros'

/** Um jogador, para quem ataca: onde estão os pés, se pode levar golpe, ferir e a lamparina (o feixe afasta o Mestre). */
export interface Jogador {
  nome: string
  p: THREE.Vector3
  pode: () => boolean
  ferir: (dano: number, de: THREE.Vector3) => boolean
  lamparina: { ergue: number; pos: THREE.Vector3; dir: THREE.Vector3 } | null
}

/** O foco de um fantasma: o alvo, o dano que levou de cada um, há quanto tempo está no alvo e quando pesa de novo. */
export interface Foco { alvo: Jogador | null; dano: Map<Jogador, number>; no: number; olha: number }
export const novoFoco = (): Foco => ({ alvo: null, dano: new Map(), no: 0, olha: 0 })

/** O jogador j bateu nele (o tiro): a ameaça dele sobe. */
export function bateu(f: Foco, j: Jogador, dano: number) { f.dano.set(j, (f.dano.get(j) ?? 0) + dano) }

/** A ameaça de j para quem está em `de`: perto vale até FOCO.perto (em curva: a diferença de perto pesa mais; zero a
 *  `longe` m) e cada ponto de dano, FOCO.dano. */
export function ameaca(f: Foco, j: Jogador, de: THREE.Vector3, longe: number) {
  const d = Math.hypot(j.p.x - de.x, j.p.z - de.z), k = Math.max(0, 1 - d / longe)
  return FOCO.perto * k * k + (f.dano.get(j) ?? 0) * FOCO.dano
}

/**
 * Um quadro: quem ele ataca agora. de = onde ele está; longe = a distância em que a proximidade deixa de contar (a vista
 * larga); ve = ele vê esse jogador? (só chamado quando pesa: é a linha de visão, cara). Ninguém pode levar golpe: o
 * primeiro jogador (quem chama faz o que fazia antes: volta para o lugar dele).
 */
export function focar(f: Foco, jogadores: Jogador[], de: THREE.Vector3, longe: number, dt: number, ve?: (j: Jogador) => boolean): Jogador {
  const esquece = Math.exp(-dt / FOCO.esquece)
  for (const [j, v] of f.dano) if (v * esquece < 0.5) f.dano.delete(j); else f.dano.set(j, v * esquece)
  f.no += dt; f.olha -= dt
  if (jogadores.length === 1) return (f.alvo = jogadores[0])
  const perdeu = !f.alvo || !f.alvo.pode() || !jogadores.includes(f.alvo)
  if (!perdeu && f.olha > 0) return f.alvo!
  f.olha = FOCO.cada
  let melhor: Jogador | null = null, mv = -1, atual = 0
  for (const j of jogadores) {
    if (!j.pode()) continue
    let v = ameaca(f, j, de, longe)
    if (ve && !ve(j)) v *= FOCO.escondido
    if (j === f.alvo) atual = v
    if (v > mv) { mv = v; melhor = j }
  }
  if (perdeu || (melhor && melhor !== f.alvo && f.no >= FOCO.minimo && mv > atual * (1 + FOCO.folga))) { f.alvo = melhor; f.no = 0 }
  return f.alvo ?? jogadores[0]
}
