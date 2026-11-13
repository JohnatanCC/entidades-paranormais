# A Demo · Intro (o submundo)

Decidido em 12/nov. A Intro nova (no lugar da instalação da C.R.O.S. do laboratório, `docs/jogo.md`): o Matheus é sugado
pela ruptura e cai no submundo, um lugar vazio com ilhas de rocha negra flutuando na névoa vermelha. São **três arenas
ligadas por pontes de pedra**: duas de hordas dos Sombrios e a do chefe, o Devora almas (`docs/demonios.md`). Sem
tutorial por enquanto (ensinar os controles aos poucos fica para depois). Depois desta demo vieram as balas das armas e o HUD (12/nov).

No menu: **Novo jogo → Demo · Intro** (`src/screens/NovoJogo.tsx`, `src/screens/Jogo.tsx`). O jogo de uma fase é o mesmo
agente do Testar do criador de mapas (a câmera, a colisão, a luz do lugar, as armas, a vida), em tela cheia; Esc volta ao menu.

## As decisões

| | |
| --- | --- |
| O cenário | **Um mapa do criador de mapas** (`maps/intro`), para o desenvolvedor retocar. Nasceu de um gerador (como os modelos) |
| O chão | O mapa é **sem chão** (o formato 3, `semChao`): o térreo só tem chão onde há piso, e a beirada das ilhas segura o agente (a barreira invisível: ele não cai) |
| As hordas | Arena 1: **2 ondas de Assombrados** (3, depois 5). Arena 2: **2 ondas de Assombrados e Asas sombrias** (4 + 1, depois 4 + 2). Os números num arquivo próprio |
| A passagem | Durante a horda, **um tornado fecha a passagem** para a próxima arena; limpou, ele some |
| O chefe | Arena 3: o **Devora almas**, com as crias dele (a ninhada) |
| Sem balas ainda | Os demônios **vêm e atacam** de verdade (a inteligência de cada um); **uma tecla de teste destrói a horda** para passar adiante, até as balas chegarem |
| A música | (13/nov: a música toca a 60% do volume das configurações, para os demônios aparecerem) **A de batalha nas hordas** (12/nov: `batalha.mp3`, a do laboratório): começa quando a arena fecha e some quando ela abre. **"O devorador de almas" na luta do chefe**: começa quando a arena dele fecha, no ronco do chão, antes de ele sair |

## O cenário (feito em 12/nov)

- **As três ilhas** (`maps/intro`): a arena 1 (~10 m de raio, onde ele nasce), a arena 2 (~12,5 m) e a arena do chefe
  (~23 m), com a borda irregular; duas pontes de pedra (3 e 4 m de largura) ligam uma à outra.
- **O chão:** rocha negra com manchas de cinza; no miolo da arena do chefe o chão rachado com a brasa por baixo, e as
  rachaduras saindo em raios.
- **Embaixo das ilhas:** a rocha pendurada (`base-ilha`) em volta da beirada inteira, em degraus que afinam para baixo.
- **A arena do chefe:** o miolo livre (13 m de raio, onde ele nada), um anel de templo caído (arcos e pilares virados
  para o meio), muros, destroços e pilares tombados, espinhos de rocha tortos perto da beirada e quatro cristais
  vermelhos que acendem de verdade. As arenas 1 e 2 têm menos: um pilar, entulho, um muro, um ou dois cristais.
- **No ar:** rochas flutuando em volta das ilhas, umas acima, umas abaixo.
- **As peças novas** (para usar em qualquer mapa: o grupo "O submundo" no catálogo de objetos): rocha grande, rocha
  média, pedregulho, espinho de rocha, rocha flutuante, base da ilha, pilar em ruína, pilar caído, arco em ruína, muro em
  ruína, destroços, cristal vermelho (`modelos/objetos/`); as texturas rocha negra, chão rachado e cinza
  (`texturas/`); a ambientação **Submundo** (`src/maps/ambientes.ts`: a névoa vermelha, o alto quase preto, sem lua nem
  estrelas, uma luz vermelha de cima). **A névoa e a luz (ajustadas em 12/nov, a pedido):** a névoa é densa a média
  distância (~50% a 25 m, mais de 90% a 46 m, a largura da arena do chefe): cada arena se vê inteira e a seguinte some
  no vermelho; a luz é mais clara que a da casa (a ambiente, o preenchimento, a de cima e a exposição mais fortes).
