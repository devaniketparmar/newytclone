import { NextApiRequest, NextApiResponse } from 'next';
import { getPrisma } from '@/lib/prisma';

// POST /api/videos/[id]/watchtime
// Body: { secondsWatched: number, position?: number, completed?: boolean, sessionId?: string }
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const prisma = getPrisma();

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { id: videoId } = req.query;
    if (!videoId || Array.isArray(videoId)) return res.status(400).json({ success: false, message: 'Missing video id' });

  const { secondsWatched, position: _position, completed: _completed } = req.body || {};

    if (typeof secondsWatched !== 'number' || secondsWatched <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid secondsWatched' });
    }

  // Try to identify user if authenticated - avoid `any` for lint rules
  const typedReq = req as unknown as { user?: { id?: string } };
  const user = typedReq.user || null;
  const userId = user?.id || null;

    // Use IP address for anonymous viewers
    const ipAddress = req.headers['x-forwarded-for']?.toString().split(',')[0].trim() || req.socket.remoteAddress || undefined;

    // Find an existing view for this user/video (prefer today) for authenticated users
    let existingView = null;

    if (userId) {
      existingView = await prisma.view.findFirst({
        where: {
          videoId: videoId as string,
          userId: userId
        },
        orderBy: { createdAt: 'desc' }
      });
    } else if (ipAddress) {
      existingView = await prisma.view.findFirst({
        where: {
          videoId: videoId as string,
          ipAddress: ipAddress
        },
        orderBy: { createdAt: 'desc' }
      });
    }

    if (existingView) {
      // Update watch duration and completion
      const newDuration = (existingView.watchDuration || 0) + Math.round(secondsWatched);
      const completionPercentage = Math.min(100, Math.round(((newDuration) / (Number(req.body.videoDuration) || 1)) * 100));

      await prisma.view.update({
        where: { id: existingView.id },
        data: {
          watchDuration: newDuration,
          completionPercentage: completionPercentage,
          updatedAt: new Date()
        }
      });
    } else {
      // Create new view record
      await prisma.view.create({
        data: {
          videoId: videoId as string,
          userId: userId || null,
          ipAddress: ipAddress as string | undefined,
          userAgent: req.headers['user-agent'] || undefined,
          watchDuration: Math.round(secondsWatched),
          completionPercentage: 0
        }
      });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('watchtime api error', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}
