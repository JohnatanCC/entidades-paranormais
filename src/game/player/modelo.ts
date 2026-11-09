// O agente Matheus Moura (do laboratório): técnico de campo, jaqueta azul-marinho comprida, o relicário nas costas.
// Esqueleto próprio: quadril, coluna, peito, pescoço curto e cabeça; braços com ombro, cotovelo e mão; pernas com joelho e pé.
// Só o corpo: as armas, a armadilha, o kit e o cabo ficam para quando vierem as armas.
// A origem do root fica no chão, entre os pés; a FRENTE é o +z do root; ~1,77 m do chão ao alto do cabelo.
import * as THREE from 'three'
import { applyPsx } from '../../render/psx'
import { animarAgente } from './animacao'

type Vec3 = [number, number, number]

/** Uma perna: s = -1 é a direita (lado -x), +1 a esquerda. */
export interface Perna { s: number; th: THREE.Group; kn: THREE.Group; ft: THREE.Group }
/** Um braço: s = -1 é o direito, +1 o esquerdo. up = o braço (gira no ombro), fo = o antebraço (cotovelo), hd = a mão. */
export interface Braco { s: number; sh: THREE.Group; up: THREE.Group; fo: THREE.Group; hd: THREE.Group }
/** Um painel da barra da jaqueta: s = -1/+1 os da frente (seguem a coxa daquele lado), 0 o de trás. sw e v: a mola. */
export interface Painel { g: THREE.Group; s: number; sw: number; v: number }
/** O que a animação lembra de um quadro para o outro. */
export interface AnimAgente { fase: number; amp: number; corrida: number; tempo: number }

export interface Agente {
  root: THREE.Group
  roll: THREE.Group // o pivô da cambalhota, no meio do corpo
  pelvis: THREE.Group
  legs: [Perna, Perna] // [0] direita, [1] esquerda
  panels: Painel[] // [frente esquerda, trás, frente direita]
  spine: THREE.Group
  chest: THREE.Group
  pack: THREE.Group // a mochila-relicário
  neck: THREE.Group
  head: THREE.Group
  arms: [Braco, Braco] // [0] direito, [1] esquerdo
  anim: AnimAgente
}

// ---------- utilidades (as do laboratório) ----------
function rng(seed: number) { let s = seed; return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646 }

type Pintor = (g: CanvasRenderingContext2D, w: number, h: number) => void
function canvasTex(w: number, h: number, pintar: Pintor): THREE.CanvasTexture {
  const c = document.createElement('canvas'); c.width = w; c.height = h
  pintar(c.getContext('2d')!, w, h)
  const t = new THREE.CanvasTexture(c)
  // de perto o pixel duro; de longe as versões reduzidas, senão o desenho "formiga" com a câmera
  t.magFilter = THREE.NearestFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true; t.anisotropy = 4
  t.colorSpace = THREE.SRGBColorSpace
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  return t
}
function tiled(t: THREE.Texture, rx: number, ry: number) { const c = t.clone(); c.needsUpdate = true; c.repeat.set(rx, ry); return c }

// só difusa e sombreado chapado (o "std" do laboratório); as cores em hex são sRGB e o three converte
const std = (cor: string, o: THREE.MeshStandardMaterialParameters = {}) =>
  applyPsx(new THREE.MeshStandardMaterial({ color: cor, roughness: 1, metalness: 0, flatShading: true, ...o }))
const basic = (cor: string, o: THREE.MeshBasicMaterialParameters = {}) => applyPsx(new THREE.MeshBasicMaterial({ color: cor, ...o }))

const box = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d)
const cyl = (r0: number, r1: number, h: number, seg: number, open = false, t0?: number, len?: number) =>
  new THREE.CylinderGeometry(r0, r1, h, seg, 1, open, t0, len)
const sph = (r: number, w = 8, h = 6) => new THREE.SphereGeometry(r, w, h)
// um osso de membro: o cilindro pendurado da junta para baixo
const limb = (r0: number, r1: number, len: number, seg = 7) => new THREE.CylinderGeometry(r0, r1, len, seg, 2).translate(0, -len / 2, 0)

