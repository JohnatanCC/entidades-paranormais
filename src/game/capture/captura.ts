// A captura de um fantasma (o jogo novo; o primeiro capturável é o Devora espectros): com a vida zerada ele fica fraco
// e aparece o ícone da lamparina em cima dele. Erguer a lamparina com ele no feixe começa a captura: ele começa a ser
// absorvido e aparece a barra de força dele. Cada tiro baixa a força; sem tiro, ela volta a subir (ele resiste). Força
// em 20% ou menos: ele é absorvido para a lamparina e o agente ganha vida. Baixar a lamparina (ou tirar ele do feixe)
// solta; força cheia por um tempo, ele se solta sozinho e volta a caçar.
// Quem tem o fantasma chama passoCaptura a cada quadro e tiroNaCaptura a cada tiro; os números aqui (CAPTURA).

/** comeca = a força quando a captura começa (%); fim = com ela nisso ou menos, capturou; porDano = quanto cada ponto de
 *  dano do tiro tira da força (a pistola tira 5 por tiro; a escopeta abaixa a lamparina); recupera = %/s que ela volta
 *  sem tiro; solta = s fora do feixe até a captura soltar; rompe = s com a força cheia até ele se soltar sozinho (conta
 *  desde o começo: o jogador tem esse tempo para começar a atirar);
 *  absorve = s até sumir na lamparina; cura = a vida que o agente ganha (o agente tem 200); puxa = m/s que ele vem para
 *  a lamparina enquanto é capturado. */
export const CAPTURA = { comeca: 100, fim: 20, porDano: 1, recupera: 8, solta: 0.6, rompe: 4, absorve: 1.2, cura: 50, puxa: 0.35 }

export interface Captura { forca: number; fora: number; cheia: number }
export const novaCaptura = (): Captura => ({ forca: CAPTURA.comeca, fora: 0, cheia: 0 })

/** Um quadro da captura: a força volta a subir; no feixe ou não. Devolve o que aconteceu: segue, solta (saiu do
 *  feixe) ou rompe (ele se soltou com a força cheia). */
export function passoCaptura(c: Captura, noFeixe: boolean, dt: number): 'segue' | 'solta' | 'rompe' {
  c.forca = Math.min(100, c.forca + CAPTURA.recupera * dt)
  c.fora = noFeixe ? 0 : c.fora + dt
  c.cheia = c.forca >= 100 ? c.cheia + dt : 0
  if (c.fora > CAPTURA.solta) return 'solta'
  if (c.cheia > CAPTURA.rompe) return 'rompe'
  return 'segue'
}

/** Um tiro durante a captura: baixa a força. true = chegou no fim (capturou). */
export function tiroNaCaptura(c: Captura, dano: number): boolean {
  c.forca = Math.max(0, c.forca - dano * CAPTURA.porDano)
  return c.forca <= CAPTURA.fim
}
