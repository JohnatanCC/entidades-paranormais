---
name: lancamento
description: Confere se o jogo está pronto para ir ao itch.io (versão web) e diz o que falta, com um veredito "pronto / pronto com ressalvas / não pronto". Use quando o desenvolvedor pedir a lista do lançamento, perguntar se dá para publicar ou terminar a fase C ou D de docs/lancamento.md.
argument-hint: "[rascunho | publico]"
---

# Pronto para o itch?

O plano do lançamento está em `docs/lancamento.md` (as fases A a D). Esta conferência olha **o estado de agora** contra
esse plano, e não inventa exigências que o doc não tem. `rascunho` confere o envio como rascunho no itch (só quem tem o
link vê); `publico`, ou sem argumento, confere a abertura ao público, que também pede a página e os números de sucesso.

## O que conferir

Para cada item, diga como você conferiu (o comando, o arquivo, o que encontrou). Um item que você não conseguiu conferir
fica marcado **não conferido**. Nunca marque como "ok" o que não foi olhado: uma busca que não achou nada só vale se a
pasta existe e foi lida.

1. **O jogo de ponta a ponta:** as etapas da fase A marcadas como feitas em `docs/lancamento.md`. O que estiver aberto
   em "Em aberto" e bloquear o capítulo entra como pendência.
2. **A versão web (fase C):**
   - `npm run build` passa sem erro.
   - `base: './'` no `vite.config.ts`.
   - `npx vite preview` abre o `dist/` e o jogo carrega sem erros no console. Confira no navegador do app, do menu até o
     começo do capítulo 0.
   - Nada de desenvolvedor na versão publicada: o Modo desenvolvedor no menu, a tecla H, o F2, o F4. Procure no código o
     que só deveria existir com `import.meta.env.DEV`.
   - As fontes vêm de dentro do jogo, não do Google Fonts.
   - O tamanho do `dist/` (o total e os maiores arquivos) e quantos arquivos ele tem.
   - Restos no código: `TODO`, `console.log` soltos, textos provisórios na interface.
3. **As licenças:** cada música de `public/musica/` tem a origem anotada e pode ser usada num jogo publicado. As fontes
   são OFL. Diga o que não tem origem conhecida.
4. **O que só o desenvolvedor pode confirmar.** Pergunte uma coisa por vez, e só o que falta:
   - Os testes nos navegadores (Chrome, Edge, Firefox), o mouse travado e a tela cheia dentro do quadro do itch.
   - Os testes com pessoas de fora (fase B).
   - Para o `publico`: a página (a capa 630 × 500, as capturas, o GIF, a descrição, as etiquetas), o idioma e os números
     de sucesso combinados.

## O veredito

- **Não pronto**: algum item que impede jogar, ou que expõe o modo desenvolvedor, ou uma música sem licença.
- **Não conferido**: sem bloqueios, mas com itens que ninguém conferiu ainda.
- **Pronto com ressalvas**: tudo conferido, com pendências pequenas que podem ir depois.
- **Pronto**: tudo conferido e sem pendências.

Mostre a lista em português, curta, agrupada pelas seções acima, com as pendências em ordem do que bloqueia mais, e diga
o que fazer primeiro. Não grave arquivo nenhum sem perguntar. Se ele quiser guardar, a lista vai para
`docs/lancamento.md`, numa seção "Conferência de <data>", e não num arquivo novo.
