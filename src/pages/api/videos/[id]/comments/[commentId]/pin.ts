import { NextApiRequest, NextApiResponse } from 'next';
import { JWTUtils } from '@/utils/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id, commentId } = req.query;

  if (!id || typeof id !== 'string' || !commentId || typeof commentId !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Video ID and Comment ID are required'
    });
  }

  if (req.method === 'POST') {
    return handlePinComment(req, res, id, commentId);
  }

  if (req.method === 'DELETE') {
    return handleUnpinComment(req, res, id, commentId);
  }

  res.setHeader('Allow', ['POST', 'DELETE']);
  res.status(405).json({ success: false, error: 'Method not allowed' });
}

async function handlePinComment(req: NextApiRequest, res: NextApiResponse, videoId: string, commentId: string) {
  try {
    
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
    const payload = JWTUtils.verifyToken(token);
    if (!payload || !payload.userId) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }

    // Check if comment exists and belongs to the video
    const comment = await prisma.comment.findFirst({
      where: {
        id: commentId,
        videoId: videoId,
        status: 'ACTIVE',
        parentId: null // Only top-level comments can be pinned
      },
      include: {
        video: {
          include: {
            channel: {
              include: {
                user: true
              }
            }
          }
        }
      }
    });

    if (!comment) {
      return res.status(404).json({
        success: false,
        error: 'Comment not found or cannot be pinned'
      });
    }

    // Check if user is the video owner
    if (comment.video.channel.userId !== payload.userId) {
      return res.status(403).json({
        success: false,
        error: 'Only video owner can pin comments'
      });
    }

    // Unpin any existing pinned comment for this video
    await prisma.comment.updateMany({
      where: {
        videoId: videoId,
        pinned: true
      },
      data: {
        pinned: false,
        pinnedAt: null,
        pinnedBy: null
      }
    });

    // Pin the new comment
    const pinnedComment = await prisma.comment.update({
      where: {
        id: commentId
      },
      data: {
        pinned: true,
        pinnedAt: new Date(),
        pinnedBy: payload.userId
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatarUrl: true
          }
        }
      }
    });

    // Create notification for comment author
    if (comment.userId !== payload.userId) {
      await prisma.commentNotification.create({
        data: {
          userId: comment.userId,
          commentId: commentId,
          type: 'pinned'
        }
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Comment pinned successfully',
      data: {
        id: pinnedComment.id,
        pinned: pinnedComment.pinned,
        pinnedAt: pinnedComment.pinnedAt
      }
    });

  } catch (error) {
    console.error('Error pinning comment:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to pin comment'
    });
  }
}

async function handleUnpinComment(req: NextApiRequest, res: NextApiResponse, videoId: string, commentId: string) {
  try {
    
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
    const payload = JWTUtils.verifyToken(token);
    if (!payload || !payload.userId) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }

    // Check if comment exists and is pinned
    const comment = await prisma.comment.findFirst({
      where: {
        id: commentId,
        videoId: videoId,
        pinned: true
      },
      include: {
        video: {
          include: {
            channel: {
              include: {
                user: true
              }
            }
          }
        }
      }
    });

    if (!comment) {
      return res.status(404).json({
        success: false,
        error: 'Pinned comment not found'
      });
    }

    // Check if user is the video owner
    if (comment.video.channel.userId !== payload.userId) {
      return res.status(403).json({
        success: false,
        error: 'Only video owner can unpin comments'
      });
    }

    // Unpin the comment
    const unpinnedComment = await prisma.comment.update({
      where: {
        id: commentId
      },
      data: {
        pinned: false,
        pinnedAt: null,
        pinnedBy: null
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Comment unpinned successfully',
      data: {
        id: unpinnedComment.id,
        pinned: unpinnedComment.pinned
      }
    });

  } catch (error) {
    console.error('Error unpinning comment:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to unpin comment'
    });
  }
}
