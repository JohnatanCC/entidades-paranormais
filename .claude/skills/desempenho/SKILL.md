---
name: desempenho
description: Mede o desempenho de uma cena do jogo (quadros por segundo, chamadas de desenho, triângulos, memória, lâmpadas com sombra) no navegador, acha os gargalos e propõe as correções em ordem de ganho. Use quando o jogo ficar lento, antes de fechar uma etapa que pôs coisas novas na cena, ou quando o desenvolvedor pedir para otimizar.
argument-hint: "[cena ou sistema: mansao | cap0 | mae | demonios | luz | tudo]"
---

# Onde o jogo pesa

A regra do projeto é rodar em qualquer aparelho atual, celular incluído, e o nível **Baixo** tem que ficar liso
(`docs/lancamento.md`, fase B). Primeiro meça, depois otimize: nada de correção sem um número antes e outro depois.

## Medir

1. Abra o jogo no navegador do app (`npm run dev`) e recarregue antes de medir.
2. Use o que o projeto já tem, em vez de montar a medição à mão:
   - `Desempenho.tsx`: os quadros por segundo e, com F3, os desenhos, os triângulos, a memória da placa, o nível e as
     lâmpadas.
   - `TesteDesempenho`, nas configurações: a mansão inteira nível por nível, com a média e o mínimo de quadros.
   - Pelo console: `provas.qualidade()`, `provas.sombras()`, `provas.cena()`, e `renderer.info` pelo `provas.gl()`.
3. Meça cada nível que importa (Baixo, Médio, Alto) no mesmo ponto da cena, parado e andando, e anote. O painel do app
   escondido não desenha: mostre o painel antes de contar quadros.
4. Os números do navegador do app são do PC dele. Diga isso no relatório e peça a ele, passo a passo, o teste num
   notebook ou PC fraco quando o resultado depender disso.

## Achar o gargalo

Compare com o que o `CLAUDE.md` pede ("Otimize sempre") e procure, nesta ordem:
- **Chamadas de desenho:** malhas que deviam estar juntas, cópias que não dividem geometria e material (`instancias.ts`,
  `copiaDoMolde`), um material por peça em vez de um por modelo.
- **Preencher a tela:** passadas de tela cheia fora do `passeFinal.ts`, transparências grandes, a resolução do nível.
- **Luz e sombra:** lâmpadas de verdade além das poucas das sombras (`sombras.ts`), luz que podia ser assada.
- **A cada quadro:** contas refeitas sem precisar, objetos criados dentro do `useFrame` (o coletor de lixo trava o jogo).
- **Memória:** texturas maiores que a escala do projeto (32 px por metro no cenário, 64 nos personagens, 128 no rosto).

## O relatório

Uma tabela curta com o que foi medido (o nível, o lugar, os quadros, os desenhos, os triângulos), e então os gargalos em
ordem de ganho esperado. Para cada um: onde está (`arquivo:linha`), o ganho estimado, o risco e o tamanho do trabalho.
Separe as **correções rápidas** das que mudam algo decidido (a aparência, um nível de qualidade, o formato do mapa):
essas viram pergunta para ele, nunca correção direta. O que só se confirma medindo num aparelho fraco fica marcado assim.

Não corrija nada sem ele escolher. Depois de cada correção, meça de novo no mesmo ponto e mostre o antes e o depois.
