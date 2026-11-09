  // ---------- visual PS1 ----------
  const SNAP = 110 // grade de vértices na tela (menor = mais tremido)
  // detector espectral: desbota a cena e faz brilhar o que é sobrenatural (materiais marcados com hl)
  const DET = { uDetect: { value: 0 }, uTimeD: { value: 0 } }
  function detectFrag(sh, hl) {
    sh.uniforms.uDetect = DET.uDetect; sh.uniforms.uTimeD = DET.uTimeD
    sh.fragmentShader = (hl ? '#define HL\n' : '') + 'uniform float uDetect;\nuniform float uTimeD;\n' + sh.fragmentShader.replace('#include <dithering_fragment>', `#include <dithering_fragment>
    {
      float l = dot(gl_FragColor.rgb, vec3(0.299, 0.587, 0.114));
      #ifdef HL
        vec3 hi = vec3(0.35, 1.0, 0.55) * (0.5 + 0.3 * sin(uTimeD * 6.0)) + gl_FragColor.rgb * 0.5;
        gl_FragColor.rgb = mix(gl_FragColor.rgb, hi, uDetect);
      #else
        gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(l * 0.85 + 0.012), uDetect);
      #endif
    }`)
  }
  const SNAPU = { value: SNAP } // 0 desliga o tremor (filtro limpo)
  // ---------- luz melhorada (só na demo): contorno de luz, sombreado macio em degraus, luzes de brilho e o escuro do contato com o chão ----------
  // Tudo dentro do próprio material, numa passada só. Fora da demo uLitK = 0 e o resultado é o de antes.
  // Categorias (userData.lit): 'char' personagens e armas (sombreado macio em degraus + contorno), 'prop' móveis e berço (contorno),
  // 'env' paredes e chão (só as luzes de brilho e o escuro de baixo). userData.litFlat: geometria sem normais (as mechas): fica facetada.
  const LIT_MAX = 10
  const LITU = {
    uLitK: { value: 0 }, uLitSmooth: { value: 0 }, uLitWrap: { value: 0.45 }, uLitBand: { value: 0.65 }, uLitFull: { value: 1 },
    uLitAo: { value: new THREE.Vector3(0.5, 0.75, 0) }, uLitUp: { value: new THREE.Vector3(0, 1, 0) },
    uRimPow: { value: 3.2 }, uRimD1: { value: new THREE.Vector3(0, 0, 1) }, uRimC1: { value: new THREE.Color(0, 0, 0) },
    uRimP2: { value: new THREE.Vector3() }, uRimC2: { value: new THREE.Color(0, 0, 0) }, uRimR2: { value: 10 },
    uGlowN: { value: 0 }, uGlowP: { value: Array.from({ length: LIT_MAX }, () => new THREE.Vector4(0, 0, 0, 1)) }, uGlowC: { value: Array.from({ length: LIT_MAX }, () => new THREE.Vector3()) },
  }
  const LIT_PARS = `
uniform float uLitK, uLitSmooth, uLitWrap, uLitBand, uLitFull, uRimPow, uRimR2;
uniform vec3 uLitAo, uLitUp, uRimD1, uRimC1, uRimP2, uRimC2;
uniform int uGlowN;
uniform vec4 uGlowP[${LIT_MAX}];
uniform vec3 uGlowC[${LIT_MAX}];
varying float vLitY;
float litNL(float d) {
  #ifdef LIT_CHAR
    float w = clamp((d + uLitWrap) / (1.0 + uLitWrap), 0.0, 1.0);
    float q = w * 3.0, f = floor(q);
    float b = (f + smoothstep(0.38, 0.62, q - f)) / 3.0;
    return mix(clamp(d, 0.0, 1.0), mix(w, b, uLitBand), uLitK);
  #else
    return clamp(d, 0.0, 1.0);
  #endif
}
`
  const LIT_NORMAL = `
#if defined(LIT_CHAR) && !defined(LIT_FLAT)
  if (uLitSmooth < 0.999) { // fora da demo: a mesma normal facetada de antes
    vec3 lfx = dFdx(vViewPosition), lfy = dFdy(vViewPosition);
    vec3 lfn = normalize(cross(lfx, lfy));
    normal = uLitSmooth > 0.001 ? normalize(mix(lfn, normal, uLitSmooth)) : lfn;
    geometryNormal = normal;
  }
#endif
`
  const LIT_APPLY = `
if (uLitK > 0.0) {
  vec3 lN = geometry.normal, lV = geometry.viewDir;
  // o escuro do contato: mais escuro perto do chão (nas superfícies em pé; o chão em si não)
  float lao = mix(uLitAo.x, 1.0, smoothstep(0.0, uLitAo.y, vLitY));
  lao = mix(lao, 1.0, smoothstep(0.45, 0.8, dot(lN, uLitUp)));
  lao = mix(1.0, lao, uLitK);
  reflectedLight.directDiffuse *= lao; reflectedLight.indirectDiffuse *= lao;
  // luzes de brilho (rachaduras, faíscas): sem sombra, calculadas aqui mesmo
  {
    for (int i = 0; i < ${LIT_MAX}; i++) {
      if (i >= uGlowN) break;
      vec3 ld = uGlowP[i].xyz - geometry.position;
      float lr = length(ld);
      if (lr >= uGlowP[i].w) continue; // fora do alcance: nada a fazer
      float la = 1.0 - lr / uGlowP[i].w; la *= la;
      reflectedLight.directDiffuse += material.diffuseColor * uGlowC[i] * (la * litNL(dot(lN, ld / max(lr, 1e-3))));
    }
  }
  #if defined(LIT_CHAR) || defined(LIT_PROP)
    // contorno: a borda virada para a luz forte (janela: direção; berço: posição) acende
    float lfr = pow(1.0 - clamp(dot(lN, lV), 0.0, 1.0), uRimPow);
    vec3 lrim = uRimC1 * smoothstep(-0.15, 0.55, dot(lN, uRimD1));
    vec3 lp = uRimP2 - geometry.position;
    lrim += uRimC2 * smoothstep(-0.15, 0.55, dot(lN, normalize(lp))) * clamp(1.0 - length(lp) / uRimR2, 0.0, 1.0);
    lrim *= 1.0 - smoothstep(0.4, 0.8, dot(lN, uLitUp)); // tampos e chão virados para cima não ganham contorno
    reflectedLight.directDiffuse += lfr * lrim * (material.diffuseColor * 0.65 + 0.2) * uLitK;
  #endif
}
`
  const LIT_PHONG = THREE.ShaderChunk.lights_phong_pars_fragment.replace('float dotNL = saturate( dot( geometry.normal, directLight.direction ) );', 'float dotNL = litNL( dot( geometry.normal, directLight.direction ) );')
  if (LIT_PHONG === THREE.ShaderChunk.lights_phong_pars_fragment) console.warn('luz: trecho do Phong mudou')
  function litShader(s, mat) {
    const cat = mat.userData.lit
    if (!cat || !mat.isMeshPhongMaterial) return
    Object.assign(s.uniforms, LITU)
    const defs = '#define LIT\n#define LIT_' + cat.toUpperCase() + '\n' + (mat.userData.litFlat ? '#define LIT_FLAT\n' : '')
    s.vertexShader = defs + 'varying float vLitY;\n' + s.vertexShader.replace('#include <project_vertex>', `#include <project_vertex>
      { vec4 lw = vec4(transformed, 1.0);
        #ifdef USE_INSTANCING
          lw = instanceMatrix * lw;
        #endif
        vLitY = (modelMatrix * lw).y; }`)
    s.fragmentShader = defs + s.fragmentShader
      .replace('#include <lights_phong_pars_fragment>', LIT_PARS + LIT_PHONG)
      .replace('#include <normal_fragment_begin>', '#include <normal_fragment_begin>\n' + LIT_NORMAL)
      .replace('#include <lights_fragment_end>', '#include <lights_fragment_end>\n' + LIT_APPLY)
  }
  function psx(mat) {
    mat.onBeforeCompile = (s) => {
      s.uniforms.uSnap = SNAPU
      s.vertexShader = 'uniform float uSnap;\n' + s.vertexShader.replace('#include <project_vertex>',
        '#include <project_vertex>\nif (uSnap > 0.0 && gl_Position.w > 0.35) { vec4 p = gl_Position; p.xyz /= p.w; p.xy = floor(p.xy * uSnap) / uSnap; p.xyz *= p.w; gl_Position = p; }')
      if (mat.userData.inner) s.fragmentShader = s.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\nif (!gl_FrontFacing) diffuseColor.rgb *= ' + mat.userData.inner.toFixed(2) + ';') // o avesso do pano, mais escuro
      litShader(s, mat)
      detectFrag(s, !!mat.userData.hl)
    }
    mat.customProgramCacheKey = () => (mat.userData.hl ? 'psx-h' : 'psx') + (mat.userData.lit ? '-l' + mat.userData.lit + (mat.userData.litFlat ? 'f' : '') : '') + (mat.userData.inner ? '-i' : '')
    return mat
  }
  // marca os materiais de um grupo (uma vez, antes de desenhar): a prioridade é char > prop > env
  const LIT_RANK = { env: 1, prop: 2, char: 3 }
  function litMark(root, catOf) {
    const seen = new Map()
    root.traverse((o) => {
      if (!o.isMesh) return
      const cat = catOf(o); if (!cat) return
      for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
        if (!m || !m.isMeshPhongMaterial || !m.customProgramCacheKey) continue
        const e = seen.get(m) || { cat: null, flat: false }
        if (!e.cat || LIT_RANK[cat] > LIT_RANK[e.cat]) e.cat = cat
        const nrm = o.geometry && o.geometry.attributes.normal
        if (!nrm || (o.geometry.attributes.position && o.geometry.attributes.position.usage === THREE.DynamicDrawUsage) || o.isSkinnedMesh) e.flat = true
        seen.set(m, e)
      }
    })
    seen.forEach((e, m) => {
      if (LIT_RANK[e.cat] < LIT_RANK[m.userData.lit] ) return
      m.userData.lit = e.cat
      if (e.cat === 'char' && !e.flat) { m.flatShading = false; m.extensions = Object.assign(m.extensions || {}, { derivatives: true }) }
      else if (e.cat === 'char') m.userData.litFlat = true
      m.needsUpdate = true
    })
    return seen.size
  }
  // só difusa, sem reflexo especular (de raspão o especular deixava o cabelo cinza)
  // cores em hex são sRGB: converte para linear, senão o escuro vira cinza na tela
  const lin = (o) => (o.color !== undefined ? Object.assign({}, o, { color: new THREE.Color(o.color).convertSRGBToLinear() }) : o)
  const mk = (Ctor, base, o) => {
    const { hl, ...rest } = o
    const m = new Ctor(Object.assign(base, lin(rest)))
    if (hl) m.userData.hl = true // sobrenatural: brilha no detector
    return psx(m)
  }
  const std = (o) => mk(THREE.MeshPhongMaterial, { specular: 0x000000, shininess: 0, flatShading: true }, o)
  const basic = (o) => mk(THREE.MeshBasicMaterial, {}, o)

  const pw = (a, b) => Math.pow(Math.max(0, a), b) // potência sem NaN no arredondamento
  function rng(seed) { let s = seed; return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646 }
  const hash = (a, b) => { const v = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453; return v - Math.floor(v) }

  function canvasTex(w, h, paint) {
    const c = document.createElement('canvas'); c.width = w; c.height = h
    paint(c.getContext('2d'), w, h)
    const t = new THREE.CanvasTexture(c)
    // de perto, o pixel duro (magFilter); de longe, as versões reduzidas misturadas (mipmaps + trilinear):
    // sem isso, quando a textura fica menor que a tela, cada pixel pega um fio diferente e o desenho "formiga" com a câmera
    t.magFilter = THREE.NearestFilter; t.minFilter = THREE.LinearMipmapLinearFilter
    t.generateMipmaps = true; t.anisotropy = 4
    t.encoding = THREE.sRGBEncoding
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    return t
  }
  function tiled(t, rx, ry, oy) { // textura repetida: pixel duro de perto; de longe usa versões reduzidas (mipmaps), senão o padrão formiga quando a câmera anda
    const c = t.clone(); c.needsUpdate = true; c.repeat.set(rx, ry); c.offset.set(0, oy || 0)
    c.generateMipmaps = true; c.minFilter = THREE.LinearMipmapLinearFilter; c.anisotropy = 4
    return c
  }

  // ---------- paleta única da Mãe ----------
  const SKIN = '#a69c8c', SKIN_D = '#857b6d', SKIN_L = '#b7ad9d'
  const GOWN = '#9e937c', GOWN_D = '#857a65', GOWN_L = '#aca18a', DIRT = '#4c4236'
  const HAIR = '#0d0b0a'
  const LUTO = '#0a0708', LUTO_E = '#2a201c' // o Luto (o líquido preto em que ela mora) e a borda do tecido encharcado
  const PX_M = 128 // densidade de pixels: 128 por metro em todas as peças

  const skinTex = canvasTex(16, 16, (g) => {
    g.fillStyle = SKIN; g.fillRect(0, 0, 16, 16)
    const r = rng(7)
    for (let i = 0; i < 40; i++) { g.fillStyle = r() < 0.5 ? SKIN_D : SKIN_L; g.fillRect(r() * 16 | 0, r() * 16 | 0, 1, 1) }
    g.fillStyle = '#7c7468'; for (let y = 0; y < 16; y++) g.fillRect(5 + (Math.sin(y * 0.8) > 0.3 ? 1 : 0), y, 1, 1) // veia
  })

  // camisola: uma tira da cintura (topo) até a barra (base), 1,16 m de altura
  const GOWN_H = 1.16, GOWN_ROWS = Math.round(GOWN_H * PX_M)
  const gownTex = canvasTex(32, GOWN_ROWS, (g, w, h) => {
    g.fillStyle = GOWN; g.fillRect(0, 0, w, h)
    for (let x = 0; x < w; x += 8) { g.fillStyle = GOWN_D; g.fillRect(x, 0, 1, h); g.fillStyle = GOWN_L; g.fillRect(x + 3, 0, 1, h) }
    const r = rng(11)
    for (let i = 0; i < 220; i++) { g.fillStyle = r() < 0.6 ? GOWN_D : GOWN_L; g.fillRect(r() * w | 0, r() * h | 0, 1, 1) }
    for (let i = 0; i < 7; i++) { g.fillStyle = 'rgba(110,96,74,0.55)'; g.fillRect(r() * w | 0, r() * h * 0.8 | 0, 2 + r() * 3 | 0, 3 + r() * 6 | 0) }
    // sujeira subindo da barra
    for (let y = h - 46; y < h; y++) {
      const k = (y - (h - 46)) / 46
      for (let x = 0; x < w; x++) if (r() < k * k * 1.2) { g.fillStyle = r() < 0.5 ? DIRT : '#6a5d4b'; g.fillRect(x, y, 1, 1) }
    }
    g.fillStyle = DIRT; g.fillRect(0, h - 3, w, 3)
  })

  // a saia ganha uma textura de uma volta só (256 px ~ a volta na barra): o rasgo e os escorridos não se repetem
  // u = 0 é a frente (o torno começa em +z); u = 0,25 é o lado esquerdo dela
  function gownBase(g, w, h, seed) {
    g.fillStyle = GOWN; g.fillRect(0, 0, w, h)
    for (let x = 0; x < w; x += 8) { g.fillStyle = GOWN_D; g.fillRect(x, 0, 1, h); g.fillStyle = GOWN_L; g.fillRect(x + 3, 0, 1, h) }
    const r = rng(seed)
    for (let i = 0; i < w * h * 0.05; i++) { g.fillStyle = r() < 0.6 ? GOWN_D : GOWN_L; g.fillRect(r() * w | 0, r() * h | 0, 1, 1) }
    return r
  }
  // escorrido: desce torto, mais grosso no começo, com uma gota no fim
  function lutoStreak(g, r, x0, y0, len, h) {
    let x = x0
    g.fillStyle = LUTO
    for (let y = y0; y < Math.min(h, y0 + len); y++) { g.fillRect(x, y, y - y0 < len * 0.3 ? 2 : 1, 1); if (r() < 0.07) x += r() < 0.5 ? -1 : 1 }
    if (y0 + len < h) g.fillRect(x - 1, y0 + len, 3, 2)
  }
  // tecido encharcado de baixo até 'lvl' (0..1 da altura): a borda sobe irregular e puxa fios para cima
  function soakUp(g, r, w, h, lo, hi) {
    let lv = (lo + hi) / 2
    for (let x = 0; x < w; x++) {
      lv = Math.max(lo, Math.min(hi, lv + (r() - 0.5) * 0.045))
      const top = Math.round(h * (1 - lv))
      for (let y = top - 5; y < h; y++) {
        if (y < 0) continue
        if (y < top) { if (r() < 0.3 * (1 - (top - y) / 6)) { g.fillStyle = LUTO_E; g.fillRect(x, y, 1, 1) } }
        else { g.fillStyle = r() < 0.1 ? '#171112' : LUTO; g.fillRect(x, y, 1, 1) }
      }
      if (r() < 0.1) { g.fillStyle = LUTO; g.fillRect(x, top - 3 - (r() * 12 | 0), 1, 6) }
    }
  }
  const skirtTex = canvasTex(256, GOWN_ROWS, (g, w, h) => {
    const r = gownBase(g, w, h, 41)
    for (let i = 0; i < 6; i++) { g.fillStyle = 'rgba(110,96,74,0.55)'; g.fillRect(r() * w | 0, r() * h * 0.5 | 0, 2 + r() * 3 | 0, 3 + r() * 6 | 0) }
    // o que escorreu do corpete pela frente da saia
    ;[2, 6, w - 4, w - 9, 15, w - 20, 70, 190].forEach((x, i) => lutoStreak(g, r, x, 2 + (r() * 8 | 0), (i < 6 ? 40 : 18) + (r() * 46 | 0), h))
    soakUp(g, r, w, h, 0.3, 0.5) // da barra até o joelho
    // o rasgo do lado esquerdo: abre para baixo e mostra o escuro de dentro
    const xr = Math.round(w * 0.25), y0 = Math.round(h * 0.22)
    for (let y = y0; y < h; y++) { const ww = 1 + Math.round(4 * (y - y0) / (h - y0)), x = xr - (ww >> 1) + Math.round(Math.sin(y * 0.3)); g.fillStyle = '#050304'; g.fillRect(x, y, ww, 1); g.fillStyle = GOWN_D; g.fillRect(x - 1, y, 1, 1); g.fillRect(x + ww, y, 1, 1) }
    // a barra desfiada: fios soltos e buracos (recorte), mais fundos em alguns trechos
    for (let x = 0; x < w; x++) { const d = 3 + (r() * 7 | 0) + (Math.sin(x * 0.37) > 0.6 ? 5 : 0); for (let y = h - d; y < h; y++) if (y >= h - 1 || r() < (y - (h - d)) / d * 1.25) g.clearRect(x, y, 1, 1) }
  })
  const BOD_ROWS = Math.round(GOWN_ROWS * 0.57)
  const bodiceTex = canvasTex(128, BOD_ROWS, (g, w, h) => {
    const r = gownBase(g, w, h, 43)
    // a baba preta que cai do queixo: desce pela frente do peito
    lutoStreak(g, r, 1, 0, Math.round(h * 0.75), h); lutoStreak(g, r, w - 3, 0, Math.round(h * 0.5), h); lutoStreak(g, r, 5, 0, Math.round(h * 0.3), h)
    g.fillStyle = LUTO; g.fillRect(0, 0, 4, 3); g.fillRect(w - 4, 0, 4, 3)
  })
  const golaTex = canvasTex(64, 20, (g, w, h) => {
    const r = gownBase(g, w, h, 47)
    g.fillStyle = LUTO; let x = 0 // a baba descendo torta pela frente da gola
    for (let y = 0; y < h; y++) { if (r() < 0.25) x += r() < 0.5 ? -1 : 1; x = Math.max(-1, Math.min(2, x)); const ww = y < 6 ? 2 : 1; g.fillRect((x + w) % w, y, ww, 1); if (y > 10 && y % 6 === 0) g.fillRect(w - 3, y - 4, 1, 4) }
  })
  // manga do antebraço: encharcada da mão até perto do cotovelo (ela cava o Luto)
  const sleeveTex = canvasTex(32, 60, (g, w, h) => { const r = gownBase(g, w, h, 53); soakUp(g, r, w, h, 0.45, 0.7) })
  const lutoClothTex = canvasTex(16, 16, (g, w, h) => { g.fillStyle = LUTO; g.fillRect(0, 0, w, h); const r = rng(59); for (let i = 0; i < 26; i++) { g.fillStyle = r() < 0.5 ? '#1a1314' : '#040203'; g.fillRect(r() * w | 0, r() * h | 0, 1, 1 + (r() * 2 | 0)) } })

  // ---------- cabeça esculpida (o rosto faz parte da malha) ----------
  const HEAD = { R: 0.115, sx: 0.84, sy: 1.18, sz: 0.95, FW: 0.24, FH: 0.30 }
  const bump = (x, y, cx, cy, rx, ry) => { const d = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2; return d >= 1 ? 0 : (1 - d) ** 2 }
  const EYE = { x: 0.038, y: 0.022 }

  function buildHead(t0 = 0, t1 = Math.PI, rows = 16, gaunt = 0) {
    const g = new THREE.SphereGeometry(HEAD.R, 22, rows, 0, Math.PI * 2, t0, t1 - t0)
    const p = g.attributes.position, uv = g.attributes.uv
    for (let i = 0; i < p.count; i++) {
      let x = p.getX(i) * HEAD.sx, y = p.getY(i) * HEAD.sy, z = p.getZ(i) * HEAD.sz
      if (z > 0) {
        const f = Math.min(1, z / 0.06)
        z -= 0.03 * (bump(x, y, -EYE.x, EYE.y, 0.032, 0.027) + bump(x, y, EYE.x, EYE.y, 0.032, 0.027)) * f // órbitas fundas
        z += 0.008 * (bump(x, y, -0.038, 0.056, 0.03, 0.013) + bump(x, y, 0.038, 0.056, 0.03, 0.013)) * f // arcada
        z += 0.02 * bump(x, y, 0, -0.012, 0.013, 0.036) * f // nariz comprido
        z += 0.007 * (bump(x, y, -0.056, -0.006, 0.022, 0.016) + bump(x, y, 0.056, -0.006, 0.022, 0.016)) * f // maçãs
        z -= 0.013 * (bump(x, y, -0.048, -0.055, 0.02, 0.026) + bump(x, y, 0.048, -0.055, 0.02, 0.026)) * f // bochechas fundas
        z -= 0.006 * bump(x, y, 0, -0.082, 0.032, 0.009) * f // vão da boca
        if (gaunt) { // desnutrida: bochechas chupadas, órbitas mais fundas, maçãs saltadas
          z -= gaunt * 0.024 * (bump(x, y, -0.047, -0.047, 0.026, 0.032) + bump(x, y, 0.047, -0.047, 0.026, 0.032)) * f
          z -= gaunt * 0.01 * (bump(x, y, -EYE.x, EYE.y, 0.03, 0.026) + bump(x, y, EYE.x, EYE.y, 0.03, 0.026)) * f
          z += gaunt * 0.008 * (bump(x, y, -0.056, -0.004, 0.02, 0.012) + bump(x, y, 0.056, -0.004, 0.02, 0.012)) * f
        }
      }
      if (gaunt) { const ax = Math.abs(x); x -= Math.sign(x) * gaunt * (0.014 * bump(ax, y, 0.078, 0.035, 0.026, 0.035) + 0.013 * bump(ax, y, 0.062, -0.05, 0.03, 0.032)) } // têmporas e laterais do rosto afundam
      if (y < -0.04) x *= 1 - Math.min(gaunt ? 0.34 : 0.28, (-0.04 - y) * (gaunt ? 2.3 : 1.9)) // queixo comprido e fino
      p.setXYZ(i, x, y, z)
      // textura projetada de frente; atrás, só pele
      if (z > -0.03) uv.setXY(i, x / HEAD.FW + 0.5, y / HEAD.FH + 0.5)
      else uv.setXY(i, 0.04, 0.96)
    }
    g.computeVertexNormals()
    return g
  }

  const FACE_W = Math.round(HEAD.FW * PX_M), FACE_H = Math.round(HEAD.FH * PX_M) // 31 × 38
  const faceTex = canvasTex(FACE_W, FACE_H, (g, w, h) => {
    const px = (x) => (x / HEAD.FW + 0.5) * w
    const py = (y) => (1 - (y / HEAD.FH + 0.5)) * h
    g.fillStyle = SKIN; g.fillRect(0, 0, w, h)
    const r = rng(3)
    for (let i = 0; i < 70; i++) { g.fillStyle = r() < 0.5 ? SKIN_D : SKIN_L; g.fillRect(r() * w | 0, r() * h | 0, 1, 1) }
    // bochechas fundas e sombra embaixo do queixo (mistura com a gola)
    g.fillStyle = SKIN_D
    for (const s of [-1, 1]) { g.beginPath(); g.ellipse(px(s * 0.048), py(-0.055), 2.5, 3.5, 0, 0, 7); g.fill() }
    // desnutrida: o buraco embaixo da maçã (sombra funda), a maçã saltada (luz) e as têmporas chupadas
    for (const s of [-1, 1]) {
      const hx = px(s * 0.047), hy = py(-0.05), gh = g.createRadialGradient(hx, hy, 0.3, hx, hy, 5)
      gh.addColorStop(0, 'rgba(58,50,42,0.85)'); gh.addColorStop(0.6, 'rgba(92,82,70,0.45)'); gh.addColorStop(1, 'rgba(133,123,109,0)')
      g.fillStyle = gh; g.beginPath(); g.ellipse(hx, hy, 3.6, 5, s * -0.25, 0, 7); g.fill()
      g.fillStyle = SKIN_L; g.beginPath(); g.ellipse(px(s * 0.055), py(-0.006), 2.2, 1, s * -0.35, 0, 7); g.fill()
      const tx = px(s * 0.1), ty = py(0.045), gt = g.createRadialGradient(tx, ty, 0.3, tx, ty, 4.5)
      gt.addColorStop(0, 'rgba(70,62,52,0.7)'); gt.addColorStop(1, 'rgba(133,123,109,0)'); g.fillStyle = gt; g.fillRect(tx - 5, ty - 5, 10, 10)
      g.fillStyle = 'rgba(70,62,52,0.55)'; for (let k = 0; k < 4; k++) g.fillRect(Math.round(px(s * (0.058 - k * 0.006))), Math.round(py(-0.075 - k * 0.012)), 1, 1) // a linha do maxilar marcada
    }
    for (let y = h - 4; y < h; y++) { g.fillStyle = `rgba(60,52,44,${(y - h + 5) * 0.18})`; g.fillRect(0, y, w, 1) }
    // órbitas: escuro no fundo, sumindo na pele
    for (const s of [-1, 1]) {
      const cx = px(s * EYE.x), cy = py(EYE.y)
      const gr = g.createRadialGradient(cx, cy, 0.5, cx, cy, 5.5)
      gr.addColorStop(0, '#0c0908'); gr.addColorStop(0.55, '#2e2620'); gr.addColorStop(1, 'rgba(133,123,109,0)')
      g.fillStyle = gr; g.beginPath(); g.ellipse(cx, cy, 5.5, 5, 0, 0, 7); g.fill()
      // lágrimas de Luto: grossas na pálpebra, finas descendo até o queixo
      g.fillStyle = LUTO
      g.fillRect(Math.round(cx - s) - (s > 0 ? 1 : 0), Math.round(cy + 2), 2, 4)
      g.fillRect(Math.round(cx - s), Math.round(cy + 2), 1, 17)
      g.fillRect(Math.round(cx - s) + (s > 0 ? -1 : 1), Math.round(cy + 18), 1, 3)
      g.fillRect(Math.round(cx + s * 2), Math.round(cy + 2), 1, 7)
      g.fillRect(Math.round(cx + s * 2), Math.round(cy + 9), 1, 1)
    }
    // lateral do nariz
    g.fillStyle = SKIN_D; g.fillRect(Math.round(px(0.012)), Math.round(py(0.0)), 1, 4)
    // boca: fenda comprida entreaberta
    const my = Math.round(py(-0.082))
    g.fillStyle = '#6a5c50'; g.fillRect(Math.round(px(-0.03)), my - 1, Math.round(px(0.03) - px(-0.03)), 3)
    g.fillStyle = '#140e0c'; g.fillRect(Math.round(px(-0.024)), my, Math.round(px(0.024) - px(-0.024)), 1)
    // o Luto escorre dos cantos da boca pelo queixo
    g.fillStyle = LUTO
    for (const s of [-1, 1]) { const x = Math.round(px(s * 0.026)); g.fillRect(x, my, 1, h - my); g.fillRect(x + (s > 0 ? -1 : 1), my + 2, 1, 3) }
    g.fillRect(Math.round(px(0.004)), my + 1, 1, 5)
    // rachaduras
    g.fillStyle = '#7b7062'
    g.fillRect(Math.round(px(0.06)), Math.round(py(0.1)), 1, 4); g.fillRect(Math.round(px(0.066)), Math.round(py(0.07)), 1, 2)
    g.fillRect(Math.round(px(-0.07)), Math.round(py(-0.02)), 1, 3)
    // canto reservado de pele lisa para a nuca (uv 0.04, 0.96)
    g.fillStyle = SKIN; g.fillRect(0, 0, 3, 3)
  })


  // ---------- materiais ----------
  const M = {
    skin: std({ map: skinTex }),
    head: std({ map: faceTex }), // mesmo material de luz que a pele
    gown: std({ map: tiled(gownTex, 8, 1), side: THREE.DoubleSide }),
    bodice: std({ map: tiled(gownTex, 4, 0.57, 0.43) }),
    sleeve: std({ map: tiled(gownTex, 2, 0.45, 0.5), side: THREE.DoubleSide }),
    ruff: std({ map: tiled(gownTex, 3, 0.12, 0.8), side: THREE.DoubleSide }),
    belt: std({ map: tiled(gownTex, 4, 0.06, 0.9), color: '#857a66' }),
    under: std({ color: '#141110', side: THREE.DoubleSide }),
    nail: std({ color: '#2a221c' }),
    // o Luto: preto molhado (um reflexo fraco de luz, para ler como líquido)
    skirt: std({ map: tiled(skirtTex, 1, 1), side: THREE.DoubleSide }),
    bodLuto: std({ map: tiled(bodiceTex, 1, 1) }),
    gola: std({ map: tiled(golaTex, 1, 1), side: THREE.DoubleSide }),
    sleeveLuto: std({ map: tiled(sleeveTex, 2, 1), side: THREE.DoubleSide }),
    lutoCloth: std({ map: lutoClothTex, side: THREE.DoubleSide }),
    lutoSkin: mk(THREE.MeshPhongMaterial, { specular: new THREE.Color('#2c2427'), shininess: 34, flatShading: true }, { color: '#0e0a0b' }),
    claw: mk(THREE.MeshPhongMaterial, { specular: new THREE.Color('#4a4046'), shininess: 60, flatShading: true }, { color: '#0a0708' }),
    eye: basic({ color: '#d8c9a0' }), // a única coisa que brilha
    ribbon: std({ map: tiled(gownTex, 0.4, 0.25, 0.7), color: '#857a66', side: THREE.DoubleSide }), // as fitas do laço (pano solto)
    // antes
  }

  // o vestido virou pano (PANO, mais abaixo): sombreado suave nas dobras, barra desfiada (recorte) e o avesso mais escuro
  M.skirt.flatShading = false; M.skirt.alphaTest = 0.5; M.skirt.userData.inner = 0.42
  M.under.flatShading = false; M.under.side = THREE.FrontSide; M.ribbon.flatShading = false // a anágua só é vista por fora (pelo rasgo e por baixo da barra)

  // ---------- geometria utilitária ----------
  function rag(g, amt, seed, hemDrop) {
    const p = g.attributes.position
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i)
      const a = Math.round(Math.atan2(x, z) * 40), b = Math.round(y * 400)
      const k = 1 + (hash(a + seed, b) - 0.5) * amt
      p.setX(i, x * k); p.setZ(i, z * k)
      if (hemDrop && y < 0.005) p.setY(i, y - hash(a, seed) * hemDrop)
    }
    g.computeVertexNormals()
    return g
  }
  function latheFn(fn, y0, y1, n, sides, phiStart, phiLen) {
    const pts = []
    for (let i = 0; i <= n; i++) { const y = y0 + (y1 - y0) * i / n; pts.push(new THREE.Vector2(Math.max(0.001, fn(y)), y)) }
    return new THREE.LatheGeometry(pts, sides, phiStart || 0, phiLen || Math.PI * 2)
  }
  // membro pendurado: topo no pivô (y = 0), descendo
  function limb(r0, r1, len, sides, segs) {
    const g = new THREE.CylinderGeometry(r0, r1, len, sides || 7, segs || 3)
    g.translate(0, -len / 2, 0)
    return g
  }
  const sphere = (r, w, h) => new THREE.SphereGeometry(r, w || 7, h || 5)
  // garra: cone de 4 lados com a base no y = 0 e a ponta em -len, curvando para a palma (-z)
  function clawGeo(len, r) {
    const g = new THREE.ConeGeometry(r, len, 4, 3).rotateX(Math.PI).translate(0, -len / 2, 0)
    const p = g.attributes.position
    for (let i = 0; i < p.count; i++) { const t = Math.max(0, -p.getY(i) / len); p.setZ(i, p.getZ(i) - 0.32 * len * t * t) }
    g.computeVertexNormals(); return g
  }

  const all = [] // todas as malhas da criatura (sombra)
  function mesh(geo, mat, parent, pos, rot, scl) {
    const m = new THREE.Mesh(geo, mat)
    if (pos) m.position.set(pos[0], pos[1], pos[2])
    if (rot) m.rotation.set(rot[0], rot[1], rot[2])
    if (scl) m.scale.set(scl[0], scl[1], scl[2])
    m.castShadow = true
    parent.add(m); all.push(m)
    return m
  }
  const group = (parent, pos) => { const g = new THREE.Group(); if (pos) g.position.set(pos[0], pos[1], pos[2]); parent.add(g); return g }
  // a cabeça procura você (a mecânica do Observador, para os outros): gira 'head' por cima da pose que a animação deu,
  // até apontar o rosto (+z) para a câmera; maxAng limita o giro a partir da pose (π = até de costas)
  const _hfC = new THREE.Vector3(), _hfL = new THREE.Vector3(), _hfR = new THREE.Vector3(), _hfM = new THREE.Matrix4(), _hfQ = new THREE.Quaternion(), _hfZ = new THREE.Vector3(0, 0, 1)
  function headFollow(head, k, maxAng = Math.PI) {
    if (k <= 0.001) return
    const par = head.parent; par.updateMatrixWorld(true)
    camera.getWorldPosition(_hfC); _hfM.copy(par.matrixWorld).invert()
    _hfL.copy(_hfC).applyMatrix4(_hfM).sub(head.position).normalize() // onde você está, visto do pescoço
    _hfR.copy(_hfZ).applyQuaternion(head.quaternion) // para onde o rosto aponta agora
    const ang = _hfR.angleTo(_hfL)
    if (ang > maxAng) _hfL.lerp(_hfR, 1 - maxAng / ang).normalize() // passou do limite: para no máximo
    _hfQ.setFromUnitVectors(_hfR, _hfL).multiply(head.quaternion)
    head.quaternion.slerp(_hfQ, k)
  }

  // ---------- cena ----------
  const canvas = document.getElementById('view')
  let renderer
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' }) }
  catch (e) { document.getElementById('err').hidden = false; return }
  renderer.setPixelRatio(1)
  renderer.outputEncoding = THREE.sRGBEncoding
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.BasicShadowMap
  // ---------- desempenho: a árvore de matrizes não desce em quem está escondido ----------
  // O Three recalcula a matriz de mundo de TODOS os objetos a cada quadro, inclusive dos fantasmas e cenários escondidos
  // (são ~6 mil objetos e só ~500 aparecem). Escondido, o galho é pulado e só marcado para recalcular quando voltar a aparecer.
  // (getWorldPosition & cia. usam updateWorldMatrix, que continua calculando sob demanda.)
  THREE.Object3D.prototype.updateMatrixWorld = function (force) {
    if (this.matrixAutoUpdate) this.updateMatrix()
    if (this.matrixWorldNeedsUpdate || force) {
      if (this.parent === null) this.matrixWorld.copy(this.matrix); else this.matrixWorld.multiplyMatrices(this.parent.matrixWorld, this.matrix)
      this.matrixWorldNeedsUpdate = false; force = true
    }
    const ch = this.children
    for (let i = 0, n = ch.length; i < n; i++) {
      const c = ch[i]
      if (c.visible || !c.__mw) { c.__mw = true; c.updateMatrixWorld(force) } else if (force) c.matrixWorldNeedsUpdate = true
    }
  }

  const scene = new THREE.Scene()
  scene.background = new THREE.Color('#050607')
  scene.fog = new THREE.FogExp2('#050607', 0.16)
  const camera = new THREE.PerspectiveCamera(55, 1, 0.05, 40)
  scene.add(camera)

  // corredor da mansão
  const floorTex = canvasTex(32, 32, (g) => {
    g.fillStyle = '#3a2a1c'; g.fillRect(0, 0, 32, 32)
    const r = rng(19)
    for (let y = 0; y < 32; y += 8) { g.fillStyle = '#241910'; g.fillRect(0, y, 32, 1); g.fillRect((r() * 32) | 0, y, 1, 8) }
    for (let i = 0; i < 90; i++) { g.fillStyle = r() < 0.5 ? '#2e2116' : '#46331f'; g.fillRect(r() * 32 | 0, r() * 32 | 0, 2, 1) }
  })
  const wallTex = canvasTex(32, 32, (g) => {
    g.fillStyle = '#4a3a26'; g.fillRect(0, 0, 32, 32)
    g.fillStyle = '#3a2c1c'
    for (let y = 2; y < 32; y += 10) for (let x = (y % 20 ? 0 : 8); x < 32; x += 16) { g.beginPath(); g.ellipse(x + 4, y + 3, 3, 4, 0, 0, 7); g.fill() }
    const r = rng(23)
    for (let i = 0; i < 60; i++) { g.fillStyle = r() < 0.5 ? '#3e3020' : '#55432c'; g.fillRect(r() * 32 | 0, r() * 32 | 0, 1, 1) }
  })
  const wainTex = canvasTex(32, 32, (g) => {
    g.fillStyle = '#2a1d13'; g.fillRect(0, 0, 32, 32)
    g.fillStyle = '#1c130c'; g.fillRect(0, 0, 32, 2); g.fillRect(0, 0, 1, 32); g.fillRect(16, 0, 1, 32)
    g.fillStyle = '#34261a'; g.fillRect(3, 5, 10, 24); g.fillRect(19, 5, 10, 24)
  })
  const room = new THREE.Group(); scene.add(room)
  const env = (geo, tex, pos, rot) => {
    const m = new THREE.Mesh(geo, std({ map: tex, flatShading: false }))
    m.position.set(...pos); if (rot) m.rotation.set(...rot); m.receiveShadow = true; room.add(m); return m
  }
  env(new THREE.PlaneGeometry(8, 8), tiled(floorTex, 32, 32), [0, 0, 0], [-Math.PI / 2, 0, 0])
  env(new THREE.PlaneGeometry(8, 2.2), tiled(wallTex, 32, 8.8), [0, 1.9, -1.8])
  env(new THREE.PlaneGeometry(8, 0.8), tiled(wainTex, 16, 1), [0, 0.4, -1.79])
  env(new THREE.PlaneGeometry(8, 2.2), tiled(wallTex, 32, 8.8), [-1.9, 1.9, 0], [0, Math.PI / 2, 0])
  env(new THREE.PlaneGeometry(8, 0.8), tiled(wainTex, 16, 1), [-1.89, 0.4, 0], [0, Math.PI / 2, 0])
  env(new THREE.PlaneGeometry(8, 8), tiled(wallTex, 16, 16), [0, 3.0, 0], [Math.PI / 2, 0, 0])

  // luzes
  const hemi = new THREE.HemisphereLight('#2a3550', '#0a0806', 0.22); scene.add(hemi)
  const spot = new THREE.SpotLight('#fff2d8', 2.6, 14, 0.36, 0.55, 1.4)
  spot.castShadow = true; spot.shadow.mapSize.set(512, 512); spot.shadow.bias = -0.002
  spot.position.set(0.14, -0.12, 0); camera.add(spot); spot.target.position.set(0, -0.06, -1); camera.add(spot.target)
  const lamp = new THREE.PointLight('#ffae55', 1.6, 7, 2)
  lamp.position.set(1.1, 2.55, -1.2); lamp.castShadow = true; lamp.shadow.mapSize.set(256, 256); lamp.shadow.bias = -0.004
  scene.add(lamp)
  // luar fraco entrando pelo corredor: no escuro, a Sombra aparece como recorte contra a parede
  const moon = new THREE.DirectionalLight('#7088c0', 0.0); moon.position.set(2.5, 3, 4); moon.target.position.set(0, 1, -1.8); scene.add(moon); scene.add(moon.target)
  const bulb = new THREE.Mesh(sphere(0.05), basic({ color: '#ffcc88' })); bulb.position.copy(lamp.position); scene.add(bulb)
  const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.45, 3), std({ color: '#111' })); cord.position.set(1.1, 2.78, -1.2); scene.add(cord)

