# A mansão do capítulo 1: o Palacete Monteval

A planta aprovada em 9/nov para o mapa `mansao-cap1`. O capítulo 1 é da **Mãe** (Celina Monteval, ver
`docs/design/historia.md`): a casa é contada pela história dela, e a planta serve à perseguição (ela como o Mister X do
Resident Evil 2) e à busca dos objetos ligados a ela. As regras do capítulo estão em `docs/jogo.md`.

## O mapa gerado (9/nov)

A planta crua está em `maps/mansao-cap1` ("Mansão · capítulo 1"), gerada a partir das tabelas abaixo:
- **A casa começa em x 8, z 8 do mapa** (some 8 às coordenadas da casa). O mapa tem 3 × 3 blocos e começa no alpendre.
- **Três andares no editor:** o térreo, o andar de cima e o 2º andar, que por enquanto é só a laje (o teto do andar de
  cima e do pé-direito duplo do salão; o futuro sótão).
- **Todas as portas fechadas e nenhuma trancada:** o desenvolvedor decide quais trancam (a do berçário, a do porão).
  A porta do porão fica na parede dos fundos da lavanderia. A do sótão ainda não existe (não há onde pôr sem o sótão).
- **Texturas por cômodo:** papel de parede com lambri na frente nobre, reboco com barra ou azulejo nos fundos; mármore no
  vestíbulo e no salão, taco e tábua nos quartos, ladrilho na copa e na cozinha. Tudo se troca com o pincel.
- **Janelas:** as da frente e dos lados dos cômodos nobres com o luar; as dos fundos sem (dá para ligar no painel).
- **Lâmpadas:** 11, no vestíbulo, no salão (penduradas no alto, sobre o vão), nos cômodos principais e nos corredores
  (duas "falhando"). Cada lâmpada acesa pesa no desempenho: na mansão inteira, prefira poucas e algumas apagadas.
- **Fora:** a mobília, os quadros e os objetos da Mãe (foto, pelúcia, chave: entram com os scripts).

## As três ideias

- **Frente nobre, fundos de serviço**, como num palacete de café de 1894: a família e as visitas na frente; a cozinha, os
  criados e a escada de serviço atrás.
- **Anéis para despistar a Mãe:** em cada andar dá para dar a volta num bloco, e as duas escadas (a nobre e a de serviço)
  fecham um anel entre os andares.
- **Ir e voltar:** os objetivos se alternam entre os andares, e cada viagem atravessa a casa com ela por perto.

## As medidas

- A casa tem **32 × 24 m** e dois andares (3,5 m cada). Cabe em 2 × 2 blocos de 16 m.
- **Corredores de 3 m e galeria de 3 m** (a câmera de ombro e a esquiva de 2,7 m pedem espaço; o design antigo tinha 1,4 m).
  A galeria era 2,5 m na proposta: virou 3 m porque o piso é em quadrados de 1 m e a borda do vão precisa cair numa linha da grade.
- **Coordenadas da casa:** (0, 0) é o canto da frente a oeste; x vai de 0 (oeste) a 32 (leste) e z de 0 (a frente, o norte)
  a 24 (os fundos, o sul), como as direções do editor (norte = −z, sul = +z, leste = +x, oeste = −x). No mapa a casa pode
  começar em qualquer ponto; sugestão: em x 8, z 8, para sobrar terreno na frente para o alpendre e o jardim.

## O térreo (andar 0)

| Cômodo | x | z | Tamanho | O que tem |
| --- | --- | --- | --- | --- |
| Alpendre (fora) | 11–21 | −3–0 | 10 × 3 m | A porta da frente (dupla) |
| Vestíbulo | 10–22 | 0–4 | 12 × 4 m | O começo |
| Salão nobre | 10–22 | 4–16 | 12 × 12 m | Pé-direito duplo, a escadaria nobre; colunas e móveis cobertos quebram a visão de quem está na galeria |
| Sala de visitas | 0–10 | 0–9 | 10 × 9 m | **A foto do Antônio** no piano, sob o espelho coberto com pano preto |
| Gabinete do Henrique | 0–10 | 9–16 | 10 × 7 m | **A chave do berçário** (aparece depois, ver abaixo) |
| Sala de jantar | 22–32 | 0–10 | 10 × 10 m | A mesa posta para 12, coberta de pó |
| Copa | 22–32 | 10–16 | 10 × 6 m | Entre a sala de jantar e a cozinha |
| Corredor dos fundos | 0–22 | 16–19 | 22 × 3 m | Liga a frente aos fundos |
| Cozinha | 22–32 | 16–24 | 10 × 8 m | O calendário parado em junho de 1930 |
| Quarto dos criados | 0–8 | 19–24 | 8 × 5 m | Sala segura (candidata) |
| Lavanderia | 8–14 | 19–24 | 6 × 5 m | A porta do porão, emperrada (capítulo futuro) |
| Escada de serviço | 14–22 | 19–24 | 8 × 5 m | Queimada no incêndio de 1930 |

Portas: alpendre–vestíbulo (dupla), vestíbulo–salão (dupla), salão–sala de visitas, salão–sala de jantar, salão–corredor
(duas, uma de cada lado da escadaria), sala de visitas–gabinete, gabinete–corredor, sala de jantar–copa, copa–cozinha,
corredor–cozinha, corredor–criados, corredor–lavanderia, corredor–escada de serviço, cozinha–escada de serviço.

## O andar de cima (andar 1)

