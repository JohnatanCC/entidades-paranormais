// O Assombrado (docs/demonios.md) em blocos: modelos/demonios/assombrado.bbmodel. Uma gota de matéria escura com capuz
// vermelho, numa perna só com o joelho para trás; três olhos vermelhos e dois braços curtos de três garras.
// O corpo inteiro é uma malha com ossos (uma chamada de desenho, mais a dos olhos, que brilham); a ponta do capuz e os
// pingos (pastas mecha_*) balançam com molas. Vários Assombrados dividem a geometria, o material e a textura: o
// primeiro é montado do arquivo (o molde, que fica parado) e cada um é uma cópia dele, com os ossos próprios.
// As pastas: quadril (o balanço do joão-bobo) › corpo (amassa e estica) com o capuz, os olhos, os braços e os pingos;
// quadril › coxa › canela › pe (a perna). Como ele se mexe: animacao.ts.
import * as THREE from 'three'
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js'
import { arquivoModelo, montarBB, vestir } from '../../../render/bbmodel'
import { prepararMolas, type Molas } from '../../corpo/molas'
import { MOLAS } from './numeros'

/** Um braço: s = +1 o esquerdo (+x), −1 o direito. */
export interface BracoAssombrado { s: number; braco: THREE.Group; garra: THREE.Group }

export interface Assombrado {
  root: THREE.Group
  quadril: THREE.Group; corpo: THREE.Group; coxa: THREE.Group; canela: THREE.Group; pe: THREE.Group
  olhos: THREE.Group[] // o esquerdo, o direito e o do meio
  bracos: [BracoAssombrado, BracoAssombrado]
  molas: Molas
  /** do arquivo: a altura do quadril (m), onde a coxa nasce no quadril, o comprimento da coxa e da canela, a altura do
   *  tornozelo com o pé no chão e a abertura dos braços (rad) */
  base: { quadril: number; coxa: THREE.Vector3; L1: number; L2: number; tornozelo: THREE.Vector3; braco: number }
  /** o que a animação lembra (animacao.ts) */
  anim: {
    t: number
    vel: number // m/s pedidos, suavizados
    pulo: number // −1 parado; 0..1 a fase do pulo
    balanco: { x: number; z: number; vx: number; vz: number; prox: number } // o joão-bobo (rad, rad/s) e o próximo empurrão (s)
    golpe: { t: number } | null // o ataque
    dano: { t: number } | null
    piscar: { prox: number; t: number }[] // por olho: quanto falta para piscar e há quanto tempo está piscando (−1 = não)
    estourado: boolean
    yaw: number | null; giro: number // para medir o quanto ele vira (o balanço inclina para dentro da curva)
  }
}

let molde: THREE.Group | null = null
/** O molde: montado do arquivo uma vez (no npm run dev, salvar o .bbmodel recarrega este módulo e ele é refeito). */
function moldar(): THREE.Group {
  const m = montarBB(arquivoModelo('demonios/assombrado'), { pele: true })
  const root = new THREE.Group(); root.name = 'assombrado'
  root.add(m.raiz)
  vestir(root, m)
  return root
}

export function montarAssombrado(): Assombrado {
  const root = clone((molde ??= moldar())) as THREE.Group
  const osso = (nome: string): THREE.Group => {
    const o = root.getObjectByName(nome) as THREE.Group | undefined
    if (o) return o
    console.warn(`modelos/demonios/assombrado.bbmodel: falta a pasta "${nome}"`)
    const g = new THREE.Group(); g.name = nome; return g
  }
  const quadril = osso('quadril'), corpo = osso('corpo'), coxa = osso('coxa'), canela = osso('canela'), pe = osso('pe')
  const bracos = ([1, -1] as const).map((s): BracoAssombrado => {
    const l = s > 0 ? 'e' : 'd', braco = osso(`braco_${l}`)
    braco.rotation.order = 'XYZ' // abre de lado primeiro, depois vai para a frente e para trás
    return { s, braco, garra: osso(`garra_${l}`) }
  }) as [BracoAssombrado, BracoAssombrado]
  coxa.rotation.order = 'ZYX' // dobra (x) e depois tomba de lado (z)
  root.updateMatrixWorld(true)
  const tornozelo = pe.getWorldPosition(new THREE.Vector3()) // o molde fica na origem: é a posição no espaço dele
  const a: Assombrado = {
    root, quadril, corpo, coxa, canela, pe, bracos,
    olhos: [osso('olho_e'), osso('olho_d'), osso('olho_meio')],
    molas: prepararMolas([...listar(root, 'mecha_')], corpo, corpo, MOLAS),
    base: { quadril: quadril.position.y, coxa: coxa.position.clone(), L1: canela.position.length(), L2: pe.position.length(), tornozelo, braco: Math.abs(bracos[0].braco.rotation.z) },
    anim: {
      t: Math.random() * 10, vel: 0, pulo: -1, balanco: { x: 0, z: 0, vx: 0, vz: 0, prox: 1 }, golpe: null, dano: null,
      piscar: [0, 1, 2].map(() => ({ prox: 0.5 + Math.random() * 3, t: -1 })), estourado: false, yaw: null, giro: 0,
    },
  }
  return a
}

/** As pastas cujo nome começa com o prefixo. */
function* listar(o: THREE.Object3D, prefixo: string): Generator<THREE.Object3D> {
  for (const c of o.children) { if (c.name.startsWith(prefixo)) yield c; yield* listar(c, prefixo) }
}
