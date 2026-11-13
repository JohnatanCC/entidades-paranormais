// O tremor da tela (pedido em 13/nov): quando algo grande acontece perto (o Devora almas entrando e saindo do chão, a
// investida com os espinhos, o tombo dele), a câmera treme. Quem causa chama tremerDe(onde, força, duração); a força
// cai com a distância da câmera e some longe. O Testar aplica o tremor depois de pôr a câmera no lugar (aplicarTremor):
// um deslocamento pequeno e um giro de leve, que somem até o fim. Vários juntos: vale o mais forte.
// Os números em numeros.ts (TREMOR).
import * as THREE from 'three'
import { TREMOR } from './numeros'

const T = { forca: 0, t: 0, dura: 1, fase: 0 }
const _cam = new THREE.Vector3() // onde a câmera estava no último quadro (para a distância)

/** Treme a tela (força: TREMOR.leve, medio, forte; dura s), com a força caindo com a distância de `onde` à câmera. */
export function tremerDe(onde: THREE.Vector3, forca: number, dura: number) {
  const k = Math.max(0, 1 - onde.distanceTo(_cam) / TREMOR.longe)
  const f = forca * k
  if (f <= 0) return
  const agora = T.t > 0 ? T.forca * (T.t / T.dura) : 0
  if (f >= agora) { T.forca = f; T.t = T.dura = dura }
}

/** Depois de pôr a câmera no lugar, a cada quadro: o tremor de agora (some até o fim da duração). */
export function aplicarTremor(cam: THREE.Camera, dt: number) {
  _cam.copy(cam.position)
  if (T.t <= 0) return
  T.t = Math.max(0, T.t - dt); T.fase += dt
  const a = T.forca * (T.t / T.dura) ** 1.5, f = T.fase * TREMOR.rapidez
  // um ruído suave (senos que não se repetem juntos) em cada eixo, e o giro de leve
  cam.position.x += a * (Math.sin(f * 1.0) + 0.5 * Math.sin(f * 2.3 + 1.1))
  cam.position.y += a * (Math.sin(f * 1.3 + 2.0) + 0.5 * Math.sin(f * 2.9 + 0.4))
  cam.position.z += a * (Math.sin(f * 0.9 + 4.0) + 0.5 * Math.sin(f * 2.1 + 2.7))
  cam.rotateZ(a * TREMOR.giro * Math.sin(f * 1.7 + 0.8))
}

/** A força do tremor de agora (m; 0 = parado): para as provas e quem quiser saber. */
export const tremendo = () => (T.t > 0 ? T.forca * (T.t / T.dura) ** 1.5 : 0)
