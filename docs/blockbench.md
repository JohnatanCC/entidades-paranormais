# Blockbench: os modelos dos personagens

Decidido em 10/nov: os personagens, os objetos do cenário e as armas são feitos no **Blockbench**, um programa grátis
feito para modelos em blocos com textura em pixel. O desenvolvedor modela e pinta; o jogo lê o próprio `.bbmodel` (sem exportar nada) e anima em código.

## Os arquivos

| Onde | O quê |
| --- | --- |
| `modelos/<nome>.bbmodel` | Um personagem (o agente: `agente.bbmodel`; a Lara: `lara.bbmodel`; o Nicolas: `nicolas.bbmodel`; o Victor: `victor.bbmodel`). A textura vai dentro do arquivo; o jogo lê este mesmo arquivo (`src/render/bbmodel.ts`) |
| `modelos/objetos/<tipo>.bbmodel` | Um objeto do catálogo do criador de mapas, com o nome do tipo (`cadeira.bbmodel`) |
| `modelos/aberturas/<tipo>.bbmodel` | As portas e janelas: `porta-comum`, `porta-dupla`, `porta-grande`, `janela`, `janela-grande` |

O primeiro é `modelos/agente.bbmodel`: o Matheus, já ligado no Testar do criador de mapas. Com o `npm run dev` aberto,
salvar no Blockbench atualiza o jogo (se o Testar estiver aberto, saia e entre de novo).

## As regras (para o jogo conseguir animar)

- **Não renomeie nem mude a ordem das pastas** do Organizador. O código gira cada pasta pelo nome:
  - o corpo: `raiz` › `quadril` › `tronco` › `pescoco` › `cabeca`; `braco_e` › `antebraco_e` › `mao_e`; `coxa_e` › `canela_e` › `pe_e`
    (e os `_d`);
  - a mão (dentro de `mao_e`): `indicador_e`, `medio_e`, `anelar_e`, `minimo_e` e `polegar_e`, cada um com a
    `..._ponta_e` dentro (a segunda falange);
  - o rosto (dentro de `cabeca`): `olho_e` (com a `iris_e` dentro), `sobrancelha_e` e `boca`. São peças finas na frente
    do rosto: o código mexe nelas para as expressões (piscar, medo, dor, raiva, surpresa, esforço) e para o olhar;
    a `boca` é a boca **aberta** (dentes e o escuro): fechada, ela some e fica a boca pintada no rosto, na cabeça;
  - o cabelo (dentro de `cabeca` › `cabelo`): a casca, a coroa e o topete ficam parados; **toda pasta que começa com
    `mecha_` balança com física** (a gravidade e o tranco da cabeça). Para uma mecha nova: crie uma pasta `mecha_algo`
    dentro de `cabelo`, ponha o ponto de giro na raiz (onde ela nasce) e o bloco pendurado para baixo. O jogo acha os
    limites sozinho pelo lugar da raiz (as de trás não vão para a frente, as da franja não entram no rosto, as dos
    lados não entram na cabeça);
  Se faltar uma, o jogo avisa no console (F12) e aquela parte fica parada.
  `_e` é o lado esquerdo do personagem, `_d` o direito.
- **O ponto de giro de cada pasta é a junta** (o ombro, o cotovelo, o joelho). Se mudar o tamanho de um braço, leve o ponto
  de giro junto (painel Transformar, campo "Pivô").
- **Escala: 32 unidades = 1 metro.** O Matheus tem 56 unidades (1,75 m). A grade do Blockbench marca 16 unidades (meio metro).
- **A frente é o sul (+Z).** O rosto fica na face sul da cabeça.
- **64 px por metro nos personagens** (decidido em 10/nov; o cenário continua com 32): a textura tem o dobro de pixels do
  espaço de UV, então cada unidade tem 2 × 2 px para pintar. A frente e os lados da cabeça (`cranio`) e as peças do rosto (olhos,
  íris, sobrancelhas, boca) têm UV próprio, com 4 × 4 px por unidade: o rosto, o nariz, as orelhas e a barba são pintados ali, e as
  peças finas dão a expressão. Deixe essas oito sem Box UV.
- **Equilibrado, não super-realista** (pedido em 10/nov; refinado em 11/nov, ver "Os personagens em blocos refinados"):
  o rosto continua pintado na frente da cabeça, sem mandíbula separada no Matheus; o nariz e as orelhas são blocos
  pequenos por cima da pintura.
