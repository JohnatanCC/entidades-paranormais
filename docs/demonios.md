# Os Sombrios: os demônios

Decidido em 12/nov. Os Sombrios são os demônios do submundo: entram na mansão pela ruptura. **Não são fantasmas**:
nunca foram gente, não estão presos a objeto nenhum e **não são capturados**. Com a vida zerada, estouram num respingo
de matéria escura (a regra dos menores, em "Destruir ou capturar" no `docs/jogo.md`), inclusive o mini-chefe.
Substituem o Espectral, que saiu do projeto.

| Sombrio | Papel | Conceito escolhido |
| --- | --- | --- |
| Assombrado | comum, de perto, lento | A · gota com capuz |
| Asa sombria | comum, voa e atira de longe, às vezes desvia | A · morcego de capuz |
| Devora almas | mini-chefe: nada por baixo do chão e engole | B · tubarão-lula |

## A família (o que os três têm em comum)

- **O corpo de matéria escura:** preto, quase sem textura; as bordas de cada bloco um pouco mais claras (um cinza-arroxeado
  bem escuro), para a silhueta ler no escuro junto com o contorno de luz.
- **O tecido vermelho-escuro rasgado** (capuz, manto), com a dobra mais escura pintada: é a única cor do corpo.
- **O vermelho vivo que brilha** (blocos `luz_`): os olhos do Assombrado, o núcleo da boca da Asa sombria e os olhos, os
  dentes e o interior da boca do Devora almas. É o que o jogador vê primeiro no escuro.
