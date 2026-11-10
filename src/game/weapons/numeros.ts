// Os números das armas (os mesmos da tabela T do laboratório e do docs/jogo.md), num lugar só. Por enquanto, só o que o
// tiro já usa: a cadência e o que o tiro faz no corpo e na arma. A bala, o dano e a sobrecarga vêm na etapa das armas.
export const TIRO = {
  pronto: 0.85, // quanto da mira precisa estar levantado para sair o tiro (atirar sem mirar levanta a arma antes)
  //   cadencia = s entre tiros (segurando o botão); coice = quanto o cano sobe (rad); recua = quanto a arma vem para trás (m);
  //   volta = quão rápido o coice passa (por s); clarao = quanto tempo o clarão fica no cano (s)
  //   tamanho = o comprimento do clarão (m); cor = a do clarão
  pistola: { cadencia: 0.2, coice: 0.22, recua: 0.03, volta: 10, clarao: 0.05, tamanho: 0.16, cor: '#ffb050' }, // a brasa do Demantino
  escopeta: { cadencia: 1.0, coice: 0.45, recua: 0.06, volta: 4.5, clarao: 0.07, tamanho: 0.26, cor: '#f4ead6', // as fagulhas de sal
    bomba: { apos: 0.3, dura: 0.4 } }, // a mão esquerda puxa a bomba depois do tiro: começa em `apos` s e dura `dura` s
}
