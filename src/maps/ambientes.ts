// O catálogo das ambientações: a luz de cada tipo de lugar, pelo nome (o mapa guarda só o nome, como textura e objeto).
// O mapa tem uma ambientação padrão e áreas retangulares com outra (types.ts: MapMeta.ambiente e MapMeta.areas); o jogo
// troca suave de uma para a outra quando o agente passa (game/luz). Para ajustar o clima de um lugar, mude os números aqui.
// A regra do jogo: a cena é sempre legível (ação, não breu). O terror vem do contraste: as poças de luz quente das
// lâmpadas e o luar frio das janelas contra os cantos escuros. Por isso nenhuma ambientação tem a luz ambiente em zero.
//
// As forças são as do three (a luz ambiente perto de 1 já clareia tudo; as lâmpadas do mapa têm força 2 a 7).
// As cores do "tom" multiplicam a imagem pronta: branco não muda nada; puxe pouco (um tom forte lava as texturas).

export interface Ambiente {
  nome: string // como aparece no editor
  cor: string // a cor da área no editor
  // a neblina: esconde o fundo e dá profundidade (o que está longe puxa para a cor dela); a cor é também a do "céu"
  neblina: string
  densidade: number // 0 = sem neblina; 0,03 já some com o que está a ~40 m
  // a luz ambiente: de cima (o céu, o teto) e de baixo (o que o chão devolve)
  ceu: string
  chao: string
  forca: number
  // o preenchimento: uma luz fraca que vem de trás da câmera, para o que o jogador olha nunca ficar chapado
  preenchimento: string
  forcaPreenchimento: number
  // o luar direto, de cima (fora de casa; dentro, o luar entra só pelas janelas)
  luar: string
  forcaLuar: number
  // o contorno de luz dos personagens (o agente e os fantasmas): as faces de lado para a câmera acendem um pouco
  contorno: string
  forcaContorno: number
  exposicao: number // o quanto a imagem toda clareia antes do tonemapping (1 = normal)
  brilho: number // o bloom: o quanto o que é claro vaza em volta (0 = nada; só no Médio e no Alto)
  // a correção de cor (só com o passe final: Médio e Alto)
  sombras: string // o tom das partes escuras
  luzes: string // o tom das partes claras
  contraste: number // 1 = normal
  saturacao: number // 1 = normal; menos = mais cinza
  vinheta: number // 0 a 1: o quanto os cantos da tela escurecem
}

export const AMBIENTES: Record<string, Ambiente> = {
  // dentro da mansão: escuro e quente, o âmbar das lâmpadas manda; o preenchimento frio separa o que não tem lâmpada
  mansao: {
    nome: 'Mansão (interior)', cor: '#e0a050',
    neblina: '#0d0b0e', densidade: 0.03,
    ceu: '#a79cc0', chao: '#4a3828', forca: 2.6,
    preenchimento: '#9fb0d8', forcaPreenchimento: 1.2,
    luar: '#9fb8e8', forcaLuar: 0,
    contorno: '#c8d4ff', forcaContorno: 0.9,
    exposicao: 1.3, brilho: 0.5,
    sombras: '#e2e8ff', luzes: '#fff2de', contraste: 1.1, saturacao: 1.05, vinheta: 0.4,
  },
  // corredores e lugares de passagem: mais fechado e mais frio, a neblina mais perto
  corredor: {
    nome: 'Corredor', cor: '#7f6fa8',
    neblina: '#08090d', densidade: 0.045,
    ceu: '#8a92b8', chao: '#34292a', forca: 3.3,
    preenchimento: '#8fa4d0', forcaPreenchimento: 1.4,
    luar: '#9fb8e8', forcaLuar: 0,
    contorno: '#c8d4ff', forcaContorno: 1.0,
    exposicao: 1.25, brilho: 0.6,
    sombras: '#dbe6ff', luzes: '#f4eee6', contraste: 1.14, saturacao: 0.9, vinheta: 0.55,
  },
  // fora de casa, à noite: o luar azul de cima, o horizonte que some na neblina
  exterior: {
    nome: 'Exterior (noite)', cor: '#6f9ae0',
    neblina: '#0e1626', densidade: 0.024,
    ceu: '#7f9fe0', chao: '#202a3a', forca: 2.8,
    preenchimento: '#8aa2d0', forcaPreenchimento: 0.8,
    luar: '#a9c2f0', forcaLuar: 2.4,
    contorno: '#d0dcff', forcaContorno: 0.8,
    exposicao: 1.25, brilho: 0.6,
    sombras: '#d6e2ff', luzes: '#eef3ff', contraste: 1.08, saturacao: 0.92, vinheta: 0.3,
  },
}

/** A ambientação de um mapa que não diz qual (os mapas do formato 1) e a de um nome que não existe no catálogo. */
export const AMBIENTE_PADRAO = 'mansao'
export const ambienteDe = (nome: string): Ambiente => AMBIENTES[nome] ?? AMBIENTES[AMBIENTE_PADRAO]

/** A troca suave entre duas ambientações: o tempo (s) para chegar a ~95% da nova. */
export const TROCA = 1.6

/**
 * Os momentos: uma mudança de luz por alguns segundos, por cima da ambientação do lugar (a Mãe chegando, um susto).
 * `muda` traz só o que o momento altera; entra, dura e sai são os tempos (s). O jogo chama momento('nome') (game/luz).
 */
export interface Momento { entra: number; dura: number; sai: number; muda: Partial<Omit<Ambiente, 'nome' | 'cor'>> }
export const MOMENTOS: Record<string, Momento> = {
  // a Mãe chegando: tudo esfria e perde a cor, a neblina fecha, os cantos da tela pesam, as luzes estouram
  'mae-chegando': {
    entra: 0.5, dura: 4, sai: 2.5,
    muda: { neblina: '#060a12', densidade: 0.08, ceu: '#5f78b0', forca: 1.5, forcaPreenchimento: 0.6, forcaContorno: 1.4, brilho: 1.2, sombras: '#c8d8ff', luzes: '#dfe8ff', saturacao: 0.45, contraste: 1.25, vinheta: 0.85 },
  },
}
