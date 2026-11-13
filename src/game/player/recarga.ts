// A recarga da escopeta (decidida em 12/nov, docs/jogo.md), só a pose: quem decide (o tempo, quando cada bala vale) é
// weapons/municao.ts: 1 s por bala que falta. A mão esquerda solta a bomba, vai à bolsa do cinto e puxa o cartucho
// (modelos/armas/cartucho.bbmodel); a direita levanta a arma de pé, com a câmara virada para ele; a esquerda segura o
// cartucho por cima da câmara e as balas, uma de cada vez (só as que faltavam), flutuam para fora girando e são puxadas
// pela arma, como mágica; o cartucho vazio se desfaz, a mão volta à bomba e puxa: pronta. Andando e correndo também
// (daqui, só os braços e a arma). Cortada (esquivar, trocar de arma, um clique novo), a pose some rápido e o cartucho
// junto. Os tempos em numeros.ts (RECARGA).
import * as THREE from 'three'
import { arma3d } from '../../render/objetos3d'
import { duracaoDaRecarga, entradaDaBala } from '../weapons/municao'
import { MUNICAO } from '../weapons/numeros'
import { alcancar } from './alcancar'
import { armaEm, giroPeloCano, grupoDaArma, POLO_D } from './arma'
import type { PoseMao } from './maos'
import type { Agente } from './modelo'
import { RECARGA } from './numeros'

const R = RECARGA, E = MUNICAO.escopeta
const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z)
const POLO_BOLSA = V(1, -0.6, -0.5) // o cotovelo esquerdo para fora e para trás, descendo à bolsa
const POLO_E = V(0.4, -1, 0.3) // e segurando o cartucho por cima da arma (o braço atravessa na frente do peito)
const PONTO_C = V(0, -0.085, 0.03) // onde o cartucho fica na mão esquerda (nos dedos, na frente da palma)
const GIRO_C = new THREE.Quaternion().setFromAxisAngle(V(1, 0, 0), -Math.PI / 2) // as balas saem para fora da palma

const cl = (v: number) => Math.max(0, Math.min(1, v))
const sm = (x: number) => { const k = cl(x); return k * k * (3 - 2 * k) }
const entre = (t: number, [a, b]: number[]) => sm((t - a) / (b - a))
/** Sobe e desce entre a e b (0 → 1 → 0). */
const bate = (t: number, a: number, b: number) => Math.sin(Math.PI * cl((t - a) / (b - a)))

interface Cartucho { obj: THREE.Object3D; balas: { g: THREE.Object3D; pos: THREE.Vector3 }[]; viva: boolean }
const cartuchos = new WeakMap<Agente, Cartucho>()
/** O cartucho na mão esquerda (montado na primeira recarga; escondido fora dela). */
function cartuchoDe(a: Agente): Cartucho {
  let c = cartuchos.get(a)
  if (!c) {
    const obj = arma3d('cartucho'); obj.name = '#cartucho'
    obj.position.copy(PONTO_C); obj.quaternion.copy(GIRO_C); obj.visible = false
    a.arms[1].hd.add(obj)
    const balas = [1, 2, 3, 4].flatMap((n) => { const g = obj.getObjectByName(`bala_${n}`); return g ? [{ g, pos: g.position.clone() }] : [] })
    c = { obj, balas, viva: false }; cartuchos.set(a, c)
  }
  return c
}

/** A bala i (0..n−1): quando começa a flutuar para fora do cartucho, quando é puxada e quando entra (s). Cada uma espera
 *  a anterior entrar; a vez dela termina na hora em que a munição diz que ela vale. */
function vezDaBala(i: number, n: number) {
  const entra = entradaDaBala(i, n), comeco = i ? entradaDaBala(i - 1, n) : E.inicio
  const puxa = Math.max(comeco, entra - R.voo)
  return { flutua: Math.max(comeco, puxa - R.flutua), puxa, entra }
}

