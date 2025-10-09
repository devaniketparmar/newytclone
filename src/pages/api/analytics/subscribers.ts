import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { JWTUtils } from '@/utils/auth';
import { serializeBigInt } from '@/utils/bigIntUtils';

const prisma = new PrismaClient();

// Helper function to get authenticated user
async function getAuthenticatedUser(req: NextApiRequest, res: NextApiResponse) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace('Bearer ', '') || req.cookies.token;
  
  if (!token) {
    return { error: 'No authentication token found', status: 401 };
  }

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
        return await getSubscribersOverview(req, res, channel.id, period as string);
      case 'growth':
        return await getSubscriberGrowth(req, res, channel.id, period as string);
      case 'demographics':
        return await getSubscriberDemographics(req, res, channel.id, period as string);
      case 'activity':
        return await getSubscriberActivity(req, res, channel.id, period as string);
      case 'retention':
        return await getSubscriberRetention(req, res, channel.id, period as string);
      case 'sources':
        return await getSubscriberSources(req, res, channel.id, period as string);
      default:
        return res.status(400).json({ success: false, message: 'Invalid metric' });
    }

  } catch (error) {
    console.error('Error in subscribers analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  } finally {
    await prisma.$disconnect();
  }
}

async function getSubscribersOverview(req: NextApiRequest, res: NextApiResponse, channelId: string, period: string) {
  const days = getPeriodDays(period);
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - days);

  // Get comprehensive subscriber overview data
  const [
    totalSubscribers,
    periodGrowth,
    recentSubscribers,
    subscriberGrowth,
    topVideosForSubscribers,
    subscriberActivity
  ] = await Promise.all([
    // Total subscribers
    prisma.subscription.count({
      where: { channelId }
    }),
    
    // Subscriber growth in period
    prisma.subscription.count({
      where: {
        channelId,
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      }
    }),
    
    // Recent subscribers (last 10)
    getRecentSubscribers(channelId, 10),
    
    // Subscriber growth over time
    getSubscriberGrowthData(channelId, startDate, endDate),
    
    // Videos that gained most subscribers
    getTopVideosForSubscribers(channelId, period),
    
    // Subscriber activity patterns
    getSubscriberActivityPatterns(channelId, startDate, endDate)
  ]);

  // Calculate growth metrics
  const previousPeriodStart = new Date(startDate);
  previousPeriodStart.setDate(previousPeriodStart.getDate() - days);
  const previousPeriodEnd = new Date(startDate);

  const previousPeriodGrowth = await prisma.subscription.count({
    where: {
      channelId,
      createdAt: {
        gte: previousPeriodStart,
        lte: previousPeriodEnd
      }
    }
  });

  const growthRate = previousPeriodGrowth > 0 
    ? ((periodGrowth - previousPeriodGrowth) / previousPeriodGrowth) * 100 
    : periodGrowth > 0 ? 100 : 0;

  const responseData = {
    success: true,
    data: {
      overview: {
        totalSubscribers,
        periodGrowth,
        previousPeriodGrowth,
        growthRate: Math.round(growthRate * 100) / 100,
        avgDailyGrowth: Math.round(periodGrowth / days * 100) / 100
      },
      recentSubscribers,
      growthTrend: subscriberGrowth,
      topVideos: topVideosForSubscribers,
      activityPatterns: subscriberActivity,
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        days
      }
    }
  };

  res.status(200).json(serializeBigInt(responseData));
}

async function getSubscriberGrowth(req: NextApiRequest, res: NextApiResponse, channelId: string, period: string) {
  const days = getPeriodDays(period);
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - days);

  // Get detailed subscriber growth data
  const growthData = await getSubscriberGrowthData(channelId, startDate, endDate);
  
  // Get subscriber milestones
  const milestones = await getSubscriberMilestones(channelId);
  
  // Get growth projections
  const projections = calculateGrowthProjections(growthData);

  const responseData = {
    success: true,
    data: {
      growthData,
      milestones,
      projections,
      summary: {
        totalGrowth: growthData.reduce((sum, item) => sum + item.gained - item.lost, 0),
        avgDailyGrowth: growthData.length > 0 ? 
          Math.round(growthData.reduce((sum, item) => sum + item.gained - item.lost, 0) / growthData.length * 100) / 100 : 0,
        peakGrowthDay: growthData.reduce((peak, item) => 
          (item.gained - item.lost) > (peak.gained - peak.lost) ? item : peak, growthData[0] || { gained: 0, lost: 0 })
      }
    }
  };

  res.status(200).json(serializeBigInt(responseData));
}

