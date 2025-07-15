import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Parâmetros de teste
    const testData = {
      user: "dados@rayalimentos",
      key: "QTlbWzGk5rDWCazeEk+bLA==",
      apiToken: "tkn_b8f2a9e1c5d7h3j9k4m6n2p8q1r5s7t9v2w4x6y8z1"
    };

    // Obtém a URL base da requisição atual
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000';

    console.log(`Testando autenticação em: ${baseUrl}/api/auth`);

    // Faz requisição para nossa própria API de auth
    const response = await fetch(`${baseUrl}/api/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-token': testData.apiToken
      },
      body: JSON.stringify({
        user: testData.user,
        key: testData.key,
        apiToken: testData.apiToken
      })
    });

    const result = await response.json();
    const success = response.ok;

    return NextResponse.json({
      testStatus: success ? 'SUCCESS' : 'FAILED',
      httpStatus: response.status,
      testData: {
        user: testData.user,
        key: testData.key.substring(0, 8) + '...',
        apiToken: testData.apiToken.substring(0, 12) + '...'
      },
      result: result,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      baseUrl: baseUrl
    });

  } catch (error) {
    console.error('Erro no teste de autenticação:', error);
    
    return NextResponse.json({
      testStatus: 'ERROR',
      error: error.message,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    }, { status: 500 });
  }
} 