function put(geo: THREE.BufferGeometry, mat: THREE.Material, pos: Vec3 | null, par: THREE.Object3D, rot?: Vec3) {
  const m = new THREE.Mesh(geo, mat)
  if (pos) m.position.set(pos[0], pos[1], pos[2])
  if (rot) m.rotation.set(rot[0], rot[1], rot[2])
  m.castShadow = true; m.receiveShadow = true
  par.add(m); return m
}
function grupo(par: THREE.Object3D, x = 0, y = 0, z = 0) { const g = new THREE.Group(); g.position.set(x, y, z); par.add(g); return g }

// ---------- os materiais (as cores do laboratório) ----------
function materiais() {
  // o traje Selado: as runas âmbar costuradas nos punhos, nos braços e na barra
  const runeTex = canvasTex(64, 8, (g, w) => {
    g.clearRect(0, 0, w, 8); g.fillStyle = '#ffd38a'; const r = rng(4243)
    for (let x = 1; x < w - 3; x += 5) {
      const k = (r() * 5) | 0; g.fillRect(x, 1, 1, 6)
      if (k === 0) { g.fillRect(x + 1, 1, 2, 1); g.fillRect(x + 1, 4, 2, 1) }
      else if (k === 1) { g.fillRect(x + 1, 2, 1, 1); g.fillRect(x + 2, 3, 1, 1); g.fillRect(x + 1, 4, 1, 1) }
      else if (k === 2) { g.fillRect(x + 2, 1, 1, 6); g.fillRect(x + 1, 3, 1, 1) }
      else if (k === 3) { g.fillRect(x + 1, 1, 1, 1); g.fillRect(x + 2, 2, 1, 1); g.fillRect(x + 1, 6, 2, 1) }
      else g.fillRect(x + 1, 3, 2, 1)
    }
  })
  runeTex.generateMipmaps = false; runeTex.minFilter = THREE.NearestFilter // traço de 1 px: reduzido, some
  const hairTexA = canvasTex(32, 32, (g, w, h) => hairWaves(g, w, h, 919))
  const hairTexL = canvasTex(16, 64, (g, w, h) => { // a mecha: fios ondulados e a ponta desfiada (transparente)
    hairWaves(g, w, h, 931); const r = rng(937)
    for (let x = 0; x < w; x++) { const cut = 3 + ((r() * 8) | 0) + (x === 0 || x === w - 1 ? 6 : 0); g.clearRect(x, h - cut, 1, cut) } // fios de comprimentos diferentes
    for (let y = 0; y < h; y += 2 + ((r() * 5) | 0)) g.clearRect(r() < 0.5 ? 0 : w - 1, y, 1, 2 + ((r() * 4) | 0)) // a borda, um pouco solta
  })
  return {
    navy: std('#262d42'), navy2: std('#262d42', { side: THREE.DoubleSide }), navyD: std('#1b2030'),
    pants: std('#3a3528'), boot: std('#141110'), skin: std('#a07c64'), glove: std('#1c1814'), belt: std('#191512'),
    amber: basic('#e8b765'), glass: basic('#16222a'), strap: std('#3a2416'),
    leather: std('#3a2416'), leatherD: std('#3a2416', { side: THREE.DoubleSide }), brass: std('#9a7a40'), relic: std('#3a2216'), shell: std('#7a2a22'),
    rune: basic('#7a5420', { map: runeTex, alphaTest: 0.5, side: THREE.DoubleSide }),
    face: std('#ffffff', { map: pintarRosto() }),
    hair: std('#ffffff', { map: tiled(hairTexA, 3, 2) }),
    lock: std('#ffffff', { map: hairTexL, side: THREE.DoubleSide, alphaTest: 0.5 }),
  }
}
type Mats = ReturnType<typeof materiais>

