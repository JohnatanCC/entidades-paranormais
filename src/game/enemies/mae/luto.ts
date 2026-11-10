// O Luto: o líquido preto da Mãe. Ela mergulha nele, anda por baixo e sai dele. Os efeitos, leves para o celular (cada
// coisa uma malha só, reaproveitada; nenhuma luz nova na cena):
//   a poça: um disco escuro e molhado no chão (no Ver modelos; na arena, o chão todo é Luto);
//   as ondas: anéis que abrem e somem (10, reaproveitados; só desenham enquanto aparecem);
//   os respingos e as bolhas: pontos pretos que pulam e caem (todos numa chamada de desenho só);
//   o aviso: o chão que estufa, borbulha e brilha vermelho onde ela vai sair (um domo escuro; o brilho é dele mesmo).
// Quem chama é o golpe (golpes.ts), no lugar onde ela está.
import * as THREE from 'three'

const N_ANEIS = 10, N_GOTAS = 120
const COR = '#0d0a0b'

interface Anel { m: THREE.Mesh; t: number; dur: number; r0: number; r1: number; a: number }
export interface Luto {
  grupo: THREE.Group
  aneis: Anel[]
  gotas: THREE.Points; pos: Float32Array; vel: Float32Array; vida: Float32Array; prox: number
  domo: THREE.Mesh; brilho: number
}

/** O Luto (raio = o tamanho da poça; 0 = sem poça, só os efeitos). */
export function novoLuto(raio: number): Luto {
  const grupo = new THREE.Group(); grupo.name = 'luto'
  if (raio > 0) {
    const poca = new THREE.Mesh(new THREE.CircleGeometry(raio, 28).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: COR, roughness: 0.18, metalness: 0.1 }))
    poca.position.y = 0.004; grupo.add(poca)
  }
  const geoAnel = new THREE.RingGeometry(0.93, 1, 28).rotateX(-Math.PI / 2)
  const aneis = Array.from({ length: N_ANEIS }, (): Anel => {
    const m = new THREE.Mesh(geoAnel, new THREE.MeshBasicMaterial({ color: '#2a2224', transparent: true, depthWrite: false }))
    m.visible = false; m.position.y = 0.008; grupo.add(m)
    return { m, t: 0, dur: 0, r0: 0, r1: 0, a: 0 }
  })
  const pos = new Float32Array(N_GOTAS * 3).fill(-99), vel = new Float32Array(N_GOTAS * 3), vida = new Float32Array(N_GOTAS)
  const geo = new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(pos, 3))
  const gotas = new THREE.Points(geo, new THREE.PointsMaterial({ color: COR, size: 0.045, sizeAttenuation: true }))
  gotas.frustumCulled = false; grupo.add(gotas)
  const domo = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: COR, roughness: 0.2, emissive: '#8f1a12', emissiveIntensity: 0 }))
  domo.visible = false; grupo.add(domo)
  return { grupo, aneis, gotas, pos, vel, vida, prox: 0, domo, brilho: 0 }
}

/** Uma onda: abre de r0 a r1 (m) em dur (s), começando com opacidade a. */
export function anel(L: Luto, x: number, z: number, r0: number, r1: number, dur: number, a: number) {
  const o = L.aneis.reduce((m, e) => (e.t >= e.dur ? e : m.t / m.dur > e.t / e.dur ? m : e)) // um livre, ou o mais velho
  Object.assign(o, { t: 0, dur, r0, r1, a })
  o.m.position.x = x; o.m.position.z = z; o.m.visible = true
}

/** Um respingo: n gotas pulando de (x, y, z): lado = m/s para os lados, alto = m/s para cima, abre = o raio de onde saem (m). */
export function respingo(L: Luto, x: number, z: number, n: number, lado: number, alto: number, y = 0.02, abre = 0.15) {
  for (let i = 0; i < n; i++) {
    const j = L.prox; L.prox = (L.prox + 1) % N_GOTAS
    const a = Math.random() * Math.PI * 2, v = lado * (0.3 + 0.7 * Math.random())
    L.pos.set([x + Math.cos(a) * abre, y, z + Math.sin(a) * abre], j * 3)
    L.vel.set([Math.cos(a) * v, alto * (0.5 + 0.5 * Math.random()), Math.sin(a) * v], j * 3)
    L.vida[j] = 2
  }
}

/** Uma bolha que sobe e estoura (um anel pequeno e uma gota). */
export function bolha(L: Luto, x: number, z: number, k = 1) {
  anel(L, x, z, 0.02, 0.12 + 0.08 * k, 0.35, 0.8)
  respingo(L, x, z, 1, 0.2, 0.9 * k)
}

/** O aviso: o chão estufa em (x, z) (k = 0..1 o quanto) e brilha vermelho; k = 0 some. */
export function estufar(L: Luto, x: number, z: number, k: number, t: number) {
  L.domo.visible = k > 0.001
  if (!L.domo.visible) return
  L.domo.position.set(x, 0, z)
  const h = 0.02 + 0.3 * k * (1 + 0.12 * Math.sin(t * 15))
  L.domo.scale.set(0.5 + 0.35 * k, h, 0.5 + 0.35 * k)
  ;(L.domo.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.9 * k * (0.8 + 0.2 * Math.sin(t * 9)) // pulsa
}

/** Um quadro: as ondas abrem e somem, as gotas caem e somem no chão. */
export function passoLuto(L: Luto, dt: number) {
  for (const o of L.aneis) {
    if (!o.m.visible) continue
    o.t += dt
    const u = o.t / o.dur
    if (u >= 1) { o.m.visible = false; continue }
    const r = o.r0 + (o.r1 - o.r0) * (1 - (1 - u) * (1 - u))
    o.m.scale.set(r, 1, r)
    ;(o.m.material as THREE.MeshBasicMaterial).opacity = o.a * (1 - u)
  }
  let mexeu = false
  for (let j = 0; j < N_GOTAS; j++) {
    if (L.vida[j] <= 0) continue
    mexeu = true
    L.vida[j] -= dt
    const i = j * 3
    L.vel[i + 1] -= 9.8 * dt
    L.pos[i] += L.vel[i] * dt; L.pos[i + 1] += L.vel[i + 1] * dt; L.pos[i + 2] += L.vel[i + 2] * dt
    if (L.pos[i + 1] < 0 || L.vida[j] <= 0) { L.vida[j] = 0; L.pos[i + 1] = -99 } // caiu no Luto: some
  }
  if (mexeu) L.gotas.geometry.attributes.position.needsUpdate = true
}
