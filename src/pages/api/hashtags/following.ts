import { NextApiRequest, NextApiResponse } from 'next';
import { getInitializedPrisma } from '@/lib/prisma';
import { JWTUtils } from '@/utils/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const prisma = await getInitializedPrisma();

  try {
    // Verify authentication
    const token = req.headers.authorization?.replace('Bearer ', '') || req.cookies.token;
    if (!token) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const decoded = JWTUtils.verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }

    const userId = decoded.userId;
    const { page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    if (req.method !== 'GET') {
      res.setHeader('Allow', ['GET']);
      return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    // Get user's followed hashtags
    const followedHashtags = await prisma.hashtagFollow.findMany({
      where: { userId },
      include: {
        hashtag: {
          select: {
            id: true,
            name: true,
            usageCount: true,
            followerCount: true,
            trendingScore: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limitNum,
    });

    // Get total count
    const totalCount = await prisma.hashtagFollow.count({
      where: { userId },
    });

    // Get recent videos from followed hashtags
    const recentVideos = await prisma.video.findMany({
      where: {
        videoTags: {
          some: {
            tag: {
              id: {
                in: followedHashtags.map(f => f.hashtag.id),
              },
            },
          },
        },
        status: 'READY',
        privacy: 'PUBLIC',
      },
      include: {
        channel: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            subscriberCount: true,
          },
        },
        _count: {
          select: {
            views: true,
            likes: true,
            comments: true,
          },
        },
        videoTags: {
          include: {
            tag: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { publishedAt: 'desc' },
      take: 10,
    });

    const formattedVideos = recentVideos.map(video => ({
      id: video.id,
      title: video.title,
      description: video.description,
      thumbnailUrl: video.thumbnailUrl,
      videoUrl: video.videoUrl,
      duration: video.duration,
      viewCount: Number(video._count.views),
      likeCount: video._count.likes,
      commentCount: video._count.comments,
      createdAt: video.createdAt.toISOString(),
      publishedAt: video.publishedAt?.toISOString(),
      channel: {
        id: video.channel.id,
        name: video.channel.name,
        avatarUrl: video.channel.avatarUrl,
        subscriberCount: Number(video.channel.subscriberCount),
      },
      hashtags: video.videoTags.map(vt => ({
        id: vt.tag.id,
        name: vt.tag.name,
      })),
    }));

    return res.status(200).json({
      success: true,
      data: {
        followedHashtags: followedHashtags.map(f => ({
          id: f.hashtag.id,
          name: f.hashtag.name,
          usageCount: f.hashtag.usageCount,
          followerCount: f.hashtag.followerCount,
          trendingScore: f.hashtag.trendingScore,
          followedAt: f.createdAt.toISOString(),
        })),
        recentVideos: formattedVideos,
        pagination: {
          total: totalCount,
          page: pageNum,
          limit: limitNum,
          hasMore: (pageNum * limitNum) < totalCount,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching followed hashtags:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}
