// O Testar do criador de mapas: o agente andando no mapa aberto, com a câmera por cima do ombro, colisão, escadas e
// as lâmpadas acesas, a luz do lugar (a ambientação de cada área do mapa: game/luz) e a arma na mão (Q troca): mira e atira (o coice e o clarão), joga a armadilha e chama de volta
// (a bala, os fantasmas e o HUD vêm com o jogo). Fica dentro do <Canvas> do editor.
//   clique trava o mouse · WASD anda · Shift corre · Espaço esquiva · E abre e fecha porta · Q troca a arma · mouse olha
//   botão direito mira · botão esquerdo atira (ou joga a armadilha; com ela fora, chama de volta) · Esc volta ao editor
//   para ver o modelo (só no Testar, não é controle do jogo): 1–6 expressões, 7–9 poses da mão, 0 volta ao automático,
//   K cai (a queda: a tela escurece e ele volta no começo do teste, que por enquanto é o checkpoint), J toma 25 de dano
//   de uma direção sorteada (a vida simples: 30% ou menos, machucado; zerou, cai) · F usa um kit (+60)
//   M toca o momento "a Mãe chegando" (a luz muda por alguns segundos e volta)
import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { LEVEL_H, type AreaAmbiente, type Chunk } from '../maps/types'
import { useSettings } from '../settings/settings'
import { Acoes } from './input/acoes'
import { ganchos } from '../dev/ganchos'
import { novaSombraDeChao } from './corpo/sombraDeChao'
import { Iluminacao } from './luz/Iluminacao'
import { momento } from './luz/luz'
import { animarAgente } from './player/animacao'
import { ARMAS, armadilhaFora, pegarArma } from './player/arma'
import { novoJogador, passoJogador } from './player/controle'
import type { PoseMao } from './player/maos'
import { montarAgente } from './player/modelo'
import type { Expressao } from './player/rosto'
import { AGENTE, CAMERA, QUEDA } from './player/numeros'
import { tranco } from './player/dano'
import { curar, machucado, novaVida, passoVida, porcento, tomarDano } from './player/vida'
import { chamar, descartarArco, desenharArco, gatilhoArmadilha, lancar, novaArmadilha, novoArco, passoArmadilha, pontoDeSoltar, recolher, velocidadeDoArremesso } from './weapons/armadilha'
import { gatilho } from './weapons/tiro'
import { alcanceCamera, andarDe, chaoEm, montarMundo, tetoEm } from './world/colisao'
import { assadorDe, novaLuzVertice } from '../maps/luzAssada'
import { iluminarObjeto } from '../render/assada'
import { animarPortas, dicaDaPorta, novasPortas, portaPerto, usarPorta, type PortasVivas } from './world/portas'

interface Props {
  chunks: Record<string, Chunk>
  levels: number
  ambiente: string // a ambientação padrão do mapa
  areas: AreaAmbiente[] // as áreas com outra ambientação
  inicio: [number, number, number] // onde o agente aparece (x, y, z)
  yaw: number // para onde a câmera começa olhando
  portas: PortasVivas // o estado vivo das portas (este componente preenche; a vista do mapa desenha a partir dele)
  onTravado: (travado: boolean) => void // o mouse travou (jogando) ou soltou
  onDica: (texto: string | null) => void // a linha de ação na tela ("E · abrir a porta", "Trancada.")
  onMira: (mirando: boolean) => void // mirando: a tela mostra o ponto da mira
  onEscuro: (escuro: boolean) => void // a queda: a tela escurece (e clareia quando ele volta)
  onVida: (porcento: number) => void // a vida (em %), num canto (o HUD de verdade vem depois)
  onSair: () => void
}

// as teclas de ver o modelo: 1–6 forçam uma expressão, 7–9 uma pose das mãos, 0 solta as duas
const VER_EXP: Expressao[] = ['neutra', 'esforco', 'medo', 'dor', 'raiva', 'surpresa']
const VER_MAO: PoseMao[] = ['punho', 'aberta', 'apontar']

const amortece = (de: number, para: number, k: number, dt: number) => de + (para - de) * (1 - Math.exp(-k * dt))

