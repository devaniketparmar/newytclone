import { NextApiRequest, NextApiResponse } from 'next';
import { JWTUtils } from '../utils/auth';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

export interface AuthenticatedRequest extends NextApiRequest {
  user: {
    id: string;
    email: string;
    username: string;
    role: 'user' | 'creator' | 'admin';
    sessionId: string;
  };
}

export interface AuthMiddlewareOptions {
  requireAuth?: boolean;
  requireRole?: 'user' | 'creator' | 'admin';
  allowExpired?: boolean;
}

export function withAuth(
  handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void> | void,
  options: AuthMiddlewareOptions = {}
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const { requireAuth = true, requireRole, allowExpired = false } = options;

    try {
      // Get token from cookie or Authorization header
      const token = req.cookies.token || req.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        if (requireAuth) {
          return res.status(401).json({
            success: false,
            error: 'Authentication required'
          });
        }
        // If auth is not required, continue without user
        return handler(req as AuthenticatedRequest, res);
      }

      // Verify token
      let decoded: Record<string, unknown> | null = null;
      try {
        decoded = JWTUtils.verifyToken(token);
      } catch (error) {
        if (allowExpired && JWTUtils.isTokenExpired(token)) {
          // Allow expired tokens for certain operations
          decoded = JWTUtils.decodeToken(token);
        } else {
          throw error;
        }
      }

      if (!decoded || !decoded.userId || typeof decoded.userId !== 'string') {
        if (requireAuth) {
          return res.status(401).json({
            success: false,
            error: 'Invalid token payload'
          });
        }
        return handler(req as AuthenticatedRequest, res);
      }

      // Get user from database to ensure they still exist and are active
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId as string },
        select: {
          id: true,
          email: true,
          username: true,
          status: true,
          verified: true,
          emailVerified: true
        }
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'User not found'
        });
      }

      if (user.status !== 'ACTIVE') {
        return res.status(403).json({
          success: false,
          error: 'Account is suspended or deleted'
        });
      }

      // Check role requirements
      if (requireRole && decoded.role !== requireRole) {
        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions'
        });
      }

      // Add user to request object
      (req as AuthenticatedRequest).user = {
        id: user.id,
        email: user.email,
        username: user.username,
        role: (decoded.role as 'user' | 'creator' | 'admin') || 'user',
        sessionId: (decoded.sessionId as string) || ''
      };

      return handler(req as AuthenticatedRequest, res);

    } catch (error) {
      console.error('Auth middleware error:', error);
      
      if (requireAuth) {
        return res.status(401).json({
          success: false,
          error: 'Invalid or expired token'
        });
      }
      
      // If auth is not required, continue without user
      return handler(req as AuthenticatedRequest, res);
    }
  };
}

// Optional auth middleware (doesn't require authentication)
export function withOptionalAuth(
  handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void> | void
) {
  return withAuth(handler, { requireAuth: false });
}

// Admin-only middleware
export function withAdminAuth(
  handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void> | void
) {
  return withAuth(handler, { requireRole: 'admin' });
}

// Creator-only middleware
export function withCreatorAuth(
  handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void> | void
) {
  return withAuth(handler, { requireRole: 'creator' });
}

// Rate limiting middleware
export function withRateLimit<T extends NextApiRequest = NextApiRequest>(
  handler: (req: T, res: NextApiResponse) => Promise<void> | void,
  options: {
    maxRequests?: number;
    windowMs?: number;
    keyGenerator?: (req: NextApiRequest) => string;
  } = {}
) {
  const { maxRequests = 100, windowMs = 15 * 60 * 1000, keyGenerator } = options;
  
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      // Generate rate limit key
      const key = keyGenerator ? keyGenerator(req) : `rate_limit:${req.connection.remoteAddress}`;
      
      // TODO: Implement rate limiting with Redis
      // const rateLimit = await checkRateLimit(key, maxRequests, windowMs);
      
      // For now, just continue
      return handler(req as T, res);
      
    } catch (error) {
      console.error('Rate limit middleware error:', error);
      return handler(req as T, res);
    }
  };
}

// CORS middleware
export function withCORS<T extends NextApiRequest = NextApiRequest>(
  handler: (req: T, res: NextApiResponse) => Promise<void> | void,
  options: {
    origin?: string | string[];
    methods?: string[];
    allowedHeaders?: string[];
  } = {}
) {
  const {
    origin = process.env.NEXTAUTH_URL || 'http://localhost:3000',
    methods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders = ['Content-Type', 'Authorization']
  } = options;

  return async (req: NextApiRequest, res: NextApiResponse) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', Array.isArray(origin) ? origin.join(', ') : origin);
    res.setHeader('Access-Control-Allow-Methods', methods.join(', '));
    res.setHeader('Access-Control-Allow-Headers', allowedHeaders.join(', '));
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    return handler(req as T, res);
  };
}

// Error handling middleware
export function withErrorHandling<T extends NextApiRequest = NextApiRequest>(
  handler: (req: T, res: NextApiResponse) => Promise<void> | void
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      await handler(req as T, res);
    } catch (error) {
      console.error('API Error:', error);
      
      // Don't expose internal errors in production
      const isDevelopment = process.env.NODE_ENV === 'development';
      
      res.status(500).json({
        success: false,
        error: isDevelopment ? (error as Error).message : 'Internal server error',
        ...(isDevelopment && { stack: (error as Error).stack })
      });
    }
  };
}

// Validation middleware
export function withValidation<T extends NextApiRequest = NextApiRequest>(
  handler: (req: T, res: NextApiResponse) => Promise<void> | void,
  schema: z.ZodSchema
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      // Validate request body
      const validationResult = schema.safeParse(req.body);
      
      if (!validationResult.success) {
        const errors = validationResult.error.issues.reduce((acc: Record<string, string>, error: z.ZodIssue) => {
          const path = error.path.join('.');
          acc[path] = error.message;
          return acc;
        }, {});

        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors
        });
      }

      // Replace body with validated data
      req.body = validationResult.data;
      
      return handler(req as T, res);
      
    } catch (error) {
      console.error('Validation middleware error:', error);
      res.status(500).json({
        success: false,
        error: 'Validation error'
      });
    }
  };
}

// Combined middleware helper
export function createApiHandler(
  handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void> | void,
  options: {
    auth?: AuthMiddlewareOptions;
    rateLimit?: {
      maxRequests?: number;
      windowMs?: number;
      keyGenerator?: (req: NextApiRequest) => string;
    };
    cors?: {
      origin?: string | string[];
      methods?: string[];
      allowedHeaders?: string[];
    };
    validation?: z.ZodSchema;
  } = {}
) {
  let wrappedHandler = handler;

  // Apply validation middleware
  if (options.validation) {
    wrappedHandler = withValidation(wrappedHandler, options.validation);
  }

  // Apply auth middleware
  if (options.auth) {
    wrappedHandler = withAuth(wrappedHandler, options.auth);
  }

  // Apply rate limiting middleware
  if (options.rateLimit) {
    wrappedHandler = withRateLimit(wrappedHandler, options.rateLimit);
  }

  // Apply CORS middleware
  if (options.cors) {
    wrappedHandler = withCORS(wrappedHandler, options.cors);
  }

  // Apply error handling middleware (always last)
  wrappedHandler = withErrorHandling(wrappedHandler);

  return wrappedHandler;
}
