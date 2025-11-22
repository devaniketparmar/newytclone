import { NextApiRequest, NextApiResponse } from 'next';
import { getInitializedPrisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { 
      action = 'discover',
      category,
      sort = 'trending',
      limit = '20',
      offset = '0',
      search,
      duration = '60', // Default to 60 seconds max for shorts
      creator
    } = req.query;

    const limitNum = Math.min(parseInt(limit as string, 10), 50);
    const offsetNum = Math.max(parseInt(offset as string, 10), 0);
    const maxDuration = parseInt(duration as string, 10);

    const prisma = await getInitializedPrisma();

    switch (action) {
      case 'discover':
        return handleShortsDiscovery(req, res, prisma, {
          category: category as string,
          sort: sort as string,
          limit: limitNum,
          offset: offsetNum,
          search: search as string,
          maxDuration,
          creator: creator as string
        });

      case 'trending':
        return handleTrendingShorts(req, res, prisma, limitNum, maxDuration);

      case 'categories':
        return handleGetCategories(req, res, prisma);

      case 'creators':
        return handleGetCreators(req, res, prisma, limitNum);

      case 'recommendations':
        return handleGetRecommendations(req, res, prisma, limitNum, maxDuration);

      case 'discovery':
        return handleShortsDiscovery(req, res, prisma, {
          category: category as string,
          sort: sort as string,
          limit: limitNum,
          offset: offsetNum,
          search: search as string,
          maxDuration,
          creator: creator as string
        });

      case 'trending-algorithm':
        return handleTrendingAlgorithm(req, res, prisma, limitNum, maxDuration);

      case 'personalized':
        return handlePersonalizedFeed(req, res, prisma, limitNum, maxDuration);

      case 'search':
        return handleShortsSearch(req, res, prisma, {
          query: search as string,
          limit: limitNum,
          offset: offsetNum,
          maxDuration
        });

      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid action. Supported actions: discover, trending, categories, creators, recommendations, search'
        });
    }

  } catch (error) {
    console.error('Error in shorts API:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to process shorts request'
    });
  }
}

async function handleShortsDiscovery(
  req: NextApiRequest, 
  res: NextApiResponse, 
  prisma: any,
  options: {
    category?: string;
    sort: string;
    limit: number;
    offset: number;
    search?: string;
    maxDuration: number;
    creator?: string;
  }
) {
  const { category, sort, limit, offset, search, maxDuration, creator } = options;

  // Build where clause for short videos (duration <= maxDuration seconds)
  const where: any = {
    status: 'READY',
    privacy: 'PUBLIC',
    duration: { lte: maxDuration * 1000 } // Convert to milliseconds
  };

  // Add category filter if specified
  if (category && category !== 'all') {
    const categoryRecord = await prisma.category.findFirst({
      where: { name: { contains: category, mode: 'insensitive' } }
    });
    
    if (categoryRecord) {
      where.categoryId = categoryRecord.id;
    }
  }

  // Add search filter
  if (search) {
    where.AND = [
      {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { channel: { name: { contains: search, mode: 'insensitive' } } }
        ]
      }
    ];
  }

  // Add creator filter
  if (creator) {
    where.channel = { name: { contains: creator, mode: 'insensitive' } };
  }

  // Build orderBy clause
  let orderBy: any = {};
  switch (sort) {
    case 'trending':
      orderBy = [
        { viewCount: 'desc' },
        { likeCount: 'desc' },
        { publishedAt: 'desc' }
      ];
      break;
    case 'newest':
      orderBy = { publishedAt: 'desc' };
      break;
    case 'oldest':
      orderBy = { publishedAt: 'asc' };
      break;
    case 'popular':
      orderBy = { viewCount: 'desc' };
      break;
    case 'liked':
      orderBy = { likeCount: 'desc' };
      break;
    case 'shortest':
      orderBy = { duration: 'asc' };
      break;
    case 'longest':
      orderBy = { duration: 'desc' };
      break;
    default:
      orderBy = [
        { viewCount: 'desc' },
        { publishedAt: 'desc' }
      ];
  }

  // Get short videos with channel and category info
  const shortVideos = await prisma.video.findMany({
    where,
    orderBy,
    skip: offset,
    take: limit,
    include: {
      channel: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
          subscriberCount: true,
          userId: true
        }
      },
      category: {
        select: {
          id: true,
          name: true,
          description: true
        }
      }
    }
  });

  // Get total count for pagination
  const totalCount = await prisma.video.count({ where });

  // Transform data to include shorts-specific fields
  const transformedVideos = shortVideos.map(video => ({
    id: video.id,
    title: video.title,
    description: video.description,
    thumbnailUrl: video.thumbnailUrl,
    videoUrl: video.videoUrl,
    duration: video.duration,
    viewCount: Number(video.viewCount),
    likeCount: video.likeCount,
    commentCount: video.commentCount,
    createdAt: video.createdAt,
    publishedAt: video.publishedAt,
    status: video.status,
    channel: video.channel,
    hashtags: [], // Will be populated if needed
    // Shorts-specific fields
    isShort: true,
    aspectRatio: detectAspectRatio(video.duration),
    category: video.category?.name || 'Entertainment',
    engagement: calculateEngagement(video.viewCount, video.likeCount, video.commentCount),
    trendingScore: calculateTrendingScore(video.viewCount, video.likeCount, video.publishedAt)
  }));

  return res.status(200).json({
    success: true,
    data: {
      videos: transformedVideos,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      },
      filters: {
        category,
        sort,
        maxDuration
      }
    }
  });
}

