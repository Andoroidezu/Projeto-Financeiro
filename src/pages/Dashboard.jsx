import { useEffect, useState } from 'react'
import { supabase } from '../supabase'

import Layout from '../components/Layout'
import Home from './Home'
import Transactions from './Transactions'
import Cards from './Cards'
import CardInvoice from './CardInvoice'
import MonthlyReport from './MonthlyReport'
import SporadicTransaction from './SporadicTransaction'
import CardExpense from './CardExpense'
import Settings from './Settings'

export default function Dashboard() {
  const [page, setPage] = useState('home')

  const [currentMonth, setCurrentMonth] = useState(
    new Date().toISOString().slice(0, 7)
  )

  const [activeCardId, setActiveCardId] = useState(null)
  const [refreshBalance, setRefreshBalance] = useState(0)

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

    if (data) setActiveCardId(data.id)
  }

  return (
    <Layout
      page={page}
      setPage={setPage}
      currentMonth={currentMonth}
      setCurrentMonth={setCurrentMonth}
    >
      {page === 'home' && (
        <Home currentMonth={currentMonth} />
      )}

      {page === 'report' && (
        <MonthlyReport currentMonth={currentMonth} />
      )}

      {page === 'transactions' && (
        <Transactions
          currentMonth={currentMonth}
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
          setCurrentMonth={setCurrentMonth}
          setPage={setPage}
          setRefreshBalance={setRefreshBalance}
        />
      )}

      {page === 'sporadic' && (
        <SporadicTransaction
          currentMonth={currentMonth}
          setRefreshBalance={setRefreshBalance}
        />
      )}

      {page === 'card-expense' && (
        <CardExpense
          setRefreshBalance={setRefreshBalance}
        />
      )}

      {page === 'settings' && <Settings />}
    </Layout>
  )
}
