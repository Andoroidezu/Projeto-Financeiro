export default function Card({ children, style }) {
  return (
    <div
      style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        padding: 20,
        marginBottom: 20,
        boxShadow: 'var(--shadow-md)',
        ...style,
      }}
    >
      {children}
    </div>
  )
}
