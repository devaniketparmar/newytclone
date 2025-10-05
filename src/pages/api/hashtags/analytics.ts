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
    const { hashtag, period = '7d', action = 'overview' } = req.query;

    if (req.method !== 'GET') {
      res.setHeader('Allow', ['GET']);
      return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    switch (action) {
      case 'overview':
        return await getHashtagOverview(req, res, prisma, hashtag as string, period as string);
      case 'trending':
        return await getTrendingAnalytics(req, res, prisma, period as string);
      case 'performance':
        return await getPerformanceAnalytics(req, res, prisma, hashtag as string, period as string);
      case 'comparison':
        return await getComparisonAnalytics(req, res, prisma, hashtag as string, period as string);
      case 'insights':
        return await getInsightsAnalytics(req, res, prisma, hashtag as string, period as string);
      default:
        return res.status(400).json({ success: false, error: 'Invalid action' });
    }
  } catch (error) {
    console.error('Hashtag analytics API error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}

async function getHashtagOverview(req: NextApiRequest, res: NextApiResponse, prisma: any, hashtag: string, period: string) {
  try {
    if (!hashtag) {
      return res.status(400).json({ success: false, error: 'Hashtag is required' });
    }

    // Find the hashtag
    const hashtagRecord = await prisma.tag.findUnique({
      where: { name: hashtag },
      include: {
        analytics: {
          orderBy: { date: 'desc' },
          take: 30, // Last 30 days
        },
        _count: {
          select: {
            videoTags: true,
            followers: true,
          },
        },
      },
    });

    if (!hashtagRecord) {
      return res.status(404).json({ success: false, error: 'Hashtag not found' });
    }

    // Calculate period date range
    const endDate = new Date();
    const startDate = new Date();
    const days = getPeriodDays(period);
    startDate.setDate(endDate.getDate() - days);

    // Get analytics for the period
    const periodAnalytics = await prisma.hashtagAnalytics.findMany({
      where: {
        hashtagId: hashtagRecord.id,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: 'asc' },
    });

    // Calculate metrics
    const totalViews = periodAnalytics.reduce((sum, analytics) => sum + analytics.views, 0);
    const totalEngagement = periodAnalytics.reduce((sum, analytics) => sum + analytics.engagement, 0);
    const totalNewFollowers = periodAnalytics.reduce((sum, analytics) => sum + analytics.newFollowers, 0);
    const totalVideosAdded = periodAnalytics.reduce((sum, analytics) => sum + analytics.videosAdded, 0);
    const averageTrendingScore = periodAnalytics.length > 0 
      ? periodAnalytics.reduce((sum, analytics) => sum + Number(analytics.trendingScore), 0) / periodAnalytics.length 
      : 0;

    // Calculate growth rates
    const firstHalf = periodAnalytics.slice(0, Math.floor(periodAnalytics.length / 2));
    const secondHalf = periodAnalytics.slice(Math.floor(periodAnalytics.length / 2));
    
    const firstHalfViews = firstHalf.reduce((sum, analytics) => sum + analytics.views, 0);
    const secondHalfViews = secondHalf.reduce((sum, analytics) => sum + analytics.views, 0);
    const viewsGrowthRate = firstHalfViews > 0 ? ((secondHalfViews - firstHalfViews) / firstHalfViews) * 100 : 0;

    // Get recent videos with this hashtag
    const recentVideos = await prisma.video.findMany({
      where: {
        videoTags: {
          some: {
            tag: {
              name: hashtag,
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
      },
      orderBy: { publishedAt: 'desc' },
      take: 10,
    });

    return res.status(200).json({
      success: true,
      data: {
        hashtag: {
          id: hashtagRecord.id,
          name: hashtagRecord.name,
          usageCount: hashtagRecord.usageCount,
          followerCount: hashtagRecord.followerCount,
          trendingScore: hashtagRecord.trendingScore,
          createdAt: hashtagRecord.createdAt,
        },
        metrics: {
          totalViews,
          totalEngagement,
          totalNewFollowers,
          totalVideosAdded,
          averageTrendingScore,
          viewsGrowthRate,
          engagementRate: totalViews > 0 ? (totalEngagement / totalViews) * 100 : 0,
        },
        analytics: periodAnalytics.map(analytics => ({
          date: analytics.date.toISOString().split('T')[0],
          views: analytics.views,
          engagement: analytics.engagement,
          newFollowers: analytics.newFollowers,
          videosAdded: analytics.videosAdded,
          trendingScore: Number(analytics.trendingScore),
        })),
        recentVideos: recentVideos.map(video => ({
          id: video.id,
          title: video.title,
          thumbnailUrl: video.thumbnailUrl,
          viewCount: Number(video._count.views),
          likeCount: video._count.likes,
          commentCount: video._count.comments,
          publishedAt: video.publishedAt?.toISOString(),
          channel: {
            id: video.channel.id,
            name: video.channel.name,
            avatarUrl: video.channel.avatarUrl,
            subscriberCount: Number(video.channel.subscriberCount),
          },
        })),
        period,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error getting hashtag overview:', error);
    return res.status(500).json({ success: false, error: 'Failed to get hashtag overview' });
  }
}

async function getTrendingAnalytics(req: NextApiRequest, res: NextApiResponse, prisma: any, period: string) {
  try {
    const days = getPeriodDays(period);
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    // Get trending hashtags for the period
    const trendingHashtags = await prisma.tag.findMany({
      where: {
        trendingScore: { gt: 0 },
        analytics: {
          some: {
            date: {
              gte: startDate,
              lte: endDate,
            },
          },
        },
      },
      include: {
        analytics: {
          where: {
            date: {
              gte: startDate,
              lte: endDate,
            },
          },
          orderBy: { date: 'desc' },
        },
        _count: {
          select: {
            videoTags: true,
            followers: true,
          },
        },
      },
      orderBy: { trendingScore: 'desc' },
      take: 20,
    });

    const formattedTrending = trendingHashtags.map(hashtag => {
      const totalViews = hashtag.analytics.reduce((sum, analytics) => sum + analytics.views, 0);
      const totalEngagement = hashtag.analytics.reduce((sum, analytics) => sum + analytics.engagement, 0);
      const totalNewFollowers = hashtag.analytics.reduce((sum, analytics) => sum + analytics.newFollowers, 0);

      return {
        id: hashtag.id,
        name: hashtag.name,
        usageCount: hashtag.usageCount,
        followerCount: hashtag.followerCount,
        trendingScore: Number(hashtag.trendingScore),
        metrics: {
          totalViews,
          totalEngagement,
          totalNewFollowers,
          engagementRate: totalViews > 0 ? (totalEngagement / totalViews) * 100 : 0,
        },
        growth: {
          viewsGrowth: calculateGrowthRate(hashtag.analytics.map(a => a.views)),
          followersGrowth: calculateGrowthRate(hashtag.analytics.map(a => a.newFollowers)),
        },
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        trendingHashtags: formattedTrending,
        period,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error getting trending analytics:', error);
    return res.status(500).json({ success: false, error: 'Failed to get trending analytics' });
  }
}

async function getPerformanceAnalytics(req: NextApiRequest, res: NextApiResponse, prisma: any, hashtag: string, period: string) {
  try {
    if (!hashtag) {
      return res.status(400).json({ success: false, error: 'Hashtag is required' });
    }

    const hashtagRecord = await prisma.tag.findUnique({
      where: { name: hashtag },
    });

    if (!hashtagRecord) {
      return res.status(404).json({ success: false, error: 'Hashtag not found' });
    }

    const days = getPeriodDays(period);
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    // Get detailed performance metrics
    const analytics = await prisma.hashtagAnalytics.findMany({
      where: {
        hashtagId: hashtagRecord.id,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: 'asc' },
    });

    // Calculate performance metrics
    const performanceMetrics = {
      views: analytics.map(a => ({ date: a.date.toISOString().split('T')[0], value: a.views })),
      engagement: analytics.map(a => ({ date: a.date.toISOString().split('T')[0], value: a.engagement })),
      followers: analytics.map(a => ({ date: a.date.toISOString().split('T')[0], value: a.newFollowers })),
      videos: analytics.map(a => ({ date: a.date.toISOString().split('T')[0], value: a.videosAdded })),
      trendingScore: analytics.map(a => ({ date: a.date.toISOString().split('T')[0], value: Number(a.trendingScore) })),
    };

    // Calculate averages and trends
    const averages = {
      views: analytics.length > 0 ? analytics.reduce((sum, a) => sum + a.views, 0) / analytics.length : 0,
      engagement: analytics.length > 0 ? analytics.reduce((sum, a) => sum + a.engagement, 0) / analytics.length : 0,
      followers: analytics.length > 0 ? analytics.reduce((sum, a) => sum + a.newFollowers, 0) / analytics.length : 0,
      videos: analytics.length > 0 ? analytics.reduce((sum, a) => sum + a.videosAdded, 0) / analytics.length : 0,
      trendingScore: analytics.length > 0 ? analytics.reduce((sum, a) => sum + Number(a.trendingScore), 0) / analytics.length : 0,
    };

    return res.status(200).json({
      success: true,
      data: {
        hashtag: {
          id: hashtagRecord.id,
          name: hashtagRecord.name,
        },
        performanceMetrics,
        averages,
        period,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error getting performance analytics:', error);
    return res.status(500).json({ success: false, error: 'Failed to get performance analytics' });
  }
}

async function getComparisonAnalytics(req: NextApiRequest, res: NextApiResponse, prisma: any, hashtag: string, period: string) {
  try {
    if (!hashtag) {
      return res.status(400).json({ success: false, error: 'Hashtag is required' });
    }

    const hashtagRecord = await prisma.tag.findUnique({
      where: { name: hashtag },
    });

    if (!hashtagRecord) {
      return res.status(404).json({ success: false, error: 'Hashtag not found' });
    }

    // Get similar hashtags for comparison
    const similarHashtags = await prisma.tag.findMany({
      where: {
        id: { not: hashtagRecord.id },
        usageCount: {
          gte: Math.max(0, hashtagRecord.usageCount - 50),
          lte: hashtagRecord.usageCount + 50,
        },
      },
      orderBy: { trendingScore: 'desc' },
      take: 5,
    });

    const comparison = await Promise.all(
      similarHashtags.map(async (similarHashtag) => {
        const analytics = await prisma.hashtagAnalytics.findMany({
          where: { hashtagId: similarHashtag.id },
          orderBy: { date: 'desc' },
          take: 7, // Last 7 days
        });

        const totalViews = analytics.reduce((sum, a) => sum + a.views, 0);
        const totalEngagement = analytics.reduce((sum, a) => sum + a.engagement, 0);

        return {
          id: similarHashtag.id,
          name: similarHashtag.name,
          usageCount: similarHashtag.usageCount,
          followerCount: similarHashtag.followerCount,
          trendingScore: Number(similarHashtag.trendingScore),
          metrics: {
            totalViews,
            totalEngagement,
            engagementRate: totalViews > 0 ? (totalEngagement / totalViews) * 100 : 0,
          },
        };
      })
    );

    return res.status(200).json({
      success: true,
      data: {
        targetHashtag: {
          id: hashtagRecord.id,
          name: hashtagRecord.name,
          usageCount: hashtagRecord.usageCount,
          followerCount: hashtagRecord.followerCount,
          trendingScore: Number(hashtagRecord.trendingScore),
        },
        comparison: comparison,
        period,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error getting comparison analytics:', error);
    return res.status(500).json({ success: false, error: 'Failed to get comparison analytics' });
  }
}

async function getInsightsAnalytics(req: NextApiRequest, res: NextApiResponse, prisma: any, hashtag: string, period: string) {
  try {
    if (!hashtag) {
      return res.status(400).json({ success: false, error: 'Hashtag is required' });
    }

    const hashtagRecord = await prisma.tag.findUnique({
      where: { name: hashtag },
      include: {
        analytics: {
          orderBy: { date: 'desc' },
          take: 30,
        },
      },
    });

    if (!hashtagRecord) {
      return res.status(404).json({ success: false, error: 'Hashtag not found' });
    }

    // Generate insights based on analytics data
    const insights = generateInsights(hashtagRecord.analytics, hashtagRecord);

    return res.status(200).json({
      success: true,
      data: {
        hashtag: {
          id: hashtagRecord.id,
          name: hashtagRecord.name,
        },
        insights,
        period,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error getting insights analytics:', error);
    return res.status(500).json({ success: false, error: 'Failed to get insights analytics' });
  }
}

// Helper functions
function getPeriodDays(period: string): number {
  switch (period) {
    case '1d': return 1;
    case '7d': return 7;
    case '30d': return 30;
    case '90d': return 90;
    default: return 7;
  }
}

function calculateGrowthRate(values: number[]): number {
  if (values.length < 2) return 0;
  const firstHalf = values.slice(0, Math.floor(values.length / 2));
  const secondHalf = values.slice(Math.floor(values.length / 2));
  const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
  return firstAvg > 0 ? ((secondAvg - firstAvg) / firstAvg) * 100 : 0;
}

function generateInsights(analytics: any[], hashtag: any): string[] {
  const insights: string[] = [];
  
  if (analytics.length === 0) {
    insights.push(`#${hashtag.name} is a new hashtag with no analytics data yet.`);
    return insights;
  }

  const totalViews = analytics.reduce((sum, a) => sum + a.views, 0);
  const totalEngagement = analytics.reduce((sum, a) => sum + a.engagement, 0);
  const avgEngagementRate = totalViews > 0 ? (totalEngagement / totalViews) * 100 : 0;

  // Engagement insights
  if (avgEngagementRate > 5) {
    insights.push(`#${hashtag.name} has excellent engagement with ${avgEngagementRate.toFixed(1)}% engagement rate.`);
  } else if (avgEngagementRate > 2) {
    insights.push(`#${hashtag.name} has good engagement with ${avgEngagementRate.toFixed(1)}% engagement rate.`);
  } else {
    insights.push(`#${hashtag.name} could improve engagement (currently ${avgEngagementRate.toFixed(1)}%).`);
  }

  // Trending insights
  if (Number(hashtag.trendingScore) > 1000) {
    insights.push(`#${hashtag.name} is trending strongly with a score of ${Number(hashtag.trendingScore).toFixed(0)}.`);
  } else if (Number(hashtag.trendingScore) > 100) {
    insights.push(`#${hashtag.name} is gaining momentum with a trending score of ${Number(hashtag.trendingScore).toFixed(0)}.`);
  }

  // Follower insights
  if (hashtag.followerCount > 1000) {
    insights.push(`#${hashtag.name} has a strong following with ${hashtag.followerCount.toLocaleString()} followers.`);
  } else if (hashtag.followerCount > 100) {
    insights.push(`#${hashtag.name} is building a community with ${hashtag.followerCount} followers.`);
  }

  // Usage insights
  if (hashtag.usageCount > 1000) {
    insights.push(`#${hashtag.name} is widely used with ${hashtag.usageCount.toLocaleString()} videos.`);
  } else if (hashtag.usageCount > 100) {
    insights.push(`#${hashtag.name} is growing in usage with ${hashtag.usageCount} videos.`);
  }

  return insights;
}
