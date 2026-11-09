// A paleta de texturas do painel: as amostras do catálogo de um uso (parede, barra, piso, teto), a escolhida marcada.
import { TEXTURAS, texturasPara, type Uso } from '../maps/textures'
import { amostraDe } from '../render/materiais'

interface Props { titulo: string; uso: Uso; valor: string; onEscolher: (nome: string) => void }

export function Paleta({ titulo, uso, valor, onEscolher }: Props) {
  return (
    <div className="paleta">
      <div className="paleta-topo"><span>{titulo}</span><b>{TEXTURAS[valor]?.nome ?? valor}</b></div>
      <div className="amostras">
        {texturasPara(uso).map((k) => (
          <button key={k} title={TEXTURAS[k].nome} aria-pressed={valor === k} onClick={() => onEscolher(k)}
            style={{ backgroundImage: `url(${amostraDe(k)})` }} />
        ))}
      </div>
    </div>
  )
}
