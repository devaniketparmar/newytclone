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
    const { channelId, period = '28d', type = 'all' } = req.query;

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

    const targetChannelId = channelId as string || channel.id;

    // Verify user owns this channel
    if (targetChannelId !== channel.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    switch (type) {
      case 'all':
        return await getAllInsights(req, res, targetChannelId, period as string);
      case 'performance':
        return await getPerformanceInsights(req, res, targetChannelId, period as string);
      case 'growth':
        return await getGrowthInsights(req, res, targetChannelId, period as string);
      case 'engagement':
        return await getEngagementInsights(req, res, targetChannelId, period as string);
      case 'content':
        return await getContentInsights(req, res, targetChannelId, period as string);
      case 'audience':
        return await getAudienceInsights(req, res, targetChannelId, period as string);
      default:
        return res.status(400).json({ success: false, message: 'Invalid insight type' });
    }

  } catch (error) {
    console.error('Error in analytics insights:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  } finally {
    await prisma.$disconnect();
  }
}

async function getAllInsights(req: NextApiRequest, res: NextApiResponse, channelId: string, period: string) {
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

  // Get video analytics
  const videos = await prisma.video.findMany({
    where: { channelId },
    include: {
      videoAnalytics: {
        where: {
          date: {
            gte: startDate,
            lte: endDate
          }
        }
      }
    }
  });

  // Generate insights
  const insights = [];

  // Performance insights
  const totalViews = channelAnalytics.reduce((sum, item) => sum + item.views, 0);
  const totalSubscribers = channelAnalytics.reduce((sum, item) => sum + item.subscribersGained - item.subscribersLost, 0);
  const avgViewsPerVideo = videos.length > 0 ? totalViews / videos.length : 0;

  if (totalViews > 0) {
    insights.push({
      type: 'PERFORMANCE_ALERT',
      priority: 'HIGH',
      title: 'Strong Performance Detected',
      description: `Your channel has generated ${totalViews.toLocaleString()} views in the last ${days} days, averaging ${Math.round(avgViewsPerVideo).toLocaleString()} views per video.`,
      data: {
        totalViews,
        avgViewsPerVideo: Math.round(avgViewsPerVideo),
        period: days
      }
    });
  }

  // Growth insights
  if (totalSubscribers > 0) {
    insights.push({
      type: 'GROWTH_OPPORTUNITY',
      priority: 'MEDIUM',
      title: 'Subscriber Growth Opportunity',
      description: `You've gained ${totalSubscribers} subscribers in the last ${days} days. Consider creating more content to maintain this momentum.`,
      data: {
        subscribersGained: totalSubscribers,
        period: days
      }
    });
  }

  // Engagement insights
  const totalLikes = channelAnalytics.reduce((sum, item) => sum + item.totalLikes, 0);
  const totalComments = channelAnalytics.reduce((sum, item) => sum + item.totalComments, 0);
  const engagementRate = totalViews > 0 ? ((totalLikes + totalComments) / totalViews) * 100 : 0;

  if (engagementRate > 5) {
    insights.push({
      type: 'ENGAGEMENT_INSIGHT',
      priority: 'HIGH',
      title: 'Excellent Engagement Rate',
      description: `Your engagement rate of ${engagementRate.toFixed(2)}% is above average. Your audience is highly engaged with your content.`,
      data: {
        engagementRate: Math.round(engagementRate * 100) / 100,
        totalLikes,
        totalComments
      }
    });
  }

  // Content insights
  const topVideo = videos.reduce((top, video) => {
    const videoViews = video.videoAnalytics.reduce((sum, item) => sum + item.views, 0);
    const topViews = top.videoAnalytics.reduce((sum, item) => sum + item.views, 0);
    return videoViews > topViews ? video : top;
  }, videos[0]);

  if (topVideo) {
    const topVideoViews = topVideo.videoAnalytics.reduce((sum, item) => sum + item.views, 0);
    insights.push({
      type: 'CONTENT_RECOMMENDATION',
      priority: 'MEDIUM',
      title: 'Top Performing Content',
      description: `"${topVideo.title}" is your top performing video with ${topVideoViews.toLocaleString()} views. Consider creating similar content.`,
      data: {
        videoId: topVideo.id,
        videoTitle: topVideo.title,
        views: topVideoViews
      }
    });
  }

  // Audience insights
  const recentVideos = videos.filter(video => 
    video.createdAt >= startDate
  );

  if (recentVideos.length > 0) {
    insights.push({
      type: 'AUDIENCE_INSIGHT',
      priority: 'LOW',
      title: 'Content Consistency',
      description: `You've published ${recentVideos.length} videos in the last ${days} days. Consistent uploads help maintain audience engagement.`,
      data: {
        videosPublished: recentVideos.length,
        period: days
      }
    });
  }

  res.status(200).json({
    success: true,
    data: {
      insights,
      summary: {
        totalInsights: insights.length,
        highPriority: insights.filter(i => i.priority === 'HIGH').length,
        mediumPriority: insights.filter(i => i.priority === 'MEDIUM').length,
        lowPriority: insights.filter(i => i.priority === 'LOW').length
      }
    }
  });
}

