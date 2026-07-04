import { BaseScraper, ScrapeResult, ScrapedCompany, ScrapedJob } from './base.scraper';
import { logger } from '@/lib/logger';

export class GlassdoorScraper extends BaseScraper {
  constructor() {
    super({
      name: 'Glassdoor',
      baseUrl: 'https://www.glassdoor.com',
      useBrowser: true,
      rateLimitMs: 5000,
    });
  }

  async scrape(): Promise<ScrapeResult[]> {
    const results: ScrapeResult[] = [];
    
    try {
      const page = await this.initBrowser();
      
      // Respect Glassdoor's ToS
      await page.goto(
        `${this.config.baseUrl}/Job/remote-jobs-SRCH_IL.0,6_ISKT0.htm`,
        { waitUntil: 'networkidle' }
      );

      // Check for CAPTCHA
      const hasCaptcha = await page.evaluate(() => {
        return document.body.innerText.toLowerCase().includes('captcha') ||
               document.body.innerText.toLowerCase().includes('security check');
      });

      if (hasCaptcha) {
        logger.warn('Glassdoor CAPTCHA detected - stopping scrape');
        await this.closeBrowser();
        return results;
      }

      const jobs = await page.evaluate(() => {
        const cards = document.querySelectorAll('[data-test="jobListing"]');
        return Array.from(cards).map(card => {
          const title = card.querySelector('.jobTitle')?.textContent?.trim() || '';
          const company = card.querySelector('.employerName')?.textContent?.trim() || '';
          const location = card.querySelector('.location')?.textContent?.trim() || '';
          const url = (card.querySelector('a') as HTMLAnchorElement)?.href || '';
          
          return { title, company, location, url };
        }).filter(j => j.title && j.company);
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
          jobUrl: job.url,
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

      logger.info(`Glassdoor scraped ${results.length} companies`);
    } catch (error) {
      logger.error('Glassdoor scraper error', { error: (error as Error).message });
      throw error;
    } finally {
      await this.closeBrowser();
    }

    return results;
  }
}
