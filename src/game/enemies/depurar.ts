// A vista de depuração da luta (só no npm run dev; pedida em 12/nov): F2 mostra a barra de vida em cima de cada demônio
// (e de cada tentáculo das costas do chefe) e F4 mostra as caixas de acerto (onde a bala pega), em arame.
// Leve: as caixas são uma malha de linhas só (refeita a cada quadro, só quando ligada) e as barras, cópias de um plano.
import * as THREE from 'three'
import type { Alvejavel } from '../weapons/bala'

const MAX_CAIXAS = 64, MAX_BARRAS = 32
const BARRA = { largura: 0.9, altura: 0.08 } // m

/** Uma barra: onde fica (o meio, no mundo), quanto de vida resta (0..1) e a largura (m; o chefe, maior). */
export interface BarraDeVida { p: THREE.Vector3; f: number; largura?: number }

export interface Depurar { grupo: THREE.Group; linhas: THREE.LineSegments; barras: THREE.InstancedMesh; caixas: boolean; vidas: boolean }

export function novaDepuracao(): Depurar {
  const grupo = new THREE.Group(); grupo.name = 'depurar'
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(MAX_CAIXAS * 24 * 3), 3))
  const linhas = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: '#7dff9a', depthTest: false, transparent: true, opacity: 0.85 }))
  linhas.frustumCulled = false; linhas.renderOrder = 999; linhas.visible = false
  // as barras: o fundo escuro e o que resta, cada uma uma cópia do mesmo plano (por cima de tudo)
  const barras = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ depthTest: false, transparent: true, toneMapped: false }), MAX_BARRAS * 2)
  barras.frustumCulled = false; barras.renderOrder = 1000; barras.visible = false
  for (let i = 0; i < MAX_BARRAS * 2; i++) barras.setColorAt(i, new THREE.Color(i % 2 ? '#e2453a' : '#1a1512'))
  grupo.add(linhas, barras)
  return { grupo, linhas, barras, caixas: false, vidas: false }
}

// as 12 arestas de uma caixa: os pares de cantos (os cantos: bit 0 = x, bit 1 = y, bit 2 = z)
const ARESTAS = [0, 1, 2, 3, 4, 5, 6, 7, 0, 2, 1, 3, 4, 6, 5, 7, 0, 4, 1, 5, 2, 6, 3, 7]
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _p = new THREE.Vector3(), _x = new THREE.Vector3()
const ZERO = new THREE.Matrix4().makeScale(0, 0, 0)

/** A cada quadro: desenha o que estiver ligado (as caixas dos alvos e as barras), viradas para a câmera. */
export function desenharDepuracao(D: Depurar, alvos: Alvejavel[], vidas: BarraDeVida[], camera: THREE.Camera) {
  D.linhas.visible = D.caixas
  if (D.caixas) {
    const pos = D.linhas.geometry.attributes.position as THREE.BufferAttribute, n = Math.min(alvos.length, MAX_CAIXAS)
    for (let i = 0; i < n; i++) {
      const { c, m } = alvos[i]
      ARESTAS.forEach((k, j) => pos.setXYZ(i * 24 + j, c.x + (k & 1 ? m.x : -m.x), c.y + (k & 2 ? m.y : -m.y), c.z + (k & 4 ? m.z : -m.z)))
    }
    pos.needsUpdate = true
    D.linhas.geometry.setDrawRange(0, n * 24)
  }
  D.barras.visible = D.vidas
  if (D.vidas) {
    camera.getWorldQuaternion(_q)
    _x.set(1, 0, 0).applyQuaternion(_q) // a direita da tela, no mundo
    for (let i = 0; i < MAX_BARRAS; i++) {
      const b = vidas[i]
      if (!b) { D.barras.setMatrixAt(i * 2, ZERO); D.barras.setMatrixAt(i * 2 + 1, ZERO); continue }
      const L = b.largura ?? BARRA.largura, f = Math.max(0, Math.min(1, b.f))
      D.barras.setMatrixAt(i * 2, _m.compose(b.p, _q, _s.set(L + 0.04, BARRA.altura + 0.04, 1)))
      _p.copy(b.p).addScaledVector(_x, -(L * (1 - f)) / 2) // o que resta encosta na esquerda
      D.barras.setMatrixAt(i * 2 + 1, f > 0 ? _m.compose(_p, _q, _s.set(L * f, BARRA.altura, 1)) : ZERO)
    }
    D.barras.instanceMatrix.needsUpdate = true
  }
}