export function Testar({ chunks, levels, ambiente, areas, inicio, yaw, portas, onTravado, onDica, onMira, onEscuro, onVida, onSair }: Props) {
  const { camera, gl, scene } = useThree()
  const { sensibilidade } = useSettings()
  // o mundo (colisão) e as portas como o mapa diz que começam
  const mundo = useMemo(() => {
    const m = montarMundo(Object.values(chunks), levels)
    portas.clear(); novasPortas(m).forEach((v, k) => portas.set(k, v))
    return m
  }, [chunks, levels, portas])
  const agente = useMemo(() => montarAgente(), []), sombra = useMemo(() => novaSombraDeChao(), [])
  // a luz assada de onde o agente está (as lâmpadas sem sombra e as janelas), tirada de novo a cada poucos quadros
  const assa = useMemo(() => assadorDe(Object.values(chunks)), [chunks]), luzAgente = useMemo(() => novaLuzVertice(), []), quadro = useRef(0)
  const acoes = useMemo(() => new Acoes(), [])
  const armadilha = useMemo(() => novaArmadilha(), []), arco = useMemo(() => novoArco(), [])
  const est = useRef({
    j: novoJogador(inicio[0], chaoEm(mundo, inicio[0], inicio[2], inicio[1] + 0.3) ?? inicio[1], inicio[2], yaw),
    camYaw: yaw, pitch: -0.12, k: 1, pivX: inicio[0], pivZ: inicio[2], pivY: inicio[1], altura: CAMERA.altura, travou: false,
    msg: '', msgT: 0, dica: null as string | null, mira: 0, mirando: false, escuro: false, cair: false, golpe: false, vidaVista: -1,
  })
  const sairRef = useRef(onSair); sairRef.current = onSair
  const travRef = useRef(onTravado); travRef.current = onTravado
  const dicaRef = useRef(onDica); dicaRef.current = onDica
  const miraRef = useRef(onMira); miraRef.current = onMira
  const escuroRef = useRef(onEscuro); escuroRef.current = onEscuro
  const vidaRef = useRef(onVida); vidaRef.current = onVida
  const vida = useMemo(() => novaVida(), [])
  const ver = useRef<{ exp?: Expressao; mao?: PoseMao }>({})
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if (e.code === 'KeyK') { est.current.cair = true; return } // testar a queda
      if (e.code === 'KeyJ') { est.current.golpe = true; return } // testar um golpe
      if (e.code === 'KeyM') { momento('mae-chegando'); return } // testar um momento de luz
      const n = /^Digit(\d)$/.exec(e.code)?.[1]
      if (n === undefined) return
      const d = Number(n)
      if (d === 0) ver.current = {}
      else if (d <= 6) ver.current.exp = VER_EXP[d - 1]
      else ver.current.mao = VER_MAO[d - 7]
    }
    window.addEventListener('keydown', tecla)
    return () => window.removeEventListener('keydown', tecla)
  }, [])

  // as provas (só no npm run dev): provas.ir(x, z, yaw) leva o agente a um ponto, para fotos sempre do mesmo lugar
  useEffect(() => {
    if (!import.meta.env.DEV) return
    ganchos.ir = (x, z, yaw, pitch = -0.12, andar = 0) => {
      const s = est.current
      s.j = novoJogador(x, chaoEm(mundo, x, z, andar * LEVEL_H + 0.3) ?? andar * LEVEL_H, z, yaw)
      s.camYaw = yaw; s.pitch = pitch; s.pivX = x; s.pivZ = z; s.pivY = s.j.y; s.k = 1
    }
    ganchos.cena = scene; ganchos.gl = gl
    return () => { delete ganchos.ir; delete ganchos.cena; delete ganchos.gl }
  }, [mundo, scene, gl])

  // o agente na cena, a entrada ligada, o mouse travado com um clique; Esc (ou soltar o mouse) volta ao editor
  useEffect(() => {
    const el = gl.domElement
    scene.add(agente.root, sombra, arco.linha, arco.marca)
    acoes.ligar(el)
    const clique = () => { if (document.pointerLockElement !== el) { try { const r = el.requestPointerLock() as unknown as Promise<void> | undefined; r?.catch?.(() => {}) } catch { /* sem trava: segue sem olhar com o mouse */ } } }
    const trava = () => {
      const travado = document.pointerLockElement === el
      if (travado) est.current.travou = true
      else if (est.current.travou) sairRef.current() // soltou o mouse (Esc): fim do teste
      travRef.current(travado)
    }
    // Esc sai; qualquer outra tecla tira o aviso do meio da tela (mesmo sem o mouse travado)
    const esc = (e: KeyboardEvent) => { if (e.code === 'Escape') sairRef.current(); else travRef.current(true) }
    el.addEventListener('click', clique)
    document.addEventListener('pointerlockchange', trava)
    window.addEventListener('keydown', esc)
    clique() // tenta travar já (o clique no botão Testar conta como gesto do usuário)
    return () => {
      scene.remove(agente.root, sombra)
      descartarArco(arco); recolher(armadilha)
      acoes.desligar()
      el.removeEventListener('click', clique)
      document.removeEventListener('pointerlockchange', trava)
      window.removeEventListener('keydown', esc)
      if (document.pointerLockElement === el) document.exitPointerLock()
      const c = camera as THREE.PerspectiveCamera
      c.fov = 50; c.updateProjectionMatrix() // o campo de visão do editor
    }
  }, [gl, scene, agente, sombra, acoes, camera, armadilha, arco])

  const cam = camera as THREE.PerspectiveCamera
  const v = useMemo(() => ({ f: new THREE.Vector3(), r: new THREE.Vector3(), de: new THREE.Vector3(), para: new THREE.Vector3(), alvo: new THREE.Vector3(), vel: new THREE.Vector3(), mao: new THREE.Vector3() }), [])

  useFrame((_, dtBruto) => {
    const dt = Math.min(dtBruto, 0.05), s = est.current, j = s.j
    // olhar
    const [dx, dy] = acoes.olhar(), sens = CAMERA.sens * sensibilidade
    s.camYaw -= dx * sens
    s.pitch = Math.min(CAMERA.pitchMax, Math.max(CAMERA.pitchMin, s.pitch - dy * sens))
    // mirar (o botão direito; atirar sem mirar também levanta a arma; a armadilha só na mão) e andar
    // a queda (K, para testar): caído, nada responde; a tela escurece e ele volta em pé no começo (o checkpoint, por enquanto)
    // um golpe (J): de uma direção sorteada; zerou a vida, cai. F: um kit
    passoVida(vida, dt)
    if (s.golpe && j.caido < 0 && tomarDano(vida, 25)) { tranco(agente, Math.random() * Math.PI * 2); if (vida.atual <= 0) s.cair = true }
    s.golpe = false
    if (acoes.kit() && j.caido < 0) curar(vida, AGENTE.kit)
    if (s.cair && j.caido < 0) j.caido = 0
    s.cair = false
    const caido = j.caido >= 0
    if (caido) {
      j.caido += dt
      if (j.caido >= QUEDA.escurece && !s.escuro) { s.escuro = true; escuroRef.current(true) }
      if (j.caido >= QUEDA.volta) {
        recolher(armadilha); armadilhaFora(agente, false)
        s.j = novoJogador(inicio[0], chaoEm(mundo, inicio[0], inicio[2], inicio[1] + 0.3) ?? inicio[1], inicio[2], yaw)
        s.camYaw = yaw; s.pitch = -0.12; s.pivX = inicio[0]; s.pivZ = inicio[2]; s.pivY = s.j.y
        s.escuro = false; escuroRef.current(false)
        Object.assign(vida, novaVida()) // volta com a vida cheia
        return // o próximo quadro começa em pé, no lugar novo
      }
    }
    const naMao = agente.arma === 'armadilha' && !agente.anim.arma.fora
    const quer = !caido && (acoes.mirar() || acoes.atirar()) && (agente.arma === 'pistola' || agente.arma === 'escopeta' || naMao)
    const clicou = acoes.clicou()
    j.mira = quer
    passoJogador(j, acoes, s.camYaw, mundo, dt)
    // as portas: a mais perto na frente (do corpo ou da câmera); E abre, fecha ou diz por que não
    animarPortas(portas, dt)
    const porta = portaPerto(mundo, j.x, j.y, j.z, [j.yaw, s.camYaw])
    // Q: a próxima arma (pistola, escopeta, armadilha, mão vazia)
    // (a armadilha fora da mão volta na hora: a mão vai segurar outra coisa)
    if (acoes.trocarArma() && !caido) { recolher(armadilha); const i = ARMAS.findIndex(([k]) => k === agente.arma); pegarArma(agente, i + 1 < ARMAS.length ? ARMAS[i + 1][0] : null) }
    if (acoes.interagir() && porta && !caido) { const msg = usarPorta(mundo, portas, porta, j.x, j.z); if (msg) { s.msg = msg; s.msgT = 2.5 } }
    acoes.fimDoQuadro()
    s.msgT -= dt
    const dica = s.msgT > 0 ? s.msg : porta ? dicaDaPorta(porta, portas) : null
    if (dica !== s.dica) { s.dica = dica; dicaRef.current(dica) }
    agente.root.position.set(j.x, j.y, j.z)
    sombra.position.set(j.x, j.y + 0.03, j.z) // o círculo escuro nos pés
    if (quadro.current++ % 4 === 0) { const p: [number, number, number] = [j.x, j.y + 1, j.z]; assa(p, null, p, andarDe(j.y), luzAgente); iluminarObjeto(agente.root, luzAgente) }
    agente.root.rotation.y = j.yaw
    // a arma aponta para o ponto que a câmera mira (de onde a câmera estava no quadro anterior: ela anda depois)
    v.f.set(Math.sin(s.camYaw) * Math.cos(s.pitch), Math.sin(s.pitch), Math.cos(s.camYaw) * Math.cos(s.pitch))
    v.alvo.copy(cam.position).addScaledVector(v.f, CAMERA.alcanceMira)
    // a velocidade no espaço do agente (x para a esquerda dele, z para a frente): mirando, ele anda de lado e de costas
    const vl = Math.hypot(j.vx, j.vz) > 1e-3 ? j.velocidade / Math.hypot(j.vx, j.vz) : 0
    const mover: [number, number] = [(j.vx * Math.cos(j.yaw) - j.vz * Math.sin(j.yaw)) * vl, (j.vx * Math.sin(j.yaw) + j.vz * Math.cos(j.yaw)) * vl]
    animarAgente(agente, { mover, velocidade: j.velocidade, corrida: j.corrida, esquiva: j.esquiva >= 0 ? Math.min(1, j.esquiva / 0.5) : -1, expressao: ver.current.exp, mao: ver.current.mao, mira: { quer, alvo: v.alvo }, queda: caido ? j.caido : undefined, ferido: machucado(vida) }, dt)
    const atira = acoes.atirar() && j.esquiva < 0 && !caido
    gatilho(agente, atira, dt)
    // a armadilha: o arremesso solta ela no meio da animação; fora, um clique chama de volta; voltando, chega na mão
    if (gatilhoArmadilha(agente, atira, dt)) {
      const de = pontoDeSoltar(agente)
      lancar(armadilha, scene, de, velocidadeDoArremesso(de, v.alvo, v.vel)); armadilhaFora(agente, true)
    } else if (clicou && agente.anim.arma.fora && !caido) chamar(armadilha)
    if (passoArmadilha(armadilha, mundo, agente.arms[0].hd.getWorldPosition(v.mao), dt)) armadilhaFora(agente, false)
    // mirando com ela na mão: o arco e onde ela cai
    if (naMao && agente.anim.arma.mira > 0.5 && agente.anim.arma.lanca < 0) { const de = pontoDeSoltar(agente); desenharArco(arco, mundo, de, velocidadeDoArremesso(de, v.alvo, v.vel)) }
    else arco.linha.visible = arco.marca.visible = false
    if (quer !== s.mirando) { s.mirando = quer; miraRef.current(quer) }
    const pv = porcento(vida)
    if (pv !== s.vidaVista) { s.vidaVista = pv; vidaRef.current(pv) }

    // a câmera por cima do ombro direito: o braço encolhe na hora ao bater e estica devagar
    s.altura = amortece(s.altura, j.esquiva >= 0 ? CAMERA.alturaEsquiva : CAMERA.altura, 7, dt)
    s.pivX = amortece(s.pivX, j.x, 16, dt); s.pivZ = amortece(s.pivZ, j.z, 16, dt); s.pivY = amortece(s.pivY, j.y, 12, dt)
    const cp = Math.cos(s.pitch)
    v.f.set(Math.sin(s.camYaw) * cp, Math.sin(s.pitch), Math.cos(s.camYaw) * cp)
    v.r.set(-Math.cos(s.camYaw), 0, Math.sin(s.camYaw))
    // mirando, a câmera chega mais perto, mais de lado e fecha
    s.mira = amortece(s.mira, quer ? 1 : 0, CAMERA.mira.entra, dt)
    const M = CAMERA.mira, mk = s.mira, lado = CAMERA.lado + (M.lado - CAMERA.lado) * mk
    const by = s.pivY + s.altura
    v.de.set(s.pivX, by, s.pivZ).addScaledVector(v.r, lado * 0.45)
    v.para.set(s.pivX, by, s.pivZ).addScaledVector(v.r, lado).addScaledVector(v.f, -(CAMERA.atras + (M.atras - CAMERA.atras) * mk))
    v.para.y += CAMERA.acima + (M.acima - CAMERA.acima) * mk
    const k = alcanceCamera(mundo, v.de, v.para)
    s.k = k < s.k ? k : amortece(s.k, k, 3.2, dt)
    cam.position.lerpVectors(v.de, v.para, Math.max(0.1, s.k - 0.03))
    // não atravessa o chão nem o teto do andar
    const teto = tetoEm(mundo, cam.position.x, cam.position.z, j.y)
    cam.position.y = Math.max(j.y + 0.25, teto !== null ? Math.min(cam.position.y, teto - 0.2) : cam.position.y)
    cam.lookAt(cam.position.x + v.f.x, cam.position.y + v.f.y, cam.position.z + v.f.z)
    const fov = CAMERA.fov + CAMERA.fovCorrendo * j.corrida + (M.fov - CAMERA.fov) * mk
    if (Math.abs(cam.fov - fov) > 0.01) { cam.fov = fov; cam.updateProjectionMatrix() }
  })

  // a luz do jogo: a do lugar onde o agente está (as lâmpadas e o luar das janelas são do mapa)
  return <Iluminacao ambiente={ambiente} areas={areas} em={agente.root.position} />
}