- O modelo tem bastante peça (214 blocos), mas o jogo junta os blocos de cada pasta numa malha só: o peso vem do número
  de pastas, não de blocos. Detalhe à vontade dentro das pastas que já existem.
- **Proporções quase realistas:** cabeça só um pouco maior, mãos normais. O terror vem da ambientação e dos fantasmas.
- Peça nova (um coldre, óculos, o cabelo com mais volume): ponha dentro da pasta que deve levá-la junto (óculos na
  `cabeca`, coldre na `coxa_d`). A bota fica na pasta do pé (`pe_e`): é por ela que o jogo acha a sola e põe os pés no chão.
- Uma textura só por modelo (a primeira da lista é a que vale).

## Os personagens em blocos refinados (decidido em 11/nov)

As pessoas e os fantasmas são **menos "Minecraft"** que o cenário: o corpo é feito de muitas peças pequenas, chanfradas
e inclinadas. Os objetos, as portas e as armas continuam simples. O Matheus (214 blocos; eram 89) e a Mãe (259; eram
118) já estão assim; o Glutão, os Sombrios, Lara e Nicolas nascem assim. Os modelos antigos estão no git.

- **O trecho chanfrado:** um braço, uma coxa ou a cintura não é um bloco só: são três blocos cruzados na mesma altura
  (um largo e raso, um médio, um estreito e fundo), e o corte fica um octógono. Vários trechos empilhados, cada um um
  pouco mais fino, fazem o membro afinar (bíceps, pulso, coxa, panturrilha).
- **As peças inclinadas** dão o que o bloco reto não dá: o trapézio, o topo do ombro, o peitoral, a orelha, o nariz, o
  peito do pé, os tufos do cabelo; na Mãe, o busto, as clavículas, as escápulas, a espinha saltada.
- **A cabeça não é um cubo:** o meio com o rosto pintado, as têmporas recuadas, as bochechas e o queixo mais estreitos; o
  nariz e as orelhas são blocos por cima da pintura. O rosto do Matheus foi refeito em 11/nov no jeito
  dos outros (os olhos amendoados, o nariz, a boca e a barba por fazer pintados pela posição; a pintura antiga, apertada a
  84% da largura, deixava o rosto estranho); as alças dele vão do cinto ao ombro e descem atrás até a mochila. Na Mãe o rosto recua
  em dois degraus para os lados, o queixo afina em três até a ponta, as maçãs do rosto são peças inclinadas e o topo
  do cabelo é uma cúpula chanfrada (pedido em 11/nov: o rosto estava quadrado).
- **Não pesa:** o detalhe vai **dentro das pastas que já existem**. O jogo junta tudo numa malha só (uma chamada de
  desenho por personagem); o que custa é pasta nova (junta), não bloco. Por isso **a saia e a anágua da Mãe ficaram
  como eram** (cada painel é uma junta com física) e as mechas dela só afinam até a ponta, sem pasta nova.
- **A pintura** de cada peça nova nasceu da projeção da pintura do bloco antigo (os botões, as costuras e o rosto
  ficaram no lugar): nos degraus entre os trechos ela é aproximada e pede retoque à mão.

## A Lara (11/nov)

`modelos/lara.bbmodel`: a batedora da C.R.O.S., a que vai na frente para ver o caminho (corajosa, rápida, um pouco
impulsiva: é ela que corre atrás do Espectral na Intro). Negra, 1,66 m (1,76 com o coque), mais baixa e mais magra que o
Matheus, com o quadril mais largo que os ombros. O desenho (decidido em 11/nov, com uma referência do desenvolvedor):

- **O rosto:** maçãs altas, nariz fino com sardas (algumas douradas), lábios cheios, olhos amendoados cor de âmbar.
- **O cabelo:** cacheado, preso num coque alto com uma faixa dourada, e dois cachos soltos na frente das orelhas (as
  pastas `mecha_cacho_e` e `mecha_cacho_d`, que balançam). Brincos dourados de gota.
- **A roupa:** camisa de gola alta cinza-chumbo com o zíper dourado, as mangas arregaçadas; colete curto de lona
  verde-oliva com o debrum mostarda, zíper, bolsos e o rádio preso no peito; mochila pequena; calça cargo com bolsos nas
  coxas e joelheiras; luvas sem dedos; botas de cano baixo com cadarço. O verde e o mostarda separam ela do azul do
  Matheus de longe, no escuro.
