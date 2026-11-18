# As músicas do jogo

As músicas ficam em `public/musica/<nome>` e são chamadas por nome (`src/audio/musica.ts`). Aqui fica o que cada uma
precisa ter, para compor (ou gerar no Suno) de forma consistente.

| Música | Onde toca | Situação |
| --- | --- | --- |
| `menu.mp3` | O menu e o criador de mapas | Feita; **a trocar** pelos menus de cada capítulo (abaixo) |
| `batalha.mp3` | As hordas da Demo · Intro do submundo | Feita (do laboratório) |
| `devorador.mp3` | O Devora almas | Feita |
| A luta da Mãe | O berçário, o chefe do capítulo 1 | Feita pelo desenvolvedor (17/nov), falta entrar no jogo |
| `perseguicao-mae.mp3` | **A perseguição da Mãe**: quando ela caça o agente (abaixo) | Feita pelo desenvolvedor (18/nov); toca quando a etapa C das entidades chegar |
| **O trailer** | O vídeo da página do itch (e depois do Steam), fora do jogo (abaixo) | A fazer |
| `perseguicao-gralhas.mp3` | **A perseguição das Gralhas**: enquanto alguma Gralha caça o agente (`src/game/entidades`) | Feita pelo desenvolvedor (18/nov); tocando |
| `tensao.mp3` | O ambiente de tensão (a do laboratório) | No projeto (18/nov), ainda sem lugar para tocar |
| `capitulo-0.mp3`, `capitulo-1.mp3`, `capitulo-2.mp3` | Os menus de cada capítulo (abaixo) | Feitas pelo desenvolvedor (18/nov), ainda sem tocar: o menu por capítulo vem depois |
| **O menu do capítulo 2** | O menu, depois que o jogador chega no capítulo 2 (abaixo) | A fazer |
| **A luta da Sombra** | Capítulo 2: o chefe (abaixo) | A fazer |

Antes de publicar (`docs/lancamento.md`, fase C): conferir a licença de cada música, inclusive as geradas por IA (o plano
do gerador precisa permitir uso comercial).

## A perseguição da Mãe

Na mansão a Mãe é imortal e persegue o agente (como o Mr. X do Resident Evil 2). Esta música avisa que ela está perto:
o jogador ouve antes de ver.

**A ideia:** ela usa **a cantiga de ninar da Mãe**, a mesma que ela cantarola na patrulha (`src/game/enemies/mae/sons.ts`,
em lá menor). O jogador ouve a cantiga ao longe e, quando ela o acha, a mesma melodia vira perseguição.
A melodia, em duas frases de 5 notas (a última de cada frase é longa):

```
Mi  Ré  Dó  Ré  Si——      Dó  Si  Lá  Sol#  Lá——
```

### Como tem que ser

**Mais intensa** (refeita em 17/nov, a pedido): mais rápida, mais pesada e sem pausa para respirar. Continua sendo uma
**marcha** que não para (a Mãe é uma só e não desiste), diferente do enxame quebrado das Gralhas.

- **Lá menor, ~150 BPM.** O mesmo tom da cantiga.
- **Cordas:** violoncelos e contrabaixos num ostinato em **semicolcheias**, martelado (o motor); violinos com escalas
  rápidas subindo e descendo e tremolo sul ponticello (o som áspero); glissandos subindo; batidas col legno como passos.
- **Metais graves:** trompas e trombones em **golpes curtos e dissonantes** nos tempos fortes, e crescendos curtos que
  incham e cortam. Golpes, não melodia: a melodia grande fica para a luta dela no berçário.
- **Piano:** clusters graves martelados; a cantiga no agudo, na caixinha de música desafinada **e dobrada pelos violinos
  em uníssono, forte**, nas partes da canção de ninar.
- **Percussão pesada:** tímpanos e tambores grandes (taiko) marcando a marcha, e o coração acelerado por baixo. Nada de
  bateria, sintetizador ou guitarra.
- **Sem voz** (17/nov): só os instrumentos. Os passos, a respiração e o grito da Mãe no jogo aparecem por cima.
- **A mesma energia o tempo todo**, sem final: ela toca em laço. **Cuidado:** ela não pode ficar maior do que a música da
  luta do berçário (compare as duas lado a lado antes de escolher).

