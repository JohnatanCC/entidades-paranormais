// O roteiro da Demo · Intro (docs/intro.md), dentro do <Canvas> da fase (screens/Jogo.tsx), ao lado do agente (o Testar,
// que dá o controle dele: AgenteNaFase). Lê os pontos do mapa (maps/intro: arena, nascer, chefe, tornado) e conduz:
//   arena 1: entrou, os tornados dela formam (a arena fecha) e ali vira o ponto de volta; as ondas de Assombrados surgem
//     do chão, uma depois da outra (com a música de batalha); limpou a última, os tornados desfazem, a passagem abre e a
//     música some;
//   arena 2: o mesmo, com Asas sombrias junto (elas sobem do chão até a altura do voo);
//   arena do chefe: entrou, a arena fecha e a música do chefe começa ("O devorador de almas"), o chão ronca (ele nada
//     embaixo) e o Devora almas sai do chão. Estourado, a demo acaba.
// A luta (a etapa 3): cada demônio pensa no ia.ts dele (o Assombrado vai atrás e ataca, um por vez; a Asa sombria voa em
// volta e cospe; o Devora almas escolhe os ataques pela barra de vida) e fere o agente pelo controle da fase. Caindo,
// o agente volta no começo da arena e a onda recomeça. As balas (a 4b): cada demônio vivo se apresenta ao agente como
// esferas que levam tiro (J.alvos); zerou a vida, estoura. O Devora: a boca aberta leva o dano cheio, o corpo menos,
// embaixo do chão nada; cada barra que zera o deixa tonto e passa de fase, e muito dano de uma vez também o deixa tonto.
// A tecla H (de teste) continua: estoura a horda e, no chefe, tira uma barra.
// O ambiente do submundo toca o tempo todo. Os números em numeros.ts.
import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { musica } from '../../audio/musica'
import type { AgenteNaFase } from '../../game/Testar'
import type { ChefeHud } from '../../game/hud/Hud'
import { KITS } from '../../game/player/numeros'
import type { Alvejavel } from '../../game/weapons/bala'
import { montarAssombrado, type Assombrado } from '../../game/enemies/assombrado/modelo'
import { animarAssombrado, arremessar, estourarAssombrado, ferir as ferirAssombrado, surgirAssombrado } from '../../game/enemies/assombrado/animacao'
import { novoBando, pensarAssombrado } from '../../game/enemies/assombrado/ia'
import { LUTA as LUTA_ASSOMBRADO } from '../../game/enemies/assombrado/numeros'
import { ouvirAssombrado } from '../../game/enemies/assombrado/sons'
import { montarAsaSombria, type AsaSombria } from '../../game/enemies/asa-sombria/modelo'
import { animarAsaSombria, estourarAsa, ferir as ferirAsa } from '../../game/enemies/asa-sombria/animacao'
import { pensarAsa, type Mira } from '../../game/enemies/asa-sombria/ia'
import { LUTA as LUTA_ASA } from '../../game/enemies/asa-sombria/numeros'
import { acertar, disparar, novosProjeteis, passoProjeteis } from '../../game/enemies/asa-sombria/projetil'
import { bolaBatendo, ouvirAsaSombria } from '../../game/enemies/asa-sombria/sons'
import { montarDevoraAlmas, type DevoraAlmas } from '../../game/enemies/devora-almas/modelo'
import { animarDevora, arrancar, atordoar, emergir, estourarDevora, fase as faseDevora, ferir as ferirDevora, mergulhar } from '../../game/enemies/devora-almas/animacao'
import { chuvaDeTentaculos, novosEfeitosDevora, passoEfeitosDevora, pocasNoChao, tentaculoDaPoca, type EfeitosDevora } from '../../game/enemies/devora-almas/efeitos'
import { temChao } from '../../game/world/colisao'
import { acalmarDevora, golpesDoDevora, pensarDevora, tentaculoAcerta } from '../../game/enemies/devora-almas/ia'
import { ESCALA, GOSMA, LUTA as LUTA_DEVORA, NINHADA, RESPINGO } from '../../game/enemies/devora-almas/numeros'
import { avisoChuva, ouvirDevora, tentaculo } from '../../game/enemies/devora-almas/sons'
import { estourar, novoEstouro, passoEstouro } from '../../game/enemies/estouro'
import { andarNoMundo, separar, type Alvo } from '../../game/enemies/luta'
import { calar, somEm } from '../../game/enemies/sons'
import { soltarGolpe } from '../../render/golpe'
import { tremorDoDevora } from '../../game/enemies/devora-almas/tremor'
import { tremerDe } from '../../game/player/tremor'
import { TREMOR } from '../../game/player/numeros'
import { desenharDepuracao, novaDepuracao, type BarraDeVida } from '../../game/enemies/depurar'
import type { Chunk } from '../../maps/types'
import { CAIXAS, CRIAS, HORDA_CHEFE, NASCER, ONDAS, POCAS, TEMPO } from './numeros'
import { novoAmbiente, ouvirTornado, passoAmbiente } from './sons'
import { descartarTornado, novoTornado, passoTornado, type Tornado } from './tornado'

