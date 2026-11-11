// O passe final da imagem (níveis Médio e Alto: render/qualidade.ts): a cena é desenhada numa textura com as cores
// ainda "cruas" (luz de verdade, sem limite) e UMA passada de tela cheia faz o resto: soma o bloom, a exposição e o
// tonemapping (ACES, o mesmo do three, para o Baixo ficar parecido sem o passe), a correção de cor (o tom das sombras e
// das luzes, o contraste, a saturação), a vinheta e um pontilhado mínimo (sem ele o degradê escuro da neblina faz faixas).
// O bloom (etapa 2): o que é claro na cena crua vaza em volta. A cena é reduzida várias vezes (cada nível com a metade
// do anterior) e somada de volta do menor para o maior: o halo sai largo e macio com poucas leituras por pixel.
// Tudo isso acontece em texturas pequenas (a maior tem 1/2 ou 1/4 da tela): de tela cheia continua sendo uma passada só.
import * as THREE from 'three'

export interface Tom { exposicao: number; brilho: number; sombras: THREE.Color; luzes: THREE.Color; contraste: number; saturacao: number; vinheta: number }

/** O bloom do nível: a maior textura dele tem 1/de da tela; niveis = quantas reduções (mais níveis, halo mais largo). */
export interface Bloom { de: number; niveis: number }
// abaixo de LIMIAR a cena quase não vaza (as paredes escuras não viram névoa); TETO segura um pixel estourado (faísca)
const LIMIAR = 0.35, TETO = 8

