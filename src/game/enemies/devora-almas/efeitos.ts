// Os efeitos do Devora almas no chão (docs/demonios.md), leves para o celular (nenhuma luz nova; cada um é uma chamada
// de desenho, só enquanto aparece):
//   nadando: a mancha escura embaixo dele e os espinhos baixos que sobem e descem atrás, ondulando como
//     uma cobra (a "poça que anda"); o rastro de gosma, que fica no chão por 3 s (quem pisa fica lento: na luta);
//   a marca de mordida: um anel de dentes no chão, onde ele vai sair, pulsando mais forte até o salto;
//   a investida: na mira, o aviso no chão à frente (uma rachadura vermelha crescendo até onde ele vai passar); na
//     disparada, o rasgo: espinhos grandes subindo atrás dele e afundando de novo;
//   a chuva de tentáculos (chuvaDeTentaculos): os círculos de dentes acendem um depois do outro; de cada um sobe um
//     tentáculo, que bate (dobra por cima do círculo) e volta para o chão. Todos os tentáculos são uma malha só (os
//     pedaços, com o degradê do preto ao vermelho) e as pontas outra (brilham);
//   as poças (12/nov, a arena do chefe): manchas de líquido preto paradas no chão (pocasNoChao), de onde um tentáculo
//     sobe quando o agente chega perto (tentaculoDaPoca): o mesmo tentáculo da chuva, nas vagas depois das dela.
// Os efeitos ficam no mundo: ponha `grupo` na cena, fora do root dele. chao = a altura do chão.
import * as THREE from 'three'
import { aplicarBrilho } from '../../../render/brilho'
import { estourar, type Estouro } from '../estouro'
import type { DevoraAlmas } from './modelo'
import { CHUVA, ESCALA, ESPINHOS, GOSMA, INVESTIDA, MANCHA, MARCA, SALTO } from './numeros'

const N_GOSMA = 40, N_RASGO = 30, N_CHUVA = 5, N_POCAS = 8, PEDACOS = 8
const N_TENTACULOS = N_CHUVA + N_POCAS // as vagas da chuva primeiro, depois as das poças
const PISO = { transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 }

/** Um material de chão desenhado várias vezes (InstancedMesh), cada cópia com a sua força (a opacidade, no atributo
 *  aForca da geometria). */
function materialComForca(map: THREE.Texture, chave: string) {
  const m = new THREE.MeshBasicMaterial({ map, ...PISO })
  m.onBeforeCompile = (s) => {
    s.vertexShader = 'attribute float aForca;\nvarying float vForca;\n' + s.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvForca = aForca;')
    s.fragmentShader = 'varying float vForca;\n' + s.fragmentShader.replace('vec4 diffuseColor = vec4( diffuse, opacity );', 'vec4 diffuseColor = vec4( diffuse, opacity * vForca );')
  }
  m.customProgramCacheKey = () => chave
  return m
}

