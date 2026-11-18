# As cenas (cutscenes)

Decidido em 18/nov. O capítulo 0 conta a história com **cenas curtas, feitas dentro do próprio jogo**. Aqui fica como
elas são feitas e o **storyboard** de cada uma (o plano a plano), aprovado antes de construir.

> O documento de design (`docs/design/historia.md`) tinha deixado cenas animadas, narração e vozes de fora, para caber
> no projeto. As cenas voltam (18/nov), mas do jeito barato: sem vídeo e sem voz gravada.

## Como as cenas são feitas

- **No motor, não em vídeo.** A cena roda no jogo, com os modelos, as animações, a luz e os sons que já existem. Vídeo
  pesaria no download do itch, não daria para traduzir e ficaria com outra cara.
- **Sem voz gravada.** As falas são **legendas** embaixo da tela. Quem fala abre e fecha a boca no ritmo da fala (a peça
  da boca já existe no rosto dos personagens). Traduzir para o inglês vira trocar o texto.
- **Em dados.** Cada cena é um roteiro: uma lista de **planos**, e cada plano diz quanto dura, onde a câmera começa e
  termina e para onde olha, quem está em cena e o que faz (andar até um ponto, uma animação, uma expressão, olhar para
  alguém, falar), as falas, os sons e como passa para o próximo (corte seco ou escurecendo). Um tocador só roda todas as
  cenas.
- **Com cara de cinema:** faixas pretas em cima e embaixo, o HUD some, a câmera tem uma tremida leve de mão.
- **Dá para pular.** Segurando uma tecla (no celular, um toque comprido); a legenda também passa com um clique.
- **O cenário fica no mapa do capítulo** (decidido em 18/nov): cada capítulo tem um mapa só, todo pronto, e as cenas
  usam pedaços dele. O que só aparece em cena (o corredor e o escritório do Victor) fica no mesmo mapa, **solto**, longe
  da parte jogável e sem ligação com ela. A câmera troca de lugar por corte, então cada pedaço de cena é pequeno: uma
  parede, um canto, um corredor curto. Leve para o celular.

### Gravar uma cena em vídeo (18/nov)

Para mostrar uma cena a alguém sem abrir o jogo (os candidatos à dublagem, por exemplo): no `npm run dev`, abra o
**Ver cenas**, escolha a cena, clique uma vez na página (para o som ligar) e rode no console do navegador (F12):

```js
await provas.gravar()
```

A cena toca do começo ao fim e o vídeo sai em `gravacoes/<id da cena>.webm` (1280 × 720; a pasta fica fora do git). Vão
no vídeo a imagem, as faixas de cinema, as legendas, o título e os sons. **A voz provisória não entra:** é a voz do
navegador, que não deixa gravar; enquanto grava, ela fica calada. Com `provas.gravar({ mudo: true })` o som também não
sai nas caixas enquanto grava. Para um vídeo com as vozes provisórias, grave a tela (no Windows, **Win + Alt + R** com a
janela do navegador na frente). O código é `src/dev/gravar.ts`.

### O jeito de trabalhar (cada cena)

1. **O storyboard** (este documento): o plano a plano, as falas e o tempo. Você aprova ou reescreve.
2. **O cenário:** você monta no criador de mapas; eu faço as peças que faltarem.
3. **O roteiro em dados:** eu escrevo a cena a partir do storyboard.
4. **Você assiste no "Ver cenas"** (uma tela nova no Modo desenvolvedor: tocar, pausar, arrastar a linha do tempo, pular
   para um plano) e aponta o que mudar.
5. **O ajuste**, até ficar bom.

## A ordem das cenas (mudou em 18/nov)

Primeiro **o escritório do Victor** (cena 1), que termina no alarme e no Matheus correndo. Depois **o alarme na
instalação** (cena 2, que era a abertura do jogo): o andar de contenção vazio, o ectoplasma na porta e, no fim, a Lara
e o Nicolas esperando o Matheus na frente do elevador. É o gancho para **a parte 3**: o elevador chega e os três se
encontram.

