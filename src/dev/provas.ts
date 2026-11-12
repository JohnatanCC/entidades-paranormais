// As provas: conferir animações e sons pelo console do navegador, sem montar tudo à mão (só no npm run dev; o jogo
// publicado não leva isto). main.tsx põe em window.provas. Recarregue a página antes (o HMR deixa módulos velhos).
//   const c = await provas.mae('grito', 1.1)                 a Mãe num instante (null = parada; estado = EstadoMae)
//   const s = await provas.assombrado('atacar', 0.6, 0)      o Assombrado num instante ('atacar', 'dano' ou null; andar m/s)
//   const v = await provas.asaSombria('cuspir', 0.5, 0.2)    a Asa sombria a 2 m ('cuspir', 'desviar', 'dano' ou null; a fase das asas)
//   await provas.fotos([['grito', c, 'lado'], ['rosto', c, 'rosto']])   as fotos num quadro por cima da tela
//   provas.limpar()                                          tira o quadro
//   provas.medidas(c)                                        mãos, cabeça, quadril; o ângulo de cada mecha
//   await provas.som([['andando', 4000, { anda: 0.95 }], ['grito', 2000, { golpe: 'grito' }]])   o volume de cada trecho
//   provas.ir(x, z, yaw, pitch?, andar?)                    no Testar aberto: leva o agente a um ponto (fotos do mesmo lugar)
//   provas.sombras()                                         quantas lâmpadas na cena e quantas fazem sombra agora
//   provas.cena()                                            a cena do Testar aberto (luzes, malhas), para inspecionar
//   provas.qualidade()                                       o nível de qualidade valendo agora (baixo, medio, alto)
//   provas.passo('agente', 2.4, { corrida, arma, frente, mover })   o andar (ou a corrida) em 8 quadros de um ciclo
//   provas.escorrega('lara', 2.4)                           o quanto o pé de apoio escorrega, a folga do pé no ar, o sobe e desce
// Câmeras: 'frente', 'lado', 'tras', '34', 'agente' (o olho dele, a 1,6 m), 'rosto' (de perto, pela frente da cabeça),
// ou { de: [x, y, z], alvo: [x, y, z] }. O som só toca depois de um clique de verdade na página.
import * as THREE from 'three'
import { montarMae, type Mae } from '../game/enemies/mae/modelo'
import { animarMae, golpear, type EstadoMae } from '../game/enemies/mae/animacao'
import type { NomeGolpe } from '../game/enemies/mae/golpes'
import { pararSonsMae } from '../game/enemies/mae/sons'
import { ouvinte } from '../audio/espaco'
import { som } from '../audio/sintese'
import { ganchos } from './ganchos'
import { nivelAtual } from '../render/qualidade'
import { contarSombras } from '../render/sombras'
import { montarAgente, type Agente, type ModeloAgente } from '../game/player/modelo'
import { animarAgente } from '../game/player/animacao'
import { pegarArma, type Arma } from '../game/player/arma'
import { montarAssombrado } from '../game/enemies/assombrado/modelo'
import { animarAssombrado, atacar, ferir } from '../game/enemies/assombrado/animacao'
import { montarAsaSombria } from '../game/enemies/asa-sombria/modelo'
import { animarAsaSombria, cuspir as cuspirAsa, desviar as desviarAsa, ferir as ferirAsa } from '../game/enemies/asa-sombria/animacao'

/** m: a Mãe (as cenas do Assombrado não têm) */
export interface Cena { m: Mae | null; sc: THREE.Scene }
type Camera = 'frente' | 'lado' | 'tras' | '34' | 'agente' | 'rosto' | { de: number[]; alvo: number[]; fov?: number }

