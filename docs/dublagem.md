# A dublagem

Decidido em 18/nov: as cenas vão ter **vozes de verdade**. O desenvolvedor dirige a dublagem e já tem candidatos para
testar. Aqui ficam o roteiro de cada personagem (para os testes), o jeito de gravar, a voz provisória e o teste de
vozes no ElevenLabs (24/nov).

> O documento de design (`docs/design/historia.md`) tinha deixado vozes de fora; elas voltam com as cenas
> (`docs/cenas.md`). A legenda continua sempre na tela.

## Os personagens das cenas 1 e 2

| Personagem | Quem é | A voz |
| --- | --- | --- |
| **Matheus Moura** | O agente (o jogador). Fechado, orgulhoso, carrega alguma coisa do antigo parceiro; não admite que está mal | Jovem adulto, seca, contida. Fala pouco e corta as frases. Nunca grita na cena do escritório: a raiva fica presa |
| **Victor** | O chefe do departamento do Matheus. 35 anos, grisalho cedo, duro mas do lado dele | Mais grave e mais lenta. Calma de quem já decidiu. Não é bronca: é cobrança de quem se importa |
| **A central** | A voz da C.R.O.S. no rádio, sem rosto | Urgente, firme, profissional. Passa pelo filtro do rádio (o chiado é posto no jogo; grave limpo) |

## O roteiro dos testes (a cena do escritório)

O que está entre parênteses é a direção, não se fala. O arquivo é o nome que a gravação recebe (a pasta
`public/vozes/cap0/`), para o jogo achar sozinho.

> **18/nov:** a cena do escritório passou a ser a cena 1 e os planos foram renumerados (`docs/cenas.md`). Os números
> desta tabela e os nomes dos arquivos são os de antes: as frases continuam as mesmas, só mudou onde a câmera corta
> (uma frase pode atravessar dois planos). Os nomes dos arquivos são acertados quando as gravações chegarem.

### Victor

| Arquivo | Plano | Fala | Direção |
| --- | --- | --- | --- |
| `2.4-victor.wav` | 2.4 | Entre, Moura. Vou ser direto. | Levanta o olhar da pasta no "Entre, Moura"; o "Vou ser direto" vem depois de uma pausa, com o Matheus já na frente da mesa (18/nov: era "Sente."). Seco, sem ser rude |
| `2.6-victor.wav` | 2.6 | Três missões este mês. Três capturas que deram errado. | Lendo os fatos. Uma pausa entre as duas frases. Sem acusar |
| `2.7-victor.wav` | 2.7 | Isso não é você. O que está acontecendo? | Mais baixo, mais perto. A preocupação aparece aqui |
| `2.9-victor.wav` | 2.9 | É por causa do seu antigo parceiro? | Cuidadoso. Ele sabe que está tocando num ponto sensível |
| `2.11-victor.wav` | 2.11 | Vou mudar a dinâmica. Chega de te mandar com um time diferente a cada missão. | Decidido. Fecha a pasta antes de falar |
| `2.12-victor.wav` | 2.12 | A partir de hoje você tem uma equipe fixa. É uma chance de criar laços. De não carregar tudo sozinho. | A frase mais calorosa dele. A última parte quase como um conselho de amigo |
| `2.14-victor.wav` | 2.14 | Sempre? Mesmo depois deste mês? | O "Sempre?" curto, com uma ponta de ironia. Bate o dedo na pasta no "deste mês" |
| `2.16-victor.wav` | 2.16 | Ótimo. Já tenho uma missão para vocês. Logo você conhece a sua equipe. | Volta a ser chefe: prático, encerrando a conversa |

### Matheus

| Arquivo | Plano | Fala | Direção |
| --- | --- | --- | --- |
| `2.8-matheus.wav` | 2.8 | Nada. Muita coisa ao mesmo tempo, só isso. | Desviando o olhar. Rápido demais, querendo encerrar o assunto |
| `2.10-matheus.wav` | 2.10 | Não tem nada a ver com isso. Eu me distraí. Não vai se repetir. | A primeira frase dura, cortante. Pausa. As outras duas mais controladas, quase ensaiadas |
| `2.13-matheus.wav` | 2.13 | Não precisa. Eu sempre me virei bem sozinho. | Orgulhoso, com um pouco de defesa |
| `2.15-matheus.wav` | 2.15 | ...Tudo bem. | Depois de um silêncio. Vencido, sem concordar de verdade |
| `2.18b-matheus.wav` | 2.18b | Um time fixo não vai resolver nada. Eu não quero ter "novos laços". Eu vou conseguir. Eu sou um bom agente. | Sozinho no corredor, baixo, para si mesmo. O "novos laços" com desprezo, imitando o Victor. A última frase é para se convencer: a voz quase falha |
| `2.21-matheus.wav` | 2.21 | Estou indo. | No rádio, já se mexendo. Firme, sem hesitar |

