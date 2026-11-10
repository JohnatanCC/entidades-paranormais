// A Mãe (Celina) em blocos: modelos/fantasmas/mae.bbmodel (como fazer: docs/blockbench.md). Alta (2,26 m), pálida, o
// vestido com o Luto escorrendo, o cabelo molhado; olhos brancos de cega que brilham. O corpo inteiro é uma malha com
// ossos (uma chamada de desenho, mais a dos olhos); a saia (pastas saia_*) e o cabelo (mecha_*) balançam com molas.
// As pastas viram os ossos que a animação conhece: quadril, tronco (a cintura) e peito (a coluna dobra em dois), as
// clavículas (ombro), pescoco, cabeca, a mandibula (o queixo que cai), os olhos e as sobrancelhas (o rosto: rosto.ts),
// braços, mãos, dedos, pernas.
// Como ela se mexe: animacao.ts (os movimentos) e pose.ts (as molas da pose, do laboratório).
import * as THREE from 'three'
import { arquivoModelo, montarBB, vestir } from '../../../render/bbmodel'
import { prepararMolas, type Molas } from '../../corpo/molas'
import type { Golpe } from './golpes'
import { novasMolasDaPose, type MolasDaPose } from './pose'
import { novoRostoMae, type AnimRostoMae } from './rosto'
import { prepararEfeitos, type Efeitos } from './efeitos'
import { CABELO_MAE, SAIA } from './numeros'

export interface Dedo { base: THREE.Group; ponta: THREE.Group }
/** Um braço: s = −1 o direito, +1 o esquerdo; om = a clavícula (o ombro que sobe). */
export interface BracoMae { s: number; om: THREE.Group; up: THREE.Group; fo: THREE.Group; hd: THREE.Group; dedos: Dedo[]; polegar: Dedo }
/** O rosto: os olhos (estreitam, arregalam, fecham), as sobrancelhas (franzem, sobem) e onde cada uma fica parada; brilho =
 *  o material dos olhos (só dela: acende, apaga, fica vermelho); escuro = o quanto o rosto escurece (o uniforme do
 *  material do corpo: efeitos.ts). [0] direita, [1] esquerda. */
export interface RostoMae { olhos: [THREE.Group, THREE.Group]; sobrancelhas: [THREE.Group, THREE.Group]; base: { sobrancelhaY: number }; brilho: THREE.MeshBasicMaterial | null; escuro: { value: number } }
/** Uma perna (por baixo da saia): s = −1 a direita. */
export interface PernaMae { s: number; coxa: THREE.Group; canela: THREE.Group; pe: THREE.Group }

export interface Mae {
  root: THREE.Group
  ossos: Map<string, THREE.Group> // as pastas do arquivo, pelo nome
  quadril: THREE.Group; tronco: THREE.Group; peito: THREE.Group; pescoco: THREE.Group; cabeca: THREE.Group; mandibula: THREE.Group
  rosto: RostoMae
  bracos: [BracoMae, BracoMae]; pernas: [PernaMae, PernaMae]
  /** a saia por cima (os painéis saia_N, cada um com a ponta dentro) e a anágua: encolhem quando ela abaixa */
  saiaRaiz: THREE.Group[]
  base: { quadrilY: number; coxa: number; canela: number; cintura: number } // a altura do quadril e da cintura no arquivo; as pernas
  saia: Molas; cabelo: Molas
  pose: MolasDaPose
  expressao: AnimRostoMae // o rosto de agora (rosto.ts)
  /** as ondas do grito, a fase 4 e o rosto que escurece (efeitos.ts): ponha efeitos.grupo na cena, fora do root */
  efeitos: Efeitos
  /** o que a animação lembra (animacao.ts); preta = o quanto ela está na forma da fase 4 (0..1) */
  anim: { t: number; passo: number; andar: number; estalo: number; estaloT: number; ultimo: THREE.Vector3 | null; vel: THREE.Vector3; yaw: number; giro: number; golpe: Golpe | null; preta: number }
}

const DEDOS = ['indicador', 'medio', 'anelar', 'minimo']

export function montarMae(): Mae {
  const montado = montarBB(arquivoModelo('fantasmas/mae'), { pele: true })
  const { pastas } = montado
  const osso = (nome: string): THREE.Group => {
    const o = pastas.get(nome)
    if (o) return o
    console.warn(`modelos/fantasmas/mae.bbmodel: falta a pasta "${nome}"`)
    const g = new THREE.Group(); g.name = nome; return g
  }
  const root = new THREE.Group(); root.name = 'mae'
  root.add(montado.raiz)
  vestir(root, montado)
  const lado = (s: number) => (s < 0 ? 'd' : 'e')
  const dedo = (n: string, l: string): Dedo => ({ base: osso(`${n}_${l}`), ponta: osso(`${n}_ponta_${l}`) })
  const bracos = ([-1, 1] as const).map((s): BracoMae => {
    const l = lado(s)
    return { s, om: osso(`ombro_${l}`), up: osso(`braco_${l}`), fo: osso(`antebraco_${l}`), hd: osso(`mao_${l}`), dedos: DEDOS.map((n) => dedo(n, l)), polegar: dedo('polegar', l) }
  }) as [BracoMae, BracoMae]
  const pernas = ([-1, 1] as const).map((s): PernaMae => ({ s, coxa: osso(`coxa_${lado(s)}`), canela: osso(`canela_${lado(s)}`), pe: osso(`pe_${lado(s)}`) })) as [PernaMae, PernaMae]
  const quadril = osso('quadril')
  const m: Mae = {
    root, ossos: pastas, quadril, tronco: osso('tronco'), peito: osso('peito'), pescoco: osso('pescoco'), cabeca: osso('cabeca'), mandibula: osso('mandibula'), bracos, pernas,
    rosto: {
      olhos: [osso('olho_d'), osso('olho_e')], sobrancelhas: [osso('sobrancelha_d'), osso('sobrancelha_e')], base: { sobrancelhaY: osso('sobrancelha_d').position.y },
      // os olhos brilham sozinhos (a malha "#luz"); o material é só desta Mãe: o rosto muda a cor e a força
      brilho: ((root.getObjectByName('#luz') as THREE.Mesh | undefined)?.material as THREE.MeshBasicMaterial | undefined) ?? null,
      escuro: { value: 0 },
    },
    // o comprimento das pernas: do quadril ao joelho e do joelho ao tornozelo (para os pés ficarem no chão quando ela abaixa)
    saiaRaiz: [...pastas].filter(([n]) => /^saia_[0-9]+$/.test(n) || n === 'anagua').map(([, g]) => g),
    base: { quadrilY: quadril.position.y, coxa: pernas[0].canela.position.length(), canela: pernas[0].pe.position.length(), cintura: quadril.position.y + osso('anagua').position.y },
    saia: null!, cabelo: null!, pose: novasMolasDaPose(), expressao: novoRostoMae(), efeitos: null!,
    anim: { t: 0, passo: 0, andar: 0, estalo: 0, estaloT: 0, ultimo: null, vel: new THREE.Vector3(), yaw: 0, giro: 0, golpe: null, preta: 0 },
  }
  root.updateMatrixWorld(true)
  const grupos = (prefixo: string) => [...pastas].filter(([n]) => n.startsWith(prefixo)).map(([, g]) => g)
  m.saia = prepararMolas(grupos('saia_'), quadril, quadril, SAIA)
  m.cabelo = prepararMolas(grupos('mecha_'), m.cabeca, m.cabeca, CABELO_MAE)
  m.efeitos = prepararEfeitos(m)
  return m
}
