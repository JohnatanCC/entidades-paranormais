// Os números do roteiro da Demo · Intro (docs/intro.md), num lugar só. Mexa aqui para ajustar as hordas e os tempos.

/** As ondas de cada arena (a arena do chefe não tem: é o Devora almas). Decididas em 12/nov. */
export const ONDAS: Record<number, { assombrado: number; asa: number }[]> = {
  1: [{ assombrado: 3, asa: 0 }, { assombrado: 5, asa: 0 }],
  2: [{ assombrado: 4, asa: 1 }, { assombrado: 4, asa: 2 }],
}

export const TEMPO = {
  comeca: 2, // s depois de entrar na arena até a primeira onda
  entre: 2.5, // s entre uma onda e a outra (depois do último estouro)
  surge: 0.35, // s entre um demônio e o próximo da mesma onda (eles não aparecem todos juntos)
  some: 3, // s que um demônio estourado fica na cena (o som do estouro, a mancha) antes de sair
  chefeRonco: 1.8, // s em que o chão ronca (ele nadando embaixo) antes do Devora almas sair
  destroi: 0.08, // a tecla de teste: s entre um estouro e o próximo (a horda estoura em sequência)
}

/** Onde os demônios nascem: a distância mínima do agente (m) e a altura do voo da Asa sombria (m) e quanto ela leva para subir (s). */
export const NASCER = { longe: 4, asaAltura: 2, asaSobe: 0.9 }

/** Os demônios parados olham para o agente: quão rápido viram (por s). A luta de verdade (atrás dele) vem na etapa 3. */
export const OLHAR = 3

/** O tornado que fecha a arena: o raio que segura o agente (m), a altura e a largura do funil (m), quantos pedaços de
 *  matéria giram nele, quão rápido forma e desfaz (por s). */
export const TORNADO = { raio: 1.9, altura: 9, baixo: 0.7, alto: 2.6, pedacos: 180, forma: 1.4, desfaz: 0.9, gira: [2.2, 4.5] }

// As caixas de acerto (as meias medidas, m: x, y, z), alinhadas com o mundo e maiores que o corpo (12/nov: a mira não
// precisa ser exata). Vê-las: F4 (no npm run dev). O Devora já está na escala dele.
export const CAIXAS = {
  assombrado: [0.6, 0.7, 0.6],
  asa: [0.8, 0.55, 0.8], // as asas abertas
  devora: { boca: [1.1, 1.1, 1.1], corpo: [1.5, 1.3, 1.5], cauda: [1.2, 1.1, 1.2], tentaculo: [0.55, 0.55, 0.55] },
} as const
