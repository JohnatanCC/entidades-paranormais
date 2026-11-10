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
