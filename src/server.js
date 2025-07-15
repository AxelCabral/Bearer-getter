import express from 'express';
import cors from 'cors';
import http from 'http';
import https from 'https';
import url from 'url';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import helmet from 'helmet';
import { body, validationResult } from 'express-validator';
import morgan from 'morgan';

const app = express();
const PORT = process.env.PORT || 3000;

// ====== CONFIGURAÇÕES DE SEGURANÇA ======

// Helmet - Headers de segurança
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization', 'user', 'key', 'api-token'],
  credentials: false
}));

// Rate Limiting - 100 requests per 10 minutes per IP
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 100,
  message: {
    error: 'Muitas requisições',
    message: 'Limite de 100 requisições por 10 minutos excedido'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Speed Limiting - Slow down consecutive requests
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000,
  delayAfter: 5,
  delayMs: 500
});

app.use(limiter);
app.use(speedLimiter);

// Parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Logging
app.use(morgan('combined'));

// Trust proxy
app.set('trust proxy', 1);

// ====== CONFIGURAÇÕES DA API ======

const API_TOKEN = process.env.API_TOKEN || 'tkn_b8f2a9e1c5d7h3j9k4m6n2p8q1r5s7t9v2w4x6y8z1';

console.log(`API Token configurado: ${API_TOKEN.substring(0, 8)}...`);

// Validações de entrada
const validateCredentials = [
  body('user').isLength({ min: 1, max: 100 }).trim().escape().withMessage('User deve ter entre 1-100 caracteres'),
  body('key').isLength({ min: 1, max: 100 }).trim().escape().withMessage('Key deve ter entre 1-100 caracteres'),
  body('apiToken').isLength({ min: 1, max: 200 }).trim().escape().withMessage('API Token deve ter entre 1-200 caracteres')
];

// Função auxiliar para validar formato das credenciais
const validateCredentialFormat = (user, key, apiToken) => {
  if (!user || !key || !apiToken) return false;
  if (typeof user !== 'string' || typeof key !== 'string' || typeof apiToken !== 'string') return false;
  if (user.length > 100 || key.length > 100 || apiToken.length > 200) return false;
  return true;
};

// ====== ENDPOINTS ======

// Endpoint de teste (sem autenticação)
app.get('/test', (req, res) => {
  res.json({
    status: 'OK',
    message: 'API funcionando',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Endpoint principal para autenticação
app.all('*', validateCredentials, async (req, res) => {
  const startTime = Date.now();
  const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.ip;
  const userAgent = req.headers['user-agent'] || 'Unknown';

  try {
    // Validação de entrada
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.warn(`Validação falhou para IP ${clientIP}: ${JSON.stringify(errors.array())}`);
      return res.status(400).json({
        error: 'Dados de entrada inválidos',
        details: errors.array()
      });
    }

    // Extrai credenciais do body ou headers
    const user = req.body.user || req.headers.user;
    const key = req.body.key || req.headers.key;
    const apiToken = req.body.apiToken || req.headers['api-token'];

    // Validação do token de API PRIMEIRO (mais importante)
    if (!apiToken || apiToken !== API_TOKEN) {
      console.warn(`Token de API inválido ou ausente de IP ${clientIP}: ${apiToken ? apiToken.substring(0, 8) + '...' : 'AUSENTE'}`);
      return res.status(401).json({
        error: 'Token de API inválido',
        message: 'Acesso negado'
      });
    }

    // Validação adicional de formato das credenciais
    if (!validateCredentialFormat(user, key, apiToken)) {
      console.warn(`Credenciais com formato inválido de IP ${clientIP}`);
      return res.status(400).json({
        error: 'Credenciais inválidas',
        message: 'Formato das credenciais está incorreto'
      });
    }

    // Log de segurança
    console.log(`Tentativa de autenticação de IP: ${clientIP}, User-Agent: ${userAgent}, User: ${user}`);

    // Verificação adicional para possíveis ataques
    if (user.includes('..') || key.includes('..') || apiToken.includes('..') ||
        user.includes('javascript:') || key.includes('javascript:') || apiToken.includes('javascript:')) {
      console.error(`Possível tentativa de ataque de IP ${clientIP}: ${user}`);
      return res.status(400).json({
        error: 'Credenciais suspeitas',
        message: 'Conteúdo das credenciais não é permitido'
      });
    }

    console.log(`Fazendo autenticação para user: ${user}`);
    console.log(`Enviando requisição para Sentus: user=${user}`);

    // Determina URL e módulo baseado no ambiente
    const isProduction = process.env.NODE_ENV === 'production';
    const authUrl = isProduction ? 'https://www.sentus.inf.br/v1000/auth' : 'http://www.sentus.inf.br/v1000/auth';
    const parsedUrl = new URL(authUrl);
    const requestModule = parsedUrl.protocol === 'https:' ? https : http;

    console.log(`Usando: ${authUrl}`);

    // Usando HTTP/HTTPS nativo
    const authResponse = await new Promise((resolve, reject) => {
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
          console.log(`Headers da resposta:`, response.headers);

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

    // Verifica se a requisição foi bem-sucedida
    if (authResponse.status !== 200) {
      return res.status(authResponse.status).json({
        error: 'Falha na autenticação',
        message: `Servidor de autenticação retornou erro: ${authResponse.status}`,
        details: authResponse.data
      });
    }

    // Extrai o header Authorization da resposta
    const authHeader = authResponse.headers.authorization;
    
    if (!authHeader) {
      return res.status(500).json({
        error: 'Token não encontrado',
        message: 'Servidor de autenticação não retornou o token Bearer'
      });
    }

    // Verifica se é um Bearer token válido
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(500).json({
        error: 'Formato de token inválido',
        message: 'Token retornado não está no formato Bearer esperado'
      });
    }

    const responseTime = Date.now() - startTime;
    console.log(`Token obtido com sucesso para user: ${user} (IP: ${clientIP}) em ${responseTime}ms`);

    // Retorna o Bearer token (sem expor dados sensíveis)
    res.json({
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

    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Falha na comunicação com o servidor de autenticação',
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`
    });
  }
});

// ====== INICIALIZAÇÃO DO SERVIDOR ======

// Tratamento de erros não capturados
process.on('uncaughtException', (error) => {
  console.error('Erro não capturado:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Promise rejeitada não tratada:', reason);
  process.exit(1);
});

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`URL: http://localhost:${PORT}`);
  console.log('Envie uma requisição com Bearer Token no header Authorization');
}); 