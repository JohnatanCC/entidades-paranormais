// A fumaça escura dentro do manto do Mestre (docs/cap2-sombra.md): uma camada de nuvens de pixel que sobe do chão por
// dentro do manto e some na cintura; um pouco escorre por baixo da barra. Fecha os vãos entre as tiras e esconde as
// pernas: ele parece sair da fumaça. Leve: todas as nuvens são uma malha só (InstancedMesh), viradas para a câmera no
// shader (nenhuma conta por nuvem além da posição), num estoque fixo. Fica presa no root dele.
import * as THREE from 'three'
import { FUMACA } from './numeros'

export interface Fumaca {
  malha: THREE.InstancedMesh
  forca: THREE.InstancedBufferAttribute; giro: THREE.InstancedBufferAttribute
  p: Float32Array; v: Float32Array; t: Float32Array; vida: Float32Array; tam: Float32Array; auge: Float32Array; rasteira: Uint8Array
  ultimo: THREE.Vector3 | null // onde o root estava (a fumaça fica para trás quando ele anda)
}

/** A nuvem: um borrão redondo de pixels com a beirada falhada (desenhado uma vez, dividido por todas). */
let textura: THREE.Texture | null = null
function texturaDaNuvem() {
  if (textura) return textura
  const N = 16, c = document.createElement('canvas'); c.width = c.height = N
  const g = c.getContext('2d')!, img = g.createImageData(N, N)
  let s = 5
  const r = () => ((s = (s * 16807) % 2147483647) / 2147483647)
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const d = Math.hypot(x - 7.5, y - 7.5) / 7.5, i = (y * N + x) * 4
    // cheia no meio, falhando para a beirada (o pontilhado do pixel art, sem degradê liso)
    const a = d < 0.45 ? 1 : d > 1 ? 0 : r() < (1 - d) * 1.7 ? 1 : 0
    img.data[i] = img.data[i + 1] = img.data[i + 2] = 255; img.data[i + 3] = a * 255
  }
  g.putImageData(img, 0, 0)
  textura = new THREE.CanvasTexture(c); textura.magFilter = THREE.NearestFilter; textura.minFilter = THREE.NearestFilter
  return textura
}

const rnd = (a: number, b: number) => a + Math.random() * (b - a)

export function novaFumaca(): Fumaca {
  const N = FUMACA.nuvens, geo = new THREE.PlaneGeometry(1, 1)
  const forca = new THREE.InstancedBufferAttribute(new Float32Array(N), 1), giro = new THREE.InstancedBufferAttribute(new Float32Array(N), 1)
  geo.setAttribute('aForca', forca); geo.setAttribute('aGiro', giro)
  const mat = new THREE.MeshBasicMaterial({ map: texturaDaNuvem(), color: FUMACA.cor, transparent: true, depthWrite: false })
  // cada nuvem é um quadrado virado para a câmera: o centro vem da posição dela e os cantos abrem na tela
  mat.onBeforeCompile = (s) => {
    s.vertexShader = 'attribute float aForca;\nattribute float aGiro;\nvarying float vForca;\n' + s.vertexShader.replace('#include <project_vertex>', [
      'vForca = aForca;',
      'vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4( 0.0, 0.0, 0.0, 1.0 );',
      'float cg = cos( aGiro ), sg = sin( aGiro );',
      'mvPosition.xy += mat2( cg, -sg, sg, cg ) * position.xy * length( instanceMatrix[ 0 ].xyz );',
      'gl_Position = projectionMatrix * mvPosition;',
    ].join('\n'))
    s.fragmentShader = 'varying float vForca;\n' + s.fragmentShader.replace('vec4 diffuseColor = vec4( diffuse, opacity );', 'vec4 diffuseColor = vec4( diffuse, opacity * vForca );')
  }
  mat.customProgramCacheKey = () => 'fumaca-mestre'
  const malha = new THREE.InstancedMesh(geo, mat, N)
  malha.name = 'fumaca'; malha.frustumCulled = false; malha.renderOrder = 2
  const F: Fumaca = {
    malha, forca, giro, p: new Float32Array(N * 3), v: new Float32Array(N * 3), t: new Float32Array(N), vida: new Float32Array(N),
    tam: new Float32Array(N), auge: new Float32Array(N), rasteira: new Uint8Array(N), ultimo: null,
  }
  // já começa cheia: cada nuvem num ponto diferente da vida
  for (let i = 0; i < N; i++) { nascer(F, i); F.t[i] = Math.random() * F.vida[i]; F.p[i * 3 + 1] += F.v[i * 3 + 1] * F.t[i] }
  return F
}

