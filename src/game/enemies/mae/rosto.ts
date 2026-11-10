// O rosto da Mãe: as sobrancelhas (sobem, franzem), os olhos brancos de cega (estreitam, arregalam, quase fecham) e o
// brilho deles (apaga quando ela está exausta, acende vermelho na caça e no ataque, como no laboratório). Ela não pisca
// (morta e cega: um rosto que nunca pisca incomoda mais); no lugar, tiques: um olho que se aperta sozinho por um
// instante e o queixo que torce de leve. No estalo da cabeça, os olhos faíscam. A boca: o movimento abre o queixo (a
// pose); a expressão garante um mínimo (escancarada no grito e no terror, entreaberta na dor, no choro e cansada).
// No grito, o rosto escurece (o material do corpo: efeitos.ts) e os olhos crescem; na fase 4, ficam maiores sempre.
// Cada movimento escolhe a expressão (animacao.ts); o rosto troca suave entre elas.
import * as THREE from 'three'
import type { Mae } from './modelo'
import { QUEIXO } from './pose'

export type ExpressaoMae = 'vazia' | 'caca' | 'furia' | 'grito' | 'dor' | 'choro' | 'exausta' | 'terror'
export const EXPRESSOES_MAE: [ExpressaoMae, string][] = [
  ['vazia', 'Vazia'], ['caca', 'Caça'], ['furia', 'Fúria'], ['grito', 'Grito'], ['dor', 'Dor'], ['choro', 'Choro'], ['exausta', 'Exausta'], ['terror', 'Terror'],
]

//   sobe = as sobrancelhas sobem (m) · franze = o lado de dentro delas desce (rad; negativo = sobe: dor, choro)
//   olho = o quanto os olhos abrem (1 = o modelo) · largo = arregalam (os dois lados) · brilho = a força (1 = o modelo)
//   vermelho = o quanto o branco vira vermelho · boca = o mínimo que a boca abre (0 = a pose decide, 1 = escancarada)
//   escuro = o quanto o rosto escurece (0 = a pele; 1 = preto)
type Rosto = { sobe: number; franze: number; olho: number; largo: number; brilho: number; vermelho: number; boca: number; escuro: number }
const EXPRESSOES: Record<ExpressaoMae, Rosto> = {
  vazia: { sobe: 0, franze: 0.05, olho: 1, largo: 1, brilho: 0.9, vermelho: 0, boca: 0, escuro: 0 }, // procurando: nada no rosto
  caca: { sobe: -0.004, franze: 0.35, olho: 0.65, largo: 1, brilho: 1.2, vermelho: 0.55, boca: 0, escuro: 0 }, // viu você
  furia: { sobe: -0.006, franze: 0.55, olho: 0.45, largo: 1.05, brilho: 1.5, vermelho: 1, boca: 0, escuro: 0 }, // o ataque: os olhos em fenda, em brasa
  // o grito: o rosto escurece, os olhos crescem e queimam, a boca escancara
  grito: { sobe: 0.006, franze: 0.3, olho: 1.9, largo: 1.5, brilho: 1.8, vermelho: 0.85, boca: 0.95, escuro: 0.75 },
  dor: { sobe: 0.006, franze: -0.45, olho: 0.35, largo: 1, brilho: 0.6, vermelho: 0, boca: 0.25, escuro: 0 }, // o meio das sobrancelhas sobe, os olhos se apertam
  choro: { sobe: 0.004, franze: -0.55, olho: 0.25, largo: 1, brilho: 0.35, vermelho: 0, boca: 0.3, escuro: 0 }, // quase fechados, quase apagados
  exausta: { sobe: -0.002, franze: -0.1, olho: 0.45, largo: 1, brilho: 0.25, vermelho: 0, boca: 0.35, escuro: 0 }, // meio fechados, apagados, ofegando
  terror: { sobe: 0.014, franze: -0.3, olho: 1.45, largo: 1.3, brilho: 1.3, vermelho: 0.2, boca: 0.8, escuro: 0 }, // presa: arregalados ao máximo
}

/** O rosto de agora (cada valor chega devagar no da expressão) e os tiques. */
export interface AnimRostoMae extends Rosto { tique: number; tiqueOlho: number; tiqueT: number; torce: number; torceAlvo: number; torceT: number }
export const novoRostoMae = (): AnimRostoMae => ({ ...EXPRESSOES.vazia, tique: 0, tiqueOlho: 0, tiqueT: 3, torce: 0, torceAlvo: 0, torceT: 4 })

const damp = (cur: number, alvo: number, k: number, dt: number) => cur + (alvo - cur) * (1 - Math.exp(-k * dt))
const BRANCO = new THREE.Color('#ffffff'), VERMELHO = new THREE.Color('#ff2a1a')

/** Um quadro do rosto: a expressão do movimento, os tiques e o faísco do estalo (estalando = a cabeça estalou agora);
 *  grande = os olhos maiores da fase 4 (0..1). */
export function animarRostoMae(m: Mae, exp: ExpressaoMae, estalando: boolean, dt: number, grande = 0) {
  const R = m.expressao, A = EXPRESSOES[exp], f = m.rosto
  // a expressão: as sobrancelhas e os olhos rápidos; o brilho e o vermelho mais devagar (acende, apaga)
  R.sobe = damp(R.sobe, A.sobe, 14, dt); R.franze = damp(R.franze, A.franze, 14, dt)
  R.olho = damp(R.olho, A.olho, 16, dt); R.largo = damp(R.largo, A.largo, 12, dt)
  R.brilho = damp(R.brilho, A.brilho + (estalando ? 0.8 : 0), estalando ? 30 : 5, dt); R.vermelho = damp(R.vermelho, A.vermelho, 4, dt)
  R.boca = damp(R.boca, A.boca, 12, dt); R.escuro = damp(R.escuro, A.escuro, 9, dt)
  // os tiques: de vez em quando um olho se aperta sozinho por um instante; o queixo torce de leve
  R.tiqueT -= dt
  if (R.tiqueT <= 0) { R.tique = 0.12; R.tiqueOlho = Math.random() < 0.5 ? 0 : 1; R.tiqueT = 2 + Math.random() * 4 }
  R.tique = Math.max(0, R.tique - dt)
  R.torceT -= dt
  if (R.torceT <= 0) { R.torceAlvo = R.torceAlvo ? 0 : (Math.random() - 0.5) * 0.12; R.torceT = R.torceAlvo ? 0.4 : 3 + Math.random() * 4 }
  R.torce = damp(R.torce, R.torceAlvo, 10, dt)

  f.olhos.forEach((o, i) => {
    const aperta = R.tique > 0 && i === R.tiqueOlho ? 0.35 : 1
    o.scale.set(R.largo * (1 + 0.4 * grande), Math.max(0.06, R.olho * R.largo * aperta * (1 + 0.8 * grande)), 1)
  })
  f.sobrancelhas.forEach((g, i) => {
    const s = i === 0 ? -1 : 1 // [0] direita (o lado de dentro fica para +x), [1] esquerda
    g.position.y = f.base.sobrancelhaY + R.sobe
    g.rotation.z = s * R.franze
  })
  m.mandibula.rotation.x = Math.max(m.mandibula.rotation.x, R.boca * QUEIXO) // a pose já pôs o queixo: a expressão só abre mais
  m.mandibula.rotation.z = R.torce
  if (f.brilho) f.brilho.color.copy(BRANCO).lerp(VERMELHO, R.vermelho).multiplyScalar(R.brilho)
  f.escuro.value = R.escuro
}
