// As portas e janelas por cima das paredes (o vão e o batente por dentro da espessura saem em wallMesh.ts):
//   porta: as guarnições dos dois lados e as folhas (dupla e grande têm duas), fechadas ou abertas para o lado escolhido;
//          trancada ganha um cadeado vermelho (só no editor, para você ver);
//   janela: as guarnições, o parapeito, o vidro e os caixilhos (como as do laboratório) e o luar 2D: o feixe desenhado
//          entrando pelo lado de dentro e a mancha no chão.
// Cada abertura é desenhada no seu próprio referencial: u ao longo da parede, y para cima, z atravessando.
import { useMemo } from 'react'
import * as THREE from 'three'
import { LEVEL_H, type Chunk, type Opening } from '../maps/types'
import { BATENTE, VIDRO, materialDe } from '../render/materiais'
import { ESPESSURA, buraco } from './wallMesh'

const T2 = ESPESSURA / 2
const FW = 0.08 // a largura da guarnição
const ABERTA = 1.4 // quanto a folha aberta gira (rad, ~80°)
const LUA = new THREE.Vector3(0.12, -0.72, 1).normalize() // o luar desce entrando (no referencial da janela: +z = para dentro)

const latao = new THREE.MeshStandardMaterial({ color: '#6a5630', roughness: 0.5 })
const cadeado = new THREE.MeshBasicMaterial({ color: '#c2453a' })
const feixeMat = new THREE.MeshBasicMaterial({ color: '#a9c2f0', transparent: true, opacity: 0.1, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })
const manchaMat = new THREE.MeshBasicMaterial({ color: '#8fb0e8', transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -8 })

export function Aberturas({ chunks, maxLevel }: { chunks: Chunk[]; maxLevel: number }) {
  const lista = useMemo(() => chunks.flatMap((c) => c.openings).filter((o) => o.level <= maxLevel), [chunks, maxLevel])
  return <group>{lista.map((o) => <Abertura key={o.id} o={o} />)}</group>
}

/** O referencial da abertura: origem no começo do vão, no chão do andar; u = +x local. sb = o sinal de z local do lado b. */
export function referencial(o: Opening) {
  return { pos: [o.x, o.level * LEVEL_H, o.z] as [number, number, number], rotY: o.axis === 'x' ? 0 : -Math.PI / 2, sb: o.axis === 'x' ? 1 : -1 }
}

function Caixa({ u0, u1, y0, y1, z0, z1, m }: { u0: number; u1: number; y0: number; y1: number; z0: number; z1: number; m: THREE.Material }) {
  return <mesh position={[(u0 + u1) / 2, (y0 + y1) / 2, (z0 + z1) / 2]} material={m}><boxGeometry args={[u1 - u0, y1 - y0, Math.abs(z1 - z0)]} /></mesh>
}

function Abertura({ o }: { o: Opening }) {
  const { pos, rotY, sb } = referencial(o)
  const W = o.width, [h0, h1] = buraco(o), bat = materialDe(BATENTE)
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
      {o.kind === 'porta' ? <Folhas o={o} sb={sb} h1={h1} /> : <Janela o={o} sb={sb} h0={h0} h1={h1} />}
    </group>
  )
}

function Folhas({ o, sb, h1 }: { o: Opening; sb: number; h1: number }) {
  if (o.door === 'vao') return null
  const n = o.door === 'dupla' || o.door === 'grande' ? 2 : 1, W = o.width
  const lw = W / n - 0.02, lh = h1 - 0.02
  const zLado = (o.lado ?? 'b') === 'b' ? sb : -sb // para que lado (z local) a folha abre
  const ang = (o.estado ?? 'fechada') === 'aberta' ? ABERTA : 0
  const folha = materialDe(o.tex ?? 'porta-madeira')
  return (
    <>
      {Array.from({ length: n }, (_, i) => {
        const dir = i === 0 ? 1 : -1 // a folha 0 sai da dobradiça em u = 0 para +u; a 1 sai de u = W para −u
        // girar φ em y leva +u para (cos φ, −sin φ): para a folha ir para o lado zLado, φ = −dir·zLado·ang
        const phi = -dir * zLado * ang
        return (
          <group key={i} position={[i === 0 ? 0.01 : W - 0.01, 0, 0]} rotation-y={phi}>
            <mesh position={[dir * lw / 2, lh / 2 + 0.01, 0]} material={folha}><boxGeometry args={[lw, lh, 0.05]} /></mesh>
            {[-1, 1].map((z) => <mesh key={z} position={[dir * (lw - 0.09), 1.02, z * 0.045]} material={latao}><boxGeometry args={[0.05, 0.05, 0.04]} /></mesh>)}
            {o.estado === 'trancada' && [-1, 1].map((z) => <mesh key={'c' + z} position={[dir * (lw - 0.09), 0.92, z * 0.05]} material={cadeado}><boxGeometry args={[0.07, 0.09, 0.03]} /></mesh>)}
          </group>
        )
      })}
    </>
  )
}

