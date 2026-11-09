// O gerenciador de mapas: a lista da pasta maps/ e o que dá para fazer com cada um. Só mostra e chama;
// quem faz é o MapEditor (abrir, copiar, apagar, exportar, criar e importar).
import { useRef } from 'react'
import { podeGravar, type MapInfo } from '../maps/storage'

interface Props {
  mapas: MapInfo[]
  aberto?: string // o id do mapa aberto no editor
  ocupado: boolean
  onAbrir: (id: string) => void
  onCopiar: (id: string) => void
  onApagar: (id: string) => void
  onExportar: (id: string) => void
  onNovo: () => void
  onImportar: (f: File) => void
  onFechar?: () => void // sem mapa aberto, não dá para fechar
}

export function MapManager(p: Props) {
  const arquivo = useRef<HTMLInputElement>(null)
  return (
    <div className="modal-fundo" onPointerDown={(e) => { if (e.target === e.currentTarget) p.onFechar?.() }}>
      <div className="modal" role="dialog" aria-label="Mapas">
        <div className="modal-topo">
          <h2>Mapas</h2>
          <button onClick={p.onNovo} disabled={p.ocupado || !podeGravar}>Novo</button>
          <button onClick={() => arquivo.current?.click()} disabled={p.ocupado || !podeGravar}>Importar…</button>
          <input ref={arquivo} type="file" accept=".json,application/json" hidden
            onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) p.onImportar(f) }} />
          {p.onFechar && <button className="fechar" onClick={p.onFechar} aria-label="Fechar">✕</button>}
        </div>
        <div className="lista-mapas">
          {p.mapas.length === 0 && <div className="nota">Nenhum mapa na pasta maps/. Crie um com Novo ou traga um com Importar.</div>}
          {p.mapas.map((m) => (
            <div key={m.id} className="linha-mapa" aria-current={p.aberto === m.id}>
              <div className="nome">
                <b>{m.nome}</b>
                <span>maps/{m.id}/ · {m.levels} {m.levels === 1 ? 'andar' : 'andares'} · {m.blocos} {m.blocos === 1 ? 'bloco' : 'blocos'}{p.aberto === m.id ? ' · aberto' : ''}</span>
              </div>
              <button onClick={() => p.onAbrir(m.id)} disabled={p.ocupado}>Abrir</button>
              <button onClick={() => p.onCopiar(m.id)} disabled={p.ocupado || !podeGravar} title="Cria um mapa novo a partir deste">Copiar</button>
              <button onClick={() => p.onExportar(m.id)} disabled={p.ocupado} title="Baixa o mapa inteiro num arquivo .json">Exportar</button>
              <button className="perigo" onClick={() => p.onApagar(m.id)} disabled={p.ocupado || !podeGravar}>Apagar</button>
            </div>
          ))}
        </div>
        <div className="nota">
          {podeGravar
            ? 'Copiar cria um mapa novo a partir do salvo (assim o capítulo 2 nasce do 1). Exportar baixa a versão salva num .json; Importar lê esse arquivo.'
            : 'Novo, copiar, apagar e importar só funcionam rodando no seu computador (npm run dev).'}
        </div>
      </div>
    </div>
  )
}
