---
name: cena
description: Dirige uma cena (cutscene) do jogo como cinema, do storyboard à revisão. Cobre a escolha dos planos, a câmera (lente, altura, movimento), a atuação dos atores, o ritmo do corte, a luz em cada plano e o som, e confere tudo no Ver cenas antes de mostrar. Use para escrever o storyboard de uma cena nova, transformar um storyboard em roteiro (src/chapters/<capítulo>/cenas/), ou quando o desenvolvedor disser que uma cena está sem vida, dura ou amadora.
argument-hint: "[a cena: storyboard N | roteiro N | revisar N]"
---

# Dirigir uma cena

O jeito de fazer as cenas está em `docs/cenas.md`: no motor, em dados, com legendas, e com as regras de direção de
18/nov (os 180°, o tamanho do plano acompanhando a tensão, o plano de reação, cada plano contando um ponto, a câmera
calma, ninguém cortando no meio da frase, o som antes da imagem). O formato é `src/game/cenas/tipos.ts`. O que a cena
conta vem de `docs/direcao-cap0.md` (ou da direção do capítulo dela). Leia os três antes de começar.

A meta é uma cena com vida: o espectador entende sem esforço, sente o que o personagem sente, e nada parece um boneco
posicionado diante de uma câmera parada.

## 1. O storyboard (no papel, aprovado antes de construir)

Uma tabela por cena em `docs/cenas.md`, como as das cenas 1 e 2. Para cada plano:
- **O ponto da história** que ele conta, em uma frase. Se não conta nada, sai.
- **O tamanho:** geral (situa), médio (corpo e gesto), por cima do ombro (conversa), fechado (cabeça ao peito: a fala que
  pesa), detalhe (um objeto: o insert).
- **O ângulo e o movimento,** com o motivo.
- **Quem faz o quê,** as falas, a expressão, os sons e a duração.

Comece pela **espinha emocional**: onde a cena começa, onde vira e onde termina. Os planos mais fechados ficam na virada.
Mostre ao desenvolvedor e espere a aprovação. As falas são rascunho, e ele reescreve.

## 2. A marcação (onde cada um fica)

- **Meça no mapa** (o cenário está no mapa do capítulo): onde cada ator para, a linha entre os dois que conversam e o lado
  em que a câmera fica (os 180°). Use posições reais do mapa, nunca de cabeça.
- **Distâncias de gente de verdade:** quem conversa fica a 1 ou 1,5 m; quem desconfia fica mais longe.
- **A câmera não pode entrar em parede, móvel ou ator.** Confira cada plano.

## 3. A câmera (o que cada escolha diz)

| Escolha | Valores no formato | O que diz |
| --- | --- | --- |
| **Lente** (`lente`, o campo de visão vertical) | 50 a 60: o geral. 35 a 45: o médio e o ombro. 20 a 30: o fechado e o detalhe | A lente fechada achata o fundo e deixa o rosto bonito; a aberta de perto deforma (só de propósito: o susto) |
| **Altura** | Os olhos: 1,55 a 1,65 m. Baixa: 0,3 a 1 m. Alta: acima de 2,2 m | Na altura dos olhos: neutro. De baixo: poder, ameaça. De cima: fraqueza, vigilância |
| **Movimento** (`para`, `olhaFim`, `curva`) | Aproximar devagar (1 a 3 % por segundo da distância); deslizar de lado para revelar | Aproximar: a tensão sobe. Afastar: solidão, fim. Todo movimento tem um motivo; sem motivo, a câmera fica parada |
| **Tremida** (`treme`) | Conversa: 0,3 a 0,6. Terror parado: 0 | Parada de tripé num lugar vazio inquieta; a mão leve deixa a conversa viva |
| **Composição** | O rosto num terço da tela, olhando para o lado com espaço; a testa sem cortar; um pouco de ar em cima | O espaço vazio para onde alguém olha cria expectativa |

A **regra dos 180°** vale sempre. Varie o tamanho dos planos (nunca dois cortes seguidos do mesmo tamanho e ângulo). O
plano mais fechado da cena fica para a fala mais importante.

## 4. A atuação (o que dá vida)

- **Ninguém fica parado como estátua:** o corpo respira (o agente já respira parado), o peso muda, a cabeça mexe pouco.
- **A ordem do olhar:** os olhos primeiro, depois a cabeça, depois o corpo. Virar tudo junto parece robô.
- **A reação vale mais que a fala:** mostre quem ouve antes de responder. Uma pausa antes da resposta diz mais que a
  resposta.
- **A expressão muda com a fala,** não só no começo do plano. As do formato: neutra, esforço, medo, dor, raiva, surpresa,
  preocupado, desconfiado, fechado, vencido.
- **A antecipação:** antes de uma ação (correr, abrir a porta) vem um instante de preparo (o olhar, o peso para trás).
- **As mãos fazem alguma coisa:** a pasta, a maçaneta, o rádio. Mão solta e reta denuncia o boneco.

## 5. O ritmo e o corte

- **Cada plano dura as falas mais um respiro** (`src/chapters/cap0/cenas/comum.ts`). Planos sem fala: de 3 a 7 s.
- **O som atravessa o corte:** a voz de quem fala continua por cima da reação do outro, e o som do próximo lugar chega
  antes da imagem.
- **Cortar na ação:** o gesto começa num plano e termina no outro.
- **No terror, segure o plano mais do que é confortável.** O susto vem depois do silêncio, não no meio do barulho.

## 6. A luz em cada plano

- **O rosto que importa tem luz:** uma fonte do cenário perto (a luminária, a lâmpada) desenhando um lado do rosto. O outro
  lado no escuro é bom; o rosto todo no preto, não.
- **Nada estourado:** pele e roupa clara perto de uma lâmpada viram branco (o Victor na cena 1). Afaste a luz, troque o
  ângulo ou peça um ajuste de luz para o plano.
- O momento de luz do plano (`luz`, como o `alarme`) muda a cor de tudo: confira os rostos nele.

## 7. Revisar antes de mostrar

1. Abra a cena no **Ver cenas** (Modo desenvolvedor → Ver cenas) e pule plano a plano. Tire uma foto de cada um no
   navegador do app.
2. Confira em cada foto: o rosto se lê? cruzou a linha dos 180°? a cabeça ficou cortada? a câmera está dentro de alguma
   coisa? um ator atravessa outro ou um móvel? a mão chega na maçaneta? alguma coisa estourou de luz?
3. Toque a cena inteira para sentir o ritmo: algum plano sobra ou falta?
4. Grave o vídeo (`await provas.gravar()` no console, com a cena aberta no Ver cenas: vai para `gravacoes/<id>.webm`) e
   diga ao desenvolvedor o que assistir e o que você não conseguiu conferir.

O desenvolvedor descreve o que viu e ouviu; você não julga o som pelo vídeo, só mede (o `CLAUDE.md` e a memória).

## O que o formato ainda não faz

A câmera não segue um ator sozinha (o movimento vai de um ponto a outro), não há desfoque de profundidade, e os gestos
e posturas são só os que existem (`ler`; `virar`, `fechar`, `bater`; a mão esquerda que alcança). Se o plano pedir algo
novo (sentar, apontar, uma animação de susto), **diga o que falta e pergunte antes de construir**: cada gesto novo é
trabalho de animação e entra na ordem de construir da cena.
