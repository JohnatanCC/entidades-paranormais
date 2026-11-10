// Ver modelos (Modo desenvolvedor): o personagem sozinho na tela, para olhar de perto e decidir o que melhorar.
// Não edita nada: o modelo vem de modelos/agente.bbmodel (salvar no Blockbench atualiza aqui no npm run dev).
// A câmera gira em volta (botão esquerdo gira, direito move, rodinha aproxima); o painel troca a animação, a expressão,
// a pose das mãos, o ângulo da câmera e a luz (estúdio, ou uma lâmpada da mansão no escuro, como no jogo).
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

type Anim = 'parado' | 'andando' | 'correndo' | 'esquiva'
type Camera = 'corpo' | 'rosto' | 'maos' | 'pes' | 'costas'
type Luz = 'estudio' | 'jogo'

const ANIMS: [Anim, string][] = [['parado', 'Parado'], ['andando', 'Andando'], ['correndo', 'Correndo'], ['esquiva', 'Esquiva']]
const EXPS: [Expressao | null, string][] = [[null, 'Automática'], ['neutra', 'Neutra'], ['esforco', 'Esforço'], ['medo', 'Medo'], ['dor', 'Dor'], ['raiva', 'Raiva'], ['surpresa', 'Surpresa']]
const MAOS: [PoseMao | null, string][] = [[null, 'Automática'], ['solta', 'Solta'], ['punho', 'Punho'], ['aberta', 'Aberta'], ['segurar', 'Segurar'], ['apontar', 'Apontar']]
const CAMERAS: [Camera, string][] = [['corpo', 'Corpo'], ['rosto', 'Rosto'], ['maos', 'Mãos'], ['pes', 'Pés'], ['costas', 'Costas']]

interface Escolhas { anim: Anim; exp: Expressao | null; mao: PoseMao | null; camera: Camera; luz: Luz; girar: boolean; grade: boolean }

export function VerModelos({ go }: { go: Go }) {
  const [e, setE] = useState<Escolhas>({ anim: 'parado', exp: null, mao: null, camera: 'corpo', luz: 'estudio', girar: false, grade: true })
  const [info, setInfo] = useState<{ altura: number; blocos: number; juntas: number; desenhos: number } | null>(null)
  const muda = (p: Partial<Escolhas>) => setE((v) => ({ ...v, ...p }))
  const Opcoes = <T,>({ titulo, lista, valor, onEscolher }: { titulo: string; lista: [T, string][]; valor: T; onEscolher: (v: T) => void }) => (
    <section>
      <b>{titulo}</b>
      <div className="opcoes">{lista.map(([v, nome]) => <button key={nome} aria-pressed={valor === v} onClick={() => onEscolher(v)}>{nome}</button>)}</div>
    </section>
  )
  return (
    <div className="vermodelo">
      <header className="topo">
        <span className="titulo">Ver modelos</span>
        <span className="nome">Matheus Moura · modelos/agente.bbmodel</span>
        <span className="espaco" />
        <button className="bt" onClick={() => go('dev')}>Voltar</button>
      </header>
      <div className="vista">
        <Canvas camera={{ position: [1.4, 1.4, 3.6], fov: 35, near: 0.02, far: 100 }}>
          <Cena e={e} onInfo={setInfo} />
        </Canvas>
        <div className="ajuda">Botão esquerdo gira · direito move · rodinha aproxima</div>
      </div>
      <aside className="painel">
        <Opcoes titulo="Animação" lista={ANIMS} valor={e.anim} onEscolher={(anim) => muda({ anim })} />
        <Opcoes titulo="Expressão" lista={EXPS} valor={e.exp} onEscolher={(exp) => muda({ exp })} />
        <Opcoes titulo="Mãos" lista={MAOS} valor={e.mao} onEscolher={(mao) => muda({ mao })} />
        <Opcoes titulo="Câmera" lista={CAMERAS} valor={e.camera} onEscolher={(camera) => muda({ camera })} />
        <Opcoes titulo="Luz" lista={[['estudio', 'Estúdio'], ['jogo', 'Jogo (lâmpada no escuro)']] as [Luz, string][]} valor={e.luz} onEscolher={(luz) => muda({ luz })} />
        <section className="marcas">
          <label><input type="checkbox" checked={e.girar} onChange={(ev) => muda({ girar: ev.target.checked })} /> Girar sozinho</label>
          <label><input type="checkbox" checked={e.grade} onChange={(ev) => muda({ grade: ev.target.checked })} /> Grade do chão (meio metro)</label>
        </section>
        {info && <section className="info">
          <b>O modelo</b>
          <span>Altura: {info.altura.toFixed(2)} m</span>
          <span>{info.blocos} blocos em {info.juntas} juntas</span>
          <span>{info.desenhos} chamadas de desenho</span>
        </section>}
      </aside>
    </div>
  )
}

