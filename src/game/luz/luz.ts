// A luz do lugar, viva: os valores de agora (as cores e as forças), que andam suave até a ambientação de onde o agente
// está (maps/ambientes.ts) e recebem por cima o momento que estiver tocando (a Mãe chegando). Aqui é só conta:
// quem põe as luzes na cena é Iluminacao.tsx.
import * as THREE from 'three'
import { MOMENTOS, TROCA, ambienteDe, type Ambiente, type Momento } from '../../maps/ambientes'
import type { AreaAmbiente } from '../../maps/types'
import { andarDe } from '../world/colisao'

const CORES = ['neblina', 'ceu', 'chao', 'preenchimento', 'luar', 'contorno', 'sombras', 'luzes'] as const
const NUMEROS = ['densidade', 'forca', 'forcaPreenchimento', 'forcaLuar', 'forcaContorno', 'exposicao', 'brilho', 'contraste', 'saturacao', 'vinheta'] as const
export type Luz = Record<(typeof CORES)[number], THREE.Color> & Record<(typeof NUMEROS)[number], number>

function luzDe(a: Partial<Ambiente>): Partial<Luz> {
  const l: Partial<Luz> = {}
  for (const c of CORES) if (a[c] !== undefined) l[c] = new THREE.Color(a[c])
  for (const n of NUMEROS) if (a[n] !== undefined) l[n] = a[n]
  return l
}
// cada ambientação e cada momento viram cores do three uma vez só
const prontas = new Map<object, Partial<Luz>>()
const pronta = (a: Partial<Ambiente>) => { let l = prontas.get(a); if (!l) prontas.set(a, (l = luzDe(a))); return l }

/** A ambientação de um ponto do mapa: a da menor área que contém o ponto (no andar dele), ou a padrão do mapa. */
export function ambienteEm(padrao: string, areas: AreaAmbiente[], x: number, y: number, z: number): Ambiente {
  const L = andarDe(y)
  let nome = padrao, tam = Infinity
  for (const a of areas) if (a.level === L && x >= a.x && x < a.x + a.w && z >= a.z && z < a.z + a.d && a.w * a.d < tam) { nome = a.ambiente; tam = a.w * a.d }
  return ambienteDe(nome)
}

// o momento tocando agora (um por vez: o novo toma o lugar do antigo)
let tocando: { m: Momento; t: number } | null = null

/** Começa um momento do catálogo (MOMENTOS): a luz muda por alguns segundos e volta sozinha. */
export function momento(nome: string) {
  const m = MOMENTOS[nome]
  if (m) tocando = { m, t: 0 }
}

export interface LuzViva { lugar: Luz; agora: Luz } // a luz do lugar (andando até o alvo) e a que vale (com o momento)

export function novaLuzViva(a: Ambiente): LuzViva {
  const l = luzDe(a) as Luz
  return { lugar: l, agora: { ...l, ...Object.fromEntries(CORES.map((c) => [c, l[c].clone()])) } as Luz }
}

/** Um quadro: a luz do lugar anda até a ambientação `alvo` e o momento (se houver) entra por cima. Uma chamada por quadro. */
export function passoLuz(v: LuzViva, alvo: Ambiente, dt: number) {
  const para = pronta(alvo) as Luz, k = 1 - Math.exp((-3 * dt) / TROCA), L = v.lugar, A = v.agora
  for (const c of CORES) L[c].lerp(para[c], k)
  for (const n of NUMEROS) L[n] += (para[n] - L[n]) * k
  let w = 0, muda: Partial<Luz> = {}
  if (tocando) {
    tocando.t += dt
    const { entra, dura, sai } = tocando.m, t = tocando.t
    w = t < entra ? t / entra : t < entra + dura ? 1 : 1 - (t - entra - dura) / sai
    if (w <= 0) { tocando = null; w = 0 } else { w = w * w * (3 - 2 * w); muda = pronta(tocando.m.muda) }
  }
  for (const c of CORES) { A[c].copy(L[c]); const m = muda[c]; if (m) A[c].lerp(m, w) }
  for (const n of NUMEROS) { const m = muda[n]; A[n] = m === undefined ? L[n] : L[n] + (m - L[n]) * w }
}
