// Os números das armas (os mesmos da tabela T do laboratório e do docs/jogo.md), num lugar só: a cadência, o que o tiro
// faz no corpo e na arma, a munição (as balas da escopeta e a sobrecarga da pistola), a bala e o que ela deixa onde bate.
export const TIRO = {
  pronto: 0.85, // quanto da mira precisa estar levantado para sair o tiro (atirar sem mirar levanta a arma antes)
  //   cadencia = s entre tiros (segurando o botão); coice = quanto o cano sobe (rad); recua = quanto a arma vem para trás (m);
  //   volta = quão rápido o coice passa (por s); clarao = quanto tempo o clarão fica no cano (s)
  //   tamanho = o comprimento do clarão (m); cor = a do clarão
  pistola: { cadencia: 0.2, coice: 0.22, recua: 0.03, volta: 10, clarao: 0.05, tamanho: 0.16, cor: '#ffb050' }, // o plasma (a cor ainda é a da brasa antiga: decide na etapa das armas)
  escopeta: { cadencia: 1.0, coice: 0.45, recua: 0.06, volta: 4.5, clarao: 0.07, tamanho: 0.26, cor: '#f4ead6', // as fagulhas do Demantino
    bomba: { apos: 0.3, dura: 0.4 } }, // a mão esquerda puxa a bomba depois do tiro: começa em `apos` s e dura `dura` s
}

// A munição (weapons/municao.ts), decidida em 12/nov (docs/jogo.md): a escopeta conta as balas; a pistola nunca acaba,
// mas esquenta
export const MUNICAO = {
  //   balas = quantas cabem; porBala = s de recarga por bala que falta (cada uma vale assim que entra); auto = s depois da
  //   última bala até recarregar sozinho; inicio = s até o cartucho chegar em cima da câmara (as balas começam depois);
  //   fim = s depois da última bala (o cartucho some, a mão volta e puxa a bomba)
  escopeta: { balas: 4, porBala: 1, auto: 0.35, inicio: 0.5, fim: 0.35 }, // 13/nov: 1 s por bala (era 1,5; inicio 0,7 e fim 0,45)
  //   tiro = quanto esquenta por tiro (0..1); pausa = s sem atirar até começar a esfriar (atirando sem parar, não esfria);
  //   esfria = por s, e esfriaRapido depois de `espera` s sem atirar; cheia, trava `trava` s e volta em `volta`
  pistola: { tiro: 0.025, pausa: 0.35, esfria: 0.08, esfriaRapido: 0.25, espera: 2, trava: 5, volta: 0.3 },
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

// A bala (weapons/bala.ts; a etapa 4b): os números da tabela do docs/jogo.md. vel = m/s; dano por bala; n = quantas
// saem de uma vez (a escopeta: os bagos) e o leque (rad: o quanto cada uma desvia do centro); tam = o comprimento do
// risco que ela deixa no ar (m). alcance = até onde ela vai (m); passo = de quanto em quanto a conta procura a parede (m)
export const BALA = {
  pistola: { vel: 40, dano: 5, n: 1, leque: 0, tam: 0.45 }, // dano: por tiro (12/nov: era 3)
  escopeta: { vel: 46, dano: 15, n: 5, leque: 0.065, tam: 0.3 }, // dano: por bago (12/nov: era 10)
  alcance: 60, passo: 0.2,
}
// O que a bala deixa onde bate (weapons/impacto.ts): as faíscas (quantas, quanto vivem, a velocidade) e a marca
// queimada na parede ou no chão (quanto fica, o tamanho, m)
export const IMPACTO = { faiscas: 6, vida: 0.3, vel: 3.5, marca: { fica: 8, tam: 0.16 } }
