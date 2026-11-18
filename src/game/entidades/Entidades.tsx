// As entidades do mapa ganham vida no Testar (a aba Entidades do criador de mapas: os pontos kind 'entidade'). Fica
// dentro do <Canvas>, ao lado do agente, e usa o controle dele (AgenteNaFase): fere, e entra na lista do que leva tiro.
//   Gralha: pousada no ponto, a cabeça virando aos trancos; viu o agente (perto e sem nada no meio), levanta voo e caça:
//     rodeia ele por cima e mergulha de tempos em tempos (gralha/ia.ts); morre com tiros (estoura em fumaça e penas).
//     Longe demais, desiste e volta a pousar no lugar dela.
// Enquanto alguém caça, toca a música da perseguição (perseguicao-gralhas); quando para, a música de antes volta.
// O Mestre e a Mãe entram nas próximas etapas.
import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { faixaAtual, musica, type Faixa } from '../../audio/musica'
import { KIND_ENTIDADE } from '../../maps/entidades'
import type { Chunk } from '../../maps/types'
import { animarGralha, estourarGralha, ferir as ferirGralha, pousar } from '../enemies/gralha/animacao'
import { novosEfeitosGralha, passoEfeitosGralha } from '../enemies/gralha/efeitos'
import { novaCacadora, perseguir, type Cacadora } from '../enemies/gralha/ia'
import { montarGralha, type Gralha } from '../enemies/gralha/modelo'
import { ATAQUE } from '../enemies/gralha/numeros'
import { ouvirGralha } from '../enemies/gralha/sons'
import { calar } from '../enemies/sons'
import type { AgenteNaFase } from '../Testar'
import type { Alvejavel } from '../weapons/bala'
import { alcanceCamera } from '../world/colisao'
import { MUSICA, VISTA } from './numeros'

/** Uma Gralha do mapa: onde ela pousa, o modelo, a caçada (null = pousada) e a caixa onde a bala acerta. */
interface GralhaViva { casa: THREE.Vector3; vira: number; g: Gralha; caca: Cacadora | null; alvo: Alvejavel; morta: boolean }

const _olho = new THREE.Vector3(), _peito = new THREE.Vector3(), _c = new THREE.Vector3()

/** Ela vê o agente? Perto e sem parede (nem porta fechada, nem móvel alto) no meio. */
function ve(fase: AgenteNaFase, de: THREE.Vector3, alcance: number) {
  const a = fase.agente.root.position
  if (Math.hypot(a.x - de.x, a.z - de.z) > alcance || Math.abs(a.y - de.y) > 2.5) return false
  _peito.set(a.x, a.y + 1.3, a.z)
  return alcanceCamera(fase.mundo, de, _peito, 0.02) > 0.98
}

export function Entidades({ chunks, fase }: { chunks: Chunk[]; fase: AgenteNaFase }) {
  const scene = useThree((s) => s.scene)
  const pontos = useMemo(() => chunks.flatMap((c) => c.points.filter((p) => p.kind === KIND_ENTIDADE)), [chunks])
  const E = useMemo(() => novosEfeitosGralha(), [])
  // as Gralhas: montadas uma vez, pousadas no lugar delas
  const gralhas = useMemo<GralhaViva[]>(() => pontos.filter((p) => p.params?.tipo === 'gralha').map((p) => {
    const g = montarGralha(), vira = (Number(p.params?.vira ?? 0) * Math.PI) / 180
    g.root.position.set(...p.pos); g.root.rotation.y = vira; pousar(g, true)
    const v: GralhaViva = { casa: new THREE.Vector3(...p.pos), vira, g, caca: null, morta: false, alvo: { c: new THREE.Vector3(), m: new THREE.Vector3(0.3, 0.25, 0.3), acerta: () => {} } }
    v.alvo.acerta = () => {
      if (v.morta) return
      if (ferirGralha(g, E, v.casa.y)) { estourarGralha(g, E, v.casa.y); v.morta = true; calar(g) }
      else if (!v.caca) acordar(v) // atirou nela pousada: ela levanta e caça
    }
    return v
  }), [pontos, E])
  const musicaAntes = useRef<Faixa | null>(null), semCaca = useRef(0), tocando = useRef(false)

  function acordar(v: GralhaViva) {
    pousar(v.g, false)
    v.caca = novaCacadora(v.g, v.g.root.position, _c.set(0, 2.5, 0), Math.random() * Math.PI * 2)
  }

  // tudo entra na cena; saindo do Testar, sai, cala e a música volta
  useEffect(() => {
    scene.add(E.grupo); for (const v of gralhas) scene.add(v.g.root)
    return () => {
      scene.remove(E.grupo); for (const v of gralhas) { scene.remove(v.g.root); calar(v.g) }
      const i = new Set(gralhas.map((v) => v.alvo)), lista = fase.alvos
      for (let k = lista.length - 1; k >= 0; k--) if (i.has(lista[k])) lista.splice(k, 1)
      if (tocando.current) musica(musicaAntes.current)
    }
  }, [scene, E, gralhas, fase])

  useFrame((_, dtBruto) => {
    const dt = Math.min(dtBruto, 0.05), agente = fase.agente.root.position
    let cacando = false
    for (const v of gralhas) {
      if (v.morta) continue
      const g = v.g, r = g.root
      if (!v.caca) {
        // pousada: olha em volta; viu o agente, levanta voo
        g.corpo.getWorldPosition(_olho)
        if (ve(fase, _olho, VISTA.gralha)) acordar(v)
      } else {
        cacando = true
        perseguir(v.caca, agente, dt)
        // longe demais (ou o agente sumiu), volta para casa e pousa
        if (Math.hypot(agente.x - r.position.x, agente.z - r.position.z) > VISTA.larga || !fase.pode()) {
          r.position.lerp(v.casa, 1 - Math.exp(-1.5 * dt))
          if (r.position.distanceTo(v.casa) < 0.3) { v.caca = null; r.position.copy(v.casa); r.rotation.y = v.vira; pousar(g, true) }
        }
      }
      // a bicada: pega quem estiver perto do bico (o peito do agente)
      if (animarGralha(g, dt) && fase.pode()) {
        g.bico.getWorldPosition(_c)
        if (_c.distanceTo(_peito.set(agente.x, agente.y + ATAQUE.altura, agente.z)) < ATAQUE.alcance + 0.5) fase.ferir(ATAQUE.dano, _c)
      }
      ouvirGralha(g, dt, !!v.caca)
    }
    passoEfeitosGralha(E, dt)
    // o que leva tiro: as vivas (a caixa anda com o corpo)
    const lista = fase.alvos
    for (const v of gralhas) {
      const i = lista.indexOf(v.alvo)
      if (v.morta) { if (i >= 0) lista.splice(i, 1); continue }
      v.g.corpo.getWorldPosition(v.alvo.c)
      if (i < 0) lista.push(v.alvo)
    }
    // a música da perseguição: entra quando alguém caça e segura um pouco depois que todos param
    if (cacando) {
      semCaca.current = 0
      if (!tocando.current) { musicaAntes.current = faixaAtual(); musica('perseguicao-gralhas'); tocando.current = true }
    } else if (tocando.current && (semCaca.current += dt) > MUSICA.segura) { musica(musicaAntes.current); tocando.current = false }
  })
  return null
}
