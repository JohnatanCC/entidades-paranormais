// A ferramenta de paredes: um plano invisível no chão do andar recebe o mouse e encaixa nos cantos da grade de 1 m.
//   arrastar numa linha = parede reta · arrastar em diagonal = sala fechada pelas quatro paredes
//   Ctrl + arrastar (ou a ferramenta Apagar) = apaga as paredes da área; um clique numa parede apaga só aquele pedaço
// Enquanto arrasta, mostra a prévia (âmbar = põe, vermelho = tira). Esc cancela.
import { useEffect, useMemo, useRef, useState } from 'react'
import type { ThreeEvent } from '@react-three/fiber'
import { LEVEL_H, chunkKey, chunkOf } from '../maps/types'
import { paredeMaisPerto, paredeNoRaio, paredesNaArea, segmentosDoArraste, type MapDoc, type Seg } from './doc'
import { ESPESSURA } from './wallMesh'

interface Props {
  doc: MapDoc
  andar: number
  apagar: boolean // a ferramenta Apagar está escolhida
  onFeito: (segs: Seg[], apagar: boolean) => void
  onInfo: (texto: string) => void // a linha de status embaixo (sem redesenhar o editor a cada movimento)
}

type V3 = [number, number, number]
// px, pz: o ponto no chão; ro, rd: o raio do mouse (para acertar a parede clicada, não o chão atrás dela)
interface Drag { x0: number; z0: number; x1: number; z1: number; px: number; pz: number; ro: V3; rd: V3; apagar: boolean }

export function FerramentaParedes({ doc, andar, apagar, onFeito, onInfo }: Props) {
  const [drag, setDragState] = useState<Drag | null>(null)
  // os eventos leem o arraste pela ref: um clique rápido solta o botão antes da tela redesenhar com o estado novo
  const dragRef = useRef<Drag | null>(null)
  const setDrag = (d: Drag | null) => { dragRef.current = d; setDragState(d) }
  const [mira, setMira] = useState<[number, number] | null>(null)
  const y = andar * LEVEL_H

  // o que o arraste vai fazer
  const calcular = (drag: Drag | null) => {
    if (!drag) return null
    if (drag.apagar) {
      const segs = drag.x0 === drag.x1 && drag.z0 === drag.z1
        ? [paredeNoRaio(doc, andar, drag.ro, drag.rd, LEVEL_H) ?? paredeMaisPerto(doc, andar, drag.px, drag.pz)].filter((s): s is Seg => !!s)
        : paredesNaArea(doc, andar, drag.x0, drag.z0, drag.x1, drag.z1)
      return { segs, texto: `Apagar: ${segs.length} ${segs.length === 1 ? 'pedaço' : 'pedaços'} de parede` }
    }
    const a = segmentosDoArraste(andar, drag.x0, drag.z0, drag.x1, drag.z1)
    const texto = a.tipo === 'reta' ? `Parede reta: ${a.segs.length} m` : a.tipo === 'sala' ? `Sala: ${a.w} × ${a.d} m (${a.segs.length} m de parede)` : 'Arraste para desenhar'
    return { segs: a.segs, texto }
  }
  const previa = useMemo(() => calcular(drag), [drag, doc, andar])

  useEffect(() => {
    if (previa) onInfo(previa.texto)
    else if (mira) onInfo(`x ${mira[0]} · z ${mira[1]} · bloco ${chunkKey(...chunkOf(mira[0], mira[1]))} · andar ${andar === 0 ? 'térreo' : andar + 'º'}`)
  }, [previa, mira, andar, onInfo])

  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setDrag(null) }
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [])

  const canto = (e: ThreeEvent<PointerEvent>): [number, number] => [Math.round(e.point.x), Math.round(e.point.z)]

  function down(e: ThreeEvent<PointerEvent>) {
    if (e.button !== 0) return
    e.stopPropagation()
    ;(e.target as unknown as Element).setPointerCapture(e.pointerId)
    const [x, z] = canto(e)
    const { origin: o, direction: d } = e.ray
    setDrag({ x0: x, z0: z, x1: x, z1: z, px: e.point.x, pz: e.point.z, ro: [o.x, o.y, o.z], rd: [d.x, d.y, d.z], apagar: apagar || e.ctrlKey })
  }
  function move(e: ThreeEvent<PointerEvent>) {
    const [x, z] = canto(e)
    if (!mira || mira[0] !== x || mira[1] !== z) setMira([x, z])
    const d = dragRef.current
    if (d && (d.x1 !== x || d.z1 !== z)) setDrag({ ...d, x1: x, z1: z })
  }
  function up(e: ThreeEvent<PointerEvent>) {
    const d = dragRef.current
    if (e.button !== 0 || !d) return
    ;(e.target as unknown as Element).releasePointerCapture(e.pointerId)
    const [x, z] = canto(e), fim = { ...d, x1: x, z1: z }, r = calcular(fim)
    if (r?.segs.length) onFeito(r.segs, fim.apagar)
    setDrag(null)
  }

  const cor = drag?.apagar ? '#c2453a' : '#e8b765'
  return (
    <group>
      {/* o chão que recebe o mouse: grande, transparente, na altura do andar */}
      <mesh position={[0, y, 0]} rotation-x={-Math.PI / 2} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={() => setMira(null)}>
        <planeGeometry args={[4000, 4000]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      {mira && !drag && (
        <mesh position={[mira[0], y + 0.02, mira[1]]} rotation-x={-Math.PI / 2}>
          <ringGeometry args={[0.1, 0.17, 16]} />
          <meshBasicMaterial color={apagar ? '#c2453a' : '#e8b765'} />
        </mesh>
      )}
      {previa?.segs.map((s) => (
        <mesh key={`${s.axis}${s.x}_${s.z}`} position={[s.axis === 'x' ? s.x + 0.5 : s.x, y + LEVEL_H / 2, s.axis === 'z' ? s.z + 0.5 : s.z]} rotation-y={s.axis === 'x' ? 0 : Math.PI / 2}>
          <boxGeometry args={[1, LEVEL_H + 0.02, ESPESSURA * 1.6]} />
          <meshBasicMaterial color={cor} transparent opacity={0.4} depthWrite={false} />
        </mesh>
      ))}
    </group>
  )
}
