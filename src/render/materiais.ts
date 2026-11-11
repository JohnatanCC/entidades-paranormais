// Do nome da textura ao material do three. A regra do jogo (decidida em 9/nov): **cada textura é um bloco de 1 m com
// 32 × 32 pixels**, como no Minecraft, no chão e na parede. A imagem é texturas/<nome>.png (pintada em pixel; o catálogo
// em maps/textures.ts diz o nome e o uso de cada uma). As malhas têm as coordenadas de textura em metros: um bloco por metro.
// De perto o pixel fica duro (NearestFilter); de longe usa as versões reduzidas, senão o desenho "formiga" com a câmera.
import * as THREE from 'three'
import { BRILHO_PADRAO, TEXTURAS } from '../maps/textures'
import { aplicarAssada } from './assada'
import { aplicarCorte } from './corte'

export const TOPO = '#topo' // o corte da parede (topo e a parte de baixo das vergas)
export const BATENTE = '#batente' // a madeira do batente, por dentro da espessura da parede (o resto da porta vem do modelo)
// as "texturas" que são só cor (não estão no catálogo)
const CORES: Record<string, string> = { [TOPO]: '#2a2622', [BATENTE]: '#3a2618' }

// as imagens (pequenas: o Vite põe cada uma dentro do pacote; salvar o PNG atualiza no npm run dev)
const IMAGENS = import.meta.glob('/texturas/*.png', { query: '?url', import: 'default', eager: true }) as Record<string, string>
const urlDe = (nome: string) => IMAGENS[`/texturas/${nome}.png`] as string | undefined

const texturas = new Map<string, THREE.Texture>()
const materiais = new Map<string, THREE.MeshStandardMaterial>()
const carregador = new THREE.TextureLoader()

export function texturaDe(nome: string): THREE.Texture | null {
  let t = texturas.get(nome)
  if (!t) {
    const url = urlDe(nome)
    if (!url || !TEXTURAS[nome]) return null
    t = carregador.load(url)
    t.magFilter = THREE.NearestFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true; t.anisotropy = filtroAtual
    t.colorSpace = THREE.SRGBColorSpace
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    texturas.set(nome, t)
  }
  return t
}

/** O material de um nome do catálogo (magenta se o nome não existe; TOPO e BATENTE são só cor).
 *  corte = true: a versão das paredes (e portas e janelas), que abaixa com o modo de paredes do editor (render/corte.ts). */
export function materialDe(nome: string, corte = false): THREE.MeshStandardMaterial {
  const chave = corte ? nome + '|corte' : nome
  let m = materiais.get(chave)
  if (!m) {
    const cor = CORES[nome], map = cor ? null : texturaDe(nome)
    // vertexColors: a sombra de canto que a malha do mapa traz em cada vértice (editor/wallMesh.ts)
    // e a luz assada das lâmpadas, que o Baixo e o Médio usam no lugar das de verdade (render/assada.ts)
    // o brilho da textura (o catálogo diz): quanto mais brilho, menos áspera a superfície e mais nítido o reflexo da luz
    const def = TEXTURAS[nome]
    m = aplicarAssada(new THREE.MeshStandardMaterial({ map, color: cor ?? (map ? '#ffffff' : '#ff00ff'), roughness: asperezaDe(nome), metalness: def?.metal ? 0.6 : 0, vertexColors: true }))
    if (corte) aplicarCorte(m)
    materiais.set(chave, m)
  }
  return m
}

/** As texturas no nível de qualidade: brilho = os materiais refletem a luz conforme o catálogo (sem ele, tudo quase
 *  fosco); filtro = a nitidez das texturas vistas de lado. Vale para os materiais já criados e para os próximos. */
let comBrilho = true, filtroAtual = 4
export function ajustarMateriais(brilho: boolean, filtro: number) {
  comBrilho = brilho; filtroAtual = filtro
  for (const [chave, m] of materiais) m.roughness = asperezaDe(chave.split('|')[0])
  for (const t of texturas.values()) if (t.anisotropy !== filtro) { t.anisotropy = filtro; t.needsUpdate = true }
}
const asperezaDe = (nome: string) => 1 - 0.8 * (comBrilho ? TEXTURAS[nome]?.brilho ?? BRILHO_PADRAO : BRILHO_PADRAO)

/** A imagem do bloco para os botões da paleta (o próprio PNG). */
export const amostraDe = (nome: string): string => urlDe(nome) ?? ''
