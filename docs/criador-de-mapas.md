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
| Capítulos | **Cada capítulo é um mapa próprio** (`maps/mansao-cap1`, `maps/mansao-cap2`...). A mansão que muda é uma troca de mapa; o mapa do capítulo seguinte nasce como cópia do anterior. Arena de chefe pode ser outro mapa, atrás de uma tela de carregamento |
| A demo | É o **capítulo 1 inteiro**: o primeiro mapa de verdade é `mansao-cap1` |
| Gerenciar mapas | Novo, abrir, salvar, copiar a partir de outro, apagar (digitando o nome), exportar e importar. Exportar gera um `.json` único (`{ formato, meta, chunks }`, o mapa inteiro) para backup ou para mandar a alguém; importar lê esse arquivo e cria a pasta em `maps/`. Gravar, apagar e importar só no `npm run dev` |
| Pé-direito alto | Paredes de dois andares (7 m) e sem piso no andar de cima. Assim sai a arena do berçário (24 × 32 m, paredes de ~7 m, sem teto) e o salão de pé-direito duplo |
| Celular | O jogo vai para o celular depois; o editor fica só no PC. Por isso os mapas precisam ser leves: junção das malhas por bloco (etapa 7) |

## Pontos a decidir antes das etapas que dependem deles

- **Largura mínima onde tem luta.** A câmera é sobre o ombro (estilo Resident Evil 4) e a esquiva anda 2,7 m: corredor de
  1,4 m (como no design antigo da mansão) aperta a câmera e a esquiva. Proposta: 2,5 m ou mais onde houver luta, 1,4 m só em passagem.
- **Porta trancada com motivo** (etapa 4): o capítulo tranca áreas e fecha a sala quando a luta começa. A porta precisa de
  um estado inicial (aberta, fechada, trancada), de uma linha curta de motivo e, se for o caso, da **chave** que abre
  (a do berçário, no capítulo 1); o script abre e fecha pelo `id`.
- **O que o capítulo 1 pede do mapa** (a Mãe perseguidora e os objetos ligados, ver `docs/jogo.md`):
  - por onde ela anda: as paredes, portas e escadas do mapa precisam bastar para ela achar caminho pela casa inteira,
    nos dois andares (a malha de caminhos sai do mapa na etapa 7, não é desenhada à mão);
  - onde ficam os objetos ligados e a chave: pontos marcados no mapa (`points`), um ou vários candidatos por objeto;
  - o barulho do chão (assoalho que range, tapete abafa): talvez uma propriedade da textura do piso. Decidir na etapa 3.

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
- **Abertura** `{ id, level, x, z, axis, width, kind: "porta"|"janela", door?, window?, tex?, light2d? }`: cobre `width` pedaços de parede a partir de (x, z).
  Porta comum/dupla: vão até 2,1 m; grande: até 2,8 m; janela: de 0,9 a 2,1 m.
- **Escada** `{ id, level, x, z, w, d, dir: "norte"|"sul"|"leste"|"oeste", rise, tex }`.
- **Objeto** `{ id, type, level, pos, rot, free?, params? }` (rot em graus; na grade só o y conta).
- **Decalque** `{ id, type, level, pos, normal, rot, size }`.
- **Ponto de script** `{ id, kind, level, pos, params? }`.

Texturas: por nome (`src/maps/textures.ts`). Por enquanto cada nome é uma cor; as imagens entram depois em
`public/texturas/<nome>.png` sem mudar os mapas. Textura que não existe aparece magenta.

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
3. **Pisos, tetos e texturas.** As duas faces do piso, a pintura de cada lado da parede com a barra de baixo, o catálogo de texturas (trazer as da mansão e da Intro do laboratório).
4. **Portas e janelas.** Os quatro tipos de porta e os dois de janela, com a luz 2D.
5. **Escadas.** Retas, montadas sozinhas pela área e pela altura; o buraco no piso de cima.
6. **Objetos e detalhes.** O catálogo (móveis da mansão e da Intro), encaixe e rotação, modo livre, lâmpadas com os três modos, quadros e sujeira.
7. **Testar e os blocos.** O botão Testar: o agente andando no mapa com colisão e luz; o carregamento por blocos perto do jogador e a junção das malhas por bloco.
8. **A mansão nova.** O desenvolvedor monta a planta no editor; o Claude ajusta o que faltar.

Depois do mapa: os scripts e, mais tarde, o Editor de modelos.

## Fica de fora agora

- Publicar mapas num servidor.
- Escadas em L, em U ou curvas.
- Altura de andar diferente por andar (pé-direito duplo sai sem isso: sem piso no andar de cima).
- O Editor de modelos.
- Os fantasmas e as lutas: entram depois do mapa.
