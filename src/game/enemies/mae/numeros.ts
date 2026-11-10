// Os números da Mãe (o modelo e o corpo; a luta, as barras e os ataques entram com a etapa dela). Mexa aqui para ajustar.
import type { ConfigMolas } from '../../corpo/molas'

// a saia: dez painéis em dois pedaços, pesados de pano molhado; abrem para fora, quase nada para dentro (as pernas)
export const SAIA: ConfigMolas = { mola: 30, amortece: 4.5, tranco: 0.55, trancoMax: 25, solto: 0.75, preso: 0.05, zona: { tras: -0.06, frente: 0.06, lado: 0.06 } }
// o cabelo molhado: mais pesado e mais lento que o do Matheus
export const CABELO_MAE: ConfigMolas = { mola: 28, amortece: 4, tranco: 0.5, trancoMax: 30, solto: 0.8, preso: 0.08, zona: { tras: -0.07, frente: 0.08, lado: 0.1 } }
export const RESPIRA = { volta: 4.2, peito: 0.02 } // parada, o peito sobe e desce devagar (s, rad)