### No jogo (quando chegar a etapa da Mãe perseguidora)

| O estado dela | A música |
| --- | --- |
| Patrulhando, longe | Nada: só a cantiga dela ao longe e o ambiente da casa |
| Perto, procurando | Entra baixinho (ou só a camada da tensão, se houver camadas) |
| Te viu, caçando | O golpe curto (abaixo), e a música inteira |
| Atordoada | Baixa de novo |
| Te perdeu | Some em 6 a 10 s (nunca corta de uma vez) |

Na caça ela não canta (respira e grita), para a voz dela não brigar com a da música.

### No Suno

**Estilo** (o campo "Style of Music"):

```
intense orchestral horror chase, 150 bpm, A minor, relentless driving sixteenth-note cello and double bass ostinato, fast violin runs and tremolo sul ponticello, rising string glissandos, col legno hits, aggressive dissonant low brass stabs and short swells, hammering low piano clusters, pounding timpani and taiko drums, racing heartbeat, detuned music box and unison violins playing a lullaby melody, victorian haunted mansion, urgent, terrifying, constant high intensity, instrumental, cinematic game soundtrack
```

Ligue a opção **Instrumental** do Suno.

**Excluir estilos** (se o seu plano tiver o campo "Exclude"):

```
vocals, voice, choir, drum kit, electronic, synth, guitar, rock, happy, major key, calm, ambient, slow, fade out
```

**A estrutura** (no modo Custom, o campo "Lyrics" aceita só as marcações entre colchetes, sem nada cantado; se o
Instrumental não deixar usar o campo, gere com a estrutura e as marcações e deixe o "vocals" no Excluir):

```
[Intro: very short, the ostinato and the drums hit at full speed, no build-up]

[Chase: driving sixteenth-note cello ostinato, pounding timpani and taiko, dissonant brass stabs, hammering piano clusters]

[Lullaby: detuned music box and unison violins play the lullaby loud, the ostinato and the drums never stop]

[Chase: full intensity, fast violin runs, rising glissandos, brass swells, col legno hits]

[Surge: the ostinato alone for two bars, racing heartbeat, then everything crashes back in harder]

[Lullaby: distorted, the lullaby in high screeching violins and piano, brass stabs underneath]

[Chase: driving sixteenth-note cello ostinato, pounding timpani and taiko, dissonant brass stabs, hammering piano clusters]
```

### Depois de gerar

1. **Gere várias** e escolha a que tem o ostinato mais firme e a cantiga mais reconhecível.
2. **O laço:** a música começa e termina com a mesma parte (a perseguição). O jogo toca do começo da primeira
   perseguição até o começo da última, e volta. Assim a emenda não aparece, e o começo e o fim do Suno (que às vezes
   esvaziam) ficam de fora. Me diga onde ficam essas duas partes, em segundos (ou me mande o arquivo e eu acho os
   pontos).
3. **O formato:** WAV, se der. Em MP3 tudo bem: com os pontos do laço em segundos, o jogo pula certo.
4. **As camadas (opcional):** se o seu plano do Suno separar as partes ("stems"), guarde as cordas graves separadas do
   resto: viram a camada da tensão (ela perto, sem ter te visto).
5. **O golpe (opcional, mas faz muita diferença):** um acorde forte e curto, de 2 a 3 segundos, para o instante em que
   ela te vê. Dá para gerar à parte com a letra `[Intro: one massive orchestral string and piano hit, then silence]` e
   cortar só o começo.
6. **O volume:** deixe mais baixa do que parece certo. O jogo já toca as músicas a 60% do volume das configurações.

## O trailer

A música do vídeo da página (`docs/lancamento.md`, fase D). Não toca no jogo. Instrumental, como a perseguição, e da
mesma família: **lá menor, as cordas graves, o piano e a cantiga da Mãe na caixinha de música**. Quem ouvir o trailer e
depois jogar reconhece o som da casa.

### A duração e a forma

**De 75 a 90 segundos.** Trailer de jogo indie bom é curto, e no itch e no Steam muita gente vê só o começo: a gameplay
aparece logo, e a música serve aos cortes. Três atos, como trailer de filme de terror:

