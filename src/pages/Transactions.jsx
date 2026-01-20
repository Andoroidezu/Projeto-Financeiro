import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import Card from '../ui/Card'
import Button from '../ui/Button'

/*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧭 LANÇAMENTOS — VISÃO FINANCEIRA REAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

REGRAS:
- Entradas NÃO exibem status
- SOMENTE entradas exibem valor positivo
- Saídas e cartão SEMPRE exibem valor negativo
- Lançamento único de saída nasce PENDENTE
- Cartão só muda status via fatura
*/

export default function Transactions({
  currentMonth,
  setRefreshBalance,
  setHasPending,
}) {
  const [transactions, setTransactions] = useState([])
  const [cardsMap, setCardsMap] = useState({})
  const [openMenu, setOpenMenu] = useState(null)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetchData()
  }, [currentMonth])

  async function fetchData() {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    // Cartões
    const { data: cards } = await supabase
      .from('cards')
      .select('id, name')
      .eq('user_id', user.id)

    const map = {}
    cards?.forEach(c => {
      map[c.id] = c.name
    })
    setCardsMap(map)

    // Lançamentos
    const [year, m] = currentMonth.split('-')
    const start = new Date(year, m - 1, 1)
    const nextMonth = new Date(year, m, 1)

    const { data } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', start.toISOString().slice(0, 10))
      .lt('date', nextMonth.toISOString().slice(0, 10))
      .order('date', { ascending: false })

    const list = data || []
    setTransactions(list)

    const hasPending = list.some(
      t => t.type === 'saida' && !t.paid
    )
    setHasPending?.(hasPending)
  }

  async function markAsPaid(id) {
    await supabase
      .from('transactions')
      .update({ paid: true })
      .eq('id', id)

    setRefreshBalance(v => v + 1)
    fetchData()
  }

  async function deleteTransaction(id) {
    if (!window.confirm('Excluir lançamento?')) return

    await supabase
      .from('transactions')
      .delete()
      .eq('id', id)

    setRefreshBalance(v => v + 1)
    fetchData()
  }

  function getAmount(t) {
    const value = Number(t.amount) || 0
    return t.type === 'entrada'
      ? Math.abs(value)
      : -Math.abs(value)
  }

  function getStatus(t) {
    if (t.type === 'entrada') return null

    if (t.card_id !== null) {
      return t.paid ? 'Fatura paga' : 'Na fatura'
    }

    return t.paid ? 'Pago' : 'Pendente'
  }

  function getStatusColor(t) {
    if (t.card_id !== null) {
      return t.paid
        ? 'var(--success)'
        : 'var(--info)'
    }

    return t.paid
      ? 'var(--success)'
      : 'var(--warning)'
  }

  function getIcon(t) {
    if (t.type === 'entrada') return '💰'
    if (t.card_id !== null) return '💳'
    return '🧾'
  }

  function applyFilter(t) {
    if (filter === 'all') return true
    if (filter === 'pending')
      return t.type === 'saida' && !t.paid
    if (filter === 'paid') return t.paid
    if (filter === 'card') return t.card_id !== null
    if (filter === 'unique')
      return t.card_id === null && t.type === 'saida'
    if (filter === 'entry') return t.type === 'entrada'
    return true
  }

  const visible = transactions.filter(applyFilter)

  function filterStyle(name) {
    return {
      background:
        filter === name
          ? 'var(--bg-hover)'
          : 'transparent',
      border:
        filter === name
          ? '1px solid var(--border)'
          : '1px solid transparent',
    }
  }

  return (
    <Card>
      <h2 style={{ fontSize: 18, marginBottom: 12 }}>
        Lançamentos
      </h2>

      {/* FILTROS */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          flexWrap: 'wrap',
          marginBottom: 16,
        }}
      >
        <Button variant="ghost" style={filterStyle('all')} onClick={() => setFilter('all')}>
          Todos
        </Button>
        <Button variant="ghost" style={filterStyle('pending')} onClick={() => setFilter('pending')}>
          Pendentes
        </Button>
        <Button variant="ghost" style={filterStyle('paid')} onClick={() => setFilter('paid')}>
          Pagos
        </Button>
        <Button variant="ghost" style={filterStyle('card')} onClick={() => setFilter('card')}>
          Cartão
        </Button>
        <Button variant="ghost" style={filterStyle('unique')} onClick={() => setFilter('unique')}>
          Únicos
        </Button>
        <Button variant="ghost" style={filterStyle('entry')} onClick={() => setFilter('entry')}>
          Entradas
        </Button>
      </div>

      {visible.length === 0 && (
        <p className="text-muted">
          Nenhum lançamento encontrado.
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {visible.map(t => {
          const amount = getAmount(t)
          const status = getStatus(t)

          return (
            <div
              key={t.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 14px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-hover)',
                border: '1px solid var(--border)',
              }}
            >
              {/* ESQUERDA */}
              <div>
                <strong>
                  <span style={{ marginRight: 6 }}>
                    {getIcon(t)}
                  </span>
                  {t.name}
                </strong>

                <div
                  style={{
                    fontSize: 12,
                    color: 'var(--text-muted)',
                    marginTop: 2,
                  }}
                >
                  {t.date} ·{' '}
                  {t.card_id
                    ? `Cartão: ${cardsMap[t.card_id] || '—'}`
                    : 'Conta / Dinheiro'}
                </div>

                {status && (
                  <span
                    style={{
                      fontSize: 12,
                      color: getStatusColor(t),
                    }}
                  >
                    {status}
                  </span>
                )}
              </div>

              {/* DIREITA */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <strong
                  style={{
                    color:
                      amount > 0
                        ? 'var(--success)'
                        : 'var(--danger)',
                    minWidth: 110,
                    textAlign: 'right',
                  }}
                >
                  {amount > 0 ? '+' : '-'} R$ {Math.abs(amount).toFixed(2)}
                </strong>

                <div style={{ position: 'relative' }}>
                  <Button
                    variant="ghost"
                    onClick={() =>
                      setOpenMenu(openMenu === t.id ? null : t.id)
                    }
                  >
                    ☰
                  </Button>

                  {openMenu === t.id && (
                    <div
                      style={{
                        position: 'absolute',
                        right: 0,
                        top: 28,
                        background: 'var(--bg)',
                        border: '1px solid var(--border)',
                        borderRadius: 6,
                        padding: 4,
                        zIndex: 10,
                        minWidth: 140,
                      }}
                    >
                      {t.type === 'saida' &&
                        t.card_id === null &&
                        !t.paid && (
                          <button
                            onClick={() => {
                              markAsPaid(t.id)
                              setOpenMenu(null)
                            }}
                            style={{
                              width: '100%',
                              padding: '6px 8px',
                              background: 'none',
                              border: 'none',
                              textAlign: 'left',
                              cursor: 'pointer',
                            }}
                          >
                            Marcar como pago
                          </button>
                        )}

                      <button
                        onClick={() => {
                          deleteTransaction(t.id)
                          setOpenMenu(null)
                        }}
                        style={{
                          width: '100%',
                          padding: '6px 8px',
                          background: 'none',
                          border: 'none',
                          textAlign: 'left',
                          color: 'var(--danger)',
                          cursor: 'pointer',
                        }}
                      >
                        Excluir
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
