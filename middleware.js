import { NextResponse } from 'next/server';

// Map para armazenar as tentativas de rate limiting por IP
const requestMap = new Map();
const speedMap = new Map();

// Configurações de rate limiting
const RATE_LIMIT_WINDOW = 10 * 60 * 1000; // 10 minutos
const RATE_LIMIT_MAX = 100; // 100 requests por janela
const SPEED_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutos  
const SPEED_LIMIT_DELAY_AFTER = 5; // Adicionar delay após 5 requests
const SPEED_LIMIT_DELAY = 500; // 500ms de delay

function getClientIP(request) {
  return request.headers.get('x-forwarded-for') || 
         request.headers.get('x-real-ip') || 
         request.ip || 
         'unknown';
}

function checkRateLimit(ip) {
  const now = Date.now();
  const key = `rate_${ip}`;
  
  if (!requestMap.has(key)) {
    requestMap.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1 };
  }
  
  const data = requestMap.get(key);
  
  // Reset counter se a janela expirou
  if (now > data.resetTime) {
    requestMap.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1 };
  }
  
  // Incrementa contador
  data.count++;
  
  if (data.count > RATE_LIMIT_MAX) {
    return { 
      allowed: false, 
      remaining: 0,
      resetTime: data.resetTime
    };
  }
  
  return { 
    allowed: true, 
    remaining: RATE_LIMIT_MAX - data.count 
  };
}

function checkSpeedLimit(ip) {
  const now = Date.now();
  const key = `speed_${ip}`;
  
  if (!speedMap.has(key)) {
    speedMap.set(key, { count: 1, resetTime: now + SPEED_LIMIT_WINDOW });
    return { delay: 0 };
  }
  
  const data = speedMap.get(key);
  
  // Reset counter se a janela expirou
  if (now > data.resetTime) {
    speedMap.set(key, { count: 1, resetTime: now + SPEED_LIMIT_WINDOW });
    return { delay: 0 };
  }
  
  // Incrementa contador
  data.count++;
  
  if (data.count > SPEED_LIMIT_DELAY_AFTER) {
    return { delay: SPEED_LIMIT_DELAY };
  }
  
  return { delay: 0 };
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  
  // Aplica middleware apenas em rotas da API
  if (pathname.startsWith('/api')) {
    const ip = getClientIP(request);
    const userAgent = request.headers.get('user-agent') || 'Unknown';
    
    // Rate limiting
    const rateCheck = checkRateLimit(ip);
    if (!rateCheck.allowed) {
      console.warn(`Rate limit excedido para IP ${ip}`);
      return NextResponse.json(
        {
          error: 'Muitas requisições',
          message: 'Limite de 100 requisições por 10 minutos excedido',
          resetTime: new Date(rateCheck.resetTime).toISOString()
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': RATE_LIMIT_MAX.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateCheck.resetTime.toString(),
            'Retry-After': Math.ceil((rateCheck.resetTime - Date.now()) / 1000).toString()
          }
        }
      );
    }
    
    // Speed limiting
    const speedCheck = checkSpeedLimit(ip);
    if (speedCheck.delay > 0) {
      await new Promise(resolve => setTimeout(resolve, speedCheck.delay));
    }
    
    // Log de segurança
    console.log(`Request de IP: ${ip}, User-Agent: ${userAgent}, Path: ${pathname}`);
    
    // Headers de segurança
    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Limit', RATE_LIMIT_MAX.toString());
    response.headers.set('X-RateLimit-Remaining', rateCheck.remaining.toString());
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    return response;
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/:path*'
  ]
}; 