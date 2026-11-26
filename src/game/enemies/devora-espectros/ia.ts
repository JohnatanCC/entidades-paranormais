// A inteligência do Devora espectros (o fantasma capturável do jogo novo): caçando, flutua atrás do agente desviando
// das paredes e não encosta. De meia distância, de frente, dá o bote; colado, morde; de tempos em tempos (com poucas
// crias dele vivas), cospe uma Sombra ou uma Asa espectral, uma de cada vez. O golpe pega quando a boca fecha
// (golpeAcerta), se o agente ainda está no alcance e na frente: esquivar no aviso escapa.
// Quem o controla move o root (a frente dele, com o avanço que a animação pede) e põe a altura. Os números em
// numeros.ts (LUTA).
import type * as THREE from 'three'
import type { Mundo } from '../../world/colisao'
import { anguloAte, ateAlvo, girarPara, rumoLivre, sorteado, type Alvo } from '../luta'
import { golpe, type CriaEspectros, type SaidaEspectros } from './animacao'
import type { DevoraEspectros } from './modelo'
import { LUTA, MORDIDA } from './numeros'

interface Mente { bote: number; mordida: number; cuspe: number; proxima: CriaEspectros }
const mentes = new WeakMap<DevoraEspectros, Mente>()
const _ir = { x: 0, z: 0 }

/** Caçando (antes de animarDevoraEspectros): vira para o agente pelo caminho livre e escolhe o golpe. Devolve quanto
 *  quer avançar (m/s) fora dos golpes. crias = quantas crias dele estão vivas; pes = a altura do chão dele. */
export function pensarDevoraEspectros(d: DevoraEspectros, alvo: Alvo, mundo: Mundo, crias: number, pes: number, dt: number): number {
  let m = mentes.get(d)
  if (!m) { m = { bote: sorteado(LUTA.bote.espera), mordida: 0, cuspe: sorteado(LUTA.cuspe.espera), proxima: 'sombra' }; mentes.set(d, m) }
  m.bote -= dt; m.mordida -= dt; m.cuspe -= dt
  if (d.anim.modo !== 'pairar') return 0 // no golpe, quem manda é a animação
  const r = d.root, dist = ateAlvo(r, alvo.p)
  const o = dist > LUTA.encosta * 1.5 ? rumoLivre(r, alvo.p.x, alvo.p.z, mundo, LUTA.raio, dt, _ir, pes) : Object.assign(_ir, { x: alvo.p.x, z: alvo.p.z })
  girarPara(r, o.x, o.z, LUTA.vira, dt)
  const deFrente = Math.abs(anguloAte(r, alvo.p.x, alvo.p.z)) < LUTA.frente
  if (alvo.pode() && deFrente) {
    if (dist < MORDIDA.alcance && m.mordida <= 0) { golpe(d, 'morder'); m.mordida = sorteado(LUTA.mordida.espera); return 0 }
    if (dist > LUTA.bote.de && dist < LUTA.bote.ate && m.bote <= 0) { golpe(d, 'bote'); m.bote = sorteado(LUTA.bote.espera); return 0 }
    if (m.cuspe <= 0 && crias < LUTA.cuspe.crias && dist > LUTA.encosta * 0.9) {
      golpe(d, 'cuspir', m.proxima); m.proxima = m.proxima === 'sombra' ? 'asa' : 'sombra'; m.cuspe = sorteado(LUTA.cuspe.espera); return 0
    }
  }
  return dist > LUTA.encosta ? LUTA.vel : 0
}

/** Depois de animar: a boca fechou num golpe (s.fechou) e o agente está no alcance e na frente? Fere. */
export function golpeAcerta(d: DevoraEspectros, s: SaidaEspectros, alvo: Alvo, de: THREE.Vector3) {
  if (!s.fechou || !alvo.pode()) return
  const r = d.root, dist = ateAlvo(r, alvo.p), bote = d.anim.modo === 'bote'
  if (dist < MORDIDA.alcance + LUTA.folga && Math.abs(anguloAte(r, alvo.p.x, alvo.p.z)) < LUTA.frente * 1.6) alvo.ferir(bote ? LUTA.bote.dano : LUTA.mordida.dano, de)
}

/** Esquece o que pensava (voltou para casa, ou ficou fraco): as esperas recomeçam. */
export function acalmarDevoraEspectros(d: DevoraEspectros) { mentes.delete(d) }
