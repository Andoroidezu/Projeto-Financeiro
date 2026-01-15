// src/utils/formatTransaction.js

export function formatTransaction(t, cardsMap = {}) {
  const amount = Number(t.amount) || 0
  const isCard = t.card_id !== null
  const isIncome = t.type === 'entrada' && !isCard
  const isExpense = !isIncome

  const displayValue = isIncome
    ? `+ R$ ${amount.toFixed(2)}`
    : `- R$ ${amount.toFixed(2)}`

  let icon = '•'
  let color = 'var(--text-muted)'
  let label = ''

  if (isIncome) {
    icon = '⬆️'
    color = 'var(--success)'
    label = 'Entrada'
  } else if (isCard) {
    icon = '💳'
    color = 'var(--info)'
    label = cardsMap[t.card_id] || 'Cartão'
  } else {
    icon = '⬇️'
    color = 'var(--danger)'
    label = 'Saída'
  }

  return {
    icon,
    color,
    label,
    displayValue,
    isIncome,
    isExpense,
    isCard,
  }
}
