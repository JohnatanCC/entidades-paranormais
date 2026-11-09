// O corte das paredes do editor, como no The Sims: paredes altas, recortadas (as que ficam entre a câmera e o ponto
// que ela olha abaixam) ou baixas (todas as do andar escolhido abaixam). É feito no desenho (o pedaço de cima da
// parede não é pintado), então a malha não precisa ser refeita quando a câmera gira.
// A câmera do editor atualiza o alvo e a direção a cada quadro; as ferramentas usam pontoCortado() para o mouse
// atravessar o que não aparece.
import * as THREE from 'three'
import type { Material } from 'three'
import { LEVEL_H } from '../maps/types'

export type ModoParedes = 'altas' | 'recortadas' | 'baixas'
const MODOS: Record<ModoParedes, number> = { altas: 0, recortadas: 1, baixas: 2 }

export const ALTURA_CORTE = 0.45 // a altura (m) que sobra da parede cortada

export const CORTE = {
  modo: { value: 0 },
  alvo: { value: new THREE.Vector2() }, // o ponto que a câmera olha (x, z)
  dir: { value: new THREE.Vector2(0, 1) }, // do alvo para a câmera, no chão (normalizado)
  base: { value: 0 }, // o chão do andar escolhido
  altura: { value: ALTURA_CORTE },
}

export const setModoParedes = (m: ModoParedes) => { CORTE.modo.value = MODOS[m] }

/** O mesmo teste do desenho, em JavaScript: este ponto da parede está cortado (não aparece)? */
export function pontoCortado(x: number, y: number, z: number): boolean {
  const modo = CORTE.modo.value
  if (modo === 0) return false
  const h = y - CORTE.base.value
  if (h <= CORTE.altura.value || h >= LEVEL_H + 0.05) return false
  if (modo === 2) return true
  return (x - CORTE.alvo.value.x) * CORTE.dir.value.x + (z - CORTE.alvo.value.y) * CORTE.dir.value.y > 0
}

/** Liga o corte num material de parede (use depois do applyPsx). */
export function aplicarCorte<M extends Material>(mat: M): M {
  const prev = mat.onBeforeCompile
  mat.onBeforeCompile = (s, r) => {
    prev?.call(mat, s, r)
    s.uniforms.uCorteModo = CORTE.modo
    s.uniforms.uCorteAlvo = CORTE.alvo
    s.uniforms.uCorteDir = CORTE.dir
    s.uniforms.uCorteBase = CORTE.base
    s.uniforms.uCorteAltura = CORTE.altura
    s.vertexShader = 'varying vec3 vMundoCorte;\n' + s.vertexShader.replace('#include <worldpos_vertex>',
      '#include <worldpos_vertex>\nvMundoCorte = (modelMatrix * vec4(transformed, 1.0)).xyz;')
    s.fragmentShader = 'uniform float uCorteModo; uniform vec2 uCorteAlvo; uniform vec2 uCorteDir; uniform float uCorteBase; uniform float uCorteAltura;\nvarying vec3 vMundoCorte;\n' +
      s.fragmentShader.replace('void main() {', `void main() {
  if (uCorteModo > 0.5) {
    float hc = vMundoCorte.y - uCorteBase;
    if (hc > uCorteAltura && hc < ${LEVEL_H.toFixed(2)} + 0.05 && (uCorteModo > 1.5 || dot(vMundoCorte.xz - uCorteAlvo, uCorteDir) > 0.0)) discard;
  }`)
  }
  mat.customProgramCacheKey = () => 'psx-corte'
  return mat
}
