import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import Card from '../ui/Card'
import Button from '../ui/Button'
import Badge from '../ui/Badge'
import { useToast } from '../ui/ToastProvider'

const BANK_THEMES = {
  nubank:   { color: '#8A05BE', bg: 'rgba(138,5,190,0.08)' },
  itau:    { color: '#EC7000', bg: 'rgba(236,112,0,0.08)' },
  bradesco:{ color: '#CC092F', bg: 'rgba(204,9,47,0.08)' },
  santander:{ color: '#EA1D25', bg: 'rgba(234,29,37,0.08)' },
  bb:      { color: '#F7D117', bg: 'rgba(247,209,23,0.14)' },
  caixa:   { color: '#0066B3', bg: 'rgba(0,102,179,0.08)' },
  inter:   { color: '#FF7A00', bg: 'rgba(255,122,0,0.08)' },
  c6:      { color: '#000000', bg: 'rgba(0,0,0,0.06)' },
  neon:    { color: '#00E88F', bg: 'rgba(0,232,143,0.08)' },
  original:{ color: '#00A859', bg: 'rgba(0,168,89,0.08)' },
  next:    { color: '#00FF5F', bg: 'rgba(0,255,95,0.08)' },
  sicredi: { color: '#00A651', bg: 'rgba(0,166,81,0.08)' },
  sicoob:  { color: '#003641', bg: 'rgba(0,54,65,0.08)' },
  banrisul:{ color: '#005CA9', bg: 'rgba(0,92,169,0.08)' },
  pan:     { color: '#1E1E1E', bg: 'rgba(30,30,30,0.06)' },
  default: { color: 'var(--text)', bg: 'var(--bg-hover)' },
}

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
      .select('*')
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
    const invoiceDate = new Date(d.getFullYear(), d.getMonth(), 1)
    if (d.getDate() > closingDay) {
      invoiceDate.setMonth(invoiceDate.getMonth() + 1)
    }
    return invoiceDate.toISOString().slice(0, 7)
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

  async function payInvoice(card, invoiceMonth, txs) {
    if (!txs.length) return
    if (!window.confirm('Pagar esta fatura?')) return

    await supabase
      .from('transactions')
      .update({ paid: true })
      .in(
        'id',
        txs.map(t => t.id)
      )

    showToast({
      message: `Fatura paga — ${card.name}`,
      variant: 'success',
      actions: [
        {
          label: 'Ver lançamentos',
          onClick: () => {
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

          const theme =
            BANK_THEMES[card.bank] ||
            BANK_THEMES.default

          return (
            <Card
              key={card.id}
              style={{
                borderLeft: `4px solid ${theme.color}`,
                background: theme.bg,
              }}
            >
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
                  · vence dia {card.due_day}
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
                    fontSize: 13,
                  }}
                >
                  {txs.map(tx => (
                    <div
                      key={tx.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
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
