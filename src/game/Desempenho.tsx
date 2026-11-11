// O medidor de desempenho de uma cena de jogo (dentro do <Canvas>): os quadros por segundo sempre, e com F3 o
// detalhe (o tempo de cada quadro, o que foi desenhado, o que está na memória da placa, o nível de qualidade, as
// lâmpadas). O "processador mandando desenhar" é o tempo gasto dentro das chamadas de desenho: se ele é pequeno perto do
// quadro, quem limita é a placa de vídeo (pixels, sombras, passadas); se é grande, são as chamadas de desenho.
// Não desenha nada na cena: manda o texto para quem mostra (onTexto), quatro vezes por segundo.
// Os números de "desenhos" e "triângulos" são do quadro inteiro, com tudo o que o quadro desenha a mais: as sombras
// (cada lâmpada com sombra desenha a cena seis vezes) e as passadas do bloom.
import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { ASSADA } from '../render/assada'
import { NIVEIS, nivelAtual } from '../render/qualidade'
import { contarSombras } from '../render/sombras'
import { getSettings } from '../settings/settings'

const JANELA = 120 // quantos quadros entram na média
const LUZES = { nao: 'de verdade', assada: 'assadas', mista: 'mistas' }
const mil = (n: number) => (n >= 1e6 ? (n / 1e6).toFixed(2).replace('.', ',') + ' mi' : n >= 1e4 ? Math.round(n / 1e3) + ' mil' : String(n))
const ms = (s: number) => (s * 1000).toFixed(1).replace('.', ',')

export function Desempenho({ onTexto }: { onTexto: (texto: string) => void }) {
  const gl = useThree((s) => s.gl)
  const m = useRef({ dts: new Float32Array(JANELA), cpu: new Float32Array(JANELA), i: 0, n: 0, desde: 0, detalhe: false, tam: new THREE.Vector2(), desenhando: 0 })
  const texto = useRef(onTexto); texto.current = onTexto

  // F3 abre e fecha o detalhe (como o do Minecraft)
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => { if (e.code === 'F3') { e.preventDefault(); m.current.detalhe = !m.current.detalhe; m.current.desde = 1 } }
    window.addEventListener('keydown', tecla)
    return () => window.removeEventListener('keydown', tecla)
  }, [])

  // a contagem do three zera a cada desenho; aqui ela junta o quadro inteiro (as sombras, a cena, o bloom) e zera uma vez
  // e o tempo que o processador gasta mandando desenhar (cada chamada de render do quadro) é medido em volta dela
  useEffect(() => {
    const render = gl.render
    gl.info.autoReset = false
    gl.render = function (cena, camera) { const t = performance.now(); render.call(gl, cena, camera); m.current.desenhando += performance.now() - t }
    return () => { gl.info.autoReset = true; gl.render = render }
  }, [gl])

  useFrame((_, dt) => {
    const M = m.current, I = gl.info
    const desenhos = I.render.calls, triangulos = I.render.triangles // o quadro que acabou
    I.reset()
    M.dts[M.i] = dt; M.cpu[M.i] = M.desenhando / 1000; M.desenhando = 0; M.i = (M.i + 1) % JANELA; M.n = Math.min(JANELA, M.n + 1)
    if ((M.desde += dt) < 0.25) return
    M.desde = 0
    let soma = 0, pior = 0, cpu = 0
    for (let k = 0; k < M.n; k++) { soma += M.dts[k]; pior = Math.max(pior, M.dts[k]); cpu += M.cpu[k] }
    const media = soma / M.n, linhas = [`${Math.round(1 / media)} fps`]
    if (M.detalhe) {
      const nivel = nivelAtual(), S = contarSombras(), mem = (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory
      gl.getDrawingBufferSize(M.tam)
      linhas.push(
        `quadro ${ms(media)} ms · pior ${ms(pior)} ms (últimos ${M.n})`,
        `processador mandando desenhar: ${ms(cpu / M.n)} ms`,
        `nível ${NIVEIS[nivel].nome}${getSettings().qualidade === 'auto' ? ' (automático)' : ''} · ${M.tam.x} × ${M.tam.y} px`,
        `desenhos ${desenhos} · triângulos ${mil(triangulos)}`,
        `na placa: ${I.memory.geometries} geometrias · ${I.memory.textures} texturas · ${I.programs?.length ?? 0} programas`,
        `lâmpadas ${S.lampadas} (${S.comSombra} com sombra) · no cenário: ${LUZES[ASSADA.modo]}`,
        ...(mem ? [`memória do jogo ${Math.round(mem.usedJSHeapSize / 1048576)} MB`] : []),
        'F3 fecha',
      )
    }
    texto.current(linhas.join('\n'))
  }, -1000) // antes de tudo no quadro: lê a contagem do quadro anterior inteira

  return null
}
