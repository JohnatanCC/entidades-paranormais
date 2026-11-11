// A iluminação de uma cena de jogo (dentro do <Canvas>): a luz ambiente, o preenchimento que vem de trás da câmera, o
// luar de fora, a neblina com cor, o céu da noite (ceu.ts), o contorno dos personagens e a imagem final (a exposição, o tonemapping e, no Médio
// e no Alto, o passe com o bloom, a correção de cor e a vinheta). Tudo sai da ambientação de onde o agente está
// (maps/ambientes.ts), com troca suave entre as áreas do mapa e os momentos por cima (luz.ts). As lâmpadas e o luar das
// janelas são do mapa (editor/Objetos, editor/Luar): aqui fica só o que é do lugar.
// A resolução e o ligar das sombras do nível são do <Canvas> (quem monta a cena passa canvasDoNivel: o fiber repõe os
// dois a cada redesenho da tela, então mexer neles por aqui não dura). O nível liga aqui o passe final; no automático, os primeiros
// segundos medem os quadros e descem um nível se o aparelho não der conta.
//   etapa 3 (a luz assada no mapa): quando chegar, a luz ambiente daqui baixa, porque a malha já traz a luz dos cantos;
// No Médio e no Alto, a lua e as lâmpadas mais perto do agente fazem sombra (render/sombras.ts).
import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { forcaDoLuar } from '../../editor/Luar'
import { LUA, LUAR_NO_JOGO, ambienteDe } from '../../maps/ambientes'
import type { AreaAmbiente } from '../../maps/types'
import { ASSADA, luzAssada, piscaEm } from '../../render/assada'
import { BRILHO, FORCA_COM_BLOOM } from '../../render/brilho'
import { CONTORNO } from '../../render/contorno'
import { novoPasseFinal, type Bloom, type PasseFinal } from '../../render/passeFinal'
import { MEDICAO, NIVEIS, descerNivel, useNivel } from '../../render/qualidade'
import { descartarCeu, novoCeu } from './ceu'
import { escolherSombras, refazerSombras, semSombras } from '../../render/sombras'
import { ambienteEm, novaLuzViva, passoLuz, type Luz } from './luz'

interface Props {
  ambiente: string // a ambientação padrão do mapa (ou a única, numa cena sem áreas)
  areas?: AreaAmbiente[] // as áreas do mapa com outra ambientação
  em?: THREE.Vector3 // onde o agente está (lido a cada quadro); sem ele, vale a padrão
  semCeu?: boolean // sem a cúpula do céu (o Ver modelos: o fundo fica liso)
}

const SEM_AREAS: AreaAmbiente[] = []
const _f = new THREE.Vector3(), _a = new THREE.Vector3()
const LONGE = 45 // a que distância do agente a lua "fica" para fazer a sombra (m)

export function Iluminacao({ ambiente, areas = SEM_AREAS, em, semCeu }: Props) {
  const gl = useThree((s) => s.gl), scene = useThree((s) => s.scene)
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
    scene.add(c.ceu, c.preenchimento, c.luar, c.luar.target)
    if (c.cupula) scene.add(c.cupula.malha)
    scene.fog = c.neblina; scene.background = c.fundo
    return () => {
      scene.remove(c.ceu, c.preenchimento, c.luar, c.luar.target)
      if (c.cupula) scene.remove(c.cupula.malha)
      scene.fog = antes.neblina; scene.background = antes.fundo; gl.toneMappingExposure = antes.exposicao
      CONTORNO.forca.value = 0
    }
  }, [gl, scene, c])
  useEffect(() => () => { if (c.cupula) descartarCeu(c.cupula) }, [c])

  // o desenho do luar das janelas é mais sutil no jogo
  useEffect(() => { forcaDoLuar(LUAR_NO_JOGO); return () => forcaDoLuar(1) }, [])

  // a luz das lâmpadas assada na malha: no Baixo e no Médio, todas; no Alto, as que não fazem sombra
  useEffect(() => { luzAssada(N.lampadas); return () => luzAssada('nao') }, [N.lampadas])

  // as sombras em tempo real (Médio e Alto): a lua, uma sombra para tudo em volta do agente; as lâmpadas, só as mais perto
  const S = N.sombras
  useEffect(() => {
    if (!S.lua && !S.lampadas) return
    const s = c.luar.shadow
    s.mapSize.set(S.lua, S.lua); s.bias = -0.0006; s.normalBias = 0.05
    Object.assign(s.camera, { left: -24, right: 24, top: 24, bottom: -24, near: 1, far: LONGE * 2 }); s.camera.updateProjectionMatrix()
    return () => { c.luar.castShadow = false; s.map?.dispose(); s.map = null; semSombras() }
  }, [gl, c, S])

  const sombra = useRef(1), quadro = useRef(0) // o tempo até escolher de novo as lâmpadas que fazem sombra; o quadro, para o ritmo delas
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
    // a lua acompanha o agente (de metro em metro, para a sombra não tremer); dentro de casa o luar é zero e a sombra dela não é refeita
    _a.set(em ? Math.round(em.x) : 0, 0, em ? Math.round(em.z) : 0)
    c.luar.target.position.copy(_a); c.luar.position.set(_a.x + LUA[0] * LONGE, LUA[1] * LONGE, _a.z + LUA[2] * LONGE)
    // cada sombra é refeita no ritmo do nível; a da lua e as das lâmpadas em quadros alternados, para o custo não somar
    const q = quadro.current++
    // a lua só faz sombra onde tem luar: dentro de casa (luar zero) o cenário nem faz a conta da sombra dela em cada
    // pixel (são 17 leituras de textura por pixel). A troca refaz os programas uma vez; depois ficam guardados.
    const lua = S.lua > 0 && L.forcaLuar > 0.02
    if (c.luar.castShadow !== lua) c.luar.castShadow = lua
    c.luar.shadow.autoUpdate = false; c.luar.shadow.needsUpdate = lua && q % S.cada === S.cada - 1
    if (S.lampadas) refazerSombras(q, S.cada)
    if (S.lampadas && em && (sombra.current += dt) > 0.4) { sombra.current = 0; escolherSombras(_a.set(em.x, em.y + 1, em.z), S.lampadas, S.mapa) }
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
