// Só no npm run dev: grava a cena aberta no Ver cenas num vídeo (provas.gravar() pelo console), salvo em
// gravacoes/<id da cena>.webm pela API de desenvolvimento (tools/mapsDevApi.ts). Serve para mostrar uma cena a alguém
// (os candidatos à dublagem, por exemplo) sem abrir o jogo.
// Toca a cena do começo, em tempo real, e junta num quadro de 1280 × 720 o que a tela mostra: a imagem do jogo, o preto
// do clarear e do escurecer, as faixas de cinema, a legenda e o título (que no Ver cenas são da página, não do jogo:
// Moldura.tsx; as medidas daqui copiam as de styles.css). Os sons sintetizados entram no vídeo.
// A voz provisória NÃO entra: é a voz do navegador, que não deixa gravar. Enquanto grava, ela fica calada.
// Funciona com o painel escondido: é esta função que puxa os quadros, um a um.
import { advance } from '@react-three/fiber'
import { som } from '../audio/sintese'
import { duracao, estadoEm } from '../game/cenas/tocador'
import { ganchos } from './ganchos'

const W = 1280, H = 720, FAIXA = 0.105, QUADRO = 1000 / 30 // o vídeo, a altura das faixas de cinema, o passo (ms)
/** O passo do vídeo vem de fora da página (um Worker): com o painel escondido o navegador atrasa os temporizadores
 *  da página (depois de um tempo, um por segundo) e a gravação saía em câmera lenta; os do Worker ele não atrasa. */
function passoDeFora(ms: number) {
  const w = new Worker(URL.createObjectURL(new Blob([`setInterval(() => postMessage(0), ${ms})`], { type: 'text/javascript' })))
  let acorda: (() => void) | null = null
  w.onmessage = () => { acorda?.(); acorda = null }
  return { proximo: () => new Promise<void>((r) => { acorda = r }), fim: () => w.terminate() }
}

/** Escreve a duração (ms) no .webm: o gravador do navegador não escreve, e sem ela o player não mostra o tempo do vídeo
 *  nem deixa avançar direito. É acrescentar a Duration (44 89, um número de 8 bytes) no bloco Info (15 49 A9 66). */
function comDuracao(b: Uint8Array, ms: number): Uint8Array {
  const acha = (id: number[]) => { for (let i = 0; i < Math.min(b.length, 4096) - id.length; i++) if (id.every((v, k) => b[i + k] === v)) return i; return -1 }
  const i = acha([0x15, 0x49, 0xa9, 0x66])
  if (i < 0) return b
  let L = 1; while (L <= 8 && !(b[i + 4] & (0x80 >> (L - 1)))) L++ // o tamanho do Info: um número de L bytes
  let tam = b[i + 4] & (0xff >> L); for (let k = 1; k < L; k++) tam = tam * 256 + b[i + 4 + k]
  const ini = i + 4 + L, fim = ini + tam, info = b.subarray(ini, fim)
  for (let k = 0; k < info.length - 1; k++) if (info[k] === 0x44 && info[k + 1] === 0x89) return b // já tem
  const novo = new Uint8Array(i + 4 + 8 + tam + 11 + (b.length - fim)), v = new DataView(novo.buffer)
  novo.set(b.subarray(0, i + 4), 0)
  let p = i + 4
  novo[p] = 0x01; v.setUint32(p + 4, tam + 11); p += 8 // o tamanho novo, em 8 bytes
  novo.set(info, p); p += tam
  novo[p] = 0x44; novo[p + 1] = 0x89; novo[p + 2] = 0x88; v.setFloat64(p + 3, ms); p += 11
  novo.set(b.subarray(fim), p)
  return novo
}

/** de, ate: o trecho (s da cena; sem eles, a cena toda); mudo: sem som nas caixas enquanto grava; nome: o do arquivo
 *  (sem ele, o id da cena). */
export interface Gravacao { de?: number; ate?: number; mudo?: boolean; nome?: string }

