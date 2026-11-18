// A cena 2 do capítulo 0, o escritório do Victor (docs/cenas.md): o Matheus anda pelo corredor, entra, o Victor cobra
// as falhas dele e dá a ele uma equipe fixa; no corredor, o Matheus fala para si; o alarme toca e a central o chama ao
// andar de contenção.
// PROVISÓRIA: ainda sem os personagens em cena (os atores vêm com as animações novas: sentar, abrir a porta, apontar,
// falar) e sem o mapa do capítulo 0. Por enquanto roda no mapa "teste-iluminacao", com a câmera nos lugares de cada
// plano, as legendas e as vozes provisórias (game/cenas/vozes.ts), para ouvir o ritmo da conversa.
import type { Fala, Plano } from '../../../game/cenas/tipos'
import type { Cena } from '../../../game/cenas/tipos'
import { baterEAbrir, cadeira, passos, portaFecha, radio, relogio, sirene, ventilacao, zumbido } from '../sons'

// quanto cada um leva para falar (s por letra: o Victor devagar, o Matheus mais rápido), para a legenda ficar o tempo da voz
const RITMO: Record<string, number> = { Victor: 1 / 12, Matheus: 1 / 14, 'A central': 1 / 15 }
const fala = (quem: string, t: number, texto: string, pensamento = false): Fala => ({ t, quem, texto, pensamento, dura: Math.max(1.4, texto.length * (RITMO[quem] ?? 1 / 13) + 0.5) })

// os lugares da câmera, no cenário provisório (a sala: o Victor na mesa do canto; o Matheus na frente dele)
const SALA = {
  geral: { de: [11.4, 1.65, 5.2], olha: [4, 1.05, 4] },
  ombroMatheus: { de: [5.6, 1.35, 6.4], olha: [3.4, 1.15, 3.4] },
  victor: { de: [4.3, 1.28, 4.7], olha: [3, 1.2, 3.2] },
  ombroVictor: { de: [3.3, 1.35, 3.5], olha: [5.6, 1.15, 6.6] },
  matheus: { de: [4.9, 1.28, 5.6], olha: [6, 1.2, 7] },
} as const
type Lugar = keyof typeof SALA
/** Um plano da conversa: a câmera num lugar da sala (com uma aproximação lenta), as falas e o relógio da parede. */
function conversa(nome: string, dura: number, lugar: Lugar, falas: Fala[], lente = lugar === 'victor' || lugar === 'matheus' ? 34 : 42): Plano {
  const L = SALA[lugar], de = [...L.de] as [number, number, number], olha = [...L.olha] as [number, number, number]
  const perto = de.map((v, i) => v + (olha[i] - v) * 0.06) as [number, number, number]
  return { nome, dura, camera: { de, para: perto, olha, lente, curva: 'linear', treme: 0.6 }, falas, sons: [{ t: 0.05, tocar: relogio(dura) }] }
}

