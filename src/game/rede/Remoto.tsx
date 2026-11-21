// O outro jogador no teste online (docs/teste-online.md): o corpo dele, montado aqui e movido pelas poses que chegam
// pela rede (20/s). Entre uma pose e outra ele desliza até a última (amortecido: sem trancos), e o corpo é animado aqui
// mesmo com o que a pose diz (andar, correr, esquivar, mirar, cair, a mão na maçaneta); os passos e o tiro soam no
// lugar dele. A bala dele aparece aqui também (só a imagem: quem decide o acerto é o host).
// Ele entra em fase.jogadores: no host, as entidades o veem, caçam e ferem (a ferida vai para ele pela rede).
// A lamparina dele não acende aqui (a luz da lamparina é uma só no jogo, a do jogador local): o feixe dele conta para o
// Mestre pela pose (lamp = erguida).
import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { limitarLampadas, novaLuzVertice, type Assador } from '../../maps/luzAssada'
import { iluminarObjeto } from '../../render/assada'
import { novaSombraDeChao } from '../corpo/sombraDeChao'
import type { Jogador } from '../entidades/foco'
import { animarAgente, type EstadoAnim } from '../player/animacao'
import { pegarArma } from '../player/arma'
import { montarAgente, type ModeloAgente } from '../player/modelo'
import { AGENTE } from '../player/numeros'
import { ouvirAgente } from '../player/sons'
import type { AgenteNaFase } from '../Testar'
import { atirar, novasBalas, passoBalas } from '../weapons/bala'
import { novosImpactos, passoImpactos } from '../weapons/impacto'
import { somDaBala } from '../weapons/sons'
import { TIRO } from '../weapons/numeros'
import { gatilho } from '../weapons/tiro'
import { andarDe } from '../world/colisao'
import type { Conexao } from './conexao'
import { v3, type Pose } from './mensagens'

const SEGUE = 14 // o quanto ele corre atrás da última pose (1/s): mais = mais preso à rede, menos = mais macio

const amortece = (de: number, para: number, k: number, dt: number) => de + (para - de) * (1 - Math.exp(-k * dt))
const angulo = (de: number, para: number, k: number, dt: number) => de + Math.atan2(Math.sin(para - de), Math.cos(para - de)) * (1 - Math.exp(-k * dt))

export function Remoto({ con, modelo, nome, fase, assa }: { con: Conexao; modelo: ModeloAgente; nome: string; fase: AgenteNaFase; assa: Assador }) {
  const scene = useThree((s) => s.scene)
  const a = useMemo(() => { const x = montarAgente(modelo); pegarArma(x, 'pistola'); return x }, [modelo])
  const sombra = useMemo(() => novaSombraDeChao(), []), luz = useMemo(() => novaLuzVertice(), [])
  const balas = useMemo(() => novasBalas(), []), impactos = useMemo(() => novosImpactos(), [])
  const est = useRef({ pose: null as Pose | null, yaw: 0, quadro: 0, ferido: -9, tiro: false })
  const v = useMemo(() => ({ alvo: new THREE.Vector3(), mao: new THREE.Vector3(), de: new THREE.Vector3(), para: new THREE.Vector3() }), [])
  const jogador = useMemo<Jogador>(() => ({
    nome, p: a.root.position, lamparina: { ergue: 0, pos: new THREE.Vector3(), dir: new THREE.Vector3(0, 0, 1) },
    pode: () => { const P = est.current.pose; return !!P && P.queda < 0 },
    // a ferida vai para ele (lá, a cambalhota ainda escapa); aqui só o tempo invulnerável, para não mandar uma por quadro
    ferir: (dano, de) => {
      const agora = performance.now() / 1000
      if (agora - est.current.ferido < AGENTE.invulneravel) return false
      est.current.ferido = agora
      con.enviar({ t: 'ferido', dano, de: v3(de) })
      return true
    },
  }), [a, con, nome])

  useEffect(() => {
    scene.add(a.root, sombra, balas.grupo, impactos.grupo)
    const entra = () => { if (!fase.jogadores.includes(jogador)) fase.jogadores.push(jogador) }
    a.root.visible = sombra.visible = !!est.current.pose // até a primeira pose, escondido
    if (est.current.pose) entra()
    const paraPose = con.ouvir('pose', (m) => {
      const s = est.current
      if (!s.pose) { a.root.position.set(...m.p); s.yaw = m.yaw; a.root.visible = sombra.visible = true } // a primeira: aparece onde está
      s.pose = m
      entra()
    })
    const paraTiro = con.ouvir('tiro', (m) => {
      atirar(balas, m.arma, v.de.set(...m.de), v.para.set(...m.para))
      est.current.tiro = true // o coice, o clarão e o som saem no próximo quadro
    })
    return () => {
      paraPose(); paraTiro()
      scene.remove(a.root, sombra, balas.grupo, impactos.grupo)
      const i = fase.jogadores.indexOf(jogador); if (i >= 0) fase.jogadores.splice(i, 1)
    }
  }, [scene, a, sombra, balas, impactos, con, fase, jogador, v])

  useFrame((_, dtBruto) => {
    const s = est.current, P = s.pose
    const dt = Math.min(dtBruto, 0.05)
    passoBalas(balas, dt, fase.mundo, [], impactos, (p, arma, alvo) => somDaBala(p, arma, alvo, s.quadro))
    passoImpactos(impactos, dt)
    if (!P) return
    const r = a.root.position
    r.x = amortece(r.x, P.p[0], SEGUE, dt); r.y = amortece(r.y, P.p[1], SEGUE, dt); r.z = amortece(r.z, P.p[2], SEGUE, dt)
    s.yaw = angulo(s.yaw, P.yaw, SEGUE, dt)
    a.root.rotation.y = s.yaw
    sombra.position.set(r.x, r.y + 0.03, r.z)
    if (P.arma && a.arma !== P.arma) pegarArma(a, P.arma)
    if (s.quadro++ % 4 === 0) { const p: [number, number, number] = [r.x, r.y + 1, r.z]; assa(p, null, p, andarDe(r.y), luz); limitarLampadas(luz); iluminarObjeto(a.root, luz) }
    v.alvo.set(...P.alvo)
    const ea: EstadoAnim = {
      velocidade: P.vel, corrida: P.cor, esquiva: P.esq, mover: P.mov, mira: { quer: !!P.mira, alvo: v.alvo },
      queda: P.queda >= 0 ? P.queda : undefined, ferido: !!P.fer, lamparina: !!P.lamp,
      alcanca: P.alc ? { ponto: v.mao.set(P.alc[0], P.alc[1], P.alc[2]), t: P.alc[3] } : undefined,
    }
    animarAgente(a, ea, dt)
    if (s.tiro) { s.tiro = false; const A = a.anim.arma; A.cd = 0; A.mira = Math.max(A.mira, TIRO.pronto); gatilho(a, true, 0) } // o coice e o clarão do tiro que chegou
    ouvirAgente(a, ea, 'madeira')
    // o feixe da lamparina dele, para o Mestre: do peito para a frente
    const L = jogador.lamparina!, fy = Math.sin(s.yaw), fz = Math.cos(s.yaw)
    L.ergue = P.lamp; L.dir.set(fy, 0, fz); L.pos.set(r.x + fy * 0.4, r.y + 1.4, r.z + fz * 0.4)
  })
  return null
}
