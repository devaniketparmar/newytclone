import { NextApiRequest, NextApiResponse } from 'next';
import { JWTUtils } from '../../utils/auth';
import { prisma } from '../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const decoded = JWTUtils.verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const userId = decoded.userId;
    const page = parseInt(req.query.page as string) || 1;
    const sort = (req.query.sort as string) || 'recent';
    const filter = (req.query.filter as string) || 'all';
    const limit = 20;
    const offset = (page - 1) * limit;

    // Build where clause for filtering
    let dateFilter = {};
    if (filter !== 'all') {
      const now = new Date();
      let startDate = new Date();
      
      switch (filter) {
        case 'today':
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }
      
      dateFilter = {
        createdAt: {
          gte: startDate,
        },
      };
    }

    // Build order by clause
    let orderBy = {};
    switch (sort) {
      case 'recent':
        orderBy = { createdAt: 'desc' };
        break;
      case 'oldest':
        orderBy = { createdAt: 'asc' };
        break;
      case 'popular':
        orderBy = { video: { viewCount: 'desc' } };
        break;
    }

    // Get liked videos with video details
    const likedVideos = await prisma.like.findMany({
      where: {
        userId,
        videoId: { not: null },
        type: 'LIKE',
        ...dateFilter,
      },
      include: {
        video: {
          include: {
            channel: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
                subscriberCount: true,
                userId: true,
              },
            },
          },
        },
      },
      orderBy,
      take: limit,
      skip: offset,
    });

    // Transform the data
    const videos = likedVideos
      .filter(like => like.video) // Filter out any null videos
      .map(like => ({
        id: like.video!.id,
        title: like.video!.title,
        description: like.video!.description || '',
        thumbnailUrl: like.video!.thumbnailUrl,
        videoUrl: like.video!.videoUrl,
        duration: like.video!.duration,
        viewCount: Number(like.video!.viewCount),
        likeCount: like.video!.likeCount,
        commentCount: like.video!.commentCount,
        createdAt: like.video!.createdAt.toISOString(),
        publishedAt: like.video!.publishedAt?.toISOString() || like.video!.createdAt.toISOString(),
        status: like.video!.status,
        channel: like.video!.channel,
        likedAt: like.createdAt.toISOString(),
      }));

    return res.status(200).json({
      success: true,
      videos,
      hasMore: videos.length === limit,
      totalCount: videos.length,
    });
  } catch (error) {
    console.error('Error fetching liked videos:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
