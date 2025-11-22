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

    const { timeRange = '30d' } = req.query;
    
    // Calculate date range
    const now = new Date();
    let startDate: Date;
    
    switch (timeRange) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get user's Shorts
    const userShorts = await prisma.video.findMany({
      where: {
        channel: {
          userId: decoded.userId as string
        },
        videoType: 'SHORTS',
        published: true,
        createdAt: {
          gte: startDate
        }
      },
      include: {
        _count: {
          select: {
            likes: true,
            comments: true,
            views: true
          }
        }
      }
    });

    // Calculate analytics
    const totalViews = userShorts.reduce((sum, video) => sum + video.viewCount, 0);
    const totalLikes = userShorts.reduce((sum, video) => sum + video._count.likes, 0);
    const totalComments = userShorts.reduce((sum, video) => sum + video._count.comments, 0);
    const totalShares = userShorts.reduce((sum, video) => sum + (video.shareCount || 0), 0);
    
    // Get subscriber count
    const channel = await prisma.channel.findFirst({
      where: { userId: decoded.userId as string },
      select: { subscriberCount: true }
    });
    const totalSubscribers = channel?.subscriberCount || 0;

    // Calculate average watch time (mock data for now)
    const averageWatchTime = userShorts.length > 0 ? 
      userShorts.reduce((sum, video) => sum + (video.duration * 0.7), 0) / userShorts.length : 0;

    // Calculate engagement rate
    const engagementRate = totalViews > 0 ? 
      ((totalLikes + totalComments + totalShares) / totalViews) * 100 : 0;

    // Calculate click-through rate (mock data)
    const clickThroughRate = totalViews > 0 ? Math.random() * 5 : 0;

    // Get top performing Shorts
    const topPerformingShorts = userShorts
      .sort((a, b) => b.viewCount - a.viewCount)
      .slice(0, 5)
      .map(video => ({
        id: video.id,
        title: video.title,
        thumbnailUrl: video.thumbnailUrl,
        views: video.viewCount,
        likes: video._count.likes,
        comments: video._count.comments,
        publishedAt: video.publishedAt
      }));

    // Generate views over time data (mock data for now)
    const viewsOverTime = [];
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      viewsOverTime.push({
        date: date.toISOString().split('T')[0],
        views: Math.floor(Math.random() * 1000) + 100
      });
    }

    // Mock demographics data
    const demographics = {
      ageGroups: [
        { ageGroup: '13-17', percentage: 15 },
        { ageGroup: '18-24', percentage: 35 },
        { ageGroup: '25-34', percentage: 25 },
        { ageGroup: '35-44', percentage: 15 },
        { ageGroup: '45+', percentage: 10 }
      ],
      genders: [
        { gender: 'Male', percentage: 55 },
        { gender: 'Female', percentage: 40 },
        { gender: 'Other', percentage: 5 }
      ],
      countries: [
        { country: 'United States', percentage: 30 },
        { country: 'India', percentage: 20 },
        { country: 'Brazil', percentage: 15 },
        { country: 'United Kingdom', percentage: 10 },
        { country: 'Canada', percentage: 8 },
        { country: 'Others', percentage: 17 }
      ]
    };

    // Mock traffic sources
    const trafficSources = [
      { source: 'Shorts Feed', percentage: 45 },
      { source: 'Search', percentage: 20 },
      { source: 'Channel Page', percentage: 15 },
      { source: 'External', percentage: 10 },
      { source: 'Suggested Videos', percentage: 10 }
    ];

    const analyticsData = {
      totalViews,
      totalLikes,
      totalComments,
      totalShares,
      totalSubscribers,
      averageWatchTime,
      clickThroughRate,
      engagementRate,
      topPerformingShorts,
      viewsOverTime,
      demographics,
      trafficSources
    };

    return res.status(200).json({
      success: true,
      data: analyticsData
    });

  } catch (error) {
    console.error('Error fetching Shorts analytics:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}
