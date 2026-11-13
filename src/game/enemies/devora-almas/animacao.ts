// Os movimentos do Devora almas (docs/demonios.md), feitos em código em cima das pastas do modelo (modelo.ts). Ele
// passa de um modo para o outro (ModoDevora); quem o controla pede e o resto segue sozinho:
//   mergulhar (de fora do chão): entra no chão de cabeça → nadando: embaixo do chão, só os tentáculos das costas passam; o corpo
//     ondula, os tentáculos remam de lado (quem o controla move o root, na altura que a animação devolve);
//   emergir (nadando): sai do chão de cabeça → solto;
//   marcar (nadando, embaixo do alvo): fica em pé lá no fundo, a boca abrindo (a marca de mordida aparece no chão: os
//     efeitos) → salto: sai de boca aberta para cima, os tentáculos abertos, morde no alto e cai deitado →
//     se pegou alguém: engolindo (3 s, mastigando, a barriga mexendo) → cuspe → mergulho;
//     se errou: exposto (3,5 s se debatendo no chão: a janela para atirar) → mergulho.
//   investir (nadando, de frente para o alvo): mira (os tentáculos das costas param e apontam para a frente: o aviso) →
//     investida (dispara reto, as costas rasgando o chão) → freia (passa do ponto: a janela para atirar nas costas) →
//     nadando, ou a próxima investida (na fase 3, duas seguidas, a segunda com a mira curta);
//   chover (nadando): afunda e fica lá embaixo enquanto os tentáculos sobem do chão (os efeitos) → nadando;
//   ninhada (nadando, de frente para o alvo): sai meio corpo do chão e cospe Assombrados (cria: de onde e para onde) →
//     nadando.
//   fase (1 a 3, as barras de vida): as rachaduras se espalham e o que brilha acende mais; arrancar: um tentáculo das costas some.
//   atordoar (muito dano, ou uma barra zerada; de qualquer modo): é arrancado do chão, cai de lado, tonto (a boca solta,
//     os tentáculos moles, o brilho falhando), se desvira → rastejando: se arrasta devagar pela superfície, puxando com
//     os tentáculos (a janela para atirar) → mergulho. rastejar: só o arrastar (cansado).
//   O dano (ferir): o tranco no corpo e a boca morde no ar. Estourar: o corpo some e fica o respingo. Sem animação de morte.
// animarDevora devolve a altura do root, o quanto ele avança (m/s para a frente dele) e o que aconteceu neste quadro:
// rompe (a cabeça passou pelo chão: o respingo), mordeu (o alto do salto: quem está na marca é engolido), cuspe (de onde
// sai quem foi engolido) e cria (um demônio cuspido: qual, de onde sai e para que lado).
import * as THREE from 'three'
import { animarMolas } from '../../corpo/molas'
import { estourar, type Estouro } from '../estouro'
import type { DevoraAlmas, ModoDevora } from './modelo'
import { ALTURA, ATORDOADO, BALANCO, BOCA, CHAO, CHUVA, DANO, FASES, INVESTIDA, NADO, NINHADA, RASTEJO, RESPINGO, SALTO, TEMPO, TENTACULOS } from './numeros'

export interface SaidaDevora {
  y: number; avanca: number; rompe: boolean; mordeu: boolean; cuspe: THREE.Vector3 | null
  cria: { tipo: 'assombrado' | 'asa'; de: THREE.Vector3; frente: THREE.Vector3 } | null
}

const cl = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x))
const lerp = (a: number, b: number, k: number) => a + (b - a) * k
const damp = (cur: number, alvo: number, k: number, dt: number) => cur + (alvo - cur) * (1 - Math.exp(-k * dt))
const suave = (k: number) => { const x = cl(k, 0, 1); return x * x * (3 - 2 * x) }
const PI = Math.PI

