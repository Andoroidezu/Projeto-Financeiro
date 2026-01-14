import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { ToastProvider } from './ui/ToastProvider'
import { DebugProvider } from './debug/DebugProvider'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <DebugProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </DebugProvider>
  </StrictMode>
)
