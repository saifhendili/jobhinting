import { Worker } from 'bullmq';
import { createBullMQConnection } from '@/lib/redis';
import { logger } from '@/lib/logger';
import { getScraper } from '@/services/scraper/scraper.registry';
import { dataIngestionService } from '@/services/data-ingestion.service';
import { aiEnrichmentService } from '@/services/enrichment/ai-enrichment.service';
import { websiteAnalysisService } from '@/services/enrichment/website-analysis.service';
import { contactDiscoveryService } from '@/services/enrichment/contact-discovery.service';
import { exportService } from '@/services/export/export.service';
import { prisma } from '@/lib/prisma';

const bullMQConnection = createBullMQConnection();

const scrapeWorker = new Worker(
  'scrape-queue',
  async (job) => {
    const { source, options } = job.data;
    logger.info(`Processing scrape job: ${job.id} for ${source}`);

    const scraper = getScraper(source);
    if (!scraper) {
      throw new Error(`Unknown scraper: ${source}`);
    }

    const results = await scraper.run();
    const stats = await dataIngestionService.ingestScrapeResults(results, source);

    // Log scrape
    await prisma.scrapeLog.create({
      data: {
        source,
        status: 'completed',
        itemsFound: results.reduce((sum, r) => sum + r.jobs.length, 0),
        itemsAdded: stats.jobsAdded,
        itemsUpdated: stats.jobsUpdated,
        errors: [],
      },
    });

    // Optionally enrich
    if (options?.enrich) {
      for (const result of results) {
        const company = await prisma.company.findFirst({
          where: { name: result.company.name },
        });
        if (company) {
          await aiEnrichmentService.enrichCompany(company.id);
        }
      }
    }

    return { source, stats };
  },
  // @ts-ignore - ioredis version mismatch
  { connection: bullMQConnection }
);

const exportWorker = new Worker(
  'export-queue',
  async (job) => {
    const { format, entity, filters } = job.data;
    logger.info(`Processing export job: ${job.id}`);

    let result;
    if (entity === 'companies') {
      result = await exportService.exportCompanies(format, filters);
    } else {
      result = await exportService.exportJobs(format, filters);
    }

    await prisma.export.updateMany({
      where: { status: 'pending' },
      data: { status: 'completed', fileUrl: result.fileUrl, recordCount: result.recordCount },
    });

    return result;
  },
  // @ts-ignore
  { connection: bullMQConnection }
);

const enrichmentWorker = new Worker(
  'enrichment-queue',
  async (job) => {
    const { companyId, enrichType } = job.data;
    logger.info(`Processing enrichment job: ${job.id} for ${companyId}`);

    switch (enrichType) {
      case 'ai':
        await aiEnrichmentService.enrichCompany(companyId);
        break;
      case 'website':
        await websiteAnalysisService.analyzeWebsite(companyId);
        break;
      case 'contact':
        await contactDiscoveryService.discoverContacts(companyId);
        break;
      default:
        throw new Error(`Unknown enrichment type: ${enrichType}`);
    }

    return { companyId, enrichType };
  },
  // @ts-ignore
  { connection: bullMQConnection }
);

scrapeWorker.on('completed', (job) => {
  logger.info(`Scrape job completed: ${job.id}`);
});

scrapeWorker.on('failed', (job, err) => {
  logger.error(`Scrape job failed: ${job?.id}`, { error: err.message });
  if (job) {
    prisma.scrapeLog.create({
      data: {
        source: job.data.source,
        status: 'failed',
        errors: [err.message],
      },
    }).catch(() => {});
  }
});

exportWorker.on('completed', (job) => {
  logger.info(`Export job completed: ${job.id}`);
});

enrichmentWorker.on('completed', (job) => {
  logger.info(`Enrichment job completed: ${job.id}`);
});

logger.info('Workers started');
