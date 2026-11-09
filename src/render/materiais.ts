// Do nome da textura ao material do three. A regra do jogo (decidida em 9/nov): **cada textura é um bloco de 1 m com
// 32 × 32 pixels**, como no Minecraft, no chão e na parede. O desenho do catálogo (feito no tamanho do laboratório)
// é encaixado em 1 m (ajustando para um número inteiro de repetições por metro) e reduzido para 32 px.
// De perto o pixel fica duro (NearestFilter); de longe usa as versões reduzidas, senão o desenho "formiga" com a câmera.
import * as THREE from 'three'
import { TEXTURAS, type TexDef } from '../maps/textures'
import { applyPsx } from './psx'

export const TOPO = '#topo' // o corte da parede (topo e a parte de baixo das vergas)
export const BATENTE = '#batente' // a madeira do batente e das guarnições das portas e janelas
export const VIDRO = '#vidro' // o vidro das janelas
// as "texturas" que são só cor (não estão no catálogo)
const CORES: Record<string, string> = { [TOPO]: '#2a2622', [BATENTE]: '#3a2618', [VIDRO]: '#2e3f56' }
export const PX_BLOCO = 32 // pixels por bloco de 1 m
export const BLOCO = 1 // o lado do bloco (m)

const canvases = new Map<string, HTMLCanvasElement>()
const texturas = new Map<string, THREE.Texture>()
const materiais = new Map<string, THREE.MeshStandardMaterial>()
const amostras = new Map<string, string>()

const novoCanvas = (w: number, h: number) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c }

/** A porta não é bloco (é a peça da etapa 4): fica no tamanho dela. */
const ehBloco = (def: TexDef) => !def.usos.includes('porta')

/** O desenho original, repetido quantas vezes couber em 1 m (pelo menos uma), reduzido para 32 × 32. */
function blocoDe(def: TexDef): HTMLCanvasElement {
  const orig = novoCanvas(def.px[0], def.px[1])
  def.pintar(orig.getContext('2d')!, orig.width, orig.height)
  // quantas repetições do desenho por metro (0,5 m = 2; 0,6 m = 2; 1,2 m = 1; 2 m = 1, encolhido)
  const nx = Math.max(1, Math.round(BLOCO / def.tam[0])), ny = Math.max(1, Math.round(BLOCO / def.tam[1]))
  let c = novoCanvas(orig.width * nx, orig.height * ny)
  const g = c.getContext('2d')!
  for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) g.drawImage(orig, i * orig.width, j * orig.height)
  // reduz pela metade até chegar perto, depois para 32: a média dos pixels, sem pular fio (senão o desenho some)
  while (c.width >= PX_BLOCO * 2 && c.height >= PX_BLOCO * 2) {
    const m = novoCanvas(c.width >> 1, c.height >> 1), gm = m.getContext('2d')!
    gm.imageSmoothingEnabled = true; gm.imageSmoothingQuality = 'high'; gm.drawImage(c, 0, 0, m.width, m.height); c = m
  }
  const out = novoCanvas(PX_BLOCO, PX_BLOCO), go = out.getContext('2d')!
  // desenho menor que 32 (grama, por exemplo): amplia sem borrar
  go.imageSmoothingEnabled = c.width > PX_BLOCO; go.imageSmoothingQuality = 'high'
  go.drawImage(c, 0, 0, PX_BLOCO, PX_BLOCO)
  return out
}

function canvasDe(nome: string): HTMLCanvasElement | null {
  const def = TEXTURAS[nome]
  if (!def) return null
  let c = canvases.get(nome)
  if (!c) {
    if (ehBloco(def)) c = blocoDe(def)
    else { c = novoCanvas(def.px[0], def.px[1]); def.pintar(c.getContext('2d')!, c.width, c.height) }
    canvases.set(nome, c)
  }
  return c
}

export function texturaDe(nome: string): THREE.Texture | null {
  let t = texturas.get(nome)
  if (!t) {
    const c = canvasDe(nome), def = TEXTURAS[nome]
    if (!c || !def) return null
    t = new THREE.CanvasTexture(c)
    t.magFilter = THREE.NearestFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true; t.anisotropy = 4
    t.colorSpace = THREE.SRGBColorSpace
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    // as coordenadas de textura das malhas estão em metros: um bloco por metro (a porta, no tamanho dela)
    if (ehBloco(def)) t.repeat.set(1 / BLOCO, 1 / BLOCO)
    else t.repeat.set(1, 1) // a porta cobre a folha inteira (a folha tem UV de 0 a 1)
    texturas.set(nome, t)
  }
  return t
}

/** O material de um nome do catálogo (magenta se o nome não existe; TOPO, BATENTE e VIDRO são só cor). */
export function materialDe(nome: string): THREE.MeshStandardMaterial {
  let m = materiais.get(nome)
  if (!m) {
    const cor = CORES[nome], map = cor ? null : texturaDe(nome)
    m = applyPsx(new THREE.MeshStandardMaterial({ map, color: cor ?? (map ? '#ffffff' : '#ff00ff'), roughness: nome === VIDRO ? 0.25 : 0.92 }))
    materiais.set(nome, m)
  }
  return m
}

/** A imagem do bloco para os botões da paleta (data URL). */
export function amostraDe(nome: string): string {
  let a = amostras.get(nome)
  if (a === undefined) { const c = canvasDe(nome); a = c ? c.toDataURL() : ''; amostras.set(nome, a) }
  return a
}
