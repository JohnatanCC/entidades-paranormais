// Achar as pastas (as juntas) de uma cópia de modelo pelo nome: o que todo inimigo montado de um .bbmodel precisa.
import * as THREE from 'three'

/** Quem acha uma pasta pelo nome. Se faltar, avisa no console (o modelo foi mexido) e devolve uma pasta vazia: aquela
 *  parte fica parada, mas nada quebra. arquivo = o caminho em modelos/, para o aviso. */
export function ossoDe(root: THREE.Object3D, arquivo: string) {
  return (nome: string): THREE.Group => {
    const o = root.getObjectByName(nome) as THREE.Group | undefined
    if (o) return o
    console.warn(`modelos/${arquivo}.bbmodel: falta a pasta "${nome}"`)
    const g = new THREE.Group(); g.name = nome; return g
  }
}

/** As pastas cujo nome começa com o prefixo (as mecha_ que balançam). */
export function pastasCom(o: THREE.Object3D, prefixo: string, lista: THREE.Object3D[] = []): THREE.Object3D[] {
  for (const c of o.children) { if (c.name.startsWith(prefixo)) lista.push(c); pastasCom(c, prefixo, lista) }
  return lista
}
