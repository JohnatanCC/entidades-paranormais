// Desenha o mapa no editor: as paredes, os pisos e as escadas juntados numa malha por textura em cada bloco (wallMesh.ts, com os
// cantos fechados e o buraco no piso sobre a escada), o corrimão automático das escadas (corrimaoMesh.ts), as portas e
// janelas, e os objetos (com as lâmpadas acesas).
// Os andares acima de maxLevel não aparecem. As texturas vêm do catálogo (render/materiais.ts).
// No Testar, "portas" traz o estado vivo das portas (abrindo e fechando); fora dele, as portas ficam como no mapa.
// No jogo (juntar), os objetos repetidos são desenhados juntos (render/instancias.ts).
import { useEffect, useMemo } from 'react'
import type { Chunk } from '../maps/types'
import { materialDe } from '../render/materiais'
import type { PortasVivas } from '../game/world/portas'
import * as THREE from 'three'
import { floorGeometries, sombraGeometries, stairGeometries, texturaDaChave, wallGeometries } from './wallMesh'
import { corrimaoGeometries, materialCorrimao } from './corrimaoMesh'
import { Aberturas } from './Aberturas'
import { Objetos } from './Objetos'

// o material da malha de sombra: não pinta nada (fora da sombra a malha nem é desenhada)
const SO_SOMBRA = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false })

interface Props { chunks: Record<string, Chunk>; maxLevel: number; ocultar?: string | null; portas?: PortasVivas | null; juntar?: boolean }

export function MapView({ chunks, maxLevel, ocultar, portas, juntar }: Props) {
  const lista = useMemo(() => Object.values(chunks), [chunks])
  const paredes = useMemo(() => wallGeometries(lista, maxLevel), [lista, maxLevel])
  const pisos = useMemo(() => floorGeometries(lista, maxLevel), [lista, maxLevel])
  const degraus = useMemo(() => stairGeometries(lista, maxLevel), [lista, maxLevel])
  const corrimao = useMemo(() => corrimaoGeometries(lista, maxLevel), [lista, maxLevel])
  // quem faz sombra é uma malha só por bloco (sem textura), que só é desenhada dentro da sombra
  const sombras = useMemo(() => [...sombraGeometries(paredes, pisos, degraus)].map(([k, g]) => {
    const m = new THREE.Mesh(g, SO_SOMBRA)
    m.name = 'sombra-' + k; m.castShadow = true
    m.onBeforeShadow = () => g.setDrawRange(0, Infinity); m.onAfterShadow = () => g.setDrawRange(0, 0)
    return m
  }), [paredes, pisos, degraus])
  useEffect(() => () => sombras.forEach((m) => m.geometry.dispose()), [sombras])
  useEffect(() => () => degraus.forEach((g) => g.dispose()), [degraus])
  useEffect(() => () => paredes.forEach((g) => g.dispose()), [paredes])
  useEffect(() => () => pisos.forEach((g) => g.dispose()), [pisos])
  useEffect(() => () => corrimao.forEach((g) => g.dispose()), [corrimao])
  return (
    <group>
      {/* uma malha por bloco de 16 m e textura: o que a câmera (ou a sombra de uma lâmpada) não alcança não é desenhado */}
      {[...paredes].map(([k, g]) => <mesh key={'p' + k} geometry={g} material={materialDe(texturaDaChave(k), true)} receiveShadow />)}
      {[...pisos].map(([k, g]) => <mesh key={'f' + k} geometry={g} material={materialDe(texturaDaChave(k))} receiveShadow />)}
      {[...degraus].map(([k, g]) => <mesh key={'e' + k} geometry={g} material={materialDe(texturaDaChave(k))} receiveShadow />)}
      {sombras.map((m) => <primitive key={m.name} object={m} />)}
      {[...corrimao].map(([m, g]) => <mesh key={'c' + m} geometry={g} material={materialCorrimao(m)} castShadow receiveShadow />)}
      {/* a chave troca no começo e no fim do Testar: as folhas voltam para o ângulo do mapa */}
      <Aberturas key={portas ? 'jogo' : 'editor'} chunks={lista} maxLevel={maxLevel} portas={portas ?? undefined} />
      <Objetos chunks={lista} maxLevel={maxLevel} ocultar={ocultar} juntar={juntar} />
    </group>
  )
}
