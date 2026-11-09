# Criador de mapas

O primeiro passo do projeto de verdade: um editor de mapas dentro do próprio jogo, inspirado no modo construção do The Sims 4. Por enquanto ele serve só para você montar os mapas (o primeiro será a mansão nova); no futuro pode virar ferramenta para os jogadores. É um plano para aprovar.

## As decisões

| Tema | Decisão |
| --- | --- |
| Projeto | Novo, em Vite + React + TypeScript + React Three Fiber, no GitHub. Nome do jogo a definir |
| Onde o mapa fica | Arquivos JSON dentro do projeto, na pasta `maps/`. Rodando no seu computador (`npm run dev`), o botão Salvar grava direto nela; o jogo lê a pasta e carrega o mapa |
| Blocos | O mapa é dividido em blocos de 16 × 16 m, como os chunks do Minecraft. Cada bloco é um arquivo; o jogo carrega os blocos perto do jogador e solta os longe |
| Grade | Paredes nas linhas de uma grade de 1 m. Objetos encaixam a cada 0,25 m |
| Rotação | A cada 15°; com uma tecla, a cada 45° e 90°. Modo livre por objeto: solta da grade e gira para qualquer lado |
| Andares | Camadas com altura fixa de 3,5 m. A camada 2 nasce em cima da 1 |
| Paredes | Automáticas: arrastar numa linha faz uma parede reta; arrastar um retângulo faz a sala com as quatro paredes |

## O que o mapa guarda

- **Paredes:** pedaços de 1 m nas linhas da grade. Cada lado tem a sua textura, e embaixo uma barra (lambri) com outra textura e altura, como na mansão de hoje.
- **Pisos:** por quadrado de 1 m, com duas faces: a de cima é o piso do andar; a de baixo é o teto do andar de baixo.
- **Portas:** comum, dupla, grande (como a da mansão) ou só um vão na parede, cada uma com a sua textura.
- **Janelas:** normal ou grande, com a luz 2D ligada ou desligada.
- **Escadas:** você marca a área na grade, escolhe a direção e a altura; os degraus se montam sozinhos e o piso de cima ganha o buraco.
- **Objetos:** a peça do catálogo, a posição, a rotação e as opções dela (a lâmpada: normal, falhando ou apagada).
- **Detalhes:** quadros na parede, sujeira e manchas no chão e na parede.
- **Pontos:** um lugar reservado para os scripts (gatilhos, cenas, nascimento de monstros), que vêm depois.

## A tela do editor

- **Menu do jogo:** Novo jogo (desabilitado), Configurações, Modo desenvolvedor. No Modo desenvolvedor: Criador de mapas e Editor de modelos (desabilitado por enquanto).
- **Câmera:** vista de cima que gira e aproxima, como no The Sims. Mostra o andar atual; os de cima somem; as paredes podem ficar inteiras, cortadas ou baixas.
- **Ferramentas:** selecionar, parede, piso, pintar, porta e janela, escada, objetos, luz, detalhes e apagar.
- **Painel do lado:** as opções do que está selecionado (textura de cada lado, tipo de porta, modo da lâmpada, rotação livre).
- **Sempre à mão:** desfazer e refazer (Ctrl+Z e Ctrl+Y), salvar, abrir, trocar de andar e **Testar**, que solta o Matheus no mapa para andar nele na hora.

## O que já existe para reaproveitar

- **As texturas:** as da mansão (papel de parede, lambri, assoalho, forro) e as da Intro (bloco, azulejo, concreto, chapa, granilite).
- **As paredes com barra embaixo** e a textura diferente de cada lado (Intro).
- **As lâmpadas** com os três modos, os cones e as poças de luz 2D, os feixes das janelas.
- **Os objetos:** móveis da mansão e os da Intro (mesas, armários, monitores, caixas, canos, geradores). Cada um vira uma peça do catálogo.
- **A junção das malhas** depois de montar, que deixa o mapa leve.
- **O agente:** câmera, controle, colisão e o HUD novo, para o botão Testar.

## As etapas

Cada etapa vira uma versão que você testa antes da próxima.

1. **A base do projeto.** O repositório, a estrutura, o menu, as configurações (filtro retrô, volume, sensibilidade do mouse) e a leitura da pasta de mapas.
2. **A grade e as paredes.** A câmera do editor, os andares, as paredes automáticas (reta e sala), apagar, salvar e abrir o JSON, desfazer e refazer.
3. **Pisos, tetos e texturas.** As duas faces do piso, a pintura de cada lado da parede com a barra de baixo, o catálogo de texturas.
4. **Portas e janelas.** Os quatro tipos de porta e os dois de janela, com a luz 2D.
5. **Escadas.** Retas, montadas sozinhas a partir da área e da altura.
6. **Objetos e detalhes.** O catálogo, o encaixe e a rotação, o modo livre, as lâmpadas com os três modos, os quadros e a sujeira.
7. **Testar e os blocos.** O Matheus andando no mapa com colisão e luz; o carregamento por blocos e a junção das malhas por bloco.
8. **A mansão nova.** Você monta a planta no editor; eu ajusto o que faltar.

Depois do mapa: os scripts (gatilhos, cenas, nascimento de monstros) e, mais tarde, o Editor de modelos.

## Fica de fora agora

- Publicar mapas num servidor para outros jogadores.
- Escadas em L, em U ou curvas (a da entrada da mansão vem numa segunda leva).
- Altura de andar diferente por andar. Um salão com pé-direito duplo sai sem isso: sem piso no andar de cima e paredes nos dois andares.
- O Editor de modelos: quando vier, ele monta objetos de cenário com peças simples e ajusta os fantasmas (cores, tamanhos, partes), sem esculpir malha.
- Trazer os fantasmas e as lutas do laboratório: entram depois do mapa.
