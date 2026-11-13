// O roteiro da Demo · Intro (docs/intro.md), dentro do <Canvas> da fase (screens/Jogo.tsx), ao lado do agente (o Testar,
// que dá o controle dele: AgenteNaFase). Lê os pontos do mapa (maps/intro: arena, nascer, chefe, tornado) e conduz:
//   arena 1: entrou, os tornados dela formam (a arena fecha) e ali vira o ponto de volta; as ondas de Assombrados surgem
//     do chão, uma depois da outra; limpou a última, os tornados desfazem e a passagem abre;
//   arena 2: o mesmo, com Asas sombrias junto (elas sobem do chão até a altura do voo);
//   arena do chefe: entrou, a arena fecha, o chão ronca (ele nada embaixo) e o Devora almas sai do chão; a música do
//     chefe começa ("O devorador de almas"). Estourado, a demo acaba.
// A luta (a etapa 3): cada demônio pensa no ia.ts dele (o Assombrado vai atrás e ataca, um por vez; a Asa sombria voa em
// volta e cospe; o Devora almas escolhe os ataques pela barra de vida) e fere o agente pelo controle da fase. Caindo,
// o agente volta no começo da arena e a onda recomeça. Sem balas ainda: a tecla H (de teste) estoura a horda e, no
// chefe, tira uma barra de vida (ele fica atordoado e passa para a próxima fase; na última, estoura).
// O ambiente do submundo toca o tempo todo. Os números em numeros.ts.
import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { musica } from '../../audio/musica'
import type { AgenteNaFase } from '../../game/Testar'
import { montarAssombrado, type Assombrado } from '../../game/enemies/assombrado/modelo'
import { animarAssombrado, arremessar, estourarAssombrado, surgirAssombrado } from '../../game/enemies/assombrado/animacao'
import { novoBando, pensarAssombrado } from '../../game/enemies/assombrado/ia'
import { LUTA as LUTA_ASSOMBRADO } from '../../game/enemies/assombrado/numeros'
import { ouvirAssombrado } from '../../game/enemies/assombrado/sons'
import { montarAsaSombria, type AsaSombria } from '../../game/enemies/asa-sombria/modelo'
import { animarAsaSombria, estourarAsa } from '../../game/enemies/asa-sombria/animacao'
import { pensarAsa, type Mira } from '../../game/enemies/asa-sombria/ia'
import { LUTA as LUTA_ASA } from '../../game/enemies/asa-sombria/numeros'
import { acertar, disparar, novosProjeteis, passoProjeteis } from '../../game/enemies/asa-sombria/projetil'
import { bolaBatendo, ouvirAsaSombria } from '../../game/enemies/asa-sombria/sons'
import { montarDevoraAlmas, type DevoraAlmas } from '../../game/enemies/devora-almas/modelo'
import { animarDevora, atordoar, emergir, estourarDevora, fase as faseDevora, mergulhar } from '../../game/enemies/devora-almas/animacao'
import { chuvaDeTentaculos, novosEfeitosDevora, passoEfeitosDevora, type EfeitosDevora } from '../../game/enemies/devora-almas/efeitos'
import { acalmarDevora, golpesDoDevora, pensarDevora, tentaculoAcerta } from '../../game/enemies/devora-almas/ia'
import { ESCALA, GOSMA, LUTA as LUTA_DEVORA, NINHADA, RESPINGO } from '../../game/enemies/devora-almas/numeros'
import { avisoChuva, ouvirDevora, tentaculo } from '../../game/enemies/devora-almas/sons'
import { estourar, novoEstouro, passoEstouro } from '../../game/enemies/estouro'
import { andarNoMundo, separar, type Alvo } from '../../game/enemies/luta'
import { calar, somEm } from '../../game/enemies/sons'
import type { Chunk } from '../../maps/types'
import { NASCER, ONDAS, TEMPO } from './numeros'
import { novoAmbiente, ouvirTornado, passoAmbiente } from './sons'
import { descartarTornado, novoTornado, passoTornado, type Tornado } from './tornado'

