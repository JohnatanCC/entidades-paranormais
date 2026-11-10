// Os objetos do catálogo em 3D, a partir dos modelos do Blockbench (modelos/objetos/<tipo>.bbmodel).
// Cada tipo é montado UMA vez (o molde); cada objeto do mapa é uma cópia que divide a geometria e o material com o molde:
// cem cadeiras custam uma geometria e uma textura. Tipo sem modelo aparece como uma caixa vermelha de arame.
// Usado pelo editor (a vista, a prévia, o contorno de seleção), pelas miniaturas do catálogo e pelo Ver modelos.
// As portas e janelas também (modelos/aberturas/<tipo>.bbmodel): o mesmo molde, com o corte das paredes do editor.
// E as armas (modelos/armas/<nome>.bbmodel), que o agente segura (game/player/arma.ts).
import * as THREE from 'three'
import { arquivoModelo, existeModelo, montarBB, UNIDADE } from './bbmodel'

export const caminhoObjeto = (tipo: string) => `objetos/${tipo}`
const ESPESSURA_CONTORNO = 0.03 // m: quanto a casca do contorno engorda cada bloco

const moldes = new Map<string, THREE.Object3D>(), cascas = new Map<string, THREE.Object3D>(), corCasca = new Map<string, THREE.Material>()
const APAGADA = new THREE.MeshBasicMaterial({ color: '#3c3833' }) // a lâmpada apagada: o vidro sem brilho

function falta(): THREE.Object3D {
  const m = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), new THREE.MeshBasicMaterial({ color: '#c2453a', wireframe: true }))
  m.position.y = 0.25
  return m
}

/** Uma cópia do objeto (origem no centro da base, frente +z). apagada = a lâmpada desligada. */
export function objeto3d(tipo: string, opc: { apagada?: boolean } = {}): THREE.Object3D {
  const c = molde(caminhoObjeto(tipo)).clone()
  if (opc.apagada) c.traverse((o) => { if (o.name === '#luz') (o as THREE.Mesh).material = APAGADA })
  return c
}

/** O molde de um modelo pelo caminho (montado uma vez); falta() se o arquivo não existe. */
function molde(caminho: string, opc: { corte?: boolean } = {}): THREE.Object3D {
  let m = moldes.get(caminho)
  if (!m) { m = existeModelo(caminho) ? montarBB(arquivoModelo(caminho), opc).raiz : falta(); moldes.set(caminho, m) }
  return m
}

/** Uma cópia da porta ou janela (porta-comum, porta-dupla, porta-grande, janela, janela-grande), no referencial da
 *  abertura: a origem no começo do vão, no chão. As folhas das portas são as pastas folha_1 e folha_2. */
export const abertura3d = (tipo: string): THREE.Object3D => molde(`aberturas/${tipo}`, { corte: true }).clone()

/** Uma cópia da arma (modelos/armas/<nome>.bbmodel): o cano para +z; as pastas empunhadura e cano marcam onde a mão
 *  segura e de onde sai o tiro; a bomba da escopeta é a pasta bomba. */
export const arma3d = (nome: string): THREE.Object3D => molde(`armas/${nome}`).clone()

/** O contorno do objeto: a "casca invertida" (cada bloco um pouco maior, desenhado só por dentro, numa cor só). */
export function casca3d(tipo: string, cor: string): THREE.Object3D {
  let molde = cascas.get(tipo)
  if (!molde) {
    molde = existeModelo(caminhoObjeto(tipo)) ? montarBB(arquivoModelo(caminhoObjeto(tipo)), { inflar: ESPESSURA_CONTORNO / UNIDADE }).raiz : new THREE.Group()
    cascas.set(tipo, molde)
  }
  let mat = corCasca.get(cor)
  if (!mat) { mat = new THREE.MeshBasicMaterial({ color: cor, side: THREE.BackSide }); corCasca.set(cor, mat) }
  const c = molde.clone()
  c.traverse((o) => { if ((o as THREE.Mesh).isMesh) (o as THREE.Mesh).material = mat! })
  return c
}
