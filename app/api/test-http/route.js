import { NextResponse } from 'next/server';
import http from 'http';

export async function GET() {
  try {
    const testData = {
      user: "dados@rayalimentos",
      key: "QTlbWzGk5rDWCazeEk+bLA=="
    };

    // FORÇAR HTTP mesmo em produção para teste
    const authUrl = 'http://www.sentus.inf.br/v1000/auth';
    const parsedUrl = new URL(authUrl);
    
    console.log(`TESTE DIRETO - Ambiente: ${process.env.NODE_ENV || 'development'}`);
    console.log(`TESTE DIRETO - URL: ${authUrl}`);
    console.log(`TESTE DIRETO - User: ${testData.user}`);

    const startTime = Date.now();

    const authResponse = await new Promise((resolve, reject) => {
      const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || 80,
        path: parsedUrl.pathname,
        method: 'POST',
        headers: {
          'user': testData.user,
          'key': testData.key
        },
        timeout: 10000 // Reduzir timeout para 10s
      };

      console.log('TESTE DIRETO - Opções da requisição:', options);

      const req = http.request(options, (response) => {
        let data = '';

        response.on('data', (chunk) => {
          data += chunk;
        });

        response.on('end', () => {
          const responseTime = Date.now() - startTime;
          console.log(`TESTE DIRETO - Resposta recebida: Status ${response.statusCode} em ${responseTime}ms`);
          console.log(`TESTE DIRETO - Headers:`, response.headers);
          
          resolve({
            status: response.statusCode,
            headers: response.headers,
            data: data,
            responseTime: responseTime
          });
        });
      });

      req.on('error', (error) => {
        const responseTime = Date.now() - startTime;
        console.error(`TESTE DIRETO - Erro na requisição HTTP:`, {
          message: error.message,
          code: error.code,
          hostname: options.hostname,
          port: options.port,
          responseTime: responseTime
        });
        reject(error);
      });

      req.on('timeout', () => {
        const responseTime = Date.now() - startTime;
        console.error(`TESTE DIRETO - Timeout após ${responseTime}ms`);
        req.destroy();
        reject(new Error('Timeout na requisição'));
      });

      req.end();
    });

    return NextResponse.json({
      testStatus: 'SUCCESS',
      environment: process.env.NODE_ENV || 'development',
      url: authUrl,
      result: {
        status: authResponse.status,
        responseTime: authResponse.responseTime,
        authHeader: authResponse.headers.authorization || 'NOT_FOUND',
        hasData: !!authResponse.data
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('TESTE DIRETO - Erro:', error);
    
    return NextResponse.json({
      testStatus: 'FAILED',
      environment: process.env.NODE_ENV || 'development',
      error: error.message,
      errorCode: error.code,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 