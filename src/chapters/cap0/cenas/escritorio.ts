// A cena 1 do capítulo 0, o escritório do Victor (docs/cenas.md): o Matheus anda pelo corredor, entra, o Victor cobra
// as falhas dele e dá a ele uma equipe fixa; no corredor, o Matheus fala para si; o alarme toca e a central o chama ao
// andar de contenção. O cenário é o mapa do capítulo (maps/instalacao-cap0): o corredor solto e o escritório.
// Como a cena é montada (18/nov, depois de estudar como as cutscenes de jogo são feitas):
//   - a câmera fica sempre do mesmo lado da linha entre os dois (a regra dos 180°): o plano e o contraplano batem;
//   - o tamanho do plano acompanha a tensão: geral para situar, por cima do ombro na conversa, fechado no rosto quando
//     a fala pesa, e de novo aberto quando a tensão solta;
//   - os inserts contam o que a fala não diz (a pasta com as missões, a foto virada do antigo parceiro);
//   - quem ouve também aparece: o plano de reação, às vezes com a voz do outro por cima;
//   - o som chega antes da imagem (os passos no escuro) e nada corta no meio de uma frase: cada plano dura o que as
//     falas dele levam (comum.ts).
// A conversa é de pé (18/nov: o Victor diz "Vou ser direto." no lugar de mandar sentar). Os gestos com a pasta vêm na
// próxima etapa.
import type { AcaoDoAtor, CameraDoPlano, Cena, Fala, Plano, V3 } from '../../../game/cenas/tipos'
import { baterEAbrir, passos, portaFecha, radio, relogio, sirene, ventilacao, zumbido } from '../sons'
import { cobre, depois, fala, fimDe } from './comum'

// ---------- os lugares (o mapa: o corredor de z 60 a 63; a porta do escritório em x 15 a 16, na parede z = 60) ----------
const VICTOR: V3 = [15, 0, 55.95] // atrás da mesa, de frente para a porta
const MATHEUS: V3 = [15.62, 0, 57.7] // perto da mesa, ao lado da cadeira de visitante (18/nov: estava longe demais)
const PORTA: V3 = [15.55, 0, 60.62] // no corredor, de frente para a porta, ao alcance da maçaneta
// (os lugares perto da porta ficam fora do arco da folha, que gira 1 m em volta da dobradiça em x = 15, z = 60)
const DENTRO: V3 = [15.75, 0, 58.95] // dentro, depois de entrar
const NA_PORTA: V3 = [15.7, 0, 59.45] // dentro, ao alcance da maçaneta, para sair
const SAIDA: V3 = [15.7, 0, 61] // do lado de fora
const MACANETA = { fora: [15.8, 1.02, 60.1] as V3, dentro: [15.8, 1.02, 59.9] as V3 }
const OLHOS = { Victor: 1.72, Matheus: 1.66 } // m: a altura dos olhos de cada um
const PASTA: V3 = [15.1, 0.79, 56.7] // a pasta na mesa (as missões do Matheus)
const FOTO: V3 = [14.3, 0.77, 56.4] // o porta-retrato virado para baixo (o antigo parceiro)
const DESVIA: V3 = [17, 1.4, 56.9] // para onde o Matheus olha quando foge dos olhos do Victor
const graus = (de: V3, para: V3) => (Math.atan2(para[0] - de[0], para[2] - de[2]) * 180) / Math.PI // para onde fica de frente

// ---------- as câmeras da conversa: sempre do lado +x da linha entre os dois ----------
function eixo(de: V3, para: V3) {
  const dx = para[0] - de[0], dz = para[2] - de[2], d = Math.hypot(dx, dz), u = [dx / d, dz / d]
  const p = [-u[1], u[0]]
  return { u, p: p[0] < 0 ? [-p[0], -p[1]] : p }
}
/** Por cima do ombro de quem está em `de`, mostrando o rosto de quem está em `para`. */
function ombro(de: V3, olhosDe: number, para: V3, olhosPara: number): CameraDoPlano {
  const { u, p } = eixo(de, para)
  return { de: [de[0] - u[0] * 0.8 + p[0] * 0.48, olhosDe + 0.1, de[2] - u[1] * 0.8 + p[1] * 0.48], olha: [para[0], olhosPara - 0.06, para[2]], lente: 38 }
}
/** O plano de rosto de quem está em `quem`, do lado de quem olha para ele (em `de`): da cabeça ao peito (18/nov: o
 *  close só no rosto ficou fechado demais). perto = a distância (m). */
