// O Ver cenas (Modo desenvolvedor): toca uma cena do jogo (docs/cenas.md) no cenário dela, com a moldura de cinema, e
// deixa ajustar rápido: tocar e pausar, arrastar a linha do tempo, pular para um plano, ver mais devagar. É onde o
// desenvolvedor assiste cada cena e aponta o que mudar.
import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import type { Go } from '../App'
import { MapView } from '../editor/MapView'
import { Iluminacao } from '../game/luz/Iluminacao'
import { CENAS } from '../game/cenas/catalogo'
import { GanchosDaTela } from '../dev/GanchosDaTela'
import { ganchos } from '../dev/ganchos'
import { Elenco, portasVivasDaCena } from '../game/cenas/Elenco'
import { Moldura } from '../game/cenas/Moldura'
import { TocarCena, novoRelogio } from '../game/cenas/TocarCena'
import { duracao, estadoEm, inicios, type EstadoCena } from '../game/cenas/tocador'
import { getMap } from '../maps/loader'
import { prepararSom } from '../audio/sintese'
import { vozesEmUso } from '../game/cenas/vozes'
import { setModoParedes } from '../render/corte'
import { canvasDoNivel, useDefinicao } from '../render/qualidade'
import { useMapa } from './PreviaQualidade'

const VELOCIDADES: [number, string][] = [[0.5, '½×'], [1, '1×'], [2, '2×']]
const s1 = (t: number) => t.toFixed(1).replace('.', ',')

