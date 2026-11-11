// A ferramenta de ambientação: as áreas do andar com a sua luz (a ambientação: maps/ambientes.ts). Arrastar marca uma
// área nova com a ambientação escolhida na gaveta; clicar numa área escolhe (o painel troca a ambientação);
// Ctrl + clique (ou Del) apaga. Fora das áreas vale a ambientação do mapa. As áreas só aparecem com esta ferramenta.
import { useEffect, useMemo, useRef, useState } from 'react'
import type { ThreeEvent } from '@react-three/fiber'
import { AMBIENTES, ambienteDe } from '../maps/ambientes'
import { LEVEL_H, type AreaAmbiente } from '../maps/types'
import { areaEm, type MapDoc } from './doc'
import { Medida } from './Medida'

interface Props {
  doc: MapDoc
  andar: number
  ambiente: string // a ambientação das áreas novas
  selecionada: string | null
  onPor: (a: Omit<AreaAmbiente, 'id'>) => void
  onSelecionar: (id: string | null) => void
  onApagar: (id: string) => void
  onInfo: (texto: string) => void
}

interface Drag { x0: number; z0: number; x1: number; z1: number; ctrl: boolean }
const retangulo = (d: Drag) => ({ x: Math.min(d.x0, d.x1), z: Math.min(d.z0, d.z1), w: Math.abs(d.x1 - d.x0) + 1, d: Math.abs(d.z1 - d.z0) + 1 })
export const nomeAmbiente = (nome: string) => AMBIENTES[nome]?.nome ?? `${nome} (não existe)`

export function FerramentaAmbiente({ doc, andar, ambiente, selecionada, onPor, onSelecionar, onApagar, onInfo }: Props) {
  const [drag, setDragState] = useState<Drag | null>(null)
  const dragRef = useRef<Drag | null>(null) // os eventos leem daqui (um clique rápido solta antes do redesenho)
  const setDrag = (d: Drag | null) => { dragRef.current = d; setDragState(d) }
  const y = andar * LEVEL_H
  // as maiores por baixo: a menor é a que vale onde duas se cruzam, e é a que aparece
  const areas = useMemo(() => doc.meta.areas.filter((a) => a.level === andar).sort((a, b) => b.w * b.d - a.w * a.d), [doc.meta.areas, andar])
  const nova = drag && (drag.x0 !== drag.x1 || drag.z0 !== drag.z1) ? retangulo(drag) : null

  useEffect(() => {
    onInfo(nova ? `Área nova: ${nova.w} × ${nova.d} m · ${nomeAmbiente(ambiente)}` : `${areas.length} ${areas.length === 1 ? 'área' : 'áreas'} neste andar · o resto do mapa: ${nomeAmbiente(doc.meta.ambiente)}`)
  }, [nova?.w, nova?.d, ambiente, areas.length, doc.meta.ambiente, onInfo])

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
    setDrag({ x0: x, z0: z, x1: x, z1: z, ctrl: e.ctrlKey })
  }
  function move(e: ThreeEvent<PointerEvent>) {
    const d = dragRef.current, [x, z] = quadrado(e)
    if (d && (d.x1 !== x || d.z1 !== z)) setDrag({ ...d, x1: x, z1: z })
  }
  function up(e: ThreeEvent<PointerEvent>) {
    const d = dragRef.current
    if (e.button !== 0 || !d) return
    ;(e.target as unknown as Element).releasePointerCapture(e.pointerId)
    setDrag(null)
    if (d.x0 === d.x1 && d.z0 === d.z1) { // um clique: escolhe (ou, com Ctrl, apaga) a área do quadrado
      const a = areaEm(doc, andar, d.x0, d.z0)
      if (a && d.ctrl) onApagar(a.id)
      else onSelecionar(a?.id ?? null)
    } else if (!d.ctrl) onPor({ level: andar, ...retangulo(d), ambiente })
  }

  return (
    <group>
      <mesh position={[0, y, 0]} rotation-x={-Math.PI / 2} onPointerDown={down} onPointerMove={move} onPointerUp={up}>
        <planeGeometry args={[4000, 4000]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      {areas.map((a, i) => (
        <group key={a.id}>
          <mesh position={[a.x + a.w / 2, y + 0.03 + i * 0.004, a.z + a.d / 2]} rotation-x={-Math.PI / 2}>
            <planeGeometry args={[a.w, a.d]} />
            <meshBasicMaterial color={ambienteDe(a.ambiente).cor} transparent opacity={a.id === selecionada ? 0.55 : 0.3} depthWrite={false} />
          </mesh>
          <Medida pos={[a.x + a.w / 2, y + 0.4, a.z + a.d / 2]} texto={nomeAmbiente(a.ambiente)} erro={!AMBIENTES[a.ambiente]} />
        </group>
      ))}
      {nova && (
        <mesh position={[nova.x + nova.w / 2, y + 0.06, nova.z + nova.d / 2]} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[nova.w, nova.d]} />
          <meshBasicMaterial color={drag?.ctrl ? '#c2453a' : ambienteDe(ambiente).cor} transparent opacity={0.5} depthWrite={false} />
        </mesh>
      )}
    </group>
  )
}
