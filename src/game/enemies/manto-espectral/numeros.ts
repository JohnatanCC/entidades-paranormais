// O Manto espectral, os números (o jogo novo, docs/demonios.md: um fantasma capturável, a variante mais forte da Sombra
// espectral). O modelo é modelos/espectrais/manto-espectral.bbmodel, em blocos. Pontos de partida, para
// ajustar vendo no Ver modelos.
import type { ConfigMolas } from '../../corpo/molas'

/** As tiras do manto (presas debaixo da capa, a barra solta). */
export const MANTO: ConfigMolas = { mola: 22, amortece: 3.4, tranco: 0.7, trancoMax: 25, solto: 0.8, preso: 0.04, zona: { tras: -0.05, frente: 0.05, lado: 0.05 } }

/** A ponta do capuz e os cubos pendurados (as molas). */
export const MOLAS: ConfigMolas = { mola: 18, amortece: 3, tranco: 0.7, trancoMax: 30, solto: 0.9, preso: 0.15, zona: { tras: -0.2, frente: 0.2, lado: 0.1 } }

/** Parado: a respiração (o quanto o corpo estica, em s), os braços longos balançando (rad, s), os curtos mexendo os dedos
 *  e a cabeça olhando em volta (rad). */
export const PARADO = { respira: 0.025, volta: 3.2, bracos: 0.06, balanco: 2.6, curtos: 0.12, olha: 0.22 }

/** Andando: o passo (s por passo), o quanto a coxa vai (rad), o joelho dobra (rad), o corpo sobe (m) e deita (rad), os
 *  braços longos vão contra as pernas (rad). */
export const ANDAR = { passo: 0.55, coxa: 0.45, joelho: 0.6, sobe: 0.04, deita: 0.08, bracos: 0.3 }

/** A luta (ia.ts): a vida (26/nov: 450; a pistola tira 3 por tiro, a escopeta 10 por bago), quanto dela volta se ele
 *  romper a captura, a velocidade andando (m/s), o quanto vira (rad/s), o raio do corpo (m), até onde chega perto do agente
 *  (m: encosta para de andar, minimo nunca passa), o cone da frente (rad), a folga do alcance (m) e a espera entre os
 *  golpes (s); o giro: a cada quanto (s), só com GIRO.vida da vida. */
export const LUTA = { vida: 450, rompe: 0.3, vel: 1.9, vira: 3.2, raio: 0.6, encosta: 1.5, minimo: 1.1, frente: 0.5, folga: 0.4, espera: [0.9, 1.7] as const, giroCada: [8, 11] as const }

/** Agarrar (perto): o aviso (s: inclina para trás e abre os braços longos, acende âmbar), o bote (s: avança `avanco` m/s
 *  e fecha os braços), segura (s: o agente preso), solta (s). alcance = do meio dele até o agente (m). */
export const AGARRAR = { aviso: 0.55, bote: 0.22, segura: 2, solta: 0.5, avanco: 3, alcance: 1.7, dano: 30 }

/** O combo de socos (meia distância): o aviso (s: puxa os braços para trás), cada um dos 4 socos (s; o golpe pega no
 *  `pega` do soco), o quanto o braço estica (vezes: o de cima e o antebraço juntos), o quanto ele anda para a frente no combo (m/s) e a volta (s). */
export const SOCOS = { aviso: 0.4, cada: 0.3, pega: 0.4, n: 4, estica: 2.7, avanco: 0.6, volta: 0.45, alcance: 3.4, dano: 10 }

/** O golpe giratório (com 30% da vida): o aviso (s: ergue os braços de lado e agacha), o giro (s; rad/s no meio), o
 *  quanto ele anda para o agente girando (m/s), o raio dos braços (m) e o dano de cada volta que pega. Depois, atordoado. */
export const GIRO = { aviso: 0.6, dura: 3, vel: 13, anda: 1, raio: 2.3, dano: 20, vida: 0.3 }

/** Atordoado (depois do giro): quanto dura (s), o quanto o corpo cai (m) e deita (rad), a cabeça balançando (rad). */
export const ATORDOADO = { dura: 2, cai: 0.18, deita: 0.35, cabeca: 0.25 }

/** O tiro: o tranco (rad) e quanto dura (s). Fraco (a vida zerada: a captura): o quanto agacha (m) e deita (rad) e quanto dura (s:
 *  sem captura, volta com a vida cheia). */
export const DANO = { tranco: 0.2, dura: 0.35 }
export const FRACO = { cai: 0.35, deita: 0.45, dura: 8 }

/** O pano: a brisa de sempre e o ar que fica para trás de quem anda (m/s², por m/s); no giro, o quanto cada parte do
 *  manto abre para fora (rad). */
export const PANO = { brisa: 1.3, arrasto: 2.5, abre: 0.5 }
