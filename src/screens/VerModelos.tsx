// Ver modelos (Modo desenvolvedor): um modelo sozinho na tela, para olhar de perto e decidir o que melhorar.
// Não edita nada: o Matheus vem de modelos/agente.bbmodel, a Lara, o Nicolas e o Victor de modelos/lara.bbmodel, nicolas.bbmodel e victor.bbmodel (o mesmo esqueleto), os fantasmas de modelos/fantasmas/<nome>.bbmodel (a Mãe), os demônios de modelos/demonios/<nome>.bbmodel (o Assombrado: parado, andando, atacar, dano, estourar; a Asa sombria: voando, cuspir com o projétil, desviar, dano, estourar; o Devora almas, num chão de verdade: fora do chão, nadando, o ataque que erra e o que engole o Matheus, dano, estourar), as armas de modelos/armas/<nome>.bbmodel e os objetos de
// modelos/objetos/<tipo>.bbmodel (salvar no
// Blockbench atualiza aqui no npm run dev). A câmera gira em volta (botão esquerdo gira, direito move, rodinha aproxima).
// Para o Matheus o painel troca a animação, a expressão, a pose das mãos, a arma na mão e o ângulo, faz os gestos de
// parado na hora (sem esperar) e mira e atira com a pistola ou a escopeta (as balas e a recarga da escopeta, o calor da
// pistola, com o contador; o gatilho pode ficar preso), ou joga a armadilha (para a frente, num chão
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
import { montarAgente, type Agente, type ModeloAgente } from '../game/player/modelo'
import { fazerGesto, gestosDe, type Gesto } from '../game/player/parado'
import { tranco } from '../game/player/dano'
import { gatilho } from '../game/weapons/tiro'
import { cortarRecarga, gastar, novaMunicao, passoMunicao, recarregar, temTiro, textoDaMunicao } from '../game/weapons/municao'
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
import { Iluminacao } from '../game/luz/Iluminacao'
import { montarAssombrado, type Assombrado } from '../game/enemies/assombrado/modelo'
import { animarAssombrado, arremessar, atacar, estourarAssombrado, ferir, refazer, surgirAssombrado } from '../game/enemies/assombrado/animacao'
import { novoEstouro, passoEstouro } from '../game/enemies/estouro'
import { montarAsaSombria, type AsaSombria } from '../game/enemies/asa-sombria/modelo'
import { animarAsaSombria, cuspir, desviar, estourarAsa, ferir as ferirAsa, refazerAsa } from '../game/enemies/asa-sombria/animacao'
import { disparar, novosProjeteis, passoProjeteis } from '../game/enemies/asa-sombria/projetil'
import { montarDevoraAlmas } from '../game/enemies/devora-almas/modelo'
import { animarDevora, arrancar, atordoar, chover, emergir, estourarDevora, fase, ferir as ferirDevora, investir, marcar, mergulhar, ninhada, rastejar, refazerDevora } from '../game/enemies/devora-almas/animacao'
import { chuvaDeTentaculos, novosEfeitosDevora, passoEfeitosDevora } from '../game/enemies/devora-almas/efeitos'
import { nadarPara as nadarParaDevora, virarPara as virarParaDevora } from '../game/enemies/devora-almas/nado'
import { ESCALA as ESCALA_DEVORA, NINHADA, RESPINGO } from '../game/enemies/devora-almas/numeros'
import { estourar } from '../game/enemies/estouro'
import { calar, somEm } from '../game/enemies/sons'
import { ouvirAgente } from '../game/player/sons'
import { ouvirAssombrado } from '../game/enemies/assombrado/sons'
import { bolaBatendo, ouvirAsaSombria } from '../game/enemies/asa-sombria/sons'
import { avisoChuva, ouvirDevora, tentaculo } from '../game/enemies/devora-almas/sons'

type Anim = 'parado' | 'andando' | 'correndo' | 'esquiva' | 'queda' | 'porta'
type Camera = 'corpo' | 'rosto' | 'maos' | 'pes' | 'costas'
type Luz = 'estudio' | 'jogo'

