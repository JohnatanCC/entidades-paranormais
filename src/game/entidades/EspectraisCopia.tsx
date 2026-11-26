// Os espectrais no convidado (as demos a dois; docs/teste-online.md): quem pensa é o host (Espectrais.tsx); aqui só as
// cópias. Cada espectral nasce quando o host avisa (novo: a Sombra sobe do chão ou é cuspida, a Asa rompe o chão ou sai
// da boca, o Asa do terror surge em cubos), desliza até onde o retrato diz (15/s) e anima aqui mesmo, com a velocidade
// que andou e os golpes que o host manda (modo); levou tiro, pisca; estourou, estoura aqui também. As bolas da Asa e as
// bombas do Asa do terror voam aqui (só a imagem e o som: o dano é o host que decide e manda). Os fantasmas mostram o
// ícone da lamparina e a barra da captura pelo retrato.
// A bala do convidado que pega numa cópia vira um pedido ao host (acertoE); lá ele aplica o tiro.
import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { enfurecer, soltarGolpe } from '../../render/golpe'
import { novaAura, pulsarAuras } from '../enemies/aura'
import { animarAsaSombria, cuspir, desviar, estourarAsa, ferir as ferirAsa } from '../enemies/asa-sombria/animacao'
import { montarAsaSombria, type AsaSombria } from '../enemies/asa-sombria/modelo'
import { LUTA as LUTA_ASA } from '../enemies/asa-sombria/numeros'
import { acertar, disparar, novosProjeteis, passoProjeteis } from '../enemies/asa-sombria/projetil'
import { bolaBatendo, ouvirAsaSombria } from '../enemies/asa-sombria/sons'
import { animarAssombrado, arremessar, atacar, estourarAssombrado, ferir as ferirSombra, surgirAssombrado } from '../enemies/assombrado/animacao'
import { montarAssombrado, type Assombrado } from '../enemies/assombrado/modelo'
import { ouvirAssombrado } from '../enemies/assombrado/sons'
import { animarAsaTerror, bocaNoMundo, ferir as ferirTerror, golpear as golpearTerror } from '../enemies/asa-terror/animacao'
import { anel, desfazer, dispararBomba, limparEfeitos, novosEfeitos, orbe, passoEfeitos } from '../enemies/asa-terror/efeitos'
import { montarAsaTerror, type AsaTerror } from '../enemies/asa-terror/modelo'
import { TELE } from '../enemies/asa-terror/numeros'
import { ouvirAsaTerror, ouvirEfeitos } from '../enemies/asa-terror/sons'
import { animarDevoraEspectros, ferir as ferirDevora, golpe as golpeDevora, type CriaEspectros } from '../enemies/devora-espectros/animacao'
import { montarDevoraEspectros, type DevoraEspectros } from '../enemies/devora-espectros/modelo'
import { absorvido, ouvirDevoraEspectros } from '../enemies/devora-espectros/sons'
import { animarMantoEspectral, ferir as ferirManto, golpear as golpearManto } from '../enemies/manto-espectral/animacao'
import { montarMantoEspectral, type MantoEspectral } from '../enemies/manto-espectral/modelo'
import { ouvirMantoEspectral } from '../enemies/manto-espectral/sons'
import { descartarTornado } from '../enemies/manto-espectral/tornado'
import { estourar, novoEstouro, passoEstouro } from '../enemies/estouro'
import { calar, somEm } from '../enemies/sons'
import { descartarSinal, mostrarSinal, novoSinal, type Sinal } from '../capture/sinal'
import type { AgenteNaFase, Rede } from '../Testar'
import type { Alvejavel } from '../weapons/bala'
import { v3, type RetratoEsp, type TipoEsp } from '../rede/mensagens'
import { SEGUE } from '../rede/numeros'
import { CAIXA_TIRO } from './Espectrais'
import { APRIMORADO, ESPECTRAIS } from './numeros'

type Modelo = { tipo: 's'; a: Assombrado } | { tipo: 'a'; a: AsaSombria } | { tipo: 'd'; a: DevoraEspectros } | { tipo: 'm'; a: MantoEspectral } | { tipo: 't'; a: AsaTerror }
/** Uma cópia: o modelo, as caixas do tiro, para onde ela desliza (o retrato), a velocidade medida, o chão, o estado do
 *  fantasma (fraco, a força da captura), o sinal em cima dele, quando foi vista no retrato (s) e há quanto estourou. */
