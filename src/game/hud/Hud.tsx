// O HUD (o conceito C, docs/jogo.md; do laboratório: reference/lab/06-hud.js, dh-vg, dh-kb, dh-wg):
//   embaixo à esquerda, o anel da vida (em %, a linha do ECG e o estado: bem, cuidado, perigo) com o fôlego por dentro,
//   e o selo dos kits (zerado, o anel do tempo até o próximo); embaixo à direita, o mostrador da arma (a silhueta, o
//   anel do calor da pistola ou as 4 balas da escopeta, a outra arma em cima: a do Q) e o nome;
//   em cima, as barras de vida do chefe (quando tem).
// Leve: o desenho é feito uma vez; a cada quadro o jogo chama atualizar() e só muda no documento o que mudou.
// Fica para depois: as legendas (quando houver falas), a roda de armas (Tab) e os avisos de controle.
import { useEffect, useRef, type MutableRefObject } from 'react'
import { ARMAS, proximaArma, type Arma } from '../player/arma'
import { KITS } from '../player/numeros'
import type { EstadoArmadilha } from '../weapons/armadilha'
import { MUNICAO } from '../weapons/numeros'
import './hud.css'

/** O que o jogo conta ao HUD a cada quadro (um objeto só, reaproveitado). */
export interface EstadoHud {
  vida: number // 0..1
  folego: number; folegoTravado: boolean // 0..1
  kits: number; novoKit: number // s até o próximo kit (com 0)
  arma: Arma | null
  calor: number; travada: number // a pistola: 0..1 e s que ainda fica travada
  balas: number; recarregando: boolean // a escopeta
  armadilha: EstadoArmadilha
}
export const novoEstadoHud = (): EstadoHud => ({ vida: 1, folego: 1, folegoTravado: false, kits: 0, novoKit: 0, arma: null, calor: 0, travada: 0, balas: 0, recarregando: false, armadilha: 'mao' })

/** O chefe em cima: o nome e cada barra de vida (0..1, da esquerda; a da direita esvazia primeiro). */
export interface ChefeHud { nome: string; barras: number[] }

// as silhuetas (as do conceito C): a cor de dentro vem de --cut
const SILHUETA: Record<Arma | 'kit', string> = {
  pistola: '<path d="M6 21 H47 L52 24 V30 H6 Z"/><path d="M10 30 H30 L28 35 H23 L20 52 H9 L12 35 Z"/><path d="M23 35 Q23 41 29 41 L31 35" fill="none" stroke-width="2.6"/><circle cx="56.5" cy="27" r="5" fill="none" stroke-width="2.6"/><path d="M14 25 H38 M14 27.5 H30" style="stroke:var(--cut)" stroke-width="1.2"/>',
  escopeta: '<path d="M2 37 L15 30 H21 V40 H14 L5 47 Z"/><path d="M20 28 H31 V40 H20 Z"/><rect x="31" y="27" width="31" height="4"/><rect x="31" y="32" width="31" height="4"/><path d="M35 36 H50 V40 H35 Z"/><path d="M24 40 Q24 45 29 45" fill="none" stroke-width="2.4"/><path d="M22 31 H29 M22 34 H27" style="stroke:var(--cut)" stroke-width="1.2"/>',
  armadilha: '<rect x="26" y="9" width="12" height="7" rx="1.5"/><circle cx="32" cy="37" r="19"/><circle cx="32" cy="37" r="12" fill="none" style="stroke:var(--cut)" stroke-width="2.2"/><path d="M32 27 V47 M22 37 H42" style="stroke:var(--cut)" stroke-width="2.2"/><path d="M32 18 V22 M32 52 V56 M13 37 H17 M47 37 H51" style="stroke:var(--cut)" stroke-width="1.6"/>',
  kit: '<rect x="12" y="19" width="40" height="31" rx="4"/><path d="M25 19 V13 H39 V19" fill="none" stroke-width="2.6"/><path d="M32 26 V43 M23.5 34.5 H40.5" style="stroke:var(--cut)" stroke-width="5"/>',
}
const svg = (k: Arma | 'kit') => `<svg viewBox="0 0 64 64" fill="currentColor" stroke="currentColor" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true">${SILHUETA[k]}</svg>`
const NOME: Record<Arma, string> = Object.fromEntries(ARMAS) as Record<Arma, string>
const ARMADILHA: Record<EstadoArmadilha, string> = { mao: 'pronta', voando: 'no ar', presa: 'no chão', voltando: 'voltando' }

