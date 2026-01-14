import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App'
import { ToastProvider } from './ui/ToastProvider'
import { DebugProvider } from './debug/DebugProvider'

/*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧭 ENTRY POINT DO APP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

O que existe aqui:
- StrictMode (React)
- DebugProvider (debug interno)
- ToastProvider (notificações)
- BrowserRouter (necessário para logout / navegação futura)

⚠️ IMPORTANTE:
- Nada foi removido
- Apenas envolvemos o App com BrowserRouter
*/

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <DebugProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </DebugProvider>
    </BrowserRouter>
  </StrictMode>
)
