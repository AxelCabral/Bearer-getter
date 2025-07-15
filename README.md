# 🔐 API Teste HTTP - Autenticação Bearer Token

API Node.js **SEGURA PARA PRODUÇÃO** que recebe credenciais de usuário, faz autenticação no servidor Sentus e retorna o Bearer Token.

## 🛡️ Recursos de Segurança

✅ **Rate Limiting** - 100 requisições por 10 minutos por IP  
✅ **Speed Limiting** - Desacelera requisições consecutivas  
✅ **Headers de Segurança** - Helmet com CSP, HSTS, etc.  
✅ **Validação de Entrada** - Sanitização e validação rigorosa  
✅ **Token de API Único** - Credencial obrigatória para acesso  
✅ **Logs de Segurança** - Monitoramento de tentativas suspeitas  
✅ **Proteção contra Ataques** - XSS, injection, etc.  
✅ **Timeout de Requisições** - Evita bloqueios  

## 📦 Instalação

```bash
npm install
```

## ⚙️ Configuração

### Variáveis de Ambiente (Produção)
Copie o arquivo `.env.example` para `.env` e configure:

```bash
cp .env.example .env
```

Principais configurações:
- `NODE_ENV=production` - Ativa modo produção
- `API_TOKEN` - **OBRIGATÓRIO** - Token único para acesso à API
- `PORT` - Porta do servidor

### Desenvolvimento
```bash
npm run dev
```

### Produção
```bash
NODE_ENV=production npm start
```

O servidor rodará na porta 3000 (ou na porta definida na variável de ambiente PORT).

## Como funciona

1. **Você envia** credenciais `user`, `key` e `apiToken` para esta API
2. **A API valida** o token único obrigatório (apiToken)
3. **A API faz** uma requisição para `http://www.sentus.inf.br/v1000/auth` com suas credenciais
4. **A API extrai** o Bearer Token da resposta do Sentus
5. **A API retorna** o Bearer Token para você

## 🔑 Token de API Obrigatório

**IMPORTANTE:** Todas as requisições devem incluir um token de API válido!

Token padrão (para testes): `tkn_b8f2a9e1c5d7h3j9k4m6n2p8q1r5s7t9v2w4x6y8z1`

⚠️ **Em produção:** Configure sua própria chave via variável `API_TOKEN`

## Endpoints

A API aceita **qualquer método HTTP** em **qualquer rota** (`GET`, `POST`, `PUT`, `DELETE`, etc.).

### Exemplo de uso

#### Opção 1: Credenciais no Body (recomendado)
```bash
curl -X POST http://localhost:3000/auth \
  -H "Content-Type: application/json" \
  -d '{
    "user": "seu-usuario",
    "key": "sua-chave", 
    "apiToken": "tkn_b8f2a9e1c5d7h3j9k4m6n2p8q1r5s7t9v2w4x6y8z1"
  }'
```

#### Opção 2: Credenciais nos Headers
```bash
curl -X POST http://localhost:3000/auth \
  -H "user: seu-usuario" \
  -H "key: sua-chave" \
  -H "api-token: tkn_b8f2a9e1c5d7h3j9k4m6n2p8q1r5s7t9v2w4x6y8z1" \
  -H "Content-Type: application/json"
```

### Resposta de sucesso

```json
{
  "success": true,
  "message": "Autenticação realizada com sucesso",
  "bearerToken": "fbsjdghfvsdghjfvsvfsdhjfjds",
  "authInfo": {
    "user": "seu-usuario",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "requestMethod": "POST",
    "requestUrl": "/auth"
  }
}
```

### Resposta de erro (credenciais inválidas)

```json
{
  "error": "Falha na autenticação",
  "message": "Servidor de autenticação retornou erro: 401",
  "details": "Credenciais inválidas"
}
```

### Resposta de erro (sem token de API)

```json
{
  "error": "Token de API inválido",
  "message": "É necessário enviar um token de API válido para acessar este serviço"
}
```

### Resposta de erro (sem credenciais)

```json
{
  "error": "Credenciais inválidas",
  "message": "Formato das credenciais user/key/apiToken está incorreto"
}
```

## Testando

Você pode testar com qualquer ferramenta:
- cURL
- Postman
- Insomnia
- Thunder Client (VS Code)

Basta enviar uma requisição com:
- **Body JSON**: `{"user": "valor", "key": "valor", "apiToken": "token"}`
- **OU Headers**: `user: valor`, `key: valor` e `api-token: token`

## 🔒 Recursos de Segurança Detalhados

### Rate Limiting
- **100 requisições por 10 minutos** por IP
- Baseado em IP + User-Agent para maior precisão
- Headers de resposta informativos

### Speed Limiting
- **5 requisições rápidas** permitidas por minuto
- Delay progressivo: +500ms por requisição extra
- Máximo de 10 segundos de delay

### Token de API Único
- **Token obrigatório** para todas as requisições
- Validação antes de qualquer processamento
- Configurável via variável de ambiente
- Logs de tentativas com token inválido

### Validação de Entrada
- Sanitização automática de dados
- Validação de formato rigorosa
- Proteção contra caracteres maliciosos
- Limites de tamanho para user/key/apiToken

### Headers de Segurança (Helmet)
- Content Security Policy (CSP)
- HTTP Strict Transport Security (HSTS)
- X-Frame-Options, X-Content-Type-Options
- Referrer Policy

### Logs de Segurança
- IPs e User-Agents suspeitos
- Tentativas de ataque registradas
- Métricas de performance
- Logs estruturados para análise

## 🚀 Deploy em Produção

### Variáveis Obrigatórias
```bash
NODE_ENV=production
API_TOKEN=seu_token_unico_super_secreto_aqui_123456789
```

### Plataformas Recomendadas
- **Heroku** - `heroku config:set API_TOKEN=seu_token_unico`
- **Railway** - Configure API_TOKEN via dashboard
- **Render** - Auto-deploy com .env
- **AWS/Azure/GCP** - Use secrets manager para API_TOKEN

### Monitoramento
- Logs estruturados para ELK Stack
- Métricas de performance integradas
- Alertas de rate limiting
- Dashboard de segurança recomendado

### Checklist de Produção
- [ ] `NODE_ENV=production` configurado
- [ ] `API_TOKEN` definido com valor único e seguro
- [ ] SSL/HTTPS habilitado
- [ ] Logs centralizados configurados
- [ ] Monitoramento ativo
- [ ] Backup de configurações
- [ ] Token de API distribuído apenas para usuários autorizados

Certifique-se de definir todas as variáveis de ambiente necessárias. 