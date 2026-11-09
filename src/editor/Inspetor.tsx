// O Painel Inspetor: uma janela flutuante, separada do painel das ferramentas, com as configurações do que está escolhido
// (objeto, porta, janela, escada). Arraste pela barra de cima para mudar de lugar; o lugar fica guardado no navegador.
import { useEffect, useRef, useState, type ReactNode } from 'react'

const CHAVE = 'entidades.editor.inspetor'
interface Pos { x: number; y: number }

function lerPos(): Pos | null {
  try { const p = JSON.parse(localStorage.getItem(CHAVE) || 'null'); return p && typeof p.x === 'number' && typeof p.y === 'number' ? p : null } catch { return null }
}

export function Inspetor({ titulo, onFechar, children }: { titulo: string; onFechar: () => void; children: ReactNode }) {
  const caixa = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<Pos | null>(lerPos)
  const arrasto = useRef<{ dx: number; dy: number } | null>(null)

  // sem lugar guardado: no canto de cima, à direita da vista
  useEffect(() => {
    if (pos || !caixa.current?.parentElement) return
    const pai = caixa.current.parentElement.getBoundingClientRect()
    setPos({ x: pai.width - caixa.current.offsetWidth - 16, y: 16 })
  }, [pos])

  // não deixa a janela sumir para fora da vista (a vista pode ter encolhido)
  const prender = (p: Pos): Pos => {
    const pai = caixa.current?.parentElement?.getBoundingClientRect(), el = caixa.current
    if (!pai || !el) return p
    return { x: Math.min(Math.max(0, p.x), pai.width - el.offsetWidth), y: Math.min(Math.max(0, p.y), pai.height - 40) }
  }

  function down(e: React.PointerEvent) {
    if (!pos || e.button !== 0) return
    arrasto.current = { dx: e.clientX - pos.x, dy: e.clientY - pos.y }
    ;(e.target as Element).setPointerCapture(e.pointerId)
  }
  function move(e: React.PointerEvent) {
    if (arrasto.current) setPos(prender({ x: e.clientX - arrasto.current.dx, y: e.clientY - arrasto.current.dy }))
  }
  function up() {
    if (!arrasto.current) return
    arrasto.current = null
    try { localStorage.setItem(CHAVE, JSON.stringify(pos)) } catch { /* sem armazenamento: vale só agora */ }
  }

  return (
    <div ref={caixa} className="inspetor" style={pos ? { left: pos.x, top: pos.y } : { right: 16, top: 16 }}
      onPointerDown={(e) => e.stopPropagation()} onWheel={(e) => e.stopPropagation()}>
      <div className="inspetor-topo" onPointerDown={down} onPointerMove={move} onPointerUp={up} title="Arraste para mover">
        <span className="pega" aria-hidden>⋮⋮</span>
        <b>Inspetor</b>
        <span className="titulo-insp">{titulo}</span>
        <button onPointerDown={(e) => e.stopPropagation()} onClick={onFechar} aria-label="Fechar (Esc)" title="Fechar (Esc)">✕</button>
      </div>
      <div className="inspetor-corpo">{children}</div>
    </div>
  )
}
