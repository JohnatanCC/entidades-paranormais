// O ectoplasma escorrendo debaixo da porta de contenção (a cena 1, os planos 1.5 e 1.6; docs/cenas.md): a poça azul
// que sai da fresta da porta e se espalha pelo chão, em dedos. Uma malha só, de quatro cantos: a textura de pixel
// (32 px/m, como o cenário) guarda no alfa de cada pixel QUANDO a poça chega nele (1 = na fresta, perto de 0 = na
// ponta); o alphaTest corta o que ainda não chegou. Crescer é só mudar um número: nada é refeito a cada quadro.
// A cor passa do branco (o bloom acende a poça no Médio e no Alto); um brilho lento pulsa nela.
import { useEffect, useMemo, type ComponentType } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { PropsDoCenario } from '../../game/cenas/tipos'

export interface Vazamento {
  x: number; z: number // o meio da fresta, no chão (na face da parede)
  dir: [number, number] // para onde escorre (x, z), unitário
  largura: number // m: a fresta (a largura da porta)
  alcance: number // m: até onde a poça chega, da parede
  desde: number; ate: number // s da cena: quando começa a crescer e quando chega ao tamanho todo
  antes?: number // 0 a 1: o quanto já escorreu antes de `desde`
}

const PX = 32 // pixels por metro
// da ponta (fina, mais escura) para a fresta (funda, mais clara); a última é o reflexo
const CORES = ['#17608f', '#2286c0', '#30a6da', '#7cd8fa'].map((c) => new THREE.Color(c))

/** Um ruído de valor (0 a 1), liso entre os pontos inteiros: os dedos e as manchas da poça. */
function ruido(semente: number) {
  const h = (i: number, j: number) => { const s = Math.sin(i * 127.1 + j * 311.7 + semente * 74.7) * 43758.5453; return s - Math.floor(s) }
  const liso = (t: number) => t * t * (3 - 2 * t)
  return (x: number, y: number) => {
    const i = Math.floor(x), j = Math.floor(y), fx = liso(x - i), fy = liso(y - j)
    const a = h(i, j), b = h(i + 1, j), c = h(i, j + 1), d = h(i + 1, j + 1)
    return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy
  }
}

/** A textura da poça: u ao longo da fresta (com sobra dos lados), v saindo da parede. */
function texturaDaPoca(largura: number, alcance: number, lados: number) {
  const W = largura + 2 * lados, nu = Math.ceil(W * PX), nv = Math.ceil(alcance * PX)
  const dados = new Uint8Array(nu * nv * 4), forma = ruido(1), mancha = ruido(7), meia = largura / 2 - 0.12
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
    const u = (i + 0.5) / PX - W / 2, v = (j + 0.5) / PX
    // a distância até a fresta; o alcance muda com a direção (os dedos) e treme um pouco (a borda irregular)
    const du = Math.max(0, Math.abs(u) - meia), d = Math.hypot(du * 1.4, v), ang = Math.atan2(u, v + 0.25)
    const dedo = 0.35 + 0.8 * forma(ang * 4 + 3, 0.5) ** 1.5 + 0.12 * forma(u * 9, v * 9)
    const dd = d / dedo, r = dd / alcance
    const k = (j * nu + i) * 4
    if (r >= 1) continue // fora: alfa 0, nunca aparece
    const cor = r < 0.55 && mancha(u * 6, v * 6) > 0.8 ? CORES[3] : CORES[r > 0.78 ? 0 : r > 0.42 ? 1 : 2]
    dados[k] = cor.r * 255; dados[k + 1] = cor.g * 255; dados[k + 2] = cor.b * 255
    dados[k + 3] = Math.max(2, Math.round((1 - r) * 255)) // quando a poça chega aqui
  }
  const t = new THREE.DataTexture(dados, nu, nv, THREE.RGBAFormat)
  t.magFilter = t.minFilter = THREE.NearestFilter
  t.colorSpace = THREE.SRGBColorSpace
  t.needsUpdate = true
  return { textura: t, W }
}

/** A poça de um vazamento, para pôr na cena (Cena.cenario): cresce com o relógio da cena. */
export function vazamento(v: Vazamento): ComponentType<PropsDoCenario> {
  const LADOS = 0.35 // m: quanto a poça pode passar da fresta para cada lado
  return function Ectoplasma({ relogio }) {
    const { malha, material } = useMemo(() => {
      const { textura, W } = texturaDaPoca(v.largura, v.alcance, LADOS)
      const [dx, dz] = v.dir, px = -dz, pz = dx // o lado da fresta
      const canto = (u: number, s: number) => [v.x + px * u + dx * s, 0.012, v.z + pz * u + dz * s]
      const g = new THREE.BufferGeometry()
      g.setAttribute('position', new THREE.Float32BufferAttribute([...canto(-W / 2, 0), ...canto(W / 2, 0), ...canto(-W / 2, v.alcance), ...canto(W / 2, v.alcance)], 3))
      g.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 0, 1, 1, 1], 2))
      g.setIndex([0, 2, 1, 1, 2, 3])
      g.computeVertexNormals()
      const material = new THREE.MeshBasicMaterial({ map: textura, alphaTest: 0.99, side: THREE.DoubleSide })
      return { malha: new THREE.Mesh(g, material), material }
    }, [])
    useEffect(() => () => { malha.geometry.dispose(); material.map?.dispose(); material.dispose() }, [malha, material])
    useFrame(() => {
      const t = relogio.t, a = Math.min(1, Math.max(0, (t - v.desde) / (v.ate - v.desde)))
      const quanto = (v.antes ?? 0) + (1 - (v.antes ?? 0)) * a * a * (3 - 2 * a) // escorre devagar no começo e no fim
      material.alphaTest = Math.max(0.004, 1 - quanto) // nunca 0: o 0 troca o shader
      malha.visible = quanto > 0
      material.color.setScalar(1.12 + 0.1 * Math.sin(t * 1.7)) // um pouco acima do branco: o bloom acende de leve
    })
    return <primitive object={malha} />
  }
}
