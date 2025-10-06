import { NextApiRequest, NextApiResponse } from 'next';
import { JWTUtils } from '@/utils/auth';
import { getInitializedPrisma } from '@/lib/prisma';
import { SerializationUtils } from '@/utils/serialization';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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
      // Create new playlist
      const { name, description, privacy } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({
          success: false,
          error: 'Playlist name is required'
        });
      }

      // Validate privacy setting
      const validPrivacy = ['PUBLIC', 'UNLISTED', 'PRIVATE'];
      if (privacy && !validPrivacy.includes(privacy)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid privacy setting'
        });
      }

      const playlist = await prisma.playlist.create({
        data: {
          userId: userId,
          name: name.trim(),
          description: description?.trim() || null,
          privacy: privacy || 'PUBLIC',
          videoCount: 0,
          viewCount: BigInt(0)
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

      return res.status(201).json({
        success: true,
        data: {
          id: playlist.id,
          name: playlist.name,
          description: playlist.description,
          thumbnailUrl: playlist.thumbnailUrl,
          privacy: playlist.privacy,
          videoCount: playlist.videoCount,
          viewCount: Number(playlist.viewCount),
          createdAt: playlist.createdAt.toISOString(),
          updatedAt: playlist.updatedAt.toISOString(),
          user: playlist.user
        }
      });
    }

    if (req.method === 'GET') {
      // Get user's playlists
      const playlists = await prisma.playlist.findMany({
        where: {
          userId: userId
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
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      const formattedPlaylists = playlists.map(playlist => ({
        id: playlist.id,
        name: playlist.name,
        description: playlist.description,
        thumbnailUrl: playlist.thumbnailUrl,
        privacy: playlist.privacy,
        videoCount: playlist.videoCount,
        viewCount: Number(playlist.viewCount),
        createdAt: playlist.createdAt.toISOString(),
        updatedAt: playlist.updatedAt.toISOString(),
        user: playlist.user
      }));

      return res.status(200).json({
        success: true,
        data: formattedPlaylists
      });
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ success: false, error: 'Method not allowed' });

  } catch (error) {
    console.error('Error managing playlists:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error. Please try again later.'
    });
  }
}
