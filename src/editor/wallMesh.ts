// As paredes viram poucas malhas: uma por textura (como a "casca" do laboratório), em vez de várias peças por
// pedaço de parede. Os cantos se juntam assim, olhando os vizinhos de cada ponta do pedaço:
//   - continua reto do outro lado da ponta: nada a fazer (as faces se encontram);
//   - encontra uma parede de lado (canto em L, T ou cruz): as faces avançam meia espessura e fecham o canto
//     (o que avança para dentro da outra parede fica escondido nela);
//   - ponta solta: uma tampa fecha a ponta.
// A sombra de canto (a etapa 3a da iluminação, o "smooth lighting" do Minecraft): cada vértice das paredes, dos pisos e
// dos tetos guarda o quanto ele está encostado num canto (parede com chão, com teto, com outra parede), e a malha escurece
// macio ali. Não fica gravado no mapa: sai das paredes e dos pisos toda vez que a malha é montada, e não custa nada por
// quadro (é uma cor por vértice; vale para os três níveis de qualidade).
// A luz das lâmpadas assada (a etapa 3b): cada vértice guarda também a luz que chega nele de cada lâmpada do mapa, com
// as paredes bloqueando (maps/luzAssada.ts); o Baixo e o Médio usam isso no lugar das lâmpadas de verdade (render/assada.ts).
import * as THREE from 'three'
import { CHUNK, LEVEL_H, PORTA_GRANDE_H as GRANDE_H, PORTA_H, type Axis, type Chunk, type Opening, type Wall, type WallSide } from '../maps/types'
import { assadorDe, novaLuzVertice, type Assador } from '../maps/luzAssada'
import { BATENTE, TOPO } from '../render/materiais' // o corte da parede (topo e vergas) e a madeira do batente

export const ESPESSURA = 0.12 // a espessura da parede (m)
const JANELA_Y0 = 0.9, JANELA_Y1 = 2.1
const T2 = ESPESSURA / 2
/** A sombra de canto: forca = o quanto cada encosto escurece (dois encostos, duas vezes); alcance = até onde ela sobe na parede (m). */
export const SOMBRA = { forca: 0.45, alcance: 0.7 }
const sombra = (encostos: number) => (1 - SOMBRA.forca) ** encostos
const PASSO_LUZ = 0.5 // de quanto em quanto a parede ganha vértices para a luz assada (m)
const PASSOS_Y = Array.from({ length: Math.ceil(LEVEL_H / PASSO_LUZ) - 1 }, (_, i) => (i + 1) * PASSO_LUZ)

interface Buf { p: number[]; n: number[]; uv: number[]; c: number[]; la: number[]; lb: number[]; lr: number[]; lj: number[]; li: number[]; i: number[] }
const novoBuf = (): Buf => ({ p: [], n: [], uv: [], c: [], la: [], lb: [], lr: [], lj: [], li: [], i: [] })
// As malhas saem por bloco de 16 m (a etapa 7b): uma por textura em cada bloco, com a chave "cx_cz|textura". Assim o
// three descarta os blocos que a câmera não vê, e a sombra de uma lâmpada só desenha os blocos ao alcance dela (antes
// cada sombra desenhava o mapa inteiro). As contas que olham os vizinhos (os cantos, a sombra de canto, a luz assada)
// continuam vendo o mapa todo: só a malha é que sai separada.
let bloco = '' // o bloco do que está sendo desenhado agora ("cx_cz|")
const blocoDe = (x: number, z: number) => `${Math.floor(x / CHUNK)}_${Math.floor(z / CHUNK)}|`
/** A textura de uma chave "cx_cz|textura" das malhas do mapa. */
export const texturaDaChave = (k: string) => k.slice(k.indexOf('|') + 1)
// a luz assada da malha sendo montada agora: quem calcula e o andar do que está sendo desenhado (quad lê daqui)
let assa: Assador | null = null, andar = 0
const _luz = novaLuzVertice(), SEM_LUZ = novaLuzVertice()
type V3 = [number, number, number]

const k = (level: number, axis: Axis, x: number, z: number) => `${level}|${axis}|${x}|${z}`

