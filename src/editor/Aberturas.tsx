// As portas e janelas por cima das paredes (o vão e o batente por dentro da espessura saem em wallMesh.ts):
//   porta: as guarnições dos dois lados e as folhas (dupla e grande têm duas), fechadas ou abertas para o lado escolhido;
//          trancada ganha um cadeado vermelho (só no editor, para você ver); no Testar, as folhas seguem o estado vivo
//          das portas (game/world/portas.ts): abrem e fecham girando;
//   janela: as guarnições, o parapeito, o vidro e os caixilhos (como as do laboratório) e o luar 2D (Luar.tsx): o feixe
//          macio entrando pelo lado de dentro, a mancha no chão, o brilho no vidro e a poeira.
// Cada abertura é desenhada no seu próprio referencial: u ao longo da parede, y para cima, z atravessando.
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { PortaViva, PortasVivas } from '../game/world/portas'
import { LEVEL_H, type Chunk, type Opening } from '../maps/types'
import { BATENTE, VIDRO, materialDe } from '../render/materiais'
import { aplicarCorte } from '../render/corte'
import { ESPESSURA, buraco } from './wallMesh'
import { Luar } from './Luar'

const T2 = ESPESSURA / 2
const FW = 0.08 // a largura da guarnição
const ABERTA = 1.4 // quanto a folha aberta gira (rad, ~80°)

const latao = aplicarCorte(new THREE.MeshStandardMaterial({ color: '#6a5630', roughness: 0.5 }))
const cadeado = aplicarCorte(new THREE.MeshBasicMaterial({ color: '#c2453a' }))

export function Aberturas({ chunks, maxLevel, portas }: { chunks: Chunk[]; maxLevel: number; portas?: PortasVivas }) {
  const lista = useMemo(() => chunks.flatMap((c) => c.openings).filter((o) => o.level <= maxLevel), [chunks, maxLevel])
  return <group>{lista.map((o) => <Abertura key={o.id} o={o} viva={portas?.get(o.id)} />)}</group>
}

/** O referencial da abertura: origem no começo do vão, no chão do andar; u = +x local. sb = o sinal de z local do lado b. */
export function referencial(o: Opening) {
  return { pos: [o.x, o.level * LEVEL_H, o.z] as [number, number, number], rotY: o.axis === 'x' ? 0 : -Math.PI / 2, sb: o.axis === 'x' ? 1 : -1 }
}

function Caixa({ u0, u1, y0, y1, z0, z1, m }: { u0: number; u1: number; y0: number; y1: number; z0: number; z1: number; m: THREE.Material }) {
  return <mesh position={[(u0 + u1) / 2, (y0 + y1) / 2, (z0 + z1) / 2]} material={m}><boxGeometry args={[u1 - u0, y1 - y0, Math.abs(z1 - z0)]} /></mesh>
}

function Abertura({ o, viva }: { o: Opening; viva?: PortaViva }) {
  const { pos, rotY, sb } = referencial(o)
  const W = o.width, [h0, h1] = buraco(o), bat = materialDe(BATENTE, true)
  const lados = [-1, 1]
  return (
    <group position={pos} rotation-y={rotY}>
      {/* as guarnições dos dois lados (e o parapeito da janela) */}
      {lados.map((z) => {
        const zf = z * T2, zo = z * (T2 + 0.03), y0 = o.kind === 'janela' ? h0 - 0.06 : h0
        return (
          <group key={z}>
            <Caixa u0={-FW} u1={0} y0={y0} y1={h1 + FW} z0={zf} z1={zo} m={bat} />
            <Caixa u0={W} u1={W + FW} y0={y0} y1={h1 + FW} z0={zf} z1={zo} m={bat} />
            <Caixa u0={0} u1={W} y0={h1} y1={h1 + FW} z0={zf} z1={zo} m={bat} />
            {o.kind === 'janela' && <Caixa u0={-0.12} u1={W + 0.12} y0={h0 - 0.05} y1={h0} z0={zf} z1={z * (T2 + 0.07)} m={bat} />}
          </group>
        )
      })}
      {o.kind === 'porta' ? <Folhas o={o} sb={sb} h1={h1} viva={viva} /> : <Janela o={o} sb={sb} h0={h0} h1={h1} />}
    </group>
  )
}

