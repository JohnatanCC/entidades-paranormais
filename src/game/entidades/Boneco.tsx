// O boneco da Lara (docs/teste-online.md, etapa 1): um segundo jogador parado, para testar o foco das entidades sem a
// rede. L põe a Lara 2,5 m à frente do agente, virada para ele (ou tira, se já está). Ela entra em fase.jogadores: as
// entidades a veem, caçam e ferem como ao agente. Tem a vida do agente; zerada, cai e levanta cheia no mesmo lugar.
// Não anda nem atira (quem bate nas entidades é o agente: é assim que se vê o foco trocar).
import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { limitarLampadas, novaLuzVertice, type Assador } from '../../maps/luzAssada'
import { iluminarObjeto } from '../../render/assada'
import { novaSombraDeChao } from '../corpo/sombraDeChao'
import { animarAgente } from '../player/animacao'
import { pegarArma } from '../player/arma'
import { tranco } from '../player/dano'
import { montarAgente } from '../player/modelo'
import { QUEDA } from '../player/numeros'
import { machucado, novaVida, passoVida, tomarDano, voltarVida } from '../player/vida'
import type { AgenteNaFase } from '../Testar'
import { andarDe, chaoEm } from '../world/colisao'
import type { Jogador } from './foco'

export function Boneco({ fase, assa }: { fase: AgenteNaFase; assa: Assador }) {
  const scene = useThree((s) => s.scene)
  const lara = useMemo(() => { const a = montarAgente('lara'); pegarArma(a, 'pistola'); return a }, [])
  const sombra = useMemo(() => novaSombraDeChao(), []), luz = useMemo(() => novaLuzVertice(), [])
  const est = useRef({ ativo: false, vida: novaVida(), caido: -1 })
  const jogador = useMemo<Jogador>(() => ({
    nome: 'Lara', p: lara.root.position, lamparina: null,
    pode: () => est.current.ativo && est.current.caido < 0,
    ferir: (dano, de) => {
      const s = est.current
      if (!s.ativo || s.caido >= 0 || !tomarDano(s.vida, dano)) return false
      // o tranco vem de onde o golpe veio (no espaço dela: 0 = de frente)
      const r = lara.root, dx = de.x - r.position.x, dz = de.z - r.position.z, sy = Math.sin(r.rotation.y), cy = Math.cos(r.rotation.y)
      tranco(lara, Math.atan2(dx * cy - dz * sy, dx * sy + dz * cy))
      if (s.vida.atual <= 0) s.caido = 0
      return true
    },
  }), [lara])

  useEffect(() => {
    const tirar = () => {
      const s = est.current
      if (!s.ativo) return
      s.ativo = false; scene.remove(lara.root, sombra)
      const i = fase.jogadores.indexOf(jogador); if (i >= 0) fase.jogadores.splice(i, 1)
    }
    const tecla = (e: KeyboardEvent) => {
      if (e.code !== 'KeyL') return
      const s = est.current
      if (s.ativo) { tirar(); return }
      // 2,5 m à frente do agente, no chão, virada para ele
      const a = fase.agente.root, x = a.position.x + Math.sin(a.rotation.y) * 2.5, z = a.position.z + Math.cos(a.rotation.y) * 2.5
      const y = chaoEm(fase.mundo, x, z, a.position.y + 0.3) ?? a.position.y
      lara.root.position.set(x, y, z); lara.root.rotation.y = Math.atan2(a.position.x - x, a.position.z - z)
      sombra.position.set(x, y + 0.03, z)
      // a luz assada de onde ela está (parada: uma vez)
      const p: [number, number, number] = [x, y + 1, z]
      assa(p, null, p, andarDe(y), luz); limitarLampadas(luz); iluminarObjeto(lara.root, luz)
      voltarVida(s.vida); s.caido = -1; s.ativo = true
      scene.add(lara.root, sombra); fase.jogadores.push(jogador)
    }
    window.addEventListener('keydown', tecla)
    return () => { window.removeEventListener('keydown', tecla); tirar() }
  }, [scene, lara, sombra, luz, fase, jogador, assa])

  useFrame((_, dtBruto) => {
    const s = est.current
    if (!s.ativo) return
    const dt = Math.min(dtBruto, 0.05)
    passoVida(s.vida, dt)
    if (s.caido >= 0 && (s.caido += dt) >= QUEDA.volta) { s.caido = -1; voltarVida(s.vida) } // levanta cheia, no mesmo lugar
    animarAgente(lara, { velocidade: 0, corrida: 0, esquiva: -1, queda: s.caido >= 0 ? s.caido : undefined, ferido: machucado(s.vida) }, dt)
  })
  return null
}