/** Um retângulo de 4 cantos na ordem da volta; a ordem é corrigida para a face olhar para o lado da normal.
 *  luz = a sombra de canto de cada canto (1 = sem sombra). */
function quad(b: Buf, c: V3[], n: V3, uv: [number, number][], luz: number[] = SEM_SOMBRA) {
  const e1 = [c[1][0] - c[0][0], c[1][1] - c[0][1], c[1][2] - c[0][2]], e2 = [c[2][0] - c[0][0], c[2][1] - c[0][1], c[2][2] - c[0][2]]
  const cr = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]]
  const ordem = cr[0] * n[0] + cr[1] * n[1] + cr[2] * n[2] >= 0 ? [0, 1, 2, 3] : [0, 3, 2, 1]
  const v0 = b.p.length / 3
  const mx = (c[0][0] + c[1][0] + c[2][0] + c[3][0]) / 4, my = (c[0][1] + c[1][1] + c[2][1] + c[3][1]) / 4, mz = (c[0][2] + c[1][2] + c[2][2] + c[3][2]) / 4
  for (const j of ordem) {
    b.p.push(...c[j]); b.n.push(...n); b.uv.push(...uv[j]); b.c.push(luz[j], luz[j], luz[j])
    // a luz das lâmpadas e das janelas neste canto, olhando de um ponto um pouco para dentro da face (o canto fica em cima da parede)
    if (assa) {
      const dx = mx - c[j][0], dy = my - c[j][1], dz = mz - c[j][2], k = 0.1 / (Math.hypot(dx, dy, dz) || 1)
      assa(c[j], n, [c[j][0] + dx * k + n[0] * 0.05, c[j][1] + dy * k + n[1] * 0.05, c[j][2] + dz * k + n[2] * 0.05], andar, _luz)
    }
    const L = assa ? _luz : SEM_LUZ
    b.la.push(...L.a); b.lb.push(...L.b); b.lr.push(...L.resto); b.lj.push(...L.janela); b.li.push(...L.indireta)
  }
  // a diagonal liga os dois cantos mais claros: com um canto só escuro, o degradê não "quebra" no meio do quadrado
  if (luz[1] + luz[3] > luz[0] + luz[2]) b.i.push(v0, v0 + 1, v0 + 3, v0 + 1, v0 + 2, v0 + 3)
  else b.i.push(v0, v0 + 1, v0 + 2, v0, v0 + 2, v0 + 3)
}
const SEM_SOMBRA = [1, 1, 1, 1]

/** Os trechos de altura que ficam de pé: a porta tira de baixo, a janela tira do meio. */
function trechos(op?: Opening): [number, number][] {
  if (!op) return [[0, LEVEL_H]]
  if (op.kind === 'porta') return [[op.door === 'grande' ? GRANDE_H : PORTA_H, LEVEL_H]]
  return [[0, JANELA_Y0], [JANELA_Y1, LEVEL_H]]
}

/** O vão que a abertura tira da parede (de y0 a y1, a partir do chão do andar). */
export function buraco(op: Opening): [number, number] {
  return op.kind === 'porta' ? [0, op.door === 'grande' ? GRANDE_H : PORTA_H] : [JANELA_Y0, JANELA_Y1]
}