type Copia = Modelo & {
  id: number; alvos: Alvejavel[]; para: THREE.Vector3; yaw: number; escala: number; vel: number; antes: THREE.Vector3; chao: number
  fraco: boolean; forca: number; sinal: Sinal | null; visto: number; morto: number
}

const _v = new THREE.Vector3(), _f = new THREE.Vector3(), _peito = new THREE.Vector3()
const caixa = (m: readonly number[]): Alvejavel => ({ c: new THREE.Vector3(), m: new THREE.Vector3(m[0], m[1], m[2]), acerta: () => {} })
const angulo = (de: number, para: number, k: number, dt: number) => de + Math.atan2(Math.sin(para - de), Math.cos(para - de)) * (1 - Math.exp(-k * dt))

export function EspectraisCopia({ fase, rede }: { fase: AgenteNaFase; rede: Rede }) {
  const scene = useThree((s) => s.scene), camera = useThree((s) => s.camera)
  const con = rede.con
  const grupo = useMemo(() => new THREE.Group(), []), E = useMemo(() => novoEstouro(), []), ET = useMemo(() => novosEfeitos(), [])
  const P = useMemo(() => novosProjeteis(), []), PF = useMemo(() => novosProjeteis(), [])
  const copias = useRef(new Map<number, Copia>()), relogio = useRef(0)

  /** Uma cópia sai (estourou e já passou o tempo, foi capturada, a horda recomeçou). */
  function tirar(c: Copia) {
    grupo.remove(c.a.root); calar(c.a); soltarGolpe(c.a.root)
    if (c.sinal) { grupo.remove(c.sinal.grupo); descartarSinal(c.sinal) }
    if (c.tipo === 'm') descartarTornado(c.a.tornado)
    for (const x of c.alvos) { const i = fase.alvos.indexOf(x); if (i >= 0) fase.alvos.splice(i, 1) }
    copias.current.delete(c.id)
  }
  /** Nasce uma cópia, do jeito que o host diz. */
  function nascer(id: number, tipo: TipoEsp, p: THREE.Vector3, yaw: number, forte: boolean, como?: string, q?: THREE.Vector3) {
    const chao = tipo === 't' || tipo === 'a' ? 0 : p.y
    let m: Modelo
    if (tipo === 's') {
      const a = montarAssombrado('espectrais/sombra-espectral'); a.root.position.copy(p); a.root.rotation.y = yaw
      if (q) arremessar(a, p, q); else if (como === 'surgir') surgirAssombrado(a, E, p.y)
      m = { tipo, a }
    } else if (tipo === 'a') {
      const a = montarAsaSombria('espectrais/asa-espectral'); a.root.position.copy(p); a.root.rotation.y = yaw
      if (como === 'chao') estourar(E, _v.copy(p).setY(p.y - 0.2), 0.35, p.y - 0.3, { cubos: 8, olhos: 0 }) // rompe o chão
      m = { tipo, a }
    } else if (tipo === 'd') m = { tipo, a: montarDevoraEspectros() }
    else if (tipo === 'm') m = { tipo, a: montarMantoEspectral() }
    else {
      const a = montarAsaTerror()
      if (como === 'surgir') { golpearTerror(a, 'sumir'); a.anim.modo = 'surgir'; desfazer(ET, p, 0.9) }
      m = { tipo, a }
    }
    m.a.root.position.copy(p); m.a.root.rotation.y = yaw
    if (forte && (tipo === 's' || tipo === 'a')) { m.a.root.scale.setScalar(APRIMORADO.tamanho); enfurecer(m.a.root, 1); m.a.corpo.add(novaAura(2.2, tipo === 'a' ? 0 : 0.3)) }
    const caixas = tipo === 's' ? [CAIXA_TIRO.sombra] : tipo === 'a' ? [CAIXA_TIRO.asa] : tipo === 'd' ? [CAIXA_TIRO.boca, CAIXA_TIRO.corpo, CAIXA_TIRO.cauda] : tipo === 'm' ? [CAIXA_TIRO.manto, CAIXA_TIRO.capuz] : [CAIXA_TIRO.terror, CAIXA_TIRO.capuz]
    const c: Copia = {
      ...m, id, alvos: caixas.map(caixa), para: p.clone(), yaw, escala: m.a.root.scale.x, vel: 0, antes: p.clone(), chao,
      fraco: false, forca: -1, sinal: tipo === 'd' || tipo === 'm' || tipo === 't' ? novoSinal() : null, visto: 0, morto: -1,
    }
    for (const x of c.alvos) x.acerta = (dano, _p, dir) => con.enviar({ t: 'acertoE', i: id, dano, d: v3(dir) })
    grupo.add(c.a.root); if (c.sinal) grupo.add(c.sinal.grupo)
    fase.alvos.push(...c.alvos)
    copias.current.set(id, c)
  }
  /** O golpe que começou no host, aqui. */
  function golpe(c: Copia, v: string, n?: number) {
    if (c.tipo === 's') { if (v === 'atacar') atacar(c.a) }
    else if (c.tipo === 'a') { if (v === 'cuspir') cuspir(c.a); else if (v === 'desviar') desviar(c.a, n ?? 1) }
    else if (c.tipo === 'd') { const [modo, cria] = v.split(':'); golpeDevora(c.a, modo as 'bote' | 'morder' | 'cuspir', (cria as CriaEspectros) ?? 'sombra') }
    else if (c.tipo === 'm') { if (c.a.anim.modo !== v) golpearManto(c.a, v as 'agarrar' | 'socos' | 'girar' | 'atordoado') }
    else if (v === 'tiro' || v === 'rajada' || v === 'sumir') { if (c.a.anim.modo !== v) golpearTerror(c.a, v) }
  }
  /** Levou tiro (de = de onde, rad). */
  function ferido(c: Copia, de: number) {
    if (c.tipo === 's') ferirSombra(c.a, de); else if (c.tipo === 'a') ferirAsa(c.a, de); else if (c.tipo === 'd') ferirDevora(c.a, de)
    else if (c.tipo === 'm') ferirManto(c.a, de); else ferirTerror(c.a, de)
  }

  useEffect(() => {
    scene.add(grupo, E.grupo, ET.grupo, P.grupo, PF.grupo)
    const para = [
      con.ouvir('espEv', (m) => {
        const c = copias.current.get(m.i)
        if (m.a === 'novo' && m.p) { if (c) tirar(c); nascer(m.i, m.v as TipoEsp, new THREE.Vector3(...m.p), m.n ?? 0, !!m.f, m.s, m.q ? new THREE.Vector3(...m.q) : undefined); return }
        if (m.a === 'limpar') { for (const x of [...copias.current.values()]) tirar(x); limparEfeitos(ET); return }
        if (m.a === 'bola' && m.p && m.q) { disparar(m.f ? PF : P, _v.set(...m.p), _f.set(...m.q)); return }
        if (m.a === 'bomba' && m.p && m.q) { dispararBomba(ET, _v.set(...m.p), _f.set(...m.q)); return }
        if (!c) return
        if (m.a === 'modo' && m.v) golpe(c, m.v, m.n)
        else if (m.a === 'ferir') ferido(c, m.n ?? 0)
        else if (m.a === 'estoura' && c.morto < 0) {
          if (c.tipo === 's') estourarAssombrado(c.a, E, c.chao); else if (c.tipo === 'a') estourarAsa(c.a, E, 0)
          c.morto = 0
          for (const x of c.alvos) { const i = fase.alvos.indexOf(x); if (i >= 0) fase.alvos.splice(i, 1) }
        } else if (m.a === 'some') { if (m.v === 'capturado') somEm(c.a.root.position, absorvido, 3); tirar(c) }
        else if (m.a === 'tele' && m.p) { desfazer(ET, c.a.root.position, 0.9); anel(ET, _v.set(m.p[0], m.p[1] + 0.04, m.p[2]), 0.15, 1.2, TELE.some + TELE.surge) }
      }),
      con.ouvir('esp', (m) => {
        const agora = relogio.current
        for (const l of m.l as RetratoEsp[]) {
          let c = copias.current.get(l[0])
          if (!c) { nascer(l[0], l[1], new THREE.Vector3(l[2], l[3], l[4]), l[5], !!l[9]); c = copias.current.get(l[0])! } // perdeu o aviso: monta agora
          if (c.morto >= 0) continue
          c.para.set(l[2], l[3], l[4]); c.yaw = l[5]; c.escala = l[6] / 100; c.fraco = !!l[7]; c.forca = l[8]; c.visto = agora
        }
      }),
    ]
    return () => {
      for (const f of para) f()
      for (const c of [...copias.current.values()]) tirar(c)
      scene.remove(grupo, E.grupo, ET.grupo, P.grupo, PF.grupo)
    }
  }, [scene, grupo, E, ET, P, PF, con, fase])

  useFrame((_, dtBruto) => {
    const dt = Math.min(dtBruto, 0.05), t = (relogio.current += dt)
    pulsarAuras(performance.now() / 1000)
    for (const c of [...copias.current.values()]) {
      if (c.morto >= 0) { if ((c.morto += dt) > ESPECTRAIS.some) tirar(c); continue }
      if (t - c.visto > 3 && c.visto > 0) { tirar(c); continue } // sumiu do retrato (perdeu a mensagem de sair)
      const r = c.a.root
      // desliza até o retrato (longe demais: aparece de uma vez); a Sombra cuspida voa sozinha; o Manto girando gira aqui
      const voando = c.tipo === 's' && !!c.a.anim.voo
      if (!voando) {
        if (r.position.distanceTo(c.para) > 3) r.position.copy(c.para)
        else r.position.lerp(c.para, 1 - Math.exp(-SEGUE.remoto * dt))
      }
      const girando = c.tipo === 'm' && c.a.anim.modo === 'girar'
      if (!girando) r.rotation.y = angulo(r.rotation.y, c.yaw, SEGUE.remoto, dt)
      if (c.tipo === 'd' || c.tipo === 'm' || c.tipo === 't') r.scale.setScalar(c.escala)
      const andou = Math.hypot(r.position.x - c.antes.x, r.position.z - c.antes.z) / Math.max(dt, 1e-3)
      c.vel += (andou - c.vel) * (1 - Math.exp(-6 * dt)); c.antes.copy(r.position)
      const fraco = c.fraco ? 1 : 0
      if (c.tipo === 's') { animarAssombrado(c.a, { andar: c.vel }, dt); ouvirAssombrado(c.a, dt) }
      else if (c.tipo === 'a') { animarAsaSombria(c.a, {}, dt); ouvirAsaSombria(c.a, dt) }
      else if (c.tipo === 'd') { const s = animarDevoraEspectros(c.a, c.vel > 0.3 ? 1 : 0, dt, fraco); ouvirDevoraEspectros(c.a, s, dt) }
      else if (c.tipo === 'm') { const s = animarMantoEspectral(c.a, c.vel, dt, fraco); if (girando) r.rotation.y += s.giro * dt; ouvirMantoEspectral(c.a, s, dt) }
      else { const s = animarAsaTerror(c.a, c.vel, dt, fraco); orbe(ET, bocaNoMundo(c.a, _v), s.carga); ouvirAsaTerror(c.a, s, dt) }
      if (c.sinal) mostrarSinal(c.sinal, c.fraco ? c.a.corpo.getWorldPosition(_v).setY(r.position.y + (c.tipo === 'm' ? 2.35 : c.tipo === 't' ? 1.3 : 1.4)) : null, c.forca >= 0 ? c.forca : null, c.a.anim.t, camera)
      // as caixas do tiro andam com ela (como no host)
      if (c.tipo === 'd') {
        _f.set(Math.sin(r.rotation.y), 0, Math.cos(r.rotation.y))
        c.a.mandibula.getWorldPosition(c.alvos[0].c).addScaledVector(_f, 0.3); c.a.corpo.getWorldPosition(c.alvos[1].c); c.alvos[2].c.copy(c.alvos[1].c).addScaledVector(_f, -1)
      } else if (c.tipo === 'm') { c.a.corpo.getWorldPosition(c.alvos[0].c).y += 0.35; c.a.cabeca.getWorldPosition(c.alvos[1].c) }
      else if (c.tipo === 't') { c.a.corpo.getWorldPosition(c.alvos[0].c).y -= 0.35; c.a.corpo.getWorldPosition(c.alvos[1].c).y += 0.25 }
      else c.a.corpo.getWorldPosition(c.alvos[0].c)
    }
    // as bolas e as bombas: só a imagem e o som (estouram em mim, mas quem fere é o host)
    const ag = fase.agente.root.position
    for (const Q of [P, PF]) {
      passoProjeteis(Q, dt, E, 0)
      acertar(Q, _peito.copy(ag).setY(ag.y + 1.2), LUTA_ASA.acerto, E, 0)
      for (const p of Q.bateu) somEm(p, bolaBatendo)
    }
    passoEfeitos(ET, dt, ag.y); ouvirEfeitos(ET)
    passoEstouro(E, dt)
  })
  return null
}
