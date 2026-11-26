// Os números das entidades no Testar (a aba Entidades do criador de mapas): quando elas veem o agente, até onde caçam,
// quanto tempo a música da perseguição segura depois. Pontos de partida: ajustar jogando.

// vista = a que distância (m) ela nota o agente (só se nada tapa a linha entre os dois: as paredes e portas fechadas);
// larga = a que distância ela desiste e volta para o lugar dela (m)
export const VISTA = { gralha: 9, mestre: 14, mae: 12, larga: 28 }

// o foco (foco.ts: com dois jogadores, quem o fantasma ataca): perto = a ameaça de quem está colado nele (cai em curva até zero
// na vista larga); dano = a ameaça de cada ponto de dano levado (a pistola tira 3, a escopeta 10 por bago); esquece = em
// quantos s o dano esvazia (~63%); folga = o outro precisa passar o atual tanto assim (0,15 = 15%) para ele trocar;
// minimo = s no alvo antes de poder trocar; cada = de quantos em quantos s ele pesa; escondido = quanto vale quem ele não vê
export const FOCO = { perto: 100, dano: 1, esquece: 4, folga: 0.15, minimo: 2, cada: 0.25, escondido: 0.5 }

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
// (docs/jogo.md: garrada 25, carga 35); vida = a vida escondida (o tiro tira: a pistola 3, a escopeta 10 por bago);
// zerada, ela cai atordoada (6 s: ESTADO.atordoada) e levanta com ela cheia
export const MAE = { anda: 2.1, vira: 4, freia: 1, mira: 0.45, garra: 1.5, aproxima: 3.5, cargaDe: [5, 10], cargaPrimeira: 2, cargaCada: 7, corte: 0.2, encosta: 0.9, foge: 1, perde: 6, raio: 0.4, volta: 0.95, danoGarra: 25, danoCarga: 35, vida: 300 }

// a luz da lamparina (player/lamparina.ts) nos fantasmas: ergue = a partir de quanto erguida o feixe vale (0..1); corpo =
// a meia largura do corpo (m: o feixe pega mesmo com só um pedaço dele dentro)
export const LUZ = { ergue: 0.6, corpo: 0.45 }

// os espectrais das caixas e as crias do Devora espectros (Espectrais.tsx; a caixa em maps/entidades.ts): ve = a que distância (m) quem patrulha nota o
// agente (sem nada no meio); perde = longe assim (m) por `semVer` s, ele desiste e volta a patrulhar; escondido = s sem
// ver o agente (uma parede, uma porta fechada, outro andar) até desistir também; olhar = de quantos em quantos s cada um
// confere se vê (não a cada quadro: são vários); patrulha = o raio
// (m) em volta da caixa onde ele anda; pausa = s parado em cada ponto da patrulha; andarSombra = a vontade de andar da
// Sombra patrulhando (0..1 da caçada); andarAsa = m/s da Asa patrulhando; voo = a altura da Asa patrulhando (m acima da
// caixa); nasce = s entre um e outro quando a caixa solta mais de um; some = s até o estourado sair de cena; andar = o
// agente mais alto ou mais baixo que isso (m) está em outro andar (a caixa não ativa, ninguém vê nem ataca; um andar
// tem 3,5 m: no meio da escada ele já está fora)
export const ESPECTRAIS = {
  vida: { sombra: 60, asa: 50 }, // a vida de cada um (a Asa espectral: 50, 26/nov; a Asa sombria da Demo · Intro continua com 40)
  ve: 10, perde: 15, semVer: 3, escondido: 5, olhar: 0.25, patrulha: 6, pausa: [1.5, 3.5] as const, andarSombra: 0.6, andarAsa: 1.4, voo: 2, nasce: 0.6, some: 2, andar: 1.5,
}

// o inimigo aprimorado (26/nov): só os que não são capturáveis (a Sombra e a Asa espectral, das caixas e as crias do
// Devora). chance = a chance de um nascer aprimorado (a caixa pode mandar sempre ou nunca: maps/entidades.ts); vida =
// quantas vezes a vida; dano = quantas vezes o dano; ritmo = quantas vezes mais rápido (andar, voar, atacar: o relógio
// dele anda mais depressa); tamanho = o corpo maior, para o jogador ver que é outro
export const APRIMORADO = { chance: 0.05, vida: 2, dano: 1.25, ritmo: 1.25, tamanho: 1.18 }

/** A dois (as demos com um amigo; docs/teste-online.md): a vida dos espectrais vezes quanto, quantos retratos por segundo
 *  o host manda e a cada quanto (s) cada espectral da horda escolhe de novo quem caça (o jogador mais perto). */
export const DOIS = { vida: 1.5, retrato: 15, troca: 0.5 }
