// Os objetos repetidos do mapa juntados, no jogo: cada peça de cada tipo de objeto vira UMA malha desenhada várias
// vezes (InstancedMesh), em vez de uma cópia por objeto. A Demo · Intro tem 68 bases de ilha, 32 rochas no ar, dezenas
// de pedras: soltas, eram ~375 chamadas de desenho num quadro; juntas, uma por peça de cada tipo (docs/intro.md).
// A luz assada continua sendo a de cada lugar: a amostra de cada cópia vai nos atributos da instância
// (render/assada.ts, aplicarLuzInstancias). O editor continua com as cópias soltas (para escolher e mover cada uma).
import * as THREE from 'three'
import type { Assador } from '../maps/luzAssada'
import { novaLuzVertice } from '../maps/luzAssada'
import { OBJETOS } from '../maps/objetos'
import type { Prop } from '../maps/types'
import { aplicarLuzInstancias } from './assada'
import { objeto3d } from './objetos3d'

const rad = (v: number) => (v * Math.PI) / 180
const _q =new THREE.Quaternion(), _e = new THREE.Euler(), _p = new THREE.Vector3(), _s = new THREE.Vector3(1, 1, 1)

/** O lugar de um objeto no mapa (como o Colocado do editor: o giro em y por fora, depois a inclinação). */
const matrizDe = (p: Prop, out: THREE.Matrix4) =>
  out.compose(_p.fromArray(p.pos), _q.setFromEuler(_e.set(rad(p.rot[0]), rad(p.rot[1]), rad(p.rot[2]), 'YXZ')), _s)

/** O material das cópias: o mesmo desenho do modelo, com a luz vindo de cada instância (um por material do molde). */
function materialDasCopias(m: THREE.Material, feitos: Map<THREE.Material, THREE.Material>): THREE.Material {
  let c = feitos.get(m)
  if (!c) {
    const o = m as THREE.MeshStandardMaterial
    c = aplicarLuzInstancias(new THREE.MeshStandardMaterial({ color: o.color, roughness: o.roughness, map: o.map }))
    feitos.set(m, c)
  }
  return c
}

/**
 * Junta os objetos (um grupo com uma malha de cópias por peça de cada tipo). assa = a luz assada do mapa (a amostra de
 * cada cópia, no meio dela, como no editor). Devolve o grupo e como descartá-lo (os materiais novos; a geometria e a
 * textura são as do molde, divididas).
 */
export function objetosJuntos(props: Prop[], assa: Assador): { grupo: THREE.Group; descartar: () => void } {
  const grupo = new THREE.Group(); grupo.name = 'objetos-juntos'
  const feitos = new Map<THREE.Material, THREE.Material>(), copias: THREE.BufferGeometry[] = []
  const porTipo = new Map<string, Prop[]>()
  for (const p of props) { const l = porTipo.get(p.type); if (l) l.push(p); else porTipo.set(p.type, [p]) }
  const amostra = novaLuzVertice(), lugar = new THREE.Matrix4()
  for (const [tipo, lista] of porTipo) {
    const def = OBJETOS[tipo], h = (def?.tam[1] ?? 1) / 2
    // a luz de cada cópia: [a (4), b (4), resto (3), indireta (3)]
    const a = new Float32Array(lista.length * 4), b = new Float32Array(lista.length * 4), resto = new Float32Array(lista.length * 3), indireta = new Float32Array(lista.length * 3)
    lista.forEach((p, i) => {
      const ponto: [number, number, number] = [p.pos[0], p.pos[1] + (def?.apoio === 'teto' ? -h : h), p.pos[2]]
      assa(ponto, null, ponto, p.level, amostra)
      a.set(amostra.a, i * 4); b.set(amostra.b, i * 4)
      resto.set([amostra.resto[0] + amostra.janela[0], amostra.resto[1] + amostra.janela[1], amostra.resto[2] + amostra.janela[2]], i * 3)
      indireta.set(amostra.indireta, i * 3)
    })
    // as peças do modelo (no lugar delas dentro dele) e, para cada uma, as cópias
    const modelo = objeto3d(tipo)
    modelo.updateMatrixWorld(true)
    modelo.traverse((o) => {
      const malha = o as THREE.Mesh
      if (!malha.isMesh) return
      const brilha = malha.name === '#luz' // o que brilha não usa a luz do lugar: divide o material do molde
      const im = new THREE.InstancedMesh(malha.geometry, brilha ? malha.material : materialDasCopias(malha.material as THREE.Material, feitos), lista.length)
      im.name = `${tipo}${malha.name}`
      lista.forEach((p, i) => im.setMatrixAt(i, matrizDe(p, lugar).multiply(malha.matrixWorld)))
      if (!brilha) {
        // a luz de cada cópia vai numa cópia da geometria (a do molde é dividida com o editor e com os outros mapas)
        im.geometry = malha.geometry.clone(); copias.push(im.geometry)
        im.geometry.setAttribute('iLuzA', new THREE.InstancedBufferAttribute(a, 4))
        im.geometry.setAttribute('iLuzB', new THREE.InstancedBufferAttribute(b, 4))
        im.geometry.setAttribute('iLuzResto', new THREE.InstancedBufferAttribute(resto, 3))
        im.geometry.setAttribute('iLuzIndireta', new THREE.InstancedBufferAttribute(indireta, 3))
      }
      im.castShadow = malha.castShadow; im.receiveShadow = malha.receiveShadow
      im.computeBoundingSphere()
      grupo.add(im)
    })
  }
  return { grupo, descartar: () => { for (const c of feitos.values()) c.dispose(); for (const g of copias) g.dispose() } }
}
