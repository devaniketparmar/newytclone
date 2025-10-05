interface Video {
  id: string;
  title: string;
  description: string;
  thumbnailUrl?: string;
  videoUrl: string;
  duration: number;
  viewCount: number;
  likeCount: number;
  dislikeCount: number;
  commentCount: number;
  createdAt: string;
  publishedAt: string;
  status: 'PROCESSING' | 'READY' | 'FAILED';
  channel: {
    id: string;
    name: string;
    avatarUrl: string;
    subscriberCount: number;
    userId: string;
  };
}

interface TrendingScore {
  videoId: string;
  score: number;
  factors: {
    views: number;
    likes: number;
    comments: number;
    recency: number;
    engagement: number;
    subscriberBoost: number;
  };
}

/**
 * Calculate trending score for a video based on multiple factors
 * Similar to YouTube's trending algorithm
 */
export function calculateTrendingScore(video: Video): TrendingScore {
  const now = new Date();
  const publishedAt = new Date(video.publishedAt);
  const createdAt = new Date(video.createdAt);
  
  // Time factors
  const hoursSincePublished = (now.getTime() - publishedAt.getTime()) / (1000 * 60 * 60);
  const daysSincePublished = hoursSincePublished / 24;
  
  // Base metrics
  const views = video.viewCount || 0;
  const likes = video.likeCount || 0;
  const dislikes = video.dislikeCount || 0;
  const comments = video.commentCount || 0;
  const subscribers = video.channel.subscriberCount || 0;
  
  // 1. VIEW VELOCITY (most important factor)
  // Recent videos with high view counts get higher scores
  const viewVelocity = views / Math.max(hoursSincePublished, 1);
  
  // 2. ENGAGEMENT RATE
  // Likes, comments relative to views
  const totalEngagement = likes + comments;
  const engagementRate = views > 0 ? totalEngagement / views : 0;
  
  // 3. LIKE RATIO
  // Positive engagement (likes vs dislikes)
  const totalReactions = likes + dislikes;
  const likeRatio = totalReactions > 0 ? likes / totalReactions : 0;
  
  // 4. RECENCY BOOST
  // Newer videos get a boost, but not too much
  const recencyBoost = Math.max(0, 1 - (daysSincePublished / 7)); // Decay over 7 days
  
  // 5. SUBSCRIBER BOOST
  // Videos from channels with more subscribers get slight boost
  const subscriberBoost = Math.min(1.5, 1 + (subscribers / 1000000)); // Cap at 1.5x
  
  // 6. COMMENT ENGAGEMENT
  // Videos with more comments relative to views
  const commentEngagement = views > 0 ? comments / views : 0;
  
  // Calculate final score
  const baseScore = viewVelocity * 0.4 + // 40% view velocity
                   engagementRate * 1000 * 0.25 + // 25% engagement rate
                   likeRatio * 100 * 0.15 + // 15% like ratio
                   commentEngagement * 100 * 0.1 + // 10% comment engagement
                   recencyBoost * 50 * 0.1; // 10% recency boost
  
  const finalScore = baseScore * subscriberBoost;
  
  return {
    videoId: video.id,
    score: Math.max(0, finalScore),
    factors: {
      views,
      likes,
      comments,
      recency: recencyBoost,
      engagement: engagementRate,
      subscriberBoost
    }
  };
}

/**
 * Get trending videos with scores
 */
export function getTrendingVideos(videos: Video[], limit: number = 50): Video[] {
  // Filter out failed videos and very old videos (older than 30 days)
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
  
  const eligibleVideos = videos.filter(video => 
    video.status === 'READY' && 
    new Date(video.publishedAt) > thirtyDaysAgo &&
    video.viewCount > 0 // Must have at least some views
  );
  
  // Calculate trending scores
  const videosWithScores = eligibleVideos.map(video => ({
    video,
    score: calculateTrendingScore(video)
  }));
  
  // Sort by trending score (highest first)
  videosWithScores.sort((a, b) => b.score.score - a.score.score);
  
  // Return top videos
  return videosWithScores.slice(0, limit).map(item => item.video);
}

