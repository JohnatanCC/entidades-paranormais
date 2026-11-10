// Os números da Mãe (o modelo e o corpo; a luta, as barras e os ataques entram com a etapa dela). Mexa aqui para ajustar.
import type { ConfigMolas } from '../../corpo/molas'

// a saia: dez painéis em dois pedaços, pesados de pano molhado; abrem para fora, quase nada para dentro (as pernas)
export const SAIA: ConfigMolas = { mola: 30, amortece: 4.5, tranco: 0.55, trancoMax: 25, solto: 0.75, preso: 0.05, zona: { tras: -0.06, frente: 0.06, lado: 0.06 } }
// o cabelo molhado: mais pesado e mais lento que o do Matheus
export const CABELO_MAE: ConfigMolas = { mola: 28, amortece: 4, tranco: 0.5, trancoMax: 30, solto: 0.8, preso: 0.08, zona: { tras: -0.07, frente: 0.08, lado: 0.1 } }
// os movimentos (animacao.ts): rate = a dureza da pose (a frequência das molas: mais = mais seca)
export const MOV = {
  parada: { rate: 8 }, // curvada, balançando, a cabeça tombada procurando, as garras abertas meio caídas
  andar: { rate: 10, passo: 4.2, pernas: 0.3, joelho: 0.45, saia: 1.3, saiaPonta: 0.6 }, // passo = rad de passada por metro; o quanto as pernas vão e o joelho dobra;
  //   saia = o quanto o painel acompanha a coxa (o da frente para a frente, o de trás para trás); saiaPonta = a parte de baixo, a mais
  porta: { rate: 9, abaixa: 0.14, curva: 0.4, olha: 0.6 }, // passando pela porta: o quadril desce (m), o tronco curva e a cabeça levanta (rad)
  estalo: { chance: 0.45, dura: 0.18, giro: -0.55, volta: 14 }, // parada, a cabeça estala de lado de repente (por s; s; rad; quão rápido volta)
}

// os ataques (golpes.ts), com os números da fase 1 do laboratório (tabela T.mae): a luta muda por fase depois
export const GOLPE = {
  garra: { preparo: 0.42, corte: 0.37, ultima: 0.59, bote: 5.5, rate: 30 }, // ergue o braço (s), corta (s; a última garrada fica mais), o passo do golpe (m/s)
  aproximar: { dur: 1.6, arranque: 5.0, tranco: 0.16, perto: 1.05, rate: 18 }, // aos trancos (m/s; s por tranco) até ficar a 1 m
  investida: { dur: 1.3, alcance: 9, fundo: 2.0, sobe: 0.3, voo: 0.62, rate: 26 }, // sai de baixo (m de fundo, s para subir) e voa baixo (s) até perto
  carga: { prepara: 0.75, corre: 1.15, derrapa: 0.5, vel: 8.6, perto: 0.95, rate: 18 }, // agacha e guincha; corre em linha reta (m/s); derrapa
}
