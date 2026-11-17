// O Mestre (docs/cap2-sombra.md), o fantasma do capítulo 2: modelos/fantasmas/mestre.bbmodel. Um corvo humanoide alto e
// curvado, de capuz e manto roxo de penas; no capuz só os dois olhos amarelos e o bico de osso; na abertura do manto,
// as costelas, as pernas de ave e as mãos de garra. A origem é o chão entre os pés.
// O corpo inteiro é uma malha com ossos (uma chamada de desenho, mais a dos olhos, que brilham). O manto são três
// camadas de tiras (manto_1_*, manto_2_*, manto_3_*: cada tira é filha de uma da camada de cima) que balançam com molas,
// e as partes soltas (mecha_*: as mangas, a ponta do capuz) também. Dentro do manto, a fumaça (fumaca.ts).
// Ele não anda: levita sobre a fumaça (presa ao corpo), com as pernas pendendo. Como ele se mexe: animacao.ts.
import * as THREE from 'three'
import { copiaDoMolde } from '../../../render/bbmodel'
import { prepararMolas, type Molas } from '../../corpo/molas'
import { ossoDe, pastasCom } from '../pastas'
import { novaFumaca, type Fumaca } from './fumaca'
import { MANTO, SOLTAS } from './numeros'

export interface Mestre {
  root: THREE.Group
  quadril: THREE.Group; peito: THREE.Group; cabeca: THREE.Group; bico: THREE.Group
  /** as pernas (a coxa, a canela, o tarso, o pé) e os braços, um de cada lado: s = +1 a esquerda */
  pernas: { s: number; coxa: THREE.Group; canela: THREE.Group; tarso: THREE.Group; pe: THREE.Group }[]
  bracos: { s: number; braco: THREE.Group; antebraco: THREE.Group }[]
  /** do arquivo: a altura do quadril (m) e o bico de baixo (rad) */
  base: { quadril: number; bico: number }
  /** as tiras de cima do manto e para que lado cada uma abre no grito (x, z: o giro por rad de abertura) */
  abas: { g: THREE.Object3D; x: number; z: number }[]
  manto: Molas; soltas: Molas
  fumaca: Fumaca
  /** o que a animação lembra (animacao.ts) */
  anim: {
    t: number
    onda: number // a fase do sobe e desce (rad)
    grito: { t: number; saiu: boolean } | null // o grito em curso (s desde o começo; o corvo já saiu?)
    mordida: { t: number; mordeu: boolean } | null // a mordida em curso (o bico já fechou?)
    surgindo: { t: number } | null // saindo do disfarce: cresce, com o manto aberto (disfarce.ts)
    correndo: boolean; corre: number // caçando; e o quanto já está na pose da corrida (0 a 1)
    coberto: boolean; cobre: number // a luz forte bate nele; e o quanto já se cobriu (0 a 1)
    tique: { espera: number; t: number; de: THREE.Vector3; para: THREE.Vector3 } // a cabeça: de onde e para onde vira (x baixar, y girar, z tombar)
    ultimo: THREE.Vector3 | null; vel: THREE.Vector3 // onde estava e a velocidade (o manto fica para trás)
    frente: number; lado: number // a velocidade no rumo dele (m/s, suavizada): para a frente e para o lado esquerdo
    vento: THREE.Vector3
  }
}

const ARQUIVO = 'fantasmas/mestre'

export function montarMestre(): Mestre {
  const root = copiaDoMolde(ARQUIVO), osso = ossoDe(root, ARQUIVO)
  const peito = osso('peito'), quadril = osso('quadril')
  const lados = [[1, 'e'], [-1, 'd']] as const
  root.updateMatrixWorld(true)
  // cada tira de cima abre para fora do lugar dela em volta do corpo; as da frente abrem mais (o manto abre como asas)
  const bico = osso('bico_baixo'), _p = new THREE.Vector3()
  const abas = pastasCom(root, 'manto_1_').map((g) => {
    peito.worldToLocal(g.getWorldPosition(_p))
    const fi = Math.atan2(_p.x, _p.z), k = 0.6 + 0.7 * Math.max(0, Math.cos(fi))
    return { g, x: -Math.cos(fi) * k, z: Math.sin(fi) * k }
  })
  const fumaca = novaFumaca()
  quadril.add(fumaca.malha) // presa ao corpo: deita e sobe com ele (animacao.ts põe o pé dela no chão)
  return {
    root, quadril, peito, cabeca: osso('cabeca'), bico, abas,
    pernas: lados.map(([s, l]) => ({ s, coxa: osso(`coxa_${l}`), canela: osso(`canela_${l}`), tarso: osso(`tarso_${l}`), pe: osso(`pe_${l}`) })),
    bracos: lados.map(([s, l]) => ({ s, braco: osso(`braco_${l}`), antebraco: osso(`antebraco_${l}`) })),
    base: { quadril: quadril.position.y, bico: bico.rotation.x },
    manto: prepararMolas(pastasCom(root, 'manto_'), peito, peito, MANTO),
    soltas: prepararMolas(pastasCom(root, 'mecha_'), peito, peito, SOLTAS),
    fumaca,
    anim: {
      t: Math.random() * 10, onda: Math.random() * 6, grito: null, mordida: null, surgindo: null, correndo: false, corre: 0, coberto: false, cobre: 0, tique: { espera: 1.5, t: 1, de: new THREE.Vector3(), para: new THREE.Vector3() },
      ultimo: null, vel: new THREE.Vector3(), frente: 0, lado: 0, vento: new THREE.Vector3(),
    },
  }
}