- **As pastas são as do Matheus** (as mesmas juntas, os mesmos nomes): andar, mãos, expressões e armas funcionam sem
  mudar nada. A mão é a dele, um pouco menor. O jogo monta com `montarAgente('lara')`.
- **A textura** (512 × 256) nasceu de um gerador, como os objetos: cada face tem o seu retângulo, pintado pela posição no
  corpo (o desenho continua de um bloco para o outro). O rosto tem 128 px por metro, os olhos e o nariz 256. É o ponto de
  partida para repintar à mão.
- **Falta:** a lanterna na mão (um modelo em `modelos/armas/`, com a empunhadura e o ponto de onde sai a luz), a rota, as
  falas e a cena do escritório: vêm com a Intro.

## O Nicolas (11/nov)

`modelos/nicolas.bbmodel`: o novato da C.R.O.S. Não é tímido: é confiante demais, não sabe trabalhar em equipe e
gosta de decidir por conta própria. Branco, 1,83 m, o mais alto dos três. O desenho (decidido em 11/nov, com uma
referência do desenvolvedor; os traços, não o personagem dela):

- **O rosto:** nariz comprido, olhos verdes de pálpebra pesada (o olhar de quem já sabe), sobrancelhas grossas,
  bochechas coradas, orelhas de abano e o bigode de guidão com as pontas enroladas para cima. A boca fechada é um
  sorriso de canto; aberta, mostra os dentes.
- **O cabelo:** castanho e liso, repartido à direita, com um topete que cai de lado na testa (as pastas
  `mecha_franja_1` e `mecha_franja_2` balançam) e costeletas.
- **A roupa:** a farda da C.R.O.S. (o corte do Matheus, ver "A farda" em `docs/jogo.md`) na cor e com o equipamento da
  função dele, **comunicação e mecânica**: a jaqueta fechada de gola alta e lapelas em vermelho-escuro desbotado, com a
  carcela de botões dourados e a faixa dourada no punho; as alças de couro do rádio pela frente, com o monofone na
  esquerda e um medidor de mostrador verde na direita; o rádio de campanha nas costas, com os botões e a antena (o
  ponto mais alto: 1,92 m, abaixo das portas); o cinto com as bolsas, a chave inglesa pendurada, a chave de fenda e um
  rolo de cabo; luvas de trabalho; a calça cinza com o vinco de nova, joelheiras e botas altas engraxadas. O distintivo
  da C.R.O.S. no ombro esquerdo (ele tem orgulho) e o fone num ouvido só, com o microfone.
- **As cores:** o vermelho-escuro separa ele do azul do Matheus e do verde e mostarda da Lara.
- **As pastas são as do Matheus**, como na Lara; a mão é a dele, sem luva. O jogo monta com `montarAgente('nicolas')`.
- **A textura** nasceu do mesmo gerador da Lara: o ponto de partida para repintar à mão.

## O Victor (11/nov)

`modelos/victor.bbmodel`: um personagem secundário, para usar mais tarde. O ocultista da C.R.O.S., 35 anos (eram 45: mudado em 11/nov, a pedido): sente os
fantasmas e consegue bani-los, com magia, sem armas. Branco, magro, 1,84 m. O desenho (com uma referência do
desenvolvedor; os traços, não o personagem dela):

- **O rosto:** magro, as maçãs saltadas, olheiras leves de quem dorme pouco, a barba por fazer, sobrancelhas grossas e
  baixas (o olhar duro), olhos cinza-azulados, a boca séria de cantos caídos.
- **O cabelo:** grisalho cedo (escuro com fios brancos), em mechas grossas penteadas para trás, de alturas diferentes,
  com uma ponta levantada na frente, mais branca; os lados curtos e a nuca mais escuros. Sem mecha com física.
- **A roupa:** sobretudo preto de lã até o joelho, aberto, com lapelas largas; por baixo, o moletom cinza com o capuz
  caído em volta do pescoço e o punho aparecendo na manga; camisa cinza-escura com a gravata preta de listras finas;
  calça e botas pretas; anéis de prata no anelar esquerdo e no médio direito.
- **A barra do sobretudo** fica em três pastas dentro do `quadril`: `casaco_d` e `casaco_e` (a frente e o lado de cada
  perna, o ponto de giro na cintura) seguem as coxas, e `casaco_tras` abre quando ele corre
  (`src/game/player/animacao.ts`). Qualquer personagem com essas pastas ganha a barra que mexe.
