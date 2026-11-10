// As propriedades do objeto escolhido: girar, o modo livre (sai da grade: altura e inclinação em qualquer eixo),
// as opções do tipo (a lâmpada: normal, falhando, apagada) e apagar.
import { OBJETOS, alturaApoio } from '../maps/objetos'
import { LEVEL_H, type Prop } from '../maps/types'

interface Props { p: Prop; onMudar: (patch: Partial<Prop>) => void; onApagar: () => void }

const NOMES_MODO: Record<string, string> = { normal: 'Normal', falhando: 'Falhando', apagada: 'Apagada' }
const gira = (v: number) => (((v % 360) + 540) % 360) - 180 // de −180 a 180

export function PainelObjeto({ p, onMudar, onApagar }: Props) {
  const def = OBJETOS[p.type], base = p.level * LEVEL_H + alturaApoio(def)
  const girarY = (d: number) => onMudar({ rot: [p.rot[0], gira(p.rot[1] + d), p.rot[2]] })
  return (
    <div className="propriedades sem-borda">
      <div className="nota">{p.id} · x {p.pos[0].toFixed(2)} · z {p.pos[2].toFixed(2)} · {Math.round(p.rot[1])}°</div>
      <span className="rotulo">Girar</span>
      <div className="opcoes">
        <button onClick={() => girarY(-15)}>−15°</button><button onClick={() => girarY(15)}>+15°</button><button onClick={() => girarY(90)}>+90°</button>
      </div>
      {def?.params && Object.entries(def.params).map(([k, opcoes]) => (
        <div key={k} className="campo">
          <span className="rotulo">{k === 'modo' ? 'Modo' : k}</span>
          <div className="opcoes">{opcoes.map((o) => <button key={o} aria-pressed={(p.params?.[k] ?? opcoes[0]) === o} onClick={() => onMudar({ params: { ...p.params, [k]: o } })}>{NOMES_MODO[o] ?? o}</button>)}</div>
        </div>
      ))}
      <label className="marcar">
        <input type="checkbox" checked={!!p.free} onChange={(e) => onMudar(e.target.checked
          ? { free: true }
          : { free: undefined, pos: [Math.round(p.pos[0] * 4) / 4, base, Math.round(p.pos[2] * 4) / 4], rot: [0, Math.round(p.rot[1] / 15) * 15, 0] })} />
        Modo livre (fora da grade)
      </label>
      {p.free && <>
        <Deslizar rotulo="Altura" min={-1} max={3.4} passo={0.05} valor={p.pos[1] - base} fmt={(v) => `${v.toFixed(2)} m`}
          onMudar={(v) => onMudar({ pos: [p.pos[0], base + v, p.pos[2]] })} />
        <Deslizar rotulo="Girar em y" min={-180} max={180} passo={1} valor={p.rot[1]} fmt={(v) => `${Math.round(v)}°`} onMudar={(v) => onMudar({ rot: [p.rot[0], v, p.rot[2]] })} />
        <Deslizar rotulo="Inclinar (x)" min={-180} max={180} passo={1} valor={p.rot[0]} fmt={(v) => `${Math.round(v)}°`} onMudar={(v) => onMudar({ rot: [v, p.rot[1], p.rot[2]] })} />
        <Deslizar rotulo="Tombar (z)" min={-180} max={180} passo={1} valor={p.rot[2]} fmt={(v) => `${Math.round(v)}°`} onMudar={(v) => onMudar({ rot: [p.rot[0], p.rot[1], v] })} />
        <div className="nota">No modo livre, arrastar encaixa a cada 5 cm. Desligar volta para a grade.</div>
      </>}
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
