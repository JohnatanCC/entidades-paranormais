// As configurações do jogador: guardadas no navegador (localStorage), lidas por qualquer tela com useSettings().
import { useSyncExternalStore } from 'react'
import type { Qualidade, Recursos } from '../render/qualidade'

export interface Settings {
  qualidade: Qualidade // a qualidade da imagem: automático (pelo aparelho), baixo, médio, alto ou ultra (render/qualidade.ts)
  ajustes: Partial<Recursos> // os recursos que o jogador mudou por cima do nível (vazio = o nível puro)
  volume: number // 0 a 100
  musica: number // 0 a 100
  efeitos: number // 0 a 100: os sons do jogo (vozes, passos, golpes), vezes o volume
  sensibilidade: number // 0,2 a 3 (1 = normal)
}

const KEY = 'entidades.config'
const DEFAULTS: Settings = { qualidade: 'auto', ajustes: {}, volume: 80, musica: 70, efeitos: 80, sensibilidade: 1 }

let state: Settings = load()
const subs = new Set<() => void>()

function load(): Settings {
  try {
    const sv = JSON.parse(localStorage.getItem(KEY) || 'null') as Record<string, unknown> | null
    const s = { ...DEFAULTS }
    // só o que ainda existe e tem o tipo certo: o que foi salvo por uma versão antiga (o filtro "imagem") fica de fora
    if (sv && typeof sv === 'object') {
      for (const k of ['volume', 'musica', 'efeitos', 'sensibilidade'] as const) if (typeof sv[k] === 'number') s[k] = sv[k] as number
      if (['auto', 'baixo', 'medio', 'alto', 'ultra'].includes(sv.qualidade as string)) s.qualidade = sv.qualidade as Qualidade
      // os ajustes: só números, textos curtos e sim/não (um valor que não existe mais é ignorado por quem lê: qualidade.ts)
      if (sv.ajustes && typeof sv.ajustes === 'object') s.ajustes = Object.fromEntries(Object.entries(sv.ajustes).filter(([, v]) => ['number', 'string', 'boolean'].includes(typeof v))) as Partial<Recursos>
    }
    return s
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
