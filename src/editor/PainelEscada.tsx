// As propriedades da escada escolhida: para onde ela sobe, a textura dos degraus e apagar.
import type { Stair } from '../maps/types'
import { NOMES_DIRECAO, contaDe } from './FerramentaEscadas'
import type { Direcao } from './doc'
import { Paleta } from './Paleta'

interface Props { s: Stair; onMudar: (patch: Partial<Stair>) => void; onApagar: () => void }

export function PainelEscada({ s, onMudar, onApagar }: Props) {
  const c = contaDe(s)
  return (
    <div className="propriedades">
      <div className="paleta-topo"><span>Escolhida</span><b>Escada</b></div>
      <div className="nota">{s.id} · {c.larg} × {c.comp} m · {c.n} degraus de {c.espelho} cm, pisada de {c.pisada} cm</div>
      <span className="rotulo">Sobe para</span>
      <div className="opcoes">
        {(Object.keys(NOMES_DIRECAO) as Direcao[]).map((d) => <button key={d} aria-pressed={s.dir === d} onClick={() => onMudar({ dir: d })}>{NOMES_DIRECAO[d]}</button>)}
      </div>
      <Paleta titulo="Degraus" uso="piso" valor={s.tex} onEscolher={(tex) => onMudar({ tex })} />
      <button className="perigo" onClick={onApagar}>Apagar <kbd>Del</kbd></button>
    </div>
  )
}
