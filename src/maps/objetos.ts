// O catálogo de objetos (móveis, máquinas e lâmpadas). O mapa guarda só o NOME do tipo ("guarda-roupa"); aqui fica o
// que cada um é, em dados: o nome na tela, o grupo do catálogo, o tamanho (para escolher, encaixar e, no jogo, bater)
// e o que ele tem de especial. A forma e a pintura vêm do modelo no Blockbench: modelos/objetos/<tipo>.bbmodel
// (decidido em 10/nov; 32 px por metro, como o cenário). Sem three aqui: o desenho é montado em render/objetos3d.ts.
// Referencial: origem no centro da base do objeto; +z é a FRENTE (o lado que fica para a sala quando encosta na parede).
import { LEVEL_H } from './types'

export type Grupo = 'casa' | 'intro' | 'luz'

export interface ObjDef {
  nome: string
  grupo: Grupo
  tam: [number, number, number] // largura (x), altura (y), profundidade (z), em metros (a caixa da colisão e da escolha)
  apoio?: 'chao' | 'teto' | 'parede' // onde encosta (padrão: chão; parede = preso na parede a ALTURA_PAREDE do chão)
  vazado?: boolean // dá para ver através (o guarda-corpo): bate no corpo, mas não empurra a câmera
  params?: Record<string, string[]> // as opções que o painel mostra (ex.: lâmpada: modo)
  /** Acende de verdade: uma luz pontual em pos (no referencial do objeto). Com o parâmetro modo: normal, falhando, apagada. */
  luz?: { pos: [number, number, number]; cor?: string; forca?: number; alcance?: number }
}

export const ALTURA_PAREDE = 1.8 // m: onde fica o que é preso na parede (a arandela)

/** A altura da base do objeto acima do chão do andar: no chão, no teto ou na parede. */
export const alturaApoio = (def?: ObjDef) => (def?.apoio === 'teto' ? LEVEL_H - 0.02 : def?.apoio === 'parede' ? ALTURA_PAREDE : 0)

const MODO = { modo: ['normal', 'falhando', 'apagada'] } // o modo de toda luz

/** As medidas do guarda-corpo (o objeto e o corrimão automático das escadas usam as mesmas, para se emendarem). */
export const GUARDA = { altura: 1.05, corrimao: 0.985, passo: 0.2 }

