import type { NextApiRequest, NextApiResponse } from 'next';
import historyStore from '@/lib/historyStore';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const key = 'default'; // in production use user id from session

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
