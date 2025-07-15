import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function GET() {
  try {
    const testData = {
      user: "dados@rayalimentos",
      key: "QTlbWzGk5rDWCazeEk+bLA=="
    };

    const authUrl = 'http://www.sentus.inf.br/v1000/auth';
    
    console.log(`TESTE CURL - Ambiente: ${process.env.NODE_ENV || 'development'}`);
    console.log(`TESTE CURL - URL: ${authUrl}`);
    console.log(`TESTE CURL - User: ${testData.user}`);

    const startTime = Date.now();

    // Comando curl equivalente ao que fazíamos com Node.js
    const curlCommand = `curl -X POST "${authUrl}" ` +
      `-H "user: ${testData.user}" ` +
      `-H "key: ${testData.key}" ` +
      `--connect-timeout 15 ` +
      `--max-time 30 ` +
      `-v -s`;

    console.log(`TESTE CURL - Comando: ${curlCommand}`);

    const { stdout, stderr } = await execAsync(curlCommand);
    const responseTime = Date.now() - startTime;

    console.log(`TESTE CURL - Stdout: ${stdout}`);
    console.log(`TESTE CURL - Stderr: ${stderr}`);
    console.log(`TESTE CURL - Tempo: ${responseTime}ms`);

    // Extrair headers do stderr (curl -v output)
    const authHeaderMatch = stderr.match(/< authorization:\s*(.+)/i);
    const authHeader = authHeaderMatch ? authHeaderMatch[1].trim() : null;

    // Verificar se obtivemos um Bearer token
    const success = authHeader && authHeader.startsWith('Bearer ');

    return NextResponse.json({
      testStatus: success ? 'SUCCESS' : 'FAILED',
      method: 'CURL',
      environment: process.env.NODE_ENV || 'development',
      url: authUrl,
      result: {
        responseTime: responseTime,
        authHeader: authHeader || 'NOT_FOUND',
        hasOutput: !!stdout,
        stdout: stdout.substring(0, 200),
        stderr: stderr.substring(0, 500)
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('TESTE CURL - Erro:', error);
    
    return NextResponse.json({
      testStatus: 'ERROR',
      method: 'CURL',
      environment: process.env.NODE_ENV || 'development',
      error: error.message,
      stderr: error.stderr?.substring(0, 500),
      stdout: error.stdout?.substring(0, 200),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 