import { NextApiRequest, NextApiResponse } from 'next';
import { getInitializedPrisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { 
      action = 'list',
      category,
      sort = 'subscribers',
      limit = '20',
      offset = '0',
      search
    } = req.query;

    const limitNum = Math.min(parseInt(limit as string, 10), 50);
    const offsetNum = Math.max(parseInt(offset as string, 10), 0);

    const prisma = await getInitializedPrisma();

    switch (action) {
      case 'list':
        return handleListChannels(req, res, prisma, {
          category: category as string,
          sort: sort as string,
          limit: limitNum,
          offset: offsetNum,
          search: search as string
        });

      case 'featured':
        return handleFeaturedChannels(req, res, prisma, limitNum);

      case 'trending':
        return handleTrendingChannels(req, res, prisma, limitNum);

      case 'categories':
        return handleGetCategories(req, res, prisma);

      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid action. Supported actions: list, featured, trending, categories'
        });
    }

  } catch (error) {
    console.error('Error in channels API:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to process channels request'
    });
  }
}

async function handleListChannels(
  req: NextApiRequest, 
  res: NextApiResponse, 
  prisma: any,
  options: {
    category?: string;
    sort: string;
    limit: number;
    offset: number;
    search?: string;
  }
) {
  const { category, sort, limit, offset, search } = options;

  // Build where clause
  const where: any = {};
  
  if (search) {
    where.name = {
      contains: search,
      mode: 'insensitive'
    };
  }

  // Build orderBy clause
  let orderBy: any = {};
  switch (sort) {
    case 'subscribers':
      orderBy = { subscriberCount: 'desc' };
      break;
    case 'newest':
      orderBy = { createdAt: 'desc' };
      break;
    case 'oldest':
      orderBy = { createdAt: 'asc' };
      break;
    case 'name':
      orderBy = { name: 'asc' };
      break;
    default:
      orderBy = { subscriberCount: 'desc' };
  }

  // Get channels with video count
  const channels = await prisma.channel.findMany({
    where,
    orderBy,
    skip: offset,
    take: limit,
    select: {
      id: true,
      name: true,
      avatarUrl: true,
      subscriberCount: true,
      createdAt: true,
      userId: true,
      user: {
        select: {
          verified: true
        }
      },
      _count: {
        select: {
          videos: {
            where: {
              status: 'READY',
              privacy: 'PUBLIC'
            }
          }
        }
      }
    }
  });

  // Get total count for pagination
  const totalCount = await prisma.channel.count({ where });

  // Transform data
  const transformedChannels = channels.map(channel => ({
    id: channel.id,
    name: channel.name,
    avatarUrl: channel.avatarUrl,
    subscriberCount: Number(channel.subscriberCount),
    videoCount: channel._count.videos,
    isVerified: channel.user?.verified || false,
    createdAt: channel.createdAt,
    userId: channel.userId
  }));

  return res.status(200).json({
    success: true,
    data: {
      channels: transformedChannels,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      }
    }
  });
}

async function handleFeaturedChannels(req: NextApiRequest, res: NextApiResponse, prisma: any, limit: number) {
  // Get channels with highest subscriber count and recent activity
  const channels = await prisma.channel.findMany({
    orderBy: [
      { subscriberCount: 'desc' },
      { createdAt: 'desc' }
    ],
    take: limit,
    select: {
      id: true,
      name: true,
      avatarUrl: true,
      subscriberCount: true,
      createdAt: true,
      userId: true,
      user: {
        select: {
          verified: true
        }
      },
      _count: {
        select: {
          videos: {
            where: {
              status: 'READY',
              privacy: 'PUBLIC'
            }
          }
        }
      }
    }
  });

  const transformedChannels = channels.map(channel => ({
    id: channel.id,
    name: channel.name,
    avatarUrl: channel.avatarUrl,
    subscriberCount: Number(channel.subscriberCount),
    videoCount: channel._count.videos,
    isVerified: channel.user?.verified || false,
    createdAt: channel.createdAt,
    userId: channel.userId
  }));

  return res.status(200).json({
    success: true,
    data: {
      channels: transformedChannels
    }
  });
}

async function handleTrendingChannels(req: NextApiRequest, res: NextApiResponse, prisma: any, limit: number) {
  // Get channels with recent video uploads and high engagement
  const channels = await prisma.channel.findMany({
    where: {
      videos: {
        some: {
          status: 'READY',
          privacy: 'PUBLIC',
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        }
      }
    },
    orderBy: [
      { subscriberCount: 'desc' },
      { createdAt: 'desc' }
    ],
    take: limit,
    select: {
      id: true,
      name: true,
      avatarUrl: true,
      subscriberCount: true,
      createdAt: true,
      userId: true,
      user: {
        select: {
          verified: true
        }
      },
      _count: {
        select: {
          videos: {
            where: {
              status: 'READY',
              privacy: 'PUBLIC'
            }
          }
        }
      }
    }
  });

  const transformedChannels = channels.map(channel => ({
    id: channel.id,
    name: channel.name,
    avatarUrl: channel.avatarUrl,
    subscriberCount: Number(channel.subscriberCount),
    videoCount: channel._count.videos,
    isVerified: channel.user?.verified || false,
    createdAt: channel.createdAt,
    userId: channel.userId
  }));

  return res.status(200).json({
    success: true,
    data: {
      channels: transformedChannels
    }
  });
}

async function handleGetCategories(req: NextApiRequest, res: NextApiResponse, prisma: any) {
  // Get unique categories from channels (if you have a category field)
  // For now, return some default categories
  const categories = [
    { id: 'all', name: 'All Channels', count: 0 },
    { id: 'gaming', name: 'Gaming', count: 0 },
    { id: 'music', name: 'Music', count: 0 },
    { id: 'education', name: 'Education', count: 0 },
    { id: 'entertainment', name: 'Entertainment', count: 0 },
    { id: 'technology', name: 'Technology', count: 0 },
    { id: 'lifestyle', name: 'Lifestyle', count: 0 },
    { id: 'news', name: 'News', count: 0 }
  ];

  return res.status(200).json({
    success: true,
    data: {
      categories
    }
  });
}
