import { NextApiRequest, NextApiResponse } from 'next';
import { getInitializedPrisma } from '../lib/prisma';

// Middleware to ensure database is initialized before API routes
export function withDatabase(handler: (req: NextApiRequest, res: NextApiResponse, prisma: any) => Promise<void>) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      // Initialize database connection
      const prisma = await getInitializedPrisma();
      
      // Call the original handler with prisma instance
      return await handler(req, res, prisma);
    } catch (error) {
      console.error('Database middleware error:', error);
      return res.status(500).json({
        success: false,
        error: 'Database initialization failed'
      });
    }
  };
}

// Health check endpoint
export async function healthCheck(req: NextApiRequest, res: NextApiResponse) {
  try {
    const prisma = await getInitializedPrisma();
    
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    
    res.status(200).json({
      success: true,
      message: 'Database is healthy',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({
      success: false,
      error: 'Database health check failed',
      timestamp: new Date().toISOString()
    });
  }
}
