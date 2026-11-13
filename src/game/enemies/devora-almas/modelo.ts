// O Devora almas (docs/demonios.md), o mini-chefe, em blocos: modelos/demonios/devora-almas.bbmodel. A frente é um
// tubarão de matéria escura, rachado e com pedaços faltando; por dentro aparece o vermelho do submundo (brilha): nos
// buracos fundos dos olhos, na boca, nas feridas e nas rachaduras. A metade de trás vira seis tentáculos; nas costas,
// três tentáculos compridos; um manto vermelho rasgado cobre a junção. A origem é o meio do corpo: quem o controla põe
// o root na altura que a animação pede (nadando, ele fica embaixo do chão e só os tentáculos das costas passam).
// O corpo inteiro é uma malha com ossos (uma chamada de desenho, mais a do que brilha); o manto (mecha_manto_*) balança.
// As pastas: corpo › mandibula, tentaculo_N › _Nb › _Nc (N de 1 a 6), costas_N › _Nb › _Nc (N de 1 a 3) e o manto.
// Como ele se mexe: animacao.ts.
import * as THREE from 'three'
import { copiaDoMolde } from '../../../render/bbmodel'
import { prepararMolas, type Molas } from '../../corpo/molas'
import { ossoDe, pastasCom } from '../pastas'
import { ALTURA, ESCALA, MANTO } from './numeros'

/** solto: fora do chão, parado; mergulho / emergir: entrando e saindo do chão; nadando: embaixo do chão (só os
 *  tentáculos das costas passam); marca: parado lá embaixo, em pé, com a marca de mordida no chão; salto: sai de boca aberta e morde;
 *  exposto: errou, se debate no chão; engolindo: pegou, mastiga deitado; cuspe: cospe quem engoliu;
 *  mira / investida / freia: a investida rasante (aponta, dispara rasgando o chão, passa do ponto e freia);
 *  chuva: afunda e fica lá embaixo enquanto os tentáculos sobem do chão (os efeitos); ninhada: sai meio corpo do chão e
 *  cospe Assombrados (e uma Asa sombria); atordoado: arrancado do chão, cai de lado, tonto; rastejando: se arrasta
 *  devagar pela superfície (a janela para atirar). */
export type ModoDevora = 'solto' | 'mergulho' | 'nadando' | 'emergir' | 'marca' | 'salto' | 'exposto' | 'engolindo' | 'cuspe' | 'mira' | 'investida' | 'freia' | 'chuva' | 'ninhada' | 'atordoado' | 'rastejando'

/** Um tentáculo: os três ossos, a pose do arquivo de cada um (a curva das costas) e os dois eixos em que ele dobra a
 *  partir dela: `a` (os de trás: para fora, em volta do eixo tangente, o ângulo negativo abre; os das costas: para a
 *  frente e para trás, em volta do x) e `b` (os de trás: de lado, em volta do y; os das costas: de lado, em volta do z).
 *  lado: de que lado do corpo ele está (−1, 0, +1). */
export interface Tentaculo { ossos: THREE.Group[]; base: THREE.Quaternion[]; a: THREE.Vector3; b: THREE.Vector3; costas: boolean; lado: number; ang: { f: number; y: number }[] }

export interface DevoraAlmas {
  root: THREE.Group
  corpo: THREE.Group; mandibula: THREE.Group
  tentaculos: Tentaculo[] // os seis de trás e os três das costas
  /** as rachaduras que aparecem com as fases (as pastas racha_2 e racha_3) e o material do que brilha (acende mais a
   *  cada fase; é dividido com o molde: só há um Devora por arena) */
  rachas: THREE.Group[]; brilho: THREE.MeshBasicMaterial | null
  molas: Molas
  /** o que a animação lembra (animacao.ts) */
  anim: {
    t: number
    modo: ModoDevora; tm: number // o modo e há quanto tempo
    y: number; y0: number; pitch: number; p0: number // a altura do root e a inclinação (agora e no começo do modo)
    pegou: boolean // o salto pegou alguém (engole) ou errou (fica exposto)
    feito: { rompe: boolean; mordeu: boolean; cuspiu: boolean; pousou: boolean; cria: number } // o que já aconteceu neste modo
    balanco: { x: number; z: number; vx: number; vz: number }
    dano: { t: number } | null
    estourado: boolean
    fase: number // 1, 2 ou 3
    costas: boolean[] // os tentáculos das costas que ainda existem (arrancados não voltam até refazer)
    repete: number; curta: boolean // a investida: quantas ainda vêm seguidas, e se a mira é a curta
    chuva: number; ninhada: number // quanto dura a chuva pedida (s); quantos Assombrados a ninhada cospe
    rumo: { vel: number; giro: number } // o nado de quem o controla (nado.ts): m/s e rad/s
    medido: { vel: number; giro: number; yaw: number | null; ultimo: THREE.Vector3 | null } // o que o root fez de verdade (a curva no corpo)
  }
}

const ARQUIVO = 'demonios/devora-almas'

export function montarDevoraAlmas(): DevoraAlmas {
  const root = copiaDoMolde(ARQUIVO), osso = ossoDe(root, ARQUIVO)
  // o tamanho no jogo: a pasta raiz (e com ela todos os ossos) cresce em volta do meio do corpo; a posição do root
  // continua em metros do mundo
  osso('raiz').scale.setScalar(ESCALA)
  const corpo = osso('corpo')
  const tentaculo = (nome: string, costas: boolean): Tentaculo => {
    const ossos = [osso(nome), osso(`${nome}b`), osso(`${nome}c`)]
    const p = ossos[0].position, ang = Math.atan2(p.y, p.x) // o lugar dele em volta do corpo
    return {
      ossos, base: ossos.map((o) => o.quaternion.clone()), costas, lado: Math.sign(Math.round(p.x * 10)), ang: ossos.map(() => ({ f: 0, y: 0 })),
      a: costas ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(-Math.sin(ang), Math.cos(ang), 0), b: costas ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(0, 1, 0),
    }
  }
  const tentaculos = [...[1, 2, 3, 4, 5, 6].map((n) => tentaculo(`tentaculo_${n}`, false)), ...[1, 2, 3].map((n) => tentaculo(`costas_${n}`, true))]
  root.updateMatrixWorld(true)
  const rachas = [osso('racha_2'), osso('racha_3')]
  rachas.forEach((r) => r.scale.setScalar(1e-3)) // a fase 1: só as rachaduras dos flancos
  const brilho = ((root.getObjectByName('#luz') as THREE.Mesh | undefined)?.material as THREE.MeshBasicMaterial | undefined) ?? null
  brilho?.color.setScalar(1) // o material é do molde: um Devora anterior pode ter deixado aceso
  return {
    root, corpo, mandibula: osso('mandibula'), tentaculos, rachas, brilho,
    molas: prepararMolas(pastasCom(root, 'mecha_'), corpo, corpo, MANTO),
    anim: {
      t: Math.random() * 10, modo: 'solto', tm: 0, y: ALTURA.solto, y0: ALTURA.solto, pitch: 0, p0: 0, pegou: false,
      feito: { rompe: false, mordeu: false, cuspiu: false, pousou: false, cria: 0 }, balanco: { x: 0, z: 0, vx: 0, vz: 0 }, dano: null, estourado: false,
      fase: 1, costas: [true, true, true], repete: 0, curta: false, chuva: 0, ninhada: 0,
      rumo: { vel: 0, giro: 0 }, medido: { vel: 0, giro: 0, yaw: null, ultimo: null },
    },
  }
}
