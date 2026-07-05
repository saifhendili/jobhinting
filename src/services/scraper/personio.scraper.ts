import * as cheerio from 'cheerio';
import { BaseScraper, ScrapeResult, ScrapedCompany, ScrapedJob } from './base.scraper';
import { logger } from '@/lib/logger';

// Personio's public XML job feed: https://support.personio.de/hc/en-us/articles/207576365
// GET https://{company}.jobs.personio.com/xml?language=en
const PERSONIO_COMPANIES = ['personio'];

function mapEmploymentType(schedule: string, employmentType: string): string | undefined {
  const s = schedule.toLowerCase();
  const e = employmentType.toLowerCase();
  if (e.includes('intern')) return 'INTERNSHIP';
  if (s.includes('part')) return 'PART_TIME';
  if (e.includes('temporary') || e.includes('contract') || e.includes('freelance')) return 'CONTRACT';
  if (s.includes('full')) return 'FULL_TIME';
  return undefined;
}

function mapSeniority(seniority: string): string | undefined {
  const s = seniority.toLowerCase();
  if (s.includes('entry') || s.includes('no_professional')) return 'ENTRY';
  if (s.includes('senior')) return 'SENIOR';
  if (s.includes('executive') || s.includes('chief')) return 'EXECUTIVE';
  if (s.includes('management') || s.includes('lead')) return 'LEAD';
  if (s.includes('experienced') || s.includes('professional')) return 'MID';
  return undefined;
}

export class PersonioScraper extends BaseScraper {
  constructor() {
    super({
      name: 'Personio',
      baseUrl: 'https://personio.com',
      useBrowser: false,
      rateLimitMs: 2000,
    });
  }

  async scrape(): Promise<ScrapeResult[]> {
    const results: ScrapeResult[] = [];

    for (const company of PERSONIO_COMPANIES) {
      try {
        const xml = await this.fetchJson<string>(
          `https://${company}.jobs.personio.com/xml?language=en`,
          { headers: { Accept: 'application/xml, text/xml' }, transformResponse: (data) => data }
        );

        const $ = cheerio.load(xml, { xmlMode: true });
        const jobs: ScrapedJob[] = [];

        $('position').each((_, element) => {
          const $el = $(element);
          const id = $el.find('id').first().text().trim();
          const title = $el.find('name').first().text().trim();
          if (!id || !title) return;

          const offices = [
            $el.find('office').first().text().trim(),
            ...$el.find('additionalOffices > office').map((_, o) => $(o).text().trim()).get(),
          ].filter(Boolean);

          const description = $el
            .find('jobDescriptions > jobDescription')
            .map((_, d) => `<h4>${$(d).find('name').text().trim()}</h4>${$(d).find('value').text().trim()}`)
            .get()
            .join('');

          const schedule = $el.find('schedule').first().text().trim();
          const employmentType = $el.find('employmentType').first().text().trim();
          const seniority = $el.find('seniority').first().text().trim();
          const createdAt = $el.find('createdAt').first().text().trim();
          const location = offices.join(', ');

          jobs.push({
            title,
            department: $el.find('department').first().text().trim() || undefined,
            location,
            jobUrl: `https://${company}.jobs.personio.com/job/${id}?language=en`,
            description,
            employmentType: mapEmploymentType(schedule, employmentType) as ScrapedJob['employmentType'],
            experienceLevel: mapSeniority(seniority) as ScrapedJob['experienceLevel'],
            remoteStatus: location.toLowerCase().includes('remote') ? 'FULLY_REMOTE' : 'UNKNOWN',
            isWorldwideRemote: location.toLowerCase().includes('worldwide'),
            postedDate: createdAt ? new Date(createdAt) : undefined,
          });
        });

        if (jobs.length > 0) {
          const scrapedCompany: ScrapedCompany = {
            name: company,
            careersPage: `https://${company}.jobs.personio.com`,
          };
          results.push({ company: scrapedCompany, jobs, source: this.config.name, scrapedAt: new Date() });
        }
      } catch (err) {
        logger.warn(`Failed to scrape Personio company: ${company}`, { error: (err as Error).message });
      }
    }

    logger.info(`Personio scraped ${results.length} companies`);
    return results;
  }
}
