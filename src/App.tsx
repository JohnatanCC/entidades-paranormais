// As telas do jogo. Uma por vez; cada uma recebe go() para trocar de tela.
import { useState } from 'react'
import { MainMenu } from './screens/MainMenu'
import { SettingsScreen } from './screens/SettingsScreen'
import { DevMenu } from './screens/DevMenu'
import { MapEditor } from './editor/MapEditor'
import { VerModelos } from './screens/VerModelos'
import { useMusica, type Faixa } from './audio/musica'

export type Tela = 'menu' | 'config' | 'dev' | 'mapas' | 'modelos'
export type Go = (t: Tela) => void

// a música de cada tela: o menu e o criador de mapas tocam a mesma (sem recomeçar ao trocar de tela)
const TRILHA: Record<Tela, Faixa | null> = { menu: 'menu', config: 'menu', dev: 'menu', mapas: 'menu', modelos: 'menu' }

export function App() {
  const [tela, setTela] = useState<Tela>('menu')
  const go: Go = setTela
  useMusica(TRILHA[tela])
  switch (tela) {
    case 'config': return <SettingsScreen go={go} />
    case 'dev': return <DevMenu go={go} />
    case 'mapas': return <MapEditor go={go} />
    case 'modelos': return <VerModelos go={go} />
    default: return <MainMenu go={go} />
  }
}
