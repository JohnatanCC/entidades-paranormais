// O Testar do criador de mapas: o agente andando no mapa aberto, com a câmera por cima do ombro, colisão, escadas e
// as lâmpadas acesas, a luz do lugar (a ambientação de cada área do mapa: game/luz) e a arma na mão (começa com a pistola,
// nunca de mão vazia; Q troca entre ela e a escopeta): mira e atira (o coice e o clarão),
// a escopeta gasta as 4 balas e recarrega, a pistola esquenta e trava (weapons/municao.ts), a bala voa e acerta
// (weapons/bala.ts); a vida, os kits e a arma vão para o HUD (game/hud: onHud, a cada quadro). Fica dentro do <Canvas>.
//   clique trava o mouse · WASD anda · Shift corre · Espaço esquiva · E abre e fecha porta · Q troca a arma · R recarrega · mouse olha
//   botão direito mira · botão esquerdo atira · Esc volta ao editor
//   (a armadilha saiu da troca, 12/nov: o jogar e o chamar de volta continuam aqui, esperando a ação própria dela)
//   para ver o modelo (só no Testar, não é controle do jogo): 1–6 expressões, 7–9 poses da mão, 0 volta ao automático,
//   K cai (a queda: a tela escurece e ele volta no começo do teste, que por enquanto é o checkpoint), J toma 25 de dano
//   de uma direção sorteada (30% ou menos, machucado; zerou, cai) · F usa um kit (+60; zerado, nasce um a cada 1:30)
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
import { armadilhaFora, pegarArma, proximaArma } from './player/arma'
import { novoJogador, passoJogador } from './player/controle'
import type { PoseMao } from './player/maos'
import { montarAgente, type Agente } from './player/modelo'
import type { Expressao } from './player/rosto'
import { AGENTE, CAMERA, QUEDA } from './player/numeros'
import { tranco } from './player/dano'
import { ganharKit, machucado, novaVida, passoVida, tomarDano, usarKit, voltarVida } from './player/vida'
import { novoEstadoHud, type EstadoHud } from './hud/Hud'
import { ouvirAgente, somDoKit } from './player/sons'
import { somDaBala } from './weapons/sons'
import { passoGolpes } from '../render/golpe'
import { chamar, descartarArco, desenharArco, gatilhoArmadilha, lancar, novaArmadilha, novoArco, passoArmadilha, pontoDeSoltar, recolher, velocidadeDoArremesso } from './weapons/armadilha'
import { gatilho } from './weapons/tiro'
import { atirar, novasBalas, passoBalas, pontoMirado, type Alvejavel } from './weapons/bala'
import { novosImpactos, passoImpactos } from './weapons/impacto'
import { grupoDaArma } from './player/arma'
import { cortarRecarga, gastar, novaMunicao, passoMunicao, recarregar, temTiro } from './weapons/municao'
import { alcanceCamera, andarDe, chaoEm, montarMundo, tetoEm, type Mundo } from './world/colisao'
import { assadorDe, novaLuzVertice } from '../maps/luzAssada'
import { iluminarObjeto } from '../render/assada'
import { animarPortas, dicaDaPorta, novasPortas, portaPerto, usarPorta, type PortasVivas } from './world/portas'

interface Props {
  chunks: Record<string, Chunk>
  levels: number
  ambiente: string // a ambientação padrão do mapa
  semChao?: boolean // o térreo só tem chão onde há piso (o submundo): a beirada segura o agente
  areas: AreaAmbiente[] // as áreas com outra ambientação
  inicio: [number, number, number] // onde o agente aparece (x, y, z)
  yaw: number // para onde a câmera começa olhando
  portas: PortasVivas // o estado vivo das portas (este componente preenche; a vista do mapa desenha a partir dele)
  onTravado: (travado: boolean) => void // o mouse travou (jogando) ou soltou
  onDica: (texto: string | null) => void // a linha de ação na tela ("E · abrir a porta", "Trancada.")
  onMira: (mirando: boolean) => void // mirando: a tela mostra o ponto da mira
  onEscuro: (escuro: boolean) => void // a queda: a tela escurece (e clareia quando ele volta)
  onHud: (e: EstadoHud) => void // a cada quadro: a vida, o fôlego, os kits e a arma (o HUD só muda o que mudou)
  onSair: () => void
  aoMontar?: (c: AgenteNaFase) => void // quem conduz a fase (o roteiro da Demo · Intro) recebe o controle do agente
}

