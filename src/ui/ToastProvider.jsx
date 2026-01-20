import { createContext, useContext, useState } from 'react'

const ToastContext = createContext()

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  function showToast(input, variant = 'info') {
    const toast =
      typeof input === 'string'
        ? {
            id: Date.now(),
            message: input,
            variant,
            actions: [],
          }
        : {
            id: Date.now(),
            message: input.message,
            variant: input.variant || 'info',
            actions: input.actions || [],
          }

    setToasts(prev => [...prev, toast])

    setTimeout(() => {
      setToasts(prev =>
        prev.filter(t => t.id !== toast.id)
      )
    }, 6000)
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      <div
        style={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          zIndex: 999,
        }}
      >
        {toasts.map(t => (
          <div
            key={t.id}
            style={{
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: 12,
              minWidth: 260,
            }}
          >
            <div
              style={{
                fontWeight: 600,
                marginBottom: t.actions.length ? 8 : 0,
              }}
            >
              {t.message}
            </div>

            {t.actions.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  flexWrap: 'wrap',
                }}
              >
                {t.actions.map((a, i) => (
                  <button
                    key={i}
                    onClick={a.onClick}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      fontSize: 13,
                      color: 'var(--primary)',
                      cursor: 'pointer',
                    }}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
