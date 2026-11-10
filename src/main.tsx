import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { prepararSom } from './audio/sintese'
import './styles.css'

prepararSom() // os efeitos ligam no primeiro clique ou tecla (o navegador exige)

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>)
