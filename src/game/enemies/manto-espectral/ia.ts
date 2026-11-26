// A inteligência do Manto espectral (o fantasma capturável do jogo novo, docs/demonios.md): caçando, anda atrás do agente
// desviando das paredes e para perto dele. Colado, de frente, agarra; de meia distância (até onde o braço estica), o
// combo de socos; com 30% da vida ou menos, de tempos em tempos, o golpe giratório (vai girando até o agente e cai
// atordoado no fim: a hora de bater nele). Entre um golpe e outro, uma espera curta.
// O golpe pega no instante da animação (golpeAcertaManto), se o agente ainda está no alcance e na frente: esquivar no
// aviso escapa. O agarrão que pega segura o agente (fica quase parado); o que erra solta na hora. O primeiro soco que
// pega prende o combo: os outros pegam mesmo na janela depois do golpe.
// Quem o controla move o root: para a frente dele com o que a animação pede; no giro, na direção do agente (rumoDoGiro).
// Os números em numeros.ts (LUTA, AGARRAR, SOCOS, GIRO).
import * as THREE from 'three'
import type { Mundo } from '../../world/colisao'
import { anguloAte, ateAlvo, girarPara, rumoLivre, sorteado, type Alvo } from '../luta'
import { golpear, type SaidaManto } from './animacao'
import type { MantoEspectral } from './modelo'
import { AGARRAR, GIRO, LUTA, SOCOS } from './numeros'

interface Mente { espera: number; giro: number; rumo: number; combo: boolean }
const mentes = new WeakMap<MantoEspectral, Mente>()
const _ir = { x: 0, z: 0 }

/** Caçando (antes de animarMantoEspectral): vira para o agente pelo caminho livre e escolhe o golpe. vida = 0..1 (o
 *  quanto ainda tem). Devolve quanto quer andar (m/s) fora dos golpes. */
export function pensarManto(m: MantoEspectral, alvo: Alvo, mundo: Mundo, vida: number, pes: number, dt: number): number {
  let M = mentes.get(m)
  if (!M) { M = { espera: sorteado(LUTA.espera), giro: 0, rumo: m.root.rotation.y, combo: false }; mentes.set(m, M) }
  M.espera -= dt; M.giro -= dt
  const r = m.root, dist = ateAlvo(r, alvo.p)
  if (m.anim.modo === 'girar') { M.rumo = Math.atan2(alvo.p.x - r.position.x, alvo.p.z - r.position.z); return 0 } // gira indo para ele
  if (m.anim.modo !== 'pairar') return 0 // no golpe, quem manda é a animação
  M.combo = false
  const o = dist > LUTA.encosta * 1.5 ? rumoLivre(r, alvo.p.x, alvo.p.z, mundo, LUTA.raio, dt, _ir, pes) : Object.assign(_ir, { x: alvo.p.x, z: alvo.p.z })
  girarPara(r, o.x, o.z, LUTA.vira, dt)
  const deFrente = Math.abs(anguloAte(r, alvo.p.x, alvo.p.z)) < LUTA.frente
  if (alvo.pode() && M.espera <= 0) {
    // com pouca vida, o giro (não precisa estar de frente: ele vai girando até o agente)
    if (vida <= GIRO.vida && M.giro <= 0 && dist < 9) { golpear(m, 'girar'); M.giro = sorteado(LUTA.giroCada); M.espera = sorteado(LUTA.espera); M.rumo = r.rotation.y; return 0 }
    if (deFrente && dist < AGARRAR.alcance + LUTA.folga) { golpear(m, 'agarrar'); M.espera = sorteado(LUTA.espera); return 0 }
    if (deFrente && dist < SOCOS.alcance - 0.3) { golpear(m, 'socos'); M.espera = sorteado(LUTA.espera); return 0 }
  }
  return dist > LUTA.encosta ? LUTA.vel : 0
}

/** Para onde ele anda girando (rad): para o agente, atualizado enquanto gira. */
export function rumoDoGiro(m: MantoEspectral) { return mentes.get(m)?.rumo ?? m.root.rotation.y }

const _de = new THREE.Vector3()
/** Depois de animar: o agarrão, cada soco e cada volta do giro pegam o agente? Fere (e o agarrão segura). */
export function golpeAcertaManto(m: MantoEspectral, s: SaidaManto, alvo: Alvo, dano = 1) {
  if (!alvo.pode()) return
  const r = m.root, dist = ateAlvo(r, alvo.p), frente = Math.abs(anguloAte(r, alvo.p.x, alvo.p.z))
  const de = _de.copy(r.position).setY(r.position.y + 1.2), M = mentes.get(m)
  if (s.agarrou) {
    if (dist < AGARRAR.alcance + LUTA.folga && frente < LUTA.frente * 1.6 && alvo.ferir(Math.round(AGARRAR.dano * dano), de)) alvo.lentidao(0.95, AGARRAR.segura)
    else m.anim.tm = AGARRAR.aviso + AGARRAR.bote + AGARRAR.segura // errou: solta na hora
  }
  if (s.soco !== null && dist < SOCOS.alcance + LUTA.folga && frente < LUTA.frente * 1.4) {
    const pegou = alvo.ferir(Math.round(SOCOS.dano * dano), de, !!M?.combo) // o primeiro que pega prende o combo
    if (pegou && M) M.combo = true
  }
  if (s.volta && dist < GIRO.raio + LUTA.folga) alvo.ferir(Math.round(GIRO.dano * dano), de)
}

/** Esquece o que pensava (ficou fraco, recomeçou): as esperas recomeçam. */
export function acalmarManto(m: MantoEspectral) { mentes.delete(m) }
