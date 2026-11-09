// O tremor de vértice do PS1 (do laboratório): cada vértice encaixa numa grade da tela. uSnap = 0 desliga.
// Use applyPsx(material) nos materiais do cenário e dos personagens; o valor vem do filtro escolhido nas configurações.
import type { Material } from 'three'

export const SNAPU = { value: 110 }

export function applyPsx<M extends Material>(mat: M): M {
  const prev = mat.onBeforeCompile
  mat.onBeforeCompile = (s, r) => {
    prev?.call(mat, s, r)
    s.uniforms.uSnap = SNAPU
    s.vertexShader = 'uniform float uSnap;\n' + s.vertexShader.replace('#include <project_vertex>',
      '#include <project_vertex>\nif (uSnap > 0.0 && gl_Position.w > 0.35) { vec4 p = gl_Position; p.xyz /= p.w; p.xy = floor(p.xy * uSnap) / uSnap; p.xyz *= p.w; gl_Position = p; }')
  }
  mat.customProgramCacheKey = () => 'psx'
  return mat
}
