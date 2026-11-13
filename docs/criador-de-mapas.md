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
| Ambientação | Cada lugar tem a sua luz (a luz ambiente, a neblina, o tom de cor): o mapa tem uma ambientação padrão e **áreas retangulares** com outra, pelo nome de uma predefinição (decidido em 11/nov). Os números de cada uma ficam em `src/maps/ambientes.ts`. Ver `docs/iluminacao.md` |
| Scripts | Depois do mapa: gatilhos, cenas, nascimento de monstros. O formato reserva `points`; a Demo · Intro já usa (`arena`, `nascer`, `chefe`, `tornado`: `docs/intro.md`). Mexer neles no editor vem depois |
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

## O formato (versão 3)

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
{ "formato": 3, "id": "teste", "nome": "Sala de teste", "levels": 1, "levelH": 3.5, "chunkSize": 16,
  "spawn": { "pos": [3, 0, 4], "yaw": 0, "level": 0 },
  "ambiente": "mansao", "areas": [{ "id": "area-1", "level": 0, "x": 12, "z": 4, "w": 8, "d": 4, "ambiente": "corredor" }],
  "semChao": false, "chunks": ["0_0"] }
```

- **A ambientação** (formato 2, 11/nov): `ambiente` é a do mapa inteiro (o nome no catálogo `src/maps/ambientes.ts`);
  `areas` são retângulos de (x, z) a (x+w, z+d) num andar, cada um com outra ambientação. Onde duas áreas se cruzam,
  vale a menor. Ficam no cabeçalho (são poucas e atravessam os blocos). Nome que não existe no catálogo cai na padrão.
- **Sem chão** (formato 3, 12/nov): `semChao: true` faz o térreo ter chão só onde há piso (o submundo da Demo · Intro,
  `docs/intro.md`: as ilhas no vazio); a beirada segura o agente como uma parede que não se vê. Sem isso (a casa), o
  térreo é chão em toda parte. No editor: a caixa "Sem chão" na ferramenta Ambientação.
- **A conversão**: um mapa do formato 1 (sem ambientação) é lido como se tivesse `"ambiente": "mansao"` e nenhuma área;
  um do formato 2, como `"semChao": false` (`src/maps/formato.ts`, usado pelo jogo e pelo editor). O arquivo só muda no
  disco quando o mapa é salvo de novo.

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
no chão e na parede (decidido em 9/nov: 128 px por metro era detalhe demais para o estilo). **Desde 10/nov cada uma é uma
imagem**, `texturas/<nome>.png` (32 × 32, pintada em pixel e sem costura: o que sai de uma borda entra na outra); o
catálogo guarda só o nome, o uso e a cor de base. Para repintar, abra o PNG no Blockbench ou num editor de pixel com o
modo lado a lado (Piskel, LibreSprite) e salve por cima: no `npm run dev` atualiza na hora. Textura que não existe aparece magenta.

Mudança no formato = subir `FORMATO` (`src/maps/types.ts`) e escrever a conversão em `src/maps/formato.ts`. Nunca quebrar mapas salvos.

## As etapas

Cada etapa vira uma versão que o desenvolvedor testa antes da próxima.

1. **A base do projeto.** ✅ Estrutura, menu, configurações (imagem, volume, sensibilidade), leitura da pasta de mapas, visualização dos blocos, mapa novo e salvar.
2. **A grade e as paredes.** ✅ A câmera do editor (estilo The Sims: gira, aproxima, arrasta), os andares, as paredes automáticas (reta e sala), apagar, desfazer e refazer (Ctrl+Z / Ctrl+Y). Paredes vizinhas se juntam nos cantos.
   E o **gerenciador de mapas**: novo, abrir, salvar, **copiar a partir de um mapa** (o capítulo 2 nasce do 1),
   **apagar** (confirma digitando o nome do mapa), **exportar** o mapa inteiro num `.json` único e **importar** esse arquivo.
   Os controles: botão direito gira, botão do meio (ou Shift + direito) move, rodinha aproxima, WASD / setas movem, Q / E giram,
   PageUp / PageDown trocam o andar; 1 = Paredes, 2 = Apagar; Ctrl + arrastar apaga; Ctrl+Z / Ctrl+Y / Ctrl+S.
   Um clique numa parede (Apagar) pega a parede sob o mouse; arrastar apaga tudo o que estiver dentro da área.
3. **Pisos, tetos e texturas.** ✅ As duas faces do piso, a pintura de cada lado da parede com a barra de baixo, o catálogo de texturas (trazer as da mansão e da Intro do laboratório).
   Ferramentas: **Piso e teto (3)** arrasta uma área (ou clica num quadrado) e põe/repinta o chão e o teto de baixo; Ctrl + arrastar apaga.
   **Pintar parede (4)** pinta o lado apontado, arrastar pinta vários, **Shift + clique pinta a sala inteira** por dentro; a barra de baixo
   (lambri) tem textura e altura próprias. O catálogo tem 33 texturas (casa, Intro e algumas novas), todas em blocos de 1 m com 32 × 32 px (repintadas em pixel em 10/nov).
   A luz do editor é de trabalho (clara, sem sombra); a luz de verdade vem na etapa 6 (lâmpadas) e na 7 (Testar).
4. **Portas e janelas.** ✅ Os quatro tipos de porta e os dois de janela, com a luz 2D.
   Ferramenta **Portas e janelas (5)**: escolha o tipo e clique numa parede (a prévia fica âmbar onde cabe, vermelha onde não).
   O lado de dentro é adivinhado (o lado com piso; sem piso, o oposto à câmera). Clique numa porta ou janela para escolher:
   o painel muda o estado (fechada, aberta, trancada com motivo e chave), o lado e o luar; Ctrl + clique ou Del apaga.
   No editor a porta trancada mostra um cadeado vermelho. Ficaram de fora: porta emperrada e porta de correr (a da Intro).
   **Desde 10/nov o desenho vem do Blockbench** (`modelos/aberturas/`): folhas com almofadas e maçaneta de latão,
   guarnições com cornija, janela com vidro, caixilhos e parapeito. As folhas são pastas do modelo, que o jogo gira.
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
     **Desde 10/nov os objetos vêm do Blockbench**: `modelos/objetos/<tipo>.bbmodel`, com 32 px por metro e a textura em
     pixel (veio e nós na madeira, ferrugem no metal, trama e dobras no tecido, pó no lençol, a borda e a sombra mais
     escuras). O catálogo (`src/maps/objetos.ts`) guarda só o nome, o grupo, o tamanho e o que o objeto tem de especial.
     Cada tipo é montado uma vez e cada objeto do mapa divide a geometria e a textura com ele (uma chamada de desenho por
     objeto, duas se tiver luz). O corrimão automático das escadas usa a mesma madeira em pixel.
     **O segundo lote** (10/nov): 38 objetos. A cadeira ganhou grade no encosto e o berço, grade nos quatro lados. Novos na
     casa: piano, poltrona coberta, estante de livros, mesa de cabeceira, penteadeira (com o espelho coberto), baú, cadeira
     de balanço, mesinha, fogão a lenha, guarda-louça, vaso com planta seca. Novas luzes: lustre, arandela (presa na parede,
     a 1,8 m: o apoio "parede"), abajur, luminária de pé, castiçal; a lamparina passou para a aba Luz e acende.
     Toda luz tem os três modos (normal, falhando, apagada). **Cada luz acesa é uma luz de verdade e pesa no desempenho:**
     poucas acesas por cômodo, o resto apagado (a peça continua lá, só não ilumina).
     **Guarda-corpo** (9/nov): a balaustrada das bordas sem parede (o vão do salão, a galeria), em pedaços de 1, 2 e 4 m
     que se emendam (gire 90° para pôr no outro eixo; encaixe na linha da grade, onde o piso acaba). Mesma altura e
     desenho do corrimão automático. Segura o agente, mas a câmera passa.
   - **6b. Detalhes.** Quadros, sujeira e manchas (decalques colados na superfície).

### A interface (conceito B, "Arquivo C.R.O.S.", aprovado em 9/nov)

A mesma cara do HUD do jogo: latão, âmbar e VT323.
- **Barra de cima:** Mapas (o gerenciador), o nome do mapa (• = não salvo), o andar (▼ ▲, + e − andar), as **paredes altas,
  recortadas ou baixas** (V troca; recortadas abaixa as paredes entre a câmera e o ponto que ela olha), desfazer e refazer,
  Salvar e Sair.
- **Coluna da esquerda:** as ferramentas em ícones, com a tecla: 1 paredes, 2 apagar, 3 piso e teto, 4 pintar parede,
  5 portas e janelas, 6 escadas, 7 objetos e luzes, 8 **conta-gotas** (clique em qualquer coisa e ele pega a textura ou o
  objeto e troca para a ferramenta certa), 9 **ambientação** (as áreas de luz: arrastar marca uma área com a ambientação
  escolhida na gaveta; clicar numa área troca a dela no painel; Ctrl + clique ou Del apaga; a gaveta também escolhe a
  ambientação do resto do mapa; as áreas só aparecem com esta ferramenta).
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
     Câmera por cima do ombro direito (braço que encolhe na parede, não atravessa o teto), a luz do jogo (a ambientação
     de cada área do mapa, com troca suave ao passar de uma para outra, mais as lâmpadas e o luar das janelas:
     `docs/iluminacao.md`; **M** toca o momento "a Mãe chegando"), paredes sempre altas. Bate em paredes, janelas, portas fechadas e trancadas e
     móveis; passa por porta aberta e vão; sobe e desce escada; cai no buraco da escada. Sem armas, fantasmas nem HUD.
     **Abrir portas** (9/nov): perto de uma porta e de frente para ela, aparece "E · abrir a porta"; **E** abre e fecha.
     A folha abre sempre para longe do agente e não fecha com ele parado no vão; a trancada mostra o motivo (e o nome da
     chave, até o inventário existir). O estado das portas no teste não muda o mapa: sair do Testar volta tudo como estava.
     O código: `src/game/world/portas.ts`; a ação "interagir" em `src/game/input/acoes.ts`.
     O código mora em `src/game/` (player/, input/, world/), já na estrutura do jogo.
     **Em tela cheia** (11/nov): durante o teste as ferramentas de construção somem e a cena ocupa a janela inteira
     (F11 do navegador tira também a barra dele). No canto de cima à direita ficam os **quadros por segundo**, e **F3**
     abre o detalhe do desempenho: o tempo de cada quadro (a média e o pior dos últimos 120), quanto dele o processador
     gasta mandando desenhar, o nível de qualidade e a
     resolução, quantos desenhos e triângulos o quadro inteiro fez (com as sombras e o bloom), o que está na memória
     da placa, as lâmpadas (e quantas com sombra) e a memória do jogo. O código: `src/game/Desempenho.tsx`.
   - **7b. Os blocos.** O jogo carrega só os blocos perto do agente e junta as malhas por bloco (desempenho da mansão e do celular).
     **A parte das malhas está feita (11/nov):** as paredes, os pisos e as escadas saem numa malha por textura em cada
     bloco de 16 m (antes era uma malha por textura para o mapa inteiro), então o three descarta os blocos que a câmera
     não vê. E quem faz sombra é uma malha só por bloco, sem textura, desenhada apenas dentro da sombra
     (`sombraGeometries`): cada sombra de lâmpada desenha só os blocos ao alcance dela, com uma chamada por bloco.
     Medido no salão da mansão, no Alto: de 677 para 388 chamadas de desenho e de 876 mil para 442 mil triângulos por
     quadro. As contas que olham os vizinhos (os cantos, a sombra de canto, a luz assada) continuam vendo o mapa todo.
     **Falta:** carregar do disco só os blocos perto do agente (hoje o Testar tem o mapa inteiro na memória; isso entra
     com o carregador do jogo) e juntar as texturas do cenário numa só para cair ainda mais o número de chamadas.
     Os modelos do Blockbench já vêm em pedaços (10/nov): no jogo publicado, cada .bbmodel é um arquivo à parte, baixado
     quando abre uma tela que usa modelos (o pacote principal ficou em 1,1 MB, 328 KB comprimido). Falta, nesta etapa,
     baixar só os modelos do capítulo (hoje a tela baixa todos).
8. **A mansão nova.** O desenvolvedor monta a planta no editor; o Claude ajusta o que faltar.
   A planta do capítulo 1 está em `docs/mansao-cap1.md` (aprovada em 9/nov). **A planta crua foi gerada** (9/nov) no mapa
   `maps/mansao-cap1`: paredes, pisos, tetos, portas, janelas, as duas escadas, o guarda-corpo do vão e algumas lâmpadas.
   Falta o desenvolvedor decorar e decidir quais portas trancam.

Depois do mapa: os scripts. Os modelos dos personagens vão ser feitos no Blockbench (em teste desde 10/nov,
`docs/blockbench.md`), e os objetos também (desde 10/nov): o Editor de modelos saiu do plano.

## Fica de fora agora

- Publicar mapas num servidor.
- Escadas em L, em U ou curvas.
- Altura de andar diferente por andar (pé-direito duplo sai sem isso: sem piso no andar de cima).
- Os fantasmas e as lutas: entram depois do mapa.
