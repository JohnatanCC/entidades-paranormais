// Os ícones do editor (SVG de traço, 24 × 24, na cor do texto). Desenhados à mão, retos, para combinar com o latão
// do HUD: nada de ícone de biblioteca.
import type { ReactNode } from 'react'

const I = ({ children, t = 24 }: { children: ReactNode; t?: number }) => (
  <svg width={t} height={t} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="square" strokeLinejoin="miter" aria-hidden>{children}</svg>
)

export const ICONES = {
  paredes: <I><rect x="3" y="5" width="18" height="14" /><path d="M3 9.7h18M3 14.3h18M9 5v4.7M15 5v4.7M6 9.7v4.6M12 9.7v4.6M18 9.7v4.6M9 14.3V19M15 14.3V19" /></I>,
  apagar: <I><rect x="3" y="7" width="12" height="12" /><path d="M3 11h12M3 15h12M9 7v4M7 11v4M11 11v4" /><path d="M15.5 4.5l5 5M20.5 4.5l-5 5" /></I>,
  piso: <I><path d="M2 15l10-5 10 5-10 5z" /><path d="M7 12.5l10 5M17 12.5l-10 5" /></I>,
  pincel: <I><rect x="4" y="3" width="13" height="5" /><path d="M17 5.5h3v5h-8v3" /><rect x="10.5" y="13.5" width="3" height="7" /></I>,
  aberturas: <I><path d="M5 21V3h14v18" /><path d="M3 21h18" /><path d="M8 6h8v15" /><path d="M14 13.5h.01" strokeWidth={2.4} /></I>,
  escadas: <I><path d="M3 20h4v-4h4v-4h4V8h4V4h2" /><path d="M3 20h18" /></I>,
  objetos: <I><path d="M5 11V7a2 2 0 012-2h10a2 2 0 012 2v4" /><path d="M3 11h4v4h10v-4h4v6H3z" /><path d="M5 17v3M19 17v3" /></I>,
  contagotas: <I><path d="M14.5 4.5l5 5" /><path d="M16.5 3.5l4 4-2 2-4-4z" /><path d="M15 9l-9 9-2 .5.5-2 9-9" /></I>,
  desfazer: <I><path d="M8 5L4 9l4 4" /><path d="M4 9h10a6 6 0 010 12H9" /></I>,
  refazer: <I><path d="M16 5l4 4-4 4" /><path d="M20 9H10a6 6 0 000 12h5" /></I>,
  salvar: <I><path d="M4 4h13l3 3v13H4z" /><path d="M8 4v5h8V4M7 20v-6h10v6" /></I>,
  mapas: <I><path d="M3 6h7l2 2h9v12H3z" /><path d="M3 10h18" /></I>,
  filtro: <I><rect x="3" y="5" width="18" height="13" /><path d="M8 21h8M12 18v3" /><path d="M6 9h1M6 12h1M17 9h1M17 12h1M10 9h1M13 12h1" /></I>,
  sair: <I><path d="M14 4H5v16h9" /><path d="M10 12h11M17 8l4 4-4 4" /></I>,
  altas: <I><rect x="5" y="3" width="14" height="18" /><path d="M5 8h14M5 13h14M5 18h14" /></I>,
  recortadas: <I><path d="M5 21V10l14-6v17z" /><path d="M5 14h14M5 18h14" /></I>,
  baixas: <I><rect x="5" y="15" width="14" height="6" /><path d="M5 18h14" /><path d="M5 9h14" strokeDasharray="2 2" /></I>,
  subir: <I t={16}><path d="M5 15l7-7 7 7" /></I>,
  descer: <I t={16}><path d="M5 9l7 7 7-7" /></I>,
  mais: <I t={16}><path d="M12 5v14M5 12h14" /></I>,
  menos: <I t={16}><path d="M5 12h14" /></I>,
  fechar: <I t={16}><path d="M6 6l12 12M18 6L6 18" /></I>,
  ajuda: <I t={16}><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.5 2.5 0 015 0c0 2-2.5 2-2.5 4M12 17h.01" /></I>,
  // os tipos de porta e janela
  comum: <I><path d="M6 21V3h12v18" /><path d="M3 21h18M15 12h.01" strokeWidth={2} /></I>,
  dupla: <I><path d="M3 21V4h18v17M12 4v17" /><path d="M10 12h.01M14 12h.01" strokeWidth={2} /></I>,
  grande: <I><path d="M3 21V2h18v19M12 2v19" /><path d="M1 21h22M10 13h.01M14 13h.01" strokeWidth={2} /></I>,
  vao: <I><path d="M6 21V4h12v17" strokeDasharray="0" /><path d="M3 21h18" /><path d="M9 7h6" strokeDasharray="2 2" /></I>,
  janela: <I><rect x="6" y="5" width="12" height="13" /><path d="M12 5v13M6 11.5h12M4 18h16" /></I>,
  'janela-grande': <I><rect x="2" y="5" width="20" height="13" /><path d="M7 5v13M12 5v13M17 5v13M2 11.5h20M1 18h22" /></I>,
} satisfies Record<string, ReactNode>
