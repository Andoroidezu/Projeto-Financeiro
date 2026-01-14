import Card from '../ui/Card'
import Button from '../ui/Button'
import { supabase } from '../supabase'
import { useToast } from '../ui/ToastProvider'

export default function Settings() {
  const { showToast } = useToast()

  async function handleReset() {
    const confirm = window.confirm(
      '⚠️ Isso irá apagar TODOS os seus dados financeiros.\n\nEssa ação não pode ser desfeita.\n\nDeseja continuar?'
    )

    if (!confirm) return

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      // ordem importa por causa de dependências
      await supabase
        .from('transactions')
        .delete()
        .eq('user_id', user.id)

      await supabase
        .from('cards')
        .delete()
        .eq('user_id', user.id)

      await supabase
        .from('commitments')
        .delete()
        .eq('user_id', user.id)

      showToast(
        'Dados apagados com sucesso. Conta resetada.',
        'success'
      )
    } catch (err) {
      showToast(
        'Erro ao resetar os dados.',
        'error'
      )
    }
  }

  return (
    <div style={{ maxWidth: 520 }}>
      <Card>
        <h2 style={{ fontSize: 18, marginBottom: 8 }}>
          Configurações
        </h2>

        <p className="text-muted" style={{ marginBottom: 24 }}>
          Opções avançadas da conta
        </p>

        {/* RESET */}
        <div
          style={{
            padding: 16,
            border: '1px solid var(--border)',
            borderRadius: 8,
          }}
        >
          <h3 style={{ fontSize: 16, marginBottom: 6 }}>
            Resetar dados da conta
          </h3>

          <p
            className="text-muted"
            style={{ marginBottom: 16 }}
          >
            Apaga todos os lançamentos, cartões e
            compromissos. A conta permanece ativa.
          </p>

          <Button
            variant="danger"
            onClick={handleReset}
          >
            Apagar todos os dados
          </Button>
        </div>
      </Card>
    </div>
  )
}
