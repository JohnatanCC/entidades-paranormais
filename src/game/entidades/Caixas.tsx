// As caixas de espectrais (o jogo novo, docs/demonios.md): pontos do mapa (a aba Entidades, tipo 'caixa') invisíveis
// no jogo. Quando o agente entra no raio dela (no andar dela), ela invoca um espectral por carga livre: a Sombra
// espectral sobe do chão; a Asa espectral rompe o chão e sobe voando. Quando um morre, a carga dele volta depois da
// recarga; invocou o máximo, ela para de vez.
// Os espectrais caçam o agente com a luta dos Sombrios (assombrado/ia.ts e asa-sombria/ia.ts). Se o agente ficar longe
// (ESPECTRAIS.perde) por um tempo, eles perdem o foco e patrulham em volta da caixa deles, de ponto em ponto, desviando
// das paredes; vendo o agente de novo (ou levando tiro), voltam a caçar. Só fora do teste online (a rede ainda não conta
// as caixas). Os números em numeros.ts (ESPECTRAIS) e os da caixa no params do ponto (maps/entidades.ts, caixaDe).
import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { KIND_ENTIDADE, caixaDe, type Caixa } from '../../maps/entidades'
import type { Chunk } from '../../maps/types'
import { soltarGolpe } from '../../render/golpe'
import { animarAsaSombria, estourarAsa, ferir as ferirAsa } from '../enemies/asa-sombria/animacao'
import { pensarAsa, type Mira } from '../enemies/asa-sombria/ia'
import { montarAsaSombria, type AsaSombria } from '../enemies/asa-sombria/modelo'
import { LUTA as LUTA_ASA } from '../enemies/asa-sombria/numeros'
import { acertar, disparar, novosProjeteis, passoProjeteis } from '../enemies/asa-sombria/projetil'
import { bolaBatendo, ouvirAsaSombria } from '../enemies/asa-sombria/sons'
import { animarAssombrado, estourarAssombrado, ferir as ferirSombra, surgirAssombrado } from '../enemies/assombrado/animacao'
import { novoBando, pensarAssombrado } from '../enemies/assombrado/ia'
import { montarAssombrado, type Assombrado } from '../enemies/assombrado/modelo'
import { LUTA as LUTA_SOMBRA } from '../enemies/assombrado/numeros'
import { ouvirAssombrado } from '../enemies/assombrado/sons'
import { estourar, novoEstouro, passoEstouro } from '../enemies/estouro'
import { andarNoMundo, girarPara, rumoLivre, separar, sorteado, type Alvo } from '../enemies/luta'
import { calar, somEm } from '../enemies/sons'
import type { AgenteNaFase } from '../Testar'
import type { Alvejavel } from '../weapons/bala'
import { alcanceCamera, empurrar, temChao } from '../world/colisao'
import { ganchos } from '../../dev/ganchos'
import { ESPECTRAIS } from './numeros'

// as caixas onde a bala acerta (meias medidas, m: as mesmas dos Sombrios na Demo · Intro)
const CAIXA_TIRO = { sombra: [0.6, 0.7, 0.6], asa: [0.8, 0.55, 0.8] } as const

type Espectral = ({ tipo: 'sombra'; a: Assombrado } | { tipo: 'asa'; a: AsaSombria }) & {
  dono: CaixaViva; vida: number; alvo: Alvejavel
  estado: 'caca' | 'patrulha'; longe: number // há quanto tempo o agente está longe (s)
  ponto: THREE.Vector3 | null; pausa: number // a patrulha: para onde vai e quanto ainda espera parado
  morto: number // −1 vivo; s desde que estourou
}
/** Uma caixa no jogo: onde, os números, as cargas voltando (s que faltam de cada), quantos já invocou, quantos vivos e
 *  quanto falta para poder invocar o próximo. */
interface CaixaViva { p: THREE.Vector3; c: Caixa; recarga: number[]; usadas: number; vivos: number; nasce: number }

const _ir = { x: 0, z: 0 }, _v = new THREE.Vector3(), _peito = new THREE.Vector3(), _olho = new THREE.Vector3()
const caixaDeTiro = (m: readonly number[]): Alvejavel => ({ c: new THREE.Vector3(), m: new THREE.Vector3(m[0], m[1], m[2]), acerta: () => {} })

