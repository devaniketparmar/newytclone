import { NextApiRequest, NextApiResponse } from 'next';
import { JWTUtils } from '@/utils/auth';
import { getInitializedPrisma } from '@/lib/prisma';
import { SerializationUtils } from '@/utils/serialization';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const prisma = await getInitializedPrisma();
    
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
    if (!decoded || !decoded.userId) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }

    // Get pagination parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    // Get user's subscribed channel IDs
    const subscriptions = await prisma.subscription.findMany({
      where: {
        userId: decoded.userId
      },
      select: {
        channelId: true
      }
    });

    const subscribedChannelIds = subscriptions.map(sub => sub.channelId);

    if (subscribedChannelIds.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          videos: [],
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false
          }
        }
      });
    }

    // Get total count for pagination
    const totalVideos = await prisma.video.count({
      where: {
        channelId: {
          in: subscribedChannelIds
        },
        status: 'READY',
        privacy: 'PUBLIC'
      }
    });

    // Get videos from subscribed channels
    const videos = await prisma.video.findMany({
      where: {
        channelId: {
          in: subscribedChannelIds
        },
        status: 'READY',
        privacy: 'PUBLIC'
      },
      include: {
        channel: {
          select: {
            id: true,
            name: true,
            avatarUrl: true
          }
        }
      },
      orderBy: {
        publishedAt: 'desc'
      },
      skip,
      take: limit
    });

    // Format the response
    const formattedVideos = videos.map(video => SerializationUtils.formatVideo(video));

    const totalPages = Math.ceil(totalVideos / limit);

    return res.status(200).json({
      success: true,
      data: {
        videos: formattedVideos,
        pagination: {
          page,
          limit,
          total: totalVideos,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Error fetching subscription videos:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error. Please try again later.'
    });
  }
}
