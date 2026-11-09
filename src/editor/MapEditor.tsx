// O criador de mapas — etapas 2 e 3: a câmera do editor, os andares, as paredes automáticas (reta e sala), apagar,
// desfazer e refazer, o gerenciador de mapas (novo, abrir, salvar, copiar, apagar, exportar e importar),
// o piso (chão e o teto de baixo) e o pincel de parede (textura e barra de baixo), com o catálogo de texturas.
// O mapa aberto é um documento (doc.ts): as ferramentas geram um documento novo e a vista desenha a partir dele.
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { Grid } from '@react-three/drei'
import type { Go } from '../App'
import * as disco from '../maps/storage'
import { CHUNK, LEVEL_H } from '../maps/types'
import { RetroRenderer } from '../render/RetroRenderer'
import { aberturas, andarTemCoisa, comAbertura, comAndares, comEscada, comParedes, comPiso, docDe, escadaCabe, escadas, sentidoNovo, mudarAbertura, mudarEscada, pacoteDe, pintarLados, semAbertura, semEscada, semParedes, semPiso, type LadoDe, type MapDoc, type Seg } from './doc'
import type { Stair } from '../maps/types'
import { FerramentaEscadas } from './FerramentaEscadas'
import { PainelEscada } from './PainelEscada'
import type { Opening } from '../maps/types'
import { FerramentaAberturas, TIPOS, type TipoAbertura } from './FerramentaAberturas'
import { PainelAbertura } from './PainelAbertura'
import { useHistorico } from './historico'
import { EditorCamera } from './EditorCamera'
import { FerramentaParedes } from './FerramentaParedes'
import { FerramentaPincel } from './FerramentaPincel'
import { FerramentaPiso } from './FerramentaPiso'
import { Paleta } from './Paleta'
import { MapManager } from './MapManager'
import { MapView } from './MapView'

type Ferramenta = 'paredes' | 'apagar' | 'piso' | 'pincel' | 'aberturas' | 'escadas'
const FUTURAS = ['Objetos', 'Luzes', 'Detalhes', 'Scripts']
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
  escadas: 'Arraste a área da escada do pé até o topo: ela sobe no sentido do arraste (o lado mais comprido). Os degraus se montam pela altura do andar e o piso de cima ganha o buraco. Clique numa escada para escolher; Ctrl + clique (ou Del) apaga.',
}
const ALTURAS = [0.8, 1, 1.2, 1.5] // alturas comuns da barra de baixo (m)


