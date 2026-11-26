// Os espectrais do mapa (o jogo novo, docs/demonios.md), ganhando vida no Testar (a aba Entidades):
//   As caixas de espectrais (tipo 'caixa'): invisíveis no jogo. Quando o agente entra no raio dela (no andar dela, sem
//     parede no meio), ela invoca um espectral por carga livre: a Sombra espectral sobe do chão; a Asa espectral rompe o
//     chão e sobe voando. Quando um morre, a carga dele volta depois da recarga; invocou o máximo, ela para de vez.
//   O Devora espectros (tipo 'devora-espectros'): o fantasma capturável. Flutua no lugar dele até ver o agente; caça com
//     o bote, a mordida e o cuspe (as crias dele são espectrais como os das caixas, e patrulham em volta do lugar dele).
//     Com a vida zerada fica fraco (afunda e amolece: a janela da captura, que ainda vai existir) e, passado um tempo,
//     volta com a vida cheia. Longe demais, ou sem ver o agente, volta para o lugar dele.
// Os espectrais caçam o agente com a luta dos Sombrios (assombrado/ia.ts e asa-sombria/ia.ts). Se o agente ficar longe
// (ESPECTRAIS.perde) por um tempo, eles perdem o foco e patrulham em volta da caixa deles, de ponto em ponto, desviando
// das paredes; também desistem se ficarem um tempo sem ver o agente (atrás da parede, em outro andar). Vendo o agente
// de novo (ou levando tiro), voltam a caçar. Ninguém ataca quem está em outro andar (subir escada atrás dele vem com o
// mapa de caminhos). Só fora do teste online (a rede ainda não conta os espectrais). Os números em numeros.ts
// (ESPECTRAIS), os da caixa no params do ponto (maps/entidades.ts, caixaDe) e os do Devora no numeros.ts da pasta dele.
import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { CAIXA, KIND_ENTIDADE, caixaDe, type Caixa } from '../../maps/entidades'
import type { Chunk } from '../../maps/types'
import { soltarGolpe } from '../../render/golpe'
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
import { ouvirDevoraEspectros } from '../enemies/devora-espectros/sons'
import { estourar, novoEstouro, passoEstouro } from '../enemies/estouro'
import { andarNoMundo, girarPara, rumoLivre, separar, sorteado, type Alvo } from '../enemies/luta'
import { calar, somEm } from '../enemies/sons'
import type { AgenteNaFase } from '../Testar'
import type { Alvejavel } from '../weapons/bala'
import { alcanceCamera, empurrar, temChao } from '../world/colisao'
import { ganchos } from '../../dev/ganchos'
import { ESPECTRAIS } from './numeros'

// as caixas onde a bala acerta (meias medidas, m: as da Sombra e da Asa são as dos Sombrios na Demo · Intro; o Devora,
// a boca, o corpo e a cauda)
const CAIXA_TIRO = { sombra: [0.6, 0.7, 0.6], asa: [0.8, 0.55, 0.8], boca: [0.45, 0.45, 0.45], corpo: [0.7, 0.6, 0.7], cauda: [0.55, 0.5, 0.55] } as const

type Espectral = ({ tipo: 'sombra'; a: Assombrado } | { tipo: 'asa'; a: AsaSombria }) & {
  dono: CaixaViva; vida: number; alvo: Alvejavel
  estado: 'caca' | 'patrulha'; longe: number // há quanto tempo o agente está longe (s)
  escondido: number; olhar: number; visto: boolean // há quanto tempo não o vê (s), quando confere de novo (s) e se viu na última vez
  ponto: THREE.Vector3 | null; pausa: number // a patrulha: para onde vai e quanto ainda espera parado
  morto: number // −1 vivo; s desde que estourou
}
/** Uma caixa no jogo: onde, os números, as cargas voltando (s que faltam de cada), quantos já invocou, quantos vivos e
 *  quanto falta para poder invocar o próximo. O Devora tem uma também (o ninho: o centro da patrulha das crias dele e
 *  quantas estão vivas), que nunca invoca. */
