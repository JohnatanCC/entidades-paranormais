// O Novo jogo: por enquanto, só a Demo · Intro (docs/intro.md). O capítulo 1, a mansão, entra depois.
import type { Go } from '../App'

export function NovoJogo({ go }: { go: Go }) {
  return (
    <div className="tela">
      <h2>Novo jogo</h2>
      <nav className="menu">
        <button onClick={() => go('intro')}>Demo · Intro<span className="tag">O SUBMUNDO</span></button>
        <button onClick={() => go('menu')}>Voltar</button>
      </nav>
    </div>
  )
}