- **No criador de mapas:** a ferramenta Ambientação ganhou a caixa "Sem chão" (o submundo).

**O peso (medido em 12/nov):** soltas, as peças faziam ~375 chamadas de desenho num quadro no nascimento (~110 dentro da
arena do chefe). **No jogo, os objetos repetidos agora são juntados** (`src/render/instancias.ts`: uma malha de cópias por
peça de cada tipo, com a luz assada de cada cópia junto): **~99 no nascimento, ~52 dentro da arena do chefe**. Os que
acendem (os cristais) continuam soltos, por causa da luz de verdade. O editor continua com as cópias soltas.

## O roteiro (feito em 12/nov)

`src/chapters/intro/` (o `Roteiro.tsx` entra na fase ao lado do agente; os números em `numeros.ts`):
- **Os pontos do mapa** (os `points` do formato, no `maps/intro`): `arena` (o meio de cada arena e o raio em que o agente
  "entrou"), `nascer` (onde os demônios de cada arena surgem; 5 na arena 1, 8 na arena 2), `chefe` (onde o Devora sai)
  e `tornado` (um em cada ponta de cada ponte; cada um fecha a arena dele). Por enquanto se mudam no gerador ou no
  arquivo; mexer neles no criador de mapas vem depois.
- **A ordem:** entrou na arena, os tornados dela formam e a arena fecha; 2 s depois, a primeira onda surge do chão, um
  demônio a cada 0,35 s, nos pontos longe do agente (o Assombrado sobe do líquido preto; a Asa sombria rompe o chão e
  sobe até a altura do voo); limpou, 2,5 s e vem a próxima; limpou a última, os tornados desfazem e a passagem abre.
  Na arena do chefe: a arena fecha, o chão ronca (ele nadando embaixo, a mancha) por 1,8 s, ele sai do chão e a música
  começa. Estourado, aparece "Fim da demo"; Esc volta ao menu.
- **O tornado** (`tornado.ts`): um funil de pedaços de matéria e brasas girando, mais largo em cima, uma malha só; forma
  com um estrondo e venta enquanto está de pé; segura o agente (um bloqueio redondo no mundo).
- **A tecla H** (de teste, até as balas chegarem) estoura a horda em sequência; no chefe, tira uma barra de vida (ele
  fica atordoado, rasteja e passa para a próxima fase; na última, estoura).
- **A linha do roteiro** no alto da tela: a arena, a onda, quantos Sombrios faltam, a dica do H.
- **Os sons:** o ambiente do submundo (`sons.ts`: o vento grave sem parar, roncos distantes, um gemido longe de vez em
  quando, um sussurro raro) a música das hordas, `public/musica/batalha.mp3`, e a do chefe, `public/musica/devorador.mp3` ("O devorador de almas").

## As etapas (uma por vez)

1. ✅ **O cenário** (12/nov): o Novo jogo com a Demo · Intro, as três arenas jogáveis (o Matheus anda por elas, a beirada
   segura), as peças do submundo e a ambientação.
2. ✅ **O roteiro** (12/nov): as peças repetidas juntadas (o peso); os pontos no mapa; a ordem das arenas, das ondas e do
   chefe; o tornado; a tecla H; a música do chefe e o ambiente do submundo.
3. ✅ **A luta** (12/nov): a inteligência de cada Sombrio atrás do Matheus, o dano no agente, ser engolido e a gosma, e,
   caindo, voltar no começo da arena (a seção abaixo).

## A luta (feita em 12/nov)

