// O catálogo de texturas do cenário. O mapa guarda só o NOME ("papel-verde"); aqui fica o que cada nome é.
// O desenho é uma imagem de 32 × 32 px (um bloco de 1 m, como no Minecraft) em texturas/<nome>.png, pintada em pixel
// (desde 10/nov; antes era desenhada em código). Para repintar: abra o PNG no Blockbench ou num editor de pixel com o
// modo lado a lado (Piskel, LibreSprite) e salve por cima: a textura repete sem costura, o que sai de uma borda entra na outra.
//   usos: em que paletas ela aparece no editor (qualquer textura funciona em qualquer lugar)
//   cor: a cor de base (a amostra rápida e o plano B enquanto a imagem não chegou)
//   brilho: o quanto a superfície reflete a luz que bate nela (a etapa 5a da iluminação), de 0 (fosca: reboco, tapete,
//     grama) a 1 (polida: mármore, azulejo). Sem ele, vale BRILHO_PADRAO. Só as luzes de verdade fazem reflexo (o luar,
//     o preenchimento e as lâmpadas com sombra): no Baixo quase não aparece.
//   metal: a superfície é de metal (o reflexo pega a cor dela)

export type Uso = 'parede' | 'lambri' | 'piso' | 'teto'

export interface TexDef { nome: string; usos: Uso[]; cor: string; brilho?: number; metal?: boolean }

/** O brilho de uma textura que não diz o dela (quase fosca). */
export const BRILHO_PADRAO = 0.08

export const TEXTURAS: Record<string, TexDef> = {
  'reboco-creme':        { nome: 'Reboco creme', usos: ['parede'], cor: '#9a8f78' },
  'papel-verde':         { nome: 'Papel adamascado verde', usos: ['parede'], cor: '#2f4130', brilho: 0.12 },
  'papel-vinho':         { nome: 'Papel adamascado vinho', usos: ['parede'], cor: '#45191c', brilho: 0.12 },
  'papel-floral':        { nome: 'Papel floral desbotado', usos: ['parede'], cor: '#4c5642', brilho: 0.1 },
  'pedra':               { nome: 'Reboco riscado imitando pedra', usos: ['parede', 'piso'], cor: '#6c685f' },
  'fachada':             { nome: 'Fachada ocre', usos: ['parede'], cor: '#7a6a4e' },
  'azulejo-branco':      { nome: 'Azulejo branco 15 cm', usos: ['parede', 'lambri'], cor: '#bcbab0', brilho: 0.7 },
  'lambri-azulejo':      { nome: 'Azulejo azul e branco', usos: ['lambri', 'parede'], cor: '#c9c6bb', brilho: 0.7 },
  'bloco-concreto':      { nome: 'Bloco de concreto pintado', usos: ['parede'], cor: '#80887e', brilho: 0.15 },
  'concreto-aparente':   { nome: 'Concreto aparente', usos: ['parede'], cor: '#5c5a52' },
  'chapa-verde':         { nome: 'Chapa de aço rebitada', usos: ['parede'], cor: '#34413a', brilho: 0.45, metal: true },
  'tijolo':              { nome: 'Tijolo à vista', usos: ['parede'], cor: '#7a4a36' },
  'lambri-madeira':      { nome: 'Lambri de madeira almofadado', usos: ['lambri'], cor: '#21140b', brilho: 0.35 },
  'barra-madeira':       { nome: 'Barra de madeira lisa', usos: ['lambri'], cor: '#3a2a1c', brilho: 0.3 },
  'barra-verde':         { nome: 'Barra de bloco verde', usos: ['lambri'], cor: '#28463a', brilho: 0.25 },
  'taco-madeira':        { nome: 'Taco em espinha de peixe', usos: ['piso'], cor: '#523419', brilho: 0.4 },
  'tabua-corrida':       { nome: 'Tábua corrida escura', usos: ['piso', 'teto'], cor: '#36231a', brilho: 0.3 },
  'ladrilho-hidraulico': { nome: 'Ladrilho hidráulico', usos: ['piso'], cor: '#a2927a', brilho: 0.55 },
  'lajota':              { nome: 'Lajota de barro', usos: ['piso'], cor: '#5c3424', brilho: 0.25 },
  'marmore':             { nome: 'Mármore branco', usos: ['piso'], cor: '#b7b1a5', brilho: 0.75 },
  'ladrilho-xadrez':     { nome: 'Paviflex xadrez', usos: ['piso'], cor: '#6a5c46', brilho: 0.5 },
  'granilite':           { nome: 'Granilite', usos: ['piso'], cor: '#8a8272', brilho: 0.5 },
  'concreto':            { nome: 'Piso de concreto', usos: ['piso'], cor: '#4e4d48', brilho: 0.15 },
  'chapa-xadrez':        { nome: 'Chapa xadrez de aço', usos: ['piso'], cor: '#3c3e3e', brilho: 0.5, metal: true },
  'faixa-aviso':         { nome: 'Faixa de aviso', usos: ['piso'], cor: '#d0a020' },
  'carpete-vinho':       { nome: 'Carpete vinho', usos: ['piso'], cor: '#4d2427', brilho: 0 },
  'grama':               { nome: 'Grama', usos: ['piso'], cor: '#141a10', brilho: 0 },
  'cascalho':            { nome: 'Cascalho', usos: ['piso'], cor: '#3a362f', brilho: 0.05 },
  // o submundo (a Demo · Intro)
  'rocha-negra':         { nome: 'Rocha negra', usos: ['piso', 'parede'], cor: '#221e24', brilho: 0.1 },
  'chao-rachado':        { nome: 'Chão rachado (brasa)', usos: ['piso'], cor: '#2c2226', brilho: 0.1 },
  'cinza':               { nome: 'Cinza', usos: ['piso'], cor: '#342e30', brilho: 0 },
  'gesso':               { nome: 'Estuque manchado', usos: ['teto'], cor: '#86806f' },
  'forro-madeira':       { nome: 'Forro de madeira', usos: ['teto'], cor: '#36231a', brilho: 0.2 },
  'forro-placas':        { nome: 'Forro de placas', usos: ['teto'], cor: '#76726a' },
  'forro-escuro':        { nome: 'Forro escuro', usos: ['teto'], cor: '#34342f' },
  'forro-usina':         { nome: 'Laje da usina', usos: ['teto'], cor: '#1e1f1e' },
}

/** As texturas que aparecem na paleta de um uso, na ordem do catálogo. */
export const texturasPara = (uso: Uso) => Object.entries(TEXTURAS).filter(([, t]) => t.usos.includes(uso)).map(([k]) => k)

export const corDe = (tex: string | undefined) => (tex && TEXTURAS[tex]?.cor) || '#ff00ff' // magenta = textura que não existe
