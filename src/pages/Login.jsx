import { useState } from 'react'
import { supabase } from '../supabase'
import Button from '../ui/Button'

/*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧭 LOGIN & CADASTRO (FLUXO CORRETO)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Este componente:
- Controla login e cadastro
- Valida email e senha
- Dá feedback claro ao usuário
- Não cria conta "fantasma"

Regras:
- Email e senha são obrigatórios
- Cadastro e login são fluxos distintos
*/

export default function Login() {
  const [mode, setMode] = useState('login') // login | signup
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setMessage(null)

    if (!email || !password) {
      setMessage('Informe email e senha.')
      return
    }

    setLoading(true)

    if (mode === 'login') {
      const { error } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        })

      if (error) {
        setMessage('Email ou senha inválidos.')
      }
    }

    if (mode === 'signup') {
      const { data, error } =
        await supabase.auth.signUp({
          email,
          password,
        })

      if (error) {
        setMessage(error.message)
      } else {
        setMessage(
          'Conta criada com sucesso. Você já pode entrar.'
        )
        setMode('login')
      }
    }

    setLoading(false)
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg)',
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: 320,
          padding: 24,
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <h2 style={{ marginBottom: 8 }}>
          {mode === 'login'
            ? 'Entrar'
            : 'Criar conta'}
        </h2>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          style={inputStyle}
        />

        <input
          type="password"
          placeholder="Senha"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          style={inputStyle}
        />

        {message && (
          <div
            style={{
              fontSize: 13,
              color: 'var(--text-muted)',
            }}
          >
            {message}
          </div>
        )}

        <Button type="submit" disabled={loading}>
          {loading
            ? 'Processando...'
            : mode === 'login'
            ? 'Entrar'
            : 'Criar conta'}
        </Button>

        <button
          type="button"
          onClick={() =>
            setMode(
              mode === 'login' ? 'signup' : 'login'
            )
          }
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            fontSize: 13,
            cursor: 'pointer',
            marginTop: 8,
          }}
        >
          {mode === 'login'
            ? 'Criar uma conta'
            : 'Já tenho conta'}
        </button>
      </form>
    </div>
  )
}

const inputStyle = {
  background: 'var(--bg)',
  border: '1px solid var(--border)',
  borderRadius: 6,
  padding: '8px 10px',
  color: 'var(--text)',
  fontSize: 14,
}
