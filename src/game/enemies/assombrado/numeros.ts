// Os números do Assombrado (docs/demonios.md): o corpo e os movimentos. A luta (vida, dano, alcance) entra com a etapa
// dela. Mexa aqui para ajustar.
import type { ConfigMolas } from '../../corpo/molas'

// a ponta do capuz e os pingos de matéria: pesados, balançam devagar; não entram no corpo
export const MOLAS: ConfigMolas = { mola: 26, amortece: 3.6, tranco: 0.6, trancoMax: 30, solto: 1.0, preso: 0.12, zona: { tras: -0.1, frente: 0.1, lado: 0.1 } }

// o joão-bobo: o corpo balança em cima do pé como uma mola (mola = quão rápido volta; amortece = quanto acalma)
export const BALANCO = {
  mola: 30, amortece: 2.0,
  vaga: [0.05, 0.07], // rad: o quanto ele "procura" de leve, parado (para a frente, de lado)
  empurrao: [1.6, 3.2], tranco: 0.9, // s entre os empurrões sozinhos (sorteado) e a força deles (rad/s)
  maximo: 0.45, // rad: o quanto pode tombar
}

// o andar: pulinhos curtos e pesados na perna só. periodo = um pulo (s); a parte do pulo no chão carregando, no ar e
// pousando (somam 1); a altura do pulo e quanto ele agacha (m); o empurrão do pouso no balanço (rad/s)
export const PULO = { periodo: 0.62, carga: 0.22, voo: 0.52, pouso: 0.26, altura: 0.15, agacha: 0.06, pouso_tranco: 1.4, inclina: 0.18 }

// o ataque: agacha (o aviso, os olhos acendem mais), salta para a frente e desce as duas garras, pousa e volta.
// s de cada parte; avanco e altura do salto (m); quanto agacha (m); inclina = o quanto deita para a frente no golpe
// (rad); tranco = o empurrão do pouso no balanço (rad/s); olhos = o tamanho dos olhos acesos
export const ATAQUE = { aviso: 0.5, salto: 0.3, pouso: 0.16, volta: 0.45, avanco: 1.0, altura: 0.22, agacha: 0.11, inclina: 0.3, tranco: 0.5, olhos: 1.4 }

// tomar dano: o tranco no balanço (rad/s), os olhos apagados (s), o corpo amassa (quanto)
export const DANO = { tranco: 2.6, olhos: 0.18, amassa: 0.12, dura: 0.35 }

// os olhos piscam um de cada vez, fora de ordem: o intervalo (s, sorteado) e quanto dura uma piscada (s)
export const PISCAR = { intervalo: [1.2, 4.2], dura: 0.13 }
