    if (cam.want) {
      cam.theta = damp(cam.theta, cam.want.theta, 4, dt); cam.elev = damp(cam.elev, cam.want.elev, 4, dt); cam.dist = damp(cam.dist, cam.want.dist, 4, dt)
    }
    const f = v.focus()
    cam.tx = damp(cam.tx, f.x, 5, dt); cam.ty = damp(cam.ty, f.y, 5, dt); cam.tz = damp(cam.tz, f.z, 5, dt)
    const c = Math.cos(cam.elev)
    camera.position.set(cam.tx + cam.dist * c * Math.sin(cam.theta), cam.ty + cam.dist * Math.sin(cam.elev), cam.tz + cam.dist * c * Math.cos(cam.theta))
    camera.position.y = Math.max(0.12, camera.position.y)
    camera.lookAt(cam.tx, cam.ty, cam.tz)
  }

  // ---------- resolução baixa ----------
  // ---------- a imagem: a cena é desenhada numa textura (na resolução escolhida) e uma passada só aplica tudo por cima ----------
  // (ampliação nítida dos pixels, cor, cores reduzidas com pontilhado, vinheta, linhas e granulação)
  const IMG_PRESETS = {
    limpo: { res: 'auto', pix: '0', snap: '0', grade: 'neutra', dither: '0', grain: 12, vig: 35, lines: 0 },
    suave: { res: 'auto', pix: '1', snap: '1', grade: 'neutra', dither: '0', grain: 28, vig: 50, lines: 12 },
    ps1: { res: 'auto', pix: '3', snap: '2', grade: 'neutra', dither: '1', grain: 38, vig: 60, lines: 30 },
  }
  const IMG = Object.assign({ preset: 'limpo' }, IMG_PRESETS.limpo)
  try { const sv = JSON.parse(localStorage.getItem('cros.imagem') || 'null'); if (sv && typeof sv === 'object') for (const k in IMG) if (sv[k] !== undefined) IMG[k] = sv[k] } catch (e) {}
  const PIX_H = [0, 540, 360, 300] // a altura interna de cada nível de pixelização
  const GRADE = { neutra: [1, 1, 1, 1, 1], fria: [0.93, 1.0, 1.09, 0.88, 1.06], quente: [1.08, 1.0, 0.88, 0.92, 1.05] } // tinta rgb, saturação, contraste
  const POST = { rt: new THREE.WebGLRenderTarget(4, 4, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: true, stencilBuffer: false }), scene: new THREE.Scene(), cam: new THREE.Camera() }
  POST.rt.texture.encoding = THREE.sRGBEncoding; POST.rt.texture.generateMipmaps = false // a cena sai em sRGB na textura, como sairia na tela
  POST.u = { tDiffuse: { value: POST.rt.texture }, uIn: { value: new THREE.Vector2(4, 4) }, uOut: { value: new THREE.Vector2(4, 4) }, uSharp: { value: 0 }, uTime: { value: 0 },
    uGrain: { value: 0 }, uGrainPx: { value: 1 }, uVig: { value: 0 }, uLines: { value: 0 }, uLinePx: { value: 3 }, uDither: { value: 0 }, uTint: { value: new THREE.Vector3(1, 1, 1) }, uSat: { value: 1 }, uCon: { value: 1 } }
  POST.mat = new THREE.ShaderMaterial({ uniforms: POST.u, depthTest: false, depthWrite: false,
    vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
    fragmentShader: `uniform sampler2D tDiffuse; uniform vec2 uIn, uOut; uniform float uSharp, uTime, uGrain, uGrainPx, uVig, uLines, uLinePx, uDither, uSat, uCon; uniform vec3 uTint; varying vec2 vUv;
      float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
      float bayer2(vec2 a) { a = floor(a); return fract(dot(a, vec2(0.5, a.y * 0.75))); }
      float bayer4(vec2 a) { return bayer2(0.5 * a) * 0.25 + bayer2(a); }
      void main() {
        vec2 uv = vUv;
        if (uSharp > 0.5) { // pixel nítido: dentro do pixel, cor chapada; só a borda (1 pixel da tela) mistura, sem pixels de larguras diferentes nem serrilhado tremendo
          vec2 p = uv * uIn, c = floor(p) + 0.5, f = (p - c) * (uOut / uIn);
          uv = (c + clamp(f, -0.5, 0.5)) / uIn;
        }
        vec3 col = texture2D(tDiffuse, uv).rgb;
        float l = dot(col, vec3(0.299, 0.587, 0.114));
        col = (mix(vec3(l), col, uSat) - 0.5) * uCon + 0.5; col *= uTint;
        if (uDither > 0.5) { vec2 q = floor(gl_FragCoord.xy / max(1.0, uOut.y / uIn.y)); col = floor(col * 31.0 + bayer4(q)) / 31.0; } // 5 bits por canal, como no PS1
        vec2 d = vUv - 0.5; d.x *= uOut.x / uOut.y;
        col *= 1.0 - uVig * 0.8 * smoothstep(0.3, 0.95, length(d));
        col *= 1.0 - uLines * 0.3 * step(uLinePx * 0.66, mod(gl_FragCoord.y, uLinePx));
        col += (hash(floor(gl_FragCoord.xy / uGrainPx) + floor(uTime * 24.0) * vec2(17.31, 41.73)) - 0.5) * uGrain * 0.2;
        gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
      }` })
  { const q = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), POST.mat); q.frustumCulled = false; POST.scene.add(q) }
  // os pontos (pó, partículas do redemoinho) têm o tamanho calculado pela altura da TELA, não da textura onde a cena é desenhada:
  // numa cena a 300 linhas numa tela de 1080, cada ponto saía 3,6× maior (os quadrados escuros perto da câmera). Corrige no desenho.
  const PTK = { k: 1 }
  THREE.Points.prototype.onBeforeRender = function (r, sc, cam, geo, m) { if (m && m.isPointsMaterial) { if (m.userData.size0 === undefined) m.userData.size0 = m.size; m.size = m.userData.size0 * PTK.k } }
  function imgApply() { // os valores do IMG viram uniformes, tremor e tamanho
    const G = GRADE[IMG.grade] || GRADE.neutra
    POST.u.uTint.value.set(G[0], G[1], G[2]); POST.u.uSat.value = G[3]; POST.u.uCon.value = G[4]
    POST.u.uGrain.value = IMG.grain / 100; POST.u.uVig.value = IMG.vig / 100; POST.u.uLines.value = IMG.lines / 100; POST.u.uDither.value = IMG.dither === '1' ? 1 : 0
    SNAPU.value = IMG.snap === '2' ? SNAP : IMG.snap === '1' ? 240 : 0
    try { localStorage.setItem('cros.imagem', JSON.stringify(IMG)) } catch (e) {}
    resize()
  }
  // resolução dinâmica (só no modo Limpo, que desenha na resolução da tela): se o quadro passa de ~21 ms por um tempo,
  // a resolução interna desce um degrau (até a metade); sobrando folga, sobe de volta. Se descer não ajudou
  // (o peso não era de pixel), volta e não tenta de novo por um tempo.
  const DYN = { k: 1, acc: 0, n: 0, lock: 0, prev: 0 }
  function dynRes(dt) {
    if (IMG.res !== 'auto' || IMG.pix !== '0') { if (DYN.k !== 1) { DYN.k = 1; resize() } DYN.acc = DYN.n = 0; return } // só no Auto sem pixelização
    if (dt > 0.25) return // aba escondida / travada isolada: não conta
    if (DYN.lock > 0) { DYN.lock -= dt; return }
    DYN.acc += dt; DYN.n++
    if (DYN.acc < 1.5) return
    const avg = DYN.acc / DYN.n, k0 = DYN.k; DYN.acc = DYN.n = 0
    if (DYN.prev && avg > DYN.prev * 0.95) { DYN.k = Math.min(1, DYN.k / 0.85); DYN.prev = 0; DYN.lock = 20 } // não adiantou: desfaz
    else if (avg > 1 / 47) { DYN.prev = avg; DYN.k = Math.max(0.5, DYN.k * 0.85) }
    else { DYN.prev = 0; if (avg < 1 / 57 && DYN.k < 1) DYN.k = Math.min(1, DYN.k * 1.1) }
    if (DYN.k !== k0) resize()
  }
  function resize() {
    const w = canvas.clientWidth || innerWidth, h = canvas.clientHeight || innerHeight
    // a tela: na resolução dela (até 2× e no máximo ~1440 linhas: a passada final é leve, mas cobre todos os pixels)
    const oh = Math.max(1, Math.round(Math.min(h * Math.min(2, devicePixelRatio || 1), 1440))), ow = Math.max(1, Math.round(oh * w / h))
    renderer.setSize(ow, oh, false)
    // a cena: na pixelização escolhida, ou na escala (Auto = a resolução dinâmica decide)
    const pix = +IMG.pix, sc = IMG.res === 'auto' ? DYN.k : +IMG.res / 100
    const ih = Math.max(1, pix ? Math.min(PIX_H[pix], oh) : Math.round(oh * sc)), iw = Math.max(1, Math.round(ih * w / h))
    POST.rt.setSize(iw, ih)
    PTK.k = ih / oh
    POST.u.uIn.value.set(iw, ih); POST.u.uOut.value.set(ow, oh); POST.u.uSharp.value = pix ? 1 : 0
    const dpr = oh / h; POST.u.uGrainPx.value = Math.max(1, Math.round(dpr)); POST.u.uLinePx.value = Math.max(3, Math.round(3 * dpr))
    camera.aspect = w / h
    camera.updateProjectionMatrix()
  }
  addEventListener('resize', resize)

  // ---------- o painel da imagem ----------
  const imgBtn = document.getElementById('imgBtn'), imgPanel = document.getElementById('imgPanel')
  imgBtn.addEventListener('click', () => { imgPanel.hidden = !imgPanel.hidden; imgBtn.setAttribute('aria-expanded', String(!imgPanel.hidden)) })
  function imgSync() { // os botões e deslizantes mostram o IMG
    const segs = { img: IMG.preset, res: IMG.res, pix: IMG.pix, snap: IMG.snap, grade: IMG.grade, dither: IMG.dither }
    for (const k in segs) { ui[k] = segs[k]; const sg = document.querySelector(`.seg[data-key="${k}"]`); if (sg) sg.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.v === segs[k]))) }
