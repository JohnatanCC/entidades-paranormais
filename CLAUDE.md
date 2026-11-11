# Entidades Paranormais — instruções para o Claude

Jogo de ação com terror em terceira pessoa, no navegador, em blocos com textura em pixel. Você é Matheus Moura, agente da C.R.O.S.,
e captura entidades. Este projeto começa pelo **Modo desenvolvedor → Criador de mapas**; o jogo em si vem depois.

## Leia antes de mexer

1. `docs/criador-de-mapas.md` — o foco agora: decisões, o formato dos mapas e as 8 etapas (qual é a próxima).
2. `docs/jogo.md` — o que já foi decidido e jogado (agente, armas, captura, fantasmas, HUD, a demo Intro).
   `docs/mansao-cap1.md` — a planta da mansão do capítulo 1 (cômodos, escadas, rota, onde ficam os objetos da Mãe).
   `docs/blockbench.md` — como os personagens são feitos (Blockbench, as regras das juntas, a escala, a exportação).
3. `docs/portando-do-laboratorio.md` — onde está cada coisa no laboratório antigo e o que **não** trazer.
4. `docs/design/` — cópias do documento de design (história, mansão, intro). Referência; os docs acima valem quando discordarem.

## Como trabalhar com o desenvolvedor

- **Tudo em português**: conversa, textos da interface, comentários e nomes de arquivos de documentação. Nomes de código (variáveis, funções, tipos) podem ser em inglês ou português, mas siga o que o arquivo já usa.
- **Uma etapa por vez.** Cada etapa termina numa versão que ele testa antes da próxima. Não adiante etapas nem acrescente recursos que ninguém pediu.
- **Limite o escopo e diga o que é viável.** Se um pedido for grande ou arriscado, proponha uma versão menor e diga o que fica para depois.
- **Pergunte antes** quando a decisão mudar o que será construído (formato do mapa, controles, regras). Detalhes de implementação, decida e conte.
- Ele prefere **instruções passo a passo** para o que ele mesmo tem que fazer (rodar, testar, configurar), em vez de você operar o computador dele.
- Ao terminar uma etapa: rode `npm run build`, teste no navegador, marque a etapa como feita em `docs/criador-de-mapas.md` e diga em poucas linhas o que testar.
- Commits pequenos, com mensagem em português dizendo o que mudou ("Criador de mapas: paredes automáticas").
- **Ao terminar qualquer coisa, revise tudo o que mudou** (pedido em 10/nov): a estrutura de pastas, as regras do jogo, o
  formato do mapa e os docs. **Tire arquivos e código que ficaram sem uso** (nada de sobra "para depois").
- **Otimize sempre**: o jogo precisa rodar em qualquer aparelho atual, celular incluído. Poucas chamadas de desenho (juntar
  malhas, um material por modelo), texturas pequenas, nada recalculado a cada quadro sem precisar, modelos repetidos
  compartilhando geometria e material.
- **Avalie toda ideia nova antes de aceitar.** É o maior projeto dele e pode virar produto: para cada ideia, diga se ela
  conflita com alguma mecânica já decidida (agente, armas, captura, chefes), com o formato do mapa ou com o mobile.
  Aponte o conflito e proponha a saída antes de construir. Estabilidade vem antes de recurso novo.

## Regras do conteúdo

- **Sem animação de morte dos fantasmas** nem as animações específicas de cenas do laboratório. O fantasma menor zerado
  (Espectral, demônios) estoura em ectoplasma e é destruído; o maior (Glutão, Mãe, chefes) vira poça e é capturado.
- **O agente cai, sem violência explícita** (mudado em 10/nov, a pedido): perde as forças, cai de joelhos e tomba; a tela
  escurece e ele volta no checkpoint. Nada de sangue, ferimento ou corpo machucado.
- **A base é o laboratório v130**: `reference/laboratorio.html`, igual ao publicado em
  https://claude.ai/artifact/BDUaLP6DmvqwsBXhkdJdYw. O link antigo (`2wZHuEXpxxiRrKP9h2J1jM`, com fatia, pé de cabra e
  orbe) está desatualizado: não use como referência.
- Faz parte da base: o agente, as duas armas e a armadilha, a captura por poça (dos fantasmas maiores), o Espectral, o Glutão, o HUD conceito C,
  Lara e Nicolas (a demo Intro) e **a Mãe com a luta do berçário** (o berço, o tornado, as quatro barras).
- Fora do projeto (eram testes do laboratório): os outros fantasmas do laboratório (Sombra, Desconhecido, Garota, Mordomo,
  Observador, Reflexo, Amigo), a demo da casa como fase, a demo "O Bando", a fatia, o círculo de velas, o orbe, o pé de cabra.
  Fora agora não quer dizer fora para sempre: se o desenvolvedor trouxer de volta, atualize esta lista.
