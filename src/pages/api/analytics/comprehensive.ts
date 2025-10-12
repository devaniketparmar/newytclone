import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { JWTUtils } from '@/utils/auth';
import { serializeBigInt } from '@/utils/bigIntUtils';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { period = '28d', metric = 'overview' } = req.query;

    // Get token from Authorization header or cookies
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '') || req.cookies.token;
    
    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    // Verify token
    let decoded;
    try {
      decoded = JWTUtils.verifyToken(token);
      if (!decoded || !decoded.userId) {
        return res.status(401).json({ success: false, message: 'Invalid token payload' });
      }
    } catch (error) {
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }

    const userId = decoded.userId;

    // Get user's channel
    const channel = await prisma.channel.findFirst({
      where: { userId }
    });

    if (!channel) {
      return res.status(404).json({ success: false, message: 'Channel not found' });
    }

    switch (metric) {
      case 'overview':
        return await getComprehensiveOverview(req, res, channel.id, period as string);
      case 'views':
        return await getComprehensiveViews(req, res, channel.id, period as string);
      case 'subscribers':
        return await getComprehensiveSubscribers(req, res, channel.id, period as string);
      case 'engagement':
        return await getComprehensiveEngagement(req, res, channel.id, period as string);
      case 'watchtime':
        return await getComprehensiveWatchTime(req, res, channel.id, period as string);
      case 'traffic':
        return await getComprehensiveTraffic(req, res, channel.id, period as string);
      case 'demographics':
        return await getComprehensiveDemographics(req, res, channel.id, period as string);
      default:
        return res.status(400).json({ success: false, message: 'Invalid metric' });
    }

  } catch (error) {
    console.error('Error in comprehensive analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  } finally {
    await prisma.$disconnect();
  }
}

async function getComprehensiveOverview(req: NextApiRequest, res: NextApiResponse, channelId: string, period: string) {
  const days = getPeriodDays(period);
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - days);

  // Get channel analytics
  const channelAnalytics = await prisma.channelAnalytics.findMany({
    where: {
      channelId,
      date: {
        gte: startDate,
        lte: endDate
      }
    },
    orderBy: { date: 'asc' }
  });

  // Get videos
  const videos = await prisma.video.findMany({
    where: { channelId },
    orderBy: { createdAt: 'desc' }
  });

  // Calculate totals
  const totalStats = {
    totalVideos: videos.length,
    totalViews: channelAnalytics.reduce((sum, item) => sum + item.views, 0),
    totalSubscribers: channelAnalytics.reduce((sum, item) => sum + item.subscribersGained - item.subscribersLost, 0),
    totalLikes: channelAnalytics.reduce((sum, item) => sum + item.totalLikes, 0),
    totalComments: channelAnalytics.reduce((sum, item) => sum + item.totalComments, 0)
  };

  const periodStats = {
    videosPublished: channelAnalytics.reduce((sum, item) => sum + item.videosPublished, 0),
    views: channelAnalytics.reduce((sum, item) => sum + item.views, 0),
    subscribers: channelAnalytics.reduce((sum, item) => sum + item.subscribersGained - item.subscribersLost, 0),
    likes: channelAnalytics.reduce((sum, item) => sum + item.totalLikes, 0),
    comments: channelAnalytics.reduce((sum, item) => sum + item.totalComments, 0)
  };

  // Growth data
  const growth = {
    subscribers: channelAnalytics.map(item => ({
      date: item.date.toISOString().split('T')[0],
      gained: item.subscribersGained,
      lost: item.subscribersLost,
      total: item.subscribersGained - item.subscribersLost
    })),
    views: channelAnalytics.map(item => ({
      date: item.date.toISOString().split('T')[0],
      views: item.views
    }))
  };

  // Top videos
  const topVideos = await Promise.all(
    videos.slice(0, 5).map(async (video) => {
      const videoAnalytics = await prisma.videoAnalytics.findMany({
        where: {
          videoId: video.id,
          date: {
            gte: startDate,
            lte: endDate
          }
        }
      });

      const viewCount = videoAnalytics.reduce((sum, item) => sum + item.views, 0);
      const likeCount = videoAnalytics.reduce((sum, item) => sum + item.likes, 0);
      const commentCount = videoAnalytics.reduce((sum, item) => sum + item.comments, 0);

      return {
        id: video.id,
        title: video.title,
        viewCount,
        likeCount,
        commentCount,
        thumbnailUrl: video.thumbnailUrl,
        createdAt: video.createdAt.toISOString()
      };
    })
  );

  // Recent activity
  const recentActivity = videos.slice(0, 10).map(video => ({
    id: video.id,
    title: video.title,
    status: video.status,
    privacy: video.privacy,
    createdAt: video.createdAt.toISOString(),
    publishedAt: video.publishedAt?.toISOString()
  }));

  res.status(200).json({
    success: true,
    data: {
      overview: {
        totalStats,
        periodStats,
        growth
      },
      topVideos,
      recentActivity
    }
  });
}

