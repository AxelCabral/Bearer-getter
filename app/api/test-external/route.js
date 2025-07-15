import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log(`TESTE EXTERNO - Ambiente: ${process.env.NODE_ENV || 'development'}`);

    const tests = [
      {
        name: 'JSONPlaceholder',
        url: 'https://jsonplaceholder.typicode.com/posts/1',
        method: 'GET'
      },
      {
        name: 'HTTPBin POST',
        url: 'https://httpbin.org/post',
        method: 'POST',
        body: JSON.stringify({ test: 'data' }),
        headers: { 'Content-Type': 'application/json' }
      }
    ];

    const results = [];

    for (const test of tests) {
      try {
        const startTime = Date.now();
        
        const response = await fetch(test.url, {
          method: test.method,
          headers: test.headers || {},
          body: test.body || undefined,
          signal: AbortSignal.timeout(15000)
        });

        const responseTime = Date.now() - startTime;
        const responseText = await response.text();

        results.push({
          name: test.name,
          url: test.url,
          success: response.ok,
          status: response.status,
          responseTime: responseTime,
          hasResponse: !!responseText
        });

        console.log(`TESTE EXTERNO - ${test.name}: ${response.status} em ${responseTime}ms`);
        
      } catch (error) {
        results.push({
          name: test.name,
          url: test.url,
          success: false,
          error: error.message
        });
        console.error(`TESTE EXTERNO - ${test.name}: ${error.message}`);
      }
    }

    const allSuccess = results.every(r => r.success);

    return NextResponse.json({
      testStatus: allSuccess ? 'SUCCESS' : 'MIXED',
      message: allSuccess ? 'Conectividade externa OK' : 'Problemas de conectividade',
      environment: process.env.NODE_ENV || 'development',
      results: results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return NextResponse.json({
      testStatus: 'ERROR',
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 