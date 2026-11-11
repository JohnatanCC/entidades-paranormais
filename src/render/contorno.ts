// O contorno de luz dos personagens (o agente e os fantasmas): as faces viradas de lado para a câmera acendem um pouco
// e o corpo todo ganha um mínimo de luz própria, para ele nunca sumir no escuro (a cena é sempre legível).
// É feito no material (nenhuma luz nova, nenhuma chamada de desenho a mais). A cor e a força vêm da ambientação do
// lugar (game/luz); fora do jogo (editor, estúdio do Ver modelos) a força é zero e o material fica como era.
import * as THREE from 'three'

export const CONTORNO = { cor: { value: new THREE.Color('#ffffff') }, forca: { value: 0 } }
const MINIMO = 0.1 // a parte da força que vale no corpo inteiro (a luz própria)

/** Liga o contorno num material de personagem. */
export function aplicarContorno<M extends THREE.Material>(mat: M): M {
  const prev = mat.onBeforeCompile
  mat.onBeforeCompile = (s, r) => {
    prev?.call(mat, s, r)
    s.uniforms.uContornoCor = CONTORNO.cor
    s.uniforms.uContornoForca = CONTORNO.forca
    // a textura continua aparecendo (a luz multiplica a cor do bloco), com um pouco de luz pura para o que é quase preto
    s.fragmentShader = 'uniform vec3 uContornoCor;\nuniform float uContornoForca;\n' + s.fragmentShader.replace('#include <emissivemap_fragment>',
      `#include <emissivemap_fragment>
  { float lado = 1.0 - saturate(dot(normal, normalize(vViewPosition)));
    totalEmissiveRadiance += uContornoCor * (diffuseColor.rgb * 0.8 + 0.04) * uContornoForca * (lado * lado * lado + ${MINIMO.toFixed(2)}); }`)
  }
  mat.customProgramCacheKey = () => 'contorno'
  return mat
}
