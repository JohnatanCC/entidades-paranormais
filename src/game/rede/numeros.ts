// Os números do teste online (docs/teste-online.md): o ritmo das mensagens, quanto tempo sem resposta é queda e o quanto
// o outro jogador e as entidades deslizam até a última posição que chegou.

// a conexão: silencio = s sem mensagem nenhuma até dar a conexão como caída; espera = s tentando entrar antes de desistir;
// ping = de quantos em quantos s vai um ping
export const CONEXAO = { silencio: 6, espera: 15, ping: 1 }

// o ritmo: pose = quantas vezes por segundo cada um manda o próprio corpo; retrato = quantas vezes por segundo o host
// manda onde cada entidade está
export const RITMO = { pose: 20, retrato: 15 }

// o deslizar: o quanto o outro jogador (remoto) e as entidades do convidado (entidades) correm atrás da última posição
// (1/s: mais = mais preso à rede, menos = mais macio); salto = mais longe que isso (m), ou noutro andar, ele aparece de
// uma vez (a volta depois de cair, o cuspe do Devora): deslizando, atravessaria as paredes
export const SEGUE = { remoto: 14, entidades: 12, salto: 2 }