interface CaixaViva { p: THREE.Vector3; c: Caixa; recarga: number[]; usadas: number; vivos: number; nasce: number }
/** O Devora espectros no jogo: o lugar dele (casa, para onde olha, o chão do andar), a vida, quanto ainda fica fraco
 *  (s; 0 = não está), o estado, o foco (como o dos espectrais), o ninho das crias, as caixas do tiro e o alvo (o agente,
 *  só no andar dele). */
interface DevoraVivo {
  d: DevoraEspectros; casa: THREE.Vector3; vira: number; vida: number; fraco: number
  estado: 'espera' | 'caca' | 'volta'; longe: number; escondido: number; olhar: number; visto: boolean
  ninho: CaixaViva; alvos: Alvejavel[]; alvo: Alvo
}

const _ir = { x: 0, z: 0 }, _v = new THREE.Vector3(), _f = new THREE.Vector3(), _peito = new THREE.Vector3(), _olho = new THREE.Vector3()
const caixaDeTiro = (m: readonly number[]): Alvejavel => ({ c: new THREE.Vector3(), m: new THREE.Vector3(m[0], m[1], m[2]), acerta: () => {} })
/** De onde veio o tiro, no espaço de quem levou (rad). */
const deOnde = (raiz: THREE.Object3D, dir: THREE.Vector3) => { const y = raiz.rotation.y; return Math.atan2(-dir.x * Math.cos(y) + dir.z * Math.sin(y), -dir.x * Math.sin(y) - dir.z * Math.cos(y)) }

