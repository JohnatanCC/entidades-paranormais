// O Devora espectros se mexendo: por enquanto só flutuar (parado ou andando). O bote, a mordida e o cuspe vêm na
// etapa da inteligência dele. Os números em numeros.ts.
import * as THREE from 'three'
import { animarMolas } from '../../corpo/molas'
import type { DevoraEspectros } from './modelo'
import { BOCA, ONDA, PAIRAR } from './numeros'

const _q = new THREE.Quaternion(), _x = new THREE.Vector3(1, 0, 0)
const volta = (t: number, s: number) => Math.sin((t / s) * Math.PI * 2)

/** Um quadro: os tentáculos ondulam, a boca respira, o corpo sobe e desce e deita com a velocidade (andar: 0..1).
 *  Devolve a altura do root (m), para quem o controla. */
export function animarDevoraEspectros(d: DevoraEspectros, andar: number, dt: number): number {
  const A = d.anim
  A.t += dt
  A.deita += (andar - A.deita) * (1 - Math.exp(-2 * dt))
  for (const T of d.tentaculos) T.ossos.forEach((o, k) => {
    const fase = (A.t / ONDA.volta) * Math.PI * 2 - T.fase * ONDA.defasa - k * ONDA.porOsso, peso = ONDA.amplo * ONDA.ossos[k] * (1 + 0.4 * A.deita)
    o.quaternion.copy(T.base[k]).multiply(_q.setFromAxisAngle(T.a, Math.sin(fase) * peso)).multiply(_q.setFromAxisAngle(T.b, Math.cos(fase * 0.7) * peso * 0.6))
  })
  d.mandibula.quaternion.copy(d.base.mandibula).multiply(_q.setFromAxisAngle(_x, BOCA.aberta + BOCA.respira * volta(A.t, BOCA.volta)))
  d.corpo.quaternion.copy(d.base.corpo).multiply(_q.setFromAxisAngle(_x, PAIRAR.inclina * volta(A.t + 0.6, PAIRAR.volta) + PAIRAR.deita * A.deita))
  animarMolas(d.molas, d.root, dt)
  return PAIRAR.altura + PAIRAR.sobe * volta(A.t, PAIRAR.volta)
}
