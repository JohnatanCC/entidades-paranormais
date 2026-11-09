// A ferramenta de portas e janelas: aponte para uma parede e clique para pôr o tipo escolhido (a prévia mostra onde
// cabe: âmbar = cabe, vermelho = não cabe). Clique numa porta ou janela que já existe para escolher (o painel mostra
// as propriedades dela); Ctrl + clique apaga. Precisa de parede reta livre em todos os pedaços da largura.
import { useEffect, useMemo, useState } from 'react'
import type { ThreeEvent } from '@react-three/fiber'
import { LEVEL_H, type DoorKind, type Opening, type WindowKind } from '../maps/types'
import { aberturaNo, aberturas, ladoDeDentro, ladoVisto, ondeCabe, paredeNoRaio, pedacosDe, type Lado, type MapDoc, type Seg } from './doc'
import { ESPESSURA, buraco } from './wallMesh'

export type TipoAbertura = 'comum' | 'dupla' | 'grande' | 'vao' | 'janela' | 'janela-grande'

export const TIPOS: Record<TipoAbertura, { nome: string; kind: 'porta' | 'janela'; door?: DoorKind; window?: WindowKind; width: number }> = {
  comum: { nome: 'Porta comum', kind: 'porta', door: 'comum', width: 1 },
  dupla: { nome: 'Porta dupla', kind: 'porta', door: 'dupla', width: 2 },
  grande: { nome: 'Porta grande', kind: 'porta', door: 'grande', width: 2 },
  vao: { nome: 'Vão (sem porta)', kind: 'porta', door: 'vao', width: 1 },
  janela: { nome: 'Janela', kind: 'janela', window: 'normal', width: 1 },
  'janela-grande': { nome: 'Janela grande', kind: 'janela', window: 'grande', width: 2 },
}

/** A abertura nova do tipo, começando em (x, z) do pedaço; o vão tem a largura escolhida. lado = o lado de dentro
 *  (a porta abre para dentro do cômodo; o luar da janela cai do lado de dentro). */
export function aberturaNova(tipo: TipoAbertura, s: Seg, inicio: { x: number; z: number }, larguraVao: number, lado: Lado = 'b'): Omit<Opening, 'id'> {
  const t = TIPOS[tipo], width = tipo === 'vao' ? larguraVao : t.width
  const base = { level: s.level, axis: s.axis, x: inicio.x, z: inicio.z, width, kind: t.kind }
  return t.kind === 'porta'
    ? { ...base, door: t.door, ...(t.door === 'vao' ? {} : { estado: 'fechada' as const, lado, tex: 'porta-madeira' }) }
    : { ...base, window: t.window, light2d: true, lado }
}

interface Props {
  doc: MapDoc
  andar: number
  tipo: TipoAbertura
  larguraVao: number
  selecionada: string | null
  onPor: (o: Omit<Opening, 'id'>) => void
  onSelecionar: (id: string | null) => void
  onApagar: (id: string) => void
  onInfo: (texto: string) => void
}

