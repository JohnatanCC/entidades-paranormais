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

// planar de vez em quando: a cada intervalo (s, sorteado), por `dura` s; as asas abertas um pouco para cima (rad)
export const PLANAR = { intervalo: [2.5, 5], dura: [0.7, 1.4], asas: 0.16 }
