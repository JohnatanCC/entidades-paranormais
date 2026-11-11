// A sombra de chão: um círculo escuro e macio embaixo do personagem. É o que "cola" ele no chão em qualquer nível de
// qualidade e em qualquer luz (a sombra projetada de verdade só existe no Médio e no Alto, e só onde uma lâmpada com
// sombra ou a lua batem). Custa quase nada: um quadrado chapado, com um material e uma textura divididos por todos.
import * as THREE from 'three'

/** O raio (m) e o quanto escurece no meio (0 a 1). */
export const SOMBRA_DE_CHAO = { raio: 0.5, forca: 0.5 }

let material: THREE.MeshBasicMaterial | null = null
const geometria = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2)

function materialDaSombra() {
  if (material) return material
  // um degradê redondo: escuro no meio, some na borda
  const c = document.createElement('canvas'); c.width = c.height = 32
  const g = c.getContext('2d')!, gr = g.createRadialGradient(16, 16, 0, 16, 16, 16)
  gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(0.55, 'rgba(0,0,0,0.55)'); gr.addColorStop(1, 'rgba(0,0,0,0)')
  g.fillStyle = gr; g.fillRect(0, 0, 32, 32)
  material = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), color: '#000000', transparent: true, opacity: SOMBRA_DE_CHAO.forca, depthWrite: false,
    polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 })
  return material
}

/** Uma sombra de chão (ponha na cena e leve para os pés do personagem a cada quadro, um tico acima do chão). */
export function novaSombraDeChao(raio = SOMBRA_DE_CHAO.raio): THREE.Mesh {
  const m = new THREE.Mesh(geometria, materialDaSombra())
  m.name = 'sombra-de-chao'; m.scale.setScalar(raio * 2); m.renderOrder = 1
  return m
}
