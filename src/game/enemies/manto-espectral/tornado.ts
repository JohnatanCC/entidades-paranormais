// O tornado do golpe giratório do Manto espectral (26/nov, a pedido: como o giro do Crash Bandicoot): anéis de luz em
// volta do corpo, em alturas diferentes e cada vez mais largos para cima (o funil), girando mais rápido que ele, com a
// ponta de cada anel sumindo num rastro. No azul espectral, somando luz (aditivo: brilha com o bloom).
// Uma malha só (os anéis juntados, a cor de cada vértice faz o rastro), um material por Manto; só aparece no giro, com a
// força dele (acelera e freia). Filho da raiz: gira junto com o corpo e ainda mais um pouco.
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

/** Os anéis: [altura (m), raio (m), largura da fita (m), onde começa o arco (rad)]; arco = o quanto cada um dá a volta
 *  (rad); cor; forca = o brilho no giro cheio (0..1); gira = o quanto o tornado roda a mais que o corpo (rad/s); sobe =
 *  o quanto os anéis sobem e descem (m). */
const TORNADO = {
  aneis: [[0.25, 0.65, 0.1, 0], [0.7, 0.9, 0.12, 2.1], [1.15, 1.15, 0.13, 4.2], [1.6, 1.4, 0.13, 1.1], [2.05, 1.65, 0.12, 3.3]] as const,
  arco: 4.6, cor: '#9fe6ff', forca: 0.85, gira: 9, sobe: 0.06,
}

export interface Tornado { malha: THREE.Mesh; material: THREE.MeshBasicMaterial; t: number }

export function novoTornado(): Tornado {
  const partes = TORNADO.aneis.map(([y, r, w, inicio]) => {
    // a fita horizontal: um anel aberto (o arco), a cor clara na frente e sumindo até o preto no rabo (no aditivo, preto
    // é transparente)
    const g = new THREE.RingGeometry(r - w / 2, r + w / 2, 40, 1, inicio, TORNADO.arco).rotateX(-Math.PI / 2).translate(0, y, 0)
    const n = g.attributes.position.count, cor = new Float32Array(n * 3), pos = g.attributes.position
    for (let i = 0; i < n; i++) {
      // o quanto do arco este vértice está (0 = o rabo, 1 = a ponta que vai na frente)
      let a = Math.atan2(-pos.getZ(i), pos.getX(i)) - inicio
      a = ((a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)
      const k = Math.min(1, a / TORNADO.arco) ** 1.6
      cor.set([k, k, k], i * 3)
    }
    g.setAttribute('color', new THREE.BufferAttribute(cor, 3))
    return g
  })
  const geo = mergeGeometries(partes); partes.forEach((p) => p.dispose())
  const material = new THREE.MeshBasicMaterial({ color: TORNADO.cor, vertexColors: true, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false })
  const malha = new THREE.Mesh(geo, material)
  malha.name = 'tornado'; malha.visible = false; malha.renderOrder = 6; malha.frustumCulled = false
  return { malha, material, t: 0 }
}

/** Um quadro: forca = 0..1 (a força do giro: 0 some). */
export function passoTornado(T: Tornado, forca: number, dt: number) {
  T.t += dt
  T.malha.visible = forca > 0.02
  if (!T.malha.visible) return
  T.material.opacity = TORNADO.forca * forca
  T.malha.rotation.y += TORNADO.gira * forca * dt // roda a mais, no sentido do giro (o corpo gira no +y): a ponta clara vai na frente, o rastro atrás
  T.malha.position.y = TORNADO.sobe * Math.sin(T.t * 7)
  T.malha.scale.set(0.85 + 0.15 * forca, 1, 0.85 + 0.15 * forca) // abre com a força
}

export function descartarTornado(T: Tornado) { T.malha.geometry.dispose(); T.material.dispose() }
