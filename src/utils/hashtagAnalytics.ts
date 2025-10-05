import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface HashtagAnalyticsUpdate {
  hashtagId: string;
  date: Date;
  views?: number;
  engagement?: number;
  newFollowers?: number;
  videosAdded?: number;
  trendingScore?: number;
}

/**
 * Update hashtag analytics for a specific date
 */
export async function updateHashtagAnalytics(update: HashtagAnalyticsUpdate) {
  try {
    const { hashtagId, date, ...metrics } = update;
    
    // Ensure date is start of day
    const analyticsDate = new Date(date);
    analyticsDate.setHours(0, 0, 0, 0);

    // Upsert analytics record
    const analytics = await prisma.hashtagAnalytics.upsert({
      where: {
        hashtagId_date: {
          hashtagId,
          date: analyticsDate,
        },
      },
      update: {
        views: { increment: metrics.views || 0 },
        engagement: { increment: metrics.engagement || 0 },
        newFollowers: { increment: metrics.newFollowers || 0 },
        videosAdded: { increment: metrics.videosAdded || 0 },
        trendingScore: metrics.trendingScore || 0,
      },
      create: {
        hashtagId,
        date: analyticsDate,
        views: metrics.views || 0,
        engagement: metrics.engagement || 0,
        newFollowers: metrics.newFollowers || 0,
        videosAdded: metrics.videosAdded || 0,
        trendingScore: metrics.trendingScore || 0,
      },
    });

    return analytics;
  } catch (error) {
    console.error('Error updating hashtag analytics:', error);
    throw error;
  }
}

/**
 * Track video view for hashtag analytics
 */
export async function trackHashtagView(hashtagId: string, videoId: string) {
  try {
    await updateHashtagAnalytics({
      hashtagId,
      date: new Date(),
      views: 1,
    });
  } catch (error) {
    console.error('Error tracking hashtag view:', error);
  }
}

/**
 * Track hashtag engagement (likes, comments, shares)
 */
export async function trackHashtagEngagement(hashtagId: string, engagementType: 'like' | 'comment' | 'share') {
  try {
    const engagementWeight = {
      like: 1,
      comment: 3,
      share: 5,
    };

    await updateHashtagAnalytics({
      hashtagId,
      date: new Date(),
      engagement: engagementWeight[engagementType],
    });
  } catch (error) {
    console.error('Error tracking hashtag engagement:', error);
  }
}

/**
 * Track new follower for hashtag
 */
export async function trackHashtagFollower(hashtagId: string) {
  try {
    await updateHashtagAnalytics({
      hashtagId,
      date: new Date(),
      newFollowers: 1,
    });
  } catch (error) {
    console.error('Error tracking hashtag follower:', error);
  }
}

/**
 * Track new video added with hashtag
 */
export async function trackHashtagVideo(hashtagId: string) {
  try {
    await updateHashtagAnalytics({
      hashtagId,
      date: new Date(),
      videosAdded: 1,
    });
  } catch (error) {
    console.error('Error tracking hashtag video:', error);
  }
}

/**
 * Update trending score for hashtag
 */
export async function updateHashtagTrendingScore(hashtagId: string, score: number) {
  try {
    await updateHashtagAnalytics({
      hashtagId,
      date: new Date(),
      trendingScore: score,
    });

    // Also update the main tag record
    await prisma.tag.update({
      where: { id: hashtagId },
      data: { trendingScore: score },
    });
  } catch (error) {
    console.error('Error updating hashtag trending score:', error);
  }
}

/**
 * Get hashtag analytics for a specific period
 */
export async function getHashtagAnalytics(hashtagId: string, startDate: Date, endDate: Date) {
  try {
    const analytics = await prisma.hashtagAnalytics.findMany({
      where: {
        hashtagId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: 'asc' },
    });

    return analytics;
  } catch (error) {
    console.error('Error getting hashtag analytics:', error);
    throw error;
  }
}

/**
 * Calculate hashtag performance metrics
 */
