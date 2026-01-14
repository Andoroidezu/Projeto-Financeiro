import { useState } from 'react'
import { supabase } from '../supabase'
import Card from '../ui/Card'
import Button from '../ui/Button'
import { useToast } from '../ui/ToastProvider'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const { showToast } = useToast()

  async function handleLogin() {
    setLoading(true)

    const { error } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      })

    if (error) {
      showToast(error.message, 'error')
    } else {
      showToast('Login realizado com sucesso', 'success')
    }

    setLoading(false)
  }

  async function handleRegister() {
    setLoading(true)

    const { error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      showToast(error.message, 'error')
    } else {
      showToast(
        'Conta criada! Faça login.',
        'success'
      )
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
        padding: 24,
      }}
    >
      <Card style={{ width: 360 }}>
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: 22 }}>
            Finance App
          </h1>
          <p className="text-muted">
            Controle financeiro simples e moderno
          </p>
        </div>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Senha"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <Button onClick={handleLogin}>
            {loading ? 'Entrando…' : 'Entrar'}
          </Button>

          <Button
            variant="ghost"
            onClick={handleRegister}
          >
            Criar conta
          </Button>
        </div>
      </Card>
    </div>
  )
}