export function MapEditor({ go }: { go: Go }) {
  const hist = useHistorico<MapDoc | null>(null)
  const doc = hist.atual
  const [salvo, setSalvo] = useState<MapDoc | null>(null) // o documento igual ao que está no disco
  const [mapas, setMapas] = useState<disco.MapInfo[]>([])
  const [gerenciador, setGerenciador] = useState(false)
  const [ocupado, setOcupado] = useState(false)
  const [ferramenta, setFerramenta] = useState<Ferramenta>('paredes')
  const [andarEscolhido, setAndar] = useState(0)
  const [filtro, setFiltro] = useState(false)
  const [aviso, setAviso] = useState('')
  const [pincel, setPincel] = useState({ parede: 'reboco-creme', barra: 'lambri-madeira', h: 1, comBarra: true })
  const [piso, setPiso] = useState({ chao: 'taco-madeira', teto: 'gesso' })
  const [tipoAbertura, setTipoAbertura] = useState<TipoAbertura>('comum')
  const [larguraVao, setLarguraVao] = useState(1)
  const [selecionada, setSelecionada] = useState<string | null>(null) // a porta, janela ou escada escolhida
  const [texEscada, setTexEscada] = useState('tabua-corrida')
  const statusRef = useRef<HTMLSpanElement>(null)
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
  const onMudarEscada = (patch: Partial<Stair>) => {
    if (!escadaEscolhida || !doc) return
    const p = patch.dir ? { ...patch, ...sentidoNovo(escadaEscolhida, patch.dir) } : patch
    const erro = escadaCabe(doc, { ...escadaEscolhida, ...p }, escadaEscolhida.id)
    if (erro) { setAviso('Girando assim ela bate em outra escada.'); return }
    hist.mudar((d) => d && mudarEscada(d, escadaEscolhida.id, p))
  }
  const onInfo = useCallback((t: string) => { if (statusRef.current) statusRef.current.textContent = t }, [])

  function sair() { if (podePerder()) go('dev') }

  // os atalhos leem sempre as funções da última renderização
  const atalhos = useRef<(e: KeyboardEvent) => void>(() => {})
  atalhos.current = (e) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
    const ctrl = e.ctrlKey || e.metaKey, k = e.key.toLowerCase()
    if (ctrl && k === 'z' && !e.shiftKey) { e.preventDefault(); hist.desfazer() }
    else if (ctrl && (k === 'y' || (k === 'z' && e.shiftKey))) { e.preventDefault(); hist.refazer() }
    else if (ctrl && k === 's') { e.preventDefault(); salvar() }
    else if (ctrl) return
    else if (e.key === 'PageUp') { e.preventDefault(); setAndar(Math.min(nAndares - 1, andar + 1)) }
    else if (e.key === 'PageDown') { e.preventDefault(); setAndar(Math.max(0, andar - 1)) }
    else if (e.key === '1') setFerramenta('paredes')
    else if (e.key === '2') setFerramenta('apagar')
    else if (e.key === '3') setFerramenta('piso')
    else if (e.key === '4') setFerramenta('pincel')
    else if (e.key === '5') setFerramenta('aberturas')
    else if (e.key === '6') setFerramenta('escadas')
    else if ((e.key === 'Delete' || e.key === 'Backspace') && escolhida) onApagarAbertura(escolhida.id)
    else if ((e.key === 'Delete' || e.key === 'Backspace') && escadaEscolhida) onApagarEscada(escadaEscolhida.id)
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

  return (
    <div className="editor">
      <div className="barra">
        <span className="titulo">Criador de mapas{doc ? ` — ${doc.meta.nome}` : ''}{sujo && <span className="sujo" title="mudanças não salvas"> •</span>}</span>
        <button onClick={() => setGerenciador(true)}>Mapas…</button>
        <button onClick={salvar} disabled={!doc || !disco.podeGravar || ocupado} title={disco.podeGravar ? 'Ctrl+S' : 'só com npm run dev'}>Salvar</button>
        <button onClick={hist.desfazer} disabled={!hist.podeDesfazer} title="Ctrl+Z">Desfazer</button>
        <button onClick={hist.refazer} disabled={!hist.podeRefazer} title="Ctrl+Y">Refazer</button>
        <button onClick={() => setFiltro((v) => !v)} aria-pressed={filtro}>{filtro ? 'Filtro: ligado' : 'Filtro: desligado'}</button>
        <button onClick={sair}>Sair</button>
      </div>
      <aside className="painel">
        {doc ? <>
          <h3>Mapa</h3>
          <div className="nota"><b style={{ color: 'var(--cream)' }}>{doc.meta.nome}</b><br />maps/{doc.meta.id}/ · {sujo ? <span style={{ color: 'var(--amber)' }}>não salvo</span> : 'salvo'}</div>
          <h3>Andar</h3>
          <div className="andares">
            {Array.from({ length: nAndares }, (_, i) => nAndares - 1 - i).map((i) => (
              <button key={i} className="item" aria-pressed={andar === i} onClick={() => setAndar(i)}>{nomeAndar(i)}</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={maisAndar}>+ andar</button>
            <button onClick={menosAndar} disabled={nAndares <= 1}>− andar</button>
          </div>
          <div className="nota">Os andares acima do escolhido ficam escondidos. PageUp / PageDown trocam.</div>
          <h3>Ferramentas</h3>
          <button className="item" aria-pressed={ferramenta === 'paredes'} onClick={() => setFerramenta('paredes')}>Paredes <kbd>1</kbd></button>
          <button className="item" aria-pressed={ferramenta === 'apagar'} onClick={() => setFerramenta('apagar')}>Apagar paredes <kbd>2</kbd></button>
          <button className="item" aria-pressed={ferramenta === 'piso'} onClick={() => setFerramenta('piso')}>Piso e teto <kbd>3</kbd></button>
          <button className="item" aria-pressed={ferramenta === 'pincel'} onClick={() => setFerramenta('pincel')}>Pintar parede <kbd>4</kbd></button>
          <button className="item" aria-pressed={ferramenta === 'aberturas'} onClick={() => setFerramenta('aberturas')}>Portas e janelas <kbd>5</kbd></button>
          <button className="item" aria-pressed={ferramenta === 'escadas'} onClick={() => setFerramenta('escadas')}>Escadas <kbd>6</kbd></button>
          <div className="nota">{AJUDA[ferramenta]}</div>
          {ferramenta === 'piso' && <>
            <Paleta titulo="Chão" uso="piso" valor={piso.chao} onEscolher={(chao) => setPiso({ ...piso, chao })} />
            <Paleta titulo="Teto do andar de baixo" uso="teto" valor={piso.teto} onEscolher={(teto) => setPiso({ ...piso, teto })} />
            {andar === 0 && <div className="nota">No térreo o teto de baixo não aparece (não há andar embaixo).</div>}
          </>}
          {ferramenta === 'escadas' && (escadaEscolhida
            ? <PainelEscada s={escadaEscolhida} onMudar={onMudarEscada} onApagar={() => onApagarEscada(escadaEscolhida.id)} />
            : <Paleta titulo="Degraus" uso="piso" valor={texEscada} onEscolher={setTexEscada} />)}
          {ferramenta === 'aberturas' && <>
            <div className="tipos">
              {(Object.keys(TIPOS) as TipoAbertura[]).map((t) => <button key={t} className="item" aria-pressed={tipoAbertura === t} onClick={() => setTipoAbertura(t)}>{TIPOS[t].nome}</button>)}
            </div>
            {tipoAbertura === 'vao' && <div className="altura"><span>Largura do vão</span><div className="opcoes">{[1, 2, 3].map((w) => <button key={w} aria-pressed={larguraVao === w} onClick={() => setLarguraVao(w)}>{w} m</button>)}</div></div>}
            {escolhida && <PainelAbertura o={escolhida} onMudar={onMudarAbertura} onApagar={() => onApagarAbertura(escolhida.id)} />}
          </>}
          {ferramenta === 'pincel' && <>
            <Paleta titulo="Parede" uso="parede" valor={pincel.parede} onEscolher={(parede) => setPincel({ ...pincel, parede })} />
            <label className="marcar"><input type="checkbox" checked={pincel.comBarra} onChange={(e) => setPincel({ ...pincel, comBarra: e.target.checked })} /> Barra embaixo (lambri)</label>
            {pincel.comBarra && <>
              <Paleta titulo="Barra" uso="lambri" valor={pincel.barra} onEscolher={(barra) => setPincel({ ...pincel, barra })} />
              <div className="altura">
                <span>Altura da barra</span>
                <div className="opcoes">{ALTURAS.map((h) => <button key={h} aria-pressed={pincel.h === h} onClick={() => setPincel({ ...pincel, h })}>{h.toFixed(1).replace('.', ',')} m</button>)}</div>
                <input type="range" min={0.2} max={3} step={0.1} value={pincel.h} onChange={(e) => setPincel({ ...pincel, h: Number(e.target.value) })} aria-label="Altura da barra" />
                <b>{pincel.h.toFixed(1).replace('.', ',')} m</b>
              </div>
            </>}
          </>}
          {FUTURAS.map((f) => <button key={f} className="item" disabled>{f}</button>)}
          <div className="nota">As outras ferramentas entram nas próximas etapas.</div>
          <h3>Câmera</h3>
          <div className="nota">Botão direito: gira · botão do meio ou Shift + direito: move · rodinha: aproxima · WASD / setas: move · Q / E: gira</div>
        </> : <div className="nota">Nenhum mapa aberto. Abra ou crie um em <b>Mapas…</b></div>}
        {aviso && <div className="nota aviso">{aviso}</div>}
      </aside>
      <div className="vista">
        <Canvas camera={{ position: [10, 12, 10], fov: 50 }} gl={{ antialias: !filtro }}>
          <color attach="background" args={['#0b0c0f']} />
          {/* luz de trabalho: clara e sem sombra, para ver as texturas; cada lado da parede pega um tom diferente */}
          <hemisphereLight args={['#fff4e0', '#3a3530', 1.6]} />
          <directionalLight position={[8, 16, 6]} intensity={1.4} />
          <directionalLight position={[-10, 8, -4]} intensity={0.5} />
          {doc && <Suspense fallback={null}><MapView chunks={doc.chunks} maxLevel={andar} /></Suspense>}
          {doc && (ferramenta === 'paredes' || ferramenta === 'apagar') && <FerramentaParedes doc={doc} andar={andar} apagar={ferramenta === 'apagar'} onFeito={onFeito} onInfo={onInfo} />}
          {doc && ferramenta === 'piso' && <FerramentaPiso doc={doc} andar={andar} onFeito={onPiso} onInfo={onInfo} />}
          {doc && ferramenta === 'pincel' && <FerramentaPincel doc={doc} andar={andar} onFeito={onPintar} onInfo={onInfo} />}
          {doc && ferramenta === 'escadas' && <FerramentaEscadas doc={doc} andar={andar} tex={texEscada} selecionada={escadaEscolhida?.id ?? null}
            onPor={onPorEscada} onSelecionar={setSelecionada} onApagar={onApagarEscada} onInfo={onInfo} />}
          {doc && ferramenta === 'aberturas' && <FerramentaAberturas doc={doc} andar={andar} tipo={tipoAbertura} larguraVao={larguraVao} selecionada={escolhida?.id ?? null}
            onPor={onPorAbertura} onSelecionar={setSelecionada} onApagar={onApagarAbertura} onInfo={onInfo} />}
          <Grid position={[0, andar * LEVEL_H + 0.005, 0]} args={[64, 64]} cellSize={1} cellThickness={0.6} cellColor="#4a4238" sectionSize={CHUNK} sectionThickness={1.2} sectionColor="#8b6a3a" fadeDistance={140} infiniteGrid />
          <EditorCamera y={andar * LEVEL_H} inicio={inicio} />
          {filtro && <RetroRenderer />}
        </Canvas>
        <div className="status"><span ref={statusRef} /><span className="atalhos">Ctrl+Z desfaz · Ctrl+Y refaz · Ctrl+S salva</span></div>
      </div>
      {(gerenciador || !doc) && (
        <MapManager mapas={mapas} aberto={doc?.meta.id} ocupado={ocupado}
          onAbrir={abrir} onCopiar={copiar} onApagar={apagar} onExportar={exportar} onNovo={novo} onImportar={importar}
          onFechar={doc ? () => setGerenciador(false) : undefined} />
      )}
    </div>
  )
}
