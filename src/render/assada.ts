// O interruptor da luz assada (a etapa 3b): nos níveis Baixo e Médio o cenário (paredes, pisos, tetos, escadas) troca
// as lâmpadas de verdade pela luz que a malha traz em cada vértice (maps/luzAssada.ts). Os personagens e os móveis
// continuam com as lâmpadas de verdade. Quem liga e desliga é game/luz (pelo nível de qualidade); fora do jogo (o
// editor) fica desligada, e as lâmpadas iluminam como sempre.
// As lâmpadas "falhando" piscam todas juntas enquanto a luz assada está ligada (um número só para a malha inteira).
import { ShaderChunk, type Material } from 'three'

export const ASSADA = { ligada: false, pisca: { value: 1 } }
const materiais = new Set<Material>()

/** O pisca-pisca das lâmpadas que falham, no instante t: 1 = acesa; a maior parte do tempo acesa, com quedas curtas. */
export const piscaEm = (t: number) => (Math.sin(t * 13.1) * Math.sin(t * 7.3 + 1.7) * Math.sin(t * 2.9) > 0.35 ? 0.07 : 1)

/** Ensina um material do cenário a usar a luz assada quando ela está ligada (a malha traz luzFixa e luzPisca). */
export function aplicarAssada<M extends Material>(mat: M): M {
  const prev = mat.onBeforeCompile
  mat.onBeforeCompile = (s, r) => {
    prev?.call(mat, s, r)
    s.uniforms.uPisca = ASSADA.pisca
    s.vertexShader = '#ifdef LUZ_ASSADA\nattribute vec3 luzFixa; attribute vec3 luzPisca; uniform float uPisca; varying vec3 vLuzAssada;\n#endif\n' +
      s.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n#ifdef LUZ_ASSADA\nvLuzAssada = luzFixa + luzPisca * uPisca;\n#endif')
    // com a luz assada, o cenário pula a conta das lâmpadas de verdade (é onde o celular ganha) e soma a da malha
    s.fragmentShader = '#ifdef LUZ_ASSADA\nvarying vec3 vLuzAssada;\n#endif\n' + s.fragmentShader
      .replace('#include <lights_fragment_begin>', LUZES)
      .replace('#include <lights_fragment_end>', '#include <lights_fragment_end>\n#ifdef LUZ_ASSADA\nreflectedLight.directDiffuse += vLuzAssada * BRDF_Lambert( material.diffuseColor );\n#endif')
  }
  mat.customProgramCacheKey = () => 'assada'
  if (ASSADA.ligada) mat.defines = { ...mat.defines, LUZ_ASSADA: '' }
  materiais.add(mat)
  return mat
}

// o trecho das luzes do three, com as luzes pontuais fora quando a luz assada está ligada
const PONTUAIS = '#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )'
const LUZES = ShaderChunk.lights_fragment_begin.replace(PONTUAIS, PONTUAIS + ' && ! defined( LUZ_ASSADA )')

/** Liga ou desliga a luz assada em todo o cenário (os materiais são refeitos: é raro, ao entrar no jogo ou trocar o nível). */
export function luzAssada(ligar: boolean) {
  if (ASSADA.ligada === ligar) return
  ASSADA.ligada = ligar
  for (const m of materiais) {
    const d = { ...m.defines }
    if (ligar) d.LUZ_ASSADA = ''; else delete d.LUZ_ASSADA
    m.defines = d; m.needsUpdate = true
  }
}