// os humanos com o esqueleto do agente (o mesmo painel): o id é o nome do arquivo em modelos/
const HUMANOS: [ModeloAgente, string][] = [['agente', 'Matheus Moura'], ['lara', 'Lara'], ['nicolas', 'Nicolas'], ['victor', 'Victor']]
const AGENTE_ID = 'agente'
const ARMA = 'arma:' // o id de uma arma no seletor: arma:pistola
const MAE = 'fantasma:mae'
const ANIMS_MAE: [Anim, string][] = [['parado', 'Parada'], ['andando', 'Andando (em roda)'], ['porta', 'Passando pela porta']]
// os demônios (docs/demonios.md): o id é o nome do arquivo em modelos/demonios/
const ASSOMBRADO = 'demonio:assombrado', ASA = 'demonio:asa-sombria', DEVORA = 'demonio:devora-almas'
type AcaoDemonio = 'atacar' | 'engolir' | 'investida' | 'chuva' | 'ninhada' | 'arrancar' | 'atordoar' | 'rastejar' | 'surgir' | 'cuspir' | 'desviar' | 'dano' | 'estourar'
const DEMONIOS: Record<string, { nome: string; arquivo: string; anims: [Anim, string][]; acoes: [AcaoDemonio, string][]; ajuda: string }> = {
  [ASSOMBRADO]: {
    nome: 'O Assombrado', arquivo: 'demonios/assombrado', anims: [['parado', 'Parado'], ['andando', 'Andando (em roda)']],
    acoes: [['atacar', 'Atacar'], ['surgir', 'Surgir do chão'], ['dano', 'Tomar dano'], ['estourar', 'Estourar']],
    ajuda: 'O ataque sai de trás contra o alvo marcado no chão. Surgir: sobe do líquido preto. O dano vem de uma direção sorteada. Estourado, ele volta em 2,5 s.',
  },
  [ASA]: {
    nome: 'A Asa sombria', arquivo: 'demonios/asa-sombria', anims: [['parado', 'Voando no lugar'], ['andando', 'Voando (em roda)']],
    acoes: [['cuspir', 'Cuspir'], ['desviar', 'Desviar'], ['dano', 'Tomar dano'], ['estourar', 'Estourar']],
    ajuda: 'Ela voa a 2 m. Cospe no alvo marcado a 4 m, na altura do peito do agente. Desvia um lado de cada vez. Estourada, volta em 2,5 s.',
  },
  [DEVORA]: {
    nome: 'O Devora almas', arquivo: 'demonios/devora-almas', anims: [['parado', 'Fora do chão'], ['andando', 'Nadando no chão (em roda)']],
    acoes: [['atacar', 'Atacar (erra)'], ['engolir', 'Atacar (engole o agente)'], ['investida', 'Investida rasante'], ['chuva', 'Chuva de tentáculos'], ['ninhada', 'Cuspir demônios'], ['arrancar', 'Arrancar um tentáculo das costas'], ['atordoar', 'Atordoar (muito dano)'], ['rastejar', 'Rastejar (cansado)'], ['dano', 'Tomar dano'], ['estourar', 'Estourar']],
    ajuda: 'Num chão de verdade (ele nada por baixo), contra o Matheus parado na marca. Cospe dois Assombrados e uma Asa sombria. Na terceira barra: duas investidas seguidas, 5 círculos na chuva e Assombrados também do chão. Atordoado, cai de lado tonto e depois rasteja (a janela para atirar). Os tentáculos arrancados voltam quando ele estoura e volta (2,5 s).',
  },
}
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

