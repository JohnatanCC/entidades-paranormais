// Os efeitos no corpo da Mãe, leves para o celular (nenhuma luz nova; cada um é uma chamada de desenho, só enquanto aparece):
//   o rosto que escurece: os vértices da cabeça e do queixo escurecem no próprio material dela (no grito: rosto.ts);
//   a fase 4 (a última barra): o corpo inteiro preto e partículas brancas subindo dela (os olhos maiores: rosto.ts);
//   as ondas do grito: anéis cinzas, chapados (2D), que saem da boca para a frente e abrem até sumir.
// As ondas e as partículas ficam no mundo (não vão junto quando ela anda): ponha `grupo` na cena, fora do root dela.
import * as THREE from 'three'
import type { Mae } from './modelo'
import { EFEITOS } from './numeros'

const N_ONDAS = 10, N_PARTICULAS = 140

interface Onda { t: number; dur: number; o: THREE.Vector3; d: THREE.Vector3 }
export interface Efeitos {
  grupo: THREE.Group
  preta: { value: number } // o quanto o corpo está preto (o uniforme do material do corpo: a fase 4)
  ondas: THREE.InstancedMesh; forca: THREE.InstancedBufferAttribute; onda: Onda[]
  pontos: THREE.Points; pos: Float32Array; cor: Float32Array; vel: Float32Array; vida: Float32Array; dura: Float32Array; prox: number; acc: number
  fontes: THREE.Object3D[] // de onde as partículas saem: os ossos do corpo e os painéis da saia
}

/** Ensina o material do corpo a escurecer: o rosto (os vértices presos na cabeça e no queixo multiplicam a cor por
 *  1 − escuro; o uniforme é do rosto: rosto.ts muda) e o corpo inteiro na fase 4 (a cor final, com o reflexo junto:
 *  preta de verdade, mesmo sob luz forte). O tremor do PS1 continua (vem antes). */
function corpoQueEscurece(corpo: THREE.SkinnedMesh, ossos: THREE.Object3D[], escuro: { value: number }, preta: { value: number }) {
  const mat = corpo.material as THREE.MeshStandardMaterial
  const ossosRosto = { value: new THREE.Vector2(...ossos.map((o) => corpo.skeleton.bones.indexOf(o as THREE.Bone))) }
  const antes = mat.onBeforeCompile
  mat.onBeforeCompile = (s, r) => {
    antes.call(mat, s, r)
    s.uniforms.uEscuro = escuro; s.uniforms.uOssosRosto = ossosRosto; s.uniforms.uPreta = preta
    s.vertexShader = 'uniform float uEscuro;\nuniform vec2 uOssosRosto;\nvarying float vEscuro;\n' + s.vertexShader.replace('#include <skinning_vertex>',
      '#include <skinning_vertex>\nvEscuro = (abs(skinIndex.x - uOssosRosto.x) < 0.5 || abs(skinIndex.x - uOssosRosto.y) < 0.5) ? uEscuro : 0.0;')
    s.fragmentShader = 'uniform float uPreta;\nvarying float vEscuro;\n' + s.fragmentShader
      .replace('#include <map_fragment>', '#include <map_fragment>\ndiffuseColor.rgb *= 1.0 - vEscuro;')
      .replace('#include <opaque_fragment>', '#include <opaque_fragment>\ngl_FragColor.rgb *= 1.0 - uPreta;')
  }
  mat.customProgramCacheKey = () => 'psx-mae' // outro programa que o dos outros personagens
}

/** Monta os efeitos de uma Mãe (depois do corpo vestido). */
export function prepararEfeitos(m: Mae): Efeitos {
  const grupo = new THREE.Group(); grupo.name = 'mae-efeitos'
  const corpo = m.root.getObjectByName('#corpo') as THREE.SkinnedMesh | undefined, preta = { value: 0 }
  if (corpo) corpoQueEscurece(corpo, [m.cabeca, m.mandibula], m.rosto.escuro, preta)

  // as ondas: um anel só, desenhado várias vezes (InstancedMesh); a força (a opacidade) de cada uma num atributo
  const geo = new THREE.RingGeometry(0.8, 1, 20)
  const forca = new THREE.InstancedBufferAttribute(new Float32Array(N_ONDAS), 1)
  geo.setAttribute('aForca', forca)
  const mat = new THREE.MeshBasicMaterial({ color: EFEITOS.onda.cor, transparent: true, depthWrite: false, side: THREE.DoubleSide })
  mat.onBeforeCompile = (s) => {
    s.vertexShader = 'attribute float aForca;\nvarying float vForca;\n' + s.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvForca = aForca;')
    s.fragmentShader = 'varying float vForca;\n' + s.fragmentShader.replace('vec4 diffuseColor = vec4( diffuse, opacity );', 'vec4 diffuseColor = vec4( diffuse, opacity * vForca );')
  }
  mat.customProgramCacheKey = () => 'ondas-mae'
  const ondas = new THREE.InstancedMesh(geo, mat, N_ONDAS)
  ondas.frustumCulled = false; ondas.visible = false
  const zero = new THREE.Matrix4().makeScale(0, 0, 0)
  for (let i = 0; i < N_ONDAS; i++) ondas.setMatrixAt(i, zero)
  grupo.add(ondas)

  // as partículas da fase 4: pontos brancos quadrados (o pixel), cada um com a sua transparência (a cor RGBA)
  const pos = new Float32Array(N_PARTICULAS * 3).fill(-99), cor = new Float32Array(N_PARTICULAS * 4)
  const pg = new THREE.BufferGeometry()
  pg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); pg.setAttribute('color', new THREE.BufferAttribute(cor, 4))
  const pontos = new THREE.Points(pg, new THREE.PointsMaterial({ size: EFEITOS.fase4.tamanho, sizeAttenuation: true, vertexColors: true, transparent: true, depthWrite: false }))
  pontos.frustumCulled = false; pontos.visible = false
  grupo.add(pontos)

  const fontes = [m.quadril, m.tronco, m.peito, m.cabeca, ...m.bracos.flatMap((b) => [b.up, b.fo]), ...m.saiaRaiz, ...m.saiaRaiz]
  return {
    grupo, preta, ondas, forca, onda: Array.from({ length: N_ONDAS }, () => ({ t: 1, dur: 1, o: new THREE.Vector3(), d: new THREE.Vector3() })),
    pontos, pos, cor, vel: new Float32Array(N_PARTICULAS * 3), vida: new Float32Array(N_PARTICULAS), dura: new Float32Array(N_PARTICULAS), prox: 0, acc: 0, fontes,
  }
}

