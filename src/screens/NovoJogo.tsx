// O Novo jogo: por enquanto, as demos: a Demo · Intro (docs/intro.md) e a Demo · Inimigos (as hordas de espectrais na
// arena da mansão: chapters/demo-inimigos). Cada uma abre o lobby dela (screens/Lobby: sozinho ou com um amigo). O
// capítulo 1, a mansão, entra depois.
import type { Go } from '../App'
import { DEMOS } from './Lobby'

export function NovoJogo({ go }: { go: Go }) {
  return (
    <div className="tela">
      <h2>Novo jogo</h2>
      <nav className="menu">
        {(['intro', 'inimigos'] as const).map((d) => <button key={d} onClick={() => go(d)}>{DEMOS[d].nome}<span className="tag">{DEMOS[d].tag}</span></button>)}
        <button onClick={() => go('menu')}>Voltar</button>
      </nav>
    </div>
  )
}
