import { NextApiRequest, NextApiResponse } from 'next';
import { getInitializedPrisma } from '@/lib/prisma';
import { JWTUtils } from '@/utils/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    return handleLogout(req, res);
  }
  
  res.setHeader('Allow', ['POST']);
  res.status(405).json({ success: false, error: 'Method not allowed' });
}

async function handleLogout(req: NextApiRequest, res: NextApiResponse) {
  try {
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

    // TODO: Invalidate session in database
    // For now, we'll just clear the cookies
    
    // Clear HTTP-only cookies
    const isProduction = process.env.NODE_ENV === 'production';
    const secureFlag = isProduction ? 'Secure' : '';
    const sameSiteFlag = isProduction ? 'SameSite=Strict' : 'SameSite=Lax';
    
    res.setHeader('Set-Cookie', [
      `token=; HttpOnly; ${secureFlag}; ${sameSiteFlag}; Max-Age=0; Path=/`,
      `refreshToken=; HttpOnly; ${secureFlag}; ${sameSiteFlag}; Max-Age=0; Path=/`
    ]);

    res.status(200).json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error. Please try again later.'
    });
  }
}