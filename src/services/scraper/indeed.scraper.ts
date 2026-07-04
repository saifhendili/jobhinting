import { BaseScraper, ScrapeResult, ScrapedCompany, ScrapedJob } from './base.scraper';
import { logger } from '@/lib/logger';

export class IndeedScraper extends BaseScraper {
  constructor() {
    super({
      name: 'Indeed',
      baseUrl: 'https://www.indeed.com',
      useBrowser: true,
      rateLimitMs: 5000,
    });
  }

  async scrape(): Promise<ScrapeResult[]> {
    const results: ScrapeResult[] = [];
    
    try {
      const page = await this.initBrowser();
      
      // Search for remote jobs
      await page.goto(`${this.config.baseUrl}/jobs?q=remote&l=Remote&fromage=1`, {
        waitUntil: 'networkidle',
      });

      const jobs = await page.evaluate(() => {
        const jobCards = document.querySelectorAll('[data-testid="slider_item"]');
        return Array.from(jobCards).map(card => {
          const title = card.querySelector('h2 a')?.textContent?.trim() || '';
          const company = card.querySelector('[data-testid="company-name"]')?.textContent?.trim() || '';
          const location = card.querySelector('[data-testid="job-location"]')?.textContent?.trim() || '';
          const url = (card.querySelector('h2 a') as HTMLAnchorElement)?.href || '';
          const summary = card.querySelector('.job-snippet')?.textContent?.trim() || '';
          
          return { title, company, location, url, summary };
        }).filter(j => j.title && j.company);
      });

      const companyMap = new Map<string, { company: ScrapedCompany; jobs: ScrapedJob[] }>();

      for (const job of jobs) {
        const companyName = job.company;
        
        if (!companyMap.has(companyName)) {
          const company: ScrapedCompany = {
            name: companyName,
            remotePolicy: 'Remote',
          };
          companyMap.set(companyName, { company, jobs: [] });
        }

        companyMap.get(companyName)!.jobs.push({
          title: job.title,
          location: job.location,
          jobUrl: job.url,
          description: job.summary,
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

      logger.info(`Indeed scraped ${results.length} companies`);
    } catch (error) {
      logger.error('Indeed scraper error', { error: (error as Error).message });
      throw error;
    } finally {
      await this.closeBrowser();
    }

    return results;
  }
}
