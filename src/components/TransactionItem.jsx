// src/components/TransactionItem.jsx

import { formatTransaction } from '../utils/formatTransaction'

export default function TransactionItem({ transaction }) {
  const { formattedValue, color, emoji } =
    formatTransaction(transaction)

  return (
    <div className="flex justify-between items-center p-3 rounded-lg bg-zinc-900 border border-zinc-800">
      <div className="flex items-center gap-3">
        <span className="text-sm opacity-60">
          {emoji}
        </span>

        <div className="flex flex-col">
          <span className="text-sm font-medium text-zinc-100">
            {transaction.description}
          </span>

          <span className="text-xs text-zinc-400">
            {transaction.date} · {transaction.source}
          </span>
        </div>
      </div>

      <span className={`text-sm font-medium ${color}`}>
        {formattedValue}
      </span>
    </div>
  )
}
