// O controle do agente (do laboratório): anda relativo à câmera, corre gastando fôlego, esquiva com uma cambalhota
// para onde está apertando (sem direção, para trás), vira o corpo para onde anda, bate nas paredes e nos móveis e
// acompanha o chão (escadas e andares). Mirando, anda devagar, não corre e vira para onde a câmera olha (como no RE4).
// Os números ficam em numeros.ts.
import { LEVEL_H } from '../../maps/types'
import type { Acoes } from '../input/acoes'
import { chaoEm, empurrar, type Mundo } from '../world/colisao'
import { AGENTE, MIRA } from './numeros'

export interface Jogador {
  x: number; y: number; z: number
  vx: number; vz: number; vy: number
  yaw: number // para onde o corpo olha (a frente é +z quando yaw = 0)
  folego: number; folegoTravado: boolean; folegoParado: number
  corrida: number // 0..1, suave
  esquiva: number // -1 = não; senão o tempo desde o começo (s)
  esquivaDir: [number, number]
  esquivaRecarga: number
  velocidade: number // a velocidade real no chão (m/s), para a animação
  mira: boolean // mirando (quem joga diz, antes do passo)
}

export function novoJogador(x: number, y: number, z: number, yaw = 0): Jogador {
  return { x, y, z, vx: 0, vz: 0, vy: 0, yaw, folego: AGENTE.folego, folegoTravado: false, folegoParado: 0, corrida: 0, esquiva: -1, esquivaDir: [0, 1], esquivaRecarga: 0, velocidade: 0, mira: false }
}

const ang = (a: number) => Math.atan2(Math.sin(a), Math.cos(a)) // −π..π
const amortece = (de: number, para: number, k: number, dt: number) => de + (para - de) * (1 - Math.exp(-k * dt))

/** Um passo do controle. camYaw: para onde a câmera olha (a frente da câmera é (sin, cos)). */
export function passoJogador(p: Jogador, a: Acoes, camYaw: number, m: Mundo, dt: number) {
  const [ix, iz] = a.mover()
  const fx = Math.sin(camYaw), fz = Math.cos(camYaw)
  // o desejo de andar no chão: frente da câmera × iz + direita da câmera × ix
  let wx = fx * iz - fz * ix, wz = fz * iz + fx * ix
  const wl = Math.hypot(wx, wz)
  if (wl > 1) { wx /= wl; wz /= wl }
  const ocupado = p.esquiva >= 0

  // correr gasta fôlego; acabou, trava até recuperar 2 s
  const corre = a.correr() && wl > 0.1 && !p.folegoTravado && p.folego > 0 && !ocupado && !p.mira
  p.corrida = amortece(p.corrida, corre ? 1 : 0, 7, dt)
  if (corre) { p.folego = Math.max(0, p.folego - dt); p.folegoParado = 0; if (p.folego <= 0) p.folegoTravado = true }
  else { p.folegoParado += dt; if (p.folegoParado > 0.7) p.folego = Math.min(AGENTE.folego, p.folego + AGENTE.folegoVolta * dt) }
  if (p.folegoTravado && p.folego >= 2) p.folegoTravado = false

  // acelera e freia até a velocidade desejada
  const sp = corre ? AGENTE.correr : p.mira ? MIRA.andar : AGENTE.andar
  const tx = ocupado ? 0 : wx * sp, tz = ocupado ? 0 : wz * sp
  const dvx = tx - p.vx, dvz = tz - p.vz, dm = Math.hypot(dvx, dvz), taxa = (wl > 0.05 && !ocupado ? AGENTE.acel : AGENTE.freio) * dt
  if (dm <= taxa) { p.vx = tx; p.vz = tz } else { p.vx += (dvx / dm) * taxa; p.vz += (dvz / dm) * taxa }

  // a esquiva: para onde está apertando; sem direção, para trás da câmera
  const E = AGENTE.esquiva
  if (a.esquivar() && p.esquiva < 0 && p.esquivaRecarga <= 0 && p.folego >= 1.2) {
    const d = wl > 0.1 ? [wx / Math.max(wl, 1e-6), wz / Math.max(wl, 1e-6)] : [-fx, -fz]
    p.esquiva = 0; p.esquivaDir = [d[0], d[1]]; p.esquivaRecarga = E.recarga; p.folego = Math.max(0, p.folego - 1.2); p.folegoParado = 0
    p.yaw = Math.atan2(d[0], d[1])
  }
  if (p.esquiva >= 0) { // a cambalhota anda E.dist em E.dur, rápida no começo
    const u = Math.min(1, p.esquiva / E.dur), v = (E.dist / E.dur) * 2 * (1 - u)
    p.vx = p.esquivaDir[0] * v; p.vz = p.esquivaDir[1] * v
  }

  // o corpo vira para onde anda; mirando, para onde a câmera olha
  if (p.mira && p.esquiva < 0) p.yaw = ang(p.yaw + ang(camYaw - p.yaw) * (1 - Math.exp(-18 * dt)))
  else if (p.esquiva < 0 && p.vx * p.vx + p.vz * p.vz > 0.09) p.yaw = ang(p.yaw + ang(Math.atan2(p.vx, p.vz) - p.yaw) * (1 - Math.exp(-10 * dt)))

  // anda e bate; depois acompanha o chão (sobe degrau, desce caindo)
  const ox = p.x, oz = p.z
  const pos = { x: p.x + p.vx * dt, z: p.z + p.vz * dt }
  empurrar(m, pos, p.y, AGENTE.raio)
  p.x = pos.x; p.z = pos.z
  const chao = chaoEm(m, p.x, p.z, p.y) ?? 0
  // no chão: sobe o degrau; descendo a escada, acompanha (gruda no chão se a queda é pequena e ele não está caindo)
  if (chao >= p.y - (p.vy > -1 ? 0.35 : 0.05)) { p.y = chao; p.vy = 0 }
  else { p.vy -= 18 * dt; p.y = Math.max(chao, p.y + p.vy * dt); if (p.y === chao) p.vy = 0 } // caindo (buraco da escada, beirada)
  if (p.y < -LEVEL_H) p.y = 0
  p.velocidade = Math.hypot(p.x - ox, p.z - oz) / Math.max(dt, 1e-4)

  // os relógios
  if (p.esquiva >= 0) { p.esquiva += dt; if (p.esquiva > E.dur) p.esquiva = -1 }
  p.esquivaRecarga -= dt
}