export async function gravarCena(opc: Gravacao = {}): Promise<string> {
  const R = ganchos.relogio, gl = ganchos.gl, cena = ganchos.cenaAberta
  if (!R || !gl || !cena) return 'abra o Ver cenas e escolha a cena antes de gravar'
  const fim = Math.min(duracao(cena), opc.ate ?? Infinity)
  const tela = document.createElement('canvas'); tela.width = W; tela.height = H
  const g = tela.getContext('2d')!
  const css = getComputedStyle(document.documentElement), v = (n: string, d: string) => css.getPropertyValue(n).trim() || d
  const creme = v('--cream', '#e8dcc0'), ambar = v('--amber', '#e0a050'), display = v('--display', 'monospace'), corpo = getComputedStyle(document.body).fontFamily
  const linhas = (txt: string, max: number) => {
    const out: string[] = []; let l = ''
    for (const p of txt.split(' ')) { const t = l ? l + ' ' + p : p; if (g.measureText(t).width > max && l) { out.push(l); l = p } else l = t }
    if (l) out.push(l)
    return out
  }
  /** Um quadro do vídeo: a imagem do jogo (cobrindo o quadro), o preto, as faixas, a legenda e o título. */
  const compor = () => {
    const e = estadoEm(cena, R.t), c = gl.domElement, k = Math.max(W / c.width, H / c.height)
    g.drawImage(c, (W - c.width * k) / 2, (H - c.height * k) / 2, c.width * k, c.height * k)
    if (e.escuro > 0) { g.fillStyle = `rgba(0,0,0,${e.escuro})`; g.fillRect(0, 0, W, H) }
    g.fillStyle = '#000'; g.fillRect(0, 0, W, H * FAIXA); g.fillRect(0, H * (1 - FAIXA), W, H * FAIXA)
    g.textAlign = 'center'; g.textBaseline = 'top'
    if (e.legenda) {
      g.font = `19px ${corpo}`
      const ls = linhas(e.legenda.texto, 732), lh = 27, nome = 26
      const larg = Math.max(80, ...ls.map((l) => g.measureText(l).width)) + 28, alt = nome + ls.length * lh + 12, y = H * 0.87 - alt
      g.fillStyle = 'rgba(0,0,0,0.55)'; g.fillRect(W / 2 - larg / 2, y, larg, alt)
      g.font = `22px ${display}`; g.fillStyle = ambar; g.fillText(e.legenda.quem, W / 2, y + 6)
      g.font = `${e.legenda.pensamento ? 'italic ' : ''}19px ${corpo}`; g.fillStyle = e.legenda.pensamento ? '#cfc6b4' : creme
      ls.forEach((l, i) => g.fillText(l, W / 2, y + 6 + nome + i * lh))
    }
    if (e.titulo) {
      g.globalAlpha = e.titulo.opacidade; g.font = `102px ${display}`; g.fillStyle = creme; g.textBaseline = 'middle'
      g.shadowColor = 'rgba(224,160,80,0.3)'; g.shadowBlur = 26
      g.fillText(e.titulo.texto.split('').join(' '), W / 2, H / 2) // as letras um fio afastadas, como na tela
      g.shadowBlur = 0; g.globalAlpha = 1
    }
  }

  // o som dos efeitos entra no vídeo (se já ligou: precisa de um clique na página); mudo, não sai nas caixas
  const s = som(), ctx = s?.ctx as AudioContext | undefined
  const fita = ctx ? ctx.createMediaStreamDestination() : null
  if (s && fita) { s.mestre.connect(fita); if (opc.mudo) s.mestre.disconnect(ctx!.destination) }
  // a voz do navegador não dá para gravar: fica calada enquanto grava
  const falarDeVerdade = window.speechSynthesis?.speak
  if (window.speechSynthesis) { speechSynthesis.cancel(); speechSynthesis.speak = () => {} }

  const fluxo = tela.captureStream(30)
  fita?.stream.getAudioTracks().forEach((t) => fluxo.addTrack(t))
  const tipo = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'].find((t) => MediaRecorder.isTypeSupported(t)) ?? ''
  const gravador = new MediaRecorder(fluxo, { mimeType: tipo, videoBitsPerSecond: 2.6e6, audioBitsPerSecond: 96000 }), partes: Blob[] = []
  gravador.ondataavailable = (ev) => { if (ev.data.size) partes.push(ev.data) }

  // do começo do trecho, parado; grava; toca
  R.t = opc.de ?? 0; R.saltou = true; R.tocando = false
  advance(performance.now(), true); advance(performance.now(), true); compor()
  gravador.start(1000)
  R.tocando = true; R.saltou = true
  const t0 = performance.now(), passo = passoDeFora(QUADRO)
  let n = 0
  while (R.t < fim - 0.02 && R.tocando) { advance(performance.now(), true); compor(); n++; await passo.proximo() }
  for (let i = 0; i < 12; i++) { advance(performance.now(), true); compor(); await passo.proximo() } // um respiro no fim
  R.tocando = false
  passo.fim()
  await new Promise<void>((ok) => { gravador.onstop = () => ok(); gravador.stop() })

  // tudo de volta como estava
  if (s && fita) { s.mestre.disconnect(fita); if (opc.mudo) s.mestre.connect(ctx!.destination) }
  if (window.speechSynthesis && falarDeVerdade) speechSynthesis.speak = falarDeVerdade

  const segundos = (performance.now() - t0) / 1000
  const video = new Blob([comDuracao(new Uint8Array(await new Blob(partes).arrayBuffer()), segundos * 1000)], { type: 'video/webm' })
  const r = await fetch(`/__gravacoes/save?nome=${encodeURIComponent(opc.nome ?? cena.id)}`, { method: 'POST', body: video })
  const j = (await r.json()) as { ok: boolean; arquivo?: string; erro?: string }
  if (!j.ok) return `gravou, mas não salvou: ${j.erro}`
  return `${j.arquivo}: ${(video.size / 1e6).toFixed(1)} MB, ${segundos.toFixed(0)} s, ${(n / segundos).toFixed(0)} quadros por segundo${s ? '' : ' (sem som: clique na página antes de gravar)'}`
}
