import type { VercelRequest, VercelResponse } from '@vercel/node';

const ALLOWED_ORIGINS = [
  process.env.FRONTEND_URL ?? '',
  'https://staking-frontend-rho.vercel.app',
].filter(Boolean);

export function setCors(req: VercelRequest, res: VercelResponse) {
  const origin = req.headers.origin ?? '';

  // Allow exact matches + any vercel.app preview deployments for this project
  const isAllowed =
    ALLOWED_ORIGINS.includes(origin) ||
    /^https:\/\/staking-frontend.*\.vercel\.app$/.test(origin);

  res.setHeader('Access-Control-Allow-Origin', isAllowed ? origin : ALLOWED_ORIGINS[0]);
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Vary', 'Origin');
}
