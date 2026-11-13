// O Assombrado (docs/demonios.md) em blocos: modelos/demonios/assombrado.bbmodel. Uma gota de matéria escura com capuz
// vermelho, numa perna só com o joelho para trás; três olhos vermelhos e dois braços curtos de três garras.
// O corpo inteiro é uma malha com ossos (uma chamada de desenho, mais a dos olhos, que brilham); a ponta do capuz e os
// pingos (pastas mecha_*) balançam com molas. Vários Assombrados dividem a geometria, o material e a textura (cada
// um é uma cópia do molde: copiaDoMolde).
// As pastas: quadril (o balanço do joão-bobo) › corpo (amassa e estica) com o capuz, os olhos, os braços e os pingos;
// quadril › coxa › canela › pe (a perna). Como ele se mexe: animacao.ts.
import * as THREE from 'three'
import { copiaDoMolde } from '../../../render/bbmodel'
import { prepararMolas, type Molas } from '../../corpo/molas'
import { ossoDe, pastasCom } from '../pastas'
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
    voo: { de: THREE.Vector3; para: THREE.Vector3; t: number; dur: number; alto: number } | null // arremessado (cuspido pelo Devora)
    surgir: { t: number; respingo: (() => void) | null } | null // subindo do líquido preto
  }
}

export function montarAssombrado(): Assombrado {
  const root = copiaDoMolde('demonios/assombrado'), osso = ossoDe(root, 'demonios/assombrado')
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
    molas: prepararMolas(pastasCom(root, 'mecha_'), corpo, corpo, MOLAS),
    base: { quadril: quadril.position.y, coxa: coxa.position.clone(), L1: canela.position.length(), L2: pe.position.length(), tornozelo, braco: Math.abs(bracos[0].braco.rotation.z) },
    anim: {
      t: Math.random() * 10, vel: 0, pulo: -1, balanco: { x: 0, z: 0, vx: 0, vz: 0, prox: 1 }, golpe: null, dano: null,
      piscar: [0, 1, 2].map(() => ({ prox: 0.5 + Math.random() * 3, t: -1 })), estourado: false, yaw: null, giro: 0, voo: null, surgir: null,
    },
  }
  return a
}
