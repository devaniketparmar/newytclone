import { NextApiRequest, NextApiResponse } from 'next';
import { getInitializedPrisma } from '@/lib/prisma';
import { JWTUtils } from '@/utils/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const prisma = await getInitializedPrisma();
    
    // Get token from Authorization header or cookies
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '') || req.cookies.token;
    
    if (!token) {
      return res.status(401).json({ success: false, error: 'No authentication token provided' });
    }

    // Verify token
    const decoded = JWTUtils.verifyToken(token);
    if (!decoded || !decoded.userId) {
      return res.status(401).json({ success: false, error: 'Invalid or expired token' });
    }

    const { page = '1', limit = '10', category, trending } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    let whereClause: any = {
      videoType: 'SHORTS',
      published: true
    };

    // Add category filter if provided
    if (category) {
      whereClause.category = category;
    }

    // Add trending filter
    if (trending === 'true') {
      // Order by views and likes for trending
      const videos = await prisma.video.findMany({
        where: whereClause,
        include: {
          channel: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
              subscriberCount: true,
              verified: true
            }
          },
          _count: {
            select: {
              likes: true,
              comments: true
            }
          }
        },
        orderBy: [
          { viewCount: 'desc' },
          { createdAt: 'desc' }
        ],
        skip,
        take: limitNum
      });

      return res.status(200).json({
        success: true,
        data: videos.map(video => ({
          id: video.id,
          title: video.title,
          description: video.description,
          thumbnailUrl: video.thumbnailUrl,
          videoUrl: video.videoUrl,
          duration: video.duration,
          viewCount: video.viewCount,
          likeCount: video._count.likes,
          commentCount: video._count.comments,
          createdAt: video.createdAt,
          publishedAt: video.publishedAt,
          channel: video.channel,
          hashtags: video.hashtags
        }))
      });
    }

    // Default feed - mix of recent and popular
    const videos = await prisma.video.findMany({
      where: whereClause,
      include: {
        channel: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            subscriberCount: true,
            verified: true
          }
        },
        _count: {
          select: {
            likes: true,
            comments: true
          }
        }
      },
      orderBy: [
        { createdAt: 'desc' }
      ],
      skip,
      take: limitNum
    });

    return res.status(200).json({
      success: true,
      data: videos.map(video => ({
        id: video.id,
        title: video.title,
        description: video.description,
        thumbnailUrl: video.thumbnailUrl,
        videoUrl: video.videoUrl,
        duration: video.duration,
        viewCount: video.viewCount,
        likeCount: video._count.likes,
        commentCount: video._count.comments,
        createdAt: video.createdAt,
        publishedAt: video.publishedAt,
        channel: video.channel,
        hashtags: video.hashtags
      }))
    });

  } catch (error) {
    console.error('Error fetching Shorts:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}
