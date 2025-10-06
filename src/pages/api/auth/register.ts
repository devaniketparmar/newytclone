import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { getInitializedPrisma } from '@/lib/prisma';
import {
  PasswordUtils,
  JWTUtils,
  SessionUtils,
  EmailVerificationUtils,
  PasswordResetUtils,
  TwoFactorUtils,
  RateLimitUtils,
  SanitizationUtils,
  ValidationUtils,
  ErrorUtils,
  registerSchema,
  loginSchema,
  passwordResetSchema,
  passwordResetConfirmSchema
} from '@/utils/auth';

// Register endpoint
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    return handleRegister(req, res);
  }
  
  res.setHeader('Allow', ['POST']);
  res.status(405).json({ success: false, error: 'Method not allowed' });
}

async function handleRegister(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Initialize database connection
    const prisma = await getInitializedPrisma();
    
    // Rate limiting
    const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
    const rateLimit = RateLimitUtils.checkRateLimit(`register:${clientIp}`, 5, 15 * 60 * 1000);
    
    if (!rateLimit.allowed) {
      return res.status(429).json({
        success: false,
        error: 'Too many registration attempts. Please try again later.',
        retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000)
      });
    }

    // Validate input
    const validationResult = registerSchema.safeParse(req.body);
    if (!validationResult.success) {
      const errors = ErrorUtils.formatValidationErrors(validationResult.error);
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors
      });
    }

    const { email, username, password, firstName, lastName } = validationResult.data;

    // Sanitize inputs
    const sanitizedEmail = SanitizationUtils.sanitizeEmail(email);
    const sanitizedUsername = SanitizationUtils.sanitizeUsername(username);
    const sanitizedFirstName = SanitizationUtils.sanitizeString(firstName);
    const sanitizedLastName = SanitizationUtils.sanitizeString(lastName);

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: sanitizedEmail },
          { username: sanitizedUsername }
        ]
      }
    });

    if (existingUser) {
      if (existingUser.email === sanitizedEmail) {
        return res.status(409).json({
          success: false,
          error: 'An account with this email already exists'
        });
      }
      if (existingUser.username === sanitizedUsername) {
        return res.status(409).json({
          success: false,
          error: 'Username is already taken'
        });
      }
    }

    // Hash password
    const passwordHash = await PasswordUtils.hash(password);

    // Generate email verification token
    const verificationToken = EmailVerificationUtils.generateVerificationToken();

    // Create user
    const user = await prisma.user.create({
      data: {
        email: sanitizedEmail,
        username: sanitizedUsername,
        passwordHash,
        firstName: sanitizedFirstName,
        lastName: sanitizedLastName,
        emailVerified: false,
        status: 'ACTIVE'
      },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        verified: true,
        emailVerified: true,
        createdAt: true,
        status: true
      }
    });

    // Create default channel
    await prisma.channel.create({
      data: {
        userId: user.id,
        name: `${sanitizedFirstName} ${sanitizedLastName}`.trim() || sanitizedUsername,
        description: `Welcome to ${sanitizedUsername}'s channel!`,
        avatarUrl: '/uploads/thumbnails/test-avatar.svg' // Default avatar
      }
    });

    // Generate JWT token
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      username: user.username,
      role: 'user' as const,
      sessionId: SessionUtils.generateSessionId()
    };

    const token = JWTUtils.generateToken(tokenPayload);
    const refreshToken = JWTUtils.generateRefreshToken(tokenPayload);

    // TODO: Send verification email
    // await sendVerificationEmail(user.email, verificationToken);

    // Set HTTP-only cookie
    res.setHeader('Set-Cookie', [
      `token=${token}; HttpOnly; Secure; SameSite=Strict; Max-Age=${7 * 24 * 60 * 60}; Path=/`,
      `refreshToken=${refreshToken}; HttpOnly; Secure; SameSite=Strict; Max-Age=${30 * 24 * 60 * 60}; Path=/`
    ]);

    // Reset rate limit on successful registration
    RateLimitUtils.resetRateLimit(`register:${clientIp}`);

    res.status(201).json({
      success: true,
      data: {
        user,
        token,
        refreshToken
      },
      message: 'Account created successfully. Please check your email to verify your account.'
    });

  } catch (error) {
    console.error('Registration error:', error);
    
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return res.status(409).json({
        success: false,
        error: 'An account with this email or username already exists'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error. Please try again later.'
    });
  }
}
