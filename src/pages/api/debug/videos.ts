import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { userId } = req.query;

    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    // Get all videos for this user
    const videos = await prisma.video.findMany({
      where: {
        userId: userId
      },
      select: {
        id: true,
        title: true,
        status: true,
        viewCount: true,
        createdAt: true,
        userId: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Get user info
    const user = await prisma.user.findFirst({
      where: {
        id: userId
      },
      select: {
        id: true,
        username: true,
        email: true
      }
    });

    res.status(200).json({
      success: true,
      data: {
        user,
        videos,
        totalVideos: videos.length,
        videoStatuses: videos.reduce((acc, video) => {
          acc[video.status] = (acc[video.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      }
    });

  } catch (error) {
    console.error('Error in debug endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  } finally {
    await prisma.$disconnect();
  }
}


