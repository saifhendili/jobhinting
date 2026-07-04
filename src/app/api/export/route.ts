import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/lib/auth';
import { queueService } from '@/services/queue/queue.service';
import { exportRequestSchema } from '@/lib/validation';
import { verifyToken, getTokenFromRequest } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const auth = await authMiddleware(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const result = exportRequestSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const token = getTokenFromRequest(request);
    const payload = token ? await verifyToken(token) : null;

    const job = await queueService.addExportJob({
      ...result.data,
      userId: payload?.userId || 'unknown',
    });

    return NextResponse.json({
      message: 'Export job queued',
      jobId: job.id,
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
