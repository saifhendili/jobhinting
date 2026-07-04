import { Queue } from 'bullmq';
import { createBullMQConnection } from '@/lib/redis';
import { logger } from '@/lib/logger';
import cron from 'node-cron';

const bullMQConnection = createBullMQConnection();
// @ts-ignore - ioredis version mismatch
const scrapeQueue = new Queue('scrape-queue', { connection: bullMQConnection });

// Schedule daily scrapes at 2 AM
export function startScheduler() {
  logger.info('Starting scheduler');

  // Daily scrape of all sources
  cron.schedule('0 2 * * *', async () => {
    logger.info('Running scheduled daily scrape');
    
    const sources = [
      'RemoteOK', 'WeWorkRemotely', 'Himalayas', 'Greenhouse', 'Lever',
    ];

    for (const source of sources) {
      await scrapeQueue.add(`scheduled-${source}`, {
        source,
        options: { enrich: true },
      }, {
        priority: 5,
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
      });
    }
  });

  // Weekly deep scrape on Sundays at 3 AM
  cron.schedule('0 3 * * 0', async () => {
    logger.info('Running scheduled weekly deep scrape');
    
    const sources = [
      'Indeed', 'LinkedIn', 'GoogleJobs', 'ZipRecruiter', 'Glassdoor',
    ];

    for (const source of sources) {
      await scrapeQueue.add(`weekly-${source}`, {
        source,
        options: { enrich: true, maxPages: 20 },
      }, {
        priority: 3,
        attempts: 2,
        backoff: { type: 'exponential', delay: 10000 },
      });
    }
  });

  logger.info('Scheduler started successfully');
}
