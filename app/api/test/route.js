import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'OK',
    message: 'API funcionando',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    platform: 'Next.js'
  });
} 