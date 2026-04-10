import type { VercelRequest, VercelResponse } from '@vercel/node';

export function setCors(_req: VercelRequest, res: VercelResponse) {
  const origin = process.env.FRONTEND_URL ?? '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}