// os anéis: 3/4 de volta (começa embaixo à esquerda)
const C_VIDA = 2 * Math.PI * 84, C_FOLEGO = 2 * Math.PI * 69, C_ARMA = 2 * Math.PI * 86, C_KIT = 2 * Math.PI * 36
const arco = (C: number, f: number) => `${C * 0.75 * f} ${C}`
const BALAS = MUNICAO.escopeta.balas, VAO = 10 // a escopeta: o anel em 4 pedaços
const pedaco = (C_ARMA * 0.75 - VAO * (BALAS - 1)) / BALAS
/** os n primeiros pedaços cheios (o resto vazio) */
const pedacos = (n: number) => (n <= 0 ? `0 ${C_ARMA}` : Array.from({ length: n }, (_, i) => (i < n - 1 ? `${pedaco} ${VAO}` : `${pedaco} ${C_ARMA}`)).join(' '))

const DESENHO = `
<div class="hud-vida"><svg viewBox="0 0 200 200" aria-hidden="true"><circle class="bk" cx="100" cy="100" r="97"/><circle class="tr" cx="100" cy="100" r="84" style="stroke-dasharray:${arco(C_VIDA, 1)}"/><circle class="fl" cx="100" cy="100" r="84"/><circle class="str" cx="100" cy="100" r="69" style="stroke-dasharray:${arco(C_FOLEGO, 1)}"/><circle class="sfl" cx="100" cy="100" r="69"/><polyline class="ecg" points="50,112 72,112 80,94 90,134 100,98 108,112 150,112"/></svg><b></b><span></span></div>
<div class="hud-kit"><div class="selo"><svg class="rg" viewBox="0 0 80 80" aria-hidden="true"><circle class="fl" cx="40" cy="40" r="36"/></svg>${svg('kit')}</div><b></b><span></span></div>
<div class="hud-arma"><svg viewBox="0 0 200 200" aria-hidden="true"><circle class="bk" cx="100" cy="100" r="97"/><circle class="tr" cx="100" cy="100" r="86"/><circle class="fl" cx="100" cy="100" r="86"/><circle class="in" cx="100" cy="100" r="68"/></svg><div class="ic"></div><em></em>
  <div class="sat s1"><div class="ic"></div><i>Q</i></div></div>
<div class="hud-nome"></div>`

