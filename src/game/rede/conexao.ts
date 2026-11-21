// A conexão do teste online (docs/teste-online.md): um jogador ligado direto ao outro (WebRTC, pelo PeerJS). O host cria
// a sessão e recebe um código curto; o convidado digita o código e entra. Para os dois se acharem, o servidor gratuito
// do PeerJS apresenta um ao outro (só o código passa por ele); depois as mensagens vão direto de um navegador ao outro.
// Um canal só, confiável e em ordem (JSON): a 20 mensagens por segundo, pequenas, cabe folgado.
// O ping: a cada segundo um vai e volta (a média aparece na tela). Sem mensagem nenhuma por CONEXAO.silencio s, caiu.
import type Peer from 'peerjs'
import type { DataConnection } from 'peerjs'
import type { Msg, TipoMsg } from './mensagens'
import { CONEXAO } from './numeros'

const PREFIXO = 'agentes-cros-teste-' // o código vira o nome do host no servidor do PeerJS
const LETRAS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // sem 0/O e 1/I, que se confundem ditados

export type Papel = 'host' | 'convidado'
type Ouvinte = (m: Msg) => void

/** Uma sessão aberta entre os dois. ouvir(tipo, fn) devolve a função que para de ouvir. */
export interface Conexao {
  papel: Papel
  codigo: string
  ping: number // ms (ida e volta, a média)
  aberta: boolean
  enviar: (m: Msg) => void
  ouvir: <T extends TipoMsg>(tipo: T, fn: (m: Extract<Msg, { t: T }>) => void) => () => void
  aoFechar: (fn: (motivo: string) => void) => void
  fechar: () => void
}

// o PeerJS só carrega quando o teste online abre (não pesa no jogo de quem não usa)
const carregarPeer = () => import('peerjs').then((m) => m.default)

const novoCodigo = () => Array.from({ length: 5 }, () => LETRAS[Math.floor(Math.random() * LETRAS.length)]).join('')

/** Liga a conexão de dados (dos dois lados): o roteador das mensagens, o ping e o aviso de que caiu. */
function ligar(peer: Peer, dc: DataConnection, papel: Papel, codigo: string): Conexao {
  const ouvintes = new Map<string, Set<Ouvinte>>(), fechou: ((motivo: string) => void)[] = []
  let ultima = performance.now()
  const c: Conexao = {
    papel, codigo, ping: 0, aberta: true,
    enviar: (m) => { if (c.aberta && dc.open) dc.send(m) },
    ouvir: (tipo, fn) => {
      let s = ouvintes.get(tipo); if (!s) ouvintes.set(tipo, (s = new Set()))
      s.add(fn as Ouvinte)
      return () => { s!.delete(fn as Ouvinte) }
    },
    aoFechar: (fn) => { fechou.push(fn) },
    fechar: () => encerrar('Você saiu.', true),
  }
  function encerrar(motivo: string, avisar = false) {
    if (!c.aberta) return
    if (avisar && dc.open) dc.send({ t: 'tchau' } satisfies Msg)
    c.aberta = false; clearInterval(relogio)
    // dá tempo do tchau sair antes de desligar
    setTimeout(() => { dc.close(); peer.destroy() }, avisar ? 150 : 0)
    for (const f of fechou) f(motivo)
  }
  dc.on('data', (d) => {
    ultima = performance.now()
    const m = d as Msg
    if (m.t === 'ping') { dc.send({ t: 'pong', h: m.h } satisfies Msg); return }
    if (m.t === 'pong') { const rtt = performance.now() - m.h; c.ping = c.ping ? c.ping * 0.7 + rtt * 0.3 : rtt; return }
    if (m.t === 'tchau') { encerrar(papel === 'host' ? 'O convidado saiu.' : 'O host encerrou a sessão.'); return }
    ouvintes.get(m.t)?.forEach((f) => f(m))
  })
  dc.on('close', () => encerrar('A conexão caiu.'))
  dc.on('error', () => encerrar('A conexão caiu.'))
  peer.on('disconnected', () => { if (c.aberta) peer.reconnect() }) // o servidor de apresentação caiu: a conversa direta segue
  const relogio = setInterval(() => {
    if (performance.now() - ultima > CONEXAO.silencio * 1000) { encerrar('A conexão caiu (sem resposta).'); return }
    dc.send({ t: 'ping', h: performance.now() } satisfies Msg)
  }, CONEXAO.ping * 1000)
  return c
}

/** O erro do PeerJS em português, para a tela. */
function explicar(e: { type?: string; message?: string }) {
  switch (e.type) {
    case 'peer-unavailable': return 'Nenhuma sessão com esse código.'
    case 'network': case 'server-error': case 'socket-error': case 'socket-closed': return 'Sem conexão com o servidor de apresentação (internet?).'
    case 'browser-incompatible': return 'Este navegador não tem WebRTC.'
    default: return e.message || 'Erro na conexão.'
  }
}

/** O host: abre a sessão. pronto(codigo) chega quando o código já vale; a promessa resolve quando o convidado entra. */
export function criarSessao(pronto: (codigo: string) => void): { conexao: Promise<Conexao>; cancelar: () => void } {
  let peer: Peer | null = null, cancelado = false
  const conexao = new Promise<Conexao>((resolve, reject) => {
    const tentar = async (n: number) => {
      const Peer = await carregarPeer()
      if (cancelado) return
      const codigo = novoCodigo()
      peer = new Peer(PREFIXO + codigo.toLowerCase())
      peer.on('open', () => pronto(codigo))
      peer.on('error', (e) => {
        if (e.type === 'unavailable-id' && n < 5) { peer?.destroy(); void tentar(n + 1); return } // código já em uso: outro
        if (!cancelado) reject(new Error(explicar(e)))
      })
      peer.on('connection', (dc) => {
        // um convidado só: os outros são recusados (também o que chegou junto e abriu depois do primeiro)
        if (cancelado) { dc.close(); return }
        dc.on('open', () => { if (cancelado) { dc.close(); return } cancelado = true; resolve(ligar(peer!, dc, 'host', codigo)) })
      })
    }
    tentar(0).catch(() => reject(new Error('Não deu para carregar a conexão.')))
  })
  return { conexao, cancelar: () => { if (!cancelado) { cancelado = true; peer?.destroy() } } }
}

/** O convidado: entra na sessão do código. */
export function entrarSessao(codigo: string): { conexao: Promise<Conexao>; cancelar: () => void } {
  const cod = codigo.trim().toUpperCase()
  let aberto: Peer | null = null, feito = false
  const conexao = carregarPeer().then((P) => new Promise<Conexao>((resolve, reject) => {
    if (feito) return // cancelado enquanto o PeerJS carregava: não responde (quem chamou já seguiu)
    const peer = (aberto = new P())
    const desiste = setTimeout(() => { if (!feito) { feito = true; peer.destroy(); reject(new Error('A sessão não respondeu. Confira o código.')) } }, CONEXAO.espera * 1000)
    peer.on('error', (e) => { if (!feito) { feito = true; clearTimeout(desiste); peer.destroy(); reject(new Error(explicar(e))) } })
    peer.on('open', () => {
      const dc = peer.connect(PREFIXO + cod.toLowerCase(), { reliable: true, serialization: 'json' })
      dc.on('open', () => { if (feito) return; feito = true; clearTimeout(desiste); resolve(ligar(peer, dc, 'convidado', cod)) })
    })
  }))
  return { conexao, cancelar: () => { if (!feito) { feito = true; aberto?.destroy() } } }
}