function mudar(d: DevoraAlmas, modo: ModoDevora) {
  const A = d.anim
  A.modo = modo; A.tm = 0; A.y0 = A.y; A.p0 = A.pitch
  A.feito = { rompe: false, mordeu: false, cuspiu: false, pousou: false, cria: 0 }
  A.rumo.vel = A.rumo.giro = 0 // o nado de quem o controla recomeça do zero (o embalo dos ataques é da animação)
}
const livre = (d: DevoraAlmas) => !d.anim.estourado
/** Entra no chão (de fora dele: solto ou exposto). */
export function mergulhar(d: DevoraAlmas) { if (livre(d) && (d.anim.modo === 'solto' || d.anim.modo === 'exposto')) mudar(d, 'mergulho') }
/** Sai do chão (nadando). */
export function emergir(d: DevoraAlmas) { if (livre(d) && d.anim.modo === 'nadando') mudar(d, 'emergir') }
/** Nadando, embaixo do alvo: a marca e o salto. pega: tem alguém em cima da marca na hora da mordida (engole). */
export function marcar(d: DevoraAlmas, pega: boolean) { if (livre(d) && d.anim.modo === 'nadando') { mudar(d, 'marca'); d.anim.pegou = pega } }
/** Nadando, de frente para o alvo: a investida rasante (vezes: quantas seguidas; na fase 3, 2). Durante a mira, quem o
 *  controla vira o root para o alvo; a investida vai reto para onde ele está virado. */
export function investir(d: DevoraAlmas, vezes = 1) {
  if (!livre(d) || d.anim.modo !== 'nadando') return
  mudar(d, 'mira'); d.anim.repete = Math.max(0, vezes - 1); d.anim.curta = false
}
/** Nadando: afunda para a chuva de tentáculos (n círculos: o tempo lá embaixo acompanha). Os tentáculos que sobem são
 *  dos efeitos (chuvaDeTentaculos), começando agora. */
export function chover(d: DevoraAlmas, n: number) {
  if (!livre(d) || d.anim.modo !== 'nadando') return
  const C = CHUVA
  mudar(d, 'chuva'); d.anim.chuva = C.afunda + (n - 1) * C.intervalo + C.aviso + C.sobe + C.fica + C.desce + 0.6
}
/** Nadando, de frente para o alvo: sai meio corpo do chão e cospe n Assombrados (até 3). */
export function ninhada(d: DevoraAlmas, n: number) {
  if (!livre(d) || d.anim.modo !== 'nadando') return
  mudar(d, 'ninhada'); d.anim.ninhada = cl(n, 1, NINHADA.cospe.length)
}
/** Muito dano de uma vez (ou uma barra zerada): atordoado e depois rastejando. Vale de qualquer modo: embaixo do chão,
 *  ele é arrancado para fora. */
export function atordoar(d: DevoraAlmas) { if (livre(d)) { mudar(d, 'atordoado'); d.anim.repete = 0 } }
/** Cansado: só se arrasta devagar pela superfície (de baixo do chão, sai antes). */
export function rastejar(d: DevoraAlmas) { if (livre(d) && d.anim.modo !== 'atordoado') { mudar(d, 'rastejando'); d.anim.repete = 0 } }
/** A fase da luta (1 a 3, as barras de vida): as rachaduras se espalham e o que brilha acende mais. */
export function fase(d: DevoraAlmas, n: number) {
  const f = cl(Math.round(n), 1, 3)
  d.anim.fase = f
  d.rachas.forEach((r, i) => r.scale.setScalar(f >= i + 2 ? 1 : 1e-3))
  d.brilho?.color.setScalar(FASES.brilho[f - 1])
}
/** Arranca um tentáculo das costas (0 a 2): ele some. Devolve onde ele nascia (no mundo, para o estouro), ou null se já
 *  tinha sido arrancado. */
