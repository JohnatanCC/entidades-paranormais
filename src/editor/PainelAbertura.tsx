// As propriedades da porta ou janela escolhida: o estado inicial da porta (aberta, fechada, trancada), para que lado ela
// abre, o motivo e a chave da trancada; na janela, o luar 2D e o lado de dentro. Os textos entram no histórico quando
// você sai do campo (ou aperta Enter), não a cada letra.
import { useEffect, useState } from 'react'
import type { DoorState, Opening } from '../maps/types'

interface Props { o: Opening; onMudar: (patch: Partial<Opening>) => void; onApagar: () => void }

const ESTADOS: [DoorState, string][] = [['fechada', 'Fechada'], ['aberta', 'Aberta'], ['trancada', 'Trancada']]

export function PainelAbertura({ o, onMudar, onApagar }: Props) {
  const lado = o.lado ?? 'b', outro = lado === 'a' ? 'b' : 'a'
  return (
    <div className="propriedades sem-borda">
      <div className="nota">{o.id} · {o.width} m</div>
      {o.kind === 'porta' && o.door !== 'vao' && <>
        <span className="rotulo">Começa</span>
        <div className="opcoes">
          {ESTADOS.map(([v, n]) => <button key={v} aria-pressed={(o.estado ?? 'fechada') === v} onClick={() => onMudar({ estado: v })}>{n}</button>)}
        </div>
        <button onClick={() => onMudar({ lado: outro })}>Abrir para o outro lado</button>
        {o.estado === 'trancada' && <>
          <Campo rotulo="Motivo (a linha ao tentar abrir)" valor={o.motivo ?? ''} exemplo="Trancada por dentro" onMudar={(motivo) => onMudar({ motivo: motivo || undefined })} />
          <Campo rotulo="Chave que abre" valor={o.chave ?? ''} exemplo="chave-bercario" onMudar={(chave) => onMudar({ chave: chave || undefined })} />
          <div className="nota">Sem chave, só um script abre (por exemplo, depois de uma luta).</div>
        </>}
      </>}
      {o.kind === 'janela' && <>
        <span className="rotulo">Luar 2D (feixe e mancha)</span>
        <div className="opcoes">
          <button aria-pressed={o.light2d !== false} onClick={() => onMudar({ light2d: true })}>Ligado</button>
          <button aria-pressed={o.light2d === false} onClick={() => onMudar({ light2d: false })}>Desligado</button>
        </div>
        <button onClick={() => onMudar({ lado: outro })}>Trocar o lado de dentro</button>
      </>}
      <button className="perigo" onClick={onApagar}>Apagar <kbd>Del</kbd></button>
    </div>
  )
}

function Campo({ rotulo, valor, exemplo, onMudar }: { rotulo: string; valor: string; exemplo: string; onMudar: (v: string) => void }) {
  const [texto, setTexto] = useState(valor)
  useEffect(() => setTexto(valor), [valor]) // desfazer ou escolher outra porta traz o valor de lá
  const fim = () => { if (texto.trim() !== valor) onMudar(texto.trim()) }
  return (
    <label className="campo">
      <span className="rotulo">{rotulo}</span>
      <input value={texto} placeholder={exemplo} onChange={(e) => setTexto(e.target.value)} onBlur={fim}
        onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); if (e.key === 'Escape') setTexto(valor) }} />
    </label>
  )
}
