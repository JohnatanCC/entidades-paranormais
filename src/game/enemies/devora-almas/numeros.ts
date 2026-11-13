// Os números do Devora almas (docs/demonios.md): o corpo, os movimentos e os efeitos do nado. A luta (vida, o dano de
// dentro dele, a gosma deixando lento, quando ele ataca) entra com a etapa dela. Mexa aqui para ajustar.
import type { ConfigMolas } from '../../corpo/molas'

// o tamanho no jogo: o modelo do Blockbench (3,3 m de comprimento) vezes isto (decidido em 12/nov: 3 vezes maior, para
// uma arena grande). Tudo o que é medida (as alturas, o salto, o avanço, o tranco, os efeitos no chão) já vem
// multiplicado aqui embaixo; mudando este número, o resto acompanha.
export const ESCALA = 3
const E = ESCALA

// o manto vermelho em volta da junção: pano pesado
export const MANTO: ConfigMolas = { mola: 24, amortece: 3.4, tranco: 0.6, trancoMax: 30, solto: 1.0, preso: 0.25, zona: { tras: -0.2, frente: 0.2, lado: 0.05 } }

// as alturas do root (o meio do corpo), em m: fora do chão, parado (para ver o modelo); nadando (só os tentáculos das
// costas passam do chão); lá no fundo, em pé, pronto para o salto; deitado no chão (exposto, engolindo); e quanto ele
// sobe e desce boiando (fora do chão e nadando)
export const ALTURA = { solto: 0.75 * E, nado: -0.5 * E, fundo: -1.5 * E, chao: 0.42 * E, boia: 0.04 * E, boiaNado: 0.02 * E }

// quanto dura cada movimento (s)
export const TEMPO = { mergulho: 0.9, emergir: 1.0, marca: 1.0, salto: 1.0, exposto: 3.5, engolindo: 3.0, cuspe: 0.7 }

// o salto: a altura do meio do corpo no alto (m); em que parte do salto ele chega lá em cima e morde; quando pousa; o
// quique do pouso (m)
export const SALTO = { altura: 1.5 * E, alto: 0.42, mordida: 0.43, pousa: 0.78, quique: 0.08 * E }

// entrando e saindo do chão: o quanto ele avança (m/s, no meio do movimento) e o arco (m: o mergulho afunda além, o
// emergir passa acima antes de assentar)
export const CHAO = { mergulho: 1.6 * E, emergir: 1.2 * E, arcoMergulho: 0.4 * E, arcoEmergir: 0.35 * E }

// a investida rasante: a mira (s; a curta é a segunda investida seguida, na fase 3), a disparada (m/s, s), o quanto
// ele sobe para as costas rasgarem o chão (m), a freada (s); o aviso no chão à frente (o comprimento, m, e a largura);
// o rasgo: os espinhos que sobem atrás (a cada quantos m, a altura, quanto ficam, quanto levam subindo e descendo)
export const INVESTIDA = {
  mira: 1.0, miraCurta: 0.55, vel: 14, dura: 1.1, costas: 0.2 * E, freia: 0.8,
  aviso: { comprimento: 14, largura: 0.5 * E },
  rasgo: { passo: 0.9, alto: 0.35 * E, fica: 1.0, sobe: 0.12, desce: 0.35 },
}
// a chuva de tentáculos: ele afunda (s); os círculos acendem um depois do outro (s entre eles); cada um avisa (s) e o
// tentáculo sobe, fica batendo e volta (s); o tamanho do tentáculo (m) e o raio do círculo (m)
export const CHUVA = { afunda: 0.6, intervalo: 0.45, aviso: 0.75, sobe: 0.22, fica: 0.45, desce: 0.45, altura: 4.5, grossura: 0.55, raio: 1.3 }
// cuspir Assombrados: sobe meio corpo para fora do chão (s), cospe nestes instantes (s; quantos ele cospe é quem pede,
// até 3), dura (s); a altura do root com o corpo meio para fora (m) e o quanto a cabeça aponta para cima (rad: como uma
// cobra que se ergue); para onde eles vão (m à frente, sorteado)
// asa = qual dos cuspidos é uma Asa sombria em vez de um Assombrado (o terceiro, decidido em 12/nov): ela sai voando
export const NINHADA = { sobe: 0.7, cospe: [0.9, 1.25, 1.6], dura: 2.4, altura: -0.03 * E, ergue: 0.95, alcance: [5, 9], asa: 2 }
// as fases são as 3 barras de vida (decidido em 12/nov): o quanto o que brilha (as rachaduras, os olhos, a boca) acende
// em cada uma
export const FASES = { brilho: [1, 1.4, 1.9] }
// atordoado (muito dano de uma vez, e toda vez que uma barra zera): é arrancado do chão (s), cai de lado (rad), fica tonto com o
// brilho falhando (o quanto ele apaga) e se desvira (s); o total (s). Depois rasteja.
export const ATORDOADO = { dura: 3.5, sai: 0.5, deita: 1.15, apaga: 0.75, desvira: 0.6 }
// rastejando (depois de atordoado, ou cansado): se arrasta devagar pela superfície, puxando com os tentáculos (a janela
// para atirar): quanto dura (s), a velocidade (m/s, no meio de cada puxada), puxadas por segundo, o quanto a barriga
// arrasta abaixo da altura de deitado (m)
export const RASTEJO = { dura: 4.5, vel: 0.9, puxadas: 0.8, arrasta: 0.1 * E }

