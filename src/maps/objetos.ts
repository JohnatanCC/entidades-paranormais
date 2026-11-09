// O catálogo de objetos (móveis, máquinas e lâmpadas). O mapa guarda só o NOME do tipo ("guarda-roupa"); aqui fica o
// que cada um é, em dados: o tamanho (para escolher, encaixar e, no jogo, bater) e as peças (caixas, cilindros, esferas)
// com o material de cada uma. Sem three aqui: o editor e o jogo montam as malhas a partir destes dados.
// Os desenhos vêm do laboratório (reference/lab/07 "os móveis" e 08 "os móveis e as máquinas"), simplificados.
// Referencial: origem no centro da base do objeto; +z é a FRENTE (o lado que fica para a sala quando encosta na parede).

export type Forma = 'caixa' | 'cilindro' | 'esfera' | 'cone'
/** Uma peça: forma, tamanho (caixa: [w, h, d]; cilindro/cone: [raio em cima, raio embaixo, altura]; esfera: [raio]),
 *  posição do centro, rotação em graus (opcional) e o material (uma cor da paleta abaixo). */
export type Peca = [Forma, number[], [number, number, number], string, [number, number, number]?]

export type Grupo = 'casa' | 'intro' | 'luz'

export interface ObjDef {
  nome: string
  grupo: Grupo
  tam: [number, number, number] // largura (x), altura (y), profundidade (z), em metros
  apoio?: 'chao' | 'teto' // onde encosta (padrão: chão)
  pecas: Peca[]
  params?: Record<string, string[]> // as opções que o painel mostra (ex.: lâmpada: modo)
}

/** As cores dos materiais (como os FM / IF do laboratório). "luz:" no começo = brilha sozinha (não recebe luz). */
export const MATERIAIS: Record<string, string> = {
  madeira: '#3a2618', madeiraE: '#24170e', madeiraC: '#5a4230', folha: '#2e1d12',
  latao: '#6a5630', ferro: '#222224', veludo: '#3a1517', veludoV: '#1d2e22', lencol: '#8f8b80', panoPreto: '#0d0b0a',
  papel: '#b0a68c', cera: '#cbc1a4', cristal: '#56606c', branco: '#b8b6ac', marmore: '#b7b1a5',
  aco: '#4a5052', acoE: '#2e3234', armario: '#4c5a52', mesaI: '#7a7466', crt: '#b0a68c', tapete: '#3a1618', tapeteB: '#1c2230',
  'luz:tela': '#0e1612', 'luz:chama': '#ffcf8a', 'luz:lampada': '#ffd9a0', 'luz:apagada': '#3c3833',
}

const pernas = (w: number, d: number, h: number, s: number, m: string, recuo = 0.06): Peca[] =>
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => ['caixa', [s, h, s], [a * (w / 2 - recuo), h / 2, b * (d / 2 - recuo)], m] as Peca)

/** Um móvel coberto por lençol de poeira (o hCover do laboratório). */
const coberto = (w: number, h: number, d: number, encosto = 0): Peca[] => [
  ['caixa', [w, h * 0.9, d], [0, h * 0.45, 0], 'lencol'],
  ['caixa', [w + 0.07, h * 0.32, d + 0.07], [0, h * 0.16, 0], 'lencol'],
  ['caixa', [w * 0.92, 0.07, d * 0.9], [0, h * 0.92, 0], 'lencol'],
  ...(encosto ? [['caixa', [w * 0.96, encosto, d * 0.28], [0, h * 0.9 + encosto / 2, -d * 0.36], 'lencol'] as Peca] : []),
  ['caixa', [0.07, 0.1, 0.006], [w * 0.28, h * 0.62, d / 2 + 0.04], 'papel', [0, 0, 14]], // a etiqueta do leilão de 1931
]

