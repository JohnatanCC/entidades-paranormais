// As telas do jogo. Uma por vez; cada uma recebe go() para trocar de tela.
import { useState } from 'react'
import { MainMenu } from './screens/MainMenu'
import { SettingsScreen } from './screens/SettingsScreen'
import { DevMenu } from './screens/DevMenu'
import { MapEditor } from './editor/MapEditor'

export type Tela = 'menu' | 'config' | 'dev' | 'mapas'
export type Go = (t: Tela) => void

export function App() {
  const [tela, setTela] = useState<Tela>('menu')
  const go: Go = setTela
  switch (tela) {
    case 'config': return <SettingsScreen go={go} />
    case 'dev': return <DevMenu go={go} />
    case 'mapas': return <MapEditor go={go} />
    default: return <MainMenu go={go} />
  }
}
