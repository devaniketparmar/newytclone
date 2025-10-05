import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

// Password validation schema
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
    'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character');

// Email validation schema
export const emailSchema = z
  .string()
  .email('Invalid email address')
  .min(1, 'Email is required');

// Username validation schema
export const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(30, 'Username must be less than 30 characters')
  .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores');

// Registration validation schema
export const registerSchema = z.object({
  email: emailSchema,
  username: usernameSchema,
  password: passwordSchema,
  firstName: z.string().min(1, 'First name is required').max(50, 'First name is too long'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name is too long'),
  agreeToTerms: z.boolean().refine(val => val === true, 'You must agree to the terms and conditions')
});

// Login validation schema
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional()
});

// Password reset validation schema
export const passwordResetSchema = z.object({
  email: emailSchema
});

// Password reset confirm validation schema
export const passwordResetConfirmSchema = z.object({
  password: passwordSchema,
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

// Password hashing utilities
export class PasswordUtils {
  private static readonly SALT_ROUNDS = 12;

  static async hash(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  static async verify(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  static validate(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (!/[@$!%*?&]/.test(password)) {
      errors.push('Password must contain at least one special character (@$!%*?&)');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// JWT utilities
export class JWTUtils {
  private static readonly SECRET = process.env.JWT_SECRET || 'fallback-secret';
  private static readonly EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
  private static readonly REFRESH_EXPIRES_IN = '30d';

  static generateToken(payload: Record<string, unknown>, customExpiresIn?: string): string {
    const expiresIn = customExpiresIn || this.EXPIRES_IN;
    return jwt.sign(payload, this.SECRET, {
      expiresIn,
      issuer: 'youtube-clone',
      audience: 'youtube-clone-users'
    } as any);
  }

  static generateRefreshToken(payload: Record<string, unknown>): string {
    return jwt.sign(payload, this.SECRET, {
      expiresIn: this.REFRESH_EXPIRES_IN,
      issuer: 'youtube-clone',
      audience: 'youtube-clone-users'
    } as any);
  }

  static verifyToken(token: string): Record<string, unknown> {
    try {
      const options: jwt.VerifyOptions = {
        issuer: 'youtube-clone',
        audience: 'youtube-clone-users'
      };
      return jwt.verify(token, this.SECRET, options) as Record<string, unknown>;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  static decodeToken(token: string): Record<string, unknown> | null {
    return jwt.decode(token);
  }

  static isTokenExpired(token: string): boolean {
    try {
      const decoded = this.decodeToken(token);
      if (!decoded || !decoded.exp) return true;
      
      const currentTime = Math.floor(Date.now() / 1000);
      return decoded.exp < currentTime;
    } catch {
      return true;
    }
  }
}

// Session utilities
export class SessionUtils {
  static generateSessionId(): string {
    return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  static createSession(userId: string, rememberMe: boolean = false): {
    sessionId: string;
    expiresAt: Date;
  } {
    const sessionId = this.generateSessionId();
    const expiresAt = new Date();
    
    // Set expiration based on remember me option
    if (rememberMe) {
      expiresAt.setDate(expiresAt.getDate() + 30); // 30 days
    } else {
      expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours
    }
    
    return { sessionId, expiresAt };
  }

  static isSessionExpired(expiresAt: Date): boolean {
    return new Date() > expiresAt;
  }
}

// Email verification utilities
export class EmailVerificationUtils {
  static generateVerificationToken(): string {
    return `verify_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  static generateVerificationUrl(token: string): string {
    const baseUrl = process.env.NEXTAUTH_URL || process.env.BASE_URL || 'http://localhost:3000';
    return `${baseUrl}/auth/verify-email?token=${token}`;
  }

  static isVerificationTokenExpired(createdAt: Date): boolean {
    const expirationTime = 24 * 60 * 60 * 1000; // 24 hours
    return Date.now() - createdAt.getTime() > expirationTime;
  }
}

// Password reset utilities
export class PasswordResetUtils {
  static generateResetToken(): string {
    return `reset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  static generateResetUrl(token: string): string {
    const baseUrl = process.env.NEXTAUTH_URL || process.env.BASE_URL || 'http://localhost:3000';
    return `${baseUrl}/auth/reset-password?token=${token}`;
  }

  static isResetTokenExpired(createdAt: Date): boolean {
    const expirationTime = 60 * 60 * 1000; // 1 hour
    return Date.now() - createdAt.getTime() > expirationTime;
  }
}

// Two-factor authentication utilities
export class TwoFactorUtils {
  static generateSecret(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let secret = '';
    for (let i = 0; i < 32; i++) {
      secret += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return secret;
  }

  static generateQRCode(userEmail: string, secret: string): string {
    const issuer = 'YouTube Clone';
    const accountName = userEmail;
    const qrCodeUrl = `otpauth://totp/${issuer}:${accountName}?secret=${secret}&issuer=${issuer}`;
    return qrCodeUrl;
  }

  static generateTOTPCode(secret: string): string {
    // This is a simplified implementation
    // In production, use a proper TOTP library like 'otplib'
    const time = Math.floor(Date.now() / 1000 / 30);
    const hash = this.hmacSha1(secret, this.intToBytes(time));
    const offset = hash[hash.length - 1] & 0xf;
    const code = ((hash[offset] & 0x7f) << 24) |
                 ((hash[offset + 1] & 0xff) << 16) |
                 ((hash[offset + 2] & 0xff) << 8) |
                 (hash[offset + 3] & 0xff);
    return (code % 1000000).toString().padStart(6, '0');
  }

  static verifyTOTPCode(secret: string, code: string): boolean {
    const generatedCode = this.generateTOTPCode(secret);
    return generatedCode === code;
  }

  private static hmacSha1(key: string, data: Buffer): Buffer {
    // Simplified HMAC-SHA1 implementation
    // In production, use crypto.createHmac('sha1', key).update(data).digest()
    return Buffer.from('mock-hmac-sha1-result');
  }

  private static intToBytes(value: number): Buffer {
    const buffer = Buffer.allocUnsafe(8);
    buffer.writeBigUInt64BE(BigInt(value), 0);
    return buffer;
  }
}

// Rate limiting utilities
export class RateLimitUtils {
  private static attempts: Map<string, { count: number; resetTime: number }> = new Map();
  
  static checkRateLimit(identifier: string, maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000): {
    allowed: boolean;
    remaining: number;
    resetTime: number;
  } {
    const now = Date.now();
    const key = identifier;
    const attempt = this.attempts.get(key);
    
    if (!attempt || now > attempt.resetTime) {
      // Reset or create new attempt record
      this.attempts.set(key, {
        count: 1,
        resetTime: now + windowMs
      });
      
      return {
        allowed: true,
        remaining: maxAttempts - 1,
        resetTime: now + windowMs
      };
    }
    
    if (attempt.count >= maxAttempts) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: attempt.resetTime
      };
    }
    
    attempt.count++;
    
    return {
      allowed: true,
      remaining: maxAttempts - attempt.count,
      resetTime: attempt.resetTime
    };
  }
  
  static resetRateLimit(identifier: string): void {
    this.attempts.delete(identifier);
  }
}

// Input sanitization utilities
export class SanitizationUtils {
  static sanitizeString(input: string): string {
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, ''); // Remove event handlers
  }

  static sanitizeEmail(email: string): string {
    return email.toLowerCase().trim();
  }

  static sanitizeUsername(username: string): string {
    return username.toLowerCase().trim().replace(/[^a-z0-9_]/g, '');
  }

  static sanitizeHtml(html: string): string {
    // Basic HTML sanitization - in production, use a proper library like DOMPurify
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
  }
}

// Validation utilities
export class ValidationUtils {
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static validateUsername(username: string): boolean {
    const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
    return usernameRegex.test(username);
  }

  static validatePassword(password: string): boolean {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  }

  static validateUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}

// Error handling utilities
export class ErrorUtils {
  static createError(message: string, code: string = 'UNKNOWN_ERROR', statusCode: number = 500): Error & { code: string; statusCode: number } {
    const error = new Error(message) as Error & { code: string; statusCode: number };
    error.code = code;
    error.statusCode = statusCode;
    return error;
  }

  static isValidationError(error: unknown): error is z.ZodError {
    return error instanceof z.ZodError;
  }

  static formatValidationErrors(error: z.ZodError): Record<string, string> {
    const formattedErrors: Record<string, string> = {};
    
    if (error && error.errors && Array.isArray(error.errors)) {
      error.errors.forEach((err) => {
        const path = err.path.join('.');
        formattedErrors[path] = err.message;
      });
    }
    
    return formattedErrors;
  }
}
