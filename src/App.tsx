// As telas do jogo. Uma por vez; cada uma recebe go() para trocar de tela.
import { useEffect, useState } from 'react'
import { MainMenu } from './screens/MainMenu'
import { SettingsScreen } from './screens/SettingsScreen'
import { DevMenu } from './screens/DevMenu'
import { MapEditor } from './editor/MapEditor'
import { VerModelos } from './screens/VerModelos'
import { VerCenas } from './screens/VerCenas'
import { NovoJogo } from './screens/NovoJogo'
import { Lobby } from './screens/Lobby'
import { TesteOnline } from './screens/TesteOnline'
import { useMusica, type Faixa } from './audio/musica'
import { carregarModelos, modelosProntos } from './render/bbmodel'

export type Tela = 'menu' | 'novo' | 'intro' | 'inimigos' | 'config' | 'dev' | 'mapas' | 'modelos' | 'cenas' | 'online'
export type Go = (t: Tela) => void

// a música de cada tela: o menu e o criador de mapas tocam a mesma (sem recomeçar ao trocar de tela); o Ver modelos
// fica em silêncio, para ouvir as vozes dos personagens; as demos também (o lobby delas toca a do menu e a de batalha
// entra com o roteiro);
// o Ver cenas também (cada cena traz o som dela); o teste online também (a música vem das perseguições)
const TRILHA: Record<Tela, Faixa | null> = { menu: 'menu', novo: 'menu', intro: null, inimigos: null, config: 'menu', dev: 'menu', mapas: 'menu', modelos: null, cenas: null, online: null }

export function App() {
  const [tela, setTela] = useState<Tela>('menu')
  const go: Go = setTela
  useMusica(TRILHA[tela])
  // as telas com modelos do Blockbench esperam eles chegarem (no jogo publicado vêm em pedaços, sob demanda)
  const [prontos, setProntos] = useState(modelosProntos)
  const precisa = tela === 'mapas' || tela === 'modelos' || tela === 'intro' || tela === 'inimigos' || tela === 'cenas' || tela === 'online'
  useEffect(() => { if (precisa && !prontos) carregarModelos().then(() => setProntos(true)) }, [precisa, prontos])
  if (precisa && !prontos) return <div className="tela"><h2>Carregando…</h2></div>
  switch (tela) {
    case 'novo': return <NovoJogo go={go} />
    case 'intro': return <Lobby go={go} demo="intro" />
    case 'inimigos': return <Lobby go={go} demo="inimigos" />
    case 'config': return <SettingsScreen go={go} />
    case 'dev': return <DevMenu go={go} />
    case 'mapas': return <MapEditor go={go} />
    case 'modelos': return <VerModelos go={go} />
    case 'cenas': return <VerCenas go={go} />
    case 'online': return <TesteOnline go={go} />
    default: return <MainMenu go={go} />
  }
}
