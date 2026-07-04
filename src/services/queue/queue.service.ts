import { Queue } from 'bullmq';
import { createBullMQConnection } from '@/lib/redis';
import { logger } from '@/lib/logger';

const bullMQConnection = createBullMQConnection();

const SCRAPE_QUEUE_NAME = 'scrape-queue';
const EXPORT_QUEUE_NAME = 'export-queue';
const ENRICHMENT_QUEUE_NAME = 'enrichment-queue';

export interface ScrapeJobData {
  source: string;
  options?: {
    enrich?: boolean;
    maxPages?: number;
  };
}

export interface ExportJobData {
  format: 'csv' | 'xlsx' | 'json';
  entity: 'companies' | 'jobs';
  filters?: string;
  userId: string;
}

export interface EnrichmentJobData {
  companyId: string;
  enrichType: 'ai' | 'website' | 'contact';
}

class QueueService {
  private scrapeQueue: Queue;
  private exportQueue: Queue;
  private enrichmentQueue: Queue;

  constructor() {
    // @ts-ignore - ioredis version mismatch between bullmq and project
    this.scrapeQueue = new Queue(SCRAPE_QUEUE_NAME, { connection: bullMQConnection });
    // @ts-ignore
    this.exportQueue = new Queue(EXPORT_QUEUE_NAME, { connection: bullMQConnection });
    // @ts-ignore
    this.enrichmentQueue = new Queue(ENRICHMENT_QUEUE_NAME, { connection: bullMQConnection });
  }

  async addScrapeJob(data: ScrapeJobData, priority = 5) {
    const job = await this.scrapeQueue.add(`scrape-${data.source}`, data, {
      priority,
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: { age: 3600 * 24 },
      removeOnFail: { age: 3600 * 24 * 7 },
    });
    logger.info('Scrape job added', { jobId: job.id, source: data.source });
    return job;
  }

  async addExportJob(data: ExportJobData) {
    const job = await this.exportQueue.add(`export-${data.format}`, data, {
      attempts: 2,
      backoff: { type: 'fixed', delay: 10000 },
    });
    logger.info('Export job added', { jobId: job.id, format: data.format });
    return job;
  }

  async addEnrichmentJob(data: EnrichmentJobData) {
    const job = await this.enrichmentQueue.add(`enrich-${data.enrichType}`, data, {
      priority: 3,
      attempts: 2,
      backoff: { type: 'exponential', delay: 10000 },
    });
    logger.info('Enrichment job added', { jobId: job.id, companyId: data.companyId });
    return job;
  }

  async getQueueStatus() {
    const [scrapeWaiting, scrapeActive, scrapeCompleted, scrapeFailed] = await Promise.all([
      this.scrapeQueue.getWaitingCount(),
      this.scrapeQueue.getActiveCount(),
      this.scrapeQueue.getCompletedCount(),
      this.scrapeQueue.getFailedCount(),
    ]);

    return {
      scrape: { waiting: scrapeWaiting, active: scrapeActive, completed: scrapeCompleted, failed: scrapeFailed },
    };
  }

  async cleanOldJobs() {
    await this.scrapeQueue.clean(24 * 3600 * 1000, 100, 'completed');
    await this.scrapeQueue.clean(7 * 24 * 3600 * 1000, 100, 'failed');
  }
}

export const queueService = new QueueService();