/** As geometrias das paredes até o andar maxLevel, uma por bloco e textura (e TOPO para os cortes): "cx_cz|textura". */
export function wallGeometries(chunks: Chunk[], maxLevel: number): Map<string, THREE.BufferGeometry> {
  const tem = new Set<string>(), aberturas = new Map<string, Opening>(), walls: Wall[] = []
  const pisos = new Set<string>() // os quadrados com piso (de todos os andares: o piso de cima é o teto, que faz sombra no alto da parede)
  for (const c of chunks) {
    for (const f of c.floors) pisos.add(`${f.level}_${f.x}_${f.z}`)
    for (const w of c.walls) if (w.level <= maxLevel) { tem.add(k(w.level, w.axis, w.x, w.z)); walls.push(w) }
    for (const o of c.openings) for (let i = 0; i < o.width; i++) aberturas.set(k(o.level, o.axis, o.axis === 'x' ? o.x + i : o.x, o.axis === 'z' ? o.z + i : o.z), o)
  }
  const bufs = new Map<string, Buf>()
  const buf = (tex: string) => { const k = bloco + tex; let b = bufs.get(k); if (!b) bufs.set(k, (b = novoBuf())); return b }
  assa = assadorDe(chunks)

  for (const w of walls) {
    andar = w.level; bloco = blocoDe(w.x, w.z)
    const L = w.level, y0 = L * LEVEL_H, ax = w.axis
    // a ponta em (vx, vz): continua reto? encontra parede de lado?
    const ponta = (vx: number, vz: number, inicio: boolean) => {
      const reto = ax === 'x' ? tem.has(k(L, 'x', inicio ? vx - 1 : vx, vz)) : tem.has(k(L, 'z', vx, inicio ? vz - 1 : vz))
      if (reto) return { e: 0, tampa: false }
      const lado = ax === 'x' ? tem.has(k(L, 'z', vx, vz - 1)) || tem.has(k(L, 'z', vx, vz)) : tem.has(k(L, 'x', vx - 1, vz)) || tem.has(k(L, 'x', vx, vz))
      return lado ? { e: T2, tampa: false } : { e: 0, tampa: true }
    }
    const p0 = ponta(w.x, w.z, true), p1 = ax === 'x' ? ponta(w.x + 1, w.z, false) : ponta(w.x, w.z + 1, false)
    const s = ax === 'x' ? w.x : w.z
    const u0 = s - p0.e, u1 = s + 1 + p1.e
    // (u ao longo da parede, deslocamento s para o lado, altura y) -> mundo
    const P = (u: number, d: number, y: number): V3 => (ax === 'x' ? [u, y0 + y, w.z + d] : [w.x + d, y0 + y, u])
    const nLado = (sinal: number): V3 => (ax === 'x' ? [0, 0, sinal] : [sinal, 0, 0])
    const nAo = (sinal: number): V3 => (ax === 'x' ? [sinal, 0, 0] : [0, 0, sinal])

    const lado = (side: WallSide, sinal: number, ya: number, yb: number) => {
      const hb = side.base ? side.base.h : 0, faixas: [number, number, string][] = []
      if (side.base && ya < hb) faixas.push([ya, Math.min(yb, hb), side.base.tex])
      if (yb > Math.max(ya, hb)) faixas.push([Math.max(ya, hb), yb, side.tex])
      const d = sinal * T2
      // a sombra de canto deste lado: no pé (o chão), no alto (se tem teto sobre o quadrado deste lado) e nas pontas
      // onde outra parede sai para este lado (o canto de dentro de uma sala)
      const b = sinal > 0 ? 0 : -1
      const teto = pisos.has(ax === 'x' ? `${L + 1}_${w.x}_${w.z + b}` : `${L + 1}_${w.x + b}_${w.z}`)
      const canto = (fim: number) => (tem.has(ax === 'x' ? k(L, 'z', w.x + fim, w.z + b) : k(L, 'x', w.x + b, w.z + fim)) ? 1 : 0)
      const c0 = canto(0), c1 = canto(1)
      const emY = (y: number) => (y <= 0 ? 1 : y >= LEVEL_H && teto ? 1 : 0)
      for (const [fa, fb, tex] of faixas) {
        // a faixa é cortada onde a sombra acaba (para o degradê ter o alcance dela e não a altura da parede) e a cada
        // PASSO_LUZ, na altura e no comprimento: a luz assada é por vértice, e uma arandela colada na parede precisa de
        // vértices perto dela para aparecer
        const ys = [...new Set([fa, fb, ...[SOMBRA.alcance, LEVEL_H - SOMBRA.alcance, ...PASSOS_Y].filter((y) => y > fa + 0.05 && y < fb - 0.05)])].sort((p, q) => p - q)
        const us = [u0, s + 0.5, u1]
        for (let i = 0; i < ys.length - 1; i++) for (let j = 0; j < 2; j++) {
          const ya2 = ys[i], yb2 = ys[i + 1], ea = emY(ya2), eb = emY(yb2), ua = us[j], ub = us[j + 1]
          // (no meio do pedaço a sombra do canto é a média das duas pontas: o degradê continua reto)
          const luz = (k: number, e: number) => (j + k === 1 ? (sombra(c0 + e) + sombra(c1 + e)) / 2 : sombra((j + k === 0 ? c0 : c1) + e))
          quad(buf(tex), [P(ua, d, ya2), P(ub, d, ya2), P(ub, d, yb2), P(ua, d, yb2)], nLado(sinal), [[ua, ya2], [ub, ya2], [ub, yb2], [ua, yb2]],
            [luz(0, ea), luz(1, ea), luz(1, eb), luz(0, eb)])
        }
      }
    }

    // o batente: nas pontas do vão (onde o pedaço vizinho não é da mesma abertura), a madeira por dentro da espessura
    const op = aberturas.get(k(L, ax, w.x, w.z))
    if (op) {
      const [h0, h1] = buraco(op)
      const viz = (d: number) => aberturas.get(ax === 'x' ? k(L, 'x', w.x + d, w.z) : k(L, 'z', w.x, w.z + d)) === op
      if (!viz(-1)) quad(buf(BATENTE), [P(s, -T2, h0), P(s, T2, h0), P(s, T2, h1), P(s, -T2, h1)], nAo(1), [[0, h0], [1, h0], [1, h1], [0, h1]])
      if (!viz(1)) quad(buf(BATENTE), [P(s + 1, -T2, h0), P(s + 1, T2, h0), P(s + 1, T2, h1), P(s + 1, -T2, h1)], nAo(-1), [[0, h0], [1, h0], [1, h1], [0, h1]])
    }
    for (const [ya, yb] of trechos(op)) {
      lado(w.a, -1, ya, yb)
      lado(w.b, 1, ya, yb)
      quad(buf(TOPO), [P(u0, -T2, yb), P(u1, -T2, yb), P(u1, T2, yb), P(u0, T2, yb)], [0, 1, 0], [[u0, 0], [u1, 0], [u1, 1], [u0, 1]])
      if (ya > 0) quad(buf(TOPO), [P(u0, -T2, ya), P(u1, -T2, ya), P(u1, T2, ya), P(u0, T2, ya)], [0, -1, 0], [[u0, 0], [u1, 0], [u1, 1], [u0, 1]])
      if (p0.tampa) quad(buf(w.a.tex), [P(u0, -T2, ya), P(u0, T2, ya), P(u0, T2, yb), P(u0, -T2, yb)], nAo(-1), [[0, ya], [1, ya], [1, yb], [0, yb]])
      if (p1.tampa) quad(buf(w.a.tex), [P(u1, -T2, ya), P(u1, T2, ya), P(u1, T2, yb), P(u1, -T2, yb)], nAo(1), [[0, ya], [1, ya], [1, yb], [0, yb]])
    }
  }

  return geometrias(bufs)
}

