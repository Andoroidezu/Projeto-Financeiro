import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale
)

export default function MonthlyReport({ currentMonth }) {
  const [transactions, setTransactions] = useState([])
  const [prevBalance, setPrevBalance] = useState(null)

  const [totalIn, setTotalIn] = useState(0)
  const [totalOut, setTotalOut] = useState(0)
  const [largestExpense, setLargestExpense] = useState(null)
  const [negativeDays, setNegativeDays] = useState(0)

  useEffect(() => {
    fetchReport()
    fetchPreviousMonth()
  }, [currentMonth])

  async function fetchReport() {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const [year, m] = currentMonth.split('-')
    const start = new Date(year, m - 1, 1)
    const nextMonth = new Date(year, m, 1)

    const { data } = await supabase
      .from('transactions')
      .select('id, name, date, amount, type, card_id')
      .eq('user_id', user.id)
      .gte('date', start.toISOString().slice(0, 10))
      .lt('date', nextMonth.toISOString().slice(0, 10))
      .order('date', { ascending: true })

    setTransactions(data || [])

    let income = 0
    let expense = 0
    let biggest = null
    let balance = 0
    const negativeDates = new Set()

    data.forEach(t => {
      if (t.amount === null) return

      const value = Number(t.amount)

      if (t.type === 'entrada') {
        income += value
        balance += value
      } else {
        expense += value
        balance -= value

        if (
          !t.card_id &&
          (!biggest || value > biggest.amount)
        ) {
          biggest = t
        }
      }

      if (balance < 0) {
        negativeDates.add(t.date)
      }
    })

    setTotalIn(income)
    setTotalOut(expense)
    setLargestExpense(biggest)
    setNegativeDays(negativeDates.size)
  }

  async function fetchPreviousMonth() {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const [year, m] = currentMonth.split('-')
    const prevStart = new Date(year, m - 2, 1)
    const prevEnd = new Date(year, m - 1, 1)

    const { data } = await supabase
      .from('transactions')
      .select('amount, type')
      .eq('user_id', user.id)
      .gte('date', prevStart.toISOString().slice(0, 10))
      .lt('date', prevEnd.toISOString().slice(0, 10))

    let balance = 0
    data?.forEach(t => {
      if (t.amount === null) return
      balance +=
        t.type === 'entrada'
          ? t.amount
          : -t.amount
    })

    setPrevBalance(balance)
  }

  const balance = totalIn - totalOut

  const variation =
    prevBalance !== null && prevBalance !== 0
      ? ((balance - prevBalance) / Math.abs(prevBalance)) *
        100
      : null

  function buildChartData() {
    let running = 0
    const labels = []
    const values = []

    transactions.forEach(t => {
      if (t.amount === null) return
      running +=
        t.type === 'entrada'
          ? t.amount
          : -t.amount
      labels.push(t.date)
      values.push(running)
    })

    return {
      labels,
      datasets: [
        {
          label: 'Saldo acumulado',
          data: values,
          borderColor: '#22c55e',
          backgroundColor: 'transparent',
          tension: 0.3,
        },
      ],
    }
  }

  return (
    <div className="card">
      <h2>Relatório</h2>

      {/* RESUMO */}
      <div className="summary-row">
        <div>
          <span>Entradas</span>
          <strong className="positive">
            R$ {totalIn.toFixed(2)}
          </strong>
        </div>

        <div>
          <span>Saídas</span>
          <strong className="negative">
            R$ {totalOut.toFixed(2)}
          </strong>
        </div>

        <div>
          <span>Saldo</span>
          <strong
            className={balance >= 0 ? 'positive' : 'negative'}
          >
            R$ {balance.toFixed(2)}
          </strong>
        </div>
      </div>

      {/* MÉTRICAS */}
      <div className="summary-row">
        <div>
          <span>Variação vs mês anterior</span>
          {variation === null ? (
            <strong>—</strong>
          ) : (
            <strong
              className={variation >= 0 ? 'positive' : 'negative'}
            >
              {variation >= 0 ? '▲' : '▼'}{' '}
              {Math.abs(variation).toFixed(1)}%
            </strong>
          )}
        </div>

        <div>
          <span>Maior gasto</span>
          <strong>
            {largestExpense
              ? `${largestExpense.name} — R$ ${largestExpense.amount}`
              : '—'}
          </strong>
        </div>

        <div>
          <span>Dias no negativo</span>
          <strong>{negativeDays}</strong>
        </div>
      </div>

      {/* GRÁFICO */}
      <div className="chart-container">
        <Line data={buildChartData()} />
      </div>
    </div>
  )
}