/**
 * Get trending videos by category
 */
export function getTrendingVideosByCategory(
  videos: Video[], 
  category: string, 
  limit: number = 20
): Video[] {
  const categoryVideos = videos.filter(video => {
    // Simple category matching - you can enhance this
    const videoCategory = getVideoCategory(video);
    return videoCategory === category;
  });
  
  return getTrendingVideos(categoryVideos, limit);
}

/**
 * Get trending videos by time period
 */
export function getTrendingVideosByPeriod(
  videos: Video[], 
  period: 'today' | 'week' | 'month' | 'all',
  limit: number = 20
): Video[] {
  const now = new Date();
  let cutoffDate: Date;
  
  switch (period) {
    case 'today':
      cutoffDate = new Date(now.getTime() - (24 * 60 * 60 * 1000));
      break;
    case 'week':
      cutoffDate = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
      break;
    case 'month':
      cutoffDate = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
      break;
    case 'all':
    default:
      cutoffDate = new Date(0); // All time
      break;
  }
  
  const periodVideos = videos.filter(video => 
    new Date(video.publishedAt) > cutoffDate
  );
  
  return getTrendingVideos(periodVideos, limit);
}

/**
 * Simple category detection based on video content
 * This can be enhanced with more sophisticated algorithms
 */
function getVideoCategory(video: Video): string {
  const title = video.title.toLowerCase();
  const description = video.description.toLowerCase();
  const content = `${title} ${description}`;
  
  // Category keywords mapping
  const categories = {
    'music': ['music', 'song', 'album', 'artist', 'band', 'concert', 'lyrics', 'beat', 'melody'],
    'gaming': ['game', 'gaming', 'play', 'stream', 'twitch', 'esports', 'tournament', 'review'],
    'education': ['tutorial', 'learn', 'course', 'lesson', 'education', 'study', 'how to', 'guide'],
    'entertainment': ['funny', 'comedy', 'entertainment', 'joke', 'meme', 'viral', 'prank'],
    'technology': ['tech', 'technology', 'review', 'unboxing', 'gadget', 'software', 'app'],
    'sports': ['sport', 'football', 'basketball', 'soccer', 'tennis', 'olympics', 'match'],
    'news': ['news', 'breaking', 'update', 'report', 'politics', 'world', 'current'],
    'lifestyle': ['lifestyle', 'fashion', 'beauty', 'cooking', 'travel', 'fitness', 'health'],
    'science': ['science', 'research', 'experiment', 'discovery', 'space', 'nature', 'biology']
  };
  
  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(keyword => content.includes(keyword))) {
      return category;
    }
  }
  
  return 'all'; // Default category
}

/**
 * Get trending insights for analytics
 */
export function getTrendingInsights(videos: Video[]): {
  totalVideos: number;
  averageScore: number;
  topCategories: Array<{category: string, count: number}>;
  trendingFactors: {
    averageViews: number;
    averageEngagement: number;
    averageRecency: number;
  };
} {
  const trendingVideos = getTrendingVideos(videos, 100);
  const scores = trendingVideos.map(video => calculateTrendingScore(video));
  
  const totalVideos = trendingVideos.length;
  const averageScore = scores.reduce((sum, score) => sum + score.score, 0) / totalVideos;
  
  // Count categories
  const categoryCount: {[key: string]: number} = {};
  trendingVideos.forEach(video => {
    const category = getVideoCategory(video);
    categoryCount[category] = (categoryCount[category] || 0) + 1;
  });
  
  const topCategories = Object.entries(categoryCount)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  
  // Calculate average factors
  const averageViews = scores.reduce((sum, score) => sum + score.factors.views, 0) / totalVideos;
  const averageEngagement = scores.reduce((sum, score) => sum + score.factors.engagement, 0) / totalVideos;
  const averageRecency = scores.reduce((sum, score) => sum + score.factors.recency, 0) / totalVideos;
  
  return {
    totalVideos,
    averageScore,
    topCategories,
    trendingFactors: {
      averageViews,
      averageEngagement,
      averageRecency
    }
  };
}