export function arrancar(d: DevoraAlmas, n: number): THREE.Vector3 | null {
  const tc = d.tentaculos.filter((t) => t.costas)[n]
  if (!tc || !d.anim.costas[n]) return null
  d.anim.costas[n] = false
  d.root.updateMatrixWorld(true)
  const onde = tc.ossos[0].getWorldPosition(new THREE.Vector3())
  tc.ossos[0].scale.setScalar(1e-3)
  return onde
}
/** Um golpe nele, vindo da direção `de` (rad, no espaço dele: 0 = da frente, +π/2 = do lado esquerdo dele). */
export function ferir(d: DevoraAlmas, de: number) {
  if (!livre(d)) return
  const B = d.anim.balanco
  B.vx -= Math.cos(de) * DANO.tranco; B.vz += Math.sin(de) * DANO.tranco
  d.anim.dano = { t: 0 }
}
/** A vida zerou: estoura (o corpo some; o respingo e a mancha ficam no chão, na altura `chao`). */
export function estourarDevora(d: DevoraAlmas, E: Estouro, chao = 0) {
  if (d.anim.estourado) return
  d.root.updateMatrixWorld(true)
  const c = d.corpo.localToWorld(new THREE.Vector3(0, 0, 0.1))
  estourar(E, c.setY(Math.max(c.y, chao + 0.3)), RESPINGO.estouro, chao, { cubos: 60, olhos: 0, tamanho: 2.5 * RESPINGO.cubos })
  d.anim.estourado = true; d.anim.dano = null; d.root.visible = false
}
/** Volta inteiro, fora do chão, com os tentáculos das costas de volta (o Ver modelos, depois de estourar). */
export function refazerDevora(d: DevoraAlmas) {
  const A = d.anim
  A.estourado = false; A.dano = null; A.y = ALTURA.solto; A.pitch = 0; A.repete = 0; mudar(d, 'solto')
  A.costas = [true, true, true]; d.tentaculos.filter((t) => t.costas).forEach((t) => t.ossos[0].scale.setScalar(1))
  A.medido.ultimo = null; A.medido.yaw = null; A.medido.vel = A.medido.giro = 0
  Object.assign(A.balanco, { x: 0, z: 0, vx: 0, vz: 0 }); d.molas.pos = null; d.root.visible = true
}

/** Quanto dura o modo de agora (s). */
function duracao(d: DevoraAlmas): number {
  const A = d.anim
  switch (A.modo) {
    case 'mira': return A.curta ? INVESTIDA.miraCurta : INVESTIDA.mira
    case 'investida': return INVESTIDA.dura
    case 'freia': return INVESTIDA.freia
    case 'chuva': return A.chuva
    case 'ninhada': return NINHADA.dura
    case 'atordoado': return ATORDOADO.dura
    case 'rastejando': return RASTEJO.dura
    default: return (TEMPO as Record<string, number>)[A.modo] ?? 1
  }
}

type Estilo = 'onda' | 'nado' | 'abre' | 'debate' | 'contorce' | 'mole' | 'puxa'
const _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _qm = new THREE.Quaternion(), _a = new THREE.Vector3(), _p = new THREE.Vector3(), _f = new THREE.Vector3()

