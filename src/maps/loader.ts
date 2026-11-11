// A pasta maps/: o jogo lê os cabeçalhos de todos os mapas de uma vez e carrega os blocos sob demanda.
import { cabecalhoAtual } from './formato'
import type { Chunk, MapMeta } from './types'

// os cabeçalhos como estão no disco, já convertidos para o formato de agora (formato.ts)
const crus = import.meta.glob<Record<string, unknown>>('/maps/*/map.json', { eager: true, import: 'default' })
const metas = Object.fromEntries(Object.entries(crus).map(([k, m]) => [k, { ...m, ...cabecalhoAtual(m) } as unknown as MapMeta]))
const chunkFiles = import.meta.glob<Chunk>('/maps/*/chunks/*.json', { import: 'default' })

// No npm run dev, salvar um mapa muda os arquivos de maps/ e o Vite recarregaria tudo o que depende deste arquivo
// (o editor inteiro, no meio da edição). O editor lê e grava pela API (storage.ts), então a mudança para aqui.
if (import.meta.hot) import.meta.hot.accept()

/** Todos os mapas da pasta maps/, pelo nome. */
export function listMaps(): MapMeta[] {
  return Object.values(metas).sort((a, b) => a.nome.localeCompare(b.nome))
}

export function getMap(id: string): MapMeta | undefined {
  return metas[`/maps/${id}/map.json`]
}

/** Um bloco (ou undefined se ele não existe: área vazia). */
export async function loadChunk(id: string, key: string): Promise<Chunk | undefined> {
  const f = chunkFiles[`/maps/${id}/chunks/${key}.json`]
  return f ? f() : undefined
}

/** Os blocos num raio (em blocos) em volta de um ponto: o que o jogo mantém carregado perto do jogador. */
export function chunksAround(meta: MapMeta, x: number, z: number, radius: number): string[] {
  const cx = Math.floor(x / meta.chunkSize), cz = Math.floor(z / meta.chunkSize), out: string[] = []
  for (let i = -radius; i <= radius; i++) for (let j = -radius; j <= radius; j++) { const k = `${cx + i}_${cz + j}`; if (meta.chunks.includes(k)) out.push(k) }
  return out
}