async function getComprehensiveViews(req: NextApiRequest, res: NextApiResponse, channelId: string, period: string) {
  const days = getPeriodDays(period);
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - days);

  // Get channel analytics
  const channelAnalytics = await prisma.channelAnalytics.findMany({
    where: {
      channelId,
      date: {
        gte: startDate,
        lte: endDate
      }
    },
    orderBy: { date: 'asc' }
  });

  // Get hourly views for the last 24 hours
  const last24Hours = new Date();
  last24Hours.setHours(last24Hours.getHours() - 24);

  const views = await prisma.view.findMany({
    where: {
      video: {
        channelId
      },
      createdAt: {
        gte: last24Hours
      }
    },
    select: {
      createdAt: true
    }
  });

  // Group by hour
  const hourlyViews = Array.from({ length: 24 }, (_, i) => {
    const hour = new Date();
    hour.setHours(hour.getHours() - i);
    const hourStart = new Date(hour);
    hourStart.setMinutes(0, 0, 0);
    const hourEnd = new Date(hour);
    hourEnd.setMinutes(59, 59, 999);

    const viewsInHour = views.filter(view => 
      view.createdAt >= hourStart && view.createdAt <= hourEnd
    ).length;

    return {
      hour: hourStart.getHours(),
      views: viewsInHour
    };
  }).reverse();

  res.status(200).json({
    success: true,
    data: {
      viewsOverTime: channelAnalytics.map(item => ({
        date: item.date.toISOString().split('T')[0],
        views: item.views,
        uniqueViewers: item.uniqueViewers
      })),
      hourlyViews,
      summary: {
        totalViews: channelAnalytics.reduce((sum, item) => sum + item.views, 0),
        totalUniqueViewers: channelAnalytics.reduce((sum, item) => sum + item.uniqueViewers, 0),
        avgViewsPerDay: channelAnalytics.length > 0 ? 
          Math.round(channelAnalytics.reduce((sum, item) => sum + item.views, 0) / channelAnalytics.length) : 0
      }
    }
  });
}

async function getComprehensiveSubscribers(req: NextApiRequest, res: NextApiResponse, channelId: string, period: string) {
  const days = getPeriodDays(period);
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - days);

  // Get channel analytics
  const channelAnalytics = await prisma.channelAnalytics.findMany({
    where: {
      channelId,
      date: {
        gte: startDate,
        lte: endDate
      }
    },
    orderBy: { date: 'asc' }
  });

  // Calculate subscriber metrics
  const totalSubscribers = channelAnalytics.reduce((sum, item) => sum + item.subscribersGained - item.subscribersLost, 0);
  const totalGained = channelAnalytics.reduce((sum, item) => sum + item.subscribersGained, 0);
  const totalLost = channelAnalytics.reduce((sum, item) => sum + item.subscribersLost, 0);
  const growthRate = totalGained > 0 ? ((totalGained - totalLost) / totalGained) * 100 : 0;

  res.status(200).json({
    success: true,
    data: {
      subscribersOverTime: channelAnalytics.map(item => ({
        date: item.date.toISOString().split('T')[0],
        gained: item.subscribersGained,
        lost: item.subscribersLost,
        total: item.subscribersGained - item.subscribersLost
      })),
      demographics: {
        ageGroups: [
          { age: '18-24', percentage: 25.5 },
          { age: '25-34', percentage: 35.2 },
          { age: '35-44', percentage: 22.1 },
          { age: '45-54', percentage: 12.8 },
          { age: '55+', percentage: 4.4 }
        ],
        genders: [
          { gender: 'Male', percentage: 58.3 },
          { gender: 'Female', percentage: 38.7 },
          { gender: 'Other', percentage: 3.0 }
        ],
        countries: [
          { country: 'United States', percentage: 32.1 },
          { country: 'United Kingdom', percentage: 15.4 },
          { country: 'Canada', percentage: 12.8 },
          { country: 'Australia', percentage: 9.2 },
          { country: 'Germany', percentage: 7.6 }
        ]
      },
      summary: {
        totalSubscribers: totalSubscribers,
        netGrowth: totalGained - totalLost,
        growthRate: Math.round(growthRate * 100) / 100
      }
    }
  });
}