## Como as cenas são dirigidas (18/nov)

O desenvolvedor pediu para rever a cena com cara mais profissional, estudando como as cutscenes de jogo são feitas. O
que vale para todas as cenas:

- **A regra dos 180°:** a câmera fica sempre do mesmo lado da linha entre os dois que conversam. Assim cada um fica
  sempre do mesmo lado da tela, e o plano e o contraplano batem.
- **Nada de "concurso de encarar":** a conversa não é só o rosto de um e o do outro. O tamanho do plano acompanha a
  tensão: o geral para situar, por cima do ombro na conversa, fechado no rosto quando a fala pesa, e de novo aberto
  quando a tensão solta.
- **O plano de reação:** a emoção está em quem ouve. Quem ouve aparece antes de responder, às vezes com a voz do outro
  por cima.
- **Cada plano conta um ponto da história:** os inserts mostram o que a fala não diz (a pasta com as missões, a foto
  virada do antigo parceiro).
- **A câmera é calma:** parada ou com uma aproximação lenta; nada de câmera agitada.
- **O plano de rosto pega da cabeça ao peito** (18/nov, a pedido: o close só no rosto ficou fechado demais); o mais
  fechado, das falas que apertam, chega um pouco mais perto, sem cortar o queixo nem a testa.
- **Ninguém corta no meio de uma frase:** cada plano dura o que as falas dele levam, mais um respiro
  (`src/chapters/cap0/cenas/comum.ts`). O alarme, a corrida e o corte esperam a fala acabar.
- **O som chega antes da imagem** quando ajuda (os passos no escuro, antes das botas aparecerem).

## Cena 1: o escritório do Victor

**Duração:** ~2 min 20 s. **Em cena:** o Matheus e o Victor, chefe do departamento dele.
**O que conta:** o Matheus anda falhando, é fechado, carrega alguma coisa do antigo parceiro, e vai ganhar uma equipe
fixa contra a vontade. E alguma coisa está acontecendo no andar de contenção.
**Por que economiza:** mostra pedaços da instalação que o jogador não explora (o corredor, o escritório).
**As falas são um rascunho:** reescreva à vontade.

### O corredor e a porta

| Plano | O que se vê | Câmera |
| --- | --- | --- |
| 1.0 | Preto. Só os passos e o zumbido das lâmpadas | (sem câmera) |
| 1.1 | As botas do Matheus andando no corredor | De lado, rente ao chão, acompanhando |
| 1.2 | A câmera sobe pelo corpo enquanto ele anda, até o rosto sério | Sobe devagar, acompanhando |
| 1.3 | Ele chega à porta, para, bate, e **a mão vai à maçaneta**: a porta abre | De trás dele, o corredor inteiro na frente |

### A conversa (de pé)

| Plano | Quem | Fala ou ação | Câmera |
| --- | --- | --- | --- |
| 1.4 | Victor | (levanta os olhos da pasta) **"Entre, Moura."** O Matheus entra; a porta fecha sozinha | O geral: o Victor de costas na frente, a porta ao fundo |
| 1.5 | Victor | **"Vou ser direto."** O Matheus vai até perto da mesa, ao lado da cadeira de visitante (18/nov: era "Sente."; a conversa fica de pé) | De lado, os dois na imagem |
| 1.6 | Victor | **"Três missões este mês."** | Insert: a pasta dele na mesa |
| 1.7 | Victor | **"Três capturas que deram errado."** | Por cima do ombro do Matheus |
| 1.8 | Victor | **"Isso não é você. O que está acontecendo?"** | Fechado no Victor |
| 1.9 | Matheus | (segura um instante) **"Nada. Muita coisa ao mesmo tempo, só isso."** Desvia os olhos | Fechado no Matheus |
| 1.10 | Victor | **"É por causa do seu antigo parceiro?"** | Insert: a foto virada na mesa |
| 1.11 | Matheus | **"Não tem nada a ver com isso."** (pausa) **"Eu me distraí. Não vai se repetir."** | Bem fechado no Matheus; a cara fecha |
| 1.12 | Victor | **"Vou mudar a dinâmica. Chega de te mandar com um time diferente a cada missão."** | Por cima do ombro do Matheus |
| 1.13 | Victor | **"A partir de hoje você tem uma equipe fixa. É uma chance de criar laços."** | Fechado no Victor, aproximando |
| 1.14 | Victor, depois Matheus | (a voz do Victor por cima) **"De não carregar tudo sozinho."** Matheus: **"Não precisa. Eu sempre me virei bem sozinho."** | Fechado no Matheus (a reação) |
| 1.15 | Victor | **"Sempre?"** (pausa) **"Mesmo depois deste mês?"** | Bem fechado no Victor |
| 1.16 | Matheus | (silêncio comprido, os olhos de lado) **"...Tudo bem."** | Bem fechado no Matheus |
| 1.17 | Victor | **"Ótimo. Já tenho uma missão para vocês. Logo você conhece a sua equipe."** | De lado, os dois na imagem |
| 1.18 | Matheus | Vai até a porta, **a mão na maçaneta**, a porta abre | O mesmo geral do 1.4 |
| 1.19 | Victor | O Matheus sai. Sozinho, o Victor olha a foto virada | (a mesma câmera, sem corte) |

