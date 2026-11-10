// Ver modelos (Modo desenvolvedor): um modelo sozinho na tela, para olhar de perto e decidir o que melhorar.
// Não edita nada: o Matheus vem de modelos/agente.bbmodel e os objetos de modelos/objetos/<tipo>.bbmodel (salvar no
// Blockbench atualiza aqui no npm run dev). A câmera gira em volta (botão esquerdo gira, direito move, rodinha aproxima).
// Para o Matheus o painel troca a animação, a expressão, a pose das mãos e o ângulo; para todos, a luz (estúdio, ou uma
// lâmpada da mansão no escuro, como no jogo).
import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Grid, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import type { Go } from '../App'
import { animarAgente } from '../game/player/animacao'
import type { PoseMao } from '../game/player/maos'
import { montarAgente, type Agente } from '../game/player/modelo'
import { AGENTE } from '../game/player/numeros'
import type { Expressao } from '../game/player/rosto'
import { GRUPOS, OBJETOS } from '../maps/objetos'
import { caminhoObjeto, objeto3d } from '../render/objetos3d'

type Anim = 'parado' | 'andando' | 'correndo' | 'esquiva'
type Camera = 'corpo' | 'rosto' | 'maos' | 'pes' | 'costas'
type Luz = 'estudio' | 'jogo'

const AGENTE_ID = 'agente'
const ANIMS: [Anim, string][] = [['parado', 'Parado'], ['andando', 'Andando'], ['correndo', 'Correndo'], ['esquiva', 'Esquiva']]
const EXPS: [Expressao | null, string][] = [[null, 'Automática'], ['neutra', 'Neutra'], ['esforco', 'Esforço'], ['medo', 'Medo'], ['dor', 'Dor'], ['raiva', 'Raiva'], ['surpresa', 'Surpresa']]
const MAOS: [PoseMao | null, string][] = [[null, 'Automática'], ['solta', 'Solta'], ['punho', 'Punho'], ['aberta', 'Aberta'], ['segurar', 'Segurar'], ['apontar', 'Apontar']]
const CAMERAS: [Camera, string][] = [['corpo', 'Corpo'], ['rosto', 'Rosto'], ['maos', 'Mãos'], ['pes', 'Pés'], ['costas', 'Costas']]
const LUZES: [Luz, string][] = [['estudio', 'Estúdio'], ['jogo', 'Jogo (lâmpada no escuro)']]

interface Escolhas { qual: string; anim: Anim; exp: Expressao | null; mao: PoseMao | null; camera: Camera; luz: Luz; girar: boolean; grade: boolean }
interface Info { linhas: string[] }

function Opcoes<T>({ titulo, lista, valor, onEscolher }: { titulo: string; lista: [T, string][]; valor: T; onEscolher: (v: T) => void }) {
  return (
    <section>
      <b>{titulo}</b>
      <div className="opcoes">{lista.map(([v, nome]) => <button key={nome} aria-pressed={valor === v} onClick={() => onEscolher(v)}>{nome}</button>)}</div>
    </section>
  )
}

