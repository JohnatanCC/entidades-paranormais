// O Asa do terror (o jogo novo, docs/demonios.md): o fantasma capturável da família da Asa espectral, maior e mais
// robusto: modelos/espectrais/asa-terror.bbmodel (26/nov, refeito pela referência do desenvolvedor, de um gerador
// próprio: em blocos, com o bico, as mandíbulas e as garras das asas poligonais; dá para retocar no Blockbench).
// ~3,8 m de asa a asa.
// As pastas: raiz › corpo (a bola, o capuz, o rosto com o X aceso) › asa_e/d › asa_ponta_e/d (as de cima); asa_baixo_e/d
// › asa_baixo_ponta_e/d (as de baixo); bico; mandibula_e/d; nucleo (o meio do X, de onde sai o tiro); nas molas:
// mecha_pano_eN/dN/tN › _b (as tiras do pano do capuz), mecha_tentaculo_e/d/m › _2 › _3 › _4 (os tentáculos) e
// mecha_pingo_eN/dN (os cubos acesos). A origem é o meio do corpo (ele voa). Translúcido como os espectrais.
import * as THREE from 'three'
import { copiaDoMolde } from '../../../render/bbmodel'
import { prepararMolas, type Molas } from '../../corpo/molas'
import { ossoDe, pastasCom } from '../pastas'
import { MOLAS } from './numeros'

type Lado = 'e' | 'd'
export interface AsaTerror {
  root: THREE.Group
  corpo: THREE.Group; bico: THREE.Group; nucleo: THREE.Group
  asas: Record<Lado, { asa: THREE.Group; ponta: THREE.Group; baixo: THREE.Group; baixoPonta: THREE.Group }>
  mandibulas: Record<Lado, THREE.Group>
  /** a pose do arquivo de cada osso que a animação gira */
  base: Map<THREE.Object3D, THREE.Quaternion>
  molas: Molas
  /** modo = o golpe em curso (tm = o tempo dele, feito = os tiros já dados); recuo = o coice do disparo (0..1); dano = o
   *  tranco de um tiro; fraco = 0..1 */
  anim: { t: number; fase: number; andar: number; mand: number; modo: 'voar' | 'tiro' | 'rajada' | 'sumir' | 'surgir'; tm: number; feito: number; recuo: number; dano: { t: number; lado: number } | null; fraco: number }
}

const ARQUIVO = 'espectrais/asa-terror'

export function montarAsaTerror(): AsaTerror {
  const root = copiaDoMolde(ARQUIVO, { translucido: true }), osso = ossoDe(root, ARQUIVO)
  const asa = (l: Lado) => ({ asa: osso(`asa_${l}`), ponta: osso(`asa_ponta_${l}`), baixo: osso(`asa_baixo_${l}`), baixoPonta: osso(`asa_baixo_ponta_${l}`) })
  const asas = { e: asa('e'), d: asa('d') }, mandibulas = { e: osso('mandibula_e'), d: osso('mandibula_d') }
  const corpo = osso('corpo'), bico = osso('bico'), base = new Map<THREE.Object3D, THREE.Quaternion>()
  for (const g of [corpo, ...Object.values(asas).flatMap(Object.values), ...Object.values(mandibulas), bico] as THREE.Group[]) base.set(g, g.quaternion.clone())
  root.updateMatrixWorld(true)
  return {
    root, corpo, bico, nucleo: osso('nucleo'), asas, mandibulas, base,
    molas: prepararMolas(pastasCom(root, 'mecha_'), corpo, corpo, MOLAS),
    anim: { t: Math.random() * 10, fase: Math.random(), andar: 0, mand: 0, modo: 'voar', tm: 0, feito: 0, recuo: 0, dano: null, fraco: 0 },
  }
}
