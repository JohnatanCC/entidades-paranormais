// As configurações do jogador: guardadas no navegador (localStorage), lidas por qualquer tela com useSettings().
import { useSyncExternalStore } from 'react'

export type ImagemPreset = 'limpo' | 'suave' | 'ps1'

export interface Settings {
  imagem: ImagemPreset // o filtro da imagem (a limpa é a padrão desde 10/nov; PS1 e suave são opção)
  volume: number // 0 a 100
  musica: number // 0 a 100
  efeitos: number // 0 a 100: os sons do jogo (vozes, passos, golpes), vezes o volume
  sensibilidade: number // 0,2 a 3 (1 = normal)
}

const KEY = 'entidades.config'
const DEFAULTS: Settings = { imagem: 'limpo', volume: 80, musica: 70, efeitos: 80, sensibilidade: 1 }

let state: Settings = load()
const subs = new Set<() => void>()

function load(): Settings {
  try {
    const sv = JSON.parse(localStorage.getItem(KEY) || 'null') as Partial<Settings> | null
    return { ...DEFAULTS, ...(sv && typeof sv === 'object' ? sv : {}) }
  } catch {
    return { ...DEFAULTS }
  }
}

export function getSettings(): Settings {
  return state
}

export function setSettings(patch: Partial<Settings>) {
  state = { ...state, ...patch }
  try { localStorage.setItem(KEY, JSON.stringify(state)) } catch { /* sem armazenamento: vale só nesta sessão */ }
  subs.forEach((f) => f())
}

export function resetSettings() {
  setSettings(DEFAULTS)
}

/** Avisa f a cada mudança (para quem não é tela: o som). Devolve como desligar. */
export function aoMudarConfig(f: () => void) { subs.add(f); return () => { subs.delete(f) } }

export function useSettings(): Settings {
  return useSyncExternalStore((f) => { subs.add(f); return () => subs.delete(f) }, getSettings)
}