export function VerModelos({ go }: { go: Go }) {
  const [e, setE] = useState<Escolhas>({ qual: AGENTE_ID, anim: 'parado', exp: null, mao: null, camera: 'corpo', luz: 'estudio', girar: false, grade: true })
  const [info, setInfo] = useState<Info | null>(null)
  const muda = (p: Partial<Escolhas>) => setE((v) => ({ ...v, ...p }))
  const agente = e.qual === AGENTE_ID
  return (
    <div className="vermodelo">
      <header className="topo">
        <span className="titulo">Ver modelos</span>
        <span className="nome">{agente ? 'Matheus Moura · modelos/agente.bbmodel' : `${OBJETOS[e.qual]?.nome} · modelos/${caminhoObjeto(e.qual)}.bbmodel`}</span>
        <span className="espaco" />
        <button className="bt" onClick={() => go('dev')}>Voltar</button>
      </header>
      <div className="vista">
        <Canvas camera={{ position: [1.4, 1.4, 3.6], fov: 35, near: 0.02, far: 100 }}>
          <Luzes luz={e.luz} />
          {agente ? <CenaAgente e={e} onInfo={setInfo} /> : <CenaObjeto key={e.qual} tipo={e.qual} girar={e.girar} onInfo={setInfo} />}
          {e.grade && <Grid args={[8, 8]} cellSize={0.5} cellThickness={0.6} cellColor="#6a5a40" sectionSize={1} sectionThickness={1.2} sectionColor="#c89b4a" fadeDistance={14} infiniteGrid />}
          <OrbitControls makeDefault target={[0, 0.95, 0]} minDistance={0.2} maxDistance={9} />
        </Canvas>
        <div className="ajuda">Botão esquerdo gira · direito move · rodinha aproxima</div>
      </div>
      <aside className="painel">
        <section>
          <b>Modelo</b>
          <select className="escolha" value={e.qual} onChange={(ev) => muda({ qual: ev.target.value })}>
            <option value={AGENTE_ID}>Matheus Moura (o agente)</option>
            {GRUPOS.map(([g, nome]) => (
              <optgroup key={g} label={`Objetos · ${nome}`}>
                {Object.entries(OBJETOS).filter(([, o]) => o.grupo === g).map(([k, o]) => <option key={k} value={k}>{o.nome}</option>)}
              </optgroup>
            ))}
          </select>
        </section>
        {agente && <>
          <Opcoes titulo="Animação" lista={ANIMS} valor={e.anim} onEscolher={(anim) => muda({ anim })} />
          <Opcoes titulo="Expressão" lista={EXPS} valor={e.exp} onEscolher={(exp) => muda({ exp })} />
          <Opcoes titulo="Mãos" lista={MAOS} valor={e.mao} onEscolher={(mao) => muda({ mao })} />
          <Opcoes titulo="Câmera" lista={CAMERAS} valor={e.camera} onEscolher={(camera) => muda({ camera })} />
        </>}
        <Opcoes titulo="Luz" lista={LUZES} valor={e.luz} onEscolher={(luz) => muda({ luz })} />
        <section className="marcas">
          <label><input type="checkbox" checked={e.girar} onChange={(ev) => muda({ girar: ev.target.checked })} /> Girar sozinho</label>
          <label><input type="checkbox" checked={e.grade} onChange={(ev) => muda({ grade: ev.target.checked })} /> Grade do chão (meio metro)</label>
        </section>
        {info && <section className="info"><b>O modelo</b>{info.linhas.map((l) => <span key={l}>{l}</span>)}</section>}
      </aside>
    </div>
  )
}

function Luzes({ luz }: { luz: Luz }) {
  return <>
    <color attach="background" args={[luz === 'jogo' ? '#07080a' : '#26252a']} />
    {luz === 'estudio' ? <>
      <hemisphereLight args={['#ffffff', '#4a4640', 1.3]} />
      <directionalLight position={[2, 3, 2.5]} intensity={1.6} />
      <directionalLight position={[-2.5, 2, -2]} intensity={0.6} color="#bcd0ff" />
    </> : <>
      {/* como no Testar: quase escuro, e uma lâmpada de teto acesa por perto */}
      <hemisphereLight args={['#c9c0ff', '#1a1612', 0.55]} />
      <directionalLight position={[-6, 10, 4]} intensity={0.35} color="#9fb8e8" />
      <pointLight position={[1.2, 3.1, 1.2]} color="#e0a050" intensity={6} distance={7} decay={1.6} />
    </>}
  </>
}

/** O voo curto da câmera até um enquadramento (alvo e de onde olha). */
function useVoo() {
  const { camera, controls } = useThree() as unknown as { camera: THREE.PerspectiveCamera; controls: { target: THREE.Vector3; update: () => void } | null }
  const voo = useRef<null | { de0: THREE.Vector3; alvo0: THREE.Vector3; de1: THREE.Vector3; alvo1: THREE.Vector3; k: number }>(null)
  useFrame((_, dt) => {
    const v = voo.current
    if (!v || !controls) return
    v.k = Math.min(1, v.k + Math.min(dt, 0.05) / 0.45)
    const k = v.k * v.k * (3 - 2 * v.k)
    camera.position.lerpVectors(v.de0, v.de1, k); controls.target.lerpVectors(v.alvo0, v.alvo1, k); controls.update()
    if (v.k >= 1) voo.current = null
  })
  return { pronto: !!controls, voar: (alvo: THREE.Vector3, de: THREE.Vector3) => { if (controls) voo.current = { de0: camera.position.clone(), alvo0: controls.target.clone(), de1: de, alvo1: alvo, k: 0 } } }
}

/** As contas de um modelo: as malhas (chamadas de desenho), os blocos (os marcadores) e as juntas. */
function contas(o: THREE.Object3D) {
  let blocos = 0, juntas = 0, desenhos = 0
  o.traverse((x) => { if ((x as THREE.Mesh).isMesh) desenhos++; else if (x.type === 'Group') juntas++; else if (x.type === 'Object3D') blocos++ })
  return { blocos, juntas, desenhos }
}

