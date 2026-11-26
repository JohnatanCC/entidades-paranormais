// Uma fase do jogo, fora do editor: o mapa (maps/<mapa>, lido da pasta) com o agente jogando, como no Testar do criador
// de mapas (a câmera, a colisão, a luz do lugar, as armas, a vida), em tela cheia; Esc volta ao menu.
// A Demo · Intro (docs/intro.md) é o mapa "intro": o submundo, as três arenas, com o roteiro dela (src/chapters/intro/:
// as hordas, os tornados, o chefe, a música); a linha do roteiro aparece no alto da tela, e o HUD (game/hud) embaixo.
// O teste online (screens/TesteOnline) usa esta tela também: com a rede, os pontos extras (os fantasmas espalhados) e o
// convidado um pouco ao lado do começo.
// Esc abre o menu de pausa: continuar, configurações (as mesmas do menu, sem a prévia) e sair. Sozinho, o jogo para
// (o Canvas não desenha nem anda); no online o mundo continua (o outro jogador e os fantasmas), só o agente fica parado.
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import type { Go } from '../App'
import { MapView } from '../editor/MapView'
import { Desempenho } from '../game/Desempenho'
import { Testar } from '../game/Testar'
import type { PortasVivas } from '../game/world/portas'
import { getMap, loadChunk } from '../maps/loader'
import type { Chunk, ScriptPoint } from '../maps/types'
import { setModoParedes } from '../render/corte'
import { canvasDoNivel, useDefinicao } from '../render/qualidade'
import { Roteiro, type TextoRoteiro } from '../chapters/intro/Roteiro'
import { Roteiro as RoteiroInimigos } from '../chapters/demo-inimigos/Roteiro'
import type { AgenteNaFase, Rede } from '../game/Testar'
import { BarrasDoChefe, Hud, type EstadoHud } from '../game/hud/Hud'
import { SettingsScreen } from './SettingsScreen'

/** Os roteiros das fases, pelo mapa: as duas demos. A dois só a Demo · Inimigos por enquanto (a Intro a dois é a próxima
 *  etapa: docs/teste-online.md). */
const ROTEIROS: Record<string, typeof Roteiro> = { intro: Roteiro, 'demo-inimigos': RoteiroInimigos }
const A_DOIS = new Set(['demo-inimigos'])

/** rede = o teste online; extras = pontos a mais no mapa (as entidades), sem mexer no mapa salvo; deslocar = m para o
 *  lado no começo (o convidado não nasce dentro do host); sair = para onde o Esc leva (sem: o menu). */
