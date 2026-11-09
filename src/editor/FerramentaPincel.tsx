// O pincel de parede: pinta o lado da parede que o mouse aponta (o lado virado para a câmera) com a textura e a
// barra de baixo escolhidas. Arrastar pinta tudo por onde o mouse passa; Shift + clique pinta a sala inteira
// (todos os lados virados para dentro do cômodo clicado). Esc cancela.
import { useEffect, useMemo, useRef, useState } from 'react'
import type { ThreeEvent } from '@react-three/fiber'
import { pontoCortado } from '../render/corte'
import { LEVEL_H } from '../maps/types'
import { ladoKey, ladoVisto, ladosDaSala, paredeNoRaio, type LadoDe, type MapDoc } from './doc'
import { ESPESSURA } from './wallMesh'

interface Props {
  doc: MapDoc
  andar: number
  onFeito: (lados: LadoDe[]) => void
  onInfo: (texto: string) => void
}

export function FerramentaPincel({ doc, andar, onFeito, onInfo }: Props) {
  const [mira, setMira] = useState<LadoDe | null>(null)
  const [traco, setTracoState] = useState<Map<string, LadoDe> | null>(null) // o que o arraste já pegou
  const tracoRef = useRef<Map<string, LadoDe> | null>(null) // os eventos leem daqui (um clique rápido solta antes do redesenho)
  const setTraco = (t: Map<string, LadoDe> | null) => { tracoRef.current = t; setTracoState(t) }
  const [sala, setSala] = useState(false) // Shift apertado: a prévia mostra a sala inteira
  const y = andar * LEVEL_H

  const alvo = (e: ThreeEvent<PointerEvent>): LadoDe | null => {
    const { origin: o, direction: d } = e.ray, dir: [number, number, number] = [d.x, d.y, d.z]
    const seg = paredeNoRaio(doc, andar, [o.x, o.y, o.z], dir, LEVEL_H, pontoCortado)
    return seg ? { seg, lado: ladoVisto(seg, dir) } : null
  }

  const salaDaMira = useMemo(() => (sala && mira && !traco ? ladosDaSala(doc, mira) : null), [sala, mira, traco, doc])
  const previa: LadoDe[] = traco ? [...traco.values()] : salaDaMira ? salaDaMira.lados : mira ? [mira] : []

  useEffect(() => {
    if (traco) onInfo(`Pintando ${traco.size} ${traco.size === 1 ? 'lado' : 'lados'} de parede`)
    else if (salaDaMira) onInfo(salaDaMira.fechada ? `Sala inteira: ${salaDaMira.lados.length} lados de parede` : 'Não é uma sala fechada: pinta só este lado')
    else onInfo(mira ? 'Clique pinta este lado · arraste pinta vários · Shift + clique pinta a sala' : 'Aponte para uma parede')
  }, [traco, salaDaMira, mira, onInfo])

  useEffect(() => {
    const k = (e: KeyboardEvent) => { setSala(e.shiftKey); if (e.key === 'Escape') setTraco(null) }
    window.addEventListener('keydown', k); window.addEventListener('keyup', k)
    return () => { window.removeEventListener('keydown', k); window.removeEventListener('keyup', k) }
  }, [])

  function down(e: ThreeEvent<PointerEvent>) {
    if (e.button !== 0) return
    e.stopPropagation()
    const l = alvo(e)
    if (!l) return
    if (e.shiftKey) { onFeito(ladosDaSala(doc, l).lados); return }
    ;(e.target as unknown as Element).setPointerCapture(e.pointerId)
    setTraco(new Map([[ladoKey(l), l]]))
  }
  function move(e: ThreeEvent<PointerEvent>) {
    setSala(e.shiftKey)
    const l = alvo(e)
    if ((l && mira ? ladoKey(l) !== ladoKey(mira) : l !== mira)) setMira(l)
    const t = tracoRef.current
    if (t && l && !t.has(ladoKey(l))) setTraco(new Map(t).set(ladoKey(l), l))
  }
  function up(e: ThreeEvent<PointerEvent>) {
    const t = tracoRef.current
    if (e.button !== 0 || !t) return
    ;(e.target as unknown as Element).releasePointerCapture(e.pointerId)
    onFeito([...t.values()])
    setTraco(null)
  }

  return (
    <group>
      <mesh position={[0, y, 0]} rotation-x={-Math.PI / 2} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={() => setMira(null)}>
        <planeGeometry args={[4000, 4000]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      {previa.map((l) => {
        const s = l.seg, sinal = l.lado === 'a' ? -1 : 1, d = sinal * (ESPESSURA / 2 + 0.015)
        return (
          <mesh key={ladoKey(l)} position={[s.axis === 'x' ? s.x + 0.5 : s.x + d, y + LEVEL_H / 2, s.axis === 'z' ? s.z + 0.5 : s.z + d]} rotation-y={s.axis === 'x' ? 0 : Math.PI / 2}>
            <boxGeometry args={[1, LEVEL_H, 0.02]} />
            <meshBasicMaterial color="#e8b765" transparent opacity={traco ? 0.45 : 0.3} depthWrite={false} />
          </mesh>
        )
      })}
    </group>
  )
}
