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

// A armadilha jogada (weapons/armadilha.ts): os números do laboratório (11 m/s para onde mira, mais 1,6 para cima)
export const ARREMESSO = {
  forca: 11, sobe: 1.6, // m/s para o ponto mirado, e a mais para cima (o arco)
  solta: [-0.27, 1.5, 0.37], // de onde ela sai, no espaço do agente: onde a lanterna está no instante de soltar (à frente do ombro direito)
  dura: 0.45, soltaEm: 0.4, // a animação do arremesso (s) e em que parte dela a armadilha sai da mão
  passo: 0.06, // m: a conta do voo anda nesses passos (não atravessa parede fina)
  maxVoo: 4, // s: voando mais que isso, para onde estiver
  volta: 16, chega: 0.25, // chamada de volta: m/s até a mão, e a que distância ela já está na mão
  arco: { pontos: 60, dt: 0.035 }, // a linha do arco na mira: quantos pontos e o tempo entre eles (s)
}
