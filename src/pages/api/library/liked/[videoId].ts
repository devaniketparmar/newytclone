import { NextApiRequest, NextApiResponse } from 'next';
import { JWTUtils } from '@/utils/auth';
import { getInitializedPrisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { videoId } = req.query as { videoId: string };

  if (!videoId) {
    return res.status(400).json({
      success: false,
      error: 'Video ID is required'
    });
  }

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

    const userId = decoded.userId;

    if (req.method === 'POST') {
      // Add to liked videos
      try {
        await prisma.like.create({
          data: {
            userId: userId,
            videoId: videoId,
            type: 'LIKE'
          }
        });

        // Update video like count
        await prisma.video.update({
          where: { id: videoId },
          data: {
            likeCount: {
              increment: 1
            }
          }
        });

        return res.status(201).json({
          success: true,
          message: 'Video liked'
        });
      } catch (error: any) {
        if (error.code === 'P2002') {
          // Already exists, update to LIKE if it was DISLIKE
          const existingLike = await prisma.like.findFirst({
            where: {
              userId: userId,
              videoId: videoId
            }
          });

          if (existingLike && existingLike.type === 'DISLIKE') {
            await prisma.like.update({
              where: { id: existingLike.id },
              data: { type: 'LIKE' }
            });

            // Update counts
            await prisma.video.update({
              where: { id: videoId },
              data: {
                likeCount: { increment: 1 },
                dislikeCount: { decrement: 1 }
              }
            });
          }

          return res.status(200).json({
            success: true,
            message: 'Video liked'
          });
        }
        throw error;
      }
    }

    if (req.method === 'DELETE') {
      // Remove from liked videos
      const existingLike = await prisma.like.findFirst({
        where: {
          userId: userId,
          videoId: videoId,
          type: 'LIKE'
        }
      });

      if (existingLike) {
        await prisma.like.delete({
          where: { id: existingLike.id }
        });

        // Update video like count
        await prisma.video.update({
          where: { id: videoId },
          data: {
            likeCount: {
              decrement: 1
            }
          }
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Video unliked'
      });
    }

    res.setHeader('Allow', ['POST', 'DELETE']);
    return res.status(405).json({ success: false, error: 'Method not allowed' });

  } catch (error) {
    console.error('Error managing liked videos:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error. Please try again later.'
    });
  }
}