/** O que quem conduz a fase (o roteiro) pode fazer com o agente: os inimigos ferem por aqui. */
export interface AgenteNaFase {
  agente: Agente; mundo: Mundo
  /** de pé e fora da barriga do Devora (os inimigos só atacam quem pode levar o golpe) */
  pode: () => boolean
  /** um golpe vindo de `de` (no mundo): tira a vida, o tranco vem do lado certo; na cambalhota (o trecho invulnerável)
   *  e nos 0,9 s depois de um golpe não pega. sempre = pega de qualquer jeito, sem tranco (dentro do Devora, 20/s) */
  ferir: (dano: number, de: THREE.Vector3, sempre?: boolean) => boolean
  /** engolido: some, não se mexe e a tela escurece, até ser cuspido */
  engolir: () => void
  /** cuspido em `onde` (no chão), jogado para longe de `de` */
  cuspir: (onde: THREE.Vector3, de: THREE.Vector3) => void
  /** mais lento: `quanto` (0..1), sumindo em `dura` s (a gosma) */
  lentidao: (quanto: number, dura: number) => void
  /** ganhou kits médicos (a onda limpa) */
  darKit: (n: number) => void
  /** onde ele volta depois de cair (o começo da arena) */
  pontoDeVolta: (x: number, z: number, yaw: number) => void
  /** chamado quando ele volta depois de cair (o roteiro recomeça a onda) */
  aoVoltar: (() => void) | null
  /** o que pode levar tiro agora (o roteiro põe os demônios aqui, a cada quadro): as balas acertam e chamam quem foi */
  alvos: Alvejavel[]
}

// as teclas de ver o modelo: 1–6 forçam uma expressão, 7–9 uma pose das mãos, 0 solta as duas
const VER_EXP: Expressao[] = ['neutra', 'esforco', 'medo', 'dor', 'raiva', 'surpresa']
const VER_MAO: PoseMao[] = ['punho', 'aberta', 'apontar']

const amortece = (de: number, para: number, k: number, dt: number) => de + (para - de) * (1 - Math.exp(-k * dt))