export function Espectrais({ chunks, fase }: { chunks: Chunk[]; fase: AgenteNaFase }) {
  const scene = useThree((s) => s.scene), camera = useThree((s) => s.camera)
  const alvo = useMemo<Alvo>(() => ({ p: fase.agente.root.position, pode: fase.pode, ferir: fase.ferir, engolir: fase.engolir, cuspir: fase.cuspir, lentidao: fase.lentidao }), [fase])
  const pontos = useMemo(() => chunks.flatMap((ch) => ch.points.filter((p) => p.kind === KIND_ENTIDADE)), [chunks])
  const caixas = useMemo(() => pontos.filter((p) => p.params?.tipo === 'caixa')
    .map((p): CaixaViva => ({ p: new THREE.Vector3(...p.pos), c: caixaDe(p.params), recarga: [], usadas: 0, vivos: 0, nasce: 0 })), [pontos])
  const devoras = useMemo(() => pontos.filter((p) => p.params?.tipo === 'devora-espectros').map((p): DevoraVivo => {
    const d = montarDevoraEspectros(), casa = new THREE.Vector3(...p.pos), vira = (Number(p.params?.vira ?? 0) * Math.PI) / 180
    d.root.position.copy(casa); d.root.rotation.y = vira
    const D: DevoraVivo = {
      d, casa, vira, vida: LUTA_DEVORA.vida, fraco: 0, estado: 'espera', longe: 0, escondido: 0, olhar: 0, visto: false,
      ninho: { p: casa, c: { ...CAIXA, maximo: 0 }, recarga: [], usadas: 0, vivos: 0, nasce: 0 },
      alvos: [caixaDeTiro(CAIXA_TIRO.boca), caixaDeTiro(CAIXA_TIRO.corpo), caixaDeTiro(CAIXA_TIRO.cauda)],
      alvo: { ...alvo, pode: () => fase.pode() && Math.abs(alvo.p.y - casa.y) < ESPECTRAIS.andar },
    }
    for (const a of D.alvos) a.acerta = (dano, _p, dir) => tiroNoDevora(D, dano, dir)
    return D
  }), [pontos, alvo, fase])
  const E = useMemo(() => novoEstouro(), []), P = useMemo(() => novosProjeteis(), []), grupo = useMemo(() => new THREE.Group(), [])
  const bando = useMemo(() => novoBando(), [])
  const vivos = useRef<Espectral[]>([])
  const mira = useMemo<Mira>(() => ({ de: new THREE.Vector3(), dir: new THREE.Vector3(), ativa: false }), [])

  const tirar = (v: Espectral) => {
    grupo.remove(v.a.root); calar(v.a); soltarGolpe(v.a.root)
    const i = fase.alvos.indexOf(v.alvo); if (i >= 0) fase.alvos.splice(i, 1)
  }
  useEffect(() => {
    scene.add(grupo, E.grupo, P.grupo)
    return () => { for (const v of vivos.current) tirar(v); vivos.current = []; scene.remove(grupo, E.grupo, P.grupo) }
  }, [scene, grupo, E, P])
  // o mapa mudou (outro Testar): as caixas recomeçam, e os espectrais de antes saem
  useEffect(() => () => { for (const v of vivos.current) tirar(v); vivos.current = [] }, [caixas])
  // os Devoras: entram na cena e na lista do tiro; saindo, calam
  useEffect(() => {
    for (const D of devoras) { grupo.add(D.d.root); fase.alvos.push(...D.alvos) }
    return () => {
      for (const D of devoras) {
        grupo.remove(D.d.root); calar(D.d); soltarGolpe(D.d.root)
        for (const a of D.alvos) { const i = fase.alvos.indexOf(a); if (i >= 0) fase.alvos.splice(i, 1) }
      }
    }
  }, [devoras, grupo, fase])
  // as provas (só no npm run dev): provas.caixas() diz o que cada caixa (e cada Devora) já fez e o estado de cada espectral
  useEffect(() => {
    if (!import.meta.env.DEV) return
    const dele = (cx: CaixaViva) => vivos.current.filter((v) => v.dono === cx && v.morto < 0).map((v) => ({ tipo: v.tipo, estado: v.estado, vida: v.vida, dist: Math.round(Math.hypot(v.a.root.position.x - cx.p.x, v.a.root.position.z - cx.p.z) * 10) / 10 }))
    ganchos.caixas = () => [
      ...caixas.map((cx) => ({ caixa: `${cx.c.monstro} em ${cx.p.x}, ${cx.p.z}`, usadas: cx.usadas, vivos: cx.vivos, recarga: cx.recarga.map((t) => Math.round(t)), espectrais: dele(cx) })),
      ...devoras.map((D) => ({ caixa: `Devora em ${D.casa.x}, ${D.casa.z}: ${D.fraco > 0 ? 'fraco' : D.estado}, vida ${D.vida}, ${D.d.anim.modo}`, usadas: 0, vivos: D.ninho.vivos, recarga: [], espectrais: dele(D.ninho) })),
    ]
    return () => { delete ganchos.caixas }
  }, [caixas, devoras])

  /** Um espectral novo entra (o da caixa, ou a cria do Devora). */
  function entra(v: Espectral) {
    v.alvo.acerta = (dano, _p, dir) => tiro(v, dano, dir)
    grupo.add(v.a.root); fase.alvos.push(v.alvo); vivos.current.push(v)
    v.dono.vivos++
  }
  const novo = (dono: CaixaViva) => ({ dono, estado: 'caca' as const, longe: 0, escondido: 0, olhar: 0, visto: true, ponto: null, pausa: 0, morto: -1 })

  /** A caixa invoca um espectral perto dela, virado para o agente. */
  function invocar(cx: CaixaViva) {
    const ag = alvo.p, ang = Math.random() * Math.PI * 2, r = Math.random() * 1.2
    const p = new THREE.Vector3(cx.p.x + Math.cos(ang) * r, cx.p.y, cx.p.z + Math.sin(ang) * r)
    if (!temChao(fase.mundo, p.x, p.z, p.y)) p.copy(cx.p)
    const yaw = Math.atan2(ag.x - p.x, ag.z - p.z)
    if (cx.c.monstro === 'asa') {
      const a = montarAsaSombria('espectrais/asa-espectral'); a.root.position.copy(p).setY(p.y + 0.3); a.root.rotation.y = yaw
      estourar(E, _v.copy(p).setY(p.y + 0.1), 0.35, p.y, { cubos: 8, olhos: 0 }) // rompe o chão
      entra({ ...novo(cx), tipo: 'asa', a, vida: LUTA_ASA.vida, alvo: caixaDeTiro(CAIXA_TIRO.asa) })
    } else {
      const a = montarAssombrado('espectrais/sombra-espectral'); a.root.position.copy(p); a.root.rotation.y = yaw
      surgirAssombrado(a, E, p.y)
      entra({ ...novo(cx), tipo: 'sombra', a, vida: LUTA_SOMBRA.vida, alvo: caixaDeTiro(CAIXA_TIRO.sombra) })
    }
    cx.usadas++
  }

  /** O Devora cospe uma cria: a Sombra voa da boca até o chão, à frente; a Asa sai voando da boca. */
  function cria(D: DevoraVivo, tipo: CriaEspectros, de: THREE.Vector3, frente: THREE.Vector3) {
    const chao = D.casa.y, dist = CUSPE.alcance[0] + Math.random() * (CUSPE.alcance[1] - CUSPE.alcance[0])
    const para = new THREE.Vector3(de.x + frente.x * dist + (Math.random() - 0.5) * 2, chao, de.z + frente.z * dist + (Math.random() - 0.5) * 2)
    if (!temChao(fase.mundo, para.x, para.z, chao)) para.set(de.x, chao, de.z) // sem chão lá na frente: cai embaixo dele
    if (tipo === 'asa') {
      const a = montarAsaSombria('espectrais/asa-espectral'); a.root.position.copy(de); a.root.rotation.y = D.d.root.rotation.y
      entra({ ...novo(D.ninho), tipo: 'asa', a, vida: LUTA_ASA.vida, alvo: caixaDeTiro(CAIXA_TIRO.asa) })
    } else {
      const a = montarAssombrado('espectrais/sombra-espectral'); arremessar(a, de, para)
      entra({ ...novo(D.ninho), tipo: 'sombra', a, vida: LUTA_SOMBRA.vida, alvo: caixaDeTiro(CAIXA_TIRO.sombra) })
    }
  }

  /** Uma bala acertou um espectral: o tranco do lado do tiro, e ele volta a caçar; zerou, estoura e a carga começa a voltar. */
  function tiro(v: Espectral, dano: number, dir: THREE.Vector3) {
    if (v.morto >= 0) return
    if (v.tipo === 'sombra') ferirSombra(v.a, deOnde(v.a.root, dir)); else ferirAsa(v.a, deOnde(v.a.root, dir))
    v.estado = 'caca'; v.longe = 0; v.ponto = null
    if ((v.vida -= dano) > 0) return
    if (v.tipo === 'sombra') estourarAssombrado(v.a, E, v.dono.p.y); else estourarAsa(v.a, E, v.dono.p.y)
    if (bando.atacando === v.a) bando.atacando = null
    v.morto = 0
    const i = fase.alvos.indexOf(v.alvo); if (i >= 0) fase.alvos.splice(i, 1)
    v.dono.vivos--; v.dono.recarga.push(v.dono.c.recarga)
  }

  /** Uma bala acertou o Devora: o tranco, e ele acorda; zerou, fica fraco (o maior não estoura: é capturado). */
  function tiroNoDevora(D: DevoraVivo, dano: number, dir: THREE.Vector3) {
    if (D.fraco > 0) return // fraco, o tiro não tira mais nada (a captura vem depois)
    ferirDevora(D.d, deOnde(D.d.root, dir))
    if (D.estado !== 'caca') { D.estado = 'caca'; D.longe = 0; D.escondido = 0 }
    if ((D.vida -= dano) > 0) return
    D.vida = 0; D.fraco = FRACO.dura; D.d.anim.modo = 'pairar'; acalmarDevoraEspectros(D.d)
  }

  /** De (x, z), no chão `chao`, dá para ver o agente: no mesmo andar e sem nada tapando (as paredes, as portas fechadas). */
  function enxerga(x: number, chao: number, z: number) {
    const ag = alvo.p
    if (Math.abs(ag.y - chao) > ESPECTRAIS.andar) return false
    return alcanceCamera(fase.mundo, _olho.set(x, chao + 1.2, z), _peito.set(ag.x, ag.y + 1.2, ag.z), 0.02) > 0.98
  }
  /** O agente está no andar dele (quem está em outro andar não leva golpe nem cuspe dele). */
  const mesmoAndar = (v: Espectral) => Math.abs(alvo.p.y - v.dono.p.y) < ESPECTRAIS.andar

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

  /** Um quadro do Devora: fraco, esperando, caçando ou voltando para casa; anima, anda, fere e cospe. */
  function passoDevora(D: DevoraVivo, dt: number) {
    const d = D.d, r = d.root, ag = alvo.p, chao = D.casa.y, dist = Math.hypot(ag.x - r.position.x, ag.z - r.position.z)
    if ((D.olhar -= dt) <= 0) { D.olhar = ESPECTRAIS.olhar; D.visto = enxerga(r.position.x, chao, r.position.z) }
    let andar = 0
    if (D.fraco > 0) { // fraco: fica onde está; passado o tempo, volta com a vida cheia e caçando
      if ((D.fraco -= dt) <= 0) { D.fraco = 0; D.vida = LUTA_DEVORA.vida; D.estado = 'caca'; D.longe = 0; D.escondido = 0 }
    } else if (D.estado === 'espera') {
      if (fase.pode() && D.visto && dist < ESPECTRAIS.ve) { D.estado = 'caca'; D.longe = 0; D.escondido = 0 }
    } else if (D.estado === 'caca') {
      D.longe = dist > ESPECTRAIS.perde ? D.longe + dt : 0
      D.escondido = D.visto ? 0 : D.escondido + dt
      if (D.longe > ESPECTRAIS.semVer || D.escondido > ESPECTRAIS.escondido) { D.estado = 'volta'; acalmarDevoraEspectros(d) }
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
    // as caixas do tiro andam com ele: a boca (à frente da mandíbula), o corpo e a cauda (atrás)
    _f.set(Math.sin(r.rotation.y), 0, Math.cos(r.rotation.y))
    d.mandibula.getWorldPosition(D.alvos[0].c).addScaledVector(_f, 0.3)
    d.corpo.getWorldPosition(D.alvos[1].c)
    D.alvos[2].c.copy(D.alvos[1].c).addScaledVector(_f, -1)
  }

  useFrame((_, dtBruto) => {
    const dt = Math.min(dtBruto, 0.05), ag = alvo.p
    camera.getWorldPosition(mira.de); camera.getWorldDirection(mira.dir); mira.ativa = fase.agente.anim.arma.mira > 0.5
    // ---------- as caixas: a recarga e invocar quem cabe ----------
    for (const cx of caixas) {
      for (let i = cx.recarga.length - 1; i >= 0; i--) if ((cx.recarga[i] -= dt) <= 0) cx.recarga.splice(i, 1)
      cx.nasce -= dt
      const livres = cx.c.cargas - cx.vivos - cx.recarga.length
      if (livres <= 0 || cx.usadas >= cx.c.maximo || cx.nasce > 0 || !fase.pode()) continue
      // perto, no andar dela e sem parede no meio (a caixa não ativa através da parede nem de outro andar)
      if (Math.hypot(ag.x - cx.p.x, ag.z - cx.p.z) < cx.c.raio && enxerga(cx.p.x, cx.p.y, cx.p.z)) { invocar(cx); cx.nasce = ESPECTRAIS.nasce }
    }
    // ---------- o Devora espectros ----------
    for (const D of devoras) passoDevora(D, dt)
    // ---------- os espectrais: caçam ou patrulham, animam e andam ----------
    const sombras: THREE.Object3D[] = []
    for (const v of vivos.current) {
      if (v.morto >= 0) { v.morto += dt; continue }
      const r = v.a.root, dist = Math.hypot(ag.x - r.position.x, ag.z - r.position.z)
      // vê o agente? (confere de tempos em tempos: são vários)
      if ((v.olhar -= dt) <= 0) { v.olhar = ESPECTRAIS.olhar; v.visto = enxerga(r.position.x, v.dono.p.y, r.position.z) }
      // perder o foco (longe, ou sem ver: atrás da parede, em outro andar) e achar de novo (perto e vendo)
      if (v.estado === 'caca') {
        v.longe = dist > ESPECTRAIS.perde ? v.longe + dt : 0
        v.escondido = v.visto ? 0 : v.escondido + dt
        if (v.longe > ESPECTRAIS.semVer || v.escondido > ESPECTRAIS.escondido) { v.estado = 'patrulha'; v.ponto = null; v.pausa = 0.5; if (bando.atacando === v.a) bando.atacando = null }
      } else if (fase.pode() && v.visto && dist < ESPECTRAIS.ve) { v.estado = 'caca'; v.longe = 0; v.escondido = 0 }
      // caçando, só vai atrás de quem está no andar dele (sem subir escada, ele espera embaixo até desistir)
      const caca = v.estado === 'caca' && mesmoAndar(v)
      if (v.tipo === 'sombra') {
        const a = v.a
        const andar = caca ? pensarAssombrado(a, alvo, bando, fase.mundo, dt, mira.de) : a.anim.surgir || a.anim.golpe || a.anim.voo ? 0 : patrulhar(v, dt)
        const s = animarAssombrado(a, { andar }, dt)
        if (!a.anim.voo) andarNoMundo(r, s.avanca * dt, fase.mundo, LUTA_SOMBRA.raio, v.dono.p.y)
        if (!a.anim.surgir && !a.anim.voo) sombras.push(r)
        ouvirAssombrado(a, dt)
      } else {
        const a = v.a
        const quer = caca ? pensarAsa(a, alvo, mira, null, fase.mundo, dt, _peito) : (patrulhar(v, dt), undefined)
        const s = animarAsaSombria(a, { alvo: quer }, dt)
        r.position.addScaledVector(_v.set(Math.cos(r.rotation.y), 0, -Math.sin(r.rotation.y)), s.lado * dt) // o desvio
        r.position.addScaledVector(_v.set(Math.sin(r.rotation.y), 0, Math.cos(r.rotation.y)), -s.recua * dt) // o recuo do cuspe
        if (s.cospe && quer) disparar(P, s.cospe, quer)
        ouvirAsaSombria(a, dt)
      }
      v.a.corpo.getWorldPosition(v.alvo.c) // a caixa do tiro anda com o corpo
    }
    separar(sombras, LUTA_SOMBRA.separa)
    // os estourados saem depois de um tempo (o som e a mancha ficam)
    vivos.current = vivos.current.filter((v) => { if (v.morto < ESPECTRAIS.some) return true; tirar(v); return false })
    // as bolas da Asa: andam, batem, ou acertam o agente
    passoProjeteis(P, dt, E, 0)
    if (fase.pode()) { const onde = acertar(P, _peito.copy(ag).setY(ag.y + 1.2), LUTA_ASA.acerto, E, 0); if (onde) fase.ferir(LUTA_ASA.dano, onde) }
    for (const p of P.bateu) somEm(p, bolaBatendo)
    passoEstouro(E, dt)
  })
  return null
}
