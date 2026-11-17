// O corvo gigante de sombra (docs/cap2-sombra.md, "O grito"): sai de dentro do manto do Mestre quando ele grita, voa
// reto para a frente em alta velocidade e, depois de CORVO.dura s ou ao bater em algo, explode e solta as Gralhas que
// vão caçar o agente. Não fere (decidido em 17/nov): só solta as Gralhas.
// É o modelo da Gralha em tamanho grande, com um material escuro só dele (uma chamada de desenho a mais, só enquanto
// existe). Quem controla a cena chama soltarCorvo quando o grito pede e passoCorvo a cada quadro.
import * as THREE from 'three'
import { clonar } from '../../../render/remendos'
import { animarGralha } from '../gralha/animacao'
import { montarGralha, type Gralha } from '../gralha/modelo'
import { CORVO } from './numeros'

export interface Corvo { g: Gralha; ativo: boolean; t: number; dir: THREE.Vector3 }

export function novoCorvo(): Corvo {
  const g = montarGralha()
  g.root.scale.setScalar(CORVO.escala); g.root.visible = false
  g.anim.proxPlanar = 99 // não plana: bate as asas o tempo todo
  escurecer(g, CORVO.cor)
  return { g, ativo: false, t: 0, dir: new THREE.Vector3(0, 0, 1) }
}

/** De sombra: o corpo ganha um material só dele, da cor `cor` (multiplica a textura); os olhos, que brilham sozinhos,
 *  ficam como são. O corvo gigante e o corvo do disfarce usam. */
export function escurecer(g: Gralha, cor: string) {
  const escuros = new Map<THREE.Material, THREE.Material>()
  g.root.traverse((o) => {
    const m = o as THREE.Mesh
    if (!m.isMesh || !(m.material as THREE.MeshStandardMaterial).isMeshStandardMaterial) return
    const de = m.material as THREE.MeshStandardMaterial
    let para = escuros.get(de)
    if (!para) { const c = clonar(de); c.color.set(cor); escuros.set(de, (para = c)) }
    m.material = para
  })
}

/** O corvo sai de `de` (no mundo), no rumo `dir` (no chão). */
export function soltarCorvo(C: Corvo, de: THREE.Vector3, dir: THREE.Vector3) {
  C.ativo = true; C.t = 0
  C.dir.set(dir.x, 0, dir.z).normalize()
  const r = C.g.root
  r.position.copy(de); r.rotation.set(0, Math.atan2(C.dir.x, C.dir.z), 0); r.visible = true
  C.g.anim.ultimo = null; C.g.molas.pos = null
}

const _de = new THREE.Vector3()

/** Um quadro do corvo. bate(de, para) = o caminho deste quadro bateu em algo? Devolve onde ele explodiu (no mundo),
 *  no quadro em que explode; senão, null. */
export function passoCorvo(C: Corvo, dt: number, bate?: (de: THREE.Vector3, para: THREE.Vector3) => boolean): THREE.Vector3 | null {
  if (!C.ativo) return null
  const r = C.g.root
  C.t += dt
  _de.copy(r.position)
  // sai do manto acelerando, por um instante, e depois vai reto
  r.position.addScaledVector(C.dir, CORVO.vel * Math.min(1, 0.25 + C.t / CORVO.acelera) * dt)
  animarGralha(C.g, dt)
  if (C.t < CORVO.dura && !bate?.(_de, r.position)) return null
  C.ativo = false; r.visible = false
  return r.position
}

export function descartarCorvo(C: Corvo) { descartarEscuros(C.g) }
/** Descarta os materiais escuros de um corvo (escurecer). */
export function descartarEscuros(g: Gralha) {
  g.root.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh && (m.material as THREE.MeshStandardMaterial).isMeshStandardMaterial) (m.material as THREE.Material).dispose() })
}
