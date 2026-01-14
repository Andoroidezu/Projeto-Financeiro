export default function Badge({
  children,
  variant = 'default',
}) {
  const variants = {
    default: {
      background: 'var(--border)',
      color: 'var(--text)',
    },
    success: {
      background: 'rgba(34, 197, 94, 0.15)',
      color: 'var(--success)',
    },
    warning: {
      background: 'rgba(234, 179, 8, 0.15)',
      color: 'var(--warning)',
    },
    danger: {
      background: 'rgba(239, 68, 68, 0.15)',
      color: 'var(--danger)',
    },
    info: {
      background: 'rgba(99, 102, 241, 0.15)',
      color: 'var(--primary)',
    },
  }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '4px 8px',
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 500,
        background:
          variants[variant]?.background ||
          variants.default.background,
        color:
          variants[variant]?.color ||
          variants.default.color,
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  )
}
