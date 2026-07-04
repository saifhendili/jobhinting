import { BaseScraper, ScrapeResult, ScrapedCompany, ScrapedJob } from './base.scraper';
import { logger } from '@/lib/logger';

export class WeWorkRemotelyScraper extends BaseScraper {
  constructor() {
    super({
      name: 'WeWorkRemotely',
      baseUrl: 'https://weworkremotely.com',
      useBrowser: false,
      rateLimitMs: 2000,
    });
  }

  async scrape(): Promise<ScrapeResult[]> {
    const results: ScrapeResult[] = [];
    
    try {
      const $ = await this.fetchHtml(`${this.config.baseUrl}/remote-jobs/search?term=&button=`);
      
      const companyMap = new Map<string, { company: ScrapedCompany; jobs: ScrapedJob[] }>();

      $('.job').each((_, element) => {
        const $el = $(element);
        const companyName = $el.find('.company').text().trim() || 'Unknown';
        const title = $el.find('.title').text().trim();
        const location = $el.find('.location').text().trim();
        const jobUrl = $el.find('a').attr('href');
        const tags = $el.find('.tag').map((_, tag) => $(tag).text().trim()).get();

        if (!title) return;

        if (!companyMap.has(companyName)) {
          const company: ScrapedCompany = {
            name: companyName,
            remotePolicy: 'Fully Remote',
          };
          companyMap.set(companyName, { company, jobs: [] });
        }

        const job: ScrapedJob = {
          title,
          location,
          jobUrl: jobUrl ? `${this.config.baseUrl}${jobUrl}` : '',
          description: $el.find('.description').text().trim().substring(0, 500),
          technologies: tags,
          requiredSkills: tags,
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

      logger.info(`WeWorkRemotely scraped ${results.length} companies`);
    } catch (error) {
      logger.error('WeWorkRemotely scraper error', { error: (error as Error).message });
      throw error;
    }

    return results;
  }
}
