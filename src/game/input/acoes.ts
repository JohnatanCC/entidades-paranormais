// As ações do jogador. O jogo lê AÇÕES (mover, correr, esquivar, olhar), nunca teclas: assim o controle e o toque
// (celular) entram depois sem mexer no agente. Por enquanto, teclado e mouse:
//   WASD / setas = mover · Shift = correr · Espaço = esquivar · E = interagir (portas) · Q = trocar de arma · mouse (com o cursor travado) = olhar
//   (se o navegador não deixar travar o cursor, olhar é arrastando com o botão esquerdo)
export class Acoes {
  private teclas = new Set<string>()
  private apertou = new Set<string>() // apertadas desde a última leitura (para ações de um toque só)
  private dx = 0
  private dy = 0
  private fora: (() => void)[] = []

  ligar(alvo: HTMLElement) {
    const kd = (e: KeyboardEvent) => {
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault()
      if (!e.repeat) this.apertou.add(e.code)
      this.teclas.add(e.code)
    }
    const ku = (e: KeyboardEvent) => this.teclas.delete(e.code)
    const mm = (e: MouseEvent) => {
      if (document.pointerLockElement !== alvo && !(e.buttons & 1)) return
      // o navegador às vezes manda um salto enorme ao travar: ignora
      if (Math.abs(e.movementX) > 250 || Math.abs(e.movementY) > 250) return
      this.dx += e.movementX; this.dy += e.movementY
    }
    const blur = () => this.teclas.clear()
    window.addEventListener('keydown', kd)
    window.addEventListener('keyup', ku)
    window.addEventListener('mousemove', mm)
    window.addEventListener('blur', blur)
    this.fora.push(() => { window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); window.removeEventListener('mousemove', mm); window.removeEventListener('blur', blur) })
  }
  desligar() { this.fora.forEach((f) => f()); this.fora = []; this.teclas.clear() }

  private tem = (...c: string[]) => c.some((k) => this.teclas.has(k))

  /** Para onde andar, relativo à câmera: x = direita, z = frente (de −1 a 1). */
  mover(): [number, number] {
    return [(this.tem('KeyD', 'ArrowRight') ? 1 : 0) - (this.tem('KeyA', 'ArrowLeft') ? 1 : 0), (this.tem('KeyW', 'ArrowUp') ? 1 : 0) - (this.tem('KeyS', 'ArrowDown') ? 1 : 0)]
  }
  correr() { return this.tem('ShiftLeft', 'ShiftRight') }
  /** Esquivar: true uma vez por aperto do Espaço. */
  esquivar() { const v = this.apertou.has('Space'); this.apertou.delete('Space'); return v }
  /** Interagir (abrir e fechar porta; depois, pegar e usar): true uma vez por aperto do E. */
  interagir() { const v = this.apertou.has('KeyE'); this.apertou.delete('KeyE'); return v }
  /** Trocar de arma (a próxima da lista): true uma vez por aperto do Q. */
  trocarArma() { const v = this.apertou.has('KeyQ'); this.apertou.delete('KeyQ'); return v }
  /** O quanto o mouse andou desde a última leitura (em pixels). */
  olhar(): [number, number] { const r: [number, number] = [this.dx, this.dy]; this.dx = this.dy = 0; return r }
  /** Limpa os apertos não lidos (no fim de cada quadro). */
  fimDoQuadro() { this.apertou.clear() }
}
