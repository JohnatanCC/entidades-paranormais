// Os objetos do mapa: cada um é uma cópia do modelo do Blockbench do tipo dele (render/objetos3d.ts), que divide a
// geometria e a textura com os outros do mesmo tipo. Objeto com luz no catálogo (as lâmpadas, o lustre, a arandela, o
// abajur, o castiçal...) acende de verdade, uma luz pontual: normal, falhando (pisca) ou apagada. Tipo sem modelo aparece
// como uma caixa vermelha de arame, para você ver e trocar.
import { memo, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { OBJETOS, type ObjDef } from '../maps/objetos'
import type { Chunk, Prop } from '../maps/types'
import { ASSADA } from '../render/assada'
import { casca3d, objeto3d } from '../render/objetos3d'

export const COR_ESCOLHIDO = '#f2c14e', COR_MIRA = '#9a7a40'
const rad = (v: number) => (v * Math.PI) / 180

/** O modelo de um tipo do catálogo, no referencial dele (origem no centro da base). */
export const Modelo = memo(function Modelo({ type, params }: { type: string; params?: Record<string, unknown> }) {
  const apagada = !!OBJETOS[type]?.luz && params?.modo === 'apagada'
  // objeto3d na lista: salvar o .bbmodel recarrega o módulo e a cópia é feita de novo
  const obj = useMemo(() => objeto3d(type, { apagada }), [type, apagada, objeto3d])
  return <primitive object={obj} />
})

/** O contorno do objeto (escolhido, prévia, mira): some atrás do que estiver na frente dele, como o resto da cena. */
export const Contorno = memo(function Contorno({ type, cor = COR_ESCOLHIDO }: { type: string; cor?: string }) {
  const obj = useMemo(() => casca3d(type, cor), [type, cor, casca3d])
  return <primitive object={obj} />
})

/** A posição e a rotação de um objeto (yaw por fora, depois inclinação: o modo livre gira em qualquer eixo). */
export function Colocado({ p, children }: { p: Pick<Prop, 'pos' | 'rot'>; children: React.ReactNode }) {
  const r = useMemo(() => new THREE.Euler(rad(p.rot[0]), rad(p.rot[1]), rad(p.rot[2]), 'YXZ'), [p.rot])
  return <group position={p.pos} rotation={r}>{children}</group>
}

function Luz({ modo, luz: l }: { modo: string; luz: NonNullable<ObjDef['luz']> }) {
  const luz = useRef<THREE.PointLight>(null)
  useFrame(({ clock }) => {
    if (!luz.current || modo !== 'falhando') return
    // falhando: a maior parte do tempo acesa, com quedas curtas e irregulares
    // (com a luz assada ligada, todas as que falham piscam juntas, no ritmo da malha: render/assada.ts)
    const t = clock.elapsedTime, n = Math.sin(t * 13.1) * Math.sin(t * 7.3 + 1.7) * Math.sin(t * 2.9)
    luz.current.intensity = ASSADA.ligada ? (l.forca ?? 6) * ASSADA.pisca.value : n > 0.35 ? 0.4 : (l.forca ?? 6)
  })
  if (modo === 'apagada') return null
  return <pointLight ref={luz} position={l.pos} color={l.cor ?? '#e0a050'} intensity={l.forca ?? 6} distance={l.alcance ?? 7} decay={1.6} />
}

export function Objetos({ chunks, maxLevel, ocultar }: { chunks: Chunk[]; maxLevel: number; ocultar?: string | null }) {
  const lista = useMemo(() => chunks.flatMap((c) => c.props).filter((p) => p.level <= maxLevel && p.id !== ocultar), [chunks, maxLevel, ocultar])
  return (
    <group>
      {lista.map((p) => (
        <Colocado key={p.id} p={p}>
          <Modelo type={p.type} params={p.params} />
          {OBJETOS[p.type]?.luz && <Luz modo={(p.params?.modo as string) ?? 'normal'} luz={OBJETOS[p.type].luz!} />}
        </Colocado>
      ))}
    </group>
  )
}