| Cômodo | x | z | Tamanho | O que tem |
| --- | --- | --- | --- | --- |
| Sala de costura | 10–22 | 0–4 | 12 × 4 m | **A Mãe começa aqui**, cantando à janela da frente (a canção de ninar da ficha do caso) |
| Galeria oeste | 10–13 | 4–12 | 3 × 8 m | Em volta do vão |
| Galeria leste | 19–22 | 4–12 | 3 × 8 m | Em volta do vão |
| Vão do salão | 13–19 | 4–12 | 6 × 8 m | Sem piso; **guarda-corpo** nas bordas |
| Patamar | 10–22 | 12–16 | 12 × 4 m | A escadaria chega aqui |
| Quarto do casal | 0–10 | 0–9 | 10 × 9 m | Espelho coberto, penteadeira, guarda-roupa |
| Berçário | 0–10 | 9–16 | 10 × 7 m | **Trancado** (`chave-bercario`); a porta dá no patamar. Aberto, leva à arena |
| Quarto das crianças | 22–32 | 0–9 | 10 × 9 m | Cenário (Lúcia e os gêmeos ficam para outros capítulos) |
| Quarto de hóspedes | 22–32 | 9–16 | 10 × 7 m | Sala segura (candidata) |
| Corredor de cima | 0–32 | 16–19 | 32 × 3 m | Liga ao patamar por um arco de 4 m (x 14–18) |
| Rouparia | 0–10 | 19–24 | 10 × 5 m | Três armários; **a pelúcia de gato** num deles |
| Banheiro | 10–14 | 19–24 | 4 × 5 m | |
| Escada de serviço | 14–22 | 19–24 | 8 × 5 m | A chegada da escada |
| Depósito | 22–32 | 19–24 | 10 × 5 m | Móveis do leilão; a escada do sótão, bloqueada (capítulo futuro) |

Portas: galeria oeste–sala de costura, galeria leste–sala de costura, galeria oeste–quarto do casal, galeria leste–quarto
das crianças, patamar–berçário (trancada), patamar–quarto de hóspedes, patamar–corredor (vão de 4 m), corredor–rouparia,
rouparia–banheiro, corredor–banheiro, corredor–escada de serviço, corredor–depósito.

## As escadas

- **Escadaria nobre:** área x 14–18, z 9–15 (4 × 6 m), sobe para o sul. 19 degraus de 18 cm, pisada de ~32 cm.
  Sai do salão e chega no patamar. O buraco no piso de cima fica dentro do vão e do patamar.
- **Escada de serviço:** área x 15–21, z 21–23 (6 × 2 m), sobe para o leste. A faixa z 19–21 fica livre nos dois andares
  para chegar ao pé e sair do topo.
- O corrimão das escadas e o guarda-corpo em volta do buraco de cima saem sozinhos (ver `docs/criador-de-mapas.md`).
  As bordas do vão do salão levam o objeto **guarda-corpo** (1, 2 ou 4 m).

## Os anéis (para fugir dela)

- **Térreo, oeste:** salão → sala de visitas → gabinete → corredor dos fundos → salão.
- **Térreo, leste:** salão → sala de jantar → copa → cozinha → corredor dos fundos → salão.
- **Andar de cima:** galeria oeste → sala de costura → galeria leste → patamar → galeria oeste, em volta do vão.
- **Entre os andares:** salão → escadaria nobre → patamar → corredor de cima → escada de serviço → corredor dos fundos → salão.

## A rota do capítulo

1. O agente chega pelo alpendre e vê um vulto na janela de cima: a Mãe cantando na sala de costura.
2. No térreo, a **foto** no piano. Quebrar faz barulho, e ela desce pela escadaria nobre.
3. Com ela embaixo, ele sobe pela escada de serviço até a **rouparia**: a pelúcia está num dos armários onde Henrique
   escondia as coisas do bebê.
4. Destruídas a foto e a pelúcia, ela grita, e a **chave** aparece no gabinete, lá embaixo. Ele desce de novo.
5. Sobe, abre o **berçário** pelo patamar e começa a luta.

## Decidido em 9/nov

- **A arena é outro mapa.** A arena da luta (24 × 32 m, paredes de 7 m) não cabe na casa. A porta do berçário troca para o
  mapa `bercario-cap1`. Assim a mansão fica leve para o celular. O capítulo passa a ser "a mansão e a arena do chefe".
- **A chave só aparece depois da foto e da pelúcia.** Sem isso, quem achasse a chave cedo iria direto ao chefe.
  É um gatilho do script (um ponto em `points`), sem mecânica nova.
- **Lugares fixos na demo.** A rouparia já tem três armários, para sortear a pelúcia mais tarde sem mexer no mapa
  (a história sustenta o sorteio: Henrique escondia as coisas cada vez num lugar).
- **Porão e sótão ficam trancados** neste capítulo: as portas estão lá, emperradas. Entram quando a casa mudar.

## Os outros fantasmas e as salas seguras (sugestão, decidir na etapa dos fantasmas)

- **Glutão:** a sala de jantar e a cozinha. **Espectral:** os corredores. O tiro faz barulho e chama a Mãe: lutar ou evitar.
- **Salas seguras candidatas:** o quarto dos criados (térreo) e o quarto de hóspedes (em cima).

## A história no cenário

Espelhos cobertos com pano preto (sala de visitas, quarto do casal), cera de vela em todo lugar, as etiquetas do leilão de
1931 nos móveis cobertos (salão, depósito), a mesa posta para 12, o calendário de junho de 1930 na cozinha, a escada de
serviço queimada, os fios em isoladores de porcelana.

## Em aberto

- Destruir a foto e a pelúcia muda a Mãe (menos vida, outro comportamento) ou só libera o caminho?
- Quanto tempo ela fica atordoada.
- A história diz que ela "arranca você dos esconderijos", mas **se esconder no armário não está nas mecânicas decididas**.
  Por enquanto os armários são cenário e esconderijo de objetos.
