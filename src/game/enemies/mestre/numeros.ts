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

// a corrida (caçando; ele levita depressa, não corre com os pés): mais baixo (altura, m), o sobe e desce mais curto e
// mais rápido (sobe, m; periodo, s), deitado para a frente (inclina, rad) com o peito arqueado de volta (arqueia) e a
// cabeça erguida (cabeca, rad); os braços para trás (bracos) e um pouco abertos (abre); as pernas esticadas atrás
// (pernas); o manto meio aberto, como asas (manto); entra = o quão depressa entra e sai da pose
export const CORRIDA = { altura: 0.3, sobe: 0.06, periodo: 1.1, inclina: 0.6, arqueia: 0.22, cabeca: -0.55, bracos: 1, abre: 0.3, pernas: 0.75, manto: 0.28, entra: 4, vel: 6 }

// a mordida, quando chega perto: o aviso (prepara, s: a cabeça recua, o bico abre, ele acende), o bote (s) e a volta
// (s); recolhe e avanca = o peito (rad); cabeca = [recuada, no bote] (rad); bico = o quanto abre (rad); investe = o
// quanto ele avança no bote (m/s); alcance e dano (pontos de partida: ajustar jogando)
export const MORDIDA = { prepara: 0.34, bote: 0.11, volta: 0.5, recolhe: 0.24, avanca: 0.5, cabeca: [-0.45, 0.5], bico: 0.75, investe: 7, alcance: 1.8, dano: 30 }

// a luz forte nele (a lamparina erguida): cobre-se e recua. entra e sai = o quão depressa (por s); encolhe = desce (m);
// curva = o peito (rad); cabeca = [baixar, virar o rosto] (rad); braco e antebraco = cruzados na frente do rosto (rad);
// cruza = para dentro (rad); manto = as tiras fechando (rad, negativo); treme (rad); recua (m/s); fumaca = o quanto ela
// engrossa (0 a 1)
export const COBRIR = { entra: 9, sai: 2.5, encolhe: 0.1, curva: 0.3, cabeca: [0.4, 0.6], braco: -0.7, antebraco: -1.45, cruza: 0.45, manto: -0.2, treme: 0.018, recua: 1.6, fumaca: 1 }

// o disfarce (uma entrada, para o futuro): ele aparece como um corvo pousado, mais robusto que as Gralhas (escala, vezes
// a Gralha; cor, multiplica a textura); espera = quanto fica assim (s); depois treme (rad) e cresce (cresce, s; incha,
// vezes) e estoura; altura = o corpo do corvo acima do chão (m, na escala 1); onde = a altura do estouro (m); o Mestre
// sai pequeno (de, vezes o tamanho dele) e cresce em `revela` s, com o manto aberto fechando em `fecha` s
export const DISFARCE = { escala: 1.7, cor: '#6a5a85', espera: 5, cresce: 0.8, incha: 1.7, treme: 0.07, altura: 0.27, onde: 0.9, de: 0.4, revela: 0.7, fecha: 1.3, tremor: TREMOR.medio }

// parado: a respiração (o peito, rad, a cada `periodo` s), o balanço do corpo (rad) e os tiques da cabeça, de ave: de
// tempos em tempos (s, sorteado) ela vira de uma vez (em `vira` s) para um lado (rad: girar, tombar, baixar) e fica
export const PARADO = {
  respira: { periodo: 4.4, peito: 0.022 },
  balanco: { periodo: 7.3, corpo: 0.012 },
  tique: { espera: [1.6, 4.5], vira: 0.09, girar: 0.4, tombar: 0.28, baixar: 0.12 },
}

// a fumaça escura dentro do manto, presa ao corpo (17/nov: não fica mais para trás quando ele anda): enche o manto do
// chão até os ombros; as nuvens nascem em toda a altura, sobem devagar girando e somem; acima da cintura ficam atrás
// da frente do corpo (`frente`, m), para as costelas e as mãos aparecerem; uma parte escorre pelo chão
export const FUMACA = {
  nuvens: 64, cor: '#050408',
  alto: 2.05, // m: até onde vai (os ombros, com a levitação)
  cintura: 1.4, frente: -0.02, // m
  raio: [0.42, 0.22], // m: o raio do manto por dentro, no chão e no alto
  sobe: [0.08, 0.22], gira: 0.5, // m/s; rad/s em volta do corpo
  vida: [2.4, 4.2], entra: 0.6, sai: 1, // s
  tamanho: [0.32, 0.55], cresce: 1.3, // m; quanto cresce até sumir
  forca: [0.55, 0.85], // a opacidade no auge
  rasteira: 0.1, // a parte das nuvens que escorre pelo chão (maiores, mais fracas)
  escorre: 0.07, // m/s para fora
}

// a falha quando a bala passa por ele (glitch.ts): dura = s; trocas = saltos por s; pulo = m de lado no começo; estica =
// o quanto a largura muda (fração); some = a chance de sumir num salto
export const GLITCH = { dura: 0.35, trocas: 22, pulo: 0.16, estica: 0.3, some: 0.2 }
