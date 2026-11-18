// Todas as cenas do jogo, pelo id (o Ver cenas lista daqui; o jogo toca daqui). Cada capítulo guarda as dele em
// src/chapters/<capítulo>/cenas/.
import { escritorio } from '../../chapters/cap0/cenas/escritorio'
import { instalacao } from '../../chapters/cap0/cenas/instalacao'
import type { Cena } from './tipos'

// na ordem em que acontecem
export const CENAS: Cena[] = [escritorio, instalacao]
