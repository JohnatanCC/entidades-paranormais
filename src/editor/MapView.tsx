// Desenha o mapa no editor: as paredes, os pisos e as escadas juntados numa malha por textura (wallMesh.ts, com os
// cantos fechados e o buraco no piso sobre a escada), as portas e janelas, e as lâmpadas. Os andares acima de maxLevel não aparecem. As texturas vêm do catálogo (render/materiais.ts).
import { useEffect, useMemo } from 'react'
import type { Chunk } from '../maps/types'
import { materialDe } from '../render/materiais'
import { floorGeometries, stairGeometries, wallGeometries } from './wallMesh'
import { Aberturas } from './Aberturas'

interface Props { chunks: Record<string, Chunk>; maxLevel: number }

export function MapView({ chunks, maxLevel }: Props) {
  const lista = useMemo(() => Object.values(chunks), [chunks])
  const paredes = useMemo(() => wallGeometries(lista, maxLevel), [lista, maxLevel])
  const pisos = useMemo(() => floorGeometries(lista, maxLevel), [lista, maxLevel])
  const degraus = useMemo(() => stairGeometries(lista, maxLevel), [lista, maxLevel])
  useEffect(() => () => degraus.forEach((g) => g.dispose()), [degraus])
  useEffect(() => () => paredes.forEach((g) => g.dispose()), [paredes])
  useEffect(() => () => pisos.forEach((g) => g.dispose()), [pisos])
  return (
    <group>
      {[...paredes].map(([tex, g]) => <mesh key={'p' + tex} geometry={g} material={materialDe(tex)} castShadow receiveShadow />)}
      {[...pisos].map(([tex, g]) => <mesh key={'f' + tex} geometry={g} material={materialDe(tex)} receiveShadow />)}
      {[...degraus].map(([tex, g]) => <mesh key={'e' + tex} geometry={g} material={materialDe(tex)} castShadow receiveShadow />)}
      <Aberturas chunks={lista} maxLevel={maxLevel} />
      {lista.map((c) => (
        <group key={`${c.cx}_${c.cz}`}>
          {c.props.filter((p) => p.level <= maxLevel).map((p) => <Objeto key={p.id} type={p.type} pos={p.pos} rot={p.rot} params={p.params} />)}
        </group>
      ))}
    </group>
  )
}


/** Os objetos do catálogo. Por enquanto só a lâmpada de teto tem forma; o resto aparece como uma caixa marcada. */
function Objeto({ type, pos, rot, params }: { type: string; pos: [number, number, number]; rot: [number, number, number]; params?: Record<string, unknown> }) {
  const r = rot.map((v) => (v * Math.PI) / 180) as [number, number, number]
  if (type === 'lampada-teto') {
    const modo = (params?.modo as string) || 'normal', acesa = modo !== 'apagada'
    return (
      <group position={pos} rotation={r}>
        <mesh position-y={-0.15}><cylinderGeometry args={[0.2, 0.28, 0.14, 10]} /><meshStandardMaterial color="#3a332b" /></mesh>
        <mesh position-y={-0.25}><sphereGeometry args={[0.09, 8, 6]} /><meshBasicMaterial color={acesa ? '#ffd9a0' : '#3c3833'} /></mesh>
        {acesa && <pointLight position-y={-0.35} color="#e0a050" intensity={modo === 'falhando' ? 4 : 8} distance={7} decay={1.6} />}
      </group>
    )
  }
  return (
    <mesh position={[pos[0], pos[1] + 0.25, pos[2]]} rotation={r}><boxGeometry args={[0.5, 0.5, 0.5]} /><meshStandardMaterial color="#c2453a" wireframe /></mesh>
  )
}
