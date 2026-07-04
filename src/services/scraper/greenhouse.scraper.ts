import { BaseScraper, ScrapeResult, ScrapedCompany, ScrapedJob } from './base.scraper';
import { logger } from '@/lib/logger';

export class GreenhouseScraper extends BaseScraper {
  constructor() {
    super({
      name: 'Greenhouse',
      baseUrl: 'https://boards.greenhouse.io',
      useBrowser: false,
      rateLimitMs: 3000,
    });
  }

  async scrape(): Promise<ScrapeResult[]> {
    const results: ScrapeResult[] = [];
    
    try {
      // Scrape multiple Greenhouse boards
      const boards = [
        'stripe', 'airbnb', 'dropbox', 'slack', 'notion',
        'figma', 'linear', 'vercel', 'supabase', 'planetscale',
      ];

      for (const board of boards) {
        try {
          const $ = await this.fetchHtml(`${this.config.baseUrl}/${board}`);
          
          const companyName = $('.app-name').text().trim() || board;
          const company: ScrapedCompany = {
            name: companyName,
            careersPage: `${this.config.baseUrl}/${board}`,
          };

          const jobs: ScrapedJob[] = [];

          $('.opening').each((_, element) => {
            const $el = $(element);
            const title = $el.find('a').text().trim();
            const jobUrl = $el.find('a').attr('href');
            const location = $el.find('.location').text().trim();
            const department = $el.closest('.department').find('h3').text().trim();

            if (!title) return;

            jobs.push({
              title,
              department,
              location,
              jobUrl: jobUrl ? (jobUrl.startsWith('http') ? jobUrl : `${this.config.baseUrl}${jobUrl}`) : '',
              remoteStatus: location?.toLowerCase().includes('remote') ? 'FULLY_REMOTE' : 'HYBRID',
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
          logger.warn(`Failed to scrape Greenhouse board: ${board}`, { error: (err as Error).message });
        }
      }

      logger.info(`Greenhouse scraped ${results.length} companies`);
    } catch (error) {
      logger.error('Greenhouse scraper error', { error: (error as Error).message });
      throw error;
    }

    return results;
  }
}
