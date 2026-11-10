// Ver modelos (Modo desenvolvedor): um modelo sozinho na tela, para olhar de perto e decidir o que melhorar.
// Não edita nada: o Matheus vem de modelos/agente.bbmodel, os fantasmas de modelos/fantasmas/<nome>.bbmodel (a Mãe), as armas de modelos/armas/<nome>.bbmodel e os objetos de
// modelos/objetos/<tipo>.bbmodel (salvar no
// Blockbench atualiza aqui no npm run dev). A câmera gira em volta (botão esquerdo gira, direito move, rodinha aproxima).
// Para o Matheus o painel troca a animação, a expressão, a pose das mãos, a arma na mão e o ângulo, faz os gestos de
// parado na hora (sem esperar) e mira e atira com a pistola ou a escopeta, ou joga a armadilha (para a frente, num chão
// sem paredes; ela volta sozinha), toma dano e fica machucado; para todos, a luz (estúdio, ou uma
// lâmpada da mansão no escuro, como no jogo).
import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Grid, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import type { Go } from '../App'
import { animarAgente } from '../game/player/animacao'
import { ARMAS, pegarArma, type Arma } from '../game/player/arma'
import type { PoseMao } from '../game/player/maos'
import { montarAgente, type Agente } from '../game/player/modelo'
import { fazerGesto, gestosDe, type Gesto } from '../game/player/parado'
import { tranco } from '../game/player/dano'
import { gatilho } from '../game/weapons/tiro'
import { chamar, descartarArco, desenharArco, gatilhoArmadilha, lancar, novaArmadilha, novoArco, passoArmadilha, pontoDeSoltar, recolher, velocidadeDoArremesso } from '../game/weapons/armadilha'
import { montarMundo } from '../game/world/colisao'
import { armadilhaFora } from '../game/player/arma'
import { AGENTE, QUEDA } from '../game/player/numeros'
import type { Expressao } from '../game/player/rosto'
import { GRUPOS, OBJETOS } from '../maps/objetos'
import { arma3d, caminhoObjeto, objeto3d } from '../render/objetos3d'
import { montarMae } from '../game/enemies/mae/modelo'
import { animarMae, golpear } from '../game/enemies/mae/animacao'
import type { NomeGolpe } from '../game/enemies/mae/golpes'
import { novoLuto, passoLuto } from '../game/enemies/mae/luto'
import { EXPRESSOES_MAE, type ExpressaoMae } from '../game/enemies/mae/rosto'
import { pararSonsMae } from '../game/enemies/mae/sons'
import { ouvinte } from '../audio/espaco'
import { abertura3d } from '../render/objetos3d'

type Anim = 'parado' | 'andando' | 'correndo' | 'esquiva' | 'queda' | 'porta'
type Camera = 'corpo' | 'rosto' | 'maos' | 'pes' | 'costas'
type Luz = 'estudio' | 'jogo'

