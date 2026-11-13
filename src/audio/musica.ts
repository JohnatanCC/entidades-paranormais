// A trilha: uma faixa por vez, em laço, chamada por NOME (os arquivos ficam em public/musica/<nome>.mp3).
// O volume é o geral × o da música (as configurações). O navegador só deixa tocar depois do primeiro clique ou tecla:
// até lá a faixa fica esperando e começa sozinha na primeira interação. Trocar de faixa faz um fade curto.
import { useEffect } from 'react'
import { getSettings, useSettings } from '../settings/settings'

// devorador: "O devorador de almas", a luta do chefe da Demo · Intro; batalha: as hordas (a do laboratório)
export type Faixa = 'menu' | 'devorador' | 'batalha'

let audio: HTMLAudioElement | null = null
let atual: Faixa | null = null
let fade = 0

const alvo = () => { const s = getSettings(); return (s.volume / 100) * (s.musica / 100) }

function rampa(a: HTMLAudioElement, para: number, ms: number, fim?: () => void) {
  cancelAnimationFrame(fade)
  const de = a.volume, t0 = performance.now()
  const passo = (t: number) => {
    const k = Math.max(0, Math.min(1, (t - t0) / ms)) // o relógio do quadro pode vir um tico antes de t0: nunca negativo
    a.volume = de + (para - de) * k
    if (k < 1) fade = requestAnimationFrame(passo)
    else fim?.()
  }
  fade = requestAnimationFrame(passo)
}

function tocar() {
  if (!audio) return
  audio.play().catch(() => {
    // ainda sem permissão do navegador: tenta de novo na primeira interação
    const vai = () => { window.removeEventListener('pointerdown', vai); window.removeEventListener('keydown', vai); audio?.play().catch(() => {}) }
    window.addEventListener('pointerdown', vai, { once: true })
    window.addEventListener('keydown', vai, { once: true })
  })
}

/** Troca a faixa (null = silêncio). A mesma faixa continua de onde está. */
export function musica(f: Faixa | null) {
  if (f === atual) return
  atual = f
  const velho = audio
  if (velho) rampa(velho, 0, 600, () => velho.pause())
  if (!f) { audio = null; return }
  audio = new Audio(`${import.meta.env.BASE_URL}musica/${f}.mp3`)
  audio.loop = true
  audio.volume = 0
  tocar()
  rampa(audio, alvo(), 1200)
}

/** Toca a faixa enquanto a tela estiver aberta e segue o volume das configurações. */
export function useMusica(f: Faixa | null) {
  const { volume, musica: vm } = useSettings()
  useEffect(() => { musica(f) }, [f])
  useEffect(() => { if (audio && atual) { cancelAnimationFrame(fade); audio.volume = (volume / 100) * (vm / 100) } }, [volume, vm])
}
