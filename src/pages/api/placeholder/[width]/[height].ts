import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { width, height } = req.query;
    
    // Validate parameters
    const w = parseInt(width as string, 10);
    const h = parseInt(height as string, 10);
    
    if (isNaN(w) || isNaN(h) || w <= 0 || h <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid width or height' });
    }
    
    // Limit maximum size for security
    if (w > 2000 || h > 2000) {
      return res.status(400).json({ success: false, error: 'Maximum size is 2000x2000' });
    }

    // Generate SVG placeholder
    const svg = `
      <svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#f3f4f6;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#e5e7eb;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#grad)"/>
        <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${Math.min(w, h) * 0.1}" 
              text-anchor="middle" dominant-baseline="middle" fill="#9ca3af">
          ${w} × ${h}
        </text>
      </svg>
    `;

    // Set appropriate headers
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
    res.setHeader('Content-Length', Buffer.byteLength(svg));
    
    res.status(200).send(svg);

  } catch (error) {
    console.error('Placeholder generation error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}
