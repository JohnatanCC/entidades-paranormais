    // ---------- o HUD (como no concept): as quatro barras dela em cima, a vida embaixo à esquerda, a Adaptadora à direita ----------
    // =====================================================================
    const css = document.createElement('style')
    css.textContent = `
#demoHud { position: fixed; inset: 0; pointer-events: none; font-family: var(--body); color: var(--fg); }
#demoHud[hidden], #demoHud [hidden] { display: none !important; }
#demoHud .dh-cine { position: absolute; inset: 0; pointer-events: none; --lb: 0; }
#demoHud .dh-cine i { position: absolute; left: 0; right: 0; height: calc(11vh * var(--lb)); background: #000; }
#demoHud .dh-cine i.t { top: 0; } #demoHud .dh-cine i.b { bottom: 0; }
#demoHud .dh-cine span { position: absolute; right: max(16px, env(safe-area-inset-right, 0px)); bottom: calc(11vh * var(--lb) - 28px); opacity: calc(var(--lb) * 0.8); font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--muted); }
#demoHud:not(.cine) .dh-cine span { display: none; }
#demoHud.cine > :not(.dh-cine):not(.dh-banner):not(.dh-over):not(.dh-toast):not(.dh-subs) { opacity: 0 !important; transition: opacity 0.3s; }
#demoHud .dh-toast { display: none !important; } /* as falas e os avisos agora vão para a pilha de legendas, embaixo */
#demoHud .dh-subs { position: absolute; left: 50%; bottom: calc(168px + env(safe-area-inset-bottom, 0px)); transform: translateX(-50%); width: min(92%, 980px); display: flex; flex-direction: column; align-items: center; gap: 6px; pointer-events: none; z-index: 1; transition: bottom 0.3s; }
#demoHud .dh-sub { max-width: 100%; box-sizing: border-box; padding: 7px 16px; background: rgba(7,8,10,0.76); border: 1px solid var(--line); font-size: 21px; line-height: 1.3; text-align: center; color: #f2eee4; text-shadow: 0 1px 2px #000; overflow: hidden; animation: subIn 0.35s ease-out; transition: opacity 0.4s, transform 0.4s; }
#demoHud .dh-sub b { font-weight: 600; margin-right: 0.35em; }
#demoHud .dh-sub.old { opacity: 0.72; transform: scale(0.94); } /* as de antes sobem e ficam um pouco menores */
#demoHud .dh-sub.out { opacity: 0; }
@keyframes subIn { from { max-height: 0; opacity: 0; padding-top: 0; padding-bottom: 0; } to { max-height: 140px; opacity: 1; } }
#demoHud.cine > .dh-subs { bottom: calc(11vh + 16px); } /* na cena: logo acima da faixa preta */
#demoHud.cine .dh-sub { background: rgba(0,0,0,0.55); border-color: transparent; }
@media (max-width: 760px) { #demoHud .dh-sub { font-size: 16px; } }
#demoHud .dh-prompt { position: absolute; left: 50%; top: calc(50% + 52px); transform: translateX(-50%); font-family: var(--display); font-size: 24px; letter-spacing: 0.05em; color: var(--fg); text-shadow: 0 1px 3px #000; white-space: nowrap; }
#demoHud .dh-prompt:empty { display: none; }
.dh-boss { position: absolute; left: 50%; top: calc(14px + env(safe-area-inset-top, 0px)); transform: translateX(-50%); width: min(800px, calc(100% - 32px)); display: grid; gap: 6px; transition: opacity 0.6s; }
.dh-top { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; text-shadow: 0 1px 2px #000; }
.dh-name { font-family: var(--display); font-size: 22px; letter-spacing: 0.3em; }
.dh-phase { font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--lamp); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.dh-bars { display: flex; gap: 4px; height: 9px; }
.dh-bar { position: relative; background: rgba(255,255,255,0.09); box-shadow: 0 1px 3px #000; overflow: hidden; }
.dh-bar i, .dh-bar u { position: absolute; inset: 0; transform-origin: left; }
.dh-bar i { background: #b3433c; }
.dh-bar u { background: rgba(255,226,190,0.6); }
.dh-bar.cur { outline: 1px solid rgba(255,255,255,0.45); outline-offset: 1px; }
.dh-bar.lock i { background: repeating-linear-gradient(135deg, #6a6672 0 5px, #4a4752 5px 10px); }
.dh-bars.weak .dh-bar.cur, .dh-bars.weak .dh-bar:last-child { outline: 1px solid #b98aff; animation: dhPulse 0.8s steps(2) infinite; }
@keyframes dhPulse { 50% { outline-color: transparent } }
.dh-crib { display: flex; gap: 8px; align-items: center; font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--lamp); justify-self: center; width: min(320px, 60%); text-shadow: 0 1px 2px #000; }
.dh-crib .cb { flex: 1; height: 5px; background: rgba(255,255,255,0.1); } .dh-crib .cb i { display: block; height: 100%; background: var(--lamp); transform-origin: left; }
.dh-cross { position: absolute; left: 50%; top: 50%; width: 0; height: 0; --g: 10px; --c: rgba(217,208,189,0.9); }
.dh-cross i { position: absolute; background: var(--c); box-shadow: 0 0 2px #000; }
.dh-cross .t, .dh-cross .b { width: 2px; height: 7px; left: -1px; } .dh-cross .t { bottom: var(--g); } .dh-cross .b { top: var(--g); }
.dh-cross .l, .dh-cross .r { width: 7px; height: 2px; top: -1px; } .dh-cross .l { right: var(--g); } .dh-cross .r { left: var(--g); }
.dh-cross .c { width: 3px; height: 3px; left: -1.5px; top: -1.5px; border-radius: 50%; }
.dh-cross.trap .t, .dh-cross.trap .b, .dh-cross.trap .l, .dh-cross.trap .r { display: none; }
.dh-ring { position: absolute; left: 50%; top: 50%; width: 76px; height: 76px; transform: translate(-50%, -50%); --rc: #e8c48a; transition: opacity 0.2s; }
.dh-ring svg { width: 100%; height: 100%; display: block; overflow: visible; }
.dh-ring circle { fill: none; stroke-width: 3; }
.dh-ring .bg { stroke: rgba(255,255,255,0.1); }
.dh-ring .fg { stroke: var(--rc); stroke-dasharray: 163.36; stroke-dashoffset: 163.36; transform: rotate(-90deg); transform-origin: 38px 38px; }
.dh-ring .sh { stroke: rgba(0,0,0,0.55); stroke-width: 5; }
.dh-ring.hot .fg { animation: dhRingBlink 0.5s steps(2) infinite; }
@keyframes dhRingBlink { 50% { stroke: #5a1008; } }
.dh-ring em { position: absolute; left: 50%; top: calc(100% + 2px); transform: translateX(-50%); font-style: normal; font-size: 11px; letter-spacing: 0.12em; color: #ff8a7a; white-space: nowrap; text-shadow: 0 1px 2px #000; }
.dh-ring em:empty { display: none; }
.dh-mark { position: absolute; left: 50%; top: 50%; width: 0; height: 0; opacity: 0; --m: #fff; }
.dh-mark i { position: absolute; width: 2px; height: 8px; left: -1px; top: -4px; background: var(--m); box-shadow: 0 0 2px #000; }
.dh-mark i:nth-child(1) { transform: rotate(45deg) translateY(-10px); } .dh-mark i:nth-child(2) { transform: rotate(135deg) translateY(-10px); }
.dh-mark i:nth-child(3) { transform: rotate(225deg) translateY(-10px); } .dh-mark i:nth-child(4) { transform: rotate(315deg) translateY(-10px); }
.dh-mark em { position: absolute; top: 18px; left: 0; transform: translateX(-50%); font-style: normal; font-family: var(--display); font-size: 18px; letter-spacing: 0.08em; color: var(--m); white-space: nowrap; text-shadow: 0 1px 2px #000; }
.dh-mark.crit { --m: #ff9a5a; } .dh-mark.crit i { height: 11px; } .dh-mark.shield { --m: #8a8794; } .dh-mark.esquiva, .dh-mark.cambaleio { --m: var(--lamp); }
.dh-mark.esquiva i, .dh-mark.cambaleio i, .dh-mark.cancel i { display: none; } .dh-mark.cancel { --m: #9ff0ff; }
.dh-life { position: absolute; left: max(16px, env(safe-area-inset-left, 0px)); bottom: calc(18px + env(safe-area-inset-bottom, 0px)); width: min(300px, 42vw); display: grid; gap: 5px; text-shadow: 0 1px 2px #000; }
.dh-lbl { font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--muted); }
.dh-hp { display: flex; align-items: center; gap: 10px; } .dh-hp .hb { flex: 1; height: 6px; background: rgba(255,255,255,0.1); } .dh-hp .hb i { display: block; height: 100%; background: #cfc6b4; transform-origin: left; }
.dh-hp span { font-variant-numeric: tabular-nums; font-size: 12px; min-width: 7ch; text-align: right; } .dh-hp.low .hb i { background: var(--accent); } .dh-hp.low span { color: #ff8a7a; }
.dh-st { height: 3px; background: rgba(255,255,255,0.08); } .dh-st i { display: block; height: 100%; background: #8fb4c8; transform-origin: left; } .dh-st.lock i { background: #6a4a46; }
.dh-kits { font-size: 11px; color: var(--muted); } .dh-kits b { color: #b8ffd8; font-weight: 500; }
.dh-weap { position: absolute; right: max(16px, env(safe-area-inset-right, 0px)); bottom: calc(18px + env(safe-area-inset-bottom, 0px)); display: grid; gap: 5px; justify-items: end; text-align: right; text-shadow: 0 1px 2px #000; }
.dh-wname { font-family: var(--display); font-size: 24px; letter-spacing: 0.06em; line-height: 1; }
.dh-wsub { font-size: 11px; color: var(--muted); max-width: 46vw; } .dh-wsub.hot { color: #ff8a7a; } .dh-wsub.ok { color: #b8ffd8; }
.dh-heat { width: 160px; height: 4px; background: rgba(255,255,255,0.1); } .dh-heat i { display: block; height: 100%; background: #7affe0; transform-origin: left; }
.dh-heat.warm i { background: #ffd060; } .dh-heat.hot i { background: #ff3a2a; }
.dh-slots { display: flex; gap: 4px; margin-top: 2px; } .dh-slot { width: 36px; height: 32px; border: 1px solid var(--line); background: rgba(7,8,10,0.6); position: relative; display: grid; place-items: center; color: var(--muted); }
.dh-slot.sel { border-color: var(--fg); background: rgba(217,208,189,0.14); color: var(--fg); } .dh-slot .k { position: absolute; left: 3px; top: 0; font-family: var(--display); font-size: 13px; line-height: 1.1; } .dh-slot svg { width: 19px; height: 19px; }
.dh-life, .dh-weap { display: none !important; } /* o HUD do conceito C (mostradores) substitui os dois */
.dh-vg { --s: clamp(150px, 21vmin, 240px); position: absolute; left: max(22px, env(safe-area-inset-left, 0px)); bottom: calc(20px + env(safe-area-inset-bottom, 0px)); width: var(--s); height: var(--s); }
.dh-vg svg, .dh-wg > svg { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
.dh-vg .bk, .dh-wg .bk { fill: rgba(11,10,9,0.86); }
.dh-vg .tr, .dh-vg .fl, .dh-vg .str, .dh-vg .sfl, .dh-wg .tr, .dh-wg .fl { fill: none; stroke-linecap: round; transform: rotate(135deg); transform-origin: 100px 100px; }
.dh-vg .tr { stroke: #2a2622; stroke-width: 15; } .dh-vg .fl { stroke: var(--hc, #7ad08a); stroke-width: 15; transition: stroke 0.3s; }
.dh-vg .str { stroke: rgba(143,180,200,0.14); stroke-width: 4; } .dh-vg .sfl { stroke: #8fb4c8; stroke-width: 4; } .dh-vg.lock .sfl { stroke: #6a4a46; }
.dh-vg .ecg { fill: none; stroke: var(--hc, #7ad08a); stroke-width: 3; stroke-linejoin: round; stroke-linecap: round; opacity: 0.85; stroke-dasharray: 120 140; animation: dhEcg 1.3s linear infinite; }
.dh-vg.danger .ecg { animation-duration: 0.62s; }
@keyframes dhEcg { from { stroke-dashoffset: 260; } to { stroke-dashoffset: 0; } }
.dh-vg b { position: absolute; left: 0; right: 0; top: 23%; text-align: center; font-family: var(--mono, monospace); font-weight: 600; font-size: calc(var(--s) * 0.17); line-height: 1; color: #efe6d6; font-variant-numeric: tabular-nums; text-shadow: 0 1px 3px #000; }
.dh-vg span { position: absolute; left: 0; right: 0; bottom: 22%; text-align: center; font-family: var(--mono, monospace); font-size: calc(var(--s) * 0.068); letter-spacing: 0.24em; color: var(--hc, #7ad08a); text-transform: uppercase; }
.dh-kb { --k: calc(clamp(150px, 21vmin, 240px) * 0.3); position: absolute; left: calc(max(22px, env(safe-area-inset-left, 0px)) + clamp(150px, 21vmin, 240px) * 0.94); bottom: calc(24px + env(safe-area-inset-bottom, 0px)); display: flex; align-items: center; gap: 10px; text-shadow: 0 1px 3px #000; }
.dh-kbc { position: relative; width: var(--k); height: var(--k); border-radius: 50%; background: rgba(11,10,9,0.88); box-shadow: 0 0 0 2px #5a4e3c; display: grid; place-items: center; color: #efe6d6; --cut: #0b0a09; }
.dh-kbc > svg:not(.rg) { width: 62%; height: 62%; } .dh-kbc .rg { position: absolute; inset: -4px; width: calc(100% + 8px); height: calc(100% + 8px); transform: rotate(-90deg); }
.dh-kbc .rg .tr { fill: none; stroke: transparent; stroke-width: 4; } .dh-kbc .rg .fl { fill: none; stroke: #9cff7a; stroke-width: 4; stroke-linecap: round; }
.dh-kb.none .dh-kbc { color: #5a564e; } .dh-kb b { font-family: var(--mono, monospace); font-weight: 600; font-size: calc(var(--k) * 0.42); color: #efe6d6; }
.dh-kb span { font-family: var(--mono, monospace); font-size: calc(var(--k) * 0.22); letter-spacing: 0.12em; color: #9a8f80; text-transform: uppercase; white-space: nowrap; }
.dh-wg { --w: clamp(160px, 23vmin, 260px); position: absolute; right: max(22px, env(safe-area-inset-right, 0px)); bottom: calc(18px + env(safe-area-inset-bottom, 0px)); width: var(--w); height: var(--w); }
.dh-wg .tr { stroke: #2a2218; stroke-width: 12; } .dh-wg .fl { stroke: #e8b765; stroke-width: 12; } .dh-wg.hot .fl { stroke: #ff4a3a; } .dh-wg.warm .fl { stroke: #ffb04a; }
.dh-wg .in { fill: #1a130a; stroke: #c89b4a; stroke-width: 2; }
.dh-wg > .ic { position: absolute; left: 50%; top: 45%; width: 52%; height: 52%; transform: translate(-50%, -50%); color: #ead7aa; --cut: #1a130a; filter: drop-shadow(0 0 6px rgba(232,183,101,0.25)); }
.dh-wg .ic svg { width: 100%; height: 100%; }
.dh-wg > em { position: absolute; left: 0; right: 0; bottom: 21%; text-align: center; font-style: normal; font-family: var(--mono, monospace); font-weight: 600; font-size: calc(var(--w) * 0.062); letter-spacing: 0.06em; color: #e8b765; white-space: nowrap; text-shadow: 0 1px 2px #000; } .dh-wg.hot > em { color: #ff8a7a; }
.dh-wg .sat { position: absolute; width: 32%; height: 32%; border-radius: 50%; background: rgba(11,10,9,0.9); box-shadow: 0 0 0 2px #5a4e3c; color: #9a8f80; --cut: #0b0a09; }
.dh-wg .sat .ic { position: absolute; inset: 15%; } .dh-wg .sat i { position: absolute; left: -10%; top: -14%; font-style: normal; font-family: var(--mono, monospace); font-weight: 600; font-size: calc(var(--w) * 0.06); color: #9a8f80; text-shadow: 0 1px 2px #000; }
.dh-wg .sat.off { opacity: 0.35; } .dh-wg .s1 { left: -4%; top: -22%; } .dh-wg .s2 { left: -34%; top: 14%; }
.dh-wn { position: absolute; right: calc(max(22px, env(safe-area-inset-right, 0px)) + clamp(160px, 23vmin, 260px) * 0.98); bottom: calc(26px + env(safe-area-inset-bottom, 0px)); font-family: var(--mono, monospace); font-weight: 600; font-size: clamp(13px, 1.7vmin, 19px); letter-spacing: 0.06em; text-transform: uppercase; color: #efe6d6; text-shadow: 0 1px 3px #000; white-space: nowrap; }
.dh-wn small { display: block; margin-top: 4px; font-weight: 400; font-size: 0.72em; letter-spacing: 0.14em; color: #9a8f80; text-align: right; } .dh-wn small.hot { color: #ff8a7a; } .dh-wn small.ok { color: #b8ffd8; }
.dh-toast { position: absolute; left: 50%; top: calc(84px + env(safe-area-inset-top, 0px)); transform: translateX(-50%); background: rgba(7,8,10,0.74); border: 1px solid var(--line); padding: 5px 12px; font-size: 12px; max-width: calc(100% - 32px); text-align: center; transition: opacity 0.3s; }
.dh-toast:empty { display: none; }
.dh-banner { position: absolute; left: 50%; top: 32%; transform: translate(-50%, -50%); text-align: center; display: grid; gap: 6px; transition: opacity 0.5s; text-shadow: 0 2px 8px #000; width: calc(100% - 32px); }
.dh-banner b { font-family: var(--display); font-weight: 400; font-size: clamp(34px, 7vw, 64px); letter-spacing: 0.12em; color: var(--accent); line-height: 0.9; }
.dh-banner span { font-size: 13px; color: var(--fg); }
.dh-vig { position: absolute; inset: 0; background: radial-gradient(ellipse at center, transparent 45%, rgba(150,16,8,0.6) 100%); opacity: 0; }
.dh-heal { position: absolute; inset: 0; background: radial-gradient(ellipse at center, transparent 50%, rgba(80,220,140,0.28) 100%); opacity: 0; }
.dh-over { position: absolute; inset: 0; display: grid; place-content: center; pointer-events: auto; cursor: pointer; background: rgba(5,5,6,0.6); padding: 16px 16px 100px min(360px, 34vw); }
.dh-card { background: var(--panel); border: 1px solid var(--line); padding: 18px 22px; display: grid; gap: 12px; max-width: min(580px, calc(100vw - 32px - min(360px, 34vw))); max-height: calc(100vh - 120px); overflow: auto; }
@media (max-width: 760px) { .dh-over { padding: 16px; } .dh-card { max-width: calc(100vw - 32px); max-height: calc(100vh - 32px); } }
.dh-card .ey { font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--muted); }
.dh-card h2 { font-family: var(--display); font-weight: 400; font-size: clamp(40px, 8vw, 64px); line-height: 0.9; margin: 0; letter-spacing: 0.08em; }
.dh-card h2.red { color: var(--accent); }
.dh-card .lt { font-style: italic; color: var(--muted); }
.dh-keys { display: grid; grid-template-columns: auto 1fr; gap: 3px 14px; font-size: 12px; } .dh-keys b { font-family: var(--display); font-size: 17px; font-weight: 400; color: var(--lamp); white-space: nowrap; line-height: 1.1; }
.dh-goal { font-size: 12px; line-height: 1.55; color: var(--fg); max-width: 60ch; }
.dh-go { font-family: var(--display); font-size: 24px; color: var(--lamp); letter-spacing: 0.06em; }
.dh-stats { display: grid; grid-template-columns: 1fr auto; gap: 3px 18px; font-size: 12px; } .dh-stats span { color: var(--muted); } .dh-stats b { font-weight: 500; font-variant-numeric: tabular-nums; text-align: right; }
.dh-dbg { position: absolute; left: max(16px, env(safe-area-inset-left, 0px)); top: calc(70px + env(safe-area-inset-top, 0px)); font-size: 11px; white-space: pre; background: rgba(0,0,0,0.6); padding: 6px 8px; color: #bff; }
@media (max-width: 640px) { .dh-keys { font-size: 11px; } .dh-wname { font-size: 18px; } .dh-slot { width: 30px; height: 28px; } .dh-name { font-size: 18px; } }
.dh-wheel { position: absolute; z-index: 3; left: 50%; top: 50%; width: min(580px, 70vmin); aspect-ratio: 1; transform: translate(-50%, -50%) scale(0.84); opacity: 0; transition: opacity 0.09s, transform 0.12s; pointer-events: none; }
.dh-wheel.on { opacity: 1; transform: translate(-50%, -50%) scale(1); }
.dh-wheel svg { width: 100%; height: 100%; display: block; overflow: visible; }
.dh-wheel .bg { fill: rgba(11,10,9,0.9); stroke: #5a4e3c; stroke-width: 1.2; transition: fill 0.08s; }
.dh-wheel .sec { --cut: #0b0a09; } .dh-wheel .sec.hov { --cut: #3a2a12; }
.dh-wheel .sec.cur .bg { stroke: #c89b4a; stroke-width: 2; }
.dh-wheel .sec.hov .bg { fill: rgba(58,42,18,0.95); stroke: #e8b765; stroke-width: 2.4; }
.dh-wheel .sec .ic { color: #ead7aa; } .dh-wheel .sec.hov .ic { color: #fff3d6; }
.dh-wheel .sec.off .ic, .dh-wheel .sec.off text, .dh-wheel .sec.off .ga { opacity: 0.3; }
.dh-wheel .gt { fill: none; stroke: #2a2218; stroke-width: 3.5; stroke-linecap: round; } .dh-wheel .ga { fill: none; stroke: #e8b765; stroke-width: 3.5; stroke-linecap: round; } .dh-wheel .ga.hot { stroke: #ff4a3a; } .dh-wheel .ga.kit { stroke: #9cff7a; }
.dh-wheel .sec text { fill: #e8b765; font-family: var(--mono, monospace); font-weight: 600; font-size: 10px; text-anchor: middle; } .dh-wheel .sec.hov text { fill: #fff3d6; }
.dh-wheel .mid { fill: rgba(11,10,9,0.94); stroke: #c89b4a; stroke-width: 1.6; } .dh-wheel .midr { fill: none; stroke: #5a4628; stroke-width: 0.8; }
.dh-wheel .ptr { fill: #e8b765; transition: opacity 0.1s; }
.dh-wheel .lbl { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); width: 30%; text-align: center; display: grid; gap: 5px; text-shadow: 0 1px 2px #000; }
.dh-wheel .lbl b { font-family: var(--mono, monospace); font-weight: 600; font-size: clamp(12px, 2.1vmin, 18px); color: #efe6d6; line-height: 1.15; letter-spacing: 0.05em; text-transform: uppercase; }
.dh-wheel .lbl span { font-family: var(--mono, monospace); font-size: clamp(10px, 1.6vmin, 14px); letter-spacing: 0.06em; color: #9a8f80; line-height: 1.25; } .dh-wheel .lbl span.hot { color: #ff8a7a; } .dh-wheel .lbl span.ok { color: #b8ffd8; }
`
    document.head.appendChild(css)
    const ICONS = {
      pistola: '<path d="M3 9h14v4H9l-1 6H5l1-6H3z"/><path d="M17 10h3"/><path d="M12 9V7"/>',
      escopeta: '<path d="M2 9h15v2H2z"/><path d="M2 12h15v1.5H2z"/><path d="M17 9h3l1 2v3h-4z"/><path d="M18 14l1 5h-3l-1-5"/><path d="M7 13.5v2h5v-2"/>',
      armadilha: '<path d="M7 9h10v9H7z"/><path d="M6 9h12"/><path d="M9 9L7 4M12 9V3M15 9l2-5"/>',
      kit: '<path d="M4 8h16v11H4z"/><path d="M9 8V5.5h6V8"/><path d="M12 10.5v6M9 13.5h6"/>',
    }
    const WICON = { // as silhuetas das armas (as do conceito C): a cor de dentro vem de --cut
      pistola: '<path d="M6 21 H47 L52 24 V30 H6 Z"/><path d="M10 30 H30 L28 35 H23 L20 52 H9 L12 35 Z"/><path d="M23 35 Q23 41 29 41 L31 35" fill="none" stroke-width="2.6"/><circle cx="56.5" cy="27" r="5" fill="none" stroke-width="2.6"/><path d="M14 25 H38 M14 27.5 H30" style="stroke:var(--cut)" stroke-width="1.2"/>',
      escopeta: '<path d="M2 37 L15 30 H21 V40 H14 L5 47 Z"/><path d="M20 28 H31 V40 H20 Z"/><rect x="31" y="27" width="31" height="4"/><rect x="31" y="32" width="31" height="4"/><path d="M35 36 H50 V40 H35 Z"/><path d="M24 40 Q24 45 29 45" fill="none" stroke-width="2.4"/><path d="M22 31 H29 M22 34 H27" style="stroke:var(--cut)" stroke-width="1.2"/>',
      armadilha: '<rect x="26" y="9" width="12" height="7" rx="1.5"/><circle cx="32" cy="37" r="19"/><circle cx="32" cy="37" r="12" fill="none" style="stroke:var(--cut)" stroke-width="2.2"/><path d="M32 27 V47 M22 37 H42" style="stroke:var(--cut)" stroke-width="2.2"/><path d="M32 18 V22 M32 52 V56 M13 37 H17 M47 37 H51" style="stroke:var(--cut)" stroke-width="1.6"/>',
      kit: '<rect x="12" y="19" width="40" height="31" rx="4"/><path d="M25 19 V13 H39 V19" fill="none" stroke-width="2.6"/><path d="M32 26 V43 M23.5 34.5 H40.5" style="stroke:var(--cut)" stroke-width="5"/>',
    }
    const wIcon = (k) => `<svg viewBox="0 0 64 64" fill="currentColor" stroke="currentColor" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true">${WICON[k]}</svg>`
    const svgI = (k) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true">${ICONS[k]}</svg>`
    const WNAME = { pistola: 'pistola de Demantino', escopeta: 'escopeta de sal grosso', armadilha: 'armadilha' }
    const hud = document.createElement('div'); hud.id = 'demoHud'; hud.hidden = true
    hud.innerHTML = `
      <div class="dh-boss" style="opacity:0"><div class="dh-top"><span class="dh-name">A MÃE</span><span class="dh-phase"></span></div>
        <div class="dh-bars">${BAR_HP.map((h) => `<div class="dh-bar" style="flex:${h}"><u></u><i></i></div>`).join('')}</div>
        <div class="dh-crib" hidden><span>berço</span><div class="cb"><i></i></div></div></div>
      <div class="dh-cross"><i class="t"></i><i class="b"></i><i class="l"></i><i class="r"></i><i class="c"></i></div>
      <div class="dh-ring"><svg viewBox="0 0 76 76" aria-hidden="true"><circle class="sh" cx="38" cy="38" r="26"/><circle class="bg" cx="38" cy="38" r="26"/><circle class="fg" cx="38" cy="38" r="26"/></svg><em></em></div>
      <div class="dh-mark"><i></i><i></i><i></i><i></i><em></em></div>
      <div class="dh-life"><div class="dh-lbl">vida</div><div class="dh-hp"><div class="hb"><i></i></div><span></span></div><div class="dh-st"><i></i></div><div class="dh-kits"></div></div>
      <div class="dh-weap"><div class="dh-lbl">adaptadora</div><div class="dh-wname"></div><div class="dh-wsub"></div><div class="dh-heat"><i></i></div>
        <div class="dh-slots">${['pistola', 'escopeta', 'armadilha'].map((k, i) => `<div class="dh-slot" data-k="${k}"><span class="k">${i + 1}</span>${svgI(k)}</div>`).join('')}</div></div>
      <div class="dh-wheel" aria-hidden="true"><svg viewBox="-100 -100 200 200">${(() => { // quatro fatias: em cima, à direita, embaixo, à esquerda
          const arc = (a0, a1, r0, r1) => { const P = (a, r) => `${(Math.cos(a) * r).toFixed(2)} ${(Math.sin(a) * r).toFixed(2)}`; return `M${P(a0, r1)} A${r1} ${r1} 0 0 1 ${P(a1, r1)} L${P(a1, r0)} A${r0} ${r0} 0 0 0 ${P(a0, r0)} Z` }
          return ['pistola', 'escopeta', 'armadilha', 'kit'].map((k, i) => { const c = -Math.PI / 2 + i * Math.PI / 2, g = 0.035, ix = Math.cos(c) * 60, iy = Math.sin(c) * 60, kx = Math.cos(c) * 87, ky = Math.sin(c) * 87
            const a0 = c - Math.PI / 4 + g + 0.04, len = (Math.PI / 2 - 2 * g - 0.08) * 92, off = -92 * ((a0 % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI * 92) // o arco de cima da fatia (a sobrecarga, os kits)
            return `<g class="sec" data-k="${k}" data-len="${len.toFixed(1)}"><path class="bg" d="${arc(c - Math.PI / 4 + g, c + Math.PI / 4 - g, 37, 97)}"/><circle class="gt" r="92" style="stroke-dasharray:${len.toFixed(1)} 999;stroke-dashoffset:${off.toFixed(1)}"/><circle class="ga" r="92" style="stroke-dasharray:0 999;stroke-dashoffset:${off.toFixed(1)}"/><g class="ic" transform="translate(${ix.toFixed(1)} ${(iy - 1).toFixed(1)}) scale(0.56) translate(-32 -32)"><g fill="currentColor" stroke="currentColor" stroke-linejoin="round" stroke-linecap="round">${WICON[k]}</g></g><text x="${kx.toFixed(1)}" y="${(ky + 4).toFixed(1)}">${['1', '2', '3', 'F'][i]}</text></g>` }).join('') })()}<circle class="mid" r="33"/><circle class="midr" r="30"/><circle class="ptr" r="3" cx="0" cy="-26" opacity="0"/></svg><div class="lbl"><b></b><span></span></div></div>
      <div class="dh-vg"><svg viewBox="0 0 200 200" aria-hidden="true"><circle class="bk" cx="100" cy="100" r="97"/><circle class="tr" cx="100" cy="100" r="84"/><circle class="fl" cx="100" cy="100" r="84"/><circle class="str" cx="100" cy="100" r="69"/><circle class="sfl" cx="100" cy="100" r="69"/><polyline class="ecg" points="50,112 72,112 80,94 90,134 100,98 108,112 150,112"/></svg><b></b><span></span></div>
      <div class="dh-kb"><div class="dh-kbc"><svg class="rg" viewBox="0 0 80 80" aria-hidden="true"><circle class="tr" cx="40" cy="40" r="36"/><circle class="fl" cx="40" cy="40" r="36"/></svg>${wIcon('kit')}</div><b></b><span></span></div>
      <div class="dh-wg"><svg viewBox="0 0 200 200" aria-hidden="true"><circle class="bk" cx="100" cy="100" r="97"/><circle class="tr" cx="100" cy="100" r="86"/><circle class="fl" cx="100" cy="100" r="86"/><circle class="in" cx="100" cy="100" r="68"/></svg><div class="ic"></div><em></em>
        <div class="sat s1"><div class="ic"></div><i></i></div><div class="sat s2"><div class="ic"></div><i></i></div></div>
      <div class="dh-wn"></div>
      <div class="dh-toast"></div>
      <div class="dh-banner" style="opacity:0"><b></b><span></span></div>
      <div class="dh-vig"></div><div class="dh-heal"></div>
      <div class="dh-over" hidden><div class="dh-card"></div></div>
      <div class="dh-dbg" hidden></div>`
    ;(document.querySelector('aside.card') || document.body.lastChild).before(hud)
    const $ = (s) => hud.querySelector(s)
    const el = { name: $('.dh-name'), ring: $('.dh-ring'), ringFg: $('.dh-ring .fg'), ringT: $('.dh-ring em'), boss: $('.dh-boss'), phase: $('.dh-phase'), bars: $('.dh-bars'), crib: $('.dh-crib'), cribI: $('.dh-crib .cb i'), cross: $('.dh-cross'), mark: $('.dh-mark'), markT: $('.dh-mark em'),
      hp: $('.dh-hp'), hpI: $('.dh-hp .hb i'), hpT: $('.dh-hp span'), st: $('.dh-st'), stI: $('.dh-st i'), kits: $('.dh-kits'), wname: $('.dh-wname'), wsub: $('.dh-wsub'), heat: $('.dh-heat'), heatI: $('.dh-heat i'),
      slots: [...hud.querySelectorAll('.dh-slot')], wheel: $('.dh-wheel'), wsec: [...hud.querySelectorAll('.dh-wheel .sec')], wptr: $('.dh-wheel .ptr'), wlb: $('.dh-wheel .lbl b'), wls: $('.dh-wheel .lbl span'), toast: $('.dh-toast'), banner: $('.dh-banner'), bannerB: $('.dh-banner b'), bannerS: $('.dh-banner span'), vig: $('.dh-vig'), heal: $('.dh-heal'), over: $('.dh-over'), card: $('.dh-card') }
    const barEls = [...hud.querySelectorAll('.dh-bar')].map((e) => ({ e, i: e.querySelector('i'), u: e.querySelector('u'), tr: 1 }))
    const dbgEl = $('.dh-dbg')
    const H = { msgT: 0, banT: 0, markT: 0, markK: '', fps: 60, last: '' }
    // as legendas: embaixo, grandes, mais tempo na tela; uma nova entra embaixo e empurra as anteriores para cima (no máximo três)
    const SUBS = [], SUBC = { Matheus: '#9fd0ff', Lara: '#ffd36a', Nicolas: '#b9e58a', Central: '#ff9b7a' }
    let subsEl = null
    function subsClear() { for (const q of SUBS) q.e.remove(); SUBS.length = 0 }
    function subsTick(dt) {
      for (let i = SUBS.length - 1; i >= 0; i--) { const q = SUBS[i]; q.t -= dt; if (q.t <= 0 && !q.out) { q.out = true; q.e.classList.add('out') } if (q.t <= -0.45) { q.e.remove(); SUBS.splice(i, 1) } }
    }
    function say(msg, dur = 3.4) {
      el.toast.textContent = msg; H.msgT = dur
      if (!subsEl) { subsEl = document.createElement('div'); subsEl.className = 'dh-subs'; hud.append(subsEl) }
      const keep = Math.max(4.2, dur * 1.7), last = SUBS[SUBS.length - 1]
      if (last && last.msg === msg && !last.out) last.t = keep // a mesma de novo: só renova o tempo
      else {
        const e = document.createElement('div'); e.className = 'dh-sub'
        const m2 = /^([A-ZÀ-Ú][\wÀ-ú]*)( \([^)]*\))?:\s*(.*)$/.exec(msg)
        if (m2 && SUBC[m2[1]]) { const b = document.createElement('b'); b.style.color = SUBC[m2[1]]; b.textContent = m2[1] + (m2[2] || '') + ':'; e.append(b, document.createTextNode(m2[3])) } else e.textContent = msg
        subsEl.append(e); SUBS.forEach((q) => q.e.classList.add('old')); SUBS.push({ e, msg, t: keep, out: false })
        while (SUBS.length > 3) { const q = SUBS.shift(); q.e.remove() }
      }
      const v = /^(Matheus|Lara|Nicolas|Central)\b[^:]*:\s*(.*)$/.exec(msg) // fala de alguém: a voz (som) junto da legenda
      if (v) SFX.voice(v[1].toLowerCase(), Math.max(2, Math.min(16, Math.round(v[2].split(/\s+/).length * 1.5))))
    }
    function banner(b, s, dur = 2.8) { el.bannerB.textContent = b; el.bannerS.textContent = s || ''; el.banner.style.opacity = 1; H.banT = dur }
    function hitMark(k) {
      if (k === 'hit' && H.markT > 0.05 && (H.markK === 'crit' || H.markK === 'cambaleio')) return // o crítico fica um pouco mais na tela
      H.markK = k; H.markT = k === 'esquiva' || k === 'cambaleio' || k === 'cancel' ? 0.8 : k === 'crit' ? 0.28 : 0.16
      el.mark.className = 'dh-mark ' + k; el.markT.textContent = k === 'esquiva' ? 'ESQUIVOU' : k === 'cambaleio' ? 'CAMBALEOU' : k === 'cancel' ? 'CANCELOU' : k === 'crit' ? 'CRÍTICO' : ''
    }
    const KEYS = [['W A S D', 'andar (para onde a câmera olha)'], ['Shift', 'correr (gasta fôlego)'], ['Espaço', 'esquivar: cambalhota, invulnerável no meio'], ['botão direito', 'mirar: a câmera chega no ombro'],
      ['botão esquerdo', 'atirar · arremessar a armadilha'], ['1 2 3 · rodinha', 'pistola · escopeta · armadilha'], ['segurar a rodinha · Tab', 'roda de armas: aponte e solte'], ['Q', 'arma anterior'], ['F', 'usar um kit (+60 de vida)'], ['E', 'recolher a armadilha'], ['[ ]', 'sensibilidade do mouse'], ['Esc', 'pausa']]
    const KEYS_B = KEYS.filter(([a]) => a !== 'E').map(([a, b]) => (a === 'botão esquerdo' ? [a, 'atirar'] : a === '1 2 3 · rodinha' ? ['1 2 · rodinha', 'pistola · escopeta'] : [a, b])) // no Bando, sem a armadilha
    const keysOf = (k) => `<div class="dh-keys">${k.map(([a, b]) => `<b>${a}</b><span>${b}</span>`).join('')}</div>`
    const keysM = keysOf(KEYS), keysB = keysOf(KEYS_B)
    const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`
    function statsHtml() {
      const S = P.stats, acc = S.shots ? Math.round(100 * S.hits / S.shots) : 0
      return `<div class="dh-stats"><span>tempo de luta</span><b>${fmt(S.t || D.t)}</b><span>dano causado</span><b>${Math.round(S.dmg)}</b><span>precisão</span><b>${acc}%</b><span>tiros na cabeça</span><b>${S.crits}</b>
        <span>dano recebido</span><b>${Math.round(S.dmgTaken)}</b><span>esquivas</span><b>${S.dodges}</b><span>kits usados</span><b>${S.kits}</b><span>quedas</span><b>${S.deaths}</b>${D.kind === 'bando' ? `<span>inimigos abatidos</span><b>${BD.killed}</b>` : ''}${D.run === 'casa' ? `<span>Espectrais da casa</span><b>${CA.foes.filter((e) => e.dead).length} de ${CA.foes.length}</b><span>tempo total${D.best && D.best.novo ? ' · recorde' : ''}</span><b>${fmt(D.runT || 0)}</b>${D.best && D.best.prev ? `<span>${D.best.novo ? 'recorde anterior' : 'melhor tempo'}</span><b>${fmt(D.best.novo ? D.best.prev : D.best.t)}</b>` : ''}` : ''}</div>`
    }
    function hudTela() { // as telas: começo, pausa, queda, vitória
      let html = null
      const touch = matchMedia('(pointer: coarse)').matches && !matchMedia('(pointer: fine)').matches
      if (D.kind === 'casa') { const h2 = casaTela(touch); el.over.hidden = !h2; if (h2 && h2 !== H.last) { el.card.innerHTML = h2; H.last = h2 } return }
      if (D.kind === 'intro') { const h2 = insTela(touch); el.over.hidden = !h2; if (h2 && h2 !== H.last) { el.card.innerHTML = h2; H.last = h2 } return }
      const bd = D.kind === 'bando', wv = Math.min(3, BD.wave) + 1, keysHtml = bd ? keysB : keysM
      if (D.mode === 'start' && !D.playing) html = bd ? `<div class="ey">C.R.O.S. · demo do bando · terceira pessoa</div><h2>O BANDO</h2><div class="lt">Espectrais e o Glutão · o berçário</div>
        <div class="dh-goal">Quatro ondas: dois Espectrais, três, quatro e o Glutão. Os Espectrais rondam e só um ataca por vez: quando ele empina guinchando, esquive ou saia da frente; depois da mordida ele fica tonto, a sua janela. O Glutão: tiro no núcleo (o brilho no peito) leva o dano inteiro, e na hora da pancada cancela o golpe. Um kit a cada onda limpa.</div>
        ${keysHtml}<div class="dh-go">${touch ? 'precisa de teclado e mouse' : 'clique para começar'}</div>`
        : `<div class="ey">C.R.O.S. · demo da luta · terceira pessoa</div><h2>A MÃE</h2><div class="lt">mater insomnis · o berçário</div>
        <div class="dh-goal">Quebre as quatro barras dela. Quando ela para ofegando, é a janela: o dano sobe e tiro na cabeça vale o dobro. O chão que estufa e brilha vermelho avisa de onde ela vai sair. O redemoinho roxo protege o berço: zere uma barra e, com ela atordoada, ele cai e o berço acende em vermelho; quebre o berço (ele protege a última barra). A partir da fase 2, os móveis caem do escuro: saia dos círculos vermelhos. Enfraquecida, jogue a armadilha.</div>
        ${keysHtml}<div class="dh-go">${touch ? 'precisa de teclado e mouse' : 'clique para começar'}</div>`
      else if ((D.mode === 'intro' || D.mode === 'fight' || D.mode === 'corredor' || D.mode === 'cut') && !D.playing) html = `<div class="ey">pausa · ${bd ? 'onda ' + wv : 'fase ' + (B.phase + 1)}</div><h2>PAUSA</h2>${keysHtml}<div class="dh-go">clique para voltar</div>`
      else if (D.mode === 'dead' && D.endShown) html = `<div class="ey">C.R.O.S. · relatório de campo</div><h2 class="red">AGENTE ABATIDO</h2><div class="lt">${bd ? 'o bando venceu na onda ' + wv : 'a Mãe venceu na fase ' + (Math.min(3, B.bar) + 1)}</div>${statsHtml()}<div class="dh-go">R ou clique: de novo, a partir da ${bd ? 'onda ' + wv : 'fase ' + (Math.min(3, B.bar) + 1)}</div>`
      else if (D.mode === 'won' && D.endShown) html = bd ? `<div class="ey">C.R.O.S. · relatório de campo</div><h2>BANDO DERROTADO</h2><div class="lt">as quatro ondas · ${BD.killed} abatidos</div>${statsHtml()}<div class="dh-go">R ou clique: de novo</div>`
        : `<div class="ey">C.R.O.S. · relatório de campo</div><h2>MÃE CAPTURADA</h2><div class="lt">${D.run === 'casa' ? 'da varanda ao berço · ' + fmt(D.runT || 0) + ' na casa e na luta' : 'mater insomnis · a cápsula da mochila acendeu'}</div>${statsHtml()}<div class="dh-go">${D.run === 'casa' ? 'R ou clique: a casa de novo' : 'R ou clique: lutar de novo'}</div>`
      el.over.hidden = !html
      if (html && html !== H.last) { el.card.innerHTML = html; H.last = html }
    }
    el.over.addEventListener('click', () => {
      if (D.mode === 'dead' || D.mode === 'won') { if (!D.endShown) return; retry(D.mode === 'won') }
      start()
    })
    // ---------- o HUD do conceito C: o mostrador da vida (em %), o kit, o mostrador da arma ----------
    const G_C1 = 2 * Math.PI * 84, G_C2 = 2 * Math.PI * 69, G_C3 = 2 * Math.PI * 86, G_C4 = 2 * Math.PI * 36
    const gq = (s2) => hud.querySelector(s2)
    const GE = { vg: gq('.dh-vg'), vfl: gq('.dh-vg .fl'), vtr: gq('.dh-vg .tr'), vsf: gq('.dh-vg .sfl'), vst: gq('.dh-vg .str'), vb: gq('.dh-vg b'), vs: gq('.dh-vg span'), kb: gq('.dh-kb'), kbb: gq('.dh-kb b'), kbs: gq('.dh-kb span'), kfl: gq('.dh-kbc .rg .fl'),
      wg: gq('.dh-wg'), wfl: gq('.dh-wg .fl'), wtr: gq('.dh-wg .tr'), wic: gq('.dh-wg > .ic'), wem: gq('.dh-wg > em'), sats: [gq('.dh-wg .s1'), gq('.dh-wg .s2')], wn: gq('.dh-wn'), k: {} }
    GE.vtr.style.strokeDasharray = `${G_C1 * 0.75} ${G_C1}`; GE.vst.style.strokeDasharray = `${G_C2 * 0.75} ${G_C2}`; GE.wtr.style.strokeDasharray = `${G_C3 * 0.75} ${G_C3}`
    const gset = (key, v, f) => { if (GE.k[key] !== v) { GE.k[key] = v; f(v) } }
    const W_ORDER = ['pistola', 'escopeta', 'armadilha']
    function hudGauges(wk) {
      const vida = T.agente.vida, f = cl(P.hp / vida), pct = Math.ceil(f * 100), st = f > 0.6 ? 0 : f > 0.3 ? 1 : 2
      gset('vf', (f * 1000) | 0, () => { GE.vfl.style.strokeDasharray = `${G_C1 * 0.75 * f} ${G_C1}`; GE.vfl.style.opacity = f < 0.003 ? 0 : 1 })
      gset('vp', pct, (v) => (GE.vb.textContent = v + '%'))
      gset('vs', st, (v) => { GE.vs.textContent = ['bem', 'cuidado', 'perigo'][v]; GE.vg.style.setProperty('--hc', ['#7ad08a', '#e8c14a', '#e2553e'][v]); GE.vg.classList.toggle('danger', v === 2) })
      const sf = cl(P.stam / T.agente.folego); gset('sf', (sf * 100) | 0, () => { GE.vsf.style.strokeDasharray = `${G_C2 * 0.75 * sf} ${G_C2}`; GE.vsf.style.opacity = GE.vst.style.opacity = sf > 0.995 && !P.stamLock ? 0 : 1 })
      GE.vg.classList.toggle('lock', !!P.stamLock)
      // o kit: quantos; sem nenhum, o anel do próximo (um a cada 1:30)
      const none = P.kits <= 0, left = Math.max(0, KIT_GEN - (P.kitGen || 0))
      gset('kn', none, (v) => GE.kb.classList.toggle('none', v))
      gset('kc', P.kits, (v) => (GE.kbb.textContent = '×' + v))
      gset('ks', none ? 'novo em ' + Math.floor(left / 60) + ':' + String(Math.floor(left % 60)).padStart(2, '0') : 'F · curar', (v) => (GE.kbs.textContent = v))
      gset('kr', none ? ((P.kitGen || 0) / KIT_GEN * 200) | 0 : -1, () => (GE.kfl.style.strokeDasharray = none ? `${G_C4 * (P.kitGen || 0) / KIT_GEN} ${G_C4}` : `0 ${G_C4}`))
      // a arma: o ícone grande, a sobrecarga no anel, as outras duas em volta
      gset('wk', wk, (v) => { GE.wic.innerHTML = wIcon(v); const others = W_ORDER.filter((q) => q !== v); GE.sats.forEach((sat, i) => { sat.querySelector('.ic').innerHTML = wIcon(others[i]); sat.querySelector('i').textContent = W_ORDER.indexOf(others[i]) + 1 }) })
      let ring = 0, lab = '', sub = '', hot = false, warm = false
      if (wk === 'armadilha') {
        ring = TRAP.state === 'hand' ? 1 : 0
        lab = '3 · ' + ({ hand: 'pronta', fly: 'no ar', stuck: 'no chão', zap: 'segurando', capture: 'capturando', icap: 'capturando', return: 'voltando' }[TRAP.state] || '')
        sub = TRAP.state === 'stuck' ? 'clique: chamar de volta' : TRAP.state === 'hand' ? 'mire para ver o arco' : ''
      } else {
        const Hh = HEAT[wk]; ring = cl(Hh.heat / 100); hot = Hh.hot; warm = !hot && Hh.heat >= 70
        lab = (wk === 'pistola' ? '1' : '2') + ' · ' + (hot ? (Hh.lock > 0 ? 'trava ' + Math.ceil(Hh.lock) + ' s' : 'esfriando') : Math.round(Hh.heat) + '%')
        sub = hot ? 'superaquecida' : 'sobrecarga'
      }
      gset('wr', (ring * 200) | 0, () => { GE.wfl.style.strokeDasharray = `${G_C3 * 0.75 * ring} ${G_C3}`; GE.wfl.style.opacity = ring < 0.005 ? 0 : 1 })
      GE.wg.classList.toggle('hot', hot && Math.sin(D.t * 14) > -0.3); GE.wg.classList.toggle('warm', warm)
      gset('wl', lab, (v) => (GE.wem.textContent = v))
      gset('wn', WNAME[wk] + '|' + sub + '|' + hot, () => { GE.wn.innerHTML = `${WNAME[wk]}<small class="${hot ? 'hot' : ''}">${sub}</small>` })
      GE.sats.forEach((sat, i) => sat.classList.toggle('off', false))
    }
    function hudTick(dt) {
      if (hud.hidden) return
      H.fps = H.fps * 0.95 + (dt > 0 ? 1 / dt : 60) * 0.05
      // ela
      const showBoss = D.mode === 'fight' || D.mode === 'dead' || (D.mode === 'won' && D.endT < 2) || (D.mode === 'intro' && D.t > 2.5)
      el.boss.style.opacity = showBoss ? 1 : 0
      if (D.kind === 'casa') casaHud(dt)
      else if (D.kind === 'intro') insHud(dt)
      else if (D.kind === 'bando') { // as quatro ondas: a de agora desce com a vida de quem falta
        const w = BD.wave, left = BD.state === 'fight' || BD.state === 'clear' ? bandoLeft() : WAVE_HP[w]
        barEls.forEach((b, i) => {
          const f = BD.state === 'won' || i < w || (i === w && BD.state === 'clear') ? 0 : i > w ? 1 : left / WAVE_HP[i]; b.tr = f < b.tr ? damp(b.tr, f, 2.5, dt) : f
          b.i.style.transform = `scaleX(${f})`; b.u.style.transform = `scaleX(${b.tr})`; b.e.classList.toggle('cur', i === w && BD.state !== 'won'); b.e.classList.remove('lock')
        })
        const n = BD.foes.filter((e) => !e.dead).length
        el.phase.textContent = BD.state === 'won' ? 'derrotado' : `onda ${w + 1} de 4 · ` + (BD.state === 'pre' ? 'chegando' : BD.state === 'clear' ? 'limpa' : `${n} ${n === 1 ? 'inimigo' : 'inimigos'}`)
        el.bars.classList.remove('weak'); el.crib.hidden = true
      } else {
      barEls.forEach((b, i) => {
        const f = B.hp[i] / BAR_HP[i]; b.tr = f < b.tr ? damp(b.tr, f, 2.5, dt) : f
        b.i.style.transform = `scaleX(${f})`; b.u.style.transform = `scaleX(${b.tr})`
        b.e.classList.toggle('cur', i === B.bar && B.mode !== 'captured' && B.mode !== 'off'); b.e.classList.toggle('lock', i === 3 && !B.cribBroken)
      })
      el.bars.classList.toggle('weak', B.mode === 'weak')
      const mv = B.mode === 'weak' ? `enfraquecida · ${Math.ceil(B.weakT)} s · a armadilha!` : B.mode === 'captured' ? 'capturada' : B.mode === 'capture' ? 'capturando' : NOMES[B.move] || ''
      el.phase.textContent = `fase ${Math.min(3, B.phase) + 1}${mv ? ' · ' + mv : ''}`
      el.crib.hidden = !(B.cribVuln && !B.cribBroken && showBoss)
      if (!el.crib.hidden) el.cribI.style.transform = `scaleX(${B.crib / T.berco.vida})`
      }
      // você
      const vida = T.agente.vida
      el.hpI.style.transform = `scaleX(${P.hp / vida})`; el.hpT.textContent = `${Math.ceil(P.hp)} / ${vida}`; el.hp.classList.toggle('low', P.hp < vida * 0.3)
      el.stI.style.transform = `scaleX(${P.stam / T.agente.folego})`; el.st.classList.toggle('lock', P.stamLock)
      el.kits.innerHTML = `kits <b>${P.kits}</b> · F para usar`
      // a arma
      const wk = P.wNext && P.swap >= 0 ? P.wNext : P.w
      el.wname.textContent = WNAME[wk]
      el.slots.forEach((s) => s.classList.toggle('sel', s.dataset.k === wk))
      if (wk === 'armadilha') {
        el.heat.hidden = true
        const st = { hand: B.mode === 'weak' ? 'pronta: jogue nela!' : 'pronta · mire para ver o arco', fly: 'no ar', stuck: 'no chão · E recolhe', zap: 'segurando…', capture: 'capturando', return: 'voltando' }[TRAP.state]
        el.wsub.textContent = st; el.wsub.className = 'dh-wsub' + (TRAP.state === 'hand' && B.mode === 'weak' ? ' ok' : '')
      } else {
        const Hh = HEAT[wk]; el.heat.hidden = true // o calor aparece no anel em volta da mira
        el.wsub.textContent = Hh.hot ? (Hh.lock > 0 ? `superaquecida · trava ${Math.ceil(Hh.lock)} s` : 'esfriando…') : `calor ${Math.round(Hh.heat)}%`
        el.wsub.className = 'dh-wsub' + (Hh.hot ? ' hot' : '')
      }
      hudGauges(wk)
      // a mira: abre da cintura e andando; fecha mirando; muda de cor em cima dela
      const spread = P.w === 'escopeta' ? lerp(26, 14, P.aimW) : lerp(15, 5, P.aimW) + 6 * Math.min(1, P.speed / 2.4) * (1 - P.aimW * 0.6)
      el.cross.style.setProperty('--g', `${spread.toFixed(1)}px`)
      const onFoe = AIM.kind === 'head' || AIM.kind === 'ehead' || AIM.kind === 'core'
      el.cross.style.setProperty('--c', onFoe ? '#ff9a5a' : AIM.kind === 'mae' || AIM.kind === 'enemy' ? '#ff5a48' : AIM.kind === 'crib' && B.cribVuln ? '#ff7a40' : 'rgba(217,208,189,0.9)')
      el.cross.classList.toggle('trap', P.w === 'armadilha')
      if (WHEEL.on) { if (!D.playing || P.dead >= 0 || D.mode === 'won' || D.mode === 'cut') wheelClose(false); else wheelDraw() }
      const crossOn = D.playing && P.dead < 0 && D.mode !== 'won' && !WHEEL.on
      el.cross.style.opacity = crossOn ? 1 : 0
      // o anel da sobrecarga: enche com o calor da arma na mão (ciano, amarelo, laranja); travada, pisca vermelho com a contagem
      if (wk !== 'armadilha' && crossOn) {
        const Hh = HEAT[wk], f = Hh.hot ? (Hh.lock > 0 ? Hh.lock / T[wk].trava : Hh.heat / 100) : Hh.heat / 100
        el.ring.style.opacity = Hh.heat > 0.5 || Hh.hot ? 1 : 0.55
        el.ringFg.style.strokeDashoffset = (163.36 * (1 - Math.min(1, f))).toFixed(1)
        el.ring.style.setProperty('--rc', Hh.hot ? '#ff3020' : Hh.heat < 50 ? '#e8c48a' : Hh.heat < 80 ? '#ffb050' : '#ff7a30')
        el.ring.classList.toggle('hot', Hh.hot && Hh.lock > 0)
        el.ringT.textContent = Hh.hot ? (Hh.lock > 0 ? `trava ${Math.ceil(Hh.lock)} s` : 'esfriando') : ''
      } else el.ring.style.opacity = 0
      H.markT -= dt; el.mark.style.opacity = H.markT > 0 ? 1 : 0
      // vinheta de dor, pulso de vida baixa, o verde da cura
      hurtFx = Math.max(0, hurtFx - dt * 2.2); healFx = Math.max(0, healFx - dt * 1.5)
      const low = P.hp < vida * 0.3 && P.dead < 0 ? 0.35 + 0.25 * Math.sin(performance.now() * 0.006) : 0
      el.vig.style.opacity = Math.max(hurtFx * 0.9, low, P.dead >= 0 ? 0.8 : 0); el.heal.style.opacity = healFx
      H.msgT -= dt; if (H.msgT < 0.4) el.toast.style.opacity = Math.max(0, H.msgT / 0.4); if (H.msgT <= 0 && el.toast.textContent) el.toast.textContent = ''
      subsTick(dt)
      H.banT -= dt; el.banner.style.opacity = H.banT > 0 ? 1 : 0
      if (D.dbg) dbgEl.textContent = D.kind === 'casa' ? casaDbg() : D.kind === 'intro' ? insDbg() : `fps ${H.fps.toFixed(0)} · modo ${D.mode}/${B.mode} · fase ${B.phase + 1} barra ${B.bar + 1}\ngolpe ${B.move} ${B.moveT.toFixed(1)} s · fila ${LUTA.L.q.length} · plano ${B.plan.length}\nbarras ${B.hp.map((h) => Math.round(h)).join(' / ')} · berço ${Math.round(B.crib)}\nvocê ${Math.round(P.hp)} vida · fôlego ${P.stam.toFixed(1)} · dist ${distP().toFixed(1)} m\ntornado ${TOR.k.toFixed(2)} · seco ${B.dry.toFixed(2)} · mira ${AIM.kind} ${AIM.t.toFixed(1)} m${D.bot ? `\nrobô ${D.bot.skill}` : ''}`
    }

    // =====================================================================
