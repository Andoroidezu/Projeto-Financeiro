import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import Layout from '../components/Layout'

import Commitments from './Commitments'
import Transactions from './Transactions'
import Cards from './Cards'
import CardExpense from './CardExpense'
import CardInvoice from './CardInvoice'
import MonthlyReport from './MonthlyReport'
import SporadicTransaction from './SporadicTransaction'

export default function Dashboard({
  currentMonth,
  setCurrentMonth,
  refreshBalance,
  setRefreshBalance,
}) {
  const [page, setPage] = useState('home')

  // ⚠️ avisos
  const [hasPendingTransactions, setHasPendingTransactions] =
    useState(false)
  const [hasOpenInvoice, setHasOpenInvoice] =
    useState(false)

  useEffect(() => {
    checkPendingTransactions()
  }, [currentMonth, refreshBalance])

  async function checkPendingTransactions() {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const [year, m] = currentMonth.split('-')
    const start = new Date(year, m - 1, 1)
    const nextMonth = new Date(year, m, 1)

    // ⚠️ qualquer saída não paga (dinheiro OU cartão)
    const { data, error } = await supabase
      .from('transactions')
      .select('id, paid, type')
      .eq('user_id', user.id)
      .neq('type', 'entrada')
      .eq('paid', false)
      .gte('date', start.toISOString().slice(0, 10))
      .lt('date', nextMonth.toISOString().slice(0, 10))

    if (error) {
      console.error(error)
      setHasPendingTransactions(false)
      return
    }

    setHasPendingTransactions((data || []).length > 0)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
  }

  return (
    <Layout
      currentMonth={currentMonth}
      setCurrentMonth={setCurrentMonth}
      refreshBalance={refreshBalance}
    >
      <div className="card">
        <h2>Dashboard</h2>

        <div className="button-group">
          <button onClick={() => setPage('commitments')}>
            Compromissos
          </button>

          <button onClick={() => setPage('transactions')}>
            Lançamentos{' '}
            {hasPendingTransactions && '⚠️'}
          </button>

          <button onClick={() => setPage('sporadic')}>
            Lançamento esporádico
          </button>

          <button onClick={() => setPage('cards')}>
            Cartões
          </button>

          <button onClick={() => setPage('card-expense')}>
            Despesa no cartão
          </button>

          <button onClick={() => setPage('invoice')}>
            Fatura do cartão{' '}
            {hasOpenInvoice && '⚠️'}
          </button>

          <button onClick={() => setPage('report')}>
            Relatório
          </button>

          <button onClick={handleLogout}>Sair</button>
        </div>
      </div>

      {page === 'commitments' && (
        <Commitments
          currentMonth={currentMonth}
          setRefreshBalance={setRefreshBalance}
        />
      )}

      {page === 'transactions' && (
        <Transactions
          currentMonth={currentMonth}
          setRefreshBalance={setRefreshBalance}
        />
      )}

      {page === 'sporadic' && (
        <SporadicTransaction
          currentMonth={currentMonth}
          setRefreshBalance={setRefreshBalance}
        />
      )}

      {page === 'cards' && <Cards />}

      {page === 'card-expense' && (
        <CardExpense
          currentMonth={currentMonth}
          setRefreshBalance={setRefreshBalance}
        />
      )}

      {page === 'invoice' && (
        <CardInvoice
          currentMonth={currentMonth}
          setRefreshBalance={setRefreshBalance}
          setHasOpenInvoice={setHasOpenInvoice}
        />
      )}

      {page === 'report' && (
        <MonthlyReport currentMonth={currentMonth} />
      )}
    </Layout>
  )
}
