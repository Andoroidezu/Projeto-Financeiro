import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import Sidebar from './Sidebar'

export default function Layout({
  children,
  page,
  setPage,
  currentMonth,
  setCurrentMonth,
}) {
  const [animate, setAnimate] = useState(false)

  useEffect(() => {
    setAnimate(false)
    const t = setTimeout(() => setAnimate(true), 10)
    return () => clearTimeout(t)
  }, [page])

  async function handleLogout() {
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error('Erro ao deslogar:', error)
    }
    // ⚠️ NÃO muda page
    // ⚠️ NÃO navega
    // App.jsx cuidará do resto
  }

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar
        page={page}
        setPage={setPage}
        onLogout={handleLogout}
      />

      <main
        style={{
          flex: 1,
          minHeight: '100vh',
          background: 'var(--bg)',
        }}
      >
        {/* TOP BAR */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <input
            type="month"
            value={currentMonth}
            onChange={e =>
              setCurrentMonth(e.target.value)
            }
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: 6,
              padding: '6px 10px',
              color: 'var(--text)',
              fontSize: 13,
            }}
          />
        </div>

        {/* CONTEÚDO COM ANIMAÇÃO */}
        <div
          key={page}
          style={{
            padding: 24,
            opacity: animate ? 1 : 0,
            transform: animate
              ? 'translateY(0)'
              : 'translateY(6px)',
            transition:
              'opacity 140ms ease, transform 140ms ease',
          }}
        >
          {children}
        </div>
      </main>
    </div>
  )
}
