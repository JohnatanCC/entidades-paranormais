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

// o Luto (golpes.ts, luto.ts): ela mergulha, sai, finge que sai; o aviso é o chão estufando onde ela vai sair
export const LUTO = {
  mergulhar: { dur: 1.05, fundo: 4.2, rate: 16 }, // afunda em pé, os braços erguidos somem por último
  finta: { dur: 1.2, rate: 18 }, // surge até o peito, guincha e afunda de novo
  surgir: { espera: 2.2, dur: 4.25, rate: 9 }, // a apresentação: bolhas por `espera` s, depois sobe (s)
  aviso: { dur: 2.0, rate: 8 }, // por baixo: o chão estufa, borbulha e brilha vermelho (s; na fase 1)
}

// os estados (estados.ts): durações (s) e durezas do laboratório; a capturada dura até a armadilha terminar (aqui, `dur`)
export const ESTADO = {
  grito: { dur: 1.8, rate: 12 }, // braços abertos, cabeça para trás (chama o tornado)
  exausta: { dur: 1.3, rate: 7 }, // depois dos ataques: curvada, ofegando, braços pendurados (a janela para atirar)
  atordoada: { dur: 6, rate: 12 }, // barra zerada: grita, cai de joelhos e segura a cabeça; o Luto escorre dos olhos
  cambaleio: { dur: 3, rate: 14, recua: 0.85 }, // muito dano de uma vez: recua (m) com a mão no rosto
  enfraquecida: { dur: 12, rate: 6 }, // a última barra zerada: de joelhos, quase apagada, balançando (a hora da armadilha)
  levanta: { dur: 1.3, rate: 9 }, // a armadilha não veio a tempo: levanta estalando
  capturada: { dur: 4, rate: 22 }, // presa nos raios da armadilha: se debate
  joelhos: { quadril: -0.58 }, // de joelhos: quanto o quadril desce (m; as canelas deitam no chão)
}
