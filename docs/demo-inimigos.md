# A Demo · Inimigos

Pedida em 26/nov: uma demo de luta com os inimigos do jogo novo (os espectrais, `docs/demonios.md`), no **Novo jogo →
Demo · Inimigos**. O roteiro em `src/chapters/demo-inimigos/` (os números em `numeros.ts`), o mapa em
`maps/demo-inimigos/`.

## O que foi decidido

- **A arena:** um salão da mansão, largo e alto: 24 × 24 m, o teto a 7 m (o segundo andar existe só para o teto ficar
  lá em cima: sem escada nem piso no meio; as arenas do jogo vão ser assim, espaçosas em largura e altura). Uma coluna
  de mármore de 2 × 2 m em cada canto, a 3 m das paredes. Papel de parede vinho com lambri, taco no chão, cinco lustres
  no teto, duas arandelas em cada parede e as janelas altas com o luar (o feixe desce os dois andares até o chão:
  `luarAndares: 2`, a opção "O feixe desce até · O andar de baixo" no painel da janela). Ambientação: a da mansão. Dá para mexer no
  criador de mapas.
- **Por hordas fixas**, cada vez mais fortes; vencida a última, a demo acaba. Cada horda limpa dá um kit. Caindo, o
  agente volta no começo e **a horda recomeça do zero**.
- **Entram todos os espectrais** criados: a Sombra espectral, a Asa espectral, o Devora espectros, o Manto espectral e
  o Asa do terror. O Devora (e, quando entrarem, o Manto e o Asa do terror) é fantasma: conta até ser **capturado com a
  lamparina**.
- Os da horda **nunca perdem o foco** nem voltam para casa: caçam até o fim.
- A primeira horda espera o clique para jogar. A tecla **H** (de teste) destrói a horda.
- **A dois** (26/nov; o lobby e as regras em `docs/teste-online.md`): o host roda as hordas e o convidado copia; os
  espectrais vão atrás do mais perto e têm 1,5 vez a vida; quem cai é levantado pelo outro (segurando E); os dois caídos,
  a horda recomeça.

## As hordas (por enquanto)

| Horda | Sombra | Asa | Grande | Aprimorados de certeza |
|---|---|---|---|---|
| 1 | 3 | — | — | — |
| 2 | 3 | 2 | — | — |
| 3 | 2 | 2 | Manto espectral | — |
| 4 | 3 | 2 | Devora espectros | — |
| 5 | 2 | 2 | Asa do terror | — |
| 6 | 3 | 2 | Manto espectral e Asa do terror | 2 |

Os outros têm a sorte de sempre de nascer aprimorados (5%). Surgem um a cada 0,7 s, nos pontos longe do agente (o
grande no mais longe); 3 s de aviso antes de cada horda e 5 s de pausa entre elas.

## Como funciona por dentro

O roteiro invoca pelos espectrais do Testar (`game/entidades/Espectrais.tsx`, pelo `fase.espectrais`: invocar num
ponto, quantos restam, tirar todos), sem caixas no mapa. A mesma inteligência, os mesmos sons e a mesma captura das
caixas de espectrais.

## As etapas

1. ~~A arena e as hordas com a Sombra, a Asa e o Devora espectros~~ (feita em 26/nov).
2. ~~A inteligência do Manto espectral e ele nas hordas~~ (feita em 26/nov: agarrar, o combo de socos, o golpe giratório
   com 30% da vida, atordoado, fraco e a captura; `docs/demonios.md`).
3. ~~A inteligência do Asa do terror e ele nas hordas~~ (feita em 26/nov: longe do agente, a bomba a cada 6 s, as 3 com 30%
   da vida, o teletransporte com o aviso, fraco e a captura; `docs/demonios.md`). As hordas passaram a 6.

O que pode vir depois (ninguém pediu ainda): os três fantasmas grandes na aba Entidades do criador de mapas; mais de um
Asa do terror ao mesmo tempo (a bola de luz da carga é uma só para todos).