async function handleTrendingShorts(req: NextApiRequest, res: NextApiResponse, prisma: any, limit: number, maxDuration: number) {
  // Get trending short videos from the last 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const where: any = {
    status: 'READY',
    privacy: 'PUBLIC',
    duration: { lte: maxDuration * 1000 },
    publishedAt: { gte: sevenDaysAgo }
  };

  const trendingVideos = await prisma.video.findMany({
    where,
    orderBy: [
      { viewCount: 'desc' },
      { likeCount: 'desc' },
      { publishedAt: 'desc' }
    ],
    take: limit,
    include: {
      channel: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
          subscriberCount: true,
          userId: true
        }
      }
    }
  });

  const transformedVideos = trendingVideos.map(video => ({
    id: video.id,
    title: video.title,
    description: video.description,
    thumbnailUrl: video.thumbnailUrl,
    videoUrl: video.videoUrl,
    duration: video.duration,
    viewCount: Number(video.viewCount),
    likeCount: video.likeCount,
    commentCount: video.commentCount,
    createdAt: video.createdAt,
    publishedAt: video.publishedAt,
    status: video.status,
    channel: video.channel,
    hashtags: [],
    isShort: true,
    aspectRatio: detectAspectRatio(video.duration),
    category: 'Entertainment',
    engagement: calculateEngagement(video.viewCount, video.likeCount, video.commentCount),
    trendingScore: calculateTrendingScore(video.viewCount, video.likeCount, video.publishedAt)
  }));

  return res.status(200).json({
    success: true,
    data: {
      videos: transformedVideos
    }
  });
}