- **A identidade visual** (decidida em 10/nov): cenário e personagens em **blocos com textura pintada em pixel** (cenário
  com 32 px por metro, personagens com 64 e o rosto com 128), com **proporções quase realistas** (nada de cabeça e mãos grandes). O terror vem da ambientação: pouca luz,
  fantasmas com formas erradas, olhos que brilham, movimentos travados. O estilo é parecido com o do Hytale, mas os
  personagens são nossos: não copiar os deles.
- Os modelos dos personagens, dos objetos e (quando chegarem) das armas são feitos no **Blockbench** (o passo a passo
  está em `docs/blockbench.md`): personagens e armas com 64 px por metro, objetos do cenário com 32, com sombra e desgaste
  pintados em pixel.
- O visual padrão é a imagem **limpa**; o filtro PS1 (pixels, 5 bits com pontilhado, tremor de vértice) e o "suave" viraram opção.

## Comandos

```bash
npm install        # uma vez
npm run dev        # http://localhost:5173 — o botão Salvar do criador de mapas só funciona aqui
npm run build      # checa os tipos (tsc -b) e gera dist/
npm run typecheck  # só os tipos
```

## A estrutura

```
index.html                 a página (fontes VT323 e IBM Plex Mono)
vite.config.ts             o Vite + o plugin que salva mapas (tools/mapsDevApi.ts)
tools/mapsDevApi.ts        a API dos mapas (só no npm run dev): listar, ler, salvar, apagar em maps/
maps/<id>/                 os mapas (JSON). map.json = cabeçalho; chunks/<cx>_<cz>.json = um bloco de 16 × 16 m
src/
  main.tsx, App.tsx        as telas (menu → configurações | modo desenvolvedor → criador de mapas)
  styles.css               a paleta e as telas
  screens/                 MainMenu, SettingsScreen, DevMenu, VerModelos (o personagem de perto: animação, expressão, mãos, luz)
  settings/settings.ts     configurações no localStorage (useSettings / setSettings)
  audio/musica.ts          a trilha: useMusica('menu') toca public/musica/<nome>.mp3 em laço, com o volume das configurações
  audio/sintese.ts         os efeitos sintetizados na hora (do laboratório, sem arquivos): ruído, tom, estalos, a voz com
                           vogais, o grito, o sussurro; liga no primeiro clique; o volume é Geral × Efeitos
  audio/espaco.ts          o som 3D: a voz sai da boca do personagem, no mundo; o ouvido é a câmera (ouvinte, a cada quadro)
  render/                  RetroRenderer (pós-processo PS1), psx.ts (tremor de vértice), materiais.ts (nome da textura -> material),
                           corte.ts (paredes altas / recortadas / baixas no editor), miniaturas.ts (fotos do catálogo de objetos),
                           bbmodel.ts (lê um modelo do Blockbench: pastas = juntas, blocos = malhas; "luz_" brilha; os
                           personagens viram uma malha só com ossos: vestir),
                           objetos3d.ts (cada tipo de objeto, porta, janela e arma montado uma vez; o mapa usa cópias que dividem tudo)
  maps/                    types.ts (o formato v1), loader.ts (o jogo lê a pasta), storage.ts (o editor lê, grava,
                           exporta e importa; o pacote MapBundle), textures.ts (o catálogo: cada nome, o uso e a cor; a imagem é texturas/<nome>.png),
                           objetos.ts (o catálogo de móveis e lâmpadas, em dados: nome, tamanho, apoio; a forma vem do modelo),
                           corrimao.ts (o corrimão automático das escadas, calculado do mapa; o editor desenha em editor/corrimaoMesh.ts)
  editor/                  MapEditor (a tela, conceito B), Gaveta (o catálogo embaixo), Icones, Inspetor (a janela flutuante),
                           Medida (a etiqueta ao construir), FerramentaContaGotas, MapManager (o gerenciador de mapas), MapView + wallMesh (desenha;
                           paredes juntadas por textura, cantos fechados), EditorCamera, FerramentaParedes,
                           FerramentaPiso, FerramentaPincel, FerramentaAberturas + PainelAbertura, FerramentaEscadas + PainelEscada,
                           FerramentaObjetos + PainelObjeto, Objetos (monta o catálogo; a lâmpada acende),
                           Aberturas (portas, janelas) + Luar (feixe macio, brilho, poeira), Paleta, doc.ts (o documento e as operações),
                           historico.ts (desfazer e refazer)
texturas/                  as texturas do cenário: <nome>.png, 32 × 32 px por bloco de 1 m, pintadas em pixel e sem costura
modelos/                   os modelos do Blockbench (.bbmodel), lidos direto pelo jogo: agente.bbmodel, objetos/<tipo>.bbmodel,
                           aberturas/<tipo>.bbmodel (as portas e janelas), armas/<nome>.bbmodel (pistola, escopeta, armadilha),
                           fantasmas/<nome>.bbmodel (a Mãe)
public/musica/             as músicas do jogo (menu.mp3: o menu e o criador de mapas)
reference/                 o laboratório antigo, só para consulta (não importar nada daqui); ost/ = as 4 músicas dele
docs/                      o que está decidido
```

