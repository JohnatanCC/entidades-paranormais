// Os espectrais do mapa (o jogo novo, docs/demonios.md), ganhando vida no Testar (a aba Entidades):
//   As caixas de espectrais (tipo 'caixa'): invisíveis no jogo. Quando o agente entra no raio dela (no andar dela, sem
//     parede no meio), ela invoca um espectral por carga livre: a Sombra espectral sobe do chão; a Asa espectral rompe o
//     chão e sobe voando. Quando um morre, a carga dele volta depois da recarga; invocou o máximo, ela para de vez.
//   O Devora espectros (tipo 'devora-espectros'): o fantasma capturável. Flutua no lugar dele até ver o agente; caça com
//     o bote, a mordida e o cuspe (as crias dele são espectrais como os das caixas, e patrulham em volta do lugar dele).
//     Com a vida zerada fica fraco (afunda e amolece) e aparece o ícone da lamparina: é a hora da captura (game/capture:
//     a lamparina erguida nele começa, cada tiro baixa a força dele, em 20% ele é absorvido e o agente ganha vida). Sem
//     captura, passado um tempo, volta com a vida cheia. Longe demais, ou sem ver o agente, volta para o lugar dele.
//   O Manto espectral (por enquanto só nas hordas de um roteiro): o outro fantasma capturável. Anda atrás do agente e
//     agarra, dá o combo de socos e, com pouca vida, o golpe giratório (manto-espectral/ia.ts); fraco e capturado como o
//     Devora (os dois são "fantasmas" aqui: o fraco, a captura e a absorção são os mesmos).
//   O Asa do terror (também só nas hordas): o terceiro fantasma. Voa longe do agente, dispara a bomba que gruda e
//     explode (3 seguidas com pouca vida) e se teletransporta (asa-terror/ia.ts); a explosão fere quem estiver no raio.
// Os espectrais caçam o agente com a luta dos Sombrios (assombrado/ia.ts e asa-sombria/ia.ts). Se o agente ficar longe
// (ESPECTRAIS.perde) por um tempo, eles perdem o foco e patrulham em volta da caixa deles, de ponto em ponto, desviando
// das paredes; também desistem se ficarem um tempo sem ver o agente (atrás da parede, em outro andar). Vendo o agente
// de novo (ou levando tiro), voltam a caçar. Ninguém ataca quem está em outro andar (subir escada atrás dele vem com o
// mapa de caminhos). Só fora do teste online (a rede ainda não conta os espectrais). Os números em numeros.ts
// (ESPECTRAIS), os da caixa no params do ponto (maps/entidades.ts, caixaDe) e os do Devora no numeros.ts da pasta dele.
// Um roteiro também invoca (fase.espectrais: ControleEspectrais), sem caixa no mapa: as hordas da Demo · Inimigos
// (chapters/demo-inimigos). Os da horda nunca perdem o foco nem voltam para casa: caçam até o fim.
// A dois (as demos com um amigo; docs/teste-online.md): só o host roda isto. Cada espectral tem um número e vai atrás do
// jogador mais perto; o golpe no convidado vai pela rede (a ferida, o agarrão que segura); a vida deles é maior (DOIS).
// O host manda ao convidado o retrato (15/s) e os instantes (nasceu, o golpe, o tiro, o estouro, a bola, a bomba, o
// teletransporte, a captura); lá, EspectraisCopia.tsx monta as cópias. O tiro do convidado chega como pedido (acertoE).
import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { CAIXA, KIND_ENTIDADE, caixaDe, type Caixa } from '../../maps/entidades'
import type { Chunk } from '../../maps/types'
import { enfurecer, soltarGolpe } from '../../render/golpe'
import { novaAura, pulsarAuras } from '../enemies/aura'
import { animarAsaSombria, estourarAsa, ferir as ferirAsa } from '../enemies/asa-sombria/animacao'
import { pensarAsa, type Mira } from '../enemies/asa-sombria/ia'
import { montarAsaSombria, type AsaSombria } from '../enemies/asa-sombria/modelo'
import { LUTA as LUTA_ASA } from '../enemies/asa-sombria/numeros'
import { acertar, disparar, novosProjeteis, passoProjeteis } from '../enemies/asa-sombria/projetil'
import { bolaBatendo, ouvirAsaSombria } from '../enemies/asa-sombria/sons'
import { animarAssombrado, arremessar, estourarAssombrado, ferir as ferirSombra, surgirAssombrado } from '../enemies/assombrado/animacao'
import { novoBando, pensarAssombrado } from '../enemies/assombrado/ia'
import { montarAssombrado, type Assombrado } from '../enemies/assombrado/modelo'
import { LUTA as LUTA_SOMBRA } from '../enemies/assombrado/numeros'
import { ouvirAssombrado } from '../enemies/assombrado/sons'
import { animarDevoraEspectros, ferir as ferirDevora, type CriaEspectros } from '../enemies/devora-espectros/animacao'
import { acalmarDevoraEspectros, golpeAcerta, pensarDevoraEspectros } from '../enemies/devora-espectros/ia'
import { montarDevoraEspectros, type DevoraEspectros } from '../enemies/devora-espectros/modelo'
import { CUSPE, FRACO, LUTA as LUTA_DEVORA } from '../enemies/devora-espectros/numeros'
import { absorvido, ouvirDevoraEspectros } from '../enemies/devora-espectros/sons'
import { animarMantoEspectral, ferir as ferirManto } from '../enemies/manto-espectral/animacao'
import { acalmarManto, golpeAcertaManto, pensarManto, rumoDoGiro } from '../enemies/manto-espectral/ia'
import { montarMantoEspectral, type MantoEspectral } from '../enemies/manto-espectral/modelo'
import { FRACO as FRACO_MANTO, LUTA as LUTA_MANTO } from '../enemies/manto-espectral/numeros'
import { ouvirMantoEspectral } from '../enemies/manto-espectral/sons'
import { descartarTornado } from '../enemies/manto-espectral/tornado'
import { animarAsaTerror, bocaNoMundo, ferir as ferirAsaTerror, golpear as golpearAsaTerror } from '../enemies/asa-terror/animacao'
import { anel, desfazer, dispararBomba, limparEfeitos, novosEfeitos, orbe, passoEfeitos } from '../enemies/asa-terror/efeitos'
import { acalmarAsaTerror, alvoDaBomba, destinoAsaTerror, pensarAsaTerror, type PlanoAsaTerror } from '../enemies/asa-terror/ia'
import { montarAsaTerror, type AsaTerror } from '../enemies/asa-terror/modelo'
import { BOMBA, FRACO as FRACO_TERROR, LUTA as LUTA_TERROR, TELE } from '../enemies/asa-terror/numeros'
import { ouvirAsaTerror, ouvirEfeitos } from '../enemies/asa-terror/sons'
import { estourar, novoEstouro, passoEstouro } from '../enemies/estouro'
import { andarNoMundo, girarPara, rumoLivre, separar, sorteado, type Alvo } from '../enemies/luta'
import { calar, somEm } from '../enemies/sons'
import type { AgenteNaFase, Rede } from '../Testar'
import type { Jogador } from './foco'
import { v3, type AcaoEsp, type Msg, type RetratoEsp, type TipoEsp } from '../rede/mensagens'
import type { Alvejavel } from '../weapons/bala'
import { alcanceCamera, empurrar, temChao } from '../world/colisao'
import { ganchos } from '../../dev/ganchos'
import { CAPTURA, novaCaptura, passoCaptura, tiroNaCaptura, type Captura } from '../capture/captura'
import { descartarSinal, mostrarSinal, novoSinal, type Sinal } from '../capture/sinal'
import { naLuz } from './luz'
import { APRIMORADO, DOIS, ESPECTRAIS } from './numeros'

