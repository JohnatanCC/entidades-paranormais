// As entidades do mapa ganham vida no Testar (a aba Entidades do criador de mapas: os pontos kind 'entidade'). Fica
// dentro do <Canvas>, ao lado do agente, e usa o controle dele (AgenteNaFase): fere, e entra na lista do que leva tiro.
//   Gralha: pousada no ponto, a cabeça virando aos trancos; viu o agente (perto e sem nada no meio), levanta voo e caça:
//     rodeia ele por cima e mergulha de tempos em tempos (gralha/ia.ts); morre com tiros (estoura em fumaça e penas).
//     Longe demais, desiste e volta a pousar no lugar dela.
//   Mestre: levita no ponto, olhando para onde o mapa diz; viu o agente, vira para ele e grita (a tela treme): o manto
//     abre e sai o corvo gigante de sombra, que voa reto e explode (em 2 s ou ao bater), soltando 3 Gralhas que caçam o
//     agente. Depois do grito ele corre atrás do agente (desviando das paredes) e, perto, morde. Longe demais, volta para
//     o lugar dele; as Gralhas do corvo, longe demais, se desfazem. Tiro não faz nada nele (o maior é capturado, não
//     morto): a bala passa por ele e ele "falha" (mestre/glitch.ts), sem parar; levar tiro parado o acorda. O que o afasta
//     é a luz: no feixe da lamparina erguida (sem parede no meio), ele se cobre e recua; fora dela, volta a caçar.
//   Mãe: parada no ponto, cantarolando e procurando; viu o agente, para, vira para ele e grita; depois caça andando atrás
//     dele. A meia distância, de frente, às vezes dá a carga (agacha, guincha e dispara em linha reta); chegando perto,
//     a sequência: aproxima aos trancos, três garradas (a última fica mais) e fica exausta (a janela para atirar). Longe
//     demais, volta para o lugar dela. Na mansão ela é imortal (docs/jogo.md): o tiro tira uma vida que não aparece (a
//     barra só aparece na luta do chefe); zerada, ela cai atordoada e, quando levanta, a vida volta cheia e ela continua
//     (sempre uma ameaça no mapa). Levar tiro parada a acorda. A patrulha, a escuta e o abaixar nas portas vêm com a etapa
//     da Mãe perseguidora (docs/lancamento.md).
// Com mais de um jogador (fase.jogadores: o agente e, no Testar, o boneco da Lara, tecla L), cada uma acorda ao ver
// qualquer um e ataca quem o foco escolhe (foco.ts: o mais perto ou quem bate nela sem parar). No teste online (rede),
// o host pensa (pensar) e conta ao convidado, que só copia (copiar): docs/teste-online.md.
// Enquanto alguém caça, toca a música da perseguição (a da Mãe na frente da das Gralhas); quando para, a de antes volta.
import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { faixaAtual, musica, type Faixa } from '../../audio/musica'
import { KIND_ENTIDADE } from '../../maps/entidades'
import type { Chunk } from '../../maps/types'
import { estourar, novoEstouro, passoEstouro } from '../enemies/estouro'
import { animarGralha, atacar, estourarGralha, ferir as ferirGralha, pousar } from '../enemies/gralha/animacao'
import { novosEfeitosGralha, passoEfeitosGralha } from '../enemies/gralha/efeitos'
import { novaCacadora, perseguir, type Cacadora } from '../enemies/gralha/ia'
import { montarGralha, type Gralha } from '../enemies/gralha/modelo'
import { ATAQUE } from '../enemies/gralha/numeros'
import { ouvirGralha } from '../enemies/gralha/sons'
import { andarNoMundo, girarPara } from '../enemies/luta'
import { animarMae, golpear } from '../enemies/mae/animacao'
import type { NomeGolpe } from '../enemies/mae/golpes'
import { montarMae, type Mae } from '../enemies/mae/modelo'
import { GOLPE } from '../enemies/mae/numeros'
import { pararSonsMae } from '../enemies/mae/sons'
import { animarMestre, cobrir, correr, gritar, morder } from '../enemies/mestre/animacao'
import { descartarCorvo, novoCorvo, passoCorvo, soltarCorvo, type Corvo } from '../enemies/mestre/corvo'
import { descartarFumaca } from '../enemies/mestre/fumaca'
import { montarMestre, type Mestre } from '../enemies/mestre/modelo'
import { antesDoGlitch, glitchar, passoGlitch } from '../enemies/mestre/glitch'
import { CORRIDA, CORVO, MORDIDA } from '../enemies/mestre/numeros'
import { corvoExplodindo, ouvirCorvo, ouvirMestre } from '../enemies/mestre/sons'
import { calar, somEm } from '../enemies/sons'
import { tremerDe } from '../player/tremor'
import { piscar, soltarGolpe } from '../../render/golpe'
import type { AgenteNaFase } from '../Testar'
import type { Alvejavel } from '../weapons/bala'
import { alcanceCamera } from '../world/colisao'
import type { Conexao } from '../rede/conexao'
import { RITMO, SEGUE } from '../rede/numeros'
import { r2, type AcaoEntidade, type Msg, type QualEntidade } from '../rede/mensagens'
import { ameaca, bateu, focar, novoFoco, type Foco, type Jogador } from './foco'
import { ganchos } from '../../dev/ganchos'
import { naLuz } from './luz'
import { MAE, MESTRE, MUSICA, VISTA } from './numeros'