/** Os pisos até o andar maxLevel, juntados por textura: a face de cima (o chão) e a de baixo (o teto do andar de baixo). */
export function floorGeometries(chunks: Chunk[], maxLevel: number): Map<string, THREE.BufferGeometry> {
  const bufs = new Map<string, Buf>()
  const buf = (tex: string) => { const k = bloco + tex; let b = bufs.get(k); if (!b) bufs.set(k, (b = novoBuf())); return b }
  // a sombra de canto: em cada ponto da grade, as paredes que chegam nele (num eixo, no outro). A porta e o vão não
  // contam (não tem parede no chão ali); a janela conta.
  const portas = new Set<string>(), noX = new Set<string>(), noZ = new Set<string>()
  for (const c of chunks) for (const o of c.openings) if (o.kind === 'porta') for (let i = 0; i < o.width; i++) portas.add(k(o.level, o.axis, o.axis === 'x' ? o.x + i : o.x, o.axis === 'z' ? o.z + i : o.z))
  for (const c of chunks) for (const w of c.walls) {
    if (portas.has(k(w.level, w.axis, w.x, w.z))) continue
    const nos = w.axis === 'x' ? noX : noZ
    nos.add(`${w.level}_${w.x}_${w.z}`); nos.add(w.axis === 'x' ? `${w.level}_${w.x + 1}_${w.z}` : `${w.level}_${w.x}_${w.z + 1}`)
  }
  // um ponto encostado numa parede escurece; num canto de duas paredes, duas vezes
  const luzEm = (L: number, x: number, z: number) => sombra((noX.has(`${L}_${x}_${z}`) ? 1 : 0) + (noZ.has(`${L}_${x}_${z}`) ? 1 : 0))
  const luzes = (L: number, x: number, z: number) => [luzEm(L, x, z), luzEm(L, x + 1, z), luzEm(L, x + 1, z + 1), luzEm(L, x, z + 1)]
  assa = assadorDe(chunks)
  // o buraco: o piso de cima some sobre a escada do andar de baixo (o dado do piso fica; quem corta é a escada)
  const buraco = new Set<string>()
  for (const c of chunks) for (const st of c.stairs) for (let x = st.x; x < st.x + st.w; x++) for (let z = st.z; z < st.z + st.d; z++) buraco.add(`${st.level + 1}_${x}_${z}`)
  for (const c of chunks) for (const f of c.floors) {
    if (f.level > maxLevel || buraco.has(`${f.level}_${f.x}_${f.z}`)) continue
    const y = f.level * LEVEL_H, x0 = f.x, x1 = f.x + 1, z0 = f.z, z1 = f.z + 1
    const uv: [number, number][] = [[x0, z0], [x1, z0], [x1, z1], [x0, z1]]
    andar = f.level; bloco = blocoDe(f.x, f.z)
    quad(buf(f.top), [[x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1]], [0, 1, 0], uv, luzes(f.level, f.x, f.z))
    // o teto é do andar de baixo: quem faz sombra nele são as paredes de lá (e as lâmpadas de lá é que iluminam)
    andar = f.level - 1
    if (f.level > 0) quad(buf(f.bottom), [[x0, y - TETO, z0], [x1, y - TETO, z0], [x1, y - TETO, z1], [x0, y - TETO, z1]], [0, -1, 0], uv, luzes(f.level - 1, f.x, f.z))
  }
  return geometrias(bufs)
}
const TETO = 0.02 // o teto fica um tico abaixo do chão de cima, para as duas faces não brigarem