// fios ondulados: faixas suaves de luz e sombra que serpenteiam de cima para baixo
function hairWaves(g: CanvasRenderingContext2D, w: number, h: number, seed: number) {
  const r = rng(seed); g.fillStyle = '#3a2618'; g.fillRect(0, 0, w, h)
  for (let i = 0; i < w * 0.7; i++) {
    const x0 = r() * w, a = 0.6 + r() * 0.9, ph = r() * 6.3, c = r()
    g.fillStyle = c < 0.45 ? 'rgba(92,64,42,0.5)' : c < 0.9 ? 'rgba(24,15,9,0.45)' : 'rgba(120,88,60,0.35)'
    for (let y = 0; y < h; y++) g.fillRect((((x0 + Math.sin(y * 0.17 + ph) * a) % w) + w) % w | 0, y, 1, 1)
  }
}

// ---------- a cabeça: crânio esculpido, rosto pintado em pixel art e o casco do cabelo ----------
// O crânio é uma esfera deformada; o rosto é uma textura nela (96 × 48: a frente fica no primeiro quarto da volta).
// O cabelo é uma cópia do crânio: onde tem cabelo, sai para fora; onde não tem, afunda por dentro.
const HR = 0.105, HSEG: [number, number] = [20, 16]
const HC = new THREE.Vector3(0, 0.1, 0.006) // o centro do crânio (espaço da cabeça)
function sculpt(nx: number, ny: number, nz: number): Vec3 { // posição (unitária) → posição esculpida (em raios)
  let x = nx * 0.92, y = ny * 1.13, z = nz * 1.02
  const lo = Math.max(0, -ny), jaw = lo * lo
  x *= 1 - 0.4 * jaw * (nz > -0.2 ? 1 : 0.6) // o maxilar afina para o queixo
  if (nz < -0.25 && ny > -0.35) z *= 1.07 // a nuca cheia
  if (nz < 0 && ny < -0.45) { z *= 0.82; x *= 0.92 } // e entra no pescoço
  if (nz > 0.55) z = 0.55 * 1.02 + (z - 0.55 * 1.02) * 0.55 // o rosto é mais plano
  const fr = Math.max(0, nz - 0.45)
  if (ny < -0.62 && nz > 0.2) { z += 0.07 * fr * 2; y -= 0.03 } // o queixo para a frente
  if (Math.abs(nx) > 0.35 && Math.abs(nx) < 0.85 && ny > -0.3 && ny < 0.1 && nz > 0.3) x += Math.sign(nx) * 0.015 // maçãs do rosto
  if (ny > 0.06 && ny < 0.3 && nz > 0.6) z += 0.035 // a testa sobre os olhos
  if (ny > -0.12 && ny <= 0.06 && Math.abs(nx) > 0.12 && Math.abs(nx) < 0.55 && nz > 0.6) z -= 0.03 // as órbitas
  if (Math.abs(nx) < 0.1 && ny < 0.04 && ny > -0.4 && nz > 0.8) z += 0.1 * Math.sin((Math.PI * (ny + 0.4)) / 0.44) // o nariz
  return [x, y, z]
}
// o casco do cabelo: ondulado até a nuca, risca do lado esquerdo dele, o volume caindo para a direita
function hairK(nx: number, ny: number, nz: number) { // quanto o casco sai do crânio nessa direção (< 1: não tem cabelo ali)
  const ax = Math.abs(nx), back = Math.min(1, Math.max(0, (-nz - 0.15) / 0.3)) // 0 no lado, 1 atrás
  let line = (ax > 0.62 ? 0.04 : 0.3) * (1 - back) - 0.9 * back // a linha do cabelo: acima da orelha nos lados, descendo até a nuca atrás
  if (nz > 0.25) line = ax > 0.74 ? 0.06 : nx < -0.1 ? 0.33 : 0.47 // a testa: do lado da mecha o cabelo desce mais
  let m = Math.min(1, Math.max(0, (ny - line) / 0.1))
  if (ax > 0.7 && nz > -0.45 && nz < 0.15 && ny < 0.1 && ny > -0.3) m = 0 // a metade de baixo da orelha fica de fora
  if (m <= 0.01) return 0.9 // sem cabelo: afunda por dentro do crânio
  let vol = 0.06 + 0.1 * Math.max(0, ny) + 0.06 * Math.max(0, -nz) * (ny > -0.55 ? 1 : 0.4) // cheio no alto e atrás
  if (nx < 0) vol += 0.035 * Math.max(0, ny) // penteado para a direita dele
  if (ny > 0.5 && nz > -0.3) vol -= 0.05 * Math.exp(-(((nx - 0.3) / 0.08) ** 2)) // o sulco da risca
  return 1 + vol * m
}
function headGeo(r: number, cabelo: boolean) {
  const g = new THREE.SphereGeometry(r, HSEG[0], HSEG[1]), p = g.attributes.position
  for (let i = 0; i < p.count; i++) {
    const nx = p.getX(i) / r, ny = p.getY(i) / r, nz = p.getZ(i) / r
    const [x, y, z] = sculpt(nx, ny, nz), k = cabelo ? hairK(nx, ny, nz) : 1
    p.setXYZ(i, x * r * k, y * r * k, z * r * k)
  }
  g.computeVertexNormals(); return g
}

