import { NextApiRequest, NextApiResponse } from 'next';
import { JWTUtils } from '@/utils/auth';
import { getInitializedPrisma } from '@/lib/prisma';

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

    if (req.method === 'POST') {
      // Add video to playlist
      const { videoId } = req.body;

      if (!videoId) {
        return res.status(400).json({
          success: false,
          error: 'Video ID is required'
        });
      }

      // Check if playlist exists and user owns it
      const playlist = await prisma.playlist.findUnique({
        where: { id },
        select: { userId: true, videoCount: true }
      });

      if (!playlist) {
        return res.status(404).json({
          success: false,
          error: 'Playlist not found'
        });
      }

      if (playlist.userId !== userId) {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }

      // Check if video exists
      const video = await prisma.video.findUnique({
        where: { id: videoId },
        select: { id: true }
      });

      if (!video) {
        return res.status(404).json({
          success: false,
          error: 'Video not found'
        });
      }

      // Check if video is already in playlist
      const existingPlaylistVideo = await prisma.playlistVideo.findUnique({
        where: {
          playlistId_videoId: {
            playlistId: id,
            videoId: videoId
          }
        }
      });

      if (existingPlaylistVideo) {
        return res.status(400).json({
          success: false,
          error: 'Video is already in this playlist'
        });
      }

      // Add video to playlist
      await prisma.playlistVideo.create({
        data: {
          playlistId: id,
          videoId: videoId,
          position: playlist.videoCount + 1
        }
      });

      // Update playlist video count
      await prisma.playlist.update({
        where: { id },
        data: {
          videoCount: {
            increment: 1
          }
        }
      });

      return res.status(201).json({
        success: true,
        message: 'Video added to playlist successfully'
      });
    }

    if (req.method === 'DELETE') {
      // Remove video from playlist
      const { videoId } = req.body;

      if (!videoId) {
        return res.status(400).json({
          success: false,
          error: 'Video ID is required'
        });
      }

      // Check if playlist exists and user owns it
      const playlist = await prisma.playlist.findUnique({
        where: { id },
        select: { userId: true }
      });

      if (!playlist) {
        return res.status(404).json({
          success: false,
          error: 'Playlist not found'
        });
      }

      if (playlist.userId !== userId) {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }

      // Remove video from playlist
      const deletedPlaylistVideo = await prisma.playlistVideo.deleteMany({
        where: {
          playlistId: id,
          videoId: videoId
        }
      });

      if (deletedPlaylistVideo.count === 0) {
        return res.status(404).json({
          success: false,
          error: 'Video not found in playlist'
        });
      }

      // Update playlist video count
      await prisma.playlist.update({
        where: { id },
        data: {
          videoCount: {
            decrement: 1
          }
        }
      });

      return res.status(200).json({
        success: true,
        message: 'Video removed from playlist successfully'
      });
    }

    res.setHeader('Allow', ['POST', 'DELETE']);
    return res.status(405).json({ success: false, error: 'Method not allowed' });

  } catch (error) {
    console.error('Error managing playlist videos:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error. Please try again later.'
    });
  }
}