async function getComprehensiveEngagement(req: NextApiRequest, res: NextApiResponse, channelId: string, period: string) {
  const days = getPeriodDays(period);
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - days);

  // Get channel analytics
  const channelAnalytics = await prisma.channelAnalytics.findMany({
    where: {
      channelId,
      date: {
        gte: startDate,
        lte: endDate
      }
    },
    orderBy: { date: 'asc' }
  });

  // Get likes and comments
  const likes = await prisma.like.findMany({
    where: {
      video: {
        channelId
      },
      type: 'LIKE',
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

  const comments = await prisma.comment.findMany({
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
      createdAt: true,
      likeCount: true
    },
    orderBy: { createdAt: 'asc' }
  });

  res.status(200).json({
    success: true,
    data: {
      engagementOverTime: channelAnalytics.map(item => ({
        date: item.date.toISOString().split('T')[0],
        views: item.views,
        likes: item.totalLikes,
        comments: item.totalComments,
        shares: item.totalShares,
        engagementRate: item.views > 0 ? 
          Math.round(((item.totalLikes + item.totalComments + item.totalShares) / item.views) * 100 * 100) / 100 : 0
      })),
      likesTimeline: likes.map(like => ({
        date: like.createdAt.toISOString().split('T')[0],
        time: like.createdAt.toISOString().split('T')[1].split('.')[0]
      })),
      commentsTimeline: comments.map(comment => ({
        date: comment.createdAt.toISOString().split('T')[0],
        time: comment.createdAt.toISOString().split('T')[1].split('.')[0],
        likes: comment.likeCount
      })),
      summary: {
        totalLikes: channelAnalytics.reduce((sum, item) => sum + item.totalLikes, 0),
        totalComments: channelAnalytics.reduce((sum, item) => sum + item.totalComments, 0),
        totalShares: channelAnalytics.reduce((sum, item) => sum + item.totalShares, 0),
        avgEngagementRate: channelAnalytics.length > 0 ? 
          Math.round(channelAnalytics.reduce((sum, item) => 
            sum + (item.views > 0 ? ((item.totalLikes + item.totalComments + item.totalShares) / item.views) * 100 : 0), 0) / channelAnalytics.length * 100) / 100 : 0
      }
    }
  });
}

async function getComprehensiveWatchTime(req: NextApiRequest, res: NextApiResponse, channelId: string, period: string) {
  const days = getPeriodDays(period);
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - days);

  // Get channel analytics
  const channelAnalytics = await prisma.channelAnalytics.findMany({
    where: {
      channelId,
      date: {
        gte: startDate,
        lte: endDate
      }
    },
    orderBy: { date: 'asc' }
  });

  // Get watch time analytics
  const watchTimeAnalytics = await prisma.watchTimeAnalytics.findMany({
    where: {
      video: {
        channelId
      },
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    }
  });

  // Calculate retention curve
  const retentionCurve = Array.from({ length: 10 }, (_, i) => {
    const segment = (i + 1) * 10; // 10%, 20%, 30%, etc.
    const viewersAtSegment = watchTimeAnalytics.filter(wt => 
      Number(wt.completionRate) >= segment
    ).length;
    
    return {
      segment: `${segment}%`,
      viewers: viewersAtSegment,
      percentage: watchTimeAnalytics.length > 0 ? 
        Math.round((viewersAtSegment / watchTimeAnalytics.length) * 100 * 100) / 100 : 0
    };
  });

  res.status(200).json({
    success: true,
    data: {
      watchTimeOverTime: channelAnalytics.map(item => ({
        date: item.date.toISOString().split('T')[0],
        watchTime: item.watchTime,
        avgWatchTime: item.avgWatchTime
      })),
      retentionCurve,
      summary: {
        totalWatchTime: channelAnalytics.reduce((sum, item) => sum + item.watchTime, 0),
        avgWatchTime: channelAnalytics.length > 0 ? 
          Math.round(channelAnalytics.reduce((sum, item) => sum + item.avgWatchTime, 0) / channelAnalytics.length) : 0,
        avgCompletionRate: watchTimeAnalytics.length > 0 ? 
          Math.round(watchTimeAnalytics.reduce((sum, item) => sum + Number(item.completionRate), 0) / watchTimeAnalytics.length) : 0
      }
    }
  });
}

