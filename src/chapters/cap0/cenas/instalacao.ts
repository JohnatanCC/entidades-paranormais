// A cena 2 do capítulo 0, o alarme na instalação (docs/cenas.md; até 18/nov era a abertura do jogo: o desenvolvedor
// passou para depois do escritório): com o alarme tocando ao longe, a câmera passa pelo andar de contenção vazio (o
// corredor, os campos de pesquisa, o refeitório largado às pressas), chega ao ectoplasma azul escorrendo debaixo da
// porta de contenção e termina no hall do elevador, onde a Lara e o Nicolas esperam o Matheus. Depois o título. É o
// gancho para a parte 3: o elevador chega e os três se encontram.
// Sem falas: o som do lugar conta (a sirene ao longe, os aparelhos ligados, a TV sem sinal, a batida na porta).
import type { Cena, Plano } from '../../../game/cenas/tipos'
import { vazamento } from '../ectoplasma'
import { acorde, batida, bipes, borbulhar, lampadaFalha, ronco, sirene, tvChiado, ventilacao, zumbido } from '../sons'

const ELEVADOR: [number, number, number] = [3.6, 1.7, 28] // a porta do elevador (o que os dois olham)

const planos: Plano[] = [
  {
    // o corredor oeste, comprido, no vermelho do alarme: a luminária que falha fica em z = 34
    nome: '2.1 · o corredor', dura: 5, clareia: 1.6, luz: 'alarme',
    camera: { de: [13.5, 1.65, 44.5], para: [13.5, 1.62, 40.5], olha: [13.5, 1.5, 28], curva: 'linear' },
    sons: [{ t: 0, tocar: sirene(42, 0.45) }, { t: 0, tocar: zumbido(5.6) }, { t: 0, tocar: ventilacao(5.6) }, { t: 3.6, tocar: lampadaFalha }],
  },
  {
    // dentro dos campos de pesquisa, de lado: os aparelhos ligados, ninguém nas mesas
    nome: '2.2 · os campos de pesquisa', dura: 7,
    camera: { de: [33, 1.62, 27.2], para: [39.6, 1.62, 27.2], olha: [36.5, 0.9, 20.5], olhaFim: [43.6, 0.9, 19.6], curva: 'linear' },
    sons: [{ t: 0, tocar: zumbido(7.4, 0.7) }, { t: 0, tocar: bipes(7) }, { t: 0.3, tocar: borbulhar(6.5) }],
  },
  {
    // o refeitório do alto: as bandejas largadas, a TV sem sinal
    nome: '2.3 · o refeitório', dura: 6,
    camera: { de: [27.6, 3.05, 27.6], para: [21, 3.05, 27.6], olha: [25, 0.4, 22], olhaFim: [19, 0.4, 21.5], lente: 50, curva: 'linear', treme: 0.5 },
    sons: [{ t: 0, tocar: zumbido(6.4, 0.5) }, { t: 0, tocar: tvChiado(6) }],
  },
  {
    // o corredor de contenção, rente ao chão, indo para a porta; a poça azul já aparece lá no fundo
    nome: '2.4 · o andar de contenção', dura: 8,
    camera: { de: [49.5, 0.4, 29.7], para: [57.2, 0.36, 29.25], olha: [60, 0.45, 29.5], curva: 'linear' },
    sons: [{ t: 0, tocar: ventilacao(8) }, { t: 1, tocar: ronco(7) }],
  },
  {
    // a porta de contenção de perto: o ectoplasma escorrendo pela fresta; alguma coisa bate do outro lado
    nome: '2.5 · a porta de contenção', dura: 6,
    camera: { de: [57.4, 0.8, 30.35], olha: [59.8, 0.2, 29.5], lente: 40, treme: 0.4 },
    sons: [{ t: 3.6, tocar: batida }],
  },
  {
    // o hall do elevador: a Lara e o Nicolas esperando, de costas; os dois viram o rosto para o som que veio de dentro
    nome: '2.6 · o hall', dura: 5, luz: 'alarme',
    camera: { de: [10.2, 1.62, 28.5], para: [9.4, 1.62, 28.4], olha: [5.5, 1.4, 28.1], curva: 'linear', treme: 0.6 },
    atores: { Lara: { olha: [12, 1.6, 25.5] }, Nicolas: { olha: [12, 1.6, 30.5] } },
    sons: [{ t: 0, tocar: zumbido(10, 0.6) }],
  },
  {
    // de frente, com o elevador nas costas da câmera: eles voltam a olhar para a porta, esperando
    // (de dentro da cabine, as barras da porta pantográfica tapavam os rostos: sem desfoque, elas ficam nítidas demais)
    nome: '2.7 · esperando o Matheus', dura: 5, luz: 'alarme', escurece: 0.8,
    camera: { de: [4.45, 1.56, 28.05], para: [4.7, 1.56, 28.05], olha: [6.4, 1.5, 28.05], lente: 40, curva: 'linear', treme: 0.4 },
    atores: { Lara: { olha: 'Nicolas' }, Nicolas: { olha: ELEVADOR } },
    sons: [{ t: 0.2, tocar: ronco(4.6) }],
  },
  { nome: '2.8 · o título', dura: 4, titulo: { t: 0.6, dura: 3, texto: 'AGENTES CROS' }, sons: [{ t: 0.6, tocar: acorde }] },
]
// quando cada plano começa, para o ectoplasma crescer do 2.4 até o fim do 2.5
const comeca = (nome: string) => planos.slice(0, planos.findIndex((p) => p.nome.startsWith(nome))).reduce((s, p) => s + p.dura, 0)

export const instalacao: Cena = {
  id: 'cap0-instalacao',
  nome: 'Capítulo 0 · 2, o alarme na instalação',
  mapa: 'instalacao-cap0',
  // a porta de contenção fica em x = 60, de z = 28 a 31 (a largura do corredor); o corredor está do lado −x
  cenario: vazamento({ x: 59.91, z: 29.5, dir: [-1, 0], largura: 2.8, alcance: 1.5, desde: comeca('2.4'), ate: comeca('2.6'), antes: 0.12 }),
  // a nova equipe do Matheus, no hall, de frente para o elevador
  elenco: {
    Lara: { modelo: 'lara', em: [6.3, 0, 27.35], vira: 270 },
    Nicolas: { modelo: 'nicolas', em: [6.55, 0, 28.8], vira: 270 },
  },
  planos,
}
