# Entidades Paranormais — instruções para o Claude

Jogo de ação com terror em terceira pessoa, no navegador, em blocos com textura em pixel. Você é Matheus Moura, agente da C.R.O.S.,
e captura entidades. Este projeto começa pelo **Modo desenvolvedor → Criador de mapas**; o jogo em si vem depois.

## Leia antes de mexer

1. `docs/criador-de-mapas.md` — o foco agora: decisões, o formato dos mapas e as 8 etapas (qual é a próxima).
2. `docs/iluminacao.md` — a luz do jogo: as decisões, as ambientações, os níveis de qualidade e as 4 etapas (qual é a próxima).
   `docs/jogo.md` — o que já foi decidido e jogado (a história do portal, agente, armas, captura, fantasmas, HUD, a demo Intro).
   `docs/demonios.md` — os Sombrios (Assombrado, Asa sombria, Devora almas): o desenho, os modelos, como lutam e as etapas.
   `docs/intro.md` — a Demo · Intro nova (o submundo): as três arenas, as hordas, o chefe e as etapas (qual é a próxima).
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
- **Conferir no navegador:** no `npm run dev`, use `window.provas` (`src/dev/provas.ts`) pelo console em vez de montar
  o teste à mão: `provas.mae(golpe, t)` monta a Mãe num instante (`provas.assombrado(acao, t)`, `provas.asaSombria(acao, t)` e `provas.devora(acao, t)`, os demônios; `provas.agente(arma, acao, t)`, o Matheus com a arma: a recarga, o tiro), `provas.fotos([...])` tira fotos de vários ângulos,
  `provas.medidas(c)` dá as mãos, a cabeça e as mechas, `provas.som([...])` mede o volume de cada trecho. Recarregue a
  página antes; o som só liga depois de um clique de verdade; com o painel escondido a página não desenha (as provas
  funcionam mesmo assim).
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
  (os demônios, os Sombrios) estoura e é destruído; o maior (Glutão, Mãe, chefes) vira poça e é capturado.
- **O agente cai, sem violência explícita** (mudado em 10/nov, a pedido): perde as forças, cai de joelhos e tomba; a tela
  escurece e ele volta no checkpoint. Nada de sangue, ferimento ou corpo machucado.
- **A base é o laboratório v130**: `reference/laboratorio.html`, igual ao publicado em
  https://claude.ai/artifact/BDUaLP6DmvqwsBXhkdJdYw. O link antigo (`2wZHuEXpxxiRrKP9h2J1jM`, com fatia, pé de cabra e
  orbe) está desatualizado: não use como referência.
- Faz parte da base: o agente, as duas armas e a armadilha, a captura por poça (dos fantasmas maiores), o Glutão, o HUD conceito C,
  Lara e Nicolas (a demo Intro) e **a Mãe com a luta do berçário** (o berço, o tornado, as quatro barras).
- Fora do projeto (eram testes do laboratório): os outros fantasmas do laboratório (Sombra, Desconhecido, Garota, Mordomo,
  Observador, Reflexo, Amigo), a demo da casa como fase, a demo "O Bando", a fatia, o círculo de velas, o orbe, o pé de cabra.
  O Espectral também saiu (12/nov): no lugar dele, os Sombrios (`docs/demonios.md`).
  Fora agora não quer dizer fora para sempre: se o desenvolvedor trouxer de volta, atualize esta lista.
- **A identidade visual** (decidida em 10/nov): cenário e personagens em **blocos com textura pintada em pixel** (cenário
  com 32 px por metro, personagens com 64 e o rosto com 128), com **proporções quase realistas** (nada de cabeça e mãos grandes). As pessoas e os fantasmas são em **blocos refinados**
  (decidido em 11/nov): muitas peças pequenas, chanfradas e inclinadas, dentro das mesmas juntas; os objetos continuam simples. O terror vem da ambientação: pouca luz,
  fantasmas com formas erradas, olhos que brilham, movimentos travados. O estilo é parecido com o do Hytale, mas os
  personagens são nossos: não copiar os deles. Os Sombrios têm o clima das sombras do Don't Starve, sem copiar o desenho.