/** O HUD por cima da cena. `painel` recebe a função que o jogo chama a cada quadro. */
export function Hud({ painel }: { painel: MutableRefObject<((e: EstadoHud) => void) | null> }) {
  const raiz = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const r = raiz.current!
    r.innerHTML = DESENHO
    const q = <T extends Element = HTMLElement>(s: string) => r.querySelector(s) as T
    const el = {
      vida: q('.hud-vida'), vfl: q<SVGElement>('.hud-vida .fl'), vsf: q<SVGElement>('.hud-vida .sfl'), vst: q<SVGElement>('.hud-vida .str'), vb: q('.hud-vida b'), vs: q('.hud-vida span'),
      kit: q('.hud-kit'), kb: q('.hud-kit b'), ks: q('.hud-kit span'), kfl: q<SVGElement>('.hud-kit .rg .fl'),
      arma: q('.hud-arma'), atr: q<SVGElement>('.hud-arma .tr'), afl: q<SVGElement>('.hud-arma .fl'), aic: q('.hud-arma > .ic'), aem: q('.hud-arma > em'),
      sats: [q('.hud-arma .s1 .ic')], nome: q('.hud-nome'),
    }
    const visto: Record<string, unknown> = {} // só mexe no documento quando muda
    const muda = <T,>(k: string, v: T, f: (v: T) => void) => { if (visto[k] !== v) { visto[k] = v; f(v) } }
    painel.current = (e) => {
      // a vida: o anel, o número e o estado
      const f = Math.max(0, Math.min(1, e.vida)), st = f > 0.6 ? 0 : f > 0.3 ? 1 : 2
      muda('vf', Math.round(f * 500), () => { el.vfl.style.strokeDasharray = arco(C_VIDA, f); el.vfl.style.opacity = f < 0.003 ? '0' : '1' })
      muda('vp', Math.ceil(f * 100), (v) => (el.vb.textContent = v + '%'))
      muda('vs', st, (v) => { el.vs.textContent = ['bem', 'cuidado', 'perigo'][v]; el.vida.classList.toggle('cuidado', v === 1); el.vida.classList.toggle('perigo', v === 2) })
      // o fôlego: só aparece quando não está cheio
      const sf = Math.max(0, Math.min(1, e.folego))
      muda('sf', Math.round(sf * 200), () => { el.vsf.style.strokeDasharray = arco(C_FOLEGO, sf); el.vsf.style.opacity = el.vst.style.opacity = sf > 0.995 && !e.folegoTravado ? '0' : '1' })
      muda('st', e.folegoTravado, (v) => el.vida.classList.toggle('travado', v))
      // os kits: quantos; zerado, o anel do próximo
      const nenhum = e.kits <= 0
      muda('kn', nenhum, (v) => el.kit.classList.toggle('nenhum', v))
      muda('kc', e.kits, (v) => (el.kb.textContent = '×' + v))
      const falta = Math.max(0, Math.ceil(e.novoKit))
      muda('ks', nenhum ? `novo em ${Math.floor(falta / 60)}:${String(falta % 60).padStart(2, '0')}` : 'F · curar', (v) => (el.ks.textContent = v))
      muda('kr', nenhum ? Math.round((1 - e.novoKit / KITS.novo) * 200) : -1, (v) => (el.kfl.style.strokeDasharray = v < 0 ? `0 ${C_KIT}` : `${(C_KIT * v) / 200} ${C_KIT}`))
      // a arma: a silhueta, as outras em volta (a de cima é a próxima do Q), o anel, a linha e o nome
      muda('ak', e.arma, (a) => {
        el.aic.innerHTML = a ? svg(a) : ''
        el.arma.classList.toggle('vazia', !a)
        el.sats[0].innerHTML = svg(proximaArma(a)) // a do Q (só a outra arma de tiro)
        el.atr.style.strokeDasharray = a === 'escopeta' ? pedacos(BALAS) : a === 'pistola' ? arco(C_ARMA, 1) : `0 ${C_ARMA}`
      })
      let anel = '', linha = '', sub = '', quente = false, morno = false
      if (e.arma === 'pistola') {
        quente = e.travada > 0; morno = !quente && e.calor >= 0.7
        anel = arco(C_ARMA, e.calor); linha = quente ? `trava ${Math.ceil(e.travada)} s` : `${Math.round(e.calor * 100)}%`; sub = quente ? 'superaquecida' : 'sobrecarga'
      } else if (e.arma === 'escopeta') {
        anel = pedacos(e.balas); linha = e.recarregando ? 'recarregando' : `${e.balas} / ${BALAS}`
        sub = e.recarregando ? 'clique: atirar já' : e.balas < BALAS ? 'R · recarregar' : 'balas'; morno = e.recarregando
      } else if (e.arma === 'armadilha') {
        anel = e.armadilha === 'mao' ? arco(C_ARMA, 1) : `0 ${C_ARMA}`; linha = ARMADILHA[e.armadilha]
        sub = e.armadilha === 'presa' ? 'clique: chamar de volta' : e.armadilha === 'mao' ? 'mire para ver o arco' : ''
      } else { anel = `0 ${C_ARMA}`; linha = 'mão livre'; sub = 'Q · pegar a pistola' }
      muda('ar', anel, (v) => (el.afl.style.strokeDasharray = v))
      el.arma.classList.toggle('quente', quente && Math.sin(performance.now() / 70) > -0.3) // pisca travada
      muda('am', morno, (v) => el.arma.classList.toggle('morno', v))
      muda('al', linha, (v) => (el.aem.textContent = v))
      muda('an', `${e.arma}|${sub}|${quente}`, () => {
        el.nome.textContent = e.arma ? NOME[e.arma] : ''
        const s = document.createElement('small'); s.textContent = sub; if (quente) s.className = 'quente'; el.nome.append(s)
      })
    }
    return () => { painel.current = null }
  }, [painel])
  return <div className="hud" ref={raiz} />
}

/** As barras do chefe, em cima (o React refaz só quando o roteiro conta que a vida dele mudou). A barra que está
 *  sendo gasta (a última com vida) ganha o contorno. */
export function BarrasDoChefe({ chefe }: { chefe: ChefeHud }) {
  return (
    <div className="hud-chefe">
      <b>{chefe.nome}</b>
      <div className="barras">{chefe.barras.map((f, i) => <div key={i} className={f > 0 && !(chefe.barras[i + 1] > 0) ? 'barra atual' : 'barra'}><i style={{ transform: `scaleX(${f})` }} /></div>)}</div>
    </div>
  )
}
