import { useEffect, useState } from 'react'
import { supabase } from '../supabase'

export default function CardExpense({ setRefreshBalance }) {
  const [cards, setCards] = useState([])
  const [cardId, setCardId] = useState('')
  const [description, setDescription] = useState('')
  const [installmentAmount, setInstallmentAmount] = useState('')
  const [installments, setInstallments] = useState(1)

  useEffect(() => {
    fetchCards()
  }, [])

  async function fetchCards() {
    const { data } = await supabase.from('cards').select('*')
    setCards(data || [])
  }

  async function handleSubmit(e) {
    e.preventDefault()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const card = cards.find(c => c.id === cardId)
    if (!card) return

    const today = new Date()
    const inserts = []

    for (let i = 0; i < installments; i++) {
      const date = new Date(
        today.getFullYear(),
        today.getMonth() + i,
        card.due_day
      )

      inserts.push({
        user_id: user.id,
        name: `${description} (${i + 1}/${installments})`,
        amount: Number(installmentAmount),
        type: 'saida',
        date: date.toISOString().slice(0, 10),
        card_id: card.id,
      })
    }

    const { error } = await supabase
      .from('transactions')
      .insert(inserts)

    if (!error) {
      setCardId('')
      setDescription('')
      setInstallmentAmount('')
      setInstallments(1)
      setRefreshBalance(v => v + 1) // 🔔
    }
  }

  return (
    <div className="card">
      <h2>Despesa no cartão</h2>

      <form onSubmit={handleSubmit} className="card">
        <select
          value={cardId}
          onChange={e => setCardId(e.target.value)}
        >
          <option value="">Selecione o cartão</option>
          {cards.map(c => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <input
          placeholder="Descrição"
          value={description}
          onChange={e => setDescription(e.target.value)}
        />

        <input
          type="number"
          step="0.01"
          placeholder="Valor da parcela"
          value={installmentAmount}
          onChange={e => setInstallmentAmount(e.target.value)}
        />

        <input
          type="number"
          placeholder="Quantidade de parcelas"
          value={installments}
          onChange={e => setInstallments(e.target.value)}
        />

        <button type="submit">Salvar</button>
      </form>
    </div>
  )
}