export const escritorio: Cena = {
  id: 'cap0-escritorio',
  nome: 'Capítulo 0 · 2, o escritório do Victor',
  mapa: 'teste-iluminacao',
  planos: [
    // ---------- o corredor e a porta ----------
    {
      nome: '2.1 · as botas no corredor', dura: 4, clareia: 1.2,
      camera: { de: [19.2, 0.25, 7.3], para: [16.8, 0.25, 7.3], olha: [17.2, 0.15, 6], olhaFim: [14.8, 0.15, 6], curva: 'linear' },
      sons: [{ t: 0.05, tocar: zumbido(13.5, 0.6) }, { t: 0.05, tocar: ventilacao(13) }, { t: 0.1, tocar: passos(9) }],
    },
    { nome: '2.2 · a câmera sobe pelo corpo', dura: 5, camera: { de: [16.4, 0.4, 7.2], para: [14.6, 1.6, 7.1], olha: [15.2, 0.3, 6], olhaFim: [13.4, 1.6, 6], curva: 'linear' } },
    { nome: '2.3 · a porta', dura: 4, camera: { de: [19, 1.7, 6], para: [18.3, 1.7, 6], olha: [12, 1.3, 5], curva: 'linear' }, sons: [{ t: 1.6, tocar: baterEAbrir }] },
    // ---------- a conversa ----------
    conversa('2.4 · "Entre, Moura. Sente."', 4.5, 'geral', [fala('Victor', 0.6, 'Entre, Moura. Sente.')]),
    { ...conversa('2.5 · ele senta', 3, 'geral', []), sons: [{ t: 0.5, tocar: cadeira }, { t: 0.05, tocar: relogio(3) }] },
    conversa('2.6 · as três missões', 6, 'ombroMatheus', [fala('Victor', 0.4, 'Três missões este mês. Três capturas que deram errado.')]),
    conversa('2.7 · "o que está acontecendo?"', 5, 'victor', [fala('Victor', 0.4, 'Isso não é você. O que está acontecendo?')]),
    conversa('2.8 · "Nada."', 4.5, 'ombroVictor', [fala('Matheus', 0.5, 'Nada. Muita coisa ao mesmo tempo, só isso.')]),
    conversa('2.9 · o antigo parceiro', 4.5, 'victor', [fala('Victor', 0.4, 'É por causa do seu antigo parceiro?')]),
    conversa('2.10 · "Não tem nada a ver"', 7, 'matheus', [fala('Matheus', 0.3, 'Não tem nada a ver com isso.'), fala('Matheus', 3.4, 'Eu me distraí. Não vai se repetir.')]),
    conversa('2.11 · a nova dinâmica', 8, 'ombroMatheus', [fala('Victor', 0.6, 'Vou mudar a dinâmica. Chega de te mandar com um time diferente a cada missão.')]),
    conversa('2.12 · a equipe fixa', 9.5, 'victor', [fala('Victor', 0.4, 'A partir de hoje você tem uma equipe fixa. É uma chance de criar laços. De não carregar tudo sozinho.')]),
    conversa('2.13 · "sempre me virei sozinho"', 4.5, 'matheus', [fala('Matheus', 0.4, 'Não precisa. Eu sempre me virei bem sozinho.')]),
    conversa('2.14 · "Sempre?"', 5, 'victor', [fala('Victor', 0.3, 'Sempre?'), fala('Victor', 2.1, 'Mesmo depois deste mês?')]),
    conversa('2.15 · "...Tudo bem."', 4.5, 'matheus', [fala('Matheus', 1.9, '...Tudo bem.')]),
    conversa('2.16 · a missão', 7, 'geral', [fala('Victor', 0.4, 'Ótimo. Já tenho uma missão para vocês. Logo você conhece a sua equipe.')]),
    { ...conversa('2.17 · ele levanta e sai', 3.5, 'geral', []), sons: [{ t: 0.3, tocar: cadeira }, { t: 0.05, tocar: relogio(3) }] },
    // ---------- o corredor e o alarme ----------
    { nome: '2.18 · a porta fecha', dura: 3, camera: { de: [15.5, 1.6, 6.2], olha: [12.4, 1.5, 5.4], treme: 0.6 }, sons: [{ t: 0.2, tocar: portaFecha }, { t: 0.05, tocar: zumbido(12, 0.6) }] },
    {
      nome: '2.18b · "Eu sou um bom agente."', dura: 8.5,
      camera: { de: [14.2, 1.62, 6.1], para: [13.9, 1.62, 5.9], olha: [12.5, 1.6, 5.2], lente: 32, curva: 'linear', treme: 0.5 },
      falas: [fala('Matheus', 0.6, 'Um time fixo não vai resolver nada. Eu não quero ter "novos laços". Eu vou conseguir. Eu sou um bom agente.', true)],
    },
    { nome: '2.19 · o alarme', dura: 3, camera: { de: [19.4, 2.2, 7.4], olha: [13, 1.2, 5.6], treme: 0.8 }, sons: [{ t: 0.15, tocar: sirene(14) }] },
    {
      nome: '2.20 · a central no rádio', dura: 6, camera: { de: [14.2, 1.62, 6.1], olha: [12.5, 1.6, 5.2], lente: 32, treme: 0.7 },
      falas: [fala('A central', 0.4, 'Agente Moura, responda! Precisamos de você no andar de contenção, agora!')],
      sons: [{ t: 0.1, tocar: radio(5.2) }],
    },
    {
      nome: '2.21 · "Estou indo."', dura: 4, escurece: 1.2,
      camera: { de: [12.6, 1.7, 5.4], olha: [19, 1.3, 6.4], treme: 1 },
      falas: [fala('Matheus', 0.2, 'Estou indo.')],
      sons: [{ t: 1, tocar: passos(3, 0.3) }],
    },
  ],
}