/** Uma textura de pixel desenhada uma vez (dividida por todos os Devoras). */
function desenhar(tam: number, f: (g: CanvasRenderingContext2D, r: () => number) => void) {
  const c = document.createElement('canvas'); c.width = c.height = tam
  let s = 11
  f(c.getContext('2d')!, () => ((s = (s * 16807) % 2147483647) / 2147483647))
  const t = new THREE.CanvasTexture(c); t.magFilter = THREE.NearestFilter
  return t
}
let texturas: { gosma: THREE.Texture; marca: THREE.Texture; aviso: THREE.Texture } | null = null
function asTexturas() {
  return (texturas ??= {
    // a gosma: um borrão preto com brilhos úmidos arroxeados
    gosma: desenhar(32, (g, r) => {
      g.fillStyle = '#060508'
      for (let i = 0; i < 8; i++) { const a = r() * 6.28, d = r() * 5; g.beginPath(); g.arc(16 + Math.cos(a) * d, 16 + Math.sin(a) * d, 5 + r() * 5, 0, 6.28); g.fill() }
      g.fillStyle = '#3a2a44'
      for (let i = 0; i < 9; i++) g.fillRect(Math.round(10 + r() * 12), Math.round(10 + r() * 12), 1, 1)
    }),
    // a marca de mordida: um anel de dentes apontando para dentro, vermelho-escuro com a ponta clara
    marca: desenhar(64, (g) => {
      g.strokeStyle = '#4a0c0e'; g.lineWidth = 3; g.beginPath(); g.arc(32, 32, 29, 0, 6.28); g.stroke()
      const N = 18
      for (let i = 0; i < N; i++) {
        const a = (i / N) * 6.28, b = a + 3.14 / N
        g.fillStyle = i % 2 ? '#6e1414' : '#8a1a18'
        g.beginPath(); g.moveTo(32 + Math.cos(a - 0.12) * 28, 32 + Math.sin(a - 0.12) * 28); g.lineTo(32 + Math.cos(a + 0.12) * 28, 32 + Math.sin(a + 0.12) * 28)
        g.lineTo(32 + Math.cos(a) * 19, 32 + Math.sin(a) * 19); g.fill()
        g.fillStyle = '#5a1012'
        g.beginPath(); g.moveTo(32 + Math.cos(b - 0.1) * 17, 32 + Math.sin(b - 0.1) * 17); g.lineTo(32 + Math.cos(b + 0.1) * 17, 32 + Math.sin(b + 0.1) * 17)
        g.lineTo(32 + Math.cos(b) * 23, 32 + Math.sin(b) * 23); g.fill()
      }
    }),
    // o aviso da investida: uma rachadura vermelha em zigue-zague, ao comprido (o meio claro, as bordas escuras)
    aviso: (() => {
      const t = desenhar(32, (g, r) => {
        let x = 16
        for (let y = 0; y < 32; y += 2) {
          x = Math.max(9, Math.min(23, x + Math.round((r() - 0.5) * 6)))
          g.fillStyle = '#5a1012'; g.fillRect(x - 3, y, 7, 2)
          g.fillStyle = '#c42a20'; g.fillRect(x - 1, y, 3, 2)
          g.fillStyle = '#ff7a50'; g.fillRect(x, y, 1, 2)
        }
      })
      t.wrapT = THREE.RepeatWrapping // repete ao comprido (sem esticar o pixel)
      return t
    })(),
  })
}

export interface EfeitosDevora {
  grupo: THREE.Group
  mancha: THREE.Mesh; manchaMat: THREE.MeshBasicMaterial
  espinhos: THREE.InstancedMesh
  gosma: THREE.InstancedMesh; gosmaForca: THREE.InstancedBufferAttribute; gotas: { p: THREE.Vector3; giro: number; tam: number; t: number }[]; prox: number; solta: number
  marca: THREE.Mesh; marcaMat: THREE.MeshBasicMaterial
  forcaNado: number
  aviso: THREE.Mesh; avisoMat: THREE.MeshBasicMaterial
  rasgo: THREE.InstancedMesh; espinhosRasgo: { p: THREE.Vector3; giro: number; t: number }[]; proxRasgo: number; andou: number; ultimo: THREE.Vector3 | null
  circulos: THREE.InstancedMesh; circuloForca: THREE.InstancedBufferAttribute
  pocas: THREE.InstancedMesh
  pedacos: THREE.InstancedMesh; pontas: THREE.InstancedMesh
  chuva: { p: THREE.Vector3; eixo: THREE.Vector3; t: number; ativo: boolean; subiu: boolean }[]
  /** a chuva neste quadro, para os sons: os círculos que começaram o aviso e os tentáculos que romperam o chão */
  sons: { aviso: THREE.Vector3[]; rompe: THREE.Vector3[] }
}

