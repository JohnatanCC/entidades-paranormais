    // ---------- a Demo da casa: o Palacete Monteval, da varanda até a porta do berçário ----------
    // A planta é a da fatia em terceira pessoa (as duas plantas do térreo e do andar de cima), em metros: x de 0 (oeste) a 32, z de 0 (fundos) a 24 (a fachada);
    // o térreo em y 0, o andar de cima em 3,2. O salão (12 × 14 m) tem pé-direito duplo sobre o vão e a escadaria no meio, subindo da entrada para o patamar.
    // Abrem: a varanda, o salão, a sala de jantar, a copa, a cozinha e o corredor dos fundos (térreo); em cima, o patamar e as galerias, o quarto principal,
    // o quarto de vestir e o corredor dos fundos, onde fica a porta do berçário. O resto fica trancado.
    // Três Espectrais em dois encontros (jantar, patamar) e o Glutão na cozinha (opcional); na briga, as portas da sala fecham. A Mãe vem pelo corredor dos fundos de cima e entra no berçário.
    // Na porta do berçário, a tela de carregamento tira a casa de cena e traz a luta (o corredor, a cena de entrada e a Mãe).
    // A casca (paredes, pisos, forros, escada, balaústres) sai já montada: uma malha por material, com as coordenadas de textura pelo mundo.
    // =====================================================================
    const UPF = 3.2, CEIL = 3.05, TOPC = 6.2, WT = 0.16, YARD = -0.45 // o andar de cima, o forro do térreo, o forro de cima, a espessura da parede, o chão do jardim
    const HX = 32, HZ = 24, CZ = 6.4 // a casa: 32 m de frente, 24 de fundo (a fachada em z 24); os corredores dos fundos vão de z 6,4 a 10
    const MOOND = V3(0.12, -0.72, -1).normalize() // o luar entra pela frente, descendo (e um pouco para leste)
    const CA = { built: false, g: null, cols: [], doors: [], encs: [], foes: [], kits: [], cps: {}, glows: [], segs: [], room: '', roomT: 0, cp: 'varanda', inside: null, show: null, near: null, tgt: V3(),
      spotRoom: '', spotK: 0, spotWant: null, bubT: 3, begun: false, yardT: 0, objT: 0, music: 'amb', beamK: { value: 0.9 }, beamT: { value: 0 }, swing: [], curtains: [], flames: [], dust: null, mae: null }
    const _qv = V3(), _qv2 = V3(), _qv3 = V3()

    // ---------- os cômodos (a planta da fatia) ----------
    const ROOMS = [ // id, nome, andar (0 térreo, 1 em cima), x0, z0, x1, z1, abre?, papel de parede, lambri (true = madeira; ou o material da barra), altura da barra
      ['biblioteca', 'Biblioteca', 0, 0, 0, 9, 14], ['estar', 'Sala de estar', 0, 0, 14, 9, 24], ['servico', 'Escada de serviço', 0, 9, 0, 13, CZ], ['criados', 'Sala dos criados', 0, 13, 0, 21, CZ],
      ['corrF', 'Corredor dos fundos', 0, 9, CZ, 21, 10, 1, 'pedra', 1], ['salao', 'Salão', 0, 9, 10, 21, 24, 1, 'pedra', 1],
      ['cozinha', 'Cozinha', 0, 21, 0, HX, 10, 1, 'pedra', 'azul', 1.5], ['copa', 'Copa', 0, 21, 10, HX, 14, 1, 'pedra', 'azul', 1.5], ['jantar', 'Sala de jantar', 0, 21, 14, HX, HZ, 1, 'vinho', 1],
      ['varanda', 'Varanda', 0, 11.9, HZ, 18.1, 25.8, 1, null, 0],
      ['banheiro', 'Banheiro', 1, 0, 0, 9, CZ], ['servico2', 'Escada de serviço', 1, 9, 0, 13, CZ], ['rouparia', 'Rouparia', 1, 13, 0, 21, CZ], ['garota', 'Ala da Garota', 1, 21, 0, HX, CZ],
      ['corrF2', 'Corredor dos fundos', 1, 0, CZ, HX, 10, 1, 'pedra', 1], ['vestir', 'Quarto de vestir', 1, 0, 10, 9, 14, 1, 'floral', 1], ['principal', 'Quarto principal', 1, 0, 14, 9, HZ, 1, 'floral', 1],
      ['patamar', 'Patamar', 1, 9, 10, 21, 13.1, 1, 'pedra', 1], ['galO', 'Galeria oeste', 1, 9, 13.1, 12, HZ, 1, 'pedra', 1], ['galL', 'Galeria leste', 1, 18, 13.1, 21, HZ, 1, 'pedra', 1],
      ['galS', 'Galeria da frente', 1, 12, 21.1, 18, HZ, 1, 'pedra', 1], ['vao', 'Galerias', 1, 12, 13.1, 18, 21.1, 1, 'pedra', 0], ['bercario', 'Berçário', 1, 21, 10, HX, HZ],
    ].map(([id, name, lv, x0, z0, x1, z1, open, wall, wain, wh]) => ({ id, name, lv, x0, z0, x1, z1, open: !!open, wall: wall || null, wain: wain ? (wain === true || wain === 1 ? 'lambri' : wain) : null, wh: wh || 1.0 }))
    function roomAt(lv, x, z) { for (const r of ROOMS) if (r.lv === lv && x >= r.x0 && x < r.x1 && z >= r.z0 && z < r.z1) return r; return null }
    const wallKey = (r) => (!r || r.id === 'varanda' ? 'fachada' : r.open ? r.wall : null) // a face da parede vista de cada lado (cômodo fechado: nem desenha)

    // ---------- as texturas (a 64 ou 128 pixels por metro, como o resto) ----------
    function hDamask(seed, base, dark, light) { // o papel adamascado (0,5 × 1 m): o medalhão florido, desbotado, com a umidade descendo do forro
      return canvasTex(32, 64, (g, w, h) => {
        const r = rng(seed); g.fillStyle = base; g.fillRect(0, 0, w, h)
        const med = (cx, cy) => {
          g.fillStyle = dark; for (let y = -13; y <= 13; y++) { const ww = Math.max(1, Math.round((13 - Math.abs(y)) * 0.62 + 1.6 * Math.sin(Math.abs(y) * 0.95))); g.fillRect(cx - ww, cy + y, ww * 2, 1) }
          g.fillStyle = base; for (let y = -7; y <= 7; y++) { const ww = Math.round((7 - Math.abs(y)) * 0.45); if (ww > 0) g.fillRect(cx - ww, cy + y, ww * 2, 1) }
          g.fillStyle = light; g.fillRect(cx - 1, cy - 10, 2, 20); g.fillRect(cx - 5, cy - 1, 10, 2); g.fillRect(cx - 3, cy - 13, 6, 2); g.fillRect(cx - 3, cy + 11, 6, 2)
        }
        med(16, 16); med(0, 48); med(32, 48)
        g.fillStyle = 'rgba(0,0,0,0.14)'; g.fillRect(0, 0, 1, h) // a emenda do rolo
        for (let i = 0; i < 260; i++) { g.fillStyle = r() < 0.55 ? 'rgba(0,0,0,0.14)' : 'rgba(255,240,220,0.05)'; g.fillRect(r() * w | 0, r() * h | 0, 1, 1 + (r() * 3 | 0)) }
        const gr = g.createLinearGradient(0, 0, 0, h * 0.55); gr.addColorStop(0, 'rgba(36,26,12,0.32)'); gr.addColorStop(1, 'rgba(36,26,12,0)'); g.fillStyle = gr; g.fillRect(r() * w * 0.6, 0, 9, h * 0.55)
      })
    }
    function hPortraitTex(seed, kind) { // um retrato a óleo escurecido; o do pai tem o rosto riscado
      return canvasTex(32, 40, (g, w, h) => {
        const r = rng(seed), gr = g.createRadialGradient(w / 2, h * 0.38, 2, w / 2, h * 0.4, 24); gr.addColorStop(0, '#4a3a26'); gr.addColorStop(1, '#120e09'); g.fillStyle = gr; g.fillRect(0, 0, w, h)
        const dama = kind === 'dama' || kind === 'menina'
        g.fillStyle = dama ? '#2c1a1e' : '#110f10'; g.beginPath(); g.moveTo(3, h); g.quadraticCurveTo(w / 2, h * 0.46, w - 3, h); g.fill()
        if (kind === 'menina') { g.fillStyle = '#c8bca4'; g.fillRect(w / 2 - 6, h * 0.66, 12, 3) }
        const fs = kind === 'menina' ? 0.8 : 1
        g.fillStyle = '#86694f'; g.beginPath(); g.ellipse(w / 2, h * 0.37, 5.4 * fs, 7 * fs, 0, 0, 7); g.fill()
        g.fillStyle = '#1a120c'; g.beginPath(); g.ellipse(w / 2, h * 0.28, 6.2 * fs, 3.6 * fs, 0, Math.PI, 0); g.fill()
        if (dama) { g.fillRect(w / 2 - 7 * fs, h * 0.28, 2.2, 10 * fs); g.fillRect(w / 2 + 4.8 * fs, h * 0.28, 2.2, 10 * fs) }
        g.fillStyle = '#20150e'; g.fillRect(w / 2 - 3, h * 0.35, 2, 1); g.fillRect(w / 2 + 1, h * 0.35, 2, 1)
        if (kind === 'pai') { g.strokeStyle = 'rgba(205,195,172,0.9)'; g.lineWidth = 1; for (let i = 0; i < 11; i++) { g.beginPath(); g.moveTo(w / 2 - 7 + r() * 14, h * 0.24 + r() * 5); g.lineTo(w / 2 - 7 + r() * 14, h * 0.44 + r() * 5); g.stroke() } }
        for (let i = 0; i < 140; i++) { g.fillStyle = r() < 0.7 ? 'rgba(0,0,0,0.28)' : 'rgba(200,170,120,0.07)'; g.fillRect(r() * w | 0, r() * h | 0, 1, 1) } // o craquelê
      })
    }
    const HT = {
      lad: canvasTex(64, 64, (g, w, h) => { // o ladrilho hidráulico (creme, terracota e preto, gasto): 0,5 m, quatro peças de 25 cm
        const r = rng(901), dia = (cx, cy, s) => { g.beginPath(); g.moveTo(cx, cy - s); g.lineTo(cx + s, cy); g.lineTo(cx, cy + s); g.lineTo(cx - s, cy); g.closePath(); g.fill() }
        for (let ty = 0; ty < 2; ty++) for (let tx = 0; tx < 2; tx++) {
          const x0 = tx * 32, y0 = ty * 32
          g.fillStyle = '#a2927a'; g.fillRect(x0, y0, 32, 32)
          g.fillStyle = '#6e3222'; dia(x0 + 16, y0 + 16, 13); g.fillStyle = '#a2927a'; dia(x0 + 16, y0 + 16, 8); g.fillStyle = '#171311'; dia(x0 + 16, y0 + 16, 3)
          g.fillStyle = '#171311'; for (const [cx, cy] of [[0, 0], [32, 0], [0, 32], [32, 32]]) dia(x0 + cx, y0 + cy, 6)
          g.fillStyle = 'rgba(28,20,14,0.55)'; g.fillRect(x0, y0, 32, 1); g.fillRect(x0, y0, 1, 32)
        }
        for (let i = 0; i < 520; i++) { g.fillStyle = r() < 0.65 ? 'rgba(18,12,8,0.2)' : 'rgba(235,225,205,0.1)'; g.fillRect(r() * w | 0, r() * h | 0, 1 + (r() * 2 | 0), 1) }
        for (let i = 0; i < 7; i++) { g.fillStyle = 'rgba(8,6,4,0.18)'; const x = r() * w, y = r() * h; for (let k = 0; k < 16; k++) g.fillRect(x + (r() - 0.5) * 16 | 0, y + (r() - 0.5) * 12 | 0, 3, 2) }
      }),
      par: canvasTex(64, 64, (g, w, h) => { // o parquet em espinha de peixe (0,5 m)
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
      }),
      tab: canvasTex(64, 64, (g, w, h) => { // a tábua corrida escura (0,5 m: quatro tábuas)
        const r = rng(911)
        for (let i = 0; i < 4; i++) {
          const y = i * 16; g.fillStyle = ['#36231a', '#2e1d13', '#3b281b', '#2a1a10'][i]; g.fillRect(0, y, w, 16)
          for (let k = 0; k < 9; k++) { g.fillStyle = r() < 0.5 ? 'rgba(12,7,4,0.35)' : 'rgba(110,80,55,0.12)'; g.fillRect(r() * w | 0, y + 2 + (r() * 12 | 0), 8 + (r() * 26 | 0), 1) }
          g.fillStyle = '#120a05'; g.fillRect(0, y, w, 1); g.fillRect((r() * w) | 0, y, 1, 16)
        }
        for (let i = 0; i < 140; i++) { g.fillStyle = 'rgba(8,5,2,0.3)'; g.fillRect(r() * w | 0, r() * h | 0, 2, 1) }
      }),
      ped: canvasTex(64, 64, (g, w, h) => { // o reboco cinza riscado imitando pedra (1 m: blocos de 50 × 25 cm)
        const r = rng(919); g.fillStyle = '#6c685f'; g.fillRect(0, 0, w, h)
        for (let i = 0; i < 4; i++) { const y = i * 16, off = i % 2 ? 16 : 0; for (let x = -off; x < w; x += 32) { const v = 100 + (r() * 18 | 0); g.fillStyle = `rgb(${v},${v - 4},${v - 11})`; g.fillRect(x + 1, y + 1, 31, 15) } }
        g.fillStyle = 'rgba(28,26,22,0.7)'; for (let i = 0; i < 4; i++) { g.fillRect(0, i * 16, w, 1); const off = i % 2 ? 16 : 0; for (let x = off; x < w; x += 32) g.fillRect(x, i * 16, 1, 16) }
        for (let i = 0; i < 380; i++) { g.fillStyle = r() < 0.55 ? 'rgba(20,18,15,0.18)' : 'rgba(200,195,180,0.08)'; g.fillRect(r() * w | 0, r() * h | 0, 1, 1 + (r() * 2 | 0)) }
        for (let i = 0; i < 12; i++) { g.fillStyle = 'rgba(30,26,20,0.12)'; const x = r() * w | 0; g.fillRect(x, 0, 1 + (r() * 2 | 0), 8 + r() * 40 | 0) } // os escorridos
      }),
      lam: canvasTex(64, 64, (g, w, h) => { // o lambri de madeira escura (0,8 × 1 m: dois painéis almofadados)
        const r = rng(921); g.fillStyle = '#21140b'; g.fillRect(0, 0, w, h)
        for (const x0 of [0, 32]) {
          g.fillStyle = '#2b1a0f'; g.fillRect(x0 + 4, 8, 24, 48)
          g.fillStyle = '#3a2516'; g.fillRect(x0 + 4, 8, 24, 2); g.fillRect(x0 + 4, 8, 2, 48)
          g.fillStyle = '#120a05'; g.fillRect(x0 + 4, 54, 24, 2); g.fillRect(x0 + 26, 8, 2, 48)
          g.fillStyle = '#100904'; g.fillRect(x0, 0, 1, h)
        }
        g.fillStyle = '#100904'; g.fillRect(0, 0, w, 2); g.fillRect(0, 62, w, 2)
        for (let i = 0; i < 200; i++) { g.fillStyle = r() < 0.5 ? 'rgba(0,0,0,0.25)' : 'rgba(120,90,60,0.08)'; g.fillRect(r() * w | 0, r() * h | 0, 1, 2 + (r() * 4 | 0)) }
      }),
      damV: hDamask(923, '#2f4130', '#202e20', '#56664a'), damW: hDamask(929, '#45191c', '#2e0f12', '#74383a'),
      flo: canvasTex(32, 32, (g, w, h) => { // o papel floral desbotado (verde): raminhos miúdos
        const r = rng(937); g.fillStyle = '#4c5642'; g.fillRect(0, 0, w, h)
        const fl = (x, y, c) => { g.fillStyle = c; g.fillRect(x - 1, y - 2, 2, 4); g.fillRect(x - 2, y - 1, 4, 2); g.fillStyle = '#b09a78'; g.fillRect(x, y, 1, 1); g.fillStyle = '#34402c'; g.fillRect(x + 2, y + 2, 3, 1); g.fillRect(x + 4, y + 1, 1, 1) }
        fl(6, 7, '#7e6a60'); fl(22, 22, '#7a6058'); fl(22, 6, '#6e6a58'); fl(7, 23, '#6e6a58'); fl(14, 15, '#806452')
        for (let i = 0; i < 160; i++) { g.fillStyle = r() < 0.55 ? 'rgba(0,0,0,0.13)' : 'rgba(255,245,225,0.05)'; g.fillRect(r() * w | 0, r() * h | 0, 1, 2) }
      }),
      est: canvasTex(64, 64, (g, w, h) => { // o estuque do forro, manchado de umidade e rachado
        const r = rng(941); g.fillStyle = '#86806f'; g.fillRect(0, 0, w, h)
        for (let i = 0; i < 400; i++) { g.fillStyle = r() < 0.5 ? 'rgba(60,55,45,0.12)' : 'rgba(255,250,235,0.06)'; g.fillRect(r() * w | 0, r() * h | 0, 2, 2) }
        for (let i = 0; i < 4; i++) { const cx = r() * w, cy = r() * h, rr = 6 + r() * 12, gr = g.createRadialGradient(cx, cy, 0, cx, cy, rr); gr.addColorStop(0, 'rgba(70,58,40,0.35)'); gr.addColorStop(0.8, 'rgba(70,58,40,0.12)'); gr.addColorStop(1, 'rgba(70,58,40,0)'); g.fillStyle = gr; g.fillRect(cx - rr, cy - rr, rr * 2, rr * 2) }
        g.strokeStyle = 'rgba(30,26,20,0.5)'; g.lineWidth = 1; for (let i = 0; i < 3; i++) { let x = r() * w, y = r() * h; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 8; k++) { x += (r() - 0.5) * 12; y += (r() - 0.3) * 8; g.lineTo(x, y) } g.stroke() }
      }),
      fac: canvasTex(64, 64, (g, w, h) => { // a fachada: reboco ocre desbotado, escorrido de chuva
        const r = rng(947); g.fillStyle = '#7a6a4e'; g.fillRect(0, 0, w, h)
        for (let i = 0; i < 500; i++) { g.fillStyle = r() < 0.5 ? 'rgba(40,32,22,0.14)' : 'rgba(200,185,150,0.08)'; g.fillRect(r() * w | 0, r() * h | 0, 2, 1) }
        for (let i = 0; i < 16; i++) { g.fillStyle = 'rgba(30,26,18,0.16)'; const x = r() * w | 0; g.fillRect(x, 0, 1 + (r() * 3 | 0), 10 + r() * 54 | 0) }
      }),
      len: canvasTex(32, 32, (g, w, h) => { // o lençol de poeira: cinza claro, com dobras
        const r = rng(953); g.fillStyle = '#8f8b80'; g.fillRect(0, 0, w, h)
        for (let i = 0; i < 7; i++) { const x = r() * w | 0; g.fillStyle = 'rgba(50,46,38,0.22)'; g.fillRect(x, 0, 2, h); g.fillStyle = 'rgba(255,255,245,0.08)'; g.fillRect(x + 2, 0, 1, h) }
        for (let i = 0; i < 160; i++) { g.fillStyle = 'rgba(60,55,45,0.15)'; g.fillRect(r() * w | 0, r() * h | 0, 1, 1) }
      }),
      mar: canvasTex(32, 32, (g, w, h) => { // o mármore branco com veios
        const r = rng(959); g.fillStyle = '#b7b1a5'; g.fillRect(0, 0, w, h)
        for (let k = 0; k < 4; k++) { let x = r() * w; g.fillStyle = `rgba(80,76,70,${(0.25 + r() * 0.3).toFixed(2)})`; for (let y = 0; y < h; y++) { x += (r() - 0.5) * 2.4; g.fillRect((((x % w) + w) % w) | 0, y, 1, 1) } }
      }),
      tap: canvasTex(64, 96, (g, w, h) => { // o tapete persa desbotado (o desenho inteiro em cada tapete)
        const r = rng(967); g.fillStyle = '#3a1618'; g.fillRect(0, 0, w, h)
        g.fillStyle = '#1c2230'; g.fillRect(4, 4, w - 8, h - 8); g.fillStyle = '#3a1618'; g.fillRect(8, 8, w - 16, h - 16)
        g.fillStyle = '#6a5a40'; for (let y = 6; y < h - 6; y += 6) { g.fillRect(5, y, 2, 2); g.fillRect(w - 7, y, 2, 2) } for (let x = 6; x < w - 6; x += 6) { g.fillRect(x, 5, 2, 2); g.fillRect(x, h - 7, 2, 2) }
        const md = (cx, cy, s, c) => { g.fillStyle = c; g.beginPath(); g.moveTo(cx, cy - s); g.lineTo(cx + s * 0.7, cy); g.lineTo(cx, cy + s); g.lineTo(cx - s * 0.7, cy); g.closePath(); g.fill() }
        md(w / 2, h / 2, 30, '#1c2230'); md(w / 2, h / 2, 22, '#5a4632'); md(w / 2, h / 2, 14, '#3a1618'); md(w / 2, h / 2, 5, '#6a5a40')
        for (const [x, y] of [[14, 16], [w - 14, 16], [14, h - 16], [w - 14, h - 16]]) md(x, y, 6, '#5a4632')
        for (let i = 0; i < 900; i++) { g.fillStyle = r() < 0.6 ? 'rgba(0,0,0,0.22)' : 'rgba(180,160,130,0.08)'; g.fillRect(r() * w | 0, r() * h | 0, 1, 1) }
      }),
      tel: canvasTex(32, 32, (g, w, h) => { const r = rng(971); g.fillStyle = '#2e1c14'; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 8) for (let x = (y / 8) % 2 ? 4 : 0; x < w + 4; x += 8) { g.fillStyle = r() < 0.5 ? '#43281b' : '#3a2217'; g.fillRect(x, y, 7, 7); g.fillStyle = '#170d08'; g.fillRect(x, y + 6, 7, 1) } }),
      gra: canvasTex(32, 32, (g) => { g.fillStyle = '#141a10'; g.fillRect(0, 0, 32, 32); const r = rng(77); for (let i = 0; i < 160; i++) { g.fillStyle = r() < 0.5 ? '#0e130b' : '#202916'; g.fillRect(r() * 32 | 0, r() * 32 | 0, 1, 2) } }),
      cas: canvasTex(32, 32, (g) => { g.fillStyle = '#3a362f'; g.fillRect(0, 0, 32, 32); const r = rng(5); for (let i = 0; i < 260; i++) { g.fillStyle = r() < 0.5 ? '#2a2823' : '#504b42'; g.fillRect(r() * 32 | 0, r() * 32 | 0, 2, 1) } }),
      teia: canvasTex(32, 32, (g, w, h) => { // a teia de aranha nos cantos
        g.clearRect(0, 0, w, h); g.strokeStyle = 'rgba(225,225,215,0.75)'; g.lineWidth = 1
        for (let i = 0; i < 7; i++) { const a = i / 6 * Math.PI / 2; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a) * 32, Math.sin(a) * 32); g.stroke() }
        for (let k = 1; k < 6; k++) { g.beginPath(); for (let i = 0; i <= 6; i++) { const a = i / 6 * Math.PI / 2, rr = k * 5.5 + Math.sin(i * 2 + k) * 1.2; i ? g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : g.moveTo(Math.cos(a) * rr, Math.sin(a) * rr) } g.stroke() }
      }),
      cor: canvasTex(32, 64, (g, w, h) => { // a cortina de veludo rasgada (branca: a cor vem do material); a barra de baixo esfarrapada
        const r = rng(977); g.clearRect(0, 0, w, h)
        for (let x = 0; x < w; x++) { const v = 150 + 70 * Math.sin(x * 0.9) * Math.sin(x * 0.23 + 1), end = h - 2 - (r() < 0.35 ? 4 + (r() * 16 | 0) : r() * 4 | 0); g.fillStyle = `rgb(${v | 0},${v | 0},${v | 0})`; g.fillRect(x, 0, 1, end) }
        for (let i = 0; i < 3; i++) { const x = 3 + (r() * (w - 8) | 0), y = 18 + (r() * 30 | 0); g.clearRect(x, y, 2 + (r() * 3 | 0), 3 + (r() * 6 | 0)) } // os rasgos
      }),
      hera: canvasTex(32, 64, (g, w, h) => { // a hera entrando pela janela
        const r = rng(983); g.clearRect(0, 0, w, h); g.strokeStyle = '#2a2414'; g.lineWidth = 1
        for (let k = 0; k < 3; k++) { let x = 6 + r() * 20, y = h; g.beginPath(); g.moveTo(x, y); while (y > 2) { x += (r() - 0.5) * 5; y -= 3 + r() * 3; g.lineTo(x, y); if (r() < 0.6) { const c = ['#1e2c16', '#2a3a1c', '#16200f', '#33401e'][r() * 4 | 0]; g.fillStyle = c; g.fillRect(x + (r() < 0.5 ? -4 : 1), y - 2, 3 + (r() * 2 | 0), 3) } } g.stroke() }
      }),
      carta: canvasTex(16, 12, (g, w, h) => { g.fillStyle = '#b5aa8e'; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(40,30,20,0.6)'; for (let y = 3; y < h - 2; y += 2) g.fillRect(2, y, 4 + (y * 7) % 9, 1); g.fillStyle = 'rgba(0,0,0,0.2)'; g.fillRect(0, h - 1, w, 1) }),
      chama: canvasTex(16, 32, (g, w, h) => { const gr = g.createRadialGradient(8, 22, 1, 8, 20, 12); gr.addColorStop(0, 'rgba(255,250,230,1)'); gr.addColorStop(0.35, 'rgba(255,200,110,0.9)'); gr.addColorStop(1, 'rgba(255,120,40,0)'); g.fillStyle = gr; g.beginPath(); g.moveTo(8, 1); g.quadraticCurveTo(15, 18, 8, 31); g.quadraticCurveTo(1, 18, 8, 1); g.fill() }),
      azu: canvasTex(64, 64, (g, w, h) => { // o azulejo branco e azul (0,5 m: quatro peças de 12,5 cm por lado), encardido e com falhas
        const r = rng(1201); g.fillStyle = '#c9c6bb'; g.fillRect(0, 0, w, h)
        for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) {
          const X = x * 16, Y = y * 16, v = 196 + (r() * 22 | 0); g.fillStyle = `rgb(${v},${v - 3},${v - 12})`; g.fillRect(X + 1, Y + 1, 15, 15)
          g.fillStyle = r() < 0.5 ? '#34548a' : '#2c4778'; g.fillRect(X + 7, Y + 3, 3, 11); g.fillRect(X + 3, Y + 7, 11, 3); g.fillRect(X + 2, Y + 2, 2, 2); g.fillRect(X + 13, Y + 2, 2, 2); g.fillRect(X + 2, Y + 13, 2, 2); g.fillRect(X + 13, Y + 13, 2, 2)
          if (r() < 0.12) { g.fillStyle = '#6b6457'; g.fillRect(X + 1 + (r() * 9 | 0), Y + 1 + (r() * 9 | 0), 4 + (r() * 5 | 0), 3 + (r() * 4 | 0)) } // a peça lascada
        }
        g.fillStyle = 'rgba(60,54,44,0.55)'; for (let i = 0; i <= 4; i++) { g.fillRect(i * 16, 0, 1, h); g.fillRect(0, i * 16, w, 1) }
        for (let i = 0; i < 260; i++) { g.fillStyle = r() < 0.6 ? 'rgba(60,50,30,0.16)' : 'rgba(255,255,255,0.06)'; g.fillRect(r() * w | 0, r() * h | 0, 1, 1 + (r() * 3 | 0)) }
      }),
      laj: canvasTex(64, 64, (g, w, h) => { // a lajota de barro (0,5 m: quatro de 25 cm), gasta no meio
        const r = rng(1213); g.fillStyle = '#2a1a12'; g.fillRect(0, 0, w, h)
        for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) { const v = r(); g.fillStyle = `rgb(${92 + v * 24 | 0},${52 + v * 14 | 0},${36 + v * 8 | 0})`; g.fillRect(x * 32 + 1, y * 32 + 1, 30, 30) }
        for (let i = 0; i < 420; i++) { g.fillStyle = r() < 0.55 ? 'rgba(20,10,5,0.22)' : 'rgba(170,120,90,0.1)'; g.fillRect(r() * w | 0, r() * h | 0, 1 + (r() * 2 | 0), 1) }
      }),
      lua: canvasTex(64, 64, (g, w, h) => { const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.22, 'rgba(235,240,255,1)'); gr.addColorStop(0.26, 'rgba(160,180,220,0.45)'); gr.addColorStop(0.6, 'rgba(90,110,160,0.12)'); gr.addColorStop(1, 'rgba(60,80,130,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(180,190,210,0.5)'; g.beginPath(); g.arc(27, 29, 3, 0, 7); g.fill(); g.beginPath(); g.arc(36, 36, 2, 0, 7); g.fill() }),
    }
    for (const k of ['teia', 'cor', 'hera', 'chama', 'lua']) { HT[k].generateMipmaps = false; HT[k].minFilter = THREE.LinearFilter; HT[k].magFilter = k === 'cor' || k === 'hera' ? THREE.NearestFilter : THREE.LinearFilter }
    HT.lua.encoding = THREE.LinearEncoding

    // ---------- os materiais: os da casca (paredes, pisos, forros) e os dos móveis ----------
    const HM = {
      ladrilho: std({ map: HT.lad }), parquet: std({ map: HT.par }), tabua: std({ map: HT.tab }), pedra: std({ map: HT.ped }), verde: std({ map: HT.damV }), vinho: std({ map: HT.damW }),
      floral: std({ map: HT.flo }), lambri: std({ map: HT.lam }), estuque: std({ map: HT.est }), estuqueS: std({ color: '#706a5e' }), fachada: std({ map: HT.fac }), fachadaB: std({ color: '#35302a' }),
      madeira: std({ color: '#3a2618' }), madeiraE: std({ color: '#1e130b' }), madeiraC: std({ color: '#4a3524' }), vidro: basic({ color: '#2e3f56' }),
      telha: std({ map: HT.tel }), grama: std({ map: HT.gra }), cascalho: std({ map: HT.cas }), azul: std({ map: HT.azu }), lajota: std({ map: HT.laj }), degrau: std({ color: '#30221a' }), passadeira: std({ color: '#461818' }), balaust: std({ color: '#291b11' }),
    }
    const TILE = { azul: [0.5, 0.5], lajota: [0.5, 0.5], ladrilho: [0.5, 0.5], parquet: [0.5, 0.5], tabua: [0.5, 0.5], pedra: [1, 1], verde: [0.5, 1], vinho: [0.5, 1], floral: [0.5, 0.5], lambri: [0.8, 1], estuque: [2, 2], fachada: [1.5, 1.5], telha: [0.5, 0.5], grama: [2, 2], cascalho: [1, 1] }
    const NOCAST = new Set(['vidro', 'grama', 'cascalho', 'telha', 'estuque', 'passadeira']), PROPK = new Set(['balaust', 'degrau', 'madeira', 'madeiraE', 'madeiraC', 'passadeira'])
    const FM = {
      wood: M2.wood, dark: M2.dark, light: M2.light, metal: M2.metal,
      door: std({ color: '#2e1d12' }), doorL: std({ color: '#3d2818' }), paint: std({ color: '#5a564c' }), paintL: std({ color: '#6a655a' }),
      sheet: std({ map: HT.len }), marble: std({ map: HT.mar }), soot: std({ color: '#0d0b0a' }), ash: std({ color: '#2e2b28' }),
      velW: std({ color: '#3a1517' }), velG: std({ color: '#1d2e22' }), brass: std({ color: '#6a5630' }), iron: std({ color: '#222224' }),
      cloth: std({ color: '#0b0a0a' }), wax: std({ color: '#cbc1a4' }), plate: std({ color: '#948f84' }), paper: std({ color: '#b0a68c' }),
      linen: std({ color: '#77736a' }), gold: std({ color: '#5a4624' }), rug: std({ map: HT.tap }), glass: basic({ color: '#26364a' }),
      mirror: basic({ color: '#0e1418' }), ember: basic({ color: '#ff6a2a' }), crystal: basic({ color: '#56606c' }),
      dry: std({ color: '#4a3a24' }), pot: std({ color: '#5a3424' }), bark: std({ color: '#3e3a32' }), frond: std({ color: '#121810', side: THREE.DoubleSide }),
      web: new THREE.MeshBasicMaterial({ map: HT.teia, transparent: true, opacity: 0.5, depthWrite: false, side: THREE.DoubleSide }),
      curtW: std({ map: HT.cor, color: '#5a2224', alphaTest: 0.5, side: THREE.DoubleSide }), curtG: std({ map: HT.cor, color: '#2a3e30', alphaTest: 0.5, side: THREE.DoubleSide }),
      ivy: std({ map: HT.hera, alphaTest: 0.5, side: THREE.DoubleSide }), letter: std({ map: HT.carta, side: THREE.DoubleSide }),
      chimney: new THREE.MeshBasicMaterial({ color: new THREE.Color('#c8d0c0').convertSRGBToLinear(), transparent: true, opacity: 0.22, depthWrite: false }),
      lumo: new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffbe70').convertSRGBToLinear(), transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false }),
    }
    const flameMat = new THREE.SpriteMaterial({ map: HT.chama, color: new THREE.Color('#ffd08a').convertSRGBToLinear(), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true })
    const lampHalo = new THREE.SpriteMaterial({ map: haloTex, color: new THREE.Color('#ffb466').convertSRGBToLinear(), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.5 })
    const bxg = (w, h, d) => new THREE.BoxGeometry(w, h, d)
    const cyg = (r0, r1, h, n = 10) => new THREE.CylinderGeometry(r0, r1, h, n)
    function fp(par, geo, mat, x, y, z, rx, ry, rz, cast = true) { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); if (rx || ry || rz) m.rotation.set(rx || 0, ry || 0, rz || 0); m.castShadow = cast; m.receiveShadow = true; par.add(m); return m }
    function hGrp(x, y, z, ry = 0, par) { const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; (par || CA.g).add(g); return g }
    function hCol(x, z, hx, hz, yaw, y0, y1, o) { const c = Object.assign({ x, z, hx, hz, yaw: yaw || 0, y0, y1 }, o || {}); CA.cols.push(c); return c }

    // ---------- a casca: as faces vão para listas por material e viram uma malha cada no fim ----------
    const SHL = new Map()
    function hFace(key, P0, P1, P2, P3, N, vOff = 0) { // quatro cantos em volta (qualquer sentido); a face vira para N; textura pelo mundo (TILE)
      let L = SHL.get(key); if (!L) SHL.set(key, (L = { p: [], n: [], u: [] }))
      const t = TILE[key] || [1, 1]
      const ax = P1[0] - P0[0], ay = P1[1] - P0[1], az = P1[2] - P0[2], bx = P2[0] - P0[0], by = P2[1] - P0[1], bz = P2[2] - P0[2]
      const cx = ay * bz - az * by, cy = az * bx - ax * bz, cz = ax * by - ay * bx
      const Q = cx * N[0] + cy * N[1] + cz * N[2] < 0 ? [P0, P3, P2, P1] : [P0, P1, P2, P3]
      const top = Math.abs(N[1]) > 0.5, side = Math.abs(N[0]) > 0.5
      for (const i of [0, 1, 2, 0, 2, 3]) { const p = Q[i]; L.p.push(p[0], p[1], p[2]); L.n.push(N[0], N[1], N[2]); L.u.push(top ? p[0] / t[0] : side ? p[2] / t[0] : p[0] / t[0], top ? p[2] / t[1] : (p[1] - vOff) / t[1]) }
    }
    function hBox(key, x0, y0, z0, x1, y1, z1, skip) { // uma caixa alinhada (skip: os lados que não aparecem: 'nx','px','ny','py','nz','pz')
      const F = [['px', [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1], [1, 0, 0]], ['nx', [x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], [-1, 0, 0]],
        ['py', [x0, y1, z0], [x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [0, 1, 0]], ['ny', [x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], [0, -1, 0]],
        ['pz', [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], [0, 0, 1]], ['nz', [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [x1, y0, z0], [0, 0, -1]]]
      for (const [k, a, b, c, d, n] of F) if (!skip || !skip.includes(k)) hFace(key, a, b, c, d, n)
    }
    function shBuild() {
      SHL.forEach((L, key) => {
        const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(L.p, 3)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(L.n, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(L.u, 2)); geo.computeBoundingSphere()
        const m = new THREE.Mesh(geo, HM[key]); m.castShadow = !NOCAST.has(key); m.receiveShadow = true; m.userData.noBake = true; m.userData.env = !PROPK.has(key); m.name = 'casa:' + key; CA.g.add(m)
      })
      SHL.clear()
    }

    // ---------- as paredes: saem da planta (onde dois cômodos se encontram, ou um cômodo e o lado de fora) ----------
    function needWall(a, b) {
      if (a === b || (!a && !b)) return false
      const ia = a ? a.id : '', ib = b ? b.id : ''
      if ((ia === 'varanda' && !b) || (ib === 'varanda' && !a)) return false
      const HALL = ['patamar', 'galO', 'galL', 'galS', 'vao'] // o patamar, as galerias e o vão sobre o salão são um espaço só (balaustrada, não parede)
      if (HALL.includes(ia) && HALL.includes(ib)) return false
      return true
    }
    function wallSegs(lv) {
      const out = []
      const run = (ax, c, n, at) => { // percorre a linha em células de 10 cm; at(k) devolve [cômodo do lado −, cômodo do lado +]
        let cur = null, pk = null
        for (let k = 0; k <= n; k++) {
          let key = null, ab = null
          if (k < n) { ab = at(k); if (needWall(ab[0], ab[1])) key = (ab[0] ? ab[0].id : '-') + '|' + (ab[1] ? ab[1].id : '-') }
          if (cur && key === cur.key) { cur.a1 = (k + 1) / 10; pk = key; continue }
          if (cur) { cur.contB = key !== null; out.push(cur); cur = null }
          if (key) cur = { lv, ax, c, a0: k / 10, a1: (k + 1) / 10, neg: ab[0], pos: ab[1], key, holes: [], contA: pk !== null, contB: false }
          pk = key
        }
      }
      const xs = [...new Set(ROOMS.flatMap((r) => [r.x0, r.x1]))], zs = [...new Set(ROOMS.flatMap((r) => [r.z0, r.z1]))]
      for (const x of xs) run('z', x, 260, (k) => { const z = k / 10 + 0.05; return [roomAt(lv, x - 0.05, z), roomAt(lv, x + 0.05, z)] })
      for (const z of zs) run('x', z, HX * 10, (k) => { const x = k / 10 + 0.05; return [roomAt(lv, x, z - 0.05), roomAt(lv, x, z + 0.05)] })
      return out
    }
    // as portas (de verdade: abrem, emperram, trancam) e as janelas. into: para que lado (ao longo da normal da parede) a folha abre
    const HDOORS = [
      { id: 'frente', lv: 0, ax: 'x', c: HZ, u: 15, w: 1.8, h: 2.8, n: 2, st: 'closed', into: -1, glass: true, a: 1.4, name: 'a porta da frente' },
      { id: 'jantar', lv: 0, ax: 'z', c: 21, u: 19.9, w: 1.7, h: 2.6, n: 2, st: 'open', into: 1, a: 1.25 },
      { id: 'copa', lv: 0, ax: 'x', c: 14, u: 26.5, w: 1.0, h: 2.2, n: 1, st: 'closed', into: -1, a: 1.45, name: 'a porta vai-e-vem' },
      { id: 'cozinha', lv: 0, ax: 'x', c: 10, u: 26.5, w: 1.0, h: 2.2, n: 1, st: 'closed', into: -1, a: 1.45, name: 'a cozinha' },
      { id: 'corrCoz', lv: 0, ax: 'z', c: 21, u: 8.8, w: 0.95, h: 2.2, n: 1, st: 'closed', into: -1, paint: true, a: 1.45, name: 'o corredor dos fundos' },
      { id: 'lambri', lv: 0, ax: 'x', c: 10, u: 11, w: 0.9, h: 2.1, n: 1, st: 'closed', into: 1, wain: true, a: 1.45, name: 'a passagem no lambri' },
      { id: 'estar', lv: 0, ax: 'z', c: 9, u: 19.2, w: 1.6, h: 2.6, n: 2, st: 'locked', into: -1, msg: 'Trancada: a sala de estar fica para outra noite' },
      { id: 'biblio', lv: 0, ax: 'z', c: 9, u: 8.8, w: 0.95, h: 2.2, n: 1, st: 'stuck', into: -1, msg: 'Emperrada: a porta da biblioteca não sai do lugar' },
      { id: 'servico', lv: 0, ax: 'x', c: CZ, u: 11, w: 0.9, h: 2.1, n: 1, st: 'stuck', into: -1, paint: true, msg: 'A escada de serviço desabou: do outro lado, só entulho' },
      { id: 'criados', lv: 0, ax: 'x', c: CZ, u: 16.7, w: 0.9, h: 2.1, n: 1, st: 'locked', into: -1, paint: true, msg: 'Trancada: a sala dos criados' },
      { id: 'principal', lv: 1, ax: 'z', c: 9, u: 19.2, w: 1.0, h: 2.25, n: 1, st: 'closed', into: -1, a: 1.5, name: 'o quarto principal' },
      { id: 'vestir', lv: 1, ax: 'x', c: 14, u: 4.5, w: 0.9, h: 2.2, n: 1, st: 'closed', into: -1, a: 1.45, name: 'o quarto de vestir' },
      { id: 'vestirC', lv: 1, ax: 'x', c: 10, u: 4.5, w: 0.9, h: 2.2, n: 1, st: 'closed', into: -1, a: 1.45, name: 'o corredor dos fundos' },
      { id: 'patCorr', lv: 1, ax: 'x', c: 10, u: 15, w: 1.0, h: 2.25, n: 1, st: 'closed', into: -1, a: 1.5, name: 'o corredor dos fundos' },
      { id: 'bebe', lv: 1, ax: 'x', c: 10, u: 22.5, w: 1.0, h: 2.25, n: 1, st: 'boss', into: 1 },
      { id: 'bercLock', lv: 1, ax: 'z', c: 21, u: 17, w: 1.6, h: 2.4, n: 2, st: 'locked', into: 1, msg: 'Selada por dentro: o Luto escorre pela fresta. A entrada é pelo corredor dos fundos' },
      { id: 'banheiro', lv: 1, ax: 'x', c: CZ, u: 4.5, w: 0.9, h: 2.1, n: 1, st: 'locked', into: -1, msg: 'Trancada por dentro' },
      { id: 'saida', lv: 1, ax: 'x', c: CZ, u: 11, w: 0.9, h: 2.1, n: 1, st: 'locked', into: -1, paint: true, msg: 'Selada: a saída pela escada de serviço só abre depois da captura' },
      { id: 'rouparia', lv: 1, ax: 'x', c: CZ, u: 17.2, w: 0.9, h: 2.1, n: 1, st: 'locked', into: -1, paint: true, msg: 'Trancada: a rouparia' },
      { id: 'garota', lv: 1, ax: 'x', c: CZ, u: 26.5, w: 1.0, h: 2.25, n: 1, st: 'locked', into: -1, msg: 'Trancada. Lá dentro, uma caixinha de música toca sozinha' },
    ]
    const HWIN = [ // [andar, eixo, c, centro, largura, peitoril, verga, tipo]
      [0, 'x', HZ, 2.5, 1.1, 0.85, 2.6], [0, 'x', HZ, 6.5, 1.1, 0.85, 2.6], [0, 'x', HZ, 11.0, 1.1, 0.85, 2.6], [0, 'x', HZ, 19.0, 1.1, 0.85, 2.6], [0, 'x', HZ, 24.5, 1.2, 0.85, 2.6], [0, 'x', HZ, 29.5, 1.2, 0.85, 2.6],
      [0, 'z', 0, 4.0, 1.1, 0.85, 2.6], [0, 'z', 0, 19.0, 1.1, 0.85, 2.6], [0, 'z', HX, 4.0, 1.1, 1.0, 2.6], [0, 'z', HX, 12.0, 0.9, 1.0, 2.6], [0, 'z', HX, 17.5, 1.1, 0.85, 2.6], [0, 'z', HX, 21.5, 1.1, 0.85, 2.6],
      [1, 'x', HZ, 2.5, 1.0, 0.9, 2.45], [1, 'x', HZ, 6.5, 1.0, 0.9, 2.45], [1, 'x', HZ, 10.5, 0.8, 0.9, 2.4], [1, 'x', HZ, 15, 2.6, 0.55, 2.85, 'arco'], [1, 'x', HZ, 19.5, 0.8, 0.9, 2.4], [1, 'x', HZ, 24.5, 1.0, 0.9, 2.45], [1, 'x', HZ, 29.5, 1.0, 0.9, 2.45],
      [1, 'z', 0, 8.2, 1.0, 0.8, 2.5], [1, 'z', 0, 12.0, 1.0, 0.9, 2.45], [1, 'z', 0, 19.0, 1.0, 0.9, 2.45], [1, 'z', HX, 8.2, 1.0, 0.8, 2.5], [1, 'z', HX, 17.5, 1.0, 0.9, 2.45], [1, 'z', HX, 21.5, 1.0, 0.9, 2.45],
    ]
    function hWalls() {
      const segs = [...wallSegs(0), ...wallSegs(1)]
      const hole = (lv, ax, c, u, w, v0, v1, kind, tag) => {
        const s = segs.find((q) => q.lv === lv && q.ax === ax && Math.abs(q.c - c) < 1e-6 && u > q.a0 && u < q.a1)
        if (!s) { console.warn('casa: vão sem parede', lv, ax, c, u); return null }
        const yb = lv ? UPF : 0, ho = { u0: u - w / 2, u1: u + w / 2, v0: yb + v0, v1: yb + v1, kind, tag }
        s.holes.push(ho); return ho
      }
      for (const D of HDOORS) D.hole = hole(D.lv, D.ax, D.c, D.u, D.w, 0, D.h, 'door', D.id)
      for (const W of HWIN) W.hole = hole(W[0], W[1], W[2], W[3], W[4], W[5], W[6], W[7] === 'arco' ? 'arco' : 'win', W[7] || '')
      for (const s of segs) { s.holes.sort((a, b) => a.u0 - b.u0); wallGeo(s); wallCols(s) }
      CA.segs = segs
    }
    function wallGeo(s) {
      const yb = s.lv ? UPF : 0, yt = yb + 3.2
      const A0 = s.a0 - (s.contA ? 0 : WT / 2), A1 = s.a1 + (s.contB ? 0 : WT / 2)
      const R4 = [] // a parede inteira menos os vãos, em retângulos [u0, u1, v0, v1]
      let u = A0
      for (const ho of s.holes) { if (ho.u0 > u) R4.push([u, ho.u0, yb, yt]); if (ho.v0 > yb) R4.push([ho.u0, ho.u1, yb, ho.v0]); if (ho.v1 < yt) R4.push([ho.u0, ho.u1, ho.v1, yt]); u = ho.u1 }
      if (A1 > u) R4.push([u, A1, yb, yt])
      for (const side of [-1, 1]) {
        const room = side < 0 ? s.neg : s.pos, key = wallKey(room); if (!key) continue
        const cc = s.c + side * WT / 2, wain = room && room.wain, wh = room ? room.wh : 1, N = s.ax === 'x' ? [0, 0, side] : [side, 0, 0]
        const F = (k, u0, u1, v0, v1) => { const P = s.ax === 'x' ? (uu, vv) => [uu, vv, cc] : (uu, vv) => [cc, vv, uu]; hFace(k, P(u0, v0), P(u1, v0), P(u1, v1), P(u0, v1), N, k === wain ? yb : 0) }
        for (const [u0, u1, v0, v1] of R4) {
          if (wain && v0 < yb + wh - 1e-6 && v1 > yb + wh + 1e-6) { F(wain, u0, u1, v0, yb + wh); F(key, u0, u1, yb + wh, v1) }
          else F(wain && v1 <= yb + wh + 1e-6 ? wain : key, u0, u1, v0, v1)
        }
        if (room && room.open && room.id !== 'varanda') wallTrims(s, side, room, A0, A1)
      }
      for (const ho of s.holes) holeGeo(s, ho)
    }
    function wallTrims(s, side, room, A0, A1) { // o rodapé, o rodaterço (nos cômodos de lambri) e a sanca
      const yb = s.lv ? UPF : 0, ceil = s.lv ? TOPC : CEIL, cc = s.c + side * WT / 2
      const spans = (cut) => { const out = []; let u = A0; for (const h of cut) { if (h.u0 > u) out.push([u, h.u0]); u = Math.max(u, h.u1) } if (A1 > u) out.push([u, A1]); return out }
      const band = (key, cut, y0, y1, d) => {
        for (const [u0, u1] of spans(cut)) { if (u1 - u0 < 0.02) continue; const lo = Math.min(cc, cc + side * d), hi = Math.max(cc, cc + side * d); if (s.ax === 'x') hBox(key, u0, y0, lo, u1, y1, hi); else hBox(key, lo, y0, u0, hi, y1, u1) }
      }
      const doors = s.holes.filter((h) => h.kind === 'door')
      if (room.id !== 'vao') band('madeiraE', doors, yb, yb + 0.14, 0.025)
      if (room.wain) band(room.wain === 'azul' ? 'estuqueS' : 'madeira', s.holes, yb + room.wh - 0.02, yb + room.wh + 0.04, 0.035)
      band('estuqueS', [], ceil - 0.16, ceil, 0.09)
    }
    function holeGeo(s, ho) { // o batente por dentro da espessura, as guarnições dos dois lados, e na janela o vidro e os caixilhos
      const yb = s.lv ? UPF : 0, c0 = s.c - WT / 2, c1 = s.c + WT / 2, isX = s.ax === 'x'
      const P = (u, v, c) => (isX ? [u, v, c] : [c, v, u]), Nu = (g) => (isX ? [g, 0, 0] : [0, 0, g])
      hFace('madeiraC', P(ho.u0, ho.v0, c0), P(ho.u0, ho.v0, c1), P(ho.u0, ho.v1, c1), P(ho.u0, ho.v1, c0), Nu(1))
      hFace('madeiraC', P(ho.u1, ho.v0, c0), P(ho.u1, ho.v0, c1), P(ho.u1, ho.v1, c1), P(ho.u1, ho.v1, c0), Nu(-1))
      hFace('madeiraC', P(ho.u0, ho.v1, c0), P(ho.u1, ho.v1, c0), P(ho.u1, ho.v1, c1), P(ho.u0, ho.v1, c1), [0, -1, 0])
      const sill = ho.v0 > yb + 0.01
      if (sill) hFace('madeiraC', P(ho.u0, ho.v0, c0), P(ho.u1, ho.v0, c0), P(ho.u1, ho.v0, c1), P(ho.u0, ho.v0, c1), [0, 1, 0])
      for (const side of [-1, 1]) {
        const room = side < 0 ? s.neg : s.pos; if (!wallKey(room)) continue
        const cc = s.c + side * WT / 2, fw = ho.kind === 'arco' ? 0.14 : 0.09
        const bx = (u0, u1, v0, v1, d) => { const lo = Math.min(cc, cc + side * d), hi = Math.max(cc, cc + side * d); if (isX) hBox('madeira', u0, v0, lo, u1, v1, hi); else hBox('madeira', lo, v0, u0, hi, v1, u1) }
        const vb = sill ? ho.v0 - 0.06 : ho.v0
        bx(ho.u0 - fw, ho.u0, vb, ho.v1 + fw, 0.03); bx(ho.u1, ho.u1 + fw, vb, ho.v1 + fw, 0.03); bx(ho.u0, ho.u1, ho.v1, ho.v1 + fw, 0.03)
        if (sill) bx(ho.u0 - 0.12, ho.u1 + 0.12, ho.v0 - 0.05, ho.v0, 0.07) // o parapeito
        if (ho.kind === 'arco') bx(ho.u0 - 0.3, ho.u1 + 0.3, ho.v1 + fw, ho.v1 + fw + 0.1, 0.06) // a cornija sobre a janela grande
      }
      if (ho.kind !== 'door') {
        for (const g of [-1, 1]) hFace('vidro', P(ho.u0, ho.v0, s.c), P(ho.u1, ho.v0, s.c), P(ho.u1, ho.v1, s.c), P(ho.u0, ho.v1, s.c), isX ? [0, 0, g] : [g, 0, 0])
        const fb = (u0, u1, v0, v1) => { if (isX) hBox('madeiraE', u0, v0, s.c - 0.03, u1, v1, s.c + 0.03); else hBox('madeiraE', s.c - 0.03, v0, u0, s.c + 0.03, v1, u1) }
        const um = (ho.u0 + ho.u1) / 2, vm = (ho.v0 + ho.v1) / 2
        fb(ho.u0, ho.u0 + 0.05, ho.v0, ho.v1); fb(ho.u1 - 0.05, ho.u1, ho.v0, ho.v1); fb(ho.u0, ho.u1, ho.v0, ho.v0 + 0.05); fb(ho.u0, ho.u1, ho.v1 - 0.05, ho.v1)
        fb(ho.u0, ho.u1, vm - 0.03, vm + 0.03) // o encontro das duas folhas da guilhotina
        if (ho.kind === 'arco') { for (const f of [0.25, 0.5, 0.75]) fb(ho.u0 + (ho.u1 - ho.u0) * f - 0.02, ho.u0 + (ho.u1 - ho.u0) * f + 0.02, ho.v0, ho.v1); fb(ho.u0, ho.u1, ho.v1 - 0.45, ho.v1 - 0.41) }
        else { fb(um - 0.02, um + 0.02, ho.v0, ho.v1); for (const v of [(ho.v0 + vm) / 2, (vm + ho.v1) / 2]) fb(ho.u0, ho.u1, v - 0.015, v + 0.015) }
      }
    }
    function wallCols(s) { // colisão: a parede menos as portas; a verga das portas segura tiros e câmera
      const open = (r) => r && r.open
      if (!open(s.neg) && !open(s.pos)) return
      const yb = s.lv ? UPF : 0, y1 = yb + 3.2, A0 = s.a0 - WT / 2, A1 = s.a1 + WT / 2
      const add = (u0, u1, v0, v1) => { if (u1 - u0 < 0.01) return; const um = (u0 + u1) / 2, hu = (u1 - u0) / 2; hCol(s.ax === 'x' ? um : s.c, s.ax === 'x' ? s.c : um, s.ax === 'x' ? hu : WT / 2, s.ax === 'x' ? WT / 2 : hu, 0, v0, v1) }
      let u = A0
      for (const ho of s.holes) { if (ho.kind !== 'door') continue; add(u, ho.u0, yb, y1); add(ho.u0, ho.u1, ho.v1, y1); u = ho.u1 }
      add(u, A1, yb, y1)
    }

    // ---------- pisos, forros, as bordas da laje e a escadaria ----------
    const ST = { x0: 13.5, x1: 16.5, z0: 13.1, z1: 19.1, n: 16 } // a escadaria: no meio do salão, sobe da entrada (z 19,1) para o patamar (z 13,1)
    const stairY = (z) => UPF * cl((ST.z1 - z) / (ST.z1 - ST.z0))
    const VAO = { x0: 12, x1: 18, z0: 13.1, z1: 21.1 } // o vão sobre o salão (o pé-direito duplo)
    const inVaoXZ = (x, z) => x > VAO.x0 && x < VAO.x1 && z > VAO.z0 && z < VAO.z1
    function hFloors() {
      const FL = [['tabua', 0, 9, CZ, 21, 10], ['ladrilho', 0, 9, 10, 21, HZ], ['lajota', 0, 21, 0, HX, 14], ['parquet', 0, 21, 14, HX, HZ], ['ladrilho', 0, 11.9, HZ, 18.1, 25.75],
        ['tabua', UPF, 0, CZ, HX, 10], ['tabua', UPF, 0, 10, 9, HZ], ['tabua', UPF, 9, 10, 21, 13.1], ['tabua', UPF, 9, 13.1, 12, HZ], ['tabua', UPF, 18, 13.1, 21, HZ], ['tabua', UPF, 12, 21.1, 18, HZ]]
      for (const [k, y, x0, z0, x1, z1] of FL) hFace(k, [x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1], [0, 1, 0])
      const CE = [[CEIL, 9, CZ, 21, 10], [CEIL, 21, 0, HX, HZ], [CEIL, 9, 10, 21, 13.1], [CEIL, 9, 13.1, 12, HZ], [CEIL, 18, 13.1, 21, HZ], [CEIL, 12, 21.1, 18, HZ],
        [TOPC, 0, CZ, HX, 10], [TOPC, 0, 10, 9, HZ], [TOPC, 9, 10, 21, HZ], [3.0, 11.9, HZ + 0.08, 18.1, 25.75]]
      for (const [y, x0, z0, x1, z1] of CE) hFace('estuque', [x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1], [0, -1, 0])
      // as bordas da laje em volta do vão
      for (const [ax, c, a0, a1, g] of [['z', VAO.x0, VAO.z0, VAO.z1, 1], ['z', VAO.x1, VAO.z0, VAO.z1, -1], ['x', VAO.z1, VAO.x0, VAO.x1, -1], ['x', VAO.z0, VAO.x0, ST.x0, 1], ['x', VAO.z0, ST.x1, VAO.x1, 1]]) {
        const P = ax === 'z' ? (u, v) => [c, v, u] : (u, v) => [u, v, c]; hFace('madeiraE', P(a0, CEIL - 0.08), P(a1, CEIL - 0.08), P(a1, UPF), P(a0, UPF), ax === 'z' ? [g, 0, 0] : [0, 0, g])
      }
      // a laje entre os andares: segura tiros e câmera (não o corpo, que pisa por cima)
      for (const [x0, z0, x1, z1] of [[0, 0, HX, 10], [0, 10, 9, HZ], [9, 10, 21, 13.1], [9, 13.1, 12, HZ], [18, 13.1, 21, HZ], [12, 21.1, 18, HZ], [21, 10, HX, HZ]]) hCol((x0 + x1) / 2, (z0 + z1) / 2, (x1 - x0) / 2, (z1 - z0) / 2, 0, CEIL - 0.08, UPF, { ray: true })
      hCol(15, 24.95, 3.1, 0.85, 0, 3.0, 3.25, { ray: true }) // o teto da varanda
      // a escadaria: dezesseis degraus de madeira, 3 m de largura, com a passadeira vermelha gasta; por baixo, fechada
      const run = (ST.z1 - ST.z0) / ST.n, rise = UPF / ST.n
      for (let k = 0; k < ST.n; k++) {
        const za = ST.z1 - (k + 1) * run, zb = ST.z1 - k * run, top = (k + 1) * rise
        hBox('degrau', ST.x0, 0, za, ST.x1, top - 0.03, zb, ['ny', 'nz', 'nx', 'px'])
        hFace('lambri', [ST.x0, 0, za], [ST.x0, 0, zb], [ST.x0, top - 0.03, zb], [ST.x0, top - 0.03, za], [-1, 0, 0]); hFace('lambri', [ST.x1, 0, za], [ST.x1, 0, zb], [ST.x1, top - 0.03, zb], [ST.x1, top - 0.03, za], [1, 0, 0])
        hBox('madeiraC', ST.x0 - 0.02, top - 0.03, za, ST.x1 + 0.02, top, zb + 0.025, ['ny'])
        hBox('passadeira', ST.x0 + 0.45, top, za, ST.x1 - 0.45, top + 0.012, zb + 0.026, ['ny'])
        hBox('passadeira', ST.x0 + 0.45, top - rise + 0.012, zb + 0.025, ST.x1 - 0.45, top - 0.03, zb + 0.037, ['ny', 'nz'])
      }
      // os corrimãos dos dois lados, os balaústres (um por degrau), a viga lateral e os pilares do pé
      const slope = UPF / (ST.z1 - ST.z0), ang = Math.atan(slope), zr0 = ST.z1 + 0.12, zr1 = ST.z0, yr = (z) => (ST.z1 - z) * slope + 0.95
      const len = (zr0 - zr1) / Math.cos(ang), zm = (zr0 + zr1) / 2
      for (const xs of [ST.x0 - 0.03, ST.x1 + 0.03]) {
        fp(CA.g, bxg(0.09, 0.07, len), HM.balaust, xs, yr(zm), zm, ang, 0, 0)
        fp(CA.g, bxg(0.05, 0.26, len), HM.degrau, xs + (xs < 15 ? -0.005 : 0.005), yr(zm) - 0.95 + 0.02, zm, ang, 0, 0)
        for (let k = 0; k < ST.n; k++) { const z = ST.z1 - (k + 0.5) * run, y0 = (k + 1) * rise, y1 = yr(z) - 0.03; hBox('balaust', xs - 0.022, y0, z - 0.022, xs + 0.022, y1, z + 0.022) }
        hBox('balaust', xs - 0.07, 0, ST.z1 + 0.05, xs + 0.07, 1.12, ST.z1 + 0.19); fp(CA.g, new THREE.SphereGeometry(0.09, 10, 8), HM.balaust, xs, 1.2, ST.z1 + 0.12)
        hCol(xs, ST.z1 + 0.12, 0.09, 0.09, 0, 0, 1.25)
        hCol(xs, (ST.z0 + ST.z1) / 2, 0.07, (ST.z1 - ST.z0) / 2, 0, 0, UPF) // a lateral da escada: de baixo não se entra pelo lado, e de cima não se cai
      }
    }
    function hBalustrade(ax, c, a0, a1, y0, h = 1.0, sp = 0.17) { // o corrimão, a base e os balaústres, e a colisão
      const isX = ax === 'x', B = (u0, u1, v0, v1, d0, d1) => (isX ? hBox('balaust', u0, v0, c + d0, u1, v1, c + d1) : hBox('balaust', c + d0, v0, u0, c + d1, v1, u1))
      B(a0, a1, y0 + h - 0.07, y0 + h, -0.065, 0.065); B(a0, a1, y0, y0 + 0.09, -0.05, 0.05)
      const n = Math.max(1, Math.round((a1 - a0) / sp))
      for (let i = 0; i <= n; i++) { const u = a0 + (a1 - a0) * i / n; B(u - 0.022, u + 0.022, y0 + 0.09, y0 + h - 0.07, -0.022, 0.022); if (i % 6 === 0) B(u - 0.05, u + 0.05, y0, y0 + h + 0.04, -0.05, 0.05) }
      hCol(isX ? (a0 + a1) / 2 : c, isX ? c : (a0 + a1) / 2, isX ? (a1 - a0) / 2 : 0.07, isX ? 0.07 : (a1 - a0) / 2, 0, y0 - 0.5, y0 + h)
    }
    function hRails() {
      hBalustrade('z', VAO.x0, VAO.z0, VAO.z1, UPF); hBalustrade('z', VAO.x1, VAO.z0, VAO.z1, UPF); hBalustrade('x', VAO.z1, VAO.x0, VAO.x1, UPF) // em volta do vão sobre o salão
      hBalustrade('x', VAO.z0, VAO.x0, ST.x0 - 0.03, UPF); hBalustrade('x', VAO.z0, ST.x1 + 0.03, VAO.x1, UPF) // dos lados da chegada da escada
      // a varanda: grade baixa nos lados e na frente (menos a escada)
      hBalustrade('z', 11.95, HZ + WT / 2, 25.7, 0, 0.9, 0.2); hBalustrade('z', 18.05, HZ + WT / 2, 25.7, 0, 0.9, 0.2)
      hBalustrade('x', 25.7, 11.95, 13.8, 0, 0.9, 0.2); hBalustrade('x', 25.7, 16.2, 18.05, 0, 0.9, 0.2)
    }

    // ---------- por fora: a varanda (colunas, telhado, degraus), a fachada, o telhado, o jardim escuro e a lua ----------
    function hOutside() {
      // a base da varanda (pedra) até o chão do jardim, e os dois degraus
      hBox('fachadaB', 11.9, YARD, HZ + 0.02, 18.1, -0.002, 25.75, ['py', 'nz'])
      hCol(15, 24.9, 3.1, 0.86, 0, YARD - 0.2, -0.01)
      hBox('fachadaB', 13.6, YARD, 25.75, 16.4, -0.15, 26.05, ['nz']); hBox('fachadaB', 13.6, YARD, 26.05, 16.4, -0.3, 26.35, ['nz'])
      // as colunas e o telhado da varanda
      for (const x of [12.15, 17.85]) {
        fp(CA.g, cyg(0.12, 0.14, 2.86, 12), FM.marble, x, 1.5, 25.55); hBox('fachada', x - 0.17, 0, 25.38, x + 0.17, 0.14, 25.72); hBox('fachada', x - 0.18, 2.92, 25.37, x + 0.18, 3.02, 25.73)
        hCol(x, 25.55, 0.17, 0.17, 0, YARD, 3)
      }
      hBox('fachada', 11.8, 3.0, HZ + 0.08, 18.2, 3.24, 25.85, ['py']); hBox('telha', 11.7, 3.24, HZ + 0.08, 18.3, 3.3, 25.95)
      // a fachada: o embasamento escuro, a cinta entre os andares, as cunhais e a cornija; o telhado de duas águas
      hBox('fachadaB', -0.1, YARD, HZ - 0.05, 11.9, 0.02, HZ + 0.1, ['nz']); hBox('fachadaB', 18.1, YARD, HZ - 0.05, HX + 0.1, 0.02, HZ + 0.1, ['nz'])
      hBox('fachadaB', -0.12, YARD, -0.1, -0.02, 0.02, HZ + 0.1, ['px']); hBox('fachadaB', HX + 0.02, YARD, -0.1, HX + 0.12, 0.02, HZ + 0.1, ['nx'])
      hBox('fachada', -0.14, 3.12, HZ + 0.06, HX + 0.14, 3.3, HZ + 0.2, ['nz']); hBox('fachada', -0.14, 6.3, HZ + 0.06, HX + 0.14, 6.62, HZ + 0.5, ['nz'])
      for (const x of [-0.12, 8.86, 20.86, HX - 0.16]) hBox('fachada', x, 0, HZ + 0.04, x + 0.28, 6.3, HZ + 0.16, ['nz'])
      const EAVE = 6.6, RIDGE = 11.6, RZ = HZ / 2
      hFace('telha', [-0.6, EAVE, HZ + 0.7], [HX + 0.6, EAVE, HZ + 0.7], [HX + 0.6, RIDGE, RZ], [-0.6, RIDGE, RZ], [0, 0.93, 0.37])
      hFace('telha', [-0.6, EAVE, -0.7], [-0.6, RIDGE, RZ], [HX + 0.6, RIDGE, RZ], [HX + 0.6, EAVE, -0.7], [0, 0.93, -0.37])
      for (const x of [-0.4, HX + 0.4]) { const g = x < 0 ? -1 : 1; hFace('fachada', [x, EAVE, HZ + 0.5], [x, RIDGE - 0.2, RZ], [x, EAVE, -0.5], [x, EAVE, -0.5], [g, 0, 0]) }
      hCol(4.5, HZ, 4.5, WT / 2, 0, YARD, 6.4) // a fachada da sala de estar (fechada) por fora
      // o jardim: grama, o caminho de cascalho para o carro (lá longe, no escuro) e as palmeiras-imperiais
      hFace('grama', [-30, YARD, HZ], [HX + 30, YARD, HZ], [HX + 30, YARD, 80], [-30, YARD, 80], [0, 1, 0])
      hFace('cascalho', [13.6, YARD + 0.006, 26.35], [16.4, YARD + 0.006, 26.35], [16.4, YARD + 0.006, 80], [13.6, YARD + 0.006, 80], [0, 1, 0])
      for (const z of [31, 38, 45, 52]) for (const x of [11.6, 18.4]) {
        const g = hGrp(x, YARD, z, (x * 7 + z) % 6.28), h = 9 + ((x + z) % 3)
        fp(g, cyg(0.2, 0.26, h, 9), FM.bark, 0, h / 2, 0); fp(g, cyg(0.24, 0.24, 0.6, 9), FM.bark, 0, h - 0.6, 0)
        for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2, f = fp(g, bxg(0.32, 0.02, 3.2), FM.frond, Math.sin(a) * 1.3, h + 0.2, Math.cos(a) * 1.3, 0, a, 0, false); f.rotation.set(0.55, a, 0, 'YXZ') }
      }
      hCol(7, 28, 0.1, 4.2, 0, YARD - 1, 3); hCol(23, 28, 0.1, 4.2, 0, YARD - 1, 3); hCol(15, 32, 8, 0.1, 0, YARD - 1, 3) // até onde o jardim deixa ir (o carro fica para depois)
      // a lua, baixa sobre o jardim (fora da névoa)
      const moon = new THREE.Sprite(new THREE.SpriteMaterial({ map: HT.lua, color: new THREE.Color('#dfe8ff'), depthWrite: false, fog: false, transparent: true }))
      moon.position.set(15, 0, HZ).addScaledVector(MOOND, -62); moon.scale.setScalar(16); moon.renderOrder = -1; CA.g.add(moon)
    }

    // ---------- as portas: folhas de verdade (giram na dobradiça), emperradas ou trancadas nesta demo ----------
    function hDoors() {
      for (const D of HDOORS) {
        const isX = D.ax === 'x', yb = D.lv ? UPF : 0
        D.yb = yb; D.cx = isX ? D.u : D.c; D.cz = isX ? D.c : D.u; D.ang = D.st === 'open' ? D.a : 0; D.want = D.ang; D.shake = 0; D.piv = []
        const lw = D.w / D.n - 0.012, lh = D.h - 0.015, mat = D.paint ? FM.paint : FM.door, matL = D.paint ? FM.paintL : FM.doorL
        for (let i = 0; i < D.n; i++) {
          const sg = i === 0 ? 1 : -1, hinge = i === 0 ? D.u - D.w / 2 : D.u + D.w / 2
          const pv = new THREE.Group(); pv.position.set(isX ? hinge : D.c, yb, isX ? D.c : hinge); pv.userData.base = isX ? 0 : -Math.PI / 2; CA.g.add(pv); BAKE_ANCH.add(pv)
          const L = (w, h, d, m, x, y, z) => fp(pv, bxg(w, h, d), m, sg * x, y, z)
          L(lw, lh, 0.05, mat, lw / 2, lh / 2 + 0.005, 0)
          if (D.glass) { L(lw - 0.2, lh * 0.46, 0.056, FM.glass, lw / 2, lh * 0.68, 0); L(0.035, lh * 0.46, 0.062, matL, lw / 2, lh * 0.68, 0); L(lw - 0.2, 0.035, 0.062, matL, lw / 2, lh * 0.68, 0); L(lw - 0.2, lh * 0.3, 0.064, matL, lw / 2, lh * 0.22, 0) }
          else { L(lw - 0.2, lh * 0.38, 0.064, matL, lw / 2, lh * 0.71, 0); L(lw - 0.2, lh * 0.34, 0.064, matL, lw / 2, lh * 0.25, 0) }
          for (const z of [-0.042, 0.042]) fp(pv, new THREE.SphereGeometry(0.032, 8, 6), FM.brass, sg * (lw - 0.08), 1.02, z, 0, 0, 0, false)
          pv.userData.sg = sg; D.piv.push(pv)
        }
        D.col = hCol(D.cx, D.cz, isX ? D.w / 2 : 0.08, isX ? 0.08 : D.w / 2, 0, yb, yb + D.h, { door: D, off: D.st === 'open' })
        D.leafCols = D.piv.map(() => hCol(0, 0, (D.w / D.n) / 2, 0.035, 0, yb, yb + D.h, { off: true })) // a folha aberta: a câmera e você batem nela
        doorPose(D, 0); if (D.st === 'open') leafCols(D)
      }
      CA.doors = HDOORS
    }
    function leafCols(D) { // a colisão de cada folha no ângulo final (aberta)
      const lw = D.w / D.n
      D.piv.forEach((pv, i) => {
        const th = (D.ax === 'x' ? -1 : 1) * (i === 0 ? 1 : -1) * D.into * D.a, ph = pv.userData.base + th, sg = pv.userData.sg
        const c = D.leafCols[i]; c.x = pv.position.x + Math.cos(ph) * sg * lw / 2; c.z = pv.position.z - Math.sin(ph) * sg * lw / 2; c.yaw = ph; c.off = false
      })
    }
    function doorPose(D, t) { // o giro: a folha 0 corre em +u a partir da dobradiça; abrir leva cada folha para o lado "into"
      for (let i = 0; i < D.piv.length; i++) {
        const pv = D.piv[i], th = (D.ax === 'x' ? -1 : 1) * (i === 0 ? 1 : -1) * D.into * D.ang
        pv.rotation.y = pv.userData.base + th + (D.shake > 0 ? Math.sin(t * 60 + i) * 0.012 * D.shake : 0)
      }
    }

    // ---------- os móveis e os objetos de cena (o que é sólido ganha colisão) ----------
    function hCover(x, y, z, ry, w, h, d, o = {}) { // um móvel coberto por um lençol de poeira, com a etiqueta do leilão de 1931
      const g = hGrp(x, y, z, ry)
      fp(g, bxg(w, h * 0.9, d), FM.sheet, 0, h * 0.45, 0)
      fp(g, bxg(w + 0.07, h * 0.32, d + 0.07), FM.sheet, 0, h * 0.16, 0)
      fp(g, bxg(w * 0.92, 0.07, d * 0.9), FM.sheet, 0, h * 0.92, 0)
      if (o.back) fp(g, bxg(w * 0.96, o.back, d * 0.28), FM.sheet, 0, h * 0.9 + o.back / 2, -d * 0.36)
      if (o.legs) for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) fp(g, bxg(0.06, 0.1, 0.06), FM.dark, a * (w / 2 - 0.06), 0.05, b * (d / 2 - 0.06), 0, 0, 0, false)
      fp(g, bxg(0.07, 0.1, 0.006), FM.paper, w * 0.28, h * 0.62, d / 2 + 0.04, 0, 0, 0.25, false); fp(g, bxg(0.004, 0.12, 0.004), FM.paper, w * 0.28 - 0.01, h * 0.72, d / 2 + 0.037, 0, 0, -0.4, false)
      hCol(x, z, w / 2 + 0.04, d / 2 + 0.04, ry, y, y + h + (o.back || 0))
      return g
    }
    function hPortrait(x, y, z, ry, w, h, kind, seed) {
      const g = hGrp(x, y, z, ry)
      fp(g, bxg(w + 0.14, h + 0.14, 0.05), FM.gold, 0, 0, 0.025, 0, 0, 0, false)
      fp(g, new THREE.PlaneGeometry(w, h), std({ map: hPortraitTex(seed, kind) }), 0, 0, 0.052, 0, 0, 0, false)
      return g
    }
    function hRug(x, y, z, ry, w, d) { fp(CA.g, bxg(w, 0.012, d), FM.rug, x, y + 0.006, z, 0, ry, 0, false) }
    function hWeb(x, y, z, ry, s = 0.9) { const m = fp(CA.g, new THREE.PlaneGeometry(s, s), FM.web, x, y, z, 0, ry, 0, false); m.rotation.set(-0.6, ry, 0, 'YXZ'); m.renderOrder = 2 }
    function hCurtains(x, z, ry, y0, w, mat) { // duas cortinas de veludo rasgadas, de cada lado da janela, num varão de latão
      const g = hGrp(x, y0, z, ry)
      fp(g, cyg(0.018, 0.018, w + 0.8, 6), FM.brass, 0, 2.05, 0, 0, 0, Math.PI / 2, false)
      for (const s of [-1, 1]) { const c = fp(g, new THREE.PlaneGeometry(0.62, 2.1), mat, s * (w / 2 + 0.12), 1.0, 0.02, 0, 0, 0, false); CA.curtains.push({ m: c, ph: x * 1.7 + s + z, base: 0 }) }
    }
    function hChair(x, y, z, ry, fallen) {
      const g = hGrp(x, y, z, ry)
      if (fallen === 1) { g.rotation.set(-Math.PI / 2 + 0.12, ry, 0, 'YXZ'); g.position.y = y + 0.42 }
      if (fallen === 2) { g.rotation.set(0, ry, 1.35, 'YXZ'); g.position.y = y + 0.24 }
      fp(g, bxg(0.46, 0.05, 0.44), FM.wood, 0, 0.46, 0); fp(g, bxg(0.42, 0.06, 0.4), FM.velW, 0, 0.5, 0.01)
      for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) fp(g, bxg(0.04, 0.46, 0.04), FM.wood, a * 0.2, 0.23, b * 0.19)
      for (const a of [-1, 1]) fp(g, bxg(0.045, 0.62, 0.045), FM.wood, a * 0.2, 0.78, -0.2)
      fp(g, bxg(0.44, 0.09, 0.04), FM.wood, 0, 1.06, -0.2); fp(g, bxg(0.3, 0.32, 0.025), FM.velW, 0, 0.78, -0.2)
      if (!fallen) hCol(x, z, 0.25, 0.25, ry, y, y + 1.1)
      return g
    }
    function hLustre(x, top, z, drop, r, id) { // o lustre de cristal empoeirado; balança devagar
      const g = hGrp(x, top, z); BAKE_ANCH.add(g); CA.swing.push({ g, ph: x + z, k: id === 'grande' ? 1 : 0.6 })
      fp(g, bxg(0.03, drop, 0.03), FM.iron, 0, -drop / 2, 0, 0, 0, 0, false)
      fp(g, cyg(0.05, 0.08, 0.5, 8), FM.brass, 0, -drop - 0.15, 0)
      fp(g, new THREE.TorusGeometry(r, 0.024, 6, 24), FM.brass, 0, -drop - 0.32, 0, Math.PI / 2, 0, 0)
      fp(g, new THREE.TorusGeometry(r * 0.55, 0.02, 6, 18), FM.brass, 0, -drop - 0.12, 0, Math.PI / 2, 0, 0)
      const n = id === 'grande' ? 10 : 6
      for (let i = 0; i < n; i++) {
        const a = i / n * Math.PI * 2, cx = Math.cos(a) * r, cz = Math.sin(a) * r
        fp(g, bxg(r, 0.02, 0.02), FM.brass, cx / 2, -drop - 0.28, cz / 2, 0, -a, 0, false)
        fp(g, cyg(0.035, 0.025, 0.05, 8), FM.brass, cx, -drop - 0.29, cz, 0, 0, 0, false); fp(g, cyg(0.014, 0.014, 0.06 + (i % 3) * 0.04, 6), FM.wax, cx, -drop - 0.24 + (i % 3) * 0.02, cz, 0, 0, 0, false)
        for (let k = 0; k < 2; k++) { const aa = a + (k ? 0.31 : 0), rr = r * (k ? 0.82 : 1.0); fp(g, bxg(0.02, 0.07 + k * 0.04, 0.02), FM.crystal, Math.cos(aa) * rr, -drop - 0.4 - k * 0.05, Math.sin(aa) * rr, 0, aa, 0, false) }
      }
      fp(g, new THREE.SphereGeometry(0.06, 8, 6), FM.crystal, 0, -drop - 0.55, 0, 0, 0, 0, false)
      return g
    }
    function hCandle(par, x, y, z, lit, h = 0.14) { // uma vela (acesa: a chama, o halo e uma luz de brilho)
      fp(par, cyg(0.016, 0.017, h, 7), FM.wax, x, y + h / 2, z, 0, 0, 0, false)
      if (!lit) return null
      const f = new THREE.Sprite(flameMat); f.scale.set(0.035, 0.07, 1); f.position.set(x, y + h + 0.03, z); par.add(f)
      const hl = new THREE.Sprite(lampHalo); hl.scale.setScalar(0.45); hl.position.copy(f.position); par.add(hl)
      CA.flames.push({ f, hl, ph: x * 3.1 + z, s: 0.035 })
      return f
    }
    function hLamp(id, x, y, z, wall) { // o ponto de retorno: a lamparina (a lanterna de parede, na varanda); acesa, a chama e a luz quente
      const g = hGrp(x, y, z)
      if (wall) {
        fp(g, bxg(0.04, 0.04, 0.2), FM.iron, 0, 0.32, -0.05, 0, 0, 0, false); fp(g, bxg(0.04, 0.2, 0.04), FM.iron, 0, 0.22, -0.13, 0, 0, 0, false)
        fp(g, bxg(0.2, 0.03, 0.2), FM.iron, 0, -0.02, 0.06); fp(g, new THREE.ConeGeometry(0.16, 0.12, 4), FM.iron, 0, 0.34, 0.06, 0, Math.PI / 4, 0)
        for (const [dx, dz] of [[-0.085, -0.025], [0.085, -0.025], [-0.085, 0.145], [0.085, 0.145]]) fp(g, bxg(0.018, 0.28, 0.018), FM.iron, dx, 0.13, dz, 0, 0, 0, false)
        fp(g, bxg(0.16, 0.26, 0.16), FM.chimney, 0, 0.13, 0.06, 0, 0, 0, false)
      } else {
        fp(g, cyg(0.055, 0.075, 0.035, 10), FM.brass, 0, 0.018, 0); fp(g, cyg(0.018, 0.03, 0.1, 8), FM.brass, 0, 0.085, 0)
        fp(g, new THREE.SphereGeometry(0.06, 10, 8), FM.brass, 0, 0.18, 0); fp(g, cyg(0.03, 0.045, 0.2, 10), FM.chimney, 0, 0.34, 0, 0, 0, 0, false)
      }
      const fy = wall ? 0.12 : 0.29, fz = wall ? 0.06 : 0
      const flame = new THREE.Sprite(flameMat); flame.scale.set(0.045, 0.085, 1); flame.position.set(0, fy, fz); g.add(flame)
      const halo = new THREE.Sprite(lampHalo.clone()); halo.scale.setScalar(1.1); halo.position.set(0, fy, fz); g.add(halo)
      const glow = { p: V3(x, y + fy, z + fz), r: 5.2, c: new THREE.Color('#ffb066').convertSRGBToLinear().multiplyScalar(1.5), k: 0, warm: true, flick: 1 }
      CA.glows.push(glow)
      return { g, flame, halo, glow, lit: false, k: 0 }
    }
    function hKit(x, y, z) { // o kit de primeiros socorros, o mesmo da luta
      const g = hGrp(x, y, z)
      fp(g, boxG(0.34, 0.16, 0.24), kitMat, 0, 0.08, 0); fp(g, boxG(0.06, 0.02, 0.18), kitRed, 0, 0.17, 0, 0, 0, 0, false); fp(g, boxG(0.18, 0.02, 0.06), kitRed, 0, 0.17, 0, 0, 0, 0, false)
      g.traverse((m) => (m.userData.noBake = true))
      const s = new THREE.Sprite(kitGlowMat); s.scale.setScalar(0.9); s.position.y = 0.15; g.add(s)
      return { g, p: V3(x, y, z), lv: y > 2.5 ? 1 : 0, on: true }
    }
    function hWardrobe(x, y, z, ry) { // o guarda-roupa de duas portas
      const g = hGrp(x, y, z, ry)
      fp(g, bxg(1.65, 2.15, 0.62), FM.wood, 0, 1.12, 0); fp(g, bxg(1.75, 0.12, 0.68), FM.dark, 0, 2.24, 0); for (const a of [-1, 1]) fp(g, bxg(0.1, 0.06, 0.1), FM.dark, a * 0.75, 0.03, 0.25)
      for (const a of [-0.41, 0.41]) { fp(g, bxg(0.74, 1.8, 0.02), FM.dark, a, 1.15, 0.315); fp(g, new THREE.SphereGeometry(0.02, 6, 4), FM.brass, a * 0.12, 1.15, 0.33, 0, 0, 0, false) }
      hCol(x, z, 0.84, 0.33, ry, y, y + 2.3)
      return g
    }
    function hSideboard(x, y, z, ry, w = 1.5) { // o aparador
      const g = hGrp(x, y, z, ry)
      fp(g, bxg(w, 0.05, 0.46), FM.light, 0, 0.88, 0); fp(g, bxg(w - 0.1, 0.5, 0.42), FM.wood, 0, 0.6, 0)
      for (const a of [-1, 1]) for (const b of [-1, 1]) fp(g, bxg(0.06, 0.35, 0.06), FM.dark, a * (w / 2 - 0.11), 0.17, b * 0.17)
      for (const a of [-w * 0.23, w * 0.23]) { fp(g, bxg(w * 0.4, 0.18, 0.02), FM.dark, a, 0.68, 0.215); fp(g, new THREE.SphereGeometry(0.02, 6, 4), FM.brass, a, 0.68, 0.23, 0, 0, 0, false) }
      hCol(x, z, w / 2 + 0.01, 0.25, ry, y, y + 1.0)
      return g
    }
    function hFurnish() {
      const cobre = std({ color: '#7a4128' })
      // ---- o salão: a escadaria no meio, o lustre caído nos degraus, o espelho coberto, o relógio parado, o aparador com a lamparina ----
      hRug(15, 0, 21.7, 0, 3.0, 2.3)
      { const zc = 17.4, yb = stairY(zc), g = hGrp(13.95, yb + 0.08, zc, 0.3) // o lustre grande caiu na escadaria: de lado, encostado no corrimão
        const L = new THREE.Group(); L.rotation.set(0.25, 0, 1.15); g.add(L)
        fp(L, new THREE.TorusGeometry(0.75, 0.03, 6, 26), FM.brass, 0, 0, 0, Math.PI / 2, 0, 0); fp(L, new THREE.TorusGeometry(0.42, 0.024, 6, 20), FM.brass, 0, 0.22, 0, Math.PI / 2, 0, 0)
        fp(L, cyg(0.06, 0.09, 0.6, 8), FM.brass, 0, 0.3, 0)
        for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2, cx = Math.cos(a) * 0.75, cz = Math.sin(a) * 0.75; fp(L, bxg(0.75, 0.02, 0.02), FM.brass, cx / 2, 0.05, cz / 2, 0, -a, 0, false); if (i % 3) fp(L, bxg(0.02, 0.09, 0.02), FM.crystal, cx, -0.07, cz, 0, a, 0, false) }
        hCol(13.95, zc, 0.5, 0.75, 0, yb, yb + 1.6)
        for (let i = 0; i < 16; i++) { const z = 16.2 + (i * 0.37) % 3.2, x = 13.7 + (i * 0.53) % 1.6; fp(CA.g, bxg(0.03, 0.012, 0.05), FM.crystal, x, stairY(z) + 0.006, z, 0, i, 0, false) } // os cristais espalhados nos degraus
        fp(CA.g, bxg(0.025, 1.6, 0.025), FM.iron, 15, TOPC - 0.8, 17.0, 0, 0, 0.12, false) } // a corrente arrebentada pendurada no forro
      { const g = hSideboard(9 + WT / 2 + 0.25, 0, 16.6, Math.PI / 2) // o aparador (a lamparina do salão fica nele)
        fp(g, cyg(0.07, 0.1, 0.32, 10), FM.pot, -0.45, 1.05, 0); for (let i = 0; i < 4; i++) fp(g, bxg(0.012, 0.5, 0.012), FM.dry, -0.45 + (i - 1.5) * 0.03, 1.4, (i % 2) * 0.03, 0, 0, (i - 1.5) * 0.25, false) }
      { const g = hGrp(9.1, 0, 12.2, Math.PI / 2) // o espelho alto coberto com pano preto
        fp(g, bxg(1.0, 2.0, 0.06), FM.gold, 0, 1.45, 0.03); fp(g, bxg(0.86, 1.86, 0.02), FM.mirror, 0, 1.45, 0.065, 0, 0, 0, false)
        fp(g, bxg(1.06, 1.42, 0.03), FM.cloth, 0, 1.78, 0.09); fp(g, bxg(0.4, 0.5, 0.03), FM.cloth, 0.33, 0.85, 0.09, 0, 0, 0.18) }
      { const g = hGrp(21 - WT / 2 - 0.22, 0, 22.4, -Math.PI / 2) // o relógio de pé, parado às 3 e 10
        fp(g, bxg(0.56, 0.34, 0.38), FM.dark, 0, 0.17, 0); fp(g, bxg(0.42, 1.32, 0.3), FM.wood, 0, 1.0, 0); fp(g, bxg(0.56, 0.58, 0.38), FM.dark, 0, 1.95, 0); fp(g, bxg(0.62, 0.08, 0.42), FM.wood, 0, 2.27, 0)
        fp(g, cyg(0.17, 0.17, 0.012, 16), FM.paper, 0, 1.96, 0.19, Math.PI / 2, 0, 0, false); fp(g, bxg(0.012, 0.12, 0.004), FM.soot, 0, 2.0, 0.2, 0, 0, 0.2, false); fp(g, bxg(0.09, 0.012, 0.004), FM.soot, 0.035, 1.955, 0.2, 0, 0, 0.12, false)
        fp(g, bxg(0.2, 0.7, 0.012), FM.glass, 0, 1.0, 0.152, 0, 0, 0, false); fp(g, cyg(0.06, 0.06, 0.012, 12), FM.brass, 0, 0.78, 0.13, Math.PI / 2, 0, 0, false)
        hCol(21 - WT / 2 - 0.22, 22.4, 0.3, 0.2, -Math.PI / 2, 0, 2.3) }
      hCover(19.75, 0, 14.6, -Math.PI / 2, 2.0, 0.5, 0.92, { back: 0.42, legs: true }); hCover(10.3, 0, 22.7, 0.5, 0.82, 0.75, 0.8, { back: 0.35 }); hCover(19.7, 0, 11.4, -0.4, 0.82, 0.75, 0.8, { back: 0.35 })
      hCover(10.4, 0, 11.3, 0.3, 1.1, 0.95, 0.6) // uma cômoda coberta sob o patamar
      hPortrait(17.6, 2.0, 10 + WT / 2 + 0.01, 0, 0.8, 1.05, 'pai', 1101) // a família: o pai, com o rosto riscado
      hPortrait(21 - WT / 2 - 0.01, 1.95, 16.5, -Math.PI / 2, 0.6, 0.8, 'dama', 1103)
      hPortrait(9 + WT / 2 + 0.01, 2.0, 21.8, Math.PI / 2, 0.5, 0.65, 'menina', 1107)
      for (let i = 0; i < 6; i++) { const x = 14.3 + (i * 0.37) % 1.4, z = 22.6 + ((i * 0.53) % 0.8); fp(CA.g, new THREE.PlaneGeometry(0.2, 0.14), FM.letter, x, 0.004 + i * 0.0005, z, -Math.PI / 2, 0, i * 1.3, false) } // cartas no chão
      for (let i = 0; i < 14; i++) { const x = 14.1 + ((i * 0.61) % 1.7), z = 23.1 + ((i * 0.37) % 0.6); fp(CA.g, new THREE.PlaneGeometry(0.07, 0.05), FM.dry, x, 0.003, z, -Math.PI / 2, 0, i, false) } // folhas secas que o vento trouxe
      hWeb(9.12, CEIL - 0.08, 23.88, Math.PI / 4); hWeb(20.88, CEIL - 0.08, 23.88, -Math.PI / 4); hWeb(20.88, CEIL - 0.08, 10.12, -Math.PI * 0.75); hWeb(9.12, CEIL - 0.08, 10.12, Math.PI * 0.75)
      hCurtains(11.0, HZ - WT / 2 - 0.05, Math.PI, 0.6, 1.1, FM.curtW); hCurtains(19.0, HZ - WT / 2 - 0.05, Math.PI, 0.6, 1.1, FM.curtW)
      // ---- a sala de jantar: a mesa posta para 12, coberta de pó; um castiçal ainda aceso; cadeiras caídas ----
      const TX = 26.5, TZ = 19.2
      { const g = hGrp(TX, 0, TZ)
        fp(g, bxg(1.2, 0.06, 4.0), FM.wood, 0, 0.75, 0); for (const a of [-1, 1]) for (const b of [-1.85, 0, 1.85]) fp(g, bxg(0.08, 0.72, 0.08), FM.dark, a * 0.5, 0.36, b)
        fp(g, bxg(1.34, 0.012, 4.14), FM.linen, 0, 0.786, 0); for (const a of [-1, 1]) fp(g, bxg(0.012, 0.24, 4.14), FM.linen, a * 0.67, 0.672, 0, 0, 0, 0, false)
        const seats = [[-0.36, -1.6], [-0.36, -0.8], [-0.36, 0], [-0.36, 0.8], [-0.36, 1.6], [0.36, -1.6], [0.36, -0.8], [0.36, 0], [0.36, 0.8], [0.36, 1.6], [0, -1.82], [0, 1.82]]
        for (const [a, b] of seats) {
          fp(g, cyg(0.12, 0.1, 0.015, 12), FM.plate, a, 0.8, b, 0, 0, 0, false); fp(g, cyg(0.07, 0.06, 0.012, 10), FM.plate, a, 0.81, b, 0, 0, 0, false)
          fp(g, cyg(0.03, 0.025, 0.065, 8), FM.plate, a + (a ? -Math.sign(a) * 0.17 : 0.14), 0.825, b + (a ? 0.12 : Math.sign(b) * 0.15), 0, 0, 0, false)
          for (const s of [-1, 1]) fp(g, bxg(0.012, 0.004, 0.16), FM.metal, a + (a ? 0 : s * 0.15), 0.795, b + (a ? s * 0.16 : 0), 0, a ? 0 : Math.PI / 2, 0, false)
        }
        for (const b of [-1.1, 0, 1.1]) { // os castiçais; só o do meio tem velas acesas
          fp(g, cyg(0.07, 0.09, 0.03, 10), FM.brass, 0, 0.805, b, 0, 0, 0, false); fp(g, cyg(0.015, 0.02, 0.3, 8), FM.brass, 0, 0.95, b, 0, 0, 0, false); fp(g, bxg(0.3, 0.02, 0.02), FM.brass, 0, 1.08, b, 0, 0, 0, false)
          for (const a of [-0.15, 0, 0.15]) hCandle(g, a, 1.09, b, b === 0, a === 0 ? 0.14 : 0.09)
        }
        fp(g, cyg(0.06, 0.08, 0.18, 10), FM.pot, 0, 0.88, 0.55, 0, 0, 0, false); for (let i = 0; i < 5; i++) fp(g, bxg(0.01, 0.34, 0.01), FM.dry, (i - 2) * 0.025, 1.12, 0.55, 0, 0, (i - 2) * 0.22, false)
        hCol(TX, TZ, 0.66, 2.05, 0, 0, 0.9)
        CA.glows.push({ p: V3(TX, 1.3, TZ), r: 4.2, c: new THREE.Color('#ffb066').convertSRGBToLinear().multiplyScalar(1.05), k: 1, warm: true, flick: 1 }) }
      for (const [b, fall] of [[-1.6, 0], [-0.8, 0], [0, 0], [0.8, 1], [1.6, 0]]) hChair(TX - 0.86 - (fall ? 0.4 : 0), 0, TZ + b, Math.PI / 2, fall)
      for (const [b, fall] of [[-1.6, 0], [-0.8, 0], [0, 2], [0.8, 0], [1.6, 0]]) hChair(TX + 0.86 + (fall ? 0.35 : 0), 0, TZ + b, -Math.PI / 2, fall)
      hChair(TX, 0, TZ - 2.32, 0, 0); hChair(TX, 0, TZ + 2.55, Math.PI + 0.5, 0)
      hLustre(TX, CEIL, TZ, 0.55, 0.42, 'jantar')
      { const g = hSideboard(29.7, 0, 14 + WT / 2 + 0.25, 0, 2.2) // o aparador: o kit, pratos empilhados e um castiçal apagado
        for (let i = 0; i < 6; i++) fp(g, cyg(0.11, 0.1, 0.012, 12), FM.plate, -0.6, 0.912 + i * 0.013, 0.02, 0, 0, 0, false)
        fp(g, cyg(0.05, 0.06, 0.03, 8), FM.brass, -0.2, 0.92, 0, 0, 0, 0, false); fp(g, cyg(0.012, 0.016, 0.22, 6), FM.brass, -0.2, 1.03, 0, 0, 0, 0, false); hCandle(g, -0.2, 1.14, 0, false, 0.07) }
      hPortrait(21 + WT / 2 + 0.01, 1.95, 16.0, Math.PI / 2, 0.55, 0.72, 'pai', 1113); hPortrait(21 + WT / 2 + 0.01, 1.95, 22.6, Math.PI / 2, 0.55, 0.72, 'dama', 1117)
      hCurtains(24.5, HZ - WT / 2 - 0.05, Math.PI, 0.6, 1.2, FM.curtW); hCurtains(29.5, HZ - WT / 2 - 0.05, Math.PI, 0.6, 1.2, FM.curtW)
      hCurtains(HX - WT / 2 - 0.05, 17.5, -Math.PI / 2, 0.6, 1.1, FM.curtW); hCurtains(HX - WT / 2 - 0.05, 21.5, -Math.PI / 2, 0.6, 1.1, FM.curtW)
      hWeb(HX - 0.12, CEIL - 0.08, 23.88, -Math.PI * 0.25); hWeb(21.12, CEIL - 0.08, 14.12, Math.PI * 0.75)
      // ---- a copa: o louceiro, a pia de pedra dupla, a prateleira dos potes ----
      { const g = hGrp(21 + WT / 2 + 0.25, 0, 12.0, Math.PI / 2)
        fp(g, bxg(1.6, 0.9, 0.45), FM.wood, 0, 0.45, 0); fp(g, bxg(1.66, 0.05, 0.5), FM.light, 0, 0.92, 0); fp(g, bxg(1.5, 1.1, 0.32), FM.wood, 0, 1.5, -0.05); fp(g, bxg(1.6, 0.08, 0.36), FM.dark, 0, 2.08, -0.05)
        for (const a of [-0.37, 0.37]) fp(g, bxg(0.68, 0.95, 0.02), FM.glass, a, 1.5, 0.12, 0, 0, 0, false)
        for (let i = 0; i < 8; i++) fp(g, cyg(0.09, 0.09, 0.015, 10), FM.plate, -0.6 + (i % 4) * 0.4, 1.32 + (i >> 2) * 0.36, 0.0, Math.PI / 2, 0, 0, false)
        hCol(21 + WT / 2 + 0.25, 12.0, 0.82, 0.26, Math.PI / 2, 0, 2.1) }
      { const g = hGrp(HX - WT / 2 - 0.32, 0, 12.0, -Math.PI / 2)
        fp(g, bxg(1.6, 0.85, 0.6), FM.marble, 0, 0.425, 0); for (const a of [-0.38, 0.38]) fp(g, bxg(0.62, 0.02, 0.44), FM.soot, a, 0.855, 0.02, 0, 0, 0, false)
        fp(g, cyg(0.025, 0.025, 0.35, 6), FM.iron, 0, 1.03, -0.25, 0, 0, 0, false); fp(g, bxg(0.04, 0.04, 0.22), FM.iron, 0, 1.2, -0.16, 0, 0, 0, false)
        hCol(HX - WT / 2 - 0.32, 12.0, 0.82, 0.32, -Math.PI / 2, 0, 1.0) }
      { const g = hGrp(23.4, 1.55, 10 + WT / 2 + 0.13); fp(g, bxg(1.4, 0.04, 0.26), FM.wood, 0, 0, 0); for (let i = 0; i < 6; i++) fp(g, cyg(0.05 + (i % 2) * 0.02, 0.05, 0.16 + (i % 3) * 0.05, 8), i % 2 ? FM.glass : FM.pot, -0.55 + i * 0.22, 0.1 + (i % 3) * 0.025, 0, 0, 0, 0, false) }
      for (let i = 0; i < 5; i++) fp(CA.g, cyg(0.06, 0.05, 0.012, 8), FM.plate, 25.4 + (i * 0.41) % 1.2, 0.006, 12.6 + (i * 0.27) % 0.8, (i % 2) * 0.4, i, 0.3, false) // pratos quebrados
      // ---- a cozinha: o fogão a lenha ainda com brasa, a mesa de trabalho (o kit), a pia, as panelas de cobre; é a toca do Glutão ----
      { const g = hGrp(26.5, 0, WT / 2 + 0.45)
        fp(g, bxg(1.9, 0.82, 0.8), FM.iron, 0, 0.41, 0); fp(g, bxg(2.0, 0.05, 0.86), FM.dark, 0, 0.845, 0)
        for (const a of [-0.5, 0.45]) { fp(g, bxg(0.6, 0.42, 0.02), FM.dark, a, 0.4, 0.41, 0, 0, 0, false); fp(g, bxg(0.12, 0.03, 0.03), FM.brass, a, 0.58, 0.43, 0, 0, 0, false) }
        fp(g, bxg(0.34, 0.2, 0.02), FM.soot, -0.5, 0.42, 0.415, 0, 0, 0, false); for (let i = 0; i < 6; i++) fp(g, bxg(0.05, 0.03, 0.04), FM.ember, -0.62 + i * 0.05, 0.35 + (i % 2) * 0.03, 0.4, 0, i, 0, false) // a boca da fornalha, com brasa
        fp(g, cyg(0.12, 0.12, CEIL - 0.85, 10), FM.iron, 0.7, 0.85 + (CEIL - 0.85) / 2, -0.25)
        fp(g, cyg(0.2, 0.18, 0.22, 12), cobre, -0.3, 0.98, 0.1); fp(g, cyg(0.16, 0.15, 0.14, 12), cobre, 0.35, 0.94, 0.12)
        hCol(26.5, WT / 2 + 0.45, 1.0, 0.43, 0, 0, 2.5)
        CA.glows.push({ p: V3(26.0, 0.45, 1.2), r: 4.6, c: new THREE.Color('#ff7a3a').convertSRGBToLinear().multiplyScalar(1.2), k: 1, warm: true, flick: 2 })
        CA.embers = { x: 25.85, y: 0.45, z: 1.0 } }
      { const g = hGrp(29.5, 0, 7.6)
        fp(g, bxg(2.2, 0.08, 1.0), FM.light, 0, 0.84, 0); for (const a of [-1, 1]) for (const b of [-1, 1]) fp(g, bxg(0.08, 0.8, 0.08), FM.dark, a * 1.0, 0.4, b * 0.42)
        fp(g, bxg(0.5, 0.03, 0.32), FM.wood, -0.6, 0.895, 0.1, 0, 0.2, 0); fp(g, cyg(0.16, 0.1, 0.1, 10), FM.plate, 0.1, 0.93, -0.2); fp(g, cyg(0.03, 0.03, 0.22, 6), FM.metal, -0.55, 0.9, 0.1, 0, 0, Math.PI / 2, false)
        hCol(29.5, 7.6, 1.12, 0.52, 0, 0, 0.95) }
      { const g = hGrp(HX - WT / 2 - 0.32, 0, 4.0, -Math.PI / 2)
        fp(g, bxg(1.5, 0.85, 0.6), FM.marble, 0, 0.425, 0); fp(g, bxg(1.1, 0.02, 0.44), FM.soot, 0, 0.855, 0.02, 0, 0, 0, false); fp(g, cyg(0.025, 0.025, 0.35, 6), FM.iron, 0, 1.03, -0.25, 0, 0, 0, false)
        hCol(HX - WT / 2 - 0.32, 4.0, 0.77, 0.32, -Math.PI / 2, 0, 1.0) }
      { const g = hGrp(23.5, 0, WT / 2 + 0.06); fp(g, bxg(2.2, 0.04, 0.04), FM.iron, 0, 2.05, 0.08, 0, 0, 0, false) // as panelas de cobre penduradas
        for (let i = 0; i < 6; i++) { const r = 0.09 + i * 0.018, x = -0.9 + i * 0.36; fp(g, cyg(r, r * 0.9, r * 0.9, 12), cobre, x, 1.75 - r * 0.6, 0.12 + r); fp(g, bxg(0.02, 0.22, 0.02), cobre, x, 1.92, 0.12, 0, 0, 0, false) } }
      for (const [x, z, r] of [[21.6, 0.8, 0.3], [22.25, 0.7, -0.2], [21.7, 1.45, 1.3]]) { const g = hGrp(x, 0, z, r); fp(g, cyg(0.24, 0.28, 0.62, 9), FM.linen, 0, 0.31, 0); hCol(x, z, 0.26, 0.26, 0, 0, 0.6) } // sacos de farinha
      hChair(24.0, 0, 6.2, 2.2, 2)
      hWeb(HX - 0.12, CEIL - 0.08, 0.12, -Math.PI * 0.75); hWeb(21.12, CEIL - 0.08, 0.12, Math.PI * 0.75)
      // ---- o corredor dos fundos (térreo): estreito, sem luz, o quadro das campainhas dos criados ----
      { const g = hGrp(14.0, 1.95, CZ + WT / 2 + 0.02)
        fp(g, bxg(1.4, 0.7, 0.04), FM.wood, 0, 0, 0); fp(g, bxg(1.3, 0.6, 0.02), FM.dark, 0, 0, 0.02, 0, 0, 0, false)
        for (let i = 0; i < 12; i++) { const x = -0.55 + (i % 6) * 0.22, y = i < 6 ? 0.12 : -0.14; fp(g, new THREE.SphereGeometry(0.035, 8, 6), FM.brass, x, y, 0.05, 0, 0, 0, false); fp(g, bxg(0.12, 0.04, 0.005), FM.paper, x, y - 0.08, 0.035, 0, 0, 0, false) } }
      { const g = hGrp(19.6, 1.72, CZ + WT / 2 + 0.05); fp(g, bxg(0.9, 0.06, 0.04), FM.wood, 0, 0, 0); for (const a of [-0.3, 0, 0.3]) fp(g, bxg(0.02, 0.02, 0.12), FM.iron, a, -0.02, 0.06, 0, 0, 0, false)
        const c = fp(g, new THREE.PlaneGeometry(0.5, 1.05), FM.curtG, -0.3, -0.52, 0.1, 0, 0, 0.05, false); CA.curtains.push({ m: c, ph: 4.1, base: 0 }) } // o casaco esquecido
      { const g = hGrp(20.3, 0, 8.4); fp(g, cyg(0.15, 0.12, 0.3, 10), FM.iron, 0, 0.15, 0); fp(g, cyg(0.012, 0.012, 1.3, 6), FM.wood, 0.1, 0.62, 0.05, 0, 0, 0.25, false); hCol(20.3, 8.4, 0.16, 0.16, 0, 0, 0.4) }
      hWeb(9.12, CEIL - 0.08, CZ + 0.12, Math.PI * 0.75); hWeb(20.88, CEIL - 0.08, 9.88, -Math.PI * 0.25)
      // ---- a varanda: o banco, o vaso com a palmeira seca, o capacho ----
      { const g = hGrp(13.1, 0, HZ + 0.45)
        for (let i = 0; i < 3; i++) fp(g, bxg(1.2, 0.03, 0.1), FM.wood, 0, 0.44, -0.12 + i * 0.12); for (const a of [-0.5, 0.5]) fp(g, bxg(0.06, 0.44, 0.34), FM.iron, a, 0.22, 0)
        hCol(13.1, HZ + 0.45, 0.62, 0.2, 0, 0, 0.5) }
      { const g = hGrp(17.3, 0, HZ + 0.5); fp(g, cyg(0.22, 0.16, 0.45, 10), FM.pot, 0, 0.22, 0); for (let i = 0; i < 6; i++) { const a = i / 6 * 6.28; fp(g, bxg(0.05, 0.02, 0.9), FM.dry, Math.sin(a) * 0.3, 0.75, Math.cos(a) * 0.3, 0.9, a, 0, false) } hCol(17.3, HZ + 0.5, 0.24, 0.24, 0, 0, 0.6) }
      fp(CA.g, bxg(1.0, 0.012, 0.6), FM.velW, 15, 0.006, HZ + 0.5, 0, 0, 0, false)
      // ---- em cima: o patamar (o aparador com a lamparina, o alçapão do sótão), as galerias com os móveis cobertos e os retratos ----
      hSideboard(11.2, UPF, 10 + WT / 2 + 0.25, 0, 1.3)
      { const g = hGrp(18.6, TOPC - 0.01, 11.6) // o alçapão do sótão, com a cordinha
        fp(g, bxg(0.92, 0.04, 0.92), FM.wood, 0, 0, 0, 0, 0, 0, false); fp(g, bxg(0.78, 0.03, 0.78), FM.dark, 0, -0.03, 0, 0, 0, 0, false); fp(g, bxg(0.008, 0.7, 0.008), FM.paper, 0.3, -0.38, 0, 0, 0, 0, false) }
      hPortrait(13.0, UPF + 1.8, 10 + WT / 2 + 0.01, 0, 0.6, 0.8, 'pai', 1123); hPortrait(17.0, UPF + 1.8, 10 + WT / 2 + 0.01, 0, 0.6, 0.8, 'dama', 1127)
      hCover(20.2, UPF, 11.3, -0.5, 0.7, 0.55, 0.7, { back: 0.5 })
      for (const [z, k, sd] of [[14.6, 'dama', 1131], [22.6, 'pai', 1137]]) hPortrait(9 + WT / 2 + 0.01, UPF + 1.7, z, Math.PI / 2, 0.55, 0.75, k, sd)
      for (const [z, k, sd] of [[14.6, 'menina', 1139], [22.6, 'dama', 1141]]) hPortrait(21 - WT / 2 - 0.01, UPF + 1.7, z, -Math.PI / 2, 0.55, 0.75, k, sd)
      hCover(9.6, UPF, 16.4, Math.PI / 2, 1.3, 0.85, 0.5); hCover(20.4, UPF, 19.6, -Math.PI / 2, 1.2, 0.5, 0.8, { back: 0.45, legs: true }); hCover(17.0, UPF, 23.4, Math.PI, 0.8, 0.55, 0.7, { back: 0.5 })
      { const g = hGrp(12.9, UPF, 23.55); fp(g, cyg(0.25, 0.25, 0.03, 12), FM.wood, 0, 0.72, 0); fp(g, cyg(0.04, 0.05, 0.7, 8), FM.dark, 0, 0.36, 0); fp(g, cyg(0.06, 0.08, 0.24, 10), FM.pot, 0, 0.86, 0); for (let i = 0; i < 5; i++) fp(g, bxg(0.01, 0.4, 0.01), FM.dry, (i - 2) * 0.03, 1.15, 0, 0, 0, (i - 2) * 0.2, false); hCol(12.9, 23.55, 0.26, 0.26, 0, UPF, UPF + 0.8) }
      hWeb(9.12, TOPC - 0.08, 23.88, Math.PI / 4); hWeb(20.88, TOPC - 0.08, 23.88, -Math.PI / 4); hWeb(9.12, TOPC - 0.08, 10.12, Math.PI * 0.75)
      // ---- o quarto de vestir: os guarda-roupas, o manequim com o vestido, o espelho ----
      hWardrobe(7.2, UPF, 10 + WT / 2 + 0.32, 0); hWardrobe(1.6, UPF, 10 + WT / 2 + 0.32, 0)
      { const g = hGrp(2.7, UPF, 12.8, 2.6) // o manequim de costura com o vestido de luto, virado para a porta
        fp(g, cyg(0.16, 0.2, 0.04, 10), FM.dark, 0, 0.02, 0); fp(g, cyg(0.015, 0.015, 1.1, 6), FM.iron, 0, 0.6, 0)
        fp(g, new THREE.ConeGeometry(0.46, 0.95, 12, 1, true), FM.cloth, 0, 0.62, 0); fp(g, cyg(0.13, 0.17, 0.5, 10), FM.cloth, 0, 1.33, 0); fp(g, cyg(0.16, 0.13, 0.12, 10), FM.cloth, 0, 1.6, 0)
        fp(g, cyg(0.035, 0.035, 0.1, 8), FM.linen, 0, 1.71, 0); fp(g, new THREE.SphereGeometry(0.06, 8, 6), FM.dark, 0, 1.8, 0)
        hCol(2.7, 12.8, 0.4, 0.4, 0, UPF, UPF + 1.8) }
      { const g = hGrp(9 - WT / 2 - 0.03, UPF, 12.4, -Math.PI / 2); fp(g, bxg(0.8, 1.7, 0.05), FM.gold, 0, 1.15, 0); fp(g, bxg(0.68, 1.58, 0.012), FM.mirror, 0, 1.15, 0.03, 0, 0, 0, false) }
      for (const [x, y, z] of [[5.0, 0, 13.6], [5.45, 0, 13.55], [5.2, 0.3, 13.6]]) fp(CA.g, cyg(0.2, 0.2, 0.28, 12), FM.velG, x, UPF + y + 0.14, z) // as caixas de chapéu
      hCurtains(WT / 2 + 0.05, 12.0, Math.PI / 2, UPF + 0.6, 1.0, FM.curtW)
      hWeb(0.12, TOPC - 0.08, 13.88, Math.PI * 0.25)
      // ---- o quarto principal: a cama de dossel, o guarda-roupa, o espelho de pé coberto, a cômoda (a última lamparina) ----
      { const g = hGrp(1.15, UPF, 19.0, Math.PI / 2)
        fp(g, bxg(1.7, 0.32, 2.1), FM.wood, 0, 0.3, 0); fp(g, bxg(1.6, 0.2, 2.0), FM.linen, 0, 0.55, 0.02); fp(g, bxg(1.66, 0.05, 1.35), FM.sheet, 0, 0.67, 0.35)
        for (const a of [-0.42, 0.42]) fp(g, bxg(0.62, 0.13, 0.36), FM.linen, a, 0.71, -0.78)
        fp(g, bxg(1.72, 1.15, 0.08), FM.dark, 0, 0.95, -1.06)
        for (const a of [-1, 1]) for (const b of [-1, 1]) fp(g, bxg(0.09, 2.35, 0.09), FM.dark, a * 0.84, 1.17, b * 1.04)
        for (const a of [-1, 1]) { fp(g, bxg(0.06, 0.1, 2.16), FM.dark, a * 0.84, 2.3, 0); fp(g, bxg(1.74, 0.1, 0.06), FM.dark, 0, 2.3, a * 1.04) }
        for (const [a, b, r] of [[-0.84, 1.04, 0.3], [0.84, 1.04, -0.3], [-0.84, -1.04, 0.2], [0.84, -1.04, -0.2]]) { const c = fp(g, new THREE.PlaneGeometry(0.6, 1.9), FM.curtW, a * 0.97, 1.3, b, 0, r + (a < 0 ? Math.PI / 2 : -Math.PI / 2), 0, false); CA.curtains.push({ m: c, ph: a * 3 + b, base: 0 }) }
        hCol(1.15, 19.0, 0.88, 1.1, Math.PI / 2, UPF, UPF + 2.4) }
      { const g = hGrp(0.42, UPF, 17.4); fp(g, bxg(0.42, 0.55, 0.38), FM.wood, 0, 0.275, 0); hCandle(g, 0.05, 0.55, 0.05, true, 0.11); hCol(0.42, 17.4, 0.22, 0.2, 0, UPF, UPF + 0.6)
        CA.glows.push({ p: V3(0.5, UPF + 0.8, 17.4), r: 3.4, c: new THREE.Color('#ffb066').convertSRGBToLinear().multiplyScalar(0.9), k: 1, warm: true, flick: 1 }) }
      hWardrobe(7.2, UPF, 14 + WT / 2 + 0.32, 0)
      { const g = hGrp(7.7, UPF, 21.6, -2.4) // o espelho de pé, com o pano preto escorregando
        fp(g, bxg(0.62, 1.6, 0.05), FM.gold, 0, 1.0, 0); fp(g, bxg(0.52, 1.5, 0.012), FM.mirror, 0, 1.0, 0.03, 0, 0, 0, false)
        for (const a of [-1, 1]) fp(g, bxg(0.05, 0.05, 0.5), FM.dark, a * 0.25, 0.03, 0.05); fp(g, bxg(0.66, 0.9, 0.03), FM.cloth, 0.04, 1.42, 0.06, 0, 0, 0.12)
        hCol(7.7, 21.6, 0.36, 0.3, -2.4, UPF, UPF + 1.8) }
      { const g = hGrp(4.5, UPF, HZ - WT / 2 - 0.26, Math.PI) // a cômoda: a lamparina e o kit
        fp(g, bxg(1.35, 0.06, 0.5), FM.light, 0, 0.89, 0); fp(g, bxg(1.3, 0.82, 0.46), FM.wood, 0, 0.45, 0)
        for (const y of [0.25, 0.5, 0.74]) { fp(g, bxg(1.18, 0.2, 0.02), FM.dark, 0, y, 0.235); for (const a of [-0.3, 0.3]) fp(g, new THREE.SphereGeometry(0.02, 6, 4), FM.brass, a, y, 0.25, 0, 0, 0, false) }
        hCol(4.5, HZ - WT / 2 - 0.26, 0.68, 0.26, Math.PI, UPF, UPF + 1.0) }
      hRug(3.6, UPF, 19.0, 0, 2.2, 3.2)
      hCurtains(2.5, HZ - WT / 2 - 0.05, Math.PI, UPF + 0.6, 1.0, FM.curtW); hCurtains(6.5, HZ - WT / 2 - 0.05, Math.PI, UPF + 0.6, 1.0, FM.curtW)
      hWeb(0.12, TOPC - 0.08, 14.12, Math.PI * 0.75); hWeb(8.88, TOPC - 0.08, 23.88, -Math.PI * 0.25)
      // ---- o corredor dos fundos (em cima): comprido e escuro, uma janela de luar em cada ponta; no meio, a porta do berçário ----
      hRug(8.0, UPF, 8.2, Math.PI / 2, 1.2, 11); hRug(24.5, UPF, 8.2, Math.PI / 2, 1.2, 11)
      { const g = hGrp(13.6, UPF, CZ + WT / 2 + 0.22); fp(g, bxg(0.9, 0.04, 0.4), FM.light, 0, 0.78, 0); for (const a of [-1, 1]) for (const b of [-1, 1]) fp(g, bxg(0.04, 0.76, 0.04), FM.dark, a * 0.4, 0.38, b * 0.16)
        fp(g, cyg(0.07, 0.09, 0.03, 10), FM.brass, 0.2, 0.815, 0, 0, 0, 0, false); fp(g, cyg(0.03, 0.05, 0.22, 10), FM.chimney, 0.2, 0.94, 0, 0, 0, 0, false); hCol(13.6, CZ + WT / 2 + 0.22, 0.46, 0.22, 0, UPF, UPF + 0.85) }
      { const g = hGrp(27.6, UPF, 7.1, 0.6) // o cavalinho de balanço, perto da porta da Garota
        fp(g, bxg(0.12, 0.16, 0.5), FM.velW, 0, 0.42, 0); fp(g, bxg(0.1, 0.22, 0.14), FM.velW, 0, 0.58, 0.28, -0.4, 0, 0); for (const a of [-1, 1]) for (const b of [-1, 1]) fp(g, bxg(0.03, 0.3, 0.03), FM.wood, a * 0.05, 0.2, b * 0.18)
        for (const a of [-1, 1]) fp(g, new THREE.TorusGeometry(0.5, 0.015, 4, 12, 1.2), FM.wood, a * 0.06, 0.53, 0, 0, Math.PI / 2, -Math.PI / 2 - 0.6, false) }
      { const g = hGrp(6.2, UPF + 0.02, 9.2, 0.4); fp(g, bxg(0.6, 0.04, 0.8), FM.gold, 0, 0, 0, -Math.PI / 2 + 0.05, 0, 0, false); fp(g, new THREE.PlaneGeometry(0.5, 0.7), std({ map: hPortraitTex(1151, 'menina') }), 0, 0.025, 0, -Math.PI / 2, 0, 0, false) } // um retrato caído de cara para cima
      for (const [x, k, sd] of [[2.5, 'dama', 1153], [18.5, 'pai', 1157], [30.0, 'menina', 1159]]) hPortrait(x, UPF + 1.7, 10 - WT / 2 - 0.01, Math.PI, 0.5, 0.65, k, sd)
      CA.glows.push({ p: V3(0.9, UPF + 1.35, 8.2), r: 3.4, c: new THREE.Color('#9fb8e8').convertSRGBToLinear().multiplyScalar(0.9), k: 1, moon: true }) // o luar da janela do fim, a oeste
      CA.glows.push({ p: V3(HX - 0.9, UPF + 1.35, 8.2), r: 3.0, c: new THREE.Color('#9fb8e8').convertSRGBToLinear().multiplyScalar(0.7), k: 1, moon: true })
      hWeb(0.12, TOPC - 0.08, CZ + 0.12, Math.PI * 0.75); hWeb(HX - 0.12, TOPC - 0.08, 9.88, -Math.PI * 0.25); hWeb(15.5, TOPC - 0.08, CZ + 0.12, Math.PI * 0.75)
      // a porta do berçário: a luz quente vazando por baixo e o Luto escorrendo para o corredor
      { const zf = 10 - WT / 2, bx = 22.5
        CA.leak = fp(CA.g, new THREE.PlaneGeometry(0.98, 0.02), FM.lumo, bx, UPF + 0.012, zf - 0.002, 0, Math.PI, 0, false)
        const sp = fp(CA.g, new THREE.PlaneGeometry(1.8, 1.2), new THREE.MeshBasicMaterial({ map: spillTex, color: new THREE.Color('#ffb066').convertSRGBToLinear(), transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }), bx, UPF + 0.01, zf - 0.6, -Math.PI / 2, 0, Math.PI, false); CA.spill = sp
        const lm = glossy('#050304', 70, '#2a2226')
        fp(CA.g, new THREE.CircleGeometry(1, 22).scale(0.75, 0.32, 1), lm, bx + 0.15, UPF + 0.008, zf - 0.28, -Math.PI / 2, 0, 0, false)
        for (let i = 0; i < 4; i++) fp(CA.g, new THREE.CircleGeometry(1, 12).scale(0.06, 0.28 + i * 0.07, 1), lm, bx - 0.3 + i * 0.26, UPF + 0.009, zf - 0.5 - i * 0.06, -Math.PI / 2, 0, (i - 1.5) * 0.25, false)
        CA.glows.push({ p: V3(bx, UPF + 0.25, zf - 0.5), r: 2.6, c: new THREE.Color('#ffb066').convertSRGBToLinear().multiplyScalar(1.3), k: 1, warm: true, flick: 3 }) }
      // os kits e as lamparinas (pontos de retorno)
      CA.kits = [hKit(30.4, 0.945, 14 + WT / 2 + 0.25), hKit(29.9, 0.88, 7.45), hKit(4.95, UPF + 0.92, HZ - WT / 2 - 0.26)]
      CA.cps = {
        varanda: Object.assign(hLamp('varanda', 16.7, 1.95, HZ + WT / 2 + 0.06, true), { name: 'varanda', pos: V3(15, 0, 25.15), yaw: Math.PI }),
        salao: Object.assign(hLamp('salao', 9 + WT / 2 + 0.25, 0.905, 17.0), { name: 'salão', pos: V3(10.7, 0, 17.6), yaw: Math.PI * 0.55 }),
        patamar: Object.assign(hLamp('patamar', 10.8, UPF + 0.905, 10 + WT / 2 + 0.25), { name: 'patamar', pos: V3(12.6, UPF, 11.8), yaw: Math.PI * 0.7 }),
        principal: Object.assign(hLamp('principal', 4.05, UPF + 0.92, HZ - WT / 2 - 0.26), { name: 'quarto principal', pos: V3(4.5, UPF, 21.4), yaw: Math.PI }),
      }
    }

    // ---------- o luar: feixes desenhados nas janelas da frente, as manchas no chão e a poeira dentro deles ----------
    const hBeamMat = new THREE.ShaderMaterial({ uniforms: { uK: CA.beamK, uT: CA.beamT, uCol: { value: new THREE.Color('#a9c2f0').convertSRGBToLinear() }, uFogD: { value: 0.03 } },
      vertexShader: beamMat.vertexShader, fragmentShader: beamMat.fragmentShader, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })
    const hPoolMat = new THREE.MeshBasicMaterial({ map: poolTex, color: new THREE.Color('#8fb0e8').convertSRGBToLinear(), transparent: true, opacity: 0.26, blending: THREE.AdditiveBlending, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -8 })
    function hBeams() {
      const bp = [], bv = [], bn = [], pp = [], pu = [], boxes = []
      const floorOf = (W) => (W[0] === 1 && W[7] !== 'arco' ? UPF : 0)
      for (const W of HWIN) {
        if (W[1] !== 'x' || W[2] !== HZ || !W.hole || W[7] === 'arco') continue
        const ho = W.hole, fy = floorOf(W) + 0.012, z0 = HZ - 0.02
        const r = roomAt(W[0], W[3], HZ - 0.1); if (!r || !r.open) continue
        const um = (ho.u0 + ho.u1) / 2, vm = (ho.v0 + ho.v1) / 2, g = 0.05
        const panes = W[7] === 'arco' ? [[ho.u0 + 0.05, ho.u1 - 0.05, ho.v0 + 0.05, ho.v1 - 0.46]] : [[ho.u0 + 0.05, um - g, ho.v0 + 0.05, vm - g], [um + g, ho.u1 - 0.05, ho.v0 + 0.05, vm - g], [ho.u0 + 0.05, um - g, vm + g, ho.v1 - 0.05], [um + g, ho.u1 - 0.05, vm + g, ho.v1 - 0.05]]
        const proj = (x, y) => { const t = (y - fy) / -MOOND.y; return [x + MOOND.x * t, fy, z0 + MOOND.z * t] }
        for (const [u0, u1, v0, v1] of panes) {
          const A = [[u0, v0, z0], [u1, v0, z0], [u1, v1, z0], [u0, v1, z0]], F = A.map((p) => proj(p[0], p[1]))
          for (let e = 0; e < 4; e++) {
            const a0 = A[e], a1 = A[(e + 1) % 4], b0 = F[e], b1 = F[(e + 1) % 4]
            _qv.set(a1[0] - a0[0], a1[1] - a0[1], a1[2] - a0[2]).cross(_qv2.set(b0[0] - a0[0], b0[1] - a0[1], b0[2] - a0[2])).normalize()
            for (const [p, v] of [[a0, 0], [a1, 0], [b1, 1], [a0, 0], [b1, 1], [b0, 1]]) { bp.push(p[0], p[1], p[2]); bv.push(v); bn.push(_qv.x, _qv.y, _qv.z) }
          }
          for (const [p, uv] of [[F[0], [0, 0]], [F[1], [1, 0]], [F[2], [1, 1]], [F[0], [0, 0]], [F[2], [1, 1]], [F[3], [0, 1]]]) { pp.push(p[0], p[1], p[2]); pu.push(uv[0], uv[1]) }
          boxes.push({ a: A, f: F })
        }
        if (W[7] !== 'arco') CA.glows.push({ p: V3(um + MOOND.x * 1.6, floorOf(W) + 0.5, HZ - 1.9), r: 2.4, c: new THREE.Color('#9fb8e8').convertSRGBToLinear().multiplyScalar(0.55), k: 1, moon: true })
      }
      { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(bp, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(bn, 3)); g.setAttribute('aV', new THREE.Float32BufferAttribute(bv, 1)); const m = new THREE.Mesh(g, hBeamMat); m.frustumCulled = false; m.renderOrder = 3; CA.g.add(m) }
      { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pp, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(pu, 2)); const m = new THREE.Mesh(g, hPoolMat); m.renderOrder = 2; CA.g.add(m) }
      // a poeira: pontinhos claros boiando dentro dos feixes
      const N = 260, pos = new Float32Array(N * 3), seed = new Float32Array(N * 4)
      for (let i = 0; i < N; i++) { seed[i * 4] = Math.random(); seed[i * 4 + 1] = Math.random(); seed[i * 4 + 2] = Math.random() * 6.28; seed[i * 4 + 3] = (Math.random() * boxes.length) | 0 }
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
      const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color: new THREE.Color('#dfe8ff').convertSRGBToLinear(), size: 0.028, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false })); pts.frustumCulled = false; CA.g.add(pts)
      CA.dust = { N, pos, seed, geo, boxes, pts }
    }
    function dustTick(t) {
      const D2 = CA.dust; if (!D2 || !D2.boxes.length) return
      for (let i = 0; i < D2.N; i++) {
        const b = D2.boxes[D2.seed[i * 4 + 3]], u = D2.seed[i * 4], v = D2.seed[i * 4 + 1], ph = D2.seed[i * 4 + 2], w = (D2.seed[i * 4 + 1] + t * 0.01 + ph) % 1
        const a = b.a, f = b.f, ax = a[0][0] + (a[1][0] - a[0][0]) * u, ay = a[0][1] + (a[3][1] - a[0][1]) * v, fx = f[0][0] + (f[1][0] - f[0][0]) * u, fz = f[0][2] + (f[3][2] - f[0][2]) * v
        D2.pos[i * 3] = ax + (fx - ax) * w + Math.sin(t * 0.3 + ph) * 0.08
        D2.pos[i * 3 + 1] = ay + (f[0][1] - ay) * w + Math.sin(t * 0.21 + ph * 2) * 0.1
        D2.pos[i * 3 + 2] = a[0][2] + (fz - a[0][2]) * w
      }
      D2.geo.attributes.position.needsUpdate = true
    }

    // ---------- montar (na tela de carregamento, uma parte por quadro) ----------
    function casaBuildA() { CA.g = new THREE.Group(); CA.g.name = 'casa'; CA.cols.length = 0; CA.glows.length = 0; CA.swing.length = 0; CA.curtains.length = 0; CA.flames.length = 0; hWalls(); hFloors(); hRails() }
    function casaBuildB() { hOutside(); shBuild(); hDoors() }
    function casaBuildC() {
      hFurnish(); hBeams(); casaEncs()
      CA.eglow = [0, 1, 2, 3, 4].map(() => ({ p: V3(), r: 2.6, c: new THREE.Color('#5fd8ff').convertSRGBToLinear().multiplyScalar(0.7), k: 0 }))
      CA.g.traverse((o) => { if (o.isMesh && o.material && o.material.alphaTest > 0 && o.material.map) { o.material.map.generateMipmaps = false; o.material.map.minFilter = THREE.NearestFilter } })
      litMark(CA.g, (o) => (o.userData.env ? 'env' : 'prop'))
      for (const [m, k] of [[HM.pedra, 0.04], [HM.ladrilho, 0.03], [HM.parquet, 0.035], [HM.tabua, 0.04], [HM.verde, 0.02], [HM.vinho, 0.02], [HM.lambri, 0.05], [HM.fachada, 0.03]]) addBump(m, k)
      CA.built = true
    }

    // ---------- os encontros: três Espectrais (jantar, patamar), cada um preso à sua área, e o Glutão na cozinha ----------
    // area: por onde ele anda (retângulos no andar dele); reach: onde você conta como "dentro"; wake: onde ele acorda; home: de onde ele sobe
    const ENC_DEF = [
      { id: 'jantar', name: 'Sala de jantar', doors: ['jantar', 'copa'], spot: [23.2, 22.6], y: 0, area: [[21.7, 14.7, 31.3, 23.3]], reach: [[21, 14, HX, HZ]], wake: [21.05, 14, HX, HZ], home: [[30.6, 16.2]] },
      { id: 'cozinha', name: 'Cozinha', kind: 'glu', doors: ['cozinha', 'corrCoz'], spot: [23.4, 8.2], y: 0, area: [[22.4, 1.8, 27.6, 8.9]], reach: [[21, 0, HX, 10]], wake: [21.4, 0.4, HX, 9.6], home: [[25.2, 4.2]] },
      { id: 'patamar', name: 'Patamar', doors: ['patCorr', 'principal'], spot: [11.2, 11.8], y: UPF, area: [[9.5, 10.6, 20.5, 12.7], [18.4, 13.4, 20.6, 23.6], [9.4, 13.4, 11.6, 23.6], [12.3, 21.5, 17.7, 23.6]], reach: [[9, 10, 21, 13.1], [9, 13.1, 12, HZ], [18, 13.1, 21, HZ], [12, 21.1, 18, HZ], [ST.x0, 13.1, ST.x1, 15.2]], wake: [9, 10, 21, 13.1], home: [[19.6, 21.5], [19.6, 17.0]], cp: 'patamar' },
    ]
    const inR = (r, x, z, m = 0) => x >= r[0] - m && x <= r[2] + m && z >= r[1] - m && z <= r[3] + m
    const lvlOf = (y) => (y > 1.6 ? 1 : 0)
    function casaEncs() {
      CA.encs = ENC_DEF.map((d) => Object.assign({}, d, { st: 'sleep', foes: [] })); CA.foes = []
      for (const en of CA.encs) en.home.forEach((h) => { const glu = en.kind === 'glu', e = { kind: glu ? 'glu' : 'esp', o: null, hp: glu ? 300 : BT.esp.vida, max: glu ? 300 : BT.esp.vida, // o Glutão da casa é opcional: 300 de vida (400 no Bando)
        dead: false, atk: false, en, home: V3(h[0], 0, h[1]), cen: V3(h[0], 0, h[1]), sunk: true, away: 0, house: true, gCd: 2 }; en.foes.push(e); CA.foes.push(e) })
    }
    function encAt(x, z, y) { for (const en of CA.encs) { if (en.y > 1 ? y < 2.3 : y > 1.9) continue; if (en.reach.some((r) => inR(r, x, z))) return en } return null }
    function clampArea(en, v) { // para dentro da área dele (o retângulo mais perto)
      let bx = v.x, bz = v.z, bd = Infinity
      for (const r of en.area) { const x = cl(v.x, r[0], r[2]), z = cl(v.z, r[1], r[3]), d = (x - v.x) * (x - v.x) + (z - v.z) * (z - v.z); if (d < bd) { bd = d; bx = x; bz = z } }
      v.x = bx; v.z = bz; return v
    }
    const HPOOL = [espectral, espPrey, ...espPool] // os cinco modelos: só ganha um quem está acordado e em cena
    function grabModel() { const used = new Set(); for (const e of CA.foes) if (e.o) used.add(e.o); return HPOOL.find((o) => !used.has(o)) || null }
    function houseAR(e) {
      return { owner: e, center: e.cen, target: CA.tgt, lunge: BT.esp.bote, clamp: (v) => clampArea(e.en, v),
        may: (S) => CA.inside === e.en && foeMay(e, S),
        bite: (S) => { if (e.dead) return; const dx = S.pos.x - CA.tgt.x, dy = S.pos.y + e.en.y - CA.tgt.y, dz = S.pos.z - CA.tgt.z, d = Math.hypot(dx, dy, dz); if (d < 1.15) blog('mordida', d, hurtPlayer(BT.esp.mordida, 'mordida', _qv3.set(S.pos.x, e.en.y + S.pos.y, S.pos.z))); else blog('mordida', d, null) },
        done: () => foeDone(e) }
    }
    function houseGluAR(e) { // o Glutão na cozinha: a pancada e a investida batem em você; a investida para antes da parede
      return { owner: e, center: e.cen, target: CA.tgt, lunge: BT.esp.bote, clamp: (v) => clampArea(e.en, v), may: () => false, bite: () => {}, done: () => {},
        slam: (p) => gluSlam(e, p), charging: (S) => gluCharging(e, S),
        reach: (S) => { const r = Math.min(4.4, Math.max(1.6, Math.hypot(CA.tgt.x - S.pos.x, CA.tgt.z - S.pos.z) - 0.4)); _qv3.set(S.from.x + S.dir.x * r, 0, S.from.z + S.dir.z * r); clampArea(e.en, _qv3); return Math.max(0.3, Math.hypot(_qv3.x - S.from.x, _qv3.z - S.from.z)) } }
    }
    function riseSpot(e) { // de onde ele sobe: dentro da área dele, uns 6 m de você (dá para ver ele se formar) e longe dos outros
      const en = e.en, best = _qv2.copy(e.home); let bs = -1e9
      for (let i = 0; i < 40; i++) {
        let x = e.home.x, z = e.home.z
        if (i) { const r = en.area[(R() * en.area.length) | 0]; x = r[0] + 0.4 + R() * Math.max(0, r[2] - r[0] - 0.8); z = r[1] + 0.4 + R() * Math.max(0, r[3] - r[1] - 0.8) }
        let sc = -Math.abs(Math.hypot(x - P.pos.x, z - P.pos.z) - 6) + (i ? 0 : 1)
        for (const f of en.foes) if (f !== e && f.o && !f.dead) { const df = Math.hypot(x - f.o.S.pos.x, z - f.o.S.pos.z); if (df < 2.2) sc -= (2.2 - df) * 3 }
        if (sc > bs) { bs = sc; best.set(x, 0, z) }
      }
      return best
    }
    function foeRise(e) { // sobe do assoalho com um sopro de ectoplasma; enquanto se forma (0,9 s) ainda não leva tiro
      if (e.kind === 'glu') return gluRise(e)
      const o = grabModel(); if (!o) return false
      const h = riseSpot(e)
      e.o = o; e.sunk = false; e.away = 0; e.atk = false; e.riseT = 0.9; e.cen.copy(h)
      o.ctl.pull = null; o.ctl.arena = houseAR(e); o.group.position.y = e.en.y; o.group.visible = true; o.group.updateMatrixWorld(true)
      o.reset(); o.S.R = 2.3 + R() * 0.9
      o.place(V3(h.x, -0.75, h.z), Math.atan2(P.pos.x - h.x, P.pos.z - h.z))
      o.S.ang = Math.atan2(h.z - P.pos.z, h.x - P.pos.x); o.S.ph = 'daze'; o.S.pt = 0; o.S.nextAtk = 1.8 + R() * 1.4
      ofxBurst(2, _qv.set(h.x, e.en.y + 0.15, h.z), 28, 2.2, 0.9, UPV, 0.9, -0.8, 2.5)
      SFX.esp('shriek'); return true
    }
    function gluRise(e) { // o Glutão sobe do chão da cozinha, de braços abertos; o núcleo dele está vazio (não cospe Espectral nesta demo)
      const o = glutao, h = riseSpot(e)
      e.o = o; e.sunk = false; e.away = 0; e.riseT = 0.6; e.gCd = 3.2; e.cen.copy(h)
      o.ctl.pull = null; o.reset(); o.ctl.arena = houseGluAR(e); o.S.souls = 0; o.S.spitT = 1e9
      o.S.home.set(h.x, 0, h.z); o.S.pos.copy(o.S.home); o.S.yaw = Math.atan2(P.pos.x - h.x, P.pos.z - h.z)
      o.S.ph = 'rise'; o.S.pt = 0; o.S.sink = 1; o.group.position.y = 0; o.group.visible = true; o.group.updateMatrixWorld(true)
      SFX.esp('groan'); SFX.esp('swell'); C.shake = Math.max(C.shake, 0.4)
      CA.freezeT = 1.0 // o agente para por 1 s, olhando ele subir
      return true
    }
    function gluHouseBrain(e, dt) { // anda atrás de você dentro da cozinha; de perto, a pancada; de longe, a investida; você saiu, ele volta para o meio
      const o = e.o, S = o.S
      if (e.dead || S.ph === 'rise' || S.exploded) return
      e.gCd -= dt
      const inside = CA.inside === e.en && P.dead < 0
      const tx = inside ? P.pos.x : e.home.x, tz = inside ? P.pos.z : e.home.z, dx = tx - S.pos.x, dz = tz - S.pos.z, d = Math.hypot(dx, dz) || 1
      if (S.ph === 'slam' && S.pt < 1.05 && d > 1.6 && inside) { S.home.x += dx / d * 1.5 * dt; S.home.z += dz / d * 1.5 * dt; clampArea(e.en, S.home) }
      if (S.ph !== 'idle') return
      if (d > (inside ? 2.5 : 0.3)) { S.home.x += dx / d * BT.glu.anda * dt; S.home.z += dz / d * BT.glu.anda * dt; clampArea(e.en, S.home) }
      if (!inside || e.gCd > 0) return
      if (d > BT.glu.longe) { S.chHit = false; o.trigger('charge'); e.gCd = 2.4 }
      else if (d < BT.glu.perto) { o.trigger('slam'); e.gCd = 2.8 }
    }
    function foeRelease(e) {
      const o = e.o; if (!o) return
      o.ctl.arena = null; o.ctl.pull = null; o.group.visible = false; o.lightOff(); o.reset(); o.group.position.y = 0; e.o = null
      if (e.kind === 'glu') { o.S.home.set(0, 0, -0.15); o.S.pos.copy(o.S.home); o.S.yaw = 0; o.S.sink = 0 }
      if (BD.token === e) { BD.token = null; BD.atkCd = 0.8 } e.atk = false
    }
    function foeSink(e) { const o = e.o; if (!o) return; ofxBurst(2, _qv.set(o.S.pos.x, e.en.y + o.S.pos.y, o.S.pos.z), 20, 1.6, 0.7, null, 1, -0.5, 2.5); SFX.esp('hiss'); foeRelease(e); e.sunk = true }
    function encDoors(en, shut) { // na briga, as portas da sala fecham (as abertas batem) e só abrem quando ela fica limpa
      let slam = false
      for (const id of en.doors || []) {
        const D2 = CA.doors.find((d2) => d2.id === id); if (!D2) continue
        if (shut) { if (D2.st === 'battle') continue; D2.pre = D2.st; if (D2.st === 'open') slam = true; D2.st = 'battle'; D2.want = 0; D2.col.off = false; D2.leafCols.forEach((c) => (c.off = true)) }
        else if (D2.st === 'battle') { D2.st = D2.pre === 'open' ? 'open' : 'closed'; if (D2.st === 'open') { D2.want = D2.a; D2.col.off = true; leafCols(D2) } }
      }
      if (slam) { SFX.demo('portaBate'); C.shake = Math.max(C.shake, 0.2) }
    }
    function encWake(en) {
      en.st = 'awake'; encDoors(en, true); for (const e of en.foes) if (!e.dead) foeRise(e)
      say(en.kind === 'glu' ? 'Cozinha: o Glutão. Atire no núcleo quando ele erguer os braços' : en.foes.length > 1 ? `${en.name}: dois Espectrais` : `${en.name}: um Espectral`, 3)
      C.shake = Math.max(C.shake, 0.15)
    }
    function encClear(en) {
      en.st = 'clear'; encDoors(en, false)
      if (en.kind === 'glu') { P.kits++; SFX.demo('kit'); say('O Glutão caiu: +1 kit (F para usar)', 3.2) }
      else if (en.cp) cpLight(en.cp); else say(`${en.name}: limpa`, 2.4)
    }
    function encTick(t, dt) {
      CA.inside = encAt(P.pos.x, P.pos.z, P.pos.y)
      for (const en of CA.encs) {
        if (en.st === 'sleep') { if (CA.inside === en && P.dead < 0 && inR(en.wake, P.pos.x, P.pos.z)) encWake(en); continue }
        if (en.st !== 'awake') continue
        for (const e of en.foes) {
          if (e.dead) continue
          if (e.sunk) { if (CA.inside === en && P.dead < 0) foeRise(e); continue }
          if (e.kind === 'glu') { gluHouseBrain(e, dt); continue }
          if (CA.inside === en) { e.cen.set(P.pos.x, 0, P.pos.z); e.away = 0 } else { e.cen.copy(e.home); e.away += dt; if (e.away > 6 && !e.atk && BD.token !== e) foeSink(e) } // você saiu: ele volta para o lugar e, sozinho, afunda
        }
        if (en.foes.every((e) => e.dead && (e.kind !== 'glu' || !e.o || e.o.S.exploded))) encClear(en)
      }
      for (const e of CA.foes) if (e.o && e.o.group.visible && !(e.kind === 'glu' && e.o.S.gone)) e.o.update(t, dt)
      for (const e of CA.foes) if (e.o && e.dead && (e.kind === 'glu' ? e.o.S.gone : !e.o.group.visible)) foeRelease(e) // estourou e sumiu: o modelo volta para o monte
      BD.nSph = 0
      for (const e of CA.foes) { // as esferas de acerto (o modelo do andar de cima está deslocado em y)
        if (e.riseT > 0) e.riseT -= dt
        if (e.dead || !e.o || !e.o.group.visible || e.riseT > 0) continue
        const o = e.o, y = o.group.position.y
        if (e.kind === 'glu') {
          if (o.S.exploded) continue
          o.coreG.getWorldPosition(_qv); addSph(_qv, 0.3, 'core', e); addSph(_qv.add(V3(0, 0.55, 0)), 0.55, 'enemy', e)
          addSph(o.head.getWorldPosition(_qv), 0.42, 'enemy', e); o.arms.forEach((a) => addSph(a.upper.getWorldPosition(_qv), 0.3, 'enemy', e))
          addSph(_qv.set(o.S.pos.x, Math.max(0.5, 0.95 - o.S.sink * 0.9), o.S.pos.z), 0.55, 'enemy', e); continue
        }
        addSph(o.head.getWorldPosition(_qv), 0.21, 'ehead', e)
        for (const [k, r] of [[2, 0.16], [5, 0.13], [8, 0.11]]) { _qv.copy(o.P[k]); _qv.y += y; addSph(_qv, r, 'enemy', e) }
      }
    }
    // ---------- a Mãe, de passagem: no corredor dos fundos de cima, ela vem do fim do corredor e entra pela porta do berçário ----------
    function maeWalkStart() {
      CA.maeDone = true
      CA.mae = { t: 0, x: 29.2, z: 8.0, yaw: -Math.PI / 2, ritmo: ui.ritmo, inT: -1 }
      ui.ritmo = 'andar'; maeGroup.visible = true; maeGroup.scale.setScalar(1)
      maeGroup.position.set(CA.mae.x, UPF, CA.mae.z); maeGroup.rotation.y = CA.mae.yaw; maeGroup.updateMatrixWorld(true)
      SFX.idle('maeInhale')
    }
    function maeWalkStop() {
      if (!CA.mae) return
      ui.ritmo = CA.mae.ritmo; CA.mae = null
      maeGroup.visible = false; maeGroup.position.set(0, 0, 0); maeGroup.rotation.y = 0
    }
    function maeWalkTick(t, dt) { // do fim do corredor (leste) até a porta do berçário; vira, a porta abre um palmo, ela entra e a porta bate
      const M = CA.mae; if (!M) return
      M.t += dt
      const bd = CA.doors.find((d2) => d2.id === 'bebe')
      if (M.x > BEBE.x + 0.02) M.x = Math.max(BEBE.x, M.x - 0.95 * dt)
      else {
        M.yaw = dAng(0, M.yaw + cl(dAng(M.yaw, 0), -2.5 * dt, 2.5 * dt))
        if (Math.abs(dAng(M.yaw, 0)) < 0.3) { if (M.inT < 0) { M.inT = 0; if (bd) bd.want = 0.6; SFX.demo('portaAbre') } M.z = Math.min(10.3, M.z + 0.6 * dt) }
      }
      if (M.inT >= 0) M.inT += dt
      maeGroup.position.set(M.x, UPF, M.z); maeGroup.rotation.y = M.yaw
      animate(t, dt); simHair(dt)
      if (M.z >= 10.25 || M.t > 14) { // entrou: a porta bate atrás dela
        if (bd) { bd.want = 0; bd.shake = 1 }
        SFX.demo('portaBate'); C.shake = Math.max(C.shake, 0.15)
        maeWalkStop()
      }
    }

    // ---------- as lamparinas: pontos de retorno ----------
    function cpLight(id, quiet) {
      const c = CA.cps[id]; if (!c) return
      CA.cp = id
      if (!c.lit) { c.lit = true; if (!quiet) { SFX.fps('lantern'); say(`Ponto de retorno: ${c.name}`, 3) } }
    }

    // ---------- portas: E abre, emperrada ou trancada só treme e avisa; a do berçário leva para a luta ----------
    function doorNear() {
      let best = null, bd = 1.7
      const fx = Math.sin(C.yaw), fz = Math.cos(C.yaw)
      for (const D2 of CA.doors) {
        if (D2.st === 'open' || Math.abs(P.pos.y - D2.yb) > 0.9) continue
        const dx = D2.cx - P.pos.x, dz = D2.cz - P.pos.z, d = Math.hypot(dx, dz)
        if (d > bd || (d > 0.5 && (dx * fx + dz * fz) / d < 0.35)) continue
        best = D2; bd = d
      }
      return best
    }
    function casaUse() {
      const D2 = P.dead < 0 && D.mode === 'fight' ? doorNear() : null
      CA.near = D2
      const txt = !D2 ? '' : D2.st === 'closed' ? 'E · abrir' + (D2.name ? ' ' + D2.name : ' a porta') : D2.st === 'boss' ? 'E · entrar no berçário' : 'E · tentar abrir'
      if (promptEl.textContent !== txt) promptEl.textContent = txt
      if (!press('KeyE') || !D2) return
      if (D2.st === 'closed') { D2.st = 'open'; D2.want = D2.a; D2.col.off = true; leafCols(D2); SFX.fps('door') }
      else if (D2.st === 'boss') casaToFight()
      else { D2.shake = 1; SFX.fps('rattle'); say(D2.st === 'battle' ? 'Fechada: só abre quando a sala estiver limpa' : D2.msg || 'Trancada', 3) }
    }

    // ---------- o chão de cada lugar (térreo, escadaria, andar de cima, varanda, degraus, jardim) ----------
    function casaFloor(x, z, y) {
      if (x >= ST.x0 - 0.02 && x <= ST.x1 + 0.02 && z >= ST.z0 - 0.05 && z <= ST.z1 + 0.05 && (y > 0.05 || z > ST.z1 - 1.2)) { const s = stairY(z); if (Math.abs(s - y) < 0.9 || y < 0.3) return s }
      if (y > 1.6) return inVaoXZ(x, z) ? null : UPF // o vão (as balaustradas não deixam chegar)
      if (x >= 11.9 && x <= 18.1 && z >= HZ && z <= 25.75) return 0
      if (z > 25.75 && z < 26.65 && x > 13.6 && x < 16.4) return -0.45 * cl((z - 25.75) / 0.9)
      if (z > HZ || x < 0 || x > HX) return YARD
      return 0
    }
    function casaY() { const y = casaFloor(P.pos.x, P.pos.z, P.pos.y); if (y !== null) P.pos.y = y }
    function casaSurf(x, y, z) { // o que tem embaixo do pé (muda o som do passo)
      const inR = (x0, z0, x1, z1) => x >= x0 && x <= x1 && z >= z0 && z <= z1
      if (y < -0.05) return inR(13.6, 25.7, 16.4, 80) ? 'cascalho' : 'grama'
      if (x >= ST.x0 - 0.02 && x <= ST.x1 + 0.02 && z >= ST.z0 && z <= ST.z1 + 0.05 && y > 0.05 && y < UPF - 0.05) return 'escada'
      if (y > 1.6) return inR(2.5, 17.4, 4.7, 20.6) || inR(2.5, 7.6, 13.5, 8.8) || inR(19, 7.6, 30, 8.8) ? 'tapete' : 'tabua'
      if (inR(11.9, HZ, 18.1, 26.7)) return 'pedra' // a varanda e os degraus
      if (x >= 9 && x <= 21 && z >= 10) return inR(13.5, 20.55, 16.5, 22.85) ? 'tapete' : 'pedra' // o salão: ladrilho, com o tapete na frente da escada
      if (x >= 9 && x <= 21) return 'madeira' // o corredor dos fundos
      return x > 21 && z < 14 ? 'pedra' : 'madeira' // a lajota da cozinha e da copa; o parquet da sala de jantar
    }
    function casaCollide(p, r) {
      const y0 = p.y + 0.25, y1 = p.y + 1.75 // degrau de até 25 cm se sobe sem bater
      for (let it = 0; it < 2; it++) for (const c of CA.cols) {
        if (c.off || c.ray || c.y1 <= y0 || c.y0 >= y1) continue
        const ext = c.hx + c.hz + r; if (Math.abs(p.x - c.x) > ext || Math.abs(p.z - c.z) > ext) continue
        pushOBB(p, c, r)
      }
      if (P.dodge < 0 && p.y < 1) for (const e of CA.foes) if (e.kind === 'glu' && e.o && !e.dead && !e.o.S.exploded) { const S = e.o.S, dx = p.x - S.pos.x, dz = p.z - S.pos.z, dd = Math.hypot(dx, dz), m = r + 0.7; if (dd < m && dd > 1e-4) { p.x = S.pos.x + dx / dd * m; p.z = S.pos.z + dz / dd * m } } // o corpo do Glutão
    }
    function casaCamK(a, b) { // a câmera não atravessa parede, laje, porta fechada nem móvel alto
      _qv.copy(b).sub(a); const len = _qv.length() || 1e-6; _qv.multiplyScalar(1 / len)
      let k = 1
      for (const c of CA.cols) { if (c.off) continue; const ext = c.hx + c.hz + len + 0.3; if (Math.abs(c.x - a.x) > ext || Math.abs(c.z - a.z) > ext) continue; const q = rayBox(a, _qv, c, 0.2); if (q >= 0 && q < len) k = Math.min(k, q / len) }
      return k
    }
    function casaCamY(p) {
      const up = P.pos.y > 1.6, x = p.x, z = p.z
      const inVao = inVaoXZ(x, z), inStair = x >= ST.x0 && x <= ST.x1 && z >= ST.z0 && z <= ST.z1, onPorch = x >= 11.9 && x <= 18.1 && z >= HZ && z <= 25.75
      let fl, ce
      if (up) { fl = inVao ? 0 : UPF; ce = TOPC }
      else { fl = z > HZ && !onPorch ? YARD : 0; ce = inVao ? TOPC : onPorch ? 3.0 : z > HZ ? 20 : CEIL }
      if (inStair) fl = Math.max(fl, stairY(z))
      return cl(p.y, fl + 0.25, ce - 0.22)
    }
    function castRayCasa(o, d, maxT, out) { // o que a mira e os tiros encontram dentro da casa
      let t = maxT, kind = 'none'
      if (d.y < -1e-6) {
        const tf = (0 - o.y) / d.y; if (tf >= 0 && tf < t) { const x = o.x + d.x * tf, z = o.z + d.z * tf; if (x > -0.2 && x < HX + 0.2 && z > -0.2 && z < 25.8) { t = tf; kind = 'wall' } }
        const ty = (YARD - o.y) / d.y; if (ty >= 0 && ty < t) { t = ty; kind = 'wall' }
      }
      if (d.y > 1e-6) { const tc = (TOPC - o.y) / d.y; if (tc >= 0 && tc < t) { const x = o.x + d.x * tc, z = o.z + d.z * tc; if (x > 0 && x < HX && z > 0 && z < HZ) { t = tc; kind = 'wall' } } }
      const ex = o.x + d.x * Math.min(t, 40), ez = o.z + d.z * Math.min(t, 40), x0 = Math.min(o.x, ex), x1 = Math.max(o.x, ex), z0 = Math.min(o.z, ez), z1 = Math.max(o.z, ez)
      for (const c of CA.cols) { if (c.off) continue; const e2 = c.hx + c.hz; if (c.x + e2 < x0 || c.x - e2 > x1 || c.z + e2 < z0 || c.z - e2 > z1) continue; const q = rayBox(o, d, c); if (q >= 0 && q < t) { t = q; kind = 'wall' } }
      out.ref = null
      for (let i = 0; i < BD.nSph; i++) { const s = BD.sph[i], q = raySphere(o, d, s.c, s.r); if (q >= 0 && q < t) { t = q; kind = s.part; out.ref = s.e } }
      out.t = t; out.kind = kind; out.p.copy(o).addScaledVector(d, t)
      return out
    }

    // ---------- a tela de carregamento ----------
    css.textContent += `
#demoHud .dh-load { position: absolute; inset: 0; background: #050607; display: grid; place-content: center; gap: 14px; text-align: center; opacity: 0; transition: opacity 0.6s; pointer-events: none; z-index: 6; padding: 16px; }
#demoHud .dh-load.on { opacity: 1; transition: none; pointer-events: auto; }
#demoHud .dh-load.on.slow { transition: opacity 0.75s ease-in; }
body:not(.playing) #demoHud .dh-load { padding-left: min(360px, 34vw); }
@media (max-width: 760px) { body:not(.playing) #demoHud .dh-load { padding-left: 16px; } }
#demoHud .dh-load .ey { font-size: 10px; letter-spacing: 0.3em; text-transform: uppercase; color: var(--muted); }
#demoHud .dh-load b { font-family: var(--display); font-weight: 400; font-size: clamp(34px, 7vw, 62px); letter-spacing: 0.14em; color: var(--fg); line-height: 0.95; }
#demoHud .dh-load .sub { font-style: italic; color: var(--muted); font-size: 13px; }
#demoHud .dh-load .bar { width: min(320px, 70vw); height: 3px; background: rgba(255,255,255,0.08); justify-self: center; margin-top: 10px; }
#demoHud .dh-load .bar i { display: block; height: 100%; background: var(--lamp); transform-origin: left; transform: scaleX(0); }
#demoHud .dh-load .tip { font-size: 12px; color: var(--fg); opacity: 0.72; max-width: 46ch; justify-self: center; line-height: 1.5; margin-top: 8px; }
.dh-room { position: absolute; left: 50%; top: calc(122px + env(safe-area-inset-top, 0px)); transform: translateX(-50%); text-align: center; display: grid; gap: 3px; text-shadow: 0 1px 3px #000; transition: opacity 0.5s; pointer-events: none; opacity: 0; white-space: nowrap; }
.dh-room b { font-family: var(--display); font-weight: 400; font-size: 28px; letter-spacing: 0.16em; color: var(--fg); line-height: 1; }
.dh-room span { font-size: 10px; letter-spacing: 0.25em; text-transform: uppercase; color: var(--muted); }
.dh-obj { position: absolute; left: max(16px, env(safe-area-inset-left, 0px)); top: calc(16px + env(safe-area-inset-top, 0px)); font-size: 12px; color: var(--fg); text-shadow: 0 1px 2px #000; max-width: min(300px, 38vw); line-height: 1.4; transition: opacity 0.4s; opacity: 0; }
.dh-obj i { display: block; font-style: normal; color: var(--lamp); letter-spacing: 0.22em; text-transform: uppercase; font-size: 9px; margin-bottom: 2px; }
@media (max-width: 640px) { .dh-room b { font-size: 20px; } .dh-obj { max-width: 46vw; font-size: 11px; } }
`
    const LOADC = document.createElement('div'); LOADC.className = 'dh-load'; LOADC.innerHTML = '<div class="ey"></div><b></b><span class="sub"></span><div class="bar"><i></i></div><div class="tip"></div>'; hud.append(LOADC)
    const roomEl = document.createElement('div'); roomEl.className = 'dh-room'; roomEl.innerHTML = '<b></b><span></span>'; hud.append(roomEl)
    const objEl = document.createElement('div'); objEl.className = 'dh-obj'; hud.append(objEl)
    const LD = { on: false, steps: [], i: 0, t: 0, min: 2, delay: 0, done: null, bar: LOADC.querySelector('.bar i') }
    const TIPS = ['Os Espectrais rondam você e só um ataca por vez: quando ele empina guinchando, esquive para o lado.', 'Saia do cômodo e o Espectral volta para o lugar dele: ele não segue você pela casa.', 'Lamparina acesa é ponto de retorno: se cair, você volta para a última.', 'Tiro na cabeça do Espectral vale 1,5 vez o dano. Depois da mordida ele fica tonto: é a sua janela.', 'A pistola esquenta e a escopeta trava se você abusar: troque de arma pela roda (segure a rodinha).', 'O Glutão guarda a cozinha: o núcleo no peito leva o dano inteiro; no resto, só metade.', 'A porta escondida no lambri liga o corredor dos fundos ao salão.']
    const TIPS_M = ['Quando ela para ofegando, é a janela: o dano sobe e tiro na cabeça vale o dobro.', 'O chão que estufa e brilha vermelho avisa de onde ela vai sair.', 'Zere uma barra e o redemoinho cai: quebre o berço enquanto ela está atordoada.', 'Enfraquecida, jogue a armadilha.']
    function loadStart(o) {
      LD.on = true; LD.steps = o.steps; LD.i = 0; LD.t = 0; LD.min = navigator.webdriver ? 0 : o.min; LD.done = o.done; LD.delay = o.delay || 0 // delay: o escuro entra devagar antes de trocar a cena
      LOADC.classList.toggle('slow', !!o.delay)
      LOADC.querySelector('.ey').textContent = o.ey; LOADC.querySelector('b').textContent = o.title; LOADC.querySelector('.sub').textContent = o.sub; LOADC.querySelector('.tip').textContent = o.tip
      LD.bar.style.transform = 'scaleX(0)'; LOADC.classList.add('on')
      D.mode = 'load'; IN.fire = IN.aim = false; promptEl.textContent = ''; roomEl.style.opacity = 0; objEl.style.opacity = 0; wheelClose(false); hudTela()
    }
    function loadTick(dt) {
      if (!LD.on) return
      LD.t += dt
      if (LD.t < LD.delay) return // a tela ainda escurecendo: a cena só troca no escuro
      if (LD.i < LD.steps.length) { const f = LD.steps[LD.i++]; try { f() } catch (e) { console.error(e) } }
      const k = Math.min(LD.i / Math.max(1, LD.steps.length), LD.min > 0 ? LD.t / LD.min : 1)
      LD.bar.style.transform = `scaleX(${k.toFixed(3)})`
      if (LD.i >= LD.steps.length && LD.t >= LD.min) { LD.on = false; LOADC.classList.remove('on'); const f = LD.done; LD.done = null; if (f) f() }
    }

    // ---------- entrar na casa, sair dela para a luta, e voltar ----------
    let AR_G = null
    function arenaGroup() { // tudo o que é da arena (o berçário, o corredor, a chuva...) num grupo, para tirar de cena; as luzes ficam (o número de luzes não muda)
      if (AR_G) return AR_G
      AR_G = new THREE.Group(); AR_G.name = 'arena'
      const keep = new Set([A.root, flashL, ofxPts, torchCone, trapG, rit, arc, land, fill, cribSpot.target, ...RINGS.map((r) => r.m), ...beams, ...cableSegs, ...winSpots.map((s) => s.target), spot, spot.target])
      for (const o of [...G.children]) if (!keep.has(o) && !o.isLight && o !== CA.g && o !== INS.g) AR_G.add(o)
      G.add(AR_G)
      return AR_G
    }
    const LSV = {}
    const lsave = (l) => ({ c: l.color.clone(), i: l.intensity, d: l.distance, a: l.angle, pe: l.penumbra, de: l.decay, p: l.position.clone(), t: l.target.position.clone(), n: l.shadow.camera.near, f: l.shadow.camera.far })
    function lload(l, s) { l.color.copy(s.c); l.intensity = s.i; l.distance = s.d; l.angle = s.a; l.penumbra = s.pe; l.decay = s.de; l.position.copy(s.p); l.target.position.copy(s.t); l.shadow.camera.near = s.n; l.shadow.camera.far = s.f; l.shadow.camera.updateProjectionMatrix() }
    function casaArenaOut() { // a arena sai; as duas luzes com sombra viram o luar da casa
      arenaGroup(); if (AR_G.parent) G.remove(AR_G)
      if (LUTA.on || LUTA.ctx === CTX) LUTA.end(); maeGroup.visible = false; LUTA.FX.visible = false
      clearShots(); bandoClear(); BD.state = 'fight'; BD.token = null; BD.nSph = 0; rainClear(); TOR.k = TOR.want = 0; if (typeof cutReset === 'function') cutReset()
      B.dry = 1; D.zone = 'casa'
      if (!LSV.crib) { LSV.crib = lsave(cribSpot); LSV.win = lsave(winSpots[0]) }
      const wc = _qv.set(15, UPF + 1.65, HZ), s1 = cribSpot
      s1.color.set('#9fb6e2'); s1.distance = 32; s1.angle = 0.3; s1.penumbra = 0.3; s1.decay = 1.0
      s1.position.copy(wc).addScaledVector(MOOND, -10); s1.target.position.copy(wc).addScaledVector(MOOND, 6); s1.shadow.camera.near = 5; s1.shadow.camera.far = 28; s1.shadow.camera.updateProjectionMatrix()
      const s2 = winSpots[0]; s2.color.set('#a2b8e4'); s2.distance = 24; s2.angle = 0.32; s2.penumbra = 0.35; s2.decay = 1.1; s2.shadow.camera.near = 3; s2.shadow.camera.far = 22; s2.shadow.camera.updateProjectionMatrix()
      CA.spotRoom = ''; CA.spotK = 0; LIT.crib.k = 0
      scene.fog.color.set('#07090b'); scene.fog.density = 0.032; scene.background.set('#07090b')
      SFX.setGhost('casa'); ghostShadows(false)
      el.name.textContent = 'ESPECTRAIS'; el.slots[2].style.opacity = 0.3
    }
    function casaPlayer(p, yaw) { // você inteiro, parado, com as armas frias
      Object.assign(P, { yaw, hp: T.agente.vida, stam: T.agente.folego, stamLock: false, stamIdle: 0, runW: 0, aimW: 0, speed: 0, dodge: -1, dodgeCd: 0, inv: 0, hitT: -1, stagger: 0, dead: -1,
        kick: 0, pumpT: -1, throwT: -1, healT: -1, healDone: false, fireHold: 0, torCd: 0, swap: -1, wNext: null })
      if (P.w === 'armadilha') P.w = 'pistola'
      P.vel.set(0, 0, 0); P.pos.copy(p); P.mv.set(0, 0, 0); P.knock.set(0, 0, 0)
      C.yaw = yaw; C.pitch = -0.08; C.piv.copy(P.pos); C.py = P.pos.y; C.shake = 0; C.k = 1
      Object.assign(GUN, { heat: 0, lock: 0, cd: 0, idle: 9, hot: false }); Object.assign(SG, { heat: 0, lock: 0, cd: 0, idle: 9, hot: false })
      clearShots(); trapHome(); A.kitHand.visible = false; IN.fire = IN.aim = false; for (const c in IN.k) IN.k[c] = false
      Object.assign(AN, { ph: 0, amp: 0, run: 0, aim: 0, legYaw: 0, legDir: 1, bank: 0, yawPrev: yaw, hx: 0, hy: 0, pump: 0 })
      showWeapon()
    }
    function casaReset() { // a casa do começo: portas, Espectrais, kits, lamparinas; você na varanda
      for (const D2 of CA.doors) { if (!D2.st0) D2.st0 = D2.st; D2.st = D2.st0; D2.ang = D2.want = D2.st === 'open' ? D2.a : 0; D2.shake = 0; D2.col.off = D2.st === 'open'; D2.leafCols.forEach((c) => (c.off = true)); doorPose(D2, 0); if (D2.st === 'open') leafCols(D2) }
      for (const e of CA.foes) { foeRelease(e); e.hp = e.max; e.dead = false; e.sunk = true; e.away = 0 }
      for (const en of CA.encs) en.st = 'sleep'
      for (const k of CA.kits) { k.on = true; k.g.visible = true }
      for (const id in CA.cps) { const c = CA.cps[id]; c.lit = false; c.k = 0 }
      CA.cp = 'varanda'; CA.cps.varanda.lit = true; CA.cps.varanda.k = 1
      CA.room = ''; CA.roomT = 0; CA.inside = null; CA.hudEn = null; CA.yardT = 0; CA.objT = 0; CA.swingKick = 0; CA.freezeT = 0; maeWalkStop(); CA.maeDone = false
      BD.token = null; BD.atkCd = 1.2; BD.nSph = 0; BD.killed = 0
      casaPlayer(CA.cps.varanda.pos, CA.cps.varanda.yaw)
      P.kits = T.kit.inicio; P.stats = { t: 0, shots: 0, hits: 0, crits: 0, dmg: 0, hitsTaken: 0, dmgTaken: 0, dodges: 0, deaths: 0, kits: 0 }
      D.t = 0; D.endShown = false; D.endT = 0; hurtFx = 0; healFx = 0; H.msgT = 0; H.banT = 0; el.toast.textContent = ''
    }
    function casaIn() { if (CA.g.parent !== G) G.add(CA.g); casaReset(); bakeStart() }
    function casaPrecompile() { // os materiais da casa e dos cinco Espectrais compilam aqui, atrás da tela, e não no meio da luta
      const hidG = [...HPOOL, glutao].filter((o) => !o.group.visible), hid = []
      hidG.forEach((o) => (o.group.visible = true)); CA.g.traverse((o) => { if (!o.visible) { hid.push(o); o.visible = true } })
      try { renderer.compile(scene, camera) } catch (e) { console.warn(e) }
      hidG.forEach((o) => (o.group.visible = false)); hid.forEach((o) => (o.visible = false))
    }
    function casaBegin() { D.mode = 'start'; if (D.playing) began(); else hudTela() }
    function casaStart() { // a casa desde o começo (também o "de novo" depois da vitória)
      D.kind = 'casa'; D.run = 'casa'; D.runT = 0; D.runKits = null; D.best = null; CA.begun = false
      D.introSeen = !!navigator.webdriver && !window.__introOn
      loadStart({ ey: 'C.R.O.S. · carregando', title: 'PALACETE MONTEVAL', sub: 'interior de São Paulo · fechado desde 1952', tip: TIPS[(Math.random() * TIPS.length) | 0], min: 2.2,
        steps: [() => {}, () => {}, casaArenaOut, () => { if (!CA.built) casaBuildA() }, () => { if (!CA.built) casaBuildB() }, () => { if (!CA.built) casaBuildC() }, casaIn, casaPrecompile],
        done: casaBegin })
    }
    function casaOut() { // a casa sai de cena: os Espectrais voltam para o monte, as luzes voltam a ser da arena
      for (const e of CA.foes) foeRelease(e)
      maeWalkStop()
      SFX.caixinha(0)
      BD.nSph = 0; BD.token = null
      bakeClear(); if (CA.g && CA.g.parent) G.remove(CA.g); D.zone = 'room'
      if (LSV.crib) { lload(cribSpot, LSV.crib); lload(winSpots[0], LSV.win) }
      promptEl.textContent = ''; roomEl.style.opacity = 0; objEl.style.opacity = 0
    }
    function arenaIn() { // a arena volta (o corredor, o berçário): daqui em diante é a luta da Mãe, a mesma da demo
      arenaGroup(); if (!AR_G.parent) G.add(AR_G)
      D.kind = 'mae'; D.zone = 'room'; LUTA.FX.visible = true
      el.name.textContent = 'A MÃE'; barEls.forEach((b, i) => { b.e.style.flex = BAR_HP[i]; b.e.style.display = '' }); el.slots[2].style.opacity = 1
      ghostShadows(true); SFX.setGhost('demo')
      scene.fog.color.set('#0b0e0d'); scene.fog.density = 0.017; scene.background.set('#0b0e0d')
      reset(0)
    }
    function casaRecord() { // o melhor tempo da varanda à Mãe (fica neste navegador)
      let best = 0; try { best = Number(localStorage.getItem('cros.casa.melhor')) || 0 } catch (e) {}
      const t = D.runT || 0, novo = !best || t < best
      if (novo) try { localStorage.setItem('cros.casa.melhor', String(t)) } catch (e) {}
      D.best = { t: novo ? t : best, prev: best, novo: novo && best > 0 }
    }
    function casaToFight() {
      D.runKits = P.kits; SFX.demo('portaAbre'); SFX.caixinha(0)
      const bd = CA.doors.find((d2) => d2.id === 'bebe'); if (bd) bd.want = 0.45 // a porta abre um palmo; do vão, o escuro
      loadStart({ ey: 'C.R.O.S. · carregando', title: 'O QUARTO DO BEBÊ', sub: 'a porta abre para um corredor que não cabe na casa', tip: TIPS_M[(Math.random() * TIPS_M.length) | 0], min: 2.6, delay: 0.85,
        steps: [() => {}, () => {}, casaOut, arenaIn, () => { litReady = false; litPrecompile() }],
        done: () => { D.mode = 'start'; began() } })
    }
    function casaExit() { // saindo da demo (outro fantasma no laboratório): tudo no lugar
      LD.on = false; LOADC.classList.remove('on'); SFX.caixinha(0)
      for (const e of CA.foes) foeRelease(e)
      maeWalkStop()
      if (CA.g && CA.g.parent) G.remove(CA.g)
      if (AR_G && !AR_G.parent) G.add(AR_G)
      if (LSV.crib) { lload(cribSpot, LSV.crib); lload(winSpots[0], LSV.win) }
      D.run = null; D.zone = 'room'; roomEl.style.opacity = 0; objEl.style.opacity = 0
      barEls.forEach((b) => (b.e.style.display = ''))
    }
    function casaRespawn() { // caiu na casa: volta à última lamparina; os Espectrais vivos voltam a dormir inteiros, os mortos ficam mortos
      const c = CA.cps[CA.cp]
      for (const en of CA.encs) if (en.st === 'awake') { en.st = 'sleep'; encDoors(en, false); for (const e of en.foes) if (!e.dead) { foeRelease(e); e.sunk = true; e.hp = e.max; e.away = 0 } }
      BD.token = null; BD.atkCd = 1.2; BD.nSph = 0
      casaPlayer(c.pos, c.yaw)
      D.mode = 'fight'; D.endShown = false; D.endT = 0; hurtFx = 0; H.last = ''
      CA.room = ''; say('De volta à lamparina: ' + c.name, 3)
      if (D.bot) botCasaWp()
      hudTela()
    }

    // ---------- por quadro, na casa ----------
    const ROOM_NAME = { varanda: ['Varanda', 'a entrada'], salao: ['Salão', 'térreo'], jantar: ['Sala de jantar', 'térreo'], copa: ['Copa', 'térreo'], cozinha: ['Cozinha', 'térreo'], corrF: ['Corredor dos fundos', 'térreo'],
      patamar: ['Patamar', 'andar de cima'], galO: ['Galeria oeste', 'andar de cima'], galL: ['Galeria leste', 'andar de cima'], galS: ['Galeria da frente', 'andar de cima'], vao: ['Galerias', 'andar de cima'],
      vestir: ['Quarto de vestir', 'andar de cima'], principal: ['Quarto principal', 'andar de cima'], corrF2: ['Corredor dos fundos', 'andar de cima'], escada: ['Escadaria', 'do salão ao patamar'], jardim: ['Jardim', 'o caminho do carro'] }
    function roomNow() {
      const x = P.pos.x, z = P.pos.z, y = P.pos.y
      if (x >= ST.x0 && x <= ST.x1 && z >= ST.z0 - 0.05 && z <= ST.z1 + 0.05 && y > 0.25 && y < UPF - 0.25) return 'escada'
      if (z > 25.75 || (z > HZ && (x < 11.9 || x > 18.1))) return 'jardim'
      const r = roomAt(lvlOf(y), x, z); return r ? r.id : ''
    }
    const roomLabel = () => (ROOM_NAME[CA.room] ? ROOM_NAME[CA.room][0].toLowerCase() : 'a casa')
    const BEBE = { x: 22.5, z: 9.3 } // diante da porta do berçário, no corredor
    function casaTick(t, dt) {
      A.chest.getWorldPosition(CA.tgt); CA.tgt.y += 0.12
      BD.atkCd -= dt
      if (BD.token) { BD.tokT += dt; if (BD.tokT > 3.5 || BD.token.dead) { BD.token.atk = false; BD.token = null } }
      encTick(t, dt)
      if (P.dead < 0) for (const k of CA.kits) if (k.on && lvlOf(P.pos.y + 0.2) === k.lv && Math.hypot(P.pos.x - k.p.x, P.pos.z - k.p.z) < 1.05) { k.on = false; k.g.visible = false; P.kits++; SFX.demo('kit'); say('Kit de primeiros socorros: +1 (F para usar)') }
      // o cômodo: o nome aparece quando você entra; o quarto principal acende a última lamparina; no corredor de cima, a Mãe passa
      const id = roomNow()
      if (id !== CA.room) {
        CA.room = id
        if (ROOM_NAME[id] && D.mode === 'fight') { roomEl.querySelector('b').textContent = ROOM_NAME[id][0]; roomEl.querySelector('span').textContent = ROOM_NAME[id][1]; CA.roomT = 2.8 }
        if (id === 'principal' || id === 'salao') cpLight(id)
        if (id === 'jardim' && CA.yardT <= 0) { say('O carro fica para depois. Primeiro, a Mãe.', 3); CA.yardT = 12 }
      }
      if (!CA.maeDone && CA.room === 'corrF2' && P.pos.x > 12 && P.pos.x < 21 && P.dead < 0) maeWalkStart()
      CA.yardT -= dt
      // o objetivo, no canto
      const front = CA.doors[0], up = P.pos.y > 1.6
      const obj = front.st !== 'open' && (CA.room === 'varanda' || CA.room === 'jardim') ? 'Entre pela porta da frente' : !up ? (CA.room === 'escada' ? 'Suba até o patamar' : 'Suba a escadaria do salão') : CA.room !== 'corrF2' ? 'Do patamar, a porta do corredor dos fundos' : 'A porta do berçário, no meio do corredor'
      if (objEl.dataset.t !== obj) { objEl.dataset.t = obj; objEl.innerHTML = `<i>objetivo</i>${obj}` }
      // a trilha: a casa, a briga, a tensão no corredor dos fundos de cima
      const fight = CA.inside && CA.inside.st === 'awake' && CA.inside.foes.some((e) => !e.dead && !e.sunk)
      SFX.music(fight && CA.inside.kind === 'glu' ? 'bando' : fight || CA.room === 'corrF2' ? 'tensao' : 'amb') // a batalha só com o Glutão; com os Espectrais, a tensão
      // perto da porta do berçário: o Luto borbulha do outro lado
      if (up && Math.hypot(P.pos.x - BEBE.x, P.pos.z - BEBE.z) < 4.5) { CA.bubT -= dt; if (CA.bubT <= 0) { SFX.luta('bolha'); CA.bubT = 1.2 + R() * 2.4 } }
    }
    function casaFx(t, dt) { // o que se mexe na casa: portas, lustres, cortinas, chamas, lamparinas, a poeira no luar, a luz embaixo da porta
      if (!CA.built || !CA.g.parent) return
      for (const D2 of CA.doors) { D2.ang = damp(D2.ang, D2.want, 2.4, dt); D2.shake = Math.max(0, D2.shake - dt * 2.2); doorPose(D2, t) }
      CA.swingKick = Math.max(0, (CA.swingKick || 0) - dt * 0.35)
      for (const s of CA.swing) { const k = s.k * (1 + 4 * CA.swingKick); s.g.rotation.x = Math.sin(t * 0.7 + s.ph) * 0.01 * k; s.g.rotation.z = Math.sin(t * 0.53 + s.ph * 2) * 0.01 * k }
      for (const c of CA.curtains) c.m.rotation.x = Math.sin(t * 0.9 + c.ph) * 0.05 + Math.sin(t * 2.3 + c.ph * 1.7) * 0.015
      for (const f of CA.flames) { const k = 0.85 + 0.15 * Math.sin(t * 13 + f.ph) * Math.sin(t * 7.3 + f.ph * 2); f.f.scale.set(f.s * (0.9 + 0.1 * k), f.s * 2 * k, 1) }
      for (const id in CA.cps) {
        const c = CA.cps[id]; c.k = damp(c.k, c.lit ? 1 : 0, 2.5, dt); c.flame.visible = c.halo.visible = c.k > 0.04
        const fk = 0.88 + 0.12 * Math.sin(t * 11 + id.length) * Math.sin(t * 6.1 + id.length); c.flame.scale.set(0.045, 0.085 * c.k * fk, 1); c.halo.material.opacity = 0.5 * c.k * fk; c.glow.k = c.k
      }
      kitGlowMat.opacity = 0.35 + 0.25 * Math.sin(t * 3)
      CA.beamT.value = t; dustTick(t)
      if (CA.leak) { const p = 0.7 + 0.3 * Math.sin(t * 2.2) * Math.sin(t * 0.7); CA.leak.material.opacity = 0.6 * p; CA.spill.material.opacity = 0.45 * p }
      if (CA.embers && R() < dt * 3) { const e = CA.embers; ofx(0, e.x + R() * 0.25, e.y, e.z + (R() - 0.5) * 0.6, (R() - 0.5) * 0.1, 0.25 + R() * 0.3, (R() - 0.5) * 0.1, 1.2 + R(), -0.15, 1) } // fagulhas da lareira
    }
    function casaUpdate(t, dt) {
      const sim = (D.playing && D.mode === 'fight') || D.mode === 'dead'
      if (D.bot && sim) botCasa(dt)
      if (sim) {
        if (D.mode === 'fight') { D.t += dt; D.runT += dt }
        casaUse()
        if (CA.freezeT > 0 && D.mode === 'fight') { CA.freezeT -= dt; IN.dx = IN.dy = 0; IN.fire = IN.aim = false; P.mv.set(0, 0, 0); P.vel.set(0, 0, 0); P.speed = 0 } // parado (o Glutão subindo)
        else controlTick(dt)
        casaTick(t, dt)
      } else { IN.dx = IN.dy = 0; P.mv.set(0, 0, 0); if (promptEl.textContent) promptEl.textContent = '' }
      camTick(dt)
      animAgent(t, dt)
      if (sim) { gunTick(t, dt); boltsTick(dt) }
      arcTick()
      casaFx(t, dt)
      { // a caixinha atrás da porta da Garota: só em cima, no corredor dos fundos (e baixinho de mais longe)
        const up = P.pos.y > 1.6, d = Math.hypot(P.pos.x - 26.5, P.pos.y + 1.5 - (UPF + 1.1), P.pos.z - (CZ - 0.4)), q = cl(1 - (d - 1) / 10)
        SFX.caixinha(D.playing && D.mode === 'fight' && CA.g.parent && up ? 0.3 * q * q : 0) }
      if (CA.mae) maeWalkTick(t, dt)
      if (D.mode === 'dead') { D.endT += dt; if (!D.endShown && D.endT > 1.6) { D.endShown = true; hudTela() } }
      hudTick(dt)
      SFX.demoWind(0)
      bakeTick(dt)
    }

    // ---------- a luz da casa: o luar (duas luzes com sombra), a lanterna, e as luzes de brilho mais perto ----------
    const FOG_H = new THREE.Color('#07090b'), HEMI_H = { sky: new THREE.Color('#2a3446'), ground: new THREE.Color('#110c08') }
    const SPOT_ROOM = { varanda: [15, 1.6, HZ + 0.3, 1], jardim: [15, 1.6, HZ + 0.3, 1], salao: [11, 1.7, HZ], escada: [19, 1.7, HZ], jantar: [24.5, 1.7, HZ], principal: [2.5, UPF + 1.65, HZ],
      patamar: [10.5, UPF + 1.6, HZ], galO: [10.5, UPF + 1.6, HZ], galL: [19.5, UPF + 1.6, HZ], galS: [19.5, UPF + 1.6, HZ], vao: [19.5, UPF + 1.6, HZ] }
    function spotAim(id) {
      const s = SPOT_ROOM[id]; if (!s) return
      const wc = _qv2.set(s[0], s[1], s[2]), sp = winSpots[0]
      sp.position.copy(wc).addScaledVector(MOOND, s[3] ? -11 : -7); sp.target.position.copy(wc).addScaledVector(MOOND, 5); sp.angle = s[3] ? 0.5 : 0.3
    }
    const flickOf = (g) => (g.flick === 2 ? 0.72 + 0.28 * Math.sin(D.t * 5.3 + 1) * Math.sin(D.t * 3.1) : g.flick === 3 ? 0.6 + 0.4 * Math.sin(D.t * 2.2) * Math.sin(D.t * 0.7) : 0.86 + 0.14 * Math.sin(D.t * 13 + g.p.x) * Math.sin(D.t * 7.1 + g.p.z))
    const _gl = []
    function casaLitFeed(full) {
      LITU.uLitK.value = 1; LITU.uLitSmooth.value = 1; LITU.uLitFull.value = full ? 1 : 0
      if (BUMPS.on !== full) { BUMPS.on = full; for (const B3 of BUMPS) { const m = B3[0]; if (!B3[2]) B3[2] = m.bumpMap; m.bumpMap = full ? B3[2] : null; m.needsUpdate = true } }
      camera.updateMatrixWorld(); const VM = camera.matrixWorldInverse
      LITU.uLitUp.value.set(0, 1, 0).transformDirection(VM)
      LITU.uRimD1.value.copy(MOOND).negate().transformDirection(VM); LITU.uRimC1.value.copy(LIT.rimCold).multiplyScalar(1.5)
      _gl.length = 0
      const cx = camera.position.x, cy = camera.position.y, cz = camera.position.z
      const add = (g, k) => { if (k <= 0.01) return; const d = Math.hypot(g.p.x - cx, (g.p.y - cy) * 1.6, g.p.z - cz); if (d > g.r + 9) return; g.d = d; g.kk = k; _gl.push(g) }
      for (const g of CA.glows) add(g, g.k * (g.flick ? flickOf(g) : 1))
      let ei = 0
      for (const e of CA.foes) if (e.o && e.o.group.visible && !e.dead && ei < CA.eglow.length) { const g = CA.eglow[ei++]; e.o.head.getWorldPosition(g.p); add(g, 0.8 + 0.4 * e.o.S.glow) } // o brilho azul do próprio Espectral
      _gl.sort((a, b) => a.d - b.d)
      const lim = full ? LIT_MAX : 3; let n = 0, warm = null
      for (const g of _gl) { if (n >= lim) break; _lv.copy(g.p).applyMatrix4(VM); LITU.uGlowP.value[n].set(_lv.x, _lv.y, _lv.z, g.r); LITU.uGlowC.value[n].set(g.c.r * g.kk, g.c.g * g.kk, g.c.b * g.kk); n++; if (!warm && g.warm) warm = g }
      LITU.uGlowN.value = n
      if (warm) { LITU.uRimP2.value.copy(warm.p).applyMatrix4(VM); LITU.uRimR2.value = warm.r * 1.4; LITU.uRimC2.value.copy(LIT.rimWarm).multiplyScalar(0.9 * warm.kk) } else LITU.uRimC2.value.setRGB(0, 0, 0)
    }
    function houseLight() {
      lamp.visible = false; torchTick()
      const full = ui.luz !== 'leve', cloud = 0.82 + 0.18 * Math.sin(D.t * 0.23 + 1.3) * Math.sin(D.t * 0.11)
      hemi.intensity = 0.42; hemi.color.copy(HEMI_H.sky); hemi.groundColor.copy(HEMI_H.ground); moon.intensity = 0; moon.visible = false
      scene.fog.color.copy(FOG_H); scene.background.copy(FOG_H)
      fill.position.copy(camera.position); fill.position.y += 2.2; fill.intensity = 0.42
      cribSpot.intensity = 2.4 * cloud
      const want = SPOT_ROOM[CA.room] ? CA.room : CA.spotRoom || 'varanda'
      if (want !== CA.spotRoom) { CA.spotK = Math.max(0, CA.spotK - 0.07); if (CA.spotK <= 0) { CA.spotRoom = want; spotAim(want) } } else CA.spotK = Math.min(1, CA.spotK + 0.05)
      winSpots[0].intensity = 2.1 * cloud * sm(CA.spotK); winSpots[0].visible = full
      CA.beamK.value = 0.85 * cloud
      shF = (shF + 1) % 2; cribSpot.shadow.autoUpdate = winSpots[0].shadow.autoUpdate = false
      if (shF === 0 || !full) cribSpot.shadow.needsUpdate = true; else winSpots[0].shadow.needsUpdate = true
      if (TORCH.on && full) { spot.shadow.autoUpdate = false; if (shF === 0) spot.shadow.needsUpdate = true }
      if (D.testLight) { hemi.intensity = 1.1; fill.intensity = 1.2 }
      casaLitFeed(full)
      if (D.lightHook) D.lightHook({ hemi, moon, fill, winL, cribSpot, spot, lamp, LITU, glow: litGlow })
    }

    // ---------- a tela (começo, pausa, queda) e o painel de cima na casa ----------
    function casaTela(touch) {
      if (D.mode === 'load') return null
      const keysC = keysOf([...KEYS_B, ['E', 'abrir portas']])
      if (D.mode === 'start' && !D.playing) return `<div class="ey">C.R.O.S. · demo da casa · terceira pessoa</div><h2>A CASA</h2><div class="lt">Palacete Monteval · da varanda ao berçário</div>
        <div class="dh-goal">Entre pela porta da frente, suba a escadaria do salão e, pelo corredor dos fundos de cima, chegue à porta do berçário. Espectrais rondam a sala de jantar e o patamar, e só um ataca por vez; enquanto a sala não fica limpa, as portas dela não abrem. Na cozinha (opcional), o Glutão guarda um kit: atire no núcleo. Portas trancadas não abrem nesta demo. Lamparina acesa é ponto de retorno. Na porta do berçário, E abre a luta contra a Mãe.</div>
        ${keysC}<div class="dh-go">${touch ? 'precisa de teclado e mouse' : 'clique para começar'}</div>`
      if (D.mode === 'fight' && !D.playing) return `<div class="ey">pausa · ${roomLabel()}</div><h2>PAUSA</h2>${keysC}<div class="dh-go">clique para voltar</div>`
      if (D.mode === 'dead' && D.endShown) return `<div class="ey">C.R.O.S. · relatório de campo</div><h2 class="red">AGENTE ABATIDO</h2><div class="lt">os Espectrais da casa · ${roomLabel()}</div>${statsHtml()}<div class="dh-go">R ou clique: voltar à lamparina (${CA.cps[CA.cp].name})</div>`
      return null
    }
    function casaHud(dt) {
      const on = CA.inside && CA.inside.st === 'awake' && CA.inside.foes.some((e) => !e.dead && !e.sunk) ? CA.inside : null
      el.boss.style.opacity = on && D.mode === 'fight' ? 1 : 0
      if (on) CA.hudEn = on
      const en = CA.hudEn // a barra continua sendo atualizada enquanto some (o último Espectral morto esvazia a barra dele)
      if (en) {
        const alive = en.foes.filter((e) => !e.dead).length
        if (en.kind === 'glu') { el.name.textContent = 'O GLUTÃO'; el.phase.textContent = alive ? 'cozinha · tiro no núcleo quando ele erguer os braços' : 'cozinha · derrotado' }
        else { el.name.textContent = 'ESPECTRAIS'; el.phase.textContent = `${en.name.toLowerCase()} · ${alive ? `${alive} ${alive === 1 ? 'restante' : 'restantes'}` : 'nenhum restante'}` }
        barEls.forEach((b, i) => { const e = en.foes[i]; b.e.style.display = e ? '' : 'none'; if (!e) return; b.e.style.flex = 1; const f = e.dead ? 0 : e.hp / e.max; b.tr = f < b.tr ? damp(b.tr, f, 2.5, dt) : f; b.i.style.transform = `scaleX(${f})`; b.u.style.transform = `scaleX(${b.tr})`; b.e.classList.toggle('cur', !e.dead); b.e.classList.remove('lock') })
        el.bars.classList.remove('weak'); el.crib.hidden = true
      }
      CA.roomT -= dt; roomEl.style.opacity = CA.roomT > 0 && D.mode === 'fight' && D.playing ? Math.min(1, CA.roomT / 0.6).toFixed(2) : 0
      objEl.style.opacity = D.mode === 'fight' && D.playing && !on ? 1 : 0
    }
    const casaDbg = () => `fps ${H.fps.toFixed(0)} · casa · ${D.mode} · ${CA.room || '-'} · andar ${lvlOf(P.pos.y)}\nvocê ${P.pos.x.toFixed(2)} ${P.pos.y.toFixed(2)} ${P.pos.z.toFixed(2)} · vida ${Math.round(P.hp)} · kits ${P.kits}\nencontro ${CA.inside ? CA.inside.id + ' ' + CA.inside.st : '-'} · retorno ${CA.cp}\nmira ${AIM.kind} ${AIM.t.toFixed(1)} m · colisões ${CA.cols.length}`

    // ---------- o robô da casa (testes): segue o caminho, abre as portas, briga nos encontros ----------
    const ROUTE = [[15, 25.2, 0], [15, 24.6, 0, 'frente'], [15, 22.6, 0], [15.2, 20.0, 0], [15.2, 19.5, 0], [15.2, 13.6, 1], [15, 11.2, 1], [15, 10.6, 1, 'patCorr'], [15, 8.9, 1], [22.5, 8.9, 1], [22.5, 9.35, 1, 'bebe']]
    function botCasaWp() { const b = D.bot, c = CA.cps[CA.cp]; let bi = 0, bd = 1e9; ROUTE.forEach((w, i) => { if (w[2] !== lvlOf(c.pos.y + 0.1)) return; const d = Math.hypot(w[0] - c.pos.x, w[1] - c.pos.z); if (d < bd) { bd = d; bi = i } }); b.wp = bi; b.door = null }
    function botCasa(dt) {
      const b = D.bot, k = IN.k
      for (const c of ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ShiftLeft', 'Space', 'KeyF', 'KeyE']) k[c] = false
      IN.fire = false; IN.aim = false
      if (!D.playing || P.dead >= 0 || D.mode !== 'fight') return
      b.t += dt; b.healCd -= dt; b.sideT -= dt; b.eT = (b.eT || 0) - dt; if (b.wp === undefined) b.wp = 0
      const en = CA.inside && CA.inside.st === 'awake' ? CA.inside : null
      let tgt = null, best = 1e9
      if (en) for (const e of en.foes) { if (e.dead || !e.o || !e.o.group.visible) continue; const S = e.o.S, d = Math.hypot(S.pos.x - P.pos.x, S.pos.z - P.pos.z) - (e === BD.token ? 4 : 0); if (d < best) { best = d; tgt = e } }
      let mx = 0, mz = 0
      if (tgt) {
        const tk = BD.token
        if (tk && tk.o && tk.o.S.ph === 'wind' && tk.o.S.pt > 0.6 - b.react * 0.3 && !b.dodged) { b.dodged = true; if (R() < b.dodgeP) k.Space = true }
        if (!tk || !tk.o || tk.o.S.ph === 'circle' || tk.o.S.ph === 'daze') b.dodged = false
        const S = tgt.o.S; let ax = S.pos.x - P.pos.x, az = S.pos.z - P.pos.z; const al = Math.hypot(ax, az) || 1; ax /= al; az /= al
        if (b.sideT <= 0) { b.side = R() < 0.5 ? -1 : 1; b.sideT = 2 + R() * 3 }
        mx += -az * b.side * 0.8; mz += ax * b.side * 0.8
        const want = tgt.kind === 'glu' ? 4.6 : P.w === 'escopeta' ? 3.2 : 4.2, er = al - want; mx += ax * cl(er, -1.5, 1.5); mz += az * cl(er, -1.5, 1.5)
        const ox = en.spot[0] - P.pos.x, oz = en.spot[1] - P.pos.z, od = Math.hypot(ox, oz); if (od > 1.2) { mx += ox / od * 1.2; mz += oz / od * 1.2 } // fica perto do lugar bom do cômodo
        b.nT -= dt; if (b.nT <= 0) { b.nT = 0.35; b.nx = (R() - 0.5) * 2 * b.err; b.ny = (R() - 0.5) * 2 * b.err }
        let aimP = null; for (let i = 0; i < BD.nSph; i++) { const s = BD.sph[i]; if (s.e === tgt && (s.part === 'ehead' || s.part === 'core')) { aimP = s.c; break } }
        if (!aimP) aimP = _qv2.set(S.pos.x, tgt.en.y + 1.2, S.pos.z)
        const cx = aimP.x - camera.position.x, cy = aimP.y - camera.position.y, cz = aimP.z - camera.position.z
        const yaw = Math.atan2(cx, cz) + b.nx, pit = Math.atan2(cy, Math.hypot(cx, cz)) + b.ny, turn = 7 * dt
        C.yaw = dAng(0, C.yaw + cl(dAng(C.yaw, yaw), -turn, turn)); C.pitch = cl(C.pitch + cl(pit - C.pitch, -turn, turn), -0.9, 0.75)
        const onT = Math.abs(dAng(C.yaw, yaw)) < 0.08 && Math.abs(pit - C.pitch) < 0.08
        if (al < 4.0 && !SG.hot && SG.heat < 65 && P.w !== 'escopeta') wantWeapon('escopeta')
        else if ((al > 6 || SG.hot || SG.heat >= 65) && P.w === 'escopeta' && SG.cd > 0.2) wantWeapon('pistola')
        if (onT && P.swap < 0) { IN.aim = al > 2.5; const Hh = HEAT[P.w]; if (!(P.w === 'pistola' && Hh.heat > 88)) IN.fire = true }
      } else if (b.door) { // virado para a porta: E
        const D2 = CA.doors.find((d) => d.id === b.door), yaw = Math.atan2(D2.cx - P.pos.x, D2.cz - P.pos.z)
        C.yaw = dAng(0, C.yaw + cl(dAng(C.yaw, yaw), -8 * dt, 8 * dt))
        if (Math.abs(dAng(C.yaw, yaw)) < 0.1 && b.eT <= 0) { k.KeyE = true; b.eT = 0.4 }
        if (D2.st === 'open' || LD.on) { b.door = null; b.wp++ }
        return
      } else {
        const w = ROUTE[b.wp]; if (!w) return
        const dx = w[0] - P.pos.x, dz = w[1] - P.pos.z, dl = Math.hypot(dx, dz)
        if (dl < 0.4) { if (w[3] && CA.doors.find((d) => d.id === w[3]).st !== 'open') b.door = w[3]; else b.wp++; return }
        mx = dx / dl; mz = dz / dl
        const yaw = Math.atan2(mx, mz); C.yaw = dAng(0, C.yaw + cl(dAng(C.yaw, yaw), -6 * dt, 6 * dt)); C.pitch = damp(C.pitch, -0.1, 4, dt)
      }
      const fx = Math.sin(C.yaw), fz = Math.cos(C.yaw), ml = Math.hypot(mx, mz)
      if (ml > 0.25) { const f = (mx * fx + mz * fz) / ml, r = (mx * -fz + mz * fx) / ml; if (f > 0.35) k.KeyW = true; if (f < -0.35) k.KeyS = true; if (r > 0.35) k.KeyD = true; if (r < -0.35) k.KeyA = true }
      if (P.hp < 100 && P.kits > 0 && b.healCd <= 0 && (!BD.token || !BD.token.o || BD.token.o.S.ph !== 'wind')) { k.KeyF = true; b.healCd = 2 }
    }

    // =====================================================================
