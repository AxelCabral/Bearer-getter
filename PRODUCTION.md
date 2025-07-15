# Guia de Produção - API Bearer Token

## Variáveis de Ambiente Obrigatórias

```bash
# Configuração do Servidor
PORT=3000
NODE_ENV=production

# Segurança - Token único obrigatório para acesso à API
API_TOKEN=seu_token_unico_super_secreto_aqui_123456789

# Rate Limiting (opcional - padrões já configurados)
RATE_LIMIT_WINDOW_MS=600000
RATE_LIMIT_MAX_REQUESTS=100

# Logs (opcional)
LOG_LEVEL=info

# Monitoramento (opcional)
ENABLE_METRICS=true
```

## Checklist de Deploy

- [ ] `NODE_ENV=production` configurado
- [ ] `API_TOKEN` definido com valor único e seguro
- [ ] SSL/HTTPS habilitado na plataforma
- [ ] Logs centralizados configurados
- [ ] Monitoramento de métricas ativo
- [ ] Teste de carga realizado
- [ ] Token distribuído apenas para usuários autorizados

## Comandos de Deploy

### Heroku
```bash
heroku config:set NODE_ENV=production
heroku config:set API_TOKEN=seu_token_unico_super_secreto
git push heroku main
```

### Railway/Render
Configure as variáveis no dashboard da plataforma

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## Monitoramento

### Logs Importantes
- Rate limiting: `Limite excedido`
- Token inválido: `Token de API inválido ou ausente`
- Ataques: `Possível tentativa de ataque`
- Performance: `tempo: XXXms`

### Métricas Recomendadas
- Requests por segundo
- Tempo de resposta médio
- Taxa de erro
- IPs bloqueados por rate limit 