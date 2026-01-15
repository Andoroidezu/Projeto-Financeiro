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

/*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧭 RELATÓRIO MENSAL — VISÃO REAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Regras:
- Entradas sempre somam
- Saídas SEMPRE subtraem (inclusive cartão)
- Cartão entra na data da compra
- paid NÃO interfere no gráfico
*/

export default function MonthlyReport({ currentMonth }) {
  const [transactions, setTransactions] = useState([])

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

    const { data } = await supabase
      .from('transactions')
      .select('date, amount, type')
      .eq('user_id', user.id)
      .gte('date', start.toISOString().slice(0, 10))
      .lt('date', nextMonth.toISOString().slice(0, 10))
      .order('date', { ascending: true })

    setTransactions(data || [])
  }

  // 📊 Saldo acumulado (inclui cartão)
  const labels = []
  const balances = []

  let runningBalance = 0

  transactions.forEach(t => {
    if (t.amount == null) return

    const value = Number(t.amount)
    if (Number.isNaN(value)) return

    if (t.type === 'entrada') {
      runningBalance += value
    } else {
      runningBalance -= value
    }

    labels.push(
      new Date(t.date).toLocaleDateString('pt-BR', {
        day: '2-digit',
      })
    )
    balances.push(runningBalance)
  })

  const data = {
    labels,
    datasets: [
      {
        label: 'Saldo',
        data: balances,
        borderColor: '#60a5fa',
        borderWidth: 2,
        tension: 0.35,
        pointRadius: 3,
        pointHoverRadius: 4,
        fill: false,
        spanGaps: true,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: ctx =>
            `R$ ${ctx.parsed.y.toFixed(2)}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
      },
      y: {
        grid: {
          color: 'rgba(255,255,255,0.06)',
        },
      },
    },
  }

  return (
    <div style={{ maxWidth: 900 }}>
      <Card>
        <h2 style={{ fontSize: 20, marginBottom: 6 }}>
          Relatório mensal
        </h2>
        <p className="text-muted">
          Entradas, saídas e compras no cartão
        </p>
      </Card>

      <Card>
        {balances.length === 0 ? (
          <p className="text-muted">
            Nenhuma movimentação neste mês.
          </p>
        ) : (
          <div style={{ height: 200 }}>
            <Line data={data} options={options} />
          </div>
        )}
      </Card>
    </div>
  )
}