function rosto(quem: V3, olhos: number, de: V3, perto = 1.4, lente = 38): CameraDoPlano {
  const { u, p } = eixo(quem, de)
  return { de: [quem[0] + u[0] * perto + p[0] * 0.24, olhos + 0.03, quem[2] + u[1] * perto + p[1] * 0.24], olha: [quem[0], olhos - 0.13, quem[2]], lente }
}
const SALA: CameraDoPlano = { de: [15.95, 1.72, 54.45], olha: [15.45, 1.2, 59.4], lente: 44 } // o geral: o Victor de costas na frente, a porta ao fundo
const DOIS: CameraDoPlano = { de: [17.6, 1.5, 57.05], olha: [15.3, 1.25, 57.05], lente: 42 } // de lado, os dois na imagem
const OMBRO_MATHEUS = ombro(MATHEUS, OLHOS.Matheus, VICTOR, OLHOS.Victor)
const NO_VICTOR = rosto(VICTOR, OLHOS.Victor, MATHEUS)
const NO_MATHEUS = rosto(MATHEUS, OLHOS.Matheus, VICTOR)
const BEM_NO_VICTOR = rosto(VICTOR, OLHOS.Victor, MATHEUS, 1.15, 34) // mais perto: a fala que aperta
const BEM_NO_MATHEUS = rosto(MATHEUS, OLHOS.Matheus, VICTOR, 1.15, 34)
const NA_PASTA: CameraDoPlano = { de: [15.78, 1.3, 57.3], olha: PASTA, lente: 30 } // o insert: a pasta na mesa
const NA_FOTO: CameraDoPlano = { de: [14.95, 1.1, 57], olha: FOTO, lente: 28 } // o insert: a foto virada

/** Um plano da conversa: dura o que as falas levam (mais o respiro), a câmera aproxima devagar (`aproxima`: quanto do
 *  caminho até o que olha; 0 = parada), o relógio da parede bate. */
function conversa(nome: string, cam: CameraDoPlano, falas: Fala[], atores?: Record<string, AcaoDoAtor>, opc: { respiro?: number; minimo?: number; aproxima?: number } = {}): Plano {
  const dura = cobre(falas, opc.respiro ?? 0.7, opc.minimo ?? 0), k = opc.aproxima ?? 0.05
  const perto = cam.de.map((v, i) => v + (cam.olha[i] - v) * k) as V3
  return { nome, dura, camera: { ...cam, ...(k ? { para: perto } : {}), curva: 'linear', treme: 0.6 }, falas, atores, sons: [{ t: 0.05, tocar: relogio(dura) }] }
}

// as falas que puxam outra logo depois (a segunda começa quando a primeira acaba)
const naoEVoce = fala('Victor', 0.4, 'Isso não é você.')
const nadaAVer = fala('Matheus', 0.9, 'Não tem nada a ver com isso.')
const dinamica = fala('Victor', 0.8, 'Vou mudar a dinâmica.')
const equipe = fala('Victor', 0.4, 'A partir de hoje você tem uma equipe fixa.')
const carregar = fala('Victor', 0.3, 'De não carregar tudo sozinho.')
const sempre = fala('Victor', 0.4, 'Sempre?')
const otimo = fala('Victor', 0.4, 'Ótimo. Já tenho uma missão para vocês.')
// o que ele fala para si, no corredor: frases curtas, com o silêncio entre elas
const p1 = fala('Matheus', 0.8, 'Um time fixo não vai resolver nada.', true)
const p2 = depois(p1, 'Matheus', 'Eu não quero ter "novos laços".', 0.7, true)
const p3 = depois(p2, 'Matheus', 'Eu vou conseguir.', 0.9, true)
const p4 = depois(p3, 'Matheus', 'Eu sou um bom agente.', 0.5, true)
const central = fala('A central', 0.5, 'Agente Moura, responda! Precisamos de você no andar de contenção, agora!')
const indo = fala('Matheus', 0.4, 'Estou indo.')
const NO_CORREDOR: V3 = [16.9, 0, 61.35] // onde o alarme pega ele
const ALARME: CameraDoPlano = { de: [19.6, 2.3, 62.7], olha: [15.8, 1.2, 61.2], treme: 0.8 } // o geral do corredor

