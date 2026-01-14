import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import Card from '../ui/Card'

import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip
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
      .select('name, date, amount, type, card_id')
      .eq('user_id', user.id)
      .gte('date', start.toISOString().slice(0, 10))
      .lt('date', nextMonth.toISOString().slice(0, 10))
      .order('date', { ascending: true })

    const list = data || []
    setTransactions(list)

    let income = 0
    let expense = 0
    let balance = 0
    let biggest = null
    const negativeDates = new Set()

    list.forEach(t => {
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

      if (balance < 0) negativeDates.add(t.date)
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
      if (!t.amount) return
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
      ? ((balance - prevBalance) /
          Math.abs(prevBalance)) *
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
          data: values,
          borderColor: '#6366f1',
          backgroundColor: 'transparent',
          tension: 0.3,
          pointRadius: 0,
        },
      ],
    }
  }

  return (
    <Card>
      <h2 style={{ fontSize: 18, marginBottom: 16 }}>
        Relatório mensal
      </h2>

      {/* KPIs */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <Metric
          label="Entradas"
          value={`R$ ${totalIn.toFixed(2)}`}
          color="var(--success)"
        />

        <Metric
          label="Saídas"
          value={`R$ ${totalOut.toFixed(2)}`}
          color="var(--danger)"
        />

        <Metric
          label="Saldo"
          value={`R$ ${balance.toFixed(2)}`}
          color={
            balance >= 0
              ? 'var(--success)'
              : 'var(--danger)'
          }
        />

        <Metric
          label="Variação mensal"
          value={
            variation === null
              ? '—'
              : `${variation >= 0 ? '▲' : '▼'} ${Math.abs(
                  variation
                ).toFixed(1)}%`
          }
          color={
            variation >= 0
              ? 'var(--success)'
              : 'var(--danger)'
          }
        />
      </div>

      {/* INSIGHTS */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <Insight
          title="Maior gasto (fora cartão)"
          value={
            largestExpense
              ? `${largestExpense.name} — R$ ${largestExpense.amount}`
              : '—'
          }
        />

        <Insight
          title="Dias no negativo"
          value={negativeDays}
        />
      </div>

      {/* GRÁFICO */}
      <Card>
        <Line
          data={buildChartData()}
          options={{
            responsive: true,
            plugins: {
              legend: { display: false },
            },
            scales: {
              x: {
                ticks: { color: '#9ca3af' },
                grid: { display: false },
              },
              y: {
                ticks: { color: '#9ca3af' },
                grid: {
                  color: 'rgba(255,255,255,0.05)',
                },
              },
            },
          }}
        />
      </Card>
    </Card>
  )
}

function Metric({ label, value, color }) {
  return (
    <div>
      <div
        style={{
          fontSize: 12,
          color: 'var(--text-muted)',
        }}
      >
        {label}
      </div>
      <strong
        style={{
          fontSize: 18,
          color,
        }}
      >
        {value}
      </strong>
    </div>
  )
}

function Insight({ title, value }) {
  return (
    <div>
      <div
        style={{
          fontSize: 12,
          color: 'var(--text-muted)',
        }}
      >
        {title}
      </div>
      <strong style={{ fontSize: 15 }}>
        {value}
      </strong>
    </div>
  )
}