async function getPerformanceInsights(req: NextApiRequest, res: NextApiResponse, channelId: string, period: string) {
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

  // Get video analytics
  const videos = await prisma.video.findMany({
    where: { channelId },
    include: {
      videoAnalytics: {
        where: {
          date: {
            gte: startDate,
            lte: endDate
          }
        }
      }
    }
  });

  // Calculate performance metrics
  const totalViews = channelAnalytics.reduce((sum, item) => sum + item.views, 0);
  const totalWatchTime = channelAnalytics.reduce((sum, item) => sum + item.watchTime, 0);
  const avgWatchTime = totalViews > 0 ? totalWatchTime / totalViews : 0;
  const totalLikes = channelAnalytics.reduce((sum, item) => sum + item.totalLikes, 0);
  const totalComments = channelAnalytics.reduce((sum, item) => sum + item.totalComments, 0);
  const engagementRate = totalViews > 0 ? ((totalLikes + totalComments) / totalViews) * 100 : 0;

  // Performance insights
  const insights = [];

  // Views performance
  if (totalViews > 10000) {
    insights.push({
      type: 'PERFORMANCE_ALERT',
      priority: 'HIGH',
      title: 'Outstanding View Performance',
      description: `Your channel has achieved ${totalViews.toLocaleString()} views in the last ${days} days, indicating strong content performance.`,
      data: { totalViews, period: days }
    });
  } else if (totalViews < 1000) {
    insights.push({
      type: 'PERFORMANCE_ALERT',
      priority: 'MEDIUM',
      title: 'Views Growth Opportunity',
      description: `Your channel has ${totalViews.toLocaleString()} views in the last ${days} days. Consider optimizing titles, thumbnails, and SEO.`,
      data: { totalViews, period: days }
    });
  }

  // Watch time performance
  if (avgWatchTime > 300) { // 5 minutes
    insights.push({
      type: 'PERFORMANCE_ALERT',
      priority: 'HIGH',
      title: 'Excellent Watch Time',
      description: `Your average watch time of ${Math.round(avgWatchTime)}s indicates high audience retention.`,
      data: { avgWatchTime: Math.round(avgWatchTime) }
    });
  }

  // Engagement performance
  if (engagementRate > 5) {
    insights.push({
      type: 'PERFORMANCE_ALERT',
      priority: 'HIGH',
      title: 'High Engagement Rate',
      description: `Your engagement rate of ${engagementRate.toFixed(2)}% shows strong audience interaction.`,
      data: { engagementRate: Math.round(engagementRate * 100) / 100 }
    });
  }

  res.status(200).json({
    success: true,
    data: {
      insights,
      metrics: {
        totalViews,
        totalWatchTime,
        avgWatchTime: Math.round(avgWatchTime),
        totalLikes,
        totalComments,
        engagementRate: Math.round(engagementRate * 100) / 100
      }
    }
  });
}

