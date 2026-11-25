// O Devora espectros (o jogo novo: o fantasma capturável, que flutua, dá o bote, morde e cospe espectrais) em blocos:
// modelos/espectrais/devora-espectros.bbmodel, o Devora almas repintado (a matéria azul espectral, o pano branco, os
// olhos vermelhos, as rachaduras e os dentes em azul-gelo). O mesmo esqueleto: corpo › mandibula, tentaculo_N › _Nb ›
// _Nc (N de 1 a 6), costas_N › _Nb › _Nc (N de 1 a 3) e o manto (mecha_manto_*, nas molas). A origem é o meio do corpo.
// Uma malha com ossos (uma chamada de desenho) e a do que brilha. Como ele se mexe: animacao.ts.
import * as THREE from 'three'
import { copiaDoMolde } from '../../../render/bbmodel'
import { prepararMolas, type Molas } from '../../corpo/molas'
import { ossoDe, pastasCom } from '../pastas'
import type { CriaEspectros, ModoEspectros } from './animacao'
import { ESCALA, MANTO } from './numeros'

/** Um tentáculo: os três ossos, a pose do arquivo de cada um, os dois eixos em que ele dobra (a: para fora; b: de lado)
 *  e o atraso dele na onda. */
export interface TentaculoEspectro { ossos: THREE.Group[]; base: THREE.Quaternion[]; a: THREE.Vector3; b: THREE.Vector3; fase: number }

export interface DevoraEspectros {
  root: THREE.Group
  corpo: THREE.Group; mandibula: THREE.Group
  /** a pose do arquivo do corpo e da mandíbula (a animação gira a partir dela) */
  base: { corpo: THREE.Quaternion; mandibula: THREE.Quaternion }
  tentaculos: TentaculoEspectro[] // os seis de trás e os três das costas
  molas: Molas
  /** o que a animação lembra (animacao.ts): o modo e há quanto tempo, se o instante do golpe já passou, o que cospe e o tranco do tiro */
  anim: { t: number; deita: number; modo: ModoEspectros; tm: number; feito: boolean; cria: CriaEspectros; dano: { t: number; lado: number } | null }
}

const ARQUIVO = 'espectrais/devora-espectros'

export function montarDevoraEspectros(): DevoraEspectros {
  const root = copiaDoMolde(ARQUIVO, { translucido: true }), osso = ossoDe(root, ARQUIVO)
  osso('raiz').scale.setScalar(ESCALA)
  const corpo = osso('corpo'), mandibula = osso('mandibula')
  const tentaculo = (nome: string, costas: boolean, i: number): TentaculoEspectro => {
    const ossos = [osso(nome), osso(`${nome}b`), osso(`${nome}c`)]
    const p = ossos[0].position, ang = Math.atan2(p.y, p.x) // o lugar dele em volta do corpo
    return {
      ossos, base: ossos.map((o) => o.quaternion.clone()), fase: i,
      a: costas ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(-Math.sin(ang), Math.cos(ang), 0), b: costas ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(0, 1, 0),
    }
  }
  const tentaculos = [...[1, 2, 3, 4, 5, 6].map((n, i) => tentaculo(`tentaculo_${n}`, false, i)), ...[1, 2, 3].map((n, i) => tentaculo(`costas_${n}`, true, i + 0.5))]
  root.updateMatrixWorld(true) // as rachaduras das fases do Devora almas (racha_2, racha_3) ficam todas à mostra
  return {
    root, corpo, mandibula, tentaculos,
    base: { corpo: corpo.quaternion.clone(), mandibula: mandibula.quaternion.clone() },
    molas: prepararMolas(pastasCom(root, 'mecha_'), corpo, corpo, MANTO),
    anim: { t: Math.random() * 10, deita: 0, modo: 'pairar', tm: 0, feito: false, cria: 'sombra', dano: null },
  }
}