async function handleGetCategories(req: NextApiRequest, res: NextApiResponse, prisma: any) {
  const categories = [
    { id: 'all', name: 'All Shorts', description: 'All short videos', icon: '🎬', color: '#8b5cf6' },
    { id: 'comedy', name: 'Comedy', description: 'Funny and entertaining shorts', icon: '😂', color: '#f59e0b' },
    { id: 'dance', name: 'Dance', description: 'Dance and choreography shorts', icon: '💃', color: '#ec4899' },
    { id: 'music', name: 'Music', description: 'Music and singing shorts', icon: '🎵', color: '#3b82f6' },
    { id: 'cooking', name: 'Cooking', description: 'Quick cooking and food shorts', icon: '👨‍🍳', color: '#ef4444' },
    { id: 'fitness', name: 'Fitness', description: 'Workout and fitness shorts', icon: '💪', color: '#10b981' },
    { id: 'art', name: 'Art', description: 'Art and creative shorts', icon: '🎨', color: '#8b5cf6' },
    { id: 'tech', name: 'Tech', description: 'Technology and gadget shorts', icon: '📱', color: '#6b7280' },
    { id: 'travel', name: 'Travel', description: 'Travel and adventure shorts', icon: '✈️', color: '#06b6d4' },
    { id: 'lifestyle', name: 'Lifestyle', description: 'Lifestyle and daily life shorts', icon: '🌟', color: '#f97316' },
    { id: 'education', name: 'Education', description: 'Educational and learning shorts', icon: '📚', color: '#84cc16' },
    { id: 'gaming', name: 'Gaming', description: 'Gaming and esports shorts', icon: '🎮', color: '#a855f7' }
  ];

  return res.status(200).json({
    success: true,
    data: {
      categories
    }
  });
}

async function handleGetCreators(req: NextApiRequest, res: NextApiResponse, prisma: any, limit: number) {
  // Get channels that have short videos (duration <= 60 seconds)
  const where: any = {
    videos: {
      some: {
        status: 'READY',
        privacy: 'PUBLIC',
        duration: { lte: 60000 } // 60 seconds in milliseconds
      }
    }
  };

  const creators = await prisma.channel.findMany({
    where,
    orderBy: { subscriberCount: 'desc' },
    take: limit,
    select: {
      id: true,
      name: true,
      avatarUrl: true,
      subscriberCount: true,
      createdAt: true,
      _count: {
        select: {
          videos: {
            where: {
              status: 'READY',
              privacy: 'PUBLIC',
              duration: { lte: 60000 }
            }
          }
        }
      }
    }
  });

  const transformedCreators = creators.map(creator => ({
    id: creator.id,
    name: creator.name,
    avatarUrl: creator.avatarUrl,
    subscriberCount: Number(creator.subscriberCount),
    shortsCount: creator._count.videos,
    createdAt: creator.createdAt,
    isVerified: false // Can be enhanced with user verification
  }));

  return res.status(200).json({
    success: true,
    data: {
      creators: transformedCreators
    }
  });
}

async function handleGetRecommendations(req: NextApiRequest, res: NextApiResponse, prisma: any, limit: number, maxDuration: number) {
  // Get recommended short videos based on view count and recent activity
  const where: any = {
    status: 'READY',
    privacy: 'PUBLIC',
    duration: { lte: maxDuration * 1000 },
    publishedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
  };

  const recommendedVideos = await prisma.video.findMany({
    where,
    orderBy: [
      { viewCount: 'desc' },
      { likeCount: 'desc' },
      { publishedAt: 'desc' }
    ],
    take: limit,
    include: {
      channel: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
          subscriberCount: true,
          userId: true
        }
      }
    }
  });

  const transformedVideos = recommendedVideos.map(video => ({
    id: video.id,
    title: video.title,
    description: video.description,
    thumbnailUrl: video.thumbnailUrl,
    videoUrl: video.videoUrl,
    duration: video.duration,
    viewCount: Number(video.viewCount),
    likeCount: video.likeCount,
    commentCount: video.commentCount,
    createdAt: video.createdAt,
    publishedAt: video.publishedAt,
    status: video.status,
    channel: video.channel,
    hashtags: [],
    isShort: true,
    aspectRatio: detectAspectRatio(video.duration),
    category: 'Entertainment',
    engagement: calculateEngagement(video.viewCount, video.likeCount, video.commentCount),
    trendingScore: calculateTrendingScore(video.viewCount, video.likeCount, video.publishedAt)
  }));

  return res.status(200).json({
    success: true,
    data: {
      videos: transformedVideos
    }
  });
}

