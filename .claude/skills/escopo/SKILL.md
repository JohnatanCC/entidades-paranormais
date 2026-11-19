---
name: escopo
description: Avalia se uma ideia nova cabe no capítulo 1 lançado ou se ele está crescendo além do plano. Compara com docs/lancamento.md, aponta os conflitos com o que já foi decidido (agente, armas, captura, chefes, formato do mapa, celular, desempenho) e diz quanto trabalho ela soma. Use quando o desenvolvedor trouxer uma ideia nova, pedir um recurso fora da etapa atual, ou perguntar se o lançamento ainda está no prazo.
argument-hint: "[a ideia, ou vazio para conferir o capítulo inteiro]"
---

# Cabe no capítulo?

O `CLAUDE.md` pede para avaliar toda ideia nova antes de aceitar, e diz que estabilidade vem antes de recurso novo. O
plano do que entra está em `docs/lancamento.md`: a fase A, as etapas, e a lista do que **fica fora do capítulo 1
lançado**. Esta conferência é só leitura: não muda arquivo nenhum.

## Com uma ideia

1. Diga em uma linha o que a ideia é, do jeito que você entendeu. Se der para entender de dois jeitos, pergunte antes.
2. **Já foi decidido?** Procure nos docs (`docs/*.md`), em especial na lista do que fica fora e nas regras do
   `CLAUDE.md`. Se a ideia traz de volta algo que saiu, diga quando saiu e por quê.
3. **Conflitos:** com as mecânicas decididas (o agente, as armas, a lamparina, a captura, os chefes), com o formato do
   mapa (mudar o formato pede subir o `FORMATO` e escrever a conversão), com o celular e o desempenho, e com as regras do
   conteúdo (sem violência explícita, a morte dos fantasmas).
4. **O tamanho:** quais pastas e arquivos ela toca, se pede modelo novo no Blockbench, som, mapa ou cena, e quantas
   etapas mais ou menos ela soma. Seja concreto: arquivos e etapas, não "parece grande".
5. **A saída:** uma destas, com o motivo:
   - **Entra agora**: é pequena, não conflita e ajuda o capítulo 1.
   - **Entra menor**: proponha a versão menor que dá o efeito principal, e diga o que fica para depois.
   - **Depois do lançamento**: boa ideia, mas não é o capítulo 1. Sugira onde anotar (`docs/lancamento.md`, "Depois do
     itch", ou o doc do capítulo dela).
   - **Conflita**: diga com o quê, e a saída que resolveria.

## Sem argumento: o capítulo inteiro

Compare o que o plano tem com o que o código e o `git log` mostram desde 17/nov (a decisão do lançamento): o que foi
feito, o que entrou sem estar no plano, o que está pela metade. Para cada coisa que entrou fora do plano, diga se ela
tirou algo do lugar ou só somou. Termine com o que parece mais arriscado para terminar o capítulo e o que daria para
cortar sem perder o essencial: a mansão, a Mãe perseguindo, o berçário e a captura.

Nas duas formas, a decisão é dele: aponte, proponha e espere.
