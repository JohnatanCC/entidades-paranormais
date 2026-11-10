// A pose da Mãe (do laboratório v130): cada movimento diz uma pose-alvo e o corpo chega nela por molas de segunda ordem,
// cada parte no seu tempo (o quadril puxa, o tronco vem, o braço depois e a mão chicoteia por último), passando um pouco
// do ponto e assentando. A "dureza" de cada movimento (rate) é a frequência das molas: quanto maior, mais seca a pose.
// As chaves:
//   hy = o quadril sobe/desce (m; as pernas dobram para os pés ficarem no chão) · hx, hry, hz = o giro do quadril
//   lean, ly, lz = o tronco (para a frente, gira, tomba: a cintura e o peito dividem, a coluna faz uma curva)
//   nx, ny, nz = o pescoço (o pescoço e a cabeça dividem) · jaw = a boca (o queixo cai: 0 fechada, 1 escancarada)
//   cada braço: x (para a frente < 0), z (para fora > 0), tw (gira para fora > 0), el (o cotovelo), wr (o pulso),
//   curl (os dedos), sp (abrem)
import type { Mae } from './modelo'

export const KEYS = ['hy', 'hx', 'hz', 'hry', 'lean', 'lz', 'ly', 'nx', 'ny', 'nz', 'jaw'] as const
export const AK = ['x', 'z', 'tw', 'el', 'wr', 'curl', 'sp'] as const
type Chave = typeof KEYS[number]
type ChaveBraco = typeof AK[number]
export type PoseBraco = Record<ChaveBraco, number>
export type Pose = Record<Chave, number> & { a: [PoseBraco, PoseBraco] } // a[0] direito, a[1] esquerdo

const bracoP = (): PoseBraco => ({ x: 0, z: 0, tw: 0, el: -0.2, wr: 0.1, curl: 0.3, sp: 0 })
export const pose0 = (): Pose => ({ hy: 0, hx: 0, hz: 0, hry: 0, lean: 0, lz: 0, ly: 0, nx: 0, ny: 0, nz: 0, jaw: 0, a: [bracoP(), bracoP()] })
export const zerada = (): Pose => { const p = pose0(); for (const b of p.a) for (const q of AK) b[q] = 0; return p }

/** A mistura de duas poses (k = 0: A; 1: B), numa pose nova. */
export function misturar(A: Pose, B: Pose, k: number, out = pose0()): Pose {
  for (const q of KEYS) out[q] = A[q] + (B[q] - A[q]) * k
  for (let i = 0; i < 2; i++) for (const q of AK) out.a[i][q] = A.a[i][q] + (B.a[i][q] - A.a[i][q]) * k
  return out
}

// a frequência (× a dureza) e o amortecimento de cada chave: o quadril rápido, o pescoço solto, a mão mais solta ainda
const FQ: Record<Chave, number> = { hy: 1.15, hx: 1.05, hz: 1.05, hry: 1.05, lean: 0.95, lz: 0.9, ly: 0.85, nx: 0.8, ny: 0.8, nz: 0.85, jaw: 1.4 }
const ZT: Record<Chave, number> = { hy: 0.85, hx: 0.85, hz: 0.85, hry: 0.85, lean: 0.8, lz: 0.78, ly: 0.75, nx: 0.68, ny: 0.68, nz: 0.7, jaw: 0.75 }
const FA: Record<ChaveBraco, number> = { x: 0.88, z: 0.88, tw: 0.8, el: 0.76, wr: 0.66, curl: 0.62, sp: 0.7 }
const ZA: Record<ChaveBraco, number> = { x: 0.62, z: 0.64, tw: 0.7, el: 0.58, wr: 0.5, curl: 0.55, sp: 0.6 }
const DEDO_R = [27, 22, 17.5, 14] // os dedos fecham em cascata: o indicador primeiro, o mínimo por último

/** O que as molas da pose lembram: a pose de agora, a velocidade de cada chave e o fecho de cada dedo. */
export interface MolasDaPose { cur: Pose; vel: Pose; dedos: [number[], number[]] }
export const novasMolasDaPose = (): MolasDaPose => ({ cur: pose0(), vel: zerada(), dedos: [[0.3, 0.3, 0.3, 0.3], [0.3, 0.3, 0.3, 0.3]] })

