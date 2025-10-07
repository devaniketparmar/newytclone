import type { NextApiRequest, NextApiResponse } from 'next';
import { JWTUtils } from '@/utils/auth';
import historyStore from '@/lib/historyStore';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
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

  if (req.method === 'GET') {
    const data = historyStore.getHistory(key);
    return res.status(200).json({ success: true, data });
  }

  if (req.method === 'POST') {
    const { id, title, thumbnailUrl, duration, viewCount, publishedAt, channel } = req.body;
    if (!id || !title) return res.status(400).json({ success: false, message: 'id and title required' });
    const item = historyStore.addHistory({ id, title, thumbnailUrl, duration, viewCount, publishedAt, channel }, key);
    return res.status(201).json({ success: true, data: item });
  }

  if (req.method === 'DELETE') {
    historyStore.clearHistory(key);
    return res.status(200).json({ success: true });
  }

  res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
