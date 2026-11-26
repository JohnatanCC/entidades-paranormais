// O roteiro da Demo · Inimigos (Novo jogo → Demo · Inimigos), dentro do <Canvas> da fase (screens/Jogo.tsx), ao lado
// do agente (o Testar). A arena é o salão da mansão (maps/demo-inimigos: alto, com uma coluna em cada canto) e a luta é
// por hordas fixas de espectrais, cada vez mais fortes:
//   o aviso ("Horda 2 de 6") → os espectrais surgem um depois do outro, nos pontos longe do agente (a Sombra sobe do
//   chão, a Asa rompe o chão e sobe, o Manto espectral, o Devora espectros e o Asa do terror aparecem; game/entidades/Espectrais.tsx, pelo fase.espectrais) →
//   limpou (os fantasmas grandes contam até ser capturados com a lamparina), ganha um kit e vem a pausa → a próxima. Vencida a última,
//   a demo acaba. Caindo, o agente volta no começo e a horda recomeça do zero.
// A primeira horda espera o clique para jogar. A tecla H (de teste) destrói a horda. A música de batalha toca durante as hordas. Os números em numeros.ts.
import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { musica } from '../../audio/musica'
import type { TextoRoteiro } from '../intro/Roteiro'
import type { AgenteNaFase } from '../../game/Testar'
import { KITS } from '../../game/player/numeros'
import type { Chunk } from '../../maps/types'
import { HORDAS, NASCER, TEMPO, VOLTA } from './numeros'

type Etapa = 'comeca' | 'onda' | 'entre' | 'fim'
type Tipo = 'sombra' | 'asa' | 'manto' | 'devora' | 'terror'
const DICA_H = 'H · destrói a horda (teste)'

export function Roteiro({ jogo, aoTexto }: { chunks: Record<string, Chunk>; jogo: { current: AgenteNaFase | null }; aoTexto: (t: TextoRoteiro | null) => void }) {
  // a etapa, a horda (0..), o relógio da etapa, a fila do que ainda vai surgir (em = s desde o começo da horda), se já
  // ligou o controle do agente e a última linha mostrada (só avisa a tela quando muda)
  const R = useRef({ etapa: 'comeca' as Etapa, horda: 0, t: TEMPO.comeca, tempo: 0, fila: [] as { tipo: Tipo; p: THREE.Vector3; em: number; forte?: boolean }[], ligado: false, destroi: false, texto: '', jogando: false })
  const avisa = useRef(aoTexto); avisa.current = aoTexto

  useEffect(() => {
    const tecla = (e: KeyboardEvent) => { if (e.code === 'KeyH') R.current.destroi = true }
    // a primeira horda espera o clique para jogar (o mouse travado)
    const trava = () => { if (document.pointerLockElement) R.current.jogando = true }
    window.addEventListener('keydown', tecla); document.addEventListener('pointerlockchange', trava)
    return () => { window.removeEventListener('keydown', tecla); document.removeEventListener('pointerlockchange', trava); jogo.current?.espectrais?.limpar(); musica(null) }
  }, [jogo])

  /** Põe a horda na fila: cada espectral num ponto longe do agente (os grandes nos mais longe), um depois do outro. */
  function encher(n: number, ag: THREE.Vector3) {
    const H = HORDAS[n], lista: Tipo[] = [...Array(H.devora ?? 0).fill('devora'), ...Array(H.terror ?? 0).fill('terror'), ...Array(H.manto ?? 0).fill('manto'), ...Array(H.sombra).fill('sombra'), ...Array(H.asa).fill('asa')]
    const dist = (p: [number, number]) => Math.hypot(p[0] - ag.x, p[1] - ag.z)
    let lugares = NASCER.pontos.filter((p) => dist(p) > NASCER.longe)
    if (!lugares.length) lugares = [...NASCER.pontos]
    lugares.sort(() => Math.random() - 0.5)
    if (H.devora || H.manto || H.terror) lugares.sort((a, b) => dist(b) - dist(a)) // os grandes primeiro, nos pontos mais longe
    let fortes = H.forte ?? 0
    R.current.fila = lista.map((tipo, i) => {
      const [x, z] = lugares[i % lugares.length]
      const p = new THREE.Vector3(x, 0, z)
      if (i >= lugares.length) p.x += Math.random() - 0.5 // mais espectrais que pontos: perto de um
      const forte = (tipo === 'sombra' || tipo === 'asa') && fortes > 0 ? (fortes--, true) : undefined
      return { tipo, p, em: i * TEMPO.surge, forte }
    })
  }

  useFrame((_, dtBruto) => {
    const J = jogo.current, C = J?.espectrais
    if (!J || !C) return
    const S = R.current, dt = Math.min(dtBruto, 0.05), ag = J.agente.root.position
    if (!S.ligado) { // caindo, volta no começo e a horda recomeça do zero
      S.ligado = true
      J.pontoDeVolta(VOLTA.x, VOLTA.z, (VOLTA.yaw * Math.PI) / 180)
      J.aoVoltar = () => { C.limpar(); S.fila = []; if (S.etapa !== 'fim') { S.etapa = 'comeca'; S.t = TEMPO.comeca } }
    }
    if (S.destroi) { S.destroi = false; if (S.etapa === 'onda') { C.limpar(); S.fila = [] } }
    let texto: TextoRoteiro | null = null
    const nome = `Horda ${S.horda + 1} de ${HORDAS.length}`
    if (S.etapa === 'comeca') {
      texto = { titulo: nome, dica: S.jogando ? 'Prepare-se' : 'Clique para começar' }
      if (S.jogando && (S.t -= dt) <= 0) { encher(S.horda, ag); S.etapa = 'onda'; S.tempo = 0; musica('batalha') }
    } else if (S.etapa === 'onda') {
      S.tempo += dt
      while (S.fila.length && S.fila[0].em <= S.tempo) { const f = S.fila.shift()!; C.invocar(f.tipo, f.p, f.forte) }
      const restam = C.restam() + S.fila.length
      texto = { titulo: nome, dica: restam ? `Restam ${restam} · ${DICA_H}` : undefined }
      if (!restam) { // limpou: um kit e a pausa (ou o fim)
        J.darKit(KITS.porOnda); S.horda++
        if (S.horda >= HORDAS.length) { S.etapa = 'fim'; musica(null) } else { S.etapa = 'entre'; S.t = TEMPO.entre }
      }
    } else if (S.etapa === 'entre') {
      texto = { titulo: 'Horda limpa', dica: `A próxima vem aí (${Math.ceil(S.t)})` }
      if ((S.t -= dt) <= 0) { S.etapa = 'comeca'; S.t = TEMPO.comeca }
    } else texto = { titulo: 'Você venceu as hordas', dica: 'Esc · sair para o menu' }
    const chave = `${texto.titulo}|${texto.dica ?? ''}`
    if (chave !== S.texto) { S.texto = chave; avisa.current(texto) }
  })
  return null
}
