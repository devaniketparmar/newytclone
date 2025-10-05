import type { NextApiRequest, NextApiResponse } from 'next';
import historyStore from '@/lib/historyStore';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query as { id: string };
  const key = 'default';

  if (req.method === 'DELETE') {
    historyStore.removeHistory(id, key);
    return res.status(200).json({ success: true });
  }

  res.setHeader('Allow', ['DELETE']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