const AGENTE_ID = 'agente'
const ARMA = 'arma:' // o id de uma arma no seletor: arma:pistola
const MAE = 'fantasma:mae'
const ANIMS_MAE: [Anim, string][] = [['parado', 'Parada'], ['andando', 'Andando (em roda)'], ['porta', 'Passando pela porta']]
// os ataques no Ver modelos: cada botão é uma sequência de golpes (contra um alvo marcado no chão)
const ATAQUES: [string, string, NomeGolpe[]][] = [
  ['garra', 'Garra', ['garra_d']], ['garras', 'Duas garradas', ['garra_d', 'garra_ultima_e']], ['aproximar', 'Aproximar aos trancos', ['aproximar']],
  ['investida', 'Investida', ['investida']], ['carga', 'Carga', ['carga']],
]
const DO_LUTO: [string, string, NomeGolpe[]][] = [
  ['mergulha', 'Mergulhar e voltar', ['mergulhar', 'surgir']], ['finta', 'Finta e investida', ['mergulhar', 'finta', 'investida']],
  ['aviso', 'Aviso e investida', ['mergulhar', 'aviso', 'investida']], ['surgir', 'Surgir (a apresentação)', ['surgir']],
]
// os estados: no lugar (sem alvo); "nome:s" encurta o estado (a enfraquecida dura 12 s no jogo)
const ESTADOS_MAE: [string, string, string[]][] = [
  ['grito', 'Grito', ['grito']], ['exausta', 'Exausta', ['exausta']], ['atordoada', 'Atordoada', ['atordoada']], ['cambaleio', 'Cambaleio', ['cambaleio']],
  ['enfraquecida', 'Enfraquecida e levanta', ['enfraquecida:4', 'levanta']], ['capturada', 'Capturada', ['capturada']],
]
const SEQUENCIAS: [string, string, string[]][] = [...ATAQUES, ...DO_LUTO, ...ESTADOS_MAE]
const NA_MAO: [Arma | null, string][] = [[null, 'Nenhuma'], ...ARMAS.map(([k]): [Arma, string] => [k, k[0].toUpperCase() + k.slice(1)])]
const ANIMS: [Anim, string][] = [['parado', 'Parado'], ['andando', 'Andando'], ['correndo', 'Correndo'], ['esquiva', 'Esquiva'], ['queda', 'Queda']]
const EXPS: [Expressao | null, string][] = [[null, 'Automática'], ['neutra', 'Neutra'], ['esforco', 'Esforço'], ['medo', 'Medo'], ['dor', 'Dor'], ['raiva', 'Raiva'], ['surpresa', 'Surpresa'], ['desmaio', 'Desmaio']]
const MAOS: [PoseMao | null, string][] = [[null, 'Automática'], ['solta', 'Solta'], ['punho', 'Punho'], ['aberta', 'Aberta'], ['segurar', 'Segurar'], ['guarda', 'Guarda'], ['apontar', 'Apontar']]
const CAMERAS: [Camera, string][] = [['corpo', 'Corpo'], ['rosto', 'Rosto'], ['maos', 'Mãos'], ['pes', 'Pés'], ['costas', 'Costas']]
const LUZES: [Luz, string][] = [['estudio', 'Estúdio'], ['jogo', 'Jogo (lâmpada no escuro)']]

