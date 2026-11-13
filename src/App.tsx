// As telas do jogo. Uma por vez; cada uma recebe go() para trocar de tela.
import { useEffect, useState } from 'react'
import { MainMenu } from './screens/MainMenu'
import { SettingsScreen } from './screens/SettingsScreen'
import { DevMenu } from './screens/DevMenu'
import { MapEditor } from './editor/MapEditor'
import { VerModelos } from './screens/VerModelos'
import { NovoJogo } from './screens/NovoJogo'
import { Jogo } from './screens/Jogo'
import { useMusica, type Faixa } from './audio/musica'
import { carregarModelos, modelosProntos } from './render/bbmodel'

export type Tela = 'menu' | 'novo' | 'intro' | 'config' | 'dev' | 'mapas' | 'modelos'
export type Go = (t: Tela) => void

// a música de cada tela: o menu e o criador de mapas tocam a mesma (sem recomeçar ao trocar de tela); o Ver modelos
// fica em silêncio, para ouvir as vozes dos personagens; a Demo · Intro também (a música do chefe entra com o roteiro)
const TRILHA: Record<Tela, Faixa | null> = { menu: 'menu', novo: 'menu', intro: null, config: 'menu', dev: 'menu', mapas: 'menu', modelos: null }

export function App() {
  const [tela, setTela] = useState<Tela>('menu')
  const go: Go = setTela
  useMusica(TRILHA[tela])
  // as telas com modelos do Blockbench esperam eles chegarem (no jogo publicado vêm em pedaços, sob demanda)
  const [prontos, setProntos] = useState(modelosProntos)
  const precisa = tela === 'mapas' || tela === 'modelos' || tela === 'intro'
  useEffect(() => { if (precisa && !prontos) carregarModelos().then(() => setProntos(true)) }, [precisa, prontos])
  if (precisa && !prontos) return <div className="tela"><h2>Carregando…</h2></div>
  switch (tela) {
    case 'novo': return <NovoJogo go={go} />
    case 'intro': return <Jogo go={go} mapa="intro" />
    case 'config': return <SettingsScreen go={go} />
    case 'dev': return <DevMenu go={go} />
    case 'mapas': return <MapEditor go={go} />
    case 'modelos': return <VerModelos go={go} />
    default: return <MainMenu go={go} />
  }
}
