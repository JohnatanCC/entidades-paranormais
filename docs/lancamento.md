# O lançamento: o capítulo 1 no itch.io

Decidido em 17/nov. O foco agora é **terminar o capítulo 1** e lançar a **versão web** de graça no
[itch.io](https://itch.io), jogável no navegador. Se tiver uma boa resposta do público, vêm os outros capítulos e o Steam.
Primeiro o capítulo jogável do começo ao fim, **na ordem do jogo** (começando pela abertura); o polimento vem depois.

## As decisões

| | |
| --- | --- |
| Onde | **itch.io, versão HTML5** (roda no navegador, sem baixar nada). Jogo de navegador tem muito mais gente jogando do que jogo para baixar, e o nosso já é web |
| O que | **O capítulo 0 e o capítulo 1** (17/nov): o capítulo 0 é a introdução, até os agentes entrarem no portal; o capítulo 1 é a chegada na mansão assombrada → a Mãe perseguindo → o berçário (o chefe) → o fim |
| O menu | (17/nov) **Muda a cada capítulo**, como no Poppy Playtime: mostra o capítulo mais adiantado a que o jogador chegou, com a música dele (`docs/musicas.md`) |
| A Intro do submundo | (17/nov) **Não é a Intro do jogo.** A Demo · Intro já feita (o caminho das ilhas, os Sombrios, o Devora almas: `docs/intro.md`) fica para um conteúdo **mais para frente**. A Intro do capítulo 1 vai ser **algo novo** (a definir) |
| Preço | De graça (com a opção de doar, que o itch oferece) |
| Aparelho | **PC** (teclado e mouse). O celular fica para depois: a página avisa que é só para PC |
| Tauri / Electron | **Não agora.** Só para o Steam; decidir lá (ver "Depois do itch") |
| A ordem | Primeiro jogável do começo ao fim, mesmo cru (fase A); depois o polimento (B); depois a versão web (C) e a página (D) |

## Fase A: o capítulo 1 jogável do começo ao fim

Uma etapa por vez, na ordem em que o jogador vê. Cada uma termina numa versão para testar.

1. **O capítulo 0: da instalação da C.R.O.S. até o portal** (17/nov, `docs/jogo.md`). **Começa com duas cenas** (18/nov,
   `docs/cenas.md`: o storyboard, o jeito de fazer e a ordem de construir; feitos em 18/nov: o tocador de cenas, as peças
   da instalação, o mapa e as duas cenas nele, com os atores; a próxima etapa são os gestos e as expressões das cenas).
   Jogável: depois das cenas, na instalação, com a introdução e o tutorial inicial; depois a missão no Palacete e a ruptura que suga os três. É o maior pedaço novo
   do lançamento (um mapa novo, `maps/instalacao-cap0`: cada capítulo tem um mapa só, com as partes de cena soltas nele; o tutorial; o caminho até o portal): vai ser dividido em etapas menores quando as
   decisões abaixo estiverem tomadas. **Decidido em 19/nov** (`docs/direcao-cap0.md`): um tutorial novo, linear e curto,
   na instalação; os fugitivos são o Glutão e fantasmas pequenos, redesenhados; o Palacete é jogável, sem luta, no mapa
   `mansao-cap1` com a luz de casa real, guiado por um detector; e o portal suga os três porque o Matheus liga a máquina
   antes da hora. A ordem é construir tudo em cinza primeiro; a captura sobe para esta etapa.
2. **A chegada na mansão** (a Intro nova, decidida em 17/nov; `docs/jogo.md`, "Capítulo 1"): o Matheus é arremessado para
   fora de um armário num quarto, fala com a Lara e o Nicolas pelo rádio, e entende o objetivo (destruir os objetos e
   capturar a Mãe). **Decidir antes:** qual quarto, e como as falas aparecem (legendas com som de rádio, sem vozes
   gravadas, é o mais barato). A Demo · Intro do submundo não entra aqui (fica para depois).
3. **A mansão montada.** A planta crua já existe (`maps/mansao-cap1`, `docs/mansao-cap1.md`): decorar (o desenvolvedor no
   editor; o Claude ajusta), decidir quais portas trancam, a chegada pelo alpendre.
4. **Os objetos da Mãe.** A foto (no piano), a pelúcia (na rouparia), a chave (no gabinete, só depois das duas): achar,
   destruir (faz barulho), a chave aparecer, a porta do berçário abrir. **Decidir antes** (em aberto em `docs/jogo.md`):
   destruir os objetos muda a Mãe ou só libera o caminho?
5. **A Mãe perseguidora.** A inteligência dela na casa: a patrulha cantando, parar para escutar, a caça, abaixar nas portas,
   ficar atordoada com dano (quanto tempo: em aberto). O modelo, as animações e os sons já estão prontos (`src/game/enemies/mae/`),
   e a base da caça já roda no Testar (a aba Entidades, 18/nov: ver, gritar, caçar, a carga e as garradas: `src/game/entidades/`).
6. **O berçário.** O mapa `bercario-cap1` (a porta troca de mapa), a luta das 4 fases (o berço, o tornado, a chuva), e a
   **captura** (`src/game/capture/`, ainda não existe): a poça e **a lamparina**, que é a armadilha reformulada (17/nov:
   na cintura, acesa; erguida, ilumina a frente e absorve o fantasma; `docs/cap2-sombra.md`, "A lamparina").
   **Decidir antes:** se a lamparina entra numa etapa própria antes da luta (ela já ilumina a mansão), e como a Mãe é
   absorvida (a poça continua?).
7. **O fim e o salvar.** O que acontece depois da captura (um relatório e "continua…"), e o progresso salvo entre as partes
   (no navegador: o capítulo 0, a mansão, o berçário), para quem fechar a página não recomeçar do zero.
8. **O menu de cada capítulo.** O menu lê o progresso salvo e mostra o capítulo mais adiantado (a música e o fundo dele).
   Depende do salvar (etapa 7). **Decidir antes:** o que muda além da música (o fundo, as cores, o título).

**Ficam fora do capítulo 1 lançado** (a não ser que o desenvolvedor peça): os Sombrios dentro da mansão, as salas seguras,
agachar, esconder no armário, a Lara e o Nicolas jogáveis, o Glutão, e a Demo · Intro do submundo (o caminho das ilhas e
o Devora almas: conteúdo para mais tarde). **Decidir:** se ela continua no menu Novo jogo enquanto isso (como teste) ou
sai da versão publicada.

## Fase B: o polimento (depois da fase A)

A lista vai sendo preenchida enquanto a fase A é jogada. O que já se sabe:
- Ensinar os controles aos poucos (os avisos de controle do HUD) e as legendas, quando houver falas.
- Os números das lutas ajustados jogando (dano, vida, tempos).
- **Testar com 3 a 5 pessoas** que nunca jogaram, sem explicar nada, e anotar onde elas travam ou desistem.
- O desempenho num PC fraco e num notebook (o nível Baixo precisa ficar liso; `TesteDesempenho` nas configurações).
- O menu, as configurações, trocar as teclas.

## Fase C: a versão web

- **Os caminhos relativos:** o itch serve o jogo dentro de uma subpasta, num quadro (iframe). O `vite.config.ts` precisa de
  `base: './'`, senão os arquivos (`/assets/...`) não carregam.
- **Tirar o que é de desenvolvedor** da versão publicada: o Modo desenvolvedor no menu (o criador de mapas), a tecla H
  (se a Demo · Intro ficar), o F2 e o F4. As provas e a API dos mapas já só existem no `npm run dev`.
- **As fontes dentro do jogo** (hoje vêm do Google Fonts, pela internet).
- **As licenças:** conferir de onde vem cada música (`menu.mp3`, `batalha.mp3`, `devorador.mp3`) e se pode usar num jogo
  publicado. As fontes (VT323, IBM Plex Mono) são livres (OFL). Os modelos e as texturas são nossos.
- **Os navegadores:** Chrome, Edge e Firefox no Windows; travar o mouse e a tela cheia dentro do quadro do itch.
- **O tamanho:** o itch aceita o jogo num .zip; conferir os limites dele (quantidade e tamanho dos arquivos) na hora de
  enviar. Quanto menor, mais rápido abre.
- Primeiro como **rascunho** no itch (só quem tem o link vê), para testar lá antes de abrir ao público.

## Fase D: a página e a divulgação

- **A página:** a capa (630 × 500), 4 ou 5 capturas, um GIF ou vídeo curto da Mãe, a descrição, as
  etiquetas (horror, action, third-person, pixel, ghosts).
- **O idioma:** o jogo é em português. Em inglês o público é muitas vezes maior. **Decidir antes da fase D:** lançar só em
  português, ou traduzir os textos (o menu, as legendas, a página). Traduzir pede que os textos saiam do código para um
  arquivo só; se for traduzir, melhor fazer isso já na fase B.
- **Divulgar:** o itch não traz público sozinho. Terror é o gênero que YouTubers e streamers mais procuram (os pequenos
  e médios, os brasileiros também); vídeos curtos da gameplay (TikTok, Shorts); devlogs no próprio itch; Reddit
  (r/IndieGaming, r/HorrorGaming); game jams.

## Como saber se deu certo

Combinar os números **antes** de lançar, para a decisão de continuar não ficar no achismo. Exemplo (o desenvolvedor
escolhe): quantas pessoas jogaram, quantas seguiram a página e quantos vídeos de outras pessoas apareceram no primeiro mês.

## Depois do itch (se der certo)

- **Os outros capítulos** (a cada chefe a mansão muda: um mapa por capítulo). O capítulo 2, a Sombra, já está no papel:
  `docs/cap2-sombra.md`.
- **O Steam:** criar a página **cedo** (a taxa é de US$ 100), porque o que conta lá são as listas de desejos, que levam
  meses para crescer; a demo pode entrar no Steam Next Fest. Para o Steam o jogo é envelopado num programa:
  - **Tauri:** o instalador é pequeno, mas ele usa o navegador do sistema. No Windows é Chromium (bom); no Mac e no Linux o
    WebGL e o som se comportam diferente.
  - **Electron:** o instalador é maior, mas roda igual em todo lugar, e a ligação com o Steam (conquistas, salvar na
    nuvem) é mais madura.
  Decidir quando chegar lá.
- **O celular:** os controles de toque (a camada `input/` já foi pensada para isso).

## Em aberto

- O capítulo 0: o que ainda falta está em `docs/direcao-cap0.md`, "Em aberto" (etapa A1). O menu de cada capítulo: o que muda além da música (etapa A8). A chegada: qual quarto e como aparecem as falas do rádio (etapa A2).
- A Demo · Intro do submundo fica no menu até lá ou sai da versão publicada.
- Destruir os objetos muda a Mãe? Quanto tempo ela fica atordoada (etapas A4 e A5).
- De onde vêm as músicas e se podem ser usadas (fase C).
- Só português ou também inglês (fase D).
- Os números de sucesso.
