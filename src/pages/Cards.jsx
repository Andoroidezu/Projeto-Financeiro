import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import Card from '../ui/Card'
import Button from '../ui/Button'

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

    const { data: cardData } = await supabase
      .from('cards')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    setCards(cardData || [])

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
        'Informe nome, limite, dia de fechamento e vencimento'
      )
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
    <Card>
      {/* HEADER */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <h2 style={{ fontSize: 18 }}>Cartões</h2>

        <Button
          variant="ghost"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancelar' : 'Novo cartão'}
        </Button>
      </div>

      {/* FORM */}
      {showForm && (
        <Card style={{ marginBottom: 24 }}>
          <form onSubmit={handleSubmit}>
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

            <div
              style={{
                display: 'flex',
                gap: 12,
              }}
            >
              <input
                type="number"
                placeholder="Fechamento"
                value={closingDay}
                onChange={e =>
                  setClosingDay(e.target.value)
                }
              />

              <input
                type="number"
                placeholder="Vencimento"
                value={dueDay}
                onChange={e =>
                  setDueDay(e.target.value)
                }
              />
            </div>

            <Button type="submit">
              Salvar cartão
            </Button>
          </form>
        </Card>
      )}

      {/* LISTA */}
      {cards.length === 0 && (
        <p className="text-muted">
          Nenhum cartão cadastrado.
        </p>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(auto-fill, minmax(260px, 1fr))',
          gap: 16,
        }}
      >
        {cards.map(card => {
          const limitValue = Number(
            card.limit_amount || 0
          )
          const used = Number(usage[card.id] || 0)
          const available = limitValue - used
          const percent =
            limitValue > 0
              ? Math.round((used / limitValue) * 100)
              : 0

          let barColor = 'var(--success)'
          if (percent > 70) barColor = 'var(--warning)'
          if (percent > 90) barColor = 'var(--danger)'

          return (
            <Card key={card.id}>
              <strong
                style={{
                  fontSize: 16,
                  marginBottom: 6,
                  display: 'block',
                }}
              >
                {card.name}
              </strong>

              <div
                style={{
                  fontSize: 13,
                  color: 'var(--text-muted)',
                  marginBottom: 12,
                }}
              >
                Fecha dia {card.closing_day} · Vence dia{' '}
                {card.due_day}
              </div>

              <div style={{ marginBottom: 8 }}>
                <strong>
                  Limite:{' '}
                  R$ {limitValue.toFixed(2)}
                </strong>
              </div>

              <div
                style={{
                  fontSize: 13,
                  color: 'var(--text-muted)',
                }}
              >
                Usado: R$ {used.toFixed(2)}
              </div>

              <div
                style={{
                  fontSize: 13,
                  color: 'var(--text-muted)',
                  marginBottom: 8,
                }}
              >
                Disponível: R${' '}
                {available.toFixed(2)}
              </div>

              {/* BARRA */}
              <div
                style={{
                  height: 6,
                  width: '100%',
                  background: 'var(--border)',
                  borderRadius: 4,
                  overflow: 'hidden',
                  marginBottom: 6,
                }}
              >
                <div
                  style={{
                    width: `${percent}%`,
                    height: '100%',
                    background: barColor,
                  }}
                />
              </div>

              <small className="text-muted">
                {percent}% do limite usado
              </small>
            </Card>
          )
        })}
      </div>
    </Card>
  )
}
