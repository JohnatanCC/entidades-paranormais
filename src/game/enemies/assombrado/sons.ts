// Os sons do Assombrado: o Lamento (escolhido em 12/nov, docs/demonios.md). Oco e soprado, um fantasma que geme e
// sussurra (frio, triste). Ele é pequeno e vem em bando: cada som é curto e não cansa repetido. A voz sai do corpo dele
// (../sons.ts) e cada som toca no momento da animação (ouvirAssombrado, depois de animarAssombrado):
//   parado: de vez em quando sussurra e geme baixo, como vento num cano;
//   o pulo: o ar quando sai do chão e o baque abafado quando pousa (o pano do capuz);
//   o ataque: o lamento que sobe até um grito fino no aviso e no salto, e o baque do pouso;
//   o dano: o susto (puxa o ar) e um gemido curto; estourar: se desfaz num suspiro, com um vidro fino;
//   arremessado (pelo Devora almas): um gemido caindo enquanto voa; surgir: sobe do líquido gemendo e rompe a superfície.
import * as THREE from 'three'
import { pancada, ruido, sussurro, tom, voz } from '../../../audio/sintese'
import { bolha, passou, sorteio, vozDe, type Parte, type Tocar } from '../sons'
import type { Assombrado } from './modelo'
import { ATAQUE, PULO, SURGIR } from './numeros'

const parado: Tocar = (s, t, d) => {
  sussurro(s, t, 1.5, 0.045, d)
  voz(s, { t, dur: 1.6, a: 0.4, f: 98, f2: 92, vogal: 'u', sc: 0.9, grit: 1.3, ar: 0.9, ring: [6, 0.45], wob: 0.12, gain: 0.05, dest: d })
  return 1.9
}
const decola: Tocar = (s, t, d) => { ruido(s, { t, dur: 0.22, a: 0.05, f: 450, f2: 1300, q: 0.8, gain: 0.07, dest: d }); return 0.25 }
const pousa: Tocar = (s, t, d) => {
  pancada(s, t, 70, 0.08, d)
  ruido(s, { t, dur: 0.06, tipo: 'lowpass', f: 380, gain: 0.08, dest: d }) // o pano do capuz
  return 0.15
}
const ataque: Tocar = (s, t, d) => {
  // o lamento sobe no aviso e chega ao grito no salto
  voz(s, { t, dur: ATAQUE.aviso + ATAQUE.salto, a: 0.08, f: 220, f2: 540, f3: 470, glide: ATAQUE.aviso, vogal: 'u', vogal2: 'i', grit: 1.6, vib: [6, 30], ar: 0.6, ring: [37, 0.3], gain: 0.11, dest: d })
  ruido(s, { t: t + ATAQUE.aviso * 0.6, dur: 0.4, f: 3800, q: 1.2, gain: 0.05, dest: d })
  pousa(s, t + ATAQUE.aviso + ATAQUE.salto, d)
  return ATAQUE.aviso + ATAQUE.salto + 0.15
}
const dano: Tocar = (s, t, d) => {
  ruido(s, { t, dur: 0.14, a: 0.02, f: 1800, q: 1, gain: 0.09, dest: d }) // o susto (puxa o ar)
  voz(s, { t: t + 0.08, dur: 0.2, f: 320, f2: 200, vogal: 'a', grit: 1.4, ar: 0.8, gain: 0.08, dest: d })
  return 0.4
}
const estouro: Tocar = (s, t, d) => {
  voz(s, { t, dur: 0.8, f: 150, f2: 70, glide: 0.7, vogal: 'o', vogal2: 'u', grit: 1.2, ar: 1, gain: 0.07, dest: d })
  ruido(s, { t, dur: 0.9, a: 0.01, r: 0.3, f: 2600, f2: 300, q: 0.8, gain: 0.16, dest: d }) // se desfaz no ar
  tom(s, { t: t + 0.05, f: 1250, f2: 1700, dur: 0.5, r: 0.4, gain: 0.04, dest: d }) // um vidro fino
  return 1.2
}
const arremessado: Tocar = (s, t, d) => {
  voz(s, { t, dur: 0.6, f: 420, f2: 230, glide: 0.5, vogal: 'u', vogal2: 'o', grit: 1.4, ar: 0.7, ring: [37, 0.3], gain: 0.08, dest: d })
  ruido(s, { t, dur: 0.5, a: 0.1, f: 700, f2: 1800, q: 0.8, gain: 0.05, dest: d }) // o ar passando
  return 0.6
}
const surgir: Tocar = (s, t, d) => {
  voz(s, { t, dur: SURGIR.dura, a: 0.2, f: 80, f2: 170, glide: SURGIR.dura * 0.7, vogal: 'o', vogal2: 'u', grit: 1.3, ar: 0.9, ring: [6, 0.4], gain: 0.07, dest: d })
  const rompe = t + SURGIR.rompe // a cabeça rompe o líquido
  ruido(s, { t: rompe, dur: 0.1, tipo: 'lowpass', f: 900, f2: 300, gain: 0.12, r: 0.12, dest: d })
  for (let i = 0; i < 4; i++) bolha(s, rompe + Math.random() * 0.4, d, 0.04, 300)
  return SURGIR.dura
}

/** As partes, para as provas medirem. */
export const PARTES_ASSOMBRADO: Parte[] = [['parado', parado], ['decola', decola], ['pousa', pousa], ['ataque', ataque], ['dano', dano], ['estouro', estouro], ['arremessado', arremessado], ['surgir', surgir]]

// o que a animação era no quadro anterior (para tocar cada som uma vez, quando muda)
interface Antes { pulo: number; golpe: boolean; dano: object | null; estourado: boolean; voo: boolean; surgir: boolean; parado: number }
const antes = new WeakMap<Assombrado, Antes>()
const _p = new THREE.Vector3()

/** Depois de animarAssombrado: a voz anda com ele e cada som toca quando a animação chega nele. */
export function ouvirAssombrado(a: Assombrado, dt: number) {
  const A = a.anim
  let b = antes.get(a)
  if (!b) { b = { pulo: A.pulo, golpe: !!A.golpe, dano: A.dano, estourado: A.estourado, voo: !!A.voo, surgir: !!A.surgir, parado: sorteio(1, 5) }; antes.set(a, b) }
  const v = vozDe(a, a.corpo.getWorldPosition(_p))
  if (v) {
    const { s, d, t } = v
    // o pulo: sai do chão no fim da carga e pousa no fim do voo (começando agora, o antes é o começo do ciclo)
    if (A.pulo >= 0 && !A.golpe) {
      const de = b.pulo >= 0 ? b.pulo : Math.max(0, A.pulo - dt / PULO.periodo)
      if (passou(de, A.pulo, PULO.carga)) decola(s, t, d)
      if (passou(de, A.pulo, PULO.carga + PULO.voo)) pousa(s, t, d)
    }
    if (A.golpe && !b.golpe) ataque(s, t, d)
    if (A.dano && A.dano !== b.dano) dano(s, t, d)
    if (A.estourado && !b.estourado) estouro(s, t, d)
    if (A.voo && !b.voo) arremessado(s, t, d)
    if (A.surgir && !b.surgir) surgir(s, t, d)
    // parado (ou andando), de vez em quando
    if (!A.golpe && !A.estourado && !A.voo && !A.surgir && (b.parado -= dt) <= 0) { parado(s, t, d); b.parado = sorteio(4, 9) }
  }
  Object.assign(b, { pulo: A.pulo, golpe: !!A.golpe, dano: A.dano, estourado: A.estourado, voo: !!A.voo, surgir: !!A.surgir })
}
