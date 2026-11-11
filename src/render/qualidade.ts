// A qualidade da imagem. Quatro níveis prontos: Baixo (celular), Médio, Alto e Ultra (o mais pesado: tudo o que
// melhora luz e sombra entra nele primeiro). Nas configurações o jogador escolhe um deles ou "Automático", que escolhe
// pelo aparelho (toque, memória, núcleos, a placa de vídeo) e, se os quadros ficarem lentos no começo do jogo, desce um
// nível sozinho (só desce: subir e descer sem parar seria pior; e nunca escolhe o Ultra).
// Cada nível é um conjunto de RECURSOS (a resolução, as sombras, o bloom, as texturas...), e o jogador pode mudar
// qualquer recurso por cima do nível (os "ajustes" das configurações). O que vale é o nível mais os ajustes.
// Para criar um recurso: o campo em Recursos, o valor em cada nível (NIVEIS), a linha em OPCOES (é ela que aparece
// nas configurações) e quem usa (a cena lê pela definição: useDefinicao).
//   etapa 1: a resolução, o passe final (a correção de cor, a vinheta) e a suavização das bordas;
//   etapa 2: o bloom, dentro do passe final;
//   etapa 3: a sombra de canto e a luz assada valem sempre (são da malha, não custam por quadro);
//   etapa 4: as sombras em tempo real (render/sombras.ts);
//   etapa 5: o brilho das texturas (5a); o relevo entra aqui como recurso do Ultra (5b).
import { useMemo, useSyncExternalStore } from 'react'
import { getSettings, useSettings } from '../settings/settings'
import type { Bloom } from './passeFinal'

export type Nivel = 'baixo' | 'medio' | 'alto' | 'ultra'
export type Qualidade = 'auto' | Nivel

/** Os recursos que o jogador pode ajustar um a um. */
export interface Recursos {
  resolucao: 0.75 | 1 | 1.5 | 2 // quantos pixels desenhados por ponto da tela, no máximo (o celular tem 2 a 3: é o que mais pesa)
  passe: boolean // o passe final de tela cheia: a correção de cor e a vinheta (sem ele, o tom vem só das luzes e da neblina)
  bordas: 0 | 2 | 4 // a suavização das bordas da imagem (só com o passe; sem ele, vale a da própria tela)
  bloom: 'nao' | 'leve' | 'cheio' // o brilho em volta do que é claro (só com o passe)
  sombraLampadas: 0 | 1 | 3 // quantas lâmpadas (as mais perto do agente) fazem sombra; as outras vêm da luz assada
  sombraDetalhe: 512 | 1024 // o tamanho da textura da sombra de cada lâmpada
  sombraLua: 0 | 1024 | 2048 | 4096 // o tamanho da textura da sombra da lua (0 = sem)
  sombraMacia: boolean // a borda da sombra suavizada (17 leituras de textura por pixel para a lua e 9 por lâmpada; dura, 1 cada)
  sombraRitmo: 1 | 2 // de quantos em quantos quadros cada sombra é refeita (2 = metade do custo, um quadro de atraso)
  indireta: boolean // a luz indireta do mapa (maps/luzAssada.ts): o escuro fica escuro de verdade, a luz se espalha pelos cômodos
  brilho: boolean // as texturas refletem a luz conforme o material (mármore brilha, tapete não)
  filtro: 1 | 4 | 8 // a nitidez das texturas vistas de lado (o chão ao longe)
}

export const NIVEIS: Record<Nivel, Recursos & { nome: string }> = {
  baixo: { nome: 'Baixo', resolucao: 1, passe: false, bordas: 0, bloom: 'nao', sombraLampadas: 0, sombraDetalhe: 512, sombraLua: 0, sombraMacia: false, sombraRitmo: 2, indireta: false, brilho: true, filtro: 1 },
  medio: { nome: 'Médio', resolucao: 1.5, passe: true, bordas: 2, bloom: 'leve', sombraLampadas: 1, sombraDetalhe: 512, sombraLua: 1024, sombraMacia: false, sombraRitmo: 2, indireta: false, brilho: true, filtro: 4 },
  alto: { nome: 'Alto', resolucao: 2, passe: true, bordas: 4, bloom: 'cheio', sombraLampadas: 3, sombraDetalhe: 512, sombraLua: 2048, sombraMacia: true, sombraRitmo: 1, indireta: false, brilho: true, filtro: 4 },
  ultra: { nome: 'Ultra', resolucao: 2, passe: true, bordas: 4, bloom: 'cheio', sombraLampadas: 3, sombraDetalhe: 1024, sombraLua: 4096, sombraMacia: true, sombraRitmo: 1, indireta: true, brilho: true, filtro: 8 },
}
const ORDEM: Nivel[] = ['baixo', 'medio', 'alto', 'ultra']

