# A direção do capítulo 0: a abertura

Decidido em 19/nov, numa entrevista com o desenvolvedor. É a referência do capítulo 0: o mapa, as cenas, os fantasmas, a
luz e o som são conferidos contra esta página. Os detalhes de cada parte ficam nos docs de sempre (`docs/cenas.md`, as
cenas; `docs/lancamento.md`, a ordem do lançamento); onde discordarem, vale esta página.

## O que o capítulo 0 é

**O Matheus aprende que não dá para fazer tudo sozinho, e aprende do pior jeito.** Ele ganha uma equipe que não quer,
prova que é bom capturando os fantasmas que fugiram, e no Palacete ignora a Lara, liga a máquina antes da hora e puxa os
três para o submundo. O capítulo 1 começa com ele sozinho, separado da equipe por culpa dele.

Os três pilares (tudo no capítulo serve a pelo menos um):
1. **O Matheus fechado:** "eu sempre me virei sozinho" (a cena 1) é o defeito que custa caro no fim.
2. **Aprender a jogar sem perceber:** uma coisa nova por lugar, cada uma com um motivo na história.
3. **O medo que cresce:** a instalação, que devia ser segura, não é; o Palacete, quieto, é pior; o portal explode tudo.

**A gameplay é solo** (por limitação; pode mudar). A Lara e o Nicolas estão nas cenas e no rádio, sem IA de combate.

## A sequência

| # | Parte | O que o jogador faz | O que aprende | O que sente |
| --- | --- | --- | --- | --- |
| 1 | **Cena 1: o escritório do Victor** (feita) | Assiste | Quem é o Matheus; a equipe fixa | Curiosidade, um peso |
| 2 | **Cena 2: o alarme** (feita) | Assiste | Algo escapou da contenção | Tensão |
| 3 | **Cena 3: o elevador** | Assiste: a equipe se encontra e decide dividir o andar | Lara e Nicolas; o rádio | Atrito leve, humor do Nicolas |
| 4 | **O corredor** | Anda e corre até os campos de pesquisa | Andar, correr, a câmera, abrir portas | Estranheza: tudo largado |
| 5 | **Os campos de pesquisa** | Os primeiros fantasmas pequenos | Mirar, atirar; o pequeno estoura | Susto, depois controle |
| 6 | **O refeitório** | Vários pequenos de uma vez | Esquivar, recarregar, o kit | Pressão |
| 7 | **A contenção** | O Glutão: enfraquecer e capturar | A barra de vida do chefe, a poça, a captura com a lamparina | Vitória: ele é bom nisso |
| 8 | **Cena 4: a missão** | Assiste: a C.R.O.S. manda os três ao Palacete Monteval, onde há uma ruptura se abrindo | O objetivo; o detector | "Agora é sério" |
| 9 | **O Palacete** | Anda pela casa real com o detector, de 5 a 10 minutos, sem luta | Seguir o detector pelo som | Silêncio, espera, medo |
| 10 | **Cena 5: o portal** | Assiste: a Lara prepara a máquina; o Matheus não espera e liga antes da hora; a ruptura suga os três | | Culpa, queda |
| 11 | **O título** e o menu do capítulo 1 | | | |

**No Palacete, o jogador anda na mesma planta da mansão do capítulo 1**, com a luz de casa real: ele conhece a casa antes
de vê-la distorcida. **Cada capítulo é um mapa só, carregado de uma vez** (decidido pelo desenvolvedor: nada de carregar
de novo ao trocar de lugar), então o Palacete fica **dentro do `instalacao-cap0`**, solto, longe da instalação: uma cópia
da planta de `mansao-cap1`. Mudou a planta da mansão? Mude nas duas.

## A planta da instalação (aprovada em 19/nov)

O mapa já existia (das cenas 1 e 2): é um anel de corredores em volta do refeitório, dos campos de pesquisa e do
almoxarifado, com a contenção a leste. O tutorial segue um caminho que não volta atrás, e as portas fora dele ficam
trancadas pelo roteiro ("Acesso restrito"):

| # | Lugar | O que acontece |
| --- | --- | --- |
| 1 | O hall do elevador | A cena 3; os armários de aço do hall dão a pistola e a lamparina |
| 2 | O corredor oeste | Andar, correr, a câmera |
| 3 | O refeitório | Os pequenos, um de cada vez: mirar e atirar |
| 4 | O corredor norte | Correr; pelas janelas, os fantasmas nos campos antes de entrar |
| 5 | Os campos de pesquisa | Vários de uma vez: esquivar, recarregar, o kit |
| 6 | A sala de controle e o corredor de contenção | O Nicolas pelo rádio; um respiro antes do chefe |
| 7 | A contenção | O Glutão |

