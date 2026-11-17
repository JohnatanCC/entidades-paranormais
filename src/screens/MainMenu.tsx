import type { Go } from '../App'

export function MainMenu({ go }: { go: Go }) {
  return (
    <div className="tela">
      <h1>Agentes<br />CROS<small>ARQUIVO 01</small></h1>
      <nav className="menu">
        <button onClick={() => go('novo')}>Novo jogo</button>
        <button onClick={() => go('config')}>Configurações</button>
        <button onClick={() => go('dev')}>Modo desenvolvedor</button>
      </nav>
      <div className="rodape">versão de desenvolvimento</div>
    </div>
  )
}
