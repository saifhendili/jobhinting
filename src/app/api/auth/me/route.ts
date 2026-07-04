import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const result = await authMiddleware(request);
  if (result instanceof NextResponse) return result;

  return NextResponse.json({ user: result });
}
