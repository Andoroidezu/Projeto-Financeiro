import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import Card from '../ui/Card'
import Button from '../ui/Button'
import { formatTransaction } from '../utils/formatTransaction'

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

    const { data: cards } = await supabase
      .from('cards')
      .select('id, name')
      .eq('user_id', user.id)

    const map = {}
    cards?.forEach(c => {
      map[c.id] = c.name
    })
    setCardsMap(map)

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
      t =>
        Number(t.amount) < 0 &&
        !t.paid &&
        t.card_id === null
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
    if (!window.confirm('Deseja excluir este lançamento?'))
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
          const meta = formatTransaction(t, cardsMap)

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
              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ fontSize: 18 }}>
                  {meta.icon}
                </div>

                <div>
                  <strong>{t.name}</strong>
                  <div
                    style={{
                      fontSize: 12,
                      color: 'var(--text-muted)',
                    }}
                  >
                    {t.date} · {meta.label}
                  </div>

                  {meta.isExpense &&
                    !meta.isCard &&
                    !t.paid && (
                      <span
                        style={{
                          fontSize: 12,
                          color: 'var(--warning)',
                        }}
                      >
                        Pendente
                      </span>
                    )}

                  {meta.isExpense &&
                    !meta.isCard &&
                    t.paid && (
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
                    color: meta.color,
                    minWidth: 120,
                    textAlign: 'right',
                  }}
                >
                  {meta.formattedValue}
                </strong>

                {meta.isExpense &&
                  !meta.isCard &&
                  !t.paid && (
                    <Button
                      variant="ghost"
                      onClick={() =>
                        markAsPaid(t.id)
                      }
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
