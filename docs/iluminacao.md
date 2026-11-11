# A iluminação do jogo

O que está decidido sobre a luz, como ela é feita e as etapas. Os números ficam no código (dito em cada parte).

## Decisões (11/nov)

| Tema | Decisão |
| --- | --- |
| Shaders do Minecraft | Não dá para importar (o pipeline é outro e as licenças não deixam). As técnicas são refeitas no three.js |
| A estética | O terror vem do contraste: as poças de luz quente das lâmpadas e o luar frio das janelas contra o escuro, e de momentos que mudam a luz por alguns segundos. **Desde 11/nov (a pedido): a luz ambiente é baixa**, onde não chega lâmpada nem janela é escuro de verdade, e quem ilumina são as fontes de luz. O agente e os fantasmas continuam visíveis pelo contorno de luz deles |
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
- **A luz ambiente** é baixa mas nunca zero (o jogador precisa enxergar por onde anda). **O preenchimento** é uma luz fraca que vem de trás
  da câmera (de cima e um pouco de lado): o que o jogador olha tem sempre volume, sem custar uma sombra.
- **O contorno dos personagens** (`src/render/contorno.ts`): as faces do agente e dos fantasmas viradas de lado para a
  câmera acendem um pouco, e o corpo todo tem um mínimo de luz própria. É feito no material deles (nenhuma luz a mais).
- **A neblina** tem cor e esconde o fundo (depois ajuda o carregamento por blocos: o que está longe some nela).
- **O céu da noite** (11/nov, nos três níveis; `src/game/luz/ceu.ts`): uma cúpula em volta da câmera com o degradê do
  alto até o horizonte, as estrelas (quadradinhos que cintilam) e a lua em pixels. Uma malha e um material (uma chamada
  de desenho), desenhada por último e no fundo: só gasta nos pixels onde o céu aparece. O horizonte é a cor da neblina,
  então o chão que some ao longe some na cor do céu. Cada ambientação diz o `zenite`, as `estrelas` e a `lua`; a lua
  passa do branco e ganha halo com o bloom. A posição da lua é `LUA` (no catálogo), e o luar de fora vem de lá.
- **As lâmpadas e o luar das janelas** são do mapa (os objetos de luz e as janelas com luar). A força padrão das
  lâmpadas é `FORCA_LUZ` em `src/maps/objetos.ts` (reforçadas em 11/nov). **A janela com luar ilumina o cômodo de
  verdade** (11/nov): uma luz fria no meio dela, só para dentro, calculada na malha em todos os níveis (`JANELA` em
  `src/maps/luzAssada.ts`); o feixe e a mancha no chão continuam sendo o desenho por cima, **mais sutil no jogo** que
  no editor (`LUAR_NO_JOGO` em `src/maps/ambientes.ts`: lá o bloom ainda soma por cima do feixe).
- **A sombra de chão** (11/nov, nos três níveis; `src/game/corpo/sombraDeChao.ts`): um círculo escuro e macio embaixo
  do agente. É o que cola ele no chão onde não há sombra projetada (o Baixo inteiro, e qualquer lugar sem lâmpada com
  sombra nem lua). Os fantasmas ganham a deles quando entrarem no jogo.
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
- **A luz das lâmpadas assada** (etapa 3b; `src/maps/luzAssada.ts`, `src/render/assada.ts`): cada
  vértice de paredes, pisos, tetos e escadas guarda a luz que chega nele de cada lâmpada do mapa, com as paredes e os
  pisos bloqueando. No Baixo o cenário usa essa cor no lugar de todas as lâmpadas de verdade: a lâmpada não clareia
  mais o cômodo vizinho, e o cenário deixa de fazer a conta de todas as lâmpadas em cada pixel (o maior ganho do
  celular). **No Médio e no Alto o modo é misto**: só as lâmpadas que fazem sombra (a mais perto do agente no Médio, as
  3 mais perto no Alto) são de verdade no cenário, que é o que o brilho e o relevo da etapa 5 precisam; todas as outras vêm da malha. Assim nenhuma lâmpada
  vaza pela parede: ou tem sombra, ou é assada. Para isso cada vértice guarda as duas lâmpadas mais fortes nele com o
  número de cada uma (o jogo tira da conta a que virou luz de verdade) e o resto somado. Também não fica gravada no
  mapa: é calculada ao montar a malha.
  - **Os objetos seguem a mesma regra** (11/nov): móveis, portas, janelas, personagens e armas só recebem de verdade
    as lâmpadas com sombra; o resto vem de **uma amostra da luz assada no lugar onde o objeto está** (sem direção: o
    objeto clareia por igual). Móveis e portas tiram a amostra uma vez; o agente, a cada 4 quadros. Para isso cada
    objeto do mapa tem um material só dele (a geometria e a textura continuam divididas; `src/render/remendos.ts`
    refaz na cópia as mudanças de shader). A porta usa a média dos dois lados da parede.
  - Porta e vão deixam a luz passar só pelo buraco deles (aberta ou fechada; a parede em cima bloqueia); parede e
    janela bloqueiam; o piso bloqueia entre andares, menos no buraco da escada.
  - As lâmpadas **falhando** **piscam todas juntas** no jogo, nos três níveis (decidido em 11/nov).
  - As paredes têm vértices a cada 0,5 m para a luz ter onde cair; os pisos e tetos, a cada 1 m. A poça de luz fica
    mais macia e em losangos, no estilo do Minecraft.
