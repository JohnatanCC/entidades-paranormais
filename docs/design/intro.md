# Intro: a instalação da C.R.O.S.

A Intro é a primeira demo do jogo. O agente, Lara e Nicolas descem a uma instalação da própria C.R.O.S. para recapturar o Glutão, que cresceu, rompeu a contenção e soltou os Espectrais. Ela ensina a captura e termina na luta contra o Glutão, na usina. Ela já está jogável no laboratório (botão Intro), do elevador até o relatório final.

## A planta

Um caminho só, do elevador à usina, numa área de cerca de 54 × 86 m. Os corredores têm 5 m de largura (o corredor dos fundos da casa atual tem 3,6 m) e a usina tem 12 m de pé-direito, para caber o Glutão maior. É uma região só, sem tela de carregamento, com três checkpoints: a eclusa, a entrada do refeitório e a enfermaria.

&#91;image: Planta da Intro: eclusa, corredores, escritório, refeitório, enfermaria e usina, com a sequência numerada\]

| Sala | Medidas (m) | Pé-direito | O que acontece |
| --- | --- | --- | --- |
| Eclusa | 10 × 10 | 3,5 m | Chegada de elevador; a barreira na porta |
| Corredor 1 | 22 × 5 | 3,5 m | Lara e Nicolas na frente; portas lacradas de cenário |
| Escritório | 12 × 12 | 3,5 m | A cutscene e o tutorial da armadilha |
| Corredor 2 | 9 × 5 | 3,5 m | Os três caminham devagar |
| Refeitório | 24 × 18 | 4,5 m | A fuga da Lara e as três ondas |
| Corredor 3 | 12 × 5 | 3,5 m | Canos; o respiro antes do chefe |
| Enfermaria | 8 × 6 | 3,5 m | Kits e checkpoint |
| Usina | 42 × 32 | 12 m | A luta contra o Glutão |

## A sequência

1. **Eclusa.** Os três descem de elevador e atravessam a barreira sobrenatural que prende os fantasmas lá dentro.
2. **Corredor 1.** Lara e Nicolas vão na frente e o jogador segue. Eles param na porta do escritório e esperam.
3. **Escritório.** Com o jogador perto da porta, começa a cutscene: Lara entra primeiro, o lugar está escuro e ela aponta a lanterna para uma mesa. A câmera passa para a visão dela, em primeira pessoa. Ela avança, surge um Espectral, Lara e Nicolas atiram e ele se desfaz. A cutscene acaba e o jogador joga a armadilha: é o tutorial da captura.
4. **Corredor 2.** Os três caminham devagar até o refeitório.
5. **Refeitório.** Outro Espectral aparece e foge da Lara, que vai na frente. Lara corre atrás dele pela porta sul e Nicolas vai atrás. Um Espectral surge na frente do jogador e o ectoplasma endurece sobre as duas portas da sala: começam as ondas.
6. **Corredor 3 e enfermaria.** Sem luta. Kits e checkpoint antes do chefe.
7. **Usina.** O Glutão, maior, com Lara e Nicolas visíveis dentro da barriga. Capturado, ele solta os dois no chão. Na cutscene final, Matheus chega perto dos dois, desacordados e cobertos de ectoplasma, e fala pelo rádio: "Área limpa. Preciso de uma equipe médica na usina." A central responde entre chiados, a tela escurece e vem o relatório.

## Como a Intro ensina

Cada controle e cada regra aparecem uma vez, no lugar em que o jogador precisa deles, e nunca dois ao mesmo tempo. As armas têm munição infinita: o limite é a sobrecarga, e a Intro ensina a trocar de arma para nunca ficar parado.

