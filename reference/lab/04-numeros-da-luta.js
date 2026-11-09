  function buildDemo() {
    const G = new THREE.Group(); G.visible = false; scene.add(G)
    const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z)
    const cl = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x))
    const sm = pSm, lerp = (a, b, k) => a + (b - a) * k
    const dAng = (a, b) => { let d = b - a; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d }
    const R = Math.random

    // ---------- os números da luta ----------
    const T = {
      agente: { vida: 200, andar: 2.4, correr: 4.6, mirando: 1.45, acel: 16, freio: 22, folego: 6, folegoVolta: 1.4,
        esquiva: { dist: 2.7, dur: 0.5, inv: [0.03, 0.34], recarga: 0.7 }, invDano: 0.9 },
      dano: { garra: 25, investida: 35, carga: 35, tornado: 20 },
      kit: { cura: 60, inicio: 1, chance: 0.2 }, // começa com 1; a única fonte a mais: um móvel que cai pode soltar um (20%, um por vez)
      mae: { vida: 1400, barras: [0.20, 0.25, 0.25, 0.30], atordoada: 6, atordoadaDano: 0.6, enfraquecida: 12, cabeca: 2.0, parada: 1.3,
        cambaleio: { dano: 120, janela: 3, recarga: 12 }, provoca: 45, // provoca: dano que faz ela cortar a volta e atacar
        rodeia: [6, 5, 4.5, 4], raio: [5.2, 4.8, 4.8, 4.6], volta: [0.42, 0.48, 0.52, 0.56], garradas: [2, 2, 3, 3], aviso: [2.0, 1.7, 1.6, 1.4], preparo: [0.42, 0.38, 0.34, 0.32], descanso: [2.2, 2.0, 2.0, 2.4],
        bote: [5.5, 6.0, 6.5, 7.0], persegue: [1.0, 1.3, 1.6, 1.9], arranque: [5.0, 5.5, 6.0, 6.5], segue: [2.2, 2.5, 2.8, 3.0] }, // bote: o passo da garrada (m/s); persegue: quanto a investida corrige a rota no ar (rad/s); arranque: a corrida aos trancos até você (m/s); segue: o quanto ela vem atrás enquanto ergue o braço (m/s)
      berco: { vida: 200 },
      tornado: { r0: 2.55, r1: 3.7, empurra: 6.5, altura: 7 }, // a barreira do berço: um redemoinho justo em volta da ilha
      pistola: { cd: 0.2, dano: 3, calor: 3, trava: 5, vel: 40 }, // os números das armas
      escopeta: { cd: 1.0, n: 5, dano: 10, calor: 30, trava: 8, leque: 0.065, vel: 46 },
    }
    const BAR_HP = T.mae.barras.map((k) => Math.round(k * T.mae.vida))

    // ---------- a arena: 24 × 32 m, sem teto; o berço numa ilha seca um pouco para o fundo ----------
    const RW = 12, RD = 16, WH = 7.5
