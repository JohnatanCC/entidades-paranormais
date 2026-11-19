// A lamparina do agente (18/nov; docs/cap2-sombra.md, "A lamparina"): a armadilha reformulada. Fica pendurada na
// cintura, do lado esquerdo, sempre acesa, iluminando em volta (uma luz amarelada, de alcance médio). Segurando C, a mão
// esquerda pega e ergue a lamparina para a frente, na altura do ombro: a luz fica mais forte e sai um feixe (2D, macio
// como o luar das janelas) para a frente; o feixe afasta o Mestre (game/entidades). Solta o C, ela volta para a cintura.
// O modelo é modelos/armas/lamparina.bbmodel (a pasta "empunhadura" é a alça). Ela balança pela alça (um pêndulo) na
// cintura e na mão. A luz não é uma luz do three: entra na conta da luz assada de cada material (render/assada.ts,
// LAMPARINA), a única luz que anda. Os números em numeros.ts (LAMPARINA).
import * as THREE from 'three'
import { LAMPARINA as LUZ } from '../../render/assada'
import { aplicarBrilho } from '../../render/brilho'
import { arma3d } from '../../render/objetos3d'
import { maoEm, POLO_E } from './arma'
import type { Agente } from './modelo'
import { LAMPARINA } from './numeros'

/** g = a lamparina (o pivô na alça), filha do root do agente; vidro = o material do vidro (só desta cópia); feixe = o
 *  cone de luz; ergue = o quanto está erguida (0..1); bob/ant = o peso do pêndulo (no mundo); pos e dir = de onde sai a
 *  luz e para onde vai o feixe (no mundo: a inteligência dos fantasmas lê). */
export interface Lamparina {
  g: THREE.Group; vidro: THREE.MeshBasicMaterial | null; feixe: THREE.Mesh; ergue: number
  bob: THREE.Vector3; ant: THREE.Vector3; solta: boolean; t: number
  pos: THREE.Vector3; dir: THREE.Vector3
}

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z)
const CINTO = V(...LAMPARINA.cinto) // onde a alça fica presa (no espaço do quadril)
const NA_MAO = V(0, -0.085, 0.03) // onde a alça fica na mão esquerda (no espaço da mão: presa nos dedos)
const ERGUIDA = V(...LAMPARINA.erguida) // onde a alça vai erguida (no espaço do peito)
// a mão esquerda erguida: os dedos para a frente, a palma para baixo, fechada na alça (no espaço do peito)
const MAO = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(V(-1, 0, 0), V(0, 0, -1), V(0, -1, 0)))
const COR = new THREE.Color(LAMPARINA.cor)

// o feixe: um cone aberto, a ponta na lamparina e a boca à frente; macio nas laterais (some de lado), forte perto da
// lamparina e apagando no fim; não ofusca de perto (a câmera atrás do ombro)
function novoFeixe(): THREE.Mesh {
  const F = LAMPARINA.feixe, r = Math.tan(F.abre) * F.alcance
  const geo = new THREE.ConeGeometry(r, F.alcance, 20, 1, true).translate(0, -F.alcance / 2, 0).rotateX(-Math.PI / 2)
  const mat = new THREE.ShaderMaterial({
    uniforms: { uK: { value: 0 }, uLen: { value: F.alcance }, uCol: { value: COR.clone() } },
    vertexShader: `uniform float uLen; varying float vV; varying vec3 vN, vVw;
      void main() { vV = position.z / uLen; vec4 w = modelMatrix * vec4(position, 1.0); vN = normalize(mat3(modelMatrix) * normal); vVw = cameraPosition - w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: `uniform float uK; uniform vec3 uCol; varying float vV; varying vec3 vN, vVw;
      void main() {
        float dist = length(vVw); vec3 Vd = vVw / dist;
        float face = pow(abs(dot(normalize(vN), Vd)), 1.2);
        float along = (1.0 - vV) * (1.0 - vV) * smoothstep(0.0, 0.06, vV);
        float near = smoothstep(0.4, 2.0, dist);
        gl_FragColor = vec4(uCol * ${LAMPARINA.feixe.brilho.toFixed(3)} * face * along * near * uK, 1.0);
      }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  })
  const m = new THREE.Mesh(geo, mat)
  m.name = 'feixe-lamparina'; m.frustumCulled = false; m.visible = false; m.renderOrder = 6
  return m
}

/** Monta a lamparina na cintura do agente (a.lamparina). */
export function montarLamparina(a: Agente): Lamparina {
  const obj = arma3d('lamparina')
  obj.updateMatrixWorld(true)
  const pega = obj.getObjectByName('empunhadura')
  if (pega) obj.position.copy(pega.getWorldPosition(new THREE.Vector3())).negate() // a alça na origem do grupo
  const g = new THREE.Group(); g.name = 'lamparina'
  g.scale.setScalar(LAMPARINA.tamanho)
  g.add(obj)
  // o vidro respira: um material só desta cópia
  const luz = obj.getObjectByName('#luz') as THREE.Mesh | undefined
  let vidro: THREE.MeshBasicMaterial | null = null
  if (luz) { vidro = aplicarBrilho((luz.material as THREE.MeshBasicMaterial).clone()); luz.material = vidro }
  const feixe = novoFeixe()
  a.root.add(g, feixe)
  const L: Lamparina = { g, vidro, feixe, ergue: 0, bob: new THREE.Vector3(), ant: new THREE.Vector3(), solta: true, t: 0, pos: new THREE.Vector3(), dir: new THREE.Vector3(0, 0, 1) }
  a.lamparina = L
  return L
}

