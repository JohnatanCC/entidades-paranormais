// As mãos do agente: cada dedo com duas falanges e o polegar, fechando e abrindo por poses (do laboratório não vem nada:
// é novo, do modelo em blocos de 10/nov). A pose muda suave; parada, a mão "respira" (os dedos mexem de leve).
// Os dedos fecham para a palma (+z da mão): girar a falange em x para o negativo.
import type { Agente } from './modelo'

export type PoseMao = 'solta' | 'punho' | 'aberta' | 'segurar' | 'apontar'

/** Quanto cada dedo fecha (0 = esticado, 1 = fechado): indicador, médio, anelar, mínimo; o polegar; abre = leque dos dedos. */
export const POSES: Record<PoseMao, { dedos: [number, number, number, number]; polegar: number; abre: number }> = {
  solta: { dedos: [0.22, 0.28, 0.34, 0.4], polegar: 0.25, abre: 0.15 },
  punho: { dedos: [1, 1, 1, 1], polegar: 0.9, abre: 0 },
  aberta: { dedos: [0, 0, 0, 0], polegar: 0, abre: 1 },
  segurar: { dedos: [0.8, 0.9, 0.95, 1], polegar: 0.75, abre: 0 }, // a empunhadura das armas (arma.ts)
  apontar: { dedos: [0, 1, 1, 1], polegar: 0.8, abre: 0 },
}
const DOBRA = { base: 1.35, ponta: 1.5, polegarX: 0.6, polegarZ: 0.9, leque: 0.13 } // radianos no fechado / aberto

/** O estado de uma mão (o fecho atual de cada dedo, para a troca de pose ser suave). */
export interface AnimMao { dedos: number[]; polegar: number; abre: number }
export const novaMao = (): AnimMao => ({ dedos: [...POSES.solta.dedos], polegar: POSES.solta.polegar, abre: POSES.solta.abre })

const damp = (cur: number, alvo: number, k: number, dt: number) => cur + (alvo - cur) * (1 - Math.exp(-k * dt))

/** Leva as duas mãos para a pose (k = quanto da pose, 0..1, sobre a "solta"). forca: uma pose inteira para cada mão
 *  ([direita, esquerda]; a mão da arma, a de um gesto), por cima da pose geral. */
export function animarMaos(a: Agente, pose: PoseMao, k: number, dt: number, tempo: number, forca: [PoseMao?, PoseMao?] = []) {
  const base = POSES.solta
  a.arms.forEach((b, lado) => {
    const m = a.anim.maos[lado]
    const f = forca[lado], alvo = POSES[f ?? pose], kk = f ? 1 : k
    for (let i = 0; i < 4; i++) {
      // parada e solta, cada dedo mexe um pouco, cada um no seu ritmo
      const vivo = alvo === base ? 0.05 * Math.sin(tempo * (1.3 + i * 0.37) + lado * 2 + i) : 0
      m.dedos[i] = damp(m.dedos[i], base.dedos[i] + (alvo.dedos[i] - base.dedos[i]) * kk + vivo, 14, dt)
    }
    m.polegar = damp(m.polegar, base.polegar + (alvo.polegar - base.polegar) * kk, 14, dt)
    m.abre = damp(m.abre, base.abre + (alvo.abre - base.abre) * kk, 10, dt)
    b.dedos.forEach((d, i) => {
      d.base.rotation.set(-m.dedos[i] * DOBRA.base, 0, b.s * (1.5 - i) * DOBRA.leque * m.abre)
      d.ponta.rotation.set(-m.dedos[i] * DOBRA.ponta, 0, 0)
    })
    b.polegar.base.rotation.set(-m.polegar * DOBRA.polegarX, 0, b.s * (0.25 * m.abre - m.polegar * DOBRA.polegarZ))
    b.polegar.ponta.rotation.set(0, 0, -b.s * m.polegar * 0.7)
  })
}
