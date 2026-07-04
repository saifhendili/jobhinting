import { BaseScraper, ScrapeResult, ScrapedCompany, ScrapedJob } from './base.scraper';
import { logger } from '@/lib/logger';

export class LeverScraper extends BaseScraper {
  constructor() {
    super({
      name: 'Lever',
      baseUrl: 'https://jobs.lever.co',
      useBrowser: false,
      rateLimitMs: 3000,
    });
  }

  async scrape(): Promise<ScrapeResult[]> {
    const results: ScrapeResult[] = [];
    
    try {
      // Scrape multiple Lever boards
      const boards = [
        'netflix', 'spotify', 'netlify', 'auth0', 'segment',
        'twilio', 'datadog', 'mongodb', 'confluent', 'databricks',
      ];

      for (const board of boards) {
        try {
          const $ = await this.fetchHtml(`${this.config.baseUrl}/${board}`);
          
          const companyName = $('.company-name').text().trim() || board;
          const company: ScrapedCompany = {
            name: companyName,
            careersPage: `${this.config.baseUrl}/${board}`,
          };

          const jobs: ScrapedJob[] = [];

          $('.posting').each((_, element) => {
            const $el = $(element);
            const title = $el.find('h5').text().trim();
            const jobUrl = $el.find('a').attr('href');
            const location = $el.find('.sort-by-location').text().trim();
            const team = $el.find('.sort-by-team').text().trim();
            const workType = $el.find('.work-type').text().trim();

            if (!title) return;

            jobs.push({
              title,
              department: team,
              location,
              jobUrl: jobUrl || '',
              remoteStatus: workType?.toLowerCase().includes('remote') ? 'FULLY_REMOTE' : 'HYBRID',
              isWorldwideRemote: location?.toLowerCase().includes('worldwide') || false,
            });
          });

          if (jobs.length > 0) {
            results.push({
              company,
              jobs,
              source: this.config.name,
              scrapedAt: new Date(),
            });
          }
        } catch (err) {
          logger.warn(`Failed to scrape Lever board: ${board}`, { error: (err as Error).message });
        }
      }

      logger.info(`Lever scraped ${results.length} companies`);
    } catch (error) {
      logger.error('Lever scraper error', { error: (error as Error).message });
      throw error;
    }

    return results;
  }
}
