// O que os sons dos Sombrios dividem (as ideias escolhidas em 12/nov, docs/demonios.md: o Lamento do Assombrado, o
// Morcego da Asa sombria, o Abismo do Devora almas; cada um no sons.ts da pasta dele):
//   a voz de cada demônio no espaço: uma fonte por demônio, que anda com ele (audio/espaco.ts; o ouvido é a câmera);
//   o som num ponto do chão (o projétil batendo, o tentáculo rompendo): uma fonte só para ele, solta quando acaba;
//   as peças comuns (a bolha, o respingo) e as partes de cada um, para as provas medirem (provas.sonsDemonios).
// Tudo sintetizado na hora (audio/sintese.ts), sem arquivos. Sem o som ligado (antes do primeiro clique), nada toca.
import * as THREE from 'three'
import { moverFonte, novaFonte, soltarFonte, type Fonte } from '../../audio/espaco'
import { ruido, som, tom, type Som } from '../../audio/sintese'

/** Um som: toca em t (no relógio do áudio), para d, e devolve quanto dura (s). */
export type Tocar = (s: Som, t: number, d: AudioNode) => number
/** Uma parte com nome (as provas medem cada uma). */
export type Parte = [nome: string, tocar: Tocar]

const R = Math.random
// o volume dos Sombrios: quanto soam acima do que cada um toca, até que distância soam cheios (m) e quanto caem depois
// (12/nov: pedidos mais altos e audíveis de longe na arena; o volume era 1, a distância 1,6 m e a queda 1,1)
const VOLUME = 2.5, PERTO = 4, QUEDA = 0.7
/** Uma fonte de demônio no lugar (com o volume dos Sombrios). ref = até onde soa cheio (os grandes, mais). */
function fonteDeDemonio(ref: number, volume = VOLUME): Fonte | null {
  const f = novaFonte(Math.max(ref, PERTO))
  if (f) { f.entrada.gain.value = volume; f.pan.rolloffFactor = QUEDA }
  return f
}
export const sorteio = (a: number, b: number) => a + R() * (b - a)

/** Põe a fonte no lugar já (moverFonte desliza: uma fonte nova viria da origem). */
function colocar(f: Fonte, p: THREE.Vector3) {
  const P = f.pan
  if (P.positionX) { P.positionX.value = p.x; P.positionY.value = p.y; P.positionZ.value = p.z } else P.setPosition(p.x, p.y, p.z)
}

const fontes = new WeakMap<object, Fonte>()
/** A voz de um demônio, no lugar dele (`onde`, no mundo). Chame a cada quadro: devolve o som, para onde tocar e o
 *  agora; null enquanto o som não ligou. ref = até que distância soa cheio (m: os grandes mais); volume = o do chefe
 *  pode ser maior. */
export function vozDe(dono: object, onde: THREE.Vector3, ref = 1.6, volume = VOLUME): { s: Som; d: AudioNode; t: number } | null {
  const s = som()
  if (!s) return null
  let f = fontes.get(dono)
  if (!f) { const n = fonteDeDemonio(ref, volume); if (!n) return null; f = n; fontes.set(dono, f); colocar(f, onde) }
  else moverFonte(f, onde)
  return { s, d: f.entrada, t: s.ctx.currentTime }
}
/** O demônio saiu de cena: a voz dele some. */
export function calar(dono: object) {
  const f = fontes.get(dono)
  if (f) { soltarFonte(f); fontes.delete(dono) }
}
/** Um som num ponto do mundo (uma fonte só para ele, solta depois que ele acaba). volume: o dos Sombrios (os sons do
 *  agente num ponto, a bala batendo e a armadilha, passam 1). */
export function somEm(p: THREE.Vector3, tocar: Tocar, ref = 2, volume = VOLUME) {
  const s = som(), f = s ? fonteDeDemonio(ref, volume) : null
  if (!s || !f) return
  colocar(f, p)
  const dur = tocar(s, s.ctx.currentTime + 0.01, f.entrada)
  setTimeout(() => soltarFonte(f), (dur + 1.5) * 1000)
}

/** Passou do instante x entre o quadro anterior (antes) e este (agora), num relógio que volta a 0 (o ciclo do pulo, a
 *  batida da asa). */
export function passou(antes: number, agora: number, x: number) {
  return agora >= antes ? antes < x && agora >= x : antes < x || agora >= x
}

// ---------- peças que mais de um usa ----------

/** Uma bolha estourando (gosma, líquido grosso). */
export function bolha(s: Som, t: number, d: AudioNode, g = 0.07, f = 260) {
  tom(s, { t, f: f * (0.8 + R() * 0.4), f2: f * 2.4, dur: 0.035, r: 0.04, gain: g, dest: d })
  ruido(s, { t: t + 0.03, dur: 0.012, f: 1400, q: 2, gain: g * 0.5, r: 0.02, dest: d })
}

/** Matéria molhada batendo e espirrando (k = o tamanho). */
export function respingo(s: Som, t: number, d: AudioNode, k = 1) {
  ruido(s, { t, dur: 0.06 * k, tipo: 'lowpass', f: 1300, f2: 260, gain: 0.22 * Math.min(1.4, k), r: 0.1 * k, dest: d })
  tom(s, { t, f: 140 / Math.sqrt(k), f2: 60 / Math.sqrt(k), dur: 0.07 * k, r: 0.1, gain: 0.16 * Math.min(1.4, k), lp: 300, dest: d })
  for (let i = 0; i < 6 * k; i++) bolha(s, t + 0.04 + R() * 0.35 * k, d, 0.035, 500 + R() * 600) // as gotas caindo
}
