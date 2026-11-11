// Os pés presos no chão: o pé de apoio não escorrega. As curvas da passada (passada.ts) põem a perna no lugar; aqui a
// perna que está no apoio é corrigida (IK de dois ossos, no plano da perna, como o braço em alcancar.ts) para o ponto
// da sola que toca o chão ficar onde tocou: primeiro o calcanhar, depois a ponta (quando o calcanhar sobe, quem fica é
// ela). Esse ponto corre para trás na velocidade do corpo, para qualquer lado que ele ande (no espaço do personagem;
// no mundo ele fica parado); de lado, a coxa abre para o pé acompanhar. O pé
// mantém o ângulo que a curva deu e fica com a sola no chão: nem afunda nem flutua. Entra suave quando o pé chega; no
// balanço o pé sai de onde ficou preso e vai até onde a curva quer, num arco por cima (andando de lado, os dois lugares
// ficam longe: sem o arco, o pé voltaria raspando no chão). Se o ponto preso fica longe demais para a perna, ela estica
// o que dá.
import * as THREE from 'three'
import type { Agente } from './modelo'

/** O pé de cada perna: onde o ponto da sola está preso (x e z no espaço do personagem), qual ponto (0 o calcanhar,
 *  1 a ponta), se está preso, se estava no ar no quadro anterior. */
export interface PeNoChao { x: number; z: number; j: number; preso: boolean; ar: boolean }
export const novosPes = (): [PeNoChao, PeNoChao] => [{ x: 0, z: 0, j: 0, preso: false, ar: true }, { x: 0, z: 0, j: 0, preso: false, ar: true }]

const _a = new THREE.Vector3(), _t = new THREE.Vector3(), _m = new THREE.Matrix4(), _y = new THREE.Vector3(0, 1, 0)
const _s = [new THREE.Vector3(), new THREE.Vector3()]
const cl = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x))
const lerp = (a: number, b: number, k: number) => a + (b - a) * k
const sm = (x: number) => { const k = cl(x, 0, 1); return k * k * (3 - 2 * k) }
const ARCO = { max: 0.12, k: 0.35 } // m: a altura a mais do pé no balanço (k × a distância que ele tem que andar, até max)

// um ponto de um osso no espaço do personagem (sem depender do matrixWorld, que pode estar atrasado)
function naRaiz(o: THREE.Object3D, raiz: THREE.Object3D, v: THREE.Vector3) {
  for (let n: THREE.Object3D | null = o; n && n !== raiz; n = n.parent) { n.updateMatrix(); v.applyMatrix4(n.matrix) }
  return v
}
// a matriz do personagem até o osso (para levar um ponto do personagem para dentro do osso)
function ateORaiz(o: THREE.Object3D, raiz: THREE.Object3D, m: THREE.Matrix4) {
  m.identity()
  for (let n: THREE.Object3D | null = o; n && n !== raiz; n = n.parent) { n.updateMatrix(); m.premultiply(n.matrix) }
  return m
}

/**
 * Prende o pé de apoio de cada perna. u = a fase do ciclo (0 = o pé direito tocando); apoio = a fração do ciclo com o pé
 * no chão; mover = a velocidade do corpo no espaço dele (x para a esquerda, z para a frente; m/s); k = quanto vale
 * (0 = solto: parado, rolando, caindo). O pé prende quando entra no apoio (andando para a frente ou de costas).
 */