/** Tira a lamparina (saiu do jogo): a luz apaga em todos os materiais. */
export function descartarLamparina(a: Agente) {
  const L = a.lamparina
  if (!L) return
  L.g.removeFromParent(); L.feixe.removeFromParent()
  L.vidro?.dispose(); L.feixe.geometry.dispose(); (L.feixe.material as THREE.Material).dispose()
  LUZ.cor.value.set(0, 0, 0); LUZ.feixeCor.value.set(0, 0, 0)
  a.lamparina = null
}

/** O braço esquerdo ergue a lamparina (depois da pose do corpo e das armas, antes das mãos). quer = segurando C;
 *  solto = 1 − o quanto está na cambalhota. Devolve o quanto ela está erguida (a mão esquerda fecha na alça). */
export function erguerLamparina(a: Agente, quer: boolean, solto: number, dt: number): number {
  const L = a.lamparina
  if (!L) return 0
  const E = LAMPARINA.erguer
  L.ergue += ((quer ? 1 : 0) - L.ergue) * (1 - Math.exp(-(quer ? E.sobe : E.desce) * dt))
  const k = L.ergue * solto
  maoEm(a.arms[1], ERGUIDA, MAO, NA_MAO, POLO_E, k)
  return k
}

const _cinto = new THREE.Vector3(), _mao = new THREE.Vector3(), _piv = new THREE.Vector3(), _dir = new THREE.Vector3(), _vel = new THREE.Vector3()
const _q = new THREE.Quaternion(), _f = new THREE.Vector3()
const BAIXO = new THREE.Vector3(0, -1, 0)

/** Depois de toda a pose: a lamparina vai da cintura para a mão (o quanto está erguida), balança pela alça, o vidro
 *  respira; a luz e o feixe vão para onde ela está. */
export function animarLamparina(a: Agente, dt: number) {
  const L = a.lamparina
  if (!L || dt <= 0) return
  const P = LAMPARINA.pendulo, k = L.ergue
  L.t += dt
  a.root.updateMatrixWorld(true)
  // a alça: entre o cinto e a mão (a mão chega na alça antes de erguer de todo)
  a.pelvis.localToWorld(_cinto.copy(CINTO))
  a.arms[1].hd.localToWorld(_mao.copy(NA_MAO))
  _piv.lerpVectors(_cinto, _mao, Math.min(1, k * 1.6))
  // o pêndulo (Verlet): o peso continua no embalo (amortecido) e a gravidade puxa; preso à alça pelo comprimento
  const comp = P.comprimento * LAMPARINA.tamanho
  if (L.solta || L.bob.distanceToSquared(_piv) > 1) { L.bob.copy(_piv).addScaledVector(BAIXO, comp); L.ant.copy(L.bob); L.solta = false }
  _vel.subVectors(L.bob, L.ant).multiplyScalar(Math.exp(-P.amortece * dt))
  L.ant.copy(L.bob)
  L.bob.add(_vel).addScaledVector(BAIXO, 9.8 * dt * dt)
  _dir.subVectors(L.bob, _piv).normalize()
  if (_dir.angleTo(BAIXO) > P.limite) _dir.lerp(BAIXO, 1 - P.limite / _dir.angleTo(BAIXO)).normalize()
  L.bob.copy(_piv).addScaledVector(_dir, comp)
  // no root do agente: a alça no lugar e o "para baixo" da lamparina apontando para o peso
  L.g.position.copy(a.root.worldToLocal(_cinto.copy(_piv)))
  a.root.getWorldQuaternion(_q).invert()
  L.g.quaternion.setFromUnitVectors(BAIXO, _dir.applyQuaternion(_q))
  // o vidro respira devagar; erguida, acende mais
  if (L.vidro) { const B = LAMPARINA.brilho; L.vidro.color.setScalar(B.minimo + (1 - B.minimo) * (0.5 + 0.5 * Math.sin((L.t / B.volta) * Math.PI * 2)) + B.erguida * k) }
  // a luz: no vidro (o peso do pêndulo), um pouco à frente (para iluminar o caminho e não estourar no casaco)
  const C = LAMPARINA.luz, F = LAMPARINA.feixe
  _f.set(Math.sin(a.root.rotation.y), 0, Math.cos(a.root.rotation.y))
  L.pos.copy(L.bob).addScaledVector(_f, C.frente)
  L.dir.copy(_f).setY(F.desce).normalize()
  const forca = C.forca + (C.erguida - C.forca) * k
  LUZ.pos.value.set(L.pos.x, L.pos.y, L.pos.z, C.alcance + (C.alcanceErguida - C.alcance) * k)
  LUZ.cor.value.set(COR.r * forca, COR.g * forca, COR.b * forca)
  LUZ.feixe.value.set(L.dir.x, L.dir.y, L.dir.z, Math.cos(F.abre))
  LUZ.feixeCor.value.set(COR.r * F.forca * k, COR.g * F.forca * k, COR.b * F.forca * k)
  LUZ.feixeAlcance.value = F.alcance
  // o feixe que se vê: sai do vidro, para a frente do corpo
  L.feixe.visible = k > 0.02
  if (L.feixe.visible) {
    L.feixe.position.copy(a.root.worldToLocal(_cinto.copy(L.bob)))
    L.feixe.rotation.set(-F.desce, 0, 0)
    ;(L.feixe.material as THREE.ShaderMaterial).uniforms.uK.value = k
  }
}