const _pos = new THREE.Vector3(), _cano = new THREE.Vector3(), _cima = new THREE.Vector3(), _qa = new THREE.Quaternion(), _qc = new THREE.Quaternion()
const _cam = new THREE.Vector3(), _up = new THREE.Vector3(), _fw = new THREE.Vector3(), _w = new THREE.Vector3(), _alvo = new THREE.Vector3(), _polo = new THREE.Vector3()
const _xh = new THREE.Vector3(), _yh = new THREE.Vector3(), _zh = new THREE.Vector3(), _qm = new THREE.Quaternion(), _qp = new THREE.Quaternion(), _m = new THREE.Matrix4()

/**
 * Depois da mira e dos gestos, antes da mão na bomba: a arma de pé e a mão esquerda (bolsa, cartucho, bomba).
 * r = a recarga de agora (t = s desde o começo, n = quantas balas entram), ou null (não está recarregando: se estava,
 * a pose some). solto = 1 − o quanto está na cambalhota ou caindo. Devolve a pose da mão esquerda, se a recarga manda nela.
 */
export function poseDaRecarga(a: Agente, r: { t: number; n: number } | null, solto: number, dt: number): PoseMao | undefined {
  const A = a.anim.arma, quer = r && a.arma === 'escopeta' ? 1 : 0
  A.recarga += (quer - A.recarga) * (1 - Math.exp(-(quer ? R.entra : R.sai) * dt))
  if (r) { A.rt = r.t; A.rn = r.n }
  const c = cartuchos.get(a)
  if (c) c.viva = !!quer
  if (a.arma !== 'escopeta') A.recarga = 0
  const k = A.recarga * solto
  if (k < 0.002) { if (c) c.obj.visible = false; return undefined }
  const t = A.rt, n = A.rn, D = duracaoDaRecarga(n), fim = D - E.fim // fim: a última bala entrou

  // a arma de pé, a câmara virada para ele; desce um pouco quando cada bala entra; no fim, volta para a guarda
  let tranco = 0, puxao = 0
  for (let i = 0; i < n; i++) {
    const v = vezDaBala(i, n)
    if (t > v.entra) tranco += Math.exp(-(t - v.entra) * 16)
    puxao += bate(t, v.flutua, v.flutua + 0.18) // a mão sobe um pouco quando a bala se solta do cartucho
  }
  const kg = k * entre(t, [0, 0.3]) * (1 - entre(t, [D - 0.35, D]))
  _pos.fromArray(R.arma.pega); _pos.y -= R.tranco * tranco
  armaEm(a, _pos, giroPeloCano(_cano.fromArray(R.arma.cano), _cima.fromArray(R.arma.cima), _qa), POLO_D, kg)

  // a mão esquerda: longe = o quanto saiu da bomba; leva = o quanto já foi da bolsa para cima da câmara
  const longe = k * entre(t, R.vai) * (1 - entre(t, [fim + R.volta[0], fim + R.volta[1]])), leva = entre(t, R.leva)
  A.esquerda *= 1 - longe
  if (longe > 0.001) {
    // a câmara e os eixos da arma, no espaço do peito (a arma já na pose)
    const g = grupoDaArma(a), camara = g?.userData.camara as THREE.Object3D | undefined
    a.root.updateMatrixWorld(true)
    a.chest.getWorldQuaternion(_qc).invert()
    if (camara) a.chest.worldToLocal(camara.getWorldPosition(_cam)); else _cam.fromArray(R.arma.pega)
    g?.getWorldQuaternion(_qa).premultiply(_qc)
    _up.set(0, 1, 0).applyQuaternion(_qa); _fw.set(0, 0, 1).applyQuaternion(_qa)
    // segurando: a palma virada para a arma, os dedos para a frente, o cartucho por cima da câmara
    _zh.copy(_up).negate(); _yh.copy(_fw).negate(); _xh.crossVectors(_yh, _zh)
    _qm.setFromRotationMatrix(_m.makeBasis(_xh, _yh, _zh))
    _w.copy(PONTO_C).applyQuaternion(_qm).negate().add(_cam).addScaledVector(_up, R.acima + 0.012 * puxao) // o pulso
    // na bolsa: desce um pouco e sobe (puxa o cartucho)
    _alvo.fromArray(R.bolsa); _alvo.y -= 0.025 * bate(t, R.puxa[0], R.puxa[1])
    _alvo.lerp(_w, leva); _polo.copy(POLO_BOLSA).lerp(POLO_E, leva)
    const b = a.arms[1]
    alcancar(b, _alvo, _polo, longe)
    _qp.copy(b.up.quaternion).multiply(b.fo.quaternion).invert()
    b.hd.quaternion.slerp(_qm.premultiply(_qp), longe * leva)
  }
  // depois da última bala, a mão volta à bomba e puxa: pronta
  A.bomba = Math.max(A.bomba, k * bate(t, fim + R.bomba[0], fim + R.bomba[1]))
  return longe > 0.5 ? (t < R.puxa[0] + 0.08 ? 'aberta' : 'segurar') : undefined
}

