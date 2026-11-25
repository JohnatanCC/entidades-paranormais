// As propriedades da caixa de espectrais escolhida (a aba Entidades): o que ela invoca, o raio que a ativa, as cargas
// (quantos ao mesmo tempo), a recarga (depois que um morre) e o máximo (quantos no total). Os números ficam no params.
import { caixaDe, type Caixa } from '../maps/entidades'
import type { ScriptPoint } from '../maps/types'

export function PainelCaixa({ p, onMudar, onApagar }: { p: ScriptPoint; onMudar: (params: Partial<Caixa>) => void; onApagar: () => void }) {
  const c = caixaDe(p.params)
  return (
    <div className="propriedades sem-borda">
      <div className="nota">{p.id} · x {p.pos[0].toFixed(2)} · z {p.pos[2].toFixed(2)}</div>
      <span className="rotulo">Invoca</span>
      <div className="opcoes">
        <button aria-pressed={c.monstro === 'sombra'} onClick={() => onMudar({ monstro: 'sombra' })}>Sombra espectral</button>
        <button aria-pressed={c.monstro === 'asa'} onClick={() => onMudar({ monstro: 'asa' })}>Asa espectral</button>
      </div>
      <Deslizar rotulo="Raio que ativa" min={2} max={20} passo={0.5} valor={c.raio} fmt={(v) => `${v} m`} onMudar={(raio) => onMudar({ raio })} />
      <Deslizar rotulo="Cargas (ao mesmo tempo)" min={1} max={6} passo={1} valor={c.cargas} fmt={String} onMudar={(cargas) => onMudar({ cargas })} />
      <Deslizar rotulo="Recarga" min={5} max={120} passo={5} valor={c.recarga} fmt={(v) => `${v} s`} onMudar={(recarga) => onMudar({ recarga })} />
      <Deslizar rotulo="Máximo (no total)" min={1} max={30} passo={1} valor={c.maximo} fmt={String} onMudar={(maximo) => onMudar({ maximo })} />
      <div className="nota">O agente entrando no raio, ela invoca um por carga. Quando um morre, a carga volta depois da recarga. Invocou o máximo, para.</div>
      <button className="perigo" onClick={onApagar}>Apagar <kbd>Del</kbd></button>
    </div>
  )
}

function Deslizar({ rotulo, min, max, passo, valor, fmt, onMudar }: { rotulo: string; min: number; max: number; passo: number; valor: number; fmt: (v: number) => string; onMudar: (v: number) => void }) {
  return (
    <label className="campo">
      <span className="rotulo">{rotulo}: <b>{fmt(valor)}</b></span>
      <input type="range" min={min} max={max} step={passo} value={valor} onChange={(e) => onMudar(Number(e.target.value))} />
    </label>
  )
}
