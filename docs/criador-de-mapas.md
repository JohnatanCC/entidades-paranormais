# Criador de mapas

Um editor dentro do próprio jogo (Modo desenvolvedor → Criador de mapas), inspirado no modo construção do The Sims 4.
Por enquanto é só para o desenvolvedor montar os mapas; o primeiro mapa de verdade será a **mansão**.
No futuro pode virar ferramenta para jogadores (publicar num servidor), mas isso está fora agora.

Plano original e decisões: `docs/design/criador-de-mapas-plano.md`. Este arquivo é a versão que vale.

## Decisões

| Tema | Decisão |
| --- | --- |
| Onde o mapa fica | `maps/<id>/` dentro do projeto, em JSON. O jogo lê a pasta (`import.meta.glob`). No `npm run dev`, o botão Salvar grava direto nela |
| Blocos | O mapa é dividido em blocos de 16 × 16 m (como os chunks do Minecraft). Um arquivo por bloco; o jogo carrega os blocos perto do jogador |
| Grade | Paredes nas linhas de uma grade de 1 m. Objetos encaixam a cada 0,25 m |
| Rotação | Passos de 15°; com Shift, 45° e 90°. Modo livre por objeto: sai da grade e gira em qualquer eixo |
| Andares | Altura fixa de 3,5 m. Camadas por andar: o andar escolhido aparece, os de cima somem |
| Paredes | Automáticas: arrastar numa linha = parede reta; arrastar um retângulo (mais de um quadrado) = sala fechada pelas quatro paredes. Depois pinta e põe a porta |
| Paredes, os lados | Cada lado tem a sua textura, e uma barra embaixo (lambri) com outra textura e altura |
| Piso | Por quadrado de 1 m, duas faces: a de cima é o piso do andar; a de baixo é o teto do andar de baixo |
| Portas | comum, dupla, grande, vão (sem porta) |
| Janelas | normal, grande; luz 2D (feixe e mancha) ligada ou desligada |
| Escadas | Você marca a área e a direção; os degraus se montam sozinhos pela altura (um andar = 3,5 m) e o piso de cima ganha o buraco |
| Lâmpadas de teto | normal, falhando, apagada |
| Detalhes | quadros, sujeira, manchas (decalques colados na superfície) |
| Scripts | Depois do mapa: gatilhos, cenas, nascimento de monstros. O formato já reserva `points` |
| Capítulos | **Cada capítulo é um mapa próprio** (`maps/mansao-cap1`, `maps/mansao-cap2`...). A mansão que muda é uma troca de mapa; o mapa do capítulo seguinte nasce como cópia do anterior. A arena do chefe é outro mapa, atrás de uma porta e de uma tela de carregamento (o capítulo 1 tem `mansao-cap1` e `bercario-cap1`) |
| A demo | É o **capítulo 1 inteiro**: o primeiro mapa de verdade é `mansao-cap1` |
| Gerenciar mapas | Novo, abrir, salvar, copiar a partir de outro, apagar (digitando o nome), exportar e importar. Exportar gera um `.json` único (`{ formato, meta, chunks }`, o mapa inteiro) para backup ou para mandar a alguém; importar lê esse arquivo e cria a pasta em `maps/`. Gravar, apagar e importar só no `npm run dev` |
| Pé-direito alto | Paredes de dois andares (7 m) e sem piso no andar de cima. Assim sai a arena do berçário (24 × 32 m, paredes de ~7 m, sem teto) e o salão de pé-direito duplo |
| Celular | O jogo vai para o celular depois; o editor fica só no PC. Por isso os mapas precisam ser leves: junção das malhas por bloco (etapa 7) |

## Pontos a decidir antes das etapas que dependem deles

- **Largura mínima onde tem luta.** ✅ Decidido em 9/nov: corredores e galeria de 3 m na mansão (a câmera é sobre o ombro e
  a esquiva anda 2,7 m; o 1,4 m do design antigo apertava as duas).
