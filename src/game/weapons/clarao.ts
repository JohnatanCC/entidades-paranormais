// O clarão no cano: dois quadrados cruzados ao longo do cano e um de frente, com uma estrela pintada em pixel, que brilham sozinhos (sem luz nova na
// cena: no celular, cada luz pesa em tudo). A estrela é desenhada uma vez (16 × 16 px) e cada cor é um material só,
// dividido por todas as armas daquela cor; o clarão de cada arma é uma malha escondida, presa na pasta "cano" do modelo.
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

let estrela: THREE.CanvasTexture | null = null
const materiais = new Map<string, THREE.MeshBasicMaterial>()
let geometria: THREE.BufferGeometry | null = null

function pintarEstrela(): THREE.CanvasTexture {
  const c = document.createElement('canvas'); c.width = c.height = 16
  const g = c.getContext('2d')!
  // o miolo claro, os quatro raios e umas pontas soltas (pixel duro, sem degradê)
  g.fillStyle = 'rgba(255,255,255,0.55)'; g.fillRect(5, 5, 6, 6)
  g.fillStyle = '#fff'; g.fillRect(6, 6, 4, 4); g.fillRect(7, 1, 2, 14); g.fillRect(1, 7, 14, 2)
  g.fillStyle = 'rgba(255,255,255,0.6)'; for (const [x, y] of [[3, 3], [12, 3], [3, 12], [12, 12], [4, 11], [11, 4]]) g.fillRect(x, y, 1, 1)
  const t = new THREE.CanvasTexture(c)
  t.magFilter = t.minFilter = THREE.NearestFilter; t.colorSpace = THREE.SRGBColorSpace
  return t
}

/** Um clarão novo (escondido) da cor dada, de frente para +z (o cano); 1 m de comprimento: a arma escala (TIRO). */
export function novoClarao(cor: string): THREE.Mesh {
  estrela ??= pintarEstrela()
  if (!geometria) {
    // dois quadrados cruzados ao longo do cano, mais um de frente: de qualquer lado da câmera aparece
    const a = new THREE.PlaneGeometry(1, 1).rotateY(Math.PI / 2).translate(0, 0, 0.35)
    const b = new THREE.PlaneGeometry(1, 1).rotateY(Math.PI / 2).rotateZ(Math.PI / 2).translate(0, 0, 0.35)
    const f = new THREE.PlaneGeometry(0.7, 0.7).translate(0, 0, 0.05)
    geometria = mergeGeometries([a, b, f])!
    ;[a, b, f].forEach((x) => x.dispose())
  }
  let m = materiais.get(cor)
  if (!m) {
    m = new THREE.MeshBasicMaterial({ map: estrela, color: cor, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })
    materiais.set(cor, m)
  }
  const malha = new THREE.Mesh(geometria, m)
  malha.name = '#clarao'; malha.visible = false; malha.renderOrder = 10
  return malha
}

