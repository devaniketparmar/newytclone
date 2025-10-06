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
    return handleReportComment(req, res, id, commentId);
  }

  res.setHeader('Allow', ['POST']);
  res.status(405).json({ success: false, error: 'Method not allowed' });
}

async function handleReportComment(req: NextApiRequest, res: NextApiResponse, videoId: string, commentId: string) {
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

    const { reason, description } = req.body;

    if (!reason || !['spam', 'harassment', 'inappropriate', 'other'].includes(reason)) {
      return res.status(400).json({
        success: false,
        error: 'Valid reason is required'
      });
    }

    // Check if comment exists and belongs to the video
    const comment = await prisma.comment.findFirst({
      where: {
        id: commentId,
        videoId: videoId,
        status: 'ACTIVE'
      },
      include: {
        user: true
      }
    });

    if (!comment) {
      return res.status(404).json({
        success: false,
        error: 'Comment not found'
      });
    }

    // Check if user already reported this comment
    const existingReport = await prisma.commentReport.findFirst({
      where: {
        commentId: commentId,
        reporterId: payload.userId
      }
    });

    if (existingReport) {
      return res.status(400).json({
        success: false,
        error: 'You have already reported this comment'
      });
    }

    // Create the report
    const report = await prisma.commentReport.create({
      data: {
        commentId: commentId,
        reporterId: payload.userId,
        reason: reason,
        description: description || null,
        status: 'pending'
      },
      include: {
        comment: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true
              }
            }
          }
        },
        reporter: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    // TODO: Send notification to moderators
    // TODO: Implement automated spam detection

    return res.status(201).json({
      success: true,
      message: 'Comment reported successfully',
      data: {
        id: report.id,
        reason: report.reason,
        status: report.status,
        createdAt: report.createdAt
      }
    });

  } catch (error) {
    console.error('Error reporting comment:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to report comment'
    });
  }
}
