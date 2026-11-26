# O teste online

Ideia de 21/nov, **feita no mesmo dia** (a pedido: o desenvolvedor quis o teste inteiro agora). É um teste de
desenvolvedor, não um modo de jogo: serve para saber se dois jogadores na mesma sessão funcionam, antes de pensar num
servidor. Não muda o plano do lançamento (`docs/lancamento.md`): o capítulo 1 continua sozinho.

## O que é

- No **Modo desenvolvedor → Teste online** (`src/screens/TesteOnline.tsx`): *Criar sessão* (o host recebe um código de
  5 letras para mandar) ou *Entrar com código* (o convidado digita e entra).
- O mapa é a mansão do capítulo 1 (`maps/mansao-cap1`). Os fantasmas entram só no teste (`FANTASMAS_ONLINE`, na tela:
  o mapa salvo não muda): a Mãe na sala de jantar, o Mestre na cozinha e 4 Gralhas (no salão nobre, na sala de visitas
  e no gabinete), todos no térreo.
- **O host é o Matheus; o convidado é a Lara** (`montarAgente('lara')`, o mesmo esqueleto do agente). Os dois começam
  no alpendre, lado a lado.
- **As mecânicas são as mesmas** do jogo sozinho: andar, correr, esquivar, as duas armas, a lamparina, os kits, a queda
  e a volta no começo. Sem cenas, sem roteiro de capítulo.
- Só PC, só dois jogadores, sem reconexão: caiu a conexão, a sessão acaba e a tela diz por quê. Esc abre o menu de
  pausa, que no online **não para o jogo** (o outro e os fantasmas continuam; o seu agente fica parado); *Sair da
  sessão* avisa o outro ("O convidado saiu." ou "O host encerrou a sessão.").
- No canto da tela: quem eu sou, o código e o **ping** (verde até 80 ms, âmbar até 180, vermelho acima).

## Como funciona a conexão

- **Um jogador ligado direto ao outro** (WebRTC), pelo **PeerJS 1.5.4** (`src/game/rede/conexao.ts`; só carrega quando
  o teste online abre). Para os dois se acharem, o servidor gratuito do PeerJS apresenta um ao outro: o código vira o
  nome do host lá (só o código passa por ele). Depois as mensagens vão direto de um navegador ao outro. Nas redes que
  não deixam a ligação direta, o PeerJS usa os servidores de retransmissão (TURN) dele.
- Os números (o ritmo das mensagens, a queda, o deslizar) ficam em `src/game/rede/numeros.ts`.
- Um canal só, confiável e em ordem (JSON). Medido no teste: **20 poses e 15 retratos por segundo, uns 5 KB/s**, ping de
  1 a 35 ms entre duas abas.
- O ping vai e volta a cada segundo. **6 s sem mensagem nenhuma: a conexão caiu.** Fechar ou recarregar a página do
  outro é notado na hora.
- **O host manda no mundo:** só ele roda a inteligência dos fantasmas (`entidades/Entidades.tsx`, `pensar`), decide
  quem acertou quem e quem foi ferido. Manda ao convidado o **retrato** (15/s: onde cada entidade está e o estado dela)
  e os **instantes** (o golpe da Mãe, o grito e a mordida do Mestre, a Gralha atacando, ferida, estourando).
- **O convidado copia** (`copiar`): cada entidade desliza até onde o retrato diz e anima ali mesmo com os instantes; o
  corvo do Mestre voa na máquina dele (sai no mesmo ponto do grito), e as Gralhas que o corvo solta vêm pelo retrato.
- **Cada um manda no próprio corpo:** anda na hora (sem esperar o outro, para o controle não ficar mole) e manda a pose
  20 vezes por segundo (`mensagens.ts`, `Pose`). O outro aparece deslizando até ela (`rede/Remoto.tsx`; mais de 2 m de
  uma vez, como a volta depois de cair, ou noutro andar, ele aparece direto, sem atravessar as paredes), com o corpo
  animado pela pose: andar, correr, esquivar, mirar, cair, a mão na maçaneta. Os passos e o tiro soam no lugar dele.
- **O tiro:** quem atira vê a própria bala na hora; a bala aparece também para o outro. A bala do convidado que pega
  numa entidade vira um pedido ao host (`acerto`), e o host aplica o tiro como se fosse dele, com a Lara como quem
  atirou (o foco). **O golpe:** a entidade do host que pega a Lara manda a ferida para ela (`ferido`); lá, a cambalhota
  ainda escapa.
- **As portas:** quem abre ou fecha avisa o outro. Se o outro fecha uma porta com você parado no vão, ela não fecha na
  sua máquina e abre de novo na dele (ninguém fica preso).
