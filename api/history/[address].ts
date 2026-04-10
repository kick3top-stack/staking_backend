import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyToken } from '../../lib/jwt';
import { setCors } from '../../lib/cors';

const SUBGRAPH_URL = process.env.SUBGRAPH_URL ?? '';

const HISTORY_QUERY = `
  query StakingHistory($address: String!) {
    stakeCreateds(
      where: { staker: $address }
      orderBy: blockTimestamp
      orderDirection: desc
      first: 100
    ) {
      id
      stakeId
      staker
      planId
      amount
      apr
      penalty
      blockTimestamp
      transactionHash
    }
    unstakeds(
      where: { staker: $address }
      orderBy: blockTimestamp
      orderDirection: desc
      first: 100
    ) {
      id
      stakeId
      staker
      amount
      reward
      blockTimestamp
      transactionHash
    }
  }
`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  // Verify JWT
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization header' });
  }
  try {
    verifyToken(authHeader.slice(7));
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  const { address } = req.query as { address: string };
  if (!address) return res.status(400).json({ error: 'address is required' });

  if (!SUBGRAPH_URL) {
    return res.status(503).json({ error: 'SUBGRAPH_URL is not configured' });
  }

  const response = await fetch(SUBGRAPH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: HISTORY_QUERY,
      variables: { address: address.toLowerCase() },
    }),
  });

  const json = await response.json() as { data?: unknown; errors?: unknown };
  if (json.errors) return res.status(500).json({ error: json.errors });

  return res.status(200).json(json.data);
}