export function novosEfeitosDevora(): EfeitosDevora {
  const T = asTexturas(), grupo = new THREE.Group(); grupo.name = 'devora-efeitos'
  const plano = () => new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2)
  const manchaMat = new THREE.MeshBasicMaterial({ map: T.gosma, ...PISO, opacity: 0 })
  const mancha = new THREE.Mesh(plano(), manchaMat); mancha.renderOrder = 1; mancha.visible = false
  const espinhos = new THREE.InstancedMesh(new THREE.ConeGeometry(0.07, 1, 4), new THREE.MeshBasicMaterial({ color: '#0c0a10' }), ESPINHOS.n)
  espinhos.frustumCulled = false; espinhos.visible = false
  const zero = new THREE.Matrix4().makeScale(0, 0, 0)
  /** Uma malha desenhada várias vezes, começando escondida. */
  const varias = (geo: THREE.BufferGeometry, mat: THREE.Material, n: number) => {
    const m = new THREE.InstancedMesh(geo, mat, n); m.frustumCulled = false; m.visible = false
    for (let i = 0; i < n; i++) m.setMatrixAt(i, zero)
    return m
  }
  // a gosma: um quadrado no chão, desenhado várias vezes; a força (a opacidade) de cada uma num atributo
  const geo = plano(), gosmaForca = new THREE.InstancedBufferAttribute(new Float32Array(N_GOSMA), 1)
  geo.setAttribute('aForca', gosmaForca)
  const gosma = varias(geo, materialComForca(T.gosma, 'gosma-devora'), N_GOSMA); gosma.renderOrder = 1
  const marcaMat = new THREE.MeshBasicMaterial({ map: T.marca, ...PISO, opacity: 0 })
  const marca = new THREE.Mesh(plano(), marcaMat); marca.renderOrder = 2; marca.visible = false; marca.scale.setScalar(MARCA.raio * 2)
  // a investida: o aviso (um quadrado comprido no chão) e os espinhos grandes do rasgo
  const avisoMat = new THREE.MeshBasicMaterial({ map: T.aviso, ...PISO, opacity: 0 })
  const aviso = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2).translate(0, 0, 0.5), avisoMat) // começa na origem e vai para a frente
  aviso.renderOrder = 2; aviso.visible = false
  const rasgo = varias(new THREE.ConeGeometry(0.22 * ESCALA, 1, 4).translate(0, 0.5, 0), new THREE.MeshBasicMaterial({ color: '#0c0a10' }), N_RASGO)
  // a chuva: os círculos (a textura da marca, cada um com a sua força), os pedaços dos tentáculos (o degradê na cor de
  // cada pedaço) e as pontas, que brilham
  const geoCirc = plano(), circuloForca = new THREE.InstancedBufferAttribute(new Float32Array(N_TENTACULOS), 1)
  geoCirc.setAttribute('aForca', circuloForca)
  const circulos = varias(geoCirc, materialComForca(T.marca, 'circulos-devora'), N_TENTACULOS); circulos.renderOrder = 2
  const pedacos = varias(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshLambertMaterial(), N_TENTACULOS * PEDACOS)
  const preto = new THREE.Color('#0c0a10'), vermelho = new THREE.Color('#9a1c18'), cor = new THREE.Color()
  for (let i = 0; i < N_TENTACULOS * PEDACOS; i++) { const k = (i % PEDACOS) / (PEDACOS - 1); pedacos.setColorAt(i, cor.copy(preto).lerp(vermelho, Math.max(0, (k - 0.35) / 0.65) ** 1.5)) }
  const pontas = varias(new THREE.BoxGeometry(1, 1, 1), aplicarBrilho(new THREE.MeshBasicMaterial({ color: '#ff3c24' })), N_TENTACULOS)
  // as poças: a mesma gosma, mais escura e parada (cópias de um plano)
  const pocas = varias(plano(), new THREE.MeshBasicMaterial({ map: T.gosma, ...PISO, color: '#6a5a66' }), N_POCAS); pocas.renderOrder = 1
  grupo.add(gosma, mancha, espinhos, marca, aviso, rasgo, circulos, pedacos, pontas, pocas)
  return {
    grupo, mancha, manchaMat, espinhos, gosma, gosmaForca, marca, marcaMat, forcaNado: 0,
    gotas: Array.from({ length: N_GOSMA }, () => ({ p: new THREE.Vector3(), giro: 0, tam: 1, t: 99 })), prox: 0, solta: 0,
    aviso, avisoMat, rasgo, espinhosRasgo: Array.from({ length: N_RASGO }, () => ({ p: new THREE.Vector3(), giro: 0, t: 99 })), proxRasgo: 0, andou: 0, ultimo: null,
    circulos, circuloForca, pedacos, pontas, pocas,
    chuva: Array.from({ length: N_TENTACULOS }, () => ({ p: new THREE.Vector3(), eixo: new THREE.Vector3(), t: 0, ativo: false, subiu: false })),
    sons: { aviso: [], rompe: [] },
  }
}

/** A chuva de tentáculos: um círculo em cada ponto (no chão), um depois do outro, começando quando ele termina de
 *  afundar (chame junto com chover). No máximo 5. */
export function chuvaDeTentaculos(F: EfeitosDevora, pontos: THREE.Vector3[]) {
  pontos.slice(0, N_CHUVA).forEach((p, i) => {
    const c = F.chuva[i], a = Math.random() * Math.PI * 2
    c.p.copy(p); c.eixo.set(Math.cos(a), 0, Math.sin(a)); c.t = -(CHUVA.afunda + i * CHUVA.intervalo); c.ativo = true; c.subiu = false
  })
}

