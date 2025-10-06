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
      // Add to watch later
      try {
        await prisma.watchLater.create({
          data: {
            userId: userId,
            videoId: videoId
          }
        });

        return res.status(201).json({
          success: true,
          message: 'Video added to watch later'
        });
      } catch (error: any) {
        if (error.code === 'P2002') {
          // Already exists
          return res.status(200).json({
            success: true,
            message: 'Video already in watch later'
          });
        }
        throw error;
      }
    }

    if (req.method === 'DELETE') {
      // Remove from watch later
      await prisma.watchLater.deleteMany({
        where: {
          userId: userId,
          videoId: videoId
        }
      });

      return res.status(200).json({
        success: true,
        message: 'Video removed from watch later'
      });
    }

    res.setHeader('Allow', ['POST', 'DELETE']);
    return res.status(405).json({ success: false, error: 'Method not allowed' });

  } catch (error) {
    console.error('Error managing watch later:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error. Please try again later.'
    });
  }
}
