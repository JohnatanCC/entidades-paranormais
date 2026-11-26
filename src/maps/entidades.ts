// O catálogo das entidades que o criador de mapas põe no cenário (a aba Entidades): cada uma é um ponto do mapa
// (ScriptPoint, kind 'entidade', params.tipo = o nome daqui) e o Testar dá vida a ela (game/entidades). O mapa guarda só
// o nome, como textura e objeto. vira: para onde ela olha quando nasce (graus, guardado em params.vira).
export interface DefEntidade {
  nome: string
  cor: string // a cor da marca no editor
  altura: number // m: a altura da marca (o tamanho dela)
  voa: boolean // a marca fica no ar (a Gralha nasce pousada, mas o ponto é onde ela fica)
  sobre: string // o que ela faz no Testar (aparece na gaveta)
}

export const ENTIDADES: Record<string, DefEntidade> = {
  mae: { nome: 'A Mãe', cor: '#c2453a', altura: 2.1, voa: false, sobre: 'Parada até ver o agente; grita e persegue, com a sequência de golpes' },
  mestre: { nome: 'O Mestre', cor: '#8a6ac8', altura: 2.4, voa: false, sobre: 'Levita; ao ver o agente grita e solta o corvo (3 Gralhas), persegue e morde' },
  gralha: { nome: 'Gralha', cor: '#6a6a7a', altura: 0.5, voa: true, sobre: 'Pousada até ver o agente; voa em volta dele e mergulha; morre com tiros' },
  'devora-espectros': { nome: 'Devora espectros', cor: '#7fd8ff', altura: 1.5, voa: false, sobre: 'O fantasma capturável: flutua parado até ver o agente; caça com o bote, a mordida e cospe espectrais. Zerado, fica fraco e volta' },
  caixa: { nome: 'Caixa de espectrais', cor: '#4cc3ff', altura: 0.4, voa: false, sobre: 'Invisível no jogo: o agente chegando perto, invoca um espectral (a Sombra ou a Asa). As cargas, a recarga e o máximo no painel' },
}

/** A caixa de espectrais (o jogo novo, docs/demonios.md): o que ela invoca, o raio que a ativa (m), quantos ao mesmo
 *  tempo (as cargas), em quanto tempo uma carga volta depois que o espectral morre (s), quantos ela invoca no total e se
 *  eles nascem aprimorados (o dobro da vida, mais dano, mais rápidos).
 *  Guardado no params do ponto; o que faltar vem daqui. */
export type MonstroCaixa = 'sombra' | 'asa'
/** O aprimorado (game/entidades/numeros.ts, APRIMORADO): sorte = a chance de sempre (5%); sempre; nunca. */
export type AprimoradoCaixa = 'sorte' | 'sempre' | 'nunca'
export interface Caixa { monstro: MonstroCaixa; raio: number; cargas: number; recarga: number; maximo: number; aprimorado: AprimoradoCaixa }
export const CAIXA: Caixa = { monstro: 'sombra', raio: 8, cargas: 1, recarga: 40, maximo: 5, aprimorado: 'sorte' }
export function caixaDe(params: Record<string, unknown> | undefined): Caixa {
  const n = (k: keyof Caixa) => (typeof params?.[k] === 'number' ? (params[k] as number) : (CAIXA[k] as number))
  const apr = params?.aprimorado
  return { monstro: params?.monstro === 'asa' ? 'asa' : 'sombra', raio: n('raio'), cargas: n('cargas'), recarga: n('recarga'), maximo: n('maximo'), aprimorado: apr === 'sempre' || apr === 'nunca' ? apr : 'sorte' }
}

/** O kind dos pontos de entidade no mapa. */
export const KIND_ENTIDADE = 'entidade'
