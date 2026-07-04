import { BaseScraper, ScrapeResult, ScrapedCompany, ScrapedJob } from './base.scraper';
import { logger } from '@/lib/logger';

export class LinkedInScraper extends BaseScraper {
  constructor() {
    super({
      name: 'LinkedIn',
      baseUrl: 'https://www.linkedin.com',
      useBrowser: true,
      rateLimitMs: 8000,
    });
  }

  async scrape(): Promise<ScrapeResult[]> {
    const results: ScrapeResult[] = [];
    
    try {
      const page = await this.initBrowser();
      
      // Respect LinkedIn's ToS - this is a simplified example
      // In production, use LinkedIn's official API or Sales Navigator
      await page.goto(`${this.config.baseUrl}/jobs/search?keywords=remote&location=Worldwide&f_WT=2`, {
        waitUntil: 'networkidle',
      });

      // Check for CAPTCHA
      const hasCaptcha = await page.evaluate(() => {
        return document.body.innerText.toLowerCase().includes('captcha') ||
               document.body.innerText.toLowerCase().includes('security check');
      });

      if (hasCaptcha) {
        logger.warn('LinkedIn CAPTCHA detected - stopping scrape');
        await this.closeBrowser();
        return results;
      }

      const jobs = await page.evaluate(() => {
        const cards = document.querySelectorAll('.job-card-container');
        return Array.from(cards).map(card => {
          const title = card.querySelector('.job-card-list__title')?.textContent?.trim() || '';
          const company = card.querySelector('.job-card-container__company-name')?.textContent?.trim() || '';
          const location = card.querySelector('.job-card-container__metadata-item')?.textContent?.trim() || '';
          const url = (card.querySelector('a') as HTMLAnchorElement)?.href || '';
          
          return { title, company, location, url };
        }).filter(j => j.title && j.company);
      });

      const companyMap = new Map<string, { company: ScrapedCompany; jobs: ScrapedJob[] }>();

      for (const job of jobs) {
        const companyName = job.company;
        
        if (!companyMap.has(companyName)) {
          const company: ScrapedCompany = {
            name: companyName,
            linkedIn: `${this.config.baseUrl}/company/${companyName.toLowerCase().replace(/\s+/g, '-')}`,
          };
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

      logger.info(`LinkedIn scraped ${results.length} companies`);
    } catch (error) {
      logger.error('LinkedIn scraper error', { error: (error as Error).message });
      throw error;
    } finally {
      await this.closeBrowser();
    }

    return results;
  }
}
