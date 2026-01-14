import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import Card from '../ui/Card'
import Button from '../ui/Button'
import Badge from '../ui/Badge'
import { useToast } from '../ui/ToastProvider'

/*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧭 GUIA — FATURA COM CICLO REAL DO CARTÃO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

REGRA FUNDAMENTAL:
- Fatura NÃO segue mês calendário
- Fatura segue FECHAMENTO do cartão

Exemplo:
- Fecha dia 10
- Tudo após dia 10 vai para próxima fatura

Este arquivo calcula o ciclo corretamente.
*/

export default function CardInvoice({
  currentMonth,        // YYYY-MM (mês da fatura)
  activeCardId,
  setRefreshBalance,
}) {
  const { showToast } = useToast()

  const [transactions, setTransactions] = useState([])
  const [closingDay, setClosingDay] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCard()
  }, [activeCardId])

  useEffect(() => {
    if (closingDay) fetchInvoice()
  }, [currentMonth, closingDay])

  async function fetchCard() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !activeCardId) return

    const { data } = await supabase
      .from('cards')
      .select('closing_day')
      .eq('id', activeCardId)
      .single()

    setClosingDay(data?.closing_day)
  }

  function getInvoiceRange() {
    const [year, month] = currentMonth.split('-').map(Number)

    const end = new Date(year, month - 1, closingDay)
    const start = new Date(end)
    start.setMonth(start.getMonth() - 1)
    start.setDate(closingDay + 1)

    return {
      start: start.toISOString().slice(0, 10),
      end: end.toISOString().slice(0, 10),
    }
  }

  async function fetchInvoice() {
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { start, end } = getInvoiceRange()

    const { data, error } = await supabase
      .from('transactions')
      .select('id, amount, paid')
      .eq('user_id', user.id)
      .eq('card_id', activeCardId)
      .gte('date', start)
      .lte('date', end)

    if (error) {
      console.error(error)
      setTransactions([])
    } else {
      setTransactions(data || [])
    }

    setLoading(false)
  }

  const total = transactions.reduce(
    (sum, t) => sum + Number(t.amount),
    0
  )

  const paidCount = transactions.filter(t => t.paid).length
  const totalCount = transactions.length

  let status = 'ABERTA'
  if (totalCount > 0 && paidCount === totalCount) {
    status = 'PAGA'
  } else if (paidCount > 0) {
    status = 'PARCIAL'
  }

  async function payInvoice() {
    if (status === 'PAGA') return

    const confirm = window.confirm(
      status === 'PARCIAL'
        ? 'Pagar o restante da fatura?'
        : 'Pagar fatura completa?'
    )
    if (!confirm) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { start, end } = getInvoiceRange()

    await supabase
      .from('transactions')
      .update({ paid: true })
      .eq('user_id', user.id)
      .eq('card_id', activeCardId)
      .eq('paid', false)
      .gte('date', start)
      .lte('date', end)

    showToast('Fatura paga com sucesso', 'success')
    setRefreshBalance(v => v + 1)
    fetchInvoice()
  }

  return (
    <div style={{ maxWidth: 520 }}>
      <Card>
        <h2>Fatura do cartão</h2>

        {loading ? (
          <p className="text-muted">Carregando…</p>
        ) : (
          <>
            <p className="text-muted">Fatura: {currentMonth}</p>

            <Badge
              variant={
                status === 'PAGA'
                  ? 'success'
                  : status === 'PARCIAL'
                  ? 'warning'
                  : 'info'
              }
            >
              {status}
            </Badge>

            <strong style={{ display: 'block', marginTop: 12 }}>
              Total: R$ {total.toFixed(2)}
            </strong>

            <div style={{ marginTop: 16 }}>
              <Button
                variant={status === 'PAGA' ? 'ghost' : 'danger'}
                disabled={status === 'PAGA'}
                onClick={payInvoice}
              >
                {status === 'PAGA'
                  ? 'Fatura paga'
                  : status === 'PARCIAL'
                  ? 'Pagar restante'
                  : 'Pagar fatura'}
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  )
}
