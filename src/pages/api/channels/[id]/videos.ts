import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { JWTUtils } from '@/utils/auth';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ success: false, message: 'Channel ID is required' });
    }

    // Get token from Authorization header or cookies
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '') || req.cookies.token;
    
    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    // Verify token
    const decoded = JWTUtils.verifyToken(token);
    if (!decoded || !decoded.userId) {
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }

    const userId = decoded.userId;

    // Verify user owns this channel (id should match the authenticated user)
    if (id !== userId) {
      return res.status(403).json({ success: false, message: 'Access denied - you can only view your own channel videos' });
    }

    // Get user to verify they exist and get their channel
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        channels: true
      }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Get the user's channel
    const channel = user.channels[0];
    if (!channel) {
      return res.status(404).json({ success: false, message: 'Channel not found' });
    }

    console.log('User found:', user.id, 'Channel found:', channel.id, 'Looking for videos with channelId:', channel.id);

    // Get recent videos with additional data
    const videos = await prisma.video.findMany({
      where: {
        channelId: channel.id
      },
      include: {
        _count: {
          select: {
            likes: true,
            comments: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20 // Limit to 20 most recent videos
    });

    console.log('Found videos:', videos.length, 'for channel:', channel.id);

    // Format videos for the frontend
    const formattedVideos = videos.map(video => ({
      id: video.id,
      title: video.title,
      description: video.description,
      thumbnailUrl: video.thumbnailUrl,
      viewCount: video.viewCount ? Number(video.viewCount) : 0, // Convert BigInt to Number
      likeCount: video._count.likes,
      commentCount: video._count.comments,
      publishedAt: video.createdAt.toISOString(),
      status: video.status === 'READY' ? 'READY' :
              video.status === 'PROCESSING' ? 'PROCESSING' : 'FAILED',
      privacy: video.privacy || 'PUBLIC',
      duration: video.duration,
      tags: [] // You might want to add tags from VideoTag relation
    }));

    res.status(200).json({
      success: true,
      data: formattedVideos
    });

  } catch (error) {
    console.error('Error fetching channel videos:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  } finally {
    await prisma.$disconnect();
  }
}