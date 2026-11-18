// O tocador das cenas dentro do <Canvas>: a cada quadro anda o relógio (se estiver tocando), põe a câmera onde o plano
// manda (com uma tremida leve de mão), toca os sons que passaram e entrega o estado para a moldura (Moldura.tsx: as
// faixas, o preto, a legenda, o título). Quem monta a cena põe o cenário (o mapa) e a <Iluminacao> com `onde`.
// Os sons vão por um canal só da cena: pausar ou pular para outro ponto cala o que estava tocando. As falas são lidas
// em voz (vozes.ts, provisória) quando a legenda começa.
import { useEffect, useRef, type MutableRefObject } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { som } from '../../audio/sintese'
import { calarVozes, falar } from './vozes'
import { duracao, estadoEm, inicios, type EstadoCena } from './tocador'
import type { Cena } from './tipos'

/** O relógio da cena: quem controla (o Ver cenas, o jogo) muda; o tocador anda com ele. saltou = mudaram o tempo à mão
 *  (não toca os sons do pedaço pulado). */
export interface Relogio { t: number; tocando: boolean; velocidade: number; saltou: boolean }
export const novoRelogio = (): Relogio => ({ t: 0, tocando: false, velocidade: 1, saltou: true })

const TREME = { pos: 0.007, olha: 0.012 } // m: a tremida de mão (a câmera e o ponto para onde olha)

export function TocarCena({ cena, relogio, onde, painel, aoAcabar }: {
  cena: Cena
  relogio: Relogio
  onde: THREE.Vector3 // a câmera, para a iluminação saber a ambientação de onde ela está
  painel: MutableRefObject<((e: EstadoCena) => void) | null>
  aoAcabar?: () => void
}) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const antes = useRef(relogio.t), canal = useRef<GainNode | null>(null), acabou = useRef(false), falou = useRef(false)
  const _o = useRef(new THREE.Vector3()).current

  // o canal dos sons: some (o que estava tocando para) e na próxima vez nasce outro
  const calar = () => {
    const c = canal.current, s = som()
    if (c && s) { c.gain.setTargetAtTime(0, s.ctx.currentTime, 0.04); setTimeout(() => c.disconnect(), 400) }
    canal.current = null
    if (falou.current) { calarVozes(); falou.current = false }
  }
  useEffect(() => () => calar(), [])

  useFrame((_, dtBruto) => {
    const R = relogio, total = duracao(cena), dt = Math.min(dtBruto, 0.1)
    if (R.tocando) R.t = Math.min(total, R.t + dt * R.velocidade)
    if (R.t >= total && R.tocando) { R.tocando = false; if (!acabou.current) { acabou.current = true; aoAcabar?.() } }
    if (R.t < total) acabou.current = false
    const e = estadoEm(cena, R.t)
    // a câmera, com a tremida de mão (senos que não se repetem juntos)
    const t = R.t, a = e.treme
    camera.position.set(e.pos[0] + a * TREME.pos * (Math.sin(t * 1.3) + 0.5 * Math.sin(t * 3.1)), e.pos[1] + a * TREME.pos * (Math.sin(t * 1.7 + 2) + 0.4 * Math.sin(t * 2.7)), e.pos[2] + a * TREME.pos * Math.sin(t * 1.1 + 4))
    _o.set(e.olha[0] + a * TREME.olha * Math.sin(t * 0.9 + 1), e.olha[1] + a * TREME.olha * Math.sin(t * 1.2 + 3), e.olha[2])
    camera.lookAt(_o)
    if (camera.fov !== e.lente) { camera.fov = e.lente; camera.updateProjectionMatrix() }
    onde.copy(camera.position)
    // os sons: só tocando para a frente, sem salto; pausar ou pular cala o canal
    if (!R.tocando || R.saltou) calar()
    else if (R.t > antes.current) tocarSons(antes.current, R.t)
    R.saltou = false; antes.current = R.t
    painel.current?.(e)
  })

  function tocarSons(de: number, ate: number) {
    const ini = inicios(cena)
    // as falas, em voz, quando a legenda começa
    cena.planos.forEach((p, i) => {
      for (const f of p.falas ?? []) { const quando = ini[i] + f.t; if (quando > de && quando <= ate) { falar(f.quem, f.texto, relogio.velocidade); falou.current = true } }
    })
    const s = som()
    if (!s) return
    cena.planos.forEach((p, i) => {
      for (const x of p.sons ?? []) {
        const quando = ini[i] + x.t
        if (quando > de && quando <= ate) {
          if (!canal.current) { const c = s.ctx.createGain(); c.connect(s.saida); canal.current = c }
          x.tocar(s, s.ctx.currentTime + 0.01, canal.current)
        }
      }
    })
  }
  return null
}
