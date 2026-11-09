import type { Go } from '../App'

export function DevMenu({ go }: { go: Go }) {
  return (
    <div className="tela">
      <h2>Modo desenvolvedor</h2>
      <nav className="menu">
        <button onClick={() => go('mapas')}>Criador de mapas</button>
        <button disabled>Editor de modelos<span className="tag">EM BREVE</span></button>
        <button onClick={() => go('menu')}>Voltar</button>
      </nav>
    </div>
  )
}
