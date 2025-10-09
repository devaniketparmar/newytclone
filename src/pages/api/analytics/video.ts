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
    const { videoId, period = '28d', metric = 'overview' } = req.query;

    if (!videoId || typeof videoId !== 'string') {
      return res.status(400).json({ success: false, message: 'Video ID is required' });
    }

    // Get token from Authorization header or cookies
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '') || req.cookies.token;
    
    if (!token) {
      console.log('No token found in request');
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    console.log('Token found, attempting verification...');

    // Verify token with better error handling
    let decoded;
    try {
      decoded = JWTUtils.verifyToken(token);
      if (!decoded || !decoded.userId) {
        console.log('Token verification failed: invalid payload');
        return res.status(401).json({ success: false, message: 'Invalid token payload' });
      }
    } catch (error) {
      console.log('Token verification error:', error);
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }

    const userId = decoded.userId;

    // Verify user owns this video
    const video = await prisma.video.findUnique({
      where: { id: videoId },
      include: { channel: true }
    });

    if (!video) {
      return res.status(404).json({ success: false, message: 'Video not found' });
    }

    if (video.channel.userId !== userId) {
      return res.status(403).json({ success: false, message: 'Access denied - you can only view analytics for your own videos' });
    }

    switch (metric) {
      case 'overview':
        return await getVideoOverview(req, res, videoId, period as string);
      case 'views':
        return await getVideoViews(req, res, videoId, period as string);
      case 'engagement':
        return await getVideoEngagement(req, res, videoId, period as string);
      case 'retention':
        return await getVideoRetention(req, res, videoId, period as string);
      case 'comments':
        return await getVideoComments(req, res, videoId, period as string);
      case 'traffic':
        return await getVideoTraffic(req, res, videoId, period as string);
      default:
        return res.status(400).json({ success: false, message: 'Invalid metric' });
    }

  } catch (error) {
    console.error('Error in video analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  } finally {
    await prisma.$disconnect();
  }
}

async function getVideoOverview(req: NextApiRequest, res: NextApiResponse, videoId: string, period: string) {
  const days = getPeriodDays(period);
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - days);

  // Get video basic info
  const video = await prisma.video.findUnique({
    where: { id: videoId },
    select: {
      id: true,
      title: true,
      description: true,
      thumbnailUrl: true,
      viewCount: true,
      likeCount: true,
      commentCount: true,
      createdAt: true,
      publishedAt: true,
      duration: true,
      status: true,
      privacy: true
    }
  });

  // Get analytics data for the period
  const analyticsData = await prisma.videoAnalytics.findMany({
    where: {
      videoId,
      date: {
        gte: startDate,
        lte: endDate
      }
    },
    orderBy: { date: 'asc' }
  });

  // Get recent views
  const recentViews = await prisma.view.findMany({
    where: {
      videoId,
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    },
    select: {
      createdAt: true,
      watchDuration: true,
      completionPercentage: true
    },
    orderBy: { createdAt: 'desc' },
    take: 100
  });

  // Calculate metrics
  const totalViews = Number(video?.viewCount || 0);
  const totalLikes = video?.likeCount || 0;
  const totalComments = video?.commentCount || 0;
  const avgWatchTime = recentViews.length > 0 ? 
    Math.round(recentViews.reduce((sum, view) => sum + view.watchDuration, 0) / recentViews.length) : 0;
  const avgCompletionRate = recentViews.length > 0 ? 
    Math.round(recentViews.reduce((sum, view) => sum + Number(view.completionPercentage), 0) / recentViews.length) : 0;

  const responseData = {
    success: true,
    data: {
      video: {
        id: video?.id,
        title: video?.title,
        description: video?.description,
        thumbnailUrl: video?.thumbnailUrl,
        duration: video?.duration,
        status: video?.status,
        privacy: video?.privacy,
        publishedAt: video?.publishedAt || video?.createdAt
      },
      metrics: {
        totalViews,
        totalLikes,
        totalComments,
        avgWatchTime,
        avgCompletionRate,
        engagementRate: totalViews > 0 ? Math.round(((totalLikes + totalComments) / totalViews) * 100 * 100) / 100 : 0
      },
      analytics: analyticsData.map(item => ({
        date: item.date.toISOString().split('T')[0],
        views: item.views,
        uniqueViewers: item.uniqueViewers,
        watchTime: item.watchTime,
        likes: item.likes,
        comments: item.comments,
        shares: item.shares
      })),
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        days
      }
    }
  };

  res.status(200).json(serializeBigInt(responseData));
}

