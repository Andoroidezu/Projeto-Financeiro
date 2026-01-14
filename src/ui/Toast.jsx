export default function Toast({ message, type = 'info', onClose }) {
  const colors = {
    success: 'var(--success)',
    error: 'var(--danger)',
    warning: 'var(--warning)',
    info: 'var(--primary)',
  }

  return (
    <div
      style={{
        minWidth: 280,
        maxWidth: 360,
        background: 'var(--bg-elevated)',
        border: `1px solid var(--border)`,
        borderLeft: `4px solid ${colors[type]}`,
        borderRadius: 'var(--radius-md)',
        padding: '12px 14px',
        boxShadow: 'var(--shadow-md)',
        color: 'var(--text)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <span style={{ fontSize: 14 }}>{message}</span>

      <button
        onClick={onClose}
        style={{
          background: 'transparent',
          border: 'none',
          color: 'var(--text-muted)',
          cursor: 'pointer',
          fontSize: 16,
        }}
      >
        ✕
      </button>
    </div>
  )
}
