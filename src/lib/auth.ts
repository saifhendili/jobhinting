import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'default-secret-change-me');

export interface AuthTokenPayload {
  userId: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

export async function verifyToken(token: string): Promise<AuthTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, { clockTolerance: 60 });
    return payload as unknown as AuthTokenPayload;
  } catch {
    return null;
  }
}

export function getTokenFromRequest(req: NextRequest): string | null {
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  const cookieToken = req.cookies.get('token')?.value;
  if (cookieToken) return cookieToken;
  return null;
}

export async function authMiddleware(req: NextRequest) {
  const token = getTokenFromRequest(req);
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const payload = await verifyToken(token);
  if (!payload) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
  }
  return payload;
}

export async function requireRole(req: NextRequest, roles: string[]) {
  const result = await authMiddleware(req);
  if (result instanceof NextResponse) return result;
  if (!roles.includes(result.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return result;
}