- Os modelos dos personagens, dos objetos e (quando chegarem) das armas são feitos no **Blockbench** (o passo a passo
  está em `docs/blockbench.md`): personagens e armas com 64 px por metro, objetos do cenário com 32, com sombra e desgaste
  pintados em pixel.
- A imagem é **limpa**: o filtro PS1 e o "suave" saíram do projeto (11/nov). O clima vem da iluminação (`docs/iluminacao.md`):
  o terror vem do contraste, o âmbar das lâmpadas e o luar frio das janelas contra o escuro. A luz ambiente é baixa (a pedido, 11/nov):
  quem ilumina são as fontes de luz, e o contorno de luz mantém o agente e os fantasmas visíveis.

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
maps/<id>/                 os mapas (JSON). map.json = cabeçalho; chunks/<cx>_<cz>.json = um bloco de 16 × 16 m;
                           maps/intro = a Demo · Intro (o submundo, sem chão: docs/intro.md)
src/
  main.tsx, App.tsx        as telas (menu → novo jogo → Demo · Intro | configurações | modo desenvolvedor → criador de mapas)
  styles.css               a paleta e as telas
  screens/                 MainMenu, NovoJogo (a Demo · Intro), Jogo (uma fase: o mapa da pasta com o agente do Testar, em
                           tela cheia), SettingsScreen (com PreviaQualidade ao lado: a sala do mapa teste-iluminacao com a
                           qualidade escolhida, ao vivo, e o fps; e TesteDesempenho: a mansão inteira nível por nível, com a
                           média e o mínimo de quadros), DevMenu, VerModelos (o personagem, o fantasma ou o demônio de perto: animação, expressão, mãos, ações, luz)
  settings/settings.ts     configurações no localStorage (useSettings / setSettings): a qualidade da imagem (o nível e os
                           ajustes de cada recurso), os volumes, o mouse
  audio/musica.ts          a trilha: useMusica('menu') toca public/musica/<nome>.mp3 em laço, com o volume das configurações
  audio/sintese.ts         os efeitos sintetizados na hora (do laboratório, sem arquivos): ruído, tom, estalos, a voz com
                           vogais, o grito, o sussurro; liga no primeiro clique; o volume é Geral × Efeitos
  dev/provas.ts            só no npm run dev (window.provas): fotos, medidas e o volume da Mãe (e dos demônios, das armas e do
                           agente: sonsDemonios, sonsAgente), para conferir pelo console;
                           provas.ir(x, z, yaw) leva o agente a um ponto no Testar (dev/ganchos.ts), provas.qualidade() diz o nível,
                           provas.sombras() conta as lâmpadas com sombra, provas.cena() dá a cena do Testar para inspecionar, provas.fase() o controle do agente (os alvos das balas),
                           provas.passo() mostra um ciclo do andar em 8 quadros (também de lado e de costas), provas.escorrega() mede o pé de apoio
  audio/espaco.ts          o som 3D: a voz sai da boca do personagem, no mundo; o ouvido é a câmera (ouvinte, a cada quadro)
  render/                  qualidade.ts (os níveis Baixo, Médio, Alto e Ultra, os recursos ajustáveis um a um e o automático), passeFinal.ts (a passada de
                           tela cheia do Médio e do Alto: bloom, tonemapping, correção de cor, vinheta), contorno.ts (o contorno de luz
                           dos personagens e o brilho do golpe), golpe.ts (quem leva um golpe acende vermelho por um instante; o demônio que
                           prepara um ataque acende âmbar), brilho.ts (os blocos "luz_" mais fortes que o branco quando o bloom está ligado),
                           assada.ts (o cenário e os objetos usam a luz assada: todas as lâmpadas no Baixo; no Médio e no Alto, as que não fazem
                           sombra), remendos.ts (anota as mudanças de shader de cada material, para a cópia levar junto),
                           sombras.ts (as sombras do nível Alto: quais lâmpadas fazem sombra), materiais.ts (nome da textura -> material),
                           relevo.ts (o relevo das texturas do cenário, gerado da imagem: na luz e o de verdade, do Ultra),
                           corte.ts (paredes altas / recortadas / baixas no editor), miniaturas.ts (fotos do catálogo de objetos),
                           bbmodel.ts (lê um modelo do Blockbench: pastas = juntas, blocos = malhas; "luz_" brilha; os
                           personagens viram uma malha só com ossos: vestir; os que se repetem, os demônios, são cópias
                           de um molde que dividem tudo: copiaDoMolde),
                           objetos3d.ts (cada tipo de objeto, porta, janela e arma montado uma vez; o mapa usa cópias que dividem tudo),
                           instancias.ts (no jogo, os objetos repetidos juntados: uma malha de cópias por peça de cada tipo)
  maps/                    types.ts (o formato v3), formato.ts (a conversão dos mapas antigos), ambientes.ts (o catálogo das
                           ambientações e dos momentos de luz: os números de cada uma), luzAssada.ts (a luz de cada lâmpada
                           e de cada janela num ponto, com as paredes bloqueando), loader.ts (o jogo lê a pasta), storage.ts (o editor lê, grava,
                           exporta e importa; o pacote MapBundle), textures.ts (o catálogo: cada nome, o uso e a cor; a imagem é texturas/<nome>.png),
                           objetos.ts (o catálogo de móveis e lâmpadas, em dados: nome, tamanho, apoio; a forma vem do modelo),
                           corrimao.ts (o corrimão automático das escadas, calculado do mapa; o editor desenha em editor/corrimaoMesh.ts)
  editor/                  MapEditor (a tela, conceito B), Gaveta (o catálogo embaixo), Icones, Inspetor (a janela flutuante),
                           Medida (a etiqueta ao construir), FerramentaContaGotas, MapManager (o gerenciador de mapas), MapView + wallMesh (desenha;
                           paredes juntadas por textura, cantos fechados, a sombra de canto e a luz assada em cada vértice), EditorCamera, FerramentaParedes,
                           FerramentaPiso, FerramentaPincel, FerramentaAberturas + PainelAbertura, FerramentaEscadas + PainelEscada,
                           FerramentaObjetos + PainelObjeto, FerramentaAmbiente + PainelArea (as áreas de ambientação),
                           Objetos (monta o catálogo; a lâmpada acende),
                           Aberturas (portas, janelas) + Luar (feixe macio, brilho, poeira), Paleta, doc.ts (o documento e as operações),
                           historico.ts (desfazer e refazer)
