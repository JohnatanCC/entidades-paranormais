// Desenha o mapa no editor: as paredes e os pisos juntados numa malha por textura (wallMesh.ts, com os cantos fechados),
// as escadas e as lâmpadas. Os andares acima de maxLevel não aparecem. As texturas vêm do catálogo (render/materiais.ts).
import { useEffect, useMemo } from 'react'
import { LEVEL_H, type Chunk } from '../maps/types'
import { materialDe } from '../render/materiais'
import { floorGeometries, wallGeometries } from './wallMesh'

interface Props { chunks: Record<string, Chunk>; maxLevel: number }

export function MapView({ chunks, maxLevel }: Props) {
  const lista = useMemo(() => Object.values(chunks), [chunks])
  const paredes = useMemo(() => wallGeometries(lista, maxLevel), [lista, maxLevel])
  const pisos = useMemo(() => floorGeometries(lista, maxLevel), [lista, maxLevel])
  useEffect(() => () => paredes.forEach((g) => g.dispose()), [paredes])
  useEffect(() => () => pisos.forEach((g) => g.dispose()), [pisos])
  return (
    <group>
      {[...paredes].map(([tex, g]) => <mesh key={'p' + tex} geometry={g} material={materialDe(tex)} castShadow receiveShadow />)}
      {[...pisos].map(([tex, g]) => <mesh key={'f' + tex} geometry={g} material={materialDe(tex)} receiveShadow />)}
      {lista.map((c) => (
        <group key={`${c.cx}_${c.cz}`}>
          {c.stairs.filter((s) => s.level <= maxLevel).map((s) => <Escada key={s.id} {...s} />)}
          {c.props.filter((p) => p.level <= maxLevel).map((p) => <Objeto key={p.id} type={p.type} pos={p.pos} rot={p.rot} params={p.params} />)}
        </group>
      ))}
    </group>
  )
}

function Escada({ level, x, z, w, d, dir, rise, tex }: Chunk['stairs'][number]) {
  const n = Math.max(2, Math.round(rise / 0.18)), along = dir === 'norte' || dir === 'sul' ? d : w
  const degraus = Array.from({ length: n }, (_, i) => i)
  const rot = { norte: Math.PI, sul: 0, leste: Math.PI / 2, oeste: -Math.PI / 2 }[dir]
  const largura = dir === 'norte' || dir === 'sul' ? w : d
  return (
    <group position={[x + w / 2, level * LEVEL_H, z + d / 2]} rotation-y={rot}>
      {degraus.map((i) => {
        const h = ((i + 1) * rise) / n, prof = along / n
        return <mesh key={i} position={[0, h / 2, -along / 2 + prof * (i + 0.5)]} castShadow receiveShadow material={materialDe(tex)}><boxGeometry args={[largura, h, prof]} /></mesh>
      })}
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
