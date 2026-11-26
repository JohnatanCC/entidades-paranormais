// Os números da Demo · Inimigos (o roteiro: Roteiro.tsx). Pontos de partida, para ajustar jogando.

/** As hordas, em ordem: quantos de cada espectral e quantos deles nascem aprimorados de certeza (forte; os outros têm a
 *  sorte de sempre). Os grandes são fantasmas (o Manto espectral, o Devora espectros e o Asa do terror): contam até ser
 *  capturados com a lamparina. */
export const HORDAS: { sombra: number; asa: number; manto?: number; devora?: number; terror?: number; forte?: number }[] = [
  { sombra: 3, asa: 0 },
  { sombra: 3, asa: 2 },
  { sombra: 2, asa: 2, manto: 1 },
  { sombra: 3, asa: 2, devora: 1 },
  { sombra: 2, asa: 2, terror: 1 },
  { sombra: 3, asa: 2, manto: 1, terror: 1, forte: 2 },
]

/** O tempo (s): o aviso antes de cada horda, a pausa depois de limpar uma e o intervalo entre um espectral e o próximo. */
export const TEMPO = { comeca: 3, entre: 5, surge: 0.7 }

/** Onde os espectrais surgem (x, z, m: no chão do salão, longe das colunas) e o quanto longe do agente, no mínimo (m). */
export const NASCER = {
  pontos: [[10, 16], [22, 16], [16, 23], [16, 25], [8, 13], [24, 13], [8, 20], [24, 20], [12, 25], [20, 25], [11, 7], [21, 7]] as [number, number][],
  longe: 7,
}

/** Onde o agente volta depois de cair (x, z, m; e para onde olha, graus): o começo, de frente para o salão. */
export const VOLTA = { x: 16, z: 9, yaw: 0 }