const _p = new THREE.Vector3(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _m = new THREE.Matrix4()
const FRENTE = new THREE.Vector3(0, 0, 1)

/** Uma onda do grito: sai da boca aberta, na direção do rosto. */
export function ondaDoGrito(m: Mae) {
  const E = m.efeitos
  const o = E.onda.reduce((a, b) => (b.t / b.dur > a.t / a.dur ? b : a)) // a mais velha (ou uma livre)
  m.cabeca.getWorldQuaternion(_q)
  o.o.copy(m.cabeca.localToWorld(_p.set(0, 0.02, 0.16)))
  // um tremor no rumo de cada uma: as ondas não saem todas certinhas
  o.d.set((Math.random() - 0.5) * 0.12, (Math.random() - 0.5) * 0.12, 1).normalize().applyQuaternion(_q)
  o.t = 0; o.dur = EFEITOS.onda.dura
}

/** Um quadro dos efeitos: preta = o quanto ela está na forma da fase 4 (0..1). */
export function passoEfeitos(m: Mae, preta: number, dt: number) {
  const E = m.efeitos, O = EFEITOS.onda, F = EFEITOS.fase4
  E.preta.value = F.preta * preta
  // ---------- as ondas: andam para a frente abrindo e somem ----------
  let ondas = false
  for (let i = 0; i < E.onda.length; i++) {
    const o = E.onda[i]
    if (o.t >= o.dur) continue
    o.t += dt
    const u = Math.min(1, o.t / o.dur), r = O.r0 + (O.r1 - O.r0) * (1 - (1 - u) * (1 - u))
    if (u >= 1) { E.ondas.setMatrixAt(i, _m.makeScale(0, 0, 0)); E.forca.setX(i, 0) } else {
      _p.copy(o.o).addScaledVector(o.d, O.vel * o.t)
      E.ondas.setMatrixAt(i, _m.compose(_p, _q.setFromUnitVectors(FRENTE, o.d), _s.set(r, r, r)))
      E.forca.setX(i, O.forca * (1 - u) * Math.min(1, u * 8)); ondas = true
    }
    E.ondas.instanceMatrix.needsUpdate = true; E.forca.needsUpdate = true
  }
  E.ondas.visible = ondas
  // ---------- as partículas da fase 4: nascem pelo corpo e sobem, somem devagar ----------
  E.acc += F.particulas * preta * dt
  while (E.acc >= 1) {
    E.acc -= 1
    const j = E.prox; E.prox = (E.prox + 1) % E.vida.length
    E.fontes[Math.floor(Math.random() * E.fontes.length)].getWorldPosition(_p)
    E.pos.set([_p.x + (Math.random() - 0.5) * 0.2, _p.y + (Math.random() - 0.5) * 0.25, _p.z + (Math.random() - 0.5) * 0.2], j * 3)
    E.vel.set([(Math.random() - 0.5) * 0.25, F.sobe[0] + Math.random() * (F.sobe[1] - F.sobe[0]), (Math.random() - 0.5) * 0.25], j * 3)
    E.dura[j] = E.vida[j] = F.vida[0] + Math.random() * (F.vida[1] - F.vida[0])
  }
  let vivas = false
  for (let j = 0; j < E.vida.length; j++) {
    if (E.vida[j] <= 0) continue
    E.vida[j] -= dt
    const i = j * 3, u = 1 - Math.max(0, E.vida[j]) / E.dura[j]
    E.pos[i] += E.vel[i] * dt; E.pos[i + 1] += E.vel[i + 1] * dt; E.pos[i + 2] += E.vel[i + 2] * dt
    E.vel[i] += (Math.random() - 0.5) * dt; E.vel[i + 2] += (Math.random() - 0.5) * dt // derivam, como cinza no ar
    E.cor.set([1, 1, 1, E.vida[j] > 0 ? Math.min(1, u * 6) * (1 - u) : 0], j * 4)
    if (E.vida[j] <= 0) E.pos[i + 1] = -99
    vivas = true
  }
  E.pontos.visible = vivas
  if (vivas) { E.pontos.geometry.attributes.position.needsUpdate = true; E.pontos.geometry.attributes.color.needsUpdate = true }
}