- **A matéria pingando em cubos:** pingos pendurados embaixo do corpo, que balançam.
- **A referência é só de clima** (as sombras do Don't Starve, imagens do desenvolvedor): a mancha preta, o vermelho e os
  pingos. Não copiar o desenho deles: nada da boca branca em zigue-zague, da faixa amarrada no corpo nem do corpo em
  gota com chifres. Os dentes daqui são vermelhos, e o tecido é capuz e manto.
- **Leves:** cada um é uma malha só com ossos e um material, com textura pequena; cópias do mesmo Sombrio dividem a
  geometria e o material (`copiaDoMolde`, em `src/render/bbmodel.ts`). Os projéteis e os respingos são reaproveitados
  (um estoque fixo, nada criado no meio da luta).

## Os modelos

Em `modelos/demonios/<nome>.bbmodel` (a pasta nasce com o primeiro), com 64 px por metro, como os personagens. As regras
do Blockbench valem iguais (`docs/blockbench.md`): o ponto de giro de cada pasta é a junta, a frente é o sul (+Z), uma
textura por modelo, o detalhe vai dentro das pastas (o que pesa é pasta nova, não bloco). As pastas abaixo são a
proposta; o nome é o que o código procura.

### Assombrado (gota com capuz) ✅ modelo e animações (12/nov)

Uma gota de matéria escura com capuz, equilibrada numa perna só. **1,57 m** até a ponta do capuz. O modelo de partida
(`modelos/demonios/assombrado.bbmodel`, 101 blocos, textura 256 × 512) nasceu de um gerador, como os outros: é para
retocar no Blockbench. No jogo: 2 chamadas de desenho (o corpo e os olhos), e vários Assombrados dividem a geometria,
o material e a textura (o primeiro é o molde; os outros são cópias com os ossos próprios).

- **O corpo:** uma gota chanfrada, larga e barriguda embaixo (0,75 m; a barriga sai para a frente, abaixo do capuz),
  estreita e recuada em cima; o capuz vermelho cobre o alto e afina até a ponta, que cai para trás.
- **O rosto:** fundo, entre as beiradas do capuz e embaixo da aba: uma placa escura (`rosto`) com um halo vermelho
  fraco pintado em volta de cada olho.
- **Os olhos:** três, vermelhos (`luz_`): dois lado a lado e um no meio, mais alto.
- **Os braços:** dois toquinhos com três garras curtas, saindo dos lados logo abaixo da barra do capuz, abertos 45°.
- **A perna:** uma só, no meio, com o joelho para trás (como a de um pássaro) e um pé de três garras com um esporão.
- **As pastas:** `raiz` › `quadril` › `corpo` (o corpo, o capuz, o `rosto`, os olhos `olho_e`, `olho_d` e `olho_meio`,
  `braco_e` › `garra_e`, `braco_d` › `garra_d`, a ponta `mecha_capuz` e os pingos `mecha_pingo_1` a `_5`, que balançam);
  e `quadril` › `coxa` › `canela` › `pe`. **A dobra da perna no arquivo vem do giro das pastas** `coxa`, `canela` e
  `pe`: no jogo a perna é calculada (IK de dois ossos), então pode mudar o comprimento dela à vontade; o jogo lê.
- **As animações** (`src/game/enemies/assombrado/animacao.ts`, os números em `numeros.ts`):
  - **parado:** o corpo balança em cima do pé como um joão-bobo (uma mola que leva um empurrão sozinha a cada 1,6 a
    3,2 s), respira, os braços pendem atrasados, as garras abrem e fecham, os olhos piscam um de cada vez;
  - **andar:** pulinhos curtos e pesados (1,2 m/s, um pulo a cada 0,62 s): agacha carregando, sobe esticado com o pé
    apontado para baixo, pousa amassando e o pouso empurra o balanço. Ele só avança no ar: o pé nunca escorrega;
  - **ataque** (1,4 s): agacha com os braços erguidos acima da cabeça e os olhos maiores (o aviso, 0,5 s), salta 1 m
    para a frente descendo as duas garras pela frente, pousa e volta;
  - **dano:** o tranco no balanço para longe do golpe, o corpo amassa e os três olhos apagam por um instante;
  - **estourar:** o corpo some; os cubos de matéria (alguns vermelhos do capuz, e os olhos) voam, caem, grudam no chão
    e encolhem; a mancha no chão seca em uns 3,5 s (`src/game/enemies/estouro.ts`, o mesmo para todos os Sombrios);
  - **surgir** (12/nov, para os que sobem do líquido preto na luta do Devora): a poça aparece, o capuz rompe a
    superfície com um respingo, ele sobe esticado e de braços erguidos, os olhos acendem quando a cabeça sai, e assenta;
  - **arremessado** (12/nov, cuspido pelo Devora): voa em arco, encolhido, dando voltas, e pousa amassando.
- **A luta (12/nov):** os sons (o Lamento) e a inteligência (`ia.ts`: ir atrás do agente, um atacando por vez, contornar
  pelo lado da câmera; `docs/intro.md`, "A luta"). Falta levar tiro (as balas, a 4b).

### Asa sombria (morcego de capuz) ✅ modelo e animações (12/nov)

Um corpo pequeno de capuz vermelho, com asas de morcego, sem olhos. O corpo com o capuz tem **0,85 m** (com os pingos,
1 m) e as asas abertas **1,85 m** de ponta a ponta. Voa a uns 2 m do chão, abaixo do teto e acima da cabeça do agente.
O modelo de partida (`modelos/demonios/asa-sombria.bbmodel`, 82 blocos, textura 256 × 256) nasceu de um gerador, para
retocar no Blockbench. **A origem é o centro do corpo** (ela voa: o jogo põe o root na altura do voo). No jogo: 2
chamadas de desenho (o corpo e o núcleo), e várias Asas dividem a geometria, o material e a textura.

- **A boca:** no lugar do rosto, no fundo do capuz: um losango de **quatro pétalas** (cada uma um quadrado girado 45°),
  fechado numa costura em X de dentes vermelhos. Cada pétala dobra para fora pela ponta de fora do losango; no fundo, o
  núcleo vermelho (`luz_`) cresce e pulsa quando ela vai cuspir.
- **As asas:** de morcego, em degraus de pixel: o braço até o pulso e três dedos (a borda da frente, o do meio e o de
  baixo), a pele preto-arroxeada com veias e a borda de trás vermelho-escura; a garra do polegar no pulso. Varridas 20°
  para trás no arquivo. A ponta dobra no pulso.
- **A cauda:** a matéria escorrendo embaixo do corpo, em pingos que balançam.
- **As pastas:** `raiz` › `corpo` (o corpo, o capuz, o `rosto`, as pétalas `petala_cima`, `petala_baixo`, `petala_e` e
  `petala_d`, o `nucleo`, `asa_e` › `asa_ponta_e`, `asa_d` › `asa_ponta_d` e os pingos `mecha_pingo_1` a `_5`). O ponto de
  giro de cada pétala é a dobra (a ponta de fora do losango); o da asa, o ombro; o da ponta, o pulso.
- **As animações** (`src/game/enemies/asa-sombria/animacao.ts`, os números em `numeros.ts`):
  - **voar:** uma batida a cada 0,42 s, a descida mais rápida que a subida; a ponta vem atrasada e dobra para trás na
    subida; o corpo sobe a cada descida; ela deita para a frente quando anda e de lado nas curvas; de 3 a 6 s, plana um
    pouco (as asas abertas para cima, sem bater);
  - **cuspir** (1,1 s): para no ar batendo as asas mais curto, as pétalas abrem até a metade, o núcleo cresce e pulsa e o
    corpo se inclina para o alvo (o aviso, 0,6 s); cospe (a boca abre de vez, o corpo recua) e a boca fecha;
  - **desviar** (0,45 s): fecha as asas, rola uma volta inteira e anda 1,1 m de lado; abre as asas de novo;
  - **dano:** o tranco no corpo, ela cai um pouco, as asas dão um pulo e a boca treme;
  - **estourar:** o corpo some; os cubos caem do ar até o chão e a mancha fica lá.
- **O projétil** (`projetil.ts`): um núcleo vermelho (brilha; com o bloom, faz halo) com cinco pedras de matéria girando
  em volta e um rastro de cubinhos; a 8 m/s. Batendo no chão (ou depois de 16 m), estoura pequeno, com uma mancha. Todos
  os projéteis são uma malha só. A colisão com as paredes e com o agente entra com a luta.
- **A luta (12/nov):** os sons (o Morcego) e a inteligência (`ia.ts`: rodear o agente, cuspir, desviar quando miram
  nela); o projétil acerta o agente (`acertar`). Falta: o projétil bater nas paredes e levar tiro (a 4b).

### Devora almas (tubarão-lula) ✅ modelo e animações (12/nov)

O mini-chefe. A frente é um tubarão de matéria escura, **rachado e com pedaços faltando**; por dentro dele aparece o
vermelho do submundo (brilha): nos buracos dos olhos, na boca, nas feridas e nas rachaduras, como a ruptura da mansão
(o desenho revisto em 12/nov, a pedido, para ficar único). A metade de trás vira tentáculos no lugar do rabo; nas
costas, três tentáculos compridos no lugar da barbatana. Um manto vermelho rasgado cobre a junção. O modelo de partida
(`modelos/demonios/devora-almas.bbmodel`, 311 blocos, textura 512 × 576) nasceu de um gerador, para retocar no
Blockbench. **A origem é o meio do corpo**: o jogo põe o root na altura que a animação pede. No jogo: 2 chamadas de
desenho (o corpo e o que brilha).

- **O tamanho (decidido em 12/nov: 3 vezes maior, para uma arena bem grande):** no Blockbench ele tem 3,3 m; no jogo,
  `ESCALA = 3` (`numeros.ts`) faz ele ter uns **10 m de comprimento e 4,4 m de altura**. Todas as medidas acompanham (as
  alturas, o salto, o avanço, a marca de 9 m de largura, a mancha, a gosma, os espinhos, o respingo); mudando o número,
  o resto vai junto. O que isso pede da arena: **chão grande e teto alto** (no salto, o meio do corpo sobe a 4,5 m e a
  boca passa dos 7 m: uns 9 m de pé-direito) e nada embaixo do chão. A textura fica com o pixel 3 vezes maior (uns 21 px
  por metro): se ficar grosso demais de perto, dá para refazer o modelo já no tamanho grande com mais pixels (a textura
  cresce, mas é um só por arena).

- **Os olhos:** um buraco fundo de verdade de cada lado da cabeça, atrás do focinho (10 cm de fundo), com o fundo em
  vermelho brilhante (`luz_`, o meio quase branco) e as paredes vermelho-escuras; por cima, a sobrancelha de osso caindo
  para a frente (a cara de raiva).
- **Os pedaços faltando:** buracos de verdade na forma (o gerador corta os blocos em volta): uma mordida nas costas e uma
  ferida no flanco esquerdo, as duas com o fundo brilhando; um pedaço embaixo, no flanco direito; o canto do focinho; um
  lasco no queixo. As paredes de dentro são vermelho-escuras.
- **As rachaduras:** em zigue-zague pelos dois flancos, finas, vermelhas e brilhando (`luz_`).
- **A boca:** a `mandibula` abre muito pela dobra, atrás da boca; os dentes vermelhos (`luz_`) aparecem um pouco com a
  boca entreaberta. Dentro, **a garganta e o chão da boca em vermelho vivo** (`luz_`): fechada, fica uma fresta vermelha
  entre os dentes; aberta, a boca inteira brilha. Guelras vermelho-escuras pintadas dos lados do peito.
- **Os três tentáculos das costas:** compridos (1,1 m o do meio, os dos lados um pouco menores e abertos), curvados para
  trás; balançam devagar e, nadando, são o que corta o chão (no tamanho do jogo, passam uns 1,8 m).
- **As nadadeiras do peito:** para os lados, varridas para trás.
- **Os seis tentáculos de trás:** em volta da junção, cada um em três pastas encadeadas, com anéis de ventosas pintados.
- **O degradê:** todos os tentáculos vão do preto ao vermelho até a ponta, e a pontinha brilha (`luz_`).
- **As pastas:** `raiz` › `corpo` (o corpo, a cabeça, a garganta, os dentes de cima, os olhos, as rachaduras, as
  nadadeiras) › `mandibula` (com os dentes de baixo e a língua), `tentaculo_1` › `tentaculo_1b` › `tentaculo_1c` até o
  6, `costas_1` › `costas_1b` › `costas_1c` até o 3, e o manto em `mecha_manto_1` a `_8` (balança). A curva dos
  tentáculos das costas vem do giro das pastas no arquivo; o jogo balança a partir dela.
- **As animações** (`src/game/enemies/devora-almas/animacao.ts`, os números em `numeros.ts`): ele passa de um modo para
  o outro; quem o controla só pede mergulhar, emergir e marcar, e o resto segue sozinho.
  - **fora do chão** (para ver o modelo): boia de leve, a boca entreaberta respirando, os tentáculos em onda;
  - **mergulhar** e **emergir** (0,9 e 1 s): entra e sai do chão de cabeça, com um respingo de matéria;
  - **nadar no chão:** só os tentáculos das costas passam do chão, balançando; em volta, a mancha escura e os espinhos baixos ondulando
    atrás, como uma cobra (a ideia da poça que anda, das referências); o rastro de gosma fica 3 s no chão;
  - **a marca** (1 s): embaixo do alvo, ele fica em pé lá no fundo, a boca abrindo; no chão, o anel de dentes pulsa;
  - **o salto** (1 s): sai de boca aberta para cima com os tentáculos abertos, morde no alto (o meio do corpo a 4,5 m) e cai deitado;
  - **exposto** (3,5 s, quando erra): se debate no chão, a boca abrindo e fechando. É a janela para atirar;
  - **engolindo** (3 s, quando pega): mastiga deitado, a barriga mexendo; depois **cospe** (0,7 s) quem engoliu;
  - depois de exposto ou do cuspe, **mergulha** de novo;
  - **dano** (o tranco e a mordida no ar) e **estourar**, como os outros.
- **O rumo com transição** (pedido em 12/nov: a virada no chão estava travada; `nado.ts`): nadando, ele acelera e
  freia (3 e 5 m/s²), o giro cresce e diminui aos poucos sem passar do ponto, a curva tem um raio mínimo (4,5 m) e nas
  curvas fechadas ele quase para (a 30% da velocidade) para virar; chegando num ponto, vem freando. Virando no lugar
  (de frente para o alvo, na mira), o giro é de 0,7 rad/s. Na curva, o corpo deita para dentro, a cabeça vai um pouco na
  frente, os tentáculos de trás ficam para trás (dobram ao contrário da curva, mais na ponta) e os das costas abrem para
  fora; a ondulação e o remar acompanham a velocidade (parado, quase não ondula). Os números em `NADO`. A inteligência
  usa as mesmas funções (`nadarPara`, `virarPara`, `pararNado`).
- **Os efeitos no chão** (`efeitos.ts`): a mancha, os espinhos, a gosma e a marca, cada um uma malha só, só enquanto
  aparece. A gosma ainda é só o desenho: deixar lento entra com a luta.
- **O chão de verdade:** nadando, o corpo fica embaixo do chão, e quem o esconde é o próprio chão (no Ver modelos, um
  chão escuro só para ele). Por isso a arena dele não pode ter um andar embaixo (o corpo apareceria no teto de lá).
- **A luta (12/nov):** os sons (o Abismo), a inteligência (`ia.ts`: rodear, escolher o ataque pela fase, cansar), o
  agente engolido de verdade (o dano, a tela escura, a gosma deixando lento), na arena da Demo · Intro
  (`docs/intro.md`). Falta: os pontos fracos e levar tiro (as balas, a 4b); as barras, por enquanto, só com a tecla H.

## Como lutam (o ponto de partida, para ajustar no teste)

Os números vão para `src/game/enemies/<nome>/numeros.ts` quando cada um chegar.

| | Assombrado | Asa sombria | Devora almas |
| --- | --- | --- | --- |
| Vida | 60 | 40 | 1000 (dobrada em 12/nov; era 500) |
| Velocidade | 1,2 m/s (pulando) | 3 m/s voando | nadando 4 m/s |
| Ataque | as garras: 22, alcance 1,4 m, aviso de 0,5 s | o projétil: 15, a 8 m/s, a cada 3 s | a mordida: aviso de 0,8 s, a marca com 9 m de largura; engolido, 20/s por 3 s |
| Especial | vários juntos: só um ataca por vez | desvia quando o agente mira nela por mais de 0,6 s (no máximo a cada 3 s) | embaixo do chão não leva dano; exposto, 3 a 4 s |

**Desviar dos obstáculos (12/nov):** antes de andar até um ponto, o Assombrado e a Asa olham o caminho à frente (1,8 m):
livre, vão reto; com uma parede, um objeto, uma pedra ou a beirada no caminho (para a Asa, só o que chega na altura do
voo), escolhem o primeiro rumo livre para um dos lados e ficam nesse lado por um tempo (`rumoLivre`, em
`enemies/luta.ts`; olham a cada 0,2 s). A Asa também não entra mais nas pedras (antes voava através). O Devora nada
embaixo do chão e não precisa.

**A vista de depuração (só no npm run dev, 12/nov):** na Demo, **F2** mostra a barra de vida em cima de cada demônio
(e de cada tentáculo das costas do chefe) e **F4** mostra as caixas de acerto em arame (`enemies/depurar.ts`).

**O aviso que brilha (pedido em 12/nov):** enquanto prepara um ataque, o demônio acende num âmbar que cresce e pulsa
até o golpe sair (o Assombrado no aviso das garras, a Asa no aviso do cuspe, o Devora na marca, na mira da investida e
ao se erguer para a ninhada). É o mesmo jeito do brilho vermelho do golpe (`src/render/golpe.ts`, `docs/jogo.md`): no
material, sem luz a mais.

**Os sons no jogo (consertado em 13/nov):** na Demo, os demônios estavam mudos: o jogo não dizia ao áudio onde a câmera
estava, e o ouvido ficava parado na origem do mapa, a 20 a 100 m das arenas (o som 3D some depois de 60 m). Agora o
Testar põe o ouvido na câmera a cada quadro (`ouvinte`). E soam mais alto e de mais longe: 2,5 vezes o que cada um toca,
cheios até 4 m e caindo devagar depois (`VOLUME`, `PERTO` e `QUEDA` em `enemies/sons.ts`).

**O Devora almas se impõe (13/nov):** a voz dele soa mais alto que a dos outros (volume 4, cheia até 6 m) e cada ataque
ganhou peso: entrar no chão ruge curto, a terra engole e borbulha; sair ruge com o chão rompendo; a investida rasga o
chão com um baque de pedra a cada espinho que sobe atrás; a ninhada enche a garganta (borbulha e ronca) antes dos
cuspes; a freada, o gemido da chuva e o aviso dos círculos ficaram mais fortes (`devora-almas/sons.ts`).

**O tremor da tela (13/nov):** o Devora faz a câmera tremer (`player/tremor.ts`, os números em `TREMOR`, no
`numeros.ts` do agente; o que treme e quando, em `devora-almas/tremor.ts`): forte ao romper o chão (sair, o salto, a
ninhada), médio ao entrar nele, na freada e no tombo de atordoado, leve e crescendo no ronco da marca, o tempo todo na
investida (os espinhos), leve em cada tentáculo da chuva e das poças, e o mais forte ao estourar. A força cai com a
distância da câmera (some a 30 m).

## A luta do Devora almas (decidido em 12/nov)

Ele virou o chefe do tutorial, no fim do caminho das ilhas (`docs/jogo.md`), numa ilha flutuante grande, com **pouco
dano** (é o tutorial). Além de nadar, marcar e saltar, ele tem estes ataques. Cada um tem um aviso que o jogador vê e um
jeito de escapar. **✅ As animações e os efeitos estão feitos (12/nov)** e se veem no Ver modelos (com o Matheus parado na
marca e o seletor de fase); o dano, a inteligência e os pontos fracos de verdade entram com a luta.

- **Investida rasante:** nadando, ele mira o agente de longe; os 3 tentáculos das costas param de balançar e apontam
  para a frente, e uma rachadura vermelha cresce no chão à frente, por onde ele vai passar (o aviso, 1 s); dispara em
  linha reta a 14 m/s, subindo o bastante para as costas rasgarem o chão, com espinhos grandes subindo atrás e
  afundando de novo; passa do ponto e freia (0,8 s). Escapar: esquiva de lado. A freada é a janela para atirar nos
  tentáculos das costas. Na terceira barra, duas seguidas (a segunda com a mira curta, 0,55 s).
- **Chuva de tentáculos:** ele afunda e de 3 a 5 círculos de dentes acendem no chão em volta do agente (o primeiro em
  cima dele), um depois do outro; de cada um sobe um tentáculo de 4,5 m (rompendo o chão com um respingo), que bate
  dobrando por cima do círculo e volta para o chão. Escapar: sair dos círculos, no ritmo. Obriga a andar. Todos os
  tentáculos são uma malha só (os pedaços, com o degradê) e as pontas outra (brilham).
- **Cuspir demônios:** ele se ergue meio corpo para fora do chão, como uma cobra, a garganta acesa, e cospe 3
  demônios (a cabeça vai para a frente e a boca abre de vez a cada um): **dois Assombrados e, o terceiro, uma Asa
  sombria** (decidido em 12/nov). Os Assombrados voam em arco, encolhidos e girando, e pousam de 5 a 9 m à frente; a Asa
  sai voando da boca, sobe até a altura do voo e fica pairando lá na frente. Estouram fácil, mas distraem. Na terceira
  barra, mais 2 Assombrados sobem do chão, do líquido preto, perto do agente. (O Assombrado ganhou as duas animações:
  arremessado e surgir. Qual dos cuspidos é a Asa: `NINHADA.asa`, em `numeros.ts`.)
- **Atordoado e rastejando** (pedido em 12/nov): quando leva **muito dano de uma vez** e também **quando uma barra de
  vida zera** (decidido em 12/nov, como a Mãe; é aí que ele passa para a próxima fase), ele é arrancado do chão (com o respingo, se estava embaixo), cai de lado e fica tonto: a boca
  solta, os tentáculos moles, o brilho falhando e piscando (3,5 s); se desvira sacudindo e **rasteja devagar** pela
  superfície (4,5 s), arrastando a barriga e puxando o corpo com os tentáculos, a boca aberta ofegando: **a janela para
  o jogador atirar**. Depois mergulha. O rastejar também vem sozinho (cansado: proposta, depois de uns ataques
  seguidos; quando, exatamente, é da inteligência, na luta). Os números em `ATORDOADO` e `RASTEJO`.

**Os pontos fracos** (dão sentido às feridas e às rachaduras):
- **A boca aberta e as feridas** levam dano cheio; o corpo preto leva dano reduzido (o mesmo princípio do núcleo do
  Glutão). Combina com a escopeta de balas contadas: guardar o tiro forte para a boca aberta.
- **As rachaduras** acendem mais e se espalham a cada fase: o jogador vê que está ganhando. Feito: as novas ficam nas
  pastas `racha_2` (os flancos e as costas) e `racha_3` (a cabeça, o rosto e a barriga), que aparecem com a fase; tudo
  o que brilha acende 1,4 vez na segunda barra e 1,9 na terceira (`FASES` em `numeros.ts`); tonto, o brilho falha.
- **Os 3 tentáculos das costas** podem ser destruídos a tiro enquanto ele nada; cada um a menos o deixa **mais lento**
  (recompensa quem acerta). Feito (12/nov): cada um tem 120 de vida (dobrada junto com a dele) e 3 caixas de acerto (só as que estão fora do
  chão: nadando, as costas são a única coisa que leva tiro); o dano fica no tentáculo, não passa para as barras dele.
  Zerou, é arrancado com um estouro no lugar (`arrancar`) e ele nada 15% mais devagar por tentáculo a menos
  (`LUTA.costas` em `numeros.ts`; `nadarPara`, em `nado.ts`). Arrancados não voltam até ele estourar.

**Mais rápido (12/nov, a pedido):** a vida dobrou (1000; os tentáculos das costas, 120; tonto com 120 de dano de uma
vez) e os ataques ficaram ~20% mais rápidos: menos tempo rodeando entre um ataque e outro (1,5 a 2,5 s), a marca, o
salto, o mergulho e o emergir mais curtos, a investida com a mira de 0,8 s e a 17 m/s, a chuva com os círculos mais
seguidos e a ninhada mais rápida. As janelas para atirar (exposto, atordoado, rastejando) continuam do mesmo tamanho.

**Mais agressivo da 2ª barra em diante (13/nov, a pedido):** nada 50% mais rápido embaixo do chão, rodeia só 65% do
tempo entre os ataques, e a ninhada vira o ataque mais comum (peso 1,8 na 2ª barra e 2,2 na 3ª); em cada ninhada, além
dos 3 cuspidos, sobem do chão perto do agente 2 Assombrados (4 na 3ª barra). No máximo 8 crias vivas ao mesmo tempo
(`CRIAS` em `chapters/intro/numeros.ts`). Os números em `LUTA.agressivo` e `LUTA.pesos`.

**As fases: as 3 barras de vida** (decidido em 12/nov: cada barra é uma fase, como as barras da Mãe):
1. **Primeira barra:** nadar, a marca e o salto, e a investida.
2. **Segunda barra:** entram a chuva de tentáculos e o cuspe de demônios.
3. **Terceira barra** (decidida em 12/nov, só com os ataques escolhidos): as rachaduras brilham forte e tudo
   fica mais rápido: duas investidas seguidas, a chuva com 5 círculos e os Assombrados saindo também do chão (do
   líquido preto), além da boca. O rugido da garganta, a maré de gosma e o chicote dos tentáculos ficaram de fora.

**Os cuidados:** os avisos ficam no chão (círculos, a marca, o rastro), legíveis no celular; a chuva de tentáculos são
cópias de um tentáculo só; nenhuma luz nova. Zerado, ele estoura (o estouro grande, como os outros demônios).

## Ser engolido e a gosma (decidido em 12/nov)

- **Engolido:** quem está em cima da marca quando ele salta é engolido. Fica **3 s** preso dentro dele (o agente some, a
  tela escurece e se ouve o corpo dele), tomando **20 de vida por segundo** (60 no total, de 200), e é **cuspido**. Não é
  morte na hora: só cai quem já estava com pouca vida, e aí vale a queda de sempre, sem violência.
- **A gosma no agente:** cuspido, ele sai coberto de **gosma preta**, que o deixa **20% mais lento** (proposta: por 4 s,
  sumindo aos poucos do corpo).
- **O rastro:** nadando no chão, o caminho dele deixa gosma por **3 s**. Quem pisa nela fica 20% mais lento enquanto
  estiver em cima.
- **Os cuidados:** o dano de dentro dele ignora os 0,9 s de invulnerável depois de um golpe (senão ele não daria 20 por
  segundo). A lentidão da gosma é à parte do "machucado", que continua sem mudar a velocidade. O rastro é feito de
  manchas no chão de um estoque fixo, que somem com o tempo (leve no celular).

## Em aberto (decidir antes de construir cada um)

- **Onde ele nada.** Ele é grande demais para os corredores (3,6 m) e as portas (2,1 m), e nadar por baixo das paredes
  desmontaria a colisão. **Por enquanto (12/nov): uma área grande só de teste**, para testar o fluxo (nadar, a marca, o
  salto, engolir, a gosma). **A arena** (12/nov): uma ilha flutuante bem espaçosa no fim do caminho das ilhas, no
  submundo (`docs/jogo.md`); grossa no meio, porque o corpo dele desce dentro dela.
- **A mira na Asa sombria no celular:** voar e desviar pede assistência de mira na versão de toque.
- **O Glutão e a Intro:** a Intro vai ser reformulada (12/nov, para depois). O que o Glutão cospe e devora (proposta:
  Assombrados) entra nessa reformulação.
- **Combater depende das armas:** a munição já existe (a 4a); a bala e o dano ainda não (a 4b). A luta de cada Sombrio
  vem depois; o modelo e as animações podem vir antes.

## Os sons (escolhidos em 12/nov)

Foram feitas **duas ideias para cada Sombrio** e o desenvolvedor escolheu uma de cada (as outras saíram do projeto).
**Os sons estão presos às animações (12/nov):** cada demônio tem uma voz que sai do corpo dele, no espaço (o ouvido é a
câmera; o Devora soa cheio até 4 m, os outros até 1,6 m), e cada som toca no momento da animação. Sintetizados na hora,
como os da Mãe (`src/audio/sintese.ts`), no `sons.ts` de cada pasta; o que eles dividem (a voz no espaço, o som num ponto
do chão, a bolha, o respingo) em `src/game/enemies/sons.ts`. No Ver modelos, cada ação toca o som dela.
`provas.sonsDemonios()` mede o volume de cada som.

- **Assombrado (Lamento):** parado, sussurra e geme baixo de vez em quando; o pulo, o ar ao sair e o baque abafado ao
  pousar; o ataque, o lamento que sobe até um grito fino no aviso e no salto, e o baque do pouso; o dano, o susto e um
  gemido; estourar, um suspiro com um vidro fino; arremessado pelo Devora, um gemido caindo; surgir, sobe gemendo e
  rompe o líquido.
- **Asa sombria (Morcego):** cada batida de asa (planando, nada) e os cliques de vez em quando; cuspir, os cliques
  aceleram e ela guincha no aviso, e quando a bola sai, o chiado e o estalo; a bola batendo espirra onde bateu;
  desviar, o ar e um guincho; o dano, um guincho; estourar, as asas falham, o guincho cai e ela espirra.
- **Devora almas (Abismo):** fora do chão, respira gemendo; nadando, o ronco embaixo do chão e o gemido de baleia;
  romper o chão, a pedra racha e o baque grave; a marca, o chão ronca crescendo (o aviso), o salto ruge e a boca fecha
  num baque; errou, se debate; pegou, mastiga e cospe; a investida, ruge na mira (o aviso), rasga o chão e derrapa; a
  chuva, geme afundando, e em cada círculo o chão ronca no aviso e o tentáculo rompe (o som sai do círculo); a ninhada,
  geme e cada cria sai num cuspe; atordoado, a queda e o gemido tremendo; rastejando, arrasta a barriga a cada puxada;
  o dano, um grunhido; um tentáculo arrancado, o rugido de dor; a barra nova, o rugido grande; estourar, o rugido
  caindo e o chão rompendo.

| Sombrio | A | B | Escolhido |
| --- | --- | --- | --- |
| Assombrado | Gosma: molhado, borbulhante, um guincho afogado | Lamento: oco, soprado, sussurro e gemido | **B · Lamento** |
| Asa sombria | Morcego: asas de couro, cliques e guinchos agudos | Trapo: asas de pano rasgado, respiração rouca | **A · Morcego** |
| Devora almas | Abismo: grave, gemido de baleia, rugido fundo | Moedor: dentes e pedra moendo, guincho metálico | **A · Abismo** |

## As etapas (uma por vez)

1. ✅ **O Assombrado** (12/nov): um modelo de partida gerado (como os outros), para você retocar no Blockbench, e as
   animações (parado, andar, ataque, dano, estourar) no Ver modelos (Modelo → Demônios → O Assombrado).
2. ✅ **A Asa sombria** (12/nov): o modelo de partida e as animações (voar, planar, cuspir, desviar, dano, estourar), e o
   projétil, no Ver modelos (Modelo → Demônios → A Asa sombria).
3. ✅ **O Devora almas** (12/nov): o modelo de partida, os tentáculos, o nadar (os tentáculos das costas, a mancha, os espinhos e a
   gosma), a marca, o salto, exposto, engolir e cuspir, no Ver modelos (Modelo → Demônios → O Devora almas), com o
   Matheus em cima da marca no "Atacar (engole o agente)".
4. **As armas novas** (`docs/jogo.md`, "As armas"), em duas partes:
   - **4a. Feita (12/nov).** a escopeta de Demantino com as 4 balas e a recarga nova (1,5 s por bala, cada uma vale ao entrar; a animação do
     cartucho e das balas puxadas pela arma), e a pistola de plasma com a sobrecarga (esquenta, trava 5 s); contadores
     simples no Ver modelos; no jogo, o HUD conceito C (12/nov). Como ficou: `docs/jogo.md`, "As armas";
   - **4b. Feita (12/nov).** a bala de verdade: o tiro sai, voa, bate na parede (a faísca e a marca) e acerta o que
     tiver na frente. Como ficou: `docs/jogo.md`, "A bala".
5. **A luta:** ✅ atrás do agente e atacando, na Demo · Intro (12/nov, `docs/intro.md`); falta tomar tiro e estourar pelas
   balas (depois da 4b).
