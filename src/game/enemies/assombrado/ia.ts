// A inteligência do Assombrado (docs/demonios.md, "Como lutam"): vai atrás do agente aos pulinhos e, de perto, ataca
// com as duas garras (o aviso de 0,5 s: agacha, ergue os braços, os olhos acendem). Vários juntos: só um ataca por vez
// (o bando); os outros esperam a vez em volta, sem se amontoar. O golpe pega no pouso do salto, se o agente ainda
// estiver perto e na frente: esquivar (ou se afastar) no aviso escapa. Caído ou engolido, ninguém ataca. Quem chega
// pelo lado da câmera dá a volta até o lado do agente antes de atacar: a briga fica onde o jogador vê.
// Os números em numeros.ts (LUTA).
import type * as THREE from 'three'
import { girarPara, ateAlvo, anguloAte, sorteado, type Alvo } from '../luta'
import { atacar } from './animacao'
import type { Assombrado } from './modelo'
import { ATAQUE, LUTA } from './numeros'

/** O bando: quem está atacando agora (só um por vez). */
export interface Bando { atacando: Assombrado | null }
export const novoBando = (): Bando => ({ atacando: null })

interface Mente { espera: number; golpe: number } // s até poder atacar de novo; o relógio do golpe no quadro anterior (−1 = sem golpe)
const mentes = new WeakMap<Assombrado, Mente>()

/** Antes de animarAssombrado: vira para o agente, ataca quando pode e devolve quanto quer andar (m/s). O golpe pega no
 *  pouso. camera = onde a câmera está (quem está do lado dela contorna). */
export function pensarAssombrado(a: Assombrado, alvo: Alvo, bando: Bando, dt: number, camera?: THREE.Vector3): number {
  const A = a.anim
  let m = mentes.get(a)
  if (!m) { m = { espera: sorteado(LUTA.espera), golpe: -1 }; mentes.set(a, m) }
  m.espera -= dt
  if (bando.atacando === a && (A.estourado || !A.golpe)) { bando.atacando = null; m.espera = sorteado(LUTA.espera) } // o golpe dele acabou
  if (A.estourado || A.surgir || A.voo) return 0
  const r = a.root, dist = ateAlvo(r, alvo.p)
  if (A.golpe) { // o golpe pega no pouso do salto
    const pouso = ATAQUE.aviso + ATAQUE.salto
    if (m.golpe < pouso && A.golpe.t >= pouso && alvo.pode() && dist < LUTA.alcance && Math.abs(anguloAte(r, alvo.p.x, alvo.p.z)) < LUTA.frente) alvo.ferir(LUTA.dano, r.position)
    m.golpe = A.golpe.t
    return 0
  }
  m.golpe = -1
  if (!alvo.pode()) return 0 // caído ou engolido: espera
  // do lado da câmera (entre ela e o agente): vai para o lado do agente, sem atacar daqui
  if (camera && dist < LUTA.contorna) {
    const cam = Math.atan2(camera.x - alvo.p.x, camera.z - alvo.p.z), ele = Math.atan2(r.position.x - alvo.p.x, r.position.z - alvo.p.z)
    const d = Math.atan2(Math.sin(ele - cam), Math.cos(ele - cam))
    if (Math.abs(d) < LUTA.camera) {
      const lado = cam + (d >= 0 ? 1 : -1) * Math.PI * 0.55, raio = LUTA.perto * 1.4
      const x = alvo.p.x + Math.sin(lado) * raio, z = alvo.p.z + Math.cos(lado) * raio
      girarPara(r, x, z, LUTA.vira, dt)
      return LUTA.vel
    }
  }
  girarPara(r, alvo.p.x, alvo.p.z, LUTA.vira, dt)
  if (dist < LUTA.alcance && !bando.atacando && m.espera <= 0) { atacar(a); bando.atacando = a; return 0 }
  const outro = !!bando.atacando && bando.atacando !== a
  return dist > (outro ? LUTA.espaco : LUTA.perto) ? LUTA.vel : 0
}
