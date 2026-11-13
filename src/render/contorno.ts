// O contorno de luz dos personagens (o agente e os fantasmas): as faces viradas de lado para a câmera acendem um pouco
// e o corpo todo ganha um mínimo de luz própria, para ele nunca sumir no escuro (a cena é sempre legível).
// É feito no material (nenhuma luz nova, nenhuma chamada de desenho a mais). A cor e a força vêm da ambientação do
// lugar (game/luz); fora do jogo (editor, estúdio do Ver modelos) a força é zero e o material fica como era.
// O mesmo material leva os dois brilhos de render/golpe.ts: o do golpe (vermelho) e o do aviso de ataque (âmbar).
import * as THREE from 'three'
import { anotar } from './remendos'

export const CONTORNO = { cor: { value: new THREE.Color('#ffffff') }, forca: { value: 0 } }
const MINIMO = 0.1 // a parte da força que vale no corpo inteiro (a luz própria)

/** Os brilhos de cada material (render/golpe.ts): golpe = levou um golpe (vermelho); aviso = vai atacar (âmbar). */
export const brilhosDe = new WeakMap<THREE.Material, { golpe: { value: number }; aviso: { value: number } }>()

/** Liga o contorno num material de personagem (e os brilhos, apagados). */
export function aplicarContorno<M extends THREE.Material>(mat: M): M {
  const prev = mat.onBeforeCompile, golpe = { value: 0 }, aviso = { value: 0 }
  brilhosDe.set(mat, { golpe, aviso })
  mat.onBeforeCompile = (s, r) => {
    prev?.call(mat, s, r)
    s.uniforms.uContornoCor = CONTORNO.cor
    s.uniforms.uContornoForca = CONTORNO.forca
    s.uniforms.uGolpe = golpe
    s.uniforms.uAviso = aviso
    // a textura continua aparecendo (a luz multiplica a cor do bloco), com um pouco de luz pura para o que é quase preto;
    // os brilhos: uma cor clara por cima de tudo (quase igual no claro e no escuro: os demônios pretos também acendem)
    s.fragmentShader = 'uniform vec3 uContornoCor;\nuniform float uContornoForca;\nuniform float uGolpe;\nuniform float uAviso;\n' + s.fragmentShader.replace('#include <emissivemap_fragment>',
      `#include <emissivemap_fragment>
  { float lado = 1.0 - saturate(dot(normal, normalize(vViewPosition)));
    totalEmissiveRadiance += uContornoCor * (diffuseColor.rgb * 0.8 + 0.04) * uContornoForca * (lado * lado * lado + ${MINIMO.toFixed(2)});
    vec3 claro = diffuseColor.rgb * 0.25 + 0.3;
    totalEmissiveRadiance += vec3(1.0, 0.3, 0.22) * claro * uGolpe + vec3(1.0, 0.72, 0.32) * claro * uAviso; }`)
  }
  mat.customProgramCacheKey = () => 'contorno'
  return anotar(mat, aplicarContorno as (m: THREE.Material) => unknown) // a cópia (clonar) leva o contorno junto
}
