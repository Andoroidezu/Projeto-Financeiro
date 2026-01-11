import { useEffect, useState } from 'react'
import { supabase } from '../supabase'

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

    // Mapear cartões
    const { data: cards } = await supabase
      .from('cards')
      .select('id, name')
      .eq('user_id', user.id)

    const map = {}
    cards?.forEach(c => {
      map[c.id] = c.name
    })
    setCardsMap(map)

    // Buscar lançamentos do mês
    const [year, m] = currentMonth.split('-')
    const start = new Date(year, m - 1, 1)
    const nextMonth = new Date(year, m, 1)

    const { data } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', start.toISOString().slice(0, 10))
      .lt('date', nextMonth.toISOString().slice(0, 10))
      .order('date', { ascending: true })

    const list = data || []
    setTransactions(list)

    // ⚠️ Aviso global (ignora entradas)
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
    const confirm = window.confirm(
      'Deseja excluir este lançamento?'
    )
    if (!confirm) return

    await supabase.from('transactions').delete().eq('id', id)

    setRefreshBalance(v => v + 1)
    fetchData()
  }

  return (
    <div className="card">
      <h2>Lançamentos</h2>

      {transactions.length === 0 && (
        <p>Nenhum lançamento neste mês.</p>
      )}

      {transactions.map(t => {
        const isEntry = t.type === 'entrada'
        const isCard = t.card_id !== null

        const bgColor = isEntry
          ? '#dcfce7' // verde claro
          : '#fee2e2' // vermelho claro

        return (
          <div
            key={t.id}
            className="card"
            style={{
              background: bgColor,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div>
              <strong>{t.name}</strong>

              <p style={{ fontSize: 13, opacity: 0.8 }}>
                {t.date}
              </p>

              <p style={{ fontSize: 13 }}>
                {isCard
                  ? `Cartão: ${cardsMap[t.card_id] || '—'}`
                  : 'Dinheiro / Conta'}
              </p>

              <p>
                {t.amount === null
                  ? 'Valor pendente'
                  : `${isEntry ? '+' : '-'} R$ ${t.amount.toFixed(
                      2
                    )}`}
              </p>

              {/* ✅ SOMENTE despesas NÃO cartão */}
              {!isEntry &&
                !isCard &&
                !t.paid &&
                t.amount !== null && (
                  <button
                    onClick={() => markAsPaid(t.id)}
                    style={{ marginTop: 4 }}
                  >
                    Marcar como pago
                  </button>
                )}

              {t.paid && (
                <p style={{ color: 'green', fontSize: 13 }}>
                  ✔ Pago
                </p>
              )}
            </div>

            <button
              onClick={() => deleteTransaction(t.id)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#555',
                fontSize: 18,
                cursor: 'pointer',
              }}
              title="Excluir lançamento"
            >
              ✕
            </button>
          </div>
        )
      })}
    </div>
  )
}
