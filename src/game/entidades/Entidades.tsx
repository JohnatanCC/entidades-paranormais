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
// Enquanto alguém caça, toca a música da perseguição (a da Mãe na frente da das Gralhas); quando para, a de antes volta.
import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { faixaAtual, musica, type Faixa } from '../../audio/musica'
import { KIND_ENTIDADE } from '../../maps/entidades'
import type { Chunk } from '../../maps/types'
import { estourar, novoEstouro, passoEstouro } from '../enemies/estouro'
import { animarGralha, estourarGralha, ferir as ferirGralha, pousar } from '../enemies/gralha/animacao'
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
import { LAMPARINA } from '../player/numeros'
import { LUZ, MAE, MESTRE, MUSICA, VISTA } from './numeros'

/** Uma Gralha: onde ela pousa (as do corvo não pousam: se desfazem), o modelo, a caçada (null = parada) e a caixa do tiro. */
interface GralhaViva { casa: THREE.Vector3 | null; vira: number; g: Gralha; caca: Cacadora | null; alvo: Alvejavel; morta: boolean }
/** Um Mestre: o lugar dele, o modelo, o corvo e as 3 Gralhas que o corvo solta; o estado da caçada. */
interface MestreVivo {
  casa: THREE.Vector3; vira: number; m: Mestre; C: Corvo; filhas: GralhaViva[]
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
}
/** A sequência de perto (docs/jogo.md, a fase 1 sem o Luto: na casa não tem poça). */
const SEQUENCIA: NomeGolpe[] = ['garra_d', 'garra_e', 'garra_ultima_d', 'exausta']

const _luz = new THREE.Vector3(), _olho = new THREE.Vector3(), _peito = new THREE.Vector3(), _c = new THREE.Vector3(), _d = new THREE.Vector3()

/** O ponto p está no feixe da lamparina erguida? Dentro do cone (com a folga do corpo dele), no alcance e sem parede no meio. */
function naLuz(fase: AgenteNaFase, mundo: AgenteNaFase['mundo'], p: THREE.Vector3) {
  const L = fase.lamparina, F = LAMPARINA.feixe
  if (L.ergue < LUZ.ergue) return false
  _luz.subVectors(p, L.pos)
  const d = _luz.length()
  if (d > F.alcance || d < 0.01) return false
  const angulo = Math.acos(Math.min(1, _luz.dot(L.dir) / d))
  return angulo < F.abre + Math.atan(LUZ.corpo / d) && alcanceCamera(mundo, L.pos, p, 0.02) > 0.98
}

/** Vê o agente? Perto e sem parede (nem porta fechada, nem móvel alto) no meio. */
function ve(fase: AgenteNaFase, de: THREE.Vector3, alcance: number) {
  const a = fase.agente.root.position
  if (Math.hypot(a.x - de.x, a.z - de.z) > alcance || Math.abs(a.y - de.y) > 2.5) return false
  _peito.set(a.x, a.y + 1.3, a.z)
  return alcanceCamera(fase.mundo, de, _peito, 0.02) > 0.98
}

