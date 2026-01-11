import { useState } from 'react'
import { supabase } from '../supabase'
import Layout from '../components/Layout'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  async function handleLogin() {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) alert(error.message)
  }

  async function handleRegister() {
    const { error } = await supabase.auth.signUp({
      email,
      password
    })

    if (error) {
      alert(error.message)
    } else {
      alert('Conta criada! Agora faça login.')
    }
  }

  return (
    <Layout>
      <div className="card">
        <h2>Login</h2>

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

        <button onClick={handleLogin}>Entrar</button>
        <button onClick={handleRegister}>Cadastrar</button>
      </div>
    </Layout>
  )
}