### O alarme

| Plano | O que se vê | Câmera | Som |
| --- | --- | --- | --- |
| 1.20 | No corredor, a porta fecha atrás dele; ele fica parado de costas para ela | De frente para ele | A porta; o corredor quieto |
| 1.21 | **Matheus** (para si, em quatro frases curtas com silêncio entre elas): **"Um time fixo não vai resolver nada."** **"Eu não quero ter 'novos laços'."** **"Eu vou conseguir."** **"Eu sou um bom agente."** | Fechado no rosto, aproximando | O corredor quieto |
| 1.22 | Ele respira e segue pelo corredor | O geral do corredor | Os passos |
| 1.23 | **O alarme** pega ele no meio do passo: tudo fica vermelho, ele para e olha para cima | (a mesma câmera) | **A sirene** |
| 1.24 | **A central:** "Agente Moura, responda! Precisamos de você no andar de contenção, agora!" | Fechado no rosto dele | O chiado do rádio |
| 1.25 | **Matheus:** "Estou indo." (a frase inteira, e só depois ele corre) | Fechado no rosto dele | A sirene |
| 1.26 | Ele corre pelo corredor, para longe da câmera; a imagem escurece | Parada, ele se afastando | A sirene; os passos |

## Cena 2: o alarme na instalação

**Duração:** ~45 s. **Sem falas:** o cenário, a câmera e o som. **O que conta:** o andar de contenção foi largado às
pressas, alguma coisa escapou lá embaixo, e a nova equipe do Matheus já está esperando por ele.
**Som:** sem música; a sirene ao longe, abafada, por baixo do som de cada lugar.

| Plano | Duração | O que se vê | Câmera | Som |
| --- | --- | --- | --- | --- |
| 2.1 | 5 s | A imagem clareia: um corredor comprido no vermelho do alarme, uma lâmpada piscando | Avança devagar pelo corredor | A sirene ao longe, o zumbido das lâmpadas |
| 2.2 | 7 s | Os campos de pesquisa: os aparelhos ligados, os frascos de ectoplasma, ninguém nas mesas | Desliza de lado | Bipes de aparelhos, um borbulhar |
| 2.3 | 6 s | O refeitório vazio: as bandejas largadas, a TV sem sinal | Do alto, deslizando | A TV chiando baixo |
| 2.4 | 8 s | O corredor de contenção: a porta pesada no fundo, a poça azul já aparecendo | Baixa, quase no chão, avançando até a porta | A ventilação; um ronco grave, longe |
| 2.5 | 6 s | A porta de contenção de perto: **o ectoplasma azul escorre por baixo**, em dedos, brilhando no chão | Fechada na fresta, parada | Uma batida do outro lado da porta |
| 2.6 | 5 s | O hall do elevador: **a Lara e o Nicolas** de costas, de frente para o elevador; viram o rosto para o som | De trás deles, o elevador ao fundo | O zumbido das lâmpadas |
| 2.7 | 5 s | Os dois de frente, esperando; a Lara olha para o Nicolas, ele não tira os olhos do elevador. Escurece | De frente, com o elevador nas costas da câmera | O ronco do elevador vindo |
| 2.8 | 4 s | Preto. O título **AGENTES CROS** aparece e some | (sem câmera) | Um acorde grave |

