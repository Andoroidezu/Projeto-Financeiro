import Button from '../ui/Button'

/*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧭 GUIA DE CONTEXTO — SIDEBAR (HOVER & UX)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Objetivo deste arquivo:
- Navegação fixa e silenciosa
- Feedback visual sutil (hover / ativo)
- Zero cor primária (roxo) na navegação

Princípios adotados:
- Hover não deve "chamar atenção"
- Animações rápidas (120–160ms)
- Movimento mínimo (1–2px no máximo)
- Item ativo destacado sem gritar

Se parecer "simples demais":
👉 isso é proposital
👉 simplicidade = produto premium

Se quiser ajustar sensação:
- mexer APENAS nos tempos de transition
- NÃO adicionar cores fortes
*/

export default function Sidebar({
  page,
  setPage,
  onLogout, // 👈 NOVO (sem impacto visual)
}) {
  const primary = [
    { id: 'home', label: 'Visão geral' },
    { id: 'transactions', label: 'Lançamentos' },
    { id: 'cards', label: 'Cartões' },
    { id: 'invoice', label: 'Faturas' },
    { id: 'report', label: 'Relatórios' },
  ]

  const secondary = [
    { id: 'commitments', label: 'Recorrentes' },
    { id: 'sporadic', label: 'Lançamento único' },
    { id: 'card-expense', label: 'Compra parcelada' },
  ]

  return (
    <aside
      style={{
        width: 200,
        minHeight: '100vh',
        background: 'var(--bg-elevated)',
        borderRight: '1px solid var(--border)',
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
      }}
    >
      {/* BRAND */}
      <div>
        <strong style={{ fontSize: 14 }}>
          Finance App
        </strong>
        <div
          style={{
            fontSize: 12,
            color: 'var(--text-muted)',
          }}
        >
          Controle financeiro
        </div>
      </div>

      {/* PRIMARY */}
      <nav
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        {primary.map(item => (
          <NavItem
            key={item.id}
            active={page === item.id}
            onClick={() => setPage(item.id)}
          >
            {item.label}
          </NavItem>
        ))}
      </nav>

      <Divider />

      {/* SECONDARY */}
      <nav
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        {secondary.map(item => (
          <NavItem
            key={item.id}
            active={page === item.id}
            onClick={() => setPage(item.id)}
          >
            {item.label}
          </NavItem>
        ))}
      </nav>

      <Divider />

      {/* SETTINGS */}
      <NavItem
        active={page === 'settings'}
        onClick={() => setPage('settings')}
      >
        Configurações
      </NavItem>

      <div style={{ flex: 1 }} />

      {/* LOGOUT — AGORA FUNCIONAL */}
      <Button
        variant="ghost"
        onClick={onLogout} // 👈 ÚNICA MUDANÇA REAL
      >
        Sair
      </Button>
    </aside>
  )
}

function Divider() {
  return (
    <div
      style={{
        height: 1,
        background: 'var(--border)',
      }}
    />
  )
}

function NavItem({ children, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        all: 'unset',
        cursor: 'pointer',
        padding: '8px 10px',
        borderRadius: 6,
        fontSize: 14,

        /* visual */
        background: active
          ? 'var(--bg-hover)'
          : 'transparent',
        color: active
          ? 'var(--text)'
          : 'var(--text-muted)',

        /* micro-interações */
        transition:
          'background 140ms ease, color 140ms ease, transform 140ms ease',

        /* leve deslocamento apenas no hover */
        transform: 'translateX(0)',
      }}
      onMouseEnter={e => {
        if (!active) {
          e.currentTarget.style.background =
            'var(--bg-hover)'
          e.currentTarget.style.color =
            'var(--text)'
          e.currentTarget.style.transform =
            'translateX(2px)'
        }
      }}
      onMouseLeave={e => {
        if (!active) {
          e.currentTarget.style.background =
            'transparent'
          e.currentTarget.style.color =
            'var(--text-muted)'
          e.currentTarget.style.transform =
            'translateX(0)'
        }
      }}
    >
      {children}
    </button>
  )
}
