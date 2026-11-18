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
}

/** O kind dos pontos de entidade no mapa. */
export const KIND_ENTIDADE = 'entidade'
