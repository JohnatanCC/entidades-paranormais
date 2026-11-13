// Os objetos do mapa: cada um é uma cópia do modelo do Blockbench do tipo dele (render/objetos3d.ts), que divide a
// geometria e a textura com os outros do mesmo tipo. Objeto com luz no catálogo (as lâmpadas, o lustre, a arandela, o
// abajur, o castiçal...) acende de verdade, uma luz pontual: normal, falhando (pisca) ou apagada. Tipo sem modelo aparece
// como uma caixa vermelha de arame, para você ver e trocar. No jogo (juntar), os que não acendem viram uma malha de
// cópias por peça de cada tipo (render/instancias.ts): bem menos chamadas de desenho.
import { memo, useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { FORCA_LUZ, OBJETOS, type ObjDef } from '../maps/objetos'
import { assadorDe, idLampada, novaLuzVertice, type Assador } from '../maps/luzAssada'
import type { Chunk, Prop } from '../maps/types'
import { ASSADA, iluminarObjeto, materiaisDoObjeto } from '../render/assada'
import { casca3d, objeto3d } from '../render/objetos3d'
import { objetosJuntos } from '../render/instancias'
import { lampadaNaCena } from '../render/sombras'

export const COR_ESCOLHIDO = '#f2c14e', COR_MIRA = '#9a7a40'
const rad = (v: number) => (v * Math.PI) / 180

/** O modelo de um tipo do catálogo, no referencial dele (origem no centro da base). */
export const Modelo = memo(function Modelo({ type, params, luz }: { type: string; params?: Record<string, unknown>; luz?: { assa: Assador; p: Prop } }) {
  const apagada = !!OBJETOS[type]?.luz && params?.modo === 'apagada'
  // objeto3d na lista: salvar o .bbmodel recarrega o módulo e a cópia é feita de novo
  const obj = useMemo(() => {
    const o = objeto3d(type, { apagada })
    // a peça que tem a lâmpada dentro não faz sombra (a cúpula do abajur taparia a própria luz)
    if (OBJETOS[type]?.luz) o.traverse((x) => { x.castShadow = false })
    return o
  }, [type, apagada, objeto3d])
  // a luz assada do lugar onde o objeto está (uma amostra no meio dele); o objeto ganha materiais só dele para isso
  useEffect(() => {
    if (!luz) return
    const descartar = materiaisDoObjeto(obj), def = OBJETOS[type], h = (def?.tam[1] ?? 1) / 2, { p } = luz
    const y = p.pos[1] + (def?.apoio === 'teto' ? -h : h), ponto: [number, number, number] = [p.pos[0], y, p.pos[2]]
    const amostra = novaLuzVertice()
    luz.assa(ponto, null, ponto, p.level, amostra)
    iluminarObjeto(obj, amostra)
    return descartar
  }, [obj, luz?.assa, luz?.p.pos, luz?.p.level])
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
  const luz = useRef<THREE.PointLight>(null), forca = l.forca ?? FORCA_LUZ.forca
  useFrame(({ clock }) => {
    if (!luz.current || modo !== 'falhando') return
    // falhando: a maior parte do tempo acesa, com quedas curtas e irregulares
    // (no jogo, todas as que falham piscam juntas, no ritmo da malha: render/assada.ts)
    const t = clock.elapsedTime, n = Math.sin(t * 13.1) * Math.sin(t * 7.3 + 1.7) * Math.sin(t * 2.9)
    luz.current.intensity = ASSADA.modo !== 'nao' ? forca * ASSADA.pisca.value : n > 0.35 ? 0.4 : forca
  })
  // a lâmpada se apresenta: no nível Alto, as mais perto do agente fazem sombra (render/sombras.ts)
  // (o número dela é o mesmo que a malha guarda: é como o jogo sabe qual luz assada tirar quando esta faz sombra)
  useEffect(() => {
    const L = luz.current
    if (!L) return
    const p = L.getWorldPosition(new THREE.Vector3())
    L.userData.id = idLampada(p.x, p.y, p.z)
    return lampadaNaCena(L)
  }, [modo])
  if (modo === 'apagada') return null
  return <pointLight ref={luz} position={l.pos} color={l.cor ?? FORCA_LUZ.cor} intensity={forca} distance={l.alcance ?? FORCA_LUZ.alcance} decay={1.6} />
}

export function Objetos({ chunks, maxLevel, ocultar, juntar }: { chunks: Chunk[]; maxLevel: number; ocultar?: string | null; juntar?: boolean }) {
  const todos = useMemo(() => chunks.flatMap((c) => c.props).filter((p) => p.level <= maxLevel && p.id !== ocultar), [chunks, maxLevel, ocultar])
  const assa = useMemo(() => assadorDe(chunks), [chunks])
  // juntando: os que acendem ficam soltos (cada um tem a luz de verdade dele); os outros, juntos
  const lista = useMemo(() => (juntar ? todos.filter((p) => OBJETOS[p.type]?.luz) : todos), [todos, juntar])
  const juntos = useMemo(() => (juntar ? objetosJuntos(todos.filter((p) => !OBJETOS[p.type]?.luz && OBJETOS[p.type]), assa) : null), [todos, juntar, assa, objetosJuntos])
  useEffect(() => () => juntos?.descartar(), [juntos])
  return (
    <group>
      {juntos && <primitive object={juntos.grupo} />}
      {lista.map((p) => (
        <Colocado key={p.id} p={p}>
          <Modelo type={p.type} params={p.params} luz={{ assa, p }} />
          {OBJETOS[p.type]?.luz && <Luz modo={(p.params?.modo as string) ?? 'normal'} luz={OBJETOS[p.type].luz!} />}
        </Colocado>
      ))}
    </group>
  )
}
