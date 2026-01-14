import { createContext, useContext, useState } from 'react'

/*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧭 GUIA DE CONTEXTO — DEBUG MODE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Este provider controla:
- Modo debug (on/off)
- Logs de erro internos do app

Uso:
- Somente contas ADM devem ativar
- Nunca usar para lógica de negócio
- Apenas observabilidade

Se você estiver lendo isso no futuro:
👉 Debug NÃO é feature de usuário
👉 Debug é ferramenta de desenvolvimento
*/

const DebugContext = createContext(null)

export function DebugProvider({ children }) {
  const [enabled, setEnabled] = useState(false)
  const [logs, setLogs] = useState([])

  function log(message, data = null) {
    if (!enabled) return

    setLogs(prev => [
      {
        id: Date.now(),
        message,
        data,
        date: new Date().toISOString(),
      },
      ...prev,
    ])
  }

  function clear() {
    setLogs([])
  }

  return (
    <DebugContext.Provider
      value={{
        enabled,
        setEnabled,
        log,
        logs,
        clear,
      }}
    >
      {children}
    </DebugContext.Provider>
  )
}

export function useDebug() {
  return useContext(DebugContext)
}
