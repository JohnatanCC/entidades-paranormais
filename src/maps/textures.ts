// O catálogo de texturas do cenário. O mapa guarda só o NOME ("papel-verde"); aqui fica o que cada nome é.
// No jogo, cada textura é um bloco de 1 m com 32 × 32 pixels (render/materiais.ts encaixa e reduz estes desenhos).
// Por enquanto os desenhos são por código num canvas, como no laboratório (reference/lab/07 e 08, "as texturas").
// Mais tarde entram imagens de 32 × 32 em public/texturas/<nome>.png com o mesmo nome, sem mudar os mapas.
//   tam: quantos metros o DESENHO original cobria no laboratório (o TILE de lá); vira um número inteiro de repetições por bloco
//   usos: em que paletas ela aparece no editor (qualquer textura funciona em qualquer lugar)

export type Uso = 'parede' | 'lambri' | 'piso' | 'teto' | 'porta'
type G = CanvasRenderingContext2D
type Pintor = (g: G, w: number, h: number) => void

export interface TexDef {
  nome: string
  usos: Uso[]
  tam: [number, number]
  px: [number, number] // o tamanho do canvas
  cor: string // a cor de base (amostra rápida e plano B)
  origem: 'casa' | 'intro' | 'nova'
  pintar: Pintor
}

/** Números pseudoaleatórios repetíveis: a mesma semente desenha sempre a mesma textura. */
export function rng(seed: number) { let s = seed; return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646 }

// ---------- peças de desenho do laboratório ----------
function sujeira(g: G, w: number, h: number, r: () => number, n: number, escuro: string, claro: string) {
  for (let i = 0; i < n; i++) { g.fillStyle = r() < 0.6 ? escuro : claro; g.fillRect(r() * w | 0, r() * h | 0, 1 + (r() * 2 | 0), 1 + (r() * 2 | 0)) }
}

/** O papel adamascado (0,5 × 1 m): o medalhão florido, desbotado, com a umidade descendo do forro. */
const damasco = (seed: number, base: string, dark: string, light: string): Pintor => (g, w, h) => {
  const r = rng(seed); g.fillStyle = base; g.fillRect(0, 0, w, h)
  const med = (cx: number, cy: number) => {
    g.fillStyle = dark; for (let y = -13; y <= 13; y++) { const ww = Math.max(1, Math.round((13 - Math.abs(y)) * 0.62 + 1.6 * Math.sin(Math.abs(y) * 0.95))); g.fillRect(cx - ww, cy + y, ww * 2, 1) }
    g.fillStyle = base; for (let y = -7; y <= 7; y++) { const ww = Math.round((7 - Math.abs(y)) * 0.45); if (ww > 0) g.fillRect(cx - ww, cy + y, ww * 2, 1) }
    g.fillStyle = light; g.fillRect(cx - 1, cy - 10, 2, 20); g.fillRect(cx - 5, cy - 1, 10, 2); g.fillRect(cx - 3, cy - 13, 6, 2); g.fillRect(cx - 3, cy + 11, 6, 2)
  }
  med(16, 16); med(0, 48); med(32, 48)
  g.fillStyle = 'rgba(0,0,0,0.14)'; g.fillRect(0, 0, 1, h) // a emenda do rolo
  for (let i = 0; i < 260; i++) { g.fillStyle = r() < 0.55 ? 'rgba(0,0,0,0.14)' : 'rgba(255,240,220,0.05)'; g.fillRect(r() * w | 0, r() * h | 0, 1, 1 + (r() * 3 | 0)) }
  const gr = g.createLinearGradient(0, 0, 0, h * 0.55); gr.addColorStop(0, 'rgba(36,26,12,0.32)'); gr.addColorStop(1, 'rgba(36,26,12,0)'); g.fillStyle = gr; g.fillRect(r() * w * 0.6, 0, 9, h * 0.55)
}

/** O bloco de concreto pintado (1,2 × 0,6 m: três fileiras de blocos de 40 × 20 cm). */
const bloco = (seed: number, base: (v: number) => string, argamassa: string): Pintor => (g, w, h) => {
  const r = rng(seed); g.fillStyle = argamassa; g.fillRect(0, 0, w, h)
  for (let row = 0; row < 3; row++) {
    const y = Math.round(row * h / 3), yh = Math.round((row + 1) * h / 3) - y, off = row % 2 ? 11 : 0
    for (let x = -off; x < w; x += 21) { g.fillStyle = base(r() - 0.5); g.fillRect(x + 1, y + 1, 20, yh - 1) }
  }
  sujeira(g, w, h, r, 220, 'rgba(10,12,10,0.14)', 'rgba(230,240,230,0.05)')
  for (let i = 0; i < 6; i++) { g.fillStyle = 'rgba(20,24,18,0.14)'; const x = r() * w | 0; g.fillRect(x, 0, 1 + (r() * 2 | 0), 4 + r() * 24 | 0) } // os escorridos
}

