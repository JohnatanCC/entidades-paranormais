// Lê um modelo do Blockbench (.bbmodel, modelo genérico) e monta os grupos e os blocos em three, sem exportar nada:
// o desenvolvedor salva o .bbmodel em modelos/ e o jogo usa direto (no npm run dev, salvar já atualiza).
// Cada pasta do Blockbench vira um THREE.Group com o nome dela, com o ponto de giro na junta; os blocos de cada pasta
// viram uma malha só (o detalhe não multiplica as chamadas de desenho). Os personagens (pele: true) vão além: o corpo
// inteiro vira UMA malha com ossos (cada bloco preso à sua pasta; vestir), uma chamada de desenho por personagem.
// Escala: 32 unidades do Blockbench = 1 m. Frente = +z. Os arquivos: modelos/<nome>.bbmodel (personagens) e
// modelos/objetos/<tipo>.bbmodel (o catálogo de objetos), pedidos pelo caminho sem a extensão ("objetos/cadeira").
// Bloco com nome começando em "luz_" (a chama, a lâmpada, a tela) brilha sozinho: vai numa malha "#luz" à parte.
// Só o que os modelos usam: blocos (com giro e inflar), pastas (com giro) e a primeira textura.
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { aplicarCorte } from './corte'
import { aplicarContorno } from './contorno'
import { aplicarBrilho } from './brilho'
import { aplicarLuzObjeto } from './assada'

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

// Os modelos da pasta modelos/ e das de dentro. No jogo publicado, cada arquivo é um pedaço separado do pacote, baixado
// só quando uma tela que usa modelos abre (carregarModelos): o menu abre leve. No npm run dev vêm todos juntos, já
// carregados, e salvar no Blockbench atualiza na hora (o Vite recarrega o módulo).
const AO_VIVO = import.meta.env.DEV ? (import.meta.glob('/modelos/**/*.bbmodel', { query: '?raw', import: 'default', eager: true }) as Record<string, string>) : null
const FONTES = import.meta.glob('/modelos/**/*.bbmodel', { query: '?raw', import: 'default' }) as Record<string, () => Promise<string>>
const ARQUIVOS: Record<string, string> = AO_VIVO ? { ...AO_VIVO } : {}
let baixando: Promise<void> | null = AO_VIVO ? Promise.resolve() : null

/** Os modelos estão na memória? (no npm run dev, sempre) */
export const modelosProntos = () => Object.keys(ARQUIVOS).length === Object.keys(FONTES).length
/** Baixa os modelos que faltam (uma vez só; as próximas chamadas devolvem a mesma promessa). */
export function carregarModelos(): Promise<void> {
  return (baixando ??= Promise.all(Object.entries(FONTES).map(async ([k, f]) => { ARQUIVOS[k] = await f() })).then(() => undefined))
}

export const existeModelo = (nome: string) => `/modelos/${nome}.bbmodel` in FONTES

export function arquivoModelo(nome: string): BBModel {
  const txt = ARQUIVOS[`/modelos/${nome}.bbmodel`]
  if (!txt) throw new Error(`modelos/${nome}.bbmodel ${existeModelo(nome) ? 'ainda não foi carregado (carregarModelos)' : 'não existe'}`)
  return JSON.parse(txt) as BBModel
}

// a ordem das faces na BoxGeometry do three: +x, −x, +y, −y, +z, −z
const FACES = ['east', 'west', 'up', 'down', 'south', 'north']
const rad = (v: number) => (v * Math.PI) / 180
const vec = (v: V3) => new THREE.Vector3(v[0], v[1], v[2]).multiplyScalar(UNIDADE)

// as texturas carregando: quem precisa delas prontas (a foto do catálogo) espera o aviso
let carregando = 0
const avisos = new Set<() => void>()
export const texturasCarregando = () => carregando > 0
/** Chama f quando todas as texturas que estavam carregando ficarem prontas. Devolve como desligar o aviso. */
export function quandoCarregar(f: () => void) { avisos.add(f); return () => { avisos.delete(f) } }

