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
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Rate Limiting - 100 requests por 10 minutos por IP
const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutos
  max: 100, // limite de 100 requests por windowMs por IP
  message: {
    error: 'Muitas tentativas de autenticação',
    message: 'Limite de 100 requisições por 10 minutos excedido. Tente novamente mais tarde.',
    retryAfter: Math.ceil(10 * 60 / 60) + ' minutos'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Cabeçalhos personalizados para monitoramento
  keyGenerator: (req) => {
    return req.ip + ':' + (req.headers['user-agent'] || 'unknown');
  },
  skip: (req) => {
    // Skip para IPs locais em desenvolvimento
    if (process.env.NODE_ENV !== 'production') {
      return req.ip === '127.0.0.1' || req.ip === '::1';
    }
    return false;
  }
});

// Speed Limiting - Desacelera requests consecutivos
const speedLimiter = slowDown({
  windowMs: 1 * 60 * 1000, // 1 minuto
  delayAfter: 5, // allow 5 requests per windowMs without delay
  delayMs: 500, // add 500ms delay per request after delayAfter
  maxDelayMs: 10000, // max delay of 10 seconds
});

// Logging com Morgan
app.use(morgan('combined', {
  // Log apenas requests suspeitos ou com erro
  skip: function (req, res) {
    return res.statusCode < 400 && process.env.NODE_ENV === 'production';
  }
}));

// CORS aberto para permitir qualquer origem
app.use(cors({
  origin: true, // Permite qualquer origem
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'user', 'key', 'api-token'],
  credentials: false,
  maxAge: 86400 // Cache preflight por 24h
}));
app.use(express.json({ limit: '10mb' })); // Limite de payload
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Aplicar rate limiting em todas as rotas
app.use(authLimiter);
app.use(speedLimiter);

// ====== ENDPOINT DE TESTE (SEM VALIDAÇÃO) ======
app.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'API funcionando!',
    nodeVersion: process.version,
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// Token único para autenticação da API (configure via variável de ambiente)
const API_TOKEN = process.env.API_TOKEN || 'tkn_b8f2a9e1c5d7h3j9k4m6n2p8q1r5s7t9v2w4x6y8z1';

console.log(`🔑 API Token configurado: ${API_TOKEN.substring(0, 8)}...`);

// Validações de entrada
const validateCredentials = [
  body('user')
    .optional()
    .isLength({ min: 3, max: 100 })
    .withMessage('User deve ter entre 3 e 100 caracteres')
    .matches(/^[a-zA-Z0-9@._-]+$/)
    .withMessage('User contém caracteres inválidos')
    .trim()
    .escape(),
  body('key')
    .optional()
    .isLength({ min: 10, max: 500 })
    .withMessage('Key deve ter entre 10 e 500 caracteres')
    .trim(),
  body('apiToken')
    .optional()
    .isLength({ min: 10, max: 200 })
    .withMessage('API Token deve ter entre 10 e 200 caracteres')
    .trim()
];

// Função para sanitizar dados de entrada
function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  return input.trim().replace(/[<>]/g, ''); // Remove caracteres perigosos
}

