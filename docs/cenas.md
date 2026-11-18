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

### O jeito de trabalhar (cada cena)

1. **O storyboard** (este documento): o plano a plano, as falas e o tempo. Você aprova ou reescreve.
2. **O cenário:** você monta no criador de mapas; eu faço as peças que faltarem.
3. **O roteiro em dados:** eu escrevo a cena a partir do storyboard.
4. **Você assiste no "Ver cenas"** (uma tela nova no Modo desenvolvedor: tocar, pausar, arrastar a linha do tempo, pular
   para um plano) e aponta o que mudar.
5. **O ajuste**, até ficar bom.

## Cena 1: a abertura (a instalação)

**Duração:** ~40 s. **Ninguém em cena:** só o cenário, a câmera e o som. **O que conta:** a C.R.O.S. é um lugar de
trabalho comum, de pesquisa, e alguma coisa escapou lá embaixo.
**Som:** sem música; o zumbido das lâmpadas fluorescentes, a ventilação, ecos distantes. No último plano, o silêncio.

| Plano | Duração | O que se vê | Câmera | Som |
| --- | --- | --- | --- | --- |
| 1.1 | 5 s | Preto. A imagem clareia devagar: um corredor da instalação, lâmpadas frias, uma delas piscando | Parada, depois avança devagar pelo corredor | O zumbido das lâmpadas entra junto com a imagem |
| 1.2 | 7 s | Os campos de pesquisa: bancadas, aparelhos, frascos com ectoplasma azul brilhando atrás do vidro | Desliza de lado, passando por trás de um vidro | Bipes de aparelhos, um borbulhar |
| 1.3 | 6 s | O refeitório vazio: as cadeiras, as bandejas esquecidas, uma TV ligada sem sinal | Do alto, girando devagar | A TV chiando baixo |
| 1.4 | 6 s | Um escritório (o do Victor, que aparece na cena 2): a mesa, as pastas, uma foto virada para baixo | Passa rente à mesa | O relógio da parede |
| 1.5 | 8 s | O andar de contenção: a luz fria, as portas pesadas numeradas, uma luz de aviso girando devagar | Baixa, quase no chão, avançando até uma das portas | O zumbido some; um ronco grave, longe |
| 1.6 | 6 s | O vão debaixo da porta de contenção: **o ectoplasma azul escorre por baixo**, devagar, brilhando no chão | Fechada no vão, parada | Uma batida do outro lado da porta. Corta para o preto |
| 1.7 | 3 s | Preto. O título **AGENTES CROS** aparece e some | (sem câmera) | Um acorde grave |

A foto virada no plano 1.4 é uma semente para a cena 2 (o antigo parceiro). O ectoplasma do plano 1.6 é a semente do
alarme no fim da cena 2.

## Cena 2: o escritório do Victor

**Duração:** ~2 min 10 s (a maior parte é conversa). **Em cena:** o Matheus e o Victor, chefe do departamento dele.
**O que conta:** o Matheus anda falhando, é fechado, carrega alguma coisa do antigo parceiro, e vai ganhar uma equipe
fixa contra a vontade. E alguma coisa está acontecendo no andar de contenção.
**Por que economiza:** mostra pedaços da instalação que o jogador não explora (o corredor, o escritório).

### O corredor e a porta

| Plano | Duração | O que se vê | Câmera |
| --- | --- | --- | --- |
| 2.1 | 4 s | As botas do Matheus andando no corredor | De lado, rente ao chão, acompanhando |
| 2.2 | 5 s | A câmera sobe pelo corpo enquanto ele anda: as mãos, a arma no coldre, o rosto sério | Sobe devagar, acompanhando |
| 2.3 | 4 s | Ele chega à porta no fim do corredor, para por um instante e abre | De trás dele, o corredor inteiro na frente |

### A conversa

Plano e contraplano (por cima do ombro de um, mostrando o rosto do outro), e fechado no rosto nas falas que pesam.
**As falas são um rascunho:** reescreva à vontade.

