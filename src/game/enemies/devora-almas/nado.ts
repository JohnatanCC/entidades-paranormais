// O rumo do Devora almas (docs/demonios.md): nadar até um ponto e virar para um ponto com transição. Ele acelera e
// freia, o giro cresce e diminui aos poucos (sem passar do ponto), a curva tem um raio mínimo e nas fechadas ele perde
// velocidade; chegando, vem freando. Quem o controla (a inteligência; hoje o Ver modelos) chama uma destas a cada
// quadro, nadando; nos ataques que andam sozinhos (a investida, o mergulho, rastejar) quem move é a animação.
// A animação mede o giro e a velocidade do root e deita o corpo na curva (animacao.ts).
import type * as THREE from 'three'
import type { DevoraAlmas } from './modelo'
import { NADO } from './numeros'

const PI = Math.PI
const angulo = (a: number) => { while (a > PI) a -= 2 * PI; while (a < -PI) a += 2 * PI; return a }
const cl = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x))
const aproxima = (cur: number, alvo: number, passo: number) => cur + cl(alvo - cur, -passo, passo)

/** O giro que ele pede para um erro de rumo (rad): o maior que ainda dá para frear a tempo, até o máximo da velocidade. */
function giroPara(erro: number, vel: number) {
  const max = Math.max(NADO.giroParado, vel / NADO.raio)
  return Math.sign(erro) * Math.min(max, Math.sqrt(2 * NADO.giroAcel * Math.abs(erro)) * 0.9)
}
/** Aplica o rumo de agora: gira e anda. */
function seguir(d: DevoraAlmas, giroQuer: number, velQuer: number, dt: number) {
  const r = d.root, R = d.anim.rumo
  R.vel = aproxima(R.vel, velQuer, (velQuer > R.vel ? NADO.acelera : NADO.freia) * dt)
  R.giro = aproxima(R.giro, giroQuer, NADO.giroAcel * dt)
  r.rotation.y = angulo(r.rotation.y + R.giro * dt)
  r.position.x += Math.sin(r.rotation.y) * R.vel * dt; r.position.z += Math.cos(r.rotation.y) * R.vel * dt
}

/** Um quadro de nado até `alvo` (no chão), na velocidade `vel` (m/s). Devolve a distância que falta (m). */
export function nadarPara(d: DevoraAlmas, alvo: THREE.Vector3, dt: number, vel: number = NADO.vel): number {
  const r = d.root, dx = alvo.x - r.position.x, dz = alvo.z - r.position.z, dist = Math.hypot(dx, dz)
  const erro = dist > 0.05 ? angulo(Math.atan2(dx, dz) - r.rotation.y) : 0
  const curva = Math.max(0.3, Math.cos(Math.min(Math.abs(erro), PI / 2))) // de lado ou de costas para o alvo: quase para e vira
  const chegando = Math.min(1, dist / ((vel * vel) / (2 * NADO.freia) + 0.5)) // freia a tempo de chegar
  seguir(d, giroPara(erro, d.anim.rumo.vel), vel * curva * chegando, dt)
  return dist
}
/** Um quadro virando para `alvo`, sem andar (o embalo vai freando). Devolve o quanto falta virar (rad). */
export function virarPara(d: DevoraAlmas, alvo: THREE.Vector3, dt: number): number {
  const r = d.root, erro = angulo(Math.atan2(alvo.x - r.position.x, alvo.z - r.position.z) - r.rotation.y)
  seguir(d, giroPara(erro, 0), 0, dt)
  return Math.abs(erro)
}
/** Um quadro parando: o embalo e o giro vão a zero. */
export function pararNado(d: DevoraAlmas, dt: number) { seguir(d, 0, 0, dt) }
