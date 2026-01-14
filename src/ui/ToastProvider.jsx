import { createContext, useContext, useState } from 'react'
import Toast from './Toast'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  function showToast(message, type = 'info') {
    const id = Date.now()

    setToasts(prev => [...prev, { id, message, type }])

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 4000)
  }

  function removeToast(id) {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* CONTAINER */}
      <div
        style={{
          position: 'fixed',
          top: 16,
          right: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          zIndex: 9999,
        }}
      >
        {toasts.map(t => (
          <Toast
            key={t.id}
            message={t.message}
            type={t.type}
            onClose={() => removeToast(t.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error(
      'useToast must be used inside ToastProvider'
    )
  }
  return context
}
