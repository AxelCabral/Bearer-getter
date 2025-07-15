# API Teste HTTP - Autenticação Bearer Token

API Node.js que recebe credenciais de usuário, faz autenticação no servidor Sentus e retorna o Bearer Token.

## Instalação

```bash
npm install
```

## Como usar

### Desenvolvimento
```bash
npm run dev
```

### Produção
```bash
npm start
```

O servidor rodará na porta 3000 (ou na porta definida na variável de ambiente PORT).

## Como funciona

1. **Você envia** credenciais `user` e `key` para esta API
2. **A API faz** uma requisição para `http://www.sentus.inf.br/v1000/auth` com suas credenciais
3. **A API extrai** o Bearer Token da resposta do Sentus
4. **A API retorna** o Bearer Token para você

## Endpoints

A API aceita **qualquer método HTTP** em **qualquer rota** (`GET`, `POST`, `PUT`, `DELETE`, etc.).

### Exemplo de uso

#### Opção 1: Credenciais no Body (recomendado)
```bash
curl -X POST http://localhost:3000/auth \
  -H "Content-Type: application/json" \
  -d '{"user": "seu-usuario", "key": "sua-chave"}'
```

#### Opção 2: Credenciais nos Headers
```bash
curl -X POST http://localhost:3000/auth \
  -H "user: seu-usuario" \
  -H "key: sua-chave" \
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

### Resposta de erro (sem credenciais)

```json
{
  "error": "Credenciais não encontradas",
  "message": "É necessário enviar \"user\" e \"key\" no body ou headers da requisição"
}
```

## Testando

Você pode testar com qualquer ferramenta:
- cURL
- Postman
- Insomnia
- Thunder Client (VS Code)

Basta enviar uma requisição com:
- **Body JSON**: `{"user": "valor", "key": "valor"}`
- **OU Headers**: `user: valor` e `key: valor`

## Deploy

Este projeto pode ser facilmente deployado em:
- Heroku
- Vercel
- Railway
- Render
- AWS
- Azure
- Google Cloud

Certifique-se de definir a variável de ambiente `PORT` se necessário. 