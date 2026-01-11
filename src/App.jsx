import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'

function App() {
  const [session, setSession] = useState(null)

  const [currentMonth, setCurrentMonth] = useState(
    new Date().toISOString().slice(0, 7)
  )

  // 🔔 GATILHO DE ATUALIZAÇÃO DO SALDO
  const [refreshBalance, setRefreshBalance] = useState(0)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (!session) return <Login />

  return (
    <Dashboard
      currentMonth={currentMonth}
      setCurrentMonth={setCurrentMonth}
      refreshBalance={refreshBalance}
      setRefreshBalance={setRefreshBalance}
    />
  )
}

export default App