- **As sombras em tempo real** (etapa 4, no Médio e no Alto; `src/render/sombras.ts`): a **lua** faz uma sombra para
  tudo em volta do agente (48 × 48 m; textura de 2048 no Alto e 1024 no Médio), e as **lâmpadas acesas mais perto do
  agente** fazem sombra (512 cada): 3 no Alto e 1 no Médio (a pedido, 11/nov: no começo era só no Alto). Sombra de lâmpada é cara: cada uma desenha a cena seis vezes por quadro; por isso só as mais perto, escolhidas
  de novo a cada 0,4 s. Paredes, pisos, escadas, corrimão, portas, móveis e personagens fazem e recebem sombra; o que
  acende (os blocos `luz_`) e a peça que tem a lâmpada dentro não fazem (a cúpula do abajur taparia a própria luz).
  Dentro de casa o luar é zero: a lua deixa de fazer sombra e o cenário nem faz a conta dela (a troca, ao entrar e
  sair, refaz os programas uma vez; depois ficam guardados). **No Médio a borda da sombra é dura** (uma leitura de
  textura por pixel, no lugar de 17 para a lua e 9 por lâmpada); no Alto é suavizada. **No Médio cada sombra é refeita quadro sim, quadro
  não** (a da lua e a da lâmpada em quadros alternados): metade do custo, com um quadro de atraso que não se nota. Os números: `sombras` de cada nível em `qualidade.ts`.
- **Toda cena de jogo usa `<Iluminacao />`** (`src/game/luz/Iluminacao.tsx`): o Testar e a luz "Jogo" do Ver modelos.

## Os níveis de qualidade (`src/render/qualidade.ts`)

**Desde 11/nov são quatro níveis e cada recurso é ajustável.** Um nível (Baixo, Médio, Alto, **Ultra**) é um conjunto de
recursos; nas configurações o jogador escolhe o nível e pode mudar qualquer recurso por cima dele (os ajustes ficam
guardados junto; trocar de nível desfaz). Os recursos de hoje: resolução, correção de cor, bordas suaves, brilho das
luzes (bloom), sombra das lâmpadas (0, 1 ou 3), detalhe da sombra, sombra da lua, borda da sombra, ritmo da sombra,
reflexo dos materiais e nitidez das texturas ao longe. **O Ultra é o mais pesado: tudo o que melhora luz e sombra entra
nele primeiro** (decisão do desenvolvedor); hoje ele é o Alto com a sombra das lâmpadas em 1024, a da lua em 4096 e as
texturas mais nítidas ao longe. O Automático nunca escolhe o Ultra. Um recurso novo: o campo em `Recursos`, o valor em
cada nível e a linha em `OPCOES` (ela aparece sozinha nas configurações). A tabela abaixo é a dos três primeiros níveis.

| Nível | Resolução (pixels por ponto da tela) | Passada final (cor, vinheta) | Bloom | Suavização das bordas | Lâmpadas no cenário | Sombras |
| --- | --- | --- | --- | --- | --- | --- |
| Baixo (celular) | até 1 | não | não | a da tela | assadas | não |
| Médio | até 1,5 | sim | a partir de 1/4 da tela, 4 níveis | 2 amostras | mistas (de verdade a 1 com sombra) | a lua e 1 lâmpada |
| Alto | até 2 | sim | a partir de 1/2 da tela, 5 níveis | 4 amostras | mistas (de verdade as 3 com sombra) | a lua e 3 lâmpadas |

**As metas** (do desenvolvedor, 11/nov, na mansão): Baixo 60 quadros por segundo ou mais, Médio de 50 a 60, Alto de 30 a
40. Medido no PC dele (1875 × 964 px) antes de aliviar o Médio: Baixo 60, Médio 46, Alto 37 a 40. No Médio o
processador gastava 6,4 ms de 21,4 mandando desenhar: quem limitava era a placa de vídeo, no custo de cada pixel.

**A resolução e as sombras do nível são propriedades do `<Canvas>`** (`canvasDoNivel` em `qualidade.ts`): o React
Three Fiber repõe as duas a cada redesenho da tela, então ligar por dentro da cena não dura. Foi um defeito de 11/nov:
as sombras desligavam sozinhas no meio do teste e as lâmpadas com sombra sumiam (o salão ficava preto no Alto). As
medidas de quadros feitas antes desse conserto não valem: parte delas foi com as sombras desligadas.

**A prévia ao vivo** (11/nov): ao lado dos ajustes, as configurações mostram a sala do mapa `teste-iluminacao` (a
lâmpada, a janela com luar, os móveis, o agente parado) desenhada com a qualidade escolhida, com os quadros por segundo
(F3 mostra o detalhe). Mudar o nível ou um recurso muda a cena na hora. Se o mapa sair da pasta, a prévia avisa e some.

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
   - **3b. A luz das lâmpadas assada.** ✅ (11/nov) No Baixo e no Médio, com as paredes bloqueando.
