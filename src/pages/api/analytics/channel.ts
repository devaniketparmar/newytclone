import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { JWTUtils } from '@/utils/auth';
import { serializeBigInt } from '@/utils/bigIntUtils';

const prisma = new PrismaClient();

// Helper function to get authenticated user
async function getAuthenticatedUser(req: NextApiRequest, res: NextApiResponse) {
  // Try multiple authentication methods
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace('Bearer ', '') || req.cookies.token;
  
  if (!token) {
    return { error: 'No authentication token found', status: 401 };
  }

  // Try to verify the token
  let decoded;
  try {
    decoded = JWTUtils.verifyToken(token);
    if (!decoded || !decoded.userId) {
      return { error: 'Invalid token payload', status: 401 };
    }
  } catch (error) {
    console.log('Token verification failed:', error);
    return { error: 'Invalid or expired token', status: 401 };
  }

  // Get user from database
  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    include: {
      channels: true
    }
  });

  if (!user) {
    return { error: 'User not found', status: 404 };
  }

  if (!user.channels[0]) {
    return { error: 'Channel not found', status: 404 };
  }

  return { user, channel: user.channels[0] };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { period = '28d', metric = 'overview' } = req.query;

    // Get authenticated user
    const authResult = await getAuthenticatedUser(req, res);
    if ('error' in authResult) {
      return res.status(authResult.status).json({ 
        success: false, 
        message: authResult.error 
      });
    }

    const { user, channel } = authResult;

    switch (metric) {
      case 'overview':
        return await getChannelOverview(req, res, channel.id, period as string);
      case 'views':
        return await getViewsAnalytics(req, res, channel.id, period as string);
      case 'subscribers':
        return await getSubscribersAnalytics(req, res, channel.id, period as string);
      case 'watchtime':
        return await getWatchTimeAnalytics(req, res, channel.id, period as string);
      case 'engagement':
        return await getEngagementAnalytics(req, res, channel.id, period as string);
      case 'revenue':
        return await getRevenueAnalytics(req, res, channel.id, period as string);
      case 'demographics':
        return await getDemographicsAnalytics(req, res, channel.id, period as string);
      case 'traffic':
        return await getTrafficAnalytics(req, res, channel.id, period as string);
      default:
        return res.status(400).json({ success: false, message: 'Invalid metric' });
    }

  } catch (error) {
    console.error('Error in channel analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  } finally {
    await prisma.$disconnect();
  }
}

async function getChannelOverview(req: NextApiRequest, res: NextApiResponse, channelId: string, period: string) {
  const days = getPeriodDays(period);
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - days);

  // Get comprehensive channel overview data
  const [
    totalStats,
    periodStats,
    topVideos,
    recentActivity,
    subscriberGrowth,
    viewGrowth
  ] = await Promise.all([
    // Total channel statistics
    getTotalChannelStats(channelId),
    
    // Period-specific statistics
    getPeriodChannelStats(channelId, startDate, endDate),
    
    // Top performing videos
    getTopVideos(channelId, 5),
    
    // Recent activity
    getRecentActivity(channelId, 10),
    
    // Subscriber growth over time
    getSubscriberGrowth(channelId, startDate, endDate),
    
    // View growth over time
    getViewGrowth(channelId, startDate, endDate)
  ]);

  const responseData = {
    success: true,
    data: {
      overview: {
        totalStats,
        periodStats,
        growth: {
          subscribers: subscriberGrowth,
          views: viewGrowth
        }
      },
      topVideos,
      recentActivity,
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        days
      }
    }
  };

  res.status(200).json(serializeBigInt(responseData));
}

async function getViewsAnalytics(req: NextApiRequest, res: NextApiResponse, channelId: string, period: string) {
  const days = getPeriodDays(period);
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - days);

  // Get views data over time
  const viewsData = await prisma.channelAnalytics.findMany({
    where: {
      channelId,
      date: {
        gte: startDate,
        lte: endDate
      }
    },
    orderBy: { date: 'asc' },
    select: {
      date: true,
      views: true,
      uniqueViewers: true
    }
  });

  // Get video-specific views
  const videoViews = await prisma.video.findMany({
    where: {
      channelId,
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    },
    select: {
      id: true,
      title: true,
      viewCount: true,
      createdAt: true,
      thumbnailUrl: true
    },
    orderBy: { viewCount: 'desc' },
    take: 10
  });

  const responseData = {
    success: true,
    data: {
      viewsOverTime: viewsData.map(item => ({
        date: item.date.toISOString().split('T')[0],
        views: item.views,
        uniqueViewers: item.uniqueViewers
      })),
      topVideos: videoViews.map(video => ({
        id: video.id,
        title: video.title,
        views: Number(video.viewCount),
        thumbnailUrl: video.thumbnailUrl,
        publishedAt: video.createdAt
      }))
    }
  };

  res.status(200).json(serializeBigInt(responseData));
}

