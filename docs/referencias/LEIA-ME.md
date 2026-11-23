# As imagens de referência (23/nov)

Imagens geradas por IA (o prompt de cada uma está nas conversas; o estilo é o low poly facetado, com a pintura em pixel
por cima) para servir de **alvo ao modelar no Blockbench**. **Os PNGs não vão para o git** (`.gitignore`: são 23 imagens,
uns 41 MB): ficam só nesta pasta, no computador do desenvolvedor, e **o backup é por conta dele**. Este arquivo é o que
fica versionado.

Elas são **referência de forma, cor e clima**, não o modelo: o jogo tem blocos de 1 m no cenário, e os personagens
são feitos no Blockbench (`docs/blockbench.md`). Onde a imagem e o jogo discordam, vale o jogo.

## Os personagens

| Arquivo | Quem | O que serve e o que não |
| --- | --- | --- |
| `matheus.png` | Matheus Moura | A roupa, as cores e a lamparina. **Tem a mochila com os frascos**, que o desenvolvedor trocou por uma **faixa de balas de Demantino** (sem brilho) do ombro esquerdo ao quadril direito; os frascos turquesa vão para atrás do cinto |
| `lara.png` | Lara | A roupa (colete verde-oliva com mostarda, calça cargo), o coque com a faixa dourada, os cachos |
| `nicolas.png` | Nicolas | A jaqueta vinho, o rádio de campanha e a antena, as alças de couro, o bigode de guidão. O sorriso saiu de boneco |
| `victor.png` | Victor | A roupa de chefe (camisa, gravata de bolinhas, calça social). O rosto saiu envelhecido demais e a camisa saiu cinza-clara (no jogo é branca) |
| `leonardo.png` | Leonardo | O sobretudo preto, o moletom com capuz caído, o cabelo azul-escuro. Falta a heterocromia (olho esquerdo prateado, direito preto) |

## Os fantasmas

| Arquivo | Quem | O que serve e o que não |
| --- | --- | --- |
| `mae.png` | A Mãe | A mais fiel: altura, braços longos, unhas em garra, olhos brancos de cega, o vestido de painéis sobre a anágua. Mais pintada do que low poly |
| `assombrado.png` | O Assombrado | Os três olhos, a perna única de ave, o capuz rasgado. O corpo saiu como bola (no jogo é uma gota chanfrada) e a ponta do capuz tem cara de chapéu de bobo, com guizos: puxa para o fofo, pedir mais simples |
| `asa-sombria.png` | A Asa sombria | Pronta: sem olhos, a boca de pétalas costurada em X, as asas com a borda vermelha em degraus |
| `devora-almas.png` | O Devora almas | O tubarão rachado, o vermelho por dentro, as costelas no flanco, a sobrancelha de osso, os tentáculos |
| `mestre.png` | O Mestre | O manto de penas, as costelas, o bico de osso, os dois olhos amarelos. O manto saiu fechado na frente (no jogo é aberto) |
| `gralha.png` | A Gralha | A caveira de bico serrilhado, um olho amarelo, as penas arrepiadas. Mais emplumada e maior que o modelo |

## O cenário do capítulo 2 (o cemitério)

| Arquivo | O que é |
| --- | --- |
| `cemiterio-arena-cima.png` | A arena vista de cima: a clareira circular livre e as bordas cheias (capela, mausoléu, árvore, portão, estátuas, cova) |
| `cemiterio-arena-3-4.png` | A mesma arena em 3/4, com o Matheus e a lamparina para dar a escala |
| `cemiterio-apagao.png` | O apagão: tudo escuro, o Mestre preso no feixe da lamparina, os corvos de olhos amarelos |

O que isso quer dizer para o jogo está em `docs/cap2-sombra.md` ("A reformulação do capítulo").

## Os props e as texturas do cemitério (23/nov)

Folhas de peças separadas, para modelar uma por uma (cada tipo vira um objeto: uma malha e uma textura). **Estão mais
detalhadas do que o jogo precisa** (fendas finas, folhas de hera, centenas de galhos): ao modelar, poucas facetas
grandes e o detalhe pintado, como no Matheus limpo. A ordem sugerida, do mais fácil ao mais difícil: lápides e cruzes,
cova e caixão, cerca e poste, mausoléu, capela, estátuas e árvore.

| Arquivo | O que tem | O que olhar |
| --- | --- | --- |
| `props-lapides.png` | 10 lápides e cruzes diferentes (de arco, reta, quebrada, inclinada, celta, simples, caída, com cordeiro, com corvo, sem nome), com a figura para a escala | As flores claras na pedra repetem em todas: variar na pintura |
| `props-estatuas.png` | O anjo chorando, o anjo rezando, o sem cabeça com a asa quebrada e a figura de capuz, de frente, lado e costas | Os rostos viram poucas facetas; a hera é pintura |
| `props-cerca-portao.png` | Os pedaços da cerca (reto, danificado, canto), o pilar de pedra com o corvo, o portão duplo (aberto e fechado) e o poste de luz quebrado | Os arabescos do portão viram poucas barras |
| `props-mausoleus.png` | O mausoléu grande (o corvo entalhado, as velas), a cripta de grade e o jazigo pequeno | O corvo entalhado vira pintura ou objeto à parte |
| `props-capela.png` | A capela em partes: a fachada com a rosácea, a parede com os vitrais, o canto, o telhado caído, o campanário com o sino, a escada e os escombros | A mais fácil de passar para o mapa em blocos |
| `props-arvores.png` | Três árvores grandes (uma com oco, a do poleiro dos corvos), duas pequenas e um toco | Os galhos finos são o que pesa: poucos blocos grossos |
| `props-cova-caixao.png` | A cova aberta, o monte de terra, o caixão meio fora da cova, o caixão fechado, a pá, a picareta e a cruz de madeira | Completo |
| `props-detalhes.png` | As velas (uma acesa), o grupo de velas, a lanterna quebrada, as rosas murchas, a bacia com o corvo, os ossos, a lápide quebrada, o mato seco e a laje | As velas acesas são `luz_` (o único ponto quente) |
| `texturas-cemiterio.png` | 9 texturas: terra, laje, laje com musgo, lama com poças, mato seco, cascalho, paralelepípedo com musgo, terra com raízes e parede de pedra | **Contrastadas demais para a regra do fundo calmo** (`docs/blockbench.md`, "As texturas"): o musgo verde-amarelo vivo e as poças azuis destacam no escuro. Servem de guia para o desenho; as do jogo (32 × 32 px por metro, sem costura) saem com poucos tons de cinza-azulado e o musgo apagado |
