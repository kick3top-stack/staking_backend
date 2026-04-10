import type { VercelRequest, VercelResponse } from '@vercel/node';
import { SiweMessage } from 'siwe';
import { connectDB } from '../../lib/db';
import { Nonce, User } from '../../lib/models';
import { signToken } from '../../lib/jwt';
import { setCors } from '../../lib/cors';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { message, signature } = req.body as { message?: string; signature?: string };
  if (!message || !signature) {
    return res.status(400).json({ error: 'message and signature are required' });
  }

  await connectDB();

  try {
    const siweMessage = new SiweMessage(message);
    const { data: fields } = await siweMessage.verify({ signature });

    const address = fields.address.toLowerCase();

    // Check nonce matches what we issued
    const stored = await Nonce.findOne({ address });
    if (!stored || stored.nonce !== fields.nonce) {
      return res.status(401).json({ error: 'Invalid or expired nonce' });
    }

    // Consume nonce — one-time use
    await Nonce.deleteOne({ address });

    // Upsert user
    await User.findOneAndUpdate(
      { address },
      { lastLogin: new Date() },
      { upsert: true }
    );

    const token = signToken(address);
    return res.status(200).json({ token, address });
  } catch (err: unknown) {
    return res.status(401).json({ error: (err as Error).message ?? 'Verification failed' });
  }
}
