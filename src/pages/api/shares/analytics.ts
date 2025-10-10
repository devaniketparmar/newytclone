import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { videoId, period = '7d' } = req.query;

    if (!videoId) {
      return res.status(400).json({ error: 'Video ID is required' });
    }

    // Calculate date range based on period
    const now = new Date();
    const startDate = new Date();

    switch (period) {
      case '1d':
        startDate.setDate(now.getDate() - 1);
        break;
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      default:
        startDate.setDate(now.getDate() - 7);
    }

    // Get share analytics
    const shareAnalytics = await prisma.share.findMany({
      where: {
        videoId: videoId as string,
        createdAt: {
          gte: startDate,
        },
      },
      select: {
        type: true,
        platform: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Get total share count
    const totalShares = await prisma.share.count({
      where: {
        videoId: videoId as string,
      },
    });

    // Get share count by platform
    const sharesByPlatform = await prisma.share.groupBy({
      by: ['platform'],
      where: {
        videoId: videoId as string,
        createdAt: {
          gte: startDate,
        },
      },
      _count: {
        platform: true,
      },
    });

    // Get share count by type
    const sharesByType = await prisma.share.groupBy({
      by: ['type'],
      where: {
        videoId: videoId as string,
        createdAt: {
          gte: startDate,
        },
      },
      _count: {
        type: true,
      },
    });

    // Get daily share counts
    const dailyShares = await prisma.videoAnalytics.findMany({
      where: {
        videoId: videoId as string,
        date: {
          gte: startDate,
        },
      },
      select: {
        date: true,
        shares: true,
      },
      orderBy: {
        date: 'asc',
      },
    });

    // Format response
    const response = {
      totalShares,
      period,
      startDate: startDate.toISOString(),
      endDate: now.toISOString(),
      analytics: {
        recentShares: shareAnalytics.slice(0, 10), // Last 10 shares
        sharesByPlatform: sharesByPlatform.map(item => ({
          platform: item.platform || 'unknown',
          count: item._count.platform,
        })),
        sharesByType: sharesByType.map(item => ({
          type: item.type,
          count: item._count.type,
        })),
        dailyShares: dailyShares.map(item => ({
          date: item.date.toISOString().split('T')[0],
          shares: item.shares,
        })),
      },
    };

    return res.status(200).json(response);

  } catch (error) {
    console.error('Error fetching share analytics:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
