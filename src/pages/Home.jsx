import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import Card from '../ui/Card'
import Badge from '../ui/Badge'
import Skeleton from '../ui/Skeleton'

/*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧭 GUIA DE CONTEXTO — HOME & SKELETON
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

A Home é a PRIMEIRA impressão do app.

Aqui usamos Skeleton loading para:
- KPIs (Entradas / Saídas / Saldo)
- Evitar sensação de tela vazia
- Mostrar que dados estão sendo carregados

Regra:
- Enquanto loading = true → Skeleton
- Quando dados chegam → conteúdo real
*/

export default function Home({ currentMonth }) {
  const [loading, setLoading] = useState(true)

  const [totalIn, setTotalIn] = useState(0)
  const [totalOut, setTotalOut] = useState(0)
  const [hasPending, setHasPending] = useState(false)
  const [hasOpenInvoice, setHasOpenInvoice] =
    useState(false)

  useEffect(() => {
    fetchSummary()
  }, [currentMonth])

  async function fetchSummary() {
    setLoading(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const [year, m] = currentMonth.split('-')
    const start = new Date(year, m - 1, 1)
    const nextMonth = new Date(year, m, 1)

    const { data } = await supabase
      .from('transactions')
      .select('amount, type, paid, card_id')
      .eq('user_id', user.id)
      .gte('date', start.toISOString().slice(0, 10))
      .lt('date', nextMonth.toISOString().slice(0, 10))

    let income = 0
    let expense = 0

    data?.forEach(t => {
      if (t.type === 'entrada')
        income += t.amount
      else expense += t.amount
    })

    setTotalIn(income)
    setTotalOut(expense)

    setHasPending(
      data?.some(
        t => t.type !== 'entrada' && !t.paid
      )
    )

    setHasOpenInvoice(
      data?.some(
        t =>
          t.card_id !== null &&
          !t.paid
      )
    )

    setLoading(false)
  }

  const balance = totalIn - totalOut

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* HEADER */}
      <Card>
        <h2 style={{ fontSize: 20, marginBottom: 6 }}>
          Visão geral
        </h2>
        <p className="text-muted">
          Resumo financeiro do mês
        </p>
      </Card>

      {/* KPIs */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
        }}
      >
        <Kpi
          label="Entradas"
          value={`R$ ${totalIn.toFixed(2)}`}
          color="var(--success)"
          loading={loading}
        />
        <Kpi
          label="Saídas"
          value={`R$ ${totalOut.toFixed(2)}`}
          color="var(--danger)"
          loading={loading}
        />
        <Kpi
          label="Saldo"
          value={`R$ ${balance.toFixed(2)}`}
          color={
            balance >= 0
              ? 'var(--success)'
              : 'var(--danger)'
          }
          loading={loading}
        />
      </div>

      {/* ALERTAS */}
      {!loading && (hasPending || hasOpenInvoice) && (
        <Card>
          <h3 style={{ fontSize: 16, marginBottom: 8 }}>
            Atenção
          </h3>

          <div
            style={{
              display: 'flex',
              gap: 8,
              flexWrap: 'wrap',
            }}
          >
            {hasPending && (
              <Badge variant="warning">
                Lançamentos pendentes
              </Badge>
            )}

            {hasOpenInvoice && (
              <Badge variant="info">
                Fatura de cartão aberta
              </Badge>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}

function Kpi({ label, value, color, loading }) {
  return (
    <Card>
      <div
        style={{
          fontSize: 12,
          color: 'var(--text-muted)',
          marginBottom: 4,
        }}
      >
        {label}
      </div>

      {loading ? (
        <Skeleton width="80%" height={22} />
      ) : (
        <strong style={{ fontSize: 20, color }}>
          {value}
        </strong>
      )}
    </Card>
  )
}