// Função para validar formato de credenciais
function validateCredentialFormat(user, key, apiToken) {
  // Validações básicas de formato
  if (!user || !key || !apiToken) return false;
  if (typeof user !== 'string' || typeof key !== 'string' || typeof apiToken !== 'string') return false;
  if (user.length < 3 || user.length > 100) return false;
  if (key.length < 10 || key.length > 500) return false;
  if (apiToken.length < 10 || apiToken.length > 200) return false;
  
  // Não permite caracteres suspeitos
  const suspiciousChars = /[<>'";\(\)\{\}\[\]]/;
  if (suspiciousChars.test(user) || suspiciousChars.test(key) || suspiciousChars.test(apiToken)) return false;
  
  return true;
}

// Endpoint principal que recebe credenciais e retorna Bearer Token
app.all('*', validateCredentials, async (req, res) => {
  const startTime = Date.now();
  const clientIP = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('User-Agent') || 'unknown';
  
  try {
    // Validação de entrada
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.warn(`⚠️  Validação falhou para IP ${clientIP}: ${JSON.stringify(errors.array())}`);
      return res.status(400).json({
        error: 'Dados de entrada inválidos',
        message: 'Formato das credenciais está incorreto',
        details: errors.array()
      });
    }
    
    // Extrai e sanitiza as credenciais user, key e apiToken do body ou headers
    let user, key, apiToken;
    
    // Tenta pegar do body primeiro, depois dos headers
    if (req.body && (req.body.user || req.body.key || req.body.apiToken)) {
      user = sanitizeInput(req.body.user);
      key = sanitizeInput(req.body.key);
      apiToken = sanitizeInput(req.body.apiToken);
    } else {
      user = sanitizeInput(req.headers.user);
      key = sanitizeInput(req.headers.key);
      apiToken = sanitizeInput(req.headers['api-token']);
    }
    
    // Validação do token de API PRIMEIRO (mais importante)
    if (!apiToken || apiToken !== API_TOKEN) {
      console.warn(`🚨 Token de API inválido ou ausente de IP ${clientIP}: ${apiToken ? apiToken.substring(0, 8) + '...' : 'AUSENTE'}`);
      return res.status(401).json({
        error: 'Token de API inválido',
        message: 'É necessário enviar um token de API válido para acessar este serviço'
      });
    }
    
    // Validação adicional de formato das credenciais
    if (!validateCredentialFormat(user, key, apiToken)) {
      console.warn(`⚠️  Credenciais com formato inválido de IP ${clientIP}`);
      return res.status(400).json({
        error: 'Credenciais inválidas',
        message: 'Formato das credenciais user/key/apiToken está incorreto'
      });
    }
    
    // Log de segurança
    console.log(`🔐 Tentativa de autenticação de IP: ${clientIP}, User-Agent: ${userAgent}, User: ${user}`);
    
    // Verificação adicional para possíveis ataques
    if (user.includes('..') || key.includes('..') || apiToken.includes('..') ||
        user.includes('javascript:') || key.includes('javascript:') || apiToken.includes('javascript:')) {
      console.error(`🚨 Possível tentativa de ataque de IP ${clientIP}: ${user}`);
      return res.status(400).json({
        error: 'Credenciais suspeitas',
        message: 'Conteúdo das credenciais não é permitido'
      });
    }

    console.log(`🔐 Fazendo autenticação para user: ${user}`);

    console.log(`📤 Enviando requisição para Sentus: user=${user}`);
    
    // Determina URL e módulo baseado no ambiente
    const isProduction = process.env.NODE_ENV === 'production';
    const authUrl = isProduction ? 'https://www.sentus.inf.br/v1000/auth' : 'http://www.sentus.inf.br/v1000/auth';
    const parsedUrl = url.parse(authUrl);
    const requestModule = parsedUrl.protocol === 'https:' ? https : http;
    
    console.log(`🌐 Usando: ${authUrl}`);
    
    // Usando HTTP/HTTPS nativo
    const authResponse = await new Promise((resolve, reject) => {
      const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
        path: parsedUrl.path,
        method: 'POST',
        headers: {
          'user': user,
          'key': key
        },
        timeout: 10000
      };
      
      const req = requestModule.request(options, (response) => {
        let data = '';
        
        response.on('data', (chunk) => {
          data += chunk;
        });
        
        response.on('end', () => {
          console.log(`📥 Resposta recebida: Status ${response.statusCode}`);
          console.log(`📥 Headers da resposta:`, response.headers);
          
          resolve({
            status: response.statusCode,
            headers: response.headers,
            data: data
          });
        });
      });
      
      req.on('error', (error) => {
        console.error(`❌ Erro na requisição:`, error.message);
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
      return res.status(401).json({
        error: 'Token não recebido',
        message: 'O servidor de autenticação não retornou um token Authorization'
      });
    }

    // Verifica se é um Bearer Token
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Formato de token inválido',
        message: 'Token recebido não está no formato Bearer'
      });
    }

    // Extrai apenas o token (remove "Bearer ")
    const bearerToken = authHeader.substring(7);

    const responseTime = Date.now() - startTime;
    console.log(`✅ Token obtido com sucesso para user: ${user} (IP: ${clientIP}) em ${responseTime}ms`);

    // Retorna o Bearer token (sem expor dados sensíveis)
    res.json({
      success: true,
      message: 'Autenticação realizada com sucesso',
      bearerToken: bearerToken,
      authInfo: {
        user: user,
        timestamp: new Date().toISOString(),
        requestMethod: req.method,
        requestUrl: req.url,
        responseTime: `${responseTime}ms`
      }
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error(`❌ Erro na autenticação para IP ${clientIP}: ${error.message} (tempo: ${responseTime}ms)`);
    
    // Log detalhado para debugging em desenvolvimento
    if (process.env.NODE_ENV !== 'production') {
      console.error('Stack trace:', error.stack);
    }
    
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || error.message === 'Timeout') {
      // Erro de conexão
      return res.status(503).json({
        error: 'Servidor de autenticação indisponível',
        message: 'Não foi possível conectar ao servidor de autenticação',
        timestamp: new Date().toISOString()
      });
    } else {
      // Erro interno - não expor detalhes em produção
      const errorMessage = process.env.NODE_ENV === 'production' 
        ? 'Erro interno do servidor' 
        : error.message;
        
      return res.status(500).json({
        error: 'Erro interno do servidor',
        message: errorMessage,
        timestamp: new Date().toISOString()
      });
    }
  }
});

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log('💡 Envie uma requisição com Bearer Token no header Authorization');
}); 