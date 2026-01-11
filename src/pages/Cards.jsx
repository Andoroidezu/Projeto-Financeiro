import { useEffect, useState } from 'react'
import { supabase } from '../supabase'

export default function Cards() {
  const [cards, setCards] = useState([])
  const [usage, setUsage] = useState({})

  // form
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [limit, setLimit] = useState('')
  const [closingDay, setClosingDay] = useState('')
  const [dueDay, setDueDay] = useState('')

  useEffect(() => {
    fetchCards()
  }, [])

  async function fetchCards() {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    // cartões
    const { data: cardData } = await supabase
      .from('cards')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    setCards(cardData || [])

    // despesas de cartão NÃO PAGAS
    const { data: txData } = await supabase
      .from('transactions')
      .select('card_id, amount')
      .eq('user_id', user.id)
      .not('card_id', 'is', null)
      .eq('paid', false)

    const usedMap = {}

    txData?.forEach(t => {
      if (!t.amount) return
      usedMap[t.card_id] =
        (usedMap[t.card_id] || 0) + Number(t.amount)
    })

    setUsage(usedMap)
  }

  async function handleSubmit(e) {
    e.preventDefault()

    if (!name || !limit || !closingDay || !dueDay) {
      alert(
        'Informe nome, limite, dia de fechamento e dia de vencimento'
      )
      return
    }

    const closing = Number(closingDay)
    const due = Number(dueDay)

    if (
      closing < 1 ||
      closing > 31 ||
      due < 1 ||
      due > 31
    ) {
      alert('Dias devem ser entre 1 e 31')
      return
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { error } = await supabase.from('cards').insert({
      user_id: user.id,
      name,
      limit_amount: Number(limit),
      closing_day: closing,
      due_day: due,
    })

    if (error) {
      alert(error.message)
      return
    }

    // reset form
    setName('')
    setLimit('')
    setClosingDay('')
    setDueDay('')
    setShowForm(false)

    fetchCards()
  }

  return (
    <div className="card">
      <h2>Cartões</h2>

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
            placeholder="Dia de fechamento (1–31)"
            min="1"
            max="31"
            value={closingDay}
            onChange={e => setClosingDay(e.target.value)}
          />

          <input
            type="number"
            placeholder="Dia de vencimento (1–31)"
            min="1"
            max="31"
            value={dueDay}
            onChange={e => setDueDay(e.target.value)}
          />

          <button type="submit">Salvar</button>
        </form>
      )}

      {cards.length === 0 && (
        <p>Nenhum cartão cadastrado.</p>
      )}

      {cards.map(card => {
        const limitValue = Number(card.limit_amount || 0)
        const used = Number(usage[card.id] || 0)
        const available = limitValue - used
        const percent =
          limitValue > 0
            ? Math.round((used / limitValue) * 100)
            : 0

        return (
          <div key={card.id} className="card">
            <strong>{card.name}</strong>

            <p>
              Fecha dia: {card.closing_day} | Vence dia:{' '}
              {card.due_day}
            </p>

            <p>
              <strong>Limite total:</strong> R${' '}
              {limitValue.toFixed(2)}
            </p>

            <p style={{ color: 'red' }}>
              <strong>Usado:</strong> R${' '}
              {used.toFixed(2)}
            </p>

            <p style={{ color: 'green' }}>
              <strong>Disponível:</strong> R${' '}
              {available.toFixed(2)}
            </p>

            {/* Barra de uso */}
            <div
              style={{
                marginTop: 8,
                height: 8,
                width: '100%',
                background: '#333',
                borderRadius: 4,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${percent}%`,
                  height: '100%',
                  background:
                    percent > 90
                      ? '#ef4444'
                      : percent > 70
                        ? '#f59e0b'
                        : '#22c55e',
                }}
              />
            </div>

            <small>{percent}% do limite usado</small>
          </div>
        )
      })}
    </div>
  )
}