async function getGrowthInsights(req: NextApiRequest, res: NextApiResponse, channelId: string, period: string) {
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

  // Calculate growth metrics
  const totalSubscribersGained = channelAnalytics.reduce((sum, item) => sum + item.subscribersGained, 0);
  const totalSubscribersLost = channelAnalytics.reduce((sum, item) => sum + item.subscribersLost, 0);
  const netSubscribers = totalSubscribersGained - totalSubscribersLost;
  const totalViews = channelAnalytics.reduce((sum, item) => sum + item.views, 0);
  const videosPublished = channelAnalytics.reduce((sum, item) => sum + item.videosPublished, 0);

  const insights = [];

  // Subscriber growth
  if (netSubscribers > 0) {
    insights.push({
      type: 'GROWTH_OPPORTUNITY',
      priority: 'HIGH',
      title: 'Positive Subscriber Growth',
      description: `You've gained ${netSubscribers} net subscribers in the last ${days} days. Keep up the great work!`,
      data: {
        netSubscribers,
        totalGained: totalSubscribersGained,
        totalLost: totalSubscribersLost,
        period: days
      }
    });
  } else if (netSubscribers < 0) {
    insights.push({
      type: 'GROWTH_OPPORTUNITY',
      priority: 'MEDIUM',
      title: 'Subscriber Retention Focus',
      description: `You've lost ${Math.abs(netSubscribers)} net subscribers. Consider analyzing your recent content and engagement strategies.`,
      data: {
        netSubscribers,
        totalGained: totalSubscribersGained,
        totalLost: totalSubscribersLost,
        period: days
      }
    });
  }

  // Content growth
  if (videosPublished > 0) {
    const avgViewsPerVideo = totalViews / videosPublished;
    insights.push({
      type: 'GROWTH_OPPORTUNITY',
      priority: 'MEDIUM',
      title: 'Content Publishing Rate',
      description: `You've published ${videosPublished} videos with an average of ${Math.round(avgViewsPerVideo).toLocaleString()} views each.`,
      data: {
        videosPublished,
        avgViewsPerVideo: Math.round(avgViewsPerVideo),
        period: days
      }
    });
  }

  res.status(200).json({
    success: true,
    data: {
      insights,
      metrics: {
        netSubscribers,
        totalSubscribersGained,
        totalSubscribersLost,
        totalViews,
        videosPublished
      }
    }
  });
}

async function getEngagementInsights(req: NextApiRequest, res: NextApiResponse, channelId: string, period: string) {
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

  // Calculate engagement metrics
  const totalViews = channelAnalytics.reduce((sum, item) => sum + item.views, 0);
  const totalLikes = channelAnalytics.reduce((sum, item) => sum + item.totalLikes, 0);
  const totalComments = channelAnalytics.reduce((sum, item) => sum + item.totalComments, 0);
  const totalShares = channelAnalytics.reduce((sum, item) => sum + item.totalShares, 0);
  const engagementRate = totalViews > 0 ? ((totalLikes + totalComments + totalShares) / totalViews) * 100 : 0;

  const insights = [];

  // Engagement rate insights
  if (engagementRate > 5) {
    insights.push({
      type: 'ENGAGEMENT_INSIGHT',
      priority: 'HIGH',
      title: 'Excellent Engagement Rate',
      description: `Your engagement rate of ${engagementRate.toFixed(2)}% is well above average. Your audience is highly engaged!`,
      data: { engagementRate: Math.round(engagementRate * 100) / 100 }
    });
  } else if (engagementRate < 2) {
    insights.push({
      type: 'ENGAGEMENT_INSIGHT',
      priority: 'MEDIUM',
      title: 'Engagement Improvement Opportunity',
      description: `Your engagement rate of ${engagementRate.toFixed(2)}% could be improved. Try asking questions, creating polls, or encouraging comments.`,
      data: { engagementRate: Math.round(engagementRate * 100) / 100 }
    });
  }

  // Likes insights
  if (totalLikes > 0) {
    const likeRate = totalViews > 0 ? (totalLikes / totalViews) * 100 : 0;
    insights.push({
      type: 'ENGAGEMENT_INSIGHT',
      priority: 'MEDIUM',
      title: 'Like Engagement Analysis',
      description: `You've received ${totalLikes.toLocaleString()} likes with a ${likeRate.toFixed(2)}% like rate.`,
      data: { totalLikes, likeRate: Math.round(likeRate * 100) / 100 }
    });
  }

  // Comments insights
  if (totalComments > 0) {
    const commentRate = totalViews > 0 ? (totalComments / totalViews) * 100 : 0;
    insights.push({
      type: 'ENGAGEMENT_INSIGHT',
      priority: 'MEDIUM',
      title: 'Comment Engagement Analysis',
      description: `You've received ${totalComments.toLocaleString()} comments with a ${commentRate.toFixed(2)}% comment rate.`,
      data: { totalComments, commentRate: Math.round(commentRate * 100) / 100 }
    });
  }

  res.status(200).json({
    success: true,
    data: {
      insights,
      metrics: {
        totalViews,
        totalLikes,
        totalComments,
        totalShares,
        engagementRate: Math.round(engagementRate * 100) / 100
      }
    }
  });
}

