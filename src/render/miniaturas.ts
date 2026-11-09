// As miniaturas do catálogo de objetos: cada tipo é montado a partir dos dados (maps/objetos.ts) e fotografado uma vez,
// num desenhador escondido, de cima e de lado, como no catálogo do The Sims. A imagem fica guardada (data URL).
import * as THREE from 'three'
import { MATERIAIS, OBJETOS, type Peca } from '../maps/objetos'

const TAM = 96
let desenhador: THREE.WebGLRenderer | null = null
const fotos = new Map<string, string>()
const mats = new Map<string, THREE.Material>()

const mat = (k: string) => {
  let m = mats.get(k)
  if (!m) {
    const cor = MATERIAIS[k] ?? '#ff00ff'
    m = k.startsWith('luz:') ? new THREE.MeshBasicMaterial({ color: cor }) : new THREE.MeshStandardMaterial({ color: cor, roughness: 0.85 })
    mats.set(k, m)
  }
  return m
}

function geometria([forma, s]: Peca): THREE.BufferGeometry {
  if (forma === 'caixa') return new THREE.BoxGeometry(s[0], s[1], s[2])
  if (forma === 'esfera') return new THREE.SphereGeometry(s[0], 10, 8)
  if (forma === 'cone') return new THREE.ConeGeometry(s[1], s[2], 8)
  return new THREE.CylinderGeometry(s[0], s[1], s[2], 10)
}

/** O objeto do catálogo como um grupo do three (origem no centro da base). */
export function montarObjeto(type: string): THREE.Group {
  const g = new THREE.Group(), def = OBJETOS[type]
  for (const p of def?.pecas ?? []) {
    const m = new THREE.Mesh(geometria(p), mat(p[3]))
    m.position.set(...p[2])
    if (p[4]) m.rotation.set((p[4][0] * Math.PI) / 180, (p[4][1] * Math.PI) / 180, (p[4][2] * Math.PI) / 180)
    g.add(m)
  }
  return g
}

/** A miniatura do tipo (data URL); a primeira chamada fotografa, as outras devolvem a guardada. */
export function miniaturaDe(type: string): string {
  const pronta = fotos.get(type)
  if (pronta !== undefined) return pronta
  try {
    if (!desenhador) {
      desenhador = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true })
      desenhador.setSize(TAM, TAM, false)
      desenhador.outputColorSpace = THREE.SRGBColorSpace
    }
    const cena = new THREE.Scene()
    cena.add(new THREE.HemisphereLight('#fff4e0', '#3a3530', 2.2))
    const sol = new THREE.DirectionalLight('#ffffff', 1.6); sol.position.set(3, 5, 4); cena.add(sol)
    const obj = montarObjeto(type)
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
    obj.traverse((o) => { if (o instanceof THREE.Mesh) o.geometry.dispose() })
    fotos.set(type, url)
    return url
  } catch {
    fotos.set(type, '')
    return ''
  }
}
