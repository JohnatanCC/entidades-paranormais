// O Asa do terror, os números (o jogo novo, docs/demonios.md: o fantasma capturável da família da Asa espectral). O
// modelo é modelos/espectrais/asa-terror.bbmodel, em blocos. Pontos de partida, para ajustar vendo no Ver modelos.
import type { ConfigMolas } from '../../corpo/molas'

/** O pano do capuz, os tentáculos e os cubos pendurados (as molas). */
export const MOLAS: ConfigMolas = { mola: 16, amortece: 2.6, tranco: 0.8, trancoMax: 30, solto: 1.1, preso: 0.35, zona: { tras: -0.3, frente: 0.3, lado: 0.3 } }

/** O voo: o tempo de uma batida (s); o quanto as asas de cima e as de baixo sobem e descem (rad), o atraso das de baixo
 *  (da batida: 0..1), a ponta que vem atrasada e o quanto ela dobra na subida (rad), o quanto a asa vai para a frente ao
 *  descer (rad); o corpo: sobe a cada batida (m), balança de lado e olha em volta (rad), deita para a frente (rad por
 *  m/s, até andarMax m/s); as mandíbulas (rad; um ciclo de estalos em tique s) e o bico (rad); o vento nas molas (m/s²):
 *  a brisa, o sopro das asas e o arrasto de quem anda (por m/s). */
export const VOO = {
  batida: 0.62, cima: 0.7, baixo: 0.5, atraso: 0.35, ponta: 0.4, dobra: 0.35, varre: 0.16,
  sobe: 0.07, balanco: 0.05, olha: 0.14, inclina: 0.1, andarMax: 3,
  mandibulas: 0.24, tique: 1.6, bico: 0.1, brisa: 1.6, sopro: 2.5, arrasto: 2.2,
}

/** O tiro carregado: a carga (s: abre as asas e as mandíbulas, a bola de luz cresce, o aviso âmbar), o recuo depois do
 *  disparo (s); a rajada (com vidaRajada da vida: 30%): quantos tiros e o tempo entre eles (s). Para a inteligência: um
 *  tiro a cada `cada` s e a pausa parado depois dele (s). boca = de onde sai (m, no corpo: entre as mandíbulas). */
export const TIRO = { carga: 1.1, recuo: 0.35, rajada: 3, entre: 0.45, vidaRajada: 0.3, cada: 6, pausa: 1, boca: [0, -0.62, 0.66] as const }

/** A bomba: a velocidade do voo (m/s); presa, pisca cada vez mais rápido (s entre as piscadas: da primeira à última) e
 *  explode em `explode` s: o raio (m) e o dano; o tamanho do núcleo e dos espinhos (m). */
export const BOMBA = { vel: 9, pisca: [0.5, 0.07] as const, explode: 2.5, raio: 2.2, dano: 30, tam: 0.24, espinho: 0.3 }

/** O teletransporte: o tempo se desfazendo em cubos (s) e o de surgir no outro lugar (s). */
export const TELE = { some: 0.5, surge: 0.4 }

/** O tiro que ele leva: o tranco (s, rad). Fraco (a vida zerada, a hora da captura): o quanto desce (m), as asas caem
 *  (rad), a batida fica lenta (vezes) e quanto dura (s: sem captura, volta com a vida cheia). */
export const DANO = { dura: 0.35, tranco: 0.35 }
export const FRACO = { cai: 0.9, asas: 0.45, batida: 1.9, dura: 8 }

/** A luta (ia.ts): a vida (26/nov: 400) e quanto dela volta se romper a captura; a faixa de distância que ele quer do
 *  agente (m), a velocidade (m/s), o quanto vira (rad/s), a altura do voo (m, do chão ao meio do corpo), o raio do corpo
 *  (m) e o mínimo até o agente (m, a captura o puxa até aí). O teletransporte: perto demais (m), a espera entre um e outro
 *  (s), a chance depois de cada tiro e até onde o destino pode ficar do agente (m). O andar de lado (m/s; troca de lado a
 *  cada tanto, s). A bomba cai em volta do agente (m). */
export const LUTA = {
  vida: 400, rompe: 0.3, longe: [7, 12] as const, vel: 2.6, vira: 3, altura: 2.6, raio: 0.8, minimo: 2.5,
  perto: 5, teleCada: [4, 7] as const, teleTiro: 0.4, destino: [8, 12] as const,
  lado: 1.2, trocaLado: [2, 4] as const, espalha: 0.8,
}
