// O conta-gotas: clique numa parede, piso, porta, janela, escada ou objeto e o editor pega o que está ali (a textura do
// lado da parede com a barra de baixo, o chão e o teto, o tipo da porta, o objeto e a rotação dele) e já troca para a
// ferramenta certa, pronta para repetir. Atravessa as paredes abaixadas.
import { useEffect, useState } from 'react'
import type { ThreeEvent } from '@react-three/fiber'
import { OBJETOS } from '../maps/objetos'
import { TEXTURAS } from '../maps/textures'
import { LEVEL_H, type WallSide } from '../maps/types'
import { pontoCortado } from '../render/corte'
import { aberturaNo, escadaEm, ladoVisto, objetoNoRaioT, paredeNoRaioT, type MapDoc } from './doc'
import type { TipoAbertura } from './FerramentaAberturas'
import { tamDe } from './FerramentaObjetos'
import { buraco } from './wallMesh'

export type Pego =
  | { tipo: 'parede'; side: WallSide }
  | { tipo: 'piso'; top: string; bottom: string }
  | { tipo: 'objeto'; type: string; rot: number }
  | { tipo: 'abertura'; tipoAbertura: TipoAbertura; width: number }
  | { tipo: 'escada'; tex: string }

const nomeTex = (t: string) => TEXTURAS[t]?.nome ?? t

export function descreverPego(p: Pego): string {
  switch (p.tipo) {
    case 'parede': return `Parede: ${nomeTex(p.side.tex)}${p.side.base ? ` com barra de ${nomeTex(p.side.base.tex)} (${p.side.base.h.toFixed(1).replace('.', ',')} m)` : ''}`
    case 'piso': return `Piso: ${nomeTex(p.top)} · teto de baixo: ${nomeTex(p.bottom)}`
    case 'objeto': return `Objeto: ${OBJETOS[p.type]?.nome ?? p.type} (${Math.round(p.rot)}°)`
    case 'abertura': return `Porta ou janela: ${p.tipoAbertura === 'vao' ? `vão de ${p.width} m` : p.tipoAbertura}`
    case 'escada': return `Escada: degraus de ${nomeTex(p.tex)}`
  }
}

const noTeto = (t: string) => OBJETOS[t]?.apoio === 'teto'

/** O que está sob o raio do mouse, do mais perto para o mais longe. */
function pegar(doc: MapDoc, andar: number, e: ThreeEvent<PointerEvent>): Pego | null {
  const { origin: o, direction: d } = e.ray, O: [number, number, number] = [o.x, o.y, o.z], D: [number, number, number] = [d.x, d.y, d.z]
  const obj = objetoNoRaioT(doc, andar, O, D, tamDe, noTeto)
  const par = paredeNoRaioT(doc, andar, O, D, LEVEL_H, pontoCortado)
  if (obj && (!par || obj.t <= par.t)) return { tipo: 'objeto', type: obj.p.type, rot: obj.p.rot[1] }
  if (par) {
    const ab = aberturaNo(doc, par.seg)
    if (ab) {
      const [h0, h1] = buraco(ab), h = par.y - andar * LEVEL_H
      if (h >= h0 && h <= h1) {
        const t: TipoAbertura = ab.kind === 'janela' ? (ab.window === 'grande' ? 'janela-grande' : 'janela') : (ab.door ?? 'comum')
        return { tipo: 'abertura', tipoAbertura: t, width: ab.width }
      }
    }
    const w = Object.values(doc.chunks).flatMap((c) => c.walls).find((x) => x.level === par.seg.level && x.axis === par.seg.axis && x.x === par.seg.x && x.z === par.seg.z)
    if (w) return { tipo: 'parede', side: w[ladoVisto(par.seg, D)] }
  }
  const esc = escadaEm(doc, andar, e.point.x, e.point.z)
  if (esc) return { tipo: 'escada', tex: esc.tex }
  const fx = Math.floor(e.point.x), fz = Math.floor(e.point.z)
  const f = Object.values(doc.chunks).flatMap((c) => c.floors).find((t) => t.level === andar && t.x === fx && t.z === fz)
  return f ? { tipo: 'piso', top: f.top, bottom: f.bottom } : null
}

interface Props { doc: MapDoc; andar: number; onPegar: (p: Pego) => void; onInfo: (t: string) => void }

export function FerramentaContaGotas({ doc, andar, onPegar, onInfo }: Props) {
  const [mira, setMira] = useState<string>('')
  useEffect(() => { onInfo(mira ? `${mira} · clique para pegar` : 'Aponte para uma parede, piso, porta, janela, escada ou objeto') }, [mira, onInfo])
  const y = andar * LEVEL_H
  return (
    <mesh position={[0, y, 0]} rotation-x={-Math.PI / 2}
      onPointerMove={(e) => { const p = pegar(doc, andar, e); const t = p ? descreverPego(p) : ''; if (t !== mira) setMira(t) }}
      onPointerDown={(e) => { if (e.button !== 0) return; e.stopPropagation(); const p = pegar(doc, andar, e); if (p) onPegar(p) }}
      onPointerLeave={() => setMira('')}>
      <planeGeometry args={[4000, 4000]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  )
}
