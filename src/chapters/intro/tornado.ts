// O tornado que fecha a arena durante a horda (docs/intro.md): um funil de pedaços de matéria escura e brasas vermelhas
// girando, mais largo em cima, na ponta de uma ponte. Enquanto está de pé, segura o agente (um bloqueio redondo no
// mundo, world/colisao.ts). Forma rápido (cresce do chão) e desfaz devagar (encolhe e some).
// Leve: cada tornado é uma malha só (os pedaços são cópias de um cubo, InstancedMesh); só desenha formado.
import * as THREE from 'three'
import { aplicarBrilho } from '../../render/brilho'
import type { Bloqueio, Mundo } from '../../game/world/colisao'
import { TORNADO } from './numeros'

const MATERIA = new THREE.Color('#0d0a0f'), BRASA = new THREE.Color('#ff4a2a')

interface Pedaco { h: number; fase: number; vel: number; tam: number; desvio: number }
export interface Tornado {
  p: THREE.Vector3; n: number // onde fica e a arena que ele fecha
  quer: boolean; forca: number // de pé (pedido) e o quanto está formado (0..1)
  t: number; malha: THREE.InstancedMesh; pedacos: Pedaco[]; bloqueio: Bloqueio
}

/** Um tornado (desfeito) no ponto p, que fecha a arena n. Põe o bloqueio no mundo e a malha em `pai`. */
export function novoTornado(p: THREE.Vector3, n: number, mundo: Mundo, pai: THREE.Object3D): Tornado {
  const T = TORNADO
  const malha = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), aplicarBrilho(new THREE.MeshBasicMaterial()), T.pedacos)
  malha.frustumCulled = false; malha.visible = false
  const pedacos = Array.from({ length: T.pedacos }, (_, i): Pedaco => {
    const brasa = Math.random() < 0.18
    malha.setColorAt(i, brasa ? BRASA : MATERIA)
    return { h: Math.random(), fase: Math.random() * Math.PI * 2, vel: T.gira[0] + Math.random() * (T.gira[1] - T.gira[0]), tam: (brasa ? 0.08 : 0.14) + Math.random() * 0.22, desvio: (Math.random() - 0.5) * 0.4 }
  })
  pai.add(malha)
  const bloqueio: Bloqueio = { x: p.x, z: p.z, r: T.raio, ativo: false }
  mundo.bloqueios.push(bloqueio)
  return { p: p.clone(), n, quer: false, forca: 0, t: 0, malha, pedacos, bloqueio }
}

const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _v = new THREE.Vector3(), _s = new THREE.Vector3()

/** Um quadro: forma ou desfaz, gira os pedaços (subindo em espiral) e segura o agente enquanto formado. */
export function passoTornado(o: Tornado, dt: number) {
  const T = TORNADO
  o.forca = Math.max(0, Math.min(1, o.forca + (o.quer ? T.forma : -T.desfaz) * dt))
  o.bloqueio.ativo = o.forca > 0.4
  o.malha.visible = o.forca > 0.005
  if (!o.malha.visible) return
  o.t += dt
  const k = o.forca, alto = T.altura * (0.3 + 0.7 * k)
  o.pedacos.forEach((c, i) => {
    c.h = (c.h + dt * 0.18) % 1 // sobem devagar e voltam ao pé
    const a = c.fase + o.t * c.vel * (1.4 - c.h * 0.6), r = (T.baixo + (T.alto - T.baixo) * c.h ** 1.4 + c.desvio) * k
    _v.set(o.p.x + Math.cos(a) * r, o.p.y + c.h * alto, o.p.z + Math.sin(a) * r)
    _q.setFromEuler(_e.set(o.t * 3 + i, o.t * 2 + c.fase, 0))
    o.malha.setMatrixAt(i, _m.compose(_v, _q, _s.setScalar(c.tam * k * (1 - 0.5 * c.h * c.h))))
  })
  o.malha.instanceMatrix.needsUpdate = true
}

/** Tira o tornado (a fase acabou): a malha sai da cena e o bloqueio do mundo. */
export function descartarTornado(o: Tornado, mundo: Mundo) {
  o.malha.removeFromParent(); o.malha.geometry.dispose(); (o.malha.material as THREE.Material).dispose()
  const i = mundo.bloqueios.indexOf(o.bloqueio)
  if (i >= 0) mundo.bloqueios.splice(i, 1)
}
