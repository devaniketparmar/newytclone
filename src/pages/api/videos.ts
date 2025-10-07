import { NextApiRequest, NextApiResponse } from 'next';
import { getInitializedPrisma } from '../../lib/prisma';
import { JWTUtils } from '../../utils/auth';
import { VideoStatus, VideoPrivacy } from '@prisma/client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return handleGetVideos(req, res);
  }
  
  res.setHeader('Allow', ['GET']);
  res.status(405).json({ success: false, error: 'Method not allowed' });
}

async function handleGetVideos(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Initialize database connection
    const prisma = await getInitializedPrisma();
    
    // Get token from Authorization header or cookies (optional for public videos)
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '') || req.cookies.token;
    
    let userId = null;
    if (token) {
      try {
        const decoded = JWTUtils.verifyToken(token);
        if (decoded && (decoded as any).userId) {
          userId = (decoded as any).userId;
        }
      } catch (error) {
        console.log('Token verification failed, proceeding without authentication');
      }
    }

    // Get query parameters
    const { page = '1', limit = '10', category, search } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = {
      status: VideoStatus.READY,
      privacy: VideoPrivacy.PUBLIC
    };

    if (category && category !== 'all') {
      // Check if category is a number (ID) or string (name)
      const categoryParam = category as string;
      if (/^\d+$/.test(categoryParam)) {
        // It's a numeric ID
        where.categoryId = parseInt(categoryParam);
      } else {
        // It's a category name, find the category by name
        const categoryRecord = await prisma.category.findFirst({
          where: {
            name: {
              equals: categoryParam,
              mode: 'insensitive'
            },
            active: true
          }
        });
        
        if (categoryRecord) {
          where.categoryId = categoryRecord.id;
        } else {
          // If category not found, return empty results
          return res.status(200).json({
            success: true,
            data: [],
            pagination: {
              page: pageNum,
              limit: limitNum,
              total: 0,
              totalPages: 0,
              hasNext: false,
              hasPrev: false
            }
          });
        }
      }
    }

    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    // Get videos with channel information
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
        }
      },
      orderBy: {
        publishedAt: 'desc'
      },
      skip: offset,
      take: limitNum
    });

    // Get total count for pagination
    const totalCount = await prisma.video.count({ where });

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
      publishedAt: video.publishedAt || video.createdAt,
      status: video.status,
      channel: {
        id: video.channel.id,
        name: video.channel.name,
        avatarUrl: video.channel.avatarUrl,
        subscriberCount: Number(video.channel.subscriberCount),
        userId: video.channel.userId
      }
    }));

    res.status(200).json({
      success: true,
      data: formattedVideos,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limitNum),
        hasNext: pageNum * limitNum < totalCount,
        hasPrev: pageNum > 1
      }
    });

  } catch (error) {
    console.error('Get videos error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error. Please try again later.'
    });
  }
}
