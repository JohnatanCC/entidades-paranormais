// Os números do Mestre (docs/cap2-sombra.md). Por enquanto só o que o modelo parado usa: o manto, o parado e a fumaça.
import type { ConfigMolas } from '../../corpo/molas'
import { TREMOR } from '../../player/numeros'

// o manto: as três camadas de tiras (manto_1_*, manto_2_*, manto_3_*); abre para fora, quase nada para dentro do corpo
export const MANTO: ConfigMolas = { mola: 24, amortece: 3.6, tranco: 0.6, trancoMax: 25, solto: 0.8, preso: 0.04, zona: { tras: -0.05, frente: 0.05, lado: 0.05 } }
// as partes soltas (mecha_*): as mangas de penas e a ponta do capuz, mais leves
export const SOLTAS: ConfigMolas = { mola: 20, amortece: 2.8, tranco: 0.7, trancoMax: 30, solto: 1.1, preso: 0.25, zona: { tras: -0.05, frente: 0.05, lado: 0.05 } }

// o ar no manto: a brisa (m/s², gira devagar e vem em rajadas) e o arrasto de quem anda (m/s² por m/s: o manto fica para trás)
export const AR = { brisa: 0.5, rajada: 1.6, gira: 0.31, ritmo: 0.73, arrasto: 2.1, maximo: 6 }

// ele não anda: levita (decidido em 17/nov). altura = o quanto o corpo fica acima do chão (m); sobe = o sobe e desce (m, a
// cada `periodo` s); inclina = o quanto deita para a frente por m/s (rad, até `maxInclina`); deita = de lado nas curvas;
// as pernas pendem soltas (rad: a coxa, a canela, o tarso, o pé com as garras para baixo), balançam de leve (`balanca`)
// e ficam para trás com a velocidade (`ficam`, rad por m/s); os braços também (`bracos`)
export const LEVITA = {
  altura: 0.42, sobe: 0.05, periodo: 3.4, inclina: 0.085, maxInclina: 0.38, deita: 0.07,
  pernas: { coxa: 0.12, canela: -0.18, tarso: 0.4, pe: 0.85, balanca: 0.07, ficam: 0.13 }, bracos: 0.09,
}

// o grito, quando ele avista o agente (docs/cap2-sombra.md): o aviso (s: trava, recolhe o corpo e a cabeça tomba), o
// grito (s: o corpo vai para a frente, o bico abre, o manto e os braços abrem de uma vez e vibram) e o manto fechando
// (s). recolhe e avanca = o peito (rad); abre = o quanto as tiras do manto abrem (rad; as da frente, mais); bracos =
// para os lados (rad); bico = o quanto abre (rad); sai = em que momento do grito o corvo sai (s); o tremor da tela
export const GRITO = {
  aviso: 0.6, grita: 1.2, fecha: 0.8,
  recolhe: 0.2, avanca: 0.3, cabeca: 0.3, abre: 0.7, bracos: 0.9, bico: 0.55, vibra: 0.035, sai: 0.18,
  tremor: { forca: TREMOR.forte, dura: 1.2 },
  repete: 20, // s: de quanto em quanto tempo ele pode gritar de novo na caçada (ponto de partida)
}

// o corvo gigante de sombra que sai do manto no grito: o tamanho (vezes a Gralha), a cor (multiplica a textura), a
// velocidade (m/s; acelera nos primeiros `acelera` s), quanto dura (s) até explodir, a altura de onde sai (m), quantas
// Gralhas solta e com que empurrão (m/s) elas saem da explosão; não fere
export const CORVO = { escala: 2.6, cor: '#3a2f52', vel: 15, acelera: 0.25, dura: 2, altura: 1.55, gralhas: 3, espalha: 3.5, tremor: TREMOR.medio }

// parado: a respiração (o peito, rad, a cada `periodo` s), o balanço do corpo (rad) e os tiques da cabeça, de ave: de
// tempos em tempos (s, sorteado) ela vira de uma vez (em `vira` s) para um lado (rad: girar, tombar, baixar) e fica
export const PARADO = {
  respira: { periodo: 4.4, peito: 0.022 },
  balanco: { periodo: 7.3, corpo: 0.012 },
  tique: { espera: [1.6, 4.5], vira: 0.09, girar: 0.4, tombar: 0.28, baixar: 0.12 },
}

// a fumaça escura dentro do manto: as nuvens sobem do chão por dentro dele e somem na altura da cintura; uma parte
// escorre pelo chão, por baixo da barra
export const FUMACA = {
  nuvens: 44, cor: '#050408',
  alto: 1.55, // m: até onde sobe (ele levita: a coluna de fumaça vai do chão até a cintura)
  raio: [0.42, 0.2], // m: o raio do manto por dentro, no chão e no alto
  sobe: [0.1, 0.26], gira: 0.5, // m/s; rad/s em volta do corpo
  vida: [2.6, 4.6], entra: 0.6, sai: 1.1, // s
  tamanho: [0.3, 0.52], cresce: 1.35, // m; quanto cresce até sumir
  forca: [0.5, 0.8], // a opacidade no auge
  rasteira: 0.18, // a parte das nuvens que escorre pelo chão (maiores, mais fracas)
  escorre: 0.08, // m/s para fora
  fica: 0.9, // quanto da fumaça fica para trás quando ele anda (1 = toda)
}