async function getSubscribersAnalytics(req: NextApiRequest, res: NextApiResponse, channelId: string, period: string) {
  const days = getPeriodDays(period);
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - days);

  // Get subscriber growth data
  const subscriberData = await prisma.channelAnalytics.findMany({
    where: {
      channelId,
      date: {
        gte: startDate,
        lte: endDate
      }
    },
    orderBy: { date: 'asc' },
    select: {
      date: true,
      subscribersGained: true,
      subscribersLost: true
    }
  });

  // Calculate cumulative subscribers
  let cumulativeSubscribers = 0;
  const subscriberGrowth = subscriberData.map(item => {
    cumulativeSubscribers += item.subscribersGained - item.subscribersLost;
    return {
      date: item.date.toISOString().split('T')[0],
      gained: item.subscribersGained,
      lost: item.subscribersLost,
      net: item.subscribersGained - item.subscribersLost,
      total: cumulativeSubscribers
    };
  });

  const responseData = {
    success: true,
    data: {
      subscriberGrowth,
      summary: {
        totalGained: subscriberData.reduce((sum, item) => sum + item.subscribersGained, 0),
        totalLost: subscriberData.reduce((sum, item) => sum + item.subscribersLost, 0),
        netGrowth: subscriberData.reduce((sum, item) => sum + item.subscribersGained - item.subscribersLost, 0)
      }
    }
  };

  res.status(200).json(serializeBigInt(responseData));
}

async function getWatchTimeAnalytics(req: NextApiRequest, res: NextApiResponse, channelId: string, period: string) {
  const days = getPeriodDays(period);
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - days);

  // Get watch time data
  const watchTimeData = await prisma.channelAnalytics.findMany({
    where: {
      channelId,
      date: {
        gte: startDate,
        lte: endDate
      }
    },
    orderBy: { date: 'asc' },
    select: {
      date: true,
      watchTime: true,
      views: true
    }
  });

  // Calculate average watch time per view
  const watchTimeMetrics = watchTimeData.map(item => ({
    date: item.date.toISOString().split('T')[0],
    totalWatchTime: item.watchTime,
    views: item.views,
    avgWatchTime: item.views > 0 ? Math.round(item.watchTime / item.views) : 0
  }));

  const responseData = {
    success: true,
    data: {
      watchTimeOverTime: watchTimeMetrics,
      summary: {
        totalWatchTime: watchTimeData.reduce((sum, item) => sum + item.watchTime, 0),
        totalViews: watchTimeData.reduce((sum, item) => sum + item.views, 0),
        avgWatchTime: watchTimeData.length > 0 ? 
          Math.round(watchTimeData.reduce((sum, item) => sum + item.watchTime, 0) / 
          watchTimeData.reduce((sum, item) => sum + item.views, 0)) : 0
      }
    }
  };

  res.status(200).json(serializeBigInt(responseData));
}

async function getEngagementAnalytics(req: NextApiRequest, res: NextApiResponse, channelId: string, period: string) {
  const days = getPeriodDays(period);
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - days);

  // Get engagement data from videos
  const videos = await prisma.video.findMany({
    where: {
      channelId,
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    },
    select: {
      id: true,
      title: true,
      viewCount: true,
      likeCount: true,
      commentCount: true,
      createdAt: true
    }
  });

  // Calculate engagement metrics
  const engagementData = videos.map(video => {
    const views = Number(video.viewCount);
    const likes = video.likeCount;
    const comments = video.commentCount;
    const engagementRate = views > 0 ? ((likes + comments) / views) * 100 : 0;

    return {
      videoId: video.id,
      title: video.title,
      views,
      likes,
      comments,
      engagementRate: Math.round(engagementRate * 100) / 100,
      publishedAt: video.createdAt
    };
  });

  // Sort by engagement rate
  engagementData.sort((a, b) => b.engagementRate - a.engagementRate);

  const responseData = {
    success: true,
    data: {
      videos: engagementData,
      summary: {
        totalViews: videos.reduce((sum, video) => sum + Number(video.viewCount), 0),
        totalLikes: videos.reduce((sum, video) => sum + video.likeCount, 0),
        totalComments: videos.reduce((sum, video) => sum + video.commentCount, 0),
        avgEngagementRate: engagementData.length > 0 ? 
          Math.round(engagementData.reduce((sum, video) => sum + video.engagementRate, 0) / engagementData.length * 100) / 100 : 0
      }
    }
  };

  res.status(200).json(serializeBigInt(responseData));
}

async function getRevenueAnalytics(req: NextApiRequest, res: NextApiResponse, channelId: string, period: string) {
  // Placeholder for revenue analytics
  // This would integrate with monetization systems
  res.status(200).json({
    success: true,
    data: {
      revenue: {
        total: 0,
        period: 0,
        breakdown: {
          ads: 0,
          memberships: 0,
          superChat: 0,
          merchandise: 0
        }
      },
      message: 'Revenue analytics coming soon'
    }
  });
}

async function getDemographicsAnalytics(req: NextApiRequest, res: NextApiResponse, channelId: string, period: string) {
  // Placeholder for demographics analytics
  // This would require additional user data collection
  res.status(200).json({
    success: true,
    data: {
      demographics: {
        ageGroups: [],
        genders: [],
        countries: [],
        devices: []
      },
      message: 'Demographics analytics coming soon'
    }
  });
}

