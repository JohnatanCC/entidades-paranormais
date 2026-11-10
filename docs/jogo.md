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
- **Fantasmas com formas erradas:** a Mãe alta demais, braços longos, cabelo em mechas finas, o véu preto, olhos brancos
  de cega, a cabeça virando sem suavizar; o Espectral translúcido, se desfazendo em cubos embaixo; o Glutão inchado,
  com a boca rasgando o tronco. Olhos que brilham no escuro.
- **Animação:** partes rígidas que giram nas juntas (como no laboratório), feita em código, ligada às ações do jogo.
  Os dedos fecham por poses (solta, punho, aberta, segurar, apontar) e o rosto tem expressões (neutra, esforço, medo,
  dor, raiva, surpresa), com piscar e o olhar passeando; as mechas do cabelo balançam com física simples (a gravidade
  e o tranco da cabeça, com limites para não entrar na cabeça) (`src/game/player/maos.ts`, `rosto.ts` e `cabelo.ts`).
- **Ver modelos** (Modo desenvolvedor): o personagem de perto, com animações, expressões, mãos, a arma na mão e a luz
  do jogo; e cada arma e objeto sozinho.
- **Modelos no Blockbench**: o desenvolvedor modela e pinta; o jogo lê o `.bbmodel` direto. Passo a passo em
  `docs/blockbench.md`. Os objetos do cenário e as armas também (decidido em 10/nov); o Editor de modelos saiu do plano.
- **Sem filtro PS1 por padrão:** a imagem limpa é a padrão; PS1 e suave ficam como opção nas configurações.

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

Os modelos (10/nov) estão em `modelos/armas/` e o agente já segura cada uma (`src/game/player/arma.ts`): a pistola
e a escopeta na guarda, a arma apontada para o chão na frente, numa mão só; a armadilha pendurada pela alça. No Testar,
Q troca (pistola, escopeta, armadilha, mão vazia). Mirar, atirar, o coice, a outra mão na escopeta e jogar a armadilha
vêm na etapa das armas. Quando ela chegar, 1/2/3 deixam de mostrar as expressões no Testar (isso fica no Ver modelos).

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
- **Fase 4:** o tornado vira chuva e o berço fica exposto; ele protege a última barra. Berço quebrado: o Luto seca e ela passa a correr (carga).
- Barra zerada: **atordoada 6 s**. A última zerada: **enfraquecida 12 s**, a hora da armadilha.
- Caiu: recomeça a partir da fase em que você caiu.

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

- **Animações de morte** de qualquer tipo, e as cenas específicas feitas só para o laboratório.
- Os outros fantasmas do laboratório (Sombra, Desconhecido, Garota, Mordomo, Observador, Reflexo, Amigo), a demo "O Bando",
  a demo da casa como fase, a fatia jogável: eram testes. (A Mãe, o berço e o tornado **ficam**.)
- Sistemas antigos de captura (círculo de velas, pé de cabra, orbe, chance de captura): substituídos pela poça + armadilha.
