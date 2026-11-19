# Plano: a primeira impressão visual

Escrito em 19/nov para ser executado num chat novo (com o Fable 5.2). Vem de uma análise das capturas do jogo e dos
modelos (`docs/direcao-cap0.md` explica por que os primeiros 20 minutos importam: é a demo do itch). São cinco etapas
e uma medição antes delas. **Uma etapa por vez:** cada uma termina numa versão que o desenvolvedor testa e aprova antes da
próxima (a regra do `CLAUDE.md`).

## Para quem vai executar

**Leia antes:** o `CLAUDE.md` (as regras de trabalho, a identidade visual, a otimização), `docs/iluminacao.md` (a luz),
`docs/blockbench.md` (as regras dos modelos: as juntas, a escala, as densidades), `docs/direcao-cap0.md` (o que o capítulo
0 precisa mostrar) e este plano inteiro.

**O objetivo:** numa única captura de tela, o jogo tem que parecer **terror bem feito**, e não "um jogo de blocos". Os
personagens são a coisa mais nítida da imagem, o cenário fica calmo atrás deles, o escuro tem forma e nada estoura.

**O que já está bom e não deve mudar:** a base técnica (cada personagem é uma malha só, com uma textura só); os rostos
(128 px por metro); as silhuetas dos inimigos; a resolução do cenário (32 px por metro); o formato do mapa.

**As regras de todas as etapas:**
- **Antes e depois, sempre com foto.** Antes de mudar, tire as fotos de referência da etapa (no navegador do app, com o
  `npm run dev` e o `window.provas`, `src/dev/provas.ts`). Depois, as mesmas fotos, do mesmo ângulo e no mesmo nível de
  qualidade. Mostre as duas lado a lado. O desenvolvedor julga pela imagem (a memória "retorno visual").
- **Nada de luz nova, malha nova ou material novo** para resolver o visual: o jogo tem que rodar no celular. Ajuste os
  números e as texturas que já existem.
- **Os modelos do Blockbench continuam editáveis por ele:** nunca renomeie uma pasta (o código acha as juntas, as `mecha_`
  e as `luz_` pelo nome); mantenha a origem de cada junta; diga quais partes mudaram, para ele poder repintar. Os scripts que
  mexem nos arquivos ficam no scratchpad, nunca no projeto.
- **Medir, não achar:** use `provas.qualidade()`, `provas.sombras()`, o F3 (`Desempenho.tsx`) e o `TesteDesempenho` (nas
  configurações) em vez de impressões.
- **Ao fechar cada etapa:** `npm run build`, o teste no navegador, os docs atualizados (cada etapa diz qual) e as
  instruções em poucas linhas do que ele deve testar. O commit só quando ele pedir (a memória "fluxo de entrega").
- **Pergunte antes** de tudo o que mudar uma regra do projeto (uma densidade, um nível de qualidade, a aparência de um
  personagem). Detalhes de implementação, decida e conte.

## Etapa 0: medir o desempenho (antes de qualquer arte)

**Por quê:** as capturas mostravam de 19 a 23 quadros por segundo. Deixar o jogo mais bonito antes de saber por que ele
está lento só piora o problema.

1. Rode a skill `/desempenho` (`.claude/skills/desempenho/SKILL.md`) no mapa `mansao-cap1` e no `instalacao-cap0`, nos
   níveis Baixo, Médio e Alto: os quadros por segundo (a média e o mínimo do `TesteDesempenho`), os desenhos, os
   triângulos e as lâmpadas com sombra (o F3, `provas.sombras()`).
2. Confira estas suspeitas, com números:
   - O `instalacao-cap0` tem **94 luminárias de tubos e 76 canos**: eles estão juntados em cópias (`render/instancias.ts`),
     ou cada um é um desenho?
   - Quantas lâmpadas fazem sombra ao mesmo tempo no Alto (`sombraLampadas: 3` em `render/qualidade.ts`), e quanto custa
     cada uma?
   - A resolução de 2× no Alto (`resolucao: 2`) numa tela grande.
   - O bloom cheio e a passada final (`render/passeFinal.ts`).
   - O mapa inteiro carregado de uma vez (decisão do desenvolvedor: um mapa por capítulo). O que está fora da vista e
     atrás de paredes está sendo desenhado?
3. Entregue a tabela das medições e as correções em ordem de ganho. Ele escolhe quais entram.

**Pronto quando:** o Alto passa de 50 quadros no PC dele e o Baixo fica liso, ou ele decide seguir mesmo assim.

## Etapa 1: a luz (o item mais barato e o que mais muda a imagem)

**O problema:** a imagem vai de preto absoluto (as paredes somem, o Matheus de costas vira uma mancha) a estourada (o
rosto do Victor fica branco na cena do escritório, perto da luminária de mesa).

**A meta:**
- **Escuro não é preto:** as sombras têm cor (azul-escuro na mansão, verde-acinzentado frio na instalação) e as formas
  ainda se leem.
- **Nenhum rosto estourado,** nem perto de uma lâmpada.
- **O personagem se destaca do fundo** pelo contorno de luz, e não por luz ambiente que clareia tudo.
- **O contraste continua sendo o terror:** as poças de luz âmbar e o luar frio contra o escuro (`docs/iluminacao.md`).
  Não clareie a cena inteira.

