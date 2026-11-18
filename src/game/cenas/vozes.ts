// As vozes das cenas (docs/dublagem.md), PROVISÓRIAS: a voz do navegador lê cada fala na hora da legenda, para dar noção
// do ritmo até as gravações dos dubladores chegarem. Cada personagem tem a sua (a voz preferida, o tom e a velocidade).
// No Edge aparecem as vozes naturais (o Antonio, a Francisca, a Thalita); nos outros navegadores, as do sistema (no
// Windows, o Daniel e a Maria), mais robóticas; sem nenhuma voz em português, fica só a legenda.
// O volume é o Geral × Efeitos das configurações.
import { getSettings } from '../../settings/settings'

interface Perfil { vozes: string[]; tom: number; velocidade: number }

// as vozes, da preferida para a de reserva (um pedaço do nome basta); tom: 1 = o natural (menos = mais grave)
const HOMEM = ['Antonio', 'Daniel', 'Google português']
const MULHER = ['Francisca', 'Thalita', 'Maria', 'Google português']
const PERFIS: Record<string, Perfil> = {
  Victor: { vozes: HOMEM, tom: 0.55, velocidade: 0.88 }, // mais velho e grave, devagar
  Matheus: { vozes: HOMEM, tom: 1.15, velocidade: 1.04 }, // jovem, seco
  'A central': { vozes: MULHER, tom: 1, velocidade: 1.1 }, // urgente
}
const PADRAO: Perfil = { vozes: HOMEM, tom: 1, velocidade: 1 }

const disponivel = () => typeof window !== 'undefined' && 'speechSynthesis' in window
let lista: SpeechSynthesisVoice[] = []
function vozes() {
  if (!lista.length && disponivel()) lista = speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith('pt'))
  return lista
}
if (disponivel()) speechSynthesis.addEventListener?.('voiceschanged', () => { lista = [] })

/** A voz do navegador para um personagem (ou null: sem voz em português). */
export function vozDe(quem: string): SpeechSynthesisVoice | null {
  const l = vozes(), P = PERFIS[quem] ?? PADRAO
  const br = l.filter((v) => v.lang.toLowerCase() === 'pt-br')
  for (const nome of P.vozes) { const v = br.find((x) => x.name.includes(nome)) ?? l.find((x) => x.name.includes(nome)); if (v) return v }
  return br[0] ?? l[0] ?? null
}

/** Lê uma fala agora. velocidade = a da cena (o Ver cenas pode tocar a ½× ou 2×). */
export function falar(quem: string, texto: string, velocidade = 1) {
  if (!disponivel()) return
  const voz = vozDe(quem)
  if (!voz) return
  const P = PERFIS[quem] ?? PADRAO, c = getSettings(), u = new SpeechSynthesisUtterance(texto.replace(/["“”]/g, ''))
  u.voice = voz; u.lang = voz.lang; u.pitch = P.tom; u.rate = Math.max(0.5, Math.min(2, P.velocidade * velocidade))
  u.volume = (c.volume / 100) * (c.efeitos / 100)
  speechSynthesis.speak(u)
}

/** Cala o que estava sendo lido (pausar, pular, sair da cena). */
export function calarVozes() { if (disponivel()) speechSynthesis.cancel() }

/** Para o Ver cenas: qual voz cada personagem está usando agora. */
export function vozesEmUso(quem: string[]): string[] { return quem.map((q) => `${q}: ${vozDe(q)?.name ?? 'sem voz (só a legenda)'}`) }