/** A Mãe num instante: assenta na parada, começa o golpe (dur encurta) e anima até `ate` s, num cenário com chão. */
async function mae(golpe: NomeGolpe | null, ate: number, estado: EstadoMae & { dur?: number } = {}): Promise<Cena> {
  const m = montarMae(), sc = new THREE.Scene()
  sc.background = new THREE.Color('#1c1a1e')
  sc.add(new THREE.HemisphereLight('#ffffff', '#4a4640', 1))
  const d = new THREE.DirectionalLight('#ffffff', 1.3); d.position.set(1, 3, 3); sc.add(d)
  sc.add(new THREE.Mesh(new THREE.PlaneGeometry(6, 6).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#333' })))
  sc.add(m.root, m.efeitos.grupo)
  for (let i = 0; i < 40; i++) animarMae(m, { fase4: estado.fase4 }, 1 / 60)
  if (golpe) { const g = golpear(m, golpe); if (estado.dur) g.dur = estado.dur }
  for (let t = 0; t < ate; t += 1 / 60) { const s = animarMae(m, estado, 1 / 60); if (m.anim.golpe) m.root.position.y = s.y }
  m.root.updateMatrixWorld(true)
  await new Promise((ok) => setTimeout(ok, 600)) // a textura chegar
  return { m, sc }
}

/** O Assombrado num instante: assenta parado, começa a ação (atacar; dano vindo da frente) e anima até `ate` s;
 *  andar = m/s (ele pula para a frente, +z). */
async function assombrado(acao: 'atacar' | 'dano' | null, ate: number, andar = 0): Promise<Cena> {
  const a = montarAssombrado(), sc = new THREE.Scene()
  sc.background = new THREE.Color('#1c1a1e')
  sc.add(new THREE.HemisphereLight('#ffffff', '#4a4640', 1))
  const d = new THREE.DirectionalLight('#ffffff', 1.3); d.position.set(1, 3, 3); sc.add(d)
  sc.add(new THREE.Mesh(new THREE.PlaneGeometry(6, 6).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#333' })))
  sc.add(a.root)
  a.anim.balanco.prox = 99 // sem empurrões sorteados: a foto sai igual
  for (let i = 0; i < 40; i++) animarAssombrado(a, {}, 1 / 60)
  if (acao === 'atacar') atacar(a); else if (acao === 'dano') ferir(a, 0)
  for (let t = 0; t < ate; t += 1 / 60) a.root.position.z += animarAssombrado(a, { andar }, 1 / 60).avanca / 60
  a.root.updateMatrixWorld(true)
  await new Promise((ok) => setTimeout(ok, 600))
  return { m: null, sc }
}

/** A Asa sombria num instante, voando a 2 m: assenta, começa a ação (cuspir no alvo a 5 m à frente, na altura do peito;
 *  desviar para a esquerda dela; dano vindo da frente) e anima até `ate` s. fase: onde está o bater de asas (0..1). */
async function asaSombria(acao: 'cuspir' | 'desviar' | 'dano' | null, ate: number, fase?: number): Promise<Cena> {
  const a = montarAsaSombria(), sc = new THREE.Scene(), alvo = new THREE.Vector3(0, 1.3, 5)
  sc.background = new THREE.Color('#1c1a1e')
  sc.add(new THREE.HemisphereLight('#ffffff', '#4a4640', 1))
  const d = new THREE.DirectionalLight('#ffffff', 1.3); d.position.set(1, 3, 3); sc.add(d)
  sc.add(new THREE.Mesh(new THREE.PlaneGeometry(8, 12).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#333' })))
  a.root.position.set(0, 2, 0); a.anim.proxPlanar = 99 // sem planar sozinha: a foto sai igual
  sc.add(a.root)
  for (let i = 0; i < 40; i++) animarAsaSombria(a, {}, 1 / 60)
  if (acao === 'cuspir') cuspirAsa(a); else if (acao === 'desviar') desviarAsa(a, 1); else if (acao === 'dano') ferirAsa(a, 0)
  for (let t = 0; t < ate; t += 1 / 60) {
    const s = animarAsaSombria(a, { alvo: acao === 'cuspir' ? alvo : undefined }, 1 / 60)
    a.root.position.x += s.lado / 60; a.root.position.z -= s.recua / 60
  }
  if (fase !== undefined) { a.anim.fase = (fase - 1 / 60 / 0.42 + 1) % 1; animarAsaSombria(a, {}, 1 / 60) }
  a.root.updateMatrixWorld(true)
  await new Promise((ok) => setTimeout(ok, 600))
  return { m: null, sc }
}

function camera(c: Cena, k: Camera) {
  const cam = new THREE.PerspectiveCamera(typeof k === 'object' ? (k.fov ?? 35) : 35, 1, 0.02, 80)
  if (typeof k === 'object') { cam.position.fromArray(k.de); cam.lookAt(new THREE.Vector3().fromArray(k.alvo)) } else if (k === 'rosto' && c.m) {
    const r = c.m.cabeca.localToWorld(new THREE.Vector3(0, 0.08, 0.1)), q = c.m.cabeca.getWorldQuaternion(new THREE.Quaternion())
    cam.position.copy(r).add(new THREE.Vector3(0.15, 0, 1).applyQuaternion(q).multiplyScalar(0.7)); cam.lookAt(r)
  } else {
    const de = { frente: [0.3, 1.5, 3.6], lado: [3.6, 1.3, 0.3], tras: [0.4, 1.5, -3.6], '34': [2.4, 1.8, 2.6], agente: [0.3, 1.6, 3.2], rosto: [0.3, 1.5, 3.6] }[k]
    cam.position.fromArray(de); cam.lookAt(0, k === 'agente' ? 1.5 : 1.1, 0.2)
  }
  return cam
}

/** As fotos num quadro por cima da tela (cada uma com o nome embaixo). */
async function fotos(lista: [string, Cena, Camera][], tam = 250) {
  const R = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true })
  R.setSize(tam, tam); R.outputColorSpace = THREE.SRGBColorSpace
  limpar()
  const box = document.createElement('div'); box.id = 'provas'
  box.style.cssText = 'position:fixed;inset:0;z-index:99999;background:#111;display:flex;flex-wrap:wrap;gap:3px;padding:3px;align-content:flex-start'
  for (const [nome, c, k] of lista) {
    R.render(c.sc, camera(c, k))
    const f = document.createElement('figure'); f.style.cssText = 'margin:0;color:#ccc;font:11px monospace'
    f.innerHTML = `<img src="${R.domElement.toDataURL()}" width="${tam}"><figcaption>${nome}</figcaption>`
    box.appendChild(f)
  }
  document.body.appendChild(box); R.dispose()
  return `${lista.length} fotos`
}

const limpar = () => document.getElementById('provas')?.remove()

/** Medidas de um instante: as mãos (a palma), a cabeça e o quadril (m), e o ângulo de cada mecha com a vertical (°). */
function medidas(c: Cena) {
  if (!c.m) return 'só da Mãe'
  const v = (o: THREE.Object3D, p = [0, 0, 0]) => o.localToWorld(new THREE.Vector3().fromArray(p)).toArray().map((x) => +x.toFixed(2))
  const mechas = c.m.cabelo.molas.map((s) => {
    const a = s.g.localToWorld(new THREE.Vector3()), b = s.g.localToWorld(new THREE.Vector3(0, -0.4, 0)).sub(a).normalize()
    return `${s.g.name.replace('mecha_', '')} ${Math.round(Math.acos(-b.y) * 57.3)}°`
  })
  return { maos: c.m.bracos.map((b) => v(b.hd, [0, -0.06, 0])), cabeca: v(c.m.cabeca), quadril: v(c.m.quadril), mechas: mechas.join(' · ') }
}

/** O som de cada trecho (a Mãe a 3,2 m da câmera): [nome, ms, { golpe?, anda? (m/s), ...EstadoMae }] → RMS e pico. */
async function som_(roteiro: [string, number, EstadoMae & { golpe?: NomeGolpe; anda?: number }][]) {
  const s = som()
  if (!s) return 'o som ainda não ligou: clique na página primeiro'
  const an = s.ctx.createAnalyser(); an.fftSize = 2048; s.saida.connect(an)
  const buf = new Float32Array(an.fftSize), m = montarMae(), cam = new THREE.PerspectiveCamera()
  cam.position.set(0.5, 1.6, 3.2); cam.lookAt(0, 1.2, 0); cam.updateMatrixWorld(true)
  new THREE.Scene().add(m.root)
  let estado: EstadoMae = {}, anda = 0, ult = performance.now()
  const laco = setInterval(() => {
    const a = performance.now(), dt = Math.min(0.05, (a - ult) / 1000); ult = a
    ouvinte(cam); m.root.position.z += anda * dt
    const sa = animarMae(m, estado, dt)
    if (m.anim.golpe) { m.root.position.z += sa.avanca * dt; m.root.position.y = sa.y } else m.root.position.y = 0
  }, 16)
  const linhas: string[] = []
  for (const [nome, ms, o] of roteiro) {
    const { golpe, anda: v, ...e } = o
    estado = e; anda = v ?? 0; m.root.position.set(0, 0, 0)
    if (golpe) golpear(m, golpe)
    let soma = 0, n = 0, pico = 0, nan = false
    for (const t0 = performance.now(); performance.now() - t0 < ms; n++) {
      an.getFloatTimeDomainData(buf); let r = 0
      for (const x of buf) { if (Number.isNaN(x)) nan = true; r += x * x; pico = Math.max(pico, Math.abs(x)) }
      soma += Math.sqrt(r / buf.length); await new Promise((ok) => setTimeout(ok, 50))
    }
    linhas.push(`${nome}: rms ${(soma / Math.max(1, n)).toFixed(4)} pico ${pico.toFixed(3)}${nan ? ' NaN!' : ''}`)
  }
  clearInterval(laco); pararSonsMae(m); an.disconnect()
  return linhas.join('\n')
}

// ---------- o andar e a corrida ----------
interface OpcPasso { corrida?: number; arma?: Arma; frente?: boolean; mover?: [number, number] } // mover: de lado ou de costas (no espaço dele)
const PASSO_DT = 1 / 240
/** Um personagem andando a vel (m/s) por 3 s, com o calcanhar direito chegando ao chão (o começo do ciclo). */
function andando(modelo: ModeloAgente, vel: number, o: OpcPasso): Agente {
  const a = montarAgente(modelo), e = { velocidade: vel, corrida: o.corrida ?? 0, esquiva: -1, mover: o.mover }
  if (o.arma) pegarArma(a, o.arma)
  for (let i = 0; i < 720; i++) animarAgente(a, e, PASSO_DT)
  for (let g = 0; a.anim.fase / (Math.PI * 2) > 0.01 && g < 3000; g++) animarAgente(a, e, PASSO_DT)
  return a
}
/** O andar em 8 quadros de um ciclo (um passo de cada perna), de lado ou de frente, num quadro por cima da tela. */
function passo(modelo: ModeloAgente = 'agente', vel = 2.4, o: OpcPasso = {}) {
  const W = 1600, H = 900, cw = W / 4, ch = H / 2, R = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true })
  R.setSize(W, H); R.setClearColor('#2a2a30')
  const sc = new THREE.Scene(); sc.overrideMaterial = new THREE.MeshLambertMaterial({ color: '#c8b49a' }) // cor de barro: a forma aparece
  sc.add(new THREE.HemisphereLight('#ffffff', '#555555', 2.2))
  const d = new THREE.DirectionalLight('#ffffff', 1.6); d.position.set(4, 5, 2); sc.add(d)
  const cam = new THREE.OrthographicCamera(-1.03 * cw / ch, 1.03 * cw / ch, 1.02, -1.03, 0.1, 50)
  cam.position.set(o.frente ? 0 : 4, 0.95, o.frente ? 4 : 0); cam.lookAt(0, 0.95, 0)
  const a = andando(modelo, vel, o), e = { velocidade: vel, corrida: o.corrida ?? 0, esquiva: -1, mover: o.mover }
  sc.add(a.root)
  // um ciclo: a fase dá uma volta; 8 quadros iguais
  let antes = a.anim.fase, volta = 0, k = 0
  R.setScissorTest(true)
  while (k < 8) {
    if (volta >= (k * Math.PI * 2) / 8) {
      const x = cw * (k % 4), y = k < 4 ? ch : 0
      R.setViewport(x, y, cw, ch); R.setScissor(x, y, cw, ch); a.root.updateMatrixWorld(true); R.render(sc, cam); k++
    }
    animarAgente(a, e, PASSO_DT)
    volta += (a.anim.fase - antes + Math.PI * 2) % (Math.PI * 2); antes = a.anim.fase
  }
  limpar()
  const img = document.createElement('img'); img.id = 'provas'; img.src = R.domElement.toDataURL()
  img.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;object-fit:contain;z-index:99999;background:#111'
  document.body.appendChild(img); R.dispose()
  return `${modelo} a ${vel} m/s: um ciclo em 8 quadros (o calcanhar direito toca no primeiro)`
}
/** O pé de apoio: a velocidade dele para trás (tem que ser a do corpo: senão escorrega), a menor folga do pé no ar no
 *  meio do balanço e o quanto o quadril sobe e desce. */
function escorrega(modelo: ModeloAgente = 'agente', vel = 2.4, o: OpcPasso = {}) {
  const a = andando(modelo, vel, o), e = { velocidade: vel, corrida: o.corrida ?? 0, esquiva: -1, mover: o.mover }, p = new THREE.Vector3()
  const antes: ({ j: number; y: number; z: number } | null)[] = [null, null]
  let soma = 0, n = 0, folga = 1, alto = -1, baixo = 9
  for (let i = 0; i < 720; i++) {
    animarAgente(a, e, PASSO_DT); a.root.updateMatrixWorld(true)
    const u = a.anim.fase / (Math.PI * 2)
    alto = Math.max(alto, a.pelvis.position.y); baixo = Math.min(baixo, a.pelvis.position.y)
    a.legs.forEach((L, k) => {
      const pts = a.sola.map((q) => L.ft.localToWorld(p.copy(q)).clone()), j = pts[0].y < pts[1].y ? 0 : 1, lo = pts[j], b = antes[k]
      if (lo.y < 0.008 && b && b.j === j && b.y < 0.008) { soma += (b.z - lo.z) / PASSO_DT; n++ } // o mesmo ponto no chão
      const v = (u + (k ? 0.5 : 0)) % 1
      if (v > 0.68 && v < 0.92) folga = Math.min(folga, lo.y)
      antes[k] = { j, y: lo.y, z: lo.z }
    })
  }
  const pe = soma / Math.max(1, n)
  return `${modelo} a ${vel} m/s: o pé no chão vai para trás a ${pe.toFixed(2)} m/s (escorrega ${Math.round(Math.abs(1 - pe / vel) * 100)}%), folga do pé no ar ${(folga * 100).toFixed(1)} cm, o quadril sobe e desce ${((alto - baixo) * 100).toFixed(1)} cm`
}

/** No Testar aberto: o agente vai para (x, z), olhando para yaw (rad; 0 = +z) e pitch. */
function ir(x: number, z: number, yaw: number, pitch?: number, andar?: number) {
  if (!ganchos.ir) return 'abra o Testar do criador de mapas primeiro'
  ganchos.ir(x, z, yaw, pitch, andar)
  return 'ok'
}

export const provas = { mae, assombrado, asaSombria, fotos, limpar, medidas, som: som_, ir, passo, escorrega, qualidade: nivelAtual, sombras: contarSombras, cena: () => ganchos.cena, gl: () => ganchos.gl }