/** Uma Gralha: onde ela pousa (as do corvo não pousam: se desfazem), o modelo, a caçada (null = parada), a caixa do tiro
 *  e o foco (quem ela caça). */
interface GralhaViva { casa: THREE.Vector3 | null; vira: number; g: Gralha; caca: Cacadora | null; alvo: Alvejavel; morta: boolean; foco: Foco }
/** Um Mestre: o lugar dele, o modelo, o corvo e as 3 Gralhas que o corvo solta; o estado da caçada. */
interface MestreVivo {
  casa: THREE.Vector3; vira: number; m: Mestre; C: Corvo; filhas: GralhaViva[]; foco: Foco
  estado: 'espera' | 'grito' | 'caca' | 'volta'; descanso: number // s até poder morder de novo
  alvo: Alvejavel // a caixa do tiro (a bala atravessa: ele só falha)
}

/** A Mãe: o lugar dela, o modelo, o estado da caçada, a fila da sequência de golpes, quando pode dar a carga de novo,
 *  se o golpe em curso já pegou o agente (cada golpe pega uma vez) e onde ela o viu por último. */
interface MaeViva {
  casa: THREE.Vector3; vira: number; m: Mae
  estado: 'espera' | 'grito' | 'caca' | 'volta'; fila: NomeGolpe[]; carga: number; pegou: object | null
  visto: THREE.Vector3; semVer: number // onde viu o agente por último e há quantos s não vê
  vida: number; tonta: boolean; alvo: Alvejavel // a vida (escondida), se está atordoada e a caixa do tiro
  foco: Foco // quem ela caça
}
/** A sequência de perto (docs/jogo.md, a fase 1 sem o Luto: na casa não tem poça). */
const SEQUENCIA: NomeGolpe[] = ['garra_d', 'garra_e', 'garra_ultima_d', 'exausta']

const _olho = new THREE.Vector3(), _peito = new THREE.Vector3(), _c = new THREE.Vector3(), _d = new THREE.Vector3()


/** Vê o jogador? Perto e sem parede (nem porta fechada, nem móvel alto) no meio. */
function ve(j: Jogador, mundo: AgenteNaFase['mundo'], de: THREE.Vector3, alcance: number) {
  const a = j.p
  if (Math.hypot(a.x - de.x, a.z - de.z) > alcance || Math.abs(a.y - de.y) > 2.5) return false
  _peito.set(a.x, a.y + 1.3, a.z)
  return alcanceCamera(mundo, de, _peito, 0.02) > 0.98
}
/** Vê algum jogador? O primeiro que ela vê (ou null). */
const veAlguem = (fase: AgenteNaFase, de: THREE.Vector3, alcance: number) => fase.jogadores.find((j) => ve(j, fase.mundo, de, alcance)) ?? null

