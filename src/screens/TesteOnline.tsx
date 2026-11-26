// O teste online (Modo desenvolvedor → Teste online; docs/teste-online.md): dois jogadores na mansão do capítulo 1,
// com os fantasmas espalhados. Quem cria a sessão é o host (o Matheus) e recebe um código para mandar; quem entra com o
// código é o convidado (a Lara). Os dois começam juntos no alpendre; as mecânicas são as do jogo sozinho. Esc sai (o
// outro recebe o aviso). Caiu a conexão: a sessão acaba e a tela diz por quê.
import { useEffect, useRef, useState } from 'react'
import type { Go } from '../App'
import { criarSessao, entrarSessao, type Conexao } from '../game/rede/conexao'
import type { Rede } from '../game/Testar'
import type { ScriptPoint } from '../maps/types'
import { KIND_ENTIDADE } from '../maps/entidades'
import { ganchos } from '../dev/ganchos'
import { Jogo } from './Jogo'

/** Onde ficam os fantasmas na mansão (maps/mansao-cap1, no térreo): o mapa do capítulo não é mexido, eles entram só aqui.
 *  A Mãe na sala de jantar, o Mestre na cozinha, as Gralhas no salão nobre, na sala de visitas e no gabinete. */
const ponto = (id: string, tipo: string, x: number, z: number, vira = 0): ScriptPoint => ({ id: `online-${id}`, kind: KIND_ENTIDADE, level: 0, pos: [x, 0, z], params: { tipo, vira } })
export const FANTASMAS_ONLINE: ScriptPoint[] = [
  ponto('mae', 'mae', 35, 13, 180),
  ponto('mestre', 'mestre', 35, 28, 180),
  ponto('gralha-1', 'gralha', 21, 18, 90),
  ponto('gralha-2', 'gralha', 27, 21, -90),
  ponto('gralha-3', 'gralha', 13, 12, 0),
  ponto('gralha-4', 'gralha', 13, 20, 180),
]
const MAPA = 'mansao-cap1'
const HOST = { modelo: 'agente', nome: 'Matheus' } as const, CONVIDADO = { modelo: 'lara', nome: 'Lara' } as const

type Fase =
  | { f: 'escolha' }
  | { f: 'criando'; codigo: string | null }
  | { f: 'entrando'; esperando: boolean }
  | { f: 'jogando'; con: Conexao }
  | { f: 'fim'; motivo: string }

