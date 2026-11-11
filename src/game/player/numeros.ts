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
  vida: 200, // o HUD mostra em %
  invulneravel: 0.9, // s sem tomar dano de novo depois de um golpe
  kit: 60, // quanto o kit médico (F) cura
}

// O cabelo (corpo/molas.ts): as mechas balançam com a gravidade e o tranco da cabeça
export const CABELO = {
  mola: 45, // quão rápido volta (mais = mais duro)
  amortece: 5, // quanto acalma (menos = balança mais)
  tranco: 0.45, // quanto o tranco da cabeça empurra (0 = só a gravidade)
  trancoMax: 30, // m/s²: corta os saltos (teleporte, primeiro quadro)
  solto: 0.9, // rad: o máximo que a mecha abre para fora
  preso: 0.1, // rad: o máximo que ela vai para dentro (para o lado da cabeça)
  zona: { tras: -0.06, frente: 0.07, lado: 0.11 }, // m em volta da cabeça: as da nuca, as da franja, as dos lados
}

// A câmera por cima do ombro direito, como no RE4 remake; mirando, ela chega mais perto e fecha (mira)
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
  mira: { atras: 1.25, lado: 0.62, acima: 0.06, fov: 46, entra: 10 }, // mirando: mais perto, mais de lado, fechada; entra = quão rápido (por s)
  alcanceMira: 25, // m: o ponto para onde a arma aponta, na frente da câmera
}

// O andar (player/passada.ts e animacao.ts): o tamanho do passo e quanto o quadril, o tronco e os braços acompanham.
// Depois cada personagem ganha os seus (a Lara mais leve, o Victor mais lento)
export const ANDAR = {
  passada: 1.69, // m andados num ciclo (um passo de cada perna), na velocidade de andar: medido para o pé não escorregar
  perna: 0.875, // m: a perna do Matheus, com que a passada foi medida (outra perna, o passo cresce ou encolhe junto)
  curto: 0.68, // devagar (mirando), o passo encolhe até esta fração, e as curvas junto (medido: o pé não escorrega)
  virar: 0.6, // rad: andando de lado (mirando), as pernas dão o passo virado até aqui para o lado do movimento
  quadril: 1.45, joelho: 1.1, tornozelo: 1, // quanto das curvas da passada cada junta faz (o andar do jogo é rápido: passo largo)
  giro: 0.09, // rad: o quadril gira levando à frente o lado da perna da frente (o tronco desfaz)
  queda: 0.05, // rad: o quadril cai do lado da perna que está no ar
  lado: 0.022, // m: o quadril vai para o lado do pé de apoio
  braco: { frente: 18, tras: 10, atraso: 0.06 }, // graus para a frente e para trás; o atraso (fração do ciclo) atrás da perna
  cotovelo: { base: 0.08, balanco: 0.26, atraso: 0.08 }, // rad: o cotovelo dobra mais quando o braço vem à frente, um pouco depois
}

// A corrida (player/passada.ts e animacao.ts): como o andar, mais o voo e o corpo inclinado
export const CORRER = {
  passada: 2.9, // m corridos num ciclo (um passo de cada perna), com a perna do Matheus: medido para o pé não escorregar
  quadril: 1, joelho: 1, tornozelo: 1, // quanto das curvas da corrida cada junta faz
  apoio: 0.35, // a fração do ciclo com o pé no chão (o que passa disso até o outro pé tocar é o voo)
  voo: 0.05, // m: o quanto o corpo sobe no voo
  desce: 0.03, // m: o quanto ele desce no meio do apoio (a perna dobra recebendo o peso)
  inclina: 0.2, // rad: o corpo inclinado para a frente (um pouco no quadril, o resto na coluna)
  giro: 0.07, queda: 0.06, lado: 0.008, // o quadril: como no andar (o tronco desfaz)
  braco: { frente: 30, tras: 40, atraso: 0.03 }, // graus; bombeando: mais para trás que para a frente
  cotovelo: { base: 1.3, balanco: 0.35, atraso: 0.05 }, // rad: dobrado perto de 90°, fecha mais na frente
}

// As transições (animacao.ts): o corpo inclina ao acelerar e ao frear, deita para dentro da curva e, parando, termina
// o passo até o próximo pé tocar o chão
export const TRANSICAO = {
  acelera: 0.03, // rad por m/s²: o quanto inclina para a frente acelerando (para trás freando)
  inclinaMax: 0.2, // rad: o máximo dessa inclinação
  curva: 0.04, // rad por (rad/s × m/s): o quanto deita para dentro da curva (mais rápido e mais fechada, mais)
  curvaMax: 0.22, // rad: o máximo
  suave: 7, // quão depressa as inclinações chegam e somem
  termina: 1.8, // ciclos por segundo: parando, a perna no ar termina o passo até tocar
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

// Mirar (player/mira.ts): a arma levantada para onde a câmera mira. Pontos no espaço do peito (x = esquerda do agente)
export const MIRA = {
  sobe: 12, desce: 7, // quão rápido a arma levanta e abaixa (por s)
  andar: 1.45, // m/s: mirando, ele anda devagar e não corre (como no RE4; o número do docs/jogo.md)
  ombros: [-0.03, 0.42, 0], // de onde os braços saem para a pistola (entre os ombros, um pouco para a direita)
  pistola: { alcance: 0.45 }, // m do meio dos ombros até a empunhadura: os braços quase esticados, as duas mãos
  escopeta: { coronha: [-0.13, 0.4, 0.08], lado: -0.7 }, // a coronha no ombro direito; o corpo vira de lado (rad): a esquerda alcança a bomba
}

// A queda (player/queda.ts), sem violência: perde as forças, cai de joelhos e tomba de lado; desacordado (respira)
export const QUEDA = {
  cede: 0.3, // s: a cabeça cai, o tronco curva, os joelhos amolecem
  joelhos: [0.22, 0.6], // s: de joelhos (do começo ao fim)
  tomba: [0.65, 1.15], // s: tomba de lado
  lado: -1, // para que lado tomba: −1 = a esquerda dele (a mão da arma fica por cima, à vista)
  escurece: 1.5, // s: a tela começa a escurecer (o Testar)
  volta: 2.9, // s: volta no checkpoint (com a tela escura)
}

// Tomar dano e ficar machucado (player/dano.ts): só a animação (decidido em 10/nov: machucado não muda a velocidade)
export const DANO = {
  tranco: 0.45, // s: o tranco de um golpe (vem da direção do golpe)
  machucado: 0.3, // com a vida nesta fração ou menos, ele fica machucado (curvado, mancando, a mão livre no lado)
  entra: 2, sai: 3, // quão rápido o corpo fica machucado e se recupera (por s)
}
