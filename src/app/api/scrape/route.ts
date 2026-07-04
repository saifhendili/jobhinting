import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware, requireRole } from '@/lib/auth';
import { queueService } from '@/services/queue/queue.service';
import { scrapeRequestSchema } from '@/lib/validation';

export async function POST(request: NextRequest) {
  const auth = await requireRole(request, ['ADMIN']);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const result = scrapeRequestSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const jobs = await Promise.all(
      result.data.sources.map(source =>
        queueService.addScrapeJob({ source, options: result.data.options })
      )
    );

    return NextResponse.json({
      message: 'Scrape jobs queued',
      jobs: jobs.map(j => ({ id: j.id, name: j.name })),
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
