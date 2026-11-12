// A Asa sombria (docs/demonios.md) em blocos: modelos/demonios/asa-sombria.bbmodel. Um corpo pequeno de matéria escura
// com capuz vermelho e asas de morcego, sem olhos: no lugar do rosto, uma boca de quatro pétalas com dentes vermelhos e
// o núcleo que acende no fundo. A origem é o centro do corpo (ela voa: o root fica na altura do voo).
// O corpo inteiro é uma malha com ossos (uma chamada de desenho, mais a do núcleo, que brilha); os pingos da cauda
// (mecha_*) balançam com molas. Várias Asas dividem a geometria, o material e a textura (copiaDoMolde).
// As pastas: corpo › as pétalas (petala_cima, _baixo, _e, _d), o nucleo, asa_e › asa_ponta_e, asa_d › asa_ponta_d e os
// pingos. Como ela se mexe: animacao.ts.
import * as THREE from 'three'
import { copiaDoMolde } from '../../../render/bbmodel'
import { prepararMolas, type Molas } from '../../corpo/molas'
import { ossoDe, pastasCom } from '../pastas'
import { MOLAS } from './numeros'

/** Uma asa: s = +1 a esquerda (+x), −1 a direita; a ponta dobra no pulso. */
export interface AsaDela { s: number; asa: THREE.Group; ponta: THREE.Group }

export interface AsaSombria {
  root: THREE.Group
  corpo: THREE.Group; nucleo: THREE.Group
  petalas: { cima: THREE.Group; baixo: THREE.Group; e: THREE.Group; d: THREE.Group }
  asas: [AsaDela, AsaDela]
  molas: Molas
  /** do arquivo: o quanto as asas são varridas para trás (rad) */
  base: { varre: number }
  /** o que a animação lembra (animacao.ts) */
  anim: {
    t: number
    fase: number // 0..1 do bater de asas
    bate: number // 1 batendo, 0 planando
    planar: { t: number; dura: number } | null; proxPlanar: number
    golpe: { nome: 'cuspir' | 'desviar'; t: number; lado: number; saiu: boolean } | null
    dano: { t: number } | null
    balanco: { x: number; z: number; vx: number; vz: number } // a inclinação (rad, rad/s)
    boca: number; nucleo: number // o quanto as pétalas estão abertas (0..1) e o tamanho do núcleo
    vel: THREE.Vector3; ultimo: THREE.Vector3 | null // a velocidade dela, medida (x para a frente, z para o lado)
    estourado: boolean
  }
}

const ARQUIVO = 'demonios/asa-sombria'

export function montarAsaSombria(): AsaSombria {
  const root = copiaDoMolde(ARQUIVO), osso = ossoDe(root, ARQUIVO)
  const corpo = osso('corpo')
  const asas = ([1, -1] as const).map((s): AsaDela => {
    const l = s > 0 ? 'e' : 'd', asa = osso(`asa_${l}`), ponta = osso(`asa_ponta_${l}`)
    asa.rotation.order = ponta.rotation.order = 'YZX' // bate (z) e depois varre para trás (y)
    return { s, asa, ponta }
  }) as [AsaDela, AsaDela]
  root.updateMatrixWorld(true)
  return {
    root, corpo, nucleo: osso('nucleo'), asas,
    petalas: { cima: osso('petala_cima'), baixo: osso('petala_baixo'), e: osso('petala_e'), d: osso('petala_d') },
    molas: prepararMolas(pastasCom(root, 'mecha_'), corpo, corpo, MOLAS),
    base: { varre: Math.abs(asas[0].asa.rotation.y) },
    anim: {
      t: Math.random() * 10, fase: Math.random(), bate: 1, planar: null, proxPlanar: 2 + Math.random() * 3, golpe: null, dano: null,
      balanco: { x: 0, z: 0, vx: 0, vz: 0 }, boca: 0, nucleo: 0.35, vel: new THREE.Vector3(), ultimo: null, estourado: false,
    },
  }
}