| Onde | Ensina | Como |
| --- | --- | --- |
| Eclusa | Andar e olhar | Avisos de WASD e do mouse, que somem quando o jogador anda |
| Corredor 1 | Correr e fôlego | Se o jogador fica para trás, aviso de Shift; a barra de fôlego aparece |
| Escritório | Escolher arma pelo número e jogar a armadilha | Depois da cutscene: 3 pega a armadilha, botão direito mira, esquerdo joga. O Espectral espera desfeito |
| Refeitório, onda 1 | Mirar, atirar e capturar | Um Espectral só. Quando ele se desfaz, o anel dos 4 s e o aviso da armadilha |
| Refeitório, onda 2 | Esquivar e capturar em área | No primeiro ataque, aviso de Espaço. Dois desfeitos juntos: uma armadilha pega os dois |
| Refeitório, onda 3 | Sobrecarga e troca rápida | Com a pistola em 70%, aviso de 2 ou Q para a escopeta; Nicolas lembra pelo rádio. A roda (Tab ou rodinha) aparece aqui |
| Enfermaria | Kits | Ao pegar o kit, aviso de F |
| Usina | O núcleo e a disputa pelos Espectrais | Na primeira vez que o tiro acerta o núcleo, aviso de dano cheio. Capturar os Espectrais que ele cospe impede que ele se cure |

Regras dos avisos:

- Ficam embaixo da tela, com o ícone da tecla, e somem quando o jogador faz a ação, não por tempo.
- Se o jogador já fez a ação antes, o aviso não aparece.
- A barra de sobrecarga fica junto da mira, uma por arma, e muda de cor perto do limite.
- Todos os controles ficam numa página do menu de pausa.
- Lara e Nicolas reforçam com falas curtas, mas o aviso na tela é o que ensina.

## Lara e Nicolas

Eles não têm IA de combate: seguem uma rota marcada e só lutam nas cutscenes.

- Andam de 4 a 6 m à frente do jogador e param quando ele fica para trás.
- Param em cada porta da rota, virados para o jogador, até ele chegar perto.
- Não colidem com o jogador, para nunca travar a passagem.
- Usam o modelo do agente com outras cores e outro cabelo; uma roupa nova do agente depois vale para os três.
- A lanterna da Lara é uma luz real só dentro da cutscene; fora dela, é um cone 2D.

## A captura dos fantasmas pequenos

Hoje o Espectral e o Glutão morrem; na Intro, eles passam a ser capturados.

- Com a vida zerada, o fantasma se desfaz numa poça de ectoplasma por 4 s, com um anel que mostra o tempo acabando.
- A armadilha jogada na poça captura o fantasma. Ela puxa todos os fantasmas desfeitos que estiverem num raio de cerca de 3 m.
- Se o tempo acaba, ele volta com metade da vida.
- A armadilha passa a valer em toda luta (hoje ela só funciona na luta da Mãe).
- No tutorial do escritório, o primeiro Espectral espera desfeito até o jogador capturá-lo, sem tempo.
- Os chefes únicos, como a Mãe, continuam com a regra atual: barra zerada, enfraquecido, e captura com chance.

## As ondas do refeitório

As portas ficam fechadas até a última onda acabar, e toca a música de tensão.

| Onda | Espectrais na sala | Acaba quando |
| --- | --- | --- |
| 1 | 1 | 1 capturado |
| 2 | 2 | os 2 capturados |
| 3 | 2 ao mesmo tempo; cada captura chama outro | 4 capturados |

São 7 Espectrais no total. Com o último, o ectoplasma da grade amolece (abaixo).

## O ectoplasma nas portas

Uma mecânica nova: obstáculos que se destroem a tiro. Ela substitui as portas trancadas sem explicação: o jogador vê por que não dá para sair.

- Quando a briga começa, o ectoplasma cresce sobre as portas da sala em meio segundo e bloqueia a passagem.
- Endurecido, a bala bate e volta. O E na porta faz o Matheus dizer que não cede enquanto houver Espectral por perto.
- Limpa a sala, a câmera corta para a saída (barras pretas, 3,6 s, Espaço pula) e o ectoplasma amolece na frente do jogador: clareia, balança e pinga.
- Amolecido, ganha o ícone da arma com "atire". O E faz o Matheus dizer que precisa tirar o ectoplasma primeiro. Tem 60 de vida: dois tiros de escopeta.
- O da porta de entrada continua duro: o caminho é para a frente.
- O close aparece uma vez por encontro, só no fim. A mesma peça serve para outras salas e para a casa.