interface Escolhas { qual: string; anim: Anim; exp: Expressao | null; mao: PoseMao | null; arma: Arma | null; gesto: { g: Gesto; n: number } | null; mirando: boolean; tiros: number; gatilho: boolean; recargas: number; golpes: number; ferido: boolean; ataque: { nome: string; n: number } | null; rostoMae: ExpressaoMae | null; fase4: boolean; caca: boolean; demonio: { acao: AcaoDemonio; n: number } | null; faseDevora: number; camera: Camera; luz: Luz; girar: boolean; grade: boolean }
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
  const [e, setE] = useState<Escolhas>({ qual: AGENTE_ID, anim: 'parado', exp: null, mao: null, arma: null, gesto: null, mirando: false, tiros: 0, gatilho: false, recargas: 0, golpes: 0, ferido: false, ataque: null, rostoMae: null, fase4: false, caca: false, demonio: null, faseDevora: 1, camera: 'corpo', luz: 'estudio', girar: false, grade: true })
  const [info, setInfo] = useState<Info | null>(null)
  const [municao, setMunicao] = useState<string | null>(null) // o contador da arma na mão (as balas, o calor)
  const muda = (p: Partial<Escolhas>) => setE((v) => ({ ...v, ...p }))
  const humano = HUMANOS.find(([id]) => id === e.qual), agente = !!humano, arma = e.qual.startsWith(ARMA) ? e.qual.slice(ARMA.length) : null, mae = e.qual === MAE
  const demonio = DEMONIOS[e.qual]
  return (
    <div className="vermodelo">
      <header className="topo">
        <span className="titulo">Ver modelos</span>
        <span className="nome">{humano ? `${humano[1]} · modelos/${e.qual}.bbmodel` : mae ? 'A Mãe · modelos/fantasmas/mae.bbmodel' : demonio ? `${demonio.nome} · modelos/${demonio.arquivo}.bbmodel` : arma ? `${ARMAS.find(([k]) => k === arma)?.[1]} · modelos/armas/${arma}.bbmodel` : `${OBJETOS[e.qual]?.nome} · modelos/${caminhoObjeto(e.qual)}.bbmodel`}</span>
        <span className="espaco" />
        <button className="bt" onClick={() => go('dev')}>Voltar</button>
      </header>
      <div className="vista">
        <Canvas camera={{ position: [1.4, 1.4, 3.6], fov: 35, near: 0.02, far: 100 }}>
          <Luzes luz={e.luz} />
          {agente ? <CenaAgente key={e.qual} modelo={e.qual as ModeloAgente} e={e} onInfo={setInfo} onMunicao={setMunicao} /> : mae ? <CenaMae e={e} onInfo={setInfo} /> : e.qual === ASSOMBRADO ? <CenaAssombrado e={e} onInfo={setInfo} /> : e.qual === ASA ? <CenaAsaSombria e={e} onInfo={setInfo} /> : e.qual === DEVORA ? <CenaDevora e={e} onInfo={setInfo} /> : <CenaObjeto key={e.qual} qual={e.qual} girar={e.girar} onInfo={setInfo} />}
          {e.grade && <Grid args={[8, 8]} cellSize={0.5} cellThickness={0.6} cellColor="#6a5a40" sectionSize={1} sectionThickness={1.2} sectionColor="#c89b4a" fadeDistance={14} infiniteGrid />}
          <OrbitControls makeDefault target={[0, 0.95, 0]} minDistance={0.2} maxDistance={e.qual === DEVORA ? 12 * ESCALA_DEVORA : 9} />
        </Canvas>
        <div className="ajuda">Botão esquerdo gira · direito move · rodinha aproxima</div>
      </div>
      <aside className="painel">
        <section>
          <b>Modelo</b>
          <select className="escolha" value={e.qual} onChange={(ev) => muda({ qual: ev.target.value })}>
            <option value={AGENTE_ID}>Matheus Moura (o agente)</option>
            <optgroup label="Personagens">{HUMANOS.slice(1).map(([id, nome]) => <option key={id} value={id}>{nome}</option>)}</optgroup>
            <optgroup label="Fantasmas"><option value={MAE}>A Mãe</option></optgroup>
            <optgroup label="Demônios">{Object.entries(DEMONIOS).map(([id, d]) => <option key={id} value={id}>{d.nome}</option>)}</optgroup>
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
        {demonio && <Opcoes titulo="Animação" lista={demonio.anims} valor={e.anim} onEscolher={(anim) => muda({ anim })} />}
        {e.qual === DEVORA && <Opcoes titulo="Barra de vida (a fase: as rachaduras e o brilho)" lista={[[1, 'Primeira'], [2, 'Segunda'], [3, 'Terceira']] as [number, string][]} valor={e.faseDevora} onEscolher={(faseDevora) => muda({ faseDevora })} />}
        {demonio && <section>
          <b>Ações</b>
          <div className="opcoes">{demonio.acoes.map(([acao, nome]) => <button key={acao} onClick={() => muda({ ...(acao === 'atacar' || acao === 'cuspir' ? { anim: 'parado', girar: false } : {}), demonio: { acao, n: (e.demonio?.n ?? 0) + 1 } })}>{nome}</button>)}</div>
          <small>{demonio.ajuda} Os sons tocam com a animação (o ouvido é a câmera: perto, mais alto); sem som, clique uma vez na página antes.</small>
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
              {e.arma !== 'armadilha' && <button aria-pressed={e.gatilho} onClick={() => muda({ gatilho: !e.gatilho })}>Segurar o gatilho</button>}
              {e.arma === 'escopeta' && <button onClick={() => muda({ recargas: e.recargas + 1 })}>Recarregar</button>}
            </div>
            {municao && <span className="municao">{municao}</span>}
            <small>{e.arma === 'armadilha' ? 'Para a frente; mirando, o arco mostra onde ela cai. Presa, ela volta sozinha em 1,5 s.'
              : e.arma === 'escopeta' ? 'Para a frente. 4 balas; vazia, recarrega sozinha (1,5 s por bala; cada uma vale ao entrar). Atirar corta a recarga; o gatilho preso, não.'
              : 'Para a frente. Esquenta 3% por tiro; cheia, trava 5 s. Segurando o gatilho, trava em uns 7 s.'}</small>
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
  // voltando da luz do jogo, a Iluminacao devolve o fundo que achou (o escuro) ao sair: o estúdio repõe o dele depois
  const scene = useThree((s) => s.scene)
  useEffect(() => { if (luz === 'estudio') scene.background = new THREE.Color('#26252a') }, [luz, scene])
  return <>
    <color attach="background" args={[luz === 'jogo' ? '#07080a' : '#26252a']} />
    {luz === 'estudio' ? <>
      <hemisphereLight args={['#ffffff', '#4a4640', 1.3]} />
      <directionalLight position={[2, 3, 2.5]} intensity={1.6} />
      <directionalLight position={[-2.5, 2, -2]} intensity={0.6} color="#bcd0ff" />
    </> : <>
      {/* como no Testar: a luz da mansão, e uma lâmpada de teto acesa por perto */}
      <Iluminacao ambiente="mansao" semCeu />
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

function CenaAgente({ modelo, e, onInfo, onMunicao }: { modelo: ModeloAgente; e: Escolhas; onInfo: (i: Info) => void; onMunicao: (t: string | null) => void }) {
  // montarAgente na lista: salvar o .bbmodel recarrega o módulo e o modelo é montado de novo
  const a = useMemo(() => montarAgente(modelo), [montarAgente, modelo])
  const { pronto, voar } = useVoo()
  const esq = useRef(0)
  const tiros = useRef(e.tiros) // os tiros pedidos que já saíram
  // a munição (as balas da escopeta, o calor da pistola) e o contador que a tela mostra (só quando muda)
  const municao = useMemo(() => novaMunicao(), []), contador = useRef<string | null | undefined>(undefined)
  const recargas = useRef(e.recargas)
  const alvo = useMemo(() => new THREE.Vector3(0, 1.45, 8), []) // a mira: para a frente, na altura do peito
  // a armadilha jogada: num mundo só com o chão; o arco e a cópia solta ficam na cena
  const { scene, camera } = useThree()
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
  useEffect(() => { recolher(jogo.arm); pegarArma(a, e.arma); cortarRecarga(municao) }, [a, e.arma, jogo, municao])
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
    // a munição, como no Testar: o botão Atirar com bala corta a recarga (o gatilho preso, não); vazia, recarrega; a
    // pistola travada não atira (o pedido se perde)
    const M = municao, atira = (pede || e.gatilho) && a.arma !== 'armadilha'
    if (a.arma === 'escopeta' && (e.recargas !== recargas.current || (atira && M.balas === 0))) recarregar(M)
    else if (a.arma === 'escopeta' && pede && M.balas > 0) cortarRecarga(M)
    recargas.current = e.recargas
    if (pede && a.arma === 'pistola' && M.travada > 0) tiros.current = e.tiros
    passoMunicao(M, a.arma, esquiva < 0 && queda === undefined, dt)
    const ea = { velocidade, corrida: e.anim === 'correndo' ? 1 : 0, esquiva, expressao: e.exp ?? undefined, mao: e.mao ?? undefined, mira: { quer: (e.mirando || pede || e.gatilho) && (a.arma !== 'armadilha' || naMao), alvo }, queda, ferido: e.ferido, municao: M }
    animarAgente(a, ea, dt)
    const J = jogo
    ouvinte(camera); ouvirAgente(a, ea, 'pedra', J.arm.estado, J.arm.pos) // os sons dele e da arma, com a animação
    if (gatilho(a, atira && temTiro(M, a.arma), dt)) { gastar(M, a.arma); tiros.current = e.tiros }
    const texto = textoDaMunicao(M, a.arma)
    if (texto !== contador.current) { contador.current = texto; onMunicao(texto) }
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

function CenaAssombrado({ e, onInfo }: { e: Escolhas; onInfo: (i: Info) => void }) {
  // montarAssombrado na lista: salvar o .bbmodel recarrega o módulo e ele é montado de novo
  const a = useMemo(() => montarAssombrado(), [montarAssombrado])
  const E = useMemo(() => novoEstouro(), [])
  const { pronto, voar } = useVoo()
  // em roda: o ângulo; o ataque: sai de trás contra o alvo e volta ao lugar; estourado: quanto falta para ele voltar
  const ida = useRef({ ang: 0, ataque: false, espera: 0, volta: 0 })
  const ALVO_Z = 1.1
  const alvo = useMemo(() => { const g = new THREE.Mesh(new THREE.RingGeometry(0.3, 0.38, 24).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#c2453a' })); g.position.set(0, 0.01, ALVO_Z); return g }, [])
  const noLugar = (z: number) => { a.root.position.set(0, 0, z); a.root.rotation.y = 0; a.molas.pos = null; a.anim.yaw = null } // pula sem o tranco nas molas
  const camera = useThree((st) => st.camera)
  useEffect(() => () => calar(a), [a]) // saindo da tela, ele se cala
  useEffect(() => {
    const c = contas(a.root)
    a.root.updateMatrixWorld(true)
    const b = new THREE.Box3().setFromObject(a.root)
    onInfo({ linhas: [`Altura: ${b.max.y.toFixed(2)} m`, `${c.blocos} blocos em ${c.juntas} juntas`, `${c.desenhos} chamadas de desenho`] })
  }, [a, onInfo])
  useEffect(() => {
    if (pronto) voar(new THREE.Vector3(0, 0.65, e.anim === 'andando' ? 0 : 0.3), e.anim === 'andando' ? new THREE.Vector3(3.2, 2.6, 4.2) : new THREE.Vector3(1.6, 1.2, 3.3))
  }, [pronto, e.anim])
  useEffect(() => {
    const p = e.demonio, I = ida.current
    if (!p) return
    if (a.anim.estourado) { refazer(a); noLugar(0) }
    if (p.acao === 'atacar') { noLugar(-0.6); atacar(a); I.ataque = true; I.espera = 0 }
    else if (p.acao === 'surgir') { noLugar(0); surgirAssombrado(a, E, 0) }
    else if (p.acao === 'dano') ferir(a, Math.random() * Math.PI * 2)
    else { estourarAssombrado(a, E, 0); I.volta = 2.5 }
  }, [e.demonio])
  useFrame((_, dtBruto) => {
    const dt = Math.min(dtBruto, 0.05), I = ida.current
    if (a.anim.estourado && (I.volta -= dt) <= 0) { refazer(a); noLugar(0) }
    const roda = e.anim === 'andando' && !I.ataque
    const s = animarAssombrado(a, { andar: roda ? 1.2 : 0 }, dt)
    if (roda) { // em roda, 1,4 m de raio, de frente para onde vai (ele só avança no ar)
      I.ang += (s.avanca * dt) / 1.4
      a.root.position.set(Math.cos(I.ang) * 1.4, 0, Math.sin(I.ang) * 1.4); a.root.rotation.y = -I.ang
    } else if (I.ataque) { // para a frente (+z) o que o salto pede; acabou, espera e volta ao lugar
      a.root.position.z += s.avanca * dt
      if (!a.anim.golpe && (I.espera += dt) > 0.9) { I.ataque = false; noLugar(0) }
    } else if (e.girar) a.root.rotation.y += dt * 0.5
    ouvinte(camera); ouvirAssombrado(a, dt)
    passoEstouro(E, dt)
  })
  return <>
    <primitive object={a.root} />
    <primitive object={E.grupo} />
    {ida.current.ataque || e.demonio?.acao === 'atacar' ? <primitive object={alvo} /> : null}
  </>
}

function CenaAsaSombria({ e, onInfo }: { e: Escolhas; onInfo: (i: Info) => void }) {
  // montarAsaSombria na lista: salvar o .bbmodel recarrega o módulo e ela é montada de novo
  const a = useMemo(() => montarAsaSombria(), [montarAsaSombria])
  const E = useMemo(() => novoEstouro(), []), P = useMemo(() => novosProjeteis(), [])
  const { pronto, voar } = useVoo()
  const ALTURA = 2.0, R = 2.2, VEL = 3 // o voo: a altura (m); em roda: o raio (m) e a velocidade (m/s)
  // o alvo do cuspe: a 4 m à frente, na altura do peito do agente (um anel em pé)
  const alvo = useMemo(() => new THREE.Vector3(0, 1.3, 4), [])
  const anel = useMemo(() => { const g = new THREE.Mesh(new THREE.RingGeometry(0.22, 0.3, 24), new THREE.MeshBasicMaterial({ color: '#c2453a', side: THREE.DoubleSide })); g.position.copy(alvo); return g }, [alvo])
  const ida = useRef({ ang: 0, lado: 1, volta: 0 })
  const _d = useMemo(() => new THREE.Vector3(), [])
  const camera = useThree((st) => st.camera)
  useEffect(() => () => calar(a), [a])
  useEffect(() => { a.root.position.set(0, ALTURA, 0); a.anim.ultimo = null; a.molas.pos = null }, [a])
  useEffect(() => {
    const c = contas(a.root)
    a.root.updateMatrixWorld(true)
    const b = new THREE.Box3().setFromObject(a.root)
    onInfo({ linhas: [`Altura, com as asas: ${(b.max.y - b.min.y).toFixed(2)} m`, `Largura, com as asas: ${(b.max.x - b.min.x).toFixed(2)} m`, `${c.blocos} blocos em ${c.juntas} juntas`, `${c.desenhos} chamadas de desenho`] })
  }, [a, onInfo])
  useEffect(() => {
    // parada: de lado, pegando ela e o alvo do cuspe; em roda, de longe
    if (pronto) voar(new THREE.Vector3(0, 1.6, e.anim === 'andando' ? 0 : 1.6), e.anim === 'andando' ? new THREE.Vector3(5.5, 4.2, 6.5) : new THREE.Vector3(10.5, 3.1, 2.0))
  }, [pronto, e.anim])
  useEffect(() => {
    const p = e.demonio, I = ida.current
    if (!p) return
    if (a.anim.estourado) { refazerAsa(a); a.root.position.set(0, ALTURA, 0) }
    if (p.acao === 'cuspir') cuspir(a)
    else if (p.acao === 'desviar') { desviar(a, I.lado); I.lado = -I.lado }
    else if (p.acao === 'dano') ferirAsa(a, Math.random() * Math.PI * 2)
    else if (p.acao === 'estourar') { estourarAsa(a, E, 0); I.volta = 2.5 }
  }, [e.demonio])
  useFrame((_, dtBruto) => {
    const dt = Math.min(dtBruto, 0.05), I = ida.current, r = a.root
    if (a.anim.estourado && (I.volta -= dt) <= 0) { refazerAsa(a); r.position.set(0, ALTURA, 0) }
    const roda = e.anim === 'andando' && !a.anim.golpe
    const s = animarAsaSombria(a, { alvo: a.anim.golpe?.nome === 'cuspir' ? alvo : undefined }, dt)
    if (roda) { // em roda, de frente para onde vai
      I.ang += (VEL * dt) / R
      r.position.set(Math.cos(I.ang) * R, ALTURA, Math.sin(I.ang) * R); r.rotation.y = -I.ang
    } else if (!a.anim.golpe) { // parada no ar: volta devagar para o lugar, de frente para o alvo
      const k = 1 - Math.exp(-2.2 * dt)
      r.position.lerp(_d.set(0, ALTURA, 0), k)
      if (!e.girar) r.rotation.y += -r.rotation.y * k; else r.rotation.y += dt * 0.5
    }
    // o que o golpe pede: andar de lado (desviar), recuar (o cuspe)
    r.position.addScaledVector(_d.set(Math.cos(r.rotation.y), 0, -Math.sin(r.rotation.y)), s.lado * dt)
    r.position.addScaledVector(_d.set(Math.sin(r.rotation.y), 0, Math.cos(r.rotation.y)), -s.recua * dt)
    if (s.cospe) disparar(P, s.cospe, alvo)
    ouvinte(camera); ouvirAsaSombria(a, dt)
    passoProjeteis(P, dt, E, 0)
    for (const p of P.bateu) somEm(p, bolaBatendo)
    passoEstouro(E, dt)
  })
  return <>
    <primitive object={a.root} />
    <primitive object={E.grupo} />
    <primitive object={P.grupo} />
    {e.demonio?.acao === 'cuspir' && <primitive object={anel} />}
  </>
}

function CenaDevora({ e, onInfo }: { e: Escolhas; onInfo: (i: Info) => void }) {
  // montarDevoraAlmas na lista: salvar o .bbmodel recarrega o módulo e ele é montado de novo
  const d = useMemo(() => montarDevoraAlmas(), [montarDevoraAlmas])
  const F = useMemo(() => novosEfeitosDevora(), []), E = useMemo(() => novoEstouro(), [])
  // o agente (o alvo dos ataques), em cima da marca; no "Atacar (engole o agente)", é ele que vai para dentro
  const ag = useMemo(() => { const a = montarAgente('agente'); a.root.visible = false; return a }, [montarAgente])
  // os demônios que ele cospe (dois Assombrados e uma Asa sombria) e os que surgem do chão (na terceira barra): somem
  // sozinhos depois de um tempo. A Asa sai voando da boca até a altura do voo, num ponto à frente, e fica lá.
  type Cria = { t: number } & ({ a: Assombrado } | { asa: AsaSombria; de: THREE.Vector3; para: THREE.Vector3 })
  const crias = useRef<Cria[]>([]), grupoCrias = useMemo(() => new THREE.Group(), [])
  // um chão de verdade: esconde o corpo quando ele nada por baixo (como o chão do mapa)
  // (as distâncias da cena acompanham o tamanho dele: ESCALA)
  const k = ESCALA_DEVORA
  const chao = useMemo(() => { const m = new THREE.Mesh(new THREE.PlaneGeometry(16 * k, 16 * k).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#2a292e', roughness: 1 })); m.position.y = -0.004; return m }, [])
  // a marca (onde o agente fica); de onde ele parte para a marca, para a investida e para cuspir Assombrados
  const MARCA = useMemo(() => new THREE.Vector3(0, 0, 2.5 * k), []), PARTIDA = useMemo(() => new THREE.Vector3(-3 * k, 0, -1.5 * k), [])
  const LONGE = useMemo(() => new THREE.Vector3(-3 * k, 0, -3 * k), []), NINHO = useMemo(() => new THREE.Vector3(3 * k, 0, -1 * k), [])
  const RAIO = 3 * k // nadando em roda: o raio (m)
  // o controle (faz as vezes da inteligência): livre (segue a animação escolhida), indo (nada pelos pontos do ataque e,
  // se ele pede, vira para o agente), atacando (o ataque segue sozinho até ele voltar a nadar)
  const I = useRef({ fase: 'livre' as 'livre' | 'indo' | 'atacando', acao: null as AcaoDemonio | null, pontos: [] as THREE.Vector3[], ponto: 0, pega: false, volta: 0 })
  const { pronto, voar } = useVoo()
  const _v = useMemo(() => new THREE.Vector3(), [])
  const camera = useThree((st) => st.camera)
  useEffect(() => () => { calar(d); crias.current.forEach((c) => calar('a' in c ? c.a : c.asa)) }, [d])
  useEffect(() => { d.root.position.set(0, d.anim.y, 0) }, [d])
  useEffect(() => { fase(d, e.faseDevora) }, [d, e.faseDevora])
  useEffect(() => {
    const c = contas(d.root)
    d.root.updateMatrixWorld(true)
    const b = new THREE.Box3().setFromObject(d.root)
    onInfo({ linhas: [`Comprimento: ${(b.max.z - b.min.z).toFixed(2)} m`, `Altura: ${(b.max.y - b.min.y).toFixed(2)} m`, `${c.blocos} blocos em ${c.juntas} juntas`, `${c.desenhos} chamadas de desenho`] })
  }, [d, onInfo])
  useEffect(() => {
    const k = ESCALA_DEVORA
    if (pronto) voar(new THREE.Vector3(0, 0.4 * k, 0.4 * k), e.anim === 'andando' ? new THREE.Vector3(7.5 * k, 6.2 * k, 8 * k) : new THREE.Vector3(6.2 * k, 3.6 * k, 6.4 * k))
  }, [pronto, e.anim])
  useEffect(() => {
    const p = e.demonio, C = I.current
    if (!p) return
    if (d.anim.estourado) { refazerDevora(d); fase(d, e.faseDevora); d.root.position.set(0, d.anim.y, 0); C.fase = 'livre' }
    const ataques: Partial<Record<AcaoDemonio, THREE.Vector3[]>> = { atacar: [PARTIDA, MARCA], engolir: [PARTIDA, MARCA], investida: [LONGE], chuva: [], ninhada: [NINHO] }
    const pontos = ataques[p.acao]
    if (pontos) {
      Object.assign(C, { fase: 'indo', acao: p.acao, pontos, ponto: 0, pega: p.acao === 'engolir' })
      ag.root.visible = true // o agente em cima da marca, olhando para onde ele vem
      ag.root.position.copy(MARCA); ag.root.rotation.y = Math.atan2(PARTIDA.x - MARCA.x, PARTIDA.z - MARCA.z)
      mergulhar(d)
    } else if (p.acao === 'atordoar' || p.acao === 'rastejar') {
      Object.assign(C, { fase: 'atacando', acao: p.acao }) // no lugar onde ele está; acabando, volta a nadar
      if (p.acao === 'atordoar') atordoar(d); else rastejar(d)
    } else if (p.acao === 'arrancar') {
      const n = d.anim.costas.indexOf(true), onde = n >= 0 ? arrancar(d, n) : null
      if (onde) estourar(E, onde, 0.5 * k, 0, { cubos: 16, olhos: 0, mancha: false, tamanho: 2 })
    } else if (p.acao === 'dano') ferirDevora(d, Math.random() * Math.PI * 2)
    else if (p.acao === 'estourar') { estourarDevora(d, E, 0); C.volta = 2.5 }
  }, [e.demonio])
  /** Um Assombrado novo: arremessado da boca dele até `para`, ou surgindo do chão em `para`. */
  const cria = (para: THREE.Vector3, de?: THREE.Vector3) => {
    const a = montarAssombrado()
    grupoCrias.add(a.root)
    if (de) arremessar(a, de, para)
    else { a.root.position.copy(para); a.root.rotation.y = Math.atan2(MARCA.x - para.x, MARCA.z - para.z); surgirAssombrado(a, E, 0) }
    crias.current.push({ a, t: 0 })
  }
  /** Começa o ataque pedido (ele já está nadando no lugar certo). */
  const comecar = (acao: AcaoDemonio) => {
    const C = I.current, f3 = d.anim.fase >= 3
    if (acao === 'atacar' || acao === 'engolir') marcar(d, C.pega)
    else if (acao === 'investida') investir(d, f3 ? 2 : 1)
    else if (acao === 'chuva') { // os círculos: o primeiro no agente, os outros em volta dele
      const n = f3 ? 5 : 3, pontos = [MARCA.clone()]
      for (let i = 1; i < n; i++) { const a = (i / (n - 1)) * Math.PI * 2 + Math.random(), r = 2.5 + Math.random() * 1.5; pontos.push(new THREE.Vector3(MARCA.x + Math.cos(a) * r, 0, MARCA.z + Math.sin(a) * r)) }
      chover(d, n); chuvaDeTentaculos(F, pontos)
    } else if (acao === 'ninhada') {
      ninhada(d, 3)
      if (f3) for (let i = 0; i < 2; i++) { const a = Math.random() * Math.PI * 2, r = 3 + Math.random() * 2; cria(new THREE.Vector3(MARCA.x + Math.cos(a) * r, 0, MARCA.z + Math.sin(a) * r)) } // na fase 3, também do chão
    }
    C.fase = 'atacando'
  }
  // nadando: o rumo com transição (acelera, freia, a curva com raio: devora-almas/nado.ts)
  const nadarPara = (alvo: THREE.Vector3, dt: number) => nadarParaDevora(d, alvo, dt)
  const virarPara = (alvo: THREE.Vector3, dt: number) => virarParaDevora(d, alvo, dt)
  const CHEGOU = 0.5 // m: perto o bastante de um ponto do caminho
  useFrame((_, dtBruto) => {
    const dt = Math.min(dtBruto, 0.05), C = I.current, r = d.root
    if (d.anim.estourado) { if ((C.volta -= dt) <= 0) { refazerDevora(d); r.position.set(0, d.anim.y, 0); r.rotation.y = 0; C.fase = 'livre' } }
    const s = animarDevora(d, dt), modo = d.anim.modo
    ouvinte(camera); ouvirDevora(d, s, dt)
    r.position.y = s.y
    r.position.x += Math.sin(r.rotation.y) * s.avanca * dt; r.position.z += Math.cos(r.rotation.y) * s.avanca * dt
    if (!d.anim.estourado) {
      if (C.fase === 'indo' && modo === 'nadando' && C.acao) {
        if (C.ponto < C.pontos.length) { if (nadarPara(C.pontos[C.ponto], dt) < CHEGOU) C.ponto++ } // os pontos do caminho
        else if ((C.acao !== 'investida' && C.acao !== 'ninhada') || virarPara(MARCA, dt) < 0.03) comecar(C.acao) // de frente para o agente
      } else if (C.fase === 'atacando') {
        if (modo === 'mira') virarPara(MARCA, dt) // na mira, ele acompanha o agente
        if (modo === 'nadando') C.fase = 'livre' // acabou: voltou a nadar
      }
      else if (e.anim === 'andando') { // em roda: sempre um pouco à frente na roda
        if (modo === 'solto') mergulhar(d)
        else if (modo === 'nadando') { const a = Math.atan2(r.position.z, r.position.x) + 0.6; nadarPara(_v.set(Math.cos(a) * RAIO, 0, Math.sin(a) * RAIO), dt) }
      } else if (modo === 'nadando') { // fora do chão: volta para o meio, vira de frente (+z) e sai
        if (Math.hypot(r.position.x, r.position.z) > CHEGOU) nadarPara(_v.set(0, 0, 0), dt)
        else if (virarPara(_v.set(r.position.x, 0, r.position.z + 10), dt) < 0.05) emergir(d)
      }
    }
    // o que aconteceu: o respingo quando a cabeça passa pelo chão; o agente engolido e cuspido
    if (s.rompe) estourar(E, _v.set(Math.sin(r.rotation.y), 0, Math.cos(r.rotation.y)).multiplyScalar(0.8 * ESCALA_DEVORA).add(r.position).setY(0.05), RESPINGO.raio, 0, { cubos: 18, olhos: 0, mancha: false, tamanho: 2 * RESPINGO.cubos })
    if (s.mordeu && C.pega) ag.root.visible = false
    if (s.cuspe && C.pega) {
      ag.root.visible = true
      ag.root.position.set(s.cuspe.x + Math.sin(r.rotation.y) * 0.9 * ESCALA_DEVORA, 0, s.cuspe.z + Math.cos(r.rotation.y) * 0.9 * ESCALA_DEVORA)
      ag.root.rotation.y = r.rotation.y + Math.PI // olhando para ele, jogado para trás
      tranco(ag, 0)
    }
    // um demônio cuspido: o Assombrado voa da boca para a frente (5 a 9 m) até o chão; a Asa sombria sai voando
    if (s.cria) {
      const f = _v.copy(s.cria.frente).setY(0).normalize(), dist = NINHADA.alcance[0] + Math.random() * (NINHADA.alcance[1] - NINHADA.alcance[0])
      const para = new THREE.Vector3(s.cria.de.x + f.x * dist + (Math.random() - 0.5) * 3, 0, s.cria.de.z + f.z * dist + (Math.random() - 0.5) * 3)
      if (s.cria.tipo === 'asa') {
        const asa = montarAsaSombria()
        asa.root.position.copy(s.cria.de); asa.root.rotation.y = Math.atan2(f.x, f.z); grupoCrias.add(asa.root)
        crias.current.push({ asa, de: s.cria.de.clone(), para: para.setY(2.0), t: 0 })
      } else cria(para, s.cria.de)
    }
    crias.current = crias.current.filter((c) => { // os cuspidos: andam (ou pairam) sozinhos um pouco e estouram (no Ver modelos)
      c.t += dt
      const raiz = 'a' in c ? c.a.root : c.asa.root
      if ('a' in c) {
        animarAssombrado(c.a, {}, dt)
        if (c.t > 6 && !c.a.anim.estourado) estourarAssombrado(c.a, E, 0)
        ouvirAssombrado(c.a, dt)
      } else {
        const u = Math.min(1, c.t / 0.9), sai = 1 - (1 - u) * (1 - u) // sai da boca rápido e freia lá na frente, subindo
        c.asa.root.position.lerpVectors(c.de, c.para, sai); c.asa.root.position.y += 0.8 * Math.sin(Math.PI * u)
        if (u >= 1) c.asa.root.rotation.y = Math.atan2(MARCA.x - c.para.x, MARCA.z - c.para.z) // pairando, de frente para o agente
        animarAsaSombria(c.asa, {}, dt)
        if (c.t > 6 && !c.asa.anim.estourado) estourarAsa(c.asa, E, 0)
        ouvirAsaSombria(c.asa, dt)
      }
      if (c.t > 6.5) { grupoCrias.remove(raiz); calar('a' in c ? c.a : c.asa); return false }
      return true
    })
    if (ag.root.visible) animarAgente(ag, { velocidade: 0, corrida: 0, esquiva: -1 }, dt)
    passoEfeitosDevora(F, d, 0, dt, E)
    for (const p of F.sons.aviso) somEm(p, avisoChuva, 4)
    for (const p of F.sons.rompe) somEm(p, tentaculo, 4)
    passoEstouro(E, dt)
  })
  return <>
    <primitive object={chao} />
    <primitive object={d.root} />
    <primitive object={ag.root} />
    <primitive object={grupoCrias} />
    <primitive object={F.grupo} />
    <primitive object={E.grupo} />
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