texturas/                  as texturas do cenário: <nome>.png, 32 × 32 px por bloco de 1 m, pintadas em pixel e sem costura
modelos/                   os modelos do Blockbench (.bbmodel), lidos direto pelo jogo: agente.bbmodel, lara.bbmodel,
                           nicolas.bbmodel e victor.bbmodel (o mesmo esqueleto do agente), objetos/<tipo>.bbmodel,
                           aberturas/<tipo>.bbmodel (as portas e janelas), armas/<nome>.bbmodel (pistola, escopeta, armadilha; e o cartucho da recarga),
                           fantasmas/<nome>.bbmodel (a Mãe), demonios/<nome>.bbmodel (os Sombrios: o Assombrado, a Asa sombria, o Devora almas)
public/musica/             as músicas do jogo (menu.mp3: o menu e o criador de mapas; batalha.mp3: as hordas e devorador.mp3:
                           o chefe, na Demo · Intro)
reference/                 o laboratório antigo, só para consulta (não importar nada daqui); ost/ = as 4 músicas dele
docs/                      o que está decidido
```

### A estrutura planejada do jogo (criar cada pasta só quando a etapa chegar nela)

Cada coisa do jogo mora na sua pasta; nada de arquivo gigante como o laboratório. Os números (vida, dano, tempos)
ficam num arquivo próprio de cada pasta, para ajustar sem caçar no código.

```
src/game/                  (já existem: Testar.tsx, player/, input/, world/, weapons/, corpo/, luz/, hud/, enemies/mae/, enemies/assombrado/,
                           enemies/asa-sombria/, enemies/devora-almas/ — o resto entra
                           quando a etapa chegar)
  luz/                     a luz do jogo: Iluminacao.tsx (a luz ambiente, o preenchimento, o luar, a neblina, a imagem final; entra
                           em toda cena de jogo), ceu.ts (o céu da noite: a cúpula com o degradê, as estrelas e a lua), luz.ts (a ambientação de onde o agente está, a troca suave, os momentos:
                           momento('mae-chegando'))
  corpo/                   o que serve a todo personagem: molas.ts (o que pendura e balança: cabelo, saia), sombraDeChao.ts
                           (o círculo escuro embaixo dele)
  Testar.tsx               o Testar do editor: o agente andando no mapa aberto (câmera, colisão, luz do jogo), em tela cheia;
                           numa fase, dá ao roteiro o controle do agente (AgenteNaFase: ferir, engolir, cuspir, a gosma, o ponto de volta)
  Desempenho.tsx           o medidor de uma cena de jogo: os quadros por segundo e, com F3, o detalhe (desenhos, triângulos,
                           memória da placa, nível, lâmpadas)
  player/                  o agente: modelo.ts (liga modelos/agente.bbmodel no esqueleto), animacao.ts, maos.ts (os dedos),
                           arma.ts (a arma na mão; a escopeta com as duas mãos ou no ombro; o pêndulo da armadilha; o frasco
                           da pistola com o calor; Q troca no Testar), mira.ts (mirar: a pose, o coice, a bomba depois do tiro),
                           recarga.ts (a recarga da escopeta: a bolsa, o cartucho, as balas puxadas pela arma), queda.ts (cair sem violência), dano.ts (o tranco de um golpe,
                           machucado), vida.ts (a vida, a invulnerabilidade, os kits), parado.ts (a respiração, o
                           peso e os gestos de parado), alcancar.ts (o braço alcança um ponto: IK de dois ossos),
                           rosto.ts (as expressões), passada.ts (as curvas de uma passada de verdade: andar e correr),
                           pes.ts (o pé de apoio preso no chão, em qualquer direção: IK da perna), controle.ts
                           (andar, correr, esquivar; preso e lento), tremor.ts (o tremor da tela: quem causa chama tremerDe;
                           o Testar aplica na câmera), sons.ts (ouvirAgente: os passos, a cambalhota, o golpe,
                           a queda, o kit e os sons das armas no momento da animação), numeros.ts
  weapons/                 tiro.ts (o gatilho e a cadência), clarao.ts (o clarão no cano), municao.ts (as 4 balas e a
                           recarga da escopeta, a sobrecarga da pistola, o contador simples), armadilha.ts (jogar: o voo em
                           arco, grudar, chamar de volta, a linha do arco), bala.ts (a bala: a mira de verdade, o voo, bater e
                           acertar os alvos), impacto.ts (as faíscas e a marca), sons.ts (o Sino da pistola, o Ferro que
                           canta da escopeta, a recarga, a armadilha, onde a bala bate), numeros.ts
  enemies/<nome>/          um inimigo por pasta (mae/, glutao/, assombrado/, asa-sombria/, devora-almas/): IA, ataques, modelo, números; a Mãe já tem
                           modelo.ts (monta o modelo, a saia e o cabelo com molas), pose.ts (as molas da pose, do
                           laboratório), animacao.ts (parada, andar, passar pela porta), rosto.ts (as expressões, os
                           tiques e o brilho dos olhos), efeitos.ts (o rosto que escurece, as ondas do grito, a fase 4
                           preta com partículas), sons.ts (a voz dela: a cantiga, a caça, a de cada golpe e estado; e quando
                           cada som toca), ruidos.ts (o corpo e o Luto: passos, estalos, garras, bolhas), golpes.ts (os ataques e os movimentos do Luto), estados.ts
                           (grito, exausta, atordoada, cambaleio, enfraquecida, capturada), luto.ts (a poça, as ondas,
                           os respingos, o aviso) e numeros.ts; o Assombrado tem modelo.ts (o molde e as cópias que dividem
                           tudo), animacao.ts (o joão-bobo, os pulos, o ataque, o dano, estourar; a perna por IK) e numeros.ts;
                           a Asa sombria tem modelo.ts, animacao.ts (voar, planar, cuspir, desviar, o dano, estourar),
                           projetil.ts (a bola de matéria com o núcleo e o rastro, uma malha só para todas) e numeros.ts;
                           o Devora almas tem modelo.ts, animacao.ts (os modos: mergulhar, nadar, emergir, a marca, o salto,
                           exposto, engolindo, o cuspe, a investida, a chuva, a ninhada, atordoado, rastejando; as fases,
                           que são as 3 barras de vida, e arrancar; a curva no corpo), nado.ts (o rumo com transição:
                           acelera, freia, a curva com raio; a inteligência usa), efeitos.ts
                           (no chão: a mancha, os espinhos, a gosma, a marca de mordida, o aviso e o rasgo da investida, os
                           círculos e os tentáculos da chuva e das poças), tremor.ts (o que faz a tela tremer) e numeros.ts
                           (ESCALA: ele é 3 vezes o modelo)
  enemies/estouro.ts       o estouro dos Sombrios (os cubos de matéria e a mancha que seca), um estoque só para todos
  enemies/luta.ts          o que a inteligência dos Sombrios divide: o alvo (o agente), andar no mundo, virar, desviar dos
                           obstáculos (rumoLivre), separar o bando;
                           cada um pensa no ia.ts da pasta dele (o Assombrado, a Asa sombria, o Devora almas)
  enemies/depurar.ts       a vista de depuração da luta (só no npm run dev): F2 as barras de vida, F4 as caixas de acerto
  enemies/sons.ts          o que os sons dos Sombrios dividem: a voz de cada um no espaço, o som num ponto do chão, a bolha
                           e o respingo; os sons de cada um no sons.ts da pasta dele (o Lamento do Assombrado, o Morcego da
                           Asa sombria, o Abismo do Devora almas: ouvirX, depois de animarX, toca cada som no momento da animação)
  enemies/pastas.ts        achar as pastas de uma cópia de modelo pelo nome (avisa se faltar) e as mecha_ que balançam
  capture/                 a poça e a captura
  allies/                  Lara e Nicolas
  hud/                     Hud.tsx + hud.css: o HUD conceito C (a vida e o fôlego, os kits, a arma, as barras do chefe); o jogo
                           conta a cada quadro (EstadoHud) e ele só muda o que mudou; as legendas e a roda de armas vêm depois
  input/                   acoes.ts: ações do jogador (teclado e mouse; depois controle e toque): o jogo lê ações, nunca teclas
  world/                   colisao.ts (paredes, portas, móveis, corrimão, chão, escadas, braço da câmera, a armadilha jogada, a beirada do mapa sem chão, os bloqueios do roteiro), portas.ts (abrir e fechar
                           com E, o estado vivo das portas); depois carregar por blocos
