// As lâmpadas do mapa no jogo e as sombras em tempo real (a etapa 4 da iluminação, nos níveis Médio e Alto:
// render/qualidade.ts).
// Lâmpada do mapa NÃO é luz de verdade do three, nem no jogo nem no editor: a luz dela já vem pintada no cenário e nos
// objetos (a luz assada, render/assada.ts). Cada luz de verdade custa em todo pixel de todo material (o three passa por
// todas, uma a uma): com as 105 luminárias da instalação o editor gastava 31 ms por quadro, e 6 ms sem elas (18/nov).
// Então as lâmpadas se apresentam aqui só como dados (editor/Objetos.tsx), e existe um punhado fixo de luzes de verdade, as das sombras (o número é do nível, até
// 3), que vão para as lâmpadas mais perto do agente. Sombra de lâmpada é cara: cada uma desenha a cena seis vezes por
// quadro (uma para cada lado dela). A lua faz uma sombra só para o mapa inteiro em volta do agente (game/luz/Iluminacao.tsx).
import * as THREE from 'three'
import { DECAIMENTO } from '../maps/luzAssada' // a mesma queda da luz assada
import { ASSADA } from './assada'

/** Uma lâmpada acesa do mapa: onde, a cor, a força, o alcance, o número (luzAssada.ts) e se falha. */
export interface Lampada { pos: THREE.Vector3; cor: THREE.Color; forca: number; alcance: number; id: number; falha: boolean }
const lampadas = new Set<Lampada>()

/** Uma lâmpada do mapa entrou na cena (devolve como tirar). */
export function lampadaNaCena(l: Lampada) { lampadas.add(l); return () => { lampadas.delete(l) } }

// as luzes de verdade (as das sombras) e a lâmpada que cada uma está fazendo agora
let fila: { luz: THREE.PointLight; lampada: Lampada | null }[] = []

/** As `quantas` luzes de verdade do nível, com sombra de `tamanho` pixels de lado (quem chama põe na cena). Ficam
 *  sempre com sombra ligada: ligar e desligar a sombra refaz os programas de todos os materiais. */
export function novasLuzes(quantas: number, tamanho: number): THREE.PointLight[] {
  fila = Array.from({ length: Math.min(quantas, 3) }, () => {
    const luz = new THREE.PointLight(0xffffff, 0, 8, DECAIMENTO)
    luz.castShadow = true
    luz.shadow.autoUpdate = false // quem refaz é refazerSombras, no ritmo do nível
    luz.shadow.mapSize.set(tamanho, tamanho)
    luz.shadow.camera.near = 0.08
    luz.shadow.bias = -0.004; luz.shadow.normalBias = 0.03
    return { luz, lampada: null }
  })
  return fila.map((f) => f.luz)
}

/** As lâmpadas acesas mais perto de `de` ganham as luzes de verdade (com sombra); quem perdeu volta a ser só a assada. */
export function escolherSombras(de: THREE.Vector3) {
  if (!fila.length) return
  const perto = [...lampadas].map((l) => ({ l, d: l.pos.distanceToSquared(de) })).sort((a, b) => a.d - b.d).slice(0, fila.length).map((x) => x.l)
  // quem continua perto fica com a mesma luz (a sombra dela não precisa ser refeita)
  const livres = fila.filter((f) => !f.lampada || !perto.includes(f.lampada))
  for (const l of perto) {
    if (fila.some((f) => f.lampada === l)) continue
    const f = livres.shift()!
    f.lampada = l
    f.luz.position.copy(l.pos); f.luz.color.copy(l.cor); f.luz.distance = l.alcance
    f.luz.shadow.camera.far = l.alcance; f.luz.shadow.camera.updateProjectionMatrix()
    f.luz.shadow.needsUpdate = true
  }
  for (const f of livres) f.lampada = null
  // a ordem: da mais perto para a mais longe (o ritmo das sombras usa)
  fila.sort((a, b) => (a.lampada ? a.lampada.pos.distanceToSquared(de) : Infinity) - (b.lampada ? b.lampada.pos.distanceToSquared(de) : Infinity))
  // o cenário tira da luz assada as lâmpadas que agora são de verdade (render/assada.ts)
  ASSADA.comSombra.value.set(fila[0]?.lampada?.id ?? 0, fila[1]?.lampada?.id ?? 0, fila[2]?.lampada?.id ?? 0)
}

/** Um quadro: a força de cada luz de verdade (a que falha pisca junto com a malha) e o ritmo das sombras: a mais perto
 *  refaz a sombra de `cada` em `cada` quadros; as outras, na metade desse ritmo e em quadros alternados entre si. */
export function passoDasLuzes(quadro: number, cada: number) {
  fila.forEach(({ luz, lampada }) => { luz.intensity = lampada ? lampada.forca * (lampada.falha ? ASSADA.pisca.value : 1) : 0 })
  if (quadro % cada !== 0) return
  const vez = quadro / cada
  fila.forEach(({ luz, lampada }, i) => { if (lampada && (i === 0 || (vez + i) % 2 === 0)) luz.shadow.needsUpdate = true })
}

/** As luzes de verdade saem (saindo do jogo, ou o nível mudou). */
export function semSombras() {
  for (const { luz } of fila) { luz.shadow.map?.dispose(); luz.shadow.map = null; luz.dispose() }
  fila = []
  ASSADA.comSombra.value.set(0, 0, 0)
}

/** Para as provas e o F3: quantas lâmpadas acesas estão na cena e quantas são de verdade (com sombra) agora. */
export const contarSombras = () => ({ lampadas: lampadas.size, comSombra: fila.filter((f) => f.lampada).length })
