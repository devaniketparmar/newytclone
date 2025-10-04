import { NextApiRequest, NextApiResponse } from 'next';
import { JWTUtils } from '@/utils/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return handleGetNotifications(req, res);
  }

  if (req.method === 'PUT') {
    return handleMarkAsRead(req, res);
  }

  res.setHeader('Allow', ['GET', 'PUT']);
  res.status(405).json({ success: false, error: 'Method not allowed' });
}

async function handleGetNotifications(req: NextApiRequest, res: NextApiResponse) {
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

    const { page = '1', limit = '20', unreadOnly = 'false' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    const whereClause = {
      userId: payload.userId,
      ...(unreadOnly === 'true' && { read: false })
    };

    const [notifications, totalCount] = await Promise.all([
      prisma.commentNotification.findMany({
        where: whereClause,
        include: {
          comment: {
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
              video: {
                select: {
                  id: true,
                  title: true,
                  thumbnailUrl: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip: offset,
        take: limitNum
      }),
      prisma.commentNotification.count({
        where: whereClause
      })
    ]);

    const formattedNotifications = notifications.map(notification => ({
      id: notification.id,
      type: notification.type,
      read: notification.read,
      createdAt: notification.createdAt,
      comment: {
        id: notification.comment.id,
        content: notification.comment.content,
        user: notification.comment.user,
        video: notification.comment.video
      }
    }));

    return res.status(200).json({
      success: true,
      data: {
        notifications: formattedNotifications,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalCount,
          hasMore: offset + limitNum < totalCount
        }
      }
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch notifications'
    });
  }
}

async function handleMarkAsRead(req: NextApiRequest, res: NextApiResponse) {
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

    const { notificationId } = req.body;

    if (!notificationId) {
      return res.status(400).json({
        success: false,
        error: 'Notification ID is required'
      });
    }

    // Check if notification exists and belongs to user
    const notification = await prisma.commentNotification.findFirst({
      where: {
        id: notificationId,
        userId: payload.userId
      }
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }

    // Mark as read
    await prisma.commentNotification.update({
      where: {
        id: notificationId
      },
      data: {
        read: true
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Notification marked as read'
    });

  } catch (error) {
    console.error('Error marking notification as read:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to mark notification as read'
    });
  }
}
