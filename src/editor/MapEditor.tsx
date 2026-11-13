// O criador de mapas: a tela no conceito B ("Arquivo C.R.O.S."): a barra de cima (mapa, andar, paredes altas /
// recortadas / baixas, desfazer, salvar), a coluna de ferramentas em ícones, a gaveta com o catálogo da ferramenta
// e o Painel Inspetor flutuante. As ferramentas: paredes, apagar, piso e teto, pincel, portas e janelas, escadas,
// objetos e luzes, o conta-gotas e a ambientação (as áreas de luz). Mais o gerenciador de mapas (novo, abrir, salvar, copiar, apagar, exportar, importar).
// O mapa aberto é um documento (doc.ts): as ferramentas geram um documento novo e a vista desenha a partir dele.
import { Suspense, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Canvas } from '@react-three/fiber'
import { Grid } from '@react-three/drei'
import type { Go } from '../App'
import * as disco from '../maps/storage'
import { CHUNK, LEVEL_H } from '../maps/types'
import { aberturas, andarTemCoisa, comAbertura, comAmbiente, comSemChao, comAndares, comArea, mudarArea, semArea, comEscada, comObjeto, comParedes, comPiso, docDe, escadaCabe, escadas, sentidoNovo, mudarAbertura, mudarEscada, mudarObjeto, objetos, pacoteDe, pintarLados, semAbertura, semEscada, semObjeto, semParedes, semPiso, type LadoDe, type MapDoc, type Seg } from './doc'
import type { AreaAmbiente, Prop, Stair, Vec3 } from '../maps/types'
import { AMBIENTE_PADRAO } from '../maps/ambientes'
import { FerramentaAmbiente, nomeAmbiente } from './FerramentaAmbiente'
import { EscolherAmbiente, PainelArea } from './PainelArea'
import { OBJETOS } from '../maps/objetos'
import { CORTE, setModoParedes, type ModoParedes } from '../render/corte'
import { Testar } from '../game/Testar'
import { Desempenho } from '../game/Desempenho'
import { canvasDoNivel, useDefinicao } from '../render/qualidade'
import type { PortasVivas } from '../game/world/portas'
import { ICONES } from './Icones'
import { GavetaAberturas, GavetaObjetos, GavetaPincel, GavetaPiso } from './Gaveta'
import { FerramentaContaGotas, descreverPego, type Pego } from './FerramentaContaGotas'
import { FerramentaObjetos } from './FerramentaObjetos'
import { PainelObjeto } from './PainelObjeto'
import { Inspetor } from './Inspetor'
import { nomeDe } from './FerramentaAberturas'
import { FerramentaEscadas } from './FerramentaEscadas'
import { PainelEscada } from './PainelEscada'
import type { Opening } from '../maps/types'
import { FerramentaAberturas, type TipoAbertura } from './FerramentaAberturas'
import { PainelAbertura } from './PainelAbertura'
import { useHistorico } from './historico'
import { EditorCamera } from './EditorCamera'
import { FerramentaParedes } from './FerramentaParedes'
import { FerramentaPincel } from './FerramentaPincel'
import { FerramentaPiso } from './FerramentaPiso'
import { Paleta } from './Paleta'
import { MapManager } from './MapManager'
import { MapView } from './MapView'
import { Hud, type EstadoHud } from '../game/hud/Hud'

type Ferramenta = 'paredes' | 'apagar' | 'piso' | 'pincel' | 'aberturas' | 'escadas' | 'objetos' | 'contagotas' | 'ambiente'
const FERRAMENTAS: { id: Ferramenta; nome: string; tecla: string; icone: ReactNode }[] = [
  { id: 'paredes', nome: 'Paredes', tecla: '1', icone: ICONES.paredes },
  { id: 'apagar', nome: 'Apagar paredes', tecla: '2', icone: ICONES.apagar },
  { id: 'piso', nome: 'Piso e teto', tecla: '3', icone: ICONES.piso },
  { id: 'pincel', nome: 'Pintar parede', tecla: '4', icone: ICONES.pincel },
  { id: 'aberturas', nome: 'Portas e janelas', tecla: '5', icone: ICONES.aberturas },
  { id: 'escadas', nome: 'Escadas', tecla: '6', icone: ICONES.escadas },
  { id: 'objetos', nome: 'Objetos e luzes', tecla: '7', icone: ICONES.objetos },
  { id: 'contagotas', nome: 'Conta-gotas', tecla: '8', icone: ICONES.contagotas },
  { id: 'ambiente', nome: 'Ambientação', tecla: '9', icone: ICONES.ambiente },
]
const SEM_NIVEL = { dpr: [1, 2] as [number, number], shadows: false as const } // o editor: a resolução da tela, sem sombras
const MODOS_PAREDE: ModoParedes[] = ['altas', 'recortadas', 'baixas']
const CHAVE_MODO = 'entidades.editor.paredes'
const lerModo = (): ModoParedes => { try { const m = localStorage.getItem(CHAVE_MODO) as ModoParedes; return MODOS_PAREDE.includes(m) ? m : 'recortadas' } catch { return 'recortadas' } }
const ULTIMO = 'entidades.editor.ultimo' // o último mapa aberto (abre sozinho na próxima vez)
const ID_OK = /^[a-z0-9][a-z0-9_-]{0,63}$/

