// A ferramenta de piso: arrastar uma área põe (ou repinta) o piso dos quadrados de 1 m com a textura do chão e a do
// teto de baixo; um clique faz só o quadrado sob o mouse. Ctrl + arrastar apaga o piso da área. Esc cancela.
import { useEffect, useMemo, useRef, useState } from 'react'
import type { ThreeEvent } from '@react-three/fiber'
import { LEVEL_H } from '../maps/types'
import { pisoNaArea, quadrados, type MapDoc } from './doc'
import { Medida } from './Medida'

interface Props {
  doc: MapDoc
  andar: number
  onFeito: (qs: [number, number][], apagar: boolean) => void
  onInfo: (texto: string) => void
}

interface Drag { x0: number; z0: number; x1: number; z1: number; apagar: boolean }

// a área em quadrados (inclusive as pontas): do quadrado onde começou ao quadrado onde está
function areaDe(drag: Drag | null) {
  if (!drag) return null
  const ax = Math.min(drag.x0, drag.x1), bx = Math.max(drag.x0, drag.x1) + 1, az = Math.min(drag.z0, drag.z1), bz = Math.max(drag.z0, drag.z1) + 1
  return { ax, bx, az, bz, qs: quadrados(ax, az, bx, bz) }
}

export function FerramentaPiso({ doc, andar, onFeito, onInfo }: Props) {
  const [drag, setDragState] = useState<Drag | null>(null)
  const dragRef = useRef<Drag | null>(null) // os eventos leem daqui (um clique rápido solta antes do redesenho)
  const setDrag = (d: Drag | null) => { dragRef.current = d; setDragState(d) }
  const [mira, setMira] = useState<[number, number] | null>(null)
  const y = andar * LEVEL_H

  const area = useMemo(() => areaDe(drag), [drag])

  useEffect(() => {
    if (area && drag) {
      const w = area.bx - area.ax, d = area.bz - area.az
      onInfo(drag.apagar ? `Apagar piso: ${pisoNaArea(doc, andar, area.qs)} m²` : `Piso: ${w} × ${d} m (${w * d} m²)`)
    } else if (mira) onInfo(`quadrado x ${mira[0]} · z ${mira[1]} · andar ${andar === 0 ? 'térreo' : andar + 'º'}`)
  }, [area, drag, mira, doc, andar, onInfo])

  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setDrag(null) }
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [])

  const quadrado = (e: ThreeEvent<PointerEvent>): [number, number] => [Math.floor(e.point.x), Math.floor(e.point.z)]

  function down(e: ThreeEvent<PointerEvent>) {
    if (e.button !== 0) return
    e.stopPropagation()
    ;(e.target as unknown as Element).setPointerCapture(e.pointerId)
    const [x, z] = quadrado(e)
    setDrag({ x0: x, z0: z, x1: x, z1: z, apagar: e.ctrlKey })
  }
  function move(e: ThreeEvent<PointerEvent>) {
    const [x, z] = quadrado(e)
    if (!mira || mira[0] !== x || mira[1] !== z) setMira([x, z])
    const d = dragRef.current
    if (d && (d.x1 !== x || d.z1 !== z)) setDrag({ ...d, x1: x, z1: z })
  }
  function up(e: ThreeEvent<PointerEvent>) {
    const d = dragRef.current
    if (e.button !== 0 || !d) return
    ;(e.target as unknown as Element).releasePointerCapture(e.pointerId)
    const [x, z] = quadrado(e), fim = { ...d, x1: x, z1: z }
    onFeito(areaDe(fim)!.qs, fim.apagar)
    setDrag(null)
  }

  const medida = area && drag ? (drag.apagar ? `− ${pisoNaArea(doc, andar, area.qs)} m²` : `${area.bx - area.ax} × ${area.bz - area.az} m · ${(area.bx - area.ax) * (area.bz - area.az)} m²`) : null
  const r = area ?? (mira ? { ax: mira[0], bx: mira[0] + 1, az: mira[1], bz: mira[1] + 1 } : null)
  return (
    <group>
      <mesh position={[0, y, 0]} rotation-x={-Math.PI / 2} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={() => setMira(null)}>
        <planeGeometry args={[4000, 4000]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      {medida && area && <Medida pos={[(area.ax + area.bx) / 2, y + 0.5, (area.az + area.bz) / 2]} texto={medida} erro={drag?.apagar} />}
      {r && (
        <mesh position={[(r.ax + r.bx) / 2, y + 0.03, (r.az + r.bz) / 2]} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[r.bx - r.ax, r.bz - r.az]} />
          <meshBasicMaterial color={drag?.apagar ? '#c2453a' : '#e8b765'} transparent opacity={drag ? 0.4 : 0.22} depthWrite={false} />
        </mesh>
      )}
    </group>
  )
}