export async function calculateHashtagMetrics(hashtagId: string, period: '7d' | '30d' | '90d') {
  try {
    const endDate = new Date();
    const startDate = new Date();
    
    switch (period) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
    }

    const analytics = await getHashtagAnalytics(hashtagId, startDate, endDate);

    const metrics = {
      totalViews: analytics.reduce((sum, a) => sum + a.views, 0),
      totalEngagement: analytics.reduce((sum, a) => sum + a.engagement, 0),
      totalNewFollowers: analytics.reduce((sum, a) => sum + a.newFollowers, 0),
      totalVideosAdded: analytics.reduce((sum, a) => sum + a.videosAdded, 0),
      averageTrendingScore: analytics.length > 0 
        ? analytics.reduce((sum, a) => sum + Number(a.trendingScore), 0) / analytics.length 
        : 0,
      engagementRate: 0,
      growthRate: 0,
    };

    // Calculate engagement rate
    if (metrics.totalViews > 0) {
      metrics.engagementRate = (metrics.totalEngagement / metrics.totalViews) * 100;
    }

    // Calculate growth rate
    if (analytics.length > 1) {
      const firstHalf = analytics.slice(0, Math.floor(analytics.length / 2));
      const secondHalf = analytics.slice(Math.floor(analytics.length / 2));
      
      const firstHalfViews = firstHalf.reduce((sum, a) => sum + a.views, 0);
      const secondHalfViews = secondHalf.reduce((sum, a) => sum + a.views, 0);
      
      if (firstHalfViews > 0) {
        metrics.growthRate = ((secondHalfViews - firstHalfViews) / firstHalfViews) * 100;
      }
    }

    return metrics;
  } catch (error) {
    console.error('Error calculating hashtag metrics:', error);
    throw error;
  }
}

/**
 * Generate hashtag insights based on analytics
 */
export async function generateHashtagInsights(hashtagId: string) {
  try {
    const hashtag = await prisma.tag.findUnique({
      where: { id: hashtagId },
      include: {
        analytics: {
          orderBy: { date: 'desc' },
          take: 30,
        },
      },
    });

    if (!hashtag) {
      throw new Error('Hashtag not found');
    }

    const insights: string[] = [];
    
    if (hashtag.analytics.length === 0) {
      insights.push(`#${hashtag.name} is a new hashtag with no analytics data yet.`);
      return insights;
    }

    const metrics = await calculateHashtagMetrics(hashtagId, '30d');

    // Engagement insights
    if (metrics.engagementRate > 5) {
      insights.push(`#${hashtag.name} has excellent engagement with ${metrics.engagementRate.toFixed(1)}% engagement rate.`);
    } else if (metrics.engagementRate > 2) {
      insights.push(`#${hashtag.name} has good engagement with ${metrics.engagementRate.toFixed(1)}% engagement rate.`);
    } else {
      insights.push(`#${hashtag.name} could improve engagement (currently ${metrics.engagementRate.toFixed(1)}%).`);
    }

    // Trending insights
    if (Number(hashtag.trendingScore) > 1000) {
      insights.push(`#${hashtag.name} is trending strongly with a score of ${Number(hashtag.trendingScore).toFixed(0)}.`);
    } else if (Number(hashtag.trendingScore) > 100) {
      insights.push(`#${hashtag.name} is gaining momentum with a trending score of ${Number(hashtag.trendingScore).toFixed(0)}.`);
    }

    // Growth insights
    if (metrics.growthRate > 20) {
      insights.push(`#${hashtag.name} is experiencing rapid growth with ${metrics.growthRate.toFixed(1)}% increase in views.`);
    } else if (metrics.growthRate > 0) {
      insights.push(`#${hashtag.name} is growing steadily with ${metrics.growthRate.toFixed(1)}% increase in views.`);
    } else if (metrics.growthRate < -10) {
      insights.push(`#${hashtag.name} is experiencing a decline with ${metrics.growthRate.toFixed(1)}% decrease in views.`);
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
  } catch (error) {
    console.error('Error generating hashtag insights:', error);
    throw error;
  }
}

/**
 * Batch update analytics for multiple hashtags
 */
export async function batchUpdateHashtagAnalytics(updates: HashtagAnalyticsUpdate[]) {
  try {
    const results = await Promise.all(
      updates.map(update => updateHashtagAnalytics(update))
    );
    return results;
  } catch (error) {
    console.error('Error batch updating hashtag analytics:', error);
    throw error;
  }
}

/**
 * Clean up old analytics data (older than 1 year)
 */
export async function cleanupOldAnalytics() {
  try {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const deleted = await prisma.hashtagAnalytics.deleteMany({
      where: {
        date: {
          lt: oneYearAgo,
        },
      },
    });

    console.log(`Cleaned up ${deleted.count} old analytics records`);
    return deleted.count;
  } catch (error) {
    console.error('Error cleaning up old analytics:', error);
    throw error;
  }
}

export default {
  updateHashtagAnalytics,
  trackHashtagView,
  trackHashtagEngagement,
  trackHashtagFollower,
  trackHashtagVideo,
  updateHashtagTrendingScore,
  getHashtagAnalytics,
  calculateHashtagMetrics,
  generateHashtagInsights,
  batchUpdateHashtagAnalytics,
  cleanupOldAnalytics,
};
