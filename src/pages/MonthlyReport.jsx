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
  const [totalIn, setTotalIn] = useState(0)
  const [totalOut, setTotalOut] = useState(0)

  useEffect(() => {
    fetchReport()
  }, [currentMonth])

  async function fetchReport() {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const [year, m] = currentMonth.split('-')

    const start = new Date(year, m - 1, 1)
    const nextMonth = new Date(year, m, 1)

    const { data, error } = await supabase
      .from('transactions')
      .select('id, name, date, amount, type')
      .eq('user_id', user.id)
      .gte('date', start.toISOString().slice(0, 10))
      .lt('date', nextMonth.toISOString().slice(0, 10))
      .order('date', { ascending: true })

    if (error) return

    setTransactions(data || [])

    let income = 0
    let expense = 0

    data.forEach(t => {
      if (t.amount === null) return
      if (t.type === 'entrada') income += t.amount
      else expense += t.amount
    })

    setTotalIn(income)
    setTotalOut(expense)
  }

  const balance = totalIn - totalOut

  function buildChartData() {
    let runningBalance = 0
    const labels = []
    const values = []

    transactions.forEach(t => {
      if (t.amount === null) return

      const value = Number(t.amount)
      runningBalance +=
        t.type === 'entrada' ? value : -value

      labels.push(t.date)
      values.push(runningBalance)
    })

    return {
      labels,
      datasets: [
        {
          label: 'Saldo acumulado',
          data: values,
          borderColor: '#4ade80',
          backgroundColor: 'transparent',
          tension: 0.3,
        },
      ],
    }
  }

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        grid: {
          color: ctx =>
            ctx.tick.value === 0 ? '#666' : '#333',
        },
      },
    },
  }

  return (
    <div className="card">
      <h2>Relatório</h2>

      {/* RESUMO COMPACTO */}
      <div
        style={{
          display: 'flex',
          gap: 24,
          justifyContent: 'space-between',
          marginBottom: 16,
        }}
      >
        <div>
          <strong>Entradas</strong>
          <p style={{ color: 'green' }}>
            R$ {totalIn.toFixed(2)}
          </p>
        </div>

        <div>
          <strong>Saídas</strong>
          <p style={{ color: 'red' }}>
            R$ {totalOut.toFixed(2)}
          </p>
        </div>

        <div>
          <strong>Saldo</strong>
          <p
            style={{
              color: balance >= 0 ? 'green' : 'red',
            }}
          >
            R$ {balance.toFixed(2)}
          </p>
        </div>
      </div>

      {/* GRÁFICO */}
      {transactions.length === 0 ? (
        <p>Nenhum dado para o período.</p>
      ) : (
        <Line
          data={buildChartData()}
          options={chartOptions}
        />
      )}
    </div>
  )
}
