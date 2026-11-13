// A inteligência da Asa sombria (docs/demonios.md, "Como lutam"): voa em volta do agente, de longe (a ~7 m, girando
// devagar), sempre de frente para ele, e cospe a bola de matéria a cada ~3 s (o aviso: as asas batem curto e rápido, a
// boca abre e o núcleo cresce). Quando o agente mira nela por mais de 0,6 s, desvia para o lado (no máximo a cada 3 s).
// Fica na arena: o ponto em volta do agente não passa da beirada. Caído ou engolido, ela não cospe.
// Os números em numeros.ts (LUTA). Quem a controla aplica o que animarAsaSombria pede (o recuo do cuspe, o desvio) e
// dispara o projétil (projetil.ts).
import * as THREE from 'three'
import { girarPara, sorteado, type Alvo } from '../luta'
import { cuspir, desviar } from './animacao'
import type { AsaSombria } from './modelo'
import { LUTA } from './numeros'

/** De onde e para onde o agente mira (a câmera), e se está mirando. */
export interface Mira { de: THREE.Vector3; dir: THREE.Vector3; ativa: boolean }
/** A arena: o meio e o raio (ela não sai de cima dela). */
export interface Area { p: THREE.Vector3; raio: number }

interface Mente { cospe: number; desvio: number; mirada: number; giro: number; ang: number | null }
const mentes = new WeakMap<AsaSombria, Mente>()
const _q = new THREE.Vector3(), _d = new THREE.Vector3()

/** Antes de animarAsaSombria: anda em volta do agente, vira para ele, cospe e desvia. Devolve o alvo do cuspe (o peito do agente). */
export function pensarAsa(a: AsaSombria, alvo: Alvo, mira: Mira, area: Area | null, dt: number, peito: THREE.Vector3): THREE.Vector3 | undefined {
  const A = a.anim, r = a.root
  let m = mentes.get(a)
  if (!m) { m = { cospe: sorteado(LUTA.cospe), desvio: 0, mirada: 0, giro: Math.random() < 0.5 ? -1 : 1, ang: null }; mentes.set(a, m) }
  if (A.estourado) return undefined
  m.cospe -= dt; m.desvio -= dt
  peito.copy(alvo.p).setY(alvo.p.y + 1.2)
  // o ponto onde ela quer ficar: em volta do agente, girando devagar; sem passar da beirada
  if (m.ang === null) m.ang = Math.atan2(r.position.x - alvo.p.x, r.position.z - alvo.p.z)
  if (!A.golpe) m.ang += m.giro * LUTA.volta * dt
  _q.set(alvo.p.x + Math.sin(m.ang) * LUTA.distancia, alvo.p.y + LUTA.voo, alvo.p.z + Math.cos(m.ang) * LUTA.distancia)
  if (area) { _d.subVectors(_q, area.p).setY(0); const l = _d.length(); if (l > area.raio) _q.sub(_d.multiplyScalar(1 - area.raio / l)) }
  if (!A.golpe) { // vai para lá (no golpe, quem manda é ele: o recuo, o desvio)
    _d.subVectors(_q, r.position); _d.y = 0
    const l = _d.length(), passo = Math.min(l, LUTA.vel * dt)
    if (l > 1e-3) r.position.addScaledVector(_d, passo / l)
    r.position.y += Math.sign(_q.y - r.position.y) * Math.min(Math.abs(_q.y - r.position.y), LUTA.sobe * dt) // sobe ou desce até a altura do voo
  }
  girarPara(r, alvo.p.x, alvo.p.z, 5, dt)
  // o agente mirando nela: desvia (o cuspe não é cortado)
  _d.subVectors(r.position, mira.de).normalize()
  m.mirada = mira.ativa && _d.angleTo(mira.dir) < LUTA.cone ? m.mirada + dt : 0
  if (m.mirada > LUTA.mirada && m.desvio <= 0 && A.golpe?.nome !== 'cuspir') { desviar(a, Math.random() < 0.5 ? -1 : 1); m.desvio = LUTA.desvio; m.mirada = 0; m.giro = -m.giro }
  // cospe de tempos em tempos, de longe
  const dist = Math.hypot(alvo.p.x - r.position.x, alvo.p.z - r.position.z)
  if (!A.golpe && m.cospe <= 0 && alvo.pode() && dist < LUTA.alcance) { cuspir(a); m.cospe = sorteado(LUTA.cospe) }
  return A.golpe?.nome === 'cuspir' ? peito : undefined
}
