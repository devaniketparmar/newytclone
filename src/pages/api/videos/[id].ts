import { NextApiRequest, NextApiResponse } from 'next';
import { getInitializedPrisma } from '../../../lib/prisma';
import { JWTUtils } from '../../../utils/auth';
import { VideoPrivacy } from '@prisma/client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (req.method === 'GET') {
    return getVideo(req, res, id as string);
  }

  res.setHeader('Allow', ['GET']);
  res.status(405).json({ success: false, error: 'Method not allowed' });
}

async function getVideo(req: NextApiRequest, res: NextApiResponse, videoId: string) {
  try {
    const prisma = await getInitializedPrisma();

    // Get token from Authorization header or cookies
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '') || req.cookies.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No authentication token provided'
      });
    }

    // Verify token
    const decoded = JWTUtils.verifyToken(token);
    if (!decoded || !decoded.userId) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }

    // Find video
    const video = await prisma.video.findUnique({
      where: { id: videoId },
      include: {
        channel: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            subscriberCount: true,
          },
        },
      },
    });

    if (!video) {
      return res.status(404).json({
        success: false,
        error: 'Video not found'
      });
    }

    // Check if video is public or user has access
    if (video.privacy === VideoPrivacy.PRIVATE && video.channel.userId !== decoded.userId) {
      return res.status(403).json({
        success: false,
        error: 'This video is private'
      });
    }

    // Increment view count
    await prisma.video.update({
      where: { id: videoId },
      data: { viewCount: { increment: 1 } }
    });

    // Track view for analytics
    await prisma.view.create({
      data: {
        videoId: videoId,
        userId: decoded.userId,
        watchDuration: 0, // Will be updated when user finishes watching
      },
    });

    res.status(200).json({
      success: true,
      data: {
        id: video.id,
        title: video.title,
        description: video.description,
        thumbnailUrl: video.thumbnailUrl,
        videoUrl: `/api/uploads/${video.videoUrl.replace('/uploads/', '')}`,
        duration: video.duration,
        viewCount: Number(video.viewCount),
        likeCount: video.likeCount,
        commentCount: video.commentCount,
        createdAt: video.createdAt,
        publishedAt: video.publishedAt,
        channel: video.channel,
      },
    });

  } catch (error) {
    console.error('Error fetching video:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}
