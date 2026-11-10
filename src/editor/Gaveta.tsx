// A gaveta de baixo do editor: o catálogo e as opções da ferramenta escolhida (texturas, tipos de porta e janela,
// objetos com miniatura). Só mostra e chama; o estado fica no MapEditor.
import { useEffect, useReducer, useState } from 'react'
import { GRUPOS, OBJETOS, type Grupo } from '../maps/objetos'
import { quandoCarregar } from '../render/bbmodel'
import { miniaturaDe } from '../render/miniaturas'
import { TIPOS, type TipoAbertura } from './FerramentaAberturas'
import { ICONES } from './Icones'
import { Paleta } from './Paleta'

export interface Pincel { parede: string; barra: string; h: number; comBarra: boolean }
const ALTURAS = [0.8, 1, 1.2, 1.5] // alturas comuns da barra de baixo (m)
const m = (v: number) => `${v.toFixed(1).replace('.', ',')} m`

export function GavetaPiso({ piso, setPiso, andar }: { piso: { chao: string; teto: string }; setPiso: (p: { chao: string; teto: string }) => void; andar: number }) {
  return <>
    <Paleta titulo="Chão" uso="piso" valor={piso.chao} onEscolher={(chao) => setPiso({ ...piso, chao })} />
    <Paleta titulo={andar === 0 ? 'Teto de baixo (o térreo não tem)' : 'Teto do andar de baixo'} uso="teto" valor={piso.teto} onEscolher={(teto) => setPiso({ ...piso, teto })} />
  </>
}

export function GavetaPincel({ pincel, setPincel }: { pincel: Pincel; setPincel: (p: Pincel) => void }) {
  return <>
    <Paleta titulo="Parede" uso="parede" valor={pincel.parede} onEscolher={(parede) => setPincel({ ...pincel, parede })} />
    <div className="bloco-g">
      <label className="marcar"><input type="checkbox" checked={pincel.comBarra} onChange={(e) => setPincel({ ...pincel, comBarra: e.target.checked })} /> Barra embaixo (lambri)</label>
      {pincel.comBarra && <div className="altura">
        <span>Altura da barra: <b>{m(pincel.h)}</b></span>
        <div className="opcoes">{ALTURAS.map((h) => <button key={h} aria-pressed={pincel.h === h} onClick={() => setPincel({ ...pincel, h })}>{m(h)}</button>)}</div>
        <input type="range" min={0.2} max={3} step={0.1} value={pincel.h} onChange={(e) => setPincel({ ...pincel, h: Number(e.target.value) })} aria-label="Altura da barra" />
      </div>}
    </div>
    {pincel.comBarra && <Paleta titulo="Barra" uso="lambri" valor={pincel.barra} onEscolher={(barra) => setPincel({ ...pincel, barra })} />}
  </>
}

export function GavetaAberturas({ tipo, setTipo, larguraVao, setLarguraVao }: { tipo: TipoAbertura; setTipo: (t: TipoAbertura) => void; larguraVao: number; setLarguraVao: (w: number) => void }) {
  return <>
    <div className="ladrilhos">
      {(Object.keys(TIPOS) as TipoAbertura[]).map((t) => (
        <button key={t} className="ladrilho" aria-pressed={tipo === t} onClick={() => setTipo(t)}>
          <span className="icone-l">{ICONES[t]}</span><span>{TIPOS[t].nome}</span>
        </button>
      ))}
    </div>
    {tipo === 'vao' && <div className="bloco-g"><span className="rotulo-b">Largura do vão</span>
      <div className="opcoes">{[1, 2, 3].map((w) => <button key={w} aria-pressed={larguraVao === w} onClick={() => setLarguraVao(w)}>{w} m</button>)}</div>
    </div>}
  </>
}

export function GavetaObjetos({ tipo, onEscolher }: { tipo: string | null; onEscolher: (t: string | null) => void }) {
  const [grupo, setGrupo] = useState<Grupo>(tipo ? OBJETOS[tipo]?.grupo ?? 'casa' : 'casa')
  // as fotos esperam as texturas dos modelos: quando elas chegam, a gaveta se desenha de novo
  const [, refaz] = useReducer((n: number) => n + 1, 0)
  useEffect(() => quandoCarregar(refaz), [])
  return (
    <div className="bloco-g">
      <div className="abas-b">{GRUPOS.map(([g, nome]) => <button key={g} aria-pressed={grupo === g} onClick={() => setGrupo(g)}>{nome}</button>)}</div>
      <div className="ladrilhos">
        {Object.entries(OBJETOS).filter(([, o]) => o.grupo === grupo).map(([k, o]) => (
          <button key={k} className="ladrilho" aria-pressed={tipo === k} title={o.nome} onClick={() => onEscolher(tipo === k ? null : k)}>
            {(() => { const foto = miniaturaDe(k); return foto ? <img src={foto} alt="" /> : <i className="sem-foto" /> })()}<span>{o.nome}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
