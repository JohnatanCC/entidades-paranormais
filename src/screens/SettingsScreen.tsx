// As configurações: a qualidade da imagem (um nível pronto, ou o automático) com os ajustes de cada recurso por cima,
// os volumes e o mouse. Os níveis e os recursos vêm de render/qualidade.ts (NIVEIS e OPCOES): um recurso novo lá
// aparece aqui sozinho. Ao lado, a prévia ao vivo (PreviaQualidade): uma sala com luz, desenhada com a qualidade
// escolhida, com os quadros por segundo. E o teste de desempenho (TesteDesempenho): a mansão inteira, nível por nível,
// com a média e o mínimo de quadros de cada um, para o jogador escolher sabendo quanto custa.
import { useState } from 'react'
import type { Go } from '../App'
import { NIVEIS, OPCOES, useNivel, useNivelAuto, type Nivel, type Qualidade, type Recursos } from '../render/qualidade'
import { resetSettings, setSettings, useSettings } from '../settings/settings'
import { PreviaQualidade } from './PreviaQualidade'
import { TESTE, TesteDesempenho, type Resultado } from './TesteDesempenho'

const QUALIDADES: Qualidade[] = ['auto', 'baixo', 'medio', 'alto', 'ultra']
const GRUPOS = ['Imagem', 'Luz e sombra', 'Texturas'] as const
const TODOS: Nivel[] = ['baixo', 'medio', 'alto', 'ultra']
/** O que a média de quadros de um nível quer dizer para quem joga. */
const nota = (r: Resultado) => (r.media >= TESTE.bom ? 'liso' : r.media >= TESTE.jogavel ? 'jogável' : 'pesado')

export function SettingsScreen({ go }: { go: Go }) {
  const s = useSettings(), auto = useNivelAuto(), nivel = useNivel()
  const base = NIVEIS[nivel], mudados = Object.keys(s.ajustes).length
  // o teste de desempenho: os níveis pedidos, qual está sendo medido, em que parada, e o que já saiu
  const [teste, setTeste] = useState<{ niveis: Nivel[]; indice: number; parada: number; total: number } | null>(null)
  const [resultados, setResultados] = useState<Resultado[]>([])
  const comecar = (niveis: Nivel[]) => { setResultados([]); setTeste({ niveis, indice: 0, parada: 0, total: 1 }) }
  // um nível acabou: guarda o resultado e passa para o próximo (ou termina)
  const onNivel = (indice: number, r: Resultado) => {
    setResultados((rs) => [...rs.filter((x) => x.nivel !== r.nivel), r])
    setTeste((t) => (t && indice + 1 < t.niveis.length ? { ...t, indice: indice + 1, parada: 0 } : null))
  }
  // o melhor nível que roda liso (ou, se nenhum, o melhor jogável)
  const ordenados = TODOS.map((n) => resultados.find((r) => r.nivel === n)).filter((r): r is Resultado => !!r)
  const indicado = [...ordenados].reverse().find((r) => r.media >= TESTE.bom) ?? [...ordenados].reverse().find((r) => r.media >= TESTE.jogavel)
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
        <label>Teste</label>
        <div className="teste-form">
          <div className="opcoes">
            <button disabled={!!teste} onClick={() => comecar(TODOS)} title="Mede os quatro níveis na mansão inteira: cerca de um minuto">Testar todos os níveis</button>
            <button disabled={!!teste} onClick={() => comecar([nivel])} title="Mede só o nível escolhido, sem os ajustes">Só o {base.nome}</button>
            {teste && <button onClick={() => setTeste(null)}>Cancelar</button>}
          </div>
          {teste && <div className="nota-form">Medindo o {NIVEIS[teste.niveis[teste.indice]].nome} ({teste.indice + 1} de {teste.niveis.length}) · parada {teste.parada + 1} de {teste.total}. Deixe a janela à vista.</div>}
          {!teste && !ordenados.length && <div className="nota-form">Anda pela mansão inteira com cada nível e mede os quadros por segundo: a média e o mínimo (os engasgos). A sala ao lado é pequena demais para mostrar o peso de verdade.</div>}
          {ordenados.length > 0 && <table className="resultado-teste">
            <thead><tr><th>Nível</th><th>Média</th><th>Mínimo</th><th /><th /></tr></thead>
            <tbody>{ordenados.map((r) => (
              <tr key={r.nivel} className={r === indicado ? 'indicado' : undefined}>
                <td>{NIVEIS[r.nivel].nome}</td><td>{Math.round(r.media)} fps</td><td>{Math.round(r.minimo)} fps</td><td>{nota(r)}{r === indicado ? ' · indicado' : ''}</td>
                <td><button className="link" onClick={() => setSettings({ qualidade: r.nivel, ajustes: {} })}>usar</button></td>
              </tr>
            ))}</tbody>
          </table>}
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
      {teste
        ? <div className="previa">
            <TesteDesempenho niveis={teste.niveis} indice={teste.indice} onNivel={onNivel} onParada={(parada, total) => setTeste((t) => (t ? { ...t, parada, total } : t))} />
            <span className="previa-dica">Teste de desempenho · {NIVEIS[teste.niveis[teste.indice]].nome}</span>
          </div>
        : <PreviaQualidade />}
    </div>
  )
}
