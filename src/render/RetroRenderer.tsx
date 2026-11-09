// A imagem do jogo (do laboratório): a cena é desenhada numa textura na resolução do filtro e uma passada aplica
// por cima a ampliação nítida dos pixels, as cores reduzidas com pontilhado (5 bits, como no PS1), a vinheta,
// as linhas e a granulação. Coloque <RetroRenderer /> dentro do <Canvas> de uma cena de jogo: ele assume o desenho.
import { useEffect, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useSettings, type ImagemPreset } from '../settings/settings'
import { SNAPU } from './psx'

interface Preset { pixH: number; snap: number; dither: boolean; grain: number; vig: number; lines: number }
export const IMAGEM: Record<ImagemPreset, Preset> = {
  limpo: { pixH: 0, snap: 0, dither: false, grain: 12, vig: 35, lines: 0 },
  suave: { pixH: 540, snap: 240, dither: false, grain: 28, vig: 50, lines: 12 },
  ps1: { pixH: 300, snap: 110, dither: true, grain: 38, vig: 60, lines: 30 },
}

const FRAG = /* glsl */ `uniform sampler2D tDiffuse; uniform vec2 uIn, uOut; uniform float uSharp, uTime, uGrain, uGrainPx, uVig, uLines, uLinePx, uDither; varying vec2 vUv;
float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
float bayer2(vec2 a) { a = floor(a); return fract(dot(a, vec2(0.5, a.y * 0.75))); }
float bayer4(vec2 a) { return bayer2(0.5 * a) * 0.25 + bayer2(a); }
vec3 toSRGB(vec3 c) { return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }
void main() {
  vec2 uv = vUv;
  if (uSharp > 0.5) { vec2 p = uv * uIn, c = floor(p) + 0.5, f = (p - c) * (uOut / uIn); uv = (c + clamp(f, -0.5, 0.5)) / uIn; }
  vec3 col = toSRGB(clamp(texture2D(tDiffuse, uv).rgb, 0.0, 1.0));
  if (uDither > 0.5) { vec2 q = floor(gl_FragCoord.xy / max(1.0, uOut.y / uIn.y)); col = floor(col * 31.0 + bayer4(q)) / 31.0; }
  vec2 d = vUv - 0.5; d.x *= uOut.x / uOut.y;
  col *= 1.0 - uVig * 0.8 * smoothstep(0.3, 0.95, length(d));
  col *= 1.0 - uLines * 0.3 * step(uLinePx * 0.66, mod(gl_FragCoord.y, uLinePx));
  col += (hash(floor(gl_FragCoord.xy / uGrainPx) + floor(uTime * 24.0) * vec2(17.31, 41.73)) - 0.5) * uGrain * 0.2;
  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}`

export function RetroRenderer() {
  const { gl, scene, camera, size } = useThree()
  const { imagem } = useSettings()
  const post = useMemo(() => {
    const rt = new THREE.WebGLRenderTarget(4, 4, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, type: THREE.HalfFloatType })
    const u = { tDiffuse: { value: rt.texture }, uIn: { value: new THREE.Vector2(4, 4) }, uOut: { value: new THREE.Vector2(4, 4) }, uSharp: { value: 0 }, uTime: { value: 0 },
      uGrain: { value: 0 }, uGrainPx: { value: 1 }, uVig: { value: 0 }, uLines: { value: 0 }, uLinePx: { value: 3 }, uDither: { value: 0 } }
    const mat = new THREE.ShaderMaterial({ uniforms: u, depthTest: false, depthWrite: false, vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }', fragmentShader: FRAG })
    const sc = new THREE.Scene(), q = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat); q.frustumCulled = false; sc.add(q)
    return { rt, u, mat, sc, cam: new THREE.Camera() }
  }, [])
  useEffect(() => () => { post.rt.dispose(); post.mat.dispose() }, [post])
  useEffect(() => {
    const P = IMAGEM[imagem]
    post.u.uGrain.value = P.grain / 100; post.u.uVig.value = P.vig / 100; post.u.uLines.value = P.lines / 100; post.u.uDither.value = P.dither ? 1 : 0
    SNAPU.value = P.snap
  }, [imagem, post])
  useEffect(() => () => { SNAPU.value = 0 }, []) // fora da cena com filtro, o tremor desliga
  useFrame((st) => {
    const P = IMAGEM[imagem], dpr = gl.getPixelRatio(), W = Math.round(size.width * dpr), H = Math.round(size.height * dpr)
    const h = P.pixH ? Math.min(P.pixH, H) : H, w = Math.max(1, Math.round(h * W / H))
    if (post.rt.width !== w || post.rt.height !== h) post.rt.setSize(w, h)
    post.u.uIn.value.set(w, h); post.u.uOut.value.set(W, H); post.u.uSharp.value = h < H ? 1 : 0; post.u.uTime.value = st.clock.elapsedTime
    post.u.uLinePx.value = Math.max(2, Math.round(H / 300)); post.u.uGrainPx.value = Math.max(1, Math.round(H / 540))
    gl.setRenderTarget(post.rt); gl.render(scene, camera); gl.setRenderTarget(null); gl.render(post.sc, post.cam)
  }, 1)
  return null
}
