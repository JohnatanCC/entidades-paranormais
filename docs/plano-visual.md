# Plano: a primeira impressão visual

Escrito em 19/nov para ser executado num chat novo (com o Fable 5.2). Vem de uma análise das capturas do jogo e dos
modelos (`docs/direcao-cap0.md` explica por que os primeiros 20 minutos importam: é a demo do itch). São quatro etapas
e uma medição antes delas (as armas saíram do plano em 19/nov: não precisam mudar). **Uma etapa por vez:** cada uma termina numa versão que o desenvolvedor testa e aprova antes da
próxima (a regra do `CLAUDE.md`).

## Para quem vai executar

**Leia antes:** o `CLAUDE.md` (as regras de trabalho, a identidade visual, a otimização), `docs/iluminacao.md` (a luz),
`docs/blockbench.md` (as regras dos modelos: as juntas, a escala, as densidades), `docs/direcao-cap0.md` (o que o capítulo
0 precisa mostrar) e este plano inteiro.

**A ordem (19/nov):** o plano roda **agora**, sem esperar o capítulo 0 em cinza (o "em cinza primeiro" de
`docs/direcao-cap0.md` é uma sugestão): o visual do que já existe fica pronto e é ajustado depois.

**O objetivo:** numa única captura de tela, o jogo tem que parecer **terror bem feito**, e não "um jogo de blocos". Os
personagens são a coisa mais nítida da imagem, o cenário fica calmo atrás deles, o escuro tem forma e nada estoura.

**O que já está bom e não deve mudar:** a base técnica (cada personagem é uma malha só, com uma textura só); os rostos
(128 px por metro); as silhuetas dos inimigos; a resolução do cenário (32 px por metro); o formato do mapa; as armas e a
lamparina (decidido em 19/nov: ficam como estão, com 64 px por metro).

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

