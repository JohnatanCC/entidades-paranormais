// Desenha os blocos carregados de um mapa: pisos (chão em cima, teto embaixo), paredes com os dois lados e o lambri,
// as aberturas (porta: vão até 2,1 m; janela: de 0,9 a 2,1 m), escadas e as lâmpadas. Simples de propósito: é a
// base que o criador de mapas vai usar; o jogo terá a versão otimizada (geometria juntada por bloco).
import { useMemo } from 'react'
import * as THREE from 'three'
import { LEVEL_H, type Chunk, type Opening, type Wall, type WallSide } from '../maps/types'
import { corDe } from '../maps/textures'
import { applyPsx } from '../render/psx'

const T = 0.12 // a espessura da parede (m)
const PORTA_H = 2.1, JANELA_Y0 = 0.9, JANELA_Y1 = 2.1

const mats = new Map<string, THREE.MeshStandardMaterial>()
function mat(cor: string) {
  let m = mats.get(cor)
  if (!m) { m = applyPsx(new THREE.MeshStandardMaterial({ color: cor, roughness: 0.9 })); mats.set(cor, m) }
  return m
}

interface Props { chunks: Chunk[]; maxLevel: number }

export function MapView({ chunks, maxLevel }: Props) {
  const all = useMemo(() => {
    const walls: Wall[] = [], ops: Opening[] = []
    for (const c of chunks) { walls.push(...c.walls); ops.push(...c.openings) }
    return { walls, ops }
  }, [chunks])
  return (
    <group>
      {chunks.map((c) => (
        <group key={`${c.cx}_${c.cz}`}>
          {c.floors.filter((f) => f.level <= maxLevel).map((f) => {
            const y = f.level * LEVEL_H
            return (
              <group key={`f${f.level}_${f.x}_${f.z}`} position={[f.x + 0.5, y, f.z + 0.5]}>
                <mesh rotation-x={-Math.PI / 2} receiveShadow material={mat(corDe(f.top))}><planeGeometry args={[1, 1]} /></mesh>
                <mesh rotation-x={Math.PI / 2} position-y={-0.02} material={mat(corDe(f.bottom))}><planeGeometry args={[1, 1]} /></mesh>
              </group>
            )
          })}
          {c.stairs.filter((s) => s.level <= maxLevel).map((s) => <Escada key={s.id} {...s} />)}
          {c.props.filter((p) => p.level <= maxLevel).map((p) => <Objeto key={p.id} type={p.type} pos={p.pos} rot={p.rot} params={p.params} />)}
        </group>
      ))}
      {all.walls.filter((w) => w.level <= maxLevel).map((w) => <Parede key={`w${w.level}_${w.axis}_${w.x}_${w.z}`} w={w} op={aberturaEm(all.ops, w)} />)}
    </group>
  )
}

/** A abertura que cobre este pedaço de parede, se houver. */
function aberturaEm(ops: Opening[], w: Wall): Opening | undefined {
  return ops.find((o) => o.level === w.level && o.axis === w.axis && (w.axis === 'x'
    ? o.z === w.z && w.x >= o.x && w.x < o.x + o.width
    : o.x === w.x && w.z >= o.z && w.z < o.z + o.width))
}

function Parede({ w, op }: { w: Wall; op?: Opening }) {
  const y0 = w.level * LEVEL_H
  // os trechos de altura que ficam de pé (a abertura tira um pedaço)
  const trechos: [number, number][] = !op ? [[0, LEVEL_H]]
    : op.kind === 'porta' ? (op.door === 'vao' || op.door === 'grande' ? [[op.door === 'grande' ? 2.8 : PORTA_H, LEVEL_H]] : [[PORTA_H, LEVEL_H]])
    : [[0, JANELA_Y0], [JANELA_Y1, LEVEL_H]]
  // o centro do pedaço e a direção: eixo x = a parede corre em x (lado a olha para -z); eixo z = corre em z (lado a olha para -x)
  const cx = w.axis === 'x' ? w.x + 0.5 : w.x, cz = w.axis === 'z' ? w.z + 0.5 : w.z
  const rotY = w.axis === 'x' ? 0 : Math.PI / 2
  return (
    <group position={[cx, y0, cz]} rotation-y={rotY}>
      {trechos.map(([a, b]) => (
        <group key={a}>
          <Lado side={w.a} a={a} b={b} sinal={-1} />
          <Lado side={w.b} a={a} b={b} sinal={1} />
          <mesh position-y={b - 0.005} rotation-x={-Math.PI / 2} material={mat('#2a2622')}><planeGeometry args={[1, T]} /></mesh>
        </group>
      ))}
    </group>
  )
}