export function VerCenas({ go }: { go: Go }) {
  const [qual, setQual] = useState(CENAS[0].id)
  const cena = CENAS.find((c) => c.id === qual) ?? CENAS[0]
  const meta = getMap(cena.mapa), chunks = useMapa(cena.mapa), definicao = useDefinicao()
  const relogio = useMemo(() => novoRelogio(), [qual]), onde = useMemo(() => new THREE.Vector3(), [])
  // os blocos do mapa numa lista e as portas que a cena abre e fecha (o elenco anda as folhas)
  const lista = useMemo(() => (chunks ? Object.values(chunks) : []), [chunks])
  const portas = useMemo(() => portasVivasDaCena(cena, lista), [cena, lista])
  const painel = useRef<((e: EstadoCena) => void) | null>(null), moldura = useRef<((e: EstadoCena) => void) | null>(null)
  const total = duracao(cena), ini = useMemo(() => inicios(cena), [cena])
  // o painel lê o relógio umas vezes por segundo (a linha do tempo, o plano de agora); a imagem anda sozinha
  const [agora, setAgora] = useState({ t: 0, plano: 0, tocando: false })
  useEffect(() => {
    const id = setInterval(() => setAgora((a) => {
      const p = estadoEm(cena, relogio.t).plano
      return a.t === relogio.t && a.plano === p && a.tocando === relogio.tocando ? a : { t: relogio.t, plano: p, tocando: relogio.tocando }
    }), 80)
    return () => clearInterval(id)
  }, [cena, relogio])
  // só no npm run dev: o relógio e a cena para as provas (provas.gravar() grava a cena aberta num vídeo: dev/gravar.ts)
  useEffect(() => { if (!import.meta.env.DEV) return; ganchos.relogio = relogio; ganchos.cenaAberta = cena; return () => { delete ganchos.relogio; delete ganchos.cenaAberta } }, [relogio, cena])
  useEffect(() => setModoParedes('altas'), []) // o editor pode ter deixado as paredes recortadas
  // o tocador entrega o estado; a moldura desenha (o painel do tocador aponta para ela)
  useEffect(() => { painel.current = (e) => moldura.current?.(e) }, [])

  const ir = (t: number) => { relogio.t = Math.max(0, Math.min(total, t)); relogio.saltou = true; setAgora((a) => ({ ...a, t: relogio.t })) }
  const tocar = () => {
    prepararSom() // o som liga no clique (o navegador exige)
    if (relogio.t >= total) ir(0)
    relogio.tocando = !relogio.tocando; relogio.saltou = true
    setAgora((a) => ({ ...a, tocando: relogio.tocando }))
  }
  // quem fala na cena e qual voz do navegador cada um está usando (as vozes chegam devagar: lê de novo depois)
  const quem = useMemo(() => [...new Set(cena.planos.flatMap((p) => (p.falas ?? []).map((f) => f.quem)))], [cena])
  const [vozes, setVozes] = useState<string[]>([])
  useEffect(() => { const ler = () => setVozes(vozesEmUso(quem)); ler(); const id = setTimeout(ler, 1200); return () => clearTimeout(id) }, [quem])
  const [vel, setVel] = useState(1)
  useEffect(() => { relogio.velocidade = vel }, [relogio, vel])
  // o teclado: espaço toca e pausa; as setas andam meio segundo
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if (e.code === 'Space') { e.preventDefault(); tocar() }
      else if (e.code === 'ArrowRight') ir(relogio.t + 0.5)
      else if (e.code === 'ArrowLeft') ir(relogio.t - 0.5)
    }
    window.addEventListener('keydown', tecla)
    return () => window.removeEventListener('keydown', tecla)
  })

  return (
    <div className="vercenas">
      <header className="topo">
        <span className="titulo">Ver cenas</span>
        <span className="nome">{cena.nome} · cenário: maps/{cena.mapa}</span>
        <span className="espaco" />
        <button className="bt" onClick={() => go('dev')}>Voltar</button>
      </header>
      <div className="vista">
        {!meta ? <div className="tela"><h2>O mapa “{cena.mapa}” não está na pasta maps/.</h2></div> : (
          <Canvas camera={{ fov: 45, near: 0.03, far: 400 }} {...canvasDoNivel(definicao)}>
            <color attach="background" args={['#000']} />
            {chunks && <Suspense fallback={null}><MapView chunks={chunks} maxLevel={meta.levels - 1} portas={portas} juntar /></Suspense>}
            <Iluminacao ambiente={meta.ambiente} areas={meta.areas} em={onde} />
            {cena.cenario && <cena.cenario key={`${qual}-cenario`} relogio={relogio} cena={cena} chunks={lista} />}
            {chunks && cena.elenco && <Elenco key={`${qual}-elenco`} cena={cena} relogio={relogio} chunks={lista} portas={portas} />}
            <GanchosDaTela />
            <TocarCena key={qual} cena={cena} relogio={relogio} onde={onde} painel={painel} />
          </Canvas>
        )}
        <Moldura painel={moldura} />
      </div>
      <aside className="painel">
        <section className="linha">
          <b>Cena</b>
          <select value={qual} onChange={(e) => setQual(e.target.value)}>{CENAS.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}</select>
        </section>
        <section className="linha">
          <button className="bt" onClick={tocar}>{agora.tocando ? 'Pausar' : 'Tocar'}</button>
          <button className="bt" onClick={() => ir(0)}>Do começo</button>
          {VELOCIDADES.map(([v, n]) => <button key={v} className={vel === v ? 'bt ligado' : 'bt'} onClick={() => setVel(v)}>{n}</button>)}
        </section>
        <section>
          <input className="tempo" type="range" min={0} max={total} step={0.05} value={agora.t} onChange={(e) => ir(Number(e.target.value))} />
          <span className="relogio">{s1(agora.t)} s de {s1(total)} s</span>
        </section>
        <section className="planos">
          <b>Planos</b>
          {cena.planos.map((p, i) => (
            <button key={i} className={i === agora.plano ? 'agora' : ''} onClick={() => ir(ini[i] + 0.001)}>{p.nome}<small>{s1(p.dura)} s</small></button>
          ))}
        </section>
        {quem.length > 0 && <section className="planos"><b>Vozes</b>{vozes.map((v) => <small key={v}>{v}</small>)}<small>Provisórias: a voz do navegador. No Edge aparecem as naturais (Antonio, Francisca); nos outros, as do sistema.</small></section>}
        <small>Espaço toca e pausa; as setas andam meio segundo. O som só toca com a cena andando (clique em Tocar para ligar). Pular para um ponto não toca os sons do pedaço pulado.</small>
      </aside>
    </div>
  )
}