// as caixas onde a bala acerta (meias medidas, m: as da Sombra e da Asa são as dos Sombrios na Demo · Intro; o Devora,
// a boca, o corpo e a cauda)
export const CAIXA_TIRO = { sombra: [0.6, 0.7, 0.6], asa: [0.8, 0.55, 0.8], boca: [0.45, 0.45, 0.45], corpo: [0.7, 0.6, 0.7], cauda: [0.55, 0.5, 0.55], manto: [0.55, 0.85, 0.55], capuz: [0.4, 0.4, 0.4], terror: [0.65, 0.6, 0.65] } as const

type Espectral = ({ tipo: 'sombra'; a: Assombrado } | { tipo: 'asa'; a: AsaSombria }) & {
  dono: CaixaViva; vida: number; alvo: Alvejavel
  /** aprimorado (APRIMORADO: o dobro da vida, mais dano, o relógio mais rápido, maior) e o agente para ele (o dano dele
   *  já com o aumento) */
  forte: boolean; contra: Alvo
  /** a dois: o número dele (o mesmo no convidado), quem ele caça (o jogador mais perto), quando escolhe de novo (s) e o
   *  último golpe mandado */
  id: number; quem: Alvo; troca: number; ultimo: string
  estado: 'caca' | 'patrulha'; longe: number // há quanto tempo o agente está longe (s)
  escondido: number; olhar: number; visto: boolean // há quanto tempo não o vê (s), quando confere de novo (s) e se viu na última vez
  ponto: THREE.Vector3 | null; pausa: number // a patrulha: para onde vai e quanto ainda espera parado
  morto: number // −1 vivo; s desde que estourou
}
/** Uma caixa no jogo: onde, os números, as cargas voltando (s que faltam de cada), quantos já invocou, quantos vivos e
 *  quanto falta para poder invocar o próximo. O Devora tem uma também (o ninho: o centro da patrulha das crias dele e
 *  quantas estão vivas), que nunca invoca. */
interface CaixaViva { p: THREE.Vector3; c: Caixa; recarga: number[]; usadas: number; vivos: number; nasce: number; horda?: boolean }

/** O que um roteiro manda nos espectrais (fase.espectrais): invocar num ponto do chão (forte = aprimorado; sem dizer, a
 *  sorte), quantos ainda contam (os vivos e o Devora até ser capturado) e tirar todos (o agente caiu: a horda recomeça). */
export interface ControleEspectrais {
  invocar: (tipo: 'sombra' | 'asa' | 'devora' | 'manto' | 'terror', p: THREE.Vector3, forte?: boolean) => void
  restam: () => number
  limpar: () => void
}
/** Um fantasma no jogo (o Devora espectros ou o Manto espectral): o lugar dele (casa, para onde olha, o chão do andar),
 *  a vida, quanto ainda fica fraco (s; 0 = não está), o estado, o foco (como o dos espectrais), o ninho das crias (só o
 *  Devora cospe), as caixas do tiro e o alvo (o agente, só no andar dele). */
type FantasmaVivo = ({ tipo: 'devora'; d: DevoraEspectros } | { tipo: 'manto'; d: MantoEspectral } | { tipo: 'terror'; d: AsaTerror }) & {
  casa: THREE.Vector3; vira: number; vida: number; fraco: number
  estado: 'espera' | 'caca' | 'volta'; longe: number; escondido: number; olhar: number; visto: boolean
  ninho: CaixaViva; alvos: Alvejavel[]; alvo: Alvo
  /** a dois: o número, o alvo de cada jogador (só no andar dele) e o último golpe mandado */
  id: number; porAlvo: Map<Alvo, Alvo>; ultimo: string
  /** a captura: em andamento (a força), absorvendo (s desde que começou a sumir, −1 não; de onde saiu e para onde vai:
   *  a lamparina de quem capturou), capturado (saiu do jogo) e o sinal em cima dele (o ícone, a barra) */
  captura: Captura | null; absorve: number; de: THREE.Vector3; lampada: THREE.Vector3 | null; capturado: boolean; sinal: Sinal
}
/** Os números de cada fantasma: a vida cheia, quanto volta se romper a captura, o mínimo do agente e quanto fica fraco. */
const numerosDe = (F: FantasmaVivo) => (F.tipo === 'devora' ? { ...LUTA_DEVORA, fraco: FRACO.dura } : F.tipo === 'manto' ? { ...LUTA_MANTO, fraco: FRACO_MANTO.dura } : { ...LUTA_TERROR, fraco: FRACO_TERROR.dura })
const nomeDe = (F: FantasmaVivo) => (F.tipo === 'devora' ? 'Devora' : F.tipo === 'manto' ? 'Manto' : 'Asa do terror')
/** O tranco do tiro, na animação de cada um. */
const ferirFantasma = (F: FantasmaVivo, de: number) => (F.tipo === 'devora' ? ferirDevora(F.d, de) : F.tipo === 'manto' ? ferirManto(F.d, de) : ferirAsaTerror(F.d, de))
/** Corta o golpe em curso (ficou fraco, está sendo absorvido): volta ao jeito de sempre de cada um. */
const parar = (F: FantasmaVivo) => { if (F.tipo === 'terror') F.d.anim.modo = 'voar'; else F.d.anim.modo = 'pairar' }
/** Esquece o que pensava (ficou fraco, voltou para casa). */
const acalmar = (F: FantasmaVivo) => (F.tipo === 'devora' ? acalmarDevoraEspectros(F.d) : F.tipo === 'manto' ? acalmarManto(F.d) : acalmarAsaTerror(F.d))

const _plano: PlanoAsaTerror = { vel: new THREE.Vector3(), sumir: null }, _bomba = new THREE.Vector3()
const _ir = { x: 0, z: 0 }, _v = new THREE.Vector3(), _f = new THREE.Vector3(), _peito = new THREE.Vector3(), _olho = new THREE.Vector3()
const caixaDeTiro = (m: readonly number[]): Alvejavel => ({ c: new THREE.Vector3(), m: new THREE.Vector3(m[0], m[1], m[2]), acerta: () => {} })
/** De onde veio o tiro, no espaço de quem levou (rad). */
const _d = new THREE.Vector3()
/** O golpe em curso de cada um, como o convidado entende ('' = nenhum): começou outro, o host manda. */
const golpeDe = (x: Espectral | FantasmaVivo): string => {
  if (x.tipo === 'sombra') return x.a.anim.golpe ? 'atacar' : ''
  if (x.tipo === 'asa') return x.a.anim.golpe?.nome ?? ''
  if (x.tipo === 'devora') return x.d.anim.modo === 'pairar' ? '' : x.d.anim.modo === 'cuspir' ? `cuspir:${x.d.anim.cria}` : x.d.anim.modo
  if (x.tipo === 'manto') return x.d.anim.modo === 'pairar' ? '' : x.d.anim.modo
  return x.d.anim.modo === 'voar' || x.d.anim.modo === 'surgir' ? '' : x.d.anim.modo
}
const CODIGO: Record<Espectral['tipo'] | FantasmaVivo['tipo'], TipoEsp> = { sombra: 's', asa: 'a', devora: 'd', manto: 'm', terror: 't' }
const deOnde = (raiz: THREE.Object3D, dir: THREE.Vector3) => { const y = raiz.rotation.y; return Math.atan2(-dir.x * Math.cos(y) + dir.z * Math.sin(y), -dir.x * Math.sin(y) - dir.z * Math.cos(y)) }

