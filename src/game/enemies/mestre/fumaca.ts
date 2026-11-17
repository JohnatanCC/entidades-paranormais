// A fumaça escura dentro do manto do Mestre (docs/cap2-sombra.md): uma camada de nuvens de pixel que enche o manto do
// chão até os ombros; um pouco escorre por baixo da barra. Fecha os vãos entre as tiras e esconde as pernas: ele parece
// sair da fumaça. Presa ao corpo (ao quadril): anda, deita e sobe com ele, sem ficar para trás. As nuvens: ../nuvens.ts (uma malha só).
import * as THREE from 'three'
import { novasNuvens } from '../nuvens'
import { FUMACA } from './numeros'

export interface Fumaca {
  malha: THREE.InstancedMesh
  forca: THREE.InstancedBufferAttribute; giro: THREE.InstancedBufferAttribute
  p: Float32Array; v: Float32Array; t: Float32Array; vida: Float32Array; tam: Float32Array; auge: Float32Array; rasteira: Uint8Array
}

const rnd = (a: number, b: number) => a + Math.random() * (b - a)

export function novaFumaca(): Fumaca {
  const N = FUMACA.nuvens, { malha, forca, giro } = novasNuvens(N, FUMACA.cor)
  const F: Fumaca = {
    malha, forca, giro, p: new Float32Array(N * 3), v: new Float32Array(N * 3), t: new Float32Array(N), vida: new Float32Array(N),
    tam: new Float32Array(N), auge: new Float32Array(N), rasteira: new Uint8Array(N),
  }
  // já começa cheia: cada nuvem num ponto diferente da vida
  for (let i = 0; i < N; i++) { nascer(F, i); F.t[i] = Math.random() * F.vida[i] }
  return F
}

function nascer(F: Fumaca, i: number) {
  const C = FUMACA, a = Math.random() * Math.PI * 2, rasteira = Math.random() < C.rasteira
  const r = C.raio[0] * (rasteira ? rnd(0.7, 1.05) : Math.sqrt(Math.random()) * 0.85)
  F.p[i * 3] = Math.sin(a) * r; F.p[i * 3 + 1] = rasteira ? rnd(0.04, 0.12) : rnd(0.05, C.alto * 0.85); F.p[i * 3 + 2] = Math.cos(a) * r * 0.85
  F.v[i * 3] = rasteira ? Math.sin(a) * C.escorre : 0; F.v[i * 3 + 1] = rasteira ? 0.015 : rnd(C.sobe[0], C.sobe[1]); F.v[i * 3 + 2] = rasteira ? Math.cos(a) * C.escorre : 0
  F.t[i] = 0; F.vida[i] = rnd(C.vida[0], C.vida[1]); F.rasteira[i] = rasteira ? 1 : 0
  F.tam[i] = rnd(C.tamanho[0], C.tamanho[1]) * (rasteira ? 1.25 : 1); F.auge[i] = rnd(C.forca[0], C.forca[1]) * (rasteira ? 0.6 : 1)
  F.giro.array[i] = Math.floor(Math.random() * 4) * (Math.PI / 2); F.giro.needsUpdate = true // de pixel: só de quarto em quarto de volta
}

const _m = new THREE.Matrix4()

/** Um quadro da fumaça (no espaço do corpo: y = 0 é o chão). denso = o quanto ela engrossa (0 a 1: a luz nele). */
export function passoFumaca(F: Fumaca, dt: number, denso = 0) {
  const C = FUMACA, N = C.nuvens
  const giro = C.gira * dt, cg = Math.cos(giro), sg = Math.sin(giro)
  for (let i = 0; i < N; i++) {
    const k = i * 3
    if ((F.t[i] += dt) >= F.vida[i]) nascer(F, i)
    let x = F.p[k] + F.v[k] * dt, y = F.p[k + 1] + F.v[k + 1] * dt, z = F.p[k + 2] + F.v[k + 2] * dt
    if (!F.rasteira[i]) {
      // gira devagar em volta do corpo e fecha com a altura, para ficar dentro do manto (que afina para cima)
      const gx = x * cg + z * sg, gz = -x * sg + z * cg, h = Math.min(1, y / C.alto), lim = C.raio[0] + (C.raio[1] - C.raio[0]) * h, r = Math.hypot(gx, gz)
      const f = r > lim ? lim / r : 1
      x = gx * f; z = gz * f
      if (y > C.cintura && z > C.frente) z = C.frente // acima da cintura, atrás da frente do corpo
      if (y > C.alto) F.t[i] = Math.max(F.t[i], F.vida[i] - C.sai) // chegou nos ombros: some
    }
    F.p[k] = x; F.p[k + 1] = y; F.p[k + 2] = z
    const t = F.t[i], resta = F.vida[i] - t, vida = t / F.vida[i]
    F.forca.array[i] = Math.min(1, F.auge[i] * (1 + denso * 0.5)) * Math.min(1, t / C.entra) * Math.max(0, Math.min(1, resta / C.sai))
    const s = F.tam[i] * (1 + (C.cresce - 1) * vida) * (1 + denso * 0.3)
    F.malha.setMatrixAt(i, _m.makeScale(s, s, s).setPosition(x, y, z))
  }
  F.malha.instanceMatrix.needsUpdate = true; F.forca.needsUpdate = true
}

export function descartarFumaca(F: Fumaca) { F.malha.geometry.dispose(); (F.malha.material as THREE.Material).dispose() }