A foto virada da cena 1 (os planos 1.10 e 1.19) é a semente do antigo parceiro. O ectoplasma do plano 2.5 é o motivo do
alarme. O plano 2.7 emenda na parte 3: o elevador chega.

## A parte 3: a chegada no andar de contenção (a explicar)

O que já se sabe (18/nov; o desenvolvedor explica melhor depois): **o Matheus chega de elevador** ao andar de
contenção e, **já na porta do elevador, a Lara e o Nicolas aparecem para cumprimentar ele** (a nova equipe fixa que o
Victor prometeu na cena 1). A cena 2 termina com os dois esperando no hall: a parte 3 começa dali. O mapa já reserva o lugar: o hall de chegada tem o elevador.

**O elevador** (feito em 18/nov, pela referência do desenvolvedor: o elevador antigo de gaiola): a cabine de 2 × 2 m
(o lambri de madeira embaixo, o reboco creme, o taco, o forro de madeira, a lâmpada e o **painel** com os botões e o
mostrador do andar) atrás de um tipo novo de porta no criador de mapas, a **porta do elevador** (2 m × 2,8 m): a
moldura de latão com as volutas em bronze do lado do hall, a grade fixa em cima e a **porta pantográfica**, que ao
abrir dobra para o lado como uma sanfona (a folha encolhe, em vez de girar). No mapa ela fica fechada e abre com E,
para testar; na parte 3 quem abre é o roteiro. O elevador não sobe nem desce: a cena da chegada começa com ele
parado no andar.

## O que as cenas 1 e 2 pedem (o que ainda não existe)

- ✅ **O tocador de cenas** e a tela **"Ver cenas"**, ✅ **o mapa do capítulo 0** e ✅ **o ectoplasma escorrendo** (a
  ordem de construir, abaixo, diz como ficaram).
- **As animações novas:** sentar e levantar da cadeira, abrir a porta, apontar (o Victor mostrando a cadeira), mexer na
  pasta, e falar (a boca abrindo no ritmo da legenda).
- **O rádio do Matheus:** um rádio pequeno no ombro (hoje só o Nicolas tem o monofone).

## A instalação: o estilo (decidido em 18/nov)

- **Bunker retrô:** a história é nos dias de hoje, mas a C.R.O.S. funciona num prédio antigo e analógico: monitores de
  tubo, painéis com botões e mostradores, fichários de metal, tubos fluorescentes, concreto e azulejo. Combina com o
  rádio, com o pixel e com o terror.
- **O escritório do Victor é diferente:** madeira escura e luz quente (a mesa de madeira, a estante com as pastas, a
  luminária de mesa âmbar, a persiana), um respiro do concreto frio e mais pessoal: a foto do antigo parceiro na mesa.
- **As referências** (18/nov): imagens da instalação do laboratório antigo (`reference/laboratorio.html`), "dá para
  melhorar". O que vem delas:
  - **os corredores:** tijolo esmaltado claro, meio esverdeado, na parte de cima; a barra verde-escura embaixo; canos e
    conduítes correndo no alto da parede; luminárias de tubos fluorescentes com a luz fria descendo em cone; piso de
    concreto com faixas de perigo pretas e amarelas nas bordas; caixas de madeira encostadas;
  - **as portas:** de aço azul-escuro com um X amarelo pintado;
  - **a porta de contenção:** de cofre, de aço claro, com a moldura de faixas de perigo, uma faixa amarela no meio, o
    volante redondo e uma plaqueta;
  - **as salas de trabalho:** forro de placas, piso xadrez, armários baixos de madeira clara, mesas de metal com monitores
    de tubo, um quadro branco;
  - **o refeitório:** mesas compridas com bancos, azulejo branco nas paredes, piso de granilite, luminárias de tubos;
  - **o que melhorar:** mais detalhe e desgaste pintado em pixel (manchas, ferrugem, rachaduras), objetos em blocos
    refinados, a luz mais contrastada.

