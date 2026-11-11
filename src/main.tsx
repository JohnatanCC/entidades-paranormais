import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { prepararSom } from './audio/sintese'
import './styles.css'

prepararSom() // os efeitos ligam no primeiro clique ou tecla (o navegador exige)
// as provas (conferir animações e sons pelo console): só no npm run dev
if (import.meta.env.DEV) void import('./dev/provas').then(({ provas }) => { (window as unknown as { provas: typeof provas }).provas = provas })

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>)