- **As pastas são as do Matheus**, como na Lara e no Nicolas (sem as mechas `mecha_`). O jogo monta com `montarAgente('victor')`.
- **Falta (quando ele entrar no jogo):** a magia (os gestos, os efeitos), sentir e banir; ver "O Victor" em `docs/jogo.md`.

## Os objetos (móveis, máquinas, lâmpadas)

- **O arquivo tem o nome do tipo** em `modelos/objetos/` (o mapa guarda só o nome). Objeto novo: o arquivo e uma linha no
  catálogo `src/maps/objetos.ts` (o nome na tela, o grupo, o tamanho em metros para a colisão e a escolha).
- **32 px por metro** (como as paredes e o chão): 1 pixel por unidade. Cada face com UV próprio (sem Box UV), para pintar
  à vontade. A pintura que dá a cara do jogo: veio e nós na madeira, ferrugem e arranhões no metal, trama e dobras no
  tecido, pó no lençol, e em toda peça **a borda um pouco mais escura e a sombra embaixo**.
- **A origem é o centro da base** e **a frente é o sul (+Z)**, o lado que fica para a sala quando encosta na parede.
- **Bloco que brilha** (a chama, a lâmpada, a tela): o nome começa com `luz_`. Ele não recebe sombra e escurece quando a
  luz está no modo "apagada". A luz que ilumina a sala é do catálogo: o campo `luz` (onde ela fica no objeto, a cor, a
  força, o alcance).
- **Onde encosta** (o campo `apoio` no catálogo): no chão (padrão), no teto (a origem é o ponto que toca o teto; o
  modelo desce) ou na parede (a origem é o pé da placa, encostada; o jogo põe a 1,8 m do chão).
- **Leve:** os blocos de cada pasta viram uma malha só, e cada objeto do mapa é uma cópia que divide a geometria e a
  textura com os outros do mesmo tipo. Prefira uma pasta só (`raiz`) a menos que uma parte precise mexer.
- Os objetos de hoje (38) nasceram de um gerador, em 10/nov: são o ponto de partida para repintar e detalhar à mão.

## As portas e janelas

- Continuam sendo **aberturas** no mapa (presas à parede: o buraco, o estado, a chave, a colisão e o luar são do jogo);
  só o desenho vem do modelo.
- **O referencial é o da abertura:** a origem no começo do vão, no chão; x ao longo da parede (a largura), y para cima,
  z atravessando a parede (ela tem 12 cm: de −0,06 a +0,06 m). Os vãos têm medida fixa por tipo: porta comum 1 m × 2,1 m,
  dupla 2 m × 2,1 m, grande 2 m × 2,8 m; janela 1 m e janela grande 2 m, de 0,9 a 2,1 m do chão.
- **As folhas** ficam nas pastas `folha_1` (o ponto de giro na dobradiça, em x = 0,01) e `folha_2` (em x = largura − 0,01).
  O jogo gira essas pastas para abrir e fechar; o resto (guarnições, cornija) fica parado.
- **A janela:** o luar entra pelos vidros entre as divisões, que o jogo calcula pelas medidas do tipo (no meio na
  janela; em quartos na grande). Se mudar as divisões no modelo, avise: o luar precisa acompanhar.

## O que não vai para o Blockbench (e por quê)

| O quê | Por quê |
| --- | --- |
| Paredes, pisos, tetos e escadas | São montados pelo mapa (cada parede tem o seu tamanho e os seus cantos). A pintura deles é imagem: `texturas/<nome>.png` (abaixo) |
| O corrimão automático das escadas | Muda com cada escada. Usa a mesma madeira em pixel do guarda-corpo |
| O luar (o feixe, a mancha, a poeira) | É um efeito de luz, não um objeto |

## As texturas do cenário (paredes, pisos, tetos, escadas)

- Uma imagem por textura em `texturas/<nome>.png`, **32 × 32 px = um bloco de 1 m**. O nome é o que o mapa guarda.
- **Sem costura:** a textura se repete lado a lado; o que sai por uma borda tem que entrar pela outra. Para pintar com a
  emenda à vista, um editor de pixel com o modo lado a lado (Piskel, grátis no navegador; LibreSprite) é melhor que o Blockbench.
- Textura nova: o PNG e uma linha no catálogo `src/maps/textures.ts` (o nome na tela, em que paletas aparece, a cor de base).

## As armas

