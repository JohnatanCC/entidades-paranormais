// O estouro dos demônios (docs/demonios.md): com a vida zerada, o Sombrio estoura num respingo de matéria escura e
// deixa uma mancha no chão que seca em poucos segundos. Não é animação de morte: o corpo some na hora e o efeito fica
// no lugar. Leve para o celular: os cubos de todos os estouros são uma malha só (InstancedMesh) e as manchas outra, num
// estoque fixo (nada é criado no meio da luta); cada uma só desenha enquanto tem algo vivo. Ponha `grupo` na cena uma vez.
import * as THREE from 'three'

export const ESTOURO = {
  cubos: 26, // por estouro (três deles são os olhos, vermelho vivo)
  tamanho: [0.035, 0.09], // m
  vel: [1.4, 3.4], sobe: [1.0, 3.0], gravidade: 9.8, // m/s para os lados e para cima; m/s²
  vida: [0.9, 1.7], encolhe: 0.4, // s até começar a sumir, e quanto leva encolhendo
  pano: 0.2, // a parte dos cubos que é o pano vermelho do capuz
  mancha: { cresce: 0.2, fica: 0.9, seca: 2.6, forca: 0.85 }, // s: abre, fica, seca até sumir; o quanto escurece
}
const N_CUBOS = 130, N_MANCHAS = 6
const MATERIA = new THREE.Color('#0c0a10'), PANO = new THREE.Color('#6e1414'), OLHO = new THREE.Color('#ff3a2a')

interface Mancha { p: THREE.Vector3; r: number; giro: number; t: number }
export interface Estouro {
  grupo: THREE.Group
  cubos: THREE.InstancedMesh; p: Float32Array; v: Float32Array; rot: Float32Array; tam: Float32Array; t: Float32Array; vida: Float32Array; chao: Float32Array; prox: number
  manchas: THREE.InstancedMesh; forca: THREE.InstancedBufferAttribute; mancha: Mancha[]
}

/** A mancha: um borrão de pixels pretos com escorridos (desenhado uma vez, dividido por todos). */
function texturaDaMancha() {
  const c = document.createElement('canvas'); c.width = c.height = 32
  const g = c.getContext('2d')!
  let s = 7
  const r = () => ((s = (s * 16807) % 2147483647) / 2147483647)
  g.fillStyle = '#000'
  for (let i = 0; i < 9; i++) { const a = r() * 6.28, d = r() * 6; g.beginPath(); g.arc(16 + Math.cos(a) * d, 16 + Math.sin(a) * d, 5 + r() * 4, 0, 6.28); g.fill() }
  for (let i = 0; i < 7; i++) { const a = r() * 6.28; for (let k = 8; k < 14 + r() * 2; k++) g.fillRect(Math.round(16 + Math.cos(a) * k), Math.round(16 + Math.sin(a) * k), 2, 2) }
  for (let i = 0; i < 10; i++) { const a = r() * 6.28, d = 12 + r() * 3; g.fillRect(Math.round(16 + Math.cos(a) * d), Math.round(16 + Math.sin(a) * d), 1, 1) }
  const t = new THREE.CanvasTexture(c); t.magFilter = THREE.NearestFilter
  return t
}

export function novoEstouro(): Estouro {
  const grupo = new THREE.Group(); grupo.name = 'estouros'
  const cubos = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial(), N_CUBOS)
  cubos.frustumCulled = false; cubos.visible = false
  const zero = new THREE.Matrix4().makeScale(0, 0, 0)
  for (let i = 0; i < N_CUBOS; i++) { cubos.setMatrixAt(i, zero); cubos.setColorAt(i, MATERIA) }
  grupo.add(cubos)
  // as manchas: um quadrado no chão, desenhado várias vezes; a força (a opacidade) de cada uma num atributo
  const geo = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2)
  const forca = new THREE.InstancedBufferAttribute(new Float32Array(N_MANCHAS), 1)
  geo.setAttribute('aForca', forca)
  const mat = new THREE.MeshBasicMaterial({ map: texturaDaMancha(), color: '#ffffff', transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 })
  mat.onBeforeCompile = (s) => {
    s.vertexShader = 'attribute float aForca;\nvarying float vForca;\n' + s.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvForca = aForca;')
    s.fragmentShader = 'varying float vForca;\n' + s.fragmentShader.replace('vec4 diffuseColor = vec4( diffuse, opacity );', 'vec4 diffuseColor = vec4( diffuse, opacity * vForca );')
  }
  mat.customProgramCacheKey = () => 'manchas-estouro'
  const manchas = new THREE.InstancedMesh(geo, mat, N_MANCHAS)
  manchas.frustumCulled = false; manchas.visible = false; manchas.renderOrder = 1
  for (let i = 0; i < N_MANCHAS; i++) manchas.setMatrixAt(i, zero)
  grupo.add(manchas)
  return {
    grupo, cubos, p: new Float32Array(N_CUBOS * 3), v: new Float32Array(N_CUBOS * 3), rot: new Float32Array(N_CUBOS * 3), tam: new Float32Array(N_CUBOS),
    t: new Float32Array(N_CUBOS).fill(99), vida: new Float32Array(N_CUBOS), chao: new Float32Array(N_CUBOS), prox: 0,
    manchas, forca, mancha: Array.from({ length: N_MANCHAS }, () => ({ p: new THREE.Vector3(), r: 0, giro: 0, t: 99 })),
  }
}

const sorteio = (ab: number[]) => ab[0] + Math.random() * (ab[1] - ab[0])

