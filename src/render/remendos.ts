// Os remendos dos materiais: cada mudança que o jogo faz no shader de um material do three (o corte das paredes, o
// contorno, a luz assada...) fica anotada aqui, porque a cópia de um material (clone) não leva essas mudanças junto.
// clonar() copia o material e refaz os remendos na cópia, na mesma ordem.
import type { Material } from 'three'

type Remendo = (m: Material) => unknown
const feitos = new WeakMap<Material, Remendo[]>()

/** Anota que o material levou este remendo (chame no fim de cada aplicarX). */
export function anotar<M extends Material>(m: M, remendo: Remendo): M {
  const l = feitos.get(m)
  if (l) l.push(remendo); else feitos.set(m, [remendo])
  return m
}

/** Uma cópia do material com os mesmos remendos (os números de cada remendo são novos: a cópia é independente). */
export function clonar<M extends Material>(m: M): M {
  const c = m.clone() as M
  for (const r of feitos.get(m) ?? []) r(c)
  return c
}