// o rosto: pele, barba por fazer, sobrancelhas grossas, olhos, sombra do nariz, lábios (só a expressão neutra)
const FW = 96, FH = 48, FX = 24 // FX: o meio do rosto na textura
function pintarRosto() { // a altura na textura é o ângulo a partir do alto da cabeça: Y(ny) acha a linha de cada traço
  const Y = (ny: number) => Math.round((Math.acos(ny) / Math.PI) * FH)
  const yE = Y(-0.01), yB = Y(0.17), yN = Y(-0.3), yM = Y(-0.5), yC = Y(-0.72)
  return canvasTex(FW, FH, (g) => {
    const px = (x: number, y: number, w: number, h: number, c: string) => { g.fillStyle = c; g.fillRect(FX + x, y, w, h) }, r = rng(911)
    g.fillStyle = '#a07c64'; g.fillRect(0, 0, FW, FH)
    for (let i = 0; i < 260; i++) { g.fillStyle = r() < 0.5 ? '#9a7660' : '#a88470'; g.fillRect((r() * FW) | 0, (r() * FH) | 0, 1, 1) } // poros
    px(-9, yN, 18, yC - yN + 4, '#977360') // a parte de baixo do rosto um pouco mais escura
    for (let i = 0; i < 130; i++) { // a barba por fazer
      const x = (-9 + r() * 18) | 0, y = (yN + 1 + r() * (yC - yN + 3)) | 0
      if (Math.abs(x) < 3 && y < yM - 1) continue
      px(x, y, 1, 1, r() < 0.6 ? '#7a6050' : '#86685a')
    }
    px(-7, yE - 1, 5, 2, '#8e6c58'); px(2, yE - 1, 5, 2, '#8e6c58') // a sombra das órbitas
    px(-1, yB + 1, 2, yN - yB - 1, '#ac8670'); px(1, yB + 2, 1, yN - yB - 1, '#86644f'); px(-2, yN, 4, 1, '#7c5c48') // o nariz: luz, lado na sombra, a base
    px(-8, yE + 2, 3, 2, '#ad8270'); px(5, yE + 2, 3, 2, '#ad8270') // as maçãs, quentes
    for (const ex of [-6, 3]) { px(ex, yE - 1, 3, 2, '#d2c8bc'); px(ex + 1, yE - 1, 1, 2, '#3a2a20'); px(ex, yE - 2, 3, 1, '#3a2620') } // o branco, a íris, a pálpebra
    for (const bx of [-7, 3]) { px(bx, yB, 4, 1, '#2a1c14'); px(bx < 0 ? bx : bx + 2, yB, 2, 1, '#22160f') } // as sobrancelhas
    px(-2, yM, 5, 1, '#6a3c34'); px(-1, yM + 1, 3, 1, '#8a5a4c') // os lábios
    px(-1, yC, 2, 1, '#86644f') // o vinco do queixo
  })
}

