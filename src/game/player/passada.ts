// A passada (etapas A e B das animações): no lugar das ondas simples do laboratório, as curvas de uma passada de
// verdade (as da biomecânica), o quadril, o joelho e o tornozelo ao longo de um ciclo de cada perna, de quando o pé
// toca o chão até ele tocar de novo.
//   Andando:  0 a 0,6  o apoio: o calcanhar toca com a ponta para cima, o joelho dobra um pouco recebendo o peso, o pé
//                      assenta, o corpo passa por cima, o calcanhar sobe e a ponta empurra;
//             0,6 a 1  o balanço: o joelho dobra muito (o pé passa sem raspar no chão), a coxa vai à frente e o joelho estica.
//   Correndo: 0 a 0,35 o apoio: o pé toca com o joelho já dobrado, que dobra mais recebendo o peso (a mola) e estica
//                      empurrando; 0,35 a 0,5 o voo (as duas pernas no ar); o balanço: o calcanhar sobe até perto do
//                      glúteo, o joelho vem alto na frente e a perna desce estendendo antes de tocar.
// Os ângulos são em graus: quadril + = a coxa para a frente (medida da vertical: as tabelas da biomecânica medem da
// bacia, que vai inclinada para a frente; sem descontar, o pé da frente não alcança o chão no passo);
// joelho + = dobrado; tornozelo + = a ponta para cima.
// Quanto cada parte mexe e o tamanho do passo: ANDAR e CORRER, em numeros.ts.

interface Curvas { quadril: number[]; joelho: number[]; tornozelo: number[] }

/** Um ponto a cada 5% do ciclo (o primeiro é o 0; depois do último, volta ao primeiro). No apoio a coxa anda de modo
 *  que o pé no chão corra para trás por igual (o seno do ângulo cai em linha reta, de 20° a −20°): o pé não escorrega. */
const ANDANDO: Curvas = {
  quadril: [20, 16.6, 13.2, 9.9, 6.5, 3.3, 0, -3.3, -6.5, -9.9, -13.2, -16.6, -20, -12, -1, 9, 16, 20, 22, 21.5],
  joelho: [4, 11, 16, 18, 16, 12, 8, 6, 6, 8, 14, 24, 38, 52, 61, 60, 50, 34, 17, 7],
  tornozelo: [0, -5, -6, -2, 2, 5, 7, 9, 9, 8, 5, -4, -15, -14, -4, 4, 7, 6, 4, 2], // no balanço, a ponta sobe (não raspa)
}
/** A corrida: o apoio é curto (35%), o joelho vai muito mais longe no balanço e a coxa sobe mais na frente. */
const CORRENDO: Curvas = {
  quadril: [28, 21, 13, 5, -4, -13, -22, -30, -32, -27, -16, -3, 10, 23, 34, 41, 44, 42, 37, 32],
  joelho: [20, 32, 40, 40, 34, 28, 23, 22, 28, 45, 70, 92, 108, 115, 112, 100, 80, 58, 38, 26],
  tornozelo: [6, 12, 18, 20, 16, 8, -4, -16, -20, -16, -8, 0, 4, 6, 6, 6, 6, 6, 6, 6],
}

// a curva passa por todos os pontos, sem quinas (Catmull-Rom), e dá a volta no fim do ciclo
function curva(pontos: number[], fase: number): number {
  const n = pontos.length, t = (((fase % 1) + 1) % 1) * n, i = Math.floor(t), f = t - i
  const p0 = pontos[(i - 1 + n) % n], p1 = pontos[i % n], p2 = pontos[(i + 1) % n], p3 = pontos[(i + 2) % n]
  return 0.5 * (2 * p1 + (p2 - p0) * f + (2 * p0 - 5 * p1 + 4 * p2 - p3) * f * f + (3 * p1 - p0 - 3 * p2 + p3) * f * f * f)
}
const naFase = (c: Curvas, fase: number) => ({ quadril: curva(c.quadril, fase), joelho: curva(c.joelho, fase), tornozelo: curva(c.tornozelo, fase) })

/** A perna andando, numa fase do ciclo dela (0 = o calcanhar tocando o chão): os três ângulos, em graus. */
export const pernaNaPassada = (fase: number) => naFase(ANDANDO, fase)
/** A perna correndo, numa fase do ciclo dela (0 = o pé tocando o chão): os três ângulos, em graus. */
export const pernaNaCorrida = (fase: number) => naFase(CORRENDO, fase)