/** Quantos degraus uma escada tem (espelho de ~18 cm). */
export const degrausDe = (rise: number) => Math.max(2, Math.round(rise / 0.18))

/**
 * As escadas até o andar maxLevel, juntadas por textura: cada degrau é um bloco maciço do chão até o piso dele
 * (o piso, o espelho na frente e os dois lados), mais o fundo atrás do último. A textura vai pelo mundo, como nas paredes.
 */
export function stairGeometries(chunks: Chunk[], maxLevel: number): Map<string, THREE.BufferGeometry> {
  const bufs = new Map<string, Buf>()
  const buf = (tex: string) => { const k = bloco + tex; let b = bufs.get(k); if (!b) bufs.set(k, (b = novoBuf())); return b }
  assa = assadorDe(chunks)
  for (const c of chunks) for (const st of c.stairs) {
    if (st.level > maxLevel) continue
    andar = st.level; bloco = blocoDe(st.x, st.z)
    const y0 = st.level * LEVEL_H, ns = st.dir === 'norte' || st.dir === 'sul'
    const comp = ns ? st.d : st.w, larg = ns ? st.w : st.d, n = degrausDe(st.rise), t = comp / n
    // (a ao longo da subida a partir do pé, c atravessando) -> (x, z) no mundo
    const XZ = (a: number, c: number): [number, number] =>
      st.dir === 'sul' ? [st.x + c, st.z + a] : st.dir === 'norte' ? [st.x + c, st.z + st.d - a] : st.dir === 'leste' ? [st.x + a, st.z + c] : [st.x + st.w - a, st.z + c]
    const P = (a: number, c: number, y: number): V3 => { const [x, z] = XZ(a, c); return [x, y0 + y, z] }
    const sobe: V3 = st.dir === 'sul' ? [0, 0, 1] : st.dir === 'norte' ? [0, 0, -1] : st.dir === 'leste' ? [1, 0, 0] : [-1, 0, 0]
    const lado: V3 = ns ? [1, 0, 0] : [0, 0, 1]
    const neg = (v: V3): V3 => [-v[0], -v[1], -v[2]]
    const b = buf(st.tex)
    const uvTopo = (pts: V3[]) => pts.map((q) => [q[0], q[2]] as [number, number])
    const uvFrente = (pts: V3[]) => pts.map((q) => [ns ? q[0] : q[2], q[1] - y0] as [number, number])
    const uvLado = (pts: V3[]) => pts.map((q) => [ns ? q[2] : q[0], q[1] - y0] as [number, number])
    for (let i = 0; i < n; i++) {
      const a0 = i * t, a1 = (i + 1) * t, h = ((i + 1) * st.rise) / n, h0 = (i * st.rise) / n
      let q = [P(a0, 0, h), P(a1, 0, h), P(a1, larg, h), P(a0, larg, h)]; quad(b, q, [0, 1, 0], uvTopo(q))
      q = [P(a0, 0, h0), P(a0, larg, h0), P(a0, larg, h), P(a0, 0, h)]; quad(b, q, neg(sobe), uvFrente(q))
      q = [P(a0, 0, 0), P(a1, 0, 0), P(a1, 0, h), P(a0, 0, h)]; quad(b, q, neg(lado), uvLado(q))
      q = [P(a0, larg, 0), P(a1, larg, 0), P(a1, larg, h), P(a0, larg, h)]; quad(b, q, lado, uvLado(q))
    }
    const q = [P(comp, 0, 0), P(comp, larg, 0), P(comp, larg, st.rise), P(comp, 0, st.rise)]; quad(b, q, sobe, uvFrente(q))
  }
  return geometrias(bufs)
}