/** Estoura no centro (o meio do corpo), com o tamanho do corpo (raio, m), sobre o chão na altura `chao`. o: quantos
 *  cubos e quantos deles são olhos (vermelho vivo), o tamanho dos cubos (vezes o normal; sem ele, acompanha o raio até
 *  o normal) e se deixa a mancha (o projétil que bate: poucos cubos, sem olhos). */
export function estourar(E: Estouro, centro: THREE.Vector3, raio: number, chao: number, o: { cubos?: number; olhos?: number; mancha?: boolean; tamanho?: number } = {}) {
  const C = ESTOURO, olhos = o.olhos ?? 3, tam = o.tamanho ?? Math.min(1, raio / 0.3)
  for (let n = 0; n < (o.cubos ?? C.cubos); n++) {
    const i = E.prox; E.prox = (E.prox + 1) % E.t.length
    const a = Math.random() * Math.PI * 2, fora = sorteio(C.vel)
    E.p.set([centro.x + Math.cos(a) * raio * 0.5 * Math.random(), centro.y + (Math.random() - 0.4) * raio, centro.z + Math.sin(a) * raio * 0.5 * Math.random()], i * 3)
    E.v.set([Math.cos(a) * fora, sorteio(C.sobe), Math.sin(a) * fora], i * 3)
    E.rot.set([Math.random() * 6, Math.random() * 6, Math.random() * 6], i * 3)
    E.tam[i] = sorteio(C.tamanho) * (n < olhos ? 0.7 : 1) * tam; E.t[i] = 0; E.vida[i] = sorteio(C.vida); E.chao[i] = chao
    E.cubos.setColorAt(i, n < olhos ? OLHO : Math.random() < C.pano ? PANO : MATERIA)
  }
  if (E.cubos.instanceColor) E.cubos.instanceColor.needsUpdate = true
  if (o.mancha === false) return
  const m = E.mancha.reduce((a, b) => (b.t > a.t ? b : a)) // a mais velha (ou uma livre)
  m.p.set(centro.x, chao + 0.005, centro.z); m.r = raio * 2.6; m.giro = Math.random() * Math.PI * 2; m.t = 0
}

const _p = new THREE.Vector3(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _s = new THREE.Vector3(), _m = new THREE.Matrix4()
const suave = (k: number) => k * k * (3 - 2 * k)

/** Um quadro dos estouros: os cubos voam, caem e grudam no chão, encolhem e somem; as manchas abrem e secam. */
export function passoEstouro(E: Estouro, dt: number) {
  const C = ESTOURO
  let vivos = false, mexeu = false
  for (let i = 0; i < E.t.length; i++) {
    if (E.t[i] > E.vida[i] + C.encolhe) continue
    E.t[i] += dt; mexeu = true
    const k = i * 3, fim = E.t[i] > E.vida[i] + C.encolhe
    if (fim) { E.cubos.setMatrixAt(i, _m.makeScale(0, 0, 0)); continue }
    vivos = true
    const meia = E.tam[i] / 2
    if (E.p[k + 1] > E.chao[i] + meia + 1e-4 || E.v[k + 1] > 0) { // no ar: a gravidade, girando
      E.v[k + 1] -= C.gravidade * dt
      for (let j = 0; j < 3; j++) { E.p[k + j] += E.v[k + j] * dt; E.rot[k + j] += dt * 9 * (j + 1) * 0.5 }
      if (E.p[k + 1] < E.chao[i] + meia) { E.p[k + 1] = E.chao[i] + meia; E.v[k] *= 0.25; E.v[k + 1] = 0; E.v[k + 2] *= 0.25 } // bate e gruda
    } else { E.p[k] += E.v[k] * dt; E.p[k + 2] += E.v[k + 2] * dt; E.v[k] *= 1 - Math.min(1, dt * 12); E.v[k + 2] *= 1 - Math.min(1, dt * 12) } // escorrega um tico
    const some = E.t[i] > E.vida[i] ? 1 - (E.t[i] - E.vida[i]) / C.encolhe : 1, t = E.tam[i] * some
    E.cubos.setMatrixAt(i, _m.compose(_p.set(E.p[k], E.p[k + 1], E.p[k + 2]), _q.setFromEuler(_e.set(E.rot[k], E.rot[k + 1], E.rot[k + 2])), _s.set(t, t * (E.p[k + 1] <= E.chao[i] + meia + 1e-4 ? 0.5 : 1), t)))
  }
  E.cubos.visible = vivos
  if (mexeu) E.cubos.instanceMatrix.needsUpdate = true
  const M = C.mancha, total = M.cresce + M.fica + M.seca
  let manchas = false
  E.mancha.forEach((m, i) => {
    if (m.t > total) return
    m.t += dt
    if (m.t > total) { E.manchas.setMatrixAt(i, _m.makeScale(0, 0, 0)); E.forca.setX(i, 0) } else {
      const abre = suave(Math.min(1, m.t / M.cresce)), seca = Math.max(0, (m.t - M.cresce - M.fica) / M.seca), r = m.r * abre * (1 - 0.15 * seca)
      E.manchas.setMatrixAt(i, _m.compose(m.p, _q.setFromAxisAngle(_s.set(0, 1, 0), m.giro), _s.set(r, 1, r)))
      E.forca.setX(i, M.forca * (1 - seca)); manchas = true
    }
    E.manchas.instanceMatrix.needsUpdate = true; E.forca.needsUpdate = true
  })
  E.manchas.visible = manchas
}