- Cada um tem a sua câmera, o seu HUD e o seu som. A lamparina do outro não acende (a luz da lamparina é uma só no jogo,
  a do jogador local); o feixe dele vale para o Mestre pela pose.
- Os sorteios que mudam a luta só acontecem no host; os de enfeite (faíscas, penas, fumaça) cada um sorteia o seu.
- Quando vier um servidor de verdade, ele toma o lugar do host. Para isso a regra do jogo precisaria rodar sem tela,
  separada do desenho: é o maior trabalho dessa mudança e fica para quando chegar.

## O sistema de foco (quem o fantasma ataca)

Feito para as entidades do mapa (a Mãe, o Mestre, as Gralhas): `src/game/entidades/foco.ts`, com os números em
`entidades/numeros.ts` (`FOCO`). Cada criatura acorda ao ver qualquer jogador e escolhe o alvo pela **ameaça** de cada um:

- **A distância:** quanto mais perto, mais ameaça, em curva (de perto a diferença pesa mais); zero na vista larga (28 m).
- **Quem está batendo nela:** cada ponto de dano que ela leva soma ameaça a quem atirou; essa soma esvazia em uns 4 s.
  Com a Lara a 1,5 m e o Matheus a 4 m, uns 7 tiros seguidos de pistola (1,4 s) puxam a Mãe para o Matheus; parado,
  ela volta para a Lara uns 8 s depois. O tiro no Mestre não fere, mas puxa o foco dele do mesmo jeito.
- **Sem ficar trocando:** só troca quando o outro passa com 15% de folga e depois de 2 s no alvo atual. Pesa a cada
  0,25 s, não a cada quadro.
- Quem caiu não é alvo. Quem ela não vê (atrás de parede) vale a metade; as Gralhas não olham (voam por cima, e são
  muitas: a linha de visão é cara).
- A bicada da Gralha pega quem estiver perto do bico; a garra da Mãe e a mordida do Mestre, só o alvo. A lamparina
  erguida de qualquer um afasta o Mestre.

**Com um jogador só nada muda**: o único alvo é sempre o agente. Os Sombrios da Demo · Intro (`enemies/luta.ts`)
continuam com um alvo só: não estão na mansão.

**Sem rede:** no Testar, **L** põe a Lara parada 2,5 m à frente do agente (ou tira); ela leva golpe, cai e levanta.

## Como testar

- **Duas janelas lado a lado** (ou dois computadores): o navegador não desenha a aba escondida, e o mundo do host para
  junto com ela (o convidado vê os fantasmas parados). Por isso não serve testar com duas abas na mesma janela.
- `npm run dev` nos dois (ou o mesmo endereço aberto nos dois), Modo desenvolvedor → Teste online.
- Pelo console: `provas.rede()` dá a conexão (o papel, o código, o ping; `provas.rede().ouvir('pose', fn)` conta as
  mensagens), `provas.foco()` diz quem cada entidade caça e a ameaça de cada jogador, `provas.fase().jogadores` os dois.
- **O que já foi conferido** (21/nov, duas abas no mesmo navegador, alternando a da frente): criar e entrar; o código
  errado ("Nenhuma sessão com esse código."); os dois se veem e andam; a porta que um abre abre no outro; a Lara mata uma
  Gralha com tiros (o host decide e o estouro chega nela); a Mãe do host caça a Lara, ataca e a vida dela cai; a Lara
  cai e volta no começo; o Mestre grita e as 3 Gralhas do corvo aparecem no convidado e bicam a Lara; sair pelos dois
  lados; a página do host recarregada (o convidado vê "A conexão caiu." na hora). **Não deu para conferir no painel:**
  o tiro de verdade pelo mouse (o painel não trava o cursor); a bala que chega pela rede foi testada mandando a
  mensagem à mão, sem erro.

## O que conflita com o que já está decidido

- **A luta do berçário** (o berço, o tornado, as quatro barras) é feita para um. No teste ela não entra; ajustar para
  dois só se o teste virar modo de jogo.
- **O terror** vem de estar sozinho. Para um teste não importa; para um modo de verdade, é a primeira coisa a decidir.
- **O desempenho:** um personagem a mais na cena e o envio do estado. Medir com `/desempenho` numa sessão de verdade.
- **O HUD, a câmera e as cenas** continuam de um jogador só (cada um vê o seu).

## As etapas

1. ~~**O sistema de foco**, sem rede~~ (feito em 21/nov).
2. ~~**A conexão:** o menu Teste online, o código, os dois andando na mansão~~ (feito em 21/nov).
3. ~~**As portas, os tiros e a vida**~~ (feito em 21/nov).
4. ~~**As Gralhas e o Mestre** sincronizados, com o foco~~ (feito em 21/nov).
5. ~~**A Mãe**~~ (feito em 21/nov).

