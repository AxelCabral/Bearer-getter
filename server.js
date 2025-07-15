const express = require('express');
const cors = require('cors');
const axios = require('axios');
const http = require('http');
const url = require('url');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Endpoint principal que recebe credenciais e retorna Bearer Token
app.all('*', async (req, res) => {
  try {
    // Extrai as credenciais user e key do body ou headers
    let user, key;
    
    // Tenta pegar do body primeiro, depois dos headers
    if (req.body && (req.body.user || req.body.key)) {
      user = req.body.user;
      key = req.body.key;
    } else {
      user = req.headers.user;
      key = req.headers.key;
    }
    
    if (!user || !key) {
      return res.status(400).json({
        error: 'Credenciais não encontradas',
        message: 'É necessário enviar "user" e "key" no body ou headers da requisição'
      });
    }

    console.log(`🔐 Fazendo autenticação para user: ${user}`);

    console.log(`📤 Enviando requisição NATIVA para Sentus com headers: user=${user}, key=${key.substring(0,5)}...`);
    
    // Usando HTTP nativo para controle TOTAL da requisição
    const authResponse = await new Promise((resolve, reject) => {
      const parsedUrl = url.parse('http://www.sentus.inf.br/v1000/auth');
      
      const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || 80,
        path: parsedUrl.path,
        method: 'POST',
        headers: {
          'user': user,
          'key': key
          // APENAS esses dois headers, NADA mais
        }
      };
      
      const req = http.request(options, (response) => {
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
        console.error(`❌ Erro na requisição HTTP:`, error);
        reject(error);
      });
      
      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error('Timeout'));
      });
      
      // Não enviamos NENHUM body
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

    console.log(`✅ Token obtido com sucesso para user: ${user}`);

    // Retorna o Bearer token
    res.json({
      success: true,
      message: 'Autenticação realizada com sucesso',
      bearerToken: bearerToken,
      authInfo: {
        user: user,
        timestamp: new Date().toISOString(),
        requestMethod: req.method,
        requestUrl: req.url
      }
    });

  } catch (error) {
    console.error('❌ Erro na autenticação:', error.message);
    
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || error.message === 'Timeout') {
      // Erro de conexão
      return res.status(503).json({
        error: 'Servidor de autenticação indisponível',
        message: 'Não foi possível conectar ao servidor de autenticação'
      });
    } else {
      // Erro interno
      return res.status(500).json({
        error: 'Erro interno do servidor',
        message: error.message
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