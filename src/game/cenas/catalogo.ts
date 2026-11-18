// Todas as cenas do jogo, pelo id (o Ver cenas lista daqui; o jogo toca daqui). Cada capítulo guarda as dele em
// src/chapters/<capítulo>/cenas/.
import { abertura } from '../../chapters/cap0/cenas/abertura'
import { escritorio } from '../../chapters/cap0/cenas/escritorio'
import type { Cena } from './tipos'

export const CENAS: Cena[] = [abertura, escritorio]
