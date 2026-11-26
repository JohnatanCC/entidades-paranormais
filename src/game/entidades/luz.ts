// A luz da lamparina nos fantasmas: quem está no feixe dela (o Mestre se cobre e recua; o fantasma fraco começa a ser
// capturado: game/capture). Os números do feixe em player/numeros.ts (LAMPARINA) e os dos fantasmas em numeros.ts (LUZ).
import * as THREE from 'three'
import { LAMPARINA } from '../player/numeros'
import type { AgenteNaFase } from '../Testar'
import { alcanceCamera } from '../world/colisao'
import type { Jogador } from './foco'
import { LUZ } from './numeros'

const _luz = new THREE.Vector3()

/** O ponto p está no feixe da lamparina erguida de algum jogador? Dentro do cone (com a folga do corpo dele), no alcance
 *  e sem parede no meio. Devolve quem ilumina (ou null). */
export function naLuz(jogadores: Jogador[], mundo: AgenteNaFase['mundo'], p: THREE.Vector3): Jogador | null {
  const F = LAMPARINA.feixe
  for (const j of jogadores) {
    const L = j.lamparina
    if (!L || L.ergue < LUZ.ergue) continue
    _luz.subVectors(p, L.pos)
    const d = _luz.length()
    if (d > F.alcance || d < 0.01) continue
    const angulo = Math.acos(Math.min(1, _luz.dot(L.dir) / d))
    if (angulo < F.abre + Math.atan(LUZ.corpo / d) && alcanceCamera(mundo, L.pos, p, 0.02) > 0.98) return j
  }
  return null
}
