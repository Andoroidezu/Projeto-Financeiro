import { useState } from 'react'
import { supabase } from '../supabase'

export default function SporadicTransaction({
  currentMonth,
  setRefreshBalance
}) {
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [type, setType] = useState('saida')
  const [day, setDay] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const date = `${currentMonth}-${String(day).padStart(2, '0')}`

    const { error } = await supabase.from('transactions').insert({
      user_id: user.id,
      name: description,
      amount: Number(amount),
      type,
      date,
    })

    if (!error) {
      setDescription('')
      setAmount('')
      setDay('')
      setType('saida')
      setRefreshBalance(v => v + 1) // 🔔
    }
  }

  return (
    <div className="card">
      <h2>Lançamento esporádico</h2>

      <form onSubmit={handleSubmit} className="card">
        <input
          placeholder="Descrição"
          value={description}
          onChange={e => setDescription(e.target.value)}
        />

        <input
          type="number"
          step="0.01"
          placeholder="Valor"
          value={amount}
          onChange={e => setAmount(e.target.value)}
        />

        <select
          value={type}
          onChange={e => setType(e.target.value)}
        >
          <option value="saida">Despesa</option>
          <option value="entrada">Entrada</option>
        </select>

        <input
          type="number"
          placeholder="Dia do mês"
          value={day}
          onChange={e => setDay(e.target.value)}
        />

        <button type="submit">Salvar</button>
      </form>
    </div>
  )
}
