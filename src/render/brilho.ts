// O brilho do que acende sozinho (os blocos "luz_" dos modelos: a lâmpada, a chama, os olhos, a luz da armadilha).
// Com o bloom ligado (Médio e Alto) essas peças ficam mais fortes que o branco, e é isso que faz o halo em volta delas
// (render/passeFinal.ts). Sem o bloom (o Baixo, o editor, o estúdio do Ver modelos) a força é 1 e a peça fica como era.
// A força é uma só para todos os modelos (um número dividido pelos materiais): quem liga e desliga é game/luz.
import type { Material } from 'three'

export const BRILHO = { value: 1 }
export const FORCA_COM_BLOOM = 3 // quantas vezes mais forte que o branco

/** Liga o brilho num material de "luz_" (um material copiado com clone() precisa ser ligado de novo). */
export function aplicarBrilho<M extends Material>(mat: M): M {
  mat.onBeforeCompile = (s) => {
    s.uniforms.uBrilhoLuz = BRILHO
    s.fragmentShader = 'uniform float uBrilhoLuz;\n' + s.fragmentShader.replace('#include <map_fragment>', '#include <map_fragment>\ndiffuseColor.rgb *= uBrilhoLuz;')
  }
  mat.customProgramCacheKey = () => 'brilho'
  return mat
}
