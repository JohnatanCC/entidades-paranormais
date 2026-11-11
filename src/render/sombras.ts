// As sombras em tempo real (a etapa 4 da iluminação, nos níveis Médio e Alto: render/qualidade.ts).
// Sombra de lâmpada é cara: cada lâmpada que faz sombra desenha a cena seis vezes por quadro (uma para cada lado dela).
// Por isso só as lâmpadas mais perto do agente fazem sombra (o número é do nível); as outras iluminam sem sombra, como
// antes. A lua faz uma sombra só para o mapa inteiro em volta do agente (game/luz/Iluminacao.tsx).
// As lâmpadas do mapa se apresentam aqui (editor/Objetos.tsx); quem escolhe as que fazem sombra é game/luz.
import type { PointLight, Vector3 } from 'three'
import { Vector3 as V3 } from 'three'
import { ASSADA } from './assada'

const lampadas = new Set<PointLight>()
let ordem: PointLight[] = [] // as que fazem sombra agora, da mais perto do agente para a mais longe
const _p = new V3()

/** Uma lâmpada do mapa entrou na cena (devolve como tirar). */
export function lampadaNaCena(l: PointLight) { lampadas.add(l); return () => { lampadas.delete(l); soltar(l) } }

function soltar(l: PointLight) {
  if (!l.castShadow) return
  l.castShadow = false
  l.shadow.map?.dispose(); l.shadow.map = null // a textura da sombra de quem parou de fazer
}

/** As `quantas` lâmpadas acesas mais perto de `de` passam a fazer sombra (com `tamanho` pixels de lado); as outras param. */
export function escolherSombras(de: Vector3, quantas: number, tamanho: number) {
  const perto = [...lampadas].filter((l) => l.visible && l.intensity > 0.5)
    .map((l) => ({ l, d: l.getWorldPosition(_p).distanceToSquared(de) })).sort((a, b) => a.d - b.d).slice(0, Math.min(quantas, 3)).map((x) => x.l)
  // o cenário tira da luz assada as lâmpadas que agora são de verdade (até 3: render/assada.ts)
  ASSADA.comSombra.value.set(perto[0]?.userData.id ?? 0, perto[1]?.userData.id ?? 0, perto[2]?.userData.id ?? 0)
  ordem = perto
  for (const l of lampadas) {
    if (!perto.includes(l)) { soltar(l); continue }
    if (l.castShadow) continue
    l.castShadow = true
    l.shadow.autoUpdate = false; l.shadow.needsUpdate = true // quem refaz é refazerSombras, no ritmo do nível
    l.shadow.mapSize.set(tamanho, tamanho)
    l.shadow.camera.near = 0.08; l.shadow.camera.far = l.distance || 12; l.shadow.camera.updateProjectionMatrix()
    l.shadow.bias = -0.004; l.shadow.normalBias = 0.03
  }
}

/** Um quadro: a lâmpada mais perto refaz a sombra dela de `cada` em `cada` quadros; as outras, na metade desse ritmo e
 *  em quadros alternados entre si (a sombra de quem está mais longe pode atrasar um quadro sem ninguém notar). */
export function refazerSombras(quadro: number, cada: number) {
  if (quadro % cada !== 0) return
  const vez = quadro / cada
  ordem.forEach((l, i) => { if (l.castShadow && (i === 0 || (vez + i) % 2 === 0)) l.shadow.needsUpdate = true })
}

/** Nenhuma lâmpada faz sombra (saindo do jogo, ou o nível deixou de ter sombras). */
export function semSombras() { ordem = []; for (const l of lampadas) soltar(l); ASSADA.comSombra.value.set(0, 0, 0) }

/** Para as provas: quantas lâmpadas estão na cena e quantas fazem sombra agora. */
export const contarSombras = () => ({ lampadas: lampadas.size, comSombra: [...lampadas].filter((l) => l.castShadow).length })