function Janela({ o, sb, h0, h1 }: { o: Opening; sb: number; h0: number; h1: number }) {
  const W = o.width, bat = materialDe(BATENTE), vidro = materialDe(VIDRO)
  const um = W / 2, vm = (h0 + h1) / 2, b = 0.05
  // os caixilhos: a moldura, o encontro das folhas da guilhotina, as divisões
  const verticais = useMemo(() => (o.window === 'grande' ? [W * 0.25, W * 0.5, W * 0.75] : [W / 2]), [o.window, W])
  const zIn = (o.lado ?? 'b') === 'b' ? sb : -sb // o lado de dentro (z local)
  const luar = useMemo(() => (o.light2d === false ? null : luarDe(W, h0, h1, zIn, verticais)), [W, h0, h1, zIn, o.light2d, verticais])
  return (
    <>
      <mesh position={[um, vm, 0]} material={vidro}><boxGeometry args={[W, h1 - h0, 0.01]} /></mesh>
      <Caixa u0={0} u1={b} y0={h0} y1={h1} z0={-0.03} z1={0.03} m={bat} />
      <Caixa u0={W - b} u1={W} y0={h0} y1={h1} z0={-0.03} z1={0.03} m={bat} />
      <Caixa u0={0} u1={W} y0={h0} y1={h0 + b} z0={-0.03} z1={0.03} m={bat} />
      <Caixa u0={0} u1={W} y0={h1 - b} y1={h1} z0={-0.03} z1={0.03} m={bat} />
      <Caixa u0={0} u1={W} y0={vm - 0.03} y1={vm + 0.03} z0={-0.03} z1={0.03} m={bat} />
      {verticais.map((u) => <Caixa key={u} u0={u - 0.02} u1={u + 0.02} y0={h0} y1={h1} z0={-0.03} z1={0.03} m={bat} />)}
      {luar && <>
        <mesh geometry={luar.feixe} material={feixeMat} renderOrder={3} />
        <mesh geometry={luar.mancha} material={manchaMat} renderOrder={2} />
      </>}
    </>
  )
}

/** O feixe (as laterais de cada vidro projetadas até o chão) e a mancha no chão, no referencial da janela. */
function luarDe(W: number, h0: number, h1: number, zIn: number, verticais: number[]) {
  const d = new THREE.Vector3(LUA.x, LUA.y, LUA.z * zIn)
  const chao = 0.012
  const proj = (u: number, y: number): [number, number, number] => { const t = (y - chao) / -d.y; return [u + d.x * t, chao, d.z * t] }
  // os vidros: entre os caixilhos, de baixo e de cima da guilhotina
  const cortes = [0, ...verticais, W], vm = (h0 + h1) / 2, g = 0.04
  const vidros: [number, number, number, number][] = []
  for (let i = 0; i < cortes.length - 1; i++) for (const [v0, v1] of [[h0 + 0.05, vm - g], [vm + g, h1 - 0.05]]) vidros.push([cortes[i] + g, cortes[i + 1] - g, v0, v1])
  const fp: number[] = [], mp: number[] = []
  for (const [u0, u1, v0, v1] of vidros) {
    const A: [number, number, number][] = [[u0, v0, 0], [u1, v0, 0], [u1, v1, 0], [u0, v1, 0]], F = A.map(([u, y]) => proj(u, y))
    for (let e = 0; e < 4; e++) { const a0 = A[e], a1 = A[(e + 1) % 4], b0 = F[e], b1 = F[(e + 1) % 4]; fp.push(...a0, ...a1, ...b1, ...a0, ...b1, ...b0) }
    mp.push(...F[0], ...F[1], ...F[2], ...F[0], ...F[2], ...F[3])
  }
  const geo = (p: number[]) => { const gm = new THREE.BufferGeometry(); gm.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); return gm }
  return { feixe: geo(fp), mancha: geo(mp) }
}