async function getTrafficAnalytics(req: NextApiRequest, res: NextApiResponse, channelId: string, period: string) {
  const days = getPeriodDays(period);
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - days);

  // Get traffic sources from views
  const views = await prisma.view.findMany({
    where: {
      video: {
        channelId
      },
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    },
    select: {
      userAgent: true,
      ipAddress: true,
      createdAt: true
    }
  });

  // Analyze traffic sources (simplified)
  const trafficSources = {
    direct: views.filter(v => !v.userAgent?.includes('google') && !v.userAgent?.includes('facebook')).length,
    search: views.filter(v => v.userAgent?.includes('google')).length,
    social: views.filter(v => v.userAgent?.includes('facebook') || v.userAgent?.includes('twitter')).length,
    external: 0 // Would need referrer data
  };

  const responseData = {
    success: true,
    data: {
      trafficSources,
      totalViews: views.length
    }
  };

  res.status(200).json(serializeBigInt(responseData));
}

// Helper functions
function getPeriodDays(period: string): number {
  switch (period) {
    case '7d': return 7;
    case '28d': return 28;
    case '90d': return 90;
    case '1y': return 365;
    default: return 28;
  }
}

async function getTotalChannelStats(channelId: string) {
  const [totalVideos, totalViews, totalSubscribers, totalLikes, totalComments] = await Promise.all([
    prisma.video.count({ where: { channelId } }),
    prisma.video.aggregate({
      where: { channelId },
      _sum: { viewCount: true }
    }),
    prisma.subscription.count({ where: { channelId } }),
    prisma.like.count({
      where: {
        video: { channelId },
        type: 'LIKE'
      }
    }),
    prisma.comment.count({
      where: { video: { channelId } }
    })
  ]);

  return {
    totalVideos,
    totalViews: totalViews._sum.viewCount ? Number(totalViews._sum.viewCount) : 0,
    totalSubscribers,
    totalLikes,
    totalComments
  };
}

async function getPeriodChannelStats(channelId: string, startDate: Date, endDate: Date) {
  const [videosPublished, views, subscribers, likes, comments] = await Promise.all([
    prisma.video.count({
      where: {
        channelId,
        createdAt: { gte: startDate, lte: endDate }
      }
    }),
    prisma.video.aggregate({
      where: {
        channelId,
        createdAt: { gte: startDate, lte: endDate }
      },
      _sum: { viewCount: true }
    }),
    prisma.subscription.count({
      where: {
        channelId,
        createdAt: { gte: startDate, lte: endDate }
      }
    }),
    prisma.like.count({
      where: {
        video: { channelId },
        type: 'LIKE',
        createdAt: { gte: startDate, lte: endDate }
      }
    }),
    prisma.comment.count({
      where: {
        video: { channelId },
        createdAt: { gte: startDate, lte: endDate }
      }
    })
  ]);

  return {
    videosPublished,
    views: views._sum.viewCount ? Number(views._sum.viewCount) : 0,
    subscribers,
    likes,
    comments
  };
}

async function getTopVideos(channelId: string, limit: number) {
  const videos = await prisma.video.findMany({
    where: { channelId },
    select: {
      id: true,
      title: true,
      viewCount: true,
      likeCount: true,
      commentCount: true,
      thumbnailUrl: true,
      createdAt: true
    },
    orderBy: { viewCount: 'desc' },
    take: limit
  });

  // Convert BigInt viewCount to Number
  return videos.map(video => ({
    ...video,
    viewCount: Number(video.viewCount)
  }));
}

async function getRecentActivity(channelId: string, limit: number) {
  return await prisma.video.findMany({
    where: { channelId },
    select: {
      id: true,
      title: true,
      status: true,
      privacy: true,
      createdAt: true,
      publishedAt: true
    },
    orderBy: { createdAt: 'desc' },
    take: limit
  });
}

async function getSubscriberGrowth(channelId: string, startDate: Date, endDate: Date) {
  const data = await prisma.channelAnalytics.findMany({
    where: {
      channelId,
      date: { gte: startDate, lte: endDate }
    },
    orderBy: { date: 'asc' },
    select: {
      date: true,
      subscribersGained: true,
      subscribersLost: true
    }
  });

  let cumulative = 0;
  return data.map(item => {
    cumulative += item.subscribersGained - item.subscribersLost;
    return {
      date: item.date.toISOString().split('T')[0],
      gained: item.subscribersGained,
      lost: item.subscribersLost,
      total: cumulative
    };
  });
}

async function getViewGrowth(channelId: string, startDate: Date, endDate: Date) {
  const data = await prisma.channelAnalytics.findMany({
    where: {
      channelId,
      date: { gte: startDate, lte: endDate }
    },
    orderBy: { date: 'asc' },
    select: {
      date: true,
      views: true
    }
  });

  return data.map(item => ({
    date: item.date.toISOString().split('T')[0],
    views: item.views
  }));
}