**Medido em 19/nov** (o navegador do app, a placa embutida Intel UHD, 1920 × 1080, parado):
- O Baixo fica em 59 a 60 nos dois mapas. O Médio estava em 29 (instalação) e 40 a 46 (mansão); o Alto, em 14 e 24 a 27.
- **Feito: as bordas suaves foram para a passada final** (os números estão em `docs/iluminacao.md`, "Os níveis de
  qualidade"). O Médio passou a 55 a 60; o Alto, a 27 (instalação) e 36 (mansão).
- **Feito: o Alto com 1 lâmpada com sombra** (eram 3; as 3 ficaram no Ultra): a instalação foi de 27 para 54 e a mansão de 29 para 42 (ainda abaixo dos 50).
- **Falta escolher:** as malhas de cópias fazendo
  sombra inteiras em cada face (`render/instancias.ts`, hipótese); as luminárias soltas (2 desenhos cada, 105 na
  instalação: `editor/Objetos.tsx`); os batentes e as janelas da mansão (cerca de 100 desenhos).
- As outras suspeitas: a resolução 2× não faz nada numa tela de 1 pixel por ponto; o bloom custa pouco; o mapa inteiro
  carregado não é o gargalo (os blocos de 16 m fora da vista não são desenhados).

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

**Antes dos números, a revisão da luz (pedido em 19/nov): ela pode estar pesada demais ou faltando algo.** Com as
medições da etapa 0 na mão, responda as duas perguntas e mostre a ele antes de ajustar:
- **O que pesa:** quanto custa cada parte (as lâmpadas com sombra, a luz assada, o contorno, o bloom, a passada final, o
  luar e a neblina) em cada nível, e o que dá para tirar ou baratear sem a imagem mudar.
- **O que falta:** o que a imagem pede e a luz de hoje não entrega (por exemplo: a cor no escuro, a luz de lado no rosto,
  o personagem separado do fundo), e se isso se resolve com os números que já existem.
Se a resposta for uma luz nova ou um recurso novo, **pergunte antes** e diga o custo (a regra de "nada de luz nova"
continua valendo até ele decidir o contrário).

**Feito em 19/nov, da revisão "o que falta":** a poça de luz das lâmpadas saía em losango (a luz ia de vértice em
vértice) e só ficava redonda a uns 4 m, quando a lâmpada virava a de verdade. Agora as duas lâmpadas mais fortes de cada
face são contadas em cada pixel (`docs/iluminacao.md`). **As 5 fotos de referência desta etapa são tiradas a partir
daqui.**

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

## Etapa 3: o Matheus de costas, as proporções e o desenho dos personagens

**Por quê:** a câmera fica sobre o ombro, então **as costas do Matheus são a imagem mais vista do jogo**. Hoje elas são
uma mancha escura e quadrada: a mochila em caixa e os ombros largos. E as proporções ainda estão "de bloco grande", o que
aproxima o jogo de um Minecraft numa captura. A regra do projeto é "proporções quase realistas, nada de cabeça e mãos
grandes".

**Decidido em 19/nov:**
- **Quem executa tem controle total dos modelos:** altera os `.bbmodel` por script (a geometria e a textura), sem
  esperar ele remodelar. Ele aprova pelas fotos; as regras dos modelos continuam (as pastas, as origens das juntas).
- **O desenho dos humanos é repensado** (os fantasmas estão bons e ficam como estão): detalhado e **bem polido, mas sem
  tantos quadrados de detalhe**, e **fácil de animar**. Menos peças, cada uma com um motivo para existir (muda a silhueta
  ou se mexe); a forma limpa e a textura bem pintada no lugar do enfeite em bloco. A regra está em `docs/blockbench.md`
  ("Os personagens em blocos refinados").
- **As runas do traje saíram** (nada de runas nas costas nem de acender com a sobrecarga).

**O modelo:** `modelos/agente.bbmodel` (217 blocos, textura 256 × 416, o esqueleto de todos: `quadril` → `tronco` →
`braco_e`/`braco_d` → `antebraco_*` → `mao_*` e os dedos; `pescoco` → `cabeca` → `cabelo` com as `mecha_nuca_*`). O tronco
tem 35 blocos, e a mochila está nele.

**O andamento (19/nov), em três passos, cada um com fotos de antes e depois:**
- **Passo 1, as proporções: feito no Matheus, à espera da aprovação.** Os ombros foram de 62,8 para 51,6 cm, os braços e
  as mãos afinaram, o quadril e as coxas também (as medidas em `docs/blockbench.md`, "As regras"). Só mudaram o tamanho e
  o lugar dos blocos e os pivôs; a textura não foi repintada (as faces dos blocos mudados ficaram com UV próprio). A
  cabeça inteira encolheu 10% (a pedido, depois da foto: com os ombros estreitos ela parecia maior), sem repintar o rosto.
- **Passo 2, menos blocos:** juntar as fatias vizinhas de cada membro (de 217 para perto de 140 blocos), refazendo a
  textura por script a partir da atual.
- **Passo 3, as costas:** a mochila com silhueta, o detalhe da jaqueta na textura, as pontas do cabelo da nuca.

1. **As fotos de antes, como o jogador vê:** de costas e na câmera do jogo (o Testar, parado, andando, mirando a pistola e
   a escopeta, com a lamparina erguida), mais de lado e de frente no Ver modelos. Meça com `provas.medidas(c)`.
2. **A proposta no papel, com números,** antes de mexer: a largura dos ombros (um homem de 1,80 m tem uns 40 a 45 cm de
   ombro a ombro), a espessura do braço e do antebraço, e o desenho novo do traje (o que ele veste e carrega, e por quê;
   o traje "Selado" de `docs/jogo.md`, "Personagens", é o ponto de partida, e não uma obrigação):
   - **quais blocos de detalhe saem** e o que fica no lugar (a forma maior, ou a textura): a contagem de blocos antes e
     depois, por parte do corpo;
   - **as costas com silhueta,** e não uma caixa: o que ele carrega tem que se ler de longe com poucas peças;
   - **a jaqueta com o detalhe pintado:** a costura, a gola, o desgaste, na textura e não em blocos;
   - **o cabelo da nuca** (as `mecha_nuca_*`), que balança nas molas.
3. **O contorno de luz do agente** (o `forcaContorno` da etapa 1): confira se as costas ganham forma no escuro.
4. **Depois de mudar, reteste tudo o que depende das mãos e dos ombros,** porque a posição das mãos muda com a largura:
   `provas.agente('pistola', 'mirar', t)`, `provas.agente('escopeta', 'recarga', t)`, a lamparina erguida
   (`player/lamparina.ts`), a mão na maçaneta (`player/alcancar.ts`, na cena 1), o andar (`provas.passo()`) e a queda.
   Nada pode atravessar o corpo.
5. **Os outros personagens, um por vez, depois que ele aprovar o Matheus:** primeiro o **Nicolas** (os ombros dele são os
   piores: as ombreiras parecem caixas), depois a Lara, o Victor e o Leonardo. Todos usam o mesmo esqueleto, então a
   proporção aprovada no Matheus vale para eles, e o desenho de cada um é repensado do mesmo jeito (menos blocos de
   detalhe, mais polido).

**Pronto quando:** ele aprova as fotos de costas na câmera do jogo e as ações não atravessam nada. **Atualize**
`docs/blockbench.md` (as medidas novas) e `docs/jogo.md` (o traje), se mudarem.

## Etapa 4: a folha de estilo

Junte o que as etapas 1 a 3 decidiram numa página, `docs/arte.md`: as densidades, as
proporções e o desenho dos personagens (quanto detalhe em bloco e quanto na textura), a paleta e a luz de cada lugar, o limite de contraste das texturas, as 5 posições das fotos de
referência e como medir. A partir dela, todo modelo novo é conferido contra estas regras. **O Glutão novo**, que o
desenvolvedor vai desenhar e que aparece no primeiro minuto do jogo, é o primeiro a nascer seguindo a folha. Ponha o
`docs/arte.md` na lista de docs do `CLAUDE.md`.

## O que fica fora deste plano

As armas e a lamparina (não precisam mudar), os fantasmas e os demônios (o desenho deles é do desenvolvedor), a decoração dos mapas (vem depois do cinza,
`docs/direcao-cap0.md`), as cenas (a skill `/cena`) e o celular (os controles de toque).

## Para começar o chat novo

Cole no chat novo, com o Fable 5.2 em esforço `high`:

> Leia o `CLAUDE.md` e o `docs/plano-visual.md`. Vamos executar o plano uma etapa por vez, começando pela Etapa 0.
> Antes de mexer em qualquer coisa, me mostre o seu plano para a etapa e espere o meu ok.