// ---------- as mechas por cima do casco ----------
// No laboratório a ponta de cada mecha balançava (verlet); aqui ela fica parada no penteado de descanso:
// um trecho colado no couro cabeludo e a ponta caindo da direção em que sai do casco para baixo.
const NECK_Y = 0.262, HEAD_Y = 0.072
// colisores do peito (a gola, os ombros, a mochila), já no espaço da cabeça parada
const CORPO = [[0, 0.285, -0.005, 0.1], [-0.15, 0.2, -0.01, 0.1], [0.15, 0.2, -0.01, 0.1], [0, 0.24, -0.2, 0.11]]
  .map(([x, y, z, r]) => ({ c: new THREE.Vector3(x, y - NECK_Y - HEAD_Y, z), r }))
function scalpA(phi: number, lat: number, out: THREE.Vector3) { // um ponto em cima do casco na direção (giro a partir da frente, latitude)
  const nx = Math.sin(phi) * Math.cos(lat), ny = Math.sin(lat), nz = Math.cos(phi) * Math.cos(lat)
  const [x, y, z] = sculpt(nx, ny, nz), k = Math.max(1.05, hairK(nx, ny, nz)) * 1.02
  return out.set(HC.x + x * HR * k, HC.y + y * HR * k, HC.z + z * HR * k)
}
function colideMecha(p: THREE.Vector3) { // empurra a ponta para fora do casco, da gola, dos ombros e da mochila
  const l = p.clone().sub(HC)
  const pr = l.length(), ln = Math.hypot(l.x / 0.92, l.y / 1.13, l.z / 1.02) || 1
  const nx = l.x / 0.92 / ln, ny = l.y / 1.13 / ln, nz = l.z / 1.02 / ln
  const sc = sculpt(nx, ny, nz), sr = Math.hypot(sc[0], sc[1], sc[2]) * HR * Math.max(1, hairK(nx, ny, nz)) * 1.06
  if (pr < sr && pr > 1e-5) p.copy(l.multiplyScalar(sr / pr).add(HC))
  for (const b of CORPO) { const t = p.clone().sub(b.c), d = t.length(); if (d < b.r && d > 1e-5) p.copy(b.c).addScaledVector(t, b.r / d) }
}
// [giro na raiz, latitude na raiz, giro onde solta, latitude onde solta, comprimento solto, largura]
const LOCK_A: number[][] = []
;[1.75, 2.05, 2.35, 2.65, 2.95].forEach((p, i) => [-1, 1].forEach((s) => LOCK_A.push([s * p * 0.55, 1.05, s * p, -0.3 - 0.06 * i, 0.075 + 0.006 * i, 0.056]))) // atrás: cai até a nuca
LOCK_A.push([0, 1.0, Math.PI, -0.5, 0.09, 0.06]) // a do meio da nuca
;[[1.25, 0.12, 0.07], [1.5, 0.0, 0.075]].forEach(([p, lb, len]) => { LOCK_A.push([-0.35, 1.05, -p, lb, len + 0.012, 0.05]); LOCK_A.push([0.55, 1.05, p, lb + 0.04, len, 0.048]) }) // os lados, por cima da orelha
LOCK_A.push([0.42, 1.2, -0.36, 0.42, 0.09, 0.058]) // a mecha: da risca, atravessa a testa e cai na frente do olho direito
LOCK_A.push([0.25, 1.05, -0.7, 0.4, 0.07, 0.046]) // e outra embaixo dela, até a têmpora
LOCK_A.push([0.62, 1.05, 0.2, 0.55, 0.035, 0.04]) // um fiapo curto do outro lado da risca

