import { useEffect, useState } from 'react'
import { supabase } from '../supabase'

export default function Cards() {
  const [cards, setCards] = useState([])
  const [showForm, setShowForm] = useState(false)

  const [name, setName] = useState('')
  const [limit, setLimit] = useState('')
  const [closingDay, setClosingDay] = useState('')
  const [dueDay, setDueDay] = useState('')

  useEffect(() => {
    fetchCards()
  }, [])

  async function fetchCards() {
    const { data, error } = await supabase
      .from('cards')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error) setCards(data)
  }

  async function handleSubmit(e) {
    e.preventDefault()

    if (!name || !limit || !closingDay || !dueDay) {
      alert('Preencha todos os campos')
      return
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { error } = await supabase.from('cards').insert({
      user_id: user.id,
      name,
      limit_amount: Number(limit),
      closing_day: Number(closingDay),
      due_day: Number(dueDay),
    })

    if (error) {
      alert(error.message)
      return
    }

    setName('')
    setLimit('')
    setClosingDay('')
    setDueDay('')
    setShowForm(false)

    fetchCards()
  }

  return (
    <div className="card">
      <h2>Cartões de crédito</h2>

      <div className="button-group">
        <button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancelar' : 'Novo cartão'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card">
          <input
            placeholder="Nome do cartão"
            value={name}
            onChange={e => setName(e.target.value)}
          />

          <input
            type="number"
            placeholder="Limite"
            value={limit}
            onChange={e => setLimit(e.target.value)}
          />

          <input
            type="number"
            placeholder="Dia de fechamento"
            value={closingDay}
            onChange={e => setClosingDay(e.target.value)}
          />

          <input
            type="number"
            placeholder="Dia de vencimento"
            value={dueDay}
            onChange={e => setDueDay(e.target.value)}
          />

          <button type="submit">Salvar</button>
        </form>
      )}

      {cards.length === 0 && <p>Nenhum cartão cadastrado.</p>}

      {cards.map(card => (
        <div key={card.id} className="card">
          <strong>{card.name}</strong>
          <p>Limite: R$ {card.limit_amount}</p>
          <p>
            Fecha dia {card.closing_day} • Vence dia {card.due_day}
          </p>
        </div>
      ))}
    </div>
  )
}
