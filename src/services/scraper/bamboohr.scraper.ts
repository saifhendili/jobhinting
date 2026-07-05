import { BaseScraper, ScrapeResult, ScrapedCompany, ScrapedJob } from './base.scraper';
import { logger } from '@/lib/logger';

// BambooHR's public careers list endpoint (used by their own careers widget):
// GET https://{company}.bamboohr.com/careers/list
const BAMBOOHR_COMPANIES = ['altuspower', 'aircall'];

interface BambooHRJob {
  id: string;
  jobOpeningName: string;
  departmentLabel?: string;
  employmentStatusLabel?: string;
  location?: { city?: string | null; state?: string | null };
  atsLocation?: { country?: string | null; state?: string | null; city?: string | null };
}

interface BambooHRCareersListResponse {
  result: BambooHRJob[];
}

const EMPLOYMENT_TYPE_MAP: Record<string, string> = {
  'full time': 'FULL_TIME',
  'part time': 'PART_TIME',
  contract: 'CONTRACT',
  temporary: 'CONTRACT',
  intern: 'INTERNSHIP',
  internship: 'INTERNSHIP',
};

export class BambooHRScraper extends BaseScraper {
  constructor() {
    super({
      name: 'BambooHR',
      baseUrl: 'https://bamboohr.com',
      useBrowser: false,
      rateLimitMs: 2000,
    });
  }

  async scrape(): Promise<ScrapeResult[]> {
    const results: ScrapeResult[] = [];

    for (const company of BAMBOOHR_COMPANIES) {
      try {
        const response = await this.fetchJson<BambooHRCareersListResponse>(
          `https://${company}.bamboohr.com/careers/list`
        );

        const jobs: ScrapedJob[] = (response.result || []).map((job) => {
          const location = [
            job.atsLocation?.city || job.location?.city,
            job.atsLocation?.state || job.location?.state,
            job.atsLocation?.country,
          ]
            .filter(Boolean)
            .join(', ');

          return {
            title: job.jobOpeningName,
            department: job.departmentLabel,
            location,
            jobUrl: `https://${company}.bamboohr.com/careers/${job.id}`,
            employmentType: job.employmentStatusLabel
              ? (EMPLOYMENT_TYPE_MAP[job.employmentStatusLabel.toLowerCase()] as ScrapedJob['employmentType'])
              : undefined,
            remoteStatus: location.toLowerCase().includes('remote') ? 'FULLY_REMOTE' : 'UNKNOWN',
            isWorldwideRemote: location.toLowerCase().includes('worldwide'),
          };
        });

        if (jobs.length > 0) {
          const scrapedCompany: ScrapedCompany = {
            name: company,
            careersPage: `https://${company}.bamboohr.com/careers`,
          };
          results.push({ company: scrapedCompany, jobs, source: this.config.name, scrapedAt: new Date() });
        }
      } catch (err) {
        logger.warn(`Failed to scrape BambooHR company: ${company}`, { error: (err as Error).message });
      }
    }

    logger.info(`BambooHR scraped ${results.length} companies`);
    return results;
  }
}