export function TesteOnline({ go }: { go: Go }) {
  const [fase, setFase] = useState<Fase>({ f: 'escolha' })
  const [codigo, setCodigo] = useState(''), [erro, setErro] = useState<string | null>(null)
  const cancelar = useRef<(() => void) | null>(null)
  const con = fase.f === 'jogando' ? fase.con : null

  // saindo da tela: a sessão fecha (o outro recebe o aviso) e a espera é cancelada
  useEffect(() => () => cancelar.current?.(), [])
  // (o fechar espera um instante: o React, no npm run dev, desmonta e monta de novo de mentira; só fecha se saiu mesmo)
  const montado = useRef(false)
  useEffect(() => {
    if (!con) return
    montado.current = true
    con.aoFechar((motivo) => setFase({ f: 'fim', motivo }))
    if (import.meta.env.DEV) ganchos.rede = con // provas.rede()
    return () => {
      montado.current = false
      setTimeout(() => { if (montado.current) return; con.fechar(); if (ganchos.rede === con) delete ganchos.rede }, 0)
    }
  }, [con])

  // cada tentativa tem o seu número: a resposta de uma que já foi cancelada não mexe na tela (e a conexão dela fecha)
  const tentativa = useRef(0)
  function abrir(p: { conexao: Promise<Conexao>; cancelar: () => void }) {
    const minha = ++tentativa.current
    cancelar.current = p.cancelar
    p.conexao.then((c) => {
      if (minha !== tentativa.current) { c.fechar(); return }
      cancelar.current = null; setFase({ f: 'jogando', con: c })
    }).catch((e: Error) => {
      if (minha !== tentativa.current) return
      cancelar.current = null; setErro(e.message); setFase({ f: 'escolha' })
    })
  }
  function criar() {
    setErro(null); setFase({ f: 'criando', codigo: null })
    abrir(criarSessao((c) => setFase({ f: 'criando', codigo: c })))
  }
  function entrar() {
    if (codigo.trim().length < 5) { setErro('O código tem 5 letras.'); return }
    setErro(null); setFase({ f: 'entrando', esperando: true })
    abrir(entrarSessao(codigo))
  }
  function voltar() { tentativa.current++; cancelar.current?.(); cancelar.current = null; setFase({ f: 'escolha' }) }

  if (fase.f === 'jogando') {
    const host = fase.con.papel === 'host', eu = host ? HOST : CONVIDADO, outro = host ? CONVIDADO : HOST
    const rede: Rede = { con: fase.con, modelo: eu.modelo, nome: eu.nome, outro }
    return <>
      <Jogo go={go} mapa={MAPA} rede={rede} extras={FANTASMAS_ONLINE} deslocar={host ? 0 : 1.6} sair={() => go('dev')} />
      <StatusRede con={fase.con} />
    </>
  }
  return (
    <div className="tela">
      <h2>Teste online</h2>
      {fase.f === 'escolha' && <>
        <p className="online-texto">Dois jogadores na mansão, com os fantasmas espalhados. Quem cria é o host (o Matheus) e
          manda o código; quem entra é a Lara.</p>
        <nav className="menu">
          <button onClick={criar}>Criar sessão<span className="tag">SOU O HOST</span></button>
          <button onClick={() => { setErro(null); setFase({ f: 'entrando', esperando: false }) }}>Entrar com código<span className="tag">SOU O CONVIDADO</span></button>
          <button onClick={() => go('dev')}>Voltar</button>
        </nav>
      </>}
      {fase.f === 'criando' && <>
        {fase.codigo
          ? <><p className="online-texto">Mande este código para o outro jogador:</p><div className="online-codigo">{fase.codigo}</div><p className="online-texto">Esperando ele entrar…</p></>
          : <p className="online-texto">Abrindo a sessão…</p>}
        <nav className="menu"><button onClick={voltar}>Cancelar</button></nav>
      </>}
      {fase.f === 'entrando' && <>
        <input className="online-campo" autoFocus maxLength={5} placeholder="CÓDIGO" value={codigo} disabled={fase.esperando}
          onChange={(e) => setCodigo(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))} onKeyDown={(e) => { if (e.key === 'Enter') entrar() }} />
        {fase.esperando && <p className="online-texto">Entrando…</p>}
        <nav className="menu">
          {!fase.esperando && <button onClick={entrar}>Entrar</button>}
          <button onClick={voltar}>{fase.esperando ? 'Cancelar' : 'Voltar'}</button>
        </nav>
      </>}
      {fase.f === 'fim' && <>
        <p className="online-texto">{fase.motivo}</p>
        <nav className="menu"><button onClick={() => setFase({ f: 'escolha' })}>Outra sessão</button><button onClick={() => go('dev')}>Voltar</button></nav>
      </>}
      {erro && <p className="online-erro">{erro}</p>}
    </div>
  )
}

/** No canto da tela, jogando: o código, quem eu sou e o ping (a cada segundo). Também nas demos a dois (Lobby). */
export function StatusRede({ con }: { con: Conexao }) {
  const [ping, setPing] = useState(0)
  useEffect(() => { const t = setInterval(() => setPing(Math.round(con.ping)), 1000); return () => clearInterval(t) }, [con])
  const cor = ping < 80 ? 'bom' : ping < 180 ? 'medio' : 'ruim'
  return <div className="online-status">{con.papel === 'host' ? 'HOST · MATHEUS' : 'CONVIDADO · LARA'} · {con.codigo} · <b className={cor}>{ping} ms</b></div>
}
