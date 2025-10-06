import { NextApiRequest, NextApiResponse } from 'next';
import { getInitializedPrisma } from '../../lib/prisma';
import { JWTUtils } from '../../utils/auth';
import { VideoStatus, VideoPrivacy } from '@prisma/client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return handleGetUserVideos(req, res);
  }
  
  res.setHeader('Allow', ['GET']);
  res.status(405).json({ success: false, error: 'Method not allowed' });
}

async function handleGetUserVideos(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Initialize database connection
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

    let userId = null;
    try {
      const decoded = JWTUtils.verifyToken(token);
      if (decoded && decoded.userId) {
        userId = decoded.userId;
      }
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    }

    // Get query parameters
    const { page = '1', limit = '20', status, privacy, search } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    // Find user's channel
    const channel = await prisma.channel.findFirst({
      where: { userId: userId }
    });

    if (!channel) {
      return res.status(404).json({
        success: false,
        error: 'Channel not found'
      });
    }

    // Build where clause for user's videos
    const where: any = {
      channelId: channel.id
    };

    if (status) {
      where.status = status as VideoStatus;
    }

    if (privacy) {
      where.privacy = privacy as VideoPrivacy;
    }

    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    // Get user's videos with channel information
    const videos = await prisma.video.findMany({
      where,
      include: {
        channel: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            subscriberCount: true,
            userId: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: offset,
      take: limitNum
    });

    // Get total count for pagination
    const totalCount = await prisma.video.count({ where });

    // Get additional stats
    const stats = await prisma.video.aggregate({
      where: { channelId: channel.id },
      _sum: {
        viewCount: true,
        likeCount: true,
        commentCount: true
      },
      _count: {
        id: true
      }
    });

    // Format response
    const formattedVideos = videos.map(video => ({
      id: video.id,
      title: video.title,
      description: video.description,
      thumbnailUrl: video.thumbnailUrl,
      videoUrl: video.videoUrl,
      duration: video.duration,
      viewCount: Number(video.viewCount),
      likeCount: video.likeCount,
      commentCount: video.commentCount,
      createdAt: video.createdAt,
      publishedAt: video.publishedAt || video.createdAt,
      updatedAt: video.updatedAt,
      status: video.status,
      privacy: video.privacy,
      metadata: video.metadata,
      channel: {
        id: video.channel.id,
        name: video.channel.name,
        avatarUrl: video.channel.avatarUrl,
        subscriberCount: Number(video.channel.subscriberCount),
        userId: video.channel.userId
      }
    }));

    res.status(200).json({
      success: true,
      data: formattedVideos,
      stats: {
        totalVideos: stats._count.id,
        totalViews: Number(stats._sum.viewCount || 0),
        totalLikes: stats._sum.likeCount || 0,
        totalComments: stats._sum.commentCount || 0
      },
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limitNum),
        hasNext: pageNum * limitNum < totalCount,
        hasPrev: pageNum > 1
      }
    });

  } catch (error) {
    console.error('Get user videos error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error. Please try again later.'
    });
  }
}