// a boca: o quanto a mandíbula abre no salto e no cuspe (rad); parado, ela respira entreaberta (os dentes aparecem)
export const BOCA = { abre: 1.1, cospe: 1.2, respira: 0.12 }

// nadando: o corpo ondula de lado (rad) nessa frequência (por s), mais forte quanto mais rápido. O rumo (nado.ts): a
// velocidade (m/s), quanto ele acelera e freia (m/s²), o raio mínimo da curva (m), o giro parado (rad/s, virando no
// lugar) e quão rápido o giro muda (rad/s²); nas curvas fechadas ele perde velocidade. Na curva (animacao.ts), por rad/s
// de giro: o quanto o corpo deita para dentro, a cabeça vai na frente e os tentáculos de trás ficam para trás
export const NADO = { ondula: 0.12, freq: 6, vel: 4, acelera: 3, freia: 5, raio: 1.5 * E, giroParado: 0.7, giroAcel: 2.2, deita: 0.18, cabeca: 0.1, cauda: 0.14 }

// os tentáculos (rad): a onda de parado, o nado (todos juntos, de lado), abertos no salto, se debatendo (exposto)
export const TENTACULOS = { onda: 0.18, nado: 0.32, abre: 0.9, debate: 0.6, contorce: 0.35, suave: 10 }

// tomar dano: o tranco (rad/s) e quanto dura a mordida no ar (s)
export const DANO = { tranco: 2.2, dura: 0.3 }
export const BALANCO = { mola: 30, amortece: 4 }

// os efeitos no chão (efeitos.ts): a gosma do rastro (a cada quantos s, quanto fica, quanto leva sumindo, o tamanho,
// o quanto escurece); a marca de mordida (o raio, m); a mancha embaixo dele nadando (m); os espinhos baixos que ondulam
// atrás dele (quantos, a distância entre eles, a altura, a grossura); o respingo quando ele passa pelo chão e o estouro
// (o raio, m, e o tamanho dos cubos)
export const GOSMA = { intervalo: 0.12, dura: 3, some: 0.8, tamanho: [0.7 * E, 1.0 * E], forca: 0.7 }
export const MARCA = { raio: 1.5 * E }
export const MANCHA = { largura: 1.1 * E, comprimento: 2.6 * E }
export const ESPINHOS = { n: 8, passo: 0.3 * E, alto: 0.1 * E, grossura: E, comeca: 0.5 * E, lado: 0.14 * E }
export const RESPINGO = { raio: 0.45 * E, estouro: 0.9 * E, cubos: Math.min(1, E / 1.5) }

// a luta (ia.ts; docs/demonios.md, "A luta do Devora almas"): é o chefe do tutorial, com pouco dano.
//   rodeia = s nadando em volta do agente antes de cada ataque (sorteado), a esta distância (m); chega = perto o
//   bastante de um ponto (m); a investida começa de `longe` m e acerta quem estiver a `acerto` m dele; o tentáculo da
//   chuva acerta quem estiver dentro do círculo; engolido: 20/s e, cuspido, a gosma (lento por `dura` s); o rastro de
//   gosma deixa lento enquanto pisa; depois de `cansa` ataques, rasteja (a janela para atirar); quanto cada ataque
//   aparece em cada barra de vida (as fases)
export const LUTA = {
  rodeia: [2.5, 4], roda: 9, chega: 1.2, solto: 1.5, marca: 5, tempoIndo: 6,
  // a vida (as 3 barras dividem); o corpo preto leva só esta parte do dano (a boca aberta leva cheio); embaixo do chão,
  // nada; levando `atordoa.dano` em pouco tempo (some em `atordoa.some` s), fica tonto (no máximo a cada `atordoa.espera` s)
  vida: 500, corpo: 0.5, atordoa: { dano: 60, some: 1, espera: 8 },
  investida: { dano: 20, longe: 11, acerto: 2.4 },
  tentaculo: { dano: 12 },
  engolido: { porSegundo: 20, lento: 0.2, dura: 4 },
  rastro: { lento: 0.2 },
  cansa: 3,
  pesos: { 1: { marca: 1, investida: 1, chuva: 0, ninhada: 0 }, 2: { marca: 1, investida: 1, chuva: 1, ninhada: 0.8 }, 3: { marca: 0.8, investida: 1.2, chuva: 1.2, ninhada: 1 } } as Record<number, Record<'marca' | 'investida' | 'chuva' | 'ninhada', number>>,
}
