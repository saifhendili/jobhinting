import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware, requireRole } from '@/lib/auth';
import { queueService } from '@/services/queue/queue.service';

export async function POST(request: NextRequest) {
  const auth = await requireRole(request, ['ADMIN']);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const { companyId, enrichType } = body;

    if (!companyId || !enrichType) {
      return NextResponse.json(
        { error: 'companyId and enrichType are required' },
        { status: 400 }
      );
    }

    const job = await queueService.addEnrichmentJob({ companyId, enrichType });

    return NextResponse.json({
      message: 'Enrichment job queued',
      jobId: job.id,
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
