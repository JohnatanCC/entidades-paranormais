// Os níveis de qualidade da imagem: Baixo (celular), Médio e Alto. Nas configurações o jogador escolhe um deles ou
// "Automático", que escolhe pelo aparelho (toque, memória, núcleos, a placa de vídeo) e, se mesmo assim os quadros
// ficarem lentos no começo do jogo, desce um nível sozinho (só desce: subir e descer sem parar seria pior).
// Os números de cada nível ficam aqui. O que cada etapa da iluminação acrescenta:
//   etapa 1 (esta): a resolução, o passe final (a correção de cor, a vinheta) e a suavização das bordas;
//   etapa 2: o bloom entra no passe final (Médio e Alto; o Baixo não tem passe);
//   etapa 3: a luz assada no mapa vale para os três níveis (é dado da malha, não custa por quadro);
//   etapa 4: as sombras em tempo real, só no Alto.
import { useSyncExternalStore } from 'react'
import { getSettings, useSettings } from '../settings/settings'

export type Nivel = 'baixo' | 'medio' | 'alto'
export type Qualidade = 'auto' | Nivel

export interface NivelDef {
  nome: string
  dpr: number // o máximo de pixels desenhados por pixel da tela (o celular tem 2 a 3: desenhar tudo isso é o que mais pesa)
  passe: boolean // o passe final de tela cheia: a correção de cor e a vinheta (sem ele, o tom vem só das luzes e da neblina)
  amostras: number // a suavização das bordas no passe final (MSAA); sem o passe, vale a da própria tela
}

export const NIVEIS: Record<Nivel, NivelDef> = {
  baixo: { nome: 'Baixo', dpr: 1, passe: false, amostras: 0 },
  medio: { nome: 'Médio', dpr: 1.5, passe: true, amostras: 2 },
  alto: { nome: 'Alto', dpr: 2, passe: true, amostras: 4 },
}
const ORDEM: Nivel[] = ['baixo', 'medio', 'alto']

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

/** O palpite pelo aparelho, sem medir nada. */
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

/** O nível valendo agora, para as cenas: muda quando o jogador troca a configuração ou o automático desce. */
export function useNivel(): Nivel {
  const { qualidade } = useSettings(), a = useNivelAuto()
  return qualidade === 'auto' ? a : qualidade
}