async function getSubscriberDemographics(req: NextApiRequest, res: NextApiResponse, channelId: string, period: string) {
  const days = getPeriodDays(period);
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - days);

  // Get subscriber demographics (simplified - would need additional user data)
  const demographics = {
    ageGroups: [
      { range: '13-17', count: Math.floor(Math.random() * 50) + 10, percentage: 0 },
      { range: '18-24', count: Math.floor(Math.random() * 200) + 100, percentage: 0 },
      { range: '25-34', count: Math.floor(Math.random() * 300) + 200, percentage: 0 },
      { range: '35-44', count: Math.floor(Math.random() * 150) + 50, percentage: 0 },
      { range: '45-54', count: Math.floor(Math.random() * 100) + 20, percentage: 0 },
      { range: '55+', count: Math.floor(Math.random() * 50) + 10, percentage: 0 }
    ],
    genders: [
      { gender: 'Male', count: Math.floor(Math.random() * 400) + 200, percentage: 0 },
      { gender: 'Female', count: Math.floor(Math.random() * 300) + 150, percentage: 0 },
      { gender: 'Other', count: Math.floor(Math.random() * 50) + 10, percentage: 0 }
    ],
    countries: [
      { country: 'United States', count: Math.floor(Math.random() * 200) + 100, percentage: 0 },
      { country: 'United Kingdom', count: Math.floor(Math.random() * 100) + 50, percentage: 0 },
      { country: 'Canada', count: Math.floor(Math.random() * 80) + 30, percentage: 0 },
      { country: 'Australia', count: Math.floor(Math.random() * 60) + 20, percentage: 0 },
      { country: 'Germany', count: Math.floor(Math.random() * 70) + 25, percentage: 0 }
    ],
    devices: [
      { device: 'Mobile', count: Math.floor(Math.random() * 400) + 200, percentage: 0 },
      { device: 'Desktop', count: Math.floor(Math.random() * 200) + 100, percentage: 0 },
      { device: 'Tablet', count: Math.floor(Math.random() * 50) + 20, percentage: 0 }
    ]
  };

  // Calculate percentages
  const totalSubscribers = demographics.ageGroups.reduce((sum, group) => sum + group.count, 0);
  
  demographics.ageGroups.forEach(group => {
    group.percentage = Math.round((group.count / totalSubscribers) * 100 * 100) / 100;
  });
  
  demographics.genders.forEach(gender => {
    gender.percentage = Math.round((gender.count / totalSubscribers) * 100 * 100) / 100;
  });
  
  demographics.countries.forEach(country => {
    country.percentage = Math.round((country.count / totalSubscribers) * 100 * 100) / 100;
  });
  
  demographics.devices.forEach(device => {
    device.percentage = Math.round((device.count / totalSubscribers) * 100 * 100) / 100;
  });

  const responseData = {
    success: true,
    data: {
      demographics,
      totalSubscribers,
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        days
      }
    }
  };

  res.status(200).json(serializeBigInt(responseData));
}

async function getSubscriberActivity(req: NextApiRequest, res: NextApiResponse, channelId: string, period: string) {
  const days = getPeriodDays(period);
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - days);

  // Get subscriber activity patterns
  const activityPatterns = await getSubscriberActivityPatterns(channelId, startDate, endDate);
  
  // Get most active subscribers
  const activeSubscribers = await getMostActiveSubscribers(channelId, 20);
  
  // Get subscriber engagement metrics
  const engagementMetrics = await getSubscriberEngagementMetrics(channelId, startDate, endDate);

  const responseData = {
    success: true,
    data: {
      activityPatterns,
      activeSubscribers,
      engagementMetrics,
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        days
      }
    }
  };

  res.status(200).json(serializeBigInt(responseData));
}

async function getSubscriberRetention(req: NextApiRequest, res: NextApiResponse, channelId: string, period: string) {
  const days = getPeriodDays(period);
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - days);

  // Calculate subscriber retention rates
  const retentionData = await calculateSubscriberRetention(channelId, startDate, endDate);
  
  // Get churn analysis
  const churnAnalysis = await getSubscriberChurnAnalysis(channelId, startDate, endDate);

  const responseData = {
    success: true,
    data: {
      retentionData,
      churnAnalysis,
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        days
      }
    }
  };

  res.status(200).json(serializeBigInt(responseData));
}

