// Lê um modelo do Blockbench (.bbmodel, modelo genérico) e monta os grupos e os blocos em three, sem exportar nada:
// o desenvolvedor salva o .bbmodel em modelos/ e o jogo usa direto (no npm run dev, salvar já atualiza).
// Cada pasta do Blockbench vira um THREE.Group com o nome dela, com o ponto de giro na junta; os blocos de cada pasta
// viram uma malha só (o detalhe não multiplica as chamadas de desenho).
// Escala: 32 unidades do Blockbench = 1 m (a textura fica com 32 px por metro, como o cenário). Frente = +z.
// Só o que os personagens usam: blocos (com giro e inflar), pastas (com giro) e a primeira textura.
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { applyPsx } from './psx'

export const UNIDADE = 1 / 32 // metros por unidade do Blockbench

type V3 = [number, number, number]
interface Face { uv: [number, number, number, number]; texture?: number | null }
interface Bloco { uuid: string; name: string; type?: string; from: V3; to: V3; origin?: V3; rotation?: V3; inflate?: number; faces: Record<string, Face>; visibility?: boolean }
interface Pasta { uuid: string; name: string; origin: V3; rotation?: V3; children: (string | Pasta)[]; visibility?: boolean }
export interface BBModel {
  meta: { model_format: string }
  resolution: { width: number; height: number }
  elements: Bloco[]
  outliner: (string | Pasta)[]
  textures: { source: string; uv_width?: number; uv_height?: number; width?: number; height?: number }[]
}

// os modelos da pasta modelos/ (o texto de cada arquivo; o Vite recarrega quando um muda)
const ARQUIVOS = import.meta.glob('/modelos/*.bbmodel', { query: '?raw', import: 'default', eager: true }) as Record<string, string>

export function arquivoModelo(nome: string): BBModel {
  const txt = ARQUIVOS[`/modelos/${nome}.bbmodel`]
  if (!txt) throw new Error(`Não achei modelos/${nome}.bbmodel`)
  return JSON.parse(txt) as BBModel
}

// a ordem das faces na BoxGeometry do three: +x, −x, +y, −y, +z, −z
const FACES = ['east', 'west', 'up', 'down', 'south', 'north']
const rad = (v: number) => (v * Math.PI) / 180
const vec = (v: V3) => new THREE.Vector3(v[0], v[1], v[2]).multiplyScalar(UNIDADE)

function textura(src: string) {
  const img = new Image(); img.src = src
  const t = new THREE.Texture(img)
  img.onload = () => { t.needsUpdate = true }
  // de perto o pixel duro; de longe as versões reduzidas (senão o desenho "formiga" com a câmera)
  t.magFilter = THREE.NearestFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.colorSpace = THREE.SRGBColorSpace
  return t
}

/** Monta o modelo: a raiz, as pastas (as juntas, pelo nome) e os blocos (um marcador no centro de cada um, pelo nome). */
export function montarBB(bb: BBModel): { raiz: THREE.Group; pastas: Map<string, THREE.Group>; blocos: Map<string, THREE.Object3D>; material: THREE.Material } {
  const tex = bb.textures[0]
  const W = tex?.uv_width ?? bb.resolution.width, H = tex?.uv_height ?? bb.resolution.height
  const material = applyPsx(new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.9, ...(tex ? { map: textura(tex.source) } : {}) }))
  const porId = new Map(bb.elements.map((e) => [e.uuid, e]))
  const pastas = new Map<string, THREE.Group>(), blocos = new Map<string, THREE.Object3D>()

  const _m = new THREE.Matrix4(), _r = new THREE.Matrix4()
  /** A geometria de um bloco já no espaço da pasta (pai = a origem da pasta), com o UV das faces. */
  function geoBloco(e: Bloco, pai: V3): THREE.BufferGeometry {
    const inf = e.inflate ?? 0, o: V3 = e.origin ?? [0, 0, 0]
    const tam: V3 = [e.to[0] - e.from[0] + 2 * inf, e.to[1] - e.from[1] + 2 * inf, e.to[2] - e.from[2] + 2 * inf]
    const geo = new THREE.BoxGeometry(tam[0] * UNIDADE, tam[1] * UNIDADE, tam[2] * UNIDADE)
    // cada face: o canto de cima à esquerda (visto de fora) recebe (u1, v1), como no Blockbench
    const uv = geo.attributes.uv as THREE.BufferAttribute
    FACES.forEach((nome, i) => {
      const f = e.faces[nome]
      if (!f) return
      const [u1, v1, u2, v2] = f.uv
      const cantos = [[u1, v1], [u2, v1], [u1, v2], [u2, v2]]
      cantos.forEach(([u, v], k) => uv.setXY(i * 4 + k, u / W, 1 - v / H))
    })
    const c = vec([(e.from[0] + e.to[0]) / 2, (e.from[1] + e.to[1]) / 2, (e.from[2] + e.to[2]) / 2])
    if (!e.rotation || e.rotation.every((r) => r === 0)) return geo.applyMatrix4(_m.makeTranslation(c.sub(vec(pai))))
    // girado: o giro é em volta da origem do bloco
    const org = vec(o)
    _m.makeTranslation(c.sub(org))
    _r.makeRotationFromEuler(new THREE.Euler(rad(e.rotation[0]), rad(e.rotation[1]), rad(e.rotation[2]), 'ZYX'))
    return geo.applyMatrix4(_r.multiply(_m)).applyMatrix4(_m.makeTranslation(org.sub(vec(pai))))
  }

  // os blocos de cada pasta viram UMA malha (uma chamada de desenho por junta, não por bloco); cada bloco deixa um
  // marcador vazio no centro dele, para o código achar a peça pelo nome (a mochila, por exemplo)
  function pasta(p: Pasta, pai: V3): THREE.Group {
    const g = new THREE.Group()
    g.name = p.name
    g.position.copy(vec([p.origin[0] - pai[0], p.origin[1] - pai[1], p.origin[2] - pai[2]]))
    if (p.rotation) g.rotation.set(rad(p.rotation[0]), rad(p.rotation[1]), rad(p.rotation[2]), 'ZYX')
    const geos: THREE.BufferGeometry[] = []
    for (const c of p.children) {
      const filho = typeof c === 'string' ? porId.get(c) : c
      if (!filho || filho.visibility === false) continue
      if (typeof c === 'string') {
        const e = filho as Bloco
        geos.push(geoBloco(e, p.origin))
        const marca = new THREE.Object3D(); marca.name = e.name
        marca.position.copy(vec([(e.from[0] + e.to[0]) / 2 - p.origin[0], (e.from[1] + e.to[1]) / 2 - p.origin[1], (e.from[2] + e.to[2]) / 2 - p.origin[2]]))
        g.add(marca); if (!blocos.has(e.name)) blocos.set(e.name, marca)
      } else { const o = pasta(filho as Pasta, p.origin); if (!pastas.has(o.name)) pastas.set(o.name, o); g.add(o) }
    }
    if (geos.length) {
      const junta = mergeGeometries(geos)
      geos.forEach((x) => x.dispose())
      const malha = new THREE.Mesh(junta, material); malha.name = p.name + '#malha'
      g.add(malha)
    }
    return g
  }

  const raiz = pasta({ uuid: 'raiz-arquivo', name: '', origin: [0, 0, 0], children: bb.outliner }, [0, 0, 0])
  return { raiz, pastas, blocos, material }
}
