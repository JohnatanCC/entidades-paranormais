// As provas: conferir animações e sons pelo console do navegador, sem montar tudo à mão (só no npm run dev; o jogo
// publicado não leva isto). main.tsx põe em window.provas. Recarregue a página antes (o HMR deixa módulos velhos).
//   const c = await provas.mae('grito', 1.1)                 a Mãe num instante (null = parada; estado = EstadoMae)
//   await provas.fotos([['grito', c, 'lado'], ['rosto', c, 'rosto']])   as fotos num quadro por cima da tela
//   provas.limpar()                                          tira o quadro
//   provas.medidas(c)                                        mãos, cabeça, quadril; o ângulo de cada mecha
//   await provas.som([['andando', 4000, { anda: 0.95 }], ['grito', 2000, { golpe: 'grito' }]])   o volume de cada trecho
//   provas.ir(x, z, yaw, pitch?, andar?)                    no Testar aberto: leva o agente a um ponto (fotos do mesmo lugar)
//   provas.qualidade()                                       o nível de qualidade valendo agora (baixo, medio, alto)
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

export interface Cena { m: Mae; sc: THREE.Scene }
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

function camera(c: Cena, k: Camera) {
  const cam = new THREE.PerspectiveCamera(typeof k === 'object' ? (k.fov ?? 35) : 35, 1, 0.02, 80)
  if (typeof k === 'object') { cam.position.fromArray(k.de); cam.lookAt(new THREE.Vector3().fromArray(k.alvo)) } else if (k === 'rosto') {
    const r = c.m.cabeca.localToWorld(new THREE.Vector3(0, 0.08, 0.1)), q = c.m.cabeca.getWorldQuaternion(new THREE.Quaternion())
    cam.position.copy(r).add(new THREE.Vector3(0.15, 0, 1).applyQuaternion(q).multiplyScalar(0.7)); cam.lookAt(r)
  } else {
    const de = { frente: [0.3, 1.5, 3.6], lado: [3.6, 1.3, 0.3], tras: [0.4, 1.5, -3.6], '34': [2.4, 1.8, 2.6], agente: [0.3, 1.6, 3.2] }[k]
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

/** No Testar aberto: o agente vai para (x, z), olhando para yaw (rad; 0 = +z) e pitch. */
function ir(x: number, z: number, yaw: number, pitch?: number, andar?: number) {
  if (!ganchos.ir) return 'abra o Testar do criador de mapas primeiro'
  ganchos.ir(x, z, yaw, pitch, andar)
  return 'ok'
}

export const provas = { mae, fotos, limpar, medidas, som: som_, ir, qualidade: nivelAtual }
