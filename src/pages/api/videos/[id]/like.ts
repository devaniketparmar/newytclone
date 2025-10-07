import { NextApiRequest, NextApiResponse } from 'next';
import { JWTUtils } from '@/utils/auth';
import { getInitializedPrisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Video ID is required'
    });
  }

  if (req.method === 'POST') {
    return handleLikeVideo(req, res, id);
  }

  if (req.method === 'GET') {
    return handleGetLikeStatus(req, res, id);
  }

  res.setHeader('Allow', ['POST', 'GET']);
  res.status(405).json({ success: false, error: 'Method not allowed' });
}

async function handleLikeVideo(req: NextApiRequest, res: NextApiResponse, videoId: string) {
  try {
    const prisma = await getInitializedPrisma();
    
    // Get token from Authorization header or cookies
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '') || req.cookies.token;
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
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

    // Verify video exists
    const video = await prisma.video.findUnique({
      where: { id: videoId },
      select: { id: true, title: true, likeCount: true, dislikeCount: true }
    });

    if (!video) {
      return res.status(404).json({
        success: false,
        error: 'Video not found'
      });
    }

    // Parse request body
    const { type } = req.body; // 'like' or 'dislike'

    if (!type || !['like', 'dislike'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Like type must be "like" or "dislike"'
      });
    }

    // Check if user already liked/disliked this video
    const existingLike = await prisma.like.findFirst({
      where: {
        userId: (decoded as any).userId,
        videoId,
        type: type === 'like' ? 'LIKE' : 'DISLIKE'
      }
    });

    if (existingLike) {
      // Remove existing like/dislike
      await prisma.like.delete({
        where: { id: existingLike.id }
      });

      // Update video counts
      await prisma.video.update({
        where: { id: videoId },
        data: {
          likeCount: type === 'like' ? { decrement: 1 } : undefined,
          dislikeCount: type === 'dislike' ? { decrement: 1 } : undefined
        }
      });

      return res.status(200).json({
        success: true,
        data: {
          liked: false,
          disliked: false,
          likeCount: type === 'like' ? video.likeCount - 1 : video.likeCount,
          dislikeCount: type === 'dislike' ? video.dislikeCount - 1 : video.dislikeCount
        }
      });
    }

    // Check if user has opposite reaction
    const oppositeLike = await prisma.like.findFirst({
      where: {
        userId: (decoded as any).userId,
        videoId,
        type: type === 'like' ? 'DISLIKE' : 'LIKE'
      }
    });

    if (oppositeLike) {
      // Update existing like/dislike
      await prisma.like.update({
        where: { id: oppositeLike.id },
        data: {
          type: type === 'like' ? 'LIKE' : 'DISLIKE'
        }
      });

      // Update video counts
      await prisma.video.update({
        where: { id: videoId },
        data: {
          likeCount: type === 'like' ? { increment: 1 } : { decrement: 1 },
          dislikeCount: type === 'dislike' ? { increment: 1 } : { decrement: 1 }
        }
      });

      return res.status(200).json({
        success: true,
        data: {
          liked: type === 'like',
          disliked: type === 'dislike',
          likeCount: type === 'like' ? video.likeCount + 1 : video.likeCount - 1,
          dislikeCount: type === 'dislike' ? video.dislikeCount + 1 : video.dislikeCount - 1
        }
      });
    }

    // Create new like/dislike
    await prisma.like.create({
      data: {
        userId: (decoded as any).userId,
        videoId,
        type: type === 'like' ? 'LIKE' : 'DISLIKE'
      }
    });

    // Update video counts
    await prisma.video.update({
      where: { id: videoId },
      data: {
        likeCount: type === 'like' ? { increment: 1 } : undefined,
        dislikeCount: type === 'dislike' ? { increment: 1 } : undefined
      }
    });

    return res.status(200).json({
      success: true,
      data: {
        liked: type === 'like',
        disliked: type === 'dislike',
        likeCount: type === 'like' ? video.likeCount + 1 : video.likeCount,
        dislikeCount: type === 'dislike' ? video.dislikeCount + 1 : video.dislikeCount
      }
    });

  } catch (error) {
    console.error('Error liking video:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error. Please try again later.'
    });
  }
}

async function handleGetLikeStatus(req: NextApiRequest, res: NextApiResponse, videoId: string) {
  try {
    const prisma = await getInitializedPrisma();
    
    // Get token from Authorization header or cookies (optional)
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '') || req.cookies.token;
    
    let userId = null;
    if (token) {
      try {
        const decoded = JWTUtils.verifyToken(token);
        if (decoded && decoded.userId) {
          userId = decoded.userId;
        }
      } catch (error) {
        console.log('Token verification failed, proceeding without authentication');
      }
    }

    // Get video with current counts
    const video = await prisma.video.findUnique({
      where: { id: videoId },
      select: { 
        id: true, 
        title: true, 
        likeCount: true, 
        dislikeCount: true 
      }
    });

    if (!video) {
      return res.status(404).json({
        success: false,
        error: 'Video not found'
      });
    }

    let userLikeStatus = { liked: false, disliked: false };

    // Get user's like status if authenticated
    if (userId) {
      const userLike = await prisma.like.findFirst({
        where: {
          userId,
          videoId
        }
      });

      if (userLike) {
        userLikeStatus = {
          liked: userLike.type === 'LIKE',
          disliked: userLike.type === 'DISLIKE'
        };
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        ...userLikeStatus,
        likeCount: video.likeCount,
        dislikeCount: video.dislikeCount
      }
    });

  } catch (error) {
    console.error('Error getting like status:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error. Please try again later.'
    });
  }
}
