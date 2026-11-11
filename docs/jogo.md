# O jogo: o que já está decidido

Entidades Paranormais é um jogo de **ação com terror em terceira pessoa** (inspirado no Ghosthunter de PS2).
Você é **Matheus Moura**, agente da **C.R.O.S.** (a organização que captura entidades). Você enfraquece os fantasmas
a tiro e os prende com a armadilha. Cenário e personagens em blocos com textura em pixel (ver "A identidade visual").

## A direção (9/nov/2026)

- **Inspirações:** Ghosthunter (PS2) no tom e na captura; Resident Evil 4 na gameplay (câmera sobre o ombro, mirar parado ou devagar).
- **A demo é o capítulo 1 inteiro**, jogável do começo ao chefe. A história ainda vai crescer.
- **Capítulos:** a cada chefe derrotado a mansão muda, porque ela se alimenta dos fantasmas. Na prática, cada capítulo é um mapa.
- **Mais tarde:** versão para celular, e talvez vender ou publicar de graça.
- **A base é o laboratório v130** (`reference/laboratorio.html`, o mesmo de https://claude.ai/artifact/BDUaLP6DmvqwsBXhkdJdYw).

## A identidade visual (10/nov)

- **Blocos com textura pintada em pixel**: o cenário com 32 px por metro, os personagens com 64 (o rosto com 128), para
  o detalhe do Hytale e não do Minecraft: cabeça em várias peças, cabelo com volume, mãos com dedos, expressões. Detalhe vai na textura, não na forma:
  rosto, roupa, sujeira; piscar e mudar a expressão é trocar um pedaço da textura.
- **Proporções quase realistas** (cabeça só um pouco maior, mãos normais): o estilo em blocos puxa para o "fofo", e o
  terror compensa com a **ambientação mais tensa**: pouca luz, sombras, sons.
- **Fantasmas com formas erradas:** a Mãe alta demais (2,26 m: maior que uma porta), braços longos, cabelo em mechas finas, sem véu, olhos brancos
  de cega, a cabeça virando sem suavizar; o Espectral translúcido, se desfazendo em cubos embaixo; o Glutão inchado,
  com a boca rasgando o tronco. Olhos que brilham no escuro.
- **Animação:** partes rígidas que giram nas juntas (como no laboratório), feita em código, ligada às ações do jogo.
  Os dedos fecham por poses (solta, punho, aberta, segurar, guarda com o indicador fora do gatilho, apontar) e o rosto tem expressões (neutra, esforço, medo,
  dor, raiva, surpresa), com piscar e o olhar passeando; as mechas do cabelo balançam com física simples (a gravidade
  e o tranco da cabeça, com limites para não entrar na cabeça) (`src/game/player/maos.ts`, `rosto.ts` e `src/game/corpo/molas.ts`).
- **Parado** (`src/game/player/parado.ts`, os tempos em `numeros.ts`): a respiração mais funda e o peso passando de uma
  perna para a outra; depois de 8 a 15 s parado, um gesto sorteado (nunca o mesmo duas vezes seguidas): olhar em volta
  (os olhos chegam antes da cabeça), ajustar a alça da mochila, conferir a bolsa do cinto, abrir e fechar a mão.
  Andar, esquivar ou trocar de arma corta o gesto na hora. Cada estado tem os seus gestos:
  - sem arma: os quatro acima;
  - **com a pistola:** a mão na guarda com o indicador esticado por fora do gatilho, e a arma nunca parada de todo (o
    braço e o pulso derivam devagar); gestos: olhar em volta (o peito vira mais e o braço sobe, a arma acompanha o
    olhar), conferir o frasco (a pistola sobe deitada na frente do peito, o frasco virado para os olhos) e girar o pulso.
  - **com a armadilha:** a lanterna balança pela alça como um pêndulo (a gravidade e o tranco da mão: andando, parando,
    virando) e o vidro aceso respira devagar; gestos: olhar em volta (a lanterna vai à frente, iluminando o caminho),
    levantar até o rosto (na altura do queixo, o vidro acende mais) e girar a lanterna pela alça. O vidro não ilumina
    o rosto: seria uma luz a mais na cena, pesada no celular (fica para quando o jogo tiver a luz dele).
  - **com a escopeta:** parado mais de 1,2 s, ele apoia a escopeta no ombro direito (o cano para cima e para trás, a
    mão no cabo); andou, ela volta para as duas mãos em menos de meio segundo. Gestos: olhar em volta, conferir a
    câmara de sal (traz a arma deitada na frente do peito, o vidro virado para os olhos) e puxar a bomba até a metade.
  O relicário do traje ainda não está no modelo: quando entrar, ganha o gesto de tocar nele.
- **Ver modelos** (Modo desenvolvedor): o personagem de perto, com animações, expressões, mãos, a arma na mão, os gestos
  de parado (botões para ver na hora), mirar e atirar, e a luz do jogo; e cada arma e objeto sozinho.
- **Modelos no Blockbench**: o desenvolvedor modela e pinta; o jogo lê o `.bbmodel` direto. Passo a passo em
  `docs/blockbench.md`. Os objetos do cenário e as armas também (decidido em 10/nov); o Editor de modelos saiu do plano.
- **A imagem é limpa** (decidido em 11/nov): o filtro PS1 e o "suave" saíram do projeto. No lugar entrou a iluminação do
  jogo (a ambientação de cada lugar, os níveis de qualidade): `docs/iluminacao.md`.

## O objetivo de cada capítulo

Cada fantasma fica preso à casa por **objetos ligados a ele**. O agente procura esses objetos pelo mapa e os **destrói**.
O número de objetos e os lugares variam de fantasma para fantasma.

## Capítulo 1: a Mãe

- **Chefe:** a Mãe. A luta final é a do berçário (abaixo).
- **Os 3 objetos:** a foto do filho; a pelúcia de gato que era do filho; o berço, por último: o berçário só abre com uma
  **chave** achada antes.
- **No mapa, ela é uma perseguidora** (como o Mister X do Resident Evil 2): anda pela casa, **escuta o barulho** que o
  agente faz e vem atrás. Não pode ser derrotada fora da luta: com dano suficiente, fica **atordoada** por um tempo.
  O laboratório já tem a base disso: a patrulha cantarolando, a pausa em que ela escuta e a caça (voz, respiração, grito).
- **Salas seguras:** o agente cria uma área protegida com sal e runas, onde os fantasmas não entram. Detalhes depois.

- **A mansão:** a planta está em `docs/mansao-cap1.md` (aprovada em 9/nov).

**Decidido (9/nov):**
- A chave só aparece depois que a foto e a pelúcia forem destruídas (senão o jogador vai direto ao chefe).
- Os objetos têm lugar fixo na demo; o sorteio entre alguns lugares vem depois (a rouparia já tem três armários para isso).
- A luta do berçário é em outro mapa (`bercario-cap1`): a porta do berçário troca de mapa.

**Em aberto (decidir antes de montar o capítulo):**
- Destruir a foto e a pelúcia muda a Mãe (menos vida, outro comportamento) ou só libera o caminho?
- Quanto tempo ela fica atordoada.

**Decidido (9/nov):** o barulho que a Mãe escuta **não vem do piso**. Vem de quebrar objetos, abrir porta com força e
atirar. Mais tarde entra **agachar / esgueirar-se** (andar sem fazer barulho).

Este arquivo resume o que foi **jogado e aprovado na demo Intro do laboratório** (versão v130).
Os números vêm de `reference/laboratorio.html`; se um número aqui e no laboratório não baterem, vale o laboratório.
Os textos longos de design (história, mansão, intro) estão em `docs/design/` (cópias do documento de design).

## Personagens

| Quem | Papel |
| --- | --- |
| Matheus Moura | O agente (jogador). Traje "Selado": runas que acendem com a sobrecarga, relicário, frascos, cartuchos de sal |
| Lara | Agente da C.R.O.S., vai na frente com a lanterna. Mesmo modelo do agente, outras cores e cabelo |
| Nicolas | Agente da C.R.O.S., fala pelo rádio. Mesmo modelo do agente, outras cores e cabelo |
| A central | Voz no rádio, com chiado |

Lara e Nicolas **não têm IA de combate**: seguem uma rota marcada 4–6 m à frente, param nas portas virados para o jogador,
não colidem com ele, e só "lutam" nas cutscenes. Usam a mesma animação de andar do agente (pés plantados, braços, cabeça).

## O agente

| | Valor |
| --- | --- |
| Vida | 200 (o HUD mostra em **%**) |
| Andar / correr / mirando | 2,4 / 4,6 / 1,45 m/s (aceleração 16, freio 22) |
| Fôlego | 6 s de corrida, volta em 1,4× |
| Esquiva (Espaço) | 2,7 m em 0,5 s, invulnerável de 0,03 a 0,34 s, recarga 0,7 s |
| Invulnerável depois de dano | 0,9 s |
| Kit médico (F) | cura 60. **A cada 1:30 nasce 1 kit, mas só se você estiver com 0.** Na Intro: +1 kit por onda limpa, +2 na enfermaria, e ao morrer volta com 5 |

## As armas (munição infinita; o limite é a sobrecarga)

| Arma | Atalho | Tiro | Dano | Sobrecarga | Trava |
| --- | --- | --- | --- | --- | --- |
| Pistola de Demantino (ferro extraído de objetos amaldiçoados) | 1 | a cada 0,2 s, bala a 40 m/s | 3 | +3% por tiro | 5 s |
| Escopeta de sal grosso | 2 | a cada 1 s, 5 bagos em leque 0,065, 46 m/s | 5 × 10 | +30% por tiro | 8 s |
| Armadilha | 3 | jogada (mira com o botão direito) | — | — | — |
| Kit médico | F | — | cura 60 | — | — |

Trocar: 1/2/3, Q (alterna), rodinha do mouse, ou **Tab segurado = roda de armas**.
Mirar: botão direito. Atirar: botão esquerdo. Correr: Shift. Interagir: E.

Os modelos (10/nov) estão em `modelos/armas/` e o agente já segura cada uma (`src/game/player/arma.ts`):
- a pistola numa mão, na guarda: a arma apontada para o chão na frente;
- **a escopeta com as duas mãos** (decidido em 10/nov: é pesada e exige força): atravessada na frente do corpo, a mão
  esquerda na bomba, o peito um pouco para trás com o peso; correndo, ela sobe; **mirar também vai ser com as duas**;
- a armadilha pendurada pela alça, balançando.

No Testar, Q troca (pistola, escopeta, armadilha, mão vazia).

**Mirar e atirar (10/nov, sem bala ainda):** o botão direito mira; o esquerdo atira (atirar sem mirar levanta a arma
antes, e o tiro sai quando ela chega). Mirando, a câmera chega mais perto, mais de lado e fecha (um ponto no meio da
tela); ele anda devagar (1,45 m/s, como na tabela do agente), não corre e vira para onde a câmera olha (`src/game/player/mira.ts`):
- a pistola com as duas mãos, os braços quase esticados, a esquerda por baixo; o tiro a cada 0,2 s segurando o botão;
- a escopeta com a coronha no ombro, o corpo de lado (40°: a esquerda alcança a bomba; o quadril e as pernas viram junto, os pés girando no lugar) e o rosto encostado; o coice
  empurra o ombro e, depois de cada tiro, a mão esquerda puxa a bomba e devolve; um tiro por segundo;
- o tiro: o cano sobe e a arma vem para trás (o coice), e um clarão em pixel no cano (brasa na pistola, sal na escopeta;
  sem luz nova na cena). A cadência, o coice e o clarão em `src/game/weapons/numeros.ts`.

**Jogar a armadilha (10/nov):** com ela na mão, o botão direito mira: o braço arma para fora, na altura do ombro (longe da cabeça), a mão esquerda aponta
o alvo e uma linha pontilhada mostra o arco, com um anel onde ela vai cair. O esquerdo joga (sem mirar, levanta antes):
o braço passa por cima do ombro, ela sai (11 m/s para o ponto mirado, mais 1,6 para cima, como no laboratório) e o braço
acompanha para baixo. Ela voa girando e **gruda no chão (em pé) ou na parede (com a base na parede)**; bate no teto e desce.
Fora da mão, um clique a chama de volta: ela voa até a mão. Trocar de arma com ela fora a recolhe na hora
(`src/game/weapons/armadilha.ts`). A captura (abrir a íris, o raio, puxar a poça) vem com o primeiro fantasma.

A bala, o dano e a sobrecarga vêm na etapa das armas. Quando ela chegar,
1/2/3 deixam de mostrar as expressões no Testar (isso fica no Ver modelos).

## Tomar dano e ficar machucado (10/nov)

Só a animação (decidido: machucado não muda a velocidade nem o correr). Sem sangue nem ferimento
(`src/game/player/dano.ts`, os números em `numeros.ts`, DANO):
- **o tranco** (0,45 s): o golpe joga o corpo para longe de onde veio (de frente, para trás com a cabeça; de costas,
  para a frente; de lado, inclina para o outro lado), os braços abrem, ele afunda um pouco e volta; o rosto de dor. Vale
  por cima de tudo, até mirando (a arma sacode junto). Depois do golpe, 0,9 s invulnerável;
- **machucado** (30% da vida ou menos): curvado e inclinado para a esquerda, respirando mais fundo e mais rápido,
  mancando da perna direita (o passo dela é mais curto), a mão esquerda segurando o lado quando está livre (não na
  bomba, na mira ou apontando) e o rosto de esforço; não faz gestos de parado. Melhora devagar quando se cura.

A vida (`src/game/player/vida.ts`): 200, invulnerável 0,9 s depois de um golpe, o kit (F) cura 60; zerou, a queda.
No Testar ela é simples (sem HUD: a vida em % num canto): **J** toma 25 de uma direção sorteada, **F** usa um kit (sem
limite, por enquanto) e, depois da queda, ele volta com a vida cheia. No Ver modelos: **Tomar dano** e **Machucado**.

## A queda do agente (decidida em 10/nov)

Com a vida zerada, o agente **perde as forças, cai de joelhos e tomba de lado**; a tela escurece e ele volta no
checkpoint. Sem violência explícita: nada de sangue, ferimento ou corpo machucado. Os fantasmas continuam sem animação
de morte. Feita em 10/nov (`src/game/player/queda.ts`, os tempos em `numeros.ts`, QUEDA):
- 0 a 0,3 s: a cabeça pende, o tronco curva, os joelhos amolecem e os braços soltam; o rosto de dor;
- 0,22 a 0,6 s: de joelhos (as canelas no chão, os pés esticados para trás);
- 0,65 a 1,15 s (deixada mais rápida a pedido): tomba para a esquerda dele, um pouco encolhido (a mão da arma por cima, à vista); o braço de baixo estica
  no chão e a cabeça deita nele; o rosto **desmaia** (olhos fechados) e o peito continua respirando: desacordado, não morto;
- a mão da arma não larga, mas dobra o pulso (o cano deitado: a escopeta não entra no chão);
- caído, nada responde (andar, mirar, atirar, trocar de arma, portas); a tela escurece aos 1,5 s e ele volta em pé no
  checkpoint aos 2,9 s, com a tela escura. No Testar, **K** faz cair (ou **J** até zerar a vida) e o checkpoint é
  o ponto onde o teste começou.

## Destruir ou capturar (decidido em 10/nov, vale em toda luta)

Os fantasmas são de dois tipos:

- **Menores: o Espectral e os demônios** (nenhum demônio desenhado ainda). Com a vida zerada, **são destruídos**: estouram
  num respingo de ectoplasma, sem corpo nem ossos, e deixam uma mancha no chão que seca em poucos segundos. É um efeito,
  não uma animação de morte. Não há o que capturar.
- **Maiores: o Glutão, a Mãe e os que vierem** (os chefes e os únicos). Esses **precisam ser capturados**:
  - com a vida zerada, o fantasma **se desfaz numa poça de ectoplasma** com um anel que mostra o tempo;
  - em cima da poça aparece o **ícone da armadilha** (ensina o que fazer);
  - a armadilha jogada na poça captura; ela puxa **todas as poças num raio de 2,8 m** (para quando dois maiores caem juntos);
  - se o tempo acaba (**10 s**), ele volta com metade da vida;
  - a Mãe tem a regra dela: as quatro barras e a armadilha na hora em que fica enfraquecida (ver abaixo).
- Não existe animação de morte: o menor estoura, o maior vira poça e some na captura.

## Os fantasmas da demo

| | Espectral | Glutão (chefe da Intro) |
| --- | --- | --- |
| Vida | 60 | 400 (escala 1,6×) |
| Ataque | mordida 30 (22 na Intro), bote a 3,4 m/s | pancada 35, investida 30, cospe Espectrais (primeiro aos 10 s, depois a cada 14 s) |
| Especial | só um ataca por vez (um "token" de ataque) | só o **núcleo** leva dano cheio; com pouca vida **devora** um Espectral e cura **10% da vida máxima** (espera 20 s entre devoradas); Lara e Nicolas aparecem encolhidos dentro da barriga |
| Vida zerada | destruído (estoura em ectoplasma) | poça, 10 s; capturado, solta Lara e Nicolas no chão |

Os Espectrais são esqueléticos, de manto. O Glutão é gordo, esquelético e deformado, com núcleo brilhante na barriga.

## A Mãe (chefe, a luta do berçário)

**O modelo (10/nov, `modelos/fantasmas/mae.bbmodel`, `src/game/enemies/mae/`):** em blocos, **2,26 m** (maior que as
portas de 2,1 m), magra e pálida; o rosto cadavérico (órbitas fundas, olhos brancos de cega que brilham, sobrancelhas
finas, lágrimas de Luto, o queixo solto que cai no grito); o cabelo preto molhado repartido no meio, em 13 mechas com física; o vestido de linho creme com pregas, gola alta
de babado, faixa marrom, punhos escuros e o Luto escorrendo; a saia em 10 painéis de dois pedaços com física (abrem para
fora, não entram nas pernas), com a anágua por baixo (fixa, mais escura: pelas frestas aparece pano); dedos compridos com unhas em garra; pés descalços. Uma malha só com ossos (2 chamadas de
desenho, com os olhos). Sem véu (o design final do laboratório e a imagem de referência).

**Como ela se mexe (do laboratório):** cada movimento dá uma pose-alvo e o corpo chega nela por molas de segunda ordem,
cada parte no seu tempo (o quadril puxa, o tronco vem, o braço depois e a mão chicoteia por último), passando um pouco do
ponto e assentando; a "dureza" de cada movimento é a frequência das molas. O ar travado vem dos **estalos da cabeça**:
parada, de vez em quando ela tomba a cabeça de lado de uma vez (0,55 rad por 0,18 s) e volta (`pose.ts`, `animacao.ts`).

**As animações (uma etapa por vez):**
- ✅ 2 (10/nov): **a parada** (curvada, balançando, a cabeça tombada procurando, a boca entreaberta tremendo, as garras
  abertas meio caídas, os estalos), **o andar** (0,95 m/s: os braços pendurados balançando com o cotovelo e a mão
  atrasados, os ombros contra o quadril, a inércia ao arrancar, frear e virar; passos curtos por baixo da saia, que as
  pernas empurram: a frente do vestido vai para a frente com a perna que avança, e a de trás vai para trás) e **abaixar para passar pela porta** (o quadril desce, o tronco curva, a cabeça levanta para olhar
  e a mão direita segura o batente: a cabeça passa a 1,87 m, abaixo dos 2,1 m da porta; a saia encolhe a partir da
  cintura e a barra amontoa no chão). Saber quando há porta em cima dela é da inteligência (depois);
- ✅ 3 (10/nov): **os ataques** (`golpes.ts`; os números da fase 1 em `numeros.ts`, GOLPE): a **garra** (ergue o braço
  por 0,42 s, o aviso para quem joga, e corta na diagonal com um passo à frente; duas garradas emendam, a última fica
  mais), **aproximar** aos trancos (arranca, quase para, arranca, a 5 m/s, até 1 m), a **investida** (sai de baixo do
  chão, voa baixo com as garras na frente e a boca escancarada, pousa derrapando a 0,9 m) e a **carga** (agacha tremendo
  e guincha, corre em linha reta a 8,6 m/s e passa derrapando). Cada golpe diz quanto ela avança; quem a move no mundo
  (com as paredes) é a inteligência, depois;
- ✅ 4 (10/nov): **o Luto** (`golpes.ts`; os efeitos em `luto.ts`, leves: a poça, 10 ondas reaproveitadas, os respingos
  numa chamada de desenho só, o domo do aviso; nenhuma luz nova): **mergulhar** (afunda em pé, os braços erguidos somem
  por último), a **finta** (surge até o peito, guincha e afunda), **surgir** (a apresentação: bolhas; as mãos rompem o
  Luto tateando, agarram o chão, ela se puxa para fora curvada, a coluna desenrola, a cabeça sobe, tomba, o pescoço
  estala e ela guincha) e o **aviso** (com ela embaixo, o chão estufa, borbulha e brilha vermelho pulsando); a investida
  sai do Luto com um respingo. Embaixo do Luto ela não desenha;
- ✅ 5 (10/nov; o grito, a atordoada e o cambaleio refeitos no mesmo dia, ver abaixo): **os estados** (`estados.ts`; as
  durações em `numeros.ts`, ESTADO): o **grito**, **exausta** (curvada, ofegando, os braços pendurados: a janela para
  atirar), **atordoada**, o **cambaleio** (recua 0,85 m com a mão direita no rosto e a esquerda aberta), **enfraquecida** (de joelhos,
  quase apagada, balançando, as mãos apoiadas no chão, o Luto escorrendo: a hora da armadilha), **levanta** (sai dos
  joelhos de volta à guarda) e **capturada** (se debate presa nos raios). De joelhos, as canelas deitam no chão (as
  pernas dela são mais longas que as do laboratório: só abaixar o quadril a deixaria agachada).

**O refinamento (pedido em 10/nov: mais fluida, mais criativa e com expressões no rosto; em etapas):**
- ✅ A (10/nov): **o rosto e o corpo mais flexível** (`rosto.ts`). Oito expressões, que cada movimento escolhe e que
  trocam suave: **vazia** (procurando), **caça** (achou você: as sobrancelhas franzem, os olhos estreitam), **fúria** (o
  ataque: os olhos em fenda, em brasa), **grito** (arregalada), **dor** e **choro** (o meio das sobrancelhas sobe, os
  olhos se apertam), **exausta** (os olhos meio fechados) e **terror** (presa: arregalados ao máximo). Os olhos acendem
  vermelhos na caça e no ataque (como no laboratório) e apagam quando ela cansa ou chora. Ela não pisca (cega e morta: um
  rosto que nunca pisca incomoda mais); no lugar, tiques: um olho que se aperta sozinho por um instante, o queixo que
  torce de leve; no estalo da cabeça, os olhos faíscam. O queixo é um osso: no grito ele despenca além do natural (a
  boca por dentro é escura), e cada expressão garante a sua boca (escancarada no grito e no terror, entreaberta na dor,
  no choro e exausta). A coluna dobra em dois lugares (a cintura e o peito) e o pescoço divide a dobra com a
  cabeça: curvada, ela faz uma curva, não uma tábua; as clavículas sobem quando o braço passa da altura do ombro (a
  garra erguida). No Ver modelos, **Expressão** força uma delas (a câmera vai para o rosto e acompanha a cabeça);
- ✅ Os ajustes pedidos (10/nov, depois da A):
  - **o grito refeito:** ela puxa o ar (endireita, a cabeça vai para trás, os braços se juntam à frente) e se joga
    para a frente olhando você, os braços para trás quase deitados, os dedos abertos, tremendo. O rosto escurece, os
    olhos crescem e queimam vermelhos, a boca escancara, e da boca saem **ondas cinzas** em 2D (anéis que abrem
    andando para a frente: `efeitos.ts`, uma chamada de desenho). As ondas são só visuais: se o grito vai empurrar ou
    ferir o agente, decide-se na luta;
  - **a atordoada refeita (como no desenho):** o golpe joga o corpo dela para trás e ela despenca de joelhos; bate
    no chão, endireita e fica de joelhos, arqueada, com a cabeça caída para trás. O rosto fica para o céu, a boca
    aberta e o Luto transbordando dos olhos; os braços pendem soltos com as mãos quase no chão, os dedos mexendo
    sozinhos, e os soluços sacodem os ombros. No fim, a cabeça estala de volta para a frente, olhando você, e ela
    levanta;
  - **as mãos do cambaleio:** a palma direita no rosto, com os dedos abertos sobre os olhos (cravando de vez em
    quando); a esquerda abre torta na altura do ombro, para o lado, balançando para equilibrar;
  - **a fase 4** (a última barra): ela fica **preta**, com **partículas brancas** subindo dela e os **olhos maiores**
    (no Ver modelos: Fase → Fase 4). Os olhos e as partículas mantêm o vulto visível no escuro;
  - **o vestido ao agachar:** a dobra de ajoelhar contava como um passo para trás e as pernas jogavam a saia de trás
    para cima; agora só o passo de andar empurra o pano;
  - **o cabelo pende de verdade:** com a cabeça caída para trás ou para a frente, as mechas param de ficar espetadas
    (os limites delas eram estreitos). Com o rosto virado para o chão, as de trás caem sobre o rosto.
- B: **a parada, o andar e a porta mais vivos** (a cabeça que segue você aos trancos, a boca cantarolando, os dedos
  mexendo um de cada vez, arrepios, a cabeça entrando primeiro na porta);
- C: **os ataques com antecipação e acompanhamento**;
- D: **o Luto e o resto dos estados** (o mergulhar e o surgir mais fluidos, a exausta e a enfraquecida, puxada aos
  trancos na captura).

Com isso, todas as animações dela estão feitas. A inteligência e a luta (as fases, as quatro barras, o berço, o
tornado, quando ela abaixa na porta) vêm depois, em `src/game/enemies/mae/`.
- Fora: a cena de pegar o agente e a do armário (cenas do laboratório).

Números da tabela `T` em `buildDemo()` do laboratório (linha ~7674); a lógica das fases na linha ~9623.

| | Valor |
| --- | --- |
| Vida | 1400, em **4 barras** (20%, 25%, 25%, 30%) |
| Arena | 24 × 32 m, sem teto, chão coberto de Luto; o berço numa ilha seca um pouco para o fundo. Antes dela, um corredor longo e escuro com a porta do berçário no fim |
| Dano dela | garrada 25, investida 35, carga 35, tornado 20 |
| O berço | o objeto amaldiçoado, vida 200 |
| Kits | começa com 1; um móvel que cai pode soltar um (20%, um por vez) |

- **Fase 1:** rodeia → mergulha no Luto → aviso vermelho perto de você → investida → garradas → exausta (a janela de dano, ×1,3).
- **Fase 2:** + a finta (afunda num lugar e sai em outro).
- **Fase 3:** o tornado em volta do berço; as investidas saem da parede dele.
- **Fase 4:** o tornado vira chuva e o berço fica exposto; ele protege a última barra. Berço quebrado: o Luto seca e ela passa a correr (carga). Ela fica preta, soltando partículas brancas, com os olhos maiores (10/nov).
- Barra zerada: **atordoada 6 s**. A última zerada: **enfraquecida 12 s**, a hora da armadilha.
- Caiu: recomeça a partir da fase em que você caiu.

## Os sons (decididos em 10/nov)

- **Sintetizados na hora, como no laboratório** (Web Audio, sem arquivos; `src/audio/sintese.ts`): leves para baixar,
  e cada som varia um pouco a cada vez. Os únicos arquivos são as músicas.
- **Vêm de onde o personagem está** (`src/audio/espaco.ts`): a voz sai da boca dele, cai com a distância, e o eco do
  cômodo diminui de longe; o ouvido é a câmera. No celular, um som 3D mais leve. (Abafar atrás da parede entra com o jogo.)
- **O volume:** Geral × **Efeitos** (controle novo nas configurações), como a Música.
- O som liga no primeiro clique ou tecla (o navegador exige). O Ver modelos fica sem música, para ouvir as vozes.
- **A Mãe, em 3 etapas:**
  - ✅ 1 (10/nov): **a voz** (`enemies/mae/sons.ts`).
    - Patrulhando, ela **cantarola** a cantiga do laboratório (melodia original em lá menor), baixo, como de longe; nas
      pausas, puxa o ar pelo nariz.
    - **Caçando**, respira rasgado e guincha de tempos em tempos.
    - **Cada golpe e cada estado tem a sua voz, no momento do movimento:**
      - o rosnado do preparo e o grito da garra;
      - o guincho do bote, da carga e da finta;
      - o ar puxado e o guincho do surgir;
      - o **grito**: o ar puxado, depois o grito com o peito por baixo, e a voz caindo no fim. É o som mais alto dela;
      - o ofego da exausta;
      - a atordoada: o golpe, o baque, o lamento, os soluços junto com os trancos do corpo e o ar rouco quando a
        cabeça estala;
      - o gemido do cambaleio, o choro fraco da enfraquecida e o desespero da capturada.
    - Na **fase 4**, sussurros.
    - No Ver modelos, "Ela está: Patrulhando / Caçando" (caçando, o rosto também fica o da caça).
  - ✅ 2 (11/nov): **o corpo e o Luto** (`enemies/mae/ruidos.ts`; o quando de cada um em `sons.ts`). Os passos e o
    Luto vêm do chão onde ela está, não da boca.
    - **Os passos descalços:** um a cada meia volta do andar, pesados, com a sola estalando na tábua e a barra do
      vestido arrastando; às vezes a tábua range. Correndo, o assoalho inteiro sente.
    - **O pescoço estala** em vários tempos: de leve na parada, forte no surgir, no fim da atordoada e ao levantar.
    - **Os dedos** estalam no ar parada e quando as mãos rompem o Luto.
    - **A garra** rasga o ar.
    - **Os joelhos** batem no chão: na atordoada e na enfraquecida.
    - **Os pés derrapam:** no fim da carga e no pouso da investida.
    - **O Luto:**
      - o espirro (líquido grosso, bolhas estourando) quando ela sai e no mergulho;
      - o ronco do chão estufando e as bolhas cada vez mais rápidas no aviso;
      - as bolhas, as mãos agarrando o chão e o corpo saindo escorrendo, no surgir;
      - as lágrimas pingando, de joelhos.
  - 3: **a luta** (o berço, o tornado, a chuva, a música de batalha `batalha_mae.mp3`), quando a luta existir.

## O HUD (conceito C, aprovado)

- **Vida**: anel grande com o número em %, linha de ECG e o estado (bem / cuidado / perigo); o fôlego é um anel por dentro.
- **Kits**: um selo com a quantidade e um anel que mostra o tempo até o próximo kit (quando está com 0).
- **Arma**: um mostrador com a silhueta SVG da arma atual (pistola com anel de sino, escopeta de cano duplo, armadilha em disco com runas, kit),
  o anel da sobrecarga em volta e as outras armas como satélites; o nome da arma embaixo.
- **Roda de armas** (Tab): latão e âmbar, um arco por arma.
- **Legendas e avisos**: embaixo, grandes, empilham (a anterior sobe), ficam bastante tempo (máx(4,2 s, duração × 1,7)), no máximo 3.
- **Avisos de controle**: um por vez, no lugar em que você precisa, somem quando você faz a ação; se você já fez antes, não aparecem.
- Cores: âmbar `#e8b765`, latão `#c89b4a`, creme `#efe6d6`, perigo `#c2453a`. Fontes VT323 (títulos) e IBM Plex Mono (texto).
- Código de referência: `reference/lab/06-hud.js` (procure `dh-vg`, `dh-kb`, `dh-wg`, `WICON`, `hudGauges`).

## A demo Intro (o que já foi feito)

A primeira missão: a C.R.O.S. desce a uma instalação própria para recapturar o Glutão, que rompeu a contenção.
Elevador → eclusa → corredor 1 → **escritório** (cutscene na visão da Lara + tutorial de mirar e atirar) → corredor 2 →
**refeitório** (Lara persegue um Espectral, portas tomadas por ectoplasma, 3 ondas: 1, 2, 2+2) → corredor 3 →
**enfermaria** (kits, checkpoint) → **usina** (o Glutão; ao final, cutscene do rádio e relatório "INTRO").
Detalhes completos: `docs/design/intro.md`. Código: `reference/lab/08-intro.js`.

Com a regra de destruir ou capturar (10/nov), a Intro muda assim (vale sobre o `docs/design/intro.md`):
- as ondas do refeitório terminam com os Espectrais **destruídos**, não capturados;
- o **tutorial da armadilha passa para a usina**: o aviso aparece na primeira poça do Glutão;
- os Espectrais que o Glutão cospe são destruídos a tiro, e destruir antes que ele os devore continua impedindo a cura.

## Fica de fora (não trazer do laboratório)

- **Animações de morte dos fantasmas** e as cenas específicas feitas só para o laboratório. (O agente ganha uma queda
  sem violência, decidida em 10/nov: ver "A queda do agente".)
- Os outros fantasmas do laboratório (Sombra, Desconhecido, Garota, Mordomo, Observador, Reflexo, Amigo), a demo "O Bando",
  a demo da casa como fase, a fatia jogável: eram testes. (A Mãe, o berço e o tornado **ficam**.)
- Sistemas antigos de captura (círculo de velas, pé de cabra, orbe, chance de captura): substituídos pela poça + armadilha.