**As melhorias:**
- **Salas exploráveis e salas só com a porta:** o **vestiário** fica explorável, fora do caminho, com um kit e uma pista
  (o armário com o nome do antigo parceiro, trancado: o mistério sem resposta). O arsenal, o estande de tiro e o
  almoxarifado ficam só com a porta trancada e perdem o interior: menos para desenhar e para decorar.
- **O refeitório dividido** por uma parede no meio: o refeitório fica com 14 × 14 m (a metade com as mesas) e a metade sul
  fecha.
- **A trilha de ectoplasma** no chão e nas paredes, do hall à contenção: guia sem seta e conta que algo passou por ali.
- **Os corredores com ritmo:** luminárias apagadas e piscando, caixas caídas, uma porta entreaberta (hoje são 94
  luminárias e 76 canos iguais, em fila).
- **Colunas ou máquinas na contenção,** para circular em volta do Glutão.
- **O escritório do Victor e a sala ao lado** ficam como estão: são das cenas.

## As decisões

- **Os fantasmas que fugiram:** o **Glutão** (o maior, capturado) e alguns **pequenos** (estouram com tiro). Os dois mais
  simples do que no laboratório, com um **desenho novo**, que o desenvolvedor faz.
- **O tutorial é linear e curto** (de 10 a 15 minutos): uma coisa nova por lugar, na ordem da tabela. A Lara e o Nicolas
  dividem o andar com o Matheus ("vamos nos separar") e ajudam pelo rádio.
- **O detector de fontes paranormais:** na mão, pelo som. O Matheus segura o aparelho, um modelo novo no Blockbench, e
  ele **bipa mais rápido perto da fonte**, como um contador Geiger, com um ponteiro que se vê na mão. Sem HUD novo. Serve
  também no capítulo 1, para achar os objetos da Mãe.
- **O Palacete conta a Mãe por pistas no caminho,** sem texto longo: as fotos da família Monteval, a porta do berçário
  trancada, um armário aberto, a cantiga ao longe. O detector passa por elas.
- **A falha é do Matheus:** ele não escuta a Lara e liga a máquina antes da hora.
- **O antigo parceiro fica como mistério:** o capítulo 0 só toca no assunto (a foto, talvez uma fala pelo rádio). Decidir
  quem era antes do capítulo 2.

## O clima: contraste

| Parte | Luz | Som |
| --- | --- | --- |
| A instalação | Fria, dos tubos fluorescentes, cortada pelo vermelho do alarme | A sirene ao longe; música só nas lutas |
| O Palacete | O luar pelas janelas e a lamparina; o resto no escuro | Silêncio: só a casa (madeira, vento, relógio) e os bipes do detector; a cantiga, longe |
| O portal | Tudo explode: a luz da ruptura | O som cresce até cortar no preto |

## A ordem de construir: em cinza primeiro

Para não refazer: **nada ganha arte antes de ser jogado em cinza.**

1. **Este roteiro no papel** ✅ (19/nov).
2. **A planta da instalação jogável** ✅ aprovada (19/nov, acima). Falta passar para o mapa: os cortes, a parede do
   refeitório, as portas trancadas. E o Palacete: a cópia da planta da mansão, solta no mesmo mapa.
3. **As mecânicas novas, com peças provisórias:** a **captura** (a poça e a lamparina; antes estava marcada para o
   berçário, agora é do tutorial), os fantasmas pequenos e o Glutão como blocos simples, o detector como uma caixa com som,
   o rádio com legendas.
4. **Jogar o capítulo de ponta a ponta em cinza,** com as cenas 3 a 5 ainda como cartões de texto. Ajustar até ficar bom.
5. **Só então a arte:** os fantasmas novos (o desenvolvedor), o detector, a decoração da instalação e do Palacete, a luz,
   as cenas 3 a 5 com câmera.

## O que é novo

- **Cenas:** a 3 (o elevador), a 4 (a missão) e a 5 (o portal), com storyboard em `docs/cenas.md` antes de construir.
- **Mecânicas:** a captura, o detector, o rádio no jogo (as falas da Lara e do Nicolas como legendas durante a partida),
  os roteiros do tutorial (as portas que abrem quando cada parte acaba).
- **Modelos:** os fantasmas pequenos, o Glutão novo, o detector, a máquina que fecha o portal.
- **Mapa:** os ajustes da planta acima; o Palacete dentro do mapa do capítulo; a ambientação "casa real" dele.

## Em aberto

- **Quem dá a missão** na cena 4: o Victor de novo, ou a central pelo rádio.
- **A máquina que fecha o portal:** como ela é e o que a Lara faz para preparar.
- **A entrada do Palacete:** de carro até o alpendre, ou já dentro de casa.
- **O tamanho do caminho no Palacete:** quais cômodos o detector percorre (a planta em `docs/mansao-cap1.md`).