export function Entidades({ chunks, fase }: { chunks: Chunk[]; fase: AgenteNaFase }) {
  const scene = useThree((s) => s.scene)
  const pontos = useMemo(() => chunks.flatMap((c) => c.points.filter((p) => p.kind === KIND_ENTIDADE)), [chunks])
  const E = useMemo(() => novosEfeitosGralha(), []), estouro = useMemo(() => novoEstouro(), [])

  /** Uma Gralha nova (pousada na casa, ou escondida esperando o corvo, se casa = null). */
  function novaGralha(casa: THREE.Vector3 | null, vira: number): GralhaViva {
    const g = montarGralha()
    const v: GralhaViva = { casa, vira, g, caca: null, morta: !casa, alvo: { c: new THREE.Vector3(), m: new THREE.Vector3(0.3, 0.25, 0.3), acerta: () => {} } }
    if (casa) { g.root.position.copy(casa); g.root.rotation.y = vira; pousar(g, true) } else g.root.visible = false
    v.alvo.acerta = () => {
      if (v.morta) return
      if (ferirGralha(g, E, v.casa?.y ?? 0)) { estourarGralha(g, E, v.casa?.y ?? 0); v.morta = true; calar(g) }
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
      const M: MestreVivo = { casa, vira: ang(p), m, C: novoCorvo(), filhas, estado: 'espera', descanso: 0, alvo: { c: new THREE.Vector3(), m: new THREE.Vector3(0.45, 1.1, 0.45), atravessa: true, acerta: () => {} } }
      M.alvo.acerta = () => { glitchar(m); if (M.estado === 'espera') { M.estado = 'grito'; gritar(m) } }
      return M
    })
    const maes = pontos.filter((p) => p.params?.tipo === 'mae').map((p): MaeViva => {
      const m = montarMae(), casa = new THREE.Vector3(...p.pos)
      m.root.position.copy(casa); m.root.rotation.y = ang(p)
      const M: MaeViva = { casa, vira: ang(p), m, estado: 'espera', fila: [], carga: 0, pegou: null, visto: new THREE.Vector3(), semVer: 0, vida: MAE.vida, tonta: false, alvo: { c: new THREE.Vector3(), m: new THREE.Vector3(0.45, 1.15, 0.45), acerta: () => {} } }
      M.alvo.acerta = (dano) => {
        if (M.tonta) return // caída, o tiro não tira mais nada (ela é imortal: só atordoa)
        piscar(m.root)
        // levou tiro sem ter visto: acorda, olha para quem atirou e grita
        if (M.estado === 'espera' || M.estado === 'volta') { M.estado = 'grito'; golpear(m, 'grito'); M.visto.copy(fase.agente.root.position); M.semVer = 0 }
        if ((M.vida -= dano) <= 0) { M.vida = 0; M.tonta = true; M.fila = []; M.estado = 'caca'; golpear(m, 'atordoada') }
      }
      return M
    })
    return { gralhas, mestres, maes }
  }, [pontos, E])
  const musicaAntes = useRef<Faixa | null>(null), semCaca = useRef(0), tocando = useRef<Faixa | false>(false)

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

  useFrame((_, dtBruto) => {
    const dt = Math.min(dtBruto, 0.05), agente = fase.agente.root.position, mundo = fase.mundo
    let cacando = false, maeCacando = false

    // ---------- as Mães ----------
    for (const M of maes) {
      const m = M.m, r = m.root, g = m.anim.golpe, longe = Math.hypot(agente.x - r.position.x, agente.z - r.position.z)
      const quer = Math.atan2(agente.x - r.position.x, agente.z - r.position.z)
      const erro = Math.abs(Math.atan2(Math.sin(quer - r.rotation.y), Math.cos(quer - r.rotation.y)))
      M.carga = Math.max(0, M.carga - dt)
      _olho.set(r.position.x, r.position.y + 1.9, r.position.z)
      // levantou da atordoada: a vida volta cheia
      if (M.tonta && g?.nome !== 'atordoada') { M.tonta = false; M.vida = MAE.vida }
      if (M.estado === 'espera') {
        if (ve(fase, _olho, VISTA.mae)) { M.estado = 'grito'; golpear(m, 'grito'); M.visto.copy(agente); M.semVer = 0 }
      } else if (M.estado === 'grito') {
        maeCacando = true
        girarPara(r, agente.x, agente.z, MAE.vira, dt)
        if (!g) { M.estado = 'caca'; M.carga = MAE.cargaPrimeira }
      } else if (M.estado === 'caca') {
        maeCacando = true
        // vendo o agente, vai atrás dele e ataca; sem ver (dobrou um canto, fechou a porta), vai até onde o viu por último;
        // sem ver por muito tempo, ou longe demais, desiste (achar o caminho pela casa vem com a Mãe perseguidora)
        const vendo = ve(fase, _olho, VISTA.larga)
        if (vendo) { M.visto.copy(agente); M.semVer = 0 } else M.semVer += dt
        // a sequência é de perto: o agente fugiu, ela para de golpear o ar
        if (M.fila.length && (longe > MAE.garra + MAE.foge || !vendo)) M.fila = []
        if (M.tonta) { /* caída: espera levantar */ }
        else if (longe > VISTA.larga || M.semVer > MAE.perde || !fase.pode()) { M.estado = 'volta'; M.fila = []; m.anim.golpe = null }
        else if (!g) {
          const ataca = vendo && erro < MAE.mira
          if (M.fila.length) { M.pegou = null; golpear(m, M.fila.shift()!) } // a sequência continua
          else if (ataca && longe < MAE.garra) { M.fila = [...SEQUENCIA]; M.pegou = null; golpear(m, M.fila.shift()!) }
          else if (ataca && longe < MAE.aproxima) { M.pegou = null; golpear(m, 'aproximar') }
          else if (ataca && longe > MAE.cargaDe[0] && longe < MAE.cargaDe[1] && M.carga <= 0) { M.pegou = null; M.carga = MAE.cargaCada; golpear(m, 'carga') }
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
        if (ve(fase, _olho, VISTA.mae)) { M.estado = 'grito'; golpear(m, 'grito') }
      }
      const s = animarMae(m, { perto: longe, caca: M.estado !== 'espera' }, dt)
      // o golpe empurra ela para a frente (com as paredes), sem atravessar o agente
      if (s.avanca) andarNoMundo(r, s.avanca > 0 ? Math.min(s.avanca * dt, Math.max(0, longe - MAE.encosta)) : s.avanca * dt, mundo, MAE.raio)
      r.position.y = M.casa.y + s.y
      M.alvo.c.set(r.position.x, r.position.y + 1.1, r.position.z)
      // o que pega: o corte da garra (logo depois do aviso, perto e na frente dela) e a carga correndo (encostou)
      const h = m.anim.golpe
      if (h && M.pegou !== h && fase.pode()) {
        const corte = h.nome.startsWith('garra') && h.t > GOLPE.garra.preparo && h.t < GOLPE.garra.preparo + MAE.corte
        const corre = h.nome === 'carga' && h.t > GOLPE.carga.prepara && h.t < GOLPE.carga.prepara + GOLPE.carga.corre
        if ((corte && longe < MAE.garra + 0.3 && erro < 1.1) || (corre && longe < MAE.encosta + 0.25)) {
          M.pegou = h
          fase.ferir(corte ? MAE.danoGarra : MAE.danoCarga, _c.copy(r.position).setY(r.position.y + 1.3))
        }
      }
    }

    // ---------- os Mestres ----------
    for (const M of mestres) {
      const m = M.m, r = m.root, A = m.anim, longe = Math.hypot(agente.x - r.position.x, agente.z - r.position.z)
      // a luz da lamparina erguida nele: cobre-se e recua (no grito, não: ele termina de gritar)
      const luz = !A.grito && naLuz(fase, mundo, _peito.set(r.position.x, r.position.y + 1.3, r.position.z))
      if (luz !== A.coberto) cobrir(m, luz)
      if (M.estado === 'espera') {
        _olho.set(r.position.x, r.position.y + 1.7, r.position.z)
        if (luz) M.estado = 'caca' // a luz nele parado: acorda já se cobrindo
        else if (ve(fase, _olho, VISTA.mestre)) { M.estado = 'grito'; gritar(m) }
      } else if (M.estado === 'grito') {
        cacando = true
        girarPara(r, agente.x, agente.z, MESTRE.vira, dt) // de frente para o agente enquanto grita
        if (!A.grito) { M.estado = 'caca'; correr(m, true) }
      } else if (M.estado === 'caca') {
        cacando = true
        M.descanso = Math.max(0, M.descanso - dt)
        if (longe > VISTA.larga || !fase.pode()) { M.estado = 'volta'; correr(m, false) }
        else if (A.coberto) { correr(m, false); girarPara(r, agente.x, agente.z, MESTRE.vira, dt) } // coberto: recua de frente para a luz
        else if (!A.mordida) {
          // de lado para o agente, freia e vira no lugar (correndo de lado ele ficaria rodando em volta); de frente, corre
          // até o alcance e morde
          girarPara(r, agente.x, agente.z, MESTRE.vira, dt)
          const quer = Math.atan2(agente.x - r.position.x, agente.z - r.position.z)
          const erro = Math.abs(Math.atan2(Math.sin(quer - r.rotation.y), Math.cos(quer - r.rotation.y)))
          if (longe < MORDIDA.alcance) {
            correr(m, false)
            if (M.descanso <= 0 && erro < MESTRE.mira) { morder(m); M.descanso = MESTRE.descanso }
          } else if (erro > MESTRE.freia) correr(m, false)
          else { correr(m, true); andarNoMundo(r, Math.min(CORRIDA.vel * dt, longe - MESTRE.encosta), mundo, MESTRE.raio) }
        }
      } else if (M.estado === 'volta') {
        // volta devagar para o lugar dele e espera de novo, de frente para onde estava
        if (Math.hypot(M.casa.x - r.position.x, M.casa.z - r.position.z) > 0.3) { girarPara(r, M.casa.x, M.casa.z, MESTRE.vira, dt); andarNoMundo(r, MESTRE.volta * dt, mundo, MESTRE.raio) }
        else {
          const falta = Math.atan2(Math.sin(M.vira - r.rotation.y), Math.cos(M.vira - r.rotation.y))
          r.rotation.y += falta * (1 - Math.exp(-3 * dt))
          if (ve(fase, _olho.set(r.position.x, r.position.y + 1.7, r.position.z), VISTA.mestre)) { M.estado = 'grito'; gritar(m) }
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
      if (s.mordeu && fase.pode() && longe < MORDIDA.alcance + MESTRE.folgaMordida) fase.ferir(MORDIDA.dano, _c.copy(r.position).setY(r.position.y + 1.4))
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
        // pousada: olha em volta; viu o agente, levanta voo
        g.corpo.getWorldPosition(_olho)
        if (ve(fase, _olho, VISTA.gralha)) acordar(v)
      } else {
        cacando = true
        perseguir(v.caca, agente, dt)
        if (Math.hypot(agente.x - r.position.x, agente.z - r.position.z) > VISTA.larga || !fase.pode()) {
          if (!v.casa) { // as do corvo se desfazem em fumaça
            estourar(estouro, r.position, 0.3, 0, { cubos: 10, olhos: 0, pano: 0, mancha: false })
            v.morta = true; v.caca = null; r.visible = false; calar(g); continue
          }
          // as do mapa voltam e pousam no lugar delas
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
  })
  return null
}
