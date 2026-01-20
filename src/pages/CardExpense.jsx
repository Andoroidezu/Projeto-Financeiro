import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import Card from '../ui/Card'
import Button from '../ui/Button'
import { useToast } from '../ui/ToastProvider'

export default function CardExpense({ setRefreshBalance }) {
  const { showToast } = useToast()

  const [cards, setCards] = useState([])

  const [name, setName] = useState('')
  const [cardId, setCardId] = useState('')
  const [date, setDate] = useState(
    new Date().toISOString().slice(0, 10)
  )

  const [isInstallment, setIsInstallment] = useState(false)
  const [installments, setInstallments] = useState(2)
  const [amount, setAmount] = useState('')

  useEffect(() => {
    fetchCards()
  }, [])

  async function fetchCards() {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('cards')
      .select('id, name')
      .eq('user_id', user.id)

    setCards(data || [])
    if (data?.length) setCardId(data[0].id)
  }

  async function handleSubmit(e) {
    e.preventDefault()

    if (!name || !amount || !cardId) {
      showToast('Preencha todos os campos', 'warning')
      return
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const value = Math.abs(Number(amount))
    const total = isInstallment ? Number(installments) : 1

    const baseDate = new Date(date)
    const rows = []

    for (let i = 0; i < total; i++) {
      const d = new Date(baseDate)
      d.setMonth(d.getMonth() + i)

      rows.push({
        user_id: user.id,
        name:
          total > 1
            ? `${name} (${i + 1}/${total})`
            : name,
        amount: -value,
        type: 'saida',
        date: d.toISOString().slice(0, 10),
        paid: false,
        card_id: cardId,
      })
    }

    const { error } = await supabase
      .from('transactions')
      .insert(rows)

    if (error) {
      showToast('Erro ao salvar compra', 'error')
      return
    }

    showToast('Compra registrada', 'success')

    setName('')
    setAmount('')
    setInstallments(2)
    setIsInstallment(false)

    setRefreshBalance(v => v + 1)
  }

  return (
    <div style={{ maxWidth: 520 }}>
      <Card>
        <h2>Compra no cartão</h2>
        <p className="text-muted">
          Registre compras no crédito, parceladas ou não.
        </p>
      </Card>

      <Card>
        <form onSubmit={handleSubmit}>
          <input
            placeholder="Descrição da compra"
            value={name}
            onChange={e => setName(e.target.value)}
          />

          <select
            value={cardId}
            onChange={e => setCardId(e.target.value)}
          >
            {cards.map(card => (
              <option key={card.id} value={card.id}>
                {card.name}
              </option>
            ))}
          </select>

          <label style={{ fontSize: 13 }}>
            Data da compra
          </label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
          />

          {/* CHECKBOX PEQUENO E ALINHADO */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              marginTop: 6,
            }}
          >
            <input
              type="checkbox"
              checked={isInstallment}
              onChange={e =>
                setIsInstallment(e.target.checked)
              }
              style={{
                width: 14,
                height: 14,
                margin: 0,
              }}
            />
            <span style={{ fontSize: 14 }}>
              Parcelada
            </span>
          </div>

          {isInstallment && (
            <input
              type="number"
              min="2"
              placeholder="Quantidade de parcelas"
              value={installments}
              onChange={e =>
                setInstallments(e.target.value)
              }
            />
          )}

          <input
            type="number"
            placeholder={
              isInstallment
                ? 'Valor de cada parcela'
                : 'Valor da compra'
            }
            value={amount}
            onChange={e => setAmount(e.target.value)}
          />

          <Button type="submit">
            Salvar compra
          </Button>
        </form>
      </Card>
    </div>
  )
}
