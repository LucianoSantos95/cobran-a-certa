// Estilos compartilhados dos e-mails de autenticação — identidade Cobrança Certa.
export const main = {
  backgroundColor: '#ffffff',
  fontFamily: 'Arial, Helvetica, sans-serif',
}
export const container = { padding: '28px 24px', maxWidth: '560px' }
export const h1 = {
  fontSize: '20px',
  fontWeight: 'bold' as const,
  color: '#1f2d2b',
  margin: '0 0 12px',
}
export const text = {
  fontSize: '15px',
  lineHeight: '24px',
  color: '#3c4a48',
  margin: '0 0 20px',
}
export const link = { color: '#1f2d2b', textDecoration: 'underline' }
export const button = {
  backgroundColor: '#1f2d2b',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: 'bold' as const,
  border: '1px solid #1f2d2b',
  borderRadius: '10px',
  padding: '12px 22px',
  textDecoration: 'none',
}
export const codeStyle = {
  fontFamily: 'Courier, monospace',
  fontSize: '24px',
  fontWeight: 'bold' as const,
  letterSpacing: '3px',
  color: '#1f2d2b',
  border: '1px solid #e4e8e5',
  borderRadius: '10px',
  padding: '14px 18px',
  margin: '0 0 24px',
}
export const hr = { borderColor: '#e4e8e5', margin: '24px 0 12px' }
export const footer = { fontSize: '12px', color: '#7a8784', margin: '0' }
// Renderizado como texto: manter livre de >, & e aspas.
export const darkModeCss = `
  @media (prefers-color-scheme: dark) {
    .dm-btn { background-color: #ffffff !important; color: #1f2d2b !important; }
  }
  [data-ogsc] .dm-btn { background-color: #ffffff !important; color: #1f2d2b !important; }
  [data-ogsb] .dm-btn { background-color: #ffffff !important; color: #1f2d2b !important; }
`