- `modelos/armas/<nome>.bbmodel`, com **64 px por metro** (como os personagens: aparecem de perto, na mão). As três de
  hoje (`pistola`, `escopeta`, `armadilha`) nasceram de um gerador em 10/nov, com as medidas do laboratório.
- **O cano aponta para +z** e y é para cima.
- Pastas com nome fixo:
  - `empunhadura` (vazia): o ponto que vai na mão. Mova a pasta para mudar onde a mão segura;
  - `cano` (vazia): de onde sai o tiro e o clarão (na armadilha, a íris de cima, de onde sai o raio);
  - `bomba` (só a escopeta): a bomba de madeira, que corre para trás no tiro.
- Bloco `luz_` brilha sozinho: o frasco de ectoplasma da pistola e o vidro da armadilha.
- Como a mão segura cada uma (o giro e o ponto na palma) fica em `src/game/player/arma.ts`: a pistola e a escopeta com o
  cano seguindo os dedos, a armadilha pendurada pela alça.

## Passo a passo

1. **Abrir o Blockbench.** Use direto no navegador em https://web.blockbench.net ou instale em https://www.blockbench.net
   (botão Download, versão Windows). O instalado é melhor: salva direto na pasta do projeto.
2. **Abrir o Matheus:** Arquivo → Abrir modelo → `modelos/agente.bbmodel`.
3. **Olhar em volta:** botão direito gira, botão do meio move, rodinha aproxima. À direita, o Organizador mostra as pastas
   (as juntas) e os blocos.
4. **Os três modos** (no alto, à direita):
   - **Editar:** clique num bloco para escolher; as setas movem, a ferramenta de tamanho estica. O painel Transformar mostra
     os números exatos.
   - **Pintar:** escolha o pincel e a cor e pinte direto no modelo, pixel por pixel. Dá para pintar também no painel UV,
     à esquerda (a textura aberta).
   - **Animar:** não use por enquanto: as animações ficam no código (andar, correr, esquivar, mirar).
5. **Testar uma junta:** no modo Editar, escolha a pasta `braco_e` e gire (ferramenta de girar). O braço inteiro deve girar
   pelo ombro. Desfaça com Ctrl+Z.
6. **Salvar:** Arquivo → Salvar modelo (Ctrl+S), por cima de `modelos/agente.bbmodel`. No Blockbench do navegador, o arquivo
   vai para Downloads: copie para `modelos/` no lugar do antigo.
7. **Ver de perto:** Modo desenvolvedor → **Ver modelos**. O personagem sozinho, com a câmera girando em volta, a luz
   de estúdio ou a do jogo (uma lâmpada no escuro), e botões para a animação (parado, andando, correndo, esquiva, queda), a
   expressão, a pose das mãos, a arma na mão, os gestos de parado e o ângulo (corpo, rosto, mãos, pés, costas). As armas e os objetos
   também aparecem sozinhos (escolha no seletor Modelo). Mostra também a altura e o peso do modelo.
8. **Ver no jogo:** no criador de mapas, aperte **Testar (T)**. Não precisa exportar nada. Para ver o rosto, ande para
   trás (S) e o agente vira de frente para a câmera. No Testar, as teclas **1 a 6** mostram as expressões (neutra, esforço,
   medo, dor, raiva, surpresa), **7 a 9** as mãos (punho, aberta, apontar) e **0** volta ao automático; **J** toma dano, **F** usa um kit, **K** faz ele cair; **Q** troca a arma na mão; o botão direito mira e o esquerdo atira (o clarão sai na pasta `cano`) ou joga a armadilha (um clique a chama de volta).

## Os fantasmas

- `modelos/fantasmas/<nome>.bbmodel`, com 64 px por metro (o rosto com 128), como os personagens. A primeira: a Mãe
  (`mae.bbmodel`, nasceu de um gerador em 10/nov, para detalhar à mão).
- As juntas pelos mesmos nomes do Matheus (quadril, tronco, pescoco, cabeca, braco/antebraco/mao, os dedos, coxa/canela/pe).
  A Mãe tem mais algumas: o `peito` dentro do `tronco` (a coluna dobra em dois lugares) e as clavículas `ombro_d` e
  `ombro_e` (os braços saem delas: o ombro sobe quando o braço passa da altura dele). O rosto também é feito de pastas
  dentro da `cabeca`:
  - `mandibula`: o queixo, preso atrás, perto das orelhas, que cai no grito. Em cima dele fica a `boca_dentro`, escura:
    com a boca fechada ela some dentro da cabeça;
  - `olho_d` e `olho_e`: os blocos `luz_` ficam dentro delas, e os olhos estreitam, arregalam e quase fecham;
  - `sobrancelha_d` e `sobrancelha_e`: franzem e sobem.
