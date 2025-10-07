import { NextApiRequest, NextApiResponse } from 'next';
import { JWTUtils } from '@/utils/auth';
import { getInitializedPrisma } from '@/lib/prisma';
import { SerializationUtils } from '@/utils/serialization';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query as { id: string };

  if (!id) {
    return res.status(400).json({
      success: false,
      error: 'Playlist ID is required'
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
    if (!decoded || !(decoded as any).userId) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }

    const userId = (decoded as any).userId;

    if (req.method === 'GET') {
      // Get playlist details
      const playlist = await prisma.playlist.findUnique({
        where: { id },
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
          playlistVideos: {
            include: {
              video: {
                include: {
                  channel: {
                    select: {
                      id: true,
                      name: true,
                      avatarUrl: true,
                      subscriberCount: true
                    }
                  }
                }
              }
            },
            orderBy: {
              position: 'asc'
            }
          }
        }
      });

      if (!playlist) {
        return res.status(404).json({
          success: false,
          error: 'Playlist not found'
        });
      }

      // Check if user can view this playlist
      if (playlist.privacy === 'PRIVATE' && playlist.userId !== userId) {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }

      const formattedPlaylist = {
        id: playlist.id,
        name: playlist.name,
        description: playlist.description,
        thumbnailUrl: playlist.thumbnailUrl,
        privacy: playlist.privacy,
        videoCount: playlist.videoCount,
        viewCount: Number(playlist.viewCount),
        createdAt: playlist.createdAt.toISOString(),
        updatedAt: playlist.updatedAt.toISOString(),
        user: playlist.user,
        videos: playlist.playlistVideos.map(pv => ({
          ...SerializationUtils.formatVideo(pv.video),
          position: pv.position,
          addedAt: pv.addedAt.toISOString()
        }))
      };

      return res.status(200).json({
        success: true,
        data: formattedPlaylist
      });
    }

    if (req.method === 'PUT') {
      // Update playlist
      const { name, description, privacy } = req.body;

      // Check if user owns this playlist
      const existingPlaylist = await prisma.playlist.findUnique({
        where: { id },
        select: { userId: true }
      });

      if (!existingPlaylist) {
        return res.status(404).json({
          success: false,
          error: 'Playlist not found'
        });
      }

      if (existingPlaylist.userId !== userId) {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }

      const updateData: any = {};
      if (name !== undefined) updateData.name = name.trim();
      if (description !== undefined) updateData.description = description?.trim() || null;
      if (privacy !== undefined) {
        const validPrivacy = ['PUBLIC', 'UNLISTED', 'PRIVATE'];
        if (!validPrivacy.includes(privacy)) {
          return res.status(400).json({
            success: false,
            error: 'Invalid privacy setting'
          });
        }
        updateData.privacy = privacy;
      }

      const playlist = await prisma.playlist.update({
        where: { id },
        data: updateData,
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

      return res.status(200).json({
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

    if (req.method === 'DELETE') {
      // Delete playlist
      const existingPlaylist = await prisma.playlist.findUnique({
        where: { id },
        select: { userId: true }
      });

      if (!existingPlaylist) {
        return res.status(404).json({
          success: false,
          error: 'Playlist not found'
        });
      }

      if (existingPlaylist.userId !== userId) {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }

      await prisma.playlist.delete({
        where: { id }
      });

      return res.status(200).json({
        success: true,
        message: 'Playlist deleted successfully'
      });
    }

    res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
    return res.status(405).json({ success: false, error: 'Method not allowed' });

  } catch (error) {
    console.error('Error managing playlist:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error. Please try again later.'
    });
  }
}
