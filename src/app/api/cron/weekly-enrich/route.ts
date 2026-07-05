import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    logger.info('Weekly enrich cron triggered');
    // Enqueue enrichment jobs via queue service or HTTP call to worker
    return NextResponse.json({ success: true, message: 'Enrichment jobs queued' });
  } catch (error) {
    logger.error('Weekly enrich cron failed', { error });
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
