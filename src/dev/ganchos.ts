// Os ganchos das provas: o que o jogo deixa as provas (dev/provas.ts) mexerem, só no npm run dev.
// Fica separado para o jogo não importar as provas (que não vão para o jogo publicado).
export const ganchos: {
  /** O Testar aberto: põe o agente em (x, z) olhando para yaw (rad) e pitch, no andar dado. */
  ir?: (x: number, z: number, yaw: number, pitch?: number, andar?: number) => void
  /** A cena do Testar aberto (para inspecionar luzes e malhas pelo console). */
  cena?: import('three').Scene
  /** O desenhista do Testar aberto (para inspecionar as sombras e a contagem). */
  gl?: import('three').WebGLRenderer
  /** O relógio da cena aberta no Ver cenas (para as provas tocarem e gravarem uma cena). */
  relogio?: import('../game/cenas/TocarCena').Relogio
  /** A cena aberta no Ver cenas (dev/gravar.ts grava esta). */
  cenaAberta?: import('../game/cenas/tipos').Cena
  /** A câmera da tela aberta (o criador de mapas, o Ver cenas: dev/GanchosDaTela.tsx). */
  camera?: import('three').Camera
  /** O controle do agente na fase (o que os inimigos ferem; os alvos das balas). */
  fase?: import('../game/Testar').AgenteNaFase
} = {}
