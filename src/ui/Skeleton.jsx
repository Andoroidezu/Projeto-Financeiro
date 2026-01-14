/*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧭 GUIA DE CONTEXTO — SKELETON LOADING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Este componente representa conteúdo "fantasma"
enquanto dados reais estão carregando.

Objetivo:
- Evitar tela vazia
- Reduzir sensação de espera
- Passar impressão de app rápido e polido

Regras de uso:
- Usar apenas enquanto dados estão sendo buscados
- Nunca animar demais
- Não substituir loaders infinitos

Estilo:
- Pulso leve
- Cinza neutro (SaaS)
*/

export default function Skeleton({
  width = '100%',
  height = 16,
  radius = 6,
}) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: radius,
        background:
          'linear-gradient(90deg, var(--bg-hover), var(--border), var(--bg-hover))',
        backgroundSize: '200% 100%',
        animation: 'skeleton 1.2s ease-in-out infinite',
      }}
    />
  )
}