**As peças novas** (a etapa 1 de baixo; a lista cresce com as referências):
- **Em toda a instalação:** a luminária de teto de tubos fluorescentes (acende como as lâmpadas do mapa), a luz de
  aviso que gira, a porta de contenção (pesada, com o número), as texturas de parede e piso do bunker.
- **O escritório do Victor:** a mesa de madeira, a cadeira dele e a do visitante, a estante com as pastas, a pasta na
  mesa, a foto virada, a luminária de mesa, o relógio de parede, a persiana.
- **Os campos de pesquisa:** as bancadas, os aparelhos com mostradores e botões, os monitores de tubo, os frascos de
  ectoplasma que brilham.
- **O refeitório:** as mesas compridas, as cadeiras, as bandejas, a TV no alto.
- **Os personagens:** o lugar de cada um em cada plano (escrito no roteiro da cena) e as expressões certas em cada
  fala (as que faltam no rosto: preocupado, desconfiado, vencido, além da boca falando).

## A ordem de construir

1. ✅ **O tocador de cenas e o "Ver cenas"** (18/nov), testados com a cena 1 num cenário provisório.
   - **O formato** (`src/game/cenas/tipos.ts`): a cena é uma lista de planos; cada plano tem a duração, a câmera (de onde
     para onde, para onde olha, a lente, a curva do movimento, a tremida de mão), o clarear e o escurecer, as falas, os
     sons e o título. As cenas ficam em `src/chapters/<capítulo>/cenas/` e entram no catálogo
     (`src/game/cenas/catalogo.ts`).
   - **O tocador** (`tocador.ts`, a conta; `TocarCena.tsx`, dentro do Canvas: a câmera e os sons) e **a moldura**
     (`Moldura.tsx`: as faixas de cinema, o preto, a legenda, o título; só mexe no que mudou).
   - **O Ver cenas** (Modo desenvolvedor → Ver cenas, `src/screens/VerCenas.tsx`): tocar e pausar (Espaço), voltar ao
     começo, a linha do tempo para arrastar, as setas andam meio segundo, ½× / 1× / 2×, e a lista dos planos para pular.
     Os sons só tocam com a cena andando; pausar ou pular cala o que estava tocando.
   - **A cena da instalação** (hoje a cena 2, `src/chapters/cap0/cenas/instalacao.ts`) rodou primeiro no mapa
     `teste-iluminacao`; desde a etapa 3 roda no mapa do capítulo. Os sete planos, o clarear do começo, o título e os sons (`src/chapters/cap0/sons.ts`: o zumbido das
     lâmpadas, a lâmpada falhando, a ventilação, os bipes, o borbulhar, a TV sem sinal, o relógio, o ronco, a batida na
     porta, o acorde do título).
