import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const testData = {
      user: "dados@rayalimentos", 
      key: "QTlbWzGk5rDWCazeEk+bLA=="
    };

    const authUrl = 'http://www.sentus.inf.br/v1000/auth';
    
    console.log(`DIRETO SEM MIDDLEWARE - Ambiente: ${process.env.NODE_ENV || 'development'}`);

    const startTime = Date.now();

    const response = await fetch(authUrl, {
      method: 'POST',
      headers: {
        'user': testData.user,
        'key': testData.key,
      },
      signal: AbortSignal.timeout(25000) // 25s timeout
    });

    const responseTime = Date.now() - startTime;
    const authHeader = response.headers.get('authorization');
    
    return NextResponse.json({
      success: response.ok && authHeader,
      status: response.status,
      responseTime: responseTime,
      authHeader: authHeader || 'NOT_FOUND',
      message: 'Teste DIRETO - sem middleware, sem rate limit'
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message,
      message: 'Teste DIRETO - falhou'
    }, { status: 500 });
  }
} 