| Plano | Quem | Fala ou ação | Câmera e expressão |
| --- | --- | --- | --- |
| 2.4 | Victor | (atrás da mesa, lendo uma pasta; levanta o olhar) **"Entre, Moura. Sente."** (aponta a cadeira) | Geral da sala, do lado da porta |
| 2.5 | Matheus | (senta) | Do lado, os dois na imagem |
| 2.6 | Victor | **"Três missões este mês. Três capturas que deram errado."** | Por cima do ombro do Matheus |
| 2.7 | Victor | **"Isso não é você. O que está acontecendo?"** | Fechado no Victor |
| 2.8 | Matheus | **"Nada. Muita coisa ao mesmo tempo, só isso."** | Por cima do ombro do Victor; desvia o olhar |
| 2.9 | Victor | **"É por causa do seu antigo parceiro?"** | Fechado no Victor |
| 2.10 | Matheus | **"Não tem nada a ver com isso."** (pausa) **"Eu me distraí. Não vai se repetir."** | Fechado no Matheus; a expressão endurece |
| 2.11 | Victor | (fecha a pasta) **"Vou mudar a dinâmica. Chega de te mandar com um time diferente a cada missão."** | Por cima do ombro do Matheus |
| 2.12 | Victor | **"A partir de hoje você tem uma equipe fixa. É uma chance de criar laços. De não carregar tudo sozinho."** | Fechado no Victor |
| 2.13 | Matheus | **"Não precisa. Eu sempre me virei bem sozinho."** | Fechado no Matheus |
| 2.14 | Victor | **"Sempre?"** (bate o dedo na pasta) **"Mesmo depois deste mês?"** | Fechado no Victor |
| 2.15 | Matheus | (silêncio, olha para o lado) **"...Tudo bem."** | Fechado no Matheus |
| 2.16 | Victor | **"Ótimo. Já tenho uma missão para vocês. Logo você conhece a sua equipe."** | Geral da sala |
| 2.17 | Matheus | (levanta e sai) | Geral, do lado da mesa |

### O alarme

| Plano | Duração | O que se vê | Câmera | Som |
| --- | --- | --- | --- | --- |
| 2.18 | 3 s | O Matheus fecha a porta, no corredor, e fica parado de costas para ela | De frente para ele | O corredor quieto |
| 2.18b | 6 s | **Matheus** (baixo, para si mesmo): **"Um time fixo não vai resolver nada. Eu não quero ter 'novos laços'. Eu vou conseguir. Eu sou um bom agente."** Respira fundo e dá dois passos | Fechado no rosto dele; a expressão endurece no fim | O corredor quieto |
| 2.19 | 3 s | A luz do corredor fica vermelha e começa a girar | Geral do corredor | **A sirene** |
| 2.20 | 5 s | O rádio no ombro dele chia. **A central:** "Agente Moura, responda! Precisamos de você no andar de contenção, agora!" | Fechado no rosto dele | O chiado do rádio |
| 2.21 | 3 s | **Matheus:** "Estou indo." Ele corre pelo corredor, para longe da câmera | Parada, ele se afastando | A sirene; os passos |

O fim da cena 2 leva ao andar de contenção, onde o ectoplasma da cena 1 escorria: é ali que o jogo começa (a parte 3,
que vamos pensar quando esta estiver pronta).

## O que as cenas 1 e 2 pedem (o que ainda não existe)

- **O tocador de cenas** e a tela **"Ver cenas"** (o código novo; depois servem para o jogo todo, inclusive a chegada
  pelo armário no capítulo 1).
- **O mapa do capítulo 0** (`maps/instalacao-cap0`, como o `mansao-cap1` do capítulo 1), com duas partes soltas, sem
  ligação entre elas:
  - **o corredor com o escritório do Victor:** só de cena (a cena 2 e o plano 1.4 da abertura); não é explorável;
  - **o andar de contenção de fantasmas:** onde o jogo começa depois da cena 2 (a parte 3); a abertura termina nele
    (os planos 1.5 e 1.6, a porta com o ectoplasma).
  **Os campos de pesquisa e o refeitório** (os planos 1.2 e 1.3 da abertura) **ficam dentro do andar de contenção**
  (decidido em 18/nov): o andar tem essas salas, e a abertura mostra lugares que o jogador vai pisar depois. Então a
  abertura passa por três lugares do andar (os campos de pesquisa, o refeitório, a porta de contenção) e um da parte
  solta (o escritório do Victor). O catálogo já tem as texturas e os móveis da instalação (o grupo "A Intro"). Faltam: a
  porta de contenção, os aparelhos e os frascos de pesquisa, a luz de aviso que gira.
