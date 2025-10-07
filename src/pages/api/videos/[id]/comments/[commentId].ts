import { getInitializedPrisma } from '@/lib/prisma';
import { JWTUtils } from '@/utils/auth';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id, commentId } = req.query;

  if (!id || typeof id !== 'string' || !commentId || typeof commentId !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Video ID and Comment ID are required'
    });
  }

  if (req.method === 'PUT') {
    return handleUpdateComment(req, res, id, commentId);
  }

  if (req.method === 'DELETE') {
    return handleDeleteComment(req, res, id, commentId);
  }

  if (req.method === 'POST') {
    return handleLikeComment(req, res, id, commentId);
  }

  res.setHeader('Allow', ['PUT', 'DELETE', 'POST']);
  res.status(405).json({ success: false, error: 'Method not allowed' });
}

async function handleUpdateComment(req: NextApiRequest, res: NextApiResponse, videoId: string, commentId: string) {
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

    // Get comment and verify ownership
    const comment = await prisma.comment.findFirst({
      where: {
        id: commentId,
        videoId,
        userId: (decoded as any).userId,
        status: 'ACTIVE'
      }
    });

    if (!comment) {
      return res.status(404).json({
        success: false,
        error: 'Comment not found or you do not have permission to edit it'
      });
    }

    // Parse request body
    const { content } = req.body;

    // Validate required fields
    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Comment content is required'
      });
    }

    if (content.length > 1000) {
      return res.status(400).json({
        success: false,
        error: 'Comment content must be less than 1000 characters'
      });
    }

    // Update comment
    const updatedComment = await prisma.comment.update({
      where: { id: commentId },
      data: {
        content: content.trim(),
        updatedAt: new Date()
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

    // Format response
    const formattedComment = {
      id: updatedComment.id,
      content: updatedComment.content,
      likeCount: updatedComment.likeCount,
      dislikeCount: updatedComment.dislikeCount,
      replyCount: 0,
      createdAt: updatedComment.createdAt,
      updatedAt: updatedComment.updatedAt,
      user: {
        id: updatedComment.user.id,
        username: updatedComment.user.username,
        name: updatedComment.user.firstName && updatedComment.user.lastName 
          ? `${updatedComment.user.firstName} ${updatedComment.user.lastName}`
          : updatedComment.user.username,
        avatarUrl: updatedComment.user.avatarUrl
      }
    };

    return res.status(200).json({
      success: true,
      data: formattedComment
    });

  } catch (error) {
    console.error('Error updating comment:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error. Please try again later.'
    });
  }
}

async function handleDeleteComment(req: NextApiRequest, res: NextApiResponse, videoId: string, commentId: string) {
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

    // Get comment and verify ownership
    const comment = await prisma.comment.findFirst({
      where: {
        id: commentId,
        videoId,
        userId: (decoded as any).userId,
        status: 'ACTIVE'
      }
    });

    if (!comment) {
      return res.status(404).json({
        success: false,
        error: 'Comment not found or you do not have permission to delete it'
      });
    }

    // Soft delete comment (set status to DELETED)
    await prisma.comment.update({
      where: { id: commentId },
      data: {
        status: 'DELETED',
        updatedAt: new Date()
      }
    });

    // Update video comment count
    await prisma.video.update({
      where: { id: videoId },
      data: {
        commentCount: {
          decrement: 1
        }
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Comment deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting comment:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error. Please try again later.'
    });
  }
}

async function handleLikeComment(req: NextApiRequest, res: NextApiResponse, videoId: string, commentId: string) {
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

    // Verify comment exists
    const comment = await prisma.comment.findFirst({
      where: {
        id: commentId,
        videoId,
        status: 'ACTIVE'
      }
    });

    if (!comment) {
      return res.status(404).json({
        success: false,
        error: 'Comment not found'
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

    // Check if user already liked/disliked this comment
    const existingLike = await prisma.like.findFirst({
      where: {
        userId: (decoded as any).userId,
        commentId,
        type: type === 'like' ? 'LIKE' : 'DISLIKE'
      }
    });

    if (existingLike) {
      // Remove existing like/dislike
      await prisma.like.delete({
        where: { id: existingLike.id }
      });

      // Update comment counts
      await prisma.comment.update({
        where: { id: commentId },
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
          likeCount: type === 'like' ? comment.likeCount - 1 : comment.likeCount,
          dislikeCount: type === 'dislike' ? comment.dislikeCount - 1 : comment.dislikeCount
        }
      });
    }

    // Check if user has opposite reaction
    const oppositeLike = await prisma.like.findFirst({
      where: {
        userId: (decoded as any).userId,
        commentId,
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

      // Update comment counts
      await prisma.comment.update({
        where: { id: commentId },
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
          likeCount: type === 'like' ? comment.likeCount + 1 : comment.likeCount - 1,
          dislikeCount: type === 'dislike' ? comment.dislikeCount + 1 : comment.dislikeCount - 1
        }
      });
    }

    // Create new like/dislike
    await prisma.like.create({
      data: {
        userId: (decoded as any).userId,
        commentId,
        type: type === 'like' ? 'LIKE' : 'DISLIKE'
      }
    });

    // Update comment counts
    await prisma.comment.update({
      where: { id: commentId },
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
        likeCount: type === 'like' ? comment.likeCount + 1 : comment.likeCount,
        dislikeCount: type === 'dislike' ? comment.dislikeCount + 1 : comment.dislikeCount
      }
    });

  } catch (error) {
    console.error('Error liking comment:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error. Please try again later.'
    });
  }
}