- **O que o capítulo 1 pede do mapa** (a Mãe perseguidora e os objetos ligados, ver `docs/jogo.md`):
  - por onde ela anda: as paredes, portas e escadas do mapa precisam bastar para ela achar caminho pela casa inteira,
    nos dois andares (a malha de caminhos sai do mapa na etapa 7, não é desenhada à mão);
  - onde ficam os objetos ligados e a chave: pontos marcados no mapa (`points`), um ou vários candidatos por objeto;
  - o piso **não** faz barulho (decidido em 9/nov): o barulho vem de quebrar objetos, porta aberta com força e tiros.

## O formato (versão 1)

```
maps/
  teste/
    map.json            o cabeçalho
    chunks/
      0_0.json          o bloco cx=0, cz=0 (de x 0..16, z 0..16)
      -1_0.json         ...
```

`map.json` (tipo `MapMeta` em `src/maps/types.ts`):

```json
{ "formato": 1, "id": "teste", "nome": "Sala de teste", "levels": 1, "levelH": 3.5, "chunkSize": 16,
  "spawn": { "pos": [3, 0, 4], "yaw": 0, "level": 0 }, "chunks": ["0_0"] }
```

Cada bloco (tipo `Chunk`) tem as listas `walls`, `floors`, `openings`, `stairs`, `props`, `decals`, `points`.
Regra de dono: **cada coisa pertence ao bloco do quadrado onde ela começa** (x, z arredondados para baixo).
Unidades: metros e graus; y para cima; andar 0 = térreo.

- **Parede** `{ level, x, z, axis, a, b }`: um pedaço de 1 m na linha da grade. `axis: "x"` corre de (x, z) a (x+1, z);
  `axis: "z"` corre de (x, z) a (x, z+1). O lado `a` olha para −z (eixo x) ou −x (eixo z); o `b` para o outro lado.
  Cada lado: `{ tex, base?: { tex, h } }` (h = altura do lambri).
- **Piso** `{ level, x, z, top, bottom }`: o quadrado de (x, z) a (x+1, z+1).
- **Abertura** `{ id, level, x, z, axis, width, kind: "porta"|"janela", door?, window?, tex?, light2d?, lado?, estado?, motivo?, chave? }`:
  cobre `width` pedaços de parede a partir de (x, z). Porta comum/dupla: vão até 2,1 m; grande: até 2,8 m; janela: de 0,9 a 2,1 m.
  Larguras: comum 1, dupla 2, grande 2, vão 1 a 3, janela 1, janela grande 2.
  `lado` (`"a"`|`"b"`, padrão `"b"`): na porta, para que lado a folha abre; na janela, o lado de dentro (onde cai o luar).
  `estado` (porta): `"fechada"` (padrão), `"aberta"` ou `"trancada"`; a trancada tem `motivo` (a linha ao tentar abrir) e
  `chave` (o nome da chave que abre; sem chave, só um script abre). Os scripts abrem e fecham pela `id`.
  Esses quatro campos entraram na etapa 4 e são opcionais: mapa antigo sem eles continua valendo (por isso o `formato` não subiu).
- **Escada** `{ id, level, x, z, w, d, dir: "norte"|"sul"|"leste"|"oeste", rise, tex }`: ocupa de (x, z) a (x+w, z+d) e sobe
  `rise` (um andar = 3,5 m) para `dir`: norte = −z, sul = +z, leste = +x, oeste = −x. Os degraus saem da conta
  (espelho de ~18 cm: 19 degraus num andar). O piso do andar de cima some sobre a área da escada (o buraco é calculado,
  o piso continua no mapa).