/** As linhas de ajuste das configurações: o recurso, o nome, a explicação curta e os valores com o rótulo de cada um. */
type Opcao<K extends keyof Recursos = keyof Recursos> = { chave: K; grupo: 'Imagem' | 'Luz e sombra' | 'Texturas'; nome: string; ajuda: string; valores: [Recursos[K], string][] }
const opcao = <K extends keyof Recursos>(o: Opcao<K>) => o as unknown as Opcao
export const OPCOES: Opcao[] = [
  opcao({ chave: 'resolucao', grupo: 'Imagem', nome: 'Resolução', ajuda: 'Quantos pixels são desenhados. É o que mais pesa em telas de celular e 4K.', valores: [[0.75, '75%'], [1, 'Normal'], [1.5, 'Alta'], [2, 'Máxima']] }),
  opcao({ chave: 'passe', grupo: 'Imagem', nome: 'Correção de cor', ajuda: 'O tom das sombras e das luzes, o contraste e a vinheta. As bordas suaves e o brilho dependem dela.', valores: [[false, 'Desligada'], [true, 'Ligada']] }),
  opcao({ chave: 'bordas', grupo: 'Imagem', nome: 'Bordas suaves', ajuda: 'Tira o serrilhado das bordas.', valores: [[0, 'Não'], [2, '2×'], [4, '4×']] }),
  opcao({ chave: 'indireta', grupo: 'Luz e sombra', nome: 'Luz indireta', ajuda: 'A luz se espalha pelos cômodos e o que está longe dela fica escuro de verdade. Não pesa por quadro.', valores: [[false, 'Desligada'], [true, 'Ligada']] }),
  opcao({ chave: 'bloom', grupo: 'Luz e sombra', nome: 'Brilho das luzes', ajuda: 'O halo em volta das lâmpadas, do luar e dos olhos.', valores: [['nao', 'Não'], ['leve', 'Leve'], ['cheio', 'Completo']] }),
  opcao({ chave: 'sombraLampadas', grupo: 'Luz e sombra', nome: 'Sombra das lâmpadas', ajuda: 'Quantas lâmpadas perto de você fazem sombra. Cada uma desenha a cena seis vezes.', valores: [[0, 'Nenhuma'], [1, '1'], [3, '3']] }),
  opcao({ chave: 'sombraDetalhe', grupo: 'Luz e sombra', nome: 'Detalhe da sombra', ajuda: 'A nitidez da sombra das lâmpadas.', valores: [[512, 'Normal'], [1024, 'Alto']] }),
  opcao({ chave: 'sombraLua', grupo: 'Luz e sombra', nome: 'Sombra da lua', ajuda: 'A sombra do luar, fora de casa.', valores: [[0, 'Não'], [1024, 'Normal'], [2048, 'Alta'], [4096, 'Máxima']] }),
  opcao({ chave: 'sombraMacia', grupo: 'Luz e sombra', nome: 'Borda da sombra', ajuda: 'A borda esfumada custa bem mais em cada pixel.', valores: [[false, 'Dura'], [true, 'Macia']] }),
  opcao({ chave: 'sombraRitmo', grupo: 'Luz e sombra', nome: 'Sombra refeita', ajuda: 'Quadro sim, quadro não: metade do custo, com um quadro de atraso.', valores: [[2, 'Quadro sim, quadro não'], [1, 'Todo quadro']] }),
  opcao({ chave: 'brilho', grupo: 'Texturas', nome: 'Reflexo dos materiais', ajuda: 'Mármore e azulejo refletem a luz; tapete e reboco, não.', valores: [[false, 'Desligado'], [true, 'Ligado']] }),
  opcao({ chave: 'filtro', grupo: 'Texturas', nome: 'Nitidez ao longe', ajuda: 'O chão e as paredes vistos de lado ficam mais nítidos.', valores: [[1, 'Baixa'], [4, 'Normal'], [8, 'Alta']] }),
]

/** O que a cena precisa, tirado dos recursos (o nível mais os ajustes). */
export interface Definicao {
  recursos: Recursos
  dpr: number // o máximo de pixels por ponto da tela (abaixo de 1: uma fração da tela)
  passe: boolean
  amostras: number // a suavização das bordas no passe final (MSAA)
  bloom: Bloom | null // o tamanho da maior textura do bloom e quantas reduções (null = sem)
  lampadas: 'assada' | 'mista' // no cenário (render/assada.ts): 'assada' = todas da malha; 'mista' = as com sombra são de verdade
  sombras: { lampadas: number; mapa: number; lua: number; cada: number; macia: boolean }
}

const BLOOM: Record<Recursos['bloom'], Bloom | null> = { nao: null, leve: { de: 4, niveis: 4 }, cheio: { de: 2, niveis: 5 } }

