// Desfazer e refazer: o histórico guarda os estados anteriores inteiros (o documento divide quase tudo entre
// um estado e o outro, então sai barato). Uma mudança que devolve o mesmo objeto não entra no histórico.
import { useCallback, useState } from 'react'

const LIMITE = 200 // passos de desfazer guardados

interface H<T> { passado: T[]; atual: T; futuro: T[] }

export function useHistorico<T>(inicial: T) {
  const [h, setH] = useState<H<T>>({ passado: [], atual: inicial, futuro: [] })
  const mudar = useCallback((f: (t: T) => T) => setH((h) => {
    const n = f(h.atual)
    return n === h.atual ? h : { passado: [...h.passado, h.atual].slice(-LIMITE), atual: n, futuro: [] }
  }), [])
  const desfazer = useCallback(() => setH((h) => h.passado.length ? { passado: h.passado.slice(0, -1), atual: h.passado[h.passado.length - 1], futuro: [h.atual, ...h.futuro] } : h), [])
  const refazer = useCallback(() => setH((h) => h.futuro.length ? { passado: [...h.passado, h.atual], atual: h.futuro[0], futuro: h.futuro.slice(1) } : h), [])
  /** Troca o estado e zera o histórico (abrir outro mapa). */
  const trocar = useCallback((t: T) => setH({ passado: [], atual: t, futuro: [] }), [])
  return { atual: h.atual, mudar, desfazer, refazer, trocar, podeDesfazer: h.passado.length > 0, podeRefazer: h.futuro.length > 0 }
}
