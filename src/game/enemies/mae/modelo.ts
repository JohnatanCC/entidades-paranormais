// A Mãe (Celina) em blocos: modelos/fantasmas/mae.bbmodel (como fazer: docs/blockbench.md). Alta (2,26 m), pálida, o
// vestido com o Luto escorrendo, o cabelo molhado; olhos brancos de cega que brilham. O corpo inteiro é uma malha com
// ossos (uma chamada de desenho, mais a dos olhos); a saia (pastas saia_*) e o cabelo (mecha_*) balançam com molas.
// As pastas viram os ossos que a animação conhece (quadril, tronco, pescoco, cabeca, boca, braços, mãos, dedos, pernas).
// Por enquanto ela só fica parada, respirando: as animações entram uma etapa por vez.
import * as THREE from 'three'
import { arquivoModelo, montarBB, vestir } from '../../../render/bbmodel'
import { animarMolas, prepararMolas, type Molas } from '../../corpo/molas'
import { CABELO_MAE, RESPIRA, SAIA } from './numeros'

export interface Mae {
  root: THREE.Group
  ossos: Map<string, THREE.Group> // as pastas do arquivo, pelo nome
  quadril: THREE.Group; tronco: THREE.Group; pescoco: THREE.Group; cabeca: THREE.Group; boca: THREE.Group
  saia: Molas; cabelo: Molas
  tempo: number
}

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
  const m: Mae = {
    root, ossos: pastas, quadril: osso('quadril'), tronco: osso('tronco'), pescoco: osso('pescoco'), cabeca: osso('cabeca'), boca: osso('boca'),
    saia: null!, cabelo: null!, tempo: 0,
  }
  m.boca.scale.y = 0.0001 // a boca fechada (a peça escura só aparece no grito)
  root.updateMatrixWorld(true)
  const grupos = (prefixo: string) => [...pastas].filter(([n]) => n.startsWith(prefixo)).map(([, g]) => g)
  m.saia = prepararMolas(grupos('saia_'), m.quadril, m.quadril, SAIA)
  m.cabelo = prepararMolas(grupos('mecha_'), m.cabeca, m.cabeca, CABELO_MAE)
  return m
}

/** Um quadro: parada, só respira; depois a saia e o cabelo balançam com o que o corpo fez. */
export function animarMae(m: Mae, dt: number) {
  dt = Math.min(dt, 0.05)
  m.tempo = (m.tempo + dt) % RESPIRA.volta
  m.tronco.rotation.x = Math.sin((m.tempo / RESPIRA.volta) * Math.PI * 2) * RESPIRA.peito
  animarMolas(m.saia, m.root, dt)
  animarMolas(m.cabelo, m.root, dt)
}
