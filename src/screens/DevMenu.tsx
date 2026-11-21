import type { Go } from '../App'

export function DevMenu({ go }: { go: Go }) {
  return (
    <div className="tela">
      <h2>Modo desenvolvedor</h2>
      <nav className="menu">
        <button onClick={() => go('mapas')}>Criador de mapas</button>
        <button onClick={() => go('modelos')}>Ver modelos<span className="tag">OS PERSONAGENS DE PERTO</span></button>
        <button onClick={() => go('cenas')}>Ver cenas<span className="tag">AS CUTSCENES</span></button>
        <button onClick={() => go('online')}>Teste online<span className="tag">DOIS JOGADORES</span></button>
        <button onClick={() => go('menu')}>Voltar</button>
      </nav>
    </div>
  )
}