const losango = (g: G, cx: number, cy: number, s: number) => { g.beginPath(); g.moveTo(cx, cy - s); g.lineTo(cx + s, cy); g.lineTo(cx, cy + s); g.lineTo(cx - s, cy); g.closePath(); g.fill() }

// ---------- o catálogo ----------
export const TEXTURAS: Record<string, TexDef> = {
  // --- paredes ---
  'reboco-creme': { nome: 'Reboco creme', usos: ['parede'], tam: [2, 2], px: [64, 64], cor: '#9a8f78', origem: 'intro', pintar: (g, w, h) => {
    const r = rng(3107); g.fillStyle = '#9a8f78'; g.fillRect(0, 0, w, h); sujeira(g, w, h, r, 420, 'rgba(40,32,20,0.13)', 'rgba(255,245,225,0.06)')
    for (let i = 0; i < 5; i++) { g.fillStyle = 'rgba(50,40,26,0.12)'; const x = r() * w | 0; g.fillRect(x, 0, 2, 10 + r() * 50 | 0) }
  } },
  'papel-verde': { nome: 'Papel adamascado verde', usos: ['parede'], tam: [0.5, 1], px: [32, 64], cor: '#2f4130', origem: 'casa', pintar: damasco(923, '#2f4130', '#202e20', '#56664a') },
  'papel-vinho': { nome: 'Papel adamascado vinho', usos: ['parede'], tam: [0.5, 1], px: [32, 64], cor: '#45191c', origem: 'casa', pintar: damasco(929, '#45191c', '#2e0f12', '#74383a') },
  'papel-floral': { nome: 'Papel floral desbotado', usos: ['parede'], tam: [0.5, 0.5], px: [32, 32], cor: '#4c5642', origem: 'casa', pintar: (g, w, h) => {
    const r = rng(937); g.fillStyle = '#4c5642'; g.fillRect(0, 0, w, h)
    const fl = (x: number, y: number, c: string) => { g.fillStyle = c; g.fillRect(x - 1, y - 2, 2, 4); g.fillRect(x - 2, y - 1, 4, 2); g.fillStyle = '#b09a78'; g.fillRect(x, y, 1, 1); g.fillStyle = '#34402c'; g.fillRect(x + 2, y + 2, 3, 1); g.fillRect(x + 4, y + 1, 1, 1) }
    fl(6, 7, '#7e6a60'); fl(22, 22, '#7a6058'); fl(22, 6, '#6e6a58'); fl(7, 23, '#6e6a58'); fl(14, 15, '#806452')
    for (let i = 0; i < 160; i++) { g.fillStyle = r() < 0.55 ? 'rgba(0,0,0,0.13)' : 'rgba(255,245,225,0.05)'; g.fillRect(r() * w | 0, r() * h | 0, 1, 2) }
  } },
  'pedra': { nome: 'Reboco riscado imitando pedra', usos: ['parede', 'piso'], tam: [1, 1], px: [64, 64], cor: '#6c685f', origem: 'casa', pintar: (g, w, h) => {
    const r = rng(919); g.fillStyle = '#6c685f'; g.fillRect(0, 0, w, h)
    for (let i = 0; i < 4; i++) { const y = i * 16, off = i % 2 ? 16 : 0; for (let x = -off; x < w; x += 32) { const v = 100 + (r() * 18 | 0); g.fillStyle = `rgb(${v},${v - 4},${v - 11})`; g.fillRect(x + 1, y + 1, 31, 15) } }
    g.fillStyle = 'rgba(28,26,22,0.7)'; for (let i = 0; i < 4; i++) { g.fillRect(0, i * 16, w, 1); const off = i % 2 ? 16 : 0; for (let x = off; x < w; x += 32) g.fillRect(x, i * 16, 1, 16) }
    for (let i = 0; i < 380; i++) { g.fillStyle = r() < 0.55 ? 'rgba(20,18,15,0.18)' : 'rgba(200,195,180,0.08)'; g.fillRect(r() * w | 0, r() * h | 0, 1, 1 + (r() * 2 | 0)) }
    for (let i = 0; i < 12; i++) { g.fillStyle = 'rgba(30,26,20,0.12)'; const x = r() * w | 0; g.fillRect(x, 0, 1 + (r() * 2 | 0), 8 + r() * 40 | 0) } // os escorridos
  } },
  'fachada': { nome: 'Fachada ocre', usos: ['parede'], tam: [1.5, 1.5], px: [64, 64], cor: '#7a6a4e', origem: 'casa', pintar: (g, w, h) => {
    const r = rng(947); g.fillStyle = '#7a6a4e'; g.fillRect(0, 0, w, h)
    for (let i = 0; i < 500; i++) { g.fillStyle = r() < 0.5 ? 'rgba(40,32,22,0.14)' : 'rgba(200,185,150,0.08)'; g.fillRect(r() * w | 0, r() * h | 0, 2, 1) }
    for (let i = 0; i < 16; i++) { g.fillStyle = 'rgba(30,26,18,0.16)'; const x = r() * w | 0; g.fillRect(x, 0, 1 + (r() * 3 | 0), 10 + r() * 54 | 0) }
  } },
  'azulejo-branco': { nome: 'Azulejo branco 15 cm', usos: ['parede', 'lambri'], tam: [0.6, 0.6], px: [64, 64], cor: '#bcbab0', origem: 'intro', pintar: (g, w, h) => {
    const r = rng(3113); g.fillStyle = '#6e6c64'; g.fillRect(0, 0, w, h)
    for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { const v = 186 + (r() * 22 | 0); g.fillStyle = `rgb(${v},${v - 2},${v - 9})`; g.fillRect(x * 16 + 1, y * 16 + 1, 15, 15); if (r() < 0.08) { g.fillStyle = '#4a4840'; g.fillRect(x * 16 + 2 + (r() * 8 | 0), y * 16 + 2 + (r() * 8 | 0), 4, 3) } }
    sujeira(g, w, h, r, 260, 'rgba(60,50,30,0.14)', 'rgba(255,255,255,0.06)')
  } },
  'lambri-azulejo': { nome: 'Azulejo azul e branco', usos: ['lambri', 'parede'], tam: [0.5, 0.5], px: [64, 64], cor: '#c9c6bb', origem: 'casa', pintar: (g, w, h) => {
    const r = rng(1201); g.fillStyle = '#c9c6bb'; g.fillRect(0, 0, w, h)
    for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) {
      const X = x * 16, Y = y * 16, v = 196 + (r() * 22 | 0); g.fillStyle = `rgb(${v},${v - 3},${v - 12})`; g.fillRect(X + 1, Y + 1, 15, 15)
      g.fillStyle = r() < 0.5 ? '#34548a' : '#2c4778'; g.fillRect(X + 7, Y + 3, 3, 11); g.fillRect(X + 3, Y + 7, 11, 3); g.fillRect(X + 2, Y + 2, 2, 2); g.fillRect(X + 13, Y + 2, 2, 2); g.fillRect(X + 2, Y + 13, 2, 2); g.fillRect(X + 13, Y + 13, 2, 2)
      if (r() < 0.12) { g.fillStyle = '#6b6457'; g.fillRect(X + 1 + (r() * 9 | 0), Y + 1 + (r() * 9 | 0), 4 + (r() * 5 | 0), 3 + (r() * 4 | 0)) } // a peça lascada
    }
    g.fillStyle = 'rgba(60,54,44,0.55)'; for (let i = 0; i <= 4; i++) { g.fillRect(i * 16, 0, 1, h); g.fillRect(0, i * 16, w, 1) }
    for (let i = 0; i < 260; i++) { g.fillStyle = r() < 0.6 ? 'rgba(60,50,30,0.16)' : 'rgba(255,255,255,0.06)'; g.fillRect(r() * w | 0, r() * h | 0, 1, 1 + (r() * 3 | 0)) }
  } },
  'bloco-concreto': { nome: 'Bloco de concreto pintado', usos: ['parede'], tam: [1.2, 0.6], px: [64, 32], cor: '#80887e', origem: 'intro',
    pintar: bloco(3101, (v) => `rgb(${128 + v * 14 | 0},${136 + v * 14 | 0},${126 + v * 12 | 0})`, '#5a6058') },
  'concreto-aparente': { nome: 'Concreto aparente', usos: ['parede'], tam: [2.4, 1.2], px: [64, 32], cor: '#5c5a52', origem: 'intro', pintar: (g, w, h) => {
    const r = rng(3151); g.fillStyle = '#5c5a52'; g.fillRect(0, 0, w, h); sujeira(g, w, h, r, 520, 'rgba(20,18,14,0.16)', 'rgba(220,215,200,0.06)')
    g.fillStyle = 'rgba(20,18,14,0.5)'; g.fillRect(0, 0, w, 1); g.fillRect(0, 0, 1, h); g.fillRect(32, 0, 1, h)
    g.fillStyle = '#2a2824'; for (const [x, y] of [[8, 8], [24, 8], [40, 8], [56, 8], [8, 24], [24, 24], [40, 24], [56, 24]]) g.fillRect(x, y, 2, 2)
    for (let i = 0; i < 6; i++) { g.fillStyle = 'rgba(30,26,20,0.16)'; const x = r() * w | 0; g.fillRect(x, 0, 1 + (r() * 2 | 0), 6 + r() * 26 | 0) }
  } },
  'chapa-verde': { nome: 'Chapa de aço rebitada', usos: ['parede'], tam: [1.2, 1.2], px: [64, 64], cor: '#34413a', origem: 'intro', pintar: (g, w, h) => {
    const r = rng(3157); g.fillStyle = '#34413a'; g.fillRect(0, 0, w, h); sujeira(g, w, h, r, 260, 'rgba(8,10,8,0.25)', 'rgba(170,180,170,0.06)')
    for (let i = 0; i < 9; i++) { g.fillStyle = 'rgba(90,60,36,0.35)'; g.fillRect(r() * w | 0, r() * h | 0, 2 + (r() * 6 | 0), 1 + (r() * 3 | 0)) } // a ferrugem
    g.fillStyle = '#1a201c'; g.fillRect(0, 0, w, 1); g.fillRect(0, 0, 1, h)
    g.fillStyle = '#5a6a60'; for (let k = 4; k < w; k += 8) { g.fillRect(k, 3, 1, 1); g.fillRect(3, k, 1, 1) }
  } },
  'tijolo': { nome: 'Tijolo à vista', usos: ['parede'], tam: [1, 0.5], px: [64, 32], cor: '#7a4a36', origem: 'nova', pintar: (g, w, h) => {
    const r = rng(1301); g.fillStyle = '#3a2c24'; g.fillRect(0, 0, w, h)
    for (let row = 0; row < 4; row++) { const off = row % 2 ? 8 : 0; for (let x = -off; x < w; x += 16) { const v = r(); g.fillStyle = `rgb(${110 + v * 30 | 0},${62 + v * 14 | 0},${44 + v * 8 | 0})`; g.fillRect(x + 1, row * 8 + 1, 15, 7) } }
    sujeira(g, w, h, r, 200, 'rgba(20,10,6,0.2)', 'rgba(220,180,150,0.06)')
  } },
  // --- barras (lambri) ---
  'lambri-madeira': { nome: 'Lambri de madeira almofadado', usos: ['lambri'], tam: [0.8, 1], px: [64, 64], cor: '#21140b', origem: 'casa', pintar: (g, w, h) => {
    const r = rng(921); g.fillStyle = '#21140b'; g.fillRect(0, 0, w, h)
    for (const x0 of [0, 32]) {
      g.fillStyle = '#2b1a0f'; g.fillRect(x0 + 4, 8, 24, 48)
      g.fillStyle = '#3a2516'; g.fillRect(x0 + 4, 8, 24, 2); g.fillRect(x0 + 4, 8, 2, 48)
      g.fillStyle = '#120a05'; g.fillRect(x0 + 4, 54, 24, 2); g.fillRect(x0 + 26, 8, 2, 48)
      g.fillStyle = '#100904'; g.fillRect(x0, 0, 1, h)
    }
    g.fillStyle = '#100904'; g.fillRect(0, 0, w, 2); g.fillRect(0, 62, w, 2)
    for (let i = 0; i < 200; i++) { g.fillStyle = r() < 0.5 ? 'rgba(0,0,0,0.25)' : 'rgba(120,90,60,0.08)'; g.fillRect(r() * w | 0, r() * h | 0, 1, 2 + (r() * 4 | 0)) }
  } },
  'barra-madeira': { nome: 'Barra de madeira lisa', usos: ['lambri'], tam: [1.2, 1.2], px: [64, 64], cor: '#3a2a1c', origem: 'intro', pintar: (g, w, h) => {
    const r = rng(3109); g.fillStyle = '#3a2a1c'; g.fillRect(0, 0, w, h); for (let x = 0; x < w; x += 32) { g.fillStyle = '#1c130b'; g.fillRect(x, 0, 1, h) }
    for (let i = 0; i < 90; i++) { g.fillStyle = r() < 0.5 ? 'rgba(10,6,3,0.3)' : 'rgba(120,90,60,0.1)'; g.fillRect(r() * w | 0, r() * h | 0, 6 + (r() * 14 | 0), 1) }
  } },
  'barra-verde': { nome: 'Barra de bloco verde', usos: ['lambri'], tam: [1.2, 0.6], px: [64, 32], cor: '#28463a', origem: 'intro',
    pintar: bloco(3103, (v) => `rgb(${40 + v * 8 | 0},${70 + v * 10 | 0},${58 + v * 8 | 0})`, '#1e2a24') },
  // --- pisos ---
  'taco-madeira': { nome: 'Taco em espinha de peixe', usos: ['piso'], tam: [0.5, 0.5], px: [64, 64], cor: '#523419', origem: 'casa', pintar: (g, w, h) => {
    const r = rng(907), cols = ['#5e3c22', '#523419', '#6a4628', '#48301a', '#583a20']
    g.fillStyle = '#24160c'; g.fillRect(0, 0, w, h)
    for (let c = 0; c < 4; c++) for (let y = -32; y < 96; y += 8) {
      const s = c % 2 ? -1 : 1
      g.save(); g.translate(c * 16, y); g.transform(1, s, 0, 1, 0, 0)
      g.fillStyle = cols[(r() * cols.length) | 0]; g.fillRect(0.5, 0.5, 15, 7)
      g.fillStyle = 'rgba(255,225,180,0.07)'; g.fillRect(0.5, 1, 15, 1)
      g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(3 + (r() * 9 | 0), 3, 4, 1)
      g.restore()
    }
    for (let i = 0; i < 260; i++) { g.fillStyle = r() < 0.6 ? 'rgba(10,6,3,0.3)' : 'rgba(150,120,80,0.1)'; g.fillRect(r() * w | 0, r() * h | 0, 1 + (r() * 2 | 0), 1) }
    for (let i = 0; i < 5; i++) { g.fillStyle = 'rgba(120,110,95,0.12)'; const x = r() * w, y = r() * h; for (let k = 0; k < 20; k++) g.fillRect(x + (r() - 0.5) * 18 | 0, y + (r() - 0.5) * 18 | 0, 2, 2) } // o pó
  } },
  'tabua-corrida': { nome: 'Tábua corrida escura', usos: ['piso', 'teto'], tam: [0.5, 0.5], px: [64, 64], cor: '#36231a', origem: 'casa', pintar: tabua },
  'ladrilho-hidraulico': { nome: 'Ladrilho hidráulico', usos: ['piso'], tam: [0.5, 0.5], px: [64, 64], cor: '#a2927a', origem: 'casa', pintar: (g, w, h) => {
    const r = rng(901)
    for (let ty = 0; ty < 2; ty++) for (let tx = 0; tx < 2; tx++) {
      const x0 = tx * 32, y0 = ty * 32
      g.fillStyle = '#a2927a'; g.fillRect(x0, y0, 32, 32)
      g.fillStyle = '#6e3222'; losango(g, x0 + 16, y0 + 16, 13); g.fillStyle = '#a2927a'; losango(g, x0 + 16, y0 + 16, 8); g.fillStyle = '#171311'; losango(g, x0 + 16, y0 + 16, 3)
      g.fillStyle = '#171311'; for (const [cx, cy] of [[0, 0], [32, 0], [0, 32], [32, 32]]) losango(g, x0 + cx, y0 + cy, 6)
      g.fillStyle = 'rgba(28,20,14,0.55)'; g.fillRect(x0, y0, 32, 1); g.fillRect(x0, y0, 1, 32)
    }
    for (let i = 0; i < 520; i++) { g.fillStyle = r() < 0.65 ? 'rgba(18,12,8,0.2)' : 'rgba(235,225,205,0.1)'; g.fillRect(r() * w | 0, r() * h | 0, 1 + (r() * 2 | 0), 1) }
    for (let i = 0; i < 7; i++) { g.fillStyle = 'rgba(8,6,4,0.18)'; const x = r() * w, y = r() * h; for (let k = 0; k < 16; k++) g.fillRect(x + (r() - 0.5) * 16 | 0, y + (r() - 0.5) * 12 | 0, 3, 2) }
  } },
  'lajota': { nome: 'Lajota de barro', usos: ['piso'], tam: [0.5, 0.5], px: [64, 64], cor: '#5c3424', origem: 'casa', pintar: (g, w, h) => {
    const r = rng(1213); g.fillStyle = '#2a1a12'; g.fillRect(0, 0, w, h)
    for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) { const v = r(); g.fillStyle = `rgb(${92 + v * 24 | 0},${52 + v * 14 | 0},${36 + v * 8 | 0})`; g.fillRect(x * 32 + 1, y * 32 + 1, 30, 30) }
    for (let i = 0; i < 420; i++) { g.fillStyle = r() < 0.55 ? 'rgba(20,10,5,0.22)' : 'rgba(170,120,90,0.1)'; g.fillRect(r() * w | 0, r() * h | 0, 1 + (r() * 2 | 0), 1) }
  } },
  'marmore': { nome: 'Mármore branco', usos: ['piso'], tam: [1, 1], px: [32, 32], cor: '#b7b1a5', origem: 'casa', pintar: (g, w, h) => {
    const r = rng(959); g.fillStyle = '#b7b1a5'; g.fillRect(0, 0, w, h)
    for (let k = 0; k < 4; k++) { let x = r() * w; g.fillStyle = `rgba(80,76,70,${(0.25 + r() * 0.3).toFixed(2)})`; for (let y = 0; y < h; y++) { x += (r() - 0.5) * 2.4; g.fillRect((((x % w) + w) % w) | 0, y, 1, 1) } }
  } },
  'ladrilho-xadrez': { nome: 'Paviflex xadrez', usos: ['piso'], tam: [0.6, 0.6], px: [32, 32], cor: '#6a5c46', origem: 'intro', pintar: (g, w, h) => {
    const r = rng(3127); for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) { g.fillStyle = (x + y) % 2 ? '#7a6a52' : '#5a4c3a'; g.fillRect(x * 16, y * 16, 16, 16) }
    sujeira(g, w, h, r, 180, 'rgba(20,14,8,0.2)', 'rgba(230,215,190,0.06)')
    g.fillStyle = 'rgba(20,14,8,0.5)'; g.fillRect(0, 0, w, 1); g.fillRect(0, 0, 1, h); g.fillRect(0, 16, w, 1); g.fillRect(16, 0, 1, h)
  } },
  'granilite': { nome: 'Granilite', usos: ['piso'], tam: [1, 1], px: [64, 64], cor: '#8a8272', origem: 'intro', pintar: (g, w, h) => {
    const r = rng(3131); g.fillStyle = '#8a8272'; g.fillRect(0, 0, w, h)
    for (let i = 0; i < 700; i++) { const c = r(); g.fillStyle = c < 0.4 ? '#5a5448' : c < 0.7 ? '#b4ac98' : c < 0.85 ? '#3a3630' : '#a07a5a'; g.fillRect(r() * w | 0, r() * h | 0, 1 + (r() * 2 | 0), 1) }
    sujeira(g, w, h, r, 200, 'rgba(30,24,16,0.15)', 'rgba(255,250,235,0.05)')
    g.fillStyle = '#6a5630'; g.fillRect(0, 0, w, 1); g.fillRect(0, 0, 1, h)
  } },
  'concreto': { nome: 'Piso de concreto', usos: ['piso'], tam: [2, 2], px: [64, 64], cor: '#4e4d48', origem: 'intro', pintar: (g, w, h) => {
    const r = rng(3119); g.fillStyle = '#4e4d48'; g.fillRect(0, 0, w, h)
    sujeira(g, w, h, r, 900, 'rgba(18,18,16,0.2)', 'rgba(200,198,185,0.07)')
    for (let i = 0; i < 3; i++) { const cx = r() * w, cy = r() * h, rr = 4 + r() * 9, gr = g.createRadialGradient(cx, cy, 0, cx, cy, rr); gr.addColorStop(0, 'rgba(12,10,8,0.4)'); gr.addColorStop(1, 'rgba(12,10,8,0)'); g.fillStyle = gr; g.fillRect(cx - rr, cy - rr, rr * 2, rr * 2) }
    g.fillStyle = 'rgba(14,14,12,0.7)'; g.fillRect(0, 0, w, 1); g.fillRect(0, 0, 1, h)
  } },
  'chapa-xadrez': { nome: 'Chapa xadrez de aço', usos: ['piso'], tam: [1, 1], px: [64, 64], cor: '#3c3e3e', origem: 'intro', pintar: (g, w, h) => {
    const r = rng(3121); g.fillStyle = '#3c3e3e'; g.fillRect(0, 0, w, h)
    for (let y = 2; y < h; y += 8) for (let x = (y / 8 | 0) % 2 ? 6 : 2; x < w; x += 8) { g.fillStyle = (x + y) % 16 ? '#55585a' : '#4c4f50'; g.fillRect(x, y, 3, 1); g.fillRect(x + 1, y + 1, 1, 1) }
    sujeira(g, w, h, r, 500, 'rgba(10,10,8,0.22)', 'rgba(210,210,200,0.06)')
    g.fillStyle = '#1a1b1b'; g.fillRect(0, 0, w, 1); g.fillRect(0, 0, 1, h); g.fillRect(0, 32, w, 1); g.fillRect(32, 0, 1, h)
  } },
  'faixa-aviso': { nome: 'Faixa de aviso', usos: ['piso'], tam: [0.5, 0.5], px: [32, 32], cor: '#d0a020', origem: 'intro', pintar: (g, w, h) => {
    g.fillStyle = '#d0a020'; g.fillRect(0, 0, w, h); g.fillStyle = '#141210'
    for (let k = -32; k < 64; k += 16) { g.beginPath(); g.moveTo(k, 0); g.lineTo(k + 8, 0); g.lineTo(k + 8 - 32, 32); g.lineTo(k - 32, 32); g.closePath(); g.fill() }
    sujeira(g, w, h, rng(3163), 120, 'rgba(10,8,4,0.3)', 'rgba(255,240,200,0.05)')
  } },
  'carpete-vinho': { nome: 'Carpete vinho', usos: ['piso'], tam: [1, 1], px: [32, 32], cor: '#4d2427', origem: 'nova', pintar: (g, w, h) => {
    const r = rng(1303); g.fillStyle = '#4d2427'; g.fillRect(0, 0, w, h); sujeira(g, w, h, r, 300, 'rgba(20,6,8,0.25)', 'rgba(200,140,140,0.06)')
  } },
  'grama': { nome: 'Grama', usos: ['piso'], tam: [2, 2], px: [32, 32], cor: '#141a10', origem: 'casa', pintar: (g) => {
    g.fillStyle = '#141a10'; g.fillRect(0, 0, 32, 32); const r = rng(77); for (let i = 0; i < 160; i++) { g.fillStyle = r() < 0.5 ? '#0e130b' : '#202916'; g.fillRect(r() * 32 | 0, r() * 32 | 0, 1, 2) }
  } },
  'cascalho': { nome: 'Cascalho', usos: ['piso'], tam: [1, 1], px: [32, 32], cor: '#3a362f', origem: 'casa', pintar: (g) => {
    g.fillStyle = '#3a362f'; g.fillRect(0, 0, 32, 32); const r = rng(5); for (let i = 0; i < 260; i++) { g.fillStyle = r() < 0.5 ? '#2a2823' : '#504b42'; g.fillRect(r() * 32 | 0, r() * 32 | 0, 2, 1) }
  } },
  // --- tetos ---
  'gesso': { nome: 'Estuque manchado', usos: ['teto'], tam: [2, 2], px: [64, 64], cor: '#86806f', origem: 'casa', pintar: (g, w, h) => {
    const r = rng(941); g.fillStyle = '#86806f'; g.fillRect(0, 0, w, h)
    for (let i = 0; i < 400; i++) { g.fillStyle = r() < 0.5 ? 'rgba(60,55,45,0.12)' : 'rgba(255,250,235,0.06)'; g.fillRect(r() * w | 0, r() * h | 0, 2, 2) }
    for (let i = 0; i < 4; i++) { const cx = r() * w, cy = r() * h, rr = 6 + r() * 12, gr = g.createRadialGradient(cx, cy, 0, cx, cy, rr); gr.addColorStop(0, 'rgba(70,58,40,0.35)'); gr.addColorStop(0.8, 'rgba(70,58,40,0.12)'); gr.addColorStop(1, 'rgba(70,58,40,0)'); g.fillStyle = gr; g.fillRect(cx - rr, cy - rr, rr * 2, rr * 2) }
    g.strokeStyle = 'rgba(30,26,20,0.5)'; g.lineWidth = 1; for (let i = 0; i < 3; i++) { let x = r() * w, y = r() * h; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 8; k++) { x += (r() - 0.5) * 12; y += (r() - 0.3) * 8; g.lineTo(x, y) } g.stroke() }
  } },
  'forro-madeira': { nome: 'Forro de madeira', usos: ['teto'], tam: [0.5, 0.5], px: [64, 64], cor: '#36231a', origem: 'casa', pintar: tabua },
  'forro-placas': { nome: 'Forro de placas', usos: ['teto'], tam: [1.2, 1.2], px: [64, 64], cor: '#76726a', origem: 'intro', pintar: (g, w, h) => {
    const r = rng(3139); for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) { const v = 118 + (r() * 14 | 0); g.fillStyle = `rgb(${v},${v - 4},${v - 12})`; g.fillRect(x * 32 + 1, y * 32 + 1, 31, 31) }
    for (let i = 0; i < 300; i++) { g.fillStyle = 'rgba(40,36,28,0.25)'; g.fillRect(r() * w | 0, r() * h | 0, 1, 1) }
    for (let i = 0; i < 2; i++) { const cx = r() * w, cy = r() * h, rr = 6 + r() * 10, gr = g.createRadialGradient(cx, cy, 0, cx, cy, rr); gr.addColorStop(0, 'rgba(90,70,40,0.35)'); gr.addColorStop(1, 'rgba(90,70,40,0)'); g.fillStyle = gr; g.fillRect(cx - rr, cy - rr, rr * 2, rr * 2) }
    g.fillStyle = '#4a4a46'; g.fillRect(0, 0, w, 1); g.fillRect(0, 0, 1, h); g.fillRect(0, 32, w, 1); g.fillRect(32, 0, 1, h)
  } },
  'forro-escuro': { nome: 'Forro escuro', usos: ['teto'], tam: [2, 2], px: [64, 64], cor: '#34342f', origem: 'intro', pintar: (g, w, h) => {
    const r = rng(3137); g.fillStyle = '#34342f'; g.fillRect(0, 0, w, h); sujeira(g, w, h, r, 500, 'rgba(10,10,8,0.2)', 'rgba(190,190,175,0.05)'); g.fillStyle = 'rgba(8,8,6,0.6)'; g.fillRect(0, 0, w, 2)
  } },
  'forro-usina': { nome: 'Laje da usina', usos: ['teto'], tam: [4, 4], px: [64, 64], cor: '#1e1f1e', origem: 'intro', pintar: (g, w, h) => {
    const r = rng(3149); g.fillStyle = '#1e1f1e'; g.fillRect(0, 0, w, h); sujeira(g, w, h, r, 300, 'rgba(0,0,0,0.3)', 'rgba(150,150,140,0.05)')
  } },
  // --- portas (a etapa 4 usa) ---
  'porta-madeira': { nome: 'Porta de madeira', usos: ['porta'], tam: [1, 2.1], px: [32, 64], cor: '#2e1d12', origem: 'nova', pintar: (g, w, h) => {
    const r = rng(1307); g.fillStyle = '#2e1d12'; g.fillRect(0, 0, w, h); g.fillStyle = '#3d2818'; g.fillRect(4, 4, w - 8, h * 0.42); g.fillRect(4, h * 0.52, w - 8, h * 0.42)
    sujeira(g, w, h, r, 120, 'rgba(0,0,0,0.25)', 'rgba(120,90,60,0.08)')
  } },
}

