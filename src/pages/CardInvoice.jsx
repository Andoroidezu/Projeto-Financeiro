import { useEffect, useState } from 'react'
import { supabase } from '../supabase'

export default function CardInvoice({
  currentMonth,
  setRefreshBalance,
  setHasOpenInvoice,
}) {
  const [cards, setCards] = useState([])
  const [totals, setTotals] = useState({})
  const [paidInvoices, setPaidInvoices] = useState({})

  useEffect(() => {
    fetchData()
  }, [currentMonth])

  async function fetchData() {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    // cartões
    const { data: cardData } = await supabase
      .from('cards')
      .select('*')
      .eq('user_id', user.id)

    setCards(cardData || [])

    // faturas já pagas
    const { data: invoiceData } = await supabase
      .from('card_invoices')
      .select('card_id')
      .eq('user_id', user.id)
      .eq('month', currentMonth)
      .eq('paid', true)

    const paidMap = {}
    invoiceData?.forEach(i => {
      paidMap[i.card_id] = true
    })
    setPaidInvoices(paidMap)

    // despesas de cartão NÃO PAGAS do mês
    const [year, m] = currentMonth.split('-')
    const start = new Date(year, m - 1, 1)
    const nextMonth = new Date(year, m, 1)

    const { data: txData } = await supabase
      .from('transactions')
      .select('card_id, amount')
      .eq('user_id', user.id)
      .not('card_id', 'is', null)
      .eq('paid', false)
      .gte('date', start.toISOString().slice(0, 10))
      .lt('date', nextMonth.toISOString().slice(0, 10))

    const totalMap = {}

    txData?.forEach(t => {
      if (t.amount === null) return
      totalMap[t.card_id] =
        (totalMap[t.card_id] || 0) + Number(t.amount)
    })

    setTotals(totalMap)

    // aviso global de fatura aberta/parcial
    const hasOpen = Object.values(totalMap).some(v => v > 0)
    setHasOpenInvoice?.(hasOpen)
  }

  async function payInvoice(cardId) {
    const total = totals[cardId]
    if (!total || total === 0) return

    const {
      data: { user },
    } = await supabase.auth.getUser()

    // registra pagamento (mesmo que já exista)
    await supabase.from('card_invoices').insert({
      user_id: user.id,
      card_id: cardId,
      month: currentMonth,
      paid: true,
    })

    // quita despesas daquele cartão no mês
    const [year, m] = currentMonth.split('-')
    const start = new Date(year, m - 1, 1)
    const nextMonth = new Date(year, m, 1)

    await supabase
      .from('transactions')
      .update({ paid: true })
      .eq('user_id', user.id)
      .eq('card_id', cardId)
      .gte('date', start.toISOString().slice(0, 10))
      .lt('date', nextMonth.toISOString().slice(0, 10))

    fetchData()
    setRefreshBalance(v => v + 1)
  }

  return (
    <div className="card">
      <h2>Fatura do Cartão</h2>

      {cards.map(card => {
        const total = totals[card.id] || 0
        const hasPaidRecord = paidInvoices[card.id] === true

        let status = '—'
        let color = '#999'

        if (total > 0 && !hasPaidRecord) {
          status = 'ABERTA'
          color = 'orange'
        }

        if (total === 0 && hasPaidRecord) {
          status = 'PAGA'
          color = 'green'
        }

        if (total > 0 && hasPaidRecord) {
          status = 'PAGAMENTO PARCIAL ⚠️'
          color = '#eab308'
        }

        return (
          <div key={card.id} className="card">
            <strong>{card.name}</strong>
            <p>Mês: {currentMonth}</p>

            <p>
              <strong>Total:</strong> R$ {total.toFixed(2)}
            </p>

            <p>
              <strong>Status:</strong>{' '}
              <span style={{ color }}>{status}</span>
            </p>

            {total > 0 && (
              <button onClick={() => payInvoice(card.id)}>
                Marcar fatura como paga
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
