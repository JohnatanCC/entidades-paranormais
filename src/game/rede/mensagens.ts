// As mensagens do teste online (docs/teste-online.md). Curtas, em JSON: números arredondados e listas no lugar de
// objetos onde vão muitas (a pose, o retrato do mundo). Quem manda o quê:
//   os dois:          pose (20/s: onde estou e o que meu corpo faz), tiro (para o outro ver a bala), porta (abri, fechei)
//   convidado → host: acerto (minha bala pegou a entidade i: o host decide o resto)
//   host → convidado: ferido (uma entidade te pegou), mundo (15/s: onde cada entidade está e o estado dela),
//                     ev (o que acontece num instante: o golpe da Mãe, o grito do Mestre, a Gralha estourando)
//   host → convidado, no lobby das demos: comecar (os dois entram no mapa)
//   nas demos a dois: esp (15/s: os espectrais, onde e como cada um está), espEv (um instante de um espectral: nasceu,
//                     começou um golpe, levou tiro, estourou, a bola, a bomba, o teletransporte), roteiro (a linha da
//                     horda), lento (o agarrão te segura), voltar (os dois caíram: voltem ao começo);
//                     convidado → host: acertoE (minha bala pegou o espectral i); os dois: levanta (te levantei)
//   a conexão:        ping e pong (o tempo de ida e volta), tchau (saí)
export type V3 = [number, number, number]

/** O corpo de um jogador: p = os pés; yaw; vel = m/s; cor = o quanto corre (0..1); esq = a esquiva (−1 ou 0..1);
 *  mov = a velocidade no espaço dele; mira (0/1) e alvo; queda = s desde que caiu (−1 = de pé); fer = machucado;
 *  arma; lamp = segurando a lamparina erguida; alc = a mão na maçaneta (o ponto e o t). */
export interface Pose {
  p: V3; yaw: number; vel: number; cor: number; esq: number; mov: [number, number]
  mira: 0 | 1; alvo: V3; queda: number; fer: 0 | 1; arma: 'pistola' | 'escopeta' | 'besta' | null; lamp: 0 | 1; alc: [number, number, number, number] | null
}

/** Qual entidade: m = Mãe, s = Mestre (o "s" de sombra), g = Gralha; i = a posição dela na lista (a mesma nos dois:
 *  as duas máquinas montam a partir dos mesmos pontos do mapa, na mesma ordem). */
export type QualEntidade = 'm' | 's' | 'g'

/** O retrato do mundo: Mãe [x, y, z, giro, estado, tonta]; Mestre [x, y, z, giro, estado, correndo, coberto];
 *  Gralha [x, y, z, giro, viva, pousada]. */
export type RetratoMae = [number, number, number, number, string, 0 | 1]
export type RetratoMestre = [number, number, number, number, string, 0 | 1, 0 | 1]
export type RetratoGralha = [number, number, number, number, 0 | 1, 0 | 1]

/** Um instante de uma entidade: a = o que (g = golpe da Mãe, com v = o nome; x = o golpe cortado; p = piscou (levou
 *  tiro); grito, morde, glitch = do Mestre; ataca, ferida, estoura, some = da Gralha). */
export type AcaoEntidade = 'g' | 'x' | 'p' | 'grito' | 'morde' | 'glitch' | 'ataca' | 'ferida' | 'estoura' | 'some'

/** Um espectral no retrato: [id, tipo, x, y, z, giro, escala (×100), fraco (0/1), a força da captura (−1 = não),
 *  aprimorado (0/1)]. O tipo vai junto para quem perdeu o aviso de que ele nasceu (entrou depois) montar a cópia. */
export type RetratoEsp = [number, TipoEsp, number, number, number, number, number, 0 | 1, number, 0 | 1]
/** Os espectrais: s = Sombra, a = Asa, d = Devora espectros, m = Manto, t = Asa do terror. */
export type TipoEsp = 's' | 'a' | 'd' | 'm' | 't'
/** Um instante de um espectral i: novo (v = o tipo; p = onde; n = o giro; f = aprimorado; s = como nasce: surgir, chao,
 *  boca; sem s, cuspido até q), modo (v = o golpe que começou; n = o lado do desvio), ferir (n = de onde, rad), estoura,
 *  some (sem estouro; v = 'capturado' se foi absorvido), bola e bomba (p = de, q = para; f = a bola do aprimorado), tele
 *  (p = o destino), limpar (todos). */
export type AcaoEsp = 'novo' | 'modo' | 'ferir' | 'estoura' | 'some' | 'bola' | 'bomba' | 'tele' | 'limpar'

export type Msg =
  | ({ t: 'pose' } & Pose)
  | { t: 'tiro'; arma: 'pistola' | 'escopeta' | 'besta'; de: V3; para: V3 }
  | { t: 'porta'; id: string; aberta: boolean; lado: 'a' | 'b' }
  | { t: 'acerto'; k: QualEntidade; i: number; dano: number }
  | { t: 'ferido'; dano: number; de: V3 }
  | { t: 'mundo'; m: RetratoMae[]; s: RetratoMestre[]; g: RetratoGralha[] }
  | { t: 'ev'; k: QualEntidade; i: number; a: AcaoEntidade; v?: string }
  | { t: 'comecar'; mapa: string }
  | { t: 'esp'; l: RetratoEsp[] }
  | { t: 'espEv'; i: number; a: AcaoEsp; v?: string; s?: string; n?: number; p?: V3; q?: V3; f?: 0 | 1 }
  | { t: 'acertoE'; i: number; dano: number; d: V3 }
  | { t: 'roteiro'; titulo: string; dica?: string }
  | { t: 'lento'; q: number; dura: number }
  | { t: 'levanta' }
  | { t: 'voltar' }
  | { t: 'ping'; h: number }
  | { t: 'pong'; h: number }
  | { t: 'tchau' }

export type TipoMsg = Msg['t']

/** Arredonda para mandar (cm bastam). */
export const r2 = (n: number) => Math.round(n * 100) / 100
export const v3 = (v: { x: number; y: number; z: number }): V3 => [r2(v.x), r2(v.y), r2(v.z)]
