# Capítulo 2: a Sombra

Decidido em 17/nov. **Só no papel por enquanto:** o capítulo 2 é construído depois do lançamento do capítulo 1 no itch
(`docs/lancamento.md`). Aqui ficam as ideias, para não se perderem. A exceção é a **lamparina**, que vale para o jogo
todo e entra já no capítulo 1 (abaixo).

## O clima

O capítulo 2 é **mais sombrio e mais focado no terror** do que o da Mãe. Na mansão do capítulo 1 há lâmpadas acesas; no
do capítulo 2 **quase nenhuma luz está acesa**, e o porão é **escuro de todo**. Quem ilumina é a lamparina do agente.
As armas servem pouco: **não ferem as Gralhas, só as espantam** do lugar.

## A Sombra

A história de partida é a da Dita, a gralha da copa (`docs/design/historia.md`): a gaiola coberta com o pano, o rádio de
galena ao lado, os fundos no escuro depois que a luz foi cortada, a gaiola vazia depois do incêndio. **Ela vai ser um pouco
reformulada**; o que fica: **ela só aparece na escuridão.** Os sons de partida: o grasnado, a estática de rádio, o pano
batendo.

- **São vários: as Gralhas** (o nome decidido em 17/nov): corvos que **voam pelo mapa** e são **os olhos do Mestre**, o
  fantasma de verdade (17/nov: no lugar da ideia de se juntarem num maior). O Mestre é maior, **rápido e letal**.
- **Observam:** ficam de longe, olhando, e **atacam no escuro**: partem para cima do agente, incomodam e ferem.
- **São espertas e rápidas**, e costumam **atacar em grupo**.
- **As armas só espantam** as Gralhas (não atordoam nem destroem). É uma exceção à regra "o menor zerado estoura"
  (`docs/jogo.md`, "Destruir ou capturar"): neste capítulo as Gralhas não têm vida para zerar.

## O desenho: as Gralhas e o Mestre (conceito, 17/nov)

**A confirmar.** O modelo pode ficar pronto antes, sem entrar no jogo. A referência é uma imagem do desenvolvedor (17/nov):
um **corvo humanoide de manto roxo**. O primeiro conceito do Claude (a gaiola com fones e o olho de galena) foi recusado.
- **O Mestre:** alto (~2,4 m), magro e um pouco curvado. Um **capuz roxo** com a cabeça de corvo dentro, o rosto no
  escuro e só **os dois olhos amarelos acesos**; o **bico comprido** sai do capuz apontando para baixo. Uma gola de penas
  nos ombros e um **manto roxo de tiras de penas** até o chão, com a barra se desfazendo em cubos de matéria. O manto
  **abre na frente** e mostra o corpo preto e fino por dentro, as **pernas finas** e os **pés de garra**. As mãos saem do
  manto com dedos longos de garra.
  O Mestre fica com o capuz e o manto, e ganha um pouco do monstruoso: a gola de penas arrepiadas, o bico de osso com
  dentes saindo do capuz, as pontas de penas soltas no manto.
- **As Gralhas, monstruosas** (segunda referência do desenvolvedor, 17/nov: uma cabeça de corvo monstruosa): corvos com
  as penas **arrepiadas e soltas para trás**, se desprendendo no ar; **o crânio aparecendo** na base do bico, onde as
  penas caíram; o bico **aberto e com dentes serrilhados**; **um olho amarelo** aceso. Tudo em blocos com textura em
  pixel; as referências não são para copiar.
- **As Gralhas saem do manto:** as tiras do manto são aves dobradas. Quando ele manda as Gralhas, elas **se soltam do
  manto** e saem voando (os cubos que sobem do ombro), e **voltam para ele**. Assim fica claro que elas são os olhos dele,
  sem precisar explicar. As Gralhas: corvos do mesmo roxo escuro, com os mesmos olhos amarelos.

### O modelo da Gralha (feito em 17/nov, ainda fora do jogo)