// o ângulo de cada câmera do agente: para onde olha e de onde (o agente parado na origem, de frente para +z)
function enquadra(c: Camera, a: Agente): { alvo: THREE.Vector3; de: THREE.Vector3 } {
  const p = new THREE.Vector3()
  a.root.updateMatrixWorld(true)
  if (c === 'rosto') { a.head.getWorldPosition(p).add(new THREE.Vector3(0, 0.12, 0.1)); return { alvo: p.clone(), de: p.clone().add(new THREE.Vector3(0.15, 0.03, 0.75)) } }
  if (c === 'maos') { a.arms[1].hd.getWorldPosition(p).add(new THREE.Vector3(0, -0.06, 0)); return { alvo: p.clone(), de: p.clone().add(new THREE.Vector3(0.55, 0.08, 0.5)) } }
  if (c === 'pes') return { alvo: new THREE.Vector3(0, 0.15, 0.1), de: new THREE.Vector3(0.9, 0.5, 1.4) }
  if (c === 'costas') return { alvo: new THREE.Vector3(0, 1.15, 0), de: new THREE.Vector3(-0.9, 1.5, -2.7) }
  return { alvo: new THREE.Vector3(0, 0.95, 0), de: new THREE.Vector3(1.4, 1.4, 3.6) }
}

function CenaAgente({ e, onInfo }: { e: Escolhas; onInfo: (i: Info) => void }) {
  // montarAgente na lista: salvar o .bbmodel recarrega o módulo e o modelo é montado de novo
  const a = useMemo(() => montarAgente(), [montarAgente])
  const { pronto, voar } = useVoo()
  const esq = useRef(0)

  useEffect(() => {
    const c = contas(a.root)
    a.root.updateMatrixWorld(true)
    const b = new THREE.Box3().setFromObject(a.root)
    onInfo({ linhas: [`Altura: ${(b.max.y - Math.max(0, b.min.y)).toFixed(2)} m`, `${c.blocos} blocos em ${c.juntas} juntas`, `${c.desenhos} chamadas de desenho`] })
  }, [a, onInfo])
  useEffect(() => { if (pronto) { const { alvo, de } = enquadra(e.camera, a); voar(alvo, de) } }, [e.camera, a, pronto])

  useFrame((_, dtBruto) => {
    const dt = Math.min(dtBruto, 0.05)
    // a animação no lugar (o agente não sai da origem)
    let esquiva = -1
    if (e.anim === 'esquiva') { esq.current = (esq.current + dt) % 1.4; esquiva = esq.current < 0.5 ? esq.current / 0.5 : -1 }
    const velocidade = e.anim === 'andando' ? AGENTE.andar : e.anim === 'correndo' ? AGENTE.correr : 0
    animarAgente(a, { velocidade, corrida: e.anim === 'correndo' ? 1 : 0, esquiva, expressao: e.exp ?? undefined, mao: e.mao ?? undefined }, dt)
    if (e.girar) a.root.rotation.y += dt * 0.5
  })
  return <primitive object={a.root} />
}

function CenaObjeto({ tipo, girar, onInfo }: { tipo: string; girar: boolean; onInfo: (i: Info) => void }) {
  const obj = useMemo(() => objeto3d(tipo), [tipo, objeto3d])
  const { pronto, voar } = useVoo()
  useEffect(() => {
    const c = contas(obj), b = new THREE.Box3().setFromObject(obj), t = b.getSize(new THREE.Vector3())
    onInfo({ linhas: [`Tamanho: ${t.x.toFixed(2)} × ${t.y.toFixed(2)} × ${t.z.toFixed(2)} m`, `${c.blocos} blocos`, `${c.desenhos} chamada${c.desenhos > 1 ? 's' : ''} de desenho`] })
  }, [obj, onInfo])
  // enquadra o objeto inteiro, de frente-cima-lado
  useEffect(() => {
    if (!pronto) return
    const b = new THREE.Box3().setFromObject(obj), alvo = b.getCenter(new THREE.Vector3()), r = Math.max(0.25, b.getSize(new THREE.Vector3()).length() / 2)
    voar(alvo, alvo.clone().addScaledVector(new THREE.Vector3(0.7, 0.55, 1).normalize(), r / Math.sin((17.5 * Math.PI) / 180) * 1.1))
  }, [obj, pronto])
  useFrame((_, dt) => { if (girar) obj.rotation.y += Math.min(dt, 0.05) * 0.5 })
  return <primitive object={obj} />
}