/** A tábua corrida escura (0,5 m: quatro tábuas): vale para piso e forro. */
function tabua(g: G, w: number, h: number) {
  const r = rng(911)
  for (let i = 0; i < 4; i++) {
    const y = i * 16; g.fillStyle = ['#36231a', '#2e1d13', '#3b281b', '#2a1a10'][i]; g.fillRect(0, y, w, 16)
    for (let k = 0; k < 9; k++) { g.fillStyle = r() < 0.5 ? 'rgba(12,7,4,0.35)' : 'rgba(110,80,55,0.12)'; g.fillRect(r() * w | 0, y + 2 + (r() * 12 | 0), 8 + (r() * 26 | 0), 1) }
    g.fillStyle = '#120a05'; g.fillRect(0, y, w, 1); g.fillRect((r() * w) | 0, y, 1, 16)
  }
  for (let i = 0; i < 140; i++) { g.fillStyle = 'rgba(8,5,2,0.3)'; g.fillRect(r() * w | 0, r() * h | 0, 2, 1) }
}

/** As texturas que aparecem na paleta de um uso, na ordem do catálogo. */
export const texturasPara = (uso: Uso) => Object.entries(TEXTURAS).filter(([, t]) => t.usos.includes(uso)).map(([k]) => k)

export const corDe = (tex: string | undefined) => (tex && TEXTURAS[tex]?.cor) || '#ff00ff' // magenta = textura que não existe