function mola(C: Record<string, number>, V: Record<string, number>, q: string, alvo: number, w: number, z: number, h: number) {
  const a = (alvo - C[q]) * w * w - 2 * z * w * V[q]
  V[q] += a * h; C[q] += V[q] * h
}

/** Leva a pose de agora para o alvo (rate = a dureza do movimento). */
export function seguirPose(M: MolasDaPose, alvo: Pose, rate: number, dt: number) {
  const n = Math.min(8, Math.max(1, Math.ceil(dt * 120))), h = dt / n, W = rate * 1.35
  for (let s = 0; s < n; s++) {
    const C = M.cur as unknown as Record<string, number>, V = M.vel as unknown as Record<string, number>
    for (const q of KEYS) mola(C, V, q, alvo[q], W * FQ[q], ZT[q], h)
    for (let i = 0; i < 2; i++) for (const q of AK) mola(M.cur.a[i], M.vel.a[i], q, alvo.a[i][q], W * FA[q], ZA[q], h)
  }
  for (let i = 0; i < 2; i++) for (let f = 0; f < 4; f++) M.dedos[i][f] += (M.cur.a[i].curl - M.dedos[i][f]) * (1 - Math.exp(-DEDO_R[f] * dt))
}

// como as dobras se dividem: a cintura e o peito (a curva da coluna); o pescoço e a cabeça
const CINTURA = 0.55, PESCOCO = 0.6
/** O quanto o queixo cai com a boca escancarada (rad; o rosto usa também). */
export const QUEIXO = 0.85

/** Põe a pose nos ossos (o quadril, a coluna em duas dobras, o pescoço e a cabeça com o estalo, o queixo, as clavículas,
 *  os braços com a mão chicoteando). */
export function aplicarPose(m: Mae, M: MolasDaPose, estalo: number) {
  const P = M.cur
  m.quadril.position.y = m.base.quadrilY + P.hy
  m.quadril.rotation.set(P.hx, P.hry, P.hz)
  m.tronco.rotation.set(P.lean * CINTURA, P.ly * 0.5, P.lz * 0.5)
  m.peito.rotation.set(P.lean * (1 - CINTURA), P.ly * 0.5, P.lz * 0.5)
  const nz = P.nz + estalo
  m.pescoco.rotation.set(P.nx * PESCOCO, P.ny * PESCOCO, nz * PESCOCO)
  m.cabeca.rotation.set(P.nx * (1 - PESCOCO), P.ny * (1 - PESCOCO), nz * (1 - PESCOCO))
  m.mandibula.rotation.x = Math.max(0, P.jaw) * QUEIXO
  m.bracos.forEach((b, k) => {
    const q = P.a[k], v = M.vel.a[k], s = b.s
    // a mão chicoteia: atrasa contra o giro do braço e do cotovelo (e volta)
    const wx = Math.max(-0.55, Math.min(0.55, -(v.x + v.el) * 0.018)), wz = Math.max(-0.4, Math.min(0.4, -v.z * 0.02))
    // a clavícula: o ombro sobe quando o braço passa da altura dele (e o braço desconta, para apontar para o mesmo lugar)
    const ombro = Math.min(0.35, Math.max(0, (-q.x - 1.2) * 0.25))
    b.om.rotation.set(0, 0, s * ombro)
    b.up.rotation.set(q.x, s * q.tw, s * (q.z - ombro), 'XZY') // z e tw positivos = para fora, nos dois lados
    b.fo.rotation.set(q.el, 0, 0)
    b.hd.rotation.set(q.wr + wx, 0, wz)
    // os dedos fecham para a palma (que olha para dentro, para o corpo) e abrem em leque
    b.dedos.forEach((d, i) => {
      const cu = M.dedos[k][i] * (1 + (i % 2) * 0.2)
      d.base.rotation.set((i - 1.5) * 0.14 * q.sp, 0, -s * cu * 0.6)
      d.ponta.rotation.set(0, 0, -s * cu * 0.95)
    })
    b.polegar.base.rotation.set(0, 0, -s * q.curl * 0.5)
  })
}

