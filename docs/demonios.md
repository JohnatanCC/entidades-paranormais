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
- **O vermelho vivo que brilha** (blocos `luz_`): os olhos do Assombrado, o núcleo da boca da Asa sombria e os dentes do
  Devora almas. É o que o jogador vê primeiro no escuro.
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
  - **surgir** (proposta, não feito): sobe de uma mancha escura no chão, de baixo para cima.
- **Falta (na etapa da luta):** os sons, a inteligência (ir atrás do agente, um atacando por vez), o dano de verdade.

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
- **Falta (na etapa da luta):** os sons, a inteligência (rodear o agente, quando cuspir, quando desviar), a colisão do
  projétil, o dano de verdade.

### Devora almas (tubarão-lula)

O mini-chefe. A frente é um tubarão de matéria escura com os dentes vermelhos; a metade de trás vira tentáculos no lugar
do rabo. Um manto vermelho rasgado cobre a junção. **Uns 4 m** de comprimento (1,8 m de cabeça e corpo) e **1,4 m** de
altura.

- **A boca:** a `mandibula` abre muito; os dentes vermelhos brilham fraco (`luz_`). Sem olhos, como a Asa sombria (a cor
  é só o manto e os dentes).
- **Os tentáculos:** seis, cada um em três pastas encadeadas, que o código move como uma onda.
- **As pastas:** `raiz` › `corpo` › `cabeca` › `mandibula`; `barbatana` (a de cima: é o que aparece quando nada);
  `tentaculo_1` › `tentaculo_1b` › `tentaculo_1c`, até o 6; o manto em `saia_1`, `saia_2`… (balança, como a saia da Mãe).
- **As animações:**
  - **nadar no chão:** do corpo só aparece a barbatana, e em volta dela o chão escurece numa mancha com ondulações e
    espinhos baixos, que anda como uma cobra (a ideia da poça que anda, das referências);
  - **a marca:** perto do agente, ele para embaixo dele e uma marca de mordida aparece no chão (um anel de dentes);
  - **o salto:** sai de boca aberta para cima, os tentáculos abrindo, e fecha a boca no ar;
  - **exposto:** depois do salto fica alguns segundos no chão, se debatendo nos tentáculos. É a janela para atirar;
  - **mergulhar:** afunda de novo na mancha;
  - **dano** e **estourar**, como os outros.

## Como lutam (o ponto de partida, para ajustar no teste)

Os números vão para `src/game/enemies/<nome>/numeros.ts` quando cada um chegar.

| | Assombrado | Asa sombria | Devora almas |
| --- | --- | --- | --- |
| Vida | 60 | 40 | 500 |
| Velocidade | 1,2 m/s (pulando) | 3 m/s voando | nadando 4 m/s |
| Ataque | as garras: 22, alcance 1,4 m, aviso de 0,5 s | o projétil: 15, a 8 m/s, a cada 3 s | a mordida: aviso de 1 s, a marca com uns 3 m; engolido, 20/s por 3 s |
| Especial | vários juntos: só um ataca por vez | desvia quando o agente mira nela por mais de 0,6 s (no máximo a cada 3 s) | embaixo do chão não leva dano; exposto, 3 a 4 s |

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
  salto, engolir, a gosma). O lugar dele no capítulo fica para depois.
- **A mira na Asa sombria no celular:** voar e desviar pede assistência de mira na versão de toque.
- **O Glutão e a Intro:** a Intro vai ser reformulada (12/nov, para depois). O que o Glutão cospe e devora (proposta:
  Assombrados) entra nessa reformulação.
- **Combater depende das armas:** a bala, o dano, a sobrecarga e a munição da escopeta ainda não existem. A luta de
  cada Sombrio vem depois da etapa das armas; o modelo e as animações podem vir antes.

## As etapas (uma por vez)

1. ✅ **O Assombrado** (12/nov): um modelo de partida gerado (como os outros), para você retocar no Blockbench, e as
   animações (parado, andar, ataque, dano, estourar) no Ver modelos (Modelo → Demônios → O Assombrado).
2. ✅ **A Asa sombria** (12/nov): o modelo de partida e as animações (voar, planar, cuspir, desviar, dano, estourar), e o
   projétil, no Ver modelos (Modelo → Demônios → A Asa sombria).
3. **O Devora almas:** o modelo, os tentáculos em onda, o nadar (a barbatana e a mancha), a marca e o salto.
4. **As armas novas** (`docs/jogo.md`, "As armas"): a pistola de plasma e a escopeta de Demantino com as 4 balas e a
   recarga (a munição infinita por enquanto).
5. **A luta:** cada Sombrio no Testar, atrás do agente, tomando tiro e estourando.