const lerUltimo = () => { try { return localStorage.getItem(ULTIMO) } catch { return null } }
const guardarUltimo = (id: string) => { try { localStorage.setItem(ULTIMO, id) } catch { /* sem armazenamento: tudo bem */ } }
const nomeAndar = (i: number) => (i === 0 ? 'Térreo' : `${i}º andar`)
const AJUDA: Record<Ferramenta, string> = {
  paredes: 'Arraste numa linha: parede reta. Arraste em diagonal: sala fechada pelas quatro paredes. Ctrl + arrastar apaga. Esc cancela.',
  apagar: 'Arraste uma área: apaga as paredes dentro dela. Clique numa parede: apaga só aquele pedaço.',
  piso: 'Arraste uma área (ou clique num quadrado): põe o piso com o chão e o teto de baixo escolhidos; num piso que já existe, repinta. Ctrl + arrastar apaga o piso.',
  pincel: 'Clique numa parede: pinta o lado virado para você. Arraste: pinta tudo por onde passar. Shift + clique: pinta a sala inteira por dentro.',
  aberturas: 'Escolha o tipo e clique numa parede para pôr. Clique numa porta ou janela para mudar as propriedades; Ctrl + clique (ou Del) apaga.',
  objetos: 'Escolha um objeto e clique no chão para pôr (encaixa a cada 0,25 m; R gira 15°, Shift + R 45°; Esc para de pôr). Clique num objeto para escolher e arraste para mover; Ctrl + clique (ou Del) apaga. O modo livre fica no painel do escolhido.',
  contagotas: 'Clique numa parede, piso, porta, janela, escada ou objeto: o editor pega a textura ou o objeto e troca para a ferramenta certa.',
  ambiente: 'Arraste uma área: ela ganha a ambientação escolhida (a luz, a neblina, o tom de cor do lugar). Clique numa área para trocar a ambientação dela; Ctrl + clique (ou Del) apaga. Onde duas áreas se cruzam, vale a menor. No Testar a luz troca suave quando o agente passa de uma para outra.',
  escadas: 'Arraste a área da escada do pé até o topo: ela sobe no sentido do arraste (o lado mais comprido). Os degraus se montam pela altura do andar e o piso de cima ganha o buraco. Clique numa escada para escolher; Ctrl + clique (ou Del) apaga.',
}
// o que vai na gaveta das ferramentas que não têm catálogo
const EXTRA: Partial<Record<Ferramenta, string>> = {
  paredes: 'As paredes novas saem em reboco creme; pinte depois com o pincel (4). A medida aparece no meio do arraste.',
  apagar: 'Apagar a parede apaga junto a porta ou janela que estava nela. Ctrl+Z traz tudo de volta.',
  contagotas: 'Pegou? Ele troca sozinho para o pincel, o piso, as portas e janelas, as escadas ou os objetos, com a escolha pronta.',
}