2. **As peças da instalação** (18/nov: o Claude faz, como a Gralha, por gerador; depois das referências do
   desenvolvedor): os objetos e as texturas de "A instalação: o estilo", no catálogo do criador de mapas. Em três partes,
   cada uma conferida antes da próxima:
   - ✅ **2a, a casca** (18/nov): a textura **tijolo esmaltado** (`texturas/tijolo-esmaltado.png`: claro, meio esverdeado,
     cada tijolo num tom, o brilho do esmalte, manchas e uma rachadura); a **luminária de tubos** (`luminaria-tubos`, no
     grupo Luz: dois tubos com a grade, luz fria `#d6eee0`; os modos normal, falhando e apagada); os **canos do teto**
     (`canos-teto`, 2 m: o cano enferrujado, o conduíte, os suportes); e **dois tipos de porta novos** no criador de
     mapas: a **porta da instalação** (1 m: aço azul-escuro com o X amarelo descascado, a chapa de chute, a alavanca, a
     plaqueta) e a **porta de contenção** (3 m × 2,8 m desde 18/nov, a largura do corredor de contenção; era 2 m; a moldura fica dentro do vão, para aparecer no corredor, de cofre: aço escovado, a moldura de faixas de perigo, a faixa
     amarela, o volante, a plaqueta, três dobradiças). O formato do mapa ganhou só dois nomes de porta novos
     (`DoorKind`); os mapas salvos não mudam, então não precisou de conversão. Falta: o cone de luz das luminárias (das
     referências) fica para quando o mapa estiver montado, para ver se pesa;
   - ✅ **2b, o escritório do Victor** (18/nov), no grupo "A instalação" do catálogo (era "A Intro"): a **mesa de
     escritório** (madeira escura, 1,6 m: o gaveteiro com três gavetas e puxadores de latão do lado do Victor, −z; a frente
     fechada do lado do visitante, +z; o mata-borrão de couro), a **cadeira do chefe** (couro, giratória, o assento a
     0,47 m), a **cadeira de visitante** (madeira e couro, o assento a 0,46 m), a **estante com pastas** (2 m: pastas de
     pé e tombadas, caixas de arquivo, papéis), a **pasta** (o dossiê do Matheus, para o Victor folhear e fechar), a
     **foto virada** (o porta-retrato de bruços), a **luminária de mesa** (de banqueiro: latão e vidro verde, luz quente
     `#ffc070`, no grupo Luz) e o **relógio de parede**. As peças pequenas vão em cima da mesa pelo modo livre (a altura
     0,76 m). As cadeiras ficam com o assento na altura do sentar.
     **Refinadas em 18/nov** (a pedido: nos closes das cenas as caixas lisas apareciam; muda a regra de 11/nov de que os
     objetos ficam simples, para os que a câmera mostra de perto): a mesa virou uma mesa de dois pedestais (o tampo com
     a beirada chanfrada, três gavetas com moldura e puxador de latão de um lado, uma porta do outro, a gaveta do
     meio, os painéis com moldura, os pés); a cadeira do chefe tem a base de cinco pontas com rodinhas, o fole, o
     assento e o encosto em gomos com botões, o apoio de cabeça e os braços estofados; a de visitante, as pernas que
     afinam, as travessas, a saia, a almofada em gomos com tachas de latão e o arco no alto; a estante, o rodapé, os
     montantes, a cornija, as pastas com lombada (a etiqueta e a argola), as caixas de arquivo com tampa e etiqueta, a
     pilha deitada e uma placa de homenagem; a pasta, os papéis escapando, a ponta de uma foto, o carimbo vermelho e o
     elástico; a foto virada, a moldura com as travas e o apoio dobrado; a luminária, a base em degraus, o anel na
     haste, a cúpula arredondada com as tampas de latão e o pingente da cordinha; o relógio, de oito lados, com o aro
     de latão e as doze marcas. As medidas e os pontos de apoio são os de antes: nada saiu do lugar no mapa. Cada peça
     continua uma malha e uma textura (a mesa foi de 12 para 50 blocos, a estante para 61);
   - ✅ **2c, os campos de pesquisa e o refeitório** (18/nov): a **bancada de laboratório** (o tampo preto, os armários
     de madeira clara, a prateleira de reagentes), o **aparelho de pesquisa** (o armário de metal com o osciloscópio
     verde que brilha, os mostradores, os botões, a ventilação), os **frascos de ectoplasma** (três potes que brilham
     em azul, com luz de verdade; vão na bancada), o **quadro branco** (na parede, com anotações meio apagadas), a
     **mesa do refeitório** (com os dois bancos presos), a **bandeja** (o prato, a comida, o copo), a **TV de tubo** (na
     parede, a tela sem sinal acesa) e a **luz de aviso** (na parede, a cúpula vermelha). O monitor de tubo já existia.
     **A luz de aviso começa apagada** e acende no alarme (o modo normal ou falhando); **o girar** dela fica para depois:
     uma luz que anda não pode ser assada no cenário, então precisa de um jeito próprio (decidir com o mapa montado).
