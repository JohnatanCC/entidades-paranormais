// O que o Devora almas faz a tela tremer (13/nov; player/tremor.ts), pelos momentos da animação, como os sons:
//   romper o chão (sair, o salto, a ninhada): forte; entrar no chão: médio; a marca: o chão ronca cada vez mais embaixo;
//   a investida: treme o tempo todo (os espinhos subindo atrás) e a freada derrapa; o tombo de atordoado: médio;
//   estourar: o mais forte. A força cai com a distância da câmera.
import { tremerDe } from '../../player/tremor'
import { TREMOR } from '../../player/numeros'
import type { SaidaDevora } from './animacao'
import type { DevoraAlmas, ModoDevora } from './modelo'
import { INVESTIDA, TEMPO } from './numeros'

const antes = new WeakMap<DevoraAlmas, { modo: ModoDevora; estourado: boolean }>()

/** Depois de animarDevora (s = o que ela devolveu). */
export function tremorDoDevora(d: DevoraAlmas, s: SaidaDevora) {
  const A = d.anim, b = antes.get(d), p = d.root.position
  antes.set(d, { modo: A.modo, estourado: A.estourado })
  if (!b) return
  if (A.estourado) { if (!b.estourado) tremerDe(p, TREMOR.forte * 1.3, 1.2); return }
  if (s.rompe) tremerDe(p, TREMOR.forte, 0.7)
  if (A.modo !== b.modo) {
    if (A.modo === 'mergulho') tremerDe(p, TREMOR.medio, 0.8)
    else if (A.modo === 'freia') tremerDe(p, TREMOR.medio, INVESTIDA.freia)
    else if (A.modo === 'atordoado') tremerDe(p, TREMOR.medio, 0.7)
  }
  if (A.modo === 'investida') tremerDe(p, TREMOR.medio * 0.8, 0.25) // enquanto corre rasgando o chão
  else if (A.modo === 'marca') tremerDe(p, TREMOR.leve * Math.min(1, A.tm / TEMPO.marca), 0.2) // o ronco crescendo
}
