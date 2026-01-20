import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import Card from '../ui/Card'
import Button from '../ui/Button'
import Badge from '../ui/Badge'
import { useToast } from '../ui/ToastProvider'

export default function CardInvoice({
  currentMonth,
  setCurrentMonth,
  setPage,
  setRefreshBalance,
}) {
  const { showToast } = useToast()

  const [cards, setCards] = useState([])
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [fading, setFading] = useState({})

  useEffect(() => {
    fetchData()
  }, [currentMonth])

  async function fetchData() {
    setLoading(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    const { data: cardsData } = await supabase
      .from('cards')
      .select('id, name, closing_day, due_day')
      .eq('user_id', user.id)

    const { data: txData } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .not('card_id', 'is', null)

    setCards(cardsData || [])
    setTransactions(txData || [])
    setLoading(false)
  }

  function resolveInvoiceMonth(tx, closingDay) {
    const d = new Date(tx.date)
    const purchaseDay = d.getDate()
    const invoiceDate = new Date(d.getFullYear(), d.getMonth(), 1)

    if (purchaseDay > closingDay) {
      invoiceDate.setMonth(invoiceDate.getMonth() + 1)
    }

    const y = invoiceDate.getFullYear()
    const m = String(invoiceDate.getMonth() + 1).padStart(2, '0')
    return `${y}-${m}`
  }

  function invoicePeriod(invoiceMonth, closingDay) {
    const [y, m] = invoiceMonth.split('-').map(Number)
    const end = new Date(y, m - 1, closingDay)
    const start = new Date(end)
    start.setMonth(start.getMonth() - 1)
    start.setDate(closingDay + 1)

    const fmt = d =>
      d.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
      })

    return `${fmt(start)} → ${fmt(end)}`
  }

  function groupInvoices() {
    const map = {}
    cards.forEach(card => (map[card.id] = {}))

    transactions.forEach(tx => {
      const card = cards.find(c => c.id === tx.card_id)
      if (!card) return

      const month = resolveInvoiceMonth(tx, card.closing_day)
      if (!map[card.id][month]) map[card.id][month] = []
      map[card.id][month].push(tx)
    })

    return map
  }

  function getOriginMonth(txs) {
    if (!txs.length) return null

    const months = txs.map(tx =>
      new Date(tx.date).toISOString().slice(0, 7)
    )

    return months.sort()[0] // menor mês = origem
  }

  async function payInvoice(card, invoiceMonth, txs) {
    if (!txs.length) return
    if (!window.confirm('Pagar esta fatura?')) return

    setFading(prev => ({
      ...prev,
      [`${card.id}-${invoiceMonth}`]: true,
    }))

    const ids = txs.map(t => t.id)

    await supabase
      .from('transactions')
      .update({ paid: true })
      .in('id', ids)

    const originMonth = getOriginMonth(txs)

    showToast({
      message: `Fatura paga — ${card.name}`,
      variant: 'success',
      actions: [
        {
          label: `Ver lançamentos (${originMonth})`,
          onClick: () => {
            setCurrentMonth(originMonth)
            setPage('transactions')
          },
        },
      ],
    })

    setRefreshBalance(v => v + 1)
    setTimeout(fetchData, 300)
  }

  const invoicesMap = groupInvoices()

  return (
    <div style={{ maxWidth: 760 }}>
      <Card>
        <h2>Faturas</h2>
        <p className="text-muted">
          Mês de vencimento: {currentMonth}
        </p>
      </Card>

      {!loading &&
        cards.map(card => {
          const txs =
            invoicesMap[card.id]?.[currentMonth] || []

          const total = txs.reduce(
            (s, t) => s + Math.abs(t.amount),
            0
          )

          const paidCount = txs.filter(t => t.paid).length
          let status = 'VAZIA'
          if (txs.length > 0) {
            status =
              paidCount === txs.length
                ? 'PAGA'
                : paidCount > 0
                ? 'PARCIAL'
                : 'ABERTA'
          }

          return (
            <Card key={card.id}>
              <div style={{ marginBottom: 12 }}>
                <h3 style={{ marginBottom: 6 }}>
                  {card.name}
                </h3>

                <Badge
                  variant={
                    status === 'PAGA'
                      ? 'success'
                      : status === 'PARCIAL'
                      ? 'warning'
                      : status === 'ABERTA'
                      ? 'info'
                      : 'ghost'
                  }
                >
                  {status}
                </Badge>

                <div
                  className="text-muted"
                  style={{ fontSize: 13, marginTop: 6 }}
                >
                  {invoicePeriod(
                    currentMonth,
                    card.closing_day
                  )}{' '}
                  · vence dia {card.due_day || '—'}
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 16,
                }}
              >
                <strong>
                  Total: R$ {total.toFixed(2)}
                </strong>

                <Button
                  variant={
                    status === 'PAGA'
                      ? 'ghost'
                      : 'danger'
                  }
                  disabled={
                    status === 'PAGA' ||
                    txs.length === 0
                  }
                  onClick={() =>
                    payInvoice(
                      card,
                      currentMonth,
                      txs
                    )
                  }
                >
                  {status === 'PAGA'
                    ? 'Fatura paga'
                    : 'Pagar fatura'}
                </Button>
              </div>

              {txs.length > 0 && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                  }}
                >
                  {txs.map(tx => (
                    <div
                      key={tx.id}
                      style={{
                        display: 'grid',
                        gridTemplateColumns:
                          '1fr auto',
                        fontSize: 13,
                      }}
                    >
                      <span>{tx.name}</span>
                      <span>
                        R${' '}
                        {Math.abs(tx.amount).toFixed(
                          2
                        )}{' '}
                        {tx.paid ? '✓' : ''}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )
        })}
    </div>
  )
}