- **O ectoplasma escorrendo** debaixo da porta: a poça azul que cresce devagar (dá para partir do Luto da Mãe, que já é
  uma poça).
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
   - **A cena 1** (`src/chapters/cap0/cenas/abertura.ts`) roda, **provisória**, no mapa `teste-iluminacao` (a sala, o
     corredor), com os sete planos, o clarear do começo, o título e os sons (`src/chapters/cap0/sons.ts`: o zumbido das
     lâmpadas, a lâmpada falhando, a ventilação, os bipes, o borbulhar, a TV sem sinal, o relógio, o ronco, a batida na
     porta, o acorde do título). O primeiro plano fica escuro, porque o corredor desse mapa tem a luz apagada.
2. **As peças da instalação** (18/nov: o Claude faz, como a Gralha, por gerador; depois das referências do
   desenvolvedor): os objetos e as texturas de "A instalação: o estilo", no catálogo do criador de mapas. Em três partes,
   cada uma conferida antes da próxima:
   - ✅ **2a, a casca** (18/nov): a textura **tijolo esmaltado** (`texturas/tijolo-esmaltado.png`: claro, meio esverdeado,
     cada tijolo num tom, o brilho do esmalte, manchas e uma rachadura); a **luminária de tubos** (`luminaria-tubos`, no
     grupo Luz: dois tubos com a grade, luz fria `#d6eee0`; os modos normal, falhando e apagada); os **canos do teto**
     (`canos-teto`, 2 m: o cano enferrujado, o conduíte, os suportes); e **dois tipos de porta novos** no criador de
     mapas: a **porta da instalação** (1 m: aço azul-escuro com o X amarelo descascado, a chapa de chute, a alavanca, a
     plaqueta) e a **porta de contenção** (2 m × 2,8 m, de cofre: aço escovado, a moldura de faixas de perigo, a faixa
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
     0,76 m). As cadeiras ficam com o assento na altura do sentar (a animação vem na etapa 4);
   - ✅ **2c, os campos de pesquisa e o refeitório** (18/nov): a **bancada de laboratório** (o tampo preto, os armários
     de madeira clara, a prateleira de reagentes), o **aparelho de pesquisa** (o armário de metal com o osciloscópio
     verde que brilha, os mostradores, os botões, a ventilação), os **frascos de ectoplasma** (três potes que brilham
     em azul, com luz de verdade; vão na bancada), o **quadro branco** (na parede, com anotações meio apagadas), a
     **mesa do refeitório** (com os dois bancos presos), a **bandeja** (o prato, a comida, o copo), a **TV de tubo** (na
     parede, a tela sem sinal acesa) e a **luz de aviso** (na parede, a cúpula vermelha). O monitor de tubo já existia.
     **A luz de aviso começa apagada** e acende no alarme (o modo normal ou falhando); **o girar** dela fica para a cena 2:
     uma luz que anda não pode ser assada no cenário, então precisa de um jeito próprio (decidir com o mapa montado).
3. **O mapa do capítulo 0** (`maps/instalacao-cap0`): o Claude propõe a planta do andar de contenção (pequena: o que as
   cenas pedem e uma área jogável curta), o desenvolvedor aprova, o Claude gera o mapa e o desenvolvedor retoca no
   criador de mapas. Com ele, **a cena 1 completa** nos lugares de verdade, com o ectoplasma escorrendo.
4. **As animações novas** (sentar, levantar, abrir a porta, apontar, a pasta, a boca falando) e **as expressões que
   faltam** (preocupado, desconfiado, vencido), conferidas no Ver modelos.
5. **Os atores nas cenas e a cena 2.** O tocador ganha os personagens (andar até um ponto, fazer uma animação, a
   expressão, olhar para alguém), com o lugar de cada um em cada plano. Já existe uma versão **provisória** da cena 2 (18/nov, `src/chapters/cap0/cenas/escritorio.ts`): sem os personagens
   em cena e no mapa de teste, só a câmera nos lugares de cada plano, as legendas, as vozes provisórias (a voz do
   navegador, `docs/dublagem.md`) e os sons (os passos, bater e abrir a porta, a cadeira, o relógio, a porta fechando, a
   sirene, o rádio). Serve para ouvir o ritmo da conversa e ajustar o tempo dos planos.

## Em aberto

- **O antigo parceiro do Matheus:** quem era e o que aconteceu com ele. A cena 2 só toca no assunto e não responde (fica
  como mistério). Bom decidir antes de escrever o resto da história, para as pistas baterem.
- **As três missões que deram errado:** a cena não diz quais foram; dá para citar uma, se quiser mais concreto.
- **Quem fala no rádio:** "a central" (uma voz sem rosto) ou alguém com nome.
- **A música:** a cena 1 é sem música; a cena 2 pode ter uma trilha baixa na conversa (a do menu do capítulo 0?).
