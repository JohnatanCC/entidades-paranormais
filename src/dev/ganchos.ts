// Os ganchos das provas: o que o jogo deixa as provas (dev/provas.ts) mexerem, só no npm run dev.
// Fica separado para o jogo não importar as provas (que não vão para o jogo publicado).
export const ganchos: {
  /** O Testar aberto: põe o agente em (x, z) olhando para yaw (rad) e pitch, no andar dado. */
  ir?: (x: number, z: number, yaw: number, pitch?: number, andar?: number) => void
  /** A cena do Testar aberto (para inspecionar luzes e malhas pelo console). */
  cena?: import('three').Scene
} = {}
