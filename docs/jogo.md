# O jogo: o que já está decidido

Entidades Paranormais é um jogo de **ação com terror em terceira pessoa** (inspirado no Ghosthunter de PS2).
Você é **Matheus Moura**, agente da **C.R.O.S.** (a organização que captura entidades). Você enfraquece os fantasmas
a tiro e os prende com a armadilha. Visual retrô de PS1 por padrão (o filtro limpo é opcional).

## A direção (9/nov/2026)

- **Inspirações:** Ghosthunter (PS2) no tom e na captura; Resident Evil 4 na gameplay (câmera sobre o ombro, mirar parado ou devagar).
- **A demo é o capítulo 1 inteiro**, jogável do começo ao chefe. A história ainda vai crescer.
- **Capítulos:** a cada chefe derrotado a mansão muda, porque ela se alimenta dos fantasmas. Na prática, cada capítulo é um mapa.
- **Mais tarde:** versão para celular, e talvez vender ou publicar de graça.
- **A base é o laboratório v130** (`reference/laboratorio.html`, o mesmo de https://claude.ai/artifact/BDUaLP6DmvqwsBXhkdJdYw).

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

**Em aberto (decidir antes de montar o capítulo):**
- Destruir a foto e a pelúcia muda a Mãe (menos vida, outro comportamento) ou só libera o caminho?
- "Lugares variados": cada objeto tem um lugar fixo, ou sorteia entre alguns lugares a cada partida?
- O que faz barulho (correr, tiro, porta, assoalho que range) e quanto ela atordoada dura.

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

## A captura (regra nova, vale em toda luta)

- Com a vida zerada, o fantasma comum **se desfaz numa poça de ectoplasma** com um anel que mostra o tempo.
- Em cima da poça aparece o **ícone da armadilha** (ensina o que fazer).
- A armadilha jogada na poça captura; ela puxa **todas as poças num raio de 2,8 m**.
- Se o tempo acaba (**10 s**), ele volta com metade da vida.
- Não existe animação de morte: o fantasma vira poça e some na captura.

## Os fantasmas da demo

| | Espectral | Glutão (chefe da Intro) |
| --- | --- | --- |
| Vida | 60 | 400 (escala 1,6×) |
| Ataque | mordida 30 (22 na Intro), bote a 3,4 m/s | pancada 35, investida 30, cospe Espectrais (primeiro aos 10 s, depois a cada 14 s) |
| Especial | só um ataca por vez (um "token" de ataque) | só o **núcleo** leva dano cheio; com pouca vida **devora** um Espectral e cura **10% da vida máxima** (espera 20 s entre devoradas); Lara e Nicolas aparecem encolhidos dentro da barriga |
| Captura | poça, 10 s | poça; capturado, solta Lara e Nicolas no chão |

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
Elevador → eclusa → corredor 1 → **escritório** (cutscene na visão da Lara + tutorial da armadilha) → corredor 2 →
**refeitório** (Lara persegue um Espectral, portas tomadas por ectoplasma, 3 ondas: 1, 2, 2+2) → corredor 3 →
**enfermaria** (kits, checkpoint) → **usina** (o Glutão; ao final, cutscene do rádio e relatório "INTRO").
Detalhes completos: `docs/design/intro.md`. Código: `reference/lab/08-intro.js`.

## Fica de fora (não trazer do laboratório)

- **Animações de morte** de qualquer tipo, e as cenas específicas feitas só para o laboratório.
- Os outros fantasmas do laboratório (Sombra, Desconhecido, Garota, Mordomo, Observador, Reflexo, Amigo), a demo "O Bando",
  a demo da casa como fase, a fatia jogável: eram testes. (A Mãe, o berço e o tornado **ficam**.)
- Sistemas antigos de captura (círculo de velas, pé de cabra, orbe, chance de captura): substituídos pela poça + armadilha.