export function definicaoDe(r: Recursos): Definicao {
  return {
    recursos: r, dpr: r.resolucao, passe: r.passe, amostras: r.passe ? r.bordas : 0, bloom: r.passe ? BLOOM[r.bloom] : null,
    lampadas: r.sombraLampadas > 0 ? 'mista' : 'assada',
    sombras: { lampadas: r.sombraLampadas, mapa: r.sombraDetalhe, lua: r.sombraLua, cada: r.sombraRitmo, macia: r.sombraMacia },
  }
}

/** O que o <Canvas> de uma cena de jogo precisa da definição: a resolução e as sombras. Passe como propriedades dele (o
 *  fiber repõe as duas a cada redesenho, então não adianta mudar por dentro da cena). */
export function canvasDoNivel(d: Definicao): { dpr: number; shadows: false | 'basic' | 'percentage' } {
  const tem = d.sombras.lua > 0 || d.sombras.lampadas > 0
  return { dpr: d.dpr < 1 ? window.devicePixelRatio * d.dpr : Math.min(window.devicePixelRatio, d.dpr), shadows: tem ? (d.sombras.macia ? 'percentage' : 'basic') : false }
}

/** A medição dos quadros no automático: depois de `espera` s, a média de `janela` s acima de `lento` ms desce um nível. */
export const MEDICAO = { espera: 1.5, janela: 3, lento: 24 }

/** O nome da placa de vídeo, como o navegador conta (vazio se ele esconde). */
function placa(): string {
  try {
    const gl = document.createElement('canvas').getContext('webgl')
    const ext = gl?.getExtension('WEBGL_debug_renderer_info')
    const nome = gl && ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : ''
    gl?.getExtension('WEBGL_lose_context')?.loseContext()
    return nome.toLowerCase()
  } catch { return '' }
}

/** O palpite pelo aparelho, sem medir nada (nunca o Ultra: esse o jogador escolhe). */
function detectar(): Nivel {
  const nav = navigator as Navigator & { deviceMemory?: number }
  const memoria = nav.deviceMemory ?? 8, nucleos = nav.hardwareConcurrency ?? 4, gpu = placa()
  const toque = matchMedia('(pointer: coarse)').matches && !matchMedia('(pointer: fine)').matches
  if (/swiftshader|llvmpipe|software|basic render/.test(gpu)) return 'baixo' // sem placa: desenhado pelo processador
  if (toque) return memoria >= 8 && nucleos >= 8 ? 'medio' : 'baixo' // celular e tablet: só os mais fortes saem do Baixo
  if (memoria <= 4 || nucleos <= 4) return 'medio'
  // placa embutida (Intel, a dos celulares): Médio; placa dedicada (ou a da Apple): Alto
  if (/intel|uhd|iris|hd graphics|mali|adreno|powervr/.test(gpu) && !/arc/.test(gpu)) return 'medio'
  return 'alto'
}

let auto: Nivel | null = null
const subs = new Set<() => void>()
const nivelAuto = () => (auto ??= detectar())

/** O nível valendo agora: o escolhido nas configurações ou o do automático. */
export const nivelAtual = (): Nivel => { const q = getSettings().qualidade; return q === 'auto' ? nivelAuto() : q }

/** Os recursos valendo agora: os do nível, com os ajustes do jogador por cima. */
export const recursosAtuais = (): Recursos => ({ ...NIVEIS[nivelAtual()], ...getSettings().ajustes })

/** O jogador mudou algum recurso por cima do nível? */
export const personalizado = () => Object.keys(getSettings().ajustes).length > 0

/** O automático mediu quadros lentos: desce um nível (true se desceu). */
export function descerNivel(): boolean {
  const i = ORDEM.indexOf(nivelAuto())
  if (getSettings().qualidade !== 'auto' || i === 0) return false
  auto = ORDEM[i - 1]; subs.forEach((f) => f())
  return true
}

/** O nível do automático (para a tela de configurações mostrar qual ele escolheu). */
export function useNivelAuto(): Nivel {
  return useSyncExternalStore((f) => { subs.add(f); return () => subs.delete(f) }, nivelAuto)
}

/** O nível valendo agora, para as telas: muda quando o jogador troca a configuração ou o automático desce. */
export function useNivel(): Nivel {
  const { qualidade } = useSettings(), a = useNivelAuto()
  return qualidade === 'auto' ? a : qualidade
}

/** A definição valendo agora, para as cenas (o mesmo objeto enquanto nada muda). */
export function useDefinicao(): Definicao {
  const nivel = useNivel(), { ajustes } = useSettings()
  return useMemo(() => definicaoDe({ ...NIVEIS[nivel], ...ajustes }), [nivel, ajustes])
}