## O Glutão na usina

- Cerca de 1,6 vez o tamanho atual. A usina e os quatro geradores dão espaço e cobertura.
- Lara e Nicolas aparecem encolhidos dentro da barriga, no lugar das almas que giram no núcleo.
- Os ataques são os de hoje: pancada e investida, cuspir Espectrais e, com pouca vida, devorar um deles para se curar. Só o núcleo leva dano cheio.
- Uma barra de vida. Zerada, ele se desfaz por 4 s; capturado, solta os dois no chão. Se o tempo acaba, volta com metade da vida.
- As portas da usina fecham durante a luta e toca a música de batalha do Glutão.
- Depois da cutscene final, a tela de relatório com o título "INTRO".

## O que reaproveita e o que é novo

| Parte | Reaproveita do laboratório | Novo |
| --- | --- | --- |
| Agente | Modelo, câmera, armas, kits, esquiva | — |
| Espectrais e Glutão | Modelos, ataques, sons, a explosão do núcleo | Desfazer por 4 s; Glutão maior; os dois na barriga |
| Armadilha | Modelo, arremesso, captura da Mãe | Valer em toda luta; capturar em área |
| Ondas | O sistema de ondas do Bando | A onda com reposição |
| Lara e Nicolas | O modelo do agente | Cores, cabelo, a rota e a espera nas portas |
| Cutscene | — | Câmera por pontos, visão em 1ª pessoa, barras pretas, legenda, voz em som, pular |
| Cenário | Portas que fecham, bake, sombra e luz 2D | Concreto, metal, faixa de aviso, azulejo, piso de grade; mesas, geradores, canos, o núcleo da barreira |
| Música | Tensão e a do Glutão | — |

## As etapas

Cada etapa vira uma versão que você testa antes da próxima.

1. **A planta navegável (v117).** Salas, portas, colisão, texturas e luzes 2D; dá para andar do elevador até a usina.
2. **O traje novo (v120).** O traje Selado: runas que acendem com a sobrecarga, relicário, frascos, cartuchos de sal.
3. **Lara e Nicolas (v121).** Os dois seguem a rota alguns metros à frente, esperam nas portas e abrem quando você chega perto.
4. **A captura nova (v122).** Zerado, o Espectral vira uma poça com um anel de 4 s; a armadilha puxa todas as poças em até 2,8 m.
5. **O refeitório (v123).** A fuga da Lara (cena curta) e as três ondas; um kit a cada onda limpa.
6. **O escritório (v124).** A cena da lanterna, com a câmera nos olhos da Lara, e o tutorial da armadilha (a poça espera, sem tempo).
7. **A usina (v125).** O Glutão 1,6 vez maior, os dois encolhidos na barriga, a captura dele, a cena do rádio e o relatório "INTRO".
8. **Acabamento (v125).** Avisos de controle embaixo da tela, a voz de cada personagem (som + legenda), o rádio com chiado, os dois kits da enfermaria e os nomes novos das armas.

A cutscene vem depois da captura nova porque depende dela.

## Fica de fora

- Dublagem: por enquanto, cada personagem fala com um som próprio e a legenda.
- IA de combate para Lara e Nicolas.
- A aparência das armas de sal grosso e Demantino (o traje entrou na etapa 2).
- Tela de carregamento.

## Decisões

- **O agente:** Matheus Moura.
- **Pistola:** atira Demantino, um ferro extraído dos objetos amaldiçoados. A escopeta atira sal grosso. As duas têm munição infinita e o limite é a sobrecarga.
- **Falas:** Matheus, Lara e Nicolas falam com um som próprio de cada um, com legenda, até a dublagem. A central do rádio usa o mesmo recurso, com chiado.
- **Final:** a Intro termina com a cutscene do rádio, depois escurece e mostra o relatório.
