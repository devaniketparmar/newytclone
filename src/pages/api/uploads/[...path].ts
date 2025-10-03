import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import { getInitializedPrisma } from '../../../lib/prisma';
import { JWTUtils } from '../../../utils/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { path: pathSegments } = req.query;
    
    if (!pathSegments || !Array.isArray(pathSegments) || pathSegments.length === 0) {
      return res.status(400).json({ success: false, error: 'Invalid file path' });
    }

    // Join the path segments to create the full file path
    const filePath = pathSegments.join('/');
    console.log('Requested file path:', filePath);

    // For now, make file serving public (in production, you might want to add authentication)
    // Get token from Authorization header or cookies (optional)
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '') || req.cookies.token;
    
    // Optional authentication - if token is provided, verify it
    let decoded = null;
    if (token) {
      try {
        decoded = JWTUtils.verifyToken(token);
      } catch (error) {
        console.log('Token verification failed:', error);
        // Continue without authentication for public file serving
      }
    }

    // Construct the full file path
    const fullPath = path.join(process.cwd(), 'uploads', filePath);
    console.log('Full file path:', fullPath);
    
    // Security check: ensure the path is within uploads directory
    const uploadsDir = path.join(process.cwd(), 'uploads');
    console.log('Uploads directory:', uploadsDir);
    
    if (!fullPath.startsWith(uploadsDir)) {
      console.log('Security check failed: path outside uploads directory');
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    // Check if file exists
    console.log('Checking if file exists:', fullPath);
    if (!fs.existsSync(fullPath)) {
      console.log('File does not exist');
      return res.status(404).json({ success: false, error: 'File not found' });
    }

    // Get file stats
    const stats = fs.statSync(fullPath);
    
    // Set appropriate headers
    const ext = path.extname(fullPath).toLowerCase();
    const mimeTypes: { [key: string]: string } = {
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
      '.ogg': 'video/ogg',
      '.avi': 'video/avi',
      '.mov': 'video/quicktime',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.webp': 'image/webp',
    };

    const mimeType = mimeTypes[ext] || 'application/octet-stream';
    
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Length', stats.size);
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
    res.setHeader('Access-Control-Allow-Origin', '*'); // Allow CORS for images
    
    // Handle range requests for video streaming
    const range = req.headers.range;
    if (range && mimeType.startsWith('video/')) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : stats.size - 1;
      const chunksize = (end - start) + 1;
      
      res.status(206);
      res.setHeader('Content-Range', `bytes ${start}-${end}/${stats.size}`);
      res.setHeader('Content-Length', chunksize);
      
      const stream = fs.createReadStream(fullPath, { start, end });
      stream.pipe(res);
    } else {
      // Send entire file
      const stream = fs.createReadStream(fullPath);
      stream.pipe(res);
    }

  } catch (error) {
    console.error('File serving error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}
