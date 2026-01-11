import { useEffect, useState } from 'react'
import { supabase } from '../supabase'

export default function Layout({
  children,
  currentMonth,
  setCurrentMonth,
  refreshBalance,
}) {
  const [balance, setBalance] = useState(0)

  useEffect(() => {
    calculateBalance()
  }, [currentMonth, refreshBalance]) // 🔴 ESSENCIAL

  async function calculateBalance() {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    const [year, m] = currentMonth.split('-')
    const start = new Date(year, m - 1, 1)
    const nextMonth = new Date(year, m, 1)

    const { data, error } = await supabase
      .from('transactions')
      .select('amount, type')
      .eq('user_id', user.id)
      .gte('date', start.toISOString().slice(0, 10))
      .lt('date', nextMonth.toISOString().slice(0, 10))

    if (error) return

    const total = (data || []).reduce((sum, t) => {
      const value = Number(t.amount || 0)
      return t.type === 'entrada'
        ? sum + value
        : sum - value
    }, 0)

    setBalance(total)
  }

  return (
    <div>
      <header className="card">
        <h2>
          Saldo:{' '}
          <span
            style={{
              color: balance >= 0 ? 'green' : 'red',
            }}
          >
            R$ {balance.toFixed(2)}
          </span>
        </h2>

        <input
          type="month"
          value={currentMonth}
          onChange={e => setCurrentMonth(e.target.value)}
        />
      </header>

      <main>{children}</main>
    </div>
  )
}
