// O Devora espectros, os números (o jogo novo: o fantasma capturável; o modelo é o do Devora almas repintado,
// modelos/espectrais/devora-espectros.bbmodel). Pontos de partida, para ajustar vendo no Ver modelos.
import type { ConfigMolas } from '../../corpo/molas'

/** O tamanho no jogo: 1 = o modelo como está (~3,3 m da boca à ponta dos tentáculos, ~2 m de altura). O Devora almas
 *  era 3 vezes o modelo; este é um fantasma, não um chefe. */
export const ESCALA = 1

/** Ele flutua: a altura do meio do corpo (m), o quanto sobe e desce (m) e em quanto tempo (s); o nariz sobe e desce
 *  junto (rad). Andando, deita um pouco para a frente (rad). */
export const PAIRAR = { altura: 1.0, sobe: 0.12, volta: 2.8, inclina: 0.05, deita: 0.12 }

/** Os tentáculos ondulam como numa água parada: uma volta (s), o atraso de um tentáculo para o seguinte e de um osso
 *  para o seguinte (rad), o quanto dobram (rad) e o peso de cada osso (o da ponta mexe mais). */
export const ONDA = { volta: 2.2, defasa: 0.9, porOsso: 0.8, amplo: 0.2, ossos: [0.5, 0.85, 1.2] }

/** A boca respira: entreaberta (rad) e o quanto abre e fecha (rad). */
export const BOCA = { aberta: 0.12, respira: 0.06, volta: 3.4 }

/** O pano rasgado (as molas do manto do Devora almas). */
export const MANTO: ConfigMolas = { mola: 24, amortece: 3.4, tranco: 0.6, trancoMax: 30, solto: 1.0, preso: 0.25, zona: { tras: -0.2, frente: 0.2, lado: 0.05 } }
