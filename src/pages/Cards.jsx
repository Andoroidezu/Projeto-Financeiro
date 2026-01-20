import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import Card from '../ui/Card'
import Button from '../ui/Button'

const BANK_THEMES = {
  nubank:   { label: 'Nubank', color: '#8A05BE', bg: 'rgba(138,5,190,0.08)' },
  itau:    { label: 'Itaú', color: '#EC7000', bg: 'rgba(236,112,0,0.08)' },
  bradesco:{ label: 'Bradesco', color: '#CC092F', bg: 'rgba(204,9,47,0.08)' },
  santander:{ label: 'Santander', color: '#EA1D25', bg: 'rgba(234,29,37,0.08)' },
  bb:      { label: 'Banco do Brasil', color: '#F7D117', bg: 'rgba(247,209,23,0.14)' },
  caixa:   { label: 'Caixa', color: '#0066B3', bg: 'rgba(0,102,179,0.08)' },
  inter:   { label: 'Banco Inter', color: '#FF7A00', bg: 'rgba(255,122,0,0.08)' },
  c6:      { label: 'C6 Bank', color: '#000000', bg: 'rgba(0,0,0,0.06)' },
  neon:    { label: 'Neon', color: '#00E88F', bg: 'rgba(0,232,143,0.08)' },
  original:{ label: 'Original', color: '#00A859', bg: 'rgba(0,168,89,0.08)' },
  next:    { label: 'Next', color: '#00FF5F', bg: 'rgba(0,255,95,0.08)' },
  sicredi: { label: 'Sicredi', color: '#00A651', bg: 'rgba(0,166,81,0.08)' },
  sicoob:  { label: 'Sicoob', color: '#003641', bg: 'rgba(0,54,65,0.08)' },
  banrisul:{ label: 'Banrisul', color: '#005CA9', bg: 'rgba(0,92,169,0.08)' },
  pan:     { label: 'Banco Pan', color: '#1E1E1E', bg: 'rgba(30,30,30,0.06)' },
  outro:   { label: 'Outro', color: 'var(--text)', bg: 'var(--bg-hover)' },
}

export default function Cards() {
  const [cards, setCards] = useState([])
  const [usage, setUsage] = useState({})

  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [limit, setLimit] = useState('')
  const [closingDay, setClosingDay] = useState('')
  const [dueDay, setDueDay] = useState('')
  const [bank, setBank] = useState('outro')

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

    // 🔒 NORMALIZAÇÃO CRÍTICA
    const normalized = (cardData || []).map(c => ({
      ...c,
      bank: c.bank && BANK_THEMES[c.bank] ? c.bank : 'outro',
    }))

    setCards(normalized)

    const { data: txData } = await supabase
      .from('transactions')
      .select('card_id, amount')
      .eq('user_id', user.id)
      .not('card_id', 'is', null)
      .eq('paid', false)

    const usedMap = {}
    txData?.forEach(t => {
      usedMap[t.card_id] =
        (usedMap[t.card_id] || 0) + Math.abs(Number(t.amount))
    })

    setUsage(usedMap)
  }

  async function handleSubmit(e) {
    e.preventDefault()

    if (!name || !limit || !closingDay || !dueDay) return

    const {
      data: { user },
    } = await supabase.auth.getUser()

    await supabase.from('cards').insert({
      user_id: user.id,
      name,
      limit_amount: Number(limit),
      closing_day: Number(closingDay),
      due_day: Number(dueDay),
      bank,
    })

    setName('')
    setLimit('')
    setClosingDay('')
    setDueDay('')
    setBank('outro')
    setShowForm(false)

    fetchCards()
  }

  return (
    <Card>
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

      {showForm && (
        <Card style={{ marginBottom: 24 }}>
          <form onSubmit={handleSubmit}>
            <input
              placeholder="Nome do cartão"
              value={name}
              onChange={e => setName(e.target.value)}
            />

            <select
              value={bank}
              onChange={e => setBank(e.target.value)}
            >
              {Object.entries(BANK_THEMES).map(
                ([key, b]) => (
                  <option key={key} value={key}>
                    {b.label}
                  </option>
                )
              )}
            </select>

            <input
              type="number"
              placeholder="Limite"
              value={limit}
              onChange={e => setLimit(e.target.value)}
            />

            <div style={{ display: 'flex', gap: 12 }}>
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
          const limitValue = Number(card.limit_amount || 0)
          const used = Number(usage[card.id] || 0)
          const available = limitValue - used
          const percent =
            limitValue > 0
              ? Math.round((used / limitValue) * 100)
              : 0

          let barColor = 'var(--success)'
          if (percent > 70) barColor = 'var(--warning)'
          if (percent > 90) barColor = 'var(--danger)'

          const theme = BANK_THEMES[card.bank]

          return (
            <Card
              key={card.id}
              style={{
                background: theme.bg,
                borderLeft: `4px solid ${theme.color}`,
              }}
            >
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
                  Limite: R$ {limitValue.toFixed(2)}
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
                Disponível: R$ {available.toFixed(2)}
              </div>

              <div
                style={{
                  height: 6,
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