src/chapters/cap1/         o roteiro do capítulo: qual mapa, gatilhos, cenas, chefe
src/chapters/intro/        (já existe) o roteiro da Demo · Intro: Roteiro.tsx (as arenas, as ondas, o chefe, a tecla H de teste),
                           tornado.ts (fecha a arena), sons.ts (o ambiente do submundo, o vento do tornado), numeros.ts
```

O jogo vai para o **celular** depois: por isso a camada `input/` desde o início, e cuidado com o peso das cenas
(chamadas de desenho). O editor de mapas é só para PC.

## A stack

Vite 5 · React 18 · TypeScript 5 (strict) · three 0.169 · @react-three/fiber 8 · @react-three/drei 9.
Versões fixas no `package.json`; não atualize sem pedir.

## Convenções de código

- O estado das configurações fica em `src/settings/settings.ts`; telas leem com `useSettings()`.
- Toda cena de jogo leva `<Iluminacao />` (`src/game/luz`): nada de luz ambiente solta na cena. O `<Canvas>` dela recebe
  `canvasDoNivel(nivel)` (a resolução e as sombras): o fiber repõe as duas a cada redesenho, não mexa nelas por dentro da cena. Os números de cada lugar ficam em
  `src/maps/ambientes.ts`; o que muda por nível de qualidade, em `src/render/qualidade.ts`. Tudo o que for de tela cheia
  mora numa passada só (`src/render/passeFinal.ts`): no celular o que pesa é preencher a tela.
- O mapa é dado puro (JSON, tipos em `src/maps/types.ts`). O editor muda o dado; a vista desenha a partir dele. Nada de estado escondido nos objetos 3D.
- Mudou o formato do mapa? Suba `FORMATO` (`src/maps/types.ts`) e escreva a conversão em `src/maps/formato.ts`. Nunca quebre um mapa salvo.
- Textura, objeto e ambientação são referenciados por **nome** no mapa (`"papel-verde"`, `"lampada-teto"`, `"corredor"`), nunca por caminho de arquivo.
- Comentários curtos explicando o porquê, em português, no estilo do laboratório.