## Em aberto

- O que acontece quando os dois caem: hoje cada um volta no começo sozinho; um levantar o outro fica para um modo de
  verdade.
- Se o teste der certo: vira modo cooperativo de verdade, e com que história (a Lara como parceira do Matheus).
- Reconectar quando cai (hoje a sessão acaba) e mais de dois jogadores: só se virar modo de verdade.

## As demos a dois (26/nov)

Pedido em 26/nov: as duas demos (a Intro e a Inimigos) passam a ter **um lobby** e podem ser jogadas com um amigo, com a
conexão deste teste.

- **O lobby** (`src/screens/Lobby.tsx`): Novo jogo → a demo → o lobby dela: **Começar** (sozinho), **Convidar amigo**
  (abre a sessão e mostra o código) ou **Entrar com código** (o amigo digita no lobby da demo). Juntos no lobby, o host
  (o Matheus) aperta Começar e os dois entram; o convidado (a Lara) espera. Caiu a conexão, cada um volta ao lobby com o
  motivo. Sozinho, a demo é a mesma de antes.
- **Decidido para a luta a dois:**
  - **Quem cai precisa ser levantado:** fica no chão até o outro chegar perto e segurar uma tecla; se os dois caírem, a
    horda (ou a onda da arena) recomeça.
  - **Os inimigos ganham mais vida** com dois jogadores (o quanto: a decidir jogando; ponto de partida, 50% a mais).
  - O host manda nos inimigos (como os fantasmas da mansão): a inteligência, os golpes, as hordas; o convidado copia.

### As etapas

1. ~~**O lobby nas duas demos**~~ (feito em 26/nov). A dois, os dois entram no mapa, se veem, atiram e abrem portas, mas
   ainda sem os inimigos (a linha no alto avisa).
2. ~~**A Demo · Inimigos a dois**~~ (feita em 26/nov):
   - **O host roda tudo** (o roteiro das hordas e os espectrais: `entidades/Espectrais.tsx`) e manda ao convidado **o
     retrato** (15/s: o tipo, onde, o giro, o tamanho, fraco, a força da captura) e **os instantes** (`espEv`: nasceu e como,
     o golpe que começou, levou tiro, estourou, saiu ou foi capturado, a bola da Asa, a bomba e o teletransporte do Asa do
     terror, a horda limpa); e **a linha da horda** (`roteiro`).
   - **O convidado copia** (`entidades/EspectraisCopia.tsx`): cada espectral nasce do jeito certo, desliza até o retrato e
     anima ali com a velocidade que andou e os golpes que chegam; os sons e os efeitos tocam nele; as bolas e as bombas
     voam nele só como imagem (o dano é o host que manda). Quem perdeu o aviso de que um nasceu (entrou atrasado, a aba
     estava escondida) monta a cópia pelo retrato.
   - **O tiro do convidado** que pega numa cópia vira um pedido (`acertoE`); o host aplica como se fosse dele.
   - **Cada espectral da horda vai atrás do jogador mais perto** (escolhe de novo a cada 0,5 s; quem caiu não conta). O golpe
     no convidado vai pela rede (`ferido`; o agarrão do Manto também segura: `lento`). As bolas e as bombas pegam os dois.
   - **A vida dos espectrais é 1,5 vez** a dois (`entidades/numeros.ts`, `DOIS`).
   - **Levantar:** a dois, quem cai fica no chão (a tela escurece um pouco) até o outro chegar a 1,6 m e **segurar E por 2 s**;
     levanta no lugar com metade da vida e 1,5 s invulnerável (`player/numeros.ts`, `LEVANTAR`; mensagem `levanta`). Os dois
     caídos por 2,5 s: o host manda os dois voltarem ao começo (`voltar`) e a horda recomeça. Vale também para o teste
     online da mansão. Ainda sem a animação de levantar: ele fica de pé de uma vez.
   - **Conferido** (26/nov, duas abas no painel, que estava escondido e quase não desenhava): a linha da horda chega ao
     convidado; o host invoca a Sombra, o Manto e o Asa do terror e as três cópias nascem no convidado, com a vida a dois
     (Manto 675, Asa do terror 600); o tiro do convidado tira 100 do Manto no host e mata a Sombra, que estoura e sai do
     convidado; a horda limpa some no convidado. **Não deu para conferir aqui:** o retrato andando, os golpes nas cópias, o
     dano chegando no convidado e o levantar (dependem dos quadros das duas abas desenhando juntas: duas janelas lado a lado).
3. **A Demo · Intro a dois:** o mesmo para os Sombrios, os tornados e o Devora almas. ← a próxima
