// O passe final da imagem (níveis Médio e Alto: render/qualidade.ts): a cena é desenhada numa textura com as cores
// ainda "cruas" (luz de verdade, sem limite) e UMA passada de tela cheia faz o resto: a exposição e o tonemapping
// (ACES, o mesmo do three, para o Baixo ficar parecido sem o passe), a correção de cor (o tom das sombras e das luzes,
// o contraste, a saturação), a vinheta e um pontilhado mínimo (sem ele o degradê escuro da neblina faz faixas).
// Uma passada só: no celular o que pesa é preencher a tela, então tudo o que for de tela cheia mora neste shader.
// Etapa 2 (bloom): o brilho sai de `alvo.texture` (as cores cruas, antes do tonemapping) e soma aqui, antes do ACES.
import * as THREE from 'three'

export interface Tom { exposicao: number; sombras: THREE.Color; luzes: THREE.Color; contraste: number; saturacao: number; vinheta: number }

const FRAG = /* glsl */ `uniform sampler2D tCena; uniform float uExp, uContraste, uSat, uVig, uT, uAspecto; uniform vec3 uSombras, uLuzes; varying vec2 vUv;
vec3 RRTAndODTFit(vec3 v) { vec3 a = v * (v + 0.0245786) - 0.000090537; vec3 b = v * (0.983729 * v + 0.4329510) + 0.238081; return a / b; }
vec3 aces(vec3 c) {
  const mat3 entra = mat3(vec3(0.59719, 0.07600, 0.02840), vec3(0.35458, 0.90834, 0.13383), vec3(0.04823, 0.01566, 0.83777));
  const mat3 sai = mat3(vec3(1.60475, -0.10208, -0.00327), vec3(-0.53108, 1.10813, -0.07276), vec3(-0.07367, -0.00605, 1.07602));
  return clamp(sai * RRTAndODTFit(entra * (c * uExp / 0.6)), 0.0, 1.0);
}
vec3 paraSRGB(vec3 c) { return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }
float ruido(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
void main() {
  vec3 col = paraSRGB(aces(max(texture2D(tCena, vUv).rgb, 0.0)));
  float l = dot(col, vec3(0.2126, 0.7152, 0.0722));
  col = mix(vec3(l), col, uSat);
  col = (col - 0.18) * uContraste + 0.18;                // o meio do contraste fica baixo: a cena é escura
  col *= mix(uSombras, uLuzes, smoothstep(0.0, 0.6, l)); // o tom: um para o escuro, outro para o claro
  vec2 d = vUv - 0.5; d.x *= uAspecto;
  col *= 1.0 - uVig * smoothstep(0.35, 1.0, length(d));
  col += (ruido(gl_FragCoord.xy + fract(uT) * 61.0) - 0.5) / 255.0;
  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}`

export interface PasseFinal {
  /** Desenha a cena na textura e a passada final na tela. */
  desenhar: (gl: THREE.WebGLRenderer, cena: THREE.Scene, camera: THREE.Camera, tom: Tom, t: number) => void
  descartar: () => void
}

export function novoPasseFinal(amostras: number): PasseFinal {
  const alvo = new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, samples: amostras })
  const u = {
    tCena: { value: alvo.texture }, uExp: { value: 1 }, uContraste: { value: 1 }, uSat: { value: 1 }, uVig: { value: 0 }, uT: { value: 0 }, uAspecto: { value: 1 },
    uSombras: { value: new THREE.Color() }, uLuzes: { value: new THREE.Color() },
  }
  const mat = new THREE.ShaderMaterial({ uniforms: u, depthTest: false, depthWrite: false, toneMapped: false, fragmentShader: FRAG,
    vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }' })
  // um triângulo que cobre a tela (um quadrado seriam dois, com a diagonal desenhada duas vezes)
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3))
  geo.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 2, 0, 0, 2], 2))
  const tela = new THREE.Mesh(geo, mat); tela.frustumCulled = false
  const cenaTela = new THREE.Scene(); cenaTela.add(tela)
  const cam = new THREE.Camera(), tam = new THREE.Vector2()
  return {
    desenhar(gl, cena, camera, tom, t) {
      gl.getDrawingBufferSize(tam)
      if (alvo.width !== tam.x || alvo.height !== tam.y) alvo.setSize(tam.x, tam.y)
      u.uExp.value = tom.exposicao; u.uContraste.value = tom.contraste; u.uSat.value = tom.saturacao; u.uVig.value = tom.vinheta
      // as cores do tom são contas em cima da imagem pronta (sRGB): entram como foram escritas, sem virar "luz"
      tom.sombras.getRGB(u.uSombras.value, THREE.SRGBColorSpace); tom.luzes.getRGB(u.uLuzes.value, THREE.SRGBColorSpace)
      u.uT.value = t; u.uAspecto.value = tam.x / tam.y
      gl.setRenderTarget(alvo); gl.render(cena, camera)
      gl.setRenderTarget(null); gl.render(cenaTela, cam)
    },
    descartar() { alvo.dispose(); mat.dispose(); geo.dispose() },
  }
}