- **Objeto** `{ id, type, level, pos, rot, free?, params? }`: `type` = o nome no catálogo (`src/maps/objetos.ts`); `pos` = o ponto
  no mundo (centro da base; a lâmpada de teto fica no teto do andar); `rot` em graus, aplicada y, depois x, depois z (na grade
  só o y conta, em passos de 15°); `free` = modo livre (fora da grade: altura e inclinação); `params` = as opções do tipo
  (lâmpada: `{ modo: "normal"|"falhando"|"apagada" }`). O objeto pertence ao bloco onde está o `pos` e troca de bloco ao ser movido.
- **Decalque** `{ id, type, level, pos, normal, rot, size }`.
- **Ponto de script** `{ id, kind, level, pos, params? }`.

Texturas: por nome (`src/maps/textures.ts`). **Cada textura é um bloco de 1 m com 32 × 32 pixels**, como no Minecraft,
no chão e na parede (decidido em 9/nov: 128 px por metro era detalhe demais para o estilo). **Por enquanto desenhadas por
código**: o desenho do laboratório é encaixado em 1 m e reduzido para 32 px (`src/render/materiais.ts`); as que perderem
detalhe demais serão redesenhadas à mão em 32 px. Mais tarde entram imagens PNG de 32 × 32 em `public/texturas/<nome>.png`
com o mesmo nome, sem mudar os mapas. A porta não é bloco (é peça da etapa 4). Textura que não existe aparece magenta.

Mudança no formato = subir `formato` e escrever a conversão no carregador. Nunca quebrar mapas salvos.

## As etapas

Cada etapa vira uma versão que o desenvolvedor testa antes da próxima.

1. **A base do projeto.** ✅ Estrutura, menu, configurações (filtro retrô, volume, sensibilidade), leitura da pasta de mapas, visualização dos blocos, mapa novo e salvar.
2. **A grade e as paredes.** ✅ A câmera do editor (estilo The Sims: gira, aproxima, arrasta), os andares, as paredes automáticas (reta e sala), apagar, desfazer e refazer (Ctrl+Z / Ctrl+Y). Paredes vizinhas se juntam nos cantos.
   E o **gerenciador de mapas**: novo, abrir, salvar, **copiar a partir de um mapa** (o capítulo 2 nasce do 1),
   **apagar** (confirma digitando o nome do mapa), **exportar** o mapa inteiro num `.json` único e **importar** esse arquivo.
   Os controles: botão direito gira, botão do meio (ou Shift + direito) move, rodinha aproxima, WASD / setas movem, Q / E giram,
   PageUp / PageDown trocam o andar; 1 = Paredes, 2 = Apagar; Ctrl + arrastar apaga; Ctrl+Z / Ctrl+Y / Ctrl+S.
   Um clique numa parede (Apagar) pega a parede sob o mouse; arrastar apaga tudo o que estiver dentro da área.
3. **Pisos, tetos e texturas.** ✅ As duas faces do piso, a pintura de cada lado da parede com a barra de baixo, o catálogo de texturas (trazer as da mansão e da Intro do laboratório).
   Ferramentas: **Piso e teto (3)** arrasta uma área (ou clica num quadrado) e põe/repinta o chão e o teto de baixo; Ctrl + arrastar apaga.
   **Pintar parede (4)** pinta o lado apontado, arrastar pinta vários, **Shift + clique pinta a sala inteira** por dentro; a barra de baixo
   (lambri) tem textura e altura próprias. O catálogo tem 34 texturas (casa, Intro e algumas novas), todas em blocos de 1 m com 32 × 32 px.
   A luz do editor é de trabalho (clara, sem sombra); a luz de verdade vem na etapa 6 (lâmpadas) e na 7 (Testar).
4. **Portas e janelas.** ✅ Os quatro tipos de porta e os dois de janela, com a luz 2D.
   Ferramenta **Portas e janelas (5)**: escolha o tipo e clique numa parede (a prévia fica âmbar onde cabe, vermelha onde não).
   O lado de dentro é adivinhado (o lado com piso; sem piso, o oposto à câmera). Clique numa porta ou janela para escolher:
   o painel muda o estado (fechada, aberta, trancada com motivo e chave), o lado e o luar; Ctrl + clique ou Del apaga.
   No editor a porta trancada mostra um cadeado vermelho. Ficaram de fora: porta emperrada e porta de correr (a da Intro).
   O luar (refeito em 9/nov, como o do laboratório): o feixe macio (some nas laterais, forte no vidro, apaga no chão, não
   ofusca quando você entra nele), a mancha de borda esfumada no chão, um brilho leve no vidro e poeira descendo devagar.
