export default function Button({
  children,
  variant = 'primary',
  onClick,
  type = 'button',
}) {
  const variants = {
    primary: {
      background: 'var(--primary)',
      color: '#fff',
    },
    ghost: {
      background: 'transparent',
      color: 'var(--text)',
      border: '1px solid var(--border)',
    },
    danger: {
      background: 'var(--danger)',
      color: '#fff',
    },
  }

  return (
    <button
      type={type}
      onClick={onClick}
      style={{
        padding: '10px 16px',
        borderRadius: 'var(--radius-sm)',
        border: variants[variant].border || 'none',
        background: variants[variant].background,
        color: variants[variant].color,
        cursor: 'pointer',
        transition: 'all var(--transition)',
      }}
    >
      {children}
    </button>
  )
}
