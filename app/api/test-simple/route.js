import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const testData = {
      user: "dados@rayalimentos",
      key: "QTlbWzGk5rDWCazeEk+bLA=="
    };

    const authUrl = 'http://www.sentus.inf.br/v1000/auth';
    
    console.log(`TESTE SIMPLES - Ambiente: ${process.env.NODE_ENV || 'development'}`);
    console.log(`TESTE SIMPLES - URL: ${authUrl}`);

    const startTime = Date.now();

    // Requisição super simples com fetch
    const response = await fetch(authUrl, {
      method: 'POST',
      headers: {
        'user': testData.user,
        'key': testData.key,
        'User-Agent': 'Mozilla/5.0 (compatible; NextJS-App/1.0)'
      },
      signal: AbortSignal.timeout(20000) // 20s timeout
    });

    const responseTime = Date.now() - startTime;
    console.log(`TESTE SIMPLES - Response status: ${response.status} em ${responseTime}ms`);
    
    const authHeader = response.headers.get('authorization');
    const responseText = await response.text();
    
    console.log(`TESTE SIMPLES - Auth header: ${authHeader}`);
    console.log(`TESTE SIMPLES - Response text (100 chars): ${responseText.substring(0, 100)}`);

    return NextResponse.json({
      testStatus: response.ok && authHeader ? 'SUCCESS' : 'FAILED',
      method: 'FETCH_SIMPLE',
      environment: process.env.NODE_ENV || 'development',
      url: authUrl,
      result: {
        status: response.status,
        responseTime: responseTime,
        authHeader: authHeader || 'NOT_FOUND',
        hasResponse: !!responseText,
        headers: Object.fromEntries(response.headers.entries())
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('TESTE SIMPLES - Erro:', error);
    
    return NextResponse.json({
      testStatus: 'ERROR',
      method: 'FETCH_SIMPLE',
      environment: process.env.NODE_ENV || 'development',
      error: error.message,
      errorName: error.name,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 