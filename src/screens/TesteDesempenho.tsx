// O teste de desempenho das configurações: a mansão inteira (o mapa mais pesado do jogo), com o agente posto em
// várias paradas (o salão, o vestíbulo, cômodos com lâmpada, o andar de cima) e a câmera girando em volta dele em cada
// uma. Cada nível de qualidade pedido passa por todas as paradas, e o teste mede os quadros: a média e o "mínimo" (o
// 1% mais lento, que é o engasgo que o jogador sente). A sala pequena da prévia não mostra o peso de verdade; isto sim.
// O começo de cada parada não conta (a placa ainda está preparando o que nunca desenhou naquele nível).
import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { MapView } from '../editor/MapView'
import { novaSombraDeChao } from '../game/corpo/sombraDeChao'
import { Iluminacao } from '../game/luz/Iluminacao'
import { animarAgente } from '../game/player/animacao'
import { montarAgente } from '../game/player/modelo'
import { getMap } from '../maps/loader'
import { assadorDe, novaLuzVertice } from '../maps/luzAssada'
import { LEVEL_H, type Chunk } from '../maps/types'
import { iluminarObjeto } from '../render/assada'
import { setModoParedes } from '../render/corte'
import { NIVEIS, canvasDoNivel, definicaoDe, type Definicao, type Nivel } from '../render/qualidade'
import { useMapa } from './PreviaQualidade'

/** O mapa do teste e as paradas dele: [x, z, andar]. Sem a mansão na pasta, usa o mapa de teste da iluminação. */
const TESTES: { mapa: string; paradas: [number, number, number][] }[] = [
  { mapa: 'mansao-cap1', paradas: [[24, 16, 0], [24, 10.5, 0], [13, 20.5, 0], [35, 13, 0], [20, 22, 1], [13, 12.5, 1]] },
  { mapa: 'teste-iluminacao', paradas: [[7, 6, 0], [16, 6, 0], [26, 6, 0]] },
]
/** Os tempos de cada parada (s): o que não conta no começo e o que é medido. E as notas: a média que serve para jogar. */
export const TESTE = { aquece: 1, mede: 2.5, bom: 50, jogavel: 30 }

export interface Resultado { nivel: Nivel; media: number; minimo: number } // quadros por segundo

interface PropsCena { chunks: Record<string, Chunk>; paradas: [number, number, number][]; niveis: Nivel[]; definicao: Definicao; indice: number
  onNivel: (indice: number, r: Resultado) => void; onParada: (parada: number) => void }

function Cena({ chunks, paradas, niveis, definicao, indice, onNivel, onParada }: PropsCena) {
  const scene = useThree((s) => s.scene)
  const agente = useMemo(() => montarAgente(), []), sombra = useMemo(() => novaSombraDeChao(), [])
  const assa = useMemo(() => assadorDe(Object.values(chunks)), [chunks]), luz = useMemo(() => novaLuzVertice(), [])
  const posicao = useMemo(() => new THREE.Vector3(), []), alvo = useMemo(() => new THREE.Vector3(), [])
  const e = useRef({ parada: -1, t: 0, dts: [] as number[] })
  const avisa = useRef({ onNivel, onParada }); avisa.current = { onNivel, onParada }
  useEffect(() => {
    setModoParedes('altas') // o editor pode ter deixado as paredes recortadas
    scene.add(agente.root, sombra)
    return () => { scene.remove(agente.root, sombra) }
  }, [scene, agente, sombra])
  // um nível novo: começa da primeira parada, sem medidas
  useEffect(() => { e.current = { parada: -1, t: 0, dts: [] } }, [indice])

  useFrame(({ camera }, dt) => {
    const E = e.current
    if (indice >= niveis.length) return
    // a próxima parada: o agente vai para lá e a luz dele é tirada de novo
    if (E.parada < 0 || E.t >= TESTE.aquece + TESTE.mede) {
      E.parada++; E.t = 0
      if (E.parada >= paradas.length) {
        // o nível acabou: a média, e o mínimo pelo 1% dos quadros mais lentos
        const d = E.dts.sort((a, b) => a - b), soma = d.reduce((a, b) => a + b, 0), lento = d[Math.min(d.length - 1, Math.floor(d.length * 0.99))] || 1
        avisa.current.onNivel(indice, { nivel: niveis[indice], media: d.length / (soma || 1), minimo: 1 / lento })
        E.parada = paradas.length; E.t = -1e9 // espera o próximo nível chegar
        return
      }
      const [x, z, andar] = paradas[E.parada], y = andar * LEVEL_H
      posicao.set(x, y, z); agente.root.position.copy(posicao); sombra.position.set(x, y + 0.03, z)
      const p: [number, number, number] = [x, y + 1, z]
      assa(p, null, p, andar, luz); iluminarObjeto(agente.root, luz)
      avisa.current.onParada(E.parada)
    }
    if (E.parada >= paradas.length) return
    E.t += dt
    if (E.t > TESTE.aquece && dt < 0.5) E.dts.push(dt)
    // a câmera dá um quarto de volta em torno do agente em cada parada (de perto: cabe nos cômodos)
    animarAgente(agente, { velocidade: 0, corrida: 0, esquiva: -1 }, dt)
    const a = E.parada * 1.3 + (E.t / (TESTE.aquece + TESTE.mede)) * (Math.PI / 2)
    camera.position.set(posicao.x + Math.sin(a) * 2.6, posicao.y + 1.9, posicao.z + Math.cos(a) * 2.6)
    camera.lookAt(alvo.set(posicao.x, posicao.y + 1.2, posicao.z))
  })
  return (
    <>
      <MapView chunks={chunks} maxLevel={99} />
      <Iluminacao ambiente={getMap(escolhido().mapa)?.ambiente ?? 'mansao'} areas={getMap(escolhido().mapa)?.areas} em={posicao} definicao={definicao} />
    </>
  )
}

/** O mapa do teste: a mansão, ou o de teste da iluminação se ela não está na pasta. */
const escolhido = () => TESTES.find((t) => getMap(t.mapa)) ?? TESTES[0]

interface Props {
  niveis: Nivel[] // os níveis a medir, na ordem
  indice: number // o que está sendo medido agora (quem guarda é a tela: muda quando um nível acaba)
  onNivel: (indice: number, r: Resultado) => void
  onParada: (parada: number, total: number) => void
}

export function TesteDesempenho({ niveis, indice, onNivel, onParada }: Props) {
  const teste = escolhido(), chunks = useMapa(teste.mapa)
  // cada nível é medido puro (sem os ajustes do jogador): é a comparação entre os níveis que interessa
  const definicao = useMemo(() => definicaoDe(NIVEIS[niveis[Math.min(indice, niveis.length - 1)]]), [niveis, indice])
  if (chunks && !Object.keys(chunks).length) return <div className="previa vazia">Não há mapa para o teste na pasta maps/.</div>
  return (
    <Canvas camera={{ fov: 55, near: 0.05, far: 200 }} {...canvasDoNivel(definicao)}>
      {chunks && <Cena chunks={chunks} paradas={teste.paradas} niveis={niveis} definicao={definicao} indice={indice} onNivel={onNivel} onParada={(p) => onParada(p, teste.paradas.length)} />}
    </Canvas>
  )
}