export function Caixas({ chunks, fase }: { chunks: Chunk[]; fase: AgenteNaFase }) {
  const scene = useThree((s) => s.scene), camera = useThree((s) => s.camera)
  const caixas = useMemo(() => chunks.flatMap((ch) => ch.points.filter((p) => p.kind === KIND_ENTIDADE && p.params?.tipo === 'caixa'))
    .map((p): CaixaViva => ({ p: new THREE.Vector3(...p.pos), c: caixaDe(p.params), recarga: [], usadas: 0, vivos: 0, nasce: 0 })), [chunks])
  const E = useMemo(() => novoEstouro(), []), P = useMemo(() => novosProjeteis(), []), grupo = useMemo(() => new THREE.Group(), [])
  const bando = useMemo(() => novoBando(), [])
  const vivos = useRef<Espectral[]>([])
  const alvo = useMemo<Alvo>(() => ({ p: fase.agente.root.position, pode: fase.pode, ferir: fase.ferir, engolir: fase.engolir, cuspir: fase.cuspir, lentidao: fase.lentidao }), [fase])
  const mira = useMemo<Mira>(() => ({ de: new THREE.Vector3(), dir: new THREE.Vector3(), ativa: false }), [])

  const tirar = (v: Espectral) => {
    grupo.remove(v.a.root); calar(v.a); soltarGolpe(v.a.root)
    const i = fase.alvos.indexOf(v.alvo); if (i >= 0) fase.alvos.splice(i, 1)
  }
  useEffect(() => {
    scene.add(grupo, E.grupo, P.grupo)
    return () => { for (const v of vivos.current) tirar(v); vivos.current = []; scene.remove(grupo, E.grupo, P.grupo) }
  }, [scene, grupo, E, P])
  // as provas (só no npm run dev): provas.caixas() diz o que cada caixa já fez e o estado de cada espectral
  useEffect(() => {
    if (!import.meta.env.DEV) return
    ganchos.caixas = () => caixas.map((cx) => ({
      caixa: `${cx.c.monstro} em ${cx.p.x}, ${cx.p.z}`, usadas: cx.usadas, vivos: cx.vivos, recarga: cx.recarga.map((t) => Math.round(t)),
      espectrais: vivos.current.filter((v) => v.dono === cx && v.morto < 0).map((v) => ({ tipo: v.tipo, estado: v.estado, vida: v.vida, dist: Math.round(Math.hypot(v.a.root.position.x - cx.p.x, v.a.root.position.z - cx.p.z) * 10) / 10 })),
    }))
    return () => { delete ganchos.caixas }
  }, [caixas])
  // o mapa mudou (outro Testar): as caixas recomeçam, e os espectrais de antes saem
  useEffect(() => () => { for (const v of vivos.current) tirar(v); vivos.current = [] }, [caixas])

  /** A caixa invoca um espectral perto dela, virado para o agente. */
  function invocar(cx: CaixaViva) {
    const ag = alvo.p, ang = Math.random() * Math.PI * 2, r = Math.random() * 1.2
    const p = new THREE.Vector3(cx.p.x + Math.cos(ang) * r, cx.p.y, cx.p.z + Math.sin(ang) * r)
    if (!temChao(fase.mundo, p.x, p.z, p.y)) p.copy(cx.p)
    const yaw = Math.atan2(ag.x - p.x, ag.z - p.z)
    const base = { dono: cx, estado: 'caca' as const, longe: 0, ponto: null, pausa: 0, morto: -1 }
    let v: Espectral
    if (cx.c.monstro === 'asa') {
      const a = montarAsaSombria('espectrais/asa-espectral'); a.root.position.copy(p).setY(p.y + 0.3); a.root.rotation.y = yaw
      estourar(E, _v.copy(p).setY(p.y + 0.1), 0.35, p.y, { cubos: 8, olhos: 0 }) // rompe o chão
      v = { ...base, tipo: 'asa', a, vida: LUTA_ASA.vida, alvo: caixaDeTiro(CAIXA_TIRO.asa) }
    } else {
      const a = montarAssombrado('espectrais/sombra-espectral'); a.root.position.copy(p); a.root.rotation.y = yaw
      surgirAssombrado(a, E, p.y)
      v = { ...base, tipo: 'sombra', a, vida: LUTA_SOMBRA.vida, alvo: caixaDeTiro(CAIXA_TIRO.sombra) }
    }
    v.alvo.acerta = (dano, _p, dir) => tiro(v, dano, dir)
    grupo.add(v.a.root); fase.alvos.push(v.alvo); vivos.current.push(v)
    cx.usadas++; cx.vivos++
  }

  /** Uma bala acertou: o tranco do lado do tiro, e ele volta a caçar; zerou, estoura e a carga começa a voltar. */
  function tiro(v: Espectral, dano: number, dir: THREE.Vector3) {
    if (v.morto >= 0) return
    const y = v.a.root.rotation.y, de = Math.atan2(-dir.x * Math.cos(y) + dir.z * Math.sin(y), -dir.x * Math.sin(y) - dir.z * Math.cos(y))
    if (v.tipo === 'sombra') ferirSombra(v.a, de); else ferirAsa(v.a, de)
    v.estado = 'caca'; v.longe = 0; v.ponto = null
    if ((v.vida -= dano) > 0) return
    if (v.tipo === 'sombra') estourarAssombrado(v.a, E, v.dono.p.y); else estourarAsa(v.a, E, v.dono.p.y)
    if (bando.atacando === v.a) bando.atacando = null
    v.morto = 0
    const i = fase.alvos.indexOf(v.alvo); if (i >= 0) fase.alvos.splice(i, 1)
    v.dono.vivos--; v.dono.recarga.push(v.dono.c.recarga)
  }

  /** Vê o agente: perto, no andar dele e sem nada tapando (as paredes, as portas fechadas). */
  function ve(v: Espectral) {
    const ag = alvo.p, r = v.a.root.position
    if (Math.hypot(ag.x - r.x, ag.z - r.z) > ESPECTRAIS.ve || Math.abs(ag.y - v.dono.p.y) > ESPECTRAIS.andar) return false
    return alcanceCamera(fase.mundo, _olho.set(r.x, v.dono.p.y + 1.2, r.z), _peito.set(ag.x, ag.y + 1.2, ag.z), 0.02) > 0.98
  }

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

  useFrame((_, dtBruto) => {
    const dt = Math.min(dtBruto, 0.05), ag = alvo.p
    camera.getWorldPosition(mira.de); camera.getWorldDirection(mira.dir); mira.ativa = fase.agente.anim.arma.mira > 0.5
    // ---------- as caixas: a recarga e invocar quem cabe ----------
    for (const cx of caixas) {
      for (let i = cx.recarga.length - 1; i >= 0; i--) if ((cx.recarga[i] -= dt) <= 0) cx.recarga.splice(i, 1)
      cx.nasce -= dt
      const perto = Math.hypot(ag.x - cx.p.x, ag.z - cx.p.z) < cx.c.raio && Math.abs(ag.y - cx.p.y) < ESPECTRAIS.andar
      const livres = cx.c.cargas - cx.vivos - cx.recarga.length
      if (perto && fase.pode() && livres > 0 && cx.usadas < cx.c.maximo && cx.nasce <= 0) { invocar(cx); cx.nasce = ESPECTRAIS.nasce }
    }
    // ---------- os espectrais: caçam ou patrulham, animam e andam ----------
    const sombras: THREE.Object3D[] = []
    for (const v of vivos.current) {
      if (v.morto >= 0) { v.morto += dt; continue }
      const r = v.a.root, dist = Math.hypot(ag.x - r.position.x, ag.z - r.position.z)
      // perder o foco e achar de novo
      if (v.estado === 'caca') {
        v.longe = dist > ESPECTRAIS.perde || Math.abs(ag.y - v.dono.p.y) > ESPECTRAIS.andar ? v.longe + dt : 0
        if (v.longe > ESPECTRAIS.semVer) { v.estado = 'patrulha'; v.ponto = null; v.pausa = 0.5; if (bando.atacando === v.a) bando.atacando = null }
      } else if (fase.pode() && ve(v)) { v.estado = 'caca'; v.longe = 0 }
      const caca = v.estado === 'caca'
      if (v.tipo === 'sombra') {
        const a = v.a
        const andar = caca ? pensarAssombrado(a, alvo, bando, fase.mundo, dt, mira.de) : a.anim.surgir || a.anim.golpe ? 0 : patrulhar(v, dt)
        const s = animarAssombrado(a, { andar }, dt)
        andarNoMundo(r, s.avanca * dt, fase.mundo, LUTA_SOMBRA.raio)
        if (!a.anim.surgir) sombras.push(r)
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