### A central

| Arquivo | Plano | Fala | Direção |
| --- | --- | --- | --- |
| `2.20-central.wav` | 2.20 | Agente Moura, responda! Precisamos de você no andar de contenção, agora! | Urgente, com a sirene ao fundo (a sirene é posta no jogo: gravar sem ela, mas falando por cima de um barulho imaginado) |

## Como gravar (para os candidatos)

- **WAV, mono, 48 kHz** (ou 44,1 kHz), sem música e sem efeito. O jogo põe o eco, o rádio e a sirene.
- Um lugar quieto, sem eco (um quarto com roupas e cortinas ajuda). O microfone a um palmo da boca.
- **Três tomadas de cada fala**, com um segundo de silêncio entre elas; o diretor escolhe a melhor.
- Meio segundo de silêncio antes e depois de cada fala (o jogo corta).
- O nome do arquivo como na tabela; as tomadas com `-1`, `-2`, `-3` no fim (`2.6-victor-2.wav`).

## A voz provisória: a voz do navegador (18/nov)

Para ter noção do ritmo antes das gravações, o navegador lê cada fala na hora da legenda (`src/game/cenas/vozes.ts`).
Cada personagem tem um perfil: a voz preferida, o tom e a velocidade (o Victor mais grave e devagar, o Matheus mais
agudo e seco, a central com voz de mulher, mais rápida). O Ver cenas mostra qual voz cada um está usando.
- **No Edge** aparecem as vozes naturais (o Antonio, a Francisca, a Thalita): é onde testar.
- **Nos outros navegadores**, as do sistema (no Windows, o Daniel e a Maria), robóticas; sem nenhuma voz em português,
  fica só a legenda.
- É só para testar: soa diferente em cada aparelho e não tem atuação. No lançamento, as vozes são as gravações.

**Tentado e recusado (18/nov): o Piper**, um programa de voz que roda no computador. A única voz brasileira que rodou
(a edresson) soou sem emoção e com um sotaque estranho, e todas as vozes brasileiras dele são de homens da mesma idade (o
Victor precisa de uma voz mais velha e grossa que a do Matheus). O programa e as vozes baixadas foram apagados.

## O teste de vozes no ElevenLabs (24/nov): aprovado

Um teste no **ElevenLabs** (texto para fala, conta gratuita, 10.000 créditos; cada fala curta gasta uns 40). O
desenvolvedor ouviu e aprovou as duas vozes da biblioteca, sem assinar nada:

| Personagem | A voz | A fala do teste |
| --- | --- | --- |
| **Matheus** | **Matheus - Young Brazilian Male** (jovem, suave e envolvente) | "Oi, Lara, que bom ver você aqui." |
| **Lara** | **Alice - Brazilian Creator** (enérgica e acessível, com um calor jovem) | "Oi, Matheus, é bom estar com você novamente." |

- **O pedido era** um homem de uns 30 anos (Matheus) e uma mulher negra de 24 anos (Lara). O ElevenLabs filtra a voz por
  idioma, sotaque, gênero e idade, **não por etnia**: escolhi pela descrição.
- **A voz do Matheus é descrita como jovem:** se nas falas de mais emoção ela parecer nova demais para 30 anos, as
  alternativas são a "Paulo Rovéglia" (jovem do Rio, timbre médio) e a "Fabio Oliveira" (grave); para a Lara, a "Fabi -
  Portuguese (BR)" (natural e emotiva) e a "Vitoria" (clara e calorosa). A "Leo - Brazilian Portuguese (Neutral)", a mais
  próxima dos 30 anos, **é paga** (plano Starter ou acima).
- **Os áudios do teste não foram baixados**: ficam no histórico da conta (duas versões de cada fala).
- **Antes de usar no jogo publicado:** o uso comercial das vozes depende do **plano** do ElevenLabs (o gratuito costuma
  pedir atribuição e não permitir uso comercial): conferir, como as músicas geradas por IA (`docs/musicas.md`, fase C do
  `docs/lancamento.md`).
- O Victor, a central e o resto do elenco ainda não têm voz escolhida.

## A fazer

- **O jogo tocar as gravações:** a fala com arquivo toca o arquivo junto com a legenda (e a boca abre conforme o volume);
  sem arquivo, a voz do navegador. Um volume próprio para as vozes nas configurações.
- **Os atores das cenas** (a cena do escritório com o Matheus e o Victor em cena): ver `docs/cenas.md`.