3. ✅ **O mapa do capítulo 0** (18/nov, `maps/instalacao-cap0`, "A instalação · capítulo 0"): gerado já decorado, para o
   desenvolvedor retocar no criador de mapas. A ambientação nova **Instalação da C.R.O.S.** (`instalacao` em
   `src/maps/ambientes.ts`: a luz fria meio verde das luminárias de tubos, sem céu, a neblina fechando os corredores).
   Duas partes soltas, sem ligação entre elas:
   - **o andar de contenção** (o jogável, ~2.250 m²; pedido em 18/nov: maior e menos reto que a primeira planta). O
     **elevador** (a oeste: a cabine com a porta pantográfica, na parte 3 abaixo) abre no **hall de chegada** (o ponto
     `chegada`, onde o agente nasce, olhando para leste). Do hall, o vão de 3 m onde **o campo de força fecha o andar**
     (o ponto `campo-de-forca`: o tutorial da Intro original) dá num **anel de corredores** em volta do miolo. No miolo:
     o **refeitório** e os **campos de pesquisa** (com quatro janelas para o corredor norte), a **enfermaria** e o
     **almoxarifado** (trancado), e a **manutenção**, um corredor estreito e escuro que corta o miolo de norte a sul
     (o atalho; liga também com a enfermaria). Ao norte do anel, o **vestiário**, o **arsenal** e o **estande de
     tiro** (o arsenal liga com o estande). A leste, a **sala de controle** (duas janelas para o corredor de contenção)
     e o **corredor de contenção**, com as luzes de aviso apagadas, que termina na **porta de contenção** (trancada: "A
     contenção está lacrada."); atrás dela, as **celas**, ainda vazias. Algumas luminárias falham (no corredor oeste,
     nas celas, no almoxarifado);
   - **o corredor e o escritório do Victor** (ao sul, longe do andar): só de cena; o escritório usa a ambientação da
     mansão (a madeira e a luz quente).
   - **A janela da instalação** (um tipo novo de janela no criador de mapas, `janela-instalacao`): a de observação,
     com a moldura de aço e a grade de barras, **sem vidro** (o vidro do jogo é opaco e aqui é preciso ver a sala do
     outro lado) e sem luar (é interna). Só um nome novo no formato (`WindowKind`), sem conversão.
   - **A cena da instalação nos lugares de verdade:** o corredor oeste com a luminária que falha, os campos de pesquisa de lado, o
     refeitório do alto, a mesa do Victor de perto, o corredor de contenção rente ao chão e a porta de contenção.
   - **O ectoplasma escorrendo** (`src/chapters/cap0/ectoplasma.tsx`): a poça azul sai da fresta da porta de
     contenção e se espalha em dedos, mais escura na ponta; começa no plano 1.5 e chega ao tamanho todo no fim do 1.6.
     É uma malha só com a textura de pixel: o tempo em que a poça chega em cada pixel fica guardado na textura, então
     crescer não custa nada a cada quadro. A cena põe o que é dela no mapa pelo `cenario` (`tipos.ts`).
   - **Os objetos que acendem não estouram mais com a própria luz** (`amaciarPropria` em `src/maps/luzAssada.ts`): a
     luminária de mesa ficava toda branca, porque a lâmpada fica a 8 cm do corpo dela; agora, no corpo do objeto, a
     lâmpada dele conta como se estivesse a pelo menos 40 cm. Vale para todos (o abajur, a arandela, o lustre ficam um
     pouco menos claros).
   - **Falta** (as peças das salas que a cena não mostra): o vestiário, o arsenal, o estande, a enfermaria, o
     controle e as celas estão com a luz e o piso, mas vazios. E o que mora nas celas (em aberto, abaixo).