// o ângulo de cada câmera: para onde olha e de onde (no espaço do mundo, com o agente parado na origem, de frente para +z)
function enquadra(c: Camera, a: Agente): { alvo: THREE.Vector3; de: THREE.Vector3 } {
  const p = new THREE.Vector3()
  a.root.updateMatrixWorld(true)
  if (c === 'rosto') { a.head.getWorldPosition(p).add(new THREE.Vector3(0, 0.12, 0.1)); return { alvo: p.clone(), de: p.clone().add(new THREE.Vector3(0.15, 0.03, 0.75)) } }
  if (c === 'maos') { a.arms[1].hd.getWorldPosition(p).add(new THREE.Vector3(0, -0.06, 0)); return { alvo: p.clone(), de: p.clone().add(new THREE.Vector3(0.55, 0.08, 0.5)) } }
  if (c === 'pes') return { alvo: new THREE.Vector3(0, 0.15, 0.1), de: new THREE.Vector3(0.9, 0.5, 1.4) }
  if (c === 'costas') return { alvo: new THREE.Vector3(0, 1.15, 0), de: new THREE.Vector3(-0.9, 1.5, -2.7) }
  return { alvo: new THREE.Vector3(0, 0.95, 0), de: new THREE.Vector3(1.4, 1.4, 3.6) }
}

function Cena({ e, onInfo }: { e: Escolhas; onInfo: (i: { altura: number; blocos: number; juntas: number; desenhos: number }) => void }) {
  // montarAgente na lista: salvar o .bbmodel recarrega o módulo e o modelo é montado de novo
  const a = useMemo(() => montarAgente(), [montarAgente])
  const { camera, controls } = useThree() as unknown as { camera: THREE.PerspectiveCamera; controls: { target: THREE.Vector3; update: () => void } | null }
  const t = useRef({ esq: 0, voo: null as null | { de0: THREE.Vector3; alvo0: THREE.Vector3; de1: THREE.Vector3; alvo1: THREE.Vector3; k: number } })

  // as contas do modelo, na pose parada
  useEffect(() => {
    let blocos = 0, juntas = 0, desenhos = 0
    a.root.traverse((o) => { if ((o as THREE.Mesh).isMesh) desenhos++; else if (o.type === 'Group') juntas++; else if (o.type === 'Object3D') blocos++ })
    a.root.updateMatrixWorld(true)
    const b = new THREE.Box3().setFromObject(a.root)
    onInfo({ altura: b.max.y - Math.max(0, b.min.y), blocos, juntas, desenhos })
  }, [a, onInfo])

  // trocar de câmera: um voo curto até o enquadramento novo
  useEffect(() => {
    if (!controls) return
    const { alvo, de } = enquadra(e.camera, a)
    t.current.voo = { de0: camera.position.clone(), alvo0: controls.target.clone(), de1: de, alvo1: alvo, k: 0 }
  }, [e.camera, controls, a, camera])

  useFrame((_, dtBruto) => {
    const dt = Math.min(dtBruto, 0.05), s = t.current
    // a animação no lugar (o agente não sai da origem)
    let esquiva = -1
    if (e.anim === 'esquiva') { s.esq = (s.esq + dt) % 1.4; esquiva = s.esq < 0.5 ? s.esq / 0.5 : -1 }
    const velocidade = e.anim === 'andando' ? AGENTE.andar : e.anim === 'correndo' ? AGENTE.correr : 0
    animarAgente(a, { velocidade, corrida: e.anim === 'correndo' ? 1 : 0, esquiva, expressao: e.exp ?? undefined, mao: e.mao ?? undefined }, dt)
    if (e.girar) a.root.rotation.y += dt * 0.5
    // o voo da câmera
    if (s.voo && controls) {
      s.voo.k = Math.min(1, s.voo.k + dt / 0.45)
      const k = s.voo.k * s.voo.k * (3 - 2 * s.voo.k)
      camera.position.lerpVectors(s.voo.de0, s.voo.de1, k); controls.target.lerpVectors(s.voo.alvo0, s.voo.alvo1, k); controls.update()
      if (s.voo.k >= 1) s.voo = null
    }
  })

  return (
    <>
      <color attach="background" args={[e.luz === 'jogo' ? '#07080a' : '#26252a']} />
      {e.luz === 'estudio' ? <>
        <hemisphereLight args={['#ffffff', '#4a4640', 1.3]} />
        <directionalLight position={[2, 3, 2.5]} intensity={1.6} />
        <directionalLight position={[-2.5, 2, -2]} intensity={0.6} color="#bcd0ff" />
      </> : <>
        {/* como no Testar: quase escuro, e uma lâmpada de teto acesa por perto */}
        <hemisphereLight args={['#c9c0ff', '#1a1612', 0.55]} />
        <directionalLight position={[-6, 10, 4]} intensity={0.35} color="#9fb8e8" />
        <pointLight position={[1.2, 3.1, 1.2]} color="#e0a050" intensity={6} distance={7} decay={1.6} />
      </>}
      <primitive object={a.root} />
      {e.grade && <Grid args={[8, 8]} cellSize={0.5} cellThickness={0.6} cellColor="#6a5a40" sectionSize={1} sectionThickness={1.2} sectionColor="#c89b4a" fadeDistance={14} infiniteGrid />}
      <OrbitControls makeDefault target={[0, 0.95, 0]} minDistance={0.25} maxDistance={9} />
    </>
  )
}
