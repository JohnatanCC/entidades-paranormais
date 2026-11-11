# A iluminação do jogo

O que está decidido sobre a luz, como ela é feita e as etapas. Os números ficam no código (dito em cada parte).

## Decisões (11/nov)

| Tema | Decisão |
| --- | --- |
| Shaders do Minecraft | Não dá para importar (o pipeline é outro e as licenças não deixam). As técnicas são refeitas no three.js |
| A estética | **Ação, não breu**: a cena é sempre legível (o agente e os fantasmas aparecem). O terror vem do contraste: as poças de luz quente das lâmpadas e o luar frio das janelas contra os cantos escuros, e de momentos que mudam a luz por alguns segundos |
| O filtro PS1 | Saiu do projeto inteiro (o pós-processo, o tremor de vértice, a opção "Imagem" das configurações e o "suave", que só existia por causa dele) |
| A luz não é fixa | Cada lugar tem a sua **ambientação**; dentro e fora da mansão têm tons diferentes; a troca é suave |
| Como o mapa marca | Uma ambientação padrão do mapa e **áreas retangulares** por andar, cada uma com o nome de uma predefinição (o formato 2 do mapa: `docs/criador-de-mapas.md`). O mapa guarda só o nome |
| Celular | O que pesa é preencher a tela: no máximo **uma** passada de tela cheia, e o nível Baixo não tem nenhuma |

## Como funciona

- **A ambientação** (`src/maps/ambientes.ts`): o catálogo, com os números de cada lugar. Hoje: `mansao` (interior
  quente e escuro), `corredor` (mais fechado e frio, a neblina mais perto) e `exterior` (a noite azul, o luar de cima).
  Cada uma diz: a neblina (cor e densidade; a cor é também a do fundo), a luz ambiente (de cima e de baixo), o
  preenchimento, o luar direto, o contorno dos personagens, a exposição, o brilho (a força do bloom) e a correção de cor (o tom das sombras e das
  luzes, o contraste, a saturação, a vinheta). Para criar outra, acrescente uma entrada: ela aparece sozinha no editor.
- **A luz ambiente** nunca é zero: é o que mantém a cena legível. **O preenchimento** é uma luz fraca que vem de trás
  da câmera (de cima e um pouco de lado): o que o jogador olha tem sempre volume, sem custar uma sombra.
- **O contorno dos personagens** (`src/render/contorno.ts`): as faces do agente e dos fantasmas viradas de lado para a
  câmera acendem um pouco, e o corpo todo tem um mínimo de luz própria. É feito no material deles (nenhuma luz a mais).
- **A neblina** tem cor e esconde o fundo (depois ajuda o carregamento por blocos: o que está longe some nela).
- **O céu da noite** (11/nov, nos três níveis; `src/game/luz/ceu.ts`): uma cúpula em volta da câmera com o degradê do
  alto até o horizonte, as estrelas (quadradinhos que cintilam) e a lua em pixels. Uma malha e um material (uma chamada
  de desenho), desenhada por último e no fundo: só gasta nos pixels onde o céu aparece. O horizonte é a cor da neblina,
  então o chão que some ao longe some na cor do céu. Cada ambientação diz o `zenite`, as `estrelas` e a `lua`; a lua
  passa do branco e ganha halo com o bloom. A posição da lua é `LUA` (no catálogo), e o luar de fora vem de lá.
- **As lâmpadas e o luar das janelas** continuam sendo do mapa (os objetos de luz e as janelas com luar).
- **A troca entre áreas** (`src/game/luz/luz.ts`): a ambientação é a da menor área que contém o agente (no andar
  dele), ou a padrão do mapa. A luz anda até a nova em ~1,6 s (`TROCA`).
- **Os momentos** (`MOMENTOS`, no mesmo catálogo): uma mudança por alguns segundos, por cima da ambientação do lugar,
  com tempo de entrar, durar e sair. O jogo chama `momento('mae-chegando')`. No Testar, a tecla **M** toca esse.
- **A imagem final**: o tonemapping é o ACES. No nível Baixo é o do próprio three, sem passada nenhuma (o tom vem das
  luzes e da neblina). No Médio e no Alto a cena é desenhada numa textura e **uma** passada soma o bloom e faz a
  exposição, o ACES, a correção de cor, a vinheta e um pontilhado mínimo contra as faixas no escuro (`src/render/passeFinal.ts`).
- **O bloom** (etapa 2, só no Médio e no Alto): o que é claro na cena vaza em volta. A cena é reduzida várias vezes (cada
  nível com a metade do anterior) e somada de volta do menor para o maior; tudo em texturas pequenas (a maior tem 1/4 da
  tela no Médio e 1/2 no Alto), então de tela cheia continua sendo uma passada só. O que acende sozinho (os blocos
  `luz_` dos modelos: lâmpadas, chamas, os olhos da Mãe, a luz da armadilha) fica 3× mais forte que o branco enquanto o
  bloom está ligado (`src/render/brilho.ts`): é isso que dá o halo. O luar das janelas e as paredes bem perto de uma
  lâmpada também vazam um pouco. A força é o `brilho` de cada ambientação (o momento "a Mãe chegando" aumenta).