async function handleShortsSearch(req: NextApiRequest, res: NextApiResponse, prisma: any, options: {
  query: string;
  limit: number;
  offset: number;
  maxDuration: number;
}) {
  const { query, limit, offset, maxDuration } = options;

  if (!query) {
    return res.status(400).json({
      success: false,
      error: 'Search query is required'
    });
  }

  const where: any = {
    status: 'READY',
    privacy: 'PUBLIC',
    duration: { lte: maxDuration * 1000 },
    OR: [
      { title: { contains: query, mode: 'insensitive' } },
      { description: { contains: query, mode: 'insensitive' } },
      { channel: { name: { contains: query, mode: 'insensitive' } } }
    ]
  };

  const searchResults = await prisma.video.findMany({
    where,
    orderBy: [
      { viewCount: 'desc' },
      { publishedAt: 'desc' }
    ],
    skip: offset,
    take: limit,
    include: {
      channel: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
          subscriberCount: true,
          userId: true
        }
      }
    }
  });

  const totalCount = await prisma.video.count({ where });

  const transformedVideos = searchResults.map(video => ({
    id: video.id,
    title: video.title,
    description: video.description,
    thumbnailUrl: video.thumbnailUrl,
    videoUrl: video.videoUrl,
    duration: video.duration,
    viewCount: Number(video.viewCount),
    likeCount: video.likeCount,
    commentCount: video.commentCount,
    createdAt: video.createdAt,
    publishedAt: video.publishedAt,
    status: video.status,
    channel: video.channel,
    hashtags: [],
    isShort: true,
    aspectRatio: detectAspectRatio(video.duration),
    category: 'Entertainment',
    engagement: calculateEngagement(video.viewCount, video.likeCount, video.commentCount),
    trendingScore: calculateTrendingScore(video.viewCount, video.likeCount, video.publishedAt)
  }));

  return res.status(200).json({
    success: true,
    data: {
      videos: transformedVideos,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      },
      query
    }
  });
}

// Helper functions for shorts metadata
function detectAspectRatio(duration: number): string {
  // For shorts, we assume vertical aspect ratio (9:16)
  // This could be enhanced with actual video metadata
  return '9:16';
}

function calculateEngagement(viewCount: number, likeCount: number, commentCount: number): number {
  const views = Number(viewCount) || 0;
  const likes = likeCount || 0;
  const comments = commentCount || 0;
  
  if (views === 0) return 0;
  
  // Calculate engagement rate as percentage
  const engagement = ((likes + comments * 2) / views) * 100;
  return Math.round(engagement * 100) / 100; // Round to 2 decimal places
}

function calculateTrendingScore(viewCount: number, likeCount: number, publishedAt: string): number {
  const views = Number(viewCount) || 0;
  const likes = likeCount || 0;
  const publishDate = new Date(publishedAt);
  const now = new Date();
  const hoursSincePublish = (now.getTime() - publishDate.getTime()) / (1000 * 60 * 60);
  
  // Trending score based on views, likes, and recency
  const recencyFactor = Math.max(0, 1 - (hoursSincePublish / 168)); // Decay over 1 week
  const score = (views * 0.7 + likes * 0.3) * recencyFactor;
  
  return Math.round(score);
}