async function getVideoViews(req: NextApiRequest, res: NextApiResponse, videoId: string, period: string) {
  const days = getPeriodDays(period);
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - days);

  // Get views over time
  const viewsData = await prisma.videoAnalytics.findMany({
    where: {
      videoId,
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

  // Get hourly views for the last 24 hours
  const last24Hours = new Date();
  last24Hours.setHours(last24Hours.getHours() - 24);

  const hourlyViews = await prisma.view.findMany({
    where: {
      videoId,
      createdAt: {
        gte: last24Hours
      }
    },
    select: {
      createdAt: true
    }
  });

  // Group by hour
  const hourlyData = Array.from({ length: 24 }, (_, i) => {
    const hour = new Date();
    hour.setHours(hour.getHours() - i);
    const hourStart = new Date(hour);
    hourStart.setMinutes(0, 0, 0);
    const hourEnd = new Date(hour);
    hourEnd.setMinutes(59, 59, 999);

    const viewsInHour = hourlyViews.filter(view => 
      view.createdAt >= hourStart && view.createdAt <= hourEnd
    ).length;

    return {
      hour: hourStart.getHours(),
      views: viewsInHour
    };
  }).reverse();

  const responseData = {
    success: true,
    data: {
      viewsOverTime: viewsData.map(item => ({
        date: item.date.toISOString().split('T')[0],
        views: item.views,
        uniqueViewers: item.uniqueViewers
      })),
      hourlyViews: hourlyData,
      summary: {
        totalViews: viewsData.reduce((sum, item) => sum + item.views, 0),
        totalUniqueViewers: viewsData.reduce((sum, item) => sum + item.uniqueViewers, 0),
        avgViewsPerDay: viewsData.length > 0 ? Math.round(viewsData.reduce((sum, item) => sum + item.views, 0) / viewsData.length) : 0
      }
    }
  };

  res.status(200).json(serializeBigInt(responseData));
}

async function getVideoEngagement(req: NextApiRequest, res: NextApiResponse, videoId: string, period: string) {
  const days = getPeriodDays(period);
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - days);

  // Get engagement data
  const engagementData = await prisma.videoAnalytics.findMany({
    where: {
      videoId,
      date: {
        gte: startDate,
        lte: endDate
      }
    },
    orderBy: { date: 'asc' },
    select: {
      date: true,
      views: true,
      likes: true,
      comments: true,
      shares: true
    }
  });

  // Get likes and comments over time
  const likes = await prisma.like.findMany({
    where: {
      videoId,
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
      videoId,
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
      engagementOverTime: engagementData.map(item => ({
        date: item.date.toISOString().split('T')[0],
        views: item.views,
        likes: item.likes,
        comments: item.comments,
        shares: item.shares,
        engagementRate: item.views > 0 ? Math.round(((item.likes + item.comments + item.shares) / item.views) * 100 * 100) / 100 : 0
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
        totalLikes: engagementData.reduce((sum, item) => sum + item.likes, 0),
        totalComments: engagementData.reduce((sum, item) => sum + item.comments, 0),
        totalShares: engagementData.reduce((sum, item) => sum + item.shares, 0),
        avgEngagementRate: engagementData.length > 0 ? 
          Math.round(engagementData.reduce((sum, item) => 
            sum + (item.views > 0 ? ((item.likes + item.comments + item.shares) / item.views) * 100 : 0), 0) / engagementData.length * 100) / 100 : 0
      }
    }
  });
}

async function getVideoRetention(req: NextApiRequest, res: NextApiResponse, videoId: string, period: string) {
  const days = getPeriodDays(period);
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - days);

  // Get watch duration data
  const views = await prisma.view.findMany({
    where: {
      videoId,
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    },
    select: {
      watchDuration: true,
      completionPercentage: true,
      createdAt: true
    }
  });

  // Get video duration
  const video = await prisma.video.findUnique({
    where: { id: videoId },
    select: { duration: true }
  });

  const videoDuration = video?.duration || 0;

  // Calculate retention metrics
  const retentionData = Array.from({ length: 10 }, (_, i) => {
    const segment = (i + 1) * 10; // 10%, 20%, 30%, etc.
    const viewersAtSegment = views.filter(view => 
      Number(view.completionPercentage) >= segment
    ).length;
    
    return {
      segment: `${segment}%`,
      viewers: viewersAtSegment,
      percentage: views.length > 0 ? Math.round((viewersAtSegment / views.length) * 100 * 100) / 100 : 0
    };
  });

  // Calculate average watch time by day
  const watchTimeByDay = views.reduce((acc, view) => {
    const date = view.createdAt.toISOString().split('T')[0];
    if (!acc[date]) {
      acc[date] = { totalWatchTime: 0, count: 0 };
    }
    acc[date].totalWatchTime += view.watchDuration;
    acc[date].count += 1;
    return acc;
  }, {} as Record<string, { totalWatchTime: number; count: number }>);

  const watchTimeOverTime = Object.entries(watchTimeByDay).map(([date, data]) => ({
    date,
    avgWatchTime: Math.round(data.totalWatchTime / data.count),
    totalWatchTime: data.totalWatchTime,
    views: data.count
  })).sort((a, b) => a.date.localeCompare(b.date));

  res.status(200).json({
    success: true,
    data: {
      retentionCurve: retentionData,
      watchTimeOverTime,
      summary: {
        avgWatchTime: views.length > 0 ? Math.round(views.reduce((sum, view) => sum + view.watchDuration, 0) / views.length) : 0,
        avgCompletionRate: views.length > 0 ? Math.round(views.reduce((sum, view) => sum + Number(view.completionPercentage), 0) / views.length) : 0,
        totalViews: views.length,
        videoDuration
      }
    }
  });
}

async function getVideoComments(req: NextApiRequest, res: NextApiResponse, videoId: string, period: string) {
  const days = getPeriodDays(period);
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - days);

  // Get comments with user info
  const comments = await prisma.comment.findMany({
    where: {
      videoId,
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          avatarUrl: true
        }
      },
      replies: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatarUrl: true
            }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  // Get comment analytics
  const commentAnalytics = await prisma.videoAnalytics.findMany({
    where: {
      videoId,
      date: {
        gte: startDate,
        lte: endDate
      }
    },
    orderBy: { date: 'asc' },
    select: {
      date: true,
      comments: true
    }
  });

  res.status(200).json({
    success: true,
    data: {
      comments: comments.map(comment => ({
        id: comment.id,
        content: comment.content,
        likeCount: comment.likeCount,
        replyCount: comment.replyCount,
        createdAt: comment.createdAt,
        user: {
          id: comment.user.id,
          username: comment.user.username,
          avatarUrl: comment.user.avatarUrl
        },
        replies: comment.replies.map(reply => ({
          id: reply.id,
          content: reply.content,
          likeCount: reply.likeCount,
          createdAt: reply.createdAt,
          user: {
            id: reply.user.id,
            username: reply.user.username,
            avatarUrl: reply.user.avatarUrl
          }
        }))
      })),
      commentsOverTime: commentAnalytics.map(item => ({
        date: item.date.toISOString().split('T')[0],
        comments: item.comments
      })),
      summary: {
        totalComments: comments.length,
        totalReplies: comments.reduce((sum, comment) => sum + comment.replies.length, 0),
        avgCommentsPerDay: commentAnalytics.length > 0 ? 
          Math.round(commentAnalytics.reduce((sum, item) => sum + item.comments, 0) / commentAnalytics.length) : 0
      }
    }
  });
}

async function getVideoTraffic(req: NextApiRequest, res: NextApiResponse, videoId: string, period: string) {
  const days = getPeriodDays(period);
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - days);

  // Get views with user agent data
  const views = await prisma.view.findMany({
    where: {
      videoId,
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

  // Analyze by day
  const trafficByDay = views.reduce((acc, view) => {
    const date = view.createdAt.toISOString().split('T')[0];
    if (!acc[date]) {
      acc[date] = { direct: 0, search: 0, social: 0, external: 0 };
    }
    
    if (view.userAgent?.includes('google')) {
      acc[date].search += 1;
    } else if (view.userAgent?.includes('facebook') || view.userAgent?.includes('twitter')) {
      acc[date].social += 1;
    } else {
      acc[date].direct += 1;
    }
    
    return acc;
  }, {} as Record<string, { direct: number; search: number; social: number; external: number }>);

  const trafficOverTime = Object.entries(trafficByDay).map(([date, sources]) => ({
    date,
    ...sources
  })).sort((a, b) => a.date.localeCompare(b.date));

  res.status(200).json({
    success: true,
    data: {
      trafficSources,
      trafficOverTime,
      summary: {
        totalViews: views.length,
        topSource: Object.entries(trafficSources).reduce((a, b) => trafficSources[a[0]] > trafficSources[b[0]] ? a : b)[0]
      }
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
