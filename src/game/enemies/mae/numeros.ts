// Os números da Mãe (o modelo e o corpo; a luta, as barras e os ataques entram com a etapa dela). Mexa aqui para ajustar.
import type { ConfigMolas } from '../../corpo/molas'

// a saia: dez painéis em dois pedaços, pesados de pano molhado; abrem para fora, quase nada para dentro (as pernas)
export const SAIA: ConfigMolas = { mola: 30, amortece: 4.5, tranco: 0.55, trancoMax: 25, solto: 0.75, preso: 0.05, zona: { tras: -0.06, frente: 0.06, lado: 0.06 } }
// o cabelo molhado: mais pesado e mais lento que o do Matheus. As mechas da frente e dos lados nascem ao lado do rosto
// (não na frente dele): giram para a frente e para trás sem entrar na cabeça, então nenhuma conta como "da frente"
// (frente: 0,5) e o limite é largo, para o cabelo pender de verdade com a cabeça caída para trás ou para a frente
// (andando, a força sozinha não passa de uns 60°); só as de trás não vão para dentro (preso), a não ser com o rosto
// virado para o chão (passa: a cabeça caída além de ~70°): aí elas caem por cima, sobre o rosto
export const CABELO_MAE: ConfigMolas = { mola: 28, amortece: 4, tranco: 0.5, trancoMax: 30, solto: 2.2, preso: 0.08, zona: { tras: -0.07, frente: 0.5, lado: 0.1 }, passa: 1.2 }
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
  // o grito (chama o tornado): puxa o ar (s), se joga para a frente olhando você, os braços para trás, e grita; uma onda
  // sai da boca a cada `onda` s; volta (s) à guarda no fim
  grito: { dur: 1.8, rate: 12, puxa: 0.32, onda: 0.11, volta: 0.38 },
  exausta: { dur: 1.3, rate: 7 }, // depois dos ataques: curvada, ofegando, braços pendurados (a janela para atirar)
  // barra zerada: o golpe, cai de joelhos, arqueia com a cabeça caída para trás (o Luto transbordando dos olhos); no fim a
  // cabeça estala de volta (estala: s antes do fim) e ela levanta (sobe: s)
  atordoada: { dur: 6, rate: 12, estala: 1.15, sobe: 0.95 },
  cambaleio: { dur: 3, rate: 14, recua: 0.85 }, // muito dano de uma vez: recua (m) com a mão no rosto
  enfraquecida: { dur: 12, rate: 6 }, // a última barra zerada: de joelhos, quase apagada, balançando (a hora da armadilha)
  levanta: { dur: 1.3, rate: 9 }, // a armadilha não veio a tempo: levanta estalando
  capturada: { dur: 4, rate: 22 }, // presa nos raios da armadilha: se debate
  joelhos: { quadril: -0.58 }, // de joelhos: quanto o quadril desce (m; as canelas deitam no chão)
}

// a voz dela (sons.ts): de quanto em quanto tempo (s, de–até, sorteado) cada som que se repete volta
export const SOM = {
  respira: [0.42, 0.67], respiraCorrendo: [0.3, 0.42], guincho: [2.4, 4.8], // caçando
  choroFraco: [1.6, 2.6], guinchoPresa: [0.45, 0.8], sussurro: [1.2, 2.6], // enfraquecida, capturada, fase 4
} as const

// os efeitos no corpo dela (efeitos.ts)
export const EFEITOS = {
  // as ondas do grito: a cor, a velocidade (m/s), quanto duram (s), o raio ao sair e no fim (m), a força (opacidade)
  onda: { cor: '#8e8e8e', vel: 3.2, dura: 0.6, r0: 0.08, r1: 0.95, forca: 0.6 },
  // a fase 4: o quanto o corpo fica preto (1 = todo; a conta é em luz linear: 0,985 dá ~6% de cinza na tela, o vulto
  // ainda se vê contra o claro), partículas por segundo, o tamanho delas (m), quanto sobem (m/s) e quanto vivem (s);
  // quanto tempo ela leva para escurecer (s)
  fase4: { preta: 0.985, particulas: 70, tamanho: 0.045, sobe: [0.3, 0.7], vida: [1.0, 1.8], escurece: 1.2 },
}