| Tempo | O ato | A música | O vídeo (sugestão) |
| --- | --- | --- | --- |
| 0:00–0:20 | **O silêncio** | Só a caixinha de música tocando a cantiga, desafinada, com o ar da casa; um piano grave de vez em quando | A casa por fora à noite, a ficha do caso da C.R.O.S., os corredores vazios |
| 0:20–0:50 | **A subida** | Entra o ostinato dos violoncelos, devagar e depois mais rápido; os violinos ásperos; golpes graves de piano e cordas a cada corte; a subida (riser) cresce | O Matheus arremessado do armário, o rádio, a lanterna, o vulto na janela, a Mãe aparecendo |
| 0:50–0:52 | **O corte** | **Silêncio total** (1 a 2 s), e um golpe enorme | O grito da Mãe (o som do jogo, não da música) |
| 0:52–1:15 | **A perseguição** | Tudo junto, no máximo: as cordas correndo, o piano martelando, o tímpano; a cantiga no agudo por cima, distorcida | A fuga, os tiros, a armadilha, o berçário, o tornado |
| 1:15–1:30 | **O fim** | Corta de uma vez; depois, uma frase da cantiga na caixinha, sozinha, e um último acorde grave | O nome do jogo; "itch.io", a data |

O silêncio é o que dá medo: os cortes secos e as pausas pesam mais do que a música alta o tempo todo.

### No Suno

O Suno não acerta os segundos de cada corte. O caminho é o contrário: **gere a música, escolha a melhor e monte o vídeo
em cima dela** (os cortes nos golpes). O silêncio do meio e o fim seco ficam mais limpos se forem feitos no editor de
vídeo (cortar o áudio), em vez de esperar que o Suno faça.

**Estilo** (com a opção **Instrumental**):

```
cinematic horror trailer, A minor, starts with a lone detuned music box lullaby and sparse low piano, slowly building cello ostinato, violins tremolo sul ponticello, deep string and piano impact hits, rising tension risers, sudden silence, then full orchestral chase with pounding timpani and frantic strings, music box lullaby returning at the end, victorian haunted mansion, dark, instrumental, epic but restrained
```

**Excluir estilos:**

```
vocals, voice, choir, electronic, synth, dubstep, guitar, rock, drum kit, happy, major key
```

**A estrutura:**

```
[Intro: lone detuned music box plays the lullaby, room tone, a single low piano note]

[Build: cello ostinato enters slowly, violins sul ponticello, deep impact hits, accelerating]

[Riser: rising strings and tension, louder and louder]

[Silence]

[Impact: one massive orchestral string and piano hit]

[Climax: full orchestral chase, frantic strings, pounding timpani, piano clusters, the lullaby high above, distorted]

[Outro: sudden stop, the music box plays one phrase of the lullaby alone, a final deep low note]
```

Gere várias e escolha pela **subida** (que cresça sem pressa) e pelo **clímax** (que seja forte sem virar música de ação
genérica). Se uma versão tiver o melhor começo e outra o melhor clímax, dá para juntar as duas no editor, já que são do
mesmo tom.

## O menu: um por capítulo

Decidido em 17/nov: **o menu muda a cada capítulo** (como no Poppy Playtime). Ele mostra o capítulo mais adiantado a
que o jogador chegou, e cada capítulo tem a música do seu menu. Toda música de menu precisa aguentar repetir sem
cansar: o jogador fica parado ali, mexendo nas configurações. Por isso nada de golpes fortes nem de subidas, a mesma
energia do começo ao fim (o laço) e o volume baixo. O criador de mapas usa a do capítulo 0.

| Capítulo | O clima | A música |
| --- | --- | --- |
| **0**: a instalação da C.R.O.S., até entrar no portal | O mistério da agência: fria e controlada, menos aterrorizante | Abaixo |
| **1**: a mansão assombrada, a Mãe | O terror inquietante: a casa viva | Abaixo |

Nenhuma é triste ou melancólica (o desenvolvedor não quer esse clima).

### O menu do capítulo 0: a instalação da C.R.O.S.

A mesma família do menu do capítulo 1 (o desenvolvedor aprovou o estilo em 17/nov), mas **menos aterrorizante**: é a
casa da agência, não a casa assombrada. Fria, controlada e misteriosa, com algo preso lá embaixo. O que muda do
capítulo 1:

