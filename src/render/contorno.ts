// O contorno de luz dos personagens (o agente e os fantasmas): as faces viradas de lado para a câmera acendem um pouco
// e o corpo todo ganha um mínimo de luz própria, para ele nunca sumir no escuro (a cena é sempre legível).
// É feito no material (nenhuma luz nova, nenhuma chamada de desenho a mais). A cor e a força vêm da ambientação do
// lugar (game/luz); fora do jogo (editor, estúdio do Ver modelos) a força é zero e o material fica como era.
// O mesmo material leva os brilhos de render/golpe.ts: o do golpe (vermelho), o do aviso de ataque (âmbar) e a fúria (o
// inimigo aprimorado: a cor puxa para o vermelho e a borda acende vermelha, como uma aura).
import * as THREE from 'three'
import { anotar } from './remendos'

export const CONTORNO = { cor: { value: new THREE.Color('#ffffff') }, forca: { value: 0 } }
const MINIMO = 0.1 // a parte da força que vale no corpo inteiro (a luz própria)

/** Os brilhos de cada material (render/golpe.ts): golpe = levou um golpe (vermelho); aviso = vai atacar (âmbar); furia =
 *  o aprimorado (0..1: a cor avermelhada e a borda vermelha). */
export const brilhosDe = new WeakMap<THREE.Material, { golpe: { value: number }; aviso: { value: number }; furia: { value: number } }>()

/** Liga o contorno num material de personagem (e os brilhos, apagados). */
export function aplicarContorno<M extends THREE.Material>(mat: M): M {
  const prev = mat.onBeforeCompile, golpe = { value: 0 }, aviso = { value: 0 }, furia = { value: 0 }
  brilhosDe.set(mat, { golpe, aviso, furia })
  mat.onBeforeCompile = (s, r) => {
    prev?.call(mat, s, r)
    s.uniforms.uContornoCor = CONTORNO.cor
    s.uniforms.uContornoForca = CONTORNO.forca
    s.uniforms.uGolpe = golpe
    s.uniforms.uAviso = aviso
    s.uniforms.uFuria = furia
    // a textura continua aparecendo (a luz multiplica a cor do bloco), com um pouco de luz pura para o que é quase preto;
    // os brilhos: uma cor clara por cima de tudo (quase igual no claro e no escuro: os demônios pretos também acendem)
    s.fragmentShader = 'uniform vec3 uContornoCor;\nuniform float uContornoForca;\nuniform float uGolpe;\nuniform float uAviso;\nuniform float uFuria;\n' + s.fragmentShader
      // a fúria: a cor do bloco puxa para o vermelho (o vermelho fica, o verde e o azul caem)
      .replace('#include <map_fragment>', '#include <map_fragment>\n  diffuseColor.rgb *= mix(vec3(1.0), vec3(1.35, 0.5, 0.45), uFuria);')
      .replace('#include <emissivemap_fragment>',
      `#include <emissivemap_fragment>
  { float lado = 1.0 - saturate(dot(normal, normalize(vViewPosition)));
    totalEmissiveRadiance += uContornoCor * (diffuseColor.rgb * 0.8 + 0.04) * uContornoForca * (lado * lado * lado + ${MINIMO.toFixed(2)});
    vec3 claro = diffuseColor.rgb * 0.25 + 0.3;
    totalEmissiveRadiance += vec3(1.0, 0.3, 0.22) * claro * uGolpe + vec3(1.0, 0.72, 0.32) * claro * uAviso;
    // a fúria: a borda acende num vermelho forte (com o bloom, brilha como uma aura) e o corpo, um pouco
    totalEmissiveRadiance += vec3(1.0, 0.12, 0.08) * (lado * lado * 1.6 + 0.08) * uFuria; }`)
  }
  mat.customProgramCacheKey = () => 'contorno'
  return anotar(mat, aplicarContorno as (m: THREE.Material) => unknown) // a cópia (clonar) leva o contorno junto
}
