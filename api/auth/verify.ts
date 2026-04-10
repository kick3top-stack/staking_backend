import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyMessage } from 'ethers';
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
    // Recover address from signature
    const recoveredAddress = verifyMessage(message, signature).toLowerCase();

    // Parse nonce and address from the plain message
    const nonceMatch = message.match(/Nonce: ([a-f0-9]+)/);
    const addressMatch = message.split('\n')[1]?.trim();

    if (!nonceMatch || !addressMatch) {
      return res.status(400).json({ error: 'Invalid message format' });
    }

    const nonce = nonceMatch[1];
    const address = addressMatch.toLowerCase();

    // Verify recovered address matches claimed address
    if (recoveredAddress !== address) {
      return res.status(401).json({ error: 'Signature mismatch' });
    }

    // Check nonce matches what we issued
    const stored = await Nonce.findOne({ address });
    if (!stored || stored.nonce !== nonce) {
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