/** O que a tela mostra do roteiro: a linha de cima (onde está, a onda), a dica embaixo e, na luta do chefe, as
 *  barras de vida dele (o HUD). */
export interface TextoRoteiro { titulo: string; dica?: string; chefe?: ChefeHud }

type Etapa = 'fora' | 'comeca' | 'onda' | 'entre' | 'ronco' | 'chefe' | 'fim'
// t = s desde que surgiu; estoura = s até estourar (a tecla de teste; −1 = não); morto = s desde que estourou (−1 = vivo);
// cria = cuspido pelo chefe (não conta como onda); vida; alvos = as esferas onde a bala acerta; recente = o dano levado
// há pouco (o Devora fica tonto com muito de uma vez) e tonto = s até poder ficar tonto de novo
type Vivo = { t: number; estoura: number; morto: number; cria?: boolean; vida: number; alvos: Alvejavel[]; recente: number; tonto: number; costas: number[] }
  & ({ tipo: 'assombrado'; a: Assombrado } | { tipo: 'asa'; a: AsaSombria } | { tipo: 'devora'; d: DevoraAlmas })
const novo = { t: 0, estoura: -1, morto: -1, alvos: [] as Alvejavel[], recente: 0, tonto: 0, costas: [] as number[] }

const DICA_H = 'H · destrói a horda (teste)'
const DICA_CHEFE = 'H · tira uma barra de vida (teste)'
const BARRA = LUTA_DEVORA.vida / 3
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
  const R = useRef({ arena: 1, etapa: 'fora' as Etapa, onda: 0, t: 0, horda: HORDA_CHEFE.cada, destroi: false, texto: '', fila: [] as { tipo: 'assombrado' | 'asa'; p: THREE.Vector3; em: number }[] })
  const vivos = useRef<Vivo[]>([]), tornados = useRef<Tornado[]>([]), efeitos = useRef<EfeitosDevora | null>(null)
  const pocas = useRef<{ p: THREE.Vector3; t: number }[]>([]) // as poças da arena do chefe (onde, s até poder de novo)
  const bando = useMemo(() => novoBando(), []), ambiente = useMemo(() => novoAmbiente(), [])
  const alvo = useRef<Alvo | null>(null)
  const mira = useMemo<Mira>(() => ({ de: new THREE.Vector3(), dir: new THREE.Vector3(), ativa: false }), []), peito = useMemo(() => new THREE.Vector3(), [])
  const avisa = useRef(aoTexto); avisa.current = aoTexto
  // a vista de depuração (só no npm run dev): F2 as barras de vida, F4 as caixas de acerto
  const dep = useMemo(() => (import.meta.env.DEV ? novaDepuracao() : null), []), vidas = useMemo<BarraDeVida[]>(() => [], [])

  /** Tira um demônio da cena (sem estouro: o agente voltou e a onda recomeça; ou o estourado já ficou o bastante). */
  const tirar = (v: Vivo) => { const raiz = v.tipo === 'devora' ? v.d.root : v.a.root; grupo.remove(raiz); calar(v.tipo === 'devora' ? v.d : v.a); soltarGolpe(raiz) }

  // a cena: o grupo do roteiro (os demônios, os projéteis, o estouro); saindo, tudo some e se cala (e a música para)
  useEffect(() => {
    scene.add(grupo, E.grupo); grupo.add(P.grupo)
    if (dep) grupo.add(dep.grupo)
    const tecla = (e: KeyboardEvent) => {
      if (e.code === 'KeyH') R.current.destroi = true
      if (dep && e.code === 'F2') { e.preventDefault(); dep.vidas = !dep.vidas }
      if (dep && e.code === 'F4') { e.preventDefault(); dep.caixas = !dep.caixas }
    }
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
  }, [scene, grupo, E, P, jogo, dep])

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
      entra({ ...novo, alvos: [], tipo, a, cria, vida: LUTA_ASSOMBRADO.vida })
    } else {
      const a = montarAsaSombria(); a.root.position.copy(p).setY(p.y + 0.3); a.root.rotation.y = yaw; grupo.add(a.root)
      estourar(E, p.clone().setY(p.y + 0.1), 0.35, p.y, { cubos: 8, olhos: 0 }) // rompe o chão
      entra({ ...novo, alvos: [], tipo, a, cria, vida: LUTA_ASA.vida })
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
    entra({ ...novo, alvos: [], tipo: 'devora', d, vida: LUTA_DEVORA.vida })
    // as poças na borda da arena: espalhadas em volta, cada uma onde tem chão (se não, um pouco mais para dentro)
    const arena = pontos.arenas.get(3), m = jogo.current?.mundo
    if (arena && m) {
      const giro = Math.random() * Math.PI * 2
      pocas.current = Array.from({ length: POCAS.n }, (_, i) => {
        const a = giro + (i / POCAS.n) * Math.PI * 2
        for (let k = POCAS.borda; k > 0.4; k -= 0.05) { const x = arena.p.x + Math.sin(a) * arena.raio * k, z = arena.p.z + Math.cos(a) * arena.raio * k; if (temChao(m, x, z, 0)) return { p: new THREE.Vector3(x, 0, z), t: 0 } }
        return null
      }).filter((x): x is { p: THREE.Vector3; t: number } => !!x)
      pocasNoChao(F, pocas.current.map((x) => x.p), POCAS.raio)
    }
  }

  /** As poças, a cada quadro na luta do chefe: perto delas, um tentáculo sobe da beirada mais perto do agente (o aviso
   *  do círculo e depois o golpe: o mesmo da chuva, tentaculoAcerta). */
  function passoPocas(F: EfeitosDevora, A: Alvo, dt: number) {
    pocas.current.forEach((o, k) => {
      o.t -= dt
      const dx = A.p.x - o.p.x, dz = A.p.z - o.p.z, d = Math.hypot(dx, dz)
      if (o.t > 0 || d > POCAS.alcance || !A.pode()) return
      const ate = Math.min(d, POCAS.raio) / Math.max(d, 1e-3)
      if (tentaculoDaPoca(F, k, _v.set(o.p.x + dx * ate, 0, o.p.z + dz * ate))) o.t = POCAS.cada[0] + Math.random() * (POCAS.cada[1] - POCAS.cada[0])
    })
  }

  /** Um ponto no chão perto do agente (HORDA_CHEFE.longe m), dentro da arena do chefe; null se não achar chão. */
  function pertoDoAgente(ag: THREE.Vector3, m: AgenteNaFase['mundo']) {
    const arena = pontos.arenas.get(3)
    for (let i = 0; i < 8; i++) {
      const a = Math.random() * Math.PI * 2, rr = HORDA_CHEFE.longe[0] + Math.random() * (HORDA_CHEFE.longe[1] - HORDA_CHEFE.longe[0])
      const x = ag.x + Math.sin(a) * rr, z = ag.z + Math.cos(a) * rr
      if (arena && Math.hypot(x - arena.p.x, z - arena.p.z) > arena.raio - 2) continue
      if (temChao(m, x, z, 0)) return new THREE.Vector3(x, 0, z)
    }
    return null
  }

  /** Ainda cabe uma cria do chefe (no máximo CRIAS.max vivas)? */
  const cabeCria = () => vivos.current.filter((v) => v.cria && v.morto < 0 && v.estoura < 0).length < CRIAS.max

  /** O que o chefe cospe (a ninhada): o Assombrado voa em arco até o chão à frente; a Asa sai voando da boca. */
  function cria(c: { tipo: 'assombrado' | 'asa'; de: THREE.Vector3; frente: THREE.Vector3 }) {
    if (!cabeCria()) return
    const f = _f.copy(c.frente).setY(0).normalize(), dist = NINHADA.alcance[0] + Math.random() * (NINHADA.alcance[1] - NINHADA.alcance[0])
    const para = new THREE.Vector3(c.de.x + f.x * dist + (Math.random() - 0.5) * 3, 0, c.de.z + f.z * dist + (Math.random() - 0.5) * 3)
    const arena = pontos.arenas.get(3)
    if (arena) { _v.subVectors(para, arena.p).setY(0); const l = _v.length(), max = arena.raio; if (l > max) para.sub(_v.multiplyScalar(1 - max / l)) }
    if (c.tipo === 'asa') {
      const a = montarAsaSombria(); a.root.position.copy(c.de); a.root.rotation.y = Math.atan2(f.x, f.z); grupo.add(a.root)
      entra({ ...novo, alvos: [], tipo: 'asa', a, cria: true, vida: LUTA_ASA.vida })
    } else {
      const a = montarAssombrado(); grupo.add(a.root); arremessar(a, c.de, para)
      entra({ ...novo, alvos: [], tipo: 'assombrado', a, cria: true, vida: LUTA_ASSOMBRADO.vida })
    }
  }

  /** Um demônio entra na luta: as caixas onde a bala acerta (o centro anda com ele: alvosDe, a cada quadro; as medidas
   *  em CAIXAS, numeros.ts). */
  function entra(v: Vivo) {
    const caixa = (m: readonly number[], acerta: Alvejavel['acerta']): Alvejavel => ({ c: new THREE.Vector3(), m: new THREE.Vector3(m[0], m[1], m[2]), acerta })
    const corpo = (m: readonly number[], parte = 1) => caixa(m, (dano, _p, dir) => tiro(v, dano * parte, dir))
    if (v.tipo === 'devora') {
      // a boca (dano cheio só aberta: tiro() decide), o corpo e a cauda (o corpo preto: dano reduzido)
      v.alvos = [caixa(CAIXAS.devora.boca, (dano, _p, dir) => tiro(v, dano * (Math.abs(v.d.mandibula.rotation.x) > 0.35 ? 1 : LUTA_DEVORA.corpo), dir)),
        corpo(CAIXAS.devora.corpo, LUTA_DEVORA.corpo), corpo(CAIXAS.devora.cauda, LUTA_DEVORA.corpo)]
      // os 3 tentáculos das costas: 3 caixas em cada (alvos 3 a 11), com a vida de cada um
      v.costas = [0, 1, 2].map(() => LUTA_DEVORA.costas.vida)
      for (let n = 0; n < 3; n++) for (let k = 0; k < 3; k++) v.alvos.push(caixa(CAIXAS.devora.tentaculo, (dano, _p, dir) => tiroNoTentaculo(v, n, dano, dir)))
    } else v.alvos = [corpo(v.tipo === 'assombrado' ? CAIXAS.assombrado : CAIXAS.asa)]
    vivos.current.push(v)
  }

  /** Uma bala acertou: o tranco vem do lado do tiro; zerou, estoura. O Devora: as barras (cada uma que zera o deixa tonto
   *  e passa de fase) e muito dano de uma vez também o deixa tonto. */
  function tiro(v: Vivo, dano: number, dir: THREE.Vector3) {
    if (v.morto >= 0 || v.estoura >= 0) return
    const raiz = v.tipo === 'devora' ? v.d.root : v.a.root, y = raiz.rotation.y
    const de = Math.atan2(-dir.x * Math.cos(y) + dir.z * Math.sin(y), -dir.x * Math.sin(y) - dir.z * Math.cos(y)) // de onde veio, no espaço dele
    v.vida -= dano
    if (v.tipo === 'assombrado') ferirAssombrado(v.a, de)
    else if (v.tipo === 'asa') ferirAsa(v.a, de)
    else {
      ferirDevora(v.d, de)
      const fase = Math.min(3, 1 + Math.floor((LUTA_DEVORA.vida - Math.max(0, v.vida)) / BARRA))
      if (v.vida > 0 && fase > v.d.anim.fase) { faseDevora(v.d, fase); atordoar(v.d); v.tonto = LUTA_DEVORA.atordoa.espera; v.recente = 0 } // a barra zerou
      else if ((v.recente += dano) >= LUTA_DEVORA.atordoa.dano && v.tonto <= 0) { atordoar(v.d); v.tonto = LUTA_DEVORA.atordoa.espera; v.recente = 0 } // muito de uma vez
    }
    if (v.vida <= 0) v.estoura = 0
  }

  /** Uma bala num tentáculo das costas: só ele perde vida; zerou, é arrancado (estoura no lugar) e o chefe fica mais lento. */
  function tiroNoTentaculo(v: Vivo, n: number, dano: number, dir: THREE.Vector3) {
    if (v.tipo !== 'devora' || v.morto >= 0 || v.estoura >= 0 || !v.d.anim.costas[n]) return
    const y = v.d.root.rotation.y
    ferirDevora(v.d, Math.atan2(-dir.x * Math.cos(y) + dir.z * Math.sin(y), -dir.x * Math.sin(y) - dir.z * Math.cos(y)))
    if ((v.costas[n] -= dano) > 0) return
    const onde = arrancar(v.d, n)
    if (onde) estourar(E, onde, 0.5 * ESCALA, 0, { cubos: 16, olhos: 0, mancha: false, tamanho: 2 })
  }

  const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Vector3()
  /** As caixas de quem pode levar tiro agora, no lugar dele. O Devora: só o que está fora do chão (cada caixa por si:
   *  na ninhada a cabeça erguida leva tiro, o resto enterrado não; nadando, só as costas). A ordem conta (a bala acerta
   *  a primeira): a boca, os tentáculos, o corpo e a cauda. */
  function alvosDe(v: Vivo, lista: Alvejavel[]) {
    if (v.morto >= 0 || v.estoura >= 0) return
    if (v.tipo !== 'devora') { v.a.corpo.getWorldPosition(v.alvos[0].c); lista.push(v.alvos[0]); return }
    const d = v.d
    d.corpo.getWorldPosition(_a)
    _b.set(Math.sin(d.root.rotation.y), 0, Math.cos(d.root.rotation.y))
    d.mandibula.getWorldPosition(v.alvos[0].c).addScaledVector(_b, 0.1 * ESCALA)
    v.alvos[1].c.copy(_a)
    v.alvos[2].c.copy(_a).addScaledVector(_b, -0.55 * ESCALA)
    // os tentáculos das costas (os que ainda existem): no segundo osso, entre o segundo e o terceiro, e depois do
    // terceiro (o último pedaço vai até a ponta)
    d.tentaculos.filter((t) => t.costas).forEach((t, n) => {
      const e = v.alvos.slice(3 + n * 3, 6 + n * 3)
      if (!d.anim.costas[n]) { for (const x of e) x.c.set(0, -999, 0); return } // arrancado: fora do alcance
      t.ossos[1].getWorldPosition(e[0].c); t.ossos[2].getWorldPosition(_c)
      e[1].c.copy(e[0].c).lerp(_c, 0.5)
      e[2].c.copy(_c).lerp(e[0].c, -0.6)
    })
    const fora = (e: Alvejavel) => { if (e.c.y + e.m.y * 0.6 > 0) lista.push(e) } // pelo menos um pedaço fora do chão
    fora(v.alvos[0]); for (let i = 3; i < v.alvos.length; i++) fora(v.alvos[i]); fora(v.alvos[1]); fora(v.alvos[2])
  }

  /** As barras de vida da depuração (F2): em cima de cada demônio vivo e de cada tentáculo das costas do chefe. */
  function barrasDeVida(lista: BarraDeVida[]) {
    lista.length = 0
    for (const v of vivos.current) {
      if (v.morto >= 0 || v.estoura >= 0) continue
      if (v.tipo !== 'devora') { lista.push({ p: v.alvos[0].c.clone().setY(v.alvos[0].c.y + v.alvos[0].m.y + 0.2), f: v.vida / (v.tipo === 'assombrado' ? LUTA_ASSOMBRADO.vida : LUTA_ASA.vida) }); continue }
      lista.push({ p: v.alvos[1].c.clone().setY(Math.max(0.5, v.alvos[1].c.y + v.alvos[1].m.y + 0.4)), f: v.vida / LUTA_DEVORA.vida, largura: 2.4 })
      for (let n = 0; n < 3; n++) if (v.d.anim.costas[n]) { const e = v.alvos[5 + n * 3]; lista.push({ p: e.c.clone().setY(e.c.y + e.m.y + 0.15), f: v.costas[n] / LUTA_DEVORA.costas.vida, largura: 0.6 }) }
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
      // a música: a de batalha nas hordas; a do chefe já no ronco do chão (antes de ele sair)
      if (ondas) { S.etapa = 'comeca'; S.t = TEMPO.comeca; musica('batalha') } else { chefe(ag); S.etapa = 'ronco'; S.t = TEMPO.chefeRonco; musica('devorador') }
    } else if ((S.etapa === 'comeca' || S.etapa === 'entre') && (S.t -= dt) <= 0) { onda(S.arena, S.onda, ag); S.etapa = 'onda' }
    else if (S.etapa === 'onda' && !S.fila.length && daOnda.every((v) => v.morto >= 0)) {
      S.onda++; J.darKit(KITS.porOnda) // a onda limpa dá um kit
      if (S.onda < ondas.length) { S.etapa = 'entre'; S.t = TEMPO.entre }
      else { fecha(S.arena, false); S.arena++; S.onda = 0; S.etapa = 'fora'; musica(null) } // a arena abriu: a música some
    } else if (S.etapa === 'ronco' && (S.t -= dt) <= 0) {
      const v = vivos.current.find((x) => x.tipo === 'devora')
      if (v && v.tipo === 'devora') { v.d.root.rotation.y = Math.atan2(ag.x - v.d.root.position.x, ag.z - v.d.root.position.z); emergir(v.d) }
      S.etapa = 'chefe'; S.horda = HORDA_CHEFE.cada
    } else if (S.etapa === 'chefe' && A.pode() && (S.horda -= dt) <= 0) { // a horda da luta do chefe, a cada 20 s
      S.horda = HORDA_CHEFE.cada
      const tipos = [...Array(HORDA_CHEFE.assombrados).fill('assombrado'), ...Array(HORDA_CHEFE.asas).fill('asa')] as ('assombrado' | 'asa')[]
      tipos.forEach((tipo) => { const p = pertoDoAgente(ag, J.mundo); if (p && cabeCria()) surgir(tipo, p, ag, true) })
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
        if (v.tipo === 'devora' && v.d.anim.fase < 3) { v.vida = LUTA_DEVORA.vida - v.d.anim.fase * BARRA; faseDevora(v.d, v.d.anim.fase + 1); atordoar(v.d) } // a barra zerou: tonto, e a próxima fase
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
        const andar = vivo ? pensarAssombrado(v.a, A, bando, J.mundo, dt, mira.de) : 0
        const s = animarAssombrado(v.a, { andar }, dt)
        if (!v.a.anim.voo) andarNoMundo(v.a.root, s.avanca * dt, J.mundo, LUTA_ASSOMBRADO.raio)
        if (vivo && !v.a.anim.voo && !v.a.anim.surgir) bandoRaizes.push(v.a.root)
        ouvirAssombrado(v.a, dt)
      } else if (v.tipo === 'asa') {
        const quer = vivo ? pensarAsa(v.a, A, mira, area, J.mundo, dt, peito) : undefined
        const s = animarAsaSombria(v.a, { alvo: quer }, dt), r = v.a.root
        r.position.addScaledVector(_v.set(Math.cos(r.rotation.y), 0, -Math.sin(r.rotation.y)), s.lado * dt) // o desvio
        r.position.addScaledVector(_v.set(Math.sin(r.rotation.y), 0, Math.cos(r.rotation.y)), -s.recua * dt) // o recuo do cuspe
        if (s.cospe && quer) disparar(P, s.cospe, quer)
        ouvirAsaSombria(v.a, dt)
      } else {
        const F = efeitos.current
        const pedido = vivo && S.etapa === 'chefe' ? pensarDevora(v.d, A, pontos.arenas.get(3) ?? null, dt) : {}
        if (pedido.chuva && F) chuvaDeTentaculos(F, pedido.chuva)
        pedido.doChao?.forEach((p) => { if (cabeCria()) surgir('assombrado', p, ag, true) })
        const s = animarDevora(v.d, dt), r = v.d.root
        r.position.y = s.y
        r.position.x += Math.sin(r.rotation.y) * s.avanca * dt; r.position.z += Math.cos(r.rotation.y) * s.avanca * dt
        if (s.rompe) estourar(E, _v.set(Math.sin(r.rotation.y), 0, Math.cos(r.rotation.y)).multiplyScalar(0.8 * ESCALA).add(r.position).setY(0.05), RESPINGO.raio, 0, { cubos: 18, olhos: 0, mancha: false, tamanho: 2 * RESPINGO.cubos })
        golpesDoDevora(v.d, s, A, dt)
        if (s.cria) cria(s.cria)
        ouvirDevora(v.d, s, dt); tremorDoDevora(v.d, s) // os sons e o tremor da tela, no momento da animação
        if (F) {
          if (S.etapa === 'chefe' && vivo) passoPocas(F, A, dt)
          passoEfeitosDevora(F, v.d, 0, dt, E)
          for (const p of F.sons.aviso) somEm(p, avisoChuva, 4)
          for (const p of F.sons.rompe) { somEm(p, tentaculo, 4); tentaculoAcerta(p, A); tremerDe(p, TREMOR.leve, 0.35) } // a chuva e as poças
          // o rastro de gosma: pisando, fica lento
          if (A.pode() && F.gotas.some((g) => g.t < GOSMA.dura && Math.hypot(g.p.x - ag.x, g.p.z - ag.z) < g.tam * 0.45)) J.lentidao(LUTA_DEVORA.rastro.lento, 0.3)
        }
      }
    }
    separar(bandoRaizes, LUTA_ASSOMBRADO.separa)
    // quem pode levar tiro agora (as balas do agente usam no próximo quadro)
    J.alvos.length = 0
    for (const v of vivos.current) {
      v.recente *= Math.exp(-dt / LUTA_DEVORA.atordoa.some); v.tonto -= dt
      alvosDe(v, J.alvos)
    }
    if (dep) { if (dep.vidas) barrasDeVida(vidas); desenharDepuracao(dep, J.alvos, vidas, camera) } // desligada, só esconde
    // os projéteis: andam, batem no chão, ou acertam o agente
    passoProjeteis(P, dt, E, 0)
    if (A.pode()) { const onde = acertar(P, peito.copy(ag).setY(ag.y + 1.2), LUTA_ASA.acerto, E, 0); if (onde) J.ferir(LUTA_ASA.dano, onde) }
    for (const p of P.bateu) somEm(p, bolaBatendo)
    // os estourados saem depois de um tempo (o som do estouro e a mancha ficam)
    vivos.current = vivos.current.filter((v) => { if (v.morto < TEMPO.some) return true; tirar(v); return false })
    passoEstouro(E, dt)

    // ---------- o que a tela mostra ----------
    const N = ondas?.length ?? 0, quantos = daOnda.filter((v) => v.morto < 0).length + S.fila.length
    // as barras do chefe: cada uma é um terço da vida (a da direita esvazia primeiro)
    const dev = vivos.current.find((v) => v.tipo === 'devora')
    const chefeHud: ChefeHud | undefined = dev && dev.morto < 0 && (S.etapa === 'chefe' || S.etapa === 'ronco')
      ? { nome: 'O Devora almas', barras: [0, 1, 2].map((i) => Math.round(Math.max(0, Math.min(1, (dev.vida - i * BARRA) / BARRA)) * 100) / 100) } : undefined
    const texto: TextoRoteiro | null =
      S.etapa === 'fora' ? (S.arena === 1 ? null : { titulo: S.arena === 3 ? 'A passagem abriu: a arena do chefe à frente' : 'A passagem abriu: atravesse a ponte' })
      : S.etapa === 'comeca' ? { titulo: `Arena ${S.arena} · a arena fechou` }
      : S.etapa === 'entre' ? { titulo: `Arena ${S.arena} · onda ${S.onda + 1} de ${N} a caminho` }
      : S.etapa === 'onda' ? { titulo: `Arena ${S.arena} · onda ${S.onda + 1} de ${N} · ${quantos} ${quantos === 1 ? 'Sombrio' : 'Sombrios'}`, dica: DICA_H }
      : S.etapa === 'ronco' ? { titulo: 'O chão treme…', dica: DICA_CHEFE, chefe: chefeHud }
      : S.etapa === 'chefe' ? { titulo: 'Arena 3 · derrote o chefe', dica: DICA_CHEFE, chefe: chefeHud }
      : { titulo: 'Fim da demo · obrigado por jogar', dica: 'Esc volta ao menu' }
    const chave = texto ? texto.titulo + '|' + (texto.dica ?? '') + '|' + (texto.chefe?.barras.join() ?? '') : ''
    if (chave !== S.texto) { S.texto = chave; avisa.current(texto) }
  })
  return null
}