5. **Escadas.** ✅ Retas, montadas sozinhas pela área e pela altura; o buraco no piso de cima.
   Ferramenta **Escadas (6)**: arraste a área do pé até o topo (sobe no sentido do lado mais comprido do arraste; no mínimo
   2 m de comprimento). A linha de status mostra os degraus e a pisada (uma escada confortável tem pisada de 25 a 32 cm:
   ~5 a 6 m para um andar). Clique numa escada para escolher: o painel troca o sentido (girar de eixo gira em volta do
   centro, mantendo o tamanho) e a textura dos degraus; Ctrl + clique ou Del apaga.
   **Corrimão automático** (9/nov): cada lado da escada ganha um corrimão inclinado com balaústres (menos o lado que já
   tem parede do pé ao topo), e o buraco no piso de cima ganha guarda-corpo nas bordas que têm piso do lado de fora e
   não têm parede (menos a ponta do topo, por onde se sai). Não fica gravado no mapa: é calculado da escada e das paredes
   (`src/maps/corrimao.ts`), e muda sozinho quando elas mudam. No Testar, segura o agente; a câmera passa por ele.
6. **Objetos e detalhes.** O catálogo (móveis da mansão e da Intro), encaixe e rotação, modo livre, lâmpadas com os três modos, quadros e sujeira.
   Dividida em duas versões:
   - **6a. Objetos e lâmpadas.** ✅ Ferramenta **Objetos e luzes (7)**: 19 objetos no primeiro lote (casa: cadeira, cadeira caída,
     guarda-roupa, aparador, cômoda e sofá cobertos, mesa de jantar, cama de dossel, berço, relógio de pé, espelho coberto,
     tapete, lamparina; Intro: armário de aço, mesa de metal, caixa de madeira, banco, monitor; luz: lâmpada de teto).
     Encaixe a cada 0,25 m, R gira 15° (Shift + R 45°), clique escolhe e arrasta, Ctrl + clique ou Del apaga.
     Modo livre no painel (altura, girar, inclinar e tombar; arrastar encaixa a cada 5 cm). A lâmpada acende de verdade e
     a "falhando" pisca. Outros móveis do laboratório entram quando o desenvolvedor pedir.
     **Guarda-corpo** (9/nov): a balaustrada das bordas sem parede (o vão do salão, a galeria), em pedaços de 1, 2 e 4 m
     que se emendam (gire 90° para pôr no outro eixo; encaixe na linha da grade, onde o piso acaba). Mesma altura e
     desenho do corrimão automático. Segura o agente, mas a câmera passa.
   - **6b. Detalhes.** Quadros, sujeira e manchas (decalques colados na superfície).

### A interface (conceito B, "Arquivo C.R.O.S.", aprovado em 9/nov)

A mesma cara do HUD do jogo: latão, âmbar e VT323.
- **Barra de cima:** Mapas (o gerenciador), o nome do mapa (• = não salvo), o andar (▼ ▲, + e − andar), as **paredes altas,
  recortadas ou baixas** (V troca; recortadas abaixa as paredes entre a câmera e o ponto que ela olha), desfazer e refazer,
  Salvar, o filtro PS1 e Sair.
- **Coluna da esquerda:** as ferramentas em ícones, com a tecla: 1 paredes, 2 apagar, 3 piso e teto, 4 pintar parede,
  5 portas e janelas, 6 escadas, 7 objetos e luzes, 8 **conta-gotas** (clique em qualquer coisa e ele pega a textura ou o
  objeto e troca para a ferramenta certa).
