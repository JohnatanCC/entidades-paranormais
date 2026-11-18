// A aba Entidades: escolha uma entidade na gaveta e clique no chão para pôr (encaixa a cada 0,25 m); R gira para onde ela
// olha (45°). Clique numa entidade para escolher e arraste para mover; Ctrl + clique (ou Delete) apaga. No Testar, cada
// uma ganha vida (game/entidades). No mapa ela é um ponto (kind 'entidade'); aqui aparece como uma marca colorida, com a
// seta para onde olha (MarcasDeEntidades, visíveis em todas as ferramentas fora do Testar).
import { useEffect, useMemo, useRef, useState } from 'react'
import type { ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { ENTIDADES } from '../maps/entidades'
import { LEVEL_H, type ScriptPoint, type Vec3 } from '../maps/types'
import { entidades, type MapDoc } from './doc'

const GRADE = 0.25, PEGA = 0.5 // m: o encaixe; a distância do clique até a marca que conta como "clicou nela"
const encaixa = (v: number) => Math.round(v / GRADE) * GRADE
const tipoDe = (p: ScriptPoint) => String(p.params?.tipo ?? '')
const viraDe = (p: ScriptPoint) => Number(p.params?.vira ?? 0)

/** A marca de uma entidade: o cilindro da cor dela (a altura dela), o anel no chão e a seta para onde olha. */
function Marca({ tipo, pos, vira, cor, opaca = 0.75 }: { tipo: string; pos: Vec3; vira: number; cor?: string; opaca?: number }) {
  const d = ENTIDADES[tipo]
  const c = cor ?? d?.cor ?? '#c2453a', h = d?.altura ?? 1, y0 = d?.voa ? 1.6 : 0
  return (
    <group position={pos} rotation-y={(vira * Math.PI) / 180}>
      <mesh position={[0, y0 + h / 2, 0]} renderOrder={5}>
        <cylinderGeometry args={[0.28, 0.28, h, 12]} />
        <meshBasicMaterial color={c} transparent opacity={opaca} depthWrite={false} />
      </mesh>
      <mesh position={[0, 0.02, 0]} rotation-x={-Math.PI / 2} renderOrder={5}>
        <ringGeometry args={[0.32, 0.42, 20]} />
        <meshBasicMaterial color={c} transparent opacity={Math.min(1, opaca + 0.3)} depthWrite={false} />
      </mesh>
      <mesh position={[0, y0 + h * 0.8, 0.45]} rotation-x={Math.PI / 2} renderOrder={5}>
        <coneGeometry args={[0.14, 0.32, 8]} />
        <meshBasicMaterial color={c} transparent opacity={Math.min(1, opaca + 0.3)} depthWrite={false} />
      </mesh>
    </group>
  )
}

/** As entidades do andar, como marcas (o editor, fora do Testar). */
export function MarcasDeEntidades({ doc, andar, ocultar }: { doc: MapDoc; andar: number; ocultar?: string | null }) {
  const lista = useMemo(() => entidades(doc).filter((p) => p.level === andar && p.id !== ocultar), [doc, andar, ocultar])
  return <group>{lista.map((p) => <Marca key={p.id} tipo={tipoDe(p)} pos={p.pos} vira={viraDe(p)} />)}</group>
}

interface Props {
  doc: MapDoc
  andar: number
  tipo: string | null // a entidade para pôr (null = só escolher e mover)
  vira: number // para onde a nova olha (graus)
  selecionada: string | null
  onPor: (tipo: string, pos: Vec3) => void
  onSelecionar: (id: string | null) => void
  onMover: (id: string, pos: Vec3) => void
  onApagar: (id: string) => void
  onArrastando: (id: string | null) => void
  onInfo: (texto: string) => void
}

interface Arrasto { id: string; pos: Vec3; mexeu: boolean }

export function FerramentaEntidades({ doc, andar, tipo, vira, selecionada, onPor, onSelecionar, onMover, onApagar, onArrastando, onInfo }: Props) {
  const [mira, setMira] = useState<{ x: number; z: number; sobre?: ScriptPoint } | null>(null)
  const [arrasto, setArrastoState] = useState<Arrasto | null>(null)
  const arrastoRef = useRef<Arrasto | null>(null)
  const setArrasto = (a: Arrasto | null) => { arrastoRef.current = a; setArrastoState(a) }
  const y = andar * LEVEL_H
  const lista = useMemo(() => entidades(doc).filter((p) => p.level === andar), [doc, andar])
  const sel = selecionada ? lista.find((p) => p.id === selecionada) : undefined
  const arrastandoId = arrasto?.mexeu ? arrasto.id : null
  useEffect(() => { onArrastando(arrastandoId) }, [arrastandoId, onArrastando])

  useEffect(() => {
    if (arrasto) onInfo(`Movendo · x ${arrasto.pos[0].toFixed(2)} · z ${arrasto.pos[2].toFixed(2)}`)
    else if (mira?.sobre) onInfo(`${ENTIDADES[tipoDe(mira.sobre)]?.nome ?? tipoDe(mira.sobre)} · clique escolhe e arrasta para mover · R gira · Ctrl + clique apaga`)
    else if (tipo) onInfo(`${ENTIDADES[tipo]?.nome ?? tipo} · clique no chão para pôr · R gira para onde olha · Esc para de pôr`)
    else onInfo('Escolha uma entidade na gaveta, ou clique numa entidade para mover')
  }, [arrasto, mira, tipo, onInfo])

  /** A entidade mais perto do ponto do chão (até PEGA m). */
  const perto = (x: number, z: number) => {
    let melhor: ScriptPoint | undefined, d = PEGA
    for (const p of lista) { const dd = Math.hypot(p.pos[0] - x, p.pos[2] - z); if (dd < d) { d = dd; melhor = p } }
    return melhor
  }
  function move(e: ThreeEvent<PointerEvent>) {
    const x = e.point.x, z = e.point.z, a = arrastoRef.current
    if (a) {
      const pos: Vec3 = [encaixa(x), y, encaixa(z)]
      if (pos[0] !== a.pos[0] || pos[2] !== a.pos[2]) setArrasto({ ...a, pos, mexeu: true })
      return
    }
    const sobre = perto(x, z), nx = encaixa(x), nz = encaixa(z)
    if (!mira || mira.x !== nx || mira.z !== nz || mira.sobre !== sobre) setMira({ x: nx, z: nz, sobre })
  }
  function down(e: ThreeEvent<PointerEvent>) {
    if (e.button !== 0) return
    e.stopPropagation()
    const ex = perto(e.point.x, e.point.z)
    if (ex && e.ctrlKey) { onApagar(ex.id); return }
    if (ex) {
      onSelecionar(ex.id)
      ;(e.target as unknown as Element).setPointerCapture(e.pointerId)
      setArrasto({ id: ex.id, pos: ex.pos, mexeu: false })
      return
    }
    if (tipo) onPor(tipo, [encaixa(e.point.x), y, encaixa(e.point.z)])
    else onSelecionar(null)
  }
  function up(e: ThreeEvent<PointerEvent>) {
    const a = arrastoRef.current
    if (e.button !== 0 || !a) return
    ;(e.target as unknown as Element).releasePointerCapture(e.pointerId)
    if (a.mexeu) onMover(a.id, a.pos)
    setArrasto(null)
  }

  const arrastado = arrasto ? lista.find((p) => p.id === arrasto.id) : undefined
  const realce = useMemo(() => new THREE.Color('#f2c14e').getStyle(), [])
  return (
    <group>
      <mesh position={[0, y, 0]} rotation-x={-Math.PI / 2} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={() => setMira(null)}>
        <planeGeometry args={[4000, 4000]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      {sel && !arrasto?.mexeu && <Marca tipo={tipoDe(sel)} pos={sel.pos} vira={viraDe(sel)} cor={realce} opaca={0.35} />}
      {arrasto?.mexeu && arrastado && <Marca tipo={tipoDe(arrastado)} pos={arrasto.pos} vira={viraDe(arrastado)} />}
      {tipo && mira && !mira.sobre && !arrasto && <Marca tipo={tipo} pos={[mira.x, y, mira.z]} vira={vira} opaca={0.3} />}
    </group>
  )
}