/** As poças de líquido preto no chão (no máximo 8), do tamanho `raio` (m). */
export function pocasNoChao(F: EfeitosDevora, pontos: THREE.Vector3[], raio: number) {
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(raio * 2, 1, raio * 2)
  pontos.slice(0, N_POCAS).forEach((p, i) => F.pocas.setMatrixAt(i, m.compose(new THREE.Vector3(p.x, p.y + 0.008, p.z), q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), i * 1.7), s)))
  F.pocas.visible = pontos.length > 0
  F.pocas.instanceMatrix.needsUpdate = true
}
/** Um tentáculo sobe da poça k, em p (o aviso do círculo começa agora). false = o dela ainda está fora. */
export function tentaculoDaPoca(F: EfeitosDevora, k: number, p: THREE.Vector3): boolean {
  const c = F.chuva[N_CHUVA + k]
  if (!c || c.ativo) return false
  const a = Math.random() * Math.PI * 2
  c.p.copy(p); c.eixo.set(Math.cos(a), 0, Math.sin(a)); c.t = -1e-3; c.ativo = true; c.subiu = false // (logo antes do zero: o som do aviso toca)
  return true
}

const _p = new THREE.Vector3(), _f = new THREE.Vector3(), _l = new THREE.Vector3(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _e = new THREE.Vector3(), _m = new THREE.Matrix4(), UP = new THREE.Vector3(0, 1, 0)

/** Um quadro dos efeitos do Devora (depois de animarDevora e de mover o root). E: onde sai o respingo quando um
 *  tentáculo da chuva rompe o chão. */
export function passoEfeitosDevora(F: EfeitosDevora, d: DevoraAlmas, chao: number, dt: number, E?: Estouro) {
  const A = d.anim, modo = A.modo
  F.sons.aviso.length = F.sons.rompe.length = 0
  d.root.getWorldPosition(_p); d.root.getWorldQuaternion(_q)
  _f.set(0, 0, 1).applyQuaternion(_q).setY(0).normalize(); _l.set(_f.z, 0, -_f.x) // a frente e o lado, no chão
  const yaw = Math.atan2(_f.x, _f.z)
  passoInvestida(F, d, chao, yaw, dt)
  passoChuva(F, chao, dt, E)
  // ---------- nadando: a mancha e os espinhos atrás dos tentáculos das costas; o rastro de gosma ----------
  const nada = !A.estourado && (modo === 'nadando' || modo === 'mira' || modo === 'investida' || modo === 'freia' || (modo === 'mergulho' && A.tm > 0.45) || (modo === 'marca' && A.tm < 0.4))
  F.forcaNado += ((nada ? 1 : 0) - F.forcaNado) * Math.min(1, dt * 6)
  const k = F.forcaNado
  F.mancha.visible = F.espinhos.visible = k > 0.02
  if (F.mancha.visible) {
    F.mancha.position.set(_p.x, chao + 0.006, _p.z); F.mancha.rotation.y = yaw; F.mancha.scale.set(MANCHA.largura, 1, MANCHA.comprimento)
    F.manchaMat.opacity = 0.75 * k
    const S = ESPINHOS
    for (let i = 0; i < S.n; i++) {
      const atras = S.comeca + i * S.passo, lado = S.lado * Math.sin(A.t * 8 - i * 0.9), alto = S.alto * k * Math.max(0.15, Math.sin(A.t * 10 - i * 1.2))
      _s.copy(_p).addScaledVector(_f, -atras).addScaledVector(_l, lado).setY(chao + alto / 2)
      F.espinhos.setMatrixAt(i, _m.compose(_s, _q.setFromAxisAngle(UP, A.t * 3 + i), _e.set(S.grossura, alto, S.grossura)))
    }
    F.espinhos.instanceMatrix.needsUpdate = true
  }
  if (nada && (F.solta -= dt) <= 0) { // uma gota de gosma onde ele passou
    F.solta = GOSMA.intervalo
    const g = F.gotas[F.prox]; F.prox = (F.prox + 1) % F.gotas.length
    g.p.set(_p.x + (Math.random() - 0.5) * 0.2 * ESCALA, chao + 0.004, _p.z + (Math.random() - 0.5) * 0.2 * ESCALA); g.giro = Math.random() * 6.28
    g.tam = GOSMA.tamanho[0] + Math.random() * (GOSMA.tamanho[1] - GOSMA.tamanho[0]); g.t = 0
  }
  let gosma = false
  F.gotas.forEach((g, i) => {
    if (g.t > GOSMA.dura) return
    g.t += dt
    const fim = g.t > GOSMA.dura, some = Math.max(0, (g.t - (GOSMA.dura - GOSMA.some)) / GOSMA.some)
    F.gosma.setMatrixAt(i, fim ? _m.makeScale(0, 0, 0) : _m.compose(g.p, _q.setFromAxisAngle(UP, g.giro), _s.set(g.tam, 1, g.tam)))
    F.gosmaForca.setX(i, fim ? 0 : GOSMA.forca * (1 - some) * Math.min(1, g.t * 8))
    gosma = true
  })
  F.gosma.visible = gosma
  if (gosma) { F.gosma.instanceMatrix.needsUpdate = true; F.gosmaForca.needsUpdate = true }
  // ---------- a marca de mordida: onde ele vai sair, pulsando mais forte até o salto ----------
  const marca = !A.estourado && (modo === 'marca' || (modo === 'salto' && A.tm < SALTO.mordida))
  F.marca.visible = marca
  if (marca) {
    const forte = modo === 'marca' ? Math.min(1, A.tm / 0.7) : 1 - A.tm / SALTO.mordida
    F.marca.position.set(_p.x, chao + 0.008, _p.z)
    F.marcaMat.opacity = forte * (0.65 + 0.35 * Math.sin(A.t * 22))
    F.marca.rotation.y = A.t * 0.6
  }
}

const _w = new THREE.Vector3(), _d = new THREE.Vector3(), _x = new THREE.Quaternion(), _c = new THREE.Vector3()

/** A investida: o aviso no chão na mira (cresce até o comprimento todo, piscando) e o rasgo atrás da disparada. */
function passoInvestida(F: EfeitosDevora, d: DevoraAlmas, chao: number, yaw: number, dt: number) {
  const A = d.anim, I = INVESTIDA
  // o aviso: começa no focinho e vai para a frente, onde ele vai passar
  const mira = !A.estourado && A.modo === 'mira'
  F.aviso.visible = mira
  if (mira) {
    const dur = A.curta ? I.miraCurta : I.mira, k = Math.min(1, A.tm / (dur * 0.6)), comp = I.aviso.comprimento * k
    F.aviso.position.copy(_p).addScaledVector(_f, 0.95 * ESCALA).setY(chao + 0.01) // o focinho fica a uns 0,95 m × ESCALA do meio
    F.aviso.rotation.y = yaw; F.aviso.scale.set(I.aviso.largura, 1, Math.max(0.01, comp))
    F.avisoMat.map!.repeat.set(1, comp / I.aviso.largura)
    F.avisoMat.opacity = 0.55 + 0.45 * Math.sin(A.t * 26)
  }
  // o rasgo: a cada tanto que ele anda disparando, um espinho grande sobe atrás e depois afunda
  const rasga = !A.estourado && (A.modo === 'investida' || (A.modo === 'freia' && A.tm < I.freia * 0.6))
  if (rasga && F.ultimo) {
    F.andou += Math.hypot(_p.x - F.ultimo.x, _p.z - F.ultimo.z)
    while (F.andou >= I.rasgo.passo) {
      F.andou -= I.rasgo.passo
      const e = F.espinhosRasgo[F.proxRasgo]; F.proxRasgo = (F.proxRasgo + 1) % F.espinhosRasgo.length
      e.p.copy(_p).addScaledVector(_f, -0.8 * ESCALA).addScaledVector(_l, (Math.random() - 0.5) * 0.7 * ESCALA).setY(chao); e.giro = Math.random() * 6.28; e.t = 0
    }
  }
  ;(F.ultimo ??= new THREE.Vector3()).copy(_p)
  const R = I.rasgo, vida = R.sobe + R.fica + R.desce
  let algum = false
  F.espinhosRasgo.forEach((e, i) => {
    if (e.t > vida) return
    e.t += dt
    const h = e.t < R.sobe ? e.t / R.sobe : e.t < R.sobe + R.fica ? 1 : Math.max(0, 1 - (e.t - R.sobe - R.fica) / R.desce)
    F.rasgo.setMatrixAt(i, e.t > vida ? _m.makeScale(0, 0, 0) : _m.compose(e.p, _q.setFromAxisAngle(UP, e.giro), _s.set(1, Math.max(1e-3, R.alto * h), 1)))
    algum = true
  })
  F.rasgo.visible = algum
  if (algum) F.rasgo.instanceMatrix.needsUpdate = true
}

/** A chuva de tentáculos: cada um avisa com o círculo, sobe rápido, bate (dobra por cima do círculo e volta) e afunda. */
function passoChuva(F: EfeitosDevora, chao: number, dt: number, E?: Estouro) {
  const C = CHUVA, vida = C.aviso + C.sobe + C.fica + C.desce
  let algum = false
  F.chuva.forEach((c, i) => {
    const zera = () => { F.circulos.setMatrixAt(i, _m.makeScale(0, 0, 0)); F.circuloForca.setX(i, 0); for (let j = 0; j < PEDACOS; j++) F.pedacos.setMatrixAt(i * PEDACOS + j, _m.makeScale(0, 0, 0)); F.pontas.setMatrixAt(i, _m.makeScale(0, 0, 0)) }
    if (!c.ativo) return
    if (c.t < 0 && c.t + dt >= 0) F.sons.aviso.push(c.p)
    c.t += dt
    algum = true
    if (c.t < 0) { zera(); return } // ainda não chegou a vez dele
    if (c.t > vida) { c.ativo = false; zera(); return }
    // o círculo: acende pulsando no aviso, fica aceso enquanto o tentáculo está fora, some quando ele afunda
    const fora = c.t - C.aviso, desce = Math.max(0, (fora - C.sobe - C.fica) / C.desce)
    const forca = c.t < C.aviso ? Math.min(1, c.t / 0.25) * (0.6 + 0.4 * Math.sin(c.t * 24)) : 0.85 * (1 - desce)
    F.circulos.setMatrixAt(i, _m.compose(_c.copy(c.p).setY(chao + 0.012), _q.setFromAxisAngle(UP, c.t * 1.5), _s.set(C.raio * 2, 1, C.raio * 2)))
    F.circuloForca.setX(i, forca)
    // o tentáculo: a altura (sobe rápido, afunda no fim) e a dobra (bate por cima do círculo e volta)
    const h = fora < 0 ? 0 : fora < C.sobe ? fora / C.sobe : 1 - desce
    if (fora >= 0 && !c.subiu) { c.subiu = true; F.sons.rompe.push(c.p); if (E) estourar(E, _c.copy(c.p).setY(chao + 0.1), 0.35 * ESCALA, chao, { cubos: 10, olhos: 0, mancha: false, tamanho: 1.6 }) }
    const bate = fora > C.sobe && fora < C.sobe + C.fica ? Math.sin((Math.PI * (fora - C.sobe)) / C.fica) : 0
    const L = (C.altura * Math.max(0, h)) / PEDACOS
    _w.copy(c.p).setY(chao); _d.set(0, 1, 0)
    for (let j = 0; j < PEDACOS; j++) {
      const k = j / (PEDACOS - 1), w = C.grossura * (1 - 0.7 * k)
      // cada pedaço dobra um pouco mais que o de baixo: a ponta é a que mais bate; e um tremor de bicho
      _x.setFromAxisAngle(c.eixo, (0.06 + 0.32 * bate) * (0.4 + k) + 0.06 * Math.sin(c.t * 14 - j))
      _d.applyQuaternion(_x)
      _q.setFromUnitVectors(UP, _d)
      _c.copy(_w).addScaledVector(_d, L / 2)
      F.pedacos.setMatrixAt(i * PEDACOS + j, h > 0 ? _m.compose(_c, _q, _s.set(w, L * 1.08, w)) : _m.makeScale(0, 0, 0))
      _w.addScaledVector(_d, L)
    }
    F.pontas.setMatrixAt(i, h > 0 ? _m.compose(_w, _q, _s.setScalar(C.grossura * 0.35)) : _m.makeScale(0, 0, 0))
  })
  F.circulos.visible = F.pedacos.visible = F.pontas.visible = algum
  if (algum) { F.circulos.instanceMatrix.needsUpdate = true; F.circuloForca.needsUpdate = true; F.pedacos.instanceMatrix.needsUpdate = true; F.pontas.instanceMatrix.needsUpdate = true }
}
