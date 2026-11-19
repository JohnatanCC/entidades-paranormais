---
name: teste-de-jogo
description: Transforma as anotações de uma partida (do desenvolvedor ou de alguém de fora) num relatório organizado, com as falhas, o que confundiu, o que funcionou e as tarefas separadas por tipo. Também dá um roteiro em branco para quem vai testar. Use quando ele colar ou apontar anotações de teste, contar como foi uma partida, ou pedir um roteiro para os testes com pessoas de fora.
argument-hint: "[roteiro | anotações coladas ou o caminho do arquivo]"
---

# O relatório de um teste

Os testes com 3 a 5 pessoas que nunca jogaram fazem parte da fase B (`docs/lancamento.md`): sem explicar nada, anotando
onde elas travam ou desistem.

## `roteiro`: antes do teste

Entregue um roteiro curto, em português, para ele imprimir ou deixar aberto ao lado de quem joga:
- Quem jogou, quando, em qual aparelho e navegador, com qual nível de qualidade, e qual parte do jogo.
- O que observar **sem ajudar**: os primeiros 5 minutos, onde a pessoa trava, o que ela tenta e não dá, onde ela se
  assusta, onde ela desiste.
- Os números para anotar: o tempo até cada parte, quantas vezes caiu, onde caiu.
- As três perguntas no final: o que foi mais legal, o que irritou, o que não entendeu.

Não grave arquivo; só mostre o roteiro.

## Com as anotações: depois do teste

1. Leia as anotações inteiras. Leia também o doc da parte jogada (`docs/jogo.md`, `docs/cenas.md`,
   `docs/mansao-cap1.md`, etc.) para saber a intenção.
2. Organize:
   - **Falhas** (travou, caiu do mapa, o som sumiu, os quadros despencaram): o que aconteceu, onde, e se dá para repetir.
     Falha não é "o que achou ruim": é o jogo fazendo algo errado.
   - **O que confundiu ou irritou:** como o jogo é sentido, não os defeitos.
   - **O que funcionou:** para não estragar ao mexer.
   - **O que contraria o que foi decidido nos docs:** por exemplo, um susto planejado que ninguém notou. Aponte o trecho
     do doc.
3. Separe as tarefas por tipo: **corrigir** (as falhas), **ajustar números** (vida, dano, tempos: os `numeros.ts`),
   **mudar o desenho** (vira pergunta para ele, porque muda o que foi decidido) e **polimento**. Em cada uma, diga o
   tamanho e qual etapa de `docs/lancamento.md` ela toca.
4. Termine com as **3 prioridades**: o que mais atrapalha quem joga pela primeira vez.

Não comece a corrigir nada: ele escolhe o que entra e quando, uma etapa por vez. Se ele quiser guardar o relatório,
pergunte onde; a sugestão é `docs/testes/<data>-<quem>.md`, e a pasta só nasce no primeiro relatório guardado.
