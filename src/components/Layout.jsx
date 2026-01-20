import { useEffect, useRef, useState } from 'react'
import { supabase } from '../supabase'
import Sidebar from './Sidebar'
import Button from '../ui/Button'

export default function Layout({
  children,
  page,
  setPage,
  currentMonth,
  setCurrentMonth,
}) {
  const [animate, setAnimate] = useState(false)
  const monthInputRef = useRef(null)

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
  }

  function formatMonthLabel(value) {
    const [year, month] = value.split('-').map(Number)
    const date = new Date(year, month - 1, 1)

    return date.toLocaleDateString('pt-BR', {
      month: 'long',
      year: 'numeric',
    })
  }

  function changeMonth(offset) {
    const [year, month] = currentMonth.split('-').map(Number)
    const d = new Date(year, month - 1 + offset, 1)

    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    setCurrentMonth(`${y}-${m}`)
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
        {/* TOP BAR — STICKY */}
        <div
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 20,
            background: 'var(--bg)',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <div
            style={{
              padding: '8px 24px', // 🔽 mais slim
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            {/* CONTROLE DE MÊS */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Button
                variant="ghost"
                onClick={() => changeMonth(-1)}
              >
                ◀
              </Button>

              <strong
                style={{
                  minWidth: 140,
                  textAlign: 'center',
                  textTransform: 'capitalize',
                  fontSize: 14,
                }}
              >
                {formatMonthLabel(currentMonth)}
              </strong>

              <Button
                variant="ghost"
                onClick={() => changeMonth(1)}
              >
                ▶
              </Button>

              {/* BOTÃO CALENDÁRIO */}
              <Button
                variant="ghost"
                onClick={() =>
                  monthInputRef.current?.showPicker()
                }
                title="Selecionar mês"
              >
                📅
              </Button>

              {/* INPUT INVISÍVEL */}
              <input
                ref={monthInputRef}
                type="month"
                value={currentMonth}
                onChange={e =>
                  setCurrentMonth(e.target.value)
                }
                style={{
                  position: 'absolute',
                  opacity: 0,
                  pointerEvents: 'none',
                }}
              />
            </div>
          </div>
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