/** Um quadro do Devora almas. */
export function animarDevora(d: DevoraAlmas, dt: number): SaidaDevora {
  dt = Math.min(dt, 0.05)
  const A = d.anim, saida: SaidaDevora = { y: A.y, avanca: 0, rompe: false, mordeu: false, cuspe: null, cria: null }
  if (A.estourado) return saida
  A.t += dt; A.tm += dt
  const t = A.t, F = A.feito
  // ---------- o que o root fez (quem o controla o move): a velocidade para a frente e o giro, para a curva no corpo ----------
  const M = A.medido
  d.root.getWorldPosition(_p); d.root.getWorldQuaternion(_qm)
  const yaw = Math.atan2(_f.set(0, 0, 1).applyQuaternion(_qm).x, _f.z)
  if (M.ultimo && M.yaw !== null && dt > 0) {
    let dy = yaw - M.yaw
    while (dy > PI) dy -= 2 * PI; while (dy < -PI) dy += 2 * PI
    const vx = (_p.x - M.ultimo.x) / dt, vz = (_p.z - M.ultimo.z) / dt
    if (Math.hypot(vx, vz) < 40) { M.vel = damp(M.vel, vx * Math.sin(yaw) + vz * Math.cos(yaw), 6, dt); M.giro = damp(M.giro, dy / dt, 6, dt) }
  }
  ;(M.ultimo ??= new THREE.Vector3()).copy(_p); M.yaw = yaw
  const giro = cl(M.giro, -1.2, 1.2), embalo = 0.35 + 0.65 * cl(M.vel / NADO.vel, 0, 1.3) // parado, quase não ondula
  let y = A.y, pitch = 0, roll = 0, ondula = 0, boca = 0, incha = 0, estilo: Estilo = 'onda', abre = 0, luz = 1 // luz: o brilho falhando (tonto)
  let costas: 'aponta' | 'deita' | null = null // os das costas fora do estilo: apontando para a frente (a mira) ou deitados (a investida)
  const dur = duracao(d), u = Math.min(1, A.tm / dur)
  const uma = (k: 'rompe' | 'mordeu' | 'cuspiu' | 'pousou', quando: boolean) => { if (quando && !F[k]) { F[k] = true; return true } return false }
  switch (A.modo) {
    case 'solto': // fora do chão: boia de leve, a boca entreaberta respirando
      y = ALTURA.solto + ALTURA.boia * Math.sin(t * 1.3); pitch = 0.05 * Math.sin(t * 0.8)
      boca = BOCA.respira * (0.5 + 0.5 * Math.sin(t * 1.7))
      break
    case 'nadando': // embaixo do chão: só os tentáculos das costas passam, cortando o chão; ondula e rema com os de trás
      y = ALTURA.nado + ALTURA.boiaNado * Math.sin(t * 3); ondula = NADO.ondula * embalo * Math.sin(t * NADO.freq); boca = 0.1; estilo = 'nado'
      break
    case 'mergulho': // de cabeça para dentro do chão
      y = lerp(A.y0, ALTURA.nado, suave(u)) - CHAO.arcoMergulho * Math.sin(PI * u); pitch = lerp(A.p0, 0, u) + 0.85 * Math.sin(PI * u)
      saida.avanca = CHAO.mergulho * Math.sin(PI * u); boca = 0.15; estilo = 'nado'
      saida.rompe = uma('rompe', u > 0.3)
      if (u >= 1) mudar(d, 'nadando')
      break
    case 'emergir': // de cabeça para fora do chão
      y = lerp(A.y0, ALTURA.solto, suave(u)) + CHAO.arcoEmergir * Math.sin(PI * u); pitch = -0.9 * Math.sin(PI * u)
      saida.avanca = CHAO.emergir * Math.sin(PI * u); boca = 0.3 * Math.sin(PI * u); estilo = 'nado'
      saida.rompe = uma('rompe', u > 0.15)
      if (u >= 1) mudar(d, 'solto')
      break
    case 'marca': { // afunda e fica em pé lá no fundo, a boca abrindo, os tentáculos abrindo devagar
      const k = suave(u * 1.6)
      y = lerp(A.y0, ALTURA.fundo, k); pitch = lerp(A.p0, -1.45, k); boca = BOCA.abre * u * 0.8; estilo = 'abre'; abre = 0.5 * u
      if (u >= 1) mudar(d, 'salto')
      break
    }
    case 'salto': { // sai de boca aberta, morde lá em cima e cai deitado
      const S = SALTO
      if (u < S.alto) y = ALTURA.fundo + (S.altura - ALTURA.fundo) * Math.sin((PI / 2) * (u / S.alto))
      else if (u < S.pousa) { const k = (u - S.alto) / (S.pousa - S.alto); y = S.altura - (S.altura - ALTURA.chao) * k * k }
      else y = ALTURA.chao + S.quique * Math.sin((PI * (u - S.pousa)) / (1 - S.pousa))
      pitch = u < 0.35 ? -1.45 : lerp(-1.45, 0, suave((u - 0.35) / 0.4))
      boca = u < 0.4 ? BOCA.abre : u < 0.47 ? lerp(BOCA.abre, 0, (u - 0.4) / 0.07) : 0
      estilo = u < S.alto ? 'abre' : 'onda'; abre = u < S.alto ? 1 : 0
      saida.rompe = uma('rompe', u > 0.1)
      saida.mordeu = uma('mordeu', u >= S.mordida)
      if (uma('pousou', u >= S.pousa)) A.balanco.vx += 2 // o tranco do pouso
      if (u >= 1) mudar(d, A.pegou ? 'engolindo' : 'exposto')
      break
    }
    case 'exposto': // errou: se debate no chão, a boca abrindo e fechando (a janela para atirar)
      y = ALTURA.chao; roll = 0.35 * Math.sin(t * 9) * (0.6 + 0.4 * Math.sin(t * 1.3)); ondula = 0.2 * Math.sin(t * 7 + 1)
      pitch = 0.08 * Math.sin(t * 11); boca = 0.5 + 0.5 * Math.sin(t * 8); estilo = 'debate'
      if (u >= 1) mudar(d, 'mergulho')
      break
    case 'engolindo': // pegou: mastiga deitado, a barriga mexendo, o corpo tremendo
      y = ALTURA.chao; boca = 0.06 + 0.05 * Math.max(0, Math.sin(t * 5)); incha = Math.sin(t * 6); roll = 0.06 * Math.sin(t * 13); estilo = 'contorce'
      if (u >= 1) mudar(d, 'cuspe')
      break
    case 'cuspe': // levanta a cabeça, abre a boca de vez e cospe
      y = ALTURA.chao; pitch = -0.3 * Math.sin(PI * Math.min(1, u / 0.4))
      boca = u < 0.25 ? lerp(0.06, BOCA.cospe, u / 0.25) : lerp(BOCA.cospe, 0, (u - 0.25) / 0.75); estilo = 'contorce'
      if (uma('cuspiu', u >= 0.25)) { d.root.updateMatrixWorld(true); saida.cuspe = d.mandibula.localToWorld(new THREE.Vector3(0, 0.05, 0.35)) }
      if (u >= 1) mudar(d, 'mergulho')
      break
    case 'mira': // para e aponta: os tentáculos das costas param de balançar e apontam para a frente (o aviso)
      y = ALTURA.nado; ondula = 0.03 * Math.sin(t * 4); boca = 0.1; estilo = 'nado'; costas = 'aponta'
      if (u >= 1) mudar(d, 'investida')
      break
    case 'investida': // dispara reto, subindo o bastante para as costas rasgarem o chão
      y = lerp(A.y0, ALTURA.nado + INVESTIDA.costas, suave(u * 5)); pitch = -0.04; ondula = 0.08 * Math.sin(t * 12); boca = 0.35
      saida.avanca = INVESTIDA.vel; estilo = 'nado'; costas = 'deita'
      saida.rompe = uma('rompe', u > 0.02)
      if (u >= 1) mudar(d, 'freia')
      break
    case 'freia': { // passou do ponto: perde a velocidade e afunda de novo (a janela para atirar nas costas)
      const k = 1 - u
      y = lerp(A.y0, ALTURA.nado, suave(u)); ondula = 0.06 * Math.sin(t * 6); boca = 0.25 * k
      saida.avanca = INVESTIDA.vel * k * k; estilo = 'nado'; costas = u < 0.5 ? 'deita' : null
      if (u >= 1) { if (A.repete > 0) { A.repete--; mudar(d, 'mira'); A.curta = true } else mudar(d, 'nadando') }
      break
    }
    case 'chuva': { // afunda e fica lá embaixo, se contorcendo, enquanto os tentáculos sobem; depois volta a nadar
      const volta = Math.max(0, A.tm - (dur - 0.6)) / 0.6
      y = A.tm < CHUVA.afunda ? lerp(A.y0, ALTURA.fundo, suave(A.tm / CHUVA.afunda)) : lerp(ALTURA.fundo, ALTURA.nado, suave(volta))
      boca = 0.2; estilo = 'contorce'
      if (u >= 1) mudar(d, 'nadando')
      break
    }
    case 'ninhada': { // sai meio corpo do chão, a cabeça para cima; a cada cuspe a cabeça vai para a frente e a boca abre de vez
      const N = NINHADA, sobe = suave(A.tm / N.sobe), desce = suave(Math.max(0, A.tm - (dur - 0.6)) / 0.6)
      y = lerp(lerp(A.y0, N.altura, sobe), ALTURA.nado, desce); pitch = lerp(lerp(A.p0, -N.ergue, sobe), 0, desce)
      boca = 0.45 * sobe * (1 - desce); estilo = 'contorce'
      for (let k = 0; k < A.ninhada; k++) { // o golpe de cada cuspe: a cabeça vai para a frente, a boca abre de vez
        const w = (A.tm - N.cospe[k] + 0.15) / 0.35
        if (w > 0 && w < 1) { const s = Math.sin(PI * w); pitch += 0.3 * s; boca = Math.max(boca, BOCA.cospe * s) }
      }
      saida.rompe = uma('rompe', u > 0.05)
      if (F.cria < A.ninhada && A.tm >= N.cospe[F.cria]) { // sai um: qual, de onde (a boca) e para que lado (para onde a cabeça aponta)
        const tipo = F.cria === N.asa ? 'asa' : 'assombrado'
        F.cria++
        d.root.updateMatrixWorld(true)
        const de = d.mandibula.localToWorld(new THREE.Vector3(0, 0.1, 0.45))
        saida.cria = { tipo, de, frente: d.corpo.localToWorld(_a.set(0, 0, 1)).sub(d.corpo.getWorldPosition(new THREE.Vector3())).normalize().clone() }
      }
      if (u >= 1) mudar(d, 'nadando')
      break
    }
    case 'atordoado': { // arrancado do chão, cai de lado, fica tonto (o brilho falhando), se desvira
      const T = ATORDOADO, tm = A.tm, fim = dur - T.desvira
      const deita = tm < 0.15 ? 0 : tm < fim ? Math.min(1, (tm - 0.15) / 0.45) : 1 - suave((tm - fim) / T.desvira)
      const quica = tm > 0.15 && tm < 0.9 ? 0.18 * Math.sin((PI * (tm - 0.15)) / 0.75) * (1 - (tm - 0.15) / 0.75) : 0 // passa um pouco e volta
      roll = (T.deita + quica) * suave(deita) + (tm < fim && tm > 0.6 ? 0.05 * Math.sin(t * 2) : 0)
      const chao = lerp(ALTURA.chao, ALTURA.chao * 0.82, suave(deita)) // de lado, o meio do corpo fica mais baixo
      y = tm < T.sai ? lerp(A.y0, chao, suave(tm / T.sai)) + 0.25 * ALTURA.chao * Math.sin((PI * tm) / T.sai) : chao
      pitch = 0.1 * suave(deita)
      boca = tm < fim ? 0.55 + 0.1 * Math.sin(t * 1.3) : 0.55 * (1 - (tm - fim) / T.desvira)
      estilo = tm < T.sai ? 'debate' : tm < fim ? 'mole' : 'contorce'
      if (tm > fim) ondula = 0.2 * Math.sin(t * 25) * (1 - (tm - fim) / T.desvira) // se sacode ao desvirar
      else if (tm > T.sai) luz = Math.sin(t * 17) + Math.sin(t * 29.3) > 0.6 ? 1 : 1 - T.apaga // o brilho falhando
      saida.rompe = uma('rompe', tm > 0.05 && A.y0 < -0.5)
      if (u >= 1) mudar(d, 'rastejando')
      break
    }
    case 'rastejando': { // se arrasta devagar pela superfície, puxando com os tentáculos, a cabeça baixa
      const R = RASTEJO, puxa = Math.max(0, Math.sin(2 * PI * R.puxadas * A.tm)), alvo = ALTURA.chao - R.arrasta
      y = lerp(A.y0, alvo, suave(A.tm / 0.6)) + 0.04 * ALTURA.chao * puxa
      saida.avanca = R.vel * (0.25 + 0.75 * puxa) * suave(A.tm / 0.6)
      pitch = 0.12 - 0.08 * puxa; roll = 0.08 * Math.sin(PI * R.puxadas * A.tm); ondula = 0.15 * Math.sin(PI * R.puxadas * A.tm + 1)
      boca = 0.3 + 0.2 * Math.sin(t * 3); estilo = 'puxa'
      saida.rompe = uma('rompe', A.tm > 0.05 && A.y0 < -0.5)
      if (u >= 1) mudar(d, 'mergulho')
      break
    }
  }
  // ---------- o dano por cima: a boca morde no ar ----------
  if (A.dano) {
    A.dano.t += dt
    boca += 0.4 * Math.sin(PI * Math.min(1, A.dano.t / DANO.dura))
    if (A.dano.t >= DANO.dura) A.dano = null
  }
  // ---------- o corpo: a inclinação do modo e a mola (o tranco do dano e do pouso) ----------
  const B = A.balanco
  B.vx += (BALANCO.mola * -B.x - BALANCO.amortece * B.vx) * dt; B.x = cl(B.x + B.vx * dt, -0.8, 0.8)
  B.vz += (BALANCO.mola * -B.z - BALANCO.amortece * B.vz) * dt; B.z = cl(B.z + B.vz * dt, -0.8, 0.8)
  A.y = y; A.pitch = pitch
  // na curva: o corpo deita para dentro e a cabeça vai na frente (os tentáculos ficam para trás: abaixo)
  d.corpo.rotation.set(pitch + B.x, ondula + giro * NADO.cabeca, roll + B.z - giro * NADO.deita)
  d.corpo.scale.set(1 + 0.06 * incha, 1 + 0.04 * incha, 1)
  d.mandibula.rotation.set(Math.max(0, boca), 0, 0)
  d.brilho?.color.setScalar(FASES.brilho[A.fase - 1] * luz) // o brilho da fase (falhando, se ele está tonto)

  // ---------- os tentáculos: cada osso vai suave para o ângulo do estilo ----------
  const T = TENTACULOS, puxada = 2 * PI * RASTEJO.puxadas * A.tm
  d.tentaculos.forEach((tc, i) => {
    tc.ossos.forEach((o, j) => {
      let f = 0, yy = 0
      if (tc.costas && costas === 'aponta') f = 0.9 * [1, 0.6, 0.4][j] // rígidos, apontando para a frente
      else if (tc.costas && costas === 'deita') f = -0.75 * [1, 0.5, 0.3][j] // deitados para trás, cortando o chão
      else if (estilo === 'mole') { f = (tc.costas ? -0.5 : -0.1) * [1, 0.6, 0.4][j] + 0.04 * Math.sin(t * 1.1 - j + i); yy = 0.05 * Math.sin(t * 0.9 - j + i * 2) } // tontos: caídos, quase parados
      else if (estilo === 'puxa') { // rastejando: os de trás varrem o chão no ritmo das puxadas; os das costas caídos
        if (tc.costas) { f = -0.4 + 0.08 * Math.sin(puxada - j); yy = 0.1 * Math.sin(t * 1.5 - j + i) }
        else { f = -0.3 + 0.45 * Math.sin(puxada - 0.8 * j + (i % 2) * 0.6); yy = 0.25 * Math.sin(puxada * 0.5 - 0.7 * j + i) }
      } else if (tc.costas) { // os das costas: em pé, balançam de lado e para a frente e para trás (nadando, cortam o chão)
        if (estilo === 'onda') { f = 0.12 * Math.sin(t * 1.3 - 0.8 * j + i); yy = 0.16 * Math.sin(t * 1.1 - 0.7 * j + i * 1.3) }
        else if (estilo === 'nado') { yy = T.nado * (j + 1) * 0.5 * Math.sin(t * 6 - 1.0 * j + i * 0.9); f = 0.12 * Math.sin(t * 5 - j + i) }
        else if (estilo === 'abre') { f = -0.25 * abre; yy = tc.lado * 0.5 * abre * [1, 0.4, 0.2][j] }
        else if (estilo === 'debate') { f = 0.45 * Math.sin(t * 10 - j + i * 1.9); yy = 0.35 * Math.sin(t * 8 - 0.8 * j + i) }
        else { f = 0.25 * Math.sin(t * 4.5 - 0.9 * j + i); yy = 0.2 * Math.sin(t * 3.5 - 0.7 * j + i) }
      } else if (estilo === 'onda') { f = T.onda * Math.sin(t * 1.6 - 0.9 * j + i) * (j + 1) * 0.6; yy = 0.1 * Math.sin(t * 1.2 - 0.8 * j + i * 0.7) }
      else if (estilo === 'nado') { yy = T.nado * (j + 1) * 0.55 * Math.sin(t * 7 - 1.1 * j); f = 0.05 * Math.sin(t * 5 - j + i) }
      else if (estilo === 'abre') { f = -T.abre * abre * [1, 0.35, -0.25][j] + 0.08 * Math.sin(t * 9 - j + i) }
      else if (estilo === 'debate') { f = T.debate * Math.sin(t * 11 - 1.0 * j + i * 1.7); yy = 0.4 * Math.sin(t * 9 - 0.8 * j + i) }
      else { f = T.contorce * Math.sin(t * 5 - 0.9 * j + i * 1.3); yy = 0.25 * Math.sin(t * 4 - 0.7 * j + i) }
      if (estilo === 'nado') yy *= embalo // nadando devagar, rema menos
      // na curva: os de trás ficam para trás (dobram ao contrário da curva, mais na ponta); os das costas abrem para fora
      yy += tc.costas ? giro * 0.15 : -giro * NADO.cauda * (j + 1)
      const a = tc.ang[j]
      a.f = damp(a.f, f, T.suave, dt); a.y = damp(a.y, yy, T.suave, dt)
      // a partir da pose do arquivo (a curva das costas; os de trás saem retos)
      o.quaternion.copy(tc.base[j]).multiply(_q.setFromAxisAngle(tc.a, a.f)).multiply(_q2.setFromAxisAngle(tc.b, a.y))
    })
  })

  animarMolas(d.molas, d.root, dt) // o manto, com o que o corpo fez
  saida.y = A.y
  return saida
}
