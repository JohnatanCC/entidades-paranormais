// O céu da noite: uma cúpula em volta da câmera com o degradê (do alto até o horizonte), as estrelas e a lua.
// É uma malha só, com um material só (uma chamada de desenho), desenhada por último e no fundo de tudo: só gasta nos
// pixels onde o céu aparece de verdade. As cores vêm da ambientação (maps/ambientes.ts): o horizonte é a cor da
// neblina, então o chão que some ao longe some na cor do céu, sem corte. A lua passa do branco: com o bloom, ganha halo.
// As estrelas e a lua são em pixel (quadradinhos), como o resto do jogo.
import * as THREE from 'three'
import { LUA } from '../../maps/ambientes'

const VERT = /* glsl */ `varying vec3 vDir;
void main() {
  vDir = position;
  vec4 p = projectionMatrix * viewMatrix * vec4(cameraPosition + position, 1.0);
  gl_Position = p.xyww; // no fundo de tudo: qualquer coisa da cena fica na frente
}`
const FRAG = /* glsl */ `uniform vec3 uZenite, uHorizonte, uLua; uniform float uEstrelas, uForcaLua, uT; varying vec3 vDir;
float sorte(vec3 p) { return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }
void main() {
  vec3 d = normalize(vDir);
  float alto = smoothstep(0.0, 0.6, d.y);
  vec3 cor = mix(uHorizonte, uZenite, alto);
  // as estrelas: o céu dividido em caixinhas; algumas têm uma estrela quadrada, que cintila devagar; somem no horizonte
  vec3 q = d * 70.0, caixa = floor(q), dentro = fract(q) - 0.5;
  float s = sorte(caixa), tam = 0.1 + 0.16 * fract(s * 7.3);
  float estrela = step(0.972, s) * step(max(abs(dentro.x), max(abs(dentro.y), abs(dentro.z))), tam);
  cor += vec3(0.8, 0.88, 1.0) * estrela * uEstrelas * (0.35 + 0.9 * fract(s * 13.7)) * (0.75 + 0.25 * sin(uT * (0.6 + s * 2.0) + s * 40.0)) * smoothstep(0.03, 0.3, d.y);
  // a lua: um disco em pixels (12 de lado a lado), com manchas, e um clarão macio em volta
  vec3 lx = normalize(cross(vec3(0.0, 1.0, 0.0), uLua)), ly = cross(uLua, lx);
  float frente = dot(d, uLua);
  vec2 m = floor(vec2(dot(d, lx), dot(d, ly)) / 0.055 * 6.0) + 0.5;
  float disco = step(length(m), 6.0) * step(0.0, frente);
  float mancha = 1.0 - 0.3 * step(0.72, sorte(vec3(m, 3.0)));
  cor = mix(cor, vec3(0.86, 0.92, 1.0) * mancha * uForcaLua, disco * step(0.01, uForcaLua));
  cor += vec3(0.5, 0.65, 1.0) * 0.06 * uForcaLua * pow(max(frente, 0.0), 60.0) * (1.0 - disco);
  gl_FragColor = vec4(cor, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`

export interface Ceu { malha: THREE.Mesh; zenite: THREE.Color; horizonte: THREE.Color; u: { uEstrelas: { value: number }; uForcaLua: { value: number }; uT: { value: number } } }

export function novoCeu(): Ceu {
  const zenite = new THREE.Color(), horizonte = new THREE.Color()
  const u = { uZenite: { value: zenite }, uHorizonte: { value: horizonte }, uLua: { value: new THREE.Vector3(...LUA).normalize() }, uEstrelas: { value: 0 }, uForcaLua: { value: 0 }, uT: { value: 0 } }
  const mat = new THREE.ShaderMaterial({ uniforms: u, vertexShader: VERT, fragmentShader: FRAG, side: THREE.BackSide, depthWrite: false, fog: false })
  const malha = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 2), mat)
  malha.name = 'ceu'; malha.frustumCulled = false; malha.renderOrder = 1000 // depois do cenário: só os pixels livres
  return { malha, zenite, horizonte, u }
}

export function descartarCeu(c: Ceu) { c.malha.geometry.dispose(); (c.malha.material as THREE.Material).dispose() }
