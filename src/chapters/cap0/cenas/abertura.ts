// A cena 1 do capítulo 0, a abertura (docs/cenas.md): a câmera passa pela instalação da C.R.O.S. sem ninguém em cena (um
// corredor, os campos de pesquisa, o refeitório, um escritório, o andar de contenção) e termina no ectoplasma azul
// escorrendo debaixo de uma porta de contenção; depois o título.
// PROVISÓRIO: o mapa do capítulo 0 (maps/instalacao-cap0) ainda não existe. Por enquanto a cena roda no mapa
// "teste-iluminacao" (a sala, o corredor e o quintal), só para testar o tocador; os pontos da câmera mudam quando o
// mapa de verdade chegar. O ectoplasma também entra com ele.
import type { Cena } from '../../../game/cenas/tipos'
import { acorde, batida, bipes, borbulhar, lampadaFalha, relogio, ronco, tvChiado, ventilacao, zumbido } from '../sons'

export const abertura: Cena = {
  id: 'cap0-abertura',
  nome: 'Capítulo 0 · 1, a abertura',
  mapa: 'teste-iluminacao',
  planos: [
    {
      nome: '1.1 · o corredor',
      dura: 5,
      clareia: 3.2,
      camera: { de: [19.4, 1.65, 6.1], para: [17, 1.62, 6], olha: [12, 1.5, 6], curva: 'linear' },
      sons: [{ t: 0, tocar: zumbido(5.6) }, { t: 0, tocar: ventilacao(5.6) }, { t: 3.6, tocar: lampadaFalha }],
    },
    {
      nome: '1.2 · os campos de pesquisa',
      dura: 7,
      camera: { de: [3.2, 1.35, 8.6], para: [8.4, 1.35, 8.6], olha: [4.6, 1.1, 2.6], olhaFim: [7.2, 1.1, 2.6], curva: 'linear' },
      sons: [{ t: 0, tocar: zumbido(7.4, 0.7) }, { t: 0, tocar: bipes(7) }, { t: 0.3, tocar: borbulhar(6.5) }],
    },
    {
      nome: '1.3 · o refeitório',
      dura: 6,
      camera: { de: [10.6, 3.15, 9.4], para: [3.6, 3.15, 9.5], olha: [7.4, 0.4, 5.2], olhaFim: [5.2, 0.4, 5.2], lente: 50, curva: 'linear', treme: 0.5 },
      sons: [{ t: 0, tocar: zumbido(6.4, 0.5) }, { t: 0, tocar: tvChiado(6) }],
    },
    {
      nome: '1.4 · o escritório',
      dura: 6,
      camera: { de: [4.7, 0.95, 4.9], para: [3.7, 0.9, 4.2], olha: [3, 0.55, 3], lente: 40, curva: 'sai' },
      sons: [{ t: 0, tocar: relogio(6) }],
    },
    {
      nome: '1.5 · o andar de contenção',
      dura: 8,
      camera: { de: [19.2, 0.4, 6], para: [13.4, 0.36, 5.2], olha: [12, 0.45, 5], curva: 'linear' },
      sons: [{ t: 0, tocar: ventilacao(8) }, { t: 1, tocar: ronco(7) }],
    },
    {
      nome: '1.6 · a porta de contenção',
      dura: 6,
      escurece: 0.25,
      camera: { de: [12.95, 0.22, 5.55], olha: [12, 0.05, 5], lente: 38, treme: 0.4 },
      sons: [{ t: 3.6, tocar: batida }],
    },
    {
      nome: '1.7 · o título',
      dura: 4,
      titulo: { t: 0.6, dura: 3, texto: 'AGENTES CROS' },
      sons: [{ t: 0.6, tocar: acorde }],
    },
  ],
}
