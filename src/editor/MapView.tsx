// Desenha o mapa no editor: as paredes, os pisos e as escadas juntados numa malha por textura (wallMesh.ts, com os
// cantos fechados e o buraco no piso sobre a escada), as portas e janelas, e os objetos (com as lâmpadas acesas).
// Os andares acima de maxLevel não aparecem. As texturas vêm do catálogo (render/materiais.ts).
import { useEffect, useMemo } from 'react'
import type { Chunk } from '../maps/types'
import { materialDe } from '../render/materiais'
import { floorGeometries, stairGeometries, wallGeometries } from './wallMesh'
import { Aberturas } from './Aberturas'
import { Objetos } from './Objetos'

interface Props { chunks: Record<string, Chunk>; maxLevel: number; ocultar?: string | null }

export function MapView({ chunks, maxLevel, ocultar }: Props) {
  const lista = useMemo(() => Object.values(chunks), [chunks])
  const paredes = useMemo(() => wallGeometries(lista, maxLevel), [lista, maxLevel])
  const pisos = useMemo(() => floorGeometries(lista, maxLevel), [lista, maxLevel])
  const degraus = useMemo(() => stairGeometries(lista, maxLevel), [lista, maxLevel])
  useEffect(() => () => degraus.forEach((g) => g.dispose()), [degraus])
  useEffect(() => () => paredes.forEach((g) => g.dispose()), [paredes])
  useEffect(() => () => pisos.forEach((g) => g.dispose()), [pisos])
  return (
    <group>
      {[...paredes].map(([tex, g]) => <mesh key={'p' + tex} geometry={g} material={materialDe(tex, true)} castShadow receiveShadow />)}
      {[...pisos].map(([tex, g]) => <mesh key={'f' + tex} geometry={g} material={materialDe(tex)} receiveShadow />)}
      {[...degraus].map(([tex, g]) => <mesh key={'e' + tex} geometry={g} material={materialDe(tex)} castShadow receiveShadow />)}
      <Aberturas chunks={lista} maxLevel={maxLevel} />
      <Objetos chunks={lista} maxLevel={maxLevel} ocultar={ocultar} />
    </group>
  )
}