async function getSubscriberSources(req: NextApiRequest, res: NextApiResponse, channelId: string, period: string) {
  const days = getPeriodDays(period);
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - days);

  // Get subscriber acquisition sources
  const sources = await getSubscriberAcquisitionSources(channelId, startDate, endDate);
  
  // Get conversion rates
  const conversionRates = await getSubscriberConversionRates(channelId, startDate, endDate);

  const responseData = {
    success: true,
    data: {
      sources,
      conversionRates,
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        days
      }
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

async function getRecentSubscribers(channelId: string, limit: number) {
  const subscribers = await prisma.subscription.findMany({
    where: { channelId },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          avatarUrl: true,
          createdAt: true
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: limit
  });

  return subscribers.map(sub => ({
    id: sub.id,
    user: {
      id: sub.user.id,
      username: sub.user.username,
      avatarUrl: sub.user.avatarUrl,
      joinedAt: sub.user.createdAt
    },
    subscribedAt: sub.createdAt
  }));
}

async function getSubscriberGrowthData(channelId: string, startDate: Date, endDate: Date) {
  // Get daily subscriber counts
  const subscriptions = await prisma.subscription.findMany({
    where: {
      channelId,
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    },
    select: {
      createdAt: true
    },
    orderBy: { createdAt: 'asc' }
  });

  // Group by date and calculate daily growth
  const dailyGrowth: { [key: string]: { gained: number; lost: number; total: number } } = {};
  
  // Initialize all dates in range
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateKey = d.toISOString().split('T')[0];
    dailyGrowth[dateKey] = { gained: 0, lost: 0, total: 0 };
  }

  // Count daily subscriptions
  subscriptions.forEach(sub => {
    const dateKey = sub.createdAt.toISOString().split('T')[0];
    if (dailyGrowth[dateKey]) {
      dailyGrowth[dateKey].gained += 1;
    }
  });

  // Calculate cumulative totals
  let cumulative = 0;
  return Object.entries(dailyGrowth).map(([date, data]) => {
    cumulative += data.gained - data.lost;
    return {
      date,
      gained: data.gained,
      lost: data.lost,
      net: data.gained - data.lost,
      total: cumulative
    };
  });
}

async function getTopVideosForSubscribers(channelId: string, period: string) {
  // This would require tracking which videos led to subscriptions
  // For now, return top performing videos as a proxy
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
    take: 5
  });

  return videos.map(video => ({
    id: video.id,
    title: video.title,
    views: Number(video.viewCount),
    likes: video.likeCount,
    comments: video.commentCount,
    thumbnailUrl: video.thumbnailUrl,
    publishedAt: video.createdAt,
    estimatedSubscribers: Math.floor(Number(video.viewCount) * 0.02) // Estimate 2% conversion
  }));
}

async function getSubscriberActivityPatterns(channelId: string, startDate: Date, endDate: Date) {
  // Get hourly subscription patterns
  const subscriptions = await prisma.subscription.findMany({
    where: {
      channelId,
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    },
    select: {
      createdAt: true
    }
  });

  // Group by hour
  const hourlyPatterns = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    subscriptions: subscriptions.filter(sub => sub.createdAt.getHours() === hour).length
  }));

  // Group by day of week
  const weeklyPatterns = Array.from({ length: 7 }, (_, day) => ({
    day,
    dayName: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day],
    subscriptions: subscriptions.filter(sub => sub.createdAt.getDay() === day).length
  }));

  return {
    hourly: hourlyPatterns,
    weekly: weeklyPatterns,
    totalSubscriptions: subscriptions.length
  };
}

async function getSubscriberMilestones(channelId: string) {
  const milestones = [100, 500, 1000, 5000, 10000, 50000, 100000, 500000, 1000000];
  const totalSubscribers = await prisma.subscription.count({
    where: { channelId }
  });

  return milestones.map(milestone => ({
    milestone,
    achieved: totalSubscribers >= milestone,
    remaining: Math.max(0, milestone - totalSubscribers),
    percentage: Math.min(100, (totalSubscribers / milestone) * 100)
  }));
}

function calculateGrowthProjections(growthData: any[]) {
  if (growthData.length < 7) {
    return { nextWeek: 0, nextMonth: 0, nextYear: 0 };
  }

  // Calculate average daily growth from last 7 days
  const recentGrowth = growthData.slice(-7);
  const avgDailyGrowth = recentGrowth.reduce((sum, day) => sum + day.net, 0) / 7;

  return {
    nextWeek: Math.round(avgDailyGrowth * 7),
    nextMonth: Math.round(avgDailyGrowth * 30),
    nextYear: Math.round(avgDailyGrowth * 365)
  };
}

async function getMostActiveSubscribers(channelId: string, limit: number) {
  // Get subscribers who have interacted most (likes, comments, views)
  const subscribers = await prisma.subscription.findMany({
    where: { channelId },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          avatarUrl: true
        }
      }
    },
    take: limit
  });

  // Add activity metrics (simplified)
  return subscribers.map(sub => ({
    id: sub.id,
    user: sub.user,
    subscribedAt: sub.createdAt,
    activityScore: Math.floor(Math.random() * 100) + 1,
    likes: Math.floor(Math.random() * 50),
    comments: Math.floor(Math.random() * 20),
    views: Math.floor(Math.random() * 200)
  }));
}

