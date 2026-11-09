// A etiqueta com a medida do que está sendo construído, flutuando na cena perto do arraste ("4 × 3 m · 12 m²").
import { Html } from '@react-three/drei'

export function Medida({ pos, texto, erro }: { pos: [number, number, number]; texto: string; erro?: boolean }) {
  return (
    <Html position={pos} center zIndexRange={[4, 0]} style={{ pointerEvents: 'none' }}>
      <div className={erro ? 'medida erro' : 'medida'}>{texto}</div>
    </Html>
  )
}
