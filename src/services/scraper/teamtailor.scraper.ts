import * as cheerio from 'cheerio';
import { BaseScraper, ScrapeResult, ScrapedCompany, ScrapedJob } from './base.scraper';
import { logger } from '@/lib/logger';

// Teamtailor's public jobs RSS feed: https://support.teamtailor.com/en/articles/5963369-use-our-teamtailor-api
// GET https://{subdomain}.teamtailor.com/jobs.rss
const TEAMTAILOR_BOARDS = ['career', 'clunetech-fintua', 'thestudio.na'];

export class TeamtailorScraper extends BaseScraper {
  constructor() {
    super({
      name: 'Teamtailor',
      baseUrl: 'https://teamtailor.com',
      useBrowser: false,
      rateLimitMs: 2000,
    });
  }

  async scrape(): Promise<ScrapeResult[]> {
    const results: ScrapeResult[] = [];

    for (const board of TEAMTAILOR_BOARDS) {
      try {
        const rss = await this.fetchJson<string>(`https://${board}.teamtailor.com/jobs.rss`, {
          headers: { Accept: 'application/rss+xml, text/xml' },
          transformResponse: (data) => data,
        });

        const $ = cheerio.load(rss, { xmlMode: true });
        const companyName = $('channel > title').first().text().trim() || board;

        const jobs: ScrapedJob[] = [];

        $('item').each((_, element) => {
          const $el = $(element);
          const title = $el.find('title').first().text().trim();
          const link = $el.find('link').first().text().trim();
          const pubDate = $el.find('pubDate').first().text().trim();
          const department = $el.find('tt\\:department').first().text().trim();
          const city = $el.find('tt\\:city').first().text().trim();
          const country = $el.find('tt\\:country').first().text().trim();

          if (!title || !link) return;

          const location = [city, country].filter(Boolean).join(', ');

          jobs.push({
            title,
            department: department || undefined,
            location,
            jobUrl: link,
            description: $el.find('description').first().text().trim(),
            remoteStatus: location.toLowerCase().includes('remote') ? 'FULLY_REMOTE' : 'UNKNOWN',
            isWorldwideRemote: location.toLowerCase().includes('worldwide'),
            postedDate: pubDate ? new Date(pubDate) : undefined,
          });
        });

        if (jobs.length > 0) {
          const company: ScrapedCompany = {
            name: companyName,
            careersPage: `https://${board}.teamtailor.com/jobs`,
          };
          results.push({ company, jobs, source: this.config.name, scrapedAt: new Date() });
        }
      } catch (err) {
        logger.warn(`Failed to scrape Teamtailor board: ${board}`, { error: (err as Error).message });
      }
    }

    logger.info(`Teamtailor scraped ${results.length} companies`);
    return results;
  }
}
