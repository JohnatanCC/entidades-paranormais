// Salvar: grava o mapa na pasta maps/ pelo servidor de desenvolvimento (npm run dev). No jogo publicado não existe.
import type { Chunk, MapMeta } from './types'

export const canSave = import.meta.env.DEV

export async function saveMap(meta: Omit<MapMeta, 'chunks'>, chunks: Chunk[]): Promise<void> {
  if (!canSave) throw new Error('Salvar só funciona rodando no seu computador (npm run dev).')
  const body = { id: meta.id, meta, chunks: Object.fromEntries(chunks.filter((c) => !isEmpty(c)).map((c) => [`${c.cx}_${c.cz}`, c])) }
  const r = await fetch('/__maps/save', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
  const j = (await r.json()) as { ok: boolean; erro?: string }
  if (!j.ok) throw new Error(j.erro || 'falhou ao salvar')
}

const isEmpty = (c: Chunk) => !c.walls.length && !c.floors.length && !c.openings.length && !c.stairs.length && !c.props.length && !c.decals.length && !c.points.length
