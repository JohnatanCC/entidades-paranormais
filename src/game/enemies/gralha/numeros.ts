// Os números da Gralha (docs/cap2-sombra.md). Por enquanto só o voo.
import type { ConfigMolas } from '../../corpo/molas'

// as penas soltas penduradas (mecha_pena_*)
export const MOLAS: ConfigMolas = { mola: 20, amortece: 3, tranco: 0.7, trancoMax: 30, solto: 1.1, preso: 0.3, zona: { tras: -0.04, frente: 0.04, lado: 0.04 } }

// o voo: uma batida a cada `periodo` s, a descida mais rápida que a subida (`desce` = a parte da batida que é descida);
// as asas vão de `cima` a `baixo` (rad); a ponta bate mais (`ponta`) e vem atrasada (`atraso`, em batida); sobe = o
// quanto o corpo sobe e desce (m); inclina = o quanto ela deita para a frente por m/s (rad), até `maxInclina`; deita =
// de lado nas curvas, por m/s; cabeca = o quanto a cabeça fica parada no ar enquanto o corpo balança (0 a 1)
export const VOO = { periodo: 0.46, desce: 0.4, cima: 0.75, baixo: -0.5, ponta: 0.55, atraso: 0.13, sobe: 0.045, inclina: 0.07, maxInclina: 0.4, deita: 0.1, cabeca: 0.8 }

// perseguir (depois do grito do Mestre): voa a `vel` m/s até o alvo e fica rodeando por cima dele, a `raio` m, girando a
// `roda` rad/s, na `altura` (m acima dos pés do alvo) e subindo e descendo `sobe` m; vira = o quanto o rumo muda por s
// (mais = curvas mais fechadas); some = depois de quantos s ela vai embora (ponto de partida: ajustar jogando)
export const CACA = { vel: 5.5, raio: 1.5, roda: 1.5, altura: 1.9, sobe: 0.3, vira: 3.2, some: 12 }

// o ataque: sobe com as asas no alto (o aviso, s), mergulha com as asas fechadas (s) e volta batendo depressa (s);
// asasNoAlto e empina = no aviso (rad); asas, pontas e varre = as asas fechadas para trás no mergulho (rad); inclina = o
// corpo apontado para baixo (rad); bico = o quanto abre (rad); pressa = quantas vezes mais rápido bate na volta;
// vel e vira = o mergulho (m/s; o quanto o rumo muda por s); altura = onde ela bica (m acima dos pés do alvo: o peito);
// perto = só ataca a menos disso do lugar dela na roda (m); espera = de quanto em quanto tempo (s, sorteado);
// alcance e dano = bica quem estiver a menos de `alcance` m do bico (pontos de partida: ajustar jogando)
export const ATAQUE = {
  sobe: 0.3, mergulha: 0.42, volta: 0.55,
  asasNoAlto: 0.35, empina: 0.4, asas: 0.1, pontas: -0.25, varre: 0.95, inclina: 0.75, bico: 0.55, pressa: 1.8,
  vel: 9, vira: 9, altura: 1.25, perto: 1.3, espera: [2.5, 4.5], alcance: 0.7, dano: 6,
}

// o tiro (17/nov: as Gralhas morrem com as armas; a luz não faz nada com elas): vida = quantos tiros aguenta (ponto de
// partida); dura = o tranco (s); cai (m), empina e tomba (rad), as asas dão um pulo (asas, rad) e o bico abre (bico);
// penas = quantas caem a cada tiro
export const DANO = { vida: 3, dura: 0.35, cai: 0.12, empina: -0.35, tomba: 0.45, asas: 0.5, bico: 0.5, penas: 8 }

// as penas que caem: o tamanho (m: o comprimento e a largura), a velocidade com que saem (m/s), o quanto o ar freia,
// a gravidade e a velocidade máxima de queda (cai, m/s: devagar), o balanço de um lado para o outro (balanca, rad/s;
// largura, m/s), quanto ficam (vida, s) e em quanto tempo somem no fim (some, s)
export const PENAS = { tamanho: [0.2, 0.055], vel: [0.5, 1.8], freia: 2.6, gravidade: 3.2, cai: 0.75, balanca: 4.2, largura: 0.5, vida: [2.6, 4], some: 0.5 }

// o estouro em fumaça (a vida zerou): quantas nuvens, a cor, a velocidade para fora (m/s), o quanto freiam, sobem um
// pouco (m/s²), o tamanho (m) e o quanto crescem, quanto duram (s), a opacidade no começo, e as penas que saem junto
export const SOPRO = { nuvens: 12, cor: '#0b0910', vel: [1.2, 3.2], freia: 3.5, sobe: 0.5, tamanho: [0.3, 0.55], cresce: 1.5, vida: [0.6, 1.1], forca: 0.9, penas: 12 }

// pousada (em pé): o corpo erguido (corpo, rad) com o pescoço esticado para cima (pescoco), as asas fechadas junto ao
// corpo (asas, varre, rad), as pernas para baixo (pernas, rad), a cauda (rad); entra = o quão depressa pousa; a cabeça
// vira aos trancos: de quanto em quanto tempo (tique, s) e até onde (girar, tombar, rad); altura = o corpo acima do
// chão (m, na escala 1)
export const POUSADA = { corpo: -0.55, pescoco: -0.6, asas: -0.2, varre: 1.2, pernas: -1.05, cauda: 0.35, entra: 6, tique: [0.5, 1.8], girar: 0.7, tombar: 0.35, altura: 0.27 }

// planar de vez em quando: a cada intervalo (s, sorteado), por `dura` s; as asas abertas um pouco para cima (rad)
export const PLANAR = { intervalo: [2.5, 5], dura: [0.7, 1.4], asas: 0.16 }