function mechas(mat: THREE.Material) {
  const PIN = 4, FREE = 4, rows = PIN + FREE, DOWN = new THREE.Vector3(0, -1, 0)
  const pos: number[] = [], uv: number[] = [], idx: number[] = []
  const _a = new THREE.Vector3(), _b = new THREE.Vector3(), hd = new THREE.Vector3(), hx = new THREE.Vector3()
  LOCK_A.forEach(([pt, lt, pb, lb, len, w], li) => {
    const pl: THREE.Vector3[] = [], tl: THREE.Vector3[] = []
    for (let k = 0; k < PIN; k++) {
      const f = k / (PIN - 1), phi = pt + (pb - pt) * f, lat = lt + (lb - lt) * f
      pl.push(scalpA(phi, lat, new THREE.Vector3()))
      tl.push(scalpA(phi + 0.05, lat, _a).sub(scalpA(phi - 0.05, lat, _b)).normalize().clone()) // a largura da fita: ao longo do giro
    }
    let path = 0; for (let k = 1; k < PIN; k++) path += pl[k].distanceTo(pl[k - 1])
    const seg = len / FREE, total = path + len
    // a ponta solta, penteada: sai na direção do casco e curva para baixo; depois o comprimento e as colisões
    const an = pl[PIN - 1], he = an.clone().sub(pl[PIN - 2]).normalize(), solta: THREE.Vector3[] = [], hv = an.clone()
    for (let j = 0; j < FREE; j++) { hd.copy(he).lerp(DOWN, Math.min(1, 0.28 * (j + 1))).normalize(); hv.addScaledVector(hd, seg); solta.push(hv.clone()) }
    for (let it = 0; it < 2; it++) {
      let prev = an
      for (const p of solta) { const t = p.clone().sub(prev), d = t.length() || 1e-6; p.copy(prev).addScaledVector(t, seg / d); colideMecha(p); prev = p }
    }
    // a fita: duas pontas por linha; afina e ondula na ponta
    const base = pos.length / 3, u0 = (li * 0.29) % 1, uw = (w / 0.06) * 0.9
    let prev = an, sAcc = 0
    for (let r = 0; r < rows; r++) {
      const free = r >= PIN, j = r - PIN, c = free ? solta[j] : pl[r]
      if (r > 0) sAcc += r < PIN ? pl[r].distanceTo(pl[r - 1]) : seg
      if (free) { hd.copy(c).sub(prev); const dd = hd.lengthSq() || 1e-8; hx.copy(tl[PIN - 1]).addScaledVector(hd, -hx.dot(hd) / dd).normalize(); prev = c }
      else hx.copy(tl[r])
      const hw = w * 0.5 * (free ? 1 - (0.38 * (j + 1)) / FREE : 1)
      hv.copy(c); if (free) hv.addScaledVector(hx, Math.sin(j * 1.9 + li * 1.3) * 0.006)
      _a.copy(hv).addScaledVector(hx, -hw); _b.copy(hv).addScaledVector(hx, hw)
      pos.push(_a.x, _a.y, _a.z, _b.x, _b.y, _b.z)
      const v = 1 - sAcc / total; uv.push(u0, v, u0 + uw, v)
      if (r < rows - 1) { const b = base + r * 2; idx.push(b, b + 1, b + 2, b + 1, b + 3, b + 2) }
    }
  })
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx)
  geo.computeVertexNormals()
  const m = new THREE.Mesh(geo, mat); m.castShadow = true; m.receiveShadow = true
  return m
}

// ---------- o corpo ----------
function montarCabeca(M: Mats, neck: THREE.Group) {
  put(new THREE.CylinderGeometry(0.05, 0.056, 0.085, 8).translate(0, 0.04, 0), M.skin, null, neck)
  const head = grupo(neck, 0, HEAD_Y, 0)
  put(headGeo(HR, false), M.face, [HC.x, HC.y, HC.z], head)
  put(headGeo(HR, true), M.hair, [HC.x, HC.y, HC.z], head)
  for (const s of [-1, 1]) { const e = put(sph(0.024, 6, 5), M.skin, [s * 0.094, 0.098, -0.004], head); e.scale.set(0.42, 1.0, 0.7); e.rotation.y = s * 0.3 } // as orelhas
  head.add(mechas(M.lock))
  return head
}

