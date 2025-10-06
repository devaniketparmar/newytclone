import { NextApiRequest, NextApiResponse } from 'next';
import { JWTUtils } from '@/utils/auth';
import { getInitializedPrisma } from '@/lib/prisma';
import { SerializationUtils } from '@/utils/serialization';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ success: false, error: 'Method not allowed' });
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

    // Get user's library data
    const userId = decoded.userId;

    // Get watch later videos
    const watchLaterVideos = await prisma.video.findMany({
      where: {
        watchLater: {
          some: {
            userId: userId
          }
        }
      },
      include: {
        channel: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            subscriberCount: true
          }
        },
        watchLater: {
          where: {
            userId: userId
          },
          select: {
            createdAt: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50
    });

    // Get liked videos
    const likedVideos = await prisma.video.findMany({
      where: {
        likes: {
          some: {
            userId: userId,
            type: 'LIKE'
          }
        }
      },
      include: {
        channel: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            subscriberCount: true
          }
        },
        likes: {
          where: {
            userId: userId,
            type: 'LIKE'
          },
          select: {
            createdAt: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50
    });

    // Get user's playlists
    const playlists = await prisma.playlist.findMany({
      where: {
        userId: userId
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20
    });

    // Get recent videos (from watch history)
    const recentVideos = await prisma.video.findMany({
      where: {
        views: {
          some: {
            userId: userId
          }
        }
      },
      include: {
        channel: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            subscriberCount: true
          }
        },
        views: {
          where: {
            userId: userId
          },
          select: {
            createdAt: true
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50
    });

    // Format the response
    const libraryData = {
      watchLater: watchLaterVideos.map(video => ({
        ...SerializationUtils.formatVideo(video),
        addedAt: video.watchLater?.[0]?.createdAt?.toISOString() || video.createdAt.toISOString()
      })),
      likedVideos: likedVideos.map(video => ({
        ...SerializationUtils.formatVideo(video),
        addedAt: video.likes?.[0]?.createdAt?.toISOString() || video.createdAt.toISOString()
      })),
      playlists: playlists.map(playlist => ({
        id: playlist.id,
        name: playlist.name,
        description: playlist.description,
        videoCount: playlist.videoCount,
        thumbnailUrl: playlist.thumbnailUrl,
        createdAt: playlist.createdAt.toISOString()
      })),
      recentVideos: recentVideos.map(video => ({
        ...SerializationUtils.formatVideo(video),
        addedAt: video.views?.[0]?.createdAt?.toISOString() || video.createdAt.toISOString()
      }))
    };

    return res.status(200).json({
      success: true,
      data: libraryData
    });

  } catch (error) {
    console.error('Error fetching library data:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error. Please try again later.'
    });
  }
}
