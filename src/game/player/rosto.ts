// O rosto do agente: as expressões (sobrancelhas, olhos, boca) e o piscar, mexendo as peças finas do rosto do modelo
// em blocos (os olhos com a íris, as sobrancelhas e a boca são pastas próprias no Blockbench).
//   sobe  = as sobrancelhas sobem (m)        meio = o lado de dentro das sobrancelhas sobe (rad; negativo = franze)
//   olho  = quanto o olho abre (1 = normal)  bocaY / bocaX = a boca abre / estica (1 = o tamanho do modelo; 0 = fechada: a peça some e fica a boca pintada no rosto)
import type { Agente } from './modelo'

export type Expressao = 'neutra' | 'esforco' | 'medo' | 'dor' | 'raiva' | 'surpresa'

export const EXPRESSOES: Record<Expressao, { sobe: number; meio: number; olho: number; bocaY: number; bocaX: number }> = {
  neutra: { sobe: 0, meio: 0, olho: 1, bocaY: 0, bocaX: 1 },
  esforco: { sobe: -0.004, meio: -0.12, olho: 0.8, bocaY: 0.4, bocaX: 1.05 }, // correndo
  medo: { sobe: 0.008, meio: 0.3, olho: 1.3, bocaY: 0.75, bocaX: 0.85 },
  dor: { sobe: -0.002, meio: 0.35, olho: 0.3, bocaY: 0.65, bocaX: 1.2 },
  raiva: { sobe: -0.006, meio: -0.3, olho: 0.75, bocaY: 0, bocaX: 1.1 },
  surpresa: { sobe: 0.012, meio: 0.05, olho: 1.35, bocaY: 1, bocaX: 0.75 },
}
const PISCA = { intervalo: [2, 5.5], dura: 0.13 } // de quanto em quanto pisca (s) e quanto dura

export interface AnimRosto { sobe: number; meio: number; olho: number; bocaY: number; bocaX: number; pisca: number; piscando: number; olhar: number; olharAlvo: number; olharT: number }
export const novoRosto = (): AnimRosto => ({ ...EXPRESSOES.neutra, pisca: 3, piscando: 0, olhar: 0, olharAlvo: 0, olharT: 2 })

const damp = (cur: number, alvo: number, k: number, dt: number) => cur + (alvo - cur) * (1 - Math.exp(-k * dt))

export function animarRosto(a: Agente, exp: Expressao, dt: number) {
  const r = a.anim.rosto, f = a.rosto, alvo = EXPRESSOES[exp]
  r.sobe = damp(r.sobe, alvo.sobe, 12, dt); r.meio = damp(r.meio, alvo.meio, 12, dt); r.olho = damp(r.olho, alvo.olho, 14, dt)
  r.bocaY = damp(r.bocaY, alvo.bocaY, 12, dt); r.bocaX = damp(r.bocaX, alvo.bocaX, 12, dt)
  // piscar: de tempos em tempos, rápido
  r.pisca -= dt
  if (r.pisca <= 0) { r.piscando = PISCA.dura; r.pisca = PISCA.intervalo[0] + Math.random() * (PISCA.intervalo[1] - PISCA.intervalo[0]) }
  r.piscando = Math.max(0, r.piscando - dt)
  const fecha = r.piscando > 0 ? 0.08 : 1
  // o olhar passeia: pequenos saltos de lado de vez em quando
  r.olharT -= dt
  if (r.olharT <= 0) { r.olharAlvo = (Math.random() - 0.5) * 0.012; r.olharT = 1.2 + Math.random() * 3 }
  r.olhar = damp(r.olhar, r.olharAlvo, 25, dt)

  f.olhos.forEach((o) => { o.scale.y = Math.max(0.05, r.olho * fecha) })
  f.iris.forEach((g, i) => { g.position.x = f.base.iris[i].x + r.olhar })
  f.sobrancelhas.forEach((g, i) => {
    const s = i === 0 ? -1 : 1 // [0] direita, [1] esquerda: o "meio" gira para lados opostos
    g.position.y = f.base.sobrancelhas[i].y + r.sobe
    g.rotation.z = -s * r.meio
  })
  // a peça da boca aberta: encolhida demais ela some (fica a boca fechada, pintada no rosto)
  f.boca.visible = r.bocaY > 0.08
  f.boca.scale.set(r.bocaX, Math.max(0.001, r.bocaY), 1)
}
