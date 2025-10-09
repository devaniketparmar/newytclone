import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { JWTUtils } from '@/utils/auth';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ success: false, message: 'Channel ID is required' });
    }

    // Get token from Authorization header or cookies
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '') || req.cookies.token;
    
    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    // Verify token
    const decoded = JWTUtils.verifyToken(token);
    if (!decoded || !decoded.userId) {
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }

    const userId = decoded.userId;

    // Verify user owns this channel (id should match the authenticated user)
    if (id !== userId) {
      return res.status(403).json({ success: false, message: 'Access denied - you can only view your own channel stats' });
    }

    // Get user to verify they exist and get their channel
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        channels: true
      }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Get the user's channel
    const channel = user.channels[0];
    if (!channel) {
      return res.status(404).json({ success: false, message: 'Channel not found' });
    }

    console.log('User found:', user.id, 'Channel found:', channel.id, 'Looking for videos with channelId:', channel.id);

    // Get channel statistics - include ALL videos, not just published ones
    const [
      totalVideos,
      totalViews,
      totalSubscribers,
      totalLikes,
      totalComments,
      avgWatchTime
    ] = await Promise.all([
      // Total videos count - ALL videos (by channelId)
      prisma.video.count({
        where: {
          channelId: channel.id
        }
      }),
      
      // Total views across all videos - ALL videos (by channelId)
      prisma.video.aggregate({
        where: {
          channelId: channel.id
        },
        _sum: {
          viewCount: true
        }
      }),
      
      // Total subscribers (by channelId)
      prisma.subscription.count({
        where: {
          channelId: channel.id
        }
      }),
      
      // Total likes across all videos - ALL videos (by channelId)
      prisma.like.aggregate({
        where: {
          video: {
            channelId: channel.id
          },
          type: 'LIKE'
        },
        _count: {
          id: true
        }
      }),
      
      // Total comments across all videos - ALL videos (by channelId)
      prisma.comment.count({
        where: {
          video: {
            channelId: channel.id
          }
        }
      }),
      
      // Average watch time (in seconds) - ALL videos (by channelId)
      prisma.video.aggregate({
        where: {
          channelId: channel.id
        },
        _avg: {
          duration: true
        }
      })
    ]);

    console.log('Query results:', {
      totalVideos,
      totalViews: totalViews._sum.viewCount,
      totalSubscribers,
      totalLikes: totalLikes._count.id,
      totalComments,
      avgWatchTime: avgWatchTime._avg.duration
    });

    // Convert BigInt to Number for JSON serialization
    const totalViewsNumber = totalViews._sum.viewCount ? Number(totalViews._sum.viewCount) : 0;
    const avgWatchTimeNumber = avgWatchTime._avg.duration || 0;

    // Calculate additional metrics
    const channelStats = {
      totalVideos: totalVideos || 0,
      totalViews: totalViewsNumber,
      totalSubscribers: totalSubscribers || 0,
      totalLikes: totalLikes._count.id || 0,
      totalComments: totalComments || 0,
      avgWatchTime: Math.round(avgWatchTimeNumber),
      revenue: 0, // This would be calculated based on monetization
      // Additional metrics
      totalWatchTime: totalViewsNumber * avgWatchTimeNumber,
      engagementRate: totalSubscribers > 0 ? ((totalLikes._count.id || 0) + (totalComments || 0)) / totalSubscribers : 0,
      avgViewsPerVideo: totalVideos > 0 ? Math.round(totalViewsNumber / totalVideos) : 0
    };

    res.status(200).json({
      success: true,
      data: channelStats
    });

  } catch (error) {
    console.error('Error fetching channel stats:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  } finally {
    await prisma.$disconnect();
  }
}