`modelos/fantasmas/gralha.bbmodel`, 167 blocos, textura 256 × 256 (64 px por metro), nascido de um gerador para retocar no
Blockbench. Aparece no **Ver modelos → Fantasmas → A Gralha**, parada na pose do arquivo (no `npm run dev`:
`provas.gralha()`). **A origem é o centro do corpo** (ela voa, como a Asa sombria). No jogo: 2 chamadas de desenho (o
corpo e os olhos, que brilham); várias Gralhas dividem tudo (`copiaDoMolde`).
- **O tamanho:** ~1,15 m do bico à cauda e ~1,65 m de asa aberta: maior que um corvo de verdade, para ler de longe.
- **O cuidado para não ficar infantil:** nada de contorno claro em cada bloco; as penas compridas **afinam na ponta**
  (dois blocos) e têm a ponta desgrenhada pintada; as penas do corpo em escamas; o roxo é escuro e apagado; o osso e os
  dentes num marfim sujo, não branco.
- **As pastas:** `raiz` › `corpo` › `pescoco` › `cabeca` › `bico_baixo` (a boca abre: no arquivo, entreaberta); `asa_e` ›
  `asa_ponta_e` e `asa_d` › `asa_ponta_d` (as asas abertas, varridas 12° para trás); `cauda`; `perna_e` e `perna_d`
  (recolhidas para trás); `mecha_pena_1` a `_3` (as penas soltas que balançam com as molas). Os olhos são blocos `luz_`.
- **O voo** (17/nov, `src/game/enemies/gralha/`): bate as asas (uma batida a cada 0,46 s, a descida mais rápida que a
  subida, a ponta atrasada), plana de vez em quando, o corpo sobe a cada descida e a cabeça fica quase parada no ar;
  deita para a frente com a velocidade e de lado nas curvas. No Ver modelos: voando no lugar e em roda.
- **Perseguir** (17/nov): depois do grito do Mestre, voa até o agente e fica rodeando por cima dele (`ia.ts`).
- **Falta:** pousar, olhar, atacar e o resto da inteligência (os sons estão abaixo).

### O modelo do Mestre (feito em 17/nov, ainda fora do jogo)

`modelos/fantasmas/mestre.bbmodel`, 351 blocos em 95 juntas, textura 512 × 256 (64 px por metro), nascido de um gerador
para retocar no Blockbench. No **Ver modelos → Fantasmas → O Mestre** (`provas.mestre(segundos, andar)`). **A origem é o
chão** entre os pés. No jogo: 3 chamadas de desenho (o corpo, os olhos acesos e a fumaça). O código em
`src/game/enemies/mestre/` (`modelo.ts`, `animacao.ts`, `fumaca.ts`, `numeros.ts`).
- **O tamanho:** ~2,25 m de altura, curvado (o peito inclinado 18° para a frente, a cabeça adiante).
- **O que marca:** a gola de penas arrepiadas, **alta atrás da cabeça e baixa na frente** (refeita em 17/nov: antes
  tapava o rosto); no capuz, o rosto preto com **dois olhos amarelos** e o **bico de osso** rachado, com dentes, descendo
  para fora; na abertura da frente, as **costelas** de osso escuro, as pernas de ave e as **mãos de garra** até os
  joelhos; **três Gralhas dormindo nos ombros e no peito**, só a cabeça e o olho aceso (as que ele manda voar).
- **O capuz** em três andares que fecham para cima (arredondado, sem caixa), com a viseira caída sobre os olhos e a
  ponta caída para trás.
- **O manto em camadas** (refeito em 17/nov: antes eram tiras inteiras, retas, com um degrau no meio): a ombreira (do
  pescoço aos ombros, em declive, presa) e **três camadas de tiras que se cobrem**, como as penas de uma asa
  (`manto_1_*`, 15 tiras; `manto_2_*`, 17; `manto_3_*`, 19, a barra rasgada); cada tira acaba numa pena solta. Aberto na
  frente.
- **A física** (17/nov): as tiras do manto e as partes soltas (`mecha_*`: as mangas de penas no antebraço, a ponta do
  capuz) balançam com as molas da saia da Mãe (`src/game/corpo/molas.ts`, que ganhou o **vento**: um empurrão a mais em
  tudo). O vento do Mestre é uma brisa que gira e vem em rajadas, mais o **arrasto**: quando ele anda, o manto fica
  para trás. Cada tira de baixo é filha de uma de cima (a corrente).
