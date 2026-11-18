// Só no npm run dev: a cena, o desenhista e a câmera de uma tela com <Canvas> (o criador de mapas, o Ver cenas) para as
// provas inspecionarem e fotografarem pelo console (provas.cena(), provas.gl(), provas.camera()). No Testar, quem põe os
// dele é o Testar.
import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import { ganchos } from './ganchos'

export function GanchosDaTela() {
  const scene = useThree((s) => s.scene), gl = useThree((s) => s.gl), camera = useThree((s) => s.camera)
  useEffect(() => {
    if (!import.meta.env.DEV) return
    ganchos.cena = scene; ganchos.gl = gl; ganchos.camera = camera
    return () => { delete ganchos.cena; delete ganchos.gl; delete ganchos.camera }
  }, [scene, gl, camera])
  return null
}
