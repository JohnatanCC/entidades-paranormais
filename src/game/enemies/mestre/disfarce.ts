// O disfarce do Mestre (docs/cap2-sombra.md; uma entrada, para o futuro): ele aparece como um corvo pousado, parecido
// com as Gralhas mas mais robusto e ameaçador. Fica em pé, a cabeça virando aos trancos; depois de DISFARCE.espera s,
// treme, cresce e estoura em fumaça e penas, e de dentro sai o Mestre, crescendo com o manto aberto.
// O corvo é o modelo da Gralha maior, com um material escuro só dele (uma chamada de desenho a mais, só enquanto
// existe). Quem controla a cena chama disfarcar e, a cada quadro, passoDisfarce antes de animarMestre.
import * as THREE from 'three'
import { animarGralha, pousar } from '../gralha/animacao'
import { montarGralha, type Gralha } from '../gralha/modelo'
import { escurecer } from './corvo'
import type { Mestre } from './modelo'
import { DISFARCE } from './numeros'

export interface Disfarce { corvo: Gralha; t: number; ativo: boolean }

export function novoDisfarce(): Disfarce {
  const corvo = montarGralha()
  corvo.root.visible = false
  escurecer(corvo, DISFARCE.cor)
  return { corvo, t: 0, ativo: false }
}

/** Começa: o Mestre some e o corvo aparece pousado no lugar dele (onde o root do Mestre está). */
export function disfarcar(D: Disfarce, m: Mestre) {
  D.ativo = true; D.t = 0
  m.root.visible = false; m.anim.surgindo = null
  const r = D.corvo.root
  r.position.copy(m.root.position); r.position.y += DISFARCE.altura * DISFARCE.escala
  r.rotation.copy(m.root.rotation); r.scale.setScalar(DISFARCE.escala); r.visible = true
  pousar(D.corvo, true); D.corvo.anim.pousa = 1; D.corvo.anim.ultimo = null; D.corvo.molas.pos = null
}

const suave = (k: number) => k * k * (3 - 2 * k)
const _p = new THREE.Vector3()

/** Um quadro do disfarce. Devolve onde ele se revela (no mundo), no quadro em que estoura; senão, null. */
export function passoDisfarce(D: Disfarce, m: Mestre, dt: number): THREE.Vector3 | null {
  if (!D.ativo) return null
  const C = DISFARCE, r = D.corvo.root
  D.t += dt
  const k = Math.max(0, (D.t - C.espera) / C.cresce)
  if (k > 0) { // treme e cresce
    const e = C.escala * (1 + (C.incha - 1) * suave(Math.min(1, k)))
    r.scale.setScalar(e); r.position.y = m.root.position.y + C.altura * e
    r.rotation.z = Math.sin(D.t * 61) * C.treme * Math.min(1, k * 2)
  }
  animarGralha(D.corvo, dt)
  if (k < 1) return null
  // estoura: o corvo some e o Mestre aparece pequeno, crescendo (animacao.ts: surgindo)
  D.ativo = false; r.visible = false; r.rotation.z = 0
  m.root.visible = true; m.anim.surgindo = { t: 0 }; m.anim.ultimo = null; m.manto.pos = null; m.soltas.pos = null
  return _p.set(r.position.x, m.root.position.y + C.onde, r.position.z)
}
