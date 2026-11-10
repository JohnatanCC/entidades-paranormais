// Os números do agente, num lugar só (os mesmos da tabela T do laboratório e do docs/jogo.md). Mexa aqui para ajustar.
export const AGENTE = {
  andar: 2.4, // m/s
  correr: 4.6,
  acel: 16, // m/s² acelerando
  freio: 22, // m/s² freando
  folego: 6, // segundos de corrida
  folegoVolta: 1.4, // quanto o fôlego volta por segundo
  esquiva: { dist: 2.7, dur: 0.5, recarga: 0.7 }, // a cambalhota: distância (m), duração e espera (s)
  raio: 0.3, // o corpo no chão (m)
}

// A câmera por cima do ombro direito, como no RE4 remake (sem mirar ainda)
export const CAMERA = {
  atras: 2.5, // m atrás do agente
  lado: 0.56, // m para a direita
  acima: 0.16,
  altura: 1.6, // a altura do pivô (o ombro) acima dos pés
  alturaEsquiva: 1.25, // na cambalhota o pivô desce
  fov: 60,
  fovCorrendo: 3, // abre um pouco correndo
  sens: 0.0022, // radianos por pixel do mouse (× a sensibilidade das configurações)
  pitchMin: -0.95,
  pitchMax: 0.8,
}

// Parado (player/parado.ts): a respiração, o peso trocando de perna, o balanço da arma e os gestos sozinhos
export const PARADO = {
  espera: [8, 15], // segundos parado até o próximo gesto (sorteado entre os dois)
  respira: 0.012, // quanto o peito sobe a mais quando está parado (rad)
  peso: { volta: 7.5, quadril: 0.05, joelho: 0.22 }, // o peso vai e volta de uma perna para a outra em `volta` s
  balanco: { braco: 0.025, pulso: 0.045 }, // com a pistola na guarda: quanto o braço e o pulso derivam (rad)
  sai: 9, // quão rápido o gesto some quando é cortado (andar, esquivar, trocar de arma)
}

// A armadilha na mão (player/arma.ts): pendurada pela alça, balança como um pêndulo; o vidro aceso respira
export const ARMADILHA = {
  pendulo: { comprimento: 0.1, amortece: 2.2, limite: 1.0 }, // m da alça ao peso; quanto acalma (por s); o máximo que abre (rad)
  brilho: { volta: 3.4, minimo: 0.7 }, // s de uma respiração do vidro; o mais fraco (1 = o brilho cheio)
}

// A escopeta na mão (player/arma.ts), pesada: com as duas mãos (a esquerda na bomba); parado um tempo, apoiada no ombro.
// Pontos e direções no espaço do peito (x = esquerda do agente, y = cima, z = frente; a origem na cintura)
export const ESCOPETA = {
  guarda: { pega: [-0.15, 0.0, 0.22], cano: [0.85, -0.3, 0.45], sobe: 0.12, passo: 0.012 }, // a empunhadura, para onde o cano aponta; quanto sobe correndo e sacode no passo (m)
  ombro: { pega: [-0.19, 0.3, 0.2], cano: [-0.12, 0.72, -0.68], cima: [0, -0.7, -0.7], espera: 1.2, vai: 2.5, volta: 9 }, // apoiada: o cano para cima e para trás; espera = s parado até apoiar
  peso: 0.035, // quanto o peito vai para trás com a escopeta na frente (rad)
  bomba: { curso: 0.07 }, // quanto a bomba corre para trás (m)
}
