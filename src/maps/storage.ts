// Onde os mapas moram: a pasta maps/. Rodando no seu computador (npm run dev), o editor lê e grava pela API do
// servidor (tools/mapsDevApi.ts), sempre direto do disco. No jogo publicado só dá para ler o que entrou no build.
// O pacote (MapBundle) é o mapa inteiro num objeto só: é o que o Exportar baixa e o Importar lê.
import { AMBIENTE_PADRAO } from './ambientes'
import { cabecalhoAtual } from './formato'
import { getMap, listMaps, loadChunk } from './loader'
import { CHUNK, FORMATO, LEVEL_H, chunkKey, type Chunk, type MapMeta } from './types'

/** Gravar, copiar, apagar e importar só existem no npm run dev. */
export const podeGravar = import.meta.env.DEV

export interface MapInfo { id: string; nome: string; levels: number; blocos: number }
export interface MapBundle { formato: typeof FORMATO; meta: MapMeta; chunks: Chunk[] }

async function api<T>(url: string, body?: unknown): Promise<T> {
  const r = await fetch(url, body === undefined ? undefined : { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
  const j = (await r.json().catch(() => ({ ok: false, erro: `o servidor respondeu ${r.status}` }))) as { ok: boolean; erro?: string }
  if (!j.ok) throw new Error(j.erro || 'falhou')
  return j as T
}

export async function listar(): Promise<MapInfo[]> {
  if (podeGravar) return (await api<{ mapas: MapInfo[] }>('/__maps/list')).mapas
  return listMaps().map((m) => ({ id: m.id, nome: m.nome, levels: m.levels, blocos: m.chunks.length }))
}

export async function ler(id: string): Promise<MapBundle> {
  if (podeGravar) return validar((await api<{ mapa: unknown }>(`/__maps/read?id=${encodeURIComponent(id)}`)).mapa)
  const meta = getMap(id)
  if (!meta) throw new Error(`O mapa "${id}" não existe.`)
  const cs = await Promise.all(meta.chunks.map((k) => loadChunk(id, k)))
  return validar({ formato: meta.formato, meta, chunks: cs.filter(Boolean) })
}

/** Grava o mapa em maps/<id>/. Com criar, falha se já existir um mapa com esse id (nunca sobrescreve sem querer). */
export async function salvar(b: MapBundle, opt: { criar?: boolean } = {}): Promise<void> {
  if (!podeGravar) throw new Error('Gravar só funciona rodando no seu computador (npm run dev).')
  const chunks = Object.fromEntries(b.chunks.filter((c) => !vazio(c)).map((c) => [chunkKey(c.cx, c.cz), c]))
  await api('/__maps/save', { id: b.meta.id, meta: b.meta, chunks, criar: !!opt.criar })
}

export async function apagar(id: string): Promise<void> {
  if (!podeGravar) throw new Error('Apagar só funciona rodando no seu computador (npm run dev).')
  await api('/__maps/delete', { id })
}

/** Baixa o pacote como <id>.mapa.json. */
export function exportar(b: MapBundle) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(b, null, 1)], { type: 'application/json' }))
  const a = document.createElement('a')
  a.href = url; a.download = `${b.meta.id}.mapa.json`; a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export async function lerArquivo(f: File): Promise<MapBundle> {
  let j: unknown
  try { j = JSON.parse(await f.text()) } catch { throw new Error(`"${f.name}" não é um arquivo JSON.`) }
  return validar(j)
}

/** O nome da pasta a partir do nome do mapa: "Mansão — capítulo 2" vira "mansao-capitulo-2". */
export function slug(nome: string) {
  return nome.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 64)
}

export function mapaVazio(id: string, nome: string): MapBundle {
  return { formato: FORMATO, meta: { formato: FORMATO, id, nome, levels: 1, levelH: LEVEL_H, chunkSize: CHUNK, spawn: { pos: [2, 0, 2], yaw: 0, level: 0 }, ambiente: AMBIENTE_PADRAO, areas: [], semChao: false, chunks: [] }, chunks: [] }
}

export const vazio = (c: Chunk) => !c.walls.length && !c.floors.length && !c.openings.length && !c.stairs.length && !c.props.length && !c.decals.length && !c.points.length

const LISTAS = ['walls', 'floors', 'openings', 'stairs', 'props', 'decals', 'points'] as const

/** Confere um pacote vindo de fora (arquivo importado ou disco) e completa o que faltar. Erros em português. */
export function validar(j: unknown): MapBundle {
  const o = j as Record<string, unknown> | null
  if (!o || typeof o !== 'object') throw new Error('O arquivo não tem um mapa.')
  const meta = o.meta as Record<string, unknown> | undefined
  if (!meta || typeof meta !== 'object' || !Array.isArray(o.chunks)) throw new Error('O arquivo não é um mapa exportado pelo Criador de mapas.')
  const formato = Number(o.formato ?? meta.formato)
  // formato novo de mapa = subir o número e converter em formato.ts (nunca quebrar um mapa salvo)
  if (formato > FORMATO) throw new Error(`Este mapa é do formato ${formato}, mais novo que este editor (formato ${FORMATO}).`)
  if (!(formato >= 1)) throw new Error('O arquivo não diz o formato do mapa.')
  if (typeof meta.id !== 'string' || typeof meta.nome !== 'string') throw new Error('O mapa não tem id ou nome.')
  const chunks: Chunk[] = (o.chunks as Record<string, unknown>[]).map((c, i) => {
    if (!c || typeof c !== 'object' || !Number.isInteger(c.cx) || !Number.isInteger(c.cz)) throw new Error(`O bloco ${i + 1} do mapa está quebrado.`)
    const out = { cx: c.cx as number, cz: c.cz as number } as Chunk
    for (const k of LISTAS) (out as unknown as Record<string, unknown[]>)[k] = Array.isArray(c[k]) ? (c[k] as unknown[]) : []
    return out
  })
  const levels = Math.max(1, Math.floor(Number(meta.levels) || 1))
  const spawn = (meta.spawn as MapMeta['spawn'] | undefined) ?? { pos: [2, 0, 2], yaw: 0, level: 0 }
  const atual = cabecalhoAtual(meta)
  return {
    formato: FORMATO,
    meta: { ...atual, areas: atual.areas.filter((a) => a.level < levels), id: meta.id, nome: meta.nome, levels, levelH: LEVEL_H, chunkSize: CHUNK, spawn, chunks: chunks.filter((c) => !vazio(c)).map((c) => chunkKey(c.cx, c.cz)).sort() },
    chunks,
  }
}