### A estrutura planejada do jogo (criar cada pasta só quando a etapa chegar nela)

Cada coisa do jogo mora na sua pasta; nada de arquivo gigante como o laboratório. Os números (vida, dano, tempos)
ficam num arquivo próprio de cada pasta, para ajustar sem caçar no código.

```
src/game/                  (já existem: Testar.tsx, player/, input/, world/, weapons/, corpo/, enemies/mae/ — o resto entra
                           quando a etapa chegar)
  corpo/                   o que serve a todo personagem: molas.ts (o que pendura e balança: cabelo, saia)
  Testar.tsx               o Testar do editor: o agente andando no mapa aberto (câmera, colisão, luz do jogo)
  player/                  o agente: modelo.ts (liga modelos/agente.bbmodel no esqueleto), animacao.ts, maos.ts (os dedos),
                           arma.ts (a arma na mão; a escopeta com as duas mãos ou no ombro; o pêndulo da armadilha; Q troca
                           no Testar), mira.ts (mirar: a pose, o coice, a bomba depois do tiro), queda.ts (cair sem violência), dano.ts (o tranco de um golpe,
                           machucado), vida.ts (a vida, a invulnerabilidade, o kit), parado.ts (a respiração, o
                           peso e os gestos de parado), alcancar.ts (o braço alcança um ponto: IK de dois ossos),
                           rosto.ts (as expressões), controle.ts (andar, correr, esquivar), numeros.ts
  weapons/                 tiro.ts (o gatilho e a cadência), clarao.ts (o clarão no cano), armadilha.ts (jogar: o voo em
                           arco, grudar, chamar de volta, a linha do arco), numeros.ts; depois a bala e a sobrecarga
  enemies/<nome>/          um fantasma por pasta (mae/, espectral/, glutao/): IA, ataques, modelo, números; a Mãe já tem
                           modelo.ts (monta o modelo, a saia e o cabelo com molas), pose.ts (as molas da pose, do
                           laboratório), animacao.ts (parada, andar, passar pela porta), rosto.ts (as expressões, os
                           tiques e o brilho dos olhos), efeitos.ts (o rosto que escurece, as ondas do grito, a fase 4
                           preta com partículas), sons.ts (a voz dela: a cantiga, a caça, a de cada golpe e estado; e quando
                           cada som toca), ruidos.ts (o corpo e o Luto: passos, estalos, garras, bolhas), golpes.ts (os ataques e os movimentos do Luto), estados.ts
                           (grito, exausta, atordoada, cambaleio, enfraquecida, capturada), luto.ts (a poça, as ondas,
                           os respingos, o aviso) e numeros.ts
  capture/                 a poça e a captura
  allies/                  Lara e Nicolas
  hud/                     o HUD conceito C
  input/                   acoes.ts: ações do jogador (teclado e mouse; depois controle e toque): o jogo lê ações, nunca teclas
  world/                   colisao.ts (paredes, portas, móveis, corrimão, chão, escadas, braço da câmera, a armadilha jogada), portas.ts (abrir e fechar
                           com E, o estado vivo das portas); depois carregar por blocos, luz
src/chapters/cap1/         o roteiro do capítulo: qual mapa, gatilhos, cenas, chefe
```

O jogo vai para o **celular** depois: por isso a camada `input/` desde o início, e cuidado com o peso das cenas
(chamadas de desenho). O editor de mapas é só para PC.

## A stack

Vite 5 · React 18 · TypeScript 5 (strict) · three 0.169 · @react-three/fiber 8 · @react-three/drei 9.
Versões fixas no `package.json`; não atualize sem pedir.

## Convenções de código

- O estado das configurações fica em `src/settings/settings.ts`; telas leem com `useSettings()`.
- Materiais de cenário e personagens passam por `applyPsx()` (o tremor só liga com o filtro PS1). O `<RetroRenderer />` entra
  na cena só quando o filtro escolhido não é o limpo.
- O mapa é dado puro (JSON, tipos em `src/maps/types.ts`). O editor muda o dado; a vista desenha a partir dele. Nada de estado escondido nos objetos 3D.
- Mudou o formato do mapa? Suba `formato` e escreva a conversão no carregador. Nunca quebre um mapa salvo.
- Textura e objeto são referenciados por **nome** no mapa (`"papel-verde"`, `"lampada-teto"`), nunca por caminho de arquivo.
- Comentários curtos explicando o porquê, em português, no estilo do laboratório.
