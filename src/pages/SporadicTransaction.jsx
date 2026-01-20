import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import Card from '../ui/Card'
import Button from '../ui/Button'
import { useToast } from '../ui/ToastProvider'

/*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧭 LANÇAMENTO ÚNICO — UX SEGURA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Correções:
- Bloqueia múltiplos submits
- Entrada e saída têm o mesmo comportamento
- Evita criação duplicada
*/

export default function SporadicTransaction({
  currentMonth,
  setRefreshBalance,
}) {
  const [items, setItems] = useState([])
  const [showForm, setShowForm] = useState(false)

  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [type, setType] = useState('saida')
  const [loading, setLoading] = useState(false)

  const { showToast } = useToast()

  useEffect(() => {
    fetchData()
  }, [currentMonth])

  async function fetchData() {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const [year, m] = currentMonth.split('-')
    const start = new Date(year, m - 1, 1)
    const nextMonth = new Date(year, m, 1)

    const { data } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .is('card_id', null)
      .gte('date', start.toISOString().slice(0, 10))
      .lt('date', nextMonth.toISOString().slice(0, 10))
      .order('date', { ascending: false })

    setItems(data || [])
  }

  async function handleSubmit(e) {
    e.preventDefault()

    // 🔒 trava contra clique múltiplo
    if (loading) return

    if (!name || !amount) {
      showToast(
        'Informe nome e valor do lançamento',
        'warning'
      )
      return
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const rawValue = Math.abs(Number(amount))
    if (Number.isNaN(rawValue)) return

    const finalAmount =
      type === 'entrada'
        ? rawValue
        : -rawValue

    const paid =
      type === 'entrada' ? true : false

    const today = new Date()
      .toISOString()
      .slice(0, 10)

    setLoading(true)

    const { error } = await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        name,
        amount: finalAmount,
        type,
        date: today,
        paid,
        card_id: null,
      })

    setLoading(false)

    if (error) {
      showToast(
        'Erro ao criar lançamento',
        'error'
      )
      return
    }

    showToast(
      'Lançamento criado com sucesso',
      'success'
    )

    setName('')
    setAmount('')
    setType('saida')
    setShowForm(false)

    setRefreshBalance(v => v + 1)
    fetchData()
  }

  async function handleDelete(id) {
    if (
      !window.confirm(
        'Deseja remover este lançamento?'
      )
    )
      return

    await supabase
      .from('transactions')
      .delete()
      .eq('id', id)

    showToast('Lançamento removido', 'success')
    fetchData()
  }

  return (
    <div style={{ maxWidth: 720 }}>
      {/* HEADER */}
      <Card>
        <h2 style={{ fontSize: 20, marginBottom: 6 }}>
          Lançamento único
        </h2>
        <p className="text-muted">
          Entradas ou saídas pontuais que não se
          repetem e não fazem parte do cartão.
        </p>
      </Card>

      {/* AÇÃO PRINCIPAL */}
      <Card>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: showForm ? 12 : 0,
          }}
        >
          <strong>Criar lançamento</strong>

          <Button
            variant="ghost"
            onClick={() => setShowForm(!showForm)}
            disabled={loading}
          >
            {showForm ? 'Cancelar' : 'Novo'}
          </Button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit}>
            <input
              placeholder="Descrição"
              value={name}
              onChange={e => setName(e.target.value)}
              disabled={loading}
            />

            <input
              type="number"
              placeholder="Valor"
              value={amount}
              onChange={e =>
                setAmount(e.target.value)
              }
              disabled={loading}
            />

            <select
              value={type}
              onChange={e => setType(e.target.value)}
              disabled={loading}
            >
              <option value="saida">Saída</option>
              <option value="entrada">
                Entrada
              </option>
            </select>

            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando…' : 'Salvar lançamento'}
            </Button>
          </form>
        )}
      </Card>

      {/* HISTÓRICO */}
      <Card>
        <strong
          style={{
            display: 'block',
            marginBottom: 12,
          }}
        >
          Lançamentos do mês
        </strong>

        {items.length === 0 && (
          <p className="text-muted">
            Nenhum lançamento criado neste mês.
          </p>
        )}

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          {items.map(item => (
            <div
              key={item.id}
              style={{
                display: 'flex',
                justifyContent:
                  'space-between',
                alignItems: 'center',
                padding: '10px 12px',
                borderRadius: 6,
                background:
                  'var(--bg-hover)',
                border:
                  '1px solid var(--border)',
              }}
            >
              <div>
                <strong>{item.name}</strong>
                <div
                  className="text-muted"
                  style={{ fontSize: 12 }}
                >
                  {item.type === 'entrada'
                    ? 'Entrada pontual'
                    : 'Saída pontual'}
                </div>
              </div>

              <strong
                style={{
                  color:
                    item.amount > 0
                      ? 'var(--success)'
                      : 'var(--danger)',
                }}
              >
                {item.amount > 0 ? '+' : '-'} R${' '}
                {Math.abs(item.amount).toFixed(
                  2
                )}
              </strong>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
