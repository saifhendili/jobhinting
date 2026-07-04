import { BaseScraper, ScrapeResult, ScrapedCompany, ScrapedJob } from './base.scraper';
import { logger } from '@/lib/logger';

export class JobspressoScraper extends BaseScraper {
  constructor() {
    super({
      name: 'Jobspresso',
      baseUrl: 'https://jobspresso.co',
      useBrowser: false,
      rateLimitMs: 2000,
    });
  }

  async scrape(): Promise<ScrapeResult[]> {
    const results: ScrapeResult[] = [];
    
    try {
      const $ = await this.fetchHtml(`${this.config.baseUrl}/remote-jobs/`);
      
      const companyMap = new Map<string, { company: ScrapedCompany; jobs: ScrapedJob[] }>();

      $('.job-listing').each((_, element) => {
        const $el = $(element);
        const title = $el.find('.job-title').text().trim();
        const companyName = $el.find('.company-name').text().trim() || 'Unknown';
        const location = $el.find('.job-location').text().trim();
        const jobUrl = $el.find('a').attr('href');
        const tags = $el.find('.job-tag').map((_, tag) => $(tag).text().trim()).get();

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
          jobUrl: jobUrl ? (jobUrl.startsWith('http') ? jobUrl : `${this.config.baseUrl}${jobUrl}`) : '',
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

      logger.info(`Jobspresso scraped ${results.length} companies`);
    } catch (error) {
      logger.error('Jobspresso scraper error', { error: (error as Error).message });
      throw error;
    }

    return results;
  }
}
