import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import Card from '../ui/Card'
import Button from '../ui/Button'
import { useToast } from '../ui/ToastProvider'

/*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧭 GUIA DE CONTEXTO — LANÇAMENTO ÚNICO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Esta página segue o PADRÃO definido em "Recorrentes".

Objetivo:
- Criar lançamentos pontuais (não recorrentes)
- Entradas ou saídas únicas
- Ex: conserto, compra eventual, renda extra

Estrutura obrigatória:
1. Header explicando o que é e quando usar
2. Ação principal clara (criar lançamento)
3. Histórico separado, sem competir visualmente

Se esta página parecer "simples":
👉 isso é intencional
👉 simplicidade + clareza = produto profissional
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

    const today = new Date()
      .toISOString()
      .slice(0, 10)

    const { error } = await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        name,
        amount: Number(amount),
        type,
        date: today,
        paid: true,
        card_id: null,
      })

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
            />

            <input
              type="number"
              placeholder="Valor"
              value={amount}
              onChange={e =>
                setAmount(e.target.value)
              }
            />

            <select
              value={type}
              onChange={e => setType(e.target.value)}
            >
              <option value="saida">Saída</option>
              <option value="entrada">
                Entrada
              </option>
            </select>

            <Button type="submit">
              Salvar lançamento
            </Button>
          </form>
        )}
      </Card>

      {/* HISTÓRICO */}
      <Card>
        <strong style={{ display: 'block', marginBottom: 12 }}>
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
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 12px',
                borderRadius: 6,
                background: 'var(--bg-hover)',
                border: '1px solid var(--border)',
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

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <strong>
                  R$ {item.amount.toFixed(2)}
                </strong>

                <Button
                  variant="ghost"
                  onClick={() =>
                    handleDelete(item.id)
                  }
                >
                  ✕
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
