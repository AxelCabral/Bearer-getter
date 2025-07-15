export default async function handler(req, res) {
  try {
    const result = await fetch('https://www.sentus.inf.br/v1000/auth', {
      method: 'POST',
      headers: {
        'user': 'teste@rayalimentos',
        'key': 'chaveFakeParaTeste123'
      },
      timeout: 7000,
    });

    const text = await result.text();
    return res.status(result.status).json({
      status: result.status,
      headers: Object.fromEntries(result.headers.entries()),
      body: text
    });
  } catch (err) {
    return res.status(500).json({
      message: err.message,
      stack: err.stack,
      name: err.name,
      cause: err.cause
    });
  }
} 