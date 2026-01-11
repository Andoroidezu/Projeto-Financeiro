import { useEffect, useState } from 'react'
import { supabase } from '../supabase'

export default function Commitments({
  currentMonth,
  setRefreshBalance,
}) {
  const [commitments, setCommitments] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)

  const [name, setName] = useState('')
  const [expectedDay, setExpectedDay] = useState('')
  const [isVariable, setIsVariable] = useState(true)
  const [defaultAmount, setDefaultAmount] = useState('')

  useEffect(() => {
    fetchCommitments()
  }, [])

  async function fetchCommitments() {
    const { data, error } = await supabase
      .from('commitments')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error) setCommitments(data || [])
  }

  function startEdit(item) {
    setEditingId(item.id)
    setName(item.name)
    setExpectedDay(item.expected_day)
    setIsVariable(item.is_variable)
    setDefaultAmount(item.default_amount ?? '')
    setShowForm(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()

    if (!name || !expectedDay) {
      alert('Preencha nome e dia')
      return
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const payload = {
      user_id: user.id,
      name,
      expected_day: Number(expectedDay),
      is_variable: isVariable,
      default_amount: isVariable ? null : Number(defaultAmount),
      type: 'saida',
    }

    let error

    if (editingId) {
      ;({ error } = await supabase
        .from('commitments')
        .update(payload)
        .eq('id', editingId))
    } else {
      ;({ error } = await supabase
        .from('commitments')
        .insert(payload))
    }

    if (error) {
      alert(error.message)
      return
    }

    // reset form
    setName('')
    setExpectedDay('')
    setDefaultAmount('')
    setIsVariable(true)
    setEditingId(null)
    setShowForm(false)

    fetchCommitments()
  }

  async function handleDelete(id) {
    if (!window.confirm('Deseja excluir este compromisso?')) return

    const { error } = await supabase
      .from('commitments')
      .delete()
      .eq('id', id)

    if (error) {
      alert(error.message)
      return
    }

    fetchCommitments()
  }

  // 🔹 GERAR LANÇAMENTOS DO MÊS (corrigido)
  async function generateMonthlyTransactions() {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const [year, month] = currentMonth.split('-')

    const start = new Date(year, month - 1, 1)
    const nextMonth = new Date(year, month, 1)

    // buscar lançamentos já existentes no mês DO PRÓPRIO USUÁRIO
    const { data: existing } = await supabase
      .from('transactions')
      .select('commitment_id')
      .eq('user_id', user.id) // <<< ESSENCIAL
      .gte('date', start.toISOString().slice(0, 10))
      .lt('date', nextMonth.toISOString().slice(0, 10))

    const existingIds = new Set(
      (existing || []).map(t => t.commitment_id)
    )

    const inserts = commitments
      .filter(c => !existingIds.has(c.id))
      .map(c => ({
        user_id: user.id,
        name: `${c.name} ${month}/${year}`,
        amount: c.is_variable ? null : c.default_amount,
        type: c.type,
        date: `${year}-${month}-${String(c.expected_day).padStart(2, '0')}`,
        commitment_id: c.id,
        paid: false,
      }))

    if (inserts.length === 0) {
      alert('Os lançamentos deste mês já foram gerados.')
      return
    }

    const { error } = await supabase
      .from('transactions')
      .insert(inserts)

    if (error) {
      alert('Erro ao gerar: ' + error.message)
      return
    }

    setRefreshBalance(v => v + 1)
    alert('Lançamentos gerados com sucesso!')
  }

  return (
    <div className="card">
      <h2>Compromissos Mensais</h2>

      {/* BOTÃO GERAR LANÇAMENTOS */}
      <div className="button-group">
        <button onClick={generateMonthlyTransactions}>
          Gerar lançamentos do mês
        </button>

        <button onClick={() => setShowForm(!showForm)}>
          {showForm
            ? 'Cancelar'
            : editingId
            ? 'Editando compromisso'
            : 'Novo compromisso'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card">
          <input
            placeholder="Nome (ex: Luz, Internet)"
            value={name}
            onChange={e => setName(e.target.value)}
          />

          <input
            type="number"
            placeholder="Dia esperado do mês"
            value={expectedDay}
            onChange={e => setExpectedDay(e.target.value)}
          />

          <label>
            <input
              type="checkbox"
              checked={isVariable}
              onChange={e => setIsVariable(e.target.checked)}
            />{' '}
            Valor variável
          </label>

          {!isVariable && (
            <input
              type="number"
              placeholder="Valor fixo"
              value={defaultAmount}
              onChange={e => setDefaultAmount(e.target.value)}
            />
          )}

          <div className="button-group">
            <button type="submit">
              {editingId ? 'Salvar alterações' : 'Salvar'}
            </button>
          </div>
        </form>
      )}

      {commitments.length === 0 && (
        <p>Nenhum compromisso cadastrado.</p>
      )}

      {commitments.map(item => (
        <div key={item.id} className="card">
          <strong>{item.name}</strong>
          <p>Dia esperado: {item.expected_day}</p>
          <p>
            {item.is_variable
              ? 'Valor variável'
              : `Valor fixo: R$ ${item.default_amount}`}
          </p>

          <div className="button-group">
            <button onClick={() => startEdit(item)}>
              Editar
            </button>
            <button onClick={() => handleDelete(item.id)}>
              Excluir
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