/** Um lado da parede entre as alturas a e b: a textura de cima e, se tiver, a barra de baixo (lambri). */
function Lado({ side, a, b, sinal }: { side: WallSide; a: number; b: number; sinal: number }) {
  const z = (sinal * T) / 2, ry = sinal > 0 ? 0 : Math.PI
  const faixas: [number, number, string][] = []
  const hb = side.base ? side.base.h : 0
  if (side.base && a < hb) faixas.push([a, Math.min(b, hb), side.base.tex])
  if (b > Math.max(a, hb)) faixas.push([Math.max(a, hb), b, side.tex])
  return <>{faixas.map(([y0, y1, tex]) => (
    <mesh key={y0} position={[0, (y0 + y1) / 2, z]} rotation-y={ry} castShadow receiveShadow material={mat(corDe(tex))}><planeGeometry args={[1, y1 - y0]} /></mesh>
  ))}</>
}

function Escada({ level, x, z, w, d, dir, rise, tex }: Chunk['stairs'][number]) {
  const n = Math.max(2, Math.round(rise / 0.18)), along = dir === 'norte' || dir === 'sul' ? d : w
  const degraus = Array.from({ length: n }, (_, i) => i)
  const rot = { norte: Math.PI, sul: 0, leste: Math.PI / 2, oeste: -Math.PI / 2 }[dir]
  const largura = dir === 'norte' || dir === 'sul' ? w : d
  return (
    <group position={[x + w / 2, level * LEVEL_H, z + d / 2]} rotation-y={rot}>
      {degraus.map((i) => {
        const h = ((i + 1) * rise) / n, prof = along / n
        return <mesh key={i} position={[0, h / 2, -along / 2 + prof * (i + 0.5)]} castShadow receiveShadow material={mat(corDe(tex))}><boxGeometry args={[largura, h, prof]} /></mesh>
      })}
    </group>
  )
}

/** Os objetos do catálogo. Por enquanto só a lâmpada de teto tem forma; o resto aparece como uma caixa marcada. */
function Objeto({ type, pos, rot, params }: { type: string; pos: [number, number, number]; rot: [number, number, number]; params?: Record<string, unknown> }) {
  const r = rot.map((v) => (v * Math.PI) / 180) as [number, number, number]
  if (type === 'lampada-teto') {
    const modo = (params?.modo as string) || 'normal', acesa = modo !== 'apagada'
    return (
      <group position={pos} rotation={r}>
        <mesh position-y={-0.15}><cylinderGeometry args={[0.2, 0.28, 0.14, 10]} /><meshStandardMaterial color="#3a332b" /></mesh>
        <mesh position-y={-0.25}><sphereGeometry args={[0.09, 8, 6]} /><meshBasicMaterial color={acesa ? '#ffd9a0' : '#3c3833'} /></mesh>
        {acesa && <pointLight position-y={-0.35} color="#e0a050" intensity={modo === 'falhando' ? 4 : 8} distance={7} decay={1.6} />}
      </group>
    )
  }
  return (
    <mesh position={[pos[0], pos[1] + 0.25, pos[2]]} rotation={r}><boxGeometry args={[0.5, 0.5, 0.5]} /><meshStandardMaterial color="#c2453a" wireframe /></mesh>
  )
}