export function Espectrais({ chunks, fase, rede }: { chunks: Chunk[]; fase: AgenteNaFase; rede?: Rede }) {
  const scene = useThree((s) => s.scene), camera = useThree((s) => s.camera)
  const alvo = useMemo<Alvo>(() => ({ p: fase.agente.root.position, pode: fase.pode, ferir: fase.ferir, engolir: fase.engolir, cuspir: fase.cuspir, lentidao: fase.lentidao }), [fase])
  // a dois: o host manda; os inimigos têm mais vida
  const con = rede?.con.papel === 'host' ? rede.con : null, vidaX = rede ? DOIS.vida : 1
  const ids = useRef(0), retrato = useRef(0)
  const ev = (i: number, a: AcaoEsp, x: Omit<Extract<Msg, { t: 'espEv' }>, 't' | 'i' | 'a'> = {}) => con?.enviar({ t: 'espEv', i, a, ...x })
  // os jogadores como alvos da luta: o agente e, a dois, o outro (o golpe nele vai pela rede; o agarrão o segura lá)
  const alvosDe = useMemo(() => new WeakMap<Jogador, Alvo>(), []), fortes = useMemo(() => new WeakMap<Alvo, Alvo>(), [])
  function alvoDe(j: Jogador): Alvo {
    if (j.p === alvo.p) return alvo
    let A = alvosDe.get(j)
    if (!A) { A = { p: j.p, pode: j.pode, ferir: (dano, de) => j.ferir(dano, de), engolir: () => {}, cuspir: () => {}, lentidao: (q, dura) => con?.enviar({ t: 'lento', q, dura }) }; alvosDe.set(j, A) }
    return A
  }
  /** O aprimorado fere mais: o mesmo alvo, com o dano aumentado. */
  function forteDe(A: Alvo): Alvo {
    let F = fortes.get(A)
    if (!F) { F = { ...A, ferir: (dano, de, sempre) => A.ferir(Math.round(dano * APRIMORADO.dano), de, sempre) }; fortes.set(A, F) }
    return F
  }
  /** O jogador mais perto de p que pode levar golpe (sozinho, sempre o agente). */
  function maisPerto(p: THREE.Vector3): Alvo {
    if (!rede) return alvo
    let melhor = alvo, d = Infinity
    for (const j of fase.jogadores) { if (!j.pode()) continue; const k = Math.hypot(j.p.x - p.x, j.p.z - p.z); if (k < d) { d = k; melhor = alvoDe(j) } }
    return melhor
  }
  /** O alvo de um fantasma: o jogador, só no andar dele. */
  function alvoDoFantasma(D: FantasmaVivo, A: Alvo): Alvo {
    let F = D.porAlvo.get(A)
    if (!F) { F = { ...A, pode: () => A.pode() && Math.abs(A.p.y - D.casa.y) < ESPECTRAIS.andar }; D.porAlvo.set(A, F) }
    return F
  }
  const pontos = useMemo(() => chunks.flatMap((ch) => ch.points.filter((p) => p.kind === KIND_ENTIDADE)), [chunks])
  const caixas = useMemo(() => pontos.filter((p) => p.params?.tipo === 'caixa')
    .map((p): CaixaViva => ({ p: new THREE.Vector3(...p.pos), c: caixaDe(p.params), recarga: [], usadas: 0, vivos: 0, nasce: 0 })), [pontos])
  const fantasmas = useRef<FantasmaVivo[]>([])
  /** Um fantasma entra: na casa dele, virado para `vira` (rad); o da horda já caça. */
  function novoFantasma(tipo: 'devora' | 'manto' | 'terror', casa: THREE.Vector3, vira: number, horda: boolean): FantasmaVivo {
    const modelo = tipo === 'devora' ? { tipo, d: montarDevoraEspectros() } as const : tipo === 'manto' ? { tipo, d: montarMantoEspectral() } as const : { tipo, d: montarAsaTerror() } as const
    modelo.d.root.position.copy(casa); modelo.d.root.rotation.y = vira
    if (modelo.tipo === 'terror') { // surge no ar, em cubos
      modelo.d.root.position.y += LUTA_TERROR.altura; golpearAsaTerror(modelo.d, 'sumir'); modelo.d.anim.modo = 'surgir'
      desfazer(ET, modelo.d.root.position, 0.9); anel(ET, _v.copy(casa).setY(casa.y + 0.04), 0.15, 1.2, TELE.surge)
    }
    const D: FantasmaVivo = {
      ...modelo, casa, vira, vida: (tipo === 'devora' ? LUTA_DEVORA.vida : tipo === 'manto' ? LUTA_MANTO.vida : LUTA_TERROR.vida) * vidaX, fraco: 0, estado: horda ? 'caca' : 'espera', longe: 0, escondido: 0, olhar: 0, visto: horda,
      captura: null, absorve: -1, de: new THREE.Vector3(), lampada: null, capturado: false, sinal: novoSinal(),
      ninho: { p: casa, c: { ...CAIXA, maximo: 0 }, recarga: [], usadas: 0, vivos: 0, nasce: 0, horda },
      alvos: tipo === 'devora' ? [caixaDeTiro(CAIXA_TIRO.boca), caixaDeTiro(CAIXA_TIRO.corpo), caixaDeTiro(CAIXA_TIRO.cauda)] : tipo === 'manto' ? [caixaDeTiro(CAIXA_TIRO.manto), caixaDeTiro(CAIXA_TIRO.capuz)] : [caixaDeTiro(CAIXA_TIRO.terror), caixaDeTiro(CAIXA_TIRO.capuz)],
      alvo, id: ++ids.current, porAlvo: new Map(), ultimo: '',
    }
    D.alvo = alvoDoFantasma(D, alvo)
    for (const a of D.alvos) a.acerta = (dano, _p, dir) => tiroNoFantasma(D, dano, dir)
    grupo.add(D.d.root, D.sinal.grupo); fase.alvos.push(...D.alvos); fantasmas.current.push(D)
    ev(D.id, 'novo', { v: CODIGO[tipo], p: v3(D.d.root.position), n: vira, ...(tipo === 'terror' ? { s: 'surgir' } : {}) })
    return D
  }
  /** Um fantasma sai (o mapa mudou, a horda recomeçou). */
  function tirarFantasma(D: FantasmaVivo) {
    grupo.remove(D.d.root, D.sinal.grupo); calar(D.d); soltarGolpe(D.d.root); descartarSinal(D.sinal)
    if (D.tipo === 'manto') descartarTornado(D.d.tornado)
    for (const a of D.alvos) { const i = fase.alvos.indexOf(a); if (i >= 0) fase.alvos.splice(i, 1) }
  }
  // as bolas da Asa: as comuns e as do aprimorado (fere mais), cada uma no seu estoque
  const E = useMemo(() => novoEstouro(), []), P = useMemo(() => novosProjeteis(), []), PF = useMemo(() => novosProjeteis(), []), grupo = useMemo(() => new THREE.Group(), [])
  const bando = useMemo(() => novoBando(), [])
  const ET = useMemo(() => novosEfeitos(), []) // a bola da carga, as bombas e o teletransporte de todos os Asas do terror
  const vivos = useRef<Espectral[]>([])
  const mira = useMemo<Mira>(() => ({ de: new THREE.Vector3(), dir: new THREE.Vector3(), ativa: false }), [])

  const tirar = (v: Espectral) => {
    grupo.remove(v.a.root); calar(v.a); soltarGolpe(v.a.root)
    const i = fase.alvos.indexOf(v.alvo); if (i >= 0) fase.alvos.splice(i, 1)
  }
  useEffect(() => {
    scene.add(grupo, E.grupo, P.grupo, PF.grupo, ET.grupo)
    return () => { for (const v of vivos.current) tirar(v); vivos.current = []; scene.remove(grupo, E.grupo, P.grupo, PF.grupo, ET.grupo) }
  }, [scene, grupo, E, P, PF, ET])
  // o mapa mudou (outro Testar): as caixas recomeçam, e os espectrais de antes saem
  useEffect(() => () => { for (const v of vivos.current) tirar(v); vivos.current = [] }, [caixas])
  // os Devoras do mapa: entram na cena e na lista do tiro; saindo (e os que um roteiro invocou), calam
  useEffect(() => {
    for (const p of pontos) if (p.params?.tipo === 'devora-espectros') novoFantasma('devora', new THREE.Vector3(...p.pos), (Number(p.params?.vira ?? 0) * Math.PI) / 180, false)
    return () => { for (const D of fantasmas.current) tirarFantasma(D); fantasmas.current = [] }
  }, [pontos, grupo, fase])
  // o roteiro invoca por aqui (as hordas): a caixa da horda é invisível, no ponto, nunca invoca sozinha e não perde o foco
  useEffect(() => {
    const C: ControleEspectrais = {
      invocar: (tipo, p, forte) => {
        const yaw = Math.atan2(alvo.p.x - p.x, alvo.p.z - p.z)
        if (tipo === 'devora' || tipo === 'manto' || tipo === 'terror') { novoFantasma(tipo, p.clone(), yaw, true); return }
        const cx: CaixaViva = { p: p.clone(), c: { ...CAIXA, monstro: tipo, cargas: 1, maximo: 1, aprimorado: forte === undefined ? 'sorte' : forte ? 'sempre' : 'nunca' }, recarga: [], usadas: 0, vivos: 0, nasce: 0, horda: true }
        invocar(cx, 0)
      },
      restam: () => vivos.current.filter((v) => v.morto < 0).length + fantasmas.current.filter((D) => !D.capturado).length,
      limpar: () => {
        for (const v of vivos.current) tirar(v)
        vivos.current = []; bando.atacando = null
        for (const D of fantasmas.current) tirarFantasma(D)
        fantasmas.current = []; limparEfeitos(ET)
        ev(0, 'limpar')
      },
    }
    fase.espectrais = C
    return () => { if (fase.espectrais === C) fase.espectrais = null }
  }, [fase, alvo, bando])
  // as provas (só no npm run dev): provas.caixas() diz o que cada caixa (e cada Devora) já fez e o estado de cada espectral
  useEffect(() => {
    if (!import.meta.env.DEV) return
    const dele = (cx: CaixaViva) => vivos.current.filter((v) => v.dono === cx && v.morto < 0).map((v) => ({ tipo: v.forte ? `${v.tipo} aprimorada` : v.tipo, estado: v.estado, vida: v.vida, dist: Math.round(Math.hypot(v.a.root.position.x - cx.p.x, v.a.root.position.z - cx.p.z) * 10) / 10 }))
    ganchos.caixas = () => [
      ...caixas.map((cx) => ({ caixa: `${cx.c.monstro} em ${cx.p.x}, ${cx.p.z}`, usadas: cx.usadas, vivos: cx.vivos, recarga: cx.recarga.map((t) => Math.round(t)), espectrais: dele(cx) })),
      ...fantasmas.current.map((D) => ({ caixa: `${nomeDe(D)} em ${D.casa.x}, ${D.casa.z}: ${D.capturado ? 'capturado' : D.absorve >= 0 ? 'absorvendo' : D.captura ? `capturando, força ${Math.round(D.captura.forca)}%` : D.fraco > 0 ? 'fraco' : D.estado}, vida ${D.vida}, ${D.d.anim.modo}`, usadas: 0, vivos: D.ninho.vivos, recarga: [], espectrais: dele(D.ninho) })),
    ]
    return () => { delete ganchos.caixas }
  }, [caixas])

  /** Um espectral novo entra (o da caixa, ou a cria do Devora). como = como nasce no convidado (a Sombra sobe do chão ou
   *  é cuspida até q; a Asa rompe o chão ou sai da boca). */
  function entra(v: Espectral, como: 'surgir' | 'chao' | 'boca' | 'voo', q?: THREE.Vector3) {
    if (v.forte) { // o aprimorado: maior, avermelhado, com a borda acesa e a aura vermelha atrás (o modelo é o mesmo)
      v.a.root.scale.setScalar(APRIMORADO.tamanho)
      enfurecer(v.a.root, 1)
      v.a.corpo.add(novaAura(2.2, v.tipo === 'asa' ? 0 : 0.3)) // presa no corpo: fica no meio dele (a origem do modelo não fica)
    }
    v.alvo.acerta = (dano, _p, dir) => tiro(v, dano, dir)
    grupo.add(v.a.root); fase.alvos.push(v.alvo); vivos.current.push(v)
    v.dono.vivos++
    ev(v.id, 'novo', { v: CODIGO[v.tipo], p: v3(v.a.root.position), n: v.a.root.rotation.y, f: v.forte ? 1 : 0, ...(q ? { q: v3(q) } : {}), ...(como !== 'voo' ? { s: como } : {}) })
  }
  /** O que todo espectral novo tem: aprimorado (forte) ou não, e o agente para ele (o dano dele aumentado se forte). */
  const novo = (dono: CaixaViva, forte: boolean) => ({
    dono, estado: 'caca' as const, longe: 0, escondido: 0, olhar: 0, visto: true, ponto: null, pausa: 0, morto: -1, forte,
    contra: forte ? forteDe(alvo) : alvo, id: ++ids.current, quem: alvo, troca: 0, ultimo: '',
  })
  /** Nasce aprimorado? (a caixa pode mandar sempre ou nunca; senão, a chance) */
  const sorteForte = (c: Caixa) => (c.aprimorado === 'sempre' ? true : c.aprimorado === 'nunca' ? false : Math.random() < APRIMORADO.chance)
  const vidaDe = (tipo: 'sombra' | 'asa', forte: boolean) => ESPECTRAIS.vida[tipo] * (forte ? APRIMORADO.vida : 1) * vidaX

  /** A caixa invoca um espectral perto dela (até `espalha` m), virado para o agente. */
  function invocar(cx: CaixaViva, espalha = 1.2) {
    const ag = alvo.p, ang = Math.random() * Math.PI * 2, r = Math.random() * espalha
    const p = new THREE.Vector3(cx.p.x + Math.cos(ang) * r, cx.p.y, cx.p.z + Math.sin(ang) * r)
    if (!temChao(fase.mundo, p.x, p.z, p.y)) p.copy(cx.p)
    const yaw = Math.atan2(ag.x - p.x, ag.z - p.z), forte = sorteForte(cx.c)
    if (cx.c.monstro === 'asa') {
      const a = montarAsaSombria('espectrais/asa-espectral'); a.root.position.copy(p).setY(p.y + 0.3); a.root.rotation.y = yaw
      estourar(E, _v.copy(p).setY(p.y + 0.1), 0.35, p.y, { cubos: 8, olhos: 0 }) // rompe o chão
      entra({ ...novo(cx, forte), tipo: 'asa', a, vida: vidaDe('asa', forte), alvo: caixaDeTiro(CAIXA_TIRO.asa) }, 'chao')
    } else {
      const a = montarAssombrado('espectrais/sombra-espectral'); a.root.position.copy(p); a.root.rotation.y = yaw
      surgirAssombrado(a, E, p.y)
      entra({ ...novo(cx, forte), tipo: 'sombra', a, vida: vidaDe('sombra', forte), alvo: caixaDeTiro(CAIXA_TIRO.sombra) }, 'surgir')
    }
    cx.usadas++
  }

  /** O Devora cospe uma cria: a Sombra voa da boca até o chão, à frente; a Asa sai voando da boca. */
  function cria(D: FantasmaVivo, tipo: CriaEspectros, de: THREE.Vector3, frente: THREE.Vector3) {
    const chao = D.casa.y, dist = CUSPE.alcance[0] + Math.random() * (CUSPE.alcance[1] - CUSPE.alcance[0])
    const para = new THREE.Vector3(de.x + frente.x * dist + (Math.random() - 0.5) * 2, chao, de.z + frente.z * dist + (Math.random() - 0.5) * 2)
    if (!temChao(fase.mundo, para.x, para.z, chao)) para.set(de.x, chao, de.z) // sem chão lá na frente: cai embaixo dele
    const forte = Math.random() < APRIMORADO.chance
    if (tipo === 'asa') {
      const a = montarAsaSombria('espectrais/asa-espectral'); a.root.position.copy(de); a.root.rotation.y = D.d.root.rotation.y
      entra({ ...novo(D.ninho, forte), tipo: 'asa', a, vida: vidaDe('asa', forte), alvo: caixaDeTiro(CAIXA_TIRO.asa) }, 'boca')
    } else {
      const a = montarAssombrado('espectrais/sombra-espectral'); arremessar(a, de, para)
      entra({ ...novo(D.ninho, forte), tipo: 'sombra', a, vida: vidaDe('sombra', forte), alvo: caixaDeTiro(CAIXA_TIRO.sombra) }, 'voo', para)
    }
  }

  /** Uma bala acertou um espectral: o tranco do lado do tiro, e ele volta a caçar; zerou, estoura e a carga começa a voltar. */
  function tiro(v: Espectral, dano: number, dir: THREE.Vector3) {
    if (v.morto >= 0) return
    const de = deOnde(v.a.root, dir)
    if (v.tipo === 'sombra') ferirSombra(v.a, de); else ferirAsa(v.a, de)
    ev(v.id, 'ferir', { n: de })
    v.estado = 'caca'; v.longe = 0; v.ponto = null
    if ((v.vida -= dano) > 0) return
    if (v.tipo === 'sombra') estourarAssombrado(v.a, E, v.dono.p.y); else estourarAsa(v.a, E, v.dono.p.y)
    ev(v.id, 'estoura')
    if (bando.atacando === v.a) bando.atacando = null
    v.morto = 0
    const i = fase.alvos.indexOf(v.alvo); if (i >= 0) fase.alvos.splice(i, 1)
    v.dono.vivos--; v.dono.recarga.push(v.dono.c.recarga)
  }

  /** Uma bala acertou um fantasma: o tranco, e ele acorda; zerou, fica fraco (o maior não estoura: é capturado). */
  function tiroNoFantasma(D: FantasmaVivo, dano: number, dir: THREE.Vector3) {
    if (D.capturado || D.absorve >= 0) return
    if (D.fraco > 0) { // fraco, o tiro só vale na captura: baixa a força dele; em 20%, ele é absorvido
      if (!D.captura) return
      ferirFantasma(D, deOnde(D.d.root, dir)); ev(D.id, 'ferir', { n: deOnde(D.d.root, dir) })
      if (tiroNaCaptura(D.captura, dano)) absorver(D)
      return
    }
    ferirFantasma(D, deOnde(D.d.root, dir)); ev(D.id, 'ferir', { n: deOnde(D.d.root, dir) })
    if (D.estado !== 'caca') { D.estado = 'caca'; D.longe = 0; D.escondido = 0 }
    if ((D.vida -= dano) > 0) return
    D.vida = 0; D.fraco = numerosDe(D).fraco; parar(D); acalmar(D)
  }

  /** A força chegou nos 20%: ele começa a sumir na lamparina e sai da lista do tiro. */
  function absorver(D: FantasmaVivo) {
    D.absorve = 0; D.de.copy(D.d.root.position); D.captura = null; parar(D)
    for (const a of D.alvos) { const i = fase.alvos.indexOf(a); if (i >= 0) fase.alvos.splice(i, 1) }
    if (D.lampada) somEm(D.lampada, absorvido, 3)
  }
  /** Sumindo na lamparina: voa até ela girando e encolhendo; no fim, sai do jogo e o agente ganha vida. */
  function passoAbsorve(D: FantasmaVivo, dt: number) {
    const r = D.d.root, k = Math.min(1, (D.absorve += dt) / CAPTURA.absorve), e = k * k * (3 - 2 * k)
    if (D.lampada) r.position.lerpVectors(D.de, D.lampada, e)
    r.scale.setScalar(Math.max(0.02, 1 - e)); r.rotation.y += dt * (2 + 10 * e)
    if (D.tipo === 'devora') animarDevoraEspectros(D.d, 0, dt, 1); else if (D.tipo === 'manto') animarMantoEspectral(D.d, 0, dt, 1); else animarAsaTerror(D.d, 0, dt, 1)
    if (k < 1) return
    D.capturado = true; r.visible = false; calar(D.d); soltarGolpe(r)
    ev(D.id, 'some', { v: 'capturado' })
    fase.curar(CAPTURA.cura)
  }

  /** De (x, z), no chão `chao`, dá para ver o agente: no mesmo andar e sem nada tapando (as paredes, as portas fechadas). */
  function enxerga(x: number, chao: number, z: number) {
    const ag = alvo.p
    if (Math.abs(ag.y - chao) > ESPECTRAIS.andar) return false
    return alcanceCamera(fase.mundo, _olho.set(x, chao + 1.2, z), _peito.set(ag.x, ag.y + 1.2, ag.z), 0.02) > 0.98
  }
  /** O agente está no andar dele (quem está em outro andar não leva golpe nem cuspe dele). */
  const mesmoAndar = (v: Espectral) => Math.abs(v.quem.p.y - v.dono.p.y) < ESPECTRAIS.andar

  /** Patrulha: vai de ponto em ponto em volta da caixa (com chão), parando um pouco em cada. A Sombra: devolve a
   *  vontade de andar (0..1 da caçada) e vira o corpo para o caminho livre. A Asa voa sozinha aqui (devolve 0). */
  function patrulhar(v: Espectral, dt: number): number {
    const r = v.a.root, cx = v.dono.p
    if (!v.ponto) {
      if ((v.pausa -= dt) > 0) return 0
      for (let k = 0; k < 6 && !v.ponto; k++) { // um ponto com chão em volta da caixa
        const a = Math.random() * Math.PI * 2, d = 1.5 + Math.random() * (ESPECTRAIS.patrulha - 1.5)
        const x = cx.x + Math.cos(a) * d, z = cx.z + Math.sin(a) * d
        if (temChao(fase.mundo, x, z, cx.y)) v.ponto = new THREE.Vector3(x, cx.y, z)
      }
      if (!v.ponto) { v.pausa = 1; return 0 }
    }
    const longe = Math.hypot(v.ponto.x - r.position.x, v.ponto.z - r.position.z)
    if (longe < 0.6) { v.ponto = null; v.pausa = sorteado(ESPECTRAIS.pausa); return 0 }
    if (v.tipo === 'sombra') {
      rumoLivre(r, v.ponto.x, v.ponto.z, fase.mundo, LUTA_SOMBRA.raio, dt, _ir)
      girarPara(r, _ir.x, _ir.z, LUTA_SOMBRA.vira, dt)
      return LUTA_SOMBRA.vel * ESPECTRAIS.andarSombra
    }
    // a Asa: voa até lá na altura da patrulha, de frente para onde vai
    const alto = cx.y + ESPECTRAIS.voo, pes = r.position.y - 0.9
    rumoLivre(r, v.ponto.x, v.ponto.z, fase.mundo, 0.5, dt, _ir, pes, false)
    _v.set(_ir.x - r.position.x, 0, _ir.z - r.position.z)
    const l = _v.length(), passo = Math.min(longe, ESPECTRAIS.andarAsa * dt)
    if (l > 1e-3) r.position.addScaledVector(_v, passo / l)
    r.position.y += Math.sign(alto - r.position.y) * Math.min(Math.abs(alto - r.position.y), LUTA_ASA.sobe * dt)
    empurrar(fase.mundo, r.position, r.position.y - 0.9, 0.5)
    girarPara(r, _ir.x, _ir.z, 3, dt)
    return 0
  }

  /** Fraco: a lamparina nele captura (cada tiro baixa a força; em 20% ele é absorvido); sem captura, passado o tempo,
   *  volta com a vida cheia e caçando. Sendo capturado, vem devagar para a lamparina. */
  function passoFraco(D: FantasmaVivo, dt: number) {
    const d = D.d, r = d.root, L = numerosDe(D), cheia = L.vida * vidaX
    const quem = naLuz(fase.jogadores, fase.mundo, d.corpo.getWorldPosition(_v))
    if (quem?.lamparina) D.lampada = quem.lamparina.pos
    if (!D.captura && quem) D.captura = novaCaptura() // a lamparina nele: começa a ser absorvido
    if (D.captura) {
      const fim = passoCaptura(D.captura, !!quem, dt)
      if (fim === 'solta') D.captura = null // baixou a lamparina (ou tirou ele do feixe): o tempo de fraco volta a correr
      else if (fim === 'rompe') { // sem tiro, a força encheu: ele se solta e volta a caçar, com pouca vida
        D.captura = null; D.fraco = 0; D.vida = Math.round(cheia * L.rompe); D.estado = 'caca'; D.longe = 0; D.escondido = 0
        ferirFantasma(D, Math.PI); ev(D.id, 'ferir', { n: Math.PI })
      } else if (D.lampada) { // sendo capturado: vem devagar para a lamparina (sem passar do mínimo)
        const dx = D.lampada.x - r.position.x, dz = D.lampada.z - r.position.z, l = Math.hypot(dx, dz)
        if (l > L.minimo + 0.5) { r.position.x += (dx / l) * CAPTURA.puxa * dt; r.position.z += (dz / l) * CAPTURA.puxa * dt }
        girarPara(r, D.lampada.x, D.lampada.z, 1.5, dt)
      }
    } else if ((D.fraco -= dt) <= 0) { D.fraco = 0; D.vida = cheia; D.estado = 'caca'; D.longe = 0; D.escondido = 0 }
  }

  /** Um quadro do Devora: fraco, esperando, caçando ou voltando para casa; anima, anda, fere e cospe. */
  function passoDevora(D: FantasmaVivo & { tipo: 'devora' }, dt: number) {
    if (D.capturado) return
    if (D.absorve >= 0) { mostrarSinal(D.sinal, null, null, 0); passoAbsorve(D, dt); return }
    if (rede) D.alvo = alvoDoFantasma(D, maisPerto(D.d.root.position))
    const d = D.d, r = d.root, ag = D.alvo.p, chao = D.casa.y, dist = Math.hypot(ag.x - r.position.x, ag.z - r.position.z)
    if ((D.olhar -= dt) <= 0) { D.olhar = ESPECTRAIS.olhar; D.visto = enxerga(r.position.x, chao, r.position.z) }
    let andar = 0
    if (D.fraco > 0) passoFraco(D, dt)
    else if (D.estado === 'espera') {
      if (fase.pode() && D.visto && dist < ESPECTRAIS.ve) { D.estado = 'caca'; D.longe = 0; D.escondido = 0 }
    } else if (D.estado === 'caca') {
      D.longe = dist > ESPECTRAIS.perde ? D.longe + dt : 0
      D.escondido = D.visto ? 0 : D.escondido + dt
      if (!D.ninho.horda && (D.longe > ESPECTRAIS.semVer || D.escondido > ESPECTRAIS.escondido)) { D.estado = 'volta'; acalmarDevoraEspectros(d) }
      else if (D.alvo.pode()) andar = pensarDevoraEspectros(d, D.alvo, fase.mundo, D.ninho.vivos, chao, dt)
    } else { // volta para casa e olha para onde o mapa diz
      if (fase.pode() && D.visto && dist < ESPECTRAIS.ve) D.estado = 'caca'
      else if (Math.hypot(D.casa.x - r.position.x, D.casa.z - r.position.z) > 0.5) {
        rumoLivre(r, D.casa.x, D.casa.z, fase.mundo, LUTA_DEVORA.raio, dt, _ir, chao); girarPara(r, _ir.x, _ir.z, LUTA_DEVORA.vira, dt); andar = LUTA_DEVORA.vel * 0.5
      } else { r.rotation.y += Math.atan2(Math.sin(D.vira - r.rotation.y), Math.cos(D.vira - r.rotation.y)) * Math.min(1, 2 * dt); if (Math.abs(D.vira - r.rotation.y) < 0.05) D.estado = 'espera' }
    }
    const s = animarDevoraEspectros(d, andar > 0 ? 1 : 0, dt, D.fraco > 0 ? 1 : 0)
    andarNoMundo(r, (andar + s.avanca) * dt, fase.mundo, LUTA_DEVORA.raio, chao)
    // não entra no agente (nem no bote): o meio do corpo fica a pelo menos `minimo` dele
    const dx = r.position.x - ag.x, dz = r.position.z - ag.z, l = Math.hypot(dx, dz)
    if (l < LUTA_DEVORA.minimo && l > 1e-3 && Math.abs(ag.y - chao) < ESPECTRAIS.andar) { r.position.x = ag.x + (dx / l) * LUTA_DEVORA.minimo; r.position.z = ag.z + (dz / l) * LUTA_DEVORA.minimo }
    r.position.y = chao + s.y
    golpeAcerta(d, s, D.alvo, r.position)
    if (s.cria) cria(D, s.cria.tipo, s.cria.de, s.cria.frente)
    ouvirDevoraEspectros(d, s, dt)
    // o sinal da captura em cima dele: o ícone (fraco) e a barra da força (capturando)
    mostrarSinal(D.sinal, D.fraco > 0 ? d.corpo.getWorldPosition(_v).setY(r.position.y + 1.4) : null, D.captura?.forca ?? null, d.anim.t, camera)
    // as caixas do tiro andam com ele: a boca (à frente da mandíbula), o corpo e a cauda (atrás)
    _f.set(Math.sin(r.rotation.y), 0, Math.cos(r.rotation.y))
    d.mandibula.getWorldPosition(D.alvos[0].c).addScaledVector(_f, 0.3)
    d.corpo.getWorldPosition(D.alvos[1].c)
    D.alvos[2].c.copy(D.alvos[1].c).addScaledVector(_f, -1)
  }

  /** Um quadro do Manto (o da horda: caça sempre): fraco, ou caçando; anima, anda (girando, vai para o agente), fere. */
  function passoManto(D: FantasmaVivo & { tipo: 'manto' }, dt: number) {
    if (D.capturado) return
    if (D.absorve >= 0) { mostrarSinal(D.sinal, null, null, 0); passoAbsorve(D, dt); return }
    if (rede) D.alvo = alvoDoFantasma(D, maisPerto(D.d.root.position))
    const m = D.d, r = m.root, ag = D.alvo.p, chao = D.casa.y
    let andar = 0
    if (D.fraco > 0) passoFraco(D, dt)
    else if (D.alvo.pode()) andar = pensarManto(m, D.alvo, fase.mundo, D.vida / (LUTA_MANTO.vida * vidaX), chao, dt)
    else acalmar(D)
    const s = animarMantoEspectral(m, andar, dt, D.fraco > 0 ? 1 : 0)
    if (m.anim.modo === 'girar') { // gira no lugar e anda reto para o agente
      const rumo = rumoDoGiro(m)
      r.rotation.y += s.giro * dt
      r.position.x += Math.sin(rumo) * s.avanca * dt; r.position.z += Math.cos(rumo) * s.avanca * dt
      empurrar(fase.mundo, r.position, chao, LUTA_MANTO.raio)
    } else andarNoMundo(r, s.avanca * dt, fase.mundo, LUTA_MANTO.raio, chao)
    // não entra no agente: o meio do corpo fica a pelo menos `minimo` dele
    const dx = r.position.x - ag.x, dz = r.position.z - ag.z, l = Math.hypot(dx, dz)
    if (l < LUTA_MANTO.minimo && l > 1e-3 && Math.abs(ag.y - chao) < ESPECTRAIS.andar) { r.position.x = ag.x + (dx / l) * LUTA_MANTO.minimo; r.position.z = ag.z + (dz / l) * LUTA_MANTO.minimo }
    r.position.y = chao
    golpeAcertaManto(m, s, D.alvo)
    ouvirMantoEspectral(m, s, dt)
    mostrarSinal(D.sinal, D.fraco > 0 ? m.corpo.getWorldPosition(_v).setY(r.position.y + 2.35) : null, D.captura?.forca ?? null, m.anim.t, camera)
    // as caixas do tiro andam com ele: o corpo (o meio do tronco) e o capuz
    m.corpo.getWorldPosition(D.alvos[0].c).y += 0.35
    m.cabeca.getWorldPosition(D.alvos[1].c)
  }

  /** Um quadro do Asa do terror (o da horda: caça sempre): fraco, ou caçando; voa, some e surge, dispara a bomba. */
  function passoTerror(D: FantasmaVivo & { tipo: 'terror' }, dt: number) {
    if (D.capturado) return
    if (D.absorve >= 0) { mostrarSinal(D.sinal, null, null, 0); orbe(ET, _v, 0); passoAbsorve(D, dt); return }
    if (rede) D.alvo = alvoDoFantasma(D, maisPerto(D.d.root.position))
    const a = D.d, r = a.root, chao = D.casa.y
    _plano.vel.set(0, 0, 0); _plano.sumir = null
    if (D.fraco > 0) passoFraco(D, dt)
    else if (D.alvo.pode()) pensarAsaTerror(a, D.alvo, fase.mundo, D.vida / (LUTA_TERROR.vida * vidaX), chao, dt, _plano)
    else acalmar(D)
    // decidiu sumir: os cubos sobem daqui e o anel do destino já abre (o aviso de onde ele vai surgir)
    if (_plano.sumir) { ev(D.id, 'tele', { p: v3(_plano.sumir) }); desfazer(ET, r.position, 0.9); anel(ET, _v.copy(_plano.sumir).setY(chao + 0.04), 0.15, 1.2, TELE.some + TELE.surge) }
    const frente = _plano.vel.x * Math.sin(r.rotation.y) + _plano.vel.z * Math.cos(r.rotation.y)
    const s = animarAsaTerror(a, Math.max(0, frente), dt, D.fraco > 0 ? 1 : 0)
    r.position.x += _plano.vel.x * dt; r.position.z += _plano.vel.z * dt
    if (s.sumiu) { const d = destinoAsaTerror(a); if (d) { r.position.x = d.x; r.position.z = d.z; a.molas.pos = null; desfazer(ET, _v.set(d.x, chao + LUTA_TERROR.altura, d.z), 0.9) } }
    empurrar(fase.mundo, r.position, chao + LUTA_TERROR.altura - 0.9, LUTA_TERROR.raio)
    r.position.y = chao + LUTA_TERROR.altura + s.sobe
    // a bola de luz entre as mandíbulas e a bomba: voa até o chão perto do agente (ou a parede no caminho)
    orbe(ET, bocaNoMundo(a, _v), s.carga)
    if (s.dispara) { dispararBomba(ET, _v, alvoDaBomba(D.alvo, fase.mundo, _v, _bomba)); ev(D.id, 'bomba', { p: v3(_v), q: v3(_bomba) }) }
    ouvirAsaTerror(a, s, dt)
    mostrarSinal(D.sinal, D.fraco > 0 ? _v.copy(r.position).setY(r.position.y + 1.3) : null, D.captura?.forca ?? null, a.anim.t, camera)
    // as caixas do tiro andam com ele: a bola do corpo e o capuz em cima
    a.corpo.getWorldPosition(D.alvos[0].c).y -= 0.35
    a.corpo.getWorldPosition(D.alvos[1].c).y += 0.25
  }

  useFrame((_, dtBruto) => {
    const dt = Math.min(dtBruto, 0.05), ag = alvo.p
    camera.getWorldPosition(mira.de); camera.getWorldDirection(mira.dir); mira.ativa = fase.agente.anim.arma.mira > 0.5
    pulsarAuras(performance.now() / 1000)
    // ---------- as caixas: a recarga e invocar quem cabe ----------
    for (const cx of caixas) {
      for (let i = cx.recarga.length - 1; i >= 0; i--) if ((cx.recarga[i] -= dt) <= 0) cx.recarga.splice(i, 1)
      cx.nasce -= dt
      const livres = cx.c.cargas - cx.vivos - cx.recarga.length
      if (livres <= 0 || cx.usadas >= cx.c.maximo || cx.nasce > 0 || !fase.pode()) continue
      // perto, no andar dela e sem parede no meio (a caixa não ativa através da parede nem de outro andar)
      if (Math.hypot(ag.x - cx.p.x, ag.z - cx.p.z) < cx.c.raio && enxerga(cx.p.x, cx.p.y, cx.p.z)) { invocar(cx); cx.nasce = ESPECTRAIS.nasce }
    }
    // ---------- os fantasmas: o Devora espectros e o Manto espectral ----------
    for (const D of fantasmas.current) { if (D.tipo === 'devora') passoDevora(D, dt); else if (D.tipo === 'manto') passoManto(D, dt); else passoTerror(D, dt) }
    // as bombas do Asa do terror: voam, grudam, piscam e explodem; a explosão fere o agente no raio dela
    passoEfeitos(ET, dt, alvo.p.y)
    for (const p of ET.explodiu) for (const j of fase.jogadores) if (j.pode() && Math.hypot(p.x - j.p.x, p.z - j.p.z) < BOMBA.raio && Math.abs(p.y - (j.p.y + 0.9)) < BOMBA.raio + 0.9) j.ferir(BOMBA.dano, p)
    ouvirEfeitos(ET)
    // ---------- os espectrais: caçam ou patrulham, animam e andam ----------
    const sombras: THREE.Object3D[] = []
    for (const v of vivos.current) {
      if (v.morto >= 0) { v.morto += dt; continue }
      const dtv = v.forte ? dt * APRIMORADO.ritmo : dt // o aprimorado vive mais depressa: anda, voa e ataca 25% mais rápido
      const r = v.a.root
      if (v.dono.horda && rede && (v.troca -= dt) <= 0) { v.troca = DOIS.troca; v.quem = maisPerto(r.position); v.contra = v.forte ? forteDe(v.quem) : v.quem } // a dois: o mais perto
      const dist = Math.hypot(v.quem.p.x - r.position.x, v.quem.p.z - r.position.z)
      // vê o agente? (confere de tempos em tempos: são vários)
      if ((v.olhar -= dt) <= 0) { v.olhar = ESPECTRAIS.olhar; v.visto = enxerga(r.position.x, v.dono.p.y, r.position.z) }
      // perder o foco (longe, ou sem ver: atrás da parede, em outro andar) e achar de novo (perto e vendo)
      if (v.dono.horda) { v.estado = 'caca' } // os da horda caçam até o fim
      else if (v.estado === 'caca') {
        v.longe = dist > ESPECTRAIS.perde ? v.longe + dt : 0
        v.escondido = v.visto ? 0 : v.escondido + dt
        if (v.longe > ESPECTRAIS.semVer || v.escondido > ESPECTRAIS.escondido) { v.estado = 'patrulha'; v.ponto = null; v.pausa = 0.5; if (bando.atacando === v.a) bando.atacando = null }
      } else if (fase.pode() && v.visto && dist < ESPECTRAIS.ve) { v.estado = 'caca'; v.longe = 0; v.escondido = 0 }
      // caçando, só vai atrás de quem está no andar dele (sem subir escada, ele espera embaixo até desistir)
      const caca = v.estado === 'caca' && mesmoAndar(v)
      if (v.tipo === 'sombra') {
        const a = v.a
        const andar = caca ? pensarAssombrado(a, v.contra, bando, fase.mundo, dtv, mira.de) : a.anim.surgir || a.anim.golpe || a.anim.voo ? 0 : patrulhar(v, dtv)
        const s = animarAssombrado(a, { andar }, dtv)
        if (!a.anim.voo) andarNoMundo(r, s.avanca * dtv, fase.mundo, LUTA_SOMBRA.raio, v.dono.p.y)
        if (!a.anim.surgir && !a.anim.voo) sombras.push(r)
        ouvirAssombrado(a, dt)
      } else {
        const a = v.a
        const quer = caca ? pensarAsa(a, v.contra, mira, null, fase.mundo, dtv, _peito) : (patrulhar(v, dtv), undefined)
        const s = animarAsaSombria(a, { alvo: quer }, dtv)
        r.position.addScaledVector(_v.set(Math.cos(r.rotation.y), 0, -Math.sin(r.rotation.y)), s.lado * dtv) // o desvio
        r.position.addScaledVector(_v.set(Math.sin(r.rotation.y), 0, Math.cos(r.rotation.y)), -s.recua * dtv) // o recuo do cuspe
        if (s.cospe && quer) { disparar(v.forte ? PF : P, s.cospe, quer); ev(v.id, 'bola', { p: v3(s.cospe), q: v3(quer), f: v.forte ? 1 : 0 }) } // a bola do aprimorado fere mais: vai no estoque dela
        ouvirAsaSombria(a, dt)
      }
      v.a.corpo.getWorldPosition(v.alvo.c) // a caixa do tiro anda com o corpo
    }
    separar(sombras, LUTA_SOMBRA.separa)
    // os estourados saem depois de um tempo (o som e a mancha ficam)
    vivos.current = vivos.current.filter((v) => { if (v.morto < ESPECTRAIS.some) return true; tirar(v); return false })
    // as bolas da Asa: andam, batem, ou acertam o agente
    for (const [Q, dano] of [[P, LUTA_ASA.dano], [PF, Math.round(LUTA_ASA.dano * APRIMORADO.dano)]] as const) {
      passoProjeteis(Q, dt, E, 0)
      for (const j of fase.jogadores) if (j.pode()) { const onde = acertar(Q, _peito.copy(j.p).setY(j.p.y + 1.2), LUTA_ASA.acerto, E, 0); if (onde) j.ferir(dano, onde) }
      for (const p of Q.bateu) somEm(p, bolaBatendo)
    }
    passoEstouro(E, dt)
    // a dois: o golpe que começou e, 15 vezes por segundo, o retrato de todos
    if (!con) return
    for (const x of [...vivos.current.filter((v) => v.morto < 0), ...fantasmas.current.filter((D) => !D.capturado)]) {
      const g = golpeDe(x)
      if (g !== x.ultimo) { x.ultimo = g; if (g) ev(x.id, 'modo', { v: g, ...(x.tipo === 'asa' && x.a.anim.golpe ? { n: x.a.anim.golpe.lado } : {}) }) }
    }
    if ((retrato.current -= dt) > 0) return
    retrato.current = 1 / DOIS.retrato
    const l: RetratoEsp[] = []
    for (const v of vivos.current) if (v.morto < 0) { const r = v.a.root; l.push([v.id, CODIGO[v.tipo], ...v3(r.position), Math.round(r.rotation.y * 100) / 100, Math.round(r.scale.x * 100), 0, -1, v.forte ? 1 : 0]) }
    for (const D of fantasmas.current) if (!D.capturado) { const r = D.d.root; l.push([D.id, CODIGO[D.tipo], ...v3(r.position), Math.round(r.rotation.y * 100) / 100, Math.round(r.scale.x * 100), D.fraco > 0 ? 1 : 0, D.captura ? Math.round(D.captura.forca) : -1, 0]) }
    con.enviar({ t: 'esp', l })
  })
  // a dois: o tiro do convidado chega como pedido; o host aplica como se fosse dele
  useEffect(() => {
    if (!con) return
    return con.ouvir('acertoE', (m) => {
      _d.set(...m.d)
      const v = vivos.current.find((x) => x.id === m.i && x.morto < 0)
      if (v) { v.alvo.acerta(m.dano, v.alvo.c, _d); return }
      const D = fantasmas.current.find((x) => x.id === m.i)
      if (D) D.alvos[0].acerta(m.dano, D.alvos[0].c, _d)
    })
  }, [con])
  return null
}
