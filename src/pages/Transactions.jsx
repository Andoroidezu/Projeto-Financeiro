import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import Card from '../ui/Card'
import Button from '../ui/Button'

export default function Transactions({
  currentMonth,
  setRefreshBalance,
  setHasPending,
}) {
  const [transactions, setTransactions] = useState([])
  const [cardsMap, setCardsMap] = useState({})

  useEffect(() => {
    fetchData()
  }, [currentMonth])

  async function fetchData() {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    // cartões
    const { data: cards } = await supabase
      .from('cards')
      .select('id, name')
      .eq('user_id', user.id)

    const map = {}
    cards?.forEach(c => {
      map[c.id] = c.name
    })
    setCardsMap(map)

    // transações do mês
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
      t => t.type !== 'entrada' && !t.paid
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
    if (
      !window.confirm(
        'Deseja excluir este lançamento?'
      )
    )
      return

    await supabase
      .from('transactions')
      .delete()
      .eq('id', id)

    setRefreshBalance(v => v + 1)
    fetchData()
  }

  return (
    <Card>
      <h2 style={{ fontSize: 18, marginBottom: 16 }}>
        Lançamentos
      </h2>

      {transactions.length === 0 && (
        <p className="text-muted">
          Nenhum lançamento neste mês.
        </p>
      )}

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        {transactions.map(t => {
          const isEntry = t.type === 'entrada'
          const isCard = t.card_id !== null
          const valueColor = isEntry
            ? 'var(--success)'
            : 'var(--danger)'

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
                <strong>{t.name}</strong>

                <div
                  style={{
                    fontSize: 12,
                    color: 'var(--text-muted)',
                    marginTop: 2,
                  }}
                >
                  {t.date} ·{' '}
                  {isCard
                    ? `Cartão: ${
                        cardsMap[t.card_id] || '—'
                      }`
                    : 'Conta / Dinheiro'}
                </div>

                {!isEntry && !t.paid && (
                  <span
                    style={{
                      fontSize: 12,
                      color: 'var(--warning)',
                    }}
                  >
                    Pendente
                  </span>
                )}

                {t.paid && (
                  <span
                    style={{
                      fontSize: 12,
                      color: 'var(--success)',
                    }}
                  >
                    Pago
                  </span>
                )}
              </div>

              {/* DIREITA */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <strong
                  style={{
                    color: valueColor,
                    minWidth: 90,
                    textAlign: 'right',
                  }}
                >
                  {isEntry ? '+' : '-'} R${' '}
                  {t.amount !== null
                    ? t.amount.toFixed(2)
                    : '—'}
                </strong>

                {!isEntry &&
                  !isCard &&
                  !t.paid &&
                  t.amount !== null && (
                    <Button
                      variant="ghost"
                      onClick={() => markAsPaid(t.id)}
                    >
                      Pagar
                    </Button>
                  )}

                <Button
                  variant="ghost"
                  onClick={() =>
                    deleteTransaction(t.id)
                  }
                >
                  ✕
                </Button>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
