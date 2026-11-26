// O sinal da captura em cima do fantasma: o ícone da lamparina (fraco: dá para capturar) e, capturando, a barra da
// força dele (a linha dos 20% marcada). Sprites (sempre virados para a câmera), por cima de tudo e sem luz: o ícone é
// pintado em pixel num canvas pequeno, uma vez só; a barra são três sprites (o fundo, a força e a marca).
import * as THREE from 'three'
import { CAPTURA } from './captura'

const ICONE = 0.45, BARRA = { largura: 1.1, altura: 0.09 } // m

/** O ícone da lamparina, pintado em pixel (16 × 16): a argola, a tampa, o vidro aceso e a base. */
function texturaIcone(): THREE.CanvasTexture {
  const c = document.createElement('canvas'); c.width = c.height = 16
  const g = c.getContext('2d')!
  const px = (cor: string, x: number, y: number, w = 1, h = 1) => { g.fillStyle = cor; g.fillRect(x, y, w, h) }
  px('#1a1208', 5, 0, 6, 15) // o contorno escuro por trás
  px('#c89b4a', 6, 0, 4, 1); px('#c89b4a', 6, 1, 1, 2); px('#c89b4a', 9, 1, 1, 2) // a argola
  px('#8a6a32', 4, 3, 8, 2) // a tampa
  px('#3a2a14', 4, 5, 1, 7); px('#3a2a14', 11, 5, 1, 7) // os lados
  px('#ffcf6a', 5, 5, 6, 7); px('#fff3c4', 7, 7, 2, 3) // o vidro aceso e a chama
  px('#8a6a32', 4, 12, 8, 2); px('#5a4420', 5, 14, 6, 1) // a base
  const t = new THREE.CanvasTexture(c)
  t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.colorSpace = THREE.SRGBColorSpace
  return t
}
let icone: THREE.CanvasTexture | null = null

export interface Sinal { grupo: THREE.Group; icone: THREE.Sprite; fundo: THREE.Sprite; forca: THREE.Sprite; marca: THREE.Sprite }

const sprite = (cor: string, opaco = 1, mapa?: THREE.Texture) => {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ color: cor, map: mapa, transparent: true, opacity: opaco, depthTest: false, depthWrite: false, fog: false }))
  s.renderOrder = 20
  return s
}

export function novoSinal(): Sinal {
  const grupo = new THREE.Group(); grupo.name = 'sinal-captura'; grupo.visible = false
  const i = sprite('#ffffff', 1, (icone ??= texturaIcone())); i.scale.setScalar(ICONE)
  const fundo = sprite('#0b0d12', 0.75), forca = sprite('#7fd8ff'), marca = sprite('#ffcf6a')
  // a barra cresce da esquerda: o centro dos sprites na ponta esquerda
  for (const s of [fundo, forca]) { s.center.set(0, 0.5); s.position.x = -BARRA.largura / 2 }
  fundo.scale.set(BARRA.largura, BARRA.altura, 1)
  marca.scale.set(0.03, BARRA.altura * 1.8, 1); marca.position.x = -BARRA.largura / 2 + BARRA.largura * (CAPTURA.fim / 100)
  forca.position.y = fundo.position.y = marca.position.y = -0.32
  grupo.add(i, fundo, forca, marca)
  return { grupo, icone: i, fundo, forca, marca }
}

/** Mostra o sinal em `onde` (o alto do fantasma): o ícone (pode capturar) e, capturando, a barra com a força (%). O grupo
 *  vira com a câmera, para a barra ficar centrada embaixo do ícone na tela (os sprites já se viram sozinhos). */
export function mostrarSinal(s: Sinal, onde: THREE.Vector3 | null, forca: number | null, t: number, camera?: THREE.Camera) {
  s.grupo.visible = !!onde
  if (!onde) return
  s.grupo.position.copy(onde)
  if (camera) s.grupo.quaternion.copy(camera.quaternion)
  s.icone.position.y = 0.06 * Math.sin(t * 3) // o ícone flutua um pouco
  const barra = forca !== null
  s.fundo.visible = s.forca.visible = s.marca.visible = barra
  if (barra) s.forca.scale.set(Math.max(0.001, (BARRA.largura * forca) / 100), BARRA.altura * 0.7, 1)
}

export function descartarSinal(s: Sinal) {
  for (const x of [s.icone, s.fundo, s.forca, s.marca]) x.material.dispose()
}
