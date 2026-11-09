  // ---------- O Espectral e o Glutão (inimigos comuns da demo em terceira pessoa) ----------
  // caveira sob um capuz de membrana azul transparente. O Espectral tem corpo de serpente (a espinha é uma
  // corrente: cada vértebra segue a anterior com atraso); o Glutão é a versão grande e evoluída, com as
  // almas que devorou girando no núcleo, entre as costelas
  // =====================================================================
  function ditherMat(mt, U, tag) { // some num pontilhado (estilo PS1, sem problema de ordem de transparência)
    const prev = mt.onBeforeCompile
    mt.onBeforeCompile = (sh) => {
      prev(sh); sh.uniforms.uFade = U.uFade
      sh.fragmentShader = 'uniform float uFade;\n' + sh.fragmentShader.replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>
      {
        vec2 q = mod(floor(gl_FragCoord.xy), 4.0);
        vec2 a = mod(q, 2.0), c = floor(q / 2.0);
        float b = (mod(2.0 * a.x + 3.0 * a.y, 4.0) * 4.0 + mod(2.0 * c.x + 3.0 * c.y, 4.0)) / 16.0;
        if (b < uFade) discard;
      }`)
    }
    const key = mt.customProgramCacheKey()
    mt.customProgramCacheKey = () => key + '-' + tag
    return mt
  }
  function ghostMats(tag, col, em, fade) {
    const U = { uFade: { value: fade } }, UM = { uFade: { value: Math.min(0.85, fade + 0.15) } }, UB = { uFade: { value: 0 } }, RIM = { value: 0.45 }
    return {
      U, UM, UB, fade, eyes: [],
      cloak: rimGlow(ditherMat(std({ color: col, emissive: em, side: THREE.DoubleSide, hl: true }), U, tag + 'c'), RIM),
      memb: rimGlow(ditherMat(std({ color: col, emissive: em, side: THREE.DoubleSide, hl: true, flatShading: false }), UM, tag + 'm'), RIM),
      RIM, drool: ditherMat(basic({ color: '#a8eeff' }), U, tag + 'g'), heart: ditherMat(basic({ color: '#d8f8ff' }), UB, tag + 'h'),
      bone: ditherMat(std({ color: '#a29d88', emissive: '#0a1212', hl: true }), UB, tag + 'b'), // osso velho, sujo
      dark: ditherMat(basic({ color: '#02080c' }), UB, tag + 'd'),
      eye: basic({ color: '#7fe2ff' }), // azul brilhante
    }
  }
  // capuz: uma calota virada para trás, aberta na frente
  const hoodGeo = (r) => new THREE.SphereGeometry(r, 14, 9, 0, Math.PI * 2, 0, Math.PI * 0.64).rotateX(-Math.PI / 2)
  // o brilho dos olhos: um halo azul somado por cima (não depende de luz)
  const haloTex = canvasTex(32, 32, (g, w, h) => { const gr = g.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(160,230,255,0.7)'); gr.addColorStop(1, 'rgba(60,180,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h) })
  haloTex.magFilter = haloTex.minFilter = THREE.LinearFilter
  const haloMat = new THREE.SpriteMaterial({ map: haloTex, color: new THREE.Color('#5cc8ff').convertSRGBToLinear(), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true })
  function buildSkull(parent, sc, mt, o = {}) { // crânio comprido e magro: testa saltada sobre órbitas fundas e inclinadas, têmporas fundas, rachaduras, dentes tortos, a mandíbula desencaixada
    const g = group(parent); g.scale.setScalar(sc)
    const geo = new THREE.SphereGeometry(0.1, 16, 12), p = geo.attributes.position
    for (let i = 0; i < p.count; i++) {
      let x = p.getX(i) * 0.8, y = p.getY(i) * 1.08, z = p.getZ(i) * 1.1
      if (z > 0) {
        const f = Math.min(1, z / 0.05)
        z -= 0.058 * (bump(x, y, -0.034, -0.006, 0.033, 0.03) + bump(x, y, 0.034, -0.006, 0.033, 0.03)) * f // órbitas fundas
        z += 0.018 * (bump(x, y, -0.03, 0.036, 0.042, 0.013) + bump(x, y, 0.03, 0.036, 0.042, 0.013)) * f // a testa salta por cima e faz sombra nos olhos
        z -= 0.026 * bump(x, y, 0, -0.044, 0.013, 0.021) * f // o buraco do nariz
        z += 0.012 * (bump(x, y, -0.05, -0.038, 0.016, 0.012) + bump(x, y, 0.05, -0.038, 0.016, 0.012)) * f // maçãs pontudas
      }
      x -= Math.sign(x) * 0.014 * bump(Math.abs(x), y, 0.07, 0.0, 0.03, 0.045) // têmporas fundas
      if (y < -0.03) { x *= 0.72; z = z * 0.88 + 0.008; y -= (-0.03 - y) * 0.45 } // maxilar estreito e o rosto esticado para baixo
      p.setXYZ(i, x, y, z)
    }
    geo.computeVertexNormals()
    mesh(geo, mt.bone, g)
    const R = rng(o.seed || 5)
    for (const s of [-1, 1]) {
      mesh(sphere(0.031, 7, 5), mt.dark, g, [s * 0.034, -0.006, 0.062], [0, 0, s * 0.38], [1.3, 0.85, 0.7]) // órbitas inclinadas: o canto de dentro desce
      const e = mesh(sphere(0.0055, 5, 4), mt.eye, g, [s * 0.031, -0.01, 0.086]); mt.eyes.push(e) // um ponto pequeno no fundo da órbita escura
      const halo = new THREE.Sprite(haloMat); halo.scale.setScalar(0.06); halo.position.z = 0.006; e.add(halo)
      if (o.asym && s < 0) e.scale.setScalar(0.55)
    }
    mesh(new THREE.ConeGeometry(0.015, 0.032, 3).rotateZ(Math.PI), mt.dark, g, [0, -0.046, 0.094], null, [1, 1, 0.5]) // nariz
    mesh(new THREE.BoxGeometry(0.068, 0.034, 0.05), mt.dark, g, [0, -0.1, 0.028]) // o escuro da boca
    ;[[0.024, 0.07, 0.07, 0.35, 0.05], [0.04, 0.045, 0.07, -0.5, 0.035], [-0.045, 0.06, 0.06, 0.9, 0.03], [-0.02, -0.02, 0.085, 0.2, 0.025]].forEach(([x, y, z, r, l]) => mesh(new THREE.BoxGeometry(0.0035, l, 0.004), mt.dark, g, [x, y, z], [0.4, 0, r])) // rachaduras
    for (let k = 0; k < 9; k++) { // dentes de cima: compridos, tortos, faltando alguns
      if (k === 2 || k === 6) continue
      const a = (k - 4) * 0.17, l = 0.014 + R() * 0.016
      mesh(new THREE.ConeGeometry(0.0055, l, 4).rotateX(Math.PI).translate(0, -l / 2, 0), mt.bone, g, [Math.sin(a) * 0.042, -0.083, 0.04 + Math.cos(a) * 0.028], [0, 0, (R() - 0.5) * 0.4])
    }
    const jaw = group(g, [0, -0.082, -0.005]); jaw.rotation.z = o.split ? 0 : 0.08 // mandíbula meio desencaixada
    const halves = []
    const lowTeeth = (par, x0, x1) => { for (let k = 0; k < 4; k++) { const u = (k + 0.5) / 4, x = x0 + (x1 - x0) * u, a = x / 0.04 * 0.6, l = 0.012 + R() * 0.014; mesh(new THREE.ConeGeometry(0.005, l, 4).translate(0, l / 2, 0), mt.bone, par, [x, -0.018, 0.034 + Math.cos(a) * 0.03], [0, 0, (R() - 0.5) * 0.5]) } }
    if (o.split) { // a mandíbula partida no queixo: as duas metades abrem para os lados
      for (const s of [-1, 1]) {
        const h = group(jaw, [s * 0.045, 0, 0]); h.userData.s = s
        mesh(new THREE.BoxGeometry(0.045, 0.02, 0.085).translate(-s * 0.0225, -0.028, 0.04), mt.bone, h)
        lowTeeth(h, -s * 0.042, -s * 0.004)
        halves.push(h)
      }
    } else {
      mesh(new THREE.BoxGeometry(0.08, 0.02, 0.085).translate(0, -0.03, 0.04), mt.bone, jaw)
      for (const s of [-1, 1]) mesh(new THREE.BoxGeometry(0.014, 0.05, 0.03), mt.bone, jaw, [s * 0.043, 0.0, -0.002])
      lowTeeth(jaw, -0.034, 0.034)
    }
    const setJaw = (v) => { jaw.rotation.x = o.split ? v * 0.5 : v; halves.forEach((h) => (h.rotation.y = h.userData.s * v * 0.75)) }
    return { g, jaw, halves, setJaw }
  }
  // véu rasgado pendurado na borda do capuz, por cima da testa: o rosto fica meio escondido
  function veil(head, r, mt, n, len) {
    const strips = []
    for (let i = 0; i < n; i++) {
      const a = (i / (n - 1) - 0.5) * 1.5, l = len * (0.7 + 0.6 * Math.abs(Math.sin(i * 2.3)))
      const geo = new THREE.PlaneGeometry(r * 0.16, l, 1, 3).translate(0, -l / 2, 0), pp = geo.attributes.position
      for (let j = 0; j < pp.count; j++) if (pp.getY(j) < -l * 0.95) pp.setY(j, pp.getY(j) + (j % 2 ? 0.25 : -0.1) * l) // ponta rasgada
      const piv = group(head, [Math.sin(a) * r * 0.82, Math.cos(a) * r * 0.62 + r * 0.25, r * 0.5]); piv.rotation.z = -a * 0.35
      mesh(geo, mt.cloak, piv); strips.push(piv)
    }
    return strips
  }
  function boneArm(parent, side, at, L1, L2, r, mt, nF, fLen, sleeve) { // braço de osso: úmero, rádio e ulna, a mão e garras de duas falanges
    const a = { side, fingers: [] }
    a.upper = group(parent, at)
    mesh(sphere(r * 1.7, 6, 5), mt.bone, a.upper)
    mesh(limb(r, r * 0.8, L1, 5, 1), mt.bone, a.upper)
    if (sleeve) mesh(limb(sleeve, sleeve * 0.72, L1 * 0.78, 8, 2), mt.cloak, a.upper) // a manga de membrana
    a.fore = group(a.upper, [0, -L1, 0]); mesh(sphere(r * 1.1, 5, 4), mt.bone, a.fore)
    mesh(limb(r * 0.8, r * 0.7, L2, 5, 1), mt.bone, a.fore); mesh(limb(r * 0.6, r * 0.6, L2, 5, 1), mt.bone, a.fore, [side * r * 1.2, 0, 0])
    a.hand = group(a.fore, [0, -L2, 0]); mesh(sphere(r * 1.3, 5, 4), mt.bone, a.hand, null, null, [1.2, 0.8, 0.6])
    for (let i = 0; i < nF; i++) {
      const k = i - (nF - 1) / 2
      const f1 = group(a.hand, [k * r * 1.0, -r, r * 0.3]); f1.rotation.z = k * 0.2
      mesh(limb(r * 0.42, r * 0.36, fLen, 4, 1), mt.bone, f1)
      const f2 = group(f1, [0, -fLen, 0]); mesh(new THREE.ConeGeometry(r * 0.38, fLen * 0.95, 4).rotateX(Math.PI).translate(0, -fLen * 0.475, 0), mt.bone, f2)
      a.fingers.push([f1, f2])
    }
    return a
  }
  // o olhar: dois cones de luz azul saindo das órbitas mostram para onde ele está olhando
  const beamTex = canvasTex(4, 64, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.2, '#8a8a8a'); gr.addColorStop(1, '#000000'); g.fillStyle = gr; g.fillRect(0, 0, w, h) })
  beamTex.magFilter = beamTex.minFilter = THREE.LinearFilter
  function eyeBeams(sk, sc, len, ang, base, real = true) {
    const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color('#6fdcff').convertSRGBToLinear(), transparent: true, opacity: base, alphaMap: beamTex, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })
    const L = len / sc, r = Math.tan(ang) * L
    const geo = new THREE.ConeGeometry(r, L, 14, 1, true).translate(0, -L / 2, 0).rotateX(-Math.PI / 2) // ponta na órbita, abrindo para a frente
    const ms = [-1, 1].map((s) => { const b = new THREE.Mesh(geo, mat); b.position.set(s * 0.035, -0.002, 0.082); b.rotation.y = -s * 0.04; b.frustumCulled = false; sk.g.add(b); return b })
    const SL = real ? new THREE.SpotLight('#4cc6ff', 0, len * 1.5, ang * 1.6, 0.6, 1.4) : { intensity: 0, position: new THREE.Vector3(), target: { position: new THREE.Vector3() } }; if (real) { scene.add(SL); scene.add(SL.target) }
    const _p = new THREE.Vector3()
    const light = (k) => { if (!ms[0].visible || !k) { SL.intensity = 0; return } SL.position.copy(sk.g.localToWorld(_p.set(0, -0.005, 0.08))); SL.target.position.copy(sk.g.localToWorld(_p.set(0, -0.02, 1.2))); SL.intensity = k }
    return { mat, ms, base, light, show: (v) => ms.forEach((b) => (b.visible = v)) }
  }
  const dampA = (a, b, k, dt) => { let d = b - a; d = Math.atan2(Math.sin(d), Math.cos(d)); return a + d * (1 - Math.exp(-k * dt)) }
  function wispCloud(parent, n, color, size) { // fiapos de ectoplasma: nascem no corpo e sobem sumindo
    const geo = new THREE.BufferGeometry(), pos = new Float32Array(n * 3)
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color: new THREE.Color(color).convertSRGBToLinear(), size, transparent: true, opacity: 0.6, depthWrite: false }))
    pts.frustumCulled = false; parent.add(pts)
    const W = { pts, geo, pos, n, life: new Float32Array(n), vel: new Float32Array(n * 3) }
    W.step = (dt, spawn) => {
      for (let i = 0; i < n; i++) {
        W.life[i] -= dt
        if (W.life[i] <= 0) { const s = spawn(i); pos[i * 3] = s.x; pos[i * 3 + 1] = s.y; pos[i * 3 + 2] = s.z; W.vel[i * 3] = (Math.random() - 0.5) * 0.12; W.vel[i * 3 + 1] = 0.08 + Math.random() * 0.2; W.vel[i * 3 + 2] = (Math.random() - 0.5) * 0.12; W.life[i] = 0.6 + Math.random() * 1.4 }
        pos[i * 3] += W.vel[i * 3] * dt; pos[i * 3 + 1] += W.vel[i * 3 + 1] * dt; pos[i * 3 + 2] += W.vel[i * 3 + 2] * dt
      }
      geo.attributes.position.needsUpdate = true
    }
    return W
  }
  function puddle(parent) {
    const p = new THREE.Mesh(new THREE.CircleGeometry(0.5, 20).rotateX(-Math.PI / 2), basic({ color: '#5fd8e8', transparent: true, opacity: 0, depthWrite: false }))
    p.position.y = 0.012; p.visible = false; parent.add(p); return p
  }


  // ---------- vida nos dois (o que fizemos na Mãe): fios soltos com física (véu, farrapos do manto, baba de ectoplasma),
  // molas nas juntas (cada parte passa um pouco do ponto e assenta; a mão e os dedos chicoteiam por último) ----------
  function strandSet(G, mat, defs) { // G no mundo (sem giro): cada fio é uma corrente verlet presa num ponto do corpo; desenhado como fita de frente para a câmera
    const L = defs.map((d) => Object.assign({ p: new Float32Array(d.n * 3), q: new Float32Array(d.n * 3), ok: false, a: new THREE.Vector3() }, d))
    const NV = L.reduce((n, d) => n + d.n * 2, 0), pos = new Float32Array(NV * 3), uv = new Float32Array(NV * 2), idx = []
    let o = 0; L.forEach((d) => { d.o = o; for (let j = 0; j < d.n; j++) { const v = 1 - j / (d.n - 1); uv.set([0, v, 1, v], (o + j * 2) * 2); if (j < d.n - 1) { const a = o + j * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2) } } o += d.n * 2 })
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); geo.setIndex(idx)
    const ms = new THREE.Mesh(geo, mat); ms.frustumCulled = false; ms.castShadow = false; G.add(ms)
    const _c = new THREE.Vector3(), _t = new THREE.Vector3(), _w = new THREE.Vector3()
    function step(dt, t) {
      if (!(dt > 0)) return
      camera.getWorldPosition(_c)
      for (const d of L) {
        d.anchor(d.a); const p = d.p, q = d.q, n = d.n, seg = d.len / (n - 1)
        if (!d.ok || Math.hypot(p[0] - d.a.x, p[1] - d.a.y, p[2] - d.a.z) > 1.2) { for (let j = 0; j < n; j++) { p[j * 3] = d.a.x; p[j * 3 + 1] = d.a.y - seg * j; p[j * 3 + 2] = d.a.z } q.set(p); d.ok = true }
        p[0] = q[0] = d.a.x; p[1] = q[1] = d.a.y; p[2] = q[2] = d.a.z
        const keep = Math.pow(d.keep || 0.9, dt * 60), g = (d.g === undefined ? 9.8 : d.g) * dt * dt
        for (let j = 1; j < n; j++) {
          const i = j * 3, vx = (p[i] - q[i]) * keep, vy = (p[i + 1] - q[i + 1]) * keep, vz = (p[i + 2] - q[i + 2]) * keep, fl = d.flut ? Math.sin(t * 3.1 + j * 0.9 + (d.ph || 0)) * d.flut * dt * dt * 60 * j / n : 0
          q[i] = p[i]; q[i + 1] = p[i + 1]; q[i + 2] = p[i + 2]; p[i] += vx + fl; p[i + 1] += vy - g; p[i + 2] += vz + fl * 0.7
        }
        for (let it = 0; it < 2; it++) for (let j = 1; j < n; j++) {
          const i = j * 3, dx = p[i] - p[i - 3], dy = p[i + 1] - p[i - 2], dz = p[i + 2] - p[i - 1], l = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1e-6, k = seg / l
          p[i] = p[i - 3] + dx * k; p[i + 1] = p[i - 2] + dy * k; p[i + 2] = p[i - 1] + dz * k; if (p[i + 1] < 0.02) p[i + 1] = 0.02
        }
        for (let j = 0; j < n; j++) {
          const i = j * 3, a = Math.max(0, j - 1) * 3, b = Math.min(n - 1, j + 1) * 3
          _t.set(p[b] - p[a], p[b + 1] - p[a + 1], p[b + 2] - p[a + 2]); _w.set(p[i] - _c.x, p[i + 1] - _c.y, p[i + 2] - _c.z).cross(_t); const wl = _w.length() || 1
          const hw = (d.w0 + (d.w1 - d.w0) * j / (n - 1)) / 2 / wl, v = (d.o + j * 2) * 3
          pos[v] = p[i] - _w.x * hw; pos[v + 1] = p[i + 1] - _w.y * hw; pos[v + 2] = p[i + 2] - _w.z * hw; pos[v + 3] = p[i] + _w.x * hw; pos[v + 4] = p[i + 1] + _w.y * hw; pos[v + 5] = p[i + 2] + _w.z * hw
        }
      }
      geo.attributes.position.needsUpdate = true
    }
    return { step, mesh: ms, reset: () => L.forEach((d) => (d.ok = false)) }
  }
  function springRig(list) { // [[junta, ω, ζ]]: a animação escreve a pose; a mola persegue (com um pouco de passada do ponto)
    const R = list.map(([o, w, z]) => ({ o, w, z, q: new THREE.Quaternion(), v: new THREE.Vector3(), ok: false }))
    const _e = new THREE.Quaternion(), _qi = new THREE.Quaternion(), _a = new THREE.Vector3(), _d = new THREE.Quaternion()
    function apply(dt) {
      if (!(dt > 0)) return
      const n = Math.min(6, Math.ceil(dt * 120)), h = dt / n
      for (const r of R) {
        const tq = r.o.quaternion
        if (!r.ok) { r.q.copy(tq); r.v.set(0, 0, 0); r.ok = true; continue }
        for (let s = 0; s < n; s++) {
          _e.copy(tq).multiply(_qi.copy(r.q).invert()); if (_e.w < 0) { _e.x = -_e.x; _e.y = -_e.y; _e.z = -_e.z; _e.w = -_e.w }
          const sn = Math.sqrt(_e.x * _e.x + _e.y * _e.y + _e.z * _e.z), ang = 2 * Math.atan2(sn, _e.w), k = sn > 1e-9 ? ang / sn : 0
          r.v.x += (_e.x * k * r.w * r.w - 2 * r.z * r.w * r.v.x) * h; r.v.y += (_e.y * k * r.w * r.w - 2 * r.z * r.w * r.v.y) * h; r.v.z += (_e.z * k * r.w * r.w - 2 * r.z * r.w * r.v.z) * h
          const vl = r.v.length(); if (vl > 1e-9) { _d.setFromAxisAngle(_a.copy(r.v).multiplyScalar(1 / vl), vl * h); r.q.premultiply(_d).normalize() }
        }
        r.o.quaternion.copy(r.q)
      }
    }
    return { apply, reset: () => R.forEach((r) => (r.ok = false)) }
  }
  function rimGlow(mt, R) { // a borda do ectoplasma acende (de raspão para a câmera): o fantasma lê como luz, não como plástico
    const prev = mt.onBeforeCompile
    mt.onBeforeCompile = (sh) => { prev(sh); sh.uniforms.uRim = R; sh.fragmentShader = 'uniform float uRim;\n' + sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n  totalEmissiveRadiance += vec3(0.32, 0.78, 1.0) * pow(1.0 - abs(dot(normal, normalize(vViewPosition))), 2.2) * uRim;') }
    const key = mt.customProgramCacheKey(); mt.customProgramCacheKey = () => key + '-rim'
    return mt
  }
  function heartBeat(t, rate) { const u = (t * rate) % 1; return Math.exp(-u * u / 0.003) + 0.6 * Math.exp(-(u - 0.2) * (u - 0.2) / 0.003) } // tum-tum
  function buildEspectral(tag, realLight = true) {
    const G = group(scene); G.visible = false
    const m = ghostMats(tag, '#2f8db5', '#05202e', 0.45)
    const B = group(G); B.rotation.order = 'YXZ' // a cabeça manda; o corpo vem atrás
    const head = group(B)
    const hoodM = mesh(hoodGeo(0.215), m.cloak, head, [0, 0.03, -0.03], null, [1, 1.08, 1.15])
    const sk = buildSkull(head, 1.38, m, { asym: true, seed: 11 }), jaw = sk.jaw
    const beams = eyeBeams(sk, 1.38, 3.2, 0.2, 0.15, realLight)
    const strips = [] // o véu agora é de fios com física (fios, mais abaixo)
    const arms = [-1, 1].map((s) => boneArm(head, s, [s * 0.16, -0.13, 0], 0.27, 0.26, 0.012, m, 4, 0.085, 0.03)) // braços compridos demais, garras de quatro dedos
    // a espinha: vértebras em corrente; as quatro primeiras têm costelas
    const N = 16, SEG = 0.088
    const P = Array.from({ length: N }, () => new THREE.Vector3())
    const verts = []
    for (let i = 1; i < N; i++) {
      const s = 1 - (i - 1) / (N - 1) * 0.68
      const v = group(G)
      mesh(new THREE.BoxGeometry(0.036 * s, 0.03 * s, 0.05 * s), m.bone, v)
      mesh(new THREE.BoxGeometry(0.008 * s, 0.03 * s, 0.02 * s), m.bone, v, [0, 0.025 * s, -0.005])
      if (i >= 2 && i < N - 3) mesh(new THREE.ConeGeometry(0.011 * s, (0.075 - (i % 2) * 0.025) * s, 4), m.bone, v, [0, 0.05 * s, -0.018 * s], [-0.75, 0, 0]) // espinhos de osso ao longo das costas
      if (i <= 4) { const r = [0, 0.088, 0.082, 0.07, 0.054][i]; mesh(new THREE.TorusGeometry(r, 0.0055, 4, 12, Math.PI * 1.6), m.bone, v, [0, -r * 0.3, 0], [0, 0, Math.PI * 0.7]) }
      verts.push(v)
    }
    // a membrana: um tubo que afina até a cauda, envolvendo a espinha
    const K = 8, rad = (i) => 0.115 * Math.pow(1 - i / N, 0.8) + 0.01
    const tg = new THREE.BufferGeometry(), tp = new Float32Array(N * K * 3)
    tg.setAttribute('position', new THREE.BufferAttribute(tp, 3))
    const idx = []; for (let i = 0; i < N - 1; i++) for (let k = 0; k < K; k++) { const a = i * K + k, b = i * K + (k + 1) % K; idx.push(a, a + K, b, b, a + K, b + K) }
    tg.setIndex(idx)
    const tube = new THREE.Mesh(tg, m.memb); tube.frustumCulled = false; G.add(tube)
    const wisps = wispCloud(G, 60, '#8fe6ff', 0.02)
    const pud = puddle(G)
    // o rework: o véu rasgado e quatro farrapos compridos do capuz flutuando atrás (física), dois fios de baba de ectoplasma
    // pendurados na mandíbula, um coração de ectoplasma batendo dentro das costelas, molas na cabeça, nos braços e nos dedos
    const fios = strandSet(G, m.cloak, [
      ...[0, 1, 2, 3, 4].map((i) => { const a = (i / 4 - 0.5) * 1.5, r = 0.215; return { anchor: (o) => head.localToWorld(o.set(Math.sin(a) * r * 0.82, Math.cos(a) * r * 0.62 + r * 0.2, r * 0.5)), n: 4, len: 0.11 + 0.07 * Math.abs(Math.sin(i * 2.3)), w0: 0.034, w1: 0.016, g: 3, keep: 0.86, flut: 0.25, ph: i } }),
      ...[-1, -0.35, 0.35, 1].map((x, i) => ({ anchor: (o) => head.localToWorld(o.set(x * 0.14, 0.03 - Math.abs(x) * 0.04, -0.2)), n: 7, len: 0.4 + 0.2 * (i % 2), w0: 0.075, w1: 0.012, g: 1.4, keep: 0.94, flut: 0.55, ph: i * 1.7 })),
    ])
    const baba = strandSet(G, m.drool, [-1, 1].map((x, i) => ({ anchor: (o) => jaw.localToWorld(o.set(x * 0.022, -0.036, 0.074)), n: 5, len: 0.09 + 0.05 * i, w0: 0.011, w1: 0.003, g: 6, keep: 0.85, ph: i })))
    const cauda = strandSet(G, m.memb, [[N - 1, 0.3, 0], [N - 2, 0.24, 2.1], [N - 3, 0.2, 4.2]].map(([k, len, ph]) => ({ anchor: (o) => o.copy(P[k]), n: 5, len, w0: 0.035, w1: 0.004, g: 0.8, keep: 0.93, flut: 0.9, ph }))) // a cauda abre em fiapos
    const throat = new THREE.Sprite(haloMat); throat.position.set(0, -0.1, 0.075); throat.scale.setScalar(0.001); sk.g.add(throat) // a garganta acende quando a boca abre
    const heart = mesh(sphere(0.022, 6, 5), m.heart, verts[1], [0, -0.032, 0.004]), heartHalo = new THREE.Sprite(haloMat); heart.add(heartHalo)
    const rig = springRig([[head, 24, 0.5], [jaw, 30, 0.42], ...arms.flatMap((a) => [[a.upper, 26, 0.45], [a.fore, 23, 0.42], [a.hand, 19, 0.36], ...a.fingers.flatMap(([f1, f2]) => [[f1, 20, 0.4], [f2, 17, 0.34]])])])
    const life = (t, dt) => { // a parte viva: chamada no fim de cada quadro normal
      fios.step(dt, t); baba.step(dt, t); cauda.step(dt, t); rig.apply(dt)
      throat.scale.setScalar(0.02 + 0.1 * Math.min(1, S.jaw) * (0.6 + 0.6 * S.glow))
      const b = heartBeat(t, 1.0 + 1.4 * S.glow); heart.scale.setScalar(1 + 0.5 * b); heartHalo.scale.setScalar(0.1 + 0.12 * b + 0.08 * S.glow)
      const br = Math.sin(t * 2.3) * 0.03; hoodM.scale.set(1 + br, 1.08 - br * 0.5, 1.15 + br) // respira
      m.RIM.value = 0.6 + 0.6 * S.glow + 0.2 * b
    }

    const S = { ang: Math.random() * 6, ph: 'circle', pt: 0, pos: new THREE.Vector3(), yaw: 0, pitch: 0, jaw: 0.1, glow: 0, hissT: 2, nextAtk: 1.2, burst: 0, shrink: 1, from: new THREE.Vector3(), to: new THREE.Vector3() }
    const ctl = { mode: null, pull: null } // o Glutão, ao devorar, assume a posição (pull)
    const C0 = new THREE.Vector3(0, 0, 0.3), R0 = 1.25
    const _a = new THREE.Vector3(), _d = new THREE.Vector3(), _bias = new THREE.Vector3(), _t = new THREE.Vector3(), _n = new THREE.Vector3(), _b = new THREE.Vector3(), UP = new THREE.Vector3(0, 1, 0), XX = new THREE.Vector3(1, 0, 0)
    const ring = (t) => { // no laboratório, em volta do meio do quarto; na arena (ctl.arena), em volta do agente, cada um no seu raio
      const AR = ctl.arena, c = AR ? AR.center : C0, rr = AR ? S.R || 3 : R0
      _a.set(c.x + Math.cos(S.ang) * rr, (AR ? 1.28 : 1.18) + Math.sin(t * 1.3) * 0.08, c.z + Math.sin(S.ang) * rr)
      return AR ? AR.clamp(_a) : _a
    }
    function initChain() {
      B.position.copy(S.pos); B.rotation.set(0, S.yaw, 0); B.updateMatrixWorld(true)
      const bx = -Math.sin(S.yaw), bz = -Math.cos(S.yaw)
      for (let i = 0; i < N; i++) P[i].set(S.pos.x + bx * i * SEG * 0.75, Math.max(0.08, S.pos.y - 0.08 - i * SEG * 0.6), S.pos.z + bz * i * SEG * 0.75)
    }
    function reset() {
      S.burst = 0; S.ph = 'circle'; S.pt = 0; S.shrink = 1; S.glow = 0
      m.U.uFade.value = m.fade; m.UM.uFade.value = Math.min(0.85, m.fade + 0.15); m.UB.uFade.value = 0
      tube.visible = wisps.pts.visible = true; m.eyes.forEach((e) => (e.visible = true)); pud.visible = false; beams.show(true)
      S.pos.copy(ring(0)); S.yaw = Math.atan2(-Math.sin(S.ang), Math.cos(S.ang)); B.scale.setScalar(1); initChain()
      verts.forEach((v) => v.rotation.set(0, 0, 0))
      if (typeof fios !== 'undefined') { fios.reset(); baba.reset(); cauda.reset(); rig.reset(); heart.visible = true }
    }
    reset()
    function place(p, yaw) { S.pos.copy(p); S.yaw = yaw || 0; initChain() }
    function burst() {
      if (S.burst > 0) return
      S.burst = 1e-4; S.bv = verts.map(() => new THREE.Vector3((Math.random() - 0.5) * 1.6, Math.random() * 1.4, (Math.random() - 0.5) * 1.6)); S.hv = new THREE.Vector3((Math.random() - 0.5) * 0.6, 0.9, (Math.random() - 0.5) * 0.6)
      pud.position.set(S.pos.x, 0.012, S.pos.z); pud.visible = true; m.eyes.forEach((e) => (e.visible = false)); wisps.pts.visible = false; beams.show(false); beams.light(0)
      heart.visible = false
      SFX.esp('burst')
    }
    function burstFrame(t, dt) {
      S.burst += dt; const b = S.burst
      m.UM.uFade.value = Math.min(1, 0.57 + b * 1.6); m.U.uFade.value = Math.min(1, m.fade + b * 1.2)
      verts.forEach((v, i) => {
        const vv = S.bv[i]; vv.y -= 4.5 * dt; v.position.addScaledVector(vv, dt); v.rotation.x += dt * 4 * (vv.lengthSq() > 0.05 ? 1 : 0)
        if (v.position.y < 0.03) { v.position.y = 0.03; vv.set(vv.x * 0.5, Math.abs(vv.y) * 0.25, vv.z * 0.5); if (vv.lengthSq() < 0.02) vv.set(0, 0, 0) }
      })
      S.hv.y -= 4.5 * dt; B.position.addScaledVector(S.hv, dt)
      if (B.position.y < 0.1) { B.position.y = 0.1; S.hv.set(0, 0, 0) } else B.rotation.x += dt * 2.2
      sk.setJaw(damp(jaw.rotation.x, 1.1, 6, dt))
      arms.forEach((a) => { a.upper.rotation.x = damp(a.upper.rotation.x, 0.2, 3, dt); a.fingers.forEach((f) => (f[0].rotation.x = damp(f[0].rotation.x, 0.1, 3, dt))) })
      tube.visible = b < 0.45
      pud.material.opacity = Math.min(0.5, b * 1.2) * (b > 2.4 ? Math.max(0, 1 - (b - 2.4) / 0.8) : 1); pud.scale.setScalar(0.3 + Math.min(1, b * 1.5) * 0.9)
      if (b > 1.6) m.UB.uFade.value = Math.min(1, (b - 1.6) / 0.8)
      if (b > 3.3) { if (ctl.arena) { G.visible = false; beams.light(0) } reset() }
    }
    function pose(a, ux, uz, fx, curl, dt, k = 8) {
      a.upper.rotation.x = damp(a.upper.rotation.x, ux, k, dt); a.upper.rotation.z = damp(a.upper.rotation.z, a.side * uz, k, dt)
      a.fore.rotation.x = damp(a.fore.rotation.x, fx, k, dt)
      a.fingers.forEach((f, i) => { const c = curl + (i === 1 ? 0.1 : 0); f[0].rotation.x = damp(f[0].rotation.x, c, k * 1.5, dt); f[1].rotation.x = damp(f[1].rotation.x, c * 1.3, k * 1.5, dt) })
    }
    const TW = { y: 0, r: 0, p: 0, ty: 0, tr: 0, tp: 0, next: 1.5, hold: 0 }, FZ = { t: 0, next: 2.5 }
    let chat = 0
    function twitch(dt, calm) { // a cabeça dá trancos: vira de uma vez, segura e volta
      TW.next -= dt
      if (TW.next <= 0) { TW.ty = (Math.random() - 0.5) * 1.3; TW.tr = (Math.random() - 0.5) * 1.1; TW.tp = (Math.random() - 0.5) * 0.5; TW.hold = 0.25 + Math.random() * 0.4; TW.next = (calm ? 1.2 : 2.5) + Math.random() * 2.5 }
      if (TW.hold > 0) TW.hold -= dt; else { TW.ty *= Math.exp(-6 * dt); TW.tr *= Math.exp(-6 * dt); TW.tp *= Math.exp(-6 * dt) }
      TW.y = damp(TW.y, TW.ty, 35, dt); TW.r = damp(TW.r, TW.tr, 35, dt); TW.p = damp(TW.p, TW.tp, 35, dt)
    }
    function update(t, dt) {
      if (S.burst > 0) { burstFrame(t, dt); return }
      const calm = !ctl.pull && (S.ph === 'circle' || S.ph === 'daze')
      if (calm) { FZ.next -= dt; if (FZ.t > 0) { FZ.t -= dt; return } if (FZ.next <= 0) { FZ.t = 0.08 + Math.random() * 0.14; FZ.next = 1.8 + Math.random() * 3 } } // trava no ar por um instante, como quadro pulado
      twitch(dt, calm); if (!calm) { TW.ty = TW.tr = TW.tp = 0 }
      chat = calm && Math.sin(t * 0.9) > 0.55 ? (Math.sin(t * 46) > 0 ? 0.22 : 0) : 0 // dentes batendo, em rajadas
      const AR = ctl.arena // na arena: o alvo é o agente, e quem ataca é o diretor das ondas que decide (um por vez)
      const attack = AR ? false : ctl.mode ? ctl.mode === 'caca' : ui.mode === 'caca'
      S.pt += dt
      const tgtP = AR ? AR.target : camera.position
      const toCam = _d.set(tgtP.x - S.pos.x, 0, tgtP.z - S.pos.z); const camD = toCam.length() || 1; toCam.divideScalar(camD)
      let target = null, yawT = S.yaw, pitchT = 0, jawT = 0.12 + 0.06 * Math.sin(t * 2.3), glowT = 0, snap = false, kPos = 3
      let ux = -0.85 + Math.sin(t * 1.7) * 0.15, uz = 0.35, fx = -0.7, curl = 0.5
      if (ctl.pull && ctl.pull.path) { // numa cena: o roteiro diz onde ele está, para onde olha e o que faz com a boca e os braços
        const Pl = ctl.pull; target = Pl.tgt; snap = true; yawT = Pl.yaw; pitchT = Pl.pitch; jawT = Pl.jaw; glowT = Pl.glow; ux = Pl.ux; uz = Pl.uz; fx = Pl.fx; curl = Pl.curl; S.shrink = Pl.shrink
      } else if (ctl.pull) { // sendo sugado pelo Glutão: se debate no fluxo
        const Pl = ctl.pull; Pl.t += dt
        const k = Math.min(1, Pl.t / Pl.dur), e = k * k * (3 - 2 * k), to = Pl.to(), sw = (1 - e) * 0.32
        target = _t.copy(Pl.from).lerp(to, Math.pow(e, 1.5)); target.x += Math.cos(t * 7) * sw; target.y += Math.sin(t * 9) * sw * 0.5; target.z += Math.sin(t * 7) * sw
        kPos = 10; yawT = Math.atan2(toCam.x, toCam.z) + Math.sin(t * 6) * 0.8; pitchT = Math.sin(t * 8) * 0.4
        jawT = 0.55 + 0.35 * Math.sin(t * 22); glowT = 1
        ux = -2.2 + Math.sin(t * 14) * 0.6; uz = 0.9 + Math.sin(t * 11) * 0.3; fx = -0.3; curl = 0.05
        S.shrink = k > 0.82 ? Math.max(0.05, 1 - (k - 0.82) / 0.18) : 1
        if (k >= 1) { ctl.pull = null; G.visible = false; const done = Pl.done; reset(); if (done) done(); return }
      } else {
        const spd = S.ph === 'circle' ? 0.55 : S.ph === 'daze' ? 0.18 : 0
        S.ang += spd * dt
        const r = ring(t)
        const tanYaw = Math.atan2(-Math.sin(S.ang), Math.cos(S.ang)), camYaw = Math.atan2(toCam.x, toCam.z)
        if (S.ph === 'circle') {
          target = r; yawT = tanYaw + Math.sin(t * 0.7) * 0.25
          S.hissT -= dt; if (S.hissT <= 0) { SFX.esp('hiss'); S.hissT = 3 + Math.random() * 3 }
          if (S.pt > S.nextAtk && (AR ? AR.may(S) : attack)) { S.ph = 'wind'; S.pt = 0; SFX.esp('shriek') }
        } else if (S.ph === 'wind') { // o aviso: empina, recua, abre a boca e os olhos acendem
          target = _t.copy(r).addScaledVector(toCam, -0.3); target.y += 0.28; kPos = 6
          yawT = camYaw; pitchT = -0.45; jawT = 1.15; glowT = 1; ux = -2.3; uz = 0.95; fx = -0.35; curl = 0.05
          if (S.pt > 0.6) { S.ph = 'lunge'; S.pt = 0; S.from.copy(S.pos); S.to.copy(S.pos).addScaledVector(toCam, AR ? Math.max(0, Math.min(AR.lunge, camD - 0.45)) : Math.min(1.4, camD - 0.9)); S.to.y = AR ? 1.2 : 1.12; if (AR) AR.clamp(S.to); SFX.esp('whip') }
        } else if (S.ph === 'lunge') { // o bote
          if (AR) { // na arena ele corrige um pouco o bote atrás de você (sair andando de lado ainda escapa; a cambalhota é o certo)
            const dx = AR.target.x - S.from.x, dz = AR.target.z - S.from.z, dl = Math.hypot(dx, dz) || 1, reach = Math.min(AR.lunge + 1.0, Math.max(0, dl - 0.4))
            _b.set(S.from.x + dx / dl * reach, 1.2, S.from.z + dz / dl * reach); S.to.lerp(_b, Math.min(1, dt * 5)); AR.clamp(S.to)
          }
          const k = smooth(S.pt / 0.3); target = _t.copy(S.from).lerp(S.to, k); snap = true
          yawT = camYaw; pitchT = 0.2; jawT = 1.35; glowT = 1; ux = -1.55; uz = 0.22; fx = -0.15; curl = 0.05
          if (S.pt > 0.3) { S.ph = 'bite'; S.pt = 0; SFX.esp('bite'); if (AR) AR.bite(S) }
        } else if (S.ph === 'bite') { // a mordida
          target = S.to; snap = true; yawT = camYaw; pitchT = 0.25; jawT = 0; glowT = 0.8; ux = -1.4; uz = 0.12; fx = -0.5; curl = 1.3
          if (S.pt > 0.25) { S.ph = 'daze'; S.pt = 0 }
        } else { // tonto: recua devagar, a cabeça bambeando (a janela do jogador)
          target = r; kPos = 1.2; yawT = camYaw + Math.sin(t * 3) * 0.6; pitchT = 0.3 + Math.sin(t * 4.3) * 0.25; jawT = 0.35 + 0.2 * Math.sin(t * 5); ux = -0.2; uz = 0.2; fx = -0.1; curl = 0.2
          if (S.pt > 1.5) { S.ph = 'circle'; S.pt = 0; S.nextAtk = 1.0 + Math.random() * 1.2; if (AR) { AR.done(S); S.ang = Math.atan2(S.pos.z - AR.center.z, S.pos.x - AR.center.x) } }
        }
      }
      if (snap) S.pos.copy(target); else S.pos.lerp(target, 1 - Math.exp(-kPos * dt))
      S.yaw = dampA(S.yaw, yawT, 6, dt); S.pitch = damp(S.pitch, pitchT, 7, dt); S.glow = damp(S.glow, glowT, 8, dt)
      B.position.copy(S.pos); B.rotation.set(S.pitch, S.yaw, Math.sin(t * 1.9) * 0.08); B.scale.setScalar(S.shrink); B.updateMatrixWorld(true)
      S.jaw = damp(S.jaw, jawT, S.ph === 'bite' ? 30 : 10, dt); sk.setJaw(S.jaw + chat)
      m.eyes.forEach((e) => e.scale.setScalar(1 + S.glow * 1.8))
      head.rotation.set(TW.p + Math.sin(t * 2.4) * 0.08, TW.y + Math.sin(t * 3 + 0.5) * 0.22, TW.r + Math.sin(t * 3 + 1.2) * 0.12) // os trancos da cabeça, por cima do serpentear do corpo
      beams.light(G.visible ? 3.0 * (0.7 + 0.6 * S.glow) * (ctl.pull ? 0.4 : 1) : 0)
      strips.forEach((st, i) => { st.rotation.x = 0.15 + Math.sin(t * 2.3 + i) * 0.12 - S.pitch * 0.4 })
      beams.mat.opacity = beams.base * (0.7 + 0.6 * S.glow) * (ctl.pull ? 0.5 : 1) // no aviso, o olhar trava em você e acende
      arms.forEach((a, i) => pose(a, ux + (i ? 0.1 : -0.1) * Math.sin(t * 2.1), uz, fx, curl, dt, ctl.pull ? 14 : 8))
      // a espinha segue a cabeça
      const fx3 = Math.sin(S.yaw), fz3 = Math.cos(S.yaw), sx3 = Math.cos(S.yaw), sz3 = -Math.sin(S.yaw)
      P[0].copy(B.localToWorld(_b.set(0, -0.12, -0.08)))
      const kk = 1 - Math.exp(-3.2 * dt), seg = SEG * S.shrink
      for (let i = 1; i < N; i++) {
        const u = i / N, wave = Math.sin(t * 3.0 - i * 0.55) * (S.ph === 'circle' ? 0.8 : 0.5) + (ctl.pull ? Math.sin(t * 13 - i) * 0.9 : 0)
        _bias.set(-fx3 * 0.9 + sx3 * wave, -0.28 - 0.3 * Math.sin(t * 2.1 - i * 0.4), -fz3 * 0.9 + sz3 * wave).normalize() // flutua: a cauda desce pouco, ondulando
        _n.subVectors(P[i], P[i - 1]); if (_n.lengthSq() < 1e-8) _n.copy(_bias); _n.normalize()
        _n.lerp(_bias, Math.min(1, kk * (0.6 + u))).normalize()
        P[i].copy(P[i - 1]).addScaledVector(_n, seg * (1 - u * 0.25))
        if (P[i].y < 0.06) P[i].y = 0.06 // não atravessa o assoalho
      }
      for (let i = 1; i < N; i++) { const v = verts[i - 1]; v.position.copy(P[i]); v.lookAt(P[i - 1]); v.scale.setScalar(S.shrink) }
      for (let i = 0; i < N; i++) {
        _t.subVectors(P[Math.max(0, i - 1)], P[Math.min(N - 1, i + 1)]).normalize()
        _n.crossVectors(_t, UP); if (_n.lengthSq() < 1e-4) _n.crossVectors(_t, XX); _n.normalize(); _b.crossVectors(_t, _n)
        const r = rad(i) * S.shrink * (1 + 0.12 * Math.sin(t * 5 + i * 0.8)) * (1 + S.glow * 0.12)
        for (let k = 0; k < K; k++) {
          const an = k / K * Math.PI * 2, fl = r * (1 + 0.1 * Math.sin(t * 7 + k * 1.7 + i)), c = Math.cos(an) * fl, s = Math.sin(an) * fl, o = (i * K + k) * 3
          tp[o] = P[i].x + c * _n.x + s * _b.x; tp[o + 1] = P[i].y + c * _n.y + s * _b.y; tp[o + 2] = P[i].z + c * _n.z + s * _b.z
        }
      }
      tg.attributes.position.needsUpdate = true; tg.computeVertexNormals(); tg.computeBoundingSphere()
      wisps.step(dt, () => { const i = 3 + (Math.random() * (N - 3) | 0), r = rad(i) * 0.8; return _b.set(P[i].x + (Math.random() - 0.5) * r, P[i].y + (Math.random() - 0.5) * r, P[i].z + (Math.random() - 0.5) * r) })
      life(t, dt)
    }
    const vec = (o, x, y, z) => o.localToWorld(new THREE.Vector3(x, y, z))
    const faceTheta = (off) => { let a = S.yaw + off; while (a - cam.theta > Math.PI) a -= Math.PI * 2; while (a - cam.theta < -Math.PI) a += Math.PI * 2; return a }
    return {
      group: G, update, S, ctl, head, jaw, arms, P, verts, burst, reset, place, mats: m, lightOff: () => beams.light(0),
      mouth: () => vec(head, 0, -0.08, 0.1),
      views: {
        corpo: () => ({ theta: 0.5, elev: 0.18, dist: 3.4, focus: () => new THREE.Vector3(S.pos.x * 0.6, 0.95, S.pos.z * 0.6 + 0.15) }),
        rosto: () => ({ get theta() { return faceTheta(0.12) }, elev: 0.06, dist: 1.3, focus: () => vec(head, 0, -0.02, 0.04) }), // acompanha o rosto
        maos: () => ({ theta: 0.9, elev: 0.22, dist: 1.4, focus: () => P[9].clone() }), // a cauda
      },
    }
  }
  const espectral = buildEspectral('es')
  const espPrey = buildEspectral('ep', false) // o que o Glutão devora (demonstração, quando não há nenhum dele por perto)
  const espPool = ['s1', 's2', 's3'].map((k) => buildEspectral(k, false)) // os que saem do núcleo do Glutão

  function buildGlutao(prey, pool) {
    const G = group(scene); G.visible = false
    const m = ghostMats('gl', '#236c95', '#031824', 0.38)
    const B = group(G); B.rotation.order = 'YXZ'
    // o corpo: o mesmo do Espectral, só que enorme. Uma espinha em corrente dentro de um tubo de ectoplasma;
    // o tronco desce reto dos ombros (as costelas e o núcleo ficam nele) e a cauda ondula e se arrasta para trás
    const N = 16, SEG = 0.19
    const P = Array.from({ length: N }, () => new THREE.Vector3())
    const verts = []
    for (let i = 1; i < N; i++) {
      const sc = 1 - (i - 1) / (N - 1) * 0.7, v = group(G)
      mesh(new THREE.BoxGeometry(0.09 * sc, 0.075 * sc, 0.11 * sc), m.bone, v)
      mesh(new THREE.BoxGeometry(0.02 * sc, 0.08 * sc, 0.05 * sc), m.bone, v, [0, 0.065 * sc, -0.01])
      if (i <= 10) mesh(new THREE.ConeGeometry(0.03 * sc, (0.24 - (i % 2) * 0.08) * sc, 4), m.bone, v, [0, 0.13 * sc, -0.04 * sc], [-0.55, 0, 0]) // espinhos de osso saindo das costas
      if (i <= 5) { const r = [0, 0.27, 0.33, 0.34, 0.3, 0.23][i]; const rib = mesh(new THREE.TorusGeometry(r, 0.022, 4, 16, Math.PI * 1.6), m.bone, v, [0, -r * 0.8, 0], [0, 0, Math.PI * 0.7]); rib.castShadow = false }
      verts.push(v)
    }
    const K = 18, tg = new THREE.BufferGeometry(), tp = new Float32Array(N * K * 3) // (18 em volta: dá para ver as almas empurrando a barriga por dentro)
    tg.setAttribute('position', new THREE.BufferAttribute(tp, 3))
    const tIdx = []; for (let i = 0; i < N - 1; i++) for (let k = 0; k < K; k++) { const a = i * K + k, b = i * K + (k + 1) % K; tIdx.push(a, a + K, b, b, a + K, b + K) }
    tg.setIndex(tIdx)
    const tube = new THREE.Mesh(tg, m.memb); tube.frustumCulled = false; G.add(tube)
    mesh(sphere(0.48, 12, 8), m.memb, B, [0, 1.74, 0.02], null, [1.2, 0.55, 0.85]) // os ombros fecham o alto do tubo
    // o núcleo: as almas devoradas giram lá dentro
    const coreG = group(G) // segue o peito, no meio das costelas
    const coreIn = mesh(sphere(0.09, 8, 6), basic({ color: '#e8fdff' }), coreG)
    const coreGlow = new THREE.Mesh(sphere(0.25, 10, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color('#7fe3ff').convertSRGBToLinear(), transparent: true, opacity: 0.45, blending: THREE.AdditiveBlending, depthWrite: false }))
    coreG.add(coreGlow)
    const souls = [0, 1, 2, 3].map((k) => { const o = group(coreG); const s = buildSkull(o, 0.42, m); s.g.position.set(0.11, 0, 0); o.visible = k < 3; return { o, s, k } })
    // a cabeça: capuz enorme e caveira rachada de mandíbula longa
    const neck = group(B, [0, 1.86, 0.26]) // a cabeça sai do manto, projetada para a frente
    const head = group(neck, [0, 0.18, 0.2])
    const hoodM = mesh(hoodGeo(0.44), m.cloak, head, [0, 0.06, -0.09], null, [1.05, 1.12, 1.25])
    const sk = buildSkull(head, 2.55, m, { split: true, seed: 23 }), jaw = sk.jaw
    const beams = eyeBeams(sk, 2.55, 4.0, 0.2, 0.11)
    const strips = [] // o véu agora é de fios com física (fios, mais abaixo)
    mesh(new THREE.BoxGeometry(0.004, 0.05, 0.004), m.dark, sk.g, [0.03, 0.062, 0.07], [0.3, 0, 0.45]) // a rachadura
    const arms = [-1, 1].map((s) => boneArm(B, s, [s * 0.62, 1.76, 0.1], 0.72, 0.7, 0.03, m, 4, 0.16, 0.11))
    const wisps = wispCloud(G, 50, '#8fe6ff', 0.03)
    const pud = puddle(G)
    // o rework: véu e farrapos do manto pendurados nas costas (física: pesam, balançam na pancada e voam na investida), baba de
    // ectoplasma nas duas metades da mandíbula, a barriga que balança (mola) com as almas empurrando por dentro, molas nas juntas
    const fios = strandSet(G, m.cloak, [
      ...[0, 1, 2, 3, 4, 5, 6].map((i) => { const a = (i / 6 - 0.5) * 1.5, r = 0.44; return { anchor: (o) => head.localToWorld(o.set(Math.sin(a) * r * 0.82, Math.cos(a) * r * 0.62 + r * 0.2, r * 0.5)), n: 4, len: 0.2 + 0.12 * Math.abs(Math.sin(i * 2.3)), w0: 0.075, w1: 0.035, g: 3, keep: 0.86, flut: 0.3, ph: i } }),
      ...[-0.55, -0.3, -0.08, 0.08, 0.3, 0.55].map((x, i) => ({ anchor: (o) => B.localToWorld(o.set(x, 1.9 - Math.abs(x) * 0.25, -0.36 + Math.abs(x) * 0.12)), n: 8, len: 1.0 + 0.45 * Math.abs(Math.sin(i * 1.9)), w0: 0.19, w1: 0.05, g: 4.5, keep: 0.92, flut: 0.5, ph: i * 1.3 })),
    ])
    const baba = strandSet(G, m.drool, sk.halves.map((h, i) => ({ anchor: (o) => h.localToWorld(o.set(-h.userData.s * 0.02, -0.04, 0.07)), n: 6, len: 0.28 + 0.12 * i, w0: 0.03, w1: 0.008, g: 7, keep: 0.86, ph: i })))
    const throat = new THREE.Sprite(haloMat); throat.position.set(0, -0.1, 0.075); throat.scale.setScalar(0.001); sk.g.add(throat) // a garganta acesa
    const rig = springRig([[neck, 14, 0.55], [head, 18, 0.5], [jaw, 24, 0.45], ...sk.halves.map((h) => [h, 18, 0.4]), ...arms.flatMap((a) => [[a.upper, 20, 0.48], [a.fore, 17, 0.44], [a.hand, 14, 0.38], ...a.fingers.flatMap(([f1, f2]) => [[f1, 15, 0.42], [f2, 12, 0.36]])])])
    const BUL = [[3.2, 4.3, 0, 0.7], [5.0, 5.2, 2.1, 0.9], [4.1, 3.9, 4.0, 0.6]].map(([c, a, ph, sp]) => ({ c, a, ph, sp, k: 0 })) // as almas empurrando
    const GUT = { y: 0, v: 0, j: 0, jv: 0, ok: false }
    function gutsTick(t, dt) {
      const y = P[1].y
      if (!GUT.ok || dt <= 0) { GUT.y = y; GUT.v = 0; GUT.ok = true } else {
        const v = (y - GUT.y) / dt, a = Math.max(-60, Math.min(60, (v - GUT.v) / dt)); GUT.y = y; GUT.v = v
        GUT.jv += (-a * 0.0045 - GUT.j * 169 - 2 * 0.22 * 13 * GUT.jv) * dt; GUT.j = Math.max(-0.25, Math.min(0.25, GUT.j + GUT.jv * dt)) // a barriga balança atrasada
      }
      const full = S.souls > 0 ? 1 : 0.3, eat = S.ph === 'devour' ? 0.12 : 0
      BUL.forEach((b) => { b.c = 4.1 + 1.6 * Math.sin(t * 0.31 * b.sp + b.ph * 1.3); b.a = 4.71 + 1.0 * Math.sin(t * 0.23 * b.sp + b.ph); b.k = (0.2 * Math.pow(Math.max(0, Math.sin(t * (1.2 + b.sp) + b.ph)), 3) + eat) * full })
    }
    const bulge = (i, an) => { let s = 0; for (const b of BUL) { let d = an - b.a; d = Math.atan2(Math.sin(d), Math.cos(d)); s += b.k * Math.exp(-((i - b.c) * (i - b.c) / 1.1 + d * d / 0.2)) } return s }
    const life = (t, dt) => {
      const on = B.visible && !S.exploded && !S.gone; fios.mesh.visible = baba.mesh.visible = on
      if (!on) { fios.reset(); baba.reset(); rig.reset(); return }
      fios.step(dt, t); baba.step(dt, t); rig.apply(dt)
      throat.scale.setScalar(0.02 + 0.09 * Math.min(1, S.jaw) * (0.6 + 0.5 * Math.max(0, S.glow)))
      const br = Math.sin(t * 1.6) * 0.03; hoodM.scale.set(1.05 * (1 + br), 1.12 * (1 - br * 0.5), 1.25 * (1 + br))
      m.RIM.value = 0.55 + 0.45 * Math.max(0, S.glow) + 0.15 * heartBeat(t, 0.8)
    }
    // a onda da pancada: um anel no chão
    const shockM = new THREE.MeshBasicMaterial({ color: new THREE.Color('#9ff0ff').convertSRGBToLinear(), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })
    const shock = new THREE.Mesh(new THREE.RingGeometry(0.8, 1, 32).rotateX(-Math.PI / 2), shockM); shock.visible = false; G.add(shock)
    // o fluxo da sucção: partículas correndo do Espectral até o núcleo
    const SN = 70, sp = new Float32Array(SN * 3), su = new Float32Array(SN)
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(sp, 3))
    const stream = new THREE.Points(sg, new THREE.PointsMaterial({ color: new THREE.Color('#bff6ff').convertSRGBToLinear(), size: 0.035, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false }))
    stream.frustumCulled = false; stream.visible = false; G.add(stream)
    for (let i = 0; i < SN; i++) su[i] = Math.random()

    const S = { ph: 'idle', pt: 0, glow: 0.35, jaw: 0.1, lean: 0.12, sink: 0, home: new THREE.Vector3(0, 0, -0.15), pos: new THREE.Vector3(0, 0, -0.15), yaw: 0, groanT: 2.5, cyc: 1.5, cycK: 0, hit: false, dir: new THREE.Vector3(), from: new THREE.Vector3(), ate: false, sc: 1 } // sc: o tamanho (a Intro usa 1,6)
    const ctl = { mode: null }
    S.souls = 3; S.spawned = 0; S.spitT = 30; S.exploded = false
    const showSouls = () => souls.forEach((s, i) => (s.o.visible = i < S.souls))
    const alive = () => pool.filter((e) => e.group.visible && e.S.burst === 0 && !e.ctl.pull)
    const release = (at, spread) => { // um Espectral sai do núcleo, tonto, e se afasta devagar
      const e = pool.find((x) => !x.group.visible); if (!e) return null
      e.reset(); const p = at.clone(); if (spread) { p.x += (Math.random() - 0.5) * spread; p.y += (Math.random() - 0.3) * spread * 0.5; p.z += (Math.random() - 0.5) * spread }
      e.place(p, S.yaw + (Math.random() - 0.5) * 2); e.S.ang = Math.atan2(p.z - 0.3, p.x) + (Math.random() - 0.5) * 0.6; e.S.ph = 'daze'; e.S.pt = 0; e.group.visible = true; return e
    }
    const _w = new THREE.Vector3(), _c = new THREE.Vector3(), _bias = new THREE.Vector3(), _n = new THREE.Vector3(), _t = new THREE.Vector3(), _x = new THREE.Vector3(), _y = new THREE.Vector3(), _z = new THREE.Vector3(), BACK = new THREE.Vector3(), _m4 = new THREE.Matrix4()
    const lerp = (a, b, k) => a + (b - a) * k
    const coreW = () => coreG.getWorldPosition(new THREE.Vector3())
    function reset() {
      S.ph = 'idle'; S.pt = 0; S.sink = 0; S.hit = false; S.ate = false
      m.U.uFade.value = m.fade; m.UM.uFade.value = Math.min(0.85, m.fade + 0.15); m.UB.uFade.value = 0; m.eyes.forEach((e) => (e.visible = true)); pud.visible = false
      coreIn.visible = coreGlow.visible = true; stream.visible = false; wisps.pts.visible = true; beams.show(true)
      prey.ctl.pull = null; prey.group.visible = false
      fios.reset(); baba.reset(); rig.reset(); GUT.ok = false; GUT.j = GUT.jv = 0
      S.exploded = false; S.gone = false; S.souls = 3; S.spawned = 0; S.spitT = 30; showSouls(); tube.visible = true; B.visible = true; B.scale.setScalar(S.sc)
    }
    let food = null // quem está sendo devorado
    function trigger(k) {
      if (S.ph === 'collapse' || S.ph === 'explode') return
      if (k === 'spit' && (S.souls <= 0 || S.spawned >= 3 || alive().length >= 2)) return false // núcleo vazio, já gerou 3, ou já há 2 dele vivos
      if (food && food.ctl.pull) { food.ctl.pull = null; food.group.visible = false; stream.visible = false } // interrompe uma devorada
      S.ph = k; S.pt = 0; S.hit = false; S.ate = false; S.dirSet = false
      if (k === 'slam') SFX.esp('raise')
      if (k === 'spit' || k === 'explode') SFX.esp('swell')
      if (k === 'devour') {
        const near = alive().sort((a, b) => a.S.pos.distanceTo(S.pos) - b.S.pos.distanceTo(S.pos))[0]
        if (near) food = near // um dos dele, por perto
        else { // no laboratório, sem nenhum por perto: aparece um para a demonstração
          const off = new THREE.Vector3(1.45, 1.25, 0.95).applyAxisAngle(new THREE.Vector3(0, 1, 0), S.yaw).add(S.pos)
          prey.reset(); prey.place(off, S.yaw + Math.PI); prey.group.visible = true; food = prey
        }
        food.ctl.pull = { t: 0, dur: 4.4, from: food.S.pos.clone(), to: coreW, done: () => { S.souls = Math.min(4, S.souls + 1); showSouls(); S.glow = 2.4; S.ate = true; stream.visible = false; SFX.esp('gulp') } }
        stream.visible = true; SFX.esp('suck')
      }
      if (k === 'collapse') { SFX.esp('collapse'); pud.position.set(S.pos.x, 0.012, S.pos.z + 0.3) }
    }
    function pose(a, ux, uz, fx, curl, dt, k) {
      a.upper.rotation.x = damp(a.upper.rotation.x, ux, k, dt); a.upper.rotation.z = damp(a.upper.rotation.z, a.side * uz, k, dt)
      a.fore.rotation.x = damp(a.fore.rotation.x, fx, k, dt)
      a.fingers.forEach((f, i) => { const c = curl + (i % 2) * 0.12; f[0].rotation.x = damp(f[0].rotation.x, c, k, dt); f[1].rotation.x = damp(f[1].rotation.x, c * 1.2, k, dt) })
    }
    function update(t, dt) {
      const AR = ctl.arena // na arena: o diretor das ondas move a casa dele e escolhe os golpes; o alvo é o agente
      const caca = AR ? true : ctl.mode ? ctl.mode === 'caca' : ui.mode === 'caca'
      S.pt += dt
      if (caca && !S.exploded && S.ph !== 'rise') { S.spitT -= dt; if (S.spitT <= 0 && S.ph === 'idle') { S.spitT = 30; trigger('spit') } } // a cada 30 s, cospe uma alma
      if (S.ph === 'idle' && caca && !AR) { S.cyc -= dt; if (S.cyc <= 0) { trigger(S.cycK++ % 2 ? 'charge' : 'slam'); S.cyc = 2.4 } }
      const p = S.pt, sway = Math.sin(t * 0.9)
      let ux = -0.42, uz = 0.2, fx = -0.35, curl = 0.4, jawT = 0.14 + 0.06 * Math.sin(t * 1.3), glowT = 0.35 + 0.1 * Math.sin(t * 2), lean = 0.12, yawT = AR ? Math.atan2(AR.target.x - S.pos.x, AR.target.z - S.pos.z) : Math.sin(t * 0.23) * 0.5, armK = 5
      const posT = _w.copy(S.home); let snapPos = false
      if (S.ph === 'rise') { // a entrada na arena: sobe do Luto, de braços abertos
        S.sink = 1 - smooth(p / 2.4); ux = -1.2; uz = 0.6; jawT = 0.9; glowT = 1.4
        if (p > 2.4) { S.ph = 'idle'; S.pt = 0; S.sink = 0 }
      } else if (S.ph === 'idle') {
        if (!AR) { posT.x += Math.sin(t * 0.25) * 0.35; posT.z += Math.cos(t * 0.21) * 0.25 }
        S.groanT -= dt; if (S.groanT <= 0) { SFX.esp('groan'); S.groanT = 6 + Math.random() * 5 }
      } else if (S.ph === 'slam') {
        armK = 10
        if (p < 1.0) { const k = smooth(p); ux = lerp(-0.42, -2.75, k); fx = lerp(-0.35, -0.6, k); uz = 0.2 + 0.25 * k; jawT = 0.2 + 0.7 * k; glowT = 0.4 + 1.8 * k; lean = 0.12 - 0.25 * k }
        else if (p < 1.22) { const k = smooth((p - 1) / 0.22); armK = 30; ux = lerp(-2.75, -0.95, k); fx = lerp(-0.6, -0.12, k); uz = 0.45 - 0.3 * k; jawT = 0.95; glowT = 2.2 - 1.2 * k; lean = -0.13 + 0.45 * k
          if (!S.hit && p >= 1.12) { S.hit = true; SFX.esp('slam'); shock.position.copy(B.localToWorld(new THREE.Vector3(0, 0, 1.2))); shock.position.y = 0.02; shock.visible = true; S.shockT = 0; if (AR) AR.slam(shock.position) } }
        else { const k = smooth((p - 1.22) / 0.9); ux = lerp(-0.95, -0.42, k); fx = lerp(-0.12, -0.35, k); lean = lerp(0.32, 0.12, k); jawT = lerp(0.6, 0.14, k); glowT = lerp(1, 0.35, k); if (p > 2.2) { S.ph = 'idle'; S.pt = 0 } }
      } else if (S.ph === 'charge') {
        if (p < 0.01 || !S.dirSet) { const tp = AR ? AR.target : camera.position; S.dir.set(tp.x - S.pos.x, 0, tp.z - S.pos.z).normalize(); S.from.copy(S.pos); S.dirSet = true; S.reach = AR ? AR.reach(S) : 1.6 }
        yawT = Math.atan2(S.dir.x, S.dir.z); armK = 9
        if (p < 0.5) { const k = smooth(p / 0.5); lean = 0.12 - 0.22 * k; ux = lerp(-0.42, 0.45, k); fx = -0.5; jawT = 0.5 * k; glowT = 0.7 }
        else if (p < 0.85) { const k = smooth((p - 0.5) / 0.35); posT.copy(S.from).addScaledVector(S.dir, S.reach * k); snapPos = true; lean = 0.45; ux = -1.5; fx = -0.2; uz = 0.35; jawT = 0.85; glowT = 0.9; curl = 0.1; if (!S.hit) { S.hit = true; SFX.esp('charge') } if (AR) AR.charging(S) }
        else if (AR) { posT.copy(S.from).addScaledVector(S.dir, S.reach); S.home.copy(posT); snapPos = true; const k = smooth((p - 0.85) / 0.75); lean = lerp(0.45, 0.12, k); ux = lerp(-1.5, -0.42, k); if (p > 1.6) { S.ph = 'idle'; S.pt = 0; S.dirSet = false } } // na arena ele fica onde parou
        else { const k = smooth((p - 0.85) / 0.75); posT.copy(S.from).addScaledVector(S.dir, 1.6 * (1 - k)); snapPos = true; lean = lerp(0.45, 0.12, k); ux = lerp(-1.5, -0.42, k); if (p > 1.6) { S.ph = 'idle'; S.pt = 0; S.dirSet = false } }
      } else if (S.ph === 'devour') {
        const k = smooth(p / 0.6), pp = prey.S.pos
        if (food && food.group.visible) yawT = Math.atan2(food.S.pos.x - S.pos.x, food.S.pos.z - S.pos.z) - 0.25
        armK = 6; ux = lerp(-0.42, -1.55, k); uz = 0.2 + 0.4 * k; fx = -0.1; curl = 0.08; lean = 0.25
        jawT = S.ate ? lerp(0.9, 0.14, smooth((p - 4.5) / 0.6)) : 0.25 + 0.7 * k; glowT = S.ate ? glowT : 0.5 + 1.3 * smooth(p / 4.4)
        if (prey.group.visible) prey.update(t, dt)
        if (stream.visible && food) { // o fluxo: do pequeno até o núcleo
          const a = food.mouth(), b = coreW()
          for (let i = 0; i < SN; i++) { su[i] = (su[i] + dt * (0.6 + (i % 5) * 0.12)) % 1; const u = su[i], wob = Math.sin(u * 9 + t * 6 + i) * 0.06 * (1 - u); sp[i * 3] = lerp(a.x, b.x, u) + wob; sp[i * 3 + 1] = lerp(a.y, b.y, u) + Math.cos(u * 7 + i) * 0.05 * (1 - u); sp[i * 3 + 2] = lerp(a.z, b.z, u) - wob }
          sg.attributes.position.needsUpdate = true
        }
        if (p > 5.6) { S.ph = 'idle'; S.pt = 0 }
      } else if (S.ph === 'spit') { // o núcleo incha, ele se abre e uma alma sai do peito
        const k = smooth(p / 1.0); armK = 8
        ux = lerp(-0.42, -1.25, k); uz = 0.2 + 0.55 * k; fx = -0.2; curl = 0.05; lean = 0.12 - 0.22 * k; jawT = 1.05 * k; glowT = 0.6 + 2.0 * k
        if (p >= 1.0 && !S.hit) { S.hit = true; S.souls--; S.spawned++; showSouls(); const e = release(coreW(), 0.2); if (e) e.S.pos.addScaledVector(new THREE.Vector3(Math.sin(S.yaw), 0, Math.cos(S.yaw)), 0.2); S.glow = 3; SFX.esp('spit') }
        if (p > 1.6) { S.ph = 'idle'; S.pt = 0 }
      } else if (S.ph === 'explode') { // incha, treme e estoura: as almas que sobraram escapam
        armK = 10; jawT = 1.2; curl = 0.02
        if (p < 1.2) { const k = p / 1.2; ux = lerp(-0.42, -2.3, k); uz = 0.2 + 0.7 * k; fx = -0.3; lean = -0.1 * k; glowT = 1 + 3 * k; B.scale.setScalar((1 + 0.18 * k * k + Math.sin(t * 60) * 0.02 * k) * S.sc) }
        else {
          if (!S.exploded) {
            S.exploded = true; SFX.esp('explode'); S.vv = verts.map(() => new THREE.Vector3((Math.random() - 0.5) * 6, 1 + Math.random() * 3, (Math.random() - 0.5) * 6))
            const at = coreW(); for (let i = 0; i < S.souls; i++) release(at, 0.9); S.souls = 0; showSouls()
            shock.position.set(S.pos.x, 0.02, S.pos.z); shock.visible = true; S.shockT = 0; pud.position.set(S.pos.x, 0.012, S.pos.z); pud.visible = true; B.visible = false; tube.visible = false; beams.show(false); stream.visible = false
          }
          glowT = p < 1.35 ? 6 : 0; if (p > 1.4) coreIn.visible = coreGlow.visible = false
          verts.forEach((v, i) => { const vv = S.vv[i]; vv.y -= 6 * dt; v.position.addScaledVector(vv, dt); v.rotation.x += dt * 6; v.rotation.z += dt * 4; if (v.position.y < 0.04) { v.position.y = 0.04; vv.multiplyScalar(0.4); vv.y = Math.abs(vv.y) * 0.3 } })
          pud.material.opacity = Math.min(0.55, (p - 1.2) * 0.9) * (p > 5 ? Math.max(0, 1 - (p - 5) / 1) : 1); pud.scale.setScalar(0.5 + Math.min(2, (p - 1.2) * 2))
          if (p > 3) m.UB.uFade.value = Math.min(1, (p - 3) / 1.2)
          if (p > 8.5 && !AR) pool.forEach((e) => { if (e.group.visible && e.S.burst === 0 && !e.ctl.pull) e.burst() }) // (laboratório) os soltos estouram antes de ele voltar
          if (p > 9.6) { if (AR) { G.visible = false; beams.light(0); S.gone = true; return } reset(); verts.forEach((v) => v.rotation.set(0, 0, 0)) } // na arena: some (os soltos continuam com o diretor)
        }
      } else if (S.ph === 'collapse') {
        const k = smooth(p / 1.6); armK = 4
        ux = lerp(-0.42, 0.15, k); uz = 0.05; fx = 0; curl = 0; jawT = 0.95; lean = 0.12 + 0.8 * smooth(p / 2.2)
        glowT = p < 1.4 ? 0.5 + p * 1.2 : p < 1.6 ? 3.2 : Math.max(0, 3.2 - (p - 1.6) * 5)
        S.sink = smooth((p - 0.3) / 2.0)
        if (p > 1.6) { pud.visible = true; pud.material.opacity = Math.min(0.5, (p - 1.6) * 0.8) * (p > 3.8 ? Math.max(0, 1 - (p - 3.8) / 0.7) : 1); pud.scale.setScalar(0.4 + Math.min(1.4, (p - 1.6) * 1.2)); if (coreIn.visible && p > 1.7) coreIn.visible = coreGlow.visible = false }
        if (p > 2.4) { m.U.uFade.value = Math.min(1, m.fade + (p - 2.4) * 0.7); m.UM.uFade.value = Math.min(1, m.fade + 0.15 + (p - 2.4) * 0.7); m.UB.uFade.value = Math.min(1, (p - 2.6) / 0.9) }
        if (p > 4.6) { if (AR && AR.hold) { if (G.visible) { G.visible = false; beams.light(0) } } else reset() } // (na Intro ele fica desfeito até a captura ou a volta)
      }
      if (snapPos) S.pos.copy(posT); else S.pos.lerp(posT, 1 - Math.exp(-1.5 * dt))
      S.yaw = dampA(S.yaw, yawT, S.ph === 'idle' ? 1.2 : 5, dt); S.glow = damp(S.glow, glowT, 6, dt); S.lean = damp(S.lean, lean, 6, dt)
      const sw = Math.sin(t * 1.1) * 0.1 * (1 - S.sink) * S.sc // serpenteia de um lado para o outro
      B.position.set(S.pos.x + Math.cos(S.yaw) * sw, (0.14 + Math.sin(t * 1.1) * 0.05 - S.sink * 0.95) * S.sc, S.pos.z - Math.sin(S.yaw) * sw); B.rotation.set(S.lean * 0.25, S.yaw, Math.sin(t * 1.1 + 0.6) * 0.06); if (S.ph !== 'explode') B.scale.set(S.sc, S.sc * (1 - 0.45 * S.sink), S.sc)
      // a espinha segue os ombros: o tronco desce quase reto, a cauda ondula e vai para trás
      if (!S.exploded) {
      B.updateMatrixWorld(true)
      const hx = Math.sin(S.yaw), hz = Math.cos(S.yaw), gx = Math.cos(S.yaw), gz = -Math.sin(S.yaw)
      P[0].copy(B.localToWorld(_c.set(0, 1.72, -0.06)))
      const kk = 1 - Math.exp(-3 * dt)
      for (let i = 1; i < N; i++) {
        const u = i / N, back = 0.12 + 0.95 * smooth((u - 0.3) / 0.45), wave = Math.sin(t * 2.2 - i * 0.5) * (0.1 + 0.65 * u) + (S.ph === 'charge' ? Math.sin(t * 9 - i) * 0.4 * u : 0)
        _bias.set(-hx * back + gx * wave, -1 + 0.8 * smooth((u - 0.4) / 0.4), -hz * back + gz * wave).normalize()
        _n.subVectors(P[i], P[i - 1]); if (_n.lengthSq() < 1e-8) _n.copy(_bias); _n.normalize()
        _n.lerp(_bias, Math.min(1, kk * (2.2 - u * 1.4))).normalize()
        P[i].copy(P[i - 1]).addScaledVector(_n, SEG * (1 - u * 0.2) * S.sc)
        const fl = (0.3 + Math.sin(t * 1.6 + i * 0.7) * 0.07) * S.sc; if (P[i].y < fl) P[i].y = fl // a cauda flutua rente ao chão, sem encostar
      }
      BACK.set(-hx, 0, -hz)
      for (let i = 1; i < N; i++) {
        const v = verts[i - 1]; v.position.copy(P[i]); if (v.scale.x !== S.sc) v.scale.setScalar(S.sc)
        _z.subVectors(P[i - 1], P[i]).normalize(); _y.copy(BACK).addScaledVector(_z, -BACK.dot(_z)); if (_y.lengthSq() < 1e-6) _y.set(0, 1, 0); _y.normalize(); _x.crossVectors(_y, _z)
        _m4.makeBasis(_x, _y, _z); v.quaternion.setFromRotationMatrix(_m4)
      }
      coreG.position.copy(verts[2].localToWorld(_c.set(0, -0.3, 0))); if (coreG.scale.x !== S.sc) coreG.scale.setScalar(S.sc)
      gutsTick(t, dt)
      for (let i = 0; i < N; i++) { // a membrana: mais funda na frente do peito, afinando até a cauda
        const u = i / N
        _t.subVectors(P[Math.max(0, i - 1)], P[Math.min(N - 1, i + 1)]).normalize()
        _y.copy(BACK).addScaledVector(_t, -BACK.dot(_t)); if (_y.lengthSq() < 1e-6) _y.set(0, 1, 0); _y.normalize(); _x.crossVectors(_y, _t)
        const off = 0.3 * pw(1 - u, 1.6) * S.sc, r = (0.5 * pw(1 - u, 0.75) + 0.05) * (1 + 0.08 * Math.sin(t * 3 + i)) * (1 + 0.1 * Math.max(0, S.glow)) * (1 + GUT.j * Math.max(0, 1 - i / 8)) * S.sc
        const cx = P[i].x - _y.x * off, cy = P[i].y - _y.y * off, cz = P[i].z - _y.z * off
        for (let k = 0; k < K; k++) {
          const an = k / K * Math.PI * 2, fl = r * (1 + 0.07 * Math.sin(t * 5 + k * 1.9 + i) + (i < 9 ? bulge(i, an) : 0)), c = Math.cos(an) * fl, s2 = Math.sin(an) * fl * 0.85, o = (i * K + k) * 3
          tp[o] = cx + c * _x.x + s2 * _y.x; tp[o + 1] = cy + c * _x.y + s2 * _y.y; tp[o + 2] = cz + c * _x.z + s2 * _y.z
        }
      }
      tg.attributes.position.needsUpdate = true; tg.computeVertexNormals(); tg.computeBoundingSphere()
      }
      pool.forEach((e) => { if (e.group.visible) e.update(t, dt) }) // os que saíram dele
      neck.rotation.set(0.25 + S.lean * 0.9 + Math.sin(t * 2.2 + 0.4) * 0.06, Math.sin(t * 1.1 + 0.3) * 0.28, Math.sin(t * 1.1 + 1.0) * 0.14) // o pescoço segue a onda do corpo
      head.rotation.y = Math.sin(t * 0.5) * 0.22 * (S.ph === 'idle' ? 1 : 0.2) + Math.sin(t * 2.2) * 0.08; head.rotation.z = 0.32 + Math.sin(t * 0.37) * 0.08 + Math.sin(t * 1.1 + 1.6) * 0.1 // a cabeça pende, torta
      S.jaw = damp(S.jaw, jawT * 1.25, S.ph === 'slam' && p > 1 && p < 1.3 ? 25 : 7, dt); sk.setJaw(S.jaw)
      strips.forEach((st, i) => { st.rotation.x = 0.12 + Math.sin(t * 1.7 + i) * 0.1 })
      arms.forEach((a, i) => pose(a, ux + (S.ph === 'idle' ? (i ? 1 : -1) * sway * 0.12 : 0), uz + 0.18, fx, curl, dt, armK))
      // o núcleo pulsa; as almas giram
      const g = Math.max(0, S.glow)
      coreGlow.scale.setScalar(1 + g * 0.55 + Math.sin(t * 5) * 0.05); coreGlow.material.opacity = Math.min(0.9, 0.3 + 0.22 * g); coreIn.scale.setScalar(1 + 0.35 * g)
      souls.forEach((s) => { s.o.rotation.y = t * (1.1 + s.k * 0.2) + s.k * 1.57; s.o.rotation.x = Math.sin(t * 0.8 + s.k) * 0.5; s.s.jaw.rotation.x = 0.3 + 0.3 * Math.sin(t * 6 + s.k * 2) })
      m.eyes.forEach((e) => e.scale.setScalar(1 + g * 0.5))
      beams.mat.opacity = beams.base * (0.7 + 0.45 * g); if (S.ph === 'collapse' && p > 1.6) beams.show(false)
      beams.light(G.visible && !S.exploded ? 4.0 * (0.7 + 0.4 * g) : 0)
      if (shock.visible) { S.shockT += dt; const k = S.shockT / 0.7; shock.scale.setScalar((0.3 + k * 2.6) * S.sc); shockM.opacity = Math.max(0, 0.8 * (1 - k)); if (k >= 1) shock.visible = false }
      if ((S.ph !== 'collapse' || p < 1.6) && !S.exploded) wisps.step(dt, () => { const i = Math.random() * N | 0; return _c.set(P[i].x + (Math.random() - 0.5) * 0.5, P[i].y + (Math.random() - 0.5) * 0.5, P[i].z + (Math.random() - 0.5) * 0.5) })
      else wisps.pts.visible = false
      life(t, dt)
    }
    const vec = (o, x, y, z) => o.localToWorld(new THREE.Vector3(x, y, z))
    return {
      group: G, update, S, ctl, head, jaw, arms, coreG, souls, trigger, reset, pool, killSmall: () => pool.forEach((e) => { if (e.group.visible && e.S.burst === 0 && !e.ctl.pull) e.burst() }), mats: m, lightOff: () => beams.light(0),
      mouth: () => vec(head, 0, -0.16, 0.2),
      views: {
        corpo: () => ({ theta: 0.5, elev: 0.12, dist: 6.0, focus: () => new THREE.Vector3(S.pos.x * 0.5, 1.35, S.pos.z * 0.5 + 0.2) }),
        rosto: () => ({ theta: 0.22, elev: 0.06, dist: 1.6, focus: () => coreW() }), // o núcleo
        maos: () => ({ theta: 0.75, elev: 0.3, dist: 1.8, focus: () => arms[1].hand.getWorldPosition(new THREE.Vector3()) }), // as garras
      },
    }
  }
  const glutao = buildGlutao(espPrey, espPool)
  // ---------- polimento dos modelos: juntas cobertas e pés no chão (o que deixou o Amigo consistente) ----------
  // junta descoberta = um membro (cilindro preso pelo topo na junta) sem esfera em volta: ao dobrar, abre fresta. Cobre com uma esfera do mesmo material
  function capJoints(list) {
    list.forEach((L) => Object.values(L).forEach((g) => {
      if (!g || !g.isGroup) return
      let cyl = null, r = 0
      g.children.forEach((m) => { if (m.isMesh && m.geometry.type === 'CylinderGeometry') { m.geometry.computeBoundingBox(); if (Math.abs(m.geometry.boundingBox.max.y + m.position.y) < 0.03 && m.geometry.parameters.radiusTop > r) { r = m.geometry.parameters.radiusTop; cyl = m } } })
      if (!cyl) return
      const near = (par, at) => par.children.some((m) => m.isMesh && m.geometry.type === 'SphereGeometry' && m.position.distanceTo(at) < Math.max(0.03, r * 0.8))
      if (near(g, new THREE.Vector3()) || (g.parent && near(g.parent, g.position))) return
      const cap = new THREE.Mesh(new THREE.SphereGeometry(r * 1.06, 8, 6), cyl.material); cap.position.set(cyl.position.x, 0, cyl.position.z); cap.castShadow = true; g.add(cap)
      if (cyl.userData.it) cap.userData.it = cyl.userData.it
    }))
  }
  capJoints(sombra.R.arms); capJoints(sombra.R.legs); capJoints(desc.R.arms); capJoints(desc.R.legs); capJoints(garota.legs); capJoints(observador.arms); capJoints(observador.legs); capJoints(reflexo.arms); capJoints(arms)
  // pés no chão: o ponto mais baixo de cada pata (e a ponta e o calcanhar), achados na geometria; a cada quadro o fantasma sobe ou desce
  // para a parte de apoio encostar no assoalho (antes elas afundavam ou flutuavam até 30 cm). A Garota e o Mordomo flutuam de propósito.
  function soleOf(o) {
    if (o.userData.soles) return o.userData.soles
    o.updateMatrixWorld(true); const inv = new THREE.Matrix4().copy(o.matrixWorld).invert(), v = new THREE.Vector3(); let lo = null, fr = null, bk = null
    o.traverse((m) => { if (!m.isMesh) return; const P = m.geometry.attributes.position; for (let j = 0; j < P.count; j++) { v.fromBufferAttribute(P, j).applyMatrix4(m.matrixWorld).applyMatrix4(inv); if (!lo || v.y < lo.y) lo = v.clone(); if (!fr || v.z > fr.z) fr = v.clone(); if (!bk || v.z < bk.z) bk = v.clone() } })
    return (o.userData.soles = [lo, fr, bk].filter(Boolean))
  }
  const _gv = new THREE.Vector3()
  function groundTo(G, parts, dt, on, rate = 12) { // parts: [objeto, peso]; peso 0 = não conta (as mãos do Observador em pé)
    const want = (() => {
      if (!on) return 0
      const keep = G.position.y; G.position.y = 0; G.updateMatrixWorld(true); let m = 9
      for (const [o, w] of parts) { if (w <= 0.02) continue; for (const pt of soleOf(o)) { _gv.copy(pt); o.localToWorld(_gv); m = Math.min(m, _gv.y + (1 - w) * 3) } }
      G.position.y = keep; return m > 2 ? 0 : -m
    })()
    G.userData.gy = G.userData.gy === undefined || (on && rate === Infinity) ? want : damp(G.userData.gy, want, on ? rate : 4, dt)
    G.position.y = G.userData.gy
  }
  const GROUND = {
    sombra: () => sombra.R.legs.map((l) => [l.foot, 1]),
    desc: () => { const w = desc.st.out ? 1 : smooth((desc.st.tf - 0.85) / 0.15); return desc.R.legs.map((l) => [l.foot, w]) },
    observador: () => { const q = observador.S.q; return [...observador.legs.map((l) => [l.foot, 1]), ...observador.arms.map((a) => [a.hand, smooth((q - 0.4) / 0.4)])] }, // galopando, as mãos também apoiam
  }



  const isFps = (g) => g === 'demo' || g === 'bando' || g === 'casa' || g === 'intro' // os modos jogáveis: a câmera e o controle são deles
  const fpsOf = () => demo

  function caption() {
    let c
    if (ui.ghost === 'demo') c = '<b>Demo da luta:</b> a Mãe no berçário, em terceira pessoa, com o agente novo. Clique na tela para começar; precisa de teclado e mouse.'
    else if (ui.ghost === 'intro') c = '<b>Demo da Intro (etapa 1):</b> a instalação da C.R.O.S. para andar e sentir o espaço, da eclusa até a usina. Portas com E. Clique na tela para começar; precisa de teclado e mouse.'
    else if (ui.ghost === 'casa') c = '<b>Demo da casa:</b> o Palacete Monteval, da varanda até o berçário, com três Espectrais e o Glutão pelo caminho, a Mãe de passagem e a luta com ela no fim. Clique na tela para começar; precisa de teclado e mouse.'
    else if (ui.ghost === 'bando') c = '<b>Demo do Bando:</b> quatro ondas de Espectrais e o Glutão, no berçário, em terceira pessoa. Clique na tela para começar; precisa de teclado e mouse.'
    else if (ui.ghost === 'mae') c = captions.mae
    else if (ui.ghost === 'desc') c = ui.mode === 'caca' ? captions.descRev : ui.vaga === 'sim' ? captions.descVaga : captions.descDisf
    else if (ui.ghost === 'garota') c = ui.mode === 'caca' ? captions.garotaCaca : captions.garotaPass
    else if (ui.ghost === 'mordomo') c = ui.mode === 'caca' ? captions.mordRaj : captions.mordVag
    else if (ui.ghost === 'reflexo') c = ui.mode === 'caca' ? captions.refSusto : captions.refEsp + (ui.bleed === 'on' ? captions.refSangue : '')
    else if (ui.ghost === 'amigo') c = ui.mode === 'caca' ? (ui.dist === 'longe' ? captions.amigoAranha : captions.amigoCaca) : captions.amigoVaga
    else if (ui.ghost === 'espectral') c = ui.mode === 'caca' ? captions.espAtaque : captions.espRoda
    else if (ui.ghost === 'glutao') c = ui.mode === 'caca' ? captions.gluCaca : captions.gluVaga
    else if (ui.ghost === 'observador') c = ui.mode === 'caca' ? captions.obsBote : captions.obsOlha + (ui.light === 'lanterna' ? captions.obsLuz : '')
    else c = (ui.light === 'escuro' ? captions.sombraEscuro : captions.sombraLuz) + (ui.weak === 'quebrado' ? captions.sombraFraca : '')
    const idleCap = { mae: 'idleMae', sombra: 'idleSombra', garota: 'idleGarota', amigo: 'idleAmigo' }[ui.ghost]
    if (idleCap && !isFps(ui.ghost) && ui.mode !== 'caca' && ui.ritmo !== 'andar') c += captions[idleCap]
    if (ui.ghost === 'observador' && ui.follow === 'on') c += captions.obsSegue
    else if (ui.follow === 'on' && ['mae', 'sombra', 'desc', 'garota', 'amigo'].includes(ui.ghost)) c += captions.segue
    if (ui.det === 'on') c += captions.det
    document.getElementById('caption').innerHTML = c
  }
  function setGhost(name) {
    if (name === 'bando') name = 'intro' // a demo do Bando saiu do laboratório (a Intro ficou no lugar dela)
    if (typeof LUTA !== 'undefined') LUTA.stop()
    SFX.setGhost(name)
    if (death && death.on) endDeath()
    ui.ghost = name
    if (demo.on && name !== 'demo' && name !== 'bando' && name !== 'casa' && name !== 'intro') demo.exit()
    const d = GHOSTS[name]
    document.getElementById('g-eyebrow').textContent = d.eyebrow
    document.getElementById('g-name').textContent = d.name
    document.getElementById('g-latin').textContent = d.latin
    document.getElementById('g-tier').textContent = d.tier
    document.getElementById('g-summary').textContent = d.summary
    const ul = document.getElementById('g-notes'); ul.textContent = ''
    d.notes.forEach((t) => { const li = document.createElement('li'); li.textContent = t; ul.appendChild(li) })
    document.querySelectorAll('.roster button[data-ghost]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.ghost === name)))
    document.querySelectorAll('.group[data-for]').forEach((g) => (g.hidden = !g.dataset.for.split(' ').includes(name)))
    maeGroup.visible = name === 'mae'
    sombra.group.visible = name === 'sombra'
    desc.group.visible = name === 'desc'
    garota.group.visible = name === 'garota'
    mordomo.group.visible = name === 'mordomo'
    document.getElementById('deathLbl').textContent = name === 'mordomo' ? 'Encontro' : name === 'reflexo' ? 'Travessia' : 'Morte'
    document.getElementById('deathBtn').textContent = name === 'mordomo' ? '▶ Ver atordoamento' : name === 'reflexo' ? '▶ Atravessar' : '▶ Ver morte'
    const outside = name === 'observador'
    observador.group.visible = outside
    reflexo.group.visible = name === 'reflexo'
    amigo.group.visible = name === 'amigo'
    espectral.group.visible = name === 'espectral'; glutao.group.visible = name === 'glutao'; espPrey.group.visible = false; espPrey.ctl.pull = null; espPool.forEach((e) => { e.group.visible = false; e.ctl.pull = null })
    room.children[1].visible = room.children[2].visible = name !== 'reflexo' // a parede do fundo vira a do espelho
    const isCampo = isFps(name)
    if (name === 'demo' || name === 'bando' || name === 'casa' || name === 'intro') demo.enter(name === 'bando' ? 'bando' : name === 'casa' ? 'casa' : name === 'intro' ? 'intro' : 'mae')
    roomBase = !outside && !isCampo; room.visible = bulb.visible = cord.visible = roomBase
    document.querySelectorAll('.group:not([data-for])').forEach((g) => (g.hidden = isCampo && !g.hasAttribute('data-always'))) // nos modos jogáveis ficam só o som e o filtro
    document.querySelectorAll('.dock-row').forEach((r) => (r.hidden = ![...r.querySelectorAll('.group')].some((g) => !g.hidden))) // linha sem nada some
    scene.fog.color.set(outside ? '#0a0d12' : '#050607'); scene.fog.density = outside ? 0.075 : 0.16
    scene.background.set(outside ? '#080a0e' : '#050607')
    if (isCampo) { scene.fog.color.set('#07080b'); scene.fog.density = name === 'demo' || name === 'bando' ? 0.017 : name === 'casa' || name === 'intro' ? 0.032 : 0.07; scene.background.set('#07080b'); if (name === 'demo' || name === 'bando') { scene.fog.color.set('#0b0e0d'); scene.background.set('#0b0e0d') } }
    const lights = d.lights || ['Lanterna', 'Lâmpada', 'Escuro']
    document.querySelectorAll('.seg[data-key="light"] button').forEach((b, i) => (b.textContent = lights[i]))
    lightMul = spotMul = 1
    const labels = d.modes || ['Patrulha', 'Caça']
    document.querySelectorAll('.seg[data-key="mode"] button').forEach((b, i) => (b.textContent = labels[i]))
    const cams = d.cams || ['Corpo', 'Rosto', 'Mãos']
    document.querySelectorAll('.seg[data-key="cam"] button').forEach((b, i) => (b.textContent = cams[i]))
    setView(ui.cam)
    caption()
  }

  // ---------- animação ----------
  const damp = (cur, target, k, dt) => cur + (target - cur) * (1 - Math.exp(-k * dt))
  const S = { ph: 0, lean: 0.3, head: 0.55, roll: 0, arm: [0, 0], armZ: [0, 0], elbow: [0, 0], curl: [0.3, 0.3], twist: [0, 0], wrist: [0.1, 0.1], spread: [0, 0], twitch: 0, next: 2, tic: 0, eye: 0, skirtY: 0, headY: 0 }

  let forceChase = false
  function animate(t, dt) {
    const chase = ui.mode === 'caca' || forceChase
    const P = patrol('mae', dt, chase || (death && death.on))
    const W = death && death.on ? 1 - maeHold : P.w, ie = P.ie, it = P.it
    S.ph += dt * (chase ? 4.4 : 1.9) * W
    PANO.S.gait = S.ph; PANO.S.walk = W * (chase ? 1 : 0.75) // as pernas (do pano) andam com o passo
    const ph = S.ph
    const stepN = Math.floor(ph / Math.PI) // um passo a cada meia volta do ciclo
    if (stepN !== S.stepN) { if (S.stepN !== undefined && (!(death && death.on) || calmSeq)) SFX.step('mae', chase); S.stepN = stepN }
    hips.position.y = Math.abs(Math.sin(ph)) * (chase ? 0.03 : 0.018) * W
    hips.rotation.y = Math.sin(ph) * 0.1 * W
    S.skirtY = damp(S.skirtY, -hips.rotation.y * 0.8, 6, dt)
    skirt.rotation.y = S.skirtY
    skirt.rotation.x = -0.03 + Math.sin(ph * 2) * 0.012 * W

    // pausa: para, ergue a cabeça e escuta virando o ouvido devagar; a mão sobe sentindo o ar;
    // de repente o pescoço estala para o outro lado e os dedos fecham; depois volta a andar
    const snapped = it > 3.1 && it < 5.0
    const armE = ie * pSm((it - 0.9) / 0.8) * (1 - pSm((it - 5.0) / 0.7))
    if (ie > 0) { if (cue(P, 0.6)) SFX.idle('maeInhale'); if (cue(P, 1.7)) SFX.idle('maeFingers'); if (cue(P, 3.1)) SFX.idle('maeSnap') }
    S.lean = damp(S.lean, ((chase ? 0.56 + Math.abs(Math.sin(ph)) * 0.08 : 0.34) + Math.sin(ph * 2) * 0.02 * W) * (1 - ie) + 0.22 * ie, 4, dt)
    spineRoot.rotation.x = S.lean
    spineRoot.rotation.z = Math.sin(ph) * 0.045 * W

    // cabeça: caída na patrulha; na caça, levanta com tiques bruscos
    S.tic = Math.max(0, S.tic - dt)
    if (S.tic === 0 && Math.random() < dt * (chase ? 1.2 : 0.25 * (1 - ie))) { S.tic = 0.22; if (!(death && death.on)) SFX.crack(0.12) } // o pescoço estala
    const headT0 = chase ? (S.tic > 0 ? 0.25 : -0.32) : (S.tic > 0 ? 0.35 : 0.6)
    const headT = headT0 + (0.18 - headT0) * ie // escutando: cabeça erguida
    S.head = damp(S.head, headT, S.tic > 0 ? 22 : 5, dt)
    neck.rotation.x = S.head
    S.roll = damp(S.roll, (chase ? Math.sin(t * 1.7) * 0.14 : 0.18 + Math.sin(t * 0.5) * 0.06) * (1 - ie) + (snapped ? -0.42 : 0.38) * ie, snapped && it < 3.3 ? 24 : 4, dt)
    neck.rotation.z = S.roll
    const yT = (it < 3.1 ? 0.85 * pSm((it - 0.7) / 2.0) : snapped ? -0.7 : 0) * ie // o ouvido vira devagar; o estalo é seco
    S.headY = damp(S.headY, yT, snapped && it < 3.3 ? 26 : 2.5, dt)
    neck.rotation.y = S.headY


    S.next -= dt
    if (S.next <= 0) { S.twitch = 0.45; S.next = 1.2 + Math.random() * 2.5; if (!(death && death.on)) SFX.crack(0.2) } // os dedos estalam
    S.twitch = Math.max(0, S.twitch - dt)

    arms.forEach((a, k) => {
      // andando, os braços balançam soltos (pesados, pendurados): o cotovelo dobra atrasado e a mão cai por último
      const sw = Math.sin(ph + (k ? Math.PI : 0)), lag = Math.sin(ph + (k ? Math.PI : 0) - 0.9)
      const swing = sw * 0.2 * W
      let ax = -S.lean * 0.9 + 0.06 + swing, el = -0.16 - 0.3 * W * Math.max(0, lag), curl = 0.28 + 0.14 * W * (0.5 + 0.5 * lag), az = a.side * (0.24 + 0.05 * W * (0.5 + 0.5 * sw)), tw = a.side * 0.12 * W * sw, wr = 0.1 + 0.32 * W * lag, sp = 0.15 * W
      if (k === 1 && armE > 0) { // a mão erguida, dedos abertos tateando o ar; no estalo, fecham
        ax += (-1.3 - ax) * armE; az += (a.side * 0.45 - az) * armE; el += (-0.7 - el) * armE; tw += (a.side * 0.35 - tw) * armE; wr += (-0.25 - wr) * armE
        curl += ((snapped ? 1.0 : 0.06 + Math.max(0, Math.sin(t * 6.5)) * 0.22) - curl) * armE; sp += ((snapped ? 0.2 : 1) - sp) * armE
      }
      if (chase) {
        // garra alternada, com a dobra natural do cotovelo (para baixo): um braço recolhe com a mão
        // erguida e caída em garra enquanto o outro estica rasgando o ar à frente
        const r = pw(0.5 + 0.5 * Math.sin(ph + (k ? Math.PI : 0)), 0.55)
        tw = a.side * 0.3 // leve giro para dentro: cotovelos um pouco abertos
        // o tronco já vai inclinado: soma-se a ele (recolhido 45° para baixo, esticado na horizontal)
        ax = -S.lean - 0.85 - 0.75 * r + Math.sin(t * 7 + k) * 0.04
        az = a.side * (0.18 - 0.1 * r)
        el = -(1.4 - 1.25 * r)
        wr = 0.95 - 1.15 * r
        curl = 0.9 - 0.9 * r
        sp = r
      }
      if (S.twitch > 0) curl += Math.sin(t * 34 + k * 2) * 0.35
      const fast = chase ? 11 : 6.5
      S.arm[k] = damp(S.arm[k], ax, fast, dt)
      S.armZ[k] = damp(S.armZ[k], az, fast, dt)
      S.twist[k] = damp(S.twist[k], tw, 6, dt)
      S.elbow[k] = damp(S.elbow[k], el, fast + 2, dt)
      S.wrist[k] = damp(S.wrist[k], wr, 12, dt)
      S.curl[k] = damp(S.curl[k], curl, 16, dt)
      S.spread[k] = damp(S.spread[k], sp, 12, dt)
      a.upper.rotation.set(S.arm[k], S.twist[k], S.armZ[k], 'XZY') // gira, abre, ergue
      a.fore.rotation.x = S.elbow[k]
      a.hand.rotation.set(S.wrist[k], 0, 0) // zera o giro que a pegada (IK) deixou no pulso
      a.fingers.forEach((chain, i) => {
        chain.forEach((seg, j) => { seg.rotation.x = S.curl[k] * (0.6 + j * 0.35) * (1 + (i % 2) * 0.2) })
        chain[0].rotation.z = (i - 1.5) * 0.14 * S.spread[k] // dedos abertos ao esticar
      })
      a.thumb[1].rotation.x = S.curl[k] * 0.5
    })

    // a cabeça segue você: no laboratório pelo botão; no jogo, quando ela te vê (o rosto vira antes do corpo)
    const lookW = death && death.on ? 0 : ui.follow === 'on' ? 1 : 0
    S.look = damp(S.look || 0, lookW, 3, dt)
    skull.quaternion.identity(); headFollow(skull, S.look, 1.75)

    S.eye = damp(S.eye, chase ? 1 : 0, 6, dt)
    M.eye.color.setRGB(0.7 + 0.3 * S.eye, 0.6 - 0.55 * S.eye, 0.38 - 0.36 * S.eye)
    eyes.forEach((e) => e.scale.setScalar(1 + S.eye * 0.3))
  }


  // =====================================================================