| | Capítulo 0 (a instalação) | Capítulo 1 (a mansão) |
| --- | --- | --- |
| O tom | Ré menor, ~90 BPM, com pulso firme | Lá menor, ~80 BPM, parado |
| As cordas | Ostinato baixo e regular, harmônicos frios | Clusters dissonantes, col legno rangendo |
| O piano | Notas graves e espaçadas, limpas | Drones graves |
| A textura | O zumbido das máquinas, um bipe de monitor, o chiado do rádio, um alarme abafado lá longe | Vento, metal arranhando |
| O que lembra a ameaça | Um ronco grave e distante, de vez em quando: as entidades contidas | A cantiga da Mãe na caixinha de música |

Sem a caixinha de música: ela é da Mãe e entra no capítulo 1.

**Estilo** (com a opção **Instrumental**):

```
dark cinematic ambient theme, D minor, 90 bpm, secret paranormal research facility, steady low string ostinato, cold string harmonics, sparse clean low piano notes, subtle analog synth pad, humming machinery, soft monitor beeps, faint radio static, distant muffled alarm, occasional deep distant growl, mysterious, controlled tension, not scary, seamless loop, instrumental, video game main menu
```

### O menu do capítulo 1: o terror inquietante

Estranha e desconfortável, sem tristeza: a casa parece viva. **Em lá menor e com a cantiga da Mãe** (as notas na seção
da perseguição), na caixinha de música torta, para ligar o menu à perseguição. A diferença entre as duas: o menu é
devagar e parado (a casa esperando); a perseguição é rápida (ela vindo).

**Estilo** (com a opção **Instrumental**):

```
unsettling dark ambient horror theme, A minor, 80 bpm, dissonant string clusters, creaking col legno, twisted detuned music box playing a slow lullaby, low piano drones, distant metallic scrapes, whispers of wind, eerie and menacing, haunted victorian mansion, seamless loop, instrumental, video game main menu
```

### Para os dois

**Excluir estilos:**

```
vocals, voice, choir, sad, melancholic, sentimental, happy, major key, epic, impact hits, risers, fade out
```

No capítulo 0, acrescente `music box` ao excluir (a caixinha é da Mãe).

**A estrutura:**

```
[Intro: short, the main pulse starts right away]

[Main Theme: the main melody, full energy]

[Variation: the melody on another instrument, same energy]

[Breakdown: only the pulse and the textures, tension]

[Main Theme: the main melody, full energy]
```

O laço: a música termina no tema principal, igual ao primeiro. O jogo toca do começo do primeiro tema até o começo do
último e volta.

## Capítulo 2: a Sombra

As três músicas do capítulo 2 (`docs/cap2-sombra.md`). O capítulo é **mais escuro e mais focado no terror** do que o da
Mãe, e as músicas acompanham.

**O que as liga:** **mi menor** (cada capítulo tem o seu tom, e o mi é vizinho do lá menor do capítulo 1) e a **assinatura
da Sombra**, como a caixinha de música é a da Mãe: **o chiado de um rádio antigo** (o rádio de galena ao lado da gaiola),
**cordas arranhando que lembram grasnados** (o arco atrás do cavalete, guinchos curtos), **pano batendo** como percussão e
**asas batendo**. Sem a caixinha de música: ela é da Mãe.

**A diferença para a Mãe:** a Mãe é uma só, lenta e que não para; a música dela marcha. As Gralhas são muitas, rápidas,
observam e atacam de repente; a música delas é **um enxame**: ritmo quebrado, rajadas e paradas.

### A perseguição das Gralhas

Toca quando elas atacam. Duas camadas, se der: **observando** (só a tensão, elas olhando de longe) e **atacando**
(o enxame inteiro).

- **Mi menor, ~150 BPM, com o ritmo quebrado** (acentos fora do lugar, compassos ímpares): elas são imprevisíveis.
- **Cordas em enxame:** muitas notas rápidas e desencontradas (aleatórias), trêmulos, guinchos atrás do cavalete.
- **Piano preparado** (o som abafado e metálico, de pancada) em rajadas curtas.
- **Percussão de asas e pano:** batidas secas e rápidas, sem bateria.
- **O rádio:** o chiado entra e sai, como se alguém girasse o sintonizador.
- **Paradas de repente** (um ou dois tempos de silêncio) e o enxame volta: elas param para observar e atacam de novo.