function geometrias(bufs: Map<string, Buf>) {
  assa = null
  const out = new Map<string, THREE.BufferGeometry>()
  for (const [tex, b] of bufs) {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(b.p, 3))
    g.setAttribute('normal', new THREE.Float32BufferAttribute(b.n, 3))
    g.setAttribute('uv', new THREE.Float32BufferAttribute(b.uv, 2))
    g.setAttribute('color', new THREE.Float32BufferAttribute(b.c, 3)) // a sombra de canto (o material multiplica)
    // a luz assada: as duas lâmpadas mais fortes (com o número de cada uma), o resto delas e a das janelas
    g.setAttribute('luzA', new THREE.Float32BufferAttribute(b.la, 4)); g.setAttribute('luzB', new THREE.Float32BufferAttribute(b.lb, 4))
    g.setAttribute('luzResto', new THREE.Float32BufferAttribute(b.lr, 3)); g.setAttribute('luzJanela', new THREE.Float32BufferAttribute(b.lj, 3))
    g.setAttribute('luzIndireta', new THREE.Float32BufferAttribute(b.li, 3)) // a luz indireta (o recurso do Ultra)
    g.setIndex(b.i)
    out.set(tex, g)
  }
  return out
}

/**
 * A malha de sombra de cada bloco: as paredes, os pisos e as escadas do bloco juntos numa geometria só, sem textura.
 * É ela que faz sombra (uma chamada de desenho por bloco em cada sombra, no lugar de uma por textura); as malhas com
 * textura só recebem. Fora da sombra ela não desenha nada (MapView liga e desliga pelo intervalo de desenho).
 */
export function sombraGeometries(...mapas: Map<string, THREE.BufferGeometry>[]): Map<string, THREE.BufferGeometry> {
  const porBloco = new Map<string, { p: number[]; i: number[] }>()
  for (const mapa of mapas) for (const [k, g] of mapa) {
    const chave = k.slice(0, k.indexOf('|'))
    let b = porBloco.get(chave)
    if (!b) porBloco.set(chave, (b = { p: [], i: [] }))
    const base = b.p.length / 3, pos = g.attributes.position.array, ind = g.index!.array
    for (let n = 0; n < pos.length; n++) b.p.push(pos[n])
    for (let n = 0; n < ind.length; n++) b.i.push(ind[n] + base)
  }
  const out = new Map<string, THREE.BufferGeometry>()
  for (const [chave, b] of porBloco) {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(b.p, 3))
    g.setIndex(b.i); g.computeBoundingSphere(); g.setDrawRange(0, 0)
    out.set(chave, g)
  }
  return out
}
