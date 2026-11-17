// As nuvens de fumaça de pixel que os fantasmas do capítulo 2 dividem (docs/cap2-sombra.md): a fumaça dentro do manto
// do Mestre (mestre/fumaca.ts) e a Gralha estourando em fumaça (gralha/efeitos.ts). Leve: todas as nuvens de um efeito
// são uma malha só (InstancedMesh), viradas para a câmera no shader (nenhuma conta por nuvem além da posição).
// Cada nuvem: a posição e o tamanho na matriz dela; a opacidade em `forca`; o giro (de quarto em quarto de volta) em `giro`.
import * as THREE from 'three'

export interface Nuvens { malha: THREE.InstancedMesh; forca: THREE.InstancedBufferAttribute; giro: THREE.InstancedBufferAttribute }

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

/** Um estoque de `n` nuvens da cor `cor` (todas começam invisíveis: tamanho e força 0). */
export function novasNuvens(n: number, cor: string): Nuvens {
  const geo = new THREE.PlaneGeometry(1, 1)
  const forca = new THREE.InstancedBufferAttribute(new Float32Array(n), 1), giro = new THREE.InstancedBufferAttribute(new Float32Array(n), 1)
  geo.setAttribute('aForca', forca); geo.setAttribute('aGiro', giro)
  const mat = new THREE.MeshBasicMaterial({ map: texturaDaNuvem(), color: cor, transparent: true, depthWrite: false })
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
  mat.customProgramCacheKey = () => 'nuvens-de-fumaca'
  const malha = new THREE.InstancedMesh(geo, mat, n)
  malha.name = 'fumaca'; malha.frustumCulled = false; malha.renderOrder = 2
  const zero = new THREE.Matrix4().makeScale(0, 0, 0)
  for (let i = 0; i < n; i++) malha.setMatrixAt(i, zero)
  return { malha, forca, giro }
}

export function descartarNuvens(N: Nuvens) { N.malha.geometry.dispose(); (N.malha.material as THREE.Material).dispose() }