const _de = new THREE.Vector3(), _para = new THREE.Vector3(), _lado = new THREE.Vector3(), _p = new THREE.Vector3(), _qg = new THREE.Quaternion()

/** No fim da pose (com tudo no lugar): o cartucho aparece na mão e some vazio; as balas flutuam dele e são puxadas até a câmara. */
export function voarBalas(a: Agente) {
  const A = a.anim.arma, k = A.recarga
  if (a.arma !== 'escopeta' || k < 0.002) return
  const c = cartuchoDe(a), t = A.rt, n = A.rn, fim = duracaoDaRecarga(n) - E.fim
  const tam = k * entre(t, [R.puxa[0] + 0.08, R.puxa[0] + 0.16]) * (1 - entre(t, [fim + R.some[0], fim + R.some[1]]))
  c.obj.visible = tam > 0.01
  if (!c.obj.visible) return
  c.obj.scale.setScalar(tam)
  const g = grupoDaArma(a), camara = g?.userData.camara as THREE.Object3D | undefined
  a.root.updateMatrixWorld(true)
  if (camara) camara.getWorldPosition(_para)
  g?.getWorldQuaternion(_qg)
  c.balas.forEach((b, i) => {
    const v = i < n && camara ? vezDaBala(i, n) : null
    if (!v || t <= v.flutua) { b.g.position.copy(b.pos); b.g.rotation.y = 0; b.g.scale.setScalar(1); b.g.visible = true; return }
    // já entrou, ou a recarga foi cortada no meio do caminho: não aparece
    if (t >= v.entra || !c.viva) { b.g.visible = false; return }
    const pai = b.g.parent!
    pai.localToWorld(_de.copy(b.pos))
    _lado.set(i % 2 ? 1 : -1, 0, 0).applyQuaternion(_qg)
    if (t < v.puxa) {
      // flutua: sai um pouco do cartucho na direção da câmara, girando em volta de si e pulsando (a arma chamando)
      const f = sm((t - v.flutua) / Math.max(v.puxa - v.flutua, 1e-3))
      _p.lerpVectors(_de, _para, R.solta * f).addScaledVector(_lado, 0.006 * Math.sin(t * 9) * f)
      b.g.rotation.y = (t - v.flutua) * 7
      b.g.scale.setScalar(1 + 0.1 * Math.sin(t * 16) * f)
    } else {
      // puxada: acelerando para dentro da câmara, numa curva para o lado (uma para cada lado), esticando e encolhendo
      const f = (t - v.puxa) / Math.max(v.entra - v.puxa, 1e-3), de = v.puxa > v.flutua ? R.solta : 0
      _p.lerpVectors(_de, _para, de + (1 - de) * f * f).addScaledVector(_lado, R.arco * Math.sin(Math.PI * f))
      const s = 1 - 0.7 * f * f * f
      b.g.scale.set(s, s * (1 + 0.9 * Math.sin(Math.PI * f)), s)
    }
    b.g.position.copy(pai.worldToLocal(_p))
    b.g.visible = true
  })
}