export const escritorio: Cena = {
  id: 'cap0-escritorio',
  nome: 'Capítulo 0 · 1, o escritório do Victor',
  mapa: 'instalacao-cap0',
  elenco: {
    Matheus: { modelo: 'agente', em: [5, 0, 61.6], vira: 90 },
    Victor: { modelo: 'victor', em: VICTOR, vira: 0 },
  },
  planos: [
    // ---------- o corredor: o som chega antes da imagem ----------
    { nome: '1.0 · os passos no escuro', dura: 1.4, sons: [{ t: 0.05, tocar: zumbido(15, 0.6) }, { t: 0.05, tocar: ventilacao(15) }, { t: 0.1, tocar: passos(11.4) }] },
    {
      nome: '1.1 · as botas no corredor', dura: 4, clareia: 0.9,
      camera: { de: [5.6, 0.22, 62.75], para: [10, 0.22, 62.75], olha: [5.3, 0.15, 61.6], olhaFim: [9.7, 0.15, 61.6], curva: 'linear' },
      atores: { Matheus: { anda: { para: [9.4, 0, 61.6] } }, Victor: { olha: PASTA } },
    },
    {
      nome: '1.2 · a câmera sobe pelo corpo', dura: 5,
      camera: { de: [9.9, 0.35, 62.85], para: [15.2, 1.65, 62.6], olha: [9.6, 0.3, 61.6], olhaFim: [15, 1.6, 61.6], curva: 'linear' },
      atores: { Matheus: { anda: { para: [14.9, 0, 61.6] } } },
    },
    {
      // ele chega, para, bate, e a mão vai à maçaneta
      nome: '1.3 · a porta', dura: 3.4,
      camera: { de: [11.4, 1.7, 61.9], para: [12, 1.7, 61.9], olha: [17, 1.3, 60.9], curva: 'linear' },
      atores: { Matheus: { anda: { para: PORTA, ate: 1.1 }, vira: 180, alcanca: { ponto: MACANETA.fora, t: 1.95 } } },
      portas: [{ id: 'escritorio', t: 2.3, abre: true, lado: 'a' }],
      sons: [{ t: 1.3, tocar: baterEAbrir }],
    },
    // ---------- a conversa ----------
    // o geral situa: o Victor na frente, de costas, levanta os olhos da pasta; o Matheus entra ao fundo e a porta fecha sozinha
    {
      ...conversa('1.4 · "Entre, Moura."', SALA, [fala('Victor', 1.2, 'Entre, Moura.')], {
        Victor: { olha: 'Matheus' }, Matheus: { anda: { para: DENTRO, de: 0.2, ate: 1.8 }, olha: 'Victor' },
      }, { minimo: 3.4, aproxima: 0 }),
      portas: [{ id: 'escritorio', t: 2.2, abre: false }],
    },
    conversa('1.5 · "Vou ser direto."', DOIS, [fala('Victor', 0.9, 'Vou ser direto.')], { Matheus: { anda: { para: MATHEUS, de: 0.5, ate: 2.4 }, vira: graus(MATHEUS, VICTOR) } }, { minimo: 3.6, aproxima: 0 }),
    // o insert: a pasta dele na mesa, a voz do Victor por cima
    conversa('1.6 · a pasta', NA_PASTA, [fala('Victor', 0.5, 'Três missões este mês.')], { Victor: { olha: PASTA } }, { respiro: 0.4, aproxima: 0.08 }),
    conversa('1.7 · as capturas', OMBRO_MATHEUS, [fala('Victor', 0.3, 'Três capturas que deram errado.')], { Victor: { olha: 'Matheus' } }),
    conversa('1.8 · "o que está acontecendo?"', NO_VICTOR, [naoEVoce, depois(naoEVoce, 'Victor', 'O que está acontecendo?')]),
    // a reação antes da resposta: ele segura, responde e desvia os olhos
    conversa('1.9 · "Nada."', NO_MATHEUS, [fala('Matheus', 1.1, 'Nada. Muita coisa ao mesmo tempo, só isso.')], { Matheus: { olha: DESVIA } }),
    // o insert: a foto virada, e a pergunta que ninguém queria fazer
    conversa('1.10 · a foto virada', NA_FOTO, [fala('Victor', 0.7, 'É por causa do seu antigo parceiro?')], { Victor: { olha: FOTO } }, { respiro: 0.9, aproxima: 0.1 }),
    conversa('1.11 · "Não tem nada a ver"', BEM_NO_MATHEUS, [nadaAVer, depois(nadaAVer, 'Matheus', 'Eu me distraí. Não vai se repetir.', 1)], {
      Matheus: { olha: 'Victor', expressao: 'raiva' }, Victor: { olha: 'Matheus' },
    }),
    conversa('1.12 · a nova dinâmica', OMBRO_MATHEUS, [dinamica, depois(dinamica, 'Victor', 'Chega de te mandar com um time diferente a cada missão.')], { Matheus: { expressao: 'neutra' } }),
    conversa('1.13 · a equipe fixa', NO_VICTOR, [equipe, depois(equipe, 'Victor', 'É uma chance de criar laços.')], undefined, { respiro: 0.3, aproxima: 0.12 }),
    // o fim da frase do Victor cai no rosto de quem ouve
    conversa('1.14 · "sempre me virei sozinho"', NO_MATHEUS, [carregar, depois(carregar, 'Matheus', 'Não precisa. Eu sempre me virei bem sozinho.', 0.9)], { Matheus: { expressao: 'raiva' } }),
    conversa('1.15 · "Sempre?"', BEM_NO_VICTOR, [sempre, depois(sempre, 'Victor', 'Mesmo depois deste mês?', 1.1)], { Victor: { expressao: 'raiva' } }, { respiro: 0.9 }),
    // o silêncio dele é a resposta: desvia os olhos, demora, cede
    conversa('1.16 · "...Tudo bem."', BEM_NO_MATHEUS, [fala('Matheus', 2.4, '...Tudo bem.')], { Matheus: { olha: DESVIA, expressao: 'neutra' }, Victor: { expressao: 'neutra' } }, { respiro: 1 }),
    // a tensão solta: de novo os dois na imagem
    conversa('1.17 · a missão', DOIS, [otimo, depois(otimo, 'Victor', 'Logo você conhece a sua equipe.')], { Matheus: { olha: 'Victor' } }, { aproxima: 0 }),
    // o mesmo geral do começo: ele vai até a porta e abre; o Victor acompanha
    {
      nome: '1.18 · ele vai até a porta', dura: 3.6, camera: { ...SALA, treme: 0.6 },
      atores: { Matheus: { anda: { para: NA_PORTA, de: 0.5, ate: 2.3 }, vira: 0, olha: null, alcanca: { ponto: MACANETA.dentro, t: 2.6 } } },
      portas: [{ id: 'escritorio', t: 2.9, abre: true, lado: 'b' }],
      sons: [{ t: 0.05, tocar: relogio(7) }],
    },
    {
      // (a mesma câmera, sem corte visível) ele sai; sozinho, o Victor olha a foto virada
      nome: '1.19 · o Victor fica', dura: 3.6, camera: { ...SALA, treme: 0.6 },
      atores: { Matheus: { anda: { para: SAIDA, de: 0.1, ate: 1.5 } }, Victor: { olha: FOTO } },
    },
    // ---------- o corredor e o alarme ----------
    {
      nome: '1.20 · no corredor', dura: 2.8, camera: { de: [15.9, 1.55, 62.75], olha: [15.7, 1.4, 61], treme: 0.6 },
      atores: { Matheus: { em: SAIDA, vira: 0 } },
      portas: [{ id: 'escritorio', t: 0.1, abre: false }],
      sons: [{ t: 0.1, tocar: portaFecha }, { t: 0.05, tocar: zumbido(22, 0.6) }],
    },
    {
      nome: '1.21 · "Eu sou um bom agente."', dura: cobre([p4], 1),
      camera: { de: [15.95, 1.68, 62.45], para: [15.9, 1.68, 62.15], olha: [15.7, 1.53, 61], lente: 36, curva: 'linear', treme: 0.5 },
      falas: [p1, p2, p3, p4],
      atores: { Matheus: { expressao: 'raiva' } },
    },
    {
      // ele respira e segue pelo corredor
      nome: '1.22 · ele segue', dura: 1.5, camera: ALARME,
      atores: { Matheus: { expressao: 'neutra', anda: { para: [16.6, 0, 61.3], de: 0.2, ate: 1.5 } } },
    },
    {
      // (a mesma câmera) o alarme pega ele no meio do passo
      nome: '1.23 · o alarme', dura: 2.8, camera: ALARME, luz: 'alarme',
      atores: { Matheus: { anda: { para: NO_CORREDOR, de: 0, ate: 0.35 }, olha: [17.8, 3.2, 61.6], expressao: 'surpresa' } },
      sons: [{ t: 0, tocar: sirene(16) }],
    },
    {
      nome: '1.24 · a central no rádio', dura: cobre([central], 0.6), luz: 'alarme',
      camera: { de: [18.25, 1.66, 61.6], para: [18.15, 1.66, 61.58], olha: [16.9, 1.5, 61.35], lente: 36, curva: 'linear', treme: 0.7 },
      falas: [central],
      atores: { Matheus: { vira: 90, olha: null, expressao: 'neutra' } }, // escuta olhando para a frente (o rádio no ombro vem depois)
      sons: [{ t: 0.1, tocar: radio(fimDe(central)) }],
    },
    {
      // ele responde inteiro, e só depois corre
      nome: '1.25 · "Estou indo."', dura: cobre([indo], 0.5), luz: 'alarme',
      camera: { de: [18.15, 1.66, 61.58], olha: [16.9, 1.5, 61.35], lente: 36, treme: 0.7 },
      falas: [indo],
    },
    {
      nome: '1.26 · ele corre', dura: 3.4, escurece: 1.1, luz: 'alarme',
      camera: { de: [19.2, 1.7, 61.7], olha: [10, 1.3, 61.4], treme: 1 },
      atores: { Matheus: { expressao: 'esforco', corre: true, anda: { para: [6.5, 0, 61.5], de: 0.15, ate: 3.2 } } },
      sons: [{ t: 0.3, tocar: passos(3, 0.3) }],
    },
  ],
}
