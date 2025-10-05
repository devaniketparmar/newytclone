import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { getTrendingVideos, getTrendingVideosByCategory, getTrendingVideosByPeriod, getTrendingInsights } from '@/utils/trendingAlgorithm';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { 
      category = 'all', 
      period = 'all', 
      limit = '20',
      includeInsights = 'false'
    } = req.query;

    // Parse limit
    const limitNum = parseInt(limit as string, 10);
    const validLimit = Math.min(Math.max(limitNum, 1), 100); // Between 1 and 100

    // Fetch videos with all necessary data
    const videos = await prisma.video.findMany({
      where: {
        status: 'READY'
      },
      include: {
        channel: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            subscriberCount: true,
            userId: true
          }
        },
        _count: {
          select: {
            views: true,
            likes: true,
            comments: true
          }
        }
      },
      orderBy: {
        publishedAt: 'desc'
      }
    });

    // Transform videos to match our interface
    const formattedVideos = videos.map(video => ({
      id: video.id,
      title: video.title,
      description: video.description,
      thumbnailUrl: video.thumbnailUrl,
      videoUrl: video.videoUrl,
      duration: video.duration,
      viewCount: video._count.views,
      likeCount: video._count.likes,
      dislikeCount: 0, // We don't track dislikes separately
      commentCount: video._count.comments,
      createdAt: video.createdAt.toISOString(),
      publishedAt: video.publishedAt.toISOString(),
      status: video.status as 'PROCESSING' | 'READY' | 'FAILED',
      channel: {
        id: video.channel.id,
        name: video.channel.name,
        avatarUrl: video.channel.avatarUrl,
        subscriberCount: Number(video.channel.subscriberCount),
        userId: video.channel.userId
      }
    }));

    let trendingVideos;

    // Get trending videos based on filters
    if (category !== 'all') {
      trendingVideos = getTrendingVideosByCategory(formattedVideos, category as string, validLimit);
    } else if (period !== 'all') {
      trendingVideos = getTrendingVideosByPeriod(formattedVideos, period as 'today' | 'week' | 'month' | 'all', validLimit);
    } else {
      trendingVideos = getTrendingVideos(formattedVideos, validLimit);
    }

    // Prepare response data
    const responseData: any = {
      videos: trendingVideos,
      pagination: {
        total: trendingVideos.length,
        limit: validLimit,
        hasMore: false // Trending doesn't need pagination
      },
      filters: {
        category,
        period,
        limit: validLimit
      }
    };

    // Include insights if requested
    if (includeInsights === 'true') {
      responseData.insights = getTrendingInsights(formattedVideos);
    }

    return res.status(200).json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error('Error fetching trending videos:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch trending videos'
    });
  } finally {
    await prisma.$disconnect();
  }
}