4. **Sombras em tempo real.** ✅ (11/nov) No Médio (a lua e 1 lâmpada) e no Alto (a lua e 3 lâmpadas).
5. **Materiais.** **5a ✅ (11/nov)** o brilho de cada textura: o catálogo (`src/maps/textures.ts`) diz o `brilho` de 0
   (fosca) a 1 (polida) e se é `metal`; mármore, azulejo e ladrilho refletem a luz, tapete, reboco e grama não. Sem
   custo (é um número do material). Só as luzes de verdade fazem reflexo (o luar, o preenchimento e as lâmpadas com
   sombra): aparece no Médio e no Alto, quase nada no Baixo. Os móveis e os personagens não entraram. **5b** o relevo de luz gerado da própria textura, como recurso do Ultra (o nível já existe);
   **5c** o relevo de verdade (parallax), só no Ultra, como experimento.

**A luz indireta ✅ (11/nov; o recurso "Luz indireta", ligado no Ultra e ajustável em qualquer nível).** Antes a luz
ambiente era igual em todo lugar, e um salão sem lâmpada ficava com o piso claro por igual. Agora o mapa calcula a luz
que sobra depois de bater nas coisas, como a luz dos blocos do Minecraft (`src/maps/luzAssada.ts`): cada quadrado de
piso com uma lâmpada, uma janela ou o céu por cima começa com um tanto de luz, e ela se espalha de quadrado em
quadrado perdendo força (`queda` por metro), passa pelas portas, pelo vão da escada e pelo pé-direito duplo, e para
nas paredes. Com o recurso ligado a luz ambiente geral das ambientações cai para `INDIRETA.ambiente` (25%). O cômodo
vizinho de um cômodo aceso fica na penumbra; longe de qualquer luz, escuro de verdade. É uma cor a mais por vértice e
uma amostra por objeto: não pesa por quadro. Os números: `INDIRETA` (rebote, branco, queda, céu, ambiente).
Limites: a lâmpada "falhando" entra como acesa (a luz indireta não pisca); fora de casa só vale onde há piso no mapa.

Fora da numeração, já feito: **o céu da noite** ✅ (11/nov). Ficaram para depois: a aurora, as nuvens e as silhuetas no horizonte.

## Limites conhecidos

- A ambientação é uma só para a tela inteira (a de onde o agente está): olhando de fora para dentro por uma porta, o
  interior aparece com a luz de fora, e o contrário. A etapa 3 resolve o grosso disso.
- **Em aberto: a lâmpada "falhando" do andar de baixo vaza para o andar de cima** (visto pelo desenvolvedor em 11/nov, só
  com as que piscam, mesmo depois de recarregar a página). Não foi reproduzido: no corredor de cima da mansão, sobre a
  `lampada-corredor-fundos`, a página recém-carregada fica limpa nos três níveis. Deixado de lado por decisão dele; por
  enquanto, evitar o modo "falhando" em lâmpadas que tenham cômodo em cima.
- A luz assada de um objeto é uma amostra só, no meio dele: um móvel comprido entre a luz e o escuro clareia inteiro
  por igual, e a porta entre um cômodo aceso e um escuro fica com a média dos dois.
- No Baixo os objetos e os personagens não recebem nenhuma lâmpada de verdade: só a amostra, sem lado claro e escuro.
- Um vértice guarda só as duas lâmpadas mais fortes com número: uma terceira lâmpada fraca num ponto, se virar luz de
  verdade no Alto, conta duas vezes ali (fica um pouco mais claro). Só acontece onde três lâmpadas se cruzam.
- A luz da janela não chega nos personagens nem nos móveis (só no cenário), e não muda com a ambientação.
- O feixe de luar das janelas tem a neblina dele, fixa: não acompanha a densidade da ambientação. E a direção dele é
  própria de cada janela: não segue a posição da lua no céu (toda janela com luar tem feixe, de qualquer lado da casa).
- O editor e o Testar dividem a mesma tela, criada com a suavização de bordas do navegador ligada; no Médio e no Alto ela
  fica sem uso durante o teste. A tela própria do jogo, quando existir, nasce sem ela.
- A luz assada não muda durante o jogo: uma lâmpada que apagar por script vai pedir que a malha seja refeita (é rápido,
  mas ainda não existe quem peça). E o luar de fora continua clareando o que está dentro quando o agente está fora.
- O bloom não tem limiar por objeto: qualquer coisa bem clara vaza (uma parede branca colada numa lâmpada, por exemplo).
  Se algo brilhar demais, baixe o `brilho` da ambientação ou a força da lâmpada.
- O automático mede contra 24 ms por quadro, pensando numa tela de 60 quadros por segundo: num navegador ou aparelho
  travado em 30 (economia de bateria, alguns painéis embutidos) ele desce até o Baixo mesmo com folga. Visto em 11/nov
  no navegador de teste, que trava em 30.
- O nível Baixo ainda não foi medido num celular de verdade: os números dele são o ponto de partida.
