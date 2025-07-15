import { NextResponse } from 'next/server';
import http from 'http';
import https from 'https';

// Configurações da API
const API_TOKEN = process.env.API_TOKEN || 'tkn_b8f2a9e1c5d7h3j9k4m6n2p8q1r5s7t9v2w4x6y8z1';

// Função auxiliar para obter IP do cliente
function getClientIP(request) {
  return request.headers.get('x-forwarded-for') || 
         request.headers.get('x-real-ip') || 
         'unknown';
}

// Função auxiliar para validar formato das credenciais
function validateCredentialFormat(user, key, apiToken) {
  if (!user || !key || !apiToken) return false;
  if (typeof user !== 'string' || typeof key !== 'string' || typeof apiToken !== 'string') return false;
  if (user.length > 100 || key.length > 100 || apiToken.length > 200) return false;
  return true;
}

// Função auxiliar para verificar possíveis ataques
function checkForSuspiciousContent(user, key, apiToken) {
  const suspiciousPatterns = ['..', 'javascript:', '<script', 'eval(', 'alert('];
  const content = [user, key, apiToken].join(' ').toLowerCase();
  
  return suspiciousPatterns.some(pattern => content.includes(pattern));
}

// Função para fazer requisição ao Sentus
async function authenticateWithSentus(user, key) {
  const isProduction = process.env.NODE_ENV === 'production';
  const authUrl = isProduction ? 'https://www.sentus.inf.br/v1000/auth' : 'http://www.sentus.inf.br/v1000/auth';
  const parsedUrl = new URL(authUrl);
  const requestModule = parsedUrl.protocol === 'https:' ? https : http;

  console.log(`Enviando requisição para Sentus: ${authUrl}`);

  return new Promise((resolve, reject) => {
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
      path: parsedUrl.pathname,
      method: 'POST',
      headers: {
        'user': user,
        'key': key
      },
      timeout: 30000
    };

    const req = requestModule.request(options, (response) => {
      let data = '';

      response.on('data', (chunk) => {
        data += chunk;
      });

      response.on('end', () => {
        console.log(`Resposta recebida: Status ${response.statusCode}`);
        resolve({
          status: response.statusCode,
          headers: response.headers,
          data: data
        });
      });
    });

    req.on('error', (error) => {
      console.error(`Erro na requisição:`, error.message);
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Timeout na requisição'));
    });

    req.end();
  });
}

export async function POST(request) {
  const startTime = Date.now();
  const clientIP = getClientIP(request);
  const userAgent = request.headers.get('user-agent') || 'Unknown';

  try {
    // Parse do body
    let body;
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    // Extrai credenciais do body ou headers
    const user = body.user || request.headers.get('user');
    const key = body.key || request.headers.get('key');
    const apiToken = body.apiToken || request.headers.get('api-token');

    // Validação básica de presença
    if (!user || !key || !apiToken) {
      console.warn(`Credenciais ausentes de IP ${clientIP}`);
      return NextResponse.json({
        error: 'Credenciais ausentes',
        message: 'user, key e apiToken são obrigatórios'
      }, { status: 400 });
    }

    // Validação do token de API PRIMEIRO (mais importante)
    if (apiToken !== API_TOKEN) {
      console.warn(`Token de API inválido de IP ${clientIP}: ${apiToken.substring(0, 8)}...`);
      return NextResponse.json({
        error: 'Token de API inválido',
        message: 'Acesso negado'
      }, { status: 401 });
    }

    // Validação adicional de formato das credenciais
    if (!validateCredentialFormat(user, key, apiToken)) {
      console.warn(`Credenciais com formato inválido de IP ${clientIP}`);
      return NextResponse.json({
        error: 'Credenciais inválidas',
        message: 'Formato das credenciais está incorreto'
      }, { status: 400 });
    }

    // Verificação adicional para possíveis ataques
    if (checkForSuspiciousContent(user, key, apiToken)) {
      console.error(`Possível tentativa de ataque de IP ${clientIP}: ${user}`);
      return NextResponse.json({
        error: 'Credenciais suspeitas',
        message: 'Conteúdo das credenciais não é permitido'
      }, { status: 400 });
    }

    // Log de segurança
    console.log(`Tentativa de autenticação de IP: ${clientIP}, User-Agent: ${userAgent}, User: ${user}`);

    // Faz autenticação com Sentus
    const authResponse = await authenticateWithSentus(user, key);

    // Verifica se a requisição foi bem-sucedida
    if (authResponse.status !== 200) {
      return NextResponse.json({
        error: 'Falha na autenticação',
        message: `Servidor de autenticação retornou erro: ${authResponse.status}`,
        details: authResponse.data
      }, { status: authResponse.status });
    }

    // Extrai o header Authorization da resposta
    const authHeader = authResponse.headers.authorization;
    
    if (!authHeader) {
      return NextResponse.json({
        error: 'Token não encontrado',
        message: 'Servidor de autenticação não retornou o token Bearer'
      }, { status: 500 });
    }

    // Verifica se é um Bearer token válido
    if (!authHeader.startsWith('Bearer ')) {
      return NextResponse.json({
        error: 'Formato de token inválido',
        message: 'Token retornado não está no formato Bearer esperado'
      }, { status: 500 });
    }

    const responseTime = Date.now() - startTime;
    console.log(`Token obtido com sucesso para user: ${user} (IP: ${clientIP}) em ${responseTime}ms`);

    // Retorna o Bearer token
    return NextResponse.json({
      success: true,
      token: authHeader,
      user: user,
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error(`Erro na autenticação para IP ${clientIP}: ${error.message} (tempo: ${responseTime}ms)`);

    // Log detalhado para debugging em desenvolvimento
    if (process.env.NODE_ENV !== 'production') {
      console.error('Stack trace:', error.stack);
    }

    return NextResponse.json({
      error: 'Erro interno do servidor',
      message: 'Falha na comunicação com o servidor de autenticação',
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    error: 'Método não permitido',
    message: 'Use POST para autenticar',
    documentation: {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-token': 'seu_api_token'
      },
      body: {
        user: 'seu_usuario',
        key: 'sua_chave'
      }
    }
  }, { status: 405 });
} 