export function MapEditor({ go }: { go: Go }) {
  const hist = useHistorico<MapDoc | null>(null)
  const doc = hist.atual
  const [salvo, setSalvo] = useState<MapDoc | null>(null) // o documento igual ao que está no disco
  const [mapas, setMapas] = useState<disco.MapInfo[]>([])
  const [gerenciador, setGerenciador] = useState(false)
  const [ocupado, setOcupado] = useState(false)
  const [ferramenta, setFerramenta] = useState<Ferramenta>('paredes')
  const [andarEscolhido, setAndar] = useState(0)
  const [aviso, setAviso] = useState('')
  const [pincel, setPincel] = useState({ parede: 'reboco-creme', barra: 'lambri-madeira', h: 1, comBarra: true })
  const [piso, setPiso] = useState({ chao: 'taco-madeira', teto: 'gesso' })
  const [tipoAbertura, setTipoAbertura] = useState<TipoAbertura>('comum')
  const [larguraVao, setLarguraVao] = useState(1)
  const [selecionada, setSelecionada] = useState<string | null>(null) // a porta, janela ou escada escolhida
  const [texEscada, setTexEscada] = useState('tabua-corrida')
  const [tipoObjeto, setTipoObjeto] = useState<string | null>(null) // o objeto do catálogo para pôr
  const [rotObjeto, setRotObjeto] = useState(0)
  const [ambienteNovo, setAmbienteNovo] = useState(AMBIENTE_PADRAO) // a ambientação das áreas novas
  const [arrastando, setArrastando] = useState<string | null>(null) // o objeto sendo arrastado (some do lugar antigo)
  const [modoParedes, setModoState] = useState<ModoParedes>(lerModo)
  const setModo = (m: ModoParedes) => { setModoState(m); try { localStorage.setItem(CHAVE_MODO, m) } catch { /* vale só agora */ } }
  // o Testar: o agente andando no mapa (paredes sempre altas enquanto joga)
  const [testando, setTestando] = useState<{ inicio: [number, number, number]; yaw: number } | null>(null)
  const definicao = useDefinicao()
  const [travado, setTravado] = useState(false)
  const [dicaTeste, setDicaTeste] = useState<string | null>(null)
  const [mirando, setMirando] = useState(false)
  const [escuro, setEscuro] = useState(false)
  const hudTeste = useRef<((e: EstadoHud) => void) | null>(null) // o HUD do Testar (o Testar conta a cada quadro)
  const onHudTeste = useCallback((e: EstadoHud) => hudTeste.current?.(e), [])
  // o estado vivo das portas enquanto testa (o mapa não muda; sair do teste volta tudo como estava)
  const portasVivas = useMemo<PortasVivas | null>(() => (testando ? new Map() : null), [testando])
  useEffect(() => { setModoParedes(testando ? 'altas' : modoParedes) }, [modoParedes, testando])
  function comecarTeste() {
    if (!doc) return
    // o agente aparece no ponto que a câmera do editor olha, de costas para ela
    const a = CORTE.alvo.value, d = CORTE.dir.value
    setSelecionada(null); setTipoObjeto(null)
    setTestando({ inicio: [a.x, andar * LEVEL_H, a.y], yaw: Math.atan2(-d.x, -d.y) })
  }
  const sairTeste = useCallback(() => { setTestando(null); setTravado(false); setDicaTeste(null) }, [])
  // o aviso some sozinho depois de uns segundos
  useEffect(() => { if (!aviso) return; const t = setTimeout(() => setAviso(''), 5000); return () => clearTimeout(t) }, [aviso])
  const statusRef = useRef<HTMLSpanElement>(null)
  const desempenhoRef = useRef<HTMLPreElement>(null) // o medidor do Testar (o texto vem de dentro da cena)
  const onDesempenho = useCallback((t: string) => { if (desempenhoRef.current) desempenhoRef.current.textContent = t }, [])
  const iniciou = useRef(false)

  const sujo = !!doc && doc !== salvo
  const nAndares = doc?.meta.levels ?? 1
  const andar = Math.min(andarEscolhido, nAndares - 1) // o desfazer pode tirar um andar
  const inicio = useMemo<[number, number]>(() => (doc ? [doc.meta.spawn.pos[0], doc.meta.spawn.pos[2]] : [0, 0]), [doc?.meta.id])

  const recarregar = useCallback(async () => { const ms = await disco.listar(); setMapas(ms); return ms }, [])

  /** Uma ação que fala com o disco: trava os botões e mostra o erro como aviso. */
  async function tarefa(fn: () => Promise<void>) {
    setOcupado(true)
    try { await fn() } catch (e) { setAviso(String((e as Error).message)) } finally { setOcupado(false) }
  }
  const podePerder = () => !sujo || confirm(`O mapa "${doc!.meta.nome}" tem mudanças não salvas. Descartar as mudanças?`)

  function abrirDoc(d: MapDoc) {
    hist.trocar(d); setSalvo(d); setAndar(0); setGerenciador(false); guardarUltimo(d.meta.id)
  }

  /** O nome do mapa vira o nome da pasta; não pode repetir um que já existe. */
  function idLivre(nome: string) {
    const id = disco.slug(nome)
    if (!id) { setAviso('Nome inválido: use letras ou números.'); return null }
    if (mapas.some((m) => m.id === id)) { setAviso(`Já existe a pasta maps/${id}/. Escolha outro nome.`); return null }
    return id
  }

  // abre o último mapa aberto (ou o primeiro da pasta); sem mapas, abre o gerenciador
  useEffect(() => {
    if (iniciou.current) return
    iniciou.current = true
    tarefa(async () => {
      const ms = await recarregar()
      const id = ms.find((m) => m.id === lerUltimo())?.id ?? ms[0]?.id
      if (id) abrirDoc(docDe(await disco.ler(id)))
      else setGerenciador(true)
    })
  }, [])

  function abrir(id: string) {
    if (doc?.meta.id === id) { setGerenciador(false); return }
    if (!podePerder()) return
    tarefa(async () => { const b = await disco.ler(id); abrirDoc(docDe(b)); setAviso(`Aberto: ${b.meta.nome}`) })
  }

  function novo() {
    const nome = prompt('Nome do mapa novo:')?.trim()
    if (!nome) return
    const id = idLivre(nome)
    if (!id || !podePerder()) return
    tarefa(async () => {
      const b = disco.mapaVazio(id, nome)
      await disco.salvar(b, { criar: true })
      await recarregar()
      abrirDoc(docDe(b))
      setAviso(`Mapa novo em maps/${id}/.`)
    })
  }

  function salvar() {
    if (!doc || !disco.podeGravar) return
    const d = doc // o que foi salvo; o que mudar durante a gravação continua "não salvo"
    tarefa(async () => { await disco.salvar(pacoteDe(d)); setSalvo(d); await recarregar(); setAviso(`Salvo em maps/${d.meta.id}/`) })
  }

  function copiar(id: string) {
    const orig = mapas.find((m) => m.id === id)?.nome ?? id
    if (doc?.meta.id === id && sujo) { setAviso('Salve antes de copiar: a cópia sai do que está salvo no disco.'); return }
    const nome = prompt(`Nome do mapa novo, copiado de "${orig}":`, `${orig} (cópia)`)?.trim()
    if (!nome) return
    const novoId = idLivre(nome)
    if (!novoId || !podePerder()) return
    tarefa(async () => {
      const b = await disco.ler(id)
      const c: disco.MapBundle = { ...b, meta: { ...b.meta, id: novoId, nome } }
      await disco.salvar(c, { criar: true })
      await recarregar()
      abrirDoc(docDe(c))
      setAviso(`Copiado de "${b.meta.nome}" para maps/${novoId}/. São mapas separados: mudar um não muda o outro.`)
    })
  }

  function apagar(id: string) {
    const nome = mapas.find((m) => m.id === id)?.nome ?? id
    const digitado = prompt(`Apagar de vez o mapa "${nome}" (a pasta maps/${id}/)?\n\nPara confirmar, digite o nome da pasta: ${id}`)
    if (digitado === null) return
    if (digitado.trim() !== id) { setAviso('O nome não confere: nada foi apagado.'); return }
    tarefa(async () => {
      await disco.apagar(id)
      if (doc?.meta.id === id) { hist.trocar(null); setSalvo(null) }
      await recarregar()
      setAviso(`Apagado: maps/${id}/. Se ele estava num commit, dá para recuperar pelo git.`)
    })
  }

  function exportar(id: string) {
    tarefa(async () => {
      disco.exportar(await disco.ler(id))
      setAviso(doc?.meta.id === id && sujo ? `Exportei a versão salva de "${doc.meta.nome}"; as mudanças não salvas ficaram de fora.` : `Exportado: ${id}.mapa.json`)
    })
  }

  function importar(f: File) {
    if (!podePerder()) return
    tarefa(async () => {
      const b = await disco.lerArquivo(f)
      const lista = await recarregar()
      let { id, nome } = b.meta
      if (!ID_OK.test(id) || lista.some((m) => m.id === id)) {
        const n = prompt(`Já existe um mapa "${id}" na pasta (ou o nome dele não serve). Nome para o mapa importado:`, `${nome} (importado)`)?.trim()
        if (!n) { setAviso('Importação cancelada.'); return }
        nome = n; id = disco.slug(n)
        if (!id || lista.some((m) => m.id === id)) throw new Error(`Já existe a pasta maps/${id}/ (ou o nome é inválido). Nada foi importado.`)
      }
      const c: disco.MapBundle = { ...b, meta: { ...b.meta, id, nome } }
      await disco.salvar(c, { criar: true })
      await recarregar()
      abrirDoc(docDe(c))
      setAviso(`Importado "${nome}" para maps/${id}/.`)
    })
  }

  function maisAndar() {
    hist.mudar((d) => d && comAndares(d, d.meta.levels + 1))
    setAndar(nAndares)
  }
  function menosAndar() {
    if (!doc || nAndares <= 1) return
    const topo = nAndares - 1
    if (andarTemCoisa(doc, topo)) { setAviso(`O ${nomeAndar(topo).toLowerCase()} tem coisas: apague antes de tirar o andar.`); return }
    hist.mudar((d) => d && comAndares(d, d.meta.levels - 1))
  }

  const onFeito = useCallback((segs: Seg[], tirar: boolean) => hist.mudar((d) => d && (tirar ? semParedes(d, segs) : comParedes(d, segs))), [hist.mudar])
  const onPiso = useCallback((qs: [number, number][], tirar: boolean) =>
    hist.mudar((d) => d && (tirar ? semPiso(d, andar, qs) : comPiso(d, andar, qs, piso.chao, piso.teto))), [hist.mudar, andar, piso])
  const onPintar = useCallback((lados: LadoDe[]) => hist.mudar((d) => d && pintarLados(d, lados,
    pincel.comBarra ? { tex: pincel.parede, base: { tex: pincel.barra, h: pincel.h } } : { tex: pincel.parede })), [hist.mudar, pincel])
  // a escolhida some se o desfazer tirou ela, ou se trocou de ferramenta
  const escolhida = doc && selecionada && ferramenta === 'aberturas' ? aberturas(doc).find((o) => o.id === selecionada) : undefined
  const onPorAbertura = useCallback((o: Omit<Opening, 'id'>) => {
    if (!doc) return
    const r = comAbertura(doc, o)
    hist.mudar(() => r.doc); setSelecionada(r.id)
  }, [doc, hist.mudar])
  const onApagarAbertura = useCallback((id: string) => { hist.mudar((d) => d && semAbertura(d, id)); setSelecionada(null) }, [hist.mudar])
  const onMudarAbertura = (patch: Partial<Opening>) => { if (escolhida) hist.mudar((d) => d && mudarAbertura(d, escolhida.id, patch)) }
  const escadaEscolhida = doc && selecionada && ferramenta === 'escadas' ? escadas(doc).find((s) => s.id === selecionada) : undefined
  const onPorEscada = useCallback((st: Omit<Stair, 'id'>) => {
    if (!doc) return
    const r = comEscada(doc, st)
    hist.mudar(() => r.doc); setSelecionada(r.id)
  }, [doc, hist.mudar])
  const onApagarEscada = useCallback((id: string) => { hist.mudar((d) => d && semEscada(d, id)); setSelecionada(null) }, [hist.mudar])
  const objetoEscolhido = doc && selecionada && ferramenta === 'objetos' ? objetos(doc).find((o) => o.id === selecionada) : undefined
  const onPorObjeto = useCallback((o: Omit<Prop, 'id'>) => {
    if (!doc) return
    const r = comObjeto(doc, o)
    hist.mudar(() => r.doc); setSelecionada(r.id)
  }, [doc, hist.mudar])
  const onMoverObjeto = useCallback((id: string, pos: Vec3) => hist.mudar((d) => d && mudarObjeto(d, id, { pos })), [hist.mudar])
  const onApagarObjeto = useCallback((id: string) => { hist.mudar((d) => d && semObjeto(d, id)); setSelecionada(null) }, [hist.mudar])
  // os controles deslizantes do modo livre juntam as mudanças seguidas num passo só de desfazer
  const onMudarObjeto = (patch: Partial<Prop>) => { if (objetoEscolhido) hist.mudar((d) => d && mudarObjeto(d, objetoEscolhido.id, patch), 'obj:' + objetoEscolhido.id + ':' + Object.keys(patch).join()) }
  const onMudarEscada = (patch: Partial<Stair>) => {
    if (!escadaEscolhida || !doc) return
    const p = patch.dir ? { ...patch, ...sentidoNovo(escadaEscolhida, patch.dir) } : patch
    const erro = escadaCabe(doc, { ...escadaEscolhida, ...p }, escadaEscolhida.id)
    if (erro) { setAviso('Girando assim ela bate em outra escada.'); return }
    hist.mudar((d) => d && mudarEscada(d, escadaEscolhida.id, p))
  }
  const areaEscolhida = doc && selecionada && ferramenta === 'ambiente' ? doc.meta.areas.find((a) => a.id === selecionada) : undefined
  const onPorArea = useCallback((a: Omit<AreaAmbiente, 'id'>) => {
    if (!doc) return
    const r = comArea(doc, a)
    hist.mudar(() => r.doc); setSelecionada(r.id)
  }, [doc, hist.mudar])
  const onApagarArea = useCallback((id: string) => { hist.mudar((d) => d && semArea(d, id)); setSelecionada(null) }, [hist.mudar])
  const onInfo = useCallback((t: string) => { if (statusRef.current) statusRef.current.textContent = t }, [])

  /** O conta-gotas pegou alguma coisa: guarda a escolha e troca para a ferramenta que repete. */
  function onPegar(p: Pego) {
    setSelecionada(null)
    if (p.tipo === 'parede') { setPincel({ parede: p.side.tex, barra: p.side.base?.tex ?? pincel.barra, h: p.side.base?.h ?? pincel.h, comBarra: !!p.side.base }); setFerramenta('pincel') }
    else if (p.tipo === 'piso') { setPiso({ chao: p.top, teto: p.bottom }); setFerramenta('piso') }
    else if (p.tipo === 'objeto') { setTipoObjeto(p.type); setRotObjeto(p.rot); setFerramenta('objetos') }
    else if (p.tipo === 'abertura') { setTipoAbertura(p.tipoAbertura); if (p.tipoAbertura === 'vao') setLarguraVao(p.width); setFerramenta('aberturas') }
    else { setTexEscada(p.tex); setFerramenta('escadas') }
    setAviso('Peguei · ' + descreverPego(p))
  }

  function sair() { if (podePerder()) go('dev') }

  // os atalhos leem sempre as funções da última renderização
  const atalhos = useRef<(e: KeyboardEvent) => void>(() => {})
  atalhos.current = (e) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
    if (testando) return // jogando: as teclas são do agente (Esc volta, quem cuida é o Testar)
    const ctrl = e.ctrlKey || e.metaKey, k = e.key.toLowerCase()
    if (ctrl && k === 'z' && !e.shiftKey) { e.preventDefault(); hist.desfazer() }
    else if (ctrl && (k === 'y' || (k === 'z' && e.shiftKey))) { e.preventDefault(); hist.refazer() }
    else if (ctrl && k === 's') { e.preventDefault(); salvar() }
    else if (ctrl) return
    else if (e.key === 'PageUp') { e.preventDefault(); setAndar(Math.min(nAndares - 1, andar + 1)) }
    else if (e.key === 'PageDown') { e.preventDefault(); setAndar(Math.max(0, andar - 1)) }
    else if (doc && FERRAMENTAS.some((f) => f.tecla === e.key)) setFerramenta(FERRAMENTAS.find((f) => f.tecla === e.key)!.id)
    else if (k === 't' && doc && !gerenciador) comecarTeste()
    else if (k === 'v') setModo(MODOS_PAREDE[(MODOS_PAREDE.indexOf(modoParedes) + 1) % 3])
    else if (k === 'r' && ferramenta === 'objetos') {
      const passo = e.shiftKey ? 45 : 15
      if (tipoObjeto) setRotObjeto((r) => (r + passo) % 360)
      else if (objetoEscolhido) onMudarObjeto({ rot: [objetoEscolhido.rot[0], ((objetoEscolhido.rot[1] + passo + 540) % 360) - 180, objetoEscolhido.rot[2]] })
    }
    else if ((e.key === 'Delete' || e.key === 'Backspace') && objetoEscolhido) onApagarObjeto(objetoEscolhido.id)
    else if (e.key === 'Escape' && ferramenta === 'objetos' && tipoObjeto) setTipoObjeto(null)
    else if ((e.key === 'Delete' || e.key === 'Backspace') && escolhida) onApagarAbertura(escolhida.id)
    else if ((e.key === 'Delete' || e.key === 'Backspace') && escadaEscolhida) onApagarEscada(escadaEscolhida.id)
    else if ((e.key === 'Delete' || e.key === 'Backspace') && areaEscolhida) onApagarArea(areaEscolhida.id)
    else if (e.key === 'Escape' && gerenciador && doc) setGerenciador(false)
    else if (e.key === 'Escape') setSelecionada(null)
  }
  useEffect(() => {
    const kd = (e: KeyboardEvent) => atalhos.current(e)
    window.addEventListener('keydown', kd)
    return () => window.removeEventListener('keydown', kd)
  }, [])

  // fechar a aba com mudanças não salvas: o navegador pergunta
  useEffect(() => {
    if (!sujo) return
    const f = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', f)
    return () => window.removeEventListener('beforeunload', f)
  }, [sujo])

  const ferr = FERRAMENTAS.find((f) => f.id === ferramenta)!
  return (
    <div className={testando ? 'editor testando' : 'editor'}>
      {/* a barra de cima: o mapa, o andar, as paredes, desfazer e salvar */}
      <header className="topo">
        <button className="bt" onClick={() => setGerenciador(true)} data-dica="Novo, abrir, copiar, exportar, importar">{ICONES.mapas} Mapas</button>
        <span className="nome-mapa" title={doc ? `maps/${doc.meta.id}/` : ''}>{doc ? doc.meta.nome : 'Nenhum mapa'}{sujo && <span className="sujo" title="mudanças não salvas"> •</span>}</span>
        {doc && <>
          <div className="grupo">
            <span className="rotulo-b">Andar</span>
            <button className="ic" onClick={() => setAndar(Math.max(0, andar - 1))} disabled={andar === 0} data-dica="Andar de baixo (PageDown)">{ICONES.descer}</button>
            <span className="andar-atual">{nomeAndar(andar)}</span>
            <button className="ic" onClick={() => setAndar(Math.min(nAndares - 1, andar + 1))} disabled={andar >= nAndares - 1} data-dica="Andar de cima (PageUp)">{ICONES.subir}</button>
            <button className="ic" onClick={maisAndar} data-dica="Criar um andar em cima">{ICONES.mais}</button>
            <button className="ic" onClick={menosAndar} disabled={nAndares <= 1} data-dica="Tirar o último andar (vazio)">{ICONES.menos}</button>
          </div>
          <div className="grupo">
            <span className="rotulo-b">Paredes</span>
            {(['altas', 'recortadas', 'baixas'] as ModoParedes[]).map((mo) => (
              <button key={mo} className="ic" aria-pressed={modoParedes === mo} onClick={() => setModo(mo)} data-dica={`Paredes ${mo} (V troca)`}>{ICONES[mo]}</button>
            ))}
          </div>
        </>}
        <span className="espaco" />
        <button className="bt testar-b" onClick={comecarTeste} disabled={!doc || !!testando} data-dica="O agente anda no mapa, onde a câmera olha (T)">{ICONES.testar} Testar</button>
        <button className="ic" onClick={hist.desfazer} disabled={!hist.podeDesfazer} data-dica="Desfazer (Ctrl+Z)">{ICONES.desfazer}</button>
        <button className="ic" onClick={hist.refazer} disabled={!hist.podeRefazer} data-dica="Refazer (Ctrl+Y)">{ICONES.refazer}</button>
        <button className="bt" onClick={salvar} disabled={!doc || !disco.podeGravar || ocupado} data-dica={disco.podeGravar ? 'Salvar (Ctrl+S)' : 'Só com npm run dev'}>{ICONES.salvar} Salvar</button>
        <button className="ic" onClick={sair} data-dica="Sair do criador">{ICONES.sair}</button>
      </header>

      {/* a coluna de ferramentas */}
      <nav className="ferramentas" aria-label="Ferramentas">
        {FERRAMENTAS.map((f, i) => (
          <span key={f.id} style={{ display: 'contents' }}>
            {(i === 4 || i === 7 || i === 8) && <hr />}
            <button aria-pressed={ferramenta === f.id} onClick={() => setFerramenta(f.id)} disabled={!doc} data-dica={`${f.nome} (${f.tecla})`} aria-label={f.nome}>
              {f.icone}<span className="tecla">{f.tecla}</span>
            </button>
          </span>
        ))}
      </nav>

      <div className="vista">
        {/* no Testar, a resolução e as sombras são as do nível de qualidade */}
        <Canvas camera={{ position: [10, 12, 10], fov: 50 }} {...(testando ? canvasDoNivel(definicao) : SEM_NIVEL)}>
          <color attach="background" args={['#0b0c0f']} />
          {/* luz de trabalho: clara e sem sombra, para ver as texturas; cada lado da parede pega um tom diferente */}
          {!testando && <>
            <hemisphereLight args={['#fff4e0', '#3a3530', 1.6]} />
            <directionalLight position={[8, 16, 6]} intensity={1.4} />
            <directionalLight position={[-10, 8, -4]} intensity={0.5} />
          </>}
          {doc && <Suspense fallback={null}><MapView chunks={doc.chunks} maxLevel={testando ? nAndares - 1 : andar} ocultar={ferramenta === 'objetos' && !testando ? arrastando : null} portas={portasVivas} juntar={!!testando} /></Suspense>}
          {doc && testando && portasVivas && <Testar chunks={doc.chunks} levels={nAndares} ambiente={doc.meta.ambiente} semChao={doc.meta.semChao} areas={doc.meta.areas} inicio={testando.inicio} yaw={testando.yaw} portas={portasVivas} onTravado={setTravado} onDica={setDicaTeste} onMira={setMirando} onEscuro={setEscuro} onHud={onHudTeste} onSair={sairTeste} />}
          {testando && <Desempenho onTexto={onDesempenho} />}
          {doc && !testando && (ferramenta === 'paredes' || ferramenta === 'apagar') && <FerramentaParedes doc={doc} andar={andar} apagar={ferramenta === 'apagar'} onFeito={onFeito} onInfo={onInfo} />}
          {doc && !testando && ferramenta === 'piso' && <FerramentaPiso doc={doc} andar={andar} onFeito={onPiso} onInfo={onInfo} />}
          {doc && !testando && ferramenta === 'pincel' && <FerramentaPincel doc={doc} andar={andar} onFeito={onPintar} onInfo={onInfo} />}
          {doc && !testando && ferramenta === 'objetos' && <FerramentaObjetos doc={doc} andar={andar} tipo={tipoObjeto} rot={rotObjeto} selecionada={objetoEscolhido?.id ?? null}
            onPor={onPorObjeto} onSelecionar={setSelecionada} onMover={onMoverObjeto} onApagar={onApagarObjeto} onArrastando={setArrastando} onInfo={onInfo} />}
          {doc && !testando && ferramenta === 'escadas' && <FerramentaEscadas doc={doc} andar={andar} tex={texEscada} selecionada={escadaEscolhida?.id ?? null}
            onPor={onPorEscada} onSelecionar={setSelecionada} onApagar={onApagarEscada} onInfo={onInfo} />}
          {doc && !testando && ferramenta === 'aberturas' && <FerramentaAberturas doc={doc} andar={andar} tipo={tipoAbertura} larguraVao={larguraVao} selecionada={escolhida?.id ?? null}
            onPor={onPorAbertura} onSelecionar={setSelecionada} onApagar={onApagarAbertura} onInfo={onInfo} />}
          {doc && !testando && ferramenta === 'ambiente' && <FerramentaAmbiente doc={doc} andar={andar} ambiente={ambienteNovo} selecionada={areaEscolhida?.id ?? null}
            onPor={onPorArea} onSelecionar={setSelecionada} onApagar={onApagarArea} onInfo={onInfo} />}
          {doc && !testando && ferramenta === 'contagotas' && <FerramentaContaGotas doc={doc} andar={andar} onPegar={onPegar} onInfo={onInfo} />}
          {/* a malha: 1 m em linha fina, o bloco de 16 m em linha forte (ajuda a medir e a manter a simetria) */}
          {!testando && <Grid position={[0, andar * LEVEL_H + 0.006, 0]} args={[64, 64]} cellSize={1} cellThickness={1} cellColor="#8a7552" sectionSize={CHUNK} sectionThickness={2} sectionColor="#e0a050" fadeDistance={260} fadeStrength={0.8} infiniteGrid />}
          <EditorCamera y={andar * LEVEL_H} inicio={inicio} ativa={!testando} />
        </Canvas>
        {!doc && <div className="vazio-b">Nenhum mapa aberto. Abra ou crie um em Mapas.</div>}
        {aviso && <div className="aviso-b">{aviso}</div>}
        {testando && dicaTeste && <div className="dica-teste">{dicaTeste}</div>}
        {testando && mirando && <div className="mira-ponto" />}
        {testando && <div className={escuro ? 'escuro-teste ligado' : 'escuro-teste'} />}
        {testando && <pre className="desempenho-teste" ref={desempenhoRef} />}
        {testando && <Hud painel={hudTeste} />}
        {testando && <div className={travado ? 'teste-b jogando' : 'teste-b'}>
          {travado
            ? <span>WASD anda · Shift corre · Espaço esquiva · E abre e fecha porta · Q troca a arma · R recarrega a escopeta · botão direito mira, esquerdo atira (ou joga a armadilha; fora, chama de volta) · mouse olha (sem o cursor travado: arraste) · 1–6 expressões, 7–9 mãos, 0 automático, J toma dano, F kit, K cai, M momento de luz, F3 desempenho · <b>Esc</b> volta ao editor</span>
            : <><b>Testar</b><span>Clique na vista para jogar · Esc volta ao editor</span></>}
        </div>}
        {/* o Painel Inspetor: as configurações do que está escolhido, numa janela que se arrasta */}
        {!testando && objetoEscolhido && <Inspetor titulo={OBJETOS[objetoEscolhido.type]?.nome ?? objetoEscolhido.type} onFechar={() => setSelecionada(null)}>
          <PainelObjeto p={objetoEscolhido} onMudar={onMudarObjeto} onApagar={() => onApagarObjeto(objetoEscolhido.id)} />
        </Inspetor>}
        {!testando && escolhida && <Inspetor titulo={nomeDe(escolhida)} onFechar={() => setSelecionada(null)}>
          <PainelAbertura o={escolhida} onMudar={onMudarAbertura} onApagar={() => onApagarAbertura(escolhida.id)} />
        </Inspetor>}
        {!testando && areaEscolhida && <Inspetor titulo={`Área · ${nomeAmbiente(areaEscolhida.ambiente)}`} onFechar={() => setSelecionada(null)}>
          <PainelArea a={areaEscolhida} onMudar={(patch) => hist.mudar((d) => d && mudarArea(d, areaEscolhida.id, patch))} onApagar={() => onApagarArea(areaEscolhida.id)} />
        </Inspetor>}
        {!testando && escadaEscolhida && <Inspetor titulo="Escada" onFechar={() => setSelecionada(null)}>
          <PainelEscada s={escadaEscolhida} onMudar={onMudarEscada} onApagar={() => onApagarEscada(escadaEscolhida.id)} />
        </Inspetor>}
      </div>

      {/* a gaveta: o catálogo e as opções da ferramenta escolhida */}
      <section className="gaveta">
        <div className="cabeca">
          <b>{ferr.nome}</b>
          <span className="ajuda">{AJUDA[ferramenta]}</span>
        </div>
        <div className="conteudo">
          {ferramenta === 'piso' && <GavetaPiso piso={piso} setPiso={setPiso} andar={andar} />}
          {ferramenta === 'pincel' && <GavetaPincel pincel={pincel} setPincel={setPincel} />}
          {ferramenta === 'aberturas' && <GavetaAberturas tipo={tipoAbertura} setTipo={setTipoAbertura} larguraVao={larguraVao} setLarguraVao={setLarguraVao} />}
          {ferramenta === 'escadas' && <Paleta titulo="Degraus da escada nova" uso="piso" valor={texEscada} onEscolher={setTexEscada} />}
          {ferramenta === 'objetos' && <GavetaObjetos tipo={tipoObjeto} onEscolher={(t) => { setTipoObjeto(t); setSelecionada(null) }} />}
          {ferramenta === 'ambiente' && doc && <>
            <div className="bloco-g"><span className="rotulo-b">Área nova</span><EscolherAmbiente valor={ambienteNovo} onEscolher={setAmbienteNovo} /></div>
            <div className="bloco-g"><span className="rotulo-b">O resto do mapa</span><EscolherAmbiente valor={doc.meta.ambiente} onEscolher={(a) => hist.mudar((d) => d && comAmbiente(d, a))} /></div>
            <label className="nota"><input type="checkbox" checked={doc.meta.semChao} onChange={(ev) => hist.mudar((d) => d && comSemChao(d, ev.target.checked))} /> Sem chão: o térreo só onde há piso (o submundo, as ilhas no vazio; a beirada segura o agente)</label>
            <div className="nota">Os números de cada ambientação ficam em src/maps/ambientes.ts.</div>
          </>}
          {(ferramenta === 'paredes' || ferramenta === 'apagar' || ferramenta === 'contagotas') && <div className="nota">{EXTRA[ferramenta]}</div>}
        </div>
        <div className="status-b"><span ref={statusRef} /><span>Botão direito gira · meio move · rodinha aproxima · duplo clique direito ou F centraliza · V troca as paredes · Ctrl+Z desfaz · Ctrl+S salva</span></div>
      </section>

      {(gerenciador || !doc) && (
        <MapManager mapas={mapas} aberto={doc?.meta.id} ocupado={ocupado}
          onAbrir={abrir} onCopiar={copiar} onApagar={apagar} onExportar={exportar} onNovo={novo} onImportar={importar}
          onFechar={doc ? () => setGerenciador(false) : undefined} />
      )}
    </div>
  )
}