const cadeira: Peca[] = [
  ['caixa', [0.46, 0.05, 0.44], [0, 0.46, 0], 'madeira'], ['caixa', [0.42, 0.06, 0.4], [0, 0.5, 0.01], 'veludo'],
  ...pernas(0.44, 0.42, 0.46, 0.04, 'madeira', 0.02),
  ['caixa', [0.045, 0.62, 0.045], [-0.2, 0.78, -0.2], 'madeira'], ['caixa', [0.045, 0.62, 0.045], [0.2, 0.78, -0.2], 'madeira'],
  ['caixa', [0.44, 0.09, 0.04], [0, 1.06, -0.2], 'madeira'], ['caixa', [0.3, 0.32, 0.025], [0, 0.78, -0.2], 'veludo'],
]

export const OBJETOS: Record<string, ObjDef> = {
  // --- a casa ---
  'cadeira': { nome: 'Cadeira', grupo: 'casa', tam: [0.5, 1.1, 0.5], pecas: cadeira },
  'cadeira-caida': { nome: 'Cadeira caída', grupo: 'casa', tam: [0.5, 0.5, 1.1], pecas: cadeira.map(([f, s, p, m, r]) => {
    // deitada de costas: gira −83° em x em volta da base (y → −z)
    const a = (-83 * Math.PI) / 180, y = p[1] * Math.cos(a) - p[2] * Math.sin(a), z = p[1] * Math.sin(a) + p[2] * Math.cos(a)
    return [f, s, [p[0], y + 0.42, z + 0.5], m, [(r?.[0] ?? 0) - 83, r?.[1] ?? 0, r?.[2] ?? 0]] as Peca
  }) },
  'guarda-roupa': { nome: 'Guarda-roupa', grupo: 'casa', tam: [1.75, 2.3, 0.68], pecas: [
    ['caixa', [1.65, 2.15, 0.62], [0, 1.12, 0], 'madeira'], ['caixa', [1.75, 0.12, 0.68], [0, 2.24, 0], 'madeiraE'],
    ['caixa', [0.1, 0.06, 0.1], [-0.75, 0.03, 0.25], 'madeiraE'], ['caixa', [0.1, 0.06, 0.1], [0.75, 0.03, 0.25], 'madeiraE'],
    ['caixa', [0.74, 1.8, 0.02], [-0.41, 1.15, 0.315], 'madeiraE'], ['caixa', [0.74, 1.8, 0.02], [0.41, 1.15, 0.315], 'madeiraE'],
    ['esfera', [0.02], [-0.05, 1.15, 0.33], 'latao'], ['esfera', [0.02], [0.05, 1.15, 0.33], 'latao'],
  ] },
  'aparador': { nome: 'Aparador', grupo: 'casa', tam: [1.5, 0.92, 0.46], pecas: [
    ['caixa', [1.5, 0.05, 0.46], [0, 0.88, 0], 'madeiraC'], ['caixa', [1.4, 0.5, 0.42], [0, 0.6, 0], 'madeira'],
    ...pernas(1.5, 0.46, 0.35, 0.06, 'madeiraE', 0.11),
    ['caixa', [0.6, 0.18, 0.02], [-0.35, 0.68, 0.215], 'madeiraE'], ['caixa', [0.6, 0.18, 0.02], [0.35, 0.68, 0.215], 'madeiraE'],
    ['esfera', [0.02], [-0.35, 0.68, 0.23], 'latao'], ['esfera', [0.02], [0.35, 0.68, 0.23], 'latao'],
  ] },
  'comoda-coberta': { nome: 'Cômoda coberta', grupo: 'casa', tam: [1.2, 0.95, 0.55], pecas: coberto(1.2, 0.95, 0.55) },
  'sofa-coberto': { nome: 'Sofá coberto', grupo: 'casa', tam: [2.0, 1.0, 0.9], pecas: coberto(2.0, 0.55, 0.9, 0.45) },
  'mesa-jantar': { nome: 'Mesa de jantar', grupo: 'casa', tam: [2.4, 0.78, 1.1], pecas: [
    ['caixa', [2.4, 0.06, 1.1], [0, 0.75, 0], 'madeira'], ['caixa', [2.2, 0.1, 0.9], [0, 0.67, 0], 'madeiraE'],
    ...pernas(2.4, 1.1, 0.72, 0.08, 'madeiraE', 0.12),
  ] },
  'cama-dossel': { nome: 'Cama de dossel', grupo: 'casa', tam: [1.7, 2.3, 2.2], pecas: [
    ['caixa', [1.6, 0.35, 2.1], [0, 0.35, 0], 'madeira'], ['caixa', [1.5, 0.22, 2.0], [0, 0.6, 0.02], 'branco'],
    ['caixa', [1.5, 0.12, 0.45], [0, 0.76, -0.75], 'branco'], ['caixa', [1.6, 0.9, 0.08], [0, 0.95, -1.05], 'madeiraE'],
    ...[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => ['caixa', [0.08, 2.3, 0.08], [a * 0.81, 1.15, b * 1.06], 'madeiraE'] as Peca),
    ['caixa', [1.7, 0.1, 2.2], [0, 2.25, 0], 'madeiraE'], ['caixa', [1.6, 0.5, 0.02], [0, 1.95, -1.07], 'veludo'],
  ] },
  'berco': { nome: 'Berço', grupo: 'casa', tam: [0.7, 1.0, 1.2], pecas: [
    ['caixa', [0.66, 0.1, 1.16], [0, 0.35, 0], 'madeiraC'], ['caixa', [0.6, 0.08, 1.1], [0, 0.43, 0], 'branco'],
    ...[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => ['caixa', [0.05, 1.0, 0.05], [a * 0.33, 0.5, b * 0.58], 'madeiraC'] as Peca),
    ['caixa', [0.7, 0.04, 0.04], [0, 0.92, -0.58], 'madeiraC'], ['caixa', [0.7, 0.04, 0.04], [0, 0.92, 0.58], 'madeiraC'],
    ['caixa', [0.04, 0.04, 1.2], [-0.33, 0.92, 0], 'madeiraC'], ['caixa', [0.04, 0.04, 1.2], [0.33, 0.92, 0], 'madeiraC'],
    ...[-0.4, -0.27, -0.13, 0, 0.13, 0.27, 0.4].flatMap((z) => [-1, 1].map((a) => ['caixa', [0.02, 0.5, 0.02], [a * 0.33, 0.66, z], 'madeiraC'] as Peca)),
  ] },
  'relogio-de-pe': { nome: 'Relógio de pé', grupo: 'casa', tam: [0.55, 2.1, 0.35], pecas: [
    ['caixa', [0.5, 1.6, 0.3], [0, 0.8, 0], 'madeira'], ['caixa', [0.55, 0.45, 0.35], [0, 1.82, 0], 'madeiraE'],
    ['cilindro', [0.16, 0.16, 0.02], [0, 1.82, 0.18], 'branco', [90, 0, 0]], ['caixa', [0.01, 0.12, 0.01], [0, 1.85, 0.2], 'ferro'],
    ['caixa', [0.3, 0.9, 0.01], [0, 0.85, 0.155], 'cristal'], ['esfera', [0.06], [0, 0.6, 0.12], 'latao'],
  ] },
  'espelho-coberto': { nome: 'Espelho coberto', grupo: 'casa', tam: [0.8, 1.9, 0.4], pecas: [
    ['caixa', [0.7, 1.6, 0.06], [0, 1.0, 0], 'madeiraE'], ['caixa', [0.76, 1.55, 0.05], [0, 1.05, 0.05], 'panoPreto'],
    ['caixa', [0.06, 0.2, 0.4], [-0.3, 0.1, 0], 'madeiraE'], ['caixa', [0.06, 0.2, 0.4], [0.3, 0.1, 0], 'madeiraE'],
  ] },
  'tapete': { nome: 'Tapete persa', grupo: 'casa', tam: [2.0, 0.02, 3.0], pecas: [
    ['caixa', [2.0, 0.012, 3.0], [0, 0.006, 0], 'tapete'], ['caixa', [1.6, 0.014, 2.6], [0, 0.007, 0], 'tapeteB'], ['caixa', [1.4, 0.016, 2.4], [0, 0.008, 0], 'tapete'],
  ] },
  'lamparina': { nome: 'Lamparina', grupo: 'casa', tam: [0.16, 0.45, 0.16], pecas: [
    ['cilindro', [0.055, 0.075, 0.035], [0, 0.018, 0], 'latao'], ['cilindro', [0.018, 0.03, 0.1], [0, 0.085, 0], 'latao'],
    ['esfera', [0.06], [0, 0.18, 0], 'latao'], ['cilindro', [0.03, 0.045, 0.2], [0, 0.34, 0], 'cristal'], ['esfera', [0.025], [0, 0.29, 0], 'luz:chama'],
  ] },
  // --- a Intro (a instalação da C.R.O.S.) ---
  'armario-aco': { nome: 'Armário de aço', grupo: 'intro', tam: [0.5, 1.9, 0.5], pecas: [
    ['caixa', [0.5, 1.9, 0.5], [0, 0.95, 0], 'armario'],
    ['caixa', [0.3, 0.02, 0.01], [0, 1.6, 0.255], 'acoE'], ['caixa', [0.3, 0.02, 0.01], [0, 1.68, 0.255], 'acoE'], ['caixa', [0.3, 0.02, 0.01], [0, 1.76, 0.255], 'acoE'],
    ['caixa', [0.03, 0.12, 0.03], [0.17, 1.0, 0.26], 'aco'],
  ] },
  'mesa-metal': { nome: 'Mesa de metal', grupo: 'intro', tam: [1.4, 0.76, 0.7], pecas: [
    ['caixa', [1.4, 0.04, 0.7], [0, 0.74, 0], 'mesaI'], ...pernas(1.4, 0.7, 0.72, 0.05, 'acoE', 0.08),
  ] },
  'caixa-madeira': { nome: 'Caixa de madeira', grupo: 'intro', tam: [0.8, 0.8, 0.8], pecas: [
    ['caixa', [0.8, 0.8, 0.8], [0, 0.4, 0], 'madeiraC'], ['caixa', [0.82, 0.06, 0.82], [0, 0.2, 0], 'madeiraE'], ['caixa', [0.82, 0.06, 0.82], [0, 0.6, 0], 'madeiraE'],
  ] },
  'banco': { nome: 'Banco', grupo: 'intro', tam: [1.6, 0.45, 0.4], pecas: [
    ['caixa', [1.6, 0.05, 0.4], [0, 0.425, 0], 'madeira'], ['caixa', [0.06, 0.4, 0.24], [-0.65, 0.2, 0], 'acoE'], ['caixa', [0.06, 0.4, 0.24], [0.65, 0.2, 0], 'acoE'],
  ] },
  'monitor': { nome: 'Monitor', grupo: 'intro', tam: [0.44, 0.4, 0.4], pecas: [
    ['caixa', [0.4, 0.34, 0.38], [0, 0.2, 0], 'crt'], ['caixa', [0.3, 0.24, 0.02], [0, 0.21, 0.19], 'luz:tela'], ['caixa', [0.44, 0.03, 0.18], [0, 0.015, 0.16], 'crt'],
  ] },
  // --- a luz ---
  'lampada-teto': { nome: 'Lâmpada de teto', grupo: 'luz', tam: [0.56, 0.32, 0.56], apoio: 'teto', params: { modo: ['normal', 'falhando', 'apagada'] }, pecas: [
    ['cilindro', [0.2, 0.28, 0.14], [0, -0.15, 0], 'ferro'], ['esfera', [0.09], [0, -0.25, 0], 'luz:lampada'], ['cilindro', [0.01, 0.01, 0.08], [0, -0.04, 0], 'ferro'],
  ] },
}

export const GRUPOS: [Grupo, string][] = [['casa', 'A casa'], ['intro', 'A Intro'], ['luz', 'Luz']]
