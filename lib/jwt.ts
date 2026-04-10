import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET ?? 'dev_secret_change_me';

export function signToken(address: string): string {
  return jwt.sign({ address: address.toLowerCase() }, SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): { address: string } {
  return jwt.verify(token, SECRET) as { address: string };
}
