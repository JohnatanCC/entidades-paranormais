// As configurações: a qualidade da imagem (um nível pronto, ou o automático) com os ajustes de cada recurso por cima,
// os volumes e o mouse. Os níveis e os recursos vêm de render/qualidade.ts (NIVEIS e OPCOES): um recurso novo lá
// aparece aqui sozinho. Ao lado, a prévia ao vivo (PreviaQualidade): uma sala com luz, desenhada com a qualidade
// escolhida, com os quadros por segundo.
import type { Go } from '../App'
import { NIVEIS, OPCOES, useNivel, useNivelAuto, type Nivel, type Qualidade, type Recursos } from '../render/qualidade'
import { resetSettings, setSettings, useSettings } from '../settings/settings'
import { PreviaQualidade } from './PreviaQualidade'

const QUALIDADES: Qualidade[] = ['auto', 'baixo', 'medio', 'alto', 'ultra']
const GRUPOS = ['Imagem', 'Luz e sombra', 'Texturas'] as const

export function SettingsScreen({ go }: { go: Go }) {
  const s = useSettings(), auto = useNivelAuto(), nivel = useNivel()
  const base = NIVEIS[nivel], mudados = Object.keys(s.ajustes).length
  // escolher o valor do nível tira o ajuste (o recurso volta a seguir o nível); outro valor fica por cima dele
  function ajustar<K extends keyof Recursos>(chave: K, valor: Recursos[K]) {
    const ajustes = { ...s.ajustes }
    if (valor === base[chave]) delete ajustes[chave]; else ajustes[chave] = valor
    setSettings({ ajustes })
  }
  return (
    <div className="config">
      <div className="config-lado">
      <h2>Configurações</h2>
      <div className="form">
        <label>Qualidade</label>
        <div className="opcoes">
          {QUALIDADES.map((q) => (
            <button key={q} aria-pressed={s.qualidade === q} onClick={() => setSettings({ qualidade: q, ajustes: {} })}
              title={q === 'auto' ? 'Escolhe pelo aparelho e desce sozinho se os quadros ficarem lentos' : q === 'ultra' ? 'O mais pesado: tudo o que melhora luz e sombra' : undefined}>
              {q === 'auto' ? `Automático · ${NIVEIS[auto].nome}` : NIVEIS[q as Nivel].nome}
            </button>
          ))}
        </div>
        <label>Ajustes</label>
        <div className="nota-form">
          {mudados
            ? <>{mudados} {mudados === 1 ? 'recurso mudado' : 'recursos mudados'} por cima do nível {base.nome}. <button className="link" onClick={() => setSettings({ ajustes: {} })}>Voltar ao nível</button></>
            : <>Cada recurso segue o nível {base.nome}. Mude qualquer um abaixo; trocar de nível desfaz os ajustes.</>}
        </div>
        {GRUPOS.map((g) => (
          <div className="grupo-form" key={g}>
            <h3>{g}</h3>
            {OPCOES.filter((o) => o.grupo === g).map((o) => {
              const valor = s.ajustes[o.chave] ?? base[o.chave]
              // as bordas suaves e o brilho das luzes só existem com a correção de cor ligada
              const semPasse = (o.chave === 'bordas' || o.chave === 'bloom') && !(s.ajustes.passe ?? base.passe)
              return (
                <div className="linha-form" key={o.chave} title={o.ajuda}>
                  <span className={o.chave in s.ajustes ? 'mudado' : undefined}>{o.nome}</span>
                  <div className="opcoes">
                    {o.valores.map(([v, rotulo]) => (
                      <button key={String(v)} aria-pressed={valor === v} disabled={semPasse} onClick={() => ajustar(o.chave, v)}>{rotulo}</button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        ))}
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
      <PreviaQualidade />
    </div>
  )
}
