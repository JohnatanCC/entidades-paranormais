// O "Salvar" do Criador de mapas: só existe rodando no seu computador (npm run dev).
// O editor manda o mapa inteiro (o cabeçalho e os blocos) e este plugin grava em maps/<id>/map.json
// e maps/<id>/chunks/<cx>_<cz>.json; blocos que sumiram (ficaram vazios) são apagados.
import type { Plugin } from 'vite'
import fs from 'node:fs'
import path from 'node:path'

const ID = /^[a-z0-9][a-z0-9_-]{0,63}$/ // o nome da pasta do mapa (sem barras, sem pontos)
const CHUNK = /^-?\d{1,4}_-?\d{1,4}$/

export function mapsDevApi(root: string): Plugin {
  const mapsDir = path.resolve(root, 'maps')
  return {
    name: 'entidades-maps-dev-api',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__maps/save', (req, res) => {
        if (req.method !== 'POST') { res.statusCode = 405; res.end(); return }
        let body = ''
        req.on('data', (c) => { body += c; if (body.length > 64 * 1024 * 1024) req.destroy() })
        req.on('end', () => {
          try {
            const data = JSON.parse(body) as { id: string; meta: Record<string, unknown>; chunks: Record<string, unknown> }
            if (!ID.test(data.id)) throw new Error('nome de mapa inválido: use letras minúsculas, números, - e _')
            const dir = path.join(mapsDir, data.id), cdir = path.join(dir, 'chunks')
            fs.mkdirSync(cdir, { recursive: true })
            const keep = new Set<string>()
            for (const [k, v] of Object.entries(data.chunks)) {
              if (!CHUNK.test(k)) throw new Error('bloco inválido: ' + k)
              fs.writeFileSync(path.join(cdir, k + '.json'), JSON.stringify(v, null, 1) + '\n')
              keep.add(k + '.json')
            }
            for (const f of fs.readdirSync(cdir)) if (f.endsWith('.json') && !keep.has(f)) fs.unlinkSync(path.join(cdir, f))
            fs.writeFileSync(path.join(dir, 'map.json'), JSON.stringify({ ...data.meta, chunks: [...keep].map((f) => f.replace('.json', '')).sort() }, null, 1) + '\n')
            res.setHeader('content-type', 'application/json'); res.end(JSON.stringify({ ok: true }))
          } catch (e) {
            res.statusCode = 400; res.setHeader('content-type', 'application/json'); res.end(JSON.stringify({ ok: false, erro: String((e as Error).message) }))
          }
        })
      })
    },
  }
}