**Onde mexer (só números):** `src/maps/ambientes.ts`, nas ambientações `mansao`, `corredor`, `instalacao` e no momento
`alarme`: `forca` e as cores `ceu` e `chao` (a luz ambiente), `preenchimento` e `forcaPreenchimento`, `contorno` e
`forcaContorno`, `exposicao`, `brilho` (o bloom), `sombras` e `luzes` (o tom), `contraste`. Se o rosto estourar mesmo com
os números certos, olhe a força e o alcance da `luminaria-mesa` (o catálogo `src/maps/objetos.ts`) e como o tonemapping de
`render/passeFinal.ts` trata os claros.

**Como medir (sem achismo):**
1. Escolha 5 lugares fixos, os mesmos das capturas dele: o corredor de papel de parede da mansão, o quarto com a Mãe, o
   hall do elevador da instalação, o salão vermelho, e o plano 1.8 da cena 1 (o Victor de perto, no Ver cenas). Leve o
   agente com `provas.ir(x, z, yaw)` e anote as posições no doc, para repetir.
2. Em cada lugar e em cada nível (Baixo, Médio, Alto), tire a foto e meça os pixels da tela (pelo `provas.gl()`,
   lendo o quadro): **a porcentagem de pixels quase pretos** (luminância < 4 de 255) e **quase brancos** (> 250).
3. A meta de cada foto: quase pretos abaixo de ~15% (hoje há telas com muito mais) e quase brancos perto de 0% fora das
   lâmpadas. Os números são o guia; a decisão final é dele, olhando as fotos.

**Pronto quando:** ele aprova as 5 fotos antes e depois. **Atualize** `docs/iluminacao.md` (os números novos e as 5
posições de referência).

## Etapa 2: o cenário calmo

**O problema:** os papéis de parede têm um desenho grande e contrastado que se repete a cada metro (o corredor com as
cruzes laranja), e os pisos são cheios de ruído. O cenário compete com os personagens.

**A meta:** um fundo calmo. A resolução de 32 px por metro continua; muda o desenho.
- **O desenho cabe na textura e tem pouco contraste:** a diferença de luminância entre o motivo e o fundo fica em torno de
  10 a 15%, e não 50%.
- **O motivo é menor** e não forma uma grade óbvia: alterne posições dentro dos 32 × 32 (o meio-salto dos papéis de parede
  de verdade, com uma fileira deslocada) e varie um pouco o tom entre as repetições.
- **Os pisos:** menos pixels soltos de cor muito diferente; o desgaste em manchas suaves, e não em pontos.
- **Sem costura** (a regra de `docs/blockbench.md`, "As texturas").

**As texturas a revisar, nesta ordem:** `papel-floral`, `papel-verde`, `papel-vinho` (a mansão); `carpete-vinho`,
`tabua-corrida`, `taco-madeira`, `chao-rachado`, `ladrilho-xadrez`, `granilite` (os pisos); depois as outras, se ele
quiser.

**Como fazer:**
1. Para cada textura, escreva no scratchpad um script em Node que gera o PNG de 32 × 32 (o Node tem `zlib`; o projeto não
   tem biblioteca de imagem, e não instale nenhuma sem perguntar). Gere 2 ou 3 versões e mostre ao lado da atual,
   aplicadas numa parede de verdade do jogo (a mesma foto da etapa 1), não só o quadradinho.
2. Ele escolhe uma versão. Grave em `texturas/<nome>.png` e confira a cor de base no catálogo `src/maps/textures.ts`.

**Pronto quando:** as fotos dos corredores da mansão e da instalação mostram o personagem como a coisa mais nítida. **Atualize**
`docs/blockbench.md` ("As texturas") com a regra do contraste.

## Etapa 3: o Matheus de costas e as proporções

**Por quê:** a câmera fica sobre o ombro, então **as costas do Matheus são a imagem mais vista do jogo**. Hoje elas são
uma mancha escura e quadrada: a mochila em caixa e os ombros largos. E as proporções ainda estão "de bloco grande", o que
aproxima o jogo de um Minecraft numa captura. A regra do projeto é "proporções quase realistas, nada de cabeça e mãos
grandes".

**Primeiro, pergunte ao desenvolvedor:** ele quer remodelar no Blockbench com uma especificação sua, ou prefere que você
altere o arquivo por script e ele repinte depois? Siga o que ele escolher.

**O modelo:** `modelos/agente.bbmodel` (217 blocos, textura 256 × 416, o esqueleto de todos: `quadril` → `tronco` →
`braco_e`/`braco_d` → `antebraco_*` → `mao_*` e os dedos; `pescoco` → `cabeca` → `cabelo` com as `mecha_nuca_*`). O tronco
tem 35 blocos, e a mochila está nele.

1. **As fotos de antes, como o jogador vê:** de costas e na câmera do jogo (o Testar, parado, andando, mirando a pistola e
   a escopeta, com a lamparina erguida), mais de lado e de frente no Ver modelos. Meça com `provas.medidas(c)`.
