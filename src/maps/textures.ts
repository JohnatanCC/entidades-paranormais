// O catálogo de texturas do cenário. Por enquanto cada uma é uma cor sólida (o que vale é o nome, que vai no mapa);
// as imagens de verdade entram depois em public/texturas/<nome>.png, com o mesmo nome, sem mudar os mapas.
export interface TexDef { nome: string; cor: string; uso: 'parede' | 'piso' | 'teto' | 'lambri' | 'porta' }

export const TEXTURAS: Record<string, TexDef> = {
  'reboco-creme': { nome: 'Reboco creme', cor: '#b9ab8e', uso: 'parede' },
  'papel-verde': { nome: 'Papel de parede verde', cor: '#55624a', uso: 'parede' },
  'papel-vinho': { nome: 'Papel de parede vinho', cor: '#6a3434', uso: 'parede' },
  'azulejo-branco': { nome: 'Azulejo branco', cor: '#c9c6bb', uso: 'parede' },
  'tijolo': { nome: 'Tijolo', cor: '#7a4a36', uso: 'parede' },
  'lambri-madeira': { nome: 'Lambri de madeira', cor: '#4a3322', uso: 'lambri' },
  'lambri-azulejo': { nome: 'Barra de azulejo', cor: '#7d8a86', uso: 'lambri' },
  'taco-madeira': { nome: 'Taco de madeira', cor: '#5a3e28', uso: 'piso' },
  'ladrilho-xadrez': { nome: 'Ladrilho xadrez', cor: '#8f8a80', uso: 'piso' },
  'pedra': { nome: 'Pedra', cor: '#5d5a54', uso: 'piso' },
  'carpete-vinho': { nome: 'Carpete vinho', cor: '#4d2427', uso: 'piso' },
  'gesso': { nome: 'Gesso', cor: '#a7a194', uso: 'teto' },
  'forro-madeira': { nome: 'Forro de madeira', cor: '#5b4330', uso: 'teto' },
  'porta-madeira': { nome: 'Porta de madeira', cor: '#3f2a1b', uso: 'porta' },
}

export const corDe = (tex: string | undefined) => (tex && TEXTURAS[tex]?.cor) || '#ff00ff' // magenta = textura que não existe
