import { NextApiRequest, NextApiResponse } from 'next';
import { getInitializedPrisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return handleSearch(req, res);
  }

  res.setHeader('Allow', ['GET']);
  res.status(405).json({ success: false, error: 'Method not allowed' });
}

async function handleSearch(req: NextApiRequest, res: NextApiResponse) {
  try {
    const prisma = await getInitializedPrisma();
    
    // Get query parameters
    const { 
      q: query, 
      page = '1', 
      limit = '20', 
      type = 'video',
      category,
      sort = 'relevance',
      duration,
      uploadDate
    } = req.query;

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    // Build search conditions
    const searchConditions: any = {
      status: 'READY',
      privacy: 'PUBLIC'
    };

    // Add category filter
    if (category && category !== 'all') {
      searchConditions.categoryId = parseInt(category as string);
    }

    // Add duration filter
    if (duration) {
      const durationNum = parseInt(duration as string);
      switch (durationNum) {
        case 1: // Under 4 minutes
          searchConditions.duration = { lt: 240 };
          break;
        case 2: // 4-20 minutes
          searchConditions.duration = { gte: 240, lt: 1200 };
          break;
        case 3: // Over 20 minutes
          searchConditions.duration = { gte: 1200 };
          break;
      }
    }

    // Add upload date filter
    if (uploadDate) {
      const now = new Date();
      switch (uploadDate) {
        case 'hour':
          searchConditions.publishedAt = { gte: new Date(now.getTime() - 60 * 60 * 1000) };
          break;
        case 'today':
          searchConditions.publishedAt = { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) };
          break;
        case 'week':
          searchConditions.publishedAt = { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) };
          break;
        case 'month':
          searchConditions.publishedAt = { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) };
          break;
        case 'year':
          searchConditions.publishedAt = { gte: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000) };
          break;
      }
    }

    // Build search query
    const searchQuery = query.trim();
    searchConditions.OR = [
      { title: { contains: searchQuery, mode: 'insensitive' } },
      { description: { contains: searchQuery, mode: 'insensitive' } },
      { 
        channel: {
          name: { contains: searchQuery, mode: 'insensitive' }
        }
      }
    ];

    // Build order by clause
    let orderBy: any = { publishedAt: 'desc' };
    switch (sort) {
      case 'date':
        orderBy = { publishedAt: 'desc' };
        break;
      case 'rating':
        orderBy = { likeCount: 'desc' };
        break;
      case 'viewCount':
        orderBy = { viewCount: 'desc' };
        break;
      case 'duration':
        orderBy = { duration: 'desc' };
        break;
      case 'relevance':
      default:
        // For relevance, we'll use a combination of view count and recency
        orderBy = [
          { viewCount: 'desc' },
          { publishedAt: 'desc' }
        ];
        break;
    }

    // Execute search
    const videos = await prisma.video.findMany({
      where: searchConditions,
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
            name: true
          }
        }
      },
      orderBy,
      skip: offset,
      take: limitNum
    });

    // Get total count for pagination
    const totalCount = await prisma.video.count({ where: searchConditions });

    // Format response
    const formattedVideos = videos.map(video => ({
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
      channel: {
        id: video.channel.id,
        name: video.channel.name,
        avatarUrl: video.channel.avatarUrl,
        subscriberCount: Number(video.channel.subscriberCount),
        userId: video.channel.userId
      },
      category: video.category ? {
        id: video.category.id,
        name: video.category.name
      } : null
    }));

    // Get search suggestions (related terms)
    const suggestions = await getSearchSuggestions(searchQuery, prisma);

    return res.status(200).json({
      success: true,
      data: {
        videos: formattedVideos,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalCount,
          pages: Math.ceil(totalCount / limitNum)
        },
        suggestions,
        query: searchQuery,
        filters: {
          category,
          duration,
          uploadDate,
          sort
        }
      }
    });

  } catch (error) {
    console.error('Error searching videos:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error. Please try again later.'
    });
  }
}

async function getSearchSuggestions(query: string, prisma: any) {
  try {
    // Get suggestions from video titles and channel names
    const titleSuggestions = await prisma.video.findMany({
      where: {
        status: 'READY',
        privacy: 'PUBLIC',
        title: {
          contains: query,
          mode: 'insensitive'
        }
      },
      select: {
        title: true
      },
      take: 5,
      distinct: ['title']
    });

    const channelSuggestions = await prisma.channel.findMany({
      where: {
        name: {
          contains: query,
          mode: 'insensitive'
        }
      },
      select: {
        name: true
      },
      take: 5,
      distinct: ['name']
    });

    // Combine and format suggestions
    const suggestions = [
      ...titleSuggestions.map((v: any) => ({ type: 'video', text: v.title })),
      ...channelSuggestions.map((c: any) => ({ type: 'channel', text: c.name }))
    ].slice(0, 8);

    return suggestions;
  } catch (error) {
    console.error('Error getting search suggestions:', error);
    return [];
  }
}
