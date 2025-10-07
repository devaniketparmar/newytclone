import type { NextApiRequest, NextApiResponse } from 'next';
import { JWTUtils } from '@/utils/auth';
import historyStore from '@/lib/historyStore';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query as { id: string };
  
  // Get token from Authorization header or cookies
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace('Bearer ', '') || req.cookies.token;
  
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  // Verify token
  const decoded = JWTUtils.verifyToken(token);
  if (!decoded || !(decoded as any).userId) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired token'
    });
  }

  // Use user ID as the key for history storage
  const key = (decoded as any).userId;

  if (req.method === 'DELETE') {
    historyStore.removeHistory(id, key);
    return res.status(200).json({ success: true });
  }

  res.setHeader('Allow', ['DELETE']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