export function prenderPes(a: Agente, u: number, apoio: number, mover: [number, number], k: number, dt: number) {
  a.legs.forEach((L, i) => {
    const P = a.anim.pes[i], v = (u + (L.s > 0 ? 0.5 : 0)) % 1
    // depois do apoio: o pé no ar, voltando para a curva (andando, o balanço inteiro; correndo, só o começo: o calcanhar sobe)
    const lado = Math.abs(mover[0]) / Math.max(Math.hypot(mover[0], mover[1]), 0.05) // 0 = de frente ou de costas, 1 = de lado
    // de frente, o pé solta logo (a curva já leva ele para onde ficou preso); de lado, aos poucos no balanço, com o arco
    // de costas a passada roda ao contrário: o pé sai do chão no começo do ciclo (o v passa do 0 para o 1)
    const costas = mover[1] < -0.3 * Math.hypot(mover[0], mover[1])
    const noAr = v < apoio ? v - apoio : costas ? 1 - v : v - apoio, balanco = lerp(0.12, (1 - apoio) * (0.4 + 0.6 * cl((apoio - 0.35) / 0.25, 0, 1)), lado)
    const tocou = noAr < 0 && P.ar // o pé acabou de chegar ao chão: prende de novo
    P.ar = noAr >= 0
    if (k < 0.001 || (noAr >= 0 && !P.preso)) { P.preso = false; return }
    // o tornozelo e os dois pontos da sola (o calcanhar e a ponta), como as curvas puseram; o mais baixo é o que toca
    naRaiz(L.ft, a.root, _a.set(0, 0, 0))
    a.sola.forEach((q, n) => naRaiz(L.ft, a.root, _s[n].copy(q)))
    const j = _s[0].y <= _s[1].y ? 0 : 1, toca = _s[j]
    if (!P.preso || tocou) { P.x = toca.x; P.z = toca.z; P.j = j; P.preso = true } // preso onde tocou
    else if (noAr < 0) {
      P.x -= mover[0] * dt; P.z -= mover[1] * dt // o corpo anda: o ponto preso fica para trás
      if (j !== P.j) { P.x += toca.x - _s[P.j].x; P.z += toca.z - _s[P.j].z; P.j = j } // o calcanhar subiu: a ponta fica presa, no lugar dela
    }
    const w = k * (noAr < 0 ? sm((costas ? apoio - v : v) / 0.04) : 1 - sm(noAr / balanco)) // entra suave onde o pé chega
    if (w < 0.001) return
    // o alvo do tornozelo: o pé inteiro levado até o ponto preso, com a sola no chão
    // no ar, a altura é a da curva mais o arco
    const arco = noAr < 0 ? 0 : lado * Math.min(ARCO.max, ARCO.k * Math.hypot(P.x - toca.x, P.z - toca.z)) * Math.sin(Math.PI * noAr / balanco)
    // (a sola sai do chão aos poucos: soltar de uma vez dava um salto do pé na hora de levantar)
    const chao = noAr < 0 ? 1 : 1 - sm(noAr / balanco)
    _t.set(_a.x + P.x - toca.x, _a.y - toca.y * chao + arco / Math.max(w, 0.05), _a.z + P.z - toca.z).lerp(_a, 1 - w)
    // para dentro do quadril (o pai da coxa), e o IK: a coxa abre para o lado do alvo e, no plano da perna, gira para
    // a frente ou para trás; o joelho dobra
    _t.applyMatrix4(_m.copy(ateORaiz(L.th.parent!, a.root, _m)).invert()).sub(L.th.position)
    _t.applyAxisAngle(_y, -L.th.rotation.y) // no plano do passo (a coxa já girou para o lado em que ele anda)
    const l1 = L.kn.position.length(), l2 = L.ft.position.length(), d = _t.length()
    const D = cl(d, Math.abs(l1 - l2) + 1e-4, l1 + l2 - 1e-4)
    const abre = Math.asin(cl(_t.x / Math.max(d, 1e-4), -1, 1)) - L.th.rotation.z // o quanto a coxa abre a mais
    const fi = Math.atan2(_t.z, -_t.y) // a linha do quadril ao alvo, à frente da vertical
    const al = Math.acos(cl((l1 * l1 + D * D - l2 * l2) / (2 * l1 * D), -1, 1)) // a coxa vai à frente dessa linha (o joelho na frente)
    const dobra = Math.PI - Math.acos(cl((l1 * l1 + l2 * l2 - D * D) / (2 * l1 * l2), -1, 1))
    const pe = L.ft.rotation.x + L.th.rotation.x + L.kn.rotation.x // o ângulo do pé com o chão, o da curva
    L.th.rotation.x = -(fi + al); L.kn.rotation.x = dobra; L.th.rotation.z += abre
    L.ft.rotation.x = pe - L.th.rotation.x - L.kn.rotation.x; L.ft.rotation.z -= abre // a sola continua deitada no chão
  })
}
