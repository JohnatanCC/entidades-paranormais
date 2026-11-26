// A aura do inimigo aprimorado (26/nov): um halo vermelho atrás do corpo, que pulsa devagar. Um sprite por aprimorado
// (sempre virado para a câmera), todos com o mesmo material e a mesma textura (um degradê redondo, pintado uma vez):
// o pulso é o mesmo para todos (pulsarAuras, uma vez por quadro). Soma a luz (aditivo), não escreve na profundidade e
// some atrás das paredes. Junto com a fúria no material (render/golpe.ts, enfurecer), que avermelha o corpo.
import * as THREE from 'three'

const AURA = { cor: '#ff2a1a', forca: 0.55, pulso: 0.18, volta: 1.6 } // a cor, o brilho (0..1), o quanto pulsa e em quantos s
let material: THREE.SpriteMaterial | null = null

/** O degradê redondo (64 × 64): forte no meio, sumindo na borda. */
function textura(): THREE.CanvasTexture {
  const c = document.createElement('canvas'); c.width = c.height = 64
  const g = c.getContext('2d')!, r = g.createRadialGradient(32, 32, 4, 32, 32, 32)
  r.addColorStop(0, 'rgba(255,255,255,0.9)'); r.addColorStop(0.45, 'rgba(255,255,255,0.35)'); r.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = r; g.fillRect(0, 0, 64, 64)
  return new THREE.CanvasTexture(c)
}

/** Uma aura nova (o tamanho em m; a altura do centro, em m acima de quem a leva): ponha como filha do corpo dele. */
export function novaAura(tamanho: number, altura: number): THREE.Sprite {
  material ??= new THREE.SpriteMaterial({ map: textura(), color: AURA.cor, transparent: true, opacity: AURA.forca, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })
  const s = new THREE.Sprite(material)
  s.name = 'aura'; s.scale.setScalar(tamanho); s.position.y = altura; s.renderOrder = 4
  return s
}

/** Uma vez por quadro: todas as auras pulsam juntas. */
export function pulsarAuras(t: number) {
  if (material) material.opacity = AURA.forca * (1 - AURA.pulso + AURA.pulso * Math.sin((t / AURA.volta) * Math.PI * 2))
}
