import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import Card from '../ui/Card'
import Button from '../ui/Button'
import { useToast } from '../ui/ToastProvider'

/*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧭 GUIA DE CONTEXTO — PÁGINA RECORRENTES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Esta página é o MODELO de UX do app.

Objetivo:
- Gerenciar despesas/entradas recorrentes (mensais)
- Ex: aluguel, internet, salário, assinaturas

Padrão adotado aqui:
1. Header com contexto (o que é / quando usar)
2. Ação principal clara (criar recorrente)
3. Lista separada, sem competir visualmente

Se esta página estiver bem:
👉 Esporádicos e Compra parcelada devem copiar este formato
*/

export default function Commitments({
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

    const { data } = await supabase
      .from('commitments')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    setItems(data || [])
  }

  async function handleSubmit(e) {
    e.preventDefault()

    if (!name || !amount) {
      showToast(
        'Informe nome e valor do recorrente',
        'warning'
      )
      return
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { error } = await supabase
      .from('commitments')
      .insert({
        user_id: user.id,
        name,
        amount: Number(amount),
        type,
      })

    if (error) {
      showToast('Erro ao criar recorrente', 'error')
      return
    }

    showToast('Recorrente criado com sucesso', 'success')

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
        'Deseja remover este recorrente?'
      )
    )
      return

    await supabase
      .from('commitments')
      .delete()
      .eq('id', id)

    showToast('Recorrente removido', 'success')
    fetchData()
  }

  return (
    <div style={{ maxWidth: 720 }}>
      {/* HEADER */}
      <Card>
        <h2 style={{ fontSize: 20, marginBottom: 6 }}>
          Recorrentes
        </h2>
        <p className="text-muted">
          Entradas e saídas que se repetem todo
          mês, como aluguel, salário ou
          assinaturas.
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
          <strong>Criar recorrente</strong>

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
              placeholder="Nome"
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
              Salvar recorrente
            </Button>
          </form>
        )}
      </Card>

      {/* LISTA */}
      <Card>
        <strong style={{ display: 'block', marginBottom: 12 }}>
          Recorrentes cadastrados
        </strong>

        {items.length === 0 && (
          <p className="text-muted">
            Nenhum recorrente cadastrado.
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
                    ? 'Entrada mensal'
                    : 'Saída mensal'}
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
