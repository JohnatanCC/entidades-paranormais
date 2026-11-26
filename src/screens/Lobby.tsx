// O lobby das demos (Novo jogo → Demo · Intro ou Demo · Inimigos; docs/teste-online.md, "As demos a dois"): antes de
// entrar, o jogador começa sozinho, convida um amigo (abre a sessão e recebe o código para mandar) ou entra na sessão de
// um amigo com o código. Juntos no lobby, quem convidou (o host, o Matheus) aperta Começar e os dois entram na demo; o
// convidado (a Lara) espera. Usa a conexão do teste online (game/rede). Saindo do lobby ou da demo, a sessão fecha (o
// outro recebe o aviso); caiu a conexão, volta ao lobby e diz por quê.
import { useEffect, useRef, useState } from 'react'
import type { Go } from '../App'
import { musica } from '../audio/musica'
import { criarSessao, entrarSessao, type Conexao } from '../game/rede/conexao'
import type { Rede } from '../game/Testar'
import { ganchos } from '../dev/ganchos'
import { Jogo } from './Jogo'
import { StatusRede } from './TesteOnline'

/** As demos que têm lobby: o nome, a etiqueta, o mapa e uma linha do que é. */
export const DEMOS = {
  intro: { nome: 'Demo · Intro', tag: 'O SUBMUNDO', mapa: 'intro', texto: 'O submundo: três arenas com as hordas dos Sombrios e o Devora almas no fim.' },
  inimigos: { nome: 'Demo · Inimigos', tag: 'AS HORDAS', mapa: 'demo-inimigos', texto: 'O salão da mansão: seis hordas de espectrais, com o Manto, o Devora e o Asa do terror.' },
} as const
export type Demo = keyof typeof DEMOS

const HOST = { modelo: 'agente', nome: 'Matheus' } as const, CONVIDADO = { modelo: 'lara', nome: 'Lara' } as const

type Fase =
  | { f: 'sala' }
  | { f: 'convidando'; codigo: string | null }
  | { f: 'entrando'; esperando: boolean }
  | { f: 'juntos'; con: Conexao }
  | { f: 'jogando'; con: Conexao | null }

export function Lobby({ go, demo }: { go: Go; demo: Demo }) {
  const D = DEMOS[demo]
  const [fase, setFase] = useState<Fase>({ f: 'sala' })
  const [codigo, setCodigo] = useState(''), [aviso, setAviso] = useState<string | null>(null)
  const cancelar = useRef<(() => void) | null>(null)
  const con = fase.f === 'juntos' || fase.f === 'jogando' ? fase.con : null

  // no lobby, a música do menu; jogando, quem manda é o roteiro da demo
  useEffect(() => { musica(fase.f === 'jogando' ? null : 'menu') }, [fase.f])
  // saindo da tela: a espera é cancelada
  useEffect(() => () => cancelar.current?.(), [])
  // a sessão aberta: caiu, volta ao lobby com o motivo; o convidado começa quando o host manda (o mapa vem dele)
  // (o fechar espera um instante: o React, no npm run dev, desmonta e monta de novo de mentira; só fecha se saiu mesmo)
  const montado = useRef(false)
  useEffect(() => {
    if (!con) return
    montado.current = true
    con.aoFechar((motivo) => { setAviso(motivo); setFase({ f: 'sala' }) })
    const para = con.ouvir('comecar', () => setFase({ f: 'jogando', con }))
    if (import.meta.env.DEV) ganchos.rede = con // provas.rede()
    return () => {
      para(); montado.current = false
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
      cancelar.current = null; setFase({ f: 'juntos', con: c })
    }).catch((e: Error) => {
      if (minha !== tentativa.current) return
      cancelar.current = null; setAviso(e.message); setFase({ f: 'sala' })
    })
  }
  function convidar() { setAviso(null); setFase({ f: 'convidando', codigo: null }); abrir(criarSessao((c) => setFase({ f: 'convidando', codigo: c }))) }
  function entrar() {
    if (codigo.trim().length < 5) { setAviso('O código tem 5 letras.'); return }
    setAviso(null); setFase({ f: 'entrando', esperando: true }); abrir(entrarSessao(codigo))
  }
  function voltar() { tentativa.current++; cancelar.current?.(); cancelar.current = null; setFase({ f: 'sala' }) }
  function comecar() {
    if (fase.f === 'juntos') { fase.con.enviar({ t: 'comecar', mapa: D.mapa }); setFase({ f: 'jogando', con: fase.con }) }
    else setFase({ f: 'jogando', con: null })
  }

  if (fase.f === 'jogando') {
    if (!fase.con) return <Jogo go={go} mapa={D.mapa} sair={() => go('novo')} />
    const host = fase.con.papel === 'host', eu = host ? HOST : CONVIDADO, outro = host ? CONVIDADO : HOST
    const rede: Rede = { con: fase.con, modelo: eu.modelo, nome: eu.nome, outro }
    return <>
      <Jogo go={go} mapa={D.mapa} rede={rede} deslocar={host ? 0 : 1.6} sair={() => go('novo')} />
      <StatusRede con={fase.con} />
    </>
  }
  return (
    <div className="tela">
      <h2>{D.nome}</h2>
      <p className="online-texto">{D.texto}</p>
      {fase.f === 'sala' && <>
        <nav className="menu">
          <button autoFocus onClick={comecar}>Começar<span className="tag">SOZINHO</span></button>
          <button onClick={convidar}>Convidar amigo<span className="tag">MANDAR O CÓDIGO</span></button>
          <button onClick={() => { setAviso(null); setFase({ f: 'entrando', esperando: false }) }}>Entrar com código<span className="tag">O AMIGO CONVIDOU</span></button>
          <button onClick={() => go('novo')}>Voltar</button>
        </nav>
      </>}
      {fase.f === 'convidando' && <>
        {fase.codigo
          ? <><p className="online-texto">Mande este código para o seu amigo:</p><div className="online-codigo">{fase.codigo}</div><p className="online-texto">Esperando ele entrar…</p></>
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
      {fase.f === 'juntos' && <>
        <p className="online-texto">Na sessão <b>{fase.con.codigo}</b>: {HOST.nome} e {CONVIDADO.nome}.</p>
        <nav className="menu">
          {fase.con.papel === 'host'
            ? <button autoFocus onClick={comecar}>Começar<span className="tag">OS DOIS</span></button>
            : <p className="online-texto">Esperando o {HOST.nome} começar…</p>}
          <button onClick={() => { fase.con.fechar(); setFase({ f: 'sala' }) }}>Sair da sessão</button>
        </nav>
      </>}
      {aviso && <p className="online-erro">{aviso}</p>}
    </div>
  )
}
