import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import Card from '../ui/Card'
import Button from '../ui/Button'
import { useToast } from '../ui/ToastProvider'
import { useDebug } from '../debug/DebugProvider'

/*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧭 GUIA — COMPRA PARCELADA (PROTEÇÃO UX)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Problema resolvido aqui:
- Clique múltiplo criando dezenas de parcelas

Solução:
- isSubmitting trava ação
- botão desabilitado
- loading visível
- UX segura mesmo com backend lento

Nunca remover essas proteções.
*/

export default function CardExpense({ setRefreshBalance }) {
  const [cards, setCards] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [installments, setInstallments] = useState(1)
  const [cardId, setCardId] = useState('')

  const { showToast } = useToast()
  const debug = useDebug()

  useEffect(() => {
    fetchCards()
  }, [])

  async function fetchCards() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('cards')
      .select('*')
      .eq('user_id', user.id)

    setCards(data || [])
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (isSubmitting) return

    if (!description || !amount || !cardId) {
      showToast('Preencha todos os campos', 'warning')
      return
    }

    setIsSubmitting(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const total = Number(amount)
    const perInstallment = Number((total / installments).toFixed(2))
    const groupId = crypto.randomUUID()

    try {
      for (let i = 0; i < installments; i++) {
        const date = new Date()
        date.setMonth(date.getMonth() + i)

        const { data: tx, error: txError } = await supabase
          .from('transactions')
          .insert({
            user_id: user.id,
            name: description,
            amount: perInstallment,
            type: 'saida',
            date: date.toISOString().slice(0, 10),
            paid: false,
            card_id: cardId,
          })
          .select()
          .single()

        if (txError) throw txError

        const { error: instError } = await supabase
          .from('installments')
          .insert({
            transaction_id: tx.id,
            group_id: groupId,
            installment_number: i + 1,
            total_installments: installments,
          })

        if (instError) throw instError
      }

      showToast('Compra parcelada criada', 'success')
      setShowForm(false)
      setDescription('')
      setAmount('')
      setInstallments(1)
      setCardId('')
      setRefreshBalance(v => v + 1)
    } catch (err) {
      debug?.log('Erro compra parcelada', err)
      showToast(err.message, 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div style={{ maxWidth: 760 }}>
      <Card>
        <h2>Compra parcelada</h2>
        <p className="text-muted">
          Compras no cartão divididas em parcelas.
        </p>
      </Card>

      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <strong>Criar compra</strong>
          <Button variant="ghost" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancelar' : 'Nova'}
          </Button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit}>
            <input placeholder="Descrição" value={description} onChange={e => setDescription(e.target.value)} />
            <input type="number" placeholder="Valor total" value={amount} onChange={e => setAmount(e.target.value)} />
            <input type="number" min={1} placeholder="Parcelas" value={installments} onChange={e => setInstallments(Number(e.target.value))} />

            <select value={cardId} onChange={e => setCardId(e.target.value)}>
              <option value="">Selecione o cartão</option>
              {cards.map(card => (
                <option key={card.id} value={card.id}>{card.name}</option>
              ))}
            </select>

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Processando…' : 'Salvar compra'}
            </Button>
          </form>
        )}
      </Card>
    </div>
  )
}
