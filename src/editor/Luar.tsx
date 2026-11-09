// O luar da janela (do laboratório, "o luar"): o feixe que entra pelos vidros e desce até o chão, macio nas laterais
// (some quando você olha a face de lado), forte no vidro e apagando no chão, sem ofuscar quando você entra nele;
// a mancha no chão com a borda esfumada; um brilho leve no vidro; e a poeira boiando devagar dentro do feixe.
// Tudo no referencial da janela (u ao longo da parede, y para cima, z atravessando; zIn = o lado de dentro).
import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const LUA = new THREE.Vector3(0.12, -0.72, 1).normalize() // o luar desce entrando (+z = para dentro)
const POEIRA_POR_VIDRO = 22

// ---------- os materiais (um só para todas as janelas) ----------
const LUAR = { t: { value: 0 }, k: { value: 1 }, cor: { value: new THREE.Color('#a9c2f0') }, nevoa: { value: 0.017 } }
const feixeMat = new THREE.ShaderMaterial({
  uniforms: { uT: LUAR.t, uK: LUAR.k, uCol: LUAR.cor, uFogD: LUAR.nevoa },
  vertexShader: `varying float vV; varying vec3 vN, vW, vVw; attribute float aV;
    void main() { vV = aV; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal); vVw = cameraPosition - w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
  fragmentShader: `uniform float uK, uT, uFogD; uniform vec3 uCol; varying float vV; varying vec3 vN, vW, vVw;
    void main() {
      float dist = length(vVw); vec3 V = vVw / dist;
      float face = pow(abs(dot(normalize(vN), V)), 0.9);            // de lado some: a borda fica macia
      float along = (1.0 - 0.55 * vV) * smoothstep(1.0, 0.82, vV) * smoothstep(0.0, 0.05, vV); // forte no vidro, some no chão
      float near = smoothstep(0.6, 3.0, dist);                        // não ofusca quando você entra no feixe
      float dust = 0.82 + 0.18 * sin(vW.x * 3.1 + vW.y * 2.3 + uT * 0.6) * sin(vW.z * 2.7 - uT * 0.45); // o ar mexendo
      float fog = exp(-uFogD * uFogD * dist * dist);
      gl_FragColor = vec4(uCol * (0.42 * uK * face * along * near * dust * fog), 1.0);
    }`,
  transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
})

/** Um degradê redondo (o brilho e cada grão de poeira) e um quadrado de borda esfumada (a mancha no chão). */
function textura(desenho: (g: CanvasRenderingContext2D, n: number) => void, n = 32) {
  const c = document.createElement('canvas'); c.width = c.height = n
  desenho(c.getContext('2d')!, n)
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace
  return t
}
const redondo = textura((g, n) => { const gr = g.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2); gr.addColorStop(0, 'rgba(255,255,255,0.9)'); gr.addColorStop(0.45, 'rgba(255,255,255,0.25)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, n, n) })
const esfumado = textura((g, n) => {
  const img = g.createImageData(n, n)
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const u = x / (n - 1), v = y / (n - 1), e = Math.min(u, 1 - u, v, 1 - v), a = Math.min(1, e / 0.22), i = (y * n + x) * 4
    img.data[i] = img.data[i + 1] = img.data[i + 2] = 255; img.data[i + 3] = 255 * a * a * (3 - 2 * a)
  }
  g.putImageData(img, 0, 0)
})
const manchaMat = new THREE.MeshBasicMaterial({ map: esfumado, color: '#8fb0e8', transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -8 })
const brilhoMat = new THREE.SpriteMaterial({ map: redondo, color: '#9fb8e0', transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false })
const poeiraMat = new THREE.PointsMaterial({ map: redondo, color: '#dfe8ff', size: 0.05, sizeAttenuation: true, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false })

type V3 = [number, number, number]
interface Caixa { a: V3[]; f: V3[] } // os cantos de um vidro e onde o luar deles toca o chão

/** O feixe (as laterais de cada vidro projetadas até o chão), a mancha e as caixas da poeira. */
function montar(W: number, h0: number, h1: number, zIn: number, verticais: number[]) {
  const d = new THREE.Vector3(LUA.x, LUA.y, LUA.z * zIn), chao = 0.012
  const proj = (u: number, y: number): V3 => { const t = (y - chao) / -d.y; return [u + d.x * t, chao, d.z * t] }
  // os vidros: entre os caixilhos, de baixo e de cima da guilhotina
  const cortes = [0, ...verticais, W], vm = (h0 + h1) / 2, g = 0.04
  const caixas: Caixa[] = []
  for (let i = 0; i < cortes.length - 1; i++) for (const [v0, v1] of [[h0 + 0.05, vm - g], [vm + g, h1 - 0.05]]) {
    const u0 = cortes[i] + g, u1 = cortes[i + 1] - g
    const a: V3[] = [[u0, v0, 0], [u1, v0, 0], [u1, v1, 0], [u0, v1, 0]]
    caixas.push({ a, f: a.map(([u, y]) => proj(u, y)) })
  }
  const fp: number[] = [], fn: number[] = [], fv: number[] = [], mp: number[] = [], mu: number[] = []
  const e1 = new THREE.Vector3(), e2 = new THREE.Vector3()
  for (const { a, f } of caixas) {
    for (let e = 0; e < 4; e++) {
      const a0 = a[e], a1 = a[(e + 1) % 4], b0 = f[e], b1 = f[(e + 1) % 4]
      e1.set(a1[0] - a0[0], a1[1] - a0[1], a1[2] - a0[2]).cross(e2.set(b0[0] - a0[0], b0[1] - a0[1], b0[2] - a0[2])).normalize()
      for (const [p, v] of [[a0, 0], [a1, 0], [b1, 1], [a0, 0], [b1, 1], [b0, 1]] as [V3, number][]) { fp.push(...p); fn.push(e1.x, e1.y, e1.z); fv.push(v) }
    }
    for (const [p, uv] of [[f[0], [0, 0]], [f[1], [1, 0]], [f[2], [1, 1]], [f[0], [0, 0]], [f[2], [1, 1]], [f[3], [0, 1]]] as [V3, [number, number]][]) { mp.push(...p); mu.push(...uv) }
  }
  const feixe = new THREE.BufferGeometry()
  feixe.setAttribute('position', new THREE.Float32BufferAttribute(fp, 3)); feixe.setAttribute('normal', new THREE.Float32BufferAttribute(fn, 3)); feixe.setAttribute('aV', new THREE.Float32BufferAttribute(fv, 1))
  const mancha = new THREE.BufferGeometry()
  mancha.setAttribute('position', new THREE.Float32BufferAttribute(mp, 3)); mancha.setAttribute('uv', new THREE.Float32BufferAttribute(mu, 2))
  // a poeira: cada grão tem um vidro, um ponto (u, v) nele e uma fase
  const n = caixas.length * POEIRA_POR_VIDRO, sementes = new Float32Array(n * 4)
  for (let i = 0; i < n; i++) { sementes[i * 4] = Math.random(); sementes[i * 4 + 1] = Math.random(); sementes[i * 4 + 2] = Math.random() * 6.28; sementes[i * 4 + 3] = (Math.random() * caixas.length) | 0 }
  const poeira = new THREE.BufferGeometry()
  poeira.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3))
  return { feixe, mancha, poeira, caixas, sementes, n }
}

export function Luar({ W, h0, h1, zIn, verticais }: { W: number; h0: number; h1: number; zIn: number; verticais: number[] }) {
  const l = useMemo(() => montar(W, h0, h1, zIn, verticais), [W, h0, h1, zIn, verticais])
  useEffect(() => () => { l.feixe.dispose(); l.mancha.dispose(); l.poeira.dispose() }, [l])
  const pontos = useRef<THREE.Points>(null)

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    LUAR.t.value = t
    // a poeira desce devagar do vidro para o chão, balançando um pouco (do laboratório: dustTick)
    const pos = l.poeira.attributes.position as THREE.BufferAttribute, s = l.sementes
    for (let i = 0; i < l.n; i++) {
      const b = l.caixas[s[i * 4 + 3]], u = s[i * 4], v = s[i * 4 + 1], ph = s[i * 4 + 2], w = (v + t * 0.01 + ph) % 1
      const a = b.a, f = b.f
      const ax = a[0][0] + (a[1][0] - a[0][0]) * u, ay = a[0][1] + (a[3][1] - a[0][1]) * v
      const fx = f[0][0] + (f[1][0] - f[0][0]) * u, fz = f[0][2] + (f[3][2] - f[0][2]) * v
      pos.setXYZ(i, ax + (fx - ax) * w + Math.sin(t * 0.3 + ph) * 0.08, ay + (f[0][1] - ay) * w + Math.sin(t * 0.21 + ph * 2) * 0.1, a[0][2] + (fz - a[0][2]) * w)
    }
    pos.needsUpdate = true
  })

  return (
    <>
      <mesh geometry={l.feixe} material={feixeMat} renderOrder={3} frustumCulled={false} />
      <mesh geometry={l.mancha} material={manchaMat} renderOrder={2} />
      <sprite material={brilhoMat} position={[W / 2, (h0 + h1) / 2, zIn * 0.12]} scale={[W * 1.5, (h1 - h0) * 1.4, 1]} renderOrder={3} />
      <points ref={pontos} geometry={l.poeira} material={poeiraMat} frustumCulled={false} renderOrder={4} />
    </>
  )
}
