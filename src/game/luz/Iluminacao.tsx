// A iluminação de uma cena de jogo (dentro do <Canvas>): a luz ambiente, o preenchimento que vem de trás da câmera, o
// luar de fora, a neblina com cor, o céu da noite (ceu.ts), o contorno dos personagens e a imagem final (a exposição, o tonemapping e, no Médio
// e no Alto, o passe com o bloom, a correção de cor e a vinheta). Tudo sai da ambientação de onde o agente está
// (maps/ambientes.ts), com troca suave entre as áreas do mapa e os momentos por cima (luz.ts). As lâmpadas e o luar das
// janelas são do mapa (editor/Objetos, editor/Luar): aqui fica só o que é do lugar.
// O nível de qualidade (render/qualidade.ts) muda a resolução e liga o passe final; no automático, os primeiros
// segundos medem os quadros e descem um nível se o aparelho não der conta.
//   etapa 3 (a luz assada no mapa): quando chegar, a luz ambiente daqui baixa, porque a malha já traz a luz dos cantos;
//   etapa 4 (sombras em tempo real, só no Alto): o luar e as lâmpadas ganham sombra aqui e em editor/Objetos.
import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { LUA, ambienteDe } from '../../maps/ambientes'
import type { AreaAmbiente } from '../../maps/types'
import { ASSADA, luzAssada, piscaEm } from '../../render/assada'
import { BRILHO, FORCA_COM_BLOOM } from '../../render/brilho'
import { CONTORNO } from '../../render/contorno'
import { novoPasseFinal, type Bloom, type PasseFinal } from '../../render/passeFinal'
import { MEDICAO, NIVEIS, descerNivel, useNivel } from '../../render/qualidade'
import { descartarCeu, novoCeu } from './ceu'
import { ambienteEm, novaLuzViva, passoLuz, type Luz } from './luz'

interface Props {
  ambiente: string // a ambientação padrão do mapa (ou a única, numa cena sem áreas)
  areas?: AreaAmbiente[] // as áreas do mapa com outra ambientação
  em?: THREE.Vector3 // onde o agente está (lido a cada quadro); sem ele, vale a padrão
  semCeu?: boolean // sem a cúpula do céu (o Ver modelos: o fundo fica liso)
}

const SEM_AREAS: AreaAmbiente[] = []
const _f = new THREE.Vector3()

export function Iluminacao({ ambiente, areas = SEM_AREAS, em, semCeu }: Props) {
  const gl = useThree((s) => s.gl), scene = useThree((s) => s.scene), setDpr = useThree((s) => s.setDpr)
  const N = NIVEIS[useNivel()]
  const lugar = () => (em ? ambienteEm(ambiente, areas, em.x, em.y, em.z) : ambienteDe(ambiente))
  const c = useMemo(() => {
    const viva = novaLuzViva(lugar())
    const luar = new THREE.DirectionalLight(); luar.position.set(...LUA) // vem de onde a lua está no céu
    return { viva, cupula: semCeu ? null : novoCeu(), ceu: new THREE.HemisphereLight(), preenchimento: new THREE.DirectionalLight(), luar, neblina: new THREE.FogExp2(0, 0), fundo: new THREE.Color() }
  }, [])

  // as luzes, a neblina e o fundo entram na cena; ao sair, a cena volta a ser a de antes (a do editor)
  useEffect(() => {
    const antes = { neblina: scene.fog, fundo: scene.background, exposicao: gl.toneMappingExposure }
    scene.add(c.ceu, c.preenchimento, c.luar)
    if (c.cupula) scene.add(c.cupula.malha)
    scene.fog = c.neblina; scene.background = c.fundo
    return () => {
      scene.remove(c.ceu, c.preenchimento, c.luar)
      if (c.cupula) scene.remove(c.cupula.malha)
      scene.fog = antes.neblina; scene.background = antes.fundo; gl.toneMappingExposure = antes.exposicao
      CONTORNO.forca.value = 0
    }
  }, [gl, scene, c])
  useEffect(() => () => { if (c.cupula) descartarCeu(c.cupula) }, [c])

  // a resolução do nível (o celular tem 2 a 3 pixels por ponto da tela: desenhar todos é o que mais pesa)
  useEffect(() => {
    setDpr(Math.min(window.devicePixelRatio, N.dpr))
    return () => setDpr([1, 2]) // a do editor
  }, [setDpr, N.dpr])

  // a luz das lâmpadas assada na malha (Baixo e Médio): o cenário troca as lâmpadas de verdade por ela
  useEffect(() => { luzAssada(N.assada); return () => luzAssada(false) }, [N.assada])

  const medida = useRef({ t: 0, soma: 0, n: 0, feita: false })
  useFrame(({ camera, clock }, dt) => {
    passoLuz(c.viva, lugar(), Math.min(dt, 0.1))
    const L = c.viva.agora
    c.ceu.color.copy(L.ceu); c.ceu.groundColor.copy(L.chao); c.ceu.intensity = L.forca
    // o preenchimento vem de trás da câmera, de cima e um pouco de lado: o que o jogador olha tem sempre volume
    camera.getWorldDirection(_f)
    c.preenchimento.position.set(-_f.x + _f.z * 0.5, 0.9, -_f.z - _f.x * 0.5)
    c.preenchimento.color.copy(L.preenchimento); c.preenchimento.intensity = L.forcaPreenchimento
    c.luar.color.copy(L.luar); c.luar.intensity = L.forcaLuar
    c.neblina.color.copy(L.neblina); c.neblina.density = L.densidade; c.fundo.copy(L.neblina)
    // o céu: o horizonte é a cor da neblina (o que some ao longe some na cor dele)
    if (c.cupula) { const C = c.cupula; C.zenite.copy(L.zenite); C.horizonte.copy(L.neblina); C.u.uEstrelas.value = L.estrelas; C.u.uForcaLua.value = L.lua; C.u.uT.value = clock.elapsedTime }
    CONTORNO.cor.value.copy(L.contorno); CONTORNO.forca.value = L.forcaContorno
    ASSADA.pisca.value = piscaEm(clock.elapsedTime) // as lâmpadas que falham, na malha (piscam juntas)
    gl.toneMappingExposure = L.exposicao // sem o passe final, o tonemapping é o do próprio three
    // o automático: mede os quadros do começo e desce um nível se estiverem lentos (e mede de novo no nível novo)
    const m = medida.current
    if (!m.feita && dt < 0.25 && (m.t += dt) > MEDICAO.espera) {
      m.soma += dt; m.n++
      if (m.soma >= MEDICAO.janela) {
        if ((m.soma / m.n) * 1000 > MEDICAO.lento && descerNivel()) Object.assign(m, { t: 0, soma: 0, n: 0 })
        else m.feita = true
      }
    }
  })

  return N.passe ? <Passe amostras={N.amostras} bloom={N.bloom} luz={c.viva.agora} /> : null
}

/** O passe final (Médio e Alto): assume o desenho da cena enquanto está montado. */
function Passe({ amostras, bloom, luz }: { amostras: number; bloom: Bloom; luz: Luz }) {
  const passe = useMemo<PasseFinal>(() => novoPasseFinal(amostras, bloom), [amostras, bloom])
  useEffect(() => () => passe.descartar(), [passe])
  // com o bloom, o que acende sozinho (as lâmpadas, os olhos) passa do branco: é o que faz o halo
  useEffect(() => { BRILHO.value = FORCA_COM_BLOOM; return () => { BRILHO.value = 1 } }, [])
  useFrame(({ gl, scene, camera, clock }) => passe.desenhar(gl, scene, camera, luz, clock.elapsedTime), 1)
  return null
}
