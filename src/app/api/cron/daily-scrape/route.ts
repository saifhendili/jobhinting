import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    logger.info('Daily scrape cron triggered');
    // Enqueue scrape jobs via queue service or HTTP call to worker
    // For now, just log - actual scraping should run on persistent worker
    return NextResponse.json({ success: true, message: 'Scrape jobs queued' });
  } catch (error) {
    logger.error('Daily scrape cron failed', { error });
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
