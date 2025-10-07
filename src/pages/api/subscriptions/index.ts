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

    // Get user's subscriptions with channel details
    const subscriptions = await prisma.subscription.findMany({
      where: {
        userId: decoded.userId
      },
      include: {
        channel: {
          include: {
            user: {
              select: {
                username: true,
                firstName: true,
                lastName: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Get query parameters for pagination
    const { page = '1', limit = '10' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    // Get latest videos from subscribed channels
    const subscribedChannelIds = subscriptions.map(sub => sub.channel.id);
    
    const latestVideos = await prisma.video.findMany({
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
      skip: offset,
      take: limitNum
    });

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

    // Format the response
    const channels = subscriptions.map(subscription => ({
      id: subscription.channel.id,
      name: subscription.channel.name,
      description: subscription.channel.description,
      avatarUrl: subscription.channel.avatarUrl,
      subscriberCount: Number(subscription.channel.subscriberCount),
      videoCount: Number(subscription.channel.videoCount),
      user: subscription.channel.user
    }));

    const videos = latestVideos.map(video => SerializationUtils.formatVideo(video));

    return res.status(200).json({
      success: true,
      data: {
        channels,
        videos,
        totalSubscriptions: subscriptions.length
      },
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalVideos,
        totalPages: Math.ceil(totalVideos / limitNum),
        hasNext: pageNum * limitNum < totalVideos,
        hasPrev: pageNum > 1
      }
    });

  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error. Please try again later.'
    });
  }
}
