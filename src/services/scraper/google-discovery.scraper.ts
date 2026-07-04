import { BaseScraper, ScrapeResult, ScrapedCompany, ScrapedJob } from './base.scraper';
import { logger } from '@/lib/logger';

export class GoogleDiscoveryScraper extends BaseScraper {
  constructor() {
    super({
      name: 'GoogleDiscovery',
      baseUrl: 'https://www.google.com',
      useBrowser: true,
      rateLimitMs: 5000,
      maxPages: 5,
    });
  }

  private readonly discoveryQueries = [
    'site:boards.greenhouse.io remote',
    'site:jobs.lever.co remote',
    'site:jobs.ashbyhq.com remote',
    'site:apply.workable.com remote',
    'site:careers.teamtailor.com remote',
    'site:jobs.smartrecruiters.com remote',
    'site:workdayjobs.com remote',
    'site:boards.greenhouse.io "software engineer" remote',
    'site:jobs.lever.co "product manager" remote',
    'site:jobs.ashbyhq.com "designer" remote',
  ];

  async scrape(): Promise<ScrapeResult[]> {
    const results: ScrapeResult[] = [];
    
    try {
      const page = await this.initBrowser();
      
      for (const query of this.discoveryQueries.slice(0, this.config.maxPages)) {
        try {
          await page.goto(
            `${this.config.baseUrl}/search?q=${encodeURIComponent(query)}`,
            { waitUntil: 'networkidle' }
          );

          // Check for CAPTCHA
          const hasCaptcha = await page.evaluate(() => {
            return document.body.innerText.toLowerCase().includes('captcha') ||
                   document.body.innerText.toLowerCase().includes('unusual traffic');
          });

          if (hasCaptcha) {
            logger.warn('Google CAPTCHA detected, stopping discovery');
            break;
          }

          const links = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('a'))
              .map(a => ({
                href: a.href,
                text: a.textContent?.trim() || '',
              }))
              .filter(link => 
                link.href.includes('greenhouse.io') ||
                link.href.includes('lever.co') ||
                link.href.includes('ashbyhq.com') ||
                link.href.includes('workable.com') ||
                link.href.includes('teamtailor.com') ||
                link.href.includes('smartrecruiters.com') ||
                link.href.includes('workdayjobs.com')
              );
          });

          const companyMap = new Map<string, { company: ScrapedCompany; jobs: ScrapedJob[] }>();

          for (const link of links.slice(0, 10)) {
            try {
              // Extract company name from URL
              const url = new URL(link.href);
              const pathParts = url.pathname.split('/').filter(Boolean);
              const companyName = pathParts[0] || 'Unknown';
              
              if (!companyMap.has(companyName)) {
                const company: ScrapedCompany = {
                  name: companyName.charAt(0).toUpperCase() + companyName.slice(1),
                  careersPage: `${url.protocol}//${url.host}/${companyName}`,
                };
                companyMap.set(companyName, { company, jobs: [] });
              }

              companyMap.get(companyName)!.jobs.push({
                title: link.text || 'Unknown Position',
                jobUrl: link.href,
                remoteStatus: 'FULLY_REMOTE',
              });
            } catch {
              // Skip invalid URLs
            }
          }

          for (const [, value] of Array.from(companyMap.entries())) {
            if (value.jobs.length > 0) {
              results.push({
                company: value.company,
                jobs: value.jobs,
                source: this.config.name,
                scrapedAt: new Date(),
              });
            }
          }

          await this.delay(2000);
        } catch (err) {
          logger.warn(`Failed to search query: ${query}`, { error: (err as Error).message });
        }
      }

      logger.info(`GoogleDiscovery found ${results.length} companies`);
    } catch (error) {
      logger.error('GoogleDiscovery scraper error', { error: (error as Error).message });
      throw error;
    } finally {
      await this.closeBrowser();
    }

    return results;
  }
}