- **Gaveta de baixo:** a ajuda da ferramenta e o catálogo dela (texturas, tipos de porta e janela com ícone, objetos com
  **miniatura**), e a linha de status.
- **Painel Inspetor:** a janela flutuante e arrastável com as configurações do que está escolhido.
- Ao pôr ou escolher um objeto, ele aparece de verdade, com **contorno amarelo**. Ao construir, a **medida** flutua no meio do
  arraste ("4 × 3 m · 12 m²"). A **malha** marca 1 m em linha fina e o bloco de 16 m em âmbar forte.
- **Câmera:** duplo clique com o botão **direito** (ou F com o mouse em cima) centraliza no ponto; Home volta ao começo.
  O duplo clique esquerdo ficou para as ferramentas (senão poria piso ou objeto sem querer).

Ajudas de construção propostas para depois (uma de cada vez, se aprovadas): **espelhar** (simetria por um eixo),
**copiar e colar uma área**, o **andar de baixo apagado** ao construir em cima, a **fita métrica**.
7. **Testar e os blocos.** O botão Testar: o agente andando no mapa com colisão e luz; o carregamento por blocos perto do jogador e a junção das malhas por bloco.
   Feita antes da 6b (decidido em 9/nov: andar no mapa mostra cedo se as medidas servem para o jogo). Duas versões:
   - **7a. Testar.** ✅ O botão **Testar** (ou T) solta o agente no ponto que a câmera do editor olha, de costas para ela.
     Clique trava o mouse; WASD anda, Shift corre (fôlego), Espaço esquiva, mouse olha; **Esc** volta ao editor no mesmo lugar.
     Câmera por cima do ombro direito (braço que encolhe na parede, não atravessa o teto), o filtro PS1 só se o botão de
     cima estiver ligado (desligado por padrão: em 10/nov a imagem limpa virou o visual do jogo), luz de jogo
     (as lâmpadas do mapa é que iluminam), paredes sempre altas. Bate em paredes, janelas, portas fechadas e trancadas e
     móveis; passa por porta aberta e vão; sobe e desce escada; cai no buraco da escada. Sem armas, fantasmas nem HUD.
     **Abrir portas** (9/nov): perto de uma porta e de frente para ela, aparece "E · abrir a porta"; **E** abre e fecha.
     A folha abre sempre para longe do agente e não fecha com ele parado no vão; a trancada mostra o motivo (e o nome da
     chave, até o inventário existir). O estado das portas no teste não muda o mapa: sair do Testar volta tudo como estava.
     O código: `src/game/world/portas.ts`; a ação "interagir" em `src/game/input/acoes.ts`.
     O código mora em `src/game/` (player/, input/, world/), já na estrutura do jogo.
   - **7b. Os blocos.** O jogo carrega só os blocos perto do agente e junta as malhas por bloco (desempenho da mansão e do celular).
8. **A mansão nova.** O desenvolvedor monta a planta no editor; o Claude ajusta o que faltar.
   A planta do capítulo 1 está em `docs/mansao-cap1.md` (aprovada em 9/nov). **A planta crua foi gerada** (9/nov) no mapa
   `maps/mansao-cap1`: paredes, pisos, tetos, portas, janelas, as duas escadas, o guarda-corpo do vão e algumas lâmpadas.
   Falta o desenvolvedor decorar e decidir quais portas trancam.

Depois do mapa: os scripts. Os modelos dos personagens vão ser feitos no Blockbench (em teste desde 10/nov,
`docs/blockbench.md`); se ele servir, o Editor de modelos sai do plano.

## Fica de fora agora

- Publicar mapas num servidor.
- Escadas em L, em U ou curvas.
- Altura de andar diferente por andar (pé-direito duplo sai sem isso: sem piso no andar de cima).
- O Editor de modelos.
- Os fantasmas e as lutas: entram depois do mapa.