export function Jogo({ go, mapa, rede, extras, deslocar = 0, sair: aoSair }: { go: Go; mapa: string; rede?: Rede; extras?: ScriptPoint[]; deslocar?: number; sair?: () => void }) {
  const meta = useMemo(() => getMap(mapa), [mapa])
  // todos os blocos do mapa (a Demo é pequena; carregar por perto vem quando a mansão entrar)
  const [chunks, setChunks] = useState<Record<string, Chunk> | null>(null)
  useEffect(() => {
    if (!meta) return
    let vivo = true
    Promise.all(meta.chunks.map(async (k) => [k, await loadChunk(mapa, k)] as const)).then((l) => {
      const blocos = Object.fromEntries(l.filter((x): x is readonly [string, Chunk] => !!x[1]))
      const k0 = Object.keys(blocos)[0] // os pontos extras entram no primeiro bloco (uma cópia: o mapa salvo não muda)
      if (extras?.length && k0) blocos[k0] = { ...blocos[k0], points: [...blocos[k0].points, ...extras] }
      if (vivo) setChunks(blocos)
    })
    return () => { vivo = false }
  }, [meta, mapa, extras])
  useEffect(() => setModoParedes('altas'), []) // o editor pode ter deixado as paredes recortadas
  const definicao = useDefinicao()
  const portas = useMemo<PortasVivas>(() => new Map(), [])
  const [travado, setTravado] = useState(false), [dica, setDica] = useState<string | null>(null), [mirando, setMirando] = useState(false)
  const [escuro, setEscuro] = useState(0)
  const desempenho = useRef<HTMLPreElement>(null)
  const onDesempenho = useCallback((t: string) => { if (desempenho.current) desempenho.current.textContent = t }, [])
  const sair = useCallback(() => (aoSair ? aoSair() : go('menu')), [go, aoSair])
  // o menu de pausa (Esc) e as configurações dentro dele
  const [pausado, setPausado] = useState(false), [config, setConfig] = useState(false), tela = useRef<HTMLCanvasElement>(null)
  const pausar = useCallback(() => setPausado(true), [])
  // continuar trava o mouse de novo (o clique no botão conta como gesto); se o navegador recusar, o aviso pede um clique
  const continuar = useCallback(() => {
    setConfig(false); setPausado(false)
    try { const r = tela.current?.requestPointerLock() as unknown as Promise<void> | undefined; r?.catch?.(() => {}) } catch { /* o aviso pede o clique */ }
  }, [])
  // com o menu aberto, Esc fecha as configurações ou volta ao jogo
  useEffect(() => {
    if (!pausado) return
    const tecla = (e: KeyboardEvent) => { if (e.code !== 'Escape') return; if (config) setConfig(false); else continuar() }
    window.addEventListener('keydown', tecla)
    return () => window.removeEventListener('keydown', tecla)
  }, [pausado, config, continuar])
  const hud = useRef<((e: EstadoHud) => void) | null>(null), onHud = useCallback((e: EstadoHud) => hud.current?.(e), [])
  // o roteiro recebe o controle do agente (do Testar); a linha dele aparece no alto
  const jogo = useRef<AgenteNaFase | null>(null), [roteiro, setRoteiro] = useState<TextoRoteiro | null>(null)
  const aoMontar = useCallback((c: AgenteNaFase) => { jogo.current = c }, [])
  const RoteiroDaFase = ROTEIROS[mapa]
  // a dois: o roteiro roda no host, que manda a linha ao convidado; o convidado só mostra
  const host = !rede || rede.con.papel === 'host', aDois = A_DOIS.has(mapa)
  const aoTexto = useCallback((t: TextoRoteiro | null) => { setRoteiro(t); if (rede && t) rede.con.enviar({ t: 'roteiro', titulo: t.titulo, dica: t.dica }) }, [rede])
  useEffect(() => { if (rede && !host) return rede.con.ouvir('roteiro', (m) => setRoteiro({ titulo: m.titulo, dica: m.dica })) }, [rede, host])

  if (!meta) return <div className="tela"><h2>O mapa “{mapa}” não está na pasta maps/.</h2><nav className="menu"><button onClick={sair}>Voltar</button></nav></div>
  if (!chunks) return <div className="tela"><h2>Carregando…</h2></div>
  const [x0, y, z] = meta.spawn.pos, x = x0 + deslocar
  return (
    <div className="jogo">
      <Canvas ref={tela} frameloop={pausado && !rede ? 'never' : 'always'} camera={{ position: [x, y + 2, z - 3], fov: 60 }} {...canvasDoNivel(definicao)}>
        <color attach="background" args={['#000']} />
        <Suspense fallback={null}><MapView chunks={chunks} maxLevel={meta.levels - 1} portas={portas} juntar /></Suspense>
        <Testar chunks={chunks} levels={meta.levels} ambiente={meta.ambiente} semChao={meta.semChao} areas={meta.areas} inicio={[x, y, z]} yaw={(meta.spawn.yaw * Math.PI) / 180}
          portas={portas} onTravado={setTravado} onDica={setDica} onMira={setMirando} onEscuro={setEscuro} onHud={onHud} onSair={sair} aoMontar={aoMontar} rede={rede} onPausa={pausar} pausado={pausado} />
        {RoteiroDaFase && host && (!rede || aDois) && <RoteiroDaFase chunks={chunks} jogo={jogo} aoTexto={aoTexto} />}
        <Desempenho onTexto={onDesempenho} />
      </Canvas>
      {roteiro && <div className="roteiro-jogo"><b>{roteiro.titulo}</b>{roteiro.dica && <span>{roteiro.dica}</span>}</div>}
      {/* a dois, a Intro ainda não tem os inimigos (a próxima etapa: docs/teste-online.md) */}
      {mapa in ROTEIROS && rede && !aDois && <div className="roteiro-jogo"><b>A dois</b><span>Os inimigos a dois chegam na próxima etapa</span></div>}
      {dica && <div className="dica-teste">{dica}</div>}
      {mirando && <div className="mira-ponto" />}
      <div className={escuro >= 1 ? 'escuro-teste ligado' : 'escuro-teste'} style={{ opacity: escuro }} />
      <pre className="desempenho-teste" ref={desempenho} />
      <Hud painel={hud} />
      {roteiro?.chefe && <BarrasDoChefe chefe={roteiro.chefe} />}
      {!travado && !pausado && <div className="teste-b"><b>{meta.nome}</b><span>Clique para jogar · Esc pausa</span></div>}
      {pausado && !config && (
        <div className="pausa">
          <h2>Pausa</h2>
          {rede && <p>No online o jogo não para: os fantasmas e o outro jogador continuam.</p>}
          <nav className="menu">
            <button autoFocus onClick={continuar}>Continuar</button>
            <button onClick={() => setConfig(true)}>Configurações</button>
            <button onClick={sair}>{rede ? 'Sair da sessão' : 'Sair para o menu'}</button>
          </nav>
        </div>
      )}
      {pausado && config && <SettingsScreen go={go} noJogo aoVoltar={() => setConfig(false)} />}
    </div>
  )
}
