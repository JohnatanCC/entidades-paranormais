// Os números da Asa sombria (docs/demonios.md): o corpo, o voo e os movimentos. A luta (vida, dano, de quanto em quanto
// tempo ela cospe, quando desvia) entra com a etapa dela. Mexa aqui para ajustar.
import type { ConfigMolas } from '../../corpo/molas'

// os pingos da cauda: leves, balançam com o bater das asas
export const MOLAS: ConfigMolas = { mola: 22, amortece: 3.2, tranco: 0.7, trancoMax: 30, solto: 1.1, preso: 0.2, zona: { tras: -0.04, frente: 0.04, lado: 0.04 } }

// o voo: um bater de asas a cada `periodo` s, a descida mais rápida que a subida (`desce` = a parte da batida que é
// descida); as asas vão de `cima` a `baixo` (rad); a ponta vem atrasada (`ponta`) e dobra para trás na subida
// (`dobra`); varre = o quanto as asas vão para a frente na descida (rad); sobe = o quanto o corpo sobe e desce (m);
// inclina = o quanto ela deita para a frente por m/s (rad), até `maxInclina`; deita = de lado, por m/s
export const VOO = { periodo: 0.42, desce: 0.42, cima: 0.85, baixo: -0.55, ponta: 0.45, dobra: 0.55, varre: 0.25, sobe: 0.055, inclina: 0.1, maxInclina: 0.4, deita: 0.12 }

// planar de vez em quando: a cada intervalo (s, sorteado), por `dura` s; as asas abertas um pouco para cima (rad) e o
// corpo descendo um tico (m)
export const PLANAR = { intervalo: [3, 6], dura: [0.8, 1.5], asas: 0.2, afunda: 0.05 }

// cuspir: o aviso (s: as pétalas abrem até a metade, o núcleo cresce e pulsa), o cuspe (s) e as pétalas fechando (s);
// abre = o quanto cada pétala dobra para fora (rad); no aviso ela bate as asas mais rápido e mais curto; recua = o
// quanto o cuspe a empurra para trás (m/s); o núcleo: o tamanho fechado e o aceso; mira = o máximo que ela se inclina
// para o alvo (rad)
export const CUSPIR = { aviso: 0.6, cospe: 0.12, fecha: 0.4, abre: 1.25, periodo: 0.3, amplitude: 0.6, recua: 1.6, nucleo: [0.35, 1.35], mira: 0.6 }

// desviar: fecha as asas e rola para o lado; quanto tempo (s) e quanto ela anda de lado (m)
export const DESVIO = { dura: 0.45, distancia: 1.1 }

// tomar dano: o tranco (rad/s), o quanto ela cai (m) e quanto dura (s)
export const DANO = { tranco: 3.4, cai: 0.14, dura: 0.4 }

// o corpo inclina como uma mola (o tranco do dano, o embalo do voo)
export const BALANCO = { mola: 40, amortece: 5 }

// o projétil (projetil.ts): m/s, até onde vai (m), o tamanho do núcleo (m), as pedras de matéria que giram em volta
// dele (quantas, o tamanho, o raio da volta, quão rápido), o rastro (a cada quantos s, quanto vive, o tamanho)
export const PROJETIL = { vel: 8, alcance: 16, nucleo: 0.1, pedras: 5, pedra: [0.06, 0.1], raio: 0.11, gira: 9, rastro: 0.035, rastroVida: 0.35, rastroTam: 0.06 }

// a luta (ia.ts; docs/demonios.md, "Como lutam"): a vida; o dano do projétil e o raio em que ele acerta o agente (m); a
// distância que ela mantém do agente (m), girando em volta dele (rad/s), a velocidade (m/s) e a altura do voo (m); a
// espera entre um cuspe e o próximo (s, sorteada) e até onde ela cospe (m); desvia quando o agente mira nela (dentro de
// `cone` rad) por mais de `mirada` s, no máximo a cada `desvio` s
export const LUTA = { vida: 40, dano: 15, acerto: 0.55, distancia: 7, volta: 0.35, vel: 3, voo: 2, sobe: 2, cospe: [2.6, 3.4], alcance: 13, cone: 0.12, mirada: 0.6, desvio: 3 }
