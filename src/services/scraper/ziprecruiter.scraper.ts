import { BaseScraper, ScrapeResult, ScrapedCompany, ScrapedJob } from './base.scraper';
import { logger } from '@/lib/logger';

export class ZipRecruiterScraper extends BaseScraper {
  constructor() {
    super({
      name: 'ZipRecruiter',
      baseUrl: 'https://www.ziprecruiter.com',
      useBrowser: false,
      rateLimitMs: 3000,
    });
  }

  async scrape(): Promise<ScrapeResult[]> {
    const results: ScrapeResult[] = [];
    
    try {
      const $ = await this.fetchHtml(`${this.config.baseUrl}/jobs/search?search=remote&location=`);
      
      const companyMap = new Map<string, { company: ScrapedCompany; jobs: ScrapedJob[] }>();

      $('.job_content').each((_, element) => {
        const $el = $(element);
        const title = $el.find('.job_title').text().trim();
        const companyName = $el.find('.company_name').text().trim() || 'Unknown';
        const location = $el.find('.location').text().trim();
        const jobUrl = $el.find('a').attr('href');
        const summary = $el.find('.job_snippet').text().trim();

        if (!title) return;

        if (!companyMap.has(companyName)) {
          const company: ScrapedCompany = {
            name: companyName,
            remotePolicy: 'Remote',
          };
          companyMap.set(companyName, { company, jobs: [] });
        }

        const job: ScrapedJob = {
          title,
          location,
          jobUrl: jobUrl || '',
          description: summary,
          remoteStatus: 'FULLY_REMOTE',
          isWorldwideRemote: location?.toLowerCase().includes('worldwide') || false,
        };

        companyMap.get(companyName)!.jobs.push(job);
      });

      for (const [, value] of Array.from(companyMap.entries())) {
        results.push({
          company: value.company,
          jobs: value.jobs,
          source: this.config.name,
          scrapedAt: new Date(),
        });
      }

      logger.info(`ZipRecruiter scraped ${results.length} companies`);
    } catch (error) {
      logger.error('ZipRecruiter scraper error', { error: (error as Error).message });
      throw error;
    }

    return results;
  }
}
