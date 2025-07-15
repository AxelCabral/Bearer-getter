import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const testData = {
      user: "dados@rayalimentos",
      key: "QTlbWzGk5rDWCazeEk+bLA=="
    };

    // FORÇAR HTTPS para ver se o roteamento é diferente
    const authUrl = 'https://www.sentus.inf.br/v1000/auth';
    
    console.log(`TESTE HTTPS - Ambiente: ${process.env.NODE_ENV || 'development'}`);
    console.log(`TESTE HTTPS - URL: ${authUrl}`);

    const startTime = Date.now();

    const response = await fetch(authUrl, {
      method: 'POST',
      headers: {
        'user': testData.user,
        'key': testData.key,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      signal: AbortSignal.timeout(30000) // 30s timeout
    });

    const responseTime = Date.now() - startTime;
    const authHeader = response.headers.get('authorization');
    const responseText = await response.text();
    
    console.log(`TESTE HTTPS - Status: ${response.status}, Tempo: ${responseTime}ms`);
    console.log(`TESTE HTTPS - Auth header: ${authHeader}`);

    return NextResponse.json({
      testStatus: response.ok && authHeader ? 'SUCCESS' : 'FAILED',
      method: 'FETCH_HTTPS',
      environment: process.env.NODE_ENV || 'development',
      url: authUrl,
      result: {
        status: response.status,
        responseTime: responseTime,
        authHeader: authHeader || 'NOT_FOUND',
        hasResponse: !!responseText,
        responseLength: responseText.length
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('TESTE HTTPS - Erro:', error);
    
    return NextResponse.json({
      testStatus: 'ERROR',
      method: 'FETCH_HTTPS',
      environment: process.env.NODE_ENV || 'development',
      error: error.message,
      errorName: error.name,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 