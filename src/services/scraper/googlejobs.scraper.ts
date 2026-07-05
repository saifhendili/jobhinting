import { BaseScraper, ScrapeResult, ScrapedCompany, ScrapedJob } from './base.scraper';
import { logger } from '@/lib/logger';

export class GoogleJobsScraper extends BaseScraper {
  constructor() {
    super({
      name: 'GoogleJobs',
      baseUrl: 'https://www.google.com',
      useBrowser: true,
      rateLimitMs: 5000,
    });
  }

  async scrape(): Promise<ScrapeResult[]> {
    const results: ScrapeResult[] = [];
    
    try {
      const page = await this.initBrowser();
      
      // Search for worldwide remote jobs via Google
      await page.goto(
        `${this.config.baseUrl}/search?q=remote+worldwide+software+engineer+jobs&ibp=htl;jobs`,
        { waitUntil: 'networkidle' }
      );

      const jobs = await page.evaluate(() => {
        const cards = document.querySelectorAll('[data-ved]');
        const results: any[] = [];
        
        cards.forEach(card => {
          const title = card.querySelector('[role="heading"]')?.textContent?.trim();
          const company = card.querySelector('.vNEEBe')?.textContent?.trim();
          const location = card.querySelector('.Qk3sp')?.textContent?.trim();
          
          if (title && company) {
            results.push({ title, company, location });
          }
        });
        
        return results;
      });

      const companyMap = new Map<string, { company: ScrapedCompany; jobs: ScrapedJob[] }>();

      for (const job of jobs) {
        const companyName = job.company;
        
        if (!companyMap.has(companyName)) {
          const company: ScrapedCompany = { name: companyName };
          companyMap.set(companyName, { company, jobs: [] });
        }

        companyMap.get(companyName)!.jobs.push({
          title: job.title,
          location: job.location,
          jobUrl: job.url || '',
          remoteStatus: 'FULLY_REMOTE',
          isWorldwideRemote: job.location?.toLowerCase().includes('worldwide') || false,
        });
      }

      for (const [, value] of Array.from(companyMap.entries())) {
        results.push({
          company: value.company,
          jobs: value.jobs,
          source: this.config.name,
          scrapedAt: new Date(),
        });
      }

      logger.info(`GoogleJobs scraped ${results.length} companies`);
    } catch (error) {
      logger.error('GoogleJobs scraper error', { error: (error as Error).message });
      throw error;
    } finally {
      await this.closeBrowser();
    }

    return results;
  }
}
