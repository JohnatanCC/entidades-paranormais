// A conversão dos mapas antigos: todo mapa lido (pelo jogo ou pelo editor) passa por aqui e sai no formato de agora.
// Mudou o formato? Suba FORMATO (types.ts) e acrescente o passo aqui. Um mapa salvo nunca quebra.
//   1 → 2 (11/nov): a ambientação. O mapa antigo não tinha: fica inteiro com a padrão e sem áreas.
import { AMBIENTE_PADRAO } from './ambientes'
import { FORMATO, type AreaAmbiente } from './types'

const inteiro = (v: unknown): v is number => Number.isInteger(v)

/** O que o cabeçalho ganhou depois do formato 1, lido do que veio (ou o padrão, se o mapa é antigo ou o campo está quebrado). */
export function cabecalhoAtual(meta: Record<string, unknown>): { formato: typeof FORMATO; ambiente: string; areas: AreaAmbiente[] } {
  const areas = (Array.isArray(meta.areas) ? meta.areas : []).filter((a): a is AreaAmbiente =>
    !!a && typeof a.id === 'string' && typeof a.ambiente === 'string' && [a.level, a.x, a.z, a.w, a.d].every(inteiro) && a.w > 0 && a.d > 0)
  return { formato: FORMATO, ambiente: typeof meta.ambiente === 'string' ? meta.ambiente : AMBIENTE_PADRAO, areas }
}
