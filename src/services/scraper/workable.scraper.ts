import { BaseScraper, ScrapeResult, ScrapedCompany, ScrapedJob } from './base.scraper';
import { logger } from '@/lib/logger';

// Workable's public widget API (same endpoint their embeddable job widget uses):
// GET https://apply.workable.com/api/v1/widget/accounts/{slug}?details=true
const WORKABLE_ACCOUNTS = ['typeform', 'deliveroo', 'bolt', 'wolt', 'xero', 'canva'];

interface WorkableJob {
  id: string;
  title: string;
  department?: string;
  url: string;
  application_url: string;
  telecommuting?: boolean;
  employment_type?: string;
  published_on?: string;
  location?: {
    location_str?: string;
    country?: string;
    region?: string;
    city?: string;
  };
}

interface WorkableAccountResponse {
  name: string;
  description?: string;
  jobs: WorkableJob[];
}

const EMPLOYMENT_TYPE_MAP: Record<string, string> = {
  'full-time': 'FULL_TIME',
  'part-time': 'PART_TIME',
  contract: 'CONTRACT',
  temporary: 'CONTRACT',
  internship: 'INTERNSHIP',
};

export class WorkableScraper extends BaseScraper {
  constructor() {
    super({
      name: 'Workable',
      baseUrl: 'https://apply.workable.com',
      useBrowser: false,
      rateLimitMs: 2000,
    });
  }

  async scrape(): Promise<ScrapeResult[]> {
    const results: ScrapeResult[] = [];

    for (const account of WORKABLE_ACCOUNTS) {
      try {
        const response = await this.fetchJson<WorkableAccountResponse>(
          `${this.config.baseUrl}/api/v1/widget/accounts/${account}?details=true`
        );

        const company: ScrapedCompany = {
          name: response.name || account,
          description: response.description,
          careersPage: `${this.config.baseUrl}/${account}`,
        };

        const jobs: ScrapedJob[] = (response.jobs || []).map((job) => {
          const location = job.location?.location_str || '';
          const isRemoteHint =
            job.telecommuting === true || location.toLowerCase().includes('remote') || location.toLowerCase().includes('anywhere');

          return {
            title: job.title,
            department: job.department,
            location,
            jobUrl: job.url,
            applyUrl: job.application_url,
            employmentType: job.employment_type
              ? (EMPLOYMENT_TYPE_MAP[job.employment_type.toLowerCase()] as ScrapedJob['employmentType'])
              : undefined,
            remoteStatus: isRemoteHint ? 'FULLY_REMOTE' : 'UNKNOWN',
            isWorldwideRemote: location.toLowerCase().includes('worldwide'),
            postedDate: job.published_on ? new Date(job.published_on) : undefined,
          };
        });

        if (jobs.length > 0) {
          results.push({ company, jobs, source: this.config.name, scrapedAt: new Date() });
        }
      } catch (err) {
        logger.warn(`Failed to scrape Workable account: ${account}`, { error: (err as Error).message });
      }
    }

    logger.info(`Workable scraped ${results.length} companies`);
    return results;
  }
}
