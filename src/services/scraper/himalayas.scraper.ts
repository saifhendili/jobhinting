import { BaseScraper, ScrapeResult, ScrapedCompany, ScrapedJob } from './base.scraper';
import { logger } from '@/lib/logger';

// Himalayas' current public API: https://himalayas.app/docs/remote-jobs-api
// (the old /api/jobs endpoint used previously here no longer exists)
const HIMALAYAS_PAGE_LIMIT = 20;

interface HimalayasLocation {
  alpha2: string;
  name: string;
  slug: string;
}

interface HimalayasJob {
  title: string;
  excerpt: string;
  companyName: string;
  companySlug: string;
  companyLogo: string;
  employmentType: 'Full Time' | 'Part Time' | 'Contractor' | 'Temporary' | 'Intern' | 'Volunteer' | 'Other';
  minSalary: number | null;
  maxSalary: number | null;
  salaryPeriod: string;
  currency: string | null;
  seniority: string[];
  locationRestrictions: HimalayasLocation[];
  categories: string[];
  description: string;
  pubDate: number;
  applicationLink: string;
  guid: string;
}

interface HimalayasSearchResponse {
  offset: number;
  limit: number;
  totalCount: number;
  jobs: HimalayasJob[];
}

const EMPLOYMENT_TYPE_MAP: Record<string, string> = {
  'Full Time': 'FULL_TIME',
  'Part Time': 'PART_TIME',
  'Contractor': 'CONTRACT',
  'Temporary': 'CONTRACT',
  'Intern': 'INTERNSHIP',
};

const SENIORITY_MAP: Record<string, string> = {
  'Entry-level': 'ENTRY',
  'Mid-level': 'MID',
  'Senior': 'SENIOR',
  'Manager': 'LEAD',
  'Director': 'LEAD',
  'Executive': 'EXECUTIVE',
};

export class HimalayasScraper extends BaseScraper {
  constructor() {
    super({
      name: 'Himalayas',
      baseUrl: 'https://himalayas.app',
      useBrowser: false,
      rateLimitMs: 2000,
    });
  }

  async scrape(): Promise<ScrapeResult[]> {
    const companyMap = new Map<string, { company: ScrapedCompany; jobs: ScrapedJob[] }>();

    try {
      const maxPages = this.config.maxPages || 10;

      for (let page = 1; page <= maxPages; page++) {
        const response = await this.fetchJson<HimalayasSearchResponse>(
          `${this.config.baseUrl}/jobs/api/search?worldwide=true&limit=${HIMALAYAS_PAGE_LIMIT}&page=${page}`
        );

        for (const job of response.jobs) {
          const companyName = job.companyName?.trim() || 'Unknown';

          if (!companyMap.has(companyName)) {
            const company: ScrapedCompany = {
              name: companyName,
              logo: job.companyLogo,
              careersPage: `${this.config.baseUrl}/companies/${job.companySlug}`,
              remotePolicy: 'Fully Remote',
            };
            companyMap.set(companyName, { company, jobs: [] });
          }

          companyMap.get(companyName)!.jobs.push({
            title: job.title,
            location: job.locationRestrictions.length > 0
              ? job.locationRestrictions.map((l) => l.name).join(', ')
              : 'Worldwide',
            jobUrl: job.applicationLink,
            applyUrl: job.applicationLink,
            description: job.description || job.excerpt,
            technologies: job.categories || [],
            requiredSkills: job.categories || [],
            salaryMin: job.minSalary ?? undefined,
            salaryMax: job.maxSalary ?? undefined,
            currency: job.currency ?? undefined,
            experienceLevel: SENIORITY_MAP[job.seniority?.[0]] as ScrapedJob['experienceLevel'],
            employmentType: EMPLOYMENT_TYPE_MAP[job.employmentType] as ScrapedJob['employmentType'],
            remoteStatus: 'FULLY_REMOTE',
            isWorldwideRemote: job.locationRestrictions.length === 0,
            postedDate: job.pubDate ? new Date(job.pubDate) : undefined,
          });
        }

        if (response.offset + response.jobs.length >= response.totalCount || response.jobs.length === 0) {
          break;
        }
      }

      const results: ScrapeResult[] = Array.from(companyMap.values()).map((value) => ({
        company: value.company,
        jobs: value.jobs,
        source: this.config.name,
        scrapedAt: new Date(),
      }));

      logger.info(`Himalayas scraped ${results.length} companies`);
      return results;
    } catch (error) {
      logger.error('Himalayas scraper error', { error: (error as Error).message });
      throw error;
    }
  }
}
