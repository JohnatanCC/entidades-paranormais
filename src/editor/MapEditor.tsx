// O criador de mapas — etapa 1 (a base): abrir um mapa da pasta maps/, ver os blocos em 3D com a grade,
// escolher o andar, criar um mapa novo e salvar. As ferramentas (paredes, piso, portas...) entram nas próximas etapas
// (veja docs/criador-de-mapas.md).
import { Suspense, useEffect, useMemo, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { Grid, OrbitControls } from '@react-three/drei'
import type { Go } from '../App'
import { getMap, listMaps, loadChunk } from '../maps/loader'
import { canSave, saveMap } from '../maps/save'
import { CHUNK, LEVEL_H, type Chunk, type MapMeta } from '../maps/types'
import { MapView } from './MapView'
import { RetroRenderer } from '../render/RetroRenderer'

const FERRAMENTAS = ['Paredes', 'Piso e teto', 'Portas e janelas', 'Escadas', 'Objetos', 'Luzes', 'Detalhes', 'Scripts']

export function MapEditor({ go }: { go: Go }) {
  const mapas = listMaps()
  const [meta, setMeta] = useState<MapMeta | undefined>(() => mapas[0])
  const [chunks, setChunks] = useState<Chunk[]>([])
  const [andar, setAndar] = useState(0)
  const [filtro, setFiltro] = useState(false)
  const [aviso, setAviso] = useState('')

  // carrega todos os blocos do mapa aberto (no editor; o jogo carrega só os de perto do jogador)
  useEffect(() => {
    if (!meta) { setChunks([]); return }
    let vivo = true
    Promise.all(meta.chunks.map((k) => loadChunk(meta.id, k))).then((cs) => { if (vivo) setChunks(cs.filter((c): c is Chunk => !!c)) })
    return () => { vivo = false }
  }, [meta])

  const centro = useMemo<[number, number, number]>(() => meta ? [meta.spawn.pos[0], andar * LEVEL_H, meta.spawn.pos[2]] : [0, 0, 0], [meta, andar])

  function novo() {
    const nome = prompt('Nome do mapa novo:')?.trim()
    if (!nome) return
    const id = nome.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 64)
    if (!id || getMap(id)) { setAviso(id ? `Já existe um mapa "${id}".` : 'Nome inválido.'); return }
    setMeta({ formato: 1, id, nome, levels: 1, levelH: LEVEL_H, chunkSize: CHUNK, spawn: { pos: [2, 0, 2], yaw: 0, level: 0 }, chunks: [] })
    setChunks([]); setAndar(0); setAviso(`Mapa novo "${nome}": ainda não está salvo.`)
  }

  async function salvar() {
    if (!meta) return
    try { await saveMap(meta, chunks); setAviso(`Salvo em maps/${meta.id}/`) } catch (e) { setAviso(String((e as Error).message)) }
  }

  return (
    <div className="editor">
      <div className="barra">
        <span className="titulo">Criador de mapas{meta ? ` — ${meta.nome}` : ''}</span>
        <button onClick={novo}>Novo</button>
        <button onClick={salvar} disabled={!meta || !canSave} title={canSave ? '' : 'só com npm run dev'}>Salvar</button>
        <button onClick={() => setFiltro((v) => !v)} aria-pressed={filtro}>{filtro ? 'Filtro: ligado' : 'Filtro: desligado'}</button>
        <button onClick={() => go('dev')}>Sair</button>
      </div>
      <aside className="painel">
        <h3>Mapas na pasta</h3>
        {mapas.length === 0 && <div className="nota">Nenhum mapa em maps/.</div>}
        {mapas.map((m) => <button key={m.id} className="item" aria-pressed={meta?.id === m.id} onClick={() => { setMeta(m); setAndar(0); setAviso('') }}>{m.nome}</button>)}
        {meta && <>
          <h3>Andar</h3>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {Array.from({ length: meta.levels }, (_, i) => <button key={i} className="item" aria-pressed={andar === i} onClick={() => setAndar(i)}>{i === 0 ? 'Térreo' : `${i}º`}</button>)}
          </div>
          <div className="nota">Os andares acima do escolhido ficam escondidos.</div>
        </>}
        <h3>Ferramentas</h3>
        {FERRAMENTAS.map((f) => <button key={f} className="item" disabled>{f}</button>)}
        <div className="nota">As ferramentas entram nas próximas etapas.</div>
        {aviso && <div className="nota" style={{ color: 'var(--amber)' }}>{aviso}</div>}
      </aside>
      <div className="vista">
        <Canvas shadows camera={{ position: [centro[0] + 9, centro[1] + 11, centro[2] + 12], fov: 50 }} gl={{ antialias: !filtro }}>
          <color attach="background" args={['#0b0c0f']} />
          <ambientLight intensity={0.35} />
          <directionalLight position={[8, 16, 6]} intensity={0.9} castShadow />
          <Suspense fallback={null}><MapView chunks={chunks} maxLevel={andar} /></Suspense>
          <Grid position={[0, andar * LEVEL_H + 0.005, 0]} args={[64, 64]} cellSize={1} cellThickness={0.6} cellColor="#3a342c" sectionSize={CHUNK} sectionThickness={1.2} sectionColor="#8b6a3a" fadeDistance={60} infiniteGrid />
          <OrbitControls target={centro} makeDefault maxPolarAngle={Math.PI / 2 - 0.05} />
          {filtro && <RetroRenderer />}
        </Canvas>
        <div className="status">grade 1 m · bloco {CHUNK} m · andar {LEVEL_H} m · botão esquerdo gira · direito arrasta · rodinha aproxima</div>
      </div>
    </div>
  )
}
