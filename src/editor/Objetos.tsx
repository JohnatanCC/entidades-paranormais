// Os objetos do mapa, montados a partir do catálogo (maps/objetos.ts): cada peça vira uma malha com o material da paleta.
// A lâmpada de teto acende de verdade (uma luz pontual quente): normal, falhando (pisca) ou apagada.
// Tipo que não existe no catálogo aparece como uma caixa vermelha de arame, para você ver e trocar.
import { memo, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { MATERIAIS, OBJETOS, type Peca } from '../maps/objetos'
import type { Chunk, Prop } from '../maps/types'
import { applyPsx } from '../render/psx'

const mats = new Map<string, THREE.Material>()
export function materialObj(k: string): THREE.Material {
  let m = mats.get(k)
  if (!m) {
    const cor = MATERIAIS[k] ?? '#ff00ff'
    m = k.startsWith('luz:') ? new THREE.MeshBasicMaterial({ color: cor }) : applyPsx(new THREE.MeshStandardMaterial({ color: cor, roughness: 0.85 }))
    mats.set(k, m)
  }
  return m
}
export const FANTASMA = new THREE.MeshBasicMaterial({ color: '#e8b765', transparent: true, opacity: 0.45, depthWrite: false })
export const FANTASMA_ERRO = new THREE.MeshBasicMaterial({ color: '#c2453a', transparent: true, opacity: 0.45, depthWrite: false })

const rad = (v: number) => (v * Math.PI) / 180

function PecaMesh({ p, mat }: { p: Peca; mat?: THREE.Material }) {
  const [forma, s, pos, m, rot] = p
  const r = rot ? ([rad(rot[0]), rad(rot[1]), rad(rot[2])] as [number, number, number]) : undefined
  const material = mat ?? materialObj(m)
  return (
    <mesh position={pos} rotation={r} material={material} castShadow receiveShadow>
      {forma === 'caixa' ? <boxGeometry args={[s[0], s[1], s[2]]} />
        : forma === 'esfera' ? <sphereGeometry args={[s[0], 10, 8]} />
        : forma === 'cone' ? <coneGeometry args={[s[1], s[2], 8]} />
        : <cylinderGeometry args={[s[0], s[1], s[2], 10]} />}
    </mesh>
  )
}

// ---------- o contorno (escolhido, prévia, mira): a "casca invertida" ----------
// Cada peça é desenhada de novo um pouco maior, só pelo lado de dentro e numa cor só: o que sobra em volta do objeto
// vira um contorno do tamanho certo, sem esconder o objeto de verdade.
const ESPESSURA_CONTORNO = 0.03
const cascas = new Map<string, THREE.Material>()
const casca = (cor: string) => {
  let m = cascas.get(cor)
  if (!m) { m = new THREE.MeshBasicMaterial({ color: cor, side: THREE.BackSide }); cascas.set(cor, m) }
  return m
}
export const COR_ESCOLHIDO = '#f2c14e', COR_MIRA = '#9a7a40'

function escalaCasca([forma, s]: Peca): [number, number, number] {
  const t = ESPESSURA_CONTORNO, k = (v: number) => (v + 2 * t) / Math.max(v, 1e-3)
  if (forma === 'caixa') return [k(s[0]), k(s[1]), k(s[2])]
  if (forma === 'esfera') { const e = (s[0] + t) / s[0]; return [e, e, e] }
  const r = Math.max(s[0], s[1]), e = (r + t) / r
  return [e, k(s[2]), e]
}

/** O contorno do objeto (some atrás do que estiver na frente dele, como o resto da cena). */
export const Contorno = memo(function Contorno({ type, cor = COR_ESCOLHIDO }: { type: string; cor?: string }) {
  const def = OBJETOS[type]
  if (!def) return null
  return <>{def.pecas.map((p, i) => {
    const [forma, s, pos, , rot] = p
    const r = rot ? ([rad(rot[0]), rad(rot[1]), rad(rot[2])] as [number, number, number]) : undefined
    return (
      <mesh key={i} position={pos} rotation={r} scale={escalaCasca(p)} material={casca(cor)}>
        {forma === 'caixa' ? <boxGeometry args={[s[0], s[1], s[2]]} />
          : forma === 'esfera' ? <sphereGeometry args={[s[0], 10, 8]} />
          : forma === 'cone' ? <coneGeometry args={[s[1], s[2], 8]} />
          : <cylinderGeometry args={[s[0], s[1], s[2], 10]} />}
      </mesh>
    )
  })}</>
})

/** O modelo de um tipo do catálogo, no referencial dele (origem no centro da base). mat = troca todos os materiais (prévia). */
export const Modelo = memo(function Modelo({ type, mat, params }: { type: string; mat?: THREE.Material; params?: Record<string, unknown> }) {
  const def = OBJETOS[type]
  if (!def) return <mesh position-y={0.25}><boxGeometry args={[0.5, 0.5, 0.5]} /><meshBasicMaterial color="#c2453a" wireframe /></mesh>
  const apagada = type === 'lampada-teto' && params?.modo === 'apagada'
  return <>{def.pecas.map((p, i) => <PecaMesh key={i} p={apagada && p[3] === 'luz:lampada' ? [p[0], p[1], p[2], 'luz:apagada', p[4]] : p} mat={mat} />)}</>
})

/** A posição e a rotação de um objeto (yaw por fora, depois inclinação: o modo livre gira em qualquer eixo). */
export function Colocado({ p, children }: { p: Pick<Prop, 'pos' | 'rot'>; children: React.ReactNode }) {
  const r = useMemo(() => new THREE.Euler(rad(p.rot[0]), rad(p.rot[1]), rad(p.rot[2]), 'YXZ'), [p.rot])
  return <group position={p.pos} rotation={r}>{children}</group>
}

function Luz({ modo }: { modo: string }) {
  const luz = useRef<THREE.PointLight>(null)
  useFrame(({ clock }) => {
    if (!luz.current || modo !== 'falhando') return
    // falhando: a maior parte do tempo acesa, com quedas curtas e irregulares
    const t = clock.elapsedTime, n = Math.sin(t * 13.1) * Math.sin(t * 7.3 + 1.7) * Math.sin(t * 2.9)
    luz.current.intensity = n > 0.35 ? 0.4 : 6
  })
  if (modo === 'apagada') return null
  return <pointLight ref={luz} position-y={-0.4} color="#e0a050" intensity={6} distance={7} decay={1.6} />
}

export function Objetos({ chunks, maxLevel, ocultar }: { chunks: Chunk[]; maxLevel: number; ocultar?: string | null }) {
  const lista = useMemo(() => chunks.flatMap((c) => c.props).filter((p) => p.level <= maxLevel && p.id !== ocultar), [chunks, maxLevel, ocultar])
  return (
    <group>
      {lista.map((p) => (
        <Colocado key={p.id} p={p}>
          <Modelo type={p.type} params={p.params} />
          {p.type === 'lampada-teto' && <Luz modo={(p.params?.modo as string) ?? 'normal'} />}
        </Colocado>
      ))}
    </group>
  )
}
