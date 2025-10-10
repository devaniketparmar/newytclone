import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { JWTUtils } from '@/utils/auth';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { videoId, type, platform } = req.body;

  try {

    if (!videoId || !type) {
      return res.status(400).json({ error: 'Video ID and share type are required' });
    }

    // Get user session (optional for anonymous shares)
    let userId = null;
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '') || req.cookies.token;
    
    if (token) {
      try {
        const decoded = JWTUtils.verifyToken(token);
        if (decoded && decoded.userId) {
          userId = decoded.userId;
        }
      } catch {
        // Token is invalid, but we allow anonymous shares
        console.log('Invalid token for share recording, proceeding anonymously');
      }
    }

    // Get client IP and user agent
    const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    // Create share record
    const share = await prisma.share.create({
      data: {
        videoId,
        userId,
        type,
        platform: platform || null,
        ipAddress: Array.isArray(ipAddress) ? ipAddress[0] : ipAddress,
        userAgent,
      },
    });

    // Update video share count
    await prisma.video.update({
      where: { id: videoId },
      data: {
        shareCount: {
          increment: 1,
        },
      },
    });

    // Update or create daily analytics
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await prisma.videoAnalytics.upsert({
      where: {
        videoId_date: {
          videoId,
          date: today,
        },
      },
      update: {
        shares: {
          increment: 1,
        },
      },
      create: {
        videoId,
        date: today,
        shares: 1,
        views: 0,
        uniqueViewers: 0,
        watchTime: 0,
        likes: 0,
        dislikes: 0,
        comments: 0,
        subscribersGained: 0,
        subscribersLost: 0,
      },
    });

    return res.status(200).json({ 
      success: true, 
      shareId: share.id,
      message: 'Share recorded successfully' 
    });

  } catch (error) {
    console.error('Error recording share:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      videoId,
      type,
      platform
    });
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
