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

  if (req.method === 'GET') {
    return handleGetComments(req, res, id);
  }

  if (req.method === 'POST') {
    return handleCreateComment(req, res, id);
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).json({ success: false, error: 'Method not allowed' });
}

async function handleGetComments(req: NextApiRequest, res: NextApiResponse, videoId: string) {
  try {
    const prisma = await getInitializedPrisma();
    
    // Get query parameters
    const { page = '1', limit = '20', sort = 'newest' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    // Verify video exists
    const video = await prisma.video.findUnique({
      where: { id: videoId },
      select: { id: true, title: true }
    });

    if (!video) {
      return res.status(404).json({
        success: false,
        error: 'Video not found'
      });
    }

    // Build order by clause - pinned comments first, then by sort preference
    let orderBy: any = [
      { pinned: 'desc' }, // Pinned comments first
      { createdAt: 'desc' } // Then by creation date
    ];
    
    if (sort === 'oldest') {
      orderBy = [
        { pinned: 'desc' }, // Pinned comments first
        { createdAt: 'asc' } // Then by creation date (oldest first)
      ];
    } else if (sort === 'top') {
      orderBy = [
        { pinned: 'desc' }, // Pinned comments first
        { likeCount: 'desc' } // Then by like count
      ];
    }

    // Get comments with user information and replies
    const comments = await prisma.comment.findMany({
      where: {
        videoId,
        status: 'ACTIVE',
        parentId: null // Only top-level comments
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
        },
        replies: {
          where: {
            status: 'ACTIVE'
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
            },
            _count: {
              select: {
                likes: true
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        },
        _count: {
          select: {
            replies: true,
            likes: true
          }
        }
      },
      orderBy,
      skip: offset,
      take: limitNum
    });

    // Get total count for pagination
    const totalCount = await prisma.comment.count({
      where: {
        videoId,
        status: 'ACTIVE',
        parentId: null
      }
    });

    // Format response
    const formattedComments = comments.map(comment => ({
      id: comment.id,
      content: comment.content,
      likeCount: comment.likeCount,
      dislikeCount: comment.dislikeCount,
      replyCount: comment._count.replies,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      pinned: comment.pinned,
      pinnedAt: comment.pinnedAt,
      pinnedBy: comment.pinnedBy,
      user: {
        id: comment.user.id,
        username: comment.user.username,
        name: comment.user.firstName && comment.user.lastName 
          ? `${comment.user.firstName} ${comment.user.lastName}`
          : comment.user.username,
        avatarUrl: comment.user.avatarUrl
      },
      replies: comment.replies.map(reply => ({
        id: reply.id,
        content: reply.content,
        likeCount: reply.likeCount,
        dislikeCount: reply.dislikeCount,
        createdAt: reply.createdAt,
        updatedAt: reply.updatedAt,
        pinned: reply.pinned,
        pinnedAt: reply.pinnedAt,
        pinnedBy: reply.pinnedBy,
        user: {
          id: reply.user.id,
          username: reply.user.username,
          name: reply.user.firstName && reply.user.lastName 
            ? `${reply.user.firstName} ${reply.user.lastName}`
            : reply.user.username,
          avatarUrl: reply.user.avatarUrl
        }
      }))
    }));

    return res.status(200).json({
      success: true,
      data: {
        comments: formattedComments,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalCount,
          pages: Math.ceil(totalCount / limitNum)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching comments:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error. Please try again later.'
    });
  }
}

async function handleCreateComment(req: NextApiRequest, res: NextApiResponse, videoId: string) {
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
      select: { id: true, title: true }
    });

    if (!video) {
      return res.status(404).json({
        success: false,
        error: 'Video not found'
      });
    }

    // Parse request body
    const { content, parentId } = req.body;

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

    // If parentId is provided, verify it exists and belongs to the same video
    if (parentId) {
      const parentComment = await prisma.comment.findFirst({
        where: {
          id: parentId,
          videoId,
          status: 'ACTIVE'
        }
      });

      if (!parentComment) {
        return res.status(400).json({
          success: false,
          error: 'Parent comment not found'
        });
      }
    }

    // Create comment
    const comment: any = await prisma.comment.create({
      data: {
        videoId,
        userId: (decoded as any).userId,
        content: content.trim(),
        parentId: parentId || null,
        status: 'ACTIVE'
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

    // Update video comment count
    await prisma.video.update({
      where: { id: videoId },
      data: {
        commentCount: {
          increment: 1
        }
      }
    });

    // Format response
    const formattedComment = {
      id: comment.id,
      content: comment.content,
      likeCount: comment.likeCount,
      dislikeCount: comment.dislikeCount,
      replyCount: 0,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      user: {
        id: comment.user.id,
        username: comment.user.username,
        name: comment.user.firstName && comment.user.lastName 
          ? `${comment.user.firstName} ${comment.user.lastName}`
          : comment.user.username,
        avatarUrl: comment.user.avatarUrl
      }
    };

    return res.status(201).json({
      success: true,
      data: formattedComment
    });

  } catch (error) {
    console.error('Error creating comment:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error. Please try again later.'
    });
  }
}
