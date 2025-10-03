import { NextApiRequest, NextApiResponse } from 'next';
import { getInitializedPrisma } from '../../../lib/prisma';
import { JWTUtils } from '../../../utils/auth';
import { VideoPrivacy, VideoStatus } from '@prisma/client';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import { ThumbnailGenerator } from '../../../utils/thumbnailGenerator';

// Disable body parsing for file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    return handleVideoUpload(req, res);
  }
  
  res.setHeader('Allow', ['POST']);
  res.status(405).json({ success: false, error: 'Method not allowed' });
}

async function handleVideoUpload(req: NextApiRequest, res: NextApiResponse) {
  try {
    console.log('Starting video upload process...');
    
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

    // Get user's channel
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { channels: true }
    });

    if (!user || !user.channels.length) {
      return res.status(404).json({
        success: false,
        error: 'User channel not found'
      });
    }

    const channel = user.channels[0];

    // Parse form data
    const form = formidable({
      maxFileSize: 500 * 1024 * 1024, // 500MB limit
      uploadDir: path.join(process.cwd(), 'uploads', 'temp'),
      keepExtensions: true,
      filter: function ({ name, originalFilename, mimetype }) {
        // Allow video files and image files (for custom thumbnails)
        console.log('Filter check:', { name, originalFilename, mimetype });
        return mimetype && (mimetype.includes('video') || mimetype.includes('image'));
      }
    });

    console.log('Parsing form data...');
    let fields, files;
    try {
      [fields, files] = await form.parse(req);
      console.log('Form parsed successfully. Fields:', Object.keys(fields), 'Files:', Object.keys(files));
    } catch (parseError) {
      console.error('Form parsing error:', parseError);
      return res.status(400).json({
        success: false,
        error: 'Failed to parse form data. Please check your file and try again.'
      });
    }

    // Validate required fields
    const title = Array.isArray(fields.title) ? fields.title[0] : fields.title;
    const description = Array.isArray(fields.description) ? fields.description[0] : fields.description || '';
    const category = Array.isArray(fields.category) ? fields.category[0] : fields.category || 'Entertainment';
    const privacy = Array.isArray(fields.privacy) ? fields.privacy[0] : fields.privacy || 'public';
    const tags = Array.isArray(fields.tags) ? fields.tags[0] : fields.tags || '';

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Video title is required'
      });
    }

    // Get video file
    const videoFile = Array.isArray(files.video) ? files.video[0] : files.video;
    console.log('Video file received:', videoFile ? {
      originalFilename: videoFile.originalFilename,
      mimetype: videoFile.mimetype,
      size: videoFile.size
    } : 'No video file');
    
    if (!videoFile) {
      return res.status(400).json({
        success: false,
        error: 'Video file is required'
      });
    }

    // Get custom thumbnail file (optional)
    const customThumbnailFile = Array.isArray(files.customThumbnail) ? files.customThumbnail[0] : files.customThumbnail;
    console.log('Custom thumbnail file received:', customThumbnailFile ? {
      originalFilename: customThumbnailFile.originalFilename,
      mimetype: customThumbnailFile.mimetype,
      size: customThumbnailFile.size,
      filepath: customThumbnailFile.filepath
    } : 'No custom thumbnail file');

    // Validate video file type
    const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov', 'application/octet-stream'];
    const allowedVideoExtensions = ['.mp4', '.webm', '.ogg', '.avi', '.mov'];
    
    // Check by MIME type or file extension
    const isValidVideoMimeType = videoFile.mimetype && allowedVideoTypes.includes(videoFile.mimetype);
    const isValidVideoExtension = videoFile.originalFilename && allowedVideoExtensions.some(ext => 
      videoFile.originalFilename.toLowerCase().endsWith(ext)
    );
    
    if (!isValidVideoMimeType && !isValidVideoExtension) {
      return res.status(400).json({
        success: false,
        error: 'Invalid file type. Please upload a video file (MP4, WebM, OGG, AVI, MOV)'
      });
    }

    // Validate custom thumbnail file type (if provided)
    if (customThumbnailFile) {
      const allowedThumbnailTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      const allowedThumbnailExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
      
      const isValidThumbnailMimeType = customThumbnailFile.mimetype && allowedThumbnailTypes.includes(customThumbnailFile.mimetype);
      const isValidThumbnailExtension = customThumbnailFile.originalFilename && allowedThumbnailExtensions.some(ext => 
        customThumbnailFile.originalFilename.toLowerCase().endsWith(ext)
      );
      
      if (!isValidThumbnailMimeType && !isValidThumbnailExtension) {
        return res.status(400).json({
          success: false,
          error: 'Invalid thumbnail file type. Please upload an image file (JPEG, PNG, GIF, WebP)'
        });
      }

      // Validate thumbnail file size (5MB limit)
      const maxThumbnailSize = 5 * 1024 * 1024; // 5MB
      if (customThumbnailFile.size > maxThumbnailSize) {
        return res.status(400).json({
          success: false,
          error: 'Thumbnail file size must be less than 5MB'
        });
      }
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'uploads', 'videos');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const fileExtension = path.extname(videoFile.originalFilename || '');
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}${fileExtension}`;
    const filePath = path.join(uploadsDir, fileName);

    // Move file to uploads directory
    fs.renameSync(videoFile.filepath, filePath);

    // Get file stats
    const stats = fs.statSync(filePath);
    const fileSize = stats.size;

    // Generate thumbnail
    let thumbnailUrl = null;
    let duration = 0;
    let resolution = '1280x720';

    try {
      console.log('Processing thumbnail for video:', filePath);
      
      // Create thumbnails directory
      const thumbnailsDir = path.join(process.cwd(), 'uploads', 'thumbnails');
      if (!fs.existsSync(thumbnailsDir)) {
        fs.mkdirSync(thumbnailsDir, { recursive: true });
      }

      // Generate thumbnail filename (will be SVG if FFmpeg not available)
      const thumbnailFileName = `${path.parse(fileName).name}.svg`;
      const thumbnailPath = path.join(thumbnailsDir, thumbnailFileName);
      
      // Handle custom thumbnail if provided
      if (customThumbnailFile) {
        console.log('Using custom thumbnail:', customThumbnailFile.originalFilename);
        console.log('Custom thumbnail details:', {
          originalFilename: customThumbnailFile.originalFilename,
          mimetype: customThumbnailFile.mimetype,
          size: customThumbnailFile.size,
          filepath: customThumbnailFile.filepath
        });
        
        // Get the original file extension for custom thumbnails
        const originalExt = path.extname(customThumbnailFile.originalFilename || '');
        const customThumbnailFileName = `${path.parse(fileName).name}${originalExt}`;
        const customThumbnailPath = path.join(thumbnailsDir, customThumbnailFileName);
        
        console.log('Moving custom thumbnail from', customThumbnailFile.filepath, 'to', customThumbnailPath);
        
        // Move custom thumbnail to thumbnails directory
        fs.renameSync(customThumbnailFile.filepath, customThumbnailPath);
        
        thumbnailUrl = `/uploads/thumbnails/${customThumbnailFileName}`;
        console.log('Custom thumbnail saved successfully:', thumbnailUrl);
      } else {
        console.log('No custom thumbnail provided, generating from video');
        // Try to generate thumbnail from video
        try {
          const generatedPath = await ThumbnailGenerator.generateThumbnail(filePath, thumbnailPath, {
            width: 320,
            height: 180,
            timeOffset: 1,
            quality: 80
          });
          
          // Determine the actual file extension that was created
          const actualFileName = path.basename(generatedPath);
          thumbnailUrl = `/uploads/thumbnails/${actualFileName}`;
          console.log('Auto-generated thumbnail saved successfully:', thumbnailUrl);
          
        } catch (thumbnailError) {
          console.warn('Thumbnail generation failed, creating placeholder:', thumbnailError);
          
          // Generate placeholder thumbnail with SVG extension
          const placeholderFileName = `${path.parse(fileName).name}.svg`;
          const placeholderPath = path.join(thumbnailsDir, placeholderFileName);
          await ThumbnailGenerator.generatePlaceholderThumbnail(placeholderPath, 320, 180);
          thumbnailUrl = `/uploads/thumbnails/${placeholderFileName}`;
        }
      }
      
      // Try to get video metadata
      try {
        const metadata = await ThumbnailGenerator.getVideoMetadata(filePath);
        duration = Math.floor(metadata.format.duration || 0);
        
        // Get resolution from video stream
        const videoStream = metadata.streams.find((stream: any) => stream.codec_type === 'video');
        if (videoStream && videoStream.width && videoStream.height) {
          resolution = `${videoStream.width}x${videoStream.height}`;
        }
        
        console.log('Video metadata extracted:', { duration, resolution });
      } catch (metadataError) {
        console.warn('Could not extract video metadata:', metadataError);
      }
      
    } catch (error) {
      console.error('Thumbnail processing error:', error);
      // Continue without thumbnail - will use placeholder in UI
    }

    // Create video record in database
    const video = await prisma.video.create({
      data: {
        channelId: channel.id,
        title: title.trim(),
        description: description.trim(),
        videoUrl: `/uploads/videos/${fileName}`, // Local file path for now
        thumbnailUrl: thumbnailUrl, // Generated thumbnail URL
        duration: duration,
        fileSize: BigInt(fileSize),
        resolution: resolution,
        privacy: privacy.toUpperCase() as VideoPrivacy,
        status: VideoStatus.PROCESSING,
        viewCount: BigInt(0),
        likeCount: 0,
        dislikeCount: 0,
        commentCount: 0,
        publishedAt: new Date(),
        metadata: JSON.stringify({
          originalFileName: videoFile.originalFilename,
          fileType: videoFile.mimetype,
          uploadDate: new Date().toISOString(),
          tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
        }),
        processingStatus: JSON.stringify({
          status: 'processing',
          progress: 0,
          startedAt: new Date().toISOString()
        })
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

    // Update channel video count
    await prisma.channel.update({
      where: { id: channel.id },
      data: { videoCount: { increment: 1 } }
    });

    // TODO: Queue video processing job
    // In production, this would:
    // 1. Generate thumbnails
    // 2. Create multiple resolutions
    // 3. Compress video
    // 4. Upload to cloud storage (S3, etc.)
    // 5. Update video status to 'READY'

    // For now, simulate processing completion
    setTimeout(() => {
      // Use a separate async function to handle the database update
      const updateVideoStatus = async () => {
        try {
          const prisma = await getInitializedPrisma();
          
          // If no thumbnail was generated initially, try to generate one now
          let finalThumbnailUrl = video.thumbnailUrl;
          if (!finalThumbnailUrl) {
            try {
              const thumbnailsDir = path.join(process.cwd(), 'uploads', 'thumbnails');
              const thumbnailFileName = `${path.parse(fileName).name}.svg`;
              const thumbnailPath = path.join(thumbnailsDir, thumbnailFileName);
              
              const generatedPath = await ThumbnailGenerator.generateThumbnail(filePath, thumbnailPath, {
                width: 320,
                height: 180,
                timeOffset: 1,
                quality: 80
              });
              
              // Determine the actual file extension that was created
              const actualFileName = path.basename(generatedPath);
              finalThumbnailUrl = `/uploads/thumbnails/${actualFileName}`;
              console.log('Thumbnail generated during processing:', finalThumbnailUrl);
            } catch (thumbnailError) {
              console.warn('Failed to generate thumbnail during processing, creating placeholder:', thumbnailError);
              
              // Create placeholder thumbnail
              const placeholderFileName = `${path.parse(fileName).name}.svg`;
              const placeholderPath = path.join(thumbnailsDir, placeholderFileName);
              await ThumbnailGenerator.generatePlaceholderThumbnail(placeholderPath, 320, 180);
              finalThumbnailUrl = `/uploads/thumbnails/${placeholderFileName}`;
            }
          }
          
          await prisma.video.update({
            where: { id: video.id },
            data: {
              status: VideoStatus.READY,
              thumbnailUrl: finalThumbnailUrl,
              processingStatus: JSON.stringify({
                status: 'completed',
                progress: 100,
                completedAt: new Date().toISOString()
              })
            }
          });
          console.log(`Video ${video.id} processing completed successfully`);
        } catch (error) {
          console.error('Error updating video status:', error);
        }
      };
      
      updateVideoStatus().catch(error => {
        console.error('Failed to update video status:', error);
      });
    }, 5000); // Simulate 5-second processing

    res.status(201).json({
      success: true,
      data: {
        video: {
          id: video.id,
          title: video.title,
          description: video.description,
          status: video.status,
          createdAt: video.createdAt,
          channel: video.channel
        }
      },
      message: 'Video uploaded successfully and is being processed'
    });

  } catch (error) {
    console.error('Video upload error:', error);
    
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      if (error.message.includes('File size') || error.message.includes('maxFileSize')) {
        return res.status(413).json({
          success: false,
          error: 'File too large. Maximum size is 500MB.'
        });
      }
      
      if (error.message.includes('File type') || error.message.includes('filter')) {
        return res.status(400).json({
          success: false,
          error: 'Invalid file type. Please upload a video file.'
        });
      }
      
      if (error.message.includes('ENOENT') || error.message.includes('no such file')) {
        return res.status(500).json({
          success: false,
          error: 'File system error. Please try again.'
        });
      }
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error. Please try again later.'
    });
  }
}
