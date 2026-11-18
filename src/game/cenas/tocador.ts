// O tocador das cenas, a conta pura: dado o tempo da cena, em que plano ela está, onde a câmera fica e para onde olha,
// o quanto a tela está escura, a legenda e o título. Quem desenha (TocarCena.tsx, Moldura.tsx) só lê o resultado.
import type { Cena, Curva, Fala, V3 } from './tipos'

export const LENTE = 45 // o campo de visão padrão (graus)
const FADE_TITULO = 0.5 // s: o título aparece e some

/** O que a cena mostra num instante. */
export interface EstadoCena {
  plano: number; nome: string; local: number // o plano, o nome dele e quantos s dele já passaram
  pos: V3; olha: V3; lente: number; treme: number // a câmera
  preto: boolean // o plano não tem câmera (o título, uma pausa)
  escuro: number // 0 a 1: o preto por cima da imagem
  legenda: Fala | null
  titulo: { texto: string; opacidade: number } | null
  fim: boolean // passou do último plano
}

export const duracao = (c: Cena) => c.planos.reduce((s, p) => s + p.dura, 0)

/** Onde cada plano começa (s), na ordem. */
export function inicios(c: Cena): number[] {
  const l: number[] = []
  let t = 0
  for (const p of c.planos) { l.push(t); t += p.dura }
  return l
}

const curvas: Record<Curva, (k: number) => number> = {
  suave: (k) => k * k * (3 - 2 * k),
  entra: (k) => k * k,
  sai: (k) => 1 - (1 - k) * (1 - k),
  linear: (k) => k,
}
const mistura = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k]

/** O estado da cena no tempo `t` (s desde o começo). */
export function estadoEm(c: Cena, t: number): EstadoCena {
  const total = duracao(c), fim = t >= total
  let i = 0, comeco = 0
  while (i < c.planos.length - 1 && t >= comeco + c.planos[i].dura) { comeco += c.planos[i].dura; i++ }
  const p = c.planos[i], local = Math.max(0, Math.min(p.dura, t - comeco)), k = p.dura > 0 ? local / p.dura : 1
  const cam = p.camera
  const mov = curvas[cam?.curva ?? 'suave'](k)
  const pos = cam ? mistura(cam.de, cam.para ?? cam.de, mov) : ([0, 0, 0] as V3)
  const olha = cam ? mistura(cam.olha, cam.olhaFim ?? cam.olha, mov) : ([0, 0, -1] as V3)
  // o preto: o plano sem câmera, o clarear do começo e o escurecer do fim
  let escuro = cam ? 0 : 1
  if (cam && p.clareia) escuro = Math.max(escuro, 1 - Math.min(1, local / p.clareia))
  if (cam && p.escurece) escuro = Math.max(escuro, 1 - Math.min(1, (p.dura - local) / p.escurece))
  if (fim) escuro = 1
  const legenda = p.falas?.find((f) => local >= f.t && local < f.t + f.dura) ?? null
  let titulo: EstadoCena['titulo'] = null
  if (p.titulo && local >= p.titulo.t && local < p.titulo.t + p.titulo.dura) {
    const a = local - p.titulo.t, b = p.titulo.t + p.titulo.dura - local
    titulo = { texto: p.titulo.texto, opacidade: Math.min(1, a / FADE_TITULO, b / FADE_TITULO) }
  }
  return { plano: i, nome: p.nome, local, pos, olha, lente: cam?.lente ?? LENTE, treme: cam?.treme ?? 1, preto: !cam, escuro, legenda, titulo, fim }
}