2. **A proposta no papel, com números,** antes de mexer: a largura dos ombros (um homem de 1,80 m tem uns 40 a 45 cm de
   ombro a ombro), a espessura do braço e do antebraço, e o desenho novo das costas:
   - **a mochila com silhueta,** e não uma caixa: as alças, o saco de dormir enrolado, os frascos e os cartuchos de sal
     (o traje "Selado", `docs/jogo.md`, "Personagens");
   - **a jaqueta com detalhe atrás:** a costura, a gola alta, o desgaste;
   - **as runas do traje nas costas, acendendo com a sobrecarga da pistola** (hoje só o frasco mostra: `player/arma.ts`).
     O jogador vê o estado da arma onde ele já está olhando. Os blocos `luz_` já brilham; o acender com a sobrecarga é
     código novo, então **pergunte antes** (é um recurso a mais);
   - **o cabelo da nuca** (as `mecha_nuca_*`), que balança nas molas.
3. **O contorno de luz do agente** (o `forcaContorno` da etapa 1): confira se as costas ganham forma no escuro.
4. **Depois de mudar, reteste tudo o que depende das mãos e dos ombros,** porque a posição das mãos muda com a largura:
   `provas.agente('pistola', 'mirar', t)`, `provas.agente('escopeta', 'recarga', t)`, a lamparina erguida
   (`player/lamparina.ts`), a mão na maçaneta (`player/alcancar.ts`, na cena 1), o andar (`provas.passo()`) e a queda.
   Nada pode atravessar o corpo.
5. **Os outros personagens, um por vez, depois que ele aprovar o Matheus:** primeiro o **Nicolas** (os ombros dele são os
   piores: as ombreiras parecem caixas), depois a Lara, o Victor e o Leonardo. Todos usam o mesmo esqueleto, então a
   proporção aprovada no Matheus vale para eles.

**Pronto quando:** ele aprova as fotos de costas na câmera do jogo e as ações não atravessam nada. **Atualize**
`docs/blockbench.md` (as medidas novas) e `docs/jogo.md` (o traje), se mudarem.

## Etapa 4: as armas e a lamparina

**O problema:** a pistola tem textura de 64 × 32 px e a lamparina de 32 × 32. Elas seguem a regra dos 64 px por metro dos
personagens, mas **ficam sempre perto da câmera**: na mão, ao mirar, erguidas. A lamparina é a luz do jogador, a
armadilha de captura e uma peça da cena do porão (`docs/direcao-cap0.md`).

**A proposta (pergunte antes: muda uma regra de `docs/blockbench.md`):** as armas e a lamparina passam a ter **128 px por
metro**, como o rosto, porque a câmera as mostra de perto. E a geometria fica **refinada** (chanfros, peças pequenas),
como a regra de 18/nov para os objetos que a câmera mostra de perto.

**Os arquivos:** `modelos/armas/pistola.bbmodel`, `escopeta.bbmodel`, `lamparina.bbmodel` e `cartucho.bbmodel`.

1. Fotos de antes: mirando cada arma (`provas.agente(arma, 'mirar', t)`), a recarga da escopeta, a lamparina na cintura
   e erguida.
2. Dobre a resolução da textura (o pixel vira 2 × 2, sem borrar) e então pinte o detalhe que a densidade nova permite: o
   desgaste do metal, as gravações, o vidro e a chama da lamparina, o frasco de ectoplasma da pistola (o `luz_`).
3. **Não mexa** nas pastas `empunhadura`, `cano` e `bomba` (onde a mão segura e de onde sai o tiro; `player/arma.ts`)
   nem nas balas do cartucho (`bala_1` a `bala_4`).
4. Fotos de depois, dos mesmos ângulos.

**Pronto quando:** ele aprova as fotos. **Atualize** `docs/blockbench.md` ("As armas") e a linha da identidade visual no
`CLAUDE.md` (as densidades).

## Etapa 5: a folha de estilo

Junte o que as etapas 1 a 4 decidiram numa página, `docs/arte.md`: as densidades (incluindo a exceção das armas), as
proporções dos personagens, a paleta e a luz de cada lugar, o limite de contraste das texturas, as 5 posições das fotos de
referência e como medir. A partir dela, todo modelo novo é conferido contra estas regras. **O Glutão novo**, que o
desenvolvedor vai desenhar e que aparece no primeiro minuto do jogo, é o primeiro a nascer seguindo a folha. Ponha o
`docs/arte.md` na lista de docs do `CLAUDE.md`.

## O que fica fora deste plano

Os fantasmas e os demônios (o desenho deles é do desenvolvedor), a decoração dos mapas (vem depois do cinza,
`docs/direcao-cap0.md`), as cenas (a skill `/cena`) e o celular (os controles de toque).

## Para começar o chat novo

Cole no chat novo, com o Fable 5.2 em esforço `high`:

> Leia o `CLAUDE.md` e o `docs/plano-visual.md`. Vamos executar o plano uma etapa por vez, começando pela Etapa 0.
> Antes de mexer em qualquer coisa, me mostre o seu plano para a etapa e espere o meu ok.