function textura(src: string) {
  const img = new Image()
  const t = new THREE.Texture(img)
  carregando++
  img.onload = img.onerror = () => { t.needsUpdate = true; if (--carregando === 0) avisos.forEach((f) => f()) }
  img.src = src
  // de perto o pixel duro; de longe as versões reduzidas (senão o desenho "formiga" com a câmera)
  t.magFilter = THREE.NearestFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.colorSpace = THREE.SRGBColorSpace
  return t
}

/**
 * Monta o modelo: a raiz, as pastas (as juntas, pelo nome) e os blocos (um marcador no centro de cada um, pelo nome).
 * inflar (unidades) engorda todos os blocos: é a "casca" do contorno de seleção do editor (sem textura nem luz).
 * corte: o material obedece o corte das paredes do editor (as portas e janelas, que ficam na parede).
 */
export interface MontadoBB { raiz: THREE.Group; pastas: Map<string, THREE.Group>; blocos: Map<string, THREE.Object3D>; material: THREE.Material; luz: THREE.Material }
export function montarBB(bb: BBModel, opc: { inflar?: number; corte?: boolean; pele?: boolean } = {}): MontadoBB {
  const tex = bb.textures[0], mapa = tex && !opc.inflar ? textura(tex.source) : undefined
  const W = tex?.uv_width ?? bb.resolution.width, H = tex?.uv_height ?? bb.resolution.height
  // todo modelo usa a luz assada do lugar onde está (render/assada.ts); a casca do contorno do editor não tem luz
  const cru = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.9, ...(mapa ? { map: mapa } : {}) })
  const base = opc.inflar ? cru : aplicarLuzObjeto(cru)
  // os personagens (pele) ganham o contorno de luz do jogo; as portas e janelas, o corte das paredes do editor
  const material = opc.corte ? aplicarCorte(base) : opc.pele ? aplicarContorno(base) : base
  const luz = aplicarBrilho(new THREE.MeshBasicMaterial({ color: '#ffffff', ...(mapa ? { map: mapa } : {}) }))
  const porId = new Map(bb.elements.map((e) => [e.uuid, e]))
  const pastas = new Map<string, THREE.Group>(), blocos = new Map<string, THREE.Object3D>()

  const _m = new THREE.Matrix4(), _r = new THREE.Matrix4()
  /** A geometria de um bloco já no espaço da pasta (pai = a origem da pasta), com o UV das faces. */
  function geoBloco(e: Bloco, pai: V3): THREE.BufferGeometry {
    const inf = (e.inflate ?? 0) + (opc.inflar ?? 0), o: V3 = e.origin ?? [0, 0, 0]
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
    const geos: THREE.BufferGeometry[] = [], geosLuz: THREE.BufferGeometry[] = []
    for (const c of p.children) {
      const filho = typeof c === 'string' ? porId.get(c) : c
      if (!filho || filho.visibility === false) continue
      if (typeof c === 'string') {
        const e = filho as Bloco
        ;(e.name.startsWith('luz_') && !opc.inflar ? geosLuz : geos).push(geoBloco(e, p.origin))
        const marca = new THREE.Object3D(); marca.name = e.name
        marca.position.copy(vec([(e.from[0] + e.to[0]) / 2 - p.origin[0], (e.from[1] + e.to[1]) / 2 - p.origin[1], (e.from[2] + e.to[2]) / 2 - p.origin[2]]))
        g.add(marca); if (!blocos.has(e.name)) blocos.set(e.name, marca)
      } else { const o = pasta(filho as Pasta, p.origin); if (!pastas.has(o.name)) pastas.set(o.name, o); g.add(o) }
    }
    for (const [lista, mat, nome] of [[geos, material, '#malha'], [geosLuz, luz, '#luz']] as const) {
      if (!lista.length) continue
      const junta = mergeGeometries(lista)
      lista.forEach((x) => x.dispose())
      // personagem: a geometria fica guardada na pasta (no espaço dela) para vestir juntar tudo numa malha com ossos
      if (opc.pele) { g.userData[nome === '#luz' ? 'geoLuz' : 'geo'] = junta; continue }
      const malha = new THREE.Mesh(junta, mat); malha.name = (nome === '#luz' ? '#luz' : p.name + nome)
      malha.castShadow = malha.receiveShadow = nome !== '#luz' && !opc.inflar // as sombras do nível Alto (o que acende não faz nem recebe)
      g.add(malha)
    }
    return g
  }

  const raiz = pasta({ uuid: 'raiz-arquivo', name: '', origin: [0, 0, 0], children: bb.outliner }, [0, 0, 0])
  return { raiz, pastas, blocos, material, luz }
}

