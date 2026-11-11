import type { Go } from '../App'
import { NIVEIS, useNivelAuto, type Nivel, type Qualidade } from '../render/qualidade'
import { resetSettings, setSettings, useSettings } from '../settings/settings'

const QUALIDADES: Qualidade[] = ['auto', 'baixo', 'medio', 'alto']

export function SettingsScreen({ go }: { go: Go }) {
  const s = useSettings(), auto = useNivelAuto()
  return (
    <div className="tela">
      <h2>Configurações</h2>
      <div className="form">
        <label>Qualidade</label>
        <div className="opcoes">
          {QUALIDADES.map((q) => (
            <button key={q} aria-pressed={s.qualidade === q} onClick={() => setSettings({ qualidade: q })}
              title={q === 'auto' ? 'Escolhe pelo aparelho e desce sozinho se os quadros ficarem lentos' : undefined}>
              {q === 'auto' ? `Automático · ${NIVEIS[auto].nome}` : NIVEIS[q as Nivel].nome}
            </button>
          ))}
        </div>
        <label htmlFor="vol">Volume</label>
        <div><input id="vol" type="range" min={0} max={100} value={s.volume} onChange={(e) => setSettings({ volume: +e.target.value })} /><span className="valor">{s.volume}%</span></div>
        <label htmlFor="mus">Música</label>
        <div><input id="mus" type="range" min={0} max={100} value={s.musica} onChange={(e) => setSettings({ musica: +e.target.value })} /><span className="valor">{s.musica}%</span></div>
        <label htmlFor="efe">Efeitos</label>
        <div><input id="efe" type="range" min={0} max={100} value={s.efeitos} onChange={(e) => setSettings({ efeitos: +e.target.value })} /><span className="valor">{s.efeitos}%</span></div>
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