- **O que balança:** toda pasta `mecha_...` (o cabelo, presa na cabeça) e `saia_...` (a saia, presa no quadril; a ponta
  de cada painel numa pasta dentro dele, `saia_N_ponta`) balança com mola sozinha. Pasta nova com esses nomes já balança.
- Por baixo da saia, a anágua: blocos fixos na pasta `anagua` (sem física), entre os painéis, para não
  aparecerem frestas quando a saia balança. As mechas da frente nascem na borda do rosto, não na frente dele.
- Os olhos que brilham: blocos `luz_`. Na Mãe, a cor e a força do brilho mudam com a expressão: ficam vermelhos na caça
  e no ataque e apagam quando ela está exausta.
- Personagem (o Matheus, os fantasmas): o jogo junta tudo numa malha só com ossos (uma chamada de desenho). Para você não
  muda nada: as pastas continuam sendo as juntas.

## Os demônios (12/nov)

- `modelos/demonios/<nome>.bbmodel`, com 64 px por metro, como os personagens: o Assombrado (`assombrado.bbmodel`) e a
  Asa sombria (`asa-sombria.bbmodel`). As pastas de cada um, o desenho e as animações estão em `docs/demonios.md`.
- **Não têm o esqueleto do Matheus:** cada um tem as juntas do próprio corpo (o Assombrado: `quadril`, `corpo`, os três
  olhos, os braços com a `garra`, a perna `coxa` › `canela` › `pe`; a Asa sombria: `corpo`, as quatro pétalas da boca,
  o `nucleo`, as asas com a ponta). O nome das pastas é o que o código procura.
- **A Asa sombria voa:** a origem dela é o centro do corpo, não o chão (no Blockbench ela fica metade abaixo da grade).
  As pétalas giram pela pasta: o ponto de giro de cada uma é a dobra, na ponta de fora do losango da boca.
- **O que balança:** toda pasta `mecha_...` (a ponta do capuz, os pingos de matéria) balança com mola, presa no `corpo`.
- **O que brilha:** blocos `luz_`, cada um na sua pasta (os olhos do Assombrado, o núcleo da Asa): é a pasta que pisca,
  apaga e cresce.
- **A perna do Assombrado é calculada no jogo:** a dobra que aparece no Blockbench vem do giro das pastas da perna, só
  para o desenho; pode mudar o tamanho da coxa e da canela, o jogo mede no arquivo.
- **Muitos ao mesmo tempo:** o jogo monta o modelo uma vez e faz cópias que dividem a geometria, o material e a
  textura. Mantenha uma textura pequena e poucos blocos `luz_`.

## O que vem depois

1. ✅ **Ligar no jogo** (10/nov): o Testar lê `modelos/agente.bbmodel` e as animações do laboratório (andar, correr,
   esquivar) giram as pastas pelo nome (`src/game/player/modelo.ts`).
2. ✅ **O Matheus detalhado** (10/nov): cabeça de um bloco só com o rosto pintado (nariz e orelhas em sprite) e pescoço curto; cabelo em camadas (topo, coroa,
   nuca, lados, topete) e 7 mechas com física (quatro na nuca até a gola e três na franja; as dos lados saíram em
   10/nov, a pedido); rosto com expressões; mãos com palma, polegar e quatro dedos de duas falanges (luva sem dedos);
   botas com cano, biqueira, salto e sola; gola, lapelas, bolsos, alças, cinto com bolsas, coldre e os frascos da mochila.
3. **Os fantasmas no mesmo estilo:** ✅ a Mãe (o modelo, 10/nov; as animações em etapas) e o Glutão (ver
   "A identidade visual" em `docs/jogo.md`).
4. **Os demônios, os Sombrios** (12/nov): em `modelos/demonios/`, com as pastas de cada um em `docs/demonios.md`.
   ✅ O Assombrado (`assombrado.bbmodel`) e a Asa sombria (`asa-sombria.bbmodel`): os modelos de partida, para retocar.
5. **Lara e Nicolas**: ✅ os modelos (11/nov, acima); a lanterna da Lara, as rotas, as falas e as cenas quando a demo Intro for trazida.
