import type { Go } from '../App'
import { resetSettings, setSettings, useSettings, type ImagemPreset } from '../settings/settings'

const IMAGENS: { id: ImagemPreset; nome: string }[] = [
  { id: 'limpo', nome: 'Limpo' }, // o padrão desde 10/nov
  { id: 'suave', nome: 'Suave' },
  { id: 'ps1', nome: 'Retrô PS1' },
]

export function SettingsScreen({ go }: { go: Go }) {
  const s = useSettings()
  return (
    <div className="tela">
      <h2>Configurações</h2>
      <div className="form">
        <label>Imagem</label>
        <div className="opcoes">
          {IMAGENS.map((o) => (
            <button key={o.id} aria-pressed={s.imagem === o.id} onClick={() => setSettings({ imagem: o.id })}>{o.nome}</button>
          ))}
        </div>
        <label htmlFor="vol">Volume</label>
        <div><input id="vol" type="range" min={0} max={100} value={s.volume} onChange={(e) => setSettings({ volume: +e.target.value })} /><span className="valor">{s.volume}%</span></div>
        <label htmlFor="mus">Música</label>
        <div><input id="mus" type="range" min={0} max={100} value={s.musica} onChange={(e) => setSettings({ musica: +e.target.value })} /><span className="valor">{s.musica}%</span></div>
        <label htmlFor="sens">Mouse</label>
        <div><input id="sens" type="range" min={0.2} max={3} step={0.05} value={s.sensibilidade} onChange={(e) => setSettings({ sensibilidade: +e.target.value })} /><span className="valor">{s.sensibilidade.toFixed(2)}×</span></div>
      </div>
      <nav className="menu">
        <button onClick={resetSettings}>Restaurar padrão</button>
        <button onClick={() => go('menu')}>Voltar</button>
      </nav>
    </div>
  )
}
