// A pasta do Matheus na mesa do Victor (a cena 1, docs/cenas.md): fica fora do mapa porque a cena mexe nela. A capa
// abre e fecha e as folhas viram no ritmo das mãos de quem gesticula (os gestos virar e fechar do ator: game/cenas/gestos.ts).
// Tudo é conta do tempo da cena: pular para qualquer ponto põe a capa e as folhas no lugar.
// O modelo é o da pasta do catálogo (modelos/objetos/pasta-dossie.bbmodel), com a capa e as folhas em pastas que giram na dobra.
import { useEffect, useMemo, type ComponentType } from 'react'
import { useFrame } from '@react-three/fiber'
import { gestosDe } from '../../game/cenas/atores'
import { GESTOS } from '../../game/cenas/gestos'
import type { PropsDoCenario, V3 } from '../../game/cenas/tipos'
import { assadorDe, limitarLampadas, LUZ_NO_OBJETO, novaLuzVertice } from '../../maps/luzAssada'
import { iluminarObjeto, materiaisDoObjeto } from '../../render/assada'
import { objeto3d } from '../../render/objetos3d'

const ABERTA = Math.PI + 0.05 // a capa aberta deita na mesa (um tico além da meia volta: a ponta encosta)
const sm = (k: number) => { const c = Math.max(0, Math.min(1, k)); return c * c * (3 - 2 * c) }

export interface PastaNaMesa {
  em: V3 // onde fica (o meio da base, em cima da mesa)
  vira: number // graus (180: a dobra do lado esquerdo de quem está em −z, de frente para +z)
  quem: string // o ator que mexe nela (os gestos dele abrem e viram)
  aberta?: boolean // começa aberta
}

/** A pasta numa cena (Cena.cenario): a capa e as folhas seguem os gestos de `quem`. */
export function pastaNaMesa(p: PastaNaMesa): ComponentType<PropsDoCenario> {
  return function Pasta({ relogio, cena, chunks }) {
    const { obj, capa, folhas } = useMemo(() => {
      const obj = objeto3d('pasta-dossie')
      obj.position.set(...p.em); obj.rotation.y = (p.vira * Math.PI) / 180
      return { obj, capa: obj.getObjectByName('capa'), folhas: [1, 2, 3].map((k) => obj.getObjectByName(`folha_${k}`)) }
    }, [])
    const gestos = useMemo(() => gestosDe(cena, p.quem), [cena])
    // a luz pintada do lugar (uma vez: a pasta não sai dali)
    useEffect(() => {
      const descartar = materiaisDoObjeto(obj), luz = novaLuzVertice(), q: V3 = [p.em[0], p.em[1] + 0.15, p.em[2]]
      assadorDe(chunks)(q, null, q, 0, luz); limitarLampadas(luz, LUZ_NO_OBJETO); iluminarObjeto(obj, luz)
      return descartar
    }, [obj, chunks])
    useFrame(() => {
      const t = relogio.t
      // a capa: aberta (se começa assim) até o gesto de fechar, que traz ela junto com a mão (gestos.ts: entre 25% e 70% dele)
      let aberta = p.aberta ? 1 : 0, virou = 0, k = 0
      for (const g of gestos) {
        if (g.quando > t) break
        const u = (t - g.quando) / GESTOS[g.nome].dura
        if (g.nome === 'fechar') aberta *= 1 - sm((u - 0.25) / 0.45)
        if (g.nome === 'virar') { virou = k + sm((u - 0.15) / 0.5); k++ } // a folha vai com a mão (entre 15% e 65% do gesto)
      }
      if (capa) capa.rotation.z = ABERTA * aberta
      // as folhas viradas deitam na capa aberta (e fecham junto com ela)
      folhas.forEach((f, i) => { if (f) f.rotation.z = (ABERTA - 0.002 * (i + 1)) * Math.max(0, Math.min(1, virou - i)) * aberta })
    })
    return <primitive object={obj} />
  }
}
