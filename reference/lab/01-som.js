  // ---------- som: tudo sintetizado na hora (Web Audio), sem arquivos ----------
  // o navegador só libera o áudio depois de um clique: o primeiro clique na página liga tudo
  // =====================================================================
  ui.snd = 'on'
  const SFX = (() => {
    let cxV = 0 // o volume da caixinha atrás da porta da Garota (a demo da casa manda, por quadro)
    let ctx = null, out, room, deathBus, deathPre, noiseBuf, amb = null, hum = null, chaseT = 0, ghost = 'mae', chaseL = null, heartT = 0, shriekT = 2, isCut = false, flut = null, whine = null, croakT = 3, wasLit = null, dsc = null, mbox = null, deathLP, grl = null, masterLP, post, mord = null, obs = null, refl = null
    const R = Math.random
    const now = () => ctx.currentTime
    function boot() {
      if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return }
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return
      ctx = new AC()
      const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 5; comp.attack.value = 0.003; comp.release.value = 0.2
      out = ctx.createGain(); out.gain.value = ui.snd === 'on' ? 0.55 : 0 // volume geral (mais baixo)
      // ouvido: um passa-baixa no fim da cadeia (surdez do Mordomo); o que vem de dentro da cabeça (zumbido, coração) passa por fora dele
      masterLP = ctx.createBiquadFilter(); masterLP.type = 'lowpass'; masterLP.frequency.value = 20000; masterLP.Q.value = 0.5
      const soft = ctx.createBiquadFilter(); soft.type = 'lowpass'; soft.frequency.value = 6500; soft.Q.value = 0.4 // menos agudo "digital"
      const shelf = ctx.createBiquadFilter(); shelf.type = 'highshelf'; shelf.frequency.value = 2500; shelf.gain.value = -5
      post = ctx.createGain(); out.connect(soft); soft.connect(shelf); shelf.connect(masterLP); masterLP.connect(post); post.connect(comp); comp.connect(ctx.destination)
      // reverb de cômodo de madeira: impulso de ruído decaindo
      const len = Math.floor(ctx.sampleRate * 1.7), ir = ctx.createBuffer(2, len, ctx.sampleRate)
      for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (R() * 2 - 1) * Math.pow(1 - i / len, 3.2) }
      room = ctx.createConvolver(); room.buffer = ir; const wet = ctx.createGain(); wet.gain.value = 0.5; room.connect(wet); wet.connect(out)
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate); const nd = noiseBuf.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = R() * 2 - 1
      // tudo da morte passa por aqui, até o eco: no corte para o preto, silêncio seco
      deathBus = ctx.createGain(); deathBus.connect(out)
      deathLP = ctx.createBiquadFilter(); deathLP.type = 'lowpass'; deathLP.frequency.value = 20000; deathLP.connect(deathBus) // abafa tudo quando você está "dentro"
      deathPre = ctx.createGain(); deathPre.connect(deathLP)
      const dRoom = ctx.createConvolver(); dRoom.buffer = ir; const dWet = ctx.createGain(); dWet.gain.value = 0.35; deathPre.connect(dRoom); dRoom.connect(dWet); dWet.connect(deathLP)
      startAmbience()
      window.__sfx = { ctx, out }
    }
    // ---------- peças ----------
    let use3D = false // ligado só enquanto o código de um fantasma roda: o que ele toca sai da boca dele
    function bus(wet = 0.25, death = false, pan = 0, flat = false) {
      const g = ctx.createGain()
      if (death) { g.connect(deathPre); return g }
      if (use3D && !pan && !flat) { g.connect(ghSpace().inp); return g }
      if (pan) { const p = ctx.createStereoPanner(); p.pan.value = pan; const g2 = ctx.createGain(); g.connect(p); p.connect(out); if (wet > 0) { const s2 = ctx.createGain(); s2.gain.value = wet; g.connect(s2); s2.connect(room) } return g }
      g.connect(out); if (wet > 0) { const s = ctx.createGain(); s.gain.value = wet; g.connect(s); s.connect(room) }
      return g
    }
    function vca(dest, t0, a, peak, hold, r) {
      const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t0); g.gain.linearRampToValueAtTime(peak, t0 + a)
      g.gain.setValueAtTime(peak, t0 + a + hold); g.gain.exponentialRampToValueAtTime(0.0001, t0 + a + hold + r); g.connect(dest); return g
    }
    function noise(o) { // ruído filtrado: sopro, pano, impacto, chiado
      const t0 = o.t ?? now(), a = o.a ?? 0.004, r = o.r ?? 0.08
      const s = ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = true; s.playbackRate.value = o.rate || 1
      const f = ctx.createBiquadFilter(); f.type = o.type || 'bandpass'; f.frequency.setValueAtTime(o.f || 1000, t0); f.Q.value = o.q ?? 1
      if (o.f2) f.frequency.exponentialRampToValueAtTime(o.f2, t0 + o.dur)
      const g = vca(o.dest || bus(o.wet), t0, a, o.gain ?? 0.2, Math.max(0, o.dur - a), r)
      s.connect(f); f.connect(g); s.start(t0, R() * 1.5); s.stop(t0 + o.dur + r + 0.05)
      return g
    }
    function tone(o) { // oscilador com glissando
      const t0 = o.t ?? now(), a = o.a ?? 0.004, r = o.r ?? 0.1
      const osc = ctx.createOscillator(); osc.type = o.type || 'sine'; osc.detune.value = (R() - 0.5) * 10
      osc.frequency.setValueAtTime(o.f, t0); if (o.f2) osc.frequency.exponentialRampToValueAtTime(o.f2, t0 + o.dur)
      let node = osc
      const lpF = o.lp || (osc.type !== 'sine' ? 2600 : 0)
      if (lpF) { const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = lpF; osc.connect(f); node = f }
      const g = vca(o.dest || bus(o.wet), t0, a, o.gain ?? 0.2, Math.max(0, o.dur - a), r)
      node.connect(g); osc.start(t0); osc.stop(t0 + o.dur + r + 0.05)
      return osc
    }
    // trem de estalos (atrito de madeira, osso, garganta): o intervalo vai de i0 a i1
    function clicks(o) {
      const n = o.n || 20; let t = o.t ?? now()
      for (let k = 0; k < n; k++) {
        const u = k / Math.max(1, n - 1)
        noise({ t, dur: 0.002, a: 0.0008, r: o.r ?? 0.018, f: o.f * (1 + (R() - 0.5) * (o.spread ?? 0.3)), q: o.q ?? 6, gain: (o.gain ?? 0.1) * (0.6 + R() * 0.4) * (o.shape ? o.shape(u) : 1), dest: o.dest, wet: o.wet })
        t += (o.i0 + (o.i1 - o.i0) * u) * (0.75 + R() * 0.5)
      }
      return t
    }
    const thump = (t, f = 80, gain = 0.3, dest) => { tone({ t, f, f2: f * 0.55, dur: 0.09, r: 0.12, gain, lp: 300, dest }); noise({ t, dur: 0.03, type: 'lowpass', f: 600, gain: gain * 0.35, r: 0.05, dest }) }
    const creak = (t, gain = 0.06, dest) => clicks({ t, n: 18 + (R() * 22 | 0), i0: 0.03 + R() * 0.02, i1: 0.012, f: 350 + R() * 400, q: 9, gain, r: 0.03, dest, shape: (u) => Math.sin(u * Math.PI) })
    const crack = (t, gain = 0.2, dest) => { clicks({ t, n: 6 + (R() * 6 | 0), i0: 0.012, i1: 0.004, f: 2200, q: 3, gain, dest }); tone({ t, f: 140, f2: 70, dur: 0.03, gain: gain * 0.6, lp: 400, dest }) }

    // ---------- ambiente: zumbido da casa, ar parado, rangidos ----------
    function startAmbience() {
      const g = ctx.createGain(); g.gain.value = 0.0001; g.connect(out)
      const n = ctx.createBufferSource(); n.buffer = noiseBuf; n.loop = true
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 170; n.connect(lp); lp.connect(g)
      const dg = ctx.createGain(); dg.gain.value = 0.18; dg.connect(g)
      ;[48.5, 49.1, 97.3].forEach((f, i) => { const o = ctx.createOscillator(); o.frequency.value = f; const og = ctx.createGain(); og.gain.value = i === 2 ? 0.25 : 1; o.connect(og); og.connect(dg); o.start() })
      const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 0.06; lg.gain.value = 70; lfo.connect(lg); lg.connect(lp.frequency); lfo.start()
      n.start()
      g.gain.exponentialRampToValueAtTime(0.5, now() + 2.5)
      amb = { g, next: now() + 3 }
    }

    // ---------- A Mãe: uma voz sintetizada de verdade (pulso da garganta + formantes de vogal), posicionada no espaço ----------
    // tudo o que é dela passa por maeBus(): vem do lugar onde ela está (HRTF), cai com a distância e fica abafado atrás de parede
    let maeSp = null, occluder = null, GLOT = null
    const _sp = { a: null }
    function glot() { // o pulso da glote: harmônicos caindo devagar, os pares um pouco mais fracos (voz feminina cansada)
      if (GLOT) return GLOT
      const n = 56, re = new Float32Array(n), im = new Float32Array(n)
      for (let k = 1; k < n; k++) im[k] = Math.pow(k, -1.25) * (k % 2 ? 1 : 0.72)
      return (GLOT = ctx.createPeriodicWave(re, im))
    }
    function curve(k) { const c = new Float32Array(1024); for (let i = 0; i < 1024; i++) { const x = i / 511.5 - 1; c[i] = Math.tanh(k * x) / Math.tanh(k) } return c }
    function maeSpace() {
      if (maeSp) return maeSp
      const inp = ctx.createGain(), lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 18000; lp.Q.value = 0.5
      const occG = ctx.createGain(), pan = ctx.createPanner()
      pan.panningModel = 'HRTF'; pan.distanceModel = 'inverse'; pan.refDistance = 1.6; pan.rolloffFactor = 1.1; pan.maxDistance = 60
      inp.connect(lp); lp.connect(occG); occG.connect(pan); pan.connect(out)
      const send = ctx.createGain(); send.gain.value = 0.4; occG.connect(send); send.connect(room) // o eco do cômodo (cai com a distância, no tick)
      maeSp = { inp, lp, pan, occG, send, blocked: false, tOcc: 0 }
      return maeSp
    }
    function maeBus() { const g = ctx.createGain(); g.connect(maeSpace().inp); return g }
    // os outros fantasmas: a mesma cadeia (HRTF, distância, eco do cômodo), com a boca no rosto de cada um
    let ghSp = null
    function ghSpace() {
      if (ghSp) return ghSp
      const inp = ctx.createGain(); inp.gain.value = 1 // até 3 m soa no volume de antes; mais longe, cai
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 18000; lp.Q.value = 0.5
      const pan = ctx.createPanner(); pan.panningModel = 'HRTF'; pan.distanceModel = 'inverse'; pan.refDistance = 3; pan.rolloffFactor = 1.0; pan.maxDistance = 60
      const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -9; comp.ratio.value = 4; comp.attack.value = 0.004; comp.release.value = 0.2 // segura só os picos (gritos sobrepostos)
      inp.connect(comp); comp.connect(lp); lp.connect(pan); pan.connect(out)
      const send = ctx.createGain(); send.gain.value = 0.4; lp.connect(send); send.connect(room)
      ghSp = { inp, lp, pan, send }
      return ghSp
    }
    const HEAD = { // de onde sai a voz de cada um
      sombra: () => sombra.views.rosto().focus(), desc: () => desc.views.rosto().focus(), garota: () => garota.views.rosto().focus(), mordomo: () => mordomo.views.rosto().focus(),
      observador: () => observador.views.rosto().focus(), reflexo: () => reflexo.views.rosto().focus(), amigo: () => amigo.views.rosto().focus(),
      espectral: () => (glutao.group.visible ? glutao.mouth() : espectral.mouth()), glutao: () => glutao.mouth(),
    }
    const HD = () => HEAD[ghost] // de quem é a boca agora
    function in3D(fn) { use3D = !!HD(); try { fn() } finally { use3D = false } }
    window.__sfxMae = () => maeSp
    const setP = (p, v) => { if (p) p.setTargetAtTime(v, now(), 0.03) }
    const _v1 = new THREE.Vector3(), _v2 = new THREE.Vector3(), _v3 = new THREE.Vector3(), _v4 = new THREE.Vector3(), _q1 = new THREE.Quaternion()
    function spaceTick(dt) { // o ouvido é a câmera; a boca dela, a cabeça do modelo
      if (!maeSp && !ghSp) return
      camera.updateMatrixWorld(); camera.getWorldPosition(_v1); camera.getWorldQuaternion(_q1)
      _v2.set(0, 0, -1).applyQuaternion(_q1); _v3.set(0, 1, 0).applyQuaternion(_q1)
      const L = ctx.listener
      if (L.positionX) { setP(L.positionX, _v1.x); setP(L.positionY, _v1.y); setP(L.positionZ, _v1.z); setP(L.forwardX, _v2.x); setP(L.forwardY, _v2.y); setP(L.forwardZ, _v2.z); setP(L.upX, _v3.x); setP(L.upY, _v3.y); setP(L.upZ, _v3.z) }
      else { L.setPosition(_v1.x, _v1.y, _v1.z); L.setOrientation(_v2.x, _v2.y, _v2.z, _v3.x, _v3.y, _v3.z) }
      if (ghSp && HD()) { // o fantasma do laboratório
        let h = null; try { h = HD()() } catch (e) {}
        if (h) { const P2 = ghSp.pan; if (P2.positionX) { setP(P2.positionX, h.x); setP(P2.positionY, h.y); setP(P2.positionZ, h.z) } else P2.setPosition(h.x, h.y, h.z); ghSp.send.gain.setTargetAtTime(0.5 * Math.min(1, 1.8 / Math.max(0.5, _v1.distanceTo(h))), now(), 0.1) }
      }
      if (!maeSp) return
      maeGroup.getWorldPosition(_v4); _v4.y += 1.5 * maeGroup.scale.y
      const P = maeSp.pan
      if (P.positionX) { setP(P.positionX, _v4.x); setP(P.positionY, _v4.y); setP(P.positionZ, _v4.z) } else P.setPosition(_v4.x, _v4.y, _v4.z)
      maeSp.tOcc -= dt
      if (maeSp.tOcc <= 0) { maeSp.tOcc = 0.12; maeSp.blocked = !!(occluder && occluder(_v1.clone(), _v4.clone())) }
      maeSp.lp.frequency.setTargetAtTime(maeSp.blocked ? 650 : 18000, now(), 0.1); maeSp.occG.gain.setTargetAtTime(maeSp.blocked ? 0.6 : 1, now(), 0.1)
      maeSp.send.gain.setTargetAtTime(0.45 * Math.min(1, 1.8 / Math.max(0.5, _v1.distanceTo(_v4))), now(), 0.1)
    }
    // formantes (F1, F2, F3 e o peso de cada um) das vogais que ela usa
    const VOW = { m: [[280, 6, 1], [950, 9, 0.18], [2500, 8, 0.04]], u: [[330, 6, 0.9], [820, 7, 0.32], [2350, 8, 0.08]], o: [[480, 5, 1], [900, 6, 0.45], [2550, 8, 0.12]], a: [[760, 4, 1], [1220, 5, 0.6], [2650, 7, 0.28]], e: [[520, 5, 1], [1850, 7, 0.55], [2650, 8, 0.3]], i: [[310, 6, 1], [2250, 8, 0.5], [3000, 9, 0.32]] }
    // sc escala os formantes: > 1 é garganta pequena (criança), < 1 é garganta enorme (bicho)
    function formants(src, dest, vowel, sc = 1) { const fs = VOW[vowel].map(([f, q, g]) => { const b = ctx.createBiquadFilter(); b.type = 'bandpass'; b.frequency.value = f * sc; b.Q.value = q; const gg = ctx.createGain(); gg.gain.value = g * 3; src.connect(b); b.connect(gg); gg.connect(dest); return { b, gg } }); fs.sc = sc; return fs }
    function setVowel(fs, vowel, t, tc = 0.08) { const sc = fs.sc || 1; VOW[vowel].forEach(([f, , g], i) => { fs[i].b.frequency.setTargetAtTime(f * sc, t, tc); fs[i].gg.gain.setTargetAtTime(g * 3, t, tc) }) }
    // voz curta (garganta, grito): pulso da glote com tremor, saturação e formantes
    function voice(o) {
      const t = o.t ?? now(), dur = o.dur, dest = o.dest || maeBus()
      const g = vca(dest, t, o.a ?? 0.03, o.gain, dur, o.r ?? 0.12)
      const sat = ctx.createWaveShaper(); sat.curve = curve(o.grit ?? 2); const pre = ctx.createGain(); pre.gain.value = 0.6
      const fs = formants(sat, g, o.vowel || 'a', o.sc || 1); if (o.vowel2) setVowel(fs, o.vowel2, t + dur * 0.4, dur * 0.3)
      const n = o.layers || [[1, 0, 1]]
      for (const [k, det, lg] of n) {
        const osc = ctx.createOscillator(); osc.setPeriodicWave(glot()); osc.detune.value = det + (R() - 0.5) * 8
        osc.frequency.setValueAtTime(o.f * k, t); if (o.f2) osc.frequency.exponentialRampToValueAtTime(o.f2 * k, t + (o.glide ?? dur * 0.4))
        if (o.f3) osc.frequency.exponentialRampToValueAtTime(o.f3 * k, t + dur)
        for (let j = 1; j < 8; j++) osc.frequency.setTargetAtTime((o.f3 || o.f2 || o.f) * k * (1 + (R() - 0.5) * (o.wob ?? 0.06)), t + (o.glide ?? dur * 0.4) + j * dur / 9, 0.02) // a voz não fica parada
        const lg2 = ctx.createGain(); lg2.gain.value = lg; osc.connect(lg2); lg2.connect(pre)
        if (o.vib) { const v = ctx.createOscillator(), vg = ctx.createGain(); v.frequency.value = o.vib[0]; vg.gain.value = o.vib[1] * k; v.connect(vg); vg.connect(osc.frequency); v.start(t); v.stop(t + dur + 0.3) }
        osc.start(t); osc.stop(t + dur + (o.r ?? 0.12) + 0.05)
      }
      let src = pre
      if (o.ring) { const rm = ctx.createGain(); rm.gain.value = 1 - o.ring[1]; const ro = ctx.createOscillator(); ro.frequency.value = o.ring[0]; const rg = ctx.createGain(); rg.gain.value = o.ring[1]; ro.connect(rg); rg.connect(rm.gain); pre.connect(rm); src = rm; ro.start(t); ro.stop(t + dur + 0.3) } // modulação em frequência de voz: soa metálico, nada humano
      if (o.fry) { const am = ctx.createGain(); am.gain.value = 1 - o.fry; const fo = ctx.createOscillator(); fo.type = 'square'; fo.frequency.value = o.fryHz || 36; const fg = ctx.createGain(); fg.gain.value = o.fry; fo.connect(fg); fg.connect(am.gain); src.connect(am); am.connect(sat); fo.start(t); fo.stop(t + dur + 0.3) } else src.connect(sat)
      if (o.air) noise({ t, dur, a: 0.02, r: 0.08, f: 1600, q: 0.8, gain: o.gain * o.air, dest })
      return g
    }
    // ---------- a cantiga: melodia original em lá menor; boca fechada ("mm") e abrindo nas notas longas ----------
    // [frequência, duração, vogal]; 0 = respiração
    const MAE_SONG = [[329.6, 0.75, 'm'], [293.7, 0.45, 'm'], [261.6, 0.75, 'u'], [293.7, 0.45, 'm'], [246.9, 1.6, 'a'], [0, 1.1], [261.6, 0.75, 'm'], [246.9, 0.45, 'm'], [220, 0.75, 'u'], [207.7, 0.5, 'm'], [220, 2.1, 'o'], [0, 2.4]]
    function humStart() {
      if (hum) return
      const g = ctx.createGain(); g.gain.value = 0.0001; g.connect(maeBus())
      const pre = ctx.createGain(); pre.gain.value = 0.55
      const fry = ctx.createGain(); fry.gain.value = 1; const fo = ctx.createOscillator(); fo.type = 'square'; fo.frequency.value = 34; const fg = ctx.createGain(); fg.gain.value = 0; fo.connect(fg); fg.connect(fry.gain)
      const sat = ctx.createWaveShaper(); sat.curve = curve(1.4)
      const o1 = ctx.createOscillator(), o2 = ctx.createOscillator(), sub = ctx.createOscillator()
      ;[o1, o2, sub].forEach((o) => o.setPeriodicWave(glot())); o2.detune.value = 9; sub.detune.value = -1200 // a sombra da voz, uma oitava abaixo
      const subG = ctx.createGain(); subG.gain.value = 0.16; const subD = ctx.createDelay(0.2); subD.delayTime.value = 0.045 // e um pouco atrasada
      o1.connect(pre); o2.connect(pre); sub.connect(subG); subG.connect(subD); subD.connect(pre)
      // tremor natural do tom (ruído lento), vibrato que cresce nas notas longas e um "wow" de fita bem lento
      const jn = ctx.createBufferSource(); jn.buffer = noiseBuf; jn.loop = true; jn.playbackRate.value = 0.05; const jl = ctx.createBiquadFilter(); jl.type = 'lowpass'; jl.frequency.value = 7; const jg = ctx.createGain(); jg.gain.value = 60; jn.connect(jl); jl.connect(jg)
      const vib = ctx.createOscillator(), vg = ctx.createGain(); vib.frequency.value = 5.3; vg.gain.value = 0; vib.connect(vg)
      const wow = ctx.createOscillator(), wg = ctx.createGain(); wow.frequency.value = 0.31; wg.gain.value = 1.2; wow.connect(wg)
      ;[o1, o2, sub].forEach((o) => { jg.connect(o.frequency); vg.connect(o.frequency); wg.connect(o.frequency) })
      pre.connect(fry); fry.connect(sat)
      const fs = formants(sat, g, 'm')
      // o ar passando, junto com a voz
      const ns = ctx.createBufferSource(); ns.buffer = noiseBuf; ns.loop = true; const nf = ctx.createBiquadFilter(); nf.type = 'bandpass'; nf.frequency.value = 1700; nf.Q.value = 0.9; const ngn = ctx.createGain(); ngn.gain.value = 0.035; ns.connect(nf); nf.connect(ngn); ngn.connect(g)
      const nodes = [o1, o2, sub, jn, vib, wow, ns, fo]; nodes.forEach((x) => x.start())
      hum = { g, o1, o2, sub, vg, fg, fs, nodes, i: 0, tNext: now() + 0.6 }
    }
    function humStop() {
      if (!hum) return
      const h = hum; hum = null
      h.g.gain.cancelScheduledValues(now()); h.g.gain.setTargetAtTime(0.0001, now(), 0.06)
      h.nodes.forEach((x) => x.stop(now() + 0.6))
    }
    function humTick() {
      while (hum && hum.tNext < now() + 0.25) {
        const [f, d, v] = MAE_SONG[hum.i % MAE_SONG.length], t = hum.tNext
        const H = hum, oscs = [H.o1, H.o2, H.sub]
        if (f > 0) {
          const ff = f * Math.pow(2, (R() - 0.5) * 0.045) // até ±20 cents fora
          oscs.forEach((o) => o.frequency.setTargetAtTime(ff, t, 0.045)) // escorrega para a nota
          setVowel(H.fs, v, t, 0.07)
          H.g.gain.setTargetAtTime(0.42, t, 0.07); H.g.gain.setTargetAtTime(0.3, t + d * 0.55, 0.18)
          H.vg.gain.setTargetAtTime(0, t, 0.02); if (d > 1) H.vg.gain.setTargetAtTime(5, t + 0.35, 0.25) // vibrato só depois de firmar a nota longa
          H.fg.gain.setTargetAtTime(0, t, 0.05)
          const next = MAE_SONG[(H.i + 1) % MAE_SONG.length]
          if (next[0] === 0 && R() < 0.45) { // fim da frase: a voz cai e fica rouca
            oscs.forEach((o) => o.frequency.setTargetAtTime(ff * Math.pow(2, -(2 + R() * 2) / 12), t + d * 0.55, 0.22))
            H.fg.gain.setTargetAtTime(0.55, t + d * 0.5, 0.15); setVowel(H.fs, 'm', t + d * 0.6, 0.2)
          } else if (R() < 0.1) oscs.forEach((o) => o.frequency.setTargetAtTime(ff * 0.92, t + d * 0.7, 0.03)) // a voz quebra
        } else { // pausa: cala e puxa o ar pelo nariz
          H.g.gain.setTargetAtTime(0.0001, t, 0.1); H.fg.gain.setTargetAtTime(0, t, 0.05)
          noise({ t: t + d * 0.45, dur: 0.5, a: 0.25, r: 0.12, f: 650, f2: 1500, q: 1.6, gain: 0.07, dest: maeBus() })
        }
        H.tNext += d; H.i++
      }
    }
    function maeBreath() { // na caça: puxa o ar num assobio rouco e solta com a garganta rasgada
      const t = now(), dIn = 0.14 + R() * 0.08, dOut = 0.2 + R() * 0.12, dest = maeBus()
      noise({ t, dur: dIn, a: 0.03, r: 0.04, f: 1150, f2: 2300, q: 4, gain: 0.2, dest })
      noise({ t, dur: dIn, a: 0.03, r: 0.05, f: 3400, q: 1.2, gain: 0.06, dest })
      const t2 = t + dIn + 0.025
      noise({ t: t2, dur: dOut, a: 0.012, r: 0.12, f: 1300, f2: 650, q: 1.6, gain: 0.26, dest })
      voice({ t: t2, dur: dOut, f: 62 + R() * 30, f2: 48, vowel: R() < 0.5 ? 'a' : 'o', gain: 0.16, grit: 3.5, fry: 0.7, fryHz: 28 + R() * 14, air: 0.4, r: 0.1, dest }) // o gemido grave, rasgado
      if (R() < 0.6) clicks({ t: t2 + 0.04, n: 7 + (R() * 9 | 0), i0: 0.02, i1: 0.032, f: 280 + R() * 220, q: 2.2, gain: 0.14, dest }) // a garganta molhada
    }
    function maeShriek(t, dest) { // o guincho da caça: sobe rasgando, treme e quebra no fim
      const f0 = 480 + R() * 120, peak = 880 + R() * 260, dur = 0.45 + R() * 0.35
      voice({ t, dur, f: f0, f2: peak, f3: peak * 0.7, glide: 0.12, vowel: 'a', vowel2: 'e', gain: 0.22, grit: 4, vib: [9.5, 28], wob: 0.1, air: 0.6, r: 0.08,
        layers: [[1, 0, 1], [1.003, 14, 0.7], [0.5, 0, 0.45], [1.5, -10, 0.25]], dest })
      noise({ t, dur: 0.06, a: 0.002, r: 0.06, f: 2600, q: 0.8, gain: 0.25, dest }) // o ataque
      voice({ t: t + dur, dur: 0.25, f: peak * 0.5, f2: peak * 0.25, vowel: 'o', gain: 0.1, grit: 3, fry: 0.6, fryHz: 40, r: 0.15, dest }) // a voz quebra no fim
    }
    function maeStep(run) { // pés descalços na tábua e o vestido arrastando
      if (!ctx || ui.snd !== 'on' || isCut || ctx.state !== 'running') return
      const t = now(), dest = maeBus()
      noise({ t, dur: 0.035, type: 'lowpass', f: run ? 560 : 400, gain: run ? 0.34 : 0.17, r: 0.06, dest })
      noise({ t: t + 0.008, dur: 0.02, f: 2600, q: 2, gain: run ? 0.07 : 0.035, dest })
      if (R() < 0.3) creak(t + 0.02, run ? 0.06 : 0.035, dest)
      noise({ t, dur: run ? 0.22 : 0.42, a: 0.05, r: 0.18, f: 2100, q: 0.7, gain: run ? 0.06 : 0.035, dest })
    }

    // ---------- vozes de criatura (os outros fantasmas): o fundo grave e a respiração ----------
    // voz de bicho enorme: grave, rasgada, metálica, com a oitava de baixo; entra nos botes e nas mortes
    function demon(t, dur, gain = 0.15, dest, f = 52, vowel = 'o') {
      const Dd = dest || bus(0.5)
      voice({ t, dur, a: Math.min(0.15, dur * 0.2), r: 0.3, f, f2: f * 1.25, f3: f * 0.7, glide: dur * 0.3, vowel, vowel2: 'a', sc: 0.5, gain, grit: 9, fry: 0.85, fryHz: 19 + R() * 6, ring: [f * 0.73, 0.25], layers: [[1, 0, 1], [0.5, 0, 0.9], [1.01, 14, 0.5]], air: 0.4, dest: Dd })
      tone({ t, f: f * 0.5, f2: f * 0.4, dur, a: 0.1, r: 0.4, gain: gain * 1.2, lp: 90, dest: Dd }) // o peito vibrando
    }
    // respiração de criatura, como a da Mãe: puxa o ar e solta com a garganta; k < 1 é um bicho maior (mais grave e mais lento)
    function creatureBreath(t, o) {
      const Dd = o.dest || bus(0.4), k = o.k ?? 1, g = o.gain ?? 0.1
      const dIn = (o.chase ? 0.16 : 0.55) / k, dOut = (o.chase ? 0.24 : 0.85) / k
      noise({ t, dur: dIn, a: dIn * 0.4, r: 0.05, f: 700 * k, f2: 1400 * k, q: 2.2, gain: g * 0.9, dest: Dd })
      const t2 = t + dIn + 0.04
      noise({ t: t2, dur: dOut, a: 0.03, r: 0.15, f: 900 * k, f2: 450 * k, q: 1.4, gain: g, dest: Dd })
      voice({ t: t2, dur: dOut, a: 0.03, r: 0.12, f: 70 * k, f2: 52 * k, vowel: 'o', vowel2: 'u', sc: 0.5 + 0.4 * k, gain: g * (o.chase ? 1 : 0.55), grit: 5, fry: 0.8, fryHz: 22 + 14 * k, air: 0.6, dest: Dd })
      if (o.wet && R() < 0.6) clicks({ t: t2 + 0.05, n: 6 + (R() * 8 | 0), i0: 0.02, i1: 0.035, f: 260 + R() * 200, q: 2.2, gain: g * 0.9, dest: Dd }) // garganta molhada
    }
    let gbT = 1, gdT = 3 // respiração e voz grave do fantasma do laboratório

    // ---------- perseguição: golpe de entrada, cordas graves pulsando, um guincho agudo e o seu coração ----------
    // ---------- trilha sonora (arquivos da pasta ost/): na casa, o ambiente, a tensão e a caça de cada um ----------
    // quem pede é a demo da casa (SFX.music), a cada quadro; sem os arquivos (ou antes de carregar), fica a trilha sintetizada de antes
    const MUS = { files: { amb: ['ost/amb_casa.mp3', 0.6], tensao: ['ost/tensao.mp3', 0.55], maeDemo: ['ost/batalha_mae.mp3', 0.62], bando: ['ost/batalha_espectral.mp3', 0.62, 0.39, 121.2], }, // bando: a batalha dos Espectrais e do Glutão (a mesma para os dois) // [arquivo, volume, início e fim do trecho em laço (s)]. A música de combate de cada fantasma é sintetizada (makeCombat, mais abaixo)
      buf: {}, pos: {}, loading: false, bus: null, duck: null, cur: null, curK: null, want: null, lastSet: -9, lowT: 0, active: false }
    function musLoad() {
      if (MUS.loading || !ctx) return
      MUS.loading = true; MUS.bus = ctx.createGain(); MUS.duck = ctx.createGain(); MUS.bus.connect(MUS.duck); MUS.duck.connect(out)
      for (const [k, [url, , s0, s1]] of Object.entries(MUS.files)) fetch(url).then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(r.status))).then((a) => ctx.decodeAudioData(a)).then((b) => { MUS.buf[k] = seamless(b, s0, s1) }).catch(() => {})
    }
    function seamless(b, s0 = 0, s1, F = 1.5) { // o fim do trecho se funde no começo dele: o laço não tem emenda (e começa já no trecho)
      const a = Math.floor(s0 * b.sampleRate), e = Math.min(b.length, s1 ? Math.floor(s1 * b.sampleRate) : b.length), f = Math.min(Math.floor(F * b.sampleRate), (e - a) >> 2)
      for (let c = 0; c < b.numberOfChannels; c++) { const d = b.getChannelData(c); for (let i = 0; i < f; i++) { const u = i / f; d[a + i] = d[a + i] * Math.sin(u * Math.PI / 2) + d[e - f + i] * Math.cos(u * Math.PI / 2) } }
      b.loopStart_ = a / b.sampleRate; b.loopEnd_ = (e - f) / b.sampleRate; return b
    }
    function musPlay(k, fast) {
      const t = now()
      if (MUS.curK === k && (MUS.cur || !k || (!COMBAT[k] && !MUS.buf[k]))) return
      if (MUS.cur) { const c = MUS.cur; if (c.comb) c.comb.stop(fast); else { MUS.pos[c.k] = (t - c.t0) % (c.src.buffer.loopEnd_ - c.src.buffer.loopStart_); c.g.gain.cancelScheduledValues(t); c.g.gain.setTargetAtTime(0.0001, t, fast ? 0.02 : c.k === 'amb' ? 0.35 : 0.9); c.src.stop(t + (fast ? 0.2 : 5)) } }
      MUS.cur = null; MUS.curK = k
      if (!k) return
      if (COMBAT[k]) { if (!MUS.bus) { MUS.bus = ctx.createGain(); MUS.duck = ctx.createGain(); MUS.bus.connect(MUS.duck); MUS.duck.connect(out) } MUS.cur = { comb: combatStart(k), k }; return } // a música de combate: sintetizada, começa já no máximo
      if (!MUS.buf[k]) return
      const b = MUS.buf[k], src = ctx.createBufferSource(); src.buffer = b; src.loop = true; src.loopStart = b.loopStart_; src.loopEnd = b.loopEnd_
      const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.setTargetAtTime(MUS.files[k] ? MUS.files[k][1] : 0.62, t, k === 'amb' ? 1.2 : k === 'tensao' ? 0.6 : 0.12)
      src.connect(g); g.connect(MUS.bus)
      const off = k === 'amb' || k === 'tensao' ? (MUS.pos[k] || 0) : 0 // a casa e a tensão continuam de onde pararam; a caça começa do começo
      const L = b.loopEnd_ - b.loopStart_; src.start(t, b.loopStart_ + (off % L)); MUS.cur = { src, g, k, t0: t - off }
    }
    const RANK = { amb: 1, tensao: 2, bando: 3, maeDemo: 3, mae: 3, amigo: 4, sombra: 3, desc: 3, garota: 3, observador: 3, espectral: 3, glutao: 3 }
    function musTick(dt) {
      const on = ghost === 'casa' && ui.snd === 'on' && now() - MUS.lastSet < 0.5 && !isCut
      if (on !== MUS.active) { MUS.active = on; if (amb && !isCut) amb.g.gain.setTargetAtTime(on ? 0.15 : ambLevel(), now(), 0.8) } // com a trilha, o zumbido da casa fica baixinho
      if (MUS.cur && MUS.cur.comb) MUS.cur.comb.tick() // agenda o próximo compasso da música de combate
      if (ghost !== 'casa') return // no laboratório, quem toca o combate é a caça (mais abaixo)
      if (!on) { if (MUS.curK) musPlay(null, isCut); return }
      const w = MUS.want, cur = MUS.curK
      if (!cur || (RANK[w] || 0) >= (RANK[cur] || 0)) { MUS.lowT = 0; musPlay(w) }
      else { MUS.lowT += dt; if (MUS.lowT > (RANK[cur] >= 3 ? 4 : 2.5)) { MUS.lowT = 0; musPlay(w) } } // a caça acabou: a trilha ainda segura uns segundos antes de baixar
      if (MUS.curK && !MUS.cur && MUS.buf[MUS.curK]) { const k = MUS.curK; MUS.curK = null; musPlay(k) } // o arquivo acabou de carregar
    }
    const musOwns = () => MUS.active && MUS.cur && (RANK[MUS.cur.k] || 0) >= 3 // a trilha de arquivo está na caça: a sintetizada não entra
    // ---------- música de combate, sintetizada: um laço de 40 compassos (1:00) a 160 BPM em Ré menor, tocado em tempo real (um compasso agendado por vez) ----------
    // a mesma partitura para todos (tambores desde o primeiro tempo, baixo e cordas em semicolcheias, o motivo Ré Fá Mi Mi♭ Ré como tema);
    // cada fantasma troca o instrumento do tema e acrescenta a sua cor. Seções: combate 8 · tema 8 · ataque 8 · quebra 4 · tema 8 · combate 4
    const COMBAT = {
      mae: { lead: 'musicbox', oct: 3, extras: ['hum', 'glass'], snare: 'snare' },
      amigo: { lead: 'toypiano', oct: 2, extras: ['limp', 'roar', 'spider'], snare: 'metal', heavy: true },
      sombra: { lead: 'glitch', oct: 2, extras: ['static'], snare: 'metal' },
      desc: { lead: 'harpsi', oct: 2, extras: ['scream', 'screech'], snare: 'anvil', orch: true },
      garota: { lead: 'musicbox', oct: 3, wobble: true, extras: ['bite'], snare: 'snare' },
      observador: { lead: 'horn', oct: 1, extras: ['gallop', 'crack'], snare: 'snare' },
      espectral: { lead: 'wail', oct: 3, extras: ['hiss', 'bones', 'screech'], snare: 'snare' }, // um lamento que desliza como cobra, chiado e vértebras estalando
      glutao: { lead: 'gut', oct: 1, extras: ['roar', 'bones', 'gulp'], snare: 'metal', heavy: true }, // o tema rosnado no grave, os engolidos
    }
    function makeCombat(name, ac, dest, verbIn) { // ac: o contexto (o do jogo, ou um offline para gerar a prévia); verbIn: para onde vai o eco
      const C = COMBAT[name], ST = 60 / 160 / 4, BAR = ST * 16, NB = 40 // 160 BPM: 40 compassos = 1:00
      let seed = 1234 + name.length * 77; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
      const nb = ac.createBuffer(1, ac.sampleRate, ac.sampleRate), nd = nb.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = rnd() * 2 - 1
      const master = ac.createGain(); master.gain.value = 0.7
      const comp = ac.createDynamicsCompressor(); comp.threshold.value = -14; comp.knee.value = 4; comp.ratio.value = 8; comp.attack.value = 0.002; comp.release.value = 0.12
      master.connect(comp); comp.connect(dest)
      let verb = verbIn
      if (!verb) { const ir = ac.createBuffer(2, Math.floor(ac.sampleRate * 1.8), ac.sampleRate); for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < d.length; i++) d[i] = (rnd() * 2 - 1) * Math.pow(1 - i / d.length, 3) * 0.5 } verb = ac.createConvolver(); verb.buffer = ir; const vg = ac.createGain(); vg.gain.value = 0.3; verb.connect(vg); vg.connect(master) }
      const vSend = ac.createGain(); vSend.gain.value = verbIn ? 0.5 : 1; vSend.connect(verb)
      const pan = (x) => { const p = ac.createStereoPanner(); p.pan.value = x; p.connect(master); return p }
      const P = { c: pan(0), l: pan(-0.35), r: pan(0.35), ll: pan(-0.7), rr: pan(0.7) }
      const wet = (n, amt = 1) => { const s = ac.createGain(); s.gain.value = amt; n.connect(s); s.connect(vSend) }
      const shp = (k) => { const n = 1024, c = new Float32Array(n); for (let i = 0; i < n; i++) { const x = i / (n - 1) * 2 - 1; c[i] = Math.tanh(k * x) / Math.tanh(k) } const w = ac.createWaveShaper(); w.curve = c; return w }
      // barramentos fixos: o baixo saturado; as cordas graves e os violinos com um filtro só cada; o sintetizador do tema distorcido
      const bassSat = shp(4), bassBus = ac.createGain(); bassBus.gain.value = 0.55; bassBus.connect(bassSat); const bsG = ac.createGain(); bsG.gain.value = 0.5; bassSat.connect(bsG); bsG.connect(P.c)
      const filt = (type, f, q, to) => { const x = ac.createBiquadFilter(); x.type = type; x.frequency.value = f; x.Q.value = q; x.connect(to); return x }
      const lowL = filt('lowpass', 2600, 0.8, P.l), lowR = filt('lowpass', 2600, 0.8, P.r); wet(lowL, 0.3); wet(lowR, 0.3)
      const vioL = filt('lowpass', 7000, 0.7, P.ll), vioR = filt('lowpass', 7000, 0.7, P.rr); wet(vioL, 0.5); wet(vioR, 0.5)
      const synSat = shp(3), synF = filt('lowpass', 3200, 1.5, P.c); synSat.connect(synF); wet(synF, 0.4)
      const brSat = shp(2.5), brG = ac.createGain(); brG.gain.value = 0.6; brSat.connect(brG); brG.connect(P.c); wet(brG, 0.6)
      const vca = (t, a, peak, d, to) => { const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); g.connect(to); return g }
      const osc = (type, f, t, dur, to, f2, glide) => { const o = ac.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + (glide || dur)); o.connect(to); o.start(t); o.stop(t + dur + 0.05); return o }
      const noise = (t, dur, type, f, q, gain, to, a = 0.001) => { const s = ac.createBufferSource(); s.buffer = nb; s.loop = true; const fl = ac.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q; s.connect(fl); fl.connect(vca(t, a, gain, dur, to)); s.start(t, rnd() * 0.9); s.stop(t + a + dur + 0.05); return fl }
      // percussão
      const kick = (t, g = 1) => { osc('sine', C.heavy ? 140 : 165, t, 0.4, vca(t, 0.001, 1.0 * g, C.heavy ? 0.42 : 0.3, P.c), 44, 0.07); noise(t, 0.012, 'bandpass', 3200, 1, 0.35 * g, P.c); if (C.heavy) osc('sine', 48, t, 0.35, vca(t, 0.005, 0.5 * g, 0.3, P.c)) }
      const snare = (t, g = 1) => {
        osc('triangle', 210, t, 0.15, vca(t, 0.001, 0.45 * g, 0.11, P.c), 160, 0.06)
        const n = noise(t, 0.2, 'highpass', 1600, 0.7, 0.55 * g, P.c); wet(n, 0.35)
        if (C.snare === 'metal') { const v = vca(t, 0.001, 0.05 * g, 0.2, P.c); ;[540, 803, 1271].forEach((fr) => osc('square', fr, t, 0.25, v)) }
        if (C.snare === 'anvil') { const v = vca(t, 0.001, 0.08 * g, 0.4, P.r); ;[1180, 1870, 2950].forEach((f) => osc('triangle', f, t, 0.45, v)); wet(v, 0.5) }
      }
      const hat = (t, g = 1, open) => noise(t, open ? 0.22 : 0.03, 'highpass', 8500, 0.8, (open ? 0.12 : 0.09) * g, open ? P.r : P.rr)
      const crash = (t, g = 1) => { const n = noise(t, 1.6, 'highpass', 4200, 0.6, 0.22 * g, P.l); wet(n, 0.5); noise(t, 1.0, 'bandpass', 9000, 2, 0.08 * g, P.r) }
      const tom = (t, f, g = 1, p = P.c) => { osc('sine', f * 1.8, t, 0.35, vca(t, 0.001, 0.6 * g, 0.28, p), f, 0.06); noise(t, 0.08, 'bandpass', f * 3, 1.2, 0.15 * g, p) }
      const timp = (t, f, g = 1) => { const v = vca(t, 0.003, 0.75 * g, 0.7, P.c); osc('sine', f * 1.03, t, 0.8, v, f, 0.12); osc('triangle', f * 1.5, t, 0.4, vca(t, 0.003, 0.15 * g, 0.35, P.c)); noise(t, 0.06, 'lowpass', 500, 0.8, 0.4 * g, P.c); wet(v, 0.5) }
      const impact = (t, g = 1) => { osc('sine', 75, t, 1.6, vca(t, 0.002, 1.1 * g, 1.4, P.c), 28, 1.2); const n = noise(t, 0.9, 'lowpass', 500, 0.7, 0.6 * g, P.c); wet(n, 0.8); crash(t, 1.2 * g) }
      const riser = (t, dur, g = 1) => { const s = ac.createBufferSource(); s.buffer = nb; s.loop = true; const fl = ac.createBiquadFilter(); fl.type = 'bandpass'; fl.Q.value = 2.5; fl.frequency.setValueAtTime(300, t); fl.frequency.exponentialRampToValueAtTime(7000, t + dur); const v = ac.createGain(); v.gain.setValueAtTime(0.0001, t); v.gain.exponentialRampToValueAtTime(0.3 * g, t + dur); v.gain.linearRampToValueAtTime(0.0001, t + dur + 0.02); s.connect(fl); fl.connect(v); v.connect(P.c); wet(v, 0.6); s.start(t); s.stop(t + dur + 0.05); osc('sawtooth', 110, t, dur, vca(t, dur * 0.9, 0.07 * g, dur * 0.1, synSat), 880, dur) }
      // harmonia e melodia
      const bass = (t, f, dur, g = 1) => { const fl = ac.createBiquadFilter(); fl.type = 'lowpass'; fl.Q.value = 3; fl.frequency.setValueAtTime(1300, t); fl.frequency.exponentialRampToValueAtTime(220, t + dur); fl.connect(vca(t, 0.002, 0.55 * g, dur, bassBus)); osc('sawtooth', f, t, dur, fl); osc('square', f / 2, t, dur, fl) }
      const low = (t, f, dur, g = 1, bus = lowL) => { const v = vca(t, 0.004, 0.2 * g, dur, bus); osc('sawtooth', f, t, dur, v).detune.value = 8; osc('sawtooth', f, t, dur, v).detune.value = -8 }
      const vio = (t, f, dur, g = 1, bus = vioL) => { const v = vca(t, 0.003, 0.085 * g, dur, bus); osc('sawtooth', f, t, dur, v).detune.value = 6; osc('sawtooth', f * 1.002, t, dur, v).detune.value = -9 }
      const braam = (t, f, dur, g = 1) => { const fl = ac.createBiquadFilter(); fl.type = 'lowpass'; fl.Q.value = 3; fl.frequency.setValueAtTime(180, t); fl.frequency.exponentialRampToValueAtTime(1600, t + 0.25); fl.frequency.exponentialRampToValueAtTime(400, t + dur); fl.connect(vca(t, 0.03, 0.32 * g, dur, brSat)); ;[f, f * 1.498, f * 2, f / 2].forEach((x) => { osc('sawtooth', x, t, dur + 0.1, fl).detune.value = (rnd() - 0.5) * 16 }) }
      const stab = (t, fs, dur, g = 1) => { const fl = ac.createBiquadFilter(); fl.type = 'lowpass'; fl.Q.value = 2; fl.frequency.setValueAtTime(600, t); fl.frequency.linearRampToValueAtTime(2800, t + 0.02); fl.frequency.exponentialRampToValueAtTime(600, t + dur); fl.connect(vca(t, 0.005, 0.22 * g, dur, brSat)); fs.forEach((f) => { osc('sawtooth', f, t, dur, fl).detune.value = (rnd() - 0.5) * 12 }) }
      const choir = (t, fs, dur, g = 1) => { const v = vca(t, 0.25, 0.05 * g, dur, P.l); wet(v, 1.2); const vib = ac.createOscillator(), vg = ac.createGain(); vib.frequency.value = 5.2; vg.gain.value = 4; vib.connect(vg); vib.start(t); vib.stop(t + dur + 0.4); ;[[760, 6, 1], [1220, 8, 0.6], [2650, 10, 0.25]].forEach(([fr, q, a]) => { const b = ac.createBiquadFilter(); b.type = 'bandpass'; b.frequency.value = fr; b.Q.value = q; const ga = ac.createGain(); ga.gain.value = a * 3; b.connect(ga); ga.connect(v); fs.forEach((f) => { const o = osc('sawtooth', f, t, dur + 0.3, b); vg.connect(o.detune) }) }) }
      const synth = (t, f, dur, g = 1) => { const v = vca(t, 0.004, 0.13 * g, dur, synSat); osc('sawtooth', f, t, dur, v).detune.value = 10; osc('square', f, t, dur, v).detune.value = -10 }
      const lead = (t, f, dur, g0 = 1) => {
        const k = C.lead, g = g0 * 1.5
        if (k === 'musicbox') { const fw = C.wobble ? f * (1 - 0.025 * rnd()) : f; const v = vca(t, 0.002, 0.22 * g, 0.9, P.ll); wet(v, 0.9); osc('sine', fw, t, 1.0, v, C.wobble ? fw * 0.985 : 0, 0.8); osc('sine', fw * 3.01, t, 0.4, vca(t, 0.002, 0.06 * g, 0.3, P.ll)); osc('sine', fw * 5.4, t, 0.2, vca(t, 0.002, 0.025 * g, 0.15, P.ll)) }
        if (k === 'toypiano') { const v = vca(t, 0.002, 0.26 * g, 0.5, P.ll); wet(v, 0.6); osc('triangle', f, t, 0.55, v).detune.value = 28; osc('sine', f * 2.76, t, 0.3, vca(t, 0.002, 0.09 * g, 0.25, P.ll)); osc('sine', f * 5.4, t, 0.15, vca(t, 0.002, 0.04 * g, 0.12, P.ll)) }
        if (k === 'harpsi') { const fl = ac.createBiquadFilter(); fl.type = 'highpass'; fl.frequency.value = 350; const v = vca(t, 0.001, 0.16 * g, 0.45, P.ll); fl.connect(v); wet(v, 0.6); osc('sawtooth', f, t, 0.5, fl).detune.value = -18; osc('sawtooth', f * 2, t, 0.35, fl).detune.value = 14 }
        if (k === 'glitch') { const v = ac.createGain(); v.connect(P.ll); wet(v, 0.4); v.gain.setValueAtTime(0, t); for (let u = 0; u < dur; u += 0.03) v.gain.setValueAtTime(rnd() < 0.7 ? 0.1 * g : 0, t + u); v.gain.setValueAtTime(0, t + dur); osc('square', f, t, dur, v); osc('square', f * 1.005, t, dur, v) }
        if (k === 'wail') { const v = vca(t, 0.03, 0.11 * g, dur, P.l); wet(v, 1); const o = osc('sine', f * 0.94, t, dur + 0.05, v, f, Math.min(0.12, dur * 0.4)); const vib = ac.createOscillator(), vg = ac.createGain(); vib.frequency.value = 6.5; vg.gain.value = f * 0.02; vib.connect(vg); vg.connect(o.frequency); vib.start(t); vib.stop(t + dur + 0.1); osc('triangle', f * 2, t, dur, vca(t, 0.03, 0.03 * g, dur, P.r)) } // lamento de fantasma, deslizando para a nota
        if (k === 'gut') { const fl = ac.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = 700; fl.Q.value = 4; const v = vca(t, 0.01, 0.3 * g, dur, P.c); fl.connect(v); wet(v, 0.5); osc('sawtooth', f, t, dur, fl).detune.value = 12; osc('sawtooth', f * 0.5, t, dur, fl).detune.value = -12; const am = ac.createOscillator(), ag = ac.createGain(); am.frequency.value = 27; ag.gain.value = 0.15 * g; am.connect(ag); ag.connect(v.gain); am.start(t); am.stop(t + dur + 0.1) } // o tema rosnado, de garganta enorme
        if (k === 'horn') { const fl = ac.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = 900; fl.Q.value = 2; const v = vca(t, 0.04, 0.28 * g, dur, P.l); fl.connect(v); wet(v, 0.7); osc('sawtooth', f, t, dur, fl, f * 0.95, dur); osc('sawtooth', f / 2, t, dur, fl, f / 2 * 0.95, dur) }
      }
      // as cores dos fantasmas
      const roar = (t, dur = 1.3, g = 1) => { const v = vca(t, 0.06, 0.5 * g, dur, P.c); wet(v, 0.5); const am = ac.createOscillator(), ag = ac.createGain(); am.frequency.value = 31; ag.gain.value = 0.3; am.connect(ag); ag.connect(v.gain); am.start(t); am.stop(t + dur + 0.2); osc('sawtooth', 62, t, dur, v, 41, dur); osc('sawtooth', 93, t, dur, v, 60, dur); noise(t, dur, 'bandpass', 340, 1.5, 0.35 * g, v) }
      const scrape = (t, g = 1) => { const f = noise(t, 0.4, 'bandpass', 900, 3, 0.35 * g, P.c, 0.02); f.frequency.setValueAtTime(900, t); f.frequency.exponentialRampToValueAtTime(260, t + 0.4) }
      const click = (t, g = 1) => noise(t, 0.012, 'bandpass', 3800, 3, 0.25 * g, rnd() < 0.5 ? P.ll : P.rr)
      const stat = (t, dur, g = 1) => { const v = ac.createGain(); v.connect(P.rr); v.gain.setValueAtTime(0, t); for (let u = 0; u < dur; u += 0.02) v.gain.setValueAtTime(rnd() < 0.55 ? 0.16 * g : 0, t + u); v.gain.setValueAtTime(0, t + dur); const s = ac.createBufferSource(); s.buffer = nb; s.loop = true; const fl = ac.createBiquadFilter(); fl.type = 'bandpass'; fl.frequency.value = 2400; fl.Q.value = 1; s.connect(fl); fl.connect(v); s.start(t); s.stop(t + dur + 0.05) }
      const bite = (t, g = 1) => { osc('sine', 85, t, 0.3, vca(t, 0.003, 0.7 * g, 0.22, P.c), 45, 0.1); const f = noise(t + 0.02, 0.16, 'lowpass', 700, 6, 0.35 * g, P.c); f.frequency.setValueAtTime(1100, t); f.frequency.exponentialRampToValueAtTime(250, t + 0.18) }
      const hum = (t, dur, f, g = 1) => { const v = vca(t, 0.3, 0.09 * g, dur, P.l); wet(v, 1); const vib = ac.createOscillator(), vgn = ac.createGain(); vib.frequency.value = 5; vgn.gain.value = f * 0.012; vib.connect(vgn); vib.start(t); vib.stop(t + dur + 0.5); ;[[330, 6], [820, 8]].forEach(([fr, q]) => { const b = ac.createBiquadFilter(); b.type = 'bandpass'; b.frequency.value = fr; b.Q.value = q; b.connect(v); const o = osc('sawtooth', f, t, dur + 0.4, b, f * 0.94, dur); vgn.connect(o.frequency) }) }
      const glass = (t, f, dur, g = 1) => { const v = vca(t, dur * 0.5, 0.06 * g, dur * 0.5, P.rr); wet(v, 1); const o = osc('sine', f, t, dur, v); const vib = ac.createOscillator(), vgn = ac.createGain(); vib.frequency.value = 6.5; vgn.gain.value = f * 0.012; vib.connect(vgn); vgn.connect(o.frequency); vib.start(t); vib.stop(t + dur) }
      const scream = (t, dur, g = 1) => { const v = vca(t, 0.12, 0.07 * g, dur, P.r); wet(v, 1); ;[[760, 5], [1220, 6]].forEach(([fr, q]) => { const b = ac.createBiquadFilter(); b.type = 'bandpass'; b.frequency.value = fr; b.Q.value = q; b.connect(v); ;[587, 622, 880].forEach((f) => { osc('sawtooth', f, t, dur, b, f * (1.12 + rnd() * 0.1), dur).detune.value = (rnd() - 0.5) * 30 }) }) }
      const screech = (t, dur, g = 1) => { ;[1175, 1245].forEach((f, i) => { const v = vca(t, 0.02, 0.03 * g, dur, i ? P.rr : P.ll); wet(v, 0.8); osc('sawtooth', f, t, dur, v, f * 1.06, dur) }) }
      const crack = (t, g = 1) => noise(t, 0.05, 'bandpass', 2200, 3, 0.35 * g, rnd() < 0.5 ? P.l : P.r)
      // a partitura: Rém, Si♭, Dó, Lá, Rém, Si♭, Mi♭ (o pavor), Lá
      const ROOTS = [0, -4, -2, -5, 0, -4, 1, -5], QUAL = [3, 4, 4, 4, 3, 4, 4, 4] // terça menor (3) ou maior (4)
      const D2 = 73.42, hz = (base, semi) => base * Math.pow(2, semi / 12)
      const LOWP = [0, 0, 12, 0, 0, 12, 0, 7, 0, 0, 12, 0, 0, 12, 7, 12] // cordas graves em semicolcheias
      const VIOP = [12, 7, 3, 7, 12, 7, 3, 7, 15, 12, 7, 12, 15, 12, 7, 3] // violinos: arpejo rápido do acorde (a terça entra conforme o acorde)
      const MOTIF = [[0, 0, 2], [2, 3, 2], [4, 2, 2], [6, 1, 2], [8, 0, 4], [12, 3, 2], [14, 5, 2], [16, 7, 4], [20, 5, 2], [22, 3, 2], [24, 2, 4], [28, 1, 4]] // o motivo em colcheias: Ré Fá Mi Mi♭ Ré · Fá Sol Lá Sol Fá Mi Mi♭
      const KA = [0, 3, 4, 6, 8, 10, 11, 12, 14], KB = [0, 2, 3, 4, 6, 8, 10, 11, 12, 14, 15], GALLOP = [0, 2, 3, 4, 6, 7, 8, 10, 11, 12, 14, 15]
      const sec = (b) => (b < 8 ? 'combate' : b < 16 ? 'tema' : b < 24 ? 'ataque' : b < 28 ? 'quebra' : b < 36 ? 'tema2' : 'combate')
      const EX = new Set(C.extras)
      function bar(b, t0) {
        const S = sec(b), r = ROOTS[b % 8], q3 = QUAL[b % 8], quebra = S === 'quebra', atk = S === 'ataque', tema = S === 'tema' || S === 'tema2', big = atk || S === 'tema2'
        const spider = EX.has('spider') && b >= 20 && b < 24, limp = EX.has('limp') && b >= 16 && b < 20
        const fill = b % 4 === 3, secStart = b === 0 || b === 8 || b === 16 || b === 28 || b === 36
        if (secStart) impact(t0, b === 0 || b === 28 ? 1 : 0.7); else if (b % 2 === 0 && big) crash(t0, 0.8)
        if (b === 7 || b === 15 || b === 35) riser(t0, BAR, 0.8)
        if (b === 26) riser(t0, BAR * 2, 1)
        for (let s = 0; s < 16; s++) {
          const t = t0 + s * ST
          if (quebra) {
            if (s === 0 || s === 8) { kick(t, 1.2); if (C.orch) timp(t, hz(D2, r)) }
            if (s === 8) snare(t, 1.2)
            if (s % 4 === 2) tom(t, s < 8 ? 120 : 90, 1)
            if (b >= 26) hat(t, 0.4 + 0.6 * ((b - 26) * 16 + s) / 32) // a quebra volta a acelerar
            if (s === 0) bass(t, hz(D2, r), BAR * 0.9, 1.2)
            if (s === 0) braam(t, hz(D2, r), BAR * 0.95, 1)
            continue
          }
          // bateria
          const kp = EX.has('gallop') ? GALLOP : big || spider ? KB : KA
          if (kp.includes(s)) kick(t, s % 4 === 0 ? 1 : 0.75)
          if (C.orch && s % 8 === 0) timp(t, s ? hz(D2, r + 7) / 2 : hz(D2, r), 0.9)
          if (s === 4 || s === 12) snare(t)
          else if (big && (s === 7 || s === 15)) snare(t, 0.35) // nota fantasma
          if (fill && s >= 12) { snare(t, 0.5 + (s - 12) * 0.18); snare(t + ST / 2, 0.4 + (s - 12) * 0.15) } // virada: a caixa em fusas no último tempo
          if (fill && s >= 8 && s < 12) tom(t, [140, 120, 100, 85][s - 8], 0.9, s % 2 ? P.l : P.r)
          if (!C.orch) { hat(t, s % 2 ? 0.55 : 1); if (s % 4 === 2) hat(t, 0.9, true) } else noise(t, 0.02, 'bandpass', 2500, 4, 0.12 * (s % 2 ? 0.6 : 1), P.rr) // o Desconhecido: madeira do arco (col legno) no lugar do chimbal
          if (big && s % 4 === 3 && !fill) tom(t, 110, 0.7, P.l)
          if (spider) { click(t + ST * 0.33); click(t + ST * 0.66) }
          // baixo em colcheias saltando de oitava, cordas graves em semicolcheias, violinos em arpejo
          if (s % 2 === 0) bass(t, hz(D2, r + (s % 4 === 2 ? 12 : 0)), ST * 1.8)
          low(t, hz(D2 * 2, r + LOWP[s]), ST * 0.85, tema || atk ? 1.1 : 1, s % 2 ? lowL : lowR)
          if (b >= 4 || tema || atk) { let iv = VIOP[s]; if (iv === 3 || iv === 15) iv += q3 - 3; vio(t, hz(D2 * 4, r + iv), ST * 0.8, big ? 1.2 : 0.9, s % 2 ? vioL : vioR) }
          if (atk && s % 4 === 2) stab(t, [hz(D2 * 2, r), hz(D2 * 2, r + 7), hz(D2 * 4, r + 1)], 0.16)
        }
        // metais graves (braam) a cada 2 compassos; coro no acorde; o tema em colcheias, dobrado pelo sintetizador distorcido
        if (!quebra && b % 2 === 0) braam(t0, hz(D2, r), BAR * 1.6, big ? 1.1 : 0.85)
        if (tema || atk) choir(t0, [hz(D2 * 4, r), hz(D2 * 4, r + q3), hz(D2 * 4, r + 7)], BAR * 0.98, big ? 1.2 : 1)
        if (quebra) choir(t0, [hz(D2 * 4, r), hz(D2 * 4, r + 3), hz(D2 * 4, r + 7)], BAR * 0.98, 1.3)
        if (tema && b % 2 === 0) MOTIF.forEach(([s, n, d]) => { const t = t0 + s * ST, gg = S === 'tema2' ? 1.25 : 1; lead(t, hz(D2 * Math.pow(2, C.oct), n), d * ST, gg); synth(t, hz(D2 * 2, n), d * ST * 0.95, gg) })
        if (S === 'combate' && b % 4 === 2) [[0, 0], [2, 3], [4, 2], [6, 1], [8, 0]].forEach(([s, n]) => synth(t0 + s * ST, hz(D2 * 2, n), ST * 1.8, 0.8)) // o começo do motivo, como chamada
        // cores
        if (EX.has('hum') && (tema || atk) && b % 4 === 0) hum(t0, BAR * 4 - 0.3, hz(D2 * 4, r))
        if (EX.has('glass') && (b === 16 || b === 20 || b === 30 || b === 34)) glass(t0, hz(D2 * 16, 1), BAR * 1.5)
        if (limp) { kick(t0, 1.5); scrape(t0 + 0.12); kick(t0 + 8 * ST, 1.4); scrape(t0 + 8 * ST + 0.12) }
        if (EX.has('roar') && (b === 16 || b === 24 || b === 32)) roar(t0, b === 24 ? 2.4 : 1.4)
        if (EX.has('static') && (big || quebra || rnd() < 0.35)) stat(t0 + Math.floor(rnd() * 12) * ST, 0.2 + rnd() * 0.35, big ? 1 : 0.7)
        if (EX.has('bite') && (big || tema)) { bite(t0); if (big) bite(t0 + 8 * ST, 0.8) }
        if (EX.has('scream') && (b === 16 || b === 20 || b === 24 || b === 30 || b === 34)) scream(t0, BAR * 2)
        if (EX.has('screech') && big) screech(t0, BAR * 0.95)
        if (EX.has('crack') && (big || rnd() < 0.3)) crack(t0 + Math.floor(rnd() * 16) * ST)
        if (EX.has('gallop') && b % 8 === 6) roar(t0 + 8 * ST, 0.9, 0.55) // um berro grave
        if (EX.has('hiss') && (b % 2 === 1 || big)) noise(t0 + 12 * ST, ST * 4, 'highpass', 5200, 1.5, big ? 0.14 : 0.09, P.rr, 0.05) // o chiado do bando
        if (EX.has('bones')) for (let s = 1; s < 16; s += 2) if (rnd() < (big ? 0.8 : 0.4)) click(t0 + s * ST) // vértebras estalando nos contratempos
        if (EX.has('gulp') && (b === 16 || b === 24 || b === 32)) { osc('sine', 160, t0, 0.6, vca(t0, 0.005, 0.6, 0.5, P.c), 35, 0.5); bite(t0 + 0.05, 0.8) } // engole
      }
      return { bar, master, NB, BAR }
    }
    function combatStart(name) { // toca no jogo: agenda um compasso por vez, uns 0,35 s à frente
      const g = ctx.createGain(), t = now(); g.gain.setValueAtTime(0.0001, t); g.gain.setTargetAtTime(1, t, 0.04); g.connect(MUS.bus)
      const eng = makeCombat(name, ctx, g, room), CB = { eng, g, b: 0, tNext: t + 0.03, k: name }
      CB.tick = () => { if (CB.dead) return; while (CB.tNext < now() + 0.35) { eng.bar(CB.b % eng.NB, CB.tNext); CB.b++; CB.tNext += eng.BAR } }
      CB.stop = (fast) => { if (CB.dead) return; CB.dead = true; const t2 = now(); g.gain.cancelScheduledValues(t2); g.gain.setTargetAtTime(0.0001, t2, fast ? 0.02 : 0.7); setTimeout(() => { try { g.disconnect() } catch (e) {} }, fast ? 500 : 6000) }
      CB.tick(); return CB
    }
    function combatPreview(name, secs = 60) { // gera a prévia (arquivo) num contexto offline
      const SRp = 32000, oc = new OfflineAudioContext(2, Math.ceil(secs * SRp), SRp), eng = makeCombat(name, oc, oc.destination, null)
      for (let b = 0; b * eng.BAR < secs; b++) eng.bar(b % eng.NB, b * eng.BAR)
      return oc.startRendering()
    }
    function chaseStart() {
      if (chaseL || musOwns()) return
      const t = now(), g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.32, t + 0.35)
      const dest = bus(0.3, false, 0, true), dk = ctx.createGain(); g.connect(dk); dk.connect(dest) // dk: abaixa a trilha quando um rugido passa
      const nodes = []
      // cordas graves em cluster (segunda menor), tremolo nervoso
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 520; lp.Q.value = 2
      const trem = ctx.createGain(); trem.gain.value = 0.6; lp.connect(trem); trem.connect(g)
      const tl = ctx.createOscillator(), tg = ctx.createGain(); tl.type = 'square'; tl.frequency.value = 7.5; tg.gain.value = 0.4; tl.connect(tg); tg.connect(trem.gain); nodes.push(tl)
      ;[55, 58.27, 82.4, 87.3, 110.6].forEach((f, i) => { const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = (R() - 0.5) * 14; const og = ctx.createGain(); og.gain.value = i > 3 ? 0.35 : 0.6; o.connect(og); og.connect(lp); nodes.push(o) })
      const sw = ctx.createOscillator(), swg = ctx.createGain(); sw.frequency.value = 0.35; swg.gain.value = 260; sw.connect(swg); swg.connect(lp.frequency); nodes.push(sw)
      // guincho agudo de corda, deslizando
      const hp = ctx.createBiquadFilter(); hp.type = 'bandpass'; hp.frequency.value = 1300; hp.Q.value = 6
      const hg = ctx.createGain(); hg.gain.value = 0.12; hp.connect(hg); hg.connect(g)
      const hv = ctx.createOscillator(), hvg = ctx.createGain(); hv.frequency.value = 6; hvg.gain.value = 18; hv.connect(hvg); nodes.push(hv)
      ;[1244, 1318].forEach((f) => { const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(f, t); o.frequency.linearRampToValueAtTime(f * 1.06, t + 8); hvg.connect(o.frequency); o.connect(hp); nodes.push(o) })
      nodes.forEach((x) => x.start(t))
      chaseL = { g, nodes, dk }
      // golpe de entrada: cluster estridente + estouro + baque
      ;[311, 330, 466, 494, 698].forEach((f) => tone({ t, f, f2: f * 0.97, type: 'sawtooth', dur: 0.12, r: 0.9, gain: 0.07, lp: 4000, wet: 0.6 }))
      noise({ t, dur: 0.08, r: 0.6, type: 'highpass', f: 1800, gain: 0.25, wet: 0.6 })
      tone({ t, f: 62, f2: 30, dur: 0.3, r: 0.8, gain: 0.7, lp: 200, wet: 0.4 })
      heartT = 0.3; shriekT = 1.2 + R()
    }
    function chaseStop(fast) {
      if (!chaseL) return
      const c = chaseL, t = now(); chaseL = null
      c.g.gain.cancelScheduledValues(t); c.g.gain.setTargetAtTime(0.0001, t, fast ? 0.005 : 0.5)
      c.nodes.forEach((x) => x.stop(t + (fast ? 0.1 : 2.5)))
    }
    function heartbeat(t, gain) { tone({ t, f: 62, f2: 40, dur: 0.07, gain, lp: 150, wet: 0.05 }); tone({ t: t + 0.15, f: 55, f2: 38, dur: 0.06, gain: gain * 0.7, lp: 150, wet: 0.05 }) }

    // ---------- A Sombra: estática de rádio, corvo, pano batendo ----------
    const curves = {}
    function shaper(k) { // distorção (tanh)
      if (!curves[k]) { const n = 1024, c = new Float32Array(n); for (let i = 0; i < n; i++) { const x = i / (n - 1) * 2 - 1; c[i] = Math.tanh(k * x) / Math.tanh(k) } curves[k] = c }
      const w = ctx.createWaveShaper(); w.curve = curves[k]; w.oversample = '2x'; return w
    }
    // voz de corvo: dente de serra distorcido, picotado por um tremolo áspero, formantes de "aa"
    function rasp(t, dur, f0, f1, gain, dest, am = 38) {
      const g = vca(dest || bus(0.45), t, 0.015, gain, dur, 0.06)
      const amG = ctx.createGain(); amG.gain.value = 0.55; amG.connect(g)
      const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.type = 'sine'; lfo.frequency.value = am * (0.85 + R() * 0.3); lg.gain.value = 0.4; lfo.connect(lg); lg.connect(amG.gain)
      const sh = shaper(3), b1 = ctx.createBiquadFilter(), b2 = ctx.createBiquadFilter(), b2g = ctx.createGain()
      b1.type = 'bandpass'; b1.frequency.value = 950; b1.Q.value = 1.6; b2.type = 'bandpass'; b2.frequency.value = 2400; b2.Q.value = 3; b2g.gain.value = 0.5
      sh.connect(b1); sh.connect(b2); b1.connect(amG); b2.connect(b2g); b2g.connect(amG)
      ;[1, 1.017].forEach((k) => { const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(f0 * k, t); o.frequency.exponentialRampToValueAtTime(f1 * k, t + dur); o.connect(sh); o.start(t); o.stop(t + dur + 0.15) })
      lfo.start(t); lfo.stop(t + dur + 0.15)
    }
    // o corvo é grande demais: a garganta que grasna é de gente (voz rasgada, metálica), e às vezes um homem geme logo depois
    function croak(t, gain = 0.1, dest) {
      const d = 0.2 + R() * 0.18, Dd = dest || bus(0.45)
      const caw = (u, k) => voice({ t: u, dur: d * k, f: 300 + R() * 60, f2: 210, f3: 150, glide: 0.05, vowel: 'a', vowel2: 'o', sc: 1.1, gain: gain * 1.1, grit: 7, fry: 0.7, fryHz: 55 + R() * 20, ring: [140 + R() * 40, 0.35], wob: 0.15, air: 0.5, a: 0.008, r: 0.06, layers: [[1, 0, 1], [1.01, 18, 0.6], [0.5, 0, 0.35]], dest: Dd })
      caw(t, 1); rasp(t, d, 170 + R() * 40, 120, gain * 0.4, Dd, 30)
      if (R() < 0.55) caw(t + d + 0.1, 0.8)
      if (R() < 0.22) voice({ t: t + d * 2 + 0.3, dur: 0.7, f: 82, f2: 64, vowel: 'o', vowel2: 'u', gain: gain * 0.55, grit: 3, fry: 0.6, fryHz: 30, air: 0.6, r: 0.3, dest: Dd })
    }
    function sombraShriek(t, gain = 0.16, dest) { // o grito da caça: sobe rasgando, metálico, e a imagem do som picota
      const Dd = dest || bus(0.5), d = 0.32 + R() * 0.2
      voice({ t, dur: d, f: 420 + R() * 60, f2: 820 + R() * 120, f3: 560, glide: 0.1, vowel: 'a', vowel2: 'e', sc: 1.05, gain: gain * 1.2, grit: 8, ring: [230 + R() * 60, 0.45], vib: [11, 30], wob: 0.14, air: 0.6, a: 0.01, r: 0.08, layers: [[1, 0, 1], [1.007, 20, 0.7], [0.5, 0, 0.4]], dest: Dd })
      rasp(t, d, 330, 520, gain * 0.45, Dd, 42); glitch(t + d * 0.6, 0.14, gain * 0.5, Dd)
    }
    // estática: blocos picotados de chiado, bipes e silêncio (como rádio sem sinal)
    function glitch(t, dur, gain = 0.1, dest) {
      let u = t
      while (u < t + dur) {
        const b = 0.01 + R() * 0.035, k = R()
        if (k < 0.45) noise({ t: u, dur: b, a: 0.001, r: 0.004, f: 300 + R() * 5000, q: 1 + R() * 6, gain: gain * (0.6 + R()), dest, wet: 0.15 })
        else if (k < 0.75) tone({ t: u, f: 200 + R() * 3500, type: 'triangle', dur: b, a: 0.001, r: 0.004, gain: gain * 0.25, dest, wet: 0.15 })
        u += b + (R() < 0.3 ? R() * 0.03 : 0)
      }
    }
    const talon = (t, gain = 0.1, dest) => { // garras no assoalho, penas raspando
      clicks({ t, n: 2 + (R() * 2 | 0), i0: 0.025, i1: 0.02, f: 3200, q: 4, gain, dest, r: 0.01 })
      thump(t, 70, gain * 0.6, dest)
      noise({ t, dur: 0.1, a: 0.02, r: 0.06, f: 4200, q: 0.8, gain: gain * 0.2, dest })
    }
    function buzz(t, dur, gain, dest) { // lâmpada da lanterna zumbindo e chiando
      tone({ t, f: 100, type: 'sawtooth', dur, a: 0.005, r: 0.01, gain, lp: 900, dest, wet: 0.1 })
      tone({ t, f: 200.5, type: 'square', dur, a: 0.005, r: 0.01, gain: gain * 0.25, lp: 1600, dest, wet: 0.1 })
      for (let u = t; u < t + dur; u += 0.03 + R() * 0.06) noise({ t: u, dur: 0.004, a: 0.001, r: 0.01, type: 'highpass', f: 3000, gain: gain * 1.2, dest })
    }
    const torchClick = (t, gain = 0.3, dest) => { noise({ t, dur: 0.006, a: 0.001, r: 0.02, type: 'highpass', f: 2500, gain, dest }); tone({ t, f: 900, f2: 500, dur: 0.012, gain: gain * 0.4, dest }) }
    function loopNoise(f, type, q, gain, pan = 0, flat = false) { // ruído contínuo com volume controlável (flat: ambiente, não sai do fantasma)
      const s = ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = true
      const fl = ctx.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q
      const g = ctx.createGain(); g.gain.value = 0.0001; s.connect(fl); fl.connect(g); g.connect(bus(0.3, false, pan, flat)); s.start()
      return { g, fl, s, set: (v, tc = 0.08) => g.gain.setTargetAtTime(Math.max(0.0001, v), now(), tc), stop: () => { g.gain.setTargetAtTime(0.0001, now(), 0.05); s.stop(now() + 0.4) } }
    }
    function sombraEvent(kind) {
      if (!ctx || ui.snd !== 'on' || isCut) return
      const t = now()
      if (kind === 'glitch') { glitch(t, 0.12 + R() * 0.2, 0.09); if (R() < 0.3) tone({ t, f: 60, f2: 40, dur: 0.1, gain: 0.25, lp: 200 }) }
      if (kind === 'freeze') { tone({ t, f: 320, f2: 35, type: 'sawtooth', dur: 0.28, gain: 0.09, lp: 1200, wet: 0.5 }); glitch(t, 0.08, 0.07) } // a fita para
      if (kind === 'thaw') { tone({ t, f: 40, f2: 260, type: 'sawtooth', dur: 0.22, gain: 0.07, lp: 900, wet: 0.5 }) }
    }

    // ---------- O Desconhecido: o objeto respira e ri baixinho; rompe em lascas; a risada é a voz dele ----------
    const MAT = { // som do material de cada disfarce (tremor e estouro)
      quadro: { f: 420, q: 5 }, relogio: { f: 650, q: 7 }, vaso: { f: 2600, q: 10 }, cadeira: { f: 340, q: 5 }, abajur: { f: 3100, q: 12 }, tapete: { f: 900, q: 0.8 },
    }
    const squelch = (t, gain = 0.15, dest, n = 6) => { for (let i = 0; i < n; i++) noise({ t: t + R() * 0.25, dur: 0.03 + R() * 0.07, a: 0.004, r: 0.04, f: 300 + R() * 700, q: 2 + R() * 3, gain: gain * (0.5 + R() * 0.5), dest }) }
    function chuckle(t, gain = 0.04, dest, pan = 0) { // risadinha de boca fechada, rouca, de quem está muito perto de você
      const Dd = dest || bus(0.4, false, pan), n = 4 + (R() * 3 | 0)
      for (let i = 0; i < n; i++) voice({ t: t + i * (0.11 + R() * 0.03), dur: 0.06, a: 0.012, r: 0.05, f: 150 - i * 8, f2: 125 - i * 8, vowel: 'm', vowel2: 'e', gain: gain * 2.4 * (1 - i / (n + 2)), grit: 2.5, fry: 0.5, fryHz: 32, air: 1.2, dest: Dd })
    }
    function cackle(t, gain = 0.14, dest, dur = 0.7) { // "ha-ha-ha" rasgado: as sílabas sobem e caem; por baixo, a mesma risada uma oitava abaixo, metálica
      const Dd = dest || bus(0.45), n = Math.max(3, Math.round(dur / 0.12)); let f = 260 + R() * 60
      for (let i = 0; i < n; i++) {
        const u = t + i * 0.12 * (0.9 + R() * 0.2)
        voice({ t: u, dur: 0.075, a: 0.006, r: 0.05, f: f * 1.25, f2: f, vowel: 'a', vowel2: 'e', gain: gain * (i === n - 1 ? 1.2 : 1), grit: 6, fry: 0.4, fryHz: 48, ring: [95, 0.3], air: 0.5, wob: 0.12, layers: [[1, 0, 1], [0.5, 0, 0.7], [0.25, 0, 0.35], [1.5, 12, 0.2]], dest: Dd })
        noise({ t: u, dur: 0.04, a: 0.002, r: 0.03, f: 1800, q: 1, gain: gain * 0.3, dest: Dd }) // o "h" de cada sílaba
        f *= i < n / 2 ? 1.07 : 0.93
      }
    }
    const chatter = (t, gain = 0.1, dest) => clicks({ t, n: 8 + (R() * 8 | 0), i0: 0.045, i1: 0.035, f: 2900, q: 6, gain, dest, r: 0.012 }) // dentes batendo
    function splinter(t, kind, gain = 0.4, dest) { // o objeto estoura de dentro para fora
      const m = MAT[kind] || MAT.quadro
      clicks({ t, n: 26, i0: 0.004, i1: 0.014, f: m.f * 2, q: 1.2, gain: gain * 0.6, dest })
      noise({ t, dur: 0.3, a: 0.003, r: 0.3, type: 'lowpass', f: 3500, gain: gain * 0.45, dest })
      tone({ t, f: 64, f2: 28, dur: 0.35, r: 0.4, gain: gain * 1.1, lp: 220, dest })
      if (kind === 'relogio' || kind === 'abajur' || kind === 'vaso') [1, 2.76, 5.4].forEach((h, i) => tone({ t, f: (kind === 'relogio' ? 523 : 1480) * h, dur: 0.02, r: 1.2 - i * 0.3, gain: gain * 0.12 / (i + 1), dest })) // sino, vidro, louça
      squelch(t + 0.05, gain * 0.5, dest, 8)
    }
    function descEvent(kind) {
      if (!ctx || ui.snd !== 'on' || isCut) return
      const t = now()
      if (kind === 'snap') { crack(t, 0.22); if (R() < 0.4) chatter(t + 0.05, 0.08) } // o pescoço estala de lado
    }

    // ---------- A Garota: a caixinha de música (melodia original, valsa em mi menor) ----------
    const N = { B4: 493.9, C5: 523.3, E5: 659.3, A4: 440, B5: 987.8, C6: 1046.5, Ds6: 1244.5, E6: 1318.5, Fs6: 1480, G6: 1568, A6: 1760, B6: 1975.5 }
    const WALTZ = [ // [baixo, [nota, tempos]...]
      [N.E5, [[N.E6, 1], [N.G6, 1], [N.B6, 1]]], [N.C5, [[N.A6, 1], [N.G6, 1], [N.Fs6, 1]]], [N.B4, [[N.E6, 2], [N.B5, 1]]],
      [N.A4, [[N.C6, 1], [N.E6, 1], [N.G6, 1]]], [N.B4, [[N.Fs6, 1], [N.E6, 1], [N.Ds6, 1]]], [N.E5, [[N.E6, 3]]], [0, [[0, 2]]],
    ]
    const EVENTS = []; WALTZ.forEach(([b, ns]) => { let first = true; ns.forEach(([f, n]) => { EVENTS.push([f, n, first ? b : 0]); first = false }) })
    function pluck(t, f, gain, dest, detune = 0) { // dente de pente metálico: senoide com parciais inarmônicos e ataque seco
      const k = Math.pow(2, detune / 1200)
      ;[[1, 1, 1.4], [2.76, 0.35, 0.5], [5.4, 0.15, 0.25], [8.9, 0.06, 0.12]].forEach(([h, g, d]) => tone({ t, f: f * h * k, dur: 0.005, a: 0.001, r: d, gain: gain * g, dest }))
      noise({ t, dur: 0.003, a: 0.0005, r: 0.01, type: 'highpass', f: 5000, gain: gain * 0.4, dest })
    }
    function mboxStart(muf) {
      if (mbox) return
      const gain = ctx.createGain(); gain.gain.value = 1
      const sh = shaper(2.5), dry = ctx.createGain(), wetd = ctx.createGain(); dry.gain.value = 1; wetd.gain.value = 0
      gain.connect(dry); gain.connect(sh); sh.connect(wetd)
      const o = bus(0.5); wetd.connect(o)
      if (muf) { const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1500; lp.Q.value = 0.4; dry.connect(lp); lp.connect(o) } else dry.connect(o) // na casa: atrás da porta, abafada
      const heavy = ctx.createGain(); heavy.connect(bus(0.25, false, 0, true)) // banda pesada que entra na caça (trilha: não sai dela)
      mbox = { gain, dry, wetd, dest: gain, heavy, i: 0, tNext: now() + 0.3, mode: 'play', slow: 1, loops: 0, pitch: 0, beat: 0, bass: N.E5, muf: !!muf }
    }
    function mboxStop() { if (!mbox) return; const m = mbox; mbox = null; [m.gain, m.heavy].forEach((g) => { g.gain.cancelScheduledValues(now()); g.gain.setTargetAtTime(0.0001, now(), 0.01) }) }
    // na caça, a valsa ganha banda: bumbo, caixa, prato, baixo distorcido e um sintetizador dobrando a melodia
    const kick = (t, g, d) => { tone({ t, f: 130, f2: 42, dur: 0.13, r: 0.12, gain: g, lp: 400, dest: d, wet: 0 }); noise({ t, dur: 0.004, a: 0.0005, r: 0.01, type: 'highpass', f: 3000, gain: g * 0.3, dest: d }) }
    const snare = (t, g, d) => { noise({ t, dur: 0.1, a: 0.001, r: 0.12, f: 1900, q: 0.7, gain: g, dest: d }); tone({ t, f: 220, f2: 160, dur: 0.05, gain: g * 0.6, dest: d }) }
    const hat = (t, g, d) => noise({ t, dur: 0.015, a: 0.0005, r: 0.03, type: 'highpass', f: 7500, gain: g, dest: d })
    const clank = (t, g, d) => [1, 1.47, 2.31, 3.9].forEach((h, i) => tone({ t, f: 180 * h, type: 'square', dur: 0.01, r: 0.5 - i * 0.1, gain: g / (i + 1), lp: 2500, dest: d })) // metal de fábrica
    function heavyBar(m, t, f, n, beatLen) {
      const d = m.heavy
      for (let k = 0; k < n; k++) {
        const tb = t + k * beatLen, b = m.beat % 3
        if (b === 0) { kick(tb, 0.75, d); if ((m.beat / 3 | 0) % 2 === 0) clank(tb, 0.05, d) }
        if (b === 1) { snare(tb, 0.3, d); kick(tb + beatLen * 0.5, 0.45, d) } // contratempo no bumbo
        if (b === 2) snare(tb, 0.38, d)
        hat(tb, 0.07, d); hat(tb + beatLen * 0.5, 0.045, d)
        // baixo: a nota grave do compasso, duas oitavas abaixo, rasgado
        const bo = ctx.createOscillator(), bs = shaper(4), bl = ctx.createBiquadFilter(), bg = vca(d, tb, 0.005, 0.11, beatLen * 0.7, 0.05)
        bo.type = 'sawtooth'; bo.frequency.value = m.bass / 4; bl.type = 'lowpass'; bl.frequency.value = 800
        bo.connect(bs); bs.connect(bl); bl.connect(bg); bo.start(tb); bo.stop(tb + beatLen + 0.1)
        m.beat++
      }
      if (f) tone({ t, f: f / 2, type: 'sawtooth', dur: 0.12, a: 0.003, r: 0.18, gain: 0.05, lp: 2600, dest: d }) // a melodia dobrada, áspera
    }
    function mboxTick() {
      const m = mbox; if (!m) return
      const beat = 0.42
      while (mbox === m && m.tNext < now() + 0.2) {
        const t = m.tNext
        if (m.mode === 'stopped') { m.tNext = now() + 0.25; break }
        const [f, n, bass] = EVENTS[m.i % EVENTS.length]
        let det = m.pitch, g = 0.11, sp = 1
        if (m.mode === 'wrong') { det += (R() - 0.5) * 70; sp = 0.78; g = 0.09 } // na caça: acelera, desafina e a banda entra
        if (m.mode === 'wind') { m.slow *= 1.38; m.pitch -= 25; sp = m.slow } // a corda acabando
        if (f) pluck(t, f, g, m.dest, det)
        if (f && m.hum > 0 && m.mode === 'play') { m.hum--; voice({ t, dur: n * beat * sp * 0.85, a: 0.06, r: 0.14, f: f / 4 * Math.pow(2, det / 1200), vowel: m.hum % 3 ? 'u' : 'm', sc: 1.25, gain: 0.07, grit: 1.2, vib: [5.5, 4], wob: 0.02, air: 0.35, dest: bus(0.55) }) } // ela cantarola junto, baixinho
        if (bass) { pluck(t, bass, g * 0.8, m.dest, det); m.bass = bass }
        if (m.mode === 'wrong') heavyBar(m, t, f, n, beat * sp); else m.beat = 0
        m.tNext = t + n * beat * sp; m.i++
        if (m.mode === 'wind' && m.slow > 3.2) { m.mode = 'stopped'; clicks({ t: m.tNext, n: 1, i0: 0.01, i1: 0.01, f: 1800, q: 3, gain: 0.12, dest: m.dest }) }
        if (m.i % EVENTS.length === 0) {
          m.loops++
        }
      }
      m.wetd.gain.setTargetAtTime(m.mode === 'wrong' ? 0.35 : 0, now(), 0.2)
      m.dry.gain.setTargetAtTime(m.mode === 'wrong' ? 0.5 : 1, now(), 0.2)
    }
    const whip = (t, gain = 0.12, dest) => noise({ t, dur: 0.12, a: 0.03, r: 0.05, f: 600, f2: 3500, q: 1.5, gain, dest }) // língua cortando o ar
    function giggle(t, gain = 0.06, dest) { // "hi-hi-hi" de menina; logo atrás, a mesma risada uma oitava abaixo, rouca (tem outra coisa rindo junto, dentro dela)
      const Dd = dest || bus(0.5), n = 4 + (R() * 3 | 0); let f = 560 + R() * 80
      for (let i = 0; i < n; i++) {
        const u = t + i * (0.1 + R() * 0.025)
        voice({ t: u, dur: 0.06, a: 0.006, r: 0.05, f: f * 1.12, f2: f, vowel: 'i', vowel2: 'e', sc: 1.25, gain: gain * 1.5 * (1 - i / (n + 3)), grit: 1.8, air: 0.7, wob: 0.05, dest: Dd })
        voice({ t: u + 0.07, dur: 0.07, a: 0.01, r: 0.06, f: f * 0.5, f2: f * 0.45, vowel: 'e', sc: 0.85, gain: gain * 0.8, grit: 5, fry: 0.6, fryHz: 40, ring: [70, 0.3], dest: Dd })
        f *= 0.95
      }
    }
    const chomp = (t, gain = 0.2, dest) => { clicks({ t, n: 3, i0: 0.008, i1: 0.006, f: 2600, q: 3, gain, dest }); squelch(t, gain * 0.5, dest, 3); tone({ t, f: 90, f2: 50, dur: 0.06, gain: gain * 0.8, lp: 250, dest }) }

    // ---------- O Mordomo: vento num fraque vazio; o relógio de bolso, a louça tremendo, o anel chamando ----------
    const inner = () => { const g = ctx.createGain(); g.connect(post); return g } // som de dentro da cabeça: a surdez não abafa
    const flap = (t, gain = 0.1, dest) => { const n = 4 + (R() * 4 | 0); for (let i = 0; i < n; i++) noise({ t: t + i * (0.045 + R() * 0.02), dur: 0.02, a: 0.003, r: 0.03, f: 700 + R() * 900, q: 0.8, gain: gain * (1 - i / (n + 1)), dest }) } // pano chicoteando
    const china = (t, gain = 0.05, dest) => { for (let i = 0; i < 5 + (R() * 6 | 0); i++) { const f = 2400 + R() * 2600; tone({ t: t + R() * 0.35, f, dur: 0.002, a: 0.0005, r: 0.15, gain: gain * (0.5 + R() * 0.5), dest }); tone({ t: t + R() * 0.35, f: f * 2.4, dur: 0.002, a: 0.0005, r: 0.08, gain: gain * 0.3, dest }) } } // xícaras tremendo no pires
    const ringCall = (t, gain = 0.016) => { tone({ t, f: 2960, dur: 0.01, a: 0.005, r: 2.2, gain, wet: 0.6 }); tone({ t, f: 2967, dur: 0.01, a: 0.005, r: 2.2, gain, wet: 0.6 }); tone({ t, f: 5920 * 1.01, dur: 0.01, r: 0.9, gain: gain * 0.3, wet: 0.6 }) } // o anel amaldiçoado "chama"
    const bulbPop = (t, gain = 0.08) => { noise({ t, dur: 0.012, a: 0.001, r: 0.02, type: 'highpass', f: 2500, gain }); tone({ t, f: 100, type: 'sawtooth', dur: 0.06, a: 0.002, r: 0.02, gain: gain * 0.4, lp: 1200 }) } // a lâmpada falha
    // o vento tem voz: um gemido que só é ar passando pelas vogais; na rajada, uiva como gente
    const windMoan = (t, dur, gain, f0, f1, pan = 0) => voice({ t, dur, a: dur * 0.35, r: dur * 0.3, f: f0, f2: f1, glide: dur * 0.6, vowel: 'u', vowel2: 'o', sc: 0.9, gain, grit: 1.4, vib: [4.5, 5], wob: 0.04, air: 2.2, dest: bus(0.8, false, pan) })
    function ahem(t, gain = 0.05, pan = 0) { // o mordomo pigarreia, educado, do seu lado: "hm-hm"
      const Dd = bus(0.35, false, pan)
      voice({ t, dur: 0.11, a: 0.01, r: 0.05, f: 118, f2: 104, vowel: 'm', vowel2: 'e', gain: gain * 1.4, grit: 3, fry: 0.55, fryHz: 34, air: 1.4, dest: Dd })
      voice({ t: t + 0.2, dur: 0.14, a: 0.01, r: 0.06, f: 112, f2: 96, vowel: 'm', gain: gain * 1.2, grit: 2.5, fry: 0.5, fryHz: 30, air: 1, dest: Dd })
    }
    function mordTick(t, dt, dying) {
      if (!mord) {
        mord = { rumble: loopNoise(260, 'lowpass', 0.7, 0, 0, true), whistle: loopNoise(900, 'bandpass', 9, 0), whistle2: loopNoise(1500, 'bandpass', 12, 0), tick: 0, tickN: 0, chinaT: 3, ringT: 5, flapT: 0, doorT: 1, wasL: 1, moanT: 4, ahemT: 14, howlT: 0 }
      }
      const g = mordomo.S.gust
      // vento: um sopro no corredor; na rajada, uiva e muda de nota
      mord.rumble.set(0.12 + 1.3 * g * (0.75 + 0.25 * Math.sin(t * 2.3)), 0.15) // filtrado bem grave: precisa de ganho alto
      mord.whistle.set((0.06 + 1.5 * g) * (0.6 + 0.4 * Math.sin(t * 0.9)), 0.2)
      mord.whistle2.set(1.1 * g * (0.5 + 0.5 * Math.sin(t * 1.7 + 1)), 0.2)
      if (R() < dt * (0.6 + 2 * g)) { mord.whistle.fl.frequency.setTargetAtTime(500 + R() * (700 + 1400 * g), t, 0.4); mord.whistle2.fl.frequency.setTargetAtTime(1100 + R() * 1600 * g, t, 0.3) }
      // a luz falha onde ele passa
      if (lightMul < 1 && mord.wasL >= 1) bulbPop(t, 0.05 + 0.08 * g)
      mord.wasL = lightMul
      if (dying) return
      if (g < 0.3) {
        // vagando: o relógio de bolso tiquetaqueia (tique-taque), a louça treme quando ele passa, o anel chama
        mord.tick += dt; if (mord.tick > 0.5) { mord.tick = 0; mord.tickN++; clicks({ t, n: 1, i0: 0.01, i1: 0.01, f: mord.tickN % 2 ? 4200 : 3300, q: 7, gain: 0.03 }) }
        mord.chinaT -= dt; if (mord.chinaT <= 0) { china(t, 0.035); mord.chinaT = 6 + R() * 8 }
        mord.ringT -= dt; if (mord.ringT <= 0) { ringCall(t); mord.ringT = 9 + R() * 7 }
        mord.moanT -= dt; if (mord.moanT <= 0) { windMoan(t, 1.8 + R(), 0.025, 150 + R() * 40, 115, (R() - 0.5) * 1.4); mord.moanT = 7 + R() * 7 }
        mord.ahemT -= dt; if (mord.ahemT <= 0) { ahem(t, 0.05, (R() < 0.5 ? -1 : 1) * (0.5 + R() * 0.4)); mord.ahemT = 20 + R() * 15 }
      } else {
        // rajada: o fraque chicoteia, a louça cai, portas batem
        mord.flapT -= dt; if (mord.flapT <= 0) { flap(t, 0.14 * g); mord.flapT = 0.2 + R() * 0.35 }
        mord.chinaT -= dt; if (mord.chinaT <= 0) { china(t, 0.08 * g); if (R() < 0.3) { clicks({ t: t + 0.1, n: 12, i0: 0.006, i1: 0.02, f: 3800, q: 3, gain: 0.2 }); tone({ t: t + 0.1, f: 2600, dur: 0.01, r: 0.6, gain: 0.04 }) } mord.chinaT = 0.8 + R() * 1.5 } // xícara se espatifando
        mord.doorT -= dt; if (mord.doorT <= 0) { creak(t, 0.08); if (R() < 0.5) thump(t + 0.35 + R() * 0.3, 60, 0.45); mord.doorT = 1.2 + R() * 2 }
        gdT -= dt; if (gdT <= 0) { windMoan(t, 2.4, 0.07 * g, 72, 55); gdT = 2.5 + R() * 2 } // por baixo do uivo, a casa inteira geme grave
        mord.howlT -= dt; if (mord.howlT <= 0) { windMoan(t, 1.4 + R() * 0.8, 0.05 + 0.06 * g, 220 + R() * 60, 330 + R() * 80, (R() - 0.5) * 1.2); mord.howlT = 1.6 + R() * 1.6 } // a rajada uiva com voz
      }
    }
    function mordStop() { if (!mord) return; mord.rumble.stop(); mord.whistle.stop(); mord.whistle2.stop(); mord = null }

    // ---------- O Observador: a mata à noite, e os sons de bicho dele ----------
    const ambLevel = () => (ghost === 'observador' ? 0.0001 : 0.5) // lá fora não tem o zumbido da casa
    // berro de cervo: assobio que sobe rasgando, segura tremendo e quebra em grunhidos (o chamado dele)
    function bugle(t, gain = 0.1, dest, dur = 1.6, base = 1) { // berro: grave e rasgado, sobe, segura tremendo, quebra em grunhidos
      dest = dest || bus(0.75); gain *= 1.6
      const g = vca(dest, t, 0.1, gain, dur - 0.1, 0.35)
      const sh = shaper(3.5), lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2200; sh.connect(lp); lp.connect(g)
      const vib = ctx.createOscillator(), vg = ctx.createGain(); vib.frequency.value = 6; vg.gain.value = 12 * base; vib.connect(vg)
      ;[[0.5, 'sine', 0.7], [1, 'sawtooth', 0.55], [1.5, 'triangle', 0.25], [2, 'sine', 0.2]].forEach(([h, ty, a]) => {
        const o = ctx.createOscillator(), og = ctx.createGain(); o.type = ty; og.gain.value = a
        o.frequency.setValueAtTime(170 * base * h, t); o.frequency.exponentialRampToValueAtTime(560 * base * h, t + dur * 0.4)
        o.frequency.setValueAtTime(560 * base * h, t + dur * 0.72); o.frequency.exponentialRampToValueAtTime(150 * base * h, t + dur)
        vg.connect(o.frequency); o.connect(og); og.connect(sh); o.start(t); o.stop(t + dur + 0.4)
      })
      vib.start(t); vib.stop(t + dur + 0.4)
      noise({ t, dur, a: 0.1, f: 650 * base, q: 1.5, gain: gain * 0.3, dest }) // o ar rasgando a garganta
      voice({ t: t + dur * 0.12, dur: dur * 0.6, a: 0.12, r: 0.25, f: 380 * base, f2: 900 * base, f3: 680 * base, glide: dur * 0.28, vowel: 'a', vowel2: 'e', gain: gain * 0.32, grit: 6, vib: [7, 25 * base], ring: [110, 0.3], air: 0.4, dest }) // dentro do berro, uma voz de mulher gritando
      rasp(t, dur * 0.95, 52 * base, 40 * base, gain * 0.6, dest, 19) // o ronco de peito por baixo
      tone({ t, f: 34, f2: 28, dur, a: 0.2, r: 0.5, gain: gain * 1.3, lp: 90, dest }) // grave que se sente no peito
      for (let k = 0; k < 3; k++) chuff(t + dur + 0.1 + k * 0.32, gain * 0.9, dest)
    }
    const chuff = (t, gain = 0.1, dest) => { noise({ t, dur: 0.12, a: 0.005, r: 0.1, f: 280, q: 1.2, gain: gain * 1.8, dest }); tone({ t, f: 62, f2: 38, type: 'sawtooth', dur: 0.11, gain: gain * 0.9, lp: 260, dest }) } // grunhido curto e fundo
    const snort = (t, gain = 0.1, dest) => { noise({ t, dur: 0.2, a: 0.004, r: 0.14, f: 560, f2: 230, q: 1.4, gain: gain * 1.3, dest }); tone({ t, f: 70, f2: 40, dur: 0.12, gain: gain * 1.4, lp: 180, dest }) } // bufo pesado, de animal grande
    function growl(t, dur, gain = 0.12, dest) { // rosnado: muito grave, áspero, irregular
      dest = dest || bus(0.45); gain *= 1.5
      const g = vca(dest, t, 0.15, gain, dur, 0.3)
      const am = ctx.createGain(); am.gain.value = 0.55; am.connect(g)
      ;[[19, 0.3], [27.3, 0.2], [6.1, 0.15]].forEach(([f, d]) => { const l = ctx.createOscillator(), lg = ctx.createGain(); l.frequency.value = f * (0.9 + R() * 0.2); lg.gain.value = d; l.connect(lg); lg.connect(am.gain); l.start(t); l.stop(t + dur + 0.5) })
      const sh = shaper(4), b1 = ctx.createBiquadFilter(), b2 = ctx.createBiquadFilter(), b2g = ctx.createGain(), sub = ctx.createBiquadFilter()
      b1.type = 'bandpass'; b1.frequency.value = 260; b1.Q.value = 1.5; b2.type = 'bandpass'; b2.frequency.value = 640; b2.Q.value = 2.5; b2g.gain.value = 0.4
      sub.type = 'lowpass'; sub.frequency.value = 120
      sh.connect(b1); sh.connect(b2); sh.connect(sub); b1.connect(am); b2.connect(b2g); b2g.connect(am); sub.connect(am)
      ;[[44, 'sawtooth'], [46.3, 'sawtooth'], [22, 'square']].forEach(([f, ty]) => { const o = ctx.createOscillator(); o.type = ty; o.frequency.setValueAtTime(f, t); o.frequency.linearRampToValueAtTime(f * (0.88 + R() * 0.2), t + dur); o.connect(sh); o.start(t); o.stop(t + dur + 0.5) })
      voice({ t, dur, a: 0.15, r: 0.3, f: 58, f2: 50, vowel: 'o', vowel2: 'a', sc: 0.55, gain: gain * 0.45, grit: 6, fry: 0.85, fryHz: 21, layers: [[1, 0, 1], [0.5, 0, 0.8]], air: 0.3, dest }) // a garganta enorme
    }
    const pant = (t, gain = 0.08, dest) => { noise({ t, dur: 0.12, a: 0.015, r: 0.05, f: 750, q: 1.6, gain: gain * 1.3, dest }); noise({ t: t + 0.15, dur: 0.14, a: 0.01, r: 0.06, f: 520, q: 1.6, gain: gain * 1.5, dest }); tone({ t: t + 0.15, f: 55, f2: 42, type: 'sawtooth', dur: 0.12, gain: gain * 0.5, lp: 200, dest }) } // ofego pesado, de peito grande
    const hoof = (t, gain = 0.2, dest) => { thump(t, 46, gain * 1.3, dest); noise({ t, dur: 0.05, a: 0.002, r: 0.05, type: 'lowpass', f: 1800, gain: gain * 0.5, dest }); clicks({ t: t + 0.005, n: 5, i0: 0.008, i1: 0.012, f: 3200, q: 1.5, gain: gain * 0.25, dest }) } // casco na terra e nas folhas
    const antlerScrape = (t, gain = 0.05, dest) => { clicks({ t, n: 22, i0: 0.035, i1: 0.02, f: 1150, q: 5, gain, dest, shape: (u) => Math.sin(u * Math.PI) }); noise({ t, dur: 0.6, a: 0.15, r: 0.2, f: 2200, q: 2, gain: gain * 0.4, dest }) } // galhada raspando na casca
    const branch = (t, gain = 0.15, dest) => { crack(t, gain, dest); clicks({ t: t + 0.02, n: 7, i0: 0.01, i1: 0.03, f: 2600, q: 2, gain: gain * 0.5, dest }) }
    const owl = (t, gain = 0.035) => { const d = bus(0.8, false, (R() - 0.5) * 1.4); [[0, 0.32], [0.55, 0.14], [0.75, 0.3]].forEach(([o, l]) => tone({ t: t + o, f: 380, f2: 345, dur: l, a: 0.06, r: 0.12, gain, dest: d })) }
    const drip = (t, gain = 0.04, dest) => tone({ t, f: 900 + R() * 400, f2: 1700 + R() * 500, dur: 0.025, a: 0.001, r: 0.05, gain, dest }) // gota de sangue caindo
    function obsTick(t, dt, dying) {
      const O = observador, q = O.S.q, shield = O.S.shield
      if (!obs) {
        obs = { wind: loopNoise(520, 'bandpass', 0.6, 0, 0, true), leaves: loopNoise(5200, 'highpass', 0.7, 0, 0, true), cr: [0, 1, 2, 3, 4].map((i) => ({ pan: (i / 2 - 1) * 0.8, t: R(), f: 4300 + R() * 700 })),
          crick: 1, owlT: 4, callT: 8, presT: 2, wasQ: q, wasSh: shield, gal: 0, pantT: 0, growlT: 0, foxT: 25 }
      }
      // vento nas árvores e folhas
      const gust = 0.5 + 0.5 * Math.sin(t * 0.23) * Math.sin(t * 0.61 + 2)
      obs.wind.set(0.25 + 0.3 * gust, 0.4); obs.leaves.set(0.006 + 0.014 * gust, 0.4)
      // grilos: calam quando ele vem (o silêncio é o aviso)
      obs.crick = damp(obs.crick, q > 0.1 || dying ? 0 : 1, q > 0.1 || dying ? 6 : 0.4, dt)
      if (obs.crick > 0.05) obs.cr.forEach((c) => {
        c.t -= dt
        if (c.t <= 0) { const d = bus(0.4, false, c.pan); for (let k = 0; k < 3; k++) tone({ t: t + k * 0.032, f: c.f, dur: 0.012, a: 0.002, r: 0.01, gain: 0.012 * obs.crick, dest: d }); c.t = 0.55 + R() * 0.35 }
      })
      if (dying) return
      obs.owlT -= dt; if (obs.owlT <= 0 && q < 0.1) { owl(t); obs.owlT = 10 + R() * 12 }
      obs.foxT -= dt; if (obs.foxT <= 0 && q < 0.1) { const Dd = bus(0.9, false, (R() < 0.5 ? -1 : 1) * 0.7); voice({ t, dur: 0.75, a: 0.05, r: 0.3, f: 620, f2: 1050, f3: 760, glide: 0.25, vowel: 'a', vowel2: 'e', gain: 0.035, grit: 4, vib: [8, 30], air: 0.6, dest: Dd }); rasp(t, 0.55, 1150, 800, 0.012, Dd, 17); obs.foxT = 30 + R() * 30 } // ao longe, um grito quase humano
      if (q < 0.5) {
        // observando: bufa, raspa a galhada, desloca o peso, quebra galhos; de vez em quando o chamado
        obs.presT -= dt
        if (obs.presT <= 0) {
          const k = R()
          if (k < 0.3) snort(t, 0.12); else if (k < 0.5) antlerScrape(t, 0.06); else if (k < 0.7) { hoof(t, 0.1); hoof(t + 0.4, 0.08) } else if (k < 0.85) branch(t, 0.1); else growl(t, 1.2, 0.05)
          obs.presT = 2.5 + R() * 3.5
        }
        obs.callT -= dt; if (obs.callT <= 0) { bugle(t, 0.07); obs.callT = 16 + R() * 12 }
        gbT -= dt; if (gbT <= 0) { creatureBreath(t, { gain: 0.09, k: 0.55 }); gbT = 3.2 + R() * 1.5 } // o peito enorme respirando no escuro
        // a lanterna nele: bufa assustado, um guincho curto e recua batendo os cascos
        if (shield > 0.5 && obs.wasSh <= 0.5) { snort(t, 0.25); bugle(t + 0.12, 0.08, null, 0.5, 1.3); [0.2, 0.42, 0.6].forEach((d) => hoof(t + d, 0.18)) }
      } else {
        // o bote: galope de quatro tempos, ofego, rosnado e berros
        const cyc = O.S.ph / (2 * Math.PI), fr = cyc - Math.floor(cyc), gi = Math.floor(cyc) * 4 + [0, 0.1, 0.45, 0.56].filter((x) => fr >= x).length
        if (gi !== obs.gal) { hoof(t, 0.38); obs.gal = gi }
        obs.pantT -= dt; if (obs.pantT <= 0) { pant(t, 0.12); obs.pantT = 0.3 }
        obs.growlT -= dt; if (obs.growlT <= 0) { if (R() < 0.4) bugle(t, 0.09, null, 1.1, 1.05); else { growl(t, 1, 0.11); if (R() < 0.5) demon(t + 0.1, 0.8, 0.08, null, 44, 'a') } obs.growlT = 1.8 + R() * 1.5 }
      }
      if (q > 0.5 && obs.wasQ <= 0.5) { bugle(t, 0.12, null, 1.3, 1); snort(t, 0.22); demon(t + 0.2, 1.1, 0.1, null, 42, 'a'); tone({ t, f: 28, f2: 42, dur: 1.2, a: 0.3, r: 0.6, gain: 0.35, lp: 90 }) } // o bote começa com o berro e um tremor grave
      obs.wasQ = q; obs.wasSh = shield
    }
    function obsStop() { if (!obs) return; obs.wind.stop(); obs.leaves.stop(); obs = null }

    // ---------- O Reflexo: o vidro canta baixo, o seu eco chega atrasado, o sangue sussurra ----------
    function glassTap(t, gain = 0.1, dest, muffled) { // vidro: parciais agudos e um toque seco
      ;[[2350, 0.5], [3870, 0.3], [6110, 0.15]].forEach(([f, d]) => tone({ t, f: muffled ? f * 0.6 : f, dur: 0.003, a: 0.001, r: d, gain: gain * (muffled ? 0.4 : 1), dest }))
      thump(t, 140, gain * 0.8, dest)
    }
    const bloop = (t, gain = 0.1, dest) => tone({ t, f: 760 + R() * 200, f2: 170, dur: 0.16, a: 0.004, r: 0.08, gain, lp: 1400, dest }) // líquido
    function shatter(t, gain = 0.3, dest) { // o espelho estoura
      noise({ t, dur: 0.12, a: 0.001, r: 0.5, type: 'highpass', f: 2500, gain: gain * 0.8, dest })
      tone({ t, f: 80, f2: 30, dur: 0.3, r: 0.4, gain: gain * 1.6, lp: 220, dest })
      for (let i = 0; i < 40; i++) tone({ t: t + R() * R() * 0.7, f: 1800 + R() * 6500, dur: 0.002, a: 0.0005, r: 0.05 + R() * 0.3, gain: gain * 0.25 * (0.3 + R()), dest })
    }
    const tinkle = (t, dur, gain = 0.05, dest) => { for (let i = 0; i < 26; i++) tone({ t: t + R() * dur, f: 2500 + R() * 5000, dur: 0.002, a: 0.0005, r: 0.04 + R() * 0.15, gain: gain * (0.3 + R()), dest }) } // cacos caindo no chão
    function whisper(t, dur, gain = 0.03, dest, pan = 0) { // sussurro: o ar passa pelas vogais e pelos "s"; parece uma frase que quase dá para entender
      const d = dest || bus(0.7, false, pan)
      const s = ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = true
      const g = ctx.createGain(); g.gain.value = 0.0001; g.connect(d)
      const fs = formants(s, g, 'e', 1.05), V = ['a', 'e', 'i', 'o', 'u']
      let u = t
      while (u < t + dur) {
        const l = 0.07 + R() * 0.13
        setVowel(fs, V[R() * 5 | 0], u, 0.02); g.gain.setTargetAtTime(gain * 3 * (0.6 + R() * 0.6), u, 0.015); g.gain.setTargetAtTime(0.0001, u + l * 0.8, 0.02)
        if (R() < 0.35) noise({ t: u + l * 0.7, dur: 0.05 + R() * 0.06, a: 0.01, r: 0.03, type: 'highpass', f: 4800, gain: gain * 0.7, dest: d }) // "s"
        u += l + (R() < 0.25 ? 0.12 + R() * 0.15 : 0.02)
      }
      s.start(t, R()); s.stop(u + 0.3)
    }
    function reflTick(t, dt, dying) {
      if (!refl) {
        const hum = ctx.createGain(); hum.gain.value = 0.0001; hum.connect(bus(0.6))
        const os = [523.3, 526.1, 1046.5, 1570.8].map((f, i) => { const o = ctx.createOscillator(); o.frequency.value = f; const g = ctx.createGain(); g.gain.value = [1, 0.8, 0.25, 0.08][i]; o.connect(g); g.connect(hum); o.start(); return o })
        refl = { hum, os, breathT: 2, dripT: 1, whispT: 3, prevS: -1 }
      }
      const st = reflexo.st, bleeding = st.bleed > 0.3, broken = st.broken
      // o vidro "canta" baixinho (como dedo molhado na borda de uma taça); sangrando, desce e fica sujo
      refl.hum.gain.setTargetAtTime(broken ? 0.0001 : (bleeding ? 0.02 : 0.012), t, 0.5)
      refl.os[0].frequency.setTargetAtTime(bleeding ? 466 : 523.3, t, 1.5); refl.os[1].frequency.setTargetAtTime(bleeding ? 470.5 : 526.1, t, 1.5)
      if (dying || broken) return
      // a sua respiração... e a dele, do outro lado do vidro, meio segundo depois
      refl.breathT -= dt
      if (refl.breathT <= 0 && st.t < 0) {
        const ear = inner(); noise({ t, dur: 0.6, a: 0.25, r: 0.3, type: 'lowpass', f: 700, gain: 0.05, dest: ear }); noise({ t: t + 0.9, dur: 0.8, a: 0.1, r: 0.4, type: 'lowpass', f: 500, gain: 0.045, dest: ear })
        const glassD = ctx.createBiquadFilter(); glassD.type = 'lowpass'; glassD.frequency.value = 1100; glassD.connect(bus(0.8))
        noise({ t: t + 0.45, dur: 0.6, a: 0.25, r: 0.3, type: 'bandpass', f: 600, q: 0.8, gain: 0.035, dest: glassD }); noise({ t: t + 1.35, dur: 0.8, a: 0.1, r: 0.4, type: 'bandpass', f: 450, q: 0.8, gain: 0.03, dest: glassD })
        refl.breathT = 3.6 + R() * 1.5
      }
      // sangrando: gotas, sussurros dos dois lados, e um pavor grave
      if (bleeding && st.t < 0) {
        refl.dripT -= dt; if (refl.dripT <= 0) { drip(t, 0.045); refl.dripT = 0.4 + R() * 0.9 }
        refl.whispT -= dt; if (refl.whispT <= 0) {
          whisper(t, 0.8 + R() * 1.2, 0.035, null, (R() - 0.5) * 1.6); if (R() < 0.4) tone({ t, f: 41, f2: 39, dur: 2, a: 0.8, r: 1, gain: 0.25, lp: 90 })
          if (R() < 0.35) noise({ t: t + 1.6, dur: 0.9, a: 0.86, r: 0.008, f: 900, f2: 2200, q: 1.5, gain: 0.07 }) // um fôlego ao contrário: cresce e corta seco
          if (R() < 0.3) { const gl = ctx.createBiquadFilter(); gl.type = 'lowpass'; gl.frequency.value = 700; gl.connect(bus(0.8)); demon(t + 0.5, 1.5, 0.07, gl, 46, 'u') } // atrás do vidro, uma coisa muito maior que você geme
          refl.whispT = 3 + R() * 4
        }
      }
      // o susto (modo Susto): segue o tempo do próprio reflexo
      const T = st.t, P = refl.prevS
      const at = (x) => P < x && T >= x
      if (T >= 0) {
        if (at(0.02)) { clicks({ t, n: 24, i0: 0.03, i1: 0.012, f: 1900, q: 10, gain: 0.07 }); tone({ t, f: 32, f2: 55, dur: 0.7, a: 0.4, gain: 0.35, lp: 110 }) } // o vidro range; algo cresce
        if (at(0.3)) { crack(t, 0.35); rasp(t + 0.05, 0.5, 70, 52, 0.08, null, 17); voice({ t: t + 0.05, dur: 0.6, f: 90, f2: 45, vowel: 'a', vowel2: 'o', sc: 0.7, gain: 0.14, grit: 6, fry: 0.8, fryHz: 26, ring: [60, 0.4], air: 0.4, dest: bus(0.5) }) } // a mandíbula despenca, e sai um gemido de dentro do vidro
        if (at(0.48)) { glassTap(t, 0.35); glassTap(t + 0.11, 0.4) } // as mãos batem no vidro
        if (at(0.8)) { shatter(t, 0.32); demon(t + 0.03, 0.6, 0.12, bus(0.5), 55, 'a'); scream(t + 0.02, 0.5, 300, 520, 0.1, bus(0.5)); voice({ t: t + 0.02, dur: 0.55, f: 420, f2: 780, f3: 520, glide: 0.12, vowel: 'a', vowel2: 'e', gain: 0.18, grit: 7, ring: [170, 0.45], vib: [10, 28], air: 0.6, layers: [[1, 0, 1], [0.5, 0, 0.5], [1.006, 16, 0.6]], dest: bus(0.5) }); tone({ t, f: 30, dur: 0.5, gain: 0.5, lp: 80 }) }
        if (at(1.3)) { noise({ t, dur: 0.07, a: 0.001, r: 0.6, type: 'lowpass', f: 5000, gain: 0.5 }); tone({ t, f: 50, f2: 25, dur: 0.6, r: 0.6, gain: 0.8, lp: 150 }) } // o clarão
        if (at(1.42)) tinkle(t, 1.2, 0.06)
      }
      refl.prevS = T
    }
    function reflStop() { if (!refl) return; refl.hum.gain.setTargetAtTime(0.0001, now(), 0.05); refl.os.forEach((o) => o.stop(now() + 0.4)); refl = null }

    // ---------- O Amigo: rugido de urso, grunhidos, passos mancando, zíper, pernas de aranha, a porta ----------
    function duckChase(t, dur, to = 0.35) { if (MUS.duck) { const g = MUS.duck.gain; g.cancelScheduledValues(t); g.setTargetAtTime(Math.max(0.45, to), t, 0.05); g.setTargetAtTime(1, t + dur, 0.4) } if (chaseL && chaseL.dk) { const g = chaseL.dk.gain; g.cancelScheduledValues(t); g.setTargetAtTime(to, t, 0.05); g.setTargetAtTime(1, t + dur, 0.4) } } // a trilha abaixa para o rugido passar por cima
    function bearRoar(t, gain = 0.2, dest, dur = 1.7) { // rugido de urso: puxa o ar fundo, solta subindo, segura tremendo e desaba em rosnados
      const Dd = dest || bus(0.6)
      if (!dest) duckChase(t, dur + 0.4)
      noise({ t: t - 0.32, dur: 0.3, a: 0.2, r: 0.03, f: 380, f2: 900, q: 1.6, gain: gain * 0.6, dest: Dd }) // a puxada de ar, enorme
      growl(t, dur, gain * 0.9, Dd)
      rasp(t + 0.05, dur * 0.85, 120, 82, gain * 0.7, Dd, 21)
      rasp(t + 0.05, dur * 0.8, 240, 165, gain * 0.2, Dd, 23)
      noise({ t, dur, a: 0.1, r: 0.45, f: 650, f2: 380, q: 1.1, gain: gain * 0.6, dest: Dd }) // o ar rasgando a garganta
      tone({ t, f: 38, f2: 28, dur, a: 0.12, r: 0.5, gain: gain * 1.3, lp: 100, dest: Dd }) // o chão vibra
      voice({ t: t + 0.03, dur: dur * 0.9, a: 0.07, r: 0.35, f: 82, f2: 118, f3: 62, glide: dur * 0.3, vowel: 'o', vowel2: 'a', sc: 0.5, gain: gain * 1.1, grit: 9, fry: 0.85, fryHz: 21, vib: [5.5, 6], layers: [[1, 0, 1], [0.5, 0, 0.9], [1.01, 15, 0.55], [1.5, -8, 0.2]], air: 0.5, dest: Dd }) // a garganta do urso
      demon(t + 0.1, dur * 0.75, gain * 0.5, Dd, 46, 'a')
      voice({ t: t + 0.1, dur: dur * 0.6, a: 0.12, r: 0.2, f: 560, f2: 820, f3: 600, glide: dur * 0.25, vowel: 'a', vowel2: 'e', sc: 1.25, gain: gain * 0.14, grit: 4, vib: [8, 30], air: 0.4, dest: Dd }) // e, lá dentro, uma criança gritando junto
      for (let k = 0; k < 2; k++) chuff(t + dur + 0.15 + k * 0.35, gain * 0.7, Dd) // desaba em bufos
    }
    function grunt(t, gain = 0.1, dest, n) { // grunhido: bufos curtos e fundos de uma garganta enorme, em sequência irregular, com baba
      const Dd = dest || bus(0.5); n = n || 2 + (R() * 3 | 0); let u = t
      for (let i = 0; i < n; i++) {
        const d = 0.14 + R() * 0.16, f = 58 + R() * 24
        noise({ t: u, dur: d, a: 0.012, r: 0.08, f: 420 + R() * 200, f2: 250, q: 1.3, gain: gain * 0.9, dest: Dd }) // o ar saindo pelo focinho
        voice({ t: u, dur: d, a: 0.012, r: 0.07, f: f * 1.2, f2: f, vowel: R() < 0.5 ? 'o' : 'a', vowel2: 'u', sc: 0.5, gain: gain * 1.15, grit: 8, fry: 0.85, fryHz: 19 + R() * 8, layers: [[1, 0, 1], [0.5, 0, 0.8]], air: 0.4, dest: Dd })
        tone({ t: u, f: f * 0.5, f2: f * 0.4, dur: d, a: 0.01, r: 0.1, gain: gain * 0.9, lp: 90, dest: Dd }) // o peito
        u += d + 0.06 + R() * 0.14
      }
      if (R() < 0.45) clicks({ t: u - 0.1, n: 5 + (R() * 6 | 0), i0: 0.02, i1: 0.03, f: 240 + R() * 160, q: 2.2, gain: gain * 0.8, dest: Dd }) // baba na garganta
    }
    function sob(t, gain = 0.1, dest) { // (não usado mais pelo Amigo: o choro soava amigável demais) // choro grave: as puxadas de ar engasgadas e um lamento fundo que treme e quebra; a voz é de criança, mas a garganta é de bicho grande
      const Dd = dest || bus(0.55)
      for (let k = 0; k < 3; k++) { noise({ t: t + k * 0.14, dur: 0.09, a: 0.01, r: 0.05, f: 700, f2: 1300, q: 2.2, gain: gain, dest: Dd }); voice({ t: t + k * 0.14 + 0.01, dur: 0.07, a: 0.01, r: 0.04, f: 300, f2: 360, vowel: 'u', sc: 1.0, gain: gain * 0.5, grit: 2.5, fry: 0.4, fryHz: 30, air: 1, dest: Dd }) }
      const t2 = t + 0.45, d = 1.0 + R() * 0.45, f0 = 235 + R() * 35
      voice({ t: t2, dur: d, a: 0.08, r: 0.35, f: f0, f2: f0 * 1.12, f3: f0 * 0.66, glide: d * 0.25, vowel: 'a', vowel2: 'u', sc: 1.05, gain: gain * 1.4, grit: 3, vib: [6.5, 9], wob: 0.08, air: 0.55, dest: Dd }) // o lamento
      voice({ t: t2 + 0.04, dur: d, a: 0.1, r: 0.35, f: f0 * 0.5, f2: f0 * 0.55, f3: f0 * 0.33, glide: d * 0.25, vowel: 'o', vowel2: 'u', sc: 0.6, gain: gain * 0.95, grit: 6, fry: 0.55, fryHz: 26, ring: [48, 0.25], dest: Dd }) // a oitava de baixo, de dentro do urso
      demon(t2 + 0.1, d * 0.85, gain * 0.35, Dd, 44, 'u') // e o peito enorme gemendo por baixo
      if (R() < 0.65) voice({ t: t2 + d * 0.6, dur: d * 0.4, f: f0 * 0.8, f2: f0 * 0.55, vowel: 'u', sc: 1.0, gain: gain * 0.7, grit: 4, fry: 0.75, fryHz: 28, dest: Dd }) // a voz quebra
    }
    function amigoEvent(kind) {
      if (!ctx || ui.snd !== 'on' || isCut || ctx.state !== 'running') return
      const t = now()
      if (kind === 'step') { thump(t, 50, 0.45); noise({ t, dur: 0.08, type: 'lowpass', f: 900, gain: 0.12 }); if (R() < 0.3) creak(t + 0.03, 0.06) } // pé descalço pesado
      if (kind === 'wallNoise') { const fd = bus(0.5, false, 0, true); shatter(t, 0.3, fd); thump(t + 0.02, 120, 0.3, fd) } // o barulho do seu lado da parede (não sai dele)
      if (kind === 'grunt') grunt(t, 0.12, null, 2)
      if (kind === 'inhale') noise({ t, dur: 0.55, a: 0.35, r: 0.05, f: 380, f2: 950, q: 1.6, gain: 0.2 }) // puxa o ar fundo antes de investir
      if (kind === 'wallStone' || kind === 'wallWood') { // o choque: a parede cede de uma vez
        const st = kind === 'wallStone', fd = bus(0.7, false, 0, true)
        thump(t, st ? 34 : 48, 1.0, fd); tone({ t, f: st ? 42 : 60, f2: 22, dur: 0.7, r: 0.8, gain: 0.7, lp: 140, dest: fd })
        if (st) { crack(t, 0.5, fd); clicks({ t: t + 0.02, n: 70, i0: 0.004, i1: 0.03, f: 900, q: 2.5, gain: 0.32, dest: fd }); noise({ t, dur: 1.6, a: 0.01, r: 0.9, type: 'lowpass', f: 900, gain: 0.35, dest: fd }); for (let k = 0; k < 9; k++) thump(t + 0.35 + R() * 1.1, 70 + R() * 50, 0.25 + R() * 0.2, fd) } // pedras rolando no chão
        else { splinter(t, 'cadeira', 0.6, fd); crack(t + 0.03, 0.45, fd); clicks({ t: t + 0.05, n: 40, i0: 0.006, i1: 0.035, f: 1400, q: 2, gain: 0.25, dest: fd }); for (let k = 0; k < 7; k++) thump(t + 0.3 + R() * 0.9, 95 + R() * 40, 0.2 + R() * 0.15, fd) } // tábuas caindo
      }
      if (kind === 'lurch') { thump(t + 0.12, 42, 0.65); creak(t + 0.1, 0.1); chuff(t + 0.18, 0.13); noise({ t, dur: 0.3, a: 0.05, r: 0.1, f: 500, f2: 260, q: 0.9, gain: 0.14 }) } // a perna cede: o peso todo no chão
      if (kind === 'drag') noise({ t, dur: 0.45, a: 0.08, r: 0.15, f: 600, f2: 300, q: 0.9, gain: 0.12 }) // a perna queimada arrastada
      if (kind === 'roar') bearRoar(t + 0.35, 0.34) // primeiro a puxada de ar (o corpo estufa), depois o rugido
      if (kind === 'grumble') { growl(t, 1.5, 0.08); demon(t + 0.2, 1.1, 0.05, null, 44, 'o'); chuff(t + 1.6, 0.08) }
      if (kind === 'zip') { clicks({ t, n: 34, i0: 0.016, i1: 0.004, f: 2800, q: 4, gain: 0.12 }); noise({ t, dur: 0.4, a: 0.05, f: 3500, q: 1, gain: 0.04 }) }
      if (kind === 'skitter') clicks({ t, n: 2 + (R() * 3 | 0), i0: 0.02, i1: 0.015, f: 2200 + R() * 1500, q: 6, gain: 0.08 })
      if (kind === 'tap') { clicks({ t, n: 1 + (R() * 2 | 0), i0: 0.012, i1: 0.012, f: 1800 + R() * 1400, q: 5, gain: 0.16 }); thump(t, 90, 0.08) } // ponta de quitina no assoalho
      if (kind === 'legout') { crack(t, 0.3); squelch(t + 0.02, 0.14, null, 4); tone({ t, f: 140, f2: 60, dur: 0.12, gain: 0.12, lp: 400 }) } // a perna rasga para fora
      if (kind === 'bang') { thump(t, 46, 0.6); clicks({ t, n: 8, i0: 0.01, i1: 0.03, f: 420, q: 5, gain: 0.25 }); creak(t + 0.05, 0.08) }
      if (kind === 'smash') { splinter(t, 'cadeira', 0.4); tone({ t, f: 55, f2: 25, dur: 0.4, r: 0.5, gain: 0.5, lp: 160 }); bearRoar(t + 0.15, 0.3, null, 1.3) }
    }
    // ---------- O Espectral e o Glutão: chiado de dentes, o guincho do bote, o estouro molhado; o gemido, a pancada, a sucção ----------
    function espEvent(kind) {
      if (!ctx || ui.snd !== 'on' || isCut || ctx.state !== 'running') return
      const t = now(), D = bus(0.45)
      if (kind === 'hiss') { noise({ t, dur: 0.9 + R() * 0.5, a: 0.2, r: 0.4, f: 3200 + R() * 1500, q: 2.5, gain: 0.035, dest: D }); clicks({ t: t + 0.2, n: 6, i0: 0.05, i1: 0.03, f: 1900, q: 6, gain: 0.03, dest: D }) } // chiado, com os dentes batendo
      if (kind === 'shriek') { scream(t, 0.55, 760, 1350, 0.11, D); noise({ t, dur: 0.55, a: 0.05, r: 0.2, f: 4200, f2: 2600, q: 1.4, gain: 0.07, dest: D }); clicks({ t, n: 10, i0: 0.03, i1: 0.02, f: 2400, q: 7, gain: 0.07, dest: D }) } // o aviso do bote
      if (kind === 'whip') { noise({ t, dur: 0.22, a: 0.01, r: 0.08, f: 1400, f2: 5200, q: 0.9, gain: 0.12, dest: D }); clicks({ t: t + 0.05, n: 14, i0: 0.01, i1: 0.004, f: 2600, q: 5, gain: 0.06, dest: D }) } // a cauda chicoteia: as vértebras estalam
      if (kind === 'bite') { clicks({ t, n: 2, i0: 0.03, i1: 0.03, f: 2100, q: 5, gain: 0.3, dest: D }); crack(t, 0.18, D); thump(t, 160, 0.12, D) }
      if (kind === 'burst') { noise({ t, dur: 0.5, a: 0.002, r: 0.5, type: 'lowpass', f: 1800, gain: 0.35, dest: D }); squelch(t + 0.02, 0.2, D, 9); tone({ t, f: 520, f2: 90, dur: 0.45, gain: 0.12, lp: 1400, dest: D }); clicks({ t: t + 0.08, n: 30, i0: 0.01, i1: 0.04, f: 2000, q: 5, gain: 0.1, dest: D }); scream(t, 0.3, 1100, 600, 0.05, D) } // estoura: um jorro molhado e os ossos chovendo
      if (kind === 'groan') { demon(t, 1.6, 0.16, D, 38, 'o'); growl(t + 0.1, 1.3, 0.07, D); noise({ t, dur: 1.4, a: 0.3, r: 0.4, f: 500, f2: 260, q: 0.8, gain: 0.05, dest: D }) }
      if (kind === 'raise') { demon(t, 1.0, 0.2, D, 44, 'a'); growl(t, 1.0, 0.1, D); tone({ t, f: 60, f2: 110, dur: 1.0, gain: 0.12, lp: 300, dest: D }) } // ergue os braços: o núcleo zumbe subindo
      if (kind === 'slam') { thump(t, 34, 1.0, D); tone({ t, f: 40, f2: 22, dur: 0.8, r: 0.8, gain: 0.7, lp: 140, dest: D }); crack(t, 0.45, D); noise({ t, dur: 1.2, a: 0.005, r: 0.8, type: 'lowpass', f: 800, gain: 0.3, dest: D }); clicks({ t: t + 0.05, n: 40, i0: 0.006, i1: 0.04, f: 900, q: 3, gain: 0.15, dest: D }) }
      if (kind === 'charge') { noise({ t, dur: 0.45, a: 0.05, r: 0.15, f: 600, f2: 2400, q: 0.8, gain: 0.18, dest: D }); demon(t, 0.5, 0.14, D, 50, 'a'); chuff(t + 0.4, 0.14, D) }
      if (kind === 'suck') { noise({ t, dur: 4, a: 3.2, r: 0.2, f: 260, f2: 2600, q: 1.2, gain: 0.22, dest: D }); tone({ t, f: 55, f2: 140, dur: 4, a: 3.0, r: 0.2, gain: 0.18, lp: 260, dest: D }); for (let k = 0; k < 4; k++) scream(t + 0.4 + k * 0.9, 0.5, 900 + k * 120, 1400 + k * 150, 0.05 + k * 0.012, D) } // o fluxo e, dentro dele, o pequeno gritando
      if (kind === 'gulp') { tone({ t, f: 130, f2: 38, dur: 0.35, gain: 0.4, lp: 300, dest: D }); squelch(t, 0.25, D, 8); thump(t + 0.05, 55, 0.6, D); chuff(t + 0.5, 0.12, D); tone({ t: t + 0.1, f: 900, f2: 1800, dur: 0.5, gain: 0.06, lp: 3000, dest: D }) }
      if (kind === 'swell') { demon(t, 1.1, 0.2, D, 40, 'u'); tone({ t, f: 48, f2: 96, dur: 1.1, a: 0.6, gain: 0.25, lp: 220, dest: D }); noise({ t, dur: 1.0, a: 0.8, r: 0.05, f: 300, f2: 1400, q: 1.2, gain: 0.12, dest: D }) } // o núcleo incha
      if (kind === 'spit') { tone({ t, f: 40, f2: 150, dur: 0.35, gain: 0.4, lp: 300, dest: D }); squelch(t, 0.25, D, 8); noise({ t, dur: 0.4, a: 0.01, r: 0.2, f: 900, f2: 3000, q: 1, gain: 0.18, dest: D }); scream(t + 0.15, 0.5, 900, 1400, 0.08, D) } // cospe uma alma, que sai gritando
      if (kind === 'explode') { thump(t, 30, 1.2, D); tone({ t, f: 36, f2: 18, dur: 1.4, r: 1.0, gain: 0.8, lp: 140, dest: D }); noise({ t, dur: 1.6, a: 0.002, r: 1.0, type: 'lowpass', f: 1400, gain: 0.45, dest: D }); squelch(t + 0.02, 0.3, D, 12); clicks({ t: t + 0.05, n: 70, i0: 0.006, i1: 0.05, f: 1700, q: 4, gain: 0.18, dest: D }); for (let k = 0; k < 3; k++) scream(t + 0.15 + k * 0.18, 0.7, 800 + k * 150, 1300 + k * 120, 0.08, D) } // estoura: ossos chovendo e as almas fugindo aos gritos
      if (kind === 'collapse') { demon(t, 1.8, 0.18, D, 36, 'u'); clicks({ t: t + 0.4, n: 60, i0: 0.012, i1: 0.05, f: 1500, q: 4, gain: 0.16, dest: D }); for (let k = 0; k < 6; k++) thump(t + 0.5 + R() * 1.2, 90 + R() * 60, 0.25, D); noise({ t: t + 1.6, dur: 0.6, a: 0.002, r: 0.6, type: 'lowpass', f: 1500, gain: 0.3, dest: D }); squelch(t + 1.6, 0.2, D, 8) }
    }
    function amigoTick(t, dt, dying) {
      const Am = amigo
      if (!Am.sfx) Am.sfx = { sobT: 1, whimT: 8 }
      if (dying) return
      if (Am.S.q > 0.5) {
        Am.sfx.sobT -= dt; if (Am.sfx.sobT <= 0 && Am.S.roar <= 0) { grunt(t, 0.14); Am.sfx.sobT = 1.4 + R() * 1.0; gbT = 1.0 } // grunhe enquanto caça
        gbT -= dt; if (gbT <= 0 && Am.S.roar <= 0) { creatureBreath(t, { gain: 0.12, k: 0.6, chase: true, wet: true }); gbT = 0.8 + R() * 0.3 } // e entre um grunhido e outro, respira como urso
      } else {
        Am.sfx.whimT -= dt; if (Am.sfx.whimT <= 0) { grunt(t, 0.05, null, 1 + (R() * 2 | 0)); Am.sfx.whimT = 6 + R() * 6 } // vagando: um grunhido baixo de vez em quando
        gbT -= dt; if (gbT <= 0) { creatureBreath(t, { gain: 0.045, k: 0.6 }); gbT = 3.5 + R() * 2 }
      }
    }

    // ---------- passos ----------
    function step(kind, fast) {
      if (!ctx || ui.snd !== 'on') return
      const t = now()
      if (kind === 'mae') { // pés descalços e a barra do vestido arrastando
        thump(t, fast ? 95 : 75, fast ? 0.42 : 0.12)
        if (fast) tone({ t, f: 48, f2: 34, dur: 0.12, r: 0.25, gain: 0.35, lp: 120, wet: 0.5 }) // o assoalho inteiro sente
        noise({ t, dur: fast ? 0.16 : 0.3, a: fast ? 0.02 : 0.05, r: 0.12, f: fast ? 1800 : 2600, q: 0.8, gain: fast ? 0.1 : 0.03, wet: 0.4 })
        if (R() < (fast ? 0.15 : 0.08)) creak(t + 0.02, 0.05) // o assoalho cede
      }
      if (kind === 'desc') { thump(t, fast ? 85 : 70, 0.3); squelch(t, 0.07, null, 2) } // pé sem pele no assoalho: baque molhado
      if (kind === 'sombra') { talon(t, fast ? 0.22 : 0.09); if (fast) tone({ t, f: 50, f2: 35, dur: 0.1, r: 0.2, gain: 0.25, lp: 120, wet: 0.5 }) }
    }

    // ---------- pausas da patrulha ----------
    function idleEvent(kind) {
      if (!ctx || ui.snd !== 'on' || isCut || ctx.state !== 'running') return
      const t = now()
      if (kind === 'maeInhale') { const d = maeBus(); noise({ t, dur: 1.1, a: 0.6, r: 0.25, f: 650, f2: 1500, q: 2, gain: 0.09, dest: d }); voice({ t: t + 1.05, dur: 0.5, f: 95, f2: 80, vowel: 'm', gain: 0.05, fry: 0.5, fryHz: 30, air: 0.5, dest: d }) } // puxa o ar devagar pelo nariz e solta num "hm"
      if (kind === 'maeFingers') { const d = maeBus(); clicks({ t, n: 8 + (R() * 6 | 0), i0: 0.05, i1: 0.08, f: 2400, q: 4, gain: 0.09, dest: d }); clicks({ t: t + 0.02, n: 6, i0: 0.07, i1: 0.1, f: 900, q: 3, gain: 0.05, dest: d }) } // os dedos estalando no ar
      if (kind === 'maeSnap') { const d = maeBus(); crack(t, 0.42, d); crack(t + 0.05, 0.3, d); clicks({ t: t + 0.08, n: 14, i0: 0.008, i1: 0.02, f: 1500, q: 2.5, gain: 0.12, dest: d }); voice({ t: t + 0.12, dur: 0.35, f: 70, f2: 52, vowel: 'a', gain: 0.1, grit: 3, fry: 0.6, fryHz: 32, air: 0.5, dest: d }) } // o pescoço estala em vários tempos e ela solta o ar rouco
      if (kind === 'sombraClack') { clicks({ t, n: 2, i0: 0.05, i1: 0.05, f: 1700, q: 8, gain: 0.14 }); tone({ t, f: 900, f2: 600, dur: 0.02, gain: 0.03 }) } // o bico batendo
      if (kind === 'sombraTurn') { glitch(t, 0.15, 0.08); clicks({ t, n: 10, i0: 0.012, i1: 0.03, f: 900, q: 4, gain: 0.12 }); croak(t + 0.25, 0.06) } // o pescoço gira até as costas
      if (kind === 'garotaCrank') clicks({ t, n: 4, i0: 0.05, i1: 0.04, f: 2600, q: 6, gain: 0.08 }) // a catraca da corda
      if (kind === 'descStudy') chatter(t, 0.05)
      if (kind === 'descMimic') { const m = MAT[desc.st.kind] || MAT.quadro; clicks({ t, n: 16, i0: 0.02, i1: 0.05, f: m.f, q: m.q, gain: 0.08 }); chuckle(t + 0.5, 0.06) } // tenta virar o objeto: o corpo range como ele
      if (kind === 'amigoSniff') { for (let k = 0; k < 3; k++) noise({ t: t + k * 0.11, dur: 0.07, a: 0.01, r: 0.04, f: 900, f2: 1500, q: 1.5, gain: 0.12 }); snort(t + 0.4, 0.06) } // fareja: três puxadas e um bufo
      if (kind === 'amigoRock') grunt(t, 0.05, null, 3) // se embala, grunhindo baixo
      if (kind === 'amigoCreak') creak(t, 0.05) // o assoalho no balanço
    }

    // ---------- as vozes da Intro (até a dublagem): cada um fala com um som próprio, em sílabas; a central chega pelo rádio, com chiado ----------
    const VOZ = { matheus: { f: 118, k: 1 }, lara: { f: 215, k: 1.16 }, nicolas: { f: 88, k: 0.9 }, central: { f: 150, k: 1.05, radio: true } }
    const VOGAL = [[730, 1090], [530, 1840], [400, 2000], [570, 840], [300, 870], [660, 1700]]
    function voiceEvent(who, n) {
      if (!ctx || ui.snd !== 'on' || ctx.state !== 'running') return 0
      const V = VOZ[who] || VOZ.matheus, t0 = now() + 0.03
      let dest = bus(0.12, false, 0, true)
      if (V.radio) { const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 420; const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2600; const sh = ctx.createWaveShaper(); const c = new Float32Array(256); for (let i = 0; i < 256; i++) { const x = i / 128 - 1; c[i] = Math.tanh(x * 3) } sh.curve = c; hp.connect(lp); lp.connect(sh); sh.connect(dest); dest = hp } // o rádio: banda estreita e um pouco estourado
      let t = t0
      for (let i = 0; i < n; i++) {
        const d = 0.065 + R() * 0.07, last = i === n - 1, f = V.f * (1 + (R() - 0.5) * 0.16) * (last ? 0.84 : 1) * (1 + 0.06 * Math.sin(i * 0.9))
        const osc = ctx.createOscillator(); osc.type = 'sawtooth'; osc.frequency.setValueAtTime(f, t); osc.frequency.linearRampToValueAtTime(f * (0.9 + R() * 0.14), t + d)
        const F = VOGAL[(R() * VOGAL.length) | 0], g = vca(dest, t, 0.012, 0.5, d * 0.55, 0.05)
        for (const [ff, q] of [[F[0] * V.k, 5], [F[1] * V.k, 7]]) { const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = ff; bp.Q.value = q; osc.connect(bp); bp.connect(g) }
        osc.start(t); osc.stop(t + d + 0.1)
        t += d + 0.022 + (R() < 0.14 ? 0.1 : 0)
      }
      if (V.radio) { // o chiado do rádio e os estalos de abrir e fechar
        noise({ t: t0 - 0.12, dur: t - t0 + 0.28, a: 0.03, r: 0.08, f: 3200, q: 0.5, gain: 0.07, dest: bus(0.05, false, 0, true) })
        for (const tc of [t0 - 0.12, t + 0.12]) tone({ t: tc, f: 1800, f2: 900, dur: 0.025, gain: 0.08, type: 'square', dest: bus(0.05, false, 0, true) })
      }
      return t - t0
    }

    // ---------- o agente e as coisas da casa (passos, portas, armas) ----------
    function fpsEvent(kind, a) {
      if (!ctx || ui.snd !== 'on' || isCut || ctx.state !== 'running') return
      const t = now()
      const wood = (g) => clicks({ t, n: 4 + (R() * 4 | 0), i0: 0.008, i1: 0.02, f: 500 + R() * 300, q: 4, gain: g })
      switch (kind) {
        case 'step': if (a) noise({ t, dur: 0.12, a: 0.01, r: 0.06, f: 1800, q: 0.7, gain: 0.05, wet: 0.1 }); else { thump(t, 80, 0.09); noise({ t, dur: 0.05, type: 'lowpass', f: 900, gain: 0.03 }); if (R() < 0.12) creak(t + 0.02, 0.03) } break
        case 'stepR': if (a) noise({ t, dur: 0.14, a: 0.005, r: 0.06, f: 1600, q: 0.7, gain: 0.1, wet: 0.1 }); else { thump(t, 95, 0.22); noise({ t, dur: 0.06, type: 'lowpass', f: 1100, gain: 0.06 }); if (R() < 0.2) creak(t + 0.02, 0.05) } break
        case 'stepC': noise({ t, dur: 0.08, a: 0.02, r: 0.05, f: 1200, q: 0.8, gain: 0.012 }); break
        case 'glassStep': clicks({ t, n: 7, i0: 0.006, i1: 0.012, f: 4200, q: 3, gain: 0.07 }); break
        case 'door': creak(t, 0.07); break
        case 'slide': noise({ t, dur: 0.8, a: 0.06, r: 0.2, type: 'lowpass', f: 480, f2: 340, gain: 0.08 }); noise({ t, dur: 0.75, a: 0.05, r: 0.2, f: 2400, f2: 1800, q: 6, gain: 0.012 }); thump(t + 0.78, 74, 0.22); clicks({ t: t + 0.79, n: 4, i0: 0.01, i1: 0.02, f: 1700, q: 5, gain: 0.07 }); break // a porta de correr: o trilho e a batida no fim
        case 'gradeUp': for (let u = 0; u < 1.4; u += 0.05 + R() * 0.04) clicks({ t: t + u, n: 2, i0: 0.006, i1: 0.01, f: 1300 + R() * 600, q: 5, gain: 0.06 }); noise({ t, dur: 1.4, a: 0.1, r: 0.2, type: 'lowpass', f: 700, gain: 0.05 }); thump(t + 1.45, 90, 0.18); break // a grade enrolando
        case 'doorFast': creak(t, 0.05); noise({ t, dur: 0.18, a: 0.02, f: 600, f2: 1800, q: 0.8, gain: 0.08 }); break
        case 'doorClose': thump(t, 90, 0.2); wood(0.06); break
        case 'bang': thump(t, 62, 0.55); wood(0.22); break
        case 'rattle': for (let i = 0; i < 3; i++) { clicks({ t: t + i * 0.09, n: 3, i0: 0.01, i1: 0.012, f: 1500, q: 6, gain: 0.12 }); thump(t + i * 0.09, 120, 0.06) } break
        case 'pry': creak(t, 0.12); noise({ t, dur: 0.35, a: 0.05, r: 0.08, f: 2600, f2: 2200, q: 7, gain: 0.05 }); break // a madeira cede e o ferro raspa
        case 'pryPop': crack(t, 0.35); splinter(t, 'cadeira', 0.3); thump(t + 0.05, 70, 0.4); break
        case 'lockBreak': crack(t, 0.4); [1, 2.7, 4.1].forEach((h, i) => tone({ t, f: 520 * h, dur: 0.01, r: 0.35 - i * 0.08, gain: 0.08 / (i + 1) })); splinter(t + 0.03, 'cadeira', 0.35); thump(t + 0.08, 60, 0.5); break
        case 'swing': noise({ t, dur: 0.18, a: 0.04, r: 0.05, f: 400, f2: 1400, q: 1.2, gain: 0.08 }); break
        case 'hitWood': thump(t, 85, 0.4); crack(t, 0.12); break
        case 'hitCursed': thump(t, 70, 0.45); crack(t, 0.2); squelch(t + 0.02, 0.08, null, 3); tone({ t, f: 55, f2: 38, dur: 0.3, r: 0.3, gain: 0.25, lp: 140 }); break
        case 'cursedBreak': splinter(t, 'cadeira', 0.45); tone({ t, f: 48, f2: 28, dur: 1.4, a: 0.05, r: 1.0, gain: 0.4, lp: 120 }); whisper(t + 0.2, 1.6, 0.05); break // o fantasma solta um suspiro longe
        case 'pickup': noise({ t, dur: 0.1, a: 0.01, r: 0.06, f: 1400, q: 0.9, gain: 0.05 }); break
        case 'slot': clicks({ t, n: 1, i0: 0.01, i1: 0.01, f: 2400, q: 5, gain: 0.04 }); break
        case 'throw': noise({ t, dur: 0.16 + (a || 0) * 0.1, a: 0.03, r: 0.05, f: 500, f2: 1600 + (a || 0) * 1200, q: 1.1, gain: 0.06 + (a || 0) * 0.06 }); break
        case 'impact': { const v = a.v, k = a.k
          if (k === 'castical') { thump(t, 120, 0.15 + 0.3 * v); [1, 2.4, 3.9].forEach((h, i) => tone({ t, f: 610 * h, dur: 0.01, r: 0.5 - i * 0.1, gain: (0.04 + 0.06 * v) / (i + 1) })) }
          else if (k === 'livro') { thump(t, 95, 0.2 + 0.35 * v); noise({ t, dur: 0.05, type: 'lowpass', f: 1200, gain: 0.1 * v }) }
          else { thump(t, 110, 0.1 + 0.3 * v); clicks({ t, n: 2, i0: 0.01, i1: 0.01, f: 2200, q: 4, gain: 0.05 + 0.1 * v }) } } break
        case 'glass': shatter(t, a === 'garrafa' ? 0.28 : 0.22); thump(t, 140, 0.12); break
        case 'window': shatter(t, 0.42); clicks({ t: t + 0.08, n: 20, i0: 0.01, i1: 0.05, f: 3800, q: 2, gain: 0.12 }); thump(t, 70, 0.3); break
        case 'vault': noise({ t, dur: 0.3, a: 0.05, r: 0.08, f: 900, f2: 1600, q: 1, gain: 0.07 }); break
        case 'land': thump(t, 75, 0.35); noise({ t, dur: 0.08, type: 'lowpass', f: 800, gain: 0.08 }); break
        case 'stun': tone({ t, f: 4100, dur: 1.6, a: 0.02, r: 0.6, gain: 0.018, dest: inner() }); masterLP.frequency.cancelScheduledValues(t); masterLP.frequency.setValueAtTime(900, t); masterLP.frequency.setTargetAtTime(20000, t + 1.2, 0.4); break
        case 'wardrobe': creak(t, 0.08); thump(t + 0.25, 100, 0.08); break
        case 'crank': clicks({ t, n: 3, i0: 0.05, i1: 0.04, f: 2600, q: 6, gain: 0.07 }); break
        case 'circle': noise({ t, dur: 0.5, a: 0.05, r: 0.2, type: 'highpass', f: 5000, gain: 0.03 }); tone({ t: t + 0.2, f: 110, f2: 108, dur: 1.2, a: 0.3, r: 0.8, gain: 0.05, lp: 300 }); break
        case 'orbUp': [220, 330, 440].forEach((f, i) => tone({ t: t + i * 0.04, f, dur: 0.6, a: 0.08, r: 0.4, gain: 0.03 })); break
        case 'orbDrop': glassTap(t, 0.2); crack(t + 0.01, 0.15); break
        case 'orbBreak': shatter(t, 0.35); whisper(t + 0.1, 1.2, 0.06); tone({ t, f: 330, f2: 110, dur: 0.8, r: 0.4, gain: 0.06 }); break
        case 'trunk': thump(t, 90, 0.2); clicks({ t: t + 0.02, n: 3, i0: 0.02, i1: 0.02, f: 1800, q: 5, gain: 0.06 }); break
        case 'deliver': [392, 494, 587].forEach((f, i) => tone({ t: t + 0.1 + i * 0.08, f, dur: 0.4, a: 0.02, r: 0.6, gain: 0.03 })); break
        case 'lantern': clicks({ t, n: 1, i0: 0.01, i1: 0.01, f: 2100, q: 5, gain: 0.08 }); break
        case 'detOn': tone({ t, f: 1760, dur: 0.06, gain: 0.03 }); tone({ t: t + 0.08, f: 2350, dur: 0.06, gain: 0.03 }); break
        case 'detOff': tone({ t, f: 1400, dur: 0.05, gain: 0.025 }); break
        case 'breath': for (let i = 0; i < 3; i++) { noise({ t: t + i * 0.5, dur: 0.22, a: 0.04, r: 0.06, f: 900, f2: 1500, q: 2, gain: 0.09, dest: inner() }); noise({ t: t + i * 0.5 + 0.25, dur: 0.22, a: 0.02, r: 0.1, f: 1400, f2: 700, q: 2, gain: 0.1, dest: inner() }) } break
        case 'maeOut': shatter(t, 0.35); scream(t + 0.15, 1.0, 560, 900, 0.16, bus(0.5)); tone({ t, f: 60, f2: 35, dur: 0.8, r: 0.5, gain: 0.4, lp: 160 }); break
        case 'capture': { // o círculo acende, ela grita e é sugada para dentro do orbe
          tone({ t, f: 70, f2: 30, dur: 0.25, r: 0.2, gain: 0.5, lp: 200 }); scream(t + 0.05, 1.3, 700, 1100, 0.15, bus(0.6))
          noise({ t: t + 0.1, dur: 1.4, a: 1.2, r: 0.05, f: 300, f2: 3000, q: 0.9, gain: 0.22 })
          ;[523, 659, 784, 1047, 1319].forEach((f, i) => tone({ t: t + 1.35, f, dur: 0.6, a: 0.02, r: 1.2, gain: 0.035 }))
          glassTap(t + 1.5, 0.2); whisper(t + 0.4, 1.0, 0.05) } break
        case 'capLock': tone({ t, f: 110, f2: 520, dur: 0.5, type: 'sawtooth', gain: 0.06, lp: 2400 }); clicks({ t, n: 26, i0: 0.03, i1: 0.008, f: 3000, q: 4, gain: 0.08 }); noise({ t, dur: 0.5, a: 0.05, r: 0.1, type: 'highpass', f: 4000, gain: 0.05 }); break // os raios travam: zumbido elétrico subindo
        case 'capScream': scream(t, 1.9, 700, 1250, 0.17, bus(0.6)); scream(t + 0.6, 1.2, 900, 1500, 0.1, bus(0.6)); break // ela grita enquanto é puxada
        case 'capPull': noise({ t, dur: 1.5, a: 1.3, r: 0.08, f: 220, f2: 4200, q: 1.3, gain: 0.26 }); tone({ t, f: 55, f2: 190, dur: 1.45, a: 1.2, r: 0.05, gain: 0.25, lp: 400 }); clicks({ t: t + 0.6, n: 40, i0: 0.04, i1: 0.006, f: 2200, q: 3, gain: 0.07 }); break // o vórtice: tudo sobe junto até o clarão
        case 'capImplode': thump(t, 38, 1.0); tone({ t, f: 60, f2: 24, dur: 0.7, r: 0.6, gain: 0.7, lp: 160 }); crack(t, 0.4); noise({ t, dur: 0.35, a: 0.002, r: 0.3, type: 'lowpass', f: 2200, gain: 0.3 }); glassTap(t + 0.04, 0.25); break // implode
        case 'capOrb': ;[523, 659, 784, 1047, 1319].forEach((f, i) => tone({ t: t + i * 0.04, f, dur: 0.6, a: 0.02, r: 1.4, gain: 0.035 })); glassTap(t + 0.2, 0.18); break // o orbe: um acorde de vidro
        case 'trapStrain': tone({ t, f: 400, f2: 170, dur: 0.8, type: 'sawtooth', gain: 0.05, lp: 1600 }); clicks({ t, n: 30, i0: 0.02, i1: 0.012, f: 1800, q: 3, gain: 0.09 }); break // o raio falhando: range e estala
        case 'trapBurst': thump(t, 42, 1.0); tone({ t, f: 72, f2: 26, dur: 0.85, r: 0.6, gain: 0.65, lp: 180 }); noise({ t, dur: 0.6, a: 0.002, r: 0.5, type: 'lowpass', f: 1800, gain: 0.4 }); clicks({ t, n: 45, i0: 0.004, i1: 0.03, f: 2600, q: 2.5, gain: 0.2 }); tone({ t, f: 1600, f2: 180, dur: 0.3, type: 'sawtooth', gain: 0.07, lp: 3000 }); break // a armadilha estoura: a onda de força
        case 'caught': tone({ t, f: 70, f2: 32, dur: 0.22, r: 0.2, gain: 0.6, lp: 250 }); scream(t, 0.5, 640, 980, 0.16, bus(0.4)); break
        case 'bed': noise({ t, dur: 0.5, a: 0.05, r: 0.1, f: 700, f2: 400, q: 0.8, gain: 0.07 }); creak(t + 0.1, 0.04); break
        case 'rip': splinter(t, 'cadeira', 0.35); tone({ t, f: 70, f2: 32, dur: 0.22, r: 0.2, gain: 0.6, lp: 250 }); scream(t + 0.05, 0.6, 600, 980, 0.16, bus(0.4)); break
        case 'maeHit': thump(t, 80, 0.35); scream(t + 0.02, 0.35, 700, 1000, 0.13, bus(0.4)); if (a === 'sal') noise({ t, dur: 1.2, a: 0.01, r: 0.4, type: 'highpass', f: 4500, gain: 0.08 }); break // o sal chia na pele dela
        case 'salt': noise({ t, dur: 0.4, a: 0.005, r: 0.15, type: 'highpass', f: 3000, gain: 0.08 }); thump(t, 120, 0.1); break
        case 'deny': tone({ t, f: 180, f2: 150, dur: 0.1, type: 'square', gain: 0.03, lp: 700 }); break
        case 'plasma': tone({ t, f: 1500 + R() * 200, f2: 300, dur: 0.07, type: 'sawtooth', gain: 0.05, lp: 3200 }); tone({ t, f: 520, f2: 140, dur: 0.06, gain: 0.08, lp: 900 }); noise({ t, dur: 0.04, a: 0.002, r: 0.05, f: 2600, q: 0.8, gain: 0.07 }); thump(t, 120, 0.08); break // rajada: mais curto e leve // o disparo: um zap que desce e um baque
        case 'shotgun': thump(t, 52, 0.95); tone({ t, f: 70, f2: 30, dur: 0.25, r: 0.3, gain: 0.5, lp: 180 }); noise({ t, dur: 0.22, a: 0.002, r: 0.25, type: 'lowpass', f: 2600, gain: 0.32 }); noise({ t, dur: 0.06, a: 0.001, r: 0.08, type: 'highpass', f: 3500, gain: 0.14 }); tone({ t, f: 1100, f2: 160, dur: 0.16, type: 'sawtooth', gain: 0.07, lp: 2600 }); crack(t + 0.01, 0.2); break // o estouro: baque grave, rajada de ruído e o zap das bobinas
        case 'pump': clicks({ t, n: 2, i0: 0.09, i1: 0.09, f: 1400, q: 4, gain: 0.12 }); thump(t + 0.1, 160, 0.08); tone({ t: t + 0.12, f: 260, f2: 900, dur: 0.3, a: 0.05, gain: 0.025, lp: 2400 }); break // a bomba e as bobinas carregando
        case 'plasmaHit': clicks({ t, n: 6, i0: 0.008, i1: 0.02, f: 2600, q: 3, gain: 0.08 }); tone({ t, f: 700, f2: 180, dur: 0.08, gain: 0.05, lp: 1800 }); break
        case 'overheat': noise({ t, dur: 1.4, a: 0.02, r: 0.6, type: 'highpass', f: 3500, gain: 0.07 }); [0, 0.18, 0.36].forEach((d) => tone({ t: t + d, f: 1250, dur: 0.08, type: 'square', gain: 0.025, lp: 2600 })); break // chiado do vapor e o alarme
        case 'cool': tone({ t, f: 880, f2: 1320, dur: 0.12, gain: 0.03 }); clicks({ t, n: 2, i0: 0.04, i1: 0.04, f: 2200, q: 5, gain: 0.06 }); break
        case 'shield': [1800, 2420].forEach((f, i) => tone({ t: t + i * 0.03, f, dur: 0.01, r: 0.35, gain: 0.025 })); break // o tiro bate no escudo do berço
        case 'trapThrow': noise({ t, dur: 0.2, a: 0.03, r: 0.05, f: 500, f2: 1700, q: 1.2, gain: 0.07 }); break
        case 'trapStick': clicks({ t, n: 3, i0: 0.012, i1: 0.012, f: 3200, q: 6, gain: 0.12 }); tone({ t: t + 0.02, f: 220, f2: 330, dur: 0.25, a: 0.05, gain: 0.03 }); break
        case 'trapZap': tone({ t, f: 120, f2: 240, dur: 0.9, a: 0.05, type: 'sawtooth', gain: 0.07, lp: 1600 }); tone({ t, f: 1760, f2: 2400, dur: 0.9, a: 0.1, gain: 0.015 }); for (let u = 0; u < 0.9; u += 0.04 + R() * 0.05) clicks({ t: t + u, n: 2, i0: 0.004, i1: 0.006, f: 3000 + R() * 2000, q: 2, gain: 0.07 }); break // o raio segurando
        // ---------- as armas ocultistas (demo): sino, eco de igreja, vidro, coro ----------
        case 'oPistol': { const f0 = 600 + R() * 60; [[1, 0.06], [2.0, 0.03], [2.76, 0.022], [5.4, 0.01]].forEach(([h, g]) => tone({ t, f: f0 * h, dur: 0.01, a: 0.002, r: 0.45 + 0.2 / h, gain: g, lp: 2200, wet: 0.45 })) // um sino abafado
          thump(t, 110, 0.12); noise({ t, dur: 0.07, a: 0.003, r: 0.06, f: 1200, f2: 600, q: 0.8, gain: 0.07 }); noise({ t: t + 0.01, dur: 0.18, a: 0.02, r: 0.1, type: 'highpass', f: 3500, gain: 0.02 }) } break // e as brasas
        case 'oShotgun': thump(t, 50, 0.95); tone({ t, f: 68, f2: 30, dur: 0.28, r: 0.35, gain: 0.5, lp: 170 }); noise({ t, dur: 0.24, a: 0.002, r: 0.3, type: 'lowpass', f: 2200, gain: 0.3, wet: 0.9 })
          ;[[0.19, 0.32], [0.42, 0.18], [0.7, 0.09]].forEach(([d, g]) => { noise({ t: t + d, dur: 0.2, a: 0.01, r: 0.4, type: 'lowpass', f: 900 - d * 600, gain: g * 0.35, wet: 1 }); tone({ t: t + d, f: 60, f2: 35, dur: 0.2, r: 0.3, gain: g * 0.4, lp: 150, wet: 1 }) }) // o eco de igreja
          noise({ t: t + 0.03, dur: 0.6, a: 0.01, r: 0.35, type: 'highpass', f: 4200, gain: 0.05 }); break // o sal chiando no ar
        case 'oPump': clicks({ t, n: 1, i0: 0.01, i1: 0.01, f: 900, q: 5, gain: 0.12 }); creak(t + 0.03, 0.04); clicks({ t: t + 0.14, n: 2, i0: 0.04, i1: 0.04, f: 1300, q: 6, gain: 0.13 }); thump(t + 0.16, 140, 0.1); break // o trinco de porta antiga
        case 'oHit': crack(t, 0.08); noise({ t, dur: 0.16, a: 0.003, r: 0.12, type: 'highpass', f: 3800, gain: 0.05 }); break // a brasa/o sal chiando onde bate
        case 'oOverheat': for (let i = 0; i < 4; i++) { crack(t + i * 0.11 + R() * 0.05, 0.1); glassTap(t + i * 0.11 + 0.02, 0.05) } // o vidro estalando
          noise({ t, dur: 1.4, a: 0.05, r: 0.6, type: 'highpass', f: 3200, gain: 0.06 }); clicks({ t: t + 0.1, n: 22, i0: 0.04, i1: 0.07, f: 420, q: 10, gain: 0.06 }); break // o vapor e o frasco fervendo
        case 'oCool': [988, 784, 659].forEach((f, i) => tone({ t: t + i * 0.09, f, dur: 0.01, a: 0.003, r: 0.5, gain: 0.025, lp: 2600, wet: 0.5 })); break // um sininho descendo: pronta de novo
        case 'oTrapThrow': clicks({ t, n: 9, i0: 0.02, i1: 0.035, f: 2600, q: 7, spread: 0.5, gain: 0.07 }); noise({ t, dur: 0.22, a: 0.03, r: 0.06, f: 500, f2: 1500, q: 1.1, gain: 0.06 }); break // a corrente chacoalha
        case 'oTrapStick': thump(t, 130, 0.12); clicks({ t: t + 0.04, n: 8, i0: 0.03, i1: 0.012, f: 2000, q: 6, gain: 0.07 }); tone({ t: t + 0.2, f: 784, dur: 0.01, r: 0.6, gain: 0.03, lp: 2600, wet: 0.5 }); break // pousa e a íris abre
        case 'oTrapZap': { const D2 = a === 'win' ? 2.6 : 0.95 // o coro sussurrado subindo (e as correntes)
          ;[220, 261.6, 329.6, 440].forEach((f, i) => tone({ t: t + i * 0.05, f, f2: f * 1.06, dur: D2, a: D2 * 0.7, r: 0.06, type: 'triangle', gain: 0.028, lp: 1300, wet: 0.8 }))
          whisper(t, D2, 0.05); clicks({ t, n: Math.round(D2 * 14), i0: 0.08, i1: 0.05, f: 2400, q: 7, spread: 0.6, gain: 0.05 }) } break
        case 'trapFail': tone({ t, f: 420, f2: 90, dur: 0.35, type: 'sawtooth', gain: 0.06, lp: 1400 }); noise({ t, dur: 0.2, a: 0.005, r: 0.2, type: 'highpass', f: 2500, gain: 0.08 }); break
      }
    }

    // ---------- mortes: deixas por tempo ----------
    const D = (o) => Object.assign({ dest: deathPre }, o)
    function scream(t, dur, f0, f1, gain, dest = deathPre) { // grito: três vozes ásperas, formantes de "a", vibrato nervoso
      const g = vca(dest, t, 0.06, gain, dur, 0.05)
      const fA = ctx.createBiquadFilter(); fA.type = 'bandpass'; fA.frequency.value = 850; fA.Q.value = 3
      const fB = ctx.createBiquadFilter(); fB.type = 'bandpass'; fB.frequency.value = 1250; fB.Q.value = 4
      const fC = ctx.createBiquadFilter(); fC.type = 'bandpass'; fC.frequency.value = 2700; fC.Q.value = 5
      const mix = ctx.createGain(); mix.gain.value = 0.6
      ;[fA, fB, fC].forEach((f) => { f.connect(g) })
      const vib = ctx.createOscillator(), vg = ctx.createGain(); vib.frequency.value = 8.5; vg.gain.value = 22; vib.connect(vg)
      ;[[1, 0], [1.012, 0], [1.5, 0.4]].forEach(([k, pan]) => {
        const o = ctx.createOscillator(); o.type = 'sawtooth'
        o.frequency.setValueAtTime(f0 * k, t); o.frequency.exponentialRampToValueAtTime(f1 * k, t + 0.35)
        for (let j = 1; j < 10; j++) o.frequency.linearRampToValueAtTime(f1 * k * (1 + (R() - 0.5) * 0.05), t + 0.35 + j * dur / 10) // a voz oscila sem degraus
        vg.connect(o.frequency); o.connect(mix); o.start(t); o.stop(t + dur + 0.2)
      })
      mix.connect(fA); mix.connect(fB); mix.connect(fC)
      vib.start(t); vib.stop(t + dur + 0.2)
      noise({ t, dur, a: 0.05, f: 3200, q: 1, gain: gain * 0.35, r: 0.05, dest })
    }
    const CUES = {
      mae: [
        [0.001, (t) => { // ela dispara: passos, vestido, um puxão de ar
          ;[0, 0.12, 0.24, 0.35].forEach((d, i) => thump(t + d, 90 + i * 6, 0.32, deathPre))
          noise(D({ t, dur: 0.45, a: 0.1, f: 900, f2: 3200, q: 0.9, gain: 0.12 }))
          noise(D({ t: t + 0.08, dur: 0.3, a: 0.05, type: 'highpass', f: 2500, gain: 0.1 }))
        }],
        [0.43, (t) => { // agarra a sua cabeça
          tone(D({ t, f: 70, f2: 32, dur: 0.22, r: 0.2, gain: 0.7, lp: 250 }))
          noise(D({ t, dur: 0.05, f: 1800, q: 0.9, gain: 0.35, r: 0.06 }))
          noise(D({ t: t + 0.03, dur: 0.18, a: 0.01, f: 1100, f2: 650, q: 3, gain: 0.16 })) // o seu susto
        }],
        [0.6, (t) => { // levanta você: tendões rangendo, você sufocando, coração
          clicks(D({ t, n: 45, i0: 0.02, i1: 0.007, f: 280, q: 7, gain: 0.16, r: 0.03 }))
          clicks(D({ t: t + 0.1, n: 40, i0: 0.012, i1: 0.016, f: 520, q: 3, gain: 0.06 }))
          ;[0, 0.32].forEach((d) => { tone(D({ t: t + d, f: 58, f2: 40, dur: 0.07, gain: 0.5, lp: 160 })); tone(D({ t: t + d + 0.16, f: 52, f2: 38, dur: 0.06, gain: 0.35, lp: 160 })) })
        }],
        [1.05, (t) => scream(t, 1.15, 560, 920, 0.2)],
        [1.88, (t) => { // aperta: o crânio cede
          clicks(D({ t, n: 14, i0: 0.014, i1: 0.005, f: 2600, q: 2, gain: 0.45 }))
          clicks(D({ t: t + 0.12, n: 18, i0: 0.01, i1: 0.004, f: 1500, q: 2, gain: 0.5 }))
          tone(D({ t: t + 0.16, f: 110, f2: 38, dur: 0.18, gain: 0.6, lp: 300 }))
          noise(D({ t: t + 0.15, dur: 0.16, f: 420, q: 2, gain: 0.25 }))
        }],
      ],
    }
    // A Sombra: a lanterna pisca; a cada apagão ela está mais perto; no escuro final, o bico abre e a imagem rasga
    {
      const DP = () => deathPre
      const on = (a, b) => (t) => { torchClick(t, 0.3, DP()); buzz(t, b - a, 0.05, DP()) }
      const off = (k) => (t) => { // apagou: ela anda (em quadros), a estática cresce, o corvo está mais perto
        torchClick(t, 0.3, DP())
        glitch(t + 0.03, 0.12 + 0.06 * k, 0.07 + 0.04 * k, DP())
        ;[0.05, 0.15].forEach((d) => talon(t + d, 0.15 + 0.08 * k, DP()))
        croak(t + 0.08, 0.06 + 0.05 * k, DP())
        noise({ t, dur: 0.25, a: 0.02, f: 700, f2: 1300, q: 2, gain: 0.08 + 0.03 * k, dest: DP() }) // você puxa o ar
      }
      CUES.sombra = [
        [0.001, on(0, 0.55)], [0.55, off(0)], [0.8, on(0.8, 0.95)], [0.95, off(1)], [1.22, on(1.22, 1.32)], [1.32, off(2)], [1.6, on(1.6, 1.66)],
        [1.66, (t) => { // a pilha morre: estalo, um apito descendo; o bico abre
          torchClick(t, 0.35, DP()); tone({ t, f: 2600, f2: 180, dur: 0.45, gain: 0.05, dest: DP() })
          rasp(t + 0.1, 0.3, 140, 230, 0.12, DP(), 26)
          tone({ t, f: 30, f2: 55, dur: 0.6, a: 0.3, gain: 0.5, lp: 120, dest: DP() }) // pressão crescendo
        }],
        [1.9, (t) => { glitch(t, 0.45, 0.22, DP()); noise({ t, dur: 0.45, a: 0.02, type: 'highpass', f: 1800, gain: 0.12, dest: DP() }) }], // a imagem rasga
        [2.0, (t) => { // o bote: o grito de corvo enorme, tudo distorcido
          rasp(t, 0.36, 380, 620, 0.16, DP(), 44); rasp(t, 0.36, 250, 410, 0.12, DP(), 31); sombraShriek(t, 0.24, DP()); demon(t, 0.45, 0.2, DP(), 60, 'a')
          tone({ t, f: 70, f2: 30, dur: 0.3, gain: 0.8, lp: 200, dest: DP() })
          noise({ t, dur: 0.33, a: 0.01, f: 900, q: 0.6, gain: 0.25, dest: DP() }) // o manto fecha
        }],
      ]
    }
    // O Desconhecido: o objeto treme, estoura, o pescoço desce estalando, as garras agarram e o sorriso morde
    CUES.desc = [
      [0.001, (t) => { const m = MAT[desc.st.kind] || MAT.quadro; clicks({ t, n: 40, i0: 0.016, i1: 0.006, f: m.f, q: m.q, gain: 0.16, dest: deathPre }); chuckle(t + 0.1, 0.07, deathPre) }],
      [0.45, (t) => { splinter(t, desc.st.kind, 0.38, deathPre); cackle(t + 0.12, 0.17, deathPre, 0.45) }],
      [0.95, (t) => { // as garras na sua cabeça
        tone({ t, f: 72, f2: 34, dur: 0.2, r: 0.2, gain: 0.7, lp: 250, dest: deathPre })
        squelch(t, 0.25, deathPre, 7)
        noise({ t: t + 0.03, dur: 0.18, a: 0.01, f: 1100, f2: 650, q: 3, gain: 0.16, dest: deathPre })
      }],
      [1.05, (t) => { // o pescoço desce estalando, osso por osso; os dentes batem
        for (let i = 0; i < 5; i++) crack(t + i * 0.13 + R() * 0.04, 0.3, deathPre)
        chatter(t + 0.2, 0.14, deathPre); chatter(t + 0.45, 0.16, deathPre)
        rasp(t + 0.1, 0.55, 95, 70, 0.1, deathPre, 22) // um gemido grave, de dentro
      }],
      [1.55, (t) => { cackle(t, 0.2, deathPre, 0.25); demon(t + 0.1, 0.5, 0.18, deathPre, 55, 'a') }],
      [1.75, (t) => { // a mordida
        clicks({ t, n: 16, i0: 0.01, i1: 0.004, f: 2200, q: 1.5, gain: 0.55, dest: deathPre })
        squelch(t + 0.02, 0.4, deathPre, 10)
        tone({ t, f: 95, f2: 32, dur: 0.18, gain: 0.8, lp: 280, dest: deathPre })
      }],
    ]
    // A Garota: a caixinha perde a corda; a barriga abre; as línguas chicoteiam e puxam você para dentro; os dentes fecham
    CUES.garota = [
      [0.001, () => { if (mbox) { mbox.mode = 'wind'; mbox.slow = 1.3 } }],
      [0.85, (t) => { // a barriga rasga e abre
        squelch(t, 0.35, deathPre, 10); noise({ t, dur: 0.4, a: 0.02, f: 500, f2: 250, q: 1.5, gain: 0.3, dest: deathPre })
        ;[311, 330, 494, 523].forEach((f) => tone({ t, f, f2: f * 0.94, type: 'sawtooth', dur: 0.1, r: 0.7, gain: 0.06, lp: 3000, dest: deathPre }))
        giggle(t + 0.05, 0.12, deathPre); demon(t + 0.15, 0.7, 0.13, deathPre, 46, 'o') // e a boca da barriga responde
      }],
      [1.05, (t) => { for (let k = 0; k < 6; k++) whip(t + k * 0.06 + R() * 0.03, 0.18, deathPre) }],
      [1.42, (t) => { squelch(t, 0.35, deathPre, 9); tone({ t, f: 70, f2: 35, dur: 0.15, gain: 0.5, lp: 200, dest: deathPre }) }], // enrolam na sua cabeça
      [1.75, (t) => { // puxada: ar passando, você grita abafado, os dentes rangem cada vez mais perto
        noise({ t, dur: 0.5, a: 0.2, f: 400, f2: 1600, q: 0.8, gain: 0.25, dest: deathPre })
        scream(t + 0.05, 0.55, 300, 380, 0.08)
        for (let k = 0; k < 4; k++) chomp(t + 0.1 + k * 0.1, 0.12 + 0.05 * k, deathPre)
      }],
      [2.05, (t) => { deathLP.frequency.setTargetAtTime(380, t, 0.05); tone({ t, f: 40, dur: 0.3, a: 0.1, gain: 0.5, lp: 100, dest: deathPre }) }], // lá dentro: tudo abafado
      [2.2, (t) => { // os dentes fecham
        clicks({ t, n: 14, i0: 0.008, i1: 0.004, f: 1800, q: 1.5, gain: 0.6, dest: deathPre })
        tone({ t, f: 85, f2: 30, dur: 0.2, gain: 0.9, lp: 250, dest: deathPre }); squelch(t, 0.4, deathPre, 8); demon(t - 0.15, 0.4, 0.16, deathPre, 50, 'a')
      }],
    ]
    // O Mordomo não mata: a rajada vem, atravessa você e deixa você tonto e surdo por 4 s
    CUES.mordomo = [
      [0.45, (t) => { // ele vem: o vento cresce num rugido
        noise({ t, dur: 0.4, a: 0.3, f: 250, f2: 1400, q: 0.9, gain: 0.45 })
        noise({ t, dur: 0.4, a: 0.3, f: 900, f2: 2600, q: 6, gain: 0.12 })
      }],
      [0.8, (t) => { // atravessa você
        tone({ t, f: 58, f2: 24, dur: 0.5, r: 0.6, gain: 0.9, lp: 160 })
        noise({ t, dur: 0.22, a: 0.004, r: 0.4, type: 'lowpass', f: 2200, gain: 0.55 })
        flap(t, 0.35)
      }],
      [0.86, (t) => { // surdo: o mundo abafa, sobra o zumbido e o seu corpo por dentro
        masterLP.frequency.cancelScheduledValues(t); masterLP.frequency.setTargetAtTime(220, t, 0.03)
        masterLP.frequency.setTargetAtTime(900, t + 2.6, 0.5); masterLP.frequency.setTargetAtTime(20000, t + 3.4, 0.45)
        const ear = inner()
        tone({ t, f: 3700, dur: 2.8, a: 0.02, r: 1.6, gain: 0.05, dest: ear }); tone({ t, f: 3711, dur: 2.8, a: 0.02, r: 1.6, gain: 0.04, dest: ear })
        for (let k = 0; k < 5; k++) { const tb = t + 0.25 + k * 0.78; tone({ t: tb, f: 52, f2: 36, dur: 0.09, gain: 0.5, lp: 120, dest: ear }); tone({ t: tb + 0.18, f: 46, f2: 34, dur: 0.08, gain: 0.35, lp: 120, dest: ear }) }
        ;[0.6, 1.8, 3.0].forEach((d) => { noise({ t: t + d, dur: 0.45, a: 0.12, r: 0.2, type: 'lowpass', f: 500, gain: 0.12, dest: ear }); noise({ t: t + d + 0.6, dur: 0.55, a: 0.05, r: 0.3, type: 'lowpass', f: 380, gain: 0.1, dest: ear }) }) // respiração dentro da cabeça
      }],
    ]
    // O Observador: galope, a galhada na barriga, o arremesso; caído, ele bufa e pinga sobre você; a boca abre, ruge e morde
    CUES.observador = [
      [0.001, (t) => {
        const DP = deathPre; let u = t, cyc = 0.36
        while (u < t + 1.12) { [0, 0.1, 0.45, 0.56].forEach((x) => { if (u + x * cyc < t + 1.12) hoof(u + x * cyc, 0.35, DP) }); u += cyc; cyc *= 0.88 } // galope acelerando
        bugle(t + 0.12, 0.13, DP, 0.9, 1.05)
        growl(t + 0.6, 0.55, 0.16, DP)
        for (let k = 0; k < 5; k++) pant(t + 0.1 + k * 0.2, 0.12, DP)
      }],
      [1.15, (t) => { // a galhada entra
        tone({ t, f: 66, f2: 26, dur: 0.35, r: 0.4, gain: 0.95, lp: 220, dest: deathPre })
        clicks({ t, n: 12, i0: 0.008, i1: 0.02, f: 1400, q: 2, gain: 0.45, dest: deathPre }); squelch(t, 0.35, deathPre, 9)
        scream(t + 0.04, 0.32, 380, 470, 0.07)
      }],
      [1.38, (t) => noise({ t, dur: 0.32, a: 0.08, f: 380, f2: 1600, q: 0.8, gain: 0.3, dest: deathPre })], // arremessado
      [1.72, (t) => { // o chão: sem ar, ouvido zunindo, tudo turvo
        tone({ t, f: 55, f2: 30, dur: 0.25, r: 0.3, gain: 0.8, lp: 160, dest: deathPre }); noise({ t, dur: 0.12, type: 'lowpass', f: 1600, gain: 0.3, r: 0.15, dest: deathPre })
        noise({ t: t + 0.05, dur: 0.35, a: 0.01, r: 0.2, f: 700, f2: 400, q: 1.5, gain: 0.14, dest: deathPre }) // o ar saindo de você
        masterLP.frequency.cancelScheduledValues(t); masterLP.frequency.setTargetAtTime(1300, t, 0.05); masterLP.frequency.setTargetAtTime(20000, t + 1.6, 0.35)
        tone({ t, f: 3600, dur: 1.4, a: 0.02, r: 1.2, gain: 0.03, dest: inner() })
      }],
      [2.4, (t) => { // em cima de você: bufa no seu rosto, rosna baixo, o sangue pinga dos chifres
        ;[0, 0.5, 0.95].forEach((d) => snort(t + d, 0.28, deathPre))
        growl(t + 0.15, 1.05, 0.09, deathPre)
        for (let k = 0; k < 9; k++) drip(t + k * 0.13 + R() * 0.08, 0.05, deathPre)
      }],
      [3.55, (t) => { // a boca abre devagar: mandíbula estalando, o rosnado sobe, baba
        clicks({ t, n: 18, i0: 0.04, i1: 0.02, f: 320, q: 8, gain: 0.2, dest: deathPre })
        growl(t, 0.55, 0.2, deathPre); squelch(t + 0.1, 0.12, deathPre, 5)
      }],
      [3.82, (t) => noise({ t, dur: 0.24, a: 0.05, r: 0.05, f: 650, f2: 1500, q: 2.2, gain: 0.3, dest: deathPre })], // puxa o ar
      [4.08, (t) => { bugle(t, 0.26, deathPre, 0.3, 0.6); growl(t, 0.25, 0.26, deathPre); demon(t, 0.4, 0.22, deathPre, 44, 'a'); tone({ t, f: 30, f2: 24, dur: 0.3, gain: 0.8, lp: 80, dest: deathPre }) }], // o rugido do bote
      [4.21, (t) => { // a mordida
        clicks({ t, n: 16, i0: 0.009, i1: 0.004, f: 2000, q: 1.5, gain: 0.6, dest: deathPre })
        tone({ t, f: 90, f2: 30, dur: 0.2, gain: 0.9, lp: 260, dest: deathPre }); squelch(t, 0.45, deathPre, 9)
      }],
    ]
    // a travessia: passos (e os dele, atrasados), a mão no vidro, o espelho vira líquido, o puxão, o prateado, o mundo invertido, a saída
    CUES.reflexo = [
      [0.001, (t) => {
        const glassD = ctx.createBiquadFilter(); glassD.type = 'lowpass'; glassD.frequency.value = 900; glassD.connect(deathPre)
        for (let k = 0; k < 6; k++) { const u = t + 0.15 + k * 0.3; thump(u, 70, 0.14, deathPre); creak(u, 0.015, deathPre); thump(u + 0.45, 70, 0.1, glassD) } // você anda; ele anda junto, atrasado
      }],
      [1.4, (t) => noise({ t, dur: 0.4, a: 0.1, r: 0.15, f: 2600, q: 0.8, gain: 0.04, dest: deathPre })], // a manga do casaco
      [2.3, (t) => glassTap(t, 0.16, deathPre)], // a sua palma no vidro
      [2.6, (t) => { // a palma dele, do outro lado; o vidro começa a cantar e vira líquido
        glassTap(t, 0.14, deathPre, true)
        ;[440, 443.5, 660].forEach((f) => tone({ t, f, dur: 1.3, a: 0.4, r: 0.4, gain: 0.05, dest: deathPre }))
        for (let k = 0; k < 7; k++) bloop(t + 0.1 + k * 0.17 + R() * 0.05, 0.1, deathPre)
      }],
      [2.85, (t) => { // a mão afunda; ele segura
        noise({ t, dur: 0.6, a: 0.1, r: 0.2, f: 420, q: 2, gain: 0.12, dest: deathPre }); squelch(t + 0.1, 0.1, deathPre, 4)
        tone({ t, f: 55, f2: 38, dur: 0.6, a: 0.2, gain: 0.35, lp: 120, dest: deathPre })
      }],
      [3.2, (t) => { // o puxão para dentro, o prateado subindo num acorde brilhante
        noise({ t, dur: 0.75, a: 0.5, r: 0.02, f: 300, f2: 2400, q: 0.9, gain: 0.3, dest: deathPre })
        ;[1046.5, 1318.5, 1568, 2093, 2637].forEach((f, i) => tone({ t: t + 0.2, f, dur: 0.55, a: 0.5, r: 0.02, gain: 0.025 + 0.005 * i, dest: deathPre }))
        whisper(t, 0.7, 0.05, deathPre)
      }],
      [3.95, () => { deathBus.gain.cancelScheduledValues(now()); deathBus.gain.setValueAtTime(0, now()) }], // escuro: silêncio
      [4.12, (t) => { // o mundo invertido: um som "ao contrário" que corta seco
        deathBus.gain.setValueAtTime(1, t)
        noise({ t, dur: 0.45, a: 0.44, r: 0.005, type: 'highpass', f: 3000, gain: 0.18, dest: deathPre })
        tone({ t, f: 60, f2: 120, dur: 0.45, a: 0.44, r: 0.005, type: 'sawtooth', gain: 0.1, lp: 400, dest: deathPre })
        masterLP.frequency.setValueAtTime(900, t)
      }],
      [4.6, (t) => { // estala de volta: um tlim de vidro e você puxa o ar como quem sai da água
        masterLP.frequency.setTargetAtTime(20000, t, 0.08)
        glassTap(t, 0.18, deathPre)
        noise({ t: t + 0.03, dur: 0.45, a: 0.02, r: 0.15, f: 800, f2: 1600, q: 1.8, gain: 0.22, dest: deathPre }) // o fôlego
        ;[0.25, 0.55, 0.8].forEach((d) => thump(t + d, 72, 0.18, deathPre)) // cambaleia
      }],
      [5.0, (t) => [0, 0.35].forEach((d) => thump(t + d, 70, 0.12, deathPre))],
      [5.6, (t) => { for (let k = 0; k < 6; k++) drip(t + k * 0.32 + R() * 0.1, 0.05, deathPre); tone({ t, f: 41, f2: 39, dur: 1.5, a: 0.5, r: 0.8, gain: 0.3, lp: 90, dest: deathPre }) }], // o espelho começa a sangrar
      [6.1, (t) => [1, 2.76].forEach((h, i) => tone({ t, f: 392 * h, dur: 0.01, r: 1.4 - i * 0.6, gain: 0.04 / (i + 1), dest: deathPre }))], // aviso: recarregando
    ]
    // O Amigo: o rugido e a corrida; agarra; ergue; soluça na sua cara; o abraço abafado; os ossos
    CUES.amigo = [
      [0.001, (t) => { bearRoar(t + 0.05, 0.3, deathPre, 1.0); [0, 0.3, 0.55].forEach((d) => thump(t + d, 50, 0.5, deathPre)) }],
      [0.62, (t) => { tone(D({ t, f: 70, f2: 34, dur: 0.2, r: 0.2, gain: 0.7, lp: 250 })); noise(D({ t, dur: 0.06, f: 1400, q: 0.8, gain: 0.3 })); noise(D({ t: t + 0.03, dur: 0.18, a: 0.01, f: 1100, f2: 650, q: 3, gain: 0.16 })) }],
      [0.85, (t) => { creak(t, 0.12, deathPre); noise(D({ t, dur: 0.6, a: 0.2, f: 300, f2: 900, q: 1, gain: 0.15 })) }],
      [1.2, (t) => { grunt(t, 0.2, deathPre, 4); demon(t + 0.3, 0.6, 0.12, deathPre, 46, 'o') }], // grunhe na sua cara
      [1.8, (t) => clicks(D({ t, n: 14, i0: 0.05, i1: 0.04, f: 2800, q: 6, gain: 0.1 }))],
      [2.15, (t) => { squelch(t, 0.25, deathPre, 6); noise(D({ t, dur: 0.3, a: 0.05, type: 'lowpass', f: 500, gain: 0.3 })); tone(D({ t, f: 45, dur: 0.4, a: 0.1, gain: 0.4, lp: 120 })); deathLP.frequency.setTargetAtTime(700, t, 0.05) }],
      [2.5, (t) => { for (let i = 0; i < 4; i++) crack(t + i * 0.08, 0.45, deathPre); demon(t, 0.55, 0.16, deathPre, 50, 'o'); tone(D({ t: t + 0.1, f: 90, f2: 30, dur: 0.25, gain: 0.8, lp: 260 })); grunt(t + 0.05, 0.16, deathPre, 2) }],
    ]
    // A Mãe arranca você do armário: lá dentro tudo abafado (os passos, o seu coração, o fôlego preso); as portas estouram;
    // o puxão, o arremesso, a parede, o chão, o zumbido no ouvido; ela grita quando te acha
    CUES.maeEsc = [
      [0.001, (t) => {
        masterLP.frequency.cancelScheduledValues(t); masterLP.frequency.setTargetAtTime(1300, t, 0.05) // dentro do armário
        let h = t + 0.25; for (let k = 0; k < 9; k++) { tone({ t: h, f: 60, f2: 40, dur: 0.07, gain: 0.3 + k * 0.03, lp: 150, dest: inner() }); tone({ t: h + 0.15, f: 54, f2: 38, dur: 0.06, gain: 0.2 + k * 0.02, lp: 150, dest: inner() }); h += 0.62 - k * 0.045 }
        noise({ t: t + 0.1, dur: 0.5, a: 0.05, r: 0.2, f: 1200, f2: 700, q: 1.5, gain: 0.05, dest: inner() }) // você prende o ar
      }],
      [1.62, (t) => { creak(t, 0.08); noise({ t: t + 0.3, dur: 1.0, a: 0.5, r: 0.2, f: 700, f2: 1300, q: 2, gain: 0.07, wet: 0.4 }) }], // ela para na porta e puxa o ar
      [2.15, (t) => crack(t, 0.25)],
      [2.6, (t) => { // as portas estouram
        masterLP.frequency.cancelScheduledValues(t); masterLP.frequency.setValueAtTime(20000, t)
        thump(t, 70, 0.7, deathPre); clicks(D({ t, n: 14, i0: 0.006, i1: 0.02, f: 500, q: 4, gain: 0.35 })); creak(t + 0.04, 0.12, deathPre)
        ;[0.22, 0.31].forEach((d) => thump(t + d, 90, 0.35, deathPre)) // as portas batem nas laterais
        scream(t + 0.06, 0.8, 600, 980, 0.2)
        noise(D({ t: t + 0.03, dur: 0.18, a: 0.01, f: 1100, f2: 650, q: 3, gain: 0.16 })) // o seu susto
      }],
      [2.76, (t) => { tone(D({ t, f: 70, f2: 32, dur: 0.2, r: 0.2, gain: 0.6, lp: 250 })); noise(D({ t, dur: 0.05, f: 1800, q: 0.9, gain: 0.3, r: 0.06 })) }], // agarra
      [3.0, (t) => { noise(D({ t, dur: 0.5, a: 0.05, r: 0.15, f: 1500, f2: 500, q: 0.8, gain: 0.15 })); clicks(D({ t: t + 0.05, n: 6, i0: 0.03, i1: 0.06, f: 3200, q: 9, gain: 0.08 })) }], // arrancado: casacos e cabides
      [3.84, (t) => { noise(D({ t, dur: 0.3, a: 0.04, r: 0.08, f: 400, f2: 2400, q: 1, gain: 0.3 })); scream(t, 0.3, 700, 980, 0.12) }], // o arremesso
      [4.1, (t) => { thump(t, 55, 0.9, deathPre); tone(D({ t, f: 45, f2: 28, dur: 0.3, r: 0.3, gain: 0.6, lp: 150 })); clicks(D({ t, n: 10, i0: 0.008, i1: 0.02, f: 700, q: 3, gain: 0.25 })); masterLP.frequency.setValueAtTime(500, t) }], // a parede
      [4.36, (t) => { thump(t, 70, 0.6, deathPre); noise(D({ t, dur: 0.12, type: 'lowpass', f: 700, gain: 0.25 })); tone({ t, f: 4100, dur: 1.8, a: 0.05, r: 1.0, gain: 0.02, dest: inner() }); masterLP.frequency.setTargetAtTime(20000, t + 0.6, 0.6) }], // o chão; o zumbido
      [4.75, (t) => scream(t, 0.5, 640, 900, 0.14)], // ela te acha
      [5.7, (t) => { noise({ t, dur: 0.3, a: 0.03, r: 0.1, f: 900, f2: 1600, q: 2.5, gain: 0.12, dest: inner() }); thump(t + 0.2, 80, 0.2, deathPre) }], // você levanta, ofegando
    ]
    function death(g, T0, T1) {
      if (!ctx || ui.snd !== 'on') return
      const list = CUES[g]; if (!list) return
      for (const [at, fn] of list) if (at > T0 && at <= T1) fn(now())
    }
    function cut() { // corte seco para o preto
      if (!ctx) return
      deathBus.gain.cancelScheduledValues(now()); deathBus.gain.setValueAtTime(0, now()); isCut = true; chaseStop(true); mboxStop()
      amb && amb.g.gain.setTargetAtTime(0.0001, now(), 0.02)
    }
    function card(g) { // o relatório: um baque surdo e o zumbido no ouvido
      if (!ctx || ui.snd !== 'on') return
      const t = now()
      if (g === 'garota') { mboxStart(); mbox.gain.gain.setValueAtTime(0.0001, t); mbox.gain.gain.setTargetAtTime(0.3, t + 0.5, 0.4); mbox.mode = 'play'; mbox.pitch = 0; mbox.tNext = t + 0.9 } // a caixinha ainda tocava
      tone({ t, f: 46, f2: 30, dur: 1.2, r: 1.2, gain: 0.45, lp: 120, wet: 0.5 })
      tone({ t, f: 4100, dur: 2.2, a: 0.3, r: 1.2, gain: 0.012, wet: 0 })
    }
    function endDeath() {
      if (!ctx) return
      masterLP.frequency.cancelScheduledValues(now()); masterLP.frequency.setTargetAtTime(20000, now(), 0.1)
      deathBus.gain.cancelScheduledValues(now()); deathBus.gain.setValueAtTime(0.0001, now()); deathBus.gain.linearRampToValueAtTime(1, now() + 0.05); isCut = false
      deathLP.frequency.cancelScheduledValues(now()); deathLP.frequency.setValueAtTime(20000, now())
      if (mbox) { mbox.gain.gain.setTargetAtTime(1, now(), 0.2); mbox.mode = 'play' }
      amb && amb.g.gain.setTargetAtTime(ambLevel(), now(), 0.6)
    }

    // ---------- por quadro ----------
    function tick(dt, dying) {
      use3D = false
      if (!ctx || ctx.state !== 'running') return
      const t = now()
      // rangidos da casa de tempos em tempos
      if (amb && t > amb.next) { if (!dying && ghost !== 'observador') creak(t, 0.025 + R() * 0.03); amb.next = t + 5 + R() * 12 }
      // A Mãe: cantarola na patrulha; respira rasgado na caça
      const maeOn = ghost === 'mae' && !dying && ui.snd === 'on'
      const chase = ui.mode === 'caca' || lutaOn
      const chaseAny = chase
      if ((ghost === 'demo' || ghost === 'bando' || ghost === 'casa' || ghost === 'espectral' || ghost === 'glutao') && !MUS.loading) musLoad() // as músicas de batalha (arquivos)
      musTick(dt)
      if (maeOn && !chase && PAT.mae.state !== 'idle') { humStart(); humTick() } else humStop() // na pausa ela se cala para escutar
      if (maeOn && chase && !lutaOn) {
        chaseT -= dt; if (chaseT <= 0) { maeBreath(); chaseT = 0.42 + R() * 0.25 }
        shriekT -= dt; if (shriekT <= 0) { maeShriek(t, maeBus()); shriekT = 2.4 + R() * 2.4 } // guinchos curtos
      }
      if (ghost === 'mae' || ghost === 'demo' || HD()) spaceTick(dt)
      use3D = !!HD() // daqui até a trilha da caça, o que cada fantasma toca sai da boca dele
      // A Sombra: no escuro, o manto bate e o corvo resmunga; na luz, silêncio e um apito fino (ela está ali, parada)
      const sOn = ghost === 'sombra' && ui.snd === 'on' && !isCut && typeof sombra !== 'undefined'
      if (sOn) {
        const lit = sombra.st.lit
        if (!flut) {
          flut = loopNoise(700, 'lowpass', 0.7, 0)
          const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = 6100; g.gain.value = 0.0001; o.connect(g); g.connect(out); o.start(); whine = { o, g }
        }
        whine.g.gain.setTargetAtTime(lit && !dying ? 0.006 : 0.0001, t, 0.15)
        const wob = 0.6 + 0.4 * Math.sin(t * 5.7) * Math.sin(t * 3.1 + 1)
        flut.set(lit ? 0.0001 : (chase ? 0.16 : 0.07) * wob, 0.05)
        if (wasLit !== null && lit !== wasLit && !dying) sombraEvent(lit ? 'freeze' : 'thaw')
        wasLit = lit
        if (!lit && !dying) { croakT -= dt; if (croakT <= 0) { croak(t, chase ? 0.14 : 0.07); croakT = chase ? 1.6 + R() * 1.4 : 4 + R() * 5 } }
        if (!lit && chase && !dying) { shriekT -= dt; if (shriekT <= 0) { sombraShriek(t, 0.16); shriekT = 2.5 + R() * 2 } }
        if (!lit && !dying) { gbT -= dt; if (gbT <= 0) { creatureBreath(t, { gain: chase ? 0.14 : 0.06, k: 0.8, chase }); gbT = chase ? 0.55 + R() * 0.2 : 2.6 + R() * 1.2 } } // no escuro ela respira, rouca
      } else if (flut) { flut.stop(); flut = null; whine.o.stop(now() + 0.05); whine = null; wasLit = null }
      // O Desconhecido: disfarçado, o falso respira e ri baixinho (do lado dele); no relógio, o falso tica errado
      const dOn = ghost === 'desc' && ui.snd === 'on' && !isCut && typeof desc !== 'undefined'
      if (dOn) {
        const P = desc.pairs[desc.st.kind], side = P.side * 0.65, tf = desc.st.tf
        if (!dsc || dsc.side !== side) { if (dsc) dsc.breath.stop(); dsc = { side, breath: loopNoise(420, 'lowpass', 0.8, 0, side), tick: Math.floor(t), laughT: 4, prevTf: tf, rattle: null } }
        const hidden = 1 - Math.min(1, tf / 0.45)
        dsc.breath.set((0.012 + 0.03 * Math.max(0, Math.sin(t * 1.2))) * hidden * (dying ? 0 : 1), 0.2) // respira junto com as manchas
        if (!dying && tf < 0.05) {
          dsc.laughT -= dt; if (dsc.laughT <= 0) { chuckle(t, 0.035, null, side); dsc.laughT = 7 + R() * 8 }
          if (desc.st.kind === 'relogio' && Math.floor(t) !== dsc.tick) { // dois relógios: o verdadeiro regular, o falso atrasa, dobra ou pula
            dsc.tick = Math.floor(t)
            const tk = (d, pan, g) => clicks({ t: t + d, n: 1, i0: 0.01, i1: 0.01, f: 3800, q: 6, gain: g, dest: bus(0.3, false, pan) })
            tk(0, -side, 0.12)
            const r = R(); if (r > 0.12) tk(0.05 + R() * 0.25, side, 0.12); if (r > 0.85) tk(0.33, side, 0.1)
          }
        }
        // revelando: o objeto treme (som do material), estoura, e ele chega rindo
        if (!dying) {
          const m = MAT[desc.st.kind] || MAT.quadro
          if (tf > dsc.prevTf && tf > 0.02 && tf < 0.5 && R() < dt * 30) clicks({ t, n: 3, i0: 0.012, i1: 0.008, f: m.f * (0.9 + R() * 0.2), q: m.q, gain: 0.05 + 0.15 * tf / 0.5 })
          if (dsc.prevTf < 0.5 && tf >= 0.5) { if (!desc.st.out) splinter(t, desc.st.kind, 0.35); cackle(t + 0.15, 0.16) }
          if (tf > dsc.prevTf && dsc.prevTf === 0 && !desc.st.out) tone({ t, f: 35, f2: 60, dur: 0.5, a: 0.3, gain: 0.3, lp: 120 }) // a pressão sobe antes de romper
          if (tf >= 0.9 && chase) {
            dsc.laughT -= dt; if (dsc.laughT <= 0) { if (R() < 0.6) cackle(t, 0.14, null, 0.4 + R() * 0.4); else chatter(t, 0.12); dsc.laughT = 1.6 + R() * 1.8 }
            gdT -= dt; if (gdT <= 0) { demon(t, 0.7, 0.07, null, 58, 'a'); gdT = 4 + R() * 3 }
          }
          if (tf >= 0.5) { gbT -= dt; if (gbT <= 0) { creatureBreath(t, { gain: chase ? 0.13 : 0.07, k: 0.9, chase, wet: true }); gbT = chase ? 0.5 + R() * 0.2 : 1.6 + R() * 0.8 } } // fora do objeto: respira molhado
        }
        dsc.prevTf = tf
      } else if (dsc) { dsc.breath.stop(); dsc = null }
      // A Garota: a caixinha toca enquanto ela brinca; na caça a música quebra, a barriga morde e as línguas se arrastam
      const gOn = ghost === 'garota' && ui.snd === 'on' && typeof garota !== 'undefined'
      if (gOn && !isCut) {
        const c = garota.S.chase, ext = garota.S.ext
        if (mbox && mbox.muf) mboxStop()
        mboxStart()
        if (!dying) { // a pausa dela: a corda acaba, a música para; depois de dar corda, volta do começo
          if (c > 0.5) mbox.mode = 'wrong'
          else if (garota.S.wind) { if (mbox.mode === 'play' || mbox.mode === 'wrong') { mbox.mode = 'wind'; mbox.slow = 1.25 } }
          else { if (mbox.mode === 'wind' || mbox.mode === 'stopped') { mbox.slow = 1; mbox.pitch = 0; mbox.i = 0; mbox.tNext = now() + 0.05 } mbox.mode = 'play' }
        }
        mboxTick()
        if (!grl) grl = { slither: loopNoise(650, 'bandpass', 1.4, 0), bite: 0, gig: 6 }
        grl.slither.set(ext * (0.05 + 0.04 * Math.sin(t * 4.2)) * (dying ? 0.3 : 1), 0.06)
        const bn = Math.floor(t * 7 / (2 * Math.PI) + 0.25) // uma mordida a cada ciclo da boca
        if (c > 0.6 && bn !== grl.bite && !dying) chomp(t, 0.16)
        if (c > 0.5 && !dying) {
          gdT -= dt; if (gdT <= 0) { demon(t, 0.9, 0.065, null, 62, 'a'); gdT = 3 + R() * 2 } // a boca da barriga rosna, muito mais grave que ela
          gbT -= dt; if (gbT <= 0) { creatureBreath(t, { gain: 0.09, k: 0.85, chase: true, wet: true }); gbT = 0.7 + R() * 0.3 }
        }
        grl.bite = bn
        grl.gig -= dt
        if (grl.gig <= 0 && !dying) { if (c > 0.5) giggle(t, 0.07); else if (mbox.mode === 'play' && R() < 0.6) mbox.hum = 6 + (R() * 4 | 0); else giggle(t, 0.02, bus(0.8, false, (R() - 0.5) * 1.4)); grl.gig = c > 0.5 ? 2.5 + R() * 2 : 9 + R() * 8 } // fora da caça: cantarola a valsa ou ri baixinho, longe
      } else {
        if (gOn && isCut) mboxTick() // no relatório, a caixinha ainda toca
        else if (ghost === 'casa' && cxV > 0.004 && !isCut && !dying) { if (mbox && !mbox.muf) mboxStop(); const fresh = !mbox; mboxStart(true); if (fresh) mbox.gain.gain.setValueAtTime(cxV, now()); mbox.mode = 'play'; mbox.gain.gain.setTargetAtTime(cxV, now(), 0.25); mboxTick() } // a demo da casa: a mesma valsa, atrás da porta do quarto dela
        else if (mbox) mboxStop()
        if (grl) { grl.slither.stop(); grl = null }
      }
      // O Amigo
      if (ghost === 'amigo' && ui.snd === 'on' && !isCut && typeof amigo !== 'undefined') amigoTick(t, dt, dying)
      // O Reflexo
      if (ghost === 'reflexo' && ui.snd === 'on' && !isCut && typeof reflexo !== 'undefined') reflTick(t, dt, dying); else reflStop()
      // O Observador
      if (ghost === 'observador' && ui.snd === 'on' && !isCut && typeof observador !== 'undefined') obsTick(t, dt, dying); else obsStop()
      // O Mordomo
      if (ghost === 'mordomo' && ui.snd === 'on' && typeof mordomo !== 'undefined') mordTick(t, dt, dying); else mordStop()
      use3D = false
      // a caça (e a morte, até o corte) tem trilha e coração
      const bandoK = ghost === 'bando' && typeof demo !== 'undefined' ? demo.bandoTheme() : null
      const hunting = (ghost === 'mae' || (ghost === 'demo' && lutaOn && !demoHush) || !!bandoK || ghost === 'sombra' || ghost === 'espectral' || ghost === 'glutao' || (ghost === 'amigo' && typeof amigo !== 'undefined' && amigo.S.q > 0.5) || (ghost === 'observador' && typeof observador !== 'undefined' && observador.S.q > 0.5) || (ghost === 'garota' && typeof garota !== 'undefined' && garota.S.chase > 0.5) || (ghost === 'desc' && typeof desc !== 'undefined' && desc.st.tf > 0.45)) && ui.snd === 'on' && !isCut && (chaseAny || dying || !!bandoK) && !calmSeq
      if (hunting) {
        const cg = ghost === 'bando' ? (bandoK && MUS.buf.bando ? 'bando' : bandoK) : ghost === 'demo' ? (MUS.buf.maeDemo ? 'maeDemo' : 'mae') : (ghost === 'espectral' || ghost === 'glutao') && MUS.buf.bando ? 'bando' : COMBAT[ghost] ? ghost : null // a demo toca a música de batalha da Mãe (arquivo); sem o arquivo, a sintetizada // no laboratório: a música de combate sintetizada de cada um
        if (cg && MUS.curK !== cg) musPlay(cg)
        const combatOn = musOwns() || !!cg
        if (combatOn) chaseStop(); else chaseStart()
        if (!combatOn) { heartT -= dt; if (heartT <= 0) { heartbeat(t, 0.55); heartT = dying ? 0.33 : 0.4 } } // com a música de combate, o coração sai (a batida é dela)
        if (dying && combatOn && !MUS.dyingDuck) { MUS.dyingDuck = true; MUS.duck.gain.setTargetAtTime(0.35, t + 0.3, 0.25) }
        if (ghost === 'garota' && chaseL && !chaseL.soft) { chaseL.soft = true; chaseL.g.gain.setTargetAtTime(0.12, t + 0.4, 0.3) } // a banda da caixinha manda
        if (dying && chaseL && !chaseL.ducked) { chaseL.ducked = true; chaseL.g.gain.setTargetAtTime(0.13, t + 0.3, 0.25) } // abre espaço para o grito
      } else { chaseStop(isCut); if (MUS.curK && ghost !== 'casa') musPlay(null, isCut) } // na casa, quem manda na trilha é ela (SFX.music)
      if (!dying && MUS.dyingDuck) { MUS.dyingDuck = false; MUS.duck.gain.setTargetAtTime(1, t, 0.3) }
    }
    // ---------- A Mãe na luta: o Luto (mergulho, bolhas, investida), as garradas, o ofego, o grito ----------
    function gloop(t, f, gain, dest) { tone({ t, f, f2: f * 2.6, dur: 0.06, a: 0.004, r: 0.05, gain, dest }); noise({ t, dur: 0.03, f: f * 3, q: 3, gain: gain * 0.35, r: 0.04, dest }) } // uma bolha de líquido grosso
    function liquid(t, dur, gain, dest) { // o Luto espirrando
      noise({ t, dur, a: 0.004, r: dur * 0.7, type: 'lowpass', f: 1000, f2: 200, gain, dest })
      noise({ t, dur: dur * 0.5, a: 0.002, r: 0.12, f: 1900, f2: 550, q: 1.1, gain: gain * 0.45, dest })
      for (let i = 0; i < 7; i++) gloop(t + 0.03 + R() * dur * 0.9, 140 + R() * 360, gain * 0.45, dest)
    }
    function maePant(t, dest, k = 1) { // ofego: puxa o ar rasgado e solta gemendo
      noise({ t, dur: 0.16 * k, a: 0.03, r: 0.04, f: 1200, f2: 2200, q: 3.5, gain: 0.14, dest })
      voice({ t: t + 0.19 * k, dur: 0.28 * k, f: 70 + R() * 20, f2: 52, vowel: 'a', gain: 0.13, grit: 3.5, fry: 0.7, fryHz: 30, air: 0.5, r: 0.12, dest })
      if (R() < 0.6) clicks({ t: t + 0.22 * k, n: 6 + (R() * 6 | 0), i0: 0.02, i1: 0.03, f: 300, q: 2.2, gain: 0.1, dest })
    }
    function lutaEvent(kind) {
      if (!ctx || ui.snd !== 'on' || ctx.state !== 'running') return
      const t = now(), d = maeBus()
      switch (kind) {
        case 'mergulho': liquid(t, 0.5, 0.42, d); tone({ t, f: 92, f2: 36, dur: 0.38, r: 0.25, gain: 0.35, lp: 220, dest: d }); break
        case 'bolha': gloop(t, 120 + R() * 260, 0.13, d); break
        case 'ronco': tone({ t, f: 40, f2: 58, dur: 1.9, a: 0.5, r: 0.4, gain: 0.26, lp: 140, dest: d }); noise({ t, dur: 1.9, a: 0.6, r: 0.3, type: 'lowpass', f: 180, gain: 0.12, dest: d }); break // o chão estufando
        case 'investida': liquid(t, 0.65, 0.6, d); thump(t, 66, 0.45, d); maeShriek(t + 0.03, d); break
        case 'preparo': voice({ t, dur: 0.2, f: 150, f2: 230, vowel: 'a', gain: 0.08, grit: 3, fry: 0.5, r: 0.06, dest: d }); noise({ t, dur: 0.2, a: 0.1, r: 0.04, f: 700, f2: 1300, q: 0.8, gain: 0.07, dest: d }); break
        case 'garra': noise({ t, dur: 0.11, a: 0.008, r: 0.08, f: 800, f2: 3400, q: 0.9, gain: 0.24, dest: d }); voice({ t, dur: 0.17, f: 360, f2: 560, vowel: 'a', gain: 0.13, grit: 4, r: 0.06, dest: d }); crack(t + 0.015, 0.1, d); break
        case 'acerto': thump(t, 95, 0.4); noise({ t, dur: 0.07, f: 2400, q: 1, gain: 0.2, r: 0.06 }); break // no agente: sai do lugar dele
        case 'ofego': for (let i = 0; i < 3; i++) maePant(t + i * 0.62, d, 1 + i * 0.15); break
        case 'grito': scream(t, 1.1, 520, 880, 0.2, d); voice({ t: t + 1.05, dur: 0.7, f: 250, f2: 130, vowel: 'o', gain: 0.12, grit: 3, vib: [6, 22], r: 0.35, dest: d }); thump(t + 0.6, 70, 0.3, d); break
        case 'soluco': voice({ t, dur: 0.24, f: 250 + R() * 70, f2: 190, vowel: 'u', gain: 0.07, grit: 2.5, vib: [8, 25], air: 0.4, r: 0.1, dest: d }); break
        case 'cambaleio': voice({ t, dur: 0.55, f: 190, f2: 115, vowel: 'o', gain: 0.15, grit: 4, fry: 0.6, fryHz: 32, r: 0.15, dest: d }); thump(t + 0.3, 110, 0.14, d); thump(t + 0.75, 105, 0.12, d); break
        case 'finta': liquid(t, 0.35, 0.3, d); voice({ t: t + 0.05, dur: 0.5, f: 720, f2: 1150, f3: 820, vowel: 'e', gain: 0.13, grit: 4, vib: [11, 40], r: 0.1, dest: d }); break
        case 'escorre': noise({ t, dur: 2.4, a: 0.4, r: 0.8, type: 'lowpass', f: 650, f2: 380, gain: 0.13, dest: d }); for (let i = 0; i < 16; i++) gloop(t + R() * 2.6, 110 + R() * 300, 0.08, d); break // o corpo saindo do Luto
        case 'guincho': maeShriek(t, d); break
        case 'acende': tone({ t: t + 0.7, f: 118, dur: 0.9, a: 0.01, r: 0.4, gain: 0.05, lp: 500 }); noise({ t: t + 0.7, dur: 0.04, f: 3200, q: 2, gain: 0.14 }); noise({ t: t + 1.05, dur: 0.03, f: 3000, q: 2, gain: 0.1 }); break // a lâmpada estala e acende
      }
    }
    // ---------- a demo da luta: os passos no Luto, a cambalhota, a voz do agente, o berço, o tornado, o vento ----------
    let wind = null
    function windSet(v) { // o vento do tornado: dois ruídos girando e um ronco grave
      if (!ctx || ctx.state !== 'running') return
      const w = ui.snd === 'on' && !isCut ? Math.max(0, v) : 0
      if (!wind && w > 0.02) wind = { a: loopNoise(320, 'bandpass', 0.7, 0, 0, true), b: loopNoise(1300, 'bandpass', 1.4, 0, 0, true), c: loopNoise(90, 'lowpass', 0.7, 0, 0, true) }
      if (!wind) return
      const t = now()
      wind.a.set(0.2 * w * (0.75 + 0.25 * Math.sin(t * 1.3)), 0.25); wind.b.set(0.06 * w * (0.6 + 0.4 * Math.sin(t * 2.3 + 1)), 0.25); wind.c.set(0.25 * w, 0.3)
      wind.a.fl.frequency.setTargetAtTime(260 + 140 * Math.sin(t * 0.7), t, 0.3)
      if (w <= 0.02) { wind.a.stop(); wind.b.stop(); wind.c.stop(); wind = null }
    }
    function agentVoice(t, dur, f, f2, vowel, gain) { voice({ t, dur, f, f2, vowel, gain, grit: 2.2, fry: 0.4, fryHz: 40, air: 0.35, a: 0.012, r: 0.08, sc: 0.9, dest: bus(0.12) }) } // a voz dele: grave, curta, sem sair do lugar dela
    function demoEvent(kind, a) {
      if (!ctx || ui.snd !== 'on' || isCut || ctx.state !== 'running') return
      const t = now()
      switch (kind) {
        case 'passo': { const run = a.run || 0, k = 0.6 + 0.4 * (a.k || 1)
          if (a.luto) { // no Luto: o tapa molhado, uma bolha, o pé desgrudando
            noise({ t, dur: 0.07 + 0.04 * run, a: 0.002, r: 0.09, type: 'lowpass', f: 1300 + 500 * run, f2: 380, gain: (0.09 + 0.08 * run) * k, wet: 0.12 })
            noise({ t: t + 0.01, dur: 0.05, a: 0.004, r: 0.05, f: 2300, f2: 900, q: 1.6, gain: (0.035 + 0.04 * run) * k, wet: 0.1 })
            gloop(t + 0.06 + R() * 0.05, 140 + R() * 160, (0.045 + 0.03 * run) * k)
            if (R() < 0.5) noise({ t: t + 0.12 + R() * 0.05, dur: 0.06, a: 0.02, r: 0.04, f: 900, f2: 1800, q: 2.2, gain: 0.02 * k })
            thump(t, 70, (0.05 + 0.06 * run) * k)
          } else if (a.surf === 'pedra') { // o ladrilho e a pedra: o salto estala e o salão devolve
            thump(t, 120, (0.08 + 0.08 * run) * k); noise({ t, dur: 0.022, a: 0.001, r: 0.035, f: 2500 + R() * 700, q: 1.3, gain: (0.05 + 0.04 * run) * k, wet: 0.45 })
            noise({ t: t + 0.03, dur: 0.035, a: 0.004, r: 0.05, f: 1400, q: 0.8, gain: 0.014 * k, wet: 0.5 })
          } else if (a.surf === 'metal') { thump(t, 104, (0.07 + 0.07 * run) * k); clicks({ t, n: 2, i0: 0.004, i1: 0.006, f: 2200 + R() * 700, q: 9, gain: (0.04 + 0.04 * run) * k }); tone({ t, f: 480 + R() * 90, dur: 0.01, r: 0.3, gain: 0.012 * k, lp: 2200, wet: 0.5 }) // a chapa xadrez: o passo ressoa
          } else if (a.surf === 'tapete') { thump(t, 72, (0.06 + 0.07 * run) * k); noise({ t, dur: 0.07, a: 0.012, r: 0.06, type: 'lowpass', f: 520, gain: (0.026 + 0.02 * run) * k }) } // o tapete abafa
          else if (a.surf === 'escada') { thump(t, 86, (0.14 + 0.12 * run) * k); noise({ t, dur: 0.05, type: 'lowpass', f: 950, gain: (0.04 + 0.03 * run) * k }); if (R() < 0.35) creak(t + 0.03, 0.045) } // o degrau oco range
          else if (a.surf === 'cascalho') { noise({ t, dur: 0.09 + 0.04 * run, a: 0.004, r: 0.07, f: 3100, f2: 1700, q: 0.6, gain: (0.055 + 0.04 * run) * k }); clicks({ t: t + 0.005, n: 3 + (R() * 4 | 0), i0: 0.012, i1: 0.022, f: 3400, q: 3, gain: 0.03 * k }); thump(t, 70, 0.04 * k) }
          else if (a.surf === 'grama') { noise({ t, dur: 0.12, a: 0.02, r: 0.08, f: 2300, f2: 1300, q: 0.5, gain: (0.024 + 0.02 * run) * k }); thump(t, 60, 0.035 * k) }
          else { thump(t, 95, (0.12 + 0.12 * run) * k); noise({ t, dur: 0.05, type: 'lowpass', f: 1100, gain: (0.04 + 0.03 * run) * k }); if (R() < (a.surf === 'tabua' ? 0.28 : 0.15)) creak(t + 0.02, a.surf === 'tabua' ? 0.04 : 0.03) } // na madeira (em cima, a tábua corrida range mais)
        } break
        case 'esquiva': noise({ t, dur: 0.28, a: 0.03, r: 0.08, f: 500, f2: 1500, q: 0.9, gain: 0.08 }); agentVoice(t, 0.12, 150, 120, 'u', 0.05); thump(t + 0.3, 75, 0.22); noise({ t: t + 0.3, dur: 0.12, type: 'lowpass', f: 900, f2: 300, gain: 0.07, r: 0.1 }); break
        case 'quase': noise({ t, dur: 0.2, a: 0.01, r: 0.1, f: 1800, f2: 600, q: 1.2, gain: 0.06 }); break // a garra passou raspando
        case 'dor': agentVoice(t, 0.16, 165 + R() * 25, 125, 'a', 0.11); thump(t, 90, 0.18); break
        case 'dorForte': agentVoice(t, 0.32, 185 + R() * 20, 110, 'a', 0.14); thump(t, 70, 0.32); noise({ t, dur: 0.1, type: 'lowpass', f: 1400, gain: 0.08 }); break
        case 'morte': agentVoice(t, 0.55, 170, 85, 'o', 0.13); thump(t + 0.75, 60, 0.4); noise({ t: t + 0.75, dur: 0.18, type: 'lowpass', f: 700, f2: 200, gain: 0.12, r: 0.2 }); break
        case 'kitAbre': clicks({ t, n: 2, i0: 0.06, i1: 0.06, f: 2600, q: 5, gain: 0.08 }); noise({ t: t + 0.12, dur: 0.1, a: 0.02, f: 1600, q: 1, gain: 0.03 }); break
        case 'cura': noise({ t, dur: 0.35, a: 0.005, r: 0.15, type: 'highpass', f: 4200, gain: 0.07 }); clicks({ t, n: 1, i0: 0.01, i1: 0.01, f: 3200, q: 6, gain: 0.1 }); agentVoice(t + 0.25, 0.4, 120, 95, 'a', 0.05); [523, 784].forEach((f, i) => tone({ t: t + 0.1 + i * 0.07, f, dur: 0.25, a: 0.02, r: 0.4, gain: 0.025 })); break
        case 'kit': [660, 880].forEach((f, i) => tone({ t: t + i * 0.06, f, dur: 0.12, a: 0.01, r: 0.25, gain: 0.03 })); noise({ t, dur: 0.1, a: 0.01, r: 0.06, f: 1400, q: 0.9, gain: 0.05 }); break
        case 'kitSurge': tone({ t, f: 440, f2: 660, dur: 0.3, a: 0.05, r: 0.4, gain: 0.02 }); break
        case 'troca': clicks({ t, n: 2, i0: 0.05, i1: 0.12, f: 1900, q: 5, gain: 0.09 }); noise({ t: t + 0.08, dur: 0.12, a: 0.02, f: 900, f2: 1600, q: 1.2, gain: 0.04 }); break
        case 'roda': clicks({ t, n: 1, i0: 0.02, i1: 0.02, f: 2600, q: 6, gain: 0.045 }); noise({ t, dur: 0.07, a: 0.01, f: 2200, f2: 3200, q: 1.5, gain: 0.018 }); break // a roda de armas abrindo: um clique leve
        case 'crit': tone({ t, f: 1760, dur: 0.05, a: 0.002, r: 0.12, gain: 0.04 }); tone({ t: t + 0.03, f: 2640, dur: 0.04, a: 0.002, r: 0.1, gain: 0.025 }); break
        case 'maeDor': voice({ t, dur: 0.22, f: 520 + R() * 120, f2: 380, vowel: 'e', gain: 0.1, grit: 4, vib: [12, 30], r: 0.08, dest: maeBus() }); break // o tiro dói nela (sai da boca dela)
        case 'movelAviso': { creak(t, 0.08); creak(t + 0.35 + R() * 0.2, 0.05); noise({ t, dur: 1.2, a: 0.5, r: 0.5, type: 'lowpass', f: 300, f2: 120, gain: 0.08 }); break } // o teto que não existe range lá no escuro
        case 'movelCai': { const k = a || 1; thump(t, 52, 0.55 * k); thump(t + 0.02, 38, 0.4 * k); crack(t + 0.01, 0.35 * k); crack(t + 0.06, 0.2 * k); tone({ t, f: 90, f2: 40, dur: 0.5, r: 0.3, gain: 0.18 * k, lp: 200 })
          for (let i = 0; i < 6; i++) gloop(t + 0.05 + R() * 0.35, 160 + R() * 380, 0.05 * k) // o Luto espirrando
          for (let i = 0; i < 4; i++) noise({ t: t + 0.1 + i * 0.08 + R() * 0.05, dur: 0.05, a: 0.003, r: 0.05, f: 1400 + R() * 1800, q: 1.6, gain: 0.04 * k }) // lascas
          break }
        case 'movelSome': gloop(t, 120, 0.06); gloop(t + 0.15, 90, 0.05); noise({ t, dur: 0.9, a: 0.3, r: 0.4, type: 'lowpass', f: 500, f2: 200, gain: 0.05 }); break
        case 'racha': { const k = a || 1; crack(t, 0.22 * k); thump(t + 0.01, 48, 0.22 * k); tone({ t, f: 70, f2: 38, dur: 0.5, a: 0.01, r: 0.3, gain: 0.07 * k, lp: 160 })
          for (let i = 0; i < 5; i++) noise({ t: t + 0.08 + i * 0.07 + R() * 0.05, dur: 0.04 + R() * 0.05, a: 0.003, r: 0.05, f: 2500 + R() * 2500, q: 1.4, gain: 0.03 * k * (1 - i / 6) }) // caliça
          break }
        case 'barra': crack(t, 0.4); thump(t, 55, 0.6); tone({ t, f: 90, f2: 40, dur: 0.6, r: 0.4, gain: 0.3, lp: 200 }); glassTap(t + 0.02, 0.15); break
        case 'bercoDano': thump(t, 85, 0.25); crack(t, 0.12); tone({ t, f: 60, f2: 42, dur: 0.18, r: 0.15, gain: 0.12, lp: 160 }); break
        case 'bercoQuebra': scream(t + 0.1, 1.8, 480, 820, 0.18, maeBus()); tone({ t, f: 45, f2: 25, dur: 1.8, a: 0.02, r: 1.2, gain: 0.45, lp: 130 }); break
        case 'seca': noise({ t, dur: 3.2, a: 0.4, r: 1.0, type: 'highpass', f: 2600, f2: 6000, gain: 0.06 }); noise({ t, dur: 3.0, a: 0.3, r: 0.8, type: 'lowpass', f: 600, f2: 200, gain: 0.08 }); break
        case 'chuva': for (let i = 0; i < 40; i++) gloop(t + 0.2 + R() * 2.5, 200 + R() * 500, 0.05); noise({ t, dur: 2.6, a: 0.2, r: 0.8, type: 'lowpass', f: 1600, f2: 500, gain: 0.12 }); break
        case 'tornado': noise({ t, dur: 2.4, a: 1.6, r: 0.5, f: 200, f2: 900, q: 0.8, gain: 0.2 }); tone({ t, f: 40, f2: 70, dur: 2.4, a: 1.5, r: 0.5, gain: 0.22, lp: 150 }); break
        case 'empurrao': noise({ t, dur: 0.3, a: 0.01, r: 0.12, f: 600, f2: 200, q: 0.8, gain: 0.16 }); thump(t, 65, 0.3); break
        case 'enfraquece': tone({ t, f: 330, f2: 110, dur: 1.2, a: 0.05, r: 0.6, gain: 0.05 }); voice({ t: t + 0.1, dur: 0.9, f: 260, f2: 160, vowel: 'u', gain: 0.09, grit: 2.5, vib: [6, 20], r: 0.4, dest: maeBus() }); break
        case 'portaAbre': creak(t, 0.09); creak(t + 0.45, 0.06); noise({ t: t + 0.1, dur: 1.1, a: 0.3, r: 0.4, type: 'lowpass', f: 300, f2: 180, gain: 0.05 }); break
        case 'portaBate': thump(t, 70, 0.55); thump(t + 0.06, 110, 0.25); noise({ t, dur: 0.25, a: 0.004, r: 0.3, type: 'lowpass', f: 1400, f2: 300, gain: 0.22 }); clicks({ t: t + 0.02, n: 8, i0: 0.01, i1: 0.03, f: 900, q: 4, gain: 0.08 }); break
        case 'cortina': noise({ t, dur: 1.8, a: 0.3, r: 0.6, type: 'lowpass', f: 500, f2: 900, gain: 0.12 }); for (let i = 0; i < 10; i++) gloop(t + R() * 1.6, 120 + R() * 200, 0.06); thump(t + 0.05, 60, 0.3); break
        case 'vitoria': [392, 494, 587, 784].forEach((f, i) => tone({ t: t + 0.4 + i * 0.12, f, dur: 0.6, a: 0.02, r: 1.0, gain: 0.03 })); break
      }
    }
    window.__sfxGh = () => ghSp
    window.__sfxFx = () => ({ demon, creatureBreath, croak, sombraShriek, chuckle, cackle, giggle, ahem, windMoan, bugle, growl, whisper, sob, bearRoar, bus }) // para ouvir cada voz isolada
    function setGhostSnd(name) { ghost = name; gbT = 1; gdT = 3; if (ctx) { humStop(); chaseStop(); if (MUS.curK) musPlay(null); if (amb) amb.g.gain.setTargetAtTime(ambLevel(), now(), 0.8) } }
    const sombraHook = (k) => in3D(() => sombraEvent(k))
    const descHook = (k) => in3D(() => descEvent(k))
    const amigoHook = (k) => in3D(() => amigoEvent(k))
    const espHook = (k) => in3D(() => espEvent(k))
    const stepHook = (k, f) => in3D(() => step(k, f)), idleHook = (k) => in3D(() => idleEvent(k))
    function setOn(on) { boot(); if (!ctx) return; out.gain.setTargetAtTime(on ? 0.55 : 0, now(), 0.05); if (!on) { humStop(); chaseStop(true); mordStop(); obsStop(); reflStop() } }
    const live = () => !!ctx && ui.snd === 'on'
    return { boot, tick, step: stepHook, death, cut, card, endDeath, setGhost: setGhostSnd, setOn, maeStep, setOccluder: (f) => (occluder = f), sombra: sombraHook, desc: descHook, amigo: amigoHook, esp: espHook, idle: idleHook, fps: fpsEvent, voice: (w, n) => voiceEvent(w, n), music: (k) => { MUS.want = k; MUS.lastSet = ctx ? now() : -9; if (ctx && !MUS.loading) musLoad() }, combatPreview: (n, s) => combatPreview(n, s), musicState: () => ({ cur: MUS.curK, playing: !!MUS.cur, loop: MUS.cur && MUS.cur.src ? [MUS.cur.src.loopStart, MUS.cur.src.loopEnd].map((v) => +v.toFixed(2)) : null, synth: !!(MUS.cur && MUS.cur.comb), bar: MUS.cur && MUS.cur.comb ? MUS.cur.comb.b : null, loaded: Object.keys(MUS.buf), active: MUS.active, cx: mbox ? { muf: mbox.muf, i: mbox.i } : null, ctx: ctx ? ctx.state : null }), crack: (g) => live() && crack(now(), g), luta: (k) => lutaEvent(k), demo: (k, a) => demoEvent(k, a), demoWind: (v) => windSet(v), caixinha: (v) => (cxV = v), live }
  })()
  addEventListener('pointerdown', () => SFX.boot())
  addEventListener('keydown', () => SFX.boot())
  const captions = {
    mae: '<b>A Mãe:</b> a cabeça é uma peça só, esculpida, e escurece junto com o corpo quando sai da luz.',
    sombraEscuro: '<b>No escuro:</b> o corpo anda em quadros picados enquanto o manto flutua liso. O preto dela é mais fundo que o próprio escuro.',
    sombraLuz: '<b>Na luz:</b> congela na pose e quase some. Sobram os olhos e um fio de fumaça.',
    sombraFraca: ' <b>Objeto quebrado:</b> a fumaça roxa a denuncia mesmo na luz.',
    descDisf: '<b>Disfarçado:</b> dois objetos iguais; o falso tem manchas escuras que pulsam devagar. O lado muda a cada troca.',
    refEsp: '<b>Espelho:</b> gire a câmera devagar e repare: o reflexo te imita com meio segundo de atraso.',
    refSangue: ' <b>Sangrando:</b> não atravesse agora. E veja quem está parado atrás de você.',
    refSusto: '<b>Susto:</b> o reflexo atravessa o vidro e o espelho quebra pelo resto da partida. Clique em Susto de novo para repetir.',
    obsOlha: '<b>Observando:</b> parado na borda da mata, só espera. Os olhos aparecem quando a luz bate neles.',
    obsSegue: ' <b>Cabeça:</b> gire a câmera em volta dele; ela acompanha você, mesmo pelas costas.',
    segue: ' <b>Cabeça:</b> gire a câmera em volta; o rosto acompanha você por cima do que o corpo está fazendo.',
    obsLuz: ' Com a <b>lanterna</b> nele, recua para trás da árvore e cobre os olhos.',
    espRoda: '<b>Rodeando:</b> ronda você ondulando a espinha; só um do bando ataca por vez. Clique em <b>Estourar</b> para ver a morte dele.',
    espAtaque: '<b>Investida:</b> empina guinchando por 0,6 s (o aviso), dá o bote, morde e recua tonto por 1,5 s: a sua janela.',
    gluVaga: '<b>Vagando:</b> arrasta as garras pelo chão; as almas que ele devorou giram no núcleo, entre as costelas.',
    gluCaca: '<b>Caça:</b> alterna a pancada e a investida; a cada 30 s cospe uma alma. Só o núcleo leva dano cheio. Teste <b>Cuspir</b>, <b>Devorar</b> (suga um dos que ele cuspiu) e <b>Explodir</b>.',
    amigoVaga: '<b>Vagando:</b> manca arrastando a perna queimada, com a cabeça caída. De vez em quando, um grunhido baixo.',
    amigoCaca: '<b>Caça:</b> vem grunhindo, com os braços esticados para você. Mude para <b>Longe</b> para ver as pernas de aranha, ou clique em <b>Arrombar</b>.',
    amigoAranha: '<b>Longe:</b> o zíper das costas abre, o corpo é erguido e seis pernas de aranha correm por ele.',
    obsBote: '<b>Bote:</b> cai de quatro e vem galopando, com o pescoço esticado e a boca aberta.',
    mordVag: '<b>Vagando:</b> só se vê o tecido pontilhado e as luvas. Por onde ele passa, a luz falha.',
    mordRaj: '<b>Rajada:</b> vira vento: apaga as luzes, a lanterna engasga e quem encosta fica tonto e surdo por 4 s.',
    garotaPass: '<b>Brincando:</b> passiva enquanto ninguém encosta nela nem chega perto da caixinha. Repare na costura de dentes na barriga.',
    garotaCaca: '<b>Caça:</b> a barriga se abre de lado a lado, morde o ar e solta as línguas atrás de você.',
    descRev: '<b>Revelado:</b> a transformação leva cerca de um segundo antes de ele poder matar. É a sua janela para correr.',
    idleMae: ' <b>Pausa:</b> para, cala o cantarolar e escuta virando o ouvido; a mão sobe tateando o ar, e o pescoço estala para o outro lado.',
    idleSombra: ' <b>Pausa:</b> agacha e a cabeça de corvo pula de pose em pose, batendo o bico; no meio, gira até ficar de costas.',
    idleGarota: ' <b>Pausa:</b> a corda acaba e a bailarina para; ela espera, balança a cabeça e dá corda de novo.',
    descVaga: '<b>Fora do disfarce:</b> anda entre um disfarce e outro. Na pausa estuda o objeto ao lado, contorna a forma dele no ar e o corpo tenta copiá-lo.',
    idleAmigo: ' <b>Pausa:</b> fareja o ar de focinho erguido; depois se abraça e se embala, grunhindo baixo.',
    det: ' <b>Detector:</b> o que é sobrenatural brilha; o resto desbota.',
  };
  const GHOSTS = {
    demo: { eyebrow: 'C.R.O.S. · demo da luta', name: 'A Mãe · a luta', latin: 'terceira pessoa, por cima do ombro', tier: 'clique na tela para entrar',
      summary: 'A luta no berçário, jogável', notes: ['A entrada: na primeira tentativa você começa num corredor longo e escuro; na porta do fim, E abre e começa a cena (Espaço pula): ele entra no quarto seco e escuro, anda até perto do berço, ergue a arma, a Mãe sobe de trás do berço com o Luto se espalhando, grita (a porta bate atrás e vira Luto) e a barreira se forma. Nas outras tentativas, a luta começa direto.', 'A lanterna presa na arma segue a mira (faz sombra na luz Completa); o quarto ficou mais escuro. A Mãe anda pela ilha do berço e atravessa a própria barreira (só o berço ela contorna); os móveis afundam no Luto quando ela chega perto e voltam a subir uns segundos depois que ela se afasta.', 'O agente novo, no visual escolhido: esqueleto próprio, passada medida pela distância, pernas que giram para andar de lado e de costas, as duas mãos na arma por IK, coice, a bomba da escopeta, troca de arma, cambalhota, pancada e queda.',
        'Controles: W A S D andam para onde a câmera olha, Shift corre (fôlego), Espaço esquiva (cambalhota, invulnerável no meio), botão direito mira (a câmera chega no ombro), botão esquerdo atira, 1/2/3 ou a rodinha trocam a arma, Q volta para a anterior, F usa um kit, E recolhe a armadilha.',
        'As armas: a pistola de plasma esquenta 3% por tiro e trava 5 s em 100%; a escopeta (5 × 10 num leque) esquenta 30% por tiro e só esfria parada; a armadilha vai em arco (mirando, aparece a linha) e só segura ela enfraquecida.',
        'Os passos fazem barulho de Luto (o tapa molhado, uma bolha, o pé desgrudando) e abrem ondas no chão; na ilha do berço, e com o Luto seco, viram passos na madeira.',
        'Ela tem 1.400 de vida em quatro barras (20, 25, 25 e 30%). Cada barra zerada a deixa atordoada 6 s. Ofegando (exausta), o dano sobe 30%; tiro na cabeça vale o dobro; 120 de dano em 3 s a fazem cambalear.',
        'A barreira: desde a fase 1, um redemoinho de Luto preto e roxo gira em volta do berço (encostar tira 20 e joga para fora). Com ela atordoada, ele desaba e o berço acende em vermelho: é a hora de bater nele. Ela levanta, a barreira volta (o dano no berço fica).',
        'Fase 1: rodeia, mergulha, o chão brilha vermelho perto de você e ela sai numa investida; depois as garradas. Fase 2: a finta e a chuva de móveis (a cada 20 s, 4 móveis; círculo vermelho 1,5 s antes; 20 de dano). Fase 3: a sequência de investidas (errou, mergulha e tenta de novo, até 3; errou as 3, fica exausta mais tempo) e a chuva a cada 15 s, 6 móveis.',
        'Fase 4: a barreira cai de vez e o berço protege a última barra. Berço quebrado (200), o Luto seca e ela passa a correr em linha reta. A última barra zerada: enfraquecida por 12 s, a hora da armadilha.',
        'Você tem 200 de vida e começa com 1 kit (+60). Cada móvel que cai tem 20% de chance de soltar um kit (só um no chão por vez). A garrada tira 25; a investida e a carga, 35. Se cair, volta do começo da fase em que estava.',
        'B mostra os números da luta na tela; [ e ] mudam a sensibilidade do mouse.'] },
    intro: { eyebrow: 'C.R.O.S. · demo da Intro', name: 'Intro', latin: 'a instalação da C.R.O.S., subsolo 3', tier: 'clique na tela para entrar',
      summary: 'A primeira demo: do elevador ao Glutão', notes: ['O Glutão rompeu a contenção no subsolo 3 e soltou os Espectrais. Matheus Moura desce com a Lara e o Nicolas para recapturar o que escapou.',
        'A sequência: a eclusa e a barreira; a cena da lanterna no escritório e o tutorial da armadilha; a fuga da Lara e as três ondas no refeitório; os kits na enfermaria; o Glutão na usina, com os dois dentro da barriga; a cena do rádio e o relatório.',
        'A captura: zerados, os pequenos se desfazem numa poça por 4 s (o anel mostra o tempo). A armadilha na poça captura; se o tempo acabar, eles voltam com metade da vida. O Glutão também: zerado, ele se desfaz, e capturado, solta os dois.',
        'As armas não acabam, mas esquentam: a pistola de Demantino trava em 100%, a escopeta de sal grosso trava 8 s. Troque de arma (2, Q ou a roda) antes que travem.',
        'A planta (54 × 86 m, um andar só): a eclusa com o elevador e a barreira, o corredor de acesso, o escritório de turno, o corredor, o refeitório, o corredor de serviço com a enfermaria e a usina, com o núcleo da barreira ao fundo.',
        'Os corredores têm 5 m de largura (o dos fundos da casa tem 3,6 m); o refeitório tem 4,5 m de pé-direito e a usina, 12 m.',
        'As portas de correr e a grade abrem com E; as lacradas (o X amarelo) só avisam. A barreira, na saída da eclusa, deixa passar.',
        'Pontos de retorno: a caixa de latão com a lâmpada âmbar, na eclusa, no refeitório e na enfermaria.',
        'A luz é desenhada: o tubo aceso, o cone no ar e a mancha no chão. Quem ilumina são as luzes de brilho (as dez mais perto) e uma luz com sombra por cômodo. Algumas luminárias estão apagadas e algumas piscam; as de emergência giram em vermelho.',
        'Falas: cada personagem tem um som próprio, com legenda, até a dublagem. As cenas pulam com Espaço.'] },
    casa: { eyebrow: 'C.R.O.S. · demo da casa', name: 'A Casa', latin: 'Palacete Monteval, 1894', tier: 'clique na tela para entrar',
      summary: 'Da varanda ao berçário', notes: ['A planta é a da fatia em terceira pessoa (32 × 24 m). Térreo: o salão de pé-direito duplo com a escadaria no meio, a sala de jantar, a copa, a cozinha e o corredor dos fundos (que volta ao salão por uma porta no lambri). Em cima: o patamar e as galerias em volta do vão, o quarto principal, o quarto de vestir e o corredor dos fundos, onde fica a porta do berçário. O resto fica trancado (atrás da porta da Garota, a caixinha de música dela toca sozinha).',
        'O caminho: varanda, salão, escadaria, patamar, corredor dos fundos (3,6 m de largura), berçário. Desvios: a sala de jantar, a copa e a cozinha embaixo; o quarto principal e o de vestir em cima.',
        'Três Espectrais em dois encontros: um na sala de jantar e dois no patamar (vêm das galerias). O salão é calmo. Na briga, as portas da sala batem e só abrem quando ela fica limpa; a música de batalha é só a do Glutão (com os Espectrais, a de tensão).',
        'Na cozinha, o Glutão (opcional): anda atrás de você, a pancada de perto e a investida de longe; tiro no núcleo na hora da pancada dá o dobro e cancela. Nesta demo o núcleo dele está vazio (não cospe Espectral). Quando ele sobe, o agente para por 1 s. Derrubado, dá um kit.',
        'No corredor dos fundos de cima, a Mãe vem do fim do corredor, vira, a porta do berçário abre um palmo, ela entra e a porta bate. Ela ainda não ataca: a luta é lá dentro.',
        'Kits no aparador da sala de jantar, na mesa da cozinha e na cômoda do quarto principal. Lamparina acesa é ponto de retorno: varanda, salão, patamar (limpo) e quarto principal.',
        'A porta do berçário abre a tela de carregamento: a casa sai de cena e entra a luta da Mãe (o corredor, a cena de entrada e o berçário), com os kits que você juntou. Vencida a Mãe, o relatório mostra o tempo total e o seu melhor tempo.',
        'Os passos mudam com o chão (ladrilho, lajota, parquete, tapete, a escada que range, a tábua de cima, cascalho e grama). Encostado na parede, a câmera chega perto e o agente fica translúcido. O luar entra por duas luzes com sombra (a janela em arco sobre a porta e a do cômodo onde você está); a lanterna da arma; luzes de brilho para as lamparinas, as velas, o fogão e os próprios Espectrais.'] },
    bando: { eyebrow: 'C.R.O.S. · demo do bando', name: 'O Bando', latin: 'Espectrais e o Glutão, em ondas', tier: 'clique na tela para entrar',
      summary: 'Quatro ondas no berçário', notes: ['O mesmo agente, os mesmos controles e as mesmas armas da demo da Mãe, na mesma arena (sem a Mãe, a barreira e a chuva de móveis). A armadilha fica de fora.',
        'Onda 1: dois Espectrais. Onda 2: três. Onda 3: quatro, em duas levas de dois. Onda 4: o Glutão.',
        'Os Espectrais rondam você e só um ataca por vez: empina guinchando por 0,6 s (o aviso), dá o bote, morde (30) e fica tonto por 1,5 s, a sua janela. Vida 60; na cabeça, o dano vale 1,5×.',
        'O Glutão anda atrás de você. Pancada (35): ergue os braços e o núcleo acende por 1 s; um tiro no núcleo nessa hora dá o dobro e cancela o golpe. Longe dele, a investida curta (30).',
        'Fora do núcleo o Glutão leva só metade. A cada 30 s cospe um Espectral (no máximo 2 vivos); abaixo de 25% de vida, devora um deles e recupera metade. Morto, explode e solta as almas que sobraram.',
        'Você começa com 1 kit (+60) e ganha mais um a cada onda limpa. Se cair, volta do começo da onda em que estava.'] },
    espectral: { eyebrow: 'C.R.O.S. · teste visual 09', name: 'O Espectral', latin: 'fig. 9 — serpens spectralis', tier: 'inimigo comum · em bando',
      modes: ['Rodeando', 'Investida'], cams: ['Corpo', 'Rosto', 'Cauda'],
      summary: 'Como ele foi feito', notes: ['O rework: o véu rasgado e quatro farrapos do capuz com física (flutuam atrás dele), baba de ectoplasma pendurada na mandíbula, um coração de ectoplasma batendo entre as costelas (acelera no ataque), a garganta acende com a boca aberta, espinhos de osso ao longo das costas, a cauda abrindo em fiapos, a borda da membrana acesa e molas na cabeça, nos braços e nos dedos (passam do ponto e assentam).', 'Caveira sob um capuz de membrana azul transparente; só os pontos dos olhos brilham.', 'Corpo de serpente: 15 vértebras em corrente, cada uma seguindo a anterior com atraso; as quatro primeiras têm costelas.',
        'Dois braços de osso saem do capuz, com garras de três dedos.', 'A membrana envolve a espinha e solta fiapos pela cauda.',
        'Investida: 0,6 s de aviso (empina, guincha, os olhos acendem), o bote, a mordida (30 de dano) e 1,5 s tonto.', 'Morte: estoura em ectoplasma e os ossos caem.', 'Vida 60: dois tiros de escopeta de perto.'] },
    glutao: { eyebrow: 'C.R.O.S. · teste visual 10', name: 'O Glutão', latin: 'fig. 10 — gula spectralis', tier: 'inimigo comum · o mais forte',
      modes: ['Vagando', 'Caça'], cams: ['Corpo', 'Núcleo', 'Garras'],
      summary: 'Como ele foi feito', notes: ['O rework: farrapos pesados do manto pendurados nas costas e o véu com física (balançam na pancada, voam na investida), baba nas duas metades da mandíbula, a barriga balança atrasada e as almas empurram a membrana por dentro, espinhos de osso nas costas, a garganta acesa, a borda acesa e molas no pescoço, na cabeça, na mandíbula e nos braços.', 'A versão grande e evoluída do Espectral: 2,6 m, capuz enorme e caveira rachada de mandíbula longa.', 'Entre as costelas, o núcleo: as almas que ele devorou giram lá dentro.',
        'Braços de osso compridos; as garras quase arrastam no chão.', 'Pancada: ergue os braços e o núcleo acende por 1 s antes do golpe. Tiro no núcleo nessa hora: dano em dobro e cancela.',
        'Investida curta: se você se afasta mais de 6 m, arranca uns 4 m em linha reta.', 'Dano: no núcleo, normal; em qualquer outro lugar, só 50%.',
        'Começa com 3 almas no núcleo. A cada 30 s cospe uma (vira um Espectral): no máximo 2 vivos ao mesmo tempo e 3 por luta.', 'Devorar: abaixo de 25% de vida, suga um Espectral próximo e recupera 50%; a alma volta para o núcleo. Mate os pequenos e ele não tem do que se curar.',
        'Vida 400. Ao morrer, explode: as almas que sobraram escapam como Espectrais, tontas por 1,5 s. Solta a manivela.'] },
    amigo: { eyebrow: 'C.R.O.S. · teste visual 08', name: 'O Amigo', latin: 'fig. 8 — amicus combustus', tier: 'domínio · porão e sótão',
      modes: ['Vagando', 'Caça'], cams: ['Corpo', 'Rosto', 'Costas'],
      summary: 'Como ele foi feito', notes: ['Urso de pelúcia de 3 m, metade queimado; por baixo do pelo rasgado, carne, costelas e enchimento.', 'Um olho de botão morto; do lado queimado, um olho de verdade numa órbita funda.',
        'Braços e pernas grossos de pelúcia, rasgados mostrando músculo; patas almofadadas com garras longas e curvas.', 'Manca: a perna queimada é mais curta e vai arrastada.', 'Grunhe enquanto caça, aos trancos que sacodem o corpo; escorrem lágrimas escuras.',
        'Longe demais dele: o zíper das costas abre e saem seis pernas de aranha. É assim que compensa a lentidão.', 'Arromba portas: bate duas vezes e atravessa abaixado.', 'São dois por mansão. O objeto amaldiçoado é um urso pequeno, num baú do porão ou do sótão.'] },
    reflexo: { eyebrow: 'C.R.O.S. · teste visual 07', name: 'O Reflexo', latin: 'fig. 7 — imago perversa', tier: 'domínio · espelhos',
      modes: ['Espelho', 'Susto'], cams: ['Espelho', 'Rosto', 'Lado'],
      summary: 'Como ele foi feito', notes: ['Não é capturável: só mora nos espelhos de travessia.', 'O reflexo é você, um agente da C.R.O.S., com meio segundo de atraso.',
        'Espelho sangrando: há alguém parado atrás de você no reflexo.', 'Usar o espelho sangrando: os olhos escurecem, a mandíbula despenca e ele atravessa o vidro.',
        'O espelho quebra e fica inútil pelo resto da partida.', 'Travessia: a mão no vidro, o reflexo responde atrasado e puxa você; o espelho de destino sangra por 60 s.', 'Truque barato: o "reflexo" é um quarto espelhado atrás do vão, sem renderizar a cena duas vezes.'] },
    observador: { eyebrow: 'C.R.O.S. · teste visual 06', name: 'O Observador', latin: 'fig. 6 — spectator silvae', tier: 'domínio · lado de fora',
      modes: ['Observando', 'Bote'], cams: ['Corpo', 'Cabeça', 'Garras'], lights: ['Lanterna', 'Luar', 'Escuro'],
      summary: 'Como ele foi feito', notes: ['Humanoide de 2,6 m com traços de animal, magro até as costelas.', 'Crânio de cão sem lábios e chifres de cervo; tufos de pelo e espinhos nas costas.', 'Cabeça que segue o jogador e gira até ficar de costas.',
        'Olhos que só refletem a luz que bate neles.',
        'Com a lanterna nele, recua e cobre os olhos.', 'No bote, cai de quatro e galopa.'] },
    mordomo: { eyebrow: 'C.R.O.S. · teste visual 05', name: 'O Mordomo', latin: 'fig. 5 — famulus venti', tier: 'domínio · vento',
      modes: ['Vagando', 'Rajada'], cams: ['Corpo', 'Gola', 'Luvas'],
      summary: 'Como ele foi feito', notes: ['Fraque, colete e luvas brancas, sem ninguém dentro.', 'Quase invisível: o tecido some num pontilhado; as luvas são o que mais aparece.',
        'Gola vazia: não há cabeça nenhuma.', 'Carrega o apagador de velas; a outra mão fica na barriga, em postura de serviço.',
        'Na rajada, apaga as luzes, a lanterna engasga e o pano chicoteia.', 'O anel, objeto amaldiçoado dele, está na luva esquerda.'] },
    garota: { eyebrow: 'C.R.O.S. · teste visual 04', name: 'A Garota', latin: 'fig. 4 — puella cantrix', tier: 'domínio · quartos',
      modes: ['Brincando', 'Caça'], cams: ['Corpo', 'Rosto', 'Barriga'],
      summary: 'Como ela foi feita', notes: ['Jovem pálida de vestido florido desbotado; flutua acima do chão.', 'Segura a caixinha de música, com a bailarina girando.',
        'A barriga é uma boca vertical, com dentes afiados nas laterais.', 'Na caça, as abas se abrem e saem línguas em tentáculos.', 'Mesma pele no rosto, braços e nas abas da boca.', 'Só os olhos brilham.'] },
    desc: { eyebrow: 'C.R.O.S. · teste visual 03', name: 'O Desconhecido', latin: 'fig. 3 — mimus ignotus', tier: 'domínio · disfarce',
      modes: ['Disfarçado', 'Revelado'],
      summary: 'Como ele foi feito', notes: ['Seis disfarces, idênticos ao objeto real ao lado.', 'Manchas escuras de podridão, pulsando devagar, são a pista.',
        'No Detector, o falso brilha e o resto desbota.', 'As manchas se espalham, o objeto treme e desmorona: cerca de 1 s antes de atacar.',
        'Revelado: pescoço comprido em S, sobretudo e camisa rasgados, chapéu amassado.', 'Por baixo, carne e ossos à mostra, sorriso de orelha a orelha e órbitas vazias.'] },
    mae: { eyebrow: 'C.R.O.S. · teste visual 01 · v2', name: 'A Mãe', latin: 'fig. 1 — mater insomnis', tier: 'domínio · o Luto',
      summary: 'O que mudou (polimento)', notes: ['O Luto no corpo: mãos e mangas encharcadas de preto até perto do cotovelo, barra preta até o joelho, rasgo na saia.',
        'Lágrimas de Luto até o queixo; a boca baba preto pelo peito.', 'Garras compridas e curvas, que pegam a luz.',
        'Cabelo molhado: mais mechas, mais finas, até a cintura.', 'A apresentação nova (surgir): as duas mãos rompem o Luto tateando o ar, descem e agarram o chão, ela se puxa para fora curvada com o cabelo cobrindo o rosto, a coluna desenrola, a cabeça sobe por último, tomba e encara você antes do guincho. Andando, os braços balançam soltos (cotovelo e mão atrasados) e os ombros giram contra o quadril.', 'Movimento: molas no lugar do amortecimento simples (cada parte acelera, passa um pouco e assenta, no seu tempo: o quadril puxa, a mão chicoteia por último), inércia (inclina ao arrancar e frear, deita nas curvas, o peito vira antes do quadril), dedos fecham em cascata. A coluna dobra em dois lugares (cintura e peito, o corpete curva), a clavícula sobe com o braço erguido e parte da torção vai para o antebraço.', 'Vestido de pano: a saia balança, atrasa nas viradas, voa na investida, amontoa quando ela ajoelha e boia no Luto; molhada, pesa e murcha. O rasgo abre, a barra é desfiada, as fitas do laço e os punhos balançam.', 'Ela pinga: das garras, da barra, do cabelo e do queixo.',
        'Os olhos acendem em vermelho na caça e na luta.', 'Luta no berçário: surgir, rodear, mergulhar, aviso vermelho, investida, garradas, parada, cambaleio, atordoada e finta.'] },
    sombra: { eyebrow: 'C.R.O.S. · teste visual 02', name: 'A Sombra', latin: 'fig. 2 — umbra corvina', tier: 'domínio · escuridão',
      summary: 'Como ela foi feita', notes: ['Corpo de preto absoluto: não recebe luz nenhuma.', 'Crânio de corvo; o bico sai do capuz e estala na caça.', 'Manto com capuz em tiras, flutuando sem parar.',
        'O corpo anima em quadros picados; o manto, contínuo.', 'Falhas: o corpo racha em faixas, partes saltam e os olhos duplicam.',
        'Na luz congela e some piscando: sobram os olhos.', 'Objeto quebrado: fumaça roxa visível até na luz.'] },
  }

