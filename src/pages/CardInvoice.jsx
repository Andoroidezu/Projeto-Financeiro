import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import Card from '../ui/Card'
import Button from '../ui/Button'
import Badge from '../ui/Badge'
import { useToast } from '../ui/ToastProvider'

/*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧭 FATURA DO CARTÃO — CICLO REAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Regras:
- Fatura NÃO segue mês calendário
- Fatura segue fechamento do cartão
- Nunca usar .single() sem garantia
- Nunca deixar loading infinito
*/

export default function CardInvoice({
  currentMonth,        // YYYY-MM
  activeCardId,
  setRefreshBalance,
}) {
  const { showToast } = useToast()

  const [transactions, setTransactions] = useState([])
  const [closingDay, setClosingDay] = useState(null)
  const [loading, setLoading] = useState(true)

  // 🔹 Buscar dados do cartão
  useEffect(() => {
    fetchCard()
  }, [activeCardId])

  // 🔹 Buscar fatura quando ciclo estiver definido
  useEffect(() => {
    if (closingDay) {
      fetchInvoice()
    }
  }, [currentMonth, closingDay])

  async function fetchCard() {
    if (!activeCardId) {
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('cards')
      .select('closing_day')
      .eq('id', activeCardId)
      .maybeSingle()

    if (error || !data) {
      console.error('Erro ao buscar cartão', error)
      setLoading(false)
      return
    }

    setClosingDay(data.closing_day)
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

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setLoading(false)
      return
    }

    const { start, end } = getInvoiceRange()

    const { data, error } = await supabase
      .from('transactions')
      .select('id, amount, paid')
      .eq('user_id', user.id)
      .eq('card_id', activeCardId)
      .gte('date', start)
      .lte('date', end)

    if (error) {
      console.error('Erro ao buscar fatura', error)
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

    const {
      data: { user },
    } = await supabase.auth.getUser()

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

  // 🟡 Nenhum cartão selecionado
  if (!activeCardId) {
    return (
      <div style={{ maxWidth: 520 }}>
        <Card>
          <p className="text-muted">
            Nenhum cartão selecionado.
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 520 }}>
      <Card>
        <h2>Fatura do cartão</h2>

        {loading ? (
          <p className="text-muted">Carregando…</p>
        ) : (
          <>
            <p className="text-muted">
              Fatura referência: {currentMonth}
            </p>

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

            <strong
              style={{
                display: 'block',
                marginTop: 12,
              }}
            >
              Total: R$ {total.toFixed(2)}
            </strong>

            <div style={{ marginTop: 16 }}>
              <Button
                variant={
                  status === 'PAGA'
                    ? 'ghost'
                    : 'danger'
                }
                disabled={status === 'PAGA'}
                onClick={payInvoice}
              >
                {status === 'PAGA'
                  ? 'Fatura paga'
                  : 'Pagar fatura'}
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  )
}