- **A fumaça** (17/nov): uma camada de fumaça escura **dentro do manto**: nuvens de pixel sobem do chão por dentro dele e
  somem na cintura (as costelas e as mãos ficam de fora); uma parte escorre por baixo da barra. Fecha os vãos entre as
  tiras e esconde as pernas; quando ele anda, fica um rastro. Uma malha só para todas as nuvens (44), viradas para a
  câmera no shader.
- **Ele não anda: levita** (decidido em 17/nov). O corpo fica a ~0,4 m do chão, subindo e descendo devagar, sobre a
  coluna de fumaça; as pernas pendem soltas, com as garras para baixo. Avançando, o corpo deita para a frente e o
  manto, as pernas, os braços e a fumaça ficam para trás. A cabeça **vira de uma vez e fica**, como a de uma ave (o
  movimento travado). No Ver modelos: levitando no lugar e em roda.
- **Sem faces brigando:** o gerador confere as faces no mesmo plano (o que piscava no capuz e no manto) e as tiras
  vizinhas alternam por dentro e por fora.
- **As pastas:** `raiz` › `quadril` › `coxa_e` › `canela_e` › `tarso_e` › `pe_e` (o joelho para trás) e o mesmo do lado `_d`;
  `peito` › `ombro_e` › `braco_e` › `antebraco_e` › `mao_e` › `dedo_1_e` a `dedo_3_e` (cada um com a `_ponta`) e `polegar_e`;
  `pescoco` › `cabeca` › `bico_baixo` (a boca entreaberta) e `mecha_capuz`; no antebraço, `mecha_manga_e` e `mecha_manga_2_e`;
  o manto: `manto_1_N` › `manto_2_N` › `manto_3_N`. Os olhos (dele e das Gralhas) são blocos `luz_`.
- **Falta:** a caçada e a inteligência (o grito e os sons estão abaixo).

### O grito: como a caçada começa (decidido e feito em 17/nov, no Ver modelos)

Quando o Mestre **avista o agente** (`gritar`, em `src/game/enemies/mestre/animacao.ts`; os números em `GRITO` e `CORVO`):
1. **o aviso** (0,6 s): ele trava, recolhe o corpo, a cabeça tomba de lado, e acende em âmbar (o aviso dos Sombrios);
2. **o grito sônico** (1,2 s): o corpo vai para a frente, o bico abre, **o manto e os braços abrem de uma vez**, como
   asas, e vibram; **a tela treme** (`tremerDe`, forte);
3. logo no começo do grito, de dentro do manto sai o **corvo gigante de sombra** (`corvo.ts`: a Gralha 2,6 vezes maior,
   escura), a 15 m/s, reto para a frente, soltando pedaços de sombra pelo caminho;
4. depois de **2 s**, ou ao **bater em algo**, o corvo **explode** (a tela treme de leve) e solta **3 Gralhas**;
5. as Gralhas **perseguem o agente** (`src/game/enemies/gralha/ia.ts`, `CACA`): voam até ele e ficam rodeando por cima;
6. o manto fecha (0,8 s) e **começa a caçada**.

**O corvo gigante não fere** (decidido em 17/nov): só solta as Gralhas.
**Pontos de partida, para ajustar jogando:** as Gralhas vão embora em 12 s; ele pode gritar de novo a cada 20 s.
**No Ver modelos:** o botão "Gritar (avistou o agente)", contra a marca do agente a 6 m; o corvo explode numa parede
imaginária a 11 m. Pelo console: `provas.mestre(2, 0, 1)` (o Mestre a 1 s do grito).
**Falta:** o corvo bater de verdade nas paredes do mapa (a colisão das balas,
`src/game/weapons/bala.ts`); o que as Gralhas fazem ao alcançar o agente (o ataque); a caçada do Mestre. O grito da Mãe
(as ondas) é diferente na imagem; no som também precisa ser. A porta: ele tem 2,25 m e levita, então precisa abaixar
para passar, como a Mãe.

### Os sons (feitos em 17/nov; o desenvolvedor ainda precisa ouvir e dizer como soou)

Sintetizados na hora, como os dos Sombrios (`sons.ts` de cada pasta; `ouvirMestre`, `ouvirCorvo` e `ouvirGralha` tocam
cada som no momento da animação; a voz sai do corpo, no espaço). A assinatura do capítulo: o grasnado, o chiado de rádio
e o pano.
- **A Gralha:** cada batida das asas de pena (mais macia que a de couro da Asa sombria); de vez em quando o **grasnado**
  rouco (dois seguidos) ou os cliques do bico; **caçando**, grasna mais vezes, três seguidos, mais agudos.
