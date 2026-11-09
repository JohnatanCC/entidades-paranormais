// Desfazer e refazer: o histórico guarda os estados anteriores inteiros (o documento divide quase tudo entre
// um estado e o outro, então sai barato). Uma mudança que devolve o mesmo objeto não entra no histórico.
// Mudanças seguidas com a mesma "junta" (arrastar um controle deslizante) viram um passo só de desfazer.
import { useCallback, useState } from 'react'

const LIMITE = 200 // passos de desfazer guardados
const JUNTAR_MS = 1200 // mudanças com a mesma junta dentro deste tempo viram um passo só

interface H<T> { passado: T[]; atual: T; futuro: T[]; junta?: string; quando: number }

export function useHistorico<T>(inicial: T) {
  const [h, setH] = useState<H<T>>({ passado: [], atual: inicial, futuro: [], quando: 0 })
  const mudar = useCallback((f: (t: T) => T, junta?: string) => setH((h) => {
    const n = f(h.atual), agora = performance.now()
    if (n === h.atual) return h
    if (junta && h.junta === junta && agora - h.quando < JUNTAR_MS) return { ...h, atual: n, futuro: [], quando: agora }
    return { passado: [...h.passado, h.atual].slice(-LIMITE), atual: n, futuro: [], junta, quando: agora }
  }), [])
  const desfazer = useCallback(() => setH((h) => h.passado.length ? { passado: h.passado.slice(0, -1), atual: h.passado[h.passado.length - 1], futuro: [h.atual, ...h.futuro], quando: 0 } : h), [])
  const refazer = useCallback(() => setH((h) => h.futuro.length ? { passado: [...h.passado, h.atual], atual: h.futuro[0], futuro: h.futuro.slice(1), quando: 0 } : h), [])
  /** Troca o estado e zera o histórico (abrir outro mapa). */
  const trocar = useCallback((t: T) => setH({ passado: [], atual: t, futuro: [], quando: 0 }), [])
  return { atual: h.atual, mudar, desfazer, refazer, trocar, podeDesfazer: h.passado.length > 0, podeRefazer: h.futuro.length > 0 }
}
