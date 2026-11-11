// A ambientação: os botões do catálogo (a gaveta e o painel usam os mesmos) e as propriedades da área escolhida.
import { AMBIENTES } from '../maps/ambientes'
import type { AreaAmbiente } from '../maps/types'

/** Os botões das ambientações do catálogo, cada um com a cor da área dele no editor. */
export function EscolherAmbiente({ valor, onEscolher }: { valor: string; onEscolher: (nome: string) => void }) {
  return (
    <div className="opcoes">
      {Object.entries(AMBIENTES).map(([k, a]) => (
        <button key={k} aria-pressed={valor === k} onClick={() => onEscolher(k)}><span className="cor-amb" style={{ background: a.cor }} />{a.nome}</button>
      ))}
    </div>
  )
}

export function PainelArea({ a, onMudar, onApagar }: { a: AreaAmbiente; onMudar: (patch: Partial<AreaAmbiente>) => void; onApagar: () => void }) {
  return (
    <div className="propriedades sem-borda">
      <div className="nota">{a.id} · {a.w} × {a.d} m · de x {a.x}, z {a.z}</div>
      <span className="rotulo">Ambientação</span>
      <EscolherAmbiente valor={a.ambiente} onEscolher={(ambiente) => onMudar({ ambiente })} />
      <button className="perigo" onClick={onApagar}>Apagar <kbd>Del</kbd></button>
    </div>
  )
}