- **O Mestre, levitando:** a **respiração** funda e seca, com um ronco; o **estalo de osso** quando a cabeça vira de uma
  vez; o **manto farfalhando**, mais forte com o vento e quando ele avança.
- **O grito:** no aviso ele **puxa o ar** (um chiado que sobe, um ronco, os ossos travando); o **grito sônico** é um
  grasnado enorme e rachado, metálico, com um grave que pulsa e um chiado de rádio por cima (diferente do grito da
  Mãe); o **manto abrindo** num golpe de pano e penas.
- **O corvo gigante:** sai num sopro com um grasnado grave; as asas pesadas enquanto voa; **explodindo**, um baque, o
  pano rasgando e as três Gralhas grasnando juntas.
- **Os volumes** (`provas.sonsDemonios()`, que agora mede também a Gralha e o Mestre): o grito é o mais forte (rms
  0,108, como a investida do Devora almas); a respiração, o osso e o manto ficam baixos (0,007 a 0,013).

## A Angústia

Uma **matéria sombria** que fecha alguns lugares do mapa. Só passa quem **ergue a lamparina para a frente**: a luz fica
mais forte e afasta a sombra, abrindo caminho.

## O mapa

**A mansão muda** (cada capítulo é um mapa; o do capítulo 2 nasce de uma cópia do capítulo 1, que o criador de mapas já
faz). A Sombra começa no **porão**, que agora dá para explorar, junto com parte do andar principal. No capítulo 1 a porta
do porão está emperrada (`docs/mansao-cap1.md`): no capítulo 2 ela abre. **Os detalhes do mapa vão ser pensados de novo.**

## A lamparina (vale para o jogo todo)

A armadilha de captura **é a lamparina** (decidido em 17/nov). Ela já estava "para reformular" desde 12/nov (`docs/jogo.md`,
"As armas"); a reforma é esta:
- fica **na cintura** do agente, **acesa, iluminando** em volta;
- **erguer a lamparina** ilumina a frente com mais força: abre a Angústia e afasta a sombra;
- **capturar:** erguida, ela **absorve** o fantasma (no lugar de jogar a armadilha na poça);
- **o jogar sai**: o arremesso, grudar e chamar de volta (`src/game/weapons/armadilha.ts`) são tirados quando a lamparina
  for feita.

## Os conflitos e o que decidir antes de construir

- **O contorno de luz** (`docs/iluminacao.md`) mantém os fantasmas visíveis no escuro. Para as Gralhas "observarem de longe" sem
  ser vistas, o contorno precisa ficar desligado nelas (só os olhos brilhando, por exemplo).
- **O nome:** "a Sombra" (o capítulo, a Dita) e "o Mestre" são o mesmo fantasma? E quem é ele na história (a Dita é a
  gralha; o Bento, o mordomo, era quem ouvia o rádio, mas o Mordomo está fora do projeto)?
- **As armas nas Gralhas:** agora elas ferem o agente. Continuam só se espantando com tiro, ou estouram como os menores
  (a regra de `docs/jogo.md`)? Se só espantam, o jogador não tem como se livrar delas além da luz.
- **Como se vence o Mestre:** o que o enfraquece (a luz? o tiro?). A captura: a lamparina absorve só ele, ou também as Gralhas?
- **A luta do chefe:** onde (no porão?).
- **O peso:** muitas Gralhas voando juntas. Um molde só com cópias que dividem tudo (`copiaDoMolde`), poucas peças por
  ave e um limite de quantas aparecem; as de longe só com os olhos.
- **O porão é um andar abaixo do térreo:** o formato do mapa começa no andar 0 (o térreo). Conferir se o criador de mapas
  aceita um andar -1; se não, é uma mudança de formato (`FORMATO` e a conversão).
- **A Angústia no mapa:** é um elemento novo (uma área, como as de ambientação, ou um objeto). Também pode pedir uma mudança
  de formato.
- **O desempenho:** a lamparina é uma luz que anda com o agente; não dá para assar. Uma luz a mais é aceitável no
  celular; a sombra dela, não (só nos níveis altos).
- **No celular:** erguer a lamparina é um botão a mais na tela.
