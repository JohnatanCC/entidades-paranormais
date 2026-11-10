# Portando do laboratório

O laboratório (`reference/laboratorio.html`) é um HTML único com Three.js r128, sem módulos, ~15 mil linhas, feito para testar ideias.
**Não copie arquivos inteiros:** traga uma peça de cada vez, como módulo TypeScript, quando a etapa precisar dela.
O laboratório é só referência: nada no projeto importa de `reference/`.

## O mapa dos trechos (em `reference/lab/`)

| Arquivo | O que tem | Linhas no laboratório (v130) |
| --- | --- | --- |
| `00-estilos-da-pagina.css` | Paleta, fontes, HUD, legendas, roda de armas, telas | 5–195 |
| `01-som.js` | Sons sintetizados (WebAudio): passos, tiros, fantasmas, vozes (`SFX.voice`), músicas de tensão e do Glutão | 478–2246 |
| `02-visual-materiais-geometria.js` | Materiais (`mk`), texturas procedurais em canvas, geometrias e utilidades de cena | 2247–2763 |
| `03-espectral-glutao.js` | Os modelos e a animação do Espectral e do Glutão (escala `S.sc`, `AR.hold`) | 5957–6872 |
| `04-numeros-da-luta.js` | A tabela `T` (agente, kits, armas) | 7666–7692 |
| `05-agente-armas-controle-camera.js` | O agente (modelo, cabeça, cabelo com física), as armas, IK dos braços, entrada, câmera por cima do ombro, controle, roda de armas, animação (`animAgent`), efeitos, a armadilha | 8413–9622 |
| `06-hud.js` | O HUD conceito C (`dh-vg`, `dh-kb`, `dh-wg`, `WICON`, `hudGauges`), legendas `SUBS`, avisos | 10178–10547 |
| `07-casa-mansao.js` | A casa: **texturas da mansão** (papel de parede, lambri, assoalho, forro), a casca (paredes por material juntadas em uma malha), portas com dobradiça, **móveis**, feixes de luar das janelas | 10805–12279 |
| `08-intro.js` | A Intro inteira: **texturas da Intro** (bloco, azulejo, concreto, chapa, granilite), portas de correr, luz desenhada (tubos, cone, mancha 2D), móveis e máquinas, ondas, captura por poça, ectoplasma nas portas, Lara e Nicolas (`mateAnim`), cutscenes, o Glutão chefe, avisos de controle | 12280–14093 |
| `09-imagem-pos-processo.js` | Presets de imagem e o shader de pós-processo (já portado em `src/render/RetroRenderer.tsx`) | 14540–14640 |

Os números das linhas servem para achar o contexto no arquivo inteiro (`reference/laboratorio.html`), onde estão as funções auxiliares que os trechos usam.

## As músicas (`reference/ost/`)

Os únicos sons em arquivo; o resto o laboratório sintetiza na hora. A tabela `MUS` (linha ~765) diz o uso e o volume:

| Arquivo | Uso | Volume |
| --- | --- | --- |
| `amb_casa.mp3` | ambiente da casa | 0,6 |
| `tensao.mp3` | tensão (Espectrais por perto) | 0,55 |
| `batalha_mae.mp3` | a luta da Mãe | 0,62 |
| `batalha_espectral.mp3` | a luta dos Espectrais e do Glutão; o laço vai de 0,39 s a 121,2 s | 0,62 |

No jogo elas vão para `public/musica/` e são chamadas por nome, como as texturas.

## O que já foi portado

- Paleta e fontes → `src/styles.css`.
- Filtro de imagem (limpo / suave / PS1: pixels nítidos, cores de 5 bits com pontilhado, vinheta, linhas, granulação) → `src/render/RetroRenderer.tsx`.
- Tremor de vértice do PS1 → `src/render/psx.ts` (`applyPsx(material)`).
- As texturas da casa (`07`) e da Intro (`08`), com os mesmos tamanhos por metro (TILE / ITILE) → o catálogo `src/maps/textures.ts`;
  em 10/nov foram repintadas em pixel como imagens (`texturas/<nome>.png`) e o desenho em canvas saiu. Ficaram de fora as dos móveis e efeitos (lençol, tapete, teia, cortina, chama...): entram com os objetos (etapa 6).
- A "casca" (faces juntadas por material, textura pelo mundo) → `src/editor/wallMesh.ts` (paredes e pisos).

## O que trazer, por etapa do criador de mapas

| Etapa | Trazer de | O quê |
| --- | --- | --- |
| 3. Texturas | `07` (seção "as texturas"), `08` (seção "as texturas"), `02` | As texturas procedurais em canvas viram entradas do catálogo `src/maps/textures.ts` (mesma resolução: 64 px por tile / 128 px por metro). Pode gerar PNGs em `public/texturas/` ou manter a geração em canvas |
| 3. Paredes juntas | `07` "a casca" e "as paredes", `08` "a casca" | A técnica de juntar as faces por material numa malha só (por bloco, no projeto) |
| 4. Portas e janelas | `07` "as portas", "o luar"; `08` "as portas", "a luz desenhada" | Folha que gira na dobradiça, porta de correr, feixe e mancha de luz 2D |
| 6. Objetos | `07` "os móveis", `08` "os móveis e as máquinas" | Cada móvel vira uma peça do catálogo (função que monta o `THREE.Group`), com a caixa de colisão |
| 6. Lâmpadas | `08` "a luz desenhada" | Tubo/lâmpada acesa, cone no ar, mancha no chão; modos normal, falhando (piscar), apagada |
| 7. Testar | `05` inteiro (agente, câmera, controle, animação) e `06` (HUD) | O agente andando no mapa com colisão e luz |
| Depois do mapa | `03`, `08` (ondas, captura, Glutão), `01` | Fantasmas, captura, lutas, sons |

## O que NÃO trazer

- **Animações de morte** (a queda do agente, fantasmas morrendo) e animações específicas de cenas do laboratório.
- Os outros fantasmas (Sombra, Desconhecido, Garota, Mordomo, Observador, Reflexo, Amigo), a demo "O Bando", a demo da casa como fase, a fatia jogável.

## A Mãe (fica no projeto; ainda não tem trecho separado em `reference/lab/`)

Procure no arquivo inteiro: voz e sons (linhas ~572, ~2006, ~2039), paleta (~2424), o modelo (~2764), a luta no berçário
(~6873), a demo em terceira pessoa com a tabela `T` e a arena (~7662), o berço (~8094, ~9750), o corredor (~8183),
o Luto e o tornado (~8343), as fases e a captura (~9623), o fluxo da luta (~10548), as luzes (~10616) e a entrada (~14098).
- Os robôs de teste (`bot`) e os ganchos `window.__mae`: no projeto, os testes são outros.
- Os textos de interface do laboratório (painéis de depuração, listas de demos).

## Diferenças de versão do Three.js

O laboratório usa **r128**; o projeto usa **0.169**. As que mais aparecem:
- Cores e luz: o r155+ usa luz física por padrão (`useLegacyLights` saiu). Intensidades de `PointLight`/`SpotLight` precisam subir (algo como ×π e com `decay` 2) — ajuste olhando.
- `texture.encoding = sRGBEncoding` → `texture.colorSpace = THREE.SRGBColorSpace`.
- `renderer.outputEncoding` → `renderer.outputColorSpace`.
- `Geometry` não existe (o laboratório já usa `BufferGeometry`). `mergeBufferGeometries` → `mergeGeometries` (`three/examples/jsm/utils/BufferGeometryUtils.js`).
- Shaders com `onBeforeCompile`: os nomes dos `#include` continuam, mas confira o `project_vertex`.
