// Uma fase do jogo, fora do editor: o mapa (maps/<mapa>, lido da pasta) com o agente jogando, como no Testar do criador
// de mapas (a câmera, a colisão, a luz do lugar, as armas, a vida), em tela cheia; Esc volta ao menu.
// A Demo · Intro (docs/intro.md) é o mapa "intro": o submundo, as três arenas, com o roteiro dela (src/chapters/intro/:
// as hordas, os tornados, o chefe, a música); a linha do roteiro aparece no alto da tela.
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import type { Go } from '../App'
import { MapView } from '../editor/MapView'
import { Desempenho } from '../game/Desempenho'
import { Testar } from '../game/Testar'
import type { PortasVivas } from '../game/world/portas'
import { getMap, loadChunk } from '../maps/loader'
import type { Chunk } from '../maps/types'
import { setModoParedes } from '../render/corte'
import { canvasDoNivel, useDefinicao } from '../render/qualidade'
import { Roteiro, type TextoRoteiro } from '../chapters/intro/Roteiro'
import type { AgenteNaFase } from '../game/Testar'

/** Os roteiros das fases, pelo mapa (por enquanto, só a Demo · Intro). */
const ROTEIROS: Record<string, typeof Roteiro> = { intro: Roteiro }

export function Jogo({ go, mapa }: { go: Go; mapa: string }) {
  const meta = useMemo(() => getMap(mapa), [mapa])
  // todos os blocos do mapa (a Demo é pequena; carregar por perto vem quando a mansão entrar)
  const [chunks, setChunks] = useState<Record<string, Chunk> | null>(null)
  useEffect(() => {
    if (!meta) return
    let vivo = true
    Promise.all(meta.chunks.map(async (k) => [k, await loadChunk(mapa, k)] as const)).then((l) => {
      if (vivo) setChunks(Object.fromEntries(l.filter((x): x is readonly [string, Chunk] => !!x[1])))
    })
    return () => { vivo = false }
  }, [meta, mapa])
  useEffect(() => setModoParedes('altas'), []) // o editor pode ter deixado as paredes recortadas
  const definicao = useDefinicao()
  const portas = useMemo<PortasVivas>(() => new Map(), [])
  const [travado, setTravado] = useState(false), [dica, setDica] = useState<string | null>(null), [mirando, setMirando] = useState(false)
  const [escuro, setEscuro] = useState(false), [vida, setVida] = useState(100), [arma, setArma] = useState<string | null>(null)
  const desempenho = useRef<HTMLPreElement>(null)
  const onDesempenho = useCallback((t: string) => { if (desempenho.current) desempenho.current.textContent = t }, [])
  const sair = useCallback(() => go('menu'), [go])
  // o roteiro recebe o controle do agente (do Testar); a linha dele aparece no alto
  const jogo = useRef<AgenteNaFase | null>(null), [roteiro, setRoteiro] = useState<TextoRoteiro | null>(null)
  const aoMontar = useCallback((c: AgenteNaFase) => { jogo.current = c }, [])
  const RoteiroDaFase = ROTEIROS[mapa]

  if (!meta) return <div className="tela"><h2>O mapa “{mapa}” não está na pasta maps/.</h2><nav className="menu"><button onClick={sair}>Voltar</button></nav></div>
  if (!chunks) return <div className="tela"><h2>Carregando…</h2></div>
  const [x, y, z] = meta.spawn.pos
  return (
    <div className="jogo">
      <Canvas camera={{ position: [x, y + 2, z - 3], fov: 60 }} {...canvasDoNivel(definicao)}>
        <color attach="background" args={['#000']} />
        <Suspense fallback={null}><MapView chunks={chunks} maxLevel={meta.levels - 1} portas={portas} juntar /></Suspense>
        <Testar chunks={chunks} levels={meta.levels} ambiente={meta.ambiente} semChao={meta.semChao} areas={meta.areas} inicio={[x, y, z]} yaw={(meta.spawn.yaw * Math.PI) / 180}
          portas={portas} onTravado={setTravado} onDica={setDica} onMira={setMirando} onEscuro={setEscuro} onVida={setVida} onArma={setArma} onSair={sair} aoMontar={aoMontar} />
        {RoteiroDaFase && <RoteiroDaFase chunks={chunks} jogo={jogo} aoTexto={setRoteiro} />}
        <Desempenho onTexto={onDesempenho} />
      </Canvas>
      {roteiro && <div className="roteiro-jogo"><b>{roteiro.titulo}</b>{roteiro.dica && <span>{roteiro.dica}</span>}</div>}
      {dica && <div className="dica-teste">{dica}</div>}
      {mirando && <div className="mira-ponto" />}
      <div className={escuro ? 'escuro-teste ligado' : 'escuro-teste'} />
      <pre className="desempenho-teste" ref={desempenho} />
      <div className={vida <= 30 ? 'vida-teste perigo' : 'vida-teste'}>Vida {vida}%</div>
      {arma && <div className={arma.includes('travada') ? 'arma-teste perigo' : 'arma-teste'}>{arma}</div>}
      {!travado && <div className="teste-b"><b>{meta.nome}</b><span>Clique para jogar · Esc volta ao menu</span></div>}
    </div>
  )
}
