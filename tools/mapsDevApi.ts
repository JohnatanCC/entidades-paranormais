// A API dos mapas do Criador de mapas: só existe rodando no seu computador (npm run dev).
// O editor lê e grava a pasta maps/ por aqui, sempre direto do disco:
//   GET  /__maps/list           os mapas da pasta (id, nome, andares, blocos)
//   GET  /__maps/read?id=<id>   um mapa inteiro { formato, meta, chunks: [...] }
//   POST /__maps/save           { id, meta, chunks: { "cx_cz": bloco }, criar? } grava maps/<id>/map.json e chunks/*.json
//                               (blocos que sumiram são apagados; com criar, falha se o mapa já existe)
//   POST /__maps/delete         { id } apaga a pasta maps/<id>/
import type { Plugin } from 'vite'
import type { IncomingMessage, ServerResponse } from 'node:http'
import fs from 'node:fs'
import path from 'node:path'

const ID = /^[a-z0-9][a-z0-9_-]{0,63}$/ // o nome da pasta do mapa (sem barras, sem pontos)
const CHUNK = /^-?\d{1,4}_-?\d{1,4}$/
const LIMITE = 64 * 1024 * 1024 // 64 MB por pedido

type Req = IncomingMessage & { originalUrl?: string }
type Resposta = Record<string, unknown>

const falha = (msg: string, status = 400) => Object.assign(new Error(msg), { status })

function corpo(req: Req): Promise<Record<string, unknown>> {
  return new Promise((ok, erro) => {
    let s = ''
    req.on('data', (c) => { s += c; if (s.length > LIMITE) { erro(falha('mapa grande demais', 413)); req.destroy() } })
    req.on('end', () => { try { ok(JSON.parse(s || '{}')) } catch { erro(falha('o pedido não é um JSON válido')) } })
    req.on('error', erro)
  })
}

const lerJson = (f: string) => JSON.parse(fs.readFileSync(f, 'utf8')) as Record<string, unknown>

export function mapsDevApi(root: string): Plugin {
  const mapsDir = path.resolve(root, 'maps')
  const pasta = (id: unknown) => {
    if (typeof id !== 'string' || !ID.test(id)) throw falha('nome de mapa inválido: use letras minúsculas, números, - e _')
    return path.join(mapsDir, id)
  }
  const existe = (id: string) => fs.existsSync(path.join(pasta(id), 'map.json'))

  // cada rota responde { ok: true, ... } ou { ok: false, erro } (o editor mostra o erro como aviso)
  const rota = (metodo: 'GET' | 'POST', fn: (req: Req, url: URL) => Promise<Resposta> | Resposta) =>
    async (req: Req, res: ServerResponse) => {
      res.setHeader('content-type', 'application/json')
      if (req.method !== metodo) { res.statusCode = 405; res.end(JSON.stringify({ ok: false, erro: 'método errado' })); return }
      try {
        const url = new URL(req.originalUrl || req.url || '/', 'http://localhost')
        res.end(JSON.stringify({ ok: true, ...(await fn(req, url)) }))
      } catch (e) {
        res.statusCode = (e as { status?: number }).status || 400
        res.end(JSON.stringify({ ok: false, erro: String((e as Error).message) }))
      }
    }

  function listar() {
    if (!fs.existsSync(mapsDir)) return []
    const out: { id: string; nome: string; levels: number; blocos: number }[] = []
    for (const d of fs.readdirSync(mapsDir, { withFileTypes: true })) {
      if (!d.isDirectory() || d.name.startsWith('.') || !ID.test(d.name)) continue
      const f = path.join(mapsDir, d.name, 'map.json')
      if (!fs.existsSync(f)) continue
      try {
        const m = lerJson(f)
        out.push({ id: d.name, nome: typeof m.nome === 'string' ? m.nome : d.name, levels: Number(m.levels) || 1, blocos: Array.isArray(m.chunks) ? m.chunks.length : 0 })
      } catch { out.push({ id: d.name, nome: `${d.name} (map.json quebrado)`, levels: 1, blocos: 0 }) }
    }
    return out.sort((a, b) => a.nome.localeCompare(b.nome, 'pt'))
  }

  function ler(id: string) {
    if (!existe(id)) throw falha(`O mapa "${id}" não existe.`, 404)
    const dir = pasta(id), cdir = path.join(dir, 'chunks')
    const meta = lerJson(path.join(dir, 'map.json'))
    const chunks = fs.existsSync(cdir)
      ? fs.readdirSync(cdir).filter((f) => f.endsWith('.json') && CHUNK.test(f.slice(0, -5))).sort().map((f) => lerJson(path.join(cdir, f)))
      : []
    return { formato: meta.formato, meta, chunks }
  }

  function gravar(data: Record<string, unknown>) {
    const id = data.id as string, dir = pasta(id), cdir = path.join(dir, 'chunks')
    if (data.criar && fs.existsSync(dir)) throw falha(`Já existe um mapa "${id}" na pasta maps/.`, 409)
    const meta = data.meta as Record<string, unknown> | undefined, chunks = data.chunks as Record<string, unknown> | undefined
    if (!meta || typeof meta !== 'object' || !chunks || typeof chunks !== 'object') throw falha('faltou o cabeçalho ou os blocos do mapa')
    for (const k of Object.keys(chunks)) if (!CHUNK.test(k)) throw falha('bloco inválido: ' + k)
    fs.mkdirSync(cdir, { recursive: true })
    const keep = new Set<string>()
    for (const [k, v] of Object.entries(chunks)) {
      fs.writeFileSync(path.join(cdir, k + '.json'), JSON.stringify(v, null, 1) + '\n')
      keep.add(k + '.json')
    }
    for (const f of fs.readdirSync(cdir)) if (f.endsWith('.json') && !keep.has(f)) fs.unlinkSync(path.join(cdir, f))
    // o cabeçalho por último: a lista de blocos dele é sempre a que ficou no disco
    fs.writeFileSync(path.join(dir, 'map.json'), JSON.stringify({ ...meta, id, chunks: [...keep].map((f) => f.slice(0, -5)).sort() }, null, 1) + '\n')
  }

  return {
    name: 'entidades-maps-dev-api',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__maps/list', rota('GET', () => ({ mapas: listar() })))
      server.middlewares.use('/__maps/read', rota('GET', (_req, url) => ({ mapa: ler(url.searchParams.get('id') || '') })))
      server.middlewares.use('/__maps/save', rota('POST', async (req) => { gravar(await corpo(req)); return {} }))
      server.middlewares.use('/__maps/delete', rota('POST', async (req) => {
        const { id } = await corpo(req)
        if (!existe(id as string)) throw falha(`O mapa "${String(id)}" não existe.`, 404)
        fs.rmSync(pasta(id), { recursive: true })
        return {}
      }))
    },
  }
}
