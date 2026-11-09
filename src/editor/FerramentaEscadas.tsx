// A ferramenta de escadas: arraste a área da escada no chão, do pé para o topo: ela sobe no sentido em que você
// arrastou (o lado mais comprido do arraste). Os degraus se montam sozinhos pela altura de um andar e o piso de cima
// ganha o buraco. Clique numa escada para escolher (o painel muda o sentido e a textura); Ctrl + clique apaga.
import { useEffect, useMemo, useRef, useState } from 'react'
import type { ThreeEvent } from '@react-three/fiber'
import { LEVEL_H, type Stair } from '../maps/types'
import { SOBE, escadaCabe, escadaEm, escadas, type Direcao, type MapDoc } from './doc'
import { degrausDe } from './wallMesh'

export const NOMES_DIRECAO: Record<Direcao, string> = { norte: 'Norte', sul: 'Sul', leste: 'Leste', oeste: 'Oeste' }

interface Drag { x0: number; z0: number; x1: number; z1: number }

/** A escada que o arraste desenha: a área (inclusive as pontas) e o sentido do lado mais comprido do arraste. */
function escadaDe(d: Drag, level: number, tex: string): Omit<Stair, 'id'> {
  const dx = d.x1 - d.x0, dz = d.z1 - d.z0
  const dir: Direcao = Math.abs(dx) > Math.abs(dz) ? (dx > 0 ? 'leste' : 'oeste') : dz < 0 ? 'norte' : 'sul'
  const x = Math.min(d.x0, d.x1), z = Math.min(d.z0, d.z1)
  return { level, x, z, w: Math.abs(dx) + 1, d: Math.abs(dz) + 1, dir, rise: LEVEL_H, tex }
}

/** A conta da escada para a linha de status: tamanho, degraus e a pisada. */
export function contaDe(s: Pick<Stair, 'w' | 'd' | 'dir' | 'rise'>) {
  const comp = s.dir === 'norte' || s.dir === 'sul' ? s.d : s.w, larg = s.dir === 'norte' || s.dir === 'sul' ? s.w : s.d, n = degrausDe(s.rise)
  return { comp, larg, n, espelho: Math.round((s.rise / n) * 100), pisada: Math.round((comp / n) * 100) }
}

interface Props {
  doc: MapDoc
  andar: number
  tex: string
  selecionada: string | null
  onPor: (s: Omit<Stair, 'id'>) => void
  onSelecionar: (id: string | null) => void
  onApagar: (id: string) => void
  onInfo: (texto: string) => void
}

export function FerramentaEscadas({ doc, andar, tex, selecionada, onPor, onSelecionar, onApagar, onInfo }: Props) {
  const [drag, setDragState] = useState<Drag | null>(null)
  const dragRef = useRef<Drag | null>(null) // os eventos leem daqui (um clique rápido solta antes do redesenho)
  const setDrag = (d: Drag | null) => { dragRef.current = d; setDragState(d) }
  const [mira, setMira] = useState<[number, number] | null>(null)
  const y = andar * LEVEL_H
  const semAndarEmCima = andar + 1 >= doc.meta.levels

  const previa = useMemo(() => {
    if (!drag || (drag.x0 === drag.x1 && drag.z0 === drag.z1)) return null
    const s = escadaDe(drag, andar, tex), c = contaDe(s)
    const erro = c.comp < 2 ? 'Escada curta demais: arraste pelo menos 2 m no sentido da subida.' : escadaCabe(doc, s)
    return { s, erro, texto: `Escada subindo para o ${NOMES_DIRECAO[s.dir].toLowerCase()}: ${c.larg} × ${c.comp} m · ${c.n} degraus de ${c.espelho} cm, pisada de ${c.pisada} cm` }
  }, [drag, doc, andar, tex])

  useEffect(() => {
    if (previa) onInfo(previa.erro ?? previa.texto + (semAndarEmCima ? ' · não há andar em cima (crie com + andar)' : ''))
    else if (mira) {
      const ex = escadaEm(doc, andar, mira[0] + 0.5, mira[1] + 0.5)
      onInfo(ex ? 'Escada · clique escolhe · Ctrl + clique apaga' : 'Arraste do pé até o topo da escada')
    }
  }, [previa, mira, doc, andar, semAndarEmCima, onInfo])

  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setDrag(null) }
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [])

  const quadrado = (e: ThreeEvent<PointerEvent>): [number, number] => [Math.floor(e.point.x), Math.floor(e.point.z)]

  function down(e: ThreeEvent<PointerEvent>) {
    if (e.button !== 0) return
    e.stopPropagation()
    const [x, z] = quadrado(e)
    const ex = escadaEm(doc, andar, e.point.x, e.point.z)
    if (ex && e.ctrlKey) { onApagar(ex.id); return }
    ;(e.target as unknown as Element).setPointerCapture(e.pointerId)
    setDrag({ x0: x, z0: z, x1: x, z1: z })
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
    setDrag(null)
    const [x, z] = quadrado(e), fim = { ...d, x1: x, z1: z }
    if (fim.x0 === fim.x1 && fim.z0 === fim.z1) { onSelecionar(escadaEm(doc, andar, e.point.x, e.point.z)?.id ?? null); return } // um clique escolhe
    const s = escadaDe(fim, andar, tex)
    const erro = contaDe(s).comp < 2 ? 'Escada curta demais.' : escadaCabe(doc, s)
    if (erro) onInfo(erro)
    else onPor(s)
  }

  const sel = selecionada ? escadas(doc).find((s) => s.id === selecionada) : undefined
  return (
    <group>
      <mesh position={[0, y, 0]} rotation-x={-Math.PI / 2} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={() => setMira(null)}>
        <planeGeometry args={[4000, 4000]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      {sel && <Marca s={sel} cor="#e8b765" opacidade={0.3} />}
      {previa && <Marca s={previa.s} cor={previa.erro ? '#c2453a' : '#e8b765'} opacidade={0.35} />}
    </group>
  )
}

/** A caixa transparente da escada e uma seta no chão apontando para onde ela sobe. */
function Marca({ s, cor, opacidade }: { s: Omit<Stair, 'id'>; cor: string; opacidade: number }) {
  const y0 = s.level * LEVEL_H, [dx, dz] = SOBE[s.dir], cx = s.x + s.w / 2, cz = s.z + s.d / 2
  return (
    <group>
      <mesh position={[cx, y0 + s.rise / 2, cz]}>
        <boxGeometry args={[s.w + 0.04, s.rise, s.d + 0.04]} />
        <meshBasicMaterial color={cor} transparent opacity={opacidade * 0.5} depthWrite={false} />
      </mesh>
      <mesh position={[cx, y0 + 0.05, cz]} rotation={[-Math.PI / 2, 0, Math.atan2(-dx, -dz)]}>
        <coneGeometry args={[0.35, 0.9, 3]} />
        <meshBasicMaterial color={cor} transparent opacity={0.85} depthWrite={false} />
      </mesh>
    </group>
  )
}
