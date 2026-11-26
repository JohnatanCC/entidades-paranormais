// O Manto espectral (o jogo novo, docs/demonios.md): o fantasma capturável mais alto e magro, da família da Sombra
// espectral: modelos/espectrais/manto-espectral.bbmodel (26/nov, refeito pelo conceito do desenvolvedor, de um gerador
// próprio: o chapéu em espiral com a ponta caída, a capa curta e o corpo em gota, facetados; os braços, as pernas e as
// garras em tubos poligonais; o manto comprido em tiras de blocos; dá para retocar no Blockbench). ~2,4 m.
// As pastas: raiz › quadril › coxa_e/d › canela_e/d › tarso_e/d › pe_e/d; quadril › corpo (o tronco e a capa) › cabeca
// (o chapéu, o rosto e os três olhos acesos) › mecha_capuz › mecha_capuz_cubo; braco_curto_e/d › garra_curta_e/d;
// braco_longo_e/d › antebraco_longo_e/d › mao_longa_e/d › dedos_longos_e/d › dedos_ponta_e/d e polegar_longo_e/d (os
// dedos fecham em duas juntas); manto_1_N › manto_2_N › manto_3_N (as 11 tiras do manto, nas molas) e mecha_pingo_N (os
// cubos acesos pendurados). Uma malha com ossos (uma chamada de desenho) e a do que brilha. Translúcido como os outros.
import * as THREE from 'three'
import { copiaDoMolde } from '../../../render/bbmodel'
import { prepararMolas, type Molas } from '../../corpo/molas'
import { ossoDe, pastasCom } from '../pastas'
import type { ModoManto } from './animacao'
import { MANTO, MOLAS } from './numeros'
import { novoTornado, type Tornado } from './tornado'

type Lado = 'e' | 'd'
export interface MantoEspectral {
  root: THREE.Group
  quadril: THREE.Group; corpo: THREE.Group; cabeca: THREE.Group
  curto: Record<Lado, { braco: THREE.Group; antebraco: THREE.Group }>
  longo: Record<Lado, { ombro: THREE.Group; antebraco: THREE.Group; mao: THREE.Group; dedos: THREE.Group; pontas: THREE.Group; polegar: THREE.Group }>
  perna: Record<Lado, { coxa: THREE.Group; canela: THREE.Group; pe: THREE.Group }>
  /** a pose do arquivo de cada osso que a animação gira (ela gira a partir dela) */
  base: Map<THREE.Object3D, THREE.Quaternion>
  /** as tiras do manto e as partes soltas (a ponta do capuz, os cubos), cada uma nas molas dela */
  manto: Molas; molas: Molas
  /** o tornado de luz do golpe giratório (tornado.ts): filho da raiz, só aparece girando */
  tornado: Tornado
  /** o que a animação lembra (animacao.ts): o golpe e há quanto tempo, o que já aconteceu nele, o tranco do tiro e o
   *  quanto está fraco */
  anim: { t: number; passo: number; andar: number; modo: ModoManto; tm: number; feito: number; giro: number; dano: { t: number; lado: number } | null; fraco: number; quadrilY: number; dedos: number }
}

const ARQUIVO = 'espectrais/manto-espectral'

export function montarMantoEspectral(): MantoEspectral {
  const root = copiaDoMolde(ARQUIVO, { translucido: true }), osso = ossoDe(root, ARQUIVO)
  const corpo = osso('corpo')
  const lados = (f: (l: Lado) => unknown) => ({ e: f('e'), d: f('d') })
  const curto = lados((l) => ({ braco: osso(`braco_curto_${l}`), antebraco: osso(`garra_curta_${l}`) })) as MantoEspectral['curto']
  const longo = lados((l) => ({ ombro: osso(`braco_longo_${l}`), antebraco: osso(`antebraco_longo_${l}`), mao: osso(`mao_longa_${l}`), dedos: osso(`dedos_longos_${l}`), pontas: osso(`dedos_ponta_${l}`), polegar: osso(`polegar_longo_${l}`) })) as MantoEspectral['longo']
  const perna = lados((l) => ({ coxa: osso(`coxa_${l}`), canela: osso(`canela_${l}`), pe: osso(`pe_${l}`) })) as MantoEspectral['perna']
  const base = new Map<THREE.Object3D, THREE.Quaternion>()
  const cabeca = osso('cabeca')
  for (const g of [corpo, cabeca, osso('quadril'), ...Object.values(curto).flatMap(Object.values), ...Object.values(longo).flatMap(Object.values), ...Object.values(perna).flatMap(Object.values)] as THREE.Group[]) base.set(g, g.quaternion.clone())
  const tornado = novoTornado(); root.add(tornado.malha)
  root.updateMatrixWorld(true)
  return {
    root, tornado, quadril: osso('quadril'), corpo, cabeca, curto, longo, perna, base,
    manto: prepararMolas(pastasCom(root, 'manto_'), corpo, corpo, MANTO),
    molas: prepararMolas(pastasCom(root, 'mecha_'), corpo, corpo, MOLAS),
    anim: { t: Math.random() * 10, passo: 0, andar: 0, modo: 'pairar', tm: 0, feito: 0, giro: 0, dano: null, fraco: 0, quadrilY: osso('quadril').position.y, dedos: 0.2 },
  }
}
