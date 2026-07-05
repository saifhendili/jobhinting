import { BaseScraper, ScrapeResult, ScrapedCompany, ScrapedJob } from './base.scraper';
import { logger } from '@/lib/logger';

// Ashby's public job board API: https://developers.ashbyhq.com/docs/public-job-posting-api
// GET https://api.ashbyhq.com/posting-api/job-board/{slug}
const ASHBY_BOARDS = ['openai', 'ramp', 'linear', 'notion', 'vanta', 'mercury', 'substack'];

interface AshbyJob {
  id: string;
  title: string;
  department?: string;
  team?: string;
  location: string;
  secondaryLocations?: { location: string }[];
  isListed?: boolean;
  employmentType: 'FullTime' | 'PartTime' | 'Intern' | 'Contract' | 'Temporary';
  isRemote: boolean;
  workplaceType?: 'Remote' | 'Hybrid' | 'OnSite';
  descriptionHtml?: string;
  descriptionPlain?: string;
  publishedAt?: string;
  jobUrl: string;
  applyUrl: string;
}

interface AshbyJobBoardResponse {
  jobs: AshbyJob[];
}

const EMPLOYMENT_TYPE_MAP: Record<string, string> = {
  FullTime: 'FULL_TIME',
  PartTime: 'PART_TIME',
  Intern: 'INTERNSHIP',
  Contract: 'CONTRACT',
  Temporary: 'CONTRACT',
};

export class AshbyScraper extends BaseScraper {
  constructor() {
    super({
      name: 'Ashby',
      baseUrl: 'https://api.ashbyhq.com',
      useBrowser: false,
      rateLimitMs: 2000,
    });
  }

  async scrape(): Promise<ScrapeResult[]> {
    const results: ScrapeResult[] = [];

    for (const board of ASHBY_BOARDS) {
      try {
        const response = await this.fetchJson<AshbyJobBoardResponse>(
          `${this.config.baseUrl}/posting-api/job-board/${board}`
        );

        const company: ScrapedCompany = {
          name: board.charAt(0).toUpperCase() + board.slice(1),
          careersPage: `https://jobs.ashbyhq.com/${board}`,
        };

        const jobs: ScrapedJob[] = response.jobs
          .filter((job) => job.isListed !== false)
          .map((job) => {
            const location = [job.location, ...(job.secondaryLocations || []).map((l) => l.location)]
              .filter(Boolean)
              .join(', ');

            return {
              title: job.title,
              department: job.department || job.team,
              location,
              jobUrl: job.jobUrl,
              applyUrl: job.applyUrl,
              description: job.descriptionHtml || job.descriptionPlain,
              employmentType: EMPLOYMENT_TYPE_MAP[job.employmentType] as ScrapedJob['employmentType'],
              remoteStatus:
                job.workplaceType === 'Remote'
                  ? 'FULLY_REMOTE'
                  : job.workplaceType === 'Hybrid'
                    ? 'HYBRID'
                    : job.workplaceType === 'OnSite'
                      ? 'ON_SITE'
                      : job.isRemote
                        ? 'FULLY_REMOTE'
                        : 'UNKNOWN',
              isWorldwideRemote: location.toLowerCase().includes('worldwide'),
              postedDate: job.publishedAt ? new Date(job.publishedAt) : undefined,
            } as ScrapedJob;
          });

        if (jobs.length > 0) {
          results.push({ company, jobs, source: this.config.name, scrapedAt: new Date() });
        }
      } catch (err) {
        logger.warn(`Failed to scrape Ashby board: ${board}`, { error: (err as Error).message });
      }
    }

    logger.info(`Ashby scraped ${results.length} companies`);
    return results;
  }
}