export function montarAgente(): Agente {
  const M = materiais()
  const root = new THREE.Group(); root.name = 'agente'
  const roll = grupo(root, 0, 0.5, 0) // o pivô da cambalhota
  const pelvis = grupo(roll, 0, 0.42, 0); pelvis.rotation.order = 'YXZ'
  put(box(0.3, 0.17, 0.2), M.pants, [0, -0.03, 0], pelvis)
  put(cyl(0.168, 0.168, 0.05, 10), M.belt, [0, 0.055, 0], pelvis).scale.z = 0.72
  for (const x of [0.04, 0.065, 0.09, 0.115]) { // os cartuchos de sal no cinto
    put(cyl(0.011, 0.011, 0.05, 6), M.shell, [x, 0.06, 0.118 - x * 0.25], pelvis)
    put(cyl(0.012, 0.012, 0.012, 6), M.brass, [x, 0.03, 0.118 - x * 0.25], pelvis)
  }
  put(box(0.07, 0.075, 0.045), M.leather, [-0.158, 0.03, 0.04], pelvis, [0, -1.2, 0]); put(sph(0.008, 4, 3), M.brass, [-0.177, 0.045, 0.06], pelvis) // a bolsa do Demantino

  const legs = ([-1, 1] as const).map((s): Perna => {
    const th = grupo(pelvis, s * 0.095, -0.03, 0)
    put(limb(0.078, 0.06, 0.44), M.pants, null, th)
    const kn = grupo(th, 0, -0.44, 0)
    put(sph(0.061, 6, 4), M.pants, null, kn); put(limb(0.058, 0.046, 0.42), M.pants, null, kn)
    put(new THREE.CylinderGeometry(0.062, 0.058, 0.14, 7).translate(0, -0.35, 0), M.boot, null, kn) // o cano da bota
    const ft = grupo(kn, 0, -0.42, 0)
    put(box(0.11, 0.08, 0.27), M.boot, [0, -0.025, 0.055], ft); put(box(0.116, 0.024, 0.28), M.belt, [0, -0.064, 0.055], ft)
    return { s, th, kn, ft }
  }) as [Perna, Perna]

  // a barra da jaqueta, aberta na frente: três painéis que acompanham as pernas
  const panels = ([[0.2, 1.75, 1], [1.95, 2.39, 0], [4.34, 1.75, -1]] as const).map(([t0, len, s]): Painel => {
    const g = grupo(pelvis, 0, 0.06, 0)
    put(cyl(0.188, 0.235, 0.38, 7, true, t0, len).translate(0, -0.19, 0), M.navy2, null, g) // até o meio da coxa
    put(cyl(0.234, 0.234, 0.035, 7, true, t0, len).translate(0, -0.345, 0), M.rune, null, g) // as runas da barra
    return { g, s, sw: 0, v: 0 }
  })

  const spine = grupo(pelvis, 0, 0.04, 0)
  put(new THREE.CylinderGeometry(0.178, 0.172, 0.18, 9).translate(0, 0.08, 0), M.navy, null, spine).scale.z = 0.72
  const chest = grupo(spine, 0, 0.2, 0)
  put(new THREE.CylinderGeometry(0.208, 0.178, 0.34, 10, 2).translate(0, 0.07, 0), M.navy, null, chest).scale.z = 0.7
  put(box(0.012, 0.32, 0.012), M.navyD, [0, 0.06, 0.143], chest) // o zíper
  put(cyl(0.088, 0.112, 0.085, 10, true).translate(0, 0.27, 0), M.navy2, null, chest) // a gola
  for (const s of [-1, 1]) put(sph(0.072, 7, 5), M.navy, [s * 0.19, 0.205, 0], chest) // os ombros
  put(cyl(0.104, 0.13, 0.07, 10, true).translate(0, 0.25, 0), M.leatherD, null, chest) // a gola de couro
  for (const a of [-0.6, -0.2, 0.2, 0.6]) put(sph(0.009, 5, 3), M.brass, [Math.sin(a) * 0.118, 0.25, Math.cos(a) * 0.118], chest) // os rebites
  for (const s of [-1, 1]) put(box(0.034, 0.36, 0.012), M.strap, [s * 0.088, 0.07, 0.146], chest, [0.04, 0, s * 0.05]) // as alças da mochila, na frente
  put(box(0.05, 0.03, 0.01), M.amber, [-0.135, 0.15, 0.141], chest) // o distintivo âmbar no peito

  // a mochila: o relicário de madeira com cantos de latão, o emblema âmbar e os três frascos das capturas
  const pack = grupo(chest, 0, 0.07, -0.185)
  put(box(0.3, 0.4, 0.13), M.relic, [0, 0, -0.03], pack)
  for (const [a, b] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) {
    put(box(0.06, 0.018, 0.14), M.brass, [a * 0.13, b * 0.19, -0.03], pack); put(box(0.018, 0.06, 0.14), M.brass, [a * 0.14, b * 0.17, -0.03], pack)
  }
  put(new THREE.TorusGeometry(0.045, 0.008, 4, 12), M.amber, [0, 0.09, -0.097], pack) // o emblema
  put(box(0.008, 0.09, 0.006), M.amber, [0, 0.09, -0.098], pack); put(box(0.09, 0.008, 0.006), M.amber, [0, 0.09, -0.098], pack)
  put(box(0.24, 0.06, 0.02), M.brass, [0, -0.09, -0.1], pack) // o friso dos frascos
  for (const s of [-1, 0, 1]) {
    const g = grupo(pack, s * 0.075, -0.09, -0.112)
    put(cyl(0.022, 0.022, 0.07, 8), M.glass, null, g)
    put(cyl(0.025, 0.025, 0.012, 8), M.brass, [0, 0.04, 0], g); put(cyl(0.025, 0.025, 0.012, 8), M.brass, [0, -0.04, 0], g)
  }

  // pescoço curto e a cabeça (cabelo um pouco mais comprido, até a gola)
  const neck = grupo(chest, 0, NECK_Y, 0)
  const head = montarCabeca(M, neck)

  // os braços: soltos (sem arma); a palma é o +z da mão
  const arms = ([-1, 1] as const).map((s): Braco => {
    const sh = grupo(chest, s * 0.205, 0.215, 0)
    const up = grupo(sh)
    put(limb(0.055, 0.047, 0.29), M.navy, null, up); put(cyl(0.057, 0.057, 0.025, 8), M.rune, [0, -0.13, 0], up)
    const fo = grupo(up, 0, -0.29, 0)
    put(sph(0.049, 6, 4), M.navy, null, fo); put(limb(0.047, 0.04, 0.25), M.navy, null, fo)
    put(cyl(0.045, 0.045, 0.03, 8), M.navyD, [0, -0.235, 0], fo); put(cyl(0.047, 0.047, 0.022, 10, true), M.rune, [0, -0.205, 0], fo) // o punho e as runas
    const hd = grupo(fo, 0, -0.26, 0)
    put(box(0.075, 0.095, 0.042), M.glove, [0, -0.045, 0.005], hd); put(box(0.07, 0.05, 0.036), M.glove, [0, -0.105, 0.016], hd, [0.55, 0, 0])
    put(box(0.025, 0.05, 0.025), M.glove, [s * 0.04, -0.04, 0.026], hd, [0, 0, s * -0.4]) // o polegar
    return { s, sh, up, fo, hd }
  }) as [Braco, Braco]

  const a: Agente = { root, roll, pelvis, legs, panels, spine, chest, pack, neck, head, arms, anim: { fase: 0, amp: 0, corrida: 0, tempo: 0 } }
  animarAgente(a, { velocidade: 0, corrida: 0, esquiva: -1 }, 0) // a pose parada: os pés no chão desde o primeiro quadro
  return a
}
