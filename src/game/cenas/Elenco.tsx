// O elenco dentro do <Canvas>: monta cada ator (o modelo do Blockbench no esqueleto do agente, player/modelo.ts) e, a
// cada quadro, põe ele onde a conta manda (atores.ts), anima o corpo com o mesmo andar do jogo, põe os gestos (gestos.ts), vira a cabeça para
// quem ele olha, mexe a boca enquanto a legenda dele está na tela e pega a luz pintada do lugar. Também anda as portas
// da cena (as folhas abrem e fecham no mapa). Pular no tempo põe todo mundo direto no lugar (a pose assenta na hora).
import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { novaSombraDeChao } from '../corpo/sombraDeChao'
import { animarAgente } from '../player/animacao'
import { montarAgente } from '../player/modelo'
import type { PortasVivas } from '../world/portas'
import { assadorDe, limitarLampadas, novaLuzVertice } from '../../maps/luzAssada'
import type { Chunk } from '../../maps/types'
import { iluminarObjeto } from '../../render/assada'
import { estadoDaPorta, estadoDoAtor, portasDaCena } from './atores'
import { maoDoGesto, novaMemGesto, poseDoGesto } from './gestos'
import type { Relogio } from './TocarCena'
import type { Cena, V3 } from './tipos'

const CABECA = 1.62 // m: a altura da cabeça de um ator, para quem olha para ele
const OLHAR = { lado: 1.2, alto: 0.5, rapidez: 6 } // o máximo que a cabeça vira (rad, de lado e para cima/baixo) e a rapidez
const damp = (a: number, b: number, k: number, dt: number) => a + (b - a) * (1 - Math.exp(-k * dt))
const cl = (v: number, m: number) => Math.max(-m, Math.min(m, v))
const _h = new THREE.Vector3()

/** A boca de quem fala: abre e fecha no ritmo das sílabas (provisório: com a dublagem, vai seguir o volume da voz). */
function boca(t: number, semente: number) {
  const s = 0.5 + 0.5 * Math.sin(t * 13 + semente), frase = 0.55 + 0.45 * Math.sin(t * 4.1 + semente * 2)
  const v = s * frase
  return v < 0.18 ? 0.0001 : 0.25 + 0.65 * v // fechada: a peça some (fica a boca pintada)
}

export function Elenco({ cena, relogio, chunks, portas }: { cena: Cena; relogio: Relogio; chunks: Chunk[]; portas: PortasVivas | null }) {
  const atores = useMemo(() => Object.entries(cena.elenco ?? {}).map(([nome, ator], i) => ({
    nome, a: montarAgente(ator.modelo), sombra: novaSombraDeChao(), luz: novaLuzVertice(), olhar: { lado: 0, alto: 0 }, semente: i * 2.7, mao: new THREE.Vector3(), gesto: novaMemGesto(),
  })), [cena])
  const assa = useMemo(() => assadorDe(chunks), [chunks])
  const ids = useMemo(() => portasDaCena(cena), [cena])
  const antes = useRef(-1), quadro = useRef(0)
  useEffect(() => () => { for (const x of atores) x.a.root.removeFromParent() }, [atores])

  useFrame((_, dtBruto) => {
    const t = relogio.t, salto = antes.current < 0 || Math.abs(t - antes.current) > 0.3 || t < antes.current - 0.01
    antes.current = t
    const dt = Math.min(dtBruto, 0.05) * (relogio.tocando ? relogio.velocidade : 1)
    const luzAgora = salto || quadro.current++ % 6 === 0
    const estados = new Map(atores.map((x) => [x.nome, estadoDoAtor(cena, x.nome, t)]))
    for (const x of atores) {
      const e = estados.get(x.nome)!, a = x.a
      a.root.position.set(...e.pos); a.root.rotation.y = e.yaw
      x.sombra.position.set(e.pos[0], e.pos[1] + 0.03, e.pos[2])
      // o corpo: o andar do jogo (pausado, fica parado); pulou no tempo, a pose assenta em alguns passos de uma vez
      const anim = { velocidade: relogio.tocando ? e.vel : 0, corrida: e.corre ? 1 : 0, esquiva: -1, expressao: e.expressao, mao: maoDoGesto(e), alcanca: e.alcanca ? { ponto: x.mao.set(...e.alcanca.ponto), t: e.alcanca.t } : undefined }
      for (let k = salto ? 20 : 1; k > 0; k--) animarAgente(a, anim, salto ? 1 / 30 : dt)
      // a postura e os gestos (ler a pasta, virar a folha, fechar, bater o dedo): por cima da pose
      poseDoGesto(a, e, x.gesto, dt, salto)
      // a cabeça vira para quem ele olha (por cima da pose: o pescoço leva um pouco, a cabeça o resto)
      let lado = 0, alto = 0
      if (e.olha) {
        const alvo: V3 = typeof e.olha === 'string' ? (() => { const o = estados.get(e.olha)?.pos ?? e.pos; return [o[0], o[1] + CABECA, o[2]] })() : e.olha
        a.root.updateMatrixWorld(true); a.head.getWorldPosition(_h)
        const dx = alvo[0] - _h.x, dy = alvo[1] - _h.y, dz = alvo[2] - _h.z
        lado = cl(Math.atan2(Math.sin(Math.atan2(dx, dz) - e.yaw), Math.cos(Math.atan2(dx, dz) - e.yaw)), OLHAR.lado)
        alto = cl(Math.atan2(dy, Math.hypot(dx, dz)), OLHAR.alto)
      }
      const o = x.olhar
      o.lado = salto ? lado : damp(o.lado, lado, OLHAR.rapidez, dt); o.alto = salto ? alto : damp(o.alto, alto, OLHAR.rapidez, dt)
      a.neck.rotation.y += o.lado * 0.35; a.head.rotation.y += o.lado * 0.65
      a.neck.rotation.x -= o.alto * 0.3; a.head.rotation.x -= o.alto * 0.7
      // a boca de quem está falando
      if (e.fala) a.rosto.boca.scale.set(0.95, boca(t, x.semente), 1)
      // a luz pintada do lugar onde ele está (de tempos em tempos: ele anda devagar)
      if (luzAgora) { const p: V3 = [e.pos[0], e.pos[1] + 1, e.pos[2]]; assa(p, null, p, 0, x.luz); limitarLampadas(x.luz); iluminarObjeto(a.root, x.luz) }
    }
    // as portas da cena
    if (portas) for (const id of ids) { const v = portas.get(id); if (v) { const p = estadoDaPorta(cena, id, t); v.ang = p.ang; v.aberta = p.ang > 0.5; if (p.lado) v.lado = p.lado } }
  })

  return <group>{atores.map((x) => <group key={x.nome}><primitive object={x.a.root} /><primitive object={x.sombra} /></group>)}</group>
}

/** As portas vivas de uma cena: as que ela abre e fecha, com o lado de cada uma do mapa (null se a cena não mexe em porta). */
export function portasVivasDaCena(cena: Cena, chunks: Chunk[]): PortasVivas | null {
  const ids = portasDaCena(cena)
  if (!ids.length) return null
  const v: PortasVivas = new Map()
  for (const c of chunks) for (const o of c.openings) if (ids.includes(o.id)) v.set(o.id, { aberta: false, lado: o.lado ?? 'b', ang: 0 })
  return v
}