interface Escolhas { qual: string; anim: Anim; exp: Expressao | null; mao: PoseMao | null; arma: Arma | null; gesto: { g: Gesto; n: number } | null; mirando: boolean; tiros: number; golpes: number; ferido: boolean; ataque: { nome: string; n: number } | null; rostoMae: ExpressaoMae | null; fase4: boolean; caca: boolean; camera: Camera; luz: Luz; girar: boolean; grade: boolean }
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
  const [e, setE] = useState<Escolhas>({ qual: AGENTE_ID, anim: 'parado', exp: null, mao: null, arma: null, gesto: null, mirando: false, tiros: 0, golpes: 0, ferido: false, ataque: null, rostoMae: null, fase4: false, caca: false, camera: 'corpo', luz: 'estudio', girar: false, grade: true })
  const [info, setInfo] = useState<Info | null>(null)
  const muda = (p: Partial<Escolhas>) => setE((v) => ({ ...v, ...p }))
  const agente = e.qual === AGENTE_ID, arma = e.qual.startsWith(ARMA) ? e.qual.slice(ARMA.length) : null, mae = e.qual === MAE
  return (
    <div className="vermodelo">
      <header className="topo">
        <span className="titulo">Ver modelos</span>
        <span className="nome">{agente ? 'Matheus Moura · modelos/agente.bbmodel' : mae ? 'A Mãe · modelos/fantasmas/mae.bbmodel' : arma ? `${ARMAS.find(([k]) => k === arma)?.[1]} · modelos/armas/${arma}.bbmodel` : `${OBJETOS[e.qual]?.nome} · modelos/${caminhoObjeto(e.qual)}.bbmodel`}</span>
        <span className="espaco" />
        <button className="bt" onClick={() => go('dev')}>Voltar</button>
      </header>
      <div className="vista">
        <Canvas camera={{ position: [1.4, 1.4, 3.6], fov: 35, near: 0.02, far: 100 }}>
          <Luzes luz={e.luz} />
          {agente ? <CenaAgente e={e} onInfo={setInfo} /> : mae ? <CenaMae e={e} onInfo={setInfo} /> : <CenaObjeto key={e.qual} qual={e.qual} girar={e.girar} onInfo={setInfo} />}
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
            <optgroup label="Fantasmas"><option value={MAE}>A Mãe</option></optgroup>
            <optgroup label="Armas">{ARMAS.map(([k, nome]) => <option key={k} value={ARMA + k}>{nome}</option>)}</optgroup>
            {GRUPOS.map(([g, nome]) => (
              <optgroup key={g} label={`Objetos · ${nome}`}>
                {Object.entries(OBJETOS).filter(([, o]) => o.grupo === g).map(([k, o]) => <option key={k} value={k}>{o.nome}</option>)}
              </optgroup>
            ))}
          </select>
        </section>
        {mae && <Opcoes titulo="Animação" lista={ANIMS_MAE} valor={e.anim} onEscolher={(anim) => muda({ anim })} />}
        {mae && <Opcoes titulo="Expressão" lista={[[null, 'Automática'], ...EXPRESSOES_MAE] as [ExpressaoMae | null, string][]} valor={e.rostoMae} onEscolher={(rostoMae) => muda({ rostoMae })} />}
        {mae && <Opcoes titulo="Ela está" lista={[[false, 'Patrulhando (cantarola)'], [true, 'Caçando (respira e guincha)']] as [boolean, string][]} valor={e.caca} onEscolher={(caca) => muda({ caca })} />}
        {mae && <Opcoes titulo="Fase" lista={[[false, 'Fases 1 a 3'], [true, 'Fase 4 (a última barra)']] as [boolean, string][]} valor={e.fase4} onEscolher={(fase4) => muda({ fase4 })} />}
        {mae && <section>
          <b>Ataques</b>
          <div className="opcoes">{ATAQUES.map(([id, nome]) => <button key={id} onClick={() => muda({ anim: 'parado', girar: false, ataque: { nome: id, n: (e.ataque?.n ?? 0) + 1 } })}>{nome}</button>)}</div>
          <small>Ela sai de 2 m atrás contra o alvo marcado no chão (a 4,6 m) e volta ao lugar.</small>
        </section>}
        {mae && <section>
          <b>O Luto</b>
          <div className="opcoes">{DO_LUTO.map(([id, nome]) => <button key={id} onClick={() => muda({ anim: 'parado', girar: false, ataque: { nome: id, n: (e.ataque?.n ?? 0) + 1 } })}>{nome}</button>)}</div>
          <small>A poça embaixo dela. O aviso: o chão estufa, borbulha e brilha vermelho onde ela vai sair.</small>
        </section>}
        {mae && <section>
          <b>Estados</b>
          <div className="opcoes">{ESTADOS_MAE.map(([id, nome]) => <button key={id} onClick={() => muda({ anim: 'parado', girar: false, ataque: { nome: id, n: (e.ataque?.n ?? 0) + 1 } })}>{nome}</button>)}</div>
          <small>No lugar. Atordoada e enfraquecida: de joelhos, o Luto escorrendo dos olhos.</small>
        </section>}
        {agente && <>
          <Opcoes titulo="Animação" lista={ANIMS} valor={e.anim} onEscolher={(anim) => muda({ anim })} />
          <Opcoes titulo="Expressão" lista={EXPS} valor={e.exp} onEscolher={(exp) => muda({ exp })} />
          <Opcoes titulo="Mãos" lista={MAOS} valor={e.mao} onEscolher={(mao) => muda({ mao })} />
          <Opcoes titulo="Arma na mão" lista={NA_MAO} valor={e.arma} onEscolher={(arma) => muda({ arma })} />
          <section>
            <b>Gestos de parado</b>
            <div className="opcoes">{gestosDe(e.arma).map(([g, nome]) => <button key={g} onClick={() => muda({ anim: 'parado', gesto: { g, n: (e.gesto?.n ?? 0) + 1 } })}>{nome}</button>)}</div>
            <small>{gestosDe(e.arma).length ? 'Parado, ele faz um sozinho a cada 8 a 15 s (os de mão vazia, ou os da arma na mão).' : 'Com esta arma, ainda nenhum.'}</small>
          </section>
          {e.arma && <section>
            <b>{e.arma === 'armadilha' ? 'Mirar e arremessar' : 'Mirar e atirar'}</b>
            <div className="opcoes">
              <button aria-pressed={e.mirando} onClick={() => muda({ mirando: !e.mirando })}>Mirando</button>
              <button onClick={() => muda({ tiros: e.tiros + 1 })}>{e.arma === 'armadilha' ? 'Arremessar' : 'Atirar'}</button>
            </div>
            <small>{e.arma === 'armadilha' ? 'Para a frente; mirando, o arco mostra onde ela cai. Presa, ela volta sozinha em 1,5 s.' : 'Para a frente. Atirar sem estar mirando levanta a arma antes.'}</small>
          </section>}
          <section>
            <b>Dano</b>
            <div className="opcoes">
              <button onClick={() => muda({ golpes: e.golpes + 1 })}>Tomar dano</button>
              <button aria-pressed={e.ferido} onClick={() => muda({ ferido: !e.ferido })}>Machucado</button>
            </div>
            <small>O golpe vem de uma direção sorteada. Machucado: com 30% da vida ou menos.</small>
          </section>
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

/** O voo curto da câmera até um enquadramento (alvo e de onde olha). seguir: depois do voo, a câmera acompanha um ponto
 *  que se mexe (o rosto da Mãe), sem tirar o giro de quem olha. */
function useVoo() {
  const { camera, controls } = useThree() as unknown as { camera: THREE.PerspectiveCamera; controls: { target: THREE.Vector3; update: () => void } | null }
  const voo = useRef<null | { de0: THREE.Vector3; alvo0: THREE.Vector3; de1: THREE.Vector3; alvo1: THREE.Vector3; k: number }>(null)
  const segue = useRef<((p: THREE.Vector3) => THREE.Vector3) | null>(null)
  useFrame((_, dt) => {
    const v = voo.current, s = segue.current
    if (!controls) return
    if (v) {
      v.k = Math.min(1, v.k + Math.min(dt, 0.05) / 0.45)
      const k = v.k * v.k * (3 - 2 * v.k)
      camera.position.lerpVectors(v.de0, v.de1, k); controls.target.lerpVectors(v.alvo0, v.alvo1, k); controls.update()
      if (v.k >= 1) voo.current = null
    } else if (s) { // o alvo e a câmera andam juntos até o ponto
      const d = s(_ponto).sub(controls.target).multiplyScalar(1 - Math.exp(-6 * Math.min(dt, 0.05)))
      controls.target.add(d); camera.position.add(d); controls.update()
    }
  })
  return {
    pronto: !!controls,
    voar: (alvo: THREE.Vector3, de: THREE.Vector3) => { if (controls) voo.current = { de0: camera.position.clone(), alvo0: controls.target.clone(), de1: de, alvo1: alvo, k: 0 } },
    seguir: (f: ((p: THREE.Vector3) => THREE.Vector3) | null) => { segue.current = f },
  }
}
const _ponto = new THREE.Vector3()

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
  if (c === 'maos') { a.arms[a.arma ? 0 : 1].hd.getWorldPosition(p).add(new THREE.Vector3(0, -0.06, 0)); return { alvo: p.clone(), de: p.clone().add(new THREE.Vector3(0.55, 0.08, 0.5)) } }
  if (c === 'pes') return { alvo: new THREE.Vector3(0, 0.15, 0.1), de: new THREE.Vector3(0.9, 0.5, 1.4) }
  if (c === 'costas') return { alvo: new THREE.Vector3(0, 1.15, 0), de: new THREE.Vector3(-0.9, 1.5, -2.7) }
  return { alvo: new THREE.Vector3(0, 0.95, 0), de: new THREE.Vector3(1.4, 1.4, 3.6) }
}

function CenaAgente({ e, onInfo }: { e: Escolhas; onInfo: (i: Info) => void }) {
  // montarAgente na lista: salvar o .bbmodel recarrega o módulo e o modelo é montado de novo
  const a = useMemo(() => montarAgente(), [montarAgente])
  const { pronto, voar } = useVoo()
  const esq = useRef(0)
  const tiros = useRef(e.tiros) // os tiros pedidos que já saíram
  const alvo = useMemo(() => new THREE.Vector3(0, 1.45, 8), []) // a mira: para a frente, na altura do peito
  // a armadilha jogada: num mundo só com o chão; o arco e a cópia solta ficam na cena
  const { scene } = useThree()
  const jogo = useMemo(() => ({ mundo: montarMundo([], 1), arm: novaArmadilha(), arco: novoArco(), vel: new THREE.Vector3(), mao: new THREE.Vector3() }), [])
  useEffect(() => {
    scene.add(jogo.arco.linha, jogo.arco.marca)
    return () => { descartarArco(jogo.arco); recolher(jogo.arm) }
  }, [scene, jogo])

  useEffect(() => {
    const c = contas(a.root)
    a.root.updateMatrixWorld(true)
    const b = new THREE.Box3().setFromObject(a.root)
    onInfo({ linhas: [`Altura: ${(b.max.y - Math.max(0, b.min.y)).toFixed(2)} m`, `${c.blocos} blocos em ${c.juntas} juntas`, `${c.desenhos} chamadas de desenho`] })
  }, [a, onInfo])
  useEffect(() => { if (pronto) { const { alvo, de } = enquadra(e.camera, a); voar(alvo, de) } }, [e.camera, a, pronto])
  useEffect(() => { recolher(jogo.arm); pegarArma(a, e.arma) }, [a, e.arma, jogo])
  useEffect(() => { if (e.gesto) fazerGesto(a, e.gesto.g) }, [a, e.gesto])
  useEffect(() => { if (e.golpes) tranco(a, Math.random() * Math.PI * 2) }, [a, e.golpes])

  useFrame((_, dtBruto) => {
    const dt = Math.min(dtBruto, 0.05)
    // a animação no lugar (o agente não sai da origem)
    let esquiva = -1
    if (e.anim === 'esquiva') { esq.current = (esq.current + dt) % 1.4; esquiva = esq.current < 0.5 ? esq.current / 0.5 : -1 }
    // a queda em ciclo: cai, fica no chão e levanta de novo (no jogo, a tela escurece e ele volta no checkpoint)
    let queda: number | undefined
    if (e.anim === 'queda') { esq.current = (esq.current + dt) % (QUEDA.tomba[1] + 2.5); queda = esq.current < QUEDA.tomba[1] + 1.5 ? esq.current : undefined }
    const velocidade = e.anim === 'andando' ? AGENTE.andar : e.anim === 'correndo' ? AGENTE.correr : 0
    const pede = e.tiros !== tiros.current // um tiro (ou arremesso) pedido: levanta a arma e solta quando ela chegar
    const naMao = a.arma === 'armadilha' && !a.anim.arma.fora
    animarAgente(a, { velocidade, corrida: e.anim === 'correndo' ? 1 : 0, esquiva, expressao: e.exp ?? undefined, mao: e.mao ?? undefined, mira: { quer: (e.mirando || pede) && (a.arma !== 'armadilha' || naMao), alvo }, queda, ferido: e.ferido }, dt)
    const J = jogo
    if (gatilho(a, pede, dt)) tiros.current = e.tiros
    if (gatilhoArmadilha(a, pede && naMao, dt)) {
      const de = pontoDeSoltar(a); lancar(J.arm, scene, de, velocidadeDoArremesso(de, alvo, J.vel)); armadilhaFora(a, true); tiros.current = e.tiros
    }
    if (pede && !a.arma) tiros.current = e.tiros
    if (J.arm.estado === 'presa' && J.arm.t > 1.5) chamar(J.arm) // aqui ela volta sozinha
    if (passoArmadilha(J.arm, J.mundo, a.arms[0].hd.getWorldPosition(J.mao), dt)) armadilhaFora(a, false)
    if (naMao && a.anim.arma.mira > 0.5 && a.anim.arma.lanca < 0) { const de = pontoDeSoltar(a); desenharArco(J.arco, J.mundo, de, velocidadeDoArremesso(de, alvo, J.vel)) }
    else J.arco.linha.visible = J.arco.marca.visible = false
    if (e.girar) a.root.rotation.y += dt * 0.5
  })
  return <primitive object={a.root} />
}

function CenaMae({ e, onInfo }: { e: Escolhas; onInfo: (i: Info) => void }) {
  // montarMae na lista: salvar o .bbmodel recarrega o módulo e ela é montada de novo
  const m = useMemo(() => montarMae(), [montarMae])
  // a porta comum (2,1 m), aberta, para ver ela abaixar: o vão de x −0,5 a 0,5, atravessando em z
  const porta = useMemo(() => { const o = abertura3d('porta-comum'); o.position.set(-0.5, 0, 0); const f = o.getObjectByName('folha_1'); if (f) f.rotation.y = -1.4; return o }, [abertura3d])
  const { pronto, voar, seguir } = useVoo()
  const camera = useThree((s) => s.camera)
  useEffect(() => () => pararSonsMae(m), [m]) // saindo da tela (ou trocando de modelo), ela se cala
  const ida = useRef({ t: 0, z: -2.4, dir: 1, vira: 0 })
  // o ataque: a fila de golpes, de onde ela sai e o alvo à frente; depois de terminar, espera e volta ao lugar
  const ALVO_Z = 2.6
  const ataque = useRef<{ fila: string[]; espera: number; ativo: boolean }>({ fila: [], espera: 0, ativo: false })
  const luto = useMemo(() => novoLuto(3.6), []) // a poça de Luto (também esconde ela quando mergulha)
  const alvo = useMemo(() => { const g = new THREE.Mesh(new THREE.RingGeometry(0.3, 0.38, 24).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#c2453a' })); g.position.set(0, 0.01, ALVO_Z); return g }, [])
  const volta = (z: number) => { m.root.position.set(0, 0, z); m.root.rotation.y = 0; m.saia.pos = m.cabelo.pos = null; m.anim.ultimo = null } // pula sem o tranco nas molas
  useEffect(() => {
    if (!e.ataque) return
    const def = SEQUENCIAS.find(([id]) => id === e.ataque!.nome)
    if (!def) return
    volta(ESTADOS_MAE.some(([id]) => id === def[0]) ? 0 : -2); ataque.current = { fila: [...def[2]], espera: 0, ativo: true }
  }, [e.ataque])
  useEffect(() => {
    const c = contas(m.root)
    m.root.updateMatrixWorld(true)
    const b = new THREE.Box3().setFromObject(m.root)
    onInfo({ linhas: [`Altura: ${b.max.y.toFixed(2)} m`, `${c.blocos} blocos em ${c.juntas} juntas`, `${c.desenhos} chamadas de desenho`] })
  }, [m, onInfo])
  useEffect(() => {
    if (!pronto) return
    // forçando uma expressão: de perto no rosto, e a câmera acompanha a cabeça (ela balança, curva, estala)
    const rosto = (p: THREE.Vector3) => m.cabeca.localToWorld(p.set(0, 0.1, 0.1))
    seguir(e.rostoMae ? rosto : null)
    if (e.rostoMae) { m.root.updateMatrixWorld(true); const c = rosto(new THREE.Vector3()); voar(c.clone(), c.clone().add(new THREE.Vector3(0.25, 0.05, 0.95))); return }
    voar(new THREE.Vector3(0, 1.2, e.ataque ? 0.3 : 0), e.anim === 'porta' || e.ataque ? new THREE.Vector3(5.6, 2.0, 1.2) : new THREE.Vector3(1.8, 1.7, 4.4))
  }, [m, pronto, e.anim, !!e.ataque, !!e.rostoMae])
  useFrame((_, dtBruto) => {
    const dt = Math.min(dtBruto, 0.05), I = ida.current
    I.t += dt
    let k = 0 // o quanto ela está passando pela porta
    if (e.anim === 'andando') { // em roda, 1,6 m de raio, a 0,95 m/s, de frente para onde vai
      const a = I.t * (0.95 / 1.6)
      m.root.position.set(Math.cos(a) * 1.6, 0, Math.sin(a) * 1.6); m.root.rotation.y = -a
    } else if (e.anim === 'porta') { // vai e volta pela porta; nas pontas, vira devagar
      if (I.vira > 0) { I.vira -= dt; const d = (I.dir > 0 ? 0 : Math.PI) - m.root.rotation.y; m.root.rotation.y += Math.sign(d) * Math.min(Math.abs(d), dt * 2.6) }
      else { I.z += I.dir * 0.95 * dt; if (Math.abs(I.z) > 2.4) { I.z = Math.sign(I.z) * 2.4; I.dir = -I.dir; I.vira = 1.3 } }
      m.root.position.set(0, 0, I.z)
      k = 1 - Math.min(1, Math.max(0, (Math.abs(I.z) - 0.3) / 0.7)); k = k * k * (3 - 2 * k)
    } else if (!ataque.current.ativo) { m.root.position.set(0, 0, 0); if (!e.girar) m.root.rotation.y = 0 }
    if (e.girar && e.anim === 'parado' && !ataque.current.ativo) m.root.rotation.y += dt * 0.5
    // o ataque: o próximo golpe da fila quando o anterior acaba; ela avança o que o golpe pede, de frente (+z)
    const Aq = ataque.current
    if (Aq.ativo && e.anim === 'parado') {
      if (!m.anim.golpe && Aq.fila.length) { const [nome, dur] = Aq.fila.shift()!.split(':'); const g = golpear(m, nome as NomeGolpe); if (dur) g.dur = Number(dur) }
      else if (!m.anim.golpe && (Aq.espera += dt) > 1.2) { Aq.ativo = false; volta(0) }
    }
    ouvinte(camera) // o ouvido é a câmera
    const saida = animarMae(m, { porta: k, perto: ALVO_Z - m.root.position.z, luto, fase4: e.fase4, caca: e.caca, expressao: e.rostoMae ?? undefined }, dt)
    passoLuto(luto, dt)
    if (Aq.ativo) { m.root.position.z += saida.avanca * dt; m.root.position.y = saida.y }
  })
  return <>
    <primitive object={m.root} />
    <primitive object={m.efeitos.grupo} />
    {e.anim === 'porta' && <primitive object={porta} />}
    {e.anim === 'parado' && e.ataque && !ESTADOS_MAE.some(([id]) => id === e.ataque!.nome) && <primitive object={alvo} />}
    {e.anim !== 'porta' && <primitive object={luto.grupo} />}
  </>
}

function CenaObjeto({ qual, girar, onInfo }: { qual: string; girar: boolean; onInfo: (i: Info) => void }) {
  const obj = useMemo(() => (qual.startsWith(ARMA) ? arma3d(qual.slice(ARMA.length)) : objeto3d(qual)), [qual, objeto3d, arma3d])
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
