// O som que vem de um lugar (do laboratório): a voz de um personagem sai da boca dele, no mundo, e o ouvido é a câmera
// (ouvinte(camera), a cada quadro). Cai com a distância (perto de `ref` m soa cheio) e o eco do cômodo diminui de longe.
// No computador, HRTF (dá para saber se vem de trás, de cima); no celular, equalpower (mais leve).
// Uma fonte por personagem: tudo o que ele toca entra em `entrada`.
import * as THREE from 'three'
import { som } from './sintese'

export interface Fonte { entrada: GainNode; pan: PannerNode; envio: GainNode }

const _ouvido = new THREE.Vector3(), _q = new THREE.Quaternion(), _f = new THREE.Vector3(), _c = new THREE.Vector3()
const TOQUE = typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches

/** Uma fonte nova (null enquanto o som não estiver ligado). */
export function novaFonte(ref = 1.6): Fonte | null {
  const s = som()
  if (!s) return null
  const { ctx } = s
  const entrada = ctx.createGain()
  // segura só os picos (gritos que se sobrepõem)
  const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -9; comp.ratio.value = 4; comp.attack.value = 0.004; comp.release.value = 0.2
  const pan = ctx.createPanner()
  pan.panningModel = TOQUE ? 'equalpower' : 'HRTF'; pan.distanceModel = 'inverse'; pan.refDistance = ref; pan.rolloffFactor = 1.1; pan.maxDistance = 60
  entrada.connect(comp); comp.connect(pan); pan.connect(s.saida)
  const envio = ctx.createGain(); envio.gain.value = 0.4; comp.connect(envio); envio.connect(s.eco) // o eco do cômodo
  return { entrada, pan, envio }
}

const muda = (p: AudioParam, v: number, t: number) => p.setTargetAtTime(v, t, 0.03)

/** Põe a fonte no lugar (no mundo); de longe, menos eco. */
export function moverFonte(f: Fonte, p: THREE.Vector3) {
  const s = som()
  if (!s) return
  const t = s.ctx.currentTime, P = f.pan
  if (P.positionX) { muda(P.positionX, p.x, t); muda(P.positionY, p.y, t); muda(P.positionZ, p.z, t) } else P.setPosition(p.x, p.y, p.z)
  f.envio.gain.setTargetAtTime(0.45 * Math.min(1, 1.8 / Math.max(0.5, _ouvido.distanceTo(p))), t, 0.1)
}

/** Desliga a fonte (o personagem saiu de cena). */
export function soltarFonte(f: Fonte) { f.entrada.disconnect(); f.pan.disconnect(); f.envio.disconnect() }

/** O ouvido é a câmera: chame a cada quadro, com a câmera da cena. */
export function ouvinte(camera: THREE.Camera) {
  const s = som()
  if (!s) return
  const L = s.ctx.listener, t = s.ctx.currentTime
  camera.getWorldPosition(_ouvido); camera.getWorldQuaternion(_q)
  _f.set(0, 0, -1).applyQuaternion(_q); _c.set(0, 1, 0).applyQuaternion(_q)
  if (L.positionX) {
    muda(L.positionX, _ouvido.x, t); muda(L.positionY, _ouvido.y, t); muda(L.positionZ, _ouvido.z, t)
    muda(L.forwardX, _f.x, t); muda(L.forwardY, _f.y, t); muda(L.forwardZ, _f.z, t); muda(L.upX, _c.x, t); muda(L.upY, _c.y, t); muda(L.upZ, _c.z, t)
  } else { L.setPosition(_ouvido.x, _ouvido.y, _ouvido.z); L.setOrientation(_f.x, _f.y, _f.z, _c.x, _c.y, _c.z) }
}
