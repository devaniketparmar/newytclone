import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';

export interface ThumbnailOptions {
  width?: number;
  height?: number;
  timeOffset?: number; // Time in seconds to capture thumbnail
  quality?: number; // JPEG quality 1-100
}

export class ThumbnailGenerator {
  /**
   * Generate thumbnail from video file
   * @param videoPath - Path to the video file
   * @param outputPath - Path where thumbnail should be saved
   * @param options - Thumbnail generation options
   */
  static async generateThumbnail(
    videoPath: string,
    outputPath: string,
    options: ThumbnailOptions = {}
  ): Promise<string> {
    const {
      width = 320,
      height = 180,
      timeOffset = 1, // Capture at 1 second by default
      quality = 80
    } = options;

    return new Promise((resolve, reject) => {
      // Ensure output directory exists
      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Check if FFmpeg is available
      const { exec } = require('child_process');
      exec('which ffmpeg', (error: any) => {
        if (error) {
          console.log('FFmpeg not available, generating enhanced placeholder instead');
          // Generate enhanced placeholder instead
          this.generatePlaceholderThumbnail(outputPath, width, height)
            .then(resolve)
            .catch(reject);
          return;
        }

        // FFmpeg is available, proceed with normal generation
        // Convert SVG path to PNG for FFmpeg output
        const pngPath = outputPath.replace(/\.svg$/, '.png');
        
        ffmpeg(videoPath)
          .screenshots({
            timestamps: [timeOffset],
            filename: path.basename(pngPath),
            folder: outputDir,
            size: `${width}x${height}`,
            quality: quality
          })
          .on('end', () => {
            console.log('Thumbnail generated successfully:', pngPath);
            resolve(pngPath);
          })
          .on('error', (err) => {
            console.error('Thumbnail generation error:', err);
            // Fallback to enhanced placeholder
            this.generatePlaceholderThumbnail(outputPath, width, height)
              .then(resolve)
              .catch(reject);
          });
      });
    });
  }

  /**
   * Generate multiple thumbnails at different time points
   * @param videoPath - Path to the video file
   * @param outputDir - Directory where thumbnails should be saved
   * @param count - Number of thumbnails to generate
   * @param options - Thumbnail generation options
   */
  static async generateMultipleThumbnails(
    videoPath: string,
    outputDir: string,
    count: number = 3,
    options: ThumbnailOptions = {}
  ): Promise<string[]> {
    const {
      width = 320,
      height = 180,
      quality = 80
    } = options;

    return new Promise((resolve, reject) => {
      // Ensure output directory exists
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Get video duration first
      ffmpeg.ffprobe(videoPath, (err, metadata) => {
        if (err) {
          reject(err);
          return;
        }

        const duration = metadata.format.duration || 0;
        const interval = duration / (count + 1); // Distribute thumbnails evenly
        
        const timestamps: number[] = [];
        for (let i = 1; i <= count; i++) {
          timestamps.push(interval * i);
        }

        ffmpeg(videoPath)
          .screenshots({
            timestamps: timestamps,
            filename: 'thumb_%s.png',
            folder: outputDir,
            size: `${width}x${height}`,
            quality: quality
          })
          .on('end', () => {
            const thumbnailPaths = timestamps.map((timestamp, index) => 
              path.join(outputDir, `thumb_${timestamp}.png`)
            );
            console.log('Multiple thumbnails generated:', thumbnailPaths);
            resolve(thumbnailPaths);
          })
          .on('error', (err) => {
            console.error('Multiple thumbnail generation error:', err);
            reject(err);
          });
      });
    });
  }

  /**
   * Get video metadata (duration, resolution, etc.)
   * @param videoPath - Path to the video file
   */
  static async getVideoMetadata(videoPath: string): Promise<any> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(videoPath, (err, metadata) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(metadata);
      });
    });
  }

  /**
   * Generate a simple placeholder thumbnail when video processing fails
   * @param outputPath - Path where placeholder should be saved
   * @param width - Thumbnail width
   * @param height - Thumbnail height
   */
  static async generatePlaceholderThumbnail(
    outputPath: string,
    width: number = 320,
    height: number = 180
  ): Promise<string> {
    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Create a more visually appealing placeholder
    const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
            <stop offset="50%" style="stop-color:#764ba2;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#f093fb;stop-opacity:1" />
          </linearGradient>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="rgba(0,0,0,0.3)"/>
          </filter>
        </defs>
        <rect width="100%" height="100%" fill="url(#grad)"/>
        
        <!-- Play button background -->
        <circle cx="${width/2}" cy="${height/2}" r="${Math.min(width, height) * 0.18}" 
                fill="white" opacity="0.95" filter="url(#shadow)"/>
        
        <!-- Play icon -->
        <polygon points="${width/2 - 8},${height/2 - 12} ${width/2 - 8},${height/2 + 12} ${width/2 + 16},${height/2}" 
                 fill="#667eea"/>
        
        <!-- Video icon in corner -->
        <rect x="${width - 40}" y="10" width="30" height="20" rx="3" fill="rgba(0,0,0,0.7)"/>
        <polygon points="${width - 35},${height/2 - 5} ${width - 35},${height/2 + 5} ${width - 25},${height/2}" 
                 fill="white"/>
        
        <!-- Title area -->
        <rect x="0" y="${height - 40}" width="100%" height="40" fill="rgba(0,0,0,0.6)"/>
        <text x="50%" y="${height - 15}" font-family="Arial, sans-serif" font-size="${Math.min(width, height) * 0.06}" 
              text-anchor="middle" fill="white" font-weight="bold">
          Video Thumbnail
        </text>
      </svg>
    `;

    // Write SVG file with proper extension
    const svgPath = outputPath.replace(/\.(png|jpg|jpeg)$/, '.svg');
    fs.writeFileSync(svgPath, svg);
    
    console.log('Enhanced placeholder thumbnail generated:', svgPath);
    return svgPath;
  }
}
