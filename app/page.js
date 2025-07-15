export default function Home() {
  return (
    <div style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      maxWidth: '800px',
      margin: '0 auto',
      padding: '40px 20px',
      lineHeight: '1.6',
      color: '#333'
    }}>
      <h1 style={{ color: '#2563eb', marginBottom: '30px' }}>
        Easy Bearer Auth - Next.js
      </h1>
      
      <div style={{
        backgroundColor: '#f8fafc',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '30px',
        border: '1px solid #e2e8f0'
      }}>
        <h2 style={{ marginTop: 0, color: '#1e293b' }}>API de Autenticação Bearer Token</h2>
        <p>
          Esta API fornece autenticação Bearer Token integrada com o sistema Sentus.
          Envie suas credenciais e receba um token válido para suas aplicações.
        </p>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h3 style={{ color: '#1e293b' }}>Como usar:</h3>
        <div style={{
          backgroundColor: '#1e293b',
          color: '#e2e8f0',
          padding: '20px',
          borderRadius: '8px',
          fontFamily: 'monospace',
          fontSize: '14px',
          overflow: 'auto'
        }}>
          <p style={{ margin: 0 }}>POST /api/auth</p>
          <br />
          <p style={{ margin: 0 }}>Headers:</p>
          <p style={{ margin: 0 }}>Content-Type: application/json</p>
          <p style={{ margin: 0 }}>api-token: seu_api_token</p>
          <br />
          <p style={{ margin: 0 }}>Body:</p>
          <p style={{ margin: 0 }}>{"{"}</p>
          <p style={{ margin: 0 }}>&nbsp;&nbsp;"user": "seu_usuario",</p>
          <p style={{ margin: 0 }}>&nbsp;&nbsp;"key": "sua_chave"</p>
          <p style={{ margin: 0 }}>{"}"}</p>
        </div>
      </div>

      <div style={{
        backgroundColor: '#dcfce7',
        padding: '15px',
        borderRadius: '8px',
        border: '1px solid #bbf7d0'
      }}>
        <p style={{ margin: 0, color: '#166534' }}>
          <strong>✓ Status:</strong> API funcionando normalmente
        </p>
        <p style={{ margin: '5px 0 0 0', color: '#166534' }}>
          <strong>Teste básico:</strong> <a href="/api/test" style={{ color: '#166534' }}>/api/test</a>
        </p>
        <p style={{ margin: '5px 0 0 0', color: '#166534' }}>
          <strong>Teste completo:</strong> <a href="/api/test-auth" style={{ color: '#166534' }}>/api/test-auth</a>
        </p>
        <p style={{ margin: '5px 0 0 0', color: '#166534' }}>
          <strong>Teste CURL:</strong> <a href="/api/test-curl" style={{ color: '#166534' }}>/api/test-curl</a>
        </p>
      </div>
    </div>
  );
} 