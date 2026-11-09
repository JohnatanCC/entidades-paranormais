import type { Go } from '../App'

export function MainMenu({ go }: { go: Go }) {
  return (
    <div className="tela">
      <h1>Entidades<br />Paranormais<small>C.R.O.S · ARQUIVO 01</small></h1>
      <nav className="menu">
        <button disabled>Novo jogo<span className="tag">EM BREVE</span></button>
        <button onClick={() => go('config')}>Configurações</button>
        <button onClick={() => go('dev')}>Modo desenvolvedor</button>
      </nav>
      <div className="rodape">versão de desenvolvimento</div>
    </div>
  )
}