async function getComprehensiveTraffic(req: NextApiRequest, res: NextApiResponse, channelId: string, period: string) {
  const days = getPeriodDays(period);
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - days);

  // Get channel analytics
  const channelAnalytics = await prisma.channelAnalytics.findMany({
    where: {
      channelId,
      date: {
        gte: startDate,
        lte: endDate
      }
    },
    orderBy: { date: 'asc' }
  });

  // Aggregate traffic sources
  const trafficSources = {
    direct: 0,
    search: 0,
    social: 0,
    external: 0
  };

  const trafficOverTime = channelAnalytics.map(item => {
    const traffic = item.trafficSource as any || {};
    const dayTraffic = {
      date: item.date.toISOString().split('T')[0],
      direct: traffic.direct || 0,
      search: traffic.search || 0,
      social: traffic.social || 0,
      external: traffic.external || 0
    };

    trafficSources.direct += dayTraffic.direct;
    trafficSources.search += dayTraffic.search;
    trafficSources.social += dayTraffic.social;
    trafficSources.external += dayTraffic.external;

    return dayTraffic;
  });

  const topSource = Object.entries(trafficSources).reduce((a, b) => 
    trafficSources[a[0]] > trafficSources[b[0]] ? a : b
  )[0];

  res.status(200).json({
    success: true,
    data: {
      trafficSources,
      trafficOverTime,
      summary: {
        totalViews: Object.values(trafficSources).reduce((sum, val) => sum + val, 0),
        topSource
      }
    }
  });
}

async function getComprehensiveDemographics(req: NextApiRequest, res: NextApiResponse, channelId: string, period: string) {
  const days = getPeriodDays(period);
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - days);

  // Get channel analytics
  const channelAnalytics = await prisma.channelAnalytics.findMany({
    where: {
      channelId,
      date: {
        gte: startDate,
        lte: endDate
      }
    }
  });

  // Aggregate demographics
  const ageGroups = [
    { age: '18-24', percentage: 0 },
    { age: '25-34', percentage: 0 },
    { age: '35-44', percentage: 0 },
    { age: '45-54', percentage: 0 },
    { age: '55+', percentage: 0 }
  ];

  const genders = [
    { gender: 'Male', percentage: 0 },
    { gender: 'Female', percentage: 0 },
    { gender: 'Other', percentage: 0 }
  ];

  const countries = [
    { country: 'United States', percentage: 0 },
    { country: 'United Kingdom', percentage: 0 },
    { country: 'Canada', percentage: 0 },
    { country: 'Australia', percentage: 0 },
    { country: 'Germany', percentage: 0 }
  ];

  const devices = [
    { device: 'Desktop', percentage: 0 },
    { device: 'Mobile', percentage: 0 },
    { device: 'Tablet', percentage: 0 }
  ];

  // Aggregate data from analytics
  channelAnalytics.forEach(item => {
    const ageData = item.ageGroup as any || {};
    const genderData = item.gender as any || {};
    const countryData = item.country as any || {};
    const deviceData = item.deviceType as any || {};

    // Aggregate age groups
    Object.entries(ageData).forEach(([age, count]) => {
      const ageGroup = ageGroups.find(ag => ag.age === age);
      if (ageGroup) {
        ageGroup.percentage += Number(count);
      }
    });

    // Aggregate genders
    Object.entries(genderData).forEach(([gender, count]) => {
      const genderItem = genders.find(g => g.gender === gender);
      if (genderItem) {
        genderItem.percentage += Number(count);
      }
    });

    // Aggregate countries
    Object.entries(countryData).forEach(([country, count]) => {
      const countryItem = countries.find(c => c.country === country);
      if (countryItem) {
        countryItem.percentage += Number(count);
      }
    });

    // Aggregate devices
    Object.entries(deviceData).forEach(([device, count]) => {
      const deviceItem = devices.find(d => d.device === device);
      if (deviceItem) {
        deviceItem.percentage += Number(count);
      }
    });
  });

  // Convert to percentages
  const totalViews = channelAnalytics.reduce((sum, item) => sum + item.views, 0);
  
  if (totalViews > 0) {
    ageGroups.forEach(ag => ag.percentage = Math.round((ag.percentage / totalViews) * 100 * 100) / 100);
    genders.forEach(g => g.percentage = Math.round((g.percentage / totalViews) * 100 * 100) / 100);
    countries.forEach(c => c.percentage = Math.round((c.percentage / totalViews) * 100 * 100) / 100);
    devices.forEach(d => d.percentage = Math.round((d.percentage / totalViews) * 100 * 100) / 100);
  }

  res.status(200).json({
    success: true,
    data: {
      ageGroups,
      genders,
      countries,
      devices
    }
  });
}

function getPeriodDays(period: string): number {
  switch (period) {
    case '7d': return 7;
    case '28d': return 28;
    case '90d': return 90;
    case '1y': return 365;
    default: return 28;
  }
}