function Folhas({ o, sb, h1, viva }: { o: Opening; sb: number; h1: number; viva?: PortaViva }) {
  const grupos = useRef<(THREE.Group | null)[]>([])
  // no Testar: o ângulo vem do estado vivo (suavizado no começo e no fim do giro)
  useFrame(() => {
    if (!viva) return
    const z = viva.lado === 'b' ? sb : -sb, e = viva.ang * viva.ang * (3 - 2 * viva.ang)
    grupos.current.forEach((g, i) => { if (g) g.rotation.y = -(i === 0 ? 1 : -1) * z * ABERTA * e })
  })
  if (o.door === 'vao') return null
  const n = o.door === 'dupla' || o.door === 'grande' ? 2 : 1, W = o.width
  const lw = W / n - 0.02, lh = h1 - 0.02
  const zLado = (o.lado ?? 'b') === 'b' ? sb : -sb // para que lado (z local) a folha abre
  const ang = (o.estado ?? 'fechada') === 'aberta' ? ABERTA : 0
  const folha = materialDe(o.tex ?? 'porta-madeira', true)
  return (
    <>
      {Array.from({ length: n }, (_, i) => {
        const dir = i === 0 ? 1 : -1 // a folha 0 sai da dobradiça em u = 0 para +u; a 1 sai de u = W para −u
        // girar φ em y leva +u para (cos φ, −sin φ): para a folha ir para o lado zLado, φ = −dir·zLado·ang
        const phi = -dir * zLado * ang
        return (
          <group key={i} ref={(g) => { grupos.current[i] = g }} position={[i === 0 ? 0.01 : W - 0.01, 0, 0]} rotation-y={phi}>
            <mesh position={[dir * lw / 2, lh / 2 + 0.01, 0]} material={folha}><boxGeometry args={[lw, lh, 0.05]} /></mesh>
            {[-1, 1].map((z) => <mesh key={z} position={[dir * (lw - 0.09), 1.02, z * 0.045]} material={latao}><boxGeometry args={[0.05, 0.05, 0.04]} /></mesh>)}
            {o.estado === 'trancada' && !viva && [-1, 1].map((z) => <mesh key={'c' + z} position={[dir * (lw - 0.09), 0.92, z * 0.05]} material={cadeado}><boxGeometry args={[0.07, 0.09, 0.03]} /></mesh>)}
          </group>
        )
      })}
    </>
  )
}

function Janela({ o, sb, h0, h1 }: { o: Opening; sb: number; h0: number; h1: number }) {
  const W = o.width, bat = materialDe(BATENTE, true), vidro = materialDe(VIDRO, true)
  const um = W / 2, vm = (h0 + h1) / 2, b = 0.05
  // os caixilhos: a moldura, o encontro das folhas da guilhotina, as divisões
  const verticais = useMemo(() => (o.window === 'grande' ? [W * 0.25, W * 0.5, W * 0.75] : [W / 2]), [o.window, W])
  const zIn = (o.lado ?? 'b') === 'b' ? sb : -sb // o lado de dentro (z local)
  return (
    <>
      <mesh position={[um, vm, 0]} material={vidro}><boxGeometry args={[W, h1 - h0, 0.01]} /></mesh>
      <Caixa u0={0} u1={b} y0={h0} y1={h1} z0={-0.03} z1={0.03} m={bat} />
      <Caixa u0={W - b} u1={W} y0={h0} y1={h1} z0={-0.03} z1={0.03} m={bat} />
      <Caixa u0={0} u1={W} y0={h0} y1={h0 + b} z0={-0.03} z1={0.03} m={bat} />
      <Caixa u0={0} u1={W} y0={h1 - b} y1={h1} z0={-0.03} z1={0.03} m={bat} />
      <Caixa u0={0} u1={W} y0={vm - 0.03} y1={vm + 0.03} z0={-0.03} z1={0.03} m={bat} />
      {verticais.map((u) => <Caixa key={u} u0={u - 0.02} u1={u + 0.02} y0={h0} y1={h1} z0={-0.03} z1={0.03} m={bat} />)}
      {o.light2d !== false && <Luar W={W} h0={h0} h1={h1} zIn={zIn} verticais={verticais} />}
    </>
  )
}