export function Entidades({ chunks, fase, rede }: { chunks: Chunk[]; fase: AgenteNaFase; rede?: Conexao }) {
  const scene = useThree((s) => s.scene)
  const pontos = useMemo(() => chunks.flatMap((c) => c.points.filter((p) => p.kind === KIND_ENTIDADE)), [chunks])
  const E = useMemo(() => novosEfeitosGralha(), []), estouro = useMemo(() => novoEstouro(), [])
  // quem atirou: o agente (o boneco da Lara não atira); no online, a bala do outro chega pelo 'acerto' (quemAtira)
  const quemAtira = useRef<Jogador | null>(null)
  const atirador = () => quemAtira.current ?? fase.jogadores[0]

  // ---------- o teste online (game/rede) ----------
  // o host pensa e conta: o retrato do mundo (15/s) e os instantes (ev); o convidado copia (copiar) e pede os acertos
  const redeRef = useRef(rede); redeRef.current = rede
  const listas = useRef<{ maes: MaeViva[]; mestres: MestreVivo[]; gralhas: GralhaViva[] } | null>(null)
  const indice = (k: QualEntidade, x: object) => { const L = listas.current!; return (k === 'm' ? L.maes : k === 's' ? L.mestres : L.gralhas).indexOf(x as never) }
  /** O host conta ao convidado o que aconteceu num instante. */
  const ev = (k: QualEntidade, x: object, a: AcaoEntidade, v?: string) => { const r = redeRef.current; if (r?.papel === 'host') r.enviar({ t: 'ev', k, i: indice(k, x), a, v }) }
  /** O convidado: a bala dele pegou a entidade; quem decide é o host. true = pediu (quem chamou para aqui). */
  const pediu = (k: QualEntidade, x: object, dano: number) => { const r = redeRef.current; if (r?.papel !== 'convidado') return false; r.enviar({ t: 'acerto', k, i: indice(k, x), dano }); return true }
  const golpeMae = (M: MaeViva, nome: NomeGolpe) => { golpear(M.m, nome); ev('m', M, 'g', nome) }
  const cortarMae = (M: MaeViva) => { M.m.anim.golpe = null; ev('m', M, 'x') }
  const gritoMestre = (M: MestreVivo) => { gritar(M.m); ev('s', M, 'grito') }
  const mordidaMestre = (M: MestreVivo) => { morder(M.m); ev('s', M, 'morde') }
  const glitchMestre = (M: MestreVivo) => { glitchar(M.m); ev('s', M, 'glitch') }

  /** Uma Gralha nova (pousada na casa, ou escondida esperando o corvo, se casa = null). */
  function novaGralha(casa: THREE.Vector3 | null, vira: number): GralhaViva {
    const g = montarGralha()
    const v: GralhaViva = { casa, vira, g, caca: null, morta: !casa, foco: novoFoco(), alvo: { c: new THREE.Vector3(), m: new THREE.Vector3(0.3, 0.25, 0.3), acerta: () => {} } }
    if (casa) { g.root.position.copy(casa); g.root.rotation.y = vira; pousar(g, true) } else g.root.visible = false
    v.alvo.acerta = (dano) => {
      if (v.morta || pediu('g', v, dano)) return
      bateu(v.foco, atirador(), dano)
      const morreu = ferirGralha(g, E, v.casa?.y ?? 0)
      ev('g', v, morreu ? 'estoura' : 'ferida')
      if (morreu) { estourarGralha(g, E, v.casa?.y ?? 0); v.morta = true; calar(g) }
      else if (!v.caca) acordar(v) // atirou nela pousada: ela levanta e caça
    }
    return v
  }
  function acordar(v: GralhaViva) {
    pousar(v.g, false)
    v.caca = novaCacadora(v.g, v.g.root.position, _c.set(0, 2.5, 0), Math.random() * Math.PI * 2)
  }

  // todos montados uma vez: as Gralhas do mapa pousadas; os Mestres, cada um com o corvo e as 3 Gralhas dele escondidas
  const { gralhas, mestres, maes } = useMemo(() => {
    const ang = (p: (typeof pontos)[number]) => (Number(p.params?.vira ?? 0) * Math.PI) / 180
    const gralhas = pontos.filter((p) => p.params?.tipo === 'gralha').map((p) => novaGralha(new THREE.Vector3(...p.pos), ang(p)))
    const mestres = pontos.filter((p) => p.params?.tipo === 'mestre').map((p): MestreVivo => {
      const m = montarMestre(), casa = new THREE.Vector3(...p.pos)
      m.root.position.copy(casa); m.root.rotation.y = ang(p)
      const filhas = Array.from({ length: CORVO.gralhas }, () => novaGralha(null, 0))
      gralhas.push(...filhas)
      const M: MestreVivo = { casa, vira: ang(p), m, C: novoCorvo(), filhas, foco: novoFoco(), estado: 'espera', descanso: 0, alvo: { c: new THREE.Vector3(), m: new THREE.Vector3(0.45, 1.1, 0.45), atravessa: true, acerta: () => {} } }
      // o tiro não fere, mas irrita: quem atira puxa o foco dele
      M.alvo.acerta = (dano) => { if (pediu('s', M, dano)) return; glitchMestre(M); bateu(M.foco, atirador(), dano); if (M.estado === 'espera') { M.estado = 'grito'; gritoMestre(M) } }
      return M
    })
    const maes = pontos.filter((p) => p.params?.tipo === 'mae').map((p): MaeViva => {
      const m = montarMae(), casa = new THREE.Vector3(...p.pos)
      m.root.position.copy(casa); m.root.rotation.y = ang(p)
      const M: MaeViva = { casa, vira: ang(p), m, estado: 'espera', fila: [], carga: 0, pegou: null, visto: new THREE.Vector3(), semVer: 0, vida: MAE.vida, tonta: false, foco: novoFoco(), alvo: { c: new THREE.Vector3(), m: new THREE.Vector3(0.45, 1.15, 0.45), acerta: () => {} } }
      M.alvo.acerta = (dano) => {
        if (pediu('m', M, dano)) return
        if (M.tonta) return // caída, o tiro não tira mais nada (ela é imortal: só atordoa)
        piscar(m.root); ev('m', M, 'p')
        const quem = atirador()
        bateu(M.foco, quem, dano)
        // levou tiro sem ter visto: acorda, olha para quem atirou e grita (e é ele que ela caça)
        if (M.estado === 'espera' || M.estado === 'volta') { M.estado = 'grito'; golpeMae(M, 'grito'); M.visto.copy(quem.p); M.semVer = 0; M.foco.alvo = quem; M.foco.no = 0 }
        if ((M.vida -= dano) <= 0) { M.vida = 0; M.tonta = true; M.fila = []; M.estado = 'caca'; golpeMae(M, 'atordoada') }
      }
      return M
    })
    return { gralhas, mestres, maes }
  }, [pontos, E])
  listas.current = { maes, mestres, gralhas }
  const retrato = useRef<Extract<Msg, { t: 'mundo' }> | null>(null), envio = useRef(0)
  const musicaAntes = useRef<Faixa | null>(null), semCaca = useRef(0), tocando = useRef<Faixa | false>(false)

  // as provas (só no npm run dev): provas.foco() diz quem cada uma caça e a ameaça de cada jogador
  useEffect(() => {
    if (!import.meta.env.DEV) return
    const de = (quem: string, estado: string, f: Foco, p: THREE.Vector3) => ({
      quem, estado, alvo: f.alvo?.nome ?? null,
      ameaca: Object.fromEntries(fase.jogadores.map((j) => [j.nome, Math.round(ameaca(f, j, p, VISTA.larga))])),
    })
    ganchos.foco = () => [
      ...maes.map((M) => de('Mãe', M.estado, M.foco, M.m.root.position)),
      ...mestres.map((M) => de('Mestre', M.estado, M.foco, M.m.root.position)),
      ...gralhas.filter((v) => !v.morta).map((v) => de('Gralha', v.g.anim.pousada ? 'pousada' : 'caca', v.foco, v.g.root.position)),
    ]
    return () => { delete ganchos.foco }
  }, [fase, maes, mestres, gralhas])

  // tudo entra na cena; saindo do Testar, sai, cala e a música volta
  useEffect(() => {
    scene.add(E.grupo, estouro.grupo)
    for (const v of gralhas) scene.add(v.g.root)
    for (const M of mestres) scene.add(M.m.root, M.C.g.root)
    for (const M of maes) scene.add(M.m.root, M.m.efeitos.grupo)
    for (const M of [...maes, ...mestres]) fase.alvos.push(M.alvo)
    return () => {
      for (const M of maes) { scene.remove(M.m.root, M.m.efeitos.grupo); pararSonsMae(M.m); soltarGolpe(M.m.root) }
      for (const M of [...maes, ...mestres]) { const k = fase.alvos.indexOf(M.alvo); if (k >= 0) fase.alvos.splice(k, 1) }
      scene.remove(E.grupo, estouro.grupo)
      for (const v of gralhas) { scene.remove(v.g.root); calar(v.g) }
      for (const M of mestres) { scene.remove(M.m.root, M.C.g.root); calar(M.m); calar(M.C); descartarFumaca(M.m.fumaca); descartarCorvo(M.C) }
      const i = new Set(gralhas.map((v) => v.alvo)), lista = fase.alvos
      for (let k = lista.length - 1; k >= 0; k--) if (i.has(lista[k])) lista.splice(k, 1)
      if (tocando.current) { musica(musicaAntes.current); tocando.current = false } // saiu do Testar: a perseguição para
    }
  }, [scene, E, estouro, gralhas, mestres, maes, fase])

  /** Um quadro pensando (sozinho ou no host): cada uma vê, caça e ataca. Devolve quem está caçando (a música). */
  function pensar(dt: number) {
    const mundo = fase.mundo, jogadores = fase.jogadores
    let cacando = false, maeCacando = false

    // ---------- as Mães ----------
    for (const M of maes) {
      const m = M.m, r = m.root, g = m.anim.golpe
      _olho.set(r.position.x, r.position.y + 1.9, r.position.z)
      // quem ela caça (A): o foco pesa a distância, o dano e se ela vê cada um
      const A = focar(M.foco, jogadores, r.position, VISTA.larga, dt, (j) => ve(j, mundo, _olho, VISTA.larga)), agente = A.p
      const longe = Math.hypot(agente.x - r.position.x, agente.z - r.position.z)
      const quer = Math.atan2(agente.x - r.position.x, agente.z - r.position.z)
      const erro = Math.abs(Math.atan2(Math.sin(quer - r.rotation.y), Math.cos(quer - r.rotation.y)))
      M.carga = Math.max(0, M.carga - dt)
      // levantou da atordoada: a vida volta cheia
      if (M.tonta && g?.nome !== 'atordoada') { M.tonta = false; M.vida = MAE.vida }
      if (M.estado === 'espera') {
        const viu = veAlguem(fase, _olho, VISTA.mae)
        if (viu) { M.estado = 'grito'; golpeMae(M, 'grito'); M.visto.copy(viu.p); M.semVer = 0; M.foco.alvo = null }
      } else if (M.estado === 'grito') {
        maeCacando = true
        girarPara(r, agente.x, agente.z, MAE.vira, dt)
        if (!g) { M.estado = 'caca'; M.carga = MAE.cargaPrimeira }
      } else if (M.estado === 'caca') {
        maeCacando = true
        // vendo o agente, vai atrás dele e ataca; sem ver (dobrou um canto, fechou a porta), vai até onde o viu por último;
        // sem ver por muito tempo, ou longe demais, desiste (achar o caminho pela casa vem com a Mãe perseguidora)
        const vendo = ve(A, mundo, _olho, VISTA.larga)
        if (vendo) { M.visto.copy(agente); M.semVer = 0 } else M.semVer += dt
        // a sequência é de perto: o agente fugiu, ela para de golpear o ar
        if (M.fila.length && (longe > MAE.garra + MAE.foge || !vendo)) M.fila = []
        if (M.tonta) { /* caída: espera levantar */ }
        else if (longe > VISTA.larga || M.semVer > MAE.perde || !A.pode()) { M.estado = 'volta'; M.fila = []; cortarMae(M) }
        else if (!g) {
          const ataca = vendo && erro < MAE.mira
          if (M.fila.length) { M.pegou = null; golpeMae(M, M.fila.shift()!) } // a sequência continua
          else if (ataca && longe < MAE.garra) { M.fila = [...SEQUENCIA]; M.pegou = null; golpeMae(M, M.fila.shift()!) }
          else if (ataca && longe < MAE.aproxima) { M.pegou = null; golpeMae(M, 'aproximar') }
          else if (ataca && longe > MAE.cargaDe[0] && longe < MAE.cargaDe[1] && M.carga <= 0) { M.pegou = null; M.carga = MAE.cargaCada; golpeMae(M, 'carga') }
          else { // anda até ele (ou até onde o viu); muito de lado, vira primeiro
            const ate = Math.hypot(M.visto.x - r.position.x, M.visto.z - r.position.z)
            const resto = girarPara(r, M.visto.x, M.visto.z, MAE.vira, dt)
            if (Math.abs(resto) < MAE.freia && ate > MAE.encosta) andarNoMundo(r, Math.min(MAE.anda * dt, ate - MAE.encosta), mundo, MAE.raio)
          }
        } else if (g.nome === 'aproximar' || (g.nome.startsWith('garra') && g.t < GOLPE.garra.preparo)) {
          girarPara(r, agente.x, agente.z, MAE.vira * 0.6, dt) // ajusta a mira até o corte sair; a carga vai reta
        }
      } else if (M.estado === 'volta') {
        if (Math.hypot(M.casa.x - r.position.x, M.casa.z - r.position.z) > 0.3) { girarPara(r, M.casa.x, M.casa.z, MAE.vira, dt); andarNoMundo(r, MAE.volta * dt, mundo, MAE.raio) }
        else {
          const falta = Math.atan2(Math.sin(M.vira - r.rotation.y), Math.cos(M.vira - r.rotation.y))
          r.rotation.y += falta * (1 - Math.exp(-3 * dt))
          if (Math.abs(falta) < 0.05) M.estado = 'espera'
        }
        const viu = veAlguem(fase, _olho, VISTA.mae)
        if (viu) { M.estado = 'grito'; golpeMae(M, 'grito'); M.foco.alvo = null }
      }
      const s = animarMae(m, { perto: longe, caca: M.estado !== 'espera' }, dt)
      // o golpe empurra ela para a frente (com as paredes), sem atravessar o agente
      if (s.avanca) andarNoMundo(r, s.avanca > 0 ? Math.min(s.avanca * dt, Math.max(0, longe - MAE.encosta)) : s.avanca * dt, mundo, MAE.raio)
      r.position.y = M.casa.y + s.y
      M.alvo.c.set(r.position.x, r.position.y + 1.1, r.position.z)
      // o que pega: o corte da garra (logo depois do aviso, perto e na frente dela) e a carga correndo (encostou)
      const h = m.anim.golpe
      if (h && M.pegou !== h && A.pode()) {
        const corte = h.nome.startsWith('garra') && h.t > GOLPE.garra.preparo && h.t < GOLPE.garra.preparo + MAE.corte
        const corre = h.nome === 'carga' && h.t > GOLPE.carga.prepara && h.t < GOLPE.carga.prepara + GOLPE.carga.corre
        if ((corte && longe < MAE.garra + 0.3 && erro < 1.1) || (corre && longe < MAE.encosta + 0.25)) {
          M.pegou = h
          A.ferir(corte ? MAE.danoGarra : MAE.danoCarga, _c.copy(r.position).setY(r.position.y + 1.3))
        }
      }
    }

    // ---------- os Mestres ----------
    for (const M of mestres) {
      const m = M.m, r = m.root, A = m.anim
      _olho.set(r.position.x, r.position.y + 1.7, r.position.z)
      const alvo = focar(M.foco, jogadores, r.position, VISTA.larga, dt, (j) => ve(j, mundo, _olho, VISTA.larga)), agente = alvo.p
      const longe = Math.hypot(agente.x - r.position.x, agente.z - r.position.z)
      // a luz de uma lamparina erguida nele: cobre-se e recua (no grito, não: ele termina de gritar)
      const luz = !A.grito && !!naLuz(jogadores, mundo, _peito.set(r.position.x, r.position.y + 1.3, r.position.z))
      if (luz !== A.coberto) cobrir(m, luz)
      if (M.estado === 'espera') {
        const viu = luz ? null : veAlguem(fase, _olho, VISTA.mestre)
        if (luz) M.estado = 'caca' // a luz nele parado: acorda já se cobrindo
        else if (viu) { M.estado = 'grito'; gritoMestre(M); M.foco.alvo = null }
      } else if (M.estado === 'grito') {
        cacando = true
        girarPara(r, agente.x, agente.z, MESTRE.vira, dt) // de frente para o agente enquanto grita
        if (!A.grito) { M.estado = 'caca'; correr(m, true) }
      } else if (M.estado === 'caca') {
        cacando = true
        M.descanso = Math.max(0, M.descanso - dt)
        if (longe > VISTA.larga || !alvo.pode()) { M.estado = 'volta'; correr(m, false) }
        else if (A.coberto) { correr(m, false); girarPara(r, agente.x, agente.z, MESTRE.vira, dt) } // coberto: recua de frente para a luz
        else if (!A.mordida) {
          // de lado para o agente, freia e vira no lugar (correndo de lado ele ficaria rodando em volta); de frente, corre
          // até o alcance e morde
          girarPara(r, agente.x, agente.z, MESTRE.vira, dt)
          const quer = Math.atan2(agente.x - r.position.x, agente.z - r.position.z)
          const erro = Math.abs(Math.atan2(Math.sin(quer - r.rotation.y), Math.cos(quer - r.rotation.y)))
          if (longe < MORDIDA.alcance) {
            correr(m, false)
            if (M.descanso <= 0 && erro < MESTRE.mira) { mordidaMestre(M); M.descanso = MESTRE.descanso }
          } else if (erro > MESTRE.freia) correr(m, false)
          else { correr(m, true); andarNoMundo(r, Math.min(CORRIDA.vel * dt, longe - MESTRE.encosta), mundo, MESTRE.raio) }
        }
      } else if (M.estado === 'volta') {
        // volta devagar para o lugar dele e espera de novo, de frente para onde estava
        if (Math.hypot(M.casa.x - r.position.x, M.casa.z - r.position.z) > 0.3) { girarPara(r, M.casa.x, M.casa.z, MESTRE.vira, dt); andarNoMundo(r, MESTRE.volta * dt, mundo, MESTRE.raio) }
        else {
          const falta = Math.atan2(Math.sin(M.vira - r.rotation.y), Math.cos(M.vira - r.rotation.y))
          r.rotation.y += falta * (1 - Math.exp(-3 * dt))
          const viu = veAlguem(fase, _olho, VISTA.mestre)
          if (viu) { M.estado = 'grito'; gritoMestre(M); M.foco.alvo = null }
          else if (Math.abs(falta) < 0.05) M.estado = 'espera'
        }
      }
      antesDoGlitch(m)
      const s = animarMestre(m, dt)
      passoGlitch(m, dt)
      M.alvo.c.set(r.position.x, r.position.y + 1.2, r.position.z)
      // o bote da mordida avança; o recuo da luz recua (com as paredes)
      // (o bote para encostado no agente: não atravessa ele)
      const bote = longe > MESTRE.encosta ? s.avanca : 0
      andarNoMundo(r, (bote - s.recua) * dt, mundo, MESTRE.raio)
      if (s.mordeu && alvo.pode() && longe < MORDIDA.alcance + MESTRE.folgaMordida) alvo.ferir(MORDIDA.dano, _c.copy(r.position).setY(r.position.y + 1.4))
      ouvirMestre(m, dt)
      // o grito solta o corvo para a frente; ele explode em 2 s ou ao bater numa parede, soltando as 3 Gralhas
      if (s.solta) soltarCorvo(M.C, s.solta, _d.set(Math.sin(r.rotation.y), 0, Math.cos(r.rotation.y)))
      const onde = passoCorvo(M.C, dt, (de, para) => alcanceCamera(mundo, de, para, 0.15) < 1)
      ouvirCorvo(M.C)
      if (onde) {
        somEm(onde, corvoExplodindo, 4)
        estourar(estouro, onde, 1, 0, { cubos: 45, olhos: 0, pano: 0 })
        tremerDe(onde, CORVO.tremor, 0.5)
        const rumo = M.C.g.root.rotation.y
        M.filhas.forEach((v, i) => {
          const a = rumo + Math.PI + (i - 1) * 1.3 // saem da explosão abrindo, de volta para o agente
          v.morta = false; v.g.root.visible = true; pousar(v.g, false)
          v.caca = novaCacadora(v.g, onde, _c.set(Math.sin(a) * CORVO.espalha, 1.2, Math.cos(a) * CORVO.espalha), (i * Math.PI * 2) / M.filhas.length, 2 + i * 1.3)
        })
      }
    }

    // ---------- as Gralhas ----------
    for (const v of gralhas) {
      if (v.morta) continue
      const g = v.g, r = g.root
      if (!v.caca) {
        // pousada: olha em volta; viu alguém, levanta voo
        g.corpo.getWorldPosition(_olho)
        const viu = veAlguem(fase, _olho, VISTA.gralha)
        if (viu) { acordar(v); v.foco.alvo = null }
      } else {
        cacando = true
        // quem ela caça (sem pesar a visão: voa por cima, e são muitas; a linha de visão é cara)
        const A = focar(v.foco, jogadores, r.position, VISTA.larga, dt), agente = A.p
        const ia = g.anim.ataque
        perseguir(v.caca, agente, dt)
        if (!ia && g.anim.ataque) ev('g', v, 'ataca') // o mergulho começou
        if (Math.hypot(agente.x - r.position.x, agente.z - r.position.z) > VISTA.larga || !A.pode()) {
          if (!v.casa) { // as do corvo se desfazem em fumaça
            estourar(estouro, r.position, 0.3, 0, { cubos: 10, olhos: 0, pano: 0, mancha: false })
            v.morta = true; v.caca = null; r.visible = false; calar(g); ev('g', v, 'some'); continue
          }
          // as do mapa voltam e pousam no lugar delas
          r.position.lerp(v.casa, 1 - Math.exp(-1.5 * dt))
          if (r.position.distanceTo(v.casa) < 0.3) { v.caca = null; r.position.copy(v.casa); r.rotation.y = v.vira; pousar(g, true) }
        }
      }
      // a bicada: pega quem estiver perto do bico (o peito de qualquer um)
      if (animarGralha(g, dt)) {
        g.bico.getWorldPosition(_c)
        for (const j of jogadores) if (j.pode() && _c.distanceTo(_peito.set(j.p.x, j.p.y + ATAQUE.altura, j.p.z)) < ATAQUE.alcance + 0.5) j.ferir(ATAQUE.dano, _c)
      }
      ouvirGralha(g, dt, !!v.caca)
    }
    return { cacando, maeCacando }
  }

  /** Um quadro copiando o host (o convidado): cada uma vai para onde o retrato diz (deslizando) e anima; os instantes
   *  (o golpe, o grito, o estouro) chegam pelo ev. O corvo do Mestre voa aqui mesmo (sai no mesmo ponto do grito); as
   *  Gralhas que ele solta vêm pelo retrato. Devolve quem está caçando (a música). */
  function copiar(dt: number) {
    const R = retrato.current, k = 1 - Math.exp(-SEGUE.entidades * dt), kg = 1 - Math.exp(-SEGUE.entidades * 1.5 * dt), eu = fase.agente.root.position
    let cacando = false, maeCacando = false
    const seguir = (r: THREE.Object3D, d: readonly [number, number, number, number, ...unknown[]], k: number) => {
      r.position.x += (d[0] - r.position.x) * k; r.position.y += (d[1] - r.position.y) * k; r.position.z += (d[2] - r.position.z) * k
      r.rotation.y += Math.atan2(Math.sin(d[3] - r.rotation.y), Math.cos(d[3] - r.rotation.y)) * k
    }
    maes.forEach((M, i) => {
      const d = R?.m[i], r = M.m.root
      if (d) { seguir(r, d, k); M.estado = d[4] as MaeViva['estado']; M.tonta = !!d[5] }
      animarMae(M.m, { perto: Math.hypot(eu.x - r.position.x, eu.z - r.position.z), caca: M.estado !== 'espera' }, dt)
      M.alvo.c.set(r.position.x, r.position.y + 1.1, r.position.z)
      if (M.estado === 'grito' || M.estado === 'caca') maeCacando = true
    })
    mestres.forEach((M, i) => {
      const d = R?.s[i], m = M.m, r = m.root
      antesDoGlitch(m)
      if (d) {
        seguir(r, d, k); M.estado = d[4] as MestreVivo['estado']
        if (!!d[5] !== m.anim.correndo) correr(m, !!d[5])
        if (!!d[6] !== m.anim.coberto) cobrir(m, !!d[6])
      }
      const s = animarMestre(m, dt)
      passoGlitch(m, dt)
      M.alvo.c.set(r.position.x, r.position.y + 1.2, r.position.z)
      ouvirMestre(m, dt)
      if (s.solta) soltarCorvo(M.C, s.solta, _d.set(Math.sin(r.rotation.y), 0, Math.cos(r.rotation.y)))
      const onde = passoCorvo(M.C, dt, (de, para) => alcanceCamera(fase.mundo, de, para, 0.15) < 1)
      ouvirCorvo(M.C)
      if (onde) { somEm(onde, corvoExplodindo, 4); estourar(estouro, onde, 1, 0, { cubos: 45, olhos: 0, pano: 0 }); tremerDe(onde, CORVO.tremor, 0.5) }
      if (M.estado === 'grito' || M.estado === 'caca') cacando = true
    })
    gralhas.forEach((v, i) => {
      const d = R?.g[i], g = v.g, r = g.root
      if (d) {
        // as do corvo nascem (ou uma volta a caçar): aparece onde o host diz
        if (d[4] && v.morta && !g.anim.estourada) { v.morta = false; r.visible = true; r.position.set(d[0], d[1], d[2]) }
        if (!v.morta) { seguir(r, d, kg); if (!!d[5] !== g.anim.pousada) pousar(g, !!d[5]) }
      }
      if (v.morta) return
      animarGralha(g, dt)
      const caca = !g.anim.pousada
      if (caca) cacando = true
      ouvirGralha(g, dt, caca)
    })
    return { cacando, maeCacando }
  }

  // o convidado ouve o retrato e os instantes; o host ouve os acertos da bala do convidado
  useEffect(() => {
    if (!rede) return
    if (rede.papel === 'host') {
      const p = new THREE.Vector3(), dir = new THREE.Vector3(0, 0, 1)
      return rede.ouvir('acerto', (m) => {
        const x = m.k === 'm' ? maes[m.i] : m.k === 's' ? mestres[m.i] : gralhas[m.i]
        if (!x) return
        quemAtira.current = fase.jogadores.find((j) => j !== fase.jogadores[0]) ?? null // o outro jogador (game/rede/Remoto)
        x.alvo.acerta(m.dano, p.copy(x.alvo.c), dir)
        quemAtira.current = null
      })
    }
    const paraRetrato = rede.ouvir('mundo', (m) => { retrato.current = m })
    const paraEv = rede.ouvir('ev', (e) => {
      if (e.k === 'm') {
        const M = maes[e.i]; if (!M) return
        if (e.a === 'g') golpear(M.m, e.v as NomeGolpe)
        else if (e.a === 'x') M.m.anim.golpe = null
        else if (e.a === 'p') piscar(M.m.root)
      } else if (e.k === 's') {
        const M = mestres[e.i]; if (!M) return
        if (e.a === 'grito') gritar(M.m)
        else if (e.a === 'morde') morder(M.m)
        else if (e.a === 'glitch') glitchar(M.m)
      } else {
        const v = gralhas[e.i]; if (!v) return
        const g = v.g, y = v.casa?.y ?? 0
        if (e.a === 'ataca') atacar(g)
        else if (e.a === 'ferida') ferirGralha(g, E, y)
        else if (e.a === 'estoura') { estourarGralha(g, E, y); v.morta = true; calar(g) }
        else if (e.a === 'some') { estourar(estouro, g.root.position, 0.3, 0, { cubos: 10, olhos: 0, pano: 0, mancha: false }); v.morta = true; g.root.visible = false; calar(g) }
      }
    })
    return () => { paraRetrato(); paraEv() }
  }, [rede, maes, mestres, gralhas, fase, E, estouro])

  useFrame((_, dtBruto) => {
    const dt = Math.min(dtBruto, 0.05)
    const { cacando, maeCacando } = rede?.papel === 'convidado' ? copiar(dt) : pensar(dt)
    passoEfeitosGralha(E, dt)
    passoEstouro(estouro, dt)

    // o que leva tiro: as Gralhas vivas (a caixa anda com o corpo)
    const lista = fase.alvos
    for (const v of gralhas) {
      const i = lista.indexOf(v.alvo)
      if (v.morta) { if (i >= 0) lista.splice(i, 1); continue }
      v.g.corpo.getWorldPosition(v.alvo.c)
      if (i < 0) lista.push(v.alvo)
    }
    // a música da perseguição: entra quando alguém caça e segura um pouco depois que todos param
    // (a da Mãe na frente: se ela entra caçando com as Gralhas, troca para a dela)
    if (cacando || maeCacando) {
      semCaca.current = 0
      const qual: Faixa = maeCacando ? 'perseguicao-mae' : 'perseguicao-gralhas'
      if (!tocando.current) musicaAntes.current = faixaAtual()
      if (tocando.current !== qual && (!tocando.current || maeCacando)) { musica(qual); tocando.current = qual }
    } else if (tocando.current && (semCaca.current += dt) > MUSICA.segura) { musica(musicaAntes.current); tocando.current = false }
    // o host manda o retrato do mundo (onde cada uma está e o estado dela)
    if (rede?.papel === 'host' && (envio.current += dt) >= 1 / RITMO.retrato) {
      envio.current = Math.min(envio.current - 1 / RITMO.retrato, 1 / RITMO.retrato)
      const P = (r: THREE.Object3D) => [r2(r.position.x), r2(r.position.y), r2(r.position.z), r2(r.rotation.y)] as const
      rede.enviar({
        t: 'mundo',
        m: maes.map((M) => [...P(M.m.root), M.estado, M.tonta ? 1 : 0]),
        s: mestres.map((M) => [...P(M.m.root), M.estado, M.m.anim.correndo ? 1 : 0, M.m.anim.coberto ? 1 : 0]),
        g: gralhas.map((v) => [...P(v.g.root), v.morta ? 0 : 1, v.g.anim.pousada ? 1 : 0]),
      })
    }
  })
  return null
}
