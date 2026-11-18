// A moldura das cenas, por cima do <Canvas>: as faixas pretas de cinema, o preto que clareia e escurece, a legenda (quem
// fala e o quê; para si mesmo, em itálico) e o título grande. O tocador entrega o estado a cada quadro e a moldura só
// mexe no que mudou (nada de redesenhar o React a cada quadro).
import { useEffect, useRef, type MutableRefObject } from 'react'
import type { EstadoCena } from './tocador'

export function Moldura({ painel }: { painel: MutableRefObject<((e: EstadoCena) => void) | null> }) {
  const escuro = useRef<HTMLDivElement>(null), legenda = useRef<HTMLDivElement>(null), quem = useRef<HTMLElement>(null)
  const texto = useRef<HTMLSpanElement>(null), titulo = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const antes = { escuro: -1, fala: null as unknown, titulo: '', tituloA: -1 }
    painel.current = (e) => {
      const esc = Math.round(e.escuro * 100) / 100
      if (esc !== antes.escuro && escuro.current) { escuro.current.style.opacity = String(esc); antes.escuro = esc }
      if (e.legenda !== antes.fala && legenda.current && quem.current && texto.current) {
        antes.fala = e.legenda
        legenda.current.style.display = e.legenda ? '' : 'none'
        if (e.legenda) {
          quem.current.textContent = e.legenda.quem
          texto.current.textContent = e.legenda.texto
          legenda.current.classList.toggle('pensamento', !!e.legenda.pensamento)
        }
      }
      const tt = e.titulo?.texto ?? '', ta = Math.round((e.titulo?.opacidade ?? 0) * 100) / 100
      if (titulo.current && (tt !== antes.titulo || ta !== antes.tituloA)) {
        titulo.current.textContent = tt; titulo.current.style.opacity = String(ta)
        antes.titulo = tt; antes.tituloA = ta
      }
    }
    return () => { painel.current = null }
  }, [painel])
  return (
    <div className="cena-moldura">
      <div className="cena-escuro" ref={escuro} />
      <div className="cena-faixa cima" />
      <div className="cena-faixa baixo" />
      <div className="cena-titulo" ref={titulo} />
      <div className="cena-legenda" ref={legenda} style={{ display: 'none' }}>
        <b ref={quem} /><span ref={texto} />
      </div>
    </div>
  )
}
