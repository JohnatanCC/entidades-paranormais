// O agente Matheus Moura em blocos (estilo decidido em 10/nov): o modelo vem do Blockbench, modelos/agente.bbmodel
// (como fazer: docs/blockbench.md). Aqui as pastas do arquivo viram o esqueleto que a animação conhece:
//   quadril -> pelvis; tronco -> spine (e um peito por dentro dele); pescoco, cabeca; braco, antebraco, mao e os dedos
//   (indicador, medio, anelar, minimo, polegar, cada um com a _ponta); coxa, canela, pe; o rosto: olho, iris,
//   sobrancelha e boca; as mechas do cabelo (toda pasta "mecha_..." balança com física: corpo/molas.ts).
//   _e = esquerdo (+x), _d = direito (−x).
// Pasta que faltar no arquivo vira um grupo vazio (a parte só não anima) e aparece um aviso no console.
// A origem do root fica no chão, entre os pés; a FRENTE é o +z do root. O modelo antigo (de caixas e cilindros) está no git.
// Os outros humanos (modelos/lara.bbmodel, nicolas.bbmodel, victor.bbmodel) têm as mesmas pastas: montarAgente('lara')
// monta com o mesmo esqueleto. Um casaco comprido (o sobretudo do Victor) traz a barra em três pastas, casaco_d, casaco_e
// e casaco_tras: as da frente seguem as coxas e a de trás abre quando ele corre (animacao.ts).
import * as THREE from 'three'
import { arquivoModelo, caixaDaPasta, montarBB, vestir } from '../../render/bbmodel'
import { animarAgente } from './animacao'
import { novaAnimArma, type AnimArma, type Arma } from './arma'
import { prepararMolas, type Molas } from '../corpo/molas'
import { CABELO } from './numeros'
import { novaMao, type AnimMao } from './maos'
import { novoDano, type AnimDano } from './dano'
import { novoParado, type AnimParado } from './parado'
import { novoRosto, type AnimRosto } from './rosto'
import { novosPes, type PeNoChao } from './pes'

/** Uma perna: s = -1 é a direita (lado -x), +1 a esquerda. th = coxa (quadril), kn = canela (joelho), ft = pé (tornozelo). */
export interface Perna { s: number; th: THREE.Group; kn: THREE.Group; ft: THREE.Group }
/** Um dedo: a falange de baixo (gira na junta com a palma) e a ponta. */
export interface Dedo { base: THREE.Group; ponta: THREE.Group }
/** Um braço: s = -1 é o direito, +1 o esquerdo. up = o braço (ombro), fo = o antebraço (cotovelo), hd = a mão (pulso). */
export interface Braco { s: number; sh: THREE.Group; up: THREE.Group; fo: THREE.Group; hd: THREE.Group; dedos: Dedo[]; polegar: Dedo }
/** Um painel da barra de um casaco comprido (as pastas casaco_*). s: −1 o da frente direita, 1 o da esquerda, 0 o de trás; sw e v: a mola. */
export interface Painel { g: THREE.Group; s: number; sw: number; v: number }
/** As peças do rosto ([0] direita, [1] esquerda) e onde elas ficam paradas. */
export interface Rosto {
  olhos: [THREE.Group, THREE.Group]; iris: [THREE.Group, THREE.Group]; sobrancelhas: [THREE.Group, THREE.Group]; boca: THREE.Group
  base: { iris: THREE.Vector3[]; sobrancelhas: THREE.Vector3[] }
}
/** O que a animação lembra de um quadro para o outro. */
/** chao: correndo, a altura do quadril quando o último pé tocou o chão; passo: o meio ciclo do quadro anterior;
 *  vel e yaw: a velocidade para a frente e o giro do quadro anterior; inclina e deita: as inclinações das transições;
 *  pernas: para onde as pernas dão o passo (rad; 0 = para a frente). */
export interface AnimAgente { fase: number; amp: number; corrida: number; tempo: number; chao: number; passo: number; vel: number; yaw: number; inclina: number; deita: number; pernas: number; pes: [PeNoChao, PeNoChao]; maos: [AnimMao, AnimMao]; rosto: AnimRosto; parado: AnimParado; arma: AnimArma; dano: AnimDano }

export interface Agente {
  root: THREE.Group
  roll: THREE.Group // o pivô da cambalhota, no meio do corpo
  pelvis: THREE.Group
  legs: [Perna, Perna] // [0] direita, [1] esquerda
  panels: Painel[]
  spine: THREE.Group
  chest: THREE.Group
  pack: THREE.Object3D // a mochila (para a cambalhota não enfiar as costas no chão)
  neck: THREE.Group
  head: THREE.Group
  arms: [Braco, Braco] // [0] direito, [1] esquerdo
  rosto: Rosto
  cabelo: Molas | null // as mechas do cabelo com física (preparadas com o corpo na pose)
  sola: [THREE.Vector3, THREE.Vector3] // o calcanhar e a ponta da bota, no espaço do pé (para os pés ficarem no chão)
  perna: number // m do quadril ao chão, em pé (o passo acompanha: perna mais comprida, passo maior)
  arma: Arma | null // a arma na mão direita (arma.ts: pegarArma)
  anim: AnimAgente
}

const DEDOS = ['indicador', 'medio', 'anelar', 'minimo']

