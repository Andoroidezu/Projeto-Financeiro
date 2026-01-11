import { useEffect, useState } from 'react'
import { supabase } from '../supabase'

export default function Transactions({
  currentMonth,
  setRefreshBalance,
}) {
  const [transactions, setTransactions] = useState([])
  const [paidInvoices, setPaidInvoices] = useState([])

  const [editingId, setEditingId] = useState(null)
  const [amountInput, setAmountInput] = useState('')

  useEffect(() => {
    fetchData()
  }, [currentMonth])

  async function fetchData() {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const [year, m] = currentMonth.split('-')
    const start = new Date(year, m - 1, 1)
    const nextMonth = new Date(year, m, 1)

    const { data: txData } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', start.toISOString().slice(0, 10))
      .lt('date', nextMonth.toISOString().slice(0, 10))
      .order('date', { ascending: true })

    const { data: invoices } = await supabase
      .from('card_invoices')
      .select('*')
      .eq('user_id', user.id)
      .eq('month', currentMonth)
      .eq('paid', true)

    setTransactions(txData || [])
    setPaidInvoices(invoices || [])
  }

  function isPaid(item) {
    if (item.card_id) {
      return paidInvoices.some(
        inv => inv.card_id === item.card_id
      )
    }
    return item.paid
  }

  function canEditAmount(item) {
    return (
      item.amount === null &&
      item.type === 'saida' &&
      !item.card_id &&
      !isPaid(item)
    )
  }

  function canMarkAsPaid(item) {
    return (
      item.type === 'saida' &&
      !item.card_id &&
      !item.paid &&
      item.amount !== null
    )
  }

  async function saveAmount(item) {
    await supabase
      .from('transactions')
      .update({ amount: Number(amountInput) })
      .eq('id', item.id)

    setEditingId(null)
    setAmountInput('')
    fetchData()
    setRefreshBalance(v => v + 1)
  }

  async function markAsPaid(item) {
    await supabase
      .from('transactions')
      .update({ paid: true })
      .eq('id', item.id)

    fetchData()
    setRefreshBalance(v => v + 1)
  }

  async function deleteTransaction(item) {
    if (!window.confirm('Excluir lançamento?')) return

    await supabase
      .from('transactions')
      .delete()
      .eq('id', item.id)

    fetchData()
    setRefreshBalance(v => v + 1)
  }

  return (
    <div className="card">
      <h2>Lançamentos</h2>

      {transactions.map(item => {
        const paid = isPaid(item)

        return (
          <div
            key={item.id}
            className="card"
            style={{
              position: 'relative',
              opacity: paid ? 0.6 : 1,
              backgroundColor:
                item.type === 'entrada'
                  ? 'rgba(34,197,94,0.08)'
                  : 'rgba(239,68,68,0.08)',
            }}
          >
            {/* EXCLUIR */}
            <button
              onClick={() => deleteTransaction(item)}
              style={{
                position: 'absolute',
                top: 6,
                right: 6,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              ❌
            </button>

            <strong>{item.name}</strong>
            <p>{item.date}</p>

            <p>
              {item.amount === null
                ? 'Valor pendente'
                : `${item.type === 'entrada' ? '+' : '-'} R$ ${item.amount}`}
            </p>

            {canEditAmount(item) && (
              <button
                onClick={() => {
                  setEditingId(item.id)
                  setAmountInput('')
                }}
              >
                Informar valor
              </button>
            )}

            {editingId === item.id && (
              <>
                <input
                  type="number"
                  value={amountInput}
                  onChange={e =>
                    setAmountInput(e.target.value)
                  }
                />
                <button onClick={() => saveAmount(item)}>
                  Salvar
                </button>
              </>
            )}

            {canMarkAsPaid(item) && (
              <button onClick={() => markAsPaid(item)}>
                Marcar como pago
              </button>
            )}

            {paid && (
              <p style={{ color: 'green' }}>✔ Pago</p>
            )}
          </div>
        )
      })}
    </div>
  )
}
