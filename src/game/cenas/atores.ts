// O elenco, a conta pura (como o tocador): dado o tempo da cena, onde cada ator está, para onde está virado, a que
// velocidade anda, para onde olha, a expressão e se está falando; e o quanto cada porta da cena está aberta. Quem
// desenha (Elenco.tsx) só lê o resultado: pular para qualquer ponto da cena põe todo mundo no lugar certo.
import { ALCANCE } from '../player/numeros'
import type { Expressao } from '../player/rosto'
import { inicios } from './tocador'
import type { Cena, V3 } from './tipos'

export interface EstadoAtor {
  pos: V3
  yaw: number // rad (0 = de frente para +z)
  vel: number // m/s andando agora (0 = parado)
  corre: boolean
  olha: string | V3 | null // o nome de outro ator, um ponto, ou para a frente
  expressao: Expressao
  fala: boolean // a legenda dele está na tela (e não é pensamento): a boca mexe
  alcanca: { ponto: V3; t: number } | null // a mão indo a um ponto agora (t = s desde o começo do gesto)
}

const GIRO = 0.6 // s para virar no lugar
const VIRA_ANDANDO = 0.3 // s para virar para onde vai, ao começar a andar
const GESTO = ALCANCE.sobe + ALCANCE.segura + ALCANCE.desce // s: a mão vai a um ponto e volta
const PORTA_CENA = 0.8 // s para a porta abrir ou fechar (mais devagar que a do jogo: é cena)
const rad = (g: number) => (g * Math.PI) / 180
const cl = (v: number) => Math.max(0, Math.min(1, v))
const suave = (k: number) => k * k * (3 - 2 * k)
/** De um ângulo para o outro pelo lado mais curto. */
const girar = (a: number, b: number, k: number) => a + Math.atan2(Math.sin(b - a), Math.cos(b - a)) * k

export function estadoDoAtor(c: Cena, nome: string, t: number): EstadoAtor {
  const ator = c.elenco![nome], ini = inicios(c)
  let pos: V3 = [...ator.em], yaw = rad(ator.vira), vel = 0, corre = false
  let olha: EstadoAtor['olha'] = null, expressao: Expressao = 'neutra', alcanca: EstadoAtor['alcanca'] = null
  for (let i = 0; i < c.planos.length && ini[i] <= t; i++) {
    const p = c.planos[i], a = p.atores?.[nome], local = Math.min(t - ini[i], p.dura), agora = t < ini[i] + p.dura
    vel = 0; corre = false; alcanca = null // anda e alcança só no plano de agora
    if (!a) continue
    if (a.em) pos = [...a.em]
    if (a.olha !== undefined) olha = a.olha
    if (a.expressao) expressao = a.expressao
    if (a.alcanca && agora && local >= a.alcanca.t && local < a.alcanca.t + GESTO) alcanca = { ponto: a.alcanca.ponto, t: local - a.alcanca.t }
    let giroDe = 0 // quando começa a virar para `vira`
    if (a.anda) {
      const de = a.anda.de ?? 0, ate = a.anda.ate ?? p.dura, para = a.anda.para, k = cl((local - de) / (ate - de))
      const rumo = Math.atan2(para[0] - pos[0], para[2] - pos[2]), d = Math.hypot(para[0] - pos[0], para[2] - pos[2])
      if (local > de && d > 0.01) yaw = girar(yaw, rumo, cl((local - de) / VIRA_ANDANDO))
      if (agora && local >= de && local < ate) { vel = d / (ate - de); corre = !!a.corre }
      pos = [pos[0] + (para[0] - pos[0]) * k, pos[1] + (para[1] - pos[1]) * k, pos[2] + (para[2] - pos[2]) * k]
      giroDe = ate
    }
    if (a.vira !== undefined) yaw = girar(yaw, rad(a.vira), suave(cl((local - giroDe) / GIRO)))
  }
  return { pos, yaw, vel, corre, olha, expressao, fala: falando(c, nome, t, ini), alcanca }
}

/** A legenda dele está na tela agora (a fala em voz alta; o pensamento não mexe a boca)? */
function falando(c: Cena, nome: string, t: number, ini: number[]) {
  for (let i = 0; i < c.planos.length; i++) {
    const p = c.planos[i]
    if (t < ini[i] || t >= ini[i] + p.dura) continue
    const local = t - ini[i]
    return !!p.falas?.some((f) => f.quem === nome && !f.pensamento && local >= f.t && local < f.t + f.dura)
  }
  return false
}

/** As portas que a cena abre e fecha (os ids do mapa). */
export const portasDaCena = (c: Cena) => [...new Set(c.planos.flatMap((p) => (p.portas ?? []).map((x) => x.id)))]

/** A porta no tempo `t`: o quanto está aberta (0 fechada, 1 aberta: a última ordem dela até ali, andando) e para que
 *  lado abre (a última ordem de abrir que disse; sem nenhuma, o do mapa). */
export function estadoDaPorta(c: Cena, id: string, t: number): { ang: number; lado?: 'a' | 'b' } {
  const ini = inicios(c)
  let ang = 0, lado: 'a' | 'b' | undefined
  c.planos.forEach((p, i) => {
    for (const x of p.portas ?? []) {
      const quando = ini[i] + x.t
      if (x.id !== id || quando > t) continue
      const k = cl((t - quando) / PORTA_CENA)
      ang = x.abre ? Math.max(ang, k) : Math.min(ang, 1 - k)
      if (x.abre && x.lado) lado = x.lado
    }
  })
  return { ang, lado }
}
