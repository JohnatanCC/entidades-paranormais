// Os brilhos da luta (pedidos em 12/nov), no material do contorno (render/contorno.ts), sem luz nem malha a mais:
//   o golpe: quem leva um golpe (o agente, um demônio) acende num vermelho claro por um instante e apaga, como nos jogos
//     de luta de desenho; diz "pegou" sem precisar olhar a barra (piscar; passoGolpes apaga);
//   o aviso: o demônio que prepara um ataque acende num âmbar que cresce e pulsa até o golpe sair (avisar, a cada
//     quadro, com o quanto da preparação já passou: quem chama é a animação de cada um).
// Os modelos repetidos (os demônios) dividem o material: na primeira vez que um acende, ele ganha materiais só dele (a
// mesma cópia da luz assada: materiaisDoObjeto; o shader é o mesmo, nenhuma chamada de desenho a mais), e solte com
// soltarGolpe quando ele sair de cena. As partes que brilham sozinhas (os blocos luz_) não mudam.
import type { Material, Mesh, Object3D } from 'three'
import { materiaisDoObjeto } from './assada'
import { brilhosDe } from './contorno'

const GOLPE = { dura: 0.16, forca: 0.35 } // s até apagar; o quanto acende no começo (leve: um vermelho claro, não um branco)
const AVISO = { forca: 0.45, pulsa: 7 } // o quanto acende no fim da preparação; quantas vezes pulsa por segundo

type Valor = { value: number }
interface Dele { golpes: Valor[]; avisos: Valor[]; soltar: () => void; t: number; aviso: number }
const deles = new WeakMap<Object3D, Dele>()
const acesos = new Set<Object3D>()

/** Os materiais só dele (na primeira vez que acende) e os brilhos deles. */
function dele(raiz: Object3D): Dele {
  let d = deles.get(raiz)
  if (d) return d
  const soltar = materiaisDoObjeto(raiz), golpes = new Set<Valor>(), avisos = new Set<Valor>()
  raiz.traverse((o) => { const b = brilhosDe.get((o as Mesh).material as Material); if (b) { golpes.add(b.golpe); avisos.add(b.aviso) } })
  d = { golpes: [...golpes], avisos: [...avisos], soltar, t: 0, aviso: 0 }
  deles.set(raiz, d)
  return d
}

/** Quem levou um golpe acende (a raiz do modelo). */
export function piscar(raiz: Object3D) {
  dele(raiz).t = GOLPE.dura
  acesos.add(raiz)
}

/** A cada quadro (quem desenha a cena chama): o brilho do golpe de cada um apaga. */
export function passoGolpes(dt: number) {
  for (const r of acesos) {
    const d = deles.get(r)!
    d.t = Math.max(0, d.t - dt)
    const k = GOLPE.forca * (d.t / GOLPE.dura) ** 0.7 // apaga rápido no fim
    for (const b of d.golpes) b.value = k
    if (d.t <= 0) acesos.delete(r)
  }
}

/** A cada quadro, da animação: o quanto da preparação do ataque já passou (0 = nenhuma, 1 = o golpe vai sair). */
export function avisar(raiz: Object3D, k: number) {
  const d = k > 0 ? dele(raiz) : deles.get(raiz)
  if (!d || (k <= 0 && d.aviso <= 0)) return // apagado e continua apagado: nada a fazer
  d.aviso = k
  const v = k > 0 ? AVISO.forca * k * (0.75 + 0.25 * Math.sin((performance.now() / 1000) * AVISO.pulsa * Math.PI * 2)) : 0
  for (const b of d.avisos) b.value = v
}

/** Saiu de cena: os materiais só dele são descartados. */
export function soltarGolpe(raiz: Object3D) {
  const d = deles.get(raiz)
  if (!d) return
  d.soltar(); deles.delete(raiz); acesos.delete(raiz)
}
