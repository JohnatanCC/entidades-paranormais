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
import { DANO, MOLAS } from './numeros'

/** Uma asa: s = +1 a esquerda (+x), −1 a direita; a ponta dobra no pulso. base = o giro do arquivo (rad, em z; baseY: o
 *  quanto é varrida para trás). */
export interface AsaDaGralha { s: number; asa: THREE.Group; ponta: THREE.Group; base: number; basePonta: number; baseY: number }

export interface Gralha {
  root: THREE.Group
  corpo: THREE.Group; pescoco: THREE.Group; cauda: THREE.Group; bico: THREE.Group; pernas: THREE.Group[]
  asas: [AsaDaGralha, AsaDaGralha]
  molas: Molas
  /** do arquivo: o giro do pescoço e o do bico de baixo (rad) */
  base: { pescoco: number; bico: number }
  /** o que a animação lembra (animacao.ts) */
  anim: {
    t: number
    fase: number // 0..1 do bater de asas
    bate: number // 1 batendo, 0 planando
    planar: { t: number; dura: number } | null; proxPlanar: number
    ataque: { t: number; bicou: boolean } | null // o ataque em curso (s desde o começo; já bicou?)
    dano: { t: number; lado: number } | null // o tranco de um tiro (para que lado tomba)
    vida: number; estourada: boolean // quantos tiros ainda aguenta
    pousada: boolean; pousa: number // em pé; e o quanto já está na pose (0 a 1)
    tique: { espera: number; y: number; z: number; ay: number; az: number } // pousada, a cabeça: para onde vira e onde está
    vel: THREE.Vector3; ultimo: THREE.Vector3 | null // a velocidade dela, medida (x para a frente, z para o lado)
  }
}

const ARQUIVO = 'fantasmas/gralha'

export function montarGralha(): Gralha {
  const root = copiaDoMolde(ARQUIVO), osso = ossoDe(root, ARQUIVO)
  const corpo = osso('corpo'), pescoco = osso('pescoco'), bico = osso('bico_baixo')
  const asas = ([1, -1] as const).map((s): AsaDaGralha => {
    const l = s > 0 ? 'e' : 'd', asa = osso(`asa_${l}`), ponta = osso(`asa_ponta_${l}`)
    return { s, asa, ponta, base: asa.rotation.z, basePonta: ponta.rotation.z, baseY: asa.rotation.y }
  }) as [AsaDaGralha, AsaDaGralha]
  root.updateMatrixWorld(true)
  return {
    root, corpo, pescoco, cauda: osso('cauda'), asas, bico, pernas: [osso('perna_e'), osso('perna_d')], base: { pescoco: pescoco.rotation.x, bico: bico.rotation.x },
    molas: prepararMolas(pastasCom(root, 'mecha_'), corpo, corpo, MOLAS),
    anim: { t: Math.random() * 10, fase: Math.random(), bate: 1, planar: null, ataque: null, dano: null, vida: DANO.vida, estourada: false, pousada: false, pousa: 0, tique: { espera: 0.5, y: 0, z: 0, ay: 0, az: 0 }, proxPlanar: 2 + Math.random() * 3, vel: new THREE.Vector3(), ultimo: null },
  }
}