/**
 * Veste o personagem montado com pele: os blocos de todas as pastas debaixo de `corpo` viram uma malha com ossos (e
 * outra para os blocos "luz_", que brilham), presas em `corpo`. Cada pasta é o osso dos próprios blocos, ou o que
 * `ossoDe` disser (o Matheus prende o tronco no peito, que gira por dentro dele). Chame com o corpo na pose do arquivo.
 */
export function vestir(corpo: THREE.Object3D, m: MontadoBB, ossoDe: Record<string, THREE.Object3D> = {}): THREE.SkinnedMesh[] {
  corpo.updateMatrixWorld(true)
  const inv = new THREE.Matrix4().copy(corpo.matrixWorld).invert(), _mt = new THREE.Matrix4()
  const ossos: THREE.Object3D[] = [], indice = new Map<THREE.Object3D, number>()
  const partes: Record<'geo' | 'geoLuz', THREE.BufferGeometry[]> = { geo: [], geoLuz: [] }
  corpo.traverse((g) => {
    for (const k of ['geo', 'geoLuz'] as const) {
      const geo = g.userData[k] as THREE.BufferGeometry | undefined
      if (!geo) continue
      const osso = ossoDe[g.name] ?? g
      if (!indice.has(osso)) { indice.set(osso, ossos.length); ossos.push(osso) }
      const i = indice.get(osso)!, n = geo.attributes.position.count
      const c = geo.clone().applyMatrix4(_mt.multiplyMatrices(inv, g.matrixWorld)) // no espaço do corpo, na pose do arquivo
      c.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(new Uint16Array(n * 4).map((_, j) => (j % 4 === 0 ? i : 0)), 4))
      c.setAttribute('skinWeight', new THREE.Float32BufferAttribute(new Float32Array(n * 4).map((_, j) => (j % 4 === 0 ? 1 : 0)), 4))
      partes[k].push(c)
      // a geometria solta já foi para a malha: fica só a caixa dela (caixaDaPasta)
      if (k === 'geo') { geo.computeBoundingBox(); g.userData.caixa = geo.boundingBox!.clone() }
      geo.dispose(); delete g.userData[k]
    }
  })
  const esqueleto = new THREE.Skeleton(ossos as THREE.Bone[])
  const malhas: THREE.SkinnedMesh[] = []
  for (const [k, mat, nome] of [['geo', m.material, '#corpo'], ['geoLuz', m.luz, '#luz']] as const) {
    if (!partes[k].length) continue
    const s = new THREE.SkinnedMesh(mergeGeometries(partes[k]), mat)
    partes[k].forEach((x) => x.dispose())
    s.name = nome; s.frustumCulled = false // o corpo se mexe muito além da caixa da pose do arquivo
    s.castShadow = s.receiveShadow = nome !== '#luz'
    corpo.add(s); s.updateMatrixWorld(true); s.bind(esqueleto, s.matrixWorld)
    malhas.push(s)
  }
  return malhas
}

/** A caixa dos blocos de uma pasta, no espaço dela (os personagens com pele não têm malha por pasta para medir). */
export function caixaDaPasta(g: THREE.Object3D): THREE.Box3 | null {
  if (g.userData.caixa) return (g.userData.caixa as THREE.Box3).clone()
  const geo = g.userData.geo as THREE.BufferGeometry | undefined
  if (!geo) return null
  geo.computeBoundingBox()
  return geo.boundingBox!.clone()
}
