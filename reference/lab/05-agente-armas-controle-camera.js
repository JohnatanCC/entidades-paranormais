    // ---------- o agente: técnico de campo, jaqueta azul-marinho comprida, todo o equipamento nas costas ----------
    // esqueleto próprio (quadril, coluna, peito, pescoço curto, cabeça; braços com ombro, cotovelo, pulso; pernas com joelho e pé)
    // =====================================================================
    const AGM = {
      navy: std({ color: '#262d42' }), navy2: std({ color: '#262d42', side: THREE.DoubleSide }), navyD: std({ color: '#1b2030' }), refl: std({ color: '#c9c2a8' }),
      pants: std({ color: '#3a3528' }), boot: std({ color: '#141110' }), skin: std({ color: '#a07c64' }), hair: std({ color: '#2a1c14' }), hair2: std({ color: '#2a1c14', side: THREE.DoubleSide }),
      glove: std({ color: '#1c1814' }), pack: std({ color: '#2e3038' }), packD: std({ color: '#222429' }), amber: basic({ color: '#e8b765' }), cable: std({ color: '#7a4a24' }),
      metal: std({ color: '#55555c' }), tip: basic({ color: '#ffd28a' }), eye: basic({ color: '#120c0a' }), belt: std({ color: '#191512' }),
      glass: basic({ color: '#16222a' }), orbOff: basic({ color: '#36464c' }), orbOn: basic({ color: '#f0a868' }), strap: std({ color: '#3a2416' }),
      leather: std({ color: '#3a2416' }), leatherD: std({ color: '#3a2416', side: THREE.DoubleSide }), brass: std({ color: '#9a7a40' }), relic: std({ color: '#3a2216' }), shell: std({ color: '#7a2a22' }),
    }
    // o traje Selado (concept 15): as runas âmbar costuradas nos punhos, nos braços e na barra; elas acendem com a sobrecarga
    const runeTex = canvasTex(64, 8, (g, w, h) => { g.clearRect(0, 0, w, h); g.fillStyle = '#ffd38a'; const r = rng(4243)
      for (let x = 1; x < w - 3; x += 5) { const k = (r() * 5) | 0; g.fillRect(x, 1, 1, 6); if (k === 0) { g.fillRect(x + 1, 1, 2, 1); g.fillRect(x + 1, 4, 2, 1) } else if (k === 1) { g.fillRect(x + 1, 2, 1, 1); g.fillRect(x + 2, 3, 1, 1); g.fillRect(x + 1, 4, 1, 1) } else if (k === 2) { g.fillRect(x + 2, 1, 1, 6); g.fillRect(x + 1, 3, 1, 1) } else if (k === 3) { g.fillRect(x + 1, 1, 1, 1); g.fillRect(x + 2, 2, 1, 1); g.fillRect(x + 1, 6, 2, 1) } else { g.fillRect(x + 1, 3, 2, 1) } } })
    runeTex.generateMipmaps = false; runeTex.minFilter = THREE.NearestFilter
    AGM.rune = basic({ map: runeTex, alphaTest: 0.5, side: THREE.DoubleSide, color: '#7a5420' })
    const RUNEC = { dim: new THREE.Color('#6a4818').convertSRGBToLinear(), hot: new THREE.Color('#ffe2a8').convertSRGBToLinear().multiplyScalar(1.4), red: new THREE.Color('#ff4a2a').convertSRGBToLinear() }
    AGM.refl = AGM.rune
    const PLASMA = '#7affe0'
    const WM = { body: std({ color: '#4a4e56' }), dark: std({ color: '#22252a' }), stock: std({ color: '#4a2e1a' }), pump: std({ color: '#3a2618' }) }
    const limb = (r0, r1, len, seg = 7) => new THREE.CylinderGeometry(r0, r1, len, seg, 2).translate(0, -len / 2, 0)
    const sph = (r, w = 8, h = 6) => new THREE.SphereGeometry(r, w, h)

    // ---------- as armas no estilo "relíquia ocultista" (concept 13): latão gravado, madeira entalhada, vidro, símbolos que acendem ----------
    const OM = { brass: glossy('#b08a4a', 50, '#6a5434'), brassD: glossy('#7a5a2a', 40, '#3e3018'), brassL: glossy('#d8b070', 60, '#7a6444'), bronze: glossy('#5a4026', 36, '#33261a'),
      wood: std({ color: '#3a2216' }), woodD: std({ color: '#22140c' }), hole: basic({ color: '#070504' }), ecto: basic({ color: '#9cff7a' }), bell: glossy('#b08a4a', 50, '#6a5434', { side: THREE.DoubleSide }), salt: basic({ color: '#f4ead6' }), glassD: std({ color: '#141210' }) }
    // junta as peças paradas de um grupo numa malha por material (cada arma tem ~35 peças: viram ~8 chamadas de desenho)
    function mergeParts(g, keep = []) {
      const by = new Map()
      for (const m of [...g.children]) { if (!m.isMesh || keep.includes(m) || m.children.length) continue; const k = m.material; if (!by.has(k)) by.set(k, []); by.get(k).push(m) }
      const out = new Map()
      by.forEach((list, mat) => {
        if (list.length < 2) { out.set(mat, list[0]); return }
        const pos = [], nrm = [], uv = [], idx = []; let base = 0
        for (const m of list) {
          m.updateMatrix(); const geo = m.geometry.index ? m.geometry : m.geometry, M4 = m.matrix, N3 = new THREE.Matrix3().getNormalMatrix(M4), P = geo.attributes.position, Nn = geo.attributes.normal, U = geo.attributes.uv, v = V3()
          for (let i = 0; i < P.count; i++) { v.fromBufferAttribute(P, i).applyMatrix4(M4); pos.push(v.x, v.y, v.z); v.fromBufferAttribute(Nn, i).applyMatrix3(N3).normalize(); nrm.push(v.x, v.y, v.z); uv.push(U ? U.getX(i) : 0, U ? U.getY(i) : 0) }
          if (geo.index) for (let i = 0; i < geo.index.count; i++) idx.push(geo.index.getX(i) + base); else for (let i = 0; i < P.count; i++) idx.push(i + base)
          base += P.count; g.remove(m)
        }
        const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx)
        const mm = new THREE.Mesh(geo, mat); mm.castShadow = list.some((m) => m.castShadow); mm.receiveShadow = true; g.add(mm); out.set(mat, mm)
      })
      return out
    }
    const RELIC = { on: new THREE.Color('#ffd27a').convertSRGBToLinear(), dim: new THREE.Color('#4a2a0a').convertSRGBToLinear(), hot: new THREE.Color('#fff4d8').convertSRGBToLinear() }
    function trapModel() { // a armadilha: o relicário, uma lanterna de latão e vidro; a íris no topo; correntes enroladas na base
      const g = new THREE.Group()
      put(new THREE.CylinderGeometry(0.05, 0.056, 0.016, 6), OM.brassD, [0, 0.008, 0], g) // a base
      const ring = put(new THREE.CylinderGeometry(0.041, 0.041, 0.074, 6), basic({ color: '#ffd27a' }), [0, 0.053, 0], g, null, false) // o vidro aceso: a luz que mostra o estado
      for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; put(boxG(0.008, 0.082, 0.008), OM.brass, [Math.sin(a) * 0.043, 0.053, Math.cos(a) * 0.043], g, [0, a, 0]) } // as hastes nos cantos
      put(new THREE.CylinderGeometry(0.047, 0.047, 0.01, 6), OM.brassD, [0, 0.093, 0], g) // o aro de cima
      put(new THREE.CylinderGeometry(0.02, 0.047, 0.032, 6), OM.brass, [0, 0.114, 0], g) // a cúpula
      put(new THREE.CylinderGeometry(0.021, 0.021, 0.005, 8), OM.brassL, [0, 0.132, 0], g) // a íris fechada
      ;[0, 1, 2].forEach((i) => put(boxG(0.03, 0.002, 0.004), OM.brassD, [0, 0.135, 0], g, [0, i * Math.PI / 3, 0])) // as lâminas
      put(new THREE.TorusGeometry(0.014, 0.003, 4, 8), OM.brass, [0, 0.152, 0], g) // a alça
      ;[0, 2.1, 4.2].forEach((a) => put(new THREE.TorusGeometry(0.009, 0.0025, 4, 6), OM.brass, [Math.sin(a) * 0.05, 0.004, Math.cos(a) * 0.05], g, [Math.PI / 2, 0, a])) // os elos de corrente
      mergeParts(g, [ring])
      g.userData.ring = ring
      return g
    }

    const A = { root: new THREE.Group() }; G.add(A.root)
    A.roll = new THREE.Group(); A.roll.position.y = 0.5; A.root.add(A.roll) // o pivô da cambalhota (e da queda)
    A.pelvis = new THREE.Group(); A.pelvis.position.y = 0.42; A.roll.add(A.pelvis)
    put(boxG(0.3, 0.17, 0.2), AGM.pants, [0, -0.03, 0], A.pelvis)
    put(new THREE.CylinderGeometry(0.168, 0.168, 0.05, 10), AGM.belt, [0, 0.055, 0], A.pelvis).scale.z = 0.72
    ;[0.04, 0.065, 0.09, 0.115].forEach((x) => { put(new THREE.CylinderGeometry(0.011, 0.011, 0.05, 6), AGM.shell, [x, 0.06, 0.118 - x * 0.25], A.pelvis, null, false); put(new THREE.CylinderGeometry(0.012, 0.012, 0.012, 6), AGM.brass, [x, 0.03, 0.118 - x * 0.25], A.pelvis, null, false) }) // os cartuchos de sal no cinto
    put(boxG(0.07, 0.075, 0.045), AGM.leather, [-0.158, 0.03, 0.04], A.pelvis, [0, -1.2, 0]); put(sph(0.008, 4, 3), AGM.brass, [-0.177, 0.045, 0.06], A.pelvis, null, false) // a bolsa do Demantino
    A.beltTrap = trapModel(); A.beltTrap.position.set(0.11, -0.02, -0.15); A.beltTrap.rotation.x = 0.2; A.pelvis.add(A.beltTrap)
    A.legs = [-1, 1].map((s) => {
      const th = new THREE.Group(); th.position.set(s * 0.095, -0.03, 0); A.pelvis.add(th)
      put(limb(0.078, 0.06, 0.44), AGM.pants, null, th)
      const kn = new THREE.Group(); kn.position.y = -0.44; th.add(kn)
      put(sph(0.061, 6, 4), AGM.pants, null, kn); put(limb(0.058, 0.046, 0.42), AGM.pants, null, kn)
      put(new THREE.CylinderGeometry(0.062, 0.058, 0.14, 7).translate(0, -0.35, 0), AGM.boot, null, kn) // o cano da bota
      const ft = new THREE.Group(); ft.position.y = -0.42; kn.add(ft)
      put(boxG(0.11, 0.08, 0.27), AGM.boot, [0, -0.025, 0.055], ft); put(boxG(0.116, 0.024, 0.28), AGM.belt, [0, -0.064, 0.055], ft)
      return { s, th, kn, ft, ph: 0 }
    })
    // a barra da jaqueta, aberta na frente: três painéis que acompanham as pernas
    A.panels = [[0.2, 1.75, 1], [1.95, 2.39, 0], [4.34, 1.75, -1]].map(([t0, len, s]) => {
      const g = new THREE.Group(); g.position.y = 0.06; A.pelvis.add(g)
      put(new THREE.CylinderGeometry(0.188, 0.235, 0.38, 7, 1, true, t0, len).translate(0, -0.19, 0), AGM.navy2, null, g) // até o meio da coxa
      put(new THREE.CylinderGeometry(0.234, 0.234, 0.035, 7, 1, true, t0, len).translate(0, -0.345, 0), AGM.rune, null, g, null, false) // as runas da barra
      return { g, s, sw: 0, v: 0 }
    })
    A.spine = new THREE.Group(); A.spine.position.y = 0.04; A.pelvis.add(A.spine)
    put(new THREE.CylinderGeometry(0.178, 0.172, 0.18, 9).translate(0, 0.08, 0), AGM.navy, null, A.spine).scale.z = 0.72
    A.chest = new THREE.Group(); A.chest.position.y = 0.2; A.spine.add(A.chest)
    put(new THREE.CylinderGeometry(0.208, 0.178, 0.34, 10, 2).translate(0, 0.07, 0), AGM.navy, null, A.chest).scale.z = 0.7
    put(boxG(0.012, 0.32, 0.012), AGM.navyD, [0, 0.06, 0.143], A.chest) // o zíper
    put(new THREE.CylinderGeometry(0.088, 0.112, 0.085, 10, 1, true).translate(0, 0.27, 0), AGM.navy2, null, A.chest) // a gola
    ;[-1, 1].forEach((s) => put(sph(0.072, 7, 5), AGM.navy, [s * 0.19, 0.205, 0], A.chest))
    put(new THREE.CylinderGeometry(0.104, 0.13, 0.07, 10, 1, true).translate(0, 0.25, 0), AGM.leatherD, null, A.chest) // a gola de couro
    ;[-0.6, -0.2, 0.2, 0.6].forEach((a) => put(sph(0.009, 5, 3), AGM.brass, [Math.sin(a) * 0.118, 0.25, Math.cos(a) * 0.118], A.chest, null, false)) // os rebites
    ;[-1, 1].forEach((s) => put(boxG(0.034, 0.36, 0.012), AGM.strap, [s * 0.088, 0.07, 0.146], A.chest, [0.04, 0, s * 0.05])) // as alças da mochila, na frente
    put(boxG(0.05, 0.03, 0.01), AGM.amber, [-0.135, 0.15, 0.141], A.chest, null, false) // o distintivo âmbar no peito
    // a mochila: etiqueta âmbar, antena do detector, as duas cápsulas de orbe nas laterais
    A.pack = new THREE.Group(); A.pack.position.set(0, 0.07, -0.185); A.chest.add(A.pack)
    put(boxG(0.3, 0.4, 0.13), AGM.relic, [0, 0, -0.03], A.pack) // o relicário de madeira
    ;[[-1, 1], [1, 1], [-1, -1], [1, -1]].forEach(([a, b]) => { put(boxG(0.06, 0.018, 0.14), AGM.brass, [a * 0.13, b * 0.19, -0.03], A.pack, null, false); put(boxG(0.018, 0.06, 0.14), AGM.brass, [a * 0.14, b * 0.17, -0.03], A.pack, null, false) }) // os cantos de latão
    put(new THREE.TorusGeometry(0.045, 0.008, 4, 12), AGM.amber, [0, 0.09, -0.097], A.pack, null, false); put(boxG(0.008, 0.09, 0.006), AGM.amber, [0, 0.09, -0.098], A.pack, null, false); put(boxG(0.09, 0.008, 0.006), AGM.amber, [0, 0.09, -0.098], A.pack, null, false) // o emblema
    put(boxG(0.24, 0.06, 0.02), AGM.brass, [0, -0.09, -0.1], A.pack, null, false) // o friso dos frascos
    A.orbs = [-1, 0, 1].map((s) => { // os três frascos das capturas, deitados no fundo do relicário: cada captura acende um
      const g = new THREE.Group(); g.position.set(s * 0.075, -0.09, -0.112); A.pack.add(g)
      put(new THREE.CylinderGeometry(0.022, 0.022, 0.07, 8), AGM.glass, null, g); const core = put(new THREE.CylinderGeometry(0.013, 0.013, 0.05, 6), AGM.orbOff, null, g, null, false)
      put(new THREE.CylinderGeometry(0.025, 0.025, 0.012, 8), AGM.brass, [0, 0.04, 0], g); put(new THREE.CylinderGeometry(0.025, 0.025, 0.012, 8), AGM.brass, [0, -0.04, 0], g)
      return { g, core }
    })
    // pescoço curto e a cabeça (cabelo um pouco mais comprido, até a gola)
    A.neck = new THREE.Group(); A.neck.position.y = 0.262; A.chest.add(A.neck)
    put(new THREE.CylinderGeometry(0.05, 0.056, 0.085, 8).translate(0, 0.04, 0), AGM.skin, null, A.neck)
    A.head = new THREE.Group(); A.head.position.y = 0.072; A.neck.add(A.head)
    // ---------- a cabeça: crânio esculpido (maxilar, maçãs, sobrancelha, nariz), rosto pintado em pixel art e cabelo moldado ----------
    // O crânio é uma esfera deformada; o rosto é uma textura nela (96 × 48: a frente fica no primeiro quarto da volta).
    // O cabelo é uma cópia do crânio: onde tem cabelo, sai para fora (volume no alto, repartido de lado, topete); onde não tem, afunda por dentro.
    const HR = 0.105, HSEG = [20, 16]
    const sculpt = (nx, ny, nz) => { // posição (unitária) → posição esculpida (em raios)
      let x = nx * 0.92, y = ny * 1.13, z = nz * 1.02
      const lo = Math.max(0, -ny), jaw = lo * lo
      x *= 1 - 0.4 * jaw * (nz > -0.2 ? 1 : 0.6)                                  // o maxilar afina para o queixo
      if (nz < -0.25 && ny > -0.35) z *= 1.07                                       // a nuca cheia
      if (nz < 0 && ny < -0.45) { z *= 0.82; x *= 0.92 }                            // e entra no pescoço
      if (nz > 0.55) z = 0.55 * 1.02 + (z - 0.55 * 1.02) * 0.55                    // o rosto é mais plano
      const fr = Math.max(0, nz - 0.45)
      if (ny < -0.62 && nz > 0.2) { z += 0.07 * fr * 2; y -= 0.03 }                 // o queixo para a frente
      if (Math.abs(nx) > 0.35 && Math.abs(nx) < 0.85 && ny > -0.3 && ny < 0.1 && nz > 0.3) x += Math.sign(nx) * 0.015 // maçãs do rosto
      if (ny > 0.06 && ny < 0.3 && nz > 0.6) z += 0.035                             // a testa sobre os olhos
      if (ny > -0.12 && ny <= 0.06 && Math.abs(nx) > 0.12 && Math.abs(nx) < 0.55 && nz > 0.6) z -= 0.03 // as órbitas
      if (Math.abs(nx) < 0.1 && ny < 0.04 && ny > -0.4 && nz > 0.8) z += 0.1 * Math.sin(Math.PI * (ny + 0.4) / 0.44) // o nariz
      return [x, y, z]
    }
    // o casco do cabelo (concept 07): ondulado até a nuca, risca do lado esquerdo dele, o volume caindo para a direita (o lado da mecha na testa)
    function hairK(nx, ny, nz) { // quanto o casco sai do crânio nessa direção (< 1: não tem cabelo ali)
      const ax = Math.abs(nx), back = Math.min(1, Math.max(0, (-nz - 0.15) / 0.3)) // 0 no lado, 1 atrás
      let line = (ax > 0.62 ? 0.04 : 0.3) * (1 - back) - 0.9 * back // a linha do cabelo: acima da orelha nos lados, descendo até a nuca atrás
      if (nz > 0.25) line = ax > 0.74 ? 0.06 : nx < -0.1 ? 0.33 : 0.47 // a testa: do lado da mecha o cabelo desce mais
      let m = Math.min(1, Math.max(0, (ny - line) / 0.1))
      if (ax > 0.7 && nz > -0.45 && nz < 0.15 && ny < 0.1 && ny > -0.3) m = 0 // a metade de baixo da orelha fica de fora
      if (m <= 0.01) return 0.9 // sem cabelo: afunda por dentro do crânio
      let vol = 0.06 + 0.1 * Math.max(0, ny) + 0.06 * Math.max(0, -nz) * (ny > -0.55 ? 1 : 0.4) // cheio no alto e atrás (cai por cima da nuca)
      if (nx < 0) vol += 0.035 * Math.max(0, ny) // penteado para a direita dele
      if (ny > 0.5 && nz > -0.3) vol -= 0.05 * Math.exp(-(((nx - 0.3) / 0.08) ** 2)) // o sulco da risca
      return 1 + vol * m
    }
    function headGeo(r, hairMode) {
      const g = new THREE.SphereGeometry(r, HSEG[0], HSEG[1]), p = g.attributes.position
      for (let i = 0; i < p.count; i++) {
        const nx = p.getX(i) / r, ny = p.getY(i) / r, nz = p.getZ(i) / r
        const [x, y, z] = sculpt(nx, ny, nz), k = hairMode ? hairK(nx, ny, nz) : 1
        p.setXYZ(i, x * r * k, y * r * k, z * r * k)
      }
      g.computeVertexNormals(); return g
    }
    // o rosto: pele, barba por fazer, sobrancelhas grossas, olhos (branco e íris), sombra do nariz, lábios; quatro expressões
    const FW = 96, FH = 48, FX = 24 // FX: o meio do rosto na textura
    function paintFace(kind) { // a altura na textura é o ângulo a partir do alto da cabeça: Y(ny) acha a linha de cada traço
      const Y = (ny) => Math.round(Math.acos(ny) / Math.PI * FH)
      const yE = Y(-0.01), yB = Y(0.17), yN = Y(-0.3), yM = Y(-0.5), yC = Y(-0.72)
      return canvasTex(FW, FH, (g) => {
        const px = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(FX + x, y, w, h) }, r = rng(911)
        g.fillStyle = '#a07c64'; g.fillRect(0, 0, FW, FH)
        for (let i = 0; i < 260; i++) { g.fillStyle = r() < 0.5 ? '#9a7660' : '#a88470'; g.fillRect(r() * FW | 0, r() * FH | 0, 1, 1) } // poros
        px(-9, yN, 18, yC - yN + 4, '#977360')                            // a parte de baixo do rosto um pouco mais escura
        for (let i = 0; i < 130; i++) { const x = -9 + r() * 18 | 0, y = yN + 1 + r() * (yC - yN + 3) | 0; if (Math.abs(x) < 3 && y < yM - 1) continue; px(x, y, 1, 1, r() < 0.6 ? '#7a6050' : '#86685a') } // a barba por fazer
        px(-7, yE - 1, 5, 2, '#8e6c58'); px(2, yE - 1, 5, 2, '#8e6c58') // a sombra das órbitas
        px(-1, yB + 1, 2, yN - yB - 1, '#ac8670'); px(1, yB + 2, 1, yN - yB - 1, '#86644f'); px(-2, yN, 4, 1, '#7c5c48') // o nariz: luz, lado na sombra, a base
        px(-8, yE + 2, 3, 2, '#ad8270'); px(5, yE + 2, 3, 2, '#ad8270')   // as maçãs, quentes
        const eye = (sx) => {
          const ex = sx < 0 ? -6 : 3
          if (kind === 'blink') { px(ex, yE, 3, 1, '#4a3428'); return }
          if (kind === 'pain') { px(ex, yE - 1, 3, 1, '#4a3428'); px(ex, yE, 3, 1, '#5a4030'); return }
          const top = kind === 'aim' ? yE : yE - 1
          px(ex, top, 3, yE + 1 - top, '#d2c8bc'); px(ex + 1, top, 1, yE + 1 - top, '#3a2a20') // o branco e a íris
          px(ex, top - 1, 3, 1, '#3a2620')                                   // a pálpebra de cima
        }
        eye(-1); eye(1)
        const brow = (sx) => {
          const bx = sx < 0 ? -7 : 3
          if (kind === 'aim') { px(bx, yB, 4, 1, '#2a1c14'); px(sx < 0 ? bx + 2 : bx, yB + 1, 2, 1, '#2a1c14') }    // franzidas, descendo para o meio
          else if (kind === 'pain') { px(bx, yB, 4, 1, '#2a1c14'); px(sx < 0 ? bx + 2 : bx, yB - 1, 2, 1, '#2a1c14') } // levantadas no meio
          else { px(bx, yB, 4, 1, '#2a1c14'); px(sx < 0 ? bx : bx + 2, yB, 2, 1, '#22160f') }
        }
        brow(-1); brow(1)
        if (kind === 'pain') { px(-2, yM - 1, 5, 2, '#3a1a16'); px(-2, yM - 1, 5, 1, '#d0c4b4'); px(-2, yM + 1, 5, 1, '#7a4a40') } // os dentes cerrados
        else if (kind === 'aim') px(-2, yM, 5, 1, '#5a3430')                                                                      // lábios apertados
        else { px(-2, yM, 5, 1, '#6a3c34'); px(-1, yM + 1, 3, 1, '#8a5a4c') }
        px(-1, yC, 2, 1, '#86644f')                                        // o vinco do queixo
      })
    }
    const FACE = { tex: { base: paintFace('base'), blink: paintFace('blink'), aim: paintFace('aim'), pain: paintFace('pain') }, k: 'base', blink: 0, blinkT: 2 }
    AGM.face = std({ map: FACE.tex.base })
    const hairWaves = (g, w, h, seed) => { // fios ondulados: faixas suaves de luz e sombra que serpenteiam de cima para baixo
      const r = rng(seed); g.fillStyle = '#3a2618'; g.fillRect(0, 0, w, h)
      for (let i = 0; i < w * 0.7; i++) { const x0 = r() * w, a = 0.6 + r() * 0.9, ph = r() * 6.3, c = r(); g.fillStyle = c < 0.45 ? 'rgba(92,64,42,0.5)' : c < 0.9 ? 'rgba(24,15,9,0.45)' : 'rgba(120,88,60,0.35)'
        for (let y = 0; y < h; y++) g.fillRect(((x0 + Math.sin(y * 0.17 + ph) * a) % w + w) % w | 0, y, 1, 1) }
    }
    const hairTexA = canvasTex(32, 32, (g, w, h) => hairWaves(g, w, h, 919))
    AGM.hairS = std({ map: tiled(hairTexA, 3, 2) })
    put(headGeo(HR, false), AGM.face, [0, 0.1, 0.006], A.head)
    put(headGeo(HR, true), AGM.hairS, [0, 0.1, 0.006], A.head)
    ;[-1, 1].forEach((s) => { const e = put(sph(0.024, 6, 5), AGM.skin, [s * 0.094, 0.098, -0.004], A.head); e.scale.set(0.42, 1.0, 0.7); e.rotation.y = s * 0.3 }) // as orelhas
    // ---------- a camada de cabelo com física: mechas onduladas por cima do casco ----------
    // Cada mecha é uma fita: um trecho colado no couro cabeludo (segue a cabeça) e uma ponta solta (verlet) que balança com a corrida,
    // a cambalhota, o tranco e o giro da cabeça. Cabelo curto não despenca: uma mola puxa a ponta de volta para o formato penteado.
    // A ponta não atravessa a cabeça, a gola, os ombros nem a mochila.
    const HC = V3(0, 0.1, 0.006), HE = V3(HR * 0.92, HR * 1.13, HR * 1.02) // o centro e os raios do crânio (espaço da cabeça)
    const hairTexL = canvasTex(16, 64, (g, w, h) => { // a mecha: fios ondulados e a ponta desfiada (transparente)
      hairWaves(g, w, h, 931); const r = rng(937)
      for (let x = 0; x < w; x++) { const cut = 3 + (r() * 8 | 0) + (x === 0 || x === w - 1 ? 6 : 0); g.clearRect(x, h - cut, 1, cut) } // a ponta: fios de comprimentos diferentes
      for (let y = 0; y < h; y += 2 + (r() * 5 | 0)) g.clearRect(r() < 0.5 ? 0 : w - 1, y, 1, 2 + (r() * 4 | 0)) // a borda, um pouco solta
    })
    AGM.lock = std({ map: hairTexL, side: THREE.DoubleSide, alphaTest: 0.5 })
    const AH = { PIN: 4, FREE: 4, locks: [], keep: 0.86 }
    function scalpA(phi, lat, out) { // um ponto em cima do casco (espaço da cabeça) na direção (giro em volta do Y a partir da frente, latitude)
      const nx = Math.sin(phi) * Math.cos(lat), ny = Math.sin(lat), nz = Math.cos(phi) * Math.cos(lat)
      const [x, y, z] = sculpt(nx, ny, nz), k = Math.max(1.05, hairK(nx, ny, nz)) * 1.02
      return out.set(HC.x + x * HR * k, HC.y + y * HR * k, HC.z + z * HR * k)
    }
    const LOCK_A = [] // [giro na raiz, latitude na raiz, giro onde solta, latitude onde solta, comprimento solto, largura]
    ;[1.75, 2.05, 2.35, 2.65, 2.95].forEach((p, i) => [-1, 1].forEach((s) => LOCK_A.push([s * p * 0.55, 1.05, s * p, -0.3 - 0.06 * i, 0.075 + 0.006 * i, 0.056]))) // atrás: cai até a nuca, por cima da gola
    LOCK_A.push([0, 1.0, Math.PI, -0.5, 0.09, 0.06])                                                        // a do meio da nuca
    ;[[1.25, 0.12, 0.07], [1.5, 0.0, 0.075]].forEach(([p, lb, len]) => { LOCK_A.push([-0.35, 1.05, -p, lb, len + 0.012, 0.05]); LOCK_A.push([0.55, 1.05, p, lb + 0.04, len, 0.048]) }) // os lados, por cima da orelha
    LOCK_A.push([0.42, 1.2, -0.36, 0.42, 0.09, 0.058])                                                    // a mecha: da risca, atravessa a testa e cai na frente do olho direito
    LOCK_A.push([0.25, 1.05, -0.7, 0.4, 0.07, 0.046])                                                      // e outra embaixo dela, até a têmpora
    LOCK_A.push([0.62, 1.05, 0.2, 0.55, 0.035, 0.04])                                                      // um fiapo curto do outro lado da risca
    {
      const _a = V3(), _b = V3()
      LOCK_A.forEach(([pt, lt, pb, lb, len, w], li) => {
        const pl = [], tl = []
        for (let k = 0; k < AH.PIN; k++) {
          const f = k / (AH.PIN - 1), phi = pt + (pb - pt) * f, lat = lt + (lb - lt) * f
          pl.push(scalpA(phi, lat, V3()))
          scalpA(phi + 0.05, lat, _a); scalpA(phi - 0.05, lat, _b); tl.push(_a.sub(_b).normalize().clone()) // a largura da fita: ao longo do giro
        }
        let path = 0; for (let k = 1; k < AH.PIN; k++) path += pl[k].distanceTo(pl[k - 1])
        AH.locks.push({ li, pl, tl, w, seg: len / AH.FREE, total: path + len, pw: pl.map(() => V3()), tw: tl.map(() => V3()), p: [], q: [], last: V3() })
      })
      const rows = AH.PIN + AH.FREE, n = AH.locks.length
      const pos = new Float32Array(n * rows * 2 * 3), uv = new Float32Array(n * rows * 2 * 2), idx = []
      AH.locks.forEach((L, i) => {
        const u0 = (L.li * 0.29) % 1, uw = L.w / 0.06 * 0.9
        let sAcc = 0
        for (let r = 0; r < rows; r++) {
          if (r > 0) sAcc += r < AH.PIN ? L.pl[r].distanceTo(L.pl[r - 1]) : L.seg
          const v = 1 - sAcc / L.total, b = (i * rows + r) * 2
          uv.set([u0, v, u0 + uw, v], b * 2)
          if (r < rows - 1) idx.push(b, b + 1, b + 2, b + 1, b + 3, b + 2)
        }
      })
      const geo = new THREE.BufferGeometry()
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage)); geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); geo.setIndex(idx)
      AH.geo = geo; AH.pos = pos; AH.rows = rows
      AH.mesh = new THREE.Mesh(geo, AGM.lock); AH.mesh.frustumCulled = false; AH.mesh.castShadow = true; AH.mesh.receiveShadow = true; A.root.add(AH.mesh) // as posições são do espaço do A.root
    }
    // colisores no espaço do peito: a gola, os ombros, a mochila
    const AH_BODY = [[0, 0.285, -0.005, 0.1], [-0.15, 0.2, -0.01, 0.1], [0.15, 0.2, -0.01, 0.1], [0, 0.24, -0.2, 0.11]].map(([x, y, z, r]) => ({ c: V3(x, y, z), r }))
    // braços: s = -1 é o direito (a arma), s = +1 o esquerdo
    A.arms = [-1, 1].map((s) => {
      const sh = new THREE.Group(); sh.position.set(s * 0.205, 0.215, 0); A.chest.add(sh)
      const up = new THREE.Group(); sh.add(up)
      put(limb(0.055, 0.047, 0.29), AGM.navy, null, up); put(new THREE.CylinderGeometry(0.057, 0.057, 0.025, 8), AGM.refl, [0, -0.13, 0], up)
      const fo = new THREE.Group(); fo.position.y = -0.29; up.add(fo)
      put(sph(0.049, 6, 4), AGM.navy, null, fo); put(limb(0.047, 0.04, 0.25), AGM.navy, null, fo); put(new THREE.CylinderGeometry(0.045, 0.045, 0.03, 8), AGM.navyD, [0, -0.235, 0], fo); put(new THREE.CylinderGeometry(0.047, 0.047, 0.022, 10, 1, true), AGM.rune, [0, -0.205, 0], fo, null, false)
      const hd = new THREE.Group(); hd.position.y = -0.26; fo.add(hd)
      put(boxG(0.075, 0.095, 0.042), AGM.glove, [0, -0.045, 0.005], hd); put(boxG(0.07, 0.05, 0.036), AGM.glove, [0, -0.105, 0.016], hd, [0.55, 0, 0])
      put(boxG(0.025, 0.05, 0.025), AGM.glove, [s * 0.04, -0.04, 0.026], hd, [0, 0, s * -0.4]) // o polegar (a palma é o +z da mão)
      // onde a arma encaixa: o cano segue os dedos (-y da mão), a palma encosta no lado da arma e o polegar fica por cima
      const mount = new THREE.Group(); mount.position.set(0, -0.068, 0.02); mount.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(V3(0, 0, 1), V3(-1, 0, 0), V3(0, -1, 0))); hd.add(mount)
      return { s, sh, up, fo, hd, mount }
    })
    const RA = A.arms[0], LA = A.arms[1]
    // o kit de primeiros socorros na mão esquerda (só aparece na hora de usar)
    A.kitHand = new THREE.Group(); A.kitHand.position.set(0, -0.08, 0.03); A.kitHand.visible = false; LA.hd.add(A.kitHand)
    put(boxG(0.1, 0.05, 0.07), std({ color: '#d8d0c0' }), [0, 0, 0], A.kitHand, null, false); put(boxG(0.012, 0.052, 0.04), basic({ color: '#c8382c' }), [0, 0, 0], A.kitHand, null, false); put(boxG(0.04, 0.052, 0.012), basic({ color: '#c8382c' }), [0, 0, 0], A.kitHand, null, false)

    // as armas (no espaço da arma: o cano aponta para +z, o cabo na origem)
    const W = {}
    const R2 = Math.PI / 2
    { const g = new THREE.Group(); W.pistola = g // a Adaptadora de latão: corpo gravado, cabo de madeira, frasco de ectoplasma em cima, boca em sino
      const sig = basic({ color: '#6a3a14' }), sg = []
      put(boxG(0.05, 0.064, 0.2), OM.brass, [0, 0.045, 0.06], g)
      put(boxG(0.054, 0.01, 0.204), OM.brassD, [0, 0.08, 0.06], g); put(boxG(0.054, 0.01, 0.204), OM.brassD, [0, 0.011, 0.06], g) // os frisos
      ;[-1, 1].forEach((s) => put(boxG(0.004, 0.034, 0.12), OM.brassL, [s * 0.0265, 0.045, 0.07], g)) // as placas gravadas
      put(boxG(0.04, 0.105, 0.046), OM.wood, [0, -0.02, 0.0], g, [0.25, 0, 0]); put(boxG(0.044, 0.012, 0.05), OM.brass, [0, -0.072, -0.013], g, [0.25, 0, 0]) // o cabo e o pomo
      ;[-0.004, 0.024].forEach((y) => put(boxG(0.042, 0.004, 0.03), OM.woodD, [0, y - 0.02, 0.016], g, [0.25, 0, 0])) // os entalhes
      put(boxG(0.008, 0.006, 0.06), OM.brass, [0, -0.008, 0.05], g); put(boxG(0.008, 0.03, 0.006), OM.brass, [0, 0.002, 0.08], g) // a guarda
      put(boxG(0.012, 0.028, 0.018), OM.brassD, [0, 0.083, -0.042], g, [-0.5, 0, 0]) // o cão
      put(new THREE.CylinderGeometry(0.019, 0.021, 0.15, 8).rotateX(R2), OM.bronze, [0, 0.05, 0.235], g) // o cano
      ;[0.18, 0.245, 0.3].forEach((z) => put(new THREE.CylinderGeometry(0.024, 0.024, 0.008, 8).rotateX(R2), OM.brassD, [0, 0.05, z], g)) // as cintas
      put(new THREE.CylinderGeometry(0.037, 0.021, 0.05, 10, 1, true).rotateX(R2), OM.bell, [0, 0.05, 0.33], g) // a boca em sino
      put(new THREE.CircleGeometry(0.03, 10), OM.hole, [0, 0.05, 0.338], g, null, false)
      ;[[0.2, 0], [0.222, 1], [0.265, 2], [0.285, 3]].forEach(([z, k]) => [-1, 1].forEach((s) => sg.push(put(boxG(0.003, 0.011, 0.011), sig, [s * 0.0212, 0.05, z], g, [k % 2 ? Math.PI / 4 : 0, 0, 0], false)))) // os símbolos no cano
      ;[-1, 1].forEach((s) => [0.03, 0.09].forEach((z, k) => sg.push(put(boxG(0.003, 0.012, 0.012), sig, [s * 0.0287, 0.045, z], g, [Math.PI / 4 * (k + 1), 0, 0], false)))) // e nas placas
      ;[0.012, 0.11].forEach((z) => put(boxG(0.008, 0.016, 0.008), OM.brassD, [0, 0.091, z], g)) // os suportes do frasco
      g.userData.vial = put(new THREE.CylinderGeometry(0.014, 0.014, 0.11, 8).rotateX(R2), OM.ecto, [0, 0.106, 0.06], g, null, false) // o ectoplasma
      ;[0.002, 0.118].forEach((z) => put(new THREE.CylinderGeometry(0.017, 0.017, 0.012, 8).rotateX(R2), OM.brass, [0, 0.106, z], g)) // as tampas do frasco
      put(new THREE.CylinderGeometry(0.009, 0.011, 0.016, 6).rotateX(R2), OM.woodD, [0, 0.106, -0.012], g) // a rolha
      g.userData.coils = [mergeParts(g, [g.userData.vial]).get(sig)]
      g.userData.muzzle = V3(0, 0.05, 0.36); g.userData.cable = V3(0, 0.0, -0.05); g.userData.support = V3(-0.005, -0.035, 0.035) }
    { const g = new THREE.Group(); W.escopeta = g // a escopeta de sal: canos ornamentados, câmara de sal de vidro, coronha entalhada, bomba de madeira
      const sig = basic({ color: '#6a3a14' }), sg = []
      put(boxG(0.064, 0.078, 0.25), OM.brass, [0, 0.05, 0.08], g)
      put(boxG(0.068, 0.01, 0.254), OM.brassD, [0, 0.088, 0.08], g) // o friso de cima
      ;[-1, 1].forEach((s) => {
        put(boxG(0.004, 0.05, 0.096), OM.glassD, [s * 0.033, 0.055, 0.035], g) // a câmara de sal
        for (let i = 0; i < 3; i++) put(boxG(0.003, 0.034, 0.02), OM.salt, [s * 0.0355, 0.055, 0.003 + i * 0.031], g, null, false) // os cartuchos aparecendo no vidro
        put(boxG(0.005, 0.054, 0.006), OM.brassD, [s * 0.034, 0.055, -0.014], g); put(boxG(0.005, 0.054, 0.006), OM.brassD, [s * 0.034, 0.055, 0.084], g) // a moldura
        put(boxG(0.004, 0.044, 0.05), OM.brassL, [s * 0.033, 0.05, 0.155], g) // a placa gravada
        sg.push(put(boxG(0.003, 0.016, 0.016), sig, [s * 0.0355, 0.05, 0.155], g, [Math.PI / 4, 0, 0], false)) // e o símbolo dela
      })
      put(boxG(0.05, 0.085, 0.26), OM.wood, [0, 0.005, -0.18], g, [-0.12, 0, 0]); put(boxG(0.054, 0.092, 0.014), OM.brass, [0, -0.012, -0.312], g, [-0.12, 0, 0]) // a coronha e a chapa
      ;[-1, 1].forEach((s) => put(boxG(0.004, 0.03, 0.08), OM.woodD, [s * 0.0255, 0.0, -0.2], g, [-0.12, 0, 0])) // o entalhe
      ;[-0.017, 0.017].forEach((x) => put(new THREE.CylinderGeometry(0.017, 0.017, 0.44, 8).rotateX(R2), OM.bronze, [x, 0.062, 0.4], g))
      ;[0.225, 0.52, 0.585].forEach((z) => put(boxG(0.074, 0.042, 0.012), OM.brass, [0, 0.062, z], g)) // as cintas
      put(boxG(0.076, 0.044, 0.022), OM.brassD, [0, 0.062, 0.612], g); [-0.017, 0.017].forEach((x) => put(new THREE.CircleGeometry(0.012, 8), OM.hole, [x, 0.062, 0.6235], g, null, false))
      ;[0.29, 0.34, 0.44, 0.49].forEach((z, k) => sg.push(put(boxG(0.011, 0.003, 0.011), sig, [0, 0.0805, z], g, [0, k % 2 ? Math.PI / 4 : 0, 0], false))) // os símbolos em cima dos canos
      g.userData.pump = put(boxG(0.056, 0.042, 0.14), OM.wood, [0, 0.026, 0.38], g)
      ;[-0.045, 0, 0.045].forEach((z) => put(boxG(0.06, 0.046, 0.008), OM.woodD, [0, 0, z], g.userData.pump)) // os anéis entalhados da bomba
      put(boxG(0.04, 0.095, 0.045), OM.wood, [0, -0.02, 0.0], g, [0.3, 0, 0]); put(boxG(0.008, 0.006, 0.06), OM.brass, [0, -0.01, 0.05], g) // o cabo e a guarda
      g.userData.coils = [mergeParts(g, [g.userData.pump]).get(sig)]
      g.userData.muzzle = V3(0, 0.062, 0.64); g.userData.cable = V3(0, 0.02, -0.08); g.userData.support = V3(0, -0.005, 0.38) }
    W.armadilha = trapModel(); W.armadilha.position.set(0, -0.045, 0.0) // na palma, a tampa para cima
    W.armadilha.userData.muzzle = V3(0, 0.1, 0); W.armadilha.userData.cable = V3(0, 0.05, 0)
    Object.values(W).forEach((w) => { w.visible = false; RA.mount.add(w) })
    // o cabo vermelho da mochila até a arma: oito gomos que se reposicionam a cada quadro
    const cableSegs = Array.from({ length: 9 }, () => put(new THREE.CylinderGeometry(0.009, 0.009, 1, 4).translate(0, 0.5, 0), AGM.cable, null, G, null, false))

    // ---------- IK de dois ossos no espaço do peito (as mãos vão exatamente onde a arma precisa) ----------
    const UL1 = 0.29, UL2 = 0.26
    const _x = V3(), _y = V3(), _z = V3(), _u = V3(), _f = V3(), _e = V3(), _d = V3(), _p = V3(), _w = V3(), _m4 = new THREE.Matrix4()
    const XAX = V3(1, 0, 0), _qa = new THREE.Quaternion(), _qb = new THREE.Quaternion(), _eu = new THREE.Euler()
    const GRIP = V3(0, -0.068, 0.02) // onde a arma encaixa, no espaço da mão
    function ikArm(arm, tgt, pole, handQ, out) {
      _w.copy(GRIP).applyQuaternion(handQ); const wr = _d.copy(tgt).sub(_w) // o pulso fica um pouco atrás do cabo
      const s = arm.sh.position
      _d.sub(s); const dist = Math.min(Math.max(0.12, _d.length()), UL1 + UL2 - 0.003); const dir = _d.normalize()
      _p.copy(pole).normalize(); _p.addScaledVector(dir, -_p.dot(dir)); if (_p.lengthSq() < 1e-6) _p.set(0, -1, 0); _p.normalize()
      const a1 = Math.acos(cl((UL1 * UL1 + dist * dist - UL2 * UL2) / (2 * UL1 * dist), -1, 1))
      _e.copy(s).addScaledVector(dir, UL1 * Math.cos(a1)).addScaledVector(_p, UL1 * Math.sin(a1))
      const wrist = _w.copy(s).addScaledVector(dir, dist)
      _u.copy(_e).sub(s).normalize(); _f.copy(wrist).sub(_e).normalize()
      _x.crossVectors(_u, _f); if (_x.lengthSq() < 1e-6) _x.crossVectors(_u, _p); _x.normalize()
      _y.copy(_u).negate(); _z.crossVectors(_x, _y)
      let el = Math.atan2(-_f.dot(_z), -_f.dot(_y))
      if (el > 0) { _x.negate(); _z.negate(); el = -el } // o cotovelo sempre dobra para o mesmo lado da animação normal
      out.qU.setFromRotationMatrix(_m4.makeBasis(_x, _y, _z)); out.el = el
      _qa.copy(out.qU).multiply(_qb.setFromAxisAngle(XAX, el)); out.qH.copy(_qa).invert().multiply(handQ)
      return out
    }
    const IKR = { qU: new THREE.Quaternion(), el: 0, qH: new THREE.Quaternion() }, IKL = { qU: new THREE.Quaternion(), el: 0, qH: new THREE.Quaternion() }
    function handQFor(dir, upHint, out) { // a mão direita segura a arma apontando para dir (no espaço do peito): o cano é o -y da mão, o topo da arma é o -x (o polegar)
      _y.copy(dir).normalize().negate(); _x.copy(upHint).addScaledVector(_y, -upHint.dot(_y)).normalize().negate(); _z.crossVectors(_x, _y)
      return out.setFromRotationMatrix(_m4.makeBasis(_x, _y, _z))
    }
    function lhQFor(dir, upHint, out) { // a mão esquerda por baixo da arma: dedos ao longo do cano, polegar (+x) para cima, palma virada para a direita
      _y.copy(dir).normalize().negate(); _x.copy(upHint).addScaledVector(_y, -upHint.dot(_y)).normalize(); _z.crossVectors(_x, _y)
      return out.setFromRotationMatrix(_m4.makeBasis(_x, _y, _z))
    }
    function setArm(arm, fk, ik, w) { // mistura a pose solta (ângulos) com a do IK
      _qa.setFromEuler(_eu.set(fk.x, fk.tw || 0, fk.z, 'XZY')); if (w > 0.001) _qa.slerp(ik.qU, w); arm.up.quaternion.copy(_qa)
      arm.fo.rotation.set(lerp(fk.el, ik.el, w), 0, 0)
      _qb.setFromEuler(_eu.set(fk.wx || 0, fk.wy || 0, fk.wz || 0)); if (w > 0.001) _qb.slerp(ik.qH, w); arm.hd.quaternion.copy(_qb)
    }

    // =====================================================================
    // ---------- estado, entrada, colisão e câmera por cima do ombro ----------
    // =====================================================================
    const P = { pos: START.clone(), vel: V3(), mv: V3(), knockV: 0, kits: T.kit.inicio, healDone: false, yaw: Math.PI, hp: T.agente.vida, stam: T.agente.folego, stamLock: 0, stamIdle: 0, runW: 0, aimW: 0, speed: 0,
      dodge: -1, dodgeDir: V3(), dodgeCd: 0, inv: 0, hitT: -1, hitHeavy: false, hitSide: 0, knock: V3(), stagger: 0, dead: -1,
      w: 'pistola', wNext: null, swap: -1, kick: 0, pumpT: -1, throwT: -1, healT: -1, fireHold: 0, torCd: 0,
      stats: { t: 0, shots: 0, hits: 0, crits: 0, dmg: 0, hitsTaken: 0, dodges: 0, deaths: 0, kits: 0 } }
    const IN = { k: {}, fire: false, aim: false, dx: 0, dy: 0, wheel: 0, use: false }
    const D = { on: false, playing: false, free: false, mode: 'start', t: 0, msg: '', msgT: 0, dbg: false, bot: null }
    const C = { yaw: Math.PI, pitch: -0.12, sens: 0.0022, shake: 0, fovKick: 0, ph: 1.58, piv: START.clone(), py: 0, k: 1 }

    function pushOBB(p, o, r) { // círculo contra caixa girada (no plano do chão)
      const c = Math.cos(o.yaw), s = Math.sin(o.yaw), dx = p.x - o.x, dz = p.z - o.z
      const lx = dx * c - dz * s, lz = dx * s + dz * c
      const qx = cl(lx, -o.hx, o.hx), qz = cl(lz, -o.hz, o.hz), ex = lx - qx, ez = lz - qz, d = Math.hypot(ex, ez)
      if (d >= r) return false
      let nx, nz, pen
      if (d > 1e-5) { nx = ex / d; nz = ez / d; pen = r - d } else { const px = o.hx - Math.abs(lx), pz = o.hz - Math.abs(lz); if (px < pz) { nx = Math.sign(lx) || 1; nz = 0; pen = px + r } else { nx = 0; nz = Math.sign(lz) || 1; pen = pz + r } }
      p.x += (nx * c + nz * s) * pen; p.z += (-nx * s + nz * c) * pen
      return true
    }
    function distOBB(x, z, o) { const c = Math.cos(o.yaw), s = Math.sin(o.yaw), dx = x - o.x, dz = z - o.z, lx = dx * c - dz * s, lz = dx * s + dz * c; return Math.hypot(lx - cl(lx, -o.hx, o.hx), lz - cl(lz, -o.hz, o.hz)) }
    function collide(p, r) {
      if (D.zone === 'casa') { casaCollide(p, r); return } // na casa: as paredes, as portas fechadas e os móveis dela
      if (D.zone === 'intro') { insCollide(p, r); return } // na instalação da Intro
      if (D.zone === 'corr') { p.x = cl(p.x, -COR.w + r + 0.05, COR.w - r - 0.05); p.z = cl(p.z, RD + 0.3 + r, RD + COR.len - r - 0.1); return } // no corredor
      p.x = cl(p.x, -RW + r + 0.05, RW - r - 0.05); p.z = cl(p.z, -RD + r + 0.05, RD - r - 0.3)
      for (const o of OBS) if (!o.off) pushOBB(p, o, r)
      for (const o of RAIN.obs) pushOBB(p, o, r)
      if (BD.glu && !BD.glu.dead && P.dodge < 0) { const S = BD.glu.o.S, dx = p.x - S.pos.x, dz = p.z - S.pos.z, dd = Math.hypot(dx, dz), m = r + 0.7; if (dd < m && dd > 1e-4) { p.x = S.pos.x + dx / dd * m; p.z = S.pos.z + dz / dd * m } }
      if (!B.cribBroken) pushOBB(p, CRIB_BOX, r)
      const L = LUTA.L
      if (LUTA.on && !L.hidden && L.y > -0.6 && B.mode !== 'captured' && B.mode !== 'capture' && P.dodge < 0) { const dx = p.x - L.pos.x, dz = p.z - L.pos.z, d = Math.hypot(dx, dz), m = r + 0.4; if (d < m && d > 1e-4) { p.x = L.pos.x + dx / d * m; p.z = L.pos.z + dz / d * m } }
    }
    function maeWalk(x, z) { // por onde ela ANDA: a sala toda, a ilha e a própria barreira também; só o berço é sólido (os móveis afundam quando ela chega)
      if (Math.abs(x) > RW - 0.7 || Math.abs(z) > RD - 0.7) return false
      if (!B.cribBroken && distOBB(x, z, CRIB_BOX) < 0.45) return false
      return true
    }
    function maeOK(x, z) { // onde a Mãe pode SURGIR ou mergulhar: dentro da sala, fora da ilha, dos móveis e do tornado
      if (Math.abs(x) > RW - 0.7 || Math.abs(z) > RD - 0.7) return false
      const dc = Math.hypot(x - CRIB.x, z - CRIB.z)
      if (dc < ISL + 0.5) return false
      if (TOR.want > 0 && dc > T.tornado.r0 - 0.7 && dc < T.tornado.r1 + 0.6) return false
      for (const o of OBS) if (!o.off && distOBB(x, z, o) < 0.5) return false
      return true
    }
    // ---------- raios: o que a mira e os tiros encontram ----------
    function raySphere(o, d, c, r) { const ox = o.x - c.x, oy = o.y - c.y, oz = o.z - c.z, b = ox * d.x + oy * d.y + oz * d.z, cc = ox * ox + oy * oy + oz * oz - r * r, h = b * b - cc; if (h < 0) return -1; const t = -b - Math.sqrt(h); return t >= 0 ? t : cc < 0 ? 0 : -1 }
    function rayBox(o, d, Bx, pad = 0) {
      const c = Math.cos(Bx.yaw), s = Math.sin(Bx.yaw), ox = o.x - Bx.x, oz = o.z - Bx.z
      const sl = [[ox * c - oz * s, d.x * c - d.z * s, -Bx.hx - pad, Bx.hx + pad], [o.y, d.y, (Bx.y0 || 0) - pad, Bx.y1 + pad], [ox * s + oz * c, d.x * s + d.z * c, -Bx.hz - pad, Bx.hz + pad]]
      let t0 = 0, t1 = Infinity
      for (const [oo, dd, mn, mx] of sl) { if (Math.abs(dd) < 1e-9) { if (oo < mn || oo > mx) return -1 } else { let a = (mn - oo) / dd, b = (mx - oo) / dd; if (a > b) { const q = a; a = b; b = q } t0 = Math.max(t0, a); t1 = Math.min(t1, b); if (t0 > t1) return -1 } }
      return t0
    }
    function rayRoom(o, d) { let t = Infinity; if (d.x > 1e-6) t = Math.min(t, (RW - o.x) / d.x); if (d.x < -1e-6) t = Math.min(t, (-RW - o.x) / d.x); if (d.z > 1e-6) t = Math.min(t, (RD - o.z) / d.z); if (d.z < -1e-6) t = Math.min(t, (-RD - o.z) / d.z); if (d.y < -1e-6) t = Math.min(t, (0 - o.y) / d.y); if (d.y > 1e-6) t = Math.min(t, (WH - o.y) / d.y); return Math.max(0, t) }
    function rayTornado(o, d) { // a parede de fora do tornado (cilindro), só quando ele está de pé
      if (TOR.k < 0.5) return -1
      const R0 = T.tornado.r1, ox = o.x - CRIB.x, oz = o.z - CRIB.z, a = d.x * d.x + d.z * d.z; if (a < 1e-9) return -1
      const b = ox * d.x + oz * d.z, c = ox * ox + oz * oz - R0 * R0, h = b * b - a * c; if (h < 0) return -1
      let t = (-b - Math.sqrt(h)) / a; if (t < 0) t = (-b + Math.sqrt(h)) / a; if (t < 0) return -1
      const y = o.y + d.y * t; return y >= 0 && y <= 11 ? t : -1
    }
    // o corpo dela, em esferas (a cabeça vale crítico)
    const MS = [0.17, 0.25, 0.27, 0.3, 0.34, 0.36].map((r, i) => ({ c: V3(), r: r * 1.0, head: i === 0, on: false }))
    function maeSpheres() {
      const L = LUTA.L, on = LUTA.on && !L.hidden && B.mode !== 'captured' && maeGroup.visible
      if (!on) { MS.forEach((s) => (s.on = false)); return }
      skull.updateWorldMatrix(true, false)
      skull.localToWorld(MS[0].c.set(0, 0.04, 0.01)); neck.localToWorld(MS[1].c.set(0, 0.0, 0.0)); spineRoot.localToWorld(MS[2].c.set(0, 0.32, 0.02))
      hips.localToWorld(MS[3].c.set(0, 0.92, 0)); skirt.localToWorld(MS[4].c.set(0, 0.62, 0)); skirt.localToWorld(MS[5].c.set(0, 0.25, 0))
      MS.forEach((s) => (s.on = s.c.y + s.r > 0.02))
    }
    // o que está na frente da mira: { t, kind: 'mae' | 'head' | 'crib' | 'tornado' | 'wall', p }
    const _ro = V3(), _rd = V3(), AIM = { t: 60, kind: 'wall', p: V3(), ref: null }
    function castRay(o, d, maxT, out) { // kind 'none': nada até maxT
      if (D.zone === 'casa') return castRayCasa(o, d, maxT, out)
      if (D.zone === 'intro') return castRayIns(o, d, maxT, out)
      const tr = rayRoom(o, d); let t = Math.min(maxT, tr), kind = tr <= maxT ? 'wall' : 'none'
      for (const s of MS) if (s.on) { const q = raySphere(o, d, s.c, s.r); if (q >= 0 && q < t) { t = q; kind = s.head ? 'head' : 'mae' } }
      if (!B.cribBroken) { const q = rayBox(o, d, CRIB_BOX); if (q >= 0 && q < t) { t = q; kind = D.kind === 'bando' ? 'wall' : 'crib' } }
      out.ref = null
      for (let i = 0; i < BD.nSph; i++) { const s = BD.sph[i], q = raySphere(o, d, s.c, s.r); if (q >= 0 && q < t) { t = q; kind = s.part; out.ref = s.e } }
      for (const ob of OBS) { if (ob.off) continue; const q = rayBox(o, d, ob); if (q >= 0 && q < t) { t = q; kind = 'wall' } }
      const qt = rayTornado(o, d); if (qt >= 0 && qt < t) { t = qt; kind = 'tornado' }
      out.t = t; out.kind = kind; out.p.copy(o).addScaledVector(d, t)
      return out
    }

    // ---------- entrada (teclado e mouse) ----------
    function setPlaying(v) {
      D.playing = v; document.body.classList.toggle('playing', v)
      if (!v) { IN.k = {}; IN.fire = false; IN.aim = false }
      hudTela()
    }
    function start() {
      if (!D.on || D.playing) return
      SFX.boot()
      try { const r = canvas.requestPointerLock(); if (r && r.catch) r.catch(() => {}) } catch (e) {}
      setTimeout(() => { if (document.pointerLockElement !== canvas && D.on && !D.playing) { D.free = true; setPlaying(true); began() } }, 250) // sem trava do mouse: a visão segue o mouse
    }
    document.addEventListener('pointerlockchange', () => {
      if (!D.on) return
      if (document.pointerLockElement === canvas) { D.free = false; setPlaying(true); began() }
      else if (!D.free) setPlaying(false)
    })
    canvas.addEventListener('mousedown', (e) => {
      if (!D.on) return
      if (!D.playing) { if (D.mode !== 'won' && D.mode !== 'dead') start(); return }
      e.preventDefault() // (no botão do meio, também impede a rolagem automática do navegador)
      if (e.button === 1) { wheelOpen(); return } // segurar a rodinha: a roda de armas
      if (WHEEL.on) { wheelClose(e.button === 0); return } // com a roda aberta: esquerdo confirma, direito cancela (não atira)
      if (e.button === 0) { IN.fire = true; IN.firePress = true }
      if (e.button === 2) IN.aim = true
    })
    addEventListener('mouseup', (e) => { if (!D.on) return; if (e.button === 1) wheelClose(true); if (e.button === 0) IN.fire = false; if (e.button === 2) IN.aim = false })
    canvas.addEventListener('auxclick', (e) => { if (D.on && e.button === 1) e.preventDefault() })
    addEventListener('mousemove', (e) => { if (!D.on || !D.playing) return; const mx = e.movementX || 0, my = e.movementY || 0; if (Math.abs(mx) > 200 || Math.abs(my) > 200) return; if (WHEEL.on) { wheelMove(mx, my); return } IN.dx += mx; IN.dy += my })
    canvas.addEventListener('contextmenu', (e) => { if (D.on) e.preventDefault() })
    addEventListener('wheel', (e) => { if (!D.on || !D.playing || WHEEL.on) return; IN.wheel += e.deltaY > 0 ? 1 : -1 }, { passive: true })
    addEventListener('keydown', (e) => {
      if (!D.on) return
      if (['Space', 'Tab', 'ArrowUp', 'ArrowDown', 'KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(e.code)) e.preventDefault()
      if (e.code === 'KeyR' && (D.mode === 'dead' || D.mode === 'won')) { e.preventDefault(); retry(D.mode === 'won'); return }
      if (!D.playing) { if (e.code === 'Enter') start(); return }
      if (e.repeat) return
      if (e.code === 'Tab') { wheelOpen(); return } // Tab segurado: a roda de armas (para quem não tem rodinha)
      if (e.code === 'Escape' && WHEEL.on) { wheelClose(false); return }
      IN.k[e.code] = true
      if (/^Digit[1-3]$/.test(e.code)) wantWeapon(['pistola', 'escopeta', 'armadilha'][+e.code.slice(5) - 1])
      if (e.code === 'KeyE') IN.use = true
      if (e.code === 'KeyB') { D.dbg = !D.dbg; dbgEl.hidden = !D.dbg }
      if (e.code === 'BracketLeft' || e.code === 'BracketRight') { C.sens = cl(C.sens * (e.code === 'BracketLeft' ? 0.85 : 1.18), 0.0006, 0.008); say('Sensibilidade do mouse: ' + (C.sens / 0.0022).toFixed(2) + '×') }
      if ((e.code === 'Escape' || e.code === 'KeyP') && D.free) { D.free = false; setPlaying(false) }
    })
    addEventListener('keyup', (e) => { if (!D.on) return; if (e.code === 'Tab') wheelClose(true); IN.k[e.code] = false })
    addEventListener('blur', () => { IN.k = {}; IN.fire = false; IN.aim = false; wheelClose(false) })

    // ---------- a câmera: por cima do ombro direito, como no RE4 remake; mirando, chega perto ----------
    const _cf = V3(), _cr = V3(), _cb = V3(), _cw = V3(), _cs = V3()
    function segRoomT(a, b, pad) { let k = 1; const ax = [['x', RW - pad], ['z', RD - pad]]; for (const [q, lim] of ax) { const d = b[q] - a[q]; if (b[q] > lim && d > 0) k = Math.min(k, (lim - a[q]) / d); if (b[q] < -lim && d < 0) k = Math.min(k, (-lim - a[q]) / d) } return Math.max(0, k) }
    function segBoxT(a, b, x0, x1, z0, z1) { let k = 1; for (const [q, lo, hi] of [['x', x0, x1], ['z', z0, z1]]) { const d = b[q] - a[q]; if (b[q] > hi && d > 0) k = Math.min(k, (hi - a[q]) / d); if (b[q] < lo && d < 0) k = Math.min(k, (lo - a[q]) / d) } return Math.max(0, k) }
    // a câmera colada no agente (parede atrás, batente, canto): o agente fica translúcido em vez de tapar a tela
    const AGF = { mats: null, a: 1, on: false }
    function agentFade(dt) {
      let want = 1
      if (!D.camOv && P.dead < 0) { const d = Math.hypot(camera.position.x - P.pos.x, camera.position.z - P.pos.z), q = cl((d - 0.55) / 0.5); want = 0.2 + 0.8 * q * q * (3 - 2 * q) }
      AGF.a = damp(AGF.a, want, want < AGF.a ? 16 : 7, dt); if (AGF.a > 0.985 && want === 1) AGF.a = 1
      const fade = AGF.a < 1
      if (!fade && !AGF.on) return
      if (fade && !AGF.on) { // começando: junta os materiais opacos do agente (a arma nova também); os que já são transparentes (clarão, brilho, vidro) ficam como estão
        AGF.mats = AGF.mats || []
        A.root.traverse((o) => { if (!o.material) return; for (const m of Array.isArray(o.material) ? o.material : [o.material]) if (!m.userData.agf && !m.transparent) { m.userData.agf = { op: m.opacity }; AGF.mats.push(m) } })
      }
      AGF.on = fade
      for (const m of AGF.mats) { m.transparent = fade; m.opacity = m.userData.agf.op * AGF.a }
    }
    function camTick(dt) {
      const aim = P.aimW
      const back = lerp(2.5, 1.22, aim), side = lerp(0.56, 0.66, aim), up = lerp(0.16, 0.07, aim)
      C.ph = damp(C.ph, P.dead >= 0 ? 1.0 : P.dodge >= 0 ? 1.25 : P.healT >= 0 ? 1.3 : 1.6, 7, dt)
      C.piv.x = damp(C.piv.x, P.pos.x, 16, dt); C.piv.z = damp(C.piv.z, P.pos.z, 16, dt); C.py = damp(C.py, P.pos.y, 12, dt) // a altura do chão (na casa: o andar e a escada)
      const cp = Math.cos(C.pitch), f = _cf.set(Math.sin(C.yaw) * cp, Math.sin(C.pitch), Math.cos(C.yaw) * cp), r = _cr.set(-Math.cos(C.yaw), 0, Math.sin(C.yaw))
      const base = _cb.set(C.piv.x, C.ph + C.py, C.piv.z)
      const from = _cs.copy(base).addScaledVector(r, side * 0.45)
      const want = _cw.copy(base).addScaledVector(r, side).addScaledVector(f, -back); want.y += up
      // braço-mola: parede e móvel entre o ombro e a câmera puxam ela para perto
      let k = D.zone === 'casa' ? casaCamK(from, want) : D.zone === 'intro' ? insCamK(from, want) : D.zone === 'corr' ? segBoxT(from, want, -COR.w + 0.25, COR.w - 0.25, RD + 0.3, RD + COR.len - 0.25) : segRoomT(from, want, 0.25)
      _rd.copy(want).sub(from); const len = _rd.length(); _rd.normalize()
      if (D.zone !== 'casa' && D.zone !== 'intro') for (const o of OBS) { if (o.off) continue; const q = rayBox(from, _rd, o, 0.22); if (q >= 0 && q < len) k = Math.min(k, q / len) }
      C.k = k < C.k ? k : Math.min(k, damp(C.k, k, 3.2, dt)) // o braço encolhe na hora (nunca atravessa a parede) e estica devagar (sem sanfona no batente da porta)
      camera.position.lerpVectors(from, want, Math.max(0.1, C.k - 0.03))
      camera.position.y = D.zone === 'casa' ? casaCamY(camera.position) : D.zone === 'intro' ? insCamY(camera.position) : cl(camera.position.y, 0.25, D.zone === 'corr' ? COR.h - 0.3 : WH - 0.4)
      if (C.shake > 0.001) { const s = C.shake * 0.25; camera.position.x += (R() - 0.5) * s; camera.position.y += (R() - 0.5) * s; camera.position.z += (R() - 0.5) * s; C.shake = Math.max(0, C.shake - dt * 2.8) }
      camera.lookAt(camera.position.x + f.x, camera.position.y + f.y, camera.position.z + f.z)
      if (D.camOv) { const o = D.camOv; camera.position.copy(o.p); _cw.copy(o.l); if (o.rel) { camera.position.add(P.pos); _cw.add(P.pos) } camera.lookAt(_cw) } // gancho de teste: câmera parada olhando o agente
      agentFade(dt)
      C.fovKick = damp(C.fovKick, 0, 8, dt)
      const fov = lerp(60, 47, aim) + C.fovKick + (P.runW > 0.5 ? 3 * P.runW : 0)
      if (Math.abs(camera.fov - fov) > 0.01) { camera.fov = fov; camera.updateProjectionMatrix() }
      // a mira: o que está bem no meio da tela
      _ro.copy(camera.position); castRay(_ro, f, 70, AIM)
    }

    // =====================================================================
    // ---------- o controle: andar relativo à câmera, correr (fôlego), mirar, esquivar, curar ----------
    // =====================================================================
    const PREV = {}
    function press(c) { const v = !!IN.k[c], p = !!PREV[c]; PREV[c] = v; return v && !p } // uma vez por quadro para cada tecla
    const _wish = V3(), _tv = V3(), _dv = V3()
    function startDodge() {
      const dir = _wish.lengthSq() > 0.01 ? _wish.clone().normalize() : V3(-Math.sin(C.yaw), 0, -Math.cos(C.yaw)) // sem direção: para trás
      P.dodge = 0; P.dodgeDir.copy(dir); P.dodgeCd = T.agente.esquiva.recarga; P.stam = Math.max(0, P.stam - 1.2); P.stamIdle = 0
      P.yaw = Math.atan2(dir.x, dir.z); P.healT = -1; P.healDone = false; A.kitHand.visible = false
      SFX.demo('esquiva'); P.stats.dodges++
    }
    const KIT_GEN = 90 // sem nenhum kit, um novo a cada 1:30
    function controlTick(dt) {
      const k = IN.k, alive = P.dead < 0
      if (alive && D.playing && D.mode === 'fight') { if (P.kits <= 0) { P.kitGen = (P.kitGen || 0) + dt; if (P.kitGen >= KIT_GEN) { P.kitGen = 0; P.kits = 1; SFX.demo('kit'); say('Um kit médico foi gerado (F para curar)', 3) } } else P.kitGen = 0 }
      const can = D.playing && alive && (D.mode === 'intro' || D.mode === 'fight' || D.mode === 'corredor')
      if (D.playing) { const s = C.sens * (P.aimW > 0.5 ? 0.7 : 1); C.yaw = dAng(0, C.yaw - IN.dx * s); C.pitch = cl(C.pitch - IN.dy * s, -0.95, 0.8) }
      IN.dx = IN.dy = 0
      let ix = 0, iz = 0
      if (can) { ix = (k.KeyD || k.ArrowRight ? 1 : 0) - (k.KeyA || k.ArrowLeft ? 1 : 0); iz = (k.KeyW || k.ArrowUp ? 1 : 0) - (k.KeyS || k.ArrowDown ? 1 : 0) }
      const fx = Math.sin(C.yaw), fz = Math.cos(C.yaw)
      _wish.set(fx * iz - fz * ix, 0, fz * iz + fx * ix); const wl = _wish.length(); if (wl > 1) _wish.multiplyScalar(1 / wl)
      const busy = P.dodge >= 0 || P.stagger > 0
      const aiming = can && IN.aim && !busy && P.healT < 0
      P.aimW = damp(P.aimW, aiming ? 1 : 0, aiming ? 12 : 9, dt)
      // correr gasta fôlego; mirando, curando ou logo depois de atirar, não corre
      const run = can && (k.ShiftLeft || k.ShiftRight) && wl > 0.1 && !aiming && P.healT < 0 && P.fireHold <= 0 && !P.stamLock && P.stam > 0 && !busy
      P.runW = damp(P.runW, run ? 1 : 0, 7, dt)
      if (run) { P.stam = Math.max(0, P.stam - dt); P.stamIdle = 0; if (P.stam <= 0) P.stamLock = true }
      else { P.stamIdle += dt; if (P.stamIdle > 0.7) P.stam = Math.min(T.agente.folego, P.stam + T.agente.folegoVolta * dt) }
      if (P.stamLock && P.stam >= 2) P.stamLock = false
      let sp = run ? T.agente.correr : aiming ? T.agente.mirando : T.agente.andar
      if (P.healT >= 0) sp *= 0.45
      if (P.hitT >= 0 && P.hitT < 0.25) sp *= 0.5
      _tv.copy(_wish).multiplyScalar(busy ? 0 : sp)
      _dv.subVectors(_tv, P.vel); const m = _dv.length(), rate = (wl > 0.05 && !busy ? T.agente.acel : T.agente.freio) * dt
      if (m <= rate) P.vel.copy(_tv); else P.vel.addScaledVector(_dv, rate / m)
      // a esquiva: cambalhota para onde você está apertando (sem direção, para trás); invulnerável no meio
      const E = T.agente.esquiva
      if (press('Space') && can && P.dodge < 0 && P.dodgeCd <= 0 && P.stam >= 1.2 && P.stagger <= 0 && P.throwT < 0) startDodge()
      if (P.dodge >= 0) { const u = Math.min(1, P.dodge / E.dur); P.vel.copy(P.dodgeDir).multiplyScalar(E.dist / E.dur * 2 * (1 - u)) }
      // para onde o corpo vira: mirando ou atirando, para a mira; andando, para onde anda
      if (P.dodge < 0 && alive) {
        if (aiming || P.fireHold > 0 || P.throwT >= 0) P.yaw += dAng(P.yaw, C.yaw) * (1 - Math.exp(-18 * dt))
        else if (P.vel.x * P.vel.x + P.vel.z * P.vel.z > 0.09) P.yaw += dAng(P.yaw, Math.atan2(P.vel.x, P.vel.z)) * (1 - Math.exp(-10 * dt))
        P.yaw = dAng(0, P.yaw)
      }
      // anda e bate (paredes, móveis, berço, ela)
      P.knock.multiplyScalar(Math.exp(-6 * dt))
      const ox = P.pos.x, oz = P.pos.z
      P.pos.x += (P.vel.x + P.knock.x) * dt; P.pos.z += (P.vel.z + P.knock.z) * dt
      collide(P.pos, 0.3)
      if (D.zone === 'casa') casaY() // o chão da casa: térreo, escadaria, andar de cima
      else if (D.zone === 'intro') P.pos.y = 0 // a instalação: um andar só
      // o tornado: encostar machuca e joga para fora (enquanto ele se forma, só empurra)
      if (TOR.k > 0.5 && alive && D.mode !== 'won') {
        const dx = P.pos.x - CRIB.x, dz = P.pos.z - CRIB.z, d = Math.hypot(dx, dz) || 1, nx = dx / d, nz = dz / d
        if (d < T.tornado.r1 + 0.3) {
          if (TOR.t < 2.6 || d < T.tornado.r0 - 0.4) { P.pos.x += nx * 7 * dt; P.pos.z += nz * 7 * dt; collide(P.pos, 0.3) }
          else if (P.torCd <= 0) { P.knock.set(nx * T.tornado.empurra, 0, nz * T.tornado.empurra); P.torCd = 0.9; hurtPlayer(T.dano.tornado, 'tornado', null, true); SFX.demo('empurrao') }
        }
      }
      P.torCd -= dt
      P.mv.set((P.pos.x - ox) / Math.max(dt, 1e-4), 0, (P.pos.z - oz) / Math.max(dt, 1e-4)); P.speed = Math.hypot(P.mv.x, P.mv.z)
      // os relógios
      if (P.dodge >= 0) { P.dodge += dt; if (P.dodge > E.dur) P.dodge = -1 }
      P.dodgeCd -= dt; P.inv = Math.max(0, P.inv - dt); P.fireHold = Math.max(0, P.fireHold - dt); P.stagger = Math.max(0, P.stagger - dt)
      if (P.hitT >= 0) { P.hitT += dt; if (P.hitT > 1.0) P.hitT = -1 }
      if (P.dead >= 0) P.dead += dt
      // os kits no chão: passando perto, pega
      if (alive) for (const kt of kits) if (kt.on && Math.hypot(P.pos.x - kt.p.x, P.pos.z - kt.p.z) < 1.15) { kt.on = false; kt.g.visible = false; P.kits++; SFX.demo('kit'); say('Kit de primeiros socorros: +1 (F para usar)') }
      // F: usa um kit (1,3 s, andando devagar; se apanhar antes da agulha, perde o tempo mas não o kit)
      if ((press('KeyF') || IN.kitReq) && can && P.kits > 0 && P.healT < 0 && P.dodge < 0 && P.throwT < 0) { if (P.hp >= T.agente.vida) say('Vida cheia'); else { P.healT = 0; P.healDone = false; SFX.demo('kitAbre') } }
      IN.kitReq = false
      if (P.healT >= 0) {
        P.healT += dt
        if (P.healT >= 0.8 && !P.healDone) { P.healDone = true; P.kits--; P.hp = Math.min(T.agente.vida, P.hp + T.kit.cura); P.stats.kits++; SFX.demo('cura'); healFx = 1 }
        if (P.healT > 1.3) { P.healT = -1; P.healDone = false }
      }
      // troca de arma pela rodinha; E recolhe a armadilha
      if (IN.wheel) { const Lw = ['pistola', 'escopeta', 'armadilha'], i = Lw.indexOf(P.wNext || P.w); if (can) wantWeapon(Lw[(i + (IN.wheel > 0 ? 1 : 2)) % 3]); IN.wheel = 0 }
      if (press('KeyE') && can) trapRecall()
      if (press('KeyQ') && can && P.wLast) wantWeapon(P.wLast)
    }
    // ---------- a roda de armas: segure a rodinha (ou Tab), aponte o mouse para a fatia e solte ----------
    // Em cima a pistola, à direita a escopeta, embaixo a armadilha, à esquerda o kit. Aberta, o mouse move só o cursor da roda
    // (a câmera para) e o clique não atira. Soltar no meio (sem apontar) não troca nada.
    const WHEEL = { on: false, vx: 0, vy: 0, hov: -1, items: ['pistola', 'escopeta', 'armadilha', 'kit'] }
    function wheelOk(i) { const k = WHEEL.items[i]; return k === 'armadilha' ? D.kind === 'mae' || D.kind === 'intro' : k === 'kit' ? P.kits > 0 && P.hp < T.agente.vida : true }
    function wheelOpen() {
      if (WHEEL.on || !D.playing || P.dead >= 0 || !(D.mode === 'fight' || D.mode === 'intro' || D.mode === 'corredor')) return
      WHEEL.on = true; WHEEL.vx = WHEEL.vy = 0; WHEEL.hov = -1; IN.fire = false; IN.dx = IN.dy = 0
      el.wheel.classList.add('on'); wheelDraw(); SFX.demo('roda')
    }
    function wheelMove(mx, my) {
      WHEEL.vx += mx; WHEEL.vy += my
      const L = Math.hypot(WHEEL.vx, WHEEL.vy); if (L > 70) { WHEEL.vx *= 70 / L; WHEEL.vy *= 70 / L }
      if (L < 14) return // perto do meio: fica como está
      const i = ((Math.round((Math.atan2(WHEEL.vy, WHEEL.vx) + Math.PI / 2) / (Math.PI / 2)) % 4) + 4) % 4
      if (i !== WHEEL.hov) { WHEEL.hov = i; wheelDraw() } else wheelPtr()
    }
    function wheelClose(pick) {
      if (!WHEEL.on) return
      WHEEL.on = false; el.wheel.classList.remove('on')
      const i = WHEEL.hov; if (!pick || i < 0) return
      const k = WHEEL.items[i]
      if (!wheelOk(i)) { say(k === 'armadilha' ? 'A armadilha é para a Mãe: aqui, só a pistola e a escopeta' : P.kits <= 0 ? 'Sem kits' : 'Vida cheia'); return }
      if (k === 'kit') IN.kitReq = true; else wantWeapon(k)
    }
    function wheelPtr() { const L = Math.hypot(WHEEL.vx, WHEEL.vy), a = Math.atan2(WHEEL.vy, WHEEL.vx); el.wptr.setAttribute('cx', (Math.cos(a) * 26).toFixed(1)); el.wptr.setAttribute('cy', (Math.sin(a) * 26).toFixed(1)); el.wptr.setAttribute('opacity', L > 14 ? 1 : 0) }
    function wheelDraw() { // as fatias (a que está na mão, a apontada, as que não dá) e o texto do meio
      const cur = P.wNext && P.swap >= 0 ? P.wNext : P.w, i = WHEEL.hov, k = i >= 0 ? WHEEL.items[i] : cur
      el.wsec.forEach((g, j) => { g.classList.toggle('hov', j === i); g.classList.toggle('cur', WHEEL.items[j] === cur); g.classList.toggle('off', !wheelOk(j))
        const kk = WHEEL.items[j], ga = g.querySelector('.ga'), len = +g.dataset.len // o arco: a sobrecarga das armas, os kits (até 5), a armadilha pronta
        const f = kk === 'kit' ? Math.min(1, P.kits / 5) : kk === 'armadilha' ? (TRAP.state === 'hand' ? 1 : 0) : cl(HEAT[kk].heat / 100)
        ga.style.strokeDasharray = `${(len * f).toFixed(1)} 999`; ga.style.opacity = f < 0.01 ? 0 : ''; ga.classList.toggle('hot', kk !== 'kit' && kk !== 'armadilha' && HEAT[kk].hot); ga.classList.toggle('kit', kk === 'kit') })
      wheelPtr()
      let sub = '', cls = ''
      if (k === 'kit') { sub = P.kits <= 0 ? 'sem kits' : P.hp >= T.agente.vida ? `${P.kits} ${P.kits === 1 ? 'kit' : 'kits'} · vida cheia` : `${P.kits} ${P.kits === 1 ? 'kit' : 'kits'} · +${T.kit.cura} de vida`; cls = P.kits > 0 && P.hp < T.agente.vida ? 'ok' : '' }
      else if (k === 'armadilha') { sub = D.kind === 'intro' ? (TRAP.state === 'hand' ? 'jogue na poça' : 'no chão · E recolhe') : D.kind !== 'mae' ? 'só na luta da Mãe' : B.mode === 'weak' ? 'ela está fraca: jogue!' : 'para quando ela enfraquecer'; cls = D.kind === 'mae' && B.mode === 'weak' ? 'ok' : '' }
      else { const Hh = HEAT[k]; sub = Hh.hot ? 'superaquecida' : `calor ${Math.round(Hh.heat)}%`; cls = Hh.hot ? 'hot' : '' }
      el.wlb.textContent = k === 'kit' ? 'kit de cura' : WNAME[k]; el.wls.textContent = (k === cur && i >= 0 ? 'na mão · ' : '') + sub; el.wls.className = cls
    }

    function wantWeapon(k) {
      if (!k || P.dead >= 0) return
      if (k === 'armadilha' && D.kind !== 'mae' && D.kind !== 'intro') { say('A armadilha é para a Mãe: aqui, só a pistola e a escopeta'); return }
      if (P.swap < 0 && k === P.w) return
      if (P.swap >= 0) { P.wNext = k; return }
      P.wNext = k; P.swap = 0; SFX.demo('troca')
    }

    // =====================================================================
    // ---------- a animação: passada pela distância, IK nos braços, cambalhota, pancada, queda ----------
    // =====================================================================
    const AN = { ph: 0, amp: 0, run: 0, aim: 0, legYaw: 0, legDir: 1, bank: 0, yawPrev: Math.PI, hx: 0, hy: 0, pump: 0 }
    A.pelvis.rotation.order = 'YXZ'
    const _q1 = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _inv = new THREE.Matrix4(), _p1 = V3(), _p2 = V3(), _p3 = V3(), _p4 = V3(), _dirA = V3(), _dirB = V3(), _aimW = V3()
    const FKR = { x: 0, z: -0.1, tw: 0, el: -0.3, wx: 0, wy: 0, wz: 0 }, FKL = { x: 0, z: 0.1, tw: 0, el: -0.3, wx: 0, wy: 0, wz: 0 }
    const POLE_R = V3(-0.6, -1, -0.3), POLE_L = V3(0.6, -1, -0.3), UPV = V3(0, 1, 0)
    const HOLD = { // onde a mão direita segura cada arma (espaço do peito): na mira e na guarda baixa, e para onde o cano aponta na guarda
      pistola: { aim: V3(-0.06, 0.18, 0.47), low: V3(-0.19, -0.31, 0.15), lowDir: V3(0.08, -0.9, 0.6).normalize() }, // guarda: a pistola numa mão só, apontada para o chão na frente
      escopeta: { aim: V3(-0.13, 0.15, 0.2), low: V3(-0.14, -0.19, 0.2), lowDir: V3(0.5, -0.5, 1).normalize() }, // guarda: atravessada na frente do corpo, as duas mãos
      armadilha: { aim: V3(-0.15, 0.0, 0.34), low: V3(-0.2, -0.3, 0.12), lowDir: V3(0.0, -0.35, 1).normalize() },
    }
    const SOLE = [V3(0, -0.068, -0.07), V3(0, -0.068, 0.19)] // calcanhar e ponta (espaço do pé)
    const STAND = 0.42
    let healFx = 0
    const _fp = V3()
    function footstep(i) {
      A.legs[i].ft.getWorldPosition(_fp)
      const luto = B.dry < 0.5 && !onIsland(_fp.x, _fp.z)
      SFX.demo('passo', { luto, run: AN.run, k: Math.min(1, AN.amp), surf: D.zone === 'casa' ? casaSurf(_fp.x, P.pos.y, _fp.z) : D.zone === 'intro' ? insSurf(_fp.x, _fp.z) : null })
      if (luto) { LUTA.ring(_fp.x, _fp.z, 0.04, 0.3 + 0.25 * AN.run, 0.7, 0.3 + 0.25 * AN.run); if (AN.run > 0.4) LUTA.splash(_fp.x, _fp.z, 2 + (AN.run * 4 | 0), 0.7, 1.3) }
    }
    function animAgent(t, dt) {
      const dead = P.dead >= 0, rolling = P.dodge >= 0 && !dead
      A.root.position.set(P.pos.x, P.pos.y, P.pos.z); A.root.rotation.y = P.yaw
      // ---------- a passada ----------
      const s = Math.sin(P.yaw), c = Math.cos(P.yaw)
      const vz = P.mv.x * s + P.mv.z * c, vx = P.mv.x * c - P.mv.z * s, sp = rolling || dead ? 0 : Math.hypot(vx, vz)
      const yr = dAng(AN.yawPrev, P.yaw) / Math.max(dt, 1e-4); AN.yawPrev = P.yaw
      AN.run = damp(AN.run, P.runW, 6, dt)
      AN.aim = damp(AN.aim, Math.max(P.aimW, P.fireHold > 0 ? 0.9 : 0), 14, dt)
      const turnStep = sp < 0.4 && Math.abs(yr) > 1.4 && !rolling && !dead ? Math.min(1, (Math.abs(yr) - 1.4) * 0.35) : 0 // girando parado: passinhos no lugar
      AN.amp = damp(AN.amp, Math.max(cl(sp / T.agente.andar, 0, 1.3), turnStep * 0.45), 7, dt)
      if (sp > 0.3) { // de lado e de costas: as pernas giram para o lado do movimento e o tronco desfaz o giro
        const ma = Math.atan2(vx, vz); let yt, dir = 1
        if (Math.abs(ma) <= 1.85) yt = cl(ma, -1.15, 1.15); else { yt = cl(dAng(0, ma - Math.PI), -1.15, 1.15); dir = -1 }
        AN.legDir = dir; AN.legYaw = damp(AN.legYaw, yt, 9, dt)
      } else AN.legYaw = damp(AN.legYaw, 0, 6, dt)
      const stride = lerp(lerp(1.45, 2.5, AN.run), 1.15, AN.aim * (1 - AN.run))
      const ph0 = AN.ph
      AN.ph += AN.legDir * (sp / stride) * Math.PI * 2 * dt + turnStep * 7 * dt
      const n0 = Math.floor((ph0 - Math.PI / 2) / Math.PI), n1 = Math.floor((AN.ph - Math.PI / 2) / Math.PI)
      if (n0 !== n1 && AN.amp > 0.22 && !rolling && !dead) { const idx = AN.ph > ph0 ? n1 : n0; footstep(((idx % 2) + 2) % 2) }
      const amp = AN.amp, run = AN.run
      const thA = amp * lerp(0.42, 0.66, run), bend = amp * lerp(0.6, 1.4, run)
      for (const Lg of A.legs) {
        const p = AN.ph + (Lg.s > 0 ? Math.PI : 0), sw = Math.sin(p), cs = Math.cos(p)
        const th = -thA * sw - 0.1 * run * amp
        const kn = 0.06 + bend * Math.pow(Math.max(0, cs), 1.4) + 0.12 * run * amp
        const toe = amp * (0.3 * Math.max(0, Math.sin(p + 2.0)) - 0.22 * Math.max(0, Math.sin(p - 0.25)) * (1 - run * 0.5))
        Lg.th.rotation.set(th, 0, Lg.s * (0.045 + 0.025 * (1 - Math.min(1, amp))))
        Lg.kn.rotation.set(kn, 0, 0)
        Lg.ft.rotation.set(-(th + kn) + toe, 0, -Lg.s * 0.035)
      }
      const osc = 0.11 * amp * Math.sin(AN.ph) * (0.7 + 0.3 * run) // o quadril gira com a perna que vai à frente
      AN.bank = damp(AN.bank, cl(-yr * sp * 0.03, -0.16, 0.16), 6, dt) // inclina para dentro da curva
      A.roll.rotation.set(0, 0, 0); A.roll.position.set(0, 0.5, 0)
      A.pelvis.position.set(0, STAND, 0); A.pelvis.rotation.set(0.05 * run * amp, rolling ? 0 : AN.legYaw + osc, 0.045 * amp * Math.cos(AN.ph) + AN.bank)
      // o pé de apoio fica no chão: mede as solas e acerta a altura do quadril
      A.root.updateMatrixWorld(true)
      let lo = Infinity
      for (const Lg of A.legs) for (const q of SOLE) { _p1.copy(q); Lg.ft.localToWorld(_p1); if (_p1.y < lo) lo = _p1.y }
      A.pelvis.position.y = STAND - (lo - A.root.position.y) + 0.03 * run * amp * Math.max(0, Math.sin(2 * AN.ph - 0.4)) // correndo: o voo entre os passos
      // ---------- o tronco: desfaz o giro das pernas; mirando, o peito acompanha a mira ----------
      const breath = Math.sin(t * 1.9) * 0.012 * (1 - Math.min(1, amp) * 0.5)
      const res = cl(dAng(P.yaw, C.yaw), -0.7, 0.7) * AN.aim // o que o corpo ainda não virou
      const pit = C.pitch * AN.aim
      A.spine.rotation.set(0.04 + 0.07 * run * amp, -AN.legYaw * 0.55 - osc * 0.9 + res * 0.4, -0.03 * amp * Math.cos(AN.ph))
      A.chest.rotation.set(-pit * 0.45 + breath + 0.05 * run * amp, -AN.legYaw * 0.45 - osc * 0.35 + res * 0.6, 0)
      A.neck.rotation.set(0, 0, 0); A.head.rotation.set(0, 0, 0)
      // ---------- a cambalhota: encolhe e gira inteiro em volta do meio do corpo ----------
      let tuck = 0
      if (rolling) {
        const u = cl(P.dodge / T.agente.esquiva.dur), r = sm((u - 0.04) / 0.8)
        tuck = sm(u / 0.16) * (1 - sm((u - 0.72) / 0.28))
        A.roll.rotation.x = r * Math.PI * 2; A.roll.position.y = 0.5 + 0.08 * Math.sin(Math.PI * r)
        for (const Lg of A.legs) { Lg.th.rotation.x = lerp(Lg.th.rotation.x, -1.85, tuck); Lg.kn.rotation.x = lerp(Lg.kn.rotation.x, 2.25, tuck); Lg.ft.rotation.x = lerp(Lg.ft.rotation.x, 0.35, tuck) }
        A.pelvis.position.y = lerp(A.pelvis.position.y, 0.02, tuck)
        A.spine.rotation.x = lerp(A.spine.rotation.x, 0.6, tuck); A.chest.rotation.x = lerp(A.chest.rotation.x, 0.45, tuck); A.neck.rotation.x = 0.5 * tuck
      }
      // ---------- a queda: os joelhos cedem e ele cai de costas ----------
      let flop = 0
      if (dead) {
        const h = P.dead, k1 = sm(h / 0.3), k2 = sm((h - 0.25) / 0.6); flop = k2
        for (const Lg of A.legs) { Lg.th.rotation.x = lerp(-0.35 * k1, -0.12, k2); Lg.kn.rotation.x = lerp(0.9 * k1, 0.25, k2); Lg.ft.rotation.x = lerp(-0.4 * k1, 0.5, k2); Lg.th.rotation.z = Lg.s * (0.05 + 0.12 * k2) }
        A.pelvis.position.y = STAND - 0.2 * k1 * (1 - k2); A.pelvis.rotation.set(0, 0, 0)
        A.roll.rotation.x = -1.5 * k2; A.roll.position.y = lerp(0.5, 0.15, k2)
        A.spine.rotation.set(0.35 * k1 * (1 - k2) - 0.1 * k2, 0, 0.1 * k2); A.chest.rotation.set(0.2 * k1 * (1 - k2), 0, 0)
        A.neck.rotation.set(0.3 * k1 * (1 - k2) - 0.35 * k2, 0.4 * k2, 0)
      }
      // ---------- a pancada ----------
      if (P.hitT >= 0 && !dead) {
        const h = P.hitT, f = sm(h / 0.06) * (1 - sm((h - 0.1) / (P.hitHeavy ? 0.55 : 0.28))), sd = P.hitSide
        A.spine.rotation.x -= (P.hitHeavy ? 0.42 : 0.26) * f; A.chest.rotation.z += 0.16 * f * sd; A.neck.rotation.x -= 0.3 * f
        A.pelvis.position.y -= (P.hitHeavy ? 0.1 : 0.03) * f
        for (const Lg of A.legs) Lg.kn.rotation.x += (P.hitHeavy ? 0.35 : 0.1) * f
      }
      // curando: o tronco dobra um pouco para a coxa
      const healK = P.healT >= 0 ? sm(P.healT / 0.22) * (1 - sm((P.healT - 1.02) / 0.26)) : 0
      if (healK > 0) { A.spine.rotation.x += 0.16 * healK; A.chest.rotation.y += 0.15 * healK }
      // ---------- a cabeça: olha para onde a câmera mira ----------
      A.root.updateMatrixWorld(true)
      _inv.copy(A.chest.matrixWorld).invert()
      if (AIM.t > 2.5) _aimW.copy(AIM.p); else _aimW.copy(camera.position).addScaledVector(_p1.set(Math.sin(C.yaw) * Math.cos(C.pitch), Math.sin(C.pitch), Math.cos(C.yaw) * Math.cos(C.pitch)), 12)
      _p2.copy(_aimW).applyMatrix4(_inv).sub(_p3.set(0, 0.45, 0.05))
      let hy = Math.atan2(_p2.x, _p2.z), hx = -Math.atan2(_p2.y, Math.hypot(_p2.x, _p2.z))
      if (!D.playing || dead || rolling || healK > 0.5) { hy = healK > 0.5 ? 0.3 : 0; hx = healK > 0.5 ? 0.5 : 0.1 }
      AN.hy = damp(AN.hy, cl(hy, -1.1, 1.1), 8, dt); AN.hx = damp(AN.hx, cl(hx, -0.6, 0.7), 8, dt)
      if (!dead) { A.neck.rotation.x += AN.hx * 0.35; A.neck.rotation.y += AN.hy * 0.4; A.head.rotation.set(AN.hx * 0.65, AN.hy * 0.6, 0) }
      // o rosto: pisca de vez em quando; franze a testa mirando; careta ao apanhar, rolar ou cair
      FACE.blinkT -= dt; FACE.blink -= dt; if (FACE.blinkT <= 0) { FACE.blink = 0.13; FACE.blinkT = 2.2 + R() * 3.5 }
      const fk = dead || rolling || (P.hitT >= 0 && P.hitT < 0.5) ? 'pain' : FACE.blink > 0 ? 'blink' : AN.aim > 0.5 ? 'aim' : 'base'
      if (fk !== FACE.k) { FACE.k = fk; AGM.face.map = FACE.tex[fk] }
      A.root.updateMatrixWorld(true); _inv.copy(A.chest.matrixWorld).invert()
      // ---------- o braço direito: a arma na guarda baixa ou na mira (IK até o cabo) ----------
      const H = HOLD[P.w]
      const swapK = P.swap >= 0 ? Math.sin(Math.PI * Math.min(1, P.swap / 0.45)) : 0
      const kAim = AN.aim * (1 - swapK) * (1 - healK) * (1 - tuck) * (dead ? 0 : 1)
      const tgt = _p3.copy(H.low).lerp(H.aim, kAim)
      if (swapK > 0) tgt.lerp(_p4.set(-0.21, -0.27, 0.05), swapK) // desce até o coldre
      if (tuck > 0) tgt.lerp(_p4.set(-0.08, 0.0, 0.18), tuck) // a arma junto do peito na cambalhota
      _dirA.copy(_aimW).applyMatrix4(_inv).sub(tgt).normalize()
      _dirB.copy(H.lowDir); if (swapK > 0) _dirB.lerp(_p4.set(0, -1, 0.25), swapK); _dirB.normalize().lerp(_dirA, kAim).normalize()
      if (P.kick > 0.001) { tgt.addScaledVector(_dirB, -0.05 * P.kick); tgt.y += 0.03 * P.kick; _dirB.y += (P.w === 'escopeta' ? 0.5 : 0.26) * P.kick; _dirB.normalize() } // o coice
      handQFor(_dirB, UPV, _q1); ikArm(RA, tgt, POLE_R, _q1, IKR)
      let wR = 1
      FKR.x = 0; FKR.z = -0.12; FKR.tw = 0; FKR.el = -0.3; FKR.wx = 0; FKR.wy = 0; FKR.wz = 0
      if (P.throwT >= 0 && !dead) { // a armadilha: balança para trás e solta por baixo, rolando no ar
        const h = P.throwT, back = sm(h / 0.14) * (1 - sm((h - 0.14) / 0.1)), fwd = sm((h - 0.14) / 0.12) * (1 - sm((h - 0.36) / 0.22))
        wR = 1 - Math.max(back, fwd)
        FKR.x = 0.8 * back - 1.45 * fwd; FKR.z = -0.18; FKR.el = -0.3 * back - 0.12 * fwd; FKR.wx = 0.35 * back - 0.5 * fwd
      }
      if (dead) { wR = 1 - flop; FKR.x = -0.5 * flop; FKR.z = -1.15 * flop; FKR.el = -0.35; FKR.wx = 0.3 }
      setArm(RA, FKR, IKR, wR)
      // ---------- o braço esquerdo: apoia a arma (escopeta sempre; pistola mirando), balança solto ou usa o kit ----------
      let wL = (P.w === 'escopeta' ? 1 : P.w === 'pistola' ? kAim : 0) * (1 - swapK) * (1 - healK) * (dead ? 1 - flop : 1)
      if (tuck > 0) wL *= 1 - tuck
      FKL.x = -0.38 * amp * Math.sin(AN.ph) * (1 + 0.5 * run) + 0.06; FKL.z = 0.1 + 0.06 * run; FKL.tw = 0; FKL.el = -0.22 - 1.0 * run * amp - 0.1 * amp; FKL.wx = 0.1; FKL.wy = 0; FKL.wz = 0
      if (tuck > 0) { FKL.x = lerp(FKL.x, -0.7, tuck); FKL.el = lerp(FKL.el, -1.7, tuck) }
      if (dead) { FKL.x = -0.4 * flop; FKL.z = 1.2 * flop; FKL.el = -0.3; FKL.wx = 0.3 }
      if (wL > 0.001) {
        RA.sh.updateMatrixWorld(true)
        const Wp = W[P.w]
        _p4.copy(Wp.userData.support); if (P.w === 'escopeta') _p4.z -= 0.07 * AN.pump
        Wp.localToWorld(_p4); _p4.applyMatrix4(_inv)
        _p1.set(0, 0, 1).transformDirection(Wp.matrixWorld).transformDirection(_inv)
        lhQFor(_p1, UPV, _q2); ikArm(LA, _p4, POLE_L, _q2, IKL)
      }
      if (healK > 0) { // o kit: tira do cinto, encosta na coxa, aperta
        const h = P.healT, a = sm(h / 0.3), b = sm((h - 0.38) / 0.28), q = sm((h - 1.0) / 0.25)
        _p4.set(0.2, -0.12, 0.1).lerp(_p2.set(0.19, -0.3, 0.04), a * (1 - b)).lerp(_p2.set(0.14, -0.34, 0.13), b * (1 - q))
        _p4.y -= 0.025 * Math.max(0, Math.sin((h - 0.62) * 14)) * b * (1 - q)
        lhQFor(_p1.set(-0.15, -1, 0.35), _p2.set(0, 0, 1), _q2); ikArm(LA, _p4, POLE_L, _q2, IKL); wL = healK
      }
      A.kitHand.visible = P.healT >= 0.15 && P.healT < 0.98
      setArm(LA, FKL, IKL, wL)
      // ---------- a barra da jaqueta: as da frente seguem as coxas, a de trás abre correndo ----------
      A.panels.forEach((pn) => {
        let tg = pn.s ? Math.min(0.06, A.legs[pn.s < 0 ? 0 : 1].th.rotation.x * 0.8) : 0.08 + 0.28 * run * amp + 0.1 * amp
        if (tuck > 0.3) tg = pn.s ? -0.75 : 0.65
        if (dead) tg = pn.s ? -0.2 : 0.3
        pn.v += ((tg - pn.sw) * 120 - pn.v * 14) * dt; pn.sw += pn.v * dt; pn.g.rotation.x = pn.sw
      })
      // a bomba da escopeta corre para trás e volta depois do tiro
      AN.pump = P.pumpT >= 0 ? Math.sin(Math.PI * cl((P.pumpT - 0.3) / 0.32)) : 0
      W.escopeta.userData.pump.position.z = 0.38 - 0.07 * AN.pump
      A.root.updateMatrixWorld(true)
      cableTick()
      hairTick(dt)
    }

    // ---------- o cabelo: verlet nas pontas soltas das mechas ----------
    const _hi = new THREE.Matrix4(), _hc = new THREE.Matrix4(), _hr = new THREE.Matrix4(), _hv = V3(), _hd = V3(), _he = V3(), _ht = V3(), _hl = V3(), _hx = V3(), H_DOWN = V3(0, -1, 0)
    function hairCollide(p) {
      // a cabeça: empurra para fora do casco (ou da pele, onde não tem cabelo: a mecha passa rente à testa)
      _hl.copy(p).applyMatrix4(_hi).sub(HC)
      const pr = _hl.length(), ln = Math.hypot(_hl.x / 0.92, _hl.y / 1.13, _hl.z / 1.02) || 1
      const nx = _hl.x / 0.92 / ln, ny = _hl.y / 1.13 / ln, nz = _hl.z / 1.02 / ln
      const sc = sculpt(nx, ny, nz), sr = Math.hypot(sc[0], sc[1], sc[2]) * HR * Math.max(1, hairK(nx, ny, nz)) * 1.06
      if (pr < sr && pr > 1e-5) { _hl.multiplyScalar(sr / pr).add(HC); p.copy(_hl).applyMatrix4(A.head.matrixWorld) }
      // a gola, os ombros, a mochila
      _hl.copy(p).applyMatrix4(_hc); let moved = false
      for (const b of AH_BODY) { _ht.copy(_hl).sub(b.c); const d = _ht.length(); if (d < b.r && d > 1e-5) { _hl.copy(b.c).addScaledVector(_ht, b.r / d); moved = true } }
      if (moved) p.copy(_hl).applyMatrix4(A.chest.matrixWorld)
    }
    function hairTick(dt) {
      if (dt <= 0) return
      _hi.copy(A.head.matrixWorld).invert(); _hc.copy(A.chest.matrixWorld).invert(); _hr.copy(A.root.matrixWorld).invert()
      const MW = A.head.matrixWorld, F = AH.FREE, P0 = AH.PIN, g = 9.8 * dt * dt, keep = Math.pow(AH.keep, dt * 60)
      for (const L of AH.locks) {
        for (let k = 0; k < P0; k++) { L.pw[k].copy(L.pl[k]).applyMatrix4(MW); L.tw[k].copy(L.tl[k]).transformDirection(MW) }
        const an = L.pw[P0 - 1]
        _he.copy(an).sub(L.pw[P0 - 2]).normalize() // a direção em que a mecha sai do casco
        if (!L.p.length || an.distanceToSquared(L.last) > 0.25) { // começo (ou teleporte): a mecha nasce penteada
          L.p.length = L.q.length = 0; _hv.copy(an)
          for (let j = 0; j < F; j++) { _hd.copy(_he).lerp(H_DOWN, Math.min(1, 0.28 * (j + 1))).normalize(); _hv.addScaledVector(_hd, L.seg); L.p.push(_hv.clone()); L.q.push(_hv.clone()) }
        }
        L.last.copy(an)
        for (let j = 0; j < F; j++) { const p = L.p[j], q = L.q[j]; _ht.copy(p).sub(q).multiplyScalar(keep); q.copy(p); p.add(_ht); p.y -= g } // o embalo e o peso
        _hv.copy(an) // a mola de volta ao penteado: forte perto da raiz, solta na ponta (é ela que deixa a ponta balançar)
        for (let j = 0; j < F; j++) { _hd.copy(_he).lerp(H_DOWN, Math.min(1, 0.28 * (j + 1))).normalize(); _hv.addScaledVector(_hd, L.seg); L.p[j].lerp(_hv, 1 - Math.exp(-(20 - 4 * j) * dt)) }
        for (let it = 0; it < 2; it++) { // o comprimento de cada trecho e as colisões
          let prev = an
          for (let j = 0; j < F; j++) { const p = L.p[j]; _ht.copy(p).sub(prev); const d = _ht.length() || 1e-6; p.copy(prev).addScaledVector(_ht, L.seg / d); hairCollide(p); prev = p }
        }
      }
      // a malha: duas pontas por linha, a largura ao longo do giro da cabeça; afina e ondula na ponta
      const pos = AH.pos, rows = AH.rows
      AH.locks.forEach((L, i) => {
        let prev = L.pw[P0 - 1]
        for (let r = 0; r < rows; r++) {
          const free = r >= P0, j = r - P0, c = free ? L.p[j] : L.pw[r]
          if (free) { _hd.copy(c).sub(prev); const dd = _hd.lengthSq() || 1e-8; _hx.copy(L.tw[P0 - 1]); _hx.addScaledVector(_hd, -_hx.dot(_hd) / dd).normalize(); prev = c } else _hx.copy(L.tw[r])
          const hw = L.w * 0.5 * (free ? 1 - 0.38 * (j + 1) / F : 1), b = (i * rows + r) * 6
          _hv.copy(c); if (free) _hv.addScaledVector(_hx, Math.sin(j * 1.9 + L.li * 1.3) * 0.006)
          _ht.copy(_hv).addScaledVector(_hx, -hw).applyMatrix4(_hr); pos[b] = _ht.x; pos[b + 1] = _ht.y; pos[b + 2] = _ht.z
          _ht.copy(_hv).addScaledVector(_hx, hw).applyMatrix4(_hr); pos[b + 3] = _ht.x; pos[b + 4] = _ht.y; pos[b + 5] = _ht.z
        }
      })
      AH.geo.attributes.position.needsUpdate = true
    }

    // ---------- o cabo vermelho: da mochila até a arma, caindo em curva ----------
    const _c0 = V3(), _c1 = V3(), _cm = V3(), _cp = V3(), _cq = V3(), CABLE_PORT = V3(-0.15, -0.13, -0.05)
    function bez(u, out) { const a = (1 - u) * (1 - u), b = 2 * u * (1 - u), c = u * u; return out.set(_c0.x * a + _cm.x * b + _c1.x * c, _c0.y * a + _cm.y * b + _c1.y * c, _c0.z * a + _cm.z * b + _c1.z * c) }
    function cableTick() {
      const show = P.w !== 'armadilha' || P.swap >= 0
      const w = W[P.w]
      cableSegs.forEach((m) => (m.visible = show))
      if (!show) return
      _c0.copy(CABLE_PORT); A.pack.localToWorld(_c0)
      _c1.copy(w.userData.cable); w.localToWorld(_c1)
      const d = _c0.distanceTo(_c1)
      _cm.addVectors(_c0, _c1).multiplyScalar(0.5); _cm.y -= 0.1 + 0.2 * d
      const n = cableSegs.length
      for (let i = 0; i < n; i++) {
        bez(i / n, _cp); bez((i + 1) / n, _cq)
        const m = cableSegs[i]; m.position.copy(_cp); _cq.sub(_cp); const L = _cq.length() || 1e-3
        m.scale.set(1, L, 1); m.quaternion.setFromUnitVectors(UPV, _cq.multiplyScalar(1 / L))
      }
    }

    // =====================================================================
    // ---------- as armas, em terceira pessoa ----------
    // pistola de plasma: segure para atirar a cada 0,2 s (3 de dano); +3% de calor por tiro; parada, esfria (8%/s, 25%/s depois de 2 s); em 100% trava 5 s e só volta abaixo de 30%
    // escopeta: 5 projéteis de 10 num leque, um tiro por segundo; +30% de calor; só esfria depois de 4 s parada; em 100% trava 8 s
    // armadilha: arremesso em arco (mirando, aparece a linha); gruda onde bate; nela enfraquecida, captura; senão estoura e volta
    // =====================================================================
    const GUN = { heat: 0, lock: 0, cd: 0, idle: 9, hot: false }, SG = { heat: 0, lock: 0, cd: 0, idle: 9, hot: false }
    const HEAT = { pistola: GUN, escopeta: SG }
    const bolts = [], sparks = []
    const boltGeo = new THREE.SphereGeometry(0.045, 6, 4), sparkGeo = new THREE.SphereGeometry(1, 8, 6)
    const addMat = (c, o = 0.95) => new THREE.MeshBasicMaterial({ color: new THREE.Color(c).convertSRGBToLinear(), transparent: true, opacity: o, blending: THREE.AdditiveBlending, depthWrite: false })
    const boltMat = addMat('#ffb050'), pelMat = addMat('#f4ead6') // a brasa da pistola e o sal da escopeta
    const flashL = new THREE.PointLight(new THREE.Color('#ffb060').convertSRGBToLinear(), 0, 7, 2); G.add(flashL)
    const FL_EMBER = new THREE.Color('#ffa850').convertSRGBToLinear(), FL_SALT = new THREE.Color('#fff0d0').convertSRGBToLinear()
    // ---------- os efeitos das armas ocultistas: brasas e cinza (pistola), fagulhas de sal (escopeta), bolhas do frasco ----------
    // um só conjunto de pontos (uma chamada de desenho), com cor por ponto; cada tipo esfria por três cores até sumir
    const OFX_N = 420, ofxPos = new Float32Array(OFX_N * 3), ofxCol = new Float32Array(OFX_N * 3), ofxVel = new Float32Array(OFX_N * 3), ofxLife = new Float32Array(OFX_N), ofxMax = new Float32Array(OFX_N), ofxKind = new Uint8Array(OFX_N), ofxG = new Float32Array(OFX_N), ofxDrag = new Float32Array(OFX_N)
    for (let i = 0; i < OFX_N; i++) ofxPos[i * 3 + 1] = -50
    const ofxGeo = new THREE.BufferGeometry(); ofxGeo.setAttribute('position', new THREE.BufferAttribute(ofxPos, 3)); ofxGeo.setAttribute('color', new THREE.BufferAttribute(ofxCol, 3))
    const ofxDot = canvasTex(16, 16, (g, w, h) => { const gr = g.createRadialGradient(8, 8, 0, 8, 8, 8); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.45, 'rgba(255,255,255,0.7)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h) })
    const ofxPts = new THREE.Points(ofxGeo, new THREE.PointsMaterial({ size: 0.055, map: ofxDot, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); ofxPts.frustumCulled = false; G.add(ofxPts)
    const OFX_C = [ // [nascendo, no meio, sumindo] (linear)
      [[1.0, 0.86, 0.55], [1.0, 0.42, 0.1], [0.28, 0.06, 0.02]], // 0: brasa
      [[1.0, 1.0, 1.0], [0.8, 0.88, 1.0], [0.15, 0.18, 0.24]], // 1: sal
      [[0.75, 1.0, 0.55], [0.3, 0.95, 0.25], [0.02, 0.15, 0.02]], // 2: ectoplasma
      [[1.0, 0.9, 0.6], [0.95, 0.6, 0.2], [0.3, 0.12, 0.03]] ] // 3: luz dourada (correntes, círculo)
    let ofxNext = 0
    function ofx(k, x, y, z, vx, vy, vz, life, g = 0, drag = 1.5) { const i = ofxNext; ofxNext = (ofxNext + 1) % OFX_N; ofxPos[i * 3] = x; ofxPos[i * 3 + 1] = y; ofxPos[i * 3 + 2] = z; ofxVel[i * 3] = vx; ofxVel[i * 3 + 1] = vy; ofxVel[i * 3 + 2] = vz; ofxLife[i] = ofxMax[i] = life; ofxKind[i] = k; ofxG[i] = g; ofxDrag[i] = drag }
    function ofxBurst(k, p, n, sp, life, dir, cone = 1, g = 2, drag = 3) { // um punhado: em volta (sem dir) ou num cone em volta de dir
      for (let j = 0; j < n; j++) {
        let vx = R() - 0.5, vy = R() - 0.5, vz = R() - 0.5; const l = Math.hypot(vx, vy, vz) || 1; vx /= l; vy /= l; vz /= l
        if (dir) { vx = dir.x + vx * cone; vy = dir.y + vy * cone; vz = dir.z + vz * cone }
        const s2 = sp * (0.4 + 0.6 * R()); ofx(k, p.x, p.y, p.z, vx * s2, vy * s2, vz * s2, life * (0.6 + 0.6 * R()), g, drag)
      }
    }
    function ofxTick(dt) {
      let any = false
      for (let i = 0; i < OFX_N; i++) {
        if (ofxLife[i] <= 0) continue
        ofxLife[i] -= dt; const j = i * 3
        if (ofxLife[i] <= 0) { ofxPos[j + 1] = -50; ofxCol[j] = ofxCol[j + 1] = ofxCol[j + 2] = 0; any = true; continue }
        any = true; const dr = Math.exp(-ofxDrag[i] * dt)
        ofxVel[j] *= dr; ofxVel[j + 1] = ofxVel[j + 1] * dr - ofxG[i] * dt; ofxVel[j + 2] *= dr
        ofxPos[j] += ofxVel[j] * dt; ofxPos[j + 1] += ofxVel[j + 1] * dt; ofxPos[j + 2] += ofxVel[j + 2] * dt
        const u = 1 - ofxLife[i] / ofxMax[i], C3 = OFX_C[ofxKind[i]], a = u < 0.35 ? C3[0] : C3[1], b = u < 0.35 ? C3[1] : C3[2], f = u < 0.35 ? u / 0.35 : (u - 0.35) / 0.65, fade = 1 - u * u
        ofxCol[j] = (a[0] + (b[0] - a[0]) * f) * fade; ofxCol[j + 1] = (a[1] + (b[1] - a[1]) * f) * fade; ofxCol[j + 2] = (a[2] + (b[2] - a[2]) * f) * fade
      }
      if (any) { ofxGeo.attributes.position.needsUpdate = true; ofxGeo.attributes.color.needsUpdate = true }
    }
    function ofxClear() { ofxLife.fill(0); for (let i = 0; i < OFX_N; i++) ofxPos[i * 3 + 1] = -50; ofxCol.fill(0); ofxGeo.attributes.position.needsUpdate = ofxGeo.attributes.color.needsUpdate = true }
    // o sino na boca da pistola: um anel dourado que abre e some (de frente para a câmera)
    const RINGS = [0, 1, 2, 3].map(() => { const m = new THREE.Mesh(new THREE.RingGeometry(0.78, 1, 20), addMat('#ffd27a', 0.8)); m.visible = false; m.frustumCulled = false; G.add(m); return { m, t: 9 } }); let ringI = 0
    function bellRing(p, r = 0.12) { const R0 = RINGS[ringI]; ringI = (ringI + 1) % RINGS.length; R0.m.position.copy(p); R0.t = 0; R0.r = r; R0.m.visible = true }
    function ringsTick(dt) { for (const r of RINGS) { if (!r.m.visible) continue; r.t += dt; const u = r.t / 0.16; if (u >= 1) { r.m.visible = false; continue } r.m.scale.setScalar(r.r * (0.25 + u)); r.m.material.opacity = 0.8 * (1 - u); r.m.quaternion.copy(camera.quaternion) } }
    const _mz = V3(), _bd = V3(), _bt = V3(), _bf = V3(), _bh = { t: 0, kind: 'none', p: V3(), ref: null }
    const jitter = (d, a) => { d.x += (R() - 0.5) * 2 * a; d.y += (R() - 0.5) * 2 * a; d.z += (R() - 0.5) * 2 * a; return d.normalize() }
    function muzzle(out) { const w = W[P.w]; w.updateWorldMatrix(true, false); return w.localToWorld(out.copy(w.userData.muzzle)) }
    function camFwd(out) { return out.set(Math.sin(C.yaw) * Math.cos(C.pitch), Math.sin(C.pitch), Math.cos(C.yaw) * Math.cos(C.pitch)) }
    function aimPoint(out) { // o ponto que a mira encontra (perto demais da câmera, atrás do ombro: a linha da mira lá na frente)
      if (AIM.kind !== 'none' && AIM.t > camera.position.distanceTo(P.pos) + 0.6) return out.copy(AIM.p)
      return out.copy(camera.position).addScaledVector(camFwd(_bf), 30)
    }
    function fireBolt(from, dir, speed, dmg, mat, life, len, k = 0) {
      const m = new THREE.Mesh(boltGeo, mat); m.scale.set(1, 1, len); m.position.copy(from); m.lookAt(_bt.copy(from).add(dir)); m.castShadow = false; m.frustumCulled = false; G.add(m)
      bolts.push({ m, v: dir.clone().multiplyScalar(speed), life, dmg, k })
    }
    function spark(p, col, r = 0.16) { const m = new THREE.Mesh(sparkGeo, addMat(col, 0.9)); m.position.copy(p); m.scale.setScalar(0.02); m.castShadow = false; G.add(m); sparks.push({ m, t: 0, r }) }
    function shootPistol() {
      GUN.cd = T.pistola.cd; GUN.idle = 0; GUN.heat = Math.min(100, GUN.heat + T.pistola.calor)
      if (GUN.heat >= 100) { GUN.hot = true; GUN.lock = T.pistola.trava; SFX.fps('oOverheat'); say('Pistola superaquecida: espere esfriar (ou troque de arma)') }
      muzzle(_mz); aimPoint(_bt); const dir = _bd.copy(_bt).sub(_mz).normalize()
      jitter(dir, lerp(0.028, 0.004, P.aimW) + 0.012 * Math.min(1, P.speed / 2.4) * (1 - 0.6 * P.aimW)) // da cintura e andando, espalha mais
      fireBolt(_mz, dir, T.pistola.vel, T.pistola.dano, boltMat, 0.9, 6, 0)
      ofxBurst(0, _mz, 7, 2.2, 0.35, dir, 0.7, -0.5, 4); bellRing(_mz) // brasas saindo da boca em sino e o anel do sino
      flashL.color.copy(FL_EMBER); flashL.position.copy(_mz); flashL.intensity = 3; P.kick = Math.min(1, P.kick + 0.55); P.fireHold = 0.7
      SFX.fps('oPistol'); P.stats.shots++
    }
    function shootShotgun() {
      SG.cd = T.escopeta.cd; SG.idle = 0; SG.heat = Math.min(100, SG.heat + T.escopeta.calor)
      if (SG.heat >= 100) { SG.hot = true; SG.lock = T.escopeta.trava; SFX.fps('oOverheat'); say('Escopeta superaquecida: trava por 8 s') }
      muzzle(_mz); aimPoint(_bt); const base = _bt.sub(_mz).normalize().clone()
      const up = Math.abs(base.y) > 0.95 ? V3(1, 0, 0) : V3(0, 1, 0), rg = V3().crossVectors(base, up).normalize(), u2 = V3().crossVectors(rg, base)
      const spread = T.escopeta.leque * (1.4 - 0.4 * P.aimW)
      for (let i = 0; i < T.escopeta.n; i++) { // o leque: de longe nem todos acertam
        const a = i === 0 ? 0 : (i - 1) * Math.PI / 2 + (R() - 0.5) * 0.8, rr = i === 0 ? 0 : spread * (0.6 + 0.4 * R())
        fireBolt(_mz, base.clone().addScaledVector(rg, Math.cos(a) * rr).addScaledVector(u2, Math.sin(a) * rr).normalize(), T.escopeta.vel, T.escopeta.dano, pelMat, 0.6, 4, 1)
      }
      ofxBurst(1, _mz, 30, 9, 0.3, base, 0.45, 1.5, 6) // o leque de fagulhas de sal
      ofxBurst(0, _mz, 6, 1.2, 0.5, base, 1, -0.6, 3) // e um sopro de brasa
      flashL.color.copy(FL_SALT); flashL.position.copy(_mz); flashL.intensity = 4.5; P.kick = 1; P.fireHold = 0.9; P.pumpT = 0; C.shake = Math.max(C.shake, 0.22); C.pitch = Math.min(0.8, C.pitch + 0.025)
      SFX.fps('oShotgun'); P.stats.shots += T.escopeta.n
    }
    function showWeapon() {
      W.pistola.visible = P.w === 'pistola'; W.escopeta.visible = P.w === 'escopeta'
      W.armadilha.visible = P.w === 'armadilha' && TRAP.state === 'hand'
      A.beltTrap.visible = TRAP.state === 'hand' && P.w !== 'armadilha'
    }
    const VIAL = { cold: new THREE.Color('#9cff7a').convertSRGBToLinear(), hot: new THREE.Color('#eaff80').convertSRGBToLinear() }
    const SIGC = { cold: new THREE.Color('#6a3a14').convertSRGBToLinear(), warm: new THREE.Color('#ffb050').convertSRGBToLinear(), hot: new THREE.Color('#fff0c0').convertSRGBToLinear(), red: new THREE.Color('#ff3020').convertSRGBToLinear(), dim: new THREE.Color('#300c04').convertSRGBToLinear(), cur: new THREE.Color() }
    const COIL = { cold: new THREE.Color(PLASMA).convertSRGBToLinear(), warm: new THREE.Color('#ffd060').convertSRGBToLinear(), hot: new THREE.Color('#ff6a20').convertSRGBToLinear(), red: new THREE.Color('#ff3020').convertSRGBToLinear(), dim: new THREE.Color('#601008').convertSRGBToLinear() }
    function gunTick(t, dt) {
      const can = D.playing && P.dead < 0 && (D.mode === 'intro' || D.mode === 'fight')
      const firing = IN.fire && can && P.dodge < 0 && P.swap < 0 && P.healT < 0 && P.stagger <= 0
      const facing = Math.abs(dAng(P.yaw, C.yaw)) < 0.5 // vira para a mira antes do primeiro tiro
      GUN.cd = Math.max(0, GUN.cd - dt); GUN.idle += dt
      if (GUN.lock > 0) { GUN.lock -= dt; if (GUN.lock <= 0) SFX.fps('oCool') }
      else if (GUN.idle > 0.6) GUN.heat = Math.max(0, GUN.heat - (GUN.idle > 2 ? 25 : 8) * dt)
      if (GUN.hot && GUN.lock <= 0 && GUN.heat <= 30) GUN.hot = false
      SG.cd = Math.max(0, SG.cd - dt); SG.idle += dt
      if (SG.lock > 0) { SG.lock -= dt; if (SG.lock <= 0) SFX.fps('oCool') }
      else if (SG.idle > 4) SG.heat = Math.max(0, SG.heat - 25 * dt)
      if (SG.hot && SG.lock <= 0 && SG.heat <= 30) SG.hot = false
      if (P.pumpT >= 0) { const p0 = P.pumpT; P.pumpT += dt; if (p0 < 0.3 && P.pumpT >= 0.3) SFX.fps('oPump'); if (P.pumpT > 0.7) P.pumpT = -1 }
      if (firing) {
        if (P.w !== 'armadilha') P.fireHold = Math.max(P.fireHold, 0.35)
        if (P.w === 'pistola') { if (GUN.hot) { if (GUN.cd <= 0) { GUN.cd = 0.5; SFX.fps('deny') } } else if (GUN.cd <= 0 && facing) shootPistol() }
        else if (P.w === 'escopeta') { if (SG.hot) { if (SG.cd <= 0) { SG.cd = 0.6; SFX.fps('deny') } } else if (SG.cd <= 0 && facing && P.pumpT < 0) shootShotgun() }
        else if (IN.firePress && TRAP.state === 'hand' && P.throwT < 0) { P.throwT = 0; P.fireHold = 0.6 }
        else if (IN.firePress && TRAP.state === 'stuck') trapRecall()
      }
      IN.firePress = false
      P.kick = Math.max(0, P.kick - dt * (P.w === 'escopeta' ? 3.5 : 7))
      flashL.intensity = Math.max(0, flashL.intensity - dt * 40)
      // a troca: a arma nova aparece na metade, quando a mão passa no coldre
      if (P.swap >= 0) { P.swap += dt; if (P.swap >= 0.22 && P.wNext && P.wNext !== P.w) { P.wLast = P.w; P.w = P.wNext; showWeapon() } if (P.swap >= 0.45) { P.swap = -1; P.wNext = null } }
      // o arremesso solta a armadilha no meio do balanço
      if (P.throwT >= 0) { const t0 = P.throwT; P.throwT += dt; if (t0 < 0.22 && P.throwT >= 0.22) releaseTrap(); if (P.throwT > 0.6) P.throwT = -1 }
      // as bobinas mostram o calor: verde-água frio, amarelo, laranja; vermelho piscando na sobrecarga
      for (const k of ['pistola', 'escopeta']) {
        const H = HEAT[k], hh = H.heat / 100
        if (H.hot) SIGC.cur.copy(Math.sin(t * 30) > 0 ? SIGC.red : SIGC.dim)
        else if (hh < 0.5) SIGC.cur.copy(SIGC.cold).lerp(SIGC.warm, hh / 0.5 * 0.35) // frio: brasa quase apagada; vai acendendo
        else SIGC.cur.copy(SIGC.warm).lerp(SIGC.hot, (hh - 0.5) / 0.5)
        W[k].userData.coils[0].material.color.copy(SIGC.cur)
        if (k === 'escopeta') { const hk = Math.max(GUN.heat, SG.heat) / 100, hot = GUN.hot || SG.hot; AGM.rune.color.copy(RUNEC.dim).lerp(RUNEC.hot, hk * hk); if (hot) AGM.rune.color.copy(Math.sin(t * 22) > 0 ? RUNEC.red : RUNEC.dim) } // as runas do traje acendem com a sobrecarga
        if (W[k].visible && (H.hot || hh > 0.75) && R() < (H.hot ? 0.5 : (hh - 0.75) * 1.6)) { // quente: brasas subindo da arma
          W[k].updateWorldMatrix(true, false); _bf.set((R() - 0.5) * 0.04, 0.06, 0.12 + R() * 0.18).applyMatrix4(W[k].matrixWorld); ofx(0, _bf.x, _bf.y, _bf.z, (R() - 0.5) * 0.2, 0.25 + R() * 0.3, (R() - 0.5) * 0.2, 0.6 + R() * 0.4, -0.4, 1.5)
        }
      }
      { // o frasco de ectoplasma: brilha mais com o calor, borbulha e, superaquecido, ferve
        const vial = W.pistola.userData.vial, hh = GUN.heat / 100
        vial.material.color.copy(VIAL.cold).lerp(VIAL.hot, hh).multiplyScalar(GUN.hot ? 0.75 + 0.5 * Math.abs(Math.sin(t * 23)) : 0.9 + 0.1 * Math.sin(t * 5))
        if (W.pistola.visible && R() < 0.06 + hh * 0.5 + (GUN.hot ? 0.4 : 0)) { vial.updateWorldMatrix(true, false); _bf.set(0, 0.012, (R() - 0.5) * 0.09).applyMatrix4(vial.matrixWorld); ofx(2, _bf.x, _bf.y, _bf.z, (R() - 0.5) * 0.05, 0.12 + R() * 0.15 + (GUN.hot ? 0.25 : 0), (R() - 0.5) * 0.05, 0.35 + R() * 0.3, -0.2, 2) }
      }
      ofxTick(dt); ringsTick(dt)
    }
    function boltsTick(dt) {
      for (let i = bolts.length - 1; i >= 0; i--) {
        const b = bolts[i]; b.life -= dt
        const step = b.v.length() * dt; _bd.copy(b.v).multiplyScalar(1 / Math.max(1e-6, b.v.length()))
        castRay(b.m.position, _bd, step, _bh)
        let dead = b.life <= 0
        if (_bh.kind !== 'none') {
          dead = true
          const p = _bh.p
          if (_bh.kind === 'mae' || _bh.kind === 'head') hurtMae(b.dmg, _bh.kind === 'head', p)
          else if (_bh.kind === 'enemy' || _bh.kind === 'ehead' || _bh.kind === 'core') hurtFoe(_bh.ref, b.dmg, _bh.kind, p)
          else if (_bh.kind === 'crib') hitCrib(b.dmg, p)
          else if (_bh.kind === 'ecto') insEctoHit(_bh.ref, b.dmg, p)
          else if (_bh.kind === 'tornado') { spark(p, '#4a3a44', 0.12); for (let k = 0; k < 3; k++) LUTA.drop(p.x, p.y, p.z, (R() - 0.5) * 2, R() * 1.2, (R() - 0.5) * 2, 1.2) }
          else { spark(p, b.k ? '#fff3d0' : '#ffb050', 0.14); if (R() < 0.5) SFX.fps('oHit') }
          ofxBurst(b.k, p, b.k ? 7 : 9, b.k ? 3.2 : 2.2, b.k ? 0.35 : 0.55, null, 1, b.k ? 3 : -0.8, 3.5) // a brasa (ou o sal) estoura onde bate
        } else { b.m.position.addScaledVector(b.v, dt); if (R() < (b.k ? 0.45 : 0.9)) { const p = b.m.position; ofx(b.k, p.x, p.y, p.z, (R() - 0.5) * 0.3, (R() - 0.5) * 0.3 + (b.k ? 0 : 0.25), (R() - 0.5) * 0.3, b.k ? 0.18 : 0.45, b.k ? 1 : -0.3, 2) } } // o rastro: cinza luminosa / sal
        if (dead) { G.remove(b.m); bolts.splice(i, 1) }
      }
      for (let i = sparks.length - 1; i >= 0; i--) { const f = sparks[i]; f.t += dt; const u = f.t / 0.18; f.m.scale.setScalar(f.r * (0.3 + u)); f.m.material.opacity = 0.9 * (1 - Math.min(1, u)); if (u >= 1) { G.remove(f.m); f.m.material.dispose(); sparks.splice(i, 1) } }
    }
    function clearShots() { bolts.forEach((b) => G.remove(b.m)); bolts.length = 0; sparks.forEach((f) => { G.remove(f.m); f.m.material.dispose() }); sparks.length = 0; flashL.intensity = 0; ofxClear(); RINGS.forEach((r) => (r.m.visible = false)) }

    // ---------- a armadilha ----------
    const TRAP = { state: 'hand', pos: V3(), vel: V3(), t: 0, onMae: false, off: V3(), win: false, from: V3() }
    const trapG = trapModel(); trapG.scale.setScalar(1.7); trapG.visible = false; G.add(trapG) // no chão: um pouco maior, para ler de longe
    const trapRing = trapG.userData.ring
    // as correntes de luz: um cilindro com elos desenhados, correndo da armadilha até ela
    const chainTex = canvasTex(16, 32, (g, w, h) => { g.fillStyle = '#000'; g.fillRect(0, 0, w, h); g.strokeStyle = '#ffd27a'; g.lineWidth = 2.5; g.beginPath(); g.ellipse(8, 8, 5, 7, 0, 0, 7); g.stroke(); g.fillStyle = '#ffd27a'; g.fillRect(6.5, 17, 3, 14) })
    chainTex.magFilter = THREE.LinearFilter
    const beams = [0, 1, 2].map(() => { const mat = addMat('#ffffff', 0.95); mat.map = chainTex.clone(); mat.map.needsUpdate = true; const m = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1, 6, 1, true).translate(0, 0.5, 0), mat); mat.side = THREE.DoubleSide; m.visible = false; m.frustumCulled = false; G.add(m); return m })
    // o círculo ritual no chão, embaixo do relicário
    const ritTex = canvasTex(128, 128, (g, w, h) => {
      g.fillStyle = '#000'; g.fillRect(0, 0, w, h); g.strokeStyle = '#ffd27a'; g.lineWidth = 2; const c = 64
      g.beginPath(); g.arc(c, c, 60, 0, 7); g.stroke(); g.beginPath(); g.arc(c, c, 48, 0, 7); g.stroke(); g.lineWidth = 1.5
      for (const a0 of [-Math.PI / 2, Math.PI / 2]) { g.beginPath(); for (let k = 0; k < 4; k++) { const a = a0 + k * Math.PI * 2 / 3; const x = c + Math.cos(a) * 47, y = c + Math.sin(a) * 47; k ? g.lineTo(x, y) : g.moveTo(x, y) } g.stroke() }
      g.fillStyle = '#ffd27a'; for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2, x = c + Math.cos(a) * 54, y = c + Math.sin(a) * 54; g.save(); g.translate(x, y); g.rotate(a); g.fillRect(-1, -3, 2, 6); if (k % 2) g.fillRect(-3, -1, 6, 2); g.restore() }
    })
    ritTex.magFilter = THREE.LinearFilter
    const rit = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 1.7), addMat('#ffffff', 0)); rit.material.map = ritTex; rit.rotation.x = -Math.PI / 2; rit.visible = false; rit.frustumCulled = false; rit.renderOrder = 2; G.add(rit)
    const RIT = { k: 0, want: 0 }
    const ARC_N = 28, arcPos = new Float32Array(ARC_N * 3), arcGeo = new THREE.BufferGeometry(); arcGeo.setAttribute('position', new THREE.BufferAttribute(arcPos, 3))
    const arc = new THREE.Points(arcGeo, new THREE.PointsMaterial({ color: new THREE.Color('#ffd27a').convertSRGBToLinear(), size: 0.06, transparent: true, opacity: 0.85, depthWrite: false })); arc.frustumCulled = false; arc.visible = false; G.add(arc)
    const land = new THREE.Mesh(new THREE.RingGeometry(0.42, 0.5, 28), addMat('#ffd27a', 0.6)); land.rotation.x = -Math.PI / 2; land.visible = false; G.add(land)
    const hitsMae = (p, r) => MS.some((s) => s.on && s.c.distanceToSquared(p) < (s.r + r) * (s.r + r))
    function trapVel(from, out) { aimPoint(_bt); out.copy(_bt).sub(from).normalize().multiplyScalar(11); out.y += 1.6; return out }
    function trapBlocked(p) { if (D.zone === 'intro') return INS.cols.some((c) => !c.off && p.y < c.y1 && p.y > c.y0 - 0.05 && distOBB(p.x, p.z, c) < 0.05); return Math.abs(p.x) > RW - 0.08 || Math.abs(p.z) > RD - 0.08 || OBS.some((o) => p.y < o.y1 && distOBB(p.x, p.z, o) < 0.05) || (!B.cribBroken && p.y < CRIB_BOX.y1 && distOBB(p.x, p.z, CRIB_BOX) < 0.05) }
    function releaseTrap() {
      W.armadilha.getWorldPosition(TRAP.pos); trapVel(TRAP.pos, TRAP.vel)
      TRAP.state = 'fly'; TRAP.t = 0; TRAP.onMae = false; trapRing.material.color.copy(RELIC.on); trapG.visible = true; trapG.position.copy(TRAP.pos); trapG.rotation.set(0, 0, 0)
      SFX.fps('oTrapThrow'); showWeapon()
    }
    function trapRecall() { if (TRAP.state === 'stuck') { TRAP.state = 'return'; TRAP.t = 0; TRAP.from.copy(TRAP.pos); SFX.fps('oTrapThrow') } }
    function trapHome() { TRAP.state = 'hand'; trapG.visible = false; beams.forEach((b) => (b.visible = false)); RIT.k = 0; rit.visible = false; showWeapon() }
    function trapStick(onMae) { TRAP.state = 'stuck'; TRAP.t = 0; TRAP.onMae = onMae; trapG.rotation.set(0, 0, 0); SFX.fps('oTrapStick'); if (onMae) trapZap() }
    function trapZap() { // a sorte é tirada no começo: enfraquecida, segura; senão o raio falha
      TRAP.t = 0; TRAP.win = B.mode === 'weak'; TRAP.state = TRAP.win ? 'capture' : 'zap'; SFX.fps('oTrapZap', TRAP.win ? 'win' : '')
      if (TRAP.win) beginCapture()
    }
    const _tb = V3()
    function ritTick(dt) {
      const S = TRAP, st = S.state
      RIT.want = st === 'capture' ? 1 : st === 'zap' ? 0.8 : st === 'stuck' ? 0.35 : 0
      RIT.k = damp(RIT.k, RIT.want, RIT.want > RIT.k ? 4 : 6, dt)
      rit.visible = RIT.k > 0.01; if (!rit.visible) return
      rit.position.set(S.pos.x, 0.024, S.pos.z); rit.rotation.z += dt * (0.25 + 1.6 * (st === 'capture' ? 1 : 0))
      const pulse = st === 'stuck' ? 0.75 + 0.25 * Math.sin(S.t * 3) : 0.85 + 0.15 * Math.sin(S.t * 14)
      rit.material.opacity = RIT.k * pulse; rit.scale.setScalar(0.6 + 0.4 * Math.min(1, RIT.k * 1.4) + (st === 'capture' ? 0.12 * Math.min(1, S.t) : 0))
    }
    function trapTick(dt) {
      const S = TRAP, L = LUTA.L
      ritTick(dt)
      if (S.state === 'hand') return
      S.t += dt
      if (S.state === 'fly') {
        const n = Math.max(1, Math.ceil(S.vel.length() * dt / 0.06)), h = dt / n
        for (let i = 0; i < n; i++) {
          _tb.copy(S.pos); S.vel.y -= 9.8 * h; S.pos.addScaledVector(S.vel, h)
          if (maeTouchable() && hitsMae(S.pos, 0.1)) { S.off.copy(S.pos).sub(L.pos); trapStick(true); break }
          if (S.pos.y <= 0.03) { S.pos.y = 0.03; trapStick(false); break }
          if (trapBlocked(S.pos)) { S.pos.x = _tb.x; S.pos.z = _tb.z; S.vel.x *= -0.25; S.vel.z *= -0.25; SFX.fps('impact', { k: 'x', v: 0.4 }) } // bate e cai
        }
        trapG.position.copy(S.pos); trapG.rotation.x += dt * 9
        if (S.state === 'fly' && S.t > 4) trapStick(false)
      } else if (S.state === 'icap') { insTrapCapTick(S, dt)
      } else if (S.state === 'stuck') {
        if (S.onMae) { S.pos.copy(L.pos).add(S.off) }
        trapG.position.copy(S.pos)
        if (D.kind === 'intro') insTrapCheck(S)
        trapRing.material.color.copy(Math.sin(S.t * 6) > 0 ? RELIC.on : RELIC.dim)
        if (maeTouchable() && Math.hypot(L.pos.x - S.pos.x, L.pos.z - S.pos.z) < 0.85) { S.onMae = true; S.off.copy(S.pos).sub(L.pos); trapZap() } // ela pisou perto
      } else if (S.state === 'zap' || S.state === 'capture') {
        trapG.position.copy(S.pos)
        trapRing.material.color.copy(Math.sin(S.t * 40) > 0 ? RELIC.hot : RELIC.on)
        // os raios: da armadilha até a cabeça, o peito e a barra dela
        const tg = [MS[0].c, MS[2].c, MS[4].c]
        beams.forEach((m, i) => {
          const on = maeGroup.visible && (S.state === 'capture' ? S.t < 3.0 : S.t < 0.9)
          m.visible = on; if (!on) return
          _bt.copy(tg[i]).add(_bf.set((R() - 0.5) * 0.06, (R() - 0.5) * 0.06, (R() - 0.5) * 0.06)).sub(S.pos); const len = _bt.length() || 0.01
          m.position.copy(S.pos); m.position.y += 0.1; m.scale.set(1, len, 1); m.quaternion.setFromUnitVectors(UPV, _bt.multiplyScalar(1 / len))
          m.material.map.repeat.set(2, len * 7); m.material.map.offset.y -= dt * (S.state === 'capture' ? 3 : 1.5) // os elos correm até ela
          if (R() < 0.35) { const u = R(); ofx(3, S.pos.x + _bt.x * len * u, S.pos.y + 0.1 + _bt.y * len * u, S.pos.z + _bt.z * len * u, (R() - 0.5) * 0.4, (R() - 0.5) * 0.4, (R() - 0.5) * 0.4, 0.4, 0, 2) } // fagulhas soltando dos elos
        })
        if (S.state === 'zap' && S.t > 0.9 && !S.win) { // falhou: estoura e volta para a mão
          SFX.fps('trapStrain'); SFX.fps('trapBurst'); LUTA.flinch(1); LUTA.splash(L.pos.x, L.pos.z, 30, 2, 3)
          const d = Math.hypot(P.pos.x - S.pos.x, P.pos.z - S.pos.z); if (d < 2.5) { const k = (2.5 - d) / 2.5 * 7; P.knock.set((P.pos.x - S.pos.x) / (d || 1) * k, 0, (P.pos.z - S.pos.z) / (d || 1) * k); C.shake = Math.max(C.shake, 0.5) }
          say('A armadilha não segura: ela ainda tem força. Zere a última barra (enfraquecida) e jogue de novo.')
          beams.forEach((m) => (m.visible = false)); S.state = 'return'; S.t = 0; S.from.copy(S.pos)
        }
        if (S.state === 'capture') captureTick(S.t)
      } else if (S.state === 'return') { // volta voando para a mão
        const u = cl(S.t / 0.45)
        W.armadilha.getWorldPosition(_bt); if (P.w !== 'armadilha') A.beltTrap.getWorldPosition(_bt)
        trapG.position.lerpVectors(S.from, _bt, u * u); trapG.position.y += Math.sin(Math.PI * u) * 0.8; trapG.rotation.x += dt * 12
        if (u >= 1) { trapHome(); SFX.fps('slot') }
      }
    }
    function arcTick() { // a linha do arremesso, mirando com a armadilha na mão
      const show = P.w === 'armadilha' && TRAP.state === 'hand' && P.aimW > 0.4 && P.throwT < 0 && P.swap < 0 && D.playing && P.dead < 0
      arc.visible = land.visible = show
      if (!show) return
      W.armadilha.getWorldPosition(_p1); trapVel(_p1, _p2)
      const p = _p3.copy(_p1), v = _p4.copy(_p2), h = 0.045
      let n = 0, hit = false
      for (let i = 0; i < 120 && n < ARC_N; i++) {
        v.y -= 9.8 * h; p.addScaledVector(v, h)
        if (i % 2 === 0) { arcPos[n * 3] = p.x; arcPos[n * 3 + 1] = p.y; arcPos[n * 3 + 2] = p.z; n++ }
        if (p.y <= 0.03 || trapBlocked(p) || (maeTouchable() && hitsMae(p, 0.1))) { hit = true; break }
      }
      for (let i = n; i < ARC_N; i++) { arcPos[i * 3] = p.x; arcPos[i * 3 + 1] = p.y; arcPos[i * 3 + 2] = p.z }
      arcGeo.attributes.position.needsUpdate = true
      land.visible = hit; land.position.set(p.x, Math.max(0.015, p.y < 0.2 ? 0.015 : p.y), p.z)
      land.material.color.copy(maeTouchable() && hitsMae(p, 0.1) ? (B.mode === 'weak' ? RELIC.hot : COIL.red) : RELIC.on)
    }

    // =====================================================================
