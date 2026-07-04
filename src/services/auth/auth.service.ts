import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'default-secret-change-me');
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
const REFRESH_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  async generateTokens(userId: string, email: string, role: string): Promise<AuthTokens> {
    const accessToken = await new SignJWT({ userId, email, role })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(JWT_EXPIRES_IN)
      .sign(JWT_SECRET);

    const refreshToken = await new SignJWT({ userId, type: 'refresh' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(REFRESH_EXPIRES_IN)
      .sign(JWT_SECRET);

    return { accessToken, refreshToken };
  }

  async verifyRefreshToken(token: string) {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET, { clockTolerance: 60 });
      if (payload.type !== 'refresh') return null;
      return payload.userId as string;
    } catch {
      return null;
    }
  }

  async register(name: string, email: string, password: string) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new Error('User already exists');
    }

    const hashedPassword = await this.hashPassword(password);
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword },
      select: { id: true, email: true, name: true, role: true },
    });

    logger.info('User registered', { userId: user.id, email: user.email });
    return user;
  }

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const valid = await this.verifyPassword(password, user.password);
    if (!valid) {
      throw new Error('Invalid credentials');
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    logger.info('User logged in', { userId: user.id });

    return {
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      tokens,
    };
  }

  async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    const userId = await this.verifyRefreshToken(refreshToken);
    if (!userId) {
      throw new Error('Invalid refresh token');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return this.generateTokens(user.id, user.email, user.role);
  }
}

export const authService = new AuthService();