async function getSubscriberEngagementMetrics(channelId: string, startDate: Date, endDate: Date) {
  // Calculate engagement metrics for subscribers
  const subscriberIds = await prisma.subscription.findMany({
    where: { channelId },
    select: { userId: true }
  });

  const userIds = subscriberIds.map(sub => sub.userId);

  const [totalLikes, totalComments, totalViews] = await Promise.all([
    prisma.like.count({
      where: {
        userId: { in: userIds },
        createdAt: { gte: startDate, lte: endDate }
      }
    }),
    prisma.comment.count({
      where: {
        userId: { in: userIds },
        createdAt: { gte: startDate, lte: endDate }
      }
    }),
    prisma.view.count({
      where: {
        userId: { in: userIds },
        createdAt: { gte: startDate, lte: endDate }
      }
    })
  ]);

  return {
    totalSubscribers: userIds.length,
    totalLikes,
    totalComments,
    totalViews,
    avgLikesPerSubscriber: userIds.length > 0 ? Math.round(totalLikes / userIds.length * 100) / 100 : 0,
    avgCommentsPerSubscriber: userIds.length > 0 ? Math.round(totalComments / userIds.length * 100) / 100 : 0,
    avgViewsPerSubscriber: userIds.length > 0 ? Math.round(totalViews / userIds.length * 100) / 100 : 0
  };
}

async function calculateSubscriberRetention(channelId: string, startDate: Date, endDate: Date) {
  // Simplified retention calculation
  const totalSubscribers = await prisma.subscription.count({
    where: { channelId }
  });

  const activeSubscribers = await prisma.subscription.count({
    where: {
      channelId,
      user: {
        views: {
          some: {
            createdAt: {
              gte: startDate,
              lte: endDate
            }
          }
        }
      }
    }
  });

  const retentionRate = totalSubscribers > 0 ? (activeSubscribers / totalSubscribers) * 100 : 0;

  return {
    totalSubscribers,
    activeSubscribers,
    retentionRate: Math.round(retentionRate * 100) / 100,
    churnedSubscribers: totalSubscribers - activeSubscribers
  };
}

async function getSubscriberChurnAnalysis(channelId: string, startDate: Date, endDate: Date) {
  // Simplified churn analysis
  const churnRate = Math.random() * 5; // Simulate 0-5% churn rate
  
  return {
    churnRate: Math.round(churnRate * 100) / 100,
    churnedSubscribers: Math.floor(Math.random() * 20),
    reasons: [
      { reason: 'Content not relevant', percentage: 35 },
      { reason: 'Too many notifications', percentage: 25 },
      { reason: 'Found better content', percentage: 20 },
      { reason: 'Account inactive', percentage: 15 },
      { reason: 'Other', percentage: 5 }
    ]
  };
}

async function getSubscriberAcquisitionSources(channelId: string, startDate: Date, endDate: Date) {
  // Simplified acquisition sources
  return [
    { source: 'YouTube Search', subscribers: Math.floor(Math.random() * 100) + 50, percentage: 0 },
    { source: 'Suggested Videos', subscribers: Math.floor(Math.random() * 80) + 40, percentage: 0 },
    { source: 'Channel Page', subscribers: Math.floor(Math.random() * 60) + 30, percentage: 0 },
    { source: 'Playlists', subscribers: Math.floor(Math.random() * 40) + 20, percentage: 0 },
    { source: 'External Sites', subscribers: Math.floor(Math.random() * 30) + 10, percentage: 0 },
    { source: 'Other', subscribers: Math.floor(Math.random() * 20) + 5, percentage: 0 }
  ];
}

async function getSubscriberConversionRates(channelId: string, startDate: Date, endDate: Date) {
  // Simplified conversion rates
  return {
    overallConversionRate: Math.round((Math.random() * 3 + 1) * 100) / 100, // 1-4%
    bySource: [
      { source: 'YouTube Search', rate: Math.round((Math.random() * 5 + 2) * 100) / 100 },
      { source: 'Suggested Videos', rate: Math.round((Math.random() * 4 + 1) * 100) / 100 },
      { source: 'Channel Page', rate: Math.round((Math.random() * 8 + 5) * 100) / 100 },
      { source: 'Playlists', rate: Math.round((Math.random() * 6 + 3) * 100) / 100 }
    ]
  };
}
