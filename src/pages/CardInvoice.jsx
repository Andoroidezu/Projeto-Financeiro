import { useEffect, useState } from 'react'
import { supabase } from '../supabase'

export default function CardInvoice() {
  const [month, setMonth] = useState(
    new Date().toISOString().slice(0, 7)
  )

  const [cards, setCards] = useState([])
  const [transactions, setTransactions] = useState([])
  const [invoices, setInvoices] = useState([])

  useEffect(() => {
    fetchData()
  }, [month])

  async function fetchData() {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const [year, m] = month.split('-')
    const start = new Date(year, m - 1, 1)
    const nextMonth = new Date(year, m, 1)

    const { data: cardsData } = await supabase
      .from('cards')
      .select('*')

    const { data: txData } = await supabase
      .from('transactions')
      .select('*')
      .not('card_id', 'is', null)
      .gte('date', start.toISOString().slice(0, 10))
      .lt('date', nextMonth.toISOString().slice(0, 10))

    const { data: invoiceData } = await supabase
      .from('card_invoices')
      .select('*')
      .eq('month', month)
      .eq('user_id', user.id)

    setCards(cardsData || [])
    setTransactions(txData || [])
    setInvoices(invoiceData || [])
  }

  function getCardTransactions(cardId) {
    return transactions.filter(t => t.card_id === cardId)
  }

  function getInvoice(cardId) {
    return invoices.find(
      i => i.card_id === cardId && i.month === month
    )
  }

  function getInvoiceTotal(cardId) {
    return getCardTransactions(cardId).reduce(
      (sum, t) => sum + Number(t.amount || 0),
      0
    )
  }

  async function markAsPaid(cardId) {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const existing = getInvoice(cardId)

    if (existing?.paid) return

    await supabase.from('card_invoices').upsert({
      user_id: user.id,
      card_id: cardId,
      month,
      paid: true,
      paid_at: new Date().toISOString(),
    })

    fetchData()
  }

  return (
    <div className="card">
      <h2>Fatura do cartão</h2>

      <input
        type="month"
        value={month}
        onChange={e => setMonth(e.target.value)}
      />

      {cards.map(card => {
        const cardTx = getCardTransactions(card.id)
        if (cardTx.length === 0) return null

        const invoice = getInvoice(card.id)
        const paid = invoice?.paid

        const limit = Number(card.limit || 0)
        const total = getInvoiceTotal(card.id)
        const available = limit - total

        return (
          <div key={card.id} className="card">
            <h3>{card.name}</h3>

            <p><strong>Limite:</strong> R$ {limit.toFixed(2)}</p>
            <p><strong>Total da fatura:</strong> R$ {total.toFixed(2)}</p>
            <p>
              <strong>Limite disponível:</strong>{' '}
              <span style={{ color: available >= 0 ? 'green' : 'red' }}>
                R$ {available.toFixed(2)}
              </span>
            </p>

            {paid ? (
              <p style={{ color: 'green' }}>
                ✔ Fatura paga
              </p>
            ) : (
              <button onClick={() => markAsPaid(card.id)}>
                Marcar fatura como paga
              </button>
            )}

            <hr />

            {cardTx.map(t => (
              <div key={t.id} className="card">
                <strong>{t.name}</strong>
                <p>{t.date}</p>
                <p>R$ {Number(t.amount || 0).toFixed(2)}</p>
              </div>
            ))}
          </div>
        )
      })}
    </div>
  )
}
