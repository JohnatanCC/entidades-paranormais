// A ferramenta de objetos: escolha um objeto do catálogo e clique no chão para pôr (encaixa a cada 0,25 m; R gira 15°,
// Shift + R gira 45°). Clique num objeto para escolher e arraste para mover; Ctrl + clique apaga. Lâmpada de teto
// vai para o teto do andar. No modo livre (no painel) o objeto sai da grade: encaixa a cada 5 cm e gira em qualquer eixo.
import { useEffect, useRef, useState } from 'react'
import type { ThreeEvent } from '@react-three/fiber'
import { OBJETOS, alturaApoio } from '../maps/objetos'
import { LEVEL_H, type Prop, type Vec3 } from '../maps/types'
import { objetoNoRaio, objetos, type MapDoc } from './doc'
import { COR_MIRA, Colocado, Contorno, Modelo } from './Objetos'

export const tamDe = (t: string): [number, number, number] => OBJETOS[t]?.tam ?? [0.5, 0.5, 0.5]
const noTeto = (t: string) => OBJETOS[t]?.apoio === 'teto'
const GRADE = 0.25, GRADE_LIVRE = 0.05
const encaixa = (v: number, g: number) => Math.round(v / g) * g

/** A altura onde o objeto encosta: o chão do andar, o teto (a lâmpada) ou a parede (a arandela). */
export const alturaBase = (type: string, andar: number) => andar * LEVEL_H + alturaApoio(OBJETOS[type])

interface Props {
  doc: MapDoc
  andar: number
  tipo: string | null // o objeto do catálogo para pôr (null = só escolher e mover)
  rot: number // a rotação (graus) do objeto que vai ser posto
  selecionada: string | null
  onPor: (p: Omit<Prop, 'id'>) => void
  onSelecionar: (id: string | null) => void
  onMover: (id: string, pos: Vec3) => void
  onApagar: (id: string) => void
  onArrastando: (id: string | null) => void // o objeto que está sendo arrastado (a vista esconde o original)
  onInfo: (texto: string) => void
}

interface Arrasto { id: string; ox: number; oz: number; pos: Vec3; mexeu: boolean }

export function FerramentaObjetos({ doc, andar, tipo, rot, selecionada, onPor, onSelecionar, onMover, onApagar, onArrastando, onInfo }: Props) {
  const [mira, setMira] = useState<{ x: number; z: number; sobre?: Prop } | null>(null)
  const [arrasto, setArrastoState] = useState<Arrasto | null>(null)
  const arrastoRef = useRef<Arrasto | null>(null) // os eventos leem daqui (um clique rápido solta antes do redesenho)
  const setArrasto = (a: Arrasto | null) => { arrastoRef.current = a; setArrastoState(a) }
  const arrastandoId = arrasto?.mexeu ? arrasto.id : null
  useEffect(() => { onArrastando(arrastandoId) }, [arrastandoId, onArrastando])
  const y = andar * LEVEL_H
  const lista = objetos(doc)
  const sel = selecionada ? lista.find((p) => p.id === selecionada) : undefined

  useEffect(() => {
    if (arrasto) onInfo(`Movendo · x ${arrasto.pos[0].toFixed(2)} · z ${arrasto.pos[2].toFixed(2)}`)
    else if (mira?.sobre) onInfo(`${OBJETOS[mira.sobre.type]?.nome ?? mira.sobre.type} · clique escolhe e arrasta para mover · Ctrl + clique apaga`)
    else if (tipo) onInfo(`${OBJETOS[tipo]?.nome ?? tipo} · clique para pôr · R gira 15° · Shift + R gira 45° · Esc para de pôr`)
    else onInfo('Escolha um objeto no painel, ou clique num objeto para mover')
  }, [arrasto, mira, tipo, onInfo])

  const ponto = (e: ThreeEvent<PointerEvent>) => ({ x: e.point.x, z: e.point.z })
  const acertado = (e: ThreeEvent<PointerEvent>) => { const { origin: o, direction: d } = e.ray; return objetoNoRaio(doc, andar, [o.x, o.y, o.z], [d.x, d.y, d.z], tamDe, noTeto) }

  function move(e: ThreeEvent<PointerEvent>) {
    const { x, z } = ponto(e), a = arrastoRef.current
    if (a) {
      const p = lista.find((o) => o.id === a.id), g = p?.free ? GRADE_LIVRE : GRADE
      const pos: Vec3 = [encaixa(x - a.ox, g), a.pos[1], encaixa(z - a.oz, g)]
      if (pos[0] !== a.pos[0] || pos[2] !== a.pos[2]) setArrasto({ ...a, pos, mexeu: true })
      return
    }
    const sobre = acertado(e)
    const nx = encaixa(x, GRADE), nz = encaixa(z, GRADE)
    if (!mira || mira.x !== nx || mira.z !== nz || mira.sobre !== sobre) setMira({ x: nx, z: nz, sobre })
  }
  function down(e: ThreeEvent<PointerEvent>) {
    if (e.button !== 0) return
    e.stopPropagation()
    const { x, z } = ponto(e), ex = acertado(e)
    if (ex && e.ctrlKey) { onApagar(ex.id); return }
    if (ex) {
      onSelecionar(ex.id)
      ;(e.target as unknown as Element).setPointerCapture(e.pointerId)
      setArrasto({ id: ex.id, ox: x - ex.pos[0], oz: z - ex.pos[2], pos: ex.pos, mexeu: false })
      return
    }
    if (tipo) onPor({ type: tipo, level: andar, pos: [encaixa(x, GRADE), alturaBase(tipo, andar), encaixa(z, GRADE)], rot: [0, rot, 0], ...(OBJETOS[tipo]?.params ? { params: Object.fromEntries(Object.entries(OBJETOS[tipo].params!).map(([k, v]) => [k, v[0]])) } : {}) })
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
  return (
    <group>
      <mesh position={[0, y, 0]} rotation-x={-Math.PI / 2} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={() => setMira(null)}>
        <planeGeometry args={[4000, 4000]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      {/* o escolhido: o contorno amarelo em volta do objeto de verdade */}
      {sel && !arrasto && <Colocado p={sel}><Contorno type={sel.type} /></Colocado>}
      {/* arrastando: o objeto de verdade no lugar novo (o original some enquanto isso), com o contorno */}
      {arrasto && arrastado && <Colocado p={{ pos: arrasto.pos, rot: arrastado.rot }}><Modelo type={arrastado.type} params={arrastado.params} /><Contorno type={arrastado.type} /></Colocado>}
      {/* pondo: o objeto de verdade no ponto encaixado, com o contorno */}
      {tipo && mira && !mira.sobre && !arrasto && (
        <Colocado p={{ pos: [mira.x, alturaBase(tipo, andar), mira.z], rot: [0, rot, 0] }}><Modelo type={tipo} /><Contorno type={tipo} /></Colocado>
      )}
      {/* sob o mouse: um contorno mais apagado */}
      {mira?.sobre && mira.sobre.id !== selecionada && !arrasto && <Colocado p={mira.sobre}><Contorno type={mira.sobre.type} cor={COR_MIRA} /></Colocado>}
    </group>
  )
}
