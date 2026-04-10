import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectDB } from '../../lib/db';
import { Nonce } from '../../lib/models';
import { setCors } from '../../lib/cors';
import { randomBytes } from 'crypto';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { address } = req.body as { address?: string };
  if (!address) return res.status(400).json({ error: 'address is required' });

  try {
    await connectDB();
  } catch (err: unknown) {
    return res.status(500).json({ error: 'DB connection failed', detail: (err as Error).message });
  }

  const nonce = randomBytes(16).toString('hex');
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min TTL

  await Nonce.findOneAndUpdate(
    { address: address.toLowerCase() },
    { nonce, expiresAt },
    { upsert: true }
  );

  return res.status(200).json({ nonce });
}