function nascer(F: Fumaca, i: number) {
  const C = FUMACA, a = Math.random() * Math.PI * 2, rasteira = Math.random() < C.rasteira
  const r = C.raio[0] * (rasteira ? rnd(0.7, 1.05) : Math.sqrt(Math.random()) * 0.85)
  F.p[i * 3] = Math.sin(a) * r; F.p[i * 3 + 1] = rasteira ? rnd(0.04, 0.12) : rnd(0.05, 0.3); F.p[i * 3 + 2] = Math.cos(a) * r * 0.85
  F.v[i * 3] = rasteira ? Math.sin(a) * C.escorre : 0; F.v[i * 3 + 1] = rasteira ? 0.015 : rnd(C.sobe[0], C.sobe[1]); F.v[i * 3 + 2] = rasteira ? Math.cos(a) * C.escorre : 0
  F.t[i] = 0; F.vida[i] = rnd(C.vida[0], C.vida[1]); F.rasteira[i] = rasteira ? 1 : 0
  F.tam[i] = rnd(C.tamanho[0], C.tamanho[1]) * (rasteira ? 1.25 : 1); F.auge[i] = rnd(C.forca[0], C.forca[1]) * (rasteira ? 0.6 : 1)
  F.giro.array[i] = Math.floor(Math.random() * 4) * (Math.PI / 2); F.giro.needsUpdate = true // de pixel: só de quarto em quarto de volta
}

const _m = new THREE.Matrix4(), _d = new THREE.Vector3(), _a = new THREE.Vector3(), _q = new THREE.Quaternion()

/** Um quadro da fumaça. root = o Mestre (ela fica um pouco para trás quando ele anda). */
export function passoFumaca(F: Fumaca, root: THREE.Object3D, dt: number) {
  const C = FUMACA, N = C.nuvens
  // o quanto ele andou, no espaço dele: as nuvens que já existem ficam onde estavam no mundo (quase)
  root.getWorldPosition(_d)
  if (!F.ultimo) F.ultimo = _d.clone()
  const andou = _a.copy(_d).sub(F.ultimo); F.ultimo.copy(_d)
  if (andou.lengthSq() > 4) andou.set(0, 0, 0) // um salto (teleporte): não arrasta
  andou.applyQuaternion(root.getWorldQuaternion(_q).invert()).multiplyScalar(C.fica)
  const giro = C.gira * dt, cg = Math.cos(giro), sg = Math.sin(giro)
  for (let i = 0; i < N; i++) {
    const k = i * 3
    if ((F.t[i] += dt) >= F.vida[i]) nascer(F, i)
    let x = F.p[k] - andou.x + F.v[k] * dt, y = F.p[k + 1] + F.v[k + 1] * dt, z = F.p[k + 2] - andou.z + F.v[k + 2] * dt
    if (!F.rasteira[i]) {
      // gira devagar em volta do corpo e fecha com a altura, para ficar dentro do manto (que afina para cima)
      const gx = x * cg + z * sg, gz = -x * sg + z * cg, h = Math.min(1, y / C.alto), lim = C.raio[0] + (C.raio[1] - C.raio[0]) * h, r = Math.hypot(gx, gz)
      const f = r > lim ? 1 - Math.min(1, dt * 2) * (1 - lim / r) : 1
      x = gx * f; z = gz * f
      if (y > C.alto) F.t[i] = Math.max(F.t[i], F.vida[i] - C.sai) // chegou na cintura: some
    }
    F.p[k] = x; F.p[k + 1] = y; F.p[k + 2] = z
    const t = F.t[i], resta = F.vida[i] - t, vida = t / F.vida[i]
    F.forca.array[i] = F.auge[i] * Math.min(1, t / C.entra) * Math.max(0, Math.min(1, resta / C.sai))
    const s = F.tam[i] * (1 + (C.cresce - 1) * vida)
    F.malha.setMatrixAt(i, _m.makeScale(s, s, s).setPosition(x, y, z))
  }
  F.malha.instanceMatrix.needsUpdate = true; F.forca.needsUpdate = true
}

export function descartarFumaca(F: Fumaca) { F.malha.geometry.dispose(); (F.malha.material as THREE.Material).dispose() }
