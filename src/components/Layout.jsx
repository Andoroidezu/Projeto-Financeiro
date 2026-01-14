import { useEffect, useState } from 'react'
import Sidebar from './Sidebar'

/*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧭 GUIA DE CONTEXTO — LAYOUT & ANIMAÇÃO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Este Layout é responsável por:
- Estrutura principal do app (Sidebar + Conteúdo)
- Barra superior (seletor de mês)
- Animação suave de navegação entre páginas

⚠️ IMPORTANTE:
- A sidebar NÃO deve ser animada
- Somente o conteúdo da página muda
- A animação deve ser curta e discreta
- Se quebrar a animação, o app continua funcionando

💡 Estratégia usada:
- Um container com "key" baseado na página atual
- Sempre que a página muda, o container remonta
- Ao montar, aplicamos um fade + slide leve

Isso evita:
- bibliotecas externas
- estados globais desnecessários
- efeitos colaterais

Se você (ou outro chat) estiver lendo isso no futuro:
👉 mexa aqui se quiser ajustar animação
👉 NÃO mexa na Sidebar achando que é bug
*/

export default function Layout({
  children,
  page,
  setPage,
  currentMonth,
  setCurrentMonth,
}) {
  const [animate, setAnimate] = useState(false)

  useEffect(() => {
    // dispara animação sempre que a página muda
    setAnimate(false)
    const t = setTimeout(() => setAnimate(true), 10)
    return () => clearTimeout(t)
  }, [page])

  return (
    <div style={{ display: 'flex' }}>
      {/* SIDEBAR FIXA */}
      <Sidebar page={page} setPage={setPage} />

      {/* ÁREA PRINCIPAL */}
      <main
        style={{
          flex: 1,
          minHeight: '100vh',
          background: 'var(--bg)',
        }}
      >
        {/* TOP BAR */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <input
            type="month"
            value={currentMonth}
            onChange={e =>
              setCurrentMonth(e.target.value)
            }
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: 6,
              padding: '6px 10px',
              color: 'var(--text)',
              fontSize: 13,
            }}
          />
        </div>

        {/* CONTEÚDO COM ANIMAÇÃO */}
        <div
          key={page}
          style={{
            padding: 24,
            opacity: animate ? 1 : 0,
            transform: animate
              ? 'translateY(0)'
              : 'translateY(6px)',
            transition:
              'opacity 140ms ease, transform 140ms ease',
          }}
        >
          {children}
        </div>
      </main>
    </div>
  )
}
