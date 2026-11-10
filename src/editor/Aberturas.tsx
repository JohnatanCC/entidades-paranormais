// As portas e janelas por cima das paredes (o vão e o batente por dentro da espessura saem em wallMesh.ts). O desenho vem
// do Blockbench (modelos/aberturas/<tipo>.bbmodel, render/objetos3d.ts), igual aos objetos:
//   porta: as guarnições dos dois lados e as folhas (as pastas folha_1 e folha_2 do modelo), fechadas ou abertas para o
//          lado escolhido; trancada ganha um cadeado vermelho (só no editor, para você ver); no Testar, as folhas seguem
//          o estado vivo das portas (game/world/portas.ts): abrem e fecham girando;
//   janela: as guarnições, o parapeito, o vidro e os caixilhos, e o luar 2D (Luar.tsx), calculado aqui pelas medidas do tipo.
// Cada abertura é desenhada no seu próprio referencial: u ao longo da parede, y para cima, z atravessando.
import { useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { PortaViva, PortasVivas } from '../game/world/portas'
import { LEVEL_H, type Chunk, type Opening } from '../maps/types'
import { aplicarCorte } from '../render/corte'
import { abertura3d } from '../render/objetos3d'
import { buraco } from './wallMesh'
import { Luar } from './Luar'

const ABERTA = 1.4 // quanto a folha aberta gira (rad, ~80°)
const cadeado = aplicarCorte(new THREE.MeshBasicMaterial({ color: '#c2453a' }))

export function Aberturas({ chunks, maxLevel, portas }: { chunks: Chunk[]; maxLevel: number; portas?: PortasVivas }) {
  const lista = useMemo(() => chunks.flatMap((c) => c.openings).filter((o) => o.level <= maxLevel), [chunks, maxLevel])
  return <group>{lista.map((o) => <Abertura key={o.id} o={o} viva={portas?.get(o.id)} />)}</group>
}

/** O referencial da abertura: origem no começo do vão, no chão do andar; u = +x local. sb = o sinal de z local do lado b. */
export function referencial(o: Opening) {
  return { pos: [o.x, o.level * LEVEL_H, o.z] as [number, number, number], rotY: o.axis === 'x' ? 0 : -Math.PI / 2, sb: o.axis === 'x' ? 1 : -1 }
}

/** O modelo de cada abertura (o vão não tem: é só o buraco). */
const tipoDe = (o: Opening) => (o.kind === 'janela' ? (o.window === 'grande' ? 'janela-grande' : 'janela') : o.door === 'vao' ? null : `porta-${o.door ?? 'comum'}`)
/** As divisões da janela (onde o luar se parte): as mesmas do modelo. */
const verticaisDe = (o: Opening) => (o.window === 'grande' ? [o.width * 0.25, o.width * 0.5, o.width * 0.75] : [o.width / 2])

function Abertura({ o, viva }: { o: Opening; viva?: PortaViva }) {
  const { pos, rotY, sb } = referencial(o)
  const tipo = tipoDe(o)
  // abertura3d na lista: salvar o .bbmodel recarrega o módulo e a cópia é feita de novo
  const obj = useMemo(() => (tipo ? abertura3d(tipo) : null), [tipo, abertura3d])
  const folhas = useMemo(() => (obj ? [obj.getObjectByName('folha_1'), obj.getObjectByName('folha_2')] : []), [obj])

  // gira as folhas: a 1 sai da dobradiça em u = 0 para +u, a 2 de u = W para −u; abre para o lado escolhido (z local)
  const girar = (ang: number, lado: 'a' | 'b') => {
    const z = lado === 'b' ? sb : -sb
    folhas.forEach((f, i) => { if (f) f.rotation.y = -(i === 0 ? 1 : -1) * z * ang })
  }
  useEffect(() => { if (!viva) girar((o.estado ?? 'fechada') === 'aberta' ? ABERTA : 0, o.lado ?? 'b') }, [folhas, o.estado, o.lado, viva])
  useFrame(() => {
    if (!viva) return
    const e = viva.ang * viva.ang * (3 - 2 * viva.ang) // suave no começo e no fim do giro
    girar(ABERTA * e, viva.lado)
  })

  // as divisões guardadas: uma lista nova a cada desenho faria o luar refazer a geometria
  const verticais = useMemo(() => verticaisDe(o), [o.window, o.width])
  const [h0, h1] = buraco(o), W = o.width
  const nFolhas = o.door === 'dupla' || o.door === 'grande' ? 2 : 1, lw = W / nFolhas - 0.02
  return (
    <group position={pos} rotation-y={rotY}>
      {obj && <primitive object={obj} />}
      {/* trancada: o cadeado nas maçanetas (só no editor; a porta trancada fica fechada) */}
      {o.kind === 'porta' && o.estado === 'trancada' && !viva && Array.from({ length: nFolhas }, (_, i) => [-1, 1].map((z) => (
        <mesh key={`${i}${z}`} position={[i === 0 ? 0.01 + lw - 0.09 : W - 0.01 - lw + 0.09, 0.92, z * 0.05]} material={cadeado}><boxGeometry args={[0.07, 0.09, 0.03]} /></mesh>
      )))}
      {o.kind === 'janela' && o.light2d !== false && <Luar W={W} h0={h0} h1={h1} zIn={(o.lado ?? 'b') === 'b' ? sb : -sb} verticais={verticais} />}
    </group>
  )
}
