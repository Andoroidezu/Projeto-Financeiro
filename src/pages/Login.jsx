import { useState } from 'react'
import { supabase } from '../supabase'
import Button from '../ui/Button'

/*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧭 LOGIN & CADASTRO — FLUXO CORRETO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Regras:
- Signup cria conta E faz login automático
- Login sempre cria sessão
- App.jsx reage apenas à sessão
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

    try {
      // 🔐 LOGIN
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

      // 🆕 CADASTRO + AUTO LOGIN
      if (mode === 'signup') {
        const { error: signUpError } =
          await supabase.auth.signUp({
            email,
            password,
          })

        if (signUpError) {
          setMessage(signUpError.message)
          setLoading(false)
          return
        }

        // 🔑 login automático após signup
        const { error: loginError } =
          await supabase.auth.signInWithPassword({
            email,
            password,
          })

        if (loginError) {
          setMessage(loginError.message)
        }
      }
    } catch (err) {
      setMessage('Erro inesperado. Tente novamente.')
      console.error(err)
    } finally {
      setLoading(false)
    }
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
        />

        <input
          type="password"
          placeholder="Senha"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
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
            ? 'Processando…'
            : mode === 'login'
            ? 'Entrar'
            : 'Criar conta'}
        </Button>

        <button
          type="button"
          onClick={() =>
            setMode(
              mode === 'login'
                ? 'signup'
                : 'login'
            )
          }
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: 13,
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
