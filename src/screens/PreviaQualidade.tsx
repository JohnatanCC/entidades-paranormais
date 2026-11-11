// A prévia das configurações: a sala do mapa "Teste de iluminação" (a lâmpada, a janela com luar, os móveis, o canto
// escuro) com o agente parado no meio, desenhada com a qualidade escolhida agora. Mudar um nível ou um recurso muda a
// cena na hora, e os quadros por segundo aparecem por cima: o jogador vê o que ganha e o que custa antes de jogar.
// A câmera fica parada (pedido do desenvolvedor, 11/nov).
import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { MapView } from '../editor/MapView'
import { Desempenho } from '../game/Desempenho'
import { Iluminacao } from '../game/luz/Iluminacao'
import { novaSombraDeChao } from '../game/corpo/sombraDeChao'
import { animarAgente } from '../game/player/animacao'
import { montarAgente } from '../game/player/modelo'
import { getMap, loadChunk } from '../maps/loader'
import { assadorDe, novaLuzVertice } from '../maps/luzAssada'
import type { Chunk } from '../maps/types'
import { iluminarObjeto } from '../render/assada'
import { setModoParedes } from '../render/corte'
import { canvasDoNivel, useDefinicao } from '../render/qualidade'

const MAPA = 'teste-iluminacao'
const AGENTE: [number, number, number] = [7, 0, 6] // no meio da sala, entre a lâmpada e a janela
const OLHO = new THREE.Vector3(10.6, 1.75, 9.2), ALVO = new THREE.Vector3(6, 1.1, 4.4)

/** Os blocos de um mapa da pasta (ou null enquanto carregam; vazio se o mapa não existe). */
export function useMapa(MAPA: string) {
  const [chunks, setChunks] = useState<Record<string, Chunk> | null>(null)
  useEffect(() => {
    const meta = getMap(MAPA)
    if (!meta) { setChunks({}); return }
    let vivo = true
    Promise.all(meta.chunks.map((k) => loadChunk(MAPA, k))).then((cs) => {
      if (vivo) setChunks(Object.fromEntries(cs.filter((c): c is Chunk => !!c).map((c) => [`${c.cx}_${c.cz}`, c])))
    })
    return () => { vivo = false }
  }, [MAPA])
  return chunks
}

function Cena({ chunks }: { chunks: Record<string, Chunk> }) {
  const scene = useThree((s) => s.scene)
  const agente = useMemo(() => montarAgente(), []), sombra = useMemo(() => novaSombraDeChao(), [])
  const posicao = useMemo(() => new THREE.Vector3(...AGENTE), [])
  useEffect(() => {
    setModoParedes('altas') // o editor pode ter deixado as paredes recortadas
    agente.root.position.copy(posicao); agente.root.rotation.y = 0.6
    sombra.position.set(posicao.x, 0.03, posicao.z)
    // a luz assada de onde ele está (as lâmpadas sem sombra, a janela, a luz indireta)
    const luz = novaLuzVertice(), p: [number, number, number] = [posicao.x, 1, posicao.z]
    assadorDe(Object.values(chunks))(p, null, p, 0, luz); iluminarObjeto(agente.root, luz)
    scene.add(agente.root, sombra)
    return () => { scene.remove(agente.root, sombra) }
  }, [scene, agente, sombra, posicao, chunks])
  // a câmera parada, olhando o agente; ele parado, respirando
  const camera = useThree((s) => s.camera)
  useEffect(() => { camera.position.copy(OLHO); camera.lookAt(ALVO) }, [camera])
  useFrame((_, dt) => animarAgente(agente, { velocidade: 0, corrida: 0, esquiva: -1 }, dt))
  return (
    <>
      {/* até o andar de cima: o teto da sala é a face de baixo do piso dele */}
      <MapView chunks={chunks} maxLevel={1} />
      <Iluminacao ambiente="mansao" em={posicao} />
    </>
  )
}

export function PreviaQualidade() {
  const chunks = useMapa(MAPA), definicao = useDefinicao()
  const fps = useRef<HTMLPreElement>(null)
  if (chunks && !Object.keys(chunks).length) return <div className="previa vazia">A sala de prévia (o mapa {MAPA}) não está na pasta maps/.</div>
  return (
    <div className="previa">
      <Canvas camera={{ position: OLHO.toArray(), fov: 55, near: 0.05, far: 200 }} {...canvasDoNivel(definicao)}>
        {chunks && <Cena chunks={chunks} />}
        <Desempenho onTexto={(t) => { if (fps.current) fps.current.textContent = t }} />
      </Canvas>
      <pre className="previa-fps" ref={fps} />
      <span className="previa-dica">Prévia ao vivo · F3 mostra o detalhe</span>
    </div>
  )
}