export function FerramentaAberturas({ doc, andar, tipo, larguraVao, selecionada, onPor, onSelecionar, onApagar, onInfo }: Props) {
  const [seg, setSeg] = useState<Seg | null>(null)
  const [visto, setVisto] = useState<Lado>('a') // o lado da parede que a câmera vê (para adivinhar o lado de dentro)
  const y = andar * LEVEL_H
  const width = tipo === 'vao' ? larguraVao : TIPOS[tipo].width

  // o que está sob o mouse: uma abertura que já existe, ou onde a nova caberia
  const mira = useMemo(() => {
    if (!seg) return null
    const ex = aberturaNo(doc, seg)
    if (ex) return { existe: ex }
    const r = ondeCabe(doc, seg, width)
    return 'erro' in r ? { erro: r.erro, nova: aberturaNova(tipo, seg, seg, larguraVao) } : { nova: aberturaNova(tipo, seg, r, larguraVao, ladoDeDentro(doc, seg, visto)) }
  }, [seg, doc, width, tipo, larguraVao, visto])

  useEffect(() => {
    if (!mira) onInfo('Aponte para uma parede')
    else if (mira.existe) onInfo(`${nomeDe(mira.existe)} · clique escolhe · Ctrl + clique apaga`)
    else if (mira.erro) onInfo(mira.erro)
    else onInfo(`${TIPOS[tipo].nome}${tipo === 'vao' ? ` de ${width} m` : ''} · clique para pôr`)
  }, [mira, tipo, width, onInfo])

  const alvo = (e: ThreeEvent<PointerEvent>) => {
    const { origin: o, direction: d } = e.ray
    return paredeNoRaio(doc, andar, [o.x, o.y, o.z], [d.x, d.y, d.z], LEVEL_H) ?? null
  }
  function move(e: ThreeEvent<PointerEvent>) {
    const s = alvo(e)
    if (s?.x !== seg?.x || s?.z !== seg?.z || s?.axis !== seg?.axis) setSeg(s)
    if (s) { const v = ladoVisto(s, [e.ray.direction.x, e.ray.direction.y, e.ray.direction.z]); if (v !== visto) setVisto(v) }
  }
  function down(e: ThreeEvent<PointerEvent>) {
    if (e.button !== 0) return
    e.stopPropagation()
    const s = alvo(e)
    if (!s) { onSelecionar(null); return }
    const ex = aberturaNo(doc, s)
    if (ex) { if (e.ctrlKey) onApagar(ex.id); else onSelecionar(ex.id); return }
    const r = ondeCabe(doc, s, width)
    if ('erro' in r) onInfo(r.erro)
    else onPor(aberturaNova(tipo, s, r, larguraVao, ladoDeDentro(doc, s, ladoVisto(s, [e.ray.direction.x, e.ray.direction.y, e.ray.direction.z]))))
  }

  const sel = selecionada ? aberturas(doc).find((o) => o.id === selecionada) : undefined
  return (
    <group>
      <mesh position={[0, y, 0]} rotation-x={-Math.PI / 2} onPointerDown={down} onPointerMove={move} onPointerLeave={() => setSeg(null)}>
        <planeGeometry args={[4000, 4000]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      {sel && <Marca o={sel} cor="#e8b765" opacidade={0.45} />}
      {mira?.existe && mira.existe.id !== selecionada && <Marca o={mira.existe} cor="#e8b765" opacidade={0.22} />}
      {mira?.nova && <Marca o={mira.nova} cor={mira.erro ? '#c2453a' : '#e8b765'} opacidade={0.35} />}
    </group>
  )
}

export function nomeDe(o: Opening) {
  if (o.kind === 'janela') return o.window === 'grande' ? 'Janela grande' : 'Janela'
  return { comum: 'Porta comum', dupla: 'Porta dupla', grande: 'Porta grande', vao: `Vão de ${o.width} m` }[o.door ?? 'comum']
}

/** Uma caixa transparente cobrindo o vão da abertura (prévia, mira, escolhida). */
function Marca({ o, cor, opacidade }: { o: Omit<Opening, 'id'>; cor: string; opacidade: number }) {
  const [h0, h1] = buraco(o as Opening), ps = pedacosDe(o), p0 = ps[0], y0 = o.level * LEVEL_H
  const cx = o.axis === 'x' ? p0.x + o.width / 2 : p0.x, cz = o.axis === 'z' ? p0.z + o.width / 2 : p0.z
  return (
    <mesh position={[cx, y0 + (h0 + h1) / 2, cz]} rotation-y={o.axis === 'x' ? 0 : Math.PI / 2}>
      <boxGeometry args={[o.width + 0.04, h1 - h0 + 0.04, ESPESSURA * 2.2]} />
      <meshBasicMaterial color={cor} transparent opacity={opacidade} depthWrite={false} />
    </mesh>
  )
}