4. ✅ **Os atores nas cenas e a cena do escritório no lugar de verdade** (18/nov; mudou de lugar com a 5, a pedido:
   primeiro a conversa andando, depois as animações novas).
   - **O elenco** (`elenco` da cena, `src/game/cenas/tipos.ts`): cada ator é um personagem no esqueleto do agente (o
     modelo e onde começa). Em cada plano, `atores` diz o que cada um faz: pôr em outro lugar (o corte), andar até um
     ponto (andando ou correndo), virar, olhar para outro ator ou um ponto, a expressão. O que o plano não diz continua.
     As **portas** da cena abrem e fecham no mapa (`portas` do plano, pelo id da porta).
   - **A conta** (`atores.ts`) é pura, como a do tocador: o lugar de cada um é uma conta do tempo, então pular para
     qualquer plano põe todo mundo no lugar. **O desenho** (`Elenco.tsx`): o corpo anima com o mesmo andar do jogo, a
     cabeça vira para quem ele olha, **a boca abre e fecha enquanto a legenda dele está na tela** (provisório: com a
     dublagem, vai seguir o volume da voz; o pensamento não mexe a boca) e ele pega a luz pintada do lugar.
   - **A cena do escritório** roda no mapa do capítulo: o Matheus anda pelo corredor, para na porta, a porta abre, ele entra e
     para na frente da mesa; o Victor atrás da mesa olha a pasta e levanta os olhos para ele. **As câmeras da
     conversa são contas do lugar dos dois** (por cima do ombro de um, fechado no rosto do outro, sempre do mesmo lado
     da linha entre eles): mudou o lugar de um ator, a câmera vai junto. Depois ele sai, a porta fecha, ele fala para
     si, o alarme toca, a central chama e ele corre pelo corredor. **A conversa é de pé.**
   - **A revisão da cena** (18/nov, a pedido, depois de ver a primeira versão; "Como as cenas são dirigidas", acima):
     os inserts da pasta e da foto virada, os planos de reação, o geral que abre e fecha a conversa, os passos antes
     da imagem; **o tempo de cada plano sai das falas** (`comum.ts`: o alarme tocava antes de a frase acabar e ele
     corria antes do "Estou indo."); **o alarme tinge tudo de vermelho** (o momento de luz `alarme`, que o plano segura
     pelo campo `luz`); e **a mão vai à maçaneta** para abrir a porta (`alcanca`; a porta abre para longe de quem
     passa, pelo `lado` da ordem). **Abrir a porta com a mão também vale no jogo:** ao apertar E, a mão esquerda do
     agente vai à maçaneta (a direita fica com a arma), até na porta trancada.
   - **A luz nos personagens:** o Victor ficava estourado, a 70 cm da luminária de mesa (recebia 3 vezes a luz do
     Matheus). Agora uma lâmpada sozinha clareia um personagem (e um objeto) só até um limite (`limitarLampadas` em
     `src/maps/luzAssada.ts`); vale no jogo também.
   - **A ordem das cenas mudou** (18/nov): o escritório é a cena 1; a instalação com o alarme é a cena 2 e ganhou a
     Lara e o Nicolas esperando o Matheus na frente do elevador.
5. **Os gestos do Victor com a pasta** (folhear e fechar, bater o dedo nela) e o lugar deles na cena 1. Sentar,
   levantar e apontar a cadeira saíram (18/nov: a conversa fica de pé); abrir a porta já está feito.
6. **As expressões que faltam** (preocupado, desconfiado, fechado, vencido) e o ajuste fino do tempo dos planos com as
   vozes. Depois: o rádio no ombro do Matheus (o plano 2.20) e a luz vermelha que gira no alarme (o plano 2.19).

## Em aberto

- **O antigo parceiro do Matheus:** quem era e o que aconteceu com ele. A cena 1 só toca no assunto e não responde (fica
  como mistério). Bom decidir antes de escrever o resto da história, para as pistas baterem.
- **As três missões que deram errado:** a cena não diz quais foram; dá para citar uma, se quiser mais concreto.
- **Quem fala no rádio:** "a central" (uma voz sem rosto) ou alguém com nome.
- **O andar de contenção:** quais fantasmas pequenos aparecem no refeitório (os Espectrais saíram do projeto) e o que
  espera nas celas (o Glutão ou outro).
- **A música:** a cena da instalação é sem música; a do escritório pode ter uma trilha baixa na conversa (a do menu do capítulo 0?).