**Estilo** (com a opção **Instrumental**):

```
orchestral horror chase, E minor, 150 bpm, irregular broken rhythm, swarming aleatoric strings, frantic tremolo, string screeches behind the bridge like crow caws, prepared piano bursts, dry fluttering wings and flapping cloth percussion, old radio static tuning in and out, sudden short silences then the swarm returns, dark, aggressive, seamless loop, instrumental, video game soundtrack
```

**Estrutura:**

```
[Intro: short, radio static and a few string screeches, the swarm starts right away]

[Swarm: frantic swarming strings, prepared piano bursts, fluttering wing percussion, irregular rhythm]

[Stalk: only a low string drone, scattered screeches, radio static, waiting]

[Swarm: full intensity, string screeches like crow caws, sudden stops and restarts]

[Stalk: only a low string drone, scattered screeches, radio static, waiting]

[Swarm: frantic swarming strings, prepared piano bursts, fluttering wing percussion, irregular rhythm]
```

O laço: do começo do primeiro "Swarm" ao começo do último. Se o Suno separar as partes, o "Stalk" vira a camada de
observando.

### O menu do capítulo 2

O mais escuro dos menus: **quase silêncio**. A casa no escuro, e algo olhando.

- **Mi menor, ~70 BPM, quase sem pulso.**
- **Um drone grave** de cordas que não para; **notas soltas de piano**, graves e espaçadas.
- **O rádio** chiando baixo, mudando de estação sozinho; **um grasnado distante** de vez em quando; **asas** passando.
- Sem golpes nem subidas, como os outros menus.

**Estilo** (com a opção **Instrumental**):

```
dark ambient horror theme, E minor, 70 bpm, almost silent, deep sustained low string drone, sparse distant low piano notes, old radio static drifting between stations, faint distant crow caws, soft fluttering wings passing by, oppressive darkness, something watching, haunted mansion basement, seamless loop, instrumental, video game main menu
```

**Estrutura:**

```
[Intro: radio static, the low drone starts right away]

[Main Theme: low drone, sparse piano notes, distant caws]

[Variation: the drone deepens, the radio drifts between stations, wings passing by]

[Breakdown: almost silence, only the drone and the static]

[Main Theme: low drone, sparse piano notes, distant caws]
```

### A luta da Sombra

As Gralhas se juntam na Sombra. A mais forte do capítulo: o enxame da perseguição virado **um corpo só**.

- **Mi menor, ~140 BPM, pesada:** o ritmo agora é firme (elas viraram uma), com o enxame ainda por cima.
- **Metais graves** e **cordas graves** com a melodia do chefe (curta, ameaçadora, de poucas notas).
- **Percussão grave e pesada** (tímpanos, tambores grandes), **asas e pano** por cima.
- **As cordas em enxame** e os **guinchos** da perseguição, para ligar uma à outra.
- **O rádio** distorcido, gritando, nas partes mais fortes.

**Estilo** (com a opção **Instrumental**):

```
dark orchestral horror boss battle, E minor, 140 bpm, heavy driving rhythm, menacing low brass and low strings melody, pounding timpani and large war drums, swarming aleatoric strings on top, string screeches like crow caws, fluttering wings and flapping cloth percussion, distorted old radio static screaming, relentless, terrifying, seamless loop, instrumental, video game soundtrack
```

**Estrutura:**

```
[Intro: short, radio static screams, the swarm gathers, one massive low hit]

[Boss Theme: menacing low brass melody, pounding drums, swarming strings on top]

[Swarm: the melody breaks apart into frantic swarming strings and crow-like screeches]

[Boss Theme: full intensity, brass and strings together, distorted radio static]

[Bridge: only the pounding drums and the low drone, the swarm circling]

[Boss Theme: menacing low brass melody, pounding drums, swarming strings on top]
```

O laço: do começo do primeiro "Boss Theme" ao começo do último.

**Excluir estilos** (as três):

```
vocals, voice, choir, sad, melancholic, sentimental, happy, major key, music box, drum kit, electronic, synth, guitar, fade out
```