async function getContentInsights(req: NextApiRequest, res: NextApiResponse, channelId: string, period: string) {
  const days = getPeriodDays(period);
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - days);

  // Get videos with analytics
  const videos = await prisma.video.findMany({
    where: { 
      channelId,
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    },
    include: {
      videoAnalytics: {
        where: {
          date: {
            gte: startDate,
            lte: endDate
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  const insights = [];

  // Top performing content
  if (videos.length > 0) {
    const topVideo = videos.reduce((top, video) => {
      const videoViews = video.videoAnalytics.reduce((sum, item) => sum + item.views, 0);
      const topViews = top.videoAnalytics.reduce((sum, item) => sum + item.views, 0);
      return videoViews > topViews ? video : top;
    });

    const topVideoViews = topVideo.videoAnalytics.reduce((sum, item) => sum + item.views, 0);
    
    insights.push({
      type: 'CONTENT_RECOMMENDATION',
      priority: 'HIGH',
      title: 'Top Performing Video',
      description: `"${topVideo.title}" is your best performing video with ${topVideoViews.toLocaleString()} views. Analyze what made it successful.`,
      data: {
        videoId: topVideo.id,
        videoTitle: topVideo.title,
        views: topVideoViews,
        createdAt: topVideo.createdAt
      }
    });
  }

  // Content consistency
  if (videos.length > 0) {
    const avgViewsPerVideo = videos.reduce((sum, video) => {
      return sum + video.videoAnalytics.reduce((videoSum, item) => videoSum + item.views, 0);
    }, 0) / videos.length;

    insights.push({
      type: 'CONTENT_RECOMMENDATION',
      priority: 'MEDIUM',
      title: 'Content Performance Analysis',
      description: `Your ${videos.length} videos average ${Math.round(avgViewsPerVideo).toLocaleString()} views each.`,
      data: {
        videosCount: videos.length,
        avgViewsPerVideo: Math.round(avgViewsPerVideo),
        period: days
      }
    });
  }

  // Publishing frequency
  const daysSinceLastVideo = videos.length > 0 ? 
    Math.floor((endDate.getTime() - videos[0].createdAt.getTime()) / (1000 * 60 * 60 * 24)) : days;

  if (daysSinceLastVideo > 7) {
    insights.push({
      type: 'CONTENT_RECOMMENDATION',
      priority: 'MEDIUM',
      title: 'Publishing Frequency',
      description: `It's been ${daysSinceLastVideo} days since your last video. Regular uploads help maintain audience engagement.`,
      data: { daysSinceLastVideo }
    });
  }

  res.status(200).json({
    success: true,
    data: {
      insights,
      metrics: {
        videosPublished: videos.length,
        avgViewsPerVideo: videos.length > 0 ? 
          Math.round(videos.reduce((sum, video) => {
            return sum + video.videoAnalytics.reduce((videoSum, item) => videoSum + item.views, 0);
          }, 0) / videos.length) : 0,
        daysSinceLastVideo
      }
    }
  });
}

async function getAudienceInsights(req: NextApiRequest, res: NextApiResponse, channelId: string, period: string) {
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

  // Get views data for audience analysis
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
      createdAt: true,
      watchDuration: true
    }
  });

  const insights = [];

  // Audience engagement
  const totalViews = views.length;
  const avgWatchDuration = views.length > 0 ? 
    views.reduce((sum, view) => sum + view.watchDuration, 0) / views.length : 0;

  if (avgWatchDuration > 180) { // 3 minutes
    insights.push({
      type: 'AUDIENCE_INSIGHT',
      priority: 'HIGH',
      title: 'High Audience Retention',
      description: `Your audience watches for an average of ${Math.round(avgWatchDuration)}s, indicating strong content quality.`,
      data: { avgWatchDuration: Math.round(avgWatchDuration) }
    });
  }

  // Device analysis
  const deviceTypes = views.reduce((acc, view) => {
    const userAgent = view.userAgent || '';
    let deviceType = 'unknown';
    
    if (userAgent.includes('Mobile') || userAgent.includes('Android') || userAgent.includes('iPhone')) {
      deviceType = 'mobile';
    } else if (userAgent.includes('Tablet') || userAgent.includes('iPad')) {
      deviceType = 'tablet';
    } else {
      deviceType = 'desktop';
    }
    
    acc[deviceType] = (acc[deviceType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topDevice = Object.entries(deviceTypes).reduce((a, b) => deviceTypes[a[0]] > deviceTypes[b[0]] ? a : b, ['unknown', 0]);

  insights.push({
    type: 'AUDIENCE_INSIGHT',
    priority: 'MEDIUM',
    title: 'Primary Device Type',
    description: `Most of your audience (${Math.round((topDevice[1] / totalViews) * 100)}%) watches on ${topDevice[0]} devices.`,
    data: {
      deviceTypes,
      topDevice: topDevice[0],
      topDevicePercentage: Math.round((topDevice[1] / totalViews) * 100)
    }
  });

  res.status(200).json({
    success: true,
    data: {
      insights,
      metrics: {
        totalViews,
        avgWatchDuration: Math.round(avgWatchDuration),
        deviceTypes
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
