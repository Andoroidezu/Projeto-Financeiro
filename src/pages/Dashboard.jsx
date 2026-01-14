import { useEffect, useState } from 'react'
import { supabase } from '../supabase'

import Layout from '../components/Layout'
import Transactions from './Transactions'
import Cards from './Cards'
import CardInvoice from './CardInvoice'
import MonthlyReport from './MonthlyReport'
import Commitments from './Commitments'
import SporadicTransaction from './SporadicTransaction'
import CardExpense from './CardExpense'

/*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧭 GUIA — DASHBOARD (ESTADO GLOBAL)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Este arquivo é o "cérebro" do app.

Responsabilidades:
- Controlar página ativa
- Controlar mês ativo
- Controlar cartão ativo (IMPORTANTÍSSIMO)
- Forçar refresh de dados após ações críticas

REGRA:
Qualquer página que dependa de cartão
DEVE receber activeCardId daqui.
*/

export default function Dashboard() {
  const [page, setPage] = useState('home')

  const [currentMonth, setCurrentMonth] = useState(
    new Date().toISOString().slice(0, 7)
  )

  const [activeCardId, setActiveCardId] = useState(null)

  const [refreshBalance, setRefreshBalance] = useState(0)

  // 🔹 Buscar cartão ativo inicial
  useEffect(() => {
    fetchDefaultCard()
  }, [])

  async function fetchDefaultCard() {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('cards')
      .select('id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(1)
      .single()

    if (data) {
      setActiveCardId(data.id)
    }
  }

  return (
    <Layout
      page={page}
      setPage={setPage}
      currentMonth={currentMonth}
      setCurrentMonth={setCurrentMonth}
    >
      {page === 'home' && (
        <MonthlyReport
          currentMonth={currentMonth}
          refreshBalance={refreshBalance}
        />
      )}

      {page === 'transactions' && (
        <Transactions
          currentMonth={currentMonth}
          activeCardId={activeCardId}
          setActiveCardId={setActiveCardId}
          refreshBalance={refreshBalance}
          setRefreshBalance={setRefreshBalance}
        />
      )}

      {page === 'cards' && (
        <Cards
          activeCardId={activeCardId}
          setActiveCardId={setActiveCardId}
        />
      )}

      {page === 'invoice' && (
        <CardInvoice
          currentMonth={currentMonth}
          activeCardId={activeCardId}
          setRefreshBalance={setRefreshBalance}
        />
      )}

      {page === 'commitments' && (
        <Commitments
          setRefreshBalance={setRefreshBalance}
        />
      )}

      {page === 'sporadic' && (
        <SporadicTransaction
          setRefreshBalance={setRefreshBalance}
        />
      )}

      {page === 'card-expense' && (
        <CardExpense
          setRefreshBalance={setRefreshBalance}
        />
      )}

      {page === 'report' && (
        <MonthlyReport
          currentMonth={currentMonth}
          refreshBalance={refreshBalance}
        />
      )}
    </Layout>
  )
}
