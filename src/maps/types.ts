// O formato do mapa (versão 1). Um mapa é uma pasta em maps/<id>/ com:
//   map.json            o cabeçalho (nome, andares, onde o jogador nasce, a lista de blocos)
//   chunks/<cx>_<cz>.json  um arquivo por bloco de 16 × 16 m (cx, cz = índice do bloco)
// Tudo o que está no mapa pertence ao bloco do quadrado onde ele começa (a posição x, z arredondada para baixo).
// Unidades: metros; ângulos em graus; o eixo y é para cima; o andar 0 é o térreo.

export const GRID = 1 // as paredes ficam nas linhas desta grade (m)
export const SNAP_OBJ = 0.25 // os objetos encaixam a cada (m)
export const ROT_STEP = 15 // a rotação encaixa a cada (graus); com Shift, 45 e 90
export const LEVEL_H = 3.5 // a altura de cada andar (m), fixa por enquanto
export const CHUNK = 16 // o lado do bloco (m)

export type Vec3 = [number, number, number]
export type Axis = 'x' | 'z'

/** Um lado da parede: a textura de cima e, opcionalmente, a barra de baixo (lambri) com outra textura e altura. */
export interface WallSide {
  tex: string
  base?: { tex: string; h: number }
}

/** Um pedaço de parede de 1 m numa linha da grade: começa em (x, z) e vai 1 m no eixo. O lado "a" é o de -z (eixo x) ou -x (eixo z). */
export interface Wall {
  level: number
  x: number
  z: number
  axis: Axis
  a: WallSide
  b: WallSide
}

/** Um quadrado de piso: a face de cima é o chão deste andar; a de baixo é o teto do andar de baixo. */
export interface FloorTile {
  level: number
  x: number
  z: number
  top: string
  bottom: string
}

export type DoorKind = 'comum' | 'dupla' | 'grande' | 'vao'
export type WindowKind = 'normal' | 'grande'

/** Uma porta ou janela num pedaço de parede (a largura conta em pedaços de 1 m a partir dele, no mesmo eixo). */
export interface Opening {
  id: string
  level: number
  x: number
  z: number
  axis: Axis
  width: number
  kind: 'porta' | 'janela'
  door?: DoorKind
  window?: WindowKind
  tex?: string
  light2d?: boolean // janela: o feixe e a mancha de luz 2D
  // campos novos da etapa 4 (opcionais: mapa antigo sem eles continua valendo, com os padrões abaixo)
  lado?: 'a' | 'b' // porta: para que lado da parede a folha abre; janela: o lado de dentro (onde o luar cai). Padrão: 'b'
  estado?: DoorState // porta: como começa. Padrão: 'fechada'
  motivo?: string // porta trancada: a linha que aparece ao tentar abrir ("Trancada por dentro")
  chave?: string // porta trancada: o nome da chave que abre ("chave-bercario"); sem chave, só o script abre
}

export type DoorState = 'aberta' | 'fechada' | 'trancada'

/** Uma escada reta: a área na grade, para onde sobe e quanto sobe (um andar = LEVEL_H). */
export interface Stair {
  id: string
  level: number
  x: number
  z: number
  w: number
  d: number
  dir: 'norte' | 'sul' | 'leste' | 'oeste'
  rise: number
  tex: string
}

/** Um objeto do catálogo. Na grade: a rotação só em y, em passos; no modo livre: qualquer rotação (x, y, z). */
export interface Prop {
  id: string
  type: string
  level: number
  pos: Vec3
  rot: Vec3
  free?: boolean
  params?: Record<string, unknown> // ex.: lâmpada { modo: 'normal' | 'falhando' | 'apagada' }
}

/** Um detalhe colado numa superfície: quadro, sujeira, mancha. */
export interface Decal {
  id: string
  type: string
  level: number
  pos: Vec3
  normal: Vec3
  rot: number
  size: [number, number]
}

/** Reservado para os scripts (gatilhos, cenas, nascimento de monstros): vêm depois do mapa. */
export interface ScriptPoint {
  id: string
  kind: string
  level: number
  pos: Vec3
  params?: Record<string, unknown>
}

export interface Chunk {
  cx: number
  cz: number
  walls: Wall[]
  floors: FloorTile[]
  openings: Opening[]
  stairs: Stair[]
  props: Prop[]
  decals: Decal[]
  points: ScriptPoint[]
}

export interface MapMeta {
  formato: 1
  id: string
  nome: string
  levels: number
  levelH: number
  chunkSize: number
  spawn: { pos: Vec3; yaw: number; level: number }
  chunks: string[] // "cx_cz" de cada bloco que existe
}

export const chunkKey = (cx: number, cz: number) => `${cx}_${cz}`
export const chunkOf = (x: number, z: number): [number, number] => [Math.floor(x / CHUNK), Math.floor(z / CHUNK)]
export const emptyChunk = (cx: number, cz: number): Chunk => ({ cx, cz, walls: [], floors: [], openings: [], stairs: [], props: [], decals: [], points: [] })
