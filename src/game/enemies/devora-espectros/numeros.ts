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

/** O bote (de longe): o aviso (s: recua, ergue a cabeça e abre a boca, acende âmbar), a investida (s, reta, de boca
 *  aberta: avança `distancia` m) e a volta (s). recua: o quanto ergue o nariz no aviso (rad); boca: o quanto abre (rad). */
export const BOTE = { aviso: 0.5, investe: 0.3, volta: 0.6, distancia: 3.2, recua: 0.35, boca: 0.95 }

/** A mordida (de perto): o aviso (s), a abocanhada (s: a cabeça vai à frente `avanco` m e a boca fecha: o instante do
 *  dano) e a volta (s). */
export const MORDIDA = { aviso: 0.3, abocanha: 0.13, volta: 0.45, avanco: 0.7, boca: 0.85, alcance: 1.6 }

/** O cuspe (uma Sombra ou uma Asa espectral): infla (s: recua, a boca abre devagar, o corpo estufa), cospe (s: o tranco
 *  para trás, a boca escancarada; a cria sai no começo) e a volta (s). recua: m/s para trás ao cuspir. */
export const CUSPE = { infla: 0.8, cospe: 0.3, volta: 0.6, boca: 1.15, estufa: 0.08, recua: 1.6, alcance: [3, 5] as const }

/** O tiro nele: o tranco (rad) e quanto dura (s). */
export const DANO = { tranco: 0.22, dura: 0.35 }