Cada Sombrio pensa no `ia.ts` da pasta dele (os números em `LUTA`, no `numeros.ts` de cada um; o que eles dividem em
`src/game/enemies/luta.ts`) e fere o agente pelo controle que a fase dá (`AgenteNaFase`, em `src/game/Testar.tsx`):
- **O Assombrado** vai atrás aos pulinhos (1,2 m/s) e ataca de perto (as garras: 22; pega no pouso do salto, se o
  agente ainda estiver perto e na frente). **Só um do bando ataca por vez**; os outros esperam em volta. Quem chega
  pelo lado da câmera dá a volta até o lado do agente antes de atacar (senão tapava a vista).
- **A Asa sombria** voa em volta do agente a ~7 m, girando devagar, e cospe a cada ~3 s (a bola: 15). **Desvia** quando
  o agente mira nela por mais de 0,6 s (no máximo a cada 3 s). Não sai de cima da arena.
- **O Devora almas** mergulha, nada em volta do agente e escolhe um ataque pela barra de vida: a **marca** (quem ainda
  está em cima no salto é **engolido**: some, a tela escurece, 20/s por 3 s, e é cuspido coberto de gosma, 20% mais
  lento por 4 s), a **investida** (20, a esquiva de lado escapa), e a partir da 2ª barra a **chuva de tentáculos** (12
  por tentáculo, no círculo) e a **ninhada** (2 Assombrados e 1 Asa sombria cuspidos, que entram na briga; na 3ª barra,
  mais 2 sobem do chão). Depois de 3 ataques seguidos, cansa e rasteja. O rastro de gosma deixa lento quem pisa.
- **O agente:** a **cambalhota escapa** (o trecho invulnerável dela, de 0,03 a 0,34 s, decidido no laboratório), e os
  0,9 s depois de um golpe também. Caindo, volta **no começo da arena** (onde entrou), com a vida e a munição cheias; a
  onda da arena recomeça, e o chefe nada em volta um pouco antes de voltar a atacar.
- **Medido no teste** (o agente parado, sem esquivar): na arena 1 os Assombrados levam ~10 s para chegar e batem a cada
  ~3 s; na arena 2 as bolas e as garras juntas tiram ~25% em 8 s; o Devora engole quem fica parado na marca. Os números
  são o ponto de partida: ajustar jogando.
- **As balas (12/nov):** os demônios levam tiro e estouram de verdade (`docs/jogo.md`, "A bala"); a tecla H continua, de teste.
  No npm run dev, F2 mostra as barras de vida dos demônios e F4 as caixas de acerto.
- **A horda do chefe (13/nov):** a cada 20 s de luta, 1 Assombrado e 1 Asa sobem do chão perto do agente.
- **As poças da arena do chefe (13/nov):** 6 poças de líquido preto na borda da arena (a 80% do raio, onde tem chão).
  Chegando a menos de 4,5 m de uma, um tentáculo sobe da beirada dela mais perto do agente (o círculo de dentes avisa e
  ele bate: 12 de dano, o mesmo da chuva); cada poça pode de novo em 1,8 a 3 s. Os números em `POCAS`
  (`chapters/intro/numeros.ts`); os tentáculos são os da chuva, nas vagas depois das dela (`devora-almas/efeitos.ts`).
  Os 3 tentáculos das costas do chefe também levam tiro: arrancados, ele nada mais devagar (`docs/demonios.md`).
- **O brilho do golpe (12/nov):** quem leva um golpe (o agente, um demônio) acende num vermelho claro por um instante.
- **Em aberto:** a câmera não desvia dos demônios (um Assombrado muito perto ainda pode ficar na frente); o projétil
  ainda atravessa paredes e objetos.

Depois: ✅ as balas das armas (a etapa 4b de `docs/demonios.md`, 12/nov) e ✅ o HUD (o conceito C, 12/nov: as barras do chefe em cima; a onda limpa dá um kit). Os sons das armas e
do agente: 12/nov (`docs/jogo.md`).