export const OBJETOS: Record<string, ObjDef> = {
  // --- a casa ---
  'cadeira': { nome: 'Cadeira', grupo: 'casa', tam: [0.5, 1.1, 0.5] },
  'cadeira-caida': { nome: 'Cadeira caída', grupo: 'casa', tam: [0.5, 0.5, 1.1] },
  'guarda-roupa': { nome: 'Guarda-roupa', grupo: 'casa', tam: [1.75, 2.3, 0.68] },
  'aparador': { nome: 'Aparador', grupo: 'casa', tam: [1.5, 0.92, 0.46] },
  'comoda-coberta': { nome: 'Cômoda coberta', grupo: 'casa', tam: [1.2, 0.95, 0.55] },
  'sofa-coberto': { nome: 'Sofá coberto', grupo: 'casa', tam: [2.0, 1.0, 0.9] },
  'mesa-jantar': { nome: 'Mesa de jantar', grupo: 'casa', tam: [2.4, 0.78, 1.1] },
  'cama-dossel': { nome: 'Cama de dossel', grupo: 'casa', tam: [1.7, 2.3, 2.2] },
  'berco': { nome: 'Berço', grupo: 'casa', tam: [0.7, 1.0, 1.2] },
  'relogio-de-pe': { nome: 'Relógio de pé', grupo: 'casa', tam: [0.55, 2.1, 0.35] },
  'espelho-coberto': { nome: 'Espelho coberto', grupo: 'casa', tam: [0.8, 1.9, 0.4] },
  'tapete': { nome: 'Tapete persa', grupo: 'casa', tam: [2.0, 0.02, 3.0] },
  // o guarda-corpo das bordas sem parede (o vão do salão, a galeria): em pedaços de 1, 2 e 4 m que se emendam
  'guarda-corpo-1': { nome: 'Guarda-corpo 1 m', grupo: 'casa', tam: [1, GUARDA.altura, 0.12], vazado: true },
  'guarda-corpo-2': { nome: 'Guarda-corpo 2 m', grupo: 'casa', tam: [2, GUARDA.altura, 0.12], vazado: true },
  'guarda-corpo-4': { nome: 'Guarda-corpo 4 m', grupo: 'casa', tam: [4, GUARDA.altura, 0.12], vazado: true },
  'piano': { nome: 'Piano', grupo: 'casa', tam: [1.56, 1.35, 0.62] },
  'poltrona-coberta': { nome: 'Poltrona coberta', grupo: 'casa', tam: [0.9, 1.0, 0.85] },
  'estante': { nome: 'Estante de livros', grupo: 'casa', tam: [1.26, 2.06, 0.42] },
  'mesa-cabeceira': { nome: 'Mesa de cabeceira', grupo: 'casa', tam: [0.5, 0.6, 0.4] },
  'penteadeira': { nome: 'Penteadeira', grupo: 'casa', tam: [1.1, 1.65, 0.5] },
  'bau': { nome: 'Baú', grupo: 'casa', tam: [1.04, 0.6, 0.6] },
  'cadeira-balanco': { nome: 'Cadeira de balanço', grupo: 'casa', tam: [0.6, 1.15, 0.9] },
  'mesa-pequena': { nome: 'Mesinha', grupo: 'casa', tam: [0.6, 0.75, 0.6] },
  'fogao-lenha': { nome: 'Fogão a lenha', grupo: 'casa', tam: [1.14, 2.15, 0.64] },
  'guarda-louca': { nome: 'Guarda-louça', grupo: 'casa', tam: [1.24, 1.95, 0.54] },
  'vaso-seco': { nome: 'Vaso com planta seca', grupo: 'casa', tam: [0.35, 0.9, 0.35] },
  // --- a Intro (a instalação da C.R.O.S.) ---
  'armario-aco': { nome: 'Armário de aço', grupo: 'intro', tam: [0.5, 1.9, 0.5] },
  'mesa-metal': { nome: 'Mesa de metal', grupo: 'intro', tam: [1.4, 0.76, 0.7] },
  'caixa-madeira': { nome: 'Caixa de madeira', grupo: 'intro', tam: [0.8, 0.8, 0.8] },
  'banco': { nome: 'Banco', grupo: 'intro', tam: [1.6, 0.45, 0.4] },
  'monitor': { nome: 'Monitor', grupo: 'intro', tam: [0.44, 0.4, 0.4] },
  // --- a luz ---
  'lampada-teto': { nome: 'Lâmpada de teto', grupo: 'luz', tam: [0.56, 0.32, 0.56], apoio: 'teto', params: MODO, luz: { pos: [0, -0.4, 0] } },
  'lustre': { nome: 'Lustre', grupo: 'luz', tam: [0.95, 0.62, 0.95], apoio: 'teto', params: MODO, luz: { pos: [0, -0.45, 0], forca: 7, alcance: 9 } },
  'arandela': { nome: 'Arandela (parede)', grupo: 'luz', tam: [0.14, 0.3, 0.18], apoio: 'parede', params: MODO, luz: { pos: [0, 0.2, 0.12], forca: 3.5, alcance: 5 } },
  'abajur': { nome: 'Abajur', grupo: 'luz', tam: [0.3, 0.5, 0.3], params: MODO, luz: { pos: [0, 0.34, 0], forca: 3, alcance: 5 } },
  'luminaria-pe': { nome: 'Luminária de pé', grupo: 'luz', tam: [0.45, 1.7, 0.45], params: MODO, luz: { pos: [0, 1.45, 0], forca: 4, alcance: 6 } },
  'castical': { nome: 'Castiçal', grupo: 'luz', tam: [0.36, 0.5, 0.12], params: MODO, luz: { pos: [0, 0.44, 0], cor: '#ffb060', forca: 2, alcance: 4 } },
  'lamparina': { nome: 'Lamparina', grupo: 'luz', tam: [0.16, 0.45, 0.16], params: MODO, luz: { pos: [0, 0.29, 0], cor: '#ffb060', forca: 1.5, alcance: 3.5 } },
}

export const GRUPOS: [Grupo, string][] = [['casa', 'A casa'], ['intro', 'A Intro'], ['luz', 'Luz']]
