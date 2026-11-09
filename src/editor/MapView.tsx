// Desenha o mapa no editor: as paredes, os pisos e as escadas juntados numa malha por textura (wallMesh.ts, com os
// cantos fechados e o buraco no piso sobre a escada), o corrimão automático das escadas (corrimaoMesh.ts), as portas e
// janelas, e os objetos (com as lâmpadas acesas).
// Os andares acima de maxLevel não aparecem. As texturas vêm do catálogo (render/materiais.ts).
// No Testar, "portas" traz o estado vivo das portas (abrindo e fechando); fora dele, as portas ficam como no mapa.
import { useEffect, useMemo } from 'react'
import type { Chunk } from '../maps/types'
import { materialDe } from '../render/materiais'
import type { PortasVivas } from '../game/world/portas'
import { floorGeometries, stairGeometries, wallGeometries } from './wallMesh'
import { corrimaoGeometries } from './corrimaoMesh'
import { Aberturas } from './Aberturas'
import { Objetos, materialObj } from './Objetos'

interface Props { chunks: Record<string, Chunk>; maxLevel: number; ocultar?: string | null; portas?: PortasVivas | null }

export function MapView({ chunks, maxLevel, ocultar, portas }: Props) {
  const lista = useMemo(() => Object.values(chunks), [chunks])
  const paredes = useMemo(() => wallGeometries(lista, maxLevel), [lista, maxLevel])
  const pisos = useMemo(() => floorGeometries(lista, maxLevel), [lista, maxLevel])
  const degraus = useMemo(() => stairGeometries(lista, maxLevel), [lista, maxLevel])
  const corrimao = useMemo(() => corrimaoGeometries(lista, maxLevel), [lista, maxLevel])
  useEffect(() => () => degraus.forEach((g) => g.dispose()), [degraus])
  useEffect(() => () => paredes.forEach((g) => g.dispose()), [paredes])
  useEffect(() => () => pisos.forEach((g) => g.dispose()), [pisos])
  useEffect(() => () => corrimao.forEach((g) => g.dispose()), [corrimao])
  return (
    <group>
      {[...paredes].map(([tex, g]) => <mesh key={'p' + tex} geometry={g} material={materialDe(tex, true)} castShadow receiveShadow />)}
      {[...pisos].map(([tex, g]) => <mesh key={'f' + tex} geometry={g} material={materialDe(tex)} receiveShadow />)}
      {[...degraus].map(([tex, g]) => <mesh key={'e' + tex} geometry={g} material={materialDe(tex)} castShadow receiveShadow />)}
      {[...corrimao].map(([m, g]) => <mesh key={'c' + m} geometry={g} material={materialObj(m)} castShadow receiveShadow />)}
      {/* a chave troca no começo e no fim do Testar: as folhas voltam para o ângulo do mapa */}
      <Aberturas key={portas ? 'jogo' : 'editor'} chunks={lista} maxLevel={maxLevel} portas={portas ?? undefined} />
      <Objetos chunks={lista} maxLevel={maxLevel} ocultar={ocultar} />
    </group>
  )
}