- **A sombra de canto** (etapa 3a, nos três níveis; `src/editor/wallMesh.ts`): onde a parede encontra o chão, o teto ou
  outra parede, a malha escurece macio (o "smooth lighting" do Minecraft). Cada vértice das paredes, dos pisos e dos
  tetos guarda o quanto está encostado num canto, e o material multiplica a cor por isso. **Não fica gravado no mapa**
  (decidido em 11/nov): é calculado das paredes e dos pisos toda vez que a malha é montada, como o corrimão automático;
  o formato do mapa não mudou. Não custa nada por quadro. Aparece também no editor. Os números: `SOMBRA` (a força de
  cada encosto e até onde a sombra sobe na parede). A porta e o vão não escurecem o chão; os móveis e as escadas não
  entram na conta.
- **Toda cena de jogo usa `<Iluminacao />`** (`src/game/luz/Iluminacao.tsx`): o Testar e a luz "Jogo" do Ver modelos.

## Os níveis de qualidade (`src/render/qualidade.ts`)

| Nível | Resolução (pixels por ponto da tela) | Passada final (cor, vinheta) | Bloom | Suavização das bordas |
| --- | --- | --- | --- | --- |
| Baixo (celular) | até 1 | não | não | a da tela |
| Médio | até 1,5 | sim | a partir de 1/4 da tela, 4 níveis | 2 amostras |
| Alto | até 2 | sim | a partir de 1/2 da tela, 5 níveis | 4 amostras |

Nas configurações: **Automático** (o padrão; mostra qual nível escolheu), Baixo, Médio e Alto. O automático olha o
aparelho (tela de toque, memória, núcleos, o nome da placa de vídeo) e, nos primeiros segundos de uma cena de jogo, mede
os quadros: se a média passar de 24 ms, desce um nível e mede de novo. Só desce (subir e descer sem parar seria pior), e
vale até recarregar a página.

## As etapas

1. **Tonemapping, correção de cor e neblina, com níveis de qualidade.** ✅ (11/nov) O que está acima, mais a
   ferramenta **Ambientação (9)** do criador de mapas e o mapa `maps/teste-iluminacao` (uma sala com uma lâmpada, uma
   janela com luar e um canto escuro; um corredor; o quintal).
2. **Bloom.** ✅ (11/nov) As lâmpadas, o luar das janelas, os olhos e as luzes dos modelos brilham, no Médio e no Alto.
   No Baixo nada muda (sem passada, sem bloom).
3. **Luz e sombra "assadas" na malha do mapa**, nos três níveis, sem custo por quadro. Dividida em duas versões
   (decidido em 11/nov):
   - **3a. A sombra de canto.** ✅ (11/nov) O escurecimento macio dos cantos, calculado ao montar a malha.
   - **3b. A luz das lâmpadas assada**, com as paredes bloqueando: a lâmpada para de clarear o cômodo vizinho e a luz de
     fora deixa de clarear o que está dentro. Mexe em como os personagens e a lâmpada "falhando" são iluminados (hoje
     cada lâmpada é uma luz de verdade): decidir isso antes de construir.
4. **Sombras em tempo real**, só no nível Alto.
5. **Materiais** (proposta de 11/nov, depois da 4): **5a** o brilho de cada textura (mármore reflete, tapete não), em
   todos os níveis; **5b** o relevo de luz gerado da própria textura, no Alto, com a criação do nível **Ultra**;
   **5c** o relevo de verdade (parallax), só no Ultra, como experimento.

Fora da numeração, já feito: **o céu da noite** ✅ (11/nov). Ficaram para depois: a aurora, as nuvens e as silhuetas no horizonte.

## Limites conhecidos

- A ambientação é uma só para a tela inteira (a de onde o agente está): olhando de fora para dentro por uma porta, o
  interior aparece com a luz de fora, e o contrário. A etapa 3 resolve o grosso disso.
- As luzes não fazem sombra: a lâmpada de um cômodo clareia o cômodo vizinho através da parede (etapas 3b e 4).
- O feixe de luar das janelas tem a neblina dele, fixa: não acompanha a densidade da ambientação. E a direção dele é
  própria de cada janela: não segue a posição da lua no céu (toda janela com luar tem feixe, de qualquer lado da casa).
- O editor e o Testar dividem a mesma tela, criada com a suavização de bordas do navegador ligada; no Médio e no Alto ela
  fica sem uso durante o teste. A tela própria do jogo, quando existir, nasce sem ela.
- O bloom não tem limiar por objeto: qualquer coisa bem clara vaza (uma parede branca colada numa lâmpada, por exemplo).
  Se algo brilhar demais, baixe o `brilho` da ambientação ou a força da lâmpada.
- O nível Baixo ainda não foi medido num celular de verdade: os números dele são o ponto de partida.