const VERT = 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }'
// reduzir: quatro leituras na diagonal (cada uma já é a média de quatro pontos); a primeira redução escolhe o que brilha
const REDUZIR = /* glsl */ `uniform sampler2D tFonte; uniform vec2 uPx; uniform float uPrimeira; varying vec2 vUv;
void main() {
  vec3 c = 0.25 * (texture2D(tFonte, vUv + uPx * vec2(-1.0, -1.0)).rgb + texture2D(tFonte, vUv + uPx * vec2(1.0, -1.0)).rgb
    + texture2D(tFonte, vUv + uPx * vec2(-1.0, 1.0)).rgb + texture2D(tFonte, vUv + uPx * vec2(1.0, 1.0)).rgb);
  if (uPrimeira > 0.5) { c = clamp(c, 0.0, ${TETO.toFixed(1)}); c *= smoothstep(${(LIMIAR * 0.5).toFixed(3)}, ${(LIMIAR * 1.5).toFixed(3)}, max(c.r, max(c.g, c.b))); }
  gl_FragColor = vec4(c, 1.0);
}`
// ampliar: o nível menor, borrado, soma no nível maior (a mistura é aditiva)
const AMPLIAR = /* glsl */ `uniform sampler2D tFonte; uniform vec2 uPx; varying vec2 vUv;
void main() {
  vec3 c = 0.25 * (texture2D(tFonte, vUv + uPx * vec2(-0.5, -0.5)).rgb + texture2D(tFonte, vUv + uPx * vec2(0.5, -0.5)).rgb
    + texture2D(tFonte, vUv + uPx * vec2(-0.5, 0.5)).rgb + texture2D(tFonte, vUv + uPx * vec2(0.5, 0.5)).rgb);
  gl_FragColor = vec4(c, 1.0);
}`
const FINAL = /* glsl */ `uniform sampler2D tCena, tBloom; uniform float uExp, uBrilho, uContraste, uSat, uVig, uT, uAspecto; uniform vec3 uSombras, uLuzes; varying vec2 vUv;
vec3 RRTAndODTFit(vec3 v) { vec3 a = v * (v + 0.0245786) - 0.000090537; vec3 b = v * (0.983729 * v + 0.4329510) + 0.238081; return a / b; }
vec3 aces(vec3 c) {
  const mat3 entra = mat3(vec3(0.59719, 0.07600, 0.02840), vec3(0.35458, 0.90834, 0.13383), vec3(0.04823, 0.01566, 0.83777));
  const mat3 sai = mat3(vec3(1.60475, -0.10208, -0.00327), vec3(-0.53108, 1.10813, -0.07276), vec3(-0.07367, -0.00605, 1.07602));
  return clamp(sai * RRTAndODTFit(entra * (c * uExp / 0.6)), 0.0, 1.0);
}
vec3 paraSRGB(vec3 c) { return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }
float ruido(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
void main() {
  vec3 cru = max(texture2D(tCena, vUv).rgb, 0.0) + texture2D(tBloom, vUv).rgb * uBrilho; // o brilho entra antes do tonemapping
  vec3 col = paraSRGB(aces(cru));
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
  /** Desenha a cena na textura, o bloom nas texturas pequenas e a passada final na tela. */
  desenhar: (gl: THREE.WebGLRenderer, cena: THREE.Scene, camera: THREE.Camera, tom: Tom, t: number) => void
  descartar: () => void
}

/** bloom = null: sem bloom (só a correção de cor). */
export function novoPasseFinal(amostras: number, bloom: Bloom | null): PasseFinal {
  const textura = (extra?: THREE.RenderTargetOptions) => new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, ...extra })
  const alvo = textura({ samples: amostras })
  const niveis = Array.from({ length: bloom?.niveis ?? 0 }, () => textura({ depthBuffer: false })), de = bloom?.de ?? 1
  const material = (frag: string, uniforms: Record<string, THREE.IUniform>, soma = false) => new THREE.ShaderMaterial({
    uniforms, depthTest: false, depthWrite: false, toneMapped: false, vertexShader: VERT, fragmentShader: frag,
    ...(soma ? { transparent: true, blending: THREE.AdditiveBlending } : {}) })
  const uR = { tFonte: { value: alvo.texture }, uPx: { value: new THREE.Vector2() }, uPrimeira: { value: 0 } }
  const uA = { tFonte: { value: alvo.texture }, uPx: { value: new THREE.Vector2() } }
  const u = {
    tCena: { value: alvo.texture }, tBloom: { value: (niveis[0] ?? alvo).texture }, uExp: { value: 1 }, uBrilho: { value: 0 }, uContraste: { value: 1 }, uSat: { value: 1 },
    uVig: { value: 0 }, uT: { value: 0 }, uAspecto: { value: 1 }, uSombras: { value: new THREE.Color() }, uLuzes: { value: new THREE.Color() },
  }
  const reduzir = material(REDUZIR, uR), ampliar = material(AMPLIAR, uA, true), final = material(FINAL, u)
  // um triângulo que cobre a tela (um quadrado seriam dois, com a diagonal desenhada duas vezes)
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3))
  geo.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 2, 0, 0, 2], 2))
  const tela = new THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial>(geo, final); tela.frustumCulled = false
  const cenaTela = new THREE.Scene(); cenaTela.add(tela)
  const cam = new THREE.Camera(), tam = new THREE.Vector2()
  return {
    desenhar(gl, cena, camera, tom, t) {
      gl.getDrawingBufferSize(tam)
      if (alvo.width !== tam.x || alvo.height !== tam.y) {
        alvo.setSize(tam.x, tam.y)
        niveis.forEach((n, i) => n.setSize(Math.max(2, Math.round(tam.x / (de << i))), Math.max(2, Math.round(tam.y / (de << i)))))
      }
      gl.setRenderTarget(alvo); gl.render(cena, camera)
      // o bloom: reduz do maior para o menor (a primeira redução escolhe o que brilha)...
      tela.material = reduzir
      for (let i = 0; i < niveis.length; i++) {
        const fonte = i === 0 ? alvo : niveis[i - 1]
        uR.tFonte.value = fonte.texture; uR.uPx.value.set(1 / fonte.width, 1 / fonte.height); uR.uPrimeira.value = i === 0 ? 1 : 0
        gl.setRenderTarget(niveis[i]); gl.render(cenaTela, cam)
      }
      // ...e soma de volta do menor para o maior (sem limpar a textura: a soma é por cima do que já está nela)
      tela.material = ampliar
      const limpa = gl.autoClear; gl.autoClear = false
      for (let i = niveis.length - 1; i > 0; i--) {
        uA.tFonte.value = niveis[i].texture; uA.uPx.value.set(1 / niveis[i].width, 1 / niveis[i].height)
        gl.setRenderTarget(niveis[i - 1]); gl.render(cenaTela, cam)
      }
      gl.autoClear = limpa
      // a passada final, na tela
      tela.material = final
      u.uExp.value = tom.exposicao; u.uContraste.value = tom.contraste; u.uSat.value = tom.saturacao; u.uVig.value = tom.vinheta
      u.uBrilho.value = niveis.length ? tom.brilho / niveis.length : 0 // a soma dos níveis não cresce com a quantidade deles
      // as cores do tom são contas em cima da imagem pronta (sRGB): entram como foram escritas, sem virar "luz"
      tom.sombras.getRGB(u.uSombras.value, THREE.SRGBColorSpace); tom.luzes.getRGB(u.uLuzes.value, THREE.SRGBColorSpace)
      u.uT.value = t; u.uAspecto.value = tam.x / tam.y
      gl.setRenderTarget(null); gl.render(cenaTela, cam)
    },
    descartar() { alvo.dispose(); niveis.forEach((n) => n.dispose()); reduzir.dispose(); ampliar.dispose(); final.dispose(); geo.dispose() },
  }
}