/** O que a tela mostra do roteiro: a linha de cima (onde está, a onda) e a dica embaixo. */
export interface TextoRoteiro { titulo: string; dica?: string }

type Etapa = 'fora' | 'comeca' | 'onda' | 'entre' | 'ronco' | 'chefe' | 'fim'
// t = s desde que surgiu; estoura = s até estourar (a tecla de teste; −1 = não); morto = s desde que estourou (−1 = vivo);
// cria = cuspido pelo chefe (não conta como onda)
type Vivo = { t: number; estoura: number; morto: number; cria?: boolean } & ({ tipo: 'assombrado'; a: Assombrado } | { tipo: 'asa'; a: AsaSombria } | { tipo: 'devora'; d: DevoraAlmas })

const DICA_H = 'H · destrói a horda (teste, até as balas chegarem)'
const DICA_CHEFE = 'H · tira uma barra de vida (teste, até as balas chegarem)'
const _v = new THREE.Vector3(), _f = new THREE.Vector3()

export function Roteiro({ chunks, jogo, aoTexto }: { chunks: Record<string, Chunk>; jogo: { current: AgenteNaFase | null }; aoTexto: (t: TextoRoteiro | null) => void }) {
  const { scene, camera } = useThree()
  // os pontos do mapa
  const pontos = useMemo(() => {
    const todos = Object.values(chunks).flatMap((c) => c.points)
    const em = (p: { pos: [number, number, number] }) => new THREE.Vector3(...p.pos)
    return {
      arenas: new Map(todos.filter((p) => p.kind === 'arena').map((p) => [Number(p.params?.n), { p: em(p), raio: Number(p.params?.raio ?? 8) }])),
      nascer: todos.filter((p) => p.kind === 'nascer').map((p) => ({ arena: Number(p.params?.arena), p: em(p) })),
      chefe: todos.filter((p) => p.kind === 'chefe').map(em)[0] ?? null,
      tornados: todos.filter((p) => p.kind === 'tornado').map((p) => ({ n: Number(p.params?.n), p: em(p) })),
    }
  }, [chunks])
  const grupo = useMemo(() => new THREE.Group(), []), E = useMemo(() => novoEstouro(), []), P = useMemo(() => novosProjeteis(), [])
  const R = useRef({ arena: 1, etapa: 'fora' as Etapa, onda: 0, t: 0, destroi: false, texto: '', fila: [] as { tipo: 'assombrado' | 'asa'; p: THREE.Vector3; em: number }[] })
  const vivos = useRef<Vivo[]>([]), tornados = useRef<Tornado[]>([]), efeitos = useRef<EfeitosDevora | null>(null)
  const bando = useMemo(() => novoBando(), []), ambiente = useMemo(() => novoAmbiente(), [])
  const alvo = useRef<Alvo | null>(null)
  const mira = useMemo<Mira>(() => ({ de: new THREE.Vector3(), dir: new THREE.Vector3(), ativa: false }), []), peito = useMemo(() => new THREE.Vector3(), [])
  const avisa = useRef(aoTexto); avisa.current = aoTexto

  /** Tira um demônio da cena (sem estouro: o agente voltou e a onda recomeça; ou o estourado já ficou o bastante). */
  const tirar = (v: Vivo) => { if (v.tipo === 'devora') { grupo.remove(v.d.root); calar(v.d) } else { grupo.remove(v.a.root); calar(v.a) } }

  // a cena: o grupo do roteiro (os demônios, os projéteis, o estouro); saindo, tudo some e se cala (e a música do chefe para)
  useEffect(() => {
    scene.add(grupo, E.grupo); grupo.add(P.grupo)
    const tecla = (e: KeyboardEvent) => { if (e.code === 'KeyH') R.current.destroi = true }
    window.addEventListener('keydown', tecla)
    return () => {
      window.removeEventListener('keydown', tecla)
      scene.remove(grupo, E.grupo)
      for (const v of vivos.current) tirar(v)
      const m = jogo.current?.mundo
      for (const o of tornados.current) { calar(o); if (m) descartarTornado(o, m) }
      vivos.current = []; tornados.current = []
      musica(null)
    }
  }, [scene, grupo, E, P, jogo])

  /** Põe a onda na fila: cada demônio num ponto da arena longe do agente, um depois do outro. */
  function onda(arena: number, n: number, agente: THREE.Vector3) {
    const O = ONDAS[arena][n], tipos = [...Array(O.assombrado).fill('assombrado'), ...Array(O.asa).fill('asa')] as ('assombrado' | 'asa')[]
    let lugares = pontos.nascer.filter((x) => x.arena === arena && x.p.distanceTo(agente) > NASCER.longe).map((x) => x.p)
    if (!lugares.length) lugares = pontos.nascer.filter((x) => x.arena === arena).map((x) => x.p)
    lugares.sort(() => Math.random() - 0.5)
    tipos.forEach((tipo, i) => {
      const p = lugares[i % lugares.length].clone()
      if (i >= lugares.length) p.add(_v.set(Math.random() - 0.5, 0, Math.random() - 0.5).multiplyScalar(2)) // mais demônios que pontos: perto de um
      R.current.fila.push({ tipo, p, em: i * TEMPO.surge })
    })
  }

  /** Um demônio surge: o Assombrado sobe do líquido preto; a Asa sombria rompe o chão e sobe até a altura do voo. */
  function surgir(tipo: 'assombrado' | 'asa', p: THREE.Vector3, agente: THREE.Vector3, cria = false) {
    const yaw = Math.atan2(agente.x - p.x, agente.z - p.z)
    if (tipo === 'assombrado') {
      const a = montarAssombrado(); a.root.position.copy(p); a.root.rotation.y = yaw; grupo.add(a.root)
      surgirAssombrado(a, E, p.y)
      vivos.current.push({ tipo, a, t: 0, estoura: -1, morto: -1, cria })
    } else {
      const a = montarAsaSombria(); a.root.position.copy(p).setY(p.y + 0.3); a.root.rotation.y = yaw; grupo.add(a.root)
      estourar(E, p.clone().setY(p.y + 0.1), 0.35, p.y, { cubos: 8, olhos: 0 }) // rompe o chão
      vivos.current.push({ tipo, a, t: 0, estoura: -1, morto: -1, cria })
    }
  }

  /** O chefe: monta embaixo do chão, já nadando (o chão ronca), virado para o agente. */
  function chefe(agente: THREE.Vector3) {
    if (!pontos.chefe) return
    const d = montarDevoraAlmas(), F = novosEfeitosDevora()
    d.root.position.copy(pontos.chefe); d.root.rotation.y = Math.atan2(agente.x - pontos.chefe.x, agente.z - pontos.chefe.z)
    mergulhar(d)
    for (let i = 0; i < 240 && d.anim.modo !== 'nadando'; i++) d.root.position.y = animarDevora(d, 1 / 60).y // termina de mergulhar (fora da vista)
    grupo.add(d.root, F.grupo); efeitos.current = F
    vivos.current.push({ tipo: 'devora', d, t: 0, estoura: -1, morto: -1 })
  }

  /** O que o chefe cospe (a ninhada): o Assombrado voa em arco até o chão à frente; a Asa sai voando da boca. */
  function cria(c: { tipo: 'assombrado' | 'asa'; de: THREE.Vector3; frente: THREE.Vector3 }) {
    const f = _f.copy(c.frente).setY(0).normalize(), dist = NINHADA.alcance[0] + Math.random() * (NINHADA.alcance[1] - NINHADA.alcance[0])
    const para = new THREE.Vector3(c.de.x + f.x * dist + (Math.random() - 0.5) * 3, 0, c.de.z + f.z * dist + (Math.random() - 0.5) * 3)
    const arena = pontos.arenas.get(3)
    if (arena) { _v.subVectors(para, arena.p).setY(0); const l = _v.length(), max = arena.raio; if (l > max) para.sub(_v.multiplyScalar(1 - max / l)) }
    if (c.tipo === 'asa') {
      const a = montarAsaSombria(); a.root.position.copy(c.de); a.root.rotation.y = Math.atan2(f.x, f.z); grupo.add(a.root)
      vivos.current.push({ tipo: 'asa', a, t: 0, estoura: -1, morto: -1, cria: true })
    } else {
      const a = montarAssombrado(); grupo.add(a.root); arremessar(a, c.de, para)
      vivos.current.push({ tipo: 'assombrado', a, t: 0, estoura: -1, morto: -1, cria: true })
    }
  }

  const fecha = (n: number, quer: boolean) => { for (const o of tornados.current) if (o.n === n) o.quer = quer }

  useFrame((_, dtBruto) => {
    const J = jogo.current
    if (!J) return
    const dt = Math.min(dtBruto, 0.05), S = R.current, ag = J.agente.root.position
    // na primeira vez: os tornados entram no mundo; o alvo dos demônios é o agente; caindo, a onda recomeça
    if (!alvo.current) {
      alvo.current = { p: ag, pode: J.pode, ferir: J.ferir, engolir: J.engolir, cuspir: J.cuspir, lentidao: J.lentidao }
      tornados.current = pontos.tornados.map((t) => novoTornado(t.p, t.n, J.mundo, grupo))
      J.aoVoltar = () => {
        vivos.current = vivos.current.filter((v) => { if (v.tipo === 'devora' || v.morto >= 0) return true; tirar(v); return false })
        R.current.fila = []; bando.atacando = null
        if (R.current.etapa === 'onda' || R.current.etapa === 'entre') { R.current.etapa = 'comeca'; R.current.t = TEMPO.comeca }
        for (const v of vivos.current) if (v.tipo === 'devora') acalmarDevora(v.d)
      }
    }
    const A = alvo.current
    passoAmbiente(ambiente, dt)
    for (const o of tornados.current) { passoTornado(o, dt); ouvirTornado(o, dt) }
    // para onde o agente mira (a Asa sombria desvia)
    camera.getWorldPosition(mira.de); camera.getWorldDirection(mira.dir); mira.ativa = J.agente.anim.arma.mira > 0.5

    // ---------- a ordem ----------
    const arena = pontos.arenas.get(S.arena), ondas = ONDAS[S.arena]
    const daOnda = vivos.current.filter((v) => v.tipo !== 'devora' && !v.cria)
    if (S.etapa === 'fora' && arena && Math.hypot(ag.x - arena.p.x, ag.z - arena.p.z) < arena.raio) {
      fecha(S.arena, true)
      J.pontoDeVolta(ag.x, ag.z, Math.atan2(arena.p.x - ag.x, arena.p.z - ag.z)) // caindo, volta aqui (o começo da arena)
      if (ondas) { S.etapa = 'comeca'; S.t = TEMPO.comeca } else { chefe(ag); S.etapa = 'ronco'; S.t = TEMPO.chefeRonco }
    } else if ((S.etapa === 'comeca' || S.etapa === 'entre') && (S.t -= dt) <= 0) { onda(S.arena, S.onda, ag); S.etapa = 'onda' }
    else if (S.etapa === 'onda' && !S.fila.length && daOnda.every((v) => v.morto >= 0)) {
      S.onda++
      if (S.onda < ondas.length) { S.etapa = 'entre'; S.t = TEMPO.entre }
      else { fecha(S.arena, false); S.arena++; S.onda = 0; S.etapa = 'fora' }
    } else if (S.etapa === 'ronco' && (S.t -= dt) <= 0) {
      const v = vivos.current.find((x) => x.tipo === 'devora')
      if (v && v.tipo === 'devora') { v.d.root.rotation.y = Math.atan2(ag.x - v.d.root.position.x, ag.z - v.d.root.position.z); emergir(v.d) }
      musica('devorador'); S.etapa = 'chefe'
    } else if ((S.etapa === 'chefe' || S.etapa === 'ronco') && vivos.current.some((v) => v.tipo === 'devora' && v.morto >= 0)) {
      fecha(S.arena, false); S.etapa = 'fim'
      vivos.current.forEach((v, i) => { if (v.morto < 0 && v.estoura < 0) v.estoura = i * TEMPO.destroi }) // as crias estouram junto
    }

    // a tecla de teste: a horda estoura em sequência (e o que ainda ia surgir, não surge); o chefe perde uma barra
    if (S.destroi) {
      S.destroi = false; S.fila = []
      let i = 0
      for (const v of vivos.current) {
        if (v.morto >= 0 || v.estoura >= 0) continue
        if (v.tipo === 'devora' && v.d.anim.fase < 3) { faseDevora(v.d, v.d.anim.fase + 1); atordoar(v.d) } // a barra zerou: tonto, e a próxima fase
        else v.estoura = i++ * TEMPO.destroi // a horda (e as crias, e o chefe na última barra)
      }
    }

    // ---------- a fila: os demônios da onda surgindo ----------
    S.fila = S.fila.filter((f) => { if ((f.em -= dt) > 0) return true; surgir(f.tipo, f.p, ag); return false })

    // ---------- os demônios: pensam (ia.ts), animam, andam no mundo e ferem ----------
    const area = pontos.arenas.get(Math.min(S.arena, 3)) ?? null, bandoRaizes: THREE.Object3D[] = []
    for (const v of vivos.current) {
      v.t += dt
      if (v.morto >= 0) v.morto += dt
      else if (v.estoura >= 0 && (v.estoura -= dt) <= 0) { // a vez dele de estourar
        if (v.tipo === 'assombrado') estourarAssombrado(v.a, E, 0)
        else if (v.tipo === 'asa') estourarAsa(v.a, E, 0)
        else estourarDevora(v.d, E, 0)
        v.morto = 0
      }
      const vivo = v.morto < 0
      if (v.tipo === 'assombrado') {
        const andar = vivo ? pensarAssombrado(v.a, A, bando, dt, mira.de) : 0
        const s = animarAssombrado(v.a, { andar }, dt)
        if (!v.a.anim.voo) andarNoMundo(v.a.root, s.avanca * dt, J.mundo, LUTA_ASSOMBRADO.raio)
        if (vivo && !v.a.anim.voo && !v.a.anim.surgir) bandoRaizes.push(v.a.root)
        ouvirAssombrado(v.a, dt)
      } else if (v.tipo === 'asa') {
        const quer = vivo ? pensarAsa(v.a, A, mira, area, dt, peito) : undefined
        const s = animarAsaSombria(v.a, { alvo: quer }, dt), r = v.a.root
        r.position.addScaledVector(_v.set(Math.cos(r.rotation.y), 0, -Math.sin(r.rotation.y)), s.lado * dt) // o desvio
        r.position.addScaledVector(_v.set(Math.sin(r.rotation.y), 0, Math.cos(r.rotation.y)), -s.recua * dt) // o recuo do cuspe
        if (s.cospe && quer) disparar(P, s.cospe, quer)
        ouvirAsaSombria(v.a, dt)
      } else {
        const F = efeitos.current
        const pedido = vivo && S.etapa === 'chefe' ? pensarDevora(v.d, A, pontos.arenas.get(3) ?? null, dt) : {}
        if (pedido.chuva && F) chuvaDeTentaculos(F, pedido.chuva)
        pedido.doChao?.forEach((p) => surgir('assombrado', p, ag, true))
        const s = animarDevora(v.d, dt), r = v.d.root
        r.position.y = s.y
        r.position.x += Math.sin(r.rotation.y) * s.avanca * dt; r.position.z += Math.cos(r.rotation.y) * s.avanca * dt
        if (s.rompe) estourar(E, _v.set(Math.sin(r.rotation.y), 0, Math.cos(r.rotation.y)).multiplyScalar(0.8 * ESCALA).add(r.position).setY(0.05), RESPINGO.raio, 0, { cubos: 18, olhos: 0, mancha: false, tamanho: 2 * RESPINGO.cubos })
        golpesDoDevora(v.d, s, A, dt)
        if (s.cria) cria(s.cria)
        ouvirDevora(v.d, s, dt)
        if (F) {
          passoEfeitosDevora(F, v.d, 0, dt, E)
          for (const p of F.sons.aviso) somEm(p, avisoChuva, 4)
          for (const p of F.sons.rompe) { somEm(p, tentaculo, 4); tentaculoAcerta(p, A) }
          // o rastro de gosma: pisando, fica lento
          if (A.pode() && F.gotas.some((g) => g.t < GOSMA.dura && Math.hypot(g.p.x - ag.x, g.p.z - ag.z) < g.tam * 0.45)) J.lentidao(LUTA_DEVORA.rastro.lento, 0.3)
        }
      }
    }
    separar(bandoRaizes, LUTA_ASSOMBRADO.separa)
    // os projéteis: andam, batem no chão, ou acertam o agente
    passoProjeteis(P, dt, E, 0)
    if (A.pode()) { const onde = acertar(P, peito.copy(ag).setY(ag.y + 1.2), LUTA_ASA.acerto, E, 0); if (onde) J.ferir(LUTA_ASA.dano, onde) }
    for (const p of P.bateu) somEm(p, bolaBatendo)
    // os estourados saem depois de um tempo (o som do estouro e a mancha ficam)
    vivos.current = vivos.current.filter((v) => { if (v.morto < TEMPO.some) return true; tirar(v); return false })
    passoEstouro(E, dt)

    // ---------- o que a tela mostra ----------
    const N = ondas?.length ?? 0, quantos = daOnda.filter((v) => v.morto < 0).length + S.fila.length
    const dev = vivos.current.find((v) => v.tipo === 'devora'), barras = dev && dev.tipo === 'devora' ? 4 - dev.d.anim.fase : 3
    const texto: TextoRoteiro | null =
      S.etapa === 'fora' ? (S.arena === 1 ? null : { titulo: S.arena === 3 ? 'A passagem abriu: a arena do chefe à frente' : 'A passagem abriu: atravesse a ponte' })
      : S.etapa === 'comeca' ? { titulo: `Arena ${S.arena} · a arena fechou` }
      : S.etapa === 'entre' ? { titulo: `Arena ${S.arena} · onda ${S.onda + 1} de ${N} a caminho` }
      : S.etapa === 'onda' ? { titulo: `Arena ${S.arena} · onda ${S.onda + 1} de ${N} · ${quantos} ${quantos === 1 ? 'Sombrio' : 'Sombrios'}`, dica: DICA_H }
      : S.etapa === 'ronco' ? { titulo: 'O chão treme…', dica: DICA_CHEFE }
      : S.etapa === 'chefe' ? { titulo: `O Devora almas · ${barras} ${barras === 1 ? 'barra' : 'barras'} de vida`, dica: DICA_CHEFE }
      : { titulo: 'Fim da demo · obrigado por jogar', dica: 'Esc volta ao menu' }
    const chave = texto ? texto.titulo + '|' + (texto.dica ?? '') : ''
    if (chave !== S.texto) { S.texto = chave; avisa.current(texto) }
  })
  return null
}
