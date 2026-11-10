// O agente Matheus Moura em blocos (estilo decidido em 10/nov): o modelo vem do Blockbench, modelos/agente.bbmodel
// (como fazer: docs/blockbench.md). Aqui as pastas do arquivo viram o esqueleto que a animação conhece:
//   quadril -> pelvis; tronco -> spine (e um peito por dentro dele); pescoco, cabeca; braco, antebraco, mao e os dedos
//   (indicador, medio, anelar, minimo, polegar, cada um com a _ponta); coxa, canela, pe; o rosto: olho, iris,
//   sobrancelha e boca; as mechas do cabelo (toda pasta "mecha_..." balança com física: corpo/molas.ts).
//   _e = esquerdo (+x), _d = direito (−x).
// Pasta que faltar no arquivo vira um grupo vazio (a parte só não anima) e aparece um aviso no console.
// A origem do root fica no chão, entre os pés; a FRENTE é o +z do root. O modelo antigo (de caixas e cilindros) está no git.
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

/** Uma perna: s = -1 é a direita (lado -x), +1 a esquerda. th = coxa (quadril), kn = canela (joelho), ft = pé (tornozelo). */
export interface Perna { s: number; th: THREE.Group; kn: THREE.Group; ft: THREE.Group }
/** Um dedo: a falange de baixo (gira na junta com a palma) e a ponta. */
export interface Dedo { base: THREE.Group; ponta: THREE.Group }
/** Um braço: s = -1 é o direito, +1 o esquerdo. up = o braço (ombro), fo = o antebraço (cotovelo), hd = a mão (pulso). */
export interface Braco { s: number; sh: THREE.Group; up: THREE.Group; fo: THREE.Group; hd: THREE.Group; dedos: Dedo[]; polegar: Dedo }
/** Um painel da barra da jaqueta (o modelo de blocos não tem; fica para um casaco comprido). sw e v: a mola. */
export interface Painel { g: THREE.Group; s: number; sw: number; v: number }
/** As peças do rosto ([0] direita, [1] esquerda) e onde elas ficam paradas. */
export interface Rosto {
  olhos: [THREE.Group, THREE.Group]; iris: [THREE.Group, THREE.Group]; sobrancelhas: [THREE.Group, THREE.Group]; boca: THREE.Group
  base: { iris: THREE.Vector3[]; sobrancelhas: THREE.Vector3[] }
}
/** O que a animação lembra de um quadro para o outro. */
export interface AnimAgente { fase: number; amp: number; corrida: number; tempo: number; maos: [AnimMao, AnimMao]; rosto: AnimRosto; parado: AnimParado; arma: AnimArma; dano: AnimDano }

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
  arma: Arma | null // a arma na mão direita (arma.ts: pegarArma)
  anim: AnimAgente
}

const DEDOS = ['indicador', 'medio', 'anelar', 'minimo']

export function montarAgente(): Agente {
  const montado = montarBB(arquivoModelo('agente'), { pele: true }), { pastas, blocos } = montado
  const parte = (nome: string): THREE.Group => {
    const o = pastas.get(nome)
    if (o) return o
    console.warn(`modelos/agente.bbmodel: falta a pasta "${nome}" (a parte não vai animar)`)
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

  const a: Agente = {
    root, roll, pelvis, legs, panels: [], spine, chest, pack: blocos.get('mochila') ?? chest, neck, head, arms, rosto, cabelo: null,
    sola: solaDe(legs[0].ft), arma: null, anim: { fase: 0, amp: 0, corrida: 0, tempo: 0, maos: [novaMao(), novaMao()], rosto: novoRosto(), parado: novoParado(), arma: novaAnimArma(), dano: novoDano() },
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