export function Testar({ chunks, levels, ambiente, semChao, areas, inicio, yaw, portas, onTravado, onDica, onMira, onEscuro, onHud, onSair, aoMontar }: Props) {
  const { camera, gl, scene } = useThree()
  const { sensibilidade } = useSettings()
  // o mundo (colisão) e as portas como o mapa diz que começam
  const mundo = useMemo(() => {
    const m = montarMundo(Object.values(chunks), levels, semChao)
    portas.clear(); novasPortas(m).forEach((v, k) => portas.set(k, v))
    return m
  }, [chunks, levels, portas, semChao])
  // o agente já com a pistola na mão
  const agente = useMemo(() => { const a = montarAgente(); pegarArma(a, 'pistola'); return a }, []), sombra = useMemo(() => novaSombraDeChao(), [])

  // a luz assada de onde o agente está (as lâmpadas sem sombra e as janelas), tirada de novo a cada poucos quadros
  const assa = useMemo(() => assadorDe(Object.values(chunks)), [chunks]), luzAgente = useMemo(() => novaLuzVertice(), []), quadro = useRef(0)
  const acoes = useMemo(() => new Acoes(), [])
  const armadilha = useMemo(() => novaArmadilha(), []), arco = useMemo(() => novoArco(), [])
  const balas = useMemo(() => novasBalas(), []), impactos = useMemo(() => novosImpactos(), []) // a bala e o que ela deixa onde bate
  const est = useRef({
    j: novoJogador(inicio[0], chaoEm(mundo, inicio[0], inicio[2], inicio[1] + 0.3) ?? inicio[1], inicio[2], yaw),
    camYaw: yaw, pitch: -0.12, k: 1, pivX: inicio[0], pivZ: inicio[2], pivY: inicio[1], altura: CAMERA.altura, travou: false,
    msg: '', msgT: 0, dica: null as string | null, mira: 0, mirando: false, escuro: false, cair: false, golpe: false,
    volta: { x: inicio[0], y: inicio[1], z: inicio[2], yaw }, // onde ele volta depois de cair (o roteiro muda: o começo da arena)
    lento: { quanto: 0, t: 0, dura: 1 }, // a gosma: o quanto e quanto falta para sumir
  })
  const sairRef = useRef(onSair); sairRef.current = onSair
  const travRef = useRef(onTravado); travRef.current = onTravado
  const dicaRef = useRef(onDica); dicaRef.current = onDica
  const miraRef = useRef(onMira); miraRef.current = onMira
  const escuroRef = useRef(onEscuro); escuroRef.current = onEscuro
  const hudRef = useRef(onHud); hudRef.current = onHud
  const hud = useMemo(() => novoEstadoHud(), [])
  const vida = useMemo(() => novaVida(), []), municao = useMemo(() => novaMunicao(), [])
  // o controle do agente para o roteiro da fase (os inimigos ferem, o Devora engole e cospe, a gosma deixa lento)
  const naFase = useMemo<AgenteNaFase>(() => {
    const preso = (sim: boolean) => { const s = est.current; s.j.preso = sim; agente.root.visible = !sim; sombra.visible = !sim; if (s.escuro !== sim) { s.escuro = sim; escuroRef.current(sim) } }
    return {
      agente, mundo, aoVoltar: null, alvos: [],
      pode: () => est.current.j.caido < 0 && !est.current.j.preso,
      ferir: (dano, de, sempre = false) => {
        const s = est.current, j = s.j, E = AGENTE.esquiva.invul
        if (j.caido >= 0 || vida.atual <= 0) return false
        if (!sempre && j.esquiva >= E[0] && j.esquiva <= E[1]) return false // a cambalhota escapa
        if (sempre) vida.atual = Math.max(0, vida.atual - dano)
        else if (tomarDano(vida, dano)) { // o tranco vem de onde o golpe veio (no espaço dele: 0 = de frente, π/2 = da esquerda)
          const dx = de.x - j.x, dz = de.z - j.z, sy = Math.sin(j.yaw), cy = Math.cos(j.yaw)
          tranco(agente, Math.atan2(dx * cy - dz * sy, dx * sy + dz * cy))
        } else return false
        if (vida.atual <= 0) s.cair = true
        return true
      },
      engolir: () => preso(true),
      cuspir: (onde, de) => {
        const j = est.current.j
        if (j.caido >= 0) return // caiu lá dentro: cai onde está
        j.x = onde.x; j.z = onde.z; j.y = chaoEm(mundo, onde.x, onde.z, onde.y + 0.3) ?? onde.y; j.vx = j.vz = 0
        j.yaw = Math.atan2(de.x - j.x, de.z - j.z) // olhando para ele
        preso(false); tranco(agente, 0)
      },
      darKit: (n) => ganharKit(vida, n),
      lentidao: (quanto, dura) => { const L = est.current.lento; if (quanto >= L.quanto * (L.t / L.dura)) Object.assign(L, { quanto, t: dura, dura }) },
      pontoDeVolta: (x, z, yaw) => { est.current.volta = { x, y: chaoEm(mundo, x, z, 0.3) ?? 0, z, yaw } },
    }
  }, [agente, mundo, sombra, vida])
  const montou = useRef(aoMontar); montou.current = aoMontar
  useEffect(() => { montou.current?.(naFase) }, [naFase])
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
    ganchos.cena = scene; ganchos.gl = gl; ganchos.fase = naFase
    return () => { delete ganchos.ir; delete ganchos.cena; delete ganchos.gl; delete ganchos.fase }
  }, [mundo, scene, gl, naFase])

  // o agente na cena, a entrada ligada, o mouse travado com um clique; Esc (ou soltar o mouse) volta ao editor
  useEffect(() => {
    const el = gl.domElement
    scene.add(agente.root, sombra, arco.linha, arco.marca, balas.grupo, impactos.grupo)
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
      scene.remove(agente.root, sombra, balas.grupo, impactos.grupo)
      descartarArco(arco); recolher(armadilha)
      acoes.desligar()
      el.removeEventListener('click', clique)
      document.removeEventListener('pointerlockchange', trava)
      window.removeEventListener('keydown', esc)
      if (document.pointerLockElement === el) document.exitPointerLock()
      const c = camera as THREE.PerspectiveCamera
      c.fov = 50; c.updateProjectionMatrix() // o campo de visão do editor
    }
  }, [gl, scene, agente, sombra, acoes, camera, armadilha, arco, balas, impactos])

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
    if (acoes.kit() && j.caido < 0 && usarKit(vida)) somDoKit()
    if (s.cair && j.caido < 0) { j.caido = 0; if (j.preso) { j.preso = false; agente.root.visible = sombra.visible = true } } // cai onde está (até dentro do Devora)
    s.cair = false
    // a gosma: o quanto ele está lento agora (some aos poucos)
    const L = s.lento
    L.t = Math.max(0, L.t - dt); j.lento = L.quanto * (L.t / L.dura)
    const caido = j.caido >= 0
    if (caido) {
      j.caido += dt
      if (j.caido >= QUEDA.escurece && !s.escuro) { s.escuro = true; escuroRef.current(true) }
      if (j.caido >= QUEDA.volta) {
        recolher(armadilha); armadilhaFora(agente, false)
        const V = s.volta // o ponto de volta (o começo do teste; numa fase, o começo da arena)
        s.j = novoJogador(V.x, chaoEm(mundo, V.x, V.z, V.y + 0.3) ?? V.y, V.z, V.yaw)
        s.camYaw = V.yaw; s.pitch = -0.12; s.pivX = V.x; s.pivZ = V.z; s.pivY = s.j.y
        s.escuro = false; escuroRef.current(false); s.lento.t = 0
        voltarVida(vida); Object.assign(municao, novaMunicao()) // volta com a vida e a munição cheias (e os kits do começo)
        naFase.aoVoltar?.()
        return // o próximo quadro começa em pé, no lugar novo
      }
    }
    const naMao = agente.arma === 'armadilha' && !agente.anim.arma.fora
    const quer = !caido && !j.preso && (acoes.mirar() || acoes.atirar()) && (agente.arma === 'pistola' || agente.arma === 'escopeta' || naMao)
    const clicou = acoes.clicou(), recarrega = acoes.recarregar()
    j.mira = quer
    passoJogador(j, acoes, s.camYaw, mundo, dt)
    // as portas: a mais perto na frente (do corpo ou da câmera); E abre, fecha ou diz por que não
    animarPortas(portas, dt)
    const porta = portaPerto(mundo, j.x, j.y, j.z, [j.yaw, s.camYaw])
    // Q: a outra arma (pistola e escopeta; a mão nunca fica vazia)
    // (trocar corta a recarga: municao.ts, com a outra arma na mão)
    if (acoes.trocarArma() && !caido) { recolher(armadilha); pegarArma(agente, proximaArma(agente.arma)) }
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
    pontoMirado(mundo, naFase.alvos, cam.position, v.f, v.alvo, CAMERA.alcanceMira) // o que está embaixo da mira (a bala vai para lá)
    // a velocidade no espaço do agente (x para a esquerda dele, z para a frente): mirando, ele anda de lado e de costas
    const vl = Math.hypot(j.vx, j.vz) > 1e-3 ? j.velocidade / Math.hypot(j.vx, j.vz) : 0
    const mover: [number, number] = [(j.vx * Math.cos(j.yaw) - j.vz * Math.sin(j.yaw)) * vl, (j.vx * Math.sin(j.yaw) + j.vz * Math.cos(j.yaw)) * vl]
    // a munição: R recarrega a escopeta, atirar vazia também; um clique novo com bala corta a recarga (segurando o
    // gatilho, ela continua); esquivar e cair cortam
    const atira = acoes.atirar() && j.esquiva < 0 && !caido && !j.preso
    if (agente.arma === 'escopeta' && !caido && (recarrega || (atira && municao.balas === 0))) recarregar(municao)
    else if (agente.arma === 'escopeta' && atira && clicou && municao.balas > 0) cortarRecarga(municao)
    passoMunicao(municao, agente.arma, j.esquiva < 0 && !caido, dt)
    const ea = { mover, velocidade: j.velocidade, corrida: j.corrida, esquiva: j.esquiva >= 0 ? Math.min(1, j.esquiva / 0.5) : -1, expressao: ver.current.exp, mao: ver.current.mao, mira: { quer, alvo: v.alvo }, queda: caido ? j.caido : undefined, ferido: machucado(vida), municao }
    animarAgente(agente, ea, dt)
    if (gatilho(agente, atira && temTiro(municao, agente.arma), dt)) {
      gastar(municao, agente.arma)
      // a bala sai do cano (onde o clarão está) para o ponto que a câmera mira
      const clarao = grupoDaArma(agente)?.userData.clarao as THREE.Object3D | undefined
      if (clarao && (agente.arma === 'pistola' || agente.arma === 'escopeta')) { agente.root.updateMatrixWorld(true); atirar(balas, agente.arma, clarao.getWorldPosition(v.de), v.alvo) }
    }
    passoBalas(balas, dt, mundo, naFase.alvos, impactos, (p, arma, alvo) => somDaBala(p, arma, alvo, quadro.current))
    // os sons dele e das armas, no momento da animação (o chão: o submundo é pedra; o resto, por enquanto, madeira)
    ouvirAgente(agente, ea, semChao ? 'pedra' : 'madeira', armadilha.estado, armadilha.pos)
    passoImpactos(impactos, dt)
    passoGolpes(dt) // o brilho de quem levou golpe (o agente e os demônios da fase) apaga
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
    // o HUD: o que ele mostra (ele só mexe na tela no que mudou)
    hud.vida = vida.atual / AGENTE.vida; hud.folego = s.j.folego / AGENTE.folego; hud.folegoTravado = s.j.folegoTravado
    hud.kits = vida.kits; hud.novoKit = vida.novoKit; hud.arma = agente.arma
    hud.calor = municao.calor; hud.travada = municao.travada; hud.balas = municao.balas; hud.recarregando = municao.recarga >= 0
    hudRef.current(hud)

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
