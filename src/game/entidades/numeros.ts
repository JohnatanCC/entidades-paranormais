// Os números das entidades no Testar (a aba Entidades do criador de mapas): quando elas veem o agente, até onde caçam,
// quanto tempo a música da perseguição segura depois. Pontos de partida: ajustar jogando.

// vista = a que distância (m) ela nota o agente (só se nada tapa a linha entre os dois: as paredes e portas fechadas);
// larga = a que distância ela desiste e volta para o lugar dela (m)
export const VISTA = { gralha: 9, mestre: 14, mae: 12, larga: 28 }

// a música da perseguição: segura `segura` s depois que a última caçadora parou (não corta no meio de um susto)
export const MUSICA = { segura: 3 }

// o Mestre caçando: vira = o quanto ele vira por s para o agente (rad/s); raio = o tamanho dele contra as paredes (m);
// descanso = s entre uma mordida e outra; folgaMordida = a mordida pega até um tico além do alcance (m, o bote avança);
// volta = a velocidade com que ele volta para o lugar dele (m/s); freia = de lado mais que isso (rad), ele para de correr e
// vira no lugar; mira = de frente até isso (rad), ele morde; encosta = ele não chega mais perto que isso do agente (m). A velocidade da corrida e o alcance da mordida são os
// do modelo (enemies/mestre/numeros.ts: CORRIDA, MORDIDA)
export const MESTRE = { vira: 5, raio: 0.45, descanso: 1.4, folgaMordida: 0.6, volta: 2, freia: 0.9, mira: 0.5, encosta: 1 }

// a Mãe caçando (os golpes e os tempos deles são os do modelo: enemies/mae/numeros.ts, GOLPE): anda = m/s atrás do agente
// (o andar dela é 0,95; caçando, mais depressa); vira = rad/s; freia = de lado mais que isso (rad), vira antes de andar;
// mira = de frente até isso (rad), ela ataca; garra = a essa distância (m) começa a sequência de garradas; aproxima = até
// essa, chega aos trancos; cargaDe = entre essas distâncias (m), dá a carga; cargaPrimeira e cargaCada = s até a primeira
// carga depois do grito e entre uma e outra; corte = s em que a garra pega depois do aviso; encosta = não chega mais perto
// que isso do agente (m); foge = o agente se afastou isso além da garra, a sequência para (m); perde = s sem ver o agente
// até ela desistir; raio = o tamanho dela contra as paredes (m); volta = m/s voltando para o lugar dela; o dano
// (docs/jogo.md: garrada 25, carga 35)
export const MAE = { anda: 2.1, vira: 4, freia: 1, mira: 0.45, garra: 1.5, aproxima: 3.5, cargaDe: [5, 10], cargaPrimeira: 2, cargaCada: 7, corte: 0.2, encosta: 0.9, foge: 1, perde: 6, raio: 0.4, volta: 0.95, danoGarra: 25, danoCarga: 35 }
