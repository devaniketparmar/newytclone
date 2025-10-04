import { NextApiRequest, NextApiResponse } from 'next';
import { getInitializedPrisma } from '@/lib/prisma';
import { JWTUtils } from '@/utils/auth';
import { VideoPrivacy } from '@prisma/client';
import fs from 'fs';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Video ID is required'
    });
  }

  if (req.method === 'GET') {
    return handleGetVideo(req, res, id);
  }

  if (req.method === 'PUT') {
    return handleVideoUpdate(req, res, id);
  }
  
  if (req.method === 'DELETE') {
    return handleVideoDelete(req, res, id);
  }
  
  res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
  res.status(405).json({ success: false, error: 'Method not allowed' });
}

async function handleGetVideo(req: NextApiRequest, res: NextApiResponse, videoId: string) {
  try {
    // Initialize database connection
    const prisma = await getInitializedPrisma();
    
    // Get video with channel information
    const video = await prisma.video.findUnique({
      where: { id: videoId },
      include: {
        channel: {
          include: {
            user: true
          }
        }
      }
    });

    if (!video) {
      return res.status(404).json({
        success: false,
        error: 'Video not found'
      });
    }

    // Track view (optional - you might want to add authentication check here)
    try {
      await prisma.view.create({
        data: {
          videoId: videoId,
          userId: null, // Anonymous view
          ipAddress: req.headers['x-forwarded-for'] as string || req.connection.remoteAddress || 'unknown'
        }
      });

      // Update view count
      await prisma.video.update({
        where: { id: videoId },
        data: { viewCount: { increment: 1 } }
      });
    } catch (viewError) {
      console.warn('Could not track view:', viewError);
    }

    // Format response
    const formattedVideo = {
      id: video.id,
      title: video.title,
      description: video.description,
      thumbnailUrl: video.thumbnailUrl,
      videoUrl: video.videoUrl.startsWith('/uploads/') ? `/api/uploads/${video.videoUrl.replace('/uploads/', '')}` : video.videoUrl,
      duration: video.duration,
      viewCount: Number(video.viewCount),
      likeCount: video.likeCount,
      commentCount: video.commentCount,
      createdAt: video.createdAt,
      publishedAt: video.publishedAt || video.createdAt,
      privacy: video.privacy,
      status: video.status,
      metadata: video.metadata,
      channel: {
        id: video.channel.id,
        name: video.channel.name,
        avatarUrl: video.channel.avatarUrl,
        userId: video.channel.userId
      }
    };

    res.status(200).json({
      success: true,
      data: formattedVideo
    });

  } catch (error) {
    console.error('Get video error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error. Please try again later.'
    });
  }
}

async function handleVideoUpdate(req: NextApiRequest, res: NextApiResponse, videoId: string) {
  try {
    console.log('Starting video update process...');
    
    // Initialize database connection
    const prisma = await getInitializedPrisma();
    
    // Get token from Authorization header or cookies
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '') || req.cookies.token;
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No authentication token provided'
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

    // Get video and check ownership
    const video = await prisma.video.findUnique({
      where: { id: videoId },
      include: {
        channel: {
          include: {
            user: true
          }
        }
      }
    });

    if (!video) {
      return res.status(404).json({
        success: false,
        error: 'Video not found'
      });
    }

    // Check if user owns this video
    if (video.channel.userId !== decoded.userId) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to edit this video'
      });
    }

    // Parse request body
    const {
      title,
      description,
      category,
      privacy,
      tags,
      language,
      scheduledAt,
      ageRestriction,
      commentsEnabled,
      monetizationEnabled,
      allowEmbedding,
      showViewCount,
      allowLiveStreaming
    } = req.body;

    // Validate required fields
    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Video title is required'
      });
    }

    // Parse tags
    const tagsArray = tags ? tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag.length > 0) : [];

    // Update video metadata
    const metadata = {
      originalFileName: video.metadata ? JSON.parse(video.metadata).originalFileName : '',
      fileType: video.metadata ? JSON.parse(video.metadata).fileType : '',
      uploadDate: video.metadata ? JSON.parse(video.metadata).uploadDate : new Date().toISOString(),
      language: language || 'en',
      tags: tagsArray,
      ageRestriction: ageRestriction || false,
      commentsEnabled: commentsEnabled !== false,
      monetizationEnabled: monetizationEnabled || false,
      allowEmbedding: allowEmbedding !== false,
      showViewCount: showViewCount !== false,
      allowLiveStreaming: allowLiveStreaming || false
    };

    // Update video record
    const updatedVideo = await prisma.video.update({
      where: { id: videoId },
      data: {
        title: title.trim(),
        description: description?.trim() || '',
        privacy: privacy?.toUpperCase() as VideoPrivacy || 'PUBLIC',
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        publishedAt: scheduledAt ? new Date(scheduledAt) : video.publishedAt,
        metadata: JSON.stringify(metadata)
      },
      include: {
        channel: {
          select: {
            id: true,
            name: true,
            avatarUrl: true
          }
        }
      }
    });

    console.log('Video updated successfully:', updatedVideo.id);

    res.status(200).json({
      success: true,
      data: {
        video: updatedVideo
      },
      message: 'Video updated successfully'
    });

  } catch (error) {
    console.error('Video update error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error. Please try again later.'
    });
  }
}

async function handleVideoDelete(req: NextApiRequest, res: NextApiResponse, videoId: string) {
  try {
    console.log('Starting video deletion process...');
    
    // Initialize database connection
    const prisma = await getInitializedPrisma();
    
    // Get token from Authorization header or cookies
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '') || req.cookies.token;
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No authentication token provided'
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

    // Get video and check ownership
    const video = await prisma.video.findUnique({
      where: { id: videoId },
      include: {
        channel: {
          include: {
            user: true
          }
        }
      }
    });

    if (!video) {
      return res.status(404).json({
        success: false,
        error: 'Video not found'
      });
    }

    // Check if user owns this video
    if (video.channel.userId !== decoded.userId) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to delete this video'
      });
    }

    // Delete video file
    try {
      const videoPath = path.join(process.cwd(), 'uploads', 'videos', path.basename(video.videoUrl));
      if (fs.existsSync(videoPath)) {
        fs.unlinkSync(videoPath);
        console.log('Video file deleted:', videoPath);
      }
    } catch (fileError) {
      console.warn('Could not delete video file:', fileError);
    }

    // Delete thumbnail file
    try {
      if (video.thumbnailUrl) {
        const thumbnailPath = path.join(process.cwd(), 'uploads', 'thumbnails', path.basename(video.thumbnailUrl));
        if (fs.existsSync(thumbnailPath)) {
          fs.unlinkSync(thumbnailPath);
          console.log('Thumbnail file deleted:', thumbnailPath);
        }
      }
    } catch (fileError) {
      console.warn('Could not delete thumbnail file:', fileError);
    }

    // Delete video record from database (this will cascade delete related records)
    await prisma.video.delete({
      where: { id: videoId }
    });

    // Update channel video count
    await prisma.channel.update({
      where: { id: video.channelId },
      data: { videoCount: { decrement: 1 } }
    });

    console.log('Video deleted successfully:', videoId);

    res.status(200).json({
      success: true,
      message: 'Video deleted successfully'
    });

  } catch (error) {
    console.error('Video deletion error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error. Please try again later.'
    });
  }
}