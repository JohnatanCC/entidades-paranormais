// A Gralha (docs/cap2-sombra.md), os olhos do Mestre: modelos/fantasmas/gralha.bbmodel. Um corvo monstruoso: as penas
// arrepiadas, o crânio aparecendo no bico, os dentes, um olho amarelo aceso de cada lado. A origem é o centro do corpo
// (ela voa: quem a controla põe o root na altura do voo).
// O corpo inteiro é uma malha com ossos (uma chamada de desenho, mais a dos olhos); as penas soltas (mecha_*) balançam
// com molas. Várias Gralhas dividem a geometria, o material e a textura (copiaDoMolde).
// As pastas: corpo › pescoco › cabeca › bico_baixo; asa_e › asa_ponta_e, asa_d › asa_ponta_d; cauda; perna_e, perna_d.
// Como ela se mexe: animacao.ts.
import * as THREE from 'three'
import { copiaDoMolde } from '../../../render/bbmodel'
import { prepararMolas, type Molas } from '../../corpo/molas'
import { ossoDe, pastasCom } from '../pastas'
import { MOLAS } from './numeros'

/** Uma asa: s = +1 a esquerda (+x), −1 a direita; a ponta dobra no pulso. base = o giro do arquivo (rad, em z). */
export interface AsaDaGralha { s: number; asa: THREE.Group; ponta: THREE.Group; base: number; basePonta: number }

export interface Gralha {
  root: THREE.Group
  corpo: THREE.Group; pescoco: THREE.Group; cauda: THREE.Group
  asas: [AsaDaGralha, AsaDaGralha]
  molas: Molas
  /** do arquivo: o giro do pescoço (rad) */
  base: { pescoco: number }
  /** o que a animação lembra (animacao.ts) */
  anim: {
    t: number
    fase: number // 0..1 do bater de asas
    bate: number // 1 batendo, 0 planando
    planar: { t: number; dura: number } | null; proxPlanar: number
    vel: THREE.Vector3; ultimo: THREE.Vector3 | null // a velocidade dela, medida (x para a frente, z para o lado)
  }
}

const ARQUIVO = 'fantasmas/gralha'

export function montarGralha(): Gralha {
  const root = copiaDoMolde(ARQUIVO), osso = ossoDe(root, ARQUIVO)
  const corpo = osso('corpo'), pescoco = osso('pescoco')
  const asas = ([1, -1] as const).map((s): AsaDaGralha => {
    const l = s > 0 ? 'e' : 'd', asa = osso(`asa_${l}`), ponta = osso(`asa_ponta_${l}`)
    return { s, asa, ponta, base: asa.rotation.z, basePonta: ponta.rotation.z }
  }) as [AsaDaGralha, AsaDaGralha]
  root.updateMatrixWorld(true)
  return {
    root, corpo, pescoco, cauda: osso('cauda'), asas, base: { pescoco: pescoco.rotation.x },
    molas: prepararMolas(pastasCom(root, 'mecha_'), corpo, corpo, MOLAS),
    anim: { t: Math.random() * 10, fase: Math.random(), bate: 1, planar: null, proxPlanar: 2 + Math.random() * 3, vel: new THREE.Vector3(), ultimo: null },
  }
}