async function handleTrendingAlgorithm(req: NextApiRequest, res: NextApiResponse, prisma: any, limit: number, maxDuration: number) {
  try {
    // Advanced trending algorithm considering multiple factors
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get videos from the last week
    const where: any = {
      status: 'READY',
      privacy: 'PUBLIC',
      duration: { lte: maxDuration * 1000 },
      publishedAt: { gte: oneWeekAgo }
    };

    const videos = await prisma.video.findMany({
      where,
      include: {
        channel: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            subscriberCount: true,
            userId: true
          }
        },
        category: {
          select: {
            id: true,
            name: true,
            description: true
          }
        },
        _count: {
          select: {
            comments: true,
            likes: true
          }
        }
      },
      orderBy: { publishedAt: 'desc' },
      take: limit * 3 // Get more to calculate trending scores
    });

    // Calculate advanced trending scores
    const videosWithScores = videos.map(video => {
      const views = Number(video.viewCount) || 0;
      const likes = video.likeCount || 0;
      const comments = video._count.comments || 0;
      const shares = video.shareCount || 0;
      const publishDate = new Date(video.publishedAt);
      const hoursSincePublish = (now.getTime() - publishDate.getTime()) / (1000 * 60 * 60);
      
      // Velocity calculation (views per hour)
      const velocity = hoursSincePublish > 0 ? views / hoursSincePublish : views;
      
      // Engagement rate
      const engagementRate = views > 0 ? (likes + comments * 2 + shares * 3) / views : 0;
      
      // Recency factor (more recent = higher score)
      const recencyFactor = Math.max(0, 1 - (hoursSincePublish / 168));
      
      // Channel authority factor
      const channelAuthority = Math.log10(Number(video.channel.subscriberCount) + 1);
      
      // Trending score calculation
      const trendingScore = (
        velocity * 0.4 +
        engagementRate * 1000 * 0.3 +
        views * 0.2 +
        channelAuthority * 100 * 0.1
      ) * recencyFactor;

      return {
        ...video,
        trendingScore: Math.round(trendingScore),
        velocity: Math.round(velocity),
        engagementRate: Math.round(engagementRate * 100) / 100
      };
    });

    // Sort by trending score and take the limit
    const trendingVideos = videosWithScores
      .sort((a, b) => b.trendingScore - a.trendingScore)
      .slice(0, limit);

    const transformedVideos = trendingVideos.map(video => ({
      id: video.id,
      title: video.title,
      description: video.description,
      thumbnailUrl: video.thumbnailUrl,
      videoUrl: video.videoUrl,
      duration: video.duration,
      viewCount: Number(video.viewCount),
      likeCount: video.likeCount,
      commentCount: video.commentCount,
      createdAt: video.createdAt,
      publishedAt: video.publishedAt,
      status: video.status,
      channel: video.channel,
      hashtags: [],
      isShort: true,
      aspectRatio: detectAspectRatio(video.duration),
      category: video.category?.name || 'Entertainment',
      engagement: calculateEngagement(video.viewCount, video.likeCount, video.commentCount),
      trendingScore: video.trendingScore,
      velocity: video.velocity,
      engagementRate: video.engagementRate
    }));

    return res.status(200).json({
      success: true,
      data: {
        videos: transformedVideos,
        algorithm: 'advanced-trending',
        factors: ['velocity', 'engagement', 'views', 'channel-authority', 'recency']
      }
    });

  } catch (error) {
    console.error('Error in trending algorithm:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to calculate trending videos'
    });
  }
}