/** Quem tem o esqueleto do agente: o Matheus e os aliados (cada um com o seu modelo). */
export type ModeloAgente = 'agente' | 'lara' | 'nicolas' | 'victor'

export function montarAgente(modelo: ModeloAgente = 'agente'): Agente {
  const montado = montarBB(arquivoModelo(modelo), { pele: true }), { pastas, blocos } = montado
  const parte = (nome: string): THREE.Group => {
    const o = pastas.get(nome)
    if (o) return o
    console.warn(`modelos/${modelo}.bbmodel: falta a pasta "${nome}" (a parte não vai animar)`)
    const g = new THREE.Group(); g.name = nome; return g
  }
  const root = new THREE.Group(); root.name = 'agente'
  const roll = new THREE.Group(); roll.position.y = 0.5; root.add(roll) // o pivô da cambalhota
  const pelvis = parte('quadril'); pelvis.rotation.order = 'YXZ'; roll.add(pelvis)

  // o tronco gira pela cintura em dois tempos (coluna e peito): o peito é um grupo por dentro, no mesmo ponto
  const spine = parte('tronco')
  const chest = new THREE.Group(); chest.name = 'peito'
  for (const c of [...spine.children]) chest.add(c)
  spine.add(chest)
  if (!spine.parent) pelvis.add(spine)

  // o pescoço: o do arquivo; sem ele, um grupo no mesmo ponto de giro da cabeça
  const head = parte('cabeca')
  let neck = pastas.get('pescoco')
  if (!neck) {
    neck = new THREE.Group(); neck.name = 'pescoco'
    neck.position.copy(head.position); head.position.set(0, 0, 0)
    ;(head.parent ?? chest).add(neck); neck.add(head)
  }

  const lado = (s: number) => (s < 0 ? 'd' : 'e')
  const dedo = (nome: string, l: string): Dedo => ({ base: parte(`${nome}_${l}`), ponta: parte(`${nome}_ponta_${l}`) })
  const legs = ([-1, 1] as const).map((s): Perna => ({ s, th: parte('coxa_' + lado(s)), kn: parte('canela_' + lado(s)), ft: parte('pe_' + lado(s)) })) as [Perna, Perna]
  for (const L of legs) L.th.rotation.order = 'YXZ' // a coxa gira primeiro para o lado do passo (andando de lado), depois para a frente
  const arms = ([-1, 1] as const).map((s): Braco => {
    const l = lado(s), up = parte('braco_' + l)
    return { s, sh: up, up, fo: parte('antebraco_' + l), hd: parte('mao_' + l), dedos: DEDOS.map((n) => dedo(n, l)), polegar: dedo('polegar', l) }
  }) as [Braco, Braco]
  const par = (n: string) => [parte(n + '_d'), parte(n + '_e')] as [THREE.Group, THREE.Group]
  const iris = par('iris'), sobrancelhas = par('sobrancelha')
  const rosto: Rosto = {
    olhos: par('olho'), iris, sobrancelhas, boca: parte('boca'),
    base: { iris: iris.map((g) => g.position.clone()), sobrancelhas: sobrancelhas.map((g) => g.position.clone()) },
  }

  // a barra do casaco comprido, se o modelo tiver
  const panels = ([['casaco_d', -1], ['casaco_e', 1], ['casaco_tras', 0]] as const).flatMap(([n, s]) => { const g = pastas.get(n); return g ? [{ g, s, sw: 0, v: 0 }] : [] })
  const a: Agente = {
    root, roll, pelvis, legs, panels, spine, chest, pack: blocos.get('mochila') ?? chest, neck, head, arms, rosto, cabelo: null,
    sola: solaDe(legs[0].ft), perna: pelvis.position.y + legs[0].th.position.y, arma: null, anim: { fase: 0, amp: 0, corrida: 0, tempo: 0, chao: 0, passo: 0, vel: 0, yaw: 0, inclina: 0, deita: 0, pernas: 0, pes: novosPes(), maos: [novaMao(), novaMao()], rosto: novoRosto(), parado: novoParado(), arma: novaAnimArma(), dano: novoDano() },
  }
  // o corpo inteiro numa malha com ossos (uma chamada de desenho); o tronco vai preso no peito, que gira por dentro dele
  vestir(root, montado, { tronco: chest })
  animarAgente(a, { velocidade: 0, corrida: 0, esquiva: -1 }, 0) // a pose parada: os pés no chão desde o primeiro quadro
  // as mechas: com o corpo já na pose, cada uma sabe onde nasce na cabeça (e daí os limites dela)
  root.updateMatrixWorld(true)
  a.cabelo = prepararMolas([...pastas].filter(([nome]) => nome.startsWith('mecha')).map(([, g]) => g), head, head, CABELO)
  return a
}

/** O calcanhar e a ponta da sola, no espaço do pé, medidos nos blocos do pé (a bota). */
function solaDe(pe: THREE.Group): [THREE.Vector3, THREE.Vector3] {
  const caixa = caixaDaPasta(pe)
  if (!caixa || caixa.isEmpty()) return [new THREE.Vector3(0, -0.07, -0.07), new THREE.Vector3(0, -0.07, 0.15)]
  return [new THREE.Vector3(0, caixa.min.y, caixa.min.z + 0.02), new THREE.Vector3(0, caixa.min.y, caixa.max.z - 0.02)]
}
