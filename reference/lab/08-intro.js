    // ---------- a Intro: a instalação da C.R.O.S. no subsolo (a planta da aba Intro do documento de design) ----------
    // Em metros: x de 0 a 54, z de 0 (o norte) a 86; um andar só, o chão em y 0. Eclusa (o elevador e a barreira), corredor de acesso,
    // escritório, corredor, refeitório, corredor de serviço com a enfermaria e a usina (12 m de pé-direito, o núcleo da barreira ao fundo).
    // Etapa 1: a planta navegável. Portas de correr que abrem com E, a grade, a barreira, os móveis e a luz desenhada (sem luz de verdade
    // por luminária: o tubo aceso, o cone e a mancha no chão são desenho; quem ilumina é a luz de brilho). Sem fantasmas, Lara e Nicolas ainda.
    // A casca sai como a da casa: as faces vão para listas por material e viram uma malha cada.
    // =====================================================================
    const INS = { built: false, g: null, cols: [], doors: [], glows: [], cps: {}, cp: 'eclusa', room: '', roomT: 0, near: null, begun: false, memb: null, beacons: [], flick: [], rings: [],
      core: null, spotRoom: '', spotK: 0, fogK: 0.034, beamK: { value: 0.8 }, beamT: { value: 0 }, objT: 0,
      enc: { st: 'sleep', wave: 0, spawnedW: 0, nextT: 0, cineT: 0, foes: [] }, tgt: V3(), ectos: [], cine: null, mates: [], mateSay: 0 }
    const IWT = 0.2, IX = 54, IZ = 86 // a espessura da parede (bloco); o tamanho da planta
    const IRO = [ // id, nome, subtítulo, x0, z0, x1, z1, pé-direito, parede, barra, altura da barra, piso, forro
      ['eclusa', 'Eclusa', 'elevador 3 · a barreira', 2, 2, 12, 12, 3.5, 'bloco', 'barraV', 1.2, 'concreto', 'forro'],
      ['corr1', 'Corredor de acesso', 'subsolo 3', 12, 4.5, 34, 9.5, 3.5, 'bloco', 'barraV', 1.2, 'concreto', 'forro'],
      ['escritorio', 'Escritório de turno', 'subsolo 3', 34, 1, 46, 13, 3.2, 'bege', 'barraM', 1.0, 'paviflex', 'forroP'],
      ['corr2', 'Corredor', 'subsolo 3', 37.5, 13, 42.5, 22, 3.5, 'bloco', 'barraV', 1.2, 'concreto', 'forro'],
      ['refeitorio', 'Refeitório', 'subsolo 3', 26, 22, 50, 40, 4.5, 'bege', 'azb', 1.8, 'granilite', 'forro'],
      ['corr3', 'Corredor de serviço', 'subsolo 3', 30, 40, 35, 52, 3.5, 'bloco', 'barraV', 1.2, 'concreto', 'forro'],
      ['enfermaria', 'Enfermaria', 'subsolo 3', 22, 44, 30, 50, 3.2, 'bege', 'azb', 1.8, 'granilite', 'forroP'],
      ['usina', 'Usina', 'o núcleo da barreira', 10, 52, 52, 84, 12, 'usinaP', 'chapa', 2.4, 'xadrez', 'forroU'],
    ].map(([id, name, sub, x0, z0, x1, z1, h, wall, wain, wh, floor, ceil]) => ({ id, name, sub, x0, z0, x1, z1, h, wall, wain, wh, floor, ceil }))
    function insRoom(x, z) { for (const r of IRO) if (x >= r.x0 && x < r.x1 && z >= r.z0 && z < r.z1) return r; return null }

    // ---------- as texturas (a 64 pixels por tile, como o resto) ----------
    function iGrime(g, w, h, r, n, dark, light) { for (let i = 0; i < n; i++) { g.fillStyle = r() < 0.6 ? dark : light; g.fillRect(r() * w | 0, r() * h | 0, 1 + (r() * 2 | 0), 1 + (r() * 2 | 0)) } }
    function iBlock(seed, base, mortar, var0) { // o bloco de concreto pintado (1,2 × 0,6 m: três blocos de 40 × 20 cm)
      return canvasTex(64, 32, (g, w, h) => {
        const r = rng(seed); g.fillStyle = mortar; g.fillRect(0, 0, w, h)
        for (let row = 0; row < 3; row++) { const y = Math.round(row * h / 3), yh = Math.round((row + 1) * h / 3) - y, off = row % 2 ? 11 : 0
          for (let x = -off; x < w; x += 21) { const v = (r() - 0.5) * var0; g.fillStyle = base(v); g.fillRect(x + 1, y + 1, 20, yh - 1) } }
        iGrime(g, w, h, r, 220, 'rgba(10,12,10,0.14)', 'rgba(230,240,230,0.05)')
        for (let i = 0; i < 6; i++) { g.fillStyle = 'rgba(20,24,18,0.14)'; const x = r() * w | 0; g.fillRect(x, 0, 1 + (r() * 2 | 0), 4 + r() * 24 | 0) } // os escorridos
      })
    }
    const IT = {
      bloco: iBlock(3101, (v) => `rgb(${128 + v * 14 | 0},${136 + v * 14 | 0},${126 + v * 12 | 0})`, '#5a6058', 1),
      barraV: iBlock(3103, (v) => `rgb(${40 + v * 8 | 0},${70 + v * 10 | 0},${58 + v * 8 | 0})`, '#1e2a24', 1),
      bege: canvasTex(64, 64, (g, w, h) => { const r = rng(3107); g.fillStyle = '#9a8f78'; g.fillRect(0, 0, w, h); iGrime(g, w, h, r, 420, 'rgba(40,32,20,0.13)', 'rgba(255,245,225,0.06)'); for (let i = 0; i < 5; i++) { g.fillStyle = 'rgba(50,40,26,0.12)'; const x = r() * w | 0; g.fillRect(x, 0, 2, 10 + r() * 50 | 0) } }),
      barraM: canvasTex(64, 64, (g, w, h) => { const r = rng(3109); g.fillStyle = '#3a2a1c'; g.fillRect(0, 0, w, h); for (let x = 0; x < w; x += 32) { g.fillStyle = '#1c130b'; g.fillRect(x, 0, 1, h) } for (let i = 0; i < 90; i++) { g.fillStyle = r() < 0.5 ? 'rgba(10,6,3,0.3)' : 'rgba(120,90,60,0.1)'; g.fillRect(r() * w | 0, r() * h | 0, 6 + (r() * 14 | 0), 1) } }),
      azb: canvasTex(64, 64, (g, w, h) => { // o azulejo branco de 15 cm, encardido nas juntas
        const r = rng(3113); g.fillStyle = '#6e6c64'; g.fillRect(0, 0, w, h)
        for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { const v = 186 + (r() * 22 | 0); g.fillStyle = `rgb(${v},${v - 2},${v - 9})`; g.fillRect(x * 16 + 1, y * 16 + 1, 15, 15); if (r() < 0.08) { g.fillStyle = '#4a4840'; g.fillRect(x * 16 + 2 + (r() * 8 | 0), y * 16 + 2 + (r() * 8 | 0), 4, 3) } }
        iGrime(g, w, h, r, 260, 'rgba(60,50,30,0.14)', 'rgba(255,255,255,0.06)')
      }),
      concreto: canvasTex(64, 64, (g, w, h) => { // o piso de concreto (2 m: a junta de dilatação na borda), manchado de óleo
        const r = rng(3119); g.fillStyle = '#4e4d48'; g.fillRect(0, 0, w, h)
        iGrime(g, w, h, r, 900, 'rgba(18,18,16,0.2)', 'rgba(200,198,185,0.07)')
        for (let i = 0; i < 3; i++) { const cx = r() * w, cy = r() * h, rr = 4 + r() * 9, gr = g.createRadialGradient(cx, cy, 0, cx, cy, rr); gr.addColorStop(0, 'rgba(12,10,8,0.4)'); gr.addColorStop(1, 'rgba(12,10,8,0)'); g.fillStyle = gr; g.fillRect(cx - rr, cy - rr, rr * 2, rr * 2) }
        g.fillStyle = 'rgba(14,14,12,0.7)'; g.fillRect(0, 0, w, 1); g.fillRect(0, 0, 1, h)
      }),
      xadrez: canvasTex(64, 64, (g, w, h) => { // a chapa xadrez da usina (1 m: chapas de 50 cm), gasta no meio
        const r = rng(3121); g.fillStyle = '#3c3e3e'; g.fillRect(0, 0, w, h)
        for (let y = 2; y < h; y += 8) for (let x = (y / 8 | 0) % 2 ? 6 : 2; x < w; x += 8) { g.fillStyle = (x + y) % 16 ? '#55585a' : '#4c4f50'; g.fillRect(x, y, 3, 1); g.fillRect(x + 1, y + 1, 1, 1) }
        iGrime(g, w, h, r, 500, 'rgba(10,10,8,0.22)', 'rgba(210,210,200,0.06)')
        g.fillStyle = '#1a1b1b'; g.fillRect(0, 0, w, 1); g.fillRect(0, 0, 1, h); g.fillRect(0, 32, w, 1); g.fillRect(32, 0, 1, h)
      }),
      paviflex: canvasTex(32, 32, (g, w, h) => { const r = rng(3127); for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) { g.fillStyle = (x + y) % 2 ? '#7a6a52' : '#5a4c3a'; g.fillRect(x * 16, y * 16, 16, 16) } iGrime(g, w, h, r, 180, 'rgba(20,14,8,0.2)', 'rgba(230,215,190,0.06)'); g.fillStyle = 'rgba(20,14,8,0.5)'; g.fillRect(0, 0, w, 1); g.fillRect(0, 0, 1, h); g.fillRect(0, 16, w, 1); g.fillRect(16, 0, 1, h) }),
      granilite: canvasTex(64, 64, (g, w, h) => { // o granilite com a junta de latão a cada metro
        const r = rng(3131); g.fillStyle = '#8a8272'; g.fillRect(0, 0, w, h)
        for (let i = 0; i < 700; i++) { const c = r(); g.fillStyle = c < 0.4 ? '#5a5448' : c < 0.7 ? '#b4ac98' : c < 0.85 ? '#3a3630' : '#a07a5a'; g.fillRect(r() * w | 0, r() * h | 0, 1 + (r() * 2 | 0), 1) }
        iGrime(g, w, h, r, 200, 'rgba(30,24,16,0.15)', 'rgba(255,250,235,0.05)')
        g.fillStyle = '#6a5630'; g.fillRect(0, 0, w, 1); g.fillRect(0, 0, 1, h)
      }),
      forro: canvasTex(64, 64, (g, w, h) => { const r = rng(3137); g.fillStyle = '#34342f'; g.fillRect(0, 0, w, h); iGrime(g, w, h, r, 500, 'rgba(10,10,8,0.2)', 'rgba(190,190,175,0.05)'); g.fillStyle = 'rgba(8,8,6,0.6)'; g.fillRect(0, 0, w, 2) }),
      forroP: canvasTex(64, 64, (g, w, h) => { const r = rng(3139); for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) { const v = 118 + (r() * 14 | 0); g.fillStyle = `rgb(${v},${v - 4},${v - 12})`; g.fillRect(x * 32 + 1, y * 32 + 1, 31, 31) } for (let i = 0; i < 300; i++) { g.fillStyle = 'rgba(40,36,28,0.25)'; g.fillRect(r() * w | 0, r() * h | 0, 1, 1) } for (let i = 0; i < 2; i++) { const cx = r() * w, cy = r() * h, rr = 6 + r() * 10, gr = g.createRadialGradient(cx, cy, 0, cx, cy, rr); gr.addColorStop(0, 'rgba(90,70,40,0.35)'); gr.addColorStop(1, 'rgba(90,70,40,0)'); g.fillStyle = gr; g.fillRect(cx - rr, cy - rr, rr * 2, rr * 2) } g.fillStyle = '#4a4a46'; g.fillRect(0, 0, w, 1); g.fillRect(0, 0, 1, h); g.fillRect(0, 32, w, 1); g.fillRect(32, 0, 1, h) }),
      forroU: canvasTex(64, 64, (g, w, h) => { const r = rng(3149); g.fillStyle = '#1e1f1e'; g.fillRect(0, 0, w, h); iGrime(g, w, h, r, 300, 'rgba(0,0,0,0.3)', 'rgba(150,150,140,0.05)') }),
      usinaP: canvasTex(64, 32, (g, w, h) => { // o concreto aparente da usina (2,4 × 1,2 m): as placas da fôrma e os furos dos tirantes
        const r = rng(3151); g.fillStyle = '#5c5a52'; g.fillRect(0, 0, w, h); iGrime(g, w, h, r, 520, 'rgba(20,18,14,0.16)', 'rgba(220,215,200,0.06)')
        g.fillStyle = 'rgba(20,18,14,0.5)'; g.fillRect(0, 0, w, 1); g.fillRect(0, 0, 1, h); g.fillRect(32, 0, 1, h)
        g.fillStyle = '#2a2824'; for (const [x, y] of [[8, 8], [24, 8], [40, 8], [56, 8], [8, 24], [24, 24], [40, 24], [56, 24]]) g.fillRect(x, y, 2, 2)
        for (let i = 0; i < 6; i++) { g.fillStyle = 'rgba(30,26,20,0.16)'; const x = r() * w | 0; g.fillRect(x, 0, 1 + (r() * 2 | 0), 6 + r() * 26 | 0) }
      }),
      chapa: canvasTex(64, 64, (g, w, h) => { // a chapa de aço rebitada (1,2 m), pintada de verde e descascando
        const r = rng(3157); g.fillStyle = '#34413a'; g.fillRect(0, 0, w, h); iGrime(g, w, h, r, 260, 'rgba(8,10,8,0.25)', 'rgba(170,180,170,0.06)')
        for (let i = 0; i < 9; i++) { g.fillStyle = 'rgba(90,60,36,0.35)'; g.fillRect(r() * w | 0, r() * h | 0, 2 + (r() * 6 | 0), 1 + (r() * 3 | 0)) } // a ferrugem
        g.fillStyle = '#1a201c'; g.fillRect(0, 0, w, 1); g.fillRect(0, 0, 1, h)
        g.fillStyle = '#5a6a60'; for (let k = 4; k < w; k += 8) { g.fillRect(k, 3, 1, 1); g.fillRect(3, k, 1, 1) }
      }),
      faixa: canvasTex(32, 32, (g, w, h) => { g.fillStyle = '#d0a020'; g.fillRect(0, 0, w, h); g.fillStyle = '#141210'; for (let k = -32; k < 64; k += 16) { g.beginPath(); g.moveTo(k, 0); g.lineTo(k + 8, 0); g.lineTo(k + 8 - 32, 32); g.lineTo(k - 32, 32); g.closePath(); g.fill() } const r = rng(3163); iGrime(g, w, h, r, 120, 'rgba(10,8,4,0.3)', 'rgba(255,240,200,0.05)') }),
      metal: canvasTex(32, 32, (g, w, h) => { const r = rng(3167); g.fillStyle = '#525a5c'; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y++) { g.fillStyle = `rgba(255,255,255,${(r() * 0.05).toFixed(3)})`; g.fillRect(0, y, w, 1) } iGrime(g, w, h, r, 120, 'rgba(10,10,10,0.25)', 'rgba(200,210,210,0.06)') }),
      hex: canvasTex(64, 64, (g, w, h) => { // a barreira: o favo de runas em ciano (no escuro: aditivo)
        g.fillStyle = '#000'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(140,240,255,0.9)'; g.lineWidth = 1
        const hx = (cx, cy, s) => { g.beginPath(); for (let i = 0; i <= 6; i++) { const a = i / 6 * Math.PI * 2 + Math.PI / 6, x = cx + Math.cos(a) * s, y = cy + Math.sin(a) * s; i ? g.lineTo(x, y) : g.moveTo(x, y) } g.stroke() }
        for (let y = 0; y < 5; y++) for (let x = 0; x < 5; x++) hx(x * 16 + (y % 2) * 8, y * 14, 8)
        g.fillStyle = 'rgba(160,245,255,0.8)'; for (const [x, y] of [[8, 7], [40, 21], [24, 35], [56, 49], [8, 49]]) { g.fillRect(x - 1, y - 3, 2, 6); g.fillRect(x - 3, y - 1, 6, 2) }
      }),
      aviso: canvasTex(64, 32, (g, w, h) => { g.fillStyle = '#b8a040'; g.fillRect(0, 0, w, h); g.fillStyle = '#141210'; g.fillRect(2, 2, w - 4, 7); g.fillStyle = '#b8a040'; g.font = 'bold 6px monospace'; g.textAlign = 'center'; g.fillText('C.R.O.S.', w / 2, 8); g.fillStyle = '#141210'; g.font = 'bold 8px monospace'; g.fillText('SUBSOLO 3', w / 2, 20); g.font = '6px monospace'; g.fillText('BARREIRA ATIVA', w / 2, 28) }),
      poco: canvasTex(64, 64, (g, w, h) => { const r = rng(3181); g.fillStyle = '#3a3934'; g.fillRect(0, 0, w, h); iGrime(g, w, h, r, 700, 'rgba(10,10,8,0.25)', 'rgba(200,195,180,0.06)'); for (let i = 0; i < 12; i++) { g.fillStyle = 'rgba(14,12,10,0.25)'; const x = r() * w | 0; g.fillRect(x, 0, 1 + (r() * 2 | 0), 20 + r() * 44 | 0) } g.fillStyle = 'rgba(10,10,8,0.5)'; g.fillRect(0, 0, w, 1) }),
      tela: canvasTex(16, 16, (g, w, h) => { g.clearRect(0, 0, w, h); g.strokeStyle = '#d8dcd8'; g.lineWidth = 1; g.beginPath(); g.moveTo(0, 8); g.lineTo(8, 0); g.lineTo(16, 8); g.lineTo(8, 16); g.closePath(); g.stroke(); g.fillStyle = '#d8dcd8'; for (const [x, y] of [[0, 8], [8, 0], [16, 8], [8, 16]]) g.fillRect(x - 1, y - 1, 2, 2) }),
      elev: canvasTex(128, 16, (g, w, h) => { g.fillStyle = '#141210'; g.fillRect(0, 0, w, h); g.fillStyle = '#c8a028'; g.fillRect(0, 0, w, 1); g.fillRect(0, h - 1, w, 1); g.font = 'bold 9px monospace'; g.textAlign = 'center'; g.fillText('ELEVADOR 3 · CARGA · S3', w / 2, 11.5) }),
      lacre: canvasTex(32, 64, (g, w, h) => { const r = rng(3173); g.fillStyle = '#3e4648'; g.fillRect(0, 0, w, h); g.fillStyle = '#2a3032'; g.fillRect(3, 6, w - 6, 24); g.fillRect(3, 34, w - 6, 24); g.fillStyle = '#c8a028'; g.save(); g.translate(w / 2, h / 2); g.rotate(-0.5); g.fillRect(-30, -3, 60, 6); g.rotate(1); g.fillRect(-30, -3, 60, 6); g.restore(); g.fillStyle = '#141210'; g.font = 'bold 5px monospace'; g.textAlign = 'center'; g.fillText('LACRADA', w / 2, h / 2 + 2); iGrime(g, w, h, r, 120, 'rgba(10,10,8,0.25)', 'rgba(200,200,190,0.05)') }),
    }
    IT.hex.magFilter = THREE.LinearFilter; IT.hex.encoding = THREE.LinearEncoding; IT.hex.repeat.set(3.6, 2.7)
    const IM = {
      bloco: std({ map: IT.bloco }), barraV: std({ map: IT.barraV }), bege: std({ map: IT.bege }), barraM: std({ map: IT.barraM }), azb: std({ map: IT.azb }),
      concreto: std({ map: IT.concreto }), xadrez: std({ map: IT.xadrez }), paviflex: std({ map: IT.paviflex }), granilite: std({ map: IT.granilite }),
      forro: std({ map: IT.forro }), poco: std({ map: IT.poco }), forroP: std({ map: IT.forroP }), forroU: std({ map: IT.forroU }), usinaP: std({ map: IT.usinaP }), chapa: std({ map: IT.chapa }), faixa: std({ map: IT.faixa }),
      rodape: std({ color: '#1a1c1a' }), friso: std({ color: '#2a2e2a' }), metalE: std({ color: '#2c3032' }), lacre: std({ map: IT.lacre }),
    }
    const ITILE = { bloco: [1.2, 0.6], barraV: [1.2, 0.6], bege: [2, 2], barraM: [1.2, 1.2], azb: [0.6, 0.6], concreto: [2, 2], xadrez: [1, 1], paviflex: [0.6, 0.6], granilite: [1, 1], forro: [2, 2], forroP: [1.2, 1.2], forroU: [4, 4], poco: [2, 2], usinaP: [2.4, 1.2], chapa: [1.2, 1.2], faixa: [0.5, 0.5] }
    const INOCAST = new Set(['forro', 'forroP', 'forroU', 'concreto', 'xadrez', 'paviflex', 'granilite'])
    const IF = { // os materiais dos móveis e das máquinas
      metal: std({ map: IT.metal }), dark: std({ color: '#1c1e1f' }), steel: std({ color: '#4a5052' }), steelD: std({ color: '#2e3234' }), green: std({ color: '#3e4a42' }), greenD: std({ color: '#2a332d' }),
      locker: std({ color: '#4c5a52' }), table: std({ color: '#7a7466' }), tableL: std({ color: '#5a5448' }), wood: std({ color: '#4a3524' }), woodD: std({ color: '#2a1c12' }), beige: std({ color: '#a89a7c' }),
      crt: std({ color: '#b0a68c' }), screen: basic({ color: '#0e1612' }), screenOn: basic({ color: '#3a6a4a' }), paper: std({ color: '#b8b09a' }), pipe: std({ color: '#5a4636' }), pipeG: std({ color: '#3a4a40' }),
      yellow: std({ color: '#b08a20' }), red: std({ color: '#7a2a22' }), rubber: std({ color: '#151515' }), white: std({ color: '#b8b6ac' }), cloth: std({ color: '#6a7a74', side: THREE.DoubleSide }), shade: std({ color: '#2a332d', side: THREE.DoubleSide }), sheetW: std({ color: '#c8c6bc' }),
      glass: basic({ color: '#1c262c' }), sign: std({ map: IT.aviso }), elev: std({ map: IT.elev }), tela: std({ map: IT.tela, color: '#8a948e', alphaTest: 0.5, side: THREE.DoubleSide }), tray: std({ color: '#7c7e7a' }), cable: std({ color: '#121212' }), amberOff: basic({ color: '#3a2a12' }),
      lampOn: basic({ color: '#dff0e4' }), lampWarm: basic({ color: '#ffe0a8' }), lampOff: std({ color: '#3c403e' }), red2: basic({ color: '#ff3a24' }), cyan: basic({ color: '#9ef2ff' }), orange: basic({ color: '#ff9a3a' }), green2: basic({ color: '#6aff8a' }),
    }
    function iGrp(x, y, z, ry = 0, par) { const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; (par || INS.g).add(g); return g }
    function iCol(x, z, hx, hz, yaw, y0, y1, o) { const c = Object.assign({ x, z, hx, hz, yaw: yaw || 0, y0, y1 }, o || {}); INS.cols.push(c); return c }
    function iBoxM(par, mat, x0, y0, z0, x1, y1, z1, cast = true) { return fp(par, bxg(x1 - x0, y1 - y0, z1 - z0), mat, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, 0, 0, 0, cast) }
    function iSolid(mat, x0, y0, z0, x1, y1, z1, cast = true) { iCol((x0 + x1) / 2, (z0 + z1) / 2, (x1 - x0) / 2, (z1 - z0) / 2, 0, y0, y1); return iBoxM(INS.g, mat, x0, y0, z0, x1, y1, z1, cast) }

    // ---------- a casca: as faces por material (como a da casa) ----------
    const ISHL = new Map()
    function iFace(key, P0, P1, P2, P3, N, vOff = 0) {
      let L = ISHL.get(key); if (!L) ISHL.set(key, (L = { p: [], n: [], u: [] }))
      const t = ITILE[key] || [1, 1]
      const ax = P1[0] - P0[0], ay = P1[1] - P0[1], az = P1[2] - P0[2], bx = P2[0] - P0[0], by = P2[1] - P0[1], bz = P2[2] - P0[2]
      const cx = ay * bz - az * by, cy = az * bx - ax * bz, cz = ax * by - ay * bx
      const Q = cx * N[0] + cy * N[1] + cz * N[2] < 0 ? [P0, P3, P2, P1] : [P0, P1, P2, P3]
      const top = Math.abs(N[1]) > 0.5, side = Math.abs(N[0]) > 0.5
      for (const i of [0, 1, 2, 0, 2, 3]) { const p = Q[i]; L.p.push(p[0], p[1], p[2]); L.n.push(N[0], N[1], N[2]); L.u.push(top ? p[0] / t[0] : side ? p[2] / t[0] : p[0] / t[0], top ? p[2] / t[1] : (p[1] - vOff) / t[1]) }
    }
    function iBox(key, x0, y0, z0, x1, y1, z1, skip) {
      const F = [['px', [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1], [1, 0, 0]], ['nx', [x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], [-1, 0, 0]],
        ['py', [x0, y1, z0], [x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [0, 1, 0]], ['ny', [x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], [0, -1, 0]],
        ['pz', [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], [0, 0, 1]], ['nz', [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [x1, y0, z0], [0, 0, -1]]]
      for (const [k, a, b, c, d, n] of F) if (!skip || !skip.includes(k)) iFace(key, a, b, c, d, n)
    }
    function iShBuild() {
      ISHL.forEach((L, key) => {
        const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(L.p, 3)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(L.n, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(L.u, 2)); geo.computeBoundingSphere()
        const m = new THREE.Mesh(geo, IM[key]); m.castShadow = !INOCAST.has(key); m.receiveShadow = true; m.userData.noBake = true; m.userData.env = true; m.name = 'intro:' + key; INS.g.add(m)
      })
      ISHL.clear()
    }

    // ---------- as paredes: saem da planta (onde dois cômodos se encontram, ou um cômodo e o lado de fora) ----------
    const IDOORS = [ // into: a folha corre para os dois lados (n 2) ou para +u (n 1)
      { id: 'barreira', ax: 'z', c: 12, u: 7, w: 4.4, h: 3.3, kind: 'barrier', st: 'open' },
      { id: 'escrit', ax: 'z', c: 34, u: 7, w: 2.4, h: 2.6, kind: 'slide', n: 2, st: 'closed', name: 'o escritório' },
      { id: 'corr2', ax: 'x', c: 13, u: 40, w: 2.4, h: 2.6, kind: 'slide', n: 2, st: 'closed', name: 'o corredor' },
      { id: 'refeit', ax: 'x', c: 22, u: 40, w: 2.4, h: 2.6, kind: 'slide', n: 2, st: 'closed', name: 'o refeitório' },
      { id: 'grade', ax: 'x', c: 40, u: 32.5, w: 3.0, h: 2.8, kind: 'grade', st: 'closed', name: 'a grade' },
      { id: 'enferm', ax: 'z', c: 30, u: 47, w: 1.6, h: 2.4, kind: 'slide', n: 1, st: 'closed', name: 'a enfermaria' },
      { id: 'usina', ax: 'x', c: 52, u: 32.5, w: 4.0, h: 3.2, kind: 'slide', n: 2, st: 'closed', name: 'a usina' },
    ]
    const ISEAL = [['x', 4.5, 17, 1], ['x', 4.5, 26, 1], ['x', 9.5, 21, -1], ['x', 9.5, 29, -1], ['z', 50, 35.5, -1], ['z', 10, 68, 1], ['z', 52, 76, -1]] // as lacradas (só cenário): eixo, c, u, lado da face
    function insSegs() {
      const out = []
      const run = (ax, c, n, at) => {
        let cur = null, pk = null
        for (let k = 0; k <= n; k++) {
          let key = null, ab = null
          if (k < n) { ab = at(k); if (ab[0] !== ab[1]) key = (ab[0] ? ab[0].id : '-') + '|' + (ab[1] ? ab[1].id : '-') }
          if (cur && key === cur.key) { cur.a1 = (k + 1) / 10; pk = key; continue }
          if (cur) { cur.contB = key !== null; out.push(cur); cur = null }
          if (key) cur = { ax, c, a0: k / 10, a1: (k + 1) / 10, neg: ab[0], pos: ab[1], key, holes: [], contA: pk !== null, contB: false }
          pk = key
        }
      }
      const xs = [...new Set(IRO.flatMap((r) => [r.x0, r.x1]))], zs = [...new Set(IRO.flatMap((r) => [r.z0, r.z1]))]
      for (const x of xs) run('z', x, IZ * 10, (k) => { const z = k / 10 + 0.05; return [insRoom(x - 0.05, z), insRoom(x + 0.05, z)] })
      for (const z of zs) run('x', z, IX * 10, (k) => { const x = k / 10 + 0.05; return [insRoom(x, z - 0.05), insRoom(x, z + 0.05)] })
      return out
    }
    function insWalls() {
      const segs = insSegs()
      for (const D2 of IDOORS) {
        const s = segs.find((q) => q.ax === D2.ax && Math.abs(q.c - D2.c) < 1e-6 && D2.u > q.a0 && D2.u < q.a1)
        if (!s) { console.warn('intro: porta sem parede', D2.id); continue }
        D2.hole = { u0: D2.u - D2.w / 2, u1: D2.u + D2.w / 2, v1: D2.h, kind: D2.kind, D: D2 }; s.holes.push(D2.hole)
      }
      for (const s of segs) { s.holes.sort((a, b) => a.u0 - b.u0); insWallGeo(s); insWallCols(s) }
    }
    function insWallGeo(s) {
      const A0 = s.a0 - (s.contA ? 0 : IWT / 2), A1 = s.a1 + (s.contB ? 0 : IWT / 2), isX = s.ax === 'x'
      for (const side of [-1, 1]) {
        const room = side < 0 ? s.neg : s.pos; if (!room) continue
        const yt = room.h, cc = s.c + side * IWT / 2, N = isX ? [0, 0, side] : [side, 0, 0]
        const R4 = []; let u = A0
        for (const ho of s.holes) { if (ho.u0 > u) R4.push([u, ho.u0, 0, yt]); if (ho.v1 < yt) R4.push([ho.u0, ho.u1, ho.v1, yt]); u = ho.u1 }
        if (A1 > u) R4.push([u, A1, 0, yt])
        const P = isX ? (uu, vv) => [uu, vv, cc] : (uu, vv) => [cc, vv, uu]
        const F = (k, u0, u1, v0, v1) => iFace(k, P(u0, v0), P(u1, v0), P(u1, v1), P(u0, v1), N)
        for (const [u0, u1, v0, v1] of R4) {
          if (v0 < room.wh - 1e-6 && v1 > room.wh + 1e-6) { F(room.wain, u0, u1, v0, room.wh); F(room.wall, u0, u1, room.wh, v1) }
          else F(v1 <= room.wh + 1e-6 ? room.wain : room.wall, u0, u1, v0, v1)
        }
        // o rodapé e o friso no alto da barra (menos nas portas)
        const spans = []; let uu = A0; for (const h of s.holes) { if (h.u0 > uu) spans.push([uu, h.u0]); uu = Math.max(uu, h.u1) } if (A1 > uu) spans.push([uu, A1])
        for (const [u0, u1] of spans) {
          if (u1 - u0 < 0.02) continue
          const lo = Math.min(cc, cc + side * 0.03), hi = Math.max(cc, cc + side * 0.03), lo2 = Math.min(cc, cc + side * 0.02), hi2 = Math.max(cc, cc + side * 0.02)
          if (isX) { iBox('rodape', u0, 0, lo, u1, 0.12, hi); iBox('friso', u0, room.wh - 0.02, lo2, u1, room.wh + 0.03, hi2) } else { iBox('rodape', lo, 0, u0, hi, 0.12, u1); iBox('friso', lo2, room.wh - 0.02, u0, hi2, room.wh + 0.03, u1) }
        }
      }
      for (const ho of s.holes) insHoleGeo(s, ho)
    }
    function insHoleGeo(s, ho) { // o batente de aço por dentro da espessura e, dos dois lados, o marco com a faixa de aviso
      const c0 = s.c - IWT / 2, c1 = s.c + IWT / 2, isX = s.ax === 'x'
      const P = (u, v, c) => (isX ? [u, v, c] : [c, v, u]), Nu = (g) => (isX ? [g, 0, 0] : [0, 0, g])
      iFace('metalE', P(ho.u0, 0, c0), P(ho.u0, 0, c1), P(ho.u0, ho.v1, c1), P(ho.u0, ho.v1, c0), Nu(1))
      iFace('metalE', P(ho.u1, 0, c0), P(ho.u1, 0, c1), P(ho.u1, ho.v1, c1), P(ho.u1, ho.v1, c0), Nu(-1))
      iFace('metalE', P(ho.u0, ho.v1, c0), P(ho.u1, ho.v1, c0), P(ho.u1, ho.v1, c1), P(ho.u0, ho.v1, c1), [0, -1, 0])
      for (const side of [-1, 1]) {
        const room = side < 0 ? s.neg : s.pos; if (!room) continue
        const cc = s.c + side * IWT / 2, fw = ho.kind === 'barrier' ? 0.2 : 0.16, key = ho.kind === 'barrier' ? 'metalE' : 'faixa'
        const bx = (u0, u1, v0, v1, d) => { const lo = Math.min(cc, cc + side * d), hi = Math.max(cc, cc + side * d); if (isX) iBox(key, u0, v0, lo, u1, v1, hi); else iBox(key, lo, v0, u0, hi, v1, u1) }
        bx(ho.u0 - fw, ho.u0, 0, ho.v1 + fw, 0.05); bx(ho.u1, ho.u1 + fw, 0, ho.v1 + fw, 0.05); bx(ho.u0 - fw, ho.u1 + fw, ho.v1, ho.v1 + fw, 0.05)
      }
      // a faixa de aviso no chão, nos dois lados da passagem
      for (const g of [-1, 1]) { const a = s.c + g * (IWT / 2 + 0.02), b = s.c + g * (IWT / 2 + 0.36), lo = Math.min(a, b), hi = Math.max(a, b); if (isX) iFace('faixa', [ho.u0, 0.006, lo], [ho.u1, 0.006, lo], [ho.u1, 0.006, hi], [ho.u0, 0.006, hi], [0, 1, 0]); else iFace('faixa', [lo, 0.006, ho.u0], [hi, 0.006, ho.u0], [hi, 0.006, ho.u1], [lo, 0.006, ho.u1], [0, 1, 0]) }
    }
    function insWallCols(s) { // a parede menos as portas; o que fica em cima da porta segura tiros e câmera
      const A0 = s.a0 - IWT / 2, A1 = s.a1 + IWT / 2, y1 = Math.max(s.neg ? s.neg.h : 0, s.pos ? s.pos.h : 0)
      const add = (u0, u1, v0, v1) => { if (u1 - u0 < 0.01) return; const um = (u0 + u1) / 2, hu = (u1 - u0) / 2; iCol(s.ax === 'x' ? um : s.c, s.ax === 'x' ? s.c : um, s.ax === 'x' ? hu : IWT / 2, s.ax === 'x' ? IWT / 2 : hu, 0, v0, v1) }
      let u = A0
      for (const ho of s.holes) { add(u, ho.u0, 0, y1); add(ho.u0, ho.u1, ho.v1, y1); u = ho.u1 }
      add(u, A1, 0, y1)
    }
    function insFloors() {
      for (const r of IRO) {
        iFace(r.floor, [r.x0, 0, r.z0], [r.x1, 0, r.z0], [r.x1, 0, r.z1], [r.x0, 0, r.z1], [0, 1, 0])
        const cut = r.id === 'eclusa' ? [[2, 2, 12, 4.2], [2, 9.8, 12, 12], [7, 4.2, 12, 9.8]] : [[r.x0, r.z0, r.x1, r.z1]] // na eclusa, o buraco do poço do elevador
        for (const [x0, z0, x1, z1] of cut) iFace(r.ceil, [x0, r.h, z0], [x1, r.h, z0], [x1, r.h, z1], [x0, r.h, z1], [0, -1, 0])
      }
      // as faixas no chão: a linha amarela dos corredores e o quadro de segurança em volta do núcleo
      const line = (x0, z0, x1, z1) => iFace('faixa', [x0, 0.005, z0], [x1, 0.005, z0], [x1, 0.005, z1], [x0, 0.005, z1], [0, 1, 0])
      line(12.4, 4.75, 33.6, 4.85); line(12.4, 9.15, 33.6, 9.25); line(30.25, 40.4, 30.35, 51.6)
      line(24.6, 75.6, 37.4, 75.9); line(24.6, 75.6, 24.9, 83.6); line(37.1, 75.6, 37.4, 83.6)
    }

    // ---------- as portas: de correr (somem dentro da parede), a grade que sobe e a barreira ----------
    const memMat = new THREE.MeshBasicMaterial({ map: IT.hex, color: new THREE.Color('#5fd8ff').convertSRGBToLinear(), transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })
    function insDoors() {
      for (const D2 of IDOORS) {
        const isX = D2.ax === 'x'
        D2.cx = isX ? D2.u : D2.c; D2.cz = isX ? D2.c : D2.u; D2.k = D2.st === 'open' ? 1 : 0; D2.want = D2.k; D2.shake = 0; D2.leaves = []
        const toW = (u, v, c) => (isX ? V3(u, v, c) : V3(c, v, u))
        if (D2.kind === 'barrier') { // a membrana: o favo de runas correndo, e as duas barras que a projetam
          const m = new THREE.Mesh(new THREE.PlaneGeometry(D2.w, D2.h), memMat); m.position.copy(toW(D2.u, D2.h / 2, D2.c)); m.rotation.y = isX ? 0 : Math.PI / 2; m.renderOrder = 3; INS.g.add(m); INS.memb = m
          for (const g of [-1, 1]) for (const sd of [-1, 1]) { const p = toW(D2.u + g * (D2.w / 2 - 0.05), D2.h / 2, D2.c + sd * 0.08); const b = fp(INS.g, bxg(isX ? 0.06 : 0.04, D2.h, isX ? 0.04 : 0.06), IF.cyan, p.x, p.y, p.z, 0, 0, 0, false); b.userData.noBake = true }
          INS.glows.push({ p: toW(D2.u, 1.6, D2.c), r: 5, c: new THREE.Color('#7fe3ff').convertSRGBToLinear().multiplyScalar(0.9), k: 1, mem: true })
          D2.col = { off: true }; continue
        }
        if (D2.kind === 'grade') { // a porta de enrolar: ripas de aço; sobe para dentro da parede
          const g = new THREE.Group(); g.position.copy(toW(D2.u, 0, D2.c)); g.rotation.y = isX ? 0 : Math.PI / 2; INS.g.add(g); BAKE_ANCH.add(g)
          for (let y = 0.06; y < D2.h; y += 0.14) fp(g, bxg(D2.w - 0.02, 0.11, 0.045), IF.steel, 0, y + 0.055, 0)
          fp(g, bxg(D2.w - 0.02, 0.08, 0.07), IF.yellow, 0, 0.04, 0); fp(g, bxg(0.3, 0.05, 0.09), IF.dark, 0, 0.9, 0)
          D2.leaves.push({ g, base: g.position.clone(), k: 'up' })
        } else {
          const n = D2.n, lw = D2.w / n
          for (let i = 0; i < n; i++) {
            const g = new THREE.Group(), uc = D2.u - D2.w / 2 + lw * (i + 0.5); g.position.copy(toW(uc, 0, D2.c)); g.rotation.y = isX ? 0 : Math.PI / 2; INS.g.add(g); BAKE_ANCH.add(g)
            fp(g, bxg(lw - 0.012, D2.h - 0.01, 0.07), IF.metal, 0, D2.h / 2, 0)
            fp(g, bxg(lw - 0.012, 0.22, 0.078), IF.yellow, 0, 1.05, 0) // a faixa amarela no meio
            fp(g, bxg(Math.min(0.5, lw * 0.4), 0.36, 0.08), IF.glass, 0, 1.75, 0, 0, 0, 0, false) // o visor
            fp(g, bxg(0.05, 0.3, 0.1), IF.dark, (i === 0 && n === 2 ? 1 : -1) * (lw / 2 - 0.12), 1.0, 0) // a alça
            const dir = n === 2 ? (i === 0 ? -1 : 1) : 1
            D2.leaves.push({ g, base: g.position.clone(), dir, lw })
          }
        }
        D2.col = iCol(D2.cx, D2.cz, isX ? D2.w / 2 : 0.08, isX ? 0.08 : D2.w / 2, 0, 0, D2.h, { door: D2, off: D2.st === 'open' })
        insDoorPose(D2, 0)
      }
      // as lacradas: a folha pintada colada na parede, com o X amarelo; E só avisa
      for (const [ax, c, u, side] of ISEAL) {
        const cc = c + side * (IWT / 2 + 0.02), w = 1.4, h = 2.4
        fp(INS.g, new THREE.PlaneGeometry(w, h), IM.lacre, ax === 'x' ? u : cc, h / 2, ax === 'x' ? cc : u, 0, ax === 'x' ? (side > 0 ? 0 : Math.PI) : side * Math.PI / 2, 0, false)
        const c2 = c + side * (IWT / 2), lo = Math.min(c2, c2 + side * 0.05), hi = Math.max(c2, c2 + side * 0.05)
        for (const [u0, u1, v0, v1] of [[u - w / 2 - 0.12, u - w / 2, 0, h + 0.12], [u + w / 2, u + w / 2 + 0.12, 0, h + 0.12], [u - w / 2 - 0.12, u + w / 2 + 0.12, h, h + 0.12]]) { if (ax === 'x') iBox('metalE', u0, v0, lo, u1, v1, hi); else iBox('metalE', lo, v0, u0, hi, v1, u1) }
        INS.doors.push({ id: 'lacre' + INS.doors.length, kind: 'sealed', st: 'locked', cx: ax === 'x' ? u : cc, cz: ax === 'x' ? cc : u, k: 0, want: 0, shake: 0, leaves: [], col: { off: true }, msg: 'Lacrada pela barreira: não abre' })
      }
      INS.doors.unshift(...IDOORS)
    }
    function insDoorPose(D2, t) {
      for (const L of D2.leaves) {
        const sh = D2.shake > 0 ? Math.sin(t * 60) * 0.006 * D2.shake : 0
        if (L.k === 'up') { L.g.position.copy(L.base); L.g.position.y += D2.k * (D2.h - 0.25) + sh; continue }
        const off = D2.k * (L.lw - 0.1) * L.dir + sh
        L.g.position.copy(L.base); if (D2.ax === 'x') L.g.position.x += off; else L.g.position.z += off
      }
    }

    // ---------- a luz desenhada: os tubos acesos, o cone no ar e a mancha no chão (uma malha só para cada); as luzes de brilho ----------
    const iBeamMat = (col, kU) => new THREE.ShaderMaterial({ uniforms: { uK: kU || INS.beamK, uT: INS.beamT, uCol: { value: new THREE.Color(col).convertSRGBToLinear() }, uFogD: { value: 0.03 } },
      vertexShader: beamMat.vertexShader, fragmentShader: beamMat.fragmentShader, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })
    const iPoolMat = (col, op) => new THREE.MeshBasicMaterial({ map: poolTex, color: new THREE.Color(col).convertSRGBToLinear(), transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -8 })
    const ILB = { cool: { bp: [], bv: [], bn: [], pp: [], pu: [], col: '#cfe6da', op: 0.2, k: { value: 0.5 } }, warm: { bp: [], bv: [], bn: [], pp: [], pu: [], col: '#ffcf8a', op: 0.22, k: { value: 0.38 } } }
    function iCone(L, x, y, z, hw, hd, sp) { // o cone: do retângulo do tubo ao retângulo maior no chão (aV: 0 em cima, 1 no chão)
      const T = [[x - hw, y, z - hd], [x + hw, y, z - hd], [x + hw, y, z + hd], [x - hw, y, z + hd]], B = T.map((p) => [x + Math.sign(p[0] - x) * (hw + sp), 0.02, z + Math.sign(p[2] - z) * (hd + sp)])
      for (let e = 0; e < 4; e++) {
        const a0 = T[e], a1 = T[(e + 1) % 4], b0 = B[e], b1 = B[(e + 1) % 4]
        _qv.set(a1[0] - a0[0], a1[1] - a0[1], a1[2] - a0[2]).cross(_qv2.set(b0[0] - a0[0], b0[1] - a0[1], b0[2] - a0[2])).normalize()
        for (const [p, v] of [[a0, 0], [a1, 0], [b1, 1], [a0, 0], [b1, 1], [b0, 1]]) { L.bp.push(p[0], p[1], p[2]); L.bv.push(v); L.bn.push(_qv.x, _qv.y, _qv.z) }
      }
      const fx0 = x - hw - sp * 0.8, fx1 = x + hw + sp * 0.8, fz0 = z - hd - sp * 0.8, fz1 = z + hd + sp * 0.8
      for (const [p, uv] of [[[fx0, 0.012, fz0], [0, 0]], [[fx1, 0.012, fz0], [1, 0]], [[fx1, 0.012, fz1], [1, 1]], [[fx0, 0.012, fz0], [0, 0]], [[fx1, 0.012, fz1], [1, 1]], [[fx0, 0.012, fz1], [0, 1]]]) { L.pp.push(...p); L.pu.push(...uv) }
    }
    function iLightMesh(L, par) {
      const out = []
      if (L.bp.length) { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(L.bp, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(L.bn, 3)); g.setAttribute('aV', new THREE.Float32BufferAttribute(L.bv, 1)); const m = new THREE.Mesh(g, L.bm || (L.bm = iBeamMat(L.col, L.k))); m.frustumCulled = false; m.renderOrder = 3; par.add(m); out.push(m) }
      if (L.pp.length) { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(L.pp, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(L.pu, 2)); const m = new THREE.Mesh(g, L.pm || (L.pm = iPoolMat(L.col, L.op))); m.renderOrder = 2; par.add(m); out.push(m) }
      return out
    }
    // uma luminária: 'tubo' (a calha fluorescente), 'placa' (a de embutir, 60 × 60) ou 'campana' (a da usina, pendurada); mode 'on' | 'off' | 'flick'
    function iLamp(kind, x, z, mode, o = {}) {
      const r = insRoom(x, z), h = r ? r.h : 3.5, axis = o.axis || 'x'
      if (kind === 'campana') {
        const y = o.y || 9, g = iGrp(x, y, z)
        fp(g, cyg(0.02, 0.02, h - y, 4), IF.cable, 0, (h - y) / 2, 0, 0, 0, 0, false)
        fp(g, new THREE.CylinderGeometry(0.22, 0.62, 0.5, 10, 1, true), IF.shade, 0, 0, 0, 0, 0, 0, false)
        const bulb = fp(g, new THREE.CylinderGeometry(0.5, 0.5, 0.04, 10), mode === 'off' ? IF.lampOff : IF.lampWarm, 0, -0.23, 0, 0, 0, 0, false)
        if (mode === 'off') return
        if (mode === 'flick') { bulb.material = IF.lampWarm.clone(); bulb.userData.noBake = true }
        const L = mode === 'flick' ? { bp: [], bv: [], bn: [], pp: [], pu: [], col: '#ffcf8a', op: 0.22, k: ILB.warm.k } : ILB.warm
        iCone(L, x, y - 0.26, z, 0.45, 0.45, 3.4)
        const gl = { p: V3(x, y - 1.2, z), r: 11, c: new THREE.Color('#ffc880').convertSRGBToLinear().multiplyScalar(1.15), k: 1, flick: mode === 'flick' ? 1 : 0, ph: x * 1.7 + z }
        INS.glows.push(gl)
        if (mode === 'flick') iFlickRec(bulb.material, L, gl)
        return
      }
      const y = o.y || h - 0.02, len = kind === 'placa' ? 0.6 : o.len || 1.25, wid = kind === 'placa' ? 0.6 : 0.16
      const hw = axis === 'x' ? len / 2 : wid / 2, hd = axis === 'x' ? wid / 2 : len / 2
      const housing = iBoxM(INS.g, IF.steelD, x - hw - 0.03, y - 0.07, z - hd - 0.03, x + hw + 0.03, y, z + hd + 0.03, false)
      const diff = iBoxM(INS.g, mode === 'off' ? IF.lampOff : IF.lampOn, x - hw, y - 0.085, z - hd, x + hw, y - 0.06, z + hd, false)
      if (mode === 'off') return
      if (mode === 'flick') { diff.material = IF.lampOn.clone(); diff.userData.noBake = true }
      const L = mode === 'flick' ? { bp: [], bv: [], bn: [], pp: [], pu: [], col: '#cfe6da', op: 0.2, k: ILB.cool.k } : ILB.cool
      const sp = Math.min(1.7, h * 0.42)
      iCone(L, x, y - 0.09, z, hw, hd, sp)
      const gl = { p: V3(x, Math.max(1.2, h - 1.3), z), r: o.r || 4.6, c: new THREE.Color('#d6eadf').convertSRGBToLinear().multiplyScalar(o.m || 0.85), k: 1, flick: mode === 'flick' ? 1 : 0, ph: x * 1.3 + z * 0.7 }
      INS.glows.push(gl)
      if (mode === 'flick') iFlickRec(diff.material, L, gl)
    }
    function iFlickRec(diff, L, gl) { // a luminária piscando: o tubo, o cone e a mancha dela ficam fora das malhas juntas
      const ms = iLightMesh(L, INS.g), beam = ms[0].material, pool = ms[1].material
      INS.flick.push({ diff, beam, pool, base: diff.color.clone(), bcol: beam.uniforms.uCol.value.clone(), op: pool.opacity, gl, ph: gl.ph })
    }
    function iBeacon(x, y, z) { // a luz de emergência: o domo vermelho, girando, com o facho
      const g = iGrp(x, y, z)
      fp(g, cyg(0.09, 0.11, 0.06, 8), IF.dark, 0, 0.03, 0, 0, 0, 0, false)
      fp(g, new THREE.SphereGeometry(0.085, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2), IF.red2, 0, 0.06, 0, 0, 0, 0, false)
      const rot = new THREE.Group(); rot.position.y = 0.1; g.add(rot)
      const bm = new THREE.MeshBasicMaterial({ map: poolTex, color: new THREE.Color('#ff3a24').convertSRGBToLinear(), transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })
      const beam = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 0.5).translate(1.6, 0, 0), bm); beam.renderOrder = 3; rot.add(beam)
      const gl = { p: V3(x, y - 0.4, z), r: 4.2, c: new THREE.Color('#ff3a24').convertSRGBToLinear().multiplyScalar(0.9), k: 1, beacon: true }
      INS.glows.push(gl); INS.beacons.push({ rot, gl, ph: x + z })
    }

    // ---------- os móveis e as máquinas (o que é sólido ganha colisão) ----------
    function iLocker(x, z, ry) { const g = iGrp(x, 0, z, ry); fp(g, bxg(0.5, 1.9, 0.5), IF.locker, 0, 0.95, 0); for (const y of [1.6, 1.68, 1.76]) fp(g, bxg(0.3, 0.02, 0.01), IF.dark, 0, y, 0.255, 0, 0, 0, false); fp(g, bxg(0.03, 0.12, 0.03), IF.steel, 0.17, 1.0, 0.26, 0, 0, 0, false); return g }
    function iBench(x0, z0, x1, z1, y = 0.45) { iSolid(IF.wood, x0, y - 0.05, z0, x1, y, z1); for (const xx of [x0 + 0.15, x1 - 0.15]) iBoxM(INS.g, IF.steelD, xx - 0.03, 0, (z0 + z1) / 2 - 0.12, xx + 0.03, y - 0.05, (z0 + z1) / 2 + 0.12) }
    function iTable(x, z, w, d, mat = IF.table, h = 0.76) {
      iCol(x, z, w / 2, d / 2, 0, 0, h); iBoxM(INS.g, mat, x - w / 2, h - 0.04, z - d / 2, x + w / 2, h, z + d / 2)
      for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) iBoxM(INS.g, IF.steelD, x + a * (w / 2 - 0.08) - 0.025, 0, z + b * (d / 2 - 0.08) - 0.025, x + a * (w / 2 - 0.08) + 0.025, h - 0.04, z + b * (d / 2 - 0.08) + 0.025)
    }
    function iCrt(x, y, z, ry, on) { const g = iGrp(x, y, z, ry); fp(g, bxg(0.4, 0.34, 0.38), IF.crt, 0, 0.2, 0); fp(g, bxg(0.3, 0.24, 0.02), on ? IF.screenOn : IF.screen, 0, 0.21, 0.19, 0, 0, 0, false); fp(g, bxg(0.44, 0.03, 0.18), IF.crt, 0, 0.015, 0.16, 0, 0, 0, false) }
    function iPipe(x0, y0, z0, x1, y1, z1, r, mat = IF.pipe) { const dx = x1 - x0, dy = y1 - y0, dz = z1 - z0, len = Math.hypot(dx, dy, dz), m = fp(INS.g, cyg(r, r, len, 8), mat, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, 0, 0, 0, false); m.quaternion.setFromUnitVectors(_qv.set(0, 1, 0), _qv2.set(dx / len, dy / len, dz / len)); return m }
    function iCrate(x, z, s, h, ry = 0) { iCol(x, z, s / 2, s / 2, ry, 0, h); const g = iGrp(x, 0, z, ry); fp(g, bxg(s, h, s), IF.wood, 0, h / 2, 0); fp(g, bxg(s + 0.02, 0.06, s + 0.02), IF.woodD, 0, h * 0.25, 0, 0, 0, 0, false); fp(g, bxg(s + 0.02, 0.06, s + 0.02), IF.woodD, 0, h * 0.75, 0, 0, 0, 0, false) }
    function iSelo(id, x, y, z, ry, name, pos, yaw) { // o ponto de retorno: a caixa de latão na parede, com a lâmpada âmbar
      const g = iGrp(x, y, z, ry)
      fp(g, bxg(0.28, 0.38, 0.1), IF.steelD, 0, 0, 0); fp(g, bxg(0.2, 0.06, 0.12), IF.yellow, 0, -0.14, 0, 0, 0, 0, false)
      const lamp = fp(g, new THREE.CylinderGeometry(0.06, 0.06, 0.1, 8), IF.amberOff.clone(), 0, 0.06, 0.07, Math.PI / 2, 0, 0, false); lamp.userData.noBake = true
      const gl = { p: V3(x, y, z).add(V3(Math.sin(ry) * 0.35, 0, Math.cos(ry) * 0.35)), r: 2.4, c: new THREE.Color('#ffb466').convertSRGBToLinear().multiplyScalar(0.9), k: 0, warm: true }
      INS.glows.push(gl)
      INS.cps[id] = { name, pos, yaw, lamp, glow: gl, lit: false, k: 0 }
    }

    function insFurnish() {
      // --- a eclusa: o elevador de carga 3 dentro do poço (as paredes do poço sobem pelo buraco no teto até o escuro), os armários, os bancos, o aviso
      { const X0 = 2.1, X1 = 6.8, Z0 = 4.4, Z1 = 9.6, TOP = 14, O0 = 4.9, O1 = 9.1, OH = 3.0, RH = 3.5 // o vão do poço, o alto dele; a boca (z), a altura da boca; o forro da eclusa
        const wallOut = (P4, N) => { const lo = (a, b) => iFace('barraV', ...P4(a, Math.min(b, 1.2)), N), hi = (a, b) => { if (b > 1.2) iFace('bloco', ...P4(Math.max(a, 1.2), b), N) }; return (a, b) => { if (a < 1.2) lo(a, b); hi(a, b) } }
        // as paredes do poço: por fora (o bloco da eclusa, até o forro) e por dentro (o concreto do poço, até lá em cima)
        for (const [z, g] of [[Z0 - 0.2, -1], [Z1 + 0.2, 1]]) {
          const zi = g < 0 ? Z0 : Z1
          wallOut((y0, y1) => [[X0, y0, z], [7.0, y0, z], [7.0, y1, z], [X0, y1, z]], [0, 0, g])(0, RH)
          iFace('poco', [X0, 0, zi], [X1, 0, zi], [X1, TOP, zi], [X0, TOP, zi], [0, 0, -g])
          iFace('bloco', [7.0, 0, Math.min(z, zi)], [7.0, 0, Math.max(z, zi)], [7.0, RH, Math.max(z, zi)], [7.0, RH, Math.min(z, zi)], [1, 0, 0])
          iCol((X0 + 7.0) / 2, (z + zi) / 2, (7.0 - X0) / 2, 0.1, 0, 0, TOP)
        }
        // a frente: a boca de 4,2 m com o marco listrado; por dentro, o concreto sobe da verga até o alto
        for (const [a, b] of [[Z0 - 0.2, O0], [O1, Z1 + 0.2]]) { wallOut((y0, y1) => [[7.0, y0, a], [7.0, y0, b], [7.0, y1, b], [7.0, y1, a]], [1, 0, 0])(0, RH); iCol(6.9, (a + b) / 2, 0.1, (b - a) / 2, 0, 0, TOP) }
        iFace('bloco', [7.0, OH, O0], [7.0, OH, O1], [7.0, RH, O1], [7.0, RH, O0], [1, 0, 0]); iCol(6.9, 7, 0.1, 2.1, 0, OH, TOP)
        for (const [a, b] of [[Z0, O0], [O1, Z1]]) iFace('poco', [X1, 0, a], [X1, 0, b], [X1, OH, b], [X1, OH, a], [-1, 0, 0])
        iFace('poco', [X1, OH, Z0], [X1, OH, Z1], [X1, TOP, Z1], [X1, TOP, Z0], [-1, 0, 0])
        iFace('metalE', [X1, 0, O0], [7.0, 0, O0], [7.0, OH, O0], [X1, OH, O0], [0, 0, 1]); iFace('metalE', [X1, 0, O1], [7.0, 0, O1], [7.0, OH, O1], [X1, OH, O1], [0, 0, -1]); iFace('metalE', [X1, OH, O0], [7.0, OH, O0], [7.0, OH, O1], [X1, OH, O1], [0, -1, 0])
        iBox('faixa', 7.0, 0, O0 - 0.18, 7.06, OH + 0.18, O0); iBox('faixa', 7.0, 0, O1, 7.06, OH + 0.18, O1 + 0.18); iBox('faixa', 7.0, OH, O0 - 0.18, 7.06, OH + 0.18, O1 + 0.18)
        iFace('faixa', [7.06, 0.006, O0], [7.6, 0.006, O0], [7.6, 0.006, O1], [7.06, 0.006, O1], [0, 1, 0]) // a faixa no chão, na boca
        iFace('poco', [X0, RH, Z0], [X0, RH, Z1], [X0, TOP, Z1], [X0, TOP, Z0], [1, 0, 0]) // o fundo do poço, acima do forro
        iFace('forroU', [X0, TOP, Z0], [X1, TOP, Z0], [X1, TOP, Z1], [X0, TOP, Z1], [0, -1, 0])
        iBox('faixa', X0, RH, Z0, X1, RH + 0.25, Z0 + 0.02); iBox('faixa', X0, RH, Z1 - 0.02, X1, RH + 0.25, Z1) // a cinta listrada onde o poço sai do forro
        // os trilhos-guia (um em cada lado), com as presilhas, até o escuro
        for (const z of [Z0 + 0.06, Z1 - 0.06]) { iBoxM(INS.g, IF.steel, 4.41, 0, z - 0.05, 4.49, TOP, z + 0.05); for (let y = 1; y < TOP; y += 2) iBoxM(INS.g, IF.steelD, 4.3, y, z - 0.06, 4.6, y + 0.12, z + 0.06, false) }
        // a luz lá em cima no poço (fraca: mostra a altura)
        for (const y of [5.6, 10.2]) { iBoxM(INS.g, IF.steelD, X0, y - 0.12, 6.85, X0 + 0.14, y + 0.12, 7.15, false); iBoxM(INS.g, IF.lampWarm, X0 + 0.14, y - 0.07, 6.92, X0 + 0.17, y + 0.07, 7.08, false); INS.glows.push({ p: V3(X0 + 0.8, y, 7), r: 4.4, c: new THREE.Color('#ffcf8a').convertSRGBToLinear().multiplyScalar(0.85), k: 1, warm: true }) }
        iCone(ILB.warm, 4.45, TOP - 0.2, 7, 1.7, 2.0, 0.35) // a luz que desce do alto do poço
        // a cabine: o estrado de chapa xadrez, a gaiola de tela com os montantes, a travessa em cima com os cabos subindo
        const c0 = X0 + 0.06, c1 = X1 - 0.06, d0 = Z0 + 0.12, d1 = Z1 - 0.12, H = 2.95
        iBoxM(INS.g, IF.steelD, c0, 0, d0, c1, 0.035, d1, false); iFace('faixa', [c1 - 0.22, 0.04, d0], [c1, 0.04, d0], [c1, 0.04, d1], [c1 - 0.22, 0.04, d1], [0, 1, 0])
        for (const [x, z] of [[c0, d0], [c1, d0], [c0, d1], [c1, d1], [4.45, d0], [4.45, d1], [c0, 7]]) iBoxM(INS.g, IF.steelD, x - 0.05, 0, z - 0.05, x + 0.05, H, z + 0.05)
        for (const z of [d0, d1]) { iBoxM(INS.g, IF.steelD, c0, H - 0.08, z - 0.05, c1, H, z + 0.05); iBoxM(INS.g, IF.metal, c0, 0.035, z - 0.02, c1, 0.9, z + 0.02); iBoxM(INS.g, IF.steel, c0, 1.0, z - (z < 7 ? -0.08 : 0.08) - 0.025, c1, 1.05, z - (z < 7 ? -0.08 : 0.08) + 0.025, false) } // a viga de cima, a chapa de chute, o corrimão
        iBoxM(INS.g, IF.steelD, c0 - 0.05, H - 0.08, d0, c0 + 0.05, H, d1); iBoxM(INS.g, IF.metal, c0 - 0.02, 0.035, d0, c0 + 0.02, 0.9, d1); iBoxM(INS.g, IF.steelD, c1 - 0.05, H - 0.08, d0, c1 + 0.05, H, d1)
        const tela = (w, h) => { const g = new THREE.PlaneGeometry(w, h), u = g.attributes.uv; for (let i = 0; i < u.count; i++) u.setXY(i, u.getX(i) * w / 0.4, u.getY(i) * h / 0.4); return g }
        for (const z of [d0, d1]) for (const [a, b] of [[c0, 4.45], [4.45, c1]]) fp(INS.g, tela(b - a - 0.1, H - 1.0), IF.tela, (a + b) / 2, 0.9 + (H - 1.0) / 2, z, 0, 0, 0, false)
        for (const [a, b] of [[d0, 7], [7, d1]]) fp(INS.g, tela(b - a - 0.1, H - 1.0), IF.tela, c0, 0.9 + (H - 1.0) / 2, (a + b) / 2, 0, Math.PI / 2, 0, false)
        iBoxM(INS.g, IF.yellow, 4.3, H, d0, 4.6, H + 0.22, d1); iBoxM(INS.g, IF.steelD, 4.2, H + 0.22, 6.6, 4.7, H + 0.4, 7.4) // a travessa e o engate dos cabos
        for (const [x, z] of [[4.36, 6.85], [4.54, 6.85], [4.36, 7.15], [4.54, 7.15]]) iPipe(x, H + 0.4, z, x, TOP, z, 0.018, IF.cable)
        // a sanfona da cabine, recolhida nos dois lados da frente, e a porta de enrolar do andar, erguida dentro da verga
        for (const [za, zb] of [[d0 + 0.1, d0 + 0.5], [d1 - 0.5, d1 - 0.1]]) { for (let i = 0; i < 7; i++) { const z = za + (zb - za) * i / 6; iBoxM(INS.g, IF.yellow, c1 - 0.04 - (i % 2) * 0.05, 0.05, z - 0.015, c1 - (i % 2) * 0.05, H - 0.1, z + 0.015, false) } for (let y = 0.3; y < H - 0.2; y += 0.55) iBoxM(INS.g, IF.yellow, c1 - 0.1, y, za, c1 - 0.02, y + 0.04, zb, false); iCol(c1 - 0.05, (za + zb) / 2, 0.06, (zb - za) / 2, 0, 0, H) }
        for (let y = OH - 0.5; y < OH - 0.05; y += 0.15) iBoxM(INS.g, IF.steel, 6.86, y, O0 + 0.02, 6.96, y + 0.11, O1 - 0.02, false)
        iBoxM(INS.g, IF.yellow, 6.84, OH - 0.6, O0 + 0.02, 6.98, OH - 0.52, O1 - 0.02, false)
        // a botoeira pendurada na travessa e o mostrador do andar em cima da boca
        iPipe(4.75, H + 0.3, 8.6, 5.9, 1.55, 8.9, 0.01, IF.cable)
        { const bt = iGrp(5.9, 1.38, 8.9, -Math.PI / 2); fp(bt, bxg(0.13, 0.34, 0.09), IF.yellow, 0, 0, 0); fp(bt, bxg(0.06, 0.05, 0.03), IF.green2, 0, 0.08, 0.05, 0, 0, 0, false); fp(bt, bxg(0.06, 0.05, 0.03), IF.amberOff, 0, 0.0, 0.05, 0, 0, 0, false); fp(bt, cyg(0.035, 0.035, 0.03, 8), IF.red2, 0, -0.1, 0.055, Math.PI / 2, 0, 0, false) }
        { const s2 = iGrp(7.08, 3.33, 7, Math.PI / 2); fp(s2, new THREE.PlaneGeometry(2.0, 0.3), IF.elev, 0, 0, 0, 0, 0, 0, false) }
        iLamp('placa', 4.45, 7.9, 'on', { y: H - 0.02, r: 3.8, m: 0.7 }) }
      for (let i = 0; i < 9; i++) iLocker(4.9 + i * 0.52, 2.38, 0)
      iCol(4.9 + 4 * 0.52, 2.38, 2.4, 0.26, 0, 0, 1.9)
      iBench(5.4, 3.5, 9.4, 3.85); iBench(8, 10.2, 11, 10.55)
      { const s = iGrp(11.88, 2.45, 3.2, -Math.PI / 2); fp(s, bxg(0.9, 0.45, 0.02), IF.sign, 0, 0, 0, 0, 0, 0, false) } // o aviso: subsolo 3, barreira ativa
      iCrate(10.6, 10.8, 0.8, 0.8, 0.2); iCrate(10.9, 9.9, 0.6, 0.6, -0.3)
      iLamp('tubo', 9, 4.3, 'on', { axis: 'z', r: 4 }); iLamp('tubo', 9, 9.7, 'off', { axis: 'z' })
      iSelo('eclusa', 10.6, 1.45, 2.12, 0, 'eclusa', V3(4.4, 0, 7), Math.PI / 2)
      // --- o corredor de acesso: os canos no alto, as caixas encostadas, as luminárias (duas apagadas, uma piscando)
      iPipe(12.2, 3.22, 4.66, 33.8, 3.22, 4.66, 0.09); iPipe(12.2, 3.24, 4.9, 33.8, 3.24, 4.9, 0.06, IF.pipeG); iPipe(12.2, 2.9, 9.43, 33.8, 2.9, 9.43, 0.05, IF.cable) // encostados na parede
      for (let x = 14; x < 34; x += 3) iBoxM(INS.g, IF.steelD, x - 0.03, 3.08, 4.5, x + 0.03, 3.5, 5.02, false) // as abraçadeiras saem da parede
      for (const [x, m] of [[14, 'on'], [18, 'flick'], [22, 'off'], [26, 'on'], [30, 'off']]) iLamp('tubo', x, 7, m)
      iCrate(15.2, 8.9, 0.9, 0.9, 0.1); iCrate(16.1, 8.95, 0.7, 0.7, -0.2); iCrate(15.3, 8.9, 0.6, 1.5, 0.1)
      iBeacon(12.5, 3.3, 7); iBeacon(33.5, 3.3, 7)
      // --- o escritório: a mesa do meio (a da lanterna da Lara), as mesas de trabalho com os monitores, os arquivos, papel pelo chão
      iTable(40, 6.3, 3, 1.6, IF.tableL)
      for (let i = 0; i < 8; i++) { const p = iGrp(38.8 + (i * 0.37) % 2.4, 0.77, 5.8 + (i * 0.53) % 1.1, i * 0.7); fp(p, bxg(0.21, 0.004, 0.3), IF.paper, 0, 0, 0, 0, 0, 0, false) }
      for (const [x, z, ry] of [[36.2, 1.6, 0], [43.8, 1.6, 0], [36.2, 12.4, Math.PI], [43.8, 12.4, Math.PI]]) { iTable(x, z, 2.2, 0.8, IF.beige); iCrt(x - 0.4, 0.76, z, ry, x > 40 && z < 7); iCrt(x + 0.5, 0.76, z, ry, false) }
      for (let i = 0; i < 4; i++) iSolid(IF.steel, 45.3, 0, 3.6 + i * 0.6, 45.9, 1.32, 4.15 + i * 0.6)
      { const g = iGrp(40, 1.7, 1.12, 0); fp(g, bxg(2.4, 1.1, 0.04), IF.white, 0, 0, 0); fp(g, bxg(2.5, 0.05, 0.08), IF.steel, 0, -0.58, 0.03, 0, 0, 0, false) } // o quadro branco
      for (let i = 0; i < 14; i++) { const p = iGrp(35 + (i * 2.31) % 10, 0.004, 3 + (i * 1.73) % 8.5, i * 1.1); fp(p, bxg(0.21, 0.004, 0.3), IF.paper, 0, 0, 0, 0, 0, 0, false) }
      { const c = iGrp(42.6, 0, 8.8, 1.9); fp(c, bxg(0.46, 0.06, 0.46), IF.dark, 0, 0.45, 0); fp(c, bxg(0.46, 0.5, 0.06), IF.dark, 0, 0.7, -0.2) } // a cadeira caída
      iLamp('placa', 37, 4, 'off'); iLamp('placa', 43, 4, 'flick', { r: 4.2, m: 0.75 }); iLamp('placa', 37, 10, 'off'); iLamp('placa', 43, 10, 'off')
      // --- o corredor: luz e canos
      iPipe(42.36, 3.2, 13.2, 42.36, 3.2, 21.8, 0.08); iLamp('tubo', 40, 15.5, 'on', { axis: 'z' }); iLamp('tubo', 40, 19.8, 'on', { axis: 'z' })
      // --- o refeitório: as nove mesas com bancos, o balcão com a vitrine, as bandejas, o relógio parado
      for (const z of [25.5, 30, 34.5]) for (const x of [28, 35, 42]) { iTable(x + 2.1, z + 0.65, 4.2, 1.3, IF.table); iBench(x + 0.1, z - 0.75, x + 4.1, z - 0.4); iBench(x + 0.1, z + 1.7, x + 4.1, z + 2.05) }
      iSolid(IF.tableL, 47.3, 0, 23.4, 48.6, 1.0, 30); iBoxM(INS.g, IF.steel, 47.2, 1.0, 23.4, 48.7, 1.04, 30, false); iBoxM(INS.g, IF.glass, 47.35, 1.04, 23.6, 47.4, 1.5, 29.8, false)
      for (let i = 0; i < 6; i++) iBoxM(INS.g, IF.tray, 47.6, 1.04 + i * 0.03, 24.2 - 0.22, 48.3, 1.06 + i * 0.03, 24.2 + 0.22, false)
      { const g = iGrp(49.88, 3.1, 26.7, -Math.PI / 2); fp(g, bxg(3.2, 1.2, 0.04), IF.woodD, 0, 0, 0); for (let i = 0; i < 5; i++) fp(g, bxg(2.4 - (i % 2) * 0.6, 0.06, 0.05), IF.paper, -0.2, 0.4 - i * 0.2, 0.01, 0, 0, 0, false) } // o cardápio
      { const g = iGrp(38, 3.4, 39.88, Math.PI); fp(g, cyg(0.24, 0.24, 0.05, 14), IF.white, 0, 0, 0, Math.PI / 2, 0, 0, false); fp(g, bxg(0.02, 0.16, 0.02), IF.dark, 0, 0.06, -0.03, 0, 0, 0.5, false); fp(g, bxg(0.02, 0.11, 0.02), IF.dark, 0.04, -0.02, -0.03, 0, 0, -2.2, false) }
      for (const x of [30, 38, 46]) for (const z of [24.5, 29, 33.5, 38]) iLamp('tubo', x, z, x === 46 && z === 33.5 ? 'off' : x === 30 && z === 38 ? 'flick' : x === 38 && z === 29 ? 'off' : 'on', { r: 5.5, m: 0.8 })
      iSelo('refeitorio', 41.9, 1.45, 22.12, 0, 'refeitório', V3(40, 0, 23.5), 0)
      // --- o corredor de serviço: os canos baixos na parede leste, a válvula, a luz de emergência na porta da usina
      iPipe(34.82, 0.35, 40.2, 34.82, 0.35, 51.8, 0.14, IF.pipeG); iPipe(34.86, 0.8, 40.2, 34.86, 0.8, 51.8, 0.1); iCol(34.78, 46, 0.24, 5.8, 0, 0, 1.0) // rentes à parede
      { const g = iGrp(34.68, 1.12, 45.2, Math.PI / 2); fp(g, new THREE.TorusGeometry(0.2, 0.03, 4, 12), IF.red, 0, 0, 0, 0, 0, 0, false); fp(g, cyg(0.03, 0.03, 0.4, 6), IF.steel, 0, -0.2, -0.1, Math.PI / 2, 0, 0, false) }
      iLamp('tubo', 32.5, 43, 'on', { axis: 'z' }); iLamp('tubo', 32.5, 48.5, 'off', { axis: 'z' }); iBeacon(32.5, 3.3, 51.4)
      // --- a enfermaria: as duas macas, o armário de remédio, a pia, a cortina
      for (const x of [24.2, 27.4]) { iSolid(IF.white, x - 0.45, 0, 44.3, x + 0.45, 0.62, 46.2); iBoxM(INS.g, IF.sheetW, x - 0.42, 0.62, 44.35, x + 0.42, 0.68, 46.15, false); iBoxM(INS.g, IF.sheetW, x - 0.3, 0.68, 44.45, x + 0.3, 0.76, 44.8, false) }
      iSolid(IF.white, 22.12, 0.9, 46.2, 22.5, 2.1, 47.6); iBoxM(INS.g, IF.glass, 22.5, 1.0, 46.3, 22.52, 2.0, 47.5, false)
      iSolid(IF.white, 22.12, 0.75, 48.3, 22.65, 0.9, 49.1); iBoxM(INS.g, IF.white, 22.12, 0, 48.55, 22.4, 0.75, 48.85); iBoxM(INS.g, IF.steel, 22.14, 0.9, 48.66, 22.22, 1.12, 48.74, false); iBoxM(INS.g, IF.steel, 22.14, 1.08, 48.66, 22.36, 1.12, 48.74, false) // a pia: o pé e a torneira
      iPipe(22.4, 2.6, 46.6, 29.8, 2.6, 46.6, 0.015, IF.steel); { const g = iGrp(25.8, 1.5, 46.6); fp(g, bxg(2.2, 2.1, 0.02), IF.cloth, 0, 0, 0, 0, 0, 0, false) }
      iLamp('placa', 26, 47.2, 'on', { r: 4, m: 0.75 })
      iSelo('enfermaria', 22.12, 1.45, 45.4, Math.PI / 2, 'enfermaria', V3(26.2, 0, 48.3), -Math.PI / 2)
      // --- a usina: os quatro geradores, o núcleo da barreira, as colunas e as vigas, a passarela, as campanas
      for (const [gx, gz] of [[15, 57], [41, 57], [15, 72], [41, 72]]) {
        iSolid(IF.green, gx, 0, gz, gx + 6, 3.4, gz + 5); iBoxM(INS.g, IF.greenD, gx + 0.6, 3.4, gz + 0.6, gx + 5.4, 4.2, gz + 4.4)
        for (let i = 0; i < 6; i++) iBoxM(INS.g, IF.dark, gx + 0.6 + i * 0.85, 1.0, gz - 0.02, gx + 1.1 + i * 0.85, 2.6, gz + 0.02, false) // as grelhas
        for (let i = 0; i < 6; i++) iBoxM(INS.g, IF.dark, gx + 0.6 + i * 0.85, 1.0, gz + 4.98, gx + 1.1 + i * 0.85, 2.6, gz + 5.02, false)
        iPipe(gx + 1.2, 4.2, gz + 2.5, gx + 1.2, 11.9, gz + 2.5, 0.45, IF.steelD)
        const pc = gz < 65 ? gz + 5.06 : gz - 0.06; iBoxM(INS.g, IF.steelD, gx + 3.6, 1.2, pc - 0.04, gx + 5.2, 2.2, pc + 0.04, false)
        for (let i = 0; i < 3; i++) iBoxM(INS.g, i === 0 ? IF.orange : i === 1 ? IF.green2 : IF.amberOff, gx + 3.8 + i * 0.5, 1.9, pc - 0.06, gx + 4.0 + i * 0.5, 2.0, pc + 0.06, false)
        INS.glows.push({ p: V3(gx + 4.4, 2.1, gz < 65 ? gz + 5.6 : gz - 0.6), r: 2.6, c: new THREE.Color('#ff9a3a').convertSRGBToLinear().multiplyScalar(0.6), k: 1, warm: true })
        // os cabos até o núcleo, deitados no chão
        const ex = gx < 30 ? gx + 6 : gx, ez = gz + 2.5; iPipe(ex, 0.12, ez, 31 + (gx < 30 ? -2.2 : 2.2), 0.12, 80 - (gz < 65 ? 2.2 : -0.6), 0.12, IF.cable)
      }
      { // o núcleo: a base, o vidro, a coluna acesa, os anéis girando e os cabos para o teto
        const g = iGrp(31, 0, 80)
        fp(g, cyg(3.0, 3.2, 0.8, 16), IF.steelD, 0, 0.4, 0); fp(g, cyg(2.7, 2.7, 0.2, 16), IF.yellow, 0, 0.9, 0)
        fp(g, cyg(2.4, 2.6, 0.6, 16), IF.steelD, 0, 7.9, 0); for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; fp(g, cyg(0.08, 0.08, 7.0, 6), IF.steel, Math.sin(a) * 2.35, 4.5, Math.cos(a) * 2.35) }
        const glass = new THREE.Mesh(new THREE.CylinderGeometry(2.3, 2.3, 7.0, 20, 1, true), new THREE.MeshBasicMaterial({ color: new THREE.Color('#5fd8ff').convertSRGBToLinear(), transparent: true, opacity: 0.08, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); glass.position.y = 4.5; glass.renderOrder = 3; g.add(glass)
        const coreM = IF.cyan.clone(), core = fp(g, cyg(0.45, 0.45, 7.0, 10), coreM, 0, 4.5, 0, 0, 0, 0, false); core.userData.noBake = true
        INS.rings = [2.2, 4.4, 6.6].map((y, i) => { const r = fp(g, new THREE.TorusGeometry(1.4 - i * 0.2, 0.05, 4, 24), IF.cyan, 0, y, 0, Math.PI / 2, 0, 0, false); r.userData.noBake = true; return r })
        for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI * 2 + 0.4; iPipe(31 + Math.sin(a) * 1.6, 8.2, 80 + Math.cos(a) * 1.6, 31 + Math.sin(a) * 2.2, 11.95, 80 + Math.cos(a) * 2.2, 0.12, IF.cable) }
        iCol(31, 80, 3.0, 3.0, 0, 0, 8.3); iCol(31, 80, 2.2, 2.2, Math.PI / 4, 0, 8.3)
        INS.core = { m: coreM, gl: { p: V3(31, 3.5, 80), r: 13, c: new THREE.Color('#7fe3ff').convertSRGBToLinear().multiplyScalar(1.3), k: 1, core: true } }; INS.glows.push(INS.core.gl)
      }
      for (const z of [56, 64, 72, 80]) for (const x of [10.32, 51.68]) { iSolid(IF.steelD, x - 0.2, 0, z - 0.2, x + 0.2, 12, z + 0.2) }
      for (const x of [18, 26, 36, 44]) iSolid(IF.steelD, x - 0.2, 0, 83.48, x + 0.2, 12, 83.88)
      for (const z of [56, 64, 72, 80]) iBoxM(INS.g, IF.steelD, 10.1, 11.4, z - 0.15, 51.9, 11.9, z + 0.15)
      { // a passarela no alto da parede norte (cenário: não se chega lá)
        iBoxM(INS.g, IF.metal, 10.1, 6.0, 52.1, 51.9, 6.1, 53.7); for (let x = 11; x < 52; x += 1.5) iBoxM(INS.g, IF.steel, x - 0.025, 6.1, 53.62, x + 0.025, 7.1, 53.67, false)
        iBoxM(INS.g, IF.yellow, 10.1, 7.08, 53.6, 51.9, 7.14, 53.7, false); for (let x = 12; x < 52; x += 4) iBoxM(INS.g, IF.steelD, x - 0.05, 5.4, 52.1, x + 0.05, 6.0, 53.2, false)
      }
      { const s = iGrp(32.5, 4.4, 52.12, 0); fp(s, bxg(2.6, 0.8, 0.03), IF.sign, 0, 0, 0, 0, 0, 0, false) }
      for (const x of [17, 31, 45]) for (const z of [58, 68, 78]) if (!(x === 31 && z === 78)) iLamp('campana', x, z, x === 45 && z === 68 ? 'off' : x === 17 && z === 78 ? 'flick' : 'on', { y: 9 })
      iBeacon(10.3, 4, 60); iBeacon(51.7, 4, 74)
      iCrate(48.5, 54.2, 1.1, 1.1, 0.2); iCrate(49.7, 54.4, 0.9, 0.9, -0.3); iCrate(12.6, 82.2, 1.2, 1.0, 0.1); iCrate(13.9, 82.6, 0.8, 0.8, 0.5)
      // as manchas e os cones de todas as luminárias acesas: duas malhas cada (fria e quente)
      iLightMesh(ILB.cool, INS.g); iLightMesh(ILB.warm, INS.g)
    }

    // ---------- montar, entrar, sair ----------
    function insBuildA() { INS.g = new THREE.Group(); INS.g.name = 'intro'; INS.cols.length = 0; INS.glows.length = 0; INS.flick.length = 0; INS.beacons.length = 0; INS.doors.length = 0; INS.cps = {}; insWalls(); insFloors() }
    function insBuildB() { insDoors(); iShBuild() }
    function insBuildC() {
      insFurnish(); INS.ectos.length = 0; for (const id of IENC.doors) insEctoMake(id); insEctoMake('usina'); insKitsMake()
      INS.mates = ['lara', 'nicolas'].map((k) => ({ rig: mateMake(k), kind: k, s: 0, spd: 0, ph: 0, k: 0, waitT: 0, mode: 'follow', yaw: Math.PI / 2, lat: 0, aim: 0 }))
      INS.g.traverse((o) => { if (o.isMesh && o.material && o.material.alphaTest > 0 && o.material.map) { o.material.map.generateMipmaps = false; o.material.map.minFilter = THREE.NearestFilter } })
      litMark(INS.g, (o) => (o.userData.env ? 'env' : 'prop'))
      for (const [m, k] of [[IM.bloco, 0.04], [IM.barraV, 0.03], [IM.concreto, 0.03], [IM.usinaP, 0.04], [IM.chapa, 0.04], [IM.xadrez, 0.05], [IM.azb, 0.02], [IM.granilite, 0.02]]) addBump(m, k)
      INS.built = true
    }
    const FOG_I = new THREE.Color('#080a0b'), HEMI_I = { sky: new THREE.Color('#2c3638'), ground: new THREE.Color('#14110e') }
    function insArenaOut() { // a arena sai; as luzes com sombra viram a luz do cômodo
      arenaGroup(); if (AR_G.parent) G.remove(AR_G)
      if (LUTA.on || LUTA.ctx === CTX) LUTA.end(); maeGroup.visible = false; LUTA.FX.visible = false
      clearShots(); bandoClear(); BD.state = 'fight'; BD.token = null; BD.nSph = 0; rainClear(); TOR.k = TOR.want = 0; if (typeof cutReset === 'function') cutReset()
      B.dry = 1; D.zone = 'intro'
      if (!LSV.crib) { LSV.crib = lsave(cribSpot); LSV.win = lsave(winSpots[0]) }
      const s1 = cribSpot; s1.color.set('#cfe2d8'); s1.distance = 16; s1.angle = 1.05; s1.penumbra = 0.7; s1.decay = 1.2; s1.shadow.camera.near = 0.5; s1.shadow.camera.far = 16; s1.shadow.camera.updateProjectionMatrix()
      winSpots[0].intensity = 0; winSpots[0].visible = false
      INS.spotRoom = ''; INS.spotK = 0; LIT.crib.k = 0
      scene.fog.color.copy(FOG_I); scene.fog.density = 0.034; scene.background.copy(FOG_I)
      SFX.setGhost('casa'); ghostShadows(false)
      el.name.textContent = 'INTRO'; el.slots[2].style.opacity = 0.3
    }
    function insReset() { // a instalação do começo: portas, pontos de retorno; você no elevador
      for (const D2 of INS.doors) { if (!D2.st0) D2.st0 = D2.st; D2.st = D2.st0; D2.k = D2.want = D2.st === 'open' ? 1 : 0; D2.shake = 0; D2.rate = 0; if (D2.col && D2.col.door) D2.col.off = D2.st === 'open'; insDoorPose(D2, 0) }
      for (const id in INS.cps) { const c = INS.cps[id]; c.lit = false; c.k = 0 }
      INS.cp = 'eclusa'; INS.cps.eclusa.lit = true; INS.cps.eclusa.k = 1
      insEncReset(true); insCineEnd(true); insBossReset(true); ectoEl.style.opacity = 0; matesReset(); INS.mateSayI = 0; INS.chased = false; insTutClear(); INS.officeDone = false; subsClear(); showWeapon(); fadeEl.style.opacity = 0; insHintsReset(); insKitsReset()
      INS.room = ''; INS.roomT = 0; INS.objT = 0; INS.fogK = 0.034
      BD.token = null; BD.atkCd = 1.2; BD.nSph = 0; BD.killed = 0
      casaPlayer(INS.cps.eclusa.pos, INS.cps.eclusa.yaw)
      P.kits = T.kit.inicio; P.stats = { t: 0, shots: 0, hits: 0, crits: 0, dmg: 0, hitsTaken: 0, dmgTaken: 0, dodges: 0, deaths: 0, kits: 0 }
      D.t = 0; D.endShown = false; D.endT = 0; hurtFx = 0; healFx = 0; H.msgT = 0; H.banT = 0; el.toast.textContent = ''
    }
    function insIn() { if (INS.g.parent !== G) G.add(INS.g); insReset(); bakeStart() }
    function insPrecompile() { const hid = []; INS.g.traverse((o) => { if (!o.visible) { hid.push(o); o.visible = true } }); try { renderer.compile(scene, camera) } catch (e) { console.warn(e) } hid.forEach((o) => (o.visible = false)) }
    function insBegin() { D.mode = 'start'; if (D.playing) began(); else hudTela() }
    const ITIPS = ['As portas de correr abrem com E: chegue perto e olhe para elas.', 'A caixa de latão com a lâmpada âmbar é ponto de retorno: se cair, você volta para a última acesa.', 'A barreira prende os fantasmas lá dentro. Ela deixa passar quem é vivo.', 'A pistola esquenta e a escopeta trava se você abusar: troque de arma pela roda (segure a rodinha).']
    function introStart() {
      D.kind = 'intro'; D.run = 'intro'; D.runT = 0; D.runKits = null; D.best = null; INS.begun = false
      loadStart({ ey: 'C.R.O.S. · carregando', title: 'INTRO', sub: 'a instalação da C.R.O.S. · subsolo 3', tip: ITIPS[(Math.random() * ITIPS.length) | 0], min: 2.0,
        steps: [() => {}, () => {}, insArenaOut, () => { if (!INS.built) insBuildA() }, () => { if (!INS.built) insBuildB() }, () => { if (!INS.built) insBuildC() }, insIn, insPrecompile],
        done: insBegin })
    }
    function insExit() { // saindo da Intro: a instalação sai de cena (a arena e as luzes voltam no casaExit)
      insEncReset(true); insCineEnd(true); insTutClear(); insBossReset(true); ectoEl.style.opacity = 0; fadeEl.style.opacity = 0; pudEls.forEach((d2) => (d2.style.opacity = 0)); insHint('')
      if (INS.g && INS.g.parent) G.remove(INS.g)
      if (D.zone === 'intro') D.zone = 'room'
    }
    function insRespawn() {
      const c = INS.cps[INS.cp]
      insEncReset(false); insCineEnd(true); insBossReset(false)
      casaPlayer(c.pos, c.yaw)
      P.kits = 5; P.kitGen = 0 // é uma demo: cada volta começa com 5 kits
      D.mode = 'fight'; D.endShown = false; D.endT = 0; hurtFx = 0; H.last = ''
      INS.room = ''; say('De volta ao ponto de retorno: ' + c.name, 3)
      if (D.bot) D.bot.wp = undefined
      hudTela()
    }
    function insCpLight(id) { const c = INS.cps[id]; if (!c) return; INS.cp = id; if (!c.lit) { c.lit = true; SFX.fps('lantern'); say(`Ponto de retorno: ${c.name}`, 3) } }

    // ---------- portas: E abre; a lacrada só treme e avisa ----------
    function insDoorNear() {
      let best = null, bd = 1.9
      const fx = Math.sin(C.yaw), fz = Math.cos(C.yaw)
      for (const D2 of INS.doors) {
        if (D2.st === 'open' || D2.kind === 'barrier') continue
        const dx = D2.cx - P.pos.x, dz = D2.cz - P.pos.z, d = Math.hypot(dx, dz)
        if (d > bd || (d > 0.5 && (dx * fx + dz * fz) / d < 0.35)) continue
        best = D2; bd = d
      }
      return best
    }
    function insUse() {
      const E2 = P.dead < 0 && D.mode === 'fight' && !INS.cine ? insEctoNear() : null
      if (E2) {
        const txt2 = E2.id === 'grade' ? 'E · abrir a grade' : 'E · abrir a porta'; if (promptEl.textContent !== txt2) promptEl.textContent = txt2
        if (press('KeyE')) say(E2.id === 'usina' ? 'Matheus: Não saio daqui sem os dois.' : E2.st === 'soft' ? 'Matheus: Preciso tirar esse ectoplasma primeiro.' : INS.enc.st === 'awake' ? 'Matheus: Endurecido. Não cede enquanto houver Espectral por aqui.' : 'Matheus: Esse não cede. O caminho é pela grade.', 3)
        return
      }
      const D2 = P.dead < 0 && D.mode === 'fight' ? insDoorNear() : null
      INS.near = D2
      const txt = !D2 ? '' : D2.st === 'closed' ? 'E · abrir ' + (D2.name || 'a porta') : 'E · tentar abrir'
      if (promptEl.textContent !== txt) promptEl.textContent = txt
      if (!press('KeyE') || !D2) return
      if (D2.id === 'escrit' && !INS.officeDone) { insOfficeStart(); return }
      if (D2.st === 'closed') { insOpen(D2) }
      else { D2.shake = 1; SFX.fps('rattle'); say(D2.msg || 'Trancada', 3) }
    }
    function insOpen(D2) { if (!D2 || D2.st === 'open') return; D2.st = 'open'; D2.want = 1; D2.rate = 0; D2.col.off = true; SFX.fps(D2.kind === 'grade' ? 'gradeUp' : 'slide') }
    function insClose(D2, rate) { if (!D2 || D2.st === 'closed') return; D2.st = 'closed'; D2.want = 0; D2.rate = rate || 0; D2.col.off = false } // a grade despenca (rate alto)

    // ---------- o chão, as paredes, a câmera e a mira ----------
    function insCollide(p, r) {
      const y0 = p.y + 0.25, y1 = p.y + 1.75
      for (let it = 0; it < 2; it++) for (const c of INS.cols) {
        if (c.off || c.ray || c.y1 <= y0 || c.y0 >= y1) continue
        const ext = c.hx + c.hz + r; if (Math.abs(p.x - c.x) > ext || Math.abs(p.z - c.z) > ext) continue
        pushOBB(p, c, r)
      }
    }
    function insCamK(a, b) {
      _qv.copy(b).sub(a); const len = _qv.length() || 1e-6; _qv.multiplyScalar(1 / len)
      let k = 1
      for (const c of INS.cols) { if (c.off) continue; const ext = c.hx + c.hz + len + 0.3; if (Math.abs(c.x - a.x) > ext || Math.abs(c.z - a.z) > ext) continue; const q = rayBox(a, _qv, c, 0.2); if (q >= 0 && q < len) k = Math.min(k, q / len) }
      return k
    }
    function insCamY(p) { const r = insRoom(p.x, p.z) || insRoom(P.pos.x, P.pos.z), ce = r ? r.h : 3.5, inLift = p.x > 2.1 && p.x < 6.8 && p.z > 4.4 && p.z < 9.6; return cl(p.y, 0.25, (inLift ? 3.1 : ce) - 0.22) } // na cabine, abaixo da travessa
    function insSurf(x, z) { const r = insRoom(x, z); return r && r.id === 'usina' ? 'metal' : 'pedra' }
    function castRayIns(o, d, maxT, out) {
      let t = maxT, kind = 'none'
      if (d.y < -1e-6) { const tf = -o.y / d.y; if (tf >= 0 && tf < t) { t = tf; kind = 'wall' } }
      if (d.y > 1e-6) { const r = insRoom(o.x, o.z), shaft = o.x > 2.1 && o.x < 6.8 && o.z > 4.4 && o.z < 9.6, tc = ((shaft ? 14 : r ? r.h : 3.5) - o.y) / d.y; if (tc >= 0 && tc < t) { t = tc; kind = 'wall' } }
      const ex = o.x + d.x * Math.min(t, 60), ez = o.z + d.z * Math.min(t, 60), x0 = Math.min(o.x, ex), x1 = Math.max(o.x, ex), z0 = Math.min(o.z, ez), z1 = Math.max(o.z, ez)
      out.ref = null
      for (const c of INS.cols) { if (c.off) continue; const e2 = c.hx + c.hz; if (c.x + e2 < x0 || c.x - e2 > x1 || c.z + e2 < z0 || c.z - e2 > z1) continue; const q = rayBox(o, d, c); if (q >= 0 && q < t) { t = q; kind = c.ecto ? 'ecto' : 'wall'; out.ref = c.ecto || null } }
      for (let i = 0; i < BD.nSph; i++) { const s = BD.sph[i], q = raySphere(o, d, s.c, s.r); if (q >= 0 && q < t) { t = q; kind = s.part; out.ref = s.e } }
      out.t = t; out.kind = kind; out.p.copy(o).addScaledVector(d, t)
      return out
    }

    // ---------- por quadro, na Intro ----------
    const IOBJ = { eclusa: 'Atravesse a barreira e siga pelo corredor', corr1: 'A porta do escritório, no fim do corredor', escritorio: 'A porta ao sul leva ao refeitório', corr2: 'O refeitório, no fim do corredor',
      refeitorio: 'A grade ao sul: o corredor de serviço', corr3: 'A usina, no fim do corredor', enfermaria: 'A usina, no fim do corredor de serviço', usina: 'O núcleo da barreira, ao fundo da usina' }
    function insTick(t, dt) {
      const r = insRoom(P.pos.x, P.pos.z), id = r ? r.id : ''
      if (id && id !== INS.room) {
        INS.room = id
        if (D.mode === 'fight' && D.t > 3.3) { roomEl.querySelector('b').textContent = r.name; roomEl.querySelector('span').textContent = r.sub; INS.roomT = 2.8 } // no começo, quem aparece é o título
        if (INS.cps[id]) insCpLight(id)
      }
      const ex = INS.ectos.find((q) => q.id === IENC.exit), obj = INS.boss.st === 'down' ? 'Jogue a armadilha no Glutão desfeito' : INS.boss.st === 'fight' || INS.boss.st === 'rise' ? 'Atire no núcleo do Glutão' : INS.tut.st === 'wait' ? 'Capture o Espectral desfeito' : INS.enc.st === 'awake' ? 'Derrote os Espectrais' : ex && ex.st === 'soft' ? 'Atire no ectoplasma da grade' : IOBJ[INS.room] || IOBJ.eclusa
      if (objEl.dataset.t !== obj) { objEl.dataset.t = obj; objEl.innerHTML = `<i>objetivo</i>${obj}` }
      const bossOn = INS.boss.st === 'fight' || INS.boss.st === 'down' || INS.boss.st === 'rise'
      SFX.music(bossOn ? 'bando' : INS.boss.st === 'caught' || INS.boss.st === 'end' ? 'amb' : INS.enc.st === 'awake' || INS.room === 'usina' || INS.room === 'corr3' ? 'tensao' : 'amb')
    }
    const iFlick = (t, ph) => { const s = Math.sin(t * 1.7 + ph) * Math.sin(t * 0.63 + ph * 2.3); return s > 0.45 ? (Math.sin(t * 47 + ph) > 0.2 ? 0.08 : 0.9) : 0.94 + 0.06 * Math.sin(t * 31 + ph) }
    function insFx(t, dt) {
      if (!INS.built || !INS.g.parent) return
      for (const D2 of INS.doors) { if (!D2.leaves.length && !D2.shake) continue; D2.k = damp(D2.k, D2.want, D2.rate || (D2.kind === 'grade' ? 1.6 : 3.2), dt); D2.shake = Math.max(0, D2.shake - dt * 2.2); insDoorPose(D2, t) }
      INS.beamT.value = t
      if (INS.memb) { IT.hex.offset.y = (t * 0.08) % 1; IT.hex.offset.x = Math.sin(t * 0.3) * 0.05; memMat.opacity = 0.45 + 0.12 * Math.sin(t * 2.3) * Math.sin(t * 0.9) }
      for (const f of INS.flick) { const k = iFlick(t, f.ph); f.gl.k = k; f.diff.color.copy(f.base).multiplyScalar(0.22 + 0.78 * k); f.beam.uniforms.uCol.value.copy(f.bcol).multiplyScalar(k); f.pool.opacity = f.op * k }
      for (const b of INS.beacons) { b.rot.rotation.y = t * 3.2 + b.ph; b.gl.k = 0.55 + 0.45 * Math.max(0, Math.sin(t * 3.2 + b.ph)) }
      if (INS.core) { const p = 0.85 + 0.15 * Math.sin(t * 1.9) * Math.sin(t * 0.77); INS.core.gl.k = p; INS.core.m.color.setRGB(0.55, 0.92, 1).multiplyScalar(0.8 + 0.3 * p); INS.rings.forEach((r, i) => { r.rotation.z = t * (0.6 + i * 0.25) * (i % 2 ? -1 : 1); r.position.y = 2.2 + i * 2.2 + Math.sin(t * 0.8 + i) * 0.25 }) }
      for (const id in INS.cps) { const c = INS.cps[id]; c.k = damp(c.k, c.lit ? 1 : 0, 2.5, dt); c.glow.k = c.k * (0.88 + 0.12 * Math.sin(t * 5 + id.length)); c.lamp.material.color.setRGB(0.24 + 0.76 * c.k, 0.16 + 0.55 * c.k, 0.06 + 0.25 * c.k) }
    }
    function insUpdate(t, dt) {
      const sim = (D.playing && D.mode === 'fight') || D.mode === 'dead'
      if (D.bot && sim) botIns(dt)
      if (sim) {
        if (D.mode === 'fight') { D.t += dt; D.runT += dt }
        if (insCineTick(dt, t)) { IN.dx = IN.dy = 0; IN.fire = IN.aim = false; if (!(INS.cine && INS.cine.drive)) { P.mv.set(0, 0, 0); P.vel.set(0, 0, 0); P.speed = 0 } } // na cena: parado (ou andando pelo roteiro)
        else { insUse(); controlTick(dt) }
        insTick(t, dt); insEncTick(t, dt); insTutTick(t, dt); insBossTick(t, dt); insKitsTick(); insHintsTick(dt)
      } else { IN.dx = IN.dy = 0; P.mv.set(0, 0, 0); if (promptEl.textContent) promptEl.textContent = '' }
      matesTick(t, sim ? dt : 0)
      camTick(dt)
      animAgent(t, dt)
      if (sim) { gunTick(t, dt); boltsTick(dt); trapTick(dt) }
      arcTick()
      insFx(t, dt); insEctoTick(t, dt)
      if (D.mode === 'dead') { D.endT += dt; if (!D.endShown && D.endT > 1.6) { D.endShown = true; hudTela() } }
      if (D.mode === 'won') { D.endT += dt; fadeEl.style.opacity = 1; if (!D.endShown && D.endT > 0.5) { D.endShown = true; hudTela() } } // o relatório, no escuro
      hudTick(dt)
      SFX.demoWind(0)
      bakeTick(dt)
    }

    // ---------- a luz da Intro: a luz do cômodo (com sombra), a lanterna, e as luzes de brilho mais perto ----------
    const ISPOT = { eclusa: [7, 3.4, 7, 1.5], corr1: [23, 3.4, 7, 1.1], escritorio: [40, 3.1, 7, 0.55], corr2: [40, 3.4, 17.5, 1.1], refeitorio: [38, 4.4, 31, 1.6], corr3: [32.5, 3.4, 45, 1.0], enfermaria: [26, 3.1, 47, 1.4], usina: [31, 11.6, 67, 2.6] }
    function insSpotAim(id) {
      const s = ISPOT[id]; if (!s) return
      const sp = cribSpot, big = id === 'usina'
      sp.position.set(s[0], s[1], s[2]); sp.target.position.set(s[0], 0, s[2] + 0.01); sp.angle = big ? 1.15 : 1.05; sp.distance = big ? 30 : 14; sp.decay = big ? 0.9 : 1.2
      sp.color.set(big ? '#ffd8a0' : '#cfe2d8'); sp.shadow.camera.far = big ? 26 : 12; sp.shadow.camera.updateProjectionMatrix()
    }
    const _igl = []
    function insLitFeed(full) {
      LITU.uLitK.value = 1; LITU.uLitSmooth.value = 1; LITU.uLitFull.value = full ? 1 : 0
      if (BUMPS.on !== full) { BUMPS.on = full; for (const B3 of BUMPS) { const m = B3[0]; if (!B3[2]) B3[2] = m.bumpMap; m.bumpMap = full ? B3[2] : null; m.needsUpdate = true } }
      camera.updateMatrixWorld(); const VM = camera.matrixWorldInverse
      LITU.uLitUp.value.set(0, 1, 0).transformDirection(VM)
      LITU.uRimD1.value.set(0.2, 1, 0.3).normalize().transformDirection(VM); LITU.uRimC1.value.copy(LIT.rimCold).multiplyScalar(0.7)
      _igl.length = 0
      const cx = camera.position.x, cy = camera.position.y, cz = camera.position.z
      for (const g of INS.glows) { if (g.k <= 0.01) continue; const d = Math.hypot(g.p.x - cx, (g.p.y - cy) * 1.4, g.p.z - cz); if (d > g.r + 10) continue; g.d = d - (g.core ? 8 : g.mem ? 3 : 0); _igl.push(g) }
      _igl.sort((a, b) => a.d - b.d)
      const lim = full ? LIT_MAX : 4; let n = 0, warm = null
      for (const g of _igl) { if (n >= lim) break; _lv.copy(g.p).applyMatrix4(VM); LITU.uGlowP.value[n].set(_lv.x, _lv.y, _lv.z, g.r); LITU.uGlowC.value[n].set(g.c.r * g.k, g.c.g * g.k, g.c.b * g.k); n++; if (!warm && (g.warm || g.core || g.beacon)) warm = g }
      LITU.uGlowN.value = n
      if (warm) { LITU.uRimP2.value.copy(warm.p).applyMatrix4(VM); LITU.uRimR2.value = warm.r * 1.3; LITU.uRimC2.value.copy(warm.c).multiplyScalar(0.7 * warm.k) } else LITU.uRimC2.value.setRGB(0, 0, 0)
    }
    function insLight() {
      lamp.visible = false; torchTick()
      if (INS.cine && INS.cine.kind === 'office' && INS.cine.lamp) insOfficeLamp(INS.cine) // na cena, a luz com sombra é a lanterna da Lara
      const full = ui.luz !== 'leve'
      hemi.intensity = 0.5; hemi.color.copy(HEMI_I.sky); hemi.groundColor.copy(HEMI_I.ground); moon.intensity = 0; moon.visible = false
      INS.fogK += ((INS.room === 'usina' ? 0.02 : 0.034) - INS.fogK) * 0.03
      scene.fog.color.copy(FOG_I); scene.fog.density = INS.fogK; scene.background.copy(FOG_I)
      fill.position.copy(camera.position); fill.position.y += 2.2; fill.intensity = 0.42
      const want = ISPOT[INS.room] ? INS.room : INS.spotRoom || 'eclusa'
      if (want !== INS.spotRoom) { INS.spotK = Math.max(0, INS.spotK - 0.07); if (INS.spotK <= 0) { INS.spotRoom = want; insSpotAim(want) } } else INS.spotK = Math.min(1, INS.spotK + 0.05)
      cribSpot.intensity = (ISPOT[INS.spotRoom] ? ISPOT[INS.spotRoom][3] : 1) * sm(INS.spotK)
      winSpots[0].visible = false; winSpots[0].intensity = 0
      shF = (shF + 1) % 2; cribSpot.shadow.autoUpdate = false
      if (shF === 0 || !full) cribSpot.shadow.needsUpdate = true
      if (TORCH.on && full) { spot.shadow.autoUpdate = false; if (shF === 1) spot.shadow.needsUpdate = true }
      INS.beamK.value = 0.8
      if (D.testLight) { hemi.intensity = 1.1; fill.intensity = 1.2 }
      insLitFeed(full)
      if (D.lightHook) D.lightHook({ hemi, moon, fill, winL, cribSpot, spot, lamp, LITU, glow: litGlow })
    }

    // ---------- a tela (começo, pausa) e o painel de cima na Intro ----------
    function insTela(touch) {
      if (D.mode === 'load') return null
      const keysI = keysOf([...KEYS_B, ['E', 'abrir portas']])
      if (D.mode === 'start' && !D.playing) return `<div class="ey">C.R.O.S. · demo da Intro</div><h2>INTRO</h2><div class="lt">a instalação da C.R.O.S. · subsolo 3</div>
        <div class="dh-goal">O Glutão cresceu, rompeu a contenção e soltou os Espectrais. Com a Lara e o Nicolas, atravesse a barreira e recapture o que escapou. Zerados, os fantasmas se desfazem numa poça: jogue a armadilha nela antes que o anel feche. As armas não acabam, mas esquentam: troque de arma antes que travem.</div>
        ${keysI}<div class="dh-go">${touch ? 'precisa de teclado e mouse' : 'clique para começar'}</div>`
      if (D.mode === 'fight' && !D.playing) return `<div class="ey">pausa · ${(insRoom(P.pos.x, P.pos.z) || { name: 'a instalação' }).name.toLowerCase()}</div><h2>PAUSA</h2>${keysI}<div class="dh-go">clique para voltar</div>`
      if (D.mode === 'won' && D.endShown) return `<div class="ey">C.R.O.S. · relatório de campo</div><h2>INTRO</h2><div class="lt">subsolo 3 · Glutão capturado · Lara e Nicolas resgatados · ${fmt(D.runT || 0)}</div>${statsHtml()}<div class="dh-go">R ou clique: a Intro de novo</div>`
      if (D.mode === 'dead' && D.endShown) return `<div class="ey">C.R.O.S. · relatório de campo</div><h2 class="red">AGENTE ABATIDO</h2><div class="lt">a instalação</div>${statsHtml()}<div class="dh-go">R ou clique: voltar ao ponto de retorno (${INS.cps[INS.cp].name})</div>`
      return null
    }
    function insHud(dt) {
      const en = INS.enc, bs = INS.boss, bOn = bs.st === 'fight' || bs.st === 'down' || bs.st === 'rise', on = (en.st === 'awake' || bOn) && D.mode === 'fight'
      el.boss.style.opacity = on ? 1 : 0
      if (bOn && bs.e) {
        const f = bs.st === 'down' ? 0 : bs.e.hp / bs.e.max
        el.name.textContent = 'O GLUTÃO'; el.phase.textContent = bs.st === 'down' ? `desfeito · jogue a armadilha · ${Math.max(0, bs.e.downT).toFixed(1)} s` : 'usina · o núcleo leva o dano inteiro'
        barEls.forEach((b, i) => { if (i > 0) { b.e.style.display = 'none'; return } b.e.style.display = ''; b.e.style.flex = 1; b.tr = f < b.tr ? damp(b.tr, f, 2.5, dt) : f; b.i.style.transform = `scaleX(${f})`; b.u.style.transform = `scaleX(${b.tr})`; b.e.classList.add('cur'); b.e.classList.toggle('lock', bs.st === 'down') })
        el.bars.classList.remove('weak'); el.crib.hidden = true
      } else if ((en.st === 'awake' || en.st === 'clear') && bs.st === 'sleep') {
        const need = IENC.waves[en.wave], gone = en.foes.filter((e) => e.dead && e.wave === en.wave).length, left = en.st === 'clear' ? 0 : need - gone
        el.name.textContent = 'ESPECTRAIS'; el.phase.textContent = en.st === 'clear' ? 'refeitório · limpo' : `refeitório · onda ${en.wave + 1} de ${IENC.waves.length} · ${left} ${left === 1 ? 'restante' : 'restantes'}`
        barEls.forEach((b, i) => { if (i >= IENC.waves.length) { b.e.style.display = 'none'; return } b.e.style.display = ''; b.e.style.flex = IENC.waves[i]; const f = en.st === 'clear' || i < en.wave ? 0 : i > en.wave ? 1 : left / need; b.tr = f < b.tr ? damp(b.tr, f, 2.5, dt) : f; b.i.style.transform = `scaleX(${f})`; b.u.style.transform = `scaleX(${b.tr})`; b.e.classList.toggle('cur', i === en.wave && en.st === 'awake'); b.e.classList.remove('lock') })
        el.bars.classList.remove('weak'); el.crib.hidden = true
      }
      insEctoIcon(); insPudIcons()
      INS.roomT -= dt; roomEl.style.opacity = INS.roomT > 0 && D.mode === 'fight' && D.playing ? Math.min(1, INS.roomT / 0.6).toFixed(2) : 0
      objEl.style.opacity = D.mode === 'fight' && D.playing && !on && !INS.cine ? 1 : 0
    }
    const insDbg = () => `fps ${H.fps.toFixed(0)} · intro · ${D.mode} · ${INS.room || '-'}\nvocê ${P.pos.x.toFixed(2)} ${P.pos.y.toFixed(2)} ${P.pos.z.toFixed(2)} · vida ${Math.round(P.hp)} · kits ${P.kits}\nretorno ${INS.cp} · colisões ${INS.cols.length} · luzes ${LITU.uGlowN.value}\nmira ${AIM.kind} ${AIM.t.toFixed(1)} m`

    // ---------- o encontro do refeitório: três ondas de Espectrais (1, 2 e 4, no máximo 2 de cada vez) ----------
    // Quando o primeiro sobe na sua frente, o ectoplasma endurece sobre as duas portas da sala (você não sai no meio da briga).
    // Limpa a sala, a câmera mostra a grade (a saída): o ectoplasma dela amolece e ganha o ícone da arma; é só atirar até estourar.
    // O da porta de entrada continua duro: o caminho é para a frente. (Por enquanto os Espectrais morrem; a captura entra na etapa da captura.)
    const IENC = { area: [26.8, 22.8, 49.2, 39.2], wake: [26.2, 24.7, 49.8, 39.8], waves: [1, 2, 4], live: [1, 2, 2], doors: ['refeit', 'grade'], exit: 'grade', bite: 22 } // a mordida na Intro: 22 (30 no Bando), porque aqui cada um precisa ser capturado
    function insAR(e) {
      return { owner: e, center: e.cen, target: INS.tgt, lunge: BT.esp.bote, clamp: (v) => { v.x = cl(v.x, IENC.area[0], IENC.area[2]); v.z = cl(v.z, IENC.area[1], IENC.area[3]); return v },
        may: (S) => INS.enc.st === 'awake' && foeMay(e, S),
        bite: (S) => { if (e.dead) return; const d = Math.hypot(S.pos.x - INS.tgt.x, S.pos.y - INS.tgt.y, S.pos.z - INS.tgt.z); if (d < 1.15) blog('mordida', d, hurtPlayer(IENC.bite, 'mordida', _qv3.set(S.pos.x, S.pos.y, S.pos.z))); else blog('mordida', d, null) },
        done: () => foeDone(e) }
    }
    function insRiseSpot(front) { // o primeiro sobe na sua frente; os outros, a uns 6 m de você e longe uns dos outros
      const A4 = IENC.area
      if (front) return V3(cl(P.pos.x + Math.sin(C.yaw) * 4.5, A4[0] + 0.6, A4[2] - 0.6), 0, cl(P.pos.z + Math.cos(C.yaw) * 4.5, A4[1] + 0.6, A4[3] - 0.6))
      let best = V3((A4[0] + A4[2]) / 2, 0, (A4[1] + A4[3]) / 2), bs = -1e9
      for (let i = 0; i < 40; i++) {
        const x = A4[0] + 0.6 + R() * (A4[2] - A4[0] - 1.2), z = A4[1] + 0.6 + R() * (A4[3] - A4[1] - 1.2)
        let sc = -Math.abs(Math.hypot(x - P.pos.x, z - P.pos.z) - 6)
        for (const f of INS.enc.foes) if (!f.dead && f.o) { const df = Math.hypot(x - f.o.S.pos.x, z - f.o.S.pos.z); if (df < 2.4) sc -= (2.4 - df) * 3 }
        if (sc > bs) { bs = sc; best.set(x, 0, z) }
      }
      return best
    }
    function insRise(front, wave) {
      const used = new Set(INS.enc.foes.filter((f) => f.o).map((f) => f.o)), o = HPOOL.find((m) => !used.has(m)); if (!o) return false
      const h = insRiseSpot(front), e = { kind: 'esp', ins: true, down: false, o, hp: BT.esp.vida, max: BT.esp.vida, dead: false, atk: false, en: { y: 0 }, cen: V3(P.pos.x, 0, P.pos.z), home: h.clone(), house: true, riseT: 0.9, wave }
      o.ctl.pull = null; o.ctl.arena = insAR(e); o.group.position.y = 0; o.group.visible = true; o.group.updateMatrixWorld(true)
      o.reset(); o.S.R = 2.3 + R() * 0.9
      o.place(V3(h.x, -0.75, h.z), Math.atan2(P.pos.x - h.x, P.pos.z - h.z))
      o.S.ang = Math.atan2(h.z - P.pos.z, h.x - P.pos.x); o.S.ph = 'daze'; o.S.pt = 0; o.S.nextAtk = 1.8 + R() * 1.4
      ofxBurst(2, _qv.set(h.x, 0.15, h.z), 28, 2.2, 0.9, UPV, 0.9, -0.8, 2.5)
      SFX.esp('shriek'); INS.enc.foes.push(e); return true
    }
    function insEncWake(afterChase) {
      const en = INS.enc; en.st = 'awake'; en.wave = 0; en.spawnedW = 0; en.nextT = 0.8
      if (insRise(true, 0)) en.spawnedW = 1
      for (const id of IENC.doors) insEctoSeal(INS.ectos.find((E2) => E2.id === id))
      say(afterChase ? 'Matheus: Lara! ... Espectral! O ectoplasma fechou as portas.' : 'Matheus: Espectral! O ectoplasma fechou as portas.', 3.4); C.shake = Math.max(C.shake, 0.25)
    }
    function insEncReset(full) { // caiu no meio da briga (ou recomeçou): os Espectrais somem, as portas destrancam, o encontro volta a dormir
      const en = INS.enc
      for (const e of en.foes) { foeRelease(e); insPudClear(e) }
      en.foes.length = 0; BD.token = null; BD.atkCd = 1.2; BD.nSph = 0
      if (full || en.st === 'awake') { en.st = 'sleep'; en.wave = 0; en.spawnedW = 0; en.cineT = 0; for (const E2 of INS.ectos) insEctoClear(E2) }
    }
    function insEncTick(t, dt) {
      const en = INS.enc
      A.chest.getWorldPosition(INS.tgt); INS.tgt.y += 0.12
      BD.atkCd -= dt
      if (BD.token) { BD.tokT += dt; if (BD.tokT > 3.5 || BD.token.dead) { BD.token.atk = false; BD.token = null } }
      if (en.st === 'sleep') { // a primeira vez que você entra no refeitório: a fuga da Lara; depois (voltando do ponto de retorno), o encontro acorda direto
        if (P.dead < 0 && D.mode === 'fight' && !INS.cine) { if (!INS.chased) { if (P.pos.z > 23.2 && INS.room === 'refeitorio') insChaseStart() } else if (inR(IENC.wake, P.pos.x, P.pos.z)) insEncWake() }
      }
      else if (en.st === 'awake') {
        for (const e of en.foes) if (!e.dead) e.cen.set(P.pos.x, 0, P.pos.z)
      insDownTick(t, dt)
        const need = IENC.waves[en.wave], gone = en.foes.filter((e) => e.dead && e.wave === en.wave).length, alive = en.foes.filter((e) => !e.dead).length // as poças contam como vivos (ainda não foram capturados)
        if (gone >= need) {
          if (en.wave >= IENC.waves.length - 1) { en.st = 'clear'; en.cineT = 1.1; BD.token = null; say('Matheus: Limpo.', 2.4) }
          else { en.wave++; en.spawnedW = 0; en.nextT = 1.8; P.kits++; SFX.demo('kit'); say(`Onda ${en.wave + 1} de ${IENC.waves.length} · +1 kit`, 2.4) } // como no Bando: um kit a cada onda limpa
        } else { en.nextT -= dt; if (en.nextT <= 0 && alive < IENC.live[en.wave] && en.spawnedW < need) { if (insRise(false, en.wave)) en.spawnedW++; en.nextT = en.wave === 2 ? 1.2 : 0.6 } }
      } else if (en.st === 'clear' && en.cineT > 0) { en.cineT -= dt; if (en.cineT <= 0 && P.dead < 0) { insCineStart(INS.ectos.find((q) => q.id === IENC.exit)) } }
      for (const e of en.foes) if (e.o && e.o.group.visible) e.o.update(t, dt)
      for (let i = en.foes.length - 1; i >= 0; i--) { const e = en.foes[i]; if (e.o && (e.dead || e.down) && !e.o.group.visible) foeRelease(e) } // estourou e sumiu: o modelo volta para o monte
      BD.nSph = 0
      for (const e of en.foes) {
        if (e.riseT > 0) e.riseT -= dt
        if (e.dead || e.down || !e.o || !e.o.group.visible || e.riseT > 0) continue
        const o = e.o
        addSph(o.head.getWorldPosition(_qv), 0.21, 'ehead', e)
        for (const [k, r] of [[2, 0.16], [5, 0.13], [8, 0.11]]) addSph(o.P[k], r, 'enemy', e)
      }
    }

    // ---------- a captura dos pequenos: zerado, o Espectral se desfaz numa poça por 4 s; a armadilha puxa todas as poças em volta dela ----------
    // Se o tempo acaba, ele volta com metade da vida. A armadilha pode ser jogada antes: parada no chão, ela pega quem se desfizer perto.
    const ICAP = { t: 10, r: 2.8 } // 10 s desfeito até voltar
    const pudMat = new THREE.MeshBasicMaterial({ color: new THREE.Color('#5fe0c0').convertSRGBToLinear(), transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false })
    const pudRingMat = new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffd27a').convertSRGBToLinear(), transparent: true, opacity: 0.85, depthWrite: false, side: THREE.DoubleSide })
    function insDown(e) { // em vez de morrer: a poça
      if (e.down) return
      e.down = true; e.downT = ICAP.t; e.hp = 0
      if (BD.token === e) { BD.token = null; BD.atkCd = 0.7 }
      const p = e.o.S.pos; e.o.burst(); insPudMake(e, p.x, p.z)
    }
    function insPudMake(e, x, z, R0) {
      if (e.pud) insPudClear(e) // nunca duas poças para o mesmo
      const g = new THREE.Group(); g.position.set(x, 0.02, z); INS.g.add(g); if (R0) g.scale.setScalar(R0 / 0.75)
      const pud = new THREE.Mesh(new THREE.CircleGeometry(0.75, 20), pudMat); pud.rotation.x = -Math.PI / 2; pud.renderOrder = 2; g.add(pud)
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.86, 0.96, 48, 1), pudRingMat); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.01; ring.renderOrder = 2; g.add(ring)
      const gl = { p: V3(x, 0.4, z), r: 2.6, c: new THREE.Color('#5fe0c0').convertSRGBToLinear().multiplyScalar(0.8), k: 1 }; INS.glows.push(gl)
      e.pud = { g, ring, gl, x, z, pull: 0, R: R0 || 0.75 }
    }
    function insPudClear(e) { if (!e.pud) return; INS.g.remove(e.pud.g); e.pud.g.traverse((o) => o.geometry && o.geometry.dispose()); const i = INS.glows.indexOf(e.pud.gl); if (i >= 0) INS.glows.splice(i, 1); e.pud = null }
    function insDownTick(t, dt) { for (const e of INS.enc.foes) insDownStep(e, t, dt) }
    function insDownStep(e, t, dt) { // a poça: o anel do tempo (sem tempo no tutorial do escritório) e a puxada para dentro da armadilha
      {
        if (!e.down || !e.pud) return
        const P2 = e.pud
        if (P2.pull > 0) { P2.pull += dt; const u = cl(P2.pull / 1.1); P2.g.scale.setScalar((P2.R / 0.75) * (1 - u * 0.95)); P2.g.position.x = P2.x + (TRAP.pos.x - P2.x) * u * u; P2.g.position.z = P2.z + (TRAP.pos.z - P2.z) * u * u; if (u >= 1) { e.down = false; e.dead = true; insPudClear(e) } return } // puxada para dentro da armadilha
        if (!e.noTimer) e.downT -= dt
        const f = e.noTimer ? 1 : cl(e.downT / ICAP.t), n = P2.ring.geometry.index.count; P2.ring.geometry.setDrawRange(0, Math.floor(n * f / 3) * 3)
        P2.g.children[0].material.opacity = 0.45 + 0.2 * Math.sin(t * 6); P2.gl.k = 0.7 + 0.3 * Math.sin(t * 6)
        if (!e.noTimer && e.downT <= 0) (e.boss ? insBossRevive : insRevive)(e)
      }
    }
    function insRevive(e) { // não deu tempo: sobe de novo com metade da vida
      const used = new Set(INS.enc.foes.concat(INS.boss.foes).filter((f) => f.o).map((f) => f.o)), o = HPOOL.find((m) => !used.has(m) && !m.group.visible); if (!o) { e.downT = 0.3; return }
      const x = e.pud.x, z = e.pud.z; insPudClear(e)
      e.down = false; e.hp = e.max / 2; e.o = o; e.riseT = 0.9
      o.ctl.pull = null; o.ctl.arena = (e.arF || insAR)(e); o.group.position.y = 0; o.group.visible = true; o.reset(); o.S.R = 2.3 + R() * 0.9
      o.place(V3(x, -0.75, z), Math.atan2(P.pos.x - x, P.pos.z - z)); o.S.ang = Math.atan2(z - P.pos.z, x - P.pos.x); o.S.ph = 'daze'; o.S.pt = 0; o.S.nextAtk = 1.6
      ofxBurst(2, _qv.set(x, 0.15, z), 22, 2, 0.8, UPV, 0.9, -0.8, 2.5); SFX.esp('shriek'); say('Ele voltou com metade da vida', 2.4)
    }
    function insTrapCheck(S) { // a armadilha no chão: as poças no raio dela são puxadas
      const got = insCapPool().filter((e) => e.down && e.pud && !e.pud.pull && Math.hypot(e.pud.x - S.pos.x, e.pud.z - S.pos.z) < ICAP.r + (e.pud.R || 0.75) - 0.75)
      if (!got.length) { if (S.t > 7) trapRecall(); return } // nada por perto: volta sozinha depois de um tempo
      S.state = 'icap'; S.t = 0; S.cap = got; for (const e of got) e.pud.pull = 0.001
      SFX.fps('oTrapZap', 'win'); trapRing.material.color.copy(RELIC.hot)
    }
    function insTrapCapTick(S, dt) {
      trapG.position.copy(S.pos); trapRing.material.color.copy(Math.sin(S.t * 40) > 0 ? RELIC.hot : RELIC.on)
      beams.forEach((m, i) => {
        const e = S.cap[i], on = e && e.pud && S.t < 1.1; m.visible = !!on; if (!on) return
        _bt.copy(e.pud.g.position).setY(0.15).sub(S.pos); const len = _bt.length() || 0.01
        m.position.copy(S.pos); m.position.y += 0.1; m.scale.set(1, len, 1); m.quaternion.setFromUnitVectors(UPV, _bt.multiplyScalar(1 / len)); m.material.map.repeat.set(2, len * 7); m.material.map.offset.y -= dt * 3
      })
      if (S.t > 1.35) {
        beams.forEach((m) => (m.visible = false)); const n = S.cap.length
        IH.capN++; say(S.cap.some((e) => e.boss) ? 'Glutão capturado!' : n > 1 ? `${n} Espectrais capturados` : 'Espectral capturado', 2.2); SFX.demo('kit')
        S.state = 'return'; S.t = 0; S.from.copy(S.pos); S.cap = null
      }
    }

    // ---------- o ectoplasma endurecido: tampa a porta durante a briga; amolecido, sai na bala ----------
    const ECTO = { hard: new THREE.Color('#284a40').convertSRGBToLinear(), soft: new THREE.Color('#3aa883').convertSRGBToLinear(), hp: 60 }
    function blobInto(arr, r, cx, cy, cz, sx, sy, sz) { // uma bolha irregular (icosaedro amassado), já na posição: entra na lista da malha única
      const g = new THREE.IcosahedronGeometry(1, 1), p = g.attributes.position, v = _qv
      const k1 = r() * 6.28, k2 = r() * 6.28
      for (let i = 0; i < p.count; i++) {
        v.fromBufferAttribute(p, i); const n = 1 + 0.18 * Math.sin(v.x * 3.1 + k1) * Math.sin(v.y * 2.7 + k2) + 0.1 * Math.sin(v.z * 4.3 + k1 * 2)
        arr.push(cx + v.x * sx * n, cy + v.y * sy * n, cz + v.z * sz * n)
      }
      g.dispose()
    }
    function insEctoMake(id) {
      const D2 = IDOORS.find((d) => d.id === id), isX = D2.ax === 'x'
      const sg = (insRoom(isX ? D2.u : D2.c + 0.6, isX ? D2.c + 0.6 : D2.u) || {}).id === (id === 'usina' ? 'usina' : 'refeitorio') ? 1 : -1 // o lado de dentro da sala da briga
      const g = new THREE.Group(); g.position.set(isX ? D2.u : D2.c + sg * 0.32, 0, isX ? D2.c + sg * 0.32 : D2.u); g.rotation.y = isX ? 0 : Math.PI / 2; INS.g.add(g); g.visible = false
      const r = rng(id.length * 131 + 7), W = D2.w + 0.8, H = D2.h + 0.5, nx = Math.ceil(W / 0.5), ny = Math.ceil(H / 0.5), pos = []
      for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
        const x = -W / 2 + (i + 0.5) * W / nx + (r() - 0.5) * 0.15, y = (j + 0.5) * H / ny + (r() - 0.5) * 0.12, s = 0.32 + r() * 0.16
        blobInto(pos, r, x, y, (r() - 0.5) * 0.18, s * (1 + r() * 0.3), s * (0.9 + r() * 0.3), 0.2 + r() * 0.16)
      }
      for (let i = 0; i < 7; i++) { const a = r() * 6.28; blobInto(pos, r, Math.cos(a) * (W / 2 + 0.15), H * 0.5 + Math.sin(a) * H * 0.55, -0.05, 0.22 + r() * 0.2, 0.3 + r() * 0.3, 0.1) } // os tentáculos que agarram a parede
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.computeVertexNormals(); geo.computeBoundingSphere()
      const mat = std({ color: '#284a40' }); mat.emissive = new THREE.Color(0, 0, 0)
      const m = new THREE.Mesh(geo, mat); m.userData.noBake = true; m.receiveShadow = true; g.add(m)
      const drips = [0, 1, 2].map((i) => { const d = fp(g, new THREE.SphereGeometry(0.07, 6, 4), mat, -W / 3 + i * W / 3, 0.2, 0.1 * sg, 0, 0, 0, false); d.userData.noBake = true; d.visible = false; return { m: d, t: R() * 2 } })
      const cx = isX ? D2.u : D2.c + sg * 0.3, cz = isX ? D2.c + sg * 0.3 : D2.u
      const col = iCol(cx, cz, isX ? W / 2 : 0.35, isX ? 0.35 : W / 2, 0, 0, H, { off: true })
      const gl = { p: V3(cx, 1.3, cz), r: 4, c: ECTO.soft.clone().multiplyScalar(0.9), k: 0, ecto: true }; INS.glows.push(gl)
      const E2 = { id, D: D2, g, m, mat, drips, col, gl, sg, st: 'none', k: 0, soft: 0, hp: ECTO.hp, hitT: 0, warned: 0, c: V3(cx, 1.35, cz), n: isX ? V3(0, 0, sg) : V3(sg, 0, 0) }
      col.ecto = E2; INS.ectos.push(E2); return E2
    }
    function insEctoSeal(E2) { // cresce sobre a porta em meio segundo; a colisão vale na hora (ninguém escapa no meio)
      if (!E2 || E2.st !== 'none') return
      E2.st = 'hard'; E2.k = 0; E2.soft = 0; E2.hp = ECTO.hp; E2.g.visible = true; E2.col.off = false
      if (Math.hypot(P.pos.x - E2.c.x, P.pos.z - E2.c.z) < 1.4) { P.pos.x += E2.n.x * 1.2; P.pos.z += E2.n.z * 1.2 } // em cima da porta: empurra para dentro
      for (let i = 0; i < 3; i++) setTimeout(() => SFX.luta('bolha'), i * 120); SFX.esp('hiss')
      ofxBurst(2, E2.c, 24, 2, 0.8, E2.n, 0.8, -1, 3)
    }
    function insEctoSoften(E2) { if (!E2 || E2.st !== 'hard') return; E2.st = 'soft'; SFX.esp('hiss'); SFX.luta('bolha') }
    function insEctoClear(E2) { E2.st = 'none'; E2.g.visible = false; E2.col.off = true; E2.gl.k = 0; E2.soft = 0; E2.k = 0 }
    function insEctoHit(E2, dmg, p) {
      if (!E2 || E2.st === 'none' || E2.st === 'gone') return
      if (E2.st === 'hard') { // duro: a bala bate e volta
        spark(p, '#9ab0a8', 0.12); SFX.fps('oHit')
        if (E2.warned <= 0) { say('Matheus: Endurecido. Não cede enquanto houver Espectral por aqui.', 3); E2.warned = 6 }
        return
      }
      E2.hp -= dmg; E2.hitT = 0.25; P.stats.hits++
      spark(p, '#7affc0', 0.2); ofxBurst(2, p, 10, 2.4, 0.6, E2.n, 0.9, -2, 3); SFX.luta('bolha'); hitMark('hit')
      if (E2.hp <= 0) { // estoura: a porta fica livre
        E2.st = 'gone'; E2.g.visible = false; E2.col.off = true; E2.gl.k = 0
        ofxBurst(2, E2.c, 60, 4, 1.1, E2.n, 1, -2.5, 2.5); SFX.esp('burst'); C.shake = Math.max(C.shake, 0.3)
        say('Matheus: Caminho livre.', 2.4)
      }
    }
    function insEctoTick(t, dt) {
      for (const E2 of INS.ectos) {
        if (E2.st === 'none' || E2.st === 'gone') continue
        E2.k = Math.min(1, E2.k + dt / 0.55); E2.warned -= dt; E2.hitT = Math.max(0, E2.hitT - dt)
        if (E2.st === 'soft') E2.soft = Math.min(1, E2.soft + dt / 2.0)
        const s = E2.soft, gr = sm(E2.k), wob = s * (0.035 * Math.sin(t * 4.1) + 0.02 * Math.sin(t * 9.3)) + E2.hitT * 0.12
        E2.g.scale.set(gr * (1 + wob), gr * (1 - wob * 0.6), gr * (1 + wob * 1.4))
        E2.mat.color.copy(ECTO.hard).lerp(ECTO.soft, s * (0.75 + 0.25 * Math.sin(t * 3)))
        E2.mat.emissive.copy(ECTO.soft).multiplyScalar(s * (0.1 + 0.06 * Math.sin(t * 3)) + E2.hitT * 0.8)
        E2.gl.k = s * (0.7 + 0.3 * Math.sin(t * 3))
        for (const d of E2.drips) { d.m.visible = s > 0.3; if (!d.m.visible) continue; d.t += dt; const u = (d.t % 1.6) / 1.6; d.m.position.y = 0.25 + (1 - u * u) * 0.9; d.m.scale.setScalar(1 - u * 0.6) }
      }
    }
    function insEctoNear() { // o ectoplasma na frente de você (para o E)
      const fx = Math.sin(C.yaw), fz = Math.cos(C.yaw)
      for (const E2 of INS.ectos) {
        if (E2.st === 'none' || E2.st === 'gone') continue
        const dx = E2.c.x - P.pos.x, dz = E2.c.z - P.pos.z, d = Math.hypot(dx, dz)
        if (d < 2.4 && (d < 0.6 || (dx * fx + dz * fz) / d > 0.3)) return E2
      }
      return null
    }

    // ---------- o close: a câmera mostra a saída enquanto o ectoplasma amolece ----------
    function insCineStart(E2) {
      const side = V3(-E2.n.z, 0, E2.n.x) // de lado, para a porta aparecer em perspectiva
      INS.cine = { t: 0, dur: 3.6, E: E2, from: E2.c.clone().addScaledVector(E2.n, 5.6).addScaledVector(side, 1.7).setY(1.9), to: E2.c.clone().addScaledVector(E2.n, 4.3).addScaledVector(side, 1.1).setY(1.65), look: E2.c.clone().setY(1.25) }
      hud.classList.add('cine'); promptEl.textContent = ''; IN.fire = IN.aim = false
    }
    function insCineTick(dt, tt) {
      const c = INS.cine; if (!c) return false
      c.t += dt
      if (c.kind === 'bossIn' || c.kind === 'end') { const lb = Math.min(1, c.t / 0.35, (c.dur - c.t) / 0.35); cutLb.style.setProperty('--lb', Math.max(0, lb).toFixed(3)); (c.kind === 'end' ? insEndTick : insBossInTick)(c, dt, tt); if (c.t >= c.dur || press('Space')) insCineEnd(); return true }
      if (c.kind === 'office') { const lb = Math.min(1, c.t / 0.35, (c.dur - c.t) / 0.35); cutLb.style.setProperty('--lb', Math.max(0, lb).toFixed(3)); insOfficeTick(c, dt, tt); if (c.t >= c.dur || press('Space')) insCineEnd(); return true }
      if (c.kind === 'chase') { const lb = Math.min(1, c.t / 0.35, (c.dur - c.t) / 0.35); cutLb.style.setProperty('--lb', Math.max(0, lb).toFixed(3)); insChaseTick(c, dt, tt); if (c.t >= c.dur || press('Space')) insCineEnd(); return true }
      if (c.t > 0.7 && c.E.st === 'hard') insEctoSoften(c.E) // o close começa no duro; ele amolece na sua frente
      const u = sm(cl(c.t / c.dur)), lb = Math.min(1, c.t / 0.35, (c.dur - c.t) / 0.35)
      cutLb.style.setProperty('--lb', Math.max(0, lb).toFixed(3))
      D.camOv = { p: c.from.clone().lerp(c.to, u), l: c.look, rel: false }
      if (c.t >= c.dur || press('Space')) insCineEnd()
      return true
    }
    function insCineEnd(quiet) {
      const c = INS.cine; if (!c) return
      INS.cine = null; D.camOv = null; hud.classList.remove('cine'); cutLb.style.setProperty('--lb', 0); C.k = 1
      if (c.kind === 'chase') { insChaseFinish(c, quiet); return }
      if (c.kind === 'office') { insOfficeFinish(c, quiet); return }
      if (c.kind === 'bossIn') { insBossInFinish(c, quiet); return }
      if (c.kind === 'end') { insEndFinish(c, quiet); return }
      insEctoSoften(c.E); if (!quiet) say('Atire no ectoplasma da grade para abrir caminho', 3.2)
    }

    // ---------- o ícone da arma em cima do ectoplasma amolecido ----------
    css.textContent += `
.dh-ecto { position: absolute; left: 0; top: 0; width: 46px; height: 46px; margin: -23px 0 0 -23px; border-radius: 50%; display: grid; place-items: center; pointer-events: none; opacity: 0; transition: opacity 0.25s;
  background: rgba(8, 20, 16, 0.55); box-shadow: 0 0 0 2px rgba(122, 255, 192, 0.85), 0 0 14px rgba(122, 255, 192, 0.45); color: #b8ffe0; }
.dh-ecto svg { width: 28px; height: 28px; }
.dh-ecto b { position: absolute; top: 50px; left: 50%; transform: translateX(-50%); font: 500 10px/1 var(--mono, monospace); letter-spacing: 0.18em; text-transform: uppercase; white-space: nowrap; color: #b8ffe0; text-shadow: 0 1px 2px #000; }
`
    const ectoEl = document.createElement('div'); ectoEl.className = 'dh-ecto'
    ectoEl.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 9h13l2-2h3v4h-3l-1 1v2h-4l-1 4H8l1-4H5L3 12z"/><path d="M12 14v-2"/></svg><b>atire</b>'
    hud.append(ectoEl)
    const _ep = V3()
    function insEctoIcon() {
      const E2 = INS.ectos.find((q) => q.st === 'soft')
      let show = false
      if (E2 && D.mode === 'fight' && D.playing && !INS.cine && E2.soft > 0.5) {
        _ep.copy(E2.c).setY(E2.D.h + 0.85).project(camera)
        if (_ep.z < 1 && Math.abs(_ep.x) < 1.1 && Math.abs(_ep.y) < 1.1) { const r = hud.getBoundingClientRect(); ectoEl.style.transform = `translate(${((_ep.x + 1) / 2 * r.width).toFixed(1)}px, ${((1 - _ep.y) / 2 * r.height).toFixed(1)}px)`; show = true }
      }
      ectoEl.style.opacity = show ? 1 : 0
    }

    // ---------- Lara e Nicolas: cópias do agente (o mesmo traje), com rosto, cabelo e um objeto de cada um ----------
    // Não lutam fora das cenas: seguem um caminho marcado alguns metros à sua frente, esperam nas portas e abrem quando você chega perto.
    // Não colidem com você (nunca travam a passagem). A animação é simples: as pernas e os braços balançam; parados, respiram.
    function paintFaceN(o) { // o rosto de um colega, no mesmo mapa do rosto do Matheus (96 × 48, a frente no primeiro quarto)
      const Y = (ny) => Math.round(Math.acos(ny) / Math.PI * FH), yE = Y(-0.01), yB = Y(0.17), yN = Y(-0.3), yM = Y(-0.5), yC = Y(-0.72)
      return canvasTex(FW, FH, (g) => {
        const px = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(FX + x, y, w, h) }, r = rng(o.seed)
        g.fillStyle = o.skin; g.fillRect(0, 0, FW, FH)
        for (let i = 0; i < 240; i++) { g.fillStyle = r() < 0.5 ? o.skinD : o.skinL; g.fillRect(r() * FW | 0, r() * FH | 0, 1, 1) }
        if (o.scalp) for (let i = 0; i < 900; i++) { const y = r() * Y(0.3) | 0, x = r() * FW | 0; if (Math.abs(x - FX) < 9 && y > Y(0.42)) continue; g.fillStyle = r() < 0.6 ? o.scalp : o.skinD; g.fillRect(x, y, 1, 1) } // a cabeça raspada
        px(-9, yN, 18, yC - yN + 4, o.skinD)
        if (o.beard) for (let i = 0; i < 520; i++) { const x = -15 + r() * 30 | 0, y = yN - 1 + r() * (yC - yN + 6) | 0; if (Math.abs(x) < 3 && y < yM - 1 && y > yN) continue; px(x, y, 1, 1, r() < 0.75 ? o.beard : o.skinD) } // a barba cheia
        px(-7, yE - 1, 5, 2, o.skinD); px(2, yE - 1, 5, 2, o.skinD)
        px(-1, yB + 1, 2, yN - yB - 1, o.skinL); px(1, yB + 2, 1, yN - yB - 1, o.skinD); px(-2, yN, 4, 1, o.skinD)
        for (const ex of [-6, 3]) { px(ex, yE - 1, 3, 2, '#d2c8bc'); px(ex + 1, yE - 1, 1, 2, o.iris); px(ex, yE - 2, 3, 1, '#3a2620') }
        for (const bx of [-7, 3]) { px(bx, yB, 4, o.browH || 1, o.brow) }
        px(-2, yM, 5, 1, o.lips); if (!o.beard) px(-1, yM + 1, 3, 1, o.skinD)
      })
    }
    const MF = {
      lara: { face: std({ map: paintFaceN({ seed: 5101, skin: '#b48c74', skinD: '#9e7862', skinL: '#c29a82', iris: '#3a5a6a', brow: '#8a6a2a', lips: '#9a5850' }) }), skin: std({ color: '#b48c74' }),
        hair: std({ map: tiled(canvasTex(32, 32, (g, w, h) => { const r = rng(5107); g.fillStyle = '#c8a048'; g.fillRect(0, 0, w, h); for (let i = 0; i < 26; i++) { const x0 = r() * w, ph = r() * 6.3; g.fillStyle = r() < 0.5 ? 'rgba(240,210,130,0.6)' : 'rgba(120,88,30,0.45)'; for (let y = 0; y < h; y++) g.fillRect(((x0 + Math.sin(y * 0.2 + ph)) % w + w) % w | 0, y, 1, 1) } }), 3, 2) }),
        tie: std({ color: '#5a1e24' }) },
      nicolas: { face: std({ map: paintFaceN({ seed: 5113, skin: '#7c5a48', skinD: '#664838', skinL: '#8c6a56', iris: '#2a1a12', brow: '#140c08', browH: 2, lips: '#5a3a30', beard: '#1a120c', scalp: '#2a1e16' }) }), skin: std({ color: '#7c5a48' }) },
      lens: basic({ color: '#fff0c8' }), wood: std({ color: '#4a2e1a' }), barrel: std({ color: '#3a3e42' }),
    }
    function mateMake(kind) {
      const root = A.root.clone(true), map = new Map(), a = [], b = []
      A.root.traverse((x) => a.push(x)); root.traverse((x) => b.push(x)); a.forEach((x, i) => map.set(x, b[i]))
      const M = (x) => map.get(x), F = MF[kind]
      for (const x of [AH.mesh, A.beltTrap, A.kitHand, ...Object.values(W)]) { const c = M(x); if (c && x !== (kind === 'lara' ? W.pistola : W.escopeta)) c.parent.remove(c); else if (c) c.visible = false } // o que é só do Matheus sai da cópia
      root.traverse((o) => { if (!o.isMesh) return; if (o.material === AGM.hairS) o.visible = kind === 'lara'; if (o.material === AGM.hairS && kind === 'lara') o.material = F.hair; if (o.material === AGM.face) o.material = F.face; if (o.material === AGM.skin) o.material = F.skin })
      for (const o of [...b]) if (o.isLight) o.parent.remove(o)
      const R2 = { root, kind, roll: M(A.roll), pelvis: M(A.pelvis), spine: M(A.spine), chest: M(A.chest), neck: M(A.neck), head: M(A.head),
        legs: A.legs.map((l) => ({ s: l.s, th: M(l.th), kn: M(l.kn), ft: M(l.ft) })), arms: A.arms.map((q) => ({ s: q.s, sh: M(q.sh), up: M(q.up), fo: M(q.fo), hd: M(q.hd) })), panels: A.panels.map((q) => M(q.g)),
        gun: M(kind === 'lara' ? W.pistola : W.escopeta) }
      for (const q of [R2.spine, R2.chest, R2.neck, R2.head, ...R2.legs.flatMap((l) => [l.th, l.kn, l.ft]), ...R2.arms.flatMap((q) => [q.sh, q.up, q.fo, q.hd]), ...R2.panels]) q.quaternion.identity()
      R2.roll.position.set(0, 0.5, 0); R2.roll.quaternion.identity(); R2.pelvis.position.y = 0.42; R2.pelvis.quaternion.identity()
      if (kind === 'lara') { // o rabo de cavalo loiro com o laço vinho, e a lanterna de latão na alça do peito
        const h = R2.head
        put(new THREE.TorusGeometry(0.018, 0.008, 4, 8), F.tie, [0, 0.085, -0.112], h, [0.3, 0, 0], false)
        ;[[0.07, -0.122, 0.034], [0.01, -0.13, 0.03], [-0.05, -0.128, 0.026], [-0.105, -0.12, 0.02]].forEach(([y, z, r]) => put(sph(r, 6, 5), F.hair, [0, y, z], h, null, false).scale.set(1, 1.5, 0.9))
        const lamp = new THREE.Group(); lamp.position.set(0.085, 0.02, 0.15); R2.chest.add(lamp)
        put(boxG(0.075, 0.09, 0.05), AGM.brass, null, lamp); put(new THREE.CylinderGeometry(0.026, 0.026, 0.012, 10), MF.lens, [0, 0, 0.028], lamp, [Math.PI / 2, 0, 0], false)
        put(boxG(0.03, 0.42, 0.012), AGM.leather, [0.01, 0.03, 0.147], R2.chest, [0, 0, -0.62], false)
        R2.lamp = lamp; root.scale.set(0.94, 0.97, 0.94)
      } else { // a escopeta pendurada nas costas, por cima do relicário
        const sg = new THREE.Group(); sg.position.set(0.04, 0.02, -0.26); sg.rotation.z = 0.55; R2.chest.add(sg)
        put(new THREE.CylinderGeometry(0.016, 0.016, 0.62, 6), MF.barrel, [-0.012, 0.28, 0], sg, null, false); put(new THREE.CylinderGeometry(0.016, 0.016, 0.62, 6), MF.barrel, [0.012, 0.28, 0], sg, null, false)
        put(boxG(0.05, 0.3, 0.07), MF.wood, [0, -0.12, 0], sg); put(boxG(0.045, 0.12, 0.05), AGM.brass, [0, 0.03, 0], sg, null, false)
        put(boxG(0.03, 0.42, 0.012), AGM.leather, [-0.02, 0.03, 0.147], R2.chest, [0, 0, 0.62], false)
        root.scale.set(1.12, 1.06, 1.12)
      }
      const gone = []; root.traverse((o) => { if (o.isMesh && !o.visible) gone.push(o) }); gone.forEach((o) => o.parent.remove(o))
      const grp = []; root.traverse((o) => { if (!o.isMesh) grp.push(o) }); grp.forEach((g2) => { if (g2 !== R2.gun && !R2.gun.getObjectById(g2.id)) mergeParts(g2) }) // as peças paradas de cada osso viram uma malha por material (a cópia custava 230 chamadas de desenho)
      root.traverse((o) => { if (o.isMesh) o.castShadow = false }) // sem sombra própria: cada peça custaria mais duas passadas
      litMark(root, () => 'char')
      INS.g.add(root); BAKE.skip.add(root)
      return R2
    }
    // o caminho dos dois (o mesmo que você faz), com as portas onde eles param
    const MPATH = [[5.4, 7], [8.6, 7], [20, 7], [32.4, 7, 'escrit'], [36.4, 8.8], [40, 9.8], [40, 12.1, 'corr2'], [40, 16.5], [40, 21.1, 'refeit'], [40, 23.6], [40.6, 26.4]]
    const MSL = []; { let acc = 0; MPATH.forEach((p, i) => { if (i) acc += Math.hypot(p[0] - MPATH[i - 1][0], p[1] - MPATH[i - 1][1]); MSL.push(acc) }) }
    const MEND = MSL[MSL.length - 1]
    function mpAt(s, lat, out) { // o ponto do caminho em s (com um deslocamento de lado) e a direção
      s = cl(s, 0, MEND); let i = 1; while (i < MSL.length - 1 && MSL[i] < s) i++
      const a = MPATH[i - 1], b2 = MPATH[i], L = MSL[i] - MSL[i - 1] || 1, u = (s - MSL[i - 1]) / L, dx = (b2[0] - a[0]) / L, dz = (b2[1] - a[1]) / L
      out.set(a[0] + (b2[0] - a[0]) * u - dz * lat, 0, a[1] + (b2[1] - a[1]) * u + dx * lat); out.dx = dx; out.dz = dz; return out
    }
    function mpProj(x, z) { let best = 0, bd = 1e9; for (let i = 1; i < MPATH.length; i++) { const a = MPATH[i - 1], b2 = MPATH[i], L = MSL[i] - MSL[i - 1], ux = (b2[0] - a[0]) / L, uz = (b2[1] - a[1]) / L, t = cl((x - a[0]) * ux + (z - a[1]) * uz, 0, L), px = a[0] + ux * t, pz = a[1] + uz * t, d = Math.hypot(x - px, z - pz); if (d < bd) { bd = d; best = MSL[i - 1] + t } } return best }
    function mateDoorStop(from) { // o próximo ponto de porta ainda fechada depois de 'from'
      for (let i = 0; i < MPATH.length; i++) { const id = MPATH[i][2]; if (!id || MSL[i] < from - 0.5) continue; const D2 = INS.doors.find((d) => d.id === id); if (D2 && D2.st !== 'open') return { s: MSL[i] - 1.0, D: D2 } }
      return null
    }
    const _mp = V3()
    function matesReset() {
      for (const m of INS.mates) { m.s = m.kind === 'lara' ? 0.8 : 0; m.spd = 0; m.ph = 0; m.k = 0; m.waitT = 0; m.mode = 'follow'; m.yaw = Math.PI / 2; m.lat = m.kind === 'lara' ? 1.2 : -1.2; m.rig.root.visible = true; m.rig.head.visible = true; m.aim = 0; m.ox = m.oz = 0; m.lookX = m.lookZ = undefined; m.an = undefined; m.px = undefined; mateUnpose(m) }
      INS.mateSay = 0
    }
    function matesTick(t, dt) {
      if (!INS.mates.length) return
      const sp = mpProj(P.pos.x, P.pos.z), L = INS.mates[0], N = INS.mates[1]
      const stop = mateDoorStop(L.s)
      if (L.mode === 'follow') {
        let want = Math.min(sp + 4.5, MEND); if (stop) want = Math.min(want, stop.s)
        const gap = want - L.s
        const lw = gap > 0.03 ? Math.min(gap > 3.5 ? 4.0 : 1.9, gap * 1.5 + 0.1) : 0; L.spd += cl(lw - L.spd, -3.5 * dt, 2.5 * dt); if (L.s < want) L.s = Math.min(want, L.s + L.spd * dt); else L.spd = 0 // chega devagar; você recuou: ela espera onde está
        if (stop && L.s > stop.s - 0.2 && sp > stop.s - 4.5 && !(stop.D.id === 'escrit' && !INS.officeDone)) { L.waitT += dt; if (L.waitT > 0.8) { insOpen(stop.D); L.waitT = 0 } } else L.waitT = 0 // na porta: espera você chegar e abre
      }
      if (N.mode === 'follow') { const want = Math.max(0, L.s - 1.7), gap = want - N.s; const nw = gap > 0.03 ? Math.min(gap > 3.5 ? 4.0 : 1.9, gap * 1.5 + 0.1) : 0; N.spd += cl(nw - N.spd, -3.5 * dt, 2.5 * dt); if (N.s < want) N.s = Math.min(want, N.s + N.spd * dt); else N.spd = 0 }
      for (const m of INS.mates) {
        if (m.mode === 'goto') { mateGotoTick(m, dt); mateAnim(m, t, dt); continue }
        if (m.mode !== 'follow') { mateAnim(m, t, dt); continue }
        const nearDoor = MPATH.some((p, i) => p[2] && Math.abs(MSL[i] - m.s) < 1.6)
        m.lat = damp(m.lat, nearDoor ? 0 : m.kind === 'lara' ? 0.7 : -0.7, 3, dt)
        mpAt(m.s, m.lat, _mp); m.ox = damp(m.ox || 0, 0, 2.2, dt); m.oz = damp(m.oz || 0, 0, 2.2, dt); _mp.x += m.ox; _mp.z += m.oz; m.rig.root.position.set(_mp.x, 0, _mp.z)
        const moving = m.spd > 0.15, ty = moving ? Math.atan2(_mp.dx, _mp.dz) : Math.atan2(P.pos.x - _mp.x, P.pos.z - _mp.z)
        m.yaw = dAng(0, m.yaw + cl(dAng(m.yaw, ty), -5 * dt, 5 * dt)); m.rig.root.rotation.y = m.yaw
        mateAnim(m, t, dt)
      }
      // as falas do caminho (por enquanto só legenda; o som de voz entra no acabamento)
      INS.mateSay += dt
      if (INS.mateSayI === undefined) INS.mateSayI = 0
      const LINES = [[2.5, 'Lara', 'Barreira ativa. Daqui para dentro, só nós e eles.'], [9, 'Nicolas', 'Fica de olho no calor da arma, Moura.']]
      const ln = LINES[INS.mateSayI]; if (ln && INS.mateSay > ln[0] && D.mode === 'fight' && L.mode === 'follow' && !INS.cine) { say(`${ln[1]}: ${ln[2]}`, 3.4); INS.mateSayI++ }
    }
    // a animação dos colegas: a mesma passada, o mesmo quadril, o mesmo pé no chão e os mesmos braços do Matheus (sem a arma na mão);
    // a velocidade vem do quanto o boneco andou no quadro (vale para a rota, para as cenas e para o 'ir até')
    const _mIK = { qU: new THREE.Quaternion(), el: 0, qH: new THREE.Quaternion() }, _mFK = { x: 0, z: 0, tw: 0, el: 0, wx: 0.1, wy: 0, wz: 0 }
    function mateAnim(m, t, dt) {
      if (m.mode === 'belly' || m.mode === 'lying' || !m.rig.root.visible) { m.px = undefined; return }
      const R2 = m.rig, root = R2.root, AM = m.an || (m.an = { ph: 0, amp: 0, run: 0, legYaw: 0, legDir: 1, bank: 0, yawPrev: m.yaw, hy: 0, vx: 0, vz: 0 })
      let wx = 0, wz = 0
      if (m.px !== undefined && dt > 0) { wx = (root.position.x - m.px) / dt; wz = (root.position.z - m.pz) / dt; if (Math.hypot(wx, wz) > 9) wx = wz = 0 } // um pulo de lugar (corte de cena): não conta
      m.px = root.position.x; m.pz = root.position.z
      AM.vx = damp(AM.vx, wx, 12, dt); AM.vz = damp(AM.vz, wz, 12, dt)
      const yaw = root.rotation.y, s = Math.sin(yaw), c = Math.cos(yaw)
      const vz = AM.vx * s + AM.vz * c, vx = AM.vx * c - AM.vz * s, sp = Math.hypot(vx, vz)
      const yr = dt > 0 ? dAng(AM.yawPrev, yaw) / dt : 0; AM.yawPrev = yaw
      AM.run = damp(AM.run, cl((sp - 2.3) / 1.3), 6, dt)
      const turnStep = sp < 0.4 && Math.abs(yr) > 1.4 ? Math.min(1, (Math.abs(yr) - 1.4) * 0.35) : 0
      AM.amp = damp(AM.amp, Math.max(cl(sp / T.agente.andar, 0, 1.3), turnStep * 0.45), 7, dt)
      if (sp > 0.3) { const ma = Math.atan2(vx, vz); let yt, dir = 1; if (Math.abs(ma) <= 1.85) yt = cl(ma, -1.15, 1.15); else { yt = cl(dAng(0, ma - Math.PI), -1.15, 1.15); dir = -1 } AM.legDir = dir; AM.legYaw = damp(AM.legYaw, yt, 9, dt) }
      else AM.legYaw = damp(AM.legYaw, 0, 6, dt)
      const aim = m.aim || 0, stride = lerp(lerp(1.45, 2.5, AM.run), 1.15, aim * (1 - AM.run))
      AM.ph += AM.legDir * (sp / stride) * Math.PI * 2 * dt + turnStep * 7 * dt
      const amp = AM.amp, run = AM.run, thA = amp * lerp(0.42, 0.66, run), bend = amp * lerp(0.6, 1.4, run)
      for (const Lg of R2.legs) {
        const p = AM.ph + (Lg.s > 0 ? Math.PI : 0), sw = Math.sin(p), cs = Math.cos(p)
        const th = -thA * sw - 0.1 * run * amp, kn = 0.06 + bend * Math.pow(Math.max(0, cs), 1.4) + 0.12 * run * amp
        const toe = amp * (0.3 * Math.max(0, Math.sin(p + 2.0)) - 0.22 * Math.max(0, Math.sin(p - 0.25)) * (1 - run * 0.5))
        Lg.th.rotation.set(th, 0, Lg.s * (0.045 + 0.025 * (1 - Math.min(1, amp)))); Lg.kn.rotation.set(kn, 0, 0); Lg.ft.rotation.set(-(th + kn) + toe, 0, -Lg.s * 0.035)
      }
      const osc = 0.11 * amp * Math.sin(AM.ph) * (0.7 + 0.3 * run)
      AM.bank = damp(AM.bank, cl(-yr * sp * 0.03, -0.16, 0.16), 6, dt)
      R2.roll.rotation.set(0, 0, 0); R2.roll.position.set(0, 0.5, 0)
      R2.pelvis.position.set(0, STAND, 0); R2.pelvis.rotation.set(0.05 * run * amp, AM.legYaw + osc, 0.045 * amp * Math.cos(AM.ph) + AM.bank)
      root.updateMatrixWorld(true) // o pé de apoio no chão (a conta no espaço do boneco: Lara e Nicolas têm outra altura)
      let lo = Infinity; for (const Lg of R2.legs) for (const q of SOLE) { _p1.copy(q); Lg.ft.localToWorld(_p1); if (_p1.y < lo) lo = _p1.y }
      R2.pelvis.position.y = STAND - (lo - root.position.y) / (root.scale.y || 1) + 0.03 * run * amp * Math.max(0, Math.sin(2 * AM.ph - 0.4))
      const breath = Math.sin(t * 1.9 + (m.kind === 'lara' ? 0 : 2)) * 0.012 * (1 - Math.min(1, amp) * 0.5)
      R2.spine.rotation.set(0.04 + 0.07 * run * amp, -AM.legYaw * 0.55 - osc * 0.9, -0.03 * amp * Math.cos(AM.ph))
      R2.chest.rotation.set(breath + 0.05 * run * amp, -AM.legYaw * 0.45 - osc * 0.35, 0); R2.chest.scale.setScalar(1)
      // a cabeça: para onde ele vai; parado, olha para você (ou para o ponto da cena)
      const lx = m.lookX !== undefined ? m.lookX : P.pos.x, lz = m.lookZ !== undefined ? m.lookZ : P.pos.z
      const near = m.lookX !== undefined || Math.hypot(lx - root.position.x, lz - root.position.z) < 7
      const hyT = sp < 0.6 && near ? cl(dAng(yaw, Math.atan2(lx - root.position.x, lz - root.position.z)), -1.0, 1.0) : 0
      AM.hy = damp(AM.hy, hyT * (1 - aim), 5, dt)
      R2.neck.rotation.set(0.04, AM.hy * 0.4, 0); R2.head.rotation.set(0.05 - 0.05 * aim, AM.hy * 0.6, 0)
      // os braços: soltos, balançando contra as pernas; na mira, os dois erguem a arma
      R2.arms.forEach((q, i) => {
        const sd = i === 0 ? -1 : 1, swing = -0.38 * amp * Math.sin(AM.ph) * (1 + 0.5 * run) * sd
        _mFK.x = lerp(swing + 0.06, i === 0 ? -1.42 : -1.3, aim); _mFK.z = lerp(sd * (0.1 + 0.06 * run), i === 0 ? -0.05 : 0.42, aim)
        _mFK.el = lerp(-0.22 - 1.0 * run * amp - 0.1 * amp, i === 0 ? -0.12 : -0.55, aim); _mFK.wx = lerp(0.1, 0, aim)
        q.sh.rotation.set(0, 0, 0); setArm(q, _mFK, _mIK, 0)
      })
      if (R2.gun) R2.gun.visible = aim > 0.3
    }
    // ir até um ponto andando (sem pular de lugar); chegando, segue para o próximo modo
    function mateGotoTick(m, dt) {
      const r = m.rig.root, dx = m.gx - r.position.x, dz = m.gz - r.position.z, d = Math.hypot(dx, dz)
      const want = d > 0.04 ? Math.min(m.gSpd || 1.9, d * 1.6 + 0.15) : 0
      m.spd = m.spd + cl(want - m.spd, -4 * dt, 3 * dt)
      if (d > 0.02) { const st = Math.min(d, m.spd * dt); r.position.x += dx / d * st; r.position.z += dz / d * st }
      const ty = d > 0.25 ? Math.atan2(dx, dz) : m.gYaw !== undefined ? m.gYaw : m.yaw
      m.yaw = dAng(0, m.yaw + cl(dAng(m.yaw, ty), -5 * dt, 5 * dt)); r.rotation.y = m.yaw
      if (d < 0.05 && m.spd < 0.2) { m.mode = m.after || 'script'; m.spd = 0; if (m.mode === 'follow') { m.s = m.gs; m.ox = m.oz = 0 } }
    }

    // ---------- a fuga do refeitório: um Espectral sobe na frente da Lara e foge pela grade; ela vai atrás, o Nicolas atrás dela ----------
    // Duas tomadas: por cima do ombro da Lara (ele sobe, grita, foge) e do lado da grade (ele atravessa as barras, ela levanta a grade e passa por baixo).
    // Depois que os dois passam, a grade despenca, o ectoplasma tampa a saída e o encontro acorda: você fica sozinho com os Espectrais. Espaço pula.
    function plMake(pts) { const sl = [0]; for (let i = 1; i < pts.length; i++) sl.push(sl[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])); return { pts, sl, len: sl[sl.length - 1] } }
    function plAt(pl, s, lat, out) {
      s = cl(s, 0, pl.len); let i = 1; while (i < pl.sl.length - 1 && pl.sl[i] < s) i++
      const a = pl.pts[i - 1], b2 = pl.pts[i], L = pl.sl[i] - pl.sl[i - 1] || 1, u = (s - pl.sl[i - 1]) / L, dx = (b2[0] - a[0]) / L, dz = (b2[1] - a[1]) / L
      out.set(a[0] + (b2[0] - a[0]) * u - dz * lat, out.y, a[1] + (b2[1] - a[1]) * u + dx * lat); out.dx = dx; out.dz = dz; return out
    }
    const ICH = { E0: V3(37.3, 1.25, 28.3), cut: 2.6, dur: 9, cam1a: V3(42.05, 1.72, 25.06), cam1b: V3(41.75, 1.66, 25.32), cam2: V3(29.4, 1.95, 37.5),
      EP: plMake([[37.3, 28.3], [34.2, 33.2], [32.5, 38.6], [32.5, 41.6], [32.5, 47.5]]), // o Espectral: por cima das mesas, atravessa a grade, some no corredor
      LP: plMake([[40.6, 26.4], [40.6, 37.4], [33.8, 38.1], [32.5, 39.4], [32.5, 42.2], [32.5, 48]]), // a Lara: o corredor entre as mesas, a faixa do fundo, a grade
      NP: plMake([[39.5, 27.4], [40, 29], [40, 37], [33.6, 37.9], [32.7, 39.3], [32.7, 42.2], [32.7, 47]]) }
    ICH.LG = ICH.LP.sl[3]; ICH.NG = ICH.NP.sl[4] // onde cada um chega na boca da grade
    const ICH_LN = [[0.45, 'Lara: Ali, em cima das mesas!', 2.0], [1.85, 'Lara: Tá fugindo. Esse é meu!', 1.7], [3.0, 'Nicolas: Lara, espera! Moura, segura a sala!', 3.2]]
    const _chP = V3(), _chA = V3(), _chB = V3()
    function insChaseStart() {
      INS.chased = true
      if (INS.mates.length < 2) { insEncWake(); return }
      const o = HPOOL[HPOOL.length - 1], E0 = ICH.E0
      o.ctl.arena = null; o.reset(); o.group.position.y = 0; o.group.visible = true
      o.place(V3(E0.x, -0.75, E0.z), Math.atan2(40.6 - E0.x, 26.4 - E0.z)); o.group.updateMatrixWorld(true)
      const Pl = { path: true, tgt: V3(E0.x, -0.75, E0.z), yaw: o.S.yaw, pitch: 0, jaw: 0.3, glow: 0.3, ux: -0.85, uz: 0.35, fx: -0.7, curl: 0.5, shrink: 1 }
      o.ctl.pull = Pl
      for (const m of INS.mates) { m.mode = 'script'; m.aim = 0; m.spd = 0; m.cs = 0; m.rig.root.visible = true }
      INS.mates[0].yaw = Math.atan2(E0.x - 40.6, E0.z - 26.4); INS.mates[1].yaw = Math.atan2(E0.x - 39.5, E0.z - 27.4)
      INS.cine = { kind: 'chase', t: 0, dur: ICH.dur, o, Pl, es: 0, ev: 0, said: 0, shot: 1, look: E0.clone().setY(0.6), gate: false, drop: -1, slam: false, sealed: false, sh: 0, cam: { p: V3(), l: V3(), rel: false } }
      hud.classList.add('cine'); promptEl.textContent = ''; IN.fire = IN.aim = false; INS.roomT = 0
      ofxBurst(2, _qv.set(E0.x, 0.15, E0.z), 28, 2.2, 0.9, UPV, 0.9, -0.8, 2.5); SFX.esp('hiss')
    }
    function chaseMate(m, pl, dt, fx, fz) {
      plAt(pl, m.cs, 0, _mp); m.rig.root.position.set(_mp.x, 0, _mp.z)
      const ty = m.spd > 0.4 ? Math.atan2(_mp.dx, _mp.dz) : Math.atan2(fx - _mp.x, fz - _mp.z)
      m.yaw = dAng(0, m.yaw + cl(dAng(m.yaw, ty), -8 * dt, 8 * dt)); m.rig.root.rotation.y = m.yaw
    }
    function insChaseTick(c, dt, tt) {
      const t = c.t, o = c.o, Pl = c.Pl, E0 = ICH.E0, L = INS.mates[0], N = INS.mates[1], G2 = INS.doors.find((d) => d.id === 'grade')
      while (c.said < ICH_LN.length && t > ICH_LN[c.said][0]) { say(ICH_LN[c.said][1], ICH_LN[c.said][2]); c.said++ }
      // --- o Espectral: sobe do chão encarando a Lara, grita, e foge pela grade
      if (o.group.visible) {
        if (t < 1.7) {
          const u = sm(cl(t / 0.9)), sc = t > 1.15
          Pl.tgt.set(E0.x, -0.75 + 2.0 * u + 0.06 * Math.sin(t * 3), E0.z)
          Pl.yaw = Math.atan2(L.rig.root.position.x - E0.x, L.rig.root.position.z - E0.z); Pl.pitch = sc ? -0.45 : 0.1; Pl.jaw = sc ? 1.2 : 0.25; Pl.glow = sc ? 1 : 0.35
          Pl.ux = sc ? -2.3 : -0.85; Pl.uz = sc ? 0.95 : 0.35; Pl.fx = sc ? -0.35 : -0.7; Pl.curl = sc ? 0.05 : 0.5
          if (sc && !c.shriek) { c.shriek = true; SFX.esp('shriek') }
        } else {
          c.ev = Math.min(5.2, c.ev + dt * 7); c.es += c.ev * dt
          plAt(ICH.EP, c.es, 0, Pl.tgt); Pl.tgt.y = 1.3 + 0.08 * Math.sin(t * 7)
          Pl.yaw = Math.atan2(Pl.tgt.dx, Pl.tgt.dz); Pl.pitch = 0.3; Pl.jaw = 0.7 + 0.25 * Math.sin(t * 11); Pl.glow = 0.7
          Pl.ux = 0.4; Pl.uz = 0.5; Pl.fx = -0.2; Pl.curl = 0.1; Pl.shrink = cl((ICH.EP.len - c.es) / 3.5, 0.05, 1)
          if (!c.whip) { c.whip = true; SFX.esp('whip') }
          if (c.es >= ICH.EP.len - 0.05) { o.group.visible = false; o.lightOff() }
        }
        if (o.group.visible) o.update(tt, dt)
      }
      // --- o corte: na segunda tomada o tempo encolhe (a Lara já vai no meio do caminho)
      if (t >= ICH.cut && c.shot === 1) { c.shot = 2; L.cs = Math.max(L.cs, 8.4); N.cs = Math.max(N.cs, ICH.NG - (ICH.LG - L.cs) - 2.0); L.spd = Math.max(L.spd, 3.5); N.spd = Math.max(N.spd, 3.5); if (o.group.visible) c.look.copy(o.S.pos) }
      const open = G2.k > 0.55
      // --- a Lara: mira; depois corre atrás; na grade, puxa para cima e passa por baixo
      if (t < 2.0) { L.aim = damp(L.aim, t > 0.35 ? 1 : 0, 7, dt); L.spd = 0 }
      else {
        L.aim = damp(L.aim, 0, 9, dt)
        if (!c.gate && L.cs > ICH.LG - 1.4) { c.gate = true; insOpen(G2) }
        const lim = open || L.cs > ICH.LG + 0.3 ? ICH.LP.len : ICH.LG - 0.1 // passou da grade: segue pelo corredor mesmo com ela fechando
        L.spd = damp(L.spd, L.cs < lim - 0.05 ? 4.6 : 0, 6, dt); if (L.cs < lim) L.cs = Math.min(lim, L.cs + L.spd * dt)
      }
      // --- o Nicolas: mira junto e sai logo depois dela, sem passar na frente
      if (t < 2.5) { N.aim = damp(N.aim, t > 0.6 ? 1 : 0, 6, dt); N.spd = 0 }
      else {
        N.aim = damp(N.aim, 0, 9, dt)
        const lim = Math.min(open || N.cs > ICH.NG + 0.3 ? ICH.NP.len : ICH.NG - 0.9, ICH.NG - (ICH.LG - L.cs) - 1.4)
        N.spd = damp(N.spd, N.cs < lim - 0.05 ? 4.6 : 0, 6, dt); if (N.cs < lim) N.cs = Math.min(lim, N.cs + N.spd * dt)
      }
      const fx = o.group.visible ? o.S.pos.x : 32.5, fz = o.group.visible ? o.S.pos.z : 44
      chaseMate(L, ICH.LP, dt, fx, fz); chaseMate(N, ICH.NP, dt, fx, fz); L.lookX = N.lookX = fx; L.lookZ = N.lookZ = fz
      // --- a grade despenca atrás deles; o ectoplasma tampa
      if (c.drop < 0 && c.gate && (N.rig.root.position.z > 41.2 || t > 7.2)) { c.drop = t; c.dur = Math.min(c.dur, t + 2.0); insClose(G2, 7); SFX.fps('gradeUp') }
      if (c.drop >= 0 && !c.slam && t > c.drop + 0.35) { c.slam = true; G2.shake = 1; SFX.fps('rattle'); c.sh = 0.5 }
      if (c.drop >= 0 && !c.sealed && t > c.drop + 0.8) { c.sealed = true; insEctoSeal(INS.ectos.find((q) => q.id === 'grade')) }
      // --- a câmera
      c.sh = Math.max(0, c.sh - dt * 2.2)
      if (c.shot === 1) {
        _chP.copy(ICH.cam1a).lerp(ICH.cam1b, sm(cl(t / ICH.cut)))
        _chA.set(L.rig.root.position.x, 1.45, L.rig.root.position.z).lerp(_chB.copy(o.S.pos).setY(cl(o.S.pos.y, 0.5, 1.4)), 0.72)
        c.look.lerp(_chA, 1 - Math.exp(-5 * dt))
      } else {
        _chP.copy(ICH.cam2); _chP.x += (t - ICH.cut) * 0.04
        if (t < 4.3 && o.group.visible) _chA.copy(o.S.pos).setY(1.2)
        else if (c.drop < 0) _chA.set(L.rig.root.position.x * 0.6 + 32.5 * 0.4, 1.25, L.rig.root.position.z * 0.6 + 40 * 0.4)
        else _chA.set(32.5, 1.35, 40)
        c.look.lerp(_chA, 1 - Math.exp(-3 * dt))
      }
      if (c.sh > 0) { _chP.x += (R() - 0.5) * c.sh * 0.12; _chP.y += (R() - 0.5) * c.sh * 0.12 }
      c.cam.p.copy(_chP); c.cam.l.copy(c.look); D.camOv = c.cam
    }
    function insChaseFinish(c, quiet) { // o fim da cena (ou o pulo): o Espectral some, os dois já foram, a grade fechada; o encontro acorda
      const o = c.o; o.ctl.pull = null; o.group.visible = false; o.lightOff(); o.reset()
      for (const m of INS.mates) { m.mode = 'gone'; m.rig.root.visible = false; m.spd = 0; m.aim = 0 }
      const G2 = INS.doors.find((d) => d.id === 'grade'); insClose(G2); G2.k = G2.want = 0; G2.rate = 0; insDoorPose(G2, 0)
      INS.chased = true
      if (quiet) return
      insEctoSeal(INS.ectos.find((q) => q.id === 'grade'))
      C.yaw = Math.atan2(36 - P.pos.x, 31 - P.pos.z); P.yaw = C.yaw
      insEncWake(true)
    }

    // ---------- o escritório: a cena da lanterna e o tutorial da armadilha ----------
    // Você chega perto da porta: a Lara abre, acende a lanterna (a única luz de verdade da cena) e entra; a câmera passa para os olhos dela.
    // O feixe passa pelas mesas e para na mesa do meio; um Espectral sobe atrás dela e avança. Lara e Nicolas atiram e ele se desfaz no chão.
    // Fim da cena: você joga a armadilha na poça (aqui ela espera, sem tempo). Capturado, os dois seguem para o refeitório. Espaço pula.
    const IOF = { P0: V3(30.8, 0, 6.2), E0: V3(42.0, 1.3, 6.4), hit: V3(38.1, 1.25, 6.8), PEND: V3(35.2, 0, 8.4),
      LP: plMake([[32.9, 7.0], [34.0, 7.0], [36.6, 6.9]]), NP: plMake([[32.0, 8.1], [33.4, 7.4], [34.6, 6.6], [35.5, 5.7]]),
      camA: V3(28.4, 1.75, 8.6), camA2: V3(29.0, 1.72, 8.4), lookA: V3(34.0, 1.3, 7.0), camC: V3(36.4, 1.95, 10.9), camC2: V3(36.2, 1.9, 10.5), lookC: V3(37.6, 0.7, 6.6),
      fpv: 1.9, shotC: 6.0, dur: 9.4, looks: [[0, V3(38.5, 1.3, 3.2)], [2.9, V3(41.5, 1.0, 10.8)], [3.8, V3(40.0, 0.8, 6.4)]], laraShots: [5.05, 5.25, 5.45], nicShot: 5.4 }
    const IOF_LN = [[0.3, 'Lara: Escuro demais. Fiquem atrás de mim.', 2.4], [4.5, 'Lara: Contato!', 1.2], [6.15, 'Lara: Desfeito.', 1.0], [6.9, 'Nicolas: Moura, é com você. A armadilha, na poça.', 3.0]]
    INS.tut = { st: 'none', e: null }; INS.officeDone = false
    const _olp = V3(), _olm = V3(), _old = V3()
    function insPut(x, z, yaw) { P.pos.set(x, 0, z); P.vel.set(0, 0, 0); P.mv.set(0, 0, 0); C.piv.copy(P.pos); C.py = 0; P.yaw = C.yaw = yaw }
    function insOfficeStart() {
      INS.officeDone = true
      if (INS.mates.length < 2 || INS.cine) return
      const L = INS.mates[0], N = INS.mates[1]
      for (const m of INS.mates) { m.mode = 'script'; m.aim = 0; m.spd = 0; m.cs = 0; m.rig.root.visible = true; m.yaw = Math.PI / 2 }
      insPut(IOF.P0.x, IOF.P0.z, Math.PI / 2); C.pitch = -0.05
      INS.cine = { kind: 'office', t: 0, dur: IOF.dur, o: HPOOL[HPOOL.length - 1], Pl: null, said: 0, look: IOF.lookA.clone(), lampT: V3(), lamp: false, risen: false, burst: false, door: false, shots: 0, nic: false, sh: 0, cam: { p: V3(), l: V3(), rel: false } }
      hud.classList.add('cine'); promptEl.textContent = ''; IN.fire = IN.aim = false; INS.roomT = 0
      chaseMate(L, IOF.LP, 0, 40, 7); chaseMate(N, IOF.NP, 0, 40, 7)
    }
    function insOfficeShoot(m, tgt, shot) { // o tiro de cena: a mesma brasa (pistola) e o mesmo sal (escopeta) do jogador, sem dano
      const g = m.rig.gun, u = g.userData.muzzle || { x: 0, y: 0, z: 0.3 }; g.updateWorldMatrix(true, false); g.localToWorld(_olm.set(u.x, u.y, u.z))
      _old.copy(tgt).sub(_olm); const d = _old.length() || 1; _old.multiplyScalar(1 / d)
      if (!shot) { fireBolt(_olm, _old, T.pistola.vel, 0, boltMat, d / T.pistola.vel, 6, 0); ofxBurst(0, _olm, 7, 2.2, 0.35, _old, 0.7, -0.5, 4); flashL.color.copy(FL_EMBER); flashL.intensity = 3; SFX.fps('oPistol') }
      else { for (let i = 0; i < 5; i++) fireBolt(_olm, _bd.copy(_old).set(_old.x + (R() - 0.5) * 0.09, _old.y + (R() - 0.5) * 0.09, _old.z + (R() - 0.5) * 0.09).normalize(), T.escopeta.vel, 0, pelMat, d / T.escopeta.vel, 4, 1); ofxBurst(1, _olm, 30, 9, 0.3, _old, 0.45, 1.5, 6); flashL.color.copy(FL_SALT); flashL.intensity = 4.5; SFX.fps('oShotgun') }
      flashL.position.copy(_olm); spark(tgt, shot ? '#f4ead6' : '#ffb050', 0.14); ofxBurst(2, tgt, 8, 2, 0.5, null, 1, -1, 3)
    }
    function insOfficeTick(c, dt, tt) {
      const t = c.t, L = INS.mates[0], N = INS.mates[1], o = c.o, E0 = IOF.E0
      while (c.said < IOF_LN.length && t > IOF_LN[c.said][0]) { say(IOF_LN[c.said][1], IOF_LN[c.said][2]); c.said++ }
      if (!c.door && t > 0.6) { c.door = true; insOpen(INS.doors.find((d) => d.id === 'escrit')) }
      if (!c.lamp && t > 1.1) { c.lamp = true; SFX.fps('lantern') }
      // --- os dois entram devagar; a Lara na frente
      if (t > 1.2 && L.cs < IOF.LP.len - 0.02) { L.spd = damp(L.spd, 1.3, 4, dt); L.cs = Math.min(IOF.LP.len, L.cs + L.spd * dt) } else L.spd = damp(L.spd, 0, 6, dt)
      if (t > 1.6 && N.cs < IOF.NP.len - 0.02) { N.spd = damp(N.spd, 1.3, 4, dt); N.cs = Math.min(IOF.NP.len, N.cs + N.spd * dt) } else N.spd = damp(N.spd, 0, 6, dt)
      L.aim = damp(L.aim, t > 4.45 && t < 6.3 ? 1 : 0, 7, dt); N.aim = damp(N.aim, t > 4.7 && t < 6.5 ? 1 : 0, 6, dt)
      const fpv = t >= IOF.fpv && t < IOF.shotC
      L.rig.head.visible = !fpv
      // --- o Espectral: sobe atrás da mesa no feixe, grita e avança por cima dela
      if (!c.risen && t > 4.2) {
        c.risen = true; o.ctl.arena = null; o.reset(); o.group.position.y = 0; o.group.visible = true
        o.place(V3(E0.x, -0.75, E0.z), -Math.PI / 2); o.group.updateMatrixWorld(true)
        c.Pl = { path: true, tgt: V3(E0.x, -0.75, E0.z), yaw: -Math.PI / 2, pitch: 0, jaw: 0.3, glow: 0.4, ux: -0.85, uz: 0.35, fx: -0.7, curl: 0.5, shrink: 1 }; o.ctl.pull = c.Pl
        ofxBurst(2, _qv.set(E0.x, 0.15, E0.z), 26, 2, 0.9, UPV, 0.9, -0.8, 2.5); SFX.esp('hiss')
      }
      if (c.risen && !c.burst) {
        const Pl = c.Pl, lx = L.rig.root.position.x, lz = L.rig.root.position.z
        Pl.yaw = Math.atan2(lx - o.S.pos.x, lz - o.S.pos.z)
        if (t < 4.85) { const u = sm(cl((t - 4.2) / 0.6)); Pl.tgt.set(E0.x, -0.75 + 2.05 * u, E0.z); Pl.jaw = 0.3; Pl.glow = 0.4; Pl.pitch = 0.1; Pl.ux = -0.85; Pl.uz = 0.35; Pl.fx = -0.7; Pl.curl = 0.5 }
        else if (t < 5.15) { Pl.tgt.set(E0.x + 0.2, E0.y + 0.25, E0.z); Pl.jaw = 1.2; Pl.glow = 1; Pl.pitch = -0.45; Pl.ux = -2.3; Pl.uz = 0.95; Pl.fx = -0.35; Pl.curl = 0.05; if (!c.shriek) { c.shriek = true; SFX.esp('shriek') } }
        else { const u = sm(cl((t - 5.15) / 0.4)); Pl.tgt.copy(E0).lerp(IOF.hit, u); Pl.jaw = 1.35; Pl.glow = 1; Pl.pitch = 0.2; Pl.ux = -1.55; Pl.uz = 0.22; Pl.fx = -0.15; Pl.curl = 0.05; if (!c.whip) { c.whip = true; SFX.esp('whip') } }
        o.update(tt, dt)
        while (c.shots < IOF.laraShots.length && t > IOF.laraShots[c.shots]) { insOfficeShoot(L, _qv.copy(o.S.pos), false); c.shots++ }
        if (!c.nic && t > IOF.nicShot) { c.nic = true; insOfficeShoot(N, _qv.copy(o.S.pos), true); c.sh = 0.35 }
      }
      // --- desfeito: a poça do tutorial (sem tempo)
      if (c.risen && !c.burst && t > 5.6) {
        c.burst = true; const p = o.S.pos
        const e = { kind: 'esp', ins: true, tut: true, down: true, noTimer: true, downT: 1e9, o, hp: 0, max: BT.esp.vida, dead: false, atk: false, en: { y: 0 }, cen: V3(p.x, 0, p.z), wave: -1, riseT: 0 }
        o.ctl.pull = null; o.ctl.arena = insAR(e); o.burst(); insPudMake(e, p.x, p.z)
        INS.tut = { st: 'wait', e, t: 0, miss: 0, said: false }
      }
      // --- para onde cada um olha
      const lx = L.rig.root.position.x, lz = L.rig.root.position.z
      if (t < IOF.fpv) _chA.set(lx + 6, 0.7, lz)
      else if (t < IOF.shotC) {
        let k = IOF.looks[0][1]; for (const q of IOF.looks) if (t >= q[0]) k = q[1]
        if (c.risen && !c.burst) _chA.copy(o.S.pos).setY(cl(o.S.pos.y, 0.9, 1.5)); else if (c.burst) _chA.set(IOF.hit.x, 0.15, IOF.hit.z); else _chA.copy(k)
      } else _chA.set(IOF.hit.x, 0.05, IOF.hit.z)
      c.look.lerp(_chA, 1 - Math.exp(-(c.risen && !c.burst ? 7 : 2.6) * dt)); c.lampT.copy(t < IOF.fpv ? _chA : c.look)
      const ly = Math.atan2(c.look.x - lx, c.look.z - lz)
      if (L.spd < 0.4 || fpv) L.yaw = dAng(0, L.yaw + cl(dAng(L.yaw, ly), -6 * dt, 6 * dt))
      chaseMate(L, IOF.LP, dt, c.look.x, c.look.z); if (fpv) { L.yaw = dAng(0, L.yaw + cl(dAng(L.yaw, ly), -6 * dt, 6 * dt)); L.rig.root.rotation.y = L.yaw }
      const nf = t > IOF.shotC ? V3(33, 0, 7) : c.risen ? o.S.pos : V3(40, 0, 6.5)
      chaseMate(N, IOF.NP, dt, nf.x, nf.z)
      L.lookX = c.look.x; L.lookZ = c.look.z; N.lookX = nf.x; N.lookZ = nf.z
      // --- a câmera: o corredor; os olhos da Lara; dentro do escritório
      c.sh = Math.max(0, c.sh - dt * 2.4)
      if (t < IOF.fpv) { _chP.copy(IOF.camA).lerp(IOF.camA2, sm(cl(t / IOF.fpv))); c.cam.l.copy(IOF.lookA) }
      else if (fpv) { L.rig.head.getWorldPosition(_chP); _chP.y += 0.05; _chP.x += Math.sin(L.yaw) * 0.1; _chP.z += Math.cos(L.yaw) * 0.1; c.cam.l.copy(c.look) }
      else { _chP.copy(IOF.camC).lerp(IOF.camC2, sm(cl((t - IOF.shotC) / 3))); c.cam.l.copy(IOF.lookC) }
      if (c.sh > 0) { _chP.x += (R() - 0.5) * c.sh * 0.1; _chP.y += (R() - 0.5) * c.sh * 0.1 }
      c.cam.p.copy(_chP); D.camOv = c.cam
    }
    function insOfficeLamp(c) { // a lanterna da Lara: a luz com sombra (a da arma do jogador, emprestada durante a cena) e o feixe no ar
      const L = INS.mates[0]; if (!L || !L.rig.lamp) return
      L.rig.lamp.getWorldPosition(_olp)
      spot.visible = true; spot.position.copy(_olp); spot.target.position.copy(c.lampT); spot.intensity = 7
      torchCone.visible = true; torchCone.position.copy(_olp); torchCone.lookAt(c.lampT); torchMat.opacity = 0.11
    }
    function insOfficeFinish(c, quiet) {
      const L = INS.mates[0], N = INS.mates[1], o = c.o
      if (!c.burst) { // pulou antes do tiro: a poça já no chão
        if (c.risen) { o.ctl.pull = null; o.group.visible = false; o.lightOff(); o.reset() }
        if (!quiet) { const e = { kind: 'esp', ins: true, tut: true, down: true, noTimer: true, downT: 1e9, o: null, hp: 0, max: BT.esp.vida, dead: false, en: { y: 0 }, cen: IOF.hit.clone(), wave: -1, riseT: 0 }; insPudMake(e, IOF.hit.x, IOF.hit.z); INS.tut = { st: 'wait', e, t: 0, miss: 0, said: false } }
      }
      insOpen(INS.doors.find((d) => d.id === 'escrit'))
      L.aim = N.aim = 0; L.rig.head.visible = true
      for (const [m, pl] of [[L, IOF.LP], [N, IOF.NP]]) { // pulou a cena: eles andam até o lugar (não pulam)
        m.cs = pl.len; plAt(pl, pl.len, 0, _mp); m.mode = 'goto'; m.gx = _mp.x; m.gz = _mp.z; m.after = 'script'; m.gSpd = 1.6; m.gYaw = Math.atan2(IOF.hit.x - _mp.x, IOF.hit.z - _mp.z); m.lookX = IOF.hit.x; m.lookZ = IOF.hit.z
      }
      if (quiet) return
      insPut(IOF.PEND.x, IOF.PEND.z, Math.atan2(IOF.hit.x - IOF.PEND.x, IOF.hit.z - IOF.PEND.z)); C.pitch = -0.28
      if (D.bot) D.bot.wp = undefined
    }
    function matesFollow() { // de volta à rota, cada um de onde está (a diferença para o caminho some aos poucos)
      for (const m of INS.mates) {
        m.mode = 'follow'; m.rig.root.visible = true; m.rig.head.visible = true; m.spd = 0; m.waitT = 0; m.aim = 0; m.lookX = m.lookZ = undefined
        const x = m.rig.root.position.x, z = m.rig.root.position.z; m.s = mpProj(x, z); m.lat = 0; m.ox = m.oz = 0
      }
      if (INS.mates[1].s > INS.mates[0].s - 1.2) INS.mates[1].s = Math.max(0, INS.mates[0].s - 1.2)
      for (const m of INS.mates) { mpAt(m.s, 0, _mp); m.mode = 'goto'; m.gx = _mp.x; m.gz = _mp.z; m.gs = m.s; m.after = 'follow'; m.gSpd = 1.6; m.gYaw = undefined } // anda até o caminho
    }
    function insTutClear() { const T2 = INS.tut; if (T2.e) { if (T2.e.o) foeRelease(T2.e); insPudClear(T2.e) } INS.tut = { st: 'none', e: null }; insHint('') }
    function insTutTick(t, dt) {
      if (!INS.officeDone && !INS.cine && D.mode === 'fight' && P.dead < 0 && INS.room === 'corr1' && P.pos.x > 29.6) { insOfficeStart(); return }
      const T2 = INS.tut
      if (T2.st === 'wait') {
        const e = T2.e
        if (e.o) { if (e.o.group.visible) e.o.update(t, dt); else foeRelease(e) } // a explosão termina; o modelo volta para o monte
        insDownStep(e, t, dt)
        if (e.dead) { T2.st = 'done'; T2.t = 0; insHint(''); return }
        if (INS.cine) return
        let h = ''
        if (TRAP.state === 'hand') h = P.w !== 'armadilha' ? '<kbd>3</kbd>pegue a armadilha' : '<kbd>botão direito</kbd>mire na poça <kbd>botão esquerdo</kbd>jogue'
        if (TRAP.state === 'stuck') { T2.miss += dt; if (T2.miss > 0.5) h = 'Caiu longe da poça · <kbd>clique</kbd>chame de volta' } else T2.miss = 0
        insHint(h)
      } else if (T2.st === 'done') {
        T2.t += dt
        if (T2.t > 1.7 && !T2.said) { T2.said = true; say('Lara: Boa. Esse agora é da C.R.O.S.', 2.8) }
        if (T2.t > 2.6) { T2.st = 'over'; matesFollow() }
      }
    }
    // o aviso de controle, embaixo da tela (some quando você faz a ação)
    css.textContent += `
.dh-hint { position: absolute; left: 50%; bottom: calc(112px + env(safe-area-inset-bottom, 0px)); transform: translateX(-50%); display: flex; align-items: center; gap: 6px; padding: 9px 18px; background: rgba(7,8,10,0.82); border: 1px solid var(--line); font-size: 17px; letter-spacing: 0.03em; white-space: nowrap; opacity: 0; transition: opacity 0.25s; pointer-events: none; max-width: calc(100% - 32px); }
.dh-hint kbd { display: inline-grid; place-items: center; min-width: 32px; height: 32px; padding: 0 9px; margin: 0 8px 0 4px; border: 1px solid rgba(255,255,255,0.55); border-bottom-width: 3px; border-radius: 5px; font: 600 14px/1 var(--mono, monospace); letter-spacing: 0.06em; text-transform: uppercase; color: #f2eee4; background: rgba(255,255,255,0.06); }
`
    const hintEl = document.createElement('div'); hintEl.className = 'dh-hint'; hud.append(hintEl)
    function insHint(html) { if (hintEl.dataset.h !== html) { hintEl.dataset.h = html; if (html) hintEl.innerHTML = html } hintEl.style.opacity = html ? 1 : 0 }

    // ---------- a usina: o Glutão (1,6 vez maior) com a Lara e o Nicolas encolhidos dentro da barriga ----------
    // Você entra, ele sobe do chão (uma cena curta; Espaço pula) e o ectoplasma fecha a porta. Ele anda na faixa do meio, entre os geradores
    // (eles são a sua cobertura): de perto, a pancada; de longe, a investida; a cada tanto, cospe um Espectral; com pouca vida, devora um para se curar
    // (capturar os pequenos impede a cura). Zerado, ele se desfaz numa poça grande por 4 s: a armadilha nela captura, e os dois caem no chão.
    // Se o tempo acabar, ele volta com metade da vida. Depois: a cena do rádio, o escuro e o relatório.
    const IBOSS = { area: [22.5, 55.5, 39.5, 75.5], rise: V3(31, 0, 68), sc: 1.6, hp: 400, cura: 0.1, devCd: 20, longe: 7.5, perto: 4.4, anda: 2.0, spit0: 10, spit: 14, wake: 55.2 }
    INS.boss = { st: 'sleep', e: null, foes: [], seen: false, t: 0, spot: V3() }
    // onde o Glutão pode estar: a usina toda, menos os geradores (com folga, ele é largo) e a base do núcleo
    const IGENS = [[15, 57], [41, 57], [15, 72], [41, 72]].map(([x, z]) => [x - 1.3, z - 1.3, x + 7.3, z + 6.3])
    const bossIn = (x, z) => x >= 12.3 && x <= 49.7 && z >= 54.6 && z <= 81.4 && !IGENS.some((g) => x > g[0] && x < g[2] && z > g[1] && z < g[3]) && Math.hypot(x - 31, z - 80) > 4.6
    function bossClamp(v) {
      v.x = cl(v.x, 12.3, 49.7); v.z = cl(v.z, 54.6, 81.4)
      for (const g of IGENS) if (v.x > g[0] && v.x < g[2] && v.z > g[1] && v.z < g[3]) { const a = [v.x - g[0], g[2] - v.x, v.z - g[1], g[3] - v.z], m = Math.min(...a), i = a.indexOf(m); if (i === 0) v.x = g[0]; else if (i === 1) v.x = g[2]; else if (i === 2) v.z = g[1]; else v.z = g[3] }
      const cx = v.x - 31, cz = v.z - 80, cd = Math.hypot(cx, cz) || 1; if (cd < 4.6) { v.x = 31 + cx / cd * 4.6; v.z = 80 + cz / cd * 4.6 }
      return v
    }
    const _bsv = V3()
    function insCapPool() { // tudo o que pode estar desfeito numa poça agora (para a armadilha e o robô)
      let a = INS.enc.foes
      if (INS.tut.st === 'wait' && INS.tut.e) a = a.concat(INS.tut.e)
      if (INS.boss.foes.length) a = a.concat(INS.boss.foes)
      if (INS.boss.e && INS.boss.e.down) a = a.concat(INS.boss.e)
      return a
    }
    // o ícone da armadilha em cima de cada poça (diz o que fazer com ela e quanto tempo falta)
    css.textContent += `
.dh-pud { position: absolute; left: 0; top: 0; z-index: 2; display: flex; flex-direction: column; align-items: center; gap: 4px; pointer-events: none; opacity: 0; transition: opacity 0.2s; transform-origin: 0 0; }
.dh-pud i { width: 48px; height: 48px; margin-left: -24px; margin-top: -24px; border-radius: 50%; display: grid; place-items: center; background: rgba(20,14,4,0.6); box-shadow: 0 0 0 2px rgba(255,210,122,0.95), 0 0 16px rgba(255,210,122,0.5); color: #ffe2a8; }
.dh-pud i svg { width: 30px; height: 30px; } .dh-pud i { --cut: rgba(20,14,4,0.95); }
.dh-pud b { margin-left: -24px; width: 48px; display: flex; justify-content: center; font: 600 13px/1.2 var(--mono, monospace); letter-spacing: 0.06em; text-transform: uppercase; white-space: nowrap; color: #ffe2a8; text-shadow: 0 1px 2px #000, 0 0 6px #000; }
`
    const pudEls = []
    function insPudIcons() {
      const list = D.mode === 'fight' && D.playing && !INS.cine ? insCapPool().filter((e) => e.down && e.pud && !e.pud.pull) : []
      while (pudEls.length < list.length) { const d2 = document.createElement('div'); d2.className = 'dh-pud'; d2.innerHTML = `<i>${wIcon('armadilha')}</i><b></b>`; hud.append(d2); pudEls.push(d2) }
      const r = list.length ? hud.getBoundingClientRect() : null
      pudEls.forEach((d2, i) => {
        const e = list[i]; let show = false
        if (e) {
          const R0 = e.pud.R || 0.75; _ep.set(e.pud.x, 0.7 + R0 * 0.5, e.pud.z).project(camera)
          if (_ep.z < 1 && Math.abs(_ep.x) < 1.15 && Math.abs(_ep.y) < 1.15) {
            show = true; d2.style.transform = `translate(${((_ep.x + 1) / 2 * r.width).toFixed(1)}px, ${((1 - _ep.y) / 2 * r.height).toFixed(1)}px)`
            const txt = (P.w === 'armadilha' ? 'jogue aqui' : '3 · armadilha') + (e.noTimer ? '' : ' · ' + Math.max(0, Math.ceil(e.downT)) + ' s'); if (d2.dataset.t !== txt) { d2.dataset.t = txt; d2.querySelector('b').textContent = txt }
            d2.querySelector('i').style.boxShadow = !e.noTimer && e.downT < 3 && Math.sin(D.t * 14) > 0 ? '0 0 0 2px #ff7a5a, 0 0 18px rgba(255,90,60,0.7)' : ''
          }
        }
        d2.style.opacity = show ? 1 : 0
      })
    }
    function insBossAR(e) {
      const A4 = IBOSS.area
      return { owner: e, center: e.cen, target: INS.tgt, lunge: BT.esp.bote, hold: true, clamp: bossClamp, may: () => false, bite: () => {}, done: () => {},
        slam: (p) => { const d = Math.hypot(P.pos.x - p.x, P.pos.z - p.z); C.shake = Math.max(C.shake, Math.max(0.2, 0.9 - d * 0.08)); if (d < 3.0) blog('pancada', d, hurtPlayer(BT.glu.pancada, 'pancada', p)) },
        charging: (S) => { if (S.chHit) return; const d = Math.hypot(P.pos.x - S.pos.x, P.pos.z - S.pos.z); if (d < 2.1) { S.chHit = true; blog('arranque', d, hurtPlayer(BT.glu.investida, 'investida', S.pos)) } },
        reach: (S) => { const r = Math.min(7, Math.max(2, Math.hypot(INS.tgt.x - S.pos.x, INS.tgt.z - S.pos.z) - 0.8)); let k = 0; while (k + 0.25 <= r && bossIn(S.from.x + S.dir.x * (k + 0.25), S.from.z + S.dir.z * (k + 0.25))) k += 0.25; return Math.max(0.3, k) } } // a investida para antes de um gerador
    }
    function insBossEspAR(e) { const a = insAR(e); a.clamp = (v) => { v.x = cl(v.x, 12, 50); v.z = cl(v.z, 54, 78.5); return v }; a.may = (S) => INS.boss.st === 'fight' && foeMay(e, S); return a }
    // Lara e Nicolas: dentro do núcleo (encolhidos, girando); depois, deitados no chão, cobertos de ectoplasma
    const gooMat = std({ color: '#3aa883' }); gooMat.emissive = new THREE.Color('#0c3a2c')
    function mateGoo(m) { // as bolhas de ectoplasma em cima do corpo (no espaço do boneco em pé)
      if (m.goo) return m.goo
      const r = rng(m.kind.length * 97 + 3), pos = []
      for (const [x, y, z, s2] of [[0, 1.02, 0.15, 0.13], [0.06, 0.84, 0.16, 0.12], [-0.11, 0.56, 0.12, 0.1], [0.1, 0.28, 0.11, 0.09], [0, 1.47, 0.1, 0.08], [0.27, 0.95, 0.06, 0.08], [-0.25, 0.8, 0.07, 0.07], [0.12, 1.2, 0.13, 0.09]]) blobInto(pos, r, x, y, z, s2 * (1.1 + r() * 0.4), s2 * (0.8 + r() * 0.4), s2 * 0.7)
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.computeVertexNormals()
      const g = new THREE.Mesh(geo, gooMat); g.visible = false; m.rig.root.add(g); litMark(g, () => 'char'); m.goo = g; return g
    }
    function matePose(m, kind) {
      const R2 = m.rig
      if (kind === 'belly') { // encolhido: joelhos no peito, braços em volta, a cabeça baixa
        R2.spine.rotation.set(0.7, 0, 0); R2.chest.rotation.set(0.35, 0, 0); R2.head.rotation.set(0.5, 0, 0.2)
        R2.legs.forEach((l) => { l.th.rotation.set(-1.9, 0, 0); l.kn.rotation.set(2.2, 0, 0); l.ft.rotation.set(0.3, 0, 0) })
        R2.arms.forEach((q) => { q.sh.rotation.set(-1.25, 0, -q.s * 0.3); q.fo.rotation.set(-1.6, 0, 0) })
      } else { // deitado de costas, largado
        R2.spine.rotation.set(0, 0, 0); R2.chest.rotation.set(0, 0, 0); R2.head.rotation.set(0, m.kind === 'lara' ? 0.7 : -0.6, 0)
        R2.legs.forEach((l, i) => { l.th.rotation.set(-0.12 - i * 0.1, 0, 0); l.kn.rotation.set(0.25 + i * 0.2, 0, 0); l.ft.rotation.set(0, 0, 0) })
        R2.arms.forEach((q) => { q.sh.rotation.set(0.15, 0, q.s * 0.35); q.fo.rotation.set(-0.35, 0, 0) })
      }
      R2.chest.scale.setScalar(1); R2.pelvis.position.y = 0.42; if (R2.gun) R2.gun.visible = false
    }
    function mateUnpose(m) { // de volta ao normal (para o começo da Intro)
      const r = m.rig.root; if (r.parent !== INS.g) INS.g.add(r)
      if (m.sc0) r.scale.copy(m.sc0); r.rotation.set(0, 0, 0); r.rotation.order = 'XYZ'; r.position.y = 0
      if (m.goo) m.goo.visible = false
      for (const q of [m.rig.spine, m.rig.chest, m.rig.head]) q.rotation.set(0, 0, 0)
    }
    function matesToBelly() {
      INS.mates.forEach((m) => { const r = m.rig.root; if (!m.sc0) m.sc0 = r.scale.clone(); glutao.coreG.add(r); r.scale.copy(m.sc0).multiplyScalar(0.6); r.rotation.order = 'XYZ'; r.visible = true; m.mode = 'belly'; m.rig.head.visible = true; matePose(m, 'belly'); if (m.goo) m.goo.visible = false })
      glutao.souls.forEach((q) => (q.s.g.visible = false)) // no lugar das almas
    }
    const bellyGl = { p: V3(), r: 2.4, c: new THREE.Color('#bfeeff').convertSRGBToLinear().multiplyScalar(1.6), k: 0 } // a luz de dentro da barriga: os dois aparecem através da membrana
    function matesBellyTick(t) {
      const on = INS.mates.some((m) => m.mode === 'belly') && glutao.group.visible
      if (on && !INS.glows.includes(bellyGl)) INS.glows.push(bellyGl)
      if (!on) { const i = INS.glows.indexOf(bellyGl); if (i >= 0) INS.glows.splice(i, 1) }
      if (on) { INS.mates[0].rig.root.getWorldPosition(bellyGl.p); bellyGl.p.y += 0.25; bellyGl.k = 0.85 + 0.15 * Math.sin(t * 3) }
      INS.mates.forEach((m, i) => { if (m.mode !== 'belly') return; const a = t * 0.5 + i * Math.PI; m.rig.root.position.set(Math.cos(a) * 0.17, -0.4 + Math.sin(t * 0.9 + i) * 0.03, Math.sin(a) * 0.17); m.rig.root.rotation.set(0.4 + Math.sin(t * 0.4 + i) * 0.3, -a + i, 0.2) })
    }
    function matesLying(x, z) {
      INS.mates.forEach((m, i) => {
        const r = m.rig.root; INS.g.add(r); if (m.sc0) r.scale.copy(m.sc0)
        const px = x + (i ? 0.7 : -0.6), pz = z + (i ? 0.35 : -0.15), yaw = i ? 2.4 : -0.5
        r.rotation.order = 'YXZ'; r.rotation.set(-Math.PI / 2, yaw, 0); r.position.set(px, 0.13 * r.scale.y, pz); r.visible = true
        m.mode = 'lying'; matePose(m, 'lying'); mateGoo(m).visible = true
      })
      glutao.souls.forEach((q) => (q.s.g.visible = true))
    }
    function insBossWake() {
      const B2 = INS.boss, o = glutao, h = IBOSS.rise
      const e = { kind: 'glu', ins: true, boss: true, house: true, o, hp: IBOSS.hp, max: IBOSS.hp, dead: false, down: false, atk: false, cen: h.clone(), gCd: 3.2, devCd: 8, devOn: false, wave: -3, riseT: 0 }
      B2.e = e; B2.foes = []; B2.st = 'rise'; B2.t = 0
      espPool.forEach((x) => { x.group.visible = false; x.ctl.pull = null; x.ctl.arena = null }); espPrey.group.visible = false
      o.S.sc = IBOSS.sc; o.ctl.pull = null; o.reset(); o.ctl.arena = insBossAR(e); o.S.souls = 3; o.S.spawned = 0; o.S.spitT = IBOSS.spit0
      o.S.home.set(h.x, 0, h.z); o.S.pos.copy(o.S.home); o.S.yaw = Math.atan2(P.pos.x - h.x, P.pos.z - h.z)
      o.S.ph = 'rise'; o.S.pt = 0; o.S.sink = 1; o.group.position.y = 0; o.group.visible = true; o.group.updateMatrixWorld(true)
      matesToBelly()
      insEctoSeal(INS.ectos.find((q) => q.id === 'usina'))
      SFX.esp('groan'); SFX.esp('swell'); C.shake = Math.max(C.shake, 0.4)
      if (P.pos.z < 56) insPut(cl(P.pos.x, 30, 35), 56.5, Math.atan2(h.x - P.pos.x, h.z - 56.5))
      if (!B2.seen) { // a primeira vez: a cena curta (ele subindo, os dois lá dentro)
        B2.seen = true
        INS.cine = { kind: 'bossIn', t: 0, dur: 4.2, said: 0, cam: { p: V3(), l: V3(), rel: false }, look: V3(h.x, 1.0, h.z) }
        hud.classList.add('cine'); promptEl.textContent = ''; IN.fire = IN.aim = false
      } else { say('Matheus: De novo. Segura, Lara.', 2.6); banner('O GLUTÃO', 'atire no núcleo · desfeito, a armadilha', 2.4) }
    }
    function insBossInTick(c, dt, tt) {
      const t = c.t, S = glutao.S
      if (c.said === 0 && t > 1.1) { c.said = 1; say('Matheus: Lara... Nicolas! Ele engoliu os dois.', 2.8) }
      if (c.said === 1 && t > 2.7) { c.said = 2; banner('O GLUTÃO', 'atire no núcleo · desfeito, a armadilha', 2.6) }
      const dx = S.pos.x - P.pos.x, dz = S.pos.z - P.pos.z, d = Math.hypot(dx, dz) || 1, ux = dx / d, uz = dz / d
      glutao.coreG.getWorldPosition(_bsv)
      if (t < 2.1) { // por cima do ombro: ele sobe do chão, de braços abertos
        const u = sm(cl(t / 2.1)), back = 3.2 - u * 0.6
        c.cam.p.set(P.pos.x - ux * back + uz * 1.1, 1.0 + u * 0.3, P.pos.z - uz * back - ux * 1.1)
        c.look.lerp(_qv.copy(_bsv).setY(Math.max(1.2, _bsv.y)), 1 - Math.exp(-3 * dt))
      } else { // perto da barriga, de baixo: a Lara e o Nicolas encolhidos lá dentro
        const u = sm(cl((t - 2.1) / 2.1)), r = 4.6 - u * 0.5
        c.cam.p.set(_bsv.x - ux * r + uz * 0.4, 1.55, _bsv.z - uz * r - ux * 0.4)
        c.look.copy(_bsv).setY(_bsv.y + 0.1)
      }
      c.cam.l.copy(c.look)
      D.camOv = c.cam
    }
    function insBossInFinish(c, quiet) { if (!quiet && INS.boss.st === 'rise') {} }
    function insBossTick(t, dt) {
      const B2 = INS.boss
      if (B2.st === 'sleep') { if (!INS.cine && D.mode === 'fight' && P.dead < 0 && INS.room === 'usina' && P.pos.z > IBOSS.wake && INS.enc.st === 'clear') insBossWake(); return }
      if (B2.st === 'over') return
      const e = B2.e, o = glutao, S = o.S
      B2.t += dt
      if (B2.st === 'rise' && S.ph !== 'rise') B2.st = 'fight'
      // os que ele cospe entram na briga (dissolvem e são capturados como os outros)
      for (const x of espPool) if (x.group.visible && x.S.burst === 0 && !x.ctl.pull && !x.ctl.arena) {
        const f = { kind: 'esp', ins: true, down: false, o: x, hp: BT.esp.vida, max: BT.esp.vida, dead: false, atk: false, en: { y: 0 }, cen: V3(P.pos.x, 0, P.pos.z), wave: -2, riseT: 0.6, arF: insBossEspAR }
        x.ctl.arena = insBossEspAR(f); x.S.R = 2.4 + R() * 1.0; x.S.ang = Math.atan2(x.S.pos.z - P.pos.z, x.S.pos.x - P.pos.x); x.S.nextAtk = 1.6 + R(); B2.foes.push(f)
      }
      for (const f of B2.foes) if (!f.dead && !f.down && f.o && f.o.ctl.pull) { f.dead = true; f.eaten = true; if (BD.token === f) BD.token = null } // devorado
      if (B2.st === 'fight') insBossBrain(e, dt)
      if (S.ate && e.devOn) { e.devOn = false; e.hp = Math.min(e.max, e.hp + e.max * IBOSS.cura); say('O Glutão devorou um Espectral e se curou: capture os pequenos antes', 3.4); hitMark('shield') }
      if (S.spitT > IBOSS.spit) S.spitT = IBOSS.spit; S.souls = 3; if (S.spawned >= 3) S.spawned = 0 // cospe sempre que puder (no máximo 2 dele soltos)
      // os modelos: o Glutão atualiza os que saíram dele; os outros, um a um
      const live = B2.st !== 'caught' && B2.st !== 'end'
      if (live) o.update(t, dt)
      for (const f of B2.foes) { if (f.o) f.cen.set(P.pos.x, 0, P.pos.z); if (f.o && f.o.group.visible && !(live && espPool.includes(f.o))) f.o.update(t, dt) }
      for (const f of B2.foes) { insDownStep(f, t, dt); if (f.o && (f.dead || f.down) && !f.o.group.visible) foeRelease(f) }
      if (e.down) { insDownStep(e, t, dt); if (e.dead && B2.st === 'down') insBossCaught() }
      matesBellyTick(t)
      // as esferas de acerto (escala do Glutão)
      if (B2.st === 'fight' || B2.st === 'rise' || B2.st === 'down') {
        for (const f of B2.foes) { if (f.riseT > 0) f.riseT -= dt; if (f.dead || f.down || !f.o || !f.o.group.visible || f.riseT > 0 || f.o.ctl.pull) continue; addSph(f.o.head.getWorldPosition(_qv), 0.21, 'ehead', f); for (const [k, r] of [[2, 0.16], [5, 0.13], [8, 0.11]]) addSph(f.o.P[k], r, 'enemy', f) }
        if (!e.down && !e.dead && o.group.visible && !S.exploded) {
          const sc = S.sc; o.coreG.getWorldPosition(_bsv); addSph(_bsv, 0.3 * sc, 'core', e); addSph(_qv.copy(_bsv).setY(_bsv.y + 0.55 * sc), 0.55 * sc, 'enemy', e)
          addSph(o.head.getWorldPosition(_qv), 0.42 * sc, 'enemy', e); o.arms.forEach((a) => addSph(a.upper.getWorldPosition(_qv), 0.3 * sc, 'enemy', e))
          addSph(_qv.set(S.pos.x, Math.max(0.5, 0.95 - S.sink * 0.9) * sc, S.pos.z), 0.55 * sc, 'enemy', e)
        }
      }
      if (B2.st === 'caught') { B2.t2 = (B2.t2 || 0) + dt; if (B2.t2 > 1.8 && !INS.cine && P.dead < 0) insEndStart() }
    }
    function insBossBrain(e, dt) { // anda atrás de você pela faixa do meio; de perto a pancada, de longe a investida; com pouca vida, devora
      const o = e.o, S = o.S, A4 = IBOSS.area
      if (e.dead || e.down || S.ph === 'rise' || P.dead >= 0) return
      e.gCd -= dt; e.devCd -= dt
      const dx = P.pos.x - S.pos.x, dz = P.pos.z - S.pos.z, d = Math.hypot(dx, dz) || 1
      if (S.ph === 'slam' && S.pt < 1.05 && d > 2.4) { S.home.x += dx / d * 1.8 * dt; S.home.z += dz / d * 1.8 * dt }
      if (S.ph !== 'idle') { bossClamp(S.home); return }
      if (d > 3.6) { S.home.x += dx / d * IBOSS.anda * dt; S.home.z += dz / d * IBOSS.anda * dt }
      bossClamp(S.home)
      if (e.hp < e.max * 0.25 && e.devCd <= 0 && espPool.some((x) => x.group.visible && x.S.burst === 0 && !x.ctl.pull)) { e.devCd = IBOSS.devCd; e.devOn = true; o.trigger('devour'); say('O Glutão vai devorar um Espectral!', 2.2); return }
      if (e.gCd > 0) return
      if (d > IBOSS.longe) { S.chHit = false; o.trigger('charge'); e.gCd = 2.6 }
      else if (d < IBOSS.perto) { o.trigger('slam'); e.gCd = 2.9 }
    }
    function insBossDown(e) { // zerado: ele desaba e vira uma poça grande; 10 s para a armadilha
      const o = e.o, S = o.S, B2 = INS.boss
      if (e.down) return
      e.down = true; e.downT = ICAP.t; e.hp = 0; B2.st = 'down'
      o.trigger('collapse')
      insPudMake(e, S.pos.x, S.pos.z, 1.6)
      say('O Glutão se desfez: a armadilha nele, rápido!', 3.2); C.shake = Math.max(C.shake, 0.4)
    }
    function insBossRevive(e) { // não deu tempo: ele se refaz com metade da vida
      const o = e.o, S = o.S, x = e.pud.x, z = e.pud.z
      insPudClear(e); e.down = false; e.hp = e.max / 2; e.gCd = 2.5; INS.boss.st = 'rise'
      o.reset(); o.ctl.arena = insBossAR(e); o.S.spitT = IBOSS.spit; S.home.set(x, 0, z); S.pos.copy(S.home); S.ph = 'rise'; S.pt = 0; S.sink = 1; o.group.visible = true
      glutao.souls.forEach((q) => (q.s.g.visible = false))
      SFX.esp('groan'); SFX.esp('swell'); say('O Glutão se refez com metade da vida', 2.6)
    }
    function insBossCaught() { // capturado: os pequenos estouram de vez; os dois caem no chão
      const B2 = INS.boss, e = B2.e
      B2.st = 'caught'; B2.t2 = 0; BD.token = null
      for (const f of B2.foes) { if (!f.dead && !f.down && f.o && f.o.group.visible) f.o.burst(); f.dead = true; f.down = false; insPudClear(f) }
      const o = glutao; o.group.visible = false; o.lightOff()
      B2.spot.set(o.S.pos.x, 0, o.S.pos.z); bossClamp(B2.spot)
      matesLying(B2.spot.x, B2.spot.z)
      const g = new THREE.Mesh(new THREE.CircleGeometry(1.5, 24), pudMat); g.rotation.x = -Math.PI / 2; g.position.set(B2.spot.x, 0.015, B2.spot.z); g.renderOrder = 2; INS.g.add(g); B2.goo = g
      SFX.esp('gulp'); ofxBurst(2, _qv.set(B2.spot.x, 0.6, B2.spot.z), 50, 3, 1.1, UPV, 1, -2, 2.5)
    }
    function insBossReset(full) {
      const B2 = INS.boss
      for (const f of B2.foes) { foeRelease(f); insPudClear(f) } B2.foes = []
      if (B2.e) { insPudClear(B2.e); B2.e = null }
      const o = glutao; o.ctl.arena = null; o.ctl.pull = null; o.group.visible = false; o.lightOff(); o.S.sc = 1; o.reset(); o.S.home.set(0, 0, -0.15); o.S.pos.copy(o.S.home); o.S.yaw = 0; o.S.sink = 0
      espPool.forEach((x) => { x.group.visible = false; x.ctl.pull = null; x.ctl.arena = null })
      glutao.souls.forEach((q) => (q.s.g.visible = true))
      for (const m of INS.mates) { if (m.mode === 'belly' || m.mode === 'lying') { mateUnpose(m); m.mode = 'gone'; m.rig.root.visible = false } }
      { const i = INS.glows.indexOf(bellyGl); if (i >= 0) INS.glows.splice(i, 1) }
      if (B2.goo) { INS.g.remove(B2.goo); B2.goo.geometry.dispose(); B2.goo = null }
      const E2 = INS.ectos.find((q) => q.id === 'usina'); if (E2) insEctoClear(E2)
      B2.st = 'sleep'; B2.t = 0; B2.t2 = 0; if (full) B2.seen = false
    }
    // a cena final: os dois no chão; o Matheus chega perto e chama a equipe médica pelo rádio; escurece; o relatório
    const IEND_LN = [[6.4, 'Matheus: Área limpa. Preciso de uma equipe médica na usina.', 3.2], [9.7, 'Central: ...Entendido, Moura. Equipe médica a caminho.', 2.8]]
    function insEndStart() {
      const B2 = INS.boss, sp = B2.spot
      let dx = P.pos.x - sp.x, dz = P.pos.z - sp.z, d = Math.hypot(dx, dz); if (d < 0.5) { dx = 0; dz = -1; d = 1 }
      B2.st = 'end'
      INS.cine = { kind: 'end', t: 0, dur: 12, said: 0, drive: false, ux: dx / d, uz: dz / d, from: V3(), to: V3(), cam: { p: V3(), l: V3(), rel: false }, a0: Math.atan2(dx, dz) + 1.2 }
      hud.classList.add('cine'); promptEl.textContent = ''; IN.fire = IN.aim = false; insHint('')
      W.pistola.visible = W.escopeta.visible = W.armadilha.visible = false // a arma guardada: ele vem socorrer
    }
    function insEndTick(c, dt, tt) {
      const t = c.t, sp = INS.boss.spot
      while (c.said < IEND_LN.length && t > IEND_LN[c.said][0]) { say(IEND_LN[c.said][1], IEND_LN[c.said][2]); SFX.fps('slot'); c.said++ }
      if (t < 3.8) { // os dois no chão, cobertos de ectoplasma: a câmera baixa, girando devagar
        const a = c.a0 + t * 0.07
        c.cam.p.set(sp.x + Math.sin(a) * 3.0, 0.75, sp.z + Math.cos(a) * 3.0); c.cam.l.set(sp.x, 0.2, sp.z)
      } else { // o Matheus chega e para do lado deles
        if (!c.drive) { // de onde ele vem: do lado em que você estava, sem sair da faixa do meio (os geradores)
          c.drive = true; c.from.set(sp.x + c.ux * 4.8, 0, sp.z + c.uz * 4.8); bossClamp(c.from); const fd = Math.hypot(c.from.x - sp.x, c.from.z - sp.z) || 1; c.ux = (c.from.x - sp.x) / fd; c.uz = (c.from.z - sp.z) / fd
          c.to.set(sp.x + c.ux * 1.5, 0, sp.z + c.uz * 1.5); insPut(c.from.x, c.from.z, Math.atan2(-c.ux, -c.uz)) }
        const left = Math.hypot(c.to.x - P.pos.x, c.to.z - P.pos.z), step = Math.min(left, 1.35 * dt)
        if (left > 0.02) { P.pos.x -= c.ux * step; P.pos.z -= c.uz * step; P.mv.set(-c.ux * 1.35, 0, -c.uz * 1.35) } else P.mv.set(0, 0, 0)
        P.yaw = C.yaw = Math.atan2(-c.ux, -c.uz); C.piv.copy(P.pos)
        const mx = (sp.x + c.to.x) / 2, mz = (sp.z + c.to.z) / 2, side = t < 8.4 ? 4.4 : 3.6
        c.cam.p.set(mx + c.uz * side, 1.35 + (t > 8.4 ? 0.25 : 0), mz - c.ux * side); c.cam.l.set(mx, 0.75, mz)
      }
      fadeEl.style.opacity = t > 10.6 ? cl((t - 10.6) / 1.2).toFixed(3) : 0
      D.camOv = c.cam
    }
    function insEndFinish(c, quiet) {
      P.mv.set(0, 0, 0)
      if (quiet) { fadeEl.style.opacity = 0; showWeapon(); return }
      INS.boss.st = 'over'; fadeEl.style.opacity = 1
      D.mode = 'won'; D.endT = 0; D.endShown = false; IN.fire = false; IN.aim = false; P.stats.t = D.t; hudTela()
    }
    // o escuro do fim (fica acima das barras pretas e abaixo do relatório)
    css.textContent += `
#demoHud .dh-cine { z-index: 1; } #demoHud .dh-over { z-index: 2; }
#demoHud .dh-cine .dh-fade { position: absolute; inset: 0; background: #000; opacity: 0; pointer-events: none; }
`
    const fadeEl = document.createElement('div'); fadeEl.className = 'dh-fade' // entra nas barras pretas logo depois que elas existem (mais abaixo)

    // ---------- os avisos de controle: cada um aparece uma vez, no lugar em que você precisa dele, e some quando você faz a ação ----------
    // (se você já fez a ação antes, ele não aparece; um aviso por vez; o da armadilha do escritório tem a vez dele)
    const IH = { on: '', t: 0, done: {}, moved: 0, looked: 0, lastYaw: 0, run: 0, capN: 0, shown: {} }
    const IHINTS = [
      { id: 'move', html: '<kbd>W A S D</kbd>andar <kbd>mouse</kbd>olhar', when: () => INS.room === 'eclusa' && D.t > 3.6, done: () => IH.moved > 1.2 && IH.looked > 0.6 },
      { id: 'run', html: '<kbd>Shift</kbd>correr', when: () => INS.room === 'corr1' && IH.c1 > 2.5, done: () => IH.run > 0.6 }, // o corredor é comprido: depois de uns passos, o Shift
      { id: 'aim', html: '<kbd>botão direito</kbd>mirar <kbd>botão esquerdo</kbd>atirar', when: () => INS.enc.st === 'awake' && INS.enc.foes.some((e) => !e.dead && !e.down && e.riseT <= 0), done: () => P.stats.hits > 0 },
      { id: 'cap', html: '<kbd>3</kbd>a armadilha na poça antes que o anel feche', when: () => INS.enc.foes.concat(INS.boss.foes).some((e) => e.down && e.pud && !e.pud.pull), done: () => IH.capN > 0 },
      { id: 'dodge', html: '<kbd>Espaço</kbd>esquivar do bote', when: () => INS.enc.st === 'awake' && INS.enc.wave >= 1 && BD.token && BD.token.o && BD.token.o.S.ph === 'wind', done: () => P.stats.dodges > 0, hold: 1.6 },
      { id: 'swap', html: '<kbd>2</kbd>ou<kbd>Q</kbd>troque para a escopeta: a pistola vai travar', when: () => (INS.enc.st === 'awake' || INS.boss.st === 'fight') && P.w === 'pistola' && GUN.heat >= 70, done: () => IH.sg, say: 'Nicolas (rádio): Moura, a pistola vai travar. Troca pra escopeta!' },
      { id: 'wheel', html: '<kbd>Tab</kbd>segure: a roda das armas (ou gire a rodinha)', when: () => IH.done.swap && INS.enc.st === 'awake' && INS.enc.wave >= 2, done: () => IH.wh, hold: 5, soft: true },
      { id: 'kit', html: '<kbd>F</kbd>use um kit para se curar', when: () => (INS.room === 'enfermaria' || INS.room === 'corr3') && P.kits > 0 && INS.kitsGot, done: () => P.stats.kits > 0, hold: 6, soft: true },
    ]
    function insHintsTick(dt) {
      if (D.mode !== 'fight' || !D.playing || INS.cine || P.dead >= 0) { if (INS.tut.st !== 'wait') insHint(''); return }
      // o que você já fez (andou, olhou, correu, capturou)
      if (P.speed > 0.6) IH.moved += dt; IH.looked += Math.min(0.5, Math.abs(dAng(IH.lastYaw, C.yaw))); IH.lastYaw = C.yaw
      if (P.runW > 0.6 && P.speed > 2.5) IH.run += dt
      if (INS.room === 'corr1') IH.c1 = (IH.c1 || 0) + dt
      if (P.w === 'escopeta') IH.sg = true; if (WHEEL.on) IH.wh = true
      if (INS.tut.st === 'wait') return // o tutorial da armadilha tem a vez
      let cur = IHINTS.find((h) => h.id === IH.on)
      if (cur) { IH.t += dt; if (cur.done() || (cur.soft && IH.t > cur.hold)) { IH.done[cur.id] = true; IH.on = ''; cur = null } else if (!cur.when() && IH.t > (cur.hold || 0.8)) { IH.on = ''; cur = null } }
      if (!cur) {
        for (const h of IHINTS) {
          if (IH.done[h.id]) continue
          if (h.done() && !h.soft) { IH.done[h.id] = true; continue } // já sabe: não aparece
          if (h.when()) { cur = h; IH.on = h.id; IH.t = 0; if (h.say && !IH.shown[h.id]) say(h.say, 3.2); IH.shown[h.id] = true; break }
        }
      }
      insHint(cur ? cur.html : '')
    }
    function insHintsReset() { IH.on = ''; IH.t = 0; IH.done = {}; IH.moved = 0; IH.looked = 0; IH.run = 0; IH.capN = 0; IH.shown = {}; IH.sg = false; IH.wh = false; IH.c1 = 0; IH.lastYaw = C.yaw }

    // ---------- os kits da enfermaria: dois, em cima da maca; passando perto, você pega ----------
    INS.kitsGot = false; INS.kitG = null
    function insKitsMake() {
      const g = new THREE.Group(); g.position.set(24.2, 0.77, 45.5); INS.g.add(g)
      const white = std({ color: '#d8d4c8' }), red = basic({ color: '#b02a2a' })
      for (const [x, z, ry] of [[-0.02, -0.22, 0.2], [0.06, 0.22, -0.15]]) { const k = new THREE.Group(); k.position.set(x, 0, z); k.rotation.y = ry; g.add(k); put(boxG(0.34, 0.16, 0.24), white, [0, 0.08, 0], k); put(boxG(0.2, 0.012, 0.06), red, [0, 0.167, 0], k, null, false); put(boxG(0.06, 0.012, 0.2), red, [0, 0.167, 0], k, null, false); put(boxG(0.1, 0.03, 0.02), AGM.leather, [0, 0.17, -0.06], k, null, false) }
      g.traverse((o) => { if (o.isMesh) o.userData.noBake = true }); litMark(g, () => 'prop')
      INS.kitG = g; INS.kitGl = { p: V3(24.2, 1.2, 45.5), r: 2.2, c: new THREE.Color('#ffe2b0').convertSRGBToLinear().multiplyScalar(0.7), k: 1, warm: true }; INS.glows.push(INS.kitGl)
    }
    function insKitsTick() {
      if (INS.kitsGot || !INS.kitG || P.dead >= 0) return
      if (Math.hypot(P.pos.x - 24.2, P.pos.z - 45.5) < 1.5) { INS.kitsGot = true; INS.kitG.visible = false; INS.kitGl.k = 0; P.kits += 2; SFX.demo('kit'); say('Dois kits de primeiros socorros (+2)', 2.8) }
    }
    function insKitsReset() { INS.kitsGot = false; if (INS.kitG) { INS.kitG.visible = true; INS.kitGl.k = 1 } }

    // ---------- o robô da Intro (testes): segue o caminho, abre as portas, briga e quebra o ectoplasma ----------
    const IROUTE = [[4.6, 7], [9, 7], [33.1, 7, 'escrit'], [36.2, 9.2], [40, 9.6], [40, 12.1, 'corr2'], [40, 21.1, 'refeit'], [40, 23.6], [33.6, 24.3], [33.6, 37.6], [32.5, 38.6, 'grade'], [32.5, 46.2], [31.0, 47, 'enferm'], [27.2, 47.2], [25.5, 45.8], [27.2, 47.4], [32.5, 47.6], [32.5, 51.1, 'usina'], [32.5, 55], [31, 62]]
    function botIns(dt) {
      const b = D.bot, k = IN.k
      for (const c of ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ShiftLeft', 'Space', 'KeyF', 'KeyE']) k[c] = false
      IN.fire = false; IN.aim = false
      if (!D.playing || P.dead >= 0 || D.mode !== 'fight') return
      b.eT = (b.eT || 0) - dt
      if (b.wp === undefined) { let bi = 0, bd = 1e9; IROUTE.forEach((w, i) => { const d = Math.hypot(w[0] - P.pos.x, w[1] - P.pos.z); if (d < bd) { bd = d; bi = i } }); b.wp = bi; b.door = null }
      if (INS.cine) return
      { // a briga: mira no mais perto, atira, anda de lado, esquiva o bote; depois, o ectoplasma amolecido
        let tgtP = null, al = 0, foe = null, best = 1e9
        for (const e of INS.enc.foes.concat(INS.boss.foes)) { if (e.dead || e.down || !e.o || !e.o.group.visible || e.riseT > 0) continue; const d = Math.hypot(e.o.S.pos.x - P.pos.x, e.o.S.pos.z - P.pos.z); if (d < best) { best = d; foe = e } }
        const bg = INS.boss.e && (INS.boss.st === 'fight') && !INS.boss.e.down ? INS.boss.e : null, GS = bg ? bg.o.S : null
        if (GS) { const gd = Math.hypot(GS.pos.x - P.pos.x, GS.pos.z - P.pos.z); if (((GS.ph === 'slam' && GS.pt > 0.8 && GS.pt < 1.05 && gd < 4.6) || (GS.ph === 'charge' && GS.pt > 0.36 && GS.pt < 0.6 && gd < 7.5)) && !b.gd) { b.gd = true; k.Space = true } if (GS.ph === 'idle') b.gd = false; if (!foe || best > 3.5) { foe = bg; best = gd } }
        const ex = INS.ectos.find((q) => q.st === 'soft' && q.soft > 0.5)
        const pd = insCapPool().find((e) => e.down && e.pud && !e.pud.pull && e.downT > 0.5)
        if (pd && TRAP.state === 'hand') { // a poça: troca para a armadilha, mira no chão e joga
          const pdd = Math.hypot(pd.pud.x - P.pos.x, pd.pud.z - P.pos.z)
          if (pdd > 6) { const yw = Math.atan2(pd.pud.x - P.pos.x, pd.pud.z - P.pos.z); C.yaw = dAng(0, C.yaw + cl(dAng(C.yaw, yw), -6 * dt, 6 * dt)); if (Math.abs(dAng(C.yaw, yw)) < 0.5) k.KeyW = true; return } // longe: chega mais perto
          if (P.w !== 'armadilha') { if (P.swap < 0) wantWeapon('armadilha'); return }
          const cx = pd.pud.x - camera.position.x, cy = 0 - camera.position.y, cz = pd.pud.z - camera.position.z, yaw = Math.atan2(cx, cz), pit = Math.atan2(cy, Math.hypot(cx, cz)), turn = 7 * dt
          C.yaw = dAng(0, C.yaw + cl(dAng(C.yaw, yaw), -turn, turn)); C.pitch = cl(C.pitch + cl(pit - C.pitch, -turn, turn), -0.9, 0.75); IN.aim = true
          if (Math.abs(dAng(C.yaw, yaw)) < 0.08 && Math.abs(pit - C.pitch) < 0.08 && P.swap < 0 && P.throwT < 0 && P.aimW > 0.6) { IN.fire = true; IN.firePress = true }
          return
        }
        if (P.w === 'armadilha' && P.throwT < 0 && P.swap < 0) wantWeapon('pistola')
        if (foe && foe.boss) { tgtP = _qv2.copy(foe.o.coreG.getWorldPosition(_qv3)); al = best } else if (foe) { tgtP = _qv2.copy(foe.o.head.getWorldPosition(_qv3)); al = best }
        else if (ex && INS.enc.st === 'clear') { tgtP = _qv2.copy(ex.c); al = Math.hypot(ex.c.x - P.pos.x, ex.c.z - P.pos.z) }
        if (tgtP) {
          const tk = BD.token
          if (foe && tk && tk.o && tk.o.S.ph === 'wind' && tk.o.S.pt > 0.45 && !b.dodged) { b.dodged = true; k.Space = true }
          if (!tk || !tk.o || tk.o.S.ph === 'circle' || tk.o.S.ph === 'daze') b.dodged = false
          const cx = tgtP.x - camera.position.x, cy = tgtP.y - camera.position.y, cz = tgtP.z - camera.position.z
          const yaw = Math.atan2(cx, cz), pit = Math.atan2(cy, Math.hypot(cx, cz)), turn = 7 * dt
          C.yaw = dAng(0, C.yaw + cl(dAng(C.yaw, yaw), -turn, turn)); C.pitch = cl(C.pitch + cl(pit - C.pitch, -turn, turn), -0.9, 0.75)
          if (Math.abs(dAng(C.yaw, yaw)) < 0.1 && P.swap < 0) { IN.aim = al > 2.5; if (!(P.w === 'pistola' && GUN.heat > 88)) IN.fire = true }
          if (P.w === 'pistola' && GUN.heat > 85 && !SG.hot) wantWeapon('escopeta'); else if (P.w === 'escopeta' && (SG.hot || SG.heat > 65) && !GUN.hot) wantWeapon('pistola')
          let mx = 0, mz = 0; const ax = (tgtP.x - P.pos.x) / (al || 1), az = (tgtP.z - P.pos.z) / (al || 1)
          if (foe) { const keep = foe.boss ? 6.2 : 4; b.sideT = (b.sideT || 0) - dt; if (b.sideT <= 0) { b.side = R() < 0.5 ? -1 : 1; b.sideT = 1.5 + R() * 2 } mx = -az * b.side * 0.8 + ax * cl(al - keep, -1, 1); mz = ax * b.side * 0.8 + az * cl(al - keep, -1, 1) }
          else if (al > 5) { mx = ax; mz = az }
          const fx = Math.sin(C.yaw), fz = Math.cos(C.yaw), ml = Math.hypot(mx, mz)
          if (ml > 0.25) { const f = (mx * fx + mz * fz) / ml, rr = (mx * -fz + mz * fx) / ml; if (f > 0.35) k.KeyW = true; if (f < -0.35) k.KeyS = true; if (rr > 0.35) k.KeyD = true; if (rr < -0.35) k.KeyA = true }
          if (P.hp < 100 && P.kits > 0) k.KeyF = true
          return
        }
      }
      if (b.door) {
        const D2 = INS.doors.find((d) => d.id === b.door), yaw = Math.atan2(D2.cx - P.pos.x, D2.cz - P.pos.z)
        C.yaw = dAng(0, C.yaw + cl(dAng(C.yaw, yaw), -8 * dt, 8 * dt))
        if (Math.abs(dAng(C.yaw, yaw)) < 0.1 && b.eT <= 0) { k.KeyE = true; b.eT = 0.4 }
        if (D2.st === 'open' && D2.k > 0.8) { b.door = null; b.wp++ }
        return
      }
      const w = IROUTE[b.wp]; if (!w) { b.done = true; return }
      const dx = w[0] - P.pos.x, dz = w[1] - P.pos.z, dl = Math.hypot(dx, dz)
      if (dl < 0.45) { if (w[2] && INS.doors.find((d) => d.id === w[2]).st !== 'open') b.door = w[2]; else b.wp++; return }
      const mx = dx / dl, mz = dz / dl, yaw = Math.atan2(mx, mz); C.yaw = dAng(0, C.yaw + cl(dAng(C.yaw, yaw), -6 * dt, 6 * dt)); C.pitch = damp(C.pitch, -0.1, 4, dt)
      const fx = Math.sin(C.yaw), fz = Math.cos(C.yaw), f = mx * fx + mz * fz, rr = mx * -fz + mz * fx
      if (f > 0.35) k.KeyW = true; if (f < -0.35) k.KeyS = true; if (rr > 0.35) k.KeyD = true; if (rr < -0.35) k.KeyA = true
      if (b.run) k.ShiftLeft = true
    }

    // =====================================================================