async function handlePersonalizedFeed(req: NextApiRequest, res: NextApiResponse, prisma: any, limit: number, maxDuration: number) {
  try {
    // Get user preferences and history for personalized recommendations
    const userId = req.headers['user-id'] as string;
    
    if (!userId) {
      // Fallback to trending if no user ID
      return handleTrendingAlgorithm(req, res, prisma, limit, maxDuration);
    }

    // Get user's watch history and preferences
    const userHistory = await prisma.watchHistory.findMany({
      where: { userId },
      include: {
        video: {
          include: {
            category: true,
            channel: true
          }
        }
      },
      orderBy: { watchedAt: 'desc' },
      take: 50
    });

    // Get user's liked videos
    const likedVideos = await prisma.like.findMany({
      where: { userId },
      include: {
        video: {
          include: {
            category: true,
            channel: true
          }
        }
      },
      take: 20
    });

    // Analyze user preferences
    const categoryPreferences: { [key: string]: number } = {};
    const channelPreferences: { [key: string]: number } = {};
    const hashtagPreferences: { [key: string]: number } = {};

    // Analyze watch history
    userHistory.forEach(history => {
      const category = history.video.category?.name || 'Entertainment';
      const channelId = history.video.channelId;
      
      categoryPreferences[category] = (categoryPreferences[category] || 0) + 1;
      channelPreferences[channelId] = (channelPreferences[channelId] || 0) + 1;
    });

    // Analyze liked videos
    likedVideos.forEach(like => {
      const category = like.video.category?.name || 'Entertainment';
      const channelId = like.video.channelId;
      
      categoryPreferences[category] = (categoryPreferences[category] || 0) + 2;
      channelPreferences[channelId] = (channelPreferences[channelId] || 0) + 2;
    });

    // Build personalized query
    const where: any = {
      status: 'READY',
      privacy: 'PUBLIC',
      duration: { lte: maxDuration * 1000 },
      publishedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
    };

    // Add category preference if available
    const topCategory = Object.keys(categoryPreferences).reduce((a, b) => 
      categoryPreferences[a] > categoryPreferences[b] ? a : b, 'Entertainment'
    );

    if (topCategory !== 'Entertainment') {
      const categoryRecord = await prisma.category.findFirst({
        where: { name: { contains: topCategory, mode: 'insensitive' } }
      });
      
      if (categoryRecord) {
        where.categoryId = categoryRecord.id;
      }
    }

    // Get personalized videos
    const personalizedVideos = await prisma.video.findMany({
      where,
      include: {
        channel: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            subscriberCount: true,
            userId: true
          }
        },
        category: {
          select: {
            id: true,
            name: true,
            description: true
          }
        }
      },
      orderBy: [
        { viewCount: 'desc' },
        { publishedAt: 'desc' }
      ],
      take: limit * 2
    });

    // Score videos based on user preferences
    const scoredVideos = personalizedVideos.map(video => {
      const category = video.category?.name || 'Entertainment';
      const channelId = video.channelId;
      
      let personalizationScore = 0;
      
      // Category preference score
      personalizationScore += (categoryPreferences[category] || 0) * 10;
      
      // Channel preference score
      personalizationScore += (channelPreferences[channelId] || 0) * 5;
      
      // Engagement score
      const engagementScore = calculateEngagement(video.viewCount, video.likeCount, video.commentCount);
      personalizationScore += engagementScore * 2;
      
      // Recency score
      const publishDate = new Date(video.publishedAt);
      const hoursSincePublish = (Date.now() - publishDate.getTime()) / (1000 * 60 * 60);
      const recencyScore = Math.max(0, 1 - (hoursSincePublish / 720)); // Decay over 30 days
      personalizationScore += recencyScore * 100;

      return {
        ...video,
        personalizationScore: Math.round(personalizationScore)
      };
    });

    // Sort by personalization score and take the limit
    const recommendedVideos = scoredVideos
      .sort((a, b) => b.personalizationScore - a.personalizationScore)
      .slice(0, limit);

    const transformedVideos = recommendedVideos.map(video => ({
      id: video.id,
      title: video.title,
      description: video.description,
      thumbnailUrl: video.thumbnailUrl,
      videoUrl: video.videoUrl,
      duration: video.duration,
      viewCount: Number(video.viewCount),
      likeCount: video.likeCount,
      commentCount: video.commentCount,
      createdAt: video.createdAt,
      publishedAt: video.publishedAt,
      status: video.status,
      channel: video.channel,
      hashtags: [],
      isShort: true,
      aspectRatio: detectAspectRatio(video.duration),
      category: video.category?.name || 'Entertainment',
      engagement: calculateEngagement(video.viewCount, video.likeCount, video.commentCount),
      trendingScore: calculateTrendingScore(video.viewCount, video.likeCount, video.publishedAt),
      personalizationScore: video.personalizationScore
    }));

    return res.status(200).json({
      success: true,
      data: {
        videos: transformedVideos,
        algorithm: 'personalized',
        preferences: {
          topCategory,
          categoryPreferences,
          channelPreferences
        }
      }
    });

  } catch (error) {
    console.error('Error in personalized feed:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to generate personalized feed'
    });
  }
}

