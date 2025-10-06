import { NextApiRequest, NextApiResponse } from 'next';
import { getInitializedPrisma } from '@/lib/prisma';
import {
  PasswordUtils,
  JWTUtils,
  SessionUtils,
  TwoFactorUtils,
  RateLimitUtils,
  SanitizationUtils,
  ValidationUtils,
  ErrorUtils,
  loginSchema
} from '@/utils/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    return handleLogin(req, res);
  }
  
  res.setHeader('Allow', ['POST']);
  res.status(405).json({ success: false, error: 'Method not allowed' });
}

async function handleLogin(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Initialize database connection
    const prisma = await getInitializedPrisma();
    
    // Rate limiting
    const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
    const rateLimit = RateLimitUtils.checkRateLimit(`login:${clientIp}`, 10, 15 * 60 * 1000);
    
    if (!rateLimit.allowed) {
      return res.status(429).json({
        success: false,
        error: 'Too many login attempts. Please try again later.',
        retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000)
      });
    }

    // Validate input
    const validationResult = loginSchema.safeParse(req.body);
    if (!validationResult.success) {
      const errors = ErrorUtils.formatValidationErrors(validationResult.error);
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors
      });
    }

    const { email, password, rememberMe } = validationResult.data;

    // Sanitize email
    const sanitizedEmail = SanitizationUtils.sanitizeEmail(email);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: sanitizedEmail },
      select: {
        id: true,
        email: true,
        username: true,
        passwordHash: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        verified: true,
        emailVerified: true,
        twoFactorEnabled: true,
        twoFactorSecret: true,
        status: true,
        createdAt: true,
        lastLogin: true
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Check account status
    if (user.status !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        error: 'Account is suspended or deleted'
      });
    }

    // Verify password
    const isPasswordValid = await PasswordUtils.verify(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Check if 2FA is enabled
    if (user.twoFactorEnabled) {
      // Return 2FA required response
      return res.status(200).json({
        success: true,
        requires2FA: true,
        message: 'Two-factor authentication required',
        tempToken: JWTUtils.generateToken({
          userId: user.id,
          email: user.email,
          username: user.username,
          role: 'user',
          requires2FA: true
        }, '5m')
      });
    }

    // Create session
    const { sessionId, expiresAt } = SessionUtils.createSession(user.id, rememberMe);

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });

    // Generate tokens
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      username: user.username,
      role: 'user' as const,
      sessionId
    };

    const token = JWTUtils.generateToken(tokenPayload);
    const refreshToken = JWTUtils.generateRefreshToken(tokenPayload);

    // Set HTTP-only cookies
    const cookieOptions = [
      'HttpOnly',
      'Secure',
      'SameSite=Strict'
    ];

    if (rememberMe) {
      cookieOptions.push(`Max-Age=${30 * 24 * 60 * 60}`); // 30 days
    } else {
      cookieOptions.push(`Max-Age=${24 * 60 * 60}`); // 24 hours
    }

    res.setHeader('Set-Cookie', [
      `token=${token}; ${cookieOptions.join('; ')}; Path=/`,
      `refreshToken=${refreshToken}; ${cookieOptions.join('; ')}; Path=/`
    ]);

    // Reset rate limit on successful login
    RateLimitUtils.resetRateLimit(`login:${clientIp}`);

    // Return user data (excluding sensitive fields)
    const { passwordHash, twoFactorSecret, ...userData } = user;

    res.status(200).json({
      success: true,
      data: {
        user: userData,
        token,
        refreshToken,
        sessionId,
        expiresAt
      },
      message: 'Login successful'
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error. Please try again later.'
    });
  }
}

// 2FA verification endpoint
export async function handle2FAVerification(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Initialize database connection
    const prisma = await getInitializedPrisma();
    
    const { tempToken, code } = req.body;

    if (!tempToken || !code) {
      return res.status(400).json({
        success: false,
        error: 'Temporary token and 2FA code are required'
      });
    }

    // Verify temp token
    const decoded = JWTUtils.verifyToken(tempToken);
    if (!decoded.requires2FA || !decoded.userId) {
      return res.status(400).json({
        success: false,
        error: 'Invalid temporary token'
      });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        verified: true,
        emailVerified: true,
        twoFactorEnabled: true,
        twoFactorSecret: true,
        status: true,
        createdAt: true
      }
    });

    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      return res.status(400).json({
        success: false,
        error: 'Two-factor authentication not enabled'
      });
    }

    // Verify 2FA code
    const isCodeValid = TwoFactorUtils.verifyTOTPCode(user.twoFactorSecret, code);
    if (!isCodeValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid 2FA code'
      });
    }

    // Create session
    const { sessionId, expiresAt } = SessionUtils.createSession(user.id, false);

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });

    // Generate final tokens
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      username: user.username,
      role: 'user' as const,
      sessionId
    };

    const token = JWTUtils.generateToken(tokenPayload);
    const refreshToken = JWTUtils.generateRefreshToken(tokenPayload);

    // Set cookies
    res.setHeader('Set-Cookie', [
      `token=${token}; HttpOnly; Secure; SameSite=Strict; Max-Age=${24 * 60 * 60}; Path=/`,
      `refreshToken=${refreshToken}; HttpOnly; Secure; SameSite=Strict; Max-Age=${30 * 24 * 60 * 60}; Path=/`
    ]);

    res.status(200).json({
      success: true,
      data: {
        user,
        token,
        refreshToken,
        sessionId,
        expiresAt
      },
      message: '2FA verification successful'
    });

  } catch (error) {
    console.error('2FA verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error. Please try again later.'
    });
  }
}
