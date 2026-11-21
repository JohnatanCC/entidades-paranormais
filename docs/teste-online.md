# O teste online (para depois do lançamento)

Ideia de 21/nov, **só no papel**: não entra antes do capítulo 1 estar no itch.io (`docs/lancamento.md`). É um teste
de desenvolvedor, não um modo de jogo: serve para saber se dois jogadores na mesma sessão funcionam, antes de pensar
num servidor.

## O que é

- No **Modo desenvolvedor → Teste online**: *Criar sessão* (o host recebe um código curto para mandar) ou *Entrar com
  código* (o convidado digita e entra).
- O mapa é a mansão do capítulo 1 (`maps/mansao-cap1`), com os fantasmas espalhados pela aba Entidades (a Mãe, o
  Mestre, as Gralhas) e o que mais o mapa tiver.
- **O jogador 1 (o host) é o Matheus; o 2 é a Lara** (`montarAgente('lara')`, o mesmo esqueleto do agente).
- **As mecânicas são as mesmas** do jogo sozinho: andar, correr, esquivar, as duas armas, a lamparina, os kits, a queda
  e a volta no checkpoint. Sem cenas, sem roteiro de capítulo.
- Só PC, só dois jogadores, sem reconexão: caiu a conexão, a sessão acaba.

## Como funciona a conexão

- **Um jogador ligado direto ao outro** (WebRTC, pelo navegador). Para os dois se acharem precisa de um servidor
  pequeno de apresentação; o código da sessão é o endereço do host nele. Em algumas redes precisa também de um servidor
  que retransmite (TURN). **Em aberto:** qual biblioteca (PeerJS ou Trystero) e qual servidor de apresentação; é uma
  dependência nova no `package.json`, então decidir junto antes.
- **O host manda no mundo:** só ele roda a inteligência dos fantasmas, decide quem acertou quem, a vida de todos e as
  portas. Envia o estado ao convidado umas 15 a 20 vezes por segundo, e o convidado suaviza entre um envio e outro.
- **O convidado manda só nele mesmo:** move a Lara na hora (sem esperar o host, para o controle não ficar mole) e
  envia a posição, a pose e o que fez (atirou daqui para lá, abriu a porta, usou o kit). Quem decide se o tiro acertou
  é o host.
- Cada um tem a sua câmera, o seu HUD e o seu som (o ouvido é a câmera de cada um).
- Os sorteios que mudam a luta (a inteligência, os golpes) só acontecem no host; os de enfeite (faíscas, penas,
  fumaça) cada um sorteia o seu.
- Quando vier um servidor de verdade, ele toma o lugar do host. Para isso a regra do jogo precisaria rodar sem tela,
  separada do desenho: é o maior trabalho dessa mudança e fica para quando chegar.

## O sistema de foco (quem o fantasma ataca)

Hoje cada criatura conhece um alvo só (`src/game/enemies/luta.ts`: "o alvo (o agente)"). Com dois, cada uma escolhe
um alvo pela **ameaça** de cada jogador:

- **A distância:** quanto mais perto, mais ameaça.
- **Quem está batendo nela:** cada dano que ela leva soma ameaça a quem atirou; essa soma esvazia com o tempo. Quem
  ataca sem parar puxa o foco; quem para de atacar perde aos poucos.
- **Sem ficar trocando:** ela só troca de alvo quando o outro passa com folga (por exemplo, 30% a mais) e depois de um
  tempo mínimo no alvo atual. Sem isso ela fica virando de um lado para o outro.
- Quem caiu não é alvo. Quem ela não vê (atrás de parede) conta menos.
- Os números (o peso da distância, do dano, o esvaziar, a folga, o tempo mínimo) ficam no `numeros.ts`, um conjunto
  comum em `enemies/` e, se precisar, um ajuste por criatura.

**Com um jogador só nada muda**: o único alvo é sempre o agente. Por isso esse sistema pode ser feito antes da rede e
testado no jogo de sempre.

## O que conflita com o que já está decidido

- **Um agente só no código:** a caça da Mãe, o rodeio das Gralhas, o Mestre, a câmera, a queda e o checkpoint, o HUD e
  o `AgenteNaFase` contam com um agente. O sistema de foco resolve o lado dos fantasmas; o resto precisa aceitar uma
  lista de jogadores.
- **A luta do berçário** (o berço, o tornado, as quatro barras) é feita para um. No teste ela roda como está; ajustar
  para dois só se o teste virar modo de jogo.
- **O terror** vem de estar sozinho. Para um teste não importa; para um modo de verdade, é a primeira coisa a decidir.
- **O desempenho:** um personagem a mais na cena e o envio do estado. Medir com `/desempenho` quando chegar.

## As etapas (cada uma termina numa versão para testar)

1. **O sistema de foco**, sem rede: `luta.ts` com uma lista de alvos e a ameaça; um segundo agente parado no Testar
   (uma tecla de depuração) para ver a troca de foco.
2. **A conexão:** o menu Teste online, o código, os dois andando na mansão, sem fantasmas.
3. **As portas, os tiros e a vida:** o convidado atira e o host decide; os dois podem cair e voltar.
4. **As Gralhas e o Mestre** sincronizados, com o foco.
5. **A Mãe.**

## Em aberto

- A biblioteca e o servidor de apresentação (e se precisa de TURN pago).
- O que acontece quando os dois caem: cada um volta no checkpoint sozinho, ou um pode levantar o outro.
- Se o teste der certo: vira modo cooperativo de verdade, e com que história (a Lara como parceira do Matheus).
