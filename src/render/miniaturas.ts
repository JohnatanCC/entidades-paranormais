// As miniaturas do catálogo de objetos: cada tipo (o modelo do Blockbench, render/objetos3d.ts) é fotografado uma vez,
// num desenhador escondido, de cima e de lado, como no catálogo do The Sims. A imagem fica guardada (data URL).
// Enquanto a textura do modelo carrega, a foto não sai (volta ''): quem mostra espera o aviso e pede de novo.
import * as THREE from 'three'
import { texturasCarregando } from './bbmodel'
import { objeto3d } from './objetos3d'

const TAM = 96
let desenhador: THREE.WebGLRenderer | null = null
const fotos = new Map<string, string>()

/** A miniatura do tipo (data URL); a primeira chamada fotografa, as outras devolvem a guardada. */
export function miniaturaDe(type: string): string {
  const pronta = fotos.get(type)
  if (pronta !== undefined) return pronta
  const obj = objeto3d(type)
  if (texturasCarregando()) return '' // a textura ainda não chegou: tenta de novo no aviso
  try {
    if (!desenhador) {
      desenhador = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true })
      desenhador.setSize(TAM, TAM, false)
      desenhador.outputColorSpace = THREE.SRGBColorSpace
    }
    const cena = new THREE.Scene()
    cena.add(new THREE.HemisphereLight('#fff4e0', '#3a3530', 2.2))
    const sol = new THREE.DirectionalLight('#ffffff', 1.6); sol.position.set(3, 5, 4); cena.add(sol)
    cena.add(obj)
    // enquadra: a câmera olha de frente-cima-lado, na distância que cabe o objeto inteiro
    const caixa = new THREE.Box3().setFromObject(obj), centro = caixa.getCenter(new THREE.Vector3()), raio = caixa.getSize(new THREE.Vector3()).length() / 2 || 0.5
    const cam = new THREE.PerspectiveCamera(30, 1, 0.01, 100)
    const dir = new THREE.Vector3(0.75, 0.62, 1).normalize()
    cam.position.copy(centro).addScaledVector(dir, raio / Math.sin((15 * Math.PI) / 180) * 1.05)
    cam.lookAt(centro)
    desenhador.setClearColor(0x000000, 0)
    desenhador.render(cena, cam)
    const url = desenhador.domElement.toDataURL()
    fotos.set(type, url) // a geometria e a textura são do molde (dividido com o mapa): não se descarta aqui
    return url
  } catch {
    fotos.set(type, '')
    return ''
  